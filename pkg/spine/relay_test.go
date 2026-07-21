package spine_test

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"github.com/gt100k/platform/pkg/spine"
	"github.com/gt100k/platform/pkg/spine/memory"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
)

func TestRelayPublishesEveryPendingRowAndMarksItRelayed(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	store := memory.NewStore()
	for _, unit := range []*spine.UnitOfWork{
		unitOfWork("relay_A", "2026-07-20T14:05:00Z"),
		unitOfWork("relay_B", "2026-07-20T14:06:00Z"),
	} {
		if err := store.Commit(ctx, unit); err != nil {
			t.Fatalf("Commit() error = %v", err)
		}
	}
	bus := memory.NewEventBus()

	published, err := spine.Relay(ctx, store, bus)
	if err != nil {
		t.Fatalf("Relay() error = %v, want nil", err)
	}
	if got, want := published, 2; got != want {
		t.Fatalf("Relay() published = %d, want %d", got, want)
	}
	pending, err := store.Pending(ctx)
	if err != nil {
		t.Fatalf("Pending() error = %v", err)
	}
	if got := len(pending); got != 0 {
		t.Fatalf("len(Pending()) = %d, want 0", got)
	}

	var gotIDs []string
	for range published {
		event, err := bus.Next(ctx)
		if err != nil {
			t.Fatalf("bus.Next() error = %v", err)
		}
		gotIDs = append(gotIDs, event.GetHeader().GetContractId())
	}
	wantIDs := []string{contractID("relay_A"), contractID("relay_B")}
	if !reflect.DeepEqual(gotIDs, wantIDs) {
		t.Fatalf("published contract ids = %v, want %v", gotIDs, wantIDs)
	}
}

func TestRelayLeavesFailedPublishPendingForRetry(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	store := memory.NewStore()
	for _, unit := range []*spine.UnitOfWork{
		unitOfWork("retry_A", "2026-07-20T14:05:00Z"),
		unitOfWork("retry_B", "2026-07-20T14:06:00Z"),
	} {
		if err := store.Commit(ctx, unit); err != nil {
			t.Fatalf("Commit() error = %v", err)
		}
	}
	failure := errors.New("synthetic publish failure")
	bus := &failingEventBus{
		failContractID: contractID("retry_B"),
		err:            failure,
	}

	published, err := spine.Relay(ctx, store, bus)
	if !errors.Is(err, failure) {
		t.Fatalf("Relay() error = %v, want wrapped %v", err, failure)
	}
	if got, want := published, 1; got != want {
		t.Fatalf("Relay() published = %d, want %d", got, want)
	}
	if got, want := bus.published, []string{contractID("retry_A")}; !reflect.DeepEqual(got, want) {
		t.Fatalf("published before failure = %v, want %v", got, want)
	}
	pending, err := store.Pending(ctx)
	if err != nil {
		t.Fatalf("Pending() error = %v", err)
	}
	if got, want := len(pending), 1; got != want {
		t.Fatalf("len(Pending()) after failure = %d, want %d", got, want)
	}
	if got, want := pending[0].Event.GetHeader().GetContractId(), contractID("retry_B"); got != want {
		t.Fatalf("pending contract id = %q, want %q", got, want)
	}

	retryBus := memory.NewEventBus()
	published, err = spine.Relay(ctx, store, retryBus)
	if err != nil {
		t.Fatalf("Relay(retry) error = %v", err)
	}
	if got, want := published, 1; got != want {
		t.Fatalf("Relay(retry) published = %d, want %d", got, want)
	}
	got, err := retryBus.Next(ctx)
	if err != nil {
		t.Fatalf("retryBus.Next() error = %v", err)
	}
	if gotID, want := got.GetHeader().GetContractId(), contractID("retry_B"); gotID != want {
		t.Fatalf("retried contract id = %q, want %q", gotID, want)
	}
}

func TestMemoryEventBusPreservesDuplicatePublishes(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	bus := memory.NewEventBus()
	event := learnerEvent("duplicate", "2026-07-20T14:05:00Z")
	for range 2 {
		if err := bus.Publish(ctx, event); err != nil {
			t.Fatalf("Publish() error = %v", err)
		}
	}
	event.EventType = "caller_mutation"

	for i := range 2 {
		got, err := bus.Next(ctx)
		if err != nil {
			t.Fatalf("Next(%d) error = %v", i, err)
		}
		if gotType, want := got.GetEventType(), "synthetic.projection_update"; gotType != want {
			t.Fatalf("Next(%d).event_type = %q, want %q", i, gotType, want)
		}
	}
	if _, err := bus.Next(ctx); err == nil {
		t.Fatal("Next(empty) error = nil, want error")
	}
}

type failingEventBus struct {
	failContractID string
	err            error
	published      []string
}

func (b *failingEventBus) Publish(_ context.Context, event *platformv1.LearnerEvent) error {
	contractID := event.GetHeader().GetContractId()
	if contractID == b.failContractID {
		return b.err
	}
	b.published = append(b.published, contractID)
	return nil
}
