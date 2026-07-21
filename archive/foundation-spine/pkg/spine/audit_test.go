package spine_test

import (
	"errors"
	"testing"

	platform "github.com/gt100k/platform/pkg/platform"
	"github.com/gt100k/platform/pkg/platform/fixtures"
	"github.com/gt100k/platform/pkg/spine"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

func TestNewAuditEntryBuildsIndependentValidatedRecord(t *testing.T) {
	t.Parallel()

	header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
	actor := proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef)
	entry, err := spine.NewAuditEntry(spine.AuditEntryInput{
		EntryID: "audit_helper",
		Header:  header,
		Actor:   actor,
		Action:  "decision",
		Policy: spine.PolicyDecision{
			Allow:         true,
			Reason:        "allow",
			PolicyVersion: fixtures.PolicyVersion,
		},
		Outcome: "pathway_synth_a",
	})
	if err != nil {
		t.Fatalf("NewAuditEntry() error = %v", err)
	}
	header.TenantId = "caller_mutation"
	actor.Ref = "caller_mutation"

	if got, want := entry.GetHeader().GetTenantId(), fixtures.Tenant; got != want {
		t.Fatalf("entry.header.tenant_id = %q, want %q", got, want)
	}
	if got, want := entry.GetActorRef().GetRef(), fixtures.StaffGuide.GetRef(); got != want {
		t.Fatalf("entry.actor_ref.ref = %q, want %q", got, want)
	}
	if got, want := entry.GetPolicyVersion(), fixtures.PolicyVersion; got != want {
		t.Fatalf("entry.policy_version = %q, want %q", got, want)
	}
	if err := spine.ValidateAuditEntry(entry); err != nil {
		t.Fatalf("ValidateAuditEntry() error = %v", err)
	}
}

func TestValidateAuditEntryNamesMissingRequiredFields(t *testing.T) {
	t.Parallel()

	valid, err := spine.NewAuditEntry(spine.AuditEntryInput{
		EntryID: "audit_validation",
		Header:  fixtures.ValidEnvelope,
		Actor:   fixtures.StaffGuide,
		Action:  "decision",
		Policy: spine.PolicyDecision{
			Allow:         true,
			Reason:        "allow",
			PolicyVersion: fixtures.PolicyVersion,
		},
		Outcome: "pathway_synth_a",
	})
	if err != nil {
		t.Fatalf("NewAuditEntry(valid) error = %v", err)
	}

	tests := []struct {
		name  string
		field string
		edit  func(*platformv1.AuditEntry)
	}{
		{name: "entry id", field: "entry_id", edit: func(entry *platformv1.AuditEntry) { entry.EntryId = "" }},
		{name: "actor", field: "actor_ref", edit: func(entry *platformv1.AuditEntry) { entry.ActorRef = nil }},
		{name: "action", field: "action", edit: func(entry *platformv1.AuditEntry) { entry.Action = "" }},
		{name: "policy version", field: "policy_version", edit: func(entry *platformv1.AuditEntry) { entry.PolicyVersion = "" }},
		{name: "outcome", field: "outcome", edit: func(entry *platformv1.AuditEntry) { entry.Outcome = "" }},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entry := proto.Clone(valid).(*platformv1.AuditEntry)
			tt.edit(entry)
			err := spine.ValidateAuditEntry(entry)
			var fieldErr *platform.NamedFieldError
			if !errors.As(err, &fieldErr) {
				t.Fatalf("ValidateAuditEntry() error = %T, want *platform.NamedFieldError", err)
			}
			if got := fieldErr.Field; got != tt.field {
				t.Fatalf("ValidateAuditEntry() field = %q, want %q", got, tt.field)
			}
		})
	}
}
