# Tasks: Platform Foundation Spine

**Input**: Design documents from `specs/005-foundation-spine/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/foundation-spine.md, quickstart.md
**Tests**: INCLUDED — the constitution makes tests part of "done" and `contracts/foundation-spine.md`
defines explicit test obligations, with exact expected results in
[spec.md → Golden Values](./spec.md#golden-values--tolerances). **Write tests first; ensure they fail
before implementing.**

**Definition of done (build-loop gate)**: `tsc -b` clean **and** Vitest green. This is a pure-TypeScript,
locally-testable reference of the spine's core logic — **no** Redpanda/Temporal/OPA/PostgreSQL/AWS/
Terraform work appears below; that is the deferred production direction (see [plan.md](./plan.md)).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete-task dependency)
- **[Story]**: US1 / US2 / US3 / US4 (setup, foundational, polish carry no story label)
- Every task names exact file paths.

## Path conventions (from plan.md — TS monorepo)

- Contracts domain: `packages/platform-contracts/src/`, tests `packages/platform-contracts/test/`
- Spine domain: `packages/platform-spine/src/`, tests `packages/platform-spine/test/`
- Adapters: `adapters/spine-repo-memory/`, `adapters/spine-bus-memory/`, `adapters/enrollment-stub/`

**Parallel-safety**: all work is in new dirs above. **No shared root file is edited** except the final
task (T047), which adds composite project references to the root `tsconfig.json` and the `.env.local`
placeholder + its `.gitignore` line — the single human-reconciled merge point.

**Phasing**: P0 Setup (T001–T005) · P1 Foundational (T006–T009) · P2 US1/MVP (T010–T017) · P3 US2
(T018–T029) · P4 US3 (T030–T034) · P5 US4 (T035–T040) · P6 Polish (T041–T047). See
[spec.md → Phasing](./spec.md#phasing-p0p6).

---

## Phase 1 (P0): Setup (package scaffolding — new dirs only)

- [ ] T001 [P] Scaffold `@gt100k/platform-contracts` package: `packages/platform-contracts/package.json`
  (private, `type: module`, `main`/`types` → `./src/index.ts`, `test: vitest run`), `tsconfig.json`
  (extends `../../tsconfig.base.json`, `rootDir: "."`, `outDir: "dist"`, include `src`/`test`), an empty
  `src/index.ts`, and the seeded smoke test `test/smoke.test.ts` (from
  [spec.md → Seeded smoke test](./spec.md#seeded-smoke-test-green-from-iteration-1)) so `pnpm test` is
  green from iteration 1.
- [ ] T002 [P] Scaffold `@gt100k/platform-spine` package: `packages/platform-spine/package.json`
  (dependency `@gt100k/platform-contracts: workspace:*`), `tsconfig.json` (extends base; `references:
  [{ path: "../platform-contracts" }]`), empty `src/index.ts`.
- [ ] T003 [P] Scaffold `adapters/spine-repo-memory/` (`package.json` dep `@gt100k/platform-spine` +
  `@gt100k/platform-contracts` `workspace:*`; `tsconfig.json` with references to both packages; empty
  `src/index.ts`).
- [ ] T004 [P] Scaffold `adapters/spine-bus-memory/` (`package.json`, `tsconfig.json` referencing
  `platform-spine`, empty `src/index.ts`).
- [ ] T005 [P] Scaffold `adapters/enrollment-stub/` (`package.json` with a `demo` script placeholder,
  `tsconfig.json` referencing `platform-spine`, empty `src/index.ts`).

**Checkpoint**: workspace globs (`packages/*`, `adapters/*`) discover the new packages; `tsc -b` and
`pnpm test` (smoke) run green.

---

## Phase 2 (P1): Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: no user-story work begins until this phase is complete.

- [ ] T006 [P] Define `ActorRef` (with `class`: human/guardian/child/staff/model/system, and `role`) in
  `packages/platform-contracts/src/actor.ts` per `data-model.md`.
- [ ] T007 [P] Define `EnvelopeHeader` type + `SCHEMA_VERSIONS` constants in
  `packages/platform-contracts/src/envelope.ts` per `data-model.md` (no validator yet).
- [ ] T008 Define shared invariant helpers + error classes in
  `packages/platform-contracts/src/invariants.ts`: `assertEnvelopeComplete(header)`,
  `assertHumanAuthority(actor)`, `assertAppendOnly(existingIds, id)`, `assertFourEyes(approvers)`,
  `assertReviewerIndependent(reviewer, authorizedHumanRef)`, and the error classes `NamedFieldError`,
  `AuthorityForgeryError`, `AppendOnlyError`, `FourEyesError`, `ReviewerConflictError` (depends on T006,
  T007).
- [ ] T009 Define all ports in `packages/platform-spine/src/ports.ts` per `data-model.md`
  (`Clock`, `IdGenerator`, `ConsentRepository`, `AssentRepository`, `IdentityRepository`,
  `DecisionRepository`, `OverrideRepository`, `AppealRepository`, `AuditLog`, `OutboxStore`, `EventBus`,
  `ConsumerOffsets`, `EnrollmentHandoffSource`, and the **stub-only** `DeletionWorkflow`).

**Checkpoint**: core types, invariants, error classes, and ports exist — stories can begin.

---

## Phase 3 (P2): User Story 1 — Emit a traceable, invariant-enforced contract (Priority: P1) 🎯 MVP

**Goal**: the versioned envelope + contracts + validators enforce every invariant — most critically that
**a model output can never fill `DecisionRecord.authorized_human`** and a consequential decision needs a
named human + policy result.

**Independent Test**: construct each contract; complete envelope validates, incomplete is rejected by
field name; a `DecisionRecord` with a `model` actor in `authorized_human` is rejected; distinct
`occurred_at`/`recorded_at`. Golden: [G-ENV](./spec.md#g-env--envelope-validation),
[G-DEC](./spec.md#g-dec--decisionrecord-invariants).

### Tests (write first, ensure they fail)

- [ ] T010 [P] [US1] Envelope tests asserting the full [G-ENV](./spec.md#g-env--envelope-validation) table
  (complete passes; each missing/empty required field rejected by `field` name; `model_version` nullable;
  `evidence_refs` empty-allowed-but-must-exist) in `packages/platform-contracts/test/envelope.test.ts`
  (FR-001, SC-001).
- [ ] T011 [P] [US1] `LearnerEvent` tests (envelope complete; distinct occurred/recorded; required
  fields present) in `packages/platform-contracts/test/learner-event.test.ts` (FR-002).
- [ ] T012 [P] [US1] `DecisionRecord` tests asserting the full
  [G-DEC](./spec.md#g-dec--decisionrecord-invariants) table (consequential ⇒ human + policy required;
  **`model`/`system` in `authorized_human` rejected in 100% of attempts**; non-consequential passes;
  append-only via `assertAppendOnly`) in `packages/platform-contracts/test/decision.test.ts`
  (FR-005, SC-002).
- [ ] T013 [P] [US1] `validatorFor(schema_version)` registry test (selects validator; unknown version
  errors) in `packages/platform-contracts/test/validate.test.ts` (FR-006).

### Implementation

- [ ] T014 [US1] Implement `EnvelopeHeader` validator `validateEnvelope` in
  `packages/platform-contracts/src/envelope.ts` (depends on T008).
- [ ] T015 [P] [US1] Implement `LearnerEvent` + `validateLearnerEvent` in
  `packages/platform-contracts/src/learner-event.ts` (depends on T014).
- [ ] T016 [P] [US1] Implement `DecisionRecord` + `validateDecisionRecord` (human-authority invariant via
  `assertHumanAuthority`; consequential ⇒ human + `policy_version`) in
  `packages/platform-contracts/src/decision.ts` (depends on T008, T014).
- [ ] T017 [US1] Implement `validatorFor(schema_version)` registry in
  `packages/platform-contracts/src/validate.ts` and export the public API from
  `packages/platform-contracts/src/index.ts` (depends on T014–T016).

**Checkpoint**: contracts validate and enforce invariants, unit-tested independently. **This is the MVP.**

---

## Phase 4 (P3): User Story 2 — Consent/assent lifecycle + purpose authorization (Priority: P2)

**Goal**: pseudonymous identity; consent grant/withdraw with expiry; child assent veto; a deterministic
**deny-by-default** authorization predicate returning `policy_version`; withdrawal blocks new processing.

**Independent Test**: grant→allow, withdraw→deny (recorded), unknown role/purpose→deny-by-default,
jurisdiction mismatch→deny, child refusal + guardian consent→blocked. Golden:
[G-AUTH](./spec.md#g-auth--authorization-decisions), [G-ASSENT](./spec.md#g-assent--assent-veto),
[G-WD](./spec.md#g-wd--withdrawal-cascade).

### Tests (write first, ensure they fail)

- [ ] T018 [P] [US2] `ConsentGrant` + `isConsentActive` tests (active in window; false when withdrawn/
  expired/before effective) in `packages/platform-contracts/test/consent.test.ts` (FR-003).
- [ ] T019 [P] [US2] `AssentRecord` + `assentBlocks` tests asserting the
  [G-ASSENT](./spec.md#g-assent--assent-veto) table (honorable refusal/dissent block; assent does not;
  non-honorable does not) in `packages/platform-contracts/test/assent.test.ts` (FR-004, SC-006).
- [ ] T020 [P] [US2] `authorize` tests asserting the full six-row
  [G-AUTH](./spec.md#g-auth--authorization-decisions) table (allow; `no_active_consent`;
  withdrawn/expired ⇒ `no_active_consent`; `jurisdiction_mismatch`; `deny_by_default`; every result
  carries `policy_version`) in `packages/platform-spine/test/policy.test.ts` (FR-007, FR-008, SC-003).
- [ ] T021 [P] [US2] `withdrawConsent` tests asserting [G-WD](./spec.md#g-wd--withdrawal-cascade) (after
  withdrawal `isConsentActive` false + `authorize` denies `no_active_consent`; `DeletionWorkflow.
  requestDeletion` called **exactly once**; **exactly one** `consent_withdrawn` audit entry) in
  `packages/platform-spine/test/consent-service.test.ts` (FR-014, SC-005).
- [ ] T022 [P] [US2] `provisionLearner` test (downstream receives only a pseudonymous `actor_ref`;
  eligibility handoff shape honored — references only) in
  `packages/platform-spine/test/identity.test.ts` (FR-012, FR-013).

### Implementation

- [ ] T023 [P] [US2] Implement `ConsentGrant` + `validateConsentGrant` + `isConsentActive` in
  `packages/platform-contracts/src/consent.ts` (depends on T014).
- [ ] T024 [P] [US2] Implement `AssentRecord` + `validateAssentRecord` + `assentBlocks` in
  `packages/platform-contracts/src/assent.ts` (depends on T014); re-export from contracts `index.ts`.
- [ ] T025 [US2] Implement `authorize()` + `PolicyRule`/`PolicySet` (deny-by-default; fixed reason-code
  precedence per [G-AUTH](./spec.md#g-auth--authorization-decisions); returns `policy_version`) in
  `packages/platform-spine/src/policy.ts` (depends on T023).
- [ ] T026 [US2] Implement `grantConsent` / `withdrawConsent` (enqueues `DeletionWorkflow` stub once;
  writes `consent_withdrawn` audit entry) in `packages/platform-spine/src/consent-service.ts`, and
  `recordAssent` in `packages/platform-spine/src/assent-service.ts` (depends on T023, T024, T009).
- [ ] T027 [US2] Implement `provisionLearner` + pseudonymous actor resolution (over the injected
  `IdentityRepository` + `EnrollmentHandoffSource` ports) in `packages/platform-spine/src/identity.ts`
  (depends on T009).
- [ ] T028 [P] [US2] Implement in-memory `ConsentRepository`, `AssentRepository`, `IdentityRepository`
  in `adapters/spine-repo-memory/src/` (depends on T009).
- [ ] T029 [P] [US2] Implement the synthetic `EnrollmentHandoffSource` + no-op `DeletionWorkflow` stub +
  the canonical `fixtures.ts` (from [spec.md → Seed fixtures](./spec.md#seed-fixtures-in-repo)) in
  `adapters/enrollment-stub/src/` (depends on T009).

**Checkpoint**: consent/assent/authorization work end-to-end against in-memory adapters, tested.

---

## Phase 5 (P4): User Story 3 — Transactional outbox + idempotent consumers (Priority: P3)

**Goal**: an authorized command commits `DecisionRecord` + outbox row + audit **atomically**; a relay
publishes with an idempotency key (at-least-once); consumers dedupe on `contract_id` (exactly-once
projection) under replay **and** out-of-order delivery; every consequential action writes an append-only
audit entry.

**Independent Test**: authorized command commits all-or-nothing; replay same `contract_id` → applied
once; out-of-order delivery → each distinct event applied once; synthetic burst of N → N-unique applied,
no loss; denied command → `policy_deny` audit, no decision. Golden:
[G-IDEM](./spec.md#g-idem--idempotencydedup).

### Tests (write first, ensure they fail)

- [ ] T030 [P] [US3] Outbox + `deliver` tests asserting [G-IDEM](./spec.md#g-idem--idempotencydedup):
  atomic `UnitOfWork` commit all-or-nothing; sequence `[A,B,A,C,B,A]` → `deliver` returns
  `[true,true,false,true,false,false]`, `count === 3`; out-of-order case → both applied, re-deliver
  skipped; N=100 burst delivered twice → 100 true / 100 false, `count === 100`) in
  `packages/platform-spine/test/outbox.test.ts` (FR-009, FR-010, SC-004).
- [ ] T031 [P] [US3] `handleCommand` + audit tests (authorized ⇒ decision + outbox + audit committed;
  denied ⇒ **exactly one** `policy_deny` audit entry + no decision; audit append-only + replayable) in
  `packages/platform-spine/test/command.test.ts` (FR-011, SC-003).

### Implementation

- [ ] T032 [US3] Implement the transactional outbox (`UnitOfWork` staging, `relay()` with idempotency
  key, at-least-once) in `packages/platform-spine/src/outbox.ts`, the idempotent consumer `deliver()`
  (dedup on `contract_id`, order-independent) in `packages/platform-spine/src/bus.ts`, and `AuditEntry`
  helpers in `packages/platform-spine/src/audit.ts` (depends on T009, T016).
- [ ] T033 [US3] Implement `handleCommand()` full path (resolve actor → load active consents →
  `authorize` → on allow build human-authorized `DecisionRecord` + `LearnerEvent` and commit the
  `UnitOfWork` atomically → on deny write `policy_deny` audit) in
  `packages/platform-spine/src/command.ts`, and export the spine public API from
  `packages/platform-spine/src/index.ts` (depends on T025, T026, T032).
- [ ] T034 [P] [US3] Implement in-memory `DecisionRepository`, `AuditLog`, `OutboxStore`,
  `ConsumerOffsets` in `adapters/spine-repo-memory/src/`, and the in-process `EventBus` in
  `adapters/spine-bus-memory/src/index.ts` (depends on T009).

**Checkpoint**: the full command → outbox → bus → projection → audit path works headless and is tested.

---

## Phase 6 (P5): User Story 4 — OverrideRecord + Appeal contracts (Priority: P4)

**Goal**: complete the six-contract foundation set — an `OverrideRecord` requires **four-eyes** (two
distinct human approvers, never model/system) for override classes and **preserves the original**
`DecisionRecord`; an `Appeal` requires an **independent reviewer** ≠ the original decision owner and does
not mutate the target.

**Independent Test**: override with two distinct human approvers passes; model approver / single approver
rejected; target decision unchanged. Appeal with distinct reviewer passes; reviewer == authorized_human
rejected; `late`/`reopened` recordable. Golden: [G-OVR](./spec.md#g-ovr--overriderecord-four-eyes),
[G-APL](./spec.md#g-apl--appeal-reviewer-independence).

### Tests (write first, ensure they fail)

- [ ] T035 [P] [US4] `OverrideRecord` tests asserting the full
  [G-OVR](./spec.md#g-ovr--overriderecord-four-eyes) table (two distinct staff approvers pass; a `model`/
  `system` approver ⇒ `AuthorityForgeryError`; same-ref or single approver for an override class ⇒
  `FourEyesError`; target `DecisionRecord` unchanged; `header.causation_id === target_decision`) in
  `packages/platform-contracts/test/override.test.ts` (FR-017, SC-008).
- [ ] T036 [P] [US4] `Appeal` tests asserting the full
  [G-APL](./spec.md#g-apl--appeal-reviewer-independence) table (`independent_reviewer` ≠ `authorized_human`
  passes; equal ⇒ `ReviewerConflictError`; `reopened`/`late` pass; out-of-enum `status` ⇒ `NamedFieldError`
  on `status`; target decision unchanged after filing) in
  `packages/platform-contracts/test/appeal.test.ts` (FR-018, SC-009).

### Implementation

- [ ] T037 [US4] Implement `OverrideRecord` + `validateOverrideRecord` (four-eyes via `assertFourEyes`;
  append-only preservation of the target) in `packages/platform-contracts/src/override.ts`
  (depends on T008, T014).
- [ ] T038 [US4] Implement `Appeal` + `validateAppeal` (reviewer independence via
  `assertReviewerIndependent`; status enum) in `packages/platform-contracts/src/appeal.ts`
  (depends on T008, T014).
- [ ] T039 [US4] Register `override_record/*` and `appeal/*` validators in
  `packages/platform-contracts/src/validate.ts` and export both contracts from
  `packages/platform-contracts/src/index.ts` (depends on T037, T038).
- [ ] T040 [US4] Extend `AuditEntry` helpers so recording an `OverrideRecord` writes an `action:
  "override"` entry and filing an `Appeal` writes `action: "appeal_filed"`, over the injected
  `OverrideRepository`/`AppealRepository` + `AuditLog` ports; add in-memory `OverrideRepository` +
  `AppealRepository` in `adapters/spine-repo-memory/src/`; test in
  `packages/platform-spine/test/override-appeal-audit.test.ts` (FR-011, SC-008, SC-009; depends on T032,
  T037, T038).

**Checkpoint**: all six contracts validate and enforce their invariants; override/appeal write audit
entries.

---

## Phase 7 (P6): Polish & Cross-Cutting

- [ ] T041 [P] Add `packages/platform-contracts/README.md` (envelope + **six** contracts + invariants;
  public API; note override/appeal **workflows** deferred).
- [ ] T042 [P] Add `packages/platform-spine/README.md` (ports usage; authorization predicate;
  outbox/consumer pattern; deferred production seams).
- [ ] T043 Implement the `demo` script in `adapters/enrollment-stub/src/demo.ts` driving the full spine
  path (provision → consent/assent → authorize → command → outbox → projection → override → appeal →
  withdraw) per `quickstart.md`, wired via the `demo` package script.
- [ ] T044 [P] Add a determinism/replay test (injected `Clock` + `IdGenerator` ⇒ identical records for
  identical inputs) in `packages/platform-spine/test/replay.test.ts` (FR-016).
- [ ] T045 [P] Add the **golden-fixtures test** asserting every table in
  [spec.md → Golden Values](./spec.md#golden-values--tolerances) against the canonical `fixtures.ts`
  (G-ENV, G-DEC, G-ASSENT, G-AUTH, G-IDEM, G-WD, G-OVR, G-APL) in
  `packages/platform-spine/test/golden.test.ts` (SC-007).
- [ ] T046 Run `quickstart.md` validation end-to-end (allow + deny scenarios; override + appeal; withdrawal
  cascade); confirm `tsc -b` clean and full Vitest suite green.
- [ ] T047 **[shared-file, final]** Add composite project references for the five new projects
  (`packages/platform-contracts`, `packages/platform-spine`, `adapters/spine-repo-memory`,
  `adapters/spine-bus-memory`, `adapters/enrollment-stub`) to the root `tsconfig.json`, and add the
  `.env.local` placeholder (from [spec.md → Env / secrets](./spec.md#env--secrets)) + its `.gitignore`
  line. **These are the only edits to shared root files** — reconcile at merge.

---

## Dependencies & Execution Order

- **Setup (P0)** → **Foundational (P1, blocks all stories)** → **US1 (P2, MVP)** → **US2 (P3, depends on
  US1 contracts)** → **US3 (P4, depends on US1 contracts + US2 authorization)** → **US4 (P5, depends on
  US1 contracts/invariants only)** → **Polish (P6)**.
- US2's `authorize` + consent contracts feed US3's `handleCommand`; US3's outbox/consumer are otherwise
  independent, so US3's outbox logic (T030/T032) can start once Foundational + US1 are done.
- **US4 (T035–T040) depends only on US1 + Foundational** (envelope, `DecisionRecord`, invariants), so it
  can run in parallel with US2/US3 once US1 is complete.
- T047 (root `tsconfig.json` references + `.env.local`/`.gitignore`) is strictly **last** and is the single
  shared-file touch.

## Parallel Opportunities

- Setup: T001–T005 all in parallel (distinct dirs).
- Foundational: T006/T007 in parallel; T008 after them; T009 in parallel with T006/T007.
- US1: tests T010–T013 in parallel; impl T015/T016 in parallel after T014.
- US2: tests T018–T022 in parallel; contract impls T023/T024 in parallel; adapters T028/T029 in parallel.
- US3: tests T030/T031 in parallel; adapter T034 in parallel with domain T032.
- US4: tests T035/T036 in parallel; impls T037/T038 in parallel; can overlap US2/US3 entirely.
- Polish: T041/T042/T044/T045 in parallel.

## Implementation Strategy

- **MVP = Setup + Foundational + US1** (the versioned envelope + core contracts + enforced invariants,
  tested) → validate → then US2 (consent/assent + deny-by-default authorization) → then US3 (outbox +
  idempotent consumers + audit) → then US4 (override + appeal contracts).
- Commit per task or logical group; test-gated (write tests first, watch them fail, then implement);
  one PR per increment (governed flow). **Synthetic-only**; the legal layer is mechanical + stubbed; no
  consent/admissions/legal/infra machinery is built.

## Summary

- **Total tasks**: 47 (T001–T047)
- **US1**: 8 (T010–T017) · **US2**: 12 (T018–T029) · **US3**: 5 (T030–T034) · **US4**: 6 (T035–T040) ·
  Setup 5 · Foundational 4 · Polish 7
- **MVP scope**: Setup + Foundational + US1 (versioned contract envelope + core contracts + invariants).
- **In scope, now closed**: the full six-contract foundation set (`LearnerEvent`, `ConsentGrant`,
  `AssentRecord`, `DecisionRecord`, `OverrideRecord`, `Appeal`) + audit — parent §32.1's contract list.
- **Deferred (no tasks)**: Redpanda, Temporal + crypto-shred deletion, real OPA/Rego bundles,
  PostgreSQL, Go services, AWS/Terraform, observability, CI/CD signing, and the override/appeal **human
  workflows** — see [plan.md](./plan.md) "Deferred: production direction".
