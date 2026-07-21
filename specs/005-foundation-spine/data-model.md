# Phase 1 Data Model: Platform Foundation Spine

All identifiers are **pseudonymous**; no real PII (Constitution V; synthetic-only). All legal artifacts
(document hash, signature) are **placeholder strings** (FR-015). Types are the TypeScript shapes the two
packages expose; the production Protobuf/JSON registry (parent §28) is the deferred wire form of the
same fields.

## Package split

- `packages/platform-contracts` — envelope + **six** contracts + validators + invariants (dependency-free).
- `packages/platform-spine` — identity/consent/assent domain, authorization predicate, event-bus +
  outbox logic, ports (depends on `platform-contracts`).

---

## Contracts (`packages/platform-contracts`)

### ActorRef

The pseudonymous actor reference downstream logic receives instead of legal identity (FR-012). Its
`class` is what enforces authority invariants (FR-005).

| Field | Type | Notes |
|---|---|---|
| `ref` | string | stable pseudonymous handle, e.g. `"actor_pseudo_7c1f"` |
| `class` | `"human" \| "guardian" \| "child" \| "staff" \| "model" \| "system"` | `model`/`system` can never fill `authorized_human` |
| `role` | string | e.g. `"guide"`, `"guardian"`, `"learner"` — used by the authorization predicate |

### EnvelopeHeader

The common traceability header on **every** contract (FR-001; FOUNDATION_PRD §7.1).

| Field | Type | Notes |
|---|---|---|
| `contract_id` | string | unique id (ULID-shaped); dedup + append-only key |
| `schema_version` | string | e.g. `"learner_event/1"`; selects the validator (FR-006) |
| `tenant_id` | string | tenant scope; present in every header |
| `actor_ref` | `ActorRef` | who/what produced the record |
| `occurred_at` | ISO timestamp | event time — MUST differ conceptually from `recorded_at` |
| `recorded_at` | ISO timestamp | ingest time |
| `correlation_id` | string | ties a command's events together |
| `causation_id` | string | id of the record that caused this one (append-only correction link) |
| `consent_purpose` | string | binds the action to the consent that permitted it |
| `policy_version` | string | binds the action to the policy that allowed it |
| `model_version` | string \| null | present only when a model produced evidence |
| `evidence_refs` | string[] | references (never raw payloads) to the evidence behind the action |

**Validation** (`validateEnvelope`): all fields present and non-empty except `model_version`
(nullable) and `evidence_refs` (may be empty array but must exist); `occurred_at`/`recorded_at` parse
as timestamps. Missing/empty required field ⇒ error naming the field (SC-001).

### LearnerEvent

The immutable domain event (FR-002; FOUNDATION_PRD §7.2). Carries an `EnvelopeHeader`.

| Field | Type | Notes |
|---|---|---|
| `header` | `EnvelopeHeader` | |
| `event_type` | string | |
| `learner_ref` | string | pseudonymous |
| `source` | string | producing service/component |
| `context` | `{ session_ref?: string; cohort_ref?: string; project_ref?: string }` | |
| `payload_schema` | string | ref to the payload's schema (payload itself out of scope) |
| `evidence_refs` | string[] | (also in header; event-level convenience) |

**Invariants**: immutable + idempotent (dedup by `header.contract_id`); `occurred_at` and `recorded_at`
remain distinct.

### ConsentGrant

Consent as a **mechanism** (FR-003; FOUNDATION_PRD §7.2, §10.2). Carries an `EnvelopeHeader`.

| Field | Type | Notes |
|---|---|---|
| `header` | `EnvelopeHeader` | |
| `subject_ref` | string | pseudonymous learner/subject |
| `guardian_authority` | boolean | whether a guardian granted it |
| `purpose` | string | the consent purpose (matched by authorization) |
| `data_categories` | string[] | |
| `processors` | string[] | |
| `jurisdiction` | string | must agree with request jurisdiction (FR-008) |
| `effective_at` | ISO timestamp | window start |
| `expiry_at` | ISO timestamp \| null | window end (null = no expiry) |
| `collection_method` | string | |
| `document_hash` | string | **stub** placeholder (FR-015) |
| `withdrawal_state` | `{ withdrawn: boolean; withdrawn_at?: string }` | withdrawal is immediate |

**Rule** `isActive(consent, at)`: `withdrawal_state.withdrawn === false` **and** `at >= effective_at`
**and** (`expiry_at === null` **or** `at < expiry_at`). Data may be used **only for an active matching
purpose** (FR-003).

### AssentRecord

Child assent as a **veto mechanism** (FR-004; Constitution II; FOUNDATION_PRD §7.2, §10.2). Carries an
`EnvelopeHeader`.

| Field | Type | Notes |
|---|---|---|
| `header` | `EnvelopeHeader` | |
| `child_ref` | string | pseudonymous |
| `age_band` | string | |
| `notice_version` | string | plain-language notice shown |
| `choices_shown` | string[] | |
| `response` | `"assent" \| "refusal" \| "dissent"` | refusal/dissent are honorable |
| `facilitator` | `ActorRef` | staff who recorded it |
| `recorded_at` | ISO timestamp | |
| `renewal_at` | ISO timestamp \| null | |
| `honorable` | boolean | whether this collection can honor a refusal |

**Rule** `assentBlocks(assent)`: returns `true` when `honorable === true` **and** `response !==
"assent"` — guardian consent cannot substitute (FR-004, SC-006).

### DecisionRecord

The human-owned consequential decision (FR-005; Constitution I; FOUNDATION_PRD §7.2). Carries an
`EnvelopeHeader`.

| Field | Type | Notes |
|---|---|---|
| `header` | `EnvelopeHeader` | |
| `decision_type` | string | |
| `subject_ref` | string | pseudonymous |
| `candidates` | string[] | candidates considered |
| `outcome` | string | |
| `reason_codes` | string[] | |
| `evidence_snapshot` | string[] | evidence references at decision time |
| `uncertainty` | number \| null | |
| `policy_version` | string | REQUIRED (in header too) — the policy result |
| `model_version` | string \| null | advisory only |
| `authorized_human` | `ActorRef` | REQUIRED; `class` MUST NOT be `model`/`system` |
| `effective_at` | ISO timestamp | |
| `consequential` | boolean | if true, human + policy result are mandatory |

**Invariants** (`validateDecisionRecord`):
- `consequential === true` ⇒ `authorized_human` present **and** `policy_version` non-empty.
- `authorized_human.class` ∈ {`human`,`guardian`,`child`,`staff`} — **never** `model`/`system`
  (authority forgery ⇒ error; SC-002).
- Append-only: enforced by the store rejecting a re-written `contract_id` (see `assertAppendOnly`).

### OverrideRecord

The human-authorized supersession of a prior decision (FR-017; Constitution I/IX; parent §28,
FOUNDATION_PRD §7.2). Carries an `EnvelopeHeader`. **In scope for this slice.**

| Field | Type | Notes |
|---|---|---|
| `header` | `EnvelopeHeader` | `causation_id` MUST reference `target_decision` |
| `target_decision` | string | `contract_id` of the prior `DecisionRecord` being overridden |
| `override_class` | `"admissions" \| "public_exposure" \| "safeguarding" \| "credential_revocation" \| string` | the four listed classes require four-eyes (DP-3) |
| `prior_outcome` | string | the outcome being superseded |
| `new_outcome` | string | the replacing outcome |
| `authorized_role` | string | the role empowered to override |
| `rationale` | string | why the override was made |
| `evidence_refs` | string[] | references (never raw payloads) |
| `approvers` | `ActorRef[]` | approver set; four-eyes classes need ≥2 **distinct** human/staff/guardian refs |
| `review_at` | ISO timestamp | expiry or review date |

**Invariants** (`validateOverrideRecord`):
- Envelope complete; `target_decision`, `prior_outcome`, `new_outcome`, `authorized_role`, `rationale`,
  `review_at` present.
- If `override_class` ∈ {`admissions`,`public_exposure`,`safeguarding`,`credential_revocation`}:
  `assertFourEyes(approvers)` — **≥2 approvers, all distinct `ref`, none `model`/`system`** (a model/system
  approver ⇒ `AuthorityForgeryError`; fewer than two distinct ⇒ `FourEyesError`; SC-008).
- **Preserves the original**: an override is a new record; the target `DecisionRecord` is never mutated
  (append-only). `header.causation_id === target_decision`.

### Appeal

An appeal against a prior decision (FR-018; Constitution I; parent §28, FOUNDATION_PRD §7.2). Carries an
`EnvelopeHeader`. **In scope for this slice.**

| Field | Type | Notes |
|---|---|---|
| `header` | `EnvelopeHeader` | |
| `appellant_role` | string | who is appealing |
| `target_decision` | string | `contract_id` of the appealed `DecisionRecord` |
| `grounds` | string | basis of the appeal |
| `submitted_evidence_refs` | string[] | references only |
| `requested_remedy` | string | the remedy sought |
| `status` | `"filed" \| "under_review" \| "resolved" \| "reopened" \| "late"` | lifecycle status |
| `independent_reviewer` | `ActorRef` | MUST NOT be the target decision's `authorized_human` |
| `deadlines` | `{ respond_by: string }` | ISO timestamp(s) |
| `resolution` | string \| null | null until resolved |

**Invariants** (`validateAppeal`):
- Envelope complete; `appellant_role`, `target_decision`, `grounds`, `requested_remedy` present;
  `status` ∈ the enum (else `NamedFieldError` on `status`).
- `assertReviewerIndependent(independent_reviewer, authorizedHumanRef)` — reviewer `ref` **must differ**
  from the target decision's `authorized_human.ref` (else `ReviewerConflictError`; SC-009).
- Filing does not mutate the target decision (append-only) and never reduces access (modeled: validator is
  side-effect-free; the filing writes only its own record + an audit entry).

### Shared invariants (`invariants.ts`)

- `assertAppendOnly(existingIds: Set<string>, contract_id)` — throws `AppendOnlyError` if `contract_id`
  already recorded.
- `assertHumanAuthority(actor: ActorRef)` — throws `AuthorityForgeryError` if `actor.class` is
  `model`/`system` (used by `DecisionRecord`).
- `assertFourEyes(approvers: ActorRef[])` — throws `AuthorityForgeryError` if any approver is
  `model`/`system`, or `FourEyesError` if fewer than two **distinct** approver `ref`s (used by
  `OverrideRecord` for four-eyes classes).
- `assertReviewerIndependent(reviewer: ActorRef, authorizedHumanRef: string)` — throws
  `ReviewerConflictError` if `reviewer.ref === authorizedHumanRef` (used by `Appeal`).
- `assertEnvelopeComplete(header)` — the envelope validator (FR-001).

### Deferred (noted, not modeled here)

The `OverrideRecord`/`Appeal` **human workflows** (four-eyes approval routing/notifications, appeal SLA
timers, remedy execution) are deferred; the **contract shapes + invariants above are in scope**. Real
crypto-shred deletion and Protobuf/JSON wire generation remain deferred (see [plan.md](./plan.md)).

---

## Spine domain + ports (`packages/platform-spine`)

### PolicyRule / PolicySet

The data-driven allow-list the authorization predicate reads (the local OPA analogue; FR-007).

| Type | Shape | Notes |
|---|---|---|
| `PolicyRule` | `{ role: string; purpose: string; jurisdictions: string[] }` | an explicit allow |
| `PolicySet` | `{ policy_version: string; rules: PolicyRule[] }` | versioned; anything not matched is denied |

### AuthorizationRequest / PolicyDecision

| Type | Shape | Notes |
|---|---|---|
| `AuthorizationRequest` | `{ actor: ActorRef; purpose: string; jurisdiction: string; subject_ref: string; at: string }` | |
| `PolicyDecision` | `{ allow: boolean; reason: string; policy_version: string }` | always returns `policy_version` (FR-007) |

**Rule** `authorize(request, consents, policySet) -> PolicyDecision`:
1. Find an active matching `ConsentGrant` (`isActive` + purpose match + jurisdiction match). None ⇒
   `deny` (reason `no_active_consent` or `jurisdiction_mismatch`).
2. Find a `PolicyRule` matching `actor.role` + `purpose` + jurisdiction. None ⇒ `deny`
   (reason `deny_by_default`).
3. Otherwise `allow`. Every path returns `policySet.policy_version` (SC-003).

### OutboxRow

A staged, not-yet-relayed event (FR-009).

| Field | Type | Notes |
|---|---|---|
| `idempotency_key` | string | usually the event's `contract_id` |
| `event` | `LearnerEvent` | the payload to publish |
| `relayed` | boolean | relay state |
| `staged_at` | ISO timestamp | |

### UnitOfWork (staging result)

The atomic bundle a command commits (FR-009): `{ decision?: DecisionRecord; events: LearnerEvent[];
outbox: OutboxRow[]; audit: AuditEntry[] }` — the store persists all-or-nothing.

### AuditEntry

Append-only audit record (FR-011).

| Field | Type | Notes |
|---|---|---|
| `entry_id` | string | |
| `header` | `EnvelopeHeader` | full envelope of the audited action |
| `actor_ref` | `ActorRef` | |
| `action` | string | e.g. `"decision"`, `"override"`, `"appeal_filed"`, `"consent_withdrawn"`, `"policy_deny"` |
| `policy_result` | `PolicyDecision \| null` | |
| `outcome` | string | |

**Invariant**: append-only + tenant-scoped; supports replay by carrying the policy/evidence version of
the time.

### EligibleLearner (enrollment stub)

The synthetic handoff output (FR-013; FOUNDATION_PRD §7.3, §10.4).

| Field | Type | Notes |
|---|---|---|
| `learner_ref` | string | pseudonymous |
| `accommodation_profile_ref` | string | **reference only**, never raw data |
| `eligibility_evidence_ref` | string | reference only — never raw responses/CogAT items |
| `track` | `"A" \| "B"` | Track A / Track B eligibility determination |

### Ports (implemented by adapters, injected)

```text
Clock { now(): string }                                  // injected — no wall-clock in core
IdGenerator { next(): string }                           // injected — deterministic ids in tests

ConsentRepository {
  put(grant): Promise<void>                              // append-only (assertAppendOnly)
  activeForSubject(subject_ref, at): Promise<ConsentGrant[]>
  withdraw(contract_id, at): Promise<void>               // sets withdrawal_state
}
AssentRepository { put(record): Promise<void>; forChild(child_ref): Promise<AssentRecord[]> }
IdentityRepository {                                     // pseudonymous only (FR-012)
  resolveActor(session_ref): Promise<ActorRef | null>
  provision(learner: EligibleLearner): Promise<ActorRef>
}
DecisionRepository { append(record): Promise<void>; get(contract_id): Promise<DecisionRecord | null> }
OverrideRepository { append(record): Promise<void>; forDecision(target_decision): Promise<OverrideRecord[]> } // append-only
AppealRepository { append(record): Promise<void>; forDecision(target_decision): Promise<Appeal[]> }           // append-only
AuditLog { append(entry): Promise<void>; all(): Promise<AuditEntry[]> }   // append-only
OutboxStore {
  stage(rows): Promise<void>                             // atomic with decision/audit in a UnitOfWork
  pending(): Promise<OutboxRow[]>
  markRelayed(idempotency_key): Promise<void>
}
EventBus { publish(event): Promise<void>; subscribe(consumer): void }     // in-process spine
ConsumerOffsets { seen(contract_id): Promise<boolean>; mark(contract_id): Promise<void> } // dedup

EnrollmentHandoffSource { next(): Promise<EligibleLearner | null> }       // stubbed admissions handoff
DeletionWorkflow { requestDeletion(subject_ref): Promise<void> }         // STUB ONLY (deferred, FR-014)
```

---

## State transitions

### Consent lifecycle

```text
(none) --grant--> ACTIVE  (isActive within [effective_at, expiry_at))
ACTIVE --expiry reached--> INACTIVE (time-based, no event)
ACTIVE --withdraw--> WITHDRAWN (blocks new processing; enqueues DeletionWorkflow stub; audit entry)
```

### Command through the outbox (US3)

```text
resolve actor (pseudonymous) --> check active consent --> authorize (allow/deny, policy_version)
  deny  --> audit(policy_deny); stop
  allow --> stage { DecisionRecord + LearnerEvent outbox row + audit } ATOMICALLY
        --> relay publishes outbox row (idempotency_key) AT-LEAST-ONCE
        --> consumer: seen(contract_id)? yes -> skip (dedup) ; no -> apply projection + mark
```

- Partial commit is impossible: the `UnitOfWork` persists all rows or none (FR-009).
- Re-delivery of a `contract_id` is a consumer no-op (FR-010, SC-004).
- Withdrawal after the fact blocks *new* processing; the audit fact is preserved (SC-005).
