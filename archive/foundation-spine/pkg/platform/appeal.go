package platform

import platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"

// ValidateAppeal validates the common envelope, required appeal fields,
// lifecycle status, and reviewer independence from the decision owner.
func ValidateAppeal(appeal *platformv1.Appeal, authorizedHumanRef string) error {
	if err := ValidateEnvelope(appeal.GetHeader()); err != nil {
		return err
	}
	if appeal.GetAppellantRole() == "" {
		return &NamedFieldError{Field: "appellant_role"}
	}
	if appeal.GetTargetDecision() == "" {
		return &NamedFieldError{Field: "target_decision"}
	}
	if appeal.GetGrounds() == "" {
		return &NamedFieldError{Field: "grounds"}
	}
	if appeal.GetRequestedRemedy() == "" {
		return &NamedFieldError{Field: "requested_remedy"}
	}

	switch appeal.GetStatus() {
	case platformv1.AppealStatus_FILED,
		platformv1.AppealStatus_UNDER_REVIEW,
		platformv1.AppealStatus_RESOLVED,
		platformv1.AppealStatus_REOPENED,
		platformv1.AppealStatus_LATE:
	default:
		return &NamedFieldError{Field: "status"}
	}

	return AssertReviewerIndependent(appeal.GetIndependentReviewer(), authorizedHumanRef)
}

// AssertReviewerIndependent rejects a missing reviewer or one whose
// pseudonymous reference matches the decision's authorized human.
func AssertReviewerIndependent(reviewer *platformv1.ActorRef, authorizedHumanRef string) error {
	if reviewer.GetRef() == "" {
		return &NamedFieldError{Field: "independent_reviewer"}
	}
	if reviewer.GetRef() == authorizedHumanRef {
		return &ReviewerConflictError{Field: "independent_reviewer"}
	}
	return nil
}
