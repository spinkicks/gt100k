package identityconsent

import (
	"context"
	"testing"
	"time"

	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

func TestAuthorizeMatchesGoldenDecisionTable(t *testing.T) {
	tests := []struct {
		name         string
		purpose      string
		jurisdiction string
		consents     []*platformv1.ConsentGrant
		want         PolicyDecision
	}{
		{
			name:         "allow",
			purpose:      "onboarding.schedule",
			jurisdiction: "US-CA",
			consents:     []*platformv1.ConsentGrant{fixtures.ConsentOnboarding},
			want:         PolicyDecision{Allow: true, Reason: "allow", PolicyVersion: fixtures.PolicyVersion},
		},
		{
			name:         "no consent",
			purpose:      "onboarding.schedule",
			jurisdiction: "US-CA",
			want:         PolicyDecision{Reason: "no_active_consent", PolicyVersion: fixtures.PolicyVersion},
		},
		{
			name:         "withdrawn",
			purpose:      "onboarding.schedule",
			jurisdiction: "US-CA",
			consents:     []*platformv1.ConsentGrant{fixtures.ConsentOnboardingWithdrawn},
			want:         PolicyDecision{Reason: "no_active_consent", PolicyVersion: fixtures.PolicyVersion},
		},
		{
			name:         "expired",
			purpose:      "onboarding.schedule",
			jurisdiction: "US-CA",
			consents:     []*platformv1.ConsentGrant{fixtures.ConsentOnboardingExpired},
			want:         PolicyDecision{Reason: "no_active_consent", PolicyVersion: fixtures.PolicyVersion},
		},
		{
			name:         "jurisdiction mismatch",
			purpose:      "onboarding.schedule",
			jurisdiction: "US-NY",
			consents:     []*platformv1.ConsentGrant{fixtures.ConsentOnboarding},
			want:         PolicyDecision{Reason: "jurisdiction_mismatch", PolicyVersion: fixtures.PolicyVersion},
		},
		{
			name:         "deny by default",
			purpose:      "research.trial",
			jurisdiction: "US-CA",
			consents:     []*platformv1.ConsentGrant{fixtures.ConsentResearch},
			want:         PolicyDecision{Reason: "deny_by_default", PolicyVersion: fixtures.PolicyVersion},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Authorize(context.Background(), PolicyInput{
				Actor:        proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
				Purpose:      tt.purpose,
				SubjectRef:   fixtures.EligibleLearner.LearnerRef,
				Jurisdiction: tt.jurisdiction,
				At:           mustAuthzTime(t, fixtures.T0),
				Consents:     cloneConsents(tt.consents),
			})
			if err != nil {
				t.Fatalf("Authorize() error = %v", err)
			}
			if got != tt.want {
				t.Fatalf("Authorize() = %+v, want %+v", got, tt.want)
			}
			if got.PolicyVersion == "" {
				t.Fatal("Authorize() returned an empty policy_version")
			}
		})
	}
}

func TestAuthorizeDeniesUnknownRoleByDefault(t *testing.T) {
	actor := proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef)
	actor.Role = "unknown"

	got, err := Authorize(context.Background(), PolicyInput{
		Actor:        actor,
		Purpose:      "onboarding.schedule",
		SubjectRef:   fixtures.EligibleLearner.LearnerRef,
		Jurisdiction: "US-CA",
		At:           mustAuthzTime(t, fixtures.T0),
		Consents:     cloneConsents([]*platformv1.ConsentGrant{fixtures.ConsentOnboarding}),
	})
	if err != nil {
		t.Fatalf("Authorize() error = %v", err)
	}
	want := PolicyDecision{Reason: "deny_by_default", PolicyVersion: fixtures.PolicyVersion}
	if got != want {
		t.Fatalf("Authorize() = %+v, want %+v", got, want)
	}
}

func cloneConsents(consents []*platformv1.ConsentGrant) []*platformv1.ConsentGrant {
	cloned := make([]*platformv1.ConsentGrant, len(consents))
	for i, consent := range consents {
		cloned[i] = proto.Clone(consent).(*platformv1.ConsentGrant)
	}
	return cloned
}

func mustAuthzTime(t *testing.T, value string) time.Time {
	t.Helper()

	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		t.Fatalf("time.Parse(%q) error = %v", value, err)
	}
	return parsed
}
