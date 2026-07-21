package deletion

import (
	"strconv"
	"strings"
	"testing"
	"time"

	commonpb "go.temporal.io/api/common/v1"
	enumspb "go.temporal.io/api/enums/v1"
	historypb "go.temporal.io/api/history/v1"
	taskqueuepb "go.temporal.io/api/taskqueue/v1"
	"go.temporal.io/sdk/converter"
	"go.temporal.io/sdk/worker"
	temporalworkflow "go.temporal.io/sdk/workflow"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestDeletionWorkflowHistoryReplaysDeterministically(t *testing.T) {
	replayer := worker.NewWorkflowReplayer()
	replayer.RegisterWorkflow(DeletionWorkflow)
	err := replayer.ReplayWorkflowHistoryWithOptions(nil, deletionReplayHistory(t), worker.ReplayWorkflowHistoryOptions{
		OriginalExecution: temporalworkflow.Execution{ID: "gt100k-deletion/" + syntheticSubjectRef},
	})
	if err != nil {
		t.Fatalf("ReplayWorkflowHistory() error = %v", err)
	}
}

func TestDeletionWorkflowHistoryRejectsActivityOrderChange(t *testing.T) {
	replayer := worker.NewWorkflowReplayer()
	replayer.RegisterWorkflowWithOptions(reorderedDeletionWorkflow, temporalworkflow.RegisterOptions{Name: "DeletionWorkflow"})
	err := replayer.ReplayWorkflowHistoryWithOptions(nil, deletionReplayHistory(t), worker.ReplayWorkflowHistoryOptions{
		OriginalExecution: temporalworkflow.Execution{ID: "gt100k-deletion/" + syntheticSubjectRef},
	})
	if err == nil {
		t.Fatal("ReplayWorkflowHistory() error = nil, want nondeterminism error")
	}
	if !strings.Contains(err.Error(), "TMPRL1100") {
		t.Fatalf("ReplayWorkflowHistory() error = %q, want Temporal nondeterminism code", err)
	}
}

func reorderedDeletionWorkflow(ctx temporalworkflow.Context, input WorkflowInput) (WorkflowResult, error) {
	ctx = temporalworkflow.WithActivityOptions(ctx, temporalworkflow.ActivityOptions{
		StartToCloseTimeout: time.Minute,
	})
	temporalworkflow.ExecuteActivity(ctx, ActivityClearRedis, ActivityInput{
		SubjectRef:     input.SubjectRef,
		IdempotencyKey: temporalworkflow.GetInfo(ctx).WorkflowExecution.ID + ":" + OperationClearRedis,
	})
	return WorkflowResult{Status: StatusCompleted, SubjectRef: input.SubjectRef}, nil
}

func deletionReplayHistory(t *testing.T) *historypb.History {
	t.Helper()

	input := replayPayloads(t, WorkflowInput{SubjectRef: syntheticSubjectRef})
	activityResult := replayPayloads(t, ActivityResult{Attempt: 1})
	workflowResult := replayPayloads(t, WorkflowResult{Status: StatusCompleted, SubjectRef: syntheticSubjectRef})
	eventTime := timestamppb.New(time.Date(2026, 7, 20, 14, 5, 0, 0, time.UTC))
	const taskQueue = "foundation-replay"

	events := []*historypb.HistoryEvent{
		replayEvent(1, eventTime, enumspb.EVENT_TYPE_WORKFLOW_EXECUTION_STARTED,
			&historypb.HistoryEvent_WorkflowExecutionStartedEventAttributes{
				WorkflowExecutionStartedEventAttributes: &historypb.WorkflowExecutionStartedEventAttributes{
					WorkflowType: &commonpb.WorkflowType{Name: "DeletionWorkflow"},
					TaskQueue:    &taskqueuepb.TaskQueue{Name: taskQueue},
					Input:        input,
				},
			}),
	}

	nextEventID := int64(2)
	lastWorkflowTaskCompletedID := appendReplayWorkflowTask(&events, nextEventID, eventTime, taskQueue)
	nextEventID += 3
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
		scheduledID := nextEventID
		activityInput := replayPayloads(t, ActivityInput{
			SubjectRef:     syntheticSubjectRef,
			IdempotencyKey: "gt100k-deletion/" + syntheticSubjectRef + ":" + step.operation,
		})
		events = append(events,
			replayEvent(scheduledID, eventTime, enumspb.EVENT_TYPE_ACTIVITY_TASK_SCHEDULED,
				&historypb.HistoryEvent_ActivityTaskScheduledEventAttributes{
					ActivityTaskScheduledEventAttributes: &historypb.ActivityTaskScheduledEventAttributes{
						ActivityId:                   replayActivityID(scheduledID),
						ActivityType:                 &commonpb.ActivityType{Name: step.activity},
						TaskQueue:                    &taskqueuepb.TaskQueue{Name: taskQueue},
						Input:                        activityInput,
						WorkflowTaskCompletedEventId: lastWorkflowTaskCompletedID,
					},
				}),
			replayEvent(scheduledID+1, eventTime, enumspb.EVENT_TYPE_ACTIVITY_TASK_STARTED,
				&historypb.HistoryEvent_ActivityTaskStartedEventAttributes{
					ActivityTaskStartedEventAttributes: &historypb.ActivityTaskStartedEventAttributes{
						ScheduledEventId: scheduledID,
						Attempt:          1,
					},
				}),
			replayEvent(scheduledID+2, eventTime, enumspb.EVENT_TYPE_ACTIVITY_TASK_COMPLETED,
				&historypb.HistoryEvent_ActivityTaskCompletedEventAttributes{
					ActivityTaskCompletedEventAttributes: &historypb.ActivityTaskCompletedEventAttributes{
						Result:           activityResult,
						ScheduledEventId: scheduledID,
						StartedEventId:   scheduledID + 1,
					},
				}),
		)
		nextEventID += 3
		lastWorkflowTaskCompletedID = appendReplayWorkflowTask(&events, nextEventID, eventTime, taskQueue)
		nextEventID += 3
	}

	events = append(events, replayEvent(nextEventID, eventTime, enumspb.EVENT_TYPE_WORKFLOW_EXECUTION_COMPLETED,
		&historypb.HistoryEvent_WorkflowExecutionCompletedEventAttributes{
			WorkflowExecutionCompletedEventAttributes: &historypb.WorkflowExecutionCompletedEventAttributes{
				Result:                       workflowResult,
				WorkflowTaskCompletedEventId: lastWorkflowTaskCompletedID,
			},
		}))
	return &historypb.History{Events: events}
}

func appendReplayWorkflowTask(
	events *[]*historypb.HistoryEvent,
	scheduledID int64,
	eventTime *timestamppb.Timestamp,
	taskQueue string,
) int64 {
	*events = append(*events,
		replayEvent(scheduledID, eventTime, enumspb.EVENT_TYPE_WORKFLOW_TASK_SCHEDULED,
			&historypb.HistoryEvent_WorkflowTaskScheduledEventAttributes{
				WorkflowTaskScheduledEventAttributes: &historypb.WorkflowTaskScheduledEventAttributes{
					TaskQueue: &taskqueuepb.TaskQueue{Name: taskQueue},
					Attempt:   1,
				},
			}),
		replayEvent(scheduledID+1, eventTime, enumspb.EVENT_TYPE_WORKFLOW_TASK_STARTED,
			&historypb.HistoryEvent_WorkflowTaskStartedEventAttributes{
				WorkflowTaskStartedEventAttributes: &historypb.WorkflowTaskStartedEventAttributes{
					ScheduledEventId: scheduledID,
				},
			}),
		replayEvent(scheduledID+2, eventTime, enumspb.EVENT_TYPE_WORKFLOW_TASK_COMPLETED,
			&historypb.HistoryEvent_WorkflowTaskCompletedEventAttributes{
				WorkflowTaskCompletedEventAttributes: &historypb.WorkflowTaskCompletedEventAttributes{
					ScheduledEventId: scheduledID,
					StartedEventId:   scheduledID + 1,
				},
			}),
	)
	return scheduledID + 2
}

func replayEvent(
	eventID int64,
	eventTime *timestamppb.Timestamp,
	eventType enumspb.EventType,
	attributes interface{},
) *historypb.HistoryEvent {
	event := &historypb.HistoryEvent{
		EventId:   eventID,
		EventTime: eventTime,
		EventType: eventType,
	}
	switch value := attributes.(type) {
	case *historypb.HistoryEvent_WorkflowExecutionStartedEventAttributes:
		event.Attributes = value
	case *historypb.HistoryEvent_WorkflowTaskScheduledEventAttributes:
		event.Attributes = value
	case *historypb.HistoryEvent_WorkflowTaskStartedEventAttributes:
		event.Attributes = value
	case *historypb.HistoryEvent_WorkflowTaskCompletedEventAttributes:
		event.Attributes = value
	case *historypb.HistoryEvent_ActivityTaskScheduledEventAttributes:
		event.Attributes = value
	case *historypb.HistoryEvent_ActivityTaskStartedEventAttributes:
		event.Attributes = value
	case *historypb.HistoryEvent_ActivityTaskCompletedEventAttributes:
		event.Attributes = value
	case *historypb.HistoryEvent_WorkflowExecutionCompletedEventAttributes:
		event.Attributes = value
	default:
		panic("unsupported replay history attributes")
	}
	return event
}

func replayPayloads(t *testing.T, value interface{}) *commonpb.Payloads {
	t.Helper()
	payloads, err := converter.GetDefaultDataConverter().ToPayloads(value)
	if err != nil {
		t.Fatalf("encode replay payload: %v", err)
	}
	return payloads
}

func replayActivityID(eventID int64) string {
	return strconv.FormatInt(eventID, 10)
}
