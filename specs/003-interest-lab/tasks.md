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

---
---

# Part II — Interest Lab UI Tasks (child Curiosity Quest World + guide Hypothesis Console)

**Input**: Design documents from `specs/003-interest-lab/` **Part II** — spec.md (§U0 scope, §U6 motion table, §U8 golden values incl. the 3D scene/tier goldens, §U9 phasing P8…P15, §U10 SC-UI-01…18), plan.md (Part II), research.md, data-model.md, contracts/interest-lab-ui.md, quickstart.md.
**Prerequisites**: Part I (`@gt100k/interest-lab` + `adapters/interest-*` + fixtures) present and green.
**Tests**: INCLUDED and **test-first** for the view package — the constitution makes tests part of "done" and `contracts/interest-lab-ui.md` defines explicit obligations. Write each test first with the **golden values from spec §U8**, ensure it FAILS, then implement. The view package is fully testable **without a GPU** (it emits scene numbers, never imports `three`). The app is verified via `next build` + the seeded smoke + the [quickstart](./quickstart.md) acceptance walkthrough.

**Child-facing note**: The child Quest World is a child-facing surface, so the buildable child-safety guardrails apply — reduced-motion equal mode (the `board-2d` tier), WCAG 2.2 AA (DOM-native; 3D `<Canvas>` `aria-hidden`, DOM quest ledger operable), age-band staging, no dark patterns (incl. no time/mastery-gated island unlocks/levels), help-never-penalizes, no forbidden-purpose fields, never a fixed label / scalar passion score / floating score in the world. Encoded as UI-FR-001…021 + SC-UI-01…18.

## Path conventions (Part II — from plan.md, NEW dirs only)

- View package: `packages/interest-lab-view/src/`, tests `packages/interest-lab-view/test/`. **Pure + GPU-free** (no `three`/`react`/`@react-three/*` import, no `Math.random`).
- App: `apps/interest-lab/` (Next.js App Router; package `@gt100k/interest-lab-app`; DOM motion = **`motion@^12`**; 3D world = **react-three-fiber + drei + three**; the `<Canvas>` mounts client-only, `aria-hidden`).
- **Do NOT modify** Part I (`packages/interest-lab`, `adapters/interest-*`) beyond consuming its public API, `apps/student-compass`, or shared root files (except the single final human-reconciled task **U-ROOT**).
- Phases map to **spec §U9 (P8…P15)**. Loop gate per phase = `pnpm typecheck` + `pnpm test`; app phases add `pnpm --filter @gt100k/interest-lab-app build` + smoke + walkthrough. The 3D phases (P10/P11/P14) never block the gate — the scene *numbers* are proven in P9b without a GPU.

---

## Phase P8: UI foundation & green-from-first-increment (spec §U9 P8)

- [ ] **U001** Scaffold the view package `packages/interest-lab-view/package.json` (`name:@gt100k/interest-lab-view`, `"type":"module"`, `main`/`types`/`exports`→`./src/index.ts`, `test`:`vitest run`, dep `@gt100k/interest-lab: workspace:*`) — mirror `packages/interest-lab/package.json`. **No** `three`/`react` dep (the package is GPU-free).
- [ ] **U002** [P] Add `packages/interest-lab-view/tsconfig.json` extending `../../tsconfig.base.json` (`rootDir:"."`, `outDir:"dist"`, include `src/**/*.ts`, `test/**/*.ts`).
- [ ] **U003** Define all view types in `packages/interest-lab-view/src/model.ts` per data-model.md — DOM: `AgeBand`, `DeviceCaps`, `RenderTier`, `QualityTier`, `ChildStaging`, `MotionToken`, `ProbeCardView`, `ProbePickerView`, `CellView`, `DimensionRailItem`, `CoverageMatrixView`, `ExplanationCard`, `ExplanationsView`, `MarkerView`, `ReturnTimelineView`, `GateChecklist`, `LifecycleStateView`, `RevisionHistoryView`; 3D: `QuestMarkerView`, `IslandView`, `CameraView`, `SceneView`, `ConstellationStar`, `EvidenceConstellationView`; composed: `InterestLabView` (reusing Part-I types). **No `score`/`confidence`/`passionScore`/`verdict`/`label`/`rank`/`percentile`/`outOf`/`price` field on ANY view type incl. `SceneView`/`QuestMarkerView`/`ConstellationStar` (guardrail by construction).**
- [ ] **U004** [P] Add the exact constant registries as exported value-only modules (resolvers land in their phase): `art.ts` (`PALETTE`/`TYPOGRAPHY`/`HUE_RAMP`, §U8.2/§U8.3/§U8.5), `motion.ts` (`MOTION`/`EASINGS`, §U8.4), `glyphs.ts` (`WORK_MODE_GLYPHS`, §U8.6), `scene.ts` (`SCENE3D`/`CAMERA3D`/`QUALITY_TIERS`/`RENDER_TIERS`, §U8.14/§U8.16).
- [ ] **U005** Create `packages/interest-lab-view/src/index.ts` re-exporting the public surface (types + registries + resolvers) as they are added.
- [ ] **U006** [P] Seeded smoke test `packages/interest-lab-view/test/smoke.test.ts`: import the package; assert `PALETTE`/`MOTION`/`EASINGS`/`HUE_RAMP`/`WORK_MODE_GLYPHS`/`SCENE3D`/`CAMERA3D`/`QUALITY_TIERS` are non-empty and `resolveMotion("press",{reducedMotion:false}).durationMs === 120` (a trivial `resolveMotion` stub is fine until P9; keep the gate green from iteration 1).
- [ ] **U007** [P] Scaffold the app `apps/interest-lab/package.json` (`name:@gt100k/interest-lab-app`, scripts `dev`/`build`/`start`, deps `@gt100k/interest-lab` + `@gt100k/interest-lab-view` `workspace:*`, `next ^14.2.15`, `react`/`react-dom ^18.3.1`, **`motion ^12`**, **`three ^0.169.0`**, **`@react-three/fiber ^8.17.10`**, **`@react-three/drei ^9.114.0`**; dev `@types/react*`, `@types/three ^0.169.0`) — mirror `apps/student-compass/package.json` + the 3D/motion deps. *(Optional non-breaking full-tier bloom `@react-three/postprocessing ^2.16.3` + `postprocessing ^6.36.3` may be added in P14; not required for the gate.)*
- [ ] **U008** [P] Add `apps/interest-lab/next.config.mjs` (`transpilePackages:["@gt100k/interest-lab","@gt100k/interest-lab-view"]`) and `apps/interest-lab/tsconfig.json` mirroring `apps/student-compass/tsconfig.json` (noEmit, jsx preserve, DOM libs).
- [ ] **U009** [P] Add `apps/interest-lab/app/layout.tsx`, `apps/interest-lab/app/page.tsx` (placeholder shell), `apps/interest-lab/app/globals.css` (the §U8.2/§U8.3 `PALETTE`/`TYPOGRAPHY` CSS custom properties incl. the system-font fallback stacks; `@media (prefers-reduced-motion: reduce)`, `@media (prefers-reduced-transparency: reduce)`, `.plain-mode`, `:focus-visible` `--focus` rings, ≥4.5:1 contrast tokens), `apps/interest-lab/.env.local.example` (spec §U11 `NEXT_PUBLIC_*` incl. `NEXT_PUBLIC_RENDER_TIER=auto`), and `apps/interest-lab/.gitignore` (`.env.local`, `.next`).

> No root `vitest.config.ts`, `biome.json`, or `pnpm-workspace.yaml` edits: existing globs already cover `packages/interest-lab-view/test/**` and `packages/*`/`apps/*`. Root `tsconfig.json` reference is deferred to **U-ROOT**.

**Checkpoint (P8 gate)**: `pnpm typecheck` + `pnpm test` green (smoke passes).

---

## Phase P9: Child quest view model + 2D card-constellation board (UI-US1) 🎯 MVP-floor (spec §U9 P9)

**Goal**: the domain Lab renders as the deterministic quest view model + a 2D card-constellation board (Tier C) with satisfying pick/press motion (`motion@^12`), age-band staging, and a reduced-motion equal mode. This is the accessible/fallback tier + AT source of truth.

### Tests first (write, ensure they FAIL)

- [ ] **U010** [P] [US1] `packages/interest-lab-view/test/motion.test.ts` — `resolveMotion` golden table (spec §U8.4) incl. the 3D kinds (`driftIn`/`islandFloat`/`islandFocus`/`markerGlow`/`motes`/`constellation`); `reducedMotion:true` ⇒ `mode:"reduced"`, `easing:"linear"`, reduced durations; every kind has a reduced equivalent; the only spring is `pick`; no reveal uses `scale(0)` (UI-FR-010, SC-UI-08).
- [ ] **U011** [P] [US1] `packages/interest-lab-view/test/art.test.ts` — `PALETTE`/`TYPOGRAPHY` exact tokens (spec §U8.2/§U8.3) with the contrast guarantees; `resolveDomainHue` golden for the 8 seed domains (spec §U8.5); unknown domain throws (UI-FR-011/020, SC-UI-09).
- [ ] **U012** [P] [US1] `packages/interest-lab-view/test/staging.test.ts` — `resolveChildStaging` exact band tokens (spec §U8.7) incl. `worldCameraMode`; 6-8 `showRawNumbers:false` + `comparisonDefault:"off"` + `worldCameraMode:"auto-tour"`; underlying state identical across bands (UI-FR-005, SC-UI-02).
- [ ] **U013** [P] [US1] `packages/interest-lab-view/test/probe-picker.test.ts` — `buildProbePickerView(G1 Lab, {history:[], band:"9-11"})` matches spec §U8.8: 20 cards, `provenance:"RULE"`, non-empty `whyCopy`, `domainHue`/`workModeGlyph` correct, `returnState:"new"`, `helpAffordance:true`, `choicePointsMinEligible >= 2`; **no** price/score/rank/percentile/verdict/label key (UI-FR-002/017, SC-UI-01).

### Implementation

- [ ] **U014** [US1] Implement `resolveMotion` in `packages/interest-lab-view/src/motion.ts` (§U8.4) and `resolveDomainHue` in `art.ts` (§U8.5); export from `index.ts`.
- [ ] **U015** [US1] Implement `resolveChildStaging` in `packages/interest-lab-view/src/staging.ts` (§U8.7).
- [ ] **U016** [US1] Implement `buildProbePickerView` in `packages/interest-lab-view/src/picker.ts` (offers→cards; provenance+whyCopy band-appropriate and never a fixed label; hue+glyph; `visibleQuests`=first `maxVisibleQuests`; help affordance always present) (depends on U014/U015).
- [ ] **U017** [US1] First `buildInterestLabView` (child surface) in `packages/interest-lab-view/src/view.ts` composing `{ surface:"child", probePicker, flags, presentation }` (scene added in P9b); export from `index.ts`.
- [ ] **U018** [P] [US1] App wiring: `apps/interest-lab/app/seed.ts` (feed `CATALOG_GOLDEN_V1` through Part-I `buildLab` + the view; no external fetch), `apps/interest-lab/app/motion/useMotionToken.ts` (bridge `resolveMotion` + **`motion/react`** `useReducedMotion`), `apps/interest-lab/app/ui/Glyph.tsx` (inline SVGs for `WORK_MODE_GLYPHS` + state glyphs, **no emoji**), `apps/interest-lab/app/ui/deviceCaps.ts` (client feature-detect → `DeviceCaps`).
- [ ] **U019** [US1] `apps/interest-lab/app/child/QuestLedger.tsx` (the accessible operable DOM list of card-buttons — owns focus/pick), `QuestCard.tsx`, `Board2D.tsx` (the `board-2d` tier: domain-constellation cards), `QuestTray.tsx` — render `ProbePickerView` (hue + work-mode glyph + difficulty/social/audience icon+text + why/provenance + help affordance), staggered `cardEnter`, hover-lift (`@media (hover:hover)`), press feedback (scale 0.97 on pointer-down), and the **pick momentum spring** into the tray via `motion@^12` (interruptible; reduced-motion crossfade). Fully keyboard-operable with visible focus.
- [ ] **U020** [US1] `apps/interest-lab/app/InterestLabClient.tsx` (`"use client"`) wiring the view-model state + flags (reduced-motion via `prefers-reduced-motion` + `NEXT_PUBLIC_REDUCED_MOTION_DEFAULT`, plain-mode, age band, surface, `deviceCaps`) + the control cluster (`app/ui/controls/` incl. a render-tier override); `apps/interest-lab/app/page.tsx` renders it (child surface, `board-2d` first). Age-band switch re-renders via `resolveChildStaging`.

**Checkpoint (P9 gate = MVP-floor)**: P8 gate + view goldens (§U8.4–§U8.8) + `pnpm --filter @gt100k/interest-lab-app build` + smoke + walkthrough steps 1–3.

---

## Phase P9b: Scene view model (GPU-free, deterministic) (spec §U9 P9b)

**Goal**: the 3D world's positions/camera/tiers exist as pure, Vitest-tested numbers so P10 renders from proven constants. **No app 3D yet.**

### Tests first (write, ensure they FAIL)

- [ ] **U021** [P] `packages/interest-lab-view/test/scene.test.ts` — `resolveIslandLayout` golden positions for the 8 seed domains (§U8.13, ±0.001), catalog-order-derived (no hardcoded domain→position map), deterministic; `resolveQuestPlacement` golden for `making` (§U8.13); `resolveCamera3D(null,…)` = home framing (`drift-in`/`cut`), focused island eased (`ease`/`cut`) (§U8.14); `buildSceneView` marker↔card parity by `probeId` (§U8.18); no `score`/`rank`/`price` on `SceneView`/`IslandView`/`QuestMarkerView` (SC-UI-13).
- [ ] **U022** [P] `packages/interest-lab-view/test/tiers.test.ts` — `resolveRenderTier`/`resolveQualityTier` match the §U8.16 golden case table (full / lite / board-2d selection); render tier is presentation-only (SC-UI-14).

### Implementation

- [ ] **U023** Implement `resolveIslandLayout`, `resolveQuestPlacement`, `resolveCamera3D`, `resolveRenderTier`, `resolveQualityTier`, `buildSceneView` in `packages/interest-lab-view/src/scene.ts` (§U8.13/§U8.14/§U8.16/§U8.18); export from `index.ts`.
- [ ] **U024** Extend `buildInterestLabView` (`view.ts`) to compose the `scene` block + the `presentation` block (`scene3d`/`camera3d`/`renderTier`/`quality`/`motionOf`); keep it presentation-only (state unchanged).

**Checkpoint (P9b gate)**: P9 gate + scene/tier goldens (§U8.13/§U8.14/§U8.16/§U8.18).

---

## Phase P10: The 3D Curiosity Quest World (UI-US2) 🎯 MVP (3D-UI phase) (spec §U9 P10)

**Goal**: the r3f world renders `SceneView` — floating islands, glowing markers, dusk light, idle motion, a drifting/focusing camera — with the DOM quest ledger as the operable/accessible surface and a clean fallback to `board-2d`.

- [ ] **U025** [US2] `apps/interest-lab/app/child/world3d/glow-texture.ts` — deterministic in-app additive radial-gradient sprite (canvas 2D → `THREE.CanvasTexture`); **no external fetch**.
- [ ] **U026** [US2] `apps/interest-lab/app/child/world3d/World3D.tsx` — `next/dynamic(..., {ssr:false})` host mounting `<Canvas aria-hidden="true">` with `SCENE3D` lights/fog/tone-mapping, drei `<AdaptiveDpr>` (DPR cap from `quality.dprCap`), and the scene graph; destroy the renderer on unmount; **zero console/WebGL errors**.
- [ ] **U027** [US2] `Island.tsx` (procedural low-poly island via three primitives, hue-tinted, drei `<Float>` idle per `islandFloat`), `QuestMarker.tsx` (glowing marker: emissive `markerEmissive*` + additive halo sprite; hover raise/brighten; press `scale 0.97`; **pick hop** via the reserved spring), `Motes.tsx` (drei `<Sparkles>`, count from `quality.motes`).
- [ ] **U028** [US2] `CameraRig.tsx` — establishing `driftIn` on enter; `islandFocus` ease to the focused island (mirrors DOM focus from the ledger; reduced-motion `cut`); clamped drei `<OrbitControls>` (enablePan/zoom false, polar/azimuth clamps) only for `worldCameraMode:"focus+orbit"` (9-11/12-14); 6-8 auto-tour.
- [ ] **U029** [US2] `QuestWorld.tsx` — the **tier switch**: render `World3D` (+ the DOM `QuestLedger` overlay driving focus/pick) when `renderTier` is `quest-world-3d`/`-lite`, else `Board2D`; on no-WebGL / lost context, fall back to `Board2D` with no state change. Wire into `InterestLabClient.tsx`.

**Checkpoint (P10 gate)**: P9b gate + `next build` + app smoke (canvas mounts `aria-hidden`, zero console/WebGL errors, destroys on unmount; toggling reduced-motion → `board-2d`) + walkthrough steps for UI-US2 (incl. keyboard focus island→island).

---

## Phase P11: "Come back later" voluntary-return delight (UI-US3) (3D-UI phase) (spec §U9 P11)

### Tests first (write, ensure they FAIL)

- [ ] **U030** [P] [US3] `packages/interest-lab-view/test/return-delight.test.ts` — a voluntary-return @7/@30 history yields the card's **and** the scene marker's `returnState:"voluntary-return"` + `welcomeBack`/`markerGlow→welcomeBack` motion + `spark` tone with **label-free** copy (no `/you are (a|an|the) /i`); a prompted return yields `returnState:"prompted-return"` + `prompted` tone + **no** welcome-back; reduced-motion ⇒ static warm halo + text (UI-FR-004, SC-UI-03).

### Implementation

- [ ] **U031** [US3] Extend `buildProbePickerView` (`picker.ts`) **and** `buildSceneView` (`scene.ts`) with `returnState`/`tone`/`welcomeBack` derivation from the injected history (voluntary @7/@30 vs prompted-with-context); keep prompted un-celebrated and recessed (parity: card and marker agree, §U8.18).
- [ ] **U032** [US3] `apps/interest-lab/app/child/world3d/WelcomeBloom.tsx` — the 3D reserved delight (emissive → `bloomPeak` + spark-mote burst + camera ease) and `apps/interest-lab/app/child/WelcomeBack.tsx` — the 2D/reduced-motion **static** equivalent (warm `--spark` halo + concrete copy). Recessed `prompted` state on prompted-return markers/cards. **No** countdown/streak/scarcity/FOMO/time-gated unlock anywhere.

**Checkpoint (P11 gate)**: P10 gate + return-delight golden + walkthrough step for UI-US3 (incl. reduced-motion static).

---

## Phase P12: Guide console — coverage matrix (UI-US4) (spec §U9 P12)

### Tests first (write, ensure they FAIL)

- [ ] **U033** [P] [US4] `packages/interest-lab-view/test/coverage-view.test.ts` — `buildCoverageMatrixView` complete case (from Part-I **G2**) and gappy case (from **G3**, exact gap strings) per spec §U8.9; rows in catalog order with hue; cols the 9 work-modes with glyphs; **no** `score`/`confidence` key at any depth (UI-FR-006, SC-UI-04).

### Implementation

- [ ] **U034** [US4] Implement `buildCoverageMatrixView` in `packages/interest-lab-view/src/coverage-view.ts` (rows/cols/cells row-major with visible `empty` gap cells; rail = the exact Part-I `CoverageMatrix`; `complete`+`gaps` passthrough); export from `index.ts`.
- [ ] **U035** [US4] `apps/interest-lab/app/guide/CoverageMatrix.tsx` — the animated domains×work-modes grid + coverage rail via `motion@^12`; cells fill with a `matrixCell` stagger (instant under reduced motion); **gap cells calm/visible** (`--gap` + hollow-ring glyph + text), never red, never a score. Rendered as a semantic table/grid with row/column headers.

**Checkpoint (P12 gate)**: P11 gate + coverage golden (§U8.9) + walkthrough step for UI-US4.

---

## Phase P13: Guide console — explanations + timeline + lifecycle + authoring + constellation (UI-US5) (spec §U9 P13)

### Tests first (write, ensure they FAIL)

- [ ] **U036** [P] [US5] `packages/interest-lab-view/test/explanations.test.ts` — `buildExplanationsView`: `disconfirming` present whenever `supporting` is (side-by-side invariant); uncertainty grade/interval; **no** `passionScore`/`score`/`verdict`/`label` key; no card text matches `/you are (a|an|the) /i` (spec §U8.12; UI-FR-007, SC-UI-05).
- [ ] **U037** [P] [US5] `packages/interest-lab-view/test/timeline.test.ts` — `buildReturnTimelineView(EVENTS_GOLDEN_V1)` matches spec §U8.10: voluntary @7/@30 distinct; prompted recedes + `interventionContext:"reminder"` + contributes 0 to voluntary; every `support` marker `lowersSignal:false` (UI-FR-008, SC-UI-06).
- [ ] **U038** [P] [US5] `packages/interest-lab-view/test/lifecycle-view.test.ts` — `buildLifecycleStateView`: gate checklist from `evaluateCandidateGate` (spec §U8.11 / Part-I **G5**); proposal `operative:false`; legal transitions present; no path sets `operative:true` (UI-FR-009, SC-UI-07). Plus `buildRevisionHistoryView` append-only/monotonic (IL-006).
- [ ] **U039** [P] [US5] `packages/interest-lab-view/test/constellation.test.ts` — `buildEvidenceConstellationView` matches §U8.17: six family stars in gate order, `voluntary_return.brightness===1.0` others `0.7` (present) / `0.18` (absent), supporting `[+2.4,0.4,0]` / disconfirming `[−2.4,0.4,0]` anchors, `domEquivalent:true`, **no** scalar score (UI-FR-009b, SC-UI-15).

### Implementation

- [ ] **U040** [US5] Implement `buildExplanationsView` (`explanations.ts`), `buildReturnTimelineView` (`timeline.ts`), `buildLifecycleStateView` + `buildRevisionHistoryView` (`lifecycle-view.ts`), `buildEvidenceConstellationView` (`constellation.ts`); export from `index.ts`.
- [ ] **U041** [US5] Finalize `buildInterestLabView` + `plainViewEquals` in `packages/interest-lab-view/src/view.ts` (compose the full `guide` block incl. `constellation` + the `scene` block; `plainViewEquals` compares state fields incl. scene markers-by-probeId and constellation stars, allowing `flags`+`presentation` incl. `renderTier`/`quality`/`camera` to differ) (depends on U040).
- [ ] **U042** [US5] `apps/interest-lab/app/guide/` — `Explanations.tsx` (supporting **beside** disconfirming, equal columns, `explanationsReveal` blur-mask crossfade), `ReturnTimeline.tsx` (voluntary bright / prompted recessed / support care-markers; `timelineDraw` + `markerPop`), `Lifecycle.tsx` (state visual + `stateMorph` + gate checklist `gateCheck` + shadow-**proposal-as-suggestion** + guide-authoring affordance), `RevisionHistory.tsx` (append-only version rail), and `EvidenceConstellation.tsx` (OPTIONAL r3f `<Canvas aria-hidden>` depth viz; DOM-equivalent = Explanations+Timeline; degrades off under reduced-motion / no-WebGL). Add the guide surface to `InterestLabClient.tsx` behind the surface toggle. All DOM motion via `motion@^12`.

**Checkpoint (P13 gate)**: P12 gate + goldens (§U8.10–§U8.12, §U8.17) + walkthrough steps for UI-US5.

---

## Phase P14: Performance, quality tiers & graceful degradation (3D-UI phase) (spec §U9 P14)

- [ ] **U043** Wire `resolveQualityTier` params into the scene: DPR cap (`<AdaptiveDpr>`), motes count, shadows on/off, island detail; the optional post-processing bloom behind the `QUALITY_TIERS.full.bloom` gate (add `@react-three/postprocessing` + `postprocessing` only if enabling — non-breaking).
- [ ] **U044** Runtime degradation: drei `<PerformanceMonitor>` steps `full → lite → board-2d` on sustained low FPS; WebGL context-loss + `Save-Data` + `deviceMemory<4` fall back to `board-2d`; a tier change MUST NOT block a pick or lose a quest (UI-FR-021, SC-UI-16).
- [ ] **U045** Performance/degradation walkthrough: verify the 60fps target on a mid device, confirm lite/2D step-down under simulated load, and confirm no dropped picks; `next build` clean.

**Checkpoint (P14 gate)**: P13 gate + tier golden (§U8.16) + `next build` + performance/degradation walkthrough (SC-UI-16).

---

## Phase P15: Polish, accessibility, plain mode & one-view parity (spec §U9 P15)

- [ ] **U046** [P] `packages/interest-lab-view/test/view.test.ts` — `buildInterestLabView` composes both surfaces + `scene`; `plainViewEquals` holds across **full-3D / 3D-lite / 2D / plain / reduced / age-band** (identical underlying state incl. scene markers-by-probeId + constellation, differ only in `flags`+`presentation`) (UI-FR-001/001b/019, SC-UI-10).
- [ ] **U047** [P] `packages/interest-lab-view/test/guardrails.test.ts` — static: no `Math.random` **and no `three`/`react`/`@react-three/*` import** in `packages/interest-lab-view/src`; no `price|currency|score|confidence|passionScore|rank|percentile|verdict|outOf` field in any view type (incl. `SceneView`/`QuestMarkerView`/`ConstellationStar`); no copy generator emits `/you are (a|an|the) /i` (UI-FR-016/018, SC-UI-11).
- [ ] **U048** [P] `packages/interest-lab-view/test/synthetic.test.ts` — the whole view layer runs from the Part-I fixtures with no consent/admissions/legal input (UI-FR-018, SC-UI-12).
- [ ] **U049** [P] `packages/interest-lab-view/README.md` (public API incl. the scene/tier resolvers, inputs, guardrail summary, "renders @gt100k/interest-lab; never re-computes a rule; GPU-free; no scalar passion score / no fixed label / no floating score in the world"); optional `packages/interest-lab-view/src/demo.ts` matching quickstart.
- [ ] **U050** Accessibility + acceptance pass on `apps/interest-lab` per quickstart: reduced-motion parity (every §U6 DOM **and** 3D motion has its equivalent; the 2D tier is the reduced default; ambient off); the 3D `<Canvas>` is `aria-hidden` and the DOM quest ledger / console panels are the operable AT source of truth; `prefers-reduced-transparency` → solid panels; keyboard/switch/screen-reader over **both** surfaces (labeled quest cards, matrix table headers, dated timeline markers, lifecycle states + gate checklist as text); color-independent cues; ≥4.5:1 contrast + visible `--focus`; **no dark patterns** (no countdown/decay/FOMO/scarcity, no time/mastery-gated unlock/level); no number/score/rank floats in the world; help affordance present & non-penalizing (UI-FR-012/013/014/015/020b/021, SC-UI-16/17/18).
- [ ] **U051** Run `quickstart.md` end-to-end (`pnpm --filter @gt100k/interest-lab-view test`, `pnpm lint`, `pnpm --filter @gt100k/interest-lab-app build` + app smoke) and confirm **SC-UI-01…18** map green.
- [ ] **U-ROOT** **[HUMAN-RECONCILE — FINAL, shared root file]** Add `{ "path": "packages/interest-lab-view" }` to the root `tsconfig.json` `references` so `tsc -b` includes the new view package. This is the **only** shared-root edit for Part II; flag it for human reconciliation (parallel-safety). The app (like `student-compass`) is not a `tsc -b` reference. Then confirm `pnpm typecheck` is clean.

---

## Dependencies & Execution Order (Part II)

- **P8 (blocks all)** → **P9 (US1, 2D board)** → **P9b (scene view model)** → **P10 (US2, 3D world)** → **P11 (US3, delight)** → **P12 (US4, coverage)** → **P13 (US5, evidence)** → **P14 (perf/tiers)** → **P15 (polish)**.
- View functions depend on `model.ts` (U003) + the registries (U004). `buildProbePickerView` (U016/U031) feeds the 2D board + scene parity; `buildSceneView` (U023/U031) feeds the 3D world; the guide view functions (U040) feed the console; `buildInterestLabView` grows phase by phase (U017 → U024 → U041). All app components depend on the exported view functions/scene numbers for their phase; the r3f layer (P10) depends on the P9b scene goldens.
- **U-ROOT** is last and touches a shared root file (flagged for human reconcile).

## Within each phase

- Tests are written first and MUST fail before implementation (use spec §U8 golden values verbatim). The scene/tier resolvers (P9b) are pure and GPU-free — proven before any r3f code.
- Types/registries before resolvers; resolvers before their `index.ts` export; view export before the component that consumes it.

## Parallel Opportunities (Part II)

- P8: U002/U004/U006/U007/U008/U009 in parallel after U001/U003.
- P9 tests U010/U011/U012/U013 in parallel; then U014/U015 → U016 → U017; app U018/U019/U020.
- P9b tests U021/U022 in parallel; then U023 → U024.
- P10 app components U025/U027 in parallel; then U026 → U028 → U029.
- P13 tests U036/U037/U038/U039 in parallel; then U040 → U041 → U042.
- P15: U046/U047/U048/U049 in parallel; U050/U051; U-ROOT alone last.

## Implementation Strategy (Part II)

- **MVP = P8 + P9 + P9b + P10** (the explorable 3D Curiosity Quest World rendering the domain Lab, with its 2D reduced-motion/accessible equal) → validate against SC-UI-01/02/08/09/10/13/14/16 → then P11 (voluntary delight), P12 (coverage), P13 (explanations/timeline/lifecycle/authoring/constellation), P14 (perf/tiers), P15 (polish/a11y/parity).
- Test-first: write each phase's tests and confirm they FAIL before implementing. The scene numbers are proven GPU-free (P9b) before the r3f world (P10). Synthetic-only; the app runs entirely on the Part-I fixtures with no external fetch.

## Summary (Part II)

- **Total UI tasks**: 52 (U001–U051 + U-ROOT).
- **P8** 9 (U001–U009) · **P9/US1** 11 (U010–U020) · **P9b/scene** 4 (U021–U024) · **P10/US2** 5 (U025–U029) · **P11/US3** 3 (U030–U032) · **P12/US4** 3 (U033–U035) · **P13/US5** 7 (U036–U042) · **P14/perf** 3 (U043–U045) · **P15/polish** 6 (U046–U051 + U-ROOT).
- **View golden gates**: `motion` (§U8.4) · `art`+domain-hue (§U8.2/§U8.3/§U8.5) · `staging` (§U8.7) · `probe-picker` (§U8.8) · `scene`+`tiers` (§U8.13/§U8.14/§U8.16/§U8.18) · `return-delight` (§U8.8) · `coverage-view` (§U8.9) · `explanations` (§U8.12) · `timeline` (§U8.10) · `lifecycle-view` (§U8.11) · `constellation` (§U8.17) · `view`/`plainViewEquals` (§U8.18/§U8.19) — all test-first against spec §U8, all GPU-free.
- **MVP scope**: P8 + P9 + P9b + P10 (the child Curiosity Quest World with art direction, staging, motion tokens, the 3D floating islands, and the 2D reduced-motion/accessible equal tier).
- **Parallel-safety**: all work in `packages/interest-lab-view` + `apps/interest-lab`; the only shared-root edit is **U-ROOT** (root `tsconfig.json` reference for the view package), flagged for human reconcile.
