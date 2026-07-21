package spine_test

import (
	"context"
	"errors"
	"testing"
	"time"

	platform "github.com/gt100k/platform/pkg/platform"
	"github.com/gt100k/platform/pkg/platform/fixtures"
	"github.com/gt100k/platform/pkg/spine"
	"github.com/gt100k/platform/pkg/spine/memory"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestRecordOverridePersistsRecordAndAuditWithoutMutatingTarget(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	decisions, target := lifecycleTarget(t, "override")
	targetBefore := proto.Clone(target).(*platformv1.DecisionRecord)
	overrides := memory.NewOverrideRepository()
	audit := memory.NewStore()
	record := lifecycleOverride(target)
	wantRecord := proto.Clone(record).(*platformv1.OverrideRecord)

	err := spine.RecordOverride(ctx, spine.OverrideDeps{
		Decisions: decisions,
		Overrides: overrides,
		Audit:     audit,
		IDs:       &sequenceIDs{ids: []string{"audit_override"}},
	}, record)
	if err != nil {
		t.Fatalf("RecordOverride() error = %v, want nil", err)
	}
	record.NewOutcome = "caller_mutation"

	stored := overridesForDecision(t, ctx, overrides, target.GetHeader().GetContractId())
	if got, want := len(stored), 1; got != want {
		t.Fatalf("len(ForDecision()) = %d, want %d", got, want)
	}
	if !proto.Equal(stored[0], wantRecord) {
		t.Fatalf("stored override = %v, want %v", stored[0], wantRecord)
	}
	stored[0].Rationale = "replay_mutation"
	if replayed := overridesForDecision(t, ctx, overrides, target.GetHeader().GetContractId()); !proto.Equal(replayed[0], wantRecord) {
		t.Fatalf("replayed override = %v, want independent %v", replayed[0], wantRecord)
	}
	assertTargetUnchanged(t, ctx, decisions, targetBefore)
	entry := singleAudit(t, ctx, audit)
	assertLifecycleAudit(t, entry, "audit_override", "override", "route_B", wantRecord.GetHeader())
}

func TestFileAppealPersistsRecordAndAuditWithoutMutatingTarget(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	decisions, target := lifecycleTarget(t, "appeal")
	targetBefore := proto.Clone(target).(*platformv1.DecisionRecord)
	appeals := memory.NewAppealRepository()
	audit := memory.NewStore()
	record := lifecycleAppeal(target)
	wantRecord := proto.Clone(record).(*platformv1.Appeal)

	err := spine.FileAppeal(ctx, spine.AppealDeps{
		Decisions: decisions,
		Appeals:   appeals,
		Audit:     audit,
		IDs:       &sequenceIDs{ids: []string{"audit_appeal"}},
	}, record)
	if err != nil {
		t.Fatalf("FileAppeal() error = %v, want nil", err)
	}
	record.Grounds = "caller_mutation"

	stored := appealsForDecision(t, ctx, appeals, target.GetHeader().GetContractId())
	if got, want := len(stored), 1; got != want {
		t.Fatalf("len(ForDecision()) = %d, want %d", got, want)
	}
	if !proto.Equal(stored[0], wantRecord) {
		t.Fatalf("stored appeal = %v, want %v", stored[0], wantRecord)
	}
	stored[0].Grounds = "replay_mutation"
	if replayed := appealsForDecision(t, ctx, appeals, target.GetHeader().GetContractId()); !proto.Equal(replayed[0], wantRecord) {
		t.Fatalf("replayed appeal = %v, want independent %v", replayed[0], wantRecord)
	}
	assertTargetUnchanged(t, ctx, decisions, targetBefore)
	entry := singleAudit(t, ctx, audit)
	assertLifecycleAudit(t, entry, "audit_appeal", "appeal_filed", "filed", wantRecord.GetHeader())
}

func TestLifecycleRecordingRejectsInvalidAndDuplicateRecords(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	t.Run("invalid override has no side effects", func(t *testing.T) {
		decisions, target := lifecycleTarget(t, "invalid_override")
		repo, audit := memory.NewOverrideRepository(), memory.NewStore()
		record := lifecycleOverride(target)
		record.Rationale = ""
		err := spine.RecordOverride(ctx, spine.OverrideDeps{decisions, repo, audit, &sequenceIDs{ids: []string{"unused"}}}, record)
		var fieldErr *platform.NamedFieldError
		if !errors.As(err, &fieldErr) || fieldErr.Field != "rationale" {
			t.Fatalf("RecordOverride(invalid) error = %T %v, want rationale NamedFieldError", err, err)
		}
		assertNoLifecycleWrites(t, ctx, repo, nil, audit, target.GetHeader().GetContractId())
	})

	t.Run("invalid appeal has no side effects", func(t *testing.T) {
		decisions, target := lifecycleTarget(t, "invalid_appeal")
		repo, audit := memory.NewAppealRepository(), memory.NewStore()
		record := lifecycleAppeal(target)
		record.IndependentReviewer = proto.Clone(target.GetAuthorizedHuman()).(*platformv1.ActorRef)
		err := spine.FileAppeal(ctx, spine.AppealDeps{decisions, repo, audit, &sequenceIDs{ids: []string{"unused"}}}, record)
		var conflict *platform.ReviewerConflictError
		if !errors.As(err, &conflict) {
			t.Fatalf("FileAppeal(invalid) error = %T %v, want ReviewerConflictError", err, err)
		}
		assertNoLifecycleWrites(t, ctx, nil, repo, audit, target.GetHeader().GetContractId())
	})

	t.Run("duplicate contract ids remain append only", func(t *testing.T) {
		decisions, target := lifecycleTarget(t, "duplicate")
		repo, audit := memory.NewOverrideRepository(), memory.NewStore()
		deps := spine.OverrideDeps{decisions, repo, audit, &sequenceIDs{ids: []string{"audit_first", "audit_second"}}}
		record := lifecycleOverride(target)
		if err := spine.RecordOverride(ctx, deps, record); err != nil {
			t.Fatalf("RecordOverride(first) error = %v", err)
		}
		var appendOnly *platform.AppendOnlyError
		if err := spine.RecordOverride(ctx, deps, record); !errors.As(err, &appendOnly) {
			t.Fatalf("RecordOverride(duplicate) error = %T %v, want AppendOnlyError", err, err)
		}
		if got := len(overridesForDecision(t, ctx, repo, target.GetHeader().GetContractId())); got != 1 {
			t.Fatalf("override count after duplicate = %d, want 1", got)
		}
		if got, err := audit.All(ctx); err != nil || len(got) != 1 {
			t.Fatalf("audit after duplicate = %v, %v; want one entry", got, err)
		}
	})
}

func lifecycleTarget(t *testing.T, suffix string) (*memory.DecisionRepository, *platformv1.DecisionRecord) {
	t.Helper()
	target := decisionRecord("lifecycle_"+suffix, "2026-07-20T14:05:00Z")
	target.Outcome = "route_A"
	repo := memory.NewDecisionRepository()
	if err := repo.Append(context.Background(), target); err != nil {
		t.Fatalf("append target decision: %v", err)
	}
	return repo, target
}

func lifecycleOverride(target *platformv1.DecisionRecord) *platformv1.OverrideRecord {
	header := lifecycleHeader("override", target.GetHeader().GetContractId())
	return &platformv1.OverrideRecord{
		Header: header, TargetDecision: target.GetHeader().GetContractId(), OverrideClass: "admissions",
		PriorOutcome: "route_A", NewOutcome: "route_B", AuthorizedRole: "admissions_lead",
		Rationale: "corrected eligibility band", EvidenceRefs: []string{"evidence://override/synth_001#sha256:bb22"},
		Approvers: []*platformv1.ActorRef{proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef), proto.Clone(fixtures.StaffGuide2).(*platformv1.ActorRef)},
		ReviewAt:  timestamppb.New(time.Date(2026, time.August, 20, 0, 0, 0, 0, time.UTC)),
	}
}

func lifecycleAppeal(target *platformv1.DecisionRecord) *platformv1.Appeal {
	header := lifecycleHeader("appeal", target.GetHeader().GetContractId())
	return &platformv1.Appeal{
		Header: header, AppellantRole: "guardian", TargetDecision: target.GetHeader().GetContractId(),
		Grounds: "new evidence", SubmittedEvidenceRefs: []string{"evidence://appeal/synth_001#sha256:cc33"},
		RequestedRemedy: "re-review", Status: platformv1.AppealStatus_FILED,
		IndependentReviewer: proto.Clone(fixtures.StaffGuide2).(*platformv1.ActorRef),
		Deadlines:           &platformv1.Deadlines{RespondBy: timestamppb.New(time.Date(2026, time.August, 1, 0, 0, 0, 0, time.UTC))},
	}
}

func lifecycleHeader(kind, target string) *platformv1.Envelope {
	header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
	header.ContractId = "cid_" + kind + "_audit"
	header.SchemaVersion = kind + "/1"
	header.CausationId = target
	return header
}

func overridesForDecision(t *testing.T, ctx context.Context, repo *memory.OverrideRepository, target string) []*platformv1.OverrideRecord {
	t.Helper()
	got, err := repo.ForDecision(ctx, target)
	if err != nil {
		t.Fatalf("OverrideRepository.ForDecision() error = %v", err)
	}
	return got
}

func appealsForDecision(t *testing.T, ctx context.Context, repo *memory.AppealRepository, target string) []*platformv1.Appeal {
	t.Helper()
	got, err := repo.ForDecision(ctx, target)
	if err != nil {
		t.Fatalf("AppealRepository.ForDecision() error = %v", err)
	}
	return got
}

func assertTargetUnchanged(t *testing.T, ctx context.Context, repo *memory.DecisionRepository, want *platformv1.DecisionRecord) {
	t.Helper()
	got, err := repo.Get(ctx, want.GetHeader().GetContractId())
	if err != nil || !proto.Equal(got, want) {
		t.Fatalf("target after lifecycle action = %v, %v; want unchanged %v", got, err, want)
	}
}

func singleAudit(t *testing.T, ctx context.Context, audit *memory.Store) *platformv1.AuditEntry {
	t.Helper()
	entries, err := audit.All(ctx)
	if err != nil || len(entries) != 1 {
		t.Fatalf("AuditLog.All() = %v, %v; want one entry", entries, err)
	}
	return entries[0]
}

func assertLifecycleAudit(t *testing.T, got *platformv1.AuditEntry, id, action, outcome string, header *platformv1.Envelope) {
	t.Helper()
	assertAudit(t, got, auditWant{entryID: id, action: action, policyAllow: true, outcome: outcome})
	if !proto.Equal(got.GetHeader(), header) {
		t.Fatalf("audit header = %v, want lifecycle header %v", got.GetHeader(), header)
	}
}

func assertNoLifecycleWrites(t *testing.T, ctx context.Context, overrides *memory.OverrideRepository, appeals *memory.AppealRepository, audit *memory.Store, target string) {
	t.Helper()
	if overrides != nil && len(overridesForDecision(t, ctx, overrides, target)) != 0 {
		t.Fatal("invalid override was persisted")
	}
	if appeals != nil && len(appealsForDecision(t, ctx, appeals, target)) != 0 {
		t.Fatal("invalid appeal was persisted")
	}
	if entries, err := audit.All(ctx); err != nil || len(entries) != 0 {
		t.Fatalf("audit after invalid input = %v, %v; want empty", entries, err)
	}
}
