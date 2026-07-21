# Feature Specification: Arena Progression World (RPG Game-Experience Layer)

**Feature Branch**: `004-arena-game-world`

**Created**: 2026-07-20

**Status**: Loop-ready (expanded — 3D renderer)

**Input**: User description: "The Arena progression world (PRD §15.3 / §15.3.1): the social and competitive/afternoon surface delivered as a production-quality, RPG-style game world rather than a dashboard. A pseudonymous avatar traverses the competency graph rendered as an animated quest-world map; nodes unlock ONLY through the 90% independent-mastery gate (§12); gain-based tiers advance on the independence reward (§13); competence-earned, deterministic cosmetics (no loot, no purchase, zero power); a persistent co-built cohort base; and celebratory 'juice' on independent unlocks and productive struggle, with errors never rendered as loss (§14.12). Reduced-motion is a first-class equal mode, representation is staged by age band (§14.13), and standings stay near-peer/anonymized/opt-in with no caste ranks (§15). Builds on the daily-learning-loop (feature 001); synthetic learners only; no consent/legal machinery."

---

## §0 · How to read this spec (for the build loop)

This is the **single loop source-of-truth** for the feature. It is large on purpose; read **only the section for the current phase** each turn (JIT), then the referenced golden values.

- Build path is **§9 Phasing (P0…P7)** — always work the lowest unfinished phase.
- Every phase gate is **`pnpm typecheck` (`tsc -b`) + `pnpm test` (Vitest, domain) green**; the app phases add **`pnpm --filter @gt100k/arena-world-app build`** + the **§11 seeded smoke** and the **quickstart acceptance walkthrough**.
- Machine-checkable acceptance lives in **§10 Success Criteria** (each mapped to a named test) and **§8 Golden values**.
- Choices already settled are in **§2 Decisions already made** — do not re-open them. **The renderer is 3D (react-three-fiber + three.js + drei); Phaser has been dropped** — see D1 for the full rationale.
- Anything not specified: follow **§3 Defaults for the unspecified** (log it, continue).
- The companion docs — [plan.md](./plan.md), [tasks.md](./tasks.md), [data-model.md](./data-model.md), [contracts/arena-world.md](./contracts/arena-world.md), [research.md](./research.md), [quickstart.md](./quickstart.md) — are kept consistent with this file; **where they disagree, this file wins.**

---

## §1 · Scope fence (in / out / non-goals)

### In scope

1. A **pure, deterministic domain package `@gt100k/arena-world`** (`packages/arena-world`) holding every rule: quest-world build + deterministic layout (2D grid **and** its derived **3D world transform**); node lock/unlock from the §12 gate + prerequisites; gain-based tier/progression from the §13 independence reward; deterministic zero-power cosmetic eligibility + equip; persistent co-built cohort-base accretion; celebration classification + motion-spec derivation; age-band representation; near-peer/anonymized/opt-in/no-bottom-rank standings; **the deterministic 3D presentation model** (elevation, lighting rig, camera rig, water, post-fx, quality tier, damping constants); and a single composed **ArenaView** view model that drives every renderer.
2. A **new Next.js App-Router app `@gt100k/arena-world-app`** (`apps/arena`) rendering a **real 3D game** on **react-three-fiber + three.js + drei** (WebGL2, declarative React scene graph): a stylized **low-poly / storybook-3D archipelago** of floating islands under perpetual golden-hour light with **soft shadows** and **dynamic beacon-lighting**; a charming pseudonymous **low-poly lantern avatar** traversed with an **interruptible damped follow/orbit camera**; **parallax depth**, **water shimmer**, **3D particle celebrations**, and a co-built cohort **Base Camp** island; an equippable cosmetic drawer; and an age-band/plain-mode/standings HUD.
3. A **first-class, equal reduced-motion / plain rendering** of the identical ArenaView (a **static-3D "calm" tier** that keeps depth but strips all motion), and an **accessible DOM/ARIA parallel structure** (the "Arena Ledger") that conveys the same state and progression to keyboard / switch / screen-reader users (WCAG 2.2 AA). The 3D `<canvas>` is `aria-hidden`.
4. A **graceful-degradation quality ladder** (Tier A full-3D → B reduced-3D → C static-3D/calm → D **2D/static DOM fallback** on weak GPU / low power / no-WebGL / unrecoverable context loss) that holds a **strict 60fps budget on the minimum managed device** (managed laptops = full tier; iPad/Safari = reduced tier) and never blocks a mastery action.
5. A **seed asset kit in-repo**: **procedural low-poly geometry authored in code** (deterministic, text-diffable, no external fetch) for every world object, plus small hand-authored **SVGs** for HUD/Ledger icons and the 2D fallback. A deterministic procedural material/texture fallback so the game renders even if an optional asset is missing.
6. A **synthetic mastery-signal feed** (stub/simulator) that supplies the §12/§13 signals as `NodeMasterySignal` records.

### Out of scope (explicit)

- The **mastery engine**, the §12 90%-independent-mastery computation, the §13 reward computation, and the answer-blind tutor (§13) — these are **injected as inputs**, not computed here.
- **Live multiplayer / WebRTC / real-time RivalryMix netcode** (§26.2/§26.3), presence servers, matchmaking service. The cohort base and standings are computed from **synthetic** injected state; no network transport.
- Real competency-graph authoring, real content, real project ladders (§16). A small hand-authored **fixture graph** stands in.
- Any **consent / admissions / legal / governance** workflow, real learner data, or persistence to a database. In-memory only.
- Sound design beyond a **muted-by-default, captioned** optional cue; no audio asset pipeline.
- **Photoreal 3D, PBR asset marketplaces, external glTF/CDN fetches, physics engines (rapier/cannon), or a networked scene** — the world is stylized, procedurally-authored, offline, and physics-free (traversal is deterministic tweened motion, not simulation).

### Non-goals (will not build, by principle)

- **No** purchase / currency / financial path of any kind (G1).
- **No** gacha / loot-box / variable-ratio / timed-drop / "reroll" mechanic (§14.12/§15.3).
- **No** fixed-ability caste ranks, public tier ladders, full-field rankings, or a "last of N" bottom-rank surface (§15, G6).
- **No** loss-framed streaks, decaying/absence meters, manufactured scarcity, FOMO, or engagement-timed notifications (§14.12).
- **No** cosmetic or tier that touches mastery, node-unlock, matchmaking, standing, or access (zero power).
- **No** motion-only affordance and **no** degraded accessibility fallback — reduced-motion and the accessible view are **equal** modes.
- **No** modification of `packages/learning-loop`, `apps/student-compass`, or shared root config, except the single final root-`tsconfig` reference (T-ROOT).

---

## §2 · Decisions already made (do not re-open)

### D1 — Rendering engine: **3D via react-three-fiber + three.js + drei (WebGL2)** — Phaser dropped

The Arena is a **real 3D game** rendered with **react-three-fiber (r3f)** over **three.js**, with **@react-three/drei** helpers and **@react-three/postprocessing** for bloom/vignette. **Phaser is dropped.** This was an open evaluation (2D-elevated-Phaser vs. 3D); 3D wins decisively and meets every hard requirement. Pinned versions and API discipline are in §11.

**Why 3D wins (the rationale, recorded per the loop-ready checklist):**

1. **The core metaphor *is* a lighting feature.** Design pillar 2 is "mastery is the only currency of light" (§5): locked places are dim/cool, clearing a node's 90% gate *lights a beacon* and warms the path. In 2D this is a glow sprite; **in 3D it is a real dynamic point light** that casts warmth and soft shadows across the world when a gate clears. The mechanic (§12) becomes literally the renderer's lighting engine — the single most load-bearing reason to go 3D. Nothing else elevates the "you can *see* the mastery you earned" idea as far.
2. **Floating storybook islands, real depth, cinematic camera.** A stylized low-poly archipelago of islands floating over a sea void, a **damped interruptible follow/orbit camera**, an establishing dolly-in over the whole world, parallax by *actual* perspective, water shimmer with real sun-glint, and 3D particle celebrations are categorically more impressive than a 2.5D plane — this is the "jaw-dropping flagship" ask.
3. **r3f fits the app better than Phaser.** Phaser is an imperative engine bolted into `useEffect`; r3f is a **declarative React scene graph** that consumes the `ArenaView` view-model the same way the HUD and Ledger do — one React tree, one state source, fewer bridge seams. Interruptible motion is idiomatic (`drei` `easing.damp3` animates *from the presentation value* every frame — exactly Apple's fluidity principle).
4. **The domain is renderer-agnostic.** `packages/arena-world` computes an `ArenaView` of golden values (layout, states, motion tokens, camera/lighting config). Switching the renderer changes the **app layer only**; every domain golden value and guardrail is preserved and *extended* with additive 3D constants (elevation, lighting, camera rig, LOD tiers). The pure, unit-tested core is untouched in spirit.

**Why 3D still meets the non-negotiable bar (the honest counter-analysis):**

- **Performance / 60fps on min device.** 3D is heavier, but the **quality ladder (§8.24)** is a first-class, deterministic, testable requirement — Tier A (managed laptop) → B (iPad/Safari) → C (calm/static-3D) → D (2D/static DOM). Concurrent dynamic lights are **capped** per tier (§8.22), DPR is capped, shadows/water/post-fx drop by tier, geometry is **instanced low-poly**, and a rolling frame monitor **auto-degrades** a tier when it misses budget (§8.24 `nextLowerTier`). A 2D/static fallback and a no-WebGL fallback were **already required** as a degradation ladder — 3D just makes the top of that ladder taller.
- **Accessibility is identical.** The `<canvas>` is `aria-hidden` in *any* renderer; the **Arena Ledger** DOM twin is the AT source of truth (D5). 3D changes nothing about keyboard/switch/screen-reader operation.
- **Reduced motion is a full equal mode.** Tier C ("calm") **keeps the 3D depth** (islands, elevation, materials, baked golden-hour light) but strips *all* motion: static camera at its rest pose, no ambient drift/water/particles, celebrations become the same static lit-beacon + `aria-live` announce as the 2D plan. Reduced motion is *the same world, held still* — not a downgrade.
- **No-fetch / public-repo-safe assets.** All world geometry is **procedurally authored in TypeScript** (low-poly primitives, extrusions, deterministic) — text-diffable, tiny, no binary bloat, no CDN. Optional committed Draco-compressed glTF and a texture atlas are **non-breaking upgrades** keyed identically (§8.25). HUD icons stay committed SVGs (also the 2D fallback art).

**Pixi/Phaser/2D remain acceptable only with a documented reason** recorded in `.loop/decisions.md`; the settled default is 3D. If, during the build, Tier A cannot hold 60fps on the managed-laptop profile **and** Tiers B/C/D cannot recover it, that is the one condition under which the engine choice may be revisited (escalate per §3) — it is not expected.

**DOM/HUD motion is standardized on `motion@^12`** (`import { … } from "motion/react"`). The 3D scene motion "stays fit-for-purpose": r3f `useFrame` + drei `easing.damp*` (interruptible, frame-rate-independent) for continuous motion, and scripted `three` tweens for the one-shot cinematic sequences (dolly-in, celebration). The domain's motion tokens (§8.10) drive **both** — durations/easings for DOM (`motion@^12`) and for scripted 3D sequences; the new **damping-lambda constants (§8.21)** drive the continuous 3D motion.

### D2 — Architecture: pure domain package + separate Next.js app (mirror feature 001)

`packages/arena-world` is **pure** (no I/O, no wall-clock, **no `Math.random`**), framework-agnostic, and holds every rule as a unit-testable function — including the **deterministic 3D presentation model** (positions, elevation, lighting/camera/water/post-fx config, quality-tier resolution). `apps/arena` is the only place three.js/r3f/React/DOM live. This keeps every guardrail deterministically testable and the build parallel-safe (new dirs only). Builds on `@gt100k/learning-loop` (`Section`/`SECTIONS`, the mastery-gate concept, XP, beyond-floor signal).

### D3 — Next.js + WebGL integration is **client-only**

three.js / r3f reference `window`/`document`/`WebGLRenderingContext`; they MUST NOT run in SSR. The `<Canvas>` mount is loaded via `next/dynamic(() => import("./scene/ArenaCanvas"), { ssr: false })`; the r3f root is created on mount and **disposed on unmount** (r3f disposes the renderer + scene graph automatically; any manual `THREE` resources are freed in effect cleanup). `next.config.mjs` sets `transpilePackages: ["@gt100k/arena-world", "@gt100k/learning-loop"]`. The app must produce **zero console/WebGL errors** (the review smoke asserts this) and register **WebGL context-lost/restored** handlers that pause the loop and, on unrecoverable loss, drop to Tier D (2D/static) — never blocking a mastery action.

### D4 — One state → many renderings (parity by construction)

The domain composes a single **`ArenaView`** (`buildArenaView(...)`). The 3D scene, the reduced-motion/plain (calm) rendering, the 2D fallback, and the accessible DOM Ledger **all render from that same `ArenaView`**. Reduced-motion/plain/lower-tier renderings do not recompute state — they render the identical view with motion/effects stripped per flags + quality tier. This makes reduced-motion an *equal* mode and makes `plainViewEquals` a pure, testable guarantee.

### D5 — Accessibility approach for a WebGL game: **synchronized parallel accessible DOM ("Arena Ledger") — SETTLED**

Because a WebGL `<canvas>` is opaque to assistive tech, the app renders a **synchronized, semantic HTML/ARIA parallel structure** adjacent to the canvas, built from the same `ArenaView`: the quest graph as a keyboard-navigable tree (`role="tree"`, nodes as `treeitem` with state in text), tier/reward as text, cosmetics as a labeled listbox, the base as a list, and celebrations announced via an `aria-live="polite"` region. **One shared view-model drives both the 3D scene and the Ledger** (D4), so the two stay in lock-step by construction. Full keyboard/switch operation (Tab/Arrow/Enter/Escape), visible focus rings, color-independent state cues, and 4.5:1 contrast. The canvas is `aria-hidden="true"`; the Ledger is the source of truth for AT. **Settled (see §13 DP-1, resolved) — the loop does not re-open it.** Reduced motion remains a first-class **equal** mode and WCAG 2.2 AA is a hard requirement (FR-015/FR-016, SC-004/SC-012).

### D6 — Seed assets: **procedural low-poly geometry (code) + committed SVGs for UI/2D + deterministic material fallback**

World objects (islands, nodes/beacons, avatar, base props, bridges) are **generated procedurally in TypeScript** from deterministic parameters — no binary meshes, git-friendly, public-repo-safe, no external fetch. HUD/Ledger icons and the **2D fallback (Tier D)** art are committed tiny **SVGs** under `apps/arena/public/seed/`. A **deterministic procedural material generator** (seeded, no `Math.random`) provides tinted materials keyed to biome/state so the scene renders even if an optional asset is missing. Non-breaking richer-art path: committed Draco-compressed glTF under `public/models/` + a texture atlas under `public/atlas/`, keyed identically (§8.25). No CDN/fetch, ever.

### D7 — Data model, UX patterns, motion vocabulary

- **Data model** is fixed in [data-model.md](./data-model.md). Guardrails are **structural**: `Cosmetic` has no `price`/`currency`/`dropRate`/`rarity` field; standings types have no `rank`/`position`/`percentile`/`outOf` field. Node-state/tier/cosmetic-eligibility are pure functions with no time/visit input.
- **UX / motion vocabulary** (applied from the Apple fluid-motion + Emil design-engineering + impeccable guidance) is fixed in **§5** and **§8**: interruptible damped motion (`easing.damp3`, start from the presentation value), never `scale(0)`, press feedback `scale 0.97`, camera follow damping `0.08` orbit factor, celebration reserved for the rare independent-unlock moment, and a full reduced-motion equivalent for every one.

### D8 — Stack pinned; tests define done

pnpm workspace (`pnpm@9.15.9`). Domain gate = `tsc -b` + Vitest, **test-first**. App verified by `next build` + smoke + acceptance walkthrough (frame budget is an acceptance target). Full stack/commands in **§11**.

---

## §3 · Defaults for the unspecified

> **For anything this PRD doesn't specify, choose the simplest correct option, record it in `.loop/decisions.md`, and continue.**

Escalate (append one line to `.loop/requests.jsonl`, then proceed on your recommendation) **only** for a genuine product/design choice with hard-to-reverse consequences you cannot defensibly default — e.g. a golden value you believe is wrong, or the single documented perf-failure condition in D1. Never escalate naming, formatting, or anything this doc/PRD answers; the canvas-accessibility approach and the engine choice (3D r3f) are **settled** (§13 DP-1/DP-2 resolved) and MUST NOT be re-opened. Overnight, only `severity: critical` reaches the operator; the rest are recorded to `.loop/deferred-decisions.jsonl`.

---

## §4 · User Scenarios & Testing *(mandatory)*

Stories are prioritized, independently testable slices. **US1 alone is a viable MVP**: a mastery-gated, traversable, 3D quest world for a synthetic learner, with a calm reduced-motion tier + accessible equivalent.

### User Story 1 — Traverse a 3D quest-world whose nodes unlock only through mastery (P1) 🎯 MVP

A synthetic learner opens the Arena and sees the competency graph (§12) rendered as a **traversable 3D overworld** ("Independence Isles"): regions are **floating low-poly islands**, nodes are quest landmarks, edges are lit paths/bridges. A **pseudonymous low-poly lantern avatar** walks the paths (damped movement, follow-camera). A node is **locked** until every prerequisite node is mastered **and** its own 90% independent-mastery gate is cleared; only then does it become **unlocked** — its **beacon lights** (a real point light warms the world) with an animated reveal. Progression is bought with real mastery — never time-in-app or grinding. `prefers-reduced-motion` (the calm static-3D tier) and the accessible Ledger convey the identical states.

**Why this priority**: The mastery-gated quest world is the core of §15.3 and the one thing that makes this an RPG game-experience layer, not a dashboard. Every other component hangs off "nodes unlock via the mastery gate" (FR-002), and the beacon-lighting payoff (FR-041) is the flagship moment.

**Independent Test**: Feed synthetic per-node `NodeMasterySignal`s; derive node states; confirm no node is `unlocked` unless its gate is cleared **and** all prerequisites are mastered; confirm deterministic layout **and its 3D world transform**; render the map (r3f) in locked/available/unlocked states, with a calm static-3D rendering and the accessible Ledger, and confirm each state is conveyed.

**Acceptance Scenarios**:

1. **Given** a node whose prerequisites are all mastered but whose own gate is **not** cleared, **When** states derive, **Then** it is `available` (reachable/highlighted) but **not** `unlocked`, and no time-in-app changes that.
2. **Given** a node whose own gate is cleared but a prerequisite is **not** mastered, **When** states derive, **Then** it is `locked`.
3. **Given** a node whose prerequisites are all mastered **and** whose gate is cleared, **When** states derive, **Then** it becomes `unlocked`, its beacon lights, and an `independent-unlock` celebration event is emitted.
4. **Given** the same signals processed twice, **When** states + layout + 3D transform derive, **Then** the result is byte-identical (deterministic; no randomness).
5. **Given** `prefers-reduced-motion` (or plain mode / the calm tier), **When** the map renders, **Then** every state, path, and unlock is fully conveyed without motion (depth kept) and no traversal is lost; the accessible Ledger exposes the same states to keyboard/screen-reader.

### User Story 2 — Gain-based tiers + deterministic cosmetics on a pseudonymous avatar (P2)

The learner accrues the **independence reward** (§13). Tiers advance on that gain, framed first as **growth vs. the learner's own past** (§14.13). Reaching competence thresholds makes **cosmetic** unlocks *eligible* — avatar items, world/base themes, celebration effects — **deterministic** (no gacha), **never purchasable**, **zero power**. The learner equips eligible cosmetics on a **pseudonymous, expressive-only** 3D avatar; equipping changes only the avatar's look on the canvas.

**Independent Test**: Feed a synthetic reward history; compute progression/tier + cosmetic eligibility; confirm eligibility is a pure deterministic function of competence (identical across runs), no purchase path can grant a cosmetic, and no cosmetic/tier changes any mastery/matchmaking/standing/access outcome.

**Acceptance Scenarios**:

1. **Given** two identical reward histories, **When** eligibility derives, **Then** the eligible set is identical every time (no randomness / variable-ratio).
2. **Given** any tier or equipped set, **When** mastery, node-unlock, matchmaking, standing compute, **Then** outcomes are unchanged vs. the same learner with no cosmetics (zero power).
3. **Given** an unearned cosmetic, **When** equip is attempted, **Then** it is rejected; there is no money/purchase code path.
4. **Given** a 6-to-8 learner, **When** tier/reward renders, **Then** it is growth-against-own-past with no raw mastery-delta headline (see US5).
5. **Given** the avatar, **When** inspected, **Then** it is pseudonymous and encodes no ability signal / advantage.

### User Story 3 — Juice on the learning moment; errors never a loss (P3)

The loudest celebrations (motion, 3D particles, beacon-lighting) fire on **independent unlocks** and **productive-struggle** events (extra unassisted attempts, self-correction, return after a failed attempt) — §14.12. An **error is never a loss**: nothing earned is removed; no loss-framed streak/decaying meter/forfeiture; feedback praises the **process**, never a fixed trait/ability/speed. Every celebration has a reduced-motion equivalent driven by a deterministic **motion spec**.

**Independent Test**: Feed learning-moment signals; confirm celebration events fire only on unlock/struggle; incorrect attempts/help requests emit **no** event and remove nothing; copy carries no trait/speed language; `celebrationMotionSpec` yields a static, particle-free spec under reduced motion.

**Acceptance Scenarios**:

1. **Given** an independent unlock or productive-struggle signal, **When** classified, **Then** a celebration event is emitted with a reduced-motion equivalent motion spec.
2. **Given** an incorrect attempt or help request, **When** processed, **Then** **no** loss event is emitted and every earned reward/standing/mastery is unchanged.
3. **Given** any celebration/failure copy, **When** reviewed, **Then** it references process/strategy/recovery, never ability/speed/fixed identity.

### User Story 4 — Co-build a persistent cohort base (P4)

The stable cohort of six shares a **persistent space they co-build** through cooperative missions (§15), rendered as a **Base Camp** island the learner returns home to. Completing a cooperative mission deterministically accretes a contribution (rooms/props/themes); contributions are attributable; the base confers no gameplay power.

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

### User Story 6 — Runs beautifully on the min device; degrades gracefully (P6)

The 3D world holds **60fps on the minimum managed device** (managed laptops = full Tier A; iPad/Safari = reduced Tier B) and degrades gracefully: it auto-drops a quality tier under sustained load, drops shadows/water/post-fx and caps dynamic lights per tier, falls to a **calm static-3D tier** under reduced motion / low power, and falls to a **2D/static DOM tier** on weak GPUs / no-WebGL / unrecoverable context loss. The game surface **never** blocks/delays a mastery action.

**Why this priority**: This is a child-facing surface on managed hardware; the frame budget and the degradation ladder are non-negotiable (FR-023). 3D is only acceptable *because* the ladder is a first-class, deterministic, testable requirement.

**Independent Test**: `resolveQualityTier(caps)` returns the correct tier for each capability profile (no-WebGL → D; reduced-motion/low-power → C; Safari/iPad/weak → B; else A); `nextLowerTier(tier)` gives the deterministic degrade path; the golden per-tier budgets (§8.24) hold; the acceptance walkthrough confirms 60fps + a working 2D fallback.

**Acceptance Scenarios**:

1. **Given** a no-WebGL capability profile, **When** the tier resolves, **Then** it is Tier D and the 2D/static DOM rendering conveys every state (canvas never mounts).
2. **Given** `prefers-reduced-motion` or a low-power signal, **When** the tier resolves, **Then** it is Tier C (static-3D): depth kept, all motion off, beacon-lighting shown as steady (baked), celebrations static.
3. **Given** a sustained frame-time overrun at Tier A, **When** the frame monitor trips, **Then** the app auto-drops to the next lower tier and never blocks a mastery action.

### Edge Cases

- **Gate-before-prereq**: gate cleared but a prerequisite unmastered stays **locked** (US1 sc. 2).
- **No-grind invariant**: any volume of time/visits with the gate uncleared never unlocks a node (FR-002).
- **Cosmetic determinism**: no path (reroll/open/purchase/timed drop) introduces randomness or money (FR-007/8).
- **Reduced-motion parity**: with `prefers-reduced-motion` (Tier C), no state/progression/celebration is unreachable; depth is retained (FR-015).
- **Accessible parity**: keyboard-only + screen-reader users reach every state via the Ledger (FR-016).
- **Band boundary**: representation resolves strictly by band; 6-8 never falls through to a numeric/comparison rendering (FR-018).
- **Standings floor**: never "last of N" — a would-be bottom learner sees own gain vs. band, not a rank (FR-019).
- **Bullying/exclusion**: a report routes to safeguarding and bypasses optimization; the game never suppresses/gamifies it (FR-025, fail-closed hook this slice).
- **Mastery action never blocked**: the game surface never blocks/delays/gates a mastery action, even under load / low-end hardware / any quality tier (FR-022/23).
- **WebGL context loss**: on context-lost, the r3f loop pauses; on restore, resources re-upload and the loop resumes; on unrecoverable loss, the app drops to Tier D (2D/static DOM) — which never depends on WebGL — and the Ledger + calm state still convey everything.
- **No-WebGL device**: the canvas never mounts; Tier D renders the identical `ArenaView` as a static 2D/DOM scene (FR-023/043).
- **Too many concurrent beacons**: dynamic point lights are capped per tier (§8.22); beyond the cap, additional lit beacons render as **emissive + bloom only** (no dynamic light) — visually consistent, budget-safe.

---

## §5 · The game design — "Independence Isles" (the full design doc)

This section is the **game-design bible**. It defines the experience the app must deliver — art direction, world, camera, avatar, motion, cosmetics, base, sound, onboarding, and age-band variants — **for a stylized 3D world**. Everything a machine can check is pinned as an exact, **testable golden constant** in **§8** (motion tokens, palette, biome identity, avatar animation, camera/lighting/water/post-fx/quality, base layout, sound cues, asset keys, 3D transforms). Where §5 describes and §8 pins, **§8 wins for values**. Everything stays **buildable in r3f/three** and inside every guardrail (§1 non-goals, §6, §12).

**Design pillars (the five sentences everything answers to):**

1. **Golden-hour cartography, now with real depth.** The Arena is a warm, hand-illustrated *storybook atlas made solid* — a low-poly archipelago of **floating islands** you traverse and orbit, bathed in perpetual late-afternoon light (this is the *afternoon* social surface). Cozy exploration, toy-diorama tactility, not a dashboard.
2. **Mastery is the only currency of light.** The world is literally lit by independent mastery: locked places are dim and cool; clearing a node's 90% gate *ignites a real beacon light* that warms the island, casts soft shadows, and lights the path onward. Progress you can *see* is progress you *earned* (§12) — never time-in-app.
3. **Calm by default, loud only at the learning moment.** Ambient motion is gentle and sparse; the loudest juice (3D particle burst + bloom pulse + beacon ignition + camera punch) is reserved for the rare independent unlock and productive struggle (§14.12). Frequency-appropriate motion (Emil): rare → delightful, occasional → standard, frequent → instant.
4. **Reduced motion and the Ledger are equal citizens.** Every visual has a calm, non-vestibular equivalent (the static-3D Tier C keeps depth, drops motion) and a semantic DOM twin (§5.12, §12). Nothing beautiful is motion-only; nothing stateful is canvas-only.
5. **Warmth is earned, never sold, never ranked.** Cosmetics are competence-earned, deterministic, zero-power, un-buyable (§7.3, §8.15). No caste, no loot, no bottom-rank (§1, §6).

### 5.1 · Art direction & visual identity

**Style register.** A tactile, chunky, **claymorphic low-poly** register — soft-shaded faceted forms with rounded silhouettes, a thin dark contour (via inverted-hull or a cheap outline pass on Tier A), warm double-bounce lighting, reading as friendly-but-not-babyish across ages 6–14. The register is *editorial-warm exploration game* (a cozy toy diorama), deliberately **not** the SaaS-cream default (see §13 DP-6): warmth is carried by **light, material accent, and typography**, and the sea/void is a **deep teal-navy** so the warm islands glow against it.

**Master palette (exact hex — golden in §8.11).** OKLCH-reasoned, contrast-verified. In 3D these drive material base colors, emissive colors, and light colors.

| Role | Token | Hex | Use |
|---|---|---|---|
| Sea (void bg) | `--sea-deep` | `#0E2A3B` | the void between islands; clear color / fog far |
| Sea mid | `--sea-mid` | `#14384C` | water plane base; panel base |
| Sky dawn | `--sky-dawn` | `#F4C77B` | warm horizon / hemisphere sky; sun glow |
| Ink | `--ink` | `#14202B` | text on light props; contour lines |
| Ink-hi (HUD) | `--ink-hi` | `#F5F9FC` | HUD/Ledger text on sea (≈13:1 on `--sea-deep`, AAA) |
| Sun (primary warm) | `--sun` | `#F6A23A` | key-light warm accent; `available` glow; primary accent |
| Sun-hi | `--sun-hi` | `#FFC66B` | highlights, hover, emissive rim |
| Gold (reward/tier) | `--gold` | `#F2C14E` | tiers, `unlocked` **beacon light** color, reward counter |
| Ember (high celebrate) | `--ember` | `#E8623B` | loudest-moment particles/bloom + transfer-critical beacon (rare) |
| Locked | `--locked` | `#5A6B78` | muted slate — dim nodes/paths (paired with padlock glyph) |
| Not-yet (error) | `--notyet` | `#7FB6D6` | **calm cool blue** wisp + rim light — deliberately NOT red (error ≠ loss) |
| Focus ring | `--focus` | `#FFD166` | 3px ring, 2px offset — high-contrast on light *and* dark |

**Biome signature hues** (one per island; full identity §8.12): Numbers Coast `#2EC4B6` (turquoise tide-pools), Tinker Bluffs `#C77D3A` (copper/brass), Story Vale `#3E9B5F` (mossy book-forest), Wordwind Reach `#5AA9E6` (windswept sky). Each hue tints only its island's terrain/props/ambient material — never a state cue.

**Typography (tokens §8.11).** Display/headings **Fredoka** (rounded, friendly), body/Ledger **Nunito** — a contrast-axis pairing (geometric-rounded display + humanist body). Text lives in the **DOM HUD + Ledger**, not the canvas (the 6-8 band shows no numbers on canvas anyway); optional 3D labels use billboarded DOM (`drei` `<Html>`) so type stays crisp and accessible. **No external fetch** (§1): default is a **system-rounded fallback stack** (`--font-display: "Fredoka","Baloo 2",ui-rounded,"Segoe UI Rounded",system-ui,sans-serif`; `--font-body: "Nunito",ui-rounded,system-ui,sans-serif`); self-hosted subset `woff2` under `public/fonts/` is an **optional, non-breaking** enhancement (§13 DP-6). Size-specific tracking (Apple): display tight (`-0.02em`), body `0`, small labels `+0.01em`; leading inverse to size. Reward/growth counters use **tabular numbers**.

| Role | Family | rem | line-height | tracking | weight |
|---|---|---|---|---|---|
| Display (tier reveal) | display | 2.5 | 1.05 | -0.02em | 700 |
| H1 (region name) | display | 1.75 | 1.10 | -0.01em | 600 |
| H2 (panel title) | display | 1.25 | 1.20 | 0 | 600 |
| Body (Ledger) | body | 1.0 | 1.5 | 0 | 400 |
| Label / caption | body | 0.8125 | 1.4 | +0.01em | 500 |

**Lighting & atmosphere (the heart — §8.20).** A single warm **key light (the sun) from top-left** casts soft shadows to the bottom-right (consistent everywhere). A **hemisphere fill** (warm sky, cool ground) plus a low **ambient** and a cool **rim/back light** for separation. A **water plane** with sun-glint shimmer sits below the floating islands; **cloud cards** drift on a far parallax layer; **ambient motes** (very low count, additive) drift near the world; a subtle **vignette** + gentle **bloom** focus the center and make beacons glow. The world is perpetual **golden hour** with a subtle **sun-angle drift** (±5° / 120s) for life. **The mastery payoff: each `unlocked` node emits a real beacon point light** (`--gold`; transfer-critical → warmer `--ember`, brighter), so the world literally brightens as the learner masters it. Dynamic lights are **capped per tier** (§8.22); beyond the cap, beacons glow via emissive+bloom. **All ambient motion + sun drift + realtime shadows are OFF under reduced-motion / Tier C**; depth, elevation, materials, and baked golden-hour light are retained.

**Mood board, in words.** *A weathered explorer's atlas that lifted off the table into a hovering toy-diorama at 5 p.m.; low-poly islands you could pick up, floating over a deep-teal void; lanterns and lighthouses warming to life one by one, each throwing real light across the felt-shaded hills; turquoise tide-pools and copper gears; the hush of a book-forest; kites over windmills; a campfire on the home island where six small lantern-marks gather. Studio Ghibli warmth × Monument Valley calm × a cozy board-game diorama × the confidence of a well-made reading app.*

### 5.2 · World & level design

A **2×2 archipelago** laid out on a **2048×2048** unit design grid (the domain layout, §8.1), mapped into a **~64×64 unit 3D world** via `WORLD_SCALE = 0.03125` (=1/32; §8.20). Four **floating region islands**, one per learning-loop `Section`; a central **Base Camp** island over the seam (§5.8), reachable from every region. Each island floats above a sea plane at `seaLevel = -3.0`, with a visible faceted underside, and bobs gently on its own phase (§8.23).

| Region id | Section | Biome identity | Origin (grid x,y) | Elevation (units) | Signature |
|---|---|---|---|---|---|
| `numbers-coast` | math | shorelines, tide-pools, a counting lighthouse | (0, 0) | 0.0 | `#2EC4B6` |
| `tinker-bluffs` | science | workshop cliffs, gears, copper kilns | (1024, 0) | 1.5 | `#C77D3A` |
| `story-vale` | reading | book-root forest valley, whispering falls | (0, 1024) | -0.5 | `#3E9B5F` |
| `wordwind-reach` | language | windmill highlands, letter-kites, spelling spires | (1024, 1024) | 2.2 | `#5AA9E6` |

**Nodes are places (3D landmarks); edges are lit paths; cross-island edges are bridges.** Each fixture node maps to a **named landmark (POI)** so the world reads as a place, not a graph:

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

**State reads as light + form (never color alone — §6 FR-031).** `locked` = dim, cool `--locked` material, a *closed padlock* glyph, path unlit, **no beacon light**; `available` = warm `--sun` **Glow Pulse** emissive ring + an *open lit path* + a "start here" pennant + a faint (capped) available-glow light; `unlocked` = a **lit beacon** in `--gold` (a real point light, §8.22), the marker rises `beaconLift` units, filled star, warm lit path to the next node. Transfer-critical nodes wear a subtle laurel ring so their high-intensity celebration is legible in advance.

**Landmarks & wayfinding.** Every screen answers Apple's four wayfinding questions: region banners name *where you are*; lit paths + a compass show *where you can go*; node pennants/labels show *what's there*; a persistent "Home" affordance (to Base Camp, a camera recenter) shows *how to get out*. Regions have a stable spatial identity so the learner builds a mental map (spatial consistency).

### 5.3 · Camera system (config §8.20)

A **damped, interruptible follow/orbit hybrid** perspective camera (drei `<PerspectiveCamera>` + a custom rig using `easing.damp3`, with `<OrbitControls>` bounded for user orbit). Everything animates from the presentation value (Apple), so re-targets never jump.

- **Follow**: the camera target smoothly tracks the avatar via `damp3` at lambda `cameraFollow = 3.5`/s; a **central deadzone** (`deadzoneRadius = 2.0` units) so idle bob never scrolls. `fov 42`, `near 0.5`, `far 400`; rest distance `distanceDefault = 32`.
- **Look-ahead** (Apple "hint in the direction of the gesture"): during traversal the target leads the avatar by `lookAheadUnits = 3.0` toward the destination.
- **Orbit** (user, bounded): yaw ±35°, pitch clamp 22°–62°, dolly `distanceMin 18 → distanceMax 60`, `<OrbitControls>` damping factor `0.08` (the continuity of the old 2D lerp value). Never inverts, never flips under the horizon.
- **Establishing dolly-in** on world enter: opens at `introDistance = 90` (whole archipelago in frame), eases to `distanceDefault = 32` on the avatar over `intro = 1200ms` `Cubic.InOut` — a cinematic *Continuity zoom*. Reduced-motion: instant cut to the rest pose (150ms fade).
- **Region focus**: dolly to `distanceRegion = 24` + recenter on the region centroid over `zoom = 300ms` `Cubic.Out`. Reduced-motion: instant.
- **Celebration punch** (high intensity only): a one-shot dolly `-2.0` units + `fov +1.5°` in `punchOutMs 120` then back `punchBackMs 180` — a felt *impact*, never nausea-inducing. Off under reduced motion.
- **Parallax by real perspective** plus explicit far layers (§8.20 `PARALLAX3D`): sky dome, drifting cloud cards, distant island silhouettes, the water plane, the world (islands/nodes/avatar), near foreground fronds, ambient motes. Depth is kept under reduced motion; only the *motion* of ambient layers stops.

### 5.4 · Avatar — design, customization, animation (specs §8.13 + §8.26)

**Design.** A small, round-bodied **pseudonymous low-poly lantern-explorer** ("a Spark") — expressive-only, carrying a warm lantern (the lantern is the *warmth/independence* motif, never an ability signal). No face detail that could encode identity or advantage (§6 FR-010, §29). Built from parametric low-poly parts (`body`, `lantern`, plus cosmetic slots `hat`/`cape`/`badge`/`trail`) so cosmetics swap child meshes only.

**Customization.** Equipped `avatar-item` cosmetics (§7.3/§8.15) toggle/replace the corresponding child mesh — appearance only, deterministic, zero-power, earned. Equip is a `Crossfade` (material opacity) with a brief scale settle, `200ms` (`equip` token); instant swap under reduced motion.

**Animation states** (`resolveAvatarAnimation(intent, {reducedMotion})`, golden §8.13; 3D mapping §8.26). Never `scale(0)`; idle bob amplitude `0.12` units (via `position.y` sine); landing from a celebrate-jump gets a `scaleY 0.92→1.08→1.0` **squash-&-stretch** follow-through; the lantern's emissive flares on celebrate. Movement is **interruptible** — re-targeting reads the avatar's live position and eases (`damp3`, lambda `avatarMove = 6.0`), with facing damped (`avatarTurn = 8.0`).

| Intent | State | 3D effect (named) | Loop | Duration | Easing | Reduced-motion |
|---|---|---|---|---|---|---|
| idle | `idle` | `Float` position.y bob + lantern emissive flicker | yes (yoyo) | 1600ms | Sine.InOut | static pose, steady lantern |
| walk | `walk` | step bob + damped move toward target + face travel dir | during move | 600ms/seg | Cubic.Out | 150ms crossfade reposition |
| run | `run` | faster damped move + forward lean + speed trail (≥2 seg / fast re-target) | during move | 380ms/seg | Cubic.Out | 150ms crossfade |
| think | `think` | head-tilt + "?" billboard mote + lantern pulse (on `available` focus / struggle) | 2× then idle | 900ms | Sine.InOut | static think pose |
| celebrate | `celebrate` | `Pop` jump (y-impulse) + squash-stretch + lantern flare (on unlock) | one-shot | 400/600/800ms (low/med/high) | Back.Out | static celebrate pose + badge |

### 5.5 · Scene graph & scene-by-scene UX (r3f)

The app is a single **r3f `<Canvas>`** whose scene graph is composed declaratively from the `ArenaView`. There are no imperative "scenes"; instead, React components own regions of the graph, and a small **event bus** bridges the DOM HUD/Ledger ↔ the scene.

| Component (scene-graph region) | Role & UX |
|---|---|
| `ArenaCanvas` | The r3f `<Canvas>` root (client-only, `ssr:false`): sets renderer flags (WebGL2, `dpr` capped per tier, `toneMapping: ACESFilmic`, `outputColorSpace: sRGB`), color-management, and the frame-loop mode. Registers context-lost/restored handlers. `aria-hidden`. |
| `LightingRig` | Key + hemisphere fill + ambient + rim + optional sun-drift, per `resolveLighting(tier, theme)` (§8.20). Owns realtime shadow config (Tier A/B) or baked look (Tier C). |
| `SeaAndSky` | Sky dome, hemisphere backdrop, drifting cloud cards, the water plane (shader on A, cheap on B, static on C), fog to `--sea-deep`. Ambient motion off under reduced motion. |
| `WorldRoot` | The overworld: four floating biome islands (instanced low-poly terrain, biome hues from `resolveBiome`), node markers per state, lit edge paths + cross-island bridges, and the **beacon lights** for unlocked nodes (capped, §8.22). Owns the map. |
| `Avatar` | The pseudonymous lantern-explorer driven by `resolveAvatarAnimation`; damped interruptible traversal; cosmetic child meshes. |
| `CameraRig` | Follow/orbit hybrid + deadzone + look-ahead + establishing dolly-in + region focus + celebration punch (§5.3). |
| `BaseCamp` | The cohort **Base Camp** island (§5.8): renders `resolveBaseLayout` into deterministic zones/slots (§8.16); focus shows the attributable pseudonymous contributor + mission. The "home" surface. |
| `Fx` | Celebration overlay in-world: 3D particle bursts (points), node bloom pulse, path light-up, beacon ignition, camera punch — all driven by `celebrationMotionSpec` + `resolveMotion`/lambdas (§8.5/§8.10/§8.21). A no-op / single static frame under reduced motion. |
| `PostFx` | `<EffectComposer>` bloom + vignette (+ SMAA on A) per `resolvePostFx(tier)` (§8.20); disabled on Tier C. |
| `Fallback2D` | The **Tier D** render: a static 2D/DOM (SVG) scene of the identical `ArenaView` when WebGL is unavailable/lost; never mounts the canvas. |

**Onboarding (first-run, coach-marks — §6 FR-038).** A 3-beat, skippable, non-blocking sequence at the Counting Lighthouse, rendered as **DOM coach-marks** (`motion@^12`) anchored over the canvas: (1) *"This is you"* — the avatar idles, lantern glimmers; (2) *"Light a path"* — a pointer to the first `available` node, "clear its gate to light the beacon"; (3) *"Your way"* — surfaces plain-mode + the Ledger + standings-off. Any input advances/dismisses; it **never** gates a mastery action, is fully mirrored in the Ledger, and each beat honors reduced motion (`Fade`, no slide). Shown once (a local flag); re-openable from the HUD "?".

**React owns the HUD + Ledger (DOM), r3f owns the canvas.** A typed event bus bridges DOM → scene (set band / toggle plain / equip cosmetic / advance the synthetic feed / focus node) and scene → DOM (node focused / unlock celebrated / tier degraded), so the Ledger and canvas stay in lock-step from the one `ArenaView` (§2 D4).

### 5.6 · Motion & juice — the master motion table (the heart)

Motion is designed, not decorated (Apple §17: interaction and visuals together). Durations are **named tokens** (§8.10 `MOTION`); easings are **named** (§8.10 `EASINGS`); continuous 3D motion uses **damping lambdas** (§8.21 `LAMBDAS`); every row has a first-class reduced-motion equivalent (Emil/Apple: reduced motion = *gentler*, not *gone*). DOM/HUD rows are driven by **`motion@^12`**; in-canvas rows by r3f `useFrame` + `easing.damp*` / scripted `three` tweens. All effect specs derive from `resolveMotion(kind, {reducedMotion})` so the values are testable constants (SC-015).

| Event | Named effect (vocabulary) | Layer | Easing / lambda | Duration (token) | Particles | Camera / light | Sound cue | Reduced-motion equivalent |
|---|---|---|---|---|---|---|---|---|
| World enter | Establishing **dolly-in** + scene **Fade** | canvas | Cubic.InOut | 1200 (`intro`) | — | dist 90→32 to avatar | boot chime | instant cut to rest pose + 150ms fade |
| Node reveal (unlock) | **Scale-in + Pop** (0.95→1.0, peak ~1.05) + marker rise + path **Line-drawing** | canvas | Back.Out | 220 (`reveal`) | per intensity | **beacon light ignites** (§8.22) | unlock chord | instant show + steady lit beacon + badge |
| Independent-unlock **high** (transfer-critical) | **Burst + Bloom-pulse + Beacon-ignition + Camera-punch** (ember→gold) | canvas | Back.Out | 800 (`celebrateHigh`) | 24 | punch dist -2 (120/180ms), bloom 0.7→1.4, ember beacon | beacon arpeggio | static starburst badge + steady beacon + `aria-live` (150ms) |
| Unlock **medium** | Burst + Bloom-pulse + beacon ignition | canvas | Back.Out | 600 (`celebrateMed`) | 12 | bloom 0.7→1.1, gold beacon | bloom chord | static badge + steady beacon + announce |
| Productive-struggle **low** | **Warm Pulse** + rising motes + avatar `think→nod` | canvas | Sine.InOut | 400 (`celebrateLow`) | 6 | brief emissive warm-up (no new light) | encouraging tone | static "effort honored" chip |
| Error / "not yet" | Calm **Float** wisp (`--notyet` blue), node steadies, cool rim ticks up briefly | canvas | Cubic.Out | 300 (`base`) | 0 | none (no shake) | **neutral soft tap** | static "not yet" text, no motion |
| Available highlight | **Glow Pulse** emissive ring (yoyo) + faint available light (capped) | canvas | Sine.InOut | 1200 (`glowLoop`) | — | faint available glow | (silent) | static ring/outline, no pulse |
| Avatar traverse | **Damped move along path** + camera follow + look-ahead | canvas | `avatarMove 6.0` / `run 380` | 600 (`move`) | — | follow damp 3.5 | footfall tick | 150ms crossfade reposition |
| Camera orbit (user) | **Bounded orbit** damped | canvas | orbit factor 0.08 | continuous | — | orbit | (silent) | orbit still available (non-vestibular); no auto-drift |
| Island bob | **Float** (position.y sine, per-phase) | canvas | Sine.InOut | 8000 (`islandFloat`) | — | none | (silent) | off; static elevation, depth kept |
| Sun drift | slow key-light **Orbit** (±5°) | canvas | Linear | 120000 loop | — | light angle | (silent) | off; static golden-hour |
| Press feedback | **Press/Tap** scale 0.97 (on pointer-down) | DOM | Quad.Out | 120 (`press`) | — | none | (silent) | kept (non-vestibular) |
| Region focus | **Continuity zoom** dist→24 + recenter | canvas | Cubic.Out | 300 (`zoom`) | — | dolly | (silent) | instant recenter |
| Tier advance | **Number ticker** (tabular) + tier badge **Pop** + gold sweep | DOM | Cubic.Out | 600 (`celebrateMed`) | — | none | rising sweep | instant number + static badge |
| Cosmetic equip | **Crossfade** material swap + scale settle | canvas | Cubic.Out | 200 (`equip`) | — | none | cloth whoosh | instant swap |
| Cosmetic drawer | **Origin-aware Scale-in** (from trigger) + item **Stagger** 40ms | DOM | Cubic.Out | 220 (`fast`) | — | none | (silent) | instant/fade |
| Scene → Base | **Continuity** camera glide to Base Camp + Crossfade | canvas | Cubic.Out | 350 (`sceneFade`) | — | dolly | (silent) | 150ms crossfade / instant recenter |
| Base accretion | **Pop-in place** (0.9→1.0) + dust motes; label **Fade-in** | canvas/DOM | Back.Out | 300 (`base`) | small | none | place click + murmur | instant place + list update |
| Standings open (opt-in) | **Accordion** expand + own-gain bar **grow** L→R | DOM | Cubic.Out | 220 (`fast`) | — | none | (silent) | instant |
| Ambient world | Water **shimmer**, cloud **drift**, **motes Float** | canvas | Linear/Sine | 6000 loop | low | none | (silent) | **all off**; depth + water plane kept static |
| HUD toggle (band/plain/standings) | **Instant** (frequent action → no animation) | DOM | — | 0 (`instant`) | — | none | (silent) | instant |
| Onboarding beat | **Fade** + gentle pointer | DOM | Cubic.Out | 300 (`base`) | — | none | (silent) | static, no slide |
| Quality degrade | **Instant** swap of tier (no visible flash) | system | — | 0 (`instant`) | — | drop shadows/water/post-fx/lights | (silent) | instant (already reduced) |

**Deliberately excluded** (would violate §14.12 / this design): `Shake`/`Wiggle` on error (reads as rejection/loss — errors use a *calm* wisp), any `scale(0)` entrance, `ease-in` on entrances, gacha "reroll" reveal animation, loss/decay meters, engagement-timed pop-ins, camera roll/inversion, screen-filling flashes, and any looping earworm audio.

### 5.7 · Celebration sequences (orchestration — the loudest moments, §14.12)

The two loudest sequences are **orchestrated** (multi-property motion timed to feel like one gesture), reserved for the mechanism, never for minutes:

**A. Independent-unlock (high / transfer-critical) — "Light the beacon."** On `masteryCleared` for a transfer-critical node with prereqs met: (t=0) neutral avatar `celebrate` **Pop** jump begins; (t=60ms) the node marker **Scale-in + Pop** and rises to its lit `--gold` beacon height; (t=120ms) the **beacon point light ignites** (or, past the light cap, emissive+bloom) and a 24-particle ember→gold **Burst** (3D points, additive, gravity, `800ms` life) fires with a bloom **pulse** (0.7→1.4) + a ground **ripple** ring (expanding torus); (t=120ms) the camera **punch** (dist -2, fov +1.5°, 120ms out / 180ms back); (t=200ms) the **path line-draws** to the next node and its material warms; `aria-live` announces "You lit The Spelling Spires — you did it yourself." Sound: beacon arpeggio (muted default, captioned). **Reduced-motion (Tier C):** the beacon is simply **on** (baked), a single static starburst badge appears + the announce; **nothing is required to be motion to be understood.** With `celebration-aurora` equipped (§8.15), the burst becomes aurora ribbons + a one-shot sky shimmer — the rarest look.

**B. Productive-struggle — "Struggle honored."** On an extra unassisted attempt / self-correction / return-after-fail: the avatar plays `think→nod`, a gentle 6-particle **Warm Pulse** rises from the node with a brief emissive warm-up (no new light), and a Ledger `aria-live` chip reads process-praise ("You kept going after a tricky one — that's the work."). No node state change, nothing removed. Reduced-motion: the static chip alone.

Both derive from `classifyCelebration` + `celebrationMotionSpec` (§8.5) so intensity, particle count, duration, and the reduced equivalent are deterministic and testable.

### 5.8 · Cohort Base Camp — the co-built home (layout §8.16)

The central floating island is a cozy **harbor camp** the stable cohort of six co-builds. It is the default landing when standings/competition are off — the belonging surface (§15.2 rollback gate). It **grows visibly warmer and more populated** as cooperative missions accrete features into stable **zones/slots** (deterministic, `resolveBaseLayout`). 3D coords derive from the §8.16 grid coords via `WORLD_SCALE`.

| Feature | Zone | Slot origin (grid x,y) | Look (3D) |
|---|---|---|---|
| `campfire` | hearth | (1024, 1024) | central warm fire (a small emissive + capped point light); lantern-marks circle it |
| `banner` | gateway | (1024, 928) | a co-signed cohort banner over the camp gate |
| `garden` | grove | (944, 1088) | a small shared planter that fills in with low-poly growth |
| `dock` | harbor | (1104, 1120) | a jetty where arrivals land |
| `workshop` | yard | (944, 960) | a shared bench with in-progress projects |
| `lookout` | ridge | (1104, 944) | a spyglass platform over the isles |

Each contribution is **attributable** — a small pseudonymous **lantern-mark** with the contributor's ref + mission id appears beside its prop (on focus / in the Ledger list). Features place in **contribution order** into their zone; unknown feature ids get a deterministic grid-fallback slot (still replayable). The base confers **zero power** (§6 FR-011). New arrivals `Pop-in place` (reduced-motion: instant). Over time the camp reads as *"we made this together."*

### 5.9 · Cosmetics — the catalog, how they *look* (visuals §8.15)

Cosmetics are competence-earned, deterministic, **zero-power**, and **never purchasable** (§7.3 rules; structurally no price/rarity field, §6 FR-008/009). Each carries a deterministic text `look` + `equipEffect` descriptor (testable it exists and is stable, SC-022) and a reduced-motion form. Nine fixture cosmetics:

| id | kind | look | equip / effect (3D) | reduced-motion |
|---|---|---|---|---|
| `avatar-hat-explorer` | avatar-item | soft tan felt explorer's cap | tilts slightly on walk | static tilt |
| `avatar-cape-aurora` | avatar-item | teal→plum aurora-gradient cape | trails on `run` | static cape, no trail |
| `avatar-badge-firstlight` | avatar-item | small gold "first light" star pin | glints (emissive) on idle | static pin |
| `world-theme-dawn` | world-theme | rosier dawn sky + softer light | recolors sky/sea + shifts the lighting rig on equip | instant recolor |
| `world-theme-dusk` | world-theme | deep-indigo dusk; brighter lanterns; stars | indigo ambient, beacons more prominent, star cards twinkle | static stars, indigo rig |
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

- **Procedural low-poly geometry (code, no fetch).** Every world object is generated deterministically in TypeScript from parameters (biome tint, size, seed) at load — islands, node markers/beacons, avatar parts, base props, bridges, water plane. Text-diffable, tiny, public-repo-safe.
- **Committed SVGs** under `apps/arena/public/seed/` for HUD/Ledger **icons** and the **Tier D 2D fallback** art (nodes/regions/base as flat SVG). Small, text-diffable.
- **Deterministic key registry** `ASSET_KEYS` in the domain (§8.17) so the scene, the Ledger, the 2D fallback, and the procedural generator agree on every key by construction.
- **Load order per key: committed model/atlas → procedural geometry/material.** The loader prefers an optional committed Draco-glTF (`public/models/`) / atlas (`public/atlas/`) if present, else generates the procedural mesh/material (seeded, no `Math.random`) — so a missing asset **still renders** (FR-030/039). Determinism proven in `assets.test.ts`.
- **Path to richer art (non-breaking):** drop Draco-compressed glTF under `public/models/` + a texture atlas under `public/atlas/` keyed identically; no code change beyond the loader's model branch. Optional self-hosted subset fonts (§13 DP-6) follow the same "committed, no-fetch, non-breaking" rule.

### 5.12 · HUD & the accessible Ledger — visual + semantic design

**HUD (DOM overlay over the canvas, `motion@^12`).** Translucent, `backdrop-filter` frosted panels floating over the world (Apple materials: chrome content scrolls under, not opaque bars) — a top region banner, a bottom growth/tier panel, a right cosmetic drawer, and a "?" / Home / audio / plain-mode / band / standings / **quality** control cluster. Panels `Materialize` (blur + scale on enter) rather than hard-fade; press feedback on every control (scale 0.97); ≥44px targets (56px in the 6-8 band). Reduced-transparency → solid panels. A small unobtrusive **tier indicator** shows the active quality tier (A/B/C/D) for QA/parents; it never blocks anything.

**The Arena Ledger (the equal, semantic twin — §12, D5).** Built from the same `ArenaView`: the quest graph as a keyboard-navigable `role="tree"` (each node a `treeitem` whose accessible name = *landmark title + state + region*, e.g. "The Spelling Spires, unlocked, Wordwind Reach"); tier/growth as band-appropriate text; cosmetics as a labeled `listbox` (eligible = equippable, locked = with its earn-goal); the base as a list of features + contributors; celebrations via `aria-live="polite"`; captions for sound cues. Full keyboard/switch operation, visible `--focus` rings, color-independent state (icon + text), ≥4.5:1 contrast. Canvas is `aria-hidden="true"`. Because both renderers consume the one view model, they never drift (parity by construction).

### 5.13 · Age-band visual variants (§14.13; tokens §8.19)

Identical underlying economy (§13), **different presentation** via `resolveVisualBand(band)`:

- **6-8** — concrete & story-framed. **No raw number on the canvas** (`showCanvasNumbers=false`); tier is a *growing light*, not a digit; labels are story sentences ("You lit the Counting Lighthouse!"); comparison **off**; larger markers (`×1.25`) and 56px targets; more avatar idle personality; celebration ceiling capped at **medium** (warm, not overwhelming).
- **9-11** — transitional. Growth-vs-past bar is primary ("past-you vs you"); simplified tier badge + quest-tree; standings **opt-in** but muted; 48px targets; full celebration ceiling.
- **12-14** — full & strategic. Full map, numeric independence reward (tabular), tier ladder, quest graph, **opt-in** near-peer standings, dusk theme available; 44px targets; full celebration ceiling.

The variant is a **render layer over identical state** (a flag on `buildArenaView`); `plainViewEquals` still holds — only presentation and `flags` differ (SC-006/014/020).

### 5.14 · Motion principles (the rules every value above obeys)

- **Frequency-appropriate** (Emil): rare (celebration) → delight; occasional (traverse) → standard eased; frequent (HUD toggles) → instant.
- **Enter/exit `Cubic.Out`** (responsive), on-screen moves `Sine.InOut`, reveals `Back.Out` (overshoot ≤1.08, never `scale(0)`); **never `ease-in` on entrances**.
- **Interruptible & velocity-aware** (Apple): continuous 3D motion uses `easing.damp*` which eases *from the live presentation value* every frame; traversal re-targets from the live position; nothing locks out input.
- **GPU-friendly**: animate transform/material/light properties, instanced geometry, capped DPR + capped dynamic lights; target **60fps** with the degraded tier holding the budget (§8.24).
- **Every** animation has a reduced-motion equivalent (§8) and a Ledger equivalent (§12); reduced motion is *the same world, held still.*

---

## §6 · Requirements *(mandatory)*

### Functional Requirements

**Quest-world map & mastery gate**

- **FR-001**: The system MUST render the competency graph (§12) as a traversable **3D overworld** — regions as floating islands, nodes as quest landmarks, edges as paths — with a **deterministic layout + 3D world transform**, damped avatar movement, a follow/orbit camera, and animated node reveals (each with a reduced-motion equivalent, FR-015).
- **FR-002**: A node MUST unlock **only** through its 90% independent-mastery gate (§12); progression MUST NOT be obtainable via time-in-app, revisits, or grinding.
- **FR-003**: A node MUST be `available` only when **all** prerequisites are mastered; `unlocked` only when `available` **and** its own gate is cleared; else `locked`.
- **FR-004**: Node-state derivation, world layout, and the 3D world transform MUST be **pure, deterministic** functions of the signals + graph — no randomness, replayable, identical output for identical input.

**Gain-based tiers & independence reward**

- **FR-005**: Tiers/levels MUST advance on mastery-gain and the independence reward (§13), framed first as growth-against-own-past (§14.13).
- **FR-006**: Tier derivation MUST be deterministic thresholds over cumulative independence reward, and a tier MUST affect **only** cosmetics — never access, matchmaking, or standing.

**Earned cosmetics & avatar**

- **FR-007**: Cosmetic-unlock **eligibility** MUST be competence-earned and **deterministic** — no gacha, no variable-ratio/random loot, no timed drops.
- **FR-008**: Cosmetics MUST NOT be purchasable with money (G1); the system MUST expose **no** purchase/financial code path for minors.
- **FR-009**: Cosmetics MUST carry **zero gameplay power** — never affect mastery, node-unlock, matchmaking, standing, or access; ignoring cosmetics MUST never disadvantage a learner.
- **FR-010**: The avatar MUST be **pseudonymous** (no real likeness/legal name/biometric, §29), expressive-only, encode no ability signal, confer no advantage; equipping a cosmetic MUST require prior eligibility.

**Persistent cohort base**

- **FR-011**: The system MUST maintain a **persistent cohort base** a stable cohort co-builds via cooperative-mission completions, with deterministic accretion, attributable contributions, and **zero gameplay power**, rendered as a 3D base scene.

**Juice & failure framing**

- **FR-012**: The system MUST emit celebration events on **independent unlocks** and **productive-struggle** events (§14.12 items 3-4).
- **FR-013**: An incorrect attempt or help request MUST NOT be rendered as a loss and MUST NOT remove any earned reward/standing/mastery; the reward surface MUST render **no** loss event, decaying/absence meter, or forfeiture (§14.12 items 1,5; §14.12.1).
- **FR-014**: Celebration/failure copy MUST praise the **process** and MUST NOT reference fixed ability, speed, or identity (§14.12 item 2).

**Reduced motion & accessibility**

- **FR-015**: Reduced motion MUST be a **first-class, equal** mode: every animated affordance MUST have a reduced-motion rendering conveying the same state/progression/celebration; `prefers-reduced-motion` MUST be honored by default (the calm static-3D Tier C, which **keeps 3D depth** and strips motion); **no** feature may require motion (WCAG 2.2 AA, §8.3). Motion parameters MUST derive from a deterministic `celebrationMotionSpec`/`resolveMotion`.
- **FR-016**: All game-experience surfaces MUST meet WCAG 2.2 AA via the **accessible DOM Ledger** — keyboard/switch/screen-reader operable, focus-visible, captioned, color-independent, ≥4.5:1 contrast. The canvas is `aria-hidden`; the Ledger conveys identical state.

**Developmental staging**

- **FR-017**: Reward/progression representation MUST resolve from the learner's age band (6-8, 9-11, 12-14); the underlying economy (§13) MUST be identical across bands — only representation, default competitive exposure, and failure copy vary.
- **FR-018**: A 6-to-8 learner MUST NOT be shown the raw mastery-delta number as the headline currency; that band MUST default to concrete/story-framed representation with comparison **off**.

**Standings, opt-out & no caste**

- **FR-019**: Any cross-child standing MUST be opt-in (default off), near-peer-band, anonymized, gain-based, and MUST never surface a bottom-rank position; caste ranks, public tier names, and full-field rankings MUST NOT be representable (§15, G6).
- **FR-020**: Turning off standings, or using plain mode, MUST leave learning, access, and standing unchanged (opt-out is free).

**No dark patterns, performance & non-blocking**

- **FR-021**: The reward surface MUST use no loss-framed streaks, manufactured scarcity, FOMO, gacha/loot randomness, or engagement-timed notifications (§14.12 item 5).
- **FR-022**: The game surface MUST never block, delay, or gate a mastery action — at any quality tier.
- **FR-023**: The real-time client MUST hold **60fps on the minimum managed device** (managed laptops = full Tier A; iPad/Safari = reduced Tier B) with graceful degradation under load / low-end hardware / low power / WebGL context loss via the deterministic **quality ladder (§8.24)**: auto-drop a tier on sustained overrun, cap dynamic lights/DPR/shadows/water/post-fx per tier, fall to a **calm static-3D tier** and to a **2D/static DOM tier** (no-WebGL); game-feel MUST NOT become engagement-maxxing.

**Privacy, synthetic scope & child-safety**

- **FR-024**: Avatars/base/cosmetics MUST be pseudonymous and hold no sensitive data/PII; the feature MUST run end-to-end with **synthetic learners only** and MUST NOT require any consent/admissions/legal/governance workflow.
- **FR-025**: A report of bullying/coercion/exclusion in any social surface MUST bypass optimization and route to safeguarding; the game MUST NOT gamify/suppress/delay it. *(This slice: a fail-closed hook/flag, not a live pipeline.)*
- **FR-026**: This is a **child-facing surface**; the child-safety guardrails specified here MUST apply — reduced-motion as a first-class equal mode, WCAG 2.2 AA, no dark patterns, no loot/purchase, zero-power cosmetics, no caste ranks, age-appropriate staging, errors-never-loss, and non-blocking of mastery actions (see FR-002–FR-025, SC-001–SC-026).

**Build-on / isolation & engine**

- **FR-027**: The feature MUST build on `@gt100k/learning-loop` (`Section`/`SECTIONS`, mastery-gate/`evaluateGate` concept, XP, beyond-floor signal) and MUST NOT modify `packages/learning-loop`, `apps/student-compass`, or shared root config except the single final root-tsconfig task.
- **FR-028**: The app MUST render the game on **react-three-fiber + three.js + drei** (WebGL2) loaded **client-only** (no SSR), with the r3f root disposed on unmount and **zero console/WebGL errors** in the smoke run; it MUST register WebGL context-lost/restored handlers and degrade to Tier D on unrecoverable loss.
- **FR-029**: The 3D scene, the reduced-motion/plain (calm) rendering, the 2D fallback, and the accessible Ledger MUST all render from the **single `ArenaView`** produced by `buildArenaView`; reduced-motion/plain/lower-tier MUST NOT recompute state (parity by construction).
- **FR-030**: Seed assets MUST be authored in-repo (procedural code geometry + committed SVGs) with a deterministic procedural material/mesh fallback; the game MUST build and run with **no external fetch**.

**Art direction, motion system, avatar, camera, lighting, sound, onboarding & assets**

- **FR-031**: The world MUST render with the **Independence Isles** visual identity — the golden-hour master palette (§8.11) driving materials/lights, per-biome region identity (§8.12), a consistent top-left key light with soft shadows (Tier A/B), and the typography tokens (§8.11) — using **no external fetch**. **Color is never the sole state cue**: every node/tier/standing state MUST also be conveyed by icon/shape/text (and light presence), at ≥4.5:1 text contrast (WCAG 2.2 AA, FR-016).
- **FR-032**: The avatar MUST support the animation states `idle | walk | run | think | celebrate` via the deterministic `resolveAvatarAnimation(intent, { reducedMotion })` (§8.13); movement MUST be **interruptible** (re-target from the live position via damping), MUST NEVER animate from `scale(0)`, and every state MUST have a reduced-motion equivalent.
- **FR-033**: The camera MUST be a damped follow/orbit rig with a central deadzone, directional look-ahead, an establishing dolly-in on world enter, region focus, and bounded user orbit per the golden camera config (§8.20); **every camera motion MUST have a reduced-motion cut/instant equivalent** and the game MUST keep depth (elevation/parallax) while stopping ambient motion under reduced motion / lower tiers.
- **FR-034**: All interaction motion MUST derive from the deterministic motion-token registry (`MOTION`/`EASINGS`, §8.10) + the damping-lambda registry (`LAMBDAS`, §8.21) via `resolveMotion(kind, { reducedMotion })`; **every** entry in the master motion table (§5.6) MUST have a first-class reduced-motion equivalent, and the excluded effects (§5.6) MUST NOT appear. DOM/HUD motion MUST be implemented with **`motion@^12`** (`motion/react`).
- **FR-035**: Each cosmetic MUST carry a deterministic text `look`/`equipEffect` visual descriptor and a reduced-motion form (§8.15); cosmetic visuals MUST remain **zero-power** and the type MUST still expose **no** `price`/`currency`/`dropRate`/`rarity` field (FR-008/009).
- **FR-036**: Cohort-base features MUST place into deterministic zones/slots via `resolveBaseLayout(base)` (§8.16), remain **attributable** (pseudonymous contributor + mission) and **zero-power**, and place in contribution order with a deterministic fallback slot for unknown features (replayable).
- **FR-037**: Sound MUST be **muted by default**, captioned in the Ledger, non-looping, and never engagement-timed; cue selection MUST be deterministic via `resolveSoundCue(event)` (§8.18); the **error/"not-yet" cue MUST be neutral** (never an alarm/negative sound — an error is not a loss).
- **FR-038**: A **first-run onboarding** sequence (DOM coach-marks) MUST convey traverse → unlock → plain-mode/Ledger/standings-off, MUST be skippable and dismissible on any input, MUST NEVER block/delay a mastery action (FR-022), MUST be fully mirrored in the Ledger, and MUST honor reduced motion.
- **FR-039**: A deterministic `ASSET_KEYS` registry (§8.17) MUST key every asset; the loader MUST try **committed model/atlas → procedural geometry/material** so a missing asset still renders, with **no external fetch** (FR-030); procedural fallbacks MUST be seeded (no `Math.random`).
- **FR-040**: Canvas presentation MUST resolve per age band via `resolveVisualBand(band)` (§8.19); the **6-8 band MUST show no raw number on the canvas** (`showCanvasNumbers=false`) and cap the celebration ceiling; the underlying state MUST be identical across bands (`plainViewEquals`, FR-029).

**3D lighting, quality ladder & fallback (new)**

- **FR-041**: The world MUST implement **mastery-as-light**: an `unlocked` node MUST light a **beacon** (a real dynamic point light on Tier A/B; emissive+bloom beyond the per-tier light cap or on Tier C), `available` MUST show a warm glow, `locked` MUST be dim/cool and unlit; the lighting rig MUST derive deterministically from `resolveLighting(tier, worldTheme)` (§8.20) and MUST NOT be a state cue by color alone (icon/shape/light-presence together, FR-031).
- **FR-042**: The 3D world transform MUST be deterministic: `WORLD_SCALE`, per-region `resolveElevation(region)`, and `resolveWorldTransform(layout)` (§8.20) MUST map the §8.1 grid layout to exact 3D positions, replayable and unit-tested (§8.23 golden positions).
- **FR-043**: The client MUST select a rendering **quality tier** deterministically via `resolveQualityTier(caps)` (§8.24) — Tier A (full 3D) / B (reduced 3D) / C (calm static-3D, also the reduced-motion mode) / D (2D/static DOM, no-WebGL) — enforce the golden per-tier budget table (§8.24: DPR cap, shadows, max dynamic lights, water, post-fx, ambient, particle scale), and **auto-degrade** via `nextLowerTier(tier)` on a sustained frame-time overrun; Tier D MUST convey every `ArenaView` state without WebGL and MUST NOT mount the canvas.

### Key Entities

Full shapes in [data-model.md](./data-model.md). Summary: `AgeBand`, `CompetencyNode`, `QuestWorld`, `NodePosition`/`WorldLayout`, `WorldTransform3D`/`NodeTransform3D` *(derived)*, `NodeMasterySignal` *(synthetic input)*, `NodeState` *(derived)*, `ProgressionState` *(derived)*, `Tier`, `Cosmetic` *(no price/rarity field; adds `look`/`equipEffect`)*, `CosmeticEligibility` *(derived)*, `AvatarState`, `AvatarAnimationSpec` *(derived)*, `CohortBase`, `CooperativeMissionResult` *(input)*, `BasePlacement` *(derived)*, `CelebrationEvent`, `MotionSpec` *(derived)*, `MotionToken` *(derived)*, `RewardRepresentation` *(derived, age-band)*, `VisualBand` *(derived, age-band)*, `BiomeIdentity`, `WorldTheme`, `CameraConfig3D`/`ParallaxLayer`, `LightingConfig` *(derived)*, `WaterConfig`/`PostFxConfig` *(derived)*, `QualityTier`/`QualityBudget`/`DeviceCaps` *(derived)*, `SoundCue` *(derived)*, `AssetKeyRegistry`, `NearPeerStanding` *(derived, opt-in; no rank field)*, the composed **`ArenaView`** (with a derived `presentation` block incl. the 3D transform/lighting/camera/quality) that drives every renderer, and the golden constant registries `PALETTE`/`TYPOGRAPHY`/`MOTION`/`EASINGS`/`LAMBDAS`/`LIGHTING`/`CAMERA3D`/`QUALITY_TIERS`.

---

## §7 · Golden fixtures (the canonical synthetic world)

The domain ships fixed fixtures so golden values are exact and stable: `graph.fixture.ts` (world + landmark POIs), `tiers.fixture.ts`, `catalog.fixture.ts` (cosmetics + `look`/`equipEffect`), `biomes.fixture.ts` (§8.12 + elevation §8.20), and `baseLayout.fixture.ts` (§8.16). Constant registries (`PALETTE`, `TYPOGRAPHY`, `MOTION`, `EASINGS`, `LAMBDAS`, `CAMERA3D`, `LIGHTING`, `PARALLAX3D`, `QUALITY_TIERS`, `ASSET_KEYS`, `SOUND_CUES`) live in their modules (§8.10–§8.24) and are exercised by golden tests.

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

All domain values below are **exact** (deterministic; tolerance = 0). UX/motion/render values are **acceptance targets** with the stated tolerance, verified via the walkthrough (not domain unit tests) except where a pure function derives them.

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

| input | mode | particleCount | durationMs | cameraPunch | bloomPeak |
|---|---|---|---|---|---|
| high, motion on | animated | 24 | 800 | true | 1.4 |
| medium, motion on | animated | 12 | 600 | false | 1.1 |
| low, motion on | animated | 6 | 400 | false | 0.7 (no pulse) |
| any, reducedMotion=true | static | 0 | 150 | false | 0.7 (baseline) |

`bloomPeak` is the celebration's transient bloom intensity target on Tier A/B (baseline bloom is `0.7`, §8.20); it is ignored on Tier C (no post-fx) and under reduced motion.

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

Avatar path segment 600ms `Cubic.Out` (±50ms) · node reveal 220ms `Back.Out` peak ~1.05 (±30ms) · available glow pulse 1200ms loop (±100ms; off in reduced/degraded) · camera follow damp lambda 3.5/s (±0.5) · orbit damping factor 0.08 (±0.02) · region focus dist→24 over 300ms (±50ms) · press feedback scale 0.97 for 120ms (±20ms) · particle lifespan 800ms (±100ms) · **target 60fps on the min managed device**, degraded tier caps DPR/lights and disables shadows/water/post-fx (§8.24). Reduced motion: all transforms ≤150ms opacity crossfade or instant; particles off; camera cuts; avatar cross-fades; depth kept. These acceptance targets are the **exact** tokens of §8.10/§8.21 (the domain derives them as testable constants).

### 8.10 Motion tokens + easings (exact) — `MOTION`, `EASINGS`, `resolveMotion`

`MOTION` (durations, ms — exact): `instant:0`, `press:120`, `micro:150`, `fast:220`, `reveal:220`, `base:300`, `zoom:300`, `sceneFade:350`, `runSeg:380`, `celebrateLow:400`, `move:600`, `celebrateMed:600`, `equip:200`, `celebrateHigh:800`, `lantern:900`, `glowLoop:1200`, `intro:1200`, `idleBob:1600`, `particleLife:800`, `islandFloat:8000`, `sunDrift:120000`.

`EASINGS` (three easing / CSS cubic-bézier — exact): `enter:"Cubic.Out"` / `cubic-bezier(0.23,1,0.32,1)`; `move:"Sine.InOut"` / `cubic-bezier(0.77,0,0.175,1)`; `pop:"Back.Out"`; `press:"Quad.Out"`; `loop:"Sine.InOut"`; `intro:"Cubic.InOut"`; `linear:"Linear"`. (Names map to `three` easing helpers / `motion@^12` cubic-béziers; `Back.Out` overshoot ≤1.08.)

`resolveMotion(kind, { reducedMotion })` → `{ kind, mode, durationMs, easing }`. Animated table (exact); under `reducedMotion:true` → `mode:"reduced"`, `easing:"Linear"`, and `durationMs` from the reduced column:

| kind | animated durationMs | animated easing | reduced durationMs | reduced note |
|---|---|---|---|---|
| `press` | 120 | Quad.Out | 120 | kept (non-vestibular) |
| `nodeReveal` | 220 | Back.Out | 0 | instant show + steady beacon |
| `traverse` | 600 | Cubic.Out | 150 | crossfade reposition |
| `run` | 380 | Cubic.Out | 150 | crossfade |
| `regionZoom` | 300 | Cubic.Out | 0 | cut |
| `intro` | 1200 | Cubic.InOut | 0 | cut to rest pose |
| `availableGlow` | 1200 | Sine.InOut | 0 | static ring |
| `tierAdvance` | 600 | Cubic.Out | 0 | instant number |
| `equip` | 200 | Cubic.Out | 0 | instant swap |
| `drawerOpen` | 220 | Cubic.Out | 150 | fade |
| `sceneTransition` | 350 | Cubic.Out | 150 | crossfade |
| `baseAccretion` | 300 | Back.Out | 0 | instant place |
| `standingsExpand` | 220 | Cubic.Out | 0 | instant |
| `onboardBeat` | 300 | Cubic.Out | 0 | static |
| `islandFloat` | 8000 | Sine.InOut | 0 | static elevation |
| `sunDrift` | 120000 | Linear | 0 | static golden-hour |

### 8.11 Palette + typography tokens (exact) — `PALETTE`, `TYPOGRAPHY`

`PALETTE` (exact hex): `seaDeep:#0E2A3B`, `seaMid:#14384C`, `skyDawn:#F4C77B`, `ink:#14202B`, `inkHi:#F5F9FC`, `sun:#F6A23A`, `sunHi:#FFC66B`, `gold:#F2C14E`, `ember:#E8623B`, `locked:#5A6B78`, `notYet:#7FB6D6`, `focus:#FFD166`. Contrast: `inkHi` on `seaDeep` ≈ 13:1 (AAA); `ink` on `skyDawn` ≥ 4.5:1. State color is always paired with an icon/shape and light presence (FR-031). In 3D these are used as material base colors (converted to linear/sRGB by three's color management) and light colors.

`TYPOGRAPHY` (exact): `fontDisplay:'"Fredoka","Baloo 2",ui-rounded,"Segoe UI Rounded",system-ui,sans-serif'`, `fontBody:'"Nunito",ui-rounded,system-ui,sans-serif'`; scale `display{rem:2.5,lh:1.05,ls:-0.02}`, `h1{1.75,1.10,-0.01}`, `h2{1.25,1.20,0}`, `body{1.0,1.5,0}`, `label{0.8125,1.4,0.01}`; `numeric:"tabular-nums"`.

### 8.12 Biome identity (exact) — `biomes.fixture.ts`, `resolveBiome(region)`

| region | name | signatureHex | terrainHex | ambientHex | elevation (units) | landmarks (stable order) |
|---|---|---|---|---|---|---|
| `numbers-coast` | Numbers Coast | #2EC4B6 | #E9D9A8 | #BFE9E3 | 0.0 | Counting Lighthouse, Abacus Jetty, Tide-Pool Terraces |
| `tinker-bluffs` | Tinker Bluffs | #C77D3A | #8A6B4F | #E7C9A0 | 1.5 | Gear Overlook, Gadget Workshop, Copper Kilns |
| `story-vale` | Story Vale | #3E9B5F | #6E8E5A | #CDE3B8 | -0.5 | Whispering Falls, Book-Root Forest, The Open Page |
| `wordwind-reach` | Wordwind Reach | #5AA9E6 | #C9B27E | #DCE9F5 | 2.2 | Letter Landing Field, Windmill Highlands, The Spelling Spires |

`resolveBiome(region)` returns the row; an unknown region throws (world validation guarantees membership). `resolveElevation(region)` returns the `elevation` field (used by §8.23).

### 8.13 Avatar animation (exact) — `resolveAvatarAnimation(intent, { reducedMotion })`

Returns `{ state, loop, durationMs, easing, amplitudePx }`. `amplitudePx` is a **normalized amplitude** the renderer maps to units (§8.26: idle `4`→`0.12u`; celebrate scales the jump). Under `reducedMotion:true` → `loop:false`, `easing:"Linear"`, `state` suffixed `-static`, `durationMs`/`amplitudePx` from the reduced columns.

| intent | state | loop | durationMs | easing | amplitudePx | reduced dur | reduced amp |
|---|---|---|---|---|---|---|---|
| `idle` | idle | true | 1600 | Sine.InOut | 4 | 0 | 0 |
| `walk` | walk | true | 600 | Cubic.Out | 0 | 150 | 0 |
| `run` | run | true | 380 | Cubic.Out | 0 | 150 | 0 |
| `think` | think | false | 900 | Sine.InOut | 3 | 0 | 0 |
| `celebrate-low` | celebrate | false | 400 | Back.Out | 8 | 150 | 0 |
| `celebrate-med` | celebrate | false | 600 | Back.Out | 12 | 150 | 0 |
| `celebrate-high` | celebrate | false | 800 | Back.Out | 16 | 150 | 0 |

### 8.14 *(reserved — superseded by §8.20 3D camera/parallax)*

The 2D camera/parallax constants of the prior Phaser design are superseded by the 3D camera rig and parallax layers in **§8.20**. This subsection number is retained so downstream references (`resolveParallaxLayers`) resolve to §8.20; `resolveParallaxLayers()` now returns the `PARALLAX3D` layer set.

### 8.15 Cosmetic visual descriptors (exact) — extends `catalog.fixture.ts`

Each cosmetic gains `look` + `equipEffect` strings (present, stable; **no** price/rarity). Golden `look` values (catalog order): `avatar-hat-explorer`→"soft tan felt explorer's cap"; `avatar-cape-aurora`→"teal-to-plum aurora-gradient cape"; `avatar-badge-firstlight`→"small gold first-light star pin"; `world-theme-dawn`→"rosier dawn sky and softer light"; `world-theme-dusk`→"deep-indigo dusk with brighter lanterns and stars"; `base-banner-unity`→"co-signed cohort unity banner"; `base-lantern-warm`→"warm lantern strings around camp"; `celebration-bloom`→"unlock burst as flower-petal bloom"; `celebration-aurora`→"unlock burst as aurora ribbons with sky shimmer". `equipEffect` per §5.9. Eligibility/ordering are unchanged from §8.4 (a `look` field never affects eligibility — zero power). `world-theme` cosmetics additionally select a lighting-rig variant in `resolveLighting(tier, theme)` (§8.20) — appearance only, zero power.

### 8.16 Cohort base layout (exact) — `baseLayout.fixture.ts`, `resolveBaseLayout(base)`

Feature → `{ zone, x, y }` (exact, grid units): `campfire`→(hearth, 1024, 1024); `banner`→(gateway, 1024, 928); `garden`→(grove, 944, 1088); `dock`→(harbor, 1104, 1120); `workshop`→(yard, 944, 960); `lookout`→(ridge, 1104, 944). `resolveBaseLayout(base)` returns a `BasePlacement[]` (one per `unlockedFeatures`, stable order) each `{ feature, zone, x, y, by }` where `by` is the attributable contributor from `contributions`. An **unknown** feature id gets a deterministic fallback: `zone:"outskirts"`, `x = 1024 + ((i % 4) - 2) * 80`, `y = 1200 + floor(i/4) * 80` (i = index in `unlockedFeatures`) — replayable. For the §8.8 golden base, placements are `campfire`(hearth,1024,1024,kestrel), `banner`(gateway,1024,928,otter), `garden`(grove,944,1088,kestrel). 3D placement uses `WORLD_SCALE` on `(x,y)` with Base Camp elevation `0.8` (§8.20).

### 8.17 Asset key registry (exact) — `ASSET_KEYS`

Stable grouped keys (declaration order): `avatar:["av-body","av-lantern","av-hat","av-cape","av-badge"]`; `nodes:["node-locked","node-available","node-unlocked","node-beacon"]`; `regions:["isle-numbers-coast","isle-tinker-bluffs","isle-story-vale","isle-wordwind-reach","water","bridge"]`; `base:["prop-campfire","prop-banner","prop-garden","prop-dock","prop-workshop","prop-lookout"]`; `fx:["fx-mote","fx-petal","fx-ribbon","fx-star"]`; `ui:["ui-lock","ui-star","ui-home","ui-audio","ui-help"]`. Every key MUST resolve to a deterministic procedural mesh/material fallback (seeded, no `Math.random`); load order per key = committed model/atlas → procedural (FR-039). `ui:*` keys resolve to committed SVGs (HUD + 2D fallback).

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

### 8.20 3D world, camera, lighting, water, post-fx (exact) — `WORLD_SCALE`, `CAMERA3D`, `LIGHTING`, `PARALLAX3D`, `WATER`, `POSTFX`, `resolveWorldTransform`, `resolveLighting`, `resolveParallaxLayers`, `resolveWater`, `resolvePostFx`

**World transform.** `WORLD_SCALE = 0.03125` (=1/32). `seaLevel = -3.0`. `nodeLiftUnits = 0.6`, `beaconLiftUnits = 1.2`. `resolveWorldTransform(layout)` maps each `NodePosition {x,y}` to `NodeTransform3D { nodeId, x: layout.x·WORLD_SCALE, y: resolveElevation(region)+nodeLiftUnits, z: layout.y·WORLD_SCALE }`. Base Camp elevation = `0.8`. World plane spans `2048·WORLD_SCALE = 64` units centered at `(32, 0, 32)`.

**`CAMERA3D` (exact):** `fov:42`, `near:0.5`, `far:400`, `distanceDefault:32`, `distanceRegion:24`, `distanceMin:18`, `distanceMax:60`, `introDistance:90`, `followLambda:3.5`, `orbitDampingFactor:0.08`, `orbitYawMinDeg:-35`, `orbitYawMaxDeg:35`, `pitchMinDeg:22`, `pitchMaxDeg:62`, `deadzoneRadius:2.0`, `lookAheadUnits:3.0`, `punchDistDelta:-2.0`, `punchFovDelta:1.5`, `punchOutMs:120`, `punchBackMs:180`, `restTarget:{x:32,y:0.5,z:32}`.

**`LIGHTING` (exact) / `resolveLighting(tier, worldTheme)`:** default (golden-hour) rig — `key:{ type:"directional", dir:{x:-0.6,y:0.7,z:0.35}, colorHex:"#FFD9A0", intensity:2.4, castShadow:true }`, `hemi:{ skyHex:"#F4C77B", groundHex:"#0E2A3B", intensity:0.6 }`, `ambient:{ colorHex:"#14384C", intensity:0.25 }`, `rim:{ type:"directional", dir:{x:0.5,y:0.3,z:-0.7}, colorHex:"#7FB6D6", intensity:0.5 }`, `sunDriftDeg:5`, `sunDriftMs:120000`, `shadow:{ mapSize:2048, bias:-0.0004, soft:true }`. Beacon lights: `beacon:{ colorHex:"#F2C14E", intensity:2.0, distance:8, decay:2 }`; transfer-critical beacon `{ colorHex:"#E8623B", intensity:2.6, distance:10, decay:2 }`; available glow `{ colorHex:"#F6A23A", intensity:0.6, distance:5, decay:2 }`. `world-theme` variants: `dawn` → key `#FFCDB0` intensity 2.2, hemi sky `#FBD9C0`; `dusk` → ambient `#1B2A4A` intensity 0.35, key intensity 1.6, beacon prominence +0.4, star cards on. Per tier, `resolveLighting` clamps: Tier A soft shadow 2048; Tier B PCF 1024, `sunDrift` on; Tier C `castShadow:false` (baked look), `sunDrift` off, beacons rendered as emissive+bloom (0 dynamic lights).

**`PARALLAX3D` (exact) / `resolveParallaxLayers()`** (back→front, `{ id, scrollFactor }`): `sky:0.0`, `clouds-far:0.15`, `horizon:0.30`, `sea:0.60`, `world:1.0`, `motes:1.05`, `foreground:1.20`. Under reduced motion / degraded tier the ambient layers (`clouds-far`, `sea` shimmer, `motes`) stop moving but still render (depth kept).

**`WATER` (exact) / `resolveWater(tier)`:** `level:-3.0`, `baseHex:"#14384C"`, `glintHex:"#FFD9A0"`, `shimmerMs:6000`, `foam:true`. Tier A → shader water (animated normals, sun-glint, foam); Tier B → cheap gradient + scroll (no reflection); Tier C → static gradient plane (no motion); Tier D → n/a. Reduced motion → static regardless of tier.

**`POSTFX` (exact) / `resolvePostFx(tier)`:** baseline `bloom:{ threshold:0.6, intensity:0.7, radius:0.4, mipmapBlur:true }`, `vignette:{ offset:0.3, darkness:0.5 }`, `smaa:true`. Tier A → all on; Tier B → bloom only (`mipmapBlur:false`), vignette off, smaa off; Tier C/D → no post-fx. Celebration transiently raises bloom `intensity` to `celebrationMotionSpec.bloomPeak` (§8.5) for the celebration duration on A/B; off under reduced motion.

### 8.21 Damping lambdas (exact) — `LAMBDAS` (continuous in-canvas motion)

`LAMBDAS` (per-second decay rates for `easing.damp*`, exact): `cameraFollow:3.5`, `avatarMove:6.0`, `avatarTurn:8.0`, `beaconRise:4.0`, `bloomPulse:5.0`, `orbit:0.08` (drei OrbitControls damping factor, unitless). Under reduced motion these are unused (values are set instantly). `resolveMotion` continues to own scripted-sequence durations/easings; `LAMBDAS` own the frame-rate-independent continuous eases (interruptible by construction — each frame eases from the live presentation value toward the target).

### 8.22 Beacon / dynamic-light cap (exact) — part of `QUALITY_TIERS` (§8.24)

Maximum concurrent **dynamic** point lights (beacons + base campfire + available-glow), by tier: **A = 8**, **B = 3**, **C = 0**, **D = n/a**. Selection when over the cap: keep the lights **nearest the camera target**, stable-sorted by distance then by node declaration order (deterministic); the rest render as **emissive material + bloom** only. Beacons rise `beaconLiftUnits` (§8.20) on ignition (lambda `beaconRise:4.0`; instant under reduced motion). This cap is the primary lever that keeps the many-beacon endgame within the 60fps budget.

### 8.23 3D world transform golden positions (exact) — `resolveWorldTransform(layoutQuestWorld(world))`

Derived from §8.1 + §8.12 elevation + `WORLD_SCALE=0.03125` + `nodeLiftUnits=0.6`:

| Node | (x, y, z) |
|---|---|
| `count-cove` | (3.0, 0.6, 3.0) |
| `add-atoll` | (9.0, 0.6, 3.0) |
| `place-value-point` | (15.0, 0.6, 3.0) |
| `observe-overlook` | (35.0, 2.1, 3.0) |
| `measure-mesa` | (41.0, 2.1, 3.0) |
| `phoneme-falls` | (3.0, 0.1, 35.0) |
| `blend-bay` | (9.0, 0.1, 35.0) |
| `letter-landing` | (35.0, 2.8, 35.0) |
| `sentence-summit` | (41.0, 2.8, 35.0) |

Island bob: `islandFloatAmpUnits = 0.15`, `islandFloatMs = 8000`, per-region phase = `regionIndex · 1600ms` (regions in §7.1 order). Reduced motion → no bob (static elevation, depth kept).

### 8.24 Quality tiers (exact) — `QUALITY_TIERS`, `resolveQualityTier(caps)`, `nextLowerTier(tier)`

`DeviceCaps` (input) = `{ webgl2:boolean, webgl1:boolean, prefersReducedMotion:boolean, savePower?:boolean, deviceMemoryGB?:number, hardwareConcurrency?:number, isSafari?:boolean, coarsePointer?:boolean }`.

`resolveQualityTier(caps)` (deterministic, in order):
1. `!webgl2 && !webgl1` → **D**.
2. `prefersReducedMotion || savePower === true` → **C** (unless `!webgl2 && !webgl1`, already D).
3. `isSafari || coarsePointer || (deviceMemoryGB ?? 8) <= 4 || (hardwareConcurrency ?? 8) <= 4 || !webgl2` → **B**.
4. else → **A**.

`nextLowerTier(tier)`: `A→B→C→D→D` (idempotent at D). The app calls it when a rolling frame monitor exceeds budget (avg frame > `18ms` over `90` frames → drop one tier; §8.9 acceptance).

`QUALITY_TIERS` golden budget table (exact):

| tier | dprMax | shadows | maxDynamicLights | water | postfx | ambientMotion | particleScale | targetFps | canvas |
|---|---|---|---|---|---|---|---|---|---|
| A | 2.0 | soft PCF 2048 | 8 | shader | bloom+vignette+smaa | on | 1.0 | 60 | yes |
| B | 1.5 | PCF 1024 | 3 | cheap | bloom | on | 0.5 | 60 | yes |
| C | 1.5 | off (baked) | 0 | static | off | off | 0.0 | 60 | yes |
| D | — | — | 0 | 2D | — | off | 0.0 | — | **no (DOM/SVG)** |

`particleScale` multiplies `celebrationMotionSpec.particleCount` (rounded down): A ×1.0, B ×0.5, C/D ×0 (static). Reduced motion forces Tier C behavior regardless of the GPU-derived tier (depth kept, motion off).

### 8.25 Asset upgrade path (non-breaking) — committed models/atlas

Optional committed Draco-compressed glTF under `apps/arena/public/models/` and a texture atlas under `apps/arena/public/atlas/`, keyed identically to `ASSET_KEYS` (§8.17). When present the loader prefers them; when absent the procedural generator renders. Adding them is a non-breaking upgrade (no domain change, no key change). Optional self-hosted subset fonts under `public/fonts/` follow the same rule (system-rounded fallback by default). No CDN/fetch.

### 8.26 Avatar 3D mapping (exact) — renderer contract for `resolveAvatarAnimation`

The domain `amplitudePx` (§8.13) maps to 3D as: idle `4 → position.y bob 0.12u`; celebrate `8/12/16 → jump peak 0.7/0.9/1.0u` with squash-stretch `scaleY 0.92→1.08→1.0`. Move uses `LAMBDAS.avatarMove:6.0` (walk) / faster effective retarget (run) via `easing.damp3` from the live position; facing uses `LAMBDAS.avatarTurn:8.0`. Lantern emissive flickers `0.8↔1.2` on idle, flares on celebrate. Never `scale(0)`; reduced motion → static poses, amplitude 0, lantern steady.

---

## §9 · Phasing (P0…P7) — the build path

Each phase is independently valuable and gated. Work the lowest unfinished phase. Detailed tasks in [tasks.md](./tasks.md).

### P0 — Foundation & green-from-iteration-1

**Goal**: package + app skeletons compile; the gate is green immediately.
**Deliverables**: `packages/arena-world` (`package.json`, `tsconfig.json`, `src/index.ts`, `src/model.ts` types incl. the new art/motion/avatar/camera/lighting/quality/base/sound/visual-band types, fixtures `graph.fixture.ts` (with `landmark`), `tiers.fixture.ts`, `catalog.fixture.ts` (with `look`/`equipEffect`), `biomes.fixture.ts` (with elevation), `baseLayout.fixture.ts`, and the constant registries `PALETTE`/`TYPOGRAPHY` (`art.ts`), `MOTION`/`EASINGS` (`motion.ts`), `CAMERA3D`/`LIGHTING`/`PARALLAX3D`/`WATER`/`POSTFX`/`WORLD_SCALE`/`LAMBDAS` (`scene3d.ts`), `QUALITY_TIERS` (`quality.ts`), `ASSET_KEYS` (`assets.ts`), `SOUND_CUES` (`sound.ts`)); `apps/arena` skeleton (`package.json`, `next.config.mjs`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx` placeholder, `app/globals.css` with the §8.11 palette/typography tokens + reduced-motion/reduced-transparency + plain-mode hooks + `:focus-visible` rings, `.env.local.example`, `.gitignore`); a **seeded smoke test** (`test/smoke.test.ts`) that imports the package and asserts the fixture builds.
**Gate**: `pnpm typecheck` + `pnpm test` green.

### P1 — Quest-world map + mastery gate (US1) 🎯 MVP

**Goal**: the graph renders as a traversable 3D overworld with the Independence Isles art direction; nodes unlock ONLY via gate + prereqs; deterministic layout + 3D transform; calm reduced-motion + accessible Ledger convey identical states.
**Domain**: `buildQuestWorld` (+landmarks), `layoutQuestWorld`, `deriveNodeStates`, `resolveBiome`/`resolveElevation`, `resolveWorldTransform`, `resolveMotion`, `resolveAvatarAnimation`, `resolveParallaxLayers`, `resolveLighting`, `resolveQualityTier`/`nextLowerTier`, initial `buildArenaView` (map + states + layout + `presentation` block: biomes, world transform, camera3d, parallax, lighting, avatar anim, quality tier, asset keys). **App**: `ArenaCanvas` (r3f `<Canvas>`, client-only, context-loss handlers) / `LightingRig` / `SeaAndSky` / `WorldRoot` (floating biome islands, node markers per state color-independent, lit paths/bridges, beacon placeholders) / `Avatar` (idle/walk/run) / `CameraRig` (follow + deadzone + look-ahead + dolly-in); the calm reduced-motion tier; the accessible Ledger tree (landmark names); synthetic mastery-signal feed; `Fallback2D` stub.
**Gate**: P0 gate + `next build` + smoke (zero console/WebGL errors) + walkthrough steps 1–2, 5.

### P2 — Tiers + deterministic cosmetics + avatar (US2)

**Domain**: `computeProgression`, `tierForReward`, `deriveCosmeticEligibility` (+`look`/`equipEffect`), `equipCosmetic`; extend `buildArenaView`. **App**: tier/growth panel (tabular ticker, `motion@^12`) + cosmetic drawer (equip eligible only; locked shows the **earn goal**, never a price/roll) + avatar cosmetic child-mesh swap on canvas (`Crossfade`), world/base theme cosmetics recolor + lighting-rig variant.
**Gate**: P1 gate + walkthrough steps 3–4.

### P3 — Juice + errors-never-loss (US3)

**Domain**: `classifyCelebration`, `celebrationMotionSpec` (+`bloomPeak`), `resolveSoundCue`, `resolvePostFx`, `resolveWater`. **App**: `Fx` orchestrated celebration sequences (§5.7: 3D Burst + Bloom-pulse + Beacon-ignition + Camera-punch on high; Warm-Pulse on struggle) driven by `celebrationMotionSpec`+`resolveMotion`+`LAMBDAS`; `PostFx` (bloom/vignette) per tier; the calm `--notyet` wisp on error (no loss visual/shake, node unchanged); muted-by-default captioned sound cues; first-run onboarding coach-marks (`FR-038`, `motion@^12`); reduced-motion equivalents throughout.
**Gate**: P2 gate + walkthrough step 6.

### P4 — Persistent cohort base (US4)

**Domain**: `applyCohortContribution` + `unlockedFeatures` + `resolveBaseLayout`. **App**: `BaseCamp` renders the co-built Base Camp island into deterministic zones/slots (§8.16) with attributable pseudonymous lantern-marks; `Pop-in place` accretion; the "home" landing (camera glide) when standings are off.
**Gate**: P3 gate + walkthrough step 5 (base).

### P5 — Age-band staging + plain mode + near-peer standings (US5)

**Domain**: `resolveRewardRepresentation`, `resolveVisualBand`, `deriveStanding`, `plainViewEquals` (state-identical across bands/plain/reduced/tier). **App**: age-band switch (re-renders canvas presentation: 6-8 no canvas numbers / story labels / larger markers / medium celebration ceiling) + plain-mode toggle + opt-in standings panel (default off; own-gain-vs-band-top, never a rank), all `motion@^12`.
**Gate**: P4 gate + walkthrough steps 7–8.

### P6 — Quality ladder, performance & graceful degradation (US6)

**Goal**: 60fps on the min managed device with the full degradation ladder. **Domain**: finalize `QUALITY_TIERS`/`resolveQualityTier`/`nextLowerTier` + the beacon light cap (§8.22). **App**: wire the tier into the renderer (DPR cap, shadow/water/post-fx toggles, dynamic-light cap + emissive fallback), a rolling frame monitor that calls `nextLowerTier`, the calm Tier C, and the `Fallback2D` (Tier D) DOM/SVG rendering of the identical `ArenaView`; WebGL context-loss → Tier D.
**Gate**: P5 gate + walkthrough step (perf) + the acceptance profile checks.

### P7 — Polish, accessibility & acceptance

**Goal**: WCAG 2.2 AA pass (keyboard/switch/screen-reader over the Ledger, color-independent cues, contrast), reduced-motion parity (calm Tier C keeps depth), mastery action never blocked, seed asset kit committed; README + demo; the final root-tsconfig reference (T-ROOT).
**Gate**: all SCs map green; full quickstart validation.

---

## §10 · Success Criteria *(mandatory)* — each mapped to a test

Domain SCs are Vitest tests in `packages/arena-world/test/`; UI SCs are verified via `next build` + the smoke + the quickstart walkthrough (frame-rate is an acceptance target, not a unit test).

- **SC-001** — No node is `unlocked` unless its gate is cleared **and** all prerequisites mastered; grinding/time never unlocks. → `test/nodes.test.ts` (scenario S1 golden, §8.2), incl. gate-before-prereq + determinism + no time/visit input.
- **SC-002** — Cosmetic eligibility is fully deterministic (identical inputs → identical set) and **no** purchase path exists. → `test/cosmetics.test.ts` (S1 golden §8.4) + `test/guardrails.test.ts` (no `Math.random`, no `price|currency|dropRate|rarity` field in package source).
- **SC-003** — No cosmetic/tier/base changes mastery/node-unlock/matchmaking/standing/access (byte-identical across states). → `test/zero-power.test.ts` (outcome-invariance) + `test/base.test.ts`.
- **SC-004** — Every animated affordance has a reduced-motion equivalent; under reduced motion (calm Tier C) full progression/state/celebration remain conveyable, depth kept, no function lost. → `test/motion.test.ts` (`celebrationMotionSpec` §8.5) + `test/view.test.ts` (`plainViewEquals`) + walkthrough step 7.
- **SC-005** — The same reward event renders in the correct age-band vocabulary; a 6-8 learner never sees the raw mastery-delta headline; comparison off. → `test/staging.test.ts` (§8.6).
- **SC-006** — Plain mode / standings off leaves learning, access, and standing unchanged vs. full-spectacle. → `test/plain-mode.test.ts` (invariance).
- **SC-007** — An incorrect attempt / help request produces no loss event and removes nothing earned. → `test/celebrate.test.ts` (§8.5, `null` + nothing removed).
- **SC-008** — The whole surface runs end-to-end for synthetic learners with no consent/admissions/legal workflow. → `test/synthetic.test.ts` + quickstart.
- **SC-009** — Any opted-in standing is near-peer/anonymized/gain-based and never shows a bottom-rank; no caste rank representable. → `test/standings.test.ts` (§8.7; type has no rank field).
- **SC-010** — The client meets its frame/asset budget on the minimum managed device and degrades gracefully; the game surface never blocks/delays a mastery action. → `next build` + acceptance walkthrough §"Accessibility & performance" + `test/quality.test.ts`.
- **SC-011** — The r3f canvas loads **client-only** with **zero console/WebGL errors** and disposes cleanly on unmount. → seeded smoke (§11) asserting a clean console + a mounted `<canvas>` (Tier A/B/C) / no canvas (Tier D).
- **SC-012** — The accessible DOM Ledger conveys every state to keyboard/switch/screen-reader; canvas is `aria-hidden`; all interactive controls are keyboard-operable with visible focus and ≥4.5:1 contrast. → walkthrough a11y pass + `test/view.test.ts` (Ledger view model completeness).
- **SC-013** — Layout is deterministic and matches the golden positions (§8.1). → `test/layout.test.ts`.
- **SC-014** — `buildArenaView` composes one view that drives every renderer; reduced-motion/plain/tier does not recompute state (parity by construction). → `test/view.test.ts` (`plainViewEquals`, same underlying state).
- **SC-015** — Every interaction-motion value derives from the deterministic token registry and each has a reduced-motion equivalent (§8.10); DOM/HUD motion uses `motion@^12`. → `test/motion-tokens.test.ts` (`MOTION`/`EASINGS`/`resolveMotion` golden table + reduced-motion mode).
- **SC-016** — Avatar animation states resolve deterministically with reduced-motion equivalents; never `scale(0)`; interruptible-by-construction (state carries no absolute start). → `test/avatar.test.ts` (§8.13 golden).
- **SC-017** — Biome identity + palette/typography tokens are exact and stable; state color is paired with icon/shape/light (not color-only). → `test/art.test.ts` (§8.11/§8.12 golden; `resolveBiome`).
- **SC-018** — Camera + parallax + lighting config are exact; every camera motion has a reduced/instant equivalent; depth retained under reduced motion. → `test/scene3d.test.ts` (§8.20 golden).
- **SC-019** — Cohort-base features place into deterministic zones/slots, attributable and replayable; unknown-feature fallback is deterministic; zero power. → `test/base-layout.test.ts` (§8.16 golden).
- **SC-020** — Canvas presentation resolves per age band; 6-8 `showCanvasNumbers=false` + medium celebration ceiling; underlying state identical across bands. → `test/visual-band.test.ts` (§8.19 golden) + `test/view.test.ts`.
- **SC-021** — Sound-cue selection is deterministic, muted-by-default, non-looping; the error/"not-yet" cue is neutral (no alarm/negative cue exists). → `test/sound.test.ts` (§8.18 golden).
- **SC-022** — Every cosmetic carries a stable `look`/`equipEffect` descriptor and the type still exposes no `price`/`currency`/`dropRate`/`rarity`; `look` never affects eligibility (zero power). → `test/cosmetics.test.ts` (§8.15) + `test/guardrails.test.ts`.
- **SC-023** — `ASSET_KEYS` is stable and every key has a deterministic procedural fallback (seeded, no `Math.random`); loader order model→procedural; no external fetch. → `test/assets.test.ts` (§8.17) + app smoke (no network).
- **SC-024** — The 3D world transform is deterministic and matches the golden 3D positions (§8.23); replayable. → `test/world-transform.test.ts` (`resolveWorldTransform`, §8.20/§8.23).
- **SC-025** — `resolveQualityTier` maps each capability profile to the correct tier (no-WebGL→D; reduced-motion/low-power→C; Safari/iPad/weak→B; else A), `nextLowerTier` gives the A→B→C→D path, and the golden per-tier budgets + beacon-light cap (§8.22/§8.24) are exact. → `test/quality.test.ts`.
- **SC-026** — Mastery-as-light: `resolveLighting` yields exact rigs per tier + world-theme; an `unlocked` node contributes a beacon light (capped per tier), `available` a glow, `locked` none; light is never the sole state cue. → `test/lighting.test.ts` (§8.20/§8.22) + walkthrough step 2.

---

## §11 · Stack, commands, env & seeded smoke (pinned)

### Stack

- **Package manager**: pnpm `9.15.9` (workspace; lockfile auto-detected by the harness).
- **Language**: TypeScript `5.6.3`, strict (`tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), Node LTS.
- **Domain**: pure TS, dep `@gt100k/learning-loop` (`workspace:*`) only. **No 3D/render dep in the domain** — it only computes config.
- **App**: Next.js `^14.2.15` App Router + React `^18.3.1` (match `apps/student-compass`), with the 3D + motion stack:
  - **three** `^0.169.0` (WebGL2 renderer, color-management on).
  - **@react-three/fiber** `^8.17.10` (React 18-compatible; the declarative renderer).
  - **@react-three/drei** `^9.114.0` (camera, `<Environment>`, `<SoftShadows>`, `easing.damp*`, `<Html>` billboards, `<OrbitControls>`).
  - **@react-three/postprocessing** `^2.16.3` (`<EffectComposer>` bloom/vignette/SMAA).
  - **motion** `^12` (DOM/HUD/Ledger/onboarding motion — `import { … } from "motion/react"`).
  - `transpilePackages` for the two workspace packages; the `<Canvas>` mounted client-only (`next/dynamic` `ssr:false`), r3f root disposed on unmount.
  - **API discipline**: r3f v8 + drei v9 + postprocessing v2 pair with React 18 (do **not** bump to r3f v9 / drei v10, which require React 19). Use `easing.damp3`/`damp` from drei for continuous motion; use `three`'s easing/`MathUtils` for scripted sequences. Cap `dpr` per tier; enable `frameloop="demand"` where safe. **No** physics engine, **no** external `useGLTF` fetch (only committed `public/models/**` when present, §8.25).
- **Test**: Vitest (root `vitest.config.ts` already globs `packages/**/test/**/*.test.ts` — no root edit).

### Commands

```bash
pnpm install                                   # bootstrap workspace
pnpm typecheck                                 # tsc -b (green after T-ROOT applies the package reference)
pnpm test                                      # Vitest across workspace (domain)
pnpm --filter @gt100k/arena-world test         # domain tests only
pnpm lint                                       # biome check packages adapters apps (covers new dirs)
pnpm --filter @gt100k/arena-world-app dev      # run the 3D experience
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
NEXT_PUBLIC_QUALITY_TIER=auto               # auto | A | B | C | D  (auto = resolveQualityTier)
```

### Seeded smoke (green from iteration 1)

- **Domain smoke** (`packages/arena-world/test/smoke.test.ts`, part of P0): imports the package, builds the fixture world, asserts 9 nodes + 4 regions + a non-empty layout + a non-empty 3D transform + the constant registries (`PALETTE`/`MOTION`/`CAMERA3D`/`QUALITY_TIERS`/`ASSET_KEYS`) non-empty — so `pnpm test` is green from the first increment.
- **App smoke** (P1+, run in the review pipeline's Playwright pass): loads `/`, waits for a `<canvas>` to mount (Tier A/B/C), asserts **zero console errors and zero WebGL errors** (SC-011); forces Tier D and confirms the 2D fallback + Ledger render without a canvas; toggles reduced-motion and confirms the calm tier + accessible Ledger are present and focusable (SC-012).

---

## §12 · Accessibility & reduced-motion equivalence (detail)

- **Reduced motion** (`prefers-reduced-motion: reduce`, honored by default → the calm **Tier C**; overridable to `on`/`off`): continuous eases → instant set; scripted tweens → instant or ≤150ms opacity crossfade; particles off (static badge conveys the unlock); camera cuts to rest pose; avatar cross-fades; ambient (water/clouds/motes/sun-drift/island-bob) off; realtime shadows off (baked look); **beacons shown steady/lit** (baked). **3D depth, elevation, materials, and golden-hour light are kept.** State/progression/celebration remain fully conveyed (FR-015, SC-004).
- **Accessible Ledger** (parallel DOM from the same `ArenaView`, D5/FR-016, SC-012): quest graph as a `role="tree"` (each node a `treeitem` whose accessible name includes title + state "locked/available/unlocked" + region); tier/reward as text (band-appropriate); cosmetics as a labeled listbox (eligible/locked, equip via keyboard); base as a list of features + contributors; celebrations announced via `aria-live="polite"`. Full keyboard/switch operation, visible focus rings, color-independent cues (icon/text/light-presence, not color alone), ≥4.5:1 contrast. Canvas `aria-hidden="true"`.
- **Plain mode**: a low-spectacle rendering (calm palette, no particles, minimal motion) that is state-identical to full-spectacle (`plainViewEquals`, SC-006). Distinct from but compatible with reduced motion.
- **Reduced transparency / contrast**: `prefers-reduced-transparency` → solid HUD panels (no blur); `prefers-contrast: more` → near-solid panels with defined borders.
- **Free opt-out**: plain mode / standings-off / a lower quality tier never change learning, access, or standing (FR-020, SC-006).

---

## §13 · Pre-marked decision points (defaults + severity)

The loop proceeds on the **default**; it escalates only per §3.

- **DP-1 — Canvas accessibility approach. ✅ RESOLVED (settled decision).** **Chosen: a synchronized parallel accessible DOM ("Arena Ledger")** adjacent to the canvas, built from the **same `ArenaView`** (one shared view-model drives both the 3D scene and the Ledger), with the canvas `aria-hidden="true"` (D5). Rejected alternatives: (b) a separate `/accessible` route (splits the surface, drifts out of sync); (c) in-canvas a11y plugins (brittle, non-standard). Settled — the loop **does not re-open it**. Reduced-motion equal mode + WCAG 2.2 AA (SC-004/SC-012) unchanged.
- **DP-2 — Rendering engine. ✅ Settled: 3D via react-three-fiber + three.js + drei (WebGL2).** Chosen over an elevated 2.5D Phaser scene because the core "mastery = light" mechanic (§12) is literally a 3D lighting feature (real beacon lights, soft shadows), the floating-island/orbit-camera world is far more impressive, and r3f fits the React app better — while every hard requirement (60fps via the §8.24 quality ladder, reduced-motion equal mode via the calm Tier C, WCAG via the Ledger, no-fetch procedural assets, 2D/no-WebGL fallback) is met. Phaser is dropped; Pixi/Phaser/2D remain acceptable only with a documented reason. **Severity: low** (settled; revisit only under the single documented perf-failure condition in D1).
- **DP-3 — Seed art fidelity.** Default **procedural low-poly geometry (code) + committed SVGs for UI/2D + procedural material fallback** (D6). Upgrading to committed Draco-glTF + atlas later is non-breaking (§8.25). **Severity: low.**
- **DP-4 — Cohort-base feature vocabulary.** Default the fixture set (`campfire`, `banner`, `garden`, …) mapped deterministically from `missionId`. **Severity: low.**
- **DP-5 — Standings peer-band construction (synthetic).** Default: near-peers are a fixed synthetic set; `gainToBandTop = max(gain) − selfGain`. Real pace-band matchmaking is out of scope. **Severity: low.**
- **DP-6 — Art direction & fonts (no-fetch constraint).** Default: the **Independence Isles** identity of §5.1/§8.11/§8.20 — deep-teal void, floating low-poly islands, golden-hour rig, per-biome hues, mastery-as-light beacons — with typography served by a **system-rounded fallback stack** (no external fetch). Self-hosted subset `woff2`, committed glTF, and a texture atlas are **optional, non-breaking** upgrades. The deliberate rejection of a cream/sand bg (the 2026 AI default) is intentional. **Severity: low.**
- **DP-7 — Sound assets.** Default this slice: **no audio asset pipeline** — `resolveSoundCue` returns deterministic cue ids + captions only, muted by default; a real (committed, non-fetched) sample set is a later non-breaking addition. The error cue MUST stay neutral. **Severity: low.**
- **DP-8 — Quality-tier thresholds.** Default the §8.24 `resolveQualityTier` rules + the §8.9 auto-degrade threshold (avg frame > 18ms over 90 frames). If the managed-laptop profile can't hold Tier A 60fps and B/C/D can't recover it, escalate (the one D1 condition). **Severity: normal.**

---

## §14 · Assumptions

- **Builds on feature 001.** `@gt100k/learning-loop` is available and unchanged; this feature reuses `Section`/`SECTIONS`, XP, the mastery-gate concept (`evaluateGate`), and the beyond-floor signal, and adds the game layer on top.
- **Mastery/reward signals are synthetic and injected** as `NodeMasterySignal` (from a stub/simulator); this feature owns the *game representation of* mastery/reward, not the mastery engine or the tutor. A real source can replace the stub with zero domain change.
- **Synthetic-only, governance stubbed.** No real learners/consent/admissions/legal; safeguarding routing (FR-025) is a fail-closed hook, not a live pipeline.
- **Age-band defaults are [E3] operating defaults**, not research-validated optima (§14.7/§14.13); raising competitive exposure would need fresh child assent + dose caps (out of scope for the synthetic slice).
- **Child-facing surface.** This is a child-facing surface, so the child-safety guardrails of this spec (FR-026) apply. Evidence posture **[E3]/[R]**: engagement/belonging lift is measured against belonging and voluntary return (§2.6), never assumed to improve learning; a mechanic that raises time-in-app while depressing belonging/voluntary return **auto-reverts** (the §15 rollback gate).
- **Performance budget is an acceptance target.** 60fps on the min managed device (Tier A laptops / Tier B iPad-Safari) is validated by `next build` + the acceptance walkthrough + `test/quality.test.ts` (the tier logic), not by a rendering unit test (the pure domain carries no rendering).
- **Managed-device profile.** The minimum managed device is an integrated-GPU managed laptop (full Tier A) and iPad/Safari (reduced Tier B); weaker/no-WebGL devices are served by Tiers C/D. WebGL2 is assumed available on the managed fleet; the Tier D fallback covers its absence.
- **New dirs only.** All code lives in `packages/arena-world` + `apps/arena`; shared root files and `apps/student-compass` are untouched except the single final root-tsconfig reference task (T-ROOT).
