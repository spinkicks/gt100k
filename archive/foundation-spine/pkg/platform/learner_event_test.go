package platform

import (
	"testing"

	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

func TestValidateLearnerEventAcceptsCompleteEvent(t *testing.T) {
	event := validLearnerEvent()

	if err := ValidateLearnerEvent(event); err != nil {
		t.Fatalf("ValidateLearnerEvent() error = %v, want nil", err)
	}
}

func TestValidateLearnerEventRejectsIncompleteEnvelope(t *testing.T) {
	event := validLearnerEvent()
	event.Header.ContractId = ""

	assertNamedFieldError(t, ValidateLearnerEvent(event), "contract_id")
}

func TestValidateLearnerEventRejectsEqualOccurredAndRecordedTimes(t *testing.T) {
	event := validLearnerEvent()
	event.Header.RecordedAt = event.Header.OccurredAt

	assertNamedFieldError(t, ValidateLearnerEvent(event), "recorded_at")
}

func TestValidateLearnerEventRejectsMissingRequiredField(t *testing.T) {
	tests := []struct {
		name   string
		field  string
		mutate func(*platformv1.LearnerEvent)
	}{
		{"event type", "event_type", func(e *platformv1.LearnerEvent) { e.EventType = "" }},
		{"learner ref", "learner_ref", func(e *platformv1.LearnerEvent) { e.LearnerRef = "" }},
		{"source", "source", func(e *platformv1.LearnerEvent) { e.Source = "" }},
		{"payload schema", "payload_schema", func(e *platformv1.LearnerEvent) { e.PayloadSchema = "" }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := validLearnerEvent()
			tt.mutate(event)

			assertNamedFieldError(t, ValidateLearnerEvent(event), tt.field)
		})
	}
}

func TestValidateLearnerEventAllowsOptionalFieldsToBeUnset(t *testing.T) {
	event := validLearnerEvent()
	event.Context = nil
	event.EvidenceRefs = nil

	if err := ValidateLearnerEvent(event); err != nil {
		t.Fatalf("ValidateLearnerEvent() error = %v, want nil", err)
	}
}

func validLearnerEvent() *platformv1.LearnerEvent {
	header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
	header.SchemaVersion = "learner_event/1"

	return &platformv1.LearnerEvent{
		Header:        header,
		EventType:     "learner.synthetic_updated",
		LearnerRef:    fixtures.EligibleLearner.LearnerRef,
		Source:        "synthetic-foundation-test",
		Context:       &platformv1.EventContext{SessionRef: "session_synth_001"},
		PayloadSchema: "learner.synthetic_updated/1",
		EvidenceRefs:  []string{"evidence://fixture/synth_001#sha256:cc33"},
	}
}
