---

description: "Task list for the Arena progression world (RPG game-experience layer)"
---

# Tasks: Arena Progression World (RPG Game-Experience Layer)

**Input**: Design documents from `specs/004-arena-game-world/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/arena-world.md, quickstart.md
**Tests**: INCLUDED and **test-first** for the domain package — the constitution makes tests part of "done" and `contracts/arena-world.md` defines explicit guardrail test obligations. Write each test first, ensure it FAILS, then implement. UI is verified via `next build` + the quickstart acceptance walkthrough.

**Child-facing note**: This is a child-facing surface. The build loop is **PR-only** — it implements on the `004-arena-game-world` branch and opens a PR; a **named human reviewer approves before merge** (constitution ENG *Human review before child exposure*; PRD §25). No child exposure on build-loop authority. Evidence posture **[E3]/[R]** — measured against belonging/voluntary return; auto-reverts if it depresses belonging (the §15 rollback gate).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete-task dependency)
- **[Story]**: US1 / US2 / US3 / US4 / US5 (setup, foundational, polish carry no story label)
- Every task gives an **exact file path**. All paths live in **new** directories only.

## Path conventions (from plan.md — TS monorepo)

- Domain: `packages/arena-world/src/`, tests `packages/arena-world/test/`
- App: `apps/arena/` (Next.js App Router; package name `@gt100k/arena-world-app`)
- **Do NOT modify** `packages/learning-loop`, `apps/student-compass`, or shared root files (except the single final human-reconciled task T041).

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create the domain package skeleton `packages/arena-world/package.json` (`name: @gt100k/arena-world`, `type: module`, `main`/`types`/`exports` → `./src/index.ts`, `test: vitest run`, dependency `@gt100k/learning-loop: workspace:*`) — mirror `packages/learning-loop/package.json`.
- [ ] T002 [P] Add `packages/arena-world/tsconfig.json` extending `../../tsconfig.base.json` (composite; `rootDir: "."`, `outDir: "dist"`, include `src/**/*.ts`, `test/**/*.ts`) — mirror `packages/learning-loop/tsconfig.json`.
- [ ] T003 [P] Create the app skeleton `apps/arena/package.json` (`name: @gt100k/arena-world-app`, scripts `dev`/`build`/`start`, deps `@gt100k/arena-world` + `@gt100k/learning-loop` `workspace:*`, `next ^14.2.15`, `react`/`react-dom ^18.3.1`, dev `@types/react*`) — mirror `apps/student-compass/package.json`.
- [ ] T004 [P] Add `apps/arena/next.config.mjs` with `transpilePackages: ["@gt100k/arena-world", "@gt100k/learning-loop"]` and `apps/arena/tsconfig.json` mirroring `apps/student-compass/tsconfig.json` (noEmit, jsx preserve, DOM libs).

> No root `vitest.config.ts`, `biome.json`, or `pnpm-workspace.yaml` edits: the existing globs already cover `packages/arena-world/test/**` and `packages/*`/`apps/*`. Root `tsconfig.json` reference is deferred to T041.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: no user-story work begins until this phase is complete.

- [ ] T005 Define all domain types in `packages/arena-world/src/model.ts` per `data-model.md` (`AgeBand`, `CompetencyNode`, `QuestWorld`, `NodeMasterySignal`, `NodeState`, `ProgressionState`, `Tier`, `Cosmetic`, `CosmeticRule`, `CosmeticEligibility`, `AvatarState`, `CohortBase`, `CelebrationEvent`, `RewardRepresentation`, `NearPeerStanding`) — reuse `Section`/`SECTIONS` from `@gt100k/learning-loop`. **The `Cosmetic` type MUST have no price/currency/dropRate/rarity field; the standings types MUST have no rank/position/percentile/outOf field (guardrails by construction).**
- [ ] T006 [P] Author the synthetic competency-graph fixture in `packages/arena-world/src/graph.fixture.ts` (small DAG across the four learning-loop `Section`s, with prerequisites, regions, at least one transfer-critical node).
- [ ] T007 Create `packages/arena-world/src/index.ts` re-exporting the public surface (types + functions) as they are added.

**Checkpoint**: package compiles with types + fixture; stories can begin.

---

## Phase 3: User Story 1 — Traverse a mastery-gated quest-world map (Priority: P1) 🎯 MVP

**Goal**: the competency graph renders as a traversable animated map; nodes unlock ONLY via the 90% independent-mastery gate + prerequisites — never grinding.

**Independent Test**: feed synthetic `NodeMasterySignal`s → node states derived deterministically; no node unlocks without its gate + prereqs; render map in all states with a reduced-motion equivalent.

### Tests (write first, ensure they fail)

- [ ] T008 [P] [US1] Contract test for `buildQuestWorld` (edges/regions derived; rejects cycle + dangling prerequisite) in `packages/arena-world/test/world.test.ts`.
- [ ] T009 [P] [US1] Contract test for `deriveNodeStates` (available/locked/unlocked rules incl. gate-before-prereq edge; determinism; no time/visit input) in `packages/arena-world/test/nodes.test.ts` (per `contracts/arena-world.md`, FR-002/3/4, SC-001).

### Implementation

- [ ] T010 [US1] Implement `buildQuestWorld(graphDef)` (derive edges from prerequisites, stable regions, DAG/dangling validation) in `packages/arena-world/src/world.ts`.
- [ ] T011 [US1] Implement `deriveNodeStates(world, signals)` (pure, deterministic; unlock iff prereqs mastered AND own `masteryCleared`) in `packages/arena-world/src/nodes.ts` (depends on T005, T010).
- [ ] T012 [US1] Export US1 surface from `packages/arena-world/src/index.ts` (depends on T010, T011).
- [ ] T013 [P] [US1] Scaffold the Next.js app shell `apps/arena/app/layout.tsx` + `apps/arena/app/globals.css` (globals include `@media (prefers-reduced-motion: reduce)` and a `.plain-mode` style hook).
- [ ] T014 [US1] Implement the quest-world map in `apps/arena/app/page.tsx` — render nodes/edges/regions from `@gt100k/arena-world`, animate movement/reveal, with a **reduced-motion equal rendering** conveying the same states; drive it from a synthetic mastery-signal feed (depends on T012, T013).

**Checkpoint**: MVP — a mastery-gated, traversable quest world for a synthetic learner (headless logic unit-tested; UI builds).

---

## Phase 4: User Story 2 — Gain-based tiers + deterministic cosmetics + avatar (Priority: P2)

**Goal**: independence reward drives gain-based tiers (growth vs own past); competence-earned deterministic cosmetics (no loot/purchase/power); pseudonymous avatar equips eligible cosmetics.

**Independent Test**: feed a synthetic independence-reward history → progression/tier/eligibility deterministic; no purchase path; zero-power invariance holds.

### Tests (write first, ensure they fail)

- [ ] T015 [P] [US2] Contract test for `tierForReward` + `computeProgression` (threshold boundaries; growth-vs-past) in `packages/arena-world/test/progression.test.ts` (FR-005/6).
- [ ] T016 [P] [US2] Contract test for `deriveCosmeticEligibility` determinism (identical history ⇒ identical eligible set) **and** a static guard test asserting no `Math.random` and no price/currency/dropRate/rarity field in the package in `packages/arena-world/test/cosmetics.test.ts` (FR-007/8, SC-002).
- [ ] T017 [P] [US2] Contract test for zero-power invariance (mastery/node-state/standing outcomes identical across all cosmetic/tier states) + `equipCosmetic` rejects un-earned cosmetic + avatar pseudonymity in `packages/arena-world/test/zero-power.test.ts` (FR-009/10, SC-003).

### Implementation

- [ ] T018 [US2] Implement `tierForReward` + `computeProgression` in `packages/arena-world/src/progression.ts` (deterministic thresholds; cosmetic-only tier) (depends on T005, T011).
- [ ] T019 [US2] Implement `deriveCosmeticEligibility` + `equipCosmetic` in `packages/arena-world/src/cosmetics.ts` (deterministic rules; no money parameter; equip requires eligibility) (depends on T018).
- [ ] T020 [US2] Export US2 surface from `packages/arena-world/src/index.ts`; add a `Cosmetic` catalog fixture (avatar-item/world-theme/base-theme/celebration-effect) (depends on T018, T019).
- [ ] T021 [US2] Add the avatar + tier + cosmetic panel to `apps/arena/app/page.tsx` (equip only eligible cosmetics; **no purchase/roll UI**; show growth-vs-past) (depends on T020, T014).

**Checkpoint**: tiers/cosmetics/avatar work headless (tested) and render; no loot, no purchase, zero power.

---

## Phase 5: User Story 3 — Juice on the learning moment; errors never a loss (Priority: P3)

**Goal**: celebrations fire on independent unlocks + productive-struggle; an error is never rendered as a loss; copy praises process, not trait/speed.

**Independent Test**: feed learning-moment signals → celebration events only on unlock/struggle; incorrect attempt/help request emits no event and removes nothing; every celebration has a reduced-motion equivalent.

### Tests (write first, ensure they fail)

- [ ] T022 [P] [US3] Contract test for `classifyCelebration` (unlock/struggle ⇒ event; incorrect/help ⇒ `null`, nothing removed; no loss type in union; copyStyle process-praise) in `packages/arena-world/test/celebrate.test.ts` (FR-012/13/14, SC-007).

### Implementation

- [ ] T023 [US3] Implement `classifyCelebration(signal)` in `packages/arena-world/src/celebrate.ts` (only `independent-unlock`/`productive-struggle`; intensity + `process-praise` copyStyle) (depends on T005, T011).
- [ ] T024 [US3] Export US3 surface from `packages/arena-world/src/index.ts` (depends on T023).
- [ ] T025 [US3] Wire celebration rendering into `apps/arena/app/page.tsx` — particles/motion on unlock/struggle, warm process-praise "not yet" on error (no loss visuals), each with a reduced-motion equivalent (depends on T024, T014).

**Checkpoint**: the learning moment feels rewarding; errors are never a loss (tested headless; UI renders both modes).

---

## Phase 6: User Story 4 — Persistent co-built cohort base (Priority: P4)

**Goal**: cooperative-mission results deterministically accrete a persistent, attributable, zero-power cohort base.

**Independent Test**: feed a sequence of cooperative-mission results → base accretes deterministically; same sequence ⇒ identical base; base confers no power.

### Tests (write first, ensure they fail)

- [ ] T026 [P] [US4] Contract test for `applyCohortContribution` (deterministic accretion; prior contributions preserved; replay-identical; zero power) in `packages/arena-world/test/base.test.ts` (FR-011, SC-003).

### Implementation

- [ ] T027 [US4] Implement `applyCohortContribution(base, missionResult)` + `unlockedFeatures` derivation in `packages/arena-world/src/base.ts` (depends on T005).
- [ ] T028 [US4] Export US4 surface from `packages/arena-world/src/index.ts` (depends on T027).
- [ ] T029 [US4] Add the cohort-base home surface to `apps/arena/app/page.tsx` (render co-built features; attributable contributions) (depends on T028, T014).

**Checkpoint**: the cohort base is a persistent, deterministic belonging anchor.

---

## Phase 7: User Story 5 — Age-band staging, plain mode & near-peer standings (Priority: P5)

**Goal**: representation resolves by age band (§14.13); plain mode / reduced-motion parity; opt-in, near-peer, anonymized, no-bottom-rank, no-caste standings; free opt-out.

**Independent Test**: resolve representation per band (6-8 hides raw number, comparison off); plain mode yields identical state; standing is opt-in/near-peer/anonymized and never surfaces a bottom rank.

### Tests (write first, ensure they fail)

- [ ] T030 [P] [US5] Contract test for `resolveRewardRepresentation` (same event → correct band vocabulary; 6-8 `showRawNumber=false` + comparison off) in `packages/arena-world/test/staging.test.ts` (FR-017/18, SC-005).
- [ ] T031 [P] [US5] Contract test for `deriveStanding` (null unless opted in; near-peer/anonymized/gain-based; no bottom-rank; caste/rank fields unrepresentable) in `packages/arena-world/test/standings.test.ts` (FR-019, SC-009).
- [ ] T032 [P] [US5] Contract test for opt-out/plain-mode invariance (`plainViewEquals`; learning/access/standing unchanged with standings off or plain mode on) in `packages/arena-world/test/plain-mode.test.ts` (FR-020, SC-006).

### Implementation

- [ ] T033 [US5] Implement `resolveRewardRepresentation(ageBand, progression)` in `packages/arena-world/src/staging.ts` (band table from §14.13; economy unchanged) (depends on T018).
- [ ] T034 [US5] Implement `deriveStanding(self, nearPeers, options)` in `packages/arena-world/src/standings.ts` (default off; gain-based; anonymized; `gainToBandTop`, no rank) (depends on T018).
- [ ] T035 [US5] Export US5 surface from `packages/arena-world/src/index.ts` (depends on T033, T034).
- [ ] T036 [US5] Add age-band switch + plain-mode toggle + opt-in standings panel to `apps/arena/app/page.tsx` (6-8 concrete/story-framed/comparison-off; standings default off) (depends on T035, T014).

**Checkpoint**: all child-protection guardrails are represented and independently testable.

---

## Phase 8: Polish & Cross-Cutting

- [ ] T037 [P] Add `packages/arena-world/README.md` (public API, ports/inputs, guardrail summary, "builds on @gt100k/learning-loop").
- [ ] T038 [P] Add an optional `demo` script for the synthetic mastery-signal feed in `packages/arena-world/src/demo.ts` (matches `quickstart.md`) and wire a `demo` script in `packages/arena-world/package.json`.
- [ ] T039 Accessibility + performance acceptance pass on `apps/arena` per `quickstart.md` (`prefers-reduced-motion` parity, keyboard/screen-reader, color-independent cues, 60 fps min-device / graceful degradation, mastery action never blocked — FR-015/16/22/23, SC-004/10).
- [ ] T040 Run `quickstart.md` validation end-to-end (`pnpm --filter @gt100k/arena-world test`, `biome check`, `next build` for `apps/arena`) and confirm all SCs map green.
- [ ] T041 **[HUMAN-RECONCILE — FINAL, shared root file]** Add `{ "path": "packages/arena-world" }` to the root `tsconfig.json` `references` so `tsc -b` includes the new package. This is the **only** shared-root edit; flag it in the PR for human reconciliation (parallel-safety). Then confirm `pnpm typecheck` is clean.

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2, blocks all stories)** → **US1 (P1)** → **US2 (P2)** → **US3 (P3)** → **US4 (P4)** → **US5 (P5)** → **Polish (Phase 8)**.
- Domain functions depend on `model.ts` (T005) and, for anything reward-driven (tiers/cosmetics/staging/standings), on `deriveNodeStates`/`computeProgression`.
- All UI tasks depend on the map shell T014; each story's UI task depends on that story's exported domain surface.
- T041 is last and touches a shared root file (flagged for human reconcile).

## Within each user story

- Tests are written first and MUST fail before implementation.
- Types/model before functions; functions before their `index.ts` export; domain export before the UI panel that consumes it.

## Parallel Opportunities

- Setup: T002/T003/T004 in parallel after T001.
- Foundational: T006 in parallel with T005 (distinct files) before T007.
- Per story, the `[P]` test tasks run in parallel with each other and with the fixture/UI-shell tasks; implementation tasks within a story are mostly sequential (shared `index.ts`, shared `page.tsx`).
- Because US2–US5 domain modules are distinct files, their test authoring (T015/16/17, T022, T026, T030/31/32) can be drafted in parallel once Foundational is done — but keep them test-first per story.

## Implementation Strategy

- **MVP = Setup + Foundational + US1** (mastery-gated traversable quest world) → validate → then US2 (tiers/cosmetics), US3 (juice), US4 (base), US5 (staging/standings/plain-mode).
- Commit per task or logical group; test-gated; **PR-only** with human review before merge (child-facing gate, §25). Synthetic-only; no consent/admissions/legal machinery.

## Summary

- **Total tasks**: 41 (T001–T041)
- **US1**: 7 (T008–T014) · **US2**: 7 (T015–T021) · **US3**: 4 (T022–T025) · **US4**: 4 (T026–T029) · **US5**: 7 (T030–T036) · Setup 4 · Foundational 3 · Polish 5
- **MVP scope**: Setup + Foundational + US1.
- **Final flagged task**: T041 (root `tsconfig.json` reference — human reconcile).
