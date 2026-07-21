package identityconsent

import (
	"context"
	"errors"
	"sync"

	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

type memoryAssentRepository struct {
	mu      sync.Mutex
	records map[string]*platformv1.AssentRecord
	putErr  error
	puts    int
}

func newMemoryAssentRepository() *memoryAssentRepository {
	return &memoryAssentRepository{records: make(map[string]*platformv1.AssentRecord)}
}

func (r *memoryAssentRepository) Put(_ context.Context, record *platformv1.AssentRecord) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.puts++
	if r.putErr != nil {
		return r.putErr
	}
	id := record.GetHeader().GetContractId()
	if _, exists := r.records[id]; exists {
		return errors.New("assent already exists")
	}
	r.records[id] = proto.Clone(record).(*platformv1.AssentRecord)
	return nil
}

func (r *memoryAssentRepository) ForChild(
	_ context.Context,
	childRef string,
) ([]*platformv1.AssentRecord, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	var records []*platformv1.AssentRecord
	for _, record := range r.records {
		if record.GetChildRef() == childRef {
			records = append(records, proto.Clone(record).(*platformv1.AssentRecord))
		}
	}
	return records, nil
}

func (r *memoryAssentRepository) putCalls() int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.puts
}

type memoryEnrollmentSource struct {
	learners []*platformv1.EligibleLearner
}

func newMemoryEnrollmentSource(learners ...*platformv1.EligibleLearner) *memoryEnrollmentSource {
	return &memoryEnrollmentSource{learners: learners}
}

func (s *memoryEnrollmentSource) Next(context.Context) (*platformv1.EligibleLearner, error) {
	if len(s.learners) == 0 {
		return nil, errors.New("enrollment handoff exhausted")
	}
	learner := s.learners[0]
	s.learners = s.learners[1:]
	if learner == nil {
		return nil, nil
	}
	return proto.Clone(learner).(*platformv1.EligibleLearner), nil
}

type memoryIdentityRepository struct {
	provisioned []*platformv1.EligibleLearner
	provisionAs *platformv1.ActorRef
	sessions    map[string]*platformv1.ActorRef
	resolves    int
}

func newMemoryIdentityRepository(provisionAs *platformv1.ActorRef) *memoryIdentityRepository {
	return &memoryIdentityRepository{
		provisionAs: provisionAs,
		sessions:    make(map[string]*platformv1.ActorRef),
	}
}

func (r *memoryIdentityRepository) Provision(
	_ context.Context,
	learner *platformv1.EligibleLearner,
) (*platformv1.ActorRef, error) {
	r.provisioned = append(r.provisioned, proto.Clone(learner).(*platformv1.EligibleLearner))
	if r.provisionAs == nil {
		return nil, nil
	}
	return proto.Clone(r.provisionAs).(*platformv1.ActorRef), nil
}

func (r *memoryIdentityRepository) ResolveActor(
	_ context.Context,
	sessionRef string,
) (*platformv1.ActorRef, error) {
	r.resolves++
	actor, ok := r.sessions[sessionRef]
	if !ok {
		return nil, errors.New("session not found")
	}
	return proto.Clone(actor).(*platformv1.ActorRef), nil
}

func (r *memoryIdentityRepository) addSession(sessionRef string, actor *platformv1.ActorRef) {
	r.sessions[sessionRef] = proto.Clone(actor).(*platformv1.ActorRef)
}

func (r *memoryIdentityRepository) provisionedLearners() []*platformv1.EligibleLearner {
	learners := make([]*platformv1.EligibleLearner, len(r.provisioned))
	for i, learner := range r.provisioned {
		learners[i] = proto.Clone(learner).(*platformv1.EligibleLearner)
	}
	return learners
}

func (r *memoryIdentityRepository) resolveCalls() int {
	return r.resolves
}
