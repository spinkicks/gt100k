package spine

import (
	"context"
	"fmt"

	platform "github.com/gt100k/platform/pkg/platform"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
)

// Deliver validates and applies an event once per contract ID. Failed
// projection applications are not marked, so the transport can retry them.
func Deliver(
	ctx context.Context,
	offsets ConsumerOffsets,
	projection Projection,
	event *platformv1.LearnerEvent,
) (bool, error) {
	if offsets == nil {
		return false, fmt.Errorf("deliver: nil consumer offsets")
	}
	if projection == nil {
		return false, fmt.Errorf("deliver: nil projection")
	}
	if err := platform.ValidateLearnerEvent(event); err != nil {
		return false, fmt.Errorf("deliver: invalid learner event: %w", err)
	}

	contractID := event.GetHeader().GetContractId()
	seen, err := offsets.Seen(ctx, contractID)
	if err != nil {
		return false, fmt.Errorf("deliver: check offset for %q: %w", contractID, err)
	}
	if seen {
		return false, nil
	}
	if err := projection.Apply(ctx, event); err != nil {
		return false, fmt.Errorf("deliver: apply %q: %w", contractID, err)
	}
	if err := offsets.Mark(ctx, contractID); err != nil {
		return false, fmt.Errorf("deliver: mark %q: %w", contractID, err)
	}
	return true, nil
}
