package spine_test

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"testing"
	"time"

	platform "github.com/gt100k/platform/pkg/platform"
	"github.com/gt100k/platform/pkg/platform/fixtures"
	"github.com/gt100k/platform/pkg/spine"
	"github.com/gt100k/platform/pkg/spine/memory"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestMemoryDecisionRepositoryIsAppendOnlyAndReturnsIndependentRecords(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	repo := memory.NewDecisionRepository()
	decision := decisionRecord("memory_repository", "2026-07-20T14:05:00Z")
	want := proto.Clone(decision).(*platformv1.DecisionRecord)
	if err := repo.Append(ctx, decision); err != nil {
		t.Fatalf("Append() error = %v", err)
	}
	decision.Outcome = "caller_mutation"
	got, err := repo.Get(ctx, want.GetHeader().GetContractId())
	if err != nil || !proto.Equal(got, want) {
		t.Fatalf("Get() = %v, %v; want %v, nil", got, err, want)
	}
	got.Outcome = "replay_mutation"
	replayed, err := repo.Get(ctx, want.GetHeader().GetContractId())
	if err != nil || !proto.Equal(replayed, want) {
		t.Fatalf("Get(replay) = %v, %v; want %v, nil", replayed, err, want)
	}
	var appendOnly *platform.AppendOnlyError
	if err := repo.Append(ctx, want); !errors.As(err, &appendOnly) {
		t.Fatalf("Append(duplicate) error = %T, want *platform.AppendOnlyError", err)
	}
}

func TestUnitOfWorkCommitIsAtomic(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	store := memory.NewStore()
	committed := unitOfWork("A", "2026-07-20T14:05:00Z")
	if err := store.Commit(ctx, committed); err != nil {
		t.Fatalf("Commit(committed) error = %v, want nil", err)
	}
	gotDecision, err := store.Get(ctx, contractID("A"))
	if err != nil {
		t.Fatalf("Get(committed decision) error = %v, want nil", err)
	}
	if !proto.Equal(gotDecision, committed.Decision) {
		t.Fatalf("Get(committed decision) = %v, want %v", gotDecision, committed.Decision)
	}

	rejected := unitOfWork("B", "2026-07-20T14:06:00Z")
	rejected.Outbox[0].IdempotencyKey = committed.Outbox[0].IdempotencyKey
	if err := store.Commit(ctx, rejected); err == nil {
		t.Fatal("Commit(rejected) error = nil, want duplicate idempotency key error")
	}

	if _, err := store.Get(ctx, contractID("B")); err == nil {
		t.Fatal("Get(rejected decision) error = nil, want not found")
	}
	pending, err := store.Pending(ctx)
	if err != nil {
		t.Fatalf("Pending() error = %v", err)
	}
	if got, want := len(pending), 1; got != want {
		t.Fatalf("len(Pending()) = %d, want %d", got, want)
	}
	entries, err := store.All(ctx)
	if err != nil {
		t.Fatalf("All() error = %v", err)
	}
	if got, want := len(entries), 1; got != want {
		t.Fatalf("len(All()) = %d, want %d", got, want)
	}
	if got, want := entries[0].GetEntryId(), "audit_A"; got != want {
		t.Fatalf("All()[0].entry_id = %q, want %q", got, want)
	}
}

func TestOutboxPendingExcludesRelayedRows(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	store := memory.NewStore()
	unit := unitOfWork("relay", "2026-07-20T14:07:00Z")
	if err := store.Commit(ctx, unit); err != nil {
		t.Fatalf("Commit() error = %v", err)
	}
	if err := store.MarkRelayed(ctx, unit.Outbox[0].IdempotencyKey); err != nil {
		t.Fatalf("MarkRelayed() error = %v", err)
	}
	pending, err := store.Pending(ctx)
	if err != nil {
		t.Fatalf("Pending() error = %v", err)
	}
	if got := len(pending); got != 0 {
		t.Fatalf("len(Pending()) = %d, want 0", got)
	}
}

func TestDeliverDeduplicatesByContractID(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	offsets := memory.NewConsumerOffsets()
	projection := memory.NewProjection()
	sequence := []string{"A", "B", "A", "C", "B", "A"}
	wantApplied := []bool{true, true, false, true, false, false}
	gotApplied := make([]bool, 0, len(sequence))

	for i, id := range sequence {
		event := learnerEvent(id, fmt.Sprintf("2026-07-20T14:%02d:00Z", i+1))
		applied, err := spine.Deliver(ctx, offsets, projection, event)
		if err != nil {
			t.Fatalf("Deliver(%q) error = %v", id, err)
		}
		gotApplied = append(gotApplied, applied)
	}

	if !reflect.DeepEqual(gotApplied, wantApplied) {
		t.Fatalf("Deliver() applied = %v, want %v", gotApplied, wantApplied)
	}
	if got, want := projection.Count(), 3; got != want {
		t.Fatalf("projection.Count() = %d, want %d", got, want)
	}
	if got, want := projection.ContractIDs(), []string{contractID("A"), contractID("B"), contractID("C")}; !reflect.DeepEqual(got, want) {
		t.Fatalf("projection.ContractIDs() = %v, want %v", got, want)
	}
}

func TestDeliverAcceptsOutOfOrderUniqueEvents(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	offsets := memory.NewConsumerOffsets()
	projection := memory.NewProjection()
	cases := []struct {
		event       *platformv1.LearnerEvent
		wantApplied bool
	}{
		{learnerEvent("O1", "2026-07-20T14:05:00Z"), true},
		{learnerEvent("O2", "2026-07-20T14:01:00Z"), true},
		{learnerEvent("O2", "2026-07-20T14:01:00Z"), false},
	}

	for _, tt := range cases {
		applied, err := spine.Deliver(ctx, offsets, projection, tt.event)
		if err != nil {
			t.Fatalf("Deliver(%q) error = %v", tt.event.GetHeader().GetContractId(), err)
		}
		if applied != tt.wantApplied {
			t.Fatalf("Deliver(%q) applied = %t, want %t", tt.event.GetHeader().GetContractId(), applied, tt.wantApplied)
		}
	}

	if got, want := projection.Count(), 2; got != want {
		t.Fatalf("projection.Count() = %d, want %d", got, want)
	}
}

func TestDeliverBurstAppliesEachContractOnce(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	offsets := memory.NewConsumerOffsets()
	projection := memory.NewProjection()
	events := make([]*platformv1.LearnerEvent, 100)
	for i := range events {
		events[i] = learnerEvent(fmt.Sprintf("burst_%03d", i), fmt.Sprintf("2026-07-20T14:%02d:%02dZ", i/60, i%60))
	}

	var applied, skipped int
	for _, event := range events {
		for range 2 {
			wasApplied, err := spine.Deliver(ctx, offsets, projection, event)
			if err != nil {
				t.Fatalf("Deliver(%q) error = %v", event.GetHeader().GetContractId(), err)
			}
			if wasApplied {
				applied++
			} else {
				skipped++
			}
		}
	}

	if applied != 100 || skipped != 100 {
		t.Fatalf("Deliver(burst) = %d applied/%d skipped, want 100/100", applied, skipped)
	}
	if got, want := projection.Count(), 100; got != want {
		t.Fatalf("projection.Count() = %d, want %d", got, want)
	}
}

func unitOfWork(id, occurredAt string) *spine.UnitOfWork {
	event := learnerEvent(id, occurredAt)
	decision := decisionRecord(id, occurredAt)
	audit := &platformv1.AuditEntry{
		EntryId:       "audit_" + id,
		Header:        proto.Clone(decision.GetHeader()).(*platformv1.Envelope),
		ActorRef:      proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
		Action:        "decision_recorded",
		PolicyAllow:   true,
		PolicyReason:  "allow",
		PolicyVersion: fixtures.PolicyVersion,
		Outcome:       decision.GetOutcome(),
	}
	return &spine.UnitOfWork{
		Decision: decision,
		Events:   []*platformv1.LearnerEvent{event},
		Outbox: []*spine.OutboxRow{{
			IdempotencyKey: "outbox_" + id,
			Event:          event,
			StagedAt:       mustTime(occurredAt),
		}},
		Audit: []*platformv1.AuditEntry{audit},
	}
}

func learnerEvent(id, occurredAt string) *platformv1.LearnerEvent {
	header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
	header.ContractId = contractID(id)
	header.SchemaVersion = "learner_event/1"
	header.OccurredAt = timestamppb.New(mustTime(occurredAt))
	header.RecordedAt = timestamppb.New(mustTime(occurredAt).Add(time.Millisecond))
	header.CorrelationId = "corr_" + id
	header.CausationId = "cause_" + id
	return &platformv1.LearnerEvent{
		Header:        header,
		EventType:     "synthetic.projection_update",
		LearnerRef:    fixtures.EligibleLearner.GetLearnerRef(),
		Source:        "synthetic_test",
		PayloadSchema: "synthetic.projection_update/1",
	}
}

func decisionRecord(id, occurredAt string) *platformv1.DecisionRecord {
	header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
	header.ContractId = contractID(id)
	header.SchemaVersion = "decision_record/1"
	header.OccurredAt = timestamppb.New(mustTime(occurredAt))
	header.RecordedAt = timestamppb.New(mustTime(occurredAt).Add(time.Millisecond))
	header.CorrelationId = "corr_" + id
	header.CausationId = "cause_" + id
	decision := &platformv1.DecisionRecord{
		Header:           header,
		DecisionType:     "synthetic.pathway_recommendation",
		SubjectRef:       fixtures.EligibleLearner.GetLearnerRef(),
		Candidates:       []string{"pathway_synth_a", "pathway_synth_b"},
		Outcome:          "pathway_synth_a",
		ReasonCodes:      []string{"synthetic_evidence_supported"},
		EvidenceSnapshot: []string{"evidence://fixture/synth_001#sha256:dd44"},
		Uncertainty:      0.1,
		PolicyVersion:    fixtures.PolicyVersion,
		ModelVersion:     "model/synthetic-v1",
		AuthorizedHuman:  proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
		EffectiveAt:      timestamppb.New(mustTime(occurredAt)),
		Consequential:    true,
	}
	if err := platform.ValidateDecisionRecord(decision); err != nil {
		panic(fmt.Sprintf("invalid synthetic decision fixture: %v", err))
	}
	return decision
}

func contractID(id string) string {
	return "cid_" + id
}

func mustTime(value string) time.Time {
	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		panic(fmt.Sprintf("invalid synthetic test time %q: %v", value, err))
	}
	return parsed
}
