package platform_test

import (
	"bytes"
	"context"
	"testing"
	"time"

	"github.com/gt100k/platform/pkg/platform/fixtures"
	"github.com/gt100k/platform/pkg/spine"
	"github.com/gt100k/platform/pkg/spine/memory"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestInjectedClockAndIDGeneratorProduceIdenticalReplayRecords(t *testing.T) {
	t.Parallel()

	first := runReplayCommand(t)
	second := runReplayCommand(t)

	if !bytes.Equal(first.decision, second.decision) {
		t.Fatal("replayed decisions are not byte-identical")
	}
	if !bytes.Equal(first.event, second.event) {
		t.Fatal("replayed events are not byte-identical")
	}
	if !bytes.Equal(first.audit, second.audit) {
		t.Fatal("replayed audit entries are not byte-identical")
	}
	if first.idempotencyKey != second.idempotencyKey {
		t.Fatalf("replayed idempotency keys = %q and %q", first.idempotencyKey, second.idempotencyKey)
	}
	if !first.stagedAt.Equal(second.stagedAt) {
		t.Fatalf("replayed staged times = %s and %s", first.stagedAt, second.stagedAt)
	}
}

type replayRecords struct {
	decision       []byte
	event          []byte
	audit          []byte
	idempotencyKey string
	stagedAt       time.Time
}

func runReplayCommand(t *testing.T) replayRecords {
	t.Helper()

	store := memory.NewStore()
	deps := spine.CommandDeps{
		Identities: memory.NewIdentityRepository(map[string]*platformv1.ActorRef{
			"session_synth_replay": fixtures.StaffGuide,
		}),
		Consents:   memory.NewConsentRepository([]*platformv1.ConsentGrant{fixtures.ConsentOnboarding}),
		Authorizer: replayAuthorizer{},
		Outbox:     store,
		Audit:      store,
		Clock:      replayClock{at: replayTime()},
		IDs:        &replayIDs{next: "audit_replay_0001"},
	}
	result, err := spine.HandleCommand(context.Background(), deps, replayCommand(t))
	if err != nil {
		t.Fatalf("HandleCommand() error = %v", err)
	}

	pending, err := store.Pending(context.Background())
	if err != nil {
		t.Fatalf("store.Pending() error = %v", err)
	}
	if len(pending) != 1 {
		t.Fatalf("len(store.Pending()) = %d, want 1", len(pending))
	}
	audit, err := store.All(context.Background())
	if err != nil {
		t.Fatalf("store.All() error = %v", err)
	}
	if len(audit) != 1 {
		t.Fatalf("len(store.All()) = %d, want 1", len(audit))
	}

	return replayRecords{
		decision:       deterministicBytes(t, result.Decision),
		event:          deterministicBytes(t, pending[0].Event),
		audit:          deterministicBytes(t, audit[0]),
		idempotencyKey: pending[0].IdempotencyKey,
		stagedAt:       pending[0].StagedAt,
	}
}

func replayCommand(t *testing.T) spine.Command {
	t.Helper()
	at := replayTime()
	decisionHeader := replayEnvelope("cid_replay_decision", "decision_record/1", at)
	eventHeader := replayEnvelope("cid_replay_event", "learner_event/1", at)
	eventHeader.CausationId = decisionHeader.GetContractId()

	return spine.Command{
		SessionRef:   "session_synth_replay",
		Purpose:      "onboarding.schedule",
		SubjectRef:   fixtures.EligibleLearner.GetLearnerRef(),
		Jurisdiction: "US-CA",
		Decision: &platformv1.DecisionRecord{
			Header:           decisionHeader,
			DecisionType:     "synthetic.pathway_recommendation",
			SubjectRef:       fixtures.EligibleLearner.GetLearnerRef(),
			Candidates:       []string{"pathway_synth_a", "pathway_synth_b"},
			Outcome:          "pathway_synth_a",
			ReasonCodes:      []string{"synthetic_evidence_supported"},
			EvidenceSnapshot: []string{"evidence://fixture/synth_replay#sha256:dd44"},
			Uncertainty:      0.1,
			PolicyVersion:    fixtures.PolicyVersion,
			ModelVersion:     "model/synthetic-v1",
			AuthorizedHuman:  proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
			EffectiveAt:      timestamppb.New(at),
			Consequential:    true,
		},
		Event: &platformv1.LearnerEvent{
			Header:        eventHeader,
			EventType:     "synthetic.projection_update",
			LearnerRef:    fixtures.EligibleLearner.GetLearnerRef(),
			Source:        "synthetic_replay_test",
			PayloadSchema: "synthetic.projection_update/1",
		},
	}
}

func replayEnvelope(contractID, schemaVersion string, at time.Time) *platformv1.Envelope {
	header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
	header.ContractId = contractID
	header.SchemaVersion = schemaVersion
	header.OccurredAt = timestamppb.New(at)
	header.RecordedAt = timestamppb.New(at.Add(time.Millisecond))
	header.CorrelationId = "corr_replay_0001"
	header.CausationId = "cid_replay_0000"
	return header
}

func deterministicBytes(t *testing.T, message proto.Message) []byte {
	t.Helper()
	encoded, err := (proto.MarshalOptions{Deterministic: true}).Marshal(message)
	if err != nil {
		t.Fatalf("deterministic proto marshal error = %v", err)
	}
	return encoded
}

func replayTime() time.Time {
	return time.Date(2026, 7, 20, 14, 5, 0, 0, time.UTC)
}

type replayClock struct{ at time.Time }

func (c replayClock) Now() time.Time { return c.at }

type replayIDs struct{ next string }

func (g *replayIDs) Next() string {
	next := g.next
	g.next = ""
	return next
}

type replayAuthorizer struct{}

func (replayAuthorizer) Authorize(context.Context, spine.PolicyInput) (spine.PolicyDecision, error) {
	return spine.PolicyDecision{Allow: true, Reason: "allow", PolicyVersion: fixtures.PolicyVersion}, nil
}
