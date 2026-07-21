# Tasks: Interest Lab / Passion (Rules-Engine MVP)

**Input**: Design documents from `specs/003-interest-lab/`
**Prerequisites**: plan.md (incl. embedded *Data Model* + *Domain Contracts*), spec.md (incl. *Scope Fence*, *Phasing P0…P7*, *Seed Fixtures*, *Golden Values*)
**Tests**: INCLUDED — the constitution makes tests part of "done". The embedded *Contract test obligations* + spec *Golden Values* (G1–G6) define explicit, exact-value obligations mapped to PASS-00x + IL-xxx + §14.4.3 #1–#7 + SC-001…016. **Write tests first and ensure they FAIL before implementing.**

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete-task dependency)
- **[Story]**: US1 / US2 / US3 / US4 (setup, foundational, fixtures, polish carry no story label)
- Every task names an exact file path. Phase headers map to spec *Phasing* P0…P7. Loop gate per phase = `pnpm typecheck` + `pnpm test`.

## Path conventions (from plan.md — TS monorepo, NEW dirs only)

- Domain: `packages/interest-lab/src/`, tests `packages/interest-lab/test/` (fixtures under `packages/interest-lab/test/fixtures/`)
- Adapters: `adapters/interest-repo-memory/`, `adapters/interest-probe-catalog/`, `adapters/interest-assent-stub/`, `adapters/interest-artifact-stub/`
- **Parallel-safety**: create only the above new dirs. Do **not** edit shared root files. `pnpm-workspace.yaml`, `vitest.config.ts`, and the Biome `lint` script already glob `packages/*`/`adapters/*`. The **only** shared-root edit is the root `tsconfig.json` `references` array — the **final flagged task (T037)**, opened as its own reviewable change.

---

## Phase P0: Setup (package scaffolding + green smoke — new dirs only)

- [ ] T001 Scaffold `@gt100k/interest-lab` at `packages/interest-lab/package.json` (mirror `packages/learning-loop/package.json`: `"type":"module"`, `main`/`types`→`./src/index.ts`, `exports`, `test`:`vitest run`), an empty barrel `packages/interest-lab/src/index.ts`, and `packages/interest-lab/test/smoke.test.ts` (the trivial `1+1` smoke from spec *Stack + Commands* so the gate is green from iteration 1)
- [ ] T002 [P] Add `packages/interest-lab/tsconfig.json` extending `../../tsconfig.base.json` (`rootDir:"."`, `outDir:"dist"`, `include:["src/**/*.ts","test/**/*.ts"]`)
- [ ] T003 [P] Scaffold adapter packages: `adapters/interest-repo-memory/{package.json,tsconfig.json}`, `adapters/interest-probe-catalog/{package.json,tsconfig.json}`, `adapters/interest-assent-stub/{package.json,tsconfig.json}`, `adapters/interest-artifact-stub/{package.json,tsconfig.json}` (each mirrors `adapters/repo-memory`: dep `@gt100k/interest-lab: workspace:*`, tsconfig `references` → `../../packages/interest-lab`)

**Checkpoint (P0 gate)**: `pnpm install` resolves the workspace; `pnpm --filter @gt100k/interest-lab test` runs the smoke test green.

---

## Phase P1: Foundational types & ports (Blocking Prerequisites)

**⚠️ CRITICAL**: no fixtures or user-story work begins until this phase is complete.

- [ ] T004 [P] Define enums/vocabularies + core value types in `packages/interest-lab/src/probe.ts` (`WorkMode` (9 verbs), `DifficultyBand`, `AudienceCondition`, `SocialMode`, `SafetyClass`, `Provenance`, `Probe`, `ProbeFamily`; `Domain` is a `string` alias — catalog-supplied, no fixed list) per plan *Data Model*
- [ ] T005 [P] Define ports in `packages/interest-lab/src/ports.ts` (`InterestHypothesisRepository`, `ProbeCatalog`, `AssentRecordPort`, `ArtifactSignalSource`, `OfferDecisionLog`, `Clock`; plus the **deferred, not-implemented** `OfferSelector` shape reserved for the bandit — IL-021) per plan *Domain Contracts*
- [ ] T006 [P] Define event/signal/hypothesis types in `packages/interest-lab/src/events.ts` + `packages/interest-lab/src/hypothesis.ts` (`EventType` incl. `ARTIFACT_COMPETENCE`, `EngagementEvent`, `SignalFamily`, `SignalSummary` (shape per G4), `HypothesisState`, `ChildPosition`, `InterestHypothesis`, `HypothesisRevision`, `CoverageMatrix` (shape per G2), `ForbiddenPurpose`, `GuideReview`)
- [ ] T007 Export all foundational types from `packages/interest-lab/src/index.ts`

**Checkpoint (P1 gate)**: types + ports compile (`tsc -b` locally within the package).

---

## Phase P2: Seed fixtures (in-repo, normative)

- [ ] T008 [P] Author the probe-catalog fixtures in `adapters/interest-probe-catalog/src/index.ts` exactly per spec *Seed Fixtures*: `CATALOG_GOLDEN_V1` (24 families → 20 eligible + p21–p24 filtered controls), `CATALOG_GAPPY_V1` (8 eligible, deliberately incomplete), `CATALOG_FAMILY_V1` (one family, 3 variants); add `adapters/interest-probe-catalog/test/catalog.test.ts` asserting counts (20 eligible in golden; 8 in gappy; exact domain/work-mode tallies from G1)
- [ ] T009 [P] Author the event-stream fixture `EVENTS_GOLDEN_V1` (10 events) in `packages/interest-lab/test/fixtures/events.ts` exactly per spec *Seed Fixtures* (incl. `e7` `optionalReflection:true` for the withdrawal test)

**Checkpoint (P2 gate)**: fixtures load and the catalog test asserts the eligible counts.

---

## Phase P3: User Story 1 — Generate a balanced Interest Lab (Priority: P1) 🎯 MVP

**Goal**: a deterministic rules engine assembles a safe, prerequisite-valid, balanced 18–24 probe Lab with a permanent exploration floor, provenance per offer, and an explicit coverage matrix that names each gap.

**Independent Test**: with shadow/adaptive selection disabled, `buildLab(CATALOG_GOLDEN_V1, freshLearner, {seed:42})` == spec **G1**; its coverage matrix == spec **G2**; the gappy catalog's coverage == spec **G3**.

### Tests (write first, ensure they fail)

- [ ] T010 [P] [US1] Contract + golden test for `buildCoverageMatrix` in `packages/interest-lab/test/coverage.test.ts`: complete case deep-equals **G2**; gappy case deep-equals **G3** (exact gap strings, aggregated top-level `gaps` in dimension order); assert **no** `score`/`confidence` field (IL-005, §14.4.3 #3, SC-002)
- [ ] T011 [P] [US1] Golden test for `buildLab` in `packages/interest-lab/test/offer.test.ts`: `CATALOG_GOLDEN_V1` ⇒ 20 offers, exact per-domain/per-work-mode/cross-cutting counts (**G1**), `explorationReserved===20`, every offer `provenance==="RULE"` + non-empty `reason`, ≥2 eligible/choice; **byte-identical Lab for seeds {1,42,999}** (PASS-002, IL-003/018/019, §14.4.3 #5, SC-001)
- [ ] T012 [P] [US1] Contract test for eligibility + variant selection in `packages/interest-lab/test/offer.test.ts`: p21–p24 (non-`cleared` / prereq-gated) never offered; `CATALOG_FAMILY_V1` ⇒ ≤1 variant per family per choice point; selection-under-surplus picks a coverage-satisfying subset by the documented order (PASS-003, IL-002/018)

### Implementation

- [ ] T013 [US1] Implement `packages/interest-lab/src/catalog.ts` (eligibility filter: prerequisite-valid + `cleared`; family-variant selection ≤1/family/choice; fixed total order = `stableSort(familyId)` then seeded rotation) (depends on T004/T005)
- [ ] T014 [US1] Implement `packages/interest-lab/src/coverage.ts` (`buildCoverageMatrix` — enumerated met/gap per dimension incl. `probeCount`, exact gap strings, aggregated `gaps`, no scalar score) (depends on T004)
- [ ] T015 [US1] Implement `packages/interest-lab/src/offer.ts` (`buildLab` — deterministic seeded rules engine: coverage-greedy selection, exploration floor = count of dormant-domain offers, provenance+reason per offer; emits an `OfferDecisionLog` entry: eligible set, policy version, coverage constraints; accepts an optional `selector` that is unused in the MVP) (depends on T013, T014)
- [ ] T016 [US1] Upgrade `packages/interest-lab/test/smoke.test.ts` to assert G1 determinism (20 offers; identical across seeds {1,42,999}; coverage deep-equals G2) so the smoke doubles as the determinism guard
- [ ] T017 [US1] Export offer/coverage/catalog API from `packages/interest-lab/src/index.ts`

**Checkpoint (P3 gate)**: the rules engine produces the exact golden Lab + coverage matrix. **MVP is demonstrable here.**

---

## Phase P4: User Story 2 — Distinguish voluntary from prompted engagement (Priority: P2)

**Goal**: a typed event model separates voluntary/discretionary return from prompted return and computes separated, accessibility-safe signal families.

**Independent Test**: `summarizeSignals(EVENTS_GOLDEN_V1)` == spec **G4**; prompted adds 0 to `voluntaryReturn`; assistive/safety never lower a signal; paired assisted/unaided → identical summary; withdrawn `e7` → `scopeAuthorship:0`.

### Tests (write first, ensure they fail)

- [ ] T018 [P] [US2] Contract test for `recordEvent` in `packages/interest-lab/test/events.test.ts` (idempotent by id; `PROMPTED_RETURN` requires `interventionContext` and never increments `voluntary_return`; 7/30-day horizons correct) (PASS-004/005, §14.4.3 #4, SC-005)
- [ ] T019 [P] [US2] Golden test for `summarizeSignals` in `packages/interest-lab/test/signals.test.ts`: `EVENTS_GOLDEN_V1` deep-equals **G4**; `prompt_dependence`/`contextEffects` absent from `familiesPresent`; paired assistive/unaided identical (SC-007); parent `familyContext` contributes 0 to families/magnitudes (SC-015); withdrawn `e7` ⇒ `scopeAuthorship:0` + `self_authored_scope` dropped (SC-006) (PASS-006, §14.4.3 #6/#7)

### Implementation

- [ ] T020 [US2] Implement `recordEvent` in `packages/interest-lab/src/events.ts` (idempotent; enforce `interventionContext` on `PROMPTED_RETURN`; tag assistive/safety; honor `withdrawn`) (depends on T006)
- [ ] T021 [US2] Implement `packages/interest-lab/src/signals.ts` (`summarizeSignals` — separated families; delayed voluntary @7/@30; accessibility-safe; `prompt_dependence`/`contextEffects` as discount; exclude withdrawn/optional reflections; `familyContext` is a distinct source contributing 0) (depends on T020)
- [ ] T022 [US2] Export event/signal API from `packages/interest-lab/src/index.ts`

**Checkpoint (P4 gate)**: raw engagement becomes the exact golden separated signal summary.

---

## Phase P5: User Story 3 — Versioned InterestHypothesis + lifecycle (Priority: P3)

**Goal**: an append-only, versioned hypothesis with a lifecycle state machine, the `CANDIDATE_SPINE` promotion gate, the missing-data prohibition, and shadow-only proposals that only a guide-authored revision makes operative.

**Independent Test**: `evaluateCandidateGate` == spec **G5** table; state transitions == spec **G6**; missing-data window never lowers state/uncertainty; all revisions replayable by version.

### Tests (write first, ensure they fail)

- [ ] T023 [P] [US3] Golden test for `evaluateCandidateGate` in `packages/interest-lab/test/state-machine.test.ts`: all five rows of **G5** (G4 summary → eligible; novelty `[]` → the exact 3-item `missing`; competence-only → `["no delayed-discretionary signal"]`; no-artifact → `["no artifact/competence signal"]`; minimal pass → eligible) (IL-008, §14.4.3 #1/#2, SC-003/004/011)
- [ ] T024 [P] [US3] Contract test for `applyMissingData` in `packages/interest-lab/test/state-machine.test.ts` (state + uncertainty unchanged per **G6**; low-interest inference refused without a human rule-out flag) (IL-009, SC-010)
- [ ] T025 [P] [US3] Golden test for proposal vs authorship + legal transitions in `packages/interest-lab/test/state-machine.test.ts`: `proposeTransition` → `guideReview:null, proposedBy:"RULE", operative:false`; `authorRevision` → `operative:true, version+1` (**G6**); illegal transition (e.g. `EXPLORING→ACTIVE`) rejected naming the pair; `CONTESTED→PARKED→REOPENED` path legal (IL-007/011, SC-009/016)
- [ ] T026 [P] [US3] Contract test for hypothesis record in `packages/interest-lab/test/hypothesis.test.ts` (append-only + versioned + bitemporal replay; uncertainty as interval/grade never scalar; disconfirming beside supporting; **co-primary** ≥2 `candidateDomains` valid (SC-013); **disagreement** `DISAGREE`+model evidence both retained (SC-014)) (IL-006/012)
- [ ] T027 [P] [US3] Contract test for the in-memory repository in `adapters/interest-repo-memory/test/repo.test.ts` (append-only, `currentFor`, `revisions` replay incl. the `CONTESTED→PARKED→REOPENED` chain, SC-016)

### Implementation

- [ ] T028 [US3] Implement `packages/interest-lab/src/state-machine.ts` (`evaluateCandidateGate`, legal-transition table, `proposeTransition`, `authorRevision`, `applyMissingData`) (depends on T006, T021)
- [ ] T029 [US3] Implement hypothesis revision constructors/current-view helpers in `packages/interest-lab/src/hypothesis.ts` (append-only, bitemporal current view, uncertainty interval/grade, multi-candidate + disagreement support) (depends on T006)
- [ ] T030 [US3] Implement `adapters/interest-repo-memory/src/index.ts` (`InMemoryInterestHypothesisRepository`: append-only, deep-copy on write like `adapters/repo-memory`) (depends on T005)
- [ ] T031 [US3] Export hypothesis/state-machine API from `packages/interest-lab/src/index.ts`

**Checkpoint (P5 gate)**: the evidence record + lifecycle works headless with the golden gate/transition outcomes enforced.

---

## Phase P6: User Story 4 — Hard guardrails & child agency (Priority: P4)

**Goal**: enforce the `G`-class boundaries — purpose guard (PASS-010), PASS-006/007/008, team-artifact rule — at typed boundaries.

**Independent Test**: every forbidden-purpose read is denied; a withdrawn optional reflection is absent from the next summary + replay; an artifact payload with raw content is rejected; a team artifact cannot become individual evidence without solo proof.

### Tests (write first, ensure they fail)

- [ ] T032 [P] [US4] Contract test in `packages/interest-lab/test/guards.test.ts` for `guardRead` (deny-by-default for all five forbidden purposes; auditable denial — SC-008), `promoteTeamArtifact` (refuse individual credit w/o solo proof, accept with — SC-012), and `acceptArtifactSignal` (reject screen recordings/raw keystrokes/unrelated content; accept coarse transitions — PASS-007); plus `adapters/interest-assent-stub/test/*` and `adapters/interest-artifact-stub/test/artifact.test.ts`
- [ ] T033 [P] [US4] Acceptance suite in `packages/interest-lab/test/acceptance.test.ts` mapping §14.4.3 #1–#7 end-to-end over the in-memory/stub adapters (incl. withdrawn-reflection disappears from next build + replay — PASS-008, §14.4.3 #6, SC-006)

### Implementation

- [ ] T034 [US4] Implement `packages/interest-lab/src/guards.ts` (`guardRead`, `promoteTeamArtifact`, `acceptArtifactSignal`), `adapters/interest-assent-stub/src/index.ts` (stub `AssentRecordPort` + withdrawal), `adapters/interest-artifact-stub/src/index.ts` (`ArtifactSignalSource` emitting coarse transitions only); export guards from `packages/interest-lab/src/index.ts` (depends on T005, T021)

**Checkpoint (P6 gate)**: all guardrails hold; the §14.4.3 acceptance suite is green.

---

## Phase P7: Polish & Cross-Cutting

- [ ] T035 [P] Add `packages/interest-lab/README.md` (public API + ports usage + "rules-engine only; bandit/Bayesian model deferred; synthetic-only; no scalar passion score" note), mirroring `packages/learning-loop/README.md`
- [ ] T036 [P] Add a `demo` script under `adapters/interest-probe-catalog` (or a `packages/interest-lab` example) that builds the golden Lab, feeds `EVENTS_GOLDEN_V1`, and prints the coverage matrix + a proposed-vs-authored hypothesis transition
- [ ] T037 **[FINAL — FLAGGED FOR HUMAN RECONCILE]** Add the five new packages to the root `tsconfig.json` `references` array (`packages/interest-lab`, `adapters/interest-repo-memory`, `adapters/interest-probe-catalog`, `adapters/interest-assent-stub`, `adapters/interest-artifact-stub`) so `tsc -b` builds them. **This is the only edit to a shared root file; open as its own reviewable change.**
- [ ] T038 Run full verification (after T037): `pnpm --filter @gt100k/interest-lab test`, `pnpm test`, `pnpm typecheck` (`tsc -b`), `pnpm lint` (Biome) — all green before PR

---

## Dependencies & Execution Order

- **P0 Setup (T001–T003)** → **P1 Foundational (T004–T007, blocks all)** → **P2 Fixtures (T008–T009)** → **P3 US1 (T010–T017)** → **P4 US2 (T018–T022)** → **P5 US3 (T023–T031)** → **P6 US4 (T032–T034)** → **P7 Polish (T035–T038)**.
- US3 depends on US2 (`summarizeSignals` feeds `evaluateCandidateGate`). US4's acceptance suite depends on US1–US3. US1 is independent of US2/US3 and is the MVP. Fixtures (P2) block the golden tests in P3–P5.
- **T037 must run before T038** and is the only shared-root edit (flagged for human reconcile).

## Parallel Opportunities

- P0: T002/T003 in parallel after T001.
- P1: T004/T005/T006 in parallel (distinct files) before T007.
- P2: T008/T009 in parallel.
- P3 tests T010/T011/T012 in parallel; then T013–T015; T016/T017 after.
- P4 tests T018/T019 in parallel; then T020–T022.
- P5 tests T023/T024/T025/T026/T027 in parallel; then T028–T031.
- P6 tests T032/T033 in parallel; then T034.
- P7: T035/T036 in parallel; T037 alone; T038 last.

## Implementation Strategy

- **MVP = P0 + P1 + P2 + P3** (the deterministic rules-engine Lab with honest coverage) → validate against SC-001/SC-002 and golden G1/G2/G3 → then P4 (clean signal families, G4) → P5 (hypothesis + lifecycle, G5/G6) → P6 (guardrails) → P7 (polish).
- Test-first: write each phase's tests and confirm they FAIL before implementing. Commit per task or logical group; one PR per increment (governed flow). Synthetic-only; consent/admissions stubbed. Learned Bayesian model + bandit are **shadow/deferred** (out of MVP).

## Summary

- **Total tasks**: 38 (T001–T038)
- **Setup 3 · Foundational 4 · Fixtures 2 · US1 8 · US2 5 · US3 9 · US4 3 · Polish 4**
- **MVP scope**: P0 + P1 + P2 + **P3 (US1)** (rules-engine balanced Lab + coverage matrix), validated against golden G1/G2/G3.
- **Golden gates**: G1 (Lab) · G2 (coverage complete) · G3 (coverage gappy) · G4 (signal summary) · G5 (candidate gate) · G6 (state transitions) — all exact-equality tests.
- **Deferred (noted)**: learned Bayesian `InterestHypothesis` model + contextual bandit (shadow-only; PASS-009 propensity/burden logging; `OfferSelector` port reserved) — interfaces forward-compatible.
- **Parallel-safety**: all work in `packages/interest-lab` + `adapters/interest-*`; the only shared-root edit is **T037** (root `tsconfig.json` references), flagged for human reconcile.
