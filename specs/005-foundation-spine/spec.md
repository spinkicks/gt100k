# Feature Specification: Platform Foundation Spine

**Feature Branch**: `005-foundation-spine`

**Created**: 2026-07-20

**Status**: Draft

**Input**: Baby PRD [`docs/prd/FOUNDATION_PRD.md`](../../docs/prd/FOUNDATION_PRD.md) (the signed event + consent + policy + audit substrate), scoped from [`PRD.md`](../../docs/prd/PRD.md) §26–§28, §30, §32.1. Buildable slice: "A code-first, locally-testable TypeScript reference of the platform spine's core logic — the versioned contract envelope and the `LearnerEvent` / `ConsentGrant` / `AssentRecord` / `DecisionRecord` contracts with their invariants, an in-process event spine + transactional outbox, a pseudonymous identity / consent / assent domain, and a deterministic purpose-authorization policy decision. The production stack (Go services, Redpanda, Temporal, real OPA/Rego, PostgreSQL, AWS/Terraform) is the deferred production target; this slice proves the substrate's mechanics with pure domain packages + in-memory adapters. Synthetic learners only; the legal/consent layer is modeled mechanically and stubbed."

## Why this feature is first

The parent PRD is explicit: *"The team implements `LearnerEvent`, consent, decision, override, appeal, and audit contracts first because all later work depends on them"* (parent §32.1). Every later domain service emits these contracts onto this spine and reads policy from it. If the spine is wrong, every feature above it inherits the defect. This slice builds and proves the **core logic of that substrate** in TypeScript — the part whose correctness is a matter of rules, not infrastructure — so the invariants are locked before any consumer or the production runtime is layered on.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emit a traceable, invariant-enforced contract (Priority: P1) 🎯 MVP

Any consequential action produces a versioned contract that carries the **common envelope header** (so it traces to the consent that permitted it, the policy that allowed it, the evidence behind it, the software version that produced it, and the person accountable) and satisfies the contract's invariants. A builder can construct a `LearnerEvent`, `ConsentGrant`, `AssentRecord`, or `DecisionRecord`, validate it, and be certain a malformed or invariant-violating record is rejected — most importantly that **a model output can never fill `DecisionRecord.authorized_human`** and that a consequential `DecisionRecord` cannot be finalized without a named human and a policy result.

**Why this priority**: This is the atomic unit of the whole platform — "implement the contracts first" (parent §32.1). Nothing else (consent checks, authorization, the event spine, audit, deletion) has anything to bind to until the envelope and the four contracts exist and enforce their invariants. It is the smallest thing that is independently demonstrable and delivers the core "every action is traceable and no machine can decide" guarantee.

**Independent Test**: Construct each contract with a synthetic actor; assert a complete envelope validates and an incomplete one is rejected; assert a `DecisionRecord` with a `model` actor in `authorized_human` is rejected while one with a named human + policy result passes; assert distinct `occurred_at` / `recorded_at`.

**Acceptance Scenarios**:

1. **Given** a synthetic actor reference and purpose, **When** a `LearnerEvent` is built with a complete envelope header, **Then** validation passes and the record exposes `consent_purpose`, `policy_version`, `evidence_refs`, `schema_version`, `correlation_id`/`causation_id`, and distinct `occurred_at`/`recorded_at`.
2. **Given** a `DecisionRecord` whose `authorized_human` is a `model`-class actor, **When** it is validated, **Then** validation **fails** with an authority-forgery error, and no code path allows a model to fill that field.
3. **Given** a consequential `DecisionRecord` missing either `authorized_human` or a policy result, **When** it is validated, **Then** validation fails; supplying both a named human and a policy result makes it pass.
4. **Given** any contract with a missing or empty required envelope field (e.g. `consent_purpose`, `policy_version`, `actor_ref`, `schema_version`), **When** it is validated, **Then** validation fails and names the missing field.

### User Story 2 - Grant/withdraw consent, honor child assent, and authorize by purpose (Priority: P2)

The Identity & Consent domain resolves a **pseudonymous actor reference** (downstream never sees legal identity), records `ConsentGrant`s with a purpose, jurisdiction, expiry, and withdrawal state, and records `AssentRecord`s where a **child's refusal is honorable and guardian consent cannot override it**. A deterministic **purpose-authorization predicate** (the local OPA analogue) then decides `allow`/`deny` for a command by role + purpose + active consent + jurisdiction, **deny-by-default**, returning the `policy_version` that decided it. Withdrawing consent **blocks new processing** for that purpose.

**Why this priority**: This is the gate's consent + authority core (parent §17.2, §17.4, §17.5). It depends on the contracts (US1) but is the first slice that shows the "an action is only permitted if consent and policy allow it, and a person — never a machine — is accountable" mechanic end-to-end as a decision, not just a record shape.

**Independent Test**: Grant a consent for a purpose, authorize a matching command (allow, with a policy version); withdraw it and authorize again (deny, recorded with policy version); attempt an unknown role/purpose (deny-by-default); record a child assent refusal against a present guardian consent and confirm the optional collection is blocked.

**Acceptance Scenarios**:

1. **Given** an active `ConsentGrant` for purpose P and jurisdiction J, **When** an actor with a permitted role requests purpose P in jurisdiction J, **Then** the predicate returns `allow` with a `policy_version`.
2. **Given** no active consent for purpose P (never granted, expired, or withdrawn), **When** purpose P is requested, **Then** the predicate returns `deny` with a reason and `policy_version`, and the deny is recorded.
3. **Given** a request whose role or purpose is unknown to the policy, **When** it is evaluated, **Then** the result is `deny` (deny-by-default), never a silent allow.
4. **Given** a `ConsentGrant` whose `jurisdiction` does not match the request's jurisdiction, **When** evaluated, **Then** the result is `deny` (residency mismatch).
5. **Given** a present guardian `ConsentGrant` for an optional purpose **and** a child `AssentRecord` recording refusal, **When** that optional collection is attempted, **Then** it is blocked — guardian consent does not substitute for child assent where refusal is honorable.
6. **Given** an active consent, **When** the guardian withdraws it, **Then** subsequent processing for that purpose is denied and a deletion-workflow request is enqueued (stub).

### User Story 3 - Move an event through the transactional outbox with idempotent consumers (Priority: P3)

A command writes its business state (e.g. a `DecisionRecord`) **and** an outbox row **atomically**, a relay publishes the resulting `LearnerEvent` to the in-process event spine with an **idempotency key**, and consumers update their own projection **exactly once** even under at-least-once delivery by **rejecting a duplicate `contract_id`** and preserving the first valid result. Every consequential action also writes an **append-only audit entry**.

**Why this priority**: This is the gate's traceability + durability mechanic (parent §17.3, §17.7, §9). It depends on the contracts (US1) and reuses the authorization from US2 on the command path. It proves the substrate's "no dual-write race, no double-apply, no acknowledged loss" property at slice scale, which every later producer/consumer relies on.

**Independent Test**: Run a command through the full path (resolve actor → check consent → authorize → write state + outbox row atomically → relay → consumer projection); replay the same `contract_id` several times and confirm the projection applies exactly once; simulate a relay retry and confirm no acknowledged loss; confirm an audit entry exists for the decision.

**Acceptance Scenarios**:

1. **Given** an authorized command, **When** it is handled, **Then** the `DecisionRecord` and its outbox row are committed together (both present or neither), and an audit entry is written.
2. **Given** a staged outbox row, **When** the relay publishes it and is retried (at-least-once), **Then** the consumer projection reflects the event **exactly once** (duplicate `contract_id` rejected, first result preserved).
3. **Given** a synthetic burst of N events, **When** they flow through outbox → bus → projection, **Then** every acknowledged event is reflected with **no loss** and no duplicate application.
4. **Given** a consumer that fails on an event, **When** the event is retried, **Then** processing is safe to repeat (idempotent) and the event is not lost.

### Edge Cases

- **Append-only**: a contract is immutable once recorded; a correction is a **new** record whose `causation_id` references the prior — never an in-place edit. The store rejects re-writing an existing `contract_id`.
- **Authority forgery**: no code path, including a "system" or "model" actor, can fill `DecisionRecord.authorized_human`; a consequential record with no policy result is invalid.
- **Consent timing**: consent that is expired or withdrawn is treated as *not active*; the active window is `[effective_at, expiry_at)` minus any withdrawal (withdrawal takes effect immediately).
- **Deny-by-default**: any role/purpose/jurisdiction combination not explicitly allowed by policy is denied; there is no fall-through allow.
- **Duplicate delivery**: re-delivering the same `contract_id` is a no-op at the consumer (dedup), and re-relaying an outbox row does not double-publish semantics downstream.
- **Withdrawal after processing**: withdrawal blocks *new* processing and enqueues deletion; already-written append-only audit entries that deletion *occurred* are preserved (real erasure is deferred — interface stub only).
- **Jurisdiction/residency**: a mismatch between a consent's `jurisdiction` and the request's jurisdiction denies, mirroring the production data-residency rule.
- **Synthetic legal layer**: consent/assent legal semantics are *modeled mechanically only*; document hashes, signatures, and legal validity are stubbed values, not real legal artifacts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define a versioned **common envelope header** carried by every contract, containing `contract_id`, `schema_version`, `tenant_id`, `actor_ref`, `occurred_at`, `recorded_at`, `correlation_id`, `causation_id`, `consent_purpose`, `policy_version`, optional `model_version`, and `evidence_refs`, and MUST provide a validator that rejects a record with any missing or empty required field (parent §28; FOUNDATION_PRD §7.1).
- **FR-002**: The system MUST provide a typed `LearnerEvent` schema + validator with `event_type`, pseudonymous `learner_ref`, distinct event/ingest time (`occurred_at`/`recorded_at`), source, context refs, payload-schema ref, and `evidence_refs`; consumers MUST treat it as immutable and idempotent (FOUNDATION_PRD §7.2).
- **FR-003**: The system MUST provide a typed `ConsentGrant` schema + validator with `subject_ref`, guardian authority, `purpose`, data categories, processors, `jurisdiction`, `effective_at`/`expiry_at`, collection method, document hash (stub), and `withdrawal_state`; and MUST expose an `isActive(consent, at)` rule such that data may be used **only for an active matching purpose** (FOUNDATION_PRD §7.2, §10.2).
- **FR-004**: The system MUST provide a typed `AssentRecord` schema + validator with `child_ref`, age band, notice version, choices shown, `response` (assent/refusal/dissent), facilitator, timestamp, renewal date; and MUST enforce that **guardian consent cannot substitute for child assent where a refusal is honorable** — a recorded refusal blocks the optional collection (Constitution II; FOUNDATION_PRD §7.2, §10.2).
- **FR-005**: The system MUST provide a typed `DecisionRecord` schema + validator with `decision_type`, subject, candidates, outcome, reason codes, evidence snapshot, uncertainty, policy + optional model versions, `authorized_human`, and effective time; and MUST enforce that a consequential record requires **both a named `authorized_human` and a policy result**, that records are **append-only**, and that **a model output cannot fill `authorized_human`** (Constitution I; parent §28; FOUNDATION_PRD §7.2).
- **FR-006**: Every contract MUST carry a `schema_version` string, and validation MUST be selected by that version, so new fields can be added under new versions while old readers keep working (models the Buf compatibility discipline; parent §28). No live wire-format generation is required in this slice.
- **FR-007**: The system MUST provide a deterministic **purpose-authorization predicate** (a local analogue of the production OPA/Rego decision) that returns `allow`/`deny` for a request by `role` + `purpose` + active `consent` + `jurisdiction`, is **deny-by-default**, and returns the `policy_version` that decided it (FOUNDATION_PRD §11; parent §27).
- **FR-008**: Authorization MUST **deny** when the consent's `jurisdiction` does not agree with the request's jurisdiction (data-residency rule; FOUNDATION_PRD §4.8, §11).
- **FR-009**: The system MUST provide a **transactional outbox** mechanism such that business state and an outbox row are staged **atomically** (both or neither), and a relay publishes each outbox row to the event spine with an **idempotency key**, delivering **at-least-once** (FOUNDATION_PRD §8, §9).
- **FR-010**: Event consumers MUST be **idempotent**: a duplicate `contract_id` MUST be rejected and the first valid result preserved, so at-least-once delivery causes no double application (FOUNDATION_PRD §9).
- **FR-011**: The system MUST maintain an **append-only audit log** to which every `DecisionRecord`, consent change, policy `deny`, and withdrawal writes an entry carrying the envelope header, actor, policy result, and outcome; entries MUST be append-only and tenant-scoped, and support decision replay with the evidence/policy version recorded at the time (FOUNDATION_PRD §7.2 audit, §17).
- **FR-012**: Downstream domain logic MUST receive only a **pseudonymous actor reference** and purpose scope — never legal identity; identity resolution MUST map a session/subject to a stable pseudonymous `actor_ref` (FOUNDATION_PRD §10.1, §10.3).
- **FR-013**: The system MUST consume a **stubbed enrollment handoff** producing a synthetic eligible-learner (roster entry, accommodation-profile reference, eligibility-evidence *reference* only — never raw responses) that honors the agreed eligibility-contract shape, so cutover to the real admissions interface is a configuration change, not a rewrite (FOUNDATION_PRD §7.3, §10.4).
- **FR-014**: Consent withdrawal MUST invoke a **deletion-workflow interface** (stub only) and block new processing for that purpose; the real cross-store crypto-shred workflow is deferred (FOUNDATION_PRD §13; deferred in plan).
- **FR-015**: The whole slice MUST run on **synthetic data only**, with the legal/consent layer modeled **mechanically and stubbed** (document hashes, signatures, legal validity are placeholder values); no real child data, consent, admissions, or legal workflow is required to run it (Constitution V; FOUNDATION_PRD §3.3, §19.2).
- **FR-016**: All domain logic MUST be **pure and deterministic** — no I/O, no wall-clock reads, no random ids inside the core; the clock and id generator are injected via ports, so contracts and decisions are **replayable** (Constitution I POL-004; parent §27).

### Key Entities *(include if feature involves data)*

- **EnvelopeHeader**: the common traceability header on every contract (FR-001).
- **LearnerEvent / ConsentGrant / AssentRecord / DecisionRecord**: the four foundation contracts (FR-002–FR-005). `OverrideRecord` and `Appeal` (parent §28) are noted but **out of scope** for this buildable slice.
- **ActorRef**: a pseudonymous actor reference with a `class` (`human` / `guardian` / `child` / `staff` / `model` / `system`) used to enforce authority invariants (FR-005, FR-012).
- **PolicyDecision**: the value returned by the authorization predicate — `allow`/`deny`, `reason`, and `policy_version` (FR-007).
- **OutboxRow**: a staged, not-yet-relayed event with an idempotency key and relay state (FR-009).
- **AuditEntry**: an append-only record of a consequential action with its envelope header, actor, policy result, and outcome (FR-011).
- **EligibleLearner (stub)**: the synthetic enrollment-handoff output — roster entry + accommodation-profile ref + eligibility-evidence ref (FR-013).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **100%** of emitted contracts validate with a complete, traceable envelope (`consent_purpose`, `policy_version`, `evidence_refs`, `schema_version`, `actor_ref`, distinct `occurred_at`/`recorded_at`); any record missing a required field is rejected in **100%** of attempts.
- **SC-002**: A `DecisionRecord` **cannot** be finalized without a named `authorized_human` and a policy result, and a `model`-class actor filling `authorized_human` is rejected in **100%** of attempts (no code path permits it).
- **SC-003**: A command whose purpose has no active matching consent — or whose role/purpose/jurisdiction is not explicitly allowed — is **denied** (deny-by-default) with a recorded `policy_version`, in **100%** of such cases; an actively-consented, permitted, jurisdiction-matching request is allowed.
- **SC-004**: Under at-least-once delivery, replaying the same `contract_id` any number of times produces **exactly one** applied projection, and a synthetic burst of N events flows outbox → bus → projection with **no acknowledged loss** (count in = count applied).
- **SC-005**: After a guardian withdraws consent, **zero** new processing for that purpose is accepted, a deletion-workflow request is enqueued (stub), and the append-only audit entry that the change occurred is preserved.
- **SC-006**: A child `AssentRecord` refusal blocks the corresponding optional collection **even when** a guardian `ConsentGrant` is present, in **100%** of such cases.
- **SC-007**: The full slice (build contracts → provision synthetic learner via stub → grant/withdraw consent + record assent → authorize → command through outbox → consumer projection → audit) runs end-to-end **synthetic-only** with `tsc -b` clean and Vitest green, requiring **no** real consent/admissions/legal workflow, Redpanda, Temporal, OPA, PostgreSQL, or cloud infrastructure.

## Assumptions

- **TypeScript reference, production stack deferred**: The buildable definition of done is **`tsc -b` + Vitest**, so this slice is a pure-TS, locally-testable reference of the spine's *core logic*. The production targets named in FOUNDATION_PRD §4/§9/§11/§13 (Go services, Redpanda, Temporal, real OPA/Rego bundles, PostgreSQL, AWS + Terraform, managed runtimes) are the **deferred production direction**, described in plan.md, **not** built or tasked here.
- **Legal layer is mechanical + stubbed**: consent/assent are modeled as *mechanisms* (purpose, expiry, withdrawal, refusal-honored) with placeholder legal artifacts (document hash, signature = synthetic strings). No real legal validity, e-signature, or jurisdiction law is implemented (FR-015).
- **Scope trims to the buildable core**: `OverrideRecord`, `Appeal`, real crypto-shred deletion, Buf/Protobuf wire generation, mTLS/network security, observability stack, and CI/CD signing are **out of scope / deferred** and appear as notes or interface stubs, not tasks.
- **In-process event spine**: the "event spine" is an in-process bus + outbox, not Redpanda; it proves the outbox + idempotent-consumer *pattern* whose correctness is logic, not infrastructure.
- **Enrollment handoff is a stub**: the admissions Track A/Track B eligibility interface is consumed via a stub honoring the agreed contract shape (FR-013); the pipeline itself is the admissions team's boundary.
- **Parallel-safe layout**: all new code lives in `packages/platform-contracts`, `packages/platform-spine`, and `adapters/spine-*` / `adapters/enrollment-stub`; the only shared-root edit is adding composite project references to the root `tsconfig.json`, done as the final flagged task.
- **Single tenant / synthetic cohort**: `tenant_id` is present and checked in the header, but multi-tenant isolation testing beyond header scoping is out of scope for this slice.
