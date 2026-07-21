package spine

import (
	"os"
	"strings"
	"testing"
)

func TestREADMEExplainsOrchestrationAndProductionBoundaries(t *testing.T) {
	t.Parallel()

	contents, err := os.ReadFile("README.md")
	if err != nil {
		t.Fatalf("read package README: %v", err)
	}

	for _, required := range []string{
		"# Foundation spine orchestration",
		"## Public API",
		"`HandleCommand`",
		"`UnitOfWork`",
		"`OutboxStore`",
		"`Relay`",
		"at-least-once",
		"`Deliver`",
		"`contract_id`",
		"`ConsumerOffsets`",
		"`NewAuditEntry`",
		"`RecordOverride`",
		"`FileAppeal`",
		"`Authorizer`",
		"OPA",
		"`policy_version`",
		"PostgreSQL",
		"Redpanda",
		"`//go:build integration`",
		"## Limits and deferred production work",
		"Lifecycle record and audit appends do not share a transaction.",
		"GT100K defers managed runtime deployment and operations.",
	} {
		if !strings.Contains(string(contents), required) {
			t.Errorf("README is missing %q", required)
		}
	}
}
