package platform

import (
	"errors"
	"testing"

	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestValidateEnvelopeAcceptsCompleteHeader(t *testing.T) {
	header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)

	if err := ValidateEnvelope(header); err != nil {
		t.Fatalf("ValidateEnvelope() error = %v, want nil", err)
	}
}

func TestValidateEnvelopeRejectsMissingRequiredField(t *testing.T) {
	tests := []struct {
		name   string
		field  string
		mutate func(*platformv1.Envelope)
	}{
		{"contract id", "contract_id", func(h *platformv1.Envelope) { h.ContractId = "" }},
		{"schema version", "schema_version", func(h *platformv1.Envelope) { h.SchemaVersion = "" }},
		{"tenant id", "tenant_id", func(h *platformv1.Envelope) { h.TenantId = "" }},
		{"actor ref", "actor_ref", func(h *platformv1.Envelope) { h.ActorRef = nil }},
		{"occurred at", "occurred_at", func(h *platformv1.Envelope) { h.OccurredAt = nil }},
		{"recorded at", "recorded_at", func(h *platformv1.Envelope) { h.RecordedAt = nil }},
		{"correlation id", "correlation_id", func(h *platformv1.Envelope) { h.CorrelationId = "" }},
		{"causation id", "causation_id", func(h *platformv1.Envelope) { h.CausationId = "" }},
		{"consent purpose", "consent_purpose", func(h *platformv1.Envelope) { h.ConsentPurpose = "" }},
		{"policy version", "policy_version", func(h *platformv1.Envelope) { h.PolicyVersion = "" }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
			tt.mutate(header)

			assertNamedFieldError(t, ValidateEnvelope(header), tt.field)
		})
	}
}

func TestValidateEnvelopeRejectsInvalidTimestamp(t *testing.T) {
	tests := []struct {
		name   string
		field  string
		mutate func(*platformv1.Envelope)
	}{
		{
			name:  "occurred at",
			field: "occurred_at",
			mutate: func(h *platformv1.Envelope) {
				h.OccurredAt = &timestamppb.Timestamp{Seconds: 253402300800}
			},
		},
		{
			name:  "recorded at",
			field: "recorded_at",
			mutate: func(h *platformv1.Envelope) {
				h.RecordedAt = &timestamppb.Timestamp{Seconds: 253402300800}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
			tt.mutate(header)

			assertNamedFieldError(t, ValidateEnvelope(header), tt.field)
		})
	}
}

func TestValidateEnvelopeAllowsOptionalFieldsToBeUnset(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(*platformv1.Envelope)
	}{
		{"model version", func(h *platformv1.Envelope) { h.ModelVersion = "" }},
		{"evidence refs", func(h *platformv1.Envelope) { h.EvidenceRefs = nil }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
			tt.mutate(header)

			if err := ValidateEnvelope(header); err != nil {
				t.Fatalf("ValidateEnvelope() error = %v, want nil", err)
			}
		})
	}
}

func TestAssertEnvelopeCompleteRejectsNilHeader(t *testing.T) {
	assertNamedFieldError(t, AssertEnvelopeComplete(nil), "contract_id")
}

func assertNamedFieldError(t *testing.T, err error, wantField string) {
	t.Helper()

	var fieldErr *NamedFieldError
	if !errors.As(err, &fieldErr) {
		t.Fatalf("error = %T %v, want *NamedFieldError", err, err)
	}
	if fieldErr.Field != wantField {
		t.Fatalf("NamedFieldError.Field = %q, want %q", fieldErr.Field, wantField)
	}
}
