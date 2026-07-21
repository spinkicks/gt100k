// Package identityconsent implements the foundation identity and consent edge.
package identityconsent

import (
	"bytes"
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/gt100k/platform/pkg/platform"
	"github.com/gt100k/platform/pkg/spine"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"github.com/open-policy-agent/opa/v1/bundle"
	"github.com/open-policy-agent/opa/v1/rego"
)

const authorizationQuery = "data.gt100k.authz.decision"

//go:embed authz_bundle.tar.gz
var authorizationBundle []byte

type compiledAuthorizer struct {
	query         rego.PreparedEvalQuery
	policyVersion string
}

type opaInput struct {
	Actor         opaActor     `json:"actor"`
	Purpose       string       `json:"purpose"`
	SubjectRef    string       `json:"subject_ref"`
	Jurisdiction  string       `json:"jurisdiction"`
	At            string       `json:"at"`
	PolicyVersion string       `json:"policy_version"`
	Consents      []opaConsent `json:"consents"`
}

type opaActor struct {
	Ref   string `json:"ref"`
	Class string `json:"class"`
	Role  string `json:"role"`
}

type opaConsent struct {
	Purpose      string `json:"purpose"`
	Jurisdiction string `json:"jurisdiction"`
	Active       bool   `json:"active"`
}

var defaultAuthorizer = sync.OnceValues(loadAuthorizer)

// Authorize evaluates the compiled, embedded OPA bundle in process. It does
// not call an OPA server and does not reimplement the Rego decision predicate.
func Authorize(ctx context.Context, in PolicyInput) (PolicyDecision, error) {
	authorizer, err := defaultAuthorizer()
	if err != nil {
		return PolicyDecision{}, err
	}
	return authorizer.Authorize(ctx, in)
}

func loadAuthorizer() (*compiledAuthorizer, error) {
	parsed, err := bundle.NewReader(bytes.NewReader(authorizationBundle)).Read()
	if err != nil {
		return nil, fmt.Errorf("load authorization bundle: %w", err)
	}
	if parsed.Manifest.Revision == "" {
		return nil, fmt.Errorf("load authorization bundle: empty revision")
	}

	query, err := rego.New(
		rego.Query(authorizationQuery),
		rego.ParsedBundle("foundation-authz", &parsed),
	).PrepareForEval(context.Background())
	if err != nil {
		return nil, fmt.Errorf("compile authorization bundle: %w", err)
	}
	return &compiledAuthorizer{query: query, policyVersion: parsed.Manifest.Revision}, nil
}

func (a *compiledAuthorizer) Authorize(ctx context.Context, in spine.PolicyInput) (spine.PolicyDecision, error) {
	input := opaInput{
		Actor: opaActor{
			Ref:   in.Actor.GetRef(),
			Class: in.Actor.GetClass().String(),
			Role:  in.Actor.GetRole(),
		},
		Purpose:       in.Purpose,
		SubjectRef:    in.SubjectRef,
		Jurisdiction:  in.Jurisdiction,
		At:            in.At.Format(time.RFC3339Nano),
		PolicyVersion: a.policyVersion,
		Consents:      activeConsents(in.Consents, in.At),
	}

	results, err := a.query.Eval(ctx, rego.EvalInput(input))
	if err != nil {
		return PolicyDecision{}, fmt.Errorf("evaluate authorization policy: %w", err)
	}
	if len(results) != 1 || len(results[0].Expressions) != 1 {
		return PolicyDecision{}, fmt.Errorf("evaluate authorization policy: unexpected result shape")
	}

	encoded, err := json.Marshal(results[0].Expressions[0].Value)
	if err != nil {
		return PolicyDecision{}, fmt.Errorf("decode authorization decision: %w", err)
	}
	var decision PolicyDecision
	if err := json.Unmarshal(encoded, &decision); err != nil {
		return PolicyDecision{}, fmt.Errorf("decode authorization decision: %w", err)
	}
	if decision.Reason == "" || decision.PolicyVersion == "" {
		return PolicyDecision{}, fmt.Errorf("decode authorization decision: incomplete decision")
	}
	if decision.PolicyVersion != a.policyVersion {
		return PolicyDecision{}, fmt.Errorf(
			"decode authorization decision: policy version %q does not match bundle revision %q",
			decision.PolicyVersion,
			a.policyVersion,
		)
	}
	return decision, nil
}

func activeConsents(consents []*platformv1.ConsentGrant, at time.Time) []opaConsent {
	active := make([]opaConsent, 0, len(consents))
	for _, consent := range consents {
		if !platform.IsConsentActive(consent, at) {
			continue
		}
		active = append(active, opaConsent{
			Purpose:      consent.GetPurpose(),
			Jurisdiction: consent.GetJurisdiction(),
			Active:       true,
		})
	}
	return active
}
