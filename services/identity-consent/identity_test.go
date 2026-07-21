package identityconsent

import (
	"context"
	"errors"
	"testing"

	"github.com/gt100k/platform/pkg/platform"
	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
)

func TestProvisionLearnerTransfersReferenceOnlyHandoffAndReturnsActorRef(t *testing.T) {
	source := newMemoryEnrollmentSource(fixtures.EligibleLearner)
	identities := newMemoryIdentityRepository(&platformv1.ActorRef{
		Ref:   fixtures.EligibleLearner.GetLearnerRef(),
		Class: platformv1.ActorClass_CHILD,
		Role:  "learner",
	})

	got, err := ProvisionLearner(context.Background(), identities, source)
	if err != nil {
		t.Fatalf("ProvisionLearner() error = %v", err)
	}
	wantActor := &platformv1.ActorRef{
		Ref:   fixtures.EligibleLearner.GetLearnerRef(),
		Class: platformv1.ActorClass_CHILD,
		Role:  "learner",
	}
	if !proto.Equal(got, wantActor) {
		t.Fatalf("ProvisionLearner() = %v, want %v", got, wantActor)
	}

	provisioned := identities.provisionedLearners()
	if len(provisioned) != 1 {
		t.Fatalf("provisioned learners = %d, want 1", len(provisioned))
	}
	if !proto.Equal(provisioned[0], fixtures.EligibleLearner) {
		t.Errorf("provisioned handoff = %v, want reference-only fixture %v", provisioned[0], fixtures.EligibleLearner)
	}
}

func TestEligibleLearnerHandoffHasOnlyPinnedReferenceFields(t *testing.T) {
	fields := fixtures.EligibleLearner.ProtoReflect().Descriptor().Fields()
	want := []string{
		"learner_ref",
		"accommodation_profile_ref",
		"eligibility_evidence_ref",
		"track",
	}
	if fields.Len() != len(want) {
		t.Fatalf("EligibleLearner field count = %d, want %d", fields.Len(), len(want))
	}
	for i, name := range want {
		if got := string(fields.Get(i).Name()); got != name {
			t.Errorf("EligibleLearner field %d = %q, want %q", i+1, got, name)
		}
	}
}

func TestProvisionLearnerRejectsIncompleteHandoffBeforePersistence(t *testing.T) {
	assertProvisionLearnerRejected(t, "nil handoff", nil, "learner_ref")

	for _, field := range []protoreflect.Name{
		"learner_ref",
		"accommodation_profile_ref",
		"eligibility_evidence_ref",
		"track",
	} {
		learner := proto.Clone(fixtures.EligibleLearner).(*platformv1.EligibleLearner)
		learner.ProtoReflect().Clear(learner.ProtoReflect().Descriptor().Fields().ByName(field))
		assertProvisionLearnerRejected(t, string(field), learner, string(field))
	}

	learner := proto.Clone(fixtures.EligibleLearner).(*platformv1.EligibleLearner)
	learner.Track = platformv1.Track(99)
	assertProvisionLearnerRejected(t, "unknown track", learner, "track")
}

func TestResolveActorReturnsOnlyPseudonymousReference(t *testing.T) {
	identities := newMemoryIdentityRepository(nil)
	identities.addSession("session_synth_001", fixtures.Child)

	got, err := ResolveActor(context.Background(), identities, "session_synth_001")
	if err != nil {
		t.Fatalf("ResolveActor() error = %v", err)
	}
	if !proto.Equal(got, fixtures.Child) {
		t.Fatalf("ResolveActor() = %v, want %v", got, fixtures.Child)
	}
}

func TestResolveActorRejectsEmptySessionBeforeRepository(t *testing.T) {
	identities := newMemoryIdentityRepository(nil)

	_, err := ResolveActor(context.Background(), identities, "")
	if err == nil || err.Error() != "resolve actor: empty session ref" {
		t.Fatalf("ResolveActor() error = %v, want empty session ref", err)
	}
	if got := identities.resolveCalls(); got != 0 {
		t.Fatalf("identity repository resolve calls = %d, want 0", got)
	}
}

func TestProvisionLearnerRejectsIncompletePseudonymousActor(t *testing.T) {
	tests := []struct {
		name  string
		actor *platformv1.ActorRef
		field string
	}{
		{name: "nil actor", actor: nil, field: "actor_ref.ref"},
		{
			name:  "missing ref",
			actor: &platformv1.ActorRef{Class: platformv1.ActorClass_CHILD, Role: "learner"},
			field: "actor_ref.ref",
		},
		{
			name:  "unspecified class",
			actor: &platformv1.ActorRef{Ref: "learner_synth_001", Role: "learner"},
			field: "actor_ref.class",
		},
		{
			name: "unknown class",
			actor: &platformv1.ActorRef{
				Ref:   "learner_synth_001",
				Class: platformv1.ActorClass(99),
				Role:  "learner",
			},
			field: "actor_ref.class",
		},
		{
			name:  "missing role",
			actor: &platformv1.ActorRef{Ref: "learner_synth_001", Class: platformv1.ActorClass_CHILD},
			field: "actor_ref.role",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			identities := newMemoryIdentityRepository(tt.actor)
			source := newMemoryEnrollmentSource(fixtures.EligibleLearner)

			_, err := ProvisionLearner(context.Background(), identities, source)
			var fieldErr *platform.NamedFieldError
			if !errors.As(err, &fieldErr) || fieldErr.Field != tt.field {
				t.Fatalf("ProvisionLearner() error = %v, want *NamedFieldError for %q", err, tt.field)
			}
		})
	}
}

func TestResolveActorRejectsIncompletePseudonymousActor(t *testing.T) {
	identities := newMemoryIdentityRepository(nil)
	identities.addSession("session_synth_001", &platformv1.ActorRef{
		Ref:   "actor_pseudo_child_01",
		Class: platformv1.ActorClass_CHILD,
	})

	_, err := ResolveActor(context.Background(), identities, "session_synth_001")
	var fieldErr *platform.NamedFieldError
	if !errors.As(err, &fieldErr) || fieldErr.Field != "actor_ref.role" {
		t.Fatalf("ResolveActor() error = %v, want *NamedFieldError for actor_ref.role", err)
	}
}

func assertProvisionLearnerRejected(
	t *testing.T,
	name string,
	learner *platformv1.EligibleLearner,
	field string,
) {
	t.Helper()
	t.Run(name, func(t *testing.T) {
		identities := newMemoryIdentityRepository(proto.Clone(fixtures.Child).(*platformv1.ActorRef))
		_, err := ProvisionLearner(context.Background(), identities, newMemoryEnrollmentSource(learner))
		var fieldErr *platform.NamedFieldError
		if !errors.As(err, &fieldErr) || fieldErr.Field != field {
			t.Fatalf("ProvisionLearner() error = %v, want *NamedFieldError for %q", err, field)
		}
		if got := len(identities.provisionedLearners()); got != 0 {
			t.Fatalf("provisioned learners = %d, want 0", got)
		}
	})
}
