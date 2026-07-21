# Implementation Plan: Arena Progression World (RPG Game-Experience Layer)

**Branch**: `004-arena-game-world` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-arena-game-world/spec.md`

## Summary

Deliver the §15.3 Arena progression world as two cleanly separated parts. (1) A **pure, framework-agnostic TypeScript domain package `packages/arena-world`** holds the deterministic **rules**: the competency graph as a traversable quest world + a **deterministic overworld layout**; node lock/unlock derived **only** from the 90% independent-mastery gate (§12) plus prerequisites; gain-based tier/level progression from the independence reward (§13); **deterministic** cosmetic-unlock eligibility (no randomness, no purchase, zero power); a pseudonymous avatar; persistent co-built cohort-base state; celebration-event classification (independent-unlock / productive-struggle, never loss) + a deterministic **motion spec**; age-band representation resolution (§14.13); near-peer/anonymized/opt-in/no-bottom-rank standings (§15); and a single composed **`ArenaView`** that drives every renderer. (2) A **new Next.js App Router app `apps/arena`** renders a **real 2D game on Phaser 4** (`^4.2.1`, Canvas/WebGL with the rebuilt WebGL renderer) — an animated overworld, a tweened avatar, a follow-camera, a cohort **base scene**, and particle **celebrations** — with a first-class **reduced-motion equal mode** and a **synchronized accessible DOM/ARIA parallel structure ("Arena Ledger")** for WCAG 2.2 AA, both driven by one shared `ArenaView`. Phaser 4's rebuilt WebGL renderer and GPU context-loss/restore handling underwrite the 60fps + graceful-degradation target. The domain package **builds on `@gt100k/learning-loop`** (feature 001) — reusing `Section`/`SECTIONS`, the mastery-gate concept, XP, and the beyond-floor engagement signal — and injects the §12/§13 signals as synthetic `NodeMasterySignal` records. Tests are first-class for the domain package; the app is verified by `next build` + a seeded smoke (zero console/WebGL errors) + the acceptance walkthrough. Synthetic learners only; no consent/admissions/legal machinery. Ordered build path and machine-checkable acceptance live in **spec.md §9–§10**.

**Child-facing review (load-bearing).** This is a child-facing surface. Per the constitution's *Human review before child exposure* (ENG) and PRD §25, **no build-loop output reaches a child without passing a named human-review gate**. The autonomous build loop MAY draft every artifact and implement code on the `004-arena-game-world` branch and open a PR, but the loop is **PR-only**: a named human reviewer approves before merge, and child exposure never occurs on build-loop authority alone. Evidence posture is **[E3]/[R]** — the engagement/belonging lift is measured against belonging and voluntary return (§2.6, the §15 rollback gate), never assumed to improve learning; a mechanic that raises time-in-app while depressing belonging/voluntary return **auto-reverts**.

## Technical Context

**Language/Version**: TypeScript (strict, per `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), Node.js LTS (PRD §26.1).

**Primary Dependencies**: Domain — none (pure TS, depends only on the workspace package `@gt100k/learning-loop`). UI — Next.js `^14.2.15` App Router + React `^18.3.1` (matching `apps/student-compass`) + **Phaser `^4.2.1`** (latest stable 4.x; the 2D game engine with a rebuilt WebGL renderer and GPU context-loss/restore handling; Pixi.js only with a documented reason; the engine choice is **settled** — spec §13 DP-2 resolved), using **Phaser-4 APIs only** (particles/tweens/scenes/camera/input — spec §2 D1), with `transpilePackages` for the workspace TS packages. Phaser is loaded **client-only** (`next/dynamic` `ssr:false`, created in `useEffect`, `game.destroy(true)` on unmount).

**Storage**: In-memory only for the synthetic slice; the domain is stateless-pure over injected state. A repository port (mirroring feature 001's `DailyProgressRepository`) MAY back the base/avatar/progression state, with an in-memory adapter; no DB in this slice.

**Testing**: Vitest (unit + contract) for the domain package — auto-discovered by the root `vitest.config.ts` glob `packages/**/test/**/*.test.ts` (no root edit needed). UI verified via `next build` + the quickstart acceptance walkthrough.

**Target Platform**: Local/dev (Node + browser). No cloud/infra in this slice.

**Project Type**: Web application (TS monorepo: `packages/` domain + `apps/` frontend).

**Performance Goals**: The domain is O(nodes) per derivation and not performance-bound. The Phaser client carries the §15.3 budget as an **acceptance target**: 60 fps on the minimum supported device with a reduced/degraded tier (halved particle count, glow/shadow off) and graceful degradation under load / low-end hardware / WebGL context loss — underwritten by **Phaser 4's rebuilt WebGL renderer and its GPU context-loss/restore handling**; the game surface never blocks/delays a mastery action; zero console/WebGL errors.

**Constraints**: Domain is pure (no I/O, no wall-clock, **no randomness** — `Math.random` is banned in `packages/arena-world`), deterministic and replayable. Reduced motion is an equal mode; WCAG 2.2 AA via the accessible DOM Ledger (canvas `aria-hidden`). No purchase/financial path; no gacha/loot; zero-power cosmetics; no caste ranks. The game surface never gates a mastery action. Seed assets are committed in-repo (SVG) + a deterministic procedural fallback — no external fetch.

**Scale/Scope**: One synthetic learner's quest world (9-node / 4-region fixture) + one synthetic cohort's base; the Phaser overworld + base scenes; a synthetic mastery-signal feed. Real graph authoring, the mastery engine, the tutor, live RivalryMix/WebRTC, and real standings/matchmaking infrastructure are out of scope.

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

| Principle | Status | Note |
|---|---|---|
| I. Human authority over consequential decisions | ✅ Pass | The surface makes no consequential decision and contains no learned model; node unlock is a deterministic rule over the §12 gate. Child exposure is human-gated (PR-only build loop; §25). |
| II. Child assent & veto | ✅ Aligned | Opt-out is free (plain mode, standings off) with no loss (FR-020); raising competitive exposure is out of scope and would need fresh assent. |
| III. Evidence-class authority ladder | ✅ Pass | No model promoted; the experience lift is **[E3]/[R]** — measured against belonging/voluntary return, no production authority, auto-reverts on belonging harm. |
| IV. Evidence before authority; deterministic rules | ✅ Pass | All gates are deterministic rules in code (node-state, tier, cosmetic eligibility), no weights; no randomness. |
| V. Privacy follows purpose | ✅ Pass | Avatars/base/cosmetics pseudonymous, no PII/sensitive data; synthetic learners only (FR-024). |
| VI. Accessibility & non-discrimination | ✅ Pass | Reduced motion is a first-class equal mode; WCAG 2.2 AA via the synchronized accessible DOM Ledger (canvas `aria-hidden`; keyboard/switch/screen-reader; ≥4.5:1); no accommodation penalty (FR-015/FR-016). Canvas-a11y approach is **settled** as the parallel-DOM Ledger (spec §13 DP-1 resolved). |
| VII. Durable learning over performance | ✅ Pass | Progression is bought with the 90% independent-mastery gate, never grinding (FR-002); errors never a loss (FR-013). |
| VIII. Bounded motivational pressure | ✅ Pass | Standings opt-in/default-off/near-peer/anonymized/no-bottom-rank; **no caste ranks** (G6, FR-019); no dark patterns/FOMO (FR-021). |
| IX. Prohibited product behavior (G1) | ✅ Pass | **No** financial/purchase path for minors, **no** gacha/loot randomness, **no** caste leaderboards; cosmetics carry zero power (FR-007/8/9). |
| ENG (governed flow, tests-define-done, no secrets, human review before child exposure) | ✅ Pass | Branch→PR→CI; Vitest gate first-class for domain (`tsc -b` + Vitest); app verified by `next build` + seeded smoke (zero console/WebGL errors) + walkthrough; no secrets/machine paths (`.env.local` git-ignored, only non-secret `NEXT_PUBLIC_*`); synthetic-only; **child-facing human-review gate before merge** (§25, FR-026). |

**Result: PASS** — no violations, no Complexity Tracking needed. The hard guardrails (no loot/purchase, zero-power cosmetics, no caste ranks, reduced-motion equality, age staging, errors-never-loss, non-blocking, human review) are encoded as functional requirements (FR-002–FR-030) and as contract-test obligations so they are enforced deterministically rather than asserted.

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
└── arena-world/             # NEW — PURE domain: the deterministic RULES of the game layer
    ├── src/
    │   ├── model.ts         # all domain types (data-model.md): AgeBand, CompetencyNode, QuestWorld,
    │   │                    #   NodePosition/WorldLayout, NodeMasterySignal, NodeState, ProgressionState,
    │   │                    #   Tier, Cosmetic (no price/rarity), CosmeticEligibility, AvatarState,
    │   │                    #   CooperativeMissionResult, CohortBase, CelebrationEvent, MotionSpec,
    │   │                    #   RewardRepresentation, NearPeerStanding, ArenaView
    │   ├── world.ts         # buildQuestWorld(graphDef) — graph→map (nodes/edges/regions), DAG/dangling validation
    │   ├── layout.ts        # layoutQuestWorld(world) — deterministic region-grid positions (spec §8.1)
    │   ├── nodes.ts         # deriveNodeStates() — lock/available/unlock from mastery gate + prereqs
    │   ├── progression.ts   # computeProgression() + tierForReward() — gain-based, deterministic, regionsComplete
    │   ├── cosmetics.ts     # deriveCosmeticEligibility() + equipCosmetic() — deterministic, no $, zero-power
    │   ├── base.ts          # applyCohortContribution() — deterministic co-built base accretion
    │   ├── celebrate.ts     # classifyCelebration() + celebrationMotionSpec() — unlock/struggle only, never loss
    │   ├── staging.ts       # resolveRewardRepresentation(ageBand,...) — §14.13 vocabulary
    │   ├── standings.ts     # deriveStanding() — near-peer/anon/opt-in/no-bottom-rank/gain-based (no rank field)
    │   ├── view.ts          # buildArenaView() + plainViewEquals() — one state → every renderer (D4)
    │   ├── graph.fixture.ts # 9-node / 4-region synthetic competency-graph fixture (built on learning-loop Sections)
    │   ├── tiers.fixture.ts # tier table (spec §7.2)
    │   ├── catalog.fixture.ts # cosmetic catalog (spec §7.3)
    │   ├── feed.ts          # synthetic NodeMasterySignal feed/simulator (deterministic, seeded)
    │   └── index.ts         # public surface
    ├── test/                # Vitest unit + contract tests (mirror FR/SC; guardrails first) + smoke.test.ts
    ├── package.json         # @gt100k/arena-world; dep: @gt100k/learning-loop (workspace:*)
    ├── tsconfig.json        # extends ../../tsconfig.base.json (composite)
    └── README.md
apps/
├── student-compass/         # feature 001 UI — NOT MODIFIED
└── arena/                   # NEW — Next.js App Router: the Phaser quest-world experience
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx         # server shell: dynamic(ssr:false) Phaser mount + HUD + accessible Ledger
    │   ├── globals.css      # prefers-reduced-motion / .plain-mode / focus-visible / contrast tokens
    │   ├── ArenaClient.tsx  # "use client" root: view-model state, flags, HUD, Ledger, event bus
    │   ├── game/
    │   │   ├── ArenaGame.tsx    # client-only Phaser bootstrap (useEffect create/destroy); dynamic-imported
    │   │   ├── config.ts        # Phaser.Types.Core.GameConfig (scenes, scale, WebGL, reduced-tier)
    │   │   ├── eventBus.ts      # React ↔ Phaser bridge (set band/plain/equip/feed; emit focus/celebrate)
    │   │   └── scenes/
    │   │       ├── BootScene.ts     # read flags/seed; register procedural texture generator
    │   │       ├── PreloadScene.ts  # load committed seed SVGs; procedural fallback; no external fetch
    │   │       ├── WorldScene.ts    # overworld: regions/nodes/edges/avatar/follow-camera/traversal/reveal
    │   │       ├── BaseScene.ts     # cohort Base Camp: co-built features + attributable contributors
    │   │       └── FxScene.ts       # celebration overlay from celebrationMotionSpec (no-op under reduced motion)
    │   ├── ledger/
    │   │   └── ArenaLedger.tsx  # accessible DOM parallel (role=tree, listbox, aria-live) from ArenaView
    │   └── hud/
    │       └── Hud.tsx          # tier/growth panel, cosmetic drawer, band switch, plain/standings toggles
    ├── public/seed/         # committed tiny SVG seed assets (avatar parts, node markers, region tiles, base props)
    ├── .env.local.example   # NEXT_PUBLIC_* placeholders (spec §11); .env.local git-ignored
    ├── .gitignore           # ignores .env.local, .next
    ├── package.json         # deps: @gt100k/arena-world, @gt100k/learning-loop, next, react, phaser
    ├── next.config.mjs      # transpilePackages: ["@gt100k/arena-world","@gt100k/learning-loop"]
    └── tsconfig.json        # mirrors apps/student-compass (noEmit, jsx preserve, DOM libs)
tsconfig.json                # ROOT — add { "path": "packages/arena-world" } as the FINAL,
                             #   human-reconciled task only (shared root file; do not edit early)
```

**Structure Decision**: Mirror feature 001's proven split — a **pure, side-effect-free domain package** (`packages/arena-world`) holding every rule, with the framework-bound **Phaser game** isolated in a **new Next.js app** (`apps/arena`). The domain has no randomness, no I/O, and no wall-clock, so all guardrails (mastery-only unlock, deterministic cosmetics + layout, zero-power, age staging, no-caste standings, errors-never-loss, motion spec) are unit-testable as pure functions. The domain composes **one `ArenaView`** (`buildArenaView`) that the Phaser scene, the reduced-motion/plain rendering, and the **accessible DOM Ledger** all consume — so reduced-motion is an *equal* mode and accessibility is parity-by-construction (`plainViewEquals`). Phaser is client-only (`ssr:false`, created/destroyed in `useEffect`). **Parallel-safety**: all new code lives in the two new directories; `pnpm-workspace.yaml` already globs `packages/*` and `apps/*`, the root `vitest.config.ts` already globs `packages/**/test/**`, and `biome.json` already lints `packages`/`apps` — so **no shared root file is edited** except the single root `tsconfig.json` project reference, deferred to the final task (T-ROOT) and flagged for human reconcile. The ordered build path (P0…P6) and machine-checkable acceptance (SC-001…SC-014 ↔ named tests) live in **spec.md §9–§10**.

## Complexity Tracking

None — Constitution Check passed with no violations.
