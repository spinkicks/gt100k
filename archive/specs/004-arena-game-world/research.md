# Phase 0 Research: Arena Progression World

No blocking unknowns remain; the decisions below record the choices the plan rests on. Scope follows PRD §15.3 / §15.3.1; guardrails follow §12, §13, §14.12, §14.13, §15, and the constitution (G1/G6). Both prior open judgments are now **settled**: the rendering engine is **3D (react-three-fiber + three.js + drei)** (spec §13 DP-2) and the canvas-accessibility approach is the **synchronized parallel accessible DOM "Arena Ledger"** (spec §13 DP-1, resolved).

## Decision: Rendering engine is 3D (react-three-fiber + three.js + drei, WebGL2), not Phaser 2D or DOM/CSS

- **Decision**: The Arena is a **real 3D game** — a stylized low-poly / storybook-3D archipelago — rendered with **react-three-fiber (r3f)** over **three.js**, using **@react-three/drei** helpers and **@react-three/postprocessing** for bloom/vignette. **Phaser is dropped.** This was an explicit evaluation (2.5D-elevated-Phaser vs. 3D); 3D wins and meets every hard requirement (child-safety, 60fps, WCAG, no-fetch, fallback).
- **Why 3D wins (rationale):**
  1. **The core metaphor *is* a lighting feature.** Design pillar 2 is "mastery is the only currency of light" (spec §5). In 2D a lit beacon is a glow sprite; **in 3D it is a real dynamic point light** that warms the island, casts soft shadows, and lights the onward path when a node's 90% gate clears. The §12 mechanic becomes literally the renderer's lighting engine — the single most load-bearing reason to choose 3D. `resolveLighting` + the beacon-light cap (spec §8.20/§8.22) make this deterministic and testable.
  2. **Floating storybook islands + cinematic camera.** Low-poly islands floating over a deep-teal void, a damped interruptible follow/orbit camera, an establishing dolly-in over the whole archipelago, water shimmer with sun-glint, and 3D particle celebrations are categorically more impressive than a 2.5D plane — the "jaw-dropping flagship" ask.
  3. **r3f fits the React app better than Phaser.** Phaser is imperative, bolted into `useEffect`; r3f is a **declarative React scene graph** that consumes the same `ArenaView` the HUD and Ledger do — one React tree, one state source, fewer bridge seams. Interruptible motion is idiomatic: drei's `easing.damp3` eases from the *presentation value* every frame (exactly Apple's fluidity principle).
  4. **The domain is renderer-agnostic.** `packages/arena-world` computes an `ArenaView` of golden values; switching the renderer changes the **app layer only**. Every domain golden value + guardrail is preserved and *extended* with additive 3D constants (world transform, elevation, lighting, camera rig, quality tiers).
- **Why 3D still meets the non-negotiable bar (honest counter-analysis):**
  - **60fps on the min managed device** is held by the deterministic **quality ladder** (spec §8.24): Tier A full-3D (managed laptop) → B reduced-3D (iPad/Safari) → C calm static-3D → D 2D/static DOM (no-WebGL). Dynamic lights are **capped per tier** (spec §8.22), DPR capped, shadows/water/post-fx dropped by tier, geometry instanced, and a rolling frame monitor **auto-degrades** via `nextLowerTier`. A 2D/static + no-WebGL fallback was already required as a degradation ladder — 3D just makes the top taller.
  - **Accessibility is identical.** The `<canvas>` is `aria-hidden` in any renderer; the Arena Ledger DOM twin is the AT source of truth (D5). 3D changes nothing about keyboard/switch/screen-reader operation.
  - **Reduced motion is a full equal mode.** Tier C ("calm") **keeps the 3D depth** (islands, elevation, materials, baked golden-hour light) and strips *all* motion: static camera at rest pose, no ambient/water/particles, beacons steady (baked), celebrations static + `aria-live`. Reduced motion is *the same world held still*, not a downgrade.
  - **No-fetch / public-repo-safe assets.** World geometry is **procedurally authored in TypeScript** (deterministic low-poly primitives) — text-diffable, tiny, no CDN. Committed Draco-glTF + a texture atlas are **non-breaking upgrades** keyed identically (spec §8.25). HUD icons stay committed SVGs (also the Tier D art).
- **Alternatives considered**:
  - **Elevated 2.5D Phaser 4** — rejected: it cannot render *real* light (the core metaphor), floating-island depth, or an orbit camera as convincingly; the imperative engine adds a bridge seam that r3f avoids; and its perf advantage is moot once the quality ladder is a first-class requirement anyway.
  - **DOM/CSS/SVG "map"** — rejected (reads as a dashboard; no camera/lights/scene graph). Retained only as the **Tier D fallback** rendering.
  - **Babylon.js** — capable, but r3f's React-declarative model + the drei/postprocessing ecosystem fit this React/Next app and the one-view-model architecture better.
  - **Pixi.js** — 2D only; same limitations as Phaser for the light metaphor.
- **API discipline (avoid version traps)**: pin r3f **v8** + drei **v9** + postprocessing **v2** (React-18 compatible; do NOT bump to r3f v9 / drei v10, which require React 19 — the repo is React `^18.3.1`). Use `easing.damp3`/`damp` (drei) for continuous interruptible motion; `three` `MathUtils`/easing for scripted sequences (dolly-in, celebration). Cap `dpr` per tier; use `frameloop` demand where safe. **No** physics engine; **no** external `useGLTF` fetch (only committed `public/models/**` when present).

## Decision: Next.js + WebGL integration is client-only (no SSR)

- **Decision**: three.js / r3f reference `window`/`document`/WebGL, so the `<Canvas>` mount is loaded via `next/dynamic(() => import("./scene/ArenaCanvas"), { ssr:false })`; the r3f root is created on mount and disposed on unmount (r3f disposes renderer + scene graph; manual `THREE` resources are freed in effect cleanup). `next.config.mjs` sets `transpilePackages: ["@gt100k/arena-world","@gt100k/learning-loop"]`. The build must have zero console/WebGL errors (the review smoke asserts this), and WebGL context-lost/restored handlers pause/resume the loop and drop to Tier D on unrecoverable loss.
- **Rationale**: A naive three import crashes SSR with `ReferenceError: window is not defined`; `ssr:false` + client mount is the standard pattern. Clean disposal prevents leaked WebGL contexts under React strict-mode remounts.
- **Alternatives considered**: A separate Vite app outside Next — rejected (diverges from the repo's Next-based `apps/*` convention and the root build/lint globs). Rendering WebGL server-side — impossible.

## Decision: Canvas accessibility via a synchronized parallel accessible DOM ("Arena Ledger") — DP-1 RESOLVED

- **Decision (settled)**: A WebGL `<canvas>` is opaque to assistive tech, so the app renders a **synchronized semantic HTML/ARIA parallel structure** built from the **same `ArenaView`** — one shared view-model drives both the 3D scene and the Ledger: the quest graph as a keyboard-navigable `role="tree"`, tier/reward/cosmetics/base as labeled text/lists, celebrations via `aria-live="polite"`. The canvas is `aria-hidden="true"`; the Ledger is the AT source of truth. Full keyboard/switch operation, visible focus, color-independent cues, ≥4.5:1 contrast (WCAG 2.2 AA). Reduced motion stays a first-class **equal** mode (the calm Tier C). Settled (spec §13 DP-1) — the loop does not re-open it.
- **Rationale**: §15.3 + constitution VI require WCAG 2.2 AA keyboard/switch/screen-reader operability. A parallel DOM is the robust, framework-agnostic way to make any canvas game accessible, and because both renderers consume the one `ArenaView`, parity is by construction. The renderer choice (3D vs 2D) is irrelevant to this decision.
- **Alternatives considered (rejected)**: (b) a dedicated `/accessible` full-page route — splits the surface, risks drift; (c) in-canvas a11y plugins — brittle, non-standard. The shared `ArenaView` makes the parallel-DOM Ledger both the strongest and the cheapest option.

## Decision: A deterministic quality ladder in the domain (Tier A/B/C/D)

- **Decision**: `resolveQualityTier(caps)` is a pure function of a `DeviceCaps` descriptor → `A | B | C | D` (spec §8.24): no-WebGL → D; reduced-motion/low-power → C; Safari/iPad/weak/no-WebGL2 → B; else A. `nextLowerTier(tier)` gives the deterministic auto-degrade path A→B→C→D. The per-tier budget table (DPR cap, shadows, max dynamic lights, water, post-fx, ambient, particle scale) and the beacon-light cap (spec §8.22) are golden constants in the domain; the app *applies* them.
- **Rationale**: 3D is only acceptable because the degradation ladder is first-class, deterministic, and testable — not a runtime guess. Putting the tier logic + budgets in the pure layer makes "the min device holds 60fps / degrades gracefully / never blocks a mastery action" a structural, unit-testable guarantee (SC-010/SC-025) rather than an assertion, and gives the app one sanctioned source of truth for every perf lever. The 2D/static (Tier D) and calm (Tier C) tiers render the *identical* `ArenaView`, so degradation never loses state.
- **Alternatives considered**: Runtime-only heuristics in the app — rejected (untestable, drifts, hard to reason about). A single fixed quality — rejected (can't meet both the managed-laptop and iPad-Safari targets). Requiring WebGL — rejected (must degrade to a DOM fallback on no-WebGL / context loss).

## Decision: Procedural low-poly geometry in code (no fetch) + committed SVGs for UI/2D + procedural material fallback

- **Decision**: World objects (islands, node markers/beacons, avatar parts, base props, bridges, water) are **generated procedurally in TypeScript** from deterministic parameters — no binary meshes, no external fetch. HUD/Ledger icons and the Tier D 2D fallback art are committed tiny **SVGs**. A deterministic procedural material generator (seeded, no `Math.random`) tints by biome/state so a missing asset still renders. Committed Draco-glTF (`public/models/`) + a texture atlas (`public/atlas/`) are non-breaking upgrades keyed identically (spec §8.25).
- **Rationale**: The loop must build with no network and the public repo must stay free of binary bloat; procedural code geometry is tiny, text-diffable, deterministic, and public-repo-safe, and the procedural fallback keeps the scene rendering even with a missing asset. Satisfies FR-030/FR-039 and keeps the seeded smoke green. Mirrors feature 001's "committed SVG + procedural fallback" philosophy, adapted to 3D.
- **Alternatives considered**: Fetching glTF from a CDN — rejected (external fetch, offline-fragile). Committing large binary GLBs up front — rejected (public-repo bloat, not diffable); allowed only as the optional non-breaking upgrade branch.

## Decision: A deterministic 3D world transform in the domain

- **Decision**: `resolveWorldTransform(layout)` maps the §8.1 grid layout to exact 3D positions via `WORLD_SCALE = 0.03125` + per-region `resolveElevation(region)` + `nodeLiftUnits` (spec §8.20/§8.23). Layout stays 2D-grid in the domain (unchanged golden values); the 3D transform is a pure, additive derivation.
- **Rationale**: A 3D game needs stable spatial structure; putting the transform in the pure layer makes camera/avatar/beacon behavior reproducible and lets the 3D scene, the 2D fallback, and the Ledger agree on structure. Golden 3D positions (spec §8.23) remove "where does this island/node sit?" ambiguity and are unit-testable (SC-024) — without pulling three.js into the domain (the transform is plain arithmetic).

## Decision: Deterministic overworld layout in the domain (unchanged)

- **Decision**: `layoutQuestWorld(world)` is a pure function producing exact node positions (spec §8.1) via a region-grid. Layout lives in the domain, not the app.
- **Rationale**: A game needs stable spatial structure; the 2D grid is the canonical source the 3D transform (above) derives from, and it keeps the golden positions renderer-independent.

## Decision: Split into a pure domain package + a new Next.js app

- **Decision**: `packages/arena-world` (pure, deterministic rules + presentation config) + `apps/arena` (the r3f experience). Do **not** modify `packages/learning-loop` or `apps/student-compass`.
- **Rationale**: Mirrors feature 001's proven, testable split. Every hard guardrail can be encoded as a pure function and unit-tested (mastery-only unlock, deterministic cosmetics, zero-power, staging, no-caste standings, errors-never-loss, the 3D config + quality ladder). Keeps the build parallel-safe: only new directories change. **No 3D/render dependency enters the domain** — it computes config (numbers/strings), the app applies it via three/r3f.
- **Alternatives considered**: Building scene logic straight into a Next.js app — rejected (entangles rules with rendering, defeats determinism/testability). A Go/Rust real-time service (PRD §26.2/§26.3) — deferred; unnecessary for a synthetic single-cohort slice.

## Decision: Node unlock is a deterministic function of the §12 mastery gate + prerequisites

- **Decision**: `deriveNodeStates(world, signals)` returns `locked | available | unlocked` per node. `unlocked` iff all prerequisites mastered **and** the node's own `masteryCleared` is true; `available` iff prerequisites mastered but own gate not yet cleared; else `locked`. No time/visit input exists.
- **Rationale**: Encodes FR-002/FR-003 ("bought with mastery, never grinding") structurally — there is no code path by which time-in-app can flip a node. Pure predicate over state → trivially testable across all edge cases (gate-before-prereq, etc.). In 3D, `unlocked` additionally drives the beacon-light ignition (the mastery-as-light payoff, FR-041) — but the *state* is still a pure function.
- **Alternatives considered**: XP/time-threshold unlock — rejected (violates §15.3 and FR-002). Reusing learning-loop's daily project-unlock gate — rejected: that gate unlocks project time for a day; node unlock needs the per-node 90% independent-mastery signal (§12), injected as `NodeMasterySignal`.

## Decision: Inject the §12/§13 signals as synthetic `NodeMasterySignal` records

- **Decision**: The 90%-independent-mastery gate result and the §13 independence reward are **inputs** (`NodeMasterySignal { nodeId, masteryCleared, independenceReward }`) supplied by a stub/simulator, not computed here.
- **Rationale**: This feature owns the *game representation of* mastery/reward, not the mastery engine or the answer-blind tutor (§13). Keeps the domain deterministic and synthetic-only, and lets a real mastery/reward source replace the stub later with zero domain change. Builds on `@gt100k/learning-loop` for `Section`/`SECTIONS`/XP/beyond-floor.
- **Alternatives considered**: Recomputing mastery here — rejected (out of scope; would duplicate §12).

## Decision: Cosmetic eligibility is deterministic competence-gating; no randomness, no money

- **Decision**: `deriveCosmeticEligibility(catalog, progression, nodeStates)` is a pure function of competence thresholds (tier reached, N independent unlocks, region completed). The `Cosmetic` type has **no price field** and **no random/drop mechanic**; `Math.random` is banned in the package. `equipCosmetic` rejects un-earned cosmetics and only ever mutates `AvatarState` cosmetic fields. `world-theme` cosmetics also select a lighting-rig variant (appearance only, zero power).
- **Rationale**: Encodes G1 (no financial mechanisms for minors), §15.3 (no gacha/loot, never purchasable), and FR-007/8/9 structurally. Determinism is directly assertable (same input → same eligible set across runs).
- **Alternatives considered**: Variable-ratio/loot-box unlocks — **explicitly prohibited** by §14.12/§15.3. A money-purchasable currency — prohibited by G1.

## Decision: Zero-power cosmetics/tiers proven by outcome-invariance tests

- **Decision**: Mastery, node-unlock, matchmaking, and standing functions take **no** cosmetic/tier input. Contract tests assert those outcomes are identical across all cosmetic/tier states (SC-003). The lighting-rig variant a `world-theme` selects is presentation-only and cannot reach any outcome function.
- **Rationale**: "Zero power" (FR-009, §15.3) is strongest when enforced by the type signatures (the functions cannot see cosmetics) and verified by invariance tests, not by convention.

## Decision: Age-band representation resolves from the learner's band; economy unchanged

- **Decision**: `resolveRewardRepresentation(ageBand, progression)` returns a band view model (currency label, `showRawNumber`, comparison mode, failure-copy style) per the §14.13 table; `resolveVisualBand(band)` returns canvas presentation tokens (§8.19). The underlying `ProgressionState` is identical across bands; only representation varies. 6-8: `showRawNumber=false`, comparison off, no canvas numbers, celebration ceiling capped.
- **Rationale**: Encodes §14.13 / FR-017/FR-018/FR-040. "Same event, different vocabulary per band" is a direct configuration test (SC-005/SC-020).
- **Alternatives considered**: Separate per-band economies — rejected (§14.13: "computed identically at every age").

## Decision: Standings are near-peer, anonymized, opt-in, gain-based, no bottom-rank; no caste representable

- **Decision**: `deriveStanding(self, nearPeers, options)` returns `null` unless opted in (default off), and otherwise a gain-based, anonymized, near-peer standing surfacing the learner's own gain against the band top — **never** a "last of N" position. No type in the package can express a fixed-ability caste rank, public tier name, or full-field ranking.
- **Rationale**: Encodes §15 / G6 / FR-019. Making the prohibited forms *unrepresentable* is stronger than validating against them.

## Decision: Celebration is classified in the domain; motion/light live only in the UI

- **Decision**: `classifyCelebration(signal)` returns an `independent-unlock` or `productive-struggle` `CelebrationEvent`, or `null` — and **never** a loss event. Incorrect attempts/help requests remove nothing. `celebrationMotionSpec(event, {reducedMotion})` returns particle count, duration, camera-punch, and the transient `bloomPeak` (spec §8.5). The UI maps them to 3D particles/bloom/beacon-ignition/camera-punch and their reduced-motion equivalents.
- **Rationale**: Keeps §14.12 failure-framing rules (errors-never-loss, process-praise) testable in the pure layer, independent of rendering. Reduced-motion parity (FR-015) then becomes a UI rendering obligation over the same event stream, and the 3D beacon-ignition is a rendering of the already-derived `unlocked` state + event.

## Decision: Reduced motion / plain mode as an equal rendering path over identical state (the calm Tier C)

- **Decision**: The UI computes one view model from the domain and renders it either full-spectacle (Tier A/B) or calm static-3D (Tier C, the reduced-motion/plain path) with **identical** conveyed state/progression/celebration and **kept depth**. Opt-out changes nothing in learning/access/standing (FR-020, SC-006).
- **Rationale**: §15.3 requires reduced motion be a *first-class equal mode*, not a degraded fallback. In 3D the calm tier keeps the islands/elevation/materials/baked golden-hour light and only stops motion — proving "the same world, held still." Modeling one state → many renderings guarantees parity by construction.

## Decision: Tests first-class for the domain; UI verified by build + acceptance walkthrough

- **Decision**: Vitest contract/unit tests are written first (must fail) for every domain function and every guardrail — including the 3D config functions (`resolveWorldTransform`, `resolveLighting`, `resolveQualityTier`/`nextLowerTier`, the budget table + beacon cap). The `apps/arena` UI is validated by `next build` + the quickstart acceptance walkthrough (frame budget is an acceptance target, not a unit test).
- **Rationale**: The constitution makes tests part of "done"; the domain carries the enforceable guarantees (incl. the perf-ladder logic), and the UI's value (motion, feel, 60 fps) is verified experientially per §15.3.1.

## Decision: Art direction — "Independence Isles", golden-hour floating archipelago (not the SaaS-cream default)

- **Decision**: A warm, hand-illustrated storybook-atlas *made solid* — low-poly **floating islands** over a **deep teal-navy void** so warm islands glow; a claymorphic low-poly register (soft-shaded facets, thin dark contour, warm double-bounce lighting). Warmth is carried by **light + material accent + typography**, not a cream bg. The mastery-as-light beacon rig, exact palette, per-biome hues + elevation, and typography tokens are golden constants (spec §8.11/§8.12/§8.20); the visual identity is spec §5.1–§5.3.
- **Rationale**: §15.3 demands "the polish, motion, and progression feel of a real game," and the surface is the *afternoon/social* time — perpetual golden hour. Applying the impeccable register discipline avoids the 2026 AI-cream monoculture; a deep-teal void + real golden-hour lighting makes mastery-as-light legible (locked = cool/dim/unlit, unlocked = warm/lit beacon), tying art directly to the §12 mechanic. State is always paired with icon/shape/light so color is never the sole cue (WCAG 2.2 AA).
- **Alternatives considered**: A cream/sand editorial palette — rejected (AI default; can't carry the mastery-as-light metaphor). A neon/dark-game look — rejected (too cold for a warmth/belonging surface, harder for the 6-8 band). A photoreal register — rejected (over-scoped, heavier, less child-warm; stylized low-poly is friendlier and far cheaper to hold 60fps). Fonts via Google Fonts CDN — **rejected** (violates no-external-fetch); default is a system-rounded fallback stack, optional committed subset `woff2` a non-breaking upgrade (spec §13 DP-6).

## Decision: One deterministic motion-token registry (+ damping lambdas) drives all motion and its reduced-motion equivalents

- **Decision**: `MOTION` (durations) + `EASINGS` (named curves) are exact exported constants; `resolveMotion(kind, {reducedMotion})` returns a `MotionToken` per the golden §8.10 table, with a first-class reduced column for every kind. `LAMBDAS` (spec §8.21) are exact per-second decay rates for the continuous, interruptible in-canvas eases (`easing.damp*`). The master motion table (spec §5.6) names each effect (from the animation-vocabulary glossary), its layer (DOM `motion@^12` vs canvas), easing/lambda, duration token, particles, camera/light feedback, sound cue, and reduced-motion equivalent.
- **Rationale**: Emil/Apple: motion is designed, frequency-appropriate, interruptible, and reduced-motion is *gentler not gone*. Putting durations/easings/lambdas in the pure layer makes them testable constants (SC-015) and makes reduced-motion parity provable rather than asserted. It enforces the exclusions (no shake/wiggle-on-error, no `scale(0)`, no `ease-in` entrances, no gacha reveal, no decay meter, no engagement-timed pop-in, no camera roll/inversion, no looping audio) by giving the app one sanctioned source of motion. DOM/HUD motion is standardized on **`motion@^12`**; continuous 3D motion uses `easing.damp*`; scripted 3D sequences use the same tokens.
- **Alternatives considered**: Ad-hoc per-component tween literals — rejected (drifts, untestable, easy to violate reduced-motion parity). A CSS-only motion system — rejected (CSS covers only the HUD/Ledger; the canvas is three.js, which reuses the same tokens/lambdas).

## Decision: Deterministic avatar animation states + camera/lighting/water/post-fx config in the pure layer

- **Decision**: `resolveAvatarAnimation(intent, options)` returns exact `{state,loop,durationMs,easing,amplitudePx}` (spec §8.13) with a 3D mapping contract (§8.26), never `scale(0)`, with reduced-motion equivalents; `CAMERA3D`, `resolveLighting`, `resolveParallaxLayers`, `resolveWater`, `resolvePostFx` are exact config (spec §8.20). The pseudonymous low-poly lantern-avatar is expressive-only (no ability signal, §29).
- **Rationale**: A game reads as a game because of a living avatar, a follow/orbit camera with deadzone/look-ahead/establishing shot, real lighting, and layered parallax. Keeping the *specs* pure makes them deterministic/testable (SC-016/018/026) while the app applies them via three/r3f. Interruptibility is guaranteed by construction (the spec carries no absolute start; the app eases from the live value with `easing.damp3` — Apple's "animate from the presentation value").
- **Alternatives considered**: Hard-coded tweens in components — rejected (untestable, drifts from reduced-motion parity). A physics/spring avatar — over-scoped for tile-to-tile traversal; damped moves with the named lambdas suffice.

## Decision: Cohort-base layout, cosmetic looks, sound cues, visual bands, and asset keys are all deterministic domain data

- **Decision**: `resolveBaseLayout` (zones/slots §8.16), cosmetic `look`/`equipEffect` (§8.15), `resolveSoundCue`/`SOUND_CUES` (muted-by-default, neutral error, §8.18), `resolveVisualBand` (age-band canvas presentation §8.19), and the `ASSET_KEYS` registry (§8.17, model→procedural) all live in the pure package as golden constants/functions; the app renders them.
- **Rationale**: Every visual/audio/asset decision the guardrails care about (attributable + zero-power base; no price/rarity on cosmetics; neutral non-looping muted audio; 6-8 no-canvas-number; missing-asset still renders) becomes a testable structural guarantee (SC-019/020/021/022/023) rather than a rendering convention. Sound has **no asset pipeline** this slice (spec §13 DP-7) — cue ids + captions only.
- **Alternatives considered**: Placing these in the app — rejected (loses determinism/testability and risks guardrail drift). A real audio sample set now — deferred (committed non-fetched samples are a later non-breaking add).

## Decision: First-run onboarding as a skippable, non-blocking, Ledger-mirrored DOM overlay

- **Decision**: A 3-beat coach-mark sequence (this-is-you → light-a-path → your-way: plain-mode/Ledger/standings-off) rendered as DOM coach-marks (`motion@^12`) over the canvas, shown once, dismissible on any input, never gating a mastery action, fully mirrored in the Ledger, honoring reduced motion (spec §5.5 / FR-038).
- **Rationale**: Wayfinding (Apple) + activation (impeccable onboard) without dark patterns: onboarding must never block the mastery action (FR-022) and must be reachable by keyboard/screen-reader. A DOM overlay keeps it out of the WebGL scene (crisp text, accessible by default) and reuses the HUD motion system.
- **Alternatives considered**: A mandatory tutorial gate — rejected (blocks the mastery action; dark-pattern-adjacent). In-canvas coach-marks — rejected (text in WebGL is less accessible/crisp). No onboarding — rejected (the 6-8 band needs the concrete "light a path" framing).

## Decision: Evidence posture for the child-facing surface — [E3]/[R], belonging-gated

- **Decision**: This is a child-facing surface. Evidence posture **[E3]/[R]**: the engagement/belonging lift is measured against belonging and voluntary return (§2.6), never assumed to improve learning; a mechanic that raises time-in-app while depressing belonging/voluntary return **auto-reverts** (the §15 rollback gate). The child-safety guardrails of the spec (FR-026) apply.
- **Rationale**: Belonging and voluntary return are the load-bearing outcomes for the afternoon/social surface; tying the evidence posture to them (with auto-revert) keeps the mechanic honest without assuming a learning benefit. The move to a more immersive 3D surface does not change this posture — a prettier world that depressed belonging/voluntary return would still auto-revert.
