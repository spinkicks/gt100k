package spine_test

import (
	"context"
	"fmt"
	"reflect"
	"testing"

	"github.com/gt100k/platform/pkg/spine"
	"github.com/gt100k/platform/pkg/spine/memory"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
)

func TestGoldenGIDEMDecisionTable(t *testing.T) {
	t.Run("replay sequence", func(t *testing.T) {
		ctx := context.Background()
		offsets := memory.NewConsumerOffsets()
		projection := memory.NewProjection()
		sequence := []string{"A", "B", "A", "C", "B", "A"}
		wantApplied := []bool{true, true, false, true, false, false}
		gotApplied := make([]bool, 0, len(sequence))

		for _, id := range sequence {
			applied, err := spine.Deliver(ctx, offsets, projection, learnerEvent(id, "2026-07-20T14:03:11Z"))
			if err != nil {
				t.Fatalf("Deliver(%q) error = %v", id, err)
			}
			gotApplied = append(gotApplied, applied)
		}
		if !reflect.DeepEqual(gotApplied, wantApplied) {
			t.Fatalf("Deliver() applied = %v, want %v", gotApplied, wantApplied)
		}
		if got, want := projection.ContractIDs(), []string{"cid_A", "cid_B", "cid_C"}; !reflect.DeepEqual(got, want) {
			t.Fatalf("projection keys = %v, want %v", got, want)
		}
		if got := projection.Count(); got != 3 {
			t.Fatalf("projection.Count() = %d, want 3", got)
		}
	})

	t.Run("out of order", func(t *testing.T) {
		ctx := context.Background()
		offsets := memory.NewConsumerOffsets()
		projection := memory.NewProjection()
		tests := []struct {
			event       *platformv1.LearnerEvent
			wantApplied bool
		}{
			{learnerEvent("O1", "2026-07-20T14:05:00Z"), true},
			{learnerEvent("O2", "2026-07-20T14:01:00Z"), true},
			{learnerEvent("O2", "2026-07-20T14:01:00Z"), false},
		}
		for _, tt := range tests {
			applied, err := spine.Deliver(ctx, offsets, projection, tt.event)
			if err != nil {
				t.Fatalf("Deliver(%q) error = %v", tt.event.Header.ContractId, err)
			}
			if applied != tt.wantApplied {
				t.Fatalf("Deliver(%q) applied = %t, want %t", tt.event.Header.ContractId, applied, tt.wantApplied)
			}
		}
		if got := projection.Count(); got != 2 {
			t.Fatalf("projection.Count() = %d, want 2", got)
		}
	})

	t.Run("interleaved burst", func(t *testing.T) {
		ctx := context.Background()
		offsets := memory.NewConsumerOffsets()
		projection := memory.NewProjection()
		events := make([]*platformv1.LearnerEvent, 100)
		for i := range events {
			events[i] = learnerEvent(fmt.Sprintf("burst_%03d", i), fmt.Sprintf("2026-07-20T14:%02d:%02dZ", i/60, i%60))
		}

		deliveries := []*platformv1.LearnerEvent{events[0]}
		for i := 1; i < len(events); i++ {
			deliveries = append(deliveries, events[i], events[i-1])
		}
		deliveries = append(deliveries, events[len(events)-1])

		var applied, skipped int
		for _, event := range deliveries {
			wasApplied, err := spine.Deliver(ctx, offsets, projection, event)
			if err != nil {
				t.Fatalf("Deliver(%q) error = %v", event.Header.ContractId, err)
			}
			if wasApplied {
				applied++
			} else {
				skipped++
			}
		}
		if applied != 100 || skipped != 100 {
			t.Fatalf("Deliver(burst) = %d applied/%d skipped, want 100/100", applied, skipped)
		}
		if got := projection.Count(); got != 100 {
			t.Fatalf("projection.Count() = %d, want 100", got)
		}
	})
}
