# Tasks: Interest Lab / Passion (Rules-Engine MVP)

**Input**: Design documents from `specs/003-interest-lab/`
**Prerequisites**: plan.md (incl. embedded *Data Model* + *Domain Contracts*), spec.md
**Tests**: INCLUDED — the constitution makes tests part of "done"; the embedded *Contract test obligations* define explicit obligations that map to PASS-00x + §14.4.3 #1–#7. **Write tests first and ensure they FAIL before implementing.**

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete-task dependency)
- **[Story]**: US1 / US2 / US3 / US4 (setup, foundational, polish carry no story label)
- Every task names an exact file path.

## Path conventions (from plan.md — TS monorepo, NEW dirs only)

- Domain: `packages/interest-lab/src/`, tests `packages/interest-lab/test/`
- Adapters: `adapters/interest-repo-memory/`, `adapters/interest-probe-catalog/`, `adapters/interest-assent-stub/`, `adapters/interest-artifact-stub/`
- **Parallel-safety**: create only the above new dirs. Do **not** edit shared root files. `pnpm-workspace.yaml`, `vitest.config.ts`, and the Biome `lint` script already glob `packages/*`/`adapters/*`. The **only** shared-root edit is the root `tsconfig.json` `references` array — it is the **final task (T033)**, flagged for human reconcile.

---

## Phase 1: Setup (package scaffolding — new dirs only)

- [ ] T001 Scaffold `@gt100k/interest-lab` at `packages/interest-lab/package.json` (mirror `packages/learning-loop/package.json`: `"type":"module"`, `main`/`types`→`./src/index.ts`, `exports`, `test`:`vitest run`) and `packages/interest-lab/src/index.ts` (empty barrel)
- [ ] T002 [P] Add `packages/interest-lab/tsconfig.json` extending `../../tsconfig.base.json` (`rootDir:"."`, `outDir:"dist"`, `include:["src/**/*.ts","test/**/*.ts"]`)
- [ ] T003 [P] Scaffold adapter packages: `adapters/interest-repo-memory/{package.json,tsconfig.json}`, `adapters/interest-probe-catalog/{package.json,tsconfig.json}`, `adapters/interest-assent-stub/{package.json,tsconfig.json}`, `adapters/interest-artifact-stub/{package.json,tsconfig.json}` (each mirrors `adapters/repo-memory`: dep `@gt100k/interest-lab: workspace:*`, tsconfig `references` → `../../packages/interest-lab`)

**Checkpoint**: packages resolve under pnpm workspace; `pnpm --filter @gt100k/interest-lab test` runs (0 tests).

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: no user-story work begins until this phase is complete.

- [ ] T004 [P] Define enums/vocabularies + core value types in `packages/interest-lab/src/probe.ts` (`WorkMode`, `DifficultyBand`, `AudienceCondition`, `SocialMode`, `SafetyClass`, `Provenance`, `Probe`, `ProbeFamily`) per plan *Data Model*
- [ ] T005 [P] Define ports in `packages/interest-lab/src/ports.ts` (`InterestHypothesisRepository`, `ProbeCatalog`, `AssentRecordPort`, `ArtifactSignalSource`, `OfferDecisionLog`, `Clock`) per plan *Domain Contracts*
- [ ] T006 [P] Define event/signal/hypothesis types in `packages/interest-lab/src/events.ts` + `packages/interest-lab/src/hypothesis.ts` (`EventType`, `EngagementEvent`, `SignalFamily`, `SignalSummary`, `HypothesisState`, `ChildPosition`, `InterestHypothesis`, `HypothesisRevision`, `ForbiddenPurpose`)
- [ ] T007 Export all foundational types from `packages/interest-lab/src/index.ts`

**Checkpoint**: types + ports compile (`tsc -b` locally within the package); stories can begin.

---

## Phase 3: User Story 1 — Generate a balanced Interest Lab (Priority: P1) 🎯 MVP

**Goal**: a deterministic rules engine assembles a safe, prerequisite-valid, balanced 18–24 probe Lab with a permanent exploration floor, provenance per offer, and an explicit coverage matrix that names each gap.

**Independent Test**: with shadow/adaptive selection disabled, generate a Lab from a synthetic catalog → 18–24 offers; coverage across ≥6 domains, ≥6 work modes, solo+group, two difficulty bands, audience+no-audience; ≥2 eligible offers/choice point; prerequisite-invalid/non-cleared probes excluded; coverage matrix enumerates gaps (no scalar score); each offer tagged `GUIDE|RULE|SHADOW_MODEL`.

### Tests (write first, ensure they fail)

- [ ] T008 [P] [US1] Contract test for `buildCoverageMatrix` (each dimension met/gap enumerated; NO scalar score; gap catalog → named gaps) in `packages/interest-lab/test/coverage.test.ts` (IL-005, §14.4.3 #3, SC-002)
- [ ] T009 [P] [US1] Contract test for `buildLab` (18–24 offers; all six coverage dims met on a full catalog; ≥2 eligible/choice; exploration floor reserved; deterministic by seed; shadow OFF still complete) in `packages/interest-lab/test/offer.test.ts` (PASS-002, IL-003/IL-004, §14.4.3 #5, SC-001)
- [ ] T010 [P] [US1] Contract test for eligibility filtering (prerequisite-invalid + non-`cleared` probes never offered; ≤1 variant per family per choice point) in `packages/interest-lab/test/offer.test.ts` (PASS-003, IL-002)

### Implementation

- [ ] T011 [US1] Implement `packages/interest-lab/src/catalog.ts` (eligibility filter: prerequisite-valid + `cleared`; family-variant selection ≤1/family/choice) (depends on T004/T005)
- [ ] T012 [US1] Implement `packages/interest-lab/src/coverage.ts` (`buildCoverageMatrix` — enumerated met/gap per dimension, no scalar score) (depends on T004)
- [ ] T013 [US1] Implement `packages/interest-lab/src/offer.ts` (`buildLab` — deterministic seeded rules engine: coverage-greedy selection, exploration floor, provenance+reason per offer; emits `OfferDecisionLog` entry: eligible set, policy version, coverage constraints) (depends on T011, T012)
- [ ] T014 [P] [US1] Implement `adapters/interest-probe-catalog/src/index.ts` (synthetic `ProbeCatalog` covering all dimensions + a deliberately gappy preset for coverage tests) and `adapters/interest-probe-catalog/test/catalog.test.ts`
- [ ] T015 [US1] Export offer/coverage/catalog API from `packages/interest-lab/src/index.ts`

**Checkpoint**: the rules engine produces a complete, balanced, honest-coverage Lab, unit-tested independently. **MVP is demonstrable here.**

---

## Phase 4: User Story 2 — Distinguish voluntary from prompted engagement (Priority: P2)

**Goal**: a typed event model separates voluntary/discretionary return from prompted return and computes separated, accessibility-safe signal families.

**Independent Test**: feed a stream with a reminder-driven return, unprompted returns @7 and @30 days, an assistive session, and a safety rescue → prompted and voluntary produce distinct types & features; prompted adds 0 to voluntary_return; assistive/safety never lower a signal; summary reports each family separately.

### Tests (write first, ensure they fail)

- [ ] T016 [P] [US2] Contract test for `recordEvent` (idempotent by id; `PROMPTED_RETURN` requires interventionContext and never increments voluntary_return; 7/30-day horizons correct) in `packages/interest-lab/test/events.test.ts` (PASS-004/005, §14.4.3 #4, SC-005)
- [ ] T017 [P] [US2] Contract test for `summarizeSignals` (families reported separately; assistive/safety events never reduce a signal; paired assisted/unaided → identical interpretation; prompt_dependence is a discount not a family) in `packages/interest-lab/test/signals.test.ts` (PASS-006, §14.4.3 #7, SC-007)

### Implementation

- [ ] T018 [US2] Implement `recordEvent` in `packages/interest-lab/src/events.ts` (idempotent; enforce interventionContext on PROMPTED_RETURN; tag assistive/safety; honor `withdrawn`) (depends on T006)
- [ ] T019 [US2] Implement `packages/interest-lab/src/signals.ts` (`summarizeSignals` — separated families; delayed voluntary @7/@30; accessibility-safe; exclude withdrawn/optional reflections) (depends on T018)
- [ ] T020 [US2] Export event/signal API from `packages/interest-lab/src/index.ts`

**Checkpoint**: raw engagement becomes clean, separated, honestly-labeled signal families, unit-tested.

---

## Phase 5: User Story 3 — Versioned InterestHypothesis + lifecycle (Priority: P3)

**Goal**: an append-only, versioned hypothesis with a lifecycle state machine, the `CANDIDATE_SPINE` promotion gate, the missing-data prohibition, and shadow-only proposals that only a guide-authored revision makes operative.

**Independent Test**: easy-clicks-only learner never reaches `CANDIDATE_SPINE`; low-skill-recover-author learner is eligible; missing-data window never lowers state/uncertainty; rule/model-proposed transition stays non-operative until a guide authors it; all revisions replayable by version.

### Tests (write first, ensure they fail)

- [ ] T021 [P] [US3] Contract test for `evaluateCandidateGate` (refuse < 3 families / no delayed-discretionary / no artifact-competence, naming the missing prerequisite; easy-clicks-only → never eligible; low-skill-recover-author → eligible) in `packages/interest-lab/test/state-machine.test.ts` (IL-008, §14.4.3 #1/#2, SC-003/004)
- [ ] T022 [P] [US3] Contract test for `applyMissingData` (state + uncertainty unchanged; low-interest inference refused without human rule-out flag) in `packages/interest-lab/test/state-machine.test.ts` (IL-009, SC-010)
- [ ] T023 [P] [US3] Contract test for proposal vs authorship (`proposeTransition` → `guideReview=null`, non-operative shadow; `authorRevision` → operative) and legal-transition enforcement incl. CONTESTED/PARKED/REOPENED in `packages/interest-lab/test/state-machine.test.ts` (IL-007/IL-011, §14.4.3 #5-lifecycle, SC-009)
- [ ] T024 [P] [US3] Contract test for hypothesis append-only + versioned + bitemporal replay in `packages/interest-lab/test/hypothesis.test.ts` (IL-006/IL-012: uncertainty as interval/grade, never scalar; disconfirming beside supporting)
- [ ] T025 [P] [US3] Contract test for the in-memory repository (append-only, `currentFor`, `revisions` replay) in `adapters/interest-repo-memory/test/repo.test.ts`

### Implementation

- [ ] T026 [US3] Implement `packages/interest-lab/src/state-machine.ts` (`evaluateCandidateGate`, legal transitions, `proposeTransition`, `authorRevision`, `applyMissingData`) (depends on T006, T019)
- [ ] T027 [US3] Implement hypothesis revision constructors/current-view helpers in `packages/interest-lab/src/hypothesis.ts` (append-only, bitemporal current view, uncertainty interval/grade) (depends on T006)
- [ ] T028 [US3] Implement `adapters/interest-repo-memory/src/index.ts` (`InMemoryInterestHypothesisRepository`: append-only, deep-copy on write like `adapters/repo-memory`) (depends on T005)
- [ ] T029 [US3] Export hypothesis/state-machine API from `packages/interest-lab/src/index.ts`

**Checkpoint**: the full evidence record + lifecycle works headless, with the promotion gate, missing-data rule, and guide-authorship invariant enforced and tested.

---

## Phase 6: User Story 4 — Hard guardrails & child agency (Priority: P4)

**Goal**: enforce the `G`-class boundaries — purpose guard (PASS-010), PASS-006/007/008, team-artifact rule — at typed boundaries.

**Independent Test**: every forbidden-purpose read is denied; a withdrawn optional reflection is absent from the next summary + replay; an artifact payload with raw content is rejected; a team artifact cannot become individual evidence without solo proof.

### Tests (write first, ensure they fail)

- [ ] T030 [P] [US4] Contract test for `guardRead` (deny-by-default for admissions/discipline/family-fidelity/public-ranking/commercial-targeting; auditable denial), `promoteTeamArtifact` (refuse individual credit w/o solo proof), and `acceptArtifactSignal` (reject screen recordings/raw keystrokes/unrelated content; accept coarse transitions) in `packages/interest-lab/test/guards.test.ts` (PASS-010/007, IL-010/013, SC-008)
- [ ] T031 [P] [US4] Acceptance suite mapping §14.4.3 #1–#7 end-to-end over the in-memory/stub adapters (incl. withdrawn-reflection disappears from next build + replay, PASS-008, §14.4.3 #6, SC-006) in `packages/interest-lab/test/acceptance.test.ts`

### Implementation

- [ ] T032 [US4] Implement `packages/interest-lab/src/guards.ts` (`guardRead`, `promoteTeamArtifact`, `acceptArtifactSignal`), `adapters/interest-assent-stub/src/index.ts` (stub `AssentRecordPort` + withdrawal), `adapters/interest-artifact-stub/src/index.ts` (`ArtifactSignalSource` emitting coarse transitions only) + `adapters/interest-artifact-stub/test/artifact.test.ts`; export guards from `packages/interest-lab/src/index.ts` (depends on T005, T019)

**Checkpoint**: all guardrails hold; the §14.4.3 acceptance suite is green.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T033 **[FINAL — FLAGGED FOR HUMAN RECONCILE]** Add the four new packages to the root `tsconfig.json` `references` array (`packages/interest-lab`, `adapters/interest-repo-memory`, `adapters/interest-probe-catalog`, `adapters/interest-assent-stub`, `adapters/interest-artifact-stub`) so `tsc -b` builds them. **This is the only edit to a shared root file; open as its own reviewable change.**
- [ ] T034 [P] Add `packages/interest-lab/README.md` (public API + ports usage + "rules-engine only; bandit/Bayesian model deferred; synthetic-only" note), mirroring `packages/learning-loop/README.md`
- [ ] T035 [P] Add a `demo` script under `adapters/interest-probe-catalog` (or a `packages/interest-lab` example) that builds a Lab, feeds a synthetic event stream, and prints the coverage matrix + a proposed-vs-authored hypothesis transition
- [ ] T036 Run full verification: `pnpm --filter @gt100k/interest-lab test`, `pnpm test`, `pnpm typecheck` (`tsc -b`, after T033), `pnpm lint` (Biome) — all green before PR

---

## Dependencies & Execution Order

- **Setup (T001–T003)** → **Foundational (T004–T007, blocks all stories)** → **US1 (T008–T015)** → **US2 (T016–T020)** → **US3 (T021–T029)** → **US4 (T030–T032)** → **Polish (T033–T036)**.
- US3 depends on US2 (`summarizeSignals` feeds `evaluateCandidateGate`). US4's acceptance suite depends on US1–US3. US1 is independent of US2/US3 and is the MVP.
- **T033 must run last** (touches a shared root file) and is flagged for human reconcile.

## Parallel Opportunities

- Setup: T002/T003 in parallel after T001.
- Foundational: T004/T005/T006 in parallel (distinct files) before T007.
- US1 tests T008/T009/T010 in parallel; T014 (catalog adapter) parallel with T011–T013.
- US2 tests T016/T017 in parallel.
- US3 tests T021/T022/T023/T024/T025 in parallel; then T026–T029.
- US4 tests T030/T031 in parallel.
- Polish: T034/T035 in parallel; T033 alone; T036 last.

## Implementation Strategy

- **MVP = Setup + Foundational + US1** (the deterministic rules-engine Lab with honest coverage) → validate against SC-001/SC-002 and §14.4.3 #3/#5 → then US2 (clean signal families) → US3 (hypothesis + lifecycle) → US4 (guardrails) → Polish.
- Test-first: write each phase's tests and confirm they FAIL before implementing. Commit per task or logical group; one PR per increment (governed flow). Synthetic-only; consent/admissions stubbed. Learned Bayesian model + bandit are **shadow/deferred** (out of MVP).

## Summary

- **Total tasks**: 36 (T001–T036)
- **US1**: 8 (T008–T015) · **US2**: 5 (T016–T020) · **US3**: 9 (T021–T029) · **US4**: 3 (T030–T032) · Setup 3 · Foundational 4 · Polish 4
- **MVP scope**: Setup + Foundational + **US1** (rules-engine balanced Lab + coverage matrix).
- **Deferred (noted)**: learned Bayesian `InterestHypothesis` model + contextual bandit (shadow-only; PASS-009 propensity/burden logging) — interfaces (`OfferDecisionLog`, shadow proposals) are forward-compatible.
- **Parallel-safety**: all work in `packages/interest-lab` + `adapters/interest-*`; the only shared-root edit is **T033** (root `tsconfig.json` references), flagged for human reconcile.
