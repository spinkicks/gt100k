package memory

import (
	"context"
	"fmt"
	"sync"

	platform "github.com/gt100k/platform/pkg/platform"
	"github.com/gt100k/platform/pkg/spine"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

// EventBus is a FIFO in-memory transport. It intentionally retains duplicate
// publishes so default-lane tests exercise at-least-once delivery semantics.
type EventBus struct {
	mu     sync.Mutex
	events []*platformv1.LearnerEvent
	next   int
}

func NewEventBus() *EventBus {
	return &EventBus{}
}

func (b *EventBus) Publish(ctx context.Context, event *platformv1.LearnerEvent) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if err := platform.ValidateLearnerEvent(event); err != nil {
		return fmt.Errorf("publish event: invalid learner event: %w", err)
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	b.events = append(b.events, proto.Clone(event).(*platformv1.LearnerEvent))
	return nil
}

func (b *EventBus) Next(ctx context.Context) (*platformv1.LearnerEvent, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.next >= len(b.events) {
		return nil, fmt.Errorf("consume event: no event available")
	}
	event := proto.Clone(b.events[b.next]).(*platformv1.LearnerEvent)
	b.next++
	return event, nil
}

var (
	_ spine.EventBus    = (*EventBus)(nil)
	_ spine.EventSource = (*EventBus)(nil)
)
