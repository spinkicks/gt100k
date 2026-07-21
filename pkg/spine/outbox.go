package spine

import (
	"time"

	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
)

// UnitOfWork is the complete state transition committed by OutboxStore.
type UnitOfWork struct {
	Decision *platformv1.DecisionRecord
	Events   []*platformv1.LearnerEvent
	Outbox   []*OutboxRow
	Audit    []*platformv1.AuditEntry
}

// OutboxRow is an event staged for relay under a stable idempotency key.
type OutboxRow struct {
	IdempotencyKey string
	Event          *platformv1.LearnerEvent
	Relayed        bool
	StagedAt       time.Time
}
