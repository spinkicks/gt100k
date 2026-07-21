# Tasks: Cohort Compiler + RivalryMix

**Input**: Design documents from `specs/006-cohort-compiler/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cohort-compiler.md, contracts/cohort-arena-view.md, quickstart.md
**Tests**: INCLUDED — the constitution makes tests part of "done" and `contracts/*.md` define explicit test obligations. Write tests first; ensure they fail before implementing.

**Phase ↔ P-number mapping** (from [spec.md § Phasing P0–P11](./spec.md#phasing-p0p11)). **Domain:** **P0** = Phase 1
Setup + Phase 2 Foundational; **P1** = Phase 3 (US1, MVP); **P2** = US2 solver/feasibility (T011–T013,
T019–T021, T040); **P3** = US2 commit/rollback/churn (T014–T015, T022–T023); **P4** = US2 repair/safeguarding/
shadow (T016–T018, T024–T027); **P5** = Phase 5 (US3); **P6** = Phase 6 Polish (domain). **UI:** **P7** =
Phase 7 view-model domain (T101–T113); **P8** = Phase 8 app shell + Cohort Constellation, UI MVP (T114–T121);
**P9** = Phase 9 standings + churn/rollback (T122–T126); **P10** = Phase 10 RivalryMix arena room
(T127–T130); **P11** = Phase 11 safeguarding + a11y + perf + the single `tsconfig.json` touch (T131–T136).
Golden fixtures the tests assert against live in [spec.md § Golden Values](./spec.md#golden-values--seed-fixtures)
(domain) and [spec.md § UI Golden Values](./spec.md#ui-golden-values--constants) (UI, Fixtures V1–V4).

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

- [ ] T002 [P] Define all domain types in `packages/cohort-compiler/src/model.ts` (`AgeBand`, `LevelBand`/`VelocityBand` fields, `ScheduleAvailability`, `Accommodations`, `PairFlag`, `Role`, `WorkingRhythm`, `LearnerProfile` [incl. the caliper-independent benefit inputs `pairHistory`, `preferredRole`, `workingRhythm`], `Caliper`, `CandidateSet`, `HardConstraints` [incl. `nonHarmFloor` + injected `benefitOf`], `ObjectiveWeights`, `ObjectiveTerms`, `Cohort`, `CohortAssignment`, `ChurnBudget`, `CommitResult`, `CohortHealthEvent`, `TurnEvent`, `TurnAnalysis`, `BenefitLCB`) per `data-model.md`. `TurnAnalysis` MUST have no field for honesty/emotion/personality/motivation (FR-022).
- [ ] T003 [P] Define ports in `packages/cohort-compiler/src/ports.ts` (`CandidateIndex`, `CohortRepository`, `SafeguardingSink`, plus **deferred/shadow stub ports** `MediaTurnSource` [§15.1 media plane deferred] and `BenefitEstimator` [shadow, post-lock only]) per `contracts/cohort-compiler.md`.
- [ ] T038 [P] Commit the in-repo **seed fixtures** with their golden expected values in `packages/cohort-compiler/test/fixtures/` — `caliper-8.ts` (Fixture A), `cohort-12.ts` (Fixtures B/B2/B3/**B4 `nonharm-default-bind`**, incl. the `D1..D6` benefit attributes: `accommodations.needs/conflicts`, `pairHistory`, `preferredRole`, `workingRhythm`), `churn-rollback.ts` (Fixture C), `safeguarding-shadow.ts` (Fixture D), `turns.ts` (Fixture E), exactly as tabulated in [spec.md § Golden Values](./spec.md#golden-values--seed-fixtures). Typed against `model.ts` (depends on T002).
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

- [ ] T011 [P] [US2] Contract test for `isFeasibleCohort` + the default `benefitOf` (each of the 7 hard constraints rejected independently). Assert the **default-formula** binding golden [Fixture B4 `nonharm-default-bind`](./spec.md#fixture-b4-nonharm-default-bind-us2): exact per-member benefits `D1..D4 = 0.775`, `D5 = 0.700`, `D6 = 0.430` (±1e-9), mean `0.705 ≥ floor 0.5` but `D6 = 0.43 < 0.5` → rejected (`{ constraint: "individual_non_harm_floor", member: "D6", value: 0.43, floor: 0.5 }`), proving per-member/never-averaged over a **caliper-independent** signal; boundary control (D6 → `0.63`) → feasible. Also assert the injected-map golden [Fixture B3 `nonharm-reject`](./spec.md#fixture-b3-nonharm-reject-us2): mean `0.708 ≥ 0.5` but `M5` at `0.45` → rejected; boundary `0.50` → feasible (proves `benefitOf` is injectable). In `packages/cohort-compiler/test/constraints.test.ts` (FR-007/FR-008/FR-009, SC-002)
- [ ] T012 [P] [US2] Contract test for `scoreObjective` (deterministic soft score ranks feasible options; a higher score never promotes a hard-constraint-violating assignment) in `packages/cohort-compiler/test/objective.test.ts` (FR-013, SC-002)
- [ ] T013 [P] [US2] Contract test for `assignCohorts` asserting the golden partition of [Fixture B `cohort-12`](./spec.md#fixture-b-cohort-12-us2) (age forces `cohorts[0]=[A1..A6]`, `cohorts[1]=[B1..B6]` with the pinned role vector; `unassigned=[]`; deterministic/byte-identical) and [Fixture B2 `cohort-13-infeasible`](./spec.md#fixture-b2-cohort-13-infeasible-us2) (`C1` returned as `unassigned` with binding constraint, never force-placed); zero hard-constraint violations; no learned model consulted in `packages/cohort-compiler/test/solver.test.ts` (FR-007/FR-010/FR-012/FR-019, SC-002/SC-006)
- [ ] T014 [P] [US2] Contract test for the in-memory `CohortRepository` adapter (`commitAtomic` is whole-roster-or-nothing; `activeFor` enforces one-active-per-learner; `restore` returns the exact prior snapshot; deep-copy isolation) in `adapters/cohort-repo-memory/test/index.test.ts` (FR-011/FR-015) *(write first, ensure it fails)*
- [ ] T015 [P] [US2] Contract test for `commit` + `rollback` asserting [Fixture C `churn-rollback`](./spec.md#fixture-c-churn-rollback-us2) (asg-1 commit ok with `priorAssignmentId:null`; A6→A7 swap `churn===2` allowed at cap 2, refused with `["churn-exceeded"]` at cap 1, allowed at cap 1 with a recorded exception; `rollback("asg-2")` restores asg-1 byte-identical; `["duplicate-active-assignment"]` leaves the repo unchanged) in `packages/cohort-compiler/test/commit.test.ts` (FR-011/FR-015/FR-016, SC-003/SC-004)
- [ ] T016 [P] [US2] Contract test for `repairCohort` (in-budget repair applies and is reversible; a repair exceeding the churn budget or changing group size returns `staffExceptionRequired` and does NOT auto-apply) in `packages/cohort-compiler/test/repair.test.ts` (FR-017, SC-004)
- [ ] T017 [P] [US2] Contract test for `routeHealthEvent` + the in-memory `SafeguardingSink` adapter asserting [Fixture D `safeguarding-shadow`](./spec.md#fixture-d-safeguarding-shadow-us2) (the event lands in `sink.pending()`, bypasses the optimizer, the move touching `A3` (`mv-1`) is paused while `mv-2` is untouched, no rating/objective is altered) in `adapters/cohort-safeguarding-memory/test/index.test.ts` (FR-018, SC-005) *(write first, ensure it fails)*
- [ ] T018 [P] [US2] Contract test for the `BenefitEstimator` shadow adapter asserting [Fixture D `safeguarding-shadow`](./spec.md#fixture-d-safeguarding-shadow-us2) (`logAfterLock("asg-1", ...)` returns `{ lcb: 0.0, shadow: true, ... }` only post-lock; the LCB is never present in solve/repair inputs) in `adapters/cohort-benefit-shadow/test/index.test.ts` (FR-019, SC-006) *(write first, ensure it fails)*

### Implementation

- [ ] T040 [US2] Implement the default `benefitOf(m, C)` in `packages/cohort-compiler/src/benefit.ts` — the real, **caliper-independent** composite `0.40·acc + 0.35·hist + 0.25·pace` (accommodation compatibility; prior-pairing history `clamp01(0.5 + 0.5·pos/P − neg/P)`; pace/role fit `0.5·roleFit + 0.5·rhythmFit`), returning a value in `[0,1]`; pure and deterministic (no randomness, no caliper terms). Exact formula + weights in [spec.md § Pinned formulas](./spec.md#pinned-formulas-used-by-the-golden-fixtures) (depends on T002)
- [ ] T019 [US2] Implement the hard-constraint predicates `isFeasibleCohort(members, hard, prior?)` (age, schedule, safeguarding separation, accommodations [reject only a **mutual** block], level-velocity caliper, individual non-harm floor [reject if **any** member's injected `hard.benefitOf(m,C) < hard.nonHarmFloor`; **never averaged**; boundary inclusive; default `benefitOf` from T040], churn budget) in `packages/cohort-compiler/src/constraints.ts` (depends on T002, T007, T040)
- [ ] T020 [US2] Implement `scoreObjective(members, weights, prior?)` (deterministic soft terms; ranks feasible only) in `packages/cohort-compiler/src/objective.ts` (depends on T002)
- [ ] T021 [US2] Implement `assignCohorts(pool, candidates, hard, weights, churn, prior?)` (greedy construction + bounded local-search/repair; feasibility-gated; `unassigned` reporting; deterministic; no randomness) in `packages/cohort-compiler/src/solver.ts` (depends on T008, T019, T020)
- [ ] T022 [US2] Implement the in-memory `CohortRepository` adapter (atomic whole-roster `commitAtomic`; `activeFor`; `getSnapshot`; `restore`; deep-copy isolation; PostgreSQL deferred, PRD §15) in `adapters/cohort-repo-memory/` (`package.json`, `tsconfig.json`, `src/index.ts`) (depends on T002, T003)
- [ ] T023 [US2] Implement `commit(repo, assignment, churn)` + `rollback(repo, assignmentId)` (atomic commit; one-active-per-learner; retain prior snapshot; churn-budget enforcement with recorded-exception path) in `packages/cohort-compiler/src/commit.ts` (depends on T002, T003, T022)
- [ ] T024 [US2] Implement `repairCohort(assignment, churn, prior)` (in-budget bounded-automation repair with guide-veto/rollback shape; `staffExceptionRequired` when over budget or on a size change) in `packages/cohort-compiler/src/repair.ts` (depends on T019, T020, T023)
- [ ] T025 [US2] Implement `routeHealthEvent(sink, event, activeMoves?)` (bypass optimization → sink; pause conflicting moves POL-007; never alter a rating/objective) in `packages/cohort-compiler/src/safeguarding.ts` (depends on T002, T003)
- [ ] T026 [US2] Implement the in-memory `SafeguardingSink` adapter (human queue stub: `submit`/`pending`) in `adapters/cohort-safeguarding-memory/` (`package.json`, `tsconfig.json`, `src/index.ts`) (depends on T003)
- [ ] T027 [US2] Implement the `BenefitEstimator` shadow adapter (`logAfterLock` returns a placeholder `BenefitLCB` marked `shadow: true`; never consumed by a solve; causal uplift deferred, PRD §15) in `adapters/cohort-benefit-shadow/` (`package.json`, `tsconfig.json`, `src/index.ts`) (depends on T003)
- [ ] T028 [US2] Export `benefit`, `constraints`, `objective`, `solver`, `commit`, `repair`, and `safeguarding` APIs from `packages/cohort-compiler/src/index.ts`

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
- [ ] T037 **[SUPERSEDED → performed once as T136 in P11]** The single shared-file touch (root `tsconfig.json` `references` for `packages/cohort-compiler`, each `adapters/cohort-*`, **and** `packages/cohort-arena-view`) is deferred to the **final** UI task **T136** so it happens exactly once after both the domain and the UI land (DP-UI-7 supersedes DP-6's scope). *Fallback:* if building the domain in isolation without the UI, add only the domain references here instead; otherwise leave this to T136.

---

## Phase 7 — P7: UI view-model domain (pure) — the Cohort & Arena Viewer foundation 🎯 UI foundation

**Goal**: a pure, deterministic `packages/cohort-arena-view` that reads the committed `@gt100k/cohort-compiler` API read-only and composes a single `CohortArenaView`, with the pinned golden constants (`PALETTE`/`TYPOGRAPHY`/`MOTION`/`EASINGS`/`LAYOUT`) and every presentation function. New dir only; unit-tested by the existing Vitest globs. No `Math.random`, no I/O, no wall-clock.

**Independent Test**: feed synthetic `CohortAssignment`/`TurnAnalysis`/standings → the view is byte-identical across runs; `plainViewEquals` holds across reduced-motion/plain/band; layout/motion/standings/rivalry match Fixtures V1–V4; guardrail scan finds no rank/emotion field and no `Math.random`.

- [ ] T101 Scaffold `@gt100k/cohort-arena-view`: `packages/cohort-arena-view/package.json` (name `@gt100k/cohort-arena-view`, `type: module`, `main`/`types` → `./src/index.ts`, `test: vitest run`, dep `@gt100k/cohort-compiler` `workspace:*`), `tsconfig.json` (extends `../../tsconfig.base.json`, `rootDir: .`, `outDir: dist`, include `src`/`test`), empty `src/index.ts`. Do not touch any shared root file.

### Tests (write first, ensure they fail)

- [ ] T102 [P] [UI-US1] Golden test for `PALETTE`/`TYPOGRAPHY`/`LAYOUT` (exact tokens; state-color-paired-with-icon assertion; contrast pairs ≥4.5:1) in `packages/cohort-arena-view/test/art.test.ts` (FR-045, SC-018)
- [ ] T103 [P] [UI-US1] Golden test for `MOTION`/`EASINGS`/`resolveMotion` asserting [Fixture V4 `motion-golden`](./spec.md#fixture-v4-motion-golden-ui-us1) (every kind has an animated + reduced form; exact durations/easings; reduced → `mode:"reduced"`, `easing:"linear"`) in `packages/cohort-arena-view/test/motion.test.ts` (FR-039, SC-011)
- [ ] T104 [P] [UI-US1] Golden test for `layoutConstellation`/`layoutField`/`layoutArenaRing`/`project2D` asserting the exact **3D `{x,y,z}`** positions **and** their **`project2D` `{x,y}`** of [Fixture V1](./spec.md#fixture-v1-view-cohort-12-ui-us1) (cohort centers `{-11,0,0}`/`{11,0,0}` + six vertices e.g. `A1 {-11,0,6}`→`(536,306)`, floor halos, empty bench, `fieldPos` examples) and [Fixture V3](./spec.md#fixture-v3-view-rivalry-ui-us3) (3-seat ring e.g. `S1 {0,0,10}`→`(800,210)`) in `packages/cohort-arena-view/test/layout.test.ts` (FR-031, SC-010)
- [ ] T105 [P] [UI-US2] Golden test for `deriveStandingsView` asserting [Fixture V2 `view-standings`](./spec.md#fixture-v2-view-standings-ui-us2) (`optedIn:false`→`null`; `optedIn:true`→`gainToBandTop = 40`; **no** rank/position/percentile/outOf field) in `packages/cohort-arena-view/test/standings.test.ts` (FR-035, SC-012)
- [ ] T106 [P] [UI-US3] Golden test for `buildArenaRoomView` asserting [Fixture V3 `view-rivalry`](./spec.md#fixture-v3-view-rivalry-ui-us3) (`turns-dominance`→3 seats + dominance S1 + conf 1.0 + suppressed false; `turns-lowquality`→suppressed veil + `patterns:[]`; **no** honesty/emotion/personality/motivation field in 100% of outputs) in `packages/cohort-arena-view/test/rivalry.test.ts` (FR-037, SC-013)
- [ ] T107 [P] [UI-US1] Golden test for `buildCohortArenaView` + `plainViewEquals` asserting [Fixture V1 `view-cohort-12`](./spec.md#fixture-v1-view-cohort-12-ui-us1) (2 hexes with six members + role vector; all seven badges `satisfied:true`; non-harm floor `minBenefit 0.825 ≥ 0.5`; churn delta 0; standings `null`; byte-identical across runs; `plainViewEquals` across reduced-motion/plain/band) + the rollback diff (`A6→A7` → churn delta 2, Ledger diff removed:[A6]/added:[A7], domain unchanged) in `packages/cohort-arena-view/test/view.test.ts` (FR-028/FR-029/FR-032/FR-034/FR-044, SC-009/SC-014/SC-016)
- [ ] T108 [P] Guardrail scan test in `packages/cohort-arena-view/test/guardrails.test.ts`: no `Math.random` in the package source; the view types expose **no** `price`/`currency`/`rank`/`position`/`percentile`/`outOf` field and **no** honesty/emotion/personality/motivation field; no loss/decay/gacha/purchase/engagement-timer construct (FR-043, SC-017)

### Implementation

- [ ] T109 [UI] Implement `PALETTE`+`TYPOGRAPHY` in `src/art.ts` and `MOTION`+`EASINGS`+`resolveMotion` in `src/motion.ts` (exact registries; reduced-motion table) (depends on T101)
- [ ] T110 [UI] Implement `LAYOUT` (3D: `CAMERA`, `FOG`, `HEX_R`, `center(i)`, `vertexLocal(k)`, bench, `FIELD_STEP`/`FIELD_REF`, `CALIPER_RADII`, `RING_R`, `PROJECT`) + `layoutConstellation` + `layoutField` + `layoutArenaRing` + `project2D` in `src/layout.ts` (deterministic 3D geometry rounded to 3 dp; `project2D` integer-rounded) (depends on T101)
- [ ] T111 [UI] Implement `deriveStandingsView` (`src/standings.ts`), `buildArenaRoomView` (`src/rivalry.ts`), `resolveVisualBand` (`src/band.ts`), and `buildLedger` (`src/ledger.ts`) — pure; structural guardrails (no rank field, no emotion field) (depends on T101, T110)
- [ ] T112 [UI] Implement `buildCohortArenaView` + `plainViewEquals` in `src/view.ts` (compose constellation/cohorts/standings/rivalry/safeguarding/motion/presentation/ledger; read domain values read-only; flags affect only motion+presentation) and export the public surface from `src/index.ts` (depends on T109, T110, T111)
- [ ] T113 Commit the view golden fixtures `packages/cohort-arena-view/test/fixtures/` (V1 `view-cohort-12`, V2 `view-standings`, V3 `view-rivalry`, V4 `motion-golden`) typed against the domain + view types, and add the seeded smoke `test/smoke.test.ts` (imports the entrypoint; asserts Fixture V1 builds) so `pnpm test` is green from the first UI increment (depends on T101, T112)

**Checkpoint**: the pure view model + golden constants exist and are unit-tested — every UI guardrail is structurally provable before any pixel renders.

---

## Phase 8 — P8: App shell + Cohort Constellation (UI MVP)

**Goal**: `apps/cohort-arena` renders the 3D Compiler Observatory (react-three-fiber + drei + three.js, WebGL2) — the compile choreography + hexagonal formations + lit badge rings + non-harm-floor halos — plus the DOM + motion@^12 HUD (cohort cards with FLIP, satisfied badges, non-harm floor readout), the **2D tier** (`project2D`), the reduced-motion path, and the accessible Cohort Ledger, all from one `CohortArenaView`. Verified by `next build` + seeded smoke.

**Independent Test**: `next build` succeeds with empty env; the react-three-fiber `<Canvas>` mounts client-only with zero console/WebGL errors and disposes on unmount; the scene shows six-member hexagonal formations with satisfied badge rings + floor halos; reduced-motion / WebGL-loss toggles to the 2D-tier (`project2D`) static equivalent with no state lost; the Cohort Ledger tree is focusable and conveys the same state.

- [ ] T114 Scaffold `apps/cohort-arena` (Next.js App Router): `package.json` (`@gt100k/cohort-arena`; deps `next@^14.2.15`, `react@^18.3.1`, `react-dom@^18.3.1`, `three@^0.169.0`, `@react-three/fiber@^8.17.10`, `@react-three/drei@^9.114.0`, `@react-three/postprocessing@^2.16.3`, `motion@^12.42.0`, `@gt100k/cohort-arena-view` `workspace:*`; devDeps `@types/three`, `@types/react@^18`/`@types/react-dom@^18`; scripts `dev`/`build`/`start`), `next.config.mjs` (`transpilePackages: ["@gt100k/cohort-arena-view","@gt100k/cohort-compiler"]`), `tsconfig.json` (mirror `apps/student-compass`), `app/layout.tsx`, `app/globals.css` (PALETTE/TYPOGRAPHY tokens + `prefers-reduced-motion`/`prefers-reduced-transparency` + `:focus-visible` rings + plain-mode hooks), `.env.local.example`, `.gitignore`. New dir only.
- [ ] T115 [UI-US2] `app/page.tsx` server shell → `next/dynamic(() => import("../components/CohortArena.client"), { ssr: false })`; `components/CohortArena.client.tsx` builds the `CohortArenaView` from a synthetic in-app `CohortAssignment` (Fixture B shape) + pool, mounts the react-three-fiber `<Canvas>`, and lays out the 3D scene + HUD + 2D-tier + Ledger regions.
- [ ] T116 [UI-US2] 3D Compiler Observatory in `components/observatory/` (react-three-fiber + drei): render learner-stars (drei `<Instances>`) at the `view.constellation` 3D positions; drift them from `mote.field` and animate the **compile choreography** (flow along field-lines → crystallize into hex formations) via `useFrame` lerps keyed to `resolveMotion("compile", …)`; draw the caliper rings, the satisfied-badge ring, and the non-harm-floor halo (with restrained `@react-three/postprocessing` bloom); a calm follow-free camera (`cameraEase`); dispose all GL resources on unmount; reduced-motion / WebGL-loss defers to the 2D tier (FR-031/FR-032/FR-039/FR-041).
- [ ] T117 [UI-US2] DOM cohort roster cards (**motion@^12**, `motion/react`) in `components/hud/`: one card per cohort (members+roles, the seven satisfied badges with icon+text, the floor readout), **FLIP layout animation** (`layout` prop) on membership change; press feedback (scale 0.97); ≥44px targets (FR-032/FR-033).
- [ ] T118 [UI-US2] Accessible Cohort Ledger in `components/ledger/` from `view.ledger` (cohorts as `role="tree"` with stateful accessible names, `aria-live` region); 3D canvas `aria-hidden="true"`; visible focus; color-independent state; ≥4.5:1 contrast (FR-040, SC-014).
- [ ] T119 [UI-US2] 2D tier + reduced-motion + plain-mode wiring in `components/tier2d/`: `useReducedMotion` (and the `NEXT_PUBLIC_REDUCED_MOTION_DEFAULT` override) render the **`project2D` DOM/SVG** tier (no 3D, no motion) from the same view; plain mode renders the low-spectacle path; all are state-identical (`plainViewEquals`) (FR-039/FR-044, SC-015).
- [ ] T120 [UI-US2] Commit seed inline SVGs under `apps/cohort-arena/public/seed/` (star, hex, badge, floor-halo, seat, shield, icons) + a deterministic procedural fallback (three.js primitive geometries / drei) so the scene renders with **no external fetch** (FR-042).
- [ ] T121 [UI-US2] Add the seeded app smoke (Playwright or an HTML/JS check) asserting `/` mounts the r3f `<canvas>`, **zero** console/WebGL errors, clean dispose, reduced-motion / 2D-tier toggle works, and the Ledger is present + focusable (FR-041, SC-014/SC-015).

**Checkpoint**: the 3D Compiler Observatory renders and compiles beautifully, with a first-class 2D/reduced-motion tier and an accessible Ledger — **UI MVP demonstrable** via `pnpm --filter @gt100k/cohort-arena build` + smoke.

---

## Phase 9 — P9: Gain-based standings + churn/rollback

**Goal**: the opt-in near-peer standings panel (own-growth bar + ticker; no rank/bottom-rank), the churn-budget meter, and the rollback control with its reverse-settle animation + Ledger diff.

- [ ] T122 [UI-US2] Standings panel in `components/hud/` from `view.standings` (opt-in, default off): amber **bar grow** L→R + **number ticker** (tabular) via `resolveMotion("standingsBar"/"gainCelebrate", …)`; anonymized peers; `gainToBandTop`; **no** rank/bottom-rank possible; reduced-motion → instant filled bar + final number (FR-035/FR-036, SC-012).
- [ ] T123 [UI-US2] Standings opt-in toggle (default off) — turning it off leaves everything unchanged; wire to `standingsOptIn` flag (FR-036).
- [ ] T124 [UI-US2] Churn-budget meter in `components/hud/` from the domain `ChurnBudget` + `view.cohorts[].churnDelta`.
- [ ] T125 [UI-US2] Rollback control + 3D **reverse-choreography** (`useFrame` lerp keyed to `resolveMotion("rollback", …)`) returning the learner-stars to the prior snapshot positions; Ledger shows the diff; **display-only** (never mutates the domain result) (FR-034, SC-016).
- [ ] T126 [UI-US2] Reduced-motion equivalents for standings/churn/rollback (instant bar, instant restore, Ledger diff) (FR-039, SC-015).

**Checkpoint**: standings celebrate own-growth without any caste/bottom-rank, and churn/rollback are visible and reversible in the view.

---

## Phase 10 — P10: RivalryMix arena room

**Goal**: the 3D seat-ring arena room from `TurnAnalysis` — turn-holding pulse, 3D interruption arcs, dominance-share ring, and the low-quality suppression veil — observable-only, no trait/emotion field.

- [ ] T127 [UI-US3] 3D arena room in `components/arena/` (react-three-fiber + drei) from `view.rivalry`: seats at the `layoutArenaRing` 3D positions; turn-holder **seat pulse** (emissive + soft vertical light column, `resolveMotion("turnPulse", …)`); reduced-motion / 2D tier → static highlight at `project2D` positions + Ledger text (FR-037).
- [ ] T128 [UI-US3] 3D interruption **arc darts** (raised bezier interrupter→floor-holder via drei `<Line>`/`QuadraticBezierCurve3`, `resolveMotion("interruptionArc", …)`) + dominance **share-ring grow** (torus arc, `resolveMotion("dominanceRing", …)`) with the observable evidence text; reduced-motion → tallies/text in the Ledger (FR-037, SC-013).
- [ ] T129 [UI-US3] Low-quality **suppression veil** (`suppressed:true` → volumetric fog dim + "confidence low — prompts suppressed"), and a neutral "analytics off" state for refused/missing — **never** a false label; the arena view carries no emotion/trait field (FR-037, SC-013).
- [ ] T130 [UI-US3] Rivalry entries in the Cohort Ledger (`view.ledger.rivalryList`) — observable descriptors + patterns + veil text; canvas `aria-hidden` (FR-040, SC-014).

**Checkpoint**: the arena room shows *only* observable turn-taking, suppresses under noise, and is incapable of rendering a trait/emotion label.

---

## Phase 11 — P11: Safeguarding affordance, a11y, perf & the single shared-file touch

**Goal**: the safeguarding-bypass affordance; a WCAG 2.2 AA pass over the Ledger; reduced-motion parity; 60fps + graceful degradation; app README; and the single root-`tsconfig.json` touch.

- [ ] T131 [UI-US4] Safeguarding affordance in `components/hud/` from `view.safeguarding`: a **firm-but-not-alarm** banner (shield glyph + `--safeguard`, never alarm-red flash) that shows optimization **bypassed**, freezes conflicting cohort moves in the 3D scene, and routes to a safeguarding **lane**; **never** mutates a standing/rating/objective (FR-038, SC-016).
- [ ] T132 [UI] WCAG 2.2 AA pass over the Cohort Ledger: full keyboard/switch operation (Tab/Arrow/Enter/Escape), visible `--focus` rings, color-independent state (icon+shape+text), captions where sound exists, ≥4.5:1 contrast; 3D canvas `aria-hidden` (FR-040/FR-045, SC-014/SC-018).
- [ ] T133 [UI] Performance + graceful degradation: target 60fps with a **degraded 3D tier** (halved instanced stars, bloom/postprocessing off, shadows off), then the **2D tier** (`project2D` DOM/SVG); WebGL2 context-loss / unavailability / sustained frame-budget miss falls back to the 2D tier + Ledger (never depends on WebGL); no action blocked (FR-041).
- [ ] T134 [P] [UI] `apps/cohort-arena/README.md` (run/build, the one-view-drives-all architecture, reduced-motion + Ledger, the guardrails, and a "no live media / no network / synthetic-only" note) + `packages/cohort-arena-view/README.md` (public API + golden constants).
- [ ] T135 [UI] Run the [quickstart](./quickstart.md) UI validation end-to-end: `pnpm typecheck` clean, `pnpm lint` clean, `pnpm --filter @gt100k/cohort-arena-view test` green, `pnpm --filter @gt100k/cohort-arena build` succeeds, the seeded app smoke passes (zero console/WebGL errors), and the reduced-motion + a11y + color-independence walkthrough passes.
- [ ] T136 **[FINAL — the single shared-file touch]** Add composite project references for `packages/cohort-compiler`, each `adapters/cohort-*` package, **and** `packages/cohort-arena-view` to the root `tsconfig.json` `references` array. ⚠️ This is the **only** shared-file edit in the whole feature; keep it isolated in its own commit so a human reconciles it at merge (parallel-safety flag; DP-UI-7). *(`apps/cohort-arena` is a Next.js app with its own non-composite `tsconfig` and is **not** added as a `tsc -b` reference — it is verified by `next build`.)*

**Checkpoint**: the full Cohort & Arena Viewer is beautiful, animated, accessible, reduced-motion-equal, guardrail-clean, and build-verified; the single shared-file touch is applied last.

---

## Dependencies & Execution Order

- **Domain:** **P0: Setup (T001) → Foundational (T002–T003, T038 fixtures, T039 smoke test — blocks all stories)** → **P1: US1 (T004–T010)** → **P2/P3/P4: US2 (T011–T028, T040)** → **P5: US3 (T029–T033)** → **P6: Polish (T034–T036; T037 superseded by T136)**.
- **UI:** **P7: view-model domain (T101 → tests T102–T108 → impl T109–T113)** → **P8: app shell + 3D Compiler Observatory MVP (T114–T121)** → **P9: standings + churn/rollback (T122–T126)** → **P10: RivalryMix arena room (T127–T130)** → **P11: safeguarding + a11y + perf + final tsconfig (T131–T136)**.
- T038 (seed fixtures) depends on T002 (types); T039 (smoke test) depends on T001 + T038 and must be green before any story work begins.
- US2 consumes US1's `generateCandidates` output but is independently testable by feeding synthetic candidate sets directly.
- US3 depends on none of the solver machinery (independent).
- Within US2: `benefit` (T040) before `constraints` (T019); `constraints`/`objective` (T019/T020) before `solver` (T021); `repo-memory` (T022) before `commit`/`rollback` (T023); `commit` before `repair` (T024).
- **UI depends on the committed domain public API (P0–P5 types/functions), read-only.** Within P7: T101 (scaffold) → tests T102–T108 → impl T109–T112 → fixtures+smoke T113. The app (P8+) depends on the view package (P7). Each UI phase feeds **synthetic** `CohortAssignment`/`TurnAnalysis` values directly, so a UI phase never requires a live solve. **UI MVP = P7 + P8.**
- T136 (root `tsconfig.json`) runs **last** across the whole feature; it is the sole shared-file change (T037 is folded into it).

## Parallel Opportunities

- Foundational: T002/T003 in parallel; T038 (fixtures) in parallel once T002 lands, then T039 (smoke).
- US1: T004/T005/T006 (tests) in parallel before the implementation tasks.
- US2: T011–T018 (tests) in parallel before the implementation tasks; adapter impls T022/T026/T027 are in different dirs and parallelizable once ports exist.
- US3: T029/T030 (tests) in parallel before implementation.
- Polish: T034, T035 in parallel.
- **UI P7**: T102–T108 (golden + guardrail tests) in parallel before the impl tasks T109–T112.
- **UI P8+**: the 3D observatory (T116), roster cards (T117), 2D tier (T119), and Ledger (T118) live in different `components/` dirs and are parallelizable once the shell (T114/T115) exists; README tasks T134 are parallel.

## Implementation Strategy

- **MVP = Setup + Foundational + US1** (near-peer candidate generation, tested) → validate → then US2 (the cohort compiler: feasibility + atomic commit/rollback + churn + repair + safeguarding bypass + no-learned-model) → then US3 (RivalryMix observable-only analysis). Deferred production targets (HNSW, CP-SAT, WebRTC+LiveKit, causal uplift, PostgreSQL) ship as **marked ports/stubs only**.
- Commit per task or logical group; test-gated; one PR per increment (governed flow). Synthetic-only; no consent/media/legal machinery; **no `Math.random`/wall-clock/I/O in the domain**. Do not edit shared root files except the final flagged task.

## Summary

- **Total tasks**: 76 — domain 40 (T001–T040) + UI 36 (T101–T136).
- **Domain** — **US1**: 7 (T004–T010) · **US2**: 19 (T011–T028, T040) · **US3**: 5 (T029–T033) · Setup 1 (T001) · Foundational 4 (T002–T003, T038, T039) · Polish 3 (T034–T036; T037 superseded).
- **UI** — **P7 view domain**: 13 (T101–T113) · **P8 app + 3D Observatory (UI MVP)**: 8 (T114–T121) · **P9 standings/churn/rollback**: 5 (T122–T126) · **P10 RivalryMix room**: 4 (T127–T130) · **P11 safeguarding/a11y/perf/final**: 6 (T131–T136).
- **Phasing**: P0 (T001–T003, T038–T039) · P1/MVP (T004–T010) · P2/P3/P4 (T011–T028, T040) · P5 (T029–T033) · P6 (T034–T036) · **P7 (T101–T113) · P8/UI-MVP (T114–T121) · P9 (T122–T126) · P10 (T127–T130) · P11 (T131–T136)**.
- **MVP scope**: domain MVP = P0 + P1 (near-peer candidate generation); **UI MVP = P7 + P8** (the 3D cohort-formation Compiler Observatory + 2D/reduced-motion tier + accessible Ledger).
- **Shared-file touches**: exactly one — **T136** (root `tsconfig.json` references for the domain dirs + `packages/cohort-arena-view`), flagged for human merge reconciliation (DP-UI-7, `severity: critical`). `apps/cohort-arena` is not a `tsc -b` reference (verified by `next build`).
