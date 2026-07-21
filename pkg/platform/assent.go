package platform

import platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"

// ValidateAssentRecord validates the common envelope and required assent
// fields. Renewal time is optional, and honorable is meaningful when false.
func ValidateAssentRecord(record *platformv1.AssentRecord) error {
	if err := ValidateEnvelope(record.GetHeader()); err != nil {
		return err
	}
	if record.GetChildRef() == "" {
		return &NamedFieldError{Field: "child_ref"}
	}
	if record.GetAgeBand() == "" {
		return &NamedFieldError{Field: "age_band"}
	}
	if record.GetNoticeVersion() == "" {
		return &NamedFieldError{Field: "notice_version"}
	}
	if len(record.GetChoicesShown()) == 0 {
		return &NamedFieldError{Field: "choices_shown"}
	}
	switch record.GetResponse() {
	case platformv1.AssentResponse_ASSENT,
		platformv1.AssentResponse_REFUSAL,
		platformv1.AssentResponse_DISSENT:
	default:
		return &NamedFieldError{Field: "response"}
	}
	if record.GetFacilitator() == nil {
		return &NamedFieldError{Field: "facilitator"}
	}
	if record.GetRecordedAt() == nil || record.GetRecordedAt().CheckValid() != nil {
		return &NamedFieldError{Field: "recorded_at"}
	}
	if record.GetRenewalAt() != nil && record.GetRenewalAt().CheckValid() != nil {
		return &NamedFieldError{Field: "renewal_at"}
	}
	return nil
}

// AssentBlocks reports whether an honorable child response vetoes the
// optional collection. Guardian consent does not override this result.
func AssentBlocks(record *platformv1.AssentRecord) bool {
	return record.GetHonorable() && record.GetResponse() != platformv1.AssentResponse_ASSENT
}
