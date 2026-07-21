package deletion

import (
	"fmt"
	"time"

	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

const StatusCompleted = "Completed"

// WorkflowInput identifies the pseudonymous subject to delete.
type WorkflowInput struct {
	SubjectRef string
}

// WorkflowResult is the replayable terminal deletion state.
type WorkflowResult struct {
	Status      string
	SubjectRef  string
	Compensated bool
}

// DeletionWorkflow removes one pseudonymous subject from every store and then
// preserves the append-only deletion audit fact. It uses only Temporal's
// deterministic workflow APIs.
func DeletionWorkflow(ctx workflow.Context, input WorkflowInput) (WorkflowResult, error) {
	result := WorkflowResult{SubjectRef: input.SubjectRef}
	if input.SubjectRef == "" {
		return result, fmt.Errorf("deletion workflow: empty subject ref")
	}
	subjectRef := input.SubjectRef
	workflowID := workflow.GetInfo(ctx).WorkflowExecution.ID

	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute,
		RetryPolicy: &temporal.RetryPolicy{
			InitialInterval:    time.Second,
			BackoffCoefficient: 2,
			MaximumInterval:    5 * time.Second,
			MaximumAttempts:    3,
		},
	})

	steps := []struct {
		activity  string
		operation string
	}{
		{activity: ActivityErasePostgres, operation: OperationErasePostgres},
		{activity: ActivityDeleteS3Objects, operation: OperationDeleteS3Objects},
		{activity: ActivityClearRedis, operation: OperationClearRedis},
		{activity: ActivityCryptoShred, operation: OperationCryptoShred},
		{activity: ActivityRecordDeletionAudit, operation: OperationRecordDeletionAudit},
	}
	for _, step := range steps {
		activityInput := ActivityInput{
			SubjectRef:     subjectRef,
			IdempotencyKey: workflowID + ":" + step.operation,
		}
		var activityResult ActivityResult
		if err := workflow.ExecuteActivity(ctx, step.activity, activityInput).Get(ctx, &activityResult); err != nil {
			return result, fmt.Errorf("deletion workflow: %s: %w", step.operation, err)
		}
		if activityResult.Attempt > 1 {
			result.Compensated = true
		}
	}

	result.Status = StatusCompleted
	return result, nil
}
