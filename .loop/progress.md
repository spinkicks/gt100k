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

## Done this turn (Turn 4 — Inspector declutter → summary + Details disclosure)
After the HUD (T1), header (T2) and cosmos lighting (T3), the **Inspector was the last wordy chrome
tell**: a `<dl>` of ~7 always-visible fields (Content-address + a note sentence, Actor, Tool, Inputs,
Timestamp, Consent scope, Payload) — the exact "wall of fields" game-feel.md flags, and it ranks
simplicity *above* visual richness. Rebuilt `components/Inspector.tsx` (+ CSS):
- **Default = calm summary** — type glyph + label, the authority badge (human-owned seal / cited ribbon,
  kept: it's the "evidence, not accusation" point), **Content-address + Copy**, the **Actor** chip, and
  **Timestamp**. Three fields, not seven.
- **One-tap Details disclosure** — Tool, Inputs (fly-to lineage links), Consent scope (+ synthetic tag),
  Payload, and the address-fingerprint note now live behind a single **Details** button styled 1:1 with
  the HUD tabs (frosted, chevron rotates, `is-open` cyan tint). Reveals with the same `SPRINGS.ui`
  height+opacity drawer via `AnimatePresence` (opacity-only under reduced motion) — cohesive with the HUD.
- Panel re-mounts per selection (`key={node.id}`), so every open starts **collapsed** (fresh summary).
- **Words cut**: the always-on "content-addressed — the id is the hash…" note moved into Details (still
  plain-mode aware via `panelCopy`); the default card no longer carries an explanatory sentence.
- Did **not** touch `inspector-model.ts` (the unit-tested pure model) or any domain/state (SC-E14 holds).

Gate GREEN: `tsc -b` clean · 66/66 vitest (inspector.test.ts unchanged & green) · `next build` ok.
**Live Playwright walkthrough** (swiftshader, standard-3d tier, 1440×900): opening a Ledger row opens the
Inspector; at rest only address/actor/timestamp render (drawer + consent + payload + inputs absent, toggle
`aria-expanded=false`); clicking **Details** reveals all of them (`aria-expanded=true`); clicking again
removes the drawer (reversible) — **zero console/page errors** on load + every interaction. Screenshots
`/tmp/ee-inspector-summary.png` + `/tmp/ee-inspector-details.png` confirm the calm→full states read well.

## Done this turn (Turn 5 — the 3D material pass: distinct substances + envMap specular + fresnel rim)
With every clutter tell gone (T1–T4) and the scene lit (T3: IBL + AO + bloom/DOF/vignette), the last big
*visual* lift from "good scene" to AAA was the **material language**: all 8 bodies shared one emissive
material (`roughness 0.35 / metalness 0.1`), so a world, a crystal, a gold-star and an obelisk read as the
*same glowing plastic* in eight hues — and with the IBL present they barely caught reflections, so they
read shadeless. Rebuilt the materials in `components/cosmos/Bodies.tsx`:
- **Per-body PBR character** — a new `PBR` map gives each node type a distinct **substance**: matte/chalky
  *construct* (blueprint, roughness 0.6), *icy* comet (roughness 0.15), warm **metallic gold** (gold-star
  metalness 0.7), sharp **glassy** crystal (roughness 0.12), polished beacon/seal. `emissive()` now merges
  a per-body profile including **`envMapIntensity` (0.7–1.5)** so each silhouette catches the cool focus
  key from the baked IBL as a real specular highlight → bodies **seat in the volume** instead of floating
  flat. (`apple-design §7`: every value deliberate; `game-feel §3`: a material *language*.)
- **Faint additive fresnel rim** — a self-contained `RimMaterial` (hand-written GLSL, **no three chunk-name
  coupling** → version-robust) + a `<Rim>` back-shell (scale ~1.05–1.14) clones each body's geometry and
  lights only the grazing silhouette (`BackSide` + `AdditiveBlending` + `depthWrite:false`, `raycast`
  disabled so it never occludes the core or eats picks). Edges now glow **into** the Bloom so bodies pop
  off the void. Kept conservative (`intensity 0.7`, islands halved) — verified live it reads as a gentle
  edge glow, **not** a blown-out halo.
- **Strictly gated** — every material change rides `rich = animate = spectacle` (cinematic && !plainMode),
  the same gate as Bloom/DOF/IBL. When `rich` is false, `emissive()` returns the flat baseline byte-for-byte
  (no `envMapIntensity` key) and **no** rim renders, so **standard3d / plain / calm-2D are unchanged**.

Gate GREEN: `tsc -b` clean · 66/66 vitest · `next build` ok. **Live Playwright walkthrough** (swiftshader,
1440×900): app boots at **Cinematic 3D** → the composer, IBL bake, and the new custom `RimMaterial` GLSL
**all compiled and rendered** (screenshot `/tmp/ee-cinematic.png`: distinct metallic-gold / glassy-crystal /
icy-comet / matte-construct substances + soft rim glow, no washout). Forcing the Cinematic tier held it.
**0 page errors · 0 console `error`s**; the only console warnings (25) are the pre-existing swiftshader
`glBlitFramebuffer` depth-stencil GL-driver noise from the EffectComposer under *software* WebGL (present
since T3), **0 non-GL** — my change adds no app error/warning. Trace lineage, 13-row Ledger → Inspector,
Filters + Display drawers all work.

## Done this turn (Turn 6 — Ledger calm-depth pass: HUD panel, scroll-edge fade, hue-glow dots)
With the cosmos fully lit + materialised (T3/T5) and every other chrome tell decluttered (T1/T2/T4), the
**Ledger** was the last generic surface: a hard-clipped `overflow:auto` list whose header + verify seal
**scrolled away** with the rows, carrying a wordy explanatory intro ("Every evidence node, in provenance
order. Select a row to inspect it — the same view the constellation shows.") — a textbook game-feel #1
"explanatory paragraph where a label does" tell — and rows met the panel edge with a flat clip (reads as a
dashboard table, not depth). Rebuilt `components/Ledger.tsx` + its CSS into a **HUD panel**:
- **Fixed header** — the `.ledger` panel is now a flex column (`overflow:hidden`) with a non-scrolling
  `.ledger-head` (uppercase title + a **tabular count chip**, `13`) pinned above a `.ledger-scroll` region
  that alone scrolls. The title/seal no longer slide out of view. The count is a glanceable HUD readout of
  list scale (replaces the info the deleted intro carried).
- **Scroll-edge depth fade** (apple-design §12) — `.ledger-scroll` carries a **static** `mask-image`
  linear-gradient (16px top+bottom) so rows dissolve into the panel chrome instead of hard-clipping. No
  animation → the motion-budget test (bans layout-prop transitions / non-compositor keyframes) is untouched.
- **Words cut** — deleted the intro paragraph entirely (title + rows are self-evident; the HUD already owns
  "Trace"). game-feel #1 "subtract every turn."
- **Signature hue-glow dots** — each row's `.ledger-dot` now takes the node **type hue via inline `color`**
  (`background:currentColor` + a `color-mix` currentColor glow), so the ledger dots echo the cosmos node
  hues instead of an inkish white glow; dropped the stale `margin-top` (rows are center-aligned).
- **Selected/hover juice** — selected row gains an inset cyan left-accent bar + soft focus glow (box-shadow,
  compositor-safe); hover nudges the row `translateX(2px)`; row gap 4→5px for a touch more rhythm.
- **Orphan cleanup** (impeccable): deleted 7 dead `.ledger-list/.ledger-body/.ledger-head(old)/.ledger-label/
  .ledger-type/.ledger-meta/.ledger-hash` CSS rules + the legacy `.ledger-row` variant (0 TSX usages, left
  over from a prior ledger). Kept the used `.ledger-flag*`.
- **Tier-safe by construction** — the Ledger is the DOM parallel rendered in *every* tier (not 3D-gated), so
  this chrome improves calm-2D / standard-3d / cinematic equally; no 3D code (`Bodies`/`Cosmos3D`) touched.

Gate GREEN: `tsc -b` clean · 66/66 vitest · `next build` ok. **Live Playwright** (Python, 1440×900): count
chip = 13; **`.ledger-intro` gone (0)**; `mask-image` applied; scroll region genuinely scrollable (1082 >
564) with the header staying pinned when scrolled to bottom; dot color = the type hue (`rgb(94,124,226)`,
not white); row-click selects + opens the Inspector; **Trace / Filters / Display (7 radios) / search /
Inspector Details all fire — every control does something, 0 console + 0 page errors** across the whole
walkthrough. Screenshots `/tmp/ee-ledger-{rest,selected,scrolled}.png` confirm the calm HUD read.

## Still generic / next targets (judged vs game-feel.md)
- The cosmos now has IBL + AO + bloom/DOF/vignette + rig + damped cinematic camera + a **per-body material
  language** (distinct substances + envMap specular + fresnel rim, T5). The scene meets game-feel §1–§9.
  Remaining candidates are **taste-tunes best done eyes-on a real GPU** (see caveat) — not blind blockers.
- ~~**Ledger** panel is a dense scrolling list — scroll-edge fade + rhythm.~~ **DONE Turn 6** (HUD header +
  mask fade + hue-glow dots + intro cut). No generic *chrome* candidate remains.
- The Display drawer keeps one caption ("Presentation only — the evidence never changes"); load-bearing
  (explains the state-only guarantee) and inside progressive disclosure, so it stays.
- Rim/envMap **intensity taste-tune**: on a real GPU the fresnel rim + per-body `envMapIntensity` could be
  nudged (e.g. crystal a touch sharper, gold a touch warmer) — but that needs pixel eyes headless can't give.

## Honest caveat (unchanged from EE-003)
Under *software* WebGL (swiftshader) the EffectComposer emits benign `glBlitFramebuffer` depth-stencil
GL-driver warnings and the `PerformanceMonitor` may self-heal cinematic→standard3d on a slow frame — both
pre-existing and environmental. The cinematic composer + rim shaders **do** compile and render here (boots at
Cinematic 3D), but final pixel taste-tuning of bloom/rim balance is ideal on a real GPU; it blocks no
non-negotiable.

## NEXT
- **DONE this session — `.loop-done` created (Turn 6).** All six lifts landed: HUD declutter (T1) · header
  telemetry readout (T2) · IBL+N8AO grade (T3) · Inspector summary+Details (T4) · full per-body material
  language (T5) · Ledger HUD-panel depth pass (T6). The app meets **every** game-feel non-negotiable
  (real lighting+AO+IBL, PBR material language, bloom/DOF/vignette grade, damped cinematic camera, pervasive
  motion/juice, a minimal game-HUD — cohesive to the committed "cinematic dark cosmos" art direction) with
  **none** of the auto-fail anti-patterns, verified by a whole-app Playwright walkthrough (0 console + 0 page
  errors; every control functional; no dead affordances). No load-bearing subtraction and no non-generic
  chrome candidate remains.
- **If the loop re-invokes** (`.loop-done` is gitignored, so the marker is wiped between sessions — it is
  NOT a signal that work was left): do NOT invent a decoration turn. game-feel #1 forbids over-decorating an
  already-calm, cohesive world ("subtract, don't add; density reads as AI"). Instead re-run the gate + a
  fresh adversarial critic sweep (actually *inspect* surfaces, per the D-VP11 "a scorecard can lie" lesson),
  confirm nothing regressed, and re-create `.loop-done`.
- The only genuinely remaining items are **GPU-eyes taste-tunes** that cannot be verified in this GPU-less
  headless env (swiftshader): bloom/rim/vignette balance, a shallow DoF nudge, per-body `envMapIntensity`
  warmth. They block **no** non-negotiable; force them blind and you risk the exact over-decoration the doc
  warns against. Defer to a real-GPU screenshot pass.
- Do NOT add `<ContactShadows>` (EE-003: a floor fights the floating cosmos) unless a grounded glow-plane
  variant is prototyped and clearly reads better.
