# Phase 1 Data Model: Platform Foundation Spine (Real Production Stack)

All identifiers are **pseudonymous**; no real PII (Constitution V; synthetic-only). All legal artifacts
(document hash, signature) are **placeholder strings** (FR-015). The wire types are **Protobuf** in
`proto/gt100k/platform/v1/`, generated to Go under `proto/gen/go/...` by `buf generate`
(`protoc-gen-go 1.36.5`). The Go invariant validators in `pkg/platform` operate over the generated types.
`google.protobuf.Timestamp` carries all times.

## Package split (single Go module `github.com/gt100k/platform`)

- `proto/` — the `buf`-owned schema (compat gate) + committed generated Go.
- `pkg/platform` — envelope + six-contract validators + invariants (imports only generated types + stdlib).
- `pkg/spine` — outbox + idempotent consumers + command path + audit (interfaces + fakes).
- `services/identity-consent` — identity/consent/assent domain + the OPA authorization edge.
- `policies/` — Rego policy-as-code + `opa test`.
- `workflows/deletion` — Temporal deletion workflow + activities.
- `infra/terraform` — validate-only IaC modules.

---

## Protobuf contracts (`proto/gt100k/platform/v1`)

Proto package `gt100k.platform.v1`; `option go_package =
"github.com/gt100k/platform/proto/gen/go/gt100k/platform/v1;platformv1";`. Field tags shown are the
committed baseline; **new fields take new tags** (`buf breaking` forbids removal/rename/reuse — G-BUF).

### ActorRef + ActorClass (`envelope.proto`)

The pseudonymous actor reference downstream logic receives instead of legal identity (FR-012); its `class`
enforces authority invariants (FR-005, FR-017).

```proto
enum ActorClass {
  ACTOR_CLASS_UNSPECIFIED = 0;
  HUMAN = 1;
  GUARDIAN = 2;
  CHILD = 3;
  STAFF = 4;
  MODEL = 5;   // can NEVER fill authorized_human / be an override approver
  SYSTEM = 6;  // can NEVER fill authorized_human / be an override approver
}
message ActorRef {
  string ref = 1;         // stable pseudonymous handle, e.g. "actor_pseudo_7c1f"
  ActorClass class = 2;
  string role = 3;        // e.g. "guide", "guardian", "learner" — used by OPA authorization
}
```

### Envelope (`envelope.proto`)

The common traceability header on **every** contract (FR-001; FOUNDATION_PRD §7.1).

| Field (tag) | Type | Notes |
|---|---|---|
| `contract_id` (1) | string | unique id (ULID-shaped); dedup + append-only key |
| `schema_version` (2) | string | e.g. `"learner_event/1"`; DP-4 |
| `tenant_id` (3) | string | tenant scope; present in every header |
| `actor_ref` (4) | `ActorRef` | who/what produced the record |
| `occurred_at` (5) | `google.protobuf.Timestamp` | event time — MUST differ from `recorded_at` |
| `recorded_at` (6) | `google.protobuf.Timestamp` | ingest time |
| `correlation_id` (7) | string | ties a command's events together |
| `causation_id` (8) | string | id of the causing record (append-only correction link) |
| `consent_purpose` (9) | string | binds the action to the consent that permitted it |
| `policy_version` (10) | string | binds the action to the policy that allowed it |
| `model_version` (11) | string | optional; set only when a model produced evidence (empty ⇒ unset) |
| `evidence_refs` (12) | repeated string | references (never raw payloads) to the evidence |

**Validation** (`platform.ValidateEnvelope`): all fields non-empty except `model_version` (optional) and
`evidence_refs` (may be empty/nil but the field exists); `actor_ref` non-nil; `occurred_at`/`recorded_at`
non-nil and valid. Missing/empty required field ⇒ `*NamedFieldError{Field: name}` (SC-002; G-ENV).

### LearnerEvent (`learner_event.proto`)

Immutable domain event (FR-002; FOUNDATION_PRD §7.2). Carries `Envelope header = 1`.

| Field | Type | Notes |
|---|---|---|
| `header` | `Envelope` | |
| `event_type` | string | |
| `learner_ref` | string | pseudonymous |
| `source` | string | producing service/component |
| `context` | `EventContext{ session_ref; cohort_ref; project_ref }` | all optional |
| `payload_schema` | string | ref to the payload's schema (payload out of scope) |
| `evidence_refs` | repeated string | event-level convenience (also in header) |

**Invariants**: immutable + idempotent (dedup by `header.contract_id`); `occurred_at`/`recorded_at` distinct.

### ConsentGrant + WithdrawalState (`consent.proto`)

Consent as a **mechanism** (FR-003; FOUNDATION_PRD §7.2, §10.2). Carries `Envelope header`.

| Field | Type | Notes |
|---|---|---|
| `header` | `Envelope` | |
| `subject_ref` | string | pseudonymous learner/subject |
| `guardian_authority` | bool | whether a guardian granted it |
| `purpose` | string | matched by authorization |
| `data_categories` | repeated string | |
| `processors` | repeated string | |
| `jurisdiction` | string | must agree with request jurisdiction (FR-008) |
| `effective_at` | Timestamp | window start |
| `expiry_at` | Timestamp | window end (unset = no expiry) |
| `collection_method` | string | |
| `document_hash` | string | **stub** placeholder (FR-015) |
| `withdrawal_state` | `WithdrawalState{ bool withdrawn; Timestamp withdrawn_at }` | immediate |

**Rule** `IsConsentActive(grant, at)`: `!withdrawal_state.withdrawn && at >= effective_at &&
(expiry_at == nil || at < expiry_at)`. Data may be used **only for an active matching purpose** (FR-003).

### AssentRecord + AssentResponse (`assent.proto`)

Child assent as a **veto mechanism** (FR-004; Constitution II). Carries `Envelope header`.

```proto
enum AssentResponse { ASSENT_RESPONSE_UNSPECIFIED = 0; ASSENT = 1; REFUSAL = 2; DISSENT = 3; }
```

| Field | Type | Notes |
|---|---|---|
| `header` | `Envelope` | |
| `child_ref` | string | pseudonymous |
| `age_band` | string | |
| `notice_version` | string | plain-language notice shown |
| `choices_shown` | repeated string | |
| `response` | `AssentResponse` | refusal/dissent are honorable |
| `facilitator` | `ActorRef` | staff who recorded it |
| `recorded_at` | Timestamp | |
| `renewal_at` | Timestamp | optional |
| `honorable` | bool | whether this collection can honor a refusal |

**Rule** `AssentBlocks(r)`: `r.honorable && r.response != ASSENT` — guardian consent cannot substitute
(FR-004, SC-007; G-ASSENT).

### DecisionRecord (`decision.proto`)

The human-owned consequential decision (FR-005; Constitution I). Carries `Envelope header`.

| Field | Type | Notes |
|---|---|---|
| `header` | `Envelope` | |
| `decision_type` | string | |
| `subject_ref` | string | pseudonymous |
| `candidates` | repeated string | candidates considered |
| `outcome` | string | |
| `reason_codes` | repeated string | |
| `evidence_snapshot` | repeated string | evidence refs at decision time |
| `uncertainty` | double | optional (0 = unset by convention) |
| `policy_version` | string | REQUIRED (also in header) — the policy result |
| `model_version` | string | advisory only |
| `authorized_human` | `ActorRef` | REQUIRED; `class` MUST NOT be `MODEL`/`SYSTEM` |
| `effective_at` | Timestamp | |
| `consequential` | bool | if true, human + policy result are mandatory |

**Invariants** (`platform.ValidateDecisionRecord`):
- `consequential == true` ⇒ `authorized_human != nil` **and** `policy_version != ""`.
- `authorized_human.class ∈ {HUMAN, GUARDIAN, CHILD, STAFF}` — **never** `MODEL`/`SYSTEM`
  (`*AuthorityForgeryError{Field:"authorized_human"}`; SC-003; G-DEC). Mirrored in OPA
  (`gt100k.authz.deny_authority_forgery`).
- Append-only: the store rejects a re-written `contract_id` (`AssertAppendOnly`).

### OverrideRecord (`override.proto`)

Human-authorized supersession (FR-017; Constitution I/IX). Carries `Envelope header`. **In scope.**

| Field | Type | Notes |
|---|---|---|
| `header` | `Envelope` | `causation_id` MUST reference `target_decision` |
| `target_decision` | string | `contract_id` of the prior `DecisionRecord` |
| `override_class` | string | four listed classes require four-eyes (DP-3) |
| `prior_outcome` | string | superseded outcome |
| `new_outcome` | string | replacing outcome |
| `authorized_role` | string | role empowered to override |
| `rationale` | string | |
| `evidence_refs` | repeated string | references only |
| `approvers` | repeated `ActorRef` | four-eyes classes need ≥2 **distinct** non-model/system refs |
| `review_at` | Timestamp | expiry or review date |

**Invariants** (`platform.ValidateOverrideRecord`):
- Envelope complete; `target_decision`, `prior_outcome`, `new_outcome`, `authorized_role`, `rationale`,
  `review_at` present.
- `override_class ∈ {admissions, public_exposure, safeguarding, credential_revocation}` ⇒
  `AssertFourEyes(approvers)` — **≥2 approvers, all distinct `ref`, none `MODEL`/`SYSTEM`**
  (model/system ⇒ `*AuthorityForgeryError{Field:"approvers"}`; `<2` distinct ⇒ `*FourEyesError`; SC-008;
  G-OVR). A non-listed class requires exactly one named human approver.
- **Preserves the original**: a new record; target never mutated (append-only). `header.causation_id ==
  target_decision`. Mirrored in OPA (`gt100k.override.deny`).

### Appeal + AppealStatus (`appeal.proto`)

Appeal against a prior decision (FR-018; Constitution I). Carries `Envelope header`. **In scope.**

```proto
enum AppealStatus { APPEAL_STATUS_UNSPECIFIED = 0; FILED = 1; UNDER_REVIEW = 2; RESOLVED = 3; REOPENED = 4; LATE = 5; }
```

| Field | Type | Notes |
|---|---|---|
| `header` | `Envelope` | |
| `appellant_role` | string | |
| `target_decision` | string | `contract_id` of the appealed `DecisionRecord` |
| `grounds` | string | |
| `submitted_evidence_refs` | repeated string | references only |
| `requested_remedy` | string | |
| `status` | `AppealStatus` | lifecycle status |
| `independent_reviewer` | `ActorRef` | MUST NOT be the target's `authorized_human` |
| `deadlines` | `Deadlines{ Timestamp respond_by }` | |
| `resolution` | string | empty until resolved |

**Invariants** (`platform.ValidateAppeal(appeal, authorizedHumanRef)`):
- Envelope complete; `appellant_role`, `target_decision`, `grounds`, `requested_remedy` present;
  `status != APPEAL_STATUS_UNSPECIFIED` (else `*NamedFieldError{Field:"status"}`).
- `AssertReviewerIndependent(independent_reviewer, authorizedHumanRef)` — reviewer `ref` **must differ**
  from the target's `authorized_human.ref` (`*ReviewerConflictError{Field:"independent_reviewer"}`; SC-009;
  G-APL).
- Filing does not mutate the target (append-only) and never reduces access (validator is side-effect-free).

### AuditEntry (`audit.proto`)

Append-only audit record (FR-011). Carries `Envelope header`.

| Field | Type | Notes |
|---|---|---|
| `entry_id` | string | |
| `header` | `Envelope` | full envelope of the audited action |
| `actor_ref` | `ActorRef` | |
| `action` | string | `"decision"`, `"override"`, `"appeal_filed"`, `"consent_withdrawn"`, `"policy_deny"`, `"deletion"` |
| `policy_allow` | bool | policy result (nullable via a wrapper or default) |
| `policy_reason` | string | |
| `policy_version` | string | |
| `outcome` | string | |

**Invariant**: append-only + tenant-scoped; supports replay by carrying the policy/evidence version of the
time. (`policy_*` fields flatten the policy decision to keep the message simple.)

### EligibleLearner + Track (`enrollment.proto`)

Synthetic handoff output (FR-013; FOUNDATION_PRD §7.3, §10.4; DP-1).

```proto
enum Track { TRACK_UNSPECIFIED = 0; TRACK_A = 1; TRACK_B = 2; }
message EligibleLearner {
  string learner_ref = 1;               // pseudonymous
  string accommodation_profile_ref = 2; // reference only, never raw data
  string eligibility_evidence_ref = 3;  // reference only — never raw responses/CogAT items
  Track track = 4;
}
```

---

## Go invariants + error types (`pkg/platform/invariants.go`)

```go
type NamedFieldError      struct{ Field string } // missing/empty required field
type AuthorityForgeryError struct{ Field string } // MODEL/SYSTEM where a human is required
type AppendOnlyError      struct{ ContractID string }
type FourEyesError        struct{ Have int }      // < 2 distinct human approvers
type ReviewerConflictError struct{ Field string } // reviewer == authorized_human

func AssertEnvelopeComplete(h *platformv1.Envelope) error
func AssertHumanAuthority(a *platformv1.ActorRef) error        // MODEL/SYSTEM ⇒ AuthorityForgeryError
func AssertAppendOnly(existing map[string]bool, id string) error
func AssertFourEyes(approvers []*platformv1.ActorRef) error    // model/system ⇒ forgery; <2 distinct ⇒ FourEyes
func AssertReviewerIndependent(reviewer *platformv1.ActorRef, authorizedHumanRef string) error
```

All errors implement `error` (`Error()`); tests assert with `errors.As`.

### Clock / IDGenerator (`pkg/platform/clock.go`) — injected (FR-016)

```go
type Clock interface { Now() time.Time }          // no wall-clock read in the core
type IDGenerator interface { Next() string }       // deterministic ids in tests ("cid_0001", ...)
```

---

## OPA policy I/O (`policies/`)

### Authorization input / decision (`gt100k.authz`)

```jsonc
// input document (built by the Go edge in services/identity-consent/authz.go)
{
  "actor":    { "ref": "...", "class": "STAFF", "role": "guide" },
  "purpose":  "onboarding.schedule",
  "jurisdiction": "US-CA",
  "at":       "2026-07-20T14:03:11Z",
  "policy_version": "opa-bundle/2026-07-20a",
  "consents": [ { "purpose": "...", "jurisdiction": "...", "active": true } ]  // pre-filtered actives
}
```

`data.gt100k.authz.decision` → `{ "allow": bool, "reason": string, "policy_version": string }` with the
fixed precedence in [spec.md → G-AUTH](./spec.md#g-auth--authorization-decisions):
`no_active_consent → jurisdiction_mismatch → deny_by_default → allow`. The Go edge may pass raw consents +
`at` and let Rego compute `active`, or pre-filter in Go and pass `active` — **decision:** pre-filter actives
in Go (`IsConsentActive`) so the "active" rule has one home; Rego decides purpose/jurisdiction/rule match.

### Override / Appeal deny rules

- `data.gt100k.override.deny[reason]` — fires when an approver `class ∈ {MODEL, SYSTEM}` or a four-eyes
  class has `< 2` distinct approver `ref`s (mirrors G-OVR).
- `data.gt100k.appeal.deny[reason]` — fires when `input.independent_reviewer.ref ==
  input.authorized_human_ref` (mirrors G-APL).

---

## Spine interfaces (`pkg/spine/ports.go`) — implemented by adapters, injected

```go
// Persistence (append-only where noted)
type ConsentRepository interface {
	Put(ctx context.Context, g *platformv1.ConsentGrant) error                 // append-only
	ActiveForSubject(ctx context.Context, subjectRef string, at time.Time) ([]*platformv1.ConsentGrant, error)
	Withdraw(ctx context.Context, contractID string, at time.Time) error
}
type AssentRepository   interface { Put(ctx, *AssentRecord) error; ForChild(ctx, childRef string) ([]*AssentRecord, error) }
type IdentityRepository interface { // pseudonymous only (FR-012)
	ResolveActor(ctx, sessionRef string) (*platformv1.ActorRef, error)
	Provision(ctx, *platformv1.EligibleLearner) (*platformv1.ActorRef, error)
}
type DecisionRepository interface { Append(ctx, *DecisionRecord) error; Get(ctx, contractID string) (*DecisionRecord, error) }
type OverrideRepository interface { Append(ctx, *OverrideRecord) error; ForDecision(ctx, target string) ([]*OverrideRecord, error) }
type AppealRepository   interface { Append(ctx, *Appeal) error; ForDecision(ctx, target string) ([]*Appeal, error) }
type AuditLog           interface { Append(ctx, *AuditEntry) error; All(ctx) ([]*AuditEntry, error) } // append-only

// Transactional outbox (atomic commit; FR-009)
type OutboxStore interface {
	Commit(ctx context.Context, uow *UnitOfWork) error   // ONE tx: decision + outbox rows + audit (all or nothing)
	Pending(ctx context.Context) ([]*OutboxRow, error)
	MarkRelayed(ctx context.Context, idempotencyKey string) error
}
type UnitOfWork struct {
	Decision *DecisionRecord
	Events   []*platformv1.LearnerEvent
	Outbox   []*OutboxRow
	Audit    []*AuditEntry
}
type OutboxRow struct { IdempotencyKey string; Event *platformv1.LearnerEvent; Relayed bool; StagedAt time.Time }

// Event spine (fake → franz-go/Redpanda; FR-009/010)
type EventBus        interface { Publish(ctx, *platformv1.LearnerEvent) error; Subscribe(Consumer) }
type ConsumerOffsets interface { Seen(ctx, contractID string) (bool, error); Mark(ctx, contractID string) error }

// Authorization edge (OPA Go SDK; FR-007)
type Authorizer interface { Authorize(ctx context.Context, in PolicyInput) (PolicyDecision, error) }
type PolicyDecision struct { Allow bool; Reason string; PolicyVersion string }

// Enrollment + deletion (FR-013/014)
type EnrollmentHandoffSource interface { Next(ctx) (*platformv1.EligibleLearner, error) }
type DeletionStarter         interface { Start(ctx, subjectRef string) error } // starts the Temporal workflow (once)
```

Adapters provided in this slice (all in-memory/stub for the default lane; testcontainers for integration):

```text
in-memory fakes (default go test)  -> Consent/Assent/Identity/Decision/Override/Appeal repos,
                                      AuditLog, OutboxStore, EventBus, ConsumerOffsets, DeletionStarter (records the call)
services/identity-consent/authz.go -> Authorizer over the OPA Go SDK + compiled bundle
adapters (integration, -tags)      -> OutboxStore/DecisionRepository over pgx+PostgreSQL, EventBus over franz-go+Redpanda
```

---

## Temporal deletion workflow (`workflows/deletion`)

- `DeletionWorkflow(ctx workflow.Context, subjectRef string) error` — deterministic; reads time via
  `workflow.Now`, ids via `workflow.SideEffect`.
- Activities (idempotent, retryable with compensation): `ErasePostgres`, `DeleteS3Objects`, `ClearRedis`,
  `CryptoShred` (**KMS stub**, DP-6), `RecordDeletionAudit` (preserves the append-only fact).
- Proof: `testsuite.TestWorkflowEnvironment` runs it to `Completed` (G-WD); an injected `CryptoShred`
  failure triggers Temporal retry/compensation to completion; the started-once property is asserted at the
  `DeletionStarter` seam in the consent service test.

---

## State transitions

### Consent lifecycle

```text
(none) --Grant--> ACTIVE  (IsConsentActive within [effective_at, expiry_at))
ACTIVE --expiry reached--> INACTIVE (time-based, no event)
ACTIVE --Withdraw--> WITHDRAWN (blocks new processing; DeletionStarter.Start once; audit "consent_withdrawn")
WITHDRAWN --Temporal DeletionWorkflow--> ERASED (activities idempotent + compensating; audit "deletion")
```

### Command through the outbox (US3)

```text
ResolveActor (pseudonymous) --> ActiveForSubject --> Authorize (OPA: allow/deny, policy_version)
  deny  --> AuditLog.Append(policy_deny); return {denied:true}
  allow --> OutboxStore.Commit(UnitOfWork{DecisionRecord + LearnerEvent outbox row + audit}) ATOMICALLY
        --> Relay publishes pending rows (idempotency_key) AT-LEAST-ONCE; MarkRelayed
        --> Deliver: Seen(contract_id)? yes -> skip (dedup) ; no -> apply projection + Mark
```

- Partial commit impossible: `OutboxStore.Commit` persists all rows or none in one tx (FR-009).
- Re-delivery of a `contract_id` is a consumer no-op (FR-010, SC-005).
- Withdrawal after the fact blocks *new* processing; the audit fact is preserved (SC-006).
