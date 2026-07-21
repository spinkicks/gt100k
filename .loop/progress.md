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

## 2026-07-21 — P6 / T034

- Added `packages/cohort-compiler/README.md` with the complete named function surface, all five domain ports and buildable adapter packages, a typed `CandidateIndex` usage example, and the package verification commands.
- Documented synthetic-only, observable-only, no-caste, hard-constraint, and safeguarding guardrails, plus an explicit deferred/not-production register for HNSW, CP-SAT/branch-and-price, WebRTC/AudioWorklet/LiveKit, peer-effect causal uplift, and PostgreSQL.
- Added a README contract test so the required API, seam, deferral, and governance wording remains executable documentation.
- TDD status: the focused suite first failed 4/4 because `README.md` was absent, then passed 4/4 after the documentation was added and its exact deferred-target wording was aligned with the spec.
- Gate status: `pnpm typecheck`, `pnpm test` (112/112), and `pnpm lint` pass. P6 is in progress; SC-008's adapter/deferred-direction documentation checkpoint is complete. No blocker.

## NEXT

- T035 — Add the end-to-end synthetic demo at `adapters/cohort-repo-memory/src/demo.ts` mirroring `specs/006-cohort-compiler/quickstart.md`.
- Acceptance: the runnable demo wires a synthetic pool through candidate generation, solve, atomic commit and rollback, in-budget repair, safeguarding bypass, post-lock shadow benefit logging, and RivalryMix analysis without live data or production I/O; focused RED/GREEN coverage and repository typecheck/test/lint remain green.

## 2026-07-21 — P6 / T035

- Added a runnable `@gt100k/cohort-repo-memory` demo command and exported testable orchestration that walks a typed synthetic pool through deterministic candidates, feasible solve, atomic initial/repair commits, a two-member bounded repair, exact rollback, safeguarding bypass, post-lock shadow benefit logging, and observable-only RivalryMix analysis.
- Added an end-to-end contract pinning the exact assignment/cohort result, unassigned learner, commit and guide-veto carriers, rollback restoration, safeguarding hold and assignment isolation, shadow output, RivalryMix golden, and absence of rank/trait fields.
- TDD status: the focused suite first failed because `src/demo.ts` was absent, then passed after implementation; a safeguarding-isolation refinement separately failed before the unchanged-assignment evidence was added and passed afterward.
- Gate status: standalone adapter project-reference TypeScript passes; `pnpm typecheck`, `pnpm test` (113/113), `pnpm lint`, and `pnpm --filter @gt100k/cohort-repo-memory demo` all pass. P6 remains in progress only for T036 quickstart validation; no blocker.

## NEXT

- T036 — Run `specs/006-cohort-compiler/quickstart.md` validation end-to-end with the pinned domain gate commands.
- Acceptance: `pnpm typecheck` and `pnpm lint` are clean; `pnpm --filter @gt100k/cohort-compiler test` and workspace `pnpm test` are green; the quickstart obligations for Fixtures A–E and SC-001 through SC-008 remain satisfied without touching the deferred final root reference task.

## 2026-07-21 — P6 / T036

- Ran the domain quickstart validation end-to-end and found the package-filtered Vitest script inherited workspace-root include globs while executing from the package directory, causing the required focused command to find zero tests.
- Corrected only `packages/cohort-compiler/package.json` so its test script sets the workspace root and filters back to the domain test directory; the failing command then ran all 14 domain files and passed 81/81 tests without admitting adapter or unrelated workspace tests.
- Gate status: `pnpm typecheck`, `pnpm lint`, `pnpm --filter @gt100k/cohort-compiler test` (81/81), and `pnpm test` (113/113) pass. Fixtures A–E and SC-001 through SC-008 remain covered. P6 and the full pure-domain slice are complete; the shared root reference remains deferred to T136. No blocker.

## NEXT

- T101 — Scaffold `packages/cohort-arena-view` as `@gt100k/cohort-arena-view` with the pinned ESM manifest, composite package TypeScript configuration, and empty public entrypoint; do not touch shared root files.
- Acceptance: the new pure view package matches the P7 manifest/TypeScript contract, depends only on `@gt100k/cohort-compiler`, is discoverable by existing workspace globs, and the repository typecheck/test/lint gate remains green.

## 2026-07-21 — P7 / T101

- Scaffolded `packages/cohort-arena-view` as the pure `@gt100k/cohort-arena-view` workspace package with the pinned private ESM manifest, sole `@gt100k/cohort-compiler` workspace dependency, strict composite package TypeScript configuration, and empty public entrypoint.
- TDD status: the standalone package compiler first failed with the expected `TS5058` because the T101 configuration was absent, then passed after the minimal scaffold was added. Focused Biome exposed a single newline in the nominally empty entrypoint; byte-level diagnosis and canonical formatting reduced it to a true zero-byte file before re-verification.
- Gate status: standalone package TypeScript and focused Biome pass; repository `pnpm typecheck`, `pnpm test` (113/113), and `pnpm lint` pass. P7 has started; no shared root file was touched and no blocker remains.

## NEXT

- T102 — Add `packages/cohort-arena-view/test/art.test.ts` with the golden contract for `PALETTE`, `TYPOGRAPHY`, and state colors.
- Acceptance: the test pins every exact art token, proves each semantic state color has a paired icon, and verifies every required foreground/background contrast pair is at least 4.5:1; it fails first because `src/art.ts` is absent, while the existing repository gate remains green until the paired T109 implementation.

## 2026-07-21 — P7 / T102 + art portion of T109

- Added the exact Compiler Observatory `PALETTE` and `TYPOGRAPHY` registries in `packages/cohort-arena-view/src/art.ts`, including all 17 pinned hex values, three no-fetch font stacks, six type-scale rows, and tabular numerals.
- Added semantic `STATE_CUES` for assigned, unassigned, satisfied, paused, and suppressed states so every state color is paired with a stable icon and text label before any renderer exists.
- Added the T102 golden contract for exact tokens, semantic cue pairings, and WCAG relative-luminance checks across every required dark-surface, light-badge, state, and focus foreground/background pair.
- TDD status: the focused suite first failed because `src/art.ts` was absent, then passed 4/4 after the minimal art-token implementation.
- Gate status: package-local strict TypeScript and focused Biome pass; repository `pnpm typecheck`, `pnpm test` (117/117), and `pnpm lint` pass. P7 is in progress; SC-018's art-token and color-independent semantic foundation is complete, with layout constants and renderer-level accessibility still scheduled. No blocker.

## NEXT

- T103 + motion portion of T109 — Add `packages/cohort-arena-view/test/motion.test.ts`, then implement the exact `MOTION`, `EASINGS`, and `resolveMotion` registries in `src/motion.ts`.
- Acceptance: all 19 motion kinds match Fixture V4 in animated and reduced modes; exact durations/easings are pinned; every reduced result uses `mode: "reduced"` and `easing: "linear"`; the focused test demonstrates RED before implementation and repository typecheck/test/lint remain green.

## 2026-07-21 — P7 / T103 + motion portion of T109

- Added the exact Compiler Observatory `MOTION` and `EASINGS` registries plus the pure `resolveMotion` resolver and its `MotionKind`/`MotionSpec` contracts.
- Added the Fixture V4 golden suite covering the exact 19-kind union, every animated duration/easing row, and every first-class reduced-motion row, including retained non-vestibular press feedback and the static suppression veil.
- TDD status: the focused suite first failed because `src/motion.ts` was absent, then passed 3/3 after the minimal implementation; package-local strict TypeScript and focused Biome checks also pass.
- Gate status: `pnpm typecheck`, `pnpm test` (120/120), and `pnpm lint` pass. P7/SC-011 is complete at the pure motion-token layer; renderer-level reduced-motion parity remains scheduled for P8/P11. No blocker.

## NEXT

- T104 + T110 — Add the exact 3D/2D layout golden contract first, then implement `LAYOUT`, `layoutConstellation`, `layoutField`, `layoutArenaRing`, and `project2D` in `packages/cohort-arena-view/src/layout.ts`.
- Acceptance: Fixture V1 pins both cohort centers, all six-member hex vertices, floor halos, empty bench, field-position examples, and exact `project2D` coordinates; Fixture V3 pins the seat ring and projections; outputs are deterministic with 3D values rounded to 3 decimals and projected pixels integer-rounded; focused RED/GREEN and repository typecheck/test/lint remain green.

## 2026-07-21 — P7 / T104 + T110

- Added the exact `LAYOUT` registry and pure deterministic 3D geometry for cohort centers, sorted six-member hexes, non-harm-floor halos, the calm unassigned bench, caliper-gradient field starts, arena seats, and integer-rounded orthographic `project2D` output.
- Added the Fixture V1/V3 golden contract covering every pinned constant, all twelve settled cohort coordinates and projections, floor halos, field examples, deterministic pool/ref ordering, bench placement, the empty arena, and the exact three-speaker ring.
- Added a local TypeScript project reference to the compiler public surface and rooted the package test command at the workspace, so forced composite builds and the required package-filtered Vitest invocation are independently green without a shared lockfile edit.
- TDD status: the focused suite first failed because `src/layout.ts` was absent, then passed 4/4 after the minimal implementation. A forced feature build exposed the missing workspace-link boundary; following the established source-path/project-reference pattern made that strict build pass without widening the feature surface.
- Gate status: forced `cohort-compiler` + `cohort-arena-view` composite build passes; `pnpm --filter @gt100k/cohort-arena-view test` passes 11/11; repository `pnpm typecheck`, `pnpm test` (124/124), and `pnpm lint` pass. P7/SC-010 and the exact layout portion of SC-018 are complete; P7 remains in progress. No blocker.

## NEXT

- T105 + standings portion of T111 — Add the Fixture V2 `deriveStandingsView` contract first, then implement the pure gain-based opt-in standings view in `packages/cohort-arena-view/src/standings.ts`.
- Acceptance: opted-out standings return `null`; opted-in standings expose the exact anonymized near-peer gains, `selfGain: 300`, and `gainToBandTop: 40`; output ordering is deterministic and the type/runtime surface cannot carry rank, position, percentile, out-of, bottom-rank, or full-field ranking data; focused RED/GREEN, forced feature TypeScript, package tests, and repository typecheck/test/lint remain green.

## 2026-07-21 — P7 / T105 + standings portion of T111

- Added the pure `deriveStandingsView` projection and its structural `StandingsView` contract: standings are null unless explicitly opted in, Fixture V2 yields the exact three pseudonymous peer gains with `selfGain: 300` and `gainToBandTop: 40`, and the public shape contains only the four approved fields.
- Canonicalized copied peer rows by pseudonym/gain so input permutations are byte-identical without mutating caller data; used the neutral `"near-peer"` band label and kept own-growth headroom nonnegative when the learner already leads or the peer list is empty.
- TDD status: the focused suite first failed because `src/standings.ts` was absent, then passed 4/4 after the minimal implementation. Forced compiler/view TypeScript and focused Biome checks also pass.
- Gate status: `pnpm typecheck`, `pnpm test` (128/128), and `pnpm lint` pass. P7/SC-012 is complete at the pure view-model layer; the animated/reduced-motion standings renderer remains scheduled for P9. No blocker.

## NEXT

- T106 + rivalry portion of T111 — Add the Fixture V3 `buildArenaRoomView` contract first, then implement the pure observable-only arena-room view in `packages/cohort-arena-view/src/rivalry.ts`.
- Acceptance: dominance input yields the three pinned sorted seats, the S1 dominance pattern, confidence `1.0`, and `suppressed: false`; low-quality input yields the suppression veil with zero patterns; sparse/refused input invents no status; the type/runtime surface cannot carry honesty, emotion, personality, or motivation fields; focused RED/GREEN, forced feature TypeScript, package tests, and repository typecheck/test/lint remain green.

## 2026-07-21 — P7 / T106 + rivalry portion of T111

- Added the pure `buildArenaRoomView` projection and structural `ArenaRoomView`, `SeatView`, and `TurnPatternView` contracts over the committed observable-only `TurnAnalysis` boundary.
- Added the Fixture V3 golden suite for the exact sorted 3D/2D seat ring, S1 dominance evidence, confidence `1.0`, low-quality suppression with zero surfaced patterns, empty/refused neutrality, input/output copy isolation, deterministic record ordering, and exact trait-free type/runtime surfaces.
- Kept every `holdingFloor` marker false because `TurnAnalysis` contains no truthful current-speaker carrier; rejected inferring live state from aggregate share or dominance and recorded the choice in `.loop/decisions.md`.
- TDD status: the focused suite first failed because `src/rivalry.ts` was absent, then passed 5/5 after the minimal implementation; forced compiler/view composite TypeScript and focused Biome also pass.
- Gate status: `pnpm typecheck`, `pnpm test` (133/133), and `pnpm lint` pass. P7/SC-013 is complete at the pure view-model layer; the observable arena renderer remains scheduled for P10. No current blocker.

## NEXT

- T107 + remaining T111/T112 view composition — Add the Fixture V1 `buildCohortArenaView` and `plainViewEquals` contract first, then implement the remaining pure band, Ledger, and composed view functions needed to make it green.
- Acceptance: Fixture V1 produces two exact six-member cohort views with the pinned role vector, seven satisfied badges, `minBenefit 0.825 >= 0.5`, churn delta 0, and standings `null`; repeated inputs are byte-identical; presentation flags change only presentation/motion; the A6 to A7 rollback diff is display-only and leaves domain inputs unchanged; focused RED/GREEN, forced feature TypeScript, package tests, and repository typecheck/test/lint remain green.

## 2026-07-21 — P7 / T107 + remaining T111/T112 composition

- Added the structural `CohortArenaView`, input, cohort-card, safeguarding, presentation, visual-band, and Ledger contracts; implemented exact age-band presentation, the accessible Ledger projection, and the one deterministic composed view exported through the package's explicit public surface.
- Fixture V1 now composes two exact six-member hex/card views with the pinned role vector, all seven satisfied badge rows, exact `0.825 >= 0.5` non-harm readouts, zero churn, standings off, all 19 motion rows, and byte-identical repeated output. Reduced/plain/age-band variants change only motion and presentation under `plainViewEquals`.
- Added the display-only A6→A7 rollback view: per-cohort churn is `[2,0]`, the Ledger live-region announces `removed:[A6]; added:[A7]`, and both current and prior domain snapshots remain unchanged.
- TDD status: the focused suite first failed 3/3 because `buildCohortArenaView` was absent, then passed 3/3 after the minimal band/Ledger/composition implementation. A focused Biome check found only canonical formatting differences; the canonical formatter resolved them and the same strict checks passed.
- Gate status: forced compiler/view composite TypeScript passes; the view package passes 23/23 tests; repository `pnpm typecheck`, `pnpm test` (136/136), and `pnpm lint` pass. P7/SC-009 is complete; the pure-view portions of SC-014 and SC-016 are complete, with renderer/a11y work still scheduled. No blocker.

## NEXT

- T108 — Add `packages/cohort-arena-view/test/guardrails.test.ts` for the pure view-model source and structural public types.
- Acceptance: the package source contains no `Math.random`, dark-pattern, loss/decay/gacha/purchase/currency, or engagement-timer construct; public view types cannot carry price/currency/rank/position/percentile/out-of or honesty/emotion/personality/motivation fields; the focused test, forced feature TypeScript, package tests, and repository typecheck/test/lint remain green.

## 2026-07-21 — P7 / T108

- Added the SC-017 guardrail contract with a recursive scan across the pure view package source for `Math.random`, loss/streak, decay/absence, scarcity/FOMO, gacha/loot, purchase/currency, and engagement-timer constructs plus commerce field declarations.
- Added public-entrypoint structural checks that recursively exclude price/currency from `CohortArenaView`, rank/position/percentile/out-of from `StandingsView`, and honesty/emotion/personality/motivation from `ArenaRoomView`; runtime source checks cover the owning standings and RivalryMix declarations as well.
- TDD status: T108 is a validation-only checkpoint over the already-landed pure view model, so its focused four-test suite passed on the first run; no production code was added. Inline completion review hardened the scan to recurse into future source subdirectories and recognize camel/kebab/snake-case construct names.
- Gate status: forced compiler/view composite TypeScript passes; the view package passes 27/27 tests; repository `pnpm typecheck`, `pnpm test` (140/140), and `pnpm lint` pass. P7/SC-017 is complete; P7 remains in progress only for the typed view fixtures and seeded smoke in T113. No blocker.

## NEXT

- T113 — Commit the typed V1 `view-cohort-12`, V2 `view-standings`, V3 `view-rivalry`, and V4 `motion-golden` fixtures under `packages/cohort-arena-view/test/fixtures/`, then add `test/smoke.test.ts` through the public entrypoint.
- Acceptance: every fixture is typed against the domain and view contracts and preserves the pinned UI golden values; the smoke builds Fixture V1 through `@gt100k/cohort-arena-view`; forced feature TypeScript, the view package suite, and repository typecheck/test/lint remain green, completing the P7 checkpoint.

## 2026-07-21 — P7 / T113

- Added the typed V1 `view-cohort-12`, V2 `view-standings`, V3 `view-rivalry`, and V4 `motion-golden` fixture modules with the exact pinned cohort geometry/cards, gain-only standings, observable-only arena outputs, and all 19 animated/reduced motion rows.
- Added a fixture contract suite for V2–V4 and a seeded smoke that imports `@gt100k/cohort-arena-view`, builds V1, and verifies the exact member positions/projections, role vector, seven satisfied badges, non-harm floor, zero churn, opt-out standings, and neutral safeguarding view.
- TDD status: the smoke first failed because V1 was absent, then each V1 expansion and V2–V4 contract failed against its missing golden before the corresponding typed fixture made it pass.
- Gate status: forced compiler/view composite TypeScript passes; the view package passes 31/31 tests; repository `pnpm typecheck`, `pnpm test` (144/144), and `pnpm lint` pass. No feature app exists yet, so no app build applies to T113. P7 and its pure-view checkpoint are complete; renderer-level a11y, reduced-motion parity, and graceful degradation remain scheduled in P8–P11. No blocker.

## NEXT

- T114 — Scaffold `apps/cohort-arena` as the pinned Next.js 14 / React 18 app without touching shared root files.
- Acceptance: the app manifest contains the exact pinned Next/r3f/drei/three/postprocessing/motion/view dependencies; App Router layout, global accessibility/plain-mode CSS, `next.config.mjs`, app-local TypeScript configuration, placeholder-only env example, and gitignore exist; `pnpm --filter @gt100k/cohort-arena build`, repository typecheck/test/lint, and the existing P7 view package gate remain green.

## 2026-07-21 — P8 / T114

- Scaffolded `apps/cohort-arena` as the pinned private Next.js 14 / React 18 workspace app with the exact react-three-fiber v8, drei v9, three, postprocessing, motion, and `@gt100k/cohort-arena-view` dependencies; added the source-workspace transpilation boundary and an app-local non-composite TypeScript configuration.
- Added the App Router root layout and global shell styles using every committed `PALETTE`/`TYPOGRAPHY` value, visible focus rings, screen-reader utility, reduced-motion and reduced-transparency preferences, plain-mode hooks, placeholder-only public defaults, and local ignores for build output, dependencies, and environment files. No external font or asset fetch was introduced.
- Build diagnosis: the first real app build failed with `next: not found` because the new workspace had no local dependency links. A scoped `pnpm install --filter @gt100k/cohort-arena... --lockfile=false` created only local install state; before/after checksums prove `pnpm-lock.yaml`, root `package.json`, and `pnpm-workspace.yaml` were unchanged.
- Gate status: `pnpm --filter @gt100k/cohort-arena build` succeeds with an empty environment; `pnpm typecheck`, `pnpm test` (144/144), `pnpm lint` (110 files), and `pnpm --filter @gt100k/cohort-arena-view test` (31/31) pass. P8 has started and the app-shell foundation for SC-014/SC-015 is present; the first rendered route remains T115. No blocker.

## NEXT

- T115 — Add the server `app/page.tsx` shell and client-only `components/CohortArena.client.tsx` composition from a synthetic assignment and pool.
- Acceptance: the server route uses `next/dynamic` with `ssr: false`; the client component builds one deterministic `CohortArenaView` from synthetic-only domain inputs and exposes the 3D scene, HUD, 2D-tier, and Ledger regions for the dedicated T116–T119 renderers; the app build and repository typecheck/test/lint gates remain green.

## 2026-07-21 — P8 / T115

- Added the `/` server shell with `next/dynamic(..., { ssr: false })` and a client-only `CohortArena` composition that renders one shared view into explicit 3D scene, HUD, 2D-tier, and Cohort Ledger regions.
- Added a pure in-app synthetic Fixture V1-shaped view factory: two exact six-member cohorts, the pinned role vector, seven satisfied hard constraints, `0.825 >= 0.5` non-harm floors, no standings, no rivalry, no live data, and no I/O, time, network, or randomness.
- Added an app-local Vitest configuration and focused composition contract so app tests execute without widening the shared root Vitest globs. The contract proves byte-identical repeated views and the exact cohort/floor/constraint surface.
- Corrected the source-workspace Next boundary: app-local `.js` extension aliases resolve the ESM TypeScript implementation imports, while the view package public entrypoint now uses the repository's extensionless source re-export pattern so webpack can analyze its named exports without warnings.
- TDD status: the focused test first failed because `components/synthetic-view.ts` was absent, then passed 1/1 after the minimal factory. The production build reproduced the workspace-export integration failure before the narrow resolver/entrypoint correction made it compile warning-free.
- Gate status: app-local TypeScript and the focused app test pass; `pnpm typecheck`, `pnpm test` (144/144), and `pnpm lint` (115 files) pass; `pnpm --filter @gt100k/cohort-arena build` succeeds and prerenders `/` with no build warnings. P8/SC-014 now has its client-only composition and build foundation; runtime WebGL smoke/disposal, the full accessible Ledger, equal 2D tier, and richer renderers remain scheduled. No blocker.

## NEXT

- T118 — Implement the accessible Cohort Ledger in `apps/cohort-arena/components/ledger/` from the already-shared `view.ledger`, ahead of richer 3D work under the explicit MVP-first accessible-tier rule (T116–T119 are parallel after T115).
- Acceptance: cohorts render as a keyboard-focusable `role="tree"` with stateful accessible names; the live region conveys the same compiled state; the 3D canvas remains `aria-hidden="true"`; satisfied state is communicated by icon, shape, and text with visible focus and >=4.5:1 contrast; focused RED/GREEN, app build, app-local TypeScript, and repository typecheck/test/lint remain green.

## 2026-07-21 — P8 / T118

- Added the accessible `CohortLedger` React leaf over the shared `view.ledger`: one keyboard-focusable `role="tree"` composite, expanded cohort tree items with stateful accessible names, nested member/role and constraint tree items, and conditional standings, observable-turn, and safeguarding text surfaces.
- Replaced the preview list with visible focus styling and color-independent state cues: satisfied constraints use a square check marker plus explicit text, assigned members use a circular marker plus explicit text, and the native atomic polite status region announces the exact compiled state. The existing react-three-fiber canvas remains `aria-hidden="true"`.
- Added a static-render contract proving all 28 Fixture V1 tree items, both expanded cohort groups, the single keyboard entry point, every pinned member/role and satisfied constraint, 14 satisfied state cues, the non-harm floor, the live announcement, and the hidden-canvas boundary. Measured Ledger text/state/focus contrast ranges from 7.79:1 to 13.25:1.
- TDD status: the focused suite first failed because `components/ledger/CohortLedger.tsx` was absent, then reached a reproducible classic-JSX harness mismatch; aligning the app-local Vitest config with Next's automatic JSX runtime made the two-test contract pass.
- Gate status: app-local TypeScript and all 3 app tests pass; `pnpm typecheck`, `pnpm test` (144/144), `pnpm lint` (117 files), and the view package suite (31/31) pass; `pnpm --filter @gt100k/cohort-arena build` succeeds and prerenders `/`. T118 and the Cohort Ledger portion of SC-014 are complete; full tree command handling remains T132, and 2D/WebGL-loss/runtime-smoke coverage remains scheduled. No blocker.

## NEXT

- T119 — Implement the first-class 2D/reduced-motion tier in `apps/cohort-arena/components/tier2d/` from the same `CohortArenaView`, before richer 3D choreography.
- Acceptance: `useReducedMotion` and `NEXT_PUBLIC_REDUCED_MOTION_DEFAULT` select a motion-free DOM/SVG rendering of the exact `project2D` cohort positions; plain mode uses the same low-spectacle tier; no state is recomputed or lost; the Ledger remains available; focused RED/GREEN, app-local TypeScript/tests, production build, and repository typecheck/test/lint remain green.

## 2026-07-21 — P8 / T119

- Added a motion-free DOM/SVG 2D tier over the shared `CohortArenaView`, rendering the exact Fixture V1 `project2D` positions, settled cohort hexes, floor halos, all 12 member/role states, all 14 satisfied-constraint states, and a static polite announcement without WebGL.
- Wired `motion/react`'s `useReducedMotion`, the `NEXT_PUBLIC_REDUCED_MOTION_DEFAULT=system|on|off` override, and a 44px plain-mode toggle so reduced or plain presentation replaces the Canvas while the same module-scoped view, HUD, and Cohort Ledger remain available.
- Extended the synthetic view factory with test-only partial flags and proved `plainViewEquals` across standard, reduced, and plain views; invalid/unset configuration follows the system preference, while plain mode always selects the low-spectacle tier.
- TDD status: the focused suite first failed because `components/tier2d/CohortTier2D.tsx` was absent, then passed 4/4 after the minimal renderer and mode resolver; all app-local tests pass 7/7.
- Gate status: app-local TypeScript passes; `pnpm --filter @gt100k/cohort-arena build` succeeds with the reduced-motion environment unset and prerenders `/`; repository `pnpm typecheck`, `pnpm test` (144/144), and `pnpm lint` (120 files) pass. T119 and the P8 portion of SC-015 are complete; WebGL-loss fallback/runtime smoke remain T121/T133. P8 remains in progress; no blocker.

## NEXT

- T116 — Implement the 3D Compiler Observatory in `apps/cohort-arena/components/observatory/` from the already-shared view, now that the accessible Ledger and first-class 2D tier are green.
- Acceptance: render learner stars with drei `Instances` at exact constellation positions; animate compile field-to-hex choreography only through `useFrame` and `resolveMotion("compile", ...)`; draw caliper rings, satisfied-badge rings, and floor halos with restrained bloom; keep a calm follow-free camera, dispose GL resources on unmount, and retain the verified reduced/plain 2D fallback; focused RED/GREEN, app-local TypeScript/tests, production build, and repository typecheck/test/lint remain green.

## 2026-07-21 — P8 / T116

- Added a pure app-local observatory projection over the one shared `CohortArenaView`, pinning all twelve Fixture V1 field origins/settled positions, three caliper radii, fourteen satisfied badge markers, both exact domain-sourced floor halos, and the calm pending-bench carrier.
- Added the r3f Compiler Observatory with drei-instanced learner stars and badge markers, field guides, caliper rings, emissive floor halos, restrained bloom, capped lighting, 900ms field-to-hex compile choreography, 9000ms low-amplitude drift, and a 1200ms follow-free camera settle driven only by the golden motion/easing registry through `useFrame`.
- Added explicit lifecycle disposal for manually allocated instanced geometries/materials and kept the existing reduced-motion/plain-mode branch outside the Canvas, preserving the motion-free 2D tier and accessible Ledger from the exact same module-scoped view.
- TDD status: the focused suite first failed because `components/observatory/scene.ts` was absent, then passed after the minimal projection/renderer implementation. A subsequent fixture assertion correctly failed because B1's pinned field origin had been assigned to B6; tracing the synthetic profiles confirmed the production projection was correct, and the contract was narrowed to the spec-pinned B1 golden while retaining B6's exact settled position.
- Gate status: app-local TypeScript and all 10 app tests pass; repository `pnpm typecheck`, `pnpm test` (144/144), `pnpm lint` (123 files), and the view package suite (31/31) pass; both `pnpm --filter @gt100k/cohort-arena build` and root `pnpm build` succeed. T116 completes the 3D observatory portion of FR-031/FR-032 while the established 2D/Ledger paths retain SC-014/SC-015 parity. P8 remains in progress for the roster HUD, seed assets, and runtime smoke; no blocker.

## NEXT

- T117 — Implement the DOM cohort roster cards in `apps/cohort-arena/components/hud/` from the same `CohortArenaView` using `motion/react`.
- Acceptance: one card per cohort renders all six members with roles, seven satisfied badges with icon and text, and the exact non-harm-floor readout; membership changes use the `layout` FLIP boundary, controls retain scale `0.97` press feedback and >=44px targets, reduced motion remains state-equal, and focused RED/GREEN, app-local TypeScript/tests, both builds, and repository typecheck/test/lint remain green.

## 2026-07-21 — P8 / T117

- Added a dedicated `CohortRosterHud` over the shared module-scoped `CohortArenaView`: two accepted cohort cards render all twelve learner refs and roles, all fourteen icon/shape/text satisfied-constraint states, and both exact `0.825 >= 0.5` non-harm-floor readouts.
- Added token-derived `motion/react` FLIP boundaries to each card and stable member row using the pinned 520ms `memberSwap` motion, with instant state-identical layout under reduced/plain presentation; the existing 44px plain-mode control now uses the pinned non-vestibular `0.97` press response.
- Added a focused static-render/source contract covering the full Fixture V1 HUD surface, animated/reduced metadata parity, exact motion-registry wiring, client integration, and target size.
- TDD status: the focused suite first failed because `components/hud/CohortRosterHud.tsx` was absent, then passed 2/2 after the minimal renderer, integration, and styles. A markup-only assertion mismatch was traced to React's server renderer coalescing adjacent text and corrected without changing the acceptance behavior.
- Gate status: app-local TypeScript and all 12 app tests pass; `pnpm typecheck`, `pnpm test` (144/144), `pnpm lint` (126 files), and the view package suite (31/31) pass; both `pnpm --filter @gt100k/cohort-arena build` and root `pnpm build` succeed. T117 and the roster-HUD portion of FR-032/FR-033 are complete; P8 remains in progress for seed assets and runtime smoke. No blocker.

## NEXT

- T120 — Commit the seed inline SVG set under `apps/cohort-arena/public/seed/` plus the deterministic three.js/drei procedural fallback.
- Acceptance: star, hex, badge, floor-halo, seat, shield, and shared icons are committed in-repo; the scene has a deterministic primitive fallback; no renderer performs an external fetch; focused RED/GREEN, app-local TypeScript/tests, production build, and repository typecheck/test/lint remain green.

## 2026-07-21 — P8 / T120

- Added nine in-repo Compiler Observatory SVG seeds for the star, cohort hex, constraint badge, non-harm-floor halo, arena seat, and the complete semantic state-cue set (`bench`, `check`, `shield`, `veil`), all with accessible titles, pinned palette defaults, `currentColor` geometry, and no remote or raster content.
- Added an app-local asset contract that pins the exact seed inventory, ties every `STATE_CUES` icon to a committed file, rejects scripts/raster/remote references and renderer fetches, and proves the existing deterministic three.js/drei primitives remain the no-asset fallback.
- TDD status: the focused four-test contract first failed because `public/seed` was absent, then passed 4/4 after the minimal SVG set was added; the complete app-local suite passes 16/16.
- Gate status: app-local TypeScript, `pnpm typecheck`, `pnpm test` (144/144), and `pnpm lint` (127 files) pass; both `pnpm --filter @gt100k/cohort-arena build` and root `pnpm build` succeed. T120/FR-042 is complete; P8 remains in progress only for the runtime smoke. No blocker.

## NEXT

- T121 — Add the seeded app runtime smoke for the full P8 UI MVP.
- Acceptance: `/` mounts the r3f canvas with zero console/WebGL errors, disposes cleanly, switches to the reduced-motion/2D tier without state loss, and exposes a present and keyboard-focusable Cohort Ledger; the smoke, app-local tests/TypeScript, production build, and repository typecheck/test/lint gate remain green.

## 2026-07-21 — P8 / T121

- Added an app-local Playwright production-runtime smoke and scripts that start the built Viewer, require a real WebGL2 context, capture console/page errors, focus the Cohort Ledger, and pin all 12 roster members, 14 satisfied constraints, two floor readouts, and 28 Ledger tree items.
- Proved clean r3f disposal by switching the live scene to plain 2D, observing the original WebGL context become lost after unmount, remounting the canvas, then reloading under `prefers-reduced-motion: reduce` and confirming the same compiled state in the motion-free 2D tier.
- The first behavioral browser run exposed that r3f applied `aria-hidden` to its wrapper but not the generated canvas. Added the minimal `onCreated` boundary so the real canvas is directly `aria-hidden="true"`; the unchanged smoke then passed. Playwright output stays inside the ignored app build tree, and the scoped dependency install changed no shared manifest or lockfile.
- Gate status: app unit tests pass (16/16); `pnpm typecheck`, `pnpm test` (144/144), `pnpm lint`, root `pnpm build`, `pnpm --filter @gt100k/cohort-arena build`, and the seeded Playwright smoke (1/1) all pass. P8 and the UI MVP checkpoint are complete; SC-014 now has runtime mount/error/disposal/accessibility evidence and SC-015 has runtime state-parity evidence, while P11 retains WebGL-loss/performance degradation and the full WCAG pass. No blocker.

## NEXT

- T122 — Implement the opt-in gain-based standings panel in `apps/cohort-arena/components/hud/` from `view.standings`.
- Acceptance: an opted-in view renders anonymized near-peer gains, `selfGain: 300`, and `gainToBandTop: 40` with an amber left-to-right bar and tabular number ticker driven by `resolveMotion("standingsBar"/"gainCelebrate", ...)`; the renderer exposes no rank/bottom-rank language or field, reduced motion shows the instant final values, and focused tests, app TypeScript/build, the seeded smoke, and repository typecheck/test/lint remain green.

## 2026-07-21 — P9 / T122

- Added a stateless `StandingsPanel` over the shared composed view: default/null renders nothing, while Fixture V2 renders exact own gain `300`, headroom `40`, and the three pseudonymous near-peer gains with no rank, position, percentile, leaderboard, bottom-rank, or beating-others surface.
- Added the pinned amber left-to-right bar and tabular number ticker through `resolveMotion("standingsBar", ...)`, plus the restrained own-growth chip through `resolveMotion("gainCelebrate", ...)`; reduced/plain presentation resolves both to the exact instant final state while screen readers receive one stable final value.
- Added the hidden-by-default synthetic Fixture V2 payload, client HUD integration, responsive token-based styles, and a focused three-test contract for opt-out absence, exact opted-in state, structural language guardrails, golden motion values, and reduced-motion parity. New color pairs measure from 8.03:1 to 11.94:1.
- TDD status: the focused suite first failed because `components/hud/StandingsPanel.tsx` was absent, then passed 3/3 after the minimal renderer, integration, and styles; the full app suite passes 19/19.
- Gate status: app-local TypeScript, `pnpm typecheck`, `pnpm test` (144/144), `pnpm lint` (131 files), `pnpm --filter @gt100k/cohort-arena build`, root `pnpm build`, and the seeded Playwright production smoke (1/1) pass. The first smoke launch exposed three missing host Chromium libraries; extracting them temporarily and setting `LD_LIBRARY_PATH` proved the unchanged smoke green without modifying the repo or host package database. T122 and the renderer portion of SC-012 are complete; T123 retains interactive opt-in wiring. No blocker.

## NEXT

- T123 — Add the standings opt-in toggle in `apps/cohort-arena/components/` and wire it to the existing `standingsOptIn` view flag.
- Acceptance: standings remain default off; opting in exposes the exact T122 Fixture V2 panel and Ledger text from one recomposed synthetic view; opting out restores the byte-identical default cohort/rivalry/safeguarding state; the frequent toggle uses instant `resolveMotion("hudToggle", ...)`, has a >=44px accessible target, and focused tests, app TypeScript/build, seeded smoke, and repository typecheck/test/lint remain green.
