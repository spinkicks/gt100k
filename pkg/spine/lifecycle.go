package spine

import (
	"context"
	"fmt"
	"strings"

	platform "github.com/gt100k/platform/pkg/platform"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

// OverrideDeps contains the append-only boundaries used to record an override.
type OverrideDeps struct {
	Decisions DecisionRepository
	Overrides OverrideRepository
	Audit     AuditLog
	IDs       platform.IDGenerator
}

// AppealDeps contains the append-only boundaries used to file an appeal.
type AppealDeps struct {
	Decisions DecisionRepository
	Appeals   AppealRepository
	Audit     AuditLog
	IDs       platform.IDGenerator
}

// RecordOverride validates and appends a new override plus its audit fact. The
// target decision is loaded read-only and is never passed to a mutation port.
func RecordOverride(ctx context.Context, deps OverrideDeps, record *platformv1.OverrideRecord) error {
	if err := validateOverrideDeps(deps); err != nil {
		return err
	}
	if record == nil {
		return fmt.Errorf("record override: nil record")
	}
	candidate := proto.Clone(record).(*platformv1.OverrideRecord)
	if err := platform.ValidateOverrideRecord(candidate); err != nil {
		return fmt.Errorf("record override: invalid record: %w", err)
	}
	target, err := deps.Decisions.Get(ctx, candidate.GetTargetDecision())
	if err != nil {
		return fmt.Errorf("record override: load target decision: %w", err)
	}
	if candidate.GetPriorOutcome() != target.GetOutcome() {
		return fmt.Errorf("record override: %w", &platform.NamedFieldError{Field: "prior_outcome"})
	}
	entry, err := lifecycleAuditEntry(deps.IDs, candidate.GetHeader(), "override", candidate.GetNewOutcome())
	if err != nil {
		return fmt.Errorf("record override: build audit: %w", err)
	}
	if err := deps.Overrides.Append(ctx, candidate); err != nil {
		return fmt.Errorf("record override: append record: %w", err)
	}
	if err := deps.Audit.Append(ctx, entry); err != nil {
		return fmt.Errorf("record override: append audit: %w", err)
	}
	return nil
}

// FileAppeal validates and appends a new appeal plus its audit fact. Reviewer
// independence is checked against the stored target decision owner.
func FileAppeal(ctx context.Context, deps AppealDeps, appeal *platformv1.Appeal) error {
	if err := validateAppealDeps(deps); err != nil {
		return err
	}
	if appeal == nil {
		return fmt.Errorf("file appeal: nil appeal")
	}
	candidate := proto.Clone(appeal).(*platformv1.Appeal)
	if err := platform.ValidateAppeal(candidate, ""); err != nil {
		return fmt.Errorf("file appeal: invalid appeal: %w", err)
	}
	target, err := deps.Decisions.Get(ctx, candidate.GetTargetDecision())
	if err != nil {
		return fmt.Errorf("file appeal: load target decision: %w", err)
	}
	if err := platform.ValidateAppeal(candidate, target.GetAuthorizedHuman().GetRef()); err != nil {
		return fmt.Errorf("file appeal: invalid appeal: %w", err)
	}
	entry, err := lifecycleAuditEntry(
		deps.IDs,
		candidate.GetHeader(),
		"appeal_filed",
		strings.ToLower(candidate.GetStatus().String()),
	)
	if err != nil {
		return fmt.Errorf("file appeal: build audit: %w", err)
	}
	if err := deps.Appeals.Append(ctx, candidate); err != nil {
		return fmt.Errorf("file appeal: append record: %w", err)
	}
	if err := deps.Audit.Append(ctx, entry); err != nil {
		return fmt.Errorf("file appeal: append audit: %w", err)
	}
	return nil
}

func lifecycleAuditEntry(ids platform.IDGenerator, header *platformv1.Envelope, action, outcome string) (*platformv1.AuditEntry, error) {
	entryID := ids.Next()
	if entryID == "" {
		return nil, fmt.Errorf("empty audit entry id")
	}
	return NewAuditEntry(AuditEntryInput{
		EntryID: entryID,
		Header:  header,
		Actor:   header.GetActorRef(),
		Action:  action,
		Policy: PolicyDecision{
			Allow:         true,
			PolicyVersion: header.GetPolicyVersion(),
		},
		Outcome: outcome,
	})
}

func validateOverrideDeps(deps OverrideDeps) error {
	switch {
	case deps.Decisions == nil:
		return fmt.Errorf("record override: nil decision repository")
	case deps.Overrides == nil:
		return fmt.Errorf("record override: nil override repository")
	case deps.Audit == nil:
		return fmt.Errorf("record override: nil audit log")
	case deps.IDs == nil:
		return fmt.Errorf("record override: nil id generator")
	default:
		return nil
	}
}

func validateAppealDeps(deps AppealDeps) error {
	switch {
	case deps.Decisions == nil:
		return fmt.Errorf("file appeal: nil decision repository")
	case deps.Appeals == nil:
		return fmt.Errorf("file appeal: nil appeal repository")
	case deps.Audit == nil:
		return fmt.Errorf("file appeal: nil audit log")
	case deps.IDs == nil:
		return fmt.Errorf("file appeal: nil id generator")
	default:
		return nil
	}
}
