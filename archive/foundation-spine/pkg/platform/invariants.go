package platform

import "fmt"

// NamedFieldError identifies a required field that is missing or empty.
type NamedFieldError struct {
	Field string
}

func (e NamedFieldError) Error() string {
	return fmt.Sprintf("required field %q is missing or empty", e.Field)
}

// AuthorityForgeryError identifies a non-human actor used where human authority is required.
type AuthorityForgeryError struct {
	Field string
}

func (e AuthorityForgeryError) Error() string {
	return fmt.Sprintf("field %q requires human authority", e.Field)
}

// AppendOnlyError identifies an attempted rewrite of an existing contract.
type AppendOnlyError struct {
	ContractID string
}

func (e AppendOnlyError) Error() string {
	return fmt.Sprintf("contract %q is append-only", e.ContractID)
}

// FourEyesError reports how many distinct human approvers were supplied.
type FourEyesError struct {
	Have int
}

func (e FourEyesError) Error() string {
	return fmt.Sprintf("four-eyes approval requires 2 distinct human approvers; have %d", e.Have)
}

// ReviewerConflictError identifies a reviewer who is not independent.
type ReviewerConflictError struct {
	Field string
}

func (e ReviewerConflictError) Error() string {
	return fmt.Sprintf("field %q conflicts with authorized human", e.Field)
}
