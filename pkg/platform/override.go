package platform

import platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"

// ValidateOverrideRecord validates the common envelope, required override
// fields, append-only target link, and human approval requirements.
func ValidateOverrideRecord(record *platformv1.OverrideRecord) error {
	if err := ValidateEnvelope(record.GetHeader()); err != nil {
		return err
	}
	if record.GetTargetDecision() == "" {
		return &NamedFieldError{Field: "target_decision"}
	}
	if record.GetOverrideClass() == "" {
		return &NamedFieldError{Field: "override_class"}
	}
	if record.GetPriorOutcome() == "" {
		return &NamedFieldError{Field: "prior_outcome"}
	}
	if record.GetNewOutcome() == "" {
		return &NamedFieldError{Field: "new_outcome"}
	}
	if record.GetAuthorizedRole() == "" {
		return &NamedFieldError{Field: "authorized_role"}
	}
	if record.GetRationale() == "" {
		return &NamedFieldError{Field: "rationale"}
	}
	if len(record.GetEvidenceRefs()) == 0 {
		return &NamedFieldError{Field: "evidence_refs"}
	}
	if record.GetReviewAt() == nil || record.GetReviewAt().CheckValid() != nil {
		return &NamedFieldError{Field: "review_at"}
	}
	if record.GetHeader().GetCausationId() != record.GetTargetDecision() {
		return &NamedFieldError{Field: "causation_id"}
	}
	if record.GetHeader().GetContractId() == record.GetTargetDecision() {
		return &NamedFieldError{Field: "contract_id"}
	}

	if requiresFourEyes(record.GetOverrideClass()) {
		return AssertFourEyes(record.GetApprovers())
	}

	for _, approver := range record.GetApprovers() {
		if err := assertHumanApprover(approver); err != nil {
			return err
		}
	}
	if len(record.GetApprovers()) != 1 {
		return &NamedFieldError{Field: "approvers"}
	}
	return nil
}

func requiresFourEyes(overrideClass string) bool {
	switch overrideClass {
	case "admissions", "public_exposure", "safeguarding", "credential_revocation":
		return true
	default:
		return false
	}
}

// AssertFourEyes requires at least two distinct named human approvers.
// Model or system actors are always reported as authority forgery, even when
// the approver set also fails the cardinality requirement.
func AssertFourEyes(approvers []*platformv1.ActorRef) error {
	distinct := make(map[string]struct{}, len(approvers))
	for _, approver := range approvers {
		if err := assertHumanApprover(approver); err != nil {
			return err
		}
		distinct[approver.GetRef()] = struct{}{}
	}
	if len(distinct) < 2 {
		return &FourEyesError{Have: len(distinct)}
	}
	return nil
}

func assertHumanApprover(approver *platformv1.ActorRef) error {
	if approver.GetClass() == platformv1.ActorClass_MODEL || approver.GetClass() == platformv1.ActorClass_SYSTEM {
		return &AuthorityForgeryError{Field: "approvers"}
	}
	if approver.GetRef() == "" {
		return &NamedFieldError{Field: "approvers"}
	}
	switch approver.GetClass() {
	case platformv1.ActorClass_HUMAN,
		platformv1.ActorClass_GUARDIAN,
		platformv1.ActorClass_CHILD,
		platformv1.ActorClass_STAFF:
		return nil
	default:
		return &NamedFieldError{Field: "approvers"}
	}
}
