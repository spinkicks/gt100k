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

## §5 · The game design (what the Arena *is*)

This section is the game-design doc. It defines the experience the app must deliver; §8 pins the exact numeric values.

### 5.1 World — "Independence Isles"

A 2×2 archipelago overworld, **2048×2048** world units. Four **region islands**, one per learning-loop `Section`:

| Region id | Section | Theme | Region origin (x,y) |
|---|---|---|---|
| `numbers-coast` | math | shorelines, tide pools | (0, 0) |
| `tinker-bluffs` | science | workshop cliffs, gadgets | (1024, 0) |
| `story-vale` | reading | book-forest valley | (0, 1024) |
| `wordwind-reach` | language | windmill highlands | (1024, 1024) |

A central **Base Camp** island (the cohort base, §5.5) sits over the shared seam and is reachable from any region. Nodes are quest markers; edges (derived from prerequisites) are lit paths between them. Cross-section edges (e.g. `measure-mesa` needs `add-atoll`) draw as bridges between islands.

### 5.2 Scenes (Phaser)

| Scene | Role |
|---|---|
| `BootScene` | Create the game, read config/flags (reduced-motion, plain, band, seed), register the deterministic procedural texture generator. |
| `PreloadScene` | Load committed seed SVGs from `/seed/`; on any miss, generate the procedural fallback texture. Never fetches externally. |
| `WorldScene` | The overworld: region tilesets, node markers (locked/available/unlocked visuals), edge paths, avatar sprite, follow-camera. Owns traversal + unlock reveals. |
| `BaseScene` | The cohort Base Camp: renders `unlockedFeatures` as placed props; attributable on focus. |
| `FxScene` | Celebration overlay: particle bursts, node bloom, path light-up. Reads the `celebrationMotionSpec`; a no-op (or single static frame) under reduced motion. |

React owns the surrounding HUD + the accessible Ledger (DOM), not the canvas. A tiny event bus bridges React → Phaser (set band / toggle plain / equip cosmetic / advance the synthetic feed) and Phaser → React (node focused / unlock celebrated) so the DOM Ledger and the canvas stay in sync from the one `ArenaView`.

### 5.3 Avatar + movement

- A **pseudonymous** avatar sprite (expressive-only; no name/likeness/biometric; encodes no ability signal).
- **Idle**: subtle 2-frame bob (disabled under reduced motion).
- **Traverse**: when the learner selects a reachable node, the avatar **tweens along the edge path** to it (`Cubic.Out`, per-segment duration in §8), camera follows. Movement is **interruptible** — selecting another node re-targets from the avatar's current position (no hard jump).
- **Cosmetics**: equipped `avatar-item` cosmetics swap/overlay sprite frames only.
- **Reduced motion**: traversal becomes a ≤150ms cross-fade reposition; idle bob off.

### 5.4 Camera & juice

- **Follow-camera** with lerp `0.08` on both axes; world-bounded. On region focus, zoom `1.0 → 1.25` over 300ms `Cubic.Out`.
- **Node reveal (unlock)**: marker scales `0.95 → 1.0` + alpha `0 → 1` over 220ms with a subtle `Back.Out` overshoot (peak ~1.05); the path to the next node lights up; a particle burst fires (count/lifespan per `celebrationMotionSpec`); a gentle one-shot camera "punch" on `high` intensity only. **Never** scale from 0.
- **Available highlight**: a low-amplitude glow pulse (1200ms loop); **off** under reduced motion / degraded tier.
- **Press feedback**: any pressable marker/button scales to `0.97` for 120ms `ease-out`.
- **Error moment**: a warm, brief "not yet" wisp near the node — **no** loss visual, **no** removal, node unchanged; copy is process-praise.
- **Degraded tier** (low-end / Safari / iPadOS / WebGL pressure): particle counts halved, glow off, drop-shadows off, still 60fps; the accessible Ledger + reduced-motion path are unaffected.

### 5.5 Cohort base scene

The Base Camp renders the cohort's `unlockedFeatures` (campfire, banner, garden, …) as placed props in a stable order; focusing a prop shows its attributable contributor (pseudonymous) and mission. It is the "home" surface — the default landing when standings/competition are off. Zero power.

### 5.6 Motion principles (applied)

- Celebration is a **rare** event → delight is warranted there; traversal is **occasional** → standard eased motion; HUD toggles are **frequent** → minimal/instant. (Frequency-appropriate motion.)
- Enter/exit use **`Cubic.Out`** (responsive); on-screen moves use ease-in-out; never `ease-in` on entrances.
- **Every** animation has a reduced-motion equivalent (§8); reduced motion is not "less game" — it is the same state, conveyed calmly.
- Only transform/alpha/particles animate; no layout thrash. Target 60fps with graceful degradation.

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

### Key Entities

Full shapes in [data-model.md](./data-model.md). Summary: `AgeBand`, `CompetencyNode`, `QuestWorld`, `NodePosition`/`WorldLayout`, `NodeMasterySignal` *(synthetic input)*, `NodeState` *(derived)*, `ProgressionState` *(derived)*, `Tier`, `Cosmetic` *(no price/rarity field)*, `CosmeticEligibility` *(derived)*, `AvatarState`, `CohortBase`, `CooperativeMissionResult` *(input)*, `CelebrationEvent`, `MotionSpec` *(derived)*, `RewardRepresentation` *(derived, age-band)*, `NearPeerStanding` *(derived, opt-in; no rank field)*, and the composed **`ArenaView`** that drives every renderer.

---

## §7 · Golden fixtures (the canonical synthetic world)

The domain ships a fixed fixture (`graph.fixture.ts`, `catalog.fixture.ts`, `tiers.fixture.ts`) so golden values are exact and stable.

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

A region is **complete** ⇔ every node with that `region` is `unlocked`.

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

Avatar path segment 600ms `Cubic.Out` (±50ms) · node reveal 220ms `Back.Out` peak ~1.05 (±30ms) · available glow pulse 1200ms loop (±100ms; off in reduced/degraded) · camera lerp 0.08 (±0.02) · region zoom 1.0→1.25 over 300ms (±50ms) · press feedback scale 0.97 for 120ms (±20ms) · particle lifespan 800ms (±100ms) · target 60fps, degraded tier halves particle count and disables glow/shadow. Reduced motion: all transforms ≤150ms opacity crossfade or instant; particles off; camera cuts; avatar cross-fades.

---

## §9 · Phasing (P0…P6) — the build path

Each phase is independently valuable and gated. Work the lowest unfinished phase. Detailed tasks in [tasks.md](./tasks.md).

### P0 — Foundation & green-from-iteration-1

**Goal**: package + app skeletons compile; the gate is green immediately.
**Deliverables**: `packages/arena-world` (`package.json`, `tsconfig.json`, `src/index.ts`, `src/model.ts` types, `graph.fixture.ts`, `tiers.fixture.ts`, `catalog.fixture.ts`); `apps/arena` skeleton (`package.json`, `next.config.mjs`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx` placeholder, `app/globals.css` with reduced-motion + plain-mode hooks, `.env.local.example`, `.gitignore`); a **seeded smoke test** (`test/smoke.test.ts`) that imports the package and asserts the fixture builds.
**Gate**: `pnpm typecheck` + `pnpm test` green.

### P1 — Quest-world map + mastery gate (US1) 🎯 MVP

**Goal**: the graph renders as a traversable animated overworld; nodes unlock ONLY via gate + prereqs; deterministic layout; reduced-motion + accessible Ledger convey identical states.
**Domain**: `buildQuestWorld`, `layoutQuestWorld`, `deriveNodeStates`, initial `buildArenaView` (map + states + layout). **App**: `BootScene`/`PreloadScene`/`WorldScene` render nodes/edges/regions + tweened avatar + follow-camera; reduced-motion path; the accessible Ledger tree; synthetic mastery-signal feed driving it.
**Gate**: P0 gate + `next build` + smoke (zero console/WebGL errors) + walkthrough steps 1–2, 5.

### P2 — Tiers + deterministic cosmetics + avatar (US2)

**Domain**: `computeProgression`, `tierForReward`, `deriveCosmeticEligibility`, `equipCosmetic`; extend `buildArenaView`. **App**: tier/growth panel + cosmetic drawer (equip eligible only; **no** purchase/roll UI) + avatar cosmetic swap on canvas.
**Gate**: P1 gate + walkthrough steps 3–4.

### P3 — Juice + errors-never-loss (US3)

**Domain**: `classifyCelebration`, `celebrationMotionSpec`. **App**: `FxScene` particle bursts / node bloom on unlock/struggle; warm process-praise "not yet" on error (no loss visual); reduced-motion equivalents.
**Gate**: P2 gate + walkthrough step 6.

### P4 — Persistent cohort base (US4)

**Domain**: `applyCohortContribution` + `unlockedFeatures`. **App**: `BaseScene` renders co-built features with attributable contributions.
**Gate**: P3 gate + walkthrough step 5 (base).

### P5 — Age-band staging + plain mode + near-peer standings (US5)

**Domain**: `resolveRewardRepresentation`, `deriveStanding`, `plainViewEquals`. **App**: age-band switch + plain-mode toggle + opt-in standings panel (default off; 6-8 concrete/comparison-off).
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

---

## §14 · Assumptions

- **Builds on feature 001.** `@gt100k/learning-loop` is available and unchanged; this feature reuses `Section`/`SECTIONS`, XP, the mastery-gate concept (`evaluateGate`), and the beyond-floor signal, and adds the game layer on top.
- **Mastery/reward signals are synthetic and injected** as `NodeMasterySignal` (from a stub/simulator); this feature owns the *game representation of* mastery/reward, not the mastery engine or the tutor. A real source can replace the stub with zero domain change.
- **Synthetic-only, governance stubbed.** No real learners/consent/admissions/legal; safeguarding routing (FR-025) is a fail-closed hook, not a live pipeline.
- **Age-band defaults are [E3] operating defaults**, not research-validated optima (§14.7/§14.13); raising competitive exposure would need fresh child assent + dose caps (out of scope for the synthetic slice).
- **Child-facing surface.** The constitution requires a **named human-review gate before child exposure** (§25). The autonomous build loop is **PR-only** — a human reviews and approves before merge. Evidence posture **[E3]/[R]**: engagement/belonging lift is measured against belonging and voluntary return (§2.6), never assumed to improve learning; a mechanic that raises time-in-app while depressing belonging/voluntary return **auto-reverts** (the §15 rollback gate).
- **Performance budget is an acceptance target.** 60fps (min device) is validated by `next build` + the acceptance walkthrough, not a domain unit test (the pure domain carries no rendering).
- **New dirs only.** All code lives in `packages/arena-world` + `apps/arena`; shared root files and `apps/student-compass` are untouched except the single final, human-reconciled root-tsconfig reference task (T-ROOT).
