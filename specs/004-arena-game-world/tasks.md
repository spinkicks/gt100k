---

description: "Task list for the Arena progression world (RPG game-experience layer, Phaser 4)"
---

# Tasks: Arena Progression World (RPG Game-Experience Layer)

**Input**: Design documents from `specs/004-arena-game-world/`
**Prerequisites**: spec.md (master — §1 scope, §7 fixtures, §8 golden values, §9 phasing, §10 SCs), plan.md, research.md, data-model.md, contracts/arena-world.md, quickstart.md
**Tests**: INCLUDED and **test-first** for the domain package — the constitution makes tests part of "done" and `contracts/arena-world.md` defines explicit guardrail test obligations. Write each test first with the **golden values from spec §8**, ensure it FAILS, then implement. The app is verified via `next build` + the seeded smoke (zero console/WebGL errors) + the quickstart acceptance walkthrough.

**Child-facing note**: This is a child-facing surface. The build loop is **PR-only** — it implements on the `004-arena-game-world` branch and opens a PR; a **named human reviewer approves before merge** (constitution ENG *Human review before child exposure*; PRD §25). No child exposure on build-loop authority. Evidence posture **[E3]/[R]** — measured against belonging/voluntary return; auto-reverts if it depresses belonging (the §15 rollback gate).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete-task dependency)
- **[Story]**: US1 / US2 / US3 / US4 / US5 (setup, foundational, polish carry no story label)
- Every task gives an **exact file path**. All paths live in **new** directories only.
- Phases map to **spec §9 (P0…P6)**.

## Path conventions (from plan.md — TS monorepo)

- Domain: `packages/arena-world/src/`, tests `packages/arena-world/test/`
- App: `apps/arena/` (Next.js App Router; package name `@gt100k/arena-world-app`; Phaser client-only)
- **Do NOT modify** `packages/learning-loop`, `apps/student-compass`, or shared root files (except the single final human-reconciled task **T-ROOT**).

---

## Phase P0: Foundation & green-from-iteration-1 (spec §9 P0)

- [ ] **T001** Create the domain package skeleton `packages/arena-world/package.json` (`name: @gt100k/arena-world`, `type: module`, `main`/`types`/`exports` → `./src/index.ts`, `test: vitest run`, dependency `@gt100k/learning-loop: workspace:*`) — mirror `packages/learning-loop/package.json`.
- [ ] **T002** [P] Add `packages/arena-world/tsconfig.json` extending `../../tsconfig.base.json` (composite; `rootDir: "."`, `outDir: "dist"`, include `src/**/*.ts`, `test/**/*.ts`) — mirror `packages/learning-loop/tsconfig.json`.
- [ ] **T003** Define all domain types in `packages/arena-world/src/model.ts` per data-model.md (`AgeBand`, `CompetencyNode`, `QuestWorld`, `NodePosition`, `WorldLayout`, `NodeMasterySignal`, `NodeState`, `ProgressionState`, `Tier`, `Cosmetic`, `CosmeticRule`, `CosmeticEligibility`, `AvatarState`, `CooperativeMissionResult`, `CohortBase`, `CelebrationEvent`, `MotionSpec`, `RewardRepresentation`, `NearPeerStanding`, `ArenaView`) — reuse `Section`/`SECTIONS` from `@gt100k/learning-loop`. **The `Cosmetic` type MUST have no `price`/`currency`/`dropRate`/`rarity` field; the standings types MUST have no `rank`/`position`/`percentile`/`outOf` field (guardrails by construction).**
- [ ] **T004** [P] Author the fixtures: `packages/arena-world/src/graph.fixture.ts` (the 9-node / 4-region DAG, spec §7.1), `tiers.fixture.ts` (spec §7.2), `catalog.fixture.ts` (spec §7.3). Regions in declaration order `[numbers-coast, tinker-bluffs, story-vale, wordwind-reach]`.
- [ ] **T005** Create `packages/arena-world/src/index.ts` re-exporting the public surface (types + fixtures) as they are added.
- [ ] **T006** [P] Seeded smoke test `packages/arena-world/test/smoke.test.ts`: import the package, `buildQuestWorld(FIXTURE)` yields **9 nodes + 4 regions**, `layoutQuestWorld` yields a non-empty `positions` array. (Depends on T003/T004; keep the gate green from iteration 1 — `buildQuestWorld`/`layoutQuestWorld` stubs may be trivial until P1, but the smoke must pass.)
- [ ] **T007** [P] Create the app skeleton `apps/arena/package.json` (`name: @gt100k/arena-world-app`, scripts `dev`/`build`/`start`, deps `@gt100k/arena-world` + `@gt100k/learning-loop` `workspace:*`, `next ^14.2.15`, `react`/`react-dom ^18.3.1`, **`phaser ^4.2.1`** (latest stable 4.x; TS types bundled — no separate `@types/phaser`), dev `@types/react*`) — mirror `apps/student-compass/package.json`.
- [ ] **T008** [P] Add `apps/arena/next.config.mjs` (`transpilePackages: ["@gt100k/arena-world","@gt100k/learning-loop"]`) and `apps/arena/tsconfig.json` mirroring `apps/student-compass/tsconfig.json` (noEmit, jsx preserve, DOM libs).
- [ ] **T009** [P] Add `apps/arena/app/layout.tsx`, `apps/arena/app/page.tsx` (placeholder shell), `apps/arena/app/globals.css` (`@media (prefers-reduced-motion: reduce)`, `.plain-mode`, `:focus-visible` rings, ≥4.5:1 contrast tokens), `apps/arena/.env.local.example` (spec §11 `NEXT_PUBLIC_*`), and `apps/arena/.gitignore` (`.env.local`, `.next`).

> No root `vitest.config.ts`, `biome.json`, or `pnpm-workspace.yaml` edits: existing globs already cover `packages/arena-world/test/**` and `packages/*`/`apps/*`. Root `tsconfig.json` reference is deferred to **T-ROOT**.

**Checkpoint (P0 gate)**: `pnpm typecheck` + `pnpm test` green (smoke passes).

---

## Phase P1: Quest-world map + mastery gate (US1) 🎯 MVP (spec §9 P1)

**Goal**: the graph renders as a traversable animated overworld; nodes unlock ONLY via gate + prereqs; deterministic layout; reduced-motion + accessible Ledger convey identical states.

### Tests first (write, ensure they FAIL)

- [ ] **T010** [P] [US1] `packages/arena-world/test/world.test.ts` — `buildQuestWorld` derives 7 edges / 4 regions (spec §7.1); rejects a cycle and a dangling prerequisite.
- [ ] **T011** [P] [US1] `packages/arena-world/test/layout.test.ts` — `layoutQuestWorld` matches the golden positions (spec §8.1) exactly; deterministic across two runs (SC-013).
- [ ] **T012** [P] [US1] `packages/arena-world/test/nodes.test.ts` — `deriveNodeStates` scenario **S1** (spec §8.2): gate-before-prereq (`blend-bay` locked; `place-value-point` available); `unlocked` iff prereqs mastered AND own gate; determinism; no time/visit input (FR-002/3/4, SC-001).

### Implementation

- [ ] **T013** [US1] Implement `buildQuestWorld(graphDef)` in `packages/arena-world/src/world.ts` (edges from prerequisites, stable regions, DAG/dangling validation).
- [ ] **T014** [US1] Implement `layoutQuestWorld(world)` in `packages/arena-world/src/layout.ts` (region-grid per spec §8.1; constants `REGION_SPACING=1024`, `NODE_SPACING=192`, `NODE_COLS=3`, `NODE_OFFSET=96`; bounds 2048×2048).
- [ ] **T015** [US1] Implement `deriveNodeStates(world, signals)` in `packages/arena-world/src/nodes.ts` (pure, deterministic).
- [ ] **T016** [US1] Implement the synthetic feed `packages/arena-world/src/feed.ts` — a deterministic, seeded `NodeMasterySignal` sequence/simulator (no `Math.random`; a seeded PRNG or fixed schedule) reproducing S1 and progressive unlocks.
- [ ] **T017** [US1] First `buildArenaView` in `packages/arena-world/src/view.ts` composing `{ world, layout, nodeStates, flags }` (progression/eligibility/base/standing added in later phases); export from `index.ts`.
- [ ] **T018** [P] [US1] App game bootstrap (**Phaser 4 `^4.2.1`; Phaser-4 APIs only — spec §2 D1**): `apps/arena/app/game/eventBus.ts` (typed React↔Phaser bridge), `apps/arena/app/game/config.ts` (`Phaser.Types.Core.GameConfig`: `type: Phaser.AUTO` = rebuilt WebGL renderer with Canvas fallback, `scale.mode FIT`, scenes array), `apps/arena/app/game/ArenaGame.tsx` (`"use client"`; create `new Phaser.Game(config)` in `useEffect`, `game.destroy(true)` on unmount; wire the renderer's WebGL context-lost/restored handlers for graceful degradation).
- [ ] **T019** [US1] Scenes `apps/arena/app/game/scenes/BootScene.ts` (read flags/seed; register deterministic procedural texture generator) + `PreloadScene.ts` (load committed seed SVGs from `/seed/`; procedural fallback on miss; **no external fetch**).
- [ ] **T020** [US1] `apps/arena/app/game/scenes/WorldScene.ts` — render regions/nodes/edges from `ArenaView`; node visuals per state (locked/available/unlocked, color-independent); pseudonymous avatar; **tweened traversal** via `this.tweens.add({...})` (`Cubic.Out`, interruptible, §8.9) with **follow-camera** `this.cameras.main.startFollow(avatar, true, 0.08, 0.08)`; unlock reveal (scale 0.95→1.0 + alpha, `Back.Out`, §8.9); reduced-motion branch (instant/crossfade, no glow). **Phaser-4 APIs only** (spec §2 D1).
- [ ] **T021** [US1] `apps/arena/app/ledger/ArenaLedger.tsx` — accessible DOM parallel from `ArenaView`: quest `role="tree"` (`treeitem` accessible name = title + state + region), keyboard nav (Tab/Arrow/Enter), visible focus; canvas `aria-hidden`.
- [ ] **T022** [US1] `apps/arena/app/ArenaClient.tsx` (`"use client"`) wiring `dynamic(() => import("./game/ArenaGame"), { ssr:false })` + the Ledger + the synthetic feed; `apps/arena/app/page.tsx` renders it. Reduced-motion honored via `prefers-reduced-motion` + `NEXT_PUBLIC_REDUCED_MOTION_DEFAULT`.

**Checkpoint (P1 gate = MVP)**: P0 gate + `pnpm --filter @gt100k/arena-world-app build` + smoke (zero console/WebGL errors) + walkthrough steps 1–2, 5.

---

## Phase P2: Tiers + deterministic cosmetics + avatar (US2) (spec §9 P2)

### Tests first (write, ensure they FAIL)

- [ ] **T023** [P] [US2] `packages/arena-world/test/progression.test.ts` — `tierForReward` boundaries `99/100/249/250/500/899/900/1500` (spec §8.4); S1 cumulative **300** → tier 2, `regionsComplete=["tinker-bluffs"]`, growth-vs-past populated (FR-005/6).
- [ ] **T024** [P] [US2] `packages/arena-world/test/cosmetics.test.ts` — `deriveCosmeticEligibility` S1 golden sets (spec §8.4) in catalog order; identical history ⇒ identical set; `equipCosmetic` rejects `avatar-cape-aurora` in S1 (FR-007, SC-002).
- [ ] **T025** [P] [US2] `packages/arena-world/test/guardrails.test.ts` — static: no `Math.random` anywhere in `packages/arena-world/src`; `Cosmetic` has no `price|currency|dropRate|rarity` field; standings type has no `rank|position|percentile|outOf` field (FR-008/019, SC-002).
- [ ] **T026** [P] [US2] `packages/arena-world/test/zero-power.test.ts` — mastery/node-state/matchmaking/standing outcomes byte-identical across all cosmetic/tier states; `equipCosmetic` mutates only cosmetic fields; avatar pseudonymous (FR-009/10, SC-003).

### Implementation

- [ ] **T027** [US2] Implement `tierForReward` + `computeProgression` (cumulative over unlocked, `regionsComplete`, growth-vs-past) in `packages/arena-world/src/progression.ts`.
- [ ] **T028** [US2] Implement `deriveCosmeticEligibility` + `equipCosmetic` in `packages/arena-world/src/cosmetics.ts` (deterministic rules `min-tier`/`min-unlocks`/`region-complete`; catalog-order output; equip requires eligibility; **no money parameter**).
- [ ] **T029** [US2] Extend `buildArenaView` (progression, representation stub, avatar, eligibility) + export from `index.ts`.
- [ ] **T030** [US2] `apps/arena/app/hud/Hud.tsx` — tier + growth-vs-past panel and a **cosmetic drawer** (equip eligible only; locked shown with the unlock rule; **NO purchase/roll UI**); wire equip through the event bus so `WorldScene` swaps the avatar's `avatar-item` frames on canvas. Mirror controls into the Ledger (cosmetics as a labeled listbox).

**Checkpoint (P2 gate)**: P1 gate + walkthrough steps 3–4.

---

## Phase P3: Juice + errors-never-loss (US3) (spec §9 P3)

### Tests first (write, ensure they FAIL)

- [ ] **T031** [P] [US3] `packages/arena-world/test/celebrate.test.ts` — `classifyCelebration`: unlock of transferCritical → `high`; ordinary unlock → `medium`; struggle → `low`; incorrect attempt / help request → `null` and nothing removed; no loss type in union; `copyStyle="process-praise"` (FR-012/13/14, SC-007).
- [ ] **T032** [P] [US3] `packages/arena-world/test/motion.test.ts` — `celebrationMotionSpec` golden table (spec §8.5); `reducedMotion:true` ⇒ `{ mode:"static", particleCount:0, durationMs:150, cameraPunch:false }` (FR-015, SC-004).

### Implementation

- [ ] **T033** [US3] Implement `classifyCelebration(signal)` + `celebrationMotionSpec(event, options)` in `packages/arena-world/src/celebrate.ts`; export from `index.ts`.
- [ ] **T034** [US3] `apps/arena/app/game/scenes/FxScene.ts` — particle burst + node bloom + path light-up driven by `celebrationMotionSpec` (counts/durations from §8.5), using the **Phaser-4 unified particle API** `this.add.particles(x, y, textureKey, emitterConfig)` (NOT the removed Phaser-3.55 `createEmitter`/`ParticleEmitterManager`); a no-op / single static frame under reduced motion. Warm process-praise "not yet" wisp on error (**no** loss visual, node unchanged). Announce celebrations in the Ledger via `aria-live="polite"`.

**Checkpoint (P3 gate)**: P2 gate + walkthrough step 6.

---

## Phase P4: Persistent cohort base (US4) (spec §9 P4)

### Tests first (write, ensure it FAILS)

- [ ] **T035** [P] [US4] `packages/arena-world/test/base.test.ts` — `applyCohortContribution` over the 3-mission golden sequence ⇒ `unlockedFeatures=["campfire","banner","garden"]` (spec §8.8); append-only; replay-identical; prior contributions preserved; base confers no power (FR-011, SC-003).

### Implementation

- [ ] **T036** [US4] Implement `applyCohortContribution(base, missionResult)` + `unlockedFeatures` (distinct, stable order) in `packages/arena-world/src/base.ts`; add `base` to `buildArenaView`; export from `index.ts`.
- [ ] **T037** [US4] `apps/arena/app/game/scenes/BaseScene.ts` — render the Base Camp from `unlockedFeatures` as placed props (stable order); focus shows attributable contributor + mission. Mirror as a list in the Ledger.

**Checkpoint (P4 gate)**: P3 gate + walkthrough step 5 (base).

---

## Phase P5: Age-band staging + plain mode + near-peer standings (US5) (spec §9 P5)

### Tests first (write, ensure they FAIL)

- [ ] **T038** [P] [US5] `packages/arena-world/test/staging.test.ts` — `resolveRewardRepresentation` exact band strings (spec §8.6); 6-8 `showRawNumber=false` + `comparisonDefault="off"` (FR-017/18, SC-005).
- [ ] **T039** [P] [US5] `packages/arena-world/test/standings.test.ts` — `deriveStanding` null unless `optedIn`; S1 golden `selfGain=300`, `gainToBandTop=40` (spec §8.7); no `rank`/`position`/`percentile`/`outOf` field (FR-019, SC-009).
- [ ] **T040** [P] [US5] `packages/arena-world/test/plain-mode.test.ts` — `buildArenaView` + `plainViewEquals`: reduced-motion/plain view has identical underlying state, differs only in `flags`; learning/access/standing unchanged with standings off / plain on (FR-020/029, SC-006/014).
- [ ] **T041** [P] [US5] `packages/arena-world/test/view.test.ts` — `buildArenaView` composes all fields for a full scenario; drives the Ledger view-model completeness (SC-012/014).

### Implementation

- [ ] **T042** [US5] Implement `resolveRewardRepresentation(ageBand, progression)` in `packages/arena-world/src/staging.ts` (band table spec §8.6; economy unchanged across bands).
- [ ] **T043** [US5] Implement `deriveStanding(self, nearPeers, options)` in `packages/arena-world/src/standings.ts` (default off; gain-based; anonymized; `gainToBandTop=max(gains)-selfGain`; no rank).
- [ ] **T044** [US5] Finalize `buildArenaView` + `plainViewEquals` in `packages/arena-world/src/view.ts` (all fields incl. `representation`, `standing`, `flags`); export from `index.ts`.
- [ ] **T045** [US5] Extend `apps/arena/app/hud/Hud.tsx` + `ArenaClient.tsx`: age-band switch, plain-mode toggle, **opt-in standings panel (default off)**; 6-8 concrete/story-framed/comparison-off; standings show own gain vs. band top (never a rank). Mirror all controls into the Ledger.

**Checkpoint (P5 gate)**: P4 gate + walkthrough steps 7–8.

---

## Phase P6: Polish, accessibility & performance acceptance (spec §9 P6)

- [ ] **T046** [P] `packages/arena-world/test/synthetic.test.ts` — the whole domain surface runs from fixtures with no consent/admissions/legal input (FR-024, SC-008).
- [ ] **T047** [P] `packages/arena-world/README.md` (public API, inputs/ports, guardrail summary, "builds on @gt100k/learning-loop"); optional `packages/arena-world/src/demo.ts` + `demo` script matching quickstart.
- [ ] **T048** Commit the seed asset kit under `apps/arena/public/seed/` (small SVGs: avatar parts, node markers per state, region tiles ×4, base props) and confirm the procedural fallback renders when an asset is absent (FR-030).
- [ ] **T049** Accessibility + performance acceptance pass on `apps/arena` per quickstart: reduced-motion parity; keyboard/switch/screen-reader over the Ledger; color-independent cues; ≥4.5:1 contrast; canvas `aria-hidden`; 60fps min-device + degraded tier (halved particles, glow/shadow off) + graceful WebGL context-loss handling via **Phaser 4's rebuilt WebGL renderer / context-lost-restored handlers**; mastery action never blocked (FR-015/16/22/23/28, SC-004/10/11/12).
- [ ] **T050** Run `quickstart.md` end-to-end (`pnpm --filter @gt100k/arena-world test`, `pnpm lint`, `pnpm --filter @gt100k/arena-world-app build` + app smoke) and confirm SC-001…SC-014 map green.
- [ ] **T-ROOT** **[HUMAN-RECONCILE — FINAL, shared root file]** Add `{ "path": "packages/arena-world" }` to the root `tsconfig.json` `references` so `tsc -b` includes the new package. This is the **only** shared-root edit; flag it in the PR for human reconciliation (parallel-safety). Then confirm `pnpm typecheck` is clean.

---

## Dependencies & Execution Order

- **P0 (blocks all)** → **P1 (US1, MVP)** → **P2 (US2)** → **P3 (US3)** → **P4 (US4)** → **P5 (US5)** → **P6 (polish)**.
- Domain functions depend on `model.ts` (T003) and fixtures (T004); reward-driven functions (tiers/cosmetics/staging/standings) depend on `deriveNodeStates`/`computeProgression`. `buildArenaView` grows phase by phase (T017 → T029 → T036 → T044).
- All app scene tasks depend on the game bootstrap (T018) and the exported `ArenaView` for their phase.
- **T-ROOT** is last and touches a shared root file (flagged for human reconcile).

## Within each phase

- Tests are written first and MUST fail before implementation (use spec §8 golden values verbatim).
- Types/model before functions; functions before their `index.ts` export; domain export before the scene/HUD/Ledger that consumes it.

## Parallel Opportunities

- P0: T002/T004/T006/T007/T008/T009 in parallel after T001/T003.
- Per phase, the `[P]` test tasks run in parallel with each other; implementation tasks touching shared files (`index.ts`, `view.ts`, `page.tsx`, `Hud.tsx`, `WorldScene.ts`) are sequential.
- Because domain modules are distinct files, the test authoring for P2–P5 (T023–T026, T031–T032, T035, T038–T041) can be drafted in parallel once P1 is done — but keep them test-first per phase.

## Implementation Strategy

- **MVP = P0 + P1** (mastery-gated traversable animated quest world with reduced-motion + accessible Ledger) → validate → then P2 (tiers/cosmetics), P3 (juice), P4 (base), P5 (staging/standings/plain-mode), P6 (polish).
- Commit per task or logical group; test-gated; **PR-only** with human review before merge (child-facing gate, §25). Synthetic-only; no consent/admissions/legal machinery.

## Summary

- **Total tasks**: 51 (T001–T050 + T-ROOT)
- **P0** 9 (T001–T009) · **P1/US1** 13 (T010–T022) · **P2/US2** 8 (T023–T030) · **P3/US3** 4 (T031–T034) · **P4/US4** 3 (T035–T037) · **P5/US5** 8 (T038–T045) · **P6/polish** 6 (T046–T050 + T-ROOT)
- **MVP scope**: P0 + P1.
- **Final flagged task**: T-ROOT (root `tsconfig.json` reference — human reconcile).
