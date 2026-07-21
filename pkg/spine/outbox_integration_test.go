//go:build integration

package spine_test

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"testing"
	"time"

	"github.com/gt100k/platform/pkg/platform"
	"github.com/gt100k/platform/pkg/spine"
	"github.com/gt100k/platform/pkg/spine/memory"
	spinepg "github.com/gt100k/platform/pkg/spine/pg"
	spineredpanda "github.com/gt100k/platform/pkg/spine/redpanda"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	tcredpanda "github.com/testcontainers/testcontainers-go/modules/redpanda"
	"google.golang.org/protobuf/proto"
)

func TestPostgresAdaptersAreAtomicAppendOnlyAndReplayable(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	postgresContainer, err := tcpostgres.Run(
		ctx,
		"postgres:16-alpine",
		tcpostgres.WithDatabase("spine"),
		tcpostgres.WithUsername("spine"),
		tcpostgres.WithPassword("spine_test"),
		tcpostgres.WithInitScripts(filepath.Join("pg", "schema.sql")),
		tcpostgres.BasicWaitStrategies(),
	)
	if err != nil {
		t.Fatalf("start PostgreSQL container: %v", err)
	}
	t.Cleanup(func() {
		if err := testcontainers.TerminateContainer(postgresContainer); err != nil {
			t.Errorf("terminate PostgreSQL container: %v", err)
		}
	})

	connectionString, err := postgresContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("PostgreSQL connection string: %v", err)
	}
	pool, err := pgxpool.New(ctx, connectionString)
	if err != nil {
		t.Fatalf("connect to PostgreSQL: %v", err)
	}
	t.Cleanup(pool.Close)
	if err := pool.Ping(ctx); err != nil {
		t.Fatalf("ping PostgreSQL: %v", err)
	}

	store := spinepg.NewStore(pool)
	decisions := spinepg.NewDecisionStore(pool)
	committed := unitOfWork("adapter_committed", "2026-07-20T14:20:00Z")
	if err := store.Commit(ctx, committed); err != nil {
		t.Fatalf("commit complete unit: %v", err)
	}

	rejected := unitOfWork("adapter_rejected", "2026-07-20T14:21:00Z")
	rejected.Outbox[0].IdempotencyKey = committed.Outbox[0].IdempotencyKey
	if err := store.Commit(ctx, rejected); err == nil {
		t.Fatal("commit conflicting unit error = nil, want atomic rejection")
	}
	if _, err := decisions.Get(ctx, rejected.Decision.GetHeader().GetContractId()); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("rejected decision Get() error = %v, want pgx.ErrNoRows", err)
	}
	pending, err := store.Pending(ctx)
	if err != nil {
		t.Fatalf("load pending rows: %v", err)
	}
	if got, want := len(pending), 1; got != want {
		t.Fatalf("pending rows after rollback = %d, want %d", got, want)
	}
	entries, err := store.All(ctx)
	if err != nil {
		t.Fatalf("replay audit after rollback: %v", err)
	}
	if got, want := len(entries), 1; got != want {
		t.Fatalf("audit entries after rollback = %d, want %d", got, want)
	}
	if !proto.Equal(entries[0], committed.Audit[0]) {
		t.Fatalf("replayed audit entry differs from committed entry")
	}

	standaloneDecision := decisionRecord("adapter_append", "2026-07-20T14:22:00Z")
	if err := decisions.Append(ctx, standaloneDecision); err != nil {
		t.Fatalf("append standalone decision: %v", err)
	}
	replayedDecision, err := decisions.Get(ctx, standaloneDecision.GetHeader().GetContractId())
	if err != nil {
		t.Fatalf("replay standalone decision: %v", err)
	}
	if !proto.Equal(replayedDecision, standaloneDecision) {
		t.Fatalf("replayed decision differs from appended decision")
	}
	if err := decisions.Append(ctx, standaloneDecision); err == nil {
		t.Fatal("append duplicate decision error = nil, want append-only error")
	} else {
		var appendOnly *platform.AppendOnlyError
		if !errors.As(err, &appendOnly) {
			t.Fatalf("append duplicate decision error = %T, want *platform.AppendOnlyError", err)
		}
		if got, want := appendOnly.ContractID, standaloneDecision.GetHeader().GetContractId(); got != want {
			t.Fatalf("AppendOnlyError.ContractID = %q, want %q", got, want)
		}
	}

	standaloneAudit := unitOfWork("adapter_audit", "2026-07-20T14:23:00Z").Audit[0]
	if err := store.Append(ctx, standaloneAudit); err != nil {
		t.Fatalf("append standalone audit: %v", err)
	}
	entries, err = store.All(ctx)
	if err != nil {
		t.Fatalf("replay audit after append: %v", err)
	}
	if got, want := len(entries), 2; got != want {
		t.Fatalf("audit entries after append = %d, want %d", got, want)
	}
	if !proto.Equal(entries[1], standaloneAudit) {
		t.Fatalf("replayed standalone audit differs from appended entry")
	}
	if err := store.Append(ctx, standaloneAudit); err == nil {
		t.Fatal("append duplicate audit error = nil, want append-only error")
	} else {
		var appendOnly *platform.AppendOnlyError
		if !errors.As(err, &appendOnly) {
			t.Fatalf("append duplicate audit error = %T, want *platform.AppendOnlyError", err)
		}
		if got, want := appendOnly.ContractID, standaloneAudit.GetEntryId(); got != want {
			t.Fatalf("AppendOnlyError.ContractID = %q, want %q", got, want)
		}
	}
}

func TestOutboxIntegrationBurstThroughPostgresAndRedpanda(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()

	postgresContainer, err := tcpostgres.Run(
		ctx,
		"postgres:16-alpine",
		tcpostgres.WithDatabase("spine"),
		tcpostgres.WithUsername("spine"),
		tcpostgres.WithPassword("spine_test"),
		tcpostgres.WithInitScripts(filepath.Join("pg", "schema.sql")),
		tcpostgres.BasicWaitStrategies(),
	)
	if err != nil {
		t.Fatalf("start PostgreSQL container: %v", err)
	}
	t.Cleanup(func() {
		if err := testcontainers.TerminateContainer(postgresContainer); err != nil {
			t.Errorf("terminate PostgreSQL container: %v", err)
		}
	})

	connectionString, err := postgresContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("PostgreSQL connection string: %v", err)
	}
	pool, err := pgxpool.New(ctx, connectionString)
	if err != nil {
		t.Fatalf("connect to PostgreSQL: %v", err)
	}
	t.Cleanup(pool.Close)
	if err := pool.Ping(ctx); err != nil {
		t.Fatalf("ping PostgreSQL: %v", err)
	}
	store := spinepg.NewStore(pool)
	decisions := spinepg.NewDecisionStore(pool)

	redpandaContainer, err := tcredpanda.Run(
		ctx,
		"docker.redpanda.com/redpandadata/redpanda:v23.3.3",
		tcredpanda.WithAutoCreateTopics(),
	)
	if err != nil {
		t.Fatalf("start Redpanda container: %v", err)
	}
	t.Cleanup(func() {
		if err := testcontainers.TerminateContainer(redpandaContainer); err != nil {
			t.Errorf("terminate Redpanda container: %v", err)
		}
	})

	broker, err := redpandaContainer.KafkaSeedBroker(ctx)
	if err != nil {
		t.Fatalf("Redpanda seed broker: %v", err)
	}
	const topic = "synthetic-spine-events"
	producer, err := spineredpanda.NewProducer([]string{broker}, topic)
	if err != nil {
		t.Fatalf("create Redpanda producer: %v", err)
	}
	t.Cleanup(producer.Close)

	const eventCount = 100
	for i := range eventCount {
		id := fmt.Sprintf("integration_%03d", i)
		occurredAt := fmt.Sprintf("2026-07-20T14:%02d:%02dZ", i/60, i%60)
		unit := unitOfWork(id, occurredAt)
		unit.Outbox[0].IdempotencyKey = unit.Outbox[0].Event.GetHeader().GetContractId()
		if err := store.Commit(ctx, unit); err != nil {
			t.Fatalf("commit synthetic unit %q: %v", id, err)
		}
	}
	storedDecision, err := decisions.Get(ctx, contractID("integration_000"))
	if err != nil {
		t.Fatalf("load atomically committed decision: %v", err)
	}
	if got, want := storedDecision.GetHeader().GetContractId(), contractID("integration_000"); got != want {
		t.Fatalf("stored decision contract id = %q, want %q", got, want)
	}

	pending, err := store.Pending(ctx)
	if err != nil {
		t.Fatalf("load pending outbox rows: %v", err)
	}
	if got := len(pending); got != eventCount {
		t.Fatalf("pending outbox rows = %d, want %d", got, eventCount)
	}

	for _, row := range pending {
		for range 2 {
			if err := producer.Publish(ctx, row.Event); err != nil {
				t.Fatalf("publish %q: %v", row.IdempotencyKey, err)
			}
		}
		if err := store.MarkRelayed(ctx, row.IdempotencyKey); err != nil {
			t.Fatalf("mark %q relayed: %v", row.IdempotencyKey, err)
		}
	}

	remaining, err := store.Pending(ctx)
	if err != nil {
		t.Fatalf("reload pending outbox rows: %v", err)
	}
	if got := len(remaining); got != 0 {
		t.Fatalf("pending rows after acknowledged publish = %d, want 0", got)
	}

	consumer, err := spineredpanda.NewConsumer([]string{broker}, topic)
	if err != nil {
		t.Fatalf("create Redpanda consumer: %v", err)
	}
	t.Cleanup(consumer.Close)

	offsets := memory.NewConsumerOffsets()
	projection := memory.NewProjection()
	var applied, skipped int
	for range eventCount * 2 {
		event, err := consumer.Next(ctx)
		if err != nil {
			t.Fatalf("consume Redpanda event: %v", err)
		}
		wasApplied, err := spine.Deliver(ctx, offsets, projection, event)
		if err != nil {
			t.Fatalf("deliver %q: %v", event.GetHeader().GetContractId(), err)
		}
		if wasApplied {
			applied++
		} else {
			skipped++
		}
	}

	if applied != eventCount || skipped != eventCount {
		t.Fatalf("burst delivery = %d applied/%d skipped, want %d/%d", applied, skipped, eventCount, eventCount)
	}
	if got := projection.Count(); got != eventCount {
		t.Fatalf("projection count = %d, want %d", got, eventCount)
	}
}
