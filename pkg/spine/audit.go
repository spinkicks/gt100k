package spine

import (
	platform "github.com/gt100k/platform/pkg/platform"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

// AuditEntryInput contains the immutable facts recorded by NewAuditEntry.
type AuditEntryInput struct {
	EntryID string
	Header  *platformv1.Envelope
	Actor   *platformv1.ActorRef
	Action  string
	Policy  PolicyDecision
	Outcome string
}

// NewAuditEntry constructs and validates an audit record without retaining
// caller-owned Protobuf values.
func NewAuditEntry(input AuditEntryInput) (*platformv1.AuditEntry, error) {
	entry := &platformv1.AuditEntry{
		EntryId:       input.EntryID,
		Header:        cloneEnvelope(input.Header),
		ActorRef:      cloneActorOrNil(input.Actor),
		Action:        input.Action,
		PolicyAllow:   input.Policy.Allow,
		PolicyReason:  input.Policy.Reason,
		PolicyVersion: input.Policy.PolicyVersion,
		Outcome:       input.Outcome,
	}
	if err := ValidateAuditEntry(entry); err != nil {
		return nil, err
	}
	return entry, nil
}

// ValidateAuditEntry enforces the required append-only audit shape. Policy
// reason may be empty for lifecycle facts that were not produced by an
// authorization decision, but every entry carries the governing version.
func ValidateAuditEntry(entry *platformv1.AuditEntry) error {
	if entry.GetEntryId() == "" {
		return &platform.NamedFieldError{Field: "entry_id"}
	}
	if err := platform.ValidateEnvelope(entry.GetHeader()); err != nil {
		return err
	}
	if entry.GetActorRef() == nil {
		return &platform.NamedFieldError{Field: "actor_ref"}
	}
	if err := validateActor(entry.GetActorRef()); err != nil {
		return err
	}
	if entry.GetAction() == "" {
		return &platform.NamedFieldError{Field: "action"}
	}
	if entry.GetPolicyVersion() == "" {
		return &platform.NamedFieldError{Field: "policy_version"}
	}
	if entry.GetOutcome() == "" {
		return &platform.NamedFieldError{Field: "outcome"}
	}
	return nil
}

func cloneEnvelope(header *platformv1.Envelope) *platformv1.Envelope {
	if header == nil {
		return nil
	}
	return proto.Clone(header).(*platformv1.Envelope)
}

func cloneActorOrNil(actor *platformv1.ActorRef) *platformv1.ActorRef {
	if actor == nil {
		return nil
	}
	return proto.Clone(actor).(*platformv1.ActorRef)
}
