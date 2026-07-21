# Phase 0 Research: Interest Lab UI (child probe-picker + guide console)

**Feature**: `003-interest-lab` · **Part II** (UI on top of the done Part-I pure domain) · **Date**: 2026-07-20

This records the decisions behind the UI surfaces so the loop does not re-open them. It complements spec.md **Part II §U2/§U13** (decisions + decision points) and plan.md **Part II**. Values are pinned in spec.md **§U8**.

## R1 — Rendering approach: React + framer-motion + SVG/DOM (no game engine)

**Decision.** Build both surfaces in the **DOM/SVG** with React and **framer-motion** (`^11`), not on a Canvas/WebGL game engine.

**Why.**
- The child probe-picker is a **quest board of cards / islands**; the guide console is a **coverage grid + evidence columns + a return timeline + a lifecycle state diagram + prose**. Every one of these is a natural DOM/SVG structure.
- **Accessibility by construction.** A DOM surface is directly operable by keyboard/switch/screen-reader with real focus order and semantics — no `aria-hidden` canvas + a hand-maintained parallel structure (the shim feature 004 needs for its Phaser world). WCAG 2.2 AA (UI-FR-013) is far cheaper and less error-prone here.
- **Craft fit.** The Apple fluid-motion and Emil design-engineering guidance is DOM-native: springs, `@starting-style`, `clip-path`/`mask` reveals, `backdrop-filter` materials, origin-aware transforms, blur-masked crossfades, stagger. framer-motion gives interruptible springs, `AnimatePresence`, and `layout`/shared-element transitions with `useReducedMotion` gating.
- **Lean build.** No WebGL runtime, no asset atlas pipeline, no context-loss handling; `next build` stays small and deterministic.

**Rejected.** Canvas/Phaser (feature 004's choice) — right for a *traversable 2D game world*, wrong for card/grid/timeline surfaces that must be AT-native. Recorded as **DP-U1 (settled)**.

## R2 — Architecture: a new pure view package + a separate app

**Decision.** A new pure package **`packages/interest-lab-view` (`@gt100k/interest-lab-view`)** holds all render-shaping logic + constant registries; **`apps/interest-lab` (`@gt100k/interest-lab-app`)** is the only place React/framer-motion/DOM live. The **Part-I domain package is not modified** beyond consuming its public API.

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

## R7 — Motion system as testable golden constants

**Decision.** All motion derives from `MOTION`/`EASINGS` via `resolveMotion(kind,{reducedMotion})` (spec §U8.4); every kind has a reduced-motion equivalent. One reserved spring (the pick gesture, `bounce 0.2`); everything else critically-damped/duration-eased; enter = strong ease-out; reveals = gentle overshoot ≤1.05 (never `scale(0)`).

**Why.** Emil (frequency-appropriate, strong custom ease-out, exit-faster/asymmetry, springs for gestures, transitions over keyframes for interruptibility) + Apple (springs interruptible/velocity-aware, reduced motion = gentler not gone) — expressed as constants so the golden motion table (§U6) is machine-checked (SC-UI-08), matching feature 004's rigor.

## R8 — Stack, isolation, root reference

**Decision.** Next `^14.2.15` + React `^18.3.1` (match `apps/student-compass`) + `framer-motion ^11.11.0`; `transpilePackages:["@gt100k/interest-lab","@gt100k/interest-lab-view"]`; app not in the Vitest glob (verified by `next build`). The only shared-root edit is the final root-`tsconfig.json` reference for `packages/interest-lab-view` (the app, like `student-compass`, is not a `tsc -b` reference).

**Why.** Reuse the repo's proven Next/React versions and workspace globbing (`packages/*`/`apps/*` already covered by `pnpm-workspace.yaml`; `packages/**/test` by `vitest.config.ts`; `packages`/`apps` by the Biome `lint` script) → parallel-safe, one flagged root edit.
