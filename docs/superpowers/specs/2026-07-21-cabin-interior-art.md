# Cabin Interior — ART: **"The Atelier"** (the 3D set, built to maximum depth)

**Date:** 2026-07-21 · **Owner:** David · **Lane:** W/3 (world visuals × the Art zone loop) · **Domain:** `visual_design`
· **Zone id:** `art` · **Cabin:** The Atelier Cabin (`HUE_RAMP[2]` periwinkle **`#6C8CE8`**)

**Scope:** the *concrete, buildable, set-dressed* interior of the **ART cabin** in Emberwood — a cozy log-cabin
**artist's atelier at golden hour**. This is the **highest visual-bar surface in the entire product** (zone-art v2 §4;
art bible §7.2). It is content-deferred v1: the room is a *complete, gorgeous, live place* whose one "go deeper" object
is a **host-ready warm placeholder** (the glowing easel). This doc is the environment-artist's build sheet: the reference
frame, the coordinate layout, the itemized prop inventory (scale + placement each), the light rig, the aliveness, the
CC0 sourcing, the draw-call budget, and the LAAS floors/bans/self-score.

**Reads first (this doc obeys all of them; where they conflict, the order below wins):**
- [`2026-07-21-world-art-direction-cozy-cabin.md`](./2026-07-21-world-art-direction-cozy-cabin.md) — the Emberwood
  palette (§3.1 hero tokens), materials (§4), the lighting recipe (§5), the shared cabin interior kit (§8.1), and the
  named hero frame **"The Atelier at Golden Hour"** (§7.2). **The bible wins on palette/light/budget.**
- [`2026-07-21-zone-art-design-v2.md`](./2026-07-21-zone-art-design-v2.md) — the Art zone: the 3 reference frames
  (§4.1), scene-contents-by-surface-class (§4.2), the Storybox hero (§4.8), the easel doorway (§10), the motion
  inventory (§4.5), and the self-score (§4.10).
- [`2026-07-21-world-gameflow-movement.md`](./2026-07-21-world-gameflow-movement.md) — **fixed composed camera +
  gentle clamped look + step-to-hotspots** (§4.1), the `RoomHotspot` model (§4.2), and the **host-ready warm doorway
  placeholder** (§4.3).
- [`2026-07-21-world-aliveness-and-juice.md`](./2026-07-21-world-aliveness-and-juice.md) — the **breath clock** (§5.1),
  the **cozy-juice grammar** (§4.1), and **the firewall: juice is never signal** (§1.2).
- [`stylizedWorldAssetPipeline.md`](../../research/stylizedWorldAssetPipeline.md) — CC0 backbone (Kenney/Quaternius/
  KayKit), one HDRI, frozen shadows, instancing, `<50` draw calls, `dpr≤1.5`, `frameloop="demand"`.

**Frozen contracts it must NOT break (grounded in the shipped code):** `Scene3DView`/`SCENE3D`, `Camera3DView`/
`CAMERA3D` (adopted **verbatim**), `HUE_RAMP` (art = index 2 = `#6C8CE8`), `PALETTE`, `QUALITY_TIERS`,
`resolveRenderTier` (`quest-world-3d` → `quest-world-3d-lite` → `board-2d`), `WORK_MODE_GLYPHS`
(`compose:"glyph-quill"`), the single persistent `<Canvas>`, and `window.__qa`. This doc is a **content + reference
layer**; it swaps no shipped shape.

**Guardrails:** [`passionBrainlift.md`](../../research/passionBrainlift.md) Insight 4/5 — **rewards corrupt the
voluntary-return signal, worse in children; never gamify the measurement.** Every delight here is deliberately
signal-free.

**Depth model = LAAS:** a named reference frame, an itemized contents list, hard floors, an explicit banned-outcomes
list, a reference-anchored self-score, and a mandatory reference-delta loop — **judged against images, not against
"pretty good for a browser."**

---

## 0. TL;DR — what this doc decides

1. **The set is a real artist's atelier that a child wants to live in — cozy log cabin FUSED with the tools and mess of
   making pictures.** Warm honey wood + beams + a glowing wood-stove, and everywhere the evidence of a painter mid-work:
   a **grand easel** with a luminous canvas (the doorway), a **paint-cluttered drafting desk**, a **gallery wall** of
   little framed paintings and pinned sketches, **shelves of pigment jars & sketchbooks**, a **pottery wheel** with wet
   clay, a **still-life corner** (fruit bowl + draped cloth + wooden mannequin), **string-lights**, a hanging **mobile**,
   and **paint-splattered stools**. Colorful but cohesive; warm and lived-in one second ago.
2. **The signature is the one thing a real atelier has that no other cabin does: TWO lights that meet.** A **warm
   golden-hour raking key** (the hero shaft, with dust motes) makes it cozy; a **cool, even NORTH-LIGHT window** makes
   the colors *read true* — the exact reason painters build north-facing studios. This diegetically justifies the art
   bible's warm-key-+-cool-fill law and makes the ART cabin the one place where warm and cool are *the subject*. The
   room should feel like **the golden-hour light loves the art**.
3. **The doorway object is the grand easel's canvas — a soft luminous periwinkle "portal into making."** It rests at
   `SCENE3D.markerEmissiveRest` (0.35) and breathes to `…Pulse` (0.5) in the art hue `#6C8CE8`, with a warm
   `light.window #FFC08A` inner glow; the ONE verb *"Step up to the easel"* floats above it. It is the single obvious
   primary affordance and is **provably live** (`window.__qa.stateHash()` changes on contact) *before any content
   exists*.
4. **The camera never moves off its rails.** Fixed composed `CAMERA3D` (fov 42, home `[0,4.5,15]` → target
   `[0,0.4,0]`), gentle clamped look-around, and **step-to-hotspots** (hero desk → doorway easel → ambient stove /
   wheel / gallery / still-life / cat / shaft). Three authored poses map to the reference frames: `wide` · `cozy` ·
   `hero`.
5. **It survives a Chromebook.** One HDRI + one shadow-caster + emissive practicals; frozen shadows; palette fog; Bloom
   + Vignette + ACES; **~38 draw calls (hard cap < 50)** via `<Merged>` shell + instanced sets (the gallery frames, the
   pigment jars, the string-light bulbs are each ONE draw call); degrades `room-3d` → `room-3d-lite` → the **`ActivityDOM`
   accessible peer**.
6. **Aliveness is signal-free.** ≥8 always-on motions on one breath clock; the art-flavored micro-interactions —
   **spin the pottery wheel · the mobile turns · a brush sways in the water jar · stoke the stove · pet the sill-cat** —
   are cozy, satisfying, and emit **zero** `ActivityEvent` (the firewall). The easel doorway is *not* a delight and no
   delight is a doorway.

**The doorway object (headline):** **the grand easel's luminous periwinkle canvas → *"Step up to the easel."*** Warm
`light.window` inner glow inside a periwinkle `#6C8CE8` rim; breathes 0.35↔0.5; the one primary, host-ready, live
affordance of the room.

---

## 1. Reference frames — name the bar

Author these stills into `passion/apps/interest-lab/reference/interest-zone-art/reference/` in phase 0; every phase is
judged **side-by-side** against them at a one-second glance on a Chromebook screen. Aesthetic anchors: **Studio-Ghibli
interiors** (*Kiki*'s attic, *Whisper of the Heart*'s desk — warm shaft light, dust motes, lived-in clutter, "a place
you want to be"), **A Short Hike** (cozy low-poly warmth), **Alba** (clean warm sun), **Coraline/Laika** (shadow-box
tactility), **cottagecore** (the material + prop vocabulary: knit, dried flowers, warm wood, brass, worn leather,
ceramics, jars).

### 1.1 THE hero frame — **"The Atelier at Golden Hour"** (the `wide` pose; the two-frame acceptance target)

> Late afternoon inside a warm log cabin that a painter clearly lives in. A **golden shaft** slants in from a high west
> window on the **left**, crossing the room and landing on the **grand easel** on the right — its canvas glowing a soft
> luminous **periwinkle**, warm on one edge where the sun kisses it. **Dust motes drift** in the shaft. Overhead, dark
> **cocoa beams** frame the top of the shot and carry a swag of **warm string-lights** and a slowly-turning **paper
> mobile**. Center-back, a tall **north-light window** pours a cool, even, true-color light over the **gallery wall** of
> little framed paintings and pinned sketches — one **half-finished frame glows** warm. Far-right corner, a cast-iron
> **wood-stove glows amber**, a kettle steaming on top. Left-center sits the **drafting desk**, a joyful mess of brush
> jars, squeezed paint tubes, a wet palette, a murky water jar with a brush soaking, an open sketchbook, and a warm desk
> lamp pooling light. Front-left, a **pottery wheel** with a half-thrown pot; front-right, a **still-life corner** — a
> fruit bowl on a draped cloth, a wooden mannequin mid-pose. A knit **rug** anchors the floor, a **paint-splattered
> stool** waits at the easel, potted **plants** soften the corners, and a **cat sleeps on the north-light sill**. Warm
> honey fog ties it together; a soft **bloom** haloes every flame, bulb, lamp, and the periwinkle portal. Long
> **blue-violet** shadows. It reads, in one second: *an artist's studio, warm, and mid-making.*
> *(Refs: Ghibli attic studio × Alba sun × A Short Hike interior × Coraline tactility × cottagecore.)*

### 1.2 The sub-frames (the other two authored camera poses)

- **"The Drafting Desk" (`cozy` pose).** Close on the desk (the most detailed 30 cm of the room; §3.B). The **Storybox**
  diorama glows mid-scene (a tiny lit forest, a fox on the near lip); a jar of brushes, four paint tubes, a wet palette,
  a water jar with a soaking brush, an open sketchbook + pencil, a chipped mug with faint steam, a warm lamp, two
  crumpled sketch-balls, a paint rag. The cat's tail curls into frame from the sill. *(Ref: Whisper of the Heart's desk
  × Unpacking object-feel.)*
- **"The Easel Portal" (`hero` pose).** The grand easel dead-center, its canvas a **soft luminous periwinkle portal**
  breathing warm, a paint-splattered stool before it, the ONE verb floating in the display font (*"Step up to the
  easel"*), string-light bokeh above, gentle bloom, a warm sun-kiss on the frame's left edge, a periwinkle rim-light.
  *(Ref: Ghibli "the thing you make at" × Alba.)*

**The inversion of LAAS (stated plainly):** our floors are **cohesion, warm+true light, legibility, coziness, and
motion** under a hard draw-call ceiling — not polygon count. A screen that is *dense but incoherent, gray-lit, cold, or
"a bench on a bare floor"* is a **failed screen**, exactly as flat 2010 terrain is a failed LAAS screen.

---

## 2. The room's coordinate frame + spatial layout

### 2.1 Coordinate convention (grounded in the shipped `CAMERA3D`)

The shipped camera is adopted **verbatim** (gameflow §4.1): `fov 42`, `home.pos [0, 4.5, 15]`, `home.target
[0, 0.4, 0]`, `establishStart.pos [0, 7, 22]`, `focusFillDistance 6.5`, orbit clamps `polar 60–85°`, `azimuth ±75°`,
no pan/zoom. So the camera stands at **z = +15**, eye ~**y 4.5**, and looks **into −z**, slightly down. The room is a
bounded box opening toward the camera (the "fourth wall" is the camera side).

**Scale:** 1 world unit ≈ **0.4 m** (camera eye ≈ 1.8 m; a 0.75 m desktop ≈ y 1.9). Room interior ≈ **5.6 m × 4.4 m ×
2.3 m**.

| Extent | World units | Meaning |
|---|---|---|
| Floor | x ∈ [−7, +7], z ∈ [−7, +4], y = 0 | wood plank; near-edge boards (z > +2) are `wood.cocoa` (the dark frame) |
| Back (north) wall | z = −7 | holds the **north-light window** (left-of-center) + the **gallery wall** (right-of-center) |
| Left (west) wall | x = −7 | holds the **pigment/sketchbook shelves** + a high **west window** (the warm shaft source) |
| Right (east) wall | x = +7 | holds the **wood-stove** nook + pegged aprons/tools |
| Ceiling / beams | y ≈ 5.0–5.7 | exposed timber beams; a **cocoa foreground beam** at z ≈ +2.3 frames the top |
| Subject band | z ∈ [−6, +1] | desk, easel, wheel, still-life live here (camera reads them clearly) |
| Foreground frame | z ∈ [+2, +4] | dark beam, hanging plants, rug near-edge, a stool silhouette (value structure) |

### 2.2 Top-down plan (buildable)

```
                         BACK / NORTH WALL  (z = −7)
   ┌──────────────────────────────────────────────────────────────┐
   │  [north-light window]        [gallery wall + glowing frame]    │
   │   cool even true-light         framed art · pinned sketches    │
   │   (cat on sill, curtains)                    [WOOD-STOVE]🔥    │  ← stove nook (x≈+5.5)
 W │                                                                │ E
 E │        ▣ DRAFTING DESK (hero)              🖼 GRAND EASEL      │ A
 S │        (x≈−3, z≈−3)                        (DOORWAY, x≈+3,     │ S
 T │   [pigment/sketchbook shelves]              z≈−3.2, angled)    │ T
   │   (west window high↗ = warm shaft)             △ stool         │
 W │              ~~~ knit rug ~~~                                   │ W
 A │   ◔ POTTERY WHEEL              🍎 STILL-LIFE + MANNEQUIN        │ A
 L │   (x≈−4.8, z≈−0.5)             (x≈+5, z≈−1)                     │ L
 L │ · · · · · · · foreground frame: beam ▬ · hanging plants · · · ·│ L
   └──────────────────────────────────────────────────────────────┘
                    ↑ open fourth wall — CAMERA at [0, 4.5, 15] looking −z ↑
       overhead everywhere: beams ▬▬▬ · string-lights ✷✷✷ · slow mobile ✺ · drying-line canvases
```

### 2.3 Focal path, foreground framing, value structure (art bible Pillar E)

The composition is staged **dark foreground → lit mid subject → luminous background**, and the eye is walked on a clear
path:

1. **Foreground frame (dark, `wood.cocoa`, z ∈ [+2,+4]):** the near cocoa beam across the top, a trailing plant and a
   swag of string-lights dipping into the top corners, the rug's near edge and a silhouetted stool at the bottom. This
   is the cozy "you are looking *into* a room" vignette — never bright, never bare.
2. **Lit mid subjects (the golden band, z ∈ [−4,0]):** the **drafting desk (hero)** on the left and the **grand easel
   (doorway)** on the right, both raked by the warm shaft — the two focal points, deliberately separated so they never
   fight (desk = "make a little something now," easel = "go deeper"). The knit rug visually links them.
3. **Luminous background (z ≈ −7):** the **north-light window** (cool, even, true-color) behind the gallery wall, the
   **glowing half-finished frame**, and the **amber wood-stove** in the corner — the warm/cool luminous backdrop that
   makes the mid-ground read.

**The focal read (≤1 s):** the warm shaft points the eye from the bright north window → down to the easel's glowing
periwinkle canvas (the brightest cool accent, haloed by bloom) → the floating verb. Second glance: the cozy desk, the
stove, the wheel, the cat. The doorway wins the first glance; the room rewards the second.

**Camera poses** (eased via `resolveCamera3D`; reduced-motion → `cut`): entry drifts `establishStart → home` (=
`wide`); tapping the desk eases to `cozy`; tapping the easel eases to `hero` (`focusFillDistance 6.5` in front). A
persistent **"← Back to the clearing"** is always present and first in focus order.

---

## 3. The full prop inventory (the itemized contents list)

Every surface class carries occupants (art bible Pillar C, "nothing is bare"). **All repeats are instanced** (one draw
call per prop *type*) with **per-instance hue/value/scale/rotation jitter** — cloned uniformity is a fail (§9). Scale is
given in **meters** (world units ≈ m ÷ 0.4). Placement is the anchor `(x, y, z)` in world units + facing. Tint targets
are art-bible §3.1 tokens. `DC` = draw-call attribution (see the budget, §7.2). Stations map to reference frames and to
`RoomHotspot`s (§11.1).

### 3.A — Shell & architecture (the cozy-cabin base)

| # | Prop | Count | Scale (m) | Anchor / extent | Tint | Motion | DC group |
|---|---|---|---|---|---|---|---|
| A1 | Wood plank **floor** | 1 | 5.6 × 4.4 | y0, x[−7,7] z[−7,4] | `wood.oak`; near-edge boards `wood.cocoa`; paint-drip decals near easel & wheel | — | shell |
| A2 | Log/plank **walls** + plaster chinking | 3 | h 2.3 | back z−7, left x−7, right x+7 | `wood.walnut` logs + `plaster.cream` chinking | — | shell |
| A3 | Exposed **ceiling beams** | 5 | 0.18² × 5+ | y≈5.0, crossing | `wood.walnut`; the **foreground beam** (z+2.3) = `wood.cocoa` | breath sway (imperceptible) | shell |
| A4 | **North-light window** (tall, many-pane, canted head) | 1 | 1.6w × 1.4h | back wall x[−4.5,−0.6], y[1.6,5.0], z−7 | frame `wood.driftwood`; glass shows `dusk.window #7C93B8` cool exterior | curtain breath | window |
| A5 | **West window** (high clerestory, the warm shaft source) | 1 | 1.0w × 0.8h | left wall x−7, y[3.4,4.6], z−2 | frame `wood.driftwood`; warm `light.window` spill | — | window |
| A6 | Cast-iron **wood-stove** (potbelly) + stovepipe | 1 | 0.75 h | x+5.5, y0, z−6.2 | body `wood.cocoa`/iron; **emissive firebox** `fire.ember→fire.flame` | fire flicker (breath) | stove |
| A7 | **Kettle** on the stove | 1 | 0.2 | on A6 top | `patina.verdigris` | steam wisp | stove |
| A8 | Split-log stack + folded **knit blanket** | 1 | 0.5 | beside A6 (x+6.2, z−6) | logs `wood.honey`; blanket `wool.cream` | — | stove |
| A9 | Plank **door** + paint-splash doormat (spatial "you came in here") | 1 | 0.9 × 2.0 | left wall x−7, z+1 | `wood.oak`; mat splatter in `HUE_RAMP` hues | — | shell |

### 3.B — The drafting / paint table (the **hero** hotspot; the `cozy` close-up)

The most lovingly detailed 30 cm in the room; "Frame 2" is judged here. Sturdy timber table, **x −3.0, y0, z −3.0**,
top at y≈1.9, ~1.4 m long, facing camera-right (slightly angled).

| # | Prop | Count | Scale (m) | Placement (on desktop unless noted) | Tint | Motion | DC group |
|---|---|---|---|---|---|---|---|
| B1 | Timber **drafting/paint table** | 1 | 1.4 × 0.7 × 0.9 | anchor above | `wood.oak`, waxed sheen on handled edges | — | desk |
| B2 | The **Storybox** shadow-box diorama (world-layer "make" toy; hero, glows) | 1 | 0.32 | desk center | frame `wood.walnut`; interior auto-beautified, soft emissive | starter prop bobs (`<Float>`); glow-breath | desk |
| B3 | Ceramic **brush jar** + brushes | 1 jar, **≥6 brushes** (instanced) | jar 0.12; brushes 0.25 | desk left | jar `ceramic.warm`; handles jittered `HUE_RAMP` | — | desk-props |
| B4 | **Paint tubes** (instanced) | **≥5** | 0.1 | scattered, some squeezed/dented | body `brass`/white; caps jittered `HUE_RAMP` + `PALETTE` | — | desk-props |
| B5 | Wooden **palette** with wet dabs | 1 | 0.3 | desk near edge | `wood.driftwood`; dabs satin, jittered hues | — | desk-props |
| B6 | Glass **water jar** + soaking brush (murky periwinkle water) | 1 | 0.13 | desk right | glass; water tinted `dusk.window`; brush handle `leather.worn` | **brush sways** (micro-interaction §6.3) | desk-props |
| B7 | Open **sketchbook** + pencil + loose graphite studies | 1 book, 2 sheets | 0.25 | desk front-left | `paper.parchment`; pencil `brass` | — | desk-props |
| B8 | Chipped **mug** (tea/coffee, faint steam) | 1 | 0.09 | desk back-right | `ceramic.warm` glaze, ring-stain | steam wisp | desk-props |
| B9 | Warm **desk lamp** (emissive) | 1 | 0.4 | desk back-left, arm bent over Storybox | shade `brass`; bulb `light.lantern` (emissive) | — | desk |
| B10 | **Crumpled sketch-balls** (instanced) | **≥2** | 0.06 | on desk + one on floor | `paper.parchment` | — | desk-props |
| B11 | Jar of **pencils/charcoal** + a putty/palette knife + a paint rag | 1 set | 0.12 | desk right cluster | mixed; rag smeared `HUE_RAMP` | — | desk-props |

### 3.C — The grand easel (the **doorway** hotspot; the `hero` pose) — see §4 for the portal spec

Studio H-frame easel, **x +3.0, y0, z −3.2**, ~1.7 m tall, canvas angled ~30° toward camera-left so its face reads.

| # | Prop | Count | Scale (m) | Placement | Tint | Motion | DC group |
|---|---|---|---|---|---|---|---|
| C1 | **Grand easel** (H-frame, paint-splattered) | 1 | 0.7 × 1.7 | anchor above | `wood.oak`; splatters jittered `HUE_RAMP` | — | easel |
| C2 | **Canvas = the periwinkle portal** (the doorway object) | 1 | 0.7 × 0.9 | on C1, facing camera | **emissive** `#6C8CE8` rim + `light.window #FFC08A` inner | glow-breath 0.35↔0.5 (§4) | easel-portal |
| C3 | **Paint-splattered stool** before the easel | 1 | 0.45 | x+2.4, z−2.6 | `wood.driftwood`; splatters | — | stools |
| C4 | **Taboret / side tray** (big palette, tubes, mahl stick, jar) | 1 | 0.5 | x+4.2, z−3.2 | `wood.walnut`; contents jittered | — | easel |
| C5 | Floating **verb** *"Step up to the easel"* | 1 | — | above C2 | display font, `light.candle` | soft fade-in on approach | signage |

### 3.D — The gallery wall (center-back; the payoff + the "half-made thing is still here" cue)

Back wall right of the north window, **x [0.5, 5.0], y [1.6, 4.6], z −6.95**.

| # | Prop | Count | Scale (m) | Placement | Tint | Motion | DC group |
|---|---|---|---|---|---|---|---|
| D1 | Framed **little paintings** (instanced frames; art on a shared atlas) | **≥8** | 0.2–0.4 | gridded-but-jittered on wall | frames `wood.honey`/`brass`, jittered; images cohesive-warm | — | gallery-frames |
| D2 | **Half-finished frame that GLOWS** (the return cue) | 1 | 0.35 | wall, eye-height | warm `light.window` halo + `#6C8CE8` edge | glow-breath | gallery-frames |
| D3 | **Pinned sketches / studies** (instanced, tacked to plaster) | **≥6** | 0.15–0.25 | around the frames | `paper.parchment`; pins `brass` | corner curl breath | gallery-pins |
| D4 | Small **shelf-ledge** + trinkets (mini sculpture, seashell, color-swatch fan) | 1 ledge, **≥3** | 0.1 | below the frames | mixed; swatch fan bright | — | gallery |
| D5 | String of little **pennants / bunting** | 1 | 1.5 | swagged above frames | fabric jittered warm | breath sway | gallery |

### 3.E — Shelves of pigments & sketchbooks (left wall; the colorful-cohesive pop)

Tall plank shelf unit, **x −6.6, y0, z −4.0**, y up to 4.5, facing camera-right.

| # | Prop | Count | Scale (m) | Placement | Tint | Motion | DC group |
|---|---|---|---|---|---|---|---|
| E1 | Plank **shelf unit** | 1 | 1.0 × 0.3 × 1.8 | anchor above | `wood.walnut` | — | shelf |
| E2 | **Pigment jars** (instanced; the rainbow, kept on-palette) | **12–20** | 0.1 | rows on E1 | glass + jittered `HUE_RAMP`/`PALETTE` powders | — | shelf-jars |
| E3 | Stacked **sketchbooks & leather books** (instanced, leaning) | **≥8** | 0.2 | on E1 | `leather.worn` + `paper.parchment` spines | — | shelf-books |
| E4 | Bin of **rolled canvases / paper rolls** | 1 | 0.6 | floor beside E1 | `paper.parchment`/`plaster.cream` | — | shelf |
| E5 | Plaster **cast bust** (classic atelier prop) | 1 | 0.3 | top of E1 | `plaster.cream`, matte | — | shelf |

### 3.F — The pottery wheel + clay (front-left; the "spin" micro-interaction)

A step-to hotspot in the foreground-left, **x −4.8, y0, z −0.5**.

| # | Prop | Count | Scale (m) | Placement | Tint | Motion | DC group |
|---|---|---|---|---|---|---|---|
| F1 | **Pottery wheel** (kick/electric, splash-pan) | 1 | 0.6 × 0.6 × 0.7 | anchor above | frame `wood.cocoa`/iron; wheelhead `ceramic.warm` | **spins** (micro-interaction §6.3) | wheel |
| F2 | Half-thrown **wet clay pot** on the head | 1 | 0.2 | on F1 | `ceramic.warm` wet, satin | wobble/rise on spin | wheel |
| F3 | Shelf of **drying greenware** pots/bowls (instanced) | **≥5** | 0.12–0.2 | small shelf x−6.2, z−0.5 | unglazed `ceramic.warm`, matte, jittered | — | wheel-pots |
| F4 | Water bucket + clay-splattered **apron on a hook** + wire tools | 1 set | 0.3 | beside F1 / on wall | apron `leather.worn` clay-smeared | — | wheel |

### 3.G — Mannequin / still-life corner (front-right)

A step-to hotspot, **x +5.0, y0, z −1.0**, under a small aimed lamp.

| # | Prop | Count | Scale (m) | Placement | Tint | Motion | DC group |
|---|---|---|---|---|---|---|---|
| G1 | Small **draped table** (still-life stand) | 1 | 0.6 × 0.6 | anchor above | `wood.oak` under `wool.cream` **draped cloth** (satin folds) | cloth breath | stilllife |
| G2 | **Fruit bowl** + fruit (instanced) | 1 bowl, **≥4** | 0.2 | on G1 | bowl `ceramic.warm`; fruit jittered `forest.moss`/`rust.leaf`/`fire.flame` | — | stilllife-fruit |
| G3 | Wooden **artist's mannequin** (poseable figure) | 1 | 0.4 | on/beside G1 | `wood.honey`, waxed | — | stilllife |
| G4 | A bottle + an egg + a small vase (the classic set) | 3 | 0.1–0.3 | on G1 | glass/`ceramic.warm`/`brass` | — | stilllife |
| G5 | Adjustable **still-life lamp** (emissive, aimed) | 1 | 0.4 | x+6.4, z−1 | shade `brass`; bulb `light.lantern` | click-on (micro) | stilllife |

### 3.H — Floor & textiles

| # | Prop | Count | Scale (m) | Placement | Tint | Motion | DC group |
|---|---|---|---|---|---|---|---|
| H1 | Knit/woven **rug** (anchors desk↔easel) | 1 | 2.0 × 1.4 | center, z[−4,−1] | `wool.warm` jitter (→ sage/rust/cream ribs) | — | rug |
| H2 | **Paint-splattered stools** (instanced; +1 by desk beyond C3) | **≥2** | 0.45 | by desk (x−2, z−1.5) + spare | `wood.driftwood`; splatters | — | stools |
| H3 | Slouchy **supply satchel/bag** | 1 | 0.4 | floor by shelf | `leather.worn` | — | floor |
| H4 | Floor **plants** (potted, instanced with sill plants) | **≥2** | 0.5 | corners (x−6 z0; x+6 z0) | pot `ceramic.warm`; foliage `forest.pine` | leaf sway (breath) | plants |
| H5 | Paper scraps, a dropped brush, a tube cap (the "someone works here" litter) | ~4 | 0.05 | near desk/easel | mixed | — | floor |

### 3.I — Ceiling & string-lights (cheap warmth + motion)

| # | Prop | Count | Scale (m) | Placement | Tint | Motion | DC group |
|---|---|---|---|---|---|---|---|
| I1 | **String-lights** (instanced emissive bulbs + cord) | **≥10 bulbs** | 0.04 | swagged beam→beam, dipping into front corners | bulbs `light.lantern` (emissive); cord `wood.cocoa` | twinkle (breath) | string-lights |
| I2 | Hanging **mobile** (paper birds / color chips / tiny canvases; instanced arms) | 1 rig, **≥5 chips** | 0.4 | above rug, y≈4.2 | chips jittered `HUE_RAMP` | **slow turn** + **push on tap** (§6.3) | mobile |
| I3 | **Drying-line canvases** (little canvases pegged to a cord; instanced) | **≥4** | 0.15 | strung left→center, y≈4.4 | tiny cohesive-warm images; pegs `wood.honey` | sway in gust (breath) | drying-line |
| I4 | Trailing **vine** from a ceiling pot (foreground frame) | 1 | 0.8 | front-right corner, dips in | `forest.pine`/`forest.moss` | sway (breath) | plants |

### 3.J — Window sill & living cues (the soul)

| # | Prop | Count | Scale (m) | Placement | Tint | Motion | DC group |
|---|---|---|---|---|---|---|---|
| J1 | **Golden light-shaft** (soft god-ray volume / emissive quad + fog gradient) | 1 | — | west window → across to easel | warm `SCENE3D.keyHex #FFD8A3` | subtle drift (breath) | shaft |
| J2 | **Dust motes** in the shaft (`<Sparkles>`) | 60/24/0 per tier | — | inside J1 | `light.candle`/`light.lantern` | drift | motes |
| J3 | **Sill plants** (instanced with H4) | **≥2** | 0.25 | north-light sill | `forest.moss` | leaf sway | plants |
| J4 | **Sleeping cat** ("Biscuit"; the one animated allowance) | 1 | 0.3 | on the north-light sill | `fire.flame`/`rust.leaf` amber fur | breathes (scale); tail flick; **pet** (§6.3) | cat |
| J5 | Breathing **curtains** (light linen) | 1 | 1.4 | north window | `plaster.cream`, soft | slow vertex sway (breath) | window |
| J6 | Painter's **smock/apron on a peg** (paint-smeared; "someone just stepped out") | 1 | 0.6 | left wall by shelf | `wool.cream` smeared `HUE_RAMP` | — | shell |

**Tally:** ~**60+ discrete visible objects** across **11 surface classes** (floor · walls/beams · window+sill · stove ·
drafting desk · easel · gallery wall · shelves · pottery wheel · still-life · ceiling) — comfortably clears the **≥45
objects / all-8 surface-classes** floor (zone-art §4.6) and the world bible's ≥30 / ≥5-classes floor (§9). Under-dressing
to hit the budget is itself a failure — **instance instead** (§7.2).

---

## 4. The doorway object — the grand easel's periwinkle portal

The single primary affordance; a **host-ready warm placeholder** (gameflow §4.3) — never a dead "coming soon" wall.

- **What it is.** Prop **C2**: the canvas on the grand easel (§3.C), angled ~30° to camera-left, its face an **emissive
  "portal into making."** The glow is the art bible's one deliberate cool accent read as *inviting*, not cold: a
  periwinkle `HUE_RAMP[2] #6C8CE8` **rim/edge** around a warm `light.window #FFC08A` **inner** gradient, so it reads as
  a lit window at dusk that the golden shaft also kisses on its left edge (warm × cool = the ART cabin's whole identity).
- **How it glows.** Rests at `SCENE3D.markerEmissiveRest = 0.35`, breathes to `markerEmissivePulse = 0.5` on the breath
  clock (§6.1); `bloomPeak 1.4` haloes it. It is the **second focal point** after the north window — the eye lands on
  the fire/stove for comfort and on the portal for *the one thing to do* (art bible §8.2).
- **The verb.** Prop **C5**: *"Step up to the easel"* floats above in `TYPOGRAPHY.fontDisplay`, `light.candle`, fading
  in as the camera nears the `hero` pose. One verb, World-1-1 clarity.
- **It responds, honestly (content deferred).** Selecting it eases the camera to `hero`, the canvas pulses, the room
  brightens a touch, a soft chime plays, and an **honest** line appears — *"The studio's warming up — new things are
  coming. For now, look around."* It may reveal one tiny cozy beat (the canvas ripples; a periwinkle wash blooms across
  it). **No fake lesson, no quiz, no modal dead-end, no countdown, no badge** (passion guardrail).
- **It is provably live.** Contact toggles a `peeked` room-state so `window.__qa.stateHash()` **changes** — the
  machine-checkable "primary action is live" proof (SC-CORE-14) holds *before content exists*. When content lands, this
  same hotspot swaps its handler to launch the content app (`role:"doorway"`, `window.__qa.primaryAction =
  "open-atelier"`) — **no layout, camera, or flow change** (zone-art §10; gameflow §4.3).
- **Firewall separation.** The easel is **not** a delight and no delight is a doorway (aliveness §7.5). Stepping to the
  easel is the primary action; it does not emit a work-mode signal in v1 (the row already lit on cabin entry), and the
  micro-interactions (§6.3) never touch it.

---

## 5. Materials + lighting — "the golden-hour light loves the art"

### 5.1 One shading model (satin, never plastic)

Pick **flat PBR** (`MeshStandardMaterial`, low metalness, baked AO on a shared gradient atlas) and hold it — chosen over
toon **because the ART cabin's whole point is colors reading true**, and flat PBR under the north-light fill resolves hue
most honestly. (Toon `MeshToonMaterial` + banded `gradientMap`/`NearestFilter` is a viable alt if the world commits to
toon globally — but never `MeshBasicMaterial`, ever.) The look is **satin**: low soft specular, matte diffuse, a gentle
sheen only on brass/ceramic/leather/waxed-wood handled edges. **No roughness below ~0.35** except the single brightest
brass glint under a lamp. Every hero surface shows the **macro→meso→micro** three bands (art bible §4): e.g. the
drafting desk = plank silhouette → visible seams/tool-chamfers/paint-stains → grain + waxed sheen.

### 5.2 The lighting rig (art bible §5, with the ART-cabin two-window twist)

The one distinctive move: **two window characters that meet.**

1. **One self-hosted CC0 HDRI** ("warm cabin interior / golden window at dusk," Poly Haven 1–2K, never a CDN preset)
   via drei `<Environment>` — the single ambient + reflection source, so every mixed-kit prop and every brass/ceramic
   highlight picks up the same warm window (Pillar A cohesion).
2. **Warm key #1 — the golden-hour sun (the hero, the ≤1 shadow-caster).** One `directionalLight` = `SCENE3D.keyHex
   #FFD8A3`, `keyIntensity 1.2`, low raking `keyPos [6,8,5]` (the warm pack), entering the **high west window (A5)** and
   **raking across to the easel**. It throws the long soft golden shaft **J1** carrying motes **J2** — *the single
   detail that sells "atelier at golden hour"* — and the room's long blue-violet shadows.
3. **Cool fill — the NORTH-LIGHT window (the true-color law, diegetic).** The tall north window **A4** is *why* the
   hemisphere fill is cool and even: `hemiSkyHex #A9C2E8` (cool dusk-blue) over `hemiGroundHex #C67B48` (warm
   wood/firelight bounce), `hemiIntensity 0.52`, + low warm ambient `#52402E`. Result: shadowed wood/wool tints
   **blue-violet, never gray**, *and* the gallery wall + desk read colors truthfully — the painter's north light made
   literal. **This is the ART cabin's signature: warm sun for mood, north light for truth.**
4. **Warm key #2 — the wood-stove (the diegetic heartbeat).** Firebox **A6** = emissive `fire.ember #FF7A3C` core →
   `fire.flame #FFB25A` body **+ one cheap non-shadow `pointLight`** in the box. Flicker = emissive-intensity + light
   sine + noise on the breath clock (reduced-motion → steady glow). The same amber as the Lodge hearth and every cabin
   window (cohesion — you stepped *toward the same fire*).
5. **Warm practicals (emissive only, no extra real lights).** Desk lamp **B9**, still-life lamp **G5**, string-lights
   **I1**, and the **easel portal C2** — all emissive `light.lantern`/`light.window`, giving bloom its sparkle.
6. **Frozen shadows.** `<ContactShadows frames={1}>` under each hero prop (desk, easel, wheel, still-life, stove) +
   `<BakeShadows>` elsewhere; `<AccumulativeShadows>` + `<RandomizedLight>` for a settled hero shadow that costs zero
   once composed. **≤1 shadow-caster, never per-frame.**
7. **Palette-matched fog** `fogHex #E0C79A`, `fogNear 14`/`fogFar 46` — ties the mixed kit into one warm atmosphere and
   carries the shaft. **For cohesion, never to hide the far clip** (banned).
8. **Post** (shared `EffectComposer`, renderer `NoToneMapping`): `Bloom(mipmapBlur, luminanceThreshold ~1.0)` on
   fire/lamps/string-lights/window/portal + `Vignette` + `ToneMapping(ACESFilmic)`; **SMAA not MSAA**; 2–3 passes;
   `bloomPeak 1.4`, `exposure 1.05`.

### 5.3 The warm `SCENE3D` pack (adopt the art-bible value swap, §3.2)

The ART room runs the warm cabin pack (shape unchanged from the shipped `Scene3DView`; **swap values only**): `bgHex
#E6D2A2`, `fogHex #E0C79A`, `ambientHex #52402E` @ 0.38, `hemiSkyHex #A9C2E8` / `hemiGroundHex #C67B48` @ 0.52, `keyHex
#FFD8A3` @ 1.2 `keyPos [6,8,5]`, `markerEmissiveHex #FF9E5E` (rest 0.35 / pulse 0.5), `bloomPeak 1.4`, ACES @ 1.05.
`HUE_RAMP` is untouched (art stays `#6C8CE8`). Night-as-default is a **banned outcome**.

---

## 6. Ambient life + micro-interactions (signal-free per the juice firewall)

### 6.1 One breath clock (Pillar G)

All ambient motion samples **one** slow oscillator (`AMBIENCE.breathMs` default 8000) with per-element phase offsets, so
the room reads as one living body for the cost of one clock. Amplitudes stay tiny (window/string flicker ≤3%, stove glow
±8%, sway a few px/deg). In the 3D room, one uniform updated in a single throttled `useFrame` feeds fire + motes +
portal; DOM overlays (where cheaper) read a CSS `--breath` var. **Reduced-motion → freeze at 0.5** (a serene, complete
still — never a hollowed-out frame).

### 6.2 Always-on motions (≥8; floor is ≥6, zone-art §4.5)

1. **Dust motes** drifting in the golden shaft (J2; 60/24/0 per tier).
2. **Curtains breathing** at the north window (J5).
3. **Plant/vine leaf sway** (H4/I4/J3, instanced vertex sway).
4. **String-lights twinkle** (I1, emissive on breath).
5. **The mobile turns** slowly (I2).
6. **The cat breathes** (J4, slow scale) + occasional tail flick.
7. **Stove fire flicker** + emissive breath (A6) + a rising ember.
8. **The easel portal shimmers** (C2, periwinkle color-breathing).
9. **Drying-line canvases + pennants** sway a touch on the gust (I3/D5).
10. **Kettle/mug steam** wisps (A7/B8).

### 6.3 The art-flavored micro-interactions (cozy-juice grammar; the firewall holds)

Each follows the five-beat grammar — **anticipation → warmth-bump → soft particle → one gentle sound → settle** — tuned
soft (no screenshake/confetti/pops). **`emitsSignal: false` for every one** (compile-time proof + a QA negative
assertion). Reduced-motion collapses beats 1/3/5 to an instant state change while keeping the sound + a static
warmth-bump.

| # | Delight | The interaction | Juice | Sound | Cost | Signal |
|---|---|---|---|---|---|---|
| 1 | **Spin the pottery wheel** (F1/F2) | tap the wheel → it spins, the wet pot wobbles then rises a touch, a fleck of slip flies | `wheelSpin` damped rotation; warmth-bump `ceramic.warm`; a tiny water fleck | soft clay *squelch* + low wheel *hum* (pitch-jittered) | transient invalidate < ~2s | **NONE** |
| 2 | **The mobile turns** (I2) | tap (or a gust) → the mobile spins gently, chips catch the light | `mobilePush` spin ease; chips glint | soft wooden *tink* shimmer | transient | **NONE** |
| 3 | **Brush sways in the water jar** (B6) | tap the water jar → the soaking brush sways, a periwinkle ink-swirl blooms in the water | `brushSway` spring; `dusk.window` swirl particle | soft water *plip* | transient | **NONE** |
| 4 | **Stoke the wood-stove** (A6) | tap the stove → a poke, embers swirl up, the fire swells brighter ~2s then eases; **cohesion beat: every warm emissive in the room breathes +8% for one beat** | `hearthStoke`; ember burst `fire.ember→fire.flame`; emissive + point-light bump | crackle-pop + low *whoomph* | transient invalidate ~2s | **NONE** |
| 5 | **Pet the sill-cat** (J4) | tap the cat → it stirs, leans, slow-blinks, tail curls | `catPet` spring; warm halo `light.window`; a couple of drifting motes (not hearts) | purr fade + soft *mrrp* | 1 sprite/pose swap | **NONE** |

Supporting (lighter, same grammar): click the **still-life lamp** (G5) on/off; nudge a **paint tube** (B4); tap a
**drying-line canvas** (I3) to set it swinging. **Anti-dead-prop rule:** anything that *looks* tappable must respond;
pure scenery must not invite a tap.

**The firewall (aliveness §1.2, the single most important rule):** none of these call `emit`; nothing is counted,
collected, badged, streaked, or FOMO'd. A child who visits daily just to spin the wheel is returning to *the world*, and
the engine correctly reads that as **nothing about their interests** — which is exactly what protects the
voluntary-return signal. QA asserts `window.__qa.getEmittedSignals()` records **zero** new events after firing every
delight; a leak **hard-fails**.

---

## 7. CC0 sourcing + draw-call budget + tier degradation

### 7.1 CC0 sourcing (all commercial-safe; avoid Synty — its EULA bans UGC/generative use)

Pipeline per research §6–7: `gltf-transform optimize --compress meshopt --texture-compress ktx2` → `gltfjsx --transform
--types` → `useGLTF.preload` → drei `<Instances>`/`<Merged>`. Ship `assets/LICENSES.json`.

| Atelier element | CC0 source (backbone) | Notes / stand-ins |
|---|---|---|
| Shell, log walls, beams, window frames, door, stovepipe | **KayKit** (Medieval/timber) + **Kenney** (Building/Interior) | one gradient atlas → `<Merged>` shell; tint `wood.*` |
| Furniture (drafting table, shelf unit, stools, taboret, draped table, ledge) | **Kenney Furniture** + **KayKit** bits | instanced; tint to palette |
| Wood-stove, kettle, lantern/desk/still-life lamps, string-lights, logs | **Kenney** (Survival/Holiday) + **KayKit** props | stove/lamps/bulbs = emissive material |
| Plants, vines, sill/floor foliage, the cat | **Quaternius** (Ultimate Nature; Animated Animals) + **Kenney Nature** | foliage instanced + sway; cat = the one skinned mesh |
| Ceramics (brush jar, mug, pigment jars, pots, bowl, vase), fruit | **Kenney** + **Quaternius** props | instanced, per-instance glaze/hue jitter |
| **Easel, pottery wheel, artist mannequin, paint tubes, palette, mahl stick** | **Poly Pizza** one-offs (**verify per-model CC0**) or **stylized stand-ins** | if no clean CC0: easel = 3 tinted beams + a plane; wheel = cylinder + disc + splash-pan; tubes = capsule + cap; palette = a lofted blob — cheaper *and* fully controllable |
| Books, sketchbooks, parchment, pinned sketches, canvases, bunting, apron, rug, blanket, curtains | **Kenney** props + authored planes | textiles instanced w/ tint jitter |
| Framed paintings + drying-line images + Storybox interior + portal glow + the verb/signage | **authored** flat SVG/atlas (shared with content apps) | frames instanced; images on ONE shared atlas; portal + verb emissive |
| Warm-interior/golden-window **HDRI**; wood/plaster/ceramic/wool/canvas/leather **PBR textures** | **Poly Haven** + **ambientCG** (CC0) | 512–1K → KTX2; the meso/micro bands |

### 7.2 Draw-call budget (target ~**38**, hard cap **< 50**)

The world bible (§9) grants the room `≤ 50` (hard 80); the ART cabin — highest bar — uses that headroom, but instancing
keeps the *base dressing* near the zone-art-v2 original `≤30` spirit. **Reconciliation:** target **< 50** (task
contract) with **~12 calls of headroom**; the gallery frames, pinned sketches, pigment jars, drying-line canvases,
string-light bulbs, and greenware are **each one instanced draw call for the whole set**.

| Group | DC | What it covers |
|---|---:|---|
| `shell` (`<Merged>`: floor, walls, beams, ceiling, door, apron, stovepipe) | 3 | one atlas |
| `window` (both windows + glass + curtains) | 1 | |
| `stove` (stove + pipe + kettle + logs + blanket) | 2 | + emissive firebox material |
| `desk` (table + Storybox body + lamp) | 2 | |
| `desk-props` (brushes / tubes / jars+mug / misc — instanced by type) | 4 | ~30 items |
| `easel` (easel + taboret) | 1 | |
| `easel-portal` (the canvas emissive) | 1 | the doorway glow |
| `stools` (instanced) | 1 | |
| `gallery-frames` (instanced) + gallery images atlas | 2 | ≥8 frames + the glowing one |
| `gallery-pins` (instanced sketches) + `gallery` (ledge, trinkets, bunting) | 2 | |
| `shelf` (unit + bust + canvas-roll bin) | 1 | |
| `shelf-jars` (instanced pigments) + `shelf-books` (instanced) | 2 | |
| `wheel` (wheel + pot + apron) + `wheel-pots` (instanced greenware) | 2 | |
| `stilllife` (table + drape + mannequin + bottle/egg/vase + lamp) + `stilllife-fruit` (instanced) | 2 | |
| `rug` | 1 | |
| `plants` (instanced foliage: floor + sill + vine) | 1 | |
| `string-lights` (instanced bulbs + cord) | 1 | emissive |
| `mobile` (instanced chips + arms) | 1 | |
| `drying-line` (instanced canvases) | 1 | |
| `cat` (skinned) | 1 | the one animated mesh |
| `motes` (`<Sparkles>`) | 1 | |
| `shaft` (god-ray quad / emissive) | 1 | |
| `signage` (the floating verb SVG plane) | 1 | |
| contact shadows (frozen, batched) | ~1 | |
| **Total** | **~38** | **< 50 hard cap, ~12 headroom** |

### 7.3 Tier degradation (`resolveRenderTier`)

- **`room-3d` (quest-world-3d, full):** everything above; HDRI + shaft + motes 60 + bloom + frozen shadows; all ≥8
  motions + all 5 micro-interactions; `dpr ≤ 1.5`; `frameloop="demand"` (idle room ≈ 0 GPU, a foreground room runs a
  throttled loop only for fire + motes).
- **`room-3d-lite` (quest-world-3d-lite):** **no shadows, no bloom** (per `QUALITY_TIERS.lite`), **motes 24**, thinned
  foliage, **gallery frames capped ~5**, still-life reduced to bowl+drape+mannequin, string-lights = flat emissive
  (no twinkle), mobile static, cat static; the shaft becomes a static emissive gradient; micro-interactions still fire
  (near-instant). Draw calls drop further by merging the instanced sets.
- **`board-2d` → `ActivityDOM` (the a11y floor, primary AT surface):** the **described, ordered hotspot list** — never a
  lesser menu (zone-art §12; gameflow §4.5):
  1. **"← Back to the clearing"** (always first, never trapped).
  2. **Hero** — *"The drafting desk — a tiny lit scene glows in a shadow-box; brushes, paints, a soaking brush. Make a
     little something."*
  3. **Doorway** — *"The grand easel — its canvas glows soft periwinkle. Step up to the easel."* (the primary control).
  4. **Ambient (described, focusable "look" entries)** — the wood-stove glowing amber; the pottery wheel with a
     half-thrown pot (spin it); the gallery wall (one frame half-finished, glowing); the still-life corner; the cat
     asleep on the sill (pet it); the golden shaft with dust motes.
  - Nameable positions (`left|center|right` × `near|mid|far`), named colors (name + value + role, never color-only), a
    **live-region narration** that *is* the alt-text, keyboard one-item-at-a-time nav, visible focus ring, reduced-motion
    honored. **Parity by construction:** the `{hotspotId, label, role}` set in `ActivityDOM` equals the `Room3D`
    hotspots reported via `window.__qa.interactives()`.

---

## 8. Hard floors + cost ceilings (two-sided; under-dressing to hit the ceiling is itself a fail)

| Budget | The Atelier (3D) |
|---|---|
| **Draw calls / frame** | **< 50** (target ~38) — `<Merged>` shell + instanced sets + one shared atlas |
| Visible dressing objects | **≥ 45** (this doc: ~60+) across **all surface classes** — none bare |
| Surface classes occupied | **all** (floor · walls/beams · window+sill · stove · drafting desk · easel · gallery · shelves · pottery · still-life · ceiling) |
| Warm sources | **≥ 2** (golden window key + wood-stove) + emissive lamps/string-lights/portal |
| Cool fill | the **north-light** dusk-blue hemisphere (no dead shadow) — *and* it reads true-color |
| Shadow-casters | **≤ 1** (the golden sun), frozen |
| No-dead-shadow law | **0** desaturated-gray shadow samples (blue-violet tint required) |
| The golden shaft + motes | **required** (the soul of the room) |
| Always-on motions | **≥ 6** (this doc: ≥8) on one breath clock |
| Micro-interactions | **≥ 2** art-flavored, live + satisfying + **signal-free** (this doc: 5) |
| Lights | exactly **1 HDRI env + 1 key dir (shadow) + 1 hemi fill**; warm accents are **emissive**, + one non-shadow stove point-light |
| Post passes | Bloom + Vignette + ACES (2–3); SMAA |
| Textures | props 256–512²; hero ≤ 1024²; **KTX2**; one shared atlas |
| dpr / loop | `dpr ≤ 1.5`; `frameloop="demand"` (idle ≈ 0 GPU) |
| Frame rate | 60 target / **≥ 30 sustained** on a real iGPU under 10-min load |
| Doorway object | exactly **1** (the easel portal), primary + host-ready + **provably live** (`window.__qa`) |
| Firewall | **0** `ActivityEvent`s from any delight (QA-asserted) |

---

## 9. Banned outcomes — instant fail

Any one fails the surface (art bible §11 + zone-art §4.7 + gameflow §12 + aliveness §12, ART-flavored):

- **Cold cabin.** A "clean," empty, or sterile atelier even at 60 fps; the easel on a bare floor; bare log walls; empty
  desk/shelves; a hearth that doesn't glow; no gallery wall.
- **Dead/gray light.** Gray or black shadows; flat ambient-only room; **no golden shaft or no fire**; blown/muddy
  exposure; the north-light fill dropped so colors go muddy or the shade goes gray.
- **Moody/night default.** The retired midnight pack (`#181026`); dusk-as-default; anything cold. The room is **warm
  golden hour**.
- **Plastic, not satin.** Glossy plastic shine on wood/wool/ceramic/leather; `MeshBasicMaterial`; fullbright; untinted
  default `MeshStandardMaterial` gray.
- **Incoherence / asset-soup.** Mixed CC0 kits at different scales/palettes, untinted; **cloned props** (shared mesh
  varied only by rotation/scale — a grid of identical jars/frames/tubes); grid-perfect placement; visible texture
  tiling; a stove lit by a different fire than the Lodge.
- **Illegibility.** A room you can't read as *an artist's atelier* in 1 second; two competing focal points (the desk and
  easel must not fight); no obvious doorway; tutorial-text walls.
- **A dead or dishonest doorway.** The easel that changes nothing on contact (a static `stateHash()` — SC-CORE-14 fail);
  a "coming soon" wall that does nothing; a placeholder that **fakes** a lesson/quiz behind the canvas.
- **Firewall breach (the single most important fail).** Any micro-interaction that **emits a signal**, or is counted /
  rewarded / gated / collected / badged / streaked; a "pots thrown: n"; turning the easel into a delight or a delight
  into a doorway.
- **Arcade juice.** Screenshake, confetti, big pops, saturated flashes on any interaction — juice must be soft and warm.
- **Camera crimes.** Free-fly / orbit-that-loses-you / pan / zoom; remounting the `<Canvas>` per room.
- **Chromebook slideshow.** > 50 draw calls, `dpr > 1.5`, per-frame shadows, unbounded/streamed assets, fog hiding the
  far clip, sustained < 30 fps.
- **A lesser accessible path.** The DOM peer as a flat to-do list instead of a true equal that preserves *making a
  picture*; color-only identity; essential motion under reduced-motion; a broken (not calm) reduced-motion still.

---

## 10. Self-score rubric + the reference-delta loop + verification

### 10.1 Self-score (score every phase; for each row write "what raises this +2"; implement the two cheapest first)

Per row: **10** = passes a one-second glance beside a Ghibli cabin interior / Alba / A Short Hike at 1080p on a
Chromebook; **7** = clearly synthetic but the *same class* of image; **4** = decent hobby demo; **2** = a pile of
default-material CC0 assets.

- **Cabin warmth & coziness** — do I want to be in this atelier?
- **Firelight & light transport** — warm key + stove + cool north-light fill; **no dead shadow**.
- **Colors read true (the ART cabin's signature)** — does the north-light make hues honest while the room stays warm?
- **Cabin legibility** — "an artist's studio, mid-making" nameable in ≤ 1 s.
- **Dressing density & lived-in feel** — ≥ 45 objects, ≥ all surface classes, "someone just stepped out."
- **Material quality** — aged wood/knit/leather/brass/parchment/ceramic; **satin, not plastic**; ≥ 3 bands.
- **Palette / color-script discipline** — everything on the §3.1 scale; warm/cool split holds; periwinkle is the one
  cool accent.
- **Doorway-object obviousness** — the glowing easel is unmistakably the one thing to do.
- **The golden shaft + motes** — the soul detail present and gorgeous.
- **Ambient life & micro-interaction satisfaction** — one second from motion; spinning the wheel / petting the cat feels
  *good*; cozy not arcade.
- **Signal-free integrity** — the firewall holds (nothing counts).
- **Accessibility parity** — the DOM peer is a true equal; reduced-motion is serene.
- **Chromebook perf** — < 50 draw calls, `dpr ≤ 1.5`, frozen shadows, ≥ 30 fps sustained.

### 10.2 The reference-delta loop (mandatory, every phase)

Render the closest shot → place it beside the matching hero frame (§1) → write `DELTA.md`: the **ten most significant
differences, ranked**. **Fix the top three. Re-render.** Only then does the phase close. *You cannot run the loop
without the reference wired in* (author §1 frames in phase 0).

### 10.3 Verification battery (reuses `window.__qa` + the VLM grader + the perf HUD)

1. **Shadow-color test** — sample shadowed pixels: must show a **blue-violet** tint (never desaturated gray).
2. **True-color test (ART-specific)** — sample the gallery-wall + desk hues under the north-light fill: they must land
   on the §3.1 palette and read *un-muddied* (the north light doing its job).
3. **Firelight test** — assert the stove is emissive + blooming; a room with no lit fire and no shaft fails.
4. **Cohesion / palette test** — sample surface hues across the scene; each lands in the §3.1 palette (catches untinted
   kit-pile gray).
5. **Satin test** — sample specular on wood/wool/ceramic; a plastic-gloss highlight fails.
6. **Primary-action-live test** — raycast the easel → `window.__qa.stateHash()` **changes** (a dead doorway hard-fails).
7. **Firewall negative assertion** — fire every micro-interaction (§6.3) → `getEmittedSignals()` records **zero** new
   events; the return grid/hypothesis unchanged.
8. **Breath-cohesion test** — assert one breath source drives multiple elements (no N-timer chaos).
9. **Reduced-motion test** — with `prefers-reduced-motion`: a static, complete frame; camera cuts; delights still work
   (instant + sound + static warmth-bump).
10. **Perf HUD** — draw calls < 50, fps p95 ≥ 30, `dpr ≤ 1.5`, shadow-casters ≤ 1, on a real low-end device under
    sustained load.
11. **Contact sheet** — "The Atelier at Golden Hour" (wide) · the drafting-desk close-up (cozy) · the easel-portal
    (hero) · the reduced-motion/`board-2d` a11y floor.

---

## 11. Buildable contracts (against the frozen shapes)

### 11.1 The room hotspot list (gameflow §4.2; `role:"doorway"` × 1, `role:"hero"` × 1)

```ts
// interest-zone-art — the Atelier's step-to-hotspot list (order = roving focus + tab order)
// back-to-clearing is injected first by the host; positions are the camera focus targets (world units)
const ATELIER_HOTSPOTS: RoomHotspot[] = [
  { id: "desk",       label: "The drafting desk",   role: "hero",    focus: { target: [-3.0, 1.9, -3.0] }, live: true },  // Storybox "make" tickle
  { id: "easel",      label: "The grand easel",     role: "doorway", focus: { target: [ 3.0, 2.2, -3.2] }, live: true },  // THE portal — primaryAction
  { id: "stove",      label: "The wood-stove",      role: "ambient", focus: { target: [ 5.5, 1.2, -6.2] }, live: true },  // stoke (delight)
  { id: "wheel",      label: "The pottery wheel",   role: "ambient", focus: { target: [-4.8, 1.0, -0.5] }, live: true },  // spin (delight)
  { id: "gallery",    label: "The gallery wall",    role: "ambient", focus: { target: [ 2.5, 3.1, -6.9] }, live: false }, // one frame glows
  { id: "stilllife",  label: "The still-life",      role: "ambient", focus: { target: [ 5.0, 1.5, -1.0] }, live: false },
  { id: "cat",        label: "The cat on the sill", role: "ambient", focus: { target: [-2.5, 3.2, -6.9] }, live: true },  // pet (delight)
];
```

### 11.2 `window.__qa` (the gate can't be fooled — zone-art §13)

```ts
window.__qa = {
  zone: "art",
  primaryAction: "open-atelier",              // the easel doorway must be LIVE (hard-fail if dead)
  interactives(): QaInteractive[],            // the hotspots above + the delights
  peekEasel(): { ok: boolean },               // v1 host-ready: contact toggles `peeked` → stateHash changes
  fireDelight(id): { ok; changedPixels },     // spin-wheel / mobile / brush / stoke / pet — must change state
  getEmittedSignals(): Array<{...}>,          // MUST record ZERO from any delight (the firewall)
  stateHash(): string,                        // changes on enter / peek-easel; NEVER on a delight
  canvas: { primary: false, hasDomAlternative: true },
  domActivityOperable: true,
};
```

### 11.3 Build order (phased, each ends with the delta loop + self-score)

- **P0 — References + harness.** Author the §1 frames into `.../interest-zone-art/reference/`; wire the delta tool;
  expose `window.__qa`; stand up the shadow-color / true-color / cohesion / firewall tests. *Gate: tests green on a stub.*
- **P1 — Shell + warm pack + the shaft.** `<Merged>` cabin shell, the two windows, the warm `SCENE3D` pack, the HDRI,
  the golden shaft + motes, palette fog, frozen shadows, post. *Gate: firelight + shadow-color + the `wide` frame.*
- **P2 — Nothing-is-bare dressing.** Every station (§3.A–J) instanced to the budget: desk, easel, gallery, shelves,
  wheel, still-life, stove, ceiling, floor, sill. *Gate: ≥45 objects; cohesion/satin; delta loop vs "The Atelier at
  Golden Hour."*
- **P3 — The doorway + hero.** The easel portal (host-ready, live, honest) + the Storybox hero; the `hero`/`cozy` poses;
  `window.__qa.primaryAction` live. *Gate: primary-action-live; the `hero` + `cozy` frames.*
- **P4 — Aliveness.** The breath clock + ≥8 motions + the 5 signal-free micro-interactions with the cozy-juice grammar.
  *Gate: breath-cohesion + micro-interaction liveness + firewall negative assertion; cozy-restraint self-score.*
- **P5 — Tiers + a11y.** `room-3d-lite` degrade + the `ActivityDOM` peer (described hotspot list, live-region narration,
  parity). *Gate: parity + reduced-motion + perf HUD (< 50 dc, ≥ 30 fps).*

**Definition of done:** the two-frame test — "The Atelier at Golden Hour" (wide) + "The Easel Portal" (hero) — snags no
category error (cold/bare/dead-shadow/plastic/cloned/dead-doorway/moody) at a one-second glance beside the references;
every self-score row ≥ 7; the doorway is provably live; every delight is provably signal-free; < 50 draw calls sustained;
a child can reach, read, and step up to the easel by keyboard alone.
