package platform

import platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"

// ValidateEnvelope validates the common traceability header on a contract.
func ValidateEnvelope(header *platformv1.Envelope) error {
	return AssertEnvelopeComplete(header)
}

// AssertEnvelopeComplete verifies the required traceability fields shared by
// every platform contract. Model version and evidence references are optional.
func AssertEnvelopeComplete(header *platformv1.Envelope) error {
	if header.GetContractId() == "" {
		return &NamedFieldError{Field: "contract_id"}
	}
	if header.GetSchemaVersion() == "" {
		return &NamedFieldError{Field: "schema_version"}
	}
	if header.GetTenantId() == "" {
		return &NamedFieldError{Field: "tenant_id"}
	}
	if header.GetActorRef() == nil {
		return &NamedFieldError{Field: "actor_ref"}
	}
	if header.GetOccurredAt() == nil || header.GetOccurredAt().CheckValid() != nil {
		return &NamedFieldError{Field: "occurred_at"}
	}
	if header.GetRecordedAt() == nil || header.GetRecordedAt().CheckValid() != nil {
		return &NamedFieldError{Field: "recorded_at"}
	}
	if header.GetCorrelationId() == "" {
		return &NamedFieldError{Field: "correlation_id"}
	}
	if header.GetCausationId() == "" {
		return &NamedFieldError{Field: "causation_id"}
	}
	if header.GetConsentPurpose() == "" {
		return &NamedFieldError{Field: "consent_purpose"}
	}
	if header.GetPolicyVersion() == "" {
		return &NamedFieldError{Field: "policy_version"}
	}
	return nil
}
