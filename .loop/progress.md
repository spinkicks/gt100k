# Loop progress (durable memory the agent maintains each turn)

## 2026-07-20 — P0 / T001
- Scaffolded `@gt100k/interest-lab` with the pinned ESM package entry points and `vitest run` test script.
- Added the exact P0 smoke test and a package-local Vitest include so the specified filtered test command discovers package tests.
- Verified `pnpm --filter @gt100k/interest-lab test`, `pnpm typecheck`, and `pnpm test` (15 tests) all pass.
- Status: T001 complete; P0 remains in progress; feature success criteria are not yet started. No blocker.

## NEXT
- Complete T002: add `packages/interest-lab/tsconfig.json` extending `../../tsconfig.base.json` with `rootDir: "."`, `outDir: "dist"`, and `include: ["src/**/*.ts", "test/**/*.ts"]`.
- Acceptance: the package TypeScript project compiles without changing any shared root file, and `pnpm typecheck` plus `pnpm test` remain green.

## 2026-07-20 — P0 / T002
- Added `packages/interest-lab/tsconfig.json`, matching the reference domain package and the exact T002 compiler settings.
- Confirmed the test-first red state: `pnpm exec tsc -b packages/interest-lab` failed with TS5083 before the config existed, then passed after the change.
- Verified `pnpm --filter @gt100k/interest-lab test` (1 test), `pnpm typecheck`, and `pnpm test` (15 tests) all pass.
- Status: T002 complete; P0 remains in progress; feature success criteria are not yet started. No blocker.

## NEXT
- Complete T003: scaffold the four `adapters/interest-*` packages with package-local `package.json` and `tsconfig.json` files mirroring `adapters/repo-memory` and referencing `@gt100k/interest-lab`.
- Acceptance: all four adapter packages resolve their `workspace:*` domain dependency and compile through their package-local TypeScript references; `pnpm typecheck` and `pnpm test` remain green without shared-root edits.

## 2026-07-20 — P0 / T003
- Scaffolded `@gt100k/interest-repo-memory`, `@gt100k/interest-probe-catalog`, `@gt100k/interest-assent-stub`, and `@gt100k/interest-artifact-stub` with package manifests mirroring `adapters/repo-memory` and TypeScript references to `packages/interest-lab`.
- Confirmed the test-first red state: the four-project `tsc -b` command failed with TS5083 for each absent adapter config before the scaffold, then passed with `--force` after the eight files were added.
- Resolved all four `workspace:*` domain links via `pnpm install --lockfile=false`, preserving the shared root lockfile.
- Verified `pnpm --filter @gt100k/interest-lab test` (1 test), `pnpm typecheck`, and `pnpm test` (15 tests) all pass.
- Status: T003 complete; P0 complete; feature success criteria are not yet started. No blocker.

## NEXT
- Complete T004: define the foundational probe vocabularies and value types in `packages/interest-lab/src/probe.ts` exactly as specified in the plan data model.
- Acceptance: tests first encode all 9 `WorkMode` verbs plus `DifficultyBand`, `AudienceCondition`, `SocialMode`, `SafetyClass`, `Provenance`, `Probe`, `ProbeFamily`, and the open `Domain = string` alias; the package-local compiler, `pnpm typecheck`, and `pnpm test` remain green.

## 2026-07-20 — P1 / T004
- Added the exact fixed vocabularies and their string-literal types, while preserving `Domain` as an open catalog-supplied string with no hardcoded domain list.
- Defined the full IL-001 `Probe` value type and the IL-002 `ProbeFamily` equivalent-variant container.
- Confirmed the test-first red state: the focused probe suite failed to resolve the absent `src/probe.ts`, then passed all 5 contract tests after implementation.
- Verified the forced package-local TypeScript build, `pnpm typecheck`, and `pnpm test` (20 tests) all pass.
- Status: T004 complete; P1 remains in progress; the IL-001/IL-002 structural contracts are encoded, while feature success-criteria tests remain pending. No blocker.

## NEXT
- Complete T005: define all injected domain ports and the deferred `OfferSelector` shape in `packages/interest-lab/src/ports.ts` per the plan's Domain Contracts.
- Acceptance: compile-time tests encode `InterestHypothesisRepository`, `ProbeCatalog`, `AssentRecordPort`, `ArtifactSignalSource`, `OfferDecisionLog`, `Clock`, and the non-implemented forward-compatible `OfferSelector`; the package-local compiler, `pnpm typecheck`, and `pnpm test` remain green.

## 2026-07-20 — P1 / T005
- Added four compile-time contract tests covering append-only hypothesis replay, injected catalog/assent/artifact/clock boundaries, rules-engine decision logging, and the deferred selector shape.
- Confirmed the test-first red state: the package compiler failed with TS2307 for the absent `src/ports.ts`, then passed after the minimal port interfaces were added.
- Kept T005 independent of later record-definition tasks through typed payload parameters; no bandit implementation, wall-clock read, I/O implementation, or raw artifact shape was introduced.
- Corrected feature-local formatter findings and verified `pnpm typecheck`, `pnpm test` (24 tests), and `pnpm lint` all pass.
- Status: T005 complete; P1 remains in progress; injected-boundary contracts for IL-014/IL-016/IL-021 are encoded. No blocker.

## NEXT
- Complete T006: define event, signal, hypothesis, coverage, purpose, and guide-review types in `packages/interest-lab/src/events.ts` and `packages/interest-lab/src/hypothesis.ts` exactly as specified in the P1 data model.
- Acceptance: tests first encode `EventType` (including `ARTIFACT_COMPETENCE`), `EngagementEvent`, `SignalFamily`, `SignalSummary`, `HypothesisState`, `ChildPosition`, `InterestHypothesis`, `HypothesisRevision`, `CoverageMatrix`, `ForbiddenPurpose`, and `GuideReview`; the package compiler, `pnpm typecheck`, and `pnpm test` remain green.

## 2026-07-20 — P1 / T006
- Added exact runtime vocabularies and string-literal types for engagement events, the six promotion-gate signal families, lifecycle states, child positions, and all five forbidden purposes.
- Defined the complete plain-data contracts for `EngagementEvent`, G4-shaped `SignalSummary`, G2-shaped `CoverageMatrix`, non-scalar uncertainty, accountable `GuideReview`, append-only `HypothesisRevision`, and the `InterestHypothesis` aggregate.
- Confirmed the test-first red state: both focused suites failed to resolve the absent `events.ts` and `hypothesis.ts`, then passed all 10 contract tests after the minimal implementation.
- Verified the package suite (20 tests), forced package compiler, `pnpm typecheck`, `pnpm test` (34 tests), and `pnpm lint` all pass.
- Status: T006 complete; P1 remains in progress; the structural contracts for IL-005/006/007/012/013/020 are encoded, while their behavioral success-criteria tests remain in later phases. No blocker.

## NEXT
- Complete T007: export all T004–T006 foundational vocabularies, value types, and ports from `packages/interest-lab/src/index.ts`.
- Acceptance: consumers can import the complete foundational public API from `@gt100k/interest-lab`; the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green.

## 2026-07-20 — P1 / T007
- Added explicit named value and type exports for every foundational probe, event, signal, hypothesis, coverage, purpose, and port contract.
- Added a consumer-facing public-API test that imports all 11 runtime vocabularies and every T004–T006 type through `src/index.ts`.
- Confirmed the test-first red state: the focused runtime test failed on undefined exports and the package compiler failed with TS2306 while the entry point was empty; both passed after implementation.
- Verified the forced package compiler, `pnpm typecheck`, `pnpm test` (36 tests), and `pnpm lint` all pass.
- Status: T007 complete; P1 complete; P2 is next. Behavioral success-criteria tests remain in their ordered later phases. No blocker.

## NEXT
- Complete T008: author the three normative probe-catalog fixtures in `adapters/interest-probe-catalog/src/index.ts` and their test-first catalog contracts.
- Acceptance: the golden catalog contains all 24 pinned families with exactly 20 eligible rows and the G1 domain/work-mode tallies; the gappy catalog has exactly 8 eligible rows and the pinned gaps; the family fixture has 3 equivalent variants; adapter/package compilation, `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green.

## 2026-07-20 — P2 / T008
- Added the three normative synthetic probe catalogs: 24-family golden (20 eligible plus four filtered controls), 8-family gappy, and one three-variant equivalent family.
- Added five catalog acceptance tests that pin the eligible rows, G1 domain/work-mode/cross-cutting tallies, filtered controls, gappy dimensions, and equivalent-variant semantics.
- Confirmed the test-first red state: the focused suite failed to resolve the absent adapter source, then passed all five tests after the minimal fixtures were implemented.
- Verified the forced adapter compiler, focused catalog suite (5 tests), `pnpm typecheck`, `pnpm test` (41 tests), and `pnpm lint` all pass.
- Status: T008 complete; P2 remains in progress; normative catalog inputs for SC-001/SC-002 and IL-002/IL-003 are now encoded. No blocker.

## NEXT
- Complete T009: add the normative ten-event `EVENTS_GOLDEN_V1` fixture under `packages/interest-lab/test/fixtures/events.ts` exactly as pinned in the P2 seed table.
- Acceptance: tests first lock event ids/types/day offsets and intervention/assistive fields, including `e7.optionalReflection === true`; the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green.

## 2026-07-20 — P2 / T009
- Added the normative ten-event `EVENTS_GOLDEN_V1` synthetic stream with exact ids, types, day offsets, prompted reminder context, assistive marker, and withdrawable `e7` reflection.
- Added two fixture contract tests covering the pinned stream order and the deterministic synthetic defaults required by `EngagementEvent`.
- Confirmed the test-first red state: the focused suite failed to resolve the absent fixture module, then passed both tests after implementation.
- Verified the forced package compiler, package suite (24 tests), `pnpm typecheck`, full suite (43 tests), and `pnpm lint` all pass.
- Status: T009 complete; P2 complete; the normative inputs for G1–G4 and later SC tests are present. No blocker.

## NEXT
- Complete T010: write the contract and golden tests for `buildCoverageMatrix` in `packages/interest-lab/test/coverage.test.ts` before implementing coverage behavior.
- Acceptance: the complete and gappy cases deep-equal G2 and G3, including exact per-dimension and aggregated gap strings in dimension order, and expose no `score` or `confidence`; the focused red state is confirmed and the green gate remains intact after the later implementation task.

## 2026-07-20 — P3 / T010 + T014
- Added three acceptance tests that deep-equal the exact G2 complete matrix and G3 gappy matrix, preserve dimension-ordered aggregate gaps, and reject `score`/`confidence` fields.
- Confirmed the test-first red state twice: first all three tests failed on the absent module, then the golden assertions failed against a non-behavioral `null` stub before implementation.
- Implemented the pure `buildCoverageMatrix` projection with catalog-order domains, fixed-vocabulary work modes, explicit cross-cutting gaps, probe-count bounds, and no scalar coverage output.
- Paired T010 with its minimal T014 implementation so the required red evidence was preserved without leaving the green-only overnight harness at a failing commit boundary.
- Verified the focused suite (3 tests), forced package compiler, `pnpm typecheck`, `pnpm test` (46 tests), and `pnpm lint` all pass.
- Status: T010 and T014 complete; P3 remains in progress; SC-002's exact G2/G3 behavioral contract is green. No blocker.

## NEXT
- Complete T011: add the `buildLab` G1 golden and determinism tests in `packages/interest-lab/test/offer.test.ts`.
- Acceptance: the golden catalog yields 20 RULE-provenance offers with non-empty reasons, exact G1 domain/work-mode/cross-cutting counts, `explorationReserved === 20`, at least two eligible choices, and byte-identical Lab output for seeds `{1, 42, 999}`; preserve a focused red run and the full green gate.

## 2026-07-20 — P3 / T011 + partial T015
- Added the exact G1 `buildLab` acceptance suite for 20 offers, domain/work-mode/cross-cutting tallies, RULE provenance, non-empty reasons, exploration reservation, eligible-choice floor, same-input byte determinism, and seed-invariant full-set probe ids.
- Confirmed the test-first red state: the focused suite failed to resolve the absent `src/offer.ts`, then passed both tests after the minimal implementation.
- Added the pure Lab/config/offer contracts and the minimum catalog-order assembly needed for G1: cleared/prerequisite-valid filtering, one eligible variant per family, coverage composition, dormant-domain exploration count, and replayable effective config. Surplus coverage-greedy rotation and decision logging remain for ordered implementation tasks.
- Verified the forced package compiler, `pnpm typecheck`, `pnpm test` (48 tests), and `pnpm lint` all pass.
- Status: T011 complete; T015 is intentionally partial; P3 remains in progress. SC-001's exact G1 balance and full-catalog determinism are green, while T012/T013 still own explicit filter, family-variant, and selection-under-surplus contracts. No blocker.

## NEXT
- Complete T012: add the remaining offer contract tests for p21–p24 exclusion, at-most-one equivalent variant per family per choice point, and deterministic coverage-satisfying selection under catalog surplus.
- Acceptance: the focused test first fails against the minimal G1 implementation for the documented `stableSort(familyId)` plus seeded-rotation surplus case; the later minimal catalog/selection implementation restores the focused suite and the full `pnpm typecheck`, `pnpm test`, and `pnpm lint` gate.

## 2026-07-20 — P3 / T012 + T013 + partial T015
- Added explicit offer contracts proving p21–p24 are never offered, one equivalent family contributes at most one variant per choice point, and a six-family surplus deterministically yields the exact coverage-complete subset `c,e,d,f`.
- Confirmed the test-first red state: the existing take-first implementation returned incomplete subset `a,b,c,d`; the focused suite passed after the minimal catalog and surplus-selection implementation.
- Added pure catalog eligibility, stable family-id ordering, one-variant selection, normalized seed rotation, and documented coverage-greedy tie breaking; preserved G1's seed-stable full eligible set when there is no surplus.
- Strengthened self-review by checking every filtered control independently and rebuilding the surplus case byte-identically.
- Verified the focused offer suite (5 tests), forced package compiler, `pnpm typecheck`, `pnpm test` (51 tests), and `pnpm lint` all pass.
- Status: T012 and T013 complete; T015 remains partial pending its decision-log and optional-selector boundary. IL-002/IL-018 surplus-selection behavior is green; P3 remains in progress. No blocker.

## NEXT
- Complete T015: finalize `buildLab` with the `OfferDecisionLog` replay entry and optional deferred `OfferSelector` parameter while keeping the selector unused in the rules-engine MVP.
- Acceptance: tests first pin the eligible-set ids, policy version, coverage-constraint log payload, and identical Lab output with the selector omitted; package compilation, `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green.

## 2026-07-20 — P3 / T015
- Added a pure `decisionLogEntry` to each Lab with the pre-selection eligible probe ids, `rules-engine-v1` policy version, and exact effective coverage/exploration constraints for replay through an `OfferDecisionLog` adapter.
- Added the optional fifth `OfferSelector` parameter while proving the rules-engine MVP never invokes it and produces the same operative Lab with or without the deferred selector.
- Confirmed both test-first red states: the focused suite failed on the absent replay entry, and the package compiler failed with TS2554 before the selector parameter existed.
- Verified the focused offer suite (7 tests), forced package compiler, `pnpm typecheck`, `pnpm test` (53 tests), and `pnpm lint` all pass.
- Status: T015 complete; P3 remains in progress. SC-001 remains green, and the PASS-009/IL-016/IL-021 forward-compatible audit boundary is now encoded. No blocker.

## NEXT
- Complete T016: upgrade `packages/interest-lab/test/smoke.test.ts` from the P0 arithmetic smoke to the seeded G1 determinism guard.
- Acceptance: the smoke test builds the golden Lab, asserts 20 offers, identical selected probe ids across seeds `{1, 42, 999}`, and coverage deep-equal to G2; preserve a failing red run before implementation and keep `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-20 — P3 / T016
- Replaced the P0 arithmetic smoke with a standalone seeded G1/G2 guard that builds the golden Lab for seeds `{1, 42, 999}`, pins all 20 selected probe ids, and deep-equals the complete coverage matrix for every run.
- Extracted the existing package-local golden catalog helpers into `test/fixtures/catalog.ts` so the offer suite and smoke share one synthetic input without introducing a domain-to-adapter dependency.
- Confirmed the smoke's failure sensitivity by temporarily changing the default target from 20 to 19, observing the exact `expected length 20 but got 19` assertion failure, restoring the pinned value, and rerunning green.
- Verified the focused smoke, forced package compiler, `pnpm typecheck`, `pnpm test` (53 tests), and `pnpm lint` all pass.
- Status: T016 complete; P3 remains in progress pending the public API export. SC-001 and SC-002 now have an additional seeded smoke guard. No blocker.

## NEXT
- Complete T017: export the offer, coverage, and catalog API explicitly from `packages/interest-lab/src/index.ts`.
- Acceptance: a consumer-facing test imports the P3 functions, constants, and public types from `@gt100k/interest-lab`; the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green.

## 2026-07-20 — P3 / T017
- Exported the complete P3 catalog, coverage, and offer API through explicit named entry-point exports: five functions, `DEFAULT_LAB_CONFIG`, and six public data types.
- Expanded the consumer-facing public API suite and confirmed its test-first red state against the missing exports before the minimal entry-point implementation made it green.
- Traced and corrected a strict TypeScript mismatch in the initial Vitest matcher without weakening the runtime export assertion.
- Verified the focused public API suite (3 tests), forced package compiler, `pnpm typecheck`, `pnpm test` (54 tests), and `pnpm lint` all pass.
- Status: T017 complete; P3 and the rules-engine MVP checkpoint are complete. SC-001 and SC-002 remain green. No blocker.

## NEXT
- Complete T018: add the `recordEvent` contract suite in `packages/interest-lab/test/events.test.ts` and pair it with the minimal implementation needed to preserve the green-only harness boundary.
- Acceptance: event recording is idempotent by id; `PROMPTED_RETURN` requires `interventionContext` and never contributes to voluntary return; voluntary-return 7-day and 30-day horizons are represented correctly; preserve a focused red run and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-20 — P4 / T018 + T020
- Added four `recordEvent` contracts covering immutable append, first-write-wins idempotency, prompted-return context enforcement and non-voluntary typing, exact 7/30-day voluntary horizons, and preservation of assistive/safety/withdrawal tags.
- Confirmed the test-first red state: the focused suite failed all four contracts because `recordEvent` was absent, then passed after the minimal implementation.
- Implemented the pure event recorder with no wall-clock access or signal computation; prompted returns without `interventionContext` are rejected before storage.
- Verified the focused suite (4 tests), forced package compiler, `pnpm typecheck`, `pnpm test` (58 tests), and `pnpm lint` all pass.
- Status: T018 and T020 complete; P4 remains in progress. The SC-005 recording boundary is encoded; exact G4 signal computation and accessibility/withdrawal behavior remain with T019/T021. No blocker.

## NEXT
- Complete T019 and its minimal T021 implementation: add the exact G4 `summarizeSignals` golden and safety/withdrawal contracts, then implement the pure separated-signal projection.
- Acceptance: G4 deep-equals exactly; prompted return adds zero voluntary signal; prompt/context values never enter `familiesPresent`; assistive retagging is identical; `familyContext` contributes zero; withdrawn `e7` removes scope authorship; package compilation, `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green.

## 2026-07-20 — P4 / T019 + T021
- Added five `summarizeSignals` contracts covering exact G4 equality, prompted/context isolation, paired assistive equivalence, withdrawn optional-reflection exclusion, and the event-only parent-context boundary.
- Confirmed the test-first red state: the focused suite failed to resolve the absent `src/signals.ts`, then passed all five tests after the minimal implementation.
- Implemented one-pass separated signal projection with exact 7/30-day voluntary horizons, fixed family ordering, prompted context as a non-family discount, accessibility-neutral evidence tags, and withdrawn-event exclusion.
- Verified the focused suite (5 tests), package suite (44 tests), forced package compiler, `pnpm typecheck`, `pnpm test` (63 tests), and `pnpm lint` all pass.
- Status: T019 and T021 complete; P4 remains in progress pending the public API export. SC-005, SC-006, SC-007, and SC-015 signal-summary contracts are green. No blocker.

## NEXT
- Complete T022: export `recordEvent` and `summarizeSignals` explicitly from `packages/interest-lab/src/index.ts` and extend the consumer-facing public API test.
- Acceptance: consumers can import both P4 functions from `@gt100k/interest-lab`; preserve a failing public-API red run before the minimal export change, and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-20 — P4 / T022
- Added a consumer-facing public API contract for `recordEvent` and `summarizeSignals`, then exposed both through explicit named entry-point exports.
- Confirmed the test-first red state: the focused suite received `undefined` for the missing function export, then passed all four public API tests after the minimal entry-point change.
- Verified the focused suite, forced package compiler, `pnpm typecheck`, `pnpm test` (64 tests), and `pnpm lint` all pass.
- Status: T022 and P4 complete. SC-005, SC-006, SC-007, and SC-015 remain green through the package public API. No blocker.

## NEXT
- Complete T023 and the minimal `evaluateCandidateGate` portion of T028 in `packages/interest-lab/test/state-machine.test.ts` and `packages/interest-lab/src/state-machine.ts`.
- Acceptance: all five G5 rows deep-equal the pinned eligibility and ordered `missing` outcomes, including novelty's exact three reasons, competence-only's delayed-discretionary reason, no-artifact's artifact/competence reason, and the two eligible cases; preserve a focused red run and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-20 — P5 / T023 + partial T028
- Added a five-row `evaluateCandidateGate` acceptance table covering the exact G5 G4, novelty, competence-only, no-artifact, and minimal-pass outcomes.
- Confirmed the test-first red state: the focused suite failed because `src/state-machine.ts` did not exist, then passed all five cases after the minimal evaluator implementation.
- Implemented the pure fixed promotion gate over distinct signal families, preserving the pinned missing-reason text and order; later lifecycle behavior from T024–T025 remains unimplemented.
- Verified the focused suite, forced package compiler, `pnpm typecheck`, `pnpm test` (69 tests), and `pnpm lint` all pass.
- Status: T023 complete; T028 is partial; P5 remains in progress. SC-003, SC-004, and SC-011 candidate-gate outcomes are green. No blocker.

## NEXT
- Complete T024 and the minimal `applyMissingData` portion of T028 in `packages/interest-lab/test/state-machine.test.ts` and `packages/interest-lab/src/state-machine.ts`.
- Acceptance: a missing-data window appends a versioned recorded no-op with state and uncertainty unchanged, and low-interest inference is refused unless a human has ruled out access, health, schedule, equipment, and consent causes per G6/IL-009; preserve a focused red run and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-20 — P5 / T024 + partial T028
- Added the exact G6 missing-data contract over an operative synthetic `EMERGING` revision, proving a new version is recorded while state and moderate-grade uncertainty remain unchanged and no `PARKED` inference occurs.
- Confirmed the test-first red state: the five existing candidate-gate cases passed while the new case failed because `applyMissingData` was absent, then all six focused cases passed after implementation.
- Implemented `applyMissingData` as a pure versioned no-op with no wall-clock read, mutation, low-interest inference, or new unpinned rule-out payload.
- Corrected the synthetic test fixture to use the fixed `build` work-mode verb after the package compiler rejected a domain label in `workModeProfile`.
- Verified the forced package compiler, `pnpm typecheck`, `pnpm test` (70 tests), and `pnpm lint` all pass.
- Status: T024 complete; T028 remains partial; P5 remains in progress. SC-010's exact G6 missing-data prohibition is green. No blocker.

## NEXT
- Complete T025 and the remaining lifecycle portion of T028 in `packages/interest-lab/test/state-machine.test.ts` and `packages/interest-lab/src/state-machine.ts`.
- Acceptance: `proposeTransition` produces a RULE shadow proposal with `guideReview:null` and `operative:false`; `authorRevision` produces an operative guide-authored version increment; illegal transitions name the rejected pair; `CONTESTED→PARKED→REOPENED` remains legal; preserve a focused red run and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-20 — P5 / T025 + T028
- Added four lifecycle acceptance contracts covering exact shadow proposal fields, guide-authored operative versioning, named illegal-pair rejection, candidate-gate enforcement on authorship, and the legal `CONTESTED→PARKED→REOPENED` branch.
- Confirmed the test-first red states: the focused suite first failed on the absent proposal/authorship functions, then the strengthened branch test failed at `CONTESTED→CANDIDATE_SPINE` until explicit legal targets were supported.
- Implemented the complete fixed 19-pair transition table, shadow-only RULE/SHADOW_MODEL proposals, guide-only operative authorship, G5 revalidation for candidate promotion, and version/provenance-preserving branch traversal.
- Verified the focused lifecycle suite (10 tests), forced package compiler, `pnpm typecheck`, `pnpm test` (74 tests across 17 files), and `pnpm lint` (62 files) all pass.
- Status: T025 and T028 complete; P5 remains in progress. SC-009 is green, and SC-016's legal lifecycle path is green while append-only repository replay remains with T027/T030. No blocker.

## NEXT
- Complete T026 and its minimal T029 implementation in `packages/interest-lab/test/hypothesis.test.ts` and `packages/interest-lab/src/hypothesis.ts`.
- Acceptance: tests first prove append-only versioned and bitemporal current-view behavior, interval/grade uncertainty without a scalar, paired supporting/disconfirming evidence, valid co-primary candidate domains, and retention of both `DISAGREE` child position and model evidence; preserve a focused red run and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-20 — P5 / T026 + T029
- Added five hypothesis-record acceptance tests covering immutable append, operative/shadow version rules, bitemporal replay, interval/grade uncertainty, paired supporting/disconfirming evidence, co-primary candidates, and preserved child/model disagreement.
- Confirmed the test-first red state: all five focused tests failed because the three hypothesis helpers were absent, then passed after the minimal implementation.
- Implemented pure `createHypothesis`, `appendRevision`, and `currentFor` helpers with identity/authorship validation, monotonic operative versions and record time, non-scalar uncertainty validation, shadow exclusion, and explicit valid-time/record-time views without wall-clock access.
- Self-reviewed the T026/T029 clauses and corrected formatter feedback plus strict runtime grade validation; no critical or important issue remained.
- Verified the focused suite (5 tests), forced package compiler, `pnpm typecheck`, `pnpm test` (79 tests across 18 files), and `pnpm lint` (63 files) all pass.
- Status: T026 and T029 complete; P5 remains in progress. SC-013 and SC-014 are green, and IL-006/IL-012 hypothesis replay behavior is encoded. No blocker.

## NEXT
- Complete T027 and its minimal T030 implementation in `adapters/interest-repo-memory/test/repo.test.ts` and `adapters/interest-repo-memory/src/index.ts`.
- Acceptance: tests first prove append-only deep-copy-on-write storage, `load`/`currentFor` isolation, full revision replay by version, and the operative `CONTESTED→PARKED→REOPENED` chain with no overwritten revision; preserve a focused red run and keep adapter/package compilation, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-20 — P5 / T027 + T030
- Added three repository contracts covering empty reads, full version replay for the operative `CONTESTED→PARKED→REOPENED` chain, and nested mutation isolation across append, `load`, `currentFor`, and `revisions` boundaries.
- Confirmed the test-first red state: the focused adapter suite failed to resolve the absent `src/index.ts`, then passed all three contracts after the minimal implementation.
- Implemented `InMemoryInterestHypothesisRepository` as append-only revision storage with deterministic learner lookup and deep copies on every write/read; bitemporal current-revision selection remains in the pure domain helper.
- Corrected the single formatter-reported import layout and reran the complete gate.
- Verified the forced adapter compiler, focused suite (3 tests), `pnpm typecheck`, `pnpm test` (82 tests across 19 files), and `pnpm lint` (65 files) all pass.
- Status: T027 and T030 complete; P5 remains in progress pending T031. SC-016's lifecycle traversal and repository replay are green. No blocker.

## NEXT
- Complete T031: export the hypothesis constructors/current-view helpers and state-machine API explicitly from `packages/interest-lab/src/index.ts`.
- Acceptance: a consumer-facing test imports `createHypothesis`, `appendRevision`, `currentFor`, `evaluateCandidateGate`, `applyMissingData`, `proposeTransition`, and `authorRevision` from `@gt100k/interest-lab`; preserve a failing public-API red run and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-20 — P5 / T031
- Added a consumer-facing public API contract for all seven hypothesis/lifecycle functions, the fixed legal-transition table, and their named parameter/return types.
- Confirmed the test-first red state: the new P5 public API case failed while all four earlier API cases passed, then passed after the explicit entry-point exports were added.
- Exported the hypothesis constructors/current-view helpers and complete state-machine surface without changing domain behavior or adding wildcard re-exports.
- Reproduced and corrected the single Biome import-order finding, then reran the complete gate.
- Verified the focused public API suite (5 tests), forced package compiler, `pnpm typecheck`, `pnpm test` (83 tests across 19 files), and `pnpm lint` (65 files) all pass.
- Status: T031 and P5 complete. SC-003/004/009/010/011/013/014/016 remain green through the package public API. No blocker.

## NEXT
- Complete T032 and its minimal T034 guard/stub implementation in `packages/interest-lab/test/guards.test.ts`, `packages/interest-lab/src/guards.ts`, and the assent/artifact stub adapters.
- Acceptance: tests first deny all five forbidden read purposes with an auditable denial, reject individual team-artifact credit without solo proof, reject raw artifact payloads while accepting coarse transitions, and cover assent withdrawal plus coarse-only artifact-source behavior; preserve focused red evidence and keep adapter/package compilation, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-20 — P6 / T032 + T034
- Added 18 guard and adapter contracts covering all five auditable forbidden-purpose denials, all three accepted solo-proof paths, no-proof refusal, three prohibited raw artifact fields, exact coarse-transition acceptance, learner-scoped withdrawal, and validated finite artifact emission.
- Confirmed the test-first red state: the guard suite failed on absent public exports and both adapter suites failed to resolve their absent source modules, then all focused contracts passed after the minimal implementation.
- Implemented the pure fail-closed guard layer, structured errors/audit data, strict artifact-transition allowlist, idempotent synthetic assent-withdrawal stub, and coarse-only artifact source; exported the complete guard API explicitly.
- Self-reviewed every T032/T034 clause and corrected the two formatter-only findings from the first lint pass; no critical or important issue remained.
- Verified the forced package/adapter compiler, `pnpm typecheck`, `pnpm test` (101 tests across 22 files), and `pnpm lint` (71 files) all pass.
- Status: T032 and T034 complete; P6 remains in progress pending T033. SC-008, SC-012, PASS-007, and the PASS-008 withdrawal port boundary are green. No blocker.

## NEXT
- Complete T033: add `packages/interest-lab/test/acceptance.test.ts` mapping spec §14.4.3 #1–#7 end-to-end over the in-memory and stub adapters.
- Acceptance: all seven scenarios pass through public APIs/adapters, including withdrawn `e7` disappearing from both the next signal summary and replay; preserve a focused red run and keep package/adapter compilation, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-20 — P6 / T033
- Added seven independently named §14.4.3 acceptance scenarios spanning the public domain API and all four synthetic adapters: novelty gating, low-skill recovery, explicit gaps, prompted/discretionary separation, rules-only balance, withdrawal/replay, and accessibility equivalence.
- Proved the new suite's failure sensitivity with a controlled withdrawal-guard mutation: scenario #6 failed with `scopeAuthorship: 1`, then all seven tests passed after restoration; no production change was required.
- Kept the domain project graph acyclic by runtime-loading typed adapter entry points from relative file URLs in the integration test only.
- Verified the five feature projects compile, then ran `pnpm typecheck`, `pnpm test` (108 tests across 23 files), and `pnpm lint` (72 files); all pass.
- Status: T033 and P6 complete. SC-001 through SC-007 are now covered together at the acceptance boundary; all Part-I SC contracts remain green. No blocker.

## NEXT
- Complete T035: add `packages/interest-lab/README.md` documenting the public API and injected ports, mirroring `packages/learning-loop/README.md`.
- Acceptance: the README clearly states rules-engine-only MVP, deferred bandit/Bayesian components, synthetic-only operation, and the prohibition on scalar passion scores; `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green.

## 2026-07-21 — P7 / T035
- Added `packages/interest-lab/README.md` with a verified `buildLab` example, grouped public API, injected-port responsibilities, current adapter/fixture mappings, and development commands.
- Documented the pinned scope boundaries: rules-engine-only MVP, deferred contextual bandit and learned Bayesian model, synthetic-only operation, catalog-driven domains, guide-authored operative revisions, and no scalar passion score.
- Confirmed the documentation contract's red state against the missing README, then checked every documented runtime symbol and adapter package name against the implemented entry points.
- Verified the forced package compiler, package suite (81 tests), `pnpm typecheck`, `pnpm test` (108 tests across 23 files), and `pnpm lint` (72 files) all pass.
- Status: T035 complete; P7 remains in progress. All Part-I success criteria remain green. No blocker.

## NEXT
- Complete T036: add a deterministic synthetic demo under `adapters/interest-probe-catalog` or `packages/interest-lab` that exercises the public domain API.
- Acceptance: the demo builds the golden Lab, summarizes `EVENTS_GOLDEN_V1`, and prints the coverage matrix plus a proposed-versus-guide-authored hypothesis transition; preserve a focused red run and keep package/adapter compilation, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-21 — P7 / T036
- Added a deterministic `@gt100k/interest-probe-catalog` demo script that builds the 20-offer golden Lab, summarizes the exact ten-event G4 stream, and prints G2 coverage plus shadow-proposed versus guide-authored transition views as stable JSON.
- Added two adapter contracts for the exact Lab, coverage, signal, lifecycle, and printable-output values; confirmed the focused red state on the absent demo module before the implementation made both tests pass.
- Promoted `EVENTS_GOLDEN_V1` to the domain package's named public API while preserving its original package-local test-fixture import path, avoiding both fixture duplication and a reversed domain-to-adapter dependency.
- Exercised `pnpm --filter @gt100k/interest-probe-catalog demo` successfully, forced both changed TypeScript projects to compile, and verified `pnpm typecheck`, `pnpm test` (110 tests across 24 files), and `pnpm lint` (76 files) all pass.
- Status: T036 complete; P7 remains in progress pending the final shared-root reconciliation and verification tasks. All Part-I success criteria remain green. No blocker.

## NEXT
- Complete T037 as its own reviewable increment: add `packages/interest-lab` and all four `adapters/interest-*` projects to the root `tsconfig.json` references array, the one permitted shared-root edit.
- Acceptance: `tsc -b` compiles all five feature projects through the root graph, with `pnpm typecheck`, `pnpm test`, and `pnpm lint` green; explicitly preserve the shared-file reconciliation note for the harness.

## 2026-07-21 — P7 / T037
- Added `packages/interest-lab` and the four `adapters/interest-*` projects to the root TypeScript project-reference graph in the task's only permitted shared-root edit.
- Confirmed the configuration contract's red state first: all five exact paths were reported missing, then the same assertion passed with each path present exactly once after the edit.
- Forced the complete graph through `pnpm exec tsc -b --force`, then verified `pnpm typecheck`, `pnpm test` (110 tests across 24 files), and `pnpm lint` (76 files) all pass.
- Human reconciliation flag: `tsconfig.json` is the expected shared-file merge point; preserve all concurrent project references when reconciling this increment.
- Status: T037 complete; P7 remains in progress pending T038's final Part-I verification. All Part-I success criteria remain green. No blocker.

## NEXT
- Complete T038: run the final Part-I verification exactly as ordered after the root project references landed.
- Acceptance: `pnpm --filter @gt100k/interest-lab test`, `pnpm test`, `pnpm typecheck`, and `pnpm lint` all pass from the repository root; record the final Part-I SC status without beginning Part II in the same increment.

## 2026-07-21 — P7 / T038
- Ran the final Part-I verification after the five feature projects entered the root TypeScript reference graph.
- Verified `pnpm --filter @gt100k/interest-lab test` (81 tests across 15 files), `pnpm test` (110 tests across 24 files), `pnpm typecheck`, and `pnpm lint` (76 files); all pass with zero failures or findings.
- Status: T038, P7, and Part I complete. SC-001 through SC-016 are green at their unit, contract, golden, smoke, adapter, and §14.4.3 acceptance boundaries. No blocker.
- The whole feature remains in progress because Part II UI tasks U001 onward are not yet implemented; `.loop-done` was not created.

## NEXT
- Complete U001: scaffold `packages/interest-lab-view/package.json` with the pinned ESM entry points, `vitest run` test script, and `@gt100k/interest-lab: workspace:*` dependency, mirroring the domain package.
- Acceptance: the new GPU-free view package manifest contains no `three` or `react` dependency, resolves the Part-I workspace dependency, and leaves `pnpm typecheck` plus `pnpm test` green.

## 2026-07-21 — P8 / U001
- Scaffolded `@gt100k/interest-lab-view` with the pinned private ESM entry points, `vitest run` test script, and sole runtime dependency on `@gt100k/interest-lab: workspace:*`.
- Confirmed the contract-first red state: the exact manifest assertion failed because `packages/interest-lab-view/package.json` was absent, then passed after the minimal manifest was added.
- Resolved the domain workspace link via `pnpm install --lockfile=false`, preserving the shared root lockfile policy and adding no React, Three.js, or react-three dependencies.
- Verified `pnpm typecheck`, `pnpm test` (110 tests across 24 files), and `pnpm lint` (77 files) all pass.
- Status: U001 complete; P8 remains in progress. Part-I SC-001 through SC-016 remain green; Part-II success criteria are not yet started. No blocker.

## NEXT
- Complete U002: add `packages/interest-lab-view/tsconfig.json` extending `../../tsconfig.base.json` with `rootDir: "."`, `outDir: "dist"`, and includes for `src/**/*.ts` plus `test/**/*.ts`.
- Acceptance: the view package TypeScript project compiles independently without a shared-root reference, and `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green.

## 2026-07-21 — P8 / U002
- Added `packages/interest-lab-view/tsconfig.json` with the exact pinned base config, root/output directories, and source/test includes.
- Confirmed the contract-first red state: the independent build first failed with TS5083 while the config was absent, then exposed TS18003 because U001 had created no included TypeScript input.
- Added a module-only `src/index.ts` scaffold so the package compiles without preempting U003's types or U005's explicit public exports; recorded the sequencing choice in D025.
- Verified the forced package-local compiler, `pnpm typecheck`, `pnpm test` (110 tests across 24 files), and `pnpm lint` (79 files) all pass.
- Status: U002 complete; P8 remains in progress. Part-I SC-001 through SC-016 remain green; Part-II success criteria are not yet started. No blocker.

## NEXT
- Complete U003: define all DOM, 3D scene, evidence-constellation, and composed view types in `packages/interest-lab-view/src/model.ts` exactly as specified by the Part-II data model.
- Acceptance: compile-time tests encode the complete U003 type surface while forbidding `score`, `confidence`, `passionScore`, `verdict`, `label`, `rank`, `percentile`, `outOf`, and `price` fields; the package-local compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green.

## 2026-07-21 — P8 / U003
- Added the complete plain-data view type surface for child cards, deterministic 3D scenes, guide coverage/explanations/timeline/lifecycle/history, evidence constellation, and the composed two-surface `InterestLabView`.
- Reused Part-I domain types through type-only imports, represented 3D geometry as numeric tuples, and added exact structural contracts for the future palette, typography, scene, and camera registries without introducing runtime behavior or framework/GPU dependencies.
- Added four compile-time contract groups plus a recursive forbidden-key assertion covering every U003 view model; confirmed the red state with the package TypeScript build failing on the absent `model.ts`, then the green state after the minimal type implementation.
- Resolved the companion-data-model `label` conflict in favor of canonical D-U4/U003 by using `title` for renderable display copy; recorded the rationale in D026.
- Verified the forced package compiler, `pnpm typecheck`, `pnpm test` (114 tests across 25 files), and `pnpm lint` (81 files) all pass. A final static audit found every required U003 type and no explicit forbidden fields or React/Three imports.
- Status: U003 complete; P8 remains in progress. Part-I SC-001 through SC-016 remain green; the Part-II structural guardrail foundation is encoded, while SC-UI acceptance behavior begins in later phases. No blocker.

## NEXT
- Complete U004: add the exact value-only `PALETTE`, `TYPOGRAPHY`, `HUE_RAMP`, `MOTION`, `EASINGS`, `WORK_MODE_GLYPHS`, `SCENE3D`, `CAMERA3D`, `QUALITY_TIERS`, and `RENDER_TIERS` registries in their four specified modules.
- Acceptance: registry tests first pin every §U8.2–§U8.6, §U8.14, and §U8.16 value without implementing later resolvers; the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green.

## 2026-07-21 — P8 / U004
- Added the ten exact §U8 value registries across the four responsibility-focused modules: art, motion, glyphs, and GPU-free scene constants.
- Added six registry contracts pinning every palette, typography, hue, duration, easing, work-mode glyph, scene, camera, render-tier, and quality-tier value; confirmed the focused red state on the absent modules before implementation.
- Kept the increment value-only: no resolver behavior or public entry-point export was pulled forward from U005/U014/U023.
- Verified the focused suite (6 tests), forced view-package compiler, `pnpm typecheck`, `pnpm test` (120 tests across 26 files), and `pnpm lint` (86 files) all pass.
- Status: U004 complete; P8 remains in progress. Part-I SC-001 through SC-016 remain green; Part-II golden registry inputs are encoded, while SC-UI behavior remains with later phases. No blocker.

## NEXT
- Complete U005: replace the module-only `packages/interest-lab-view/src/index.ts` scaffold with explicit named exports for the complete U003 type surface and all U004 registries added so far.
- Acceptance: a consumer-facing test imports all public view types and ten registries through `@gt100k/interest-lab-view`, with no wildcard exports or premature resolver exports; the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green.

## 2026-07-21 — P8 / U005
- Added a consumer-facing entry-point contract covering all 35 U003 view-model types and the exact ten U004 runtime registries.
- Confirmed the test-first red state at both boundaries: the focused runtime test received an empty export set, and the package compiler reported every missing type export before implementation.
- Replaced the module-only entry point with explicit named value and type exports, without wildcard exports or premature resolver behavior.
- Verified the focused public API suite (2 tests), forced view-package compiler, `pnpm typecheck`, `pnpm test` (122 tests across 27 files), and `pnpm lint` (87 files) all pass.
- Status: U005 complete; P8 remains in progress. Part-I SC-001 through SC-016 remain green; Part-II success-criteria behavior begins in later phases. No blocker.

## NEXT
- Complete U006: add the seeded package smoke in `packages/interest-lab-view/test/smoke.test.ts` and the smallest temporary `resolveMotion` implementation needed for the green-only harness boundary.
- Acceptance: package imports expose non-empty `PALETTE`, `MOTION`, `EASINGS`, `HUE_RAMP`, `WORK_MODE_GLYPHS`, `SCENE3D`, `CAMERA3D`, and `QUALITY_TIERS`, while `resolveMotion("press", { reducedMotion: false }).durationMs === 120`; preserve a focused red run and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-21 — P8 / U006
- Added the seeded package smoke covering all eight required public registries and the exact 120 ms animated press duration.
- Confirmed the test-first red state from the repository Vitest root: the smoke and public-API contract both failed because `resolveMotion` was absent, then passed after the minimal press-row implementation and explicit export.
- Kept the temporary resolver honest and narrow: it accepts only the U006-pinned `press` plus `reducedMotion:false` case; U010/U014 remain responsible for widening it to the complete animated/reduced motion table.
- Verified the focused suite (3 tests), forced view-package compiler, `pnpm typecheck`, `pnpm test` (123 tests across 28 files), and `pnpm lint` (88 files) all pass.
- Status: U006 complete; P8 remains in progress. Part-I SC-001 through SC-016 remain green; Part-II motion acceptance SC-UI-08 remains assigned to U010/U014. No blocker.

## NEXT
- Complete U007: scaffold `apps/interest-lab/package.json` with the pinned Next 14, React 18, Motion 12, Three.js, react-three-fiber 8, and drei 9 dependency lines plus both Interest Lab workspace packages.
- Acceptance: the manifest mirrors the existing Next app scripts and exact pinned dependency ranges, both workspace dependencies resolve, no optional post-processing dependency is added early, and the repository `pnpm typecheck`, `pnpm test`, and `pnpm lint` gate remains green.

## 2026-07-21 — P8 / U007
- Scaffolded `@gt100k/interest-lab-app` with the existing Next app scripts, both Interest Lab workspace dependencies, and the exact pinned Next 14, React 18, Motion 12, Three.js 0.169, react-three-fiber 8, drei 9, and type dependency ranges.
- Confirmed the contract-first red state: the exact manifest assertion failed because `apps/interest-lab/package.json` was absent, then passed after the minimal manifest was added.
- Resolved both workspace links and all pinned runtime packages with `pnpm install --lockfile=false`, preserving the shared root lockfile; kept the optional P14 post-processing dependencies absent.
- Verified `pnpm typecheck`, `pnpm test` (123 tests across 28 files), `pnpm lint` (89 files), and the repository `pnpm build`; all pass. Independent review found no Critical, Important, or Minor issues.
- Status: U007 complete; P8 remains in progress. Part-I SC-001 through SC-016 and the existing Part-II view-package gate remain green; app-local build acceptance begins after U008/U009 provide the Next config and App Router shell. No blocker.

## NEXT
- Complete U008: add `apps/interest-lab/next.config.mjs` with both workspace packages in `transpilePackages` and `apps/interest-lab/tsconfig.json` mirroring `apps/student-compass/tsconfig.json`.
- Acceptance: the app config preserves Next 14 App Router compilation settings, TypeScript uses `noEmit`, `jsx: "preserve"`, and DOM libs, and `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green without a shared-root edit.

## 2026-07-21 — P8 / U008
- Added the Interest Lab Next config with the two exact TypeScript-source workspace packages in `transpilePackages` and a TypeScript config matching `apps/student-compass` exactly.
- Confirmed the contract-first red state: the exact config assertion failed with `ENOENT` while `apps/interest-lab/tsconfig.json` was absent, then passed after the two minimal files were added.
- Preserved the pinned Next App Router compiler shape (`noEmit`, `jsx: "preserve"`, DOM libraries, bundler resolution, and the Next plugin) without editing any shared-root file.
- Verified the focused configuration contract, `pnpm typecheck`, `pnpm test` (123 tests across 28 files), `pnpm lint` (90 files), and the repository `pnpm build`; all pass.
- Status: U008 complete; P8 remains in progress pending U009's App Router shell. Part-I SC-001 through SC-016 and the existing Part-II view-package gate remain green. No blocker.

## NEXT
- Complete U009: add the Interest Lab App Router placeholder shell, exact palette/typography CSS properties and accessibility media rules, public environment example, and app-local ignore file.
- Acceptance: the placeholder app uses all pinned §U8.2/§U8.3 tokens, reduced-motion/reduced-transparency/plain/focus treatments, documents every §U11 `NEXT_PUBLIC_*` setting including `NEXT_PUBLIC_RENDER_TIER=auto`, ignores `.env.local` and `.next`, and passes the app build plus `pnpm typecheck`, `pnpm test`, and `pnpm lint`.

## 2026-07-21 — P8 / U009
- Added the App Router layout and static Curiosity Atelier placeholder shell with semantic landmarks, a keyboard-visible skip link, synthetic-only copy, and no client component or premature domain/view behavior.
- Added every exact §U8.2 palette and §U8.3 typography value as CSS custom properties, including all scale rows and system fallback stacks; the five pinned foreground/background pairs measure 7.97:1–16.39:1.
- Added responsive dusk styling, color-plus-shape cues, `--focus` rings, reduced-motion, reduced-transparency, high-contrast, and `.plain-mode` treatments; kept the mandated nonstandard transparency preference behind one line-local Biome suppression.
- Added all five non-secret §U11 public defaults, ignored the real `.env.local` and `.next`, and explicitly re-included `.env.local.example` against the root `.env.*` policy so the harness can track it. The Next build generated the standard app-local `next-env.d.ts`.
- Confirmed the contract-first red state with all five U009 artifacts missing, then verified the complete artifact/token/env contract, exact WCAG contrast ratios, and the production HTTP shell response after implementation.
- Verified `pnpm typecheck`, `pnpm test` (123 tests across 28 files), `pnpm lint` (93 files), and `pnpm --filter @gt100k/interest-lab-app build`; all pass. The `/` route is statically prerendered.
- Status: U009 and P8 complete. Part-I SC-001 through SC-016 remain green; the Part-II foundation gate is green, and behavioral SC-UI acceptance begins in P9. No blocker.

## NEXT
- Complete U010: add `packages/interest-lab-view/test/motion.test.ts` with the complete §U8.4 animated and reduced-motion golden table before widening the temporary resolver.
- Acceptance: every DOM and 3D motion kind has an exact reduced equivalent with `mode:"reduced"`, `easing:"linear"`, and the pinned reduced duration; `pick` is the only spring, no reveal uses `scale(0)`, the focused suite records a genuine red failure, and the package compiler plus `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green after the paired minimal U014 implementation.

## 2026-07-21 — P9 / U010 + partial U014
- Added the complete §U8.4 motion acceptance table for all 25 DOM and 3D kinds, including exact animated easing/duration values and every reduced-motion equivalent.
- Confirmed the test-first red state: three focused cases failed because the P8 resolver hardcoded the animated press token, ignored reduced motion, and exposed no pick spring; the suite passed after the minimal resolver implementation.
- Replaced the temporary press-only resolver with a typed deterministic table, preserving `pickSpring` as the sole spring token and mapping reduced motion to linear static/short-crossfade equivalents without introducing transform instructions.
- Verified the focused motion suite (4 tests), forced view-package compiler, `pnpm typecheck`, `pnpm test` (127 tests across 29 files), and `pnpm lint` (94 files) all pass.
- Status: U010 complete; U014 is partial pending `resolveDomainHue`. SC-UI-08 and UI-FR-010 are green at the pure view-package boundary. No blocker.

## NEXT
- Complete U011: add `packages/interest-lab-view/test/art.test.ts` for the exact §U8.2/§U8.3 palette/typography and §U8.5 catalog-order hue behavior before completing U014.
- Acceptance: tests pin all contrast guarantees, the eight golden seed-domain hues, deterministic catalog-order derivation, and an unknown-domain throw; preserve a genuine focused red run, then implement/export only the minimal `resolveDomainHue` needed to restore the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` gate.

## 2026-07-21 — P9 / U011 + U014
- Added six art acceptance contracts pinning the exact palette and typography registries, all five WCAG contrast guarantees, the eight seed-domain hues, catalog reordering, 12-color wraparound, and unknown-domain rejection.
- Confirmed the test-first red state at both boundaries: the focused art and public-API suites failed on the absent resolver/export, then an intermediate catalog-order implementation left only the unknown-domain rejection red before the final guard.
- Implemented and exported pure `resolveDomainHue` with catalog-order lookup, modulo ramp selection, and an explicit absent-domain error; no fixed domain taxonomy or state semantics were introduced.
- Verified the focused art/public-API suites (8 tests), forced view-package compiler, `pnpm typecheck`, `pnpm test` (133 tests across 30 files), and `pnpm lint` (95 files) all pass.
- Status: U011 and U014 complete; P9 remains in progress. SC-UI-08, SC-UI-09, UI-FR-010, UI-FR-011, and UI-FR-020 are green at the pure view-package boundary. No blocker.

## NEXT
- Complete U012 and its minimal U015 implementation: add the exact child-staging golden contracts in `packages/interest-lab-view/test/staging.test.ts`, then implement and export `resolveChildStaging`.
- Acceptance: all three age bands match §U8.7 including `worldCameraMode`; the 6-8 band has `showRawNumbers:false`, `comparisonDefault:"off"`, and `worldCameraMode:"auto-tour"`; presentation changes do not alter underlying state; preserve a genuine focused red run and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-21 — P9 / U012 + U015
- Added four child-staging contracts covering the exact §U8.7 values for all three age bands, the pinned 6-8 safeguards, presentation-only function boundary, and deterministic resolution.
- Confirmed the test-first red state twice: the initial focused suite failed because the resolver was absent, then the tightened staging/public-API run produced five explicit contract assertion failures before implementation.
- Implemented and exported pure `resolveChildStaging` with the exact presentation table and fresh returned values; no domain state, wall clock, framework, or GPU dependency was introduced.
- Verified the focused staging/public-API suites (6 tests), forced view-package compiler, focused Biome check, `pnpm typecheck`, `pnpm test` (137 tests across 31 files), `pnpm lint` (97 files), and the Interest Lab production build; all pass.
- Status: U012 and U015 complete; P9 remains in progress. SC-UI-02 and UI-FR-005 are green at the pure staging boundary; whole-view age-band parity remains independently covered by U046. No blocker.

## NEXT
- Complete U013 with its minimal U016 implementation: add the exact `buildProbePickerView` structural golden in `packages/interest-lab-view/test/probe-picker.test.ts`, then implement and export the pure picker projection.
- Acceptance: G1 yields 20 RULE-provenance cards with non-empty band-appropriate `whyCopy`, catalog-order hue and fixed work-mode glyph, `returnState:"new"`, `helpAffordance:true`, and at least two eligible choices; forbidden price/score/rank/percentile/verdict/label keys remain absent, the focused suite records a genuine red failure, and the package compiler plus `pnpm typecheck`, `pnpm test`, and `pnpm lint` remain green.

## 2026-07-21 — P9 / U013 + U016
- Added four picker acceptance contracts over a synthetic G1 Lab: exact 20-card offer order, catalog-order hues, fixed work-mode glyphs, RULE provenance, non-empty band-aware copy, fresh-history state, always-present help, age-band visible slices, reduced-motion tokens, provenance-truthful GUIDE/SHADOW_MODEL copy, and all six forbidden card keys absent.
- Confirmed the test-first red state twice: all picker/public-API cases first failed on the absent function/export, then the review-added provenance case failed because GUIDE copy was incorrectly described as a rule before the mapping was corrected.
- Implemented and exported pure `buildProbePickerView`, composing existing art, glyph, motion, and staging resolvers without React, Three.js, I/O, wall-clock access, randomization, fixed domain mappings, or learning-rule recomputation. Non-empty return-history interpretation remains deliberately assigned to U030/U031.
- Fixed the view package's scoped test script after the fresh gate exposed root-relative test discovery: added the same package-local `test/**/*.test.ts` Vitest config used by `@gt100k/interest-lab`, with no shared-root edit.
- Verified the view package suite (31 tests), forced view-package compiler, `pnpm typecheck`, `pnpm test` (141 tests across 32 files), `pnpm lint` (100 files), and the Interest Lab production build; all pass.
- Status: U013 and U016 complete; P9 remains in progress. SC-UI-01 and UI-FR-002/UI-FR-017 are green at the pure picker boundary. No blocker.

## NEXT
- Complete U017: add the first pure `buildInterestLabView` child-surface composition in `packages/interest-lab-view/src/view.ts` and export it.
- Acceptance: tests first prove the builder composes the child `ProbePickerView` with `surface:"child"`, caller flags, and derived presentation without recomputing domain state; the scene block remains deferred to P9b, and the view package compiler, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and Interest Lab app build remain green.

## 2026-07-21 — P9 / U017
- Added focused child-view and public-API contracts proving exact child surface/flag composition, `board-2d` presentation tokens, reduced motion delegation, picker reuse, absence of premature scene/guide blocks, and an unchanged input Lab.
- Confirmed the test-first red state: both child cases failed because `buildInterestLabView` was absent, and the public-API suite independently reported its missing runtime export before implementation.
- Implemented and exported the pure phased child builder plus named input/output types; it delegates domain projection to `buildProbePickerView`, derives motion from caller flags, and keeps P9b/P13 scene and guide work deferred.
- Verified the view package suite (33 tests across 9 files), forced view-package compiler, `pnpm typecheck`, `pnpm test` (143 tests across 33 files), `pnpm lint` (102 files), and the Interest Lab production build; all pass.
- Status: U017 complete; P9 remains in progress. SC-UI-01/02/08/09 remain green, and UI-FR-001/019 now have their first child-only composition boundary; final cross-tier/guide parity remains with U024/U041/U046. No blocker.

## NEXT
- Complete U018: add the synthetic app seed, Motion token hook, inline SVG glyph component, and client device-capability detector under `apps/interest-lab/app/`.
- Acceptance: the seed feeds `CATALOG_GOLDEN_V1` through Part-I `buildLab` and public `buildInterestLabView` with no external fetch; `useMotionToken` bridges `resolveMotion` with `motion/react` reduced-motion preference; `Glyph` renders work-mode/state SVGs without emoji; `deviceCaps` feature-detects client capabilities; `pnpm typecheck`, `pnpm test`, `pnpm lint`, and the Interest Lab production build remain green.

## 2026-07-21 — P9 / U018
- Added a deterministic synthetic seed factory that composes the normative catalog adapter, Part-I `buildLab`, and the public child-view builder with fresh-learner, seed-42, accessible `board-2d` defaults and no external fetch.
- Added the client-only `useMotionToken` bridge to `motion/react` reduced-motion preference, a typed inline-SVG library for all nine work modes plus reusable state cues, and fail-closed browser capability detection for WebGL, device memory, hardware concurrency, coarse pointer, and Save-Data.
- Added an app-local Vitest gate with ten contracts; confirmed the genuine red state on all four absent modules, then corrected the standalone TSX transform after its isolated classic-runtime failure.
- Added the catalog adapter as an explicit app workspace dependency/transpilation target rather than copying the normative fixture.
- Verified app tests (10), `pnpm typecheck`, `pnpm test` (143 tests across 33 files), `pnpm lint` (111 files), and `pnpm --filter @gt100k/interest-lab-app build`; all pass.
- Status: U018 complete; P9 remains in progress. SC-UI-01/02/08/09 and the synthetic-only UI boundary remain green; U019 owns the first operable 2D quest components. No blocker.

## NEXT
- Complete U019: implement `QuestLedger`, `QuestCard`, `Board2D`, and `QuestTray` from the existing `ProbePickerView` under `apps/interest-lab/app/child/`.
- Acceptance: every quest is an accessible keyboard-operable card button with visible focus, hue plus icon/text cues, provenance/why/help copy, hover/press feedback, and an interruptible pick spring into the tray; reduced motion uses an equal crossfade with no state loss; focused tests, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and the Interest Lab production build remain green.

## 2026-07-21 — P9 / U019
- Added five app contracts for ordered domain constellations, semantic pressed card-buttons, accessible names, hue/glyph/cue/help rendering, idempotent pick state, reversible tray items, and the exact entrance/hover/press/pick/reduced-motion tokens.
- Confirmed the genuine test-first red state: the focused suite failed to resolve all four absent child component modules, then passed after the minimal implementation.
- Implemented `QuestLedger`, `Board2D`, `QuestCard`, and `QuestTray` from the existing `ProbePickerView`: the ledger owns focus and pick state, cards retain visible icon+text cues and native help disclosure, and the tray mirrors reversible picks without recomputing domain state.
- Mapped the pinned CSS easing strings into Motion's typed bezier tuples at the app boundary; animated picks use the sole `pickSpring`, while reduced motion uses the exact 150ms linear crossfade and never `scale(0)`.
- Corrected the only production-build warning (`align-items:end` compatibility) and verified app tests (15), `pnpm typecheck`, `pnpm test` (143 tests across 33 files), `pnpm lint` (116 files), `pnpm --filter @gt100k/interest-lab-app build`, and `pnpm build`; all pass without warnings.
- Status: U019 complete; P9 remains in progress. SC-UI-01/02/08/09 remain green, and UI-FR-002/002b/003/012/013/015/017 now have their first operable 2D component boundary. No blocker.

## NEXT
- Complete U020: add `InterestLabClient` with the child view-model state, accessibility flags, age/surface/tier controls, and render the `board-2d` quest ledger from `app/page.tsx`.
- Acceptance: the page uses the synthetic seed with no external fetch; OS reduced-motion and detected device caps flow into one rebuilt view; age-band and plain/tier controls change presentation only; the child quest ledger is the operable default; focused tests, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and the Interest Lab production build remain green.

## 2026-07-21 — P9 / U020
- Added eight client-shell contracts covering fail-closed public defaults, OS/environment reduced-motion resolution, all required semantic controls, the exact 56/48/44px staged targets, child/2D default rendering, and App Router wiring.
- Confirmed two genuine red states: the focused suite first failed on the absent client/control modules, then the staged-target table failed for all three age bands before the controls consumed `resolveChildStaging`.
- Implemented `InterestLabClient` as the sole presentation-state owner: it detects client device capabilities, combines Motion's OS preference with the public default and user setting, rebuilds the synthetic child view for flag changes, and renders the existing operable ledger from `page.tsx`.
- Added responsive plain/age/surface/tier controls with truthful requested-versus-active tier status. The P9 renderer remains `board-2d`; future guide/3D requests do not fabricate state owned by U021–U024/U029/U042.
- Verified app tests (23), `pnpm typecheck`, `pnpm test` (143 tests across 33 files), `pnpm lint` (120 files), `pnpm build`, and the warning-free Interest Lab production build. A production-server smoke returned HTTP 200 with child/2D/auto flags and exactly six quest cards. No Playwright runtime is installed, so a real-browser walkthrough was unavailable; no code or dependency was changed to bypass that environment limitation.
- Status: U020 and P9 complete. SC-UI-01/02/08/09 remain green, and the accessible 2D MVP floor is now the app default. No implementation blocker.

## NEXT
- Complete U021 with the minimal U023 scene implementation needed to preserve the green-only harness boundary: add pure scene-layout, quest-placement, camera, and marker/card parity goldens in `packages/interest-lab-view/test/scene.test.ts`.
- Acceptance: the eight seed domains match §U8.13 positions within ±0.001 in catalog order; making's marker positions and §U8.14 home/focused camera modes match exactly; `buildSceneView` preserves marker/card parity by `probeId`; scene views expose no score/rank/price fields; focused red evidence and the complete green gate are preserved.

## 2026-07-21 — P9b / U021 + partial U023
- Added five GPU-free scene contracts covering the eight catalog-ordered island positions, deterministic reorder behavior, the pinned three-marker `making` placement, home/focused camera framing with reduced-motion cuts, and marker/card parity by `probeId` without scalar or ranking fields.
- Confirmed the genuine test-first red state: all five scene cases failed because the four scene functions were absent, and the exact public-API test reported the same missing exports; both focused suites passed after the minimal implementation.
- Implemented and publicly exported pure island layout, quest placement, camera framing, and `buildSceneView`; scene markers reuse the existing picker projection so provenance, copy, glyph, tone, and return state cannot drift from the accessible DOM cards.
- Recorded the focused-camera dependency default in D037, the normative §U8.13 prose/golden marker contradiction in D038, and the intentionally deferred full/lite/board tier table in D039. U022 retains a genuine red boundary for the dedicated tier resolvers.
- Verified `pnpm typecheck`, `pnpm test` (148 tests across 34 files), `pnpm lint` (121 files), `pnpm build`, and the warning-free Interest Lab production build; all pass.
- Status: U021 complete; U023 is partial; P9b remains in progress. SC-UI-13's layout, camera, determinism, structural guardrail, and card/marker parity contracts are green. No blocker.

## NEXT
- Complete U022 and the remaining render/quality-tier portion of U023 in `packages/interest-lab-view/test/tiers.test.ts` and `packages/interest-lab-view/src/scene.ts`.
- Acceptance: `resolveRenderTier` and `resolveQualityTier` match every §U8.16 full/lite/board golden, including weak memory, coarse pointer, reduced motion, plain mode, no WebGL, and Save-Data; `buildSceneView` consumes those resolvers; preserve focused red evidence and keep `pnpm typecheck`, `pnpm test`, `pnpm lint`, and the Interest Lab production build green.

## 2026-07-21 — P9b / U022 + U023
- Added eleven render/quality-tier contracts covering every §U8.16 full, lite, and board golden; exact default and threshold boundaries; and identical scene state across presentation tiers.
- Confirmed the genuine test-first red state: both resolver imports were absent for all golden cases, the public API lacked both exports, and the existing conservative scene policy returned `board-2d` instead of the required lite tier.
- Implemented and exported pure `resolveRenderTier` and `resolveQualityTier` with hard 2D fallbacks taking precedence over lite thresholds, then replaced the temporary P9b scene policy so `buildSceneView` delegates to the dedicated resolvers.
- Verified the view package suite (49 tests across 11 files), `pnpm typecheck`, `pnpm test` (159 tests across 35 files), `pnpm lint` (122 files), `pnpm build`, and the warning-free Interest Lab production build; all pass.
- Status: U022 and U023 complete; P9b remains in progress pending U024. SC-UI-14's exact resolver goldens and presentation-only scene parity are green. No blocker.

## NEXT
- Complete U024: extend `buildInterestLabView` in `packages/interest-lab-view/src/view.ts` to compose the deterministic scene and complete presentation blocks.
- Acceptance: tests first prove the child view includes `scene` plus derived `scene3d`, `camera3d`, `renderTier`, `quality`, and `motionOf` presentation values while underlying quest state remains unchanged; preserve focused red evidence and keep the package compiler, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and the Interest Lab production build green.

## 2026-07-21 — P9b / U024
- Extended the phased child `buildInterestLabView` composition with the deterministic `SceneView`, while keeping the guide block deferred to its owning phase.
- Confirmed the genuine test-first red state: the focused child-view suite received the temporary `board-2d`/board-quality presentation instead of the full tier and had no scene before the minimal implementation.
- Derived presentation `renderTier` and `quality` from the composed scene, preserving the shared Lab/history source, exact picker/scene parity, reduced-motion delegation, and immutable input Lab.
- Verified the view package suite (49 tests across 11 files), forced package compiler, `pnpm typecheck`, `pnpm test` (159 tests across 35 files), `pnpm lint` (122 files), `pnpm build`, and the warning-free Interest Lab production build; all pass.
- Status: U024 and P9b complete. SC-UI-13/14 and the scene/picker composition boundary are green; full cross-mode `plainViewEquals` remains assigned to U041/U046. No blocker.

## NEXT
- Complete U025: add `apps/interest-lab/app/child/world3d/glow-texture.ts` for the deterministic in-app additive radial-gradient marker halo.
- Acceptance: tests first prove the helper creates a repeatable `THREE.CanvasTexture` from an in-memory canvas with the pinned warm radial gradient and no external fetch; `pnpm typecheck`, `pnpm test`, `pnpm lint`, and both production builds remain green.

## 2026-07-21 — P10 / U025
- Added a deterministic in-app glow-texture helper that draws the canonical warm `sparkHi→spark→transparent` radial halo into an injected 128×128 canvas and returns an sRGB, linear-filtered `THREE.CanvasTexture` with mipmaps disabled.
- Added two app contracts covering exact repeatable drawing commands, palette stops, texture configuration, no-fetch behavior, and a clear failure when Canvas 2D is unavailable.
- Confirmed genuine test-first RED evidence after correcting the initial missing-module discovery error: both focused assertions failed on the intentional stub, then passed after the minimal implementation.
- Recorded the unspecified raster/stop default in D041 and reviewed the helper against §U8.15; additive sprite-material blending remains correctly deferred to U027.
- Verified the app suite (25 tests across 7 files), `pnpm typecheck`, `pnpm test` (159 tests across 35 files), `pnpm lint` (124 files), `pnpm build`, and the warning-free Interest Lab production build; all pass.
- Status: U025 complete; P10 remains in progress. The deterministic no-fetch halo primitive is ready for the U027 marker, while the client-only Canvas host remains with U026. No blocker.

## NEXT
- Complete U026: add the client-only `World3D` host under `apps/interest-lab/app/child/world3d/` using `next/dynamic(..., {ssr:false})` and an `aria-hidden` react-three-fiber Canvas.
- Acceptance: the host applies exact `SCENE3D` fog, lights, ACES tone mapping, exposure, and camera values; caps DPR through drei `AdaptiveDpr`; renders the supplied scene graph; disposes the renderer on unmount with zero console/WebGL errors; preserves a focused RED run; and keeps app tests, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and both production builds green.

## 2026-07-21 — P10 / U026
- Added a module-scope `next/dynamic` host that loads the WebGL implementation with `ssr:false`, keeping the r3f/Three.js bundle client-only and accepting a supplied scene graph.
- Added the accessibility-hidden Canvas shell with the exact scene fog, ambient/hemisphere/key lights, ACES tone mapping, exposure, camera values, shadow flag, DPR cap, and drei `AdaptiveDpr` behavior from the proven view model.
- Added explicit idempotent renderer-list/renderer disposal while retaining r3f Canvas ownership of event and WebGL-context teardown; added four host contracts for the dynamic boundary, exact scene configuration, supplied graph, and cleanup.
- Confirmed genuine test-first RED states: the module contract first failed on both absent host exports, then all four behavioral contracts failed against the null scaffolds before the minimal implementation made them green.
- Verified app tests (29 across 8 files), `pnpm typecheck`, `pnpm test` (159 across 35 files), `pnpm lint` (127 files), `pnpm --filter @gt100k/interest-lab-app build`, and `pnpm build`; all pass. The real WebGL console walkthrough remains correctly deferred until U029 wires this host into the tier switch.
- Status: U026 complete; P10 remains in progress. SC-UI-16's client-only Canvas, accessibility, deterministic scene setup, adaptive DPR, cleanup, and production-build boundaries are encoded; the mounted browser smoke remains with the P10 checkpoint. No blocker.

## NEXT
- Complete U027: implement `Island.tsx`, `QuestMarker.tsx`, and `Motes.tsx` under `apps/interest-lab/app/child/world3d/` from the existing `SceneView` and halo texture.
- Acceptance: islands use deterministic procedural low-poly geometry, domain hues, tier detail/shadow settings, and pinned idle float; markers render emissive forms plus additive halo sprites with hover/press/pick motion; motes use the quality-tier count and exact §U8.15 color/size/speed/scale; focused RED evidence and app tests, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and both production builds remain green.

## 2026-07-21 — P10 / U027
- Added deterministic full/lite procedural islands from three low-poly primitives, domain hues, tier-owned shadow/detail settings, and drei `Float` motion derived from the exact 6500ms token.
- Added emissive icosahedron quest markers with caller-shared additive halo textures, pointer-fine hover lift/brightening, immediate 0.97 press feedback, DOM-focus brightness, and an interruptible damped pick hop derived from the reserved spring.
- Added exact quality-tier ambient motes through drei `Sparkles`, including the pinned warm color, size, speed, scale, and board-tier off state.
- Confirmed genuine test-first RED evidence on the three absent modules, then a second focused RED for touch/focus motion separation during motion review; all three U027 contracts pass after implementation.
- Removed per-frame render-model allocation during motion review and corrected the production-only r3f mouse/pointer event typing exposed by `next build`.
- Verified app tests (32 across 9 files), `pnpm typecheck`, `pnpm test` (159 across 35 files), `pnpm lint` (131 files), `pnpm --filter @gt100k/interest-lab-app build`, and `pnpm build`; all pass.
- Status: U027 complete; P10 remains in progress. SC-UI-16's procedural scene objects, exact mote tiers, emissive-first glow, and pointer motion boundary are encoded; U028 owns camera motion and U029 owns live scene composition/browser smoke. No blocker.

## NEXT
- Complete U028: implement `apps/interest-lab/app/child/world3d/CameraRig.tsx` from the existing `SceneView`, `CAMERA3D`, motion tokens, and child staging mode.
- Acceptance: tests first prove establishing `driftIn`, DOM-focus-driven `islandFocus` easing with reduced-motion cuts, exact pan/zoom/polar/azimuth/damping clamps, orbit only for `focus+orbit`, and the calm 6-8 auto-tour path; focused tests, app tests, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and both production builds remain green.

## 2026-07-21 — P10 / U028
- Added a frame-driven r3f camera rig with the exact 1400ms establishing drift, live-pose 520ms island retargeting, reduced-motion cuts, and synchronized OrbitControls targets so focus motion stays interruptible without per-frame React state.
- Added exact no-pan/no-zoom, polar, azimuth, and damping clamps for the 9-11/12-14 `focus+orbit` bands, plus a deterministic catalog-order 8-second auto-tour with no free orbit for 6-8; DOM focus always overrides the tour.
- Added six camera contracts covering the establishing pose, first-frame `focusLerp`, continuous settling, focused/stale targets, reduced cuts including a live preference change, auto-tour cadence/precedence, and every orbit clamp.
- Confirmed genuine RED evidence against the absent module and intentional scaffolds, then separate focused RED regressions for the raw-damping endpoint discontinuity and the live reduced-motion retarget identity. Independent review found the latter Important issue; the mode-aware target key now cancels an in-flight move into the required cut.
- Verified app tests (38 across 10 files), `pnpm typecheck`, `pnpm test` (159 across 35 files), `pnpm lint` (133 files), `pnpm --filter @gt100k/interest-lab-app build`, and `pnpm build`; all pass. The mounted WebGL/browser smoke remains correctly assigned to U029's tier wiring.
- Status: U028 complete; P10 remains in progress. Camera motion, age-band control, reduced-motion interruption, and exact orbit constraints are green; U029 owns live world composition, fallback, and browser verification. No blocker.

## NEXT
- Complete U029: add `QuestWorld.tsx` and wire the three-tier child renderer through `InterestLabClient.tsx`, with the DOM `QuestLedger` driving 3D focus and picks.
- Acceptance: full/lite tiers compose `World3D`, islands, markers, motes, the camera rig, and the always-operable DOM ledger from one view; `board-2d`, no-WebGL, lost-context, and reduced-motion fallbacks preserve identical quest state; focused tests, app tests, `pnpm typecheck`, `pnpm test`, `pnpm lint`, both production builds, and the P10 mounted-canvas smoke remain green.

## 2026-07-21 — P10 / U029
- Added the three-tier `QuestWorld` composition: full/lite scenes share `World3D`, procedural islands and markers, ambient motes, the camera rig, and one always-operable DOM quest ledger; board mode removes only the decorative canvas.
- Added seven tier/scene contracts covering capability floors, full/lite composition, exact no-WebGL parity, shared focus/pick graph state, keyboard arrow behavior, and sustained `<55fps` degradation through drei `PerformanceMonitor`. Confirmed focused RED states for the absent performance-floor resolver and monitor callback before both returned green.
- Wired performance decline and WebGL context loss through `InterestLabClient` so the canonical view resolver owns every tier change. Hardened the ledger's picked-state notification with a latest-callback ref, preventing callback identity from causing a hydration update loop.
- Mounted the real app in headless Chromium: the lite/full canvas was `aria-hidden`, six DOM quest cards remained operable, focus mirrored to `p01`, and a picked quest survived both `3D→reduced-motion board→3D` and a cancelable `webglcontextlost` fallback. The final fresh load had zero application console errors; headless SwiftShader emitted only its environment-specific `ReadPixels` performance warnings.
- Added the app icon to eliminate the only console error (a missing favicon) and moved the world instruction above the ledger overlap after visual inspection found its bottom placement obscured.
- Verified app tests (48 across 11 files), `pnpm typecheck`, `pnpm test` (159 across 35 files), `pnpm lint` (135 files), the Interest Lab production build, and `pnpm build`; all pass.
- Status: U029 and P10 complete. SC-UI-13/14/16 and UI-US2's one-view 3D/2D accessibility, degradation, focus, pick, context-loss, and reduced-motion boundaries are green. No blocker.

## NEXT
- Complete U030 with the minimal U031 implementation: add `packages/interest-lab-view/test/return-delight.test.ts` and derive voluntary-versus-prompted return presentation in the picker and scene view models.
- Acceptance: voluntary return at day 7 or 30 yields card/marker `returnState:"voluntary-return"`, `spark` tone, label-free concrete copy, and `welcomeBack` motion (static warm-halo text under reduced motion); prompted return yields `returnState:"prompted-return"`, recessed `prompted` tone, and no welcome-back delight; card/marker parity, focused RED evidence, and the full green gate are preserved.

## 2026-07-21 — P11 / U030 + U031
- Added four SC-UI-03 acceptance contracts covering both exact delayed-voluntary horizons, prompted recession, picker/scene parity, label-free concrete copy, and the zero-duration reduced-motion warm-halo equivalent.
- Confirmed genuine test-first RED evidence: all four focused cases failed because history was ignored and every card/marker retained the fresh `new`/`neutral` presentation, then passed after the minimal implementation.
- Implemented one pure return-presentation projection in the picker and mirrored it into scene markers, with `welcomeBack`/`spark` reserved for valid 7/30-day voluntary history and `promptedRecede`/`prompted` for prompted history.
- Recorded the deterministic multi-row precedence and reduced-presentation default in D046; no new view field, domain rule, framework dependency, wall-clock read, or GPU dependency was introduced.
- Verified the focused return suite (4 tests), view package suite (53 tests across 12 files), forced view-package compiler, `pnpm typecheck`, `pnpm test` (163 tests across 36 files), `pnpm lint` (136 files), `pnpm build`, and the warning-free Interest Lab production build; all pass.
- Status: U030 and U031 complete; P11 remains in progress pending U032. SC-UI-03 is green at the pure picker/scene boundary; the rendered 3D bloom and static 2D equivalent remain with U032. No blocker.

## NEXT
- Complete U032: implement `apps/interest-lab/app/child/world3d/WelcomeBloom.tsx` and `apps/interest-lab/app/child/WelcomeBack.tsx`, then render voluntary and prompted return presentation from the existing view model.
- Acceptance: voluntary return renders the reserved 3D emissive bloom, spark-mote burst, and camera ease plus the static 2D/reduced-motion warm halo with concrete copy; prompted return remains recessed and uncelebrated; no countdown, streak, scarcity, FOMO, or time-gated unlock appears; focused tests, app tests, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and both production builds remain green.

## 2026-07-21 — P11 / U032
- Added the reserved deterministic 3D voluntary-return bloom: emissive intensity peaks at `SCENE3D.bloomPeak`, eight fixed additive spark sprites rise and settle within the exact 480ms `welcomeBack` token, and the existing interruptible camera rig eases toward the returned island with DOM focus taking precedence.
- Added the static DOM/reduced-motion equal with a warm halo and concrete `You came back to this one.` copy; prompted cards and markers now recede with the `prompted` palette plus an explicit icon/text cue and never render the bloom.
- Added five app contracts covering the synthetic P11 preview, DOM copy/halo, prompted no-delight state, exact bloom peak/settle/reduced values, deterministic motes, camera timing/priority, and the ≤1.05 pop overshoot ceiling. Confirmed genuine RED states for the absent renderers, the initial 1400ms camera path, excessive raw-pop overshoot, and the missing prompted text cue before each minimal correction.
- Static audits found no countdown, streak, scarcity, FOMO, time-gated unlock, level-up, fixed-label copy, `scale(0)`, `ease-in`, or unbounded transition in the child runtime.
- Verified `pnpm typecheck`, `pnpm test` (163 tests across 36 files), `pnpm lint` (139 files), the app suite (53 tests across 12 files), the Interest Lab production build, and `pnpm build`; all pass. The production server returned HTTP 200 with the expected voluntary static delight and prompted no-delight cue.
- Browser note: the cached headless Chromium could not launch because this host lacks `libnspr4.so`, and no Playwright runtime is installed; no dependency or host mutation was made to bypass that environment limitation. The deterministic 3D scene graph and camera path are covered by app tests, but this turn could not repeat P10's mounted WebGL walkthrough.
- Status: U032 and P11 complete. SC-UI-03 and the P11 portion of SC-UI-17 are green at the view, app-render, scene, motion, static-server, and production-build boundaries. No implementation blocker.

## NEXT
- Complete U033: add `packages/interest-lab-view/test/coverage-view.test.ts` with the complete G2 and gappy G3 coverage-view goldens.
- Acceptance: rows preserve catalog order and domain hues; columns contain all nine work modes with glyphs; cells are row-major with exact complete/gappy outcomes and gap strings; no `score` or `confidence` key exists at any depth; preserve focused RED evidence and keep `pnpm typecheck`, `pnpm test`, and `pnpm lint` green without beginning U034 implementation beyond the minimum green-only harness boundary.

## 2026-07-21 — P12 / U033 + U034
- Added three pure coverage-view acceptance contracts for the complete G2 and gappy G3 projections: catalog-ordered hue rows, all nine fixed glyph columns, exact row-major offered/empty cells, all six rail dimensions, exact ordered gap strings, and recursive absence of `score`/`confidence`.
- Confirmed genuine test-first RED evidence: all three focused cases failed because `buildCoverageMatrixView` was absent, and the public-API contract independently reported the missing export before implementation.
- Implemented and exported the GPU-free `buildCoverageMatrixView`, preserving Part-I coverage/order, explicit visible empty cells, provenance/reason inspection copy, D026-safe rail titles, and exact aggregate/dimension gaps without recomputing domain rules.
- Recorded the input-truthful offered/empty projection default in D048; voluntary/prompted cell statuses remain unavailable until a history-bearing composition owns them.
- Verified the forced view-package compiler, focused suite (5 tests), `pnpm typecheck`, `pnpm test` (166 tests across 37 files), and `pnpm lint` (141 files); all pass.
- Status: U033 and U034 complete; P12 remains in progress pending U035. SC-UI-04 and UI-FR-006 are green at the pure coverage-view boundary. No blocker.

## NEXT
- Complete U035: implement the semantic animated guide coverage matrix and coverage rail in `apps/interest-lab/app/guide/CoverageMatrix.tsx` from the pure `CoverageMatrixView`.
- Acceptance: the app renders row/column headers and every cell as an accessible table/grid; filled cells use the pinned `matrixCell` motion, reduced motion is instant, and named gaps remain calm, visible, color-independent, and never scalar; focused tests, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and both production builds remain green.

## 2026-07-21 — P12 / U035
- Added a single native domains×work-modes coverage table with catalog-hued row headers, all nine glyph-and-text column headers, and one visible icon-and-text state for every offered or empty cell.
- Added the six-item semantic coverage rail plus an explicit aggregate `Still to explore` list, using calm `--gap` hollow cues for every unmet dimension and no scalar coverage representation.
- Added pinned `matrixCell`/40ms stagger and 600ms rail transition helpers with zero-duration reduced-motion equivalents, keeping initial content visible rather than gating it behind animation.
- Confirmed genuine test-first RED evidence against the absent guide component, then passed four focused contracts covering exact table cardinality, complete/gappy fixtures, color-independent gap visibility, responsive overflow, and motion values.
- Verified app tests (57 tests across 13 files), `pnpm typecheck`, `pnpm test` (166 tests across 37 files), `pnpm lint` (143 files), the warning-free Interest Lab production build, and `pnpm build`; all pass.
- Status: U035 and P12 complete. SC-UI-04 and UI-US4 are green at the pure view and app-render boundaries; U042 owns mounting the completed guide surfaces together. No blocker.

## NEXT
- Complete U036: add `packages/interest-lab-view/test/explanations.test.ts` for the exact §U8.12 competing-explanations contract, paired with only the minimal implementation needed to preserve the green-only harness boundary.
- Acceptance: supporting evidence always has a side-by-side disconfirming counterpart; uncertainty preserves grade/interval; no `passionScore`, `score`, `verdict`, or `label` key exists; no card copy matches `/you are (a|an|the) /i`; preserve focused RED evidence and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-21 — P13 / U036 + partial U040
- Added five pure `buildExplanationsView` contracts covering ordered supporting/disconfirming/other cards, the single-explanation `Next test` counterpart, grade and interval uncertainty, recursive forbidden-field absence, fixed-label fail-closed behavior, and validation of rendered copy only.
- Confirmed genuine test-first RED evidence: after the initial missing-module discovery error, all four original assertions failed against a non-behavioral null scaffold; a self-review regression then independently failed because unused fallback copy was validated before its branch.
- Implemented the minimum GPU-free explanation projection with immutable evidence/uncertainty copies, paired cards, deterministic semantic tones, no scalar derivation, and no framework, I/O, wall-clock, or random dependency. Public export and full guide composition remain with U040/U041.
- Recorded the unspecified ordered-string, shared-reference, single-card fallback, and interval-strength defaults in D050.
- Verified the view package suite (61 tests across 14 files), `pnpm typecheck`, `pnpm test` (171 tests across 38 files), and `pnpm lint` (145 files); all pass.
- Status: U036 complete; U040 is partial; P13 remains in progress. SC-UI-05 and UI-FR-007 are green at the pure direct-module boundary. No blocker.

## NEXT
- Complete U037 with the minimal timeline portion of U040: add `packages/interest-lab-view/test/timeline.test.ts` and implement `buildReturnTimelineView` from `EVENTS_GOLDEN_V1`.
- Acceptance: voluntary returns at day 7 and 30 are distinct; prompted return is recessed with `interventionContext:"reminder"` and contributes zero voluntary signal; every accessibility/safety support marker has `lowersSignal:false`; preserve focused RED evidence and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-21 — P13 / U037 + partial U040
- Added three pure `buildReturnTimelineView` contracts covering the complete day-ascending §U8.10 marker golden, exact 7/30-day voluntary horizons, prompted-return recession/context without a voluntary horizon, neutral assistive/safety support, the timeline span, a color-independent legend, and pinned motion tokens.
- Confirmed genuine test-first RED evidence: the suite first failed to resolve the absent timeline module, then all three behavioral assertions failed against a typed null scaffold before the minimal implementation made them green.
- Implemented the GPU-free event-to-marker projection with a total event-type presentation map, stable chronological ordering, exact horizon/context fields, a non-mutating legend copy, and animated `timelineDraw`/`markerPop` tokens; public export remains deferred with the other partial U040 builders.
- Recorded the canonical-golden tone and chronological-order conflict in D051. Local specification review found no Critical or Important issue; one formatter-only gate failure was reproduced and corrected with the exact Biome-prescribed signature layout.
- Verified the focused timeline suite, forced view-package compiler, view-package suite (64 tests across 15 files), `pnpm typecheck`, `pnpm test` (174 tests across 39 files), and `pnpm lint` (147 files); all pass.
- Status: U037 complete; U040 is partial; P13 remains in progress. SC-UI-06 and UI-FR-008 are green at the pure direct-module boundary. No blocker.

## NEXT
- Complete U038 with the minimal lifecycle/history portion of U040: add `packages/interest-lab-view/test/lifecycle-view.test.ts` and implement `buildLifecycleStateView` plus `buildRevisionHistoryView`.
- Acceptance: the lifecycle gate checklist matches `evaluateCandidateGate` G5, shadow proposals remain suggestions with `operative:false`, all fixed legal transitions are present with no proposal path to operative authorship, and revision history is append-only and monotonic; preserve focused RED evidence and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-21 — P13 / U038 + partial U040
- Added seven pure lifecycle/history contracts covering the exact main/branch tracks, authoritative legal transitions, complete and competence-only G5 checklists, both shadow provenances, fail-closed operative proposals, bitemporal append order, and monotonic history validation.
- Confirmed genuine test-first RED evidence: the suite first failed to resolve the absent lifecycle module, then all seven focused cases failed against typed null scaffolds before the minimal implementation made them green.
- Implemented the GPU-free lifecycle projection from domain constants and evidence-carrying gate input, with exact contested/parked tones, non-operative suggestion copy, separate guide-authoring affordance, and an append-preserving revision rail whose current version is the highest operative revision.
- Recorded the underdetermined gate-input boundary and authorship/history defaults in D052. One formatter-only gate failure was reproduced in isolation and corrected with the exact Biome-prescribed import order and wrapping.
- Verified the focused lifecycle suite (7 tests), forced view-package compiler, view-package suite (71 tests across 16 files), `pnpm typecheck`, `pnpm test` (181 tests across 40 files), and `pnpm lint` (149 files); all pass.
- Status: U038 complete; U040 remains partial; P13 remains in progress. SC-UI-07 and IL-006's revision-history projection are green at the pure direct-module boundary. No blocker.

## NEXT
- Complete U039 with the minimal constellation portion of U040: add `packages/interest-lab-view/test/constellation.test.ts` and implement `buildEvidenceConstellationView`.
- Acceptance: the six family stars follow gate order; voluntary return has brightness `1.0`, other present families `0.7`, and absent families `0.18`; supporting/disconfirming anchors are `[2.4,0.4,0]` and `[-2.4,0.4,0]`; `domEquivalent:true`; no scalar score; preserve focused RED evidence and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-21 — P13 / U039 + U040
- Added four pure evidence-constellation contracts covering the exact six-star G4 geometry/order, present/absent brightness values, pinned supporting/disconfirming anchors, DOM equivalence, conservative polarity behavior, and recursive absence of scalar score fields.
- Confirmed genuine test-first RED evidence: the focused suite failed on the absent constellation module, then the U040 public-API contract failed on all five missing guide-builder exports before their minimal implementations were exposed.
- Implemented the GPU-free `buildEvidenceConstellationView` from the fixed signal-family vocabulary and authoritative revision summary, with integer-tenths geometry to avoid floating drift and the D053 fail-closed neutral pull until a typed polarity mapping exists.
- Completed U040 by publicly exporting the explanation, timeline, lifecycle, revision-history, and constellation builders. Independent review found the missing export and the upstream polarity-model gap; the export was fixed test-first, while the schema expansion was rejected as unpinned scope.
- Verified the focused constellation/public-API suites (6 tests), forced view-package compiler, `pnpm typecheck`, `pnpm test` (185 tests across 41 files), and `pnpm lint` (151 files); all pass.
- Status: U039 and U040 complete; P13 remains in progress. SC-UI-05/06/07/15 and the complete P13 pure-builder public boundary are green. No implementation blocker; D053 records the reversible neutral-pull limitation.

## NEXT
- Complete U041: finalize `buildInterestLabView` and add `plainViewEquals` in `packages/interest-lab-view/src/view.ts`, composing the full guide block plus existing scene from one domain state.
- Acceptance: tests first prove guide composition includes coverage, explanations, timeline, lifecycle, revision history, and constellation; `plainViewEquals` compares all domain-derived state including marker parity and constellation stars while allowing flags/presentation/tier/camera to differ; preserve focused RED evidence and keep the package compiler, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and Interest Lab production build green.

## 2026-07-21 — P13 / U041
- Finalized `buildInterestLabView` around the exact full input contract, composing coverage, explanations, timeline, lifecycle, revision history, constellation, picker, and scene from one explicit domain state; an absent operative hypothesis revision now fails closed.
- Added `plainViewEquals` as a key-order-independent structural comparison over the spec-named domain slices, including probe-id-keyed scene markers and constellation stars, while excluding surface flags and camera/tier/quality/motion presentation differences.
- Added six composition/parity contracts and updated the public API, child composition fixture, and synthetic app seed. Confirmed genuine RED evidence for the missing guide surface/export/equality, then separate review-driven RED regressions for reduced guide motion and insertion-order-sensitive equality before their minimal fixes.
- Verified `pnpm typecheck`, `pnpm test` (191 tests across 42 files), `pnpm lint` (152 files), `pnpm build`, and `pnpm --filter @gt100k/interest-lab-app build`; all pass.
- Status: U041 complete; P13 remains in progress pending U042. SC-UI-05/06/07/10/15 are green at the complete pure composition boundary; U042 owns the rendered guide console and P15/U046 retains the exhaustive cross-mode parity matrix. No blocker.

## NEXT
- Complete U042: implement the guide console components under `apps/interest-lab/app/guide/` and mount the guide surface behind the existing `InterestLabClient` surface toggle.
- Acceptance: supporting and disconfirming explanations render side-by-side; the return timeline distinguishes voluntary, prompted, and support markers; lifecycle proposals remain non-operative suggestions with guide-authoring affordance; revision history stays append-only; the optional constellation is `aria-hidden` with a DOM equal and degrades off under reduced motion/no WebGL; focused tests, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and both production builds remain green.

## 2026-07-21 — P13 / U042
- Replaced the guide placeholder with the composed Hypothesis Console: the existing coverage field map now sits with equal supporting/disconfirming evidence columns, uncertainty copy, a dated four-lane return timeline, lifecycle and six-family gate views, a non-operative dashed shadow suggestion, and a selectable append-only revision rail.
- Added a real synthetic-local guide-authoring path. The form records decision and rationale through app state, rebuilds the aggregate through the domain hypothesis APIs, appends an operative version 2, preserves the operative version 1 and shadow proposal in history, and removes the active suggestion without persistence or live child data.
- Added the optional client-only r3f evidence constellation as an `aria-hidden` decorative layer. The DOM evidence remains authoritative, and the canvas is not loaded for reduced motion, plain mode, `board-2d`, or unavailable WebGL.
- Added exact guide motion and reduced-motion contracts, responsive/color-independent styling, deterministic four-lane marker placement, and eight focused U042 acceptance tests. Independent review findings for timeline overlap, placeholder authoring/history, and the alternative-branch accessible name were corrected before the final gate.
- Verified the focused guide suite (8 tests), `pnpm typecheck`, `pnpm test` (191 tests across 42 files), `pnpm lint` (162 files), the Interest Lab production build, and `pnpm build`; all pass. A browser walkthrough could not run because neither the Playwright CLI nor a local Playwright dependency is available on this host; no dependency was installed to bypass that environment limitation.
- Status: U042 and P13 complete. SC-UI-05/06/07/15 and UI-US5 are green at the pure view, semantic app-render, motion, authoring/history, degradation, typecheck, test, lint, and production-build boundaries. No implementation blocker.

## NEXT
- Complete U043: wire every `resolveQualityTier` parameter into the existing 3D scene, preserving the green accessible floor.
- Acceptance: tests first prove full/lite quality drives DPR caps, motes, shadows, and high/low island detail from the composed view; `board-2d` mounts no canvas; optional post-processing bloom stays behind `QUALITY_TIERS.full.bloom` and is not added unless it remains non-breaking; focused tests, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and both production builds remain green.

## 2026-07-21 — P14 / U043
- Added integrated full/lite quality-tier regressions proving the composed view drives the exact Canvas DPR cap and shadow mode, then threads the same quality object through ambient motes and every high/low-detail island.
- Confirmed failure sensitivity with a controlled regression that replaced view-derived island quality with the full-tier constant: both new composed-quality cases failed, including the lite geometry path, then all 16 focused world tests passed after restoration.
- Reused the existing board-tier contract proving `board-2d` mounts no Canvas and preserves the same operable quest ids; kept the optional post-processing packages absent under the emissive-first §U8.15 default recorded in D056.
- Verified the app suite (68 tests across 14 files), `pnpm typecheck`, `pnpm test` (191 tests across 42 files), `pnpm lint` (162 files), the warning-free Interest Lab production build, and `pnpm build`; all pass.
- Status: U043 complete; P14 remains in progress. SC-UI-14's quality values are now locked through the pure resolver, composed view, Canvas, and scene-object boundaries. No blocker.

## NEXT
- Complete U044: harden runtime degradation so repeated sustained low-FPS events step `full → lite → board-2d`, while WebGL context loss, Save-Data, and device memory below 4 GB fail directly to `board-2d` without losing a pick or quest.
- Acceptance: tests first prove both sequential performance steps and every capability fallback, plus quest-state parity across tier changes; focused app tests, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and both production builds remain green.

## 2026-07-21 — P14 / U044
- Replaced the one-shot performance boolean with a capped three-step presentation floor so repeated sustained `<55fps` monitor declines resolve `quest-world-3d → quest-world-3d-lite → board-2d` through the canonical view builder.
- Added five U044 contracts covering the exact sequential downgrade, direct Save-Data/device-memory/WebGL fallbacks, unchanged probe ids, and preservation of a picked quest through every tier.
- Confirmed genuine test-first RED evidence: 12 of 13 focused tests passed while the second decline incorrectly remained 3D-lite; the focused suite passed after the minimal runtime-floor implementation.
- Kept the client callback stable with a functional state update and retained focus/pick ownership in the always-mounted DOM ledger; explicit render requests and context loss cannot bypass the computed capability floor.
- Verified the app suite (72 tests across 14 files), `pnpm typecheck`, `pnpm test` (191 tests across 42 files), `pnpm lint` (162 files), the warning-free Interest Lab production build, and `pnpm build`; all pass.
- Status: U044 complete; P14 remains in progress pending U045. SC-UI-16's deterministic runtime and capability degradation boundaries are green; the physical performance/degradation walkthrough remains next. No blocker.

## NEXT
- Complete U045: run the performance/degradation walkthrough against the production Interest Lab app.
- Acceptance: verify the 60fps target on a mid-capability device, simulate sustained decline through full → lite → board-2d, confirm Save-Data/low-memory/context-loss fallbacks, and prove a picked quest survives every transition; keep the Interest Lab production build and full gate green.

## 2026-07-21 — P14 / U045
- Ran the production app through a real browser walkthrough. A 4× CPU-throttled strong-capability session stepped `quest-world-3d → quest-world-3d-lite → board-2d`; `p01` remained pressed, the picked count stayed 1, and all six DOM quests survived both transitions.
- Confirmed the direct capability floors in separate hydrated browser contexts: `deviceMemory=3` and `Save-Data=true` each rendered `board-2d`, mounted no Canvas, retained all six quests, and accepted a pick.
- The first real `WEBGL_lose_context` run exposed a Three.js restoration race that blanked the app. Added a failing renderer-lifecycle regression, then disposed renderer ownership before the fallback callback; the rebuilt production app now reaches `board-2d` with zero console errors, no Canvas, all six quests, and the existing pick intact.
- The browser host has no GPU render device and reports SwiftShader. Its loaded 3D tiers measured below the 55fps floor and correctly degraded, while the settled DOM tier sampled 60.4fps; a physical mid-GPU 3D 60fps measurement is therefore an environment validation gap, not evidence of an application regression.
- Verified the app suite (72 tests across 14 files), Interest Lab production build, `pnpm typecheck`, `pnpm test` (191 tests across 42 files), `pnpm lint` (162 files), and `pnpm build`; all pass.
- Status: U045 and P14 complete under the spec's best-effort 3D rule. SC-UI-16's runtime step-down, capability fallback, context-loss, state-preservation, client-only Canvas, and production-build paths are green; physical mid-GPU throughput remains for operator hardware validation. No implementation blocker.

## NEXT
- Complete U046: extend `packages/interest-lab-view/test/view.test.ts` with the exhaustive one-view parity matrix.
- Acceptance: `buildInterestLabView` composes both surfaces plus the scene, and `plainViewEquals` holds across full 3D, 3D-lite, 2D, plain, reduced-motion, and every age band while all domain-derived state remains identical; preserve focused RED evidence and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.

## 2026-07-21 — P15 / U046
- Added the exhaustive one-view matrix across child and guide surfaces, full 3D, 3D-lite, 2D fallback, plain mode, reduced motion, and all three age bands; every pair preserves the same domain state while emitting its pinned presentation tier.
- Locked card-to-scene parity by probe id for return state, tone, provenance, reason copy, and work-mode glyph, while confirming both surfaces compose the complete guide and deterministic scene from one input.
- Confirmed genuine test-first RED evidence: nine of ten focused tests passed, while `plainViewEquals` incorrectly accepted card-only `whyCopy` and glyph drift; the minimal comparator correction now includes those fields and still excludes age-specific copy across different bands.
- Verified the forced view-package compiler, focused suite (10 tests), `pnpm typecheck`, `pnpm test` (201 tests across 43 files), and `pnpm lint` (163 files); all pass.
- Status: U046 complete; P15 remains in progress. SC-UI-10 is green across the exhaustive pure view matrix and rejects unilateral 2D/scene parity drift. No blocker.

## NEXT
- Complete U047: add the static view-package guardrail suite in `packages/interest-lab-view/test/guardrails.test.ts`.
- Acceptance: prove `packages/interest-lab-view/src` contains no `Math.random` or `three`/`react`/`@react-three/*` import; no view type exposes `price`, `currency`, `score`, `confidence`, `passionScore`, `rank`, `percentile`, `verdict`, or `outOf`; and no copy generator emits `/you are (a|an|the) /i`; preserve focused RED evidence and keep the package compiler, `pnpm typecheck`, `pnpm test`, and `pnpm lint` green.
