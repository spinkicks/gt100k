# Tasks: Platform Foundation Spine

**Input**: Design documents from `specs/005-foundation-spine/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/foundation-spine.md, quickstart.md
**Tests**: INCLUDED — the constitution makes tests part of "done" and `contracts/foundation-spine.md`
defines explicit test obligations. **Write tests first; ensure they fail before implementing.**

**Definition of done (build-loop gate)**: `tsc -b` clean **and** Vitest green. This is a pure-TypeScript,
locally-testable reference of the spine's core logic — **no** Redpanda/Temporal/OPA/PostgreSQL/AWS/
Terraform work appears below; that is the deferred production direction (see [plan.md](./plan.md)).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete-task dependency)
- **[Story]**: US1 / US2 / US3 (setup, foundational, polish carry no story label)
- Every task names exact file paths.

## Path conventions (from plan.md — TS monorepo)

- Contracts domain: `packages/platform-contracts/src/`, tests `packages/platform-contracts/test/`
- Spine domain: `packages/platform-spine/src/`, tests `packages/platform-spine/test/`
- Adapters: `adapters/spine-repo-memory/`, `adapters/spine-bus-memory/`, `adapters/enrollment-stub/`

**Parallel-safety**: all work is in new dirs above. **No shared root file is edited** except the final
task (T034), which adds composite project references to the root `tsconfig.json` — the single
human-reconciled merge point.

---

## Phase 1: Setup (package scaffolding — new dirs only)

- [ ] T001 [P] Scaffold `@gt100k/platform-contracts` package: `packages/platform-contracts/package.json`
  (private, `type: module`, `main`/`types` → `./src/index.ts`, `test: vitest run`), `tsconfig.json`
  (extends `../../tsconfig.base.json`, `rootDir: "."`, `outDir: "dist"`, include `src`/`test`), and an
  empty `src/index.ts`.
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

**Checkpoint**: workspace globs (`packages/*`, `adapters/*`) discover the new packages; empty builds run.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: no user-story work begins until this phase is complete.

- [ ] T006 [P] Define `ActorRef` (with `class`: human/guardian/child/staff/model/system, and `role`) in
  `packages/platform-contracts/src/actor.ts` per `data-model.md`.
- [ ] T007 [P] Define `EnvelopeHeader` type + `SCHEMA_VERSIONS` constants in
  `packages/platform-contracts/src/envelope.ts` per `data-model.md` (no validator yet).
- [ ] T008 Define shared invariant helpers in `packages/platform-contracts/src/invariants.ts`:
  `assertEnvelopeComplete(header)`, `assertHumanAuthority(actor)`, `assertAppendOnly(existingIds, id)`
  (depends on T006, T007).
- [ ] T009 Define all ports in `packages/platform-spine/src/ports.ts` per `data-model.md`
  (`Clock`, `IdGenerator`, `ConsentRepository`, `AssentRepository`, `IdentityRepository`,
  `DecisionRepository`, `AuditLog`, `OutboxStore`, `EventBus`, `ConsumerOffsets`,
  `EnrollmentHandoffSource`, and the **stub-only** `DeletionWorkflow`).

**Checkpoint**: core types, invariants, and ports exist — stories can begin.

---

## Phase 3: User Story 1 — Emit a traceable, invariant-enforced contract (Priority: P1) 🎯 MVP

**Goal**: the versioned envelope + four contracts + validators enforce every invariant — most critically
that **a model output can never fill `DecisionRecord.authorized_human`** and a consequential decision
needs a named human + policy result.

**Independent Test**: construct each contract; complete envelope validates, incomplete is rejected by
field name; a `DecisionRecord` with a `model` actor in `authorized_human` is rejected; distinct
`occurred_at`/`recorded_at`.

### Tests (write first, ensure they fail)

- [ ] T010 [P] [US1] Envelope tests (complete passes; each missing/empty required field rejected by
  name; `model_version` nullable; `evidence_refs` must exist) in
  `packages/platform-contracts/test/envelope.test.ts` (FR-001, SC-001).
- [ ] T011 [P] [US1] `LearnerEvent` tests (envelope complete; distinct occurred/recorded; required
  fields) in `packages/platform-contracts/test/learner-event.test.ts` (FR-002).
- [ ] T012 [P] [US1] `DecisionRecord` tests (consequential ⇒ human + policy required; **`model`/`system`
  in `authorized_human` rejected in 100% of attempts**; append-only via `assertAppendOnly`) in
  `packages/platform-contracts/test/decision.test.ts` (FR-005, SC-002).
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

## Phase 4: User Story 2 — Consent/assent lifecycle + purpose authorization (Priority: P2)

**Goal**: pseudonymous identity; consent grant/withdraw with expiry; child assent veto; a deterministic
**deny-by-default** authorization predicate returning `policy_version`; withdrawal blocks new processing.

**Independent Test**: grant→allow, withdraw→deny (recorded), unknown role/purpose→deny-by-default,
jurisdiction mismatch→deny, child refusal + guardian consent→blocked.

### Tests (write first, ensure they fail)

- [ ] T018 [P] [US2] `ConsentGrant` + `isConsentActive` tests (active in window; false when withdrawn/
  expired/before effective) in `packages/platform-contracts/test/consent.test.ts` (FR-003).
- [ ] T019 [P] [US2] `AssentRecord` + `assentBlocks` tests (honorable refusal blocks even with guardian
  consent present) in `packages/platform-contracts/test/assent.test.ts` (FR-004, SC-006).
- [ ] T020 [P] [US2] `authorize` tests (allow on active consent + matching rule + jurisdiction; deny on
  no consent, expired/withdrawn, jurisdiction mismatch, unknown role/purpose = deny-by-default; every
  result carries `policy_version`) in `packages/platform-spine/test/policy.test.ts` (FR-007, FR-008,
  SC-003).
- [ ] T021 [P] [US2] `withdrawConsent` tests (after withdrawal `isConsentActive` false + `authorize`
  denies; `DeletionWorkflow.requestDeletion` called; audit entry written) in
  `packages/platform-spine/test/consent-service.test.ts` (FR-014, SC-005).
- [ ] T022 [P] [US2] `provisionLearner` test (downstream receives only a pseudonymous `actor_ref`;
  eligibility handoff shape honored) in `packages/platform-spine/test/identity.test.ts` (FR-012, FR-013).

### Implementation

- [ ] T023 [P] [US2] Implement `ConsentGrant` + `validateConsentGrant` + `isConsentActive` in
  `packages/platform-contracts/src/consent.ts` (depends on T014).
- [ ] T024 [P] [US2] Implement `AssentRecord` + `validateAssentRecord` + `assentBlocks` in
  `packages/platform-contracts/src/assent.ts` (depends on T014); re-export from contracts `index.ts`.
- [ ] T025 [US2] Implement `authorize()` + `PolicyRule`/`PolicySet` (deny-by-default; returns
  `policy_version`) in `packages/platform-spine/src/policy.ts` (depends on T023).
- [ ] T026 [US2] Implement `grantConsent` / `withdrawConsent` (enqueues `DeletionWorkflow` stub; writes
  audit entry) in `packages/platform-spine/src/consent-service.ts`, and `recordAssent` in
  `packages/platform-spine/src/assent-service.ts` (depends on T023, T024, T009).
- [ ] T027 [US2] Implement `provisionLearner` + pseudonymous actor resolution (over the injected
  `IdentityRepository` + `EnrollmentHandoffSource` ports) in `packages/platform-spine/src/identity.ts`
  (depends on T009).
- [ ] T028 [P] [US2] Implement in-memory `ConsentRepository`, `AssentRepository`, `IdentityRepository`
  in `adapters/spine-repo-memory/src/` (depends on T009).
- [ ] T029 [P] [US2] Implement the synthetic `EnrollmentHandoffSource` + no-op `DeletionWorkflow` stub in
  `adapters/enrollment-stub/src/index.ts` (depends on T009).

**Checkpoint**: consent/assent/authorization work end-to-end against in-memory adapters, tested.

---

## Phase 5: User Story 3 — Transactional outbox + idempotent consumers (Priority: P3)

**Goal**: an authorized command commits `DecisionRecord` + outbox row + audit **atomically**; a relay
publishes with an idempotency key (at-least-once); consumers dedupe on `contract_id` (exactly-once
projection); every consequential action writes an append-only audit entry.

**Independent Test**: authorized command commits all-or-nothing; replay same `contract_id` → applied
once; synthetic burst of N → N-unique applied, no loss; denied command → `policy_deny` audit, no
decision.

### Tests (write first, ensure they fail)

- [ ] T030 [P] [US3] Outbox + `deliver` tests (atomic `UnitOfWork` commit all-or-nothing; replayed
  `contract_id` applied exactly once; N-event burst → no loss, no double-apply) in
  `packages/platform-spine/test/outbox.test.ts` (FR-009, FR-010, SC-004).
- [ ] T031 [P] [US3] `handleCommand` + audit tests (authorized ⇒ decision + outbox + audit committed;
  denied ⇒ `policy_deny` audit entry + no decision; audit is append-only + replayable) in
  `packages/platform-spine/test/command.test.ts` (FR-011, SC-003).

### Implementation

- [ ] T032 [US3] Implement the transactional outbox (`UnitOfWork` staging, `relay()` with idempotency
  key, at-least-once) in `packages/platform-spine/src/outbox.ts`, the idempotent consumer `deliver()`
  (dedup on `contract_id`) in `packages/platform-spine/src/bus.ts`, and `AuditEntry` helpers in
  `packages/platform-spine/src/audit.ts` (depends on T009, T016).
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

## Phase 6: Polish & Cross-Cutting

- [ ] T035 [P] Add `packages/platform-contracts/README.md` (envelope + four contracts + invariants;
  public API; note `OverrideRecord`/`Appeal` deferred).
- [ ] T036 [P] Add `packages/platform-spine/README.md` (ports usage; authorization predicate;
  outbox/consumer pattern; deferred production seams).
- [ ] T037 Implement the `demo` script in `adapters/enrollment-stub/src/demo.ts` driving the full spine
  path (provision → consent/assent → authorize → command → outbox → projection → withdraw) per
  `quickstart.md`, wired via the `demo` package script.
- [ ] T038 [P] Add a determinism/replay test (injected `Clock` + `IdGenerator` ⇒ identical records for
  identical inputs) in `packages/platform-spine/test/replay.test.ts` (FR-016).
- [ ] T039 Run `quickstart.md` validation end-to-end (allow + deny scenarios); confirm `tsc -b` clean and
  full Vitest suite green.
- [ ] T040 **[shared-file, final]** Add composite project references for the five new projects
  (`packages/platform-contracts`, `packages/platform-spine`, `adapters/spine-repo-memory`,
  `adapters/spine-bus-memory`, `adapters/enrollment-stub`) to the root `tsconfig.json`. **This is the
  only edit to a shared root file** — reconcile at merge.

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2, blocks all stories)** → **US1 (P1, MVP)** → **US2
  (P2, depends on US1 contracts)** → **US3 (P3, depends on US1 contracts + US2 authorization)** →
  **Polish**.
- US2's `authorize` + consent contracts feed US3's `handleCommand`; US3's outbox/consumer are otherwise
  independent, so US3's outbox logic (T030/T032) can start once Foundational + US1 are done.
- T040 (root `tsconfig.json` references) is strictly **last** and is the single shared-file touch.

## Parallel Opportunities

- Setup: T001–T005 all in parallel (distinct dirs).
- Foundational: T006/T007 in parallel; T008 after them; T009 in parallel with T006/T007.
- US1: tests T010–T013 in parallel; impl T015/T016 in parallel after T014.
- US2: tests T018–T022 in parallel; contract impls T023/T024 in parallel; adapters T028/T029 in parallel.
- US3: tests T030/T031 in parallel; adapter T034 in parallel with domain T032.

## Implementation Strategy

- **MVP = Setup + Foundational + US1** (the versioned envelope + four contracts + enforced invariants,
  tested) → validate → then US2 (consent/assent + deny-by-default authorization) → then US3 (outbox +
  idempotent consumers + audit).
- Commit per task or logical group; test-gated (write tests first, watch them fail, then implement);
  one PR per increment (governed flow). **Synthetic-only**; the legal layer is mechanical + stubbed; no
  consent/admissions/legal/infra machinery is built.

## Summary

- **Total tasks**: 40 (T001–T040)
- **US1**: 8 (T010–T017) · **US2**: 12 (T018–T029) · **US3**: 5 (T030–T034) · Setup 5 · Foundational 4 ·
  Polish 6
- **MVP scope**: Setup + Foundational + US1 (versioned contract envelope + four contracts + invariants).
- **Deferred (no tasks)**: Redpanda, Temporal + crypto-shred deletion, real OPA/Rego bundles,
  PostgreSQL, Go services, AWS/Terraform, observability, CI/CD signing, `OverrideRecord`/`Appeal` — see
  [plan.md](./plan.md) "Deferred: production direction".
