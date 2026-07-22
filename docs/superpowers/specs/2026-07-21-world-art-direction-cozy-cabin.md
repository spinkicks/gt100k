# Interest Lab — World Art-Direction Bible: **The Cozy Cabin in the Golden-Hour Forest**

**Date:** 2026-07-21 · **Owner:** David · **Scope:** the *concrete, buildable art theme* for the whole
Discovery World — the 2D Curiosity Map **and** the bounded 3D doorway rooms — expressed as a **warm log
cabin / hamlet-in-the-woods** at golden hour. This is the theme layer: it fixes the palette, materials,
lighting, silhouettes, dressing vocabulary, and per-surface hero frames that every zone loop builds to.

**Refines / extends (does not replace):**
[`2026-07-21-world-visual-and-content-architecture.md`](./2026-07-21-world-visual-and-content-architecture.md)
Part A — this doc turns its "golden-hour cozy" *bar* into one **named, concrete theme**.
**Reconciles with:** [`2026-07-21-interest-lab-reconciliation.md`](./2026-07-21-interest-lab-reconciliation.md)
§6 (retire the v1 midnight-cosmos; warm golden-hour; **keep the `Scene3DView` shape + `HUE_RAMP` — swap
values only**).
**Themes the surfaces defined in:** [`2026-07-21-interest-lab-world-design.md`](./2026-07-21-interest-lab-world-design.md)
(2D-primary map + bounded 3D rooms), the three v2 zone specs
([music](./2026-07-21-zone-music-design-v2.md) · [code](./2026-07-21-zone-code-design-v2.md) ·
[art](./2026-07-21-zone-art-design-v2.md)).
**Grounding pipeline:** [`stylizedWorldAssetPipeline.md`](../../research/stylizedWorldAssetPipeline.md)
(CC0 backbone Kenney/Quaternius/KayKit; one HDRI; frozen shadows; instancing; `<50` draw calls; adaptive DPR).
**Guardrails:** [`passionBrainlift.md`](../../research/passionBrainlift.md) (never label the child; never
gamify the return signal; warmth is invitation, never coercion).
**Depth model = LAAS** ([`PROJECT_LAAS_v2.md`](https://github.com/Braffolk/fable5-world-demo/blob/main/PROJECT_LAAS_v2.md)):
named reference frames, hard floors, an explicit banned-outcomes list, a reference-anchored self-score, and
a mandatory reference-delta loop — **judged against images, not against "pretty good for a browser."**

---

## 0. TL;DR — what this doc decides

1. **The world is one place: a warm hamlet of cabins in a golden-hour forest clearing — "Emberwood."** A
   central **Lodge** with a great stone **hearth** (home / "you are here") sits in a soft clearing; a
   winding dirt path threads out to the **domain cabins**, each a lovingly-lit little workshop in the woods
   with a hanging sign and warm windows ([§1](#1-world-concept--story)). Music = the **terracotta Sounding
   Cabin**; Code = the **sage-green Tinker Workshop** (a greenhouse-cabin); Art = the **periwinkle Atelier
   Cabin**.
2. **The unifying motif is fire.** *The same fire burns in the Lodge hearth and in every cabin's stove.*
   Firelight is the warm heartbeat of the palette; golden-hour sun is the warm key; a **cool dusk-blue
   skylight fill** makes every shadow read blue-violet, **never gray** ([§3](#3-palette-the-hero-tokens)–[§5](#5-lighting-the-recipe)).
3. **The art tokens pivot to a concrete cabin pack.** The shipped `SCENE3D` still encodes the **banned**
   v1 midnight look (`#181026`). This doc ships the **exact replacement values** for the *unchanged*
   `Scene3DView` shape, **keeps `HUE_RAMP` verbatim** (music `#E8825A` / code `#5FB98C` / art `#6C8CE8`
   still the cabin identity hues), and adds two **new, non-breaking** token modules — a `CABIN` material
   palette and a `MAP_COLOR_SCRIPT` — for the zone builders and the DOM map ([§3](#3-palette-the-hero-tokens)).
4. **Everything is judged against a named reference set** — *A Short Hike · Alba · Studio-Ghibli cabin
   interiors · Firewatch · Stardew Valley · Animal Crossing · cottagecore* — with a **hero reference frame
   authored per surface** (the map, each cabin exterior, each cabin interior) and the LAAS reference-delta
   loop run at every phase ([§7](#7-reference-frames-name-the-bar)).
5. **All of it lives inside the CC0 pipeline + Chromebook budget.** Cabins/wood/forest come from Kenney +
   KayKit + Quaternius, tinted to one palette, lit by one HDRI, grounded by frozen shadows, `<50` draw
   calls ([§8](#8-cc0-sourcing-which-kits-supply-the-cabin)–[§9](#9-hard-floors--cost-ceilings)).

---

## 1. World concept / story

### The one-line fiction

> **You live at the Lodge, in a warm clearing in the woods at golden hour. The fire is always lit. Around
> the clearing, a short walk down a soft dirt path, are little cabins — and in each cabin, someone makes
> something. You wander over, push open a door, and the warmth is already there.**

**Emberwood** is a small, safe, hand-built place: a **hamlet of cabins nestled in a golden-hour forest**.
It is not a wilderness to survive and not a level to beat — it is a *neighborhood you belong to*, the felt
opposite of the retired midnight-cosmos (which read as cold, vast, and lonely). The mood is **the golden
hour when everyone has come in from the cold, the lamps are on, and something is quietly being made in
every window.**

### The Lodge + the hearth (the hub / "you are here")

At the center of the map sits the **Lodge** — a larger cabin with a great **stone hearth** whose fire is
always burning. It is:

- **Home.** The map's unambiguous *"you are here"* anchor. The child always returns to the clearing (the
  map is home; each cabin is a doorway out and back — world-design §3).
- **The cohesion motif.** The hearth-fire's amber is the **exact warm** that glows in every cabin's window
  and every cabin's stove. Standing in the clearing you can see, in each cabin window, *the same fire you
  warm your hands at.* This is the single strongest "one authored world" cue (Pillar A) — no matter which
  CC0 kit a cabin is assembled from, it is lit by the same fire.
- **Never a scoreboard.** The Lodge holds no counters, streaks, stars, or progress bars. It is a warm
  place to stand and choose where to wander next (passion guardrail; brainlift Insight 5).

### Each domain is a cabin in the woods

Every interest domain is its **own cozy cabin/workshop**, legible as *its* craft from across the clearing
(Pillar D). The three v1 cabins, each distinguished on four independent channels (hue · silhouette · sign
glyph · signature dressing) so a color-blind child reads them at a glance:

| Cabin | Identity hue (`HUE_RAMP`, KEPT) | Silhouette / roof | Hanging sign | Signature dressing (map + interior) |
|---|---|---|---|---|
| **The Sounding Cabin** (Music, `sound_music`) | terracotta `#E8825A` | a snug log cabin with a **gramophone-horn cupola** on the roof and a stout stone chimney | a carved **♪ note** on an iron bracket | notes drift up *with* the chimney smoke; the warmest, amberest window on the map |
| **The Tinker Workshop** (Code, `symbols_math`) | sage-green `#5FB98C` | a **greenhouse-workshop**: log walls, a **glass gable roof**, a **gear-sprout weathervane** | a **cog sprouting a leaf** ("logic that grows") | potted sprouts on the sill, a wind-up bot on the porch, a lantern, cool cyan tool-glow inside |
| **The Atelier Cabin** (Art, `visual_design`) | periwinkle `#6C8CE8` | a gable cabin with a big **north-light skylight** and an **easel on the porch** | a **paintbrush + frame** | a hanging painting, a paint-splash doormat, the coolest "lit-window-at-dusk" glow (the one cool accent) |

**Room to grow (composition, not redesign).** The clearing is drawn with visible *empty lots* — a stump
here, a cleared patch there, a footbridge stub over the stream — so new domains extend the hamlet (more
path, a second cluster of cabins across the bridge) without ever re-drawing the map (world-design §A3;
`MapBuildingView.cell` ordering: Music `(0,0)`, Code `(1,0)`, Art `(2,0)`).

### The story the child lives (the loop, themed)

Wander the clearing → a warm window pulls you toward a cabin → **push open the door** into a cozy firelit
room where *a real thing is already happening* (a beat breathing on the wall, colorful code typing itself on
a warm-lit screen, a little scene glowing on the drafting desk) → the room's **doorway object glows** ("open the
studio / step up to the desk / step up to the easel") → you go deeper into the craft → later, unprompted,
you drift back to *that cabin* over days. The world reads *that* you came back; the craft reads *what kind
of making* pulled you. **The cabin is the doorway and the signal; the fire is why you came in.**

---

## 2. The six pillars (LAAS, translated to cozy-cabin) — enforced

Every requirement serves one pillar; resolve any uncovered choice in favor of the relevant pillar.

- **A. Cohesion over geometry — one fire, one wood, one palette.** Mixed CC0 kits must read as one
  hand-built hamlet: one locked palette (§3), one HDRI, one shading model, **everything tinted to the wood
  + firelight + forest + dusk-fill scale.** *Test: sample any surface's hue — it must land in the §3
  palette. Untinted default-material gray is a fail.*
- **B. Warm light, no dead shadow — the firelight law.** Golden-hour/fire **warm key** + **cool dusk-blue
  skylight fill**, so shadowed wood/wool reads a soft **blue-violet**, never muddy gray or black. *Test:
  sample any shadowed pixel — desaturated gray = lighting has failed.*
- **C. Nothing is bare — someone lives here, the fire was just tended.** Every surface class carries cozy
  dressing (a rug, a plant, a mug, a lantern, a folded blanket, a book left open, a sleeping cat, dust
  motes in a sunbeam, a half-made thing on the bench). The map has trees, lanterns, chimney smoke, a pond,
  fireflies, a wandering cat. *Test: an empty room or a bare clearing is a fail — it must feel lived-in one
  second ago.*
- **D. Legibility holds — the cabin reads as its craft in ≤1 second.** One clear verb per surface; a
  cabin's domain is nameable at a glance from four channels (§1); wayfinding ("you are here," labels,
  "← back to the clearing") is always present. *Test: a stranger glancing for one second names the cabin
  and the primary action, or the surface fails.*
- **E. Art direction / color script — the warm/cool golden-hour split.** A per-surface, per-time color
  script exists and is enforced (warm lit wood/fire vs cool dusk-tinted shade); restrained saturation;
  value structure (dark cozy foreground frame → lit subject → luminous window/hearth); camera framings are
  **composed**, fixed, never found.
- **F. The world breathes — the fire flickers, the smoke rises.** Cheap ambient motion everywhere: fire
  flicker, chimney smoke, foliage sway, dust motes, a lantern's twitch, a slow-turning weathervane, a
  wandering cat, drifting fireflies. A frozen frame should feel one second from motion. **Reduced-motion is
  honored absolutely** (instant, calm still frame — never a broken one).

---

## 3. Palette — the hero tokens

The palette is four families — **warm woods** (the structure), **firelight & amber** (the glow, reserved
for emissives), **forest greens & rust** (the world outside + accents), and **cool dusk fills** (the
shadows) — plus warm neutrals/materials. This is the "force everything onto a limited palette" cohesion win
(pipeline §4.1), themed to the cabin.

### 3.1 The hero palette (the one table that matters)

| Role | Token | Hex | Where it lives |
|---|---|---|---|
| **WARM WOODS** | | | |
| Lit pine plank / beam face | `wood.honey` | `#C89A5E` | the warmest wood the key light hits |
| Mid oak / floorboard | `wood.oak` | `#A87C4A` | general timber |
| Shadowed beam / dark timber | `wood.walnut` | `#6B4A2E` | overhead beams, cabinetry |
| Deepest wood — the foreground frame | `wood.cocoa` | `#4A3320` | the dark near-edge (value structure) |
| Weathered / worn plank | `wood.driftwood` | `#B9A484` | old boards, worn edges, the porch |
| **FIRELIGHT & AMBER** *(emissive only — reserve pure glow)* | | | |
| Hearth ember (hottest core) | `fire.ember` | `#FF7A3C` | the coal bed, the map ember-spark |
| Flame body | `fire.flame` | `#FFB25A` | the fire, the stove glow |
| Doorway / marker spark *(= `PALETTE.spark`, KEPT)* | `fire.spark` | `#FF9E5E` | the glowing doorway object, drifting sparks, `markerEmissiveHex` |
| Lantern / string-light bulb *(= `PALETTE.beacon`, KEPT)* | `light.lantern` | `#FFD166` | lanterns, bulbs, fireflies |
| Warm window spill *(= `PALETTE.sparkHi`, KEPT)* | `light.window` | `#FFC08A` | light pooling out a window / door |
| Candle / warm near-white accent | `light.candle` | `#FFE0A8` | the single brightest focal warm |
| **FOREST GREENS & RUST** | | | |
| Lit pine foliage | `forest.pine` | `#5E7B4E` | trees in the key light |
| Forest shadow / deep green | `forest.deep` | `#37503E` | canopy shade, the treeline |
| Moss / lit grass | `forest.moss` | `#8CA55E` | ground cover, moss on stone |
| Rust roof / terracotta *(echoes the music hue)* | `rust.terracotta` | `#B5623A` | clay tiles, rust metal, brick |
| Dried-leaf / autumn accent | `rust.leaf` | `#9C5A32` | fallen leaves, worn iron |
| Aged copper/brass patina *(the warm↔cool bridge)* | `patina.verdigris` | `#7F9E8E` | old copper, verdigris, kettle |
| **COOL DUSK FILLS** *(shadows — NEVER gray)* | | | |
| Cool dusk-blue skylight fill *(= `hemiSkyHex`)* | `dusk.skylight` | `#A9C2E8` | the sky-fill that tints every shadow |
| Blue-violet shadow body *(the map soft-shadow)* | `dusk.shadow` | `#6E6A8E` | long shadows on the ground |
| Deepest cool shadow | `dusk.deep` | `#514D74` | shadow cores, under-eaves |
| Cool dusk-through-a-far-window | `dusk.window` | `#7C93B8` | the cool exterior seen past warm glass |
| **WARM NEUTRALS & MATERIALS** | | | |
| Warm plaster / log chinking | `plaster.cream` | `#EAD7B4` | wall infill between logs |
| Paper / parchment / sign | `paper.parchment` | `#F0E4C8` | pages, blueprints, hanging signs |
| Warm ceramic (mug, pot) | `ceramic.warm` | `#D8B48C` | pottery |
| Brass / copper vintage metal | `brass` | `#B98A4E` | knobs, horns, tools, hardware |
| Worn leather | `leather.worn` | `#8B5A3C` | satchels, chair seats, book covers |
| Knitted wool (rug/blanket) — jitter base | `wool.warm` | `#C48A6A` | textiles *(per-instance jitter → `#7E9E8E` sage-wool, `#B5623A` rust-wool)* |
| Cream knit | `wool.cream` | `#E6D3B0` | throws, cushions |
| **DOMAIN IDENTITY HUES** *(`HUE_RAMP[0..2]`, KEPT VERBATIM)* | | | |
| Music — Sounding Cabin | `hue.music` | `#E8825A` | building glow, marker, sign |
| Code — Tinker Workshop | `hue.code` | `#5FB98C` | building glow, marker, sign |
| Art — Atelier Cabin | `hue.art` | `#6C8CE8` | building glow, marker, sign |

**Reading of the split (Pillar E):** warm woods + firelight own the **lit** half of every value; cool dusk
fills own the **shade** half. A shadowed honey plank (`wood.honey` under `dusk.skylight` fill) resolves to
a soft **blue-violet-brown** — warm material, cool light — which is the cozy analog of Firewatch's
warm/cool dusk. Pure `fire.*`/`light.*` glow is **reserved for emissive surfaces only** (hearth, stove,
lanterns, string-lights, windows, the doorway object) so bloom has one clean job.

### 3.2 The warm `SCENE3D` pack — the value swap (drops into `interest-lab-view/src/scene.ts`)

Keep the **`Scene3DView` shape unchanged** (no contract break; the map goldens stay valid); **swap the
values** from the banned midnight pack to this warm cabin pack:

```ts
// interest-lab-view/src/scene.ts — SCENE3D value swap (shape identical to shipped)
export const SCENE3D = {
  bgHex:  "#E6D2A2",   // golden-hour forest haze past the window   (was #181026)
  fogHex: "#E0C79A",   // warm honey fog, palette-matched            (was #181026)
  fogNear: 14, fogFar: 46,                    // UNCHANGED — bounded room depth (cohesion, never to hide clip)
  ambientHex: "#52402E", ambientIntensity: 0.38,   // low warm cocoa ambient (was night-purple #3A2E5C)
  hemiSkyHex:    "#A9C2E8",   // COOL dusk-blue skylight  → shadows tint blue-violet (Pillar B)  (was #2A2140)
  hemiGroundHex: "#C67B48",   // WARM rust/wood + firelight floor bounce               (was #0E0A18)
  hemiIntensity: 0.52,
  keyHex: "#FFD8A3", keyIntensity: 1.2, keyPos: [6, 8, 5],  // low RAKING golden-hour window sun → long soft shadows
  toneMapping: "ACESFilmic", exposure: 1.05,   // UNCHANGED
  markerEmissiveHex: "#FF9E5E", markerEmissiveRest: 0.35, markerEmissivePulse: 0.5,  // firelight/doorway spark — KEPT
  bloomPeak: 1.4,                              // KEPT — firelight/lantern bloom
} satisfies Scene3DView;
```

- `keyPos` drops from `[6,10,6]` to **`[6,8,5]`** — a **lower, more raking** sun for the long soft
  golden-hour shadows the theme wants. `CAMERA3D` is untouched.
- Optional transition flag: expose the old values as `SCENE3D_NIGHT` behind a flag *only* if the night pack
  must linger during migration; **the default must be warm** (reconciliation §6; night is a banned outcome).

### 3.3 `HUE_RAMP` — KEPT verbatim (do not swap)

`HUE_RAMP` stays exactly as shipped in `interest-lab-view/src/art.ts`. The first three are the cabin
identity hues and they already fit the cabin theme perfectly: **terracotta `#E8825A`** reads as the Music
cabin's firelit window; **sage-green `#5FB98C`** as the Code greenhouse-workshop; **periwinkle `#6C8CE8`**
as the Art cabin's cool dusk skylight — the *one* deliberately cool building, which reads as an inviting
"lit window at dusk" against the warm clearing, not as a cold cabin (zone-art v2 §0). No code change.

### 3.4 New, non-breaking token modules (additive — for zone builders + the DOM map)

Ship these as **new named exports** alongside `PALETTE`/`SCENE3D` (no existing consumer changes):

```ts
// interest-lab-view/src/art.ts — additive; the material tint palette (§3.1) for zone builders
export const CABIN = {
  woodHoney: "#C89A5E", woodOak: "#A87C4A", woodWalnut: "#6B4A2E", woodCocoa: "#4A3320", woodDrift: "#B9A484",
  fireEmber: "#FF7A3C", fireFlame: "#FFB25A", fireSpark: "#FF9E5E", lantern: "#FFD166", windowSpill: "#FFC08A", candle: "#FFE0A8",
  forestPine: "#5E7B4E", forestDeep: "#37503E", moss: "#8CA55E", terracotta: "#B5623A", leafRust: "#9C5A32", verdigris: "#7F9E8E",
  duskSkylight: "#A9C2E8", duskShadow: "#6E6A8E", duskDeep: "#514D74", duskWindow: "#7C93B8",
  plaster: "#EAD7B4", parchment: "#F0E4C8", ceramic: "#D8B48C", brass: "#B98A4E", leather: "#8B5A3C", woolWarm: "#C48A6A", woolCream: "#E6D3B0",
} as const;

// interest-lab-view/src/art.ts — additive; the DOM/CSS color script for the 2D Curiosity Map (§6)
export const MAP_COLOR_SCRIPT = {
  skyTop: "#FCEAC2", skyLow: "#F4B074",         // golden-hour cream → peach
  treeline: "#6E5A4E",                          // hazed warm-brown pine silhouette band
  groundLit: "#C9B583", groundShade: "#8E8A5E", // dry-grass/dirt clearing
  grassTuft: "#9FB56A",
  path: "#D8B888", pathPlank: "#B98A5E",        // warm dirt + boardwalk
  waterPond: "#8FC7CE", waterGlint: "#FFD8A0",
  softShadow: "#5E5880",                         // blue-violet; render at 22–34% alpha — NEVER gray/black
  chimneySmoke: "#CDBBA6",                        // low alpha
  firefly: "#FFD98A", emberSpark: "#FF7A3C",
  hearthGlow: "#FF9E5E",                          // the Lodge fire (= fire.spark)
  cabinMusic: "#E8825A", cabinCode: "#5FB98C", cabinArt: "#6C8CE8", // = HUE_RAMP[0..2]
} as const;
```

---

## 4. Materials

**One shading model across the whole world** (Pillar A) — pick **flat PBR** (`MeshStandardMaterial`, low
metalness, baked AO on the shared atlas) *or* **toon** (`MeshToonMaterial` + banded `gradientMap`,
`NearestFilter`, no mipmaps) in phase 1 and hold it. **No `MeshBasicMaterial`, ever.** The look is
**satin, never plastic**: low, soft specular; matte diffuse; a gentle sheen on brass/ceramic/leather — the
hand-worn warmth of a lived-in cabin, not showroom gloss.

**Macro–meso–micro (Pillar C, LAAS §4), cozy-adapted — every hero surface shows ≥3 detail bands:**

| Material | Macro (silhouette) | Meso (~2–20 cm) | Micro (normal/rough) | Tint target |
|---|---|---|---|---|
| **Aged wood** (logs, beams, planks, furniture) | round log ends, chunky beams, plank seams | **visible planks & beams**, tool-chamfered edges, a knot or two, worn corners | grain direction, matte with waxed sheen on handled edges | `wood.honey`→`wood.walnut`; foreground = `wood.cocoa` |
| **Knitted / woven textile** (rug, blanket, cushion, hanging) | soft sag, rounded folds | **chunky knit ribs / weave**, fringe, a dropped stitch | fuzzy diffuse, zero specular, soft rim | `wool.warm` (jitter → sage/rust/cream) |
| **Worn leather** (satchel, chair seat, book covers, straps) | slouch, creased fold | **scuffs, stitch lines, buckle wear** | low broad specular, edge patina | `leather.worn` |
| **Brass / copper vintage metal** (horns, knobs, tools, kettle, hinges) | turned/hammered forms | **dents, solder seams, engraving** | satin anisotropic sheen + **verdigris patina** in crevices | `brass` + `patina.verdigris` in cavities |
| **Paper / parchment** (blueprints, sign, sketchbook, pages) | curl at the corners | **fold creases, torn edge, pin-holes** | soft fiber, faint translucency at edges | `paper.parchment` |
| **Warm ceramic** (mug, pot, jar) | thrown/rounded, a chip | **glaze pooling, a hairline crack, a ring stain** | satin glaze highlight (soft, wide) | `ceramic.warm` |
| **Warm plaster / log chinking** | soft trowel undulation | **chinking between logs**, a hairline | matte, faint lime speckle | `plaster.cream` |
| **Stone** (hearth, chimney) | irregular boulders, mortar | **moss in the joints**, soot near the fire | matte with a damp sheen low down | `forest.moss` in joints, soot toward `wood.cocoa` |
| **Foliage** (plants, trees, moss) | rounded low-poly clumps | leaf clusters, a trailing vine | soft translucency in backlight (leaves *transmit* the key) | `forest.pine`/`forest.moss` |

**Per-instance variation law (Pillar C):** props that repeat (jars, mugs, books, gears, logs, tiles, knit
cushions, bulbs) get **hue/value/scale/rotation jitter** and a fraction show extra wear/patina/a dropped
stitch. **Cloned uniformity reads as 2010** — a grid of identical mugs is a fail. **Satin discipline:** no
material's roughness goes below ~0.35 except the single brightest brass glint under a lantern; plastic
shine on any surface is a banned outcome (§10).

---

## 5. Lighting — the recipe

One authored setup, fed to every zone loop (pipeline §4.2). Three warm sources, one cool fill, frozen
shadows, one bloom job.

1. **One self-hosted CC0 HDRI — "warm cabin interior / golden window at dusk"** (Poly Haven, 1–2K,
   self-hosted, never a CDN preset) via drei `<Environment>`. It is the single source of ambient +
   reflections, so every mixed-kit prop is lit identically (Pillar A) and brass/ceramic pick up the same
   warm window in their highlights.
2. **Warm key #1 — the golden-hour sun (the shadow-caster).** One `directionalLight` = `SCENE3D.keyHex`
   `#FFD8A3` / `keyIntensity 1.2` / `keyPos [6,8,5]` — a **low, raking** shaft that comes **through a window
   (interiors) and through the pines (exterior/map)**, throwing the long soft shadows that define golden
   hour. **This is the ≤1 shadow-caster** (Chromebook tax).
3. **Warm key #2 — the fireplace / wood-stove (the diegetic heartbeat).** The hearth is an **emissive
   material** (`fire.ember #FF7A3C` coal core → `fire.flame #FFB25A` body) **+ one cheap non-shadow
   `pointLight`** (warm, low intensity, seated in the firebox). It is the secondary warm practical anchoring
   the cozy corner — and in a **dusk/night mood** it becomes the *primary* warm key while the window sun
   lowers. Its **flicker** = a cheap emissive-intensity + point-light sine with a little noise
   (reduced-motion → steady glow). Bloom lifts it.
4. **Warm practicals #3 — lanterns & string-lights.** Emissive materials only (`light.lantern #FFD166`),
   no extra real lights; they read as warmth and give bloom its sparkle. A lantern may do a slow ~2% breath
   (Pillar F).
5. **Cool fill — the dusk-blue skylight (the no-dead-shadow law, Pillar B).** A hemisphere:
   `hemiSkyHex #A9C2E8` (cool dusk-blue) over `hemiGroundHex #C67B48` (warm rust/wood/firelight bounce),
   `hemiIntensity 0.52`, plus the low warm ambient `#52402E`. Result: **no shadow goes dead** — shadowed
   wood/wool tints **blue-violet**, the cozy analog of LAAS's no-black-shadows.
6. **Frozen shadows only.** `<ContactShadows frames={1}>` grounding each hero prop + `<BakeShadows>`
   elsewhere; **≤1 shadow-caster**, never per-frame. `<AccumulativeShadows>` + `<RandomizedLight>` for a
   settled hero shadow that costs zero once composed.
7. **Palette-matched fog** (`fogHex #E0C79A`, near 14 / far 46) ties disparate kit pieces into one warm
   atmosphere and carries the golden shaft — used for **cohesion, never to hide the far clip** (banned).
8. **Post (shared `EffectComposer`, renderer `NoToneMapping`):** `Bloom(mipmapBlur, luminanceThreshold
   ~1.0)` for firelight / lanterns / windows / the doorway glow + `Vignette` + `ToneMapping(ACESFilmic)`;
   **SMAA not MSAA**; 2–3 passes, no more. `bloomPeak 1.4`.

**The golden shaft is the hero detail** — one soft god-ray volume (or a cheap emissive quad + fog gradient)
from the window/skylight, carrying **dust motes** (`<Sparkles>`, sparse). This one detail sells "cabin at
golden hour" more than any prop.

**Mood LUT (cheap emotional reframe, optional).** A per-scene dial — dawn / **golden day (default)** / dusk
/ night / hearth-storm — is just a swap of {fog tint, key intensity+rotation, `dusk.skylight` strength,
`<Stars>`/`<Cloud>` toggles, fire dominance}; **no new geometry.** Resting state is **warm golden hour**
(the time-lapse `dayOffset` 7/30 settles it *toward* dusk — but golden hour is home base);
"moody/night as the default" is a banned outcome.

---

## 6. The 2D Curiosity Map, re-themed — "the clearing at golden hour"

**The shot.** A **cozy picture-book clearing** in a golden-hour forest, seen in gentle isometric. A soft
**dirt path** (`path #D8B888`) winds through the middle; the **Lodge with its lit hearth** sits at the
heart (warm light and a wisp of smoke rising); a little **stream/pond** (`waterPond #8FC7CE` with one warm
`waterGlint`) curves off to one side with a **footbridge**; **rounded pines**, tufts of grass, lanterns on
posts, a **wandering cat**, and **drifting fireflies** dress the space. Along the path sit the **domain
cabins**, each an unmistakable little workshop with a **hanging sign** and **warm-lit windows** — the same
amber that burns in the Lodge. Long, soft **blue-violet** shadows (`softShadow #5E5880` @ ~28% alpha)
stretch east off everything. The sky is a warm **cream→peach** vertical gradient (`skyTop #FCEAC2 →
skyLow #F4B074`) over a hazed pine **treeline**. It looks like a place a child wants to walk around in at
the end of a good day.

**How it's built (Chromebook-safe, accessible, coder-buildable).** The map is **DOM, not a canvas**
(world-design §A3): bake, offline, an isometric ortho render of each cabin **from the same CC0 kit through
this same warm pack** used by the rooms → export to `webp`/`png` sprite (+ a lit ground/stream/path plate)
→ compose in DOM as layered `<img>`/SVG (sky → treeline → ground → shadows → cabins → foliage →
smoke/fireflies/motes) with `motion@^12` for parallax + idle motion. Baked-illustration quality, real DOM
semantics, identity-continuity with the rooms (same cabins, same fire), ~0 GPU. (Vector/CSS-only is the
fallback if baking is deferred.)

- **Each cabin is a real focusable `<button>`** (roving-tabindex; arrow keys move focus one cabin at a
  time, never a steered cursor). Label + one enter-verb + return-cue are **DOM text**, not baked into the
  sprite. This is the accessibility floor **and** the primary surface — never `aria-hidden` (world-design §7).

**Wayfinding (legible for 8–14).**

- **Label + one verb** under each cabin: "**Music Studio** · *Step inside*" (World-1-1 clarity) — the button `label`
  is the plain **craft name** (child/AT legibility; core §8.6); the cabin's proper name ("The Sounding Cabin") is the
  **sign/scene** name.
- **"You are here" = the Lodge/hearth** — the clearing is home; a soft footprint/marker shows the
  last-entered cabin.
- **Return-glow (the signal made visible, NOT gamified):** a cabin the child came back to *unprompted* gets
  a gentle warm window-halo (`voluntary-return`); a prompted return gets a cooler, quieter cue
  (`prompted-return`); a first visit shows a fading "new" shimmer (`explored`). **No number, streak, star,
  or score ever sits on a cabin** (guardrail; brainlift Insight 5).
- **"Your half-made thing is still here"** — an `unfinished` cabin shows a single soft glint at its window
  (opt-in invite, never a countdown).
- **The time-lapse control** ("Right now → A week later… → A month later…") is a labeled DOM control;
  stepping it **visibly quiets the clearing** (the "new" shimmers fade, the sun lowers a notch toward dusk,
  the fireflies come out) then asks what the child drifts back to — the honest synthetic-return device,
  on screen (world-design §A3).

**Cozy ambient motion (Pillar F — all cheap, all reduced-motion-off):**

- **Chimney smoke** rising from the Lodge and from any lit cabin (soft looping puff; the Music cabin's
  smoke carries faint drifting **♪ notes**).
- **Swaying trees / grass** (gentle parallax sway on the foliage layers).
- **Fireflies / dust motes** drifting in the low sun (a sparse particle layer that thickens as the
  time-lapse moves toward dusk).
- **A wandering cat** ambling a slow looping path across the clearing, occasionally sitting.
- **Window flicker** — the warm cabin/Lodge windows do a barely-there firelight flicker (≤3%), tying the
  map's light to the rooms' hearths.

**Hero reference frame — "Golden Hour in the Clearing" (the map's bar).** Warm cream→peach sky over a hazed
pine treeline; the Lodge's hearth-smoke rising dead-center; three instantly-legible cabins (terracotta /
sage / periwinkle) along a winding warm path; a glinting stream with a footbridge; a cat mid-amble; long
blue-violet shadows; fireflies just starting; a gentle **return-glow** on one cabin window. *(Refs: A Short
Hike overworld × Stardew farm legibility × Firewatch dusk pines.)*

---

## 7. Reference frames — name the bar

Author **one still per reference** and **one hero frame per surface**, committed to
`passion/apps/interest-lab/reference/` (per-zone: `.../interest-zone-{music,code,art}/reference/`) in
phase 0. Every phase is judged **side-by-side against these**, at a one-second glance, on a Chromebook
screen. *You cannot run the delta loop without the reference wired in.*

### 7.1 The reference set (author one still from each; they anchor the delta loop)

| Ref | What we steal from it |
|---|---|
| **A Short Hike** | golden-hour palette; soft low-poly cohesion; a small legible world you *read* instantly; gentle life |
| **Alba: A Wildlife Adventure** | clean warm sunlight; readable stylized cabins/buildings; sunlit calm; ambient creatures |
| **Studio-Ghibli cabin interiors** (*Kiki*'s attic, Howl's cottage, *Whisper of the Heart* desk) | painterly warm shaft light; dust motes; lived-in clutter; "a place you want to be" — the interior soul |
| **Firewatch** | the warm/cool **dusk split**; long golden light raking through pines; a cabin/lookout in the woods; bold flat color blocking with **atmospheric haze layers** |
| **Stardew Valley** | cozy legibility from above; each structure obviously *what it is*; homey clutter that reads, never noise (the map bar) |
| **Animal Crossing: New Horizons** | cozy inhabited world; rounded friendly forms; time-of-day warmth; **wayfinding by building identity** |
| **Cottagecore** (the aesthetic) | the **material + prop vocabulary**: knitted textiles, dried flowers, warm wood, brass, candlelight, worn leather-bound books, ceramics, preserves in jars |

**The inversion of LAAS (state it plainly):** LAAS's floors are *geometry* floors (≥5M triangles,
volumetric clouds). **Ours are cohesion, light, legibility, coziness, and motion floors under a hard
draw-call ceiling.** On a Chromebook, beauty is **firelight + palette + cohesion + composition**, not
polygon count. A screen that is *dense but incoherent, gray-lit, or cold* is a **failed screen**, exactly
as a flat 2010 terrain is a failed LAAS screen.

### 7.2 Hero reference frame per surface

**The map** — see §6 ("Golden Hour in the Clearing").

**Music cabin — exterior (on the map).** A snug terracotta-roofed log cabin, a **gramophone-horn cupola**
catching the last sun, a stout stone chimney breathing smoke with faint **♪ notes** in it; the **warmest,
amberest window** on the map, a soft rug of light spilling from the door; the ♪ hanging sign creaking on
its bracket. *(Refs: Alba cabin × Animal Crossing identity × cottagecore.)*

**Code cabin — exterior.** A **greenhouse-workshop**: log base, a **glass gable roof** catching golden
light, a **gear-sprout weathervane** turning slowly, potted sprouts and a wind-up bot on the porch, a
lantern by the door, a cool cyan tool-glow leaking from inside against the warm sage window. *(Refs: A
Short Hike × Stardew greenhouse × cottagecore potting shed.)*

**Art cabin — exterior.** A gable cabin with a big **north-light skylight** glowing periwinkle at dusk (the
one cool building — reads as "lit window at dusk," inviting, not cold), an **easel on the porch**, a
paint-splash doormat, a hanging painting under the eave, the brush+frame sign. *(Refs: Ghibli studio ×
Alba × cottagecore.)*

**Music cabin — interior: "Firelight in the Sounding Cabin."** Fixed camera (`fov ≈ 40`) framing a **rustic
timber console** head-on. A **wood-stove glows amber** in the corner (warm key #2); a **golden shaft** from
a small window rakes the desk with **dust motes** in it; overhead **exposed log beams**; a **pad wall** set
into reclaimed-wood panels (one `InstancedMesh`), two-three pads breathing amber, a luminous **playhead**
resting at column 1; a **gramophone**, a fiddle on the wall, a plank shelf of glowing **vinyl/cassettes**
(saved loops), a **warm rug**, a **kettle** on the stove, a **sleeping cat**. The **doorway object** = the
console's glowing screen / a lit brass horn ("open the studio"). Long blue-violet shadows ground it. One
obvious verb ("tap a pad"). *(Refs: Ghibli desk × the "lo-fi beats" room × A Short Hike interior; deepens
zone-music v2 §A.1 into the cabin.)*

**Code cabin — interior: "The Sunlit Workshop."** A 3/4 view into a small **log workshop / greenhouse
corner**: a **big window/glass-roof** pours a warm afternoon sunbeam with dust motes; a **wood-stove**
glows; a central **warm-wood Coding Desk** carries a **friendly warm-bezel monitor glowing with big, colorful,
legible code** (warm **sage `#5FB98C` + amber**, **never cold-blue**), a chunky **mechanical keyboard** with an
oversized amber **RUN** key, a sticker-covered laptop, and beside it **Sprout** — a little friendly robot the kid
drives with snap-together code blocks; **Claude**, a warm AI desk-buddy, watches from the desk corner; a
**pegboard** of brass tools on the log wall; a **shelf** of little finished creations; **potted sprouts** and a
trailing vine (the greenhouse warmth); string-lights; a mug; a rug; a worn stool. The **doorway object** = the
Coding Desk's **glowing monitor + amber RUN key** ("step up to the desk"), the single brightest warm focal point.
*(Refs: A Short Hike interiors × Stardew × "cozy coding-desk setup"; deepens zone-code v2 §A1 + cabin-interior-code.md.)*

**Art cabin — interior: "The Atelier at Golden Hour."** The warmest, most lovingly-dressed room in the
world (the bar is highest here). A tall **skylight/window** pours a **golden shaft with drifting motes**
across a wood floor and warm-plaster-chinked log wall; **exposed beams**; a **wood-stove** glowing; left:
the **drafting desk** with the Storybox glowing; center-back: the **gallery wall** of framed pictures, one
**half-finished frame glowing**; right: the **grand easel** whose canvas is a **soft luminous periwinkle
portal** (the doorway object — "step up to the easel"); a rug, a stool, potted plants, string-lights, and
a **cat asleep on the sill**. Warm fog + soft bloom on every emissive. *(Refs: Ghibli attic studio × Alba
sun × Coraline tactility; deepens zone-art v2 §4.1.)*

---

## 8. The 3D doorway rooms, re-themed — cozy cabin interiors

Every cabin interior shares a **common cozy-cabin kit** (so they read as one hamlet, Pillar A) and then
carries its **craft-specific hero + doorway object**. The domain hue carries from the map tile into the
room's accent light + sign (identity continuity; world-design §A5).

### 8.1 The shared cabin interior kit (every room has all of these)

- **Exposed timber beams** overhead + **log or plank walls** with warm-plaster chinking (`wood.*` +
  `plaster.cream`).
- **A fireplace / wood-stove** glowing in a corner (warm key #2, §5) — the recurring hearth motif; a
  **kettle**, a stack of split logs, a folded **knit blanket** near it.
- **The golden window shaft** with **dust motes** (the soul of the room).
- **A warm rug** (knit/woven, per-instance tint), **≥1 plant** (potted or trailing vine), **lanterns /
  string-lights** (emissive), a **mug**, a **book left open**, a **sleeping cat** or equivalent
  human-presence cue.
- **The doorway object**, glowing warmly with the domain hue, the single obvious primary affordance.
- **Composed camera** (fixed, `CAMERA3D` clamps): dark cozy foreground frame → lit subject → luminous
  window/hearth background. Reduced-motion → instant framing.

### 8.2 Per-cabin craft layer + doorway object

| Cabin | Craft hero (the live taste) | The doorway object (glows warmly) | Craft dressing (vintage props) |
|---|---|---|---|
| **Sounding Cabin** (Music) | the **pad wall** in reclaimed-wood panels (`InstancedMesh`) + luminous playhead — tap a pad, hear + see it change | the **console screen / lit brass gramophone horn** → *"open the studio"* (opens the audio content app) | gramophone, fiddle/banjo on the wall, plank shelf of vinyl+cassettes (the saved-loops Shelf), acoustic-felt panel, sticky notes |
| **Tinker Workshop** (Code) | the **Coding Desk**: a warm-bezel monitor glowing with big, colorful, legible code (warm sage + amber, never cold-blue) + a chunky keyboard — the one primary interactive; **Sprout** the codeable robot beside it | the **glowing monitor + amber RUN key** → *"step up to the desk"* (opens the code content app) | pegboard of brass tools + coiled cables, chalkboard flow-sketch, crate of parts, the Shelf of finished creations, JS/HTML/CSS/Python books, **Claude** the AI desk-buddy, greenhouse sprouts |
| **Atelier Cabin** (Art) | the **Storybox** on the drafting desk (a shadow-box diorama that auto-beautifies on contact) — the light "make" tickle | the **grand easel's luminous periwinkle canvas** → *"step up to the easel"* (opens the art content app) | brush jar, paint tubes, palette, open sketchbook, the **gallery wall** of framed artifacts (one half-finished frame glows), a hanging mobile |

**The firelight tie (cohesion + warmth).** In each room the **stove/hearth** is the same amber as the
Lodge's fire and the map's window-glow — so stepping from clearing to cabin is stepping *toward the same
fire*. The **doorway object** is the *second* warm focal point (domain-hued): the eye lands on the fire for
comfort and the doorway object for *the one thing to do*.

**Anti-broccoli (non-negotiable, per every zone v2 spec):** the room's taste is **genuinely live** (a
pad/bench/Storybox action changes state and `stateHash()`); the doorway opens **more of the same craft**
(never a quiz/form/text-wall); the **artifact bridges both layers** (the sound you shape *is* the pad's
voice; the Shelf shows in both room and app). A "pretty cabin in front of a quiz" is the exact v1 failure
(§10).

---

## 9. Hard floors + cost ceilings

Two-sided (LAAS-style): a **content floor** (so a room/clearing can't feel empty) **and** a **cost ceiling**
(so it stays Chromebook-safe). Under-dressing to hit the ceiling is itself a failure — **instance instead**.

| Budget | Room (3D) | Map (DOM) |
|---|---|---|
| **Draw calls / frame** | **≤ 50** (hard cap 80) — shell `<Merged>` + pads/props instanced + one shared atlas | n/a (DOM) |
| Visible dressing occupants | **≥ 30** cozy objects across **≥ 5 surface classes** (beams/walls · hearth · desk/bench · shelf · floor · window) — none bare | baked into sprites; ≥ the three cabins + Lodge + trees + path + stream + cat + lanterns |
| Warm sources | **≥ 2** (window key + hearth) + emissive lanterns/window | window-glow + hearth-glow + fireflies |
| Cool fill | dusk-blue hemisphere (no dead shadow) | blue-violet baked shadows |
| Shadow-casters | **≤ 1** (frozen) | baked into sprite |
| No-dead-shadow law | **0** desaturated-gray shadow samples (Pillar B) | soft-shadow `#5E5880`, never gray |
| Always-on motions | **≥ 3** (fire flicker · motes · one of plant/cat/weathervane) | **≥ 3** (smoke · sway · fireflies/cat) |
| Post passes | 2–3 (Bloom + Vignette + ACES) | CSS only |
| Textures | props 256–512²; hero ≤ 1024²; **KTX2**; one shared atlas | baked sprites `webp`, sized to grid |
| Pixel ratio / loop | `dpr ≤ 1.5`; `frameloop="demand"` (idle room ≈ 0 GPU) | device dpr; idle loop cheap/paused offscreen |
| Frame rate | 60 target / **≥ 30 sustained** on iGPU under 10-min load | 60 (DOM) |
| Doorway object | exactly **1**, the domain-hued primary affordance, provably live (`window.__qa`) | one enter-verb per cabin button |

**Per-room must-haves (all required):** one obvious primary verb · one HDRI · warm key + hearth + cool
dusk fill (no dead shadow) · palette fog on · the golden shaft + motes · ≥3 ambient motions · ≥5 dressed
surface classes · exposed beams + a stove · a `<50`-draw-call budget met · `window.__qa` present and the
primary action provably live.

---

## 10. CC0 sourcing — which kits supply the cabin

All **CC0** (commercial-safe, no attribution; **avoid Synty** — its EULA bans UGC/generative use and this
product may add child-authoring). Pipeline per `stylizedWorldAssetPipeline.md` §6–7: `gltf-transform
optimize --compress meshopt --texture-compress ktx2` → `gltfjsx --transform --types` → `useGLTF.preload`
→ drei `<Instances>`. Ship `assets/LICENSES.json`.

| Cabin element | CC0 source (backbone) | Notes |
|---|---|---|
| **Cabin shells, log walls, beams, roofs, porch, chimney, footbridge** | **KayKit** (Medieval Builder / modular timber packs) + **Kenney** (Building Kit / modular walls) | one gradient atlas per kit → `<Merged>` shell (1–3 calls); tint to `wood.*` |
| **Interior furniture** (bench, desk, console, shelves, stool, table, cabinets, rug) | **Kenney Furniture Kit** + **KayKit** furniture bits | instanced repeats; tint to the palette |
| **Hearth / wood-stove / campfire / logs / lantern / string-lights** | **Kenney** (Survival / Holiday kits) + **KayKit** props | stove/lantern = emissive material; string-lights instanced bulbs |
| **Trees, pines, rocks, stumps, mushrooms, moss, plants, vines** | **Quaternius** (Stylized/Ultimate Nature) + **Kenney Nature Kit** | trees instanced (`InstancedMesh`) for the map bake + any exterior; foliage sway |
| **The cat, birds, listener characters, the wind-up bot ("Sprout")** | **Quaternius** (Animated Animals / characters) + **KayKit** (160+ CC0 animations) | one skinned mesh max per room; the rest placed static |
| **Vintage props** (gramophone, fiddle, kettle, jars, mugs, books, gears, brass tools, blueprints, easel, paint tubes, ceramics) | **Kenney** + **Quaternius** props; **Poly Pizza** for one-off gap-fillers | **verify per-model CC0** on Poly Pizza; record in the manifest |
| **Warm-interior / golden-window HDRI** | **Poly Haven** (1–2K, self-hosted) | the single `<Environment>` IBL — the whole cohesion lever |
| **PBR textures** (wood grain, knit/wool, leather, parchment, brass, plaster, stone) | **Poly Haven** + **ambientCG** (CC0) | 512–1K → KTX2; the meso/micro material bands (§4) |
| **Doorway-object glow / icon-blocks / signs** | authored flat SVG/atlas | shared with the content apps; emissive |

**Optional accent (paid, deliberate):** one **Blockade Labs** skybox for a golden-hour-forest exterior seen
past a window (commercial license on paid plans) — used as a **baked backdrop card**, never live geometry.
Splats are avoided in the interactive scene (Chromebook); bake to a card if the look is wanted.

---

## 11. Banned outcomes — instant fail

Any one of these fails the surface (LAAS §9 + the v1 post-mortem + the passion guardrails):

- **The retired v1 aesthetic:** midnight / outer-space / moody / night-default palettes (the shipped
  `#181026` pack). **The world is warm, cozy, golden-hour.** Moody-as-default is a fail.
- **Dead lighting:** gray or black shadows; flat ambient-only rooms; a room with **no fire and no window
  shaft**; blown-out or muddy exposure.
- **Cold cabin:** a "clean," empty, or sterile room even at 60fps; a bench/console/easel on a bare floor;
  bare log walls with nothing on them; a hearth that doesn't glow.
- **Plastic, not satin:** glossy plastic-shine on wood/wool/ceramic/leather; `MeshBasicMaterial`;
  fullbright; untinted default `MeshStandardMaterial` gray.
- **Incoherence / asset-soup:** mixed CC0 kits at different scales/palettes, untinted; cloned props (shared
  mesh varied only by rotation/scale); grid-perfect placement; visible texture tiling; a cabin lit by a
  *different* fire than the Lodge.
- **Illegibility:** a cabin you can't identify as its craft in 1 second; a room with no obvious doorway
  object; two competing focal points; tutorial-text walls (teach by affordance, World-1-1).
- **The v1 mechanic failure:** an `aria-hidden` canvas as the primary surface with no DOM peer; a
  **dead/decorative** interactive (a tap that changes nothing — proven by a static `stateHash()`); a
  **"pretty door in front of a quiz/form/text-wall"** (the craft is not the mechanic).
- **Chromebook slideshow:** >50 draw calls, `dpr>1.5`, per-frame shadows, unbounded/streamed assets,
  fog used to hide the far clip, or sustained <30fps.
- **Camera crimes:** free-fly / orbit-that-loses-you; **remounting the `<Canvas>` per room**.
- **Signal / guardrail crimes:** any **streak / point / XP / score / countdown / FOMO** on a cabin, an
  artifact, or on returning; any **fixed label** ("you are a musician"); celebrating a **prompted** return;
  a badge on `unfinished`.
- **Accessibility crimes:** an accessible path that is a **lesser flat menu** instead of a true peer that
  preserves *choosing what to revisit*; color-only cabin/state identity; essential motion under
  reduced-motion; a broken (rather than calm) reduced-motion still.

---

## 12. Self-score rubric — anchored to the references

Per row: **10** = passes a one-second glance beside A Short Hike / Alba / a Ghibli cabin interior at 1080p
on a Chromebook; **7** = clearly synthetic but the *same class* of image; **4** = decent hobby demo; **2**
= 2010 tech demo / a pile of default-material CC0 assets. **Score every phase; for each row write "what
raises this +2"; implement the two cheapest before proceeding** (the LAAS loop).

Rows:

- **Cabin warmth & coziness** (do I want to be in this room?)
- **Firelight & light transport** (warm key + hearth + cool dusk fill; **no dead shadow**)
- **Cabin legibility** (craft nameable in ≤1s from four channels)
- **Dressing density & lived-in feel** (≥5 surface classes, someone-just-left-the-room)
- **Material quality** (aged wood/knit/leather/brass/parchment/ceramic; **satin, not plastic**; ≥3 bands)
- **Palette / color-script discipline** (everything on the §3 scale; warm/cool split holds)
- **Doorway-object obviousness** (the one warm-glowing primary action)
- **Ambient motion & life** (fire flicker, smoke, motes, cat — one second from motion)
- **Map cohesion & wayfinding** (the clearing reads as one hamlet; you-are-here + return-glow legible)
- **Map↔cabin continuity** (same cabin, same fire, same hue across the cut)
- **Accessibility parity** (the DOM peer is a true equal, not a lesser menu)
- **Chromebook perf** (`<50` draw calls, `dpr≤1.5`, frozen shadows, ≥30fps sustained)

---

## 13. Verification battery — the reference-delta loop

Run at every phase close (integrates the QA harness + VLM grader; reuses `window.__qa`):

1. **Reference-delta loop (mandatory).** Render the closest shot, place it beside the matching hero
   reference frame (§7), write `DELTA.md`: the **ten most significant differences, ranked**. **Fix the top
   three. Re-render.** Only then does the phase close.
2. **Shadow-color test.** Sample N shadowed pixels (room + map); chroma must show a **blue-violet** tint
   from the dusk skylight — **never desaturated gray** (Pillar B).
3. **Firelight test.** Assert the hearth/stove is emissive + blooming and reads as a warm source; a room
   with no lit fire and no window shaft fails.
4. **Cohesion / palette test.** Sample surface hues across a scene; each must land in the §3 palette
   (Pillar A) — catches untinted kit-pile gray and any off-scale hue model-free.
5. **Satin test.** Sample specular on wood/wool/ceramic; a plastic-gloss highlight fails the material bar.
6. **Primary-action-live test.** For every room + map cabin: pointer/raycast round-trip → assert
   `window.__qa.stateHash()` **changes** (a dead doorway object / dead pad hard-fails).
7. **Legibility VLM rubric.** Reference-free binary checks on a screenshot (+ before/after for
   interactions): *is the cabin's craft nameable in 1s? is the doorway object obvious? does the room read as
   a lived-in cabin, not an asset dump? does every interactive thing do something?* — pinned model, N
   epochs + majority vote, deterministic pixel/DOM pre-filters in front.
8. **Perf HUD check.** Draw calls, fps p95, dpr, shadow-casters vs §9, on a real low-end device under
   sustained load (throttling only shows after minutes).
9. **Contact sheet.** The clearing at golden hour (a return-glow present) · each cabin interior's hero
   framing · a map↔cabin transition still · the reduced-motion/`board-2d` a11y floor of one zone.

---

## 14. Final acceptance — the two-frame test (ours)

Produce two frames and place each beside its reference:

1. **The clearing at golden hour** — the Lodge with its lit hearth and rising smoke; three distinct,
   instantly-legible cabins (terracotta / sage / periwinkle) along a warm winding path; a glinting stream +
   footbridge; a wandering cat; long blue-violet shadows; fireflies; a gentle **return-glow** on one cabin
   window. *(Ref: A Short Hike overworld × Stardew × Firewatch dusk.)*
2. **A cabin interior (the Atelier)** — a warm golden shaft with dust motes across a beamed log room; a
   glowing wood-stove; the drafting desk with the Storybox; the gallery wall with one half-finished frame
   glowing; the **grand easel's luminous periwinkle canvas** as the one obvious doorway; a cat asleep on the
   sill. *(Ref: Ghibli cabin interior × Alba.)*

If a viewer's eye snags within one second on a **category error** — dead/gray shadows, default-material
gray, plastic shine, an incoherent kit-pile, a cabin whose craft is unclear, no fire, no obvious doorway,
or a moody/night palette — **the task is not done. Iterate the delta loop.** Then, and only then, the
operator free-explores on `localhost` for the final human sign-off.

---

## 15. Build / integration notes (how the theme lands)

- **P-A0 (warm art pack).** Swap `SCENE3D` values (§3.2); keep `HUE_RAMP` (§3.3); add `CABIN` +
  `MAP_COLOR_SCRIPT` exports (§3.4). Update `interest-lab-view/test/art.test.ts` /
  `.../test/scene.test.ts` expectations to the warm values. Author the reference frames (§7) + stand up the
  delta tool + shadow-color/cohesion tests (§13.1–4). *Gate: §13 1–4 on a stub room + the map.*
- **P-A1 (the clearing to bar).** Bake the iso cabin sprites through this pack; build the DOM map (§6):
  cabin buttons, the Lodge/hearth "you are here," return-glow, time-lapse, smoke/fireflies/cat. *Gate:
  two-frame test frame 1.*
- **P-A2 (one cabin to bar).** Take one zone room (start with the Atelier — highest bar) to the full
  lighting recipe (§5) + the shared cabin kit (§8.1) + its craft layer + doorway object (§8.2) + the
  transition. *Gate: two-frame test frame 2; primary-action-live; perf floors.*
- **Zone loops** consume `CABIN`/`SCENE3D`/`HUE_RAMP` + the per-cabin hero frames as their art contract;
  each still owns only its own dir; the one shared-root touch is the zone registry line. The theme is a
  **value + reference layer** on top of the frozen `ZonePlugin` / `Scene3DView` / `HUE_RAMP` shapes — **no
  contract breaks.**

### The naming nit (carried from reconciliation §B8)

The shipped `RenderTier` literals are `quest-world-3d*`; this theme (and the world redesign) speak of
`room-3d*` / "cabins." Cosmetic view-layer alias/rename in a follow-up — out of this doc's critical path.
