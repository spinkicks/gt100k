package spine_test

import (
	"context"
	"errors"
	"testing"
	"time"

	platform "github.com/gt100k/platform/pkg/platform"
	"github.com/gt100k/platform/pkg/platform/fixtures"
	"github.com/gt100k/platform/pkg/spine"
	"github.com/gt100k/platform/pkg/spine/memory"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

func TestHandleCommandCommitsAuthorizedDecisionOutboxAndAudit(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	store := memory.NewStore()
	authorizer := &recordingAuthorizer{decision: spine.PolicyDecision{
		Allow:         true,
		Reason:        "allow",
		PolicyVersion: fixtures.PolicyVersion,
	}}
	deps := commandDeps(store, authorizer, []*platformv1.ConsentGrant{fixtures.ConsentOnboarding})
	cmd := syntheticCommand("authorized")

	result, err := spine.HandleCommand(ctx, deps, cmd)
	if err != nil {
		t.Fatalf("HandleCommand() error = %v, want nil", err)
	}
	if result.Denied {
		t.Fatal("HandleCommand().Denied = true, want false")
	}
	if result.Decision == nil {
		t.Fatal("HandleCommand().Decision = nil, want committed decision")
	}

	stored, err := store.Get(ctx, cmd.Decision.GetHeader().GetContractId())
	if err != nil {
		t.Fatalf("store.Get(decision) error = %v, want nil", err)
	}
	if !proto.Equal(stored, result.Decision) {
		t.Fatalf("store.Get(decision) = %v, want %v", stored, result.Decision)
	}
	pending, err := store.Pending(ctx)
	if err != nil {
		t.Fatalf("store.Pending() error = %v", err)
	}
	if got, want := len(pending), 1; got != want {
		t.Fatalf("len(store.Pending()) = %d, want %d", got, want)
	}
	if got, want := pending[0].IdempotencyKey, cmd.Event.GetHeader().GetContractId(); got != want {
		t.Fatalf("pending idempotency key = %q, want %q", got, want)
	}
	if !proto.Equal(pending[0].Event, cmd.Event) {
		t.Fatalf("pending event = %v, want %v", pending[0].Event, cmd.Event)
	}

	entries, err := store.All(ctx)
	if err != nil {
		t.Fatalf("store.All() error = %v", err)
	}
	if got, want := len(entries), 1; got != want {
		t.Fatalf("len(store.All()) = %d, want %d", got, want)
	}
	assertAudit(t, entries[0], auditWant{
		entryID:     "audit_authorized",
		action:      "decision",
		policyAllow: true,
		reason:      "allow",
		outcome:     cmd.Decision.GetOutcome(),
	})
	if got := len(authorizer.lastInput.Consents); got != 1 {
		t.Fatalf("Authorize input active consents = %d, want 1", got)
	}
	if got, want := authorizer.lastInput.Actor.GetRef(), fixtures.StaffGuide.GetRef(); got != want {
		t.Fatalf("Authorize input actor ref = %q, want %q", got, want)
	}
}

func TestHandleCommandDenialWritesOneAuditAndNoBusinessState(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	store := memory.NewStore()
	authorizer := &recordingAuthorizer{decision: spine.PolicyDecision{
		Reason:        "no_active_consent",
		PolicyVersion: fixtures.PolicyVersion,
	}}
	deps := commandDeps(store, authorizer, nil)
	deps.IDs = &sequenceIDs{ids: []string{"audit_denied"}}
	cmd := syntheticCommand("denied")

	result, err := spine.HandleCommand(ctx, deps, cmd)
	if err != nil {
		t.Fatalf("HandleCommand() error = %v, want nil", err)
	}
	if !result.Denied {
		t.Fatal("HandleCommand().Denied = false, want true")
	}
	if result.Decision != nil {
		t.Fatalf("HandleCommand().Decision = %v, want nil", result.Decision)
	}
	if _, err := store.Get(ctx, cmd.Decision.GetHeader().GetContractId()); err == nil {
		t.Fatal("store.Get(denied decision) error = nil, want not found")
	}
	pending, err := store.Pending(ctx)
	if err != nil {
		t.Fatalf("store.Pending() error = %v", err)
	}
	if got := len(pending); got != 0 {
		t.Fatalf("len(store.Pending()) = %d, want 0", got)
	}
	entries, err := store.All(ctx)
	if err != nil {
		t.Fatalf("store.All() error = %v", err)
	}
	if got, want := len(entries), 1; got != want {
		t.Fatalf("len(store.All()) = %d, want %d", got, want)
	}
	assertAudit(t, entries[0], auditWant{
		entryID: "audit_denied",
		action:  "policy_deny",
		reason:  "no_active_consent",
		outcome: "denied",
	})
	if got := len(authorizer.lastInput.Consents); got != 0 {
		t.Fatalf("Authorize input active consents = %d, want 0", got)
	}
}

func TestAuditLogIsAppendOnlyAndReplayReturnsIndependentRecords(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	store := memory.NewStore()
	authorizer := &recordingAuthorizer{decision: spine.PolicyDecision{
		Reason:        "deny_by_default",
		PolicyVersion: fixtures.PolicyVersion,
	}}
	deps := commandDeps(store, authorizer, nil)
	deps.IDs = &sequenceIDs{ids: []string{"audit_replay"}}
	if _, err := spine.HandleCommand(ctx, deps, syntheticCommand("replay")); err != nil {
		t.Fatalf("HandleCommand() error = %v", err)
	}

	firstReplay, err := store.All(ctx)
	if err != nil {
		t.Fatalf("store.All() error = %v", err)
	}
	firstReplay[0].Action = "tampered"
	firstReplay[0].Header.TenantId = "other-tenant"
	firstReplay[0].ActorRef.Ref = "other-actor"

	secondReplay, err := store.All(ctx)
	if err != nil {
		t.Fatalf("store.All() second replay error = %v", err)
	}
	assertAudit(t, secondReplay[0], auditWant{
		entryID: "audit_replay",
		action:  "policy_deny",
		reason:  "deny_by_default",
		outcome: "denied",
	})
	if err := store.Append(ctx, secondReplay[0]); err == nil {
		t.Fatal("store.Append(duplicate audit) error = nil, want append-only error")
	} else {
		var appendOnly *platform.AppendOnlyError
		if !errors.As(err, &appendOnly) {
			t.Fatalf("store.Append(duplicate audit) error = %T, want *platform.AppendOnlyError", err)
		}
	}
	finalReplay, err := store.All(ctx)
	if err != nil {
		t.Fatalf("store.All() final replay error = %v", err)
	}
	if got, want := len(finalReplay), 1; got != want {
		t.Fatalf("len(store.All()) after duplicate = %d, want %d", got, want)
	}
}

func syntheticCommand(id string) spine.Command {
	decision := decisionRecord("decision_"+id, "2026-07-20T14:05:00Z")
	event := learnerEvent("event_"+id, "2026-07-20T14:05:00Z")
	event.Header.CausationId = decision.GetHeader().GetContractId()
	return spine.Command{
		SessionRef:   "session_synth_001",
		Purpose:      "onboarding.schedule",
		SubjectRef:   fixtures.EligibleLearner.GetLearnerRef(),
		Jurisdiction: "US-CA",
		Decision:     decision,
		Event:        event,
	}
}

func commandDeps(
	store *memory.Store,
	authorizer *recordingAuthorizer,
	consents []*platformv1.ConsentGrant,
) spine.CommandDeps {
	return spine.CommandDeps{
		Identities: memory.NewIdentityRepository(map[string]*platformv1.ActorRef{
			"session_synth_001": fixtures.StaffGuide,
		}),
		Consents:   memory.NewConsentRepository(consents),
		Authorizer: authorizer,
		Outbox:     store,
		Audit:      store,
		Clock:      fixedCommandClock{now: mustTime("2026-07-20T14:05:00Z")},
		IDs:        &sequenceIDs{ids: []string{"audit_authorized"}},
	}
}

type recordingAuthorizer struct {
	decision  spine.PolicyDecision
	lastInput spine.PolicyInput
}

func (a *recordingAuthorizer) Authorize(_ context.Context, input spine.PolicyInput) (spine.PolicyDecision, error) {
	a.lastInput = input
	return a.decision, nil
}

type fixedCommandClock struct {
	now time.Time
}

func (c fixedCommandClock) Now() time.Time {
	return c.now
}

type sequenceIDs struct {
	ids []string
}

func (g *sequenceIDs) Next() string {
	if len(g.ids) == 0 {
		return ""
	}
	next := g.ids[0]
	g.ids = g.ids[1:]
	return next
}

type auditWant struct {
	entryID     string
	action      string
	policyAllow bool
	reason      string
	outcome     string
}

func assertAudit(t *testing.T, got *platformv1.AuditEntry, want auditWant) {
	t.Helper()
	if got.GetEntryId() != want.entryID {
		t.Errorf("audit.entry_id = %q, want %q", got.GetEntryId(), want.entryID)
	}
	if got.GetAction() != want.action {
		t.Errorf("audit.action = %q, want %q", got.GetAction(), want.action)
	}
	if got.GetPolicyAllow() != want.policyAllow {
		t.Errorf("audit.policy_allow = %t, want %t", got.GetPolicyAllow(), want.policyAllow)
	}
	if got.GetPolicyReason() != want.reason {
		t.Errorf("audit.policy_reason = %q, want %q", got.GetPolicyReason(), want.reason)
	}
	if got.GetPolicyVersion() != fixtures.PolicyVersion {
		t.Errorf("audit.policy_version = %q, want %q", got.GetPolicyVersion(), fixtures.PolicyVersion)
	}
	if got.GetOutcome() != want.outcome {
		t.Errorf("audit.outcome = %q, want %q", got.GetOutcome(), want.outcome)
	}
	if got.GetHeader().GetTenantId() != fixtures.Tenant {
		t.Errorf("audit.header.tenant_id = %q, want %q", got.GetHeader().GetTenantId(), fixtures.Tenant)
	}
	if got.GetActorRef().GetRef() != fixtures.StaffGuide.GetRef() {
		t.Errorf("audit.actor_ref.ref = %q, want %q", got.GetActorRef().GetRef(), fixtures.StaffGuide.GetRef())
	}
}
