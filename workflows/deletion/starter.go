package deletion

import (
	"context"
	"fmt"

	enumspb "go.temporal.io/api/enums/v1"
	"go.temporal.io/sdk/client"
)

const workflowIDPrefix = "gt100k-deletion/"

// WorkflowClient is the Temporal client surface needed to start deletion.
type WorkflowClient interface {
	ExecuteWorkflow(
		context.Context,
		client.StartWorkflowOptions,
		interface{},
		...interface{},
	) (client.WorkflowRun, error)
}

// TemporalStarter starts one durable deletion workflow per pseudonymous
// subject. Temporal's workflow-id policies provide the idempotency boundary.
type TemporalStarter struct {
	client    WorkflowClient
	taskQueue string
}

// NewTemporalStarter adapts a Temporal client to spine.DeletionStarter.
func NewTemporalStarter(workflowClient WorkflowClient, taskQueue string) *TemporalStarter {
	return &TemporalStarter{client: workflowClient, taskQueue: taskQueue}
}

// Start requests the subject's deletion workflow without waiting for it to
// finish. An existing running or completed workflow is reused.
func (s *TemporalStarter) Start(ctx context.Context, subjectRef string) error {
	if subjectRef == "" {
		return fmt.Errorf("start deletion workflow: empty subject ref")
	}
	if s == nil || s.client == nil {
		return fmt.Errorf("start deletion workflow: nil temporal client")
	}
	if s.taskQueue == "" {
		return fmt.Errorf("start deletion workflow: empty task queue")
	}

	_, err := s.client.ExecuteWorkflow(ctx, client.StartWorkflowOptions{
		ID:                                       workflowIDPrefix + subjectRef,
		TaskQueue:                                s.taskQueue,
		WorkflowIDConflictPolicy:                 enumspb.WORKFLOW_ID_CONFLICT_POLICY_USE_EXISTING,
		WorkflowIDReusePolicy:                    enumspb.WORKFLOW_ID_REUSE_POLICY_REJECT_DUPLICATE,
		WorkflowExecutionErrorWhenAlreadyStarted: false,
	}, DeletionWorkflow, WorkflowInput{SubjectRef: subjectRef})
	if err != nil {
		return fmt.Errorf("start deletion workflow for %q: %w", subjectRef, err)
	}
	return nil
}
