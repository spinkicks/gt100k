// Package spine defines the injected ports and orchestration primitives for
// the foundation event spine.
package spine

import (
	"context"
	"time"

	platform "github.com/gt100k/platform/pkg/platform"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
)

// IdentityResolver exchanges an opaque session reference for a pseudonymous
// actor. It is the command path's read-only slice of the identity repository.
type IdentityResolver interface {
	ResolveActor(context.Context, string) (*platformv1.ActorRef, error)
}

// ActiveConsentSource loads the grants that may authorize new processing.
type ActiveConsentSource interface {
	ActiveForSubject(context.Context, string, time.Time) ([]*platformv1.ConsentGrant, error)
}

// ConsentRepository persists append-only grants, loads active grants, and
// atomically transitions one grant to withdrawn. Withdraw returns changed=false
// for an already-withdrawn grant so deletion and audit side effects remain
// exactly once.
type ConsentRepository interface {
	ActiveConsentSource
	Put(context.Context, *platformv1.ConsentGrant) error
	Withdraw(context.Context, string, time.Time) (*platformv1.ConsentGrant, bool, error)
}

// AssentRepository persists append-only assent records and supports lookup by
// pseudonymous child reference.
type AssentRepository interface {
	Put(context.Context, *platformv1.AssentRecord) error
	ForChild(context.Context, string) ([]*platformv1.AssentRecord, error)
}

// IdentityRepository stores only pseudonymous actor mappings and reference-only
// enrollment handoffs. Legal identity never crosses this boundary.
type IdentityRepository interface {
	IdentityResolver
	Provision(context.Context, *platformv1.EligibleLearner) (*platformv1.ActorRef, error)
}

// DecisionRepository persists immutable decision records.
type DecisionRepository interface {
	Append(context.Context, *platformv1.DecisionRecord) error
	Get(context.Context, string) (*platformv1.DecisionRecord, error)
}

// OverrideRepository persists append-only overrides by target decision.
type OverrideRepository interface {
	Append(context.Context, *platformv1.OverrideRecord) error
	ForDecision(context.Context, string) ([]*platformv1.OverrideRecord, error)
}

// AppealRepository persists append-only appeals by target decision.
type AppealRepository interface {
	Append(context.Context, *platformv1.Appeal) error
	ForDecision(context.Context, string) ([]*platformv1.Appeal, error)
}

// AuditLog persists immutable audit entries in append order.
type AuditLog interface {
	Append(context.Context, *platformv1.AuditEntry) error
	All(context.Context) ([]*platformv1.AuditEntry, error)
}

// PolicyInput is the authorization request passed to the OPA-backed edge.
type PolicyInput struct {
	Actor        *platformv1.ActorRef
	Purpose      string
	SubjectRef   string
	Jurisdiction string
	At           time.Time
	Consents     []*platformv1.ConsentGrant
}

// PolicyDecision records the complete, replayable policy result.
type PolicyDecision struct {
	Allow         bool   `json:"allow"`
	Reason        string `json:"reason"`
	PolicyVersion string `json:"policy_version"`
}

// Authorizer evaluates one command using policy-as-code.
type Authorizer interface {
	Authorize(context.Context, PolicyInput) (PolicyDecision, error)
}

// CommandDeps contains every stateful boundary used by HandleCommand.
type CommandDeps struct {
	Identities IdentityResolver
	Consents   ActiveConsentSource
	Authorizer Authorizer
	Outbox     OutboxStore
	Audit      AuditLog
	Clock      platform.Clock
	IDs        platform.IDGenerator
}

// OutboxStore commits a unit of work atomically and exposes staged events to
// the at-least-once relay.
type OutboxStore interface {
	Commit(context.Context, *UnitOfWork) error
	Pending(context.Context) ([]*OutboxRow, error)
	MarkRelayed(context.Context, string) error
}

// EventBus publishes validated events to the at-least-once transport.
type EventBus interface {
	Publish(context.Context, *platformv1.LearnerEvent) error
}

// EventSource is the pull-based consumer half of the event transport.
type EventSource interface {
	Next(context.Context) (*platformv1.LearnerEvent, error)
}

// ConsumerOffsets records contract IDs already applied by a consumer.
type ConsumerOffsets interface {
	Seen(context.Context, string) (bool, error)
	Mark(context.Context, string) error
}

// Projection applies a validated event to consumer-owned state.
type Projection interface {
	Apply(context.Context, *platformv1.LearnerEvent) error
}

// EnrollmentHandoffSource yields reference-only synthetic enrollment handoffs.
type EnrollmentHandoffSource interface {
	Next(context.Context) (*platformv1.EligibleLearner, error)
}

// DeletionStarter starts the durable deletion workflow once per subject.
type DeletionStarter interface {
	Start(context.Context, string) error
}
