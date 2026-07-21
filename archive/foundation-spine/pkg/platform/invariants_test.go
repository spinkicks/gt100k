package platform

import (
	"errors"
	"testing"
)

func TestInvariantErrors(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want string
		as   func(error) bool
	}{
		{
			name: "named field",
			err:  &NamedFieldError{Field: "tenant_id"},
			want: `required field "tenant_id" is missing or empty`,
			as: func(err error) bool {
				var target *NamedFieldError
				return errors.As(err, &target) && target.Field == "tenant_id"
			},
		},
		{
			name: "authority forgery",
			err:  &AuthorityForgeryError{Field: "authorized_human"},
			want: `field "authorized_human" requires human authority`,
			as: func(err error) bool {
				var target *AuthorityForgeryError
				return errors.As(err, &target) && target.Field == "authorized_human"
			},
		},
		{
			name: "append only",
			err:  &AppendOnlyError{ContractID: "cid_0001"},
			want: `contract "cid_0001" is append-only`,
			as: func(err error) bool {
				var target *AppendOnlyError
				return errors.As(err, &target) && target.ContractID == "cid_0001"
			},
		},
		{
			name: "four eyes",
			err:  &FourEyesError{Have: 1},
			want: "four-eyes approval requires 2 distinct human approvers; have 1",
			as: func(err error) bool {
				var target *FourEyesError
				return errors.As(err, &target) && target.Have == 1
			},
		},
		{
			name: "reviewer conflict",
			err:  &ReviewerConflictError{Field: "independent_reviewer"},
			want: `field "independent_reviewer" conflicts with authorized human`,
			as: func(err error) bool {
				var target *ReviewerConflictError
				return errors.As(err, &target) && target.Field == "independent_reviewer"
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.err.Error(); got != tt.want {
				t.Fatalf("Error() = %q, want %q", got, tt.want)
			}
			if !tt.as(tt.err) {
				t.Fatalf("errors.As did not preserve %T fields", tt.err)
			}
		})
	}
}

var (
	_ error = NamedFieldError{}
	_ error = AuthorityForgeryError{}
	_ error = AppendOnlyError{}
	_ error = FourEyesError{}
	_ error = ReviewerConflictError{}
)
