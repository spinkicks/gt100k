# The 2D Overworld — CLEARING & MAP: **"Emberwood Clearing"** (the top-down surface, built to maximum depth)

**Date:** 2026-07-21 · **Owner:** David · **Lane:** W/0 (world visuals × the shared overworld) · **Surface:** the 2D
Curiosity Map / the Emberwood clearing · **Zones anchored:** Music `(0,0)` · Code `(1,0)` · Art `(2,0)`

**Scope:** the *concrete, buildable, set-dressed* **2D overworld** of Emberwood — the **Curiosity Map** re-authored as a
cozy top-down **hamlet in a golden-hour forest clearing**. The three cabin INTERIORS each already have a maximum-depth
LAAS build-sheet; this doc is the equivalent build-sheet for the **surface you stand on between them** — the clearing,
the Lodge, the paths, the water, the trees, the ambient life, and the wayfinding. Like the cabins it is content-deferred
v1: a *complete, gorgeous, live place* whose only "go deeper" objects are the cabin doors, and whose only signal is
*which cabin you enter and voluntarily return to*. This is the environment-artist's build sheet for the 2D surface: the
rendering decision, the named hero frame, the coordinate layout, the itemized inventory (placement + scale each), the
color/light/material treatment, the aliveness, the a11y peer, the Chromebook budget, and the LAAS floors/bans/self-score.
**The operator's bar: the 2D surface must genuinely portray a production-ready game — NOT a row of buttons on a
background.**

**Reads first (this doc obeys all of them; where they conflict, the order below wins):**
- [`2026-07-21-world-art-direction-cozy-cabin.md`](./2026-07-21-world-art-direction-cozy-cabin.md) — the Emberwood
  palette (§3.1 hero tokens), the `MAP_COLOR_SCRIPT` (§3.4), materials (§4), the lighting recipe (§5), **the 2D
  Curiosity Map re-theme (§6)** and its hero frame **"Golden Hour in the Clearing"**, the six pillars (§2), the hard
  floors (§9), the banned outcomes (§11), the self-score (§12). **The bible wins on palette / light / budget / theme.**
- [`2026-07-21-interest-lab-core-spec.md`](./2026-07-21-interest-lab-core-spec.md) — the **FROZEN 2D contracts** this
  doc builds to (never change shapes): `MapBuildingView`, `CuriosityMapView` + `buildCuriosityMapView`, the DOM
  `<CuriosityMap>` (real focusable buttons, roving-tabindex, arrow-key nav, **never `aria-hidden`** — the primary
  accessible surface, §5.1/SC-CORE-10), the single persistent `<CanvasHost>` (§5.2/SC-CORE-08), the `TimeLapseView`
  (§4.4), `window.__qa` (§7), the cabin cells + `returnState` (§8.6).
- [`2026-07-21-world-gameflow-movement.md`](./2026-07-21-world-gameflow-movement.md) — the stroll-to-destination
  movement model (§3), the **`ClearingGraph`** baked nav data (§3.2), the map camera (§3.5), the **map→cabin door-push
  transition** (§6), wayfinding (§7), the reduced-motion + DOM-peer rules (§3.7/§10).
- [`2026-07-21-world-aliveness-and-juice.md`](./2026-07-21-world-aliveness-and-juice.md) — the **breath clock** (§5.1),
  the ambient inventory (§5.2), the wind system (§5.3), the cozy-juice grammar (§4.1), the clearing micro-interactions
  (§4.2), and **the firewall: ambient life/juice emit ZERO signal** (§1.2) — *a building-revisit IS signal; the
  fireflies are NOT*.
- [`2026-07-21-cabin-interior-art.md`](./2026-07-21-cabin-interior-art.md) — the **depth/structure template** this doc
  matches (named hero frame, coordinate layout, itemized inventory with placement, materials, lighting, aliveness,
  budget, tiers, floors, bans, self-score, verification).
- [`stylizedWorldAssetPipeline.md`](../../research/stylizedWorldAssetPipeline.md) — CC0 backbone
  (Kenney/Quaternius/KayKit), one HDRI, frozen shadows, instancing, `<50` draw calls, `dpr≤1.5`, `frameloop="demand"`,
  and **the core bet: bake heavy looks to a static image on Chromebooks** (§2.3/§4.3/§6).

**Frozen contracts it must NOT break (grounded in the shipped code + core spec):** `MapBuildingView` /
`CuriosityMapView` / `buildCuriosityMapView`, the DOM-primary `<CuriosityMap>` **focusable-button** model + its
roving-tabindex keyboard nav, the **single persistent `<Canvas>`** rule (never remount), `ZoneHostState` /
`zoneHostReducer` / `<CanvasHost>`, `TimeLapseView` / `buildTimeLapse`, `window.__qa` (`primarySurface:"curiosity-map"`,
`canvas.primary:false`, `canvas.hasDomAlternative:true`), `Scene3DView`/`SCENE3D`, `HUE_RAMP` (music `#E8825A` / code
`#5FB98C` / art `#6C8CE8`), `PALETTE`, `MAP_COLOR_SCRIPT`, `WORLD_MOTION`, `AMBIENCE`. **This doc is a value + reference
+ asset layer; it swaps no shipped shape and changes no signal semantics.**

**Guardrails:** [`passionBrainlift.md`](../../research/passionBrainlift.md) Insight 5 — **rewards corrupt the
voluntary-return signal, worse in children; never gamify the measurement.** Every delight on this surface is deliberately
signal-free (the firewall). SPOV 1 — **never label the child.**

**Depth model = LAAS:** a named reference frame, an itemized contents list, hard floors, an explicit banned-outcomes
list, a reference-anchored self-score, and a mandatory reference-delta loop — **judged against images (best-in-class cozy
games), not against "pretty good for a browser."**

---

## 0. TL;DR — what this doc decides

1. **The rendering decision (the key call): a BAKED-3D, DOM-COMPOSITED, PARALLAX top-down clearing — not a live canvas,
   and never "buttons on a flat image."** The clearing's genuine 3D beauty (real golden-hour light, soft blue-violet
   shadows, true materials, depth) is produced by rendering the hamlet **offline through the exact same CC0 kit + warm
   `SCENE3D` pack + HDRI + frozen shadows + bloom the cabin ROOMS use**, then exported as **separated parallax layers**
   (sky · treeline · ground+paths+water+shadows · structures · near-foliage · ambient overlays) composited in **real
   DOM** (`<img>`/SVG + `motion@^12`). The **focusable cabin `<button>`s are the primary, accessible surface**, precisely
   overlaid on the baked cabin sprites and moving with them, so a11y and game-beauty coexist. The **one persistent
   `<Canvas>` stays mounted but SUSPENDED/hidden while on the clearing (~0 GPU)** — it wakes only inside a cabin
   ([§2](#2-the-rendering-approach-the-key-call)). A **live top-down 3D clearing in the canvas is rejected** — it is a
   banned outcome (continuous world frameloop / canvas rendering on the clearing / Chromebook thermal death) and it makes
   the DOM peer fragile.
2. **The named hero frame is "Golden Hour in the Clearing" (art bible §6).** A cozy picture-book hamlet at golden hour:
   the **Lodge with its lit stone hearth** dead-center (home / "you are here"), hearth-smoke rising; three instantly-
   legible cabins (terracotta / sage / periwinkle) along a soft winding dirt path; a glinting **pond** with a
   **footbridge stub**; **instanced pines**, **lanterns**, a **wandering cat** mid-amble; long **blue-violet** shadows;
   **fireflies** just starting; a gentle **return-glow** on one cabin window. The **one-second read: a warm little
   hamlet you belong to and want to walk around at the end of a good day** ([§1](#1-reference-frames-name-the-bar)).
3. **The unifying motif is the shared fire.** *The same amber that burns in the Lodge hearth glows in every cabin
   window.* Standing in the clearing you can see the fire you warm your hands at, lit in each window — the single
   strongest "one authored world" cue, carried baked-into every plate and flickering live on one breath clock
   ([§4](#4-materials-color--light-the-warm-clearing)).
4. **The clearing is dense, dressed, and alive — nothing bare.** ~**60+ discrete visible elements** across **≥10 surface
   classes** (sky/treeline · ground/paths · Lodge+hearth · 3 cabins · stream+pond+bridge · trees/stumps/**empty lots** ·
   lanterns · smoke/motes/fireflies · the cat · wayfinding controls) ([§3](#3-the-full-itemized-inventory)).
5. **Aliveness is signal-free on one breath clock.** Swaying trees, drifting smoke (+♪ from the Music cabin), a
   shimmering pond, thickening fireflies, the wandering cat, a window that warms on hover/focus — all emit **ZERO**
   `ActivityEvent`. **The ONLY signal is which cabin the child enters/returns to** ([§5](#5-aliveness--juice-signal-free-the-clearing-breathes)).
6. **It survives a Chromebook because it's DOM.** Baked `webp` layers + `motion@^12`/CSS at **~0 GPU**; the Canvas is
   **asleep** on the clearing; degrades `full → lite → board-2d` (the fully-usable `<CuriosityMap>` button grid over a
   static plate) with reduced-motion → a serene still ([§7](#7-chromebook-budget--tiers)).

**The rendering decision (headline):** **bake the real 3D hamlet offline → composite as layered, parallax DOM with the
focusable cabin buttons synced on top; keep the persistent Canvas asleep on the clearing.** Baked-illustration quality,
real DOM semantics, perfect identity-continuity with the rooms (same cabins, same fire, same light), ~0 GPU.

**The one-second read (headline):** *a cozy, lived-in hamlet in a golden-hour forest — a home Lodge with a lit fire,
three little workshops you can name at a glance, and a place worth wandering — NOT a menu.*

---

## 1. Reference frames — name the bar

Author these stills into `passion/apps/interest-lab/reference/` in phase 0; every phase is judged **side-by-side**
against them at a one-second glance on a Chromebook screen. Aesthetic anchors (art bible §7.1; world-visual §A1): **A
Short Hike** (golden-hour overworld, a small world you *read* instantly, gentle life), **Alba** (readable warm stylized
buildings, sunlit calm, ambient creatures), **Stardew Valley** (cozy top-down legibility — each structure obviously
*what it is*), **Animal Crossing: New Horizons** (inhabited world, wayfinding by building identity, time-of-day warmth),
**Firewatch** (the warm/cool dusk split, long golden light raking through pines, atmospheric haze layers), **Monument
Valley** (clean isometric geometry, confident flat color blocking — the map's *geometry* language), **Cozy Grove** (the
breathing hand-drawn world, firefly drift, the campfire as the literal heart of the place).

### 1.1 THE hero frame — **"Golden Hour in the Clearing"** (the two-frame acceptance target)

> A cozy picture-book clearing in a golden-hour forest, seen in **gentle isometric**. Warm **cream→peach** sky
> (`skyTop #FCEAC2 → skyLow #F4B074`) over a hazed warm-brown pine **treeline**. Dead-center sits the **Lodge** — a
> larger log cabin with a great **stone hearth**, its window and doorway pooling **amber** light, a wisp of **smoke
> rising** straight up from its chimney; it reads unmistakably as *home / "you are here."* A soft **dirt path**
> (`path #D8B888`) winds up from the Lodge and **forks** to three little workshops arranged in a shallow arc across the
> mid-ground: on the left the **terracotta Sounding Cabin** (a gramophone-horn cupola catching the last sun, ♪ notes
> riding its smoke); center-back the **sage-green Tinker Workshop** (a glass-gable greenhouse, a gear-sprout weathervane
> turning slow); on the right the **periwinkle Atelier Cabin** (a north-light skylight glowing the one cool accent, an
> easel on the porch). Each has a **hanging sign** and a **warm-lit window** — *the same fire that burns in the Lodge.*
> Off to the upper-right a little **pond** (`waterPond #8FC7CE`) catches one warm `waterGlint`, a **stream** curling to a
> plank **footbridge stub**; upper-left, a visible **empty lot** (a stump and cleared foundation stones — room to grow).
> **Rounded pines** (instanced) ring the clearing; a couple of near-foreground pines and a trailing vine make the dark
> **foreground frame**. **Lanterns** on posts line the path; **Biscuit the cat** ambles across a sun patch; **fireflies**
> are just starting to drift. Long, soft **blue-violet** shadows (`softShadow #5E5880` @ ~28% alpha) rake east off every
> cabin, tree, and post — **never gray, never black**. In the lower corner, a small carved **signpost** reads *"Right
> now"* (the time-lapse control). One cabin's window carries a gentle warm **return-glow**. It reads, in one second: *a
> warm little hamlet you belong to and want to walk around in at the end of a good day.*
> *(Refs: A Short Hike overworld × Stardew farm legibility × Firewatch dusk pines × Animal Crossing wayfinding.)*

**FAIL-if (the hero frame is not met if ANY of these is true):**

- The clearing reads as **a row/grid of buttons on a background** (a menu, not a place) — the single most important fail.
- The **Lodge is not the unambiguous home** ("you are here" is ambiguous or missing), or any cabin is **not nameable as
  its craft in ≤1 second** (4-channel identity broken: hue · silhouette · sign glyph · label).
- The palette is **cold / gray / midnight / moody** anywhere; shadows are **dead gray/black** instead of blue-violet;
  the hearth or any cabin window **doesn't glow** (the shared fire is absent).
- The clearing is **bare/empty** (no trees, no water, no lanterns, no cat, no dressing) or **dead** (nothing moving — no
  smoke, no sway, no fireflies).
- It looks like an **incoherent asset-pile** (mixed kits at different scales/palettes, untinted default gray, cloned
  props on a perfect grid, visible tiling) rather than one hand-built hamlet lit by one fire.

### 1.2 The sub-frames (the other two authored states)

- **"A Week Later — Dusk in the Clearing" (the time-lapse quieting; aliveness §3 feel-frame #4).** Stepping the
  time-lapse settles the same composition toward dusk: the sun sinks a notch (sky peach→soft-rose→dusk-violet), shadows
  **lengthen and go bluer**, the day-0 "new" shimmers fade, **fireflies thicken**, the **lanterns wait to be lit**, the
  chimney smoke thins on the cabins *not* revisited while the cabin(s) the child drifts back to keep their warm glow and
  their **return-glow** halo. Biscuit heads for a warm nap spot; a **fox** may step from the treeline (rare). The world
  visibly settles and, wordlessly, asks *what do you wander back to?* — the honest synthetic-return device, made
  beautiful, **never a countdown or FOMO**. *(Refs: Firewatch dusk × Cozy Grove firefly drift × A Short Hike dusk.)*
- **"The Warm Window" (a cabin hover/focus/approach state; gameflow §5.3 + aliveness §7.4).** On hover (mouse/pen) or
  focus (keyboard) a cabin lifts a hair (`hoverLift`), its **window brightens** a touch, its **hanging sign sways**, a
  soft attention shimmer plays, the door/threshold glows up, and a **"Step inside"** chip + the label + enter-verb read
  as crisp DOM text. It says *push open this door* — the felt invitation, one cabin at a time. *(Ref: Animal Crossing
  building greet × Ghibli warm window.)*

**The inversion of LAAS (stated plainly):** LAAS's floors are *geometry* floors (≥5M triangles, volumetric clouds).
**Ours are cohesion, warm light, legibility, coziness, wayfinding, and motion floors under a hard cost ceiling — on a
DOM surface at ~0 GPU.** A clearing that is *dense but incoherent, gray-lit, cold, illegible, dead, or a bare
button-menu* is a **failed screen**, exactly as flat 2010 terrain is a failed LAAS screen — even at 60fps.

---

## 2. The rendering approach — decide + justify (the key call)

The map is **DOM-primary for accessibility** (focusable cabin buttons — the frozen `<CuriosityMap>` model,
SC-CORE-10) **and** it must present a genuinely beautiful, cohesive, production top-down overworld that shares the one
persistent `<Canvas>`'s world (identity continuity with the rooms). These two requirements are reconciled by a single
decision.

### 2.1 The decision: **baked-3D, DOM-composited, parallax clearing** (the "baked diorama")

**Chosen model:** render the whole hamlet **offline** — at build time / in CI — through the **exact same production
pipeline the cabin rooms use** (the CC0 kit; the warm `SCENE3D` pack; one Poly Haven HDRI; a low raking golden-hour key;
frozen `<AccumulativeShadows>`; palette fog; Bloom+ACES) via a **gentle isometric orthographic** camera, and **export
the result as separated, registered image layers**. Those layers are composited in **real DOM** (`<img>`/`<picture>` +
SVG + `motion@^12`) with per-layer **parallax** and per-element **idle motion** on the breath clock. The **focusable
cabin `<button>`s** (the a11y floor and the primary surface) are positioned in the same normalized clearing space,
**precisely overlaid on the baked cabin sprites and transformed with the structures layer**, so the button *is* the
cabin's semantics and the sprite *is* the cabin's look — they never desync. This is exactly the bible §6 / world-visual
§A3 build recipe, specified to full depth.

**Why this reconciles everything (game-designer + a11y + pipeline):**

- **It is genuinely 3D-beautiful, not "buttons on a flat image."** Every plate is a real render of real geometry under
  real golden-hour light with real soft shadows and materials — *the same look as the rooms* — so the clearing clears
  the operator's "production game, not a menu" bar. Baking is *how* a coding agent gets AAA-cozy 3D beauty on a
  Chromebook (pipeline §0 core bet: "Cohesion and lighting, not geometry, are where beauty lives"; §2.3/§4.3: "render
  offline into a static image and ship it").
- **It keeps the DOM peer first-class and robust.** The buttons are stable DOM with roving-tabindex + arrow-key nav +
  `ariaLabel` (SC-CORE-10), never `aria-hidden`; they don't have to be re-projected from a live 3D camera each frame
  (which is fragile and breaks focus). Beauty rides underneath as decoration; semantics live in the DOM on top.
- **It honors the single-persistent-`<Canvas>` rule AND the "Canvas asleep on the clearing" law.** See
  [§2.4](#24-what-the-persistent-canvas-does-on-the-clearing-the-reconciliation).
- **It is Chromebook-cheap by construction.** Baked `webp` layers + CSS/`motion` transforms run on the compositor at
  **~0 GPU** with no WebGL context live — the whole reason the world can be *alive everywhere* and still survive
  sustained load (aliveness §4.5; gameflow §G6/§10).
- **It preserves identity continuity across the cut.** Because the clearing plates are baked from the *same kit + pack +
  HDRI* as the room GLBs, the cabin you walk up to (silhouette, sign glyph, `HUE_RAMP` hue, the fire in its window) is
  pixel-consistent with the room you step into (world-visual §A5; gameflow §2/§6).

### 2.2 Candidates considered (justified, like gameflow §3.1)

| Candidate | Verdict | Why |
|---|---|---|
| **Baked-3D DOM parallax clearing** (chosen) | ✅ | Real 3D golden-hour beauty + real DOM semantics + ~0 GPU + perfect room-continuity, all at once. Matches the bible §6 / world-visual §A3 recipe and the pipeline's "bake to a static image for Chromebooks." The buttons stay the stable, primary, accessible peer. |
| **Live top-down 3D clearing rendered in the shared `<Canvas>`** (with DOM buttons overlaid + synced per frame) | ❌ rejected | A **banned outcome**: a *continuous 3D frameloop for the whole world* and *the Canvas rendering while on the clearing* (aliveness §12; gameflow §12) → the iGPU stays hot while idly wandering → Chromebook thermal throttle (pipeline §5). Syncing focusable buttons to a live perspective/ortho projection every frame is fragile and hostile to roving-tabindex focus. Buys almost nothing over baking (the clearing barely moves) at a large perf + a11y cost. |
| **Hand-painted flat illustration + DOM buttons** (SVG/canvas art, no 3D bake) | ⚠️ fallback only | Legible and cheap, but it *loses room-continuity* (the map cabins wouldn't match the baked-from-the-kit room cabins) and risks the "flat" read. Kept **only** as the deferred-baking fallback (bible §6: "Vector/CSS-only is the fallback if baking is deferred"); the vector cabins must still be drawn from the same silhouettes/hues/signs. |
| **Pure `<CuriosityMap>` button grid, no scene** | ❌ too thin | This is the exact **menu** the operator says to beat — it is the `board-2d` a11y floor ([§7](#7-chromebook-budget--tiers)), not the shipped surface. |

### 2.3 The layer stack (baked plates + DOM overlays, back → front)

Composited in DOM in this z-order (bible §6; z-order = sky → treeline → ground → shadows → cabins/avatar → foliage →
smoke/fireflies/motes). Each baked layer is a `webp` sized to the clearing grid; `parallax` is the fraction of view
translation the layer takes when the follow-cam eases (0 = locked to sky; higher = nearer). On phones the clearing
**fits the frame** (gameflow §3.5) so parallax is dormant; it only breathes on larger screens / future growth.

| z | Layer | Kind | Parallax | Contents | Motion |
|---|---|---|---|---|---|
| 0 | **Sky** | baked gradient plate | 0.00 | `skyTop→skyLow` cream→peach vertical gradient (mood-LUT swappable to dusk) | very slow hue drift on the breath (optional) |
| 1 | **Treeline** | baked plate | 0.02 | hazed warm-brown pine silhouette band (`treeline #6E5A4E`) + warm fog gradient | gentle gust lean (§5) |
| 2 | **Far foliage / back tree-ring** | baked (instanced pines) | 0.04 | the pines ringing the back of the clearing | breath sway, gust lean |
| 3 | **Ground plate** | baked plate (the base) | 0.06 | clearing floor (`groundLit`/`groundShade`), **dirt paths** (`path`/`pathPlank`), **stream + pond**, **grass tufts**, and the **baked soft blue-violet shadows** of every static object | pond shimmer + `waterGlint` (SVG overlay); water ripples on tap |
| 4 | **Structures** | baked sprites (per object) + **the DOM button layer shares this transform** | 0.08 | **Lodge + hearth**, the **3 cabins** (each its own sprite for return-state swaps), **footbridge**, **lanterns/posts**, **stumps**, **empty-lot** dressing, the **signpost** control body, the **avatar** (`aria-hidden`) | window/hearth flicker (§4); lantern light-on; sign sway; hover/focus lift |
| 5 | **Near foliage (foreground frame)** | baked sprites | 0.12 | 2–3 near-silhouette pines + a trailing vine dipping into the top corners (the dark cozy vignette; value structure) | breath sway |
| 6 | **Ambient overlays** | DOM/SVG/CSS particles | screen | **chimney smoke** (+ ♪ glyphs from Music), **fireflies/dust motes**, window-glow halos, pond glints, leaf/particle puffs from delights | continuous on the breath; thicken toward dusk |
| 7 | **Wayfinding (semantic)** | pure DOM (screen-space) | n/a | the cabin **`<button>`s** (label + enter-verb + return cue as DOM text), the **you-are-here** marker, the **time-lapse control**, the **live region** | focus ring; announcements |

**Value structure (Pillar E), the map version:** dark cozy **foreground frame** (near pines + vine + long shadows) →
lit **mid subjects** (Lodge + cabins in the golden band) → **luminous background** (glowing windows/hearth + the
cream→peach sky). The clearing is composed like the interiors: you are looking *into* a warm place, not at a flat board.

### 2.4 What the persistent `<Canvas>` does on the clearing (the reconciliation)

The task frames it as "the persistent `<Canvas>` shows the clearing." Reconciled against the winning contracts, that
means **identity, not a live render**:

- **One `<Canvas>`, mounted for the app lifetime, NEVER remounted** (core §5.2/SC-CORE-08). Entering/leaving a cabin
  **swaps its children**; it is not created/destroyed per surface.
- **On the clearing (`activeZoneId === null`) the Canvas is SUSPENDED** — `frameloop` off and the element hidden behind
  the DOM clearing → **~0 GPU** while wandering (gameflow §6/§10; aliveness §4.5; core §5.2 "an ambient overworld
  backdrop **or nothing** inside the same canvas"). *A canvas rendering on the clearing is a banned outcome.*
- **The clearing's "3D" comes from the bake.** The Canvas "shows the clearing" in the identity-continuity sense — the
  same kit/pack/HDRI/light that the Canvas runs for rooms is what **pre-rendered** the clearing plates — not by running
  live. This is the deliberate, contract-honoring reading.
- **The cut wakes it (gameflow §6; world-visual §A5).** Confirming a cabin fires the **hue-wipe on that cabin's
  `HUE_RAMP` hue**; *under* the wipe the room GLB preloads (`useGLTF.preload`), `zoneHostReducer` dispatches
  `enter(zoneId)`, and the Canvas `frameloop` wakes to `demand`; the room is revealed only when `window.__qa.ready`.
  Exiting hue-wipes back and re-suspends the Canvas, the traveler standing **just outside that cabin's door**
  ([§4.4](#44-the-mapcabin-door-push-transition)).

---

## 3. The full itemized inventory

Every surface class carries occupants (bible Pillar C, "nothing is bare"). Because this is a **baked-DOM** surface, the
cost unit is **baked layers + sprite/atlas weight + always-on DOM motions**, not draw calls (the 3D per-object cost was
paid *once*, offline, at bake time). All repeating natural props (pines, grass, lanterns, fireflies) are **instanced in
the bake** (one `InstancedMesh` per type) with per-instance hue/value/scale/rotation jitter — cloned uniformity on a
perfect grid is a fail (§8). Placement is the anchor in **normalized clearing coords** `(x, y)` with **x: 0 left → 1
right, y: 0 far/top → 1 near/bottom** (the same space as `ClearingGraph.at`, gameflow §3.2). "Scale" is the sprite's
footprint as a fraction of clearing width. Tints are `MAP_COLOR_SCRIPT` tokens (bible §3.4 — the winning values).

### 3.0 Top-down plan (buildable; extends gameflow §3.2)

```
                          SKY  (cream→peach)  ·  hazed pine TREELINE
   ┌──────────────────────────────────────────────────────────────────────┐
   │  (lot:0)                       [Tinker Workshop]         (poi:pond) ~~~ │
   │  cleared patch + stump          sage, glass gable         ◔  ·waterGlint│
   │  (0.13,0.24)                    (0.50,0.31)              (0.80,0.19)    │
   │                                     |                    (poi:footbridge│
   │   [Sounding Cabin]            (junction:fork 0.50,0.47)    stub 0.70,0.25)
   │   terracotta, horn cupola          |                    [Atelier Cabin] │
   │   (0.19,0.39)  ♪smoke        ((( LODGE + HEARTH )))      periwinkle,     │
   │        \___path___             home / "you are here"      skylight       │
   │                    \____       (0.50,0.60)  ↑smoke___/    (0.81,0.39)    │
   │  lantern ✦        lantern ✦        |         lantern ✦                   │
   │ · · near pines ▲ · · · · · (poi:stump 0.42,0.82) · · trailing vine · · ·│
   │  [signpost: Right now→A week→A month]  (0.08,0.88)      Biscuit 🐈 amble │
   └──────────────────────────────────────────────────────────────────────┘
     ↑ gentle isometric; long blue-violet shadows rake EAST off everything ↑
     z: sky→treeline→farpines→ground(paths+water+shadows)→structures/avatar→nearpines→smoke/fireflies/motes→DOM buttons
```

### 3.A — Sky, treeline & ground (the baked base plates)

| # | Element | Count | Placement / extent | Tint (`MAP_COLOR_SCRIPT`) | Motion | Layer |
|---|---|---|---|---|---|---|
| A1 | **Sky gradient** | 1 | full frame, y[0,0.30] behind all | `skyTop #FCEAC2 → skyLow #F4B074` (mood-LUT swaps to rose→dusk-violet) | slow drift (opt) | 0 |
| A2 | **Hazed treeline band** | 1 | full width, y[0.16,0.30] | `treeline #6E5A4E` + warm fog | gust lean | 1 |
| A3 | **Clearing ground** | 1 plate | x[0,1], y[0.28,1.0] | `groundLit #C9B583` lit / `groundShade #8E8A5E` shade | — | 3 |
| A4 | **Grass tufts** (instanced) | ~40 | scattered off-path | `grassTuft #9FB56A` | breath sway | 3 |
| A5 | **Dirt path + boardwalk** | 1 network | Lodge→fork→each cabin; boardwalk on the bridge span | `path #D8B888`, `pathPlank #B98A5E` | footprint-trail on travel (§5) | 3 |
| A6 | **Baked soft shadows** | 1 (in plate) | east of every static object | `softShadow #5E5880` @ **22–34% alpha** — **NEVER gray/black** | frozen (baked) | 3 |

### 3.B — The Lodge + the great hearth (home / "you are here")

The composition's anchor and the cohesion motif's source. Larger silhouette than the cabins, centered and nearer.

| # | Element | Count | Placement | Scale | Tint | Motion | Layer |
|---|---|---|---|---|---|---|---|
| B1 | **The Lodge** (larger log cabin, wide porch, stout stone chimney) | 1 | (0.50, 0.60) | 0.20 w | `wood.honey`/`wood.walnut` logs, `plaster.cream` chinking, `rust.terracotta` roof | — | 4 |
| B2 | **The great stone hearth** (visible through the open front, the always-lit fire) | 1 | in B1 | 0.06 | stone `forest.moss` in joints; **fire emissive** `hearthGlow #FF9E5E` core → `light.window` spill | **fire flicker ±8%** (breath); rising ember on stoke | 4/6 |
| B3 | **Lodge windows** (warm, the reference amber) | 2 | on B1 | 0.03 | `light.window #FFC08A` glow (= the fire in every cabin window) | ≤3% flicker (breath) | 4/6 |
| B4 | **Chimney smoke** (rising, dead-center of the frame) | 1 | above B1 chimney | — | `chimneySmoke #CDBBA6` low-alpha puffs | rise + fade loop; drift in gusts | 6 |
| B5 | **You-are-here marker** (DOM) + **last-entered footprint** cue | 1 | at/under B1 | — | soft `light.candle`; footprint `softShadow` | subtle pulse; footprint fades | 7 |
| B6 | **Porch dressing** (rocking chair, dinner bell on a post, a folded blanket, warm doormat) | 1 set | on B1 porch | 0.02–0.04 | `wood.driftwood`, `brass` bell, `wool.cream` | chair rock / bell ring (delights §5) | 4 |

### 3.C — The three cabins (Music / Code / Art)

Each legible-from-across-the-clearing on **four independent channels** (bible §1): **hue** (`HUE_RAMP`) · **silhouette /
roof** · **hanging sign glyph** · **label** (DOM text) — so a color-blind child names it at a glance. Each cabin sprite
is **its own layer element** so the `returnState` window treatment ([§5.3](#53-the-return-glow-signal-made-visible-never-scored))
and hover/focus "warm window" state swap without re-baking the ground. The **cabin `<button>`** overlays its sprite
exactly (structures-layer transform).

| # | Cabin | Cell | Placement | Scale | Hue | Silhouette / roof | Sign glyph | Signature dressing (baked) | Window |
|---|---|---|---|---|---|---|---|---|---|
| C1 | **The Sounding Cabin** (Music, `sound_music`) | (0,0) | (0.19, 0.39) | 0.14 w | terracotta `cabinMusic #E8825A` | snug log cabin, **gramophone-horn cupola**, stout stone chimney | carved **♪ note** on an iron bracket | notes drift up *with* the chimney smoke; the **warmest, amberest** window on the map | warmest amber |
| C2 | **The Tinker Workshop** (Code, `symbols_math`) | (1,0) | (0.50, 0.31) | 0.14 w | sage `cabinCode #5FB98C` | **greenhouse-workshop**: log base, **glass gable roof**, **gear-sprout weathervane** | a **cog sprouting a leaf** | potted sprouts on the sill, a **wind-up bot ("Sprout")** on the porch, a lantern by the door | warm sage + a cool cyan tool-glow leak |
| C3 | **The Atelier Cabin** (Art, `visual_design`) | (2,0) | (0.81, 0.39) | 0.14 w | periwinkle `cabinArt #6C8CE8` | gable cabin, big **north-light skylight**, **easel on the porch** | a **paintbrush + frame** | a hanging painting under the eave, a paint-splash doormat | the **coolest** "lit-window-at-dusk" glow (the one deliberate cool accent — inviting, not cold) |

- **Hanging signs** (C*-sign): each on an iron bracket, swaying on the breath/gust; the **cabin's proper name** (e.g.
  "The Sounding Cabin") + the glyph are baked on the sign, while the **button's `label` (the craft name) + enter-verb
  are DOM text** under the button (never baked) — "**Music Studio** · *Step inside*."
- **Doors/thresholds:** each cabin's door + a warm rug of window-light spilling out; on hover/focus/approach the door
  glows up and a **"Step inside"** chip appears (the "Warm Window" sub-frame, §1.2).
- **Room to grow:** the cabin sprites sit in the shallow arc with **deliberate empty space** to the sides (across the
  footbridge, the lot) so a 4th cabin extends the hamlet without redrawing (§3.E; bible §1).

### 3.D — Water: stream, pond & footbridge stub

| # | Element | Count | Placement | Scale | Tint | Motion | Layer |
|---|---|---|---|---|---|---|---|
| D1 | **Pond** | 1 | (0.80, 0.19) | 0.12 | `waterPond #8FC7CE` body + one warm `waterGlint #FFD8A0` | looping shimmer; ripple + droplets on tap (delight) | 3/6 |
| D2 | **Stream** (curls from pond toward the bridge, hints off-frame) | 1 | (0.80,0.19)→(0.66,0.27) | 0.02 w ribbon | `waterPond` + glint | flow shimmer; a slow **leaf-boat** drifts | 3/6 |
| D3 | **Footbridge stub** (plank bridge over the stream, pointing at future growth) | 1 | (0.70, 0.25) | 0.06 | `pathPlank #B98A5E`; rope `leather.worn` | planks *clunk* underfoot (hollow-wood footstep, §5) | 4 |

### 3.E — Trees, stumps & empty lots (instanced flora + room to grow)

| # | Element | Count | Placement | Scale | Tint | Motion | Layer |
|---|---|---|---|---|---|---|---|
| E1 | **Back tree-ring pines** (instanced) | ~24 | ringing the clearing back, y[0.20,0.34] | 0.05–0.09 | `forest.pine`/`forest.deep`; rim-lit warm | breath sway; gust lean | 2 |
| E2 | **Side-cluster pines** (instanced) | ~10 | far-left x[0.02,0.12] + far-right x[0.88,0.98] | 0.06–0.10 | `forest.pine`/`forest.deep` | breath sway | 2 |
| E3 | **Near foreground pines** (the dark frame) | 2–3 | bottom corners (0.06,0.92),(0.94,0.90) | 0.14–0.18 | `forest.deep`→`wood.cocoa` silhouette | breath sway; parallax | 5 |
| E4 | **Trailing vine** (from a near branch, dips into a top corner) | 1 | (0.90, 0.10) dipping in | 0.10 | `forest.pine`/`forest.moss` | sway (breath) | 5 |
| E5 | **Empty lot:0** (cleared patch: mossy stump + foundation stones — "a cabin can grow here") | 1 | (0.13, 0.24) | 0.08 | stump `wood.walnut`, moss `forest.moss`, stones `forest.moss` joints | — (a quiet "someday") | 4 |
| E6 | **Sitting stump** (poi:stump; a strollable rest node) | 1 | (0.42, 0.82) | 0.05 | `wood.walnut`, worn top | Biscuit may sit here | 4 |
| E7 | **Hidden 4th "someday" lot** (across the bridge; a mossy stump, no UI) | 1 | (0.88, 0.30) | 0.06 | `wood.walnut`/`forest.moss` | — (discoverable, un-enumerated) | 4 |

### 3.F — Warm practicals: lanterns, string-lights & glows

| # | Element | Count | Placement | Scale | Tint | Motion | Layer |
|---|---|---|---|---|---|---|---|
| F1 | **Lanterns on posts** (instanced) | 5–7 | flanking the path/Lodge: (0.30,0.52),(0.70,0.52),(0.24,0.44),(0.76,0.44),(0.50,0.72) + 1–2 by cabins | 0.03 | post `wood.walnut`; bulb `light.lantern #FFD166` (emissive) | **light-on as you pass / at dusk** (`lanternLight`); ~2% breath | 4/6 |
| F2 | **String-lights** (optional, swagged Lodge porch→post; instanced bulbs) | ~10 bulbs | over the Lodge porch | 0.01 | `light.lantern` | twinkle (breath) | 4/6 |
| F3 | **Window & hearth glow halos** (the shared fire) | per lit window | on every cabin + Lodge window | — | `hearthGlow #FF9E5E` / `light.window #FFC08A` | ≤3% flicker (breath) — *all fires are one fire* | 6 |

### 3.G — Ambient life overlays (the world breathes)

| # | Element | Count | Placement | Tint | Motion | Layer |
|---|---|---|---|---|---|---|
| G1 | **Chimney smoke** (Lodge + each lit cabin) | 4 columns | above each chimney | `chimneySmoke #CDBBA6` | rise + fade loop; gust drift | 6 |
| G2 | **— with ♪ notes** (Music cabin only) | 1 | in C1's smoke | `cabinMusic`/`light.candle` glyphs | notes ride up inside the smoke | 6 |
| G3 | **Fireflies / dust motes** (sparse particle field) | 60 / 24 / 0 per tier | over the whole clearing, gathering at the traveler at rest | `firefly #FFD98A`, `emberSpark #FF7A3C` | drift; **thicken toward dusk** | 6 |
| G4 | **Biscuit the cat** (the wandering heart of the place) | 1 | slow looping amble spline; naps in sun/dusk-warm spots (~0.58,0.70) | `fire.flame`/`rust.leaf` amber fur | amble; sit; groom; nap; **follows a few steps** near the traveler; **pet** (delight) | 4 |
| G5 | **A bird** *(rare)* | 1 | arcs on a bezier; lands on a roof/branch; startles at the bell | warm | rare, long jittered timer; `full` only | 6 |
| G6 | **A deer / fox** *(rare)* | 1 | steps from the treeline, looks, melts back (fox at dusk) | `rust.leaf`/`forest.deep` | rare; `full` only | 2/4 |

### 3.H — Wayfinding & controls (pure DOM; the accessible spine)

| # | Element | Count | Placement | Notes | Layer |
|---|---|---|---|---|---|
| H1 | **Cabin buttons** (`<button>`, roving-tabindex) | 3 | overlaid on C1/C2/C3 (structures transform) | `ariaLabel` (§6); shows label + enter-verb + return cue as DOM text; `onEnterZone(zoneId)` on confirm; **never `aria-hidden`** | 7 |
| H2 | **You-are-here marker** | 1 | at the Lodge (B5) | announces "home"; the clearing has no "back" because it *is* home | 7 |
| H3 | **Time-lapse control** (diegetic carved **signpost** + real DOM buttons/slider) | 1 | (0.08, 0.88), lower-left | three labeled stops "Right now → A week later… → A month later…"; steps `dayOffset` 0/7/30; announces its effect | 7 |
| H4 | **Live region** (polite) | 1 | visually hidden | narrates walk/arrival/time-lapse (§6) | 7 |
| H5 | **POI look-stops** (pond, stump, cat — optional, secondary) | 3 | at D1/E6/G4 | focusable "look around" items *after* the cabins in tab order; **never enter/emit** (gameflow §3.7) | 7 |
| H6 | **The avatar / traveler** (decorative echo) | 1 | walks the `ClearingGraph`; starts at the Lodge | **`aria-hidden`**; belongs to the structures layer; soft `softShadow` contact shadow (never gray) | 4 |

**Tally:** ~**60+ discrete visible map elements** across **≥10 surface classes** (sky/treeline · ground/paths · Lodge +
hearth · 3 cabins · stream/pond/bridge · trees/stumps/lots · lanterns/string-lights · smoke/motes/fireflies · the cat ·
wayfinding controls) — comfortably clears the world bible §9 map floor (**≥ the three cabins + Lodge + trees + path +
stream + cat + lanterns**). Under-dressing to hit the budget is itself a fail — **instance more in the bake instead**
(§7).

---

## 4. Materials, color & light (the warm clearing)

### 4.1 Baked through the room pipeline (cohesion by construction)

The clearing plates are baked with the **exact same** setup the cabin rooms run, so the map and the rooms are one world
(Pillar A):

- **One self-hosted CC0 HDRI** ("warm cabin interior / golden window at dusk," Poly Haven 1–2K) as the single ambient +
  reflection source (bible §5.1).
- **Warm key = the golden-hour sun (the ≤1 shadow-caster).** `SCENE3D.keyHex #FFD8A3`, `keyIntensity 1.2`, **low raking**
  `keyPos [6,8,5]` → the long soft shadows **rake east** off every cabin, tree, and post (bible §3.2/§5.2). This is baked
  in, so the map's golden-hour read costs nothing at runtime.
- **Cool fill = the dusk-blue skylight (the no-dead-shadow law, Pillar B).** Hemisphere `hemiSkyHex #A9C2E8` over
  `hemiGroundHex #C67B48`, `hemiIntensity 0.52`, low warm ambient `#52402E` → every baked shadow tints **blue-violet
  (`softShadow #5E5880` @ 22–34% alpha), never gray/black**.
- **Frozen shadows only** (`<AccumulativeShadows>` + `<RandomizedLight>` at bake) baked straight into the ground plate;
  `<ContactShadows frames={1}>` feel under the avatar at runtime (a single cheap DOM shadow).
- **One shading model** (flat PBR, tinted to the palette) + **palette-matched fog** (`fogHex #E0C79A`) baked into the
  treeline haze for depth — for cohesion, never to hide a clip.
- **Bloom + ACES** baked so every window/hearth/lantern already glows in the plate; the *live* flicker rides on top as a
  cheap DOM/CSS emissive overlay on the breath clock.

### 4.2 The `MAP_COLOR_SCRIPT` (the surface's palette — bible §3.4 wins)

The one table the DOM layer reads (already shipped as `MAP_COLOR_SCRIPT`; do not change shapes). The warm woods + fire
own the **lit** half of every value; the cool dusk-fill owns the **shade** half — the cozy warm/cool golden-hour split
(Pillar E).

```
sky:      skyTop #FCEAC2 → skyLow #F4B074        (golden-hour cream → peach)
treeline: #6E5A4E                                (hazed warm-brown pine band)
ground:   groundLit #C9B583 / groundShade #8E8A5E ; grassTuft #9FB56A
path:     path #D8B888 / pathPlank #B98A5E        (warm dirt + boardwalk)
water:    waterPond #8FC7CE + waterGlint #FFD8A0
shadow:   softShadow #5E5880  @ 22–34% alpha      (BLUE-VIOLET — never gray/black)
smoke:    chimneySmoke #CDBBA6 (low alpha)
life:     firefly #FFD98A ; emberSpark #FF7A3C
fire:     hearthGlow #FF9E5E  (the Lodge fire = the fire in every cabin window)
cabins:   cabinMusic #E8825A · cabinCode #5FB98C · cabinArt #6C8CE8   (= HUE_RAMP[0..2])
accents:  lantern light.lantern #FFD166 · window light.window #FFC08A · candle light.candle #FFE0A8
```

### 4.3 Day → dusk (the mood LUT, no new geometry; aliveness §6.2)

Time is the core spec's `dayOffset` (0 / 7 / 30) surfaced as the time-lapse control — no wall-clock (a clock creates
pressure). Stepping it is a **swap of the color-script + life densities + audio**, re-tinting the DOM layers (and, if
re-baked, swapping to a dusk sky plate). Golden hour is the **resting default**; **night-as-default is a banned outcome**.

| Step (`dayOffset`) | Sky | Shadows | Life | Light | Read |
|---|---|---|---|---|---|
| **Right now (0)** | `#FCEAC2 → #F4B074` cream→peach | short, warm-edged | "new" shimmers present; a bird | windows warm; lanterns unlit | *the good part of the day — come explore* |
| **A week later (7)** | peach → soft rose; sun a notch lower | longer, bluer (`softShadow` up) | shimmers fade; **fireflies begin**; lanterns *invite* lighting | hearth dominant | *the day is settling — what pulled you back?* |
| **A month later (30)** | rose → **dusk-violet**; sun low | long, deep blue-violet | fireflies thick; deer→fox; hearth-glow leads | lanterns want lighting | *quiet — what do you wander back to?* |

The warm/cool split holds at **every** step — **dead-gray dusk shade is a banned outcome even at dusk** (aliveness §6.5).
An optional **hearth-storm** (cozy rain) mood makes the hearth *more* dominant (warm inside vs cool-wet outside) — used
sparingly for extra warmth, **never** as a stressful "storm coming, hurry."

### 4.4 The map→cabin door-push transition (how the scene hands off to the persistent canvas room)

The one real new surface is the cut (gameflow §6; world-visual §A5; aliveness §7.1). It must **never** hitch:

1. **Approach & confirm.** The traveler arrives at the cabin **threshold**; the door + window glow up; a **"Step inside"**
   chip appears; the sign creaks (`arrivalPush ≈ 300ms`). Confirming (click-again / Enter / the chip) begins the cut.
2. **Door-swing + hue-wipe.** The cabin sprite's **door swings** on a spring (`doorSwing 520ms`), **hearth-amber light
   spills** and blooms toward the viewer in that cabin's `HUE_RAMP` hue, and a **wipe on that hue** (`doorwayWipe 480ms`)
   sweeps the screen. The hue is the constant across the cut — the child never loses "which place / how do I get back."
3. **Preload under the wipe (no hitch).** As the wipe covers the screen: kick off `useGLTF.preload` of the room GLB,
   dispatch `zoneHostReducer` **`enter(zoneId)`**, wake the Canvas `frameloop` to `demand`. The DOM clearing dissolves;
   the room is revealed **only when `window.__qa.ready`** (Mario-Party "lightweight assets + background load"). The ~480ms
   wipe hides first-frame warm-up. **The `<Canvas>` is never remounted** — contents swap (SC-CORE-08).
4. **Signal.** A confirmed entry fires the world-level `ActivityEvent` (gameflow §9): `kind:"explore"` at `dayOffset 0`
   (first visit) or `kind:"return"` at `dayOffset ≥ 7` (a later, unprompted return) → the row lights; `stateHash()`
   changes (the machine-checkable "primary action is live" proof).
5. **Exit is spatial.** "← Back to the clearing" hue-wipes back; the DOM clearing fades up **centered on the Lodge**, the
   hearth does a gentle **welcome-breath** (`arrivalHome 700ms`), and the **traveler stands just outside that cabin's
   door**. The Canvas re-suspends (~0 GPU). The just-visited cabin now carries a soft **"explored"** shimmer.
6. **Reduced-motion → instant cut** for every beat above (no wipe, no swing, no walk); all still announced.

New motion durations (additive `WORLD_MOTION`, gameflow §6; reduced-motion → instant): `strollPerUnit 900`,
`avatarTurn 150`, `mapFollow 520`, `doorwayWipe 480`, `arrivalPush 300`, `lanternLight 260`, `timeLapseSettle 700`.

---

## 5. Aliveness & juice (signal-free) — the clearing breathes

### 5.1 One breath clock (Pillar G; aliveness §5.1)

All ambient motion samples **one** slow oscillator (`AMBIENCE.breathMs` default 8000) with per-element phase offsets, so
the whole clearing pulses like **one living body** (the fire is the heartbeat) for the cost of one clock. On the DOM
clearing this is a single `motion` loop driving one CSS var `--breath` (0..1) that every layer reads with an offset.
Amplitudes stay **tiny** (windows flicker ≤3%, foliage sways a few px, the hearth glows ±8%). A single **wind** value
with occasional **gusts** (`AMBIENCE.gustEveryMs` ± jitter) is the conductor: a gust leans the foliage harder, drifts the
smoke sideways, jingles the Music cabin's wind-chime, blows a few leaves, and modulates the breath so the world leans
*together*. **Reduced-motion → freeze at a pleasant mid-phase** (a serene, complete still — never a hollowed frame).

### 5.2 Always-on ambient life (≥5 + the breath; bible §9 map floor)

1. **Chimney smoke** rising from the Lodge + each lit cabin (G1); the **Music cabin's carries ♪ notes** (G2).
2. **Swaying trees & grass** (E1/E2/E3/A4) — parallax sway, phase-offset by the breath, leaning in gusts.
3. **Fireflies / dust motes** (G3) drifting in the low sun, **thickening toward dusk**, gathering softly at the traveler
   at rest.
4. **Shimmering pond + stream** (D1/D2) — a looping water shimmer, one warm `waterGlint`, a slow leaf-boat.
5. **The wandering cat** (G4) — Biscuit ambles a slow loop, sits, grooms, naps in warm patches, follows a few steps.
6. **Window/hearth firelight flicker** (F3/B2) — the warm windows flicker ≤3% on the breath, tying the map's light to
   the rooms' hearths (*all fires are one fire*).
7. **Lanterns** warm on as the traveler passes / at dusk (F1); **rare wonder** (a bird arc, a deer/fox at the treeline,
   a shooting star at dusk, a firefly alighting on the focused cabin) on long jittered timers — **never announced, never
   logged**.

### 5.3 The return-glow (signal made visible, NEVER scored; core §5.1, gameflow §7)

The `CuriosityMapBuilding.returnState` drives the **window** treatment of each cabin — an **ambient, descriptive** cue
that shows the child their *own* pattern, never a reward:

- `voluntary-return` → a gentle warm **window-halo** (`welcomeBack`) — warmth only.
- `prompted-return` → a **cooler, quieter, visibly recessed** cue (`promptedRecede`) — never celebrated.
- `explored` → a fading **"new" shimmer** that gently settles after a first visit.
- `new` → a soft first-visit shimmer.
- `unfinished > 0` → **"your half-made thing is still here"**: a single soft **window-glint** — an opt-in invite, **never
  a countdown**.

**No number, streak, star, score, or badge ever sits on a cabin** (passion Insight 5). The four cues read as **hue +
motion + text**, never color alone (§6).

### 5.4 The clearing micro-interactions (cozy-juice grammar; aliveness §4)

Optional delights that reward wandering, each following the five-beat grammar — **anticipation → warmth-bump → soft
particle → one gentle sound → settle**, tuned soft (Pillar H: **no screenshake, confetti, big pops, or saturated
flashes**). Each is DOM (`motion`/CSS + Web Audio), ~0 GPU, self-cleaning. Reduced-motion collapses beats 1/3/5 to an
instant state change while keeping the sound + a static warmth-bump.

| Delight | Interaction | Juice (tokens) | Sound | Signal |
|---|---|---|---|---|
| **Pet Biscuit the cat** | focus/tap the cat → it stops, sits, leans in, slow-blinks, tail curls | `catPet` spring; warm halo `light.window`; a couple of drifting motes (not hearts) | purr + soft *mrrp* | **NONE** |
| **Stoke the Lodge hearth** | tap the hearth → embers swirl, the fire swells ~2s; **every cabin window pulses +8% for one beat** (cohesion!) | `hearthStoke`; ember burst `emberSpark→hearthGlow` | crackle-pop + low *whoomph* | **NONE** |
| **Ring the dinner bell** | tap the iron bell → it swings, a bright ring, a light-ripple; a bird may startle off | `bellRing` damped swing; ripple `light.candle` | in-key *ding* (Tone.js) | **NONE** |
| **Knock leaves off a branch** | tap a laden branch → it dips + springs, leaves drift down | `branchKnock` spring; `rust.leaf` sprites | *rustle + whumpf* | **NONE** |
| **Light a lantern** | tap an unlit lantern → flickers to life, pools warm light (stays lit for the session at dusk) | `lanternLight` warm ramp `light.lantern` | *fwoomp* + glass *tink* | **NONE** |
| **Nudge the wind-chime** (by the Music cabin) | hover/tap (or a gust) → sways + a soft randomized shimmer | `gust`/chime sway | Tone.js pentatonic (always in tune) | **NONE** |
| **Rock the porch chair / plip the stream / cross the footbridge** | tap → rocks / ripple + droplets / plank *clunk* | `chairRock`, `ripple` | *creak* / water *plip* / hollow *clunk* | **NONE** |

### 5.5 The firewall (aliveness §1.2 — the single most important rule)

> **Juice is NEVER signal.** No ambient micro-interaction calls `RoomProps.emit`. Nothing on the clearing is counted,
> collected, badged, streaked, or FOMO'd. **The ONLY signal on this surface is which cabin the child ENTERS (a
> `CuriosityMap` selection) and which cabin they VOLUNTARILY RETURN to after novelty fades (`kind:"return"`,
> `dayOffset ≥ 7`, no `intervention`).** A child who visits daily *just to pet the cat* is returning to **the world**,
> not a domain — and the engine correctly reads that as **nothing about their interests**, which is exactly what protects
> the voluntary-return signal the whole product rests on.

QA enforces this as a **negative assertion** (§8): a scripted round-trip fires **every** clearing delight and asserts
`window.__qa.getEmittedSignals()` records **zero** new `ActivityEvent`s; a delight that leaks a signal **hard-fails**.
The delight/doorway separation is absolute: the cabin door is the only thing that emits (on entry); no delight is a door,
and the door is not a delight.

---

## 6. Accessibility as a true peer (not a lesser menu)

The **`<CuriosityMap>` button grid is the game** for AT users, and the baked scene + avatar is a decorative echo over it
(gameflow §3.7; core §5.1; SC-CORE-10). It is **never** `aria-hidden` and it is the **primary** surface.

- **Structure.** The map is a labeled landmark region ("Emberwood clearing"); the **Lodge** is announced first as
  **home / you-are-here**; each cabin is a **focusable `<button>`** in a **roving-tabindex** group where
  `ArrowLeft/Right/Up/Down` moves focus **one place at a time — never a steered cursor** (the frozen model). POIs (cat,
  pond, stump) are optional focusable "look" stops *after* the cabins, clearly secondary (they never enter/emit).
- **Names & state, never color-only.** Each cabin button uses the golden `ariaLabel` format (core §8.6):
  `"<label>, discovery zone, <n> unfinished, <return phrase>"` where the phrase is `new→"new"`,
  `explored→"you've been here"`, `voluntary-return→"you came back here"`, `prompted-return→"you came back after a
  reminder"`. The visible chip repeats state as **text + glyph + motion** — so **name + craft + state** read on **four
  channels** (hue · silhouette · sign glyph · text), passing color-blind + SR parity.
- **Movement, announced.** Selecting a cabin (or stepping focus) walks the avatar; a **polite live region** narrates
  *"Walking to the Sounding Cabin…"* then *"At the Sounding Cabin. Press Enter to step inside."* With reduced-motion the
  walk is skipped but the same announcements fire; the avatar is **`aria-hidden`** throughout (no double-announce).
- **The time-lapse control** is a labeled DOM control (signpost with three stops) that steps `dayOffset`; its effect is
  announced (*"A week later. The clearing has quieted. Where do you go back to?"*).
- **Reduced-motion → a serene, complete still** (Pillar K): the breath freezes at a pleasant mid-phase; smoke/sway/
  fireflies/gusts still; the cat naps; the return-glow is a static warm halo; delights become instant state changes
  keeping their sound + a static warmth-bump. Never a hollowed-out frame.
- **Parity obligation.** The set of enter-able zones via keyboard **equals** the set the pointer avatar can reach (no
  pointer-only or avatar-only destination) — asserted like `plainZoneEquals`.

---

## 7. Chromebook budget & tiers

Because the clearing is **DOM**, the whole surface runs at **~0 GPU** with the persistent Canvas **asleep** — this is
how the world is *alive everywhere* and still survives a Chromebook (aliveness §4.5; gameflow §10; pipeline §5). The
"draw-call" cost was paid once, offline, at bake time.

| Budget | The Clearing (DOM) |
|---|---|
| **GPU (idle & wandering)** | **~0** — baked `webp` layers + `motion@^12`/CSS transforms; the `<Canvas>` `frameloop` is **off/hidden** on the clearing; must not jank scroll/focus |
| **Persistent Canvas** | exactly **1**, mounted for the app lifetime, **never remounted**; suspended on the clearing, woken to `demand` only inside a cabin |
| **Baked layers** | the 7-layer stack (§2.3); each `webp`, sized to the clearing grid; **lazy-loaded** on first map paint |
| **Sprite / plate weight** | keep the layer set in the **low-MB** (Kenney-scale sources, KTX2 at bake, `webp` export); cabin sprites separated for return-state swaps |
| **Always-on motions** | **≥5** (smoke · sway · fireflies · water · cat) **+ the breath** (bible §9; aliveness §11) |
| **Rare wonder events** | **≥1** in the pool (bird/deer/fox/star), long jittered timers |
| **Signature delights reachable** | **≥5** (cat, hearth, bell, branch/stream, lantern, chime, chair); time-to-first-delight **≤10s** from load |
| **Shadows** | baked into the ground plate (`softShadow` blue-violet, never gray); a single cheap contact-shadow feel under the avatar |
| **Audio** | low-hundreds-of-KB CC0 clips + Tone.js procedural; gesture-gated; mutable; every cue has a **visual twin** (deaf/HoH) |
| **Firewall** | **0** `ActivityEvent`s from any delight (QA-asserted) |
| **Reduced-motion** | serene static postcard; delights = instant + sound + static warmth-bump |

### 7.1 Tier degradation (`resolveRenderTier`; the clearing is DOM at *every* tier)

- **`full` (quest-world-3d):** all baked layers + full parallax + all ≥5 ambient motions + rare events + gusts + all
  delights + fireflies 60; `dpr` device-native for the DOM composite.
- **`lite` (quest-world-3d-lite):** thinned motes (24), no rare events, gentler gusts, fewer particles, parallax reduced
  to 2–3 layers; the scene stays fully legible and warm.
- **`board-2d` (the a11y floor & the primary AT surface):** the **`<CuriosityMap>` button grid over a single static
  baked clearing plate** — the full wander-and-enter game reduced to the focusable buttons + you-are-here + the
  time-lapse control, **fully playable**, never a lesser menu (each cabin still nameable on four channels; the return
  cues still read as text+glyph). This is also the reduced-motion render.

**The degrade path guarantee:** because the clearing is DOM at every tier, the **weakest Chromebook still gets the full
wander-and-enter game** — only the *room* degrades to its `ActivityDOM` peer. No child hits a lesser world.

---

## 8. Hard floors, banned outcomes, self-score & verification

### 8.1 Hard floors + cost ceilings (two-sided; under-dressing to hit the ceiling is itself a fail)

| Budget | The Clearing |
|---|---|
| Visible dressing elements | **≥ the three cabins + Lodge + trees + path + stream + cat + lanterns** (this doc: ~60+) across **≥10 surface classes** — none bare |
| The home anchor | exactly **1** unambiguous Lodge + lit hearth ("you are here"), central |
| Legible cabins | **3**, each nameable as its craft in ≤1s on **4 channels** (hue · silhouette · sign · label) |
| Warm sources | hearth-glow + every cabin window-glow + lanterns + fireflies (the shared fire visible in every window) |
| Cool fill / shadow | baked **blue-violet** `softShadow #5E5880` @ 22–34% alpha — **0** desaturated-gray samples |
| Always-on motions | **≥5** + the breath (this doc: smoke, sway, fireflies, water, cat, window-flicker) |
| Signal-bearing surfaces | exactly the **3 cabin doors** (enter/return); **0** signal from any delight (firewall) |
| Accessible peer | the DOM `<CuriosityMap>` is primary, focusable, roving-tabindex, **never `aria-hidden`** |
| Canvas | **1** persistent, never remounted, **asleep on the clearing** (~0 GPU) |
| Time-lapse | a labeled, honest DOM control (3 stops); **no** wall-clock, countdown, or FOMO |
| Reduced-motion | serene, complete still; delights still work |

### 8.2 Banned outcomes — instant fail

Any one fails the surface (union of bible §11 + gameflow §12 + aliveness §12 + world-visual §A7, map-flavored):

- **Buttons floating on a flat background** — a menu, not a place (the operator's headline fail); OR the opposite: so
  much "world" that the child gets lost (illegible).
- **A bare / empty clearing** — no trees, water, lanterns, cat, or dressing; OR a **dead** clearing (nothing moving — no
  smoke, sway, fireflies, or cat).
- **Cold / gray / midnight / moody** palette anywhere; the retired `#181026` pack; dusk-as-default; **dead gray/black
  shadows** instead of blue-violet (even at dusk); the hearth or any cabin window **not glowing** (the shared fire
  absent).
- **No obvious home / Lodge** ("you are here" ambiguous or missing); **no legible cabins** (a cabin you can't name as its
  craft in 1s; color-only identity).
- **A live 3D frameloop on the clearing / the Canvas rendering while on the clearing / remounting the `<Canvas>`** per
  surface (Chromebook slideshow; the rejected architecture).
- **Incoherence / asset-soup** — mixed CC0 kits at different scales/palettes, untinted default gray, **cloned props**
  varied only by rotation/scale, grid-perfect placement, visible tiling, a cabin lit by a *different* fire than the
  Lodge.
- **Plastic, not satin** — glossy plastic shine baked into any surface; fullbright; `MeshBasicMaterial` in the bake.
- **Signal / guardrail crimes** — any streak / point / XP / score / countdown / FOMO on a cabin, on entering, or on
  returning; celebrating a **prompted** return; a badge on `unfinished`; any fixed label ("you are a musician").
- **Firewall breach** — any clearing delight that **emits a signal** or is counted/collected/badged/streaked; turning a
  cabin door into a delight or a delight into a door.
- **Arcade juice** — screenshake, confetti, big pops, saturated flashes on any interaction.
- **Accessibility crimes** — an `aria-hidden` primary surface; the AT path a **lesser flat menu** instead of a true peer
  that preserves *choosing where to wander and what to revisit*; essential motion under reduced-motion; a broken (not
  calm) reduced-motion still; an avatar that isn't `aria-hidden` and double-announces.
- **A tedious stroll** — an un-skippable or slow walk; making the child wait to reach a cabin.

### 8.3 Self-score rubric (score every phase; for each row write "what raises this +2"; implement the two cheapest first)

Per row: **10** = passes a one-second glance beside A Short Hike / Alba / Stardew / Firewatch dusk at 1080p on a
Chromebook; **7** = clearly synthetic but the *same class* of image; **4** = decent hobby demo; **2** = a menu with a
background / a pile of default-material CC0 assets.

- **Clearing coziness & "want to explore"** — do I want to walk around this hamlet?
- **Baked light & no-dead-shadow** — warm golden-hour key + cool dusk fill; blue-violet shadows, never gray.
- **Cabin legibility** — each craft nameable in ≤1s on four channels; the Lodge unmistakably home.
- **Wayfinding & home** — you-are-here + last-entered + return-glow legible in ≤1s.
- **Dressing density & lived-in feel** — ≥10 surface classes, "someone lives here."
- **Palette / color-script discipline** — everything on the `MAP_COLOR_SCRIPT` scale; warm/cool split holds; periwinkle
  is the one cool cabin accent.
- **Ambient life & breath cohesion** — one second from motion; one breathing place, not N loops.
- **Map↔cabin continuity** — same cabin, same fire, same hue across the cut; no hitch, no remount.
- **Return-glow legibility** — the signal reads as an ambient pattern, never a score.
- **"Not a menu" read** — reads as a *place*, not buttons-on-a-background (the operator's bar).
- **Accessibility parity** — the DOM peer is a true equal; reduced-motion serene.
- **Signal-free integrity** — the firewall holds (nothing on the clearing counts but entering/returning).
- **Chromebook perf** — DOM ~0 GPU; Canvas asleep; no remount; no scroll/focus jank.

### 8.4 The reference-delta loop + verification battery (reuses `window.__qa` + the VLM grader + the perf HUD)

1. **Reference-delta loop (mandatory).** Render the closest shot → place beside the matching hero frame (§1) → write
   `DELTA.md`: the **ten most significant differences, ranked**. **Fix the top three. Re-render.** Only then does the
   phase close. *You cannot run the loop without the reference wired in* (author §1 frames in phase 0).
2. **"Not-a-menu" VLM check.** On a screenshot: *"does this read as a place a child would wander (a hamlet/clearing), or
   as buttons on a background (a menu)?"* — pinned model, majority vote; a "menu" read **fails**.
3. **Shadow-color test.** Sample shadowed pixels on the plate: must show a **blue-violet** tint, **never desaturated
   gray** (Pillar B).
4. **Firelight test.** Assert the Lodge hearth + every cabin window read as warm glowing sources (emissive + bloom); a
   clearing with no lit fire fails.
5. **Cohesion / palette test.** Sample surface hues across the clearing; each must land in `MAP_COLOR_SCRIPT` (catches
   untinted kit-pile gray, off-scale hue).
6. **Legibility VLM rubric.** *Can I name the Lodge (home) and each cabin's craft in 1s? Is the "way in" (a door) and the
   "you are here" obvious?* — reference-free binary checks + deterministic DOM pre-filters.
7. **Primary-action-live test.** Entering each cabin (pointer + keyboard) changes `window.__qa.stateHash()`; a first
   entry → `noveltyVisits`, an unprompted `dayOffset≥7` re-entry → `voluntaryReturns` in the row (SC-CORE-14).
8. **Firewall negative assertion.** Fire **every** clearing delight → `getEmittedSignals()` records **zero** new events;
   the return grid / hypothesis unchanged.
9. **A11y parity + roving-tabindex test.** Keyboard reaches and enters every cabin the pointer can; arrow keys move focus
   one item at a time; the map root is **not** `aria-hidden`; the avatar **is** `aria-hidden`; golden `ariaLabel`s
   present.
10. **Reduced-motion test.** No parallax/sway/gust animates; the still is complete and serene; delights still work
    (instant + sound + static warmth-bump).
11. **No-remount / Canvas-asleep test.** The mocked-Canvas mount counter stays **1** across `enter→exit→enter`
    (SC-CORE-08); the Canvas `frameloop` is idle on the clearing; the room reveals only after `ready`.
12. **Perf HUD.** Clearing GPU ≈ idle; no scroll/focus jank; on a real low-end device under 10-min sustained load.
13. **Contact sheet.** The clearing at golden hour (a return-glow present) · the "a week later…" dusk quieting · a
    cabin hover/"Warm Window" state · a map→cabin transition still · the reduced-motion/`board-2d` a11y floor.

### 8.5 Final acceptance — the two-frame test

Produce two frames and place each beside its reference:

1. **"Golden Hour in the Clearing"** (§1.1) — the Lodge with its lit hearth + rising smoke dead-center; three distinct,
   instantly-legible cabins (terracotta / sage / periwinkle) along a warm winding path; the pond + footbridge; a
   wandering cat; long blue-violet shadows; fireflies; a gentle **return-glow** on one cabin window; the time-lapse
   signpost. *(Ref: A Short Hike overworld × Stardew × Firewatch dusk.)*
2. **"A Week Later — Dusk in the Clearing"** (§1.2) — the same composition settled toward dusk: sun a notch lower,
   shadows longer/bluer, "new" shimmers faded, fireflies thick, lanterns waiting, the revisited cabin keeping its warm
   return-glow while un-revisited smoke thins. *(Ref: Firewatch dusk × Cozy Grove.)*

If a viewer's eye snags within one second on a **category error** — buttons-on-a-flat-background, a bare/dead/cold/gray
clearing, no obvious home, an illegible cabin, dead-gray shadows, an incoherent kit-pile, a live-canvas Chromebook
slideshow, a gamified return, or a broken reduced-motion still — **the task is not done. Iterate the delta loop.** Then,
and only then, the operator free-explores on `localhost` for the final human sign-off (SC-CORE-16).

---

## 9. Buildable contracts (against the frozen shapes)

This doc is a **value + reference + asset layer**; it swaps no shipped shape. The additions below are pure data /
baked assets consumed by the existing `buildCuriosityMapView` / `<CuriosityMap>` / `<CanvasHost>` / `window.__qa`.

### 9.1 The clearing scene manifest (additive; pure data in `interest-lab-view`)

Baked-layer descriptors + normalized placements — the data the DOM compositor reads. Additive, GPU-free, golden-testable
(analogous to the cabin spec's `ATELIER_HOTSPOTS`); it changes **no** frozen type.

```ts
// interest-lab-view/src/clearing-scene.ts  (NEW, additive — pure, no react/three)
export interface MapLayer {
  id: string;                    // "sky" | "treeline" | "far-pines" | "ground" | "structures" | "near-pines" | "ambient"
  z: number;                     // paint order (0 = back)
  sprite?: string;               // baked webp path (or null for pure-DOM/particle layers)
  parallax: number;              // 0 = locked to sky; higher = nearer (dormant when fit-to-clearing)
  breathPhase?: number;          // per-layer offset into the shared breath clock
}
export interface MapPlacement {
  id: string;                    // "lodge" | "cabin:music" | "pond" | "lantern:0" | "lot:0" | "signpost" …
  at: { x: number; y: number };  // normalized clearing coords (== ClearingGraph.at where applicable)
  scale: number;                 // sprite footprint as a fraction of clearing width
  layerId: string;               // which MapLayer it composites into
  tint?: string;                 // MAP_COLOR_SCRIPT token (documentary; the bake already applies it)
}
export interface ClearingScene {
  layers: MapLayer[];            // the §2.3 stack, back → front
  placements: MapPlacement[];    // §3 inventory anchors
  home: "lodge";                 // the you-are-here anchor (== ClearingGraph.home)
}
```

### 9.2 The `ClearingGraph` v1 coordinates (gameflow §3.2; concrete)

```ts
// interest-lab-view/src/clearing.ts — v1 node anchors (normalized [0..1]; y: far→near)
const NODES = {
  lodge:                { at: { x: 0.50, y: 0.60 }, kind: "hub" },        // home / you-are-here
  "junction:fork":      { at: { x: 0.50, y: 0.47 }, kind: "junction" },
  "threshold:music":    { at: { x: 0.19, y: 0.39 }, kind: "threshold", zoneId: "music", facing: "right" },
  "threshold:code":     { at: { x: 0.50, y: 0.31 }, kind: "threshold", zoneId: "code" },
  "threshold:art":      { at: { x: 0.81, y: 0.39 }, kind: "threshold", zoneId: "art",   facing: "left"  },
  "poi:pond":           { at: { x: 0.80, y: 0.19 }, kind: "poi", label: "the pond" },
  "poi:footbridge":     { at: { x: 0.70, y: 0.25 }, kind: "poi", label: "the footbridge" },
  "poi:stump":          { at: { x: 0.42, y: 0.82 }, kind: "poi", label: "the sitting stump" },
  "lot:0":              { at: { x: 0.13, y: 0.24 }, kind: "lot" },        // room to grow
};
// edges: lodge↔fork, fork↔{music,code,art}, fork↔pond↔footbridge, lodge↔stump (soft dirt path spline, baked with the art)
```

### 9.3 The per-cabin `MapBuildingView` (supplied by each `ZonePlugin`; core §5.1 — shape unchanged)

```ts
// each zone exports these on its plugin.mapBuilding (label = the craft name = the button text + ariaLabel
// prefix; verb = DOM text; the cabin's proper name is its sign/scene name, not the label; hue = HUE_RAMP)
const MUSIC: MapBuildingView = { label: "Music Studio", glyph: "note",        enterVerb: "Step inside",
  cell: { col: 0, row: 0 }, art: { sprite: "clearing/cabin-music.webp", hue: "#E8825A" } };
const CODE:  MapBuildingView = { label: "Code Lab",     glyph: "cog-leaf",    enterVerb: "Step inside",
  cell: { col: 1, row: 0 }, art: { sprite: "clearing/cabin-code.webp",  hue: "#5FB98C" } };
const ART:   MapBuildingView = { label: "Art Studio",   glyph: "brush-frame", enterVerb: "Step inside",
  cell: { col: 2, row: 0 }, art: { sprite: "clearing/cabin-art.webp",   hue: "#6C8CE8" } };
// buildCuriosityMapView() computes returnState/unfinished/hue/ariaLabel per building (unchanged).
```

> **Label decision (RESOLVED — locked operator decision).** The `label` values above are the **clear craft
> names** — **"Music Studio" / "Code Lab" / "Art Studio"** — matching the frozen core §8.6 golden (`MAP_GOLDEN`),
> the reconciliation §1 "child-facing label" column, and the zone-v2 specs' `plugin.mapBuilding.label`. The
> child-facing `label` **is** the button text **and** the `ariaLabel` prefix (core §8.6:
> `"<label>, discovery zone, …"`), and it is the plain **craft name** on purpose: a child/AT user must be
> able to name the domain **instantly** (screen-reader legibility), so the button reads its craft, not the
> evocative cabin name. The **Emberwood cabin proper names** — "The Sounding Cabin" / "The Tinker Workshop" /
> "The Atelier Cabin" — remain the cabin's **name on its hanging sign, in the cabin table's identity column
> (§3.C), in hero-frame prose, and in scene/room descriptions** (art bible §1/§6, gameflow, aliveness,
> world-visual §A3). Two registers — the **button label = craft name**, the **world's flavor = cabin name** —
> with **no contract break**: the `MapBuildingView` shape, cells, glyphs, hues, and `enterVerb` are unchanged
> and the `label` now agrees with the golden across every spec.

### 9.4 `window.__qa` on the clearing (core §7; the gate can't be fooled)

```ts
window.__qa = {
  // ── frozen core §7 Qa shape (unchanged) ──
  primarySurface: "curiosity-map",                     // the DOM map is primary (not the canvas)
  canvas: { present: true, ariaHidden: false, primary: false, hasDomAlternative: true }, // suspended on the clearing
  activeZoneId: null,                                   // null = overworld; set on enter
  interactives(): QaInteractive[],                      // 3 cabin buildings (map-building) + the time-lapse (map-control)
  stateHash(): string,                                  // changes on cabin ENTER / on a return; NEVER on a clearing delight
  settle(frames?): Promise<void>,
  grid(): ReturnGrid, hypothesis(): RevisableHypothesis,
  // ── ADDITIVE QA-only accessor (NOT a core §7 shape change) ──
  getEmittedSignals(): Array<...>,                      // records ZERO from any clearing delight (the firewall)
};
```

> **On `getEmittedSignals()`.** This is an **additive, QA-only** accessor layered on top of the frozen core
> §7 `window.__qa` shape — it does **not** change the frozen contract. It makes the firewall test direct;
> the firewall is **equivalently** provable with the frozen shape alone (fire every delight → the frozen
> `grid()` / `hypothesis()` / `stateHash()` are **unchanged**). Either assertion satisfies §8.8 / §5.5.
> *(Flagged: the frozen core §7 `Qa` has no firewall accessor — see the audit report; if the harness needs
> one at contract level, the core spec owns that addition, not this doc.)*

### 9.5 CC0 sourcing + the bake pipeline (bible §10; pipeline §6–7)

The clearing bakes from the **same kit** as the rooms, so the map cabins == the room cabins. All CC0 (avoid Synty — its
EULA bans UGC/generative use). Ship `assets/LICENSES.json`.

| Clearing element | CC0 source (backbone) | Notes |
|---|---|---|
| Lodge, cabin shells, log walls, roofs, porch, chimney, footbridge, signpost | **KayKit** (Medieval/timber) + **Kenney** (Building Kit) | one gradient atlas → `<Merged>` shell; tint `wood.*`; the *same* shells as the room exteriors |
| Trees, pines, stumps, moss, grass, plants, vines | **Quaternius** (Ultimate Nature) + **Kenney Nature** | instanced (`InstancedMesh`) in the bake; per-instance jitter |
| Lanterns, string-lights, bell, rocking chair, water/pond/stream props | **Kenney** (Survival/Holiday) + **KayKit** props | lanterns/bulbs = emissive material |
| Biscuit the cat, the bird, the deer/fox, the wind-up Sprout | **Quaternius** (Animated Animals) + **KayKit** anims | the cat baked to directional sprite frames (DOM) or a tiny sprite |
| Warm-interior / golden-window **HDRI** | **Poly Haven** (1–2K, self-hosted) | the single `<Environment>` IBL at bake — the cohesion lever |
| PBR textures (wood, stone, foliage, plaster) | **Poly Haven** + **ambientCG** (CC0) | 512–1K → KTX2 at bake |
| Signs, glyphs, return-glow, smoke ♪, the you-are-here marker | authored flat SVG/atlas | DOM overlays; emissive |

**The bake tool (offline / CI):** an r3f/three **isometric orthographic** render script → lays out the hamlet from the
kit → applies the warm `SCENE3D` pack + HDRI + `<AccumulativeShadows>` + fog + Bloom/ACES → renders each **layer** (sky,
treeline, far-pines, ground+paths+water+shadows, per-structure sprites, near-pines) to `webp` at the clearing grid →
emits the `ClearingScene` placement manifest. Re-runs when the kit or pack changes (world-visual Appendix: "bake sprites
in CI from the CC0 kit + warm pack"). Vector/CSS is the deferred-baking fallback (§2.2).

### 9.6 Build order (phased; each ends with the delta loop + self-score; composes with bible §15 P-A1, gameflow G1–G5, aliveness P-G1/§3–§4)

- **P0 — References + harness.** Author the §1 frames into `.../reference/`; wire the delta tool; stand up the
  not-a-menu / shadow-color / cohesion / legibility / firewall tests on a stub clearing. *Gate: tests green on a stub.*
- **P1 — Bake the clearing to bar.** Lay out the hamlet from the kit; bake the 7-layer stack through the warm pack + HDRI
  + frozen shadows; emit the `ClearingScene` manifest. *Gate: shadow-color + firelight + cohesion; the "Golden Hour in
  the Clearing" delta loop.*
- **P2 — Compose the DOM clearing + buttons.** Layer the plates with parallax; overlay the focusable cabin buttons
  (roving-tabindex, `ariaLabel`), the you-are-here marker, the return-glow states, the time-lapse signpost. *Gate:
  SC-CORE-09/10; a11y parity; two-frame **frame 1**.*
- **P3 — Aliveness on the breath clock.** Smoke (+♪), sway, fireflies, water shimmer, the wandering cat, window flicker,
  the wind/gust system; the signature delights with the cozy-juice grammar. *Gate: aliveness-at-rest VLM;
  breath-cohesion; firewall negative assertion; DOM ~0 GPU.*
- **P4 — Transition + time-lapse.** The door-swing hue-wipe + preload-under-wipe + spatial exit (never remount); the
  dusk mood-LUT quieting. *Gate: no-remount / Canvas-asleep; time/mood test; two-frame **frame 2**.*
- **P5 — Tiers + a11y sweep.** `lite` + `board-2d` degrade (the button grid over a static plate); reduced-motion serene
  still; SR scripts + live regions. *Gate: full parity + reduced-motion + perf HUD (clearing ≈ idle GPU).*

**Definition of done:** the two-frame test snags no category error (menu / bare / dead / cold / gray-shadow /
no-home / illegible-cabin / incoherent / live-canvas-slideshow / gamified-return) at a one-second glance beside the
references; every self-score row ≥ 7; **the clearing reads as a warm, lived-in hamlet you want to wander — a home Lodge
with a lit fire and three cabins you can name at a glance — NOT a menu**; entering a cabin is provably live; every
clearing delight is provably signal-free; the Canvas stays asleep on the clearing at ~0 GPU; and a child can reach,
name, and step into every cabin by keyboard alone.
