package platform

import (
	"errors"
	"reflect"
	"testing"
	"time"

	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

func TestGoldenGENVDecisionTable(t *testing.T) {
	tests := []struct {
		name    string
		mutate  func(*platformv1.Envelope)
		wantErr error
	}{
		{name: "complete"},
		{name: "contract id", mutate: func(h *platformv1.Envelope) { h.ContractId = "" }, wantErr: &NamedFieldError{Field: "contract_id"}},
		{name: "schema version", mutate: func(h *platformv1.Envelope) { h.SchemaVersion = "" }, wantErr: &NamedFieldError{Field: "schema_version"}},
		{name: "tenant id", mutate: func(h *platformv1.Envelope) { h.TenantId = "" }, wantErr: &NamedFieldError{Field: "tenant_id"}},
		{name: "actor ref", mutate: func(h *platformv1.Envelope) { h.ActorRef = nil }, wantErr: &NamedFieldError{Field: "actor_ref"}},
		{name: "consent purpose", mutate: func(h *platformv1.Envelope) { h.ConsentPurpose = "" }, wantErr: &NamedFieldError{Field: "consent_purpose"}},
		{name: "policy version", mutate: func(h *platformv1.Envelope) { h.PolicyVersion = "" }, wantErr: &NamedFieldError{Field: "policy_version"}},
		{name: "correlation id", mutate: func(h *platformv1.Envelope) { h.CorrelationId = "" }, wantErr: &NamedFieldError{Field: "correlation_id"}},
		{name: "causation id", mutate: func(h *platformv1.Envelope) { h.CausationId = "" }, wantErr: &NamedFieldError{Field: "causation_id"}},
		{name: "occurred at", mutate: func(h *platformv1.Envelope) { h.OccurredAt = nil }, wantErr: &NamedFieldError{Field: "occurred_at"}},
		{name: "nil evidence refs", mutate: func(h *platformv1.Envelope) { h.EvidenceRefs = nil }},
		{name: "empty model version", mutate: func(h *platformv1.Envelope) { h.ModelVersion = "" }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
			if tt.mutate != nil {
				tt.mutate(header)
			}
			assertGoldenError(t, ValidateEnvelope(header), tt.wantErr)
		})
	}
}

func TestGoldenGDECDecisionTable(t *testing.T) {
	base := validDecisionRecord()
	if base.PolicyVersion != "opa-bundle/2026-07-20a" || !proto.Equal(base.AuthorizedHuman, fixtures.StaffGuide) {
		t.Fatalf("golden consequential authority/policy = %v/%q, want StaffGuide/%q", base.AuthorizedHuman, base.PolicyVersion, fixtures.PolicyVersion)
	}

	tests := []struct {
		name    string
		mutate  func(*platformv1.DecisionRecord)
		wantErr error
	}{
		{name: "consequential staff"},
		{name: "model authority", mutate: func(r *platformv1.DecisionRecord) { r.AuthorizedHuman = goldenActor(fixtures.Model) }, wantErr: &AuthorityForgeryError{Field: "authorized_human"}},
		{name: "system authority", mutate: func(r *platformv1.DecisionRecord) { r.AuthorizedHuman = goldenActor(fixtures.System) }, wantErr: &AuthorityForgeryError{Field: "authorized_human"}},
		{name: "missing authority", mutate: func(r *platformv1.DecisionRecord) { r.AuthorizedHuman = nil }, wantErr: &NamedFieldError{Field: "authorized_human"}},
		{name: "missing policy", mutate: func(r *platformv1.DecisionRecord) { r.PolicyVersion = "" }, wantErr: &NamedFieldError{Field: "policy_version"}},
		{name: "non-consequential", mutate: func(r *platformv1.DecisionRecord) {
			r.Consequential, r.AuthorizedHuman, r.PolicyVersion = false, nil, ""
		}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			record := validDecisionRecord()
			if tt.mutate != nil {
				tt.mutate(record)
			}
			assertGoldenError(t, ValidateDecisionRecord(record), tt.wantErr)
		})
	}

	existing := map[string]bool{"cid_0001": true}
	assertGoldenError(t, AssertAppendOnly(existing, "cid_0001"), &AppendOnlyError{ContractID: "cid_0001"})
	assertGoldenError(t, AssertAppendOnly(existing, "cid_0002"), nil)
}

func TestGoldenGASSENTDecisionTable(t *testing.T) {
	tests := []struct {
		name       string
		honorable  bool
		response   platformv1.AssentResponse
		wantBlocks bool
	}{
		{"honorable refusal", true, platformv1.AssentResponse_REFUSAL, true},
		{"honorable dissent", true, platformv1.AssentResponse_DISSENT, true},
		{"honorable assent", true, platformv1.AssentResponse_ASSENT, false},
		{"non-honorable refusal", false, platformv1.AssentResponse_REFUSAL, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			record := validAssentRecord()
			record.Honorable, record.Response = tt.honorable, tt.response
			if got := AssentBlocks(record); got != tt.wantBlocks {
				t.Fatalf("AssentBlocks() = %t, want %t", got, tt.wantBlocks)
			}
		})
	}

	if !IsConsentActive(fixtures.ConsentOnboarding, fixtures.ValidEnvelope.GetOccurredAt().AsTime()) {
		t.Fatal("ConsentOnboarding is not active at the golden fixture time")
	}
	refusal := validAssentRecord()
	refusal.Honorable, refusal.Response = true, platformv1.AssentResponse_REFUSAL
	if !AssentBlocks(refusal) {
		t.Fatal("active guardian consent overrode honorable child refusal")
	}
}

func TestGoldenGOVRDecisionTable(t *testing.T) {
	target := overrideTargetDecision()
	targetBefore := proto.Clone(target).(*platformv1.DecisionRecord)
	base := validOverrideRecord(target)
	gotBase := []any{base.TargetDecision, base.OverrideClass, base.PriorOutcome, base.NewOutcome, base.AuthorizedRole, base.Rationale, base.EvidenceRefs, base.ReviewAt.AsTime().Format(time.RFC3339), base.Header.CausationId}
	wantBase := []any{"cid_0001", "admissions", "route_A", "route_B", "admissions_lead", "corrected eligibility band", []string{"evidence://override/synth_001#sha256:bb22"}, "2026-08-20T00:00:00Z", "cid_0001"}
	if !reflect.DeepEqual(gotBase, wantBase) {
		t.Fatalf("golden override base = %#v, want %#v", gotBase, wantBase)
	}

	tests := []struct {
		name      string
		approvers []*platformv1.ActorRef
		wantErr   error
	}{
		{"distinct staff", goldenActors(fixtures.StaffGuide, fixtures.StaffGuide2), nil},
		{"model approver", goldenActors(fixtures.StaffGuide, fixtures.Model), &AuthorityForgeryError{Field: "approvers"}},
		{"system approver", goldenActors(fixtures.StaffGuide, fixtures.System), &AuthorityForgeryError{Field: "approvers"}},
		{"same staff twice", goldenActors(fixtures.StaffGuide, fixtures.StaffGuide), &FourEyesError{Have: 1}},
		{"single staff", goldenActors(fixtures.StaffGuide), &FourEyesError{Have: 1}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			record := validOverrideRecord(target)
			record.Approvers = tt.approvers
			assertGoldenError(t, ValidateOverrideRecord(record), tt.wantErr)
		})
	}
	if !proto.Equal(target, targetBefore) {
		t.Fatalf("golden override mutated its target:\n got: %v\nwant: %v", target, targetBefore)
	}
	if base.Header.ContractId == target.Header.ContractId {
		t.Fatalf("override contract_id reused target id %q", target.Header.ContractId)
	}

	nonListed := validOverrideRecord(target)
	nonListed.OverrideClass = "operational_correction"
	nonListed.Approvers = goldenActors(fixtures.StaffGuide)
	assertGoldenError(t, ValidateOverrideRecord(nonListed), nil)
}

func TestGoldenGAPLDecisionTable(t *testing.T) {
	target := appealTargetDecision()
	targetBefore := proto.Clone(target).(*platformv1.DecisionRecord)
	base := validAppeal(target)
	gotBase := []any{base.AppellantRole, base.TargetDecision, base.Grounds, base.SubmittedEvidenceRefs, base.RequestedRemedy, base.Deadlines.RespondBy.AsTime().Format(time.RFC3339), base.Resolution}
	wantBase := []any{"guardian", "cid_0001", "new evidence", []string{"evidence://appeal/synth_001#sha256:cc33"}, "re-review", "2026-08-01T00:00:00Z", ""}
	if !reflect.DeepEqual(gotBase, wantBase) {
		t.Fatalf("golden appeal base = %#v, want %#v", gotBase, wantBase)
	}

	tests := []struct {
		name     string
		reviewer *platformv1.ActorRef
		status   platformv1.AppealStatus
		wantErr  error
	}{
		{"independent reviewer", fixtures.StaffGuide2, platformv1.AppealStatus_FILED, nil},
		{"conflicted reviewer", fixtures.StaffGuide, platformv1.AppealStatus_FILED, &ReviewerConflictError{Field: "independent_reviewer"}},
		{"reopened", fixtures.StaffGuide2, platformv1.AppealStatus_REOPENED, nil},
		{"late", fixtures.StaffGuide2, platformv1.AppealStatus_LATE, nil},
		{"invalid status", fixtures.StaffGuide2, platformv1.AppealStatus(99), &NamedFieldError{Field: "status"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			appeal := validAppeal(target)
			appeal.IndependentReviewer, appeal.Status = goldenActor(tt.reviewer), tt.status
			assertGoldenError(t, ValidateAppeal(appeal, target.AuthorizedHuman.Ref), tt.wantErr)
		})
	}
	if !proto.Equal(target, targetBefore) {
		t.Fatalf("golden appeal mutated its target:\n got: %v\nwant: %v", target, targetBefore)
	}
}

func goldenActor(actor *platformv1.ActorRef) *platformv1.ActorRef {
	return proto.Clone(actor).(*platformv1.ActorRef)
}

func goldenActors(actors ...*platformv1.ActorRef) []*platformv1.ActorRef {
	clones := make([]*platformv1.ActorRef, len(actors))
	for i, actor := range actors {
		clones[i] = goldenActor(actor)
	}
	return clones
}

func assertGoldenError(t *testing.T, err, want error) {
	t.Helper()
	if want == nil {
		if err != nil {
			t.Fatalf("error = %T %v, want nil", err, err)
		}
		return
	}
	if err == nil {
		t.Fatalf("error = nil, want %T %v", want, want)
	}

	switch want := want.(type) {
	case *NamedFieldError:
		var got *NamedFieldError
		if !errors.As(err, &got) || *got != *want {
			t.Fatalf("error = %T %v, want %#v", err, err, want)
		}
	case *AuthorityForgeryError:
		var got *AuthorityForgeryError
		if !errors.As(err, &got) || *got != *want {
			t.Fatalf("error = %T %v, want %#v", err, err, want)
		}
	case *AppendOnlyError:
		var got *AppendOnlyError
		if !errors.As(err, &got) || *got != *want {
			t.Fatalf("error = %T %v, want %#v", err, err, want)
		}
	case *FourEyesError:
		var got *FourEyesError
		if !errors.As(err, &got) || *got != *want {
			t.Fatalf("error = %T %v, want %#v", err, err, want)
		}
	case *ReviewerConflictError:
		var got *ReviewerConflictError
		if !errors.As(err, &got) || *got != *want {
			t.Fatalf("error = %T %v, want %#v", err, err, want)
		}
	default:
		t.Fatalf("unsupported golden error type %T", want)
	}
}
