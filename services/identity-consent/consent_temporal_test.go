package identityconsent

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"github.com/gt100k/platform/workflows/deletion"
	"go.temporal.io/sdk/client"
	"google.golang.org/protobuf/proto"
)

func TestWithdrawConsentStartsTemporalDeletionAdapterOnce(t *testing.T) {
	ctx := context.Background()
	repo := newMemoryConsentRepository()
	audit := &memoryAuditLog{}
	workflowClient := &consentWorkflowClient{}
	grant := proto.Clone(fixtures.ConsentOnboarding).(*platformv1.ConsentGrant)
	if err := GrantConsent(ctx, repo, grant); err != nil {
		t.Fatalf("GrantConsent() error = %v", err)
	}

	deps := ConsentDeps{
		Consents: repo,
		Audit:    audit,
		Deletion: deletion.NewTemporalStarter(workflowClient, "foundation-deletion"),
		IDs:      &sequenceIDGenerator{ids: []string{"audit_temporal_0001"}},
	}
	withdrawnAt := mustAuthzTime(t, "2026-07-20T15:00:00Z")
	contractID := grant.GetHeader().GetContractId()
	if err := WithdrawConsent(ctx, deps, contractID, withdrawnAt); err != nil {
		t.Fatalf("WithdrawConsent() error = %v", err)
	}
	if err := WithdrawConsent(ctx, deps, contractID, withdrawnAt); err != nil {
		t.Fatalf("repeated WithdrawConsent() error = %v", err)
	}

	if len(workflowClient.calls) != 1 {
		t.Fatalf("ExecuteWorkflow() calls = %d, want 1", len(workflowClient.calls))
	}
	call := workflowClient.calls[0]
	if call.options.ID != "gt100k-deletion/"+fixtures.EligibleLearner.GetLearnerRef() {
		t.Errorf("workflow ID = %q, want stable learner workflow ID", call.options.ID)
	}
	if len(call.args) != 1 {
		t.Fatalf("workflow args = %d, want 1", len(call.args))
	}
	input, ok := call.args[0].(deletion.WorkflowInput)
	if !ok || input.SubjectRef != fixtures.EligibleLearner.GetLearnerRef() {
		t.Errorf("workflow input = %#v, want subject_ref %q", call.args[0], fixtures.EligibleLearner.GetLearnerRef())
	}
	if got := audit.all(); len(got) != 1 || got[0].GetAction() != "consent_withdrawn" {
		t.Fatalf("withdrawal audit = %#v, want one consent_withdrawn entry", got)
	}
}

func TestWithdrawConsentPropagatesTemporalStartFailureWithoutAudit(t *testing.T) {
	ctx := context.Background()
	repo := newMemoryConsentRepository()
	audit := &memoryAuditLog{}
	wantErr := errors.New("synthetic temporal unavailable")
	grant := proto.Clone(fixtures.ConsentOnboarding).(*platformv1.ConsentGrant)
	if err := GrantConsent(ctx, repo, grant); err != nil {
		t.Fatalf("GrantConsent() error = %v", err)
	}

	err := WithdrawConsent(ctx, ConsentDeps{
		Consents: repo,
		Audit:    audit,
		Deletion: deletion.NewTemporalStarter(&consentWorkflowClient{err: wantErr}, "foundation-deletion"),
		IDs:      &sequenceIDGenerator{ids: []string{"audit_temporal_0001"}},
	}, grant.GetHeader().GetContractId(), mustAuthzTime(t, "2026-07-20T15:00:00Z"))
	if !errors.Is(err, wantErr) || !strings.Contains(err.Error(), "start deletion") {
		t.Fatalf("WithdrawConsent() error = %v, want wrapped start failure", err)
	}
	if got := audit.all(); len(got) != 0 {
		t.Fatalf("withdrawal audit entries = %d, want 0 after failed start", len(got))
	}
}

type consentWorkflowCall struct {
	options client.StartWorkflowOptions
	args    []interface{}
}

type consentWorkflowClient struct {
	calls []consentWorkflowCall
	err   error
}

func (c *consentWorkflowClient) ExecuteWorkflow(
	_ context.Context,
	options client.StartWorkflowOptions,
	_ interface{},
	args ...interface{},
) (client.WorkflowRun, error) {
	c.calls = append(c.calls, consentWorkflowCall{
		options: options,
		args:    append([]interface{}(nil), args...),
	})
	return nil, c.err
}
