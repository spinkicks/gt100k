package spine

import (
	"context"
	"fmt"
)

// Relay publishes pending outbox rows in store order. A row is marked relayed
// only after Publish succeeds. If marking fails, the published row remains
// pending and may be published again on retry, preserving at-least-once
// delivery.
func Relay(ctx context.Context, store OutboxStore, bus EventBus) (int, error) {
	if store == nil {
		return 0, fmt.Errorf("relay: nil outbox store")
	}
	if bus == nil {
		return 0, fmt.Errorf("relay: nil event bus")
	}

	rows, err := store.Pending(ctx)
	if err != nil {
		return 0, fmt.Errorf("relay: load pending rows: %w", err)
	}
	published := 0
	for i, row := range rows {
		if row == nil {
			return published, fmt.Errorf("relay: pending row %d is nil", i)
		}
		if row.IdempotencyKey == "" {
			return published, fmt.Errorf("relay: pending row %d has empty idempotency key", i)
		}
		if row.Relayed {
			return published, fmt.Errorf("relay: pending row %q is already relayed", row.IdempotencyKey)
		}
		if err := bus.Publish(ctx, row.Event); err != nil {
			return published, fmt.Errorf("relay: publish row %q: %w", row.IdempotencyKey, err)
		}
		published++
		if err := store.MarkRelayed(ctx, row.IdempotencyKey); err != nil {
			return published, fmt.Errorf("relay: mark row %q relayed: %w", row.IdempotencyKey, err)
		}
	}
	return published, nil
}
