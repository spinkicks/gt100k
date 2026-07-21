package deletion

import (
	"context"
	"fmt"

	"go.temporal.io/sdk/activity"
)

const (
	OperationErasePostgres       = "erase_postgres"
	OperationDeleteS3Objects     = "delete_s3_objects"
	OperationClearRedis          = "clear_redis"
	OperationCryptoShred         = "crypto_shred"
	OperationRecordDeletionAudit = "record_deletion_audit"

	ActivityErasePostgres       = "gt100k.deletion.ErasePostgres"
	ActivityDeleteS3Objects     = "gt100k.deletion.DeleteS3Objects"
	ActivityClearRedis          = "gt100k.deletion.ClearRedis"
	ActivityCryptoShred         = "gt100k.deletion.CryptoShred"
	ActivityRecordDeletionAudit = "gt100k.deletion.RecordDeletionAudit"
)

// ActivityInput is the replay-stable input to every deletion activity.
type ActivityInput struct {
	SubjectRef     string
	IdempotencyKey string
}

// ActivityResult exposes whether Temporal had to retry an activity.
type ActivityResult struct {
	Attempt int32
}

// Backend applies deletion operations idempotently by ActivityInput's key.
// The crypto_shred operation is the buildable KMS stub seam for this slice.
type Backend interface {
	Apply(context.Context, string, ActivityInput) error
}

// Activities contains the worker-side deletion activity implementations.
type Activities struct {
	Backend Backend
}

func (a *Activities) ErasePostgres(ctx context.Context, input ActivityInput) (ActivityResult, error) {
	return a.run(ctx, OperationErasePostgres, input)
}

func (a *Activities) DeleteS3Objects(ctx context.Context, input ActivityInput) (ActivityResult, error) {
	return a.run(ctx, OperationDeleteS3Objects, input)
}

func (a *Activities) ClearRedis(ctx context.Context, input ActivityInput) (ActivityResult, error) {
	return a.run(ctx, OperationClearRedis, input)
}

func (a *Activities) CryptoShred(ctx context.Context, input ActivityInput) (ActivityResult, error) {
	return a.run(ctx, OperationCryptoShred, input)
}

func (a *Activities) RecordDeletionAudit(ctx context.Context, input ActivityInput) (ActivityResult, error) {
	return a.run(ctx, OperationRecordDeletionAudit, input)
}

func (a *Activities) run(ctx context.Context, operation string, input ActivityInput) (ActivityResult, error) {
	result := ActivityResult{Attempt: activity.GetInfo(ctx).Attempt}
	if input.SubjectRef == "" {
		return result, fmt.Errorf("%s: empty subject ref", operation)
	}
	if input.IdempotencyKey == "" {
		return result, fmt.Errorf("%s: empty idempotency key", operation)
	}
	if a == nil || a.Backend == nil {
		return result, fmt.Errorf("%s: nil deletion backend", operation)
	}
	if err := a.Backend.Apply(ctx, operation, input); err != nil {
		return result, fmt.Errorf("%s: %w", operation, err)
	}
	return result, nil
}
