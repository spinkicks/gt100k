package platform

import (
	"errors"
	"testing"
	"time"

	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestValidateAppealAcceptsGoldenIndependentReviewerAndPreservesTarget(t *testing.T) {
	target := appealTargetDecision()
	targetBefore := proto.Clone(target).(*platformv1.DecisionRecord)
	appeal := validAppeal(target)

	if err := ValidateAppeal(appeal, target.GetAuthorizedHuman().GetRef()); err != nil {
		t.Fatalf("ValidateAppeal() error = %v, want nil", err)
	}
	if !proto.Equal(target, targetBefore) {
		t.Fatalf("target decision changed:\n got: %v\nwant: %v", target, targetBefore)
	}
}

func TestValidateAppealAcceptsGoldenLifecycleStatuses(t *testing.T) {
	statuses := []platformv1.AppealStatus{
		platformv1.AppealStatus_FILED,
		platformv1.AppealStatus_REOPENED,
		platformv1.AppealStatus_LATE,
	}

	for _, status := range statuses {
		t.Run(status.String(), func(t *testing.T) {
			target := appealTargetDecision()
			appeal := validAppeal(target)
			appeal.Status = status

			if err := ValidateAppeal(appeal, target.GetAuthorizedHuman().GetRef()); err != nil {
				t.Fatalf("ValidateAppeal(status %s) error = %v, want nil", status, err)
			}
		})
	}
}

func TestValidateAppealRejectsGoldenReviewerConflict(t *testing.T) {
	target := appealTargetDecision()
	appeal := validAppeal(target)
	appeal.IndependentReviewer = proto.Clone(target.GetAuthorizedHuman()).(*platformv1.ActorRef)

	assertReviewerConflictError(
		t,
		ValidateAppeal(appeal, target.GetAuthorizedHuman().GetRef()),
		"independent_reviewer",
	)
}

func TestValidateAppealRejectsInvalidStatus(t *testing.T) {
	tests := []struct {
		name   string
		status platformv1.AppealStatus
	}{
		{"unspecified", platformv1.AppealStatus_APPEAL_STATUS_UNSPECIFIED},
		{"out of enum", platformv1.AppealStatus(99)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			target := appealTargetDecision()
			appeal := validAppeal(target)
			appeal.Status = tt.status

			assertNamedFieldError(
				t,
				ValidateAppeal(appeal, target.GetAuthorizedHuman().GetRef()),
				"status",
			)
		})
	}
}

func TestValidateAppealRequiresCompleteRecord(t *testing.T) {
	tests := []struct {
		name   string
		field  string
		mutate func(*platformv1.Appeal)
	}{
		{"envelope", "contract_id", func(appeal *platformv1.Appeal) { appeal.Header.ContractId = "" }},
		{"appellant role", "appellant_role", func(appeal *platformv1.Appeal) { appeal.AppellantRole = "" }},
		{"target decision", "target_decision", func(appeal *platformv1.Appeal) { appeal.TargetDecision = "" }},
		{"grounds", "grounds", func(appeal *platformv1.Appeal) { appeal.Grounds = "" }},
		{"requested remedy", "requested_remedy", func(appeal *platformv1.Appeal) { appeal.RequestedRemedy = "" }},
		{"reviewer", "independent_reviewer", func(appeal *platformv1.Appeal) { appeal.IndependentReviewer = nil }},
		{"reviewer ref", "independent_reviewer", func(appeal *platformv1.Appeal) { appeal.IndependentReviewer.Ref = "" }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			target := appealTargetDecision()
			appeal := validAppeal(target)
			tt.mutate(appeal)

			assertNamedFieldError(
				t,
				ValidateAppeal(appeal, target.GetAuthorizedHuman().GetRef()),
				tt.field,
			)
		})
	}
}

func TestAssertReviewerIndependent(t *testing.T) {
	if err := AssertReviewerIndependent(fixtures.StaffGuide2, fixtures.StaffGuide.GetRef()); err != nil {
		t.Fatalf("AssertReviewerIndependent(distinct reviewer) error = %v, want nil", err)
	}

	assertReviewerConflictError(
		t,
		AssertReviewerIndependent(fixtures.StaffGuide, fixtures.StaffGuide.GetRef()),
		"independent_reviewer",
	)
}

func appealTargetDecision() *platformv1.DecisionRecord {
	target := validDecisionRecord()
	target.Header.ContractId = "cid_0001"
	target.AuthorizedHuman = proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef)
	return target
}

func validAppeal(target *platformv1.DecisionRecord) *platformv1.Appeal {
	header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
	header.ContractId = "cid_appeal_0001"
	header.SchemaVersion = "appeal/1"
	header.CausationId = target.GetHeader().GetContractId()

	return &platformv1.Appeal{
		Header:                header,
		AppellantRole:         "guardian",
		TargetDecision:        target.GetHeader().GetContractId(),
		Grounds:               "new evidence",
		SubmittedEvidenceRefs: []string{"evidence://appeal/synth_001#sha256:cc33"},
		RequestedRemedy:       "re-review",
		Status:                platformv1.AppealStatus_FILED,
		IndependentReviewer:   proto.Clone(fixtures.StaffGuide2).(*platformv1.ActorRef),
		Deadlines: &platformv1.Deadlines{
			RespondBy: timestamppb.New(time.Date(2026, time.August, 1, 0, 0, 0, 0, time.UTC)),
		},
		Resolution: "",
	}
}

func assertReviewerConflictError(t *testing.T, err error, wantField string) {
	t.Helper()

	var conflictErr *ReviewerConflictError
	if !errors.As(err, &conflictErr) {
		t.Fatalf("error = %T %v, want *ReviewerConflictError", err, err)
	}
	if conflictErr.Field != wantField {
		t.Fatalf("ReviewerConflictError.Field = %q, want %q", conflictErr.Field, wantField)
	}
}
