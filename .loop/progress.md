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
