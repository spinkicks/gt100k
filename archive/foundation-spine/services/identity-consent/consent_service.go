package identityconsent

import (
	"context"
	"fmt"
	"time"

	"github.com/gt100k/platform/pkg/platform"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// ConsentDeps contains the stateful boundaries used by WithdrawConsent.
type ConsentDeps struct {
	Consents ConsentRepository
	Audit    AuditLog
	Deletion DeletionStarter
	IDs      platform.IDGenerator
}

// GrantConsent validates and appends a consent grant.
func GrantConsent(ctx context.Context, repo ConsentRepository, grant *platformv1.ConsentGrant) error {
	if repo == nil {
		return fmt.Errorf("grant consent: nil consent repository")
	}
	if err := platform.ValidateConsentGrant(grant); err != nil {
		return err
	}
	if err := repo.Put(ctx, grant); err != nil {
		return fmt.Errorf("grant consent: %w", err)
	}
	return nil
}

// WithdrawConsent transitions one grant to withdrawn, starts subject deletion,
// and records the withdrawal. Repeating an already completed transition is a
// no-op, so deletion and audit are each emitted once.
func WithdrawConsent(ctx context.Context, deps ConsentDeps, contractID string, at time.Time) error {
	if contractID == "" {
		return fmt.Errorf("withdraw consent: empty contract id")
	}
	withdrawnAt := timestamppb.New(at)
	if err := withdrawnAt.CheckValid(); err != nil {
		return fmt.Errorf("withdraw consent: invalid withdrawal time: %w", err)
	}
	if deps.Consents == nil {
		return fmt.Errorf("withdraw consent: nil consent repository")
	}
	if deps.Deletion == nil {
		return fmt.Errorf("withdraw consent: nil deletion starter")
	}
	if deps.Audit == nil {
		return fmt.Errorf("withdraw consent: nil audit log")
	}
	if deps.IDs == nil {
		return fmt.Errorf("withdraw consent: nil id generator")
	}

	grant, changed, err := deps.Consents.Withdraw(ctx, contractID, at)
	if err != nil {
		return fmt.Errorf("withdraw consent: %w", err)
	}
	if grant == nil {
		return fmt.Errorf("withdraw consent: repository returned nil grant")
	}
	if !changed {
		return nil
	}
	if err := validateWithdrawal(grant, contractID, withdrawnAt); err != nil {
		return err
	}

	if err := deps.Deletion.Start(ctx, grant.GetSubjectRef()); err != nil {
		return fmt.Errorf("withdraw consent: start deletion: %w", err)
	}
	entry := &platformv1.AuditEntry{
		EntryId:       deps.IDs.Next(),
		Header:        proto.Clone(grant.GetHeader()).(*platformv1.Envelope),
		ActorRef:      proto.Clone(grant.GetHeader().GetActorRef()).(*platformv1.ActorRef),
		Action:        "consent_withdrawn",
		PolicyVersion: grant.GetHeader().GetPolicyVersion(),
		Outcome:       "withdrawn",
	}
	if entry.GetEntryId() == "" {
		return fmt.Errorf("withdraw consent: empty audit entry id")
	}
	if err := deps.Audit.Append(ctx, entry); err != nil {
		return fmt.Errorf("withdraw consent: append audit: %w", err)
	}
	return nil
}

func validateWithdrawal(
	grant *platformv1.ConsentGrant,
	contractID string,
	wantAt *timestamppb.Timestamp,
) error {
	if err := platform.ValidateConsentGrant(grant); err != nil {
		return fmt.Errorf("withdraw consent: invalid stored grant: %w", err)
	}
	if grant.GetHeader().GetContractId() != contractID {
		return fmt.Errorf("withdraw consent: repository returned contract %q for %q", grant.GetHeader().GetContractId(), contractID)
	}
	state := grant.GetWithdrawalState()
	if !state.GetWithdrawn() || !proto.Equal(state.GetWithdrawnAt(), wantAt) {
		return fmt.Errorf("withdraw consent: repository did not persist requested withdrawal")
	}
	return nil
}
