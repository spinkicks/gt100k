// Package pg implements spine persistence ports over PostgreSQL.
package pg

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/gt100k/platform/pkg/platform"
	"github.com/gt100k/platform/pkg/spine"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/protobuf/proto"
)

// Store persists decisions, outbox rows, and audit entries in one database.
type Store struct {
	pool *pgxpool.Pool
}

// DecisionStore is the DecisionRepository view over a PostgreSQL pool. It is
// separate from Store because Go cannot overload the two repository Append
// methods for DecisionRecord and AuditEntry.
type DecisionStore struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func NewDecisionStore(pool *pgxpool.Pool) *DecisionStore {
	return &DecisionStore{pool: pool}
}

// Commit writes every part of a unit of work in one short transaction.
func (s *Store) Commit(ctx context.Context, unit *spine.UnitOfWork) error {
	if s == nil || s.pool == nil {
		return fmt.Errorf("commit unit of work: nil PostgreSQL pool")
	}
	prepared, err := prepareUnitOfWork(unit)
	if err != nil {
		return fmt.Errorf("commit unit of work: %w", err)
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("commit unit of work: begin transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if prepared.decision != nil {
		if _, err := tx.Exec(ctx,
			`insert into spine_decisions (contract_id, payload) values ($1, $2)`,
			prepared.decision.contractID,
			prepared.decision.payload,
		); err != nil {
			return fmt.Errorf("commit unit of work: insert decision %q: %w", prepared.decision.contractID, err)
		}
	}
	for _, row := range prepared.outbox {
		if _, err := tx.Exec(ctx,
			`insert into spine_outbox (idempotency_key, contract_id, event_payload, relayed, staged_at)
			 values ($1, $2, $3, false, $4)`,
			row.idempotencyKey,
			row.contractID,
			row.payload,
			row.stagedAt,
		); err != nil {
			return fmt.Errorf("commit unit of work: insert outbox row %q: %w", row.idempotencyKey, err)
		}
	}
	for _, entry := range prepared.audit {
		if _, err := tx.Exec(ctx,
			`insert into spine_audit (entry_id, tenant_id, payload) values ($1, $2, $3)`,
			entry.entryID,
			entry.tenantID,
			entry.payload,
		); err != nil {
			return fmt.Errorf("commit unit of work: insert audit entry %q: %w", entry.entryID, err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit unit of work: commit transaction: %w", err)
	}
	return nil
}

func (s *Store) Pending(ctx context.Context) ([]*spine.OutboxRow, error) {
	if s == nil || s.pool == nil {
		return nil, fmt.Errorf("load pending outbox rows: nil PostgreSQL pool")
	}
	rows, err := s.pool.Query(ctx,
		`select idempotency_key, event_payload, relayed, staged_at
		 from spine_outbox
		 where not relayed
		 order by staged_at, idempotency_key`,
	)
	if err != nil {
		return nil, fmt.Errorf("load pending outbox rows: %w", err)
	}
	defer rows.Close()

	pending := make([]*spine.OutboxRow, 0)
	for rows.Next() {
		var row spine.OutboxRow
		var payload []byte
		if err := rows.Scan(&row.IdempotencyKey, &payload, &row.Relayed, &row.StagedAt); err != nil {
			return nil, fmt.Errorf("load pending outbox rows: scan: %w", err)
		}
		row.Event = new(platformv1.LearnerEvent)
		if err := proto.Unmarshal(payload, row.Event); err != nil {
			return nil, fmt.Errorf("load pending outbox row %q: decode event: %w", row.IdempotencyKey, err)
		}
		pending = append(pending, &row)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("load pending outbox rows: %w", err)
	}
	return pending, nil
}

func (s *Store) MarkRelayed(ctx context.Context, idempotencyKey string) error {
	if s == nil || s.pool == nil {
		return fmt.Errorf("mark relayed: nil PostgreSQL pool")
	}
	if idempotencyKey == "" {
		return fmt.Errorf("mark relayed: empty idempotency key")
	}
	tag, err := s.pool.Exec(ctx,
		`update spine_outbox set relayed = true where idempotency_key = $1`,
		idempotencyKey,
	)
	if err != nil {
		return fmt.Errorf("mark relayed %q: %w", idempotencyKey, err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("mark relayed: idempotency key %q not found", idempotencyKey)
	}
	return nil
}

func (s *Store) Get(ctx context.Context, contractID string) (*platformv1.DecisionRecord, error) {
	if s == nil || s.pool == nil {
		return nil, fmt.Errorf("get decision: nil PostgreSQL pool")
	}
	return getDecision(ctx, s.pool, contractID)
}

func (s *DecisionStore) Append(ctx context.Context, decision *platformv1.DecisionRecord) error {
	if s == nil || s.pool == nil {
		return fmt.Errorf("append decision: nil PostgreSQL pool")
	}
	if err := platform.ValidateDecisionRecord(decision); err != nil {
		return fmt.Errorf("append decision: invalid decision: %w", err)
	}
	payload, err := proto.Marshal(decision)
	if err != nil {
		return fmt.Errorf("append decision: encode: %w", err)
	}
	contractID := decision.GetHeader().GetContractId()
	if _, err := s.pool.Exec(ctx,
		`insert into spine_decisions (contract_id, payload) values ($1, $2)`,
		contractID,
		payload,
	); err != nil {
		return fmt.Errorf("append decision %q: %w", contractID, appendOnlyError(err, contractID))
	}
	return nil
}

func (s *DecisionStore) Get(ctx context.Context, contractID string) (*platformv1.DecisionRecord, error) {
	if s == nil || s.pool == nil {
		return nil, fmt.Errorf("get decision: nil PostgreSQL pool")
	}
	return getDecision(ctx, s.pool, contractID)
}

func getDecision(ctx context.Context, pool *pgxpool.Pool, contractID string) (*platformv1.DecisionRecord, error) {
	if contractID == "" {
		return nil, fmt.Errorf("get decision: empty contract id")
	}
	var payload []byte
	if err := pool.QueryRow(ctx,
		`select payload from spine_decisions where contract_id = $1`,
		contractID,
	).Scan(&payload); err != nil {
		return nil, fmt.Errorf("get decision %q: %w", contractID, err)
	}
	decision := new(platformv1.DecisionRecord)
	if err := proto.Unmarshal(payload, decision); err != nil {
		return nil, fmt.Errorf("get decision %q: decode: %w", contractID, err)
	}
	return decision, nil
}

func (s *Store) Append(ctx context.Context, entry *platformv1.AuditEntry) error {
	if s == nil || s.pool == nil {
		return fmt.Errorf("append audit: nil PostgreSQL pool")
	}
	prepared, err := prepareAuditEntry(entry)
	if err != nil {
		return fmt.Errorf("append audit: %w", err)
	}
	if _, err := s.pool.Exec(ctx,
		`insert into spine_audit (entry_id, tenant_id, payload) values ($1, $2, $3)`,
		prepared.entryID,
		prepared.tenantID,
		prepared.payload,
	); err != nil {
		return fmt.Errorf("append audit entry %q: %w", prepared.entryID, appendOnlyError(err, prepared.entryID))
	}
	return nil
}

func (s *Store) All(ctx context.Context) ([]*platformv1.AuditEntry, error) {
	if s == nil || s.pool == nil {
		return nil, fmt.Errorf("load audit: nil PostgreSQL pool")
	}
	rows, err := s.pool.Query(ctx, `select payload from spine_audit order by sequence_no`)
	if err != nil {
		return nil, fmt.Errorf("load audit: %w", err)
	}
	defer rows.Close()

	entries := make([]*platformv1.AuditEntry, 0)
	for rows.Next() {
		var payload []byte
		if err := rows.Scan(&payload); err != nil {
			return nil, fmt.Errorf("load audit: scan: %w", err)
		}
		entry := new(platformv1.AuditEntry)
		if err := proto.Unmarshal(payload, entry); err != nil {
			return nil, fmt.Errorf("load audit: decode: %w", err)
		}
		entries = append(entries, entry)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("load audit: %w", err)
	}
	return entries, nil
}

type preparedUnitOfWork struct {
	decision *preparedDecision
	outbox   []preparedOutboxRow
	audit    []preparedAudit
}

type preparedDecision struct {
	contractID string
	payload    []byte
}

type preparedOutboxRow struct {
	idempotencyKey string
	contractID     string
	payload        []byte
	stagedAt       time.Time
}

type preparedAudit struct {
	entryID  string
	tenantID string
	payload  []byte
}

func prepareUnitOfWork(unit *spine.UnitOfWork) (*preparedUnitOfWork, error) {
	if unit == nil {
		return nil, fmt.Errorf("nil unit of work")
	}
	prepared := &preparedUnitOfWork{
		outbox: make([]preparedOutboxRow, 0, len(unit.Outbox)),
		audit:  make([]preparedAudit, 0, len(unit.Audit)),
	}
	if unit.Decision != nil {
		if err := platform.ValidateDecisionRecord(unit.Decision); err != nil {
			return nil, fmt.Errorf("invalid decision: %w", err)
		}
		payload, err := proto.Marshal(unit.Decision)
		if err != nil {
			return nil, fmt.Errorf("encode decision: %w", err)
		}
		prepared.decision = &preparedDecision{
			contractID: unit.Decision.GetHeader().GetContractId(),
			payload:    payload,
		}
	}
	for i, event := range unit.Events {
		if err := platform.ValidateLearnerEvent(event); err != nil {
			return nil, fmt.Errorf("invalid event %d: %w", i, err)
		}
	}
	for i, row := range unit.Outbox {
		if row == nil {
			return nil, fmt.Errorf("nil outbox row %d", i)
		}
		if row.IdempotencyKey == "" {
			return nil, fmt.Errorf("outbox row %d has empty idempotency key", i)
		}
		if row.Relayed {
			return nil, fmt.Errorf("outbox row %d is already relayed", i)
		}
		if row.StagedAt.IsZero() {
			return nil, fmt.Errorf("outbox row %d has zero staged time", i)
		}
		if err := platform.ValidateLearnerEvent(row.Event); err != nil {
			return nil, fmt.Errorf("outbox row %d has invalid event: %w", i, err)
		}
		payload, err := proto.Marshal(row.Event)
		if err != nil {
			return nil, fmt.Errorf("encode outbox row %d: %w", i, err)
		}
		prepared.outbox = append(prepared.outbox, preparedOutboxRow{
			idempotencyKey: row.IdempotencyKey,
			contractID:     row.Event.GetHeader().GetContractId(),
			payload:        payload,
			stagedAt:       row.StagedAt,
		})
	}
	for i, entry := range unit.Audit {
		value, err := prepareAuditEntry(entry)
		if err != nil {
			return nil, fmt.Errorf("invalid audit entry %d: %w", i, err)
		}
		prepared.audit = append(prepared.audit, *value)
	}
	return prepared, nil
}

func prepareAuditEntry(entry *platformv1.AuditEntry) (*preparedAudit, error) {
	if err := spine.ValidateAuditEntry(entry); err != nil {
		return nil, err
	}
	payload, err := proto.Marshal(entry)
	if err != nil {
		return nil, fmt.Errorf("encode: %w", err)
	}
	return &preparedAudit{
		entryID:  entry.GetEntryId(),
		tenantID: entry.GetHeader().GetTenantId(),
		payload:  payload,
	}, nil
}

func appendOnlyError(err error, contractID string) error {
	var postgresError *pgconn.PgError
	if errors.As(err, &postgresError) && postgresError.Code == "23505" {
		return &platform.AppendOnlyError{ContractID: contractID}
	}
	return err
}

var (
	_ spine.OutboxStore        = (*Store)(nil)
	_ spine.AuditLog           = (*Store)(nil)
	_ spine.DecisionRepository = (*DecisionStore)(nil)
)
