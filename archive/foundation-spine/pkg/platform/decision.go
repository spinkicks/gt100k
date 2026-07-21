package platform

import platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"

// ValidateDecisionRecord validates the common envelope and the human-authority
// invariants on a decision record.
func ValidateDecisionRecord(decision *platformv1.DecisionRecord) error {
	if err := ValidateEnvelope(decision.GetHeader()); err != nil {
		return err
	}

	authorizedHuman := decision.GetAuthorizedHuman()
	if authorizedHuman != nil {
		if err := AssertHumanAuthority(authorizedHuman); err != nil {
			return err
		}
	}
	if decision.GetConsequential() && authorizedHuman == nil {
		return &NamedFieldError{Field: "authorized_human"}
	}
	if decision.GetConsequential() && decision.GetPolicyVersion() == "" {
		return &NamedFieldError{Field: "policy_version"}
	}
	return nil
}

// AssertHumanAuthority requires a named actor in one of the human authority
// classes and rejects model, system, unspecified, or unknown classes.
func AssertHumanAuthority(actor *platformv1.ActorRef) error {
	if actor == nil {
		return &NamedFieldError{Field: "authorized_human"}
	}
	if actor.GetClass() == platformv1.ActorClass_MODEL || actor.GetClass() == platformv1.ActorClass_SYSTEM {
		return &AuthorityForgeryError{Field: "authorized_human"}
	}
	if actor.GetRef() == "" {
		return &NamedFieldError{Field: "authorized_human"}
	}
	switch actor.GetClass() {
	case platformv1.ActorClass_HUMAN,
		platformv1.ActorClass_GUARDIAN,
		platformv1.ActorClass_CHILD,
		platformv1.ActorClass_STAFF:
		return nil
	default:
		return &NamedFieldError{Field: "authorized_human"}
	}
}

// AssertAppendOnly rejects a contract identifier that is already present.
func AssertAppendOnly(existing map[string]bool, contractID string) error {
	if existing[contractID] {
		return &AppendOnlyError{ContractID: contractID}
	}
	return nil
}
