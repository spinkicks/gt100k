package platform

import (
	"errors"
	"testing"

	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

func TestValidateDecisionRecordAcceptsConsequentialHumanDecision(t *testing.T) {
	decision := validDecisionRecord()

	if err := ValidateDecisionRecord(decision); err != nil {
		t.Fatalf("ValidateDecisionRecord() error = %v, want nil", err)
	}
}

func TestValidateDecisionRecordRejectsAuthorityForgery(t *testing.T) {
	tests := []struct {
		name          string
		authority     *platformv1.ActorRef
		consequential bool
	}{
		{"consequential model", fixtures.Model, true},
		{"consequential system", fixtures.System, true},
		{"non-consequential model", fixtures.Model, false},
		{"non-consequential system", fixtures.System, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			decision := validDecisionRecord()
			decision.AuthorizedHuman = proto.Clone(tt.authority).(*platformv1.ActorRef)
			decision.Consequential = tt.consequential

			assertAuthorityForgeryError(t, ValidateDecisionRecord(decision), "authorized_human")
		})
	}
}

func TestValidateDecisionRecordRequiresNamedHumanAndPolicyWhenConsequential(t *testing.T) {
	tests := []struct {
		name   string
		field  string
		mutate func(*platformv1.DecisionRecord)
	}{
		{
			name:  "missing authorized human",
			field: "authorized_human",
			mutate: func(decision *platformv1.DecisionRecord) {
				decision.AuthorizedHuman = nil
			},
		},
		{
			name:  "unnamed authorized human",
			field: "authorized_human",
			mutate: func(decision *platformv1.DecisionRecord) {
				decision.AuthorizedHuman.Ref = ""
			},
		},
		{
			name:  "missing policy result",
			field: "policy_version",
			mutate: func(decision *platformv1.DecisionRecord) {
				decision.PolicyVersion = ""
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			decision := validDecisionRecord()
			tt.mutate(decision)

			assertNamedFieldError(t, ValidateDecisionRecord(decision), tt.field)
		})
	}
}

func TestValidateDecisionRecordAcceptsNonConsequentialWithoutHumanOrPolicy(t *testing.T) {
	decision := validDecisionRecord()
	decision.AuthorizedHuman = nil
	decision.PolicyVersion = ""
	decision.Consequential = false

	if err := ValidateDecisionRecord(decision); err != nil {
		t.Fatalf("ValidateDecisionRecord() error = %v, want nil", err)
	}
}

func TestValidateDecisionRecordRejectsIncompleteEnvelope(t *testing.T) {
	decision := validDecisionRecord()
	decision.Header.ContractId = ""

	assertNamedFieldError(t, ValidateDecisionRecord(decision), "contract_id")
}

func TestAssertHumanAuthorityAcceptsHumanClasses(t *testing.T) {
	actors := []*platformv1.ActorRef{
		{Ref: "actor_human", Class: platformv1.ActorClass_HUMAN},
		fixtures.Guardian,
		fixtures.Child,
		fixtures.StaffGuide,
	}

	for _, actor := range actors {
		t.Run(actor.Class.String(), func(t *testing.T) {
			if err := AssertHumanAuthority(actor); err != nil {
				t.Fatalf("AssertHumanAuthority(%s) error = %v, want nil", actor.Class, err)
			}
		})
	}
}

func TestAssertHumanAuthorityRejectsModelAndSystem(t *testing.T) {
	tests := []struct {
		name  string
		actor *platformv1.ActorRef
	}{
		{"named model", fixtures.Model},
		{"named system", fixtures.System},
		{"unnamed model", &platformv1.ActorRef{Class: platformv1.ActorClass_MODEL}},
		{"unnamed system", &platformv1.ActorRef{Class: platformv1.ActorClass_SYSTEM}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assertAuthorityForgeryError(t, AssertHumanAuthority(tt.actor), "authorized_human")
		})
	}
}

func TestAssertHumanAuthorityRejectsUnspecifiedClass(t *testing.T) {
	actor := &platformv1.ActorRef{
		Ref:   "actor_pseudo_unspecified_01",
		Class: platformv1.ActorClass_ACTOR_CLASS_UNSPECIFIED,
	}

	assertNamedFieldError(t, AssertHumanAuthority(actor), "authorized_human")
}

func TestAssertAppendOnly(t *testing.T) {
	existing := map[string]bool{"cid_0001": true}

	var appendErr *AppendOnlyError
	err := AssertAppendOnly(existing, "cid_0001")
	if !errors.As(err, &appendErr) {
		t.Fatalf("AssertAppendOnly(existing, existing id) error = %T %v, want *AppendOnlyError", err, err)
	}
	if appendErr.ContractID != "cid_0001" {
		t.Fatalf("AppendOnlyError.ContractID = %q, want %q", appendErr.ContractID, "cid_0001")
	}

	if err := AssertAppendOnly(existing, "cid_0002"); err != nil {
		t.Fatalf("AssertAppendOnly(existing, new id) error = %v, want nil", err)
	}
}

func validDecisionRecord() *platformv1.DecisionRecord {
	header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
	header.SchemaVersion = "decision_record/1"

	return &platformv1.DecisionRecord{
		Header:           header,
		DecisionType:     "synthetic.pathway_recommendation",
		SubjectRef:       fixtures.EligibleLearner.LearnerRef,
		Candidates:       []string{"pathway_synth_a", "pathway_synth_b"},
		Outcome:          "pathway_synth_a",
		ReasonCodes:      []string{"synthetic_evidence_supported"},
		EvidenceSnapshot: []string{"evidence://fixture/synth_001#sha256:dd44"},
		Uncertainty:      0.1,
		PolicyVersion:    fixtures.PolicyVersion,
		ModelVersion:     "model/synthetic-v1",
		AuthorizedHuman:  proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
		EffectiveAt:      header.OccurredAt,
		Consequential:    true,
	}
}

func assertAuthorityForgeryError(t *testing.T, err error, wantField string) {
	t.Helper()

	var authorityErr *AuthorityForgeryError
	if !errors.As(err, &authorityErr) {
		t.Fatalf("error = %T %v, want *AuthorityForgeryError", err, err)
	}
	if authorityErr.Field != wantField {
		t.Fatalf("AuthorityForgeryError.Field = %q, want %q", authorityErr.Field, wantField)
	}
}
