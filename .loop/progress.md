## REPO LAYOUT (restructured 2026-07-21)
The repo is now passion-centric: ALL code lives under `passion/apps/`, `passion/packages/`, `passion/adapters/`. There is NO `apps/`, `packages/`, or `adapters/` at the repo root anymore. Work under `passion/`; pnpm-workspace globs are `passion/*`.

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

## Done this turn (Turn 7 — RESET: deliberate "Provenance Instrument" design-token system)
**The escalated brief matters more than T6's "done" marker.** The operator re-reviewed after T1–T6 and
rejected the *look itself*: "still looks a bit cluttered; the **dark gradients, curved edges, and font**
give an overall impression of vibe-coded." T1–T6 decluttered + lit the scene but kept the vibe-coded VISUAL
STACK. This turn is a foundational **chrome-token rewrite** (not a decoration turn — a genuine response to a
stronger verdict), targeting exactly the three named tells + the brief's "extract a token system for
PassionLab" requirement. The 3D cosmos stays dark (it's space; game-feel commits it) — the fix is making the
chrome a *deliberate* matte instrument, not default blue-black glassmorphism.
- **Typography (tell #1) — discovered `layout.tsx` loaded NO real typeface** (system-ui fallback = the
  "generic font" the operator saw). Now loads real self-hosted faces via `next/font` (build-time, no runtime
  fetch → FR-E19): **Fraunces** (optical serif → archival authority) + **IBM Plex Sans** (technical body) +
  **IBM Plex Mono** (hashes). Wired into `--font-*` tokens w/ fallback stacks; optical sizing + serif
  tracking on headings. Verified live: computed `body`=IBM Plex Sans, `h1`=Fraunces (really applied).
- **Geometry (tell #2)** — a deliberate radius scale (`--r-lg 8 / --r-md 6 / --r-sm 4 / --r-pill`) replaces
  the scattered 16/14/13/12/11/10/9/8/7/6px literals, applied consistently; pills reserved for genuine pills
  (segmented tracks, status chip, badges, dots); the two pill-buttons (verify/scrub-play) de-pilled to `-md`.
- **Surfaces/color ("dark gradients")** — dropped every decorative `radial-gradient` glow (body, stage,
  cosmos-viewport, inspector) + all `backdrop-filter` frosted glass → matte graphite steps + hairline +
  restrained shadow tokens; re-pitched palette off blue-black `#0a0e17` → neutral graphite `#0c0d11`; single
  monochrome page depth (not a rainbow); de-neoned the focus accent, single-hue slider fill, killed chrome
  bloom halos (kept transient state-feedback glows). Removed the now-dead `--surface-alpha` + 3 obsolete
  `prefers-reduced-transparency` blocks; refreshed the stale file-header + comment.
- **Token system for PassionLab (§6)** — color/type/geometry/space/elevation authored cleanly in `:root`;
  components reference tokens, never literals.
- **Kept green / invariants:** `--focus` + `:focus-visible` ring, semantic state + node-type hues (FR-E04
  grayscale-safe), the reduced-motion global block (motion-budget `prefers-reduced-motion` index intact,
  keyframes still transform/opacity/filter only, no layout-prop transitions — `border-radius` isn't one),
  no domain/state/3D-geometry touch (SC-E14). Pure chrome refactor.

Gate GREEN: `tsc -b` clean · 66/66 vitest · `next build` ✓ (next/font self-hosted). **Live Playwright**
(Chromium, 1440×900, production `next start`): **0 page + 0 console errors** across load → Trace → Filters →
Display → search (1 match / 0-match empty state) → ledger→Inspector→Details → Verify (Verified) → tamper
(MISMATCH) → calm-2D tier. Every control functional; real empty/error states. Screenshots `/tmp/ee7-*.png`.

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
- **DONE this session — Turn 7 landed the design RESET; `.loop-done` re-created.** The operator's escalated
  verdict (dark gradients / curved edges / font = vibe-coded) is directly addressed by a real, extractable
  **design-token system**: real self-hosted type (Fraunces + IBM Plex Sans/Mono), a deliberate radius scale,
  matte-graphite surfaces with no rainbow gradients / no frosted glass, de-neoned restrained accent. Verified
  usable end-to-end in Chromium (0 console + 0 page errors; every control functional; real empty/error
  states). The chrome now reads as a deliberate "Provenance Instrument," not an AI dashboard.
- **If the loop re-invokes:** do NOT invent a decoration turn (game-feel #1 forbids over-decorating a
  now-calm, cohesive world). Re-run the gate + a fresh adversarial critic sweep (actually *inspect* the
  rendered surfaces — a scorecard can lie), confirm nothing regressed, re-create `.loop-done`. The token
  system is the leverage point — any further chrome change should go THROUGH the tokens, never hardcode.
- **Genuine candidates for a future turn (not blockers):**
  1. **3D bodies vs the new chrome:** the glowing planet/star primitives read a touch toy-like against the
     serious matte-instrument chrome. A *scene* taste-tune (glowing-nodes is the committed concept; changing
     node representation is larger scope + GPU-eyes work) — do it deliberately, not blind.
  2. **GPU-eyes taste-tunes** (unchanged): bloom/rim/vignette/DoF balance, per-body `envMapIntensity` — need
     a real GPU; block no non-negotiable; forcing them blind risks over-decoration.
- Do NOT add `<ContactShadows>` (EE-003: a floor fights the floating cosmos) unless a grounded glow-plane
  variant is prototyped and clearly reads better.
- Do NOT revert to blue-black + neon-glow + frosted-glass chrome (EE-007): that is the exact vibe-coded look
  the operator rejected. The matte-graphite instrument palette is the committed direction now.

---

# Interest Lab shared core (lane 0) — 2026-07-21

## Done this turn — P0 scaffolding + green seeded smoke
- Reconciled the stale Evidence Explorer ledger with the requested Interest Lab lane and started at P0;
  no prior Interest Lab core gate failure existed.
- Added the exact P0 domain contracts (`ActivityEvent`, `ActivityKind`, `ReturnGrid`, and revisable-
  hypothesis shapes) with deterministic shape-level placeholders in `@gt100k/interest-lab`.
- Added the pure Curiosity Map, time-lapse, host, activity-model, and `Qa` contracts/placeholders in
  `@gt100k/interest-lab-view`; kept the package React/Three-free and documented the public surface.
- Created `@gt100k/interest-zone-kit` with the frozen `ZonePlugin` / `RoomProps` / `ActivityEmit` seam,
  registry validation, exact nine-probe synthetic catalog/config, and three deliberately plain stub zones.
- Added the app-level seeded P0 smoke and static import-graph guard. Root Vitest now runs the Interest Lab
  app suite with the automatic JSX runtime, so SC-CORE-01 and SC-CORE-15 are part of `pnpm test`.
- SC status: **SC-CORE-01 green**, **SC-CORE-13 green**, **SC-CORE-15 green at its P0 shape level**;
  SC-CORE-02…12/14 remain assigned to P1…P6, and manual SC-CORE-16 is excluded.
- Gate evidence: `pnpm typecheck` ✓; `pnpm test` ✓ (**99 files, 467 tests**); lane-owned Biome check ✓;
  `pnpm --filter @gt100k/interest-lab-app build` ✓ (static `/` prerender). Repo-wide `pnpm lint` still
  reports unrelated pre-existing Evidence Explorer formatting diagnostics; no unrelated files were changed.
- `.loop-done` remains absent because only P0 of P0–P7 is complete.

## NEXT
- **P1 — implement the exact return grid, novelty gate, and engagement-event bridge test-first.** Add
  `ACTIVITY_GOLDEN_V1`, `ACTIVITY_GOLDEN_WORKMODE_V1`, and `ACTIVITY_GOLDEN_INSUFFICIENT_V1`; make
  `buildReturnGrid` equal `GRID_GOLDEN_A/B` exactly; prove day-0 novelty, intervention exclusion, and
  assistive/withdrawn dropping; implement `toEngagementEvents` so `summarizeSignals` matches §8.5.
  Acceptance: **SC-CORE-02/03/04/07**, exact §8.1–8.3/8.5 goldens, all existing tests, typecheck, and app
  production build green.

## Done this turn — P1 return grid + novelty gate + engagement bridge
- Added the exact `ACTIVITY_GOLDEN_V1`, `ACTIVITY_GOLDEN_WORKMODE_V1`, and
  `ACTIVITY_GOLDEN_INSUFFICIENT_V1` domain fixtures and exported them from
  `@gt100k/interest-lab`.
- Replaced the P0 grid placeholder with the pinned domain × work-mode algorithm: deterministic
  aggregation/sorting, novelty and intervention buckets, assistive/withdrawn exclusion, configurable
  thresholds, and row/column spike detection with spread and lead-margin gates.
- Added `toEngagementEvents` with deterministic provenance ids, exact activity-kind mapping, novelty
  suppression, intervention carry-through, assistance handling, and withdrawal dropping.
- Added RED-first acceptance suites for exact `GRID_GOLDEN_A/B`, all SC-CORE-03 exclusions, the exact
  §8.5 signal summary, and every bridge mapping.
- SC status: **SC-CORE-01/02/03/04/07/13 green**, **SC-CORE-15 remains green at its P0 shape level**;
  SC-CORE-05/06/08…12/14 remain assigned to P2…P6, and manual SC-CORE-16 is excluded.
- Gate evidence: `pnpm typecheck` ✓; `pnpm test` ✓ (**101 files, 472 tests**); lane-owned Biome check ✓;
  `pnpm --filter @gt100k/interest-lab-app build` ✓ (static `/` prerender).
- `.loop-done` remains absent because P2–P7 are not complete.

## NEXT
- **P2 — implement the revisable hypothesis and guardrails test-first.** Make
  `buildRevisableHypothesis` equal `HYP_GOLDEN_A/B/C` exactly for the three P1 fixtures, including
  supporting/disconfirming copy, ordered coverage gaps, and offered-cell-only distinguishing probes;
  add deep-key and copy guardrails for all domain/view outputs. Acceptance: **SC-CORE-05/06**, exact
  §4.5/§8.4 goldens, all existing tests, typecheck, lane lint, and app production build green.

## Done this turn — P2 revisable hypothesis + guardrails
- Added RED-first acceptance cases for exact `HYP_GOLDEN_A/B/C`; all three failed against the P0
  insufficient placeholder for the expected object differences before implementation.
- Replaced the placeholder with the exact deterministic hypothesis read: topic/work-mode/mixed/
  insufficient classification, stable axis spikes, human-readable supporting and disconfirming evidence,
  domain-then-work-mode coverage gaps, and alternative-testing probes restricted to offered cells.
- Preserved canonical tie-breaking through `WORK_MODES` and `domainOrder`, including the golden
  `symbols_math × investigate` work-mode distinguisher.
- Added deep output-key and fixed-label copy guardrails in the domain package; the existing pure-view
  guardrails continue to statically cover every view type and authored copy literal.
- Updated the domain README to describe the now-real activity and revisable-hypothesis engine.
- SC status: **SC-CORE-01/02/03/04/05/06/07/13 green**; **SC-CORE-15 remains green at its P0 shape
  level**; SC-CORE-08…12/14 remain assigned to P3…P6, and manual SC-CORE-16 is excluded.
- Gate evidence: RED run = 3 expected failures; focused GREEN = **2 files, 5 tests**; package suite =
  **19 files, 92 tests**; `pnpm typecheck` ✓; `pnpm test` ✓ (**103 files, 477 tests**);
  `pnpm exec biome check passion/packages/interest-lab` ✓ (**39 files**);
  `pnpm --filter @gt100k/interest-lab-app build` ✓ (static `/` prerender).
- `.loop-done` remains absent because P3–P7 are not complete.

## NEXT
- **P3 — implement the time-lapse and Curiosity Map view model test-first.** Make
  `buildTimeLapse(ACTIVITY_GOLDEN_V1)` equal §8.7 exactly for day 0/7/30 phases, stable active-cell
  ordering, quieted flags, and latest phase; make `buildCuriosityMapView` equal `MAP_GOLDEN`, including
  return states, unfinished counts, hues, exact aria-label phrases, and unknown-domain rejection.
  Acceptance: **SC-CORE-09/12**, exact §8.6/§8.7 goldens, all existing tests, typecheck, lane lint, and
  app production build green.

## Done this turn — P3 time-lapse + Curiosity Map view model
- Added RED-first acceptance suites for the exact §8.7 day 0/7/30 time-lapse and the complete §8.6
  `MAP_GOLDEN`; both failed against the P0 placeholders for the expected phase and building-state diffs.
- Implemented deterministic time-lapse phases with first-appearance domain ordering, canonical
  `WORK_MODES` ordering, cell deduplication, quieted flags, and latest-phase selection.
- Implemented the Curiosity Map signal projection: eager unknown-domain rejection, catalog/override hues,
  strongest return state, unique explored-probe unfinished counts, row/column building sorting, and the
  exact accessible return-state phrases.
- Kept assistance and withdrawn actions out of map-return/time-lapse signals, with a second verified
  RED→GREEN cycle covering both exclusions.
- Kept the pure-view boundary intact: no React/Three imports, and the acceptance fixture mirrors the stub
  manifest structure locally instead of introducing a reverse dependency on `interest-zone-kit`.
- SC status: **SC-CORE-01/02/03/04/05/06/07/09/12/13 green**; **SC-CORE-15 remains green at its P0 shape
  level**; SC-CORE-08/10/11/14 remain assigned to P4–P6, and manual SC-CORE-16 is excluded.
- Gate evidence: focused RED = **2 intended failures**; exclusion RED = **2 intended failures**; focused
  GREEN = **2 files, 5 tests**; view package = **24 files, 107 tests**; `pnpm typecheck` ✓;
  `pnpm test` ✓ (**105 files, 482 tests**); `pnpm exec biome check passion/packages/interest-lab-view` ✓
  (**46 files**); `pnpm --filter @gt100k/interest-lab-app build` ✓ (static `/` prerender).
- `.loop-done` remains absent because P4–P7 are not complete.

## NEXT
- **P4 — implement the persistent Canvas host and primary DOM Curiosity Map test-first.** Complete the
  `zoneHostReducer` transition table, add `<CanvasHost>` / `<ZoneRoom>` without remounting the one Canvas,
  and add the real-button `<CuriosityMap>` with roving tabindex, arrow-key focus, live selection, and no
  `aria-hidden`. Acceptance: **SC-CORE-08/10**, Canvas mount counter remains exactly 1 across
  `enter→exit→enter`, all exact golden aria labels render, existing tests/typecheck/lane lint/app build green.

## Done this turn — P4 persistent Canvas host + primary DOM Curiosity Map
- Added RED-first acceptance suites for the complete host reducer transition table, a mocked Canvas mount
  counter across `enter→exit→enter`, the board-tier DOM fallback boundary, exact golden map aria labels,
  roving arrow-key focus, live selection, and time-lapse stepping. The five component assertions failed
  for the expected missing P4 exports before implementation.
- Added controlled `<CuriosityMap>` / `<CanvasHost>` / `<ZoneRoom>` components to the shared zone kit.
  The map uses native buttons, one roving tab stop, all four arrow keys, visible return/unfinished cues,
  `aria-pressed` selection, decorative-only glyph hiding, and an always-available `0→7→30` DOM control.
- The host now owns one unconditional `<Canvas frameloop="demand">` with a fixed camera,
  `<AdaptiveDpr>`, and `<PerformanceMonitor>`; room children swap by registry id while `board-2d` renders
  `ActivityDOM` as a sibling outside the still-mounted Canvas.
- Added the React Testing Library/jsdom harness and the zone kit's direct Drei dependency; the lockfile
  importer is complete and a frozen filtered install succeeds.
- SC status: **SC-CORE-01/02/03/04/05/06/07/08/09/10/12/13 green**; **SC-CORE-15 remains green at its P0
  shape level**; SC-CORE-11/14 remain assigned to P5–P6, and manual SC-CORE-16 is excluded.
- Gate evidence: focused RED = **5 intended failures**; focused GREEN = **3 files, 7 tests**; zone-kit
  suite = **4 files, 9 tests**; `pnpm typecheck` ✓; `pnpm test` ✓ (**106 files, 484 tests**);
  `pnpm exec biome check passion/packages/interest-zone-kit` ✓ (**18 files**); frozen zone-kit install ✓;
  `pnpm --filter @gt100k/interest-lab-app build` ✓ (static `/` prerender).
- `.loop-done` remains absent because P5–P7 are not complete.

## NEXT
- **P5 — implement and wire the exact `window.__qa` contract test-first.** Make `buildQaSnapshot` and
  `stateHash()` match §7/§8.8 before and after entering Music; expose `window.__qa` from the app with
  `ready:true`, `primarySurface:"curiosity-map"`, non-primary Canvas plus DOM alternative, three map
  buildings + time-lapse control (and active-zone actions when entered), and live grid/hypothesis reads.
  Acceptance: **SC-CORE-14**, exact initial/entered hashes and interactive ids, existing tests/typecheck,
  lane lint, and app production build green.

## Done this turn — P5 exact `window.__qa` contract + app bridge
- Added RED-first `buildQaSnapshot` acceptance for the exact initial and entered §8.8 hashes, the pinned
  map/control/music-action ids, Canvas/DOM-primary metadata, live grid/hypothesis reads, and `settle()`.
  The entered case failed for the intended reverse-cell-order mismatch before implementation.
- Made `stateHash()` canonical independently of incoming `grid.cells` order by sorting salient cells with
  `domainOrder × WORK_MODES`; the hash now matches both exact goldens while `grid()` and `hypothesis()`
  continue to return the supplied live reads.
- Added a RED-first jsdom app acceptance: the mounted app initially exposed no `window.__qa`, and the
  bridge export was absent. Added `InterestLabQaBridge` with replace-on-update and owner-safe cleanup,
  then installed a deterministic empty-activity snapshot built from the frozen stub catalog/config.
- The mounted app now reports `ready:true`, `primarySurface:"curiosity-map"`, a non-primary Canvas with a
  DOM alternative, `map:music` / `map:code` / `map:art` / `control:time-lapse`, and the exact initial hash.
  The bridge test proves a later entered snapshot replaces the global live and is removed on unmount.
- SC status: **SC-CORE-01/02/03/04/05/06/07/08/09/10/12/13/14 green**; **SC-CORE-15 remains green at its
  P0 shape level**; SC-CORE-11 remains assigned to P6, and manual SC-CORE-16 is excluded.
- Gate evidence: pure/app focused RED = **1 + 2 intended failures**; focused GREEN = **2 files, 4 tests**;
  `pnpm typecheck` ✓; `pnpm test` ✓ (**108 files, 488 tests**); changed-file Biome check ✓ (**4 files**);
  `pnpm --filter @gt100k/interest-lab-app build` ✓ (static `/` prerender). A broad app Biome scan still
  reports unrelated pre-existing formatting in world/UI files; this increment did not modify them.
- `.loop-done` remains absent because P6–P7 are not complete.

## NEXT
- **P6 — implement stub action-model parity and tighten accessibility test-first.** Implement
  `buildZoneActivityModel` and `plainZoneEquals`; derive every stub `ActivityDOM` and `Room3D` action from
  that one model; prove each labeled DOM control emits the exact `ActivityEvent`, and prove DOM/3D/model
  action sets remain equal for music, code, and art. Re-run the Curiosity Map keyboard contract while
  tightening any remaining a11y assertions. Acceptance: **SC-CORE-11** plus tightened **SC-CORE-10**,
  existing tests/typecheck, changed-file lane lint, and app production build green.

## Done this turn — P6 stub action parity + accessible action surfaces
- Added RED-first acceptance for the canonical stub action model, order-independent `plainZoneEquals`,
  exact per-button emissions, and DOM/3D/model parity across music, code, and art. All ten cases first
  failed on the missing P6 runtime export.
- Implemented pure `buildZoneActivityModel` / `plainZoneEquals` in `@gt100k/interest-lab-view`: default
  actions are stable probe-id actions, sorted by id, artifact-kind, title-cased by work mode, and carry
  exactly one primary action per non-empty stub room.
- Made `CanvasHost` inject `buildZoneActivityModel(activePlugin).actions` into both render surfaces, with
  a second RED→GREEN host test proving callers cannot supply a divergent action list.
- Kept each stub deliberately plain: accessible fieldset + labeled native buttons in DOM, labeled box
  meshes in 3D, and exact shared `ActivityEvent` emission from either surface.
- Tightened SC-CORE-10 to exercise all four arrow keys plus wraparound while retaining one roving tab stop,
  native buttons, visible labels, live selection, and a non-hidden primary map.
- Fixed the root gate's silent TSX omission test-first: `pnpm test` now discovers all three zone-kit React
  acceptance suites, with a regression guard for the root Vitest include.
- SC status: **SC-CORE-01…14 green** (all automated criteria through P6); **SC-CORE-15 remains green at its
  P0 shape level** pending P7 exact integration; manual SC-CORE-16 remains excluded.
- Gate evidence: focused RED = **10 missing-model failures + 1 host-derivation failure + 1 root-discovery
  failure**; zone-kit = **5 files, 20 tests**; view = **25 files, 109 tests**; `pnpm typecheck` ✓;
  `pnpm test` ✓ (**112 files, 505 tests**, including component TSX); changed-file Biome check ✓
  (**10 files**); `pnpm --filter @gt100k/interest-lab-app build` ✓ (static `/` prerender).
- `.loop-done` remains absent because P7 is not complete.

## NEXT
- **P7 — integrate the shared core shell and tighten the seeded smoke to every exact golden.** Compose the
  DOM Curiosity Map, persistent `CanvasHost`, registry, append-only activity log, live grid/hypothesis, and
  replaceable QA bridge in the app; tighten `core-smoke.test.ts` to exact `GRID_GOLDEN_A`, `HYP_GOLDEN_A`,
  `MAP_GOLDEN`, entered `stateHash`, and full interactive ids. Acceptance: full **SC-CORE-15**, all
  automated **SC-CORE-01…15**, typecheck, root tests, changed-file lint, and app production build green;
  then create `.loop-done` (SC-CORE-16 remains manual/excluded).

## Done this turn — P7 integrated shared core + exact seeded smoke
- Added the app's single zone merge point (`app/zones.ts`) and a controlled shared-core shell that composes
  the primary DOM Curiosity Map, persistent `CanvasHost`, stub registry, reducer-owned host state, and an
  append-only activity log. Grid, map, revisable hypothesis, active action ids, and `window.__qa` now derive
  live from that state.
- Preserved the exact initial QA hash, then added a RED-first mounted acceptance proving the real DOM path:
  enter Music, advance to day 7, activate Build, and observe the voluntary-return cell and changed QA hash.
- Tightened `core-smoke.test.ts` to the complete `GRID_GOLDEN_A`, `HYP_GOLDEN_A`, `MAP_GOLDEN`, entered
  `stateHash`, and all map/control/Music action ids through the frozen public contracts.
- Freeze point reached: `ZonePlugin`, `RoomProps`, and `ActivityEvent` are now lane-0 frozen; downstream
  zones replace only the `ZONES` registry inputs and must not change these contracts.
- SC status: **all automated SC-CORE-01…15 green**. **SC-CORE-16 remains manual/excluded** and is recorded
  as Partial for the downstream visual review, not an automated lane-0 blocker.
- Gate evidence: focused RED = missing primary Curiosity Map; focused GREEN = **2 files, 4 tests**;
  changed-file Biome = **6 files clean**; `pnpm typecheck` ✓; `pnpm test` ✓ (**112 files, 506 tests**);
  `pnpm --filter @gt100k/interest-lab-app build` ✓ (static `/` prerender).
- `.loop-done` created: P0–P7 and the automated definition of done are complete.

## NEXT
- **World-lane handoff only:** replace `STUB_ZONES` at `app/zones.ts` with the three real zone plugins while
  keeping the frozen `ZonePlugin` / `RoomProps` / `ActivityEvent` contracts byte-for-byte compatible.
  Acceptance: SC-CORE-01…15 and the full gate remain green; SC-CORE-16 receives the operator's manual review.
