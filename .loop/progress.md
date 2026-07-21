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
