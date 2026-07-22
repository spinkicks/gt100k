# Emberwood Cabin Interiors — the CODE cabin: **The Tinker Workshop** (buildable interior set)

**Date:** 2026-07-21 · **Owner:** David · **Scope:** the *concrete, buildable, set-dressed 3D interior* of
the Code cabin — **"The Tinker Workshop"** — in **Emberwood** (the Interest Lab discovery world). This doc is
the **set spec**: the obsessive prop inventory (with scale + placement), the composed camera layout, the
material + lighting recipe, the ambient life + signal-free code-flavored micro-interactions, the CC0 sourcing
+ draw-call budget, and the LAAS acceptance apparatus (hero reference frame, hard floors, banned outcomes,
self-score). It takes the *interior* to maximum buildable depth so a coding agent can assemble it.

**Reads first / builds on (does NOT contradict; if anything here fights these, they win):**
- [`2026-07-21-world-art-direction-cozy-cabin.md`](./2026-07-21-world-art-direction-cozy-cabin.md) — the
  Emberwood palette/materials/lighting bible; the shared cabin-interior kit (§8.1) + Code's per-cabin craft
  layer + the hero frame **"The Sunlit Workshop"** (§7); the six pillars; the `SCENE3D` warm pack; hard
  floors §9; banned outcomes §11. **The bible wins any conflict.**
- [`2026-07-21-zone-code-design-v2.md`](./2026-07-21-zone-code-design-v2.md) — the Code room's exact contents
  (§A3), reference frames RF-W1/W2 (§A1), hard floors (§A5), banned outcomes (§A9); the Build Bench + Pip +
  the Shelf; the seam to the deferred content app.
- [`2026-07-21-world-gameflow-movement.md`](./2026-07-21-world-gameflow-movement.md) — the interior control
  model (fixed `CAMERA3D`, gentle clamped look, step-to-hotspots), the `RoomHotspot` shape (§4.2), the
  **host-ready warm doorway placeholder** (§4.3), the `ActivityDOM` peer (§4.5).
- [`2026-07-21-world-aliveness-and-juice.md`](./2026-07-21-world-aliveness-and-juice.md) — the breath clock
  (§5.1), the cozy-juice grammar (§4.1), the micro-interaction schema (§4.4), and **the firewall: juice is
  never signal** (§1.2). Every delight here is signal-free.
- [`stylizedWorldAssetPipeline.md`](../../research/stylizedWorldAssetPipeline.md) — CC0 backbone
  (Kenney/Quaternius/KayKit), one HDRI, frozen shadows, instancing, `<50` draw calls, `dpr≤1.5`.

**Grounding tokens (from the repo — reference, do not redefine):** `HUE_RAMP[1] = "#5FB98C"` (the Code
sage-green identity hue, KEPT), `PALETTE` (`spark #FF9E5E`, `beacon #FFD166`, `tide #5EC8D8`, `sprout
#7BD88F`), the warm `SCENE3D` pack (art bible §3.2) and the additive `CABIN` material palette (§3.4),
`CAMERA3D` (adopted **verbatim**), `MOTION`/`EASINGS`/`resolveMotion` (reduced-motion honored),
`TYPOGRAPHY` (Fredoka/Iowan/Inter).

**Depth model = LAAS:** a named hero reference frame, an itemized contents list judged against it, two-sided
hard floors, an explicit banned-outcomes list, and a reference-anchored self-score with a mandatory
reference-delta loop — **judged against images (A Short Hike interiors · Ghibli workshops · Stardew · "cozy
inventor workshop lowpoly"), not against "pretty good for a browser."**

---

## 0. TL;DR — what this doc decides

1. **The room is a cozy inventor's/tinkerer's workshop that reads as CODE in ≤1 second** — a warm log-cabin
   *greenhouse-workshop* where someone builds little wind-up automata and logic contraptions. Warm honey
   wood + brass + worn leather (the log-cabin base) **fused** with maker gear (a Build Bench, a solder
   bench, blueprints, gears, wind-up bots, a marble-run logic contraption). **Hand-made, not sterile lab.**
2. **The doorway object is "The Build Bench"** ([§4](#4-the-doorway-object--the-build-bench)) — a chunky
   warm-wood desk carrying a **friendly retro terminal** (softly-glowing **sage-green** screen), a floating
   **blueprint hologram**, the half-built automaton **Pip**, and a chunky **brass GO wind-up key**. It is the
   single brightest warm focal point and the one obvious verb ("step up to the bench"); a **host-ready warm
   placeholder** that is *provably live* (`stateHash()` changes) but opens no fake content yet.
3. **The retro terminal and the Build Bench are one object, not two.** The operator's "glowing terminal" is
   **fused into** the bench as its screen (the blueprint surface), so the room has **exactly one** warm-glowing
   primary — never two competing focal points ([§4.1](#41-decision-one-doorway-not-two)).
4. **Screens/LEDs stay warm, never cold blue.** The warm/cool split is carried by *light* (golden window key
   + stove glow vs the cool dusk-blue skylight fill), and the terminal/hologram glow in the **sage domain hue
   + amber**. The one cool practical is a tiny, restrained **verdigris** oscilloscope glint — small, off the
   hero, never a cold-blue wash ([§6.4](#64-the-warmcool-split--the-no-cold-blue-screen-rule)).
5. **The set is dressed past the floor and instanced under the ceiling:** **≥ 46** distinct dressing
   occupants across **10** surface classes ([§3](#3-the-full-prop-inventory-the-obsessive-enumeration)),
   assembled from CC0 kits into a **~32-draw-call** scene (hard cap 80) ([§8](#8-cc0-sourcing--draw-call-budget--tiers)).
6. **It breathes and it responds — signal-free.** One breath clock drives fire flicker, dust motes, window
   flicker, and a slow display gear; **four** cozy code-flavored micro-interactions (wind up Pip → he toddles;
   flip the switch → the light-chain chases on in sequence; drop a marble → the logic contraption clacks and
   rings; stoke the stove) obey the cozy-juice grammar and emit **zero** `ActivityEvent`s
   ([§7](#7-ambient-life--code-flavored-micro-interactions)).
7. **It degrades cleanly:** `room-3d` (full) → `room-3d-lite` (flat lights, no bloom, thinned motes) →
   the `ActivityDOM` **described room** (a true peer, not a lesser menu), reachable with zero WebGL
   ([§8.4](#84-tier-degradation--the-accessible-floor)).

---

## 1. Hero reference frame — name the bar

Author these into `passion/packages/interest-zone-code/reference/` in phase 0 (real screenshots from the
touchstones). **Every phase renders the closest shot and runs the reference-delta loop against them.**

### 1.1 RF-INT-CODE — **"The Sunlit Workshop"** (the hero establishing shot)

*Touchstones:* A Short Hike interiors · Studio-Ghibli workshops (*Kiki*'s attic, *Whisper of the Heart* desk)
· Stardew greenhouse/workshop · Alba cottages · "cozy inventor workshop lowpoly" (ArtStation/itch). Deepens
art bible §7 "The Sunlit Workshop" + zone-code-v2 RF-W1.

> **The frame.** A composed 3/4 view into a small warm **log workshop with a glass greenhouse gable**. Late
> golden-hour sun pours through a **mullioned window (upper-left)** and the **glass gable overhead**, throwing
> a soft **god-ray shaft thick with dust motes** diagonally down-right across a central **chunky warm-wood
> Build Bench**. On the bench: a **friendly retro terminal** with a softly-glowing **sage-green** screen, a
> **floating blueprint hologram** of icon-blocks bobbing above it, the **half-built wind-up automaton "Pip,"**
> a **brass GO wind-up key**, a jar of gears, curled blueprint paper, wood shavings. Behind, a **pegboard**
> of brass hand-tools on the log wall and a **chalkboard** with a hand-drawn start→loop→goal flow-sketch. To
> the right a **wood-stove glows amber** (a kettle on top, split logs stacked) — the recurring hearth. To the
> left a **solder/electronics bench** with a magnifier lamp, circuit boards, coiled wire, a jar of
> components, and a **string of warm bulbs**. A **Shelf of little finished automata** and a **plank shelf of
> worn manuals**. **Potted sprouts and a trailing vine** frame the greenhouse warmth; a **rug**, a worn
> **stool**, a **mug**, a **cat asleep on the sill**. Warm honey wood + brass; shadows tint **blue-violet**,
> never gray. The eye lands on the glowing bench within one second.
>
> **FAIL if the frame looks like:** an empty room with one table and a button · a cold gray lab · bare
> untextured walls · a sterile server room · a cold-blue-screen "hacker" room · a lobby.

### 1.2 RF-INT-CODE-2 — **"The Bench, ready"** (the doorway, close)

*Touchstones:* the glowing forge/anvil/portal in cozy games; Monument Valley warm focal geometry. Deepens
zone-code-v2 RF-W2.

> **The frame.** The Build Bench as the single brightest warm focal point: the **blueprint hologram**
> (3–5 translucent icon-blocks) gently bobbing a few cm above the bench with a **`spark #FF9E5E` rim-glow**
> and soft bloom; the **retro terminal** screen warming in **sage `#5FB98C`**; the chunky **brass GO key**
> catching a candle-warm glint; **Pip** mid-assembly beside it doing a tiny wind-up twitch; a worn stool and
> a light-worn spot on the floor implying "step up here." It reads as *the one thing to do* with no text.
>
> **FAIL if:** a flat button floating in 3D · a generic "Enter" sign · two competing focal points · a cold
> screen · nothing obviously primary.

### 1.3 The inversion of LAAS (stated plainly)

LAAS's floors are geometry floors (≥5M triangles). **Ours are coziness, firelight, legibility, dressing
density, and motion floors under a hard draw-call ceiling.** On a Chromebook, beauty is **warm light +
palette + cohesion + a lived-in bench**, not polygon count. A room that is *sterile, cold-lit, cold-blue,
under-dressed, or asset-soup* is a **failed screen**, exactly as a flat 2010 terrain is a failed LAAS screen —
even at 60 fps.

---

## 2. The composed camera + spatial layout

### 2.1 Coordinate convention (buildable)

A right-handed room frame; all placements below use it (units = **meters**).

- **Origin `(0,0,0)`** = floor, directly under the **front edge of the Build Bench** (room center-front).
- **+X** = camera-right (call it *east*); **−X** = camera-left (*west*).
- **+Y** = up. **+Z** = **toward the camera** (out of the diorama / the open "fourth wall"); **−Z** = back wall.
- **Camera** = `CAMERA3D` **verbatim**: `home.pos [0, 4.5, 15]`, `home.target [0, 0.4, 0]`, `fov 42`,
  `establishStart [0, 7, 22]`, `focusLerp 0.075`, `focusFillDistance 6.5`; orbit clamps polar 60–85°, azimuth
  ±75°, **no pan, no zoom** (§2.5). The camera looks slightly down the +Z axis at the bench.
- **Room shell footprint:** back wall at **z = −4.5**; side walls at **x = ±6.5**; floor **y = 0**; tie-beams
  at **y = 3.6**; glass gable ridge at **y = 4.4**. The +Z side is **open toward the camera** (no near wall) —
  the diorama's fourth wall — framed instead by dark foreground dressing at **z = +5 … +8** (§2.4).

```
  PLAN (looking straight down; camera is far below at z=+15, looking up-screen toward −Z)

            x=-6.5                     x=0                      x=+6.5
   z=-4.5  ┌───────[ WINDOW ]────[ PEGBOARD ]───[ CHALKBOARD ]──────┐  ← back (log) wall
           │  bookshelf         (tool wall)      (flow sketch)  STOVE│  ← wood-stove back-right corner
           │  of manuals                                        (hearth)
   z=-2.0  │  SOLDER BENCH        · · · · · ·        SHELF of automata│
           │  (magnifier,        marble-run          + manuals shelf │
           │   light-chain)      contraption                         │
   z= 0.0  │        └──────[ THE BUILD BENCH ]──────┘   rug    stool │  ← HERO + DOORWAY (center)
           │                 Pip · terminal · GO key                 │
   z=+2.0  │     rug ...............................  crate .........│
           ·                                                          ·
   z=+5..+8   [ dark foreground frame: near beam · vine · parts crate ]  (open fourth wall)
                              ▲ camera at (0, 4.5, +15) ▲
```

### 2.2 The value structure (Pillar E: dark frame → lit subject → luminous background)

- **Dark cozy foreground frame (`wood.cocoa #4A3320`, in shade):** a near **tie-beam** clipping the top of
  frame (y≈3.5, z≈+6), a **parts crate** bottom-left (z≈+6.5), a **trailing vine** drooping from top-right
  (z≈+5.5), and the near lip of the **rug** — all under-lit, silhouetting the shot.
- **Lit subject (mid-value honey + the hero warms):** the **Build Bench** at center (z≈+0.3), raked by the
  golden shaft; the sage terminal + amber GO key are the brightest focal warms.
- **Luminous background:** the **golden window** (`light.window #FFC08A`) upper-left and the **wood-stove**
  (`fire.flame #FFB25A`) back-right — the two warm sources; the pegboard/chalkboard recede into gentle honey
  fog (`fogHex #E0C79A`).

### 2.3 The focal path (the eye's authored journey — one clear primary)

1. Enter top-left on the **golden window shaft** → 2. ride the **dust motes** down-right → 3. land on the
**glowing blueprint hologram + sage terminal + brass GO key** on the Build Bench (**the doorway — the one
bright sage+amber focal**) → 4. notice **Pip** beside it (character warmth) → 5. drift right to the **amber
wood-stove** (comfort) → 6. glance back-left to the **chalkboard/pegboard** (the craft's marks) → settle.
One unambiguous primary (the bench); everything else is beautiful, legible atmosphere.

### 2.4 Foreground framing detail

The open fourth wall is framed so the composition never floats: the **near tie-beam** + **vine** cap the top,
the **parts crate** + **rug lip** anchor the bottom-left, and **palette fog** dissolves the far corners. This
is the "dark near-edge" that gives the diorama depth and keeps the bench reading as *inside a place*, not on a
turntable.

### 2.5 Interior movement (adopted verbatim from gameflow §4)

Fixed composed shot; **no free-fly, no pan, no zoom.** On entry the camera flies `establishStart → home`
(`drift-in`; `cut` under reduced-motion). Pointer-drag / arrow-nudge = a **gentle clamped look-around**
(polar 60–85°, azimuth ±75°, `dampingFactor 0.08`) that **springs back** to `home`. **Step-to-hotspots:**
selecting a hotspot eases the camera to `focusFillDistance 6.5` in front of it (`focusLerp 0.075`); a
persistent **"↩ step back"** returns to `home`. **"← Back to the clearing"** is always present and first in
focus order (never trapped). Age staging: `worldCameraMode "auto-tour"` (6–8) does one establishing pass over
the hero props before settling; `"focus+orbit"` (9–14) settles immediately.

### 2.6 The hotspot list (the buildable interface — `RoomHotspot[]`, gameflow §4.2)

Order = roving focus + tab order. Exactly **one** `doorway` (primary). In the content-deferred v1 the **live
taste (hero) and the host-ready doorway coincide on the Build Bench** — one bright focal region; when content
lands, the hero taste may split into its own hotspot with **no layout change**.

| # | `id` | `label` | `role` | `focus.target` (x,y,z) | `live` | Note |
|---|---|---|---|---|---|---|
| 1 | `back-to-clearing` | "← Back to the clearing" | (exit) | n/a (DOM control) | — | always first; never trapped |
| 2 | `build-bench` | "The Build Bench" | **doorway** (primary) | `(0, 1.15, 0.3)` | **true** | the one warm verb; retro terminal + hologram + GO key + Pip (§4) |
| 3 | `wood-stove` | "The wood-stove" | ambient | `(4.6, 1.0, -3.6)` | true | stoke it → embers swell (§7.3 #4) |
| 4 | `solder-bench` | "The solder bench" | ambient | `(-3.6, 1.1, -0.4)` | true | flip the switch → light-chain chases (§7.3 #2) |
| 5 | `marble-run` | "The logic contraption" | ambient | `(-1.4, 1.7, -2.2)` | true | drop a marble → it clacks + rings (§7.3 #3) |
| 6 | `pip` | "Pip, half-built" | ambient | `(0.7, 1.05, 0.3)` | true | wind him up → he toddles (§7.3 #1) |
| 7 | `shelf` | "The Shelf of creations" | ambient | `(5.4, 1.8, -2.4)` | true | the return cue; empty slots visible |
| 8 | `window-sill` | "The sunny sill" | ambient | `(-4.4, 1.6, -3.8)` | true | dust motes; a cat asleep — pet it (§7.3 #5) |

All `live` hotspots change `window.__qa.stateHash()` on contact (§8.5). Parity: this set equals the
`ActivityDOM` peer list (§8.4).

---

## 3. The full prop inventory (the obsessive enumeration)

The cozy-cabin base (beams, wood-stove, rug, warm lamps, plant, golden window) **fused** with the
tinker/computation craft layer. Every row is a **required occupant** (Pillar C — nothing is bare). **Scale** =
approx bounding box (w×d×h, m). **Pos** = anchor `(x,y,z)` in the §2.1 frame. **Tint** = a `CABIN`/`PALETTE`
token. **Draw** = its draw-call contribution (see the budget, §8.2). Repeated props get per-instance
hue/value/scale/rotation **jitter** (Pillar C — cloned uniformity is banned).

**Distinct dressing-occupant tally = 46** across **10 surface classes** (floors in §9 require ≥40 / ≥6). The
count is in the right margin of each class header.

### 3.1 Surface class A — Shell: beams, log walls, chinking, glass gable *(occupants: 4)*

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Log/plank back + side walls** w/ plaster **chinking** between logs | shell 13×9×3.6 | walls at z=−4.5, x=±6.5 | — | `woodOak #A87C4A` logs, `plaster #EAD7B4` chinking | merged shell (§8.2) |
| **Exposed tie-beams** overhead (4, incl. the near foreground beam) | 0.22×0.22×13 each | y=3.6, spaced z=−3.5…+6 | ‖X | `woodWalnut #6B4A2E`; foreground beam `woodCocoa #4A3320` | in merged shell |
| **Glass greenhouse gable roof** (mullioned glass panes on a timber ridge) | 13×8 sloped to ridge y=4.4 | over the room, ridge along X | — | timber `woodHoney`, glass tinted `duskWindow #7C93B8` @ low opacity | +1 (glass) |
| **Plank floor** w/ seams + a few knots | 13×11 | y=0 | — | `woodHoney #C89A5E` → `woodOak` grain | in merged shell |

### 3.2 Surface class B — The golden window & light source (left) *(occupants: 4)*

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Mullioned window** (the warm key's aperture) | 2.4×0.15×2.0 | (−4.6, 2.1, −4.45) | on back wall | frame `woodHoney`; glass `windowSpill #FFC08A` (emissive spill) | +1 |
| **Golden god-ray shaft** (soft volume / emissive quad + fog gradient) | cone ~2×2×7 | from window → bench, diag down-right | ~30° | `keyHex #FFD8A3` | +1 |
| **Windowsill** with a small **watering can** + **2–3 potted sprouts** | sill 2.4×0.3; pots ⌀0.18 | (−4.4, 1.5, −4.2) | — | sill `woodDrift`; sprouts `forestPine #5E7B4E`; can `brass` | pots instanced (§3.9) |
| **Trailing vine** framing top-left → over the sill | drape ~2.5 | from (−5.8, 3.4, −4.3) | droop | `moss #8CA55E` / `forestPine` | +1 (`<Float>`) |

### 3.3 Surface class C — The wood-stove / hearth (back-right corner) *(occupants: 5)*

The recurring hearth motif (art bible §8.1) — the same amber as the Lodge fire; **warm key #2**.

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Cast-iron wood-stove** w/ a little glass door | 0.9×0.9×1.4 | (4.7, 0, −3.7) | faces −45° into room | body `woodCocoa`/iron; door glow `fireFlame #FFB25A` | +1 body |
| **Firebox glow** (emissive coal-bed → flame) | inside door | (4.7, 0.5, −3.7) | — | `fireEmber #FF7A3C` → `fireFlame`; +1 non-shadow `pointLight` | +1 emissive |
| **Stove-pipe / chimney** rising to the gable | ⌀0.22 × 2.6 | (4.7, 1.4→4.0, −3.9) | vertical | `patina.verdigris #7F9E8E` aged metal | in stove group |
| **Copper kettle** on top (steams on approach) | ⌀0.28×0.3 | (4.9, 1.45, −3.7) | — | `brass #B98A4E` + verdigris in crevices | instanced-props |
| **Stacked split logs** + a folded **knit blanket** beside it | logs 0.9×0.5×0.5; throw 0.6 | (5.6, 0, −3.0) | — | logs `woodOak`; blanket `woolWarm #C48A6A` (jitter) | logs instanced |

### 3.4 Surface class D — **The Build Bench** (center — hero + doorway) *(occupants: 7)*

The one primary. Full spec in [§4](#4-the-doorway-object--the-build-bench); enumerated here for the inventory.

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Chunky warm-wood Build Bench** (thick top, tool-chamfered edges, a vise) | 2.6×1.0×0.95 | (0, 0, 0.3) | faces +Z | `woodHoney` top, `woodWalnut` legs; edge wear | +1 |
| **Friendly retro terminal** (rounded CRT-ish, chunky bezel, soft screen) | 0.55×0.4×0.45 | (−0.5, 0.95, 0.0) | faces camera | bezel `woodDrift`/`brass`; screen **`hue.code #5FB98C`** (warm, low bloom) | +1 screen (atlas) |
| **Blueprint hologram** (3–5 translucent icon-blocks bobbing) | ~0.6×0.5 float | (0, 1.5, 0.2) | `<Float>` | emissive atlas: sage `#5FB98C` + `spark #FF9E5E` rim | +1 (atlas) |
| **Pip, the half-built wind-up automaton** (the lone skinned mesh) | 0.35×0.3×0.5 | (0.7, 0.95, 0.3) | ¾ to camera | `brass` + `woodHoney` panels; one `sprout #7BD88F` LED | +1 (skinned) |
| **Brass GO wind-up key / lever** (the affordance) | ⌀0.12×0.2 | (0.35, 1.0, 0.45) | upright | `brass` (brightest glint under candle-warm) | instanced-props |
| **Open blueprint** + **jar of gears** + **wood shavings** on the top | jar ⌀0.14×0.2 | (−0.9, 0.98, 0.35) | — | paper `parchment #F0E4C8`; gears `brass`; shavings `woodHoney` | gears + shavings instanced |
| **Worn stool** (the "step up here" cue, light-worn seat) | ⌀0.34×0.6 | (0, 0, 1.6) | — | seat `leather.worn #8B5A3C`; legs `woodOak` | +1 |

### 3.5 Surface class E — The solder / electronics bench (left) *(occupants: 6)*

The operator's electronics bench — **secondary** craft dressing + the light-chain micro-interaction site
(explicitly **not** the doorway).

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Solder bench** (smaller, well-used, scorch marks) | 1.8×0.8×0.9 | (−3.6, 0, −0.4) | faces +Z | `woodOak`; scorch toward `woodCocoa` | +1 |
| **Magnifier lamp** on a bendy arm (a warm bench practical) | arm 0.6; lens ⌀0.2 | (−4.1, 0.9→1.5, −0.5) | over the board | `brass` arm; lens `candle #FFE0A8` glow | +1 |
| **Circuit boards** (2–3, hand-populated look) | 0.2×0.15 each | (−3.4, 0.92, −0.4) | flat | board `forestDeep #37503E`; traces `brass`; one **verdigris** LED (§6.4) | instanced-comps |
| **Jar of components** (resistors/caps as tiny colored beads) | ⌀0.14×0.2 | (−4.0, 0.95, −0.2) | — | glass `duskWindow`; beads jittered warm hues | instanced-comps |
| **Coiled wire spools** (2, warm-jacketed) | ⌀0.2×0.15 | (−3.0, 0.95, −0.6) | — | jackets `terracotta #B5623A` / `leafRust #9C5A32` | instanced-comps |
| **String of warm bulbs** (the light-chain — chases on §7.3 #2) | 12 bulbs, ~2.4 span | (−4.6→−2.6, 1.7, −0.3) | drapes | bulbs `lantern #FFD166` emissive | 1 InstancedMesh |

### 3.6 Surface class F — The pegboard & tool wall + chalkboard (back) *(occupants: 6)*

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Pegboard** on the log wall | 2.4×0.05×1.4 | (0.2, 1.9, −4.4) | on wall | board `woodDrift #B9A484`; peg-holes | +1 |
| **Brass hand-tools** on silhouette outlines (screwdrivers, pliers, calipers, a soldering iron) | ~0.25 each ×9 | across the pegboard | hung | `brass` + `leather` grips; painted silhouettes | 1 InstancedMesh |
| **Pinned blueprints / schematics** (curled corners, pin-holes) | 0.4×0.5 ×3 | (−1.6…1.8, 2.1, −4.38) | pinned | `parchment`; sage ink lines | instanced-paper |
| **Chalkboard** w/ a hand-drawn **start→arrow→loop→goal** flow-sketch (diegetic foreshadow) | 1.4×0.05×1.0 | (−2.6, 1.8, −4.4) | on wall | slate `nightSunk`-toned; chalk `plaster`/`sprout` | +1 (screen atlas) |
| **Corkboard** w/ sticky notes + a pinned photo of a finished bot | 0.9×0.7 | (2.4, 1.9, −4.4) | on wall | cork `woodDrift`; notes jittered warm | instanced-paper |
| **Slow-turning display gear** (a big brass cog, always turning — Pillar F) | ⌀0.5×0.08 | (1.7, 2.6, −4.35) | on wall, rotates | `brass` + verdigris | +1 (own spin) |

### 3.7 Surface class G — The Shelf of automata + bookshelf of manuals (right) *(occupants: 5)*

The diegetic **memory / return cue** (zone-code-v2 §A3 Zone 4): kept creations sit here; **empty slots are
visible** (room to make more); the shelf **glows softly iff** kept/unfinished work exists.

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **The Shelf** (wooden, slotted, right wall) | 1.8×0.35×2.2 | (5.6, 0, −2.4) | on wall | `woodHoney`/`woodOak` | +1 (in wall furniture) |
| **Finished wind-up automata** in slots (Pip's cousins — "Sprout" et al.), varied | ~0.25 ×5 | across shelf slots | jittered | `brass`+`woodHoney`; sage LEDs | 1 InstancedMesh |
| **Ribbon tags** ("★ solved in N blocks") on kept slots | 0.12 ×N | on filled slots | — | `parchment`; `beacon #FFD166` star | instanced-paper |
| **Plank shelf of worn manuals** (spines out, a couple leaning) | 1.4×0.25×0.4 | (5.8, 1.4, −0.6) | on wall | covers `leather`/`terracotta`/`forestDeep` (jitter) | 1 InstancedMesh (books) |
| **A mug + a small brass desk-lamp** on the shelf ledge | mug ⌀0.09 | (5.2, 1.85, −1.0) | — | mug `ceramic #D8B48C`; lamp `brass`, glow `beacon` | instanced-props |

### 3.8 Surface class H — The marble-run / logic contraption *(occupants: 3)*

The operator's logic contraption — a **marble-run** wall/shelf machine that visibly *routes* a marble through
gates: a hand-made, tactile metaphor for sequence/branching. A signal-free micro-interaction (§7.3 #3).

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Marble-run frame** w/ ramps, a fork gate, a little lever & a bell at the bottom | 1.2×0.2×1.6 | (−1.4, 0.9, −2.2) | wall-leaned | `woodHoney` ramps; `brass` gate + bell | +1 (track) |
| **Marbles** in a small tray at the top (a few glass ones) | ⌀0.04 ×5 | (−1.4, 2.4, −2.2) | — | glass, jittered warm tints | instanced (reuse) |
| **A hand-cranked "logic" gizmo** beside it (cams + a flag that flips) | 0.3×0.2×0.3 | (−0.6, 0.95, −2.1) | — | `brass` + `woodOak` | instanced-props |

### 3.9 Surface class I — Plants / greenhouse warmth *(occupants: 3)*

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Potted sprouts** (the "logic that grows" motif) on sill + bench + shelf | ⌀0.16 ×4 | sill/bench/shelf | jittered | pot `ceramic`/`terracotta`; leaf `forestPine`/`sprout` | 1 InstancedMesh |
| **A hanging pot** w/ a trailing plant (`<Float>` sway) | ⌀0.25 | (2.8, 3.0, −2.0) | hangs | `ceramic`; vine `moss` | +1 (`<Float>`) |
| **Moss / a tiny terrarium** on the solder bench | ⌀0.15 | (−2.8, 0.95, −0.5) | — | glass + `moss`/`forestDeep` | instanced-comps |

### 3.10 Surface class J — Floor & cozy dressing *(occupants: 3)*

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Knit/woven rug** (chunky ribs, a dropped stitch, worn where you stand) | 3.2×2.2 | (0, 0.01, 0.8) | — | `woolWarm` (jitter → sage-wool `#7E9E8E` / rust-wool `#B5623A`), `woolCream` border | +1 |
| **Parts crate** (foreground frame, spare gears spilling) | 0.6×0.5×0.5 | (−4.6, 0, 2.2) | ¾ | `woodDrift`; gears `brass` | +1 |
| **Scatter set:** wood shavings, a curled blueprint, a dropped bolt, a coil of solder on the floor | small | around the bench (z=+1…+2) | jittered | `woodHoney`/`parchment`/`brass` | in scatter InstancedMesh |

**Human-presence cue (Pillar C):** the **cat asleep on the sunny sill** (Biscuit, the wandering heart of
Emberwood — art bible §1 / aliveness §9.4), the light-worn stool seat, the half-drunk mug, the *half-built*
Pip, and a **book left open** on the solder bench all say *someone was building here one second ago*.

---

## 4. The doorway object — **The Build Bench**

The single host-ready primary affordance (gameflow §4.3; art bible §8.2; zone-code-v2 RF-W2). It is the
**second warm focal point** after the hearth: the eye lands on the fire for comfort and on the bench for *the
one thing to do*.

### 4.1 Decision: one doorway, not two

The operator flagged two candidates — "the glowing terminal" and "the Build Bench." **Decision: they are one
object.** The retro terminal is **fused into** the Build Bench as its **screen** (the surface the blueprint
hologram projects from), so the room has **exactly one** warm-glowing primary. This obeys the frozen art bible
§8.2 + zone-code-v2 (Build Bench = the doorway that opens the content app) **and** honors the operator's
"friendly retro computer/terminal" ask — while avoiding the banned outcome of **two competing focal points**.
The Build Bench *is* the friendly retro workstation: warm wood + a chunky terminal + a wind-up key + a
half-built robot.

### 4.2 What it is, physically

A chunky warm-wood desk (§3.4) carrying, as one composed focal cluster:
- a **friendly retro terminal** — rounded, chunky-beziled, a soft **sage-green `#5FB98C`** screen (warm, low
  bloom; **never cold blue**, §6.4);
- a **floating blueprint hologram** — 3–5 translucent **icon-blocks** bobbing a few cm above the bench
  (`<Float>`), sage + a **`spark #FF9E5E`** rim-glow, soft bloom (the "tiny program" foreshadow);
- **Pip**, the half-built wind-up automaton (the content app's protagonist, foreshadowed), mid-assembly;
- a chunky **brass GO wind-up key/lever** — the tactile "run it" affordance, the brightest brass glint;
- an **open blueprint**, a **jar of gears**, **wood shavings** — the maker's marks.

### 4.3 How it behaves — a host-ready **warm placeholder** (live, honest)

Learning content is **deferred** (reconciliation §7). The doorway must be a warm, honest, **live** placeholder
— never a dead "coming soon" wall (a banned outcome). Per gameflow §4.3:

- **It glows and invites.** At rest the hologram + GO key sit at `SCENE3D.markerEmissiveRest 0.35` and
  **breathe** to `markerEmissivePulse 0.5` in the sage domain hue on the breath clock — the single obvious
  focal point. Bloom lifts it (`bloomPeak 1.4`).
- **It responds, honestly.** Selecting `build-bench` eases the camera in (`focusFillDistance 6.5`) and plays a
  **warm acknowledgment**: the hologram brightens and rotates one icon-block, the terminal screen warms up,
  **Pip ticks once**, the **brass GO key clicks**, a soft chime, and an **honest** line appears —
  *"The workshop's warming up — new builds are coming. For now, wind up Pip and look around."* No fake lesson,
  no quiz, no modal dead-end. Copy in `TYPOGRAPHY` (Fredoka display).
- **It is provably live.** The interaction toggles a small `peeked` room-state so
  `window.__qa.stateHash()` **changes** on contact (SC-CORE-14) — *before any content exists*.
- **When content lands** this same hotspot swaps its handler to `openBench()` → `<ContentHost>` (the
  Brilliant-style Build Bench app, zone-code-v2 Part B) — **no movement/layout/flow change.**
- **Never coercive.** No countdown, no "check back in N days," no badge, no score. Warmth is invitation.

### 4.4 Why the bench, not the terminal alone

The bench reads as **building & logic by hand** (the passion), where a bare terminal reads as "a computer" (a
sterile-lab tell). Fusing the terminal into a wood bench with a wind-up key and a half-built robot is what
makes CODE legible as *a warm maker's craft* in ≤1 second — the whole operator brief.

---

## 5. Materials — the tinker-workshop treatment

**One shading model** across the room (Pillar A): **flat PBR** (`MeshStandardMaterial`, low metalness, baked
AO on a shared gradient atlas) — or toon, chosen once world-wide and held. **No `MeshBasicMaterial`, ever.**
The look is **satin, never plastic** (roughness never below ~0.35 except the single brightest brass glint
under the magnifier/candle). Every hero surface shows **≥3 detail bands** (macro silhouette · meso 2–20 cm ·
micro normal/rough), per art bible §4.

| Material | Macro | Meso (~2–20 cm) | Micro | Tint target | Lives on |
|---|---|---|---|---|---|
| **Aged wood** | chunky bench, round log ends, beams | plank seams, tool-chamfered edges, a knot or two, worn corners | grain; waxed sheen on handled edges | `woodHoney`→`woodWalnut`; foreground `woodCocoa` | bench, shell, stool, shelf |
| **Brass / copper** | turned/hammered gears, tools, kettle, GO key | dents, solder seams, engraving | satin anisotropic sheen + **verdigris** in crevices | `brass` + `verdigris` cavities | tools, gears, kettle, key, contraption |
| **Worn leather** | slouched stool seat, book covers, tool grips | scuffs, stitch lines, a buckle | low broad specular, edge patina | `leather.worn` | stool, manuals, grips |
| **Knitted wool** | soft rug sag, folded blanket | chunky knit ribs, fringe, a dropped stitch | fuzzy diffuse, zero specular | `woolWarm` (jitter → sage/rust/cream) | rug, blanket |
| **Paper / parchment** | curled blueprint corners | fold creases, torn edge, pin-holes | soft fiber, faint edge translucency | `parchment` | blueprints, notes, ribbons, manuals |
| **Warm ceramic** | thrown mug/pot, a chip | glaze pooling, a ring stain | satin glaze highlight | `ceramic` | mug, pots |
| **Iron / patinated metal** | stove body, stove-pipe | soot near the fire, rivets | matte with a damp low sheen | `woodCocoa`/iron; `verdigris` pipe | stove, pipe |
| **Glass** | terminal screen, jars, gable, marbles | rim highlight, faint dust | low-alpha transmission | `duskWindow` (cool) / warm emissive (screen) | screen, jars, gable, terrarium |
| **Foliage** | rounded low-poly sprouts, vine | leaf clusters | soft backlight translucency (leaves transmit the key) | `forestPine`/`moss`/`sprout` | plants, vine, moss |

**Per-instance variation law (Pillar C):** gears, jars, books, bulbs, components, sprouts, finished bots,
shavings all get hue/value/scale/rotation **jitter**; a fraction show extra wear/patina/a dropped stitch. **A
grid of identical mugs/gears is a fail.** One shared gradient atlas per kit → batching (§8.2).

---

## 6. Lighting — the recipe (applied to this room)

One authored setup consuming the warm `SCENE3D` pack (art bible §3.2). Three warm sources, one cool fill,
frozen shadows, one bloom job.

### 6.1 The sources

1. **One self-hosted CC0 HDRI — "warm cabin interior / golden window at dusk"** (Poly Haven, 1–2K) via drei
   `<Environment>`: the single ambient + reflection source, so every mixed-kit prop (and all that brass) is
   lit identically. `SCENE3D.ambientHex #52402E @ 0.38`.
2. **Warm key #1 — the golden-hour sun (the ≤1 shadow-caster).** One `directionalLight` = `keyHex #FFD8A3`,
   `keyIntensity 1.2`, `keyPos [6,8,5]` — a **low, raking** shaft **through the mullioned window + the glass
   gable**, landing on the Build Bench. Long, soft golden shadows.
3. **Warm key #2 — the wood-stove (diegetic heartbeat).** Emissive firebox (`fireEmber #FF7A3C` →
   `fireFlame #FFB25A`) **+ one cheap non-shadow `pointLight`** in the firebox. **Flicker** = emissive-intensity
   + point-light sine w/ noise on the breath clock (reduced-motion → steady glow). Bloom lifts it.
4. **Warm practicals #3 — the magnifier lamp, the string of bulbs, the shelf desk-lamp, the terminal/hologram**
   — **emissive materials only** (`lantern #FFD166` / `candle #FFE0A8` / `beacon #FFD166` / sage `#5FB98C`),
   no extra real lights; they give bloom its sparkle.

### 6.2 The cool fill (Pillar B — no dead shadow)

A hemisphere: `hemiSkyHex #A9C2E8` (cool dusk-blue) over `hemiGroundHex #C67B48` (warm rust/wood bounce),
`hemiIntensity 0.52`. Result: **no shadow goes dead** — shadowed honey wood under the dusk fill resolves to a
soft **blue-violet-brown**. **0 desaturated-gray shadow samples** is a hard floor (§9).

### 6.3 Shadows, fog, post

- **Frozen shadows only:** `<AccumulativeShadows>` + `<RandomizedLight>` for a settled soft hero shadow under
  the bench (zero cost once composed); `<ContactShadows frames={1}>` under stove/shelf/stool/solder-bench;
  `<BakeShadows>` elsewhere. **≤1 shadow-caster**, never per-frame.
- **Palette-matched fog:** `fogHex #E0C79A`, `fogNear 14 / fogFar 46` — ties the kit pieces into one warm
  atmosphere and carries the golden shaft. **For cohesion, never to hide the far clip** (banned).
- **Post (shared `EffectComposer`, renderer `NoToneMapping`):** `Bloom(mipmapBlur, luminanceThreshold ~1.0)`
  (stove · bulbs · magnifier · terminal · hologram · GO key) + `Vignette` + `ToneMapping(ACESFilmic)`; **SMAA
  not MSAA**; 2–3 passes. `bloomPeak 1.4`, `exposure 1.05`.
- **The golden shaft is the hero detail** — one soft god-ray from the window/gable carrying **dust motes**
  (`<Sparkles>`, sparse). This one detail sells "workshop at golden hour" more than any prop.

### 6.4 The warm/cool split — the **no-cold-blue-screen** rule

The room needs a warm/cool split (Pillar E) *and* the operator + art bible forbid cold-blue screen glow. The
tension resolves by carrying the split with **light, not screens**:

- **Warm owns the lit half:** golden key + stove + practicals + the sage/amber terminal & hologram (sage
  `#5FB98C` is a *warm-leaning* green, not cold blue). Bloom has **one warm job**.
- **Cool owns the shade half:** the dusk-blue skylight fill tints every shadow blue-violet — *that* is the
  cool half, done by lighting.
- **The one cool practical is tiny and restrained:** a faint **verdigris `#7F9E8E`** (not `tide` cyan)
  oscilloscope-trace / status-LED glint on the **solder bench only** — small, low, **off the hero**, never a
  cold-blue wash near the doorway. `PALETTE.tide #5EC8D8` is permitted *only* as this pin-point accent,
  desaturated toward verdigris. **A cold-blue-lit room, or a doorway/terminal glowing cold blue, is a banned
  outcome** (§10).

---

## 7. Ambient life + code-flavored micro-interactions

### 7.1 The breath clock (Pillar G — one heartbeat, aliveness §5.1)

One slow oscillator (`AMBIENCE.breathMs 8000`) sampled with per-element phase offsets drives the fire glow
(±8%), the window/terminal/hologram flicker (≤3%), the plant/vine sway (a few px/deg), and the slow display
gear. **One uniform in a single `useFrame`**; reduced-motion → freeze at mid-phase. The fire is the heartbeat;
the room breathes as one body.

### 7.2 Always-on ambient motions (floor: ≥3 + the breath, art bible §9)

1. **Fire flicker** in the wood-stove (emissive + point-light on the breath).
2. **Dust motes** drifting in the golden shaft (`<Sparkles>`, sparse — 60 / 24 / 0 per tier).
3. **The slow-turning brass display gear** on the back wall (§3.6) — a constant gentle rotation.
4. **Pip's idle wind-up twitch** every few seconds (a tiny skinned-mesh anim).
5. **Plant/vine sway** (`<Float>` on the hanging pot + the trailing vine).
6. **The cat's slow breathing** on the sill (a subtle scale pulse).

*(6 always-on, well past the ≥3 floor. All on `frameloop="demand"` with bounded invalidation; a backgrounded
room drops to 0 GPU.)*

### 7.3 The signature micro-interactions (cozy code-flavored, **signal-free**)

Each obeys the **cozy-juice grammar** (aliveness §4.1): *anticipation → warmth-bump → a soft particle → one
gentle sound → settle*. **Firewall (aliveness §1.2): none of these emit an `ActivityEvent`.** They are pure
delight with a soul; `emitsSignal: false` is a compile-time invariant and QA asserts **zero** signals from
them (§8.5). Reduced-motion → instant state change + sound + a static warmth-bump.

| # | Delight | Hotspot | The interaction | Juice (tokens) | Sound | Signal |
|---|---|---|---|---|---|---|
| 1 | **Wind up Pip** | `pip` | tap → the GO key turns, Pip whirrs, **toddles/hops a few steps** on the bench, then winds down | `windUp` (new; spring + skinned hop), sage-LED warmth-bump | wind-up *whirr* + tiny *clack* footsteps | **NONE** |
| 2 | **Flip the light-chain switch** | `solder-bench` | flip the brass switch → the string of bulbs **chases on one-by-one in sequence** (a "sequence/loop" wink), then holds warm | `chainChase` (new; staggered `lanternLight` ramp), bloom-bump per bulb | soft *tick* + a rising *fwoomp…fwoomp* chain | **NONE** |
| 3 | **Drop a marble (logic contraption)** | `marble-run` | tap the top tray → a marble runs the ramps, **hits the fork gate**, flips a flag, and **rings the bell** at the bottom | `marbleRun` (new; physics-lite tween along a baked path), `spark` warmth-bump on the bell | glass *clack-clack* + a bright *ding* | **NONE** |
| 4 | **Stoke the wood-stove** | `wood-stove` | tap → a poke, **embers swirl up**, the fire **swells brighter ~2s** then eases back (the shared-hearth beat) | `hearthStoke` (aliveness); ember burst `fireEmber→fireFlame`; emissive+point-light bump | crackle-pop + a low *whoomph* | **NONE** |

**Supporting lighter delights (same grammar, smaller):** pet the **sill-cat** (`catPet` → sits up, slow-blink,
purr); the **kettle** steams + a faint whistle on approach; the **magnifier lamp** clicks warmer; the
**blueprint hologram** ripples one block if you brush it (distinct from the doorway "step up" — this is a
brush, not the primary select). Each signal-free.

**Anti-dead-prop rule (aliveness §4.3):** anything that *looks* tappable **must** respond (a subtle idle
glint/sway marks it "alive"); pure scenery stays still and invites no tap. The doorway (`build-bench`) is the
**only** thing that will emit/open content later; the delights above **never** do (the delight/doorway
firewall).

### 7.4 New additive motion kinds (proposed, reduced → instant)

Add to `MOTION`/`ANIMATED_MOTION`/`REDUCED_DURATION_MS` (`interest-lab-view/src/motion.ts`), consistent with
the shipped scale; reuse the aliveness `WORLD_MOTION`/`MicroInteraction` schema.

| New `MotionKind` | durationMs | easing | Reduced |
|---|---|---|---|
| `windUp` | 900 | `pickSpring` | instant |
| `chainChase` | 700 (staggered) | `enter` | instant |
| `marbleRun` | 1200 | `move` | instant |
| `gearTurn` | 6500 (loop) | `linear` | instant (frozen) |

*(`hearthStoke`, `catPet`, `lanternLight`, `breath` already proposed in aliveness §4.4.)*

---

## 8. CC0 sourcing + draw-call budget + tiers

### 8.1 Which CC0 kits supply the workshop (all CC0; avoid Synty — UGC/AI-gen EULA)

Pipeline per `stylizedWorldAssetPipeline.md` §6–7: `gltf-transform optimize --compress meshopt
--texture-compress ktx2` → `gltfjsx --transform --types` → `useGLTF.preload` → drei `<Instances>`/`<Merged>`.
Ship `assets/LICENSES.json`.

| Element | CC0 source (backbone) | Notes |
|---|---|---|
| **Shell** (log walls, beams, glass gable, floor, chimney) | **KayKit** (Medieval Builder / modular timber) + **Kenney** (Building Kit) | one gradient atlas → `<Merged>` shell (1–3 calls); tint `wood.*` |
| **Benches, stool, shelf, pegboard, crate, cabinets** | **Kenney Furniture Kit** + **KayKit** furniture | instanced/merged; tint to palette |
| **Wood-stove, kettle, logs, lantern, string-lights** | **Kenney** (Survival/Holiday) + **KayKit** props | stove/lamps = emissive; bulbs one InstancedMesh |
| **Gears, brass tools, jars, mugs, books, blueprints, components** | **Kenney** + **Quaternius** props; **Poly Pizza** one-off gap-fillers (verify per-model CC0) | instanced repeats w/ jitter |
| **Pip + finished automata + the cat** | **Quaternius** (robots / animated animals) + **KayKit** (160+ CC0 anims) | **one skinned mesh max** (Pip); shelf bots + cat placed static (cat = tiny idle) |
| **Plants, vines, sprouts, moss** | **Quaternius** (Stylized/Ultimate Nature) + **Kenney Nature Kit** | sprouts instanced; vine `<Float>` |
| **Marble-run / contraption** | **Kenney** rails/props + **Poly Pizza** gap-fill | track baked; marbles instanced |
| **Warm-interior HDRI** | **Poly Haven** (1–2K, self-hosted) | the single `<Environment>` IBL — the cohesion lever |
| **PBR textures** (wood, knit, leather, brass, parchment, iron) | **Poly Haven** + **ambientCG** (CC0) | 512–1K → KTX2; the meso/micro bands |
| **Terminal screen / hologram / chalkboard / signs** | authored flat SVG/atlas (emissive) | shared with the content app's block icons |

### 8.2 The draw-call budget (target < 50; hard cap 80)

Instancing + a merged shell + one shared atlas keep it low. Estimated steady-state:

| Group | Draw calls | How |
|---|---|---|
| Shell (walls + beams + floor) | **2** | drei `<Merged>`, one atlas |
| Glass gable + window glass + god-ray shaft | **3** | glass (1) + window (1) + shaft quad (1) |
| Build Bench (body) + terminal screen + hologram | **3** | body (1) + screen atlas (1) + holo atlas (1) |
| Solder bench + pegboard + chalkboard + corkboard + Shelf (wall furniture, merged) | **3** | `<Merged>` static group + 2 emissive/atlas boards |
| Wood-stove body + firebox emissive | **2** | body (1) + emissive (1) |
| Pip (the one skinned mesh) | **1** | skinned |
| Stool + rug + crate + hanging pot | **4** | small statics |
| **Instanced repeats** (10 `InstancedMesh`): gears · brass tools · jars/components · books/manuals · finished bots · bulbs (light-chain) · potted sprouts · marble-run pieces · paper (blueprints/notes/ribbons) · floor scatter | **10** | one mesh+material each, per-instance jitter |
| Slow display gear (own transform) + magnifier lamp | **2** | |
| `<Sparkles>` motes | **1** | |
| Frozen shadows (`Accumulative`/`Contact frames={1}`/`Bake`) | **~0** | composed once |
| Post (`EffectComposer`: Bloom+Vignette+ACES) | **1** | one fullscreen pass |
| **Total** | **≈ 32** | comfortably < 50 (hard cap 80) |

Perf discipline: `dpr={[1,1.5]}`, `antialias:false` + SMAA, `frameloop="demand"` (idle room ≈ 0 GPU),
`<PerformanceMonitor>` + `<AdaptiveDpr>`; textures props 256–512² / hero ≤1024², KTX2, one shared atlas;
triangles ≤ ~150k. Dispose on unmount.

### 8.3 Instancing plan (the perf multiplier)

Everything that repeats is **one geometry + one material, many transforms** (drei `<Instances>` for
declarative counts; raw `THREE.InstancedMesh` if any count grows). Per-instance **jitter** (hue/value/scale/
rotation) on gears, jars, components, books, bulbs, sprouts, finished bots, scatter, paper — so it reads
hand-made, never cloned. Share the KayKit gradient atlas so `<Merged>` can batch the static shell + furniture.

### 8.4 Tier degradation — the accessible floor

`RoomProps.tier` (`quest-world-3d | quest-world-3d-lite | board-2d`):

- **`room-3d` (full):** everything above; motes 60; bloom on; frozen shadows; the shaft + god-ray.
- **drop step:** drop `<Sparkles>` → drop `Bloom` → flatten lights.
- **`room-3d-lite`:** flat lights (no shadow-caster), no post, motes 24, the shaft as a static emissive
  gradient, micro-interactions still work (instant + sound). Draw calls fall further (merge more).
- **`board-2d` → the `ActivityDOM` described room (a true peer, not a lesser menu — gameflow §4.5):**
  - A labeled region: *"The Tinker Workshop — a maker's cabin. Golden light through a glass roof; a wood-stove
    glows in the corner."*
  - **"← Back to the clearing"** first. Then the **doorway**: **"Step up to the Build Bench"** (the primary
    control — a half-built robot named Pip, a glowing blueprint, a brass GO key). Then ambient "look" entries:
    *"A wood-stove glows warm"; "A solder bench with a string of lights"; "A logic contraption of ramps and a
    bell"; "A shelf of little finished robots"; "A cat asleep on the sunny sill."*
  - Each `live` hotspot is keyboard-operable; the doorway announces the honest warm line; reduced-motion →
    instant framing, fire = static glow, motes off, doorway pulse = static glow.
  - **Parity by construction:** the `{hotspotId, label, role, primary}` set operable via `ActivityDOM`
    **equals** the `window.__qa.interactives()` set (SC-CORE-11). No 3D-only or DOM-only affordance.

### 8.5 `window.__qa` (dead-primary-action proof)

```ts
window.__qa = {
  ready, error, settle(frames = 2),
  scene,                                   // r3f state.scene (the room)
  primaryActionAlive: () => boolean,       // build-bench "step up" toggles peeked / opens content later
  interactives: () => [
    { id: "build-bench", kind: "doorway", worldPos: [0, 1.15, 0.3] }, // the ONE primary
    { id: "wood-stove",  kind: "ambient", worldPos: [4.6, 1.0, -3.6] },
    { id: "solder-bench",kind: "ambient", worldPos: [-3.6, 1.1, -0.4] },
    { id: "marble-run",  kind: "ambient", worldPos: [-1.4, 1.7, -2.2] },
    { id: "pip",         kind: "ambient", worldPos: [0.7, 1.05, 0.3] },
    { id: "shelf",       kind: "target",  worldPos: [5.4, 1.8, -2.4] },
    { id: "window-sill", kind: "ambient", worldPos: [-4.4, 1.6, -3.8] },
  ],
  stateHash,          // {bench-peeked, pip-wound, chain-lit, marble-running, stove-stoked, shelf-count}
  getEmittedSignals,  // firewall: MUST record 0 new events from any §7.3 delight
};
```

**Gate round-trips (hard-fail if dead):** project `build-bench` → dispatch a real pointer event → assert
`stateHash()` changed (peeked). **Firewall (negative):** fire every §7.3 delight → assert
`getEmittedSignals()` records **zero** new `ActivityEvent`s.

---

## 9. Hard floors + cost ceilings

Two-sided (LAAS): a **content floor** (can't feel empty) and a **cost ceiling** (Chromebook-safe).
Under-dressing to hit the ceiling is itself a fail — **instance instead**.

| Budget | This room (`room-3d`) |
|---|---|
| **Draw calls / frame** | **≤ 50** (hard 80) — merged shell + instanced props + one atlas → **≈32** (§8.2) |
| **Distinct dressing occupants** | **≥ 40** — this set ships **46** across **10** surface classes (§3); none bare |
| **Occupied surface classes** | **≥ 6** — ship **10** (shell · window · stove · Build Bench · solder bench · pegboard/chalkboard · Shelf/manuals · marble-run · plants · floor); each carries ≥3 objects |
| **Material bands / hero surface** | **≥ 3** (base + wear/AO + highlight/emissive) — §5 |
| **Warm sources** | **≥ 2** (window key + stove) + emissive practicals (magnifier, bulbs, terminal, hologram) |
| **Cool fill** | dusk-blue hemisphere (no dead shadow) |
| **Shadow-casters** | **≤ 1** (frozen) |
| **No-dead-shadow law** | **0** desaturated-gray shadow samples (Pillar B) |
| **No-cold-blue-screen law** | **0** cold-blue-lit hero/doorway samples; screens/hologram read sage+amber (§6.4) |
| **Always-on motions** | **≥ 3** — ship **6** (fire · motes · display gear · Pip twitch · plant sway · cat breath) + the breath |
| **Signature micro-interactions** | **≥ 1** beyond the doorway — ship **4** (§7.3), all signal-free |
| **Doorway object** | exactly **1**, sage+amber, provably live (`stateHash` changes), host-ready honest placeholder |
| **Firewall** | **0** `ActivityEvent`s from any §7.3 delight (QA negative assertion) |
| **Post passes** | 2–3 (Bloom + Vignette + ACES) |
| **Textures** | props 256–512²; hero ≤1024²; KTX2; one shared atlas |
| **dpr / loop** | `dpr ≤ 1.5`; `frameloop="demand"` (idle ≈ 0 GPU) |
| **Frame rate** | 60 target / **≥ 30 sustained** on a real Chromebook under 10-min load |

---

## 10. Banned outcomes — instant fail

Any one fails the room (art bible §11 + zone-code-v2 §A9 + aliveness §12 + the operator brief):

- **Sterile lab, not workshop:** a clean/empty/cold room; bare log walls; a bench on a bare floor; a server
  room; anything that reads as "a computer lab" instead of *a warm maker's cabin*. (The whole operator ask.)
- **Cold-blue screens / cold light:** the terminal, hologram, or any hero surface glowing **cold blue**; a
  blue-lit "hacker" room; bloom doing a cold job. Warm/amber/sage only; the cool split is *light*, not screens
  (§6.4).
- **Dead lighting:** gray or black shadows; flat ambient-only; **no fire and no window shaft**; blown/muddy
  exposure.
- **Two competing focal points / no obvious doorway:** the terminal fighting the bench (they must be **one**,
  §4.1); a room where the one warm verb isn't obvious in ≤1s.
- **Dead or dishonest doorway:** a "coming soon" wall that changes nothing (`stateHash` static → SC-CORE-14
  fail); a placeholder that **fakes** a lesson/quiz behind the bench.
- **Firewall breach:** any §7.3 delight (wind up Pip, the light-chain, the marble-run, stoking the stove) that
  **emits a signal** or is **counted / rewarded / badged / streaked**; a "bots built: 3" meter.
- **Plastic, not satin:** glossy plastic-shine on wood/wool/ceramic/leather/brass; `MeshBasicMaterial`;
  fullbright; untinted default-gray `MeshStandardMaterial`.
- **Incoherence / asset-soup:** mixed CC0 kits at different scales/palettes, untinted; **cloned props** (one
  mesh varied only by rotation/scale); grid-perfect placement; visible texture tiling.
- **Arcade juice:** screenshake, confetti, big pops, saturated flashes on any micro-interaction (cozy only).
- **Camera crimes:** free-fly / unclamped orbit / zoom / WASD; remounting the `<Canvas>` per room.
- **Chromebook slideshow:** >50 draw calls, `dpr>1.5`, per-frame shadows, fog to hide the far clip, sustained
  <30 fps.
- **Accessibility crimes:** an `aria-hidden` canvas as the only surface; the `ActivityDOM` peer as a lesser
  flat menu; color-only state; essential motion under reduced-motion; a broken (not calm) reduced-motion still.

---

## 11. Self-score rubric — anchored to RF-INT-CODE

Per row: **10** = passes a one-second glance beside RF-INT-CODE (A Short Hike interior / Ghibli workshop /
Stardew) at 1080p on a Chromebook; **7** = clearly synthetic but the same class; **4** = decent hobby demo;
**2** = a pile of default-material CC0 assets. **Score every phase; for each row write "what raises this +2";
implement the two cheapest before proceeding** (the LAAS loop). Delta loop: render the closest shot to
RF-INT-CODE / RF-INT-CODE-2 → side-by-side → `DELTA.md` top-10 ranked → fix top-3 → re-render → close phase.

Rows:

- **Workshop warmth & coziness** (do I want to be in this room? — not a lab)
- **CODE legibility** (is it nameable as an inventor's/tinker's workshop in ≤1s?)
- **Firelight & light transport** (warm key + stove + cool dusk fill; **no dead shadow**)
- **No-cold-blue discipline** (screens/hologram warm; the split is light, not screens)
- **Dressing density & lived-in feel** (≥40 occupants, ≥6 surface classes, someone-just-left)
- **Material quality** (aged wood/brass/leather/knit/parchment; **satin, not plastic**; ≥3 bands)
- **Palette / color-script discipline** (everything on the §3.1 CABIN scale; warm/cool split holds)
- **Doorway-object obviousness** (the one warm-glowing Build Bench, provably live, honest placeholder)
- **Ambient motion & life** (fire, motes, gear, Pip, plant — one second from motion)
- **Micro-interaction satisfaction** (wind up Pip / marble-run / light-chain feel *good*, cozy not arcade)
- **Signal-free integrity** (the firewall holds — 0 signals from delights)
- **Map↔cabin continuity** (same sage hue + same fire carried across the entry cut)
- **Accessibility parity** (the `ActivityDOM` peer is a true equal)
- **Chromebook perf** (`<50` draw calls, `dpr≤1.5`, frozen shadows, ≥30 fps sustained)

---

## 12. Build / integration notes (how the set lands)

- **Owned by** `passion/packages/interest-zone-code/` (deferred content package; the room shell lands with
  Lane G / the world build). The single shared-root touch is the zone registry line.
- **Consumes as its art contract (no contract breaks):** the warm `SCENE3D` pack + `CAMERA3D` (verbatim) +
  `HUE_RAMP[1] #5FB98C` + the additive `CABIN` palette + `MOTION`/`resolveMotion` + the `RoomHotspot` helper
  (gameflow §11) + the aliveness `AMBIENCE`/`MicroInteraction` schema. This doc adds **values + placements +
  4 new `MotionKind`s**, nothing structural.
- **The seam:** `build-bench` is the host-ready doorway now (toggles `peeked`); when content lands it swaps
  its handler to `openBench()` → `<ContentHost>` (zone-code-v2 Part B) with **no layout/flow change**.
- **Phase order (mirrors zone-code-v2 §D3 P5–P7):** shell + lighting + palette + HDRI + frozen shadows
  (RF-INT-CODE) → dress to the floor (≥40 occupants) + the 4 micro-interactions + ≥3 motions → the Build
  Bench doorway + `ActivityDOM` peer + the entry transition. Each phase closes with the reference-delta loop +
  self-score + the firewall negative assertion.

### Acceptance — the one-frame test (this room's slice of the world two-frame test)

Render **RF-INT-CODE ("The Sunlit Workshop")** and place it beside the reference. If a viewer's eye snags
within one second on a **category error** — a sterile/cold lab, cold-blue screens, dead/gray shadows,
default-material gray, plastic shine, an incoherent kit-pile, no obvious Build Bench, no fire, or a moody
palette — **the task is not done. Iterate the delta loop.** Then the operator free-explores on `localhost`
for the final human sign-off (and, ideally, an 8-year-old winds up Pip *just because*).
