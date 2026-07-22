# Interest Lab — Cabin Interior Set: **The Sounding Cabin** (Music, `sound_music`)

**Date:** 2026-07-21 · **Owner:** David · **Scope:** the *concrete, buildable* 3D **interior set** of the
Music cabin — **"The Sounding Cabin"** — in Emberwood: the full prop inventory, the spatial layout around
the fixed camera, the per-material + lighting recipe, the signal-free ambient life + micro-interactions, the
CC0 sourcing + `<50`-draw-call budget, and the LAAS scaffolding (named hero frame, hard floors, banned
outcomes, self-score). This is the **set-dressing + environment-art layer** for one room: it turns the art
bible's one-line hero frame and the zone-music v2 contents list into a fully itemized, coder-buildable
**cozy log cabin that is unmistakably a place where music is made.**

**Reads first / builds on (does NOT contradict — if anything here fights them, they win):**
- [`2026-07-21-world-art-direction-cozy-cabin.md`](./2026-07-21-world-art-direction-cozy-cabin.md) — the
  Emberwood palette (`CABIN` tokens §3), materials (§4), lighting recipe (§5), the shared cozy-cabin kit
  (§8.1), and the music cabin's hero frame (§7.2 "Firelight in the Sounding Cabin"). **This doc deepens
  that hero frame to maximum buildable depth.**
- [`2026-07-21-zone-music-design-v2.md`](./2026-07-21-zone-music-design-v2.md) — the zone's contents
  inventory (§A.5), color script (§A.6), the live-taste + doorway architecture (§A.7–A.8, §C.1), and the
  Shelf bridge (§B.5). **This doc reconciles v2's abstract "pad wall" into real studio gear** (§2.5).
- [`2026-07-21-world-gameflow-movement.md`](./2026-07-21-world-gameflow-movement.md) — the fixed
  `CAMERA3D`, the **`RoomHotspot`** model (`hero → doorway → ambient`, §4.2), and the **host-ready warm
  placeholder** doorway rule for content-deferred v1 (§4.3).
- [`2026-07-21-world-aliveness-and-juice.md`](./2026-07-21-world-aliveness-and-juice.md) — the **breath
  clock** (§5.1), the **cozy-juice grammar** (§4.1), and **the firewall: juice is never signal** (§1.2).
- [`../../research/stylizedWorldAssetPipeline.md`](../../research/stylizedWorldAssetPipeline.md) — the CC0
  backbone (Kenney/Quaternius/KayKit/Poly Pizza), one HDRI, frozen shadows, instancing, `<50` draw calls,
  `dpr≤1.5`, `frameloop="demand"`.

**Grounds its tokens in the shipped source:** `passion/packages/interest-lab-view/src/scene.ts`
(`SCENE3D`, `CAMERA3D`, `QUALITY_TIERS`, `RENDER_TIERS`), `.../src/art.ts` (`PALETTE`, `HUE_RAMP`; the
additive `CABIN` palette from the art bible §3.4), `.../src/motion.ts` (`MOTION`, `EASINGS`; the additive
`WORLD_MOTION` from gameflow §6 and the aliveness micro-motion kinds §4.4).

**Guardrails (non-negotiable):**
[`../../research/passionBrainlift.md`](../../research/passionBrainlift.md) — never label the child, never
gamify the return signal; **every delight in this room emits zero `ActivityEvent`s** (the firewall).

**Depth model = LAAS**
([`PROJECT_LAAS_v2.md`](https://github.com/Braffolk/fable5-world-demo/blob/main/PROJECT_LAAS_v2.md)): a
named reference frame, a full itemized contents list, two-sided hard floors, an explicit banned-outcomes
list, a reference-anchored self-score, and a mandatory reference-delta loop — **judged against images
(Ghibli desk · the lo-fi room · a warm vintage listening room), not against "pretty good for a browser."**

---

## 0. TL;DR — what this doc decides

1. **One room, three warm stations, one obvious door.** The Sounding Cabin is a beamed golden-hour log
   room fused with a musician's world: a **hero wooden upright piano** (left), a **hi-fi listening corner**
   (back-right: vintage speakers, tube amp, receiver, turntable + gramophone horn, vinyl), and a
   **production nook** (center-right: MIDI keys, studio monitors, a **softly-glowing screen**), all around
   a warm rug, under **hung instruments** on the back wall, warmed by a **wood-stove** and a **golden
   window shaft**. ([§2](#2-the-composed-shot--spatial-layout), [§3](#3-full-prop-inventory))
2. **The doorway object = the production nook's glowing console screen** ("open the studio"). It is the
   single brightest, terracotta-pulsing, host-ready warm placeholder — the one obvious "go deeper" portal
   that swaps to the Content App later with **zero flow change**. The **piano is the hero live-taste**; the
   **gramophone is a live ambient delight** — neither is the door (legibility: one door only).
   ([§2.6](#26-the-doorway-object-the-decision), [§6](#6-the-doorway-object--hotspot-model--liveness))
3. **The piano is warm satin wood, never black-lacquer plastic.** A honey/walnut **upright** with brass
   fittings and a fretwork music desk — a deliberate art-direction call so the hero reads *cozy cabin*, not
   *concert hall*. Black-gloss plastic shine is a banned outcome. ([§4.1](#41-materials-per-surface-class),
   [§9](#9-banned-outcomes--instant-fail))
4. **≥ 42 dressed objects across 8 surface classes**, none bare, someone-just-left-the-room — comfortably
   over the art bible's ≥30 / ≥5 floor. ([§3](#3-full-prop-inventory), [§8](#8-hard-floors--cost-ceilings))
5. **Alive and signal-free.** The stove flickers on the breath clock, motes drift in the shaft, the
   turntable turns, a cat sleeps on the piano stool; **tap the piano → a warm chord**, **nudge the
   turntable → it spins + crackles**, **stoke the stove → every window pulses** — and **none of it emits a
   signal** (the firewall). ([§5](#5-ambient-life--micro-interactions))
6. **`< 50` draw calls on a Chromebook**, degrading `room-3d → room-3d-lite → board-2d` (the `ActivityDOM`
   described-room peer). ([§7](#7-cc0-sourcing--the-50-draw-call-budget--degradation))
7. **Named hero frame: "Firelight in the Sounding Cabin"** ([§1.2](#12-the-hero-reference-frame)), with
   hard floors ([§8](#8-hard-floors--cost-ceilings)), banned outcomes ([§9](#9-banned-outcomes--instant-fail)),
   and a self-score ([§10](#10-self-score-rubric--anchored-to-the-references)).

---

## 1. Reference frames — name the bar

### 1.1 The reference set (author one still from each; they anchor the delta loop)

Commit these to `passion/packages/interest-zone-music/reference/` in phase 0. Every visual phase is judged
**side-by-side** against them at a one-second glance on a Chromebook.

| Ref | What we steal (for *this room*) |
|---|---|
| **Studio-Ghibli desk/attic interiors** (*Whisper of the Heart* writing desk; *Kiki*'s attic) | painterly warm **window shaft with dust motes**; lived-in creative clutter; "a place you want to sit and make something" |
| **The "lo-fi beats to study to" room** | the exact **mood we're selling**: dusk window, gooseneck lamp, vinyl, plants, a warm screen glow, a cat — cozy productivity |
| **A cozy vintage hi-fi listening room** (mid-century wood speakers, a tube amp glowing, a turntable, an armchair) | the **hi-fi corner** bar: warm wood cabinets, cloth grilles, **glowing valves**, brass, a rug, an inviting chair |
| **Unpacking** | the **"a musician lives here"** bar — objects that tell a whole life; nothing is bare, nothing is noise |
| **A Short Hike (interiors) / Alba** | low-poly **cohesion + warmth**; friendly rounded forms; palette-matched fog; the Chromebook-honest bar |
| **Firewatch (dusk window)** | the warm/cool **dusk split** — warm firelit wood against cool blue-violet shade through the glass |

**Mood, one line:** *the golden twenty minutes after sunset when you finally sit down to play.* Cozy, safe,
a little magic — **never** the moody, cold, pro-studio / control-room references (a banned outcome, §9).

### 1.2 The hero reference frame — **"Firelight in the Sounding Cabin"**

> Author this as the room's single hero still; every render is deltaed against it.

**The shot.** Fixed camera (`CAMERA3D`: `fov 42`, from `[0, 4.5, 15]` toward `[0, 0.4, 0]`), framing the
warm room head-on and slightly above, through the "fourth wall."

- **Foreground — the dark frame (repoussoir, `wood.cocoa #4A3320`):** the near edge of the production desk
  and a low amp-crate just out of the key light — **over-ear headphones** resting on their side, a
  **coffee-ringed mug**, a **coiled cable**, two **sticky notes** (one with a scribbled smiley), a small
  **succulent** in a chipped pot, a **brass metronome** mid-tick. The near-black warm edge frames the shot.
- **Midground-left — the hero:** a **warm-wood upright piano** angled ~30° toward camera, its honey lid
  catching the **golden window shaft**; **sheet music** open on a fretwork desk; a **knit-cushioned stool**
  pulled out; **Biscuit the cat asleep** on the stool's edge; a **brass candle-sconce** on the fascia. A
  soft amber key-glow waits to ripple when a key is tapped.
- **Midground-center-right — the doorway:** the **production nook** — a low timber desk with a **MIDI
  keyboard**, two **studio monitors** on stands, a **gooseneck lamp** pooling the warm key, a **pop-filter
  mic** on a boom, and the **softly-glowing screen** (terracotta `hue.music #E8825A`) breathing at rest —
  *the one obvious thing to do.*
- **Background-right — the listening corner:** a low wood **credenza** with a **vintage receiver** (a
  softly-lit dial, VU needles adrift), a **tube amplifier** with **glowing valves**, flanked by two
  **wood-cabinet speakers** with cloth grilles; a **turntable** with a **brass gramophone horn** slowly
  spinning a record; a **crate of vinyl**; a **worn leather armchair** and a **floor lamp**.
- **Background — the luminous depth:** **exposed log beams** overhead strung with **string-lights**; a
  **window** at center-left onto a **dusk forest** in a teal→amber gradient, the **golden shaft** raking
  down-right with **dust motes** adrift; the **wood-stove** glowing amber in the far-left corner with a
  **kettle** and split logs; the back wall hung with an **acoustic guitar, a fiddle, and a frame drum**,
  and a **plank shelf of vinyl + cassettes** (the Shelf).
- **Palette (the color script):** amber/honey **key** (`fire.flame #FFB25A` / `light.window #FFC08A`, keyed
  to the map hue `hue.music #E8825A`); **cool dusk-blue fill** so every shadow reads blue-violet
  (`dusk.skylight #A9C2E8`), never gray; warm near-white **screen/valve accent** (`light.candle #FFE0A8`);
  deep cocoa **frame**. Restrained saturation everywhere **except** the glow.
- **Motion at rest (§5):** the stove flickers on the **breath clock**; **dust motes** drift in the shaft;
  the **turntable turns**; the **hanging plant** sways on `<Float>`; the screen and windows breathe ≤3%; a
  page-corner of the sheet music lifts in a draft; the cat's flank rises and falls. *A frozen frame is one
  second from motion.* All instant-off under reduced-motion.

*(Refs: Ghibli desk × the lo-fi room × a warm vintage listening room × A Short Hike interior. Deepens art
bible §7.2 and zone-music v2 §A.1 into the full cabin.)*

---

## 2. The composed shot + spatial layout

### 2.1 Coordinate convention (so every placement is unambiguous)

Room-space matches the shipped `CAMERA3D` (camera at `[0, 4.5, 15]` looking down `-z` at `[0, 0.4, 0]`):

- **`+x` = screen-right, `−x` = screen-left. `−z` = back wall (away), `+z` = toward the camera. `+y` = up.**
- **Room box:** `x ∈ [−4.5, +4.5]` (≈ 9 m wide), `z ∈ [−3.4, +7.0]` (≈ 10 m deep, camera outside the
  fourth wall), `y ∈ [0, 3.3]` (floor at `y=0`; beamed ceiling ≈ 3.0–3.3 m). Fog `near 14 / far 46`
  (`SCENE3D`) carries the golden haze; the room reads through it.
- The camera's low target (`y 0.4`) centers the composition on **keyboard/desk height** — so the piano
  keybed, the MIDI keys, and the glowing screen (≈ `y 1.0–1.3`) land near the optical center.

### 2.2 Floor plan (top-down; camera is below, looking "up" the page toward the back wall)

```
   ┌──────────────────────── BACK WALL  z ≈ −3.2 ────────────────────────┐
   │  log wall + plaster chinking ·· EXPOSED BEAMS above ·· string-lights │
   │                                                                       │
   │ [WOOD-STOVE]        [WINDOW + golden shaft]     [HUNG INSTRUMENTS]    │
   │  x≈−3.9 z≈−2.8       x≈−1.5 z≈−3.2 (motes)      guitar·fiddle·drum    │
   │  kettle, logs,        dusk-forest card          x≈+0.5..+2.6 y≈1.8+   │
   │  blanket, glow                                                        │
   │                                              [HI-FI CREDENZA corner]  │
   │   [PIANO — HERO]                              x≈+3.2 z≈−2.4           │
   │    upright, x≈−3.0 z≈−0.6, angled ~30°→cam    speakers L/R · tube amp │
   │    stool+cat · sheet music · metronome        · receiver · turntable  │
   │        \                                       + gramophone horn      │
   │         \                                      · vinyl crate          │
   │          \        [ RUG  x≈0 z≈+0.6 ]         · leather armchair      │
   │           \                                    · floor lamp           │
   │            \        [PRODUCTION DESK — DOORWAY]                        │
   │             \        x≈+1.1 z≈+1.6, facing cam                        │
   │              \        MIDI keys · 2 monitors · GLOWING SCREEN (door)  │
   │               \       gooseneck lamp · pop-filter mic · cables · mug  │
   │                                                                       │
   │  ~~~~~~~~ FOREGROUND FRAME (dark near edge, wood.cocoa) z ≈ +4.0..+6 ~│
   │  low amp-crate + desk edge: headphones · mug · coiled cable ·         │
   │  sticky notes · succulent · metronome  → the repoussoir              │
   └───────────────────────────────────────────────────────────────────────┘
                     ▲  CAMERA  [0, 4.5, 15] → target [0, 0.4, 0]
```

### 2.3 The three warm stations + the base (camera-relative zones)

| Zone | Where | Role | Reads as |
|---|---|---|---|
| **The hearth corner** | far back-left (`x≈−3.9`) | warm anchor #2 (comfort) | "the fire is lit; someone's home" |
| **The window + shaft** | back center-left (`x≈−1.5`) | the soul of the room (depth + motes) | "golden hour, last light" |
| **The piano (HERO)** | left third (`x≈−3.0`) | the live taste (tap → chord) | "a real instrument, come play" |
| **The production nook (DOORWAY)** | center-right (`x≈+1.1`) | the one thing to do | "open the studio" (the portal) |
| **The hi-fi listening corner** | back-right (`x≈+3.2`) | vintage soul + a live delight | "sit and listen; the record's on" |
| **The instrument wall + Shelf** | back wall, center-right | craft density + legibility | "this is unmistakably music" |
| **The rug + seats + floor** | center | grounds + human presence | "pull up a stool" |
| **The foreground frame** | near edge (`z≈+4.5`) | repoussoir (value structure) | the dark cozy border |

### 2.4 The focal path (legibility — one door, no competing foci)

The eye must travel one composed route in ≤1 second (art bible Pillar D):

1. **Enter** on the dark **foreground desk edge** (headphones, mug) — the frame.
2. **Land** on the **glowing screen** (brightest, terracotta pulse) — *the doorway, the one verb.*
3. **Pull left** to the **piano** catching the window shaft — *the hero, "come play."*
4. **Drift right** to the **glowing tube amp + spinning gramophone** — *the warm listening corner.*
5. **Lift** to the **hung instruments + beams + string-lights**, then **out the window** (luminous depth)
   and to the **stove glow** (the warm rest).

**Value/bloom hierarchy (enforced, so there is exactly one door):** the **screen** is the brightest,
domain-hued, *pulsing* emissive; the **stove** is the warm anchor (steady amber); the **tube-amp valves +
receiver dial + string-lights + lanterns** are dim warm practicals; the **piano key-glow** appears *only on
touch*. Two warm foci — the stove (comfort) and the screen (the one thing to do) — never two doors.

### 2.5 Reconciling zone-music v2's "pad wall" (an explicit decision)

Zone-music v2 (§A.1/§A.5) framed the hero as an abstract **pad wall** (an `InstancedMesh` grid of
emissive pads) and the doorway as the **console screen**. The operator's direction for this room asks for a
real **piano, hi-fi corner, production nook, and instruments** — a legibly *musical* space. We reconcile,
not discard:

- The **pad grid is realized on the glass**, not on the wall: the production nook's **screen** shows the
  breathing 8×3 pad-grid / waveform UI (a DOM/CSS or emissive-quad overlay, per v2's "playhead-as-DOM-
  overlay" pattern), and the **MIDI keyboard + the piano keys** are the physical "tap to play." This is
  *more* legibly music-production than a floating wall of pads and it swaps cleanly to the Content App's
  real pad grid later (no flow change).
- Everything v2 §A.5 listed is still here (console, screen, desk life, walls, Shelf, floor, window,
  listeners-optional) — **enriched** with the operator's piano + hi-fi + instrument set. Nothing is lost;
  the abstract grid becomes concrete gear.

### 2.6 The doorway object — the decision

> **The doorway object = the production nook's softly-glowing console screen/monitor** ("open the studio").

Chosen over the art bible's alternative ("console screen **or** lit brass gramophone horn", §7.2/§8.2) and
the gameflow placeholder note (§4.3) for four reasons: (1) it is the **canonical** zone-music v2 portal
into the Content App (§A.8, §C.1), so it swaps placeholder→content with **zero movement/flow change**;
(2) it is the operator's own named "softly-glowing screen"; (3) a screen is unambiguously *"the one thing
that opens more"* — a horn reads as an instrument to play, muddying "play vs. go deeper"; (4) it keeps the
**gramophone horn free to be a live ambient delight** (nudge → spin + crackle, §5.3) so it is neither a
dead prop nor a second door. **The piano is the `hero`, the screen is the `doorway`, the gramophone is
`ambient`+live** — a clean three-way split (§6). Mechanics, liveness, and the host-ready placeholder copy
are in [§6](#6-the-doorway-object--hotspot-model--liveness).

---

## 3. Full prop inventory

The complete itemized contents (the LAAS "obsess over what the scene contains" mandate). Grouped by
**surface class** (art bible Pillar C). Every prop lists **rough scale (m)**, **placement (room coords)**,
**tint target** (`CABIN`/`PALETTE` token), and **CC0 source** (§7). Emissive props are marked ✦.
**Count: 8 surface classes, ≥ 42 distinct objects** (floor: ≥30 / ≥5 — comfortably cleared, §8).

### 3.1 Class A — Structure (beams, walls, window, floor, ceiling)

| # | Prop | Scale (m) | Placement | Tint | Source |
|---|---|---|---|---|---|
| A1 | **Log/plank walls + plaster chinking** | room shell | perimeter | `wood.oak`→`wood.walnut`; chinking `plaster.cream` | KayKit/Kenney shell |
| A2 | **Exposed ceiling beams** (4–5) | 0.2×0.2×9 | overhead, `y≈2.9` | `wood.walnut` | KayKit timber |
| A3 | **Plank floor** | 9×10 | `y=0` | `wood.oak`; foreground boards → `wood.cocoa` | KayKit/Kenney |
| A4 | **Window** (mullioned) + dusk-forest backdrop card | 1.6×1.4 | back wall `x≈−1.5 y≈1.5 z≈−3.2` | frame `wood.driftwood`; glass = dusk card | Kenney + baked card |
| A5 | **The golden shaft** (soft god-ray plane / `<Sparkles>` cone) ✦ | 1.5×3 volume | from A4 raking down-right | `light.window #FFC08A` | authored quad + fog |
| A6 | **Door** ("← back to the clearing") | 0.9×2.1 | right wall `x≈+4.3 z≈+1` | `wood.walnut`; iron hinges `brass` | KayKit door |

### 3.2 Class B — The hearth (warm key #2)

| # | Prop | Scale (m) | Placement | Tint | Source |
|---|---|---|---|---|---|
| B1 | **Cast-iron wood-stove** (potbelly) ✦ | 0.6×1.0×0.6 | far back-left corner `x≈−3.9 z≈−2.8` | body `wood.cocoa`/iron; firebox `fire.ember→fire.flame` emissive + 1 point-light | Kenney Survival/KayKit |
| B2 | **Stove-pipe** to ceiling | 0.15Ø×2.2 | above B1 | iron dark + `patina.verdigris` | primitive |
| B3 | **Copper kettle** ✦(steam) | 0.22 | on B1 top | `brass`+`patina.verdigris` | Kenney/Quaternius prop |
| B4 | **Stacked split logs** (instanced) | 0.4 pile | beside B1 | `wood.honey`/`wood.driftwood` | Kenney, `InstancedMesh` |
| B5 | **Folded knit blanket** | 0.5×0.35 | on a low log stool by B1 | `wool.warm` (jitter) | Kenney/cloth |
| B6 | **Iron poker + ash bucket** | 0.6 | leaning at B1 | iron `brass`/dark | Poly Pizza (verify CC0) |

### 3.3 Class C — The piano (the HERO station)

| # | Prop | Scale (m) | Placement | Tint | Source |
|---|---|---|---|---|---|
| C1 | **Upright piano body** | 1.5w×0.6d×1.25h | `x≈−3.0 z≈−0.6`, yaw ~+30°→cam | **warm satin** `wood.honey`→`wood.walnut` (NOT black gloss — §4.1) | assembled (§7) |
| C2 | **Keybed** — 1 `InstancedMesh` of white + black keys | key ≈0.022w | front fascia of C1, `y≈0.95` | white `light.candle`; black `wood.cocoa` | instanced keys |
| C3 | **Key-glow strip** ✦ (on tap) | keybed-length | over C2 | `fire.spark #FF9E5E` pulse on touch | emissive quad |
| C4 | **Fretwork music desk + open sheet music** | 0.6×0.45 | atop C1, `y≈1.15` | desk `wood.walnut`; pages `paper.parchment` | Kenney + paper card |
| C5 | **Brass candle-sconces** (2) ✦ | 0.15 | C1 fascia | `brass`; flame `light.candle` | Poly Pizza (verify) |
| C6 | **Brass pedals** (2–3) | 0.1 | C1 base | `brass` | primitive |
| C7 | **Piano stool** (knit cushion), pulled out | 0.4×0.5 | `x≈−2.6 z≈+0.2` | wood `wood.oak`; cushion `wool.warm` | Kenney furniture |
| C8 | **Brass metronome** (ticking) | 0.1×0.2 | on C1 top | body `wood.honey`; pendulum `brass` | Poly Pizza (verify) |
| C9 | **Framed music-score print / a child's drawing** | 0.3×0.4 | on the wall above C1 | frame `wood.walnut`; `paper.parchment` | atlas card |

### 3.4 Class D — The production nook (the DOORWAY station)

| # | Prop | Scale (m) | Placement | Tint | Source |
|---|---|---|---|---|---|
| D1 | **Low timber desk** | 1.4w×0.6d×0.72h | `x≈+1.1 z≈+1.6`, facing cam | `wood.oak`; near-edge `wood.cocoa` (frame) | Kenney furniture |
| D2 | **The console screen / monitor (THE DOORWAY)** ✦ | 0.5×0.32 | on D1, `y≈1.15 z≈+1.2` (near focal center) | bezel `wood.walnut`; glass = **`hue.music #E8825A`** emissive, `markerEmissiveRest 0.35`→`Pulse 0.5` | emissive quad + DOM overlay |
| D3 | **MIDI keyboard** (2-octave) — keys instanced | 0.5×0.18 | on D1 front | body `wood.walnut`/dark; keys reuse C2 instancing | Kenney/Poly Pizza |
| D4 | **Studio monitors** (2, on stands or desk) ✦(soft LED) | 0.18×0.28 ea | flanking D2 | wood cabinet `wood.honey`; cone dark; LED `fire.spark` | assembled (box + cone) |
| D5 | **Gooseneck desk lamp** ✦ (the practical key) | 0.5 arm | left of D1 | arm `brass`; bulb `light.lantern` | Kenney |
| D6 | **Pop-filter on a mic boom** | 0.5 arm | over D1 | boom dark; filter mesh `plaster.cream` | Poly Pizza (verify) / assembled |
| D7 | **Over-ear headphones** (on a hook / on the desk) | 0.2 | D1 edge (foreground) | cups `leather.worn`; band `brass` | Kenney/Poly Pizza |
| D8 | **Coiled cable + a small patch-bay** | 0.3 | on D1 | cable dark; jacks `brass` | primitive/instanced |
| D9 | **Ceramic mug** (coffee-ring) + **2 sticky notes** | 0.09 / 0.06 | D1 (foreground) | mug `ceramic.warm`; notes `light.candle`/`fire.spark` | Kenney + card |
| D10 | **Small succulent** in a chipped pot | 0.15 | D1 corner | leaves `forest.pine`; pot `ceramic.warm` | Quaternius/Kenney |
| D11 | **Desk chair / low stool**, pulled out | 0.45×0.8 | `x≈+1.1 z≈+3.0` | wood `wood.oak`; seat `leather.worn` | Kenney |

### 3.5 Class E — The hi-fi listening corner (vintage soul)

| # | Prop | Scale (m) | Placement | Tint | Source |
|---|---|---|---|---|---|
| E1 | **Low wood credenza / hi-fi cabinet** | 1.6w×0.45d×0.6h | back-right `x≈+3.2 z≈−2.4` | `wood.honey`→`wood.oak` satin | Kenney furniture |
| E2 | **Vintage receiver** ✦ (lit dial, VU needles) | 0.45×0.15 | on E1 | brushed `brass`; dial `light.candle`; needles drift | assembled + emissive card |
| E3 | **Tube amplifier** ✦ (glowing valves) | 0.35×0.2 | on E1 | chassis `brass`/dark; **valves `fire.flame` emissive** | assembled (box + glow rods) |
| E4 | **Floor-standing speakers** (2, wood cabinets + cloth grilles) | 0.35×0.9 ea | flanking E1 `x≈+2.5 / +3.9` | cabinet `wood.walnut`; grille `wool.cream` cloth | assembled (box + grille) |
| E5 | **Turntable + record** (spinning) | 0.4×0.4 | on E1 | plinth `wood.honey`; platter dark; disc `wood.cocoa` w/ `light.candle` label | assembled |
| E6 | **Brass gramophone horn** ✦ (ambient live delight) | 0.5 bell | rising off E5/E1 | `brass`+`patina.verdigris` | Poly Pizza (verify) / cone |
| E7 | **Crate of vinyl records** (instanced sleeves) | 0.35 crate | on floor by E1 | sleeves jittered `wool.warm`/`terracotta`/`dusk.window` | `InstancedMesh` |
| E8 | **Worn leather armchair** | 0.8×0.9 | `x≈+3.4 z≈−1.2`, angled to E1 | `leather.worn` | Kenney/KayKit |
| E9 | **Floor lamp** ✦ | 1.5h | behind E8 | stand `brass`; shade `light.window` | Kenney |
| E10 | **Small potted trailing plant** on E1 | 0.3 | E1 top-corner | `forest.pine`/`moss` | Quaternius |

### 3.6 Class F — The instrument wall + the Shelf (craft density)

| # | Prop | Scale (m) | Placement | Tint | Source |
|---|---|---|---|---|---|
| F1 | **Acoustic guitar** on an iron wall hook | 1.0 | back wall `x≈+0.6 y≈1.9` | body `wood.honey`; soundhole `wood.cocoa`; strings `brass` | Poly Pizza/Quaternius (verify) |
| F2 | **Fiddle/violin + bow** on hooks | 0.6 | back wall `x≈+1.6 y≈2.0` | `wood.honey`→`wood.walnut` satin | Poly Pizza (verify) |
| F3 | **Frame drum / hand drums** (1–2) | 0.4Ø | back wall `x≈+2.5 y≈1.8` | rim `wood.oak`; skin `plaster.cream`; lashings `leather.worn` | Poly Pizza/assembled |
| F4 | **Acoustic-felt / cloth panel** | 0.8×1.2 | back wall behind desk | `terracotta`/`wool.warm` | textured quad |
| F5 | **Plank shelf: vinyl + cassettes (the Shelf)** — 1 `InstancedMesh` | 1.2 shelf | right wall `x≈+4.2 y≈1.6` | jittered sleeves; labels = saved-loop names | `InstancedMesh` (v2 §B.5) |
| F6 | **Cork board w/ pinned scraps + a wall clock** | 0.5×0.5 | above desk | cork `wood.driftwood`; scraps `paper.parchment` | Kenney + cards |
| F7 | **Small practice amp** (foreground crate) ✦(pilot LED) | 0.3×0.3 | foreground `z≈+4.2` | cabinet `wood.walnut`; grille `wool.cream`; LED `fire.spark` | assembled |

### 3.7 Class G — Floor, textiles, human-presence

| # | Prop | Scale (m) | Placement | Tint | Source |
|---|---|---|---|---|---|
| G1 | **Knit/woven rug** (per-instance tint) | 2.4×1.6 | center `x≈0 z≈+0.6` | `wool.warm` (jitter → sage/rust) | Kenney/cloth |
| G2 | **Biscuit the cat** (skinned, asleep/breathing) | 0.3 | on C7 stool (naps: hearthstone / E8 armchair) | amber fur `rust.leaf`/`wood.honey` | Quaternius/KayKit (1 skinned mesh) |
| G3 | **Gig-bag / instrument case** leaning | 1.0 | wall by F-wall `x≈−0.5 z≈−2.8` | `leather.worn` | Poly Pizza (verify) |
| G4 | **A book of songs left open** | 0.25 | on E8 armrest / rug | cover `leather.worn`; pages `paper.parchment` | Kenney + card |
| G5 | **A pair of worn slippers / a dropped pick tin** | 0.15 | on the rug | jittered warm | Poly Pizza (verify) |

### 3.8 Class H — Overhead + air (light + life)

| # | Prop | Scale (m) | Placement | Tint | Source |
|---|---|---|---|---|---|
| H1 | **String-lights** — 1 `InstancedMesh` of bulbs ✦ | span beams | across A2, front edge | bulbs `light.lantern` emissive | `InstancedMesh` |
| H2 | **Hanging plant** on `<Float>` | 0.4 | `x≈−1.0 y≈2.5 z≈−1` | `forest.pine`; trailing vine `moss` | Quaternius |
| H3 | **Wall lantern by the door** ✦ | 0.25 | by A6 `x≈+4.2 y≈1.8` | `brass`; flame `light.lantern` | Kenney/KayKit |
| H4 | **Dust motes** in the shaft ✦ | — | in A5 volume | `light.window`; `<Sparkles>` sparse | `<Sparkles>` |
| H5 | **Drifting ♪ note-glyphs** (rare, near the piano/horn) | — | above C1/E6 | `hue.music` | sprite/`<Sparkles>` |

> **Per-instance variation law (Pillar C):** every repeated prop (keys, bulbs, vinyl sleeves, split logs,
> books, jars) gets hue/value/scale/rotation jitter; a fraction show extra wear (a dropped stitch, a
> chipped mug, a curled page). **A grid of identical props is a fail** (§9).

---

## 4. Materials + lighting

### 4.1 Materials (per surface class)

One shading model across the room (art bible §4): **flat PBR** (`MeshStandardMaterial`, low metalness,
baked AO on a shared atlas) — **no `MeshBasicMaterial`, ever**. The look is **satin, never plastic**: no
roughness below ~0.35 except the single brightest brass glint under the lamp. Every hero surface shows ≥3
detail bands (macro silhouette → meso 2–20 cm → micro normal/rough).

| Material | Macro | Meso | Micro | Tint target |
|---|---|---|---|---|
| **Aged wood** (piano, desk, credenza, speakers, beams, floor) | chunky beams, round lids, plank seams | visible planks, tool-chamfered edges, a knot | grain, matte with a **waxed sheen on handled edges** (keybed lip, lid, armrest) | `wood.honey`→`wood.walnut`; foreground `wood.cocoa` |
| **Brass / vintage metal** (horn, sconces, pedals, knobs, mic boom, lamp) | turned/hammered forms | dents, solder seams, engraving | satin anisotropic sheen + **verdigris in crevices** | `brass` + `patina.verdigris` |
| **Cloth (grilles, felt, blanket, rug, cushions)** | soft sag, rounded folds | chunky knit ribs / speaker-grille weave, fringe | fuzzy diffuse, **zero specular**, soft rim | `wool.warm`/`wool.cream`/`terracotta` (jitter) |
| **Worn leather** (armchair, headphones, cases, book covers) | slouch, creased fold | scuffs, stitch lines, buckle wear | low broad specular, edge patina | `leather.worn` |
| **Paper / parchment** (sheet music, sticky notes, scraps) | corner curl | fold creases, torn edge, pin-holes | soft fiber, faint edge translucency | `paper.parchment`/`light.candle` |
| **Warm ceramic** (mug, pots) | thrown/rounded, a chip | glaze pooling, a ring stain | satin glaze highlight (soft, wide) | `ceramic.warm` |
| **Stone/iron** (stove, pipe, poker) | irregular body | soot near the fire, casting seams | matte with a damp sheen low, **soot toward `wood.cocoa`** | iron dark + `patina.verdigris` |
| **Foliage** (plants, vine) | rounded low-poly clumps | leaf clusters, a trailing vine | soft **backlit translucency** | `forest.pine`/`moss` |

> **The hero material call — the piano is warm wood, not black lacquer.** A glossy black concert grand
> would read cold, corporate, and *plastic* under this palette (and a black-gloss highlight is the exact
> "plastic, not satin" banned outcome, §9). The Sounding Cabin's piano is a **honey/walnut satin upright**
> with brass fittings, a fretwork music desk, and a waxed sheen only on the handled lid and keybed lip — a
> cottage-parlour instrument, not a stage piano. This is a deliberate art-direction decision; hold it.

### 4.2 Lighting recipe (one authored setup)

Three warm sources, one cool fill, frozen shadows, one bloom job (art bible §5; `SCENE3D`).

1. **One self-hosted CC0 HDRI** — "warm cabin interior / golden window at dusk" (Poly Haven, 1–2 K,
   self-hosted, never a CDN preset) via drei `<Environment>`. The single source of ambient + reflections
   so every mixed-kit prop (piano, speakers, horn) is lit identically and brass/ceramic pick up the same
   warm window in their highlights (cohesion, Pillar A).
2. **Warm key #1 — the golden window sun (the ≤1 shadow-caster).** One `directionalLight` = `keyHex
   #FFD8A3`, `keyIntensity 1.2`, `keyPos [6, 8, 5]` — a low **raking** shaft **through window A4**,
   throwing the long soft golden shadows and lighting the piano lid + the desk. This is the *only*
   shadow-caster (Chromebook tax).
3. **Warm key #2 — the wood-stove (diegetic heartbeat).** B1's firebox is an **emissive material**
   (`fire.ember #FF7A3C` core → `fire.flame #FFB25A` body) **+ one cheap non-shadow `pointLight`** seated
   in it. Its **flicker** rides the breath clock (§5.1). Bloom lifts it. In a dusk/night mood it becomes
   the *primary* warm key.
4. **Warm practicals #3 — emissive only (no extra real lights):** the **glowing screen** (D2,
   `hue.music`), **tube-amp valves** (E3), **receiver dial** (E2), **gooseneck lamp** (D5), **string-
   lights** (H1), **candle-sconces** (C5), **wall lantern** (H3), **monitor/practice-amp LEDs** (D4/F7).
   They give bloom its sparkle; a couple do a slow ≤2 % breath.
5. **Cool fill — the dusk-blue skylight (no dead shadow, Pillar B).** Hemisphere `hemiSkyHex #A9C2E8` over
   `hemiGroundHex #C67B48`, `hemiIntensity 0.52`, plus low warm ambient `#52402E`. Result: shadowed
   wood/wool tints **blue-violet**, never gray.
6. **Frozen shadows only.** `<ContactShadows frames={1}>` grounding the **piano, desk, credenza,
   speakers, stool, armchair**; `<BakeShadows>` elsewhere; `<AccumulativeShadows>`+`<RandomizedLight>` for
   a settled hero shadow that costs zero once composed. **≤1 shadow-caster**, never per-frame.
7. **Palette-matched fog** (`fogHex #E0C79A`, `near 14 / far 46`) ties the mixed kit into one warm
   atmosphere and carries the shaft — for cohesion, **never to hide the far clip** (banned).
8. **Post** (shared `EffectComposer`, renderer `NoToneMapping`): `Bloom(mipmapBlur, luminanceThreshold
   ~1.0)` on the screen/valves/lamps/windows/stove + `Vignette` + `ToneMapping(ACESFilmic)`; **SMAA not
   MSAA**; 2–3 passes; `bloomPeak 1.4`.

**The hero light detail:** the **golden shaft** (A5/H4) — one soft god-ray volume (or a cheap emissive
quad + fog gradient) from window A4, carrying **dust motes** — sells "cabin at golden hour" more than any
prop. It rakes down-right across the **piano lid and the sheet music**, then pools on the rug.

---

## 5. Ambient life + micro-interactions

### 5.1 Ambient life (the room breathes — ≥3 always-on + the breath)

One shared **breath clock** (aliveness §5.1: `breath(tSec, phase) = 0.5 + 0.5*sin(...)`, `breathMs 8000`,
one uniform in one `useFrame`) drives, with per-element phase offsets:

- **Stove fire flicker** ±8 % emissive + point-light (the heartbeat) ✦
- **Window + screen glow** ≤3 % breath ✦
- **Dust motes** drifting in the shaft (`<Sparkles>`, sparse) ✦
- **Turntable platter** turning slowly (E5) + the **receiver VU needles** adrift (E2)
- **Hanging plant** sway on `<Float>` (H2); a **page-corner** of the sheet music lifting in a draft (C4)
- **Biscuit** breathing on the stool (G2)
- **String-lights** barely-there twinkle (H1) ✦

Reduced-motion → the breath **freezes at a pleasant mid-phase** (0.5), motes off, fire = steady glow, cat
napping — a serene, complete still (aliveness Pillar K). `frameloop="demand"`: a foreground room may run a
throttled loop for fire + motes; a backgrounded room drops to 0 GPU.

### 5.2 The cozy-juice grammar (house style — every delight)

Five soft beats (aliveness §4.1): **anticipation** (a tell) → **the warmth-bump** (a ~150–300 ms emissive
lift in the local warm hue — the universal "it heard you") → **a soft particle** (a small palette-matched
puff) → **one gentle sound** (a short, pitch-jittered, in-tune SFX; Tone.js) → **settle** (a damped spring
to calm). No screenshake, no confetti, no big pops (Pillar H). Reduced-motion collapses beats 1/3/5 to an
instant state change but keeps the sound + a static warmth-bump.

### 5.3 The signature music delights (signal-free — the firewall)

> **THE FIREWALL (read twice):** none of these emit an `ActivityEvent`. They call **nothing** on
> `RoomProps.emit`. Nothing is counted, collected, badged, or streaked. A delight that leaks a signal is an
> **instant fail** (aliveness §1.2; QA negative assertion in §10). Only the **doorway** (§6) is
> signal-relevant, and even it emits nothing in content-deferred v1.

| # | Delight | Trigger | The juice (warmth-bump · particle · sound) | Cost |
|---|---|---|---|---|
| 1 | **Play the piano** (the hero) | tap keys (C2) | keys dip; **amber key-glow ripples** (C3, `fire.spark`); a note-glyph puff (H5); **a warm, in-tune chord** (Tone.js, pentatonic-safe) | transient invalidate; instanced-key matrix update |
| 2 | **Nudge the turntable / gramophone** | tap E5/E6 | platter **spins up**, VU needles sway (E2), horn (E6) warmth-bumps; a **mellow vinyl-crackle + chord**; settle: platter slows to rest | transient; 1 emissive bump |
| 3 | **Stoke the wood-stove** | tap B1 | embers swirl up (`fire.ember→flame`), fire **swells ~2 s**; per the shared-hearth motif **every cabin window on the map + the screen pulse +8 % for one beat**; crackle-pop + low *whoomph* | transient invalidate ~2 s |
| 4 | **Warm the tube amp** | tap E3 | valves **glow-bump** warmer; a soft hum builds and fades | 1 emissive swap |
| 5 | **Strum the hung guitar** | tap F1 | strings **shimmer-blur**; a soft open-chord strum; the body warmth-bumps | transient |
| 6 | **The kettle** | approach B3 | a **steam wisp** rises; a faint whistle builds then eases | cheap particle |
| 7 | **Pet Biscuit** | tap G2 | the cat **leans, slow-blinks, tail curls**; a soft purr + *mrrp*; a warm halo | 1 sprite/anim state |
| 8 | **Tick the metronome** | tap C8 | pendulum **swings a few times then damps**; a cozy wooden tick (tempo-safe) | transient |

Anti-dead-prop rule (aliveness §4.3): if it **looks** tappable it **must** respond; pure scenery must
**not** invite a tap. Interactive props carry a faint idle "alive" tell (a glint/sway); scenery stays
still.

### 5.4 Sound (warm, tiny, CC0/synthetic — always mirrored visually)

Per aliveness §8: a low **room tone** (stove crackle + a kettle + a faint held note), the **per-cabin
voice** (the Music cabin adds a gentle melodic phrase to the world's generative bed), and the juice
one-shots above. **Tone.js** (MIT, already in the stack) for all tonal content → always in tune, zero large
downloads, deterministic (`?seed=`). CC0 clips (Kenney/freesound-CC0) only for textures (fire, footsteps).
**Gesture-gate the `AudioContext`**; **every audible cue has a visual twin** (deaf/HoH parity, hard
requirement); master mute/volume persisted; cheap pan/volume by DOM/screen position.

---

## 6. The doorway object + hotspot model + liveness

### 6.1 The `RoomHotspot` list (the only "places" the camera steps to)

Per gameflow §4.2 (`RoomHotspot`: `hero | doorway | ambient`, exactly one hero + one doorway). Tab/roving
order = `hero → doorway → ambient…`; `focus.target` is where the camera eases (`focusFillDistance 6.5`,
`focusLerp 0.075`). **"← Back to the clearing" is always first in focus order and never trapped.**

```ts
// interest-zone-music — buildRoomHotspots() (additive; does NOT alter frozen ZonePlugin/RoomProps)
const soundingCabinHotspots: RoomHotspot[] = [
  { id: "piano",     label: "The upright piano — play a note",  role: "hero",    focus: { target: [-3.0, 1.0, -0.6] }, live: true },
  { id: "screen",    label: "The studio screen — open the studio", role: "doorway", focus: { target: [ 1.1, 1.15, 1.2] }, live: true },
  { id: "stove",     label: "The wood-stove — glowing warm",     role: "ambient", focus: { target: [-3.9, 0.9, -2.8] }, live: true },
  { id: "hifi",      label: "The hi-fi corner — the record's on", role: "ambient", focus: { target: [ 3.2, 0.9, -2.4] }, live: true },
  { id: "instruments", label: "The instrument wall",             role: "ambient", focus: { target: [ 1.5, 2.0, -3.1] }, live: true },
  { id: "shelf",     label: "The Shelf — saved loops",           role: "ambient", focus: { target: [ 4.2, 1.6,  0.0] }, live: false },
  { id: "window",    label: "The window — golden hour outside",  role: "ambient", focus: { target: [-1.5, 1.5, -3.2] }, live: false },
  { id: "cat",       label: "Biscuit the cat — asleep",          role: "ambient", focus: { target: [-2.6, 0.6,  0.2] }, live: true },
];
```

### 6.2 The doorway object — a host-ready warm placeholder (content deferred)

D2, the **glowing console screen**, is the single `doorway`. Because learning content is deferred
(reconciliation §7), it must be a **warm, honest, live** placeholder — never a dead "coming soon" wall
(gameflow §4.3; a dead interactive fails SC-CORE-14).

- **It glows and invites.** Rests at `markerEmissiveRest 0.35` and breathes to `…Pulse 0.5` in
  `hue.music #E8825A` — the single obvious focal point (value hierarchy, §2.4). The screen shows the
  breathing pad-grid / waveform UI (the realized "pad wall", §2.5).
- **It responds, honestly.** Stepping to it eases the camera in and plays a **warm acknowledgment**: the
  screen pulses, the room brightens a touch, a soft chime, and an **honest** line — *"The studio's warming
  up — new things are coming. For now, look around."* It may reveal one tiny cozy beat (the monitors hum a
  note; the waveform ripples once). **No fake lesson, no quiz, no modal dead-end.**
- **It is provably live.** The interaction toggles a small `peeked` room-state so
  `window.__qa.stateHash()` **changes** on contact — the machine-checkable "primary action is live" proof
  holds *before any content exists*. When content lands, this same hotspot **swaps its handler** to launch
  the Content App (zone-music v2 §C.1) — **no movement/flow change**.
- **Never coercive.** No countdown, no "check back in N days," no badge (passion guardrail).

### 6.3 `window.__qa` (the liveness contract, this room)

`window.__qa.interactives()` reports every hotspot in §6.1; `activeSurface` flips `room`↔`content-app` when
the door opens (later); `stateHash()` includes `peeked` + the piano/turntable transient states so the
**Primary-action-live test** (art bible §13.6, gameflow §14.3) passes: the doorway is live, the hero pad/
piano is live, and the **firewall test** (aliveness §14.1) asserts the eight delights emit **zero** events.

---

## 7. CC0 sourcing + the `<50` draw-call budget + degradation

### 7.1 CC0 sourcing (which kits supply what)

All **CC0** (commercial-safe, no attribution; **avoid Synty** — its EULA bans UGC/generative use and this
product may add child-authoring). Pipeline (research §3, §6): `gltf-transform optimize --compress meshopt
--texture-compress ktx2` → `gltfjsx --transform --types` → `useGLTF.preload` → drei `<Instances>`/`<Merged>`.
Ship `assets/LICENSES.json`.

| Element | CC0 source (backbone) | Notes |
|---|---|---|
| **Cabin shell, log walls, beams, floor, door, window** | **KayKit** (Medieval/timber) + **Kenney** (Building Kit) | one gradient atlas → `<Merged>` shell (1–3 calls); tint `wood.*` + `plaster.cream` |
| **Furniture** (desk, credenza, stool, chair, shelf, armchair) | **Kenney Furniture Kit** + **KayKit** bits | instanced/merged; tint to palette |
| **Wood-stove, kettle, logs, lantern, string-lights, floor lamp** | **Kenney** (Survival/Holiday) + **KayKit** props | stove/lantern/bulbs = emissive; bulbs + logs instanced |
| **Plants, vine, moss** | **Quaternius** (Stylized/Ultimate Nature) + **Kenney Nature** | `<Float>` on the hanging plant |
| **Biscuit the cat** | **Quaternius** (Animated Animals) / **KayKit** anims | **the one skinned mesh** in the room |
| **The piano** | **assemble** (best CC0 route): Kenney cabinet/box shell + **instanced key strip** (`InstancedMesh`) + brass pedals/sconces + a fretwork+sheet-music card. Check **Poly Pizza**/**Quaternius** for a CC0 stylized upright first; verify per-model. | instancing the keys is also a draw-call win |
| **Hi-fi** (speakers, tube amp, receiver, turntable, gramophone horn) | **Poly Pizza** one-offs (**verify each CC0**); else **assemble**: speaker = box + cloth-grille quad; amp = box + emissive valve rods; receiver = box + emissive dial card; turntable = box + disc; horn = cone + `brass` | record every Poly Pizza license in the manifest |
| **Instruments** (guitar, fiddle, frame drum) | **Poly Pizza** / **Quaternius** (verify CC0); else assemble | wall-hung, static |
| **Studio gear** (MIDI keys, monitors, headphones, mic/pop-filter, cables) | **Kenney** (tech/furniture) + **Poly Pizza** (verify) | monitors = box + cone; keys reuse the piano instancing |
| **HDRI** (warm golden-window interior) | **Poly Haven** (1–2 K, self-hosted) | the single `<Environment>` IBL — the cohesion lever |
| **PBR textures** (wood grain, knit/cloth, leather, parchment, brass, stone) | **Poly Haven** + **ambientCG** (CC0) | 512–1 K → KTX2; the meso/micro bands (§4.1) |
| **Screen UI / pad-grid / note-glyphs / signs** | authored flat SVG/atlas | shared with the content app; emissive |
| **Dusk-forest backdrop card** (past the window) | baked offline (optional 1 Blockade skybox on a paid plan) → **static card**, never live geometry | Chromebook-safe |

### 7.2 The `<50` draw-call budget (the instancing plan)

Target **≤ ~44 calls** (hard cap 50; art bible/pipeline ceiling). One shared atlas material wherever
possible so batching is even possible.

| Bucket | Contents | ~Calls |
|---|---|---|
| **Shell (`<Merged>`)** | walls, beams, floor, ceiling, window frame, door | 3 |
| **Piano** | body/lid/desk merged (1) + **instanced keys** (1) + brass bits merged (1) | 3 |
| **Production desk** | desk + monitors + lamp + boom merged (1); **MIDI keys reuse the key instancer** (0) | 1 |
| **Hi-fi corner** | credenza + speakers + amp + receiver + turntable + horn `<Merged>` (2) | 2 |
| **Furniture** | stool, chair, armchair, shelf, credenza extras merged | 2 |
| **Instruments** | guitar + fiddle + drum small merged group | 1 |
| **Instanced repeats** | vinyl+cassettes (Shelf+crate) (1) · string-light bulbs (1) · split logs (1) · books/jars/sticky-notes/pots (1) | 4 |
| **Hearth** | stove + pipe + kettle merged (1); stove emissive (shares) | 1 |
| **Textiles/props** | rug, blanket, cushions, headphones, mug, cables, cases | 3 |
| **Cat** | 1 skinned mesh | 1 |
| **Emissive quads** | screen (1) · valves/dial/LEDs atlas (1) · key-glow (1) · candle/lantern (shares) | 3 |
| **Atmosphere** | `<Sparkles>` motes (1) · golden-shaft quad (1) | 2 |
| **Shadows** | `<ContactShadows frames={1}>` (composited) | ~1 |
| **Post** | `EffectComposer` merged pass (Bloom+Vignette+ACES) | 1 (fullscreen) |
| **Overhead/misc** | hanging plant `<Float>` + wall lantern + backdrop card | 3 |
| | **Total** | **≈ 34–44** ✓ |

Other ceilings (research §5.3): triangles ≤ ~150–300 k; textures props 256–512² / hero ≤ 1024², **KTX2**;
`dpr ≤ 1.5`; `antialias:false` + SMAA; `frameloop="demand"`; dispose geometries/materials on room-swap;
single persistent `<Canvas>` (never remount).

### 7.3 Degradation: `room-3d → room-3d-lite → board-2d`

Per `resolveRenderTier`/`QUALITY_TIERS` (`scene.ts`):

- **`quest-world-3d` (full):** all of the above; motes 60; bloom on; the throttled fire/motes loop.
- **`quest-world-3d-lite`:** motes 24; **no bloom**; **static fire glow** (breath frozen); simpler hi-fi
  (grilles/valves as flat cards, no separate emissive rods); string-lights = one emissive strip; the horn
  loses its spin (static). Still legibly the Sounding Cabin.
- **`board-2d` (the a11y + weakest-device floor):** **`ActivityDOM`** — a **described, ordered, focusable
  list of what's in the room and what you can do**, *not* a lesser menu (gameflow §4.5). Order: **"← Back
  to the clearing"** first → **the piano** ("The upright piano — play a note; the studio's warming up") →
  **the screen** (the doorway, the primary control, honest warm line) → ambient described items (the
  wood-stove, the hi-fi corner, the instrument wall, the Shelf, the window, Biscuit). Every hero/doorway
  control is keyboard + SR operable with `aria-valuetext`; the audio (piano chord, purr) is **identical**
  for sighted and blind users; every audible change has a **visible mirror** (deaf/HoH). Parity by
  construction: the `{hotspotId, label, role}` set operable via `ActivityDOM` **equals**
  `window.__qa.interactives()` (SC-CORE-11). On the weakest devices the child **enters the app straight
  from the map**, an equal path.

---

## 8. Hard floors + cost ceilings

Two-sided (LAAS): a **content floor** (so the room can't feel empty) **and** a **cost ceiling** (so it
stays Chromebook-safe). Under-dressing to hit the ceiling is itself a failure — **instance instead**.

| Budget | This room |
|---|---|
| **Draw calls / frame** | **≤ 44 target / ≤ 50 hard** (§7.2) |
| **Dressed objects** | **≥ 42 across 8 surface classes** (§3) — none bare; someone-just-left-the-room |
| **Music legibility** | the craft nameable in **≤ 1 s** from **≥ 3 unmistakable music objects** at a glance (piano · hi-fi/gramophone · hung instruments) |
| **Warm sources** | **≥ 2** real (window key + stove) + **≥ 6 emissive practicals** (screen, valves, dial, lamp, string-lights, sconces) |
| **Cool fill** | dusk-blue hemisphere (no dead shadow) |
| **Shadow-casters** | **≤ 1** (frozen) |
| **No-dead-shadow law** | **0** desaturated-gray shadow samples (blue-violet tint required) |
| **Always-on motions** | **≥ 3** (stove flicker · motes · turntable/plant/cat) + the breath |
| **Signature micro-interactions** | **≥ 4** live + signal-free (piano · turntable · stove · +1) — target the full 8 (§5.3) |
| **Doorway** | exactly **1** (the screen), domain-hued, host-ready, provably live (`window.__qa`) |
| **The golden shaft + motes** | present (the soul of the room) |
| **Post** | 2–3 passes (Bloom + Vignette + ACES) |
| **Textures** | props 256–512²; hero ≤ 1024²; **KTX2**; shared atlas |
| **Pixel ratio / loop** | `dpr ≤ 1.5`; `frameloop="demand"` (idle ≈ 0 GPU) |
| **Frame rate** | 60 target / **≥ 30 sustained** on iGPU under 10-min load |
| **The firewall** | **0** `ActivityEvent`s from any delight (QA-asserted) |

**Per-room must-haves (all required):** one obvious doorway (the screen) · one HDRI · warm key + stove +
cool dusk fill (no dead shadow) · palette fog on · the golden shaft + motes · ≥3 ambient motions · 8 dressed
surface classes · exposed beams + a stove · **the warm-wood piano (not black-gloss)** · a `<50`-draw-call
budget met · `window.__qa` present and the doorway + piano provably live · **zero signal leakage.**

---

## 9. Banned outcomes — instant fail

Any one fails the room (art bible §11 + zone-music v2 §A.9 + aliveness §12 + the passion guardrails):

- **Cold / clinical / pro-studio:** a dark moody control-room, a grey corporate-DAW look, acoustic foam
  as the *dominant* wall, a sterile "recording booth." The mood is **cozy cabin at golden hour**, never the
  moody references.
- **The black-plastic piano:** a glossy black-lacquer grand; **plastic shine** on the piano, speakers,
  ceramic, or leather; `MeshBasicMaterial`; fullbright; untinted default-material gray (§4.1).
- **Dead lighting:** gray/black shadows; flat ambient-only room; **no stove and no window shaft**;
  blown-out or muddy exposure.
- **Cold cabin / empty box:** a bare floor with gear on it; bare log walls with nothing hung; a hearth or
  screen that doesn't glow; a "clean" room even at 60 fps.
- **Two doors / illegibility:** more than one thing that reads as "go deeper" (e.g., a glowing gramophone
  horn competing with the screen — resolved in §2.6); a room whose craft isn't nameable in 1 s; competing
  focal points.
- **A dead or fake doorway:** a painted screen that opens nothing; a "coming soon" wall that doesn't
  respond; OR a placeholder that **fakes** a lesson/quiz/text-wall behind it.
- **A dead instrument / prop:** a piano/guitar/turntable that looks tappable and changes nothing (the
  juice's chocolate-covered broccoli); a false affordance; a `stateHash()` that doesn't move on the hero.
- **Firewall breach:** **any** micro-interaction that emits a signal, or is counted / rewarded / gated /
  badged / streaked (a "notes played: 12," a daily-login chord). *The single most important fail.*
- **Arcade juice:** screenshake, confetti, big pops, saturated flashes, slot-machine reward feel on any
  music interaction.
- **Incoherence / asset-soup:** mixed CC0 kits at different scales/palettes, untinted; cloned props
  (identical keys/vinyl/logs varied only by rotation); grid-perfect placement; visible texture tiling.
- **Chromebook slideshow:** > 50 draw calls, `dpr > 1.5`, per-frame shadows, a constant frameloop at idle,
  fog used to hide the far clip, external HDRI fetch, sustained < 30 fps.
- **Camera crimes:** free-fly / unclamped orbit / zoom inside the room; remounting the `<Canvas>` per room.
- **Accessibility crimes:** an `aria-hidden` canvas as the primary surface with no DOM peer; the
  `board-2d`/reduced-motion path as a lesser menu; color-only state; essential motion under reduced-motion;
  a broken (not calm) reduced-motion still; an audio-only delight (no visual mirror).

---

## 10. Self-score rubric — anchored to the references

Per row: **10** = passes a one-second glance beside Ghibli-desk / the lo-fi room / a warm vintage listening
room at 1080p on a Chromebook; **7** = clearly synthetic but the *same class*; **4** = decent hobby demo;
**2** = a pile of default-material CC0 gear in a grey box. **Score every phase; for each row write "what
raises this +2"; implement the two cheapest before proceeding** (the LAAS delta loop).

Rows:

- **Cabin warmth & coziness** (do I want to sit and play in this room?)
- **Music legibility** (is it unmistakably a music room in ≤1 s — piano + hi-fi + instruments?)
- **The piano as hero** (warm satin wood, inviting, obviously the thing you'd touch — *not* black plastic)
- **Doorway obviousness** (the screen is the one clear "open the studio," no second door)
- **Hi-fi corner soul** (warm wood cabinets, glowing valves, brass horn, an inviting chair — a *listening*
  place)
- **Firelight & light transport** (window shaft + stove + cool dusk fill; **no dead shadow**)
- **Dressing density & lived-in feel** (≥42 objects, ≥8 classes, a musician just stepped out)
- **Material quality** (aged wood / knit / leather / brass / parchment / ceramic; **satin, not plastic**;
  ≥3 bands)
- **Palette / color-script discipline** (everything on the `CABIN` scale; warm/cool split holds)
- **Ambient life & the breath** (fire flicker, motes, the turntable turning — one second from motion)
- **Micro-interaction satisfaction** (tap the piano / nudge the turntable / stoke the stove *feels good*,
  cozy not arcade)
- **Signal-free integrity** (the firewall holds — nothing counts)
- **Accessibility parity** (the `ActivityDOM` room is a true peer; audio-first; deaf/HoH visual mirrors)
- **Chromebook perf** (`≤44` draw calls, `dpr≤1.5`, frozen shadows, ≥30 fps sustained)

**Verification battery (run at every phase close):** the reference-delta loop (render → beside "Firelight
in the Sounding Cabin" → `DELTA.md` top-10 ranked → fix top 3 → re-render); the shadow-color test
(blue-violet, never gray); the firelight test (stove emissive + blooming); the cohesion/palette test
(every surface hue lands in `CABIN`); the satin test (no plastic gloss on wood/piano/ceramic); the
**primary-action-live** test (screen `peeked` + piano chord move `stateHash()`); the **firewall** test (the
8 delights emit **zero** signals); the legibility VLM rubric (music nameable in 1 s? one obvious door?
lived-in, not an asset dump?); the perf HUD (draw calls / fps / dpr on a real low-end device under
sustained load).

---

## 11. Build / integration notes

- **Additive only — no contract breaks.** This room consumes the frozen `Scene3DView`/`Camera3DView`/
  `HUE_RAMP` shapes and the additive `CABIN` / `WORLD_MOTION` / `MicroInteraction` tokens; it adds
  `buildRoomHotspots()` for `interest-zone-music` (§6.1) and the eight `MicroInteraction` entries (§5.3,
  each `emitsSignal: false` at compile time). No existing consumer changes.
- **Build order (this room, after the shared cabin kit exists):** (1) shell `<Merged>` + palette tint +
  HDRI + the lighting recipe (§4) → the room reads warm and beamed; (2) the three stations as merged/
  instanced groups (piano hero, production desk + screen doorway, hi-fi corner) → the focal path + value
  hierarchy (§2.4); (3) the instrument wall + Shelf + floor/textiles + cat → dressing density; (4) the
  breath clock + ambient life + the 8 signal-free delights (§5); (5) `RoomHotspot` list + camera step-to +
  the host-ready doorway + `window.__qa` liveness (§6); (6) the `room-3d-lite` + `board-2d` `ActivityDOM`
  peers (§7.3); (7) the reference-delta loop + full verification battery (§10).
- **Open decisions (record in `.loop/decisions.md`):** (a) whether a CC0 stylized upright piano exists on
  Poly Pizza/Quaternius or the assemble-from-primitives route (§7.1) is needed — default: assemble, keep
  the mesh swappable; (b) the exact screen-UI overlay tech (emissive quad vs. DOM/CSS over the Canvas) —
  default: DOM/CSS overlay to keep `frameloop="demand"` (v2's playhead pattern); (c) whether the listener-
  characters (v2 perform mode) ever appear here — default: no in content-deferred v1 (the cat is the sole
  presence cue); (d) hi-fi corner as one `<Merged>` vs. separate props for the turntable spin — default:
  turntable + horn split out so E5/E6 can animate, rest merged.
- **The naming nit (carried from the art bible §15):** shipped `RenderTier` literals are
  `quest-world-3d*`; this doc speaks `room-3d*` / "cabin." Cosmetic alias in a follow-up; out of scope here.

> **The one-line bar:** *push open the door and you're standing in the golden-hour parlour of someone who
> makes music — the fire's lit, a record's turning, the piano's warm under your hand, and the studio screen
> is glowing "come in." If a viewer's eye snags in one second on a category error — a black-plastic piano,
> a cold control-room, dead-gray shadow, two doors, a dead instrument, or a leaked counter — the task is
> not done. Iterate the delta loop.*
