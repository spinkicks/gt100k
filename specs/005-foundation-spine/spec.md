# Feature Specification: Platform Foundation Spine (Real Production Stack)

**Feature Branch**: `005-foundation-spine`

**Created**: 2026-07-20

**Status**: Loop-ready (Draft) — **real-stack track**

**Input**: Baby PRD [`docs/prd/FOUNDATION_PRD.md`](../../docs/prd/FOUNDATION_PRD.md) (the signed event + consent + policy + audit substrate), scoped from [`PRD.md`](../../docs/prd/PRD.md) §26 (stack), §26.2 (backend/language ownership), §26.4 (repo/delivery), §27 (service boundaries + command path), §28 (versioned contracts), §29 → [`GOVERNANCE.md`](../../docs/prd/GOVERNANCE.md) G7 (privacy/data separation), §30 (reliability/security), §32.1 (Month-1 gate). **Buildable-now slice: the real production stack** — **Go** services and libraries; **Protobuf/gRPC contracts via `buf`** with generated Go; a transactional **outbox** + idempotent consumers over a **Redpanda** event spine; **OPA/Rego** policy-as-code on the command path; **PostgreSQL** per-service state; a **Temporal** durable deletion workflow; and **Terraform** (validate-only) modules for the AWS runtime. Synthetic learners only; the legal/consent layer is modeled mechanically and stubbed. Real cloud provisioning (`terraform apply`) and managed-runtime ops are the deferred production direction.

> ## ⚠️ SEPARATE BUILD TRACK — NOT the TypeScript overnight loop
>
> **This feature targets the REAL production stack (Go + buf + OPA + Terraform + Redpanda + Temporal +
> PostgreSQL). Its definition of done is NOT `tsc -b` / `vitest`.** It has its **own build gate** (see
> [Build gate + pinned toolchain](#build-gate--pinned-toolchain)):
> `buf lint` + `buf breaking`, `go vet ./... && go build ./... && go test ./...` (Go pinned),
> `opa test policies/`, and `terraform validate` / `terraform fmt -check` (**validate-only — NO cloud apply**).
>
> **Therefore it must NOT be run in the TypeScript loop batch.** The factory loop harness
> (`harness/run-loop.sh`) auto-detects a JS/TS lockfile and gates on `pnpm typecheck` + `vitest`; it has
> **no** Go/buf/OPA/Terraform toolchain and will mis-gate this feature. This feature **requires a
> Go + buf + OPA + Terraform-capable runner** (a dedicated CI workflow + a Docker-capable host for the
> optional testcontainers lane). If the only available runner is the TS loop, **do not enqueue this
> feature there** — flag that a Go/infra-capable runner is required. See
> [Decisions already made](#decisions-already-made-do-not-re-open) → *Separate track*.

> ## How to read this spec (loop guidance)
>
> This document is written to be built by an autonomous build loop whose definition of done is the
> **real-stack gate** above. It is **navigable per phase**: read only the section for the phase you are on.
> The build order is [Phasing (P0…P7)](#phasing-p0p7); every success criterion is machine-checkable and
> mapped to a named test (`go test` / `opa test` / `buf` / `terraform`) in
> [Success Criteria](#success-criteria-mandatory); every computed result has an exact
> [golden value](#golden-values--tolerances). If something is not specified here, apply the
> [Defaults for the unspecified](#defaults-for-the-unspecified) rule — do **not** stop to ask.

## Why this feature is first

The parent PRD is explicit: *"The team implements `LearnerEvent`, consent, decision, override, appeal, and audit contracts first because all later work depends on them"* (parent §32.1). Every later domain service (Go, per §26.2) emits these contracts onto this spine and reads policy from it. If the spine is wrong, every feature above it inherits the defect. This slice builds the **real substrate** — the `buf` contract registry, the Go identity/consent/assent + purpose-authorization + event-envelope + outbox code, the OPA/Rego policy, the Temporal deletion workflow, and the Terraform footprint — so the substrate is proven with its production tools before any consumer is layered on.

---

## Scope Fence *(hard — read before building)*

The loop builds the **whole** spec. Anything below the fence line is a task; anything above the
"Out of scope" line must **not** be built, only referenced as a note or an interface stub.

### In scope (buildable now — build this)

1. **`buf` Protobuf contract registry** — `proto/` with `buf.yaml`, `buf.gen.yaml`, `buf.lock`; the common **envelope header** plus the six foundation contracts (`LearnerEvent`, `ConsentGrant`, `AssentRecord`, `DecisionRecord`, `OverrideRecord`, `Appeal`), the append-only **audit** message, and the **enrollment-handoff** message; `buf lint` clean and `buf breaking` enforced against `main` (FR-001, FR-002, FR-006, FR-017, FR-018).
2. **Generated Go contracts** — `protoc-gen-go` (+ `protoc-gen-go-grpc`) output committed under `proto/gen/go/`, with a `buf generate` freshness check (`git diff --exit-code`) so the checked-in code always matches the schema (FR-006).
3. **`pkg/platform` Go library** — envelope validation + the six-contract invariant validators encoded in Go over the generated types: append-only, active-consent, refusal-honored, **model-can-never-fill `authorized_human`**, **four-eyes override**, **appeal reviewer independence**, distinct event/ingest time (FR-001–FR-005, FR-017, FR-018).
4. **`services/identity-consent` Go service** — pseudonymous identity resolution, `ConsentGrant`/`AssentRecord` domain (`GrantConsent`, `WithdrawConsent`, `RecordAssent`, `IsConsentActive`, `AssentBlocks`), and the purpose-authorization **edge** that calls OPA and records the `policy_version` (FR-003, FR-004, FR-007, FR-008, FR-012).
5. **OPA/Rego policy-as-code** — `policies/` Rego for deny-by-default purpose authorization (role + purpose + active consent + jurisdiction), the four-eyes override classes, and the model-authority-forgery deny, with `opa test policies/` decision-table + subgroup + deny-by-default coverage (FR-007, FR-008, FR-017; GOVERNANCE G7).
6. **`pkg/spine` transactional outbox + idempotent consumers** — atomic `DecisionRecord`+outbox write, a `relay` (at-least-once, idempotency key), and consumers that dedup on `contract_id`; behind interfaces with **in-memory fakes** (default gate) **and** **testcontainers-backed** Redpanda+PostgreSQL integration tests under a build tag (FR-009, FR-010).
7. **Append-only audit log** — every `DecisionRecord`, `OverrideRecord`, `Appeal` filing, consent change, and policy `deny` writes a replayable entry (FR-011).
8. **Command path** `HandleCommand` — resolve actor → check consent → authorize (OPA) → commit atomically → relay → project → audit (FR-007–FR-011).
9. **Temporal deletion workflow** — a durable `DeletionWorkflow` with idempotent, compensating activities across the spine stores, provable via the Temporal Go **test suite** (in-memory `TestWorkflowEnvironment`) — the buildable form of the §13 cross-store erasure (FR-014).
10. **Stubbed enrollment handoff** — a Go consumer of the admissions `EligibleLearner` message producing a synthetic learner (references only, never raw data), honoring the agreed contract shape so cutover is config (FR-013).
11. **Terraform validate-only modules** — `infra/terraform/` account bootstrap, VPC, EKS, RDS, S3/KMS, IAM, and Redpanda/Temporal wiring **variables**, passing `terraform init -backend=false && terraform validate && terraform fmt -check` with **no** cloud apply (FR-019; FOUNDATION_PRD §4).
12. **The build gate itself** — a `Makefile`/script running the real-stack gate and a **GitHub Actions workflow** (`.github/workflows/foundation-spine.yml`) that runs it, path-scoped to this feature and **separate from the TS loop** (FR-020).
13. **In-repo synthetic seed fixtures** (Go `testdata/` + OPA input JSON) + a seeded smoke path green from iteration 1 ([Seed fixtures](#seed-fixtures-in-repo)).
14. **Interfaces for every I/O** + in-memory/stub adapters (the exact seams a production adapter slots into with zero domain change).

### Out of scope / deferred (do NOT build; describe as production direction only)

- **Real AWS provisioning** — `terraform apply`, the AWS Organization, live accounts, EKS clusters, RDS instances, KMS keys, CloudFront (needs credentials + org access). Validate-only IaC is in scope; **apply is deferred** (FOUNDATION_PRD §4).
- **Managed-runtime ops** — running managed **Redpanda**/**Temporal** in US regions under child-data DPAs; Argo CD deploy; OpenFeature release rings; KEDA (FOUNDATION_PRD §4.5, §15). The **code** that talks to Redpanda/Temporal is in scope (behind interfaces, tested via testcontainers/test-suite); the **hosted runtime** is deferred.
- **Real crypto-shred** — per-subject **KMS** key destruction on withdrawal (FOUNDATION_PRD §13). The Temporal workflow + activity **interfaces** are in scope; the KMS-backed shred activity is a stub/fake here.
- **Bundle & image signing** — cosign-signed OPA bundles, signed images, SBOMs, admission control (FOUNDATION_PRD §14.2, §15). Rego source + `opa test` + a `opa build` bundle artifact are in scope; **signing** is deferred.
- **mTLS / network security / observability wiring** — service-mesh mTLS, default-deny networks, OTel/Prometheus/Grafana collectors (FOUNDATION_PRD §14, §16). The envelope already carries `correlation_id`/`causation_id`; live tracing export is deferred.
- **Override/Appeal human workflows** — four-eyes approval routing/notifications, appeal SLA timers + remedy execution. The `OverrideRecord`/`Appeal` **contracts + invariants** are in scope; the human workflows are deferred.
- **Application shells / feature UIs** — no Next.js app; the slice is exercised by tests + a headless demo.
- **Per-service Go module split + `go.work`** — this slice ships as a **single Go module** for a clean `go build ./...` gate; the per-deployable module split (parent §26.2) is a deferred refactor behind the same package boundaries.
- **DR drills / RTO-RPO sign-off** (FOUNDATION_PRD §4.6, §14.1).

### Non-goals (never, in any phase)

- No real child data. Every fixture is **synthetic** (Constitution V; FOUNDATION_PRD §3.3).
- No real legal validity: document hashes, signatures, and legal artifacts are **placeholder strings** (FR-015).
- No automated consequential decision: **no code path** lets a `MODEL`/`SYSTEM` actor fill `DecisionRecord.authorized_human` (Constitution I; parent §28).
- No wall-clock reads or random ids inside the pure invariant/validator core — the clock and id generator are injected; the Temporal workflow uses `workflow.Now`/deterministic APIs (FR-016).
- No cloud `apply`, no live broker, no real KMS, no secrets committed (ENG; gitleaks; `gt100k` is public).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emit a traceable, invariant-enforced contract (Priority: P1) 🎯 MVP

Any consequential action produces a versioned Protobuf contract that carries the **common envelope header** (so it traces to the consent that permitted it, the policy that allowed it, the evidence behind it, the software version that produced it, and the person accountable) and satisfies the contract's invariants. A builder can construct a `LearnerEvent`, `ConsentGrant`, `AssentRecord`, `DecisionRecord`, `OverrideRecord`, or `Appeal` from the generated Go types, validate it, and be certain a malformed or invariant-violating record is rejected — most importantly that **a model output can never fill `DecisionRecord.authorized_human`** and that a consequential `DecisionRecord` cannot be finalized without a named human and a policy result. The schema is owned by `buf`: `buf lint` keeps it clean and `buf breaking` rejects an incompatible change.

**Why this priority**: This is the atomic unit of the whole platform — "implement the contracts first" (parent §32.1). Nothing else has anything to bind to until the envelope and the contracts exist, are code-generated, and enforce their invariants.

**Independent Test**: `buf lint` + `buf breaking` pass; `buf generate` output matches the committed Go; Go tests construct each contract with a synthetic actor, assert a complete envelope validates and an incomplete one is rejected by field name; assert a `DecisionRecord` with a `MODEL` actor in `authorized_human` is rejected while one with a named human + policy result passes; assert distinct `occurred_at`/`recorded_at`.

**Acceptance Scenarios**:

1. **Given** the `proto/` registry, **When** `buf lint` and `buf breaking` (against `main`) run, **Then** lint passes and a change that removes/renames a field or reuses a tag fails `buf breaking`, while adding a field under a new tag passes.
2. **Given** a synthetic actor reference and purpose, **When** a `LearnerEvent` is built with a complete envelope header and validated, **Then** validation passes and the record exposes `consent_purpose`, `policy_version`, `evidence_refs`, `schema_version`, `correlation_id`/`causation_id`, and distinct `occurred_at`/`recorded_at`.
3. **Given** a `DecisionRecord` whose `authorized_human` is a `MODEL`- or `SYSTEM`-class actor, **When** it is validated, **Then** validation **fails** with an authority-forgery error, and no code path allows a model to fill that field.
4. **Given** a consequential `DecisionRecord` missing either `authorized_human` or `policy_version`, **When** it is validated, **Then** validation fails; supplying both a named human and a policy result makes it pass.
5. **Given** any contract with a missing/empty required envelope field, **When** it is validated, **Then** validation fails naming the field.

### User Story 2 - Grant/withdraw consent, honor child assent, and authorize by purpose via OPA (Priority: P2)

The `identity-consent` service resolves a **pseudonymous actor reference** (downstream never sees legal identity), records `ConsentGrant`s (purpose, jurisdiction, expiry, withdrawal state) and `AssentRecord`s where a **child's refusal is honorable and guardian consent cannot override it**, and calls the **OPA/Rego** policy on the command path to decide `allow`/`deny` for a command by role + purpose + active consent + jurisdiction, **deny-by-default**, returning the `policy_version` that decided it. Withdrawing consent **blocks new processing** for that purpose.

**Why this priority**: This is the gate's consent + authority core (FOUNDATION_PRD §10, §11). It depends on the contracts (US1) and shows "an action is only permitted if consent and policy allow it, and a person — never a machine — is accountable" as a real OPA decision on the command path.

**Independent Test**: `opa test policies/` passes the full decision table; Go tests grant a consent → authorize a matching command (allow, with policy version); withdraw it → authorize again (deny, recorded); attempt an unknown role/purpose (deny-by-default); mismatch jurisdiction (deny); record a child refusal against a guardian consent and confirm the optional collection is blocked.

**Acceptance Scenarios**:

1. **Given** an active `ConsentGrant` for purpose P and jurisdiction J, **When** an actor with a permitted role requests purpose P in jurisdiction J, **Then** OPA returns `allow` with a `policy_version`.
2. **Given** no active consent for purpose P (never granted, expired, or withdrawn), **When** P is requested, **Then** OPA returns `deny` reason `no_active_consent` with a `policy_version`, and the deny is recorded.
3. **Given** a request whose role or purpose is unknown to the policy, **When** it is evaluated, **Then** the result is `deny` reason `deny_by_default`, never a silent allow.
4. **Given** a `ConsentGrant` whose `jurisdiction` does not match the request, **When** evaluated, **Then** the result is `deny` reason `jurisdiction_mismatch`.
5. **Given** a present guardian `ConsentGrant` for an optional purpose **and** a child `AssentRecord` recording an honorable refusal, **When** that optional collection is attempted, **Then** it is blocked — guardian consent does not substitute for child assent.
6. **Given** an active consent, **When** the guardian withdraws it, **Then** subsequent processing for that purpose is denied and the Temporal deletion workflow is started (once).

### User Story 3 - Move an event through the transactional outbox with idempotent consumers (Priority: P3)

A command writes its business state (a `DecisionRecord`) **and** an outbox row **atomically** in PostgreSQL, a relay publishes the resulting `LearnerEvent` to Redpanda with an **idempotency key**, and consumers update their projection **exactly once** under at-least-once delivery by **rejecting a duplicate `contract_id`**. Every consequential action also writes an **append-only audit entry**. The logic is proven with in-memory fakes (default gate) and against **real Redpanda + PostgreSQL via testcontainers** (integration lane).

**Why this priority**: This is the gate's traceability + durability mechanic (FOUNDATION_PRD §8, §9; parent §30). It proves "no dual-write race, no double-apply, no acknowledged loss," which every later producer/consumer relies on.

**Independent Test**: Run a command through the full path; replay the same `contract_id` several times → projection applies exactly once; deliver events out of `occurred_at` order → each distinct `contract_id` applies exactly once; simulate a relay retry → no acknowledged loss; confirm an audit entry exists. Integration lane repeats the burst against testcontainers Redpanda+PostgreSQL.

**Acceptance Scenarios**:

1. **Given** an authorized command, **When** it is handled, **Then** the `DecisionRecord` and its outbox row commit together (both or neither) in one PostgreSQL transaction, and an audit entry is written.
2. **Given** a staged outbox row, **When** the relay publishes it and is retried (at-least-once), **Then** the consumer projection reflects the event exactly once (duplicate `contract_id` rejected).
3. **Given** a synthetic burst of N events, **When** they flow outbox → Redpanda → projection, **Then** every acknowledged event is reflected with no loss and no duplicate application.
4. **Given** events delivered out of `occurred_at` order, **When** consumed, **Then** dedup is by `contract_id` (not time) so each distinct event applies exactly once.
5. **Given** a consumer that fails on an event, **When** the event is retried, **Then** processing is idempotent and the event is not lost (dead-letter capable).

### User Story 4 - Record an override and an appeal without erasing the original (Priority: P4)

A named authority can record an **`OverrideRecord`** that supersedes a prior `DecisionRecord` — for an override class (admissions, public exposure, safeguarding, credential revocation) it requires **four-eyes**: two *distinct human* approvers (never model/system), a rationale, evidence, and a review date — and the override **creates a new record that preserves the original** (append-only, `causation_id` links back). Separately, an **`Appeal`** can be filed against a decision; its **independent reviewer cannot be the original decision owner**, and filing it never mutates or reduces access to the target. The four-eyes and reviewer-independence invariants are enforced both in Go (`pkg/platform`) and in OPA (`policies/`).

**Why this priority**: These are the two remaining foundation contracts named in parent §32.1 and §28. They complete the contract set the whole platform binds to; they depend on US1 only, so they can build in parallel with US2/US3.

**Independent Test**: `OverrideRecord` with two distinct human approvers → passes; with a model approver → rejected; with a single approver for an override class → rejected; target `DecisionRecord` unchanged. `Appeal` whose `independent_reviewer` differs from the target's `authorized_human` → passes; equal → rejected; `late`/`reopened` recordable. OPA `opa test` mirrors the four-eyes + forgery denies.

**Acceptance Scenarios**:

1. **Given** a prior `DecisionRecord`, **When** an `OverrideRecord` is built for an override class with two distinct human approvers, a rationale, evidence, and a review date, **Then** validation passes and the original is preserved (new record links via `causation_id`).
2. **Given** an `OverrideRecord` whose approver set contains a `MODEL`/`SYSTEM` actor, or fewer than two distinct approvers for an override class, **When** validated, **Then** validation fails (authority forgery / four-eyes) in Go **and** OPA denies.
3. **Given** a target `DecisionRecord` with `authorized_human` H, **When** an `Appeal` names H as its `independent_reviewer`, **Then** validation fails with a reviewer-conflict error; a different reviewer passes.
4. **Given** an `Appeal`, **When** it is filed or later reopened/marked late, **Then** the status is recordable and filing it does not alter the target (append-only).

### User Story 5 - Provision, delete, and provision on Terraform-validated infrastructure (Priority: P5)

A synthetic fixture learner arrives through the **stubbed enrollment handoff**, and — on consent withdrawal — the **Temporal deletion workflow** removes it across the spine stores with idempotent, compensating activities, preserving the audit fact that deletion occurred. All of the runtime the spine targets is described as **Terraform** modules that pass `terraform validate`/`fmt -check` (Core + Identity accounts provisioned in the module graph; Public/Sandbox/Sensitive reserved), with **no** cloud apply.

**Why this priority**: This closes the §17 construction-gate loop (provision → consent → delete) and proves the AWS footprint exists as reviewable IaC, at the buildable (validate-only) level, before any apply.

**Independent Test**: `enrollment-integration` yields a synthetic `EligibleLearner` (references only); the Temporal test suite runs the deletion workflow to completion (and a compensation path on an injected activity failure); `terraform validate` and `terraform fmt -check` pass on every module with `-backend=false`.

**Acceptance Scenarios**:

1. **Given** the enrollment stub, **When** `EligibleLearner` is consumed, **Then** the spine provisions a pseudonymous `actor_ref` and only references (accommodation-profile ref, eligibility-evidence ref) transfer — never raw data.
2. **Given** a withdrawn consent, **When** the deletion workflow runs, **Then** every store activity is invoked idempotently, an injected activity failure triggers compensation + retry to completion, and the append-only audit entry that deletion occurred is preserved.
3. **Given** `infra/terraform/`, **When** `terraform init -backend=false && terraform validate && terraform fmt -check` run per module, **Then** all pass with no cloud credentials and no resource created.

### Edge Cases

- **Append-only**: a contract is immutable once recorded; a correction is a **new** record whose `causation_id` references the prior. The store rejects re-writing an existing `contract_id`.
- **Authority forgery**: no code path — including a `SYSTEM`/`MODEL` actor — can fill `DecisionRecord.authorized_human` or appear as an `OverrideRecord` approver; a consequential record with no policy result is invalid (enforced in Go **and** OPA).
- **Consent timing**: expired or withdrawn consent is *not active*; the active window is `[effective_at, expiry_at)` minus any withdrawal (immediate).
- **Deny-by-default**: any role/purpose/jurisdiction not explicitly allowed by Rego is denied; there is no fall-through allow (an `opa test` asserts an empty policy denies).
- **Duplicate delivery (replay)**: re-delivering the same `contract_id` is a no-op at the consumer; re-relaying an outbox row does not double-apply downstream.
- **Out-of-order delivery**: consumers dedup on `contract_id`, not time; the two timestamps stay distinct and are never used for dedup.
- **Withdrawal cascade**: withdrawal blocks *new* processing, starts the Temporal deletion workflow **once**, and every subsequent command for that purpose denies (`no_active_consent`) with a `policy_deny` audit entry; the append-only audit fact that withdrawal occurred is preserved (real KMS crypto-shred deferred — activity stub).
- **Jurisdiction/residency**: a mismatch between a consent's `jurisdiction` and the request's denies (`jurisdiction_mismatch`), mirroring the production data-residency rule (FOUNDATION_PRD §4.8; GOVERNANCE G7).
- **`buf breaking`**: removing/renaming a field or reusing a tag fails; adding a field under a new tag passes (deprecation-window discipline modeled by the gate).
- **Temporal determinism**: workflow code reads time via `workflow.Now` and ids via `workflow.SideEffect`; a replay test asserts determinism.
- **Terraform**: modules validate with `-backend=false`; no data source requires live credentials at validate time.
- **Synthetic legal layer**: consent/assent legal semantics are modeled mechanically; document hashes/signatures/legal validity are stubbed strings, not real legal artifacts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define a versioned **common envelope header** (Protobuf message `Envelope`) carried by every contract — `contract_id`, `schema_version`, `tenant_id`, `actor_ref`, `occurred_at`, `recorded_at`, `correlation_id`, `causation_id`, `consent_purpose`, `policy_version`, optional `model_version`, `evidence_refs` — and MUST provide a Go validator rejecting any missing/empty required field, naming it (parent §28; FOUNDATION_PRD §7.1).
- **FR-002**: The system MUST define Protobuf `LearnerEvent` with `event_type`, pseudonymous `learner_ref`, distinct event/ingest time, source, context, `payload_schema`, and `evidence_refs`; consumers MUST treat it as immutable and idempotent (FOUNDATION_PRD §7.2).
- **FR-003**: The system MUST define Protobuf `ConsentGrant` with `subject_ref`, guardian authority, `purpose`, data categories, processors, `jurisdiction`, `effective_at`/`expiry_at`, collection method, document hash (stub), `withdrawal_state`; and a Go `IsConsentActive(grant, at)` rule such that data may be used **only for an active matching purpose** (FOUNDATION_PRD §7.2, §10.2).
- **FR-004**: The system MUST define Protobuf `AssentRecord` with `child_ref`, age band, notice version, choices shown, `response` (assent/refusal/dissent), facilitator, timestamp, renewal date, and an `honorable` flag; and MUST enforce that a recorded honorable refusal blocks the optional collection — **guardian consent cannot substitute for child assent** (Constitution II; FOUNDATION_PRD §7.2, §10.2).
- **FR-005**: The system MUST define Protobuf `DecisionRecord` with `decision_type`, subject, candidates, outcome, reason codes, evidence snapshot, uncertainty, policy + optional model versions, `authorized_human`, effective time, and a `consequential` flag; and MUST enforce that a consequential record requires **both** a named `authorized_human` **and** a policy result, that records are **append-only**, and that **a model output cannot fill `authorized_human`** (Constitution I; parent §28; FOUNDATION_PRD §7.2).
- **FR-006**: Contracts MUST be owned by **`buf`**: a single `proto/` registry generates Go via `buf generate`; `buf lint` MUST be clean and `buf breaking` MUST reject breaking changes against `main`; the committed generated Go MUST match the schema (a `buf generate` + `git diff --exit-code` check) (parent §28).
- **FR-007**: Authorization MUST be **OPA/Rego policy-as-code** evaluated on the command path (Go calling the OPA Go SDK against the compiled bundle), returning `allow`/`deny` for a request by `role` + `purpose` + active `consent` + `jurisdiction`, **deny-by-default**, with the `policy_version` that decided it (FOUNDATION_PRD §11; GOVERNANCE G7; parent §27).
- **FR-008**: Authorization MUST **deny** with reason `jurisdiction_mismatch` when a matching active consent exists for the purpose but its `jurisdiction` does not agree with the request's (data-residency; FOUNDATION_PRD §4.8, §11; GOVERNANCE G7).
- **FR-009**: The system MUST provide a **transactional outbox**: business state and an outbox row committed **atomically** in one PostgreSQL transaction, and a relay publishing each row to Redpanda with an **idempotency key**, at-least-once (FOUNDATION_PRD §8, §9).
- **FR-010**: Event consumers MUST be **idempotent**: a duplicate `contract_id` is rejected and the first valid result preserved, so at-least-once and out-of-order delivery cause no double application (FOUNDATION_PRD §9).
- **FR-011**: The system MUST maintain an **append-only audit log** to which every `DecisionRecord`, `OverrideRecord`, `Appeal` filing, consent change, policy `deny`, and withdrawal writes an entry carrying the envelope header, actor, policy result, and outcome; entries MUST be append-only and tenant-scoped and support decision replay (FOUNDATION_PRD §7.2, §17).
- **FR-012**: Downstream domain logic MUST receive only a **pseudonymous actor reference** and purpose scope — never legal identity (FOUNDATION_PRD §10.1, §10.3; GOVERNANCE G7).
- **FR-013**: The system MUST consume a **stubbed enrollment handoff** (Protobuf `EligibleLearner`) producing a synthetic learner (roster entry, accommodation-profile *reference*, eligibility-evidence *reference* — never raw responses) honoring the agreed shape so cutover is config, not a rewrite (FOUNDATION_PRD §7.3, §10.4).
- **FR-014**: Consent withdrawal MUST start a **Temporal deletion workflow** exactly once and block new processing for that purpose; the workflow's activities are idempotent with compensation, provable via the Temporal Go test suite; the real KMS crypto-shred activity is a stub here (FOUNDATION_PRD §13).
- **FR-015**: The whole slice MUST run on **synthetic data only**, with the legal/consent layer modeled mechanically and stubbed (document hashes, signatures = placeholder strings); no real child data, consent, admissions, or legal workflow (Constitution V; FOUNDATION_PRD §3.3, §19.2).
- **FR-016**: The invariant/validator core MUST be **pure and deterministic** — no I/O, no wall-clock reads, no random ids; the clock and id generator are injected; Temporal workflow code uses deterministic APIs, so contracts and decisions are **replayable** (Constitution I POL-004; parent §27).
- **FR-017**: The system MUST define Protobuf **`OverrideRecord`** (`target_decision`, `prior_outcome`, `new_outcome`, `authorized_role`, `override_class`, `rationale`, `evidence_refs`, `review_at`, `approvers`) and MUST enforce **four-eyes** for override classes (`admissions`, `public_exposure`, `safeguarding`, `credential_revocation`) — two distinct human approvers, none `MODEL`/`SYSTEM` — and that the override **creates a new record and preserves the original** (`causation_id` references `target_decision`), in Go **and** OPA (Constitution I/IX; parent §28; FOUNDATION_PRD §7.2).
- **FR-018**: The system MUST define Protobuf **`Appeal`** (`appellant_role`, `target_decision`, `grounds`, `submitted_evidence_refs`, `requested_remedy`, `status` ∈ `filed`/`under_review`/`resolved`/`reopened`/`late`, `independent_reviewer`, `deadlines`, `resolution`) and MUST enforce that the `independent_reviewer` cannot be the target's `authorized_human` and that filing neither mutates the target nor reduces access (Constitution I; parent §28; FOUNDATION_PRD §7.2).
- **FR-019**: The AWS runtime MUST be expressed as **Terraform** modules (account bootstrap, VPC, EKS, RDS, S3/KMS, IAM, Redpanda/Temporal wiring variables) passing `terraform init -backend=false && terraform validate && terraform fmt -check` with **no** cloud apply; Core + Identity modeled, Public/Sandbox/Sensitive reserved (FOUNDATION_PRD §4).
- **FR-020**: The feature MUST ship its **own build gate** (`buf lint`+`buf breaking`, pinned `go vet`/`build`/`test`, `opa test`, `terraform validate`/`fmt -check`) as a script + a **separate GitHub Actions workflow**, path-scoped and **not** part of the TS `tsc -b`/`vitest` loop (ENG; FOUNDATION_PRD §15).

### Key Entities *(include if feature involves data)*

- **Envelope**: the common traceability header on every contract (FR-001).
- **LearnerEvent / ConsentGrant / AssentRecord / DecisionRecord / OverrideRecord / Appeal**: the six foundation contracts (FR-002–FR-005, FR-017, FR-018). All six are **in scope**.
- **ActorRef**: a pseudonymous actor reference with a `class` (`HUMAN`/`GUARDIAN`/`CHILD`/`STAFF`/`MODEL`/`SYSTEM`) that enforces authority invariants (FR-005, FR-012, FR-017).
- **AuditEntry**: an append-only record of a consequential action with its envelope, actor, policy result, and outcome (FR-011).
- **EligibleLearner (stub)**: the synthetic enrollment-handoff output — roster entry + accommodation-profile ref + eligibility-evidence ref + track (FR-013).
- **PolicyInput / PolicyDecision**: the OPA input document and its `{allow, reason, policy_version}` result (FR-007).
- **OutboxRow**: a staged, not-yet-relayed event with an idempotency key and relay state (FR-009).

## Success Criteria *(mandatory)*

### Measurable Outcomes (each mapped to a test — the gate is the [real-stack gate](#build-gate--pinned-toolchain))

- **SC-001**: `buf lint` passes and `buf breaking` (against `main`) fails a field removal/rename/tag-reuse and passes a new-tag field addition, in **100%** of cases; `buf generate` output matches committed Go (`git diff --exit-code`).
- **SC-002**: **100%** of emitted contracts validate with a complete, traceable envelope; any record missing a required field is rejected naming the field in **100%** of attempts.
- **SC-003**: A `DecisionRecord` **cannot** be finalized without a named `authorized_human` and a policy result, and a `MODEL`/`SYSTEM`-class actor filling `authorized_human` is rejected in **100%** of attempts (Go **and** OPA); no code path permits it.
- **SC-004**: OPA authorization is **deny-by-default**: a command with no active matching consent, or a role/purpose/jurisdiction not explicitly allowed, is denied with a recorded `policy_version` and the exact reason code in **100%** of such cases; an actively-consented, permitted, jurisdiction-matching request is allowed. `opa test policies/` is green.
- **SC-005**: Under at-least-once **and** out-of-order delivery, replaying the same `contract_id` any number of times produces **exactly one** applied projection, and a synthetic burst of N events flows outbox → bus → projection with **no acknowledged loss** (count in = count applied) — proven with in-memory fakes **and** (integration lane) testcontainers Redpanda+PostgreSQL.
- **SC-006**: After a guardian withdraws consent, **zero** new processing for that purpose is accepted, the Temporal deletion workflow is started **exactly once**, and the append-only audit entry that the change occurred is preserved (Temporal test suite).
- **SC-007**: A child `AssentRecord` honorable refusal blocks the corresponding optional collection **even when** a guardian `ConsentGrant` is present, in **100%** of such cases.
- **SC-008**: An `OverrideRecord` for an override class validates **only** with two distinct human approvers (none `MODEL`/`SYSTEM`); any set with a model/system actor or fewer than two distinct approvers is rejected in **100%** of attempts (Go + OPA); the target `DecisionRecord` is byte-for-byte unchanged after an override, and an audit entry is written.
- **SC-009**: An `Appeal` whose `independent_reviewer` equals the target's `authorized_human` is rejected in **100%** of attempts; a distinct reviewer passes; `late`/`reopened` are recordable; the target is unchanged after filing.
- **SC-010**: Every module under `infra/terraform/` passes `terraform init -backend=false && terraform validate && terraform fmt -check` with **no** cloud credentials and **no** resource created (validate-only).
- **SC-011**: The full slice's gate — `buf lint` + `buf breaking`, `go vet ./... && go build ./... && go test ./...` (pinned Go), `opa test policies/`, `terraform validate`/`fmt -check` — runs **synthetic-only** and green, requiring **no** live Redpanda/Temporal/OPA-server/PostgreSQL/cloud (the default `go test` lane uses in-memory fakes + the Temporal test suite; the testcontainers lane is opt-in behind `-tags=integration`).

### SC → test mapping

| SC | Test / command | Golden ref |
|---|---|---|
| SC-001 | `buf lint`, `buf breaking`, `proto/` CI freshness check | [G-BUF](#g-buf--schema-compatibility) |
| SC-002 | `go test ./pkg/platform/...` `envelope_test.go` | [G-ENV](#g-env--envelope-validation) |
| SC-003 | `go test ./pkg/platform/...` `decision_test.go` + `opa test policies/` | [G-DEC](#g-dec--decisionrecord-invariants) |
| SC-004 | `opa test policies/` + `go test ./services/identity-consent/...` `authz_test.go` | [G-AUTH](#g-auth--authorization-decisions) |
| SC-005 | `go test ./pkg/spine/...` `outbox_test.go` (+ `-tags=integration`) | [G-IDEM](#g-idem--idempotencydedup) |
| SC-006 | `go test ./workflows/deletion/...` `deletion_test.go` + `consent_test.go` | [G-WD](#g-wd--withdrawal-cascade) |
| SC-007 | `go test ./pkg/platform/...` `assent_test.go` | [G-ASSENT](#g-assent--assent-veto) |
| SC-008 | `go test ./pkg/platform/...` `override_test.go` + `opa test policies/` | [G-OVR](#g-ovr--overriderecord-four-eyes) |
| SC-009 | `go test ./pkg/platform/...` `appeal_test.go` | [G-APL](#g-apl--appeal-reviewer-independence) |
| SC-010 | `terraform validate` / `fmt -check` per module | [G-TF](#g-tf--terraform-validate-only) |
| SC-011 | `make gate` (whole gate) + `quickstart.md` | all |

---

## Golden Values & Tolerances

These are the **exact** expected results the acceptance tests assert, using the canonical
[seed fixtures](#seed-fixtures-in-repo). All timestamps are ISO-8601 UTC (Protobuf `google.protobuf.Timestamp`).
**Tolerance for all values is exact (±0)** — these are deterministic pure functions / policy decisions over
injected clock/ids and fixed fixtures. The one nuance: `occurred_at` and `recorded_at` must be **distinct**
but the exact offset is not asserted (only inequality).

### G-BUF — schema compatibility

| Change to `proto/gt100k/platform/v1/*.proto` | `buf lint` | `buf breaking` (vs `main`) |
|---|---|---|
| (none) — baseline | pass | pass |
| add `string new_note = 50;` to `DecisionRecord` (unused tag) | pass | pass |
| remove an existing field | pass | **FAIL** (`FIELD_NO_DELETE`) |
| rename an existing field (same tag) | pass | **FAIL** (`FIELD_SAME_NAME`) |
| reuse an existing tag number for a new field | pass | **FAIL** |
| message/enum name not `PascalCase`, field not `lower_snake_case` | **FAIL** (`STANDARD`) | n/a |

### G-ENV — envelope validation

Base header = `fixtures.ValidEnvelope`. `platform.ValidateEnvelope(h)` returns `nil` (no error).
For each row, clear the named field on a clone and assert the returned error's `Field`:

| Mutation | `ValidateEnvelope` result | Error `Field` |
|---|---|---|
| (none) — complete header | `nil` | — |
| `contract_id = ""` | `*NamedFieldError` | `"contract_id"` |
| `schema_version = ""` | `*NamedFieldError` | `"schema_version"` |
| `tenant_id = ""` | `*NamedFieldError` | `"tenant_id"` |
| `actor_ref = nil` | `*NamedFieldError` | `"actor_ref"` |
| `consent_purpose = ""` | `*NamedFieldError` | `"consent_purpose"` |
| `policy_version = ""` | `*NamedFieldError` | `"policy_version"` |
| `correlation_id = ""` | `*NamedFieldError` | `"correlation_id"` |
| `causation_id = ""` | `*NamedFieldError` | `"causation_id"` |
| `occurred_at = nil` | `*NamedFieldError` | `"occurred_at"` |
| `evidence_refs = nil` | `nil` (empty allowed; nil slice OK) | — |
| `model_version = ""` (unset) | `nil` (optional) | — |

### G-DEC — `DecisionRecord` invariants

Using `fixtures.StaffGuide` (class `STAFF`), `fixtures.Model` (class `MODEL`), `fixtures.System` (class `SYSTEM`):

| Decision | `ValidateDecisionRecord` result | Error type |
|---|---|---|
| consequential, `authorized_human=StaffGuide`, `policy_version="opa-bundle/2026-07-20a"` | `nil` | — |
| consequential, `authorized_human=Model` | error | `*AuthorityForgeryError` (`Field:"authorized_human"`) |
| consequential, `authorized_human=System` | error | `*AuthorityForgeryError` |
| consequential, `authorized_human=nil` | error | `*NamedFieldError` (`Field:"authorized_human"`) |
| consequential, `policy_version=""` | error | `*NamedFieldError` (`Field:"policy_version"`) |
| non-consequential (`consequential=false`), no `authorized_human` | `nil` | — |

Append-only: `AssertAppendOnly(map[string]bool{"cid_0001":true}, "cid_0001")` returns `*AppendOnlyError`;
`AssertAppendOnly(..., "cid_0002")` returns `nil`.

OPA mirror (`data.gt100k.authz.deny_authority_forgery`): `input.authorized_human.class ∈ {"MODEL","SYSTEM"}` ⇒ deny.

### G-ASSENT — assent veto

| `AssentRecord` | `AssentBlocks(r)` |
|---|---|
| `honorable=true, response=REFUSAL` | `true` |
| `honorable=true, response=DISSENT` | `true` |
| `honorable=true, response=ASSENT` | `false` |
| `honorable=false, response=REFUSAL` | `false` |

SC-007: with `fixtures.ConsentOnboarding` (guardian, active) present **and** an
`AssentRecord{honorable:true, response:REFUSAL}`, the optional collection is blocked because
`AssentBlocks` is `true` — guardian consent does not override it.

### G-AUTH — authorization decisions (OPA)

Rego package `gt100k.authz`. `policy_version="opa-bundle/2026-07-20a"`, one rule:
`{role:"guide", purpose:"onboarding.schedule", jurisdictions:["US-CA"]}`. Request actor
`fixtures.StaffGuide` (role `guide`), `at="2026-07-20T14:03:11Z"`, subject `learner_synth_001`.
`data.gt100k.authz.decision` over the input document (every result carries
`policy_version:"opa-bundle/2026-07-20a"`):

| # | purpose | jurisdiction | consents | `allow` | `reason` |
|---|---|---|---|---|---|
| 1 | `onboarding.schedule` | `US-CA` | `[ConsentOnboarding]` | `true` | `"allow"` |
| 2 | `onboarding.schedule` | `US-CA` | `[]` | `false` | `"no_active_consent"` |
| 3 | `onboarding.schedule` | `US-CA` | `[ConsentOnboardingWithdrawn]` | `false` | `"no_active_consent"` |
| 4 | `onboarding.schedule` | `US-CA` | `[ConsentOnboardingExpired]` | `false` | `"no_active_consent"` |
| 5 | `onboarding.schedule` | `US-NY` | `[ConsentOnboarding]` (US-CA) | `false` | `"jurisdiction_mismatch"` |
| 6 | `research.trial` | `US-CA` | `[ConsentResearch]` (active, US-CA) | `false` | `"deny_by_default"` |

**Precedence (fixed, so reason codes are deterministic):** (a) filter consents to `active(_, at) && purpose == input.purpose`; empty ⇒ `no_active_consent`. (b) if none of those has `jurisdiction == input.jurisdiction` ⇒ `jurisdiction_mismatch`. (c) find a rule where `role == input.actor.role && purpose == input.purpose && input.jurisdiction ∈ jurisdictions`; none ⇒ `deny_by_default`. (d) else `allow`. The Go edge asserts the same table via the OPA Go SDK; `opa test policies/` asserts it directly.

### G-IDEM — idempotency/dedup

Consumer `Deliver(ctx, offsets, projection, event)` returns `(true, nil)` when applied, `(false, nil)` when a
duplicate `contract_id` is skipped. For the delivery sequence of `contract_id`s `[A, B, A, C, B, A]`:

- `Deliver` returns applied = `[true, true, false, true, false, false]`
- applied projection keys = `{A, B, C}`, `projection.Count() == 3`.

Out-of-order (G-IDEM/oo): deliver `O1{cid:"cid_O1", occurred_at:"14:05:00Z"}` then
`O2{cid:"cid_O2", occurred_at:"14:01:00Z"}` → both `true`, `Count()==2`; re-deliver `O2` → `false`,
`Count()==2` (dedup by `contract_id`, not time).

Burst (G-IDEM/burst): N = 100 distinct `contract_id`s, each delivered **twice** interleaved (200 `Deliver`
calls) → `true` exactly 100 times, `false` exactly 100 times, `projection.Count()==100`. The integration
lane (`-tags=integration`) reproduces the burst end-to-end via testcontainers Redpanda + PostgreSQL outbox.

### G-WD — withdrawal cascade

Start: `GrantConsent(ConsentOnboarding)`; `Authorize(#1)` ⇒ `allow`. Then
`WithdrawConsent(ctx, contractID, at="2026-07-20T15:00:00Z")`:

- `IsConsentActive(consent, "2026-07-20T15:00:01Z")` ⇒ `false`.
- `Authorize` (G-AUTH #1 inputs, now withdrawn) ⇒ `allow=false`, `reason="no_active_consent"`.
- The Temporal `DeletionWorkflow` is started **exactly once** with `subject_ref="learner_synth_001"` (asserted via the Temporal test env's started-workflow / `OnActivity` expectations).
- audit log contains **exactly one** entry with `action="consent_withdrawn"`.
- a subsequent `HandleCommand` for `onboarding.schedule` ⇒ `{denied:true, decision:nil}` and **exactly one** new audit entry `action="policy_deny"` (no `DecisionRecord` appended).
- Deletion workflow: all store activities invoked idempotently; an injected failure on the `crypto_shred` (stub) activity triggers compensation + retry to `Completed`; the audit entry that deletion occurred is preserved.

### G-OVR — `OverrideRecord` four-eyes

Target = a valid `DecisionRecord` `contract_id:"cid_0001"`, `authorized_human=StaffGuide`.
`OverrideRecord` base: `target_decision:"cid_0001"`, `override_class:"admissions"`,
`prior_outcome:"route_A"`, `new_outcome:"route_B"`, `authorized_role:"admissions_lead"`,
`rationale:"corrected eligibility band"`, `evidence_refs:["evidence://override/synth_001#sha256:bb22"]`,
`review_at:"2026-08-20T00:00:00Z"`, `header.causation_id:"cid_0001"`:

| `approvers` | `ValidateOverrideRecord` | Error type |
|---|---|---|
| `[StaffGuide, StaffGuide2]` (distinct staff) | `nil` | — |
| `[StaffGuide, Model]` | error | `*AuthorityForgeryError` (`Field:"approvers"`) |
| `[StaffGuide, System]` | error | `*AuthorityForgeryError` |
| `[StaffGuide, StaffGuide]` (same ref) | error | `*FourEyesError` |
| `[StaffGuide]` (single, override class) | error | `*FourEyesError` |

A non-listed `override_class` requires **one** named human approver (never `MODEL`/`SYSTEM`), not four-eyes.
Preservation: after building `OverrideValid`, the target `DecisionRecord` (`cid_0001`) is **unchanged**, both
`cid_0001` and the override's `contract_id` exist (append-only), and `header.causation_id=="cid_0001"`.
OPA mirror: `data.gt100k.override.deny` fires for a model/system approver or `<2` distinct approvers on a class.

### G-APL — appeal reviewer independence

Target = `DecisionRecord{contract_id:"cid_0001", authorized_human=StaffGuide}`. `Appeal` base:
`appellant_role:"guardian"`, `target_decision:"cid_0001"`, `grounds:"new evidence"`,
`submitted_evidence_refs:["evidence://appeal/synth_001#sha256:cc33"]`, `requested_remedy:"re-review"`,
`deadlines:{respond_by:"2026-08-01T00:00:00Z"}`, `resolution:""`:

| `independent_reviewer` / `status` | `ValidateAppeal` | Error type |
|---|---|---|
| `StaffGuide2` (≠ authorized_human), `status:"filed"` | `nil` | — |
| `StaffGuide` (= authorized_human), `status:"filed"` | error | `*ReviewerConflictError` (`Field:"independent_reviewer"`) |
| `StaffGuide2`, `status:"reopened"` | `nil` | — |
| `StaffGuide2`, `status:"late"` | `nil` | — |
| `StaffGuide2`, `status:"invalid_status"` | error | `*NamedFieldError` (`Field:"status"`) |

Filing an `Appeal` does not mutate `cid_0001` (append-only); the target decision is unchanged.

### G-TF — Terraform validate-only

For each module `M` under `infra/terraform/` (`bootstrap-org`, `network-vpc`, `eks`, `rds`, `s3-kms`, `iam`, `event-runtime`):

| Command (run in `M`, no AWS creds) | Expected |
|---|---|
| `terraform init -backend=false` | success (providers/modules resolve) |
| `terraform validate` | `Success! The configuration is valid.` |
| `terraform fmt -check -recursive` | exit 0 (already formatted) |
| any `terraform apply` | **not run** — deferred; the gate never applies |

---

## Phasing (P0…P7)

Ordered build path. Each phase has an obvious "next task" and a checkpoint. Task IDs reference
[tasks.md](./tasks.md). **Read only the current phase's section.**

### P0 — Setup (scaffold + gate green from iteration 1)
Go module + `proto/` (`buf.yaml`/`buf.gen.yaml`/`buf.lock`) + `policies/` + `infra/terraform/` skeletons, a minimal proto that `buf lint` passes, a trivial `opa test` and `go test`, an empty valid Terraform module, and the `Makefile` `gate` target + the separate GitHub Actions workflow. **Tasks T001–T007.** **Checkpoint:** `make gate` runs green on the empty skeleton (seeded smoke).

### P1 — Foundational (blocking prerequisites)
The `Envelope` message + `ActorRef` + the six contract messages (fields only, no invariants yet) in `proto/`, `buf generate` → committed Go, and the shared Go error types + injected `Clock`/`IDGenerator` interfaces in `pkg/platform`. **Tasks T008–T012.** **Checkpoint:** generated Go compiles; error types exist — stories can begin.

### P2 — US1: envelope + contracts + validators + `buf` gate (P1 priority) 🎯 MVP
`ValidateEnvelope`, `LearnerEvent`, `DecisionRecord` (human-authority + append-only), the `buf lint`/`buf breaking` gate, and the `buf generate` freshness check, tests-first. **Tasks T013–T020.** Golden: [G-BUF](#g-buf--schema-compatibility), [G-ENV](#g-env--envelope-validation), [G-DEC](#g-dec--decisionrecord-invariants). **Checkpoint = MVP:** contracts validate, enforce invariants, and are `buf`-owned.

### P3 — US2: consent/assent + OPA deny-by-default authorization (P2 priority)
`ConsentGrant`+`IsConsentActive`, `AssentRecord`+`AssentBlocks`, the **Rego** policy + `opa test`, the Go authorization edge calling the OPA SDK, and the consent/assent service (`GrantConsent`/`WithdrawConsent`/`RecordAssent`, pseudonymous `ResolveActor`). **Tasks T021–T030.** Golden: [G-AUTH](#g-auth--authorization-decisions), [G-ASSENT](#g-assent--assent-veto). **Checkpoint:** consent/assent + OPA authorization work end-to-end.

### P4 — US3: transactional outbox + idempotent consumers + audit (P3 priority)
The PostgreSQL outbox interfaces + in-memory fakes, `Relay`, idempotent `Deliver`, `AuditEntry` helpers, `HandleCommand` full path, **and** the testcontainers integration lane (Redpanda + PostgreSQL) behind `-tags=integration`. **Tasks T031–T036.** Golden: [G-IDEM](#g-idem--idempotencydedup). **Checkpoint:** command → outbox → bus → projection → audit works (fakes) and passes integration.

### P5 — US4: OverrideRecord + Appeal (Go + OPA) (P4 priority)
`OverrideRecord`+`ValidateOverrideRecord`+four-eyes, `Appeal`+`ValidateAppeal`+reviewer-independence, the OPA `override`/`appeal` deny rules, and the audit obligations. **Tasks T037–T042.** Golden: [G-OVR](#g-ovr--overriderecord-four-eyes), [G-APL](#g-apl--appeal-reviewer-independence). **Checkpoint:** the full six-contract set validates in Go and OPA.

### P6 — US5: Temporal deletion workflow + enrollment stub + Terraform (P5 priority)
The Temporal `DeletionWorkflow` + idempotent/compensating activities (crypto-shred stub) with the test-suite proof, the `EligibleLearner` stub consumer, and the validate-only Terraform module graph (Core + Identity; Public/Sandbox/Sensitive reserved). **Tasks T043–T049.** Golden: [G-WD](#g-wd--withdrawal-cascade), [G-TF](#g-tf--terraform-validate-only). **Checkpoint:** provision → withdraw → delete loop + `terraform validate` all green.

### P7 — Polish & cross-cutting
READMEs, `runbooks/` spine entry, the headless demo (`cmd/demo`), the determinism/replay test, the **golden test** asserting every golden value above, and the quickstart run. **Tasks T050–T055.** **Checkpoint:** `make gate` fully green; SC-011 satisfied.

---

## Decisions already made *(do not re-open)*

- **Real production stack now.** The buildable definition of done is the **real-stack gate**: `buf lint` + `buf breaking`, pinned `go vet`/`build`/`test`, `opa test`, `terraform validate`/`fmt -check`. **Deferred** (production direction, not built here): `terraform apply` + AWS org, managed Redpanda/Temporal runtime ops, real KMS crypto-shred, bundle/image signing, mTLS/observability wiring, application shells (see [plan.md](./plan.md)).
- **Separate track from the TS overnight loops.** This feature is **not** gated by `tsc -b`/`vitest` and must not be enqueued in the TS loop batch. It requires a **Go + buf + OPA + Terraform-capable runner** (+ Docker for the optional testcontainers lane). A dedicated GitHub Actions workflow runs its gate. If the loop harness is TS-only, a Go/infra-capable runner is required (FR-020).
- **Single Go module now; per-service split deferred.** The slice is one Go module (`github.com/gt100k/platform`) so `go vet ./... && go build ./... && go test ./...` works verbatim from repo root. The per-deployable module split + `go.work` (parent §26.2) is a deferred refactor behind the same package boundaries (`pkg/platform`, `pkg/spine`, `services/*`, `workflows/*`).
- **`buf` owns the contract schema.** One `proto/` registry; `buf generate` produces the committed Go; `buf lint`+`buf breaking` are the compatibility gate; new fields take new tags, removals/renames are forbidden (parent §28).
- **OPA/Rego is the authorization mechanism** (not a hand-rolled predicate). Deny-by-default; the Go edge calls the OPA Go SDK against the compiled bundle and records `policy_version`. The fixed reason-code precedence is in [G-AUTH](#g-auth--authorization-decisions). Bundle **signing** is deferred; `opa test` + `opa build` are in scope.
- **Outbox + idempotent consumers proven two ways.** In-memory fakes behind interfaces for the fast default `go test` gate (no Docker), **and** testcontainers-backed Redpanda + PostgreSQL integration tests behind `//go:build integration` (opt-in, needs Docker). This keeps the default gate hermetic while still exercising the real transport.
- **Temporal deletion via the SDK test suite.** The `DeletionWorkflow` is real Temporal Go code proven with `testsuite.TestWorkflowEnvironment` (in-memory) in the default gate; a dev-server testcontainer is an optional integration extra. The KMS crypto-shred activity is a stub/fake (real KMS deferred).
- **Terraform is validate-only.** Modules pass `terraform init -backend=false && terraform validate && terraform fmt -check`; no `apply`, no backend, no credentials. Core + Identity modeled; Public/Sandbox/Sensitive reserved (empty boundary modules).
- **Append-only everywhere.** Contracts are immutable; corrections/overrides are new records linked by `causation_id`; the store rejects re-writing an existing `contract_id`.
- **Determinism.** No wall-clock/random in the invariant core (clock + id injected); Temporal uses deterministic APIs (FR-016) — every record replayable.
- **Pinned toolchain + module/package names.** See [Build gate + pinned toolchain](#build-gate--pinned-toolchain). Module `github.com/gt100k/platform`; proto package `gt100k.platform.v1`; Rego package `gt100k.authz` (+ `gt100k.override`, `gt100k.appeal`).

## Defaults for the unspecified

> **Rule (verbatim):** *For anything this PRD doesn't specify, choose the simplest correct option, record
> it in `.loop/decisions.md`, and continue.*

Concretely for this slice: prefer the simplest idiomatic Go over the generated Protobuf types; keep proto
fields minimal (add fields only when an FR/SC needs them, always under a new tag); use synthetic placeholder
strings for any legal artifact; never introduce a wall-clock read or random id in the invariant core; keep
the default `go test` lane hermetic (no Docker — put anything needing Docker behind `-tags=integration`);
never run `terraform apply` or touch cloud/creds; and if two designs are equivalent, pick the one that keeps
the gate fast and deterministic. Log the choice and keep going — this slice is **non-blocking**.

## Pre-marked decision points *(preferred default stated inline; severity noted)*

- **[DP-1] Enrollment-handoff eligibility-contract shape** — `severity: normal` (open question for the human; see RETURN note). **Default:** Protobuf `EligibleLearner { string learner_ref = 1; string accommodation_profile_ref = 2; string eligibility_evidence_ref = 3; Track track = 4; }` with `enum Track { TRACK_UNSPECIFIED = 0; TRACK_A = 1; TRACK_B = 2; }` — **references only, never raw responses, artifacts, or CogAT items** (FOUNDATION_PRD §7.3, §10.4; GOVERNANCE G7; Constitution V). Admissions owns the real shape; because the value is reference-only behind the enrollment interface, cutover is config even if fields are added under new tags. Proceed with the default; confirm with admissions before real cutover.
- **[DP-2] Local spine testability: testcontainers vs in-memory** — `severity: normal` (open question; see RETURN note). **Default (chosen):** **both** — in-memory fakes behind Go interfaces are the default `go test ./...` lane (fast, hermetic, no Docker, so the gate stays green on any Go runner), **and** testcontainers-backed Redpanda + PostgreSQL tests behind `//go:build integration` (`go test -tags=integration ./...`) exercise the real transport on a Docker-capable runner. Temporal uses the SDK in-memory test suite by default; a `temporal` dev-server testcontainer is an optional integration extra. Rationale: the SC-005 property is *logic* (provable with fakes) but the real broker semantics deserve a real exercise where Docker exists; splitting by build tag keeps the mandatory gate hermetic.
- **[DP-3] Override classes requiring four-eyes** — `severity: normal`. **Default:** `admissions`, `public_exposure`, `safeguarding`, `credential_revocation` (parent §28 `OverrideRecord` invariant). A non-listed `override_class` requires one named human approver (never model/system). Confirm the class list with governance before live use.
- **[DP-4] `schema_version` string format** — `severity: low`. **Default:** `"<contract>/<major>"`, e.g. `"learner_event/1"`, `"decision_record/1"`; used in the envelope and mirrored by the proto package version dir (`v1`).
- **[DP-5] `contract_id` / id shape** — `severity: low`. **Default:** opaque strings from the injected `IDGenerator` (tests use `"cid_0001"`, `"cid_0002"`, …); production uses ULIDs; the domain treats ids as opaque.
- **[DP-6] Deletion crypto-shred activity** — `severity: normal`. **Default:** the Temporal `DeletionWorkflow` + idempotent/compensating activities are real; the per-subject **KMS crypto-shred** activity is a **stub/fake** (real KMS deferred, FR-014). The audit fact that withdrawal + deletion occurred is always preserved.
- **[DP-7] Commit generated Go vs generate-in-CI** — `severity: low`. **Default:** **commit** the `buf generate` output under `proto/gen/go/` (so `go build` needs no `buf`), and add a CI freshness check (`buf generate` + `git diff --exit-code`) so it never drifts.

---

## Build gate + pinned toolchain

> **This is the definition of done for this feature — NOT `tsc -b`/`vitest`.** All commands run from the
> repo root unless noted. The gate is aggregated by `make gate` and by `.github/workflows/foundation-spine.yml`.

### Pinned toolchain

| Tool | Pinned version | Where pinned |
|---|---|---|
| **Go** | `1.25.5` | `go.mod` (`go 1.25` + `toolchain go1.25.5`); CI `actions/setup-go` `go-version: 1.25.5` |
| **buf** CLI | `1.50.0` | CI `bufbuild/buf-setup-action` `version: 1.50.0`; `buf.gen.yaml` plugins pinned below |
| **protoc-gen-go** | `1.36.5` | `buf.gen.yaml` (`buf.build/protocolbuffers/go:v1.36.5`) |
| **protoc-gen-go-grpc** | `1.5.1` | `buf.gen.yaml` (`buf.build/grpc/go:v1.5.1`) |
| **OPA** | `1.4.0` | CI `open-policy-agent/setup-opa` `version: 1.4.0`; Go dep `github.com/open-policy-agent/opa v1.4.0` |
| **Terraform** | `1.11.4` | CI `hashicorp/setup-terraform` `terraform_version: 1.11.4`; `required_version = "~> 1.11"` |
| **Temporal Go SDK** | `1.34.0` | `go.mod` `go.temporal.io/sdk v1.34.0` |
| **testcontainers-go** | `0.35.0` | `go.mod` `github.com/testcontainers/testcontainers-go v0.35.0` (+ `/modules/redpanda`, `/modules/postgres`) |
| **franz-go** (Kafka/Redpanda client) | `1.18.1` | `go.mod` `github.com/twmb/franz-go v1.18.1` |
| **pgx** | `5.7.2` | `go.mod` `github.com/jackc/pgx/v5 v5.7.2` |
| **Docker** (integration lane only) | `24+` | host requirement for `-tags=integration` |

### Gate commands (exact)

```bash
# 1. Contract schema (buf owns compatibility)
buf lint proto
buf breaking proto --against '.git#branch=main,subdir=proto'
buf generate proto && git diff --exit-code proto/gen        # committed Go matches schema

# 2. Go (pinned 1.25.5) — default lane is hermetic (in-memory fakes + Temporal test suite; no Docker)
go vet ./...
go build ./...
go test ./...

# 3. Policy-as-code
opa test policies/ -v

# 4. Infrastructure as code (VALIDATE ONLY — never apply)
terraform -chdir=infra/terraform/modules/bootstrap-org init -backend=false && \
  terraform -chdir=infra/terraform/modules/bootstrap-org validate
terraform fmt -check -recursive infra/terraform
# (repeated per module by `make gate`; see quickstart.md for the full list)

# Optional integration lane (Docker required — NOT part of the mandatory gate):
go test -tags=integration ./...
```

**Gate = all of section 1–4 green.** The optional `-tags=integration` lane runs only where Docker exists
(a Docker-capable CI job or a local dev host); it is **not** required for the mandatory gate so the default
lane stays hermetic and fast.

### Seeded smoke path (green from iteration 1)

To keep the gate green before real logic exists, P0 seeds a trivial passing check in each lane so the whole
gate is green from the first iteration:

- **Go**: `pkg/platform/smoke_test.go`

```go
package platform

import "testing"

func TestSmoke(t *testing.T) {
	if 1+1 != 2 {
		t.Fatal("go test lane not wired")
	}
}
```

- **OPA**: `policies/smoke_test.rego`

```rego
package gt100k.smoke_test

import rego.v1

test_smoke if { true }
```

- **buf**: a minimal, lint-clean `proto/gt100k/platform/v1/envelope.proto` (message `Envelope` with a
  couple of fields) so `buf lint` passes immediately.
- **Terraform**: `infra/terraform/modules/_smoke/main.tf` — an empty but valid module
  (`terraform { required_version = "~> 1.11" }`) so `terraform validate`/`fmt -check` pass immediately.

## Seed fixtures (in-repo)

All fixtures are **synthetic** and committed under `pkg/platform/fixtures/` (Go) and
`policies/testdata/` (OPA input JSON) — no external fetch. The golden tables reference these by name.
Canonical values (Go, illustrative shapes over the generated proto types):

```go
// pkg/platform/fixtures/fixtures.go — synthetic, pseudonymous; class enforces authority invariants
var (
	StaffGuide   = &platformv1.ActorRef{Ref: "actor_pseudo_guide_01",    Class: platformv1.ActorClass_STAFF,    Role: "guide"}
	StaffGuide2  = &platformv1.ActorRef{Ref: "actor_pseudo_guide_02",    Class: platformv1.ActorClass_STAFF,    Role: "guide"}
	AdmissionsLead = &platformv1.ActorRef{Ref: "actor_pseudo_admin_01",  Class: platformv1.ActorClass_STAFF,    Role: "admissions_lead"}
	Guardian     = &platformv1.ActorRef{Ref: "actor_pseudo_guardian_01", Class: platformv1.ActorClass_GUARDIAN, Role: "guardian"}
	Child        = &platformv1.ActorRef{Ref: "actor_pseudo_child_01",    Class: platformv1.ActorClass_CHILD,    Role: "learner"}
	Model        = &platformv1.ActorRef{Ref: "model_advisor_01",         Class: platformv1.ActorClass_MODEL,    Role: "advisor"}
	System       = &platformv1.ActorRef{Ref: "system_relay_01",          Class: platformv1.ActorClass_SYSTEM,   Role: "system"}
)

const (
	Tenant        = "gt100k"
	PolicyVersion = "opa-bundle/2026-07-20a"
	T0            = "2026-07-20T14:03:11Z"      // injected Clock base (occurred_at)
	T0Recorded    = "2026-07-20T14:03:11.402Z"  // recorded_at (distinct from occurred_at)
)

// Enrollment handoff output (references only — DP-1)
var EligibleLearner = &platformv1.EligibleLearner{
	LearnerRef:              "learner_synth_001",
	AccommodationProfileRef: "accom://profile/synth_001",
	EligibilityEvidenceRef:  "evidence://eligibility/synth_001#sha256:aa11",
	Track:                   platformv1.Track_TRACK_A,
}

// Consent fixtures (document_hash is a synthetic placeholder — FR-015)
// ConsentOnboarding:          purpose "onboarding.schedule", US-CA, effective 2026-07-01, expiry 2026-12-31, active
// ConsentOnboardingExpired:   ... expiry 2026-07-10
// ConsentOnboardingWithdrawn: ... withdrawal_state{withdrawn:true, withdrawn_at:2026-07-15}
// ConsentResearch:            purpose "research.trial", US-CA, active (no policy rule ⇒ deny_by_default)
```

The OPA input fixtures (`policies/testdata/authz_*.json`) mirror the G-AUTH rows exactly. Every contract
fixture is wrapped with a complete `Envelope` (via a `WithEnvelope(...)` helper) whose fields match
`fixtures.ValidEnvelope`; the golden tables assume that wrapping. The `PolicyVersion` above is the bundle
label `opa build` stamps.

## Env / secrets

This slice needs **no runtime secrets and no cloud credentials** (the gate is `buf`/`go test` with
in-memory fakes + the Temporal test suite + validate-only Terraform), so the gate never fails on missing
env. Two committed placeholder files exist only so a future production adapter/apply can read config
without breaking, both git-ignored where they carry values:

- `.env.local` (git-ignored; placeholders only — this slice reads none of these):

```dotenv
# .env.local — placeholders only; this slice reads none of these
GT100K_TENANT_ID=gt100k
GT100K_POLICY_VERSION=opa-bundle/2026-07-20a
# Deferred production adapters (unused in this slice):
# DATABASE_URL=
# REDPANDA_BROKERS=
# TEMPORAL_ADDRESS=
# OPA_BUNDLE_URL=
# AWS_REGION=us-east-1
```

- `infra/terraform/environments/dev/terraform.tfvars.example` (committed example; the real
  `terraform.tfvars` is git-ignored and never needed for validate-only):

```hcl
# terraform.tfvars.example — placeholders; validate-only needs none of these
aws_region        = "us-east-1"          # US region only (FOUNDATION_PRD §4.8)
org_email_domain  = "example.invalid"    # placeholder — no real org
core_account_name = "gt100k-core"
identity_account_name = "gt100k-identity"
# reserved boundaries (created empty later): public-release, workload-sandbox, sensitive-research
```

No real credentials, tokens, or machine paths are committed (ENG constraint; gitleaks; `gt100k` is public).

## Assumptions

- **Real production stack, cloud apply deferred**: the buildable definition of done is the **real-stack
  gate** (buf/go/opa/terraform-validate). Live cloud provisioning (`terraform apply`, AWS org/accounts),
  managed Redpanda/Temporal runtime ops, real KMS crypto-shred, bundle/image signing, and mTLS/observability
  wiring are the **deferred production direction** (plan.md), because they need credentials and a hosted
  runtime a hermetic gate cannot exercise.
- **Legal layer is mechanical + stubbed**: consent/assent are modeled as *mechanisms* (purpose, expiry,
  withdrawal, refusal-honored) with placeholder legal artifacts (FR-015). No real legal validity.
- **Local spine is exercised two ways** (DP-2): in-memory fakes (mandatory hermetic lane) + testcontainers
  Redpanda/PostgreSQL and the Temporal test suite (integration lane / SDK). The `10,000 events/s` durability
  target is an operational property of the deferred managed Redpanda; this slice proves the *logical*
  no-loss / no-double-apply property + a real-broker exercise where Docker exists.
- **Enrollment handoff is a stub** honoring the agreed `EligibleLearner` shape (FR-013, DP-1); the pipeline
  is the admissions team's boundary.
- **Single tenant / synthetic cohort**: `tenant_id` is present and checked in the envelope; multi-tenant
  isolation testing beyond header scoping is out of scope for this slice.
- **Separate CI runner**: the feature's gate runs in its own Go/buf/OPA/Terraform-capable GitHub Actions
  workflow (FR-020), independent of the TS `tsc -b`/`vitest` loop; the testcontainers lane runs only on a
  Docker-capable job.
