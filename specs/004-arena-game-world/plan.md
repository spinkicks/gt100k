# Implementation Plan: Arena Progression World (RPG Game-Experience Layer)

**Branch**: `004-arena-game-world` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-arena-game-world/spec.md`

## Summary

Deliver the §15.3 Arena progression world as two cleanly separated parts. (1) A **pure, framework-agnostic TypeScript domain package `packages/arena-world`** holds the deterministic **rules and presentation config**: the competency graph as a traversable quest world + a **deterministic 2D overworld layout** and its **derived 3D world transform** (elevation, positions); node lock/unlock derived **only** from the 90% independent-mastery gate (§12) plus prerequisites; gain-based tier/level progression from the independence reward (§13); **deterministic** cosmetic-unlock eligibility (no randomness, no purchase, zero power); a pseudonymous avatar; persistent co-built cohort-base state; celebration-event classification (independent-unlock / productive-struggle, never loss) + a deterministic **motion spec**; age-band representation resolution (§14.13); near-peer/anonymized/opt-in/no-bottom-rank standings (§15); the **deterministic 3D scene config** (lighting rig incl. mastery-as-light beacons, camera rig, water, post-fx, parallax, damping lambdas) and the **quality-tier ladder** (`resolveQualityTier`/`nextLowerTier` + per-tier budgets + beacon-light cap); and a single composed **`ArenaView`** that drives every renderer. (2) A **new Next.js App Router app `apps/arena`** renders a **real 3D game on react-three-fiber + three.js + drei** (WebGL2) — a stylized low-poly / storybook-3D archipelago of floating islands under golden-hour light with soft shadows and **dynamic beacon-lighting**, a damped interruptible follow/orbit camera, a charming pseudonymous low-poly lantern avatar, water shimmer, 3D particle celebrations, and a co-built cohort **Base Camp** island — with a first-class **reduced-motion equal mode** (the calm static-3D Tier C that keeps depth), a **graceful-degradation quality ladder** (A full-3D → B reduced-3D → C calm → D 2D/static DOM on weak GPU / low power / no-WebGL), and a **synchronized accessible DOM/ARIA parallel structure ("Arena Ledger")** for WCAG 2.2 AA, all driven by one shared `ArenaView`. **DOM/HUD motion is standardized on `motion@^12`**; continuous in-canvas motion uses drei `easing.damp*`. The domain package **builds on `@gt100k/learning-loop`** (feature 001) — reusing `Section`/`SECTIONS`, the mastery-gate concept, XP, and the beyond-floor engagement signal — and injects the §12/§13 signals as synthetic `NodeMasterySignal` records. Tests are first-class for the domain package; the app is verified by `next build` + a seeded smoke (zero console/WebGL errors) + the acceptance walkthrough. Synthetic learners only; no consent/admissions/legal machinery. Ordered build path and machine-checkable acceptance live in **spec.md §9–§10**.

**Child-facing surface (load-bearing).** This is a child-facing surface, so the child-safety guardrails of the spec (FR-026) apply: reduced-motion as a first-class equal mode, WCAG 2.2 AA, no dark patterns, no loot/purchase, zero-power cosmetics, no caste ranks, age-appropriate staging, errors-never-loss, and non-blocking of mastery actions. Evidence posture is **[E3]/[R]** — the engagement/belonging lift is measured against belonging and voluntary return (§2.6, the §15 rollback gate), never assumed to improve learning; a mechanic that raises time-in-app while depressing belonging/voluntary return **auto-reverts**.

## Technical Context

**Language/Version**: TypeScript (strict, per `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), Node.js LTS (PRD §26.1).

**Primary Dependencies**: Domain — none (pure TS, depends only on the workspace package `@gt100k/learning-loop`; **no 3D/render dependency** — the domain computes config values only). UI — Next.js `^14.2.15` App Router + React `^18.3.1` (matching `apps/student-compass`) + the 3D + motion stack: **three `^0.169.0`**, **@react-three/fiber `^8.17.10`** (React-18-compatible declarative renderer), **@react-three/drei `^9.114.0`** (camera/environment/soft-shadows/`easing.damp*`/`<Html>`/`<OrbitControls>`), **@react-three/postprocessing `^2.16.3`** (bloom/vignette/SMAA), and **motion `^12`** (DOM/HUD motion via `motion/react`). `transpilePackages` for the workspace TS packages. The `<Canvas>` is loaded **client-only** (`next/dynamic` `ssr:false`); the r3f root is disposed on unmount; WebGL context-lost/restored handlers pause/resume and drop to Tier D on unrecoverable loss. The engine choice is **settled** (3D via r3f — spec §13 DP-2 resolved). **API discipline**: pin r3f v8 / drei v9 / postprocessing v2 (do not bump to r3f v9 / drei v10, which require React 19); `easing.damp*` for continuous interruptible motion; `three` easing/`MathUtils` for scripted sequences; cap `dpr` per tier; **no** physics engine and **no** external `useGLTF` fetch (only committed `public/models/**` when present, spec §8.25).

**Storage**: In-memory only for the synthetic slice; the domain is stateless-pure over injected state. A repository port (mirroring feature 001's `DailyProgressRepository`) MAY back the base/avatar/progression state, with an in-memory adapter; no DB in this slice.

**Testing**: Vitest (unit + contract) for the domain package — auto-discovered by the root `vitest.config.ts` glob `packages/**/test/**/*.test.ts` (no root edit needed). UI verified via `next build` + the quickstart acceptance walkthrough.

**Target Platform**: Local/dev (Node + browser). Managed-device profile: managed laptops (full Tier A) + iPad/Safari (reduced Tier B); weaker/no-WebGL devices served by Tiers C/D. No cloud/infra in this slice.

**Performance Goals**: The domain is O(nodes) per derivation and not performance-bound. The r3f client carries the §15.3 budget as an **acceptance target**: **60 fps on the minimum managed device** (Tier A laptops / Tier B iPad-Safari) with the deterministic **quality ladder** (spec §8.24) — auto-drop a tier on sustained overrun, cap DPR + concurrent dynamic point lights (spec §8.22) + shadows/water/post-fx per tier, fall to a **calm static-3D tier** (reduced motion / low power) and to a **2D/static DOM tier** (no-WebGL / unrecoverable context loss); the game surface never blocks/delays a mastery action; zero console/WebGL errors.

**Constraints**: Domain is pure (no I/O, no wall-clock, **no randomness** — `Math.random` is banned in `packages/arena-world`), deterministic and replayable, and **carries no 3D/render dependency** (it computes numbers/strings the app applies). Reduced motion is an equal mode (the calm Tier C, which keeps 3D depth); WCAG 2.2 AA via the accessible DOM Ledger (canvas `aria-hidden`). No purchase/financial path; no gacha/loot; zero-power cosmetics; no caste ranks. The game surface never gates a mastery action at any quality tier. Seed assets are authored in-repo (procedural code geometry + committed SVGs) with a deterministic procedural fallback — no external fetch.

**Scale/Scope**: One synthetic learner's quest world (9-node / 4-region fixture) + one synthetic cohort's base; the r3f overworld + Base Camp island; a synthetic mastery-signal feed. Real graph authoring, the mastery engine, the tutor, live RivalryMix/WebRTC, real standings/matchmaking infrastructure, physics, and photoreal/PBR asset pipelines are out of scope.

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

| Principle | Status | Note |
|---|---|---|
| I. Human authority over consequential decisions | ✅ Pass | The surface makes no consequential decision and contains no learned model; node unlock is a deterministic rule over the §12 gate. |
| II. Child assent & veto | ✅ Aligned | Opt-out is free (plain mode, standings off, a lower quality tier) with no loss (FR-020); raising competitive exposure is out of scope and would need fresh assent. |
| III. Evidence-class authority ladder | ✅ Pass | No model promoted; the experience lift is **[E3]/[R]** — measured against belonging/voluntary return, no production authority, auto-reverts on belonging harm. |
| IV. Evidence before authority; deterministic rules | ✅ Pass | All gates are deterministic rules in code (node-state, tier, cosmetic eligibility, quality tier, lighting/transform config), no weights; no randomness. |
| V. Privacy follows purpose | ✅ Pass | Avatars/base/cosmetics pseudonymous, no PII/sensitive data; synthetic learners only (FR-024). |
| VI. Accessibility & non-discrimination | ✅ Pass | Reduced motion is a first-class equal mode (calm Tier C keeps depth); WCAG 2.2 AA via the synchronized accessible DOM Ledger (canvas `aria-hidden`; keyboard/switch/screen-reader; ≥4.5:1); no accommodation penalty (FR-015/FR-016). Canvas-a11y approach is **settled** as the parallel-DOM Ledger (spec §13 DP-1 resolved). |
| VII. Durable learning over performance | ✅ Pass | Progression is bought with the 90% independent-mastery gate, never grinding (FR-002); errors never a loss (FR-013). |
| VIII. Bounded motivational pressure | ✅ Pass | Standings opt-in/default-off/near-peer/anonymized/no-bottom-rank; **no caste ranks** (G6, FR-019); no dark patterns/FOMO (FR-021). |
| IX. Prohibited product behavior (G1) | ✅ Pass | **No** financial/purchase path for minors, **no** gacha/loot randomness, **no** caste leaderboards; cosmetics carry zero power (FR-007/8/9). |
| ENG (governed flow, tests-define-done, no secrets) | ✅ Pass | Vitest gate first-class for domain (`tsc -b` + Vitest); app verified by `next build` + seeded smoke (zero console/WebGL errors) + walkthrough; no secrets/machine paths (`.env.local` git-ignored, only non-secret `NEXT_PUBLIC_*`); synthetic-only; child-facing guardrails apply (FR-026). |

**Result: PASS** — no violations, no Complexity Tracking needed. The hard guardrails (no loot/purchase, zero-power cosmetics, no caste ranks, reduced-motion equality, age staging, errors-never-loss, non-blocking, 60fps + degradation ladder) are encoded as functional requirements (FR-002–FR-043) and as contract-test obligations so they are enforced deterministically rather than asserted. The 3D renderer choice does not change any rights/safety posture: accessibility is via the same parallel-DOM Ledger, reduced motion is the calm static-3D tier, and the quality ladder guarantees the frame budget + non-blocking on the managed fleet.

## Project Structure

### Documentation (this feature)

```text
specs/004-arena-game-world/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── arena-world.md   # Phase 1 output (domain API + guardrail test obligations)
├── checklists/
│   └── requirements.md  # Spec-quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/
├── learning-loop/           # feature 001 — REUSED, NOT MODIFIED (Section, gate, XP, beyond-floor)
└── arena-world/             # NEW — PURE domain: deterministic RULES + presentation CONFIG (no 3D dep)
    ├── src/
    │   ├── model.ts         # all domain types (data-model.md): incl. WorldTransform3D, CameraConfig3D,
    │   │                    #   LightingConfig, WaterConfig, PostFxConfig, QualityTier/QualityBudget/DeviceCaps,
    │   │                    #   plus AgeBand, CompetencyNode, QuestWorld, NodeState, ProgressionState, Tier,
    │   │                    #   Cosmetic (no price/rarity), CelebrationEvent, MotionSpec, RewardRepresentation,
    │   │                    #   NearPeerStanding, Presentation, ArenaView
    │   ├── world.ts         # buildQuestWorld(graphDef) — graph→map (nodes/edges/regions), DAG/dangling validation
    │   ├── layout.ts        # layoutQuestWorld(world) — deterministic 2D region-grid positions (spec §8.1)
    │   ├── worldTransform.ts# resolveWorldTransform(layout) — deterministic 3D positions (spec §8.20/§8.23)
    │   ├── nodes.ts         # deriveNodeStates() — lock/available/unlock from mastery gate + prereqs
    │   ├── progression.ts   # computeProgression() + tierForReward() — gain-based, deterministic, regionsComplete
    │   ├── cosmetics.ts     # deriveCosmeticEligibility() + equipCosmetic() — deterministic, no $, zero-power
    │   ├── base.ts          # applyCohortContribution() — deterministic co-built base accretion
    │   ├── celebrate.ts     # classifyCelebration() + celebrationMotionSpec() (+bloomPeak) — unlock/struggle only, never loss
    │   ├── staging.ts       # resolveRewardRepresentation() + resolveVisualBand() — §14.13 vocabulary + canvas presentation (§8.19)
    │   ├── standings.ts     # deriveStanding() — near-peer/anon/opt-in/no-bottom-rank/gain-based (no rank field)
    │   ├── art.ts           # PALETTE, TYPOGRAPHY, resolveBiome(), resolveElevation() — Independence Isles identity (§8.11/§8.12)
    │   ├── motion.ts        # MOTION, EASINGS, LAMBDAS, resolveMotion() — deterministic motion tokens + damping lambdas (§8.10/§8.21)
    │   ├── avatar.ts        # resolveAvatarAnimation() — idle/walk/run/think/celebrate (§8.13/§8.26)
    │   ├── scene3d.ts       # CAMERA3D, LIGHTING, PARALLAX3D, WATER, POSTFX, WORLD_SCALE; resolveLighting/
    │   │                    #   resolveParallaxLayers/resolveWater/resolvePostFx (spec §8.20)
    │   ├── quality.ts       # QUALITY_TIERS, resolveQualityTier(caps), nextLowerTier(tier), beacon-light cap (§8.22/§8.24)
    │   ├── baseLayout.ts    # resolveBaseLayout() — deterministic Base Camp zones/slots (§8.16)
    │   ├── sound.ts         # SOUND_CUES, resolveSoundCue() — muted-by-default, neutral error (§8.18)
    │   ├── assets.ts        # ASSET_KEYS registry — model→procedural keys (§8.17)
    │   ├── view.ts          # buildArenaView() (+ presentation block incl. 3D config) + plainViewEquals() — one state → every renderer (D4)
    │   ├── graph.fixture.ts # 9-node / 4-region synthetic competency-graph fixture (+landmarks; built on learning-loop Sections)
    │   ├── tiers.fixture.ts # tier table (spec §7.2)
    │   ├── catalog.fixture.ts # cosmetic catalog + look/equipEffect (spec §7.3/§8.15)
    │   ├── biomes.fixture.ts  # per-region biome identity + elevation (spec §8.12/§8.20)
    │   ├── baseLayout.fixture.ts # base zone/slot table (spec §8.16)
    │   ├── feed.ts          # synthetic NodeMasterySignal feed/simulator (deterministic, seeded)
    │   └── index.ts         # public surface
    ├── test/                # Vitest unit + contract tests (mirror FR/SC; guardrails first) + smoke.test.ts
    ├── package.json         # @gt100k/arena-world; dep: @gt100k/learning-loop (workspace:*)
    ├── tsconfig.json        # extends ../../tsconfig.base.json (composite)
    └── README.md
apps/
├── student-compass/         # feature 001 UI — NOT MODIFIED
└── arena/                   # NEW — Next.js App Router: the react-three-fiber quest-world experience
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx         # server shell: renders ArenaClient
    │   ├── globals.css      # prefers-reduced-motion / prefers-reduced-transparency / .plain-mode / focus-visible / contrast tokens
    │   ├── ArenaClient.tsx  # "use client" root: view-model state, flags, quality-tier resolution, HUD, Ledger, event bus
    │   ├── scene/
    │   │   ├── ArenaCanvas.tsx  # client-only r3f <Canvas> root (dynamic ssr:false); dpr/tonemapping/color-mgmt; context-loss handlers
    │   │   ├── eventBus.ts      # DOM ↔ scene bridge (set band/plain/tier/equip/feed; emit focus/celebrate/degrade)
    │   │   ├── LightingRig.tsx  # key+hemi+ambient+rim (+sun-drift) from resolveLighting; shadow config per tier
    │   │   ├── SeaAndSky.tsx    # sky dome, cloud cards, water plane (shader/cheap/static per tier), fog, motes
    │   │   ├── WorldRoot.tsx    # floating biome islands (instanced low-poly), node markers per state (color-independent), lit paths/bridges, beacon lights (capped, §8.22)
    │   │   ├── Avatar.tsx       # pseudonymous low-poly lantern-explorer; resolveAvatarAnimation; damped interruptible traversal; cosmetic child meshes
    │   │   ├── CameraRig.tsx    # follow/orbit hybrid + deadzone + look-ahead + establishing dolly-in + region focus + celebration punch
    │   │   ├── BaseCamp.tsx     # cohort Base Camp island: resolveBaseLayout zones/slots + attributable lantern-marks
    │   │   ├── Fx.tsx           # orchestrated celebration sequences (3D burst/bloom-pulse/beacon-ignition/camera-punch) from celebrationMotionSpec + resolveMotion + LAMBDAS; no-op under reduced motion
    │   │   ├── PostFx.tsx       # <EffectComposer> bloom/vignette/SMAA per resolvePostFx(tier); off on Tier C
    │   │   ├── geometry/        # procedural low-poly mesh + material generators (deterministic, seeded, no Math.random)
    │   │   └── Fallback2D.tsx   # Tier D: static 2D/DOM(SVG) rendering of the identical ArenaView (no canvas)
    │   ├── ledger/
    │   │   └── ArenaLedger.tsx  # accessible DOM parallel (role=tree w/ landmark names, listbox, aria-live, captions) from ArenaView
    │   └── hud/
    │       └── Hud.tsx          # tier/growth panel, cosmetic drawer (earn-goal not price), band switch, plain/standings/audio/quality toggles, Home/? controls (motion@^12)
    ├── public/seed/         # committed tiny SVG icons + Tier D 2D fallback art (nodes/regions/base/ui)
    ├── public/models/       # OPTIONAL committed Draco-glTF (non-breaking richer-art path; keyed identically)
    ├── public/atlas/        # OPTIONAL packed texture atlas (non-breaking; keyed identically)
    ├── public/fonts/        # OPTIONAL self-hosted subset woff2 (non-breaking; system-rounded fallback by default)
    ├── .env.local.example   # NEXT_PUBLIC_* placeholders (spec §11); .env.local git-ignored
    ├── .gitignore           # ignores .env.local, .next
    ├── package.json         # deps: @gt100k/arena-world, @gt100k/learning-loop, next, react, three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, motion
    ├── next.config.mjs      # transpilePackages: ["@gt100k/arena-world","@gt100k/learning-loop"]
    └── tsconfig.json        # mirrors apps/student-compass (noEmit, jsx preserve, DOM libs)
tsconfig.json                # ROOT — add { "path": "packages/arena-world" } as the FINAL task only (shared root file; do not edit early)
```

**Structure Decision**: Mirror feature 001's proven split — a **pure, side-effect-free domain package** (`packages/arena-world`) holding every rule **and every deterministic presentation config value** (incl. the 3D world transform, lighting/camera/water/post-fx config, and the quality-tier ladder), with the framework-bound **r3f/three scene** isolated in a **new Next.js app** (`apps/arena`). The domain has no randomness, no I/O, no wall-clock, **and no 3D dependency** (it computes numbers/strings only), so all guardrails — mastery-only unlock, deterministic cosmetics + layout + 3D transform, zero-power, age staging, no-caste standings, errors-never-loss, motion spec, lighting rig, and the quality ladder — are unit-testable as pure functions. The domain composes **one `ArenaView`** (`buildArenaView`) that the 3D scene, the calm reduced-motion tier, the 2D fallback (Tier D), and the **accessible DOM Ledger** all consume — so reduced-motion is an *equal* mode and accessibility is parity-by-construction (`plainViewEquals`). r3f is client-only (`ssr:false`, disposed on unmount). **Parallel-safety**: all new code lives in the two new directories; `pnpm-workspace.yaml` already globs `packages/*` and `apps/*`, the root `vitest.config.ts` already globs `packages/**/test/**`, and `biome.json` already lints `packages`/`apps` — so **no shared root file is edited** except the single root `tsconfig.json` project reference, deferred to the final task (T-ROOT). The ordered build path (P0…P7) and machine-checkable acceptance (SC-001…SC-026 ↔ named tests) live in **spec.md §9–§10**.

## Complexity Tracking

None — Constitution Check passed with no violations. The 3D renderer adds app-layer complexity (a scene graph, a quality ladder, a 2D fallback), but all of it is bounded to `apps/arena` and driven by deterministic, unit-tested domain config; the pure core carries no rendering and no 3D dependency.
