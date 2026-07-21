# Phase 0 Research: Arena Progression World

No blocking unknowns remain; the decisions below record the choices the plan rests on. Scope follows PRD §15.3 / §15.3.1; guardrails follow §12, §13, §14.12, §14.13, §15, and the constitution (G1/G6). Both prior open judgments are now **settled**: the rendering engine is **Phaser 4** (spec §13 DP-2) and the canvas-accessibility approach is the **synchronized parallel accessible DOM "Arena Ledger"** (spec §13 DP-1, resolved).

## Decision: Rendering engine is Phaser 4 (Canvas/WebGL, rebuilt renderer), not DOM/CSS

- **Decision**: The Arena is a **real 2D game** on **Phaser 4** (`phaser@^4.2.1`, latest stable 4.x; TS types bundled). Chosen for best performance/visuals: Phaser 4 ships a **rebuilt WebGL renderer** with a redesigned pipeline and **first-class GPU context-loss/restore handling**, directly serving the 60fps + graceful-degradation criterion (SC-010) and the WebGL-context-loss edge case. Pixi.js is acceptable only with a documented reason. The engine choice is settled (spec §13 DP-2) — no Phaser-3 fallback.
- **Phaser-4 API discipline (avoid Phaser-3-only APIs)**: particles use the unified `this.add.particles(x, y, textureKey, emitterConfig)` (not the removed `createEmitter`/`ParticleEmitterManager`); tweens via `this.tweens.add`/`this.tweens.chain`; standard `Scene` lifecycle + `scene` config array; camera `startFollow`/`setLerp`/`setZoom`/`setBounds`; input `setInteractive` + `this.input.on`; `Graphics.generateTexture` (seeded, no `Math.random`) for the procedural fallback; renderer WebGL context-lost/restored events for graceful recovery (spec §2 D1).
- **Rationale**: §15.3 demands "the polish, motion, and progression feel of a real game" — an avatar, a traversable animated world, a follow-camera, particle celebrations, and scenes. Phaser gives all of these as first-class primitives; a DOM/CSS dashboard cannot. Real sprites + tweens + camera + particles are what make it read as a game rather than a progress screen, and Phaser 4's renderer holds the frame budget while degrading gracefully.
- **Alternatives considered**: DOM/CSS/SVG "map" — rejected (reads as a dashboard, no camera/particles/scene graph, poor at 60fps with many animated nodes). Pixi.js — capable but lower-level (no built-in scenes/camera/tween/particle manager), so more app code for the same result; allowed only with a recorded reason. Three.js/WebGL 3D — over-scoped for a 2D overworld. Phaser 3 (`^3.90.0`) — superseded by Phaser 4's rebuilt renderer and context-loss handling, which better satisfy SC-010.

## Decision: Next.js + Phaser integration is client-only (no SSR)

- **Decision**: Phaser references `window`/`document`, so the game mount is loaded via `next/dynamic(() => import("./game/ArenaGame"), { ssr: false })`, the `Phaser.Game` is created in a `useEffect`, and destroyed on unmount (`game.destroy(true)`). `next.config.mjs` sets `transpilePackages: ["@gt100k/arena-world","@gt100k/learning-loop"]`. The build must have zero console/WebGL errors (the review smoke asserts this).
- **Rationale**: A naive Phaser import crashes SSR with `ReferenceError: window is not defined`; `ssr:false` + `useEffect` is the standard, reliable pattern. Clean unmount prevents duplicate canvases / leaked WebGL contexts under React strict-mode remounts.
- **Alternatives considered**: A separate Vite app outside Next — rejected (diverges from the repo's Next-based `apps/*` convention and the root build/lint globs). Rendering Phaser server-side — impossible.

## Decision: Canvas accessibility via a synchronized parallel accessible DOM ("Arena Ledger") — DP-1 RESOLVED

- **Decision (settled)**: A Canvas/WebGL surface is opaque to assistive tech, so the app renders a **synchronized semantic HTML/ARIA parallel structure** built from the **same `ArenaView`** — one shared view-model drives both the Phaser canvas and the Ledger: the quest graph as a keyboard-navigable `role="tree"`, tier/reward/cosmetics/base as labeled text/lists, celebrations via `aria-live="polite"`. The canvas is `aria-hidden="true"`; the Ledger is the AT source of truth. Full keyboard/switch operation, visible focus, color-independent cues, ≥4.5:1 contrast (WCAG 2.2 AA). Reduced motion stays a first-class **equal** mode. This is now a settled decision (spec §13 DP-1) — the loop does not re-open it.
- **Rationale**: §15.3 + constitution VI require WCAG 2.2 AA keyboard/switch/screen-reader operability. A parallel DOM is the robust, framework-agnostic way to make a canvas game accessible, and because both renderers consume the one `ArenaView`, parity is by construction.
- **Alternatives considered (rejected)**: (b) a dedicated `/accessible` full-page route rendering the Ledger — splits the surface and risks drift; (c) Phaser DOM Elements + a canvas a11y plugin — brittler and less standard. The shared `ArenaView` makes the parallel-DOM Ledger both the strongest and the cheapest option.

## Decision: One state → many renderings (buildArenaView)

- **Decision**: The domain composes a single `ArenaView` via `buildArenaView(...)`. The Phaser scene, the reduced-motion/plain rendering, and the accessible Ledger all render from it; reduced-motion/plain differs only in `flags` and does not recompute state. `plainViewEquals` proves the parity.
- **Rationale**: §15.3 requires reduced motion be a *first-class equal mode*, not a degraded fallback, and requires an accessible equivalent. Modeling one state → many renderings guarantees parity by construction and makes FR-015/016/020/029 (SC-004/006/012/014) testable in the pure layer.

## Decision: Deterministic overworld layout in the domain

- **Decision**: `layoutQuestWorld(world)` is a pure function producing exact node positions (spec §8.1) via a region-grid. Layout lives in the domain, not the app, so it is deterministic and unit-testable.
- **Rationale**: A game needs stable spatial structure; putting it in the pure layer makes camera/avatar behavior reproducible and lets the accessible Ledger and the canvas agree on structure. Golden positions remove "where does this node go?" ambiguity.

## Decision: Seed assets committed in-repo (SVG) + procedural fallback

- **Decision**: Placeholder art is committed as small hand-authored SVGs under `apps/arena/public/seed/`, with a deterministic procedural texture generator (`Graphics.generateTexture`, seeded, no `Math.random`) as fallback. No external fetch/CDN.
- **Rationale**: The loop must build with no network and the public repo must stay free of binary bloat; SVGs are tiny and text-diffable, and the procedural fallback keeps the game rendering even with a missing asset. Satisfies FR-030 and keeps the seeded smoke green.
- **Alternatives considered**: Binary sprite-sheet PNGs — rejected (bloat + not diffable in a public governed repo). Runtime download of art — rejected (external fetch, offline-fragile).

## Decision: Split into a pure domain package + a new Next.js app

- **Decision**: `packages/arena-world` (pure, deterministic rules) + `apps/arena` (animated experience). Do **not** modify `packages/learning-loop` or `apps/student-compass`.
- **Rationale**: Mirrors feature 001's proven, testable split. Every hard guardrail can be encoded as a pure function and unit-tested (mastery-only unlock, deterministic cosmetics, zero-power, staging, no-caste standings, errors-never-loss). Keeps the build parallel-safe: only new directories change.
- **Alternatives considered**: Building game logic straight into a Next.js app — rejected (entangles rules with rendering, defeats determinism/testability, and would require touching or racing shared UI). A Go/Rust real-time service (PRD §26.2/§26.3) — deferred; unnecessary for a synthetic single-cohort slice.

## Decision: Node unlock is a deterministic function of the §12 mastery gate + prerequisites

- **Decision**: `deriveNodeStates(world, signals)` returns `locked | available | unlocked` per node. `unlocked` iff all prerequisites mastered **and** the node's own `masteryCleared` is true; `available` iff prerequisites mastered but own gate not yet cleared; else `locked`. No time/visit input exists.
- **Rationale**: Encodes FR-002/FR-003 ("bought with mastery, never grinding") structurally — there is no code path by which time-in-app can flip a node. Pure predicate over state → trivially testable across all edge cases (gate-before-prereq, etc.).
- **Alternatives considered**: XP/time-threshold unlock — rejected (violates §15.3 and FR-002). Reusing learning-loop's *daily project-unlock* gate for node unlock — rejected: that gate unlocks *project time for a day*; node unlock needs the *per-node 90% independent-mastery* signal (§12), which we inject as `NodeMasterySignal`.

## Decision: Inject the §12/§13 signals as synthetic `NodeMasterySignal` records

- **Decision**: The 90%-independent-mastery gate result and the §13 independence reward are **inputs** (`NodeMasterySignal { nodeId, masteryCleared, independenceReward }`) supplied by a stub/simulator, not computed here.
- **Rationale**: This feature owns the *game representation of* mastery/reward, not the mastery engine or the answer-blind tutor (§13). Keeps the domain deterministic and synthetic-only, and lets a real mastery/reward source replace the stub later with zero domain change. Builds on `@gt100k/learning-loop` for `Section`/`SECTIONS`/XP/beyond-floor.
- **Alternatives considered**: Recomputing mastery here — rejected (out of scope; would duplicate §12). 

## Decision: Cosmetic eligibility is deterministic competence-gating; no randomness, no money

- **Decision**: `deriveCosmeticEligibility(catalog, progression, nodeStates)` is a pure function of competence thresholds (tier reached, N independent unlocks, region completed). The `Cosmetic` type has **no price field** and **no random/drop mechanic**; `Math.random` is banned in the package. `equipCosmetic` rejects un-earned cosmetics and only ever mutates `AvatarState` cosmetic fields.
- **Rationale**: Encodes G1 (no financial mechanisms for minors), §15.3 (no gacha/loot, never purchasable), and FR-007/8/9 structurally. Determinism is directly assertable (same input → same eligible set across runs).
- **Alternatives considered**: Variable-ratio/loot-box unlocks (industry-standard "engagement") — **explicitly prohibited** by §14.12/§15.3. A currency purchasable with money — prohibited by G1.

## Decision: Zero-power cosmetics/tiers proven by outcome-invariance tests

- **Decision**: Mastery, node-unlock, matchmaking, and standing functions take **no** cosmetic/tier input. Contract tests assert those outcomes are identical across all cosmetic/tier states (SC-003).
- **Rationale**: "Zero power" (FR-009, §15.3) is strongest when enforced by the type signatures (the functions cannot see cosmetics) and verified by invariance tests, not by convention.

## Decision: Age-band representation resolves from the learner's band; economy unchanged

- **Decision**: `resolveRewardRepresentation(ageBand, progression)` returns a band view model (currency label, `showRawNumber`, comparison mode, failure-copy style) per the §14.13 table. The underlying `ProgressionState` is identical across bands; only representation varies. 6-8: `showRawNumber=false`, comparison off, story-framed.
- **Rationale**: Encodes §14.13 / FR-017/FR-018. The "same event, different vocabulary per band" is a direct configuration test (SC-005).
- **Alternatives considered**: Separate per-band economies — rejected (§14.13: "computed identically at every age").

## Decision: Standings are near-peer, anonymized, opt-in, gain-based, no bottom-rank; no caste representable

- **Decision**: `deriveStanding(self, nearPeers, options)` returns `null` unless opted in (default off), and otherwise a gain-based, anonymized, near-peer standing that surfaces the learner's own gain against the band top — **never** a "last of N" position. No type in the package can express a fixed-ability caste rank, public tier name, or full-field ranking.
- **Rationale**: Encodes §15 / G6 / FR-019. Making the prohibited forms *unrepresentable* is stronger than validating against them.

## Decision: Celebration is classified in the domain; motion lives only in the UI

- **Decision**: `classifyCelebration(signal)` returns an `independent-unlock` or `productive-struggle` `CelebrationEvent`, or `null` — and **never** a loss event. Incorrect attempts/help requests remove nothing. The domain event carries semantic intensity + copy-style hints; the UI maps them to motion/particles and their reduced-motion equivalents.
- **Rationale**: Keeps §14.12 failure-framing rules (errors-never-loss, process-praise) testable in the pure layer, independent of rendering. Reduced-motion parity (FR-015) then becomes a UI rendering obligation over the same event stream.

## Decision: Reduced motion / plain mode as an equal rendering path over identical state

- **Decision**: The UI computes one view model from the domain and renders it either full-spectacle or reduced-motion/plain, with **identical** conveyed state/progression/celebration. Opt-out changes nothing in learning/access/standing (FR-020, SC-006).
- **Rationale**: §15.3 requires reduced motion be a *first-class equal mode*, not a degraded fallback. Modeling one state → two renderings guarantees parity by construction.

## Decision: Tests first-class for the domain; UI verified by build + acceptance walkthrough

- **Decision**: Vitest contract/unit tests are written first (must fail) for every domain function and every guardrail. The `apps/arena` UI is validated by `next build` and the quickstart acceptance walkthrough (frame budget is an acceptance target, not a unit test).
- **Rationale**: The constitution makes tests part of "done"; the domain carries the enforceable guarantees, and the UI's value (motion, feel, 60 fps) is verified experientially per §15.3.1.

## Decision: Art direction — "Independence Isles", golden-hour cartography (not the SaaS-cream default)

- **Decision**: A warm, hand-drawn storybook-atlas archipelago on a **deep teal-navy sea** so warm islands glow; a tactile, claymorphic-adjacent illustration register (soft 3-D, 3px ink outlines, rounded UI). Warmth is carried by **light + accent + typography**, not a cream body bg. Exact palette, per-biome hues, and typography tokens are golden constants (spec §8.11/§8.12); the visual identity is spec §5.1–§5.2.
- **Rationale**: §15.3 demands "the polish, motion, and progression feel of a real game," and the surface is the *afternoon/social* time — perpetual golden hour. Applying the impeccable register discipline avoids the 2026 AI-cream monoculture; a deep-sea canvas makes mastery-as-light legible (locked = cool/dim, unlocked = warm/lit), tying art directly to the §12 mechanic. State is always paired with icon/shape so color is never the sole cue (WCAG 2.2 AA).
- **Alternatives considered**: A cream/sand editorial palette — rejected (AI default; and it can't carry the mastery-as-light metaphor). A neon/dark-game look — rejected (too cold for a warmth/belonging surface and harder for the 6-8 band). Fonts via Google Fonts CDN — **rejected** (violates no-external-fetch); default is a system-rounded fallback stack, with optional committed subset `woff2` as a non-breaking upgrade (spec §13 DP-6).

## Decision: One deterministic motion-token registry drives all motion (and all reduced-motion equivalents)

- **Decision**: `MOTION` (durations) + `EASINGS` (named curves) are exact exported constants; `resolveMotion(kind, { reducedMotion })` returns a `MotionToken` per the golden §8.10 table, with a first-class reduced column for every kind. The master motion table (spec §5.6) names each effect (from the animation-vocabulary glossary), its easing, duration token, particles, camera/screen feedback, sound cue, and reduced-motion equivalent.
- **Rationale**: Emil/Apple: motion is designed, frequency-appropriate, interruptible, and reduced-motion is *gentler not gone*. Putting durations/easings in the pure layer makes them testable constants (SC-015) and makes reduced-motion parity provable rather than asserted. It also enforces the exclusions (no shake/wiggle-on-error, no `scale(0)`, no `ease-in` entrances, no gacha reveal, no decay meter, no engagement-timed pop-in, no looping audio) by giving the app a single sanctioned source of motion.
- **Alternatives considered**: Ad-hoc per-scene tween literals — rejected (drifts, untestable, easy to violate reduced-motion parity). A CSS-only motion system — rejected (the canvas is Phaser; CSS covers only the HUD/Ledger, which reuse the same tokens).

## Decision: Deterministic avatar animation states + camera/parallax config in the pure layer

- **Decision**: `resolveAvatarAnimation(intent, options)` returns exact `{state,loop,durationMs,easing,amplitudePx}` (spec §8.13) for `idle/walk/run/think/celebrate-*`, never `scale(0)`, with reduced-motion equivalents; camera (`CAMERA`) + `resolveParallaxLayers()` are exact config (spec §8.14). The pseudonymous lantern-avatar is expressive-only (no ability signal, §29).
- **Rationale**: A game reads as a game because of a living avatar, a follow-camera with deadzone/look-ahead/establishing shot, and layered parallax. Keeping the *specs* pure makes them deterministic/testable (SC-016/018) while the app applies them via Phaser-4 tweens/camera APIs (spec §2 D1). Interruptibility is guaranteed by construction (the spec carries no absolute start; the app tweens from the live position — Apple's "animate from the presentation value").
- **Alternatives considered**: Hard-coded avatar tweens in `WorldScene` — rejected (untestable, drifts from reduced-motion parity). A physics/spring avatar — over-scoped for a tile-to-tile traversal; Phaser tweens with the named easings suffice.

## Decision: Cohort-base layout, cosmetic looks, sound cues, visual bands, and asset keys are all deterministic domain data

- **Decision**: `resolveBaseLayout` (zones/slots §8.16), cosmetic `look`/`equipEffect` (§8.15), `resolveSoundCue`/`SOUND_CUES` (muted-by-default, neutral error, §8.18), `resolveVisualBand` (age-band canvas presentation §8.19), and the `ASSET_KEYS` registry (§8.17, atlas→SVG→procedural) all live in the pure package as golden constants/functions; the app renders them.
- **Rationale**: Every visual/audio/asset decision the guardrails care about (attributable + zero-power base; no price/rarity on cosmetics; neutral non-looping muted audio; 6-8 no-canvas-number; missing-asset still renders) becomes a testable structural guarantee (SC-019/020/021/022/023) rather than a rendering convention. Sound has **no asset pipeline** this slice (spec §13 DP-7) — cue ids + captions only.
- **Alternatives considered**: Placing these in the app — rejected (loses determinism/testability and risks guardrail drift). A real audio sample set now — deferred (out of scope; committed non-fetched samples are a later non-breaking add).

## Decision: First-run onboarding as a skippable, non-blocking, Ledger-mirrored overlay

- **Decision**: A 3-beat coach-mark sequence (this-is-you → light-a-path → your-way: plain-mode/Ledger/standings-off) shown once, dismissible on any input, never gating a mastery action, fully mirrored in the Ledger, honoring reduced motion (spec §5.5 / FR-038).
- **Rationale**: Wayfinding (Apple) + activation (impeccable onboard) without dark patterns: onboarding must never block the mastery action (FR-022) and must be reachable by keyboard/screen-reader. Keeping it a thin overlay over `WorldScene` avoids a separate scene's state duplication.
- **Alternatives considered**: A mandatory tutorial gate — rejected (blocks the mastery action; a dark-pattern-adjacent friction). No onboarding — rejected (the 6-8 band needs the concrete "light a path" framing).

## Decision: Evidence posture for the child-facing surface — [E3]/[R], belonging-gated

- **Decision**: This is a child-facing surface. Evidence posture **[E3]/[R]**: the engagement/belonging lift is measured against belonging and voluntary return (§2.6), never assumed to improve learning; a mechanic that raises time-in-app while depressing belonging/voluntary return **auto-reverts** (the §15 rollback gate). The child-safety guardrails of the spec (FR-026) apply.
- **Rationale**: Belonging and voluntary return are the load-bearing outcomes for the afternoon/social surface; tying the evidence posture to them (with auto-revert) keeps the mechanic honest without assuming a learning benefit.
