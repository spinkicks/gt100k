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
