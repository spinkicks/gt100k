package memory

import (
	"context"
	"fmt"
	"sort"
	"sync"
	"time"

	platform "github.com/gt100k/platform/pkg/platform"
	"github.com/gt100k/platform/pkg/spine"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

// IdentityRepository is the hermetic pseudonymous session lookup used by the
// command-path acceptance suite.
type IdentityRepository struct {
	mu       sync.Mutex
	sessions map[string]*platformv1.ActorRef
}

func NewIdentityRepository(sessions map[string]*platformv1.ActorRef) *IdentityRepository {
	cloned := make(map[string]*platformv1.ActorRef, len(sessions))
	for sessionRef, actor := range sessions {
		cloned[sessionRef] = proto.Clone(actor).(*platformv1.ActorRef)
	}
	return &IdentityRepository{sessions: cloned}
}

func (r *IdentityRepository) ResolveActor(ctx context.Context, sessionRef string) (*platformv1.ActorRef, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	actor, ok := r.sessions[sessionRef]
	if !ok {
		return nil, fmt.Errorf("session %q not found", sessionRef)
	}
	return proto.Clone(actor).(*platformv1.ActorRef), nil
}

// ConsentRepository is the hermetic active-grant reader used by the command
// path. The full mutation surface is added with the remaining T034 ports.
type ConsentRepository struct {
	mu     sync.Mutex
	grants []*platformv1.ConsentGrant
}

func NewConsentRepository(grants []*platformv1.ConsentGrant) *ConsentRepository {
	cloned := make([]*platformv1.ConsentGrant, len(grants))
	for i, grant := range grants {
		cloned[i] = proto.Clone(grant).(*platformv1.ConsentGrant)
	}
	return &ConsentRepository{grants: cloned}
}

func (r *ConsentRepository) ActiveForSubject(
	ctx context.Context,
	subjectRef string,
	at time.Time,
) ([]*platformv1.ConsentGrant, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	active := make([]*platformv1.ConsentGrant, 0, len(r.grants))
	for _, grant := range r.grants {
		if grant.GetSubjectRef() == subjectRef && platform.IsConsentActive(grant, at) {
			active = append(active, proto.Clone(grant).(*platformv1.ConsentGrant))
		}
	}
	sort.Slice(active, func(i, j int) bool {
		return active[i].GetHeader().GetContractId() < active[j].GetHeader().GetContractId()
	})
	return active, nil
}

var (
	_ spine.IdentityResolver    = (*IdentityRepository)(nil)
	_ spine.ActiveConsentSource = (*ConsentRepository)(nil)
)
