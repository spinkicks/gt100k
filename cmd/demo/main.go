package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/gt100k/platform/pkg/platform/fixtures"
	"github.com/gt100k/platform/pkg/spine"
	"github.com/gt100k/platform/pkg/spine/memory"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	identityconsent "github.com/gt100k/platform/services/identity-consent"
	"github.com/gt100k/platform/workflows/deletion"
	"google.golang.org/protobuf/proto"
)

const demoSession = "session_synth_001"

func main() {
	if err := run(context.Background(), os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, "foundation demo:", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, output io.Writer) error {
	if output == nil {
		return fmt.Errorf("nil output")
	}
	stages := []string{"synthetic-only foundation spine demo"}

	identities := newDemoIdentityRepository()
	actor, err := identityconsent.ProvisionLearner(ctx, identities, identityconsent.NewEnrollmentStub())
	if err != nil {
		return fmt.Errorf("provision: %w", err)
	}
	stages = append(stages, fmt.Sprintf("provision: %s -> %s", fixtures.EligibleLearner.GetLearnerRef(), actor.GetRef()))

	consents := newDemoConsentRepository()
	grant := proto.Clone(fixtures.ConsentOnboarding).(*platformv1.ConsentGrant)
	if err := identityconsent.GrantConsent(ctx, consents, grant); err != nil {
		return fmt.Errorf("consent: grant: %w", err)
	}
	assents := newDemoAssentRepository()
	if err := identityconsent.RecordAssent(ctx, assents, demoAssent()); err != nil {
		return fmt.Errorf("consent: record assent: %w", err)
	}
	stages = append(stages, "consent: guardian grant and child assent recorded")

	store := memory.NewStore()
	result, err := spine.HandleCommand(ctx, spine.CommandDeps{
		Identities: identities,
		Consents:   consents,
		Authorizer: opaAuthorizer{},
		Outbox:     store,
		Audit:      store,
		Clock:      fixedClock{at: demoTime()},
		IDs:        newSequenceIDs(),
	}, demoCommand())
	if err != nil {
		return fmt.Errorf("command: %w", err)
	}
	if result.Denied || result.Decision == nil {
		return fmt.Errorf("command: embedded OPA unexpectedly denied")
	}
	stages = append(stages,
		"authorize: embedded OPA allowed onboarding.schedule",
		"command: consequential human decision and traceable event committed",
	)

	bus := memory.NewEventBus()
	if published, err := spine.Relay(ctx, store, bus); err != nil || published != 1 {
		return fmt.Errorf("delivery: relay published %d: %w", published, err)
	}
	event, err := bus.Next(ctx)
	if err != nil {
		return fmt.Errorf("delivery: consume: %w", err)
	}
	offsets, projection := memory.NewConsumerOffsets(), memory.NewProjection()
	first, err := spine.Deliver(ctx, offsets, projection, event)
	if err != nil {
		return fmt.Errorf("delivery: first attempt: %w", err)
	}
	second, err := spine.Deliver(ctx, offsets, projection, event)
	if err != nil || !first || second || projection.Count() != 1 {
		return fmt.Errorf("delivery: idempotency proof first=%t second=%t count=%d: %w", first, second, projection.Count(), err)
	}
	stages = append(stages, "delivery: outbox relayed and event projected exactly once")

	decisions := memory.NewDecisionRepository()
	if err := decisions.Append(ctx, result.Decision); err != nil {
		return fmt.Errorf("lifecycle: retain target decision: %w", err)
	}
	targetBefore := proto.Clone(result.Decision).(*platformv1.DecisionRecord)
	if err := spine.RecordOverride(ctx, spine.OverrideDeps{
		Decisions: decisions,
		Overrides: memory.NewOverrideRepository(),
		Audit:     store,
		IDs:       newSequenceIDsFrom(2),
	}, demoOverride(result.Decision)); err != nil {
		return fmt.Errorf("override: %w", err)
	}
	if err := assertTargetPreserved(ctx, decisions, targetBefore); err != nil {
		return fmt.Errorf("override: %w", err)
	}
	stages = append(stages, "override: two distinct human approvers preserved the target")

	if err := spine.FileAppeal(ctx, spine.AppealDeps{
		Decisions: decisions,
		Appeals:   memory.NewAppealRepository(),
		Audit:     store,
		IDs:       newSequenceIDsFrom(3),
	}, demoAppeal(result.Decision)); err != nil {
		return fmt.Errorf("appeal: %w", err)
	}
	if err := assertTargetPreserved(ctx, decisions, targetBefore); err != nil {
		return fmt.Errorf("appeal: %w", err)
	}
	stages = append(stages, "appeal: independent reviewer preserved the target")

	deletions := newDemoDeletionStarter()
	if err := identityconsent.WithdrawConsent(ctx, identityconsent.ConsentDeps{
		Consents: consents,
		Audit:    store,
		Deletion: deletions,
		IDs:      newSequenceIDsFrom(4),
	}, grant.GetHeader().GetContractId(), demoTime().Add(time.Hour)); err != nil {
		return fmt.Errorf("deletion: withdraw: %w", err)
	}
	if deletions.result.Status != deletion.StatusCompleted {
		return fmt.Errorf("deletion: workflow status %q", deletions.result.Status)
	}
	stages = append(stages,
		"deletion: consent withdrawn, Temporal workflow Completed, audit preserved",
		"complete: all state stayed in memory; no cloud resources created",
	)
	_, err = fmt.Fprintln(output, strings.Join(stages, "\n"))
	return err
}
