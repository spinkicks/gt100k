package identityconsent

import (
	"context"
	"fmt"

	"github.com/gt100k/platform/pkg/platform"
	platformv1 "github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1"
)

// RecordAssent validates and appends an assent record without changing the
// child's response. An honorable refusal therefore remains an effective veto.
func RecordAssent(ctx context.Context, repo AssentRepository, record *platformv1.AssentRecord) error {
	if repo == nil {
		return fmt.Errorf("record assent: nil assent repository")
	}
	if err := platform.ValidateAssentRecord(record); err != nil {
		return err
	}
	if err := repo.Put(ctx, record); err != nil {
		return fmt.Errorf("record assent: %w", err)
	}
	return nil
}
