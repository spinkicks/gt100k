package platform

import (
	"testing"
	"time"

	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestValidateConsentGrantAcceptsCompleteGrant(t *testing.T) {
	grant := validConsentGrant()

	if err := ValidateConsentGrant(grant); err != nil {
		t.Fatalf("ValidateConsentGrant() error = %v, want nil", err)
	}
}

func TestValidateConsentGrantRejectsIncompleteEnvelope(t *testing.T) {
	grant := validConsentGrant()
	grant.Header.ContractId = ""

	assertNamedFieldError(t, ValidateConsentGrant(grant), "contract_id")
}

func TestValidateConsentGrantRejectsMissingRequiredField(t *testing.T) {
	tests := []struct {
		name   string
		field  string
		mutate func(*platformv1.ConsentGrant)
	}{
		{"subject ref", "subject_ref", func(g *platformv1.ConsentGrant) { g.SubjectRef = "" }},
		{"guardian authority", "guardian_authority", func(g *platformv1.ConsentGrant) { g.GuardianAuthority = false }},
		{"purpose", "purpose", func(g *platformv1.ConsentGrant) { g.Purpose = "" }},
		{"data categories", "data_categories", func(g *platformv1.ConsentGrant) { g.DataCategories = nil }},
		{"processors", "processors", func(g *platformv1.ConsentGrant) { g.Processors = nil }},
		{"jurisdiction", "jurisdiction", func(g *platformv1.ConsentGrant) { g.Jurisdiction = "" }},
		{"effective at", "effective_at", func(g *platformv1.ConsentGrant) { g.EffectiveAt = nil }},
		{"collection method", "collection_method", func(g *platformv1.ConsentGrant) { g.CollectionMethod = "" }},
		{"document hash", "document_hash", func(g *platformv1.ConsentGrant) { g.DocumentHash = "" }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			grant := validConsentGrant()
			tt.mutate(grant)

			assertNamedFieldError(t, ValidateConsentGrant(grant), tt.field)
		})
	}
}

func TestValidateConsentGrantRejectsInvalidTimestamp(t *testing.T) {
	tests := []struct {
		name   string
		field  string
		mutate func(*platformv1.ConsentGrant)
	}{
		{
			name:  "effective at",
			field: "effective_at",
			mutate: func(g *platformv1.ConsentGrant) {
				g.EffectiveAt = &timestamppb.Timestamp{Seconds: 253402300800}
			},
		},
		{
			name:  "expiry at",
			field: "expiry_at",
			mutate: func(g *platformv1.ConsentGrant) {
				g.ExpiryAt = &timestamppb.Timestamp{Seconds: 253402300800}
			},
		},
		{
			name:  "withdrawn at",
			field: "withdrawal_state.withdrawn_at",
			mutate: func(g *platformv1.ConsentGrant) {
				g.WithdrawalState = &platformv1.WithdrawalState{
					Withdrawn:   true,
					WithdrawnAt: &timestamppb.Timestamp{Seconds: 253402300800},
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			grant := validConsentGrant()
			tt.mutate(grant)

			assertNamedFieldError(t, ValidateConsentGrant(grant), tt.field)
		})
	}
}

func TestValidateConsentGrantRequiresWithdrawalTimeWhenWithdrawn(t *testing.T) {
	grant := validConsentGrant()
	grant.WithdrawalState = &platformv1.WithdrawalState{Withdrawn: true}

	assertNamedFieldError(t, ValidateConsentGrant(grant), "withdrawal_state.withdrawn_at")
}

func TestValidateConsentGrantAllowsOpenEndedWindowAndDefaultWithdrawalState(t *testing.T) {
	grant := validConsentGrant()
	grant.ExpiryAt = nil
	grant.WithdrawalState = nil

	if err := ValidateConsentGrant(grant); err != nil {
		t.Fatalf("ValidateConsentGrant() error = %v, want nil", err)
	}
}

func TestIsConsentActiveUsesEffectiveInclusiveExpiryExclusiveWindow(t *testing.T) {
	tests := []struct {
		name  string
		grant *platformv1.ConsentGrant
		at    string
		want  bool
	}{
		{"at effective time", validConsentGrant(), "2026-07-01T00:00:00Z", true},
		{"before effective time", validConsentGrant(), "2026-06-30T23:59:59.999999999Z", false},
		{"before expiry time", validConsentGrant(), "2026-12-30T23:59:59.999999999Z", true},
		{"at expiry time", validConsentGrant(), "2026-12-31T00:00:00Z", false},
		{"after expiry time", validConsentGrant(), "2027-01-01T00:00:00Z", false},
		{"expired fixture", cloneConsent(fixtures.ConsentOnboardingExpired), fixtures.T0, false},
		{"withdrawn fixture", cloneConsent(fixtures.ConsentOnboardingWithdrawn), fixtures.T0, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsConsentActive(tt.grant, mustConsentTime(t, tt.at)); got != tt.want {
				t.Fatalf("IsConsentActive() = %t, want %t", got, tt.want)
			}
		})
	}
}

func TestIsConsentActiveAllowsNoExpiryOrWithdrawalState(t *testing.T) {
	grant := validConsentGrant()
	grant.ExpiryAt = nil
	grant.WithdrawalState = nil

	if !IsConsentActive(grant, mustConsentTime(t, "2030-01-01T00:00:00Z")) {
		t.Fatal("IsConsentActive() = false, want true for an open-ended unwithdrawn grant")
	}
}

func TestIsConsentActiveRejectsMalformedGrant(t *testing.T) {
	grant := validConsentGrant()
	grant.EffectiveAt = nil

	if IsConsentActive(grant, mustConsentTime(t, fixtures.T0)) {
		t.Fatal("IsConsentActive() = true, want false for malformed grant")
	}
}

func validConsentGrant() *platformv1.ConsentGrant {
	return cloneConsent(fixtures.ConsentOnboarding)
}

func cloneConsent(grant *platformv1.ConsentGrant) *platformv1.ConsentGrant {
	return proto.Clone(grant).(*platformv1.ConsentGrant)
}

func mustConsentTime(t *testing.T, value string) time.Time {
	t.Helper()

	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		t.Fatalf("time.Parse(%q) error = %v", value, err)
	}
	return parsed
}
