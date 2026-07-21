// Package memory provides hermetic in-memory implementations of spine ports.
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

// Store owns decision, outbox, and audit state behind one lock so Commit can
// publish all parts of a unit of work atomically.
type Store struct {
	mu sync.Mutex

	decisions   map[string]*platformv1.DecisionRecord
	outbox      map[string]*spine.OutboxRow
	outboxOrder []string
	audit       map[string]*platformv1.AuditEntry
	auditOrder  []string
}

func NewStore() *Store {
	return &Store{
		decisions: make(map[string]*platformv1.DecisionRecord),
		outbox:    make(map[string]*spine.OutboxRow),
		audit:     make(map[string]*platformv1.AuditEntry),
	}
}

func (s *Store) Commit(ctx context.Context, unit *spine.UnitOfWork) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if err := validateUnitOfWork(unit); err != nil {
		return fmt.Errorf("commit unit of work: %w", err)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if err := s.rejectConflicts(unit); err != nil {
		return fmt.Errorf("commit unit of work: %w", err)
	}
	if unit.Decision != nil {
		contractID := unit.Decision.GetHeader().GetContractId()
		s.decisions[contractID] = proto.Clone(unit.Decision).(*platformv1.DecisionRecord)
	}
	for _, row := range unit.Outbox {
		s.outbox[row.IdempotencyKey] = cloneOutboxRow(row)
		s.outboxOrder = append(s.outboxOrder, row.IdempotencyKey)
	}
	for _, entry := range unit.Audit {
		s.audit[entry.GetEntryId()] = proto.Clone(entry).(*platformv1.AuditEntry)
		s.auditOrder = append(s.auditOrder, entry.GetEntryId())
	}
	return nil
}

func (s *Store) Pending(ctx context.Context) ([]*spine.OutboxRow, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	rows := make([]*spine.OutboxRow, 0, len(s.outboxOrder))
	for _, key := range s.outboxOrder {
		row := s.outbox[key]
		if !row.Relayed {
			rows = append(rows, cloneOutboxRow(row))
		}
	}
	return rows, nil
}

func (s *Store) MarkRelayed(ctx context.Context, idempotencyKey string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if idempotencyKey == "" {
		return fmt.Errorf("mark relayed: empty idempotency key")
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	row, ok := s.outbox[idempotencyKey]
	if !ok {
		return fmt.Errorf("mark relayed: idempotency key %q not found", idempotencyKey)
	}
	row.Relayed = true
	return nil
}

func (s *Store) Get(ctx context.Context, contractID string) (*platformv1.DecisionRecord, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if contractID == "" {
		return nil, fmt.Errorf("get decision: empty contract id")
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	decision, ok := s.decisions[contractID]
	if !ok {
		return nil, fmt.Errorf("get decision: contract id %q not found", contractID)
	}
	return proto.Clone(decision).(*platformv1.DecisionRecord), nil
}

func (s *Store) Append(ctx context.Context, entry *platformv1.AuditEntry) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if err := spine.ValidateAuditEntry(entry); err != nil {
		return fmt.Errorf("append audit: %w", err)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	entryID := entry.GetEntryId()
	if _, exists := s.audit[entryID]; exists {
		return fmt.Errorf("append audit: %w", &platform.AppendOnlyError{ContractID: entryID})
	}
	s.audit[entryID] = proto.Clone(entry).(*platformv1.AuditEntry)
	s.auditOrder = append(s.auditOrder, entryID)
	return nil
}

func (s *Store) All(ctx context.Context) ([]*platformv1.AuditEntry, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	entries := make([]*platformv1.AuditEntry, 0, len(s.auditOrder))
	for _, entryID := range s.auditOrder {
		entries = append(entries, proto.Clone(s.audit[entryID]).(*platformv1.AuditEntry))
	}
	return entries, nil
}

func validateUnitOfWork(unit *spine.UnitOfWork) error {
	if unit == nil {
		return fmt.Errorf("nil unit of work")
	}
	if unit.Decision != nil {
		if err := platform.ValidateDecisionRecord(unit.Decision); err != nil {
			return fmt.Errorf("invalid decision: %w", err)
		}
	}
	for i, event := range unit.Events {
		if err := platform.ValidateLearnerEvent(event); err != nil {
			return fmt.Errorf("invalid event %d: %w", i, err)
		}
	}
	for i, row := range unit.Outbox {
		if row == nil {
			return fmt.Errorf("nil outbox row %d", i)
		}
		if row.IdempotencyKey == "" {
			return fmt.Errorf("outbox row %d has empty idempotency key", i)
		}
		if row.Relayed {
			return fmt.Errorf("outbox row %d is already relayed", i)
		}
		if row.StagedAt.IsZero() {
			return fmt.Errorf("outbox row %d has zero staged time", i)
		}
		if err := platform.ValidateLearnerEvent(row.Event); err != nil {
			return fmt.Errorf("outbox row %d has invalid event: %w", i, err)
		}
	}
	for i, entry := range unit.Audit {
		if err := spine.ValidateAuditEntry(entry); err != nil {
			return fmt.Errorf("invalid audit entry %d: %w", i, err)
		}
	}
	return nil
}

func (s *Store) rejectConflicts(unit *spine.UnitOfWork) error {
	if unit.Decision != nil {
		contractID := unit.Decision.GetHeader().GetContractId()
		if _, exists := s.decisions[contractID]; exists {
			return &platform.AppendOnlyError{ContractID: contractID}
		}
	}

	outboxKeys := make(map[string]struct{}, len(unit.Outbox))
	for _, row := range unit.Outbox {
		if _, exists := s.outbox[row.IdempotencyKey]; exists {
			return fmt.Errorf("outbox idempotency key %q already exists", row.IdempotencyKey)
		}
		if _, exists := outboxKeys[row.IdempotencyKey]; exists {
			return fmt.Errorf("outbox idempotency key %q repeated in unit of work", row.IdempotencyKey)
		}
		outboxKeys[row.IdempotencyKey] = struct{}{}
	}

	auditIDs := make(map[string]struct{}, len(unit.Audit))
	for _, entry := range unit.Audit {
		entryID := entry.GetEntryId()
		if _, exists := s.audit[entryID]; exists {
			return fmt.Errorf("audit entry id %q already exists", entryID)
		}
		if _, exists := auditIDs[entryID]; exists {
			return fmt.Errorf("audit entry id %q repeated in unit of work", entryID)
		}
		auditIDs[entryID] = struct{}{}
	}
	return nil
}

func cloneOutboxRow(row *spine.OutboxRow) *spine.OutboxRow {
	cloned := *row
	cloned.Event = proto.Clone(row.Event).(*platformv1.LearnerEvent)
	return &cloned
}

var (
	_ spine.OutboxStore = (*Store)(nil)
	_ spine.AuditLog    = (*Store)(nil)
)
