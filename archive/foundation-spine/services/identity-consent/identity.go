package identityconsent

import (
	"context"
	"fmt"

	"github.com/gt100k/platform/pkg/platform"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
)

// ProvisionLearner consumes one eligible-learner handoff and returns only its
// downstream pseudonymous actor reference.
func ProvisionLearner(
	ctx context.Context,
	identities IdentityRepository,
	source EnrollmentHandoffSource,
) (*platformv1.ActorRef, error) {
	if identities == nil {
		return nil, fmt.Errorf("provision learner: nil identity repository")
	}
	if source == nil {
		return nil, fmt.Errorf("provision learner: nil enrollment handoff source")
	}

	learner, err := source.Next(ctx)
	if err != nil {
		return nil, fmt.Errorf("provision learner: read enrollment handoff: %w", err)
	}
	if err := validateEligibleLearner(learner); err != nil {
		return nil, err
	}

	actor, err := identities.Provision(ctx, learner)
	if err != nil {
		return nil, fmt.Errorf("provision learner: persist pseudonymous actor: %w", err)
	}
	if err := validatePseudonymousActor(actor); err != nil {
		return nil, err
	}
	return actor, nil
}

// ResolveActor exchanges an opaque session reference for a pseudonymous actor
// reference without exposing the identity mapping to downstream callers.
func ResolveActor(
	ctx context.Context,
	identities IdentityRepository,
	sessionRef string,
) (*platformv1.ActorRef, error) {
	if sessionRef == "" {
		return nil, fmt.Errorf("resolve actor: empty session ref")
	}
	if identities == nil {
		return nil, fmt.Errorf("resolve actor: nil identity repository")
	}

	actor, err := identities.ResolveActor(ctx, sessionRef)
	if err != nil {
		return nil, fmt.Errorf("resolve actor: %w", err)
	}
	if err := validatePseudonymousActor(actor); err != nil {
		return nil, err
	}
	return actor, nil
}

func validateEligibleLearner(learner *platformv1.EligibleLearner) error {
	if learner.GetLearnerRef() == "" {
		return &platform.NamedFieldError{Field: "learner_ref"}
	}
	if learner.GetAccommodationProfileRef() == "" {
		return &platform.NamedFieldError{Field: "accommodation_profile_ref"}
	}
	if learner.GetEligibilityEvidenceRef() == "" {
		return &platform.NamedFieldError{Field: "eligibility_evidence_ref"}
	}
	switch learner.GetTrack() {
	case platformv1.Track_TRACK_A, platformv1.Track_TRACK_B:
	default:
		return &platform.NamedFieldError{Field: "track"}
	}
	return nil
}

func validatePseudonymousActor(actor *platformv1.ActorRef) error {
	if actor.GetRef() == "" {
		return &platform.NamedFieldError{Field: "actor_ref.ref"}
	}
	switch actor.GetClass() {
	case platformv1.ActorClass_HUMAN,
		platformv1.ActorClass_GUARDIAN,
		platformv1.ActorClass_CHILD,
		platformv1.ActorClass_STAFF,
		platformv1.ActorClass_MODEL,
		platformv1.ActorClass_SYSTEM:
	default:
		return &platform.NamedFieldError{Field: "actor_ref.class"}
	}
	if actor.GetRole() == "" {
		return &platform.NamedFieldError{Field: "actor_ref.role"}
	}
	return nil
}
