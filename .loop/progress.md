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
