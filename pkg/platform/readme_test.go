package platform

import (
	"os"
	"strings"
	"testing"
)

func TestREADMEExplainsPublicContractAPI(t *testing.T) {
	t.Parallel()

	contents, err := os.ReadFile("README.md")
	if err != nil {
		t.Fatalf("read package README: %v", err)
	}

	for _, required := range []string{
		"# Platform contract invariants",
		"## Public API",
		"`Envelope`",
		"`LearnerEvent`",
		"`ConsentGrant`",
		"`AssentRecord`",
		"`DecisionRecord`",
		"`OverrideRecord`",
		"`Appeal`",
		"`ValidateEnvelope`",
		"`ValidateLearnerEvent`",
		"`ValidateConsentGrant`",
		"`ValidateAssentRecord`",
		"`ValidateDecisionRecord`",
		"`ValidateOverrideRecord`",
		"`ValidateAppeal`",
		"`NamedFieldError`",
		"`AuthorityForgeryError`",
		"`AppendOnlyError`",
		"`FourEyesError`",
		"`ReviewerConflictError`",
		"`Clock`",
		"`IDGenerator`",
		"GT100K defers human approval routing, notifications, SLA timers, and remedy execution to a later production layer.",
	} {
		if !strings.Contains(string(contents), required) {
			t.Errorf("README is missing %q", required)
		}
	}
}
