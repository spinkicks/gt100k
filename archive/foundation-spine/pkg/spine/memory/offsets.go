package memory

import (
	"context"
	"fmt"
	"sync"
)

type ConsumerOffsets struct {
	mu   sync.Mutex
	seen map[string]struct{}
}

func NewConsumerOffsets() *ConsumerOffsets {
	return &ConsumerOffsets{seen: make(map[string]struct{})}
}

func (o *ConsumerOffsets) Seen(ctx context.Context, contractID string) (bool, error) {
	if err := ctx.Err(); err != nil {
		return false, err
	}
	if contractID == "" {
		return false, fmt.Errorf("check offset: empty contract id")
	}
	o.mu.Lock()
	defer o.mu.Unlock()
	_, exists := o.seen[contractID]
	return exists, nil
}

func (o *ConsumerOffsets) Mark(ctx context.Context, contractID string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if contractID == "" {
		return fmt.Errorf("mark offset: empty contract id")
	}
	o.mu.Lock()
	defer o.mu.Unlock()
	o.seen[contractID] = struct{}{}
	return nil
}
