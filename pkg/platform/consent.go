package platform

import (
	"time"

	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
)

// ValidateConsentGrant validates the common envelope and required consent
// fields. Expiry and withdrawal state are optional.
func ValidateConsentGrant(grant *platformv1.ConsentGrant) error {
	if err := ValidateEnvelope(grant.GetHeader()); err != nil {
		return err
	}
	if grant.GetSubjectRef() == "" {
		return &NamedFieldError{Field: "subject_ref"}
	}
	if !grant.GetGuardianAuthority() {
		return &NamedFieldError{Field: "guardian_authority"}
	}
	if grant.GetPurpose() == "" {
		return &NamedFieldError{Field: "purpose"}
	}
	if len(grant.GetDataCategories()) == 0 {
		return &NamedFieldError{Field: "data_categories"}
	}
	if len(grant.GetProcessors()) == 0 {
		return &NamedFieldError{Field: "processors"}
	}
	if grant.GetJurisdiction() == "" {
		return &NamedFieldError{Field: "jurisdiction"}
	}
	if grant.GetEffectiveAt() == nil || grant.GetEffectiveAt().CheckValid() != nil {
		return &NamedFieldError{Field: "effective_at"}
	}
	if grant.GetExpiryAt() != nil && grant.GetExpiryAt().CheckValid() != nil {
		return &NamedFieldError{Field: "expiry_at"}
	}
	if grant.GetCollectionMethod() == "" {
		return &NamedFieldError{Field: "collection_method"}
	}
	if grant.GetDocumentHash() == "" {
		return &NamedFieldError{Field: "document_hash"}
	}

	withdrawal := grant.GetWithdrawalState()
	if withdrawal.GetWithdrawn() && withdrawal.GetWithdrawnAt() == nil {
		return &NamedFieldError{Field: "withdrawal_state.withdrawn_at"}
	}
	if withdrawal.GetWithdrawnAt() != nil && withdrawal.GetWithdrawnAt().CheckValid() != nil {
		return &NamedFieldError{Field: "withdrawal_state.withdrawn_at"}
	}
	return nil
}

// IsConsentActive reports whether a valid grant is within its effective
// window and has not been withdrawn. The effective bound is inclusive and
// the optional expiry bound is exclusive.
func IsConsentActive(grant *platformv1.ConsentGrant, at time.Time) bool {
	if ValidateConsentGrant(grant) != nil {
		return false
	}
	if grant.GetWithdrawalState().GetWithdrawn() {
		return false
	}
	if at.Before(grant.GetEffectiveAt().AsTime()) {
		return false
	}
	return grant.GetExpiryAt() == nil || at.Before(grant.GetExpiryAt().AsTime())
}
