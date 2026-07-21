package deletion_test

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"github.com/gt100k/platform/pkg/spine"
	"github.com/gt100k/platform/workflows/deletion"
	enumspb "go.temporal.io/api/enums/v1"
	"go.temporal.io/sdk/client"
)

const (
	testSubjectRef = "learner_synth_001"
	testTaskQueue  = "foundation-deletion"
)

var _ spine.DeletionStarter = deletion.NewTemporalStarter(&recordingWorkflowClient{}, testTaskQueue)

func TestTemporalStarterStartsDeletionWorkflowWithStableIdentity(t *testing.T) {
	workflowClient := &recordingWorkflowClient{}
	starter := deletion.NewTemporalStarter(workflowClient, testTaskQueue)

	if err := starter.Start(context.Background(), testSubjectRef); err != nil {
		t.Fatalf("Start() error = %v", err)
	}

	if len(workflowClient.calls) != 1 {
		t.Fatalf("ExecuteWorkflow() calls = %d, want 1", len(workflowClient.calls))
	}
	call := workflowClient.calls[0]
	if call.options.ID != "gt100k-deletion/"+testSubjectRef {
		t.Errorf("workflow ID = %q, want stable subject workflow ID", call.options.ID)
	}
	if call.options.TaskQueue != testTaskQueue {
		t.Errorf("task queue = %q, want %q", call.options.TaskQueue, testTaskQueue)
	}
	if call.options.WorkflowIDReusePolicy != enumspb.WORKFLOW_ID_REUSE_POLICY_REJECT_DUPLICATE {
		t.Errorf("workflow ID reuse policy = %v, want REJECT_DUPLICATE", call.options.WorkflowIDReusePolicy)
	}
	if call.options.WorkflowIDConflictPolicy != enumspb.WORKFLOW_ID_CONFLICT_POLICY_USE_EXISTING {
		t.Errorf("workflow ID conflict policy = %v, want USE_EXISTING", call.options.WorkflowIDConflictPolicy)
	}
	if call.options.WorkflowExecutionErrorWhenAlreadyStarted {
		t.Error("WorkflowExecutionErrorWhenAlreadyStarted = true, want false")
	}
	if reflect.ValueOf(call.workflow).Pointer() != reflect.ValueOf(deletion.DeletionWorkflow).Pointer() {
		t.Errorf("workflow = %T, want DeletionWorkflow", call.workflow)
	}
	if len(call.args) != 1 {
		t.Fatalf("workflow args = %d, want 1", len(call.args))
	}
	input, ok := call.args[0].(deletion.WorkflowInput)
	if !ok {
		t.Fatalf("workflow arg type = %T, want deletion.WorkflowInput", call.args[0])
	}
	if input.SubjectRef != testSubjectRef {
		t.Errorf("workflow subject_ref = %q, want %q", input.SubjectRef, testSubjectRef)
	}
}

func TestTemporalStarterPropagatesStartFailure(t *testing.T) {
	wantErr := errors.New("synthetic temporal unavailable")
	workflowClient := &recordingWorkflowClient{err: wantErr}
	starter := deletion.NewTemporalStarter(workflowClient, testTaskQueue)

	err := starter.Start(context.Background(), testSubjectRef)
	if !errors.Is(err, wantErr) {
		t.Fatalf("Start() error = %v, want wrapped %v", err, wantErr)
	}
}

type workflowCall struct {
	options  client.StartWorkflowOptions
	workflow interface{}
	args     []interface{}
}

type recordingWorkflowClient struct {
	calls []workflowCall
	err   error
}

func (c *recordingWorkflowClient) ExecuteWorkflow(
	_ context.Context,
	options client.StartWorkflowOptions,
	workflow interface{},
	args ...interface{},
) (client.WorkflowRun, error) {
	c.calls = append(c.calls, workflowCall{
		options:  options,
		workflow: workflow,
		args:     append([]interface{}(nil), args...),
	})
	return nil, c.err
}
