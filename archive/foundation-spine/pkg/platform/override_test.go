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

func TestValidateOverrideRecordAcceptsGoldenFourEyesAndPreservesTarget(t *testing.T) {
	target := overrideTargetDecision()
	targetBefore := proto.Clone(target).(*platformv1.DecisionRecord)
	record := validOverrideRecord(target)

	if err := ValidateOverrideRecord(record); err != nil {
		t.Fatalf("ValidateOverrideRecord() error = %v, want nil", err)
	}
	if !proto.Equal(target, targetBefore) {
		t.Fatalf("target decision changed:\n got: %v\nwant: %v", target, targetBefore)
	}
	if record.GetHeader().GetContractId() == target.GetHeader().GetContractId() {
		t.Fatalf("override contract_id = target contract_id = %q, want a new record", record.GetHeader().GetContractId())
	}
	if got, want := record.GetHeader().GetCausationId(), target.GetHeader().GetContractId(); got != want {
		t.Fatalf("override causation_id = %q, want target decision %q", got, want)
	}
}

func TestValidateOverrideRecordRejectsAuthorityForgery(t *testing.T) {
	tests := []struct {
		name     string
		approver *platformv1.ActorRef
	}{
		{"model", fixtures.Model},
		{"system", fixtures.System},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			record := validOverrideRecord(overrideTargetDecision())
			record.Approvers = []*platformv1.ActorRef{
				proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
				proto.Clone(tt.approver).(*platformv1.ActorRef),
			}

			assertAuthorityForgeryError(t, ValidateOverrideRecord(record), "approvers")
		})
	}
}

func TestValidateOverrideRecordRejectsFewerThanTwoDistinctApprovers(t *testing.T) {
	tests := []struct {
		name      string
		approvers []*platformv1.ActorRef
	}{
		{
			name: "same ref",
			approvers: []*platformv1.ActorRef{
				proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
				proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
			},
		},
		{
			name: "single",
			approvers: []*platformv1.ActorRef{
				proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			record := validOverrideRecord(overrideTargetDecision())
			record.Approvers = tt.approvers

			assertFourEyesError(t, ValidateOverrideRecord(record), 1)
		})
	}
}

func TestValidateOverrideRecordRequiresFourEyesForEveryGovernedClass(t *testing.T) {
	classes := []string{
		"admissions",
		"public_exposure",
		"safeguarding",
		"credential_revocation",
	}

	for _, class := range classes {
		t.Run(class, func(t *testing.T) {
			record := validOverrideRecord(overrideTargetDecision())
			record.OverrideClass = class
			record.Approvers = []*platformv1.ActorRef{
				proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
			}

			assertFourEyesError(t, ValidateOverrideRecord(record), 1)
		})
	}
}

func TestValidateOverrideRecordRequiresCompleteRecord(t *testing.T) {
	tests := []struct {
		name   string
		field  string
		mutate func(*platformv1.OverrideRecord)
	}{
		{"envelope", "contract_id", func(record *platformv1.OverrideRecord) { record.Header.ContractId = "" }},
		{"target decision", "target_decision", func(record *platformv1.OverrideRecord) { record.TargetDecision = "" }},
		{"override class", "override_class", func(record *platformv1.OverrideRecord) { record.OverrideClass = "" }},
		{"prior outcome", "prior_outcome", func(record *platformv1.OverrideRecord) { record.PriorOutcome = "" }},
		{"new outcome", "new_outcome", func(record *platformv1.OverrideRecord) { record.NewOutcome = "" }},
		{"authorized role", "authorized_role", func(record *platformv1.OverrideRecord) { record.AuthorizedRole = "" }},
		{"rationale", "rationale", func(record *platformv1.OverrideRecord) { record.Rationale = "" }},
		{"evidence refs", "evidence_refs", func(record *platformv1.OverrideRecord) { record.EvidenceRefs = nil }},
		{"review at", "review_at", func(record *platformv1.OverrideRecord) { record.ReviewAt = nil }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			record := validOverrideRecord(overrideTargetDecision())
			tt.mutate(record)

			assertNamedFieldError(t, ValidateOverrideRecord(record), tt.field)
		})
	}
}

func TestValidateOverrideRecordRejectsInvalidReviewTime(t *testing.T) {
	record := validOverrideRecord(overrideTargetDecision())
	record.ReviewAt = &timestamppb.Timestamp{Seconds: 253402300800}

	assertNamedFieldError(t, ValidateOverrideRecord(record), "review_at")
}

func TestValidateOverrideRecordRequiresNewRecordLinkedToTarget(t *testing.T) {
	tests := []struct {
		name   string
		field  string
		mutate func(*platformv1.OverrideRecord)
	}{
		{
			name:  "causation mismatch",
			field: "causation_id",
			mutate: func(record *platformv1.OverrideRecord) {
				record.Header.CausationId = "cid_other"
			},
		},
		{
			name:  "reuses target contract id",
			field: "contract_id",
			mutate: func(record *platformv1.OverrideRecord) {
				record.Header.ContractId = record.TargetDecision
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			record := validOverrideRecord(overrideTargetDecision())
			tt.mutate(record)

			assertNamedFieldError(t, ValidateOverrideRecord(record), tt.field)
		})
	}
}

func TestValidateOverrideRecordNonListedClassRequiresExactlyOneHuman(t *testing.T) {
	t.Run("one named human passes", func(t *testing.T) {
		record := validOverrideRecord(overrideTargetDecision())
		record.OverrideClass = "operational_correction"
		record.Approvers = []*platformv1.ActorRef{proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef)}

		if err := ValidateOverrideRecord(record); err != nil {
			t.Fatalf("ValidateOverrideRecord() error = %v, want nil", err)
		}
	})

	tests := []struct {
		name      string
		approvers []*platformv1.ActorRef
		wantField string
	}{
		{"none", nil, "approvers"},
		{
			"two",
			[]*platformv1.ActorRef{
				proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
				proto.Clone(fixtures.StaffGuide2).(*platformv1.ActorRef),
			},
			"approvers",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			record := validOverrideRecord(overrideTargetDecision())
			record.OverrideClass = "operational_correction"
			record.Approvers = tt.approvers

			assertNamedFieldError(t, ValidateOverrideRecord(record), tt.wantField)
		})
	}

	t.Run("model is authority forgery", func(t *testing.T) {
		record := validOverrideRecord(overrideTargetDecision())
		record.OverrideClass = "operational_correction"
		record.Approvers = []*platformv1.ActorRef{proto.Clone(fixtures.Model).(*platformv1.ActorRef)}

		assertAuthorityForgeryError(t, ValidateOverrideRecord(record), "approvers")
	})
}

func overrideTargetDecision() *platformv1.DecisionRecord {
	target := validDecisionRecord()
	target.Header.ContractId = "cid_0001"
	target.Outcome = "route_A"
	target.AuthorizedHuman = proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef)
	return target
}

func validOverrideRecord(target *platformv1.DecisionRecord) *platformv1.OverrideRecord {
	header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
	header.ContractId = "cid_override_0001"
	header.SchemaVersion = "override_record/1"
	header.CausationId = target.GetHeader().GetContractId()

	return &platformv1.OverrideRecord{
		Header:         header,
		TargetDecision: target.GetHeader().GetContractId(),
		OverrideClass:  "admissions",
		PriorOutcome:   target.GetOutcome(),
		NewOutcome:     "route_B",
		AuthorizedRole: "admissions_lead",
		Rationale:      "corrected eligibility band",
		EvidenceRefs:   []string{"evidence://override/synth_001#sha256:bb22"},
		Approvers: []*platformv1.ActorRef{
			proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
			proto.Clone(fixtures.StaffGuide2).(*platformv1.ActorRef),
		},
		ReviewAt: timestamppb.New(time.Date(2026, time.August, 20, 0, 0, 0, 0, time.UTC)),
	}
}

func assertFourEyesError(t *testing.T, err error, wantHave int) {
	t.Helper()

	var fourEyesErr *FourEyesError
	if !errors.As(err, &fourEyesErr) {
		t.Fatalf("error = %T %v, want *FourEyesError", err, err)
	}
	if fourEyesErr.Have != wantHave {
		t.Fatalf("FourEyesError.Have = %d, want %d", fourEyesErr.Have, wantHave)
	}
}
