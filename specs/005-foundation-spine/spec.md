# Feature Specification: Platform Foundation Spine

**Feature Branch**: `005-foundation-spine`

**Created**: 2026-07-20

**Status**: Loop-ready (Draft)

**Input**: Baby PRD [`docs/prd/FOUNDATION_PRD.md`](../../docs/prd/FOUNDATION_PRD.md) (the signed event + consent + policy + audit substrate), scoped from [`PRD.md`](../../docs/prd/PRD.md) §26–§28, §30, §32.1. Buildable slice: "A code-first, locally-testable TypeScript reference of the platform spine's core logic — the versioned contract envelope and the `LearnerEvent` / `ConsentGrant` / `AssentRecord` / `DecisionRecord` / `OverrideRecord` / `Appeal` contracts with their invariants, an in-process event spine + transactional outbox, a pseudonymous identity / consent / assent domain, and a deterministic purpose-authorization policy decision. The production stack (Go services, Redpanda, Temporal, real OPA/Rego, PostgreSQL, AWS/Terraform) is the deferred production target; this slice proves the substrate's mechanics with pure domain packages + in-memory adapters. Synthetic learners only; the legal/consent layer is modeled mechanically and stubbed."

> **How to read this spec (loop guidance).** This document is written to be built by an autonomous
> build loop whose definition of done is `pnpm typecheck` (`tsc -b`) + `pnpm test` (Vitest). It is
> **navigable per phase**: read only the section for the phase you are on. The build order is the
> [Phasing (P0…P6)](#phasing-p0p6) section; every success criterion is machine-checkable and mapped to a
> named test file in [Success Criteria](#success-criteria-mandatory); every computed result has an exact
> [golden value](#golden-values--tolerances). If something is not specified here, apply the
> [Defaults for the unspecified](#defaults-for-the-unspecified) rule — do **not** stop to ask.

## Why this feature is first

The parent PRD is explicit: *"The team implements `LearnerEvent`, consent, decision, override, appeal, and audit contracts first because all later work depends on them"* (parent §32.1). Every later domain service emits these contracts onto this spine and reads policy from it. If the spine is wrong, every feature above it inherits the defect. This slice builds and proves the **core logic of that substrate** in TypeScript — the part whose correctness is a matter of rules, not infrastructure — so the invariants are locked before any consumer or the production runtime is layered on.

---

## Scope Fence *(hard — read before building)*

The loop builds the **whole** spec. Anything below the fence line is a task; anything above the
"Out of scope" line must **not** be built, only referenced as a note or an interface stub.

### In scope (build this)

1. **Versioned common envelope header** + `validateEnvelope` + a `validatorFor(schema_version)` registry (FR-001, FR-006).
2. **Six foundation contracts** with typed schemas, validators, and encoded invariants:
   `LearnerEvent`, `ConsentGrant`, `AssentRecord`, `DecisionRecord`, **`OverrideRecord`**, **`Appeal`** (FR-002–FR-005, FR-017, FR-018).
3. **Pseudonymous identity / consent / assent domain**: `provisionLearner`, `grantConsent`, `withdrawConsent`, `recordAssent`, `isConsentActive`, `assentBlocks` (FR-003, FR-004, FR-012, FR-013).
4. **Deny-by-default purpose-authorization predicate** (local OPA analogue) returning `allow`/`deny` + `policy_version` (FR-007, FR-008).
5. **In-process event spine + transactional outbox**: atomic `UnitOfWork` staging, `relay()` (at-least-once, idempotency key), idempotent `deliver()` consumer (dedup on `contract_id`) (FR-009, FR-010).
6. **Append-only audit log**: every `DecisionRecord`, `OverrideRecord`, `Appeal` filing, consent change, and `policy_deny` writes a replayable entry (FR-011).
7. **Command path** `handleCommand`: resolve actor → check consent → authorize → commit atomically → relay → project → audit (FR-009–FR-011).
8. **Stubbed enrollment handoff** producing a synthetic `EligibleLearner` (references only, never raw data) honoring the agreed eligibility-contract shape (FR-013).
9. **Consent-withdrawal deletion interface** (`DeletionWorkflow` stub) that blocks new processing and enqueues deletion (FR-014).
10. **In-repo synthetic seed fixtures** + a seeded smoke test + a `demo` script (FR-015; [Seed fixtures](#seed-fixtures-in-repo)).
11. **Ports for every I/O** + in-memory / stub adapters (the exact seams a production adapter slots into).

### Out of scope / deferred (do NOT build; describe as production direction only)

- **Production runtime**: Go services, Redpanda, Temporal, PostgreSQL, Redis, S3/Iceberg, AWS (EKS/RDS/KMS/CloudFront/VPC), Terraform (FOUNDATION_PRD §4, §9, §12).
- **Real policy-as-code**: signed OPA/Rego bundles + local sidecar evaluation + bundle signing (FOUNDATION_PRD §11).
- **Real deletion**: Temporal cross-store erasure + per-subject KMS **crypto-shred** (FOUNDATION_PRD §13) — interface stub only here.
- **Wire format**: Protobuf/JSON generation from a `proto/` registry + the **Buf** breaking-change CI gate (parent §28) — modeled by TS types + `validatorFor`, not generated.
- **Four-eyes *approval workflow*** (routing, notifications, queues) — the `OverrideRecord` **contract + its four-eyes invariant** are in scope; the human workflow that collects the two approvals is deferred.
- **Appeal *workflow / SLA timers*** — the `Appeal` **contract + reviewer-independence invariant** are in scope; scheduling, escalation, and remedy execution are deferred.
- **mTLS/network security, observability stack (OTel/Prometheus/Grafana), CI/CD signing, Argo CD, OpenFeature rings, DR drills, RTO/RPO sign-off** (FOUNDATION_PRD §14–§16, §4.6).
- **Application shells / feature UIs** — this slice is exercised by tests + a headless `demo` script, no Next.js app.

### Non-goals (never, in any phase)

- No real child data. Every fixture is **synthetic** (Constitution V; FOUNDATION_PRD §3.3).
- No real legal validity: document hashes, signatures, and legal artifacts are **placeholder strings** (FR-015).
- No automated consequential decision: **no code path** lets a `model`/`system` actor fill `DecisionRecord.authorized_human` (Constitution I; parent §28).
- No wall-clock reads, no random ids, no I/O inside the domain core — clock + id generator are injected (FR-016).
- No shared-root config edits except the final task's addition of composite project references to root `tsconfig.json` (parallel-safety).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emit a traceable, invariant-enforced contract (Priority: P1) 🎯 MVP

Any consequential action produces a versioned contract that carries the **common envelope header** (so it traces to the consent that permitted it, the policy that allowed it, the evidence behind it, the software version that produced it, and the person accountable) and satisfies the contract's invariants. A builder can construct a `LearnerEvent`, `ConsentGrant`, `AssentRecord`, `DecisionRecord`, `OverrideRecord`, or `Appeal`, validate it, and be certain a malformed or invariant-violating record is rejected — most importantly that **a model output can never fill `DecisionRecord.authorized_human`** and that a consequential `DecisionRecord` cannot be finalized without a named human and a policy result.

**Why this priority**: This is the atomic unit of the whole platform — "implement the contracts first" (parent §32.1). Nothing else (consent checks, authorization, the event spine, audit, deletion) has anything to bind to until the envelope and the contracts exist and enforce their invariants. It is the smallest thing that is independently demonstrable and delivers the core "every action is traceable and no machine can decide" guarantee.

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
2. **Given** no active consent for purpose P (never granted, expired, or withdrawn), **When** purpose P is requested, **Then** the predicate returns `deny` with reason `no_active_consent` and a `policy_version`, and the deny is recorded.
3. **Given** a request whose role or purpose is unknown to the policy, **When** it is evaluated, **Then** the result is `deny` with reason `deny_by_default`, never a silent allow.
4. **Given** a `ConsentGrant` whose `jurisdiction` does not match the request's jurisdiction, **When** evaluated, **Then** the result is `deny` with reason `jurisdiction_mismatch` (residency mismatch).
5. **Given** a present guardian `ConsentGrant` for an optional purpose **and** a child `AssentRecord` recording refusal, **When** that optional collection is attempted, **Then** it is blocked — guardian consent does not substitute for child assent where refusal is honorable.
6. **Given** an active consent, **When** the guardian withdraws it, **Then** subsequent processing for that purpose is denied and a deletion-workflow request is enqueued (stub).

### User Story 3 - Move an event through the transactional outbox with idempotent consumers (Priority: P3)

A command writes its business state (e.g. a `DecisionRecord`) **and** an outbox row **atomically**, a relay publishes the resulting `LearnerEvent` to the in-process event spine with an **idempotency key**, and consumers update their own projection **exactly once** even under at-least-once delivery by **rejecting a duplicate `contract_id`** and preserving the first valid result. Every consequential action also writes an **append-only audit entry**.

**Why this priority**: This is the gate's traceability + durability mechanic (parent §17.3, §17.7, §9). It depends on the contracts (US1) and reuses the authorization from US2 on the command path. It proves the substrate's "no dual-write race, no double-apply, no acknowledged loss" property at slice scale, which every later producer/consumer relies on.

**Independent Test**: Run a command through the full path (resolve actor → check consent → authorize → write state + outbox row atomically → relay → consumer projection); replay the same `contract_id` several times and confirm the projection applies exactly once; deliver events out of `occurred_at` order and confirm each distinct `contract_id` still applies exactly once; simulate a relay retry and confirm no acknowledged loss; confirm an audit entry exists for the decision.

**Acceptance Scenarios**:

1. **Given** an authorized command, **When** it is handled, **Then** the `DecisionRecord` and its outbox row are committed together (both present or neither), and an audit entry is written.
2. **Given** a staged outbox row, **When** the relay publishes it and is retried (at-least-once), **Then** the consumer projection reflects the event **exactly once** (duplicate `contract_id` rejected, first result preserved).
3. **Given** a synthetic burst of N events, **When** they flow through outbox → bus → projection, **Then** every acknowledged event is reflected with **no loss** and no duplicate application.
4. **Given** events delivered **out of `occurred_at` order**, **When** each is consumed, **Then** dedup is by `contract_id` (not time) so every distinct event applies exactly once regardless of arrival order.
5. **Given** a consumer that fails on an event, **When** the event is retried, **Then** processing is safe to repeat (idempotent) and the event is not lost.

### User Story 4 - Record an override and an appeal without erasing the original (Priority: P4)

A named authority can record an **`OverrideRecord`** that supersedes a prior `DecisionRecord` — for an override class (admissions, public exposure, safeguarding, credential revocation) it requires **four-eyes**: two *distinct human* approvers (never a model/system), a rationale, evidence, and a review date — and the override **creates a new record that preserves the original** (append-only, `causation_id` links back). Separately, an **`Appeal`** can be filed against a decision; its **independent reviewer cannot be the original decision owner**, and filing it never mutates or reduces access to the target decision.

**Why this priority**: These are the two remaining foundation contracts named in parent §32.1 and §28 ("`LearnerEvent`, consent, decision, **override, appeal**, and audit contracts first"). They complete the contract set the whole platform binds to. They depend on US1 (envelope + `DecisionRecord`) and the append-only + human-authority invariants, but not on US2/US3, so they can be built in parallel with the spine plumbing.

**Independent Test**: Build an `OverrideRecord` with two distinct human approvers → passes; with a model approver → rejected; with a single approver for an override class → rejected; confirm the target `DecisionRecord` is unchanged. Build an `Appeal` whose `independent_reviewer` differs from the target decision's `authorized_human` → passes; equal → rejected; confirm `late`/`reopened` statuses are recordable.

**Acceptance Scenarios**:

1. **Given** a prior `DecisionRecord`, **When** an `OverrideRecord` is built for an override class with two distinct human approvers, a rationale, evidence, and a review date, **Then** validation passes and the original `DecisionRecord` is preserved (a new record links via `causation_id`).
2. **Given** an `OverrideRecord` whose approver set contains a `model`/`system` actor, or fewer than two distinct approvers for an override class, **When** it is validated, **Then** validation **fails** (authority forgery / four-eyes).
3. **Given** a target `DecisionRecord` with `authorized_human` H, **When** an `Appeal` names H as its `independent_reviewer`, **Then** validation **fails** with a reviewer-conflict error; naming a different reviewer passes.
4. **Given** an `Appeal`, **When** it is filed or later reopened/marked late, **Then** the status is recordable and filing it does not alter the target decision (append-only) or reduce access.

### Edge Cases

- **Append-only**: a contract is immutable once recorded; a correction is a **new** record whose `causation_id` references the prior — never an in-place edit. The store rejects re-writing an existing `contract_id`.
- **Authority forgery**: no code path, including a "system" or "model" actor, can fill `DecisionRecord.authorized_human` or appear as an `OverrideRecord` approver; a consequential record with no policy result is invalid.
- **Consent timing**: consent that is expired or withdrawn is treated as *not active*; the active window is `[effective_at, expiry_at)` minus any withdrawal (withdrawal takes effect immediately).
- **Deny-by-default**: any role/purpose/jurisdiction combination not explicitly allowed by policy is denied; there is no fall-through allow.
- **Duplicate delivery (replay)**: re-delivering the same `contract_id` is a no-op at the consumer (dedup), and re-relaying an outbox row does not double-publish semantics downstream.
- **Out-of-order delivery**: consumers dedup on `contract_id`, not on time, so events arriving out of `occurred_at` order each apply exactly once; the two timestamps remain distinct and are never used for dedup.
- **Withdrawal cascade**: withdrawal blocks *new* processing for that purpose, enqueues the deletion stub **once**, and every subsequent command for that purpose denies (`no_active_consent`) with a `policy_deny` audit entry; already-written append-only audit entries that the change occurred are preserved (real erasure is deferred — interface stub only).
- **Jurisdiction/residency**: a mismatch between a consent's `jurisdiction` and the request's jurisdiction denies (`jurisdiction_mismatch`), mirroring the production data-residency rule.
- **Override preserves original**: an `OverrideRecord` never edits the `DecisionRecord` it targets; both records coexist and the audit log carries both.
- **Appeal independence**: an `Appeal` reviewer equal to the target decision's `authorized_human` is rejected; filing an appeal has no side effect on the target decision.
- **Synthetic legal layer**: consent/assent legal semantics are *modeled mechanically only*; document hashes, signatures, and legal validity are stubbed values, not real legal artifacts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define a versioned **common envelope header** carried by every contract, containing `contract_id`, `schema_version`, `tenant_id`, `actor_ref`, `occurred_at`, `recorded_at`, `correlation_id`, `causation_id`, `consent_purpose`, `policy_version`, optional `model_version`, and `evidence_refs`, and MUST provide a validator that rejects a record with any missing or empty required field (parent §28; FOUNDATION_PRD §7.1).
- **FR-002**: The system MUST provide a typed `LearnerEvent` schema + validator with `event_type`, pseudonymous `learner_ref`, distinct event/ingest time (`occurred_at`/`recorded_at`), source, context refs, payload-schema ref, and `evidence_refs`; consumers MUST treat it as immutable and idempotent (FOUNDATION_PRD §7.2).
- **FR-003**: The system MUST provide a typed `ConsentGrant` schema + validator with `subject_ref`, guardian authority, `purpose`, data categories, processors, `jurisdiction`, `effective_at`/`expiry_at`, collection method, document hash (stub), and `withdrawal_state`; and MUST expose an `isConsentActive(consent, at)` rule such that data may be used **only for an active matching purpose** (FOUNDATION_PRD §7.2, §10.2).
- **FR-004**: The system MUST provide a typed `AssentRecord` schema + validator with `child_ref`, age band, notice version, choices shown, `response` (assent/refusal/dissent), facilitator, timestamp, renewal date, and an `honorable` flag; and MUST enforce that **guardian consent cannot substitute for child assent where a refusal is honorable** — a recorded honorable refusal blocks the optional collection (Constitution II; FOUNDATION_PRD §7.2, §10.2).
- **FR-005**: The system MUST provide a typed `DecisionRecord` schema + validator with `decision_type`, subject, candidates, outcome, reason codes, evidence snapshot, uncertainty, policy + optional model versions, `authorized_human`, and effective time; and MUST enforce that a consequential record requires **both a named `authorized_human` and a policy result**, that records are **append-only**, and that **a model output cannot fill `authorized_human`** (Constitution I; parent §28; FOUNDATION_PRD §7.2).
- **FR-006**: Every contract MUST carry a `schema_version` string, and validation MUST be selected by that version via a `validatorFor(schema_version)` registry, so new fields can be added under new versions while old readers keep working (models the Buf compatibility discipline; parent §28). No live wire-format generation is required in this slice.
- **FR-007**: The system MUST provide a deterministic **purpose-authorization predicate** (a local analogue of the production OPA/Rego decision) that returns `allow`/`deny` for a request by `role` + `purpose` + active `consent` + `jurisdiction`, is **deny-by-default**, and returns the `policy_version` that decided it (FOUNDATION_PRD §11; parent §27).
- **FR-008**: Authorization MUST **deny** with reason `jurisdiction_mismatch` when a matching active consent exists for the purpose but its `jurisdiction` does not agree with the request's jurisdiction (data-residency rule; FOUNDATION_PRD §4.8, §11).
- **FR-009**: The system MUST provide a **transactional outbox** mechanism such that business state and an outbox row are staged **atomically** (both or neither) in a `UnitOfWork`, and a relay publishes each outbox row to the event spine with an **idempotency key**, delivering **at-least-once** (FOUNDATION_PRD §8, §9).
- **FR-010**: Event consumers MUST be **idempotent**: a duplicate `contract_id` MUST be rejected and the first valid result preserved, so at-least-once and out-of-order delivery cause no double application (FOUNDATION_PRD §9).
- **FR-011**: The system MUST maintain an **append-only audit log** to which every `DecisionRecord`, `OverrideRecord`, `Appeal` filing, consent change, policy `deny`, and withdrawal writes an entry carrying the envelope header, actor, policy result, and outcome; entries MUST be append-only and tenant-scoped, and support decision replay with the evidence/policy version recorded at the time (FOUNDATION_PRD §7.2 audit, §17).
- **FR-012**: Downstream domain logic MUST receive only a **pseudonymous actor reference** and purpose scope — never legal identity; identity resolution MUST map a session/subject to a stable pseudonymous `actor_ref` (FOUNDATION_PRD §10.1, §10.3).
- **FR-013**: The system MUST consume a **stubbed enrollment handoff** producing a synthetic eligible-learner (roster entry, accommodation-profile *reference*, eligibility-evidence *reference* only — never raw responses) that honors the agreed eligibility-contract shape, so cutover to the real admissions interface is a configuration change, not a rewrite (FOUNDATION_PRD §7.3, §10.4).
- **FR-014**: Consent withdrawal MUST invoke a **deletion-workflow interface** (stub only) exactly once per withdrawal and block new processing for that purpose; the real cross-store crypto-shred workflow is deferred (FOUNDATION_PRD §13; deferred in plan).
- **FR-015**: The whole slice MUST run on **synthetic data only**, with the legal/consent layer modeled **mechanically and stubbed** (document hashes, signatures, legal validity are placeholder values); no real child data, consent, admissions, or legal workflow is required to run it (Constitution V; FOUNDATION_PRD §3.3, §19.2).
- **FR-016**: All domain logic MUST be **pure and deterministic** — no I/O, no wall-clock reads, no random ids inside the core; the clock and id generator are injected via ports, so contracts and decisions are **replayable** (Constitution I POL-004; parent §27).
- **FR-017**: The system MUST provide a typed **`OverrideRecord`** schema + validator with `target_decision` (the prior `DecisionRecord.contract_id`), `prior_outcome`, `new_outcome`, `authorized_role`, `override_class`, `rationale`, `evidence_refs`, `review_at`, and an `approvers` set; and MUST enforce **four-eyes** for override classes (`admissions`, `public_exposure`, `safeguarding`, `credential_revocation`) — **two distinct human approvers, none `model`/`system`** — and that the override **creates a new record and preserves the original** (`causation_id` references `target_decision`; the target is never mutated) (Constitution I/IX; parent §28; FOUNDATION_PRD §7.2).
- **FR-018**: The system MUST provide a typed **`Appeal`** schema + validator with `appellant_role`, `target_decision`, `grounds`, `submitted_evidence_refs`, `requested_remedy`, `status` (∈ `filed`/`under_review`/`resolved`/`reopened`/`late`), `independent_reviewer`, `deadlines`, and `resolution` (nullable until resolved); and MUST enforce that **the `independent_reviewer` cannot be the target decision's `authorized_human`** and that filing an appeal neither mutates the target decision nor reduces access (Constitution I; parent §28; FOUNDATION_PRD §7.2).

### Key Entities *(include if feature involves data)*

- **EnvelopeHeader**: the common traceability header on every contract (FR-001).
- **LearnerEvent / ConsentGrant / AssentRecord / DecisionRecord / OverrideRecord / Appeal**: the six foundation contracts (FR-002–FR-005, FR-017, FR-018). All six are **in scope** for this slice.
- **ActorRef**: a pseudonymous actor reference with a `class` (`human` / `guardian` / `child` / `staff` / `model` / `system`) used to enforce authority invariants (FR-005, FR-012, FR-017).
- **PolicyDecision**: the value returned by the authorization predicate — `allow`/`deny`, `reason`, and `policy_version` (FR-007).
- **OutboxRow**: a staged, not-yet-relayed event with an idempotency key and relay state (FR-009).
- **AuditEntry**: an append-only record of a consequential action with its envelope header, actor, policy result, and outcome (FR-011).
- **EligibleLearner (stub)**: the synthetic enrollment-handoff output — roster entry + accommodation-profile ref + eligibility-evidence ref + track (FR-013).

## Success Criteria *(mandatory)*

### Measurable Outcomes (each mapped to a test — the gate is `tsc -b` + Vitest)

- **SC-001**: **100%** of emitted contracts validate with a complete, traceable envelope (`consent_purpose`, `policy_version`, `evidence_refs`, `schema_version`, `actor_ref`, distinct `occurred_at`/`recorded_at`); any record missing a required field is rejected in **100%** of attempts, naming the field.
- **SC-002**: A `DecisionRecord` **cannot** be finalized without a named `authorized_human` and a policy result, and a `model`/`system`-class actor filling `authorized_human` is rejected in **100%** of attempts (no code path permits it).
- **SC-003**: A command whose purpose has no active matching consent — or whose role/purpose/jurisdiction is not explicitly allowed — is **denied** (deny-by-default) with a recorded `policy_version` and the exact reason code, in **100%** of such cases; an actively-consented, permitted, jurisdiction-matching request is allowed.
- **SC-004**: Under at-least-once **and** out-of-order delivery, replaying the same `contract_id` any number of times produces **exactly one** applied projection, and a synthetic burst of N events flows outbox → bus → projection with **no acknowledged loss** (count in = count applied).
- **SC-005**: After a guardian withdraws consent, **zero** new processing for that purpose is accepted, a deletion-workflow request is enqueued (stub) **exactly once**, and the append-only audit entry that the change occurred is preserved.
- **SC-006**: A child `AssentRecord` honorable refusal blocks the corresponding optional collection **even when** a guardian `ConsentGrant` is present, in **100%** of such cases.
- **SC-007**: The full slice (build contracts → provision synthetic learner via stub → grant/withdraw consent + record assent → authorize → command through outbox → consumer projection → audit → override + appeal) runs end-to-end **synthetic-only** with `tsc -b` clean and Vitest green, requiring **no** real consent/admissions/legal workflow, Redpanda, Temporal, OPA, PostgreSQL, or cloud infrastructure.
- **SC-008**: An `OverrideRecord` for an override class validates **only** with two distinct human approvers (none `model`/`system`); any approver set with a model/system actor or fewer than two distinct approvers is rejected in **100%** of attempts; the target `DecisionRecord` is byte-for-byte unchanged after an override, and an audit entry is written.
- **SC-009**: An `Appeal` whose `independent_reviewer` equals the target decision's `authorized_human` is rejected in **100%** of attempts; a distinct reviewer passes; `late` and `reopened` statuses are recordable; the target decision is unchanged after filing.

### SC → test mapping

| SC | Test file | Golden ref |
|---|---|---|
| SC-001 | `packages/platform-contracts/test/envelope.test.ts` | [G-ENV](#g-env--envelope-validation) |
| SC-002 | `packages/platform-contracts/test/decision.test.ts` | [G-DEC](#g-dec--decisionrecord-invariants) |
| SC-003 | `packages/platform-spine/test/policy.test.ts` | [G-AUTH](#g-auth--authorization-decisions) |
| SC-004 | `packages/platform-spine/test/outbox.test.ts` | [G-IDEM](#g-idem--idempotencydedup) |
| SC-005 | `packages/platform-spine/test/consent-service.test.ts` | [G-WD](#g-wd--withdrawal-cascade) |
| SC-006 | `packages/platform-contracts/test/assent.test.ts` | [G-ASSENT](#g-assent--assent-veto) |
| SC-007 | `packages/platform-spine/test/golden.test.ts` + `quickstart.md` | all |
| SC-008 | `packages/platform-contracts/test/override.test.ts` | [G-OVR](#g-ovr--overriderecord-four-eyes) |
| SC-009 | `packages/platform-contracts/test/appeal.test.ts` | [G-APL](#g-apl--appeal-reviewer-independence) |

---

## Golden Values & Tolerances

These are the **exact** expected results the acceptance tests assert. They use the canonical
[seed fixtures](#seed-fixtures-in-repo). All timestamps are ISO-8601 UTC. **Tolerance for all values
is exact (±0)** except where noted — these are deterministic pure functions over injected clock/ids, so
there is no floating-point or timing tolerance. The one nuance: `occurred_at` and `recorded_at` are
required to be **distinct** but their exact millisecond offset is not asserted (only inequality).

### G-ENV — envelope validation

Base header = `FIXTURE.validEnvelope` (see fixtures). `validateEnvelope(header)` returns `void` (no throw).
For each row, delete/blank the named field from a clone and assert the thrown error's `field`:

| Mutation | `validateEnvelope` result | Error `field` |
|---|---|---|
| (none) — complete header | passes (returns void) | — |
| `contract_id` = `""` | throws `NamedFieldError` | `"contract_id"` |
| `schema_version` = `""` | throws `NamedFieldError` | `"schema_version"` |
| `tenant_id` = `""` | throws `NamedFieldError` | `"tenant_id"` |
| `actor_ref` = `undefined` | throws `NamedFieldError` | `"actor_ref"` |
| `consent_purpose` = `""` | throws `NamedFieldError` | `"consent_purpose"` |
| `policy_version` = `""` | throws `NamedFieldError` | `"policy_version"` |
| `correlation_id` = `""` | throws `NamedFieldError` | `"correlation_id"` |
| `causation_id` = `""` | throws `NamedFieldError` | `"causation_id"` |
| `occurred_at` = `"not-a-date"` | throws `NamedFieldError` | `"occurred_at"` |
| `evidence_refs` = `undefined` | throws `NamedFieldError` | `"evidence_refs"` |
| `evidence_refs` = `[]` | passes (empty allowed, must exist) | — |
| `model_version` = `null` | passes (nullable) | — |

### G-DEC — `DecisionRecord` invariants

Using `FIXTURE.STAFF_GUIDE` (class `staff`), `FIXTURE.MODEL` (class `model`), `FIXTURE.SYSTEM` (class `system`):

| Decision | `validateDecisionRecord` result | Error |
|---|---|---|
| consequential, `authorized_human = STAFF_GUIDE`, `policy_version = "opa-bundle/2026-07-20a"` | passes | — |
| consequential, `authorized_human = MODEL` | throws `AuthorityForgeryError` (`field: "authorized_human"`) | — |
| consequential, `authorized_human = SYSTEM` | throws `AuthorityForgeryError` | — |
| consequential, `authorized_human = undefined` | throws `NamedFieldError` (`field: "authorized_human"`) | — |
| consequential, `policy_version = ""` | throws `NamedFieldError` (`field: "policy_version"`) | — |
| **non**-consequential (`consequential: false`), no `authorized_human` | passes | — |

Append-only: `assertAppendOnly(new Set(["cid_0001"]), "cid_0001")` throws `AppendOnlyError`;
`assertAppendOnly(new Set(["cid_0001"]), "cid_0002")` returns void.

### G-ASSENT — assent veto

| `AssentRecord` | `assentBlocks(record)` |
|---|---|
| `honorable: true`, `response: "refusal"` | `true` |
| `honorable: true`, `response: "dissent"` | `true` |
| `honorable: true`, `response: "assent"` | `false` |
| `honorable: false`, `response: "refusal"` | `false` |

SC-006 scenario: with `FIXTURE.CONSENT_ONBOARDING` (guardian consent, active) present **and** an
`AssentRecord{honorable:true, response:"refusal"}`, the optional collection is blocked because
`assentBlocks` is `true` — guardian consent does not override it.

### G-AUTH — authorization decisions

Policy = `FIXTURE.POLICY_V1` (`policy_version: "opa-bundle/2026-07-20a"`, one rule:
`{role:"guide", purpose:"onboarding.schedule", jurisdictions:["US-CA"]}`). Request actor =
`FIXTURE.STAFF_GUIDE` (role `guide`), `at = "2026-07-20T14:03:11.000Z"`, subject `learner_synth_001`.
`authorize(request, consents, policySet)` results (every result carries `policy_version:
"opa-bundle/2026-07-20a"`):

| # | request.purpose | request.jurisdiction | consents | `allow` | `reason` |
|---|---|---|---|---|---|
| 1 | `onboarding.schedule` | `US-CA` | `[CONSENT_ONBOARDING]` | `true` | `"allow"` |
| 2 | `onboarding.schedule` | `US-CA` | `[]` | `false` | `"no_active_consent"` |
| 3 | `onboarding.schedule` | `US-CA` | `[CONSENT_ONBOARDING_WITHDRAWN]` | `false` | `"no_active_consent"` |
| 4 | `onboarding.schedule` | `US-CA` | `[CONSENT_ONBOARDING_EXPIRED]` | `false` | `"no_active_consent"` |
| 5 | `onboarding.schedule` | `US-NY` | `[CONSENT_ONBOARDING]` (US-CA) | `false` | `"jurisdiction_mismatch"` |
| 6 | `research.trial` | `US-CA` | `[CONSENT_RESEARCH]` (active, US-CA) | `false` | `"deny_by_default"` |

**Precedence (fixed, so reason codes are deterministic):** (a) filter consents to `isConsentActive(_, at) && purpose === request.purpose`; empty ⇒ `no_active_consent`. (b) if none of those has `jurisdiction === request.jurisdiction` ⇒ `jurisdiction_mismatch`. (c) find `PolicyRule` where `role === actor.role && purpose === request.purpose && jurisdictions.includes(request.jurisdiction)`; none ⇒ `deny_by_default`. (d) else `allow`.

### G-IDEM — idempotency/dedup

Consumer `deliver(bus, offsets, projection, event)` returns `true` when applied, `false` when a
duplicate `contract_id` is skipped. For the delivery sequence of `contract_id`s
`[A, B, A, C, B, A]`:

- `deliver` returns: `[true, true, false, true, false, false]`
- applied projection keys = `{A, B, C}`, `projection.count === 3`.

Out-of-order (G-IDEM/oo): deliver `O1{cid:"cid_O1", occurred_at:"14:05:00"}` then
`O2{cid:"cid_O2", occurred_at:"14:01:00"}` → both `true`, `count === 2`; re-deliver `O2` → `false`,
`count === 2` (dedup by `contract_id`, not by time).

Burst (G-IDEM/burst): N = 100 distinct `contract_id`s, each delivered **twice** in an interleaved order
(200 `deliver` calls) → `true` exactly 100 times, `false` exactly 100 times, `projection.count === 100`
(no loss, no double-apply).

### G-WD — withdrawal cascade

Start: `grantConsent(CONSENT_ONBOARDING)`; `authorize(#1)` ⇒ `allow`. Then
`withdrawConsent(consentId, at="2026-07-20T15:00:00.000Z")`:

- `isConsentActive(consent, "2026-07-20T15:00:01.000Z")` ⇒ `false`.
- `authorize` (same as G-AUTH #1 inputs, now withdrawn) ⇒ `allow: false`, `reason: "no_active_consent"`.
- `DeletionWorkflow.requestDeletion` called **exactly once** with `"learner_synth_001"`.
- audit log contains **exactly one** entry with `action: "consent_withdrawn"`.
- a subsequent `handleCommand` for `onboarding.schedule` ⇒ `{ denied: true, decision: null }` and **exactly one** new audit entry with `action: "policy_deny"` (no `DecisionRecord` appended).

### G-OVR — `OverrideRecord` four-eyes

Target = a valid `DecisionRecord` with `contract_id: "cid_0001"`, `authorized_human: STAFF_GUIDE`.
`OverrideRecord` base: `target_decision:"cid_0001"`, `override_class:"admissions"`,
`prior_outcome:"route_A"`, `new_outcome:"route_B"`, `authorized_role:"admissions_lead"`,
`rationale:"corrected eligibility band"`, `evidence_refs:["evidence://override/synth_001#sha256:bb22"]`,
`review_at:"2026-08-20T00:00:00.000Z"`, `header.causation_id:"cid_0001"`:

| `approvers` | `validateOverrideRecord` result | Error |
|---|---|---|
| `[STAFF_GUIDE, STAFF_GUIDE_2]` (distinct staff) | passes | — |
| `[STAFF_GUIDE, MODEL]` | throws `AuthorityForgeryError` (`field:"approvers"`) | — |
| `[STAFF_GUIDE, SYSTEM]` | throws `AuthorityForgeryError` | — |
| `[STAFF_GUIDE, STAFF_GUIDE]` (same ref) | throws `FourEyesError` | — |
| `[STAFF_GUIDE]` (single, override class) | throws `FourEyesError` | — |

Preservation: after building `OVR_VALID`, the target `DecisionRecord` (`cid_0001`) in the store is
**unchanged**, and both `cid_0001` and the override's `contract_id` exist (append-only). The override's
`header.causation_id === "cid_0001"`.

### G-APL — appeal reviewer independence

Target = `DecisionRecord{contract_id:"cid_0001", authorized_human:STAFF_GUIDE}`. `Appeal` base:
`appellant_role:"guardian"`, `target_decision:"cid_0001"`, `grounds:"new evidence"`,
`submitted_evidence_refs:["evidence://appeal/synth_001#sha256:cc33"]`, `requested_remedy:"re-review"`,
`deadlines:{respond_by:"2026-08-01T00:00:00.000Z"}`, `resolution:null`:

| `independent_reviewer` / `status` | `validateAppeal` result | Error |
|---|---|---|
| `STAFF_GUIDE_2` (≠ authorized_human), `status:"filed"` | passes | — |
| `STAFF_GUIDE` (= authorized_human), `status:"filed"` | throws `ReviewerConflictError` (`field:"independent_reviewer"`) | — |
| `STAFF_GUIDE_2`, `status:"reopened"` | passes | — |
| `STAFF_GUIDE_2`, `status:"late"` | passes | — |
| `STAFF_GUIDE_2`, `status:"invalid_status"` | throws `NamedFieldError` (`field:"status"`) | — |

Filing an `Appeal` does not mutate `cid_0001` (append-only); the target decision is unchanged.

---

## Phasing (P0…P6)

Ordered build path. Each phase has an obvious "next task" and a checkpoint. Task IDs reference
[tasks.md](./tasks.md). **Read only the current phase's section.**

### P0 — Setup (scaffold; new dirs only)
Scaffold the two packages + three adapters (`package.json`, `tsconfig.json`, empty `src/index.ts`) and
the git-ignored `.env.local` placeholder. No shared-root edits. **Tasks T001–T005.**
**Checkpoint:** workspace globs discover the packages; empty `tsc -b` runs.

### P1 — Foundational (blocking prerequisites)
`ActorRef`, `EnvelopeHeader` + `SCHEMA_VERSIONS`, shared invariant helpers, and all ports. **Tasks T006–T009.**
**Checkpoint:** core types, invariants, and ports exist — stories can begin.

### P2 — US1: envelope + contracts + validators (P1 priority) 🎯 MVP
`validateEnvelope`, `LearnerEvent`, `DecisionRecord` (human-authority + append-only invariants), and the
`validatorFor` registry, tests-first. **Tasks T010–T017.** Golden: [G-ENV](#g-env--envelope-validation),
[G-DEC](#g-dec--decisionrecord-invariants). **Checkpoint = MVP:** contracts validate and enforce invariants.

### P3 — US2: consent/assent + deny-by-default authorization (P2 priority)
`ConsentGrant`+`isConsentActive`, `AssentRecord`+`assentBlocks`, `authorize()` predicate, consent/assent
services (`grantConsent`/`withdrawConsent`/`recordAssent`), `provisionLearner`, and the in-memory + stub
adapters. **Tasks T018–T029.** Golden: [G-AUTH](#g-auth--authorization-decisions),
[G-ASSENT](#g-assent--assent-veto), [G-WD](#g-wd--withdrawal-cascade).
**Checkpoint:** consent/assent/authorization work end-to-end against in-memory adapters.

### P4 — US3: transactional outbox + idempotent consumers + audit (P3 priority)
`UnitOfWork` + `relay()`, idempotent `deliver()`, `AuditEntry` helpers, `handleCommand()` full path, and
the remaining in-memory adapters (`DecisionRepository`, `AuditLog`, `OutboxStore`, `ConsumerOffsets`,
`EventBus`). **Tasks T030–T034.** Golden: [G-IDEM](#g-idem--idempotencydedup).
**Checkpoint:** command → outbox → bus → projection → audit works headless.

### P5 — US4: OverrideRecord + Appeal contracts (P4 priority)
`OverrideRecord`+`validateOverrideRecord`+`assertFourEyes`, `Appeal`+`validateAppeal`+
`assertReviewerIndependent`, registry + audit obligations. **Tasks T035–T040.** Golden:
[G-OVR](#g-ovr--overriderecord-four-eyes), [G-APL](#g-apl--appeal-reviewer-independence).
**Checkpoint:** the full six-contract set validates and enforces its invariants.

### P6 — Polish & cross-cutting
READMEs, the `demo` script, the determinism/replay test, the **golden-fixtures test** asserting every
golden value above, the quickstart run, and — **as the final task** — the root `tsconfig.json` composite
references. **Tasks T041–T047.** **Checkpoint:** `tsc -b` clean + full Vitest green; SC-007 satisfied.

---

## Decisions already made *(do not re-open)*

- **TypeScript reference now; production stack deferred.** The buildable definition of done is
  `tsc -b` + Vitest. The production targets (Go, Redpanda, Temporal, real OPA/Rego bundles, PostgreSQL,
  Redis, S3, AWS + Terraform) are the deferred production direction (see [plan.md](./plan.md)), not built
  or tasked here.
- **Two pure packages.** `packages/platform-contracts` (dependency-free: envelope + six contracts +
  validators + invariants) and `packages/platform-spine` (identity/consent/assent domain, authorization
  predicate, outbox + consumer logic; depends on `platform-contracts`). This mirrors
  `packages/learning-loop`.
- **All I/O behind ports; in-memory/stub adapters now.** Ports: `Clock`, `IdGenerator`,
  `ConsentRepository`, `AssentRepository`, `IdentityRepository`, `DecisionRepository`,
  `OverrideRepository`, `AppealRepository`, `AuditLog`, `OutboxStore`, `EventBus`, `ConsumerOffsets`,
  `EnrollmentHandoffSource`, and the **stub-only** `DeletionWorkflow`. Each port is the exact seam a
  production adapter slots into with **zero domain change**.
- **Canonical envelope** = the 12 fields in FR-001, identical across all six contracts; a reader that
  understands the header can route/dedupe/audit any record without parsing its payload.
- **Authorization is a data-driven allow-list**, deny-by-default, with the fixed reason-code precedence in
  [G-AUTH](#g-auth--authorization-decisions). It always returns `policy_version`. The signed Rego bundle +
  sidecar is the deferred production form of the same decision.
- **Append-only everywhere.** Contracts are immutable; corrections/overrides are **new** records linked by
  `causation_id`; the store rejects re-writing an existing `contract_id`.
- **Determinism.** No wall-clock reads, no random ids, no I/O in the core; clock + id generator injected
  (FR-016), so every record is replayable.
- **Override/Appeal in scope as contracts.** The two remaining foundation contracts (parent §32.1) are
  built here with their invariants (four-eyes; reviewer independence); their **human workflows** (approval
  routing, SLA timers, remedy execution) are deferred.
- **Package names / stack pinned.** `@gt100k/platform-contracts`, `@gt100k/platform-spine`,
  `@gt100k/spine-repo-memory`, `@gt100k/spine-bus-memory`, `@gt100k/enrollment-stub`; pnpm workspace,
  Vitest, Biome, `tsc -b`, TS strict via `tsconfig.base.json`.

## Defaults for the unspecified

> **Rule (verbatim):** *For anything this PRD doesn't specify, choose the simplest correct option, record
> it in `.loop/decisions.md`, and continue.*

Concretely for this slice: prefer the simplest pure function; keep types minimal (add fields only when a
FR/SC needs them); use synthetic placeholder strings for any legal artifact; never introduce a runtime
dependency, network call, wall-clock read, or random id in the domain core; and if two designs are
equivalent, pick the one that matches `packages/learning-loop` conventions. Log the choice and keep going —
this slice is **non-blocking**.

## Pre-marked decision points *(preferred default stated inline; severity noted)*

- **[DP-1] Enrollment-handoff eligibility-contract shape** — `severity: normal` (open question for the
  human; see RETURN note). **Default:** `EligibleLearner = { learner_ref: string; accommodation_profile_ref:
  string; eligibility_evidence_ref: string; track: "A" | "B" }` — **references only, never raw responses,
  artifacts, or CogAT items** (FOUNDATION_PRD §7.3, §10.4; Constitution V). The admissions team owns the
  real shape; because the value is reference-only and behind the `EnrollmentHandoffSource` port, cutover is
  a config change even if fields are added. Proceed with the default; confirm with admissions before real
  cutover.
- **[DP-2] Authorization reason-code precedence** — `severity: low`. **Default:** the fixed order in
  [G-AUTH](#g-auth--authorization-decisions) (`no_active_consent` → `jurisdiction_mismatch` →
  `deny_by_default` → `allow`). Chosen so tests are deterministic.
- **[DP-3] Override classes requiring four-eyes** — `severity: normal`. **Default:** `admissions`,
  `public_exposure`, `safeguarding`, `credential_revocation` (parent §28 `OverrideRecord` invariant). A
  non-listed `override_class` records a single named human approver (still never model/system) rather than
  four-eyes. Confirm the class list with governance before live use.
- **[DP-4] `schema_version` string format** — `severity: low`. **Default:** `"<contract>/<major>"`, e.g.
  `"learner_event/1"`, `"decision_record/1"`; the `validatorFor` registry keys on this exact string.
- **[DP-5] `contract_id` / id shape** — `severity: low`. **Default:** opaque strings from the injected
  `IdGenerator` (tests use `"cid_0001"`, `"cid_0002"`, …). Production uses ULIDs; the domain treats ids as
  opaque, so the shape is not load-bearing.
- **[DP-6] Deletion on withdrawal** — `severity: normal`. **Default:** `DeletionWorkflow.requestDeletion`
  is a **stub** invoked once per withdrawal; real cross-store crypto-shred is deferred (FR-014). The
  audit fact that withdrawal occurred is always preserved.

---

## Stack + commands pinned

Package manager: **pnpm** (`packageManager: pnpm@9.15.9`; the harness auto-detects `pnpm-lock.yaml`).
Node LTS. TypeScript strict via `tsconfig.base.json`. Vitest + Biome. All commands run from repo root.

```bash
pnpm install                 # bootstrap workspace (packages/*, adapters/*, apps/*)
pnpm typecheck               # tsc -b  (composite build of all projects — must be clean)
pnpm test                    # vitest run  (include: packages/**/test, adapters/**/test)
pnpm lint                    # biome check packages adapters apps
pnpm build                   # next build of apps/student-compass (unaffected by this slice)

# scoped runs while building this slice:
pnpm --filter @gt100k/platform-contracts test
pnpm --filter @gt100k/platform-spine test
pnpm --filter @gt100k/enrollment-stub demo     # headless end-to-end demo (P6)
```

**Loop gate = `pnpm typecheck` clean AND `pnpm test` green.** `pnpm build` and `pnpm lint` are existing
repo scripts; this slice must not break them (it adds only new packages/adapters, no app or root-config
change until the final task).

### Seeded smoke test (green from iteration 1)

To keep the gate green before real logic exists, the first contracts test file includes a trivial
always-passing smoke assertion so `pnpm test` discovers and passes the new package immediately:

```ts
// packages/platform-contracts/test/smoke.test.ts
import { describe, expect, it } from "vitest";

describe("platform-contracts smoke", () => {
  it("package is wired into the Vitest workspace", () => {
    expect(true).toBe(true);
  });
});
```

## Seed fixtures (in-repo)

All fixtures are **synthetic** and committed under `adapters/enrollment-stub/src/fixtures.ts` (no external
fetch). The golden tables above reference these by name. Canonical values:

```ts
// Actors (pseudonymous refs; class enforces authority invariants)
export const STAFF_GUIDE   = { ref: "actor_pseudo_guide_01",    class: "staff",    role: "guide" } as const;
export const STAFF_GUIDE_2 = { ref: "actor_pseudo_guide_02",    class: "staff",    role: "guide" } as const;
export const GUARDIAN      = { ref: "actor_pseudo_guardian_01", class: "guardian", role: "guardian" } as const;
export const CHILD         = { ref: "actor_pseudo_child_01",    class: "child",    role: "learner" } as const;
export const MODEL         = { ref: "model_advisor_01",         class: "model",    role: "advisor" } as const;
export const SYSTEM        = { ref: "system_relay_01",          class: "system",   role: "system" } as const;

export const TENANT = "gt100k";
export const T0 = "2026-07-20T14:03:11.000Z";          // injected Clock base (occurred_at)
export const T0_RECORDED = "2026-07-20T14:03:11.402Z"; // recorded_at (distinct from occurred_at)

// Enrollment handoff output (references only — DP-1)
export const ELIGIBLE_LEARNER = {
  learner_ref: "learner_synth_001",
  accommodation_profile_ref: "accom://profile/synth_001",
  eligibility_evidence_ref: "evidence://eligibility/synth_001#sha256:aa11",
  track: "A",
} as const;

// Policy allow-list (local OPA analogue)
export const POLICY_V1 = {
  policy_version: "opa-bundle/2026-07-20a",
  rules: [{ role: "guide", purpose: "onboarding.schedule", jurisdictions: ["US-CA"] }],
} as const;

// Consent fixtures (document_hash is a synthetic placeholder — FR-015)
export const CONSENT_ONBOARDING = {
  subject_ref: "learner_synth_001", guardian_authority: true,
  purpose: "onboarding.schedule", data_categories: ["schedule"], processors: ["core"],
  jurisdiction: "US-CA", effective_at: "2026-07-01T00:00:00.000Z", expiry_at: "2026-12-31T00:00:00.000Z",
  collection_method: "guardian_portal", document_hash: "sha256:stub-onboarding",
  withdrawal_state: { withdrawn: false },
} as const;
export const CONSENT_ONBOARDING_EXPIRED  = { ...CONSENT_ONBOARDING, expiry_at: "2026-07-10T00:00:00.000Z" } as const;
export const CONSENT_ONBOARDING_WITHDRAWN = {
  ...CONSENT_ONBOARDING, withdrawal_state: { withdrawn: true, withdrawn_at: "2026-07-15T00:00:00.000Z" },
} as const;
export const CONSENT_RESEARCH = { ...CONSENT_ONBOARDING, purpose: "research.trial" } as const; // active, no policy rule
```

Each fixture is wrapped with a complete `EnvelopeHeader` (via a `withEnvelope(...)` fixture helper) whose
fields match `FIXTURE.validEnvelope`; the golden tables assume that wrapping.

## Env / secrets

This slice needs **no secrets and no runtime env** (pure TS, synthetic data, in-memory adapters), so the
gate never fails on missing env. A `.env.local` placeholder + its `.gitignore` line are added in the
**final shared-file task** (T047, alongside the root `tsconfig.json` references) — the single
human-reconciled merge point — so no root file is touched mid-build. The placeholder exists only so a
future production adapter can read config without breaking `pnpm build`:

```dotenv
# .env.local (placeholders only — this slice reads none of these; safe defaults)
GT100K_TENANT_ID=gt100k
GT100K_POLICY_VERSION=opa-bundle/2026-07-20a
# Deferred production adapters (unused in this slice):
# DATABASE_URL=
# REDPANDA_BROKERS=
# TEMPORAL_ADDRESS=
# OPA_BUNDLE_URL=
```

No real credentials, tokens, or machine paths are committed (ENG constraint; `gt100k` is public).

## Assumptions

- **TypeScript reference, production stack deferred**: The buildable definition of done is **`tsc -b`
  + Vitest**, so this slice is a pure-TS, locally-testable reference of the spine's *core logic*. The
  production targets named in FOUNDATION_PRD §4/§9/§11/§13 (Go services, Redpanda, Temporal, real OPA/Rego
  bundles, PostgreSQL, AWS + Terraform, managed runtimes) are the **deferred production direction**,
  described in plan.md, **not** built or tasked here.
- **Legal layer is mechanical + stubbed**: consent/assent are modeled as *mechanisms* (purpose, expiry,
  withdrawal, refusal-honored) with placeholder legal artifacts (document hash, signature = synthetic
  strings). No real legal validity, e-signature, or jurisdiction law is implemented (FR-015).
- **Scope trims to the buildable core**: real crypto-shred deletion, Buf/Protobuf wire generation,
  mTLS/network security, observability stack, CI/CD signing, and the override/appeal **human workflows**
  are **out of scope / deferred** and appear as notes or interface stubs, not tasks. The six contract
  **shapes + invariants** (including `OverrideRecord`/`Appeal`) **are** in scope.
- **In-process event spine**: the "event spine" is an in-process bus + outbox, not Redpanda; it proves the
  outbox + idempotent-consumer *pattern* whose correctness is logic, not infrastructure.
- **Enrollment handoff is a stub**: the admissions Track A/Track B eligibility interface is consumed via a
  stub honoring the agreed contract shape (FR-013, DP-1); the pipeline itself is the admissions team's
  boundary.
- **Parallel-safe layout**: all new code lives in `packages/platform-contracts`, `packages/platform-spine`,
  and `adapters/spine-repo-memory` / `adapters/spine-bus-memory` / `adapters/enrollment-stub`; the only
  shared-root edits (root `tsconfig.json` composite references, plus the `.env.local` placeholder and its
  `.gitignore` line) are grouped into the final flagged task (T047).
- **Single tenant / synthetic cohort**: `tenant_id` is present and checked in the header, but multi-tenant
  isolation testing beyond header scoping is out of scope for this slice.
