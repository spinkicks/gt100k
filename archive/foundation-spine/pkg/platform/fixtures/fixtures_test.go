package fixtures

import (
	"encoding/json"
	"os"
	"path/filepath"
	"slices"
	"testing"
	"time"

	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

func TestCanonicalIdentityFixtures(t *testing.T) {
	if Tenant != "gt100k" {
		t.Fatalf("Tenant = %q, want gt100k", Tenant)
	}
	if PolicyVersion != "opa-bundle/2026-07-20a" {
		t.Fatalf("PolicyVersion = %q", PolicyVersion)
	}
	if T0 != "2026-07-20T14:03:11Z" || T0Recorded != "2026-07-20T14:03:11.402Z" {
		t.Fatalf("fixture times = (%q, %q)", T0, T0Recorded)
	}

	tests := []struct {
		name  string
		actor *platformv1.ActorRef
		ref   string
		class platformv1.ActorClass
		role  string
	}{
		{"staff guide", StaffGuide, "actor_pseudo_guide_01", platformv1.ActorClass_STAFF, "guide"},
		{"second staff guide", StaffGuide2, "actor_pseudo_guide_02", platformv1.ActorClass_STAFF, "guide"},
		{"admissions lead", AdmissionsLead, "actor_pseudo_admin_01", platformv1.ActorClass_STAFF, "admissions_lead"},
		{"guardian", Guardian, "actor_pseudo_guardian_01", platformv1.ActorClass_GUARDIAN, "guardian"},
		{"child", Child, "actor_pseudo_child_01", platformv1.ActorClass_CHILD, "learner"},
		{"model", Model, "model_advisor_01", platformv1.ActorClass_MODEL, "advisor"},
		{"system", System, "system_relay_01", platformv1.ActorClass_SYSTEM, "system"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.actor == nil {
				t.Fatal("actor is nil")
			}
			if tt.actor.Ref != tt.ref || tt.actor.Class != tt.class || tt.actor.Role != tt.role {
				t.Fatalf("actor = %#v, want ref=%q class=%s role=%q", tt.actor, tt.ref, tt.class, tt.role)
			}
		})
	}

	if EligibleLearner == nil {
		t.Fatal("EligibleLearner is nil")
	}
	if EligibleLearner.LearnerRef != "learner_synth_001" ||
		EligibleLearner.AccommodationProfileRef != "accom://profile/synth_001" ||
		EligibleLearner.EligibilityEvidenceRef != "evidence://eligibility/synth_001#sha256:aa11" ||
		EligibleLearner.Track != platformv1.Track_TRACK_A {
		t.Fatalf("EligibleLearner = %#v", EligibleLearner)
	}
}

func TestValidEnvelopeAndWithEnvelope(t *testing.T) {
	if ValidEnvelope == nil {
		t.Fatal("ValidEnvelope is nil")
	}
	if ValidEnvelope.ContractId != "cid_0001" ||
		ValidEnvelope.SchemaVersion != "consent_grant/1" ||
		ValidEnvelope.TenantId != Tenant ||
		ValidEnvelope.CorrelationId != "corr_0001" ||
		ValidEnvelope.CausationId != "cid_0000" ||
		ValidEnvelope.ConsentPurpose != "onboarding.schedule" ||
		ValidEnvelope.PolicyVersion != PolicyVersion ||
		ValidEnvelope.ModelVersion != "model/synthetic-v1" ||
		!slices.Equal(ValidEnvelope.EvidenceRefs, []string{"evidence://fixture/synth_001#sha256:bb22"}) {
		t.Fatalf("ValidEnvelope scalar fields = %#v", ValidEnvelope)
	}
	if !proto.Equal(ValidEnvelope.ActorRef, StaffGuide) {
		t.Fatalf("ValidEnvelope actor = %#v", ValidEnvelope.ActorRef)
	}
	if got := ValidEnvelope.OccurredAt.AsTime().Format(time.RFC3339Nano); got != T0 {
		t.Fatalf("occurred_at = %q", got)
	}
	if got := ValidEnvelope.RecordedAt.AsTime().Format("2006-01-02T15:04:05.000Z07:00"); got != T0Recorded {
		t.Fatalf("recorded_at = %q", got)
	}
	if ValidEnvelope.OccurredAt.AsTime().Equal(ValidEnvelope.RecordedAt.AsTime()) {
		t.Fatal("occurred_at and recorded_at must be distinct")
	}

	first := WithEnvelope(&platformv1.LearnerEvent{})
	second := WithEnvelope(&platformv1.LearnerEvent{})
	if !proto.Equal(first.Header, ValidEnvelope) || !proto.Equal(second.Header, ValidEnvelope) {
		t.Fatal("WithEnvelope did not attach the canonical header")
	}
	if first.Header == ValidEnvelope || first.Header == second.Header || first.Header.ActorRef == ValidEnvelope.ActorRef {
		t.Fatal("WithEnvelope must deep-clone the mutable protobuf header")
	}
	first.Header.ContractId = "mutated"
	first.Header.ActorRef.Ref = "mutated"
	if ValidEnvelope.ContractId != "cid_0001" || StaffGuide.Ref != "actor_pseudo_guide_01" {
		t.Fatal("mutating a wrapped contract changed a canonical fixture")
	}
}

func TestConsentFixtures(t *testing.T) {
	tests := []struct {
		name        string
		grant       *platformv1.ConsentGrant
		purpose     string
		expiry      string
		withdrawn   bool
		withdrawnAt string
	}{
		{"onboarding", ConsentOnboarding, "onboarding.schedule", "2026-12-31T00:00:00Z", false, ""},
		{"expired", ConsentOnboardingExpired, "onboarding.schedule", "2026-07-10T00:00:00Z", false, ""},
		{"withdrawn", ConsentOnboardingWithdrawn, "onboarding.schedule", "2026-12-31T00:00:00Z", true, "2026-07-15T00:00:00Z"},
		{"research", ConsentResearch, "research.trial", "2026-12-31T00:00:00Z", false, ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			g := tt.grant
			if g == nil {
				t.Fatal("grant is nil")
			}
			if !proto.Equal(g.Header, ValidEnvelope) || g.Header == ValidEnvelope {
				t.Fatal("grant does not have an independent canonical envelope")
			}
			if g.SubjectRef != "learner_synth_001" || !g.GuardianAuthority || g.Purpose != tt.purpose || g.Jurisdiction != "US-CA" {
				t.Fatalf("grant identity fields = %#v", g)
			}
			if got := g.EffectiveAt.AsTime().Format(time.RFC3339Nano); got != "2026-07-01T00:00:00Z" {
				t.Fatalf("effective_at = %q", got)
			}
			if got := g.ExpiryAt.AsTime().Format(time.RFC3339Nano); got != tt.expiry {
				t.Fatalf("expiry_at = %q, want %q", got, tt.expiry)
			}
			if g.WithdrawalState == nil || g.WithdrawalState.Withdrawn != tt.withdrawn {
				t.Fatalf("withdrawal_state = %#v", g.WithdrawalState)
			}
			if tt.withdrawnAt == "" {
				if g.WithdrawalState.WithdrawnAt != nil {
					t.Fatalf("withdrawn_at = %v, want nil", g.WithdrawalState.WithdrawnAt)
				}
			} else if got := g.WithdrawalState.WithdrawnAt.AsTime().Format(time.RFC3339Nano); got != tt.withdrawnAt {
				t.Fatalf("withdrawn_at = %q, want %q", got, tt.withdrawnAt)
			}
			if len(g.DataCategories) == 0 || len(g.Processors) == 0 || g.CollectionMethod == "" || g.DocumentHash == "" {
				t.Fatalf("required consent fixture fields are incomplete: %#v", g)
			}
		})
	}
}

func TestAuthzInputFixturesMirrorGoldenRows(t *testing.T) {
	type consent struct {
		Purpose      string `json:"purpose"`
		Jurisdiction string `json:"jurisdiction"`
		Active       bool   `json:"active"`
	}
	type actor struct {
		Ref   string `json:"ref"`
		Class string `json:"class"`
		Role  string `json:"role"`
	}
	type input struct {
		Actor         actor     `json:"actor"`
		Purpose       string    `json:"purpose"`
		SubjectRef    string    `json:"subject_ref"`
		Jurisdiction  string    `json:"jurisdiction"`
		At            string    `json:"at"`
		PolicyVersion string    `json:"policy_version"`
		Consents      []consent `json:"consents"`
	}
	type expected struct {
		purpose      string
		jurisdiction string
		consents     []consent
	}

	want := map[string]expected{
		"authz_allow":                 {"onboarding.schedule", "US-CA", []consent{{"onboarding.schedule", "US-CA", true}}},
		"authz_no_consent":            {"onboarding.schedule", "US-CA", []consent{}},
		"authz_withdrawn":             {"onboarding.schedule", "US-CA", []consent{}},
		"authz_expired":               {"onboarding.schedule", "US-CA", []consent{}},
		"authz_jurisdiction_mismatch": {"onboarding.schedule", "US-NY", []consent{{"onboarding.schedule", "US-CA", true}}},
		"authz_deny_by_default":       {"research.trial", "US-CA", []consent{{"research.trial", "US-CA", true}}},
	}

	dir := filepath.Join("..", "..", "..", "policies", "testdata")
	paths, err := filepath.Glob(filepath.Join(dir, "authz_*.json"))
	if err != nil {
		t.Fatalf("glob authz fixtures: %v", err)
	}
	if len(paths) != len(want) {
		t.Fatalf("authz fixture count = %d, want %d", len(paths), len(want))
	}
	for _, path := range paths {
		name := filepath.Base(path)
		key := name[:len(name)-len(filepath.Ext(name))]
		wantRow, ok := want[key]
		if !ok {
			t.Fatalf("unexpected authz fixture %q", name)
		}
		contents, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("read %s: %v", name, err)
		}
		var document map[string]input
		if err := json.Unmarshal(contents, &document); err != nil {
			t.Fatalf("decode %s: %v", name, err)
		}
		row, ok := document[key]
		if !ok || len(document) != 1 {
			t.Fatalf("%s must contain only top-level key %q", name, key)
		}
		if row.Actor.Ref != StaffGuide.Ref || row.Actor.Class != StaffGuide.Class.String() || row.Actor.Role != StaffGuide.Role ||
			row.SubjectRef != EligibleLearner.LearnerRef || row.At != T0 || row.PolicyVersion != PolicyVersion {
			t.Fatalf("%s canonical fields = %#v", name, row)
		}
		if row.Purpose != wantRow.purpose || row.Jurisdiction != wantRow.jurisdiction || !slices.Equal(row.Consents, wantRow.consents) {
			t.Fatalf("%s decision inputs = %#v, want %#v", name, row, wantRow)
		}
	}
}
