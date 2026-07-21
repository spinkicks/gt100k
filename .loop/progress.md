# Loop progress (durable memory the agent maintains each turn)

## 2026-07-20 — P0 / T001

- Scaffolded `packages/cohort-compiler` as `@gt100k/cohort-compiler` with the pinned ESM manifest, Vitest script, strict composite package TypeScript configuration, and an empty public entrypoint.
- Verified the package configuration independently with TypeScript.
- Gate status: `pnpm typecheck`, `pnpm test` (14/14), and `pnpm lint` pass. No blocker.

## NEXT

- T002 — Define every domain type listed in `specs/006-cohort-compiler/data-model.md` in `packages/cohort-compiler/src/model.ts`.
- Acceptance: the package compiles under the pinned strict TypeScript settings; all required fields are represented; `TurnAnalysis` exposes no honesty, emotion, personality, or motivation field; repository typecheck, tests, and lint remain green.

## 2026-07-20 — P0 / T002

- Added every domain declaration from `data-model.md` in `packages/cohort-compiler/src/model.ts`, including the caliper-independent benefit inputs, injected per-member `benefitOf`, atomic-assignment lifecycle shapes, safeguarding events, observable-only turn analysis, and post-lock shadow benefit.
- Added a compile-time/runtime model contract test covering all declared types and an exact `TurnAnalysis` surface, so honesty, emotion, personality, or motivation fields cannot be added without failing typecheck.
- TDD status: the focused strict package typecheck failed first because `src/model.ts` was absent, then passed after the declarations were implemented.
- Gate status: focused package typecheck passes; repository `pnpm typecheck`, `pnpm test` (19/19), and `pnpm lint` pass. P0 remains in progress; no blocker.

## NEXT

- T003 — Define the domain ports in `packages/cohort-compiler/src/ports.ts`: `CandidateIndex`, `CohortRepository`, `SafeguardingSink`, deferred `MediaTurnSource`, and shadow `BenefitEstimator` per `contracts/cohort-compiler.md`.
- Acceptance: compile-time contract coverage proves the exact async port methods and model types; the deferred/shadow seams contain no production I/O implementation; focused package typecheck and the repository typecheck/test/lint gate remain green.

## 2026-07-20 — P0 / T003

- Defined the exact asynchronous `CandidateIndex`, `CohortRepository`, `SafeguardingSink`, deferred `MediaTurnSource`, and post-lock shadow `BenefitEstimator` interfaces in `packages/cohort-compiler/src/ports.ts` using type-only model imports and no I/O implementation.
- Added compile-time contract coverage for every method, parameter, return promise, and domain model type in `packages/cohort-compiler/test/ports.test.ts`.
- TDD status: Vitest alone erased the type-only import, so the strict package compiler supplied the meaningful RED (`TS2307` for the absent port module); after implementation, both the strict compiler and the focused five-test suite passed.
- Gate status: `pnpm typecheck`, `pnpm test` (24/24), and `pnpm lint` pass. P0 remains in progress; no blocker.

## NEXT

- T038 — Commit the exact synthetic seed fixtures and golden expected values under `packages/cohort-compiler/test/fixtures/`: Fixture A (`caliper-8`), Fixtures B/B2/B3/B4 (`cohort-12`), Fixture C (`churn-rollback`), Fixture D (`safeguarding-shadow`), and Fixture E (`turns`).
- Acceptance: fixtures match the spec tables exactly, including D1–D6 benefit inputs and expected values; every fixture is typed against `model.ts`; no live or child data is present; focused package typecheck and the repository typecheck/test/lint gate remain green.

## 2026-07-20 — P0 / T038

- Added all five in-repo synthetic fixture modules for Golden Fixtures A, B/B2/B3/B4, C, D, and E, with model-typed learner, assignment, safeguarding, benefit, and turn-analysis values plus every pinned expected result.
- Added an exact fixture contract test covering shared learner fields, candidate lists/preimages, cohort partitions, B3/B4 floor cases, churn budgets/results and independent rollback oracle, safeguarding routing expectations, and every RivalryMix turn sequence/full analysis.
- TDD status: the focused fixture suite first failed because `fixtures/caliper-8.ts` did not exist, then passed after the fixture modules were implemented. A read-only review found no remaining Critical or Important findings after hardening benefit injection, exactness assertions, and rollback-oracle isolation.
- Gate status: `pnpm typecheck`, `pnpm test` (28/28), and `pnpm lint` pass. P0 remains in progress; no blocker.

## NEXT

- T039 — Add `packages/cohort-compiler/test/smoke.test.ts` importing the package entrypoint and `caliper-8` fixture.
- Acceptance: the entrypoint loads as an object; `caliper8.pool` contains exactly eight learners with eight unique `learnerRef`s; the focused smoke test and repository typecheck/test/lint gate remain green.

## 2026-07-20 — P0 / T039

- Added the exact seeded smoke test for the package namespace entrypoint and Golden Fixture A (`caliper-8`), asserting eight learners and eight unique `learnerRef`s.
- TDD status: T039 is the spec-pinned test-only checkpoint over the already-landed scaffold and fixture, so the focused two-test smoke suite passed on its first run; no production code was added.
- Gate status: focused smoke test passes (2/2); repository `pnpm typecheck`, `pnpm test` (30/30), and `pnpm lint` pass. The P0 Setup & Foundational checkpoint is complete; SC-008's seam-shape foundation is present, with full adapter substitution coverage remaining in later phases. No blocker.

## NEXT

- T004 — Add `packages/cohort-compiler/test/caliper.test.ts` with the contract tests for `withinCaliper` (FR-002).
- Acceptance: tests prove both level and velocity tolerances are enforced independently, equality at either tolerance is inside the caliper, and any value above either tolerance is outside; the new test first fails because `src/caliper.ts` is absent, while the existing repository gate remains green until the paired implementation task.

## 2026-07-20 — P1 / T004 + T007

- Added the FR-002 contract suite for `withinCaliper`, covering both dimensions independently, inclusive equality at each tolerance boundary, and rejection above either bound; also pinned the T007 Manhattan distance helper.
- Implemented pure `withinCaliper` and `caliperDistance` functions in `packages/cohort-compiler/src/caliper.ts` with no randomness, time, or I/O.
- TDD status: the focused suite first failed because `src/caliper.ts` was absent, then passed 3/3 after the minimal implementation.
- Gate status: `pnpm typecheck`, `pnpm test` (33/33), and `pnpm lint` pass. P1 is in progress; FR-002's caliper predicate is complete, while SC-001 still requires candidate generation. No blocker.

## NEXT

- T005 — Add `packages/cohort-compiler/test/candidates.test.ts` for the exact Fixture A candidate sets, exclusions, ordering, pinned FNV-1a hash, determinism, and absence of caste/full-field ranking fields.
- Acceptance: the focused contract fails first because `src/candidates.ts` is absent, then the paired minimal T008 implementation makes it pass; exact Fixture A outputs and SC-001 are asserted, and the repository typecheck/test/lint gate remains green.

## 2026-07-20 — P1 / T005 + T008

- Added the FR-002/FR-003/FR-004/FR-006 and SC-001 contract suite for `generateCandidates`, covering Fixture A's exact candidate refs/distances, both caliper bounds, self/separation exclusions, the `L5` empty case, deterministic byte output, the independently computed pinned UTF-8 FNV-1a hash, post-sort `k` capping, and the exact rank-free output surface.
- Implemented pure deterministic candidate generation in `packages/cohort-compiler/src/candidates.ts`: input-order subjects, within-caliper peer filtering, subject-owned separation exclusion, Manhattan-distance/ref ordering, `k` capping, and stable per-subject hashing.
- TDD status: the focused suite first failed because `src/candidates.ts` was absent, then passed 5/5 after the minimal implementation; a strict TypeScript check scoped to the new module and contract also passes.
- Gate status: `pnpm typecheck`, `pnpm test` (38/38), and `pnpm lint` pass. P1 remains in progress; SC-001's domain behavior is complete, while its `CandidateIndex` adapter seam and public entrypoint remain for T006/T009/T010. No blocker.

## NEXT

- T006 — Add the in-memory `CandidateIndex` adapter contract in `adapters/cohort-candidates-memory/test/index.test.ts`, then pair it with the minimal T009 adapter implementation to keep the tree green.
- Acceptance: `candidatesFor` returns the same `CandidateSet` as `generateCandidates` for Fixture A; the HNSW production seam is clearly marked deferred/not implemented; the focused test first fails because the adapter is absent, then passes after T009; repository typecheck/test/lint remain green.

## 2026-07-20 — P1 / T006 + T009

- Added the `@gt100k/cohort-candidates-memory` adapter package with an `InMemoryCandidateIndex` that wraps the pure domain generator over an injected synthetic pool and conforms to the `CandidateIndex` port.
- Added an explicit `DeferredHnswCandidateIndex` port implementation that contains no ANN dependency and rejects with a stable deferred/not-implemented error.
- Added the FR-005 contract suite comparing all eight Fixture A lookups byte-for-byte with `generateCandidates` and proving the production HNSW seam is unavailable in the MVP.
- TDD status: the focused suite first failed because `adapters/cohort-candidates-memory/src/index.ts` was absent, then passed 2/2 after the minimal implementation; an adapter-local strict TypeScript compilation also passes.
- Gate status: `pnpm typecheck`, `pnpm test` (40/40), and `pnpm lint` pass. P1 remains in progress only for T010's public domain exports; no blocker. A full standalone project-reference build also exposes the intentionally empty T010 entrypoint and a prior `cohort-12.ts` object-spread index-signature inference issue, neither of which is reached by the deferred root reference yet.

## NEXT

- T010 — Export the `model`, `caliper`, and `candidates` APIs from `packages/cohort-compiler/src/index.ts`, while preserving the repository's no-barrel constraint as far as the spec permits.
- Acceptance: consumers can import the required P1 domain types and functions through `@gt100k/cohort-compiler`; the package smoke/type contract compiles; the standalone feature project-reference build is green (including correction of the surfaced fixture index-signature inference if still required); repository typecheck/test/lint remain green; P1/SC-001 reaches its checkpoint.

## 2026-07-20 — P1 / T010

- Published every domain model type plus `caliperDistance`, `withinCaliper`, and `generateCandidates` through the explicit `@gt100k/cohort-compiler` entrypoint.
- Added a package-name public API contract covering all model type exports, exact P1 function signatures, and Fixture A behavior through the public surface.
- Corrected the previously surfaced `cohort-12.ts` boundary-map inference with a type-only `Record<string, number>` annotation; no synthetic fixture value changed.
- TDD status: the focused contract failed first because `withinCaliper` was absent from the entrypoint, then passed 2/2 after the explicit exports. The standalone package-and-adapter project-reference build passes.
- Gate status: `pnpm typecheck`, `pnpm test` (42/42), and `pnpm lint` pass. A read-only independent review found no remaining Critical, Important, or Minor issues. P1 and SC-001 are complete; no blocker.

## NEXT

- T011 — Add `packages/cohort-compiler/test/constraints.test.ts` for `isFeasibleCohort` and the default `benefitOf` formula.
- Acceptance: the contract rejects each of the seven hard constraints independently; Fixture B4 pins `D1..D4 = 0.775`, `D5 = 0.700`, and `D6 = 0.430`, proves the per-member floor rejects D6 despite a passing mean, and accepts the `0.63` boundary control; Fixture B3 proves injected-map rejection at `0.45` and acceptance at `0.50`; the test first fails against the absent modules, then the paired T040/T019 implementations restore the focused and repository gates.

## 2026-07-20 — P2 / T011 + T040 + T019

- Added the FR-007/FR-008/FR-009 and SC-002 contract suite for all seven hard constraints, including independent age, schedule, safeguarding-separation, mutual-accommodation, caliper, per-member non-harm, and churn-budget failures.
- Implemented the pure, caliper-independent default `benefitOf` composite and pinned Fixture B4 at `D1..D4 = 0.775`, `D5 = 0.700`, `D6 = 0.430`, mean `0.705`, and boundary control `D6 = 0.630`; Fixture B3 proves injected-map rejection at `0.45` and inclusive acceptance at `0.50`.
- Implemented deterministic `isFeasibleCohort` checks with machine-readable violations, one-directional accommodation blocks remaining hard-feasible, per-member floor enforcement, and prior-cohort churn comparison.
- TDD status: the focused suite first failed because `src/benefit.ts` was absent, then passed 11/11 after the minimal T040/T019 implementation; strict package TypeScript and focused Biome checks also pass.
- Gate status: `pnpm typecheck`, `pnpm test` (53/53), and `pnpm lint` pass. P2/SC-002 remains in progress for objective scoring and cohort assignment; no blocker.

## NEXT

- T012 + T020 — Add the `scoreObjective` contract first, then implement the deterministic soft objective in `packages/cohort-compiler/src/objective.ts`.
- Acceptance: feasible options receive deterministic `{ total, terms }` scores over the seven pinned objective terms; a higher score never promotes a hard-constraint-violating cohort; the focused test demonstrates RED before implementation, then the repository typecheck/test/lint gate returns green.

## 2026-07-20 — P2 / T012 + T020

- Added the FR-013 objective contract over all seven normalized terms, exact weighted-total arithmetic, input-order independence, pair-history direction, lower-churn monotonicity, and hard-gate-before-ranking behavior even when an infeasible option has the higher soft score.
- Implemented pure deterministic `scoreObjective` in `packages/cohort-compiler/src/objective.ts` using only approved `LearnerProfile` and optional prior-assignment state; the fixed six-slot role vector receives full coverage and no I/O, time, randomness, or learned model is consulted.
- TDD status: the corrected focused run first failed because `src/objective.ts` was absent, then passed 5/5 after implementation; a self-review refinement first failed at the pinned two-builder role vector, then passed after role coverage was aligned with that vector.
- Gate status: `pnpm typecheck`, `pnpm test` (58/58), and `pnpm lint` pass. P2/SC-002 now has hard feasibility and feasible-only soft scoring; cohort construction remains for T013/T021. No blocker.

## NEXT

- T013 + T021 — Add the `assignCohorts` golden solver contract first, then implement deterministic greedy construction plus bounded feasible repair in `packages/cohort-compiler/src/solver.ts`.
- Acceptance: Fixture B yields byte-identical cohorts `[A1..A6]` and `[B1..B6]` with the pinned role vector and no unassigned learners; Fixture B2 leaves `C1` unassigned with its binding age reason; every accepted cohort has six members and zero hard violations; no learned model is consulted; the focused RED/GREEN cycle and repository typecheck/test/lint gate pass.

## 2026-07-20 — P2 / T013 + T021

- Added the FR-007/FR-010/FR-012/FR-019 solver contract for Fixtures B/B2: exact cohorts and roles, exact C1 binding reason, six-member/zero-violation enforcement, byte-identical repeated output, and a solve signature/output with no learned-model seam.
- Implemented pure `assignCohorts` with greedy-first deterministic option ordering, bounded partition repair that maximizes feasible assigned coverage before soft score, two bounded feasible swap passes, lexical cohort/role ordering, assignment-level churn enforcement, stable unassigned reasons, and deterministic snapshot metadata derived only from passed inputs.
- TDD status: the focused suite first failed because `src/solver.ts` was absent, then review-driven regressions independently failed for greedy stranding, aggregate churn overflow, post-sort churn miscount, and post-sort hard-constraint validation before each targeted fix made them pass.
- Gate status: `pnpm typecheck`, `pnpm test` (65/65), and `pnpm lint` pass. Independent read-only review found no remaining Critical or Important issues. P2/SC-002 is complete; SC-006's no-learned-model solver boundary is complete, with the post-lock shadow adapter still scheduled in P4. No blocker.

## NEXT

- T014 + T022 — Add the `CohortRepository` adapter contract first, then scaffold and implement `adapters/cohort-repo-memory`.
- Acceptance: `commitAtomic` is whole-roster-or-nothing; `activeFor` enforces one active assignment per learner; `getSnapshot`/`restore` retain and return the exact prior snapshot; all reads/writes have deep-copy isolation; the focused test demonstrates RED before implementation; repository typecheck/test/lint remain green.

## 2026-07-20 — P3 / T014 + T022

- Added the `@gt100k/cohort-repo-memory` adapter package and its `CohortRepository` contract suite over Golden Fixture C.
- Implemented atomic whole-roster commits with full conflict preflight, one active assignment per learner, retained snapshots, prior-roster supersession, exact rollback, and deep-copy isolation across commit and every read boundary; PostgreSQL remains explicitly deferred.
- TDD status: the focused suite first failed because `src/index.ts` was absent, then passed 4/4 after implementation. Completion review added a rollback-return isolation assertion and proved it fails against a by-reference return before restoring the clone boundary.
- Gate status: adapter-local composite TypeScript passes; repository `pnpm typecheck`, `pnpm test` (69/69), and `pnpm lint` pass. P3/SC-003 now has the persistence adapter foundation; domain churn enforcement and lifecycle results remain for T015/T023. No blocker.

## NEXT

- T015 + T023 — Add the Golden Fixture C `commit`/`rollback` domain contract first, then implement `packages/cohort-compiler/src/commit.ts`.
- Acceptance: asg-1 commits with the pinned result; A6→A7 churn 2 is allowed at cap 2, refused at cap 1, and allowed with the recorded exception; duplicate-active refusal leaves the repository unchanged; `rollback("asg-2")` restores asg-1 byte-identically; focused RED/GREEN and repository typecheck/test/lint remain green.

## 2026-07-20 — P3 / T015 + T023

- Added the Golden Fixture C lifecycle contract for the exact commit results, cohort-index churn metric, inclusive cap boundary, recorded-exception path, atomic duplicate-active refusal, and byte-identical rollback.
- Implemented `membershipChurn`, `commit`, and `rollback` in `packages/cohort-compiler/src/commit.ts`; commit preflights retained-prior existence and one-active-per-learner, accounts for already-used weekly churn plus recorded exception deltas, sets the rollback reference, and delegates the whole-roster write/restore to the repository port.
- TDD status: the focused suite first failed because `src/commit.ts` was absent, then passed 6/6 after the minimal implementation. A focused Biome failure was traced to canonical formatting only, formatted mechanically, and reverified green.
- Gate status: package-local strict TypeScript and the package/adapter project-reference build pass; repository `pnpm typecheck`, `pnpm test` (75/75), and `pnpm lint` pass. P3/SC-003 is complete; SC-004's commit budget boundary is complete, with bounded repair remaining in P4. No blocker.

## NEXT

- T016 + T024 — Add the `repairCohort` contract first, then implement bounded in-budget repair in `packages/cohort-compiler/src/repair.ts`.
- Acceptance: an in-budget repair returns a reversible repaired assignment with a guide-veto window; a repair exceeding the churn budget or changing cohort size returns `staffExceptionRequired` and does not auto-apply; the focused RED/GREEN cycle and repository typecheck/test/lint gate remain green.

## 2026-07-20 — P4 / T016 + T024

- Added the FR-017/SC-004 `repairCohort` contract for an exact in-budget A6→A7 repair, an over-base-cap repair with a recorded manual exception, and a size-changing proposal with a recorded size exception.
- Implemented pure bounded-automation admission in `packages/cohort-compiler/src/repair.ts`: unchanged cohort sizes and remaining base churn capacity produce a repaired snapshot with prior/rollback wiring, an explicit guide-veto window, and a one-click rollback target; over-cap and size-changing proposals expose only `staffExceptionRequired` and never a repaired snapshot.
- TDD status: the correctly root-scoped focused suite first failed because `src/repair.ts` was absent, then passed 3/3 after the minimal implementation. The initial package-filtered invocation found no files because the repository Vitest globs are root-relative; no code was changed for that command-only issue.
- Gate status: package-local strict TypeScript and focused Biome pass; repository `pnpm typecheck`, `pnpm test` (78/78), and `pnpm lint` pass. P3/P4 SC-004 is complete; P4 remains in progress for safeguarding and post-lock shadow seams. No blocker.

## NEXT

- T017 + T025 + T026 — Add the Golden Fixture D safeguarding contract first, then implement `routeHealthEvent` and the in-memory `SafeguardingSink` adapter.
- Acceptance: the synthetic event reaches `sink.pending()` without entering optimization; the move touching A3 (`mv-1`) is paused while `mv-2` is unchanged; no rating or objective value changes; the focused RED/GREEN cycle and repository typecheck/test/lint gate remain green.

## 2026-07-20 — P4 / T017 + T025 + T026

- Added the Golden Fixture D safeguarding contract with the exact `Promise<void>` route signature, direct human-queue delivery, `mv-1` hold, untouched `mv-2`, optimizer/rating/objective isolation, and deep-copy queue boundaries.
- Implemented `routeHealthEvent` in `packages/cohort-compiler/src/safeguarding.ts` and the synthetic `@gt100k/cohort-safeguarding-memory` human-queue adapter; the route has no solver or learned-model seam and pauses only moves touching affected members.
- TDD status: the focused suite first failed because `src/safeguarding.ts` was absent, then passed 3/3 after the minimal domain route and adapter implementation. Focused strict TypeScript and Biome checks also pass.
- Gate status: `pnpm typecheck`, `pnpm test` (81/81), and `pnpm lint` pass. P4/SC-005 is complete; P4 remains in progress for the post-lock shadow-benefit seam. No blocker.

## NEXT

- T018 + T027 — Add the Golden Fixture D `BenefitEstimator` shadow-adapter contract first, then scaffold and implement `adapters/cohort-benefit-shadow`.
- Acceptance: `logAfterLock("asg-1", "2026-07-20T12:00:00Z")` returns the exact `{ assignmentId: "asg-1", lcb: 0, loggedAt: "2026-07-20T12:00:00Z", shadow: true }` golden only for a locked assignment; an unlocked/pre-lock call produces no estimate; the LCB is absent from and never consumed by solve/repair inputs; focused RED/GREEN and repository typecheck/test/lint remain green.

## 2026-07-20 — P4 / T018 + T027

- Added the Golden Fixture D shadow-estimator contract for the exact zero-LCB result, locked-assignment gating, pre-lock refusal, literal shadow marker, exact output surface, and both type-level and runtime exclusion from solve/repair inputs.
- Added the synthetic `@gt100k/cohort-benefit-shadow` adapter with an injected, copied lock registry and deterministic `ShadowBenefitEstimator`; peer-effect causal uplift remains explicitly deferred, no learned estimate or wall clock is consulted, and no domain source changed.
- TDD status: the focused suite first failed because `adapters/cohort-benefit-shadow/src/index.ts` was absent, then passed 4/4 after the minimal adapter implementation.
- Gate status: adapter-local composite TypeScript and focused Biome pass; repository `pnpm typecheck`, `pnpm test` (85/85), and `pnpm lint` pass. P4/SC-006 is complete; P4 governance behavior is complete, with its public-surface checkpoint remaining at T028. No blocker.

## NEXT

- T028 — Export the remaining US2 `benefit`, `constraints`, `objective`, `solver`, `commit`, `repair`, and `safeguarding` APIs from `packages/cohort-compiler/src/index.ts` using explicit named exports.
- Acceptance: consumers can import every required US2 value and type through `@gt100k/cohort-compiler`; the public API contract covers their exact signatures without widening the learned-model boundary; the standalone feature project-reference build and repository typecheck/test/lint gate remain green; the P4 checkpoint completes.

## 2026-07-20 — P4 / T028

- Published the completed US2 domain functions, result/move types, and injected `CohortRepository`, `SafeguardingSink`, and shadow `BenefitEstimator` port types through the `@gt100k/cohort-compiler` entrypoint using explicit named exports.
- Extended the package-name public API contract with runtime export checks and exact function signatures for benefit, feasibility, objective scoring, solving, commit/rollback/churn, repair, and safeguarding; the exact solve/repair tuples prove no learned-model input was added.
- TDD status: an initial type-only contract passed because Vitest erased type-position imports, so the contract was corrected to exercise the values at runtime; it then failed with all nine T028 exports undefined and passed 4/4 after the minimal entrypoint change.
- Gate status: package-local strict TypeScript and the focused public API suite pass; repository `pnpm typecheck`, `pnpm test` (87/87), and `pnpm lint` pass. A completion self-review found no Critical, Important, or Minor issues. P4 and SC-004/SC-005/SC-006 are complete; no blocker.

## NEXT

- T029 + T031 — Add the Fixture E `analyzeTurns` contract first, then implement pure observable-only RivalryMix analysis in `packages/cohort-compiler/src/rivalrymix.ts`.
- Acceptance: dominance flags S1 at confidence 1.0; repeated interruption flags S2; low-quality input yields confidence 0.225 and suppresses all patterns; sparse, empty, and ambiguous inputs surface no invented pattern; every output contains no honesty, emotion, personality, or motivation field; focused RED/GREEN and repository typecheck/test/lint remain green.

## 2026-07-20 — P5 / T029 + T031

- Added the complete Fixture E contract for `analyzeTurns`, covering exact per-speaker descriptors, dominance and repeated-interruption evidence, quality-qualified overlaps, all confidence goldens, suppression for low-quality/sparse/missing input, ambiguous-boundary non-attribution, and the exact observable-only output surface.
- Implemented pure deterministic RivalryMix analysis in `packages/cohort-compiler/src/rivalrymix.ts` with the pinned confidence formula, strict dominance cut, inclusive interruption cut, lexical output ordering, and zero surfaced patterns whenever confidence or turn-count suppression applies.
- TDD status: the focused suite first failed because `src/rivalrymix.ts` was absent, then passed 15/15 after the minimal implementation; strict package TypeScript and focused Biome checks pass.
- Gate status: repository `pnpm typecheck`, `pnpm test` (102/102), and `pnpm lint` pass. Local completion review found no Critical or Important issues. P5/SC-007's pure analysis behavior is complete; the deferred synthetic media stub and public export remain. No blocker.

## NEXT

- T030 + T032 — Add the `MediaTurnSource` stub adapter contract first, then scaffold and implement `adapters/cohort-media-stub`.
- Acceptance: `turns` yields a deep-copy-isolated synthetic `TurnEvent[]`; the adapter is explicitly marked non-production with WebRTC/AudioWorklet/LiveKit deferred; the focused RED/GREEN cycle and repository typecheck/test/lint gate remain green.

## 2026-07-21 — P5 / T030 + T032

- Added the synthetic `@gt100k/cohort-media-stub` adapter package with an injected per-room turn registry, copy isolation at constructor and read boundaries, and an empty-array missing-room result.
- Added an immutable non-production status marker naming WebRTC, AudioWorklet, and LiveKit as deferred under spec section 15.1; no capture, transport, network, or other production media dependency was introduced.
- Added the FR-025/SC-008 contract suite proving the exact `MediaTurnSource` signature, Fixture E delivery, input/read isolation, missing-analytics behavior, and deferred marker.
- TDD status: the focused suite first failed because `adapters/cohort-media-stub/src/index.ts` was absent, then passed 4/4 after the minimal implementation. Adapter-local composite TypeScript and focused Biome checks pass.
- Gate status: `pnpm typecheck`, `pnpm test` (106/106), and `pnpm lint` pass. P5/SC-007's analysis and media-stub behavior are complete; the P5 public-surface checkpoint remains. No blocker.

## NEXT

- T033 — Export the RivalryMix API and `MediaTurnSource` port from `packages/cohort-compiler/src/index.ts` using explicit named exports.
- Acceptance: consumers can import `analyzeTurns`, its threshold type, and `MediaTurnSource` through `@gt100k/cohort-compiler`; the public API contract proves the exact observable-only signatures; the standalone feature project-reference build and repository typecheck/test/lint gate remain green; P5/SC-007 reaches its checkpoint.

## 2026-07-21 — P5 / T033

- Published `analyzeTurns`, `RivalryMixThresholds`, and the deferred `MediaTurnSource` port type through the explicit `@gt100k/cohort-compiler` entrypoint without widening the learned-model or media implementation boundary.
- Extended the package-name public API contract with a runtime export check and exact compile-time signatures for observable-only turn analysis and synthetic turn retrieval.
- TDD status: the focused public API suite first failed because `analyzeTurns` resolved as `undefined`, then passed 6/6 after the minimal entrypoint exports were added.
- Gate status: the standalone package/media-adapter project-reference build passes; repository `pnpm typecheck`, `pnpm test` (108/108), and `pnpm lint` pass. Inline completion review found no Critical, Important, or Minor issues. P5 and SC-007 are complete; no blocker.

## NEXT

- T034 — Add `packages/cohort-compiler/README.md` documenting the public API, ports usage, and deferred production directions.
- Acceptance: the README accurately documents the exported domain functions and five adapter seams; HNSW, CP-SAT, WebRTC/AudioWorklet/LiveKit, peer-effect causal uplift, and PostgreSQL are explicitly marked deferred/not production; synthetic-only and observable-only guardrails remain clear; repository typecheck/test/lint stay green.
