package platform

import platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"

// ValidateLearnerEvent validates the common envelope and the required
// event-local fields on an immutable learner event.
func ValidateLearnerEvent(event *platformv1.LearnerEvent) error {
	if err := ValidateEnvelope(event.GetHeader()); err != nil {
		return err
	}

	header := event.GetHeader()
	if header.GetOccurredAt().AsTime().Equal(header.GetRecordedAt().AsTime()) {
		return &NamedFieldError{Field: "recorded_at"}
	}
	if event.GetEventType() == "" {
		return &NamedFieldError{Field: "event_type"}
	}
	if event.GetLearnerRef() == "" {
		return &NamedFieldError{Field: "learner_ref"}
	}
	if event.GetSource() == "" {
		return &NamedFieldError{Field: "source"}
	}
	if event.GetPayloadSchema() == "" {
		return &NamedFieldError{Field: "payload_schema"}
	}
	return nil
}
