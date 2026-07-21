# Loop progress — evidence-explorer (002) · DECLUTTER / simplicity pass (claude)

## Task
Elevate **apps/evidence-explorer** (the "Provenance Observatory") to the SIMPLICITY bar.
Keep the cinematic 3D DAG + build timeline; the problem is the **chrome is too cluttered**.
Do NOT change domain/evidence logic; keep tests green.

## Art direction (committed — keep cohesive)
- World: **cinematic dark cosmos**. Palette: --void #0a0e17, panels #121826/#1a2233, ink #eaf0fb,
  focus cyan #7dd3fc (primary/interaction accent), verify teal #34e5b0 (on/success), per-type node hues.
- Type: Space Grotesk (display) + Inter (body) + JetBrains Mono. Radii 10–16px. Frosted `.panel`.
- Motion: `motion@12` springs (`SPRINGS.ui` = bounce 0, 0.4s), reduced-motion → opacity-only.

## Done this turn (Turn 1 — HUD declutter)
The right rail was a **wall of ~24 always-visible controls** across 4 stacked sections
(BODIES 8 toggles · THREADS 6 legend rows · EXPLORE trace+search · DISPLAY tier+motion+plain+captions),
each padded with explanatory sentences. Rebuilt `components/Hud.tsx` as a focused **command cluster**:
- **One primary action** — a tactile, glowing **"Trace lineage"** button (icon + title + one-line sub),
  cyan-accented, lights up (verify/focus glow) when active. The single prominent CTA in the rail.
- **Compact search** — inset field, leading magnifier, fly-to submit; match count only while typing.
- **Two quiet disclosure tabs** — **Filters** (bodies grid + threads legend; badge shows # hidden) and
  **Display** (render tier + reduced motion as real `radiogroup`s + plain/captions switches). Mutually
  exclusive; open with a soft spring height+opacity reveal (`motion` `AnimatePresence`), chevron rotates.
- **Words cut hard**: deleted every "presentation only / toggle a body / system is currently…" paragraph
  (kept one tiny caption inside Display). At rest the rail shows **~4 controls**, not 24.
- New cohesive **icon set** (`components/icons.tsx`) — 1.5px stroke glyphs, currentColor, all decorative.
- Segmented controls are now semantic `role=radiogroup`/`radio` (a11y win; e2e updated to open Display).

Gate GREEN: `tsc -b` clean · 66/66 vitest (incl. a11y svg-aria-hidden) · `next build` ok · SSR HTML
verified (primary + search + tabs render; drawer content absent at rest; zero console errors).

## Still generic / next targets (judged vs game-feel.md)
- The **3D cosmos itself** still needs the visual-craft pass: verify lighting rig (key/fill/rim +
  Environment), soft ContactShadows, PBR/emissive materials over primitives, and the postprocessing
  grade (Bloom/ACES/Vignette/SSAO). That's the biggest remaining "AI-demo tell" once chrome is calm.
- **Header** is still three wordy lines + two badges — could tighten to a compact diegetic title.
- **Ledger** panel is a dense scrolling list; node-detail Inspector still fairly wordy (progressive
  disclosure of inputs/consent/payload behind a "Details" expander not yet done).
- Consider a settings **popover anchored to its trigger** (apple-design) instead of inline drawer if the
  rail gets tall on small viewports.

## NEXT
- Turn 2: **tighten the header + Inspector wordiness** (simplicity pass continues) — compact the
  `.obs-header` to a short title + one status chip, and move the Inspector's inputs/consent/payload
  behind a single "Details" expander so the default popover shows only label/actor/hash/time. Keep the
  gate green (tsc + test + build); write `.loop/commit-msg`. THEN pivot to the 3D visual-craft pass
  (lighting + shadows + materials + postprocessing) now that the chrome reads calm.
