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

// OverrideRepository stores immutable overrides in append order by target.
type OverrideRepository struct {
	mu       sync.Mutex
	records  map[string]*platformv1.OverrideRecord
	byTarget map[string][]string
}

func NewOverrideRepository() *OverrideRepository {
	return &OverrideRepository{
		records:  make(map[string]*platformv1.OverrideRecord),
		byTarget: make(map[string][]string),
	}
}

func (r *OverrideRepository) Append(ctx context.Context, record *platformv1.OverrideRecord) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if record == nil || record.GetHeader().GetContractId() == "" || record.GetTargetDecision() == "" {
		return fmt.Errorf("append override: incomplete record")
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	contractID := record.GetHeader().GetContractId()
	if _, exists := r.records[contractID]; exists {
		return fmt.Errorf("append override: %w", &platform.AppendOnlyError{ContractID: contractID})
	}
	r.records[contractID] = proto.Clone(record).(*platformv1.OverrideRecord)
	r.byTarget[record.GetTargetDecision()] = append(r.byTarget[record.GetTargetDecision()], contractID)
	return nil
}

func (r *OverrideRepository) ForDecision(ctx context.Context, target string) ([]*platformv1.OverrideRecord, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if target == "" {
		return nil, fmt.Errorf("list overrides: empty target decision")
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	records := make([]*platformv1.OverrideRecord, 0, len(r.byTarget[target]))
	for _, contractID := range r.byTarget[target] {
		records = append(records, proto.Clone(r.records[contractID]).(*platformv1.OverrideRecord))
	}
	return records, nil
}

// AppealRepository stores immutable appeals in append order by target.
type AppealRepository struct {
	mu       sync.Mutex
	records  map[string]*platformv1.Appeal
	byTarget map[string][]string
}

func NewAppealRepository() *AppealRepository {
	return &AppealRepository{
		records:  make(map[string]*platformv1.Appeal),
		byTarget: make(map[string][]string),
	}
}

func (r *AppealRepository) Append(ctx context.Context, appeal *platformv1.Appeal) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if appeal == nil || appeal.GetHeader().GetContractId() == "" || appeal.GetTargetDecision() == "" {
		return fmt.Errorf("append appeal: incomplete record")
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	contractID := appeal.GetHeader().GetContractId()
	if _, exists := r.records[contractID]; exists {
		return fmt.Errorf("append appeal: %w", &platform.AppendOnlyError{ContractID: contractID})
	}
	r.records[contractID] = proto.Clone(appeal).(*platformv1.Appeal)
	r.byTarget[appeal.GetTargetDecision()] = append(r.byTarget[appeal.GetTargetDecision()], contractID)
	return nil
}

func (r *AppealRepository) ForDecision(ctx context.Context, target string) ([]*platformv1.Appeal, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if target == "" {
		return nil, fmt.Errorf("list appeals: empty target decision")
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	records := make([]*platformv1.Appeal, 0, len(r.byTarget[target]))
	for _, contractID := range r.byTarget[target] {
		records = append(records, proto.Clone(r.records[contractID]).(*platformv1.Appeal))
	}
	return records, nil
}

var (
	_ spine.OverrideRepository = (*OverrideRepository)(nil)
	_ spine.AppealRepository   = (*AppealRepository)(nil)
)
