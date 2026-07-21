package deletion

import (
	"context"
	"errors"
	"sync"
	"testing"

	"github.com/stretchr/testify/require"
	"go.temporal.io/sdk/activity"
	"go.temporal.io/sdk/testsuite"
)

const syntheticSubjectRef = "learner_synth_001"

func TestDeletionWorkflowCompletesIdempotently(t *testing.T) {
	backend := newRecordingBackend()
	activities := &Activities{Backend: backend}

	first := runDeletionWorkflow(t, activities, WorkflowInput{SubjectRef: syntheticSubjectRef})
	second := runDeletionWorkflow(t, activities, WorkflowInput{SubjectRef: syntheticSubjectRef})

	require.Equal(t, WorkflowResult{
		Status:     StatusCompleted,
		SubjectRef: syntheticSubjectRef,
	}, first)
	require.Equal(t, first, second)
	wantOperations := []string{
		OperationErasePostgres,
		OperationDeleteS3Objects,
		OperationClearRedis,
		OperationCryptoShred,
		OperationRecordDeletionAudit,
	}
	require.Equal(t, wantOperations, backend.appliedOperations())
	for _, operation := range wantOperations {
		require.Equal(t, 2, backend.attemptCount(operation), operation)
		require.Equal(t, 1, backend.applyCount(operation), operation)
	}
	require.True(t, backend.auditPreserved(syntheticSubjectRef))
}

func TestDeletionWorkflowRetriesCryptoShredAndPreservesAudit(t *testing.T) {
	backend := newRecordingBackend()
	backend.failNext(OperationCryptoShred, 1)

	result := runDeletionWorkflow(t, &Activities{Backend: backend}, WorkflowInput{
		SubjectRef: syntheticSubjectRef,
	})

	require.Equal(t, StatusCompleted, result.Status)
	require.Equal(t, syntheticSubjectRef, result.SubjectRef)
	require.True(t, result.Compensated)
	require.Equal(t, 2, backend.attemptCount(OperationCryptoShred))
	require.Equal(t, 1, backend.applyCount(OperationCryptoShred))
	require.Equal(t, 1, backend.applyCount(OperationRecordDeletionAudit))
	require.True(t, backend.auditPreserved(syntheticSubjectRef))
}

func runDeletionWorkflow(t *testing.T, activities *Activities, input WorkflowInput) WorkflowResult {
	t.Helper()

	var suite testsuite.WorkflowTestSuite
	env := suite.NewTestWorkflowEnvironment()
	env.RegisterActivityWithOptions(activities.ErasePostgres, activity.RegisterOptions{Name: ActivityErasePostgres})
	env.RegisterActivityWithOptions(activities.DeleteS3Objects, activity.RegisterOptions{Name: ActivityDeleteS3Objects})
	env.RegisterActivityWithOptions(activities.ClearRedis, activity.RegisterOptions{Name: ActivityClearRedis})
	env.RegisterActivityWithOptions(activities.CryptoShred, activity.RegisterOptions{Name: ActivityCryptoShred})
	env.RegisterActivityWithOptions(activities.RecordDeletionAudit, activity.RegisterOptions{Name: ActivityRecordDeletionAudit})

	env.ExecuteWorkflow(DeletionWorkflow, input)

	require.True(t, env.IsWorkflowCompleted())
	require.NoError(t, env.GetWorkflowError())
	var result WorkflowResult
	require.NoError(t, env.GetWorkflowResult(&result))
	return result
}

type recordingBackend struct {
	mu       sync.Mutex
	attempts map[string]int
	applied  map[string]int
	seen     map[string]struct{}
	failures map[string]int
	order    []string
	audits   map[string]struct{}
}

func newRecordingBackend() *recordingBackend {
	return &recordingBackend{
		attempts: make(map[string]int),
		applied:  make(map[string]int),
		seen:     make(map[string]struct{}),
		failures: make(map[string]int),
		audits:   make(map[string]struct{}),
	}
}

func (b *recordingBackend) Apply(_ context.Context, operation string, input ActivityInput) error {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.attempts[operation]++
	if b.failures[operation] > 0 {
		b.failures[operation]--
		return errors.New("synthetic transient activity failure")
	}
	if _, ok := b.seen[input.IdempotencyKey]; ok {
		return nil
	}
	b.seen[input.IdempotencyKey] = struct{}{}
	b.applied[operation]++
	b.order = append(b.order, operation)
	if operation == OperationRecordDeletionAudit {
		b.audits[input.SubjectRef] = struct{}{}
	}
	return nil
}

func (b *recordingBackend) failNext(operation string, count int) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.failures[operation] = count
}

func (b *recordingBackend) attemptCount(operation string) int {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.attempts[operation]
}

func (b *recordingBackend) applyCount(operation string) int {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.applied[operation]
}

func (b *recordingBackend) appliedOperations() []string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return append([]string(nil), b.order...)
}

func (b *recordingBackend) auditPreserved(subjectRef string) bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	_, ok := b.audits[subjectRef]
	return ok
}
