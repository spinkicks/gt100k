# Feature Specification: Arena Progression World (RPG Game-Experience Layer)

**Feature Branch**: `004-arena-game-world`

**Created**: 2026-07-20

**Status**: Loop-ready (expanded)

**Input**: User description: "The Arena progression world (PRD §15.3 / §15.3.1): the social and competitive/afternoon surface delivered as a production-quality, RPG-style game world rather than a dashboard. A pseudonymous avatar traverses the competency graph rendered as an animated quest-world map; nodes unlock ONLY through the 90% independent-mastery gate (§12); gain-based tiers advance on the independence reward (§13); competence-earned, deterministic cosmetics (no loot, no purchase, zero power); a persistent co-built cohort base; and celebratory 'juice' on independent unlocks and productive struggle, with errors never rendered as loss (§14.12). Reduced-motion is a first-class equal mode, representation is staged by age band (§14.13), and standings stay near-peer/anonymized/opt-in with no caste ranks (§15). Builds on the daily-learning-loop (feature 001); synthetic learners only; no consent/legal machinery."

---

## §0 · How to read this spec (for the build loop)

This is the **single loop source-of-truth** for the feature. It is large on purpose; read **only the section for the current phase** each turn (JIT), then the referenced golden values.

- Build path is **§9 Phasing (P0…P6)** — always work the lowest unfinished phase.
- Every phase gate is **`pnpm typecheck` (`tsc -b`) + `pnpm test` (Vitest, domain) green**; the app phases add **`pnpm --filter @gt100k/arena-world-app build`** + the **§11 seeded smoke** and the **quickstart acceptance walkthrough**.
- Machine-checkable acceptance lives in **§10 Success Criteria** (each mapped to a named test) and **§8 Golden values**.
- Choices already settled are in **§2 Decisions already made** — do not re-open them.
- Anything not specified: follow **§3 Defaults for the unspecified** (log it, continue).
- The companion docs — [plan.md](./plan.md), [tasks.md](./tasks.md), [data-model.md](./data-model.md), [contracts/arena-world.md](./contracts/arena-world.md), [research.md](./research.md), [quickstart.md](./quickstart.md) — are kept consistent with this file; **where they disagree, this file wins.**

---

## §1 · Scope fence (in / out / non-goals)

### In scope

1. A **pure, deterministic domain package `@gt100k/arena-world`** (`packages/arena-world`) holding every rule: quest-world build + deterministic layout; node lock/unlock from the §12 gate + prerequisites; gain-based tier/progression from the §13 independence reward; deterministic zero-power cosmetic eligibility + equip; persistent co-built cohort-base accretion; celebration classification + motion-spec derivation; age-band representation; near-peer/anonymized/opt-in/no-bottom-rank standings; and a single composed **ArenaView** view model that drives every renderer.
2. A **new Next.js App-Router app `@gt100k/arena-world-app`** (`apps/arena`) rendering a **real 2D game** on **Phaser 4** (Canvas/WebGL, rebuilt WebGL renderer): an animated overworld quest-map, a tweened avatar traversing paths, a follow-camera, a co-built cohort **base scene**, particle/celebration **juice**, an equippable cosmetic drawer, and an age-band/plain-mode/standings HUD.
3. A **first-class, equal reduced-motion / plain rendering** of the identical ArenaView, and an **accessible DOM/ARIA parallel structure** (the "Arena Ledger") that conveys the same state and progression to keyboard / switch / screen-reader users (WCAG 2.2 AA).
4. A **seed asset kit in-repo** (small hand-authored SVGs + a deterministic procedural texture fallback) so the game builds and runs with **no external fetch**.
5. A **synthetic mastery-signal feed** (stub/simulator) that supplies the §12/§13 signals as `NodeMasterySignal` records.

### Out of scope (explicit)

- The **mastery engine**, the §12 90%-independent-mastery computation, the §13 reward computation, and the answer-blind tutor (§13) — these are **injected as inputs**, not computed here.
- **Live multiplayer / WebRTC / real-time RivalryMix netcode** (§26.2/§26.3), presence servers, matchmaking service. The cohort base and standings are computed from **synthetic** injected state; no network transport.
- Real competency-graph authoring, real content, real project ladders (§16). A small hand-authored **fixture graph** stands in.
- Any **consent / admissions / legal / governance** workflow, real learner data, or persistence to a database. In-memory only.
- Sound design beyond a **muted-by-default, captioned** optional cue; no audio asset pipeline.

### Non-goals (will not build, by principle)

- **No** purchase / currency / financial path of any kind (G1).
- **No** gacha / loot-box / variable-ratio / timed-drop / "reroll" mechanic (§14.12/§15.3).
- **No** fixed-ability caste ranks, public tier ladders, full-field rankings, or a "last of N" bottom-rank surface (§15, G6).
- **No** loss-framed streaks, decaying/absence meters, manufactured scarcity, FOMO, or engagement-timed notifications (§14.12).
- **No** cosmetic or tier that touches mastery, node-unlock, matchmaking, standing, or access (zero power).
- **No** motion-only affordance and **no** degraded accessibility fallback — reduced-motion and the accessible view are **equal** modes.
- **No** modification of `packages/learning-loop`, `apps/student-compass`, or shared root config, except the single final human-reconciled root-`tsconfig` reference (T-ROOT).

---

## §2 · Decisions already made (do not re-open)

### D1 — Rendering engine: **Phaser 4 (default `phaser@^4.2.1`)** on Canvas/WebGL

The Arena is a **real 2D game engine on a Canvas/WebGL surface**, not a DOM/CSS dashboard. Default engine is **Phaser 4**, pinned `^4.2.1` (latest stable 4.x; TS types bundled). Phaser 4 ships a **rebuilt WebGL renderer** with a redesigned pipeline and **first-class GPU context-loss/restore handling** — directly load-bearing for the 60fps + graceful-degradation criterion (SC-010) and the WebGL-context-loss edge case (§4): the renderer can lose and restore the GPU context without tearing down the game, and the reduced-motion path + accessible Ledger never depend on WebGL at all. **Pixi.js is acceptable only with a documented reason** recorded in `.loop/decisions.md`; do not switch on a whim. Phaser gives real sprites, tweened movement, a follow-camera, scenes, and a modern particle system — the primitives that make this read like a game.

**Phaser-4 API notes the loop MUST honor (avoid Phaser-3-only APIs):**
- **Particles**: use the unified emitter API `this.add.particles(x, y, textureKey, emitterConfig)` (returns a `ParticleEmitter`). Do **not** use the removed Phaser-3.55 `this.add.particles(key).createEmitter(config)` / `ParticleEmitterManager` pattern.
- **Tweens**: `this.tweens.add({...})` and `this.tweens.chain({...})`; ease strings (`"Cubic.Out"`, `"Back.Out"`) are unchanged. Prefer the tween-manager API over per-object legacy helpers.
- **Scenes**: standard `Scene` lifecycle (`init`/`preload`/`create`/`update`), `this.scene.add/start/launch/stop`, and the `ScenePlugin` are 4.x-stable; register scenes via the `scene` array in the game config.
- **Camera**: `this.cameras.main.startFollow(target, roundPixels, lerpX, lerpY)`, `setLerp`, `setZoom`, `setBounds` are unchanged; the follow-camera lerp `0.08` and region zoom `1.0→1.25` (§8.9) map directly.
- **Input**: `gameObject.setInteractive()` + `this.input.on("pointerdown", …)` is unchanged; keep keyboard/switch operation in the DOM Ledger, not on the canvas.
- **Textures**: `Phaser.GameObjects.Graphics.generateTexture(key, w, h)` (seeded, no `Math.random`) for the procedural fallback is 4.x-stable.
- **Renderer/context loss**: listen for the renderer's WebGL context-lost/restored events to re-upload textures and resume; on unrecoverable loss, fall back to the reduced-motion/Ledger path (never block a mastery action).

### D2 — Architecture: pure domain package + separate Next.js app (mirror feature 001)

`packages/arena-world` is **pure** (no I/O, no wall-clock, **no `Math.random`**), framework-agnostic, and holds every rule as a unit-testable function. `apps/arena` is the only place Phaser/React/DOM live. This makes every guardrail deterministically testable and keeps the build parallel-safe (new dirs only). Builds on `@gt100k/learning-loop` (`Section`/`SECTIONS`, the mastery-gate concept, XP, beyond-floor signal).

### D3 — Next.js + Phaser integration is **client-only**

Phaser references `window`/`document`; it MUST NOT run in SSR. The Phaser mount is loaded via `next/dynamic(() => import("./game/ArenaGame"), { ssr: false })` and the `Phaser.Game` instance is created inside a `useEffect` and **destroyed on unmount** (`game.destroy(true)`). `next.config.mjs` sets `transpilePackages: ["@gt100k/arena-world", "@gt100k/learning-loop"]`. The app must produce **zero console/WebGL errors** (the review smoke asserts this).

### D4 — One state → many renderings (parity by construction)

The domain composes a single **`ArenaView`** (`buildArenaView(...)`). The Phaser scene, the reduced-motion/plain rendering, and the accessible DOM Ledger **all render from that same `ArenaView`**. Reduced-motion/plain does not recompute state — it renders the identical view with motion stripped. This makes reduced-motion an *equal* mode and makes `plainViewEquals` a pure, testable guarantee.

### D5 — Accessibility approach for a canvas game: **synchronized parallel accessible DOM ("Arena Ledger") — SETTLED**

Because a Canvas/WebGL surface is opaque to assistive tech, the app renders a **synchronized, semantic HTML/ARIA parallel structure** adjacent to the canvas, built from the same `ArenaView`: the quest graph as a keyboard-navigable list/tree (`role="tree"`, nodes as `treeitem` with `aria-expanded`/state in text), tier/reward as text, cosmetics as a labeled listbox, the base as a list, and celebrations announced via an `aria-live="polite"` region. **One shared view-model drives both the Phaser canvas and the Ledger** (D4), so the two stay in lock-step by construction. Full keyboard/switch operation (Tab/Arrow/Enter/Escape), visible focus rings, color-independent state cues, and 4.5:1 contrast. The canvas is `aria-hidden="true"`; the Ledger is the source of truth for AT. **This decision is settled (see §13 DP-1, resolved) — the loop does not re-open it.** Reduced motion remains a first-class **equal** mode (not a degraded fallback) and WCAG 2.2 AA is a hard requirement (FR-015/FR-016, SC-004/SC-012).

### D6 — Seed assets: **committed tiny SVGs + deterministic procedural fallback**

Placeholder art is checked into `apps/arena/public/seed/` as **small, text-diffable SVGs** (avatar parts, node markers, region tiles, base props) — git-friendly and public-repo-safe (no binary bloat). A **deterministic procedural texture generator** (`Phaser.GameObjects.Graphics.generateTexture`, seeded, no `Math.random`) provides a fallback so the game renders even if an asset is missing. No external CDN/fetch, ever.

### D7 — Data model, UX patterns, motion vocabulary

- **Data model** is fixed in [data-model.md](./data-model.md). Guardrails are **structural**: `Cosmetic` has no `price`/`currency`/`dropRate`/`rarity` field; standings types have no `rank`/`position`/`percentile`/`outOf` field. Node-state/tier/cosmetic-eligibility are pure functions with no time/visit input.
- **UX / motion vocabulary** (applied from the fluid-motion + design-engineering guidance) is fixed in **§5** and **§8**: eased tweens (`Cubic.Out` enter, subtle `Back.Out` for reveals), never `scale(0)`, press feedback `scale 0.97`, camera lerp `0.08`, celebration reserved for the rare independent-unlock moment, and a full reduced-motion equivalent for every one.

### D8 — Stack pinned; tests define done

pnpm workspace (`pnpm@9.15.9`). Domain gate = `tsc -b` + Vitest, **test-first**. App verified by `next build` + smoke + acceptance walkthrough. Full stack/commands in **§11**.

---

## §3 · Defaults for the unspecified

> **For anything this PRD doesn't specify, choose the simplest correct option, record it in `.loop/decisions.md`, and continue.**

Escalate (append one line to `.loop/requests.jsonl`, then proceed on your recommendation) **only** for a genuine product/design choice with hard-to-reverse consequences you cannot defensibly default — e.g. a golden value you believe is wrong. Never escalate naming, formatting, or anything this doc/PRD answers; the canvas-accessibility approach and the engine choice are **settled** (§13 DP-1/DP-2 resolved) and MUST NOT be re-opened. Overnight, only `severity: critical` reaches the operator; the rest are recorded to `.loop/deferred-decisions.jsonl`.

---

## §4 · User Scenarios & Testing *(mandatory)*

Stories are prioritized, independently testable slices. **US1 alone is a viable MVP**: a mastery-gated, traversable, animated quest world for a synthetic learner, with a reduced-motion + accessible equivalent.

### User Story 1 — Traverse an animated quest-world map whose nodes unlock only through mastery (P1) 🎯 MVP

A synthetic learner opens the Arena and sees the competency graph (§12) rendered as a **traversable, animated overworld** ("Independence Isles"): regions are islands, nodes are quest locations, edges are paths. A **pseudonymous avatar** walks the paths (tweened movement, follow-camera). A node is **locked** until every prerequisite node is mastered **and** its own 90% independent-mastery gate is cleared; only then does it become **unlocked** with an animated reveal. Progression is bought with real mastery — never time-in-app or grinding. `prefers-reduced-motion` and the accessible Ledger convey the identical states.

**Why this priority**: The mastery-gated quest world is the core of §15.3 and the one thing that makes this an RPG game-experience layer, not a dashboard. Every other component hangs off "nodes unlock via the mastery gate" (FR-002).

**Independent Test**: Feed synthetic per-node `NodeMasterySignal`s; derive node states; confirm no node is `unlocked` unless its gate is cleared **and** all prerequisites are mastered; confirm deterministic layout; render the map (Phaser) in locked/available/unlocked states, with a reduced-motion equal rendering and the accessible Ledger, and confirm each state is conveyed.

**Acceptance Scenarios**:

1. **Given** a node whose prerequisites are all mastered but whose own gate is **not** cleared, **When** states derive, **Then** it is `available` (reachable/highlighted) but **not** `unlocked`, and no time-in-app changes that.
2. **Given** a node whose own gate is cleared but a prerequisite is **not** mastered, **When** states derive, **Then** it is `locked`.
3. **Given** a node whose prerequisites are all mastered **and** whose gate is cleared, **When** states derive, **Then** it becomes `unlocked` and an `independent-unlock` celebration event is emitted.
4. **Given** the same signals processed twice, **When** states + layout derive, **Then** the result is byte-identical (deterministic; no randomness).
5. **Given** `prefers-reduced-motion` (or plain mode), **When** the map renders, **Then** every state, path, and unlock is fully conveyed without motion and no traversal is lost; the accessible Ledger exposes the same states to keyboard/screen-reader.

### User Story 2 — Gain-based tiers + deterministic cosmetics on a pseudonymous avatar (P2)

The learner accrues the **independence reward** (§13). Tiers advance on that gain, framed first as **growth vs. the learner's own past** (§14.13). Reaching competence thresholds makes **cosmetic** unlocks *eligible* — avatar items, world/base themes, celebration effects — **deterministic** (no gacha), **never purchasable**, **zero power**. The learner equips eligible cosmetics on a **pseudonymous, expressive-only** avatar; equipping changes only the avatar's look on the canvas.

**Independent Test**: Feed a synthetic reward history; compute progression/tier + cosmetic eligibility; confirm eligibility is a pure deterministic function of competence (identical across runs), no purchase path can grant a cosmetic, and no cosmetic/tier changes any mastery/matchmaking/standing/access outcome.

**Acceptance Scenarios**:

1. **Given** two identical reward histories, **When** eligibility derives, **Then** the eligible set is identical every time (no randomness / variable-ratio).
2. **Given** any tier or equipped set, **When** mastery, node-unlock, matchmaking, standing compute, **Then** outcomes are unchanged vs. the same learner with no cosmetics (zero power).
3. **Given** an unearned cosmetic, **When** equip is attempted, **Then** it is rejected; there is no money/purchase code path.
4. **Given** a 6-to-8 learner, **When** tier/reward renders, **Then** it is growth-against-own-past with no raw mastery-delta headline (see US5).
5. **Given** the avatar, **When** inspected, **Then** it is pseudonymous and encodes no ability signal / advantage.

### User Story 3 — Juice on the learning moment; errors never a loss (P3)

The loudest celebrations (motion, particles) fire on **independent unlocks** and **productive-struggle** events (extra unassisted attempts, self-correction, return after a failed attempt) — §14.12. An **error is never a loss**: nothing earned is removed; no loss-framed streak/decaying meter/forfeiture; feedback praises the **process**, never a fixed trait/ability/speed. Every celebration has a reduced-motion equivalent driven by a deterministic **motion spec**.

**Independent Test**: Feed learning-moment signals; confirm celebration events fire only on unlock/struggle; incorrect attempts/help requests emit **no** event and remove nothing; copy carries no trait/speed language; `celebrationMotionSpec` yields a static, particle-free spec under reduced motion.

**Acceptance Scenarios**:

1. **Given** an independent unlock or productive-struggle signal, **When** classified, **Then** a celebration event is emitted with a reduced-motion equivalent motion spec.
2. **Given** an incorrect attempt or help request, **When** processed, **Then** **no** loss event is emitted and every earned reward/standing/mastery is unchanged.
3. **Given** any celebration/failure copy, **When** reviewed, **Then** it references process/strategy/recovery, never ability/speed/fixed identity.

### User Story 4 — Co-build a persistent cohort base (P4)

The stable cohort of six shares a **persistent space they co-build** through cooperative missions (§15), rendered as a **base scene** (the "Base Camp" island the learner returns home to). Completing a cooperative mission deterministically accretes a contribution (rooms/props/themes); contributions are attributable; the base confers no gameplay power.

**Independent Test**: Feed a synthetic sequence of cooperative-mission results; confirm the base accretes deterministically (same inputs → same base), contributions are attributable, and base state confers no power.

**Acceptance Scenarios**:

1. **Given** a base + a completed mission, **When** the contribution applies, **Then** the base gains the mission's deterministic contribution and prior contributions are preserved.
2. **Given** the same sequence twice, **When** rebuilt, **Then** the base state is identical (replayable).
3. **Given** any base state, **When** mastery/access/standing compute, **Then** they are unchanged (zero power).

### User Story 5 — Age-band representation, plain mode, near-peer standings (P5)

The same computed economy (§13) is **represented** differently by age band (§14.13): 6-8 concrete/story-framed/no-raw-number/comparison-off; 9-11 transitional (growth-vs-past primary); 12-14 full map/tiers/standings. A learner can use a low-spectacle **plain mode** or turn standings off with **no loss**. Any cross-child standing is **opt-in (default off), near-peer-band, anonymized, gain-based, no bottom-rank**; no fixed-ability caste ranks exist.

**Independent Test**: Resolve representation per band (6-8 hides the raw number, comparison off); confirm plain/reduced-motion yields the same underlying state; confirm a derived standing is near-peer/anonymized/opt-in and never surfaces a bottom rank.

**Acceptance Scenarios**:

1. **Given** the same reward event, **When** represented for 6-8 / 9-11 / 12-14, **Then** each renders in the correct band vocabulary and 6-8 never exposes the raw mastery-delta headline.
2. **Given** cross-child standings, **When** derived for any band, **Then** they default off, are opt-in, near-peer/anonymized/gain-based, and never surface a bottom-rank position; no caste rank is representable.
3. **Given** plain mode on / standings off, **When** learning/access/standing compute, **Then** they are identical to the full-spectacle configuration.

### Edge Cases

- **Gate-before-prereq**: gate cleared but a prerequisite unmastered stays **locked** (US1 sc. 2).
- **No-grind invariant**: any volume of time/visits with the gate uncleared never unlocks a node (FR-002).
- **Cosmetic determinism**: no path (reroll/open/purchase/timed drop) introduces randomness or money (FR-007/8).
- **Reduced-motion parity**: with `prefers-reduced-motion`, no state/progression/celebration is unreachable (FR-015).
- **Accessible parity**: keyboard-only + screen-reader users reach every state via the Ledger (FR-016).
- **Band boundary**: representation resolves strictly by band; 6-8 never falls through to a numeric/comparison rendering (FR-018).
- **Standings floor**: never "last of N" — a would-be bottom learner sees own gain vs. band, not a rank (FR-019).
- **Bullying/exclusion**: a report routes to safeguarding and bypasses optimization; the game never suppresses/gamifies it (FR-025, fail-closed hook this slice).
- **Mastery action never blocked**: the game surface never blocks/delays/gates a mastery action, even under load / low-end hardware (FR-022/23).
- **WebGL context loss**: Phaser 4's rebuilt WebGL renderer loses/restores the GPU context and re-uploads textures without tearing down the game; on unrecoverable loss the canvas degrades gracefully and the accessible Ledger + reduced-motion path (which never depend on WebGL) still convey every state.

---

## §5 · The game design — "Independence Isles" (the full design doc)

This section is the **game-design bible**. It defines the experience the app must deliver — art direction, world, camera, avatar, motion, cosmetics, base, sound, onboarding, and age-band variants. Everything here that a machine can check is pinned as an exact, **testable golden constant** in **§8** (motion tokens, palette, biome identity, avatar animation, camera/parallax, base layout, visual band, sound cues, asset keys). Where §5 describes and §8 pins, **§8 wins for values**. Everything stays **buildable in Phaser 4** and inside every guardrail (§1 non-goals, §6, §12).

**Design pillars (the five sentences everything answers to):**

1. **Golden-hour cartography.** The Arena is a warm, hand-drawn *storybook atlas* you traverse — an illustrated archipelago bathed in perpetual late-afternoon light (this is the *afternoon* social surface). Cozy exploration, not a dashboard.
2. **Mastery is the only currency of light.** The world is literally lit by independent mastery: locked places are dim and cool; clearing a node's 90% gate *lights a beacon* and warms the path onward. Progress you can *see* is progress you *earned* (§12) — never time-in-app.
3. **Calm by default, loud only at the learning moment.** Ambient motion is gentle and sparse; the loudest juice is reserved for the rare independent unlock and productive struggle (§14.12). Frequency-appropriate motion (Emil): rare → delightful, occasional → standard, frequent → instant.
4. **Reduced motion and the Ledger are equal citizens.** Every visual has a calm, non-vestibular equivalent and a semantic DOM twin (§5.12, §12). Nothing beautiful is motion-only; nothing stateful is canvas-only.
5. **Warmth is earned, never sold, never ranked.** Cosmetics are competence-earned, deterministic, zero-power, un-buyable (§7.3, §8.15). No caste, no loot, no bottom-rank (§1, §6).

### 5.1 · Art direction & visual identity

**Style register.** A tactile, chunky, *claymorphic-adjacent* illustration style — soft 3-D forms, thick 3px hand-inked outlines, rounded 16–24px corners on UI, double soft shadows — reading as friendly-but-not-babyish across ages 6–14. The register is *editorial-warm exploration game*, deliberately **not** the SaaS-cream default (see §13 DP-6): warmth is carried by **light, accent, and typography**, and the sea/canvas is a **deep teal-navy** so the warm islands glow against it.

**Master palette (exact hex — golden in §8.11).** OKLCH-reasoned, contrast-verified.

| Role | Token | Hex | Use |
|---|---|---|---|
| Sea (canvas bg) | `--sea-deep` | `#0E2A3B` | the ocean between islands; app/canvas backdrop |
| Sea mid | `--sea-mid` | `#14384C` | water plane, panel base |
| Sky dawn | `--sky-dawn` | `#F4C77B` | warm horizon band / sun glow |
| Ink | `--ink` | `#14202B` | text on light props |
| Ink-hi (HUD) | `--ink-hi` | `#F5F9FC` | HUD/Ledger text on sea (≈13:1 on `--sea-deep`, AAA) |
| Sun (primary warm) | `--sun` | `#F6A23A` | primary accent; the "independence" warmth; `available` glow |
| Sun-hi | `--sun-hi` | `#FFC66B` | highlights, hover |
| Gold (reward/tier) | `--gold` | `#F2C14E` | tiers, `unlocked` beacons, reward counter |
| Ember (high celebrate) | `--ember` | `#E8623B` | loudest-moment particles/bloom (rare) |
| Locked | `--locked` | `#5A6B78` | muted slate — dim nodes/paths (paired with padlock glyph) |
| Not-yet (error) | `--notyet` | `#7FB6D6` | **calm cool blue** wisp — deliberately NOT red (error ≠ loss) |
| Focus ring | `--focus` | `#FFD166` | 3px ring, 2px offset — high-contrast on light *and* dark |

**Biome signature hues** (one per island; full identity §8.12): Numbers Coast `#2EC4B6` (turquoise tide-pools), Tinker Bluffs `#C77D3A` (copper/brass), Story Vale `#3E9B5F` (mossy book-forest), Wordwind Reach `#5AA9E6` (windswept sky). Each hue tints only its island's terrain/props/ambient — never a state cue.

**Typography (tokens §8.11).** Display/headings **Fredoka** (rounded, friendly), body/Ledger **Nunito** — a contrast-axis pairing (geometric-rounded display + humanist body), not two look-alikes. **No external fetch** (§1): the default is a **system-rounded fallback stack** (`--font-display: "Fredoka","Baloo 2",ui-rounded,"Segoe UI Rounded",system-ui,sans-serif`; `--font-body: "Nunito",ui-rounded,system-ui,sans-serif`); self-hosted subset `woff2` under `public/fonts/` is an **optional, non-breaking** enhancement (§13 DP-6). Size-specific tracking (Apple): display tight (`-0.02em`), body `0`, small labels `+0.01em`; leading inverse to size. Reward/growth counters use **tabular numbers** so digits don't shuffle.

| Role | Family | rem | line-height | tracking | weight |
|---|---|---|---|---|---|
| Display (tier reveal) | display | 2.5 | 1.05 | -0.02em | 700 |
| H1 (region name) | display | 1.75 | 1.10 | -0.01em | 600 |
| H2 (panel title) | display | 1.25 | 1.20 | 0 | 600 |
| Body (Ledger) | body | 1.0 | 1.5 | 0 | 400 |
| Label / caption | body | 0.8125 | 1.4 | +0.01em | 500 |

**Lighting & atmosphere.** A single warm **key light from top-left** (consistent everywhere); islands cast soft long shadows to the bottom-right. A slow **water shimmer** (gradient-mask sweep ~6s, `Alternate`), **cloud drift** (slow parallax `Marquee`), drifting **ambient motes** (very low count, additive), and a subtle **vignette** focus the center. The world is perpetual **golden hour** — the thematic "afternoon" surface. **All ambient motion is OFF** under reduced-motion and the degraded tier; depth (parallax layers) is retained.

**Mood board, in words.** *A weathered explorer's atlas left open on a windowsill at 5 p.m.; toy-diorama islands you could pick up; lanterns and lighthouses warming to life one by one; turquoise tide-pools and copper gears; the hush of a book-forest; kites over windmills; a campfire on the home island where six small lantern-marks gather. Studio Ghibli warmth × a cozy board-game map × the calm confidence of a well-made reading app.*

### 5.2 · World & level design

A **2×2 archipelago**, **2048×2048** world units. Four **region islands**, one per learning-loop `Section`; a central **Base Camp** island over the seam (§5.8), reachable from every region.

| Region id | Section | Biome identity | Origin (x,y) | Signature |
|---|---|---|---|---|
| `numbers-coast` | math | shorelines, tide-pools, a counting lighthouse | (0, 0) | `#2EC4B6` |
| `tinker-bluffs` | science | workshop cliffs, gears, copper kilns | (1024, 0) | `#C77D3A` |
| `story-vale` | reading | book-root forest valley, whispering falls | (0, 1024) | `#3E9B5F` |
| `wordwind-reach` | language | windmill highlands, letter-kites, spelling spires | (1024, 1024) | `#5AA9E6` |

**Nodes are places; edges are lit paths; cross-island edges are bridges.** Each fixture node maps to a **named landmark (point of interest)** so the world reads as a place, not a graph:

| Node | Region | Landmark (POI) | Role |
|---|---|---|---|
| `count-cove` | Numbers Coast | **Counting Lighthouse** | first beacon; the tutorial start |
| `add-atoll` | Numbers Coast | **Abacus Jetty** | hub; bridges to Tinker Bluffs |
| `place-value-point` | Numbers Coast | **Tide-Pool Terraces** | transfer-critical (high celebrate) |
| `observe-overlook` | Tinker Bluffs | **Gear Overlook** | science entry |
| `measure-mesa` | Tinker Bluffs | **Gadget Workshop** | cross-island (needs Abacus Jetty); transfer-critical |
| `phoneme-falls` | Story Vale | **Whispering Falls** | reading entry |
| `blend-bay` | Story Vale | **Book-Root Forest** | bridges to Wordwind Reach |
| `letter-landing` | Wordwind Reach | **Letter Landing Field** | language entry |
| `sentence-summit` | Wordwind Reach | **The Spelling Spires** | summit; transfer-critical |

**State reads as light + form (never color alone — §6 FR-031).** `locked` = dim, cool `--locked`, a *closed padlock* glyph, path unlit; `available` = warm `--sun` **Glow Pulse** ring + an *open path* + a "start here" pennant; `unlocked` = a **lit beacon/flag** in `--gold`, filled star, warm path to the next node. Transfer-critical nodes wear a subtle laurel ring so their high-intensity celebration is legible in advance.

**Landmarks & wayfinding.** Every screen answers Apple's four wayfinding questions: region banners name *where you are*; lit paths show *where you can go*; node pennants/labels show *what's there*; a persistent "Home" affordance (to Base Camp) shows *how to get out*. Regions have a stable spatial identity so the learner builds a mental map (spatial consistency).

### 5.3 · Camera system (config §8.14)

- **Follow-camera** on the avatar: lerp `0.08` x/y, `roundPixels`, `setBounds(0,0,2048,2048)`, base zoom `1.0`. A **central deadzone** (30%×30%) so idle bob never scrolls the world.
- **Look-ahead** (Apple "hint in the direction of the gesture"): during traversal the camera leads the avatar by `64px` toward the target, so intent is telegraphed.
- **Establishing dolly-in** on world enter: camera opens at zoom `0.6` showing the whole archipelago, then eases to the avatar over `1200ms` `Cubic.InOut` — a cinematic *Continuity zoom*. Reduced-motion: instant cut to `1.0` on the avatar (150ms fade).
- **Region focus**: zoom `1.0 → 1.25` over `300ms` `Cubic.Out`, parallax deepening. Reduced-motion: instant.
- **Celebration punch** (high intensity only): a one-shot zoom `+0.03` in `120ms` then back `180ms` — a felt *impact*, never nausea-inducing. Off under reduced motion.
- **Parallax** (7 layers, back→front, §8.14): sky+sun `0.0`, far clouds `0.15`, horizon/far-islands `0.30`, sea+shimmer `0.60`, **world (islands/nodes/avatar) `1.0`**, foreground fronds `1.20`, ambient motes `1.05` (additive). Depth is kept under reduced motion; only the *motion* of ambient layers stops.

### 5.4 · Avatar — design, customization, animation (specs §8.13)

**Design.** A small, round-bodied **pseudonymous lantern-explorer** ("a Spark") — expressive-only, carrying a warm lantern (the lantern is the *warmth/independence* motif, never an ability signal). No face detail that could encode identity or advantage (§6 FR-010, §29). Built from layered SVG parts (`body`, `lantern`, plus cosmetic slots `hat`/`cape`/`badge`/`trail`) so cosmetics swap frames only.

**Customization.** Equipped `avatar-item` cosmetics (§7.3/§8.15) overlay/swap the corresponding slot sprite — appearance only, deterministic, zero-power, earned. Equip is a `Crossfade` with a 2px `Blur` bridge (Emil "blur masks an imperfect crossfade"), `200ms`; instant swap under reduced motion.

**Animation states** (`resolveAvatarAnimation(intent, {reducedMotion})`, golden §8.13). Never `scale(0)`; idle bob amplitude `4px`; landing from a celebrate-jump gets a `scaleY 0.92→1.0` **follow-through** (squash-&-stretch). Movement is **interruptible** — re-targeting reads the avatar's live position (Apple: animate from the presentation value).

| Intent | State | Effect (named) | Loop | Duration | Easing | Reduced-motion |
|---|---|---|---|---|---|---|
| idle | `idle` | `Float` bob + lantern flicker | yes (yoyo) | 1600ms | Sine.InOut | static pose, steady lantern |
| walk | `walk` | step cycle + path tween (≤1 seg) | during move | 600ms/seg | Cubic.Out | 150ms crossfade reposition |
| run | `run` | faster steps + forward lean + speed streak (≥2 seg / fast re-target) | during move | 380ms/seg | Cubic.Out | 150ms crossfade |
| think | `think` | head-tilt + "?" thought-mote + lantern pulse (on `available` focus / struggle) | 2× then idle | 900ms | Sine.InOut | static think pose |
| celebrate | `celebrate` | `Pop` jump + arms-up + lantern flare (on unlock) | one-shot | 400/600/800ms (low/med/high) | Back.Out | static celebrate pose + badge |

### 5.5 · Scenes & scene-by-scene UX (Phaser)

| Scene | Role & UX |
|---|---|
| `BootScene` | Create the game; read flags (reduced-motion, plain, band, seed); register the deterministic procedural texture generator; resolve `ASSET_KEYS` (§8.17). No visible UI beyond a warm loading field. |
| `PreloadScene` | Load committed seed SVGs from `/seed/` (atlas → SVG → procedural fallback, §5.11); a calm progress "lantern filling" indicator (state, not a spinner-earworm). **Never** fetches externally. |
| `WorldScene` | The overworld: parallax biomes, node markers per state, lit edge paths & bridges, the avatar, follow-camera + establishing dolly-in, traversal, and unlock reveals. Owns the map. |
| `BaseScene` | The cohort **Base Camp** (§5.8): renders `unlockedFeatures` into deterministic zones/slots (§8.16); focus shows the attributable pseudonymous contributor + mission. The "home" surface. |
| `FxScene` | Celebration overlay above the world: particle bursts, node bloom, path light-up, camera punch — all driven by `celebrationMotionSpec` + `resolveMotion` (§8.5/§8.10). A no-op / single static frame under reduced motion. |

**Onboarding (first-run, `OnboardScene` overlay / coach-marks — §6 FR-038).** A 3-beat, skippable, non-blocking sequence at the Counting Lighthouse: (1) *"This is you"* — the avatar idles, lantern glimmers; (2) *"Light a path"* — a pointer to the first `available` node, "clear its gate to light the beacon"; (3) *"Your way"* — surfaces plain-mode + the Ledger + standings-off. Any input advances/dismisses; it **never** gates a mastery action, is fully mirrored in the Ledger, and each beat honors reduced motion (`Fade`, no slide). Shown once (a local flag); re-openable from the HUD "?".

**React owns the HUD + Ledger (DOM), Phaser owns the canvas.** A typed event bus bridges React → Phaser (set band / toggle plain / equip cosmetic / advance the synthetic feed / focus node) and Phaser → React (node focused / unlock celebrated / scene changed), so the Ledger and canvas stay in lock-step from the one `ArenaView` (§2 D4).

### 5.6 · Motion & juice — the master motion table (the heart)

Motion is designed, not decorated (Apple §17: interaction and visuals together). Durations are **named tokens** (§8.10 `MOTION`); easings are **named** (§8.10 `EASINGS`); every row has a first-class reduced-motion equivalent (Emil/Apple: reduced motion = *gentler*, not *gone*). All entries derive from `resolveMotion(kind, {reducedMotion})` so the values are testable constants (SC-015).

| Event | Named effect (vocabulary) | Easing | Duration (token) | Particles | Camera/screen | Sound cue | Reduced-motion equivalent |
|---|---|---|---|---|---|---|---|
| World enter | Establishing **dolly-in** + scene **Crossfade** | Cubic.InOut | 1200 (`intro`) | — | zoom 0.6→1.0 to avatar | boot chime | instant cut to 1.0 + 150ms fade |
| Node reveal (unlock) | **Scale-in + Pop** (0.95→1.0, α0→1, peak ~1.05) + path **Line-drawing** | Back.Out | 220 (`reveal`) | per intensity | punch (high only) | unlock chord | instant show + static "unlocked" badge |
| Independent-unlock **high** (transfer-critical) | **Burst + Bloom + Camera-punch** (ember→gold radial) | Back.Out | 800 (`celebrateHigh`) | 24 | punch +0.03 (120/180ms) | beacon arpeggio | static starburst badge + `aria-live` announce (150ms) |
| Unlock **medium** | Burst + Bloom | Back.Out | 600 (`celebrateMed`) | 12 | none | bloom chord | static badge + announce |
| Productive-struggle **low** | **Warm Pulse** + rising motes + avatar `think→nod` | Sine.InOut | 400 (`celebrateLow`) | 6 | none | encouraging tone | static "effort honored" chip |
| Error / "not yet" | Calm **Float** wisp (`--notyet` blue), node steadies | Cubic.Out | 300 (`base`) | 0 | none | **neutral soft tap** | static "not yet" text, no motion |
| Available highlight | **Glow Pulse** ring (yoyo, low amplitude) | Sine.InOut | 1200 (`glowLoop`) | — | none | (silent) | static ring/outline, no pulse |
| Avatar traverse | **Tween along path** + camera follow + look-ahead | Cubic.Out | 600 (`move`)/380 (`run`) | — | follow lerp 0.08 | footfall tick | 150ms crossfade reposition |
| Press feedback | **Press/Tap** scale 0.97 (on pointer-*down*) | Quad.Out | 120 (`press`) | — | none | (silent) | kept (non-vestibular) |
| Region focus | **Continuity zoom** 1.0→1.25 + parallax deepen | Cubic.Out | 300 (`zoom`) | — | zoom | (silent) | instant zoom |
| Tier advance | **Number ticker** (tabular) + tier badge **Pop** + gold sweep | Cubic.Out | 600 (`celebrateMed`) | — | none | rising sweep | instant number + static badge |
| Cosmetic equip | **Crossfade + Blur mask** sprite swap | Cubic.Out | 200 (`equip`) | — | none | cloth whoosh | instant swap |
| Cosmetic drawer | **Origin-aware Scale-in** (from trigger) + item **Stagger** 40ms | Cubic.Out | 220 (`fast`) | — | none | (silent) | instant/fade |
| Scene → Base | **Direction-aware** slide toward Base Camp + Crossfade | Cubic.Out | 350 (`sceneFade`) | — | none | (silent) | 150ms crossfade |
| Base accretion | **Pop-in place** (0.9→1.0) + dust motes; label **Fade-in** | Back.Out | 300 (`base`) | small | none | place click + murmur | instant place + list update |
| Standings open (opt-in) | **Accordion** expand + own-gain bar **grow** L→R | Cubic.Out | 220 (`fast`) | — | none | (silent) | instant |
| Ambient world | Water **shimmer**, cloud **drift** (Marquee), **motes Float** | Linear/Sine | 6000 loop | low | none | (silent) | **all off**; depth kept |
| HUD toggle (band/plain/standings) | **Instant** (frequent action → no animation) | — | 0 (`instant`) | — | none | (silent) | instant |
| Onboarding beat | **Fade** + gentle pointer | Cubic.Out | 300 (`base`) | — | none | (silent) | static, no slide |

**Deliberately excluded** (would violate §14.12 / this design): `Shake`/`Wiggle` on error (reads as rejection/loss — errors use a *calm* wisp), any `scale(0)` entrance, `ease-in` on entrances, gacha "reroll" reveal animation, loss/decay meters, engagement-timed pop-ins, and any looping earworm audio.

### 5.7 · Celebration sequences (orchestration — the loudest moments, §14.12)

The two loudest sequences are **orchestrated** (multi-property motion timed to feel like one gesture), reserved for the mechanism, never for minutes:

**A. Independent-unlock (high / transfer-critical) — "Light the beacon."** On `masteryCleared` for a transfer-critical node with prereqs met: (t=0) neutral avatar `celebrate` **Pop** jump begins; (t=60ms) the node marker **Scale-in + Pop** to lit `--gold` beacon; (t=120ms) a 24-particle ember→gold **Burst** with `800ms` lifespan + a bloom **Ripple** ring; (t=120ms) the camera **punch** (+0.03, 120ms out / 180ms back); (t=200ms) the **path Line-draws** to the next node and warms; `aria-live` announces "You lit The Spelling Spires — you did it yourself." Sound: beacon arpeggio (muted default, captioned). **Reduced-motion:** a single static starburst badge appears on the now-lit node + the announce; **nothing is required to be motion to be understood.** With `celebration-aurora` equipped (§8.15), the burst becomes aurora ribbons + a one-shot sky shimmer — the rarest look.

**B. Productive-struggle — "Struggle honored."** On an extra unassisted attempt / self-correction / return-after-fail: the avatar plays `think→nod`, a gentle 6-particle **Warm Pulse** rises from the node, and a Ledger `aria-live` chip reads process-praise ("You kept going after a tricky one — that's the work."). No node state change, nothing removed. Reduced-motion: the static chip alone.

Both derive from `classifyCelebration` + `celebrationMotionSpec` (§8.5) so intensity, particle count, duration, and the reduced equivalent are deterministic and testable.

### 5.8 · Cohort Base Camp — the co-built home (layout §8.16)

The central island is a cozy **harbor camp** the stable cohort of six co-builds. It is the default landing when standings/competition are off — the belonging surface (§15.2 rollback gate). It **grows visibly warmer and more populated** as cooperative missions accrete features into stable **zones/slots** (deterministic, `resolveBaseLayout`):

| Feature | Zone | Slot origin (x,y) | Look |
|---|---|---|---|
| `campfire` | hearth | (1024, 1024) | central warm fire; gathering point; lantern-marks circle it |
| `banner` | gateway | (1024, 928) | a co-signed cohort banner over the camp gate |
| `garden` | grove | (944, 1088) | a small shared planter that fills in with growth |
| `dock` | harbor | (1104, 1120) | a jetty where arrivals land |
| `workshop` | yard | (944, 960) | a shared bench with in-progress projects |
| `lookout` | ridge | (1104, 944) | a spyglass platform over the isles |

Each contribution is **attributable** — a small pseudonymous **lantern-mark** with the contributor's ref + mission id appears beside its prop (on focus / in the Ledger list). Features place in **contribution order** into their zone; unknown feature ids get a deterministic grid-fallback slot (still replayable). The base confers **zero power** (§6 FR-011). New arrivals `Pop-in place` (reduced-motion: instant). Over time the camp reads as *"we made this together."*

### 5.9 · Cosmetics — the catalog, how they *look* (visuals §8.15)

Cosmetics are competence-earned, deterministic, **zero-power**, and **never purchasable** (§7.3 rules; structurally no price/rarity field, §6 FR-008/009). Each carries a deterministic text `look` + `equipEffect` descriptor (testable it exists and is stable, SC-022) and a reduced-motion form. Nine fixture cosmetics:

| id | kind | look | equip / effect | reduced-motion |
|---|---|---|---|---|
| `avatar-hat-explorer` | avatar-item | soft tan felt explorer's cap | tilts slightly on walk | static tilt |
| `avatar-cape-aurora` | avatar-item | teal→plum aurora-gradient cape | trails on `run` | static cape, no trail |
| `avatar-badge-firstlight` | avatar-item | small gold "first light" star pin | glints on idle | static pin |
| `world-theme-dawn` | world-theme | rosier dawn sky + softer light | recolors sky/sea on equip | instant recolor |
| `world-theme-dusk` | world-theme | deep-indigo dusk; brighter lanterns; stars | stars twinkle | static stars |
| `base-banner-unity` | base-theme | co-signed unity banner at Base gate | shows contributor marks | static banner |
| `base-lantern-warm` | base-theme | warm lantern strings around camp | gentle sway | static strings |
| `celebration-bloom` | celebration-effect | unlock burst → flower-petal bloom | changes particle shape | static petal badge |
| `celebration-aurora` | celebration-effect | unlock burst → aurora ribbons + sky shimmer | rarest; sky one-shot | static ribbon badge |

A cosmetic drawer shows **eligible** items (equippable) and **locked** items *with their earn rule shown as a goal* ("Light 3 beacons", "Reach Beacon tier") — never a price, never a "buy/roll" button.

### 5.10 · Sound design cues (muted by default, captioned — §6 FR-037; registry §8.18)

Audio is **muted by default** with a single toggle and **captions** in the Ledger; no cue loops, none is engagement-timed, and the error cue is **neutral** (never an alarm/buzzer — an error is not a loss). Character: warm, soft, short. `resolveSoundCue(event)` is deterministic.

| Event | Cue id | Caption | Character |
|---|---|---|---|
| boot ready | `boot-chime` | [warm chime] | rising 3-note |
| traverse step | `footfall` | [soft step] | very low tick |
| node available | `ready-shimmer` | [ready shimmer] | gentle |
| unlock medium | `bloom-chord` | [unlock chime] | warm chord |
| unlock high | `beacon-arpeggio` | [beacon lights up] | ascending arpeggio + soft wordless cheer |
| productive-struggle | `encourage-tone` | [keep-going tone] | low "mm-yes" |
| error / not-yet | `soft-tap` | [soft tap] | **neutral**, not negative |
| cosmetic equip | `cloth-whoosh` | [cloth whoosh] | light |
| tier advance | `rising-sweep` | [tier up] | warm sweep |
| base accretion | `place-murmur` | [placed + soft cheer] | click + tiny community murmur |

### 5.11 · Asset pipeline (§6 FR-039; keys §8.17)

- **Committed seed SVGs** under `apps/arena/public/seed/`, grouped: `avatar/` (body, lantern, hat, cape, badge), `nodes/` (marker-locked, marker-available, marker-unlocked, beacon), `regions/` (4 island tiles + water + bridge), `base/` (props per zone), `fx/` (mote, petal, ribbon, star), `ui/` (icons). Small, text-diffable, public-repo-safe; **no external fetch**.
- **Deterministic key registry** `ASSET_KEYS` in the domain (§8.17) so canvas + Ledger + procedural fallback agree on every key by construction.
- **Load order per key: atlas → SVG → procedural.** `PreloadScene` prefers a packed atlas (`public/atlas/isles.json`, the non-breaking richer-art path) if present, else the seed SVG, else a **deterministic procedural texture** (`Graphics.generateTexture`, seeded, no `Math.random`) — a tinted shape keyed to the biome/state — so a missing asset **still renders** (FR-030/039). Determinism proven in `assets.test.ts`.
- **Path to richer art (non-breaking):** replace/augment seed SVGs with a TexturePacker hash atlas under `public/atlas/` keyed identically; no code change beyond the loader's atlas branch. Optional self-hosted subset fonts (§13 DP-6) follow the same "committed, no-fetch, non-breaking" rule.

### 5.12 · HUD & the accessible Ledger — visual + semantic design

**HUD (Phaser-adjacent DOM overlay).** Translucent, `backdrop-filter` frosted panels floating over the sea (Apple materials: chrome that content scrolls under, not opaque bars) — a top region banner, a bottom growth/tier panel, a right cosmetic drawer, and a "?" / Home / audio / plain-mode / band / standings control cluster. Panels `Materialize` (blur + scale on enter) rather than hard-fade; press feedback on every control (scale 0.97); ≥44px targets (56px in the 6-8 band). Reduced-transparency → solid panels.

**The Arena Ledger (the equal, semantic twin — §12, D5).** Built from the same `ArenaView`: the quest graph as a keyboard-navigable `role="tree"` (each node a `treeitem` whose accessible name = *landmark title + state + region*, e.g. "The Spelling Spires, unlocked, Wordwind Reach"); tier/growth as band-appropriate text; cosmetics as a labeled `listbox` (eligible = equippable, locked = with its earn-goal); the base as a list of features + contributors; celebrations via `aria-live="polite"`; captions for sound cues. Full keyboard/switch operation, visible `--focus` rings, color-independent state (icon + text), ≥4.5:1 contrast. Canvas is `aria-hidden="true"`. Because both renderers consume the one view model, they never drift (parity by construction).

### 5.13 · Age-band visual variants (§14.13; tokens §8.19)

Identical underlying economy (§13), **different presentation** via `resolveVisualBand(band)`:

- **6-8** — concrete & story-framed. **No raw number on the canvas** (`showCanvasNumbers=false`); tier is a *growing light*, not a digit; labels are story sentences ("You lit the Counting Lighthouse!"); comparison **off**; larger markers (`×1.25`) and 56px targets; more avatar idle personality; celebration ceiling capped at **medium** (warm, not overwhelming).
- **9-11** — transitional. Growth-vs-past bar is primary ("past-you vs you"); simplified tier badge + quest-tree; standings **opt-in** but muted; 48px targets; full celebration ceiling.
- **12-14** — full & strategic. Full map, numeric independence reward (tabular), tier ladder, quest graph, **opt-in** near-peer standings, dusk theme available; 44px targets; full celebration ceiling.

The variant is a **render layer over identical state** (a flag on `buildArenaView`); `plainViewEquals` still holds — only presentation and `flags` differ (SC-006/014/020).

### 5.14 · Motion principles (the rules every value above obeys)

- **Frequency-appropriate** (Emil): rare (celebration) → delight; occasional (traverse) → standard eased; frequent (HUD toggles) → instant.
- **Enter/exit `Cubic.Out`** (responsive), on-screen moves `Sine.InOut`, reveals `Back.Out` (overshoot ≤1.05, never `scale(0)`); **never `ease-in` on entrances**.
- **Interruptible & velocity-aware** (Apple): traversal re-targets from the live position; nothing locks out input.
- **Only transform/alpha/particles** animate on canvas; no layout thrash; target **60fps** with the degraded tier (halved particles, glow/shadow/ambient off) holding the budget.
- **Every** animation has a reduced-motion equivalent (§8) and a Ledger equivalent (§12); reduced motion is *the same game, conveyed calmly.*

---

## §6 · Requirements *(mandatory)*

### Functional Requirements

**Quest-world map & mastery gate**

- **FR-001**: The system MUST render the competency graph (§12) as a traversable overworld — regions as islands, nodes as quest locations, edges as paths — with a **deterministic layout**, tweened avatar movement, a follow-camera, and animated node reveals (each with a reduced-motion equivalent, FR-015).
- **FR-002**: A node MUST unlock **only** through its 90% independent-mastery gate (§12); progression MUST NOT be obtainable via time-in-app, revisits, or grinding.
- **FR-003**: A node MUST be `available` only when **all** prerequisites are mastered; `unlocked` only when `available` **and** its own gate is cleared; else `locked`.
- **FR-004**: Node-state derivation and world layout MUST be **pure, deterministic** functions of the signals + graph — no randomness, replayable, identical output for identical input.

**Gain-based tiers & independence reward**

- **FR-005**: Tiers/levels MUST advance on mastery-gain and the independence reward (§13), framed first as growth-against-own-past (§14.13).
- **FR-006**: Tier derivation MUST be deterministic thresholds over cumulative independence reward, and a tier MUST affect **only** cosmetics — never access, matchmaking, or standing.

**Earned cosmetics & avatar**

- **FR-007**: Cosmetic-unlock **eligibility** MUST be competence-earned and **deterministic** — no gacha, no variable-ratio/random loot, no timed drops.
- **FR-008**: Cosmetics MUST NOT be purchasable with money (G1); the system MUST expose **no** purchase/financial code path for minors.
- **FR-009**: Cosmetics MUST carry **zero gameplay power** — never affect mastery, node-unlock, matchmaking, standing, or access; ignoring cosmetics MUST never disadvantage a learner.
- **FR-010**: The avatar MUST be **pseudonymous** (no real likeness/legal name/biometric, §29), expressive-only, encode no ability signal, confer no advantage; equipping a cosmetic MUST require prior eligibility.

**Persistent cohort base**

- **FR-011**: The system MUST maintain a **persistent cohort base** a stable cohort co-builds via cooperative-mission completions, with deterministic accretion, attributable contributions, and **zero gameplay power**, rendered as a base scene.

**Juice & failure framing**

- **FR-012**: The system MUST emit celebration events on **independent unlocks** and **productive-struggle** events (§14.12 items 3-4).
- **FR-013**: An incorrect attempt or help request MUST NOT be rendered as a loss and MUST NOT remove any earned reward/standing/mastery; the reward surface MUST render **no** loss event, decaying/absence meter, or forfeiture (§14.12 items 1,5; §14.12.1).
- **FR-014**: Celebration/failure copy MUST praise the **process** and MUST NOT reference fixed ability, speed, or identity (§14.12 item 2).

**Reduced motion & accessibility**

- **FR-015**: Reduced motion MUST be a **first-class, equal** mode: every animated affordance MUST have a reduced-motion rendering conveying the same state/progression/celebration; `prefers-reduced-motion` MUST be honored by default; **no** feature may require motion (WCAG 2.2 AA, §8.3). Motion parameters MUST derive from a deterministic `celebrationMotionSpec`.
- **FR-016**: All game-experience surfaces MUST meet WCAG 2.2 AA via the **accessible DOM Ledger** — keyboard/switch/screen-reader operable, focus-visible, captioned, color-independent, ≥4.5:1 contrast. The canvas is `aria-hidden`; the Ledger conveys identical state.

**Developmental staging**

- **FR-017**: Reward/progression representation MUST resolve from the learner's age band (6-8, 9-11, 12-14); the underlying economy (§13) MUST be identical across bands — only representation, default competitive exposure, and failure copy vary.
- **FR-018**: A 6-to-8 learner MUST NOT be shown the raw mastery-delta number as the headline currency; that band MUST default to concrete/story-framed representation with comparison **off**.

**Standings, opt-out & no caste**

- **FR-019**: Any cross-child standing MUST be opt-in (default off), near-peer-band, anonymized, gain-based, and MUST never surface a bottom-rank position; caste ranks, public tier names, and full-field rankings MUST NOT be representable (§15, G6).
- **FR-020**: Turning off standings, or using plain mode, MUST leave learning, access, and standing unchanged (opt-out is free).

**No dark patterns, performance & non-blocking**

- **FR-021**: The reward surface MUST use no loss-framed streaks, manufactured scarcity, FOMO, gacha/loot randomness, or engagement-timed notifications (§14.12 item 5).
- **FR-022**: The game surface MUST never block, delay, or gate a mastery action.
- **FR-023**: The real-time client MUST target 60fps on the minimum supported device with a reduced tier and graceful degradation under load / low-end hardware / WebGL context loss, leveraging **Phaser 4's rebuilt WebGL renderer and its GPU context-loss/restore handling**; game-feel MUST NOT become engagement-maxxing.

**Privacy, synthetic scope & review**

- **FR-024**: Avatars/base/cosmetics MUST be pseudonymous and hold no sensitive data/PII; the feature MUST run end-to-end with **synthetic learners only** and MUST NOT require any consent/admissions/legal/governance workflow.
- **FR-025**: A report of bullying/coercion/exclusion in any social surface MUST bypass optimization and route to safeguarding; the game MUST NOT gamify/suppress/delay it. *(This slice: a fail-closed hook/flag, not a live pipeline.)*
- **FR-026**: Every child-facing surface MUST pass a **named human-review gate before child exposure** (§25); the autonomous build loop MUST be **PR-only** — a human reviews and approves before merge.

**Build-on / isolation & engine**

- **FR-027**: The feature MUST build on `@gt100k/learning-loop` (`Section`/`SECTIONS`, mastery-gate/`evaluateGate` concept, XP, beyond-floor signal) and MUST NOT modify `packages/learning-loop`, `apps/student-compass`, or shared root config except the single final human-reconciled root-tsconfig task.
- **FR-028**: The app MUST render the game on **Phaser 4** (`^4.2.1`, Canvas/WebGL with the rebuilt WebGL renderer) loaded **client-only** (no SSR), using Phaser-4 APIs only (no removed Phaser-3-only APIs — §2 D1), with the Phaser instance destroyed on unmount and **zero console/WebGL errors** in the smoke run.
- **FR-029**: The Phaser scene, the reduced-motion/plain rendering, and the accessible Ledger MUST all render from the **single `ArenaView`** produced by `buildArenaView`; reduced-motion/plain MUST NOT recompute state (parity by construction).
- **FR-030**: Seed assets MUST be committed in-repo (small SVGs) with a deterministic procedural fallback; the game MUST build and run with **no external fetch**.

**Art direction, motion system, avatar, camera, sound, onboarding & assets**

- **FR-031**: The world MUST render with the **Independence Isles** visual identity — the golden-hour master palette (§8.11), per-biome region identity (§8.12), a consistent top-left key light, and the typography tokens (§8.11) — using **no external fetch** (system-rounded font fallback by default). **Color is never the sole state cue**: every node/tier/standing state MUST also be conveyed by icon/shape/text, at ≥4.5:1 text contrast (WCAG 2.2 AA, FR-016).
- **FR-032**: The avatar MUST support the animation states `idle | walk | run | think | celebrate` via the deterministic `resolveAvatarAnimation(intent, { reducedMotion })` (§8.13); movement MUST be **interruptible** (re-target from the live position), MUST NEVER animate from `scale(0)`, and every state MUST have a reduced-motion equivalent.
- **FR-033**: The camera MUST be a bounded follow-camera with a central deadzone, directional look-ahead, an establishing dolly-in on world enter, region focus zoom, and layered parallax per the golden camera config (§8.14); **every camera motion MUST have a reduced-motion cut/instant equivalent** and the game MUST keep depth (parallax layers) while stopping ambient motion under reduced motion / the degraded tier.
- **FR-034**: All interaction motion MUST derive from the deterministic motion-token registry (`MOTION`/`EASINGS`, §8.10) via `resolveMotion(kind, { reducedMotion })`; **every** entry in the master motion table (§5.6) MUST have a first-class reduced-motion equivalent, and the excluded effects (§5.6: shake/wiggle-on-error, `scale(0)`, `ease-in` entrances, gacha reveals, decay meters, engagement-timed pop-ins, looping audio) MUST NOT appear.
- **FR-035**: Each cosmetic MUST carry a deterministic text `look`/`equipEffect` visual descriptor and a reduced-motion form (§8.15); cosmetic visuals MUST remain **zero-power** and the type MUST still expose **no** `price`/`currency`/`dropRate`/`rarity` field (FR-008/009).
- **FR-036**: Cohort-base features MUST place into deterministic zones/slots via `resolveBaseLayout(base)` (§8.16), remain **attributable** (pseudonymous contributor + mission) and **zero-power**, and place in contribution order with a deterministic fallback slot for unknown features (replayable).
- **FR-037**: Sound MUST be **muted by default**, captioned in the Ledger, non-looping, and never engagement-timed; cue selection MUST be deterministic via `resolveSoundCue(event)` (§8.18); the **error/"not-yet" cue MUST be neutral** (never an alarm/negative sound — an error is not a loss).
- **FR-038**: A **first-run onboarding** sequence (coach-marks/`OnboardScene`) MUST convey traverse → unlock → plain-mode/Ledger/standings-off, MUST be skippable and dismissible on any input, MUST NEVER block/delay a mastery action (FR-022), MUST be fully mirrored in the Ledger, and MUST honor reduced motion.
- **FR-039**: A deterministic `ASSET_KEYS` registry (§8.17) MUST key every asset; the loader MUST try **atlas → committed SVG → procedural fallback** so a missing asset still renders, with **no external fetch** (FR-030); procedural fallbacks MUST be seeded (no `Math.random`).
- **FR-040**: Canvas presentation MUST resolve per age band via `resolveVisualBand(band)` (§8.19); the **6-8 band MUST show no raw number on the canvas** (`showCanvasNumbers=false`) and cap the celebration ceiling; the underlying state MUST be identical across bands (`plainViewEquals`, FR-029).

### Key Entities

Full shapes in [data-model.md](./data-model.md). Summary: `AgeBand`, `CompetencyNode`, `QuestWorld`, `NodePosition`/`WorldLayout`, `NodeMasterySignal` *(synthetic input)*, `NodeState` *(derived)*, `ProgressionState` *(derived)*, `Tier`, `Cosmetic` *(no price/rarity field; adds `look`/`equipEffect`)*, `CosmeticEligibility` *(derived)*, `AvatarState`, `AvatarAnimationSpec` *(derived)*, `CohortBase`, `CooperativeMissionResult` *(input)*, `BasePlacement` *(derived)*, `CelebrationEvent`, `MotionSpec` *(derived)*, `MotionToken` *(derived)*, `RewardRepresentation` *(derived, age-band)*, `VisualBand` *(derived, age-band)*, `BiomeIdentity`, `WorldTheme`, `CameraConfig`/`ParallaxLayer`, `SoundCue` *(derived)*, `AssetKeyRegistry`, `NearPeerStanding` *(derived, opt-in; no rank field)*, the composed **`ArenaView`** (with a derived `presentation` block) that drives every renderer, and the golden constant registries `PALETTE`/`TYPOGRAPHY`/`MOTION`/`EASINGS`.

---

## §7 · Golden fixtures (the canonical synthetic world)

The domain ships fixed fixtures so golden values are exact and stable: `graph.fixture.ts` (world + landmark POIs), `tiers.fixture.ts`, `catalog.fixture.ts` (cosmetics + `look`/`equipEffect`), `biomes.fixture.ts` (§8.12), and `baseLayout.fixture.ts` (§8.16). Constant registries (`PALETTE`, `TYPOGRAPHY`, `MOTION`, `EASINGS`, `CAMERA`, `PARALLAX`, `ASSET_KEYS`, `SOUND_CUES`) live in their modules (§8.10–§8.18) and are exercised by golden tests.

### 7.1 Fixture graph (9 nodes, 4 regions)

| Node id | region | sections | prerequisites | transferCritical |
|---|---|---|---|---|
| `count-cove` | numbers-coast | [math] | — | false |
| `add-atoll` | numbers-coast | [math] | [count-cove] | false |
| `place-value-point` | numbers-coast | [math] | [add-atoll] | true |
| `observe-overlook` | tinker-bluffs | [science] | — | false |
| `measure-mesa` | tinker-bluffs | [science, math] | [observe-overlook, add-atoll] | true |
| `phoneme-falls` | story-vale | [reading] | — | false |
| `blend-bay` | story-vale | [reading] | [phoneme-falls] | false |
| `letter-landing` | wordwind-reach | [language] | — | false |
| `sentence-summit` | wordwind-reach | [language, reading] | [letter-landing, blend-bay] | true |

Derived edges (from = prereq → to = node): `count-cove→add-atoll`, `add-atoll→place-value-point`, `observe-overlook→measure-mesa`, `add-atoll→measure-mesa`, `phoneme-falls→blend-bay`, `letter-landing→sentence-summit`, `blend-bay→sentence-summit`. Regions (stable order): `[numbers-coast, tinker-bluffs, story-vale, wordwind-reach]`.

Each node additionally carries a **`landmark`** (its point-of-interest name, §5.2), used as the primary label on canvas and in the Ledger accessible name: `count-cove`→"Counting Lighthouse", `add-atoll`→"Abacus Jetty", `place-value-point`→"Tide-Pool Terraces", `observe-overlook`→"Gear Overlook", `measure-mesa`→"Gadget Workshop", `phoneme-falls`→"Whispering Falls", `blend-bay`→"Book-Root Forest", `letter-landing`→"Letter Landing Field", `sentence-summit`→"The Spelling Spires".

### 7.2 Tier table (`tiers.fixture.ts`)

| index | label | minReward |
|---|---|---|
| 0 | Spark | 0 |
| 1 | Kindling | 100 |
| 2 | Steady Flame | 250 |
| 3 | Bright Ember | 500 |
| 4 | Beacon | 900 |
| 5 | Lighthouse | 1500 |

Labels are band-neutral and non-caste (not public ranks). `tierForReward(r)` = highest tier with `minReward ≤ r`.

### 7.3 Cosmetic catalog (`catalog.fixture.ts`, declaration order = stable order)

| id | kind | rule |
|---|---|---|
| `avatar-hat-explorer` | avatar-item | `{ type:"min-tier", tierIndex:1 }` |
| `avatar-cape-aurora` | avatar-item | `{ type:"min-tier", tierIndex:3 }` |
| `avatar-badge-firstlight` | avatar-item | `{ type:"min-unlocks", count:1 }` |
| `world-theme-dawn` | world-theme | `{ type:"min-unlocks", count:3 }` |
| `world-theme-dusk` | world-theme | `{ type:"min-tier", tierIndex:4 }` |
| `base-banner-unity` | base-theme | `{ type:"region-complete", region:"numbers-coast" }` |
| `base-lantern-warm` | base-theme | `{ type:"min-tier", tierIndex:2 }` |
| `celebration-bloom` | celebration-effect | `{ type:"min-unlocks", count:1 }` |
| `celebration-aurora` | celebration-effect | `{ type:"min-tier", tierIndex:5 }` |

A region is **complete** ⇔ every node with that `region` is `unlocked`. Each catalog entry also carries the deterministic `look` + `equipEffect` visual descriptors of **§8.15** (present and stable; still **no** `price`/`currency`/`dropRate`/`rarity` field).

---

## §8 · Golden values + tolerances

All domain values below are **exact** (deterministic; tolerance = 0). UX/motion values are **acceptance targets** with the stated tolerance, verified via the walkthrough (not domain unit tests) except where a pure function derives them.

### 8.1 Layout (exact) — `layoutQuestWorld(world)`

Constants: `REGION_SPACING = 1024`, `NODE_SPACING = 192`, `NODE_COLS = 3`, `NODE_OFFSET = 96`. Region origins per §5.1. For node index `i` within its region: `x = originX + (i % 3)·192 + 96`, `y = originY + floor(i/3)·192 + 96`. World bounds `{ x:0, y:0, width:2048, height:2048 }`.

| Node | position (x, y) |
|---|---|
| `count-cove` | (96, 96) |
| `add-atoll` | (288, 96) |
| `place-value-point` | (480, 96) |
| `observe-overlook` | (1120, 96) |
| `measure-mesa` | (1312, 96) |
| `phoneme-falls` | (96, 1120) |
| `blend-bay` | (288, 1120) |
| `letter-landing` | (1120, 1120) |
| `sentence-summit` | (1312, 1120) |

### 8.2 Node states (exact) — scenario **S1**

S1 signals (`masteryCleared`, `independenceReward`): `count-cove`(true, 60), `add-atoll`(true, 80), `place-value-point`(false, 0), `observe-overlook`(true, 50), `measure-mesa`(true, 110), `phoneme-falls`(false, 0); `blend-bay`, `letter-landing`, `sentence-summit` have **no signal** (treated as `masteryCleared=false`, reward 0).

| Node | state |
|---|---|
| `count-cove` | unlocked |
| `add-atoll` | unlocked |
| `place-value-point` | available |
| `observe-overlook` | unlocked |
| `measure-mesa` | unlocked |
| `phoneme-falls` | available |
| `blend-bay` | locked |
| `letter-landing` | available |
| `sentence-summit` | locked |

### 8.3 Progression (exact) — S1

`cumulativeIndependenceReward = 60+80+50+110 = 300` (sum over `unlocked` nodes). `masteredCount = 4`. `tier = index 2` ("Steady Flame", minReward 250). `growthVsPast = { previous: 0, current: 300, delta: 300 }`. Regions complete: `[tinker-bluffs]` (its 2 nodes both unlocked); `numbers-coast` NOT complete (`place-value-point` is `available`).

### 8.4 Cosmetic eligibility (exact) — S1 (tier 2, unlocks 4, regionsComplete `[tinker-bluffs]`)

`eligibleIds` (stable/catalog order): `["avatar-hat-explorer", "avatar-badge-firstlight", "world-theme-dawn", "base-lantern-warm", "celebration-bloom"]`.
`lockedIds`: `["avatar-cape-aurora", "world-theme-dusk", "base-banner-unity", "celebration-aurora"]`.
Tier-boundary checks: `tierForReward(99)=0`, `(100)=1`, `(249)=1`, `(250)=2`, `(500)=3`, `(899)=3`, `(900)=4`, `(1500)=5`. Equipping `avatar-cape-aurora` in S1 MUST throw/reject (not eligible).

### 8.5 Celebration + motion spec (exact)

`classifyCelebration`: `independent-unlock` of a `transferCritical` node → `intensity:"high"`; ordinary unlock → `"medium"`; `productive-struggle` → `"low"`; incorrect attempt / help request → `null` (no event, nothing removed). Every event `copyStyle:"process-praise"`; the union has **no** loss/penalty type.

`celebrationMotionSpec(event, { reducedMotion })`:

| input | mode | particleCount | durationMs | cameraPunch |
|---|---|---|---|---|
| high, motion on | animated | 24 | 800 | true |
| medium, motion on | animated | 12 | 600 | false |
| low, motion on | animated | 6 | 400 | false |
| any, reducedMotion=true | static | 0 | 150 | false |

### 8.6 Age-band representation (exact) — `resolveRewardRepresentation(band, progression)`

| field | 6-8 | 9-11 | 12-14 |
|---|---|---|---|
| `band` | "6-8" | "9-11" | "12-14" |
| `headline` | "concrete-marker" | "growth-vs-past" | "mastery-delta" |
| `currencyLabel` | "I did it myself!" | "You vs. past-you" | "Independence reward" |
| `showRawNumber` | false | false | true |
| `comparisonDefault` | "off" | "opt-in" | "opt-in" |
| `failureCopy` | "Let's try that one again — you've got this." | "Not yet — here's one thing to try." | "Here's the specific step that trips it — pick your next move." |

The underlying `ProgressionState` is **identical** across bands; only this view varies. 6-8 `showRawNumber` MUST be `false`.

### 8.7 Standings (exact) — `deriveStanding(self, nearPeers, options)`

Fixture: `self.selfGain = 300`; `nearPeers = [{pseudonym:"kestrel", gain:260},{pseudonym:"otter", gain:340},{pseudonym:"finch", gain:300}]`.
- `options.optedIn = false` (default) → returns `null`.
- `options.optedIn = true` → `{ band, anonymizedPeers:[…3…], selfGain:300, gainToBandTop: 40 }` where `gainToBandTop = max(all gains) − selfGain = 340 − 300 = 40`. The result MUST expose **no** `rank`/`position`/`percentile`/`outOf` field.

### 8.8 Cohort base (exact)

`applyCohortContribution` over the sequence `[{missionId:"m1",feature:"campfire",by:"kestrel"}, {missionId:"m2",feature:"banner",by:"otter"}, {missionId:"m3",feature:"garden",by:"kestrel"}]` yields `contributions` = those three (append-only, order preserved) and `unlockedFeatures = ["campfire","banner","garden"]` (distinct, stable order). Replaying the sequence yields an identical base.

### 8.9 UX / motion (acceptance targets, tolerance in parentheses)

Avatar path segment 600ms `Cubic.Out` (±50ms) · node reveal 220ms `Back.Out` peak ~1.05 (±30ms) · available glow pulse 1200ms loop (±100ms; off in reduced/degraded) · camera lerp 0.08 (±0.02) · region zoom 1.0→1.25 over 300ms (±50ms) · press feedback scale 0.97 for 120ms (±20ms) · particle lifespan 800ms (±100ms) · target 60fps, degraded tier halves particle count and disables glow/shadow. Reduced motion: all transforms ≤150ms opacity crossfade or instant; particles off; camera cuts; avatar cross-fades. These acceptance targets are the **exact** tokens of §8.10 (the domain now derives them as testable constants).

### 8.10 Motion tokens + easings (exact) — `MOTION`, `EASINGS`, `resolveMotion`

`MOTION` (durations, ms — exact): `instant:0`, `press:120`, `micro:150`, `fast:220`, `reveal:220`, `base:300`, `zoom:300`, `sceneFade:350`, `runSeg:380`, `celebrateLow:400`, `move:600`, `celebrateMed:600`, `equip:200`, `celebrateHigh:800`, `lantern:900`, `glowLoop:1200`, `intro:1200`, `idleBob:1600`, `particleLife:800`.

`EASINGS` (Phaser string / CSS cubic-bézier — exact): `enter:"Cubic.Out"` / `cubic-bezier(0.23,1,0.32,1)`; `move:"Sine.InOut"` / `cubic-bezier(0.77,0,0.175,1)`; `pop:"Back.Out"`; `press:"Quad.Out"`; `loop:"Sine.InOut"`; `intro:"Cubic.InOut"`; `linear:"Linear"`.

`resolveMotion(kind, { reducedMotion })` → `{ kind, mode, durationMs, easing }`. Animated table (exact); under `reducedMotion:true` → `mode:"reduced"`, `easing:"Linear"`, and `durationMs` from the reduced column:

| kind | animated durationMs | animated easing | reduced durationMs | reduced note |
|---|---|---|---|---|
| `press` | 120 | Quad.Out | 120 | kept (non-vestibular) |
| `nodeReveal` | 220 | Back.Out | 0 | instant show |
| `traverse` | 600 | Cubic.Out | 150 | crossfade reposition |
| `run` | 380 | Cubic.Out | 150 | crossfade |
| `regionZoom` | 300 | Cubic.Out | 0 | cut |
| `intro` | 1200 | Cubic.InOut | 0 | cut to avatar |
| `availableGlow` | 1200 | Sine.InOut | 0 | static ring |
| `tierAdvance` | 600 | Cubic.Out | 0 | instant number |
| `equip` | 200 | Cubic.Out | 0 | instant swap |
| `drawerOpen` | 220 | Cubic.Out | 150 | fade |
| `sceneTransition` | 350 | Cubic.Out | 150 | crossfade |
| `baseAccretion` | 300 | Back.Out | 0 | instant place |
| `standingsExpand` | 220 | Cubic.Out | 0 | instant |
| `onboardBeat` | 300 | Cubic.Out | 0 | static |

### 8.11 Palette + typography tokens (exact) — `PALETTE`, `TYPOGRAPHY`

`PALETTE` (exact hex): `seaDeep:#0E2A3B`, `seaMid:#14384C`, `skyDawn:#F4C77B`, `ink:#14202B`, `inkHi:#F5F9FC`, `sun:#F6A23A`, `sunHi:#FFC66B`, `gold:#F2C14E`, `ember:#E8623B`, `locked:#5A6B78`, `notYet:#7FB6D6`, `focus:#FFD166`. Contrast: `inkHi` on `seaDeep` ≈ 13:1 (AAA); `ink` on `skyDawn` ≥ 4.5:1. State color is always paired with an icon/shape (FR-031).

`TYPOGRAPHY` (exact): `fontDisplay:'"Fredoka","Baloo 2",ui-rounded,"Segoe UI Rounded",system-ui,sans-serif'`, `fontBody:'"Nunito",ui-rounded,system-ui,sans-serif'`; scale `display{rem:2.5,lh:1.05,ls:-0.02}`, `h1{1.75,1.10,-0.01}`, `h2{1.25,1.20,0}`, `body{1.0,1.5,0}`, `label{0.8125,1.4,0.01}`; `numeric:"tabular-nums"`.

### 8.12 Biome identity (exact) — `biomes.fixture.ts`, `resolveBiome(region)`

| region | name | signatureHex | terrainHex | ambientHex | landmarks (stable order) |
|---|---|---|---|---|---|
| `numbers-coast` | Numbers Coast | #2EC4B6 | #E9D9A8 | #BFE9E3 | Counting Lighthouse, Abacus Jetty, Tide-Pool Terraces |
| `tinker-bluffs` | Tinker Bluffs | #C77D3A | #8A6B4F | #E7C9A0 | Gear Overlook, Gadget Workshop, Copper Kilns |
| `story-vale` | Story Vale | #3E9B5F | #6E8E5A | #CDE3B8 | Whispering Falls, Book-Root Forest, The Open Page |
| `wordwind-reach` | Wordwind Reach | #5AA9E6 | #C9B27E | #DCE9F5 | Letter Landing Field, Windmill Highlands, The Spelling Spires |

`resolveBiome(region)` returns the row; an unknown region throws (world validation guarantees membership).

### 8.13 Avatar animation (exact) — `resolveAvatarAnimation(intent, { reducedMotion })`

Returns `{ state, loop, durationMs, easing, amplitudePx }`. Under `reducedMotion:true` → `loop:false`, `easing:"Linear"`, `state` suffixed `-static`, `durationMs`/`amplitudePx` from the reduced columns.

| intent | state | loop | durationMs | easing | amplitudePx | reduced dur | reduced amp |
|---|---|---|---|---|---|---|---|
| `idle` | idle | true | 1600 | Sine.InOut | 4 | 0 | 0 |
| `walk` | walk | true | 600 | Cubic.Out | 0 | 150 | 0 |
| `run` | run | true | 380 | Cubic.Out | 0 | 150 | 0 |
| `think` | think | false | 900 | Sine.InOut | 3 | 0 | 0 |
| `celebrate-low` | celebrate | false | 400 | Back.Out | 8 | 150 | 0 |
| `celebrate-med` | celebrate | false | 600 | Back.Out | 12 | 150 | 0 |
| `celebrate-high` | celebrate | false | 800 | Back.Out | 16 | 150 | 0 |

### 8.14 Camera + parallax (exact) — `CAMERA`, `PARALLAX`, `resolveParallaxLayers`

`CAMERA` (exact): `lerpX:0.08`, `lerpY:0.08`, `roundPixels:true`, `zoomBase:1.0`, `zoomRegion:1.25`, `zoomIntroStart:0.6`, `deadzoneW:0.3`, `deadzoneH:0.3`, `lookAheadPx:64`, `punchZoomDelta:0.03`, `punchOutMs:120`, `punchBackMs:180`, `bounds:{x:0,y:0,width:2048,height:2048}`.

`PARALLAX` / `resolveParallaxLayers()` (exact, back→front): `sky:0.0`, `clouds-far:0.15`, `horizon:0.30`, `sea:0.60`, `world:1.0`, `motes:1.05`, `foreground:1.20`. Under reduced motion / degraded tier the ambient layers (`clouds-far`, `sea` shimmer, `motes`) stop moving but still render (depth kept).

### 8.15 Cosmetic visual descriptors (exact) — extends `catalog.fixture.ts`

Each cosmetic gains `look` + `equipEffect` strings (present, stable; **no** price/rarity). Golden `look` values (catalog order): `avatar-hat-explorer`→"soft tan felt explorer's cap"; `avatar-cape-aurora`→"teal-to-plum aurora-gradient cape"; `avatar-badge-firstlight`→"small gold first-light star pin"; `world-theme-dawn`→"rosier dawn sky and softer light"; `world-theme-dusk`→"deep-indigo dusk with brighter lanterns and stars"; `base-banner-unity`→"co-signed cohort unity banner"; `base-lantern-warm`→"warm lantern strings around camp"; `celebration-bloom`→"unlock burst as flower-petal bloom"; `celebration-aurora`→"unlock burst as aurora ribbons with sky shimmer". `equipEffect` per §5.9. Eligibility/ordering are unchanged from §8.4 (a `look` field never affects eligibility — zero power).

### 8.16 Cohort base layout (exact) — `baseLayout.fixture.ts`, `resolveBaseLayout(base)`

Feature → `{ zone, x, y }` (exact): `campfire`→(hearth, 1024, 1024); `banner`→(gateway, 1024, 928); `garden`→(grove, 944, 1088); `dock`→(harbor, 1104, 1120); `workshop`→(yard, 944, 960); `lookout`→(ridge, 1104, 944). `resolveBaseLayout(base)` returns a `BasePlacement[]` (one per `unlockedFeatures`, stable order) each `{ feature, zone, x, y, by }` where `by` is the attributable contributor from `contributions`. An **unknown** feature id gets a deterministic fallback: `zone:"outskirts"`, `x = 1024 + ((i % 4) - 2) * 80`, `y = 1200 + floor(i/4) * 80` (i = index in `unlockedFeatures`) — replayable. For the §8.8 golden base, placements are `campfire`(hearth,1024,1024,kestrel), `banner`(gateway,1024,928,otter), `garden`(grove,944,1088,kestrel).

### 8.17 Asset key registry (exact) — `ASSET_KEYS`

Stable grouped keys (declaration order): `avatar:["av-body","av-lantern","av-hat","av-cape","av-badge"]`; `nodes:["node-locked","node-available","node-unlocked","node-beacon"]`; `regions:["isle-numbers-coast","isle-tinker-bluffs","isle-story-vale","isle-wordwind-reach","water","bridge"]`; `base:["prop-campfire","prop-banner","prop-garden","prop-dock","prop-workshop","prop-lookout"]`; `fx:["fx-mote","fx-petal","fx-ribbon","fx-star"]`; `ui:["ui-lock","ui-star","ui-home","ui-audio","ui-help"]`. Every key MUST have a deterministic procedural fallback (seeded `Graphics.generateTexture`); load order per key = atlas → SVG → procedural (FR-039).

### 8.18 Sound cues (exact) — `SOUND_CUES`, `resolveSoundCue(event)`

`resolveSoundCue(event)` → `{ cueId, caption, mutedByDefault:true }` (exact): `boot`→(`boot-chime`,"[warm chime]"); `traverse`→(`footfall`,"[soft step]"); `nodeAvailable`→(`ready-shimmer`,"[ready shimmer]"); `unlockMedium`→(`bloom-chord`,"[unlock chime]"); `unlockHigh`→(`beacon-arpeggio`,"[beacon lights up]"); `productiveStruggle`→(`encourage-tone`,"[keep-going tone]"); `notYet`→(`soft-tap`,"[soft tap]"); `equip`→(`cloth-whoosh`,"[cloth whoosh]"); `tierAdvance`→(`rising-sweep`,"[tier up]"); `baseAccretion`→(`place-murmur`,"[placed]"). Guardrail: the `notYet` cue MUST be neutral (no cue is flagged negative/alarm), all `mutedByDefault:true`, none looping.

### 8.19 Age-band visual variant (exact) — `resolveVisualBand(band)`

| field | 6-8 | 9-11 | 12-14 |
|---|---|---|---|
| `showCanvasNumbers` | **false** | false | **true** |
| `labelStyle` | "story" | "growth" | "numeric" |
| `markerScale` | 1.25 | 1.1 | 1.0 |
| `touchTargetPx` | 56 | 48 | 44 |
| `celebrationCeiling` | "medium" | "high" | "high" |
| `comparisonVisibleDefault` | false | false | false |

`comparisonVisibleDefault` mirrors `representation.comparisonDefault` (6-8 hard `off`; others opt-in, default off). The underlying `ProgressionState` is identical across bands; only this presentation varies (FR-040, `plainViewEquals`).

---

## §9 · Phasing (P0…P6) — the build path

Each phase is independently valuable and gated. Work the lowest unfinished phase. Detailed tasks in [tasks.md](./tasks.md).

### P0 — Foundation & green-from-iteration-1

**Goal**: package + app skeletons compile; the gate is green immediately.
**Deliverables**: `packages/arena-world` (`package.json`, `tsconfig.json`, `src/index.ts`, `src/model.ts` types incl. the new art/motion/avatar/camera/base/sound/visual-band types, fixtures `graph.fixture.ts` (with `landmark`), `tiers.fixture.ts`, `catalog.fixture.ts` (with `look`/`equipEffect`), `biomes.fixture.ts`, `baseLayout.fixture.ts`, and the constant registries `PALETTE`/`TYPOGRAPHY` (`art.ts`), `MOTION`/`EASINGS` (`motion.ts`), `CAMERA`/`PARALLAX` (`camera.ts`), `ASSET_KEYS` (`assets.ts`), `SOUND_CUES` (`sound.ts`)); `apps/arena` skeleton (`package.json`, `next.config.mjs`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx` placeholder, `app/globals.css` with the §8.11 palette/typography tokens + reduced-motion/reduced-transparency + plain-mode hooks + `:focus-visible` rings, `.env.local.example`, `.gitignore`); a **seeded smoke test** (`test/smoke.test.ts`) that imports the package and asserts the fixture builds.
**Gate**: `pnpm typecheck` + `pnpm test` green.

### P1 — Quest-world map + mastery gate (US1) 🎯 MVP

**Goal**: the graph renders as a traversable animated overworld with the Independence Isles art direction; nodes unlock ONLY via gate + prereqs; deterministic layout; reduced-motion + accessible Ledger convey identical states.
**Domain**: `buildQuestWorld` (+landmarks), `layoutQuestWorld`, `deriveNodeStates`, `resolveBiome`, `resolveMotion`, `resolveAvatarAnimation`, `resolveParallaxLayers`, initial `buildArenaView` (map + states + layout + `presentation` block: biomes, camera, parallax, avatar anim, asset keys). **App**: `BootScene`/`PreloadScene` (atlas→SVG→procedural loader) / `WorldScene` render parallax biomes + node markers per state (color-independent) + lit edge paths/bridges + the pseudonymous lantern-avatar with idle/walk/run states + follow-camera with deadzone/look-ahead + establishing dolly-in + unlock reveal; reduced-motion path; the accessible Ledger tree (landmark names); synthetic mastery-signal feed driving it.
**Gate**: P0 gate + `next build` + smoke (zero console/WebGL errors) + walkthrough steps 1–2, 5.

### P2 — Tiers + deterministic cosmetics + avatar (US2)

**Domain**: `computeProgression`, `tierForReward`, `deriveCosmeticEligibility` (+`look`/`equipEffect`), `equipCosmetic`; extend `buildArenaView`. **App**: tier/growth panel (tabular ticker) + cosmetic drawer (equip eligible only; locked shows the **earn goal**, never a price/roll) + avatar cosmetic swap on canvas (`Crossfade + Blur`), world/base theme cosmetics recolor.
**Gate**: P1 gate + walkthrough steps 3–4.

### P3 — Juice + errors-never-loss (US3)

**Domain**: `classifyCelebration`, `celebrationMotionSpec`, `resolveSoundCue`. **App**: `FxScene` orchestrated celebration sequences (§5.7: Burst+Bloom+Camera-punch on high; Warm-Pulse on struggle) driven by `celebrationMotionSpec`+`resolveMotion`; the calm `--notyet` wisp on error (no loss visual/shake, node unchanged); muted-by-default captioned sound cues; first-run onboarding coach-marks (`FR-038`); reduced-motion equivalents throughout.
**Gate**: P2 gate + walkthrough step 6.

### P4 — Persistent cohort base (US4)

**Domain**: `applyCohortContribution` + `unlockedFeatures` + `resolveBaseLayout`. **App**: `BaseScene` renders the co-built Base Camp into deterministic zones/slots (§8.16) with attributable pseudonymous lantern-marks; `Pop-in place` accretion; the "home" landing when standings are off.
**Gate**: P3 gate + walkthrough step 5 (base).

### P5 — Age-band staging + plain mode + near-peer standings (US5)

**Domain**: `resolveRewardRepresentation`, `resolveVisualBand`, `deriveStanding`, `plainViewEquals` (state-identical across bands/plain/reduced). **App**: age-band switch (re-renders canvas presentation: 6-8 no canvas numbers / story labels / larger markers / medium celebration ceiling) + plain-mode toggle + opt-in standings panel (default off; own-gain-vs-band-top, never a rank).
**Gate**: P4 gate + walkthrough steps 7–8.

### P6 — Polish, accessibility & performance acceptance

**Goal**: WCAG 2.2 AA pass (keyboard/switch/screen-reader over the Ledger, color-independent cues, contrast), reduced-motion parity, 60fps + graceful degradation, mastery action never blocked; README + demo; the final root-tsconfig reference (T-ROOT, human-reconciled).
**Gate**: all SCs map green; full quickstart validation.

---

## §10 · Success Criteria *(mandatory)* — each mapped to a test

Domain SCs are Vitest tests in `packages/arena-world/test/`; UI SCs are verified via `next build` + the smoke + the quickstart walkthrough (frame-rate is an acceptance target, not a unit test).

- **SC-001** — No node is `unlocked` unless its gate is cleared **and** all prerequisites mastered; grinding/time never unlocks. → `test/nodes.test.ts` (scenario S1 golden, §8.2), incl. gate-before-prereq + determinism + no time/visit input.
- **SC-002** — Cosmetic eligibility is fully deterministic (identical inputs → identical set) and **no** purchase path exists. → `test/cosmetics.test.ts` (S1 golden §8.4) + `test/guardrails.test.ts` (no `Math.random`, no `price|currency|dropRate|rarity` field in package source).
- **SC-003** — No cosmetic/tier/base changes mastery/node-unlock/matchmaking/standing/access (byte-identical across states). → `test/zero-power.test.ts` (outcome-invariance) + `test/base.test.ts`.
- **SC-004** — Every animated affordance has a reduced-motion equivalent; under reduced motion full progression/state/celebration remain conveyable and no function is lost. → `test/motion.test.ts` (`celebrationMotionSpec` §8.5) + `test/view.test.ts` (`plainViewEquals`) + walkthrough step 7.
- **SC-005** — The same reward event renders in the correct age-band vocabulary; a 6-8 learner never sees the raw mastery-delta headline; comparison off. → `test/staging.test.ts` (§8.6).
- **SC-006** — Plain mode / standings off leaves learning, access, and standing unchanged vs. full-spectacle. → `test/plain-mode.test.ts` (invariance).
- **SC-007** — An incorrect attempt / help request produces no loss event and removes nothing earned. → `test/celebrate.test.ts` (§8.5, `null` + nothing removed).
- **SC-008** — The whole surface runs end-to-end for synthetic learners with no consent/admissions/legal workflow. → `test/synthetic.test.ts` + quickstart.
- **SC-009** — Any opted-in standing is near-peer/anonymized/gain-based and never shows a bottom-rank; no caste rank representable. → `test/standings.test.ts` (§8.7; type has no rank field).
- **SC-010** — The client meets its frame/asset budget on the minimum device and degrades gracefully; the game surface never blocks/delays a mastery action. → `next build` + acceptance walkthrough §"Accessibility & performance".
- **SC-011** — The Phaser game loads **client-only** with **zero console/WebGL errors** and destroys cleanly on unmount. → seeded smoke (§11) asserting a clean console + a mounted `<canvas>`.
- **SC-012** — The accessible DOM Ledger conveys every state to keyboard/switch/screen-reader; canvas is `aria-hidden`; all interactive controls are keyboard-operable with visible focus and ≥4.5:1 contrast. → walkthrough a11y pass + `test/view.test.ts` (Ledger view model completeness) .
- **SC-013** — Layout is deterministic and matches the golden positions (§8.1). → `test/layout.test.ts`.
- **SC-014** — `buildArenaView` composes one view that drives every renderer; reduced-motion/plain does not recompute state (parity by construction). → `test/view.test.ts` (`plainViewEquals`, same underlying state).
- **SC-015** — Every interaction-motion value derives from the deterministic token registry and each has a reduced-motion equivalent (§8.10). → `test/motion-tokens.test.ts` (`MOTION`/`EASINGS`/`resolveMotion` golden table + reduced-motion mode).
- **SC-016** — Avatar animation states resolve deterministically with reduced-motion equivalents; never `scale(0)`; interruptible-by-construction (state carries no absolute start). → `test/avatar.test.ts` (§8.13 golden).
- **SC-017** — Biome identity + palette/typography tokens are exact and stable; state color is paired with icon/shape (not color-only). → `test/art.test.ts` (§8.11/§8.12 golden; `resolveBiome`).
- **SC-018** — Camera + parallax config are exact; every camera motion has a reduced/instant equivalent; depth retained under reduced motion. → `test/camera.test.ts` (§8.14 golden).
- **SC-019** — Cohort-base features place into deterministic zones/slots, attributable and replayable; unknown-feature fallback is deterministic; zero power. → `test/base-layout.test.ts` (§8.16 golden).
- **SC-020** — Canvas presentation resolves per age band; 6-8 `showCanvasNumbers=false` + medium celebration ceiling; underlying state identical across bands. → `test/visual-band.test.ts` (§8.19 golden) + `test/view.test.ts`.
- **SC-021** — Sound-cue selection is deterministic, muted-by-default, non-looping; the error/"not-yet" cue is neutral (no alarm/negative cue exists). → `test/sound.test.ts` (§8.18 golden).
- **SC-022** — Every cosmetic carries a stable `look`/`equipEffect` descriptor and the type still exposes no `price`/`currency`/`dropRate`/`rarity`; `look` never affects eligibility (zero power). → `test/cosmetics.test.ts` (§8.15) + `test/guardrails.test.ts`.
- **SC-023** — `ASSET_KEYS` is stable and every key has a deterministic procedural fallback (seeded, no `Math.random`); loader order atlas→SVG→procedural; no external fetch. → `test/assets.test.ts` (§8.17) + app smoke (no network) .

---

## §11 · Stack, commands, env & seeded smoke (pinned)

### Stack

- **Package manager**: pnpm `9.15.9` (workspace; lockfile auto-detected by the harness).
- **Language**: TypeScript `5.6.3`, strict (`tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), Node LTS.
- **Domain**: pure TS, dep `@gt100k/learning-loop` (`workspace:*`) only.
- **App**: Next.js `^14.2.15` App Router + React `^18.3.1` (match `apps/student-compass`), **Phaser `^4.2.1`** (latest stable 4.x; rebuilt WebGL renderer; TS types bundled; use Phaser-4 APIs only — §2 D1), `transpilePackages` for the two workspace packages, Phaser mounted client-only (`ssr:false`).
- **Test**: Vitest (root `vitest.config.ts` already globs `packages/**/test/**/*.test.ts` — no root edit).

### Commands

```bash
pnpm install                                   # bootstrap workspace
pnpm typecheck                                 # tsc -b (green after T-ROOT applies the package reference)
pnpm test                                      # Vitest across workspace (domain)
pnpm --filter @gt100k/arena-world test         # domain tests only
pnpm lint                                       # biome check packages adapters apps (covers new dirs)
pnpm --filter @gt100k/arena-world-app dev      # run the Phaser experience
pnpm --filter @gt100k/arena-world-app build    # next build — app acceptance/perf gate
```

> Loop gate = `pnpm typecheck` + `pnpm test`. App phases additionally require `pnpm --filter @gt100k/arena-world-app build` + the smoke + walkthrough. The root `build` script (student-compass) is **not** modified; the arena app is built via its filter.

### Env / secrets

The app needs **no secrets**. Commit `apps/arena/.env.local.example` with non-secret public placeholders and ensure `.env.local` is git-ignored; the app reads only `NEXT_PUBLIC_*` with safe defaults so `build` never fails on missing env.

```dotenv
# apps/arena/.env.local.example
NEXT_PUBLIC_ARENA_SEED=42
NEXT_PUBLIC_REDUCED_MOTION_DEFAULT=system   # system | on | off
NEXT_PUBLIC_DEFAULT_AGE_BAND=9-11           # 6-8 | 9-11 | 12-14
```

### Seeded smoke (green from iteration 1)

- **Domain smoke** (`packages/arena-world/test/smoke.test.ts`, part of P0): imports the package, builds the fixture world, asserts 9 nodes + 4 regions + a non-empty layout — so `pnpm test` is green from the first increment.
- **App smoke** (P1+, run in the review pipeline's Playwright pass): loads `/`, waits for a `<canvas>` to mount, and asserts **zero console errors and zero WebGL errors** (SC-011); then toggles reduced-motion and confirms the accessible Ledger is present and focusable (SC-012).

---

## §12 · Accessibility & reduced-motion equivalence (detail)

- **Reduced motion** (`prefers-reduced-motion: reduce`, honored by default; overridable to `on`/`off`): tweens → instant or ≤150ms opacity crossfade; particles off (static badge conveys the unlock); camera cuts; avatar cross-fades; glow pulses off. State/progression/celebration remain fully conveyed (FR-015, SC-004).
- **Accessible Ledger** (parallel DOM from the same `ArenaView`, D5/FR-016, SC-012): quest graph as a `role="tree"` (each node a `treeitem` whose accessible name includes title + state "locked/available/unlocked" + region); tier/reward as text (band-appropriate); cosmetics as a labeled listbox (eligible/locked, equip via keyboard); base as a list of features + contributors; celebrations announced via `aria-live="polite"`. Full keyboard/switch operation, visible focus rings, color-independent cues (icon/text, not color alone), ≥4.5:1 contrast. Canvas `aria-hidden="true"`.
- **Plain mode**: a low-spectacle rendering (calm palette, no particles, minimal motion) that is state-identical to full-spectacle (`plainViewEquals`, SC-006). Distinct from but compatible with reduced motion.
- **Free opt-out**: plain mode / standings-off never change learning, access, or standing (FR-020, SC-006).

---

## §13 · Pre-marked decision points (defaults + severity)

The loop proceeds on the **default**; it escalates only per §3.

- **DP-1 — Canvas accessibility approach. ✅ RESOLVED (settled decision).** **Chosen: a synchronized parallel accessible DOM ("Arena Ledger")** adjacent to the canvas, built from the **same `ArenaView`** (one shared view-model drives both the Phaser canvas and the Ledger), with the canvas `aria-hidden="true"` (D5). Rejected alternatives: (b) a separate `/accessible` route rendering the Ledger full-page (splits the surface, drifts out of sync); (c) Phaser DOM Elements + a canvas a11y plugin (e.g. rex plugins) (brittle, non-standard). This is now a settled decision — the loop **does not re-open it**. The reduced-motion first-class **equal** mode and WCAG 2.2 AA requirements (and their acceptance criteria SC-004/SC-012) are unchanged. *(The remaining human-only gate is the child-facing "human review before merge" of FR-026 / §25 — not this engineering choice.)*
- **DP-2 — Engine major version. ✅ Settled: Phaser 4 `^4.2.1`.** The engine is **Phaser 4** (latest stable 4.x), chosen for best performance/visuals: its rebuilt WebGL renderer and GPU context-loss/restore handling directly serve the 60fps + graceful-degradation criterion (SC-010) and the WebGL-context-loss edge case. Use **Phaser-4 APIs only** (particles/tweens/scenes/camera/input per §2 D1). Pixi.js remains acceptable only with a documented reason. **Severity: low** (settled; no bump expected).
- **DP-3 — Seed art fidelity.** Default **tiny committed SVGs + procedural fallback** (D6). Upgrading to a richer sprite atlas later is non-breaking. **Severity: low.**
- **DP-4 — Cohort-base feature vocabulary.** Default the fixture set (`campfire`, `banner`, `garden`, …) mapped deterministically from `missionId`. **Severity: low.**
- **DP-5 — Standings peer-band construction (synthetic).** Default: near-peers are a fixed synthetic set; `gainToBandTop` = `max(gain) − selfGain`. Real pace-band matchmaking is out of scope. **Severity: low.**
- **DP-6 — Art direction & fonts (no-fetch constraint).** Default: the **Independence Isles** identity of §5.1/§8.11 — deep-sea canvas, golden-hour warmth, claymorphic-adjacent illustration, per-biome hues — with typography served by a **system-rounded fallback stack** (no external fetch, no committed binary). Self-hosted subset `woff2` (`Fredoka`/`Nunito`) under `public/fonts/` and a packed texture atlas under `public/atlas/` are **optional, non-breaking** upgrades keyed identically to the seed SVGs. The deliberate rejection of a cream/sand body bg (the 2026 AI default) is intentional (impeccable). **Severity: low.**
- **DP-7 — Sound assets.** Default this slice: **no audio asset pipeline** — `resolveSoundCue` returns deterministic cue ids + captions only, muted by default; a real (committed, non-fetched) sample set is a later non-breaking addition. The error cue MUST stay neutral. **Severity: low.**

---

## §14 · Assumptions

- **Builds on feature 001.** `@gt100k/learning-loop` is available and unchanged; this feature reuses `Section`/`SECTIONS`, XP, the mastery-gate concept (`evaluateGate`), and the beyond-floor signal, and adds the game layer on top.
- **Mastery/reward signals are synthetic and injected** as `NodeMasterySignal` (from a stub/simulator); this feature owns the *game representation of* mastery/reward, not the mastery engine or the tutor. A real source can replace the stub with zero domain change.
- **Synthetic-only, governance stubbed.** No real learners/consent/admissions/legal; safeguarding routing (FR-025) is a fail-closed hook, not a live pipeline.
- **Age-band defaults are [E3] operating defaults**, not research-validated optima (§14.7/§14.13); raising competitive exposure would need fresh child assent + dose caps (out of scope for the synthetic slice).
- **Child-facing surface.** The constitution requires a **named human-review gate before child exposure** (§25). The autonomous build loop is **PR-only** — a human reviews and approves before merge. Evidence posture **[E3]/[R]**: engagement/belonging lift is measured against belonging and voluntary return (§2.6), never assumed to improve learning; a mechanic that raises time-in-app while depressing belonging/voluntary return **auto-reverts** (the §15 rollback gate).
- **Performance budget is an acceptance target.** 60fps (min device) is validated by `next build` + the acceptance walkthrough, not a domain unit test (the pure domain carries no rendering).
- **New dirs only.** All code lives in `packages/arena-world` + `apps/arena`; shared root files and `apps/student-compass` are untouched except the single final, human-reconciled root-tsconfig reference task (T-ROOT).
