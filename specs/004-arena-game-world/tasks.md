---

description: "Task list for the Arena progression world (RPG game-experience layer, react-three-fiber 3D)"
---

# Tasks: Arena Progression World (RPG Game-Experience Layer)

**Input**: Design documents from `specs/004-arena-game-world/`
**Prerequisites**: spec.md (master — §1 scope, §7 fixtures, §8 golden values, §9 phasing, §10 SCs), plan.md, research.md, data-model.md, contracts/arena-world.md, quickstart.md
**Tests**: INCLUDED and **test-first** for the domain package — the constitution makes tests part of "done" and `contracts/arena-world.md` defines explicit guardrail test obligations. Write each test first with the **golden values from spec §8**, ensure it FAILS, then implement. The app is verified via `next build` + the seeded smoke (zero console/WebGL errors) + the quickstart acceptance walkthrough.

**Renderer**: The Arena is a **3D game on react-three-fiber + three.js + drei** (WebGL2) — Phaser is dropped (spec §2 D1 / §13 DP-2). The domain carries **no 3D dependency**; it computes deterministic config the app applies via three/r3f. DOM/HUD motion uses **`motion@^12`**; continuous in-canvas motion uses drei `easing.damp*`.

**Child-facing note**: This is a child-facing surface, so the child-safety guardrails of the spec (FR-026) apply — reduced-motion equal mode (the calm static-3D Tier C), WCAG 2.2 AA, no dark patterns, no loot/purchase, zero-power cosmetics, no caste ranks, age-appropriate staging, errors-never-loss, non-blocking of mastery actions, and the 60fps + degradation ladder. Evidence posture **[E3]/[R]** — measured against belonging/voluntary return; auto-reverts if it depresses belonging (the §15 rollback gate).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete-task dependency)
- **[Story]**: US1 / US2 / US3 / US4 / US5 / US6 (setup, foundational, polish carry no story label)
- Every task gives an **exact file path**. All paths live in **new** directories only.
- Phases map to **spec §9 (P0…P7)**.

## Path conventions (from plan.md — TS monorepo)

- Domain: `packages/arena-world/src/`, tests `packages/arena-world/test/`
- App: `apps/arena/` (Next.js App Router; package name `@gt100k/arena-world-app`; r3f client-only)
- **Do NOT modify** `packages/learning-loop`, `apps/student-compass`, or shared root files (except the single final task **T-ROOT**).

---

## Phase P0: Foundation & green-from-iteration-1 (spec §9 P0)

- [ ] **T001** Create the domain package skeleton `packages/arena-world/package.json` (`name: @gt100k/arena-world`, `type: module`, `main`/`types`/`exports` → `./src/index.ts`, `test: vitest run`, dependency `@gt100k/learning-loop: workspace:*`) — mirror `packages/learning-loop/package.json`. **No 3D/render dependency.**
- [ ] **T002** [P] Add `packages/arena-world/tsconfig.json` extending `../../tsconfig.base.json` (composite; `rootDir: "."`, `outDir: "dist"`, include `src/**/*.ts`, `test/**/*.ts`) — mirror `packages/learning-loop/tsconfig.json`.
- [ ] **T003** Define all domain types in `packages/arena-world/src/model.ts` per data-model.md (`AgeBand`, `CompetencyNode` (+`landmark`), `QuestWorld`, `NodePosition`, `WorldLayout`, `WorldTransform3D`/`NodeTransform3D`, `NodeMasterySignal`, `NodeState`, `ProgressionState`, `Tier`, `Cosmetic` (+`look`/`equipEffect`), `CosmeticRule`, `CosmeticEligibility`, `AvatarState`, `AvatarAnimationSpec`, `CooperativeMissionResult`, `CohortBase`, `BasePlacement`, `CelebrationEvent`, `MotionSpec`, `MotionToken`, `BiomeIdentity`, `WorldTheme`, `CameraConfig3D`, `ParallaxLayer`, `LightingConfig`, `WaterConfig`, `PostFxConfig`, `DeviceCaps`, `QualityTier`, `QualityBudget`, `SoundCue`, `VisualBand`, `AssetKeyRegistry`, `Presentation`, `RewardRepresentation`, `NearPeerStanding`, `ArenaView`) — reuse `Section`/`SECTIONS` from `@gt100k/learning-loop`. **The `Cosmetic` type MUST have no `price`/`currency`/`dropRate`/`rarity` field; the standings types MUST have no `rank`/`position`/`percentile`/`outOf` field; no `SoundCue` carries a negative/alarm/loop flag (guardrails by construction).**
- [ ] **T004** [P] Author the fixtures: `packages/arena-world/src/graph.fixture.ts` (the 9-node / 4-region DAG **with `landmark` per node**, spec §7.1), `tiers.fixture.ts` (spec §7.2), `catalog.fixture.ts` (spec §7.3 **+ `look`/`equipEffect`**, §8.15). Regions in declaration order `[numbers-coast, tinker-bluffs, story-vale, wordwind-reach]`.
- [ ] **T004a** [P] Author `packages/arena-world/src/biomes.fixture.ts` (per-region biome identity **+ elevation**, spec §8.12/§8.20) and `packages/arena-world/src/baseLayout.fixture.ts` (base zone/slot table, spec §8.16).
- [ ] **T004b** [P] Add the exact constant registries as exported modules (values only; resolver functions land in their phase): `art.ts` (`PALETTE`/`TYPOGRAPHY`, §8.11), `motion.ts` (`MOTION`/`EASINGS`/`LAMBDAS`, §8.10/§8.21), `scene3d.ts` (`WORLD_SCALE`/`CAMERA3D`/`LIGHTING`/`PARALLAX3D`/`WATER`/`POSTFX`, §8.20), `quality.ts` (`QUALITY_TIERS` budget table incl. the beacon-light cap, §8.22/§8.24), `assets.ts` (`ASSET_KEYS`, §8.17), `sound.ts` (`SOUND_CUES`, §8.18).
- [ ] **T005** Create `packages/arena-world/src/index.ts` re-exporting the public surface (types + fixtures + constant registries) as they are added.
- [ ] **T006** [P] Seeded smoke test `packages/arena-world/test/smoke.test.ts`: import the package, `buildQuestWorld(FIXTURE)` yields **9 nodes + 4 regions**, `layoutQuestWorld` yields a non-empty `positions` array, `resolveWorldTransform` yields **9 3D positions**, and the constant registries (`PALETTE`/`MOTION`/`CAMERA3D`/`QUALITY_TIERS`/`ASSET_KEYS`) are non-empty. (Depends on T003/T004/T004a/T004b; keep the gate green from iteration 1 — resolver stubs may be trivial until P1, but the smoke must pass.)
- [ ] **T007** [P] Create the app skeleton `apps/arena/package.json` (`name: @gt100k/arena-world-app`, scripts `dev`/`build`/`start`, deps `@gt100k/arena-world` + `@gt100k/learning-loop` `workspace:*`, `next ^14.2.15`, `react`/`react-dom ^18.3.1`, **`three ^0.169.0`**, **`@react-three/fiber ^8.17.10`**, **`@react-three/drei ^9.114.0`**, **`@react-three/postprocessing ^2.16.3`**, **`motion ^12`**, dev `@types/react*`, `@types/three`) — mirror `apps/student-compass/package.json`. **Pin r3f v8 / drei v9 / postprocessing v2 (React-18 compatible); do not bump to r3f v9 / drei v10.**
- [ ] **T008** [P] Add `apps/arena/next.config.mjs` (`transpilePackages: ["@gt100k/arena-world","@gt100k/learning-loop"]`) and `apps/arena/tsconfig.json` mirroring `apps/student-compass/tsconfig.json` (noEmit, jsx preserve, DOM libs).
- [ ] **T009** [P] Add `apps/arena/app/layout.tsx`, `apps/arena/app/page.tsx` (placeholder shell), `apps/arena/app/globals.css` (the §8.11 `PALETTE`/`TYPOGRAPHY` CSS custom properties incl. the system-rounded `--font-display`/`--font-body` fallback stacks; `@media (prefers-reduced-motion: reduce)`, `@media (prefers-reduced-transparency: reduce)`, `@media (prefers-contrast: more)`, `.plain-mode`, `:focus-visible` `--focus` rings, ≥4.5:1 contrast tokens), `apps/arena/.env.local.example` (spec §11 `NEXT_PUBLIC_*` incl. `NEXT_PUBLIC_QUALITY_TIER`), and `apps/arena/.gitignore` (`.env.local`, `.next`).

> No root `vitest.config.ts`, `biome.json`, or `pnpm-workspace.yaml` edits: existing globs already cover `packages/arena-world/test/**` and `packages/*`/`apps/*`. Root `tsconfig.json` reference is deferred to **T-ROOT**.

**Checkpoint (P0 gate)**: `pnpm typecheck` + `pnpm test` green (smoke passes).

---

## Phase P1: Quest-world map + mastery gate (US1) 🎯 MVP (spec §9 P1)

**Goal**: the graph renders as a traversable 3D overworld; nodes unlock ONLY via gate + prereqs; deterministic layout + 3D transform; calm reduced-motion + accessible Ledger convey identical states.

### Tests first (write, ensure they FAIL)

- [ ] **T010** [P] [US1] `packages/arena-world/test/world.test.ts` — `buildQuestWorld` derives 7 edges / 4 regions (spec §7.1); rejects a cycle and a dangling prerequisite.
- [ ] **T011** [P] [US1] `packages/arena-world/test/layout.test.ts` — `layoutQuestWorld` matches the golden 2D positions (spec §8.1) exactly; deterministic across two runs (SC-013).
- [ ] **T011a** [P] [US1] `packages/arena-world/test/world-transform.test.ts` — `resolveWorldTransform` matches the golden 3D positions (spec §8.23) exactly (`WORLD_SCALE`, elevation, `nodeLiftUnits`); deterministic; replayable (FR-042, SC-024).
- [ ] **T012** [P] [US1] `packages/arena-world/test/nodes.test.ts` — `deriveNodeStates` scenario **S1** (spec §8.2): gate-before-prereq (`blend-bay` locked; `place-value-point` available); `unlocked` iff prereqs mastered AND own gate; determinism; no time/visit input (FR-002/3/4, SC-001).
- [ ] **T012a** [P] [US1] `packages/arena-world/test/motion-tokens.test.ts` — `MOTION`/`EASINGS`/`LAMBDAS` exact + `resolveMotion` golden table (spec §8.10/§8.21); `reducedMotion:true` ⇒ `mode:"reduced"`, `easing:"Linear"`, reduced durations; every kind has a reduced equivalent (FR-034, SC-015).
- [ ] **T012b** [P] [US1] `packages/arena-world/test/art.test.ts` — `PALETTE`/`TYPOGRAPHY` exact tokens (spec §8.11); `resolveBiome`/`resolveElevation` golden rows (spec §8.12); unknown region throws (FR-031, SC-017).
- [ ] **T012c** [P] [US1] `packages/arena-world/test/avatar.test.ts` — `resolveAvatarAnimation` golden (spec §8.13); reduced-motion ⇒ `loop:false`/`easing:"Linear"`/`amplitudePx:0`/`-static` state; never `scale(0)` (FR-032, SC-016).
- [ ] **T012d** [P] [US1] `packages/arena-world/test/scene3d.test.ts` — `CAMERA3D` exact; `resolveParallaxLayers` 7 layers back→front; `LIGHTING`/`resolveLighting`, `WATER`/`resolveWater`, `POSTFX`/`resolvePostFx` exact per tier (spec §8.20); every camera motion has a reduced/instant equivalent (FR-033, SC-018).
- [ ] **T012e** [P] [US1] `packages/arena-world/test/assets.test.ts` — `ASSET_KEYS` stable grouped keys (spec §8.17); every key has a deterministic (seeded, no `Math.random`) procedural fallback descriptor; loader order model→procedural (FR-039, SC-023).
- [ ] **T012f** [P] [US1] `packages/arena-world/test/quality.test.ts` — `resolveQualityTier` maps each capability profile (no-WebGL→D; reduced-motion/low-power→C; Safari/iPad/weak→B; else A); `nextLowerTier` gives A→B→C→D→D; `QUALITY_TIERS` budget table + beacon-light cap (A=8/B=3/C=0) exact (spec §8.22/§8.24, FR-043, SC-025).
- [ ] **T012g** [P] [US1] `packages/arena-world/test/lighting.test.ts` — `resolveLighting` exact rigs per tier + `world-theme` variant; beacon/available/locked light contributions; light is never the sole state cue (paired with icon/shape) (FR-041, SC-026).

### Implementation

- [ ] **T013** [US1] Implement `buildQuestWorld(graphDef)` in `packages/arena-world/src/world.ts` (edges from prerequisites, stable regions, DAG/dangling validation).
- [ ] **T014** [US1] Implement `layoutQuestWorld(world)` in `packages/arena-world/src/layout.ts` (region-grid per spec §8.1; constants `REGION_SPACING=1024`, `NODE_SPACING=192`, `NODE_COLS=3`, `NODE_OFFSET=96`; bounds 2048×2048).
- [ ] **T014a** [US1] Implement `resolveWorldTransform(layout)` in `packages/arena-world/src/worldTransform.ts` (spec §8.20/§8.23; `WORLD_SCALE=0.03125`, `resolveElevation`, `nodeLiftUnits=0.6`, `seaLevel=-3.0`). Pure arithmetic; export from `index.ts`.
- [ ] **T015** [US1] Implement `deriveNodeStates(world, signals)` in `packages/arena-world/src/nodes.ts` (pure, deterministic).
- [ ] **T016** [US1] Implement the synthetic feed `packages/arena-world/src/feed.ts` — a deterministic, seeded `NodeMasterySignal` sequence/simulator (no `Math.random`; a seeded PRNG or fixed schedule) reproducing S1 and progressive unlocks.
- [ ] **T016a** [US1] Implement `resolveMotion` (`motion.ts`, §8.10), `resolveAvatarAnimation` (`avatar.ts`, §8.13), `resolveBiome`/`resolveElevation` (`art.ts`, §8.12), `resolveParallaxLayers`/`resolveLighting`/`resolveWater`/`resolvePostFx` (`scene3d.ts`, §8.20), `resolveQualityTier`/`nextLowerTier` (`quality.ts`, §8.24), and the `ASSET_KEYS` procedural-fallback descriptor helper (`assets.ts`, §8.17). Pure/deterministic; export from `index.ts`.
- [ ] **T017** [US1] First `buildArenaView` in `packages/arena-world/src/view.ts` composing `{ world, layout, nodeStates, presentation:{ biomes, worldTransform, camera, parallax, lighting, water, postfx, avatarAnim, qualityTier, qualityBudget, assetKeys, palette }, flags }` (progression/eligibility/base/standing/visualBand added in later phases); export from `index.ts`.
- [ ] **T018** [P] [US1] App scene bootstrap (**r3f v8 / drei v9**): `apps/arena/app/scene/eventBus.ts` (typed DOM↔scene bridge), `apps/arena/app/scene/ArenaCanvas.tsx` (`"use client"`; the r3f `<Canvas>` root loaded via `next/dynamic` `ssr:false`; set `dpr` from `qualityBudget.dprMax`, `toneMapping: ACESFilmic`, `outputColorSpace: sRGB`, color-management on; register WebGL context-lost/restored handlers → pause/resume, unrecoverable → Tier D; dispose on unmount), and `apps/arena/app/scene/geometry/` procedural low-poly mesh + material generators (deterministic, seeded, no `Math.random`; keyed to `ASSET_KEYS`).
- [ ] **T019** [US1] `apps/arena/app/scene/LightingRig.tsx` (key + hemi + ambient + rim from `resolveLighting`; shadow config per tier; sun-drift off under reduced motion) + `apps/arena/app/scene/SeaAndSky.tsx` (sky dome, cloud cards, water plane per `resolveWater(tier)`, fog to `--sea-deep`, motes; ambient motion off under reduced motion).
- [ ] **T020** [US1] `apps/arena/app/scene/WorldRoot.tsx` — render the Independence Isles from `ArenaView.presentation`: **floating biome islands** (instanced low-poly terrain at `worldTransform` positions + elevation, biome hues from `resolveBiome`, per-region island bob off under reduced motion), node markers per state (locked/available/unlocked, **color-independent** icon+shape+light-presence, marker labels = `landmark` via drei `<Html>`), lit edge paths + cross-island bridges, and **beacon point lights** for unlocked nodes (capped per `qualityBudget.maxDynamicLights`, spec §8.22; over-cap → emissive+bloom). `apps/arena/app/scene/Avatar.tsx` — the pseudonymous low-poly **lantern-avatar** driven by `resolveAvatarAnimation` (idle bob / walk / run, never `scale(0)`; damped interruptible move via drei `easing.damp3` from the live position). `apps/arena/app/scene/CameraRig.tsx` — **follow/orbit** rig (`followLambda 3.5`, `deadzoneRadius 2.0`, `lookAheadUnits 3.0`, bounded `<OrbitControls>` damping 0.08) + establishing **dolly-in** (dist 90→32, `intro` token); reduced-motion branch (instant cut/crossfade, ambient off, depth kept). Node reveal (scale 0.95→1.0 + beacon ignite, `Back.Out`, `resolveMotion("nodeReveal")`).
- [ ] **T021** [US1] `apps/arena/app/ledger/ArenaLedger.tsx` — accessible DOM parallel from `ArenaView`: quest `role="tree"` (`treeitem` accessible name = title + state + region), keyboard nav (Tab/Arrow/Enter), visible focus; canvas `aria-hidden`.
- [ ] **T021a** [US1] `apps/arena/app/scene/Fallback2D.tsx` — **Tier D** static 2D/DOM(SVG) rendering of the identical `ArenaView` (nodes/regions/states from `layout` + committed SVGs); no canvas mounts. (Stub acceptable at P1; fully wired in P6.)
- [ ] **T022** [US1] `apps/arena/app/ArenaClient.tsx` (`"use client"`) — gather `DeviceCaps`, call `resolveQualityTier` (or honor `NEXT_PUBLIC_QUALITY_TIER`), choose canvas (A/B/C) vs `Fallback2D` (D); wire `dynamic(() => import("./scene/ArenaCanvas"), { ssr:false })` + the Ledger + the synthetic feed; `apps/arena/app/page.tsx` renders it. Reduced-motion honored via `prefers-reduced-motion` + `NEXT_PUBLIC_REDUCED_MOTION_DEFAULT` (forces Tier-C calm behavior).

**Checkpoint (P1 gate = MVP)**: P0 gate + `pnpm --filter @gt100k/arena-world-app build` + smoke (zero console/WebGL errors) + walkthrough steps 1–2, 5.

---

## Phase P2: Tiers + deterministic cosmetics + avatar (US2) (spec §9 P2)

### Tests first (write, ensure they FAIL)

- [ ] **T023** [P] [US2] `packages/arena-world/test/progression.test.ts` — `tierForReward` boundaries `99/100/249/250/500/899/900/1500` (spec §8.4); S1 cumulative **300** → tier 2, `regionsComplete=["tinker-bluffs"]`, growth-vs-past populated (FR-005/6).
- [ ] **T024** [P] [US2] `packages/arena-world/test/cosmetics.test.ts` — `deriveCosmeticEligibility` S1 golden sets (spec §8.4) in catalog order; identical history ⇒ identical set; `equipCosmetic` rejects `avatar-cape-aurora` in S1 (FR-007, SC-002). **Also**: every cosmetic carries a stable `look`/`equipEffect` (spec §8.15) and `look` never changes eligibility (FR-035, SC-022).
- [ ] **T025** [P] [US2] `packages/arena-world/test/guardrails.test.ts` — static: no `Math.random` anywhere in `packages/arena-world/src`; `Cosmetic` has no `price|currency|dropRate|rarity` field; standings type has no `rank|position|percentile|outOf` field; no `SoundCue`/`SOUND_CUES` entry carries a `negative|alarm|loop` flag and all are `mutedByDefault`; **no 3D/render import in the domain source** (FR-008/019/037, SC-002/021).
- [ ] **T026** [P] [US2] `packages/arena-world/test/zero-power.test.ts` — mastery/node-state/matchmaking/standing outcomes byte-identical across all cosmetic/tier states; `equipCosmetic` mutates only cosmetic fields; the `world-theme` lighting-rig variant cannot reach any outcome function; avatar pseudonymous (FR-009/10, SC-003).

### Implementation

- [ ] **T027** [US2] Implement `tierForReward` + `computeProgression` (cumulative over unlocked, `regionsComplete`, growth-vs-past) in `packages/arena-world/src/progression.ts`.
- [ ] **T028** [US2] Implement `deriveCosmeticEligibility` + `equipCosmetic` in `packages/arena-world/src/cosmetics.ts` (deterministic rules `min-tier`/`min-unlocks`/`region-complete`; catalog-order output incl. each item's `look`/`equipEffect`; equip requires eligibility; **no money parameter**; `look` has zero effect on eligibility). Extend `resolveLighting` to accept the equipped `world-theme` variant (appearance-only, spec §8.15/§8.20).
- [ ] **T029** [US2] Extend `buildArenaView` (progression, representation stub, avatar, eligibility) + export from `index.ts`.
- [ ] **T030** [US2] `apps/arena/app/hud/Hud.tsx` — tier + growth-vs-past panel (tabular **Number ticker**, `motion@^12`) and a **cosmetic drawer** (equip eligible only; locked shown with its **earn goal**, e.g. "Light 3 beacons"; **NO purchase/roll UI**; drawer opens `Origin-aware` from its trigger with a 40ms item stagger); wire equip through the event bus so `Avatar` swaps its `avatar-item` child meshes via `Crossfade` (`resolveMotion("equip")`) and `world-theme`/`base-theme` cosmetics recolor + shift the lighting rig. Mirror controls into the Ledger (cosmetics as a labeled listbox showing `look` + earn goal).

**Checkpoint (P2 gate)**: P1 gate + walkthrough steps 3–4.

---

## Phase P3: Juice + errors-never-loss (US3) (spec §9 P3)

### Tests first (write, ensure they FAIL)

- [ ] **T031** [P] [US3] `packages/arena-world/test/celebrate.test.ts` — `classifyCelebration`: unlock of transferCritical → `high`; ordinary unlock → `medium`; struggle → `low`; incorrect attempt / help request → `null` and nothing removed; no loss type in union; `copyStyle="process-praise"` (FR-012/13/14, SC-007).
- [ ] **T032** [P] [US3] `packages/arena-world/test/motion.test.ts` — `celebrationMotionSpec` golden table (spec §8.5) incl. `bloomPeak` (1.4/1.1/0.7); `reducedMotion:true` ⇒ `{ mode:"static", particleCount:0, durationMs:150, cameraPunch:false }` (FR-015, SC-004).
- [ ] **T032a** [P] [US3] `packages/arena-world/test/sound.test.ts` — `resolveSoundCue` golden mapping (spec §8.18); all `mutedByDefault:true`; the `notYet` cue is neutral (`soft-tap`, no negative/alarm/loop) (FR-037, SC-021).

### Implementation

- [ ] **T033** [US3] Implement `classifyCelebration(signal)` + `celebrationMotionSpec(event, options)` (+`bloomPeak`) in `packages/arena-world/src/celebrate.ts` and `resolveSoundCue(event)` in `packages/arena-world/src/sound.ts`; export from `index.ts`.
- [ ] **T034** [US3] `apps/arena/app/scene/Fx.tsx` + `apps/arena/app/scene/PostFx.tsx` — the orchestrated celebration sequences of spec §5.7 (high: 3D `Burst + Bloom-pulse + Beacon-ignition + Camera-punch`; struggle: `Warm Pulse`) driven by `celebrationMotionSpec` + `resolveMotion` + `LAMBDAS` (counts/durations/bloomPeak §8.5/§8.10, particle count × `qualityBudget.particleScale`); `<EffectComposer>` bloom/vignette per `resolvePostFx(tier)`; a no-op / single static badge under reduced motion (Tier C). The calm `--notyet` **Float wisp** on error (**no** shake, no loss visual, node unchanged). Muted-by-default captioned sound cues via `resolveSoundCue`. Announce celebrations + captions in the Ledger via `aria-live="polite"`.
- [ ] **T034a** [US3] `apps/arena/app/hud/Onboarding.tsx` — first-run 3-beat **DOM coach-marks** (this-is-you → light-a-path → your-way) anchored over the canvas (`motion@^12`); skippable/dismissible on any input; **never blocks a mastery action** (FR-022/038); reduced-motion (`Fade`, no slide); shown once via a local flag, re-openable from the HUD "?"; fully mirrored in the Ledger.

**Checkpoint (P3 gate)**: P2 gate + walkthrough step 6.

---

## Phase P4: Persistent cohort base (US4) (spec §9 P4)

### Tests first (write, ensure it FAILS)

- [ ] **T035** [P] [US4] `packages/arena-world/test/base.test.ts` — `applyCohortContribution` over the 3-mission golden sequence ⇒ `unlockedFeatures=["campfire","banner","garden"]` (spec §8.8); append-only; replay-identical; prior contributions preserved; base confers no power (FR-011, SC-003).
- [ ] **T035a** [P] [US4] `packages/arena-world/test/base-layout.test.ts` — `resolveBaseLayout` golden placements for the §8.8/§8.16 base (`campfire`(hearth,1024,1024,kestrel), `banner`(gateway,1024,928,otter), `garden`(grove,944,1088,kestrel)); attributable `by`; deterministic unknown-feature `outskirts` fallback; replayable; zero power (FR-036, SC-019).

### Implementation

- [ ] **T036** [US4] Implement `applyCohortContribution(base, missionResult)` + `unlockedFeatures` (distinct, stable order) in `packages/arena-world/src/base.ts` and `resolveBaseLayout(base)` in `packages/arena-world/src/baseLayout.ts` (3D placement via `WORLD_SCALE` + Base Camp elevation 0.8); add `base` + `presentation.basePlacements` to `buildArenaView`; export from `index.ts`.
- [ ] **T037** [US4] `apps/arena/app/scene/BaseCamp.tsx` — render the Base Camp island from `resolveBaseLayout` into deterministic zones/slots (§8.16); attributable pseudonymous **lantern-marks** on focus (contributor + mission); `Pop-in place` accretion (`resolveMotion("baseAccretion")`, instant under reduced motion); the "home" landing (camera glide) when standings are off. Mirror as a list in the Ledger.

**Checkpoint (P4 gate)**: P3 gate + walkthrough step 5 (base).

---

## Phase P5: Age-band staging + plain mode + near-peer standings (US5) (spec §9 P5)

### Tests first (write, ensure they FAIL)

- [ ] **T038** [P] [US5] `packages/arena-world/test/staging.test.ts` — `resolveRewardRepresentation` exact band strings (spec §8.6); 6-8 `showRawNumber=false` + `comparisonDefault="off"` (FR-017/18, SC-005).
- [ ] **T038a** [P] [US5] `packages/arena-world/test/visual-band.test.ts` — `resolveVisualBand` exact tokens (spec §8.19); 6-8 `showCanvasNumbers=false` + `celebrationCeiling="medium"` + `markerScale=1.25`; underlying state identical across bands (FR-040, SC-020).
- [ ] **T039** [P] [US5] `packages/arena-world/test/standings.test.ts` — `deriveStanding` null unless `optedIn`; S1 golden `selfGain=300`, `gainToBandTop=40` (spec §8.7); no `rank`/`position`/`percentile`/`outOf` field (FR-019, SC-009).
- [ ] **T040** [P] [US5] `packages/arena-world/test/plain-mode.test.ts` — `buildArenaView` + `plainViewEquals`: reduced-motion/plain/lower-tier view has identical underlying state, differs only in `flags` + `presentation`; learning/access/standing unchanged with standings off / plain on (FR-020/029, SC-006/014).
- [ ] **T041** [P] [US5] `packages/arena-world/test/view.test.ts` — `buildArenaView` composes all fields (incl. the full 3D `presentation` block) for a full scenario; drives the Ledger view-model completeness (SC-012/014).

### Implementation

- [ ] **T042** [US5] Implement `resolveRewardRepresentation(ageBand, progression)` + `resolveVisualBand(ageBand)` in `packages/arena-world/src/staging.ts` (band tables spec §8.6/§8.19; economy + underlying state unchanged across bands).
- [ ] **T043** [US5] Implement `deriveStanding(self, nearPeers, options)` in `packages/arena-world/src/standings.ts` (default off; gain-based; anonymized; `gainToBandTop=max(gains)-selfGain`; no rank).
- [ ] **T044** [US5] Finalize `buildArenaView` + `plainViewEquals` in `packages/arena-world/src/view.ts` (all fields incl. `representation`, `standing`, and the full `presentation` block with `visualBand`/`qualityTier`/`qualityBudget`/`lighting`/`water`/`postfx`; `plainViewEquals` compares state fields, allowing `flags`+`presentation` to differ); export from `index.ts`.
- [ ] **T045** [US5] Extend `apps/arena/app/hud/Hud.tsx` + `ArenaClient.tsx`: age-band switch (re-renders canvas presentation via `resolveVisualBand`: 6-8 no canvas numbers / story labels / `×1.25` markers / 56px targets / `medium` celebration ceiling), plain-mode toggle, audio toggle (muted default), **opt-in standings panel (default off)**; standings show own gain vs. band top (never a rank). Mirror all controls into the Ledger. (`motion@^12`.)

**Checkpoint (P5 gate)**: P4 gate + walkthrough steps 7–8.

---

## Phase P6: Quality ladder, performance & graceful degradation (US6) (spec §9 P6)

- [ ] **T046** [US6] Wire `qualityBudget` into the renderer in `apps/arena/app/scene/*`: cap `dpr`, toggle shadows (`LightingRig`), water mode (`SeaAndSky`), post-fx (`PostFx`), and enforce the **dynamic-light cap** in `WorldRoot`/`BaseCamp` (nearest-to-camera-target selection, over-cap → emissive+bloom; spec §8.22). Confirm Tier C (calm) keeps depth + strips all motion (baked beacons, static camera, no ambient/particles).
- [ ] **T046a** [US6] Frame monitor in `apps/arena/app/scene/ArenaCanvas.tsx`: a rolling average frame-time; on avg > 18ms over 90 frames call `nextLowerTier` and re-render at the lower budget (never a visible flash, never blocks input); WebGL context-lost/unrecoverable → Tier D. Emit `degrade` events on the bus for the HUD tier indicator.
- [ ] **T046b** [US6] Finish `apps/arena/app/scene/Fallback2D.tsx` (Tier D): a complete static 2D/DOM(SVG) rendering of the identical `ArenaView` (islands/nodes/states/base from `layout` + committed SVGs), never mounting the canvas; the Ledger + HUD remain fully functional.
- [ ] **T046c** [US6] `packages/arena-world/test/quality.test.ts` (finalize) — the full `resolveQualityTier`/`nextLowerTier`/budget/beacon-cap golden table (spec §8.22/§8.24) if not already complete from T012f; add the auto-degrade path assertions (FR-043, SC-025).

**Checkpoint (P6 gate)**: P5 gate + acceptance walkthrough (perf) — 60fps on the min managed device (Tier A laptop / Tier B iPad-Safari), auto-degrade works, Tier D renders without a canvas, mastery action never blocked.

---

## Phase P7: Polish, accessibility & acceptance (spec §9 P7)

- [ ] **T047** [P] `packages/arena-world/test/synthetic.test.ts` — the whole domain surface runs from fixtures with no consent/admissions/legal input (FR-024, SC-008).
- [ ] **T048** [P] `packages/arena-world/README.md` (public API, inputs/ports, guardrail summary, "builds on @gt100k/learning-loop", "no 3D dependency — config only"); optional `packages/arena-world/src/demo.ts` + `demo` script matching quickstart.
- [ ] **T049** Commit the seed asset kit under `apps/arena/public/seed/` keyed to `ASSET_KEYS` (§8.17): committed SVG **icons** (`ui-lock`, `ui-star`, `ui-home`, `ui-audio`, `ui-help`) and the **Tier D 2D fallback** art (flat node/region/base SVGs). Confirm the **model→procedural** loader renders each key and that the procedural geometry/material still renders when an optional model is absent (FR-030/039). Optional non-breaking dirs `public/models/` + `public/atlas/` + `public/fonts/` documented but empty (procedural + system-rounded fallback by default, §8.25 / §13 DP-6).
- [ ] **T050** Accessibility + performance acceptance pass on `apps/arena` per quickstart: reduced-motion parity (the calm Tier C keeps depth; every §5.6 motion has its equivalent; ambient off); `prefers-reduced-transparency` → solid panels; `prefers-contrast: more` → bordered panels; keyboard/switch/screen-reader over the Ledger (landmark names, captions, `aria-live`); color-independent cues (icon + text + light-presence); ≥4.5:1 contrast (`--focus` rings); canvas `aria-hidden`; audio muted-by-default; 60fps min-device + full quality ladder (A/B/C/D) + auto-degrade + graceful WebGL context-loss → Tier D; mastery action never blocked; onboarding non-blocking (FR-015/16/22/23/28/33/37/38/41/43, SC-004/10/11/12/25/26).
- [ ] **T051** Run `quickstart.md` end-to-end (`pnpm --filter @gt100k/arena-world test`, `pnpm lint`, `pnpm --filter @gt100k/arena-world-app build` + app smoke) and confirm **SC-001…SC-026** map green.
- [ ] **T-ROOT** **[FINAL — shared root file]** Add `{ "path": "packages/arena-world" }` to the root `tsconfig.json` `references` so `tsc -b` includes the new package. This is the **only** shared-root edit and is applied last (parallel-safety). Then confirm `pnpm typecheck` is clean.

---

## Dependencies & Execution Order

- **P0 (blocks all)** → **P1 (US1, MVP)** → **P2 (US2)** → **P3 (US3)** → **P4 (US4)** → **P5 (US5)** → **P6 (US6, quality ladder)** → **P7 (polish)**.
- Domain functions depend on `model.ts` (T003) and fixtures (T004); reward-driven functions (tiers/cosmetics/staging/standings) depend on `deriveNodeStates`/`computeProgression`. `resolveWorldTransform` depends on `layoutQuestWorld` + `resolveElevation`. `buildArenaView` grows phase by phase (T017 → T029 → T036 → T044).
- All app scene components depend on the scene bootstrap (T018) and the exported `ArenaView` for their phase. The quality-ladder wiring (P6) depends on `qualityBudget` being present in `buildArenaView` (T017+).
- **T-ROOT** is last and touches a shared root file.

## Within each phase

- Tests are written first and MUST fail before implementation (use spec §8 golden values verbatim).
- Types/model before functions; functions before their `index.ts` export; domain export before the scene/HUD/Ledger that consumes it.

## Parallel Opportunities

- P0: T002/T004/T004a/T004b/T006/T007/T008/T009 in parallel after T001/T003.
- Per phase, the `[P]` test tasks run in parallel with each other; implementation tasks touching shared files (`index.ts`, `view.ts`, `page.tsx`, `Hud.tsx`, `WorldRoot.tsx`, `ArenaCanvas.tsx`) are sequential.
- Because domain modules are distinct files, the test authoring for P2–P6 (T023–T026, T031–T032, T035, T038–T041, T046c) can be drafted in parallel once P1 is done — but keep them test-first per phase.

## Implementation Strategy

- **MVP = P0 + P1** (mastery-gated traversable 3D quest world with the Independence Isles art direction, floating islands, beacon-lighting, avatar states, camera rig, motion-token system, calm reduced-motion tier, accessible Ledger, and a Tier-D stub) → validate → then P2 (tiers/cosmetics), P3 (juice), P4 (base), P5 (staging/standings/plain-mode), P6 (quality ladder/perf), P7 (polish).
- Commit per task or logical group; test-gated. Synthetic-only; no consent/admissions/legal machinery.

## Summary

- **Total tasks**: 74 (T001–T051 + suffixed art/3D/quality tasks + T-ROOT)
- **P0** 11 (T001–T009, T004a, T004b) · **P1/US1** 24 (T010–T022, T011a, T012a–g, T014a, T016a, T021a) · **P2/US2** 8 (T023–T030) · **P3/US3** 6 (T031–T034, T032a, T034a) · **P4/US4** 4 (T035–T037, T035a) · **P5/US5** 9 (T038–T045, T038a) · **P6/US6** 4 (T046, T046a–c) · **P7/polish** 6 (T047–T051 + T-ROOT)
- **New domain golden tests**: `world-transform`, `motion-tokens`, `art`, `avatar`, `scene3d`, `assets`, `quality`, `lighting` (P1); `sound` (P3); `base-layout` (P4); `visual-band` (P5) — each test-first against spec §8 golden values.
- **MVP scope**: P0 + P1 (the Independence Isles 3D art direction, floating islands, mastery-as-light beacons, avatar states, camera rig, motion-token system, quality-tier resolution + Tier-D stub).
- **Final task**: T-ROOT (root `tsconfig.json` reference).
