# Tasks: Cohort Compiler + RivalryMix

**Input**: Design documents from `specs/006-cohort-compiler/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cohort-compiler.md, quickstart.md
**Tests**: INCLUDED — the constitution makes tests part of "done" and `contracts/cohort-compiler.md` defines explicit test obligations. Write tests first; ensure they fail before implementing.

**Phase ↔ P-number mapping** (from [spec.md § Phasing P0–P6](./spec.md#phasing-p0p6)): **P0** = Phase 1
Setup + Phase 2 Foundational; **P1** = Phase 3 (US1, MVP); **P2** = US2 solver/feasibility (T011–T013,
T019–T021); **P3** = US2 commit/rollback/churn (T014–T015, T022–T023); **P4** = US2 repair/safeguarding/
shadow (T016–T018, T024–T027); **P5** = Phase 5 (US3); **P6** = Phase 6 Polish + the single `tsconfig.json`
touch. Golden fixtures the tests assert against live in
[spec.md § Golden Values](./spec.md#golden-values--seed-fixtures).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete-task dependency)
- **[Story]**: US1 / US2 / US3 (setup, foundational, polish carry no story label)

## Path conventions (from plan.md — TS monorepo)

- Domain: `packages/cohort-compiler/src/`, tests `packages/cohort-compiler/test/`
- Adapters: `adapters/cohort-candidates-memory/`, `adapters/cohort-repo-memory/`, `adapters/cohort-safeguarding-memory/`, `adapters/cohort-media-stub/`, `adapters/cohort-benefit-shadow/`

## Parallel-safety note (read before starting)

All work lives in **new** directories (`packages/cohort-compiler`, `adapters/cohort-*`). The root workspace glob (`packages/*`, `adapters/*`) and the Vitest include (`packages/**/test`, `adapters/**/test`) already discover them, so **do NOT edit** `package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, or `biome.json` at the repo root. The **only** shared-file edit is the final task (`T036`, root `tsconfig.json` references), flagged for a human to reconcile at merge. The domain package MUST contain **no** `Math.random`, no wall-clock reads, and no I/O (time is passed in).

---

## Phase 1 — P0: Setup (new dirs only)

- [ ] T001 Scaffold the `@gt100k/cohort-compiler` package: `packages/cohort-compiler/package.json` (name `@gt100k/cohort-compiler`, `type: module`, `main`/`types` → `./src/index.ts`, `test: vitest run`), `packages/cohort-compiler/tsconfig.json` (extends `../../tsconfig.base.json`, `rootDir: .`, `outDir: dist`, include `src`/`test`), and an empty `packages/cohort-compiler/src/index.ts`. Do not touch any shared root file.

---

## Phase 2 — P0: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: no user-story work begins until this phase is complete.

- [ ] T002 [P] Define all domain types in `packages/cohort-compiler/src/model.ts` (`AgeBand`, `LevelBand`/`VelocityBand` fields, `ScheduleAvailability`, `Accommodations`, `LearnerProfile`, `Caliper`, `CandidateSet`, `HardConstraints`, `ObjectiveWeights`, `ObjectiveTerms`, `Cohort`, `CohortAssignment`, `ChurnBudget`, `CommitResult`, `CohortHealthEvent`, `TurnEvent`, `TurnAnalysis`, `BenefitLCB`) per `data-model.md`. `TurnAnalysis` MUST have no field for honesty/emotion/personality/motivation (FR-022).
- [ ] T003 [P] Define ports in `packages/cohort-compiler/src/ports.ts` (`CandidateIndex`, `CohortRepository`, `SafeguardingSink`, plus **deferred/shadow stub ports** `MediaTurnSource` [§15.1 media plane deferred] and `BenefitEstimator` [shadow, post-lock only]) per `contracts/cohort-compiler.md`.
- [ ] T038 [P] Commit the in-repo **seed fixtures** with their golden expected values in `packages/cohort-compiler/test/fixtures/` — `caliper-8.ts` (Fixture A), `cohort-12.ts` (Fixtures B/B2/B3), `churn-rollback.ts` (Fixture C), `safeguarding-shadow.ts` (Fixture D), `turns.ts` (Fixture E), exactly as tabulated in [spec.md § Golden Values](./spec.md#golden-values--seed-fixtures). Typed against `model.ts` (depends on T002).
- [ ] T039 Add the **seeded smoke test** `packages/cohort-compiler/test/smoke.test.ts` (imports the package entrypoint; asserts the module loads and `caliper-8` has 8 learners with unique refs) so `pnpm test` is green from iteration 1 (depends on T001, T038).

**Checkpoint**: domain types, ports, seed fixtures, and a green smoke test exist — stories can begin.

---

## Phase 3 — P1: User Story 1 — Near-peer candidate generation (Priority: P1) 🎯 MVP

**Goal**: deterministic near-peer candidate sets via a level+velocity caliper (kNN filter), excluding self + safeguarding-separated peers, with a stable hash. HNSW deferred.

**Independent Test**: build a synthetic pool → every candidate is within both calipers; self and separated peers excluded; repeated runs are byte-identical with an identical candidate-set hash; no caste rank / full-field ranking is produced.

### Tests (write first, ensure they fail)

- [ ] T004 [P] [US1] Contract test for `withinCaliper` (within both tolerances; boundary `==` is within; `>` is out) in `packages/cohort-compiler/test/caliper.test.ts` (FR-002)
- [ ] T005 [P] [US1] Contract test for `generateCandidates` asserting the **exact** golden candidate sets of [Fixture A `caliper-8`](./spec.md#fixture-a-caliper-8-us1) (only within-caliper candidates; self + `separations` excluded; deterministic ordering by Manhattan distance then ref; `L5` empty; stable candidate-set hash per the pinned FNV-1a recipe; no caste rank/full-field ranking) in `packages/cohort-compiler/test/candidates.test.ts` (FR-002/FR-003/FR-004/FR-006, SC-001)
- [ ] T006 [P] [US1] Contract test for the in-memory `CandidateIndex` adapter (`candidatesFor` returns the same set as the domain function; HNSW seam marked not-implemented) in `adapters/cohort-candidates-memory/test/index.test.ts` (FR-005) *(write first, ensure it fails)*

### Implementation

- [ ] T007 [US1] Implement `withinCaliper(a, b, caliper)` + distance helper in `packages/cohort-compiler/src/caliper.ts` (depends on T002)
- [ ] T008 [US1] Implement `generateCandidates(pool, caliper)` (kNN/caliper filter; exclude self + separations; deterministic sort; stable hash) in `packages/cohort-compiler/src/candidates.ts` (depends on T002, T007)
- [ ] T009 [US1] Implement the in-memory `CandidateIndex` adapter in `adapters/cohort-candidates-memory/` (`package.json`, `tsconfig.json`, `src/index.ts`; wraps `generateCandidates`; HNSW seam marked deferred, PRD §15) (depends on T003, T008)
- [ ] T010 [US1] Export `model`, `caliper`, and `candidates` APIs from `packages/cohort-compiler/src/index.ts`

**Checkpoint**: near-peer candidate generation works and is unit-tested independently — **MVP demonstrable**.

---

## Phase 4 — P2/P3/P4: User Story 2 — Compile cohorts of six under hard constraints, atomically, within a churn budget (Priority: P2)

**Goal**: feasible cohorts of six honoring all hard constraints; deterministic greedy + local-search/repair; `CohortAssignment` snapshot; atomic commit + rollback; one active assignment per learner; weekly churn cap; in-budget repair; safeguarding bypass; no learned-model assignment (benefit LCB shadow/post-lock only). CP-SAT + PostgreSQL deferred.

**Independent Test**: feed a synthetic pool (or pre-built candidate sets) → every cohort has six members and zero hard-constraint violations; commit → one active assignment per learner + prior retained; rollback → exact prior; over-budget change refused without an exception; bullying report bypasses the optimizer to the human sink without changing a rating.

### Tests (write first, ensure they fail)

- [ ] T011 [P] [US2] Contract test for `isFeasibleCohort` (each of the 7 hard constraints rejected independently; the non-harm floor golden [Fixture B3 `nonharm-reject`](./spec.md#fixture-b3-nonharm-reject-us2): mean 0.708 ≥ floor 0.5 but `M5` at 0.45 → rejected, proving per-member/never-averaged; boundary `0.50` → feasible) in `packages/cohort-compiler/test/constraints.test.ts` (FR-007/FR-008/FR-009, SC-002)
- [ ] T012 [P] [US2] Contract test for `scoreObjective` (deterministic soft score ranks feasible options; a higher score never promotes a hard-constraint-violating assignment) in `packages/cohort-compiler/test/objective.test.ts` (FR-013, SC-002)
- [ ] T013 [P] [US2] Contract test for `assignCohorts` asserting the golden partition of [Fixture B `cohort-12`](./spec.md#fixture-b-cohort-12-us2) (age forces `cohorts[0]=[A1..A6]`, `cohorts[1]=[B1..B6]` with the pinned role vector; `unassigned=[]`; deterministic/byte-identical) and [Fixture B2 `cohort-13-infeasible`](./spec.md#fixture-b2-cohort-13-infeasible-us2) (`C1` returned as `unassigned` with binding constraint, never force-placed); zero hard-constraint violations; no learned model consulted in `packages/cohort-compiler/test/solver.test.ts` (FR-007/FR-010/FR-012/FR-019, SC-002/SC-006)
- [ ] T014 [P] [US2] Contract test for the in-memory `CohortRepository` adapter (`commitAtomic` is whole-roster-or-nothing; `activeFor` enforces one-active-per-learner; `restore` returns the exact prior snapshot; deep-copy isolation) in `adapters/cohort-repo-memory/test/index.test.ts` (FR-011/FR-015) *(write first, ensure it fails)*
- [ ] T015 [P] [US2] Contract test for `commit` + `rollback` asserting [Fixture C `churn-rollback`](./spec.md#fixture-c-churn-rollback-us2) (asg-1 commit ok with `priorAssignmentId:null`; A6→A7 swap `churn===2` allowed at cap 2, refused with `["churn-exceeded"]` at cap 1, allowed at cap 1 with a recorded exception; `rollback("asg-2")` restores asg-1 byte-identical; `["duplicate-active-assignment"]` leaves the repo unchanged) in `packages/cohort-compiler/test/commit.test.ts` (FR-011/FR-015/FR-016, SC-003/SC-004)
- [ ] T016 [P] [US2] Contract test for `repairCohort` (in-budget repair applies and is reversible; a repair exceeding the churn budget or changing group size returns `staffExceptionRequired` and does NOT auto-apply) in `packages/cohort-compiler/test/repair.test.ts` (FR-017, SC-004)
- [ ] T017 [P] [US2] Contract test for `routeHealthEvent` + the in-memory `SafeguardingSink` adapter asserting [Fixture D `safeguarding-shadow`](./spec.md#fixture-d-safeguarding-shadow-us2) (the event lands in `sink.pending()`, bypasses the optimizer, the move touching `A3` (`mv-1`) is paused while `mv-2` is untouched, no rating/objective is altered) in `adapters/cohort-safeguarding-memory/test/index.test.ts` (FR-018, SC-005) *(write first, ensure it fails)*
- [ ] T018 [P] [US2] Contract test for the `BenefitEstimator` shadow adapter asserting [Fixture D `safeguarding-shadow`](./spec.md#fixture-d-safeguarding-shadow-us2) (`logAfterLock("asg-1", ...)` returns `{ lcb: 0.0, shadow: true, ... }` only post-lock; the LCB is never present in solve/repair inputs) in `adapters/cohort-benefit-shadow/test/index.test.ts` (FR-019, SC-006) *(write first, ensure it fails)*

### Implementation

- [ ] T019 [US2] Implement the hard-constraint predicates `isFeasibleCohort(members, hard, prior?)` (age, schedule, safeguarding separation, accommodations, level-velocity caliper, individual non-harm floor [per-member], churn budget) in `packages/cohort-compiler/src/constraints.ts` (depends on T002, T007)
- [ ] T020 [US2] Implement `scoreObjective(members, weights, prior?)` (deterministic soft terms; ranks feasible only) in `packages/cohort-compiler/src/objective.ts` (depends on T002)
- [ ] T021 [US2] Implement `assignCohorts(pool, candidates, hard, weights, churn, prior?)` (greedy construction + bounded local-search/repair; feasibility-gated; `unassigned` reporting; deterministic; no randomness) in `packages/cohort-compiler/src/solver.ts` (depends on T008, T019, T020)
- [ ] T022 [US2] Implement the in-memory `CohortRepository` adapter (atomic whole-roster `commitAtomic`; `activeFor`; `getSnapshot`; `restore`; deep-copy isolation; PostgreSQL deferred, PRD §15) in `adapters/cohort-repo-memory/` (`package.json`, `tsconfig.json`, `src/index.ts`) (depends on T002, T003)
- [ ] T023 [US2] Implement `commit(repo, assignment, churn)` + `rollback(repo, assignmentId)` (atomic commit; one-active-per-learner; retain prior snapshot; churn-budget enforcement with recorded-exception path) in `packages/cohort-compiler/src/commit.ts` (depends on T002, T003, T022)
- [ ] T024 [US2] Implement `repairCohort(assignment, churn, prior)` (in-budget bounded-automation repair with guide-veto/rollback shape; `staffExceptionRequired` when over budget or on a size change) in `packages/cohort-compiler/src/repair.ts` (depends on T019, T020, T023)
- [ ] T025 [US2] Implement `routeHealthEvent(sink, event, activeMoves?)` (bypass optimization → sink; pause conflicting moves POL-007; never alter a rating/objective) in `packages/cohort-compiler/src/safeguarding.ts` (depends on T002, T003)
- [ ] T026 [US2] Implement the in-memory `SafeguardingSink` adapter (human queue stub: `submit`/`pending`) in `adapters/cohort-safeguarding-memory/` (`package.json`, `tsconfig.json`, `src/index.ts`) (depends on T003)
- [ ] T027 [US2] Implement the `BenefitEstimator` shadow adapter (`logAfterLock` returns a placeholder `BenefitLCB` marked `shadow: true`; never consumed by a solve; causal uplift deferred, PRD §15) in `adapters/cohort-benefit-shadow/` (`package.json`, `tsconfig.json`, `src/index.ts`) (depends on T003)
- [ ] T028 [US2] Export `constraints`, `objective`, `solver`, `commit`, `repair`, and `safeguarding` APIs from `packages/cohort-compiler/src/index.ts`

**Checkpoint**: the compiler forms feasible cohorts, commits/rolls back atomically, honors churn + one-active-per-learner, routes safeguarding around the optimizer, and never lets a learned model assign — tested end-to-end.

---

## Phase 5 — P5: User Story 3 — RivalryMix turn-taking analysis (observable only) (Priority: P3)

**Goal**: pure-logic turn-taking analysis detecting dominance + repeated interruption with evidence; no honesty/emotion/personality/motivation inference; low-quality input lowers confidence and suppresses prompts; refused/missing analytics change no status. WebRTC/LiveKit media plane deferred to a stub port.

**Independent Test**: feed synthetic turn arrays → dominance + repeated-interruption flagged with evidence; no trait/behavioral label ever appears; a sparse/low-quality array lowers confidence and suppresses patterns; a refused/missing case changes no status; the `MediaTurnSource` stub is invocable and marked deferred.

### Tests (write first, ensure they fail)

- [ ] T029 [P] [US3] Contract test for `analyzeTurns` asserting every [Fixture E `turns-*`](./spec.md#fixture-e-turns--us3) golden (`turns-dominance` → dominance S1 conf 1.0; `turns-interruption` → repeated_interruption S2; `turns-lowquality` → conf 0.225 suppressed, `patterns:[]`; `turns-sparse`/`turns-empty` → suppressed, `patterns:[]`; `turns-ambiguous` → low-quality overlap not attributable, no invented pattern; every output carries NO honesty/emotion/personality/motivation field) in `packages/cohort-compiler/test/rivalrymix.test.ts` (FR-020/FR-021/FR-022/FR-023/FR-024, SC-007)
- [ ] T030 [P] [US3] Contract test for the `MediaTurnSource` stub adapter (`turns` yields synthetic `TurnEvent[]`; marked non-production, §15.1 deferred) in `adapters/cohort-media-stub/test/index.test.ts` (FR-025) *(write first, ensure it fails)*

### Implementation

- [ ] T031 [US3] Implement `analyzeTurns(turns, thresholds)` (per-speaker descriptors; dominance + repeated-interruption detection with evidence; confidence lowered by missing/low-quality input; `suppressed` below the confidence floor; observable-only — never a trait label) in `packages/cohort-compiler/src/rivalrymix.ts` (depends on T002)
- [ ] T032 [US3] Implement the `MediaTurnSource` stub adapter (synthetic `TurnEvent[]`; WebRTC/AudioWorklet/LiveKit deferred, §15.1) in `adapters/cohort-media-stub/` (`package.json`, `tsconfig.json`, `src/index.ts`) (depends on T003)
- [ ] T033 [US3] Export `rivalrymix` API from `packages/cohort-compiler/src/index.ts`

**Checkpoint**: RivalryMix analysis runs headless, observable-only and confidence-gated, with the media plane deferred to a marked stub.

---

## Phase 6 — P6: Polish & Cross-Cutting

- [ ] T034 [P] Add `packages/cohort-compiler/README.md` (public API + ports usage + explicit "deferred / not production" section for HNSW, CP-SAT, WebRTC+LiveKit media plane, peer-effect causal uplift, PostgreSQL)
- [ ] T035 [P] Add an end-to-end `demo` script in `adapters/cohort-repo-memory/src/demo.ts` wiring a synthetic pool → candidate generation → solve → atomic commit + rollback → in-budget repair → safeguarding bypass → post-lock shadow benefit log → RivalryMix analysis (mirrors `quickstart.md`)
- [ ] T036 Run the `quickstart.md` validation end-to-end with the pinned gate commands ([spec.md § Stack & Commands](./spec.md#stack--commands-pinned)): `pnpm typecheck` (`tsc -b`) clean, `pnpm lint` (`biome check`) clean, `pnpm --filter @gt100k/cohort-compiler test` and `pnpm test` (workspace Vitest) green
- [ ] T037 **[FINAL — the single shared-file touch]** Add composite project references for `packages/cohort-compiler` and each `adapters/cohort-*` package to the root `tsconfig.json` `references` array. ⚠️ This is the **only** shared-file edit in the feature; keep it isolated in its own commit so a human reconciles it at merge (parallel-safety flag).

---

## Dependencies & Execution Order

- **P0: Setup (T001) → Foundational (T002–T003, T038 fixtures, T039 smoke test — blocks all stories)** → **P1: US1 (T004–T010)** → **P2/P3/P4: US2 (T011–T028)** → **P5: US3 (T029–T033)** → **P6: Polish (T034–T037)**.
- T038 (seed fixtures) depends on T002 (types); T039 (smoke test) depends on T001 + T038 and must be green before any story work begins.
- US2 consumes US1's `generateCandidates` output but is independently testable by feeding synthetic candidate sets directly.
- US3 depends on none of the solver machinery (independent).
- Within US2: `constraints`/`objective` (T019/T020) before `solver` (T021); `repo-memory` (T022) before `commit`/`rollback` (T023); `commit` before `repair` (T024).
- T037 (root `tsconfig.json`) runs **last**; it is the sole shared-file change.

## Parallel Opportunities

- Foundational: T002/T003 in parallel; T038 (fixtures) in parallel once T002 lands, then T039 (smoke).
- US1: T004/T005/T006 (tests) in parallel before the implementation tasks.
- US2: T011–T018 (tests) in parallel before the implementation tasks; adapter impls T022/T026/T027 are in different dirs and parallelizable once ports exist.
- US3: T029/T030 (tests) in parallel before implementation.
- Polish: T034, T035 in parallel.

## Implementation Strategy

- **MVP = Setup + Foundational + US1** (near-peer candidate generation, tested) → validate → then US2 (the cohort compiler: feasibility + atomic commit/rollback + churn + repair + safeguarding bypass + no-learned-model) → then US3 (RivalryMix observable-only analysis). Deferred production targets (HNSW, CP-SAT, WebRTC+LiveKit, causal uplift, PostgreSQL) ship as **marked ports/stubs only**.
- Commit per task or logical group; test-gated; one PR per increment (governed flow). Synthetic-only; no consent/media/legal machinery; **no `Math.random`/wall-clock/I/O in the domain**. Do not edit shared root files except the final flagged task.

## Summary

- **Total tasks**: 39 (T001–T039)
- **US1**: 7 (T004–T010) · **US2**: 18 (T011–T028) · **US3**: 5 (T029–T033) · Setup 1 (T001) · Foundational 4 (T002–T003, T038 fixtures, T039 smoke) · Polish 4 (T034–T037)
- **Phasing**: P0 (T001–T003, T038–T039) · P1/MVP (T004–T010) · P2/P3/P4 (T011–T028) · P5 (T029–T033) · P6 (T034–T037).
- **MVP scope**: P0 (Setup + Foundational + seed fixtures + smoke test) + P1 (near-peer candidate generation).
- **Shared-file touches**: exactly one — T037 (root `tsconfig.json` references), flagged for human merge reconciliation (DP-6, `severity: critical`).
