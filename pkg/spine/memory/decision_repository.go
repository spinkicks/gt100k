package memory

import (
	"context"

	"github.com/gt100k/platform/pkg/spine"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
)

// DecisionRepository exposes the decision-only view of an in-memory Store.
// The separate type avoids Go's lack of overloaded Append methods while
// reusing the Store's validation, cloning, and append-only behavior.
type DecisionRepository struct {
	store *Store
}

func NewDecisionRepository() *DecisionRepository {
	return &DecisionRepository{store: NewStore()}
}

func (r *DecisionRepository) Append(ctx context.Context, decision *platformv1.DecisionRecord) error {
	return r.store.Commit(ctx, &spine.UnitOfWork{Decision: decision})
}

func (r *DecisionRepository) Get(ctx context.Context, contractID string) (*platformv1.DecisionRecord, error) {
	return r.store.Get(ctx, contractID)
}

var _ spine.DecisionRepository = (*DecisionRepository)(nil)
