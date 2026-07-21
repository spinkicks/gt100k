package memory

import (
	"context"
	"fmt"
	"sync"

	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
)

type Projection struct {
	mu     sync.Mutex
	events map[string]*platformv1.LearnerEvent
	order  []string
}

func NewProjection() *Projection {
	return &Projection{events: make(map[string]*platformv1.LearnerEvent)}
}

func (p *Projection) Apply(ctx context.Context, event *platformv1.LearnerEvent) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	contractID := event.GetHeader().GetContractId()
	if contractID == "" {
		return fmt.Errorf("apply projection: empty contract id")
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	if _, exists := p.events[contractID]; exists {
		return fmt.Errorf("apply projection: contract id %q already exists", contractID)
	}
	p.events[contractID] = proto.Clone(event).(*platformv1.LearnerEvent)
	p.order = append(p.order, contractID)
	return nil
}

func (p *Projection) Count() int {
	p.mu.Lock()
	defer p.mu.Unlock()
	return len(p.events)
}

func (p *Projection) ContractIDs() []string {
	p.mu.Lock()
	defer p.mu.Unlock()
	return append([]string(nil), p.order...)
}
