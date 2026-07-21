// Package redpanda implements the event spine transport over franz-go.
package redpanda

import (
	"context"
	"fmt"

	"github.com/gt100k/platform/pkg/platform"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"github.com/twmb/franz-go/pkg/kgo"
	"google.golang.org/protobuf/proto"
)

type Producer struct {
	client *kgo.Client
	topic  string
}

func NewProducer(brokers []string, topic string) (*Producer, error) {
	if len(brokers) == 0 {
		return nil, fmt.Errorf("create producer: no brokers")
	}
	if topic == "" {
		return nil, fmt.Errorf("create producer: empty topic")
	}
	client, err := kgo.NewClient(
		kgo.SeedBrokers(brokers...),
		kgo.AllowAutoTopicCreation(),
	)
	if err != nil {
		return nil, fmt.Errorf("create producer: %w", err)
	}
	return &Producer{client: client, topic: topic}, nil
}

func (p *Producer) Publish(ctx context.Context, event *platformv1.LearnerEvent) error {
	if p == nil || p.client == nil {
		return fmt.Errorf("publish event: nil producer")
	}
	if err := platform.ValidateLearnerEvent(event); err != nil {
		return fmt.Errorf("publish event: invalid learner event: %w", err)
	}
	payload, err := proto.Marshal(event)
	if err != nil {
		return fmt.Errorf("publish event: encode: %w", err)
	}
	contractID := event.GetHeader().GetContractId()
	if err := p.client.ProduceSync(ctx, &kgo.Record{
		Topic: p.topic,
		Key:   []byte(contractID),
		Value: payload,
	}).FirstErr(); err != nil {
		return fmt.Errorf("publish event %q: %w", contractID, err)
	}
	return nil
}

func (p *Producer) Close() {
	if p != nil && p.client != nil {
		p.client.Close()
	}
}

type Consumer struct {
	client *kgo.Client
}

func NewConsumer(brokers []string, topic string) (*Consumer, error) {
	if len(brokers) == 0 {
		return nil, fmt.Errorf("create consumer: no brokers")
	}
	if topic == "" {
		return nil, fmt.Errorf("create consumer: empty topic")
	}
	client, err := kgo.NewClient(
		kgo.SeedBrokers(brokers...),
		kgo.ConsumeTopics(topic),
		kgo.ConsumeResetOffset(kgo.NewOffset().AtStart()),
	)
	if err != nil {
		return nil, fmt.Errorf("create consumer: %w", err)
	}
	return &Consumer{client: client}, nil
}

func (c *Consumer) Next(ctx context.Context) (*platformv1.LearnerEvent, error) {
	if c == nil || c.client == nil {
		return nil, fmt.Errorf("consume event: nil consumer")
	}
	fetches := c.client.PollRecords(ctx, 1)
	if errs := fetches.Errors(); len(errs) > 0 {
		return nil, fmt.Errorf("consume event: %s: %w", errs[0].Topic, errs[0].Err)
	}
	var record *kgo.Record
	fetches.EachRecord(func(current *kgo.Record) {
		if record == nil {
			record = current
		}
	})
	if record == nil {
		return nil, fmt.Errorf("consume event: broker returned no record")
	}

	event := new(platformv1.LearnerEvent)
	if err := proto.Unmarshal(record.Value, event); err != nil {
		return nil, fmt.Errorf("consume event: decode: %w", err)
	}
	if err := platform.ValidateLearnerEvent(event); err != nil {
		return nil, fmt.Errorf("consume event: invalid learner event: %w", err)
	}
	contractID := event.GetHeader().GetContractId()
	if string(record.Key) != contractID {
		return nil, fmt.Errorf("consume event: key %q does not match contract id %q", string(record.Key), contractID)
	}
	return event, nil
}

func (c *Consumer) Close() {
	if c != nil && c.client != nil {
		c.client.Close()
	}
}
