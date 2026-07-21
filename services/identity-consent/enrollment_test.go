package identityconsent

import (
	"context"
	"testing"

	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

func TestEnrollmentStubYieldsCanonicalReferenceOnlyLearner(t *testing.T) {
	var source EnrollmentHandoffSource = NewEnrollmentStub()

	got, err := source.Next(context.Background())
	if err != nil {
		t.Fatalf("EnrollmentStub.Next() error = %v", err)
	}
	if !proto.Equal(got, fixtures.EligibleLearner) {
		t.Fatalf("EnrollmentStub.Next() = %v, want %v", got, fixtures.EligibleLearner)
	}

	fields := got.ProtoReflect().Descriptor().Fields()
	wantFields := []string{
		"learner_ref",
		"accommodation_profile_ref",
		"eligibility_evidence_ref",
		"track",
	}
	if fields.Len() != len(wantFields) {
		t.Fatalf("EligibleLearner field count = %d, want %d", fields.Len(), len(wantFields))
	}
	for i, want := range wantFields {
		if got := string(fields.Get(i).Name()); got != want {
			t.Errorf("EligibleLearner field %d = %q, want %q", i+1, got, want)
		}
	}
}

func TestEnrollmentStubReturnsIndependentLearners(t *testing.T) {
	source := NewEnrollmentStub()

	first, err := source.Next(context.Background())
	if err != nil {
		t.Fatalf("first EnrollmentStub.Next() error = %v", err)
	}
	first.LearnerRef = "mutated"
	first.Track = platformv1.Track_TRACK_B

	second, err := source.Next(context.Background())
	if err != nil {
		t.Fatalf("second EnrollmentStub.Next() error = %v", err)
	}
	if !proto.Equal(second, fixtures.EligibleLearner) {
		t.Fatalf("second EnrollmentStub.Next() = %v, want untouched fixture %v", second, fixtures.EligibleLearner)
	}
	if second == fixtures.EligibleLearner {
		t.Fatal("EnrollmentStub.Next() returned the mutable canonical fixture")
	}
}
