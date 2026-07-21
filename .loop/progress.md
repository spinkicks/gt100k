# Loop progress — evidence-explorer (002) · DECLUTTER / simplicity pass → 3D craft (claude)

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

## Done this turn (Turn 2 — header declutter → diegetic telemetry readout)
The header was the worst always-on AI-demo tell: a **wordy prose sentence** ("A content-addressed
evidence DAG — X nodes in the milestone, Y unlinked, Z provenance threads") plus **two pill badges**,
one of which ("3D cosmos · calm-2D equal mode") described the *tool*, not the content — a textbook
"explanatory paragraph where a label would do." Rebuilt `.obs-header` in `Observatory.tsx` + CSS:
- **Kept** the diegetic title block (eyebrow "Provenance Observatory" + `h1` "Milestone <ref>");
  tightened display tracking to `-0.025em` / leading `1.02` (apple-design §15 size-specific type).
- **Replaced** the prose + badges with a compact **telemetry readout strip** — three frosted **stat
  tiles** (`nodes` · `unlinked` · `threads`, each a 1.5px glyph + tabular-nums count + uppercase
  label) and one **"Synthetic" status chip** with a softly pulsing verify-teal dot. Reads like a game
  HUD readout, not a sentence. Deleted the whole prose clause + the tool-describing badge.
- **Materials** (apple-design §12): tiles are translucent (`backdrop-filter` blur+saturate over the
  void) with an inset top-edge highlight + soft drop shadow; labels use vibrancy (heavier weight,
  higher contrast) for legibility over the blur. Degrades to solid under reduced-transparency.
- **Motion**: the status dot's pulse is neutralised by the existing global reduced-motion rule (no new
  media block — that shifted the motion-budget test's `indexOf`; folded back out).
- New cohesive glyphs in `components/icons.tsx`: `NodesIcon` (diamond node), `UnlinkedIcon` (radiating
  lone body), `ThreadsIcon` (two bodies joined) — same 1.5px `currentColor` set, all `aria-hidden`.

Gate GREEN: `tsc -b` clean · 66/66 vitest · `next build` ok · rendered `index.html` verified (readout +
`aria-label="Milestone summary"` + all 3 stat counts + Synthetic chip present; prose clause + both old
badges/`obs-sub`/`obs-badges`/`.badge` classes absent from the DOM; the only remaining "…evidence DAG…"
string is the `<meta name=description>` SEO tag in `layout.tsx`, not visible chrome).

## Done this turn (Turn 3 — 3D craft: image-based ambient + cinematic AO grade)
The worst remaining *visual* tell (chrome now reads calm) was the cosmos missing two of game-feel.md's
non-negotiables: **#2 image-based ambient light** and **#4 subtle SSAO** in the composer — bodies were
lit only by a 3-light rig with no real ambient reflections, so their non-emissive faces read flat.
Rebuilt the lighting in `components/cosmos/Cosmos3D.tsx`:
- **Procedural IBL** — a new `CosmosEnvironment` builds a drei `<Environment>` from four `<Lightformer>`
  area lights (cool focus-cyan key ↑right · warm human-gold rim ↙back · dim model-violet overhead ring ·
  a near-black void floor for contrast). `frames={1}` bakes the cubemap **once** (static → cheap),
  `resolution={64}`, `background={false}` (keeps our `<color>` void + starfield as the visible backdrop).
  **No HDRI preset / no fetch** — fully procedural, honours FR-E19 ("no external fetch, ever") and stays
  headless-safe. Feeds real ambient + soft reflections into the emissive PBR bodies so they seat in the
  volume instead of floating shadeless.
- **Cinematic AO** — added `<N8AO>` (postprocessing's modern SSAO successor; n8ao 1.10 ships transitively)
  as the **first** effect in the `EffectComposer`, void-tinted, `halfRes` + `aoRadius 1.6` — subtle
  crevice shading on the multi-part bodies (world+ring, blueprint shell+core, seal-sun+seal) before Bloom.
- **Ambient rebalanced** — dropped `ambientLight` 0.35→0.22 **on spectacle only** so the IBL + key/rim
  carry the contrast rather than a flat wash (standard3d keeps 0.35; calm2d unchanged).
- Both IBL + N8AO ride the existing **`spectacle` gate** (cinematic && !plainMode), exactly like Bloom /
  DOF / Vignette — so standard3d, plain mode, and calm-2D are byte-for-byte unaffected.

Gate GREEN: `tsc -b` clean · 66/66 vitest · `next build` ok. **Live Playwright walkthrough** (swiftshader
WebGL, 1440×900): cinematic 3D mounts + renders the graded scene (glowing bodies, bloom/DOF/vignette,
new IBL/AO — no artifacts, no dark halos), **zero console/page errors**, 13-item Ledger, Trace lineage +
ledger fly-to + Verify seal + Filters/Display drawers all work. Under *software* WebGL the pre-existing
`PerformanceMonitor` self-heals cinematic→standard3d→calm2d (SC-E21) — expected; on real GPU it holds
cinematic (captured in the load screenshot before degrade). Every tier is a usable, polished state.

## Still generic / next targets (judged vs game-feel.md)
- The cosmos now has IBL + AO + bloom/DOF/vignette + rig + damped cinematic camera. Remaining 3D polish:
  soft `<ContactShadows>` was **deliberately deferred** — a floor plane implies ground that fights the
  floating-constellation concept (see EE-003); revisit only if a subtle grounded glow-plane reads right.
  Could also add per-material `envMapIntensity` tuning + a faint fresnel rim to make the IBL read stronger.
- **Inspector** still fairly wordy — move inputs/consent/payload behind a single "Details" expander so
  the default popover shows only label/actor/hash/time (progressive disclosure, not yet done).
- **Ledger** panel is a dense scrolling list — could gain more rhythm/whitespace.
- Consider a settings **popover anchored to its trigger** (apple-design) instead of inline drawer if the
  rail gets tall on small viewports.

## NEXT
- Turn 4: **make the new IBL read stronger + finish the material pass.** The env is baked but the bodies
  are so emissive the ambient reflection is subtle. Add per-role `envMapIntensity` (~0.6–1.0) to the
  `meshStandardMaterial`s in `Bodies.tsx` and a faint **fresnel rim** (thin additive shell or
  `onBeforeCompile`) so silhouettes catch the cool key — this is the cheapest lift from "good scene" to
  "AAA". Keep it behind the `spectacle`/animate flags; don't touch geometry or domain logic. Gate green.
- Fallback simplicity task (if the material pass proves fiddly headless): the **Inspector "Details"
  expander** — the popover still shows inputs/consent/payload inline (see the calm-2D fly-to screenshot,
  quite wordy); move those behind a single "Details" disclosure so the default shows only
  label/actor/hash/time (progressive disclosure, matches the HUD/header declutter already shipped).
- Do NOT add `<ContactShadows>` (EE-003: a floor fights the floating cosmos) unless a grounded glow-plane
  variant is prototyped and clearly reads better.
