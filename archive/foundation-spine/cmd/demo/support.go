package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/gt100k/platform/pkg/platform"
	"github.com/gt100k/platform/pkg/platform/fixtures"
	"github.com/gt100k/platform/pkg/spine"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	identityconsent "github.com/gt100k/platform/services/identity-consent"
	"github.com/gt100k/platform/workflows/deletion"
	"go.temporal.io/sdk/activity"
	"go.temporal.io/sdk/testsuite"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type fixedClock struct{ at time.Time }

func (c fixedClock) Now() time.Time { return c.at }

type sequenceIDs struct{ next int }

func newSequenceIDs() *sequenceIDs             { return newSequenceIDsFrom(1) }
func newSequenceIDsFrom(next int) *sequenceIDs { return &sequenceIDs{next: next} }
func (g *sequenceIDs) Next() string {
	id := fmt.Sprintf("audit_demo_%02d", g.next)
	g.next++
	return id
}

type opaAuthorizer struct{}

func (opaAuthorizer) Authorize(ctx context.Context, input spine.PolicyInput) (spine.PolicyDecision, error) {
	return identityconsent.Authorize(ctx, input)
}

type demoIdentityRepository struct {
	sessions map[string]*platformv1.ActorRef
}

func newDemoIdentityRepository() *demoIdentityRepository {
	return &demoIdentityRepository{sessions: map[string]*platformv1.ActorRef{
		demoSession: proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
	}}
}

func (*demoIdentityRepository) Provision(context.Context, *platformv1.EligibleLearner) (*platformv1.ActorRef, error) {
	return proto.Clone(fixtures.Child).(*platformv1.ActorRef), nil
}

func (r *demoIdentityRepository) ResolveActor(_ context.Context, session string) (*platformv1.ActorRef, error) {
	actor, ok := r.sessions[session]
	if !ok {
		return nil, fmt.Errorf("session %q not found", session)
	}
	return proto.Clone(actor).(*platformv1.ActorRef), nil
}

type demoConsentRepository struct {
	mu     sync.Mutex
	grants map[string]*platformv1.ConsentGrant
}

func newDemoConsentRepository() *demoConsentRepository {
	return &demoConsentRepository{grants: make(map[string]*platformv1.ConsentGrant)}
}

func (r *demoConsentRepository) Put(_ context.Context, grant *platformv1.ConsentGrant) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	id := grant.GetHeader().GetContractId()
	if _, exists := r.grants[id]; exists {
		return &platform.AppendOnlyError{ContractID: id}
	}
	r.grants[id] = proto.Clone(grant).(*platformv1.ConsentGrant)
	return nil
}

func (r *demoConsentRepository) ActiveForSubject(_ context.Context, subject string, at time.Time) ([]*platformv1.ConsentGrant, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	var active []*platformv1.ConsentGrant
	for _, grant := range r.grants {
		if grant.GetSubjectRef() == subject && platform.IsConsentActive(grant, at) {
			active = append(active, proto.Clone(grant).(*platformv1.ConsentGrant))
		}
	}
	return active, nil
}

func (r *demoConsentRepository) Withdraw(_ context.Context, id string, at time.Time) (*platformv1.ConsentGrant, bool, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	grant, ok := r.grants[id]
	if !ok {
		return nil, false, fmt.Errorf("consent %q not found", id)
	}
	if grant.GetWithdrawalState().GetWithdrawn() {
		return proto.Clone(grant).(*platformv1.ConsentGrant), false, nil
	}
	grant.WithdrawalState = &platformv1.WithdrawalState{Withdrawn: true, WithdrawnAt: timestamppb.New(at)}
	return proto.Clone(grant).(*platformv1.ConsentGrant), true, nil
}

type demoAssentRepository struct {
	records map[string]*platformv1.AssentRecord
}

func newDemoAssentRepository() *demoAssentRepository {
	return &demoAssentRepository{records: make(map[string]*platformv1.AssentRecord)}
}

func (r *demoAssentRepository) Put(_ context.Context, record *platformv1.AssentRecord) error {
	id := record.GetHeader().GetContractId()
	if _, exists := r.records[id]; exists {
		return &platform.AppendOnlyError{ContractID: id}
	}
	r.records[id] = proto.Clone(record).(*platformv1.AssentRecord)
	return nil
}

func (r *demoAssentRepository) ForChild(_ context.Context, child string) ([]*platformv1.AssentRecord, error) {
	var records []*platformv1.AssentRecord
	for _, record := range r.records {
		if record.GetChildRef() == child {
			records = append(records, proto.Clone(record).(*platformv1.AssentRecord))
		}
	}
	return records, nil
}

type demoDeletionStarter struct {
	result deletion.WorkflowResult
}

func newDemoDeletionStarter() *demoDeletionStarter { return &demoDeletionStarter{} }

func (s *demoDeletionStarter) Start(_ context.Context, subject string) error {
	backend := &demoDeletionBackend{seen: make(map[string]struct{})}
	activities := &deletion.Activities{Backend: backend}
	var suite testsuite.WorkflowTestSuite
	suite.SetLogger(silentLogger{})
	env := suite.NewTestWorkflowEnvironment()
	env.RegisterActivityWithOptions(activities.ErasePostgres, activity.RegisterOptions{Name: deletion.ActivityErasePostgres})
	env.RegisterActivityWithOptions(activities.DeleteS3Objects, activity.RegisterOptions{Name: deletion.ActivityDeleteS3Objects})
	env.RegisterActivityWithOptions(activities.ClearRedis, activity.RegisterOptions{Name: deletion.ActivityClearRedis})
	env.RegisterActivityWithOptions(activities.CryptoShred, activity.RegisterOptions{Name: deletion.ActivityCryptoShred})
	env.RegisterActivityWithOptions(activities.RecordDeletionAudit, activity.RegisterOptions{Name: deletion.ActivityRecordDeletionAudit})
	env.ExecuteWorkflow(deletion.DeletionWorkflow, deletion.WorkflowInput{SubjectRef: subject})
	if !env.IsWorkflowCompleted() {
		return fmt.Errorf("workflow did not complete")
	}
	if err := env.GetWorkflowError(); err != nil {
		return err
	}
	if err := env.GetWorkflowResult(&s.result); err != nil {
		return err
	}
	if !backend.deletionAuditPreserved() {
		return fmt.Errorf("deletion audit was not preserved")
	}
	return nil
}

type silentLogger struct{}

func (silentLogger) Debug(string, ...interface{}) {}
func (silentLogger) Info(string, ...interface{})  {}
func (silentLogger) Warn(string, ...interface{})  {}
func (silentLogger) Error(string, ...interface{}) {}

type demoDeletionBackend struct {
	mu             sync.Mutex
	seen           map[string]struct{}
	auditPreserved bool
}

func (b *demoDeletionBackend) Apply(_ context.Context, operation string, input deletion.ActivityInput) error {
	b.mu.Lock()
	defer b.mu.Unlock()
	if _, exists := b.seen[input.IdempotencyKey]; exists {
		return nil
	}
	b.seen[input.IdempotencyKey] = struct{}{}
	if operation == deletion.OperationRecordDeletionAudit {
		b.auditPreserved = true
	}
	return nil
}

func (b *demoDeletionBackend) deletionAuditPreserved() bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.auditPreserved
}

func demoTime() time.Time {
	return time.Date(2026, time.July, 20, 14, 3, 11, 0, time.UTC)
}

func demoHeader(id, schema, cause string) *platformv1.Envelope {
	header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
	header.ContractId, header.SchemaVersion, header.CausationId = id, schema, cause
	return header
}

func demoAssent() *platformv1.AssentRecord {
	return &platformv1.AssentRecord{
		Header:   demoHeader("cid_assent_demo", "assent_record/1", fixtures.ConsentOnboarding.GetHeader().GetContractId()),
		ChildRef: fixtures.Child.GetRef(), AgeBand: "13-15", NoticeVersion: "plain-language-notice/1",
		ChoicesShown: []string{"assent", "refuse", "ask_questions"}, Response: platformv1.AssentResponse_ASSENT,
		Facilitator: proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
		RecordedAt:  timestamppb.New(demoTime()), Honorable: true,
	}
}

func demoCommand() spine.Command {
	decisionHeader := demoHeader("cid_decision_demo", "decision_record/1", fixtures.ConsentOnboarding.GetHeader().GetContractId())
	decision := &platformv1.DecisionRecord{
		Header: decisionHeader, DecisionType: "synthetic.pathway_recommendation",
		SubjectRef: fixtures.EligibleLearner.GetLearnerRef(), Candidates: []string{"route_A", "route_B"},
		Outcome: "route_A", ReasonCodes: []string{"synthetic_evidence_supported"},
		EvidenceSnapshot: []string{"evidence://fixture/synth_001#sha256:dd44"}, Uncertainty: 0.1,
		PolicyVersion: fixtures.PolicyVersion, ModelVersion: "model/synthetic-v1",
		AuthorizedHuman: proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
		EffectiveAt:     timestamppb.New(demoTime()), Consequential: true,
	}
	event := &platformv1.LearnerEvent{
		Header:    demoHeader("cid_event_demo", "learner_event/1", decisionHeader.GetContractId()),
		EventType: "pathway.recommended", LearnerRef: fixtures.EligibleLearner.GetLearnerRef(),
		Source: "foundation-demo", PayloadSchema: "pathway.recommended/1",
		EvidenceRefs: []string{"evidence://fixture/synth_001#sha256:dd44"},
	}
	return spine.Command{SessionRef: demoSession, Purpose: "onboarding.schedule",
		SubjectRef: fixtures.EligibleLearner.GetLearnerRef(), Jurisdiction: "US-CA", Decision: decision, Event: event}
}

func demoOverride(target *platformv1.DecisionRecord) *platformv1.OverrideRecord {
	return &platformv1.OverrideRecord{
		Header:         demoHeader("cid_override_demo", "override/1", target.GetHeader().GetContractId()),
		TargetDecision: target.GetHeader().GetContractId(), OverrideClass: "admissions",
		PriorOutcome: target.GetOutcome(), NewOutcome: "route_B", AuthorizedRole: "admissions_lead",
		Rationale: "synthetic corrected evidence", EvidenceRefs: []string{"evidence://override/synth_001#sha256:ee55"},
		Approvers: []*platformv1.ActorRef{proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef), proto.Clone(fixtures.StaffGuide2).(*platformv1.ActorRef)},
		ReviewAt:  timestamppb.New(demoTime().Add(time.Minute)),
	}
}

func demoAppeal(target *platformv1.DecisionRecord) *platformv1.Appeal {
	return &platformv1.Appeal{
		Header:        demoHeader("cid_appeal_demo", "appeal/1", target.GetHeader().GetContractId()),
		AppellantRole: "guardian", TargetDecision: target.GetHeader().GetContractId(), Grounds: "synthetic new evidence",
		SubmittedEvidenceRefs: []string{"evidence://appeal/synth_001#sha256:ff66"}, RequestedRemedy: "re-review",
		Status: platformv1.AppealStatus_FILED, IndependentReviewer: proto.Clone(fixtures.StaffGuide2).(*platformv1.ActorRef),
		Deadlines: &platformv1.Deadlines{RespondBy: timestamppb.New(demoTime().Add(24 * time.Hour))},
	}
}

func assertTargetPreserved(ctx context.Context, decisions spine.DecisionRepository, want *platformv1.DecisionRecord) error {
	got, err := decisions.Get(ctx, want.GetHeader().GetContractId())
	if err != nil {
		return err
	}
	if !proto.Equal(got, want) {
		return fmt.Errorf("target decision changed")
	}
	return nil
}

var (
	_ spine.IdentityRepository = (*demoIdentityRepository)(nil)
	_ spine.ConsentRepository  = (*demoConsentRepository)(nil)
	_ spine.AssentRepository   = (*demoAssentRepository)(nil)
	_ spine.DeletionStarter    = (*demoDeletionStarter)(nil)
)
