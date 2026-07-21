# Phase 0 Research: Interest Lab UI (child probe-picker + guide console)

**Feature**: `003-interest-lab` · **Part II** (UI on top of the done Part-I pure domain) · **Date**: 2026-07-20

This records the decisions behind the UI surfaces so the loop does not re-open them. It complements spec.md **Part II §U2/§U13** (decisions + decision points) and plan.md **Part II**. Values are pinned in spec.md **§U8**.

> **Revision (3D pass).** The child surface is now an explorable **3D world of floating interest islands** (react-three-fiber + drei + three.js) with a **2D-DOM equal/fallback tier**, and all DOM motion standardizes on **`motion@^12`**. R1/R7/R8 below are updated; R9/R10/R11 are new.

## R1 — Rendering approach: a 3D child world (react-three-fiber + drei + three.js) + a 2D-DOM equal/fallback tier

**Decision.** The child **Curiosity Quest World** is a **real 3D scene** on a WebGL `<Canvas>` (react-three-fiber + drei + three.js) — floating interest islands (one per domain), glowing quest-markers, dusk light, gentle idle motion, a drifting/focusing camera. The guide **Hypothesis Console** stays DOM/SVG (coverage grid + evidence columns + timeline + lifecycle diagram + prose) with an **optional, tasteful r3f "evidence constellation"** depth viz. All of it is driven by **one deterministic view model** (D-U3) across **three tiers**: `quest-world-3d` (full) → `quest-world-3d-lite` (degraded) → `board-2d` (the calm/accessible/reduced-motion/no-WebGL fallback — the classic card-constellation board).

**Why.**
- **The vision demands a world, not a form.** "An explorable, tactile 3D world of floating islands you sail/hop between, with warm light and gentle idle motion" is inherently volumetric — depth, atmospheric fog, and idle float are the delight. A flat card grid cannot carry it. r3f + drei give exactly the primitives (scene graph, `useFrame`, `<Float>`, `<Sparkles>`, `<OrbitControls>`, `<PerformanceMonitor>`, `<AdaptiveDpr>`) with a React-idiomatic, declarative surface.
- **Accessibility stays DOM-native.** The `<Canvas>` is `aria-hidden="true"` and **never the sole affordance**; every quest is a real, focusable DOM control (an ordered "quest ledger") from the same view model. Keyboard/switch/screen-reader users operate the DOM; the 3D camera *mirrors* focus. This mirrors feature 004's settled "one view model → canvas + accessible DOM" pattern (D5/DP-1), adapted to r3f. WCAG 2.2 AA (UI-FR-013) is met by construction.
- **60fps + graceful degradation is first-class.** drei `<PerformanceMonitor>` + `<AdaptiveDpr>` + a deterministic `resolveQualityTier`/`resolveRenderTier` step the scene down (full → lite → 2D) on weak devices / low FPS / no-WebGL / lost context / `Save-Data` / `deviceMemory<4`, holding the budget without losing a quest (SC-UI-14/16).
- **The pure view layer stays GPU-free and testable.** The view package emits **numbers** (island positions, camera framing, quality tiers) — it imports no `three`/`react`. Every scene value is a Vitest golden (§U8.13/§U8.14/§U8.16), so the 3D world is verified without a GPU, and `plainViewEquals` proves tier is presentation-only.
- **Craft fit both ways.** Apple fluid-motion + Emil craft apply to the DOM tier (springs, `@starting-style`, `clip-path`/`mask`, `backdrop-filter`, origin-aware transforms, blur-masked crossfades, stagger — via `motion@^12`) **and** to the 3D tier (gentle looped Float/glow idle, an establishing drift-in, damped camera focus, the reserved come-back bloom, an interruptible pick hop).

**Rejected.** (a) DOM/SVG-only (the prior choice) — right for the guide console, too flat for the explorable-world child vision. (b) Canvas-only interaction / text-in-canvas — opaque to AT and forces font fetches; instead interaction + text stay in the DOM and the canvas is decorative-but-synchronized. (c) A heavyweight 2D game engine (Phaser) — feature 004 already owns that lane; r3f is the right tool for a *3D* world and integrates natively with React/Next. Recorded as **DP-U1 (settled)**.

## R1b — Why r3f 8 + drei 9 + React 18 (not r3f 9 / React 19)

**Decision.** Pin **`@react-three/fiber ^8.17.10` + `@react-three/drei ^9.114.0` + `three ^0.169.0`** with React `^18.3.1` (matching `apps/student-compass`).

**Why.** r3f is a React renderer and must pair with a React major: **r3f 8 ↔ React 18; r3f 9 ↔ React 19**. The repo standardizes on React 18.3.1, so the React-18 line (r3f 8 + drei 9) is the low-risk, proven pairing and keeps the interest-lab app consistent with the rest of the monorepo. Upgrading the *app only* to React 19 + r3f 9 later is isolated and non-breaking (recorded **DP-U8**).

## R2 — Architecture: a new pure view package + a separate app

**Decision.** A new pure, **GPU-free** package **`packages/interest-lab-view` (`@gt100k/interest-lab-view`)** holds all render-shaping logic + constant registries + the deterministic 3D scene numbers (it imports no `three`/`react`); **`apps/interest-lab` (`@gt100k/interest-lab`)** is the only place React / `motion@^12` (DOM) / react-three-fiber+drei+three (3D) live. The **Part-I domain package is not modified** beyond consuming its public API.

**Why.**
- Mirrors the proven 001/004 split (pure package + app) and keeps every render rule **Vitest-covered** — the root `vitest.config.ts` globs `packages/**/test`, **not** `apps/**`, so any logic that needs a unit test must live in a package.
- "The pure domain stays the unit-tested core" (the brief): a **separate** view package builds *on top* of the domain without mutating it. The domain's guardrails (no scalar score, guide-authored record, deny-by-default purpose guard) remain the single source of truth; the view package renders them and adds its own **structural** guardrails (no `score`/`rank`/`price`/`verdict` fields, no `Math.random`).

**Rejected.** (a) Folding view logic into `packages/interest-lab` — needlessly mutates the done core. (b) Putting view logic in the app — invisible to Vitest, untestable. Recorded as **DP-U3 (settled)**.

## R3 — Art direction: "The Curiosity Atelier"

**Decision.** A deep **plum-indigo dusk workshop-atrium** for the child board (curiosities glow warm against the night), and a calm **violet-tinted observatory desk / field notebook** for the guide console. Full palette + type in spec **§U8.2/§U8.3**.

**Why (impeccable anti-slop + Apple typography).**
- **Scene sentence** (impeccable): *"A curious child at dusk at a workbench of glowing curiosities; a guide beside a calm observatory desk reading the child's tide-chart of returns."* This forces a **dark, warm-lit** child surface and a **quiet, bright, editorial** guide surface — the answer isn't guessable from the category (avoids the first- and second-order category reflex).
- **Not cream/sand.** The 2026 AI default (warm-neutral near-white body) is explicitly rejected; the child canvas is a saturated **committed** deep plum-indigo, warmth carried by **accent + type + light**, not a beige bg. The guide's light surface is a **violet-tinted** off-white (chroma toward the brand hue), not a warm-cream.
- **Distinct from feature 004.** Arena is golden-hour teal-navy sea; the Interest Lab is plum-indigo dusk — the two sibling surfaces read as different places.
- **Contrast-first** (impeccable/ui-ux-pro-max): `inkHi` on `night` ≈ AAA; `inkMuted` ≥ 4.5:1; every state cue is icon+text as well as color.
- **Typography on a contrast axis** (Apple/impeccable): rounded display (`Fredoka`) for the child's play, a **serif** (`Iowan Old Style`/`Georgia`) for the guide's evidence gravitas, humanist sans (`Inter`) for UI — three roles, not two look-alikes. Size-specific tracking, tabular numbers for guide counts. **No external fetch** — system fallback stacks.

**Rejected.** Golden-hour reuse (too close to 004); cream/sand (AI slop); gradient-text/glassmorphism-by-default/hero-metric/eyebrow scaffolding (impeccable absolute bans). Recorded as **DP-U4 (settled)**.

## R4 — Domain hue is catalog-order-derived, never a taxonomy

**Decision.** `resolveDomainHue(catalogDomainsInOrder, domainId) = HUE_RAMP[index % 12]` (spec §U8.5).

**Why.** The domain package is **catalog-driven** and hardcodes no domain list (IL-001; constitution: no fixed labels). A hardcoded `domain→hue` map would smuggle a fixed taxonomy into the view. Attaching hue to **catalog position** keeps it deterministic and testable while remaining taxonomy-free; the hue is decorative identity only and is **never** a state cue (states use the semantic palette + glyph + text). Recorded as **DP-U5 (settled)**.

## R5 — No dark patterns; the one reserved delight is voluntary return

**Decision.** The child surface has **no** countdowns, streak-break threats, scarcity, FOMO/guilt, or engagement-timed nudges. The single reserved delight is the **voluntary "come back later"** moment; prompted return is never celebrated and visibly recedes.

**Why.** §14.12 (no dark patterns) + PASS-004/005 (voluntary ≠ prompted) + §14.6 (rewards experienced as controlling undermine intrinsic motivation). Celebrating exactly the signal that *survives the removal of pressure* — and refusing to celebrate prompted return — encodes the platform thesis at the surface without manipulation. Copy is concrete and **label-free** ("You came back to this one"), never "you are an X" (§14.5). Recorded as **DP-U6/DP-U7**.

## R6 — Honesty over a number (structural guardrails)

**Decision.** No view type carries `score`/`confidence`/`passionScore`/`verdict`/`label`/`rank`/`percentile`/`price`. Coverage **gaps are visible fields**; competing explanations are a **paired supporting+disconfirming** structure; prompted/support markers carry `lowersSignal:false`; shadow proposals carry `operative:false` with no path to operative.

**Why.** Encodes IL-005/IL-006 (no scalar passion score; gap never hidden behind a number), §14.5 (disconfirming beside supporting; "current evidence suggests"; guide authors the record), IL-011 (shadow proposals stay shadow), and PASS-006/010 (help never lowers a signal; no forbidden-purpose framing) as **structure**, so a grep test (SC-UI-11) proves them rather than relying on review.

## R7 — Motion system as testable golden constants (DOM = `motion@^12`, 3D = r3f)

**Decision.** All motion derives from `MOTION`/`EASINGS` via `resolveMotion(kind,{reducedMotion})` (spec §U8.4); every kind — **DOM and 3D** — has a reduced-motion equivalent. One reserved spring (the pick gesture, `bounce 0.2`); everything else critically-damped/duration-eased/linearly-looped; enter = strong ease-out; reveals = gentle overshoot ≤1.05 (never `scale(0)`). **DOM motion is implemented with `motion@^12`** (`import from "motion/react"`); **3D scene motion is implemented with r3f `useFrame` + drei** (`<Float>`, `<Sparkles>`, `<OrbitControls>`). No other animation engine.

**Why.** Emil (frequency-appropriate, strong custom ease-out, exit-faster/asymmetry, springs for gestures, transitions over keyframes for interruptibility) + Apple (springs interruptible/velocity-aware, camera animates from the live value, reduced motion = gentler not gone) — expressed as constants so the golden motion table (§U6) is machine-checked (SC-UI-08), matching feature 004's rigor. The 3D idle/camera/bloom rows reuse the same tokens (`islandFloat`, `islandFocus`, `driftIn`, `welcomeBack`, `glowLoop`) so the whole motion system is one testable registry.

## R8 — Stack, isolation, root reference

**Decision.** Next `^14.2.15` + React `^18.3.1` (match `apps/student-compass`) + **`motion ^12`** (DOM) + **`three ^0.169.0` / `@react-three/fiber ^8.17.10` / `@react-three/drei ^9.114.0`** (3D, dev `@types/three ^0.169.0`); optional non-breaking full-tier bloom `@react-three/postprocessing ^2.16.3` + `postprocessing ^6.36.3`. `transpilePackages:["@gt100k/interest-lab","@gt100k/interest-lab-view"]`; the `<Canvas>` mounts client-only via `next/dynamic(..., {ssr:false})`; app not in the Vitest glob (verified by `next build`). The only shared-root edit is the final root-`tsconfig.json` reference for `packages/interest-lab-view` (the app, like `student-compass`, is not a `tsc -b` reference).

**Why.** Reuse the repo's proven Next/React versions and workspace globbing (`packages/*`/`apps/*` already covered by `pnpm-workspace.yaml`; `packages/**/test` by `vitest.config.ts`; `packages`/`apps` by the Biome `lint` script) → parallel-safe, one flagged root edit. `motion@^12` is the current successor to `framer-motion` (same API surface, imported as `motion/react`); r3f 8/drei 9 is the React-18 line (R1b). The view package imports **none** of these (it stays pure/GPU-free), so the domain gate never depends on WebGL.

## R9 — Three rendering tiers from one view model (parity + degradation)

**Decision.** One `InterestLabView` (with a deterministic `scene` sub-view) drives **three tiers**: `quest-world-3d` (full WebGL), `quest-world-3d-lite` (fewer motes, no shadows/post-processing, capped DPR), and `board-2d` (the calm DOM card-constellation — reduced-motion/plain/no-WebGL/AT tier). `resolveRenderTier`/`resolveQualityTier` (spec §U8.16) choose the tier deterministically from device caps + flags; drei `<PerformanceMonitor>`/`<AdaptiveDpr>` step down at runtime.

**Why.** It satisfies four hard requirements at once with **one** state source: reduced-motion as a first-class *equal* mode (the 2D tier), 60fps + graceful degradation (lite + runtime step-down), no-WebGL/weak-device robustness (2D fallback), and parity-by-construction (`plainViewEquals` holds because tier is presentation, not state). It mirrors feature 004's "one `ArenaView` → canvas + reduced + Ledger" discipline. Recorded as **DP-U6 (thresholds)**.

## R10 — No external fetch: procedural 3D + DOM text

**Decision.** All 3D geometry is **three primitives** (procedural low-poly islands/markers); glow is **emissive-first** + an **in-app generated** additive halo sprite; motes are drei `<Sparkles>`; **no HDRI/`Environment` presets, no remote GLTF/textures, no web fonts**. All **text is DOM** (never rendered inside the canvas).

**Why.** The constitution/spec forbid external fetch and keep the build deterministic and public-repo-safe; drei `<Environment>` presets and troika `<Text>` both fetch, so they are excluded. DOM text keeps the world accessible (AT reads real text) and crisp. Post-processing bloom and committed GLB islands remain optional non-breaking upgrades. Recorded as **DP-U7/DP-U11**.

## R11 — Accessibility for a 3D canvas: `aria-hidden` canvas + operable DOM ledger

**Decision.** The child world's `<Canvas>` is `aria-hidden="true"`; the **operable, accessible surface is the DOM** — an ordered "quest ledger" of card-buttons (from the same view model) that owns focus/selection, with the 3D camera mirroring DOM focus. Dropping the canvas (Tier C) leaves a fully functional, fully accessible board.

**Why.** WebGL is opaque to assistive tech; per WCAG 2.2 AA and the brief ("any 3D canvas `aria-hidden`; an accessible DOM equivalent, keyboard/screen-reader"), interaction must live in the DOM. Because both the canvas and the DOM ledger render from the one view model (R9), they never drift — parity by construction, exactly as feature 004's Ledger (D5). Recorded as **DP-U1 (settled)**.
