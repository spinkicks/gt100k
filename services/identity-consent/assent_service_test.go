package identityconsent

import (
	"context"
	"errors"
	"testing"

	"github.com/gt100k/platform/pkg/platform"
	"github.com/gt100k/platform/pkg/platform/fixtures"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestRecordAssentValidatesAndAppendsHonorableRefusal(t *testing.T) {
	ctx := context.Background()
	repo := newMemoryAssentRepository()
	record := validServiceAssentRecord()

	if err := RecordAssent(ctx, repo, record); err != nil {
		t.Fatalf("RecordAssent() error = %v", err)
	}

	stored, err := repo.ForChild(ctx, record.GetChildRef())
	if err != nil {
		t.Fatalf("AssentRepository.ForChild() error = %v", err)
	}
	if len(stored) != 1 {
		t.Fatalf("stored assent records = %d, want 1", len(stored))
	}
	if !proto.Equal(stored[0], record) {
		t.Fatalf("stored assent = %v, want %v", stored[0], record)
	}
	if !platform.AssentBlocks(stored[0]) {
		t.Fatal("AssentBlocks(stored refusal) = false, want true")
	}

	record.ChildRef = "mutated_after_put"
	storedAgain, err := repo.ForChild(ctx, fixtures.Child.GetRef())
	if err != nil {
		t.Fatalf("AssentRepository.ForChild() after mutation error = %v", err)
	}
	if len(storedAgain) != 1 || storedAgain[0].GetChildRef() != fixtures.Child.GetRef() {
		t.Fatalf("stored assent changed through caller alias: %v", storedAgain)
	}
}

func TestRecordAssentRejectsInvalidRecordBeforePersistence(t *testing.T) {
	repo := newMemoryAssentRepository()
	record := validServiceAssentRecord()
	record.ChildRef = ""

	err := RecordAssent(context.Background(), repo, record)
	var fieldErr *platform.NamedFieldError
	if !errors.As(err, &fieldErr) || fieldErr.Field != "child_ref" {
		t.Fatalf("RecordAssent() error = %v, want *NamedFieldError for child_ref", err)
	}
	if got := repo.putCalls(); got != 0 {
		t.Fatalf("AssentRepository.Put() calls = %d, want 0", got)
	}
}

func TestRecordAssentPropagatesRepositoryFailure(t *testing.T) {
	wantErr := errors.New("synthetic assent persistence failure")
	repo := newMemoryAssentRepository()
	repo.putErr = wantErr

	err := RecordAssent(context.Background(), repo, validServiceAssentRecord())
	if !errors.Is(err, wantErr) {
		t.Fatalf("RecordAssent() error = %v, want wrapped %v", err, wantErr)
	}
	if got := repo.putCalls(); got != 1 {
		t.Fatalf("AssentRepository.Put() calls = %d, want 1", got)
	}
}

func validServiceAssentRecord() *platformv1.AssentRecord {
	header := proto.Clone(fixtures.ValidEnvelope).(*platformv1.Envelope)
	header.ContractId = "assent_synth_0001"
	header.SchemaVersion = "assent_record/1"
	header.ActorRef = proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef)
	header.ConsentPurpose = "research.trial"

	return &platformv1.AssentRecord{
		Header:        header,
		ChildRef:      fixtures.Child.GetRef(),
		AgeBand:       "13-15",
		NoticeVersion: "plain-language-notice/1",
		ChoicesShown:  []string{"assent", "refuse", "ask_questions"},
		Response:      platformv1.AssentResponse_REFUSAL,
		Facilitator:   proto.Clone(fixtures.StaffGuide).(*platformv1.ActorRef),
		RecordedAt:    proto.Clone(header.GetRecordedAt()).(*timestamppb.Timestamp),
		Honorable:     true,
	}
}
