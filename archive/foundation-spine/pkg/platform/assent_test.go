package platform

import (
	"testing"

	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestValidateAssentRecordAcceptsCompleteRecord(t *testing.T) {
	record := validAssentRecord()

	if err := ValidateAssentRecord(record); err != nil {
		t.Fatalf("ValidateAssentRecord() error = %v, want nil", err)
	}
}

func TestValidateAssentRecordRejectsIncompleteEnvelope(t *testing.T) {
	record := validAssentRecord()
	record.Header.ContractId = ""

	assertNamedFieldError(t, ValidateAssentRecord(record), "contract_id")
}

func TestValidateAssentRecordRejectsMissingRequiredField(t *testing.T) {
	tests := []struct {
		name   string
		field  string
		mutate func(*platformv1.AssentRecord)
	}{
		{"child ref", "child_ref", func(r *platformv1.AssentRecord) { r.ChildRef = "" }},
		{"age band", "age_band", func(r *platformv1.AssentRecord) { r.AgeBand = "" }},
		{"notice version", "notice_version", func(r *platformv1.AssentRecord) { r.NoticeVersion = "" }},
		{"choices shown", "choices_shown", func(r *platformv1.AssentRecord) { r.ChoicesShown = nil }},
		{"response", "response", func(r *platformv1.AssentRecord) {
			r.Response = platformv1.AssentResponse_ASSENT_RESPONSE_UNSPECIFIED
		}},
		{"facilitator", "facilitator", func(r *platformv1.AssentRecord) { r.Facilitator = nil }},
		{"recorded at", "recorded_at", func(r *platformv1.AssentRecord) { r.RecordedAt = nil }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			record := validAssentRecord()
			tt.mutate(record)

			assertNamedFieldError(t, ValidateAssentRecord(record), tt.field)
		})
	}
}

func TestValidateAssentRecordRejectsUnknownResponse(t *testing.T) {
	record := validAssentRecord()
	record.Response = platformv1.AssentResponse(99)

	assertNamedFieldError(t, ValidateAssentRecord(record), "response")
}

func TestValidateAssentRecordRejectsInvalidTimestamp(t *testing.T) {
	tests := []struct {
		name   string
		field  string
		mutate func(*platformv1.AssentRecord)
	}{
		{
			name:  "recorded at",
			field: "recorded_at",
			mutate: func(r *platformv1.AssentRecord) {
				r.RecordedAt = &timestamppb.Timestamp{Seconds: 253402300800}
			},
		},
		{
			name:  "renewal at",
			field: "renewal_at",
			mutate: func(r *platformv1.AssentRecord) {
				r.RenewalAt = &timestamppb.Timestamp{Seconds: 253402300800}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			record := validAssentRecord()
			tt.mutate(record)

			assertNamedFieldError(t, ValidateAssentRecord(record), tt.field)
		})
	}
}

func TestValidateAssentRecordAllowsOptionalRenewalAndNonHonorableResponse(t *testing.T) {
	record := validAssentRecord()
	record.RenewalAt = nil
	record.Honorable = false

	if err := ValidateAssentRecord(record); err != nil {
		t.Fatalf("ValidateAssentRecord() error = %v, want nil", err)
	}
}

func TestAssentBlocksGoldenTable(t *testing.T) {
	tests := []struct {
		name       string
		honorable  bool
		response   platformv1.AssentResponse
		wantBlocks bool
	}{
		{"honorable refusal", true, platformv1.AssentResponse_REFUSAL, true},
		{"honorable dissent", true, platformv1.AssentResponse_DISSENT, true},
		{"honorable assent", true, platformv1.AssentResponse_ASSENT, false},
		{"non-honorable refusal", false, platformv1.AssentResponse_REFUSAL, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			record := validAssentRecord()
			record.Honorable = tt.honorable
			record.Response = tt.response

			if got := AssentBlocks(record); got != tt.wantBlocks {
				t.Fatalf("AssentBlocks() = %t, want %t", got, tt.wantBlocks)
			}
		})
	}
}

func TestAssentBlocksDespiteActiveGuardianConsent(t *testing.T) {
	if !IsConsentActive(fixtures.ConsentOnboarding, mustConsentTime(t, fixtures.T0)) {
		t.Fatal("IsConsentActive(ConsentOnboarding) = false, need active guardian consent for SC-007")
	}

	record := validAssentRecord()
	record.Response = platformv1.AssentResponse_REFUSAL
	record.Honorable = true

	if !AssentBlocks(record) {
		t.Fatal("AssentBlocks() = false, want honorable child refusal to veto active guardian consent")
	}
}

func validAssentRecord() *platformv1.AssentRecord {
	header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
	header.SchemaVersion = "assent_record/1"
	header.ConsentPurpose = "research.trial"

	return &platformv1.AssentRecord{
		Header:        header,
		ChildRef:      fixtures.Child.Ref,
		AgeBand:       "13-15",
		NoticeVersion: "plain-language-notice/1",
		ChoicesShown:  []string{"assent", "refuse", "ask_questions"},
		Response:      platformv1.AssentResponse_ASSENT,
		Facilitator:   proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
		RecordedAt:    proto.Clone(header.RecordedAt).(*timestamppb.Timestamp),
		RenewalAt:     timestamppb.New(header.RecordedAt.AsTime().AddDate(1, 0, 0)),
		Honorable:     true,
	}
}
