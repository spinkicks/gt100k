package identityconsent

import (
	"context"
	"errors"
	"sort"
	"sync"
	"testing"
	"time"

	"github.com/gt100k/platform/pkg/platform"
	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestWithdrawConsentRunsGoldenCascadeExactlyOnce(t *testing.T) {
	ctx := context.Background()
	repo := newMemoryConsentRepository()
	audit := &memoryAuditLog{}
	deletions := &recordingDeletionStarter{}
	ids := &sequenceIDGenerator{ids: []string{"audit_0001"}}
	grant := proto.Clone(fixtures.ConsentOnboarding).(*platformv1.ConsentGrant)

	if err := GrantConsent(ctx, repo, grant); err != nil {
		t.Fatalf("GrantConsent() error = %v", err)
	}
	before := authorizeStoredConsent(t, ctx, repo, grant, mustAuthzTime(t, fixtures.T0))
	if !before.Allow || before.Reason != "allow" {
		t.Fatalf("Authorize() before withdrawal = %+v, want allow", before)
	}

	withdrawnAt := mustAuthzTime(t, "2026-07-20T15:00:00Z")
	deps := ConsentDeps{
		Consents: repo,
		Audit:    audit,
		Deletion: deletions,
		IDs:      ids,
	}
	if err := WithdrawConsent(ctx, deps, grant.GetHeader().GetContractId(), withdrawnAt); err != nil {
		t.Fatalf("WithdrawConsent() error = %v", err)
	}

	stored := repo.mustGet(t, grant.GetHeader().GetContractId())
	if platform.IsConsentActive(stored, withdrawnAt.Add(time.Second)) {
		t.Fatal("IsConsentActive() = true after withdrawal, want false")
	}
	after := authorizeStoredConsent(t, ctx, repo, grant, withdrawnAt.Add(time.Second))
	if after.Allow || after.Reason != "no_active_consent" {
		t.Fatalf("Authorize() after withdrawal = %+v, want no_active_consent deny", after)
	}

	if err := WithdrawConsent(ctx, deps, grant.GetHeader().GetContractId(), withdrawnAt); err != nil {
		t.Fatalf("repeated WithdrawConsent() error = %v", err)
	}
	if got := deletions.subjects(); len(got) != 1 || got[0] != fixtures.EligibleLearner.GetLearnerRef() {
		t.Fatalf("DeletionStarter.Start() subjects = %v, want [%q]", got, fixtures.EligibleLearner.GetLearnerRef())
	}
	entries := audit.all()
	if len(entries) != 1 {
		t.Fatalf("audit entries = %d, want 1", len(entries))
	}
	entry := entries[0]
	if entry.GetEntryId() != "audit_0001" {
		t.Errorf("audit entry_id = %q, want audit_0001", entry.GetEntryId())
	}
	if entry.GetAction() != "consent_withdrawn" {
		t.Errorf("audit action = %q, want consent_withdrawn", entry.GetAction())
	}
	if entry.GetOutcome() != "withdrawn" {
		t.Errorf("audit outcome = %q, want withdrawn", entry.GetOutcome())
	}
	if entry.GetPolicyVersion() != fixtures.PolicyVersion {
		t.Errorf("audit policy_version = %q, want %q", entry.GetPolicyVersion(), fixtures.PolicyVersion)
	}
	if !proto.Equal(entry.GetHeader(), stored.GetHeader()) {
		t.Error("audit header does not preserve the withdrawn consent envelope")
	}
	if !proto.Equal(entry.GetActorRef(), stored.GetHeader().GetActorRef()) {
		t.Error("audit actor_ref does not preserve the consent actor")
	}
}

func TestGrantConsentRejectsInvalidGrantBeforePersistence(t *testing.T) {
	repo := newMemoryConsentRepository()
	grant := proto.Clone(fixtures.ConsentOnboarding).(*platformv1.ConsentGrant)
	grant.Purpose = ""

	err := GrantConsent(context.Background(), repo, grant)
	var fieldErr *platform.NamedFieldError
	if !errors.As(err, &fieldErr) || fieldErr.Field != "purpose" {
		t.Fatalf("GrantConsent() error = %v, want *NamedFieldError for purpose", err)
	}
	if repo.count() != 0 {
		t.Fatalf("stored grants = %d, want 0", repo.count())
	}
}

func authorizeStoredConsent(
	t *testing.T,
	ctx context.Context,
	repo *memoryConsentRepository,
	grant *platformv1.ConsentGrant,
	at time.Time,
) PolicyDecision {
	t.Helper()

	consents := repo.activeForSubject(grant.GetSubjectRef(), at)
	decision, err := Authorize(ctx, PolicyInput{
		Actor:        proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
		Purpose:      grant.GetPurpose(),
		SubjectRef:   grant.GetSubjectRef(),
		Jurisdiction: grant.GetJurisdiction(),
		At:           at,
		Consents:     consents,
	})
	if err != nil {
		t.Fatalf("Authorize() error = %v", err)
	}
	return decision
}

type memoryConsentRepository struct {
	mu     sync.Mutex
	grants map[string]*platformv1.ConsentGrant
}

func newMemoryConsentRepository() *memoryConsentRepository {
	return &memoryConsentRepository{grants: make(map[string]*platformv1.ConsentGrant)}
}

func (r *memoryConsentRepository) Put(_ context.Context, grant *platformv1.ConsentGrant) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	id := grant.GetHeader().GetContractId()
	if _, exists := r.grants[id]; exists {
		return errors.New("consent already exists")
	}
	r.grants[id] = proto.Clone(grant).(*platformv1.ConsentGrant)
	return nil
}

func (r *memoryConsentRepository) Withdraw(
	_ context.Context,
	contractID string,
	at time.Time,
) (*platformv1.ConsentGrant, bool, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	grant, exists := r.grants[contractID]
	if !exists {
		return nil, false, errors.New("consent not found")
	}
	if grant.GetWithdrawalState().GetWithdrawn() {
		return proto.Clone(grant).(*platformv1.ConsentGrant), false, nil
	}
	grant.WithdrawalState = &platformv1.WithdrawalState{
		Withdrawn:   true,
		WithdrawnAt: timestamppb.New(at),
	}
	return proto.Clone(grant).(*platformv1.ConsentGrant), true, nil
}

func (r *memoryConsentRepository) ActiveForSubject(
	ctx context.Context,
	subjectRef string,
	at time.Time,
) ([]*platformv1.ConsentGrant, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	var active []*platformv1.ConsentGrant
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

func (r *memoryConsentRepository) mustGet(t *testing.T, contractID string) *platformv1.ConsentGrant {
	t.Helper()
	r.mu.Lock()
	defer r.mu.Unlock()

	grant, exists := r.grants[contractID]
	if !exists {
		t.Fatalf("consent %q not found", contractID)
	}
	return proto.Clone(grant).(*platformv1.ConsentGrant)
}

func (r *memoryConsentRepository) activeForSubject(subjectRef string, at time.Time) []*platformv1.ConsentGrant {
	active, err := r.ActiveForSubject(context.Background(), subjectRef, at)
	if err != nil {
		panic(err)
	}
	return active
}

func (r *memoryConsentRepository) count() int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return len(r.grants)
}

type memoryAuditLog struct {
	mu      sync.Mutex
	entries []*platformv1.AuditEntry
}

func (l *memoryAuditLog) Append(_ context.Context, entry *platformv1.AuditEntry) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.entries = append(l.entries, proto.Clone(entry).(*platformv1.AuditEntry))
	return nil
}

func (l *memoryAuditLog) All(ctx context.Context) ([]*platformv1.AuditEntry, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	l.mu.Lock()
	defer l.mu.Unlock()

	entries := make([]*platformv1.AuditEntry, len(l.entries))
	for i, entry := range l.entries {
		entries[i] = proto.Clone(entry).(*platformv1.AuditEntry)
	}
	return entries, nil
}

func (l *memoryAuditLog) all() []*platformv1.AuditEntry {
	entries, err := l.All(context.Background())
	if err != nil {
		panic(err)
	}
	return entries
}

type recordingDeletionStarter struct {
	mu      sync.Mutex
	started []string
}

func (s *recordingDeletionStarter) Start(_ context.Context, subjectRef string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.started = append(s.started, subjectRef)
	return nil
}

func (s *recordingDeletionStarter) subjects() []string {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]string(nil), s.started...)
}

type sequenceIDGenerator struct {
	ids []string
}

func (g *sequenceIDGenerator) Next() string {
	id := g.ids[0]
	g.ids = g.ids[1:]
	return id
}
