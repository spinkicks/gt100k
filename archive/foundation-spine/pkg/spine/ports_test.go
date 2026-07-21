package spine_test

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/gt100k/platform/pkg/spine"
	"github.com/gt100k/platform/pkg/spine/memory"
	"github.com/gt100k/platform/pkg/spine/pg"
	"github.com/gt100k/platform/pkg/spine/redpanda"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
)

type consentRepositoryContract interface {
	Put(context.Context, *platformv1.ConsentGrant) error
	ActiveForSubject(context.Context, string, time.Time) ([]*platformv1.ConsentGrant, error)
	Withdraw(context.Context, string, time.Time) (*platformv1.ConsentGrant, bool, error)
}

type assentRepositoryContract interface {
	Put(context.Context, *platformv1.AssentRecord) error
	ForChild(context.Context, string) ([]*platformv1.AssentRecord, error)
}

type identityRepositoryContract interface {
	ResolveActor(context.Context, string) (*platformv1.ActorRef, error)
	Provision(context.Context, *platformv1.EligibleLearner) (*platformv1.ActorRef, error)
}

type decisionRepositoryContract interface {
	Append(context.Context, *platformv1.DecisionRecord) error
	Get(context.Context, string) (*platformv1.DecisionRecord, error)
}

type overrideRepositoryContract interface {
	Append(context.Context, *platformv1.OverrideRecord) error
	ForDecision(context.Context, string) ([]*platformv1.OverrideRecord, error)
}

type appealRepositoryContract interface {
	Append(context.Context, *platformv1.Appeal) error
	ForDecision(context.Context, string) ([]*platformv1.Appeal, error)
}

type auditLogContract interface {
	Append(context.Context, *platformv1.AuditEntry) error
	All(context.Context) ([]*platformv1.AuditEntry, error)
}

type eventBusContract interface {
	Publish(context.Context, *platformv1.LearnerEvent) error
}

type eventSourceContract interface {
	Next(context.Context) (*platformv1.LearnerEvent, error)
}

type enrollmentHandoffSourceContract interface {
	Next(context.Context) (*platformv1.EligibleLearner, error)
}

type deletionStarterContract interface {
	Start(context.Context, string) error
}

var (
	_ consentRepositoryContract       = (spine.ConsentRepository)(nil)
	_ assentRepositoryContract        = (spine.AssentRepository)(nil)
	_ identityRepositoryContract      = (spine.IdentityRepository)(nil)
	_ decisionRepositoryContract      = (spine.DecisionRepository)(nil)
	_ overrideRepositoryContract      = (spine.OverrideRepository)(nil)
	_ appealRepositoryContract        = (spine.AppealRepository)(nil)
	_ auditLogContract                = (spine.AuditLog)(nil)
	_ eventBusContract                = (spine.EventBus)(nil)
	_ eventSourceContract             = (spine.EventSource)(nil)
	_ enrollmentHandoffSourceContract = (spine.EnrollmentHandoffSource)(nil)
	_ deletionStarterContract         = (spine.DeletionStarter)(nil)
	_ spine.OutboxStore               = (*memory.Store)(nil)
	_ spine.AuditLog                  = (*memory.Store)(nil)
	_ spine.DecisionRepository        = (*memory.DecisionRepository)(nil)
	_ spine.EventBus                  = (*memory.EventBus)(nil)
	_ spine.EventSource               = (*memory.EventBus)(nil)
	_ spine.ConsumerOffsets           = (*memory.ConsumerOffsets)(nil)
	_ spine.Projection                = (*memory.Projection)(nil)
	_ spine.OutboxStore               = (*pg.Store)(nil)
	_ spine.AuditLog                  = (*pg.Store)(nil)
	_ spine.DecisionRepository        = (*pg.DecisionStore)(nil)
	_ spine.EventBus                  = (*redpanda.Producer)(nil)
	_ spine.EventSource               = (*redpanda.Consumer)(nil)
)

func TestPolicyDecisionDecodesOPAResult(t *testing.T) {
	var got spine.PolicyDecision
	if err := json.Unmarshal([]byte(`{"allow":true,"reason":"allow","policy_version":"policy/1"}`), &got); err != nil {
		t.Fatalf("json.Unmarshal() error = %v", err)
	}
	want := spine.PolicyDecision{Allow: true, Reason: "allow", PolicyVersion: "policy/1"}
	if got != want {
		t.Fatalf("PolicyDecision = %+v, want %+v", got, want)
	}
}
