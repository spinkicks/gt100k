# Tasks: Platform Foundation Spine (Real Production Stack)

**Input**: Design documents from `specs/005-foundation-spine/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/foundation-spine.md, quickstart.md
**Tests**: INCLUDED — the constitution makes tests part of "done" and `contracts/foundation-spine.md`
defines explicit test obligations, with exact expected results in
[spec.md → Golden Values](./spec.md#golden-values--tolerances). **Write tests first; ensure they fail
before implementing.**

> ## ⚠️ SEPARATE BUILD TRACK — definition of done is the REAL-STACK gate (NOT `tsc -b`/`vitest`)
>
> ```
> buf lint  +  buf breaking
> go vet ./... && go build ./... && go test ./...   # Go pinned 1.25.5
> opa test policies/
> terraform validate  +  terraform fmt -check       # VALIDATE-ONLY — never apply
> ```
>
> This feature **must not** be enqueued in the TypeScript overnight loop batch (that gates on
> `pnpm typecheck`+`vitest` and lacks the Go/buf/OPA/Terraform toolchain). It **requires a Go + buf + OPA +
> Terraform-capable runner** (+ Docker for the optional `-tags=integration` lane), run by
> `.github/workflows/foundation-spine.yml`. No `terraform apply`, no live broker, no cloud creds — the
> mandatory gate is hermetic (in-memory fakes + Temporal SDK test suite + validate-only Terraform).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete-task dependency)
- **[Story]**: US1 / US2 / US3 / US4 / US5 (setup, foundational, polish carry no story label)
- Every task names exact file paths.

## Path conventions (from plan.md — single Go module `github.com/gt100k/platform`)

- Schema: `proto/gt100k/platform/v1/*.proto`, generated Go `proto/gen/go/...`
- Invariant lib: `pkg/platform/`; spine: `pkg/spine/`; service: `services/identity-consent/`
- Policy: `policies/`; workflow: `workflows/deletion/`; IaC: `infra/terraform/`; demo: `cmd/demo/`

**Parallel-safety**: all work is in **new** top-level dirs above + new files `go.mod`, `go.sum`, `Makefile`,
`.github/workflows/foundation-spine.yml`. **No existing TS file** (`package.json`, `pnpm-workspace.yaml`,
`tsconfig*.json`, `vitest.config.ts`, `biome.json`, `apps/`, `packages/`, `adapters/`) is edited. The final
task (T055) adds the two git-ignored placeholders + the `.gitignore` lines — the single human-reconciled
merge point.

**Phasing**: P0 Setup (T001–T007) · P1 Foundational (T008–T012) · P2 US1/MVP (T013–T020) · P3 US2
(T021–T030) · P4 US3 (T031–T036) · P5 US4 (T037–T042) · P6 US5 (T043–T049) · P7 Polish (T050–T055). See
[spec.md → Phasing](./spec.md#phasing-p0p7).

---

## Phase 1 (P0): Setup — skeleton + gate green from iteration 1

- [ ] T001 Create the Go module `go.mod` (`module github.com/gt100k/platform`, `go 1.25`,
  `toolchain go1.25.5`) at repo root and an empty `go.sum`; add `Makefile` with a `gate` target aggregating
  the four gate sections from [spec.md → Gate commands](./spec.md#gate-commands-exact) (and a `gate-integration`
  target running `go test -tags=integration ./...`).
- [ ] T002 [P] Scaffold `proto/`: `buf.yaml` (v2, module `proto`, lint STANDARD, breaking `FILE`),
  `buf.gen.yaml` (pin `buf.build/protocolbuffers/go:v1.36.5` → `proto/gen/go`,
  `buf.build/grpc/go:v1.5.1`), `buf.lock`, and a minimal lint-clean `proto/gt100k/platform/v1/envelope.proto`
  (message `Envelope` with 2–3 fields) so `buf lint` passes immediately.
- [ ] T003 [P] Add the Go smoke test `pkg/platform/smoke_test.go` (from
  [spec.md → Seeded smoke path](./spec.md#seeded-smoke-path-green-from-iteration-1)) so `go test ./...` is
  green from iteration 1.
- [ ] T004 [P] Add `policies/smoke_test.rego` (package `gt100k.smoke_test`, `test_smoke if { true }`) so
  `opa test policies/` is green immediately.
- [ ] T005 [P] Add `infra/terraform/modules/_smoke/main.tf` (`terraform { required_version = "~> 1.11" }`)
  so `terraform validate`/`fmt -check` pass immediately.
- [ ] T006 Add the separate CI workflow `.github/workflows/foundation-spine.yml` (path-scoped to
  `proto/**`, `pkg/**`, `services/**`, `policies/**`, `workflows/**`, `infra/terraform/**`, `go.*`,
  `Makefile`) that sets up pinned Go/buf/OPA/Terraform and runs `make gate`; add a **separate Docker-capable
  job** running `make gate-integration` (FR-020). **This is NOT the TS loop.**
- [ ] T007 Run `buf generate proto` and commit the generated `Envelope` under `proto/gen/go/...` so the
  freshness check (`git diff --exit-code proto/gen`) is green.

**Checkpoint**: `make gate` runs green on the empty skeleton (buf lint + go test smoke + opa test smoke +
terraform validate/_smoke + fmt).

---

## Phase 2 (P1): Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: no user-story work begins until this phase is complete.

- [ ] T008 [P] Define `ActorRef` + `ActorClass` enum in `proto/gt100k/platform/v1/envelope.proto` and the
  full `Envelope` message per [data-model.md](./data-model.md) (all 12 fields, tags 1–12).
- [ ] T009 [P] Define the six contract messages + supporting enums/messages in
  `proto/gt100k/platform/v1/`: `learner_event.proto`, `consent.proto`, `assent.proto`, `decision.proto`,
  `override.proto`, `appeal.proto`, plus `audit.proto` and `enrollment.proto` (fields only, tags per
  data-model; no Go invariants yet).
- [ ] T010 Run `buf generate proto` → commit `proto/gen/go/gt100k/platform/v1/*.pb.go`; confirm
  `buf lint` clean and `go build ./...` compiles the generated code (depends on T008, T009).
- [ ] T011 Define shared invariant error types + injected interfaces in
  `pkg/platform/invariants.go` (`NamedFieldError`, `AuthorityForgeryError`, `AppendOnlyError`,
  `FourEyesError`, `ReviewerConflictError`, each with `Error()`) and `pkg/platform/clock.go`
  (`Clock`, `IDGenerator`) per data-model (depends on T010).
- [ ] T012 [P] Add the synthetic seed fixtures in `pkg/platform/fixtures/fixtures.go` (actors, tenant,
  timestamps, `EligibleLearner`, consent fixtures, `PolicyVersion`) + a `WithEnvelope(...)` helper, and the
  OPA input fixtures `policies/testdata/authz_*.json` mirroring G-AUTH (from
  [spec.md → Seed fixtures](./spec.md#seed-fixtures-in-repo)) (depends on T010).

**Checkpoint**: generated Go compiles; error types, injected interfaces, and fixtures exist — stories begin.

---

## Phase 3 (P2): User Story 1 — envelope + contracts + validators + `buf` gate (Priority: P1) 🎯 MVP

**Goal**: the versioned Protobuf envelope + contracts + Go validators enforce every invariant — most
critically that a `MODEL`/`SYSTEM` output can never fill `DecisionRecord.authorized_human` — and `buf`
owns compatibility.

**Independent Test**: `buf lint`+`buf breaking`; complete envelope validates, incomplete rejected by field;
a `MODEL` actor in `authorized_human` rejected; distinct occurred/recorded. Golden:
[G-BUF](./spec.md#g-buf--schema-compatibility), [G-ENV](./spec.md#g-env--envelope-validation),
[G-DEC](./spec.md#g-dec--decisionrecord-invariants).

### Tests (write first, ensure they fail)

- [ ] T013 [P] [US1] Envelope tests asserting the full [G-ENV](./spec.md#g-env--envelope-validation) table
  (complete passes; each missing/empty required field rejected by `Field`; `model_version` optional;
  `evidence_refs` nil allowed) in `pkg/platform/envelope_test.go` (FR-001, SC-002).
- [ ] T014 [P] [US1] `LearnerEvent` tests (envelope complete; distinct occurred/recorded; required fields)
  in `pkg/platform/learner_event_test.go` (FR-002).
- [ ] T015 [P] [US1] `DecisionRecord` tests asserting the full
  [G-DEC](./spec.md#g-dec--decisionrecord-invariants) table (consequential ⇒ human + policy;
  `MODEL`/`SYSTEM` in `authorized_human` rejected in 100% via `*AuthorityForgeryError`; non-consequential
  passes; `AssertAppendOnly`) in `pkg/platform/decision_test.go` (FR-005, SC-003).
- [ ] T016 [P] [US1] `buf breaking` fixture test: a script/test `proto/breaking_test.sh` (invoked by the
  gate/CI) asserting G-BUF rows (remove/rename/tag-reuse FAIL; new-tag add passes) (FR-006, SC-001).

### Implementation

- [ ] T017 [US1] Implement `ValidateEnvelope` + `AssertEnvelopeComplete` in `pkg/platform/envelope.go`
  (depends on T011).
- [ ] T018 [P] [US1] Implement `ValidateLearnerEvent` in `pkg/platform/learner_event.go` (depends on T017).
- [ ] T019 [P] [US1] Implement `ValidateDecisionRecord` + `AssertHumanAuthority` + `AssertAppendOnly` in
  `pkg/platform/decision.go` (depends on T011, T017).
- [ ] T020 [US1] Wire the `buf breaking` gate into `Makefile`/CI (against `.git#branch=main,subdir=proto`)
  and the `buf generate` freshness check; confirm G-BUF green (depends on T010).

**Checkpoint**: contracts validate, enforce invariants, and are `buf`-owned. **This is the MVP.**

---

## Phase 4 (P3): User Story 2 — consent/assent + OPA deny-by-default authorization (Priority: P2)

**Goal**: pseudonymous identity; consent grant/withdraw with expiry; child assent veto; **OPA/Rego**
deny-by-default authorization returning `policy_version`; withdrawal blocks new processing.

**Independent Test**: `opa test policies/` green; grant→allow, withdraw→deny, unknown role/purpose→
deny-by-default, jurisdiction mismatch→deny, child refusal + guardian consent→blocked. Golden:
[G-AUTH](./spec.md#g-auth--authorization-decisions), [G-ASSENT](./spec.md#g-assent--assent-veto).

### Tests (write first, ensure they fail)

- [ ] T021 [P] [US2] `ConsentGrant` + `IsConsentActive` tests (active in window; false when withdrawn/
  expired/before effective) in `pkg/platform/consent_test.go` (FR-003).
- [ ] T022 [P] [US2] `AssentRecord` + `AssentBlocks` tests asserting
  [G-ASSENT](./spec.md#g-assent--assent-veto) (honorable refusal/dissent block; assent doesn't; non-honorable
  doesn't) in `pkg/platform/assent_test.go` (FR-004, SC-007).
- [ ] T023 [P] [US2] Rego decision-table tests asserting the full six-row
  [G-AUTH](./spec.md#g-auth--authorization-decisions) + deny-by-default (empty policy denies) in
  `policies/authz_test.rego` (FR-007, FR-008, SC-004).
- [ ] T024 [P] [US2] Go authorization-edge tests (via the OPA Go SDK against the compiled bundle) asserting
  the same G-AUTH table + that every result carries `policy_version` in
  `services/identity-consent/authz_test.go` (FR-007, SC-004).
- [ ] T025 [P] [US2] `WithdrawConsent` tests asserting [G-WD](./spec.md#g-wd--withdrawal-cascade) partial
  (after withdrawal `IsConsentActive` false + `Authorize` denies; `DeletionStarter.Start` called **exactly
  once**; **one** `consent_withdrawn` audit entry) in `services/identity-consent/consent_test.go`
  (FR-014, SC-006).
- [ ] T026 [P] [US2] `ProvisionLearner` test (downstream receives only a pseudonymous `actor_ref`;
  eligibility handoff shape honored — references only) in `services/identity-consent/identity_test.go`
  (FR-012, FR-013).

### Implementation

- [ ] T027 [P] [US2] Implement `ValidateConsentGrant` + `IsConsentActive` in `pkg/platform/consent.go` and
  `ValidateAssentRecord` + `AssentBlocks` in `pkg/platform/assent.go` (depends on T017).
- [ ] T028 [US2] Implement the Rego policy `policies/authz.rego` (`gt100k.authz.decision`, deny-by-default,
  fixed reason-code precedence per G-AUTH) + `deny_authority_forgery`; confirm `opa test` green (depends on
  T023).
- [ ] T029 [US2] Implement the Go authorization edge `services/identity-consent/authz.go` (`Authorize` via
  the OPA Go SDK, pre-filtering active consents with `IsConsentActive`, returning `{Allow,Reason,
  PolicyVersion}`) (depends on T027, T028).
- [ ] T030 [US2] Implement `GrantConsent`/`WithdrawConsent` (starts `DeletionStarter` once; writes
  `consent_withdrawn` audit) in `services/identity-consent/consent_service.go`, `RecordAssent` in
  `assent_service.go`, and `ProvisionLearner`/`ResolveActor` (over injected `IdentityRepository` +
  `EnrollmentHandoffSource`) in `identity.go`; add in-memory fakes for those repos + `DeletionStarter` in
  `pkg/spine/fakes_test.go` or `services/identity-consent/fakes_test.go` (depends on T027, T029).

**Checkpoint**: consent/assent + OPA authorization work end-to-end, tested.

---

## Phase 5 (P4): User Story 3 — transactional outbox + idempotent consumers + audit (Priority: P3)

**Goal**: an authorized command commits `DecisionRecord` + outbox row + audit **atomically**; a relay
publishes with an idempotency key (at-least-once); consumers dedup on `contract_id` (exactly-once) under
replay **and** out-of-order; every consequential action writes an append-only audit entry — proven with
in-memory fakes **and** real Redpanda + PostgreSQL (testcontainers, `-tags=integration`).

**Independent Test**: atomic commit all-or-nothing; replay → applied once; out-of-order → each applied once;
burst N → N-unique, no loss; denied → `policy_deny` audit, no decision. Golden:
[G-IDEM](./spec.md#g-idem--idempotencydedup).

### Tests (write first, ensure they fail)

- [ ] T031 [P] [US3] Outbox + `Deliver` tests asserting [G-IDEM](./spec.md#g-idem--idempotencydedup):
  atomic `UnitOfWork` commit all-or-nothing; `[A,B,A,C,B,A]` → applied `[t,t,f,t,f,f]`, `Count()==3`;
  out-of-order → both applied, re-deliver skipped; N=100 burst delivered twice → 100 true/100 false,
  `Count()==100`) in `pkg/spine/outbox_test.go` (FR-009, FR-010, SC-005).
- [ ] T032 [P] [US3] `HandleCommand` + audit tests (authorized ⇒ decision + outbox + audit committed;
  denied ⇒ **one** `policy_deny` audit + no decision; audit append-only + replayable) in
  `pkg/spine/command_test.go` (FR-011, SC-004).
- [ ] T033 [P] [US3] **Integration** outbox test `pkg/spine/outbox_integration_test.go`
  (`//go:build integration`) reproducing the G-IDEM/burst end-to-end against testcontainers Redpanda
  (franz-go) + PostgreSQL (pgx) (FR-009, FR-010, SC-005).

### Implementation

- [ ] T034 [US3] Define all spine interfaces in `pkg/spine/ports.go` per
  [data-model.md](./data-model.md#spine-interfaces-pkgspineportsgo-implemented-by-adapters-injected)
  (`*Repository`, `AuditLog`, `OutboxStore`, `UnitOfWork`, `OutboxRow`, `EventBus`, `ConsumerOffsets`,
  `Authorizer`, `PolicyDecision`, `EnrollmentHandoffSource`, `DeletionStarter`) (depends on T010).
- [ ] T035 [US3] Implement the transactional outbox (`OutboxStore.Commit` atomic; `Relay` at-least-once) in
  `pkg/spine/outbox.go`+`relay.go`, the idempotent `Deliver` in `pkg/spine/consumer.go`, `AuditEntry`
  helpers in `pkg/spine/audit.go`, and `HandleCommand` full path in `pkg/spine/command.go`; add in-memory
  fakes in `pkg/spine/memory/` (OutboxStore/DecisionRepository/AuditLog/EventBus/ConsumerOffsets) (depends
  on T019, T034).
- [ ] T036 [P] [US3] Implement the integration adapters: `pkg/spine/pg` (OutboxStore/DecisionRepository over
  pgx+PostgreSQL) and `pkg/spine/redpanda` (EventBus over franz-go), used only by
  `outbox_integration_test.go` (build tag `integration`) (depends on T034).

**Checkpoint**: command → outbox → bus → projection → audit works (fakes) and passes the integration lane.

---

## Phase 6 (P5): User Story 4 — OverrideRecord + Appeal (Go + OPA) (Priority: P4)

**Goal**: complete the six-contract set — `OverrideRecord` requires **four-eyes** for override classes and
**preserves the original**; `Appeal` requires an **independent reviewer** ≠ the decision owner — enforced in
Go **and** OPA.

**Independent Test**: override with two distinct human approvers passes; model/single rejected; target
unchanged. Appeal distinct reviewer passes; reviewer==authorized_human rejected; `late`/`reopened`
recordable. Golden: [G-OVR](./spec.md#g-ovr--overriderecord-four-eyes),
[G-APL](./spec.md#g-apl--appeal-reviewer-independence).

### Tests (write first, ensure they fail)

- [ ] T037 [P] [US4] `OverrideRecord` tests asserting the full
  [G-OVR](./spec.md#g-ovr--overriderecord-four-eyes) table (two distinct staff pass; `MODEL`/`SYSTEM` ⇒
  `*AuthorityForgeryError`; same-ref/single ⇒ `*FourEyesError`; target unchanged;
  `causation_id==target_decision`) in `pkg/platform/override_test.go` (FR-017, SC-008).
- [ ] T038 [P] [US4] `Appeal` tests asserting the full [G-APL](./spec.md#g-apl--appeal-reviewer-independence)
  table (`independent_reviewer` ≠ `authorized_human` passes; equal ⇒ `*ReviewerConflictError`;
  `reopened`/`late` pass; out-of-enum status ⇒ `*NamedFieldError{Field:"status"}`; target unchanged) in
  `pkg/platform/appeal_test.go` (FR-018, SC-009).
- [ ] T039 [P] [US4] Rego tests `policies/override_test.rego` + `policies/appeal_test.rego` asserting the
  `gt100k.override.deny` (model/system approver, <2 distinct) and `gt100k.appeal.deny` (reviewer conflict)
  mirrors (FR-017, FR-018, SC-008, SC-009).

### Implementation

- [ ] T040 [US4] Implement `ValidateOverrideRecord` + `AssertFourEyes` (append-only preservation of target;
  `causation_id` check) in `pkg/platform/override.go` (depends on T011, T017).
- [ ] T041 [US4] Implement `ValidateAppeal` + `AssertReviewerIndependent` (status enum) in
  `pkg/platform/appeal.go` (depends on T011, T017).
- [ ] T042 [US4] Implement `policies/override.rego` + `policies/appeal.rego`; extend the spine audit so
  recording an `OverrideRecord` writes `action:"override"` and filing an `Appeal` writes
  `action:"appeal_filed"` (over injected `OverrideRepository`/`AppealRepository` + `AuditLog`); add in-memory
  fakes for both repos in `pkg/spine/memory/`; test in `pkg/spine/override_appeal_audit_test.go` (FR-011,
  SC-008, SC-009; depends on T035, T040, T041).

**Checkpoint**: all six contracts validate in Go and OPA; override/appeal write audit entries.

---

## Phase 7 (P6): User Story 5 — Temporal deletion + enrollment stub + Terraform (Priority: P5)

**Goal**: provision (stub) → withdraw → **Temporal** durable deletion (idempotent/compensating, crypto-shred
stub); and the AWS runtime as validate-only Terraform (Core + Identity; Public/Sandbox/Sensitive reserved).

**Independent Test**: enrollment stub yields synthetic `EligibleLearner` (refs only); Temporal test suite
runs deletion to completion + compensation on injected failure; every Terraform module `validate`s and is
`fmt`-clean with `-backend=false`. Golden: [G-WD](./spec.md#g-wd--withdrawal-cascade),
[G-TF](./spec.md#g-tf--terraform-validate-only).

### Tests (write first, ensure they fail)

- [ ] T043 [P] [US5] Temporal workflow tests `workflows/deletion/deletion_test.go` using
  `testsuite.TestWorkflowEnvironment`: workflow runs to `Completed`; each activity invoked idempotently; an
  injected `CryptoShred` failure ⇒ retry/compensation ⇒ `Completed`; deletion audit preserved (FR-014,
  SC-006).
- [ ] T044 [P] [US5] Enrollment-stub test `services/identity-consent/enrollment_test.go`: the stub yields
  the synthetic `EligibleLearner` (references only, never raw data) honoring DP-1's shape (FR-013).
- [ ] T045 [P] [US5] Terraform validate test: a script `infra/terraform/validate_all.sh` (invoked by the
  gate) asserting [G-TF](./spec.md#g-tf--terraform-validate-only) per module (`init -backend=false` +
  `validate` + `fmt -check`) (FR-019, SC-010).

### Implementation

- [ ] T046 [US5] Implement the Temporal `DeletionWorkflow` (deterministic APIs) in
  `workflows/deletion/workflow.go` and its idempotent/compensating activities (`ErasePostgres`,
  `DeleteS3Objects`, `ClearRedis`, `CryptoShred` [KMS **stub**], `RecordDeletionAudit`) in
  `workflows/deletion/activities.go`; wire `WithdrawConsent`'s `DeletionStarter` to start it (depends on
  T030, T034).
- [ ] T047 [US5] Implement the enrollment-handoff stub (`EnrollmentHandoffSource` yielding the synthetic
  `EligibleLearner`) in `services/identity-consent/enrollment_stub.go` (depends on T034).
- [ ] T048 [P] [US5] Implement the Terraform modules under `infra/terraform/modules/` — `bootstrap-org`
  (AWS Organization + Core + Identity accounts + reserved Public/Sandbox/Sensitive boundaries), `network-vpc`
  (default-deny SGs, private subnets), `eks`, `rds` (PostgreSQL + pgvector, PITR variables), `s3-kms`
  (KMS-encrypted buckets + per-subject key hierarchy variables), `iam` (least-privilege/IRSA),
  `event-runtime` (managed Redpanda + Temporal wiring **variables** only) — each self-contained and
  `validate`-clean with `-backend=false`; US regions only (FR-019).
- [ ] T049 [P] [US5] Implement `infra/terraform/environments/dev/` composition wiring the modules with
  placeholder variables + `terraform.tfvars.example` (from
  [spec.md → Env / secrets](./spec.md#env--secrets)); confirm `validate`/`fmt -check` (depends on T048).

**Checkpoint**: provision → withdraw → Temporal deletion loop + `terraform validate` all green.

---

## Phase 8 (P7): Polish & Cross-Cutting

- [ ] T050 [P] Add `pkg/platform/README.md` (envelope + **six** contracts + invariants; public API; note
  override/appeal **workflows** deferred) and `pkg/spine/README.md` (interfaces; outbox/consumer pattern;
  OPA edge; deferred production seams).
- [ ] T051 Implement the headless demo `cmd/demo/main.go` driving the full spine path (provision → consent/
  assent → OPA authorize → command → outbox → projection → override → appeal → withdraw → Temporal deletion)
  per [quickstart.md](./quickstart.md).
- [ ] T052 [P] Add a determinism/replay test (injected `Clock`+`IDGenerator` ⇒ identical records; Temporal
  replay determinism) in `pkg/platform/replay_test.go` + `workflows/deletion/replay_test.go` (FR-016).
- [ ] T053 [P] Add the **golden tests** `pkg/platform/golden_test.go` + `pkg/spine/golden_test.go` asserting
  every table in [spec.md → Golden Values](./spec.md#golden-values--tolerances) (G-ENV, G-DEC, G-ASSENT,
  G-IDEM, G-OVR, G-APL) against the seed fixtures, plus `policies/` for G-AUTH (SC-011).
- [ ] T054 Add `runbooks/foundation-spine.md` (spine ops notes: gate commands, integration lane, deferred
  production direction) and run [quickstart.md](./quickstart.md) end-to-end; confirm `make gate` fully green.
- [ ] T055 **[shared-file, final]** Add the git-ignored placeholders `.env.local` (from
  [spec.md → Env / secrets](./spec.md#env--secrets)) and
  `infra/terraform/environments/dev/terraform.tfvars.example`, plus `.gitignore` lines for `.env.local`,
  `**/terraform.tfvars`, and `**/*.tfstate*`. **These are the only edits touching shared/root files** —
  reconcile at merge.

---

## Dependencies & Execution Order

- **Setup (P0)** → **Foundational (P1, blocks all stories)** → **US1 (P2, MVP)** → **US2 (P3, depends on
  US1 contracts + fixtures)** → **US3 (P4, depends on US1 contracts + US2 authz edge)** → **US4 (P5, depends
  on US1 contracts/invariants only)** → **US5 (P6, depends on US2 consent service + US3 interfaces)** →
  **Polish (P7)**.
- US2's OPA edge + consent service feed US3's `HandleCommand`; US3's outbox/consumer logic (T031/T035) can
  start once Foundational + US1 are done.
- **US4 (T037–T042) depends only on US1 + Foundational** (envelope, `DecisionRecord`, invariants), so it can
  run in parallel with US2/US3.
- **US5 Terraform (T045/T048/T049)** is independent of the Go stories and can run in parallel from P0.
- T055 (placeholders + `.gitignore`) is strictly **last** — the single shared-file touch.

## Parallel Opportunities

- Setup: T002–T005 in parallel (distinct dirs).
- Foundational: T008/T009 in parallel (distinct proto files); T011/T012 after T010.
- US1: tests T013–T016 in parallel; impl T018/T019 in parallel after T017.
- US2: tests T021–T026 in parallel; impls T027 (contracts) / T028 (rego) in parallel; T029/T030 after.
- US3: tests T031/T032/T033 in parallel; impl T036 (integration adapters) in parallel with T035.
- US4: tests T037–T039 in parallel; impls T040/T041 in parallel; can overlap US2/US3.
- US5: Terraform (T048/T049) fully parallel with all Go work; T043/T044 in parallel.
- Polish: T050/T052/T053 in parallel.

## Implementation Strategy

- **MVP = Setup + Foundational + US1** (the `buf` contract registry + envelope + core contracts + enforced
  invariants + the `buf` gate) → validate → then US2 (consent/assent + OPA authorization) → US3 (outbox +
  idempotent consumers + audit) → US4 (override + appeal, Go + OPA) → US5 (Temporal deletion + enrollment
  stub + validate-only Terraform).
- Commit per task or logical group; test-gated (write tests first, watch them fail, then implement); one PR
  per increment (governed flow). **Synthetic-only**; the legal layer is mechanical + stubbed; **no
  `terraform apply`, no live broker, no cloud creds**; the mandatory gate is hermetic.
- **Run only on the Go/buf/OPA/Terraform CI workflow** (T006), never the TS loop batch.

## Summary

- **Total tasks**: 55 (T001–T055)
- **US1**: 8 (T013–T020) · **US2**: 10 (T021–T030) · **US3**: 6 (T031–T036) · **US4**: 6 (T037–T042) ·
  **US5**: 7 (T043–T049) · Setup 7 · Foundational 5 · Polish 6
- **MVP scope**: Setup + Foundational + US1 (`buf` contract registry + envelope + core contracts +
  invariants + `buf` gate).
- **In scope, now closed on the real stack**: the six-contract `buf` set + generated Go, OPA/Rego
  authorization + four-eyes/appeal mirrors, the transactional outbox + idempotent consumers (fakes +
  testcontainers), the Temporal deletion workflow (SDK test suite), and validate-only Terraform — the
  parent §32.1 substrate, built with its production tools.
- **Deferred (no tasks)**: `terraform apply` + AWS org, managed Redpanda/Temporal runtime ops, real KMS
  crypto-shred, cosign bundle/image signing + SBOMs, mTLS/observability wiring, Argo CD/OpenFeature,
  application shells, per-service Go module split, and the override/appeal **human workflows** — see
  [plan.md](./plan.md) "Deferred: production direction".
