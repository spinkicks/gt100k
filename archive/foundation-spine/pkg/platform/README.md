# Platform contract invariants

`pkg/platform` validates the common traceability envelope and the six foundation contracts. The Protobuf registry defines them under `proto/gt100k/platform/v1`. Import the validators from `github.com/gt100k/platform/pkg/platform` and the generated messages from `github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1`.

The validators perform no I/O and do not mutate their inputs. Persistence, authorization, audit, and workflow orchestration belong to `pkg/spine`, `services/identity-consent`, and `workflows/deletion`.

## Public API

### Envelope

`ValidateEnvelope` and `AssertEnvelopeComplete` enforce the shared `Envelope` header. Every contract requires these fields:

- `contract_id`, `schema_version`, and `tenant_id`
- a non-nil `actor_ref`
- valid `occurred_at` and `recorded_at` timestamps
- `correlation_id` and `causation_id`
- `consent_purpose` and `policy_version`

`model_version` and `evidence_refs` remain optional. The validator checks the header shape; contract-specific validators add their own timing and authority rules.

### Six contracts

| Contract | Validator and invariant |
|---|---|
| `LearnerEvent` | `ValidateLearnerEvent` requires the envelope, distinct occurrence and recording times, an event type, learner reference, source, and payload schema. |
| `ConsentGrant` | `ValidateConsentGrant` requires guardian authority, purpose, data categories, processors, jurisdiction, effective time, collection method, and document hash. `IsConsentActive` treats the effective bound as inclusive and the expiry bound as exclusive; withdrawal makes the grant inactive. |
| `AssentRecord` | `ValidateAssentRecord` checks the notice, choices, response, facilitator, and recording time. After validation, `AssentBlocks` makes an honorable refusal or dissent veto optional collection even when a guardian granted consent; a non-honorable response does not block. |
| `DecisionRecord` | `ValidateDecisionRecord` requires a named human and policy result for consequential decisions. `AssertHumanAuthority` accepts named `HUMAN`, `GUARDIAN`, `CHILD`, and `STAFF` actors; it rejects `MODEL`, `SYSTEM`, unspecified, and unknown classes. `AssertAppendOnly` rejects an existing contract ID. |
| `OverrideRecord` | `ValidateOverrideRecord` requires a new record linked to its target through `causation_id`. The `admissions`, `public_exposure`, `safeguarding`, and `credential_revocation` classes require two distinct named human approvers through `AssertFourEyes`; other classes require one. |
| `Appeal` | `ValidateAppeal` accepts the defined lifecycle states, including reopened and late records. Pass the target decision's authorized-human reference so `AssertReviewerIndependent` can reject a reviewer with the same pseudonymous reference. |

Callers represent overrides and appeals as new records. The validators leave the target decision untouched. The spine lifecycle functions load the target, append the new record, and write the audit fact.

### Typed invariant errors

Callers can inspect validation failures with `errors.As`:

- `NamedFieldError` names a missing, empty, or invalid field.
- `AuthorityForgeryError` identifies model or system actors used as human authority.
- `AppendOnlyError` identifies a duplicate contract ID.
- `FourEyesError` reports the count of distinct human approvers.
- `ReviewerConflictError` identifies an appeal reviewer conflict.

### Deterministic dependencies

`Clock` and `IDGenerator` let orchestration code inject time and opaque IDs. The invariant core does not read the wall clock or generate random values.

## Boundaries

The Protobuf registry owns the wire schema. Add fields under new tags and regenerate the Go messages; do not replace generated messages with package-local domain structs.

This package enforces record invariants. It does not decide policy, persist contracts, route approvals, or execute remedies. GT100K defers human approval routing, notifications, SLA timers, and remedy execution to a later production layer.
