package spine

import (
	"context"
	"fmt"

	platform "github.com/gt100k/platform/pkg/platform"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

// Command is the deterministic command-path input. Decision and Event are
// candidate contracts; HandleCommand clones them before recording policy data.
type Command struct {
	SessionRef   string
	Purpose      string
	SubjectRef   string
	Jurisdiction string
	Decision     *platformv1.DecisionRecord
	Event        *platformv1.LearnerEvent
}

// HandleResult distinguishes a recorded decision from a policy denial.
type HandleResult struct {
	Denied   bool
	Decision *platformv1.DecisionRecord
}

// HandleCommand resolves the pseudonymous actor, loads active consent,
// authorizes the command, and records either one denial audit or one atomic
// decision/event/audit unit of work.
func HandleCommand(ctx context.Context, deps CommandDeps, cmd Command) (HandleResult, error) {
	if err := validateCommandDeps(deps); err != nil {
		return HandleResult{}, err
	}
	if err := validateCommand(cmd); err != nil {
		return HandleResult{}, err
	}

	now := deps.Clock.Now()
	if now.IsZero() {
		return HandleResult{}, fmt.Errorf("handle command: clock returned zero time")
	}
	actor, err := deps.Identities.ResolveActor(ctx, cmd.SessionRef)
	if err != nil {
		return HandleResult{}, fmt.Errorf("handle command: resolve actor: %w", err)
	}
	if err := validateActor(actor); err != nil {
		return HandleResult{}, fmt.Errorf("handle command: invalid resolved actor: %w", err)
	}
	consents, err := deps.Consents.ActiveForSubject(ctx, cmd.SubjectRef, now)
	if err != nil {
		return HandleResult{}, fmt.Errorf("handle command: load active consent: %w", err)
	}

	policy, err := deps.Authorizer.Authorize(ctx, PolicyInput{
		Actor:        cloneActor(actor),
		Purpose:      cmd.Purpose,
		SubjectRef:   cmd.SubjectRef,
		Jurisdiction: cmd.Jurisdiction,
		At:           now,
		Consents:     cloneConsents(consents),
	})
	if err != nil {
		return HandleResult{}, fmt.Errorf("handle command: authorize: %w", err)
	}
	if err := validatePolicyDecision(policy); err != nil {
		return HandleResult{}, fmt.Errorf("handle command: %w", err)
	}

	decision := proto.Clone(cmd.Decision).(*platformv1.DecisionRecord)
	event := proto.Clone(cmd.Event).(*platformv1.LearnerEvent)
	applyPolicy(decision.GetHeader(), actor, cmd.Purpose, policy.PolicyVersion)
	applyPolicy(event.GetHeader(), actor, cmd.Purpose, policy.PolicyVersion)
	decision.PolicyVersion = policy.PolicyVersion

	if !policy.Allow {
		entry, err := commandAuditEntry(deps.IDs, decision.GetHeader(), actor, "policy_deny", policy, "denied")
		if err != nil {
			return HandleResult{}, fmt.Errorf("handle command: build denial audit: %w", err)
		}
		if err := deps.Audit.Append(ctx, entry); err != nil {
			return HandleResult{}, fmt.Errorf("handle command: append denial audit: %w", err)
		}
		return HandleResult{Denied: true}, nil
	}

	if err := platform.ValidateDecisionRecord(decision); err != nil {
		return HandleResult{}, fmt.Errorf("handle command: invalid decision: %w", err)
	}
	if err := platform.ValidateLearnerEvent(event); err != nil {
		return HandleResult{}, fmt.Errorf("handle command: invalid learner event: %w", err)
	}
	entry, err := commandAuditEntry(deps.IDs, decision.GetHeader(), actor, "decision", policy, decision.GetOutcome())
	if err != nil {
		return HandleResult{}, fmt.Errorf("handle command: build decision audit: %w", err)
	}
	unit := &UnitOfWork{
		Decision: decision,
		Events:   []*platformv1.LearnerEvent{event},
		Outbox: []*OutboxRow{{
			IdempotencyKey: event.GetHeader().GetContractId(),
			Event:          event,
			StagedAt:       now,
		}},
		Audit: []*platformv1.AuditEntry{entry},
	}
	if err := deps.Outbox.Commit(ctx, unit); err != nil {
		return HandleResult{}, fmt.Errorf("handle command: commit: %w", err)
	}
	return HandleResult{Decision: proto.Clone(decision).(*platformv1.DecisionRecord)}, nil
}

func validateCommandDeps(deps CommandDeps) error {
	switch {
	case deps.Identities == nil:
		return fmt.Errorf("handle command: nil identity resolver")
	case deps.Consents == nil:
		return fmt.Errorf("handle command: nil active consent source")
	case deps.Authorizer == nil:
		return fmt.Errorf("handle command: nil authorizer")
	case deps.Outbox == nil:
		return fmt.Errorf("handle command: nil outbox store")
	case deps.Audit == nil:
		return fmt.Errorf("handle command: nil audit log")
	case deps.Clock == nil:
		return fmt.Errorf("handle command: nil clock")
	case deps.IDs == nil:
		return fmt.Errorf("handle command: nil id generator")
	default:
		return nil
	}
}

func validateCommand(cmd Command) error {
	switch {
	case cmd.SessionRef == "":
		return fmt.Errorf("handle command: empty session ref")
	case cmd.Purpose == "":
		return fmt.Errorf("handle command: empty purpose")
	case cmd.SubjectRef == "":
		return fmt.Errorf("handle command: empty subject ref")
	case cmd.Jurisdiction == "":
		return fmt.Errorf("handle command: empty jurisdiction")
	case cmd.Decision == nil:
		return fmt.Errorf("handle command: nil decision")
	case cmd.Event == nil:
		return fmt.Errorf("handle command: nil learner event")
	}
	if err := platform.ValidateEnvelope(cmd.Decision.GetHeader()); err != nil {
		return fmt.Errorf("handle command: invalid decision envelope: %w", err)
	}
	if err := platform.AssertHumanAuthority(cmd.Decision.GetAuthorizedHuman()); err != nil {
		return fmt.Errorf("handle command: invalid human authorizer: %w", err)
	}
	if cmd.Decision.GetSubjectRef() != cmd.SubjectRef {
		return fmt.Errorf("handle command: decision subject %q does not match command subject %q", cmd.Decision.GetSubjectRef(), cmd.SubjectRef)
	}
	if cmd.Event.GetLearnerRef() != cmd.SubjectRef {
		return fmt.Errorf("handle command: event learner %q does not match command subject %q", cmd.Event.GetLearnerRef(), cmd.SubjectRef)
	}
	return nil
}

func validateActor(actor *platformv1.ActorRef) error {
	if actor.GetRef() == "" {
		return &platform.NamedFieldError{Field: "actor_ref.ref"}
	}
	if actor.GetRole() == "" {
		return &platform.NamedFieldError{Field: "actor_ref.role"}
	}
	switch actor.GetClass() {
	case platformv1.ActorClass_HUMAN,
		platformv1.ActorClass_GUARDIAN,
		platformv1.ActorClass_CHILD,
		platformv1.ActorClass_STAFF,
		platformv1.ActorClass_MODEL,
		platformv1.ActorClass_SYSTEM:
		return nil
	default:
		return &platform.NamedFieldError{Field: "actor_ref.class"}
	}
}

func validatePolicyDecision(decision PolicyDecision) error {
	if decision.Reason == "" {
		return fmt.Errorf("authorization decision has empty reason")
	}
	if decision.PolicyVersion == "" {
		return fmt.Errorf("authorization decision has empty policy version")
	}
	if decision.Allow && decision.Reason != "allow" {
		return fmt.Errorf("authorization allow has reason %q", decision.Reason)
	}
	if !decision.Allow && decision.Reason == "allow" {
		return fmt.Errorf("authorization deny has allow reason")
	}
	return nil
}

func commandAuditEntry(
	ids platform.IDGenerator,
	header *platformv1.Envelope,
	actor *platformv1.ActorRef,
	action string,
	policy PolicyDecision,
	outcome string,
) (*platformv1.AuditEntry, error) {
	entryID := ids.Next()
	if entryID == "" {
		return nil, fmt.Errorf("empty audit entry id")
	}
	return NewAuditEntry(AuditEntryInput{
		EntryID: entryID,
		Header:  header,
		Actor:   actor,
		Action:  action,
		Policy:  policy,
		Outcome: outcome,
	})
}

func applyPolicy(header *platformv1.Envelope, actor *platformv1.ActorRef, purpose, policyVersion string) {
	header.ActorRef = cloneActor(actor)
	header.ConsentPurpose = purpose
	header.PolicyVersion = policyVersion
}

func cloneActor(actor *platformv1.ActorRef) *platformv1.ActorRef {
	return proto.Clone(actor).(*platformv1.ActorRef)
}

func cloneConsents(consents []*platformv1.ConsentGrant) []*platformv1.ConsentGrant {
	cloned := make([]*platformv1.ConsentGrant, len(consents))
	for i, consent := range consents {
		cloned[i] = proto.Clone(consent).(*platformv1.ConsentGrant)
	}
	return cloned
}
