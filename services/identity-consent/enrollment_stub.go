package identityconsent

import (
	"context"

	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

// EnrollmentStub yields the deterministic, reference-only synthetic
// enrollment handoff used by the foundation spine.
type EnrollmentStub struct{}

func NewEnrollmentStub() *EnrollmentStub {
	return &EnrollmentStub{}
}

func (*EnrollmentStub) Next(context.Context) (*platformv1.EligibleLearner, error) {
	return proto.Clone(fixtures.EligibleLearner).(*platformv1.EligibleLearner), nil
}
