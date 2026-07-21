// Package fixtures contains deterministic, synthetic records used by the
// foundation-spine acceptance tests and demo.
package fixtures

import (
	"fmt"
	"time"

	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const (
	Tenant        = "gt100k"
	PolicyVersion = "opa-bundle/2026-07-20a"
	T0            = "2026-07-20T14:03:11Z"
	T0Recorded    = "2026-07-20T14:03:11.402Z"
)

var (
	StaffGuide = &platformv1.ActorRef{
		Ref:   "actor_pseudo_guide_01",
		Class: platformv1.ActorClass_STAFF,
		Role:  "guide",
	}
	StaffGuide2 = &platformv1.ActorRef{
		Ref:   "actor_pseudo_guide_02",
		Class: platformv1.ActorClass_STAFF,
		Role:  "guide",
	}
	AdmissionsLead = &platformv1.ActorRef{
		Ref:   "actor_pseudo_admin_01",
		Class: platformv1.ActorClass_STAFF,
		Role:  "admissions_lead",
	}
	Guardian = &platformv1.ActorRef{
		Ref:   "actor_pseudo_guardian_01",
		Class: platformv1.ActorClass_GUARDIAN,
		Role:  "guardian",
	}
	Child = &platformv1.ActorRef{
		Ref:   "actor_pseudo_child_01",
		Class: platformv1.ActorClass_CHILD,
		Role:  "learner",
	}
	Model = &platformv1.ActorRef{
		Ref:   "model_advisor_01",
		Class: platformv1.ActorClass_MODEL,
		Role:  "advisor",
	}
	System = &platformv1.ActorRef{
		Ref:   "system_relay_01",
		Class: platformv1.ActorClass_SYSTEM,
		Role:  "system",
	}
)

var EligibleLearner = &platformv1.EligibleLearner{
	LearnerRef:              "learner_synth_001",
	AccommodationProfileRef: "accom://profile/synth_001",
	EligibilityEvidenceRef:  "evidence://eligibility/synth_001#sha256:aa11",
	Track:                   platformv1.Track_TRACK_A,
}

var ValidEnvelope = &platformv1.Envelope{
	ContractId:     "cid_0001",
	SchemaVersion:  "consent_grant/1",
	TenantId:       Tenant,
	ActorRef:       proto.Clone(StaffGuide).(*platformv1.ActorRef),
	OccurredAt:     mustTimestamp(T0),
	RecordedAt:     mustTimestamp(T0Recorded),
	CorrelationId:  "corr_0001",
	CausationId:    "cid_0000",
	ConsentPurpose: "onboarding.schedule",
	PolicyVersion:  PolicyVersion,
	ModelVersion:   "model/synthetic-v1",
	EvidenceRefs:   []string{"evidence://fixture/synth_001#sha256:bb22"},
}

var (
	ConsentOnboarding = consentGrant(
		"onboarding.schedule",
		"2026-12-31T00:00:00Z",
		&platformv1.WithdrawalState{},
	)
	ConsentOnboardingExpired = consentGrant(
		"onboarding.schedule",
		"2026-07-10T00:00:00Z",
		&platformv1.WithdrawalState{},
	)
	ConsentOnboardingWithdrawn = consentGrant(
		"onboarding.schedule",
		"2026-12-31T00:00:00Z",
		&platformv1.WithdrawalState{
			Withdrawn:   true,
			WithdrawnAt: mustTimestamp("2026-07-15T00:00:00Z"),
		},
	)
	ConsentResearch = consentGrant(
		"research.trial",
		"2026-12-31T00:00:00Z",
		&platformv1.WithdrawalState{},
	)
)

// WithEnvelope attaches an independent deep copy of ValidEnvelope to any
// generated foundation contract with an Envelope header field.
func WithEnvelope[T proto.Message](contract T) T {
	message := contract.ProtoReflect()
	headerField := message.Descriptor().Fields().ByName("header")
	if headerField == nil || headerField.Kind() != protoreflect.MessageKind {
		panic(fmt.Sprintf("fixture contract %s has no message header", message.Descriptor().FullName()))
	}
	header := proto.Clone(ValidEnvelope).(*platformv1.Envelope)
	message.Set(headerField, protoreflect.ValueOfMessage(header.ProtoReflect()))
	return contract
}

func consentGrant(purpose, expiry string, withdrawal *platformv1.WithdrawalState) *platformv1.ConsentGrant {
	return WithEnvelope(&platformv1.ConsentGrant{
		SubjectRef:        EligibleLearner.LearnerRef,
		GuardianAuthority: true,
		Purpose:           purpose,
		DataCategories:    []string{"synthetic.profile"},
		Processors:        []string{"gt100k.synthetic"},
		Jurisdiction:      "US-CA",
		EffectiveAt:       mustTimestamp("2026-07-01T00:00:00Z"),
		ExpiryAt:          mustTimestamp(expiry),
		CollectionMethod:  "synthetic_guardian_portal",
		DocumentHash:      "sha256:synthetic-placeholder",
		WithdrawalState:   withdrawal,
	})
}

func mustTimestamp(value string) *timestamppb.Timestamp {
	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		panic(fmt.Sprintf("invalid fixture timestamp %q: %v", value, err))
	}
	return timestamppb.New(parsed)
}
