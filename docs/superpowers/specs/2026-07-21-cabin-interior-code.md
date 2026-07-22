# Emberwood Cabin Interiors — the CODE cabin: **The Tinker Workshop** (Code · `symbols_math` · buildable interior set)

**Date:** 2026-07-21 · **Owner:** David · **Scope:** the *concrete, buildable, set-dressed 3D interior* of
the Code cabin — **"The Tinker Workshop"** — in **Emberwood** (the Interest Lab discovery world). This is a
cozy log-cabin **coding nook**: a warm honey-wood desk with a **real, kid-recognizable computer** at its
heart, watched over by a friendly **Claude** AI desk-buddy. This doc is the **set spec**: the obsessive prop
inventory (with scale + placement), the composed camera layout, the material + lighting recipe, the ambient
life + signal-free code-flavored micro-interactions, the CC0 sourcing + draw-call budget, and the LAAS
acceptance apparatus (hero reference frame, hard floors, banned outcomes, self-score). It takes the *interior*
to maximum buildable depth so a coding agent can assemble it.

**Reads first / builds on (does NOT contradict; if anything here fights these, they win):**
- [`2026-07-21-world-art-direction-cozy-cabin.md`](./2026-07-21-world-art-direction-cozy-cabin.md) — the
  Emberwood palette/materials/lighting bible; the shared cabin-interior kit (§8.1) + Code's per-cabin craft
  layer + the hero frame **"The Sunlit Workshop"** (§7); the six pillars; the `SCENE3D` warm pack; hard
  floors §9; banned outcomes §11 (incl. **no cold cabin / no cold-blue screen**). **The bible wins any conflict.**
- [`2026-07-21-zone-code-design-v2.md`](./2026-07-21-zone-code-design-v2.md) — the Code room's exact contents
  (§A3), reference frames RF-W1/W2 (§A1), hard floors (§A5), banned outcomes (§A9); the doorway desk (the
  "Build Bench," here **grown into the Coding Desk**), the AI companion, and the Shelf; the seam to the
  deferred content app.
- [`2026-07-21-world-gameflow-movement.md`](./2026-07-21-world-gameflow-movement.md) — the interior control
  model (fixed `CAMERA3D`, gentle clamped look, step-to-hotspots), the `RoomHotspot` shape (§4.2), the
  **host-ready warm doorway placeholder** (§4.3), the `ActivityDOM` peer (§4.5).
- [`2026-07-21-world-aliveness-and-juice.md`](./2026-07-21-world-aliveness-and-juice.md) — the breath clock
  (§5.1), the cozy-juice grammar (§4.1), the micro-interaction schema (§4.4), and **the firewall: juice is
  never signal** (§1.2). Every delight here is signal-free.
- [`stylizedWorldAssetPipeline.md`](../../research/stylizedWorldAssetPipeline.md) — CC0 backbone
  (Kenney/Quaternius/KayKit), one HDRI, frozen shadows, instancing, `<50` draw calls, `dpr≤1.5`.

**Grounding tokens (from the repo — reference, do not redefine):** `HUE_RAMP[1] = "#5FB98C"` (the Code
sage-green identity hue, KEPT — the warm-leaning green the code screens glow), `PALETTE` (`spark #FF9E5E`,
`beacon #FFD166`, `tide #5EC8D8`, `sprout #7BD88F`), the warm `SCENE3D` pack (art bible §3.2) and the
additive `CABIN` material palette (§3.4), `CAMERA3D` (adopted **verbatim**), `MOTION`/`EASINGS`/`resolveMotion`
(reduced-motion honored), `TYPOGRAPHY` (Fredoka/Iowan/Inter).

**Depth model = LAAS:** a named hero reference frame, an itemized contents list judged against it, two-sided
hard floors, an explicit banned-outcomes list, and a reference-anchored self-score with a mandatory
reference-delta loop — **judged against images (A Short Hike interiors · Ghibli desks · Stardew · a warm
"cozy coding desk setup" · a kid's Scratch/micro:bit maker corner), not against "pretty good for a browser."**

---

## 0. TL;DR — what this doc decides

1. **The room reads as CODE — the way a kid codes today — in ≤1 second.** A warm honey-wood **Coding Desk**
   carries a **real, kid-recognizable computer**: a friendly warm-bezel **monitor glowing with big, colorful,
   legible code**, a chunky **mechanical keyboard** with an amber **RUN** key, a mouse, and a sticker-covered
   **laptop** showing block-code — all in a cozy greenhouse-corner log workshop with a wood-stove,
   string-lights, and a sleeping cat. **A warm place where a kid codes — NOT a cold RGB gamer battlestation
   and NOT a sterile lab.**
2. **The doorway object is "The Coding Desk"** ([§4](#4-the-doorway-object--the-coding-desk)) — the warm-wood
   desk whose **glowing monitor** (warm **sage `#5FB98C`** + amber syntax) is the single brightest focal
   point and the one obvious verb ("step up to the desk"). It is a **host-ready warm placeholder** that is
   *provably live* (`stateHash()` changes) but opens no content yet.
3. **The monitor and the desk are ONE doorway, not two.** The operator's "friendly computer/terminal" is the
   desk's screen; the old "retro terminal / Build Bench / floating blueprint hologram" are **fused into** this
   one real workstation — the room has **exactly one** warm-glowing primary, never two competing focal points
   ([§4.1](#41-decision-one-doorway-not-two)).
4. **Programming is visible and playful for a child.** Colorful syntax on the monitor; block-code on the
   laptop; a **plush Python** snake on the desk; a warm-bound **JS/HTML/CSS/Python** book set on the shelf;
   language-logo **stickers** on the laptop lid; and **Sprout** (the recast of the old wind-up automaton
   "Pip"), a little robot you drive with **snap-together code blocks**. A kid points and says *"that's coding."*
5. **A friendly AI companion.** **Claude** — a warm little desk-buddy ("your AI coding friend") — sits beside
   the monitor and **blinks/waves back**; a **framed Claude illustration** hangs on the log wall above the
   desk. Wholesome and warm. Claude is a **new** companion — not the doorway and not the robot (the wind-up
   automaton "Pip" is recast as **Sprout**, §0.4).
6. **Screens/LEDs stay warm, never cold blue.** The warm/cool split is carried by *light* (golden window key +
   stove glow vs the cool dusk-blue skylight fill), and every screen glows in the **sage domain hue + amber**.
   The one cool practical is a tiny, restrained **verdigris** status-LED off the hero — never a cold-blue wash
   ([§6.4](#64-the-warmcool-split--the-no-cold-blue-screen-rule)).
7. **Dressed past the floor, instanced under the ceiling:** **53** distinct dressing occupants across **10**
   surface classes ([§3](#3-the-full-prop-inventory-the-obsessive-enumeration)), assembled from CC0 kits into
   a **~33-draw-call** scene (hard cap 80) ([§8](#8-cc0-sourcing--draw-call-budget--tiers)).
8. **It breathes and it responds — signal-free.** One breath clock drives fire flicker, dust motes, the
   on-screen cursor blink, Claude's idle, and Sprout's idle; **five** cozy code-flavored micro-interactions
   (tap the keyboard → a soft clack + a colorful line of code types onto the screen; wave at Claude → it
   blinks/waves back; snap a code block → Sprout runs the program; flip the switch → the string-lights chase
   on in sequence; stoke the stove) obey the cozy-juice grammar and emit **zero** `ActivityEvent`s
   ([§7](#7-ambient-life--code-flavored-micro-interactions)).
9. **It degrades cleanly:** `room-3d` (full) → `room-3d-lite` (flat lights, no bloom, thinned motes) →
   the `ActivityDOM` **described room** — a true peer that describes the computer, the languages, and Claude,
   reachable with zero WebGL ([§8.4](#84-tier-degradation--the-accessible-floor)).

---

## 1. Hero reference frame — name the bar

Author these into `passion/packages/interest-zone-code/reference/` in phase 0 (real screenshots from the
touchstones). **Every phase renders the closest shot and runs the reference-delta loop against them.**

### 1.1 RF-INT-CODE — **"The Sunlit Coding Nook"** (the hero establishing shot)

*Touchstones:* A Short Hike interiors · Studio-Ghibli desks (*Whisper of the Heart* / *Kiki*'s attic) ·
Stardew greenhouse/workshop · **a warm "cozy coding desk setup"** (honey wood + plants + string-lights +
warm-backlit keyboard — deliberately **NOT** an RGB battlestation) · a kid's **Scratch / micro:bit / Raspberry
Pi maker corner**. Deepens art bible §7 "The Sunlit Workshop" + zone-code-v2 RF-W1.

> **The frame.** A composed 3/4 view into a small warm **log workshop with a glass greenhouse gable**. Late
> golden-hour sun pours through a **mullioned window (upper-left)** and the **glass gable overhead**, throwing
> a soft **god-ray shaft thick with dust motes** diagonally down-right onto a central **chunky warm-wood
> Coding Desk**. On the desk, the heart of the room: a **friendly warm-bezel monitor** whose screen glows a
> soft **sage-green `#5FB98C` + amber** with **big, colorful, legible code** (bright syntax on a warm dark
> background — never cold blue); a chunky **mechanical keyboard** with cream keycaps and one oversized amber
> **RUN** key; a mouse; and, tilted beside it, a **warm-cased laptop** whose lid is covered in **language
> stickers** and whose screen shows **colorful block-code**. Curled by the monitor sits a **little plush
> Python snake**; on the desk corner, **Claude** — a friendly little **AI desk-buddy** with a warm amber face
> — sits watching, and a **framed Claude illustration** ("your AI coding friend") hangs on the log wall just
> above. To the right a **wood-stove glows amber** (a kettle on top, split logs stacked) — the recurring
> hearth. To the left a **language nook**: a low shelf of warm-bound **JS/HTML/CSS/Python** books, a couple of
> friendly **language-mascot** desk-toys, a reading cushion, and a **string of warm bulbs**. On a low mat
> nearby, **Sprout** — a small friendly robot — waits beside a tray of **colorful snap-together code blocks**.
> A **chalkboard** carries a hand-drawn **start→loop→goal** sketch; a **Shelf of little finished creations**
> and a plank shelf of manuals sit to the right. **Potted sprouts and a trailing vine** frame the greenhouse
> warmth; a **rug**, a worn **stool**, a **mug**, a **cat asleep on the sill**. Warm honey wood + brass +
> knit; shadows tint **blue-violet**, never gray. The eye lands on the glowing monitor within one second.
>
> **FAIL if the frame looks like:** an empty room with one table and a button · a **generic steampunk
> inventor's shop with no visible computer/keyboard/code** · a **cold-blue "hacker" room** · a **cold RGB
> gamer battlestation** (rainbow LED strips, black/neon) · a cold gray lab or server room · bare untextured
> walls · a lobby.

### 1.2 RF-INT-CODE-2 — **"The Desk, ready"** (the doorway, close)

*Touchstones:* the glowing forge/anvil/portal in cozy games; a warm developer desk backlit by a low lamp;
Monument Valley warm focal geometry. Deepens zone-code-v2 RF-W2.

> **The frame.** The Coding Desk as the single brightest warm focal point: the **monitor** screen warming in
> **sage `#5FB98C` + amber**, showing a few lines of **big colorful code** (a `for` loop drawing a little leaf,
> a `print("hello, world!")`) with a **gently blinking amber cursor** and a soft `spark #FF9E5E` bloom; the
> oversized **amber RUN keycap** catching a candle-warm glint; the **laptop** beside it glowing softly with
> block-code; **Claude** the desk-buddy doing a tiny idle blink; a worn stool and a light-worn spot on the
> floor implying "step up here." It reads as *the one thing to do* with no text.
>
> **FAIL if:** a flat button floating in 3D · a generic "Enter" sign · two competing focal points · a **cold
> blue screen** · a cold RGB glow · nothing obviously primary.

### 1.3 The inversion of LAAS (stated plainly)

LAAS's floors are geometry floors (≥5M triangles). **Ours are coziness, firelight, legibility-as-coding,
dressing density, and motion floors under a hard draw-call ceiling.** On a Chromebook, beauty is **warm light
+ palette + cohesion + a lived-in desk you'd want to code at**, not polygon count. A room that is *sterile,
cold-lit, cold-blue, RGB-edgy, under-dressed, or asset-soup* — or that reads as *tinkering with no visible
computer* — is a **failed screen**, exactly as a flat 2010 terrain is a failed LAAS screen — even at 60 fps.

---

## 2. The composed camera + spatial layout

### 2.1 Coordinate convention (buildable)

A right-handed room frame; all placements below use it (units = **meters**).

- **Origin `(0,0,0)`** = floor, directly under the **front edge of the Coding Desk** (room center-front).
- **+X** = camera-right (call it *east*); **−X** = camera-left (*west*).
- **+Y** = up. **+Z** = **toward the camera** (out of the diorama / the open "fourth wall"); **−Z** = back wall.
- **Camera** = `CAMERA3D` **verbatim**: `home.pos [0, 4.5, 15]`, `home.target [0, 0.4, 0]`, `fov 42`,
  `establishStart [0, 7, 22]`, `focusLerp 0.075`, `focusFillDistance 6.5`; orbit clamps polar 60–85°, azimuth
  ±75°, **no pan, no zoom** (§2.5). The camera looks slightly down the +Z axis at the desk.
- **Room shell footprint:** back wall at **z = −4.5**; side walls at **x = ±6.5**; floor **y = 0**; tie-beams
  at **y = 3.6**; glass gable ridge at **y = 4.4**. The +Z side is **open toward the camera** (no near wall) —
  the diorama's fourth wall — framed instead by dark foreground dressing at **z = +5 … +8** (§2.4).

```
  PLAN (looking straight down; camera is far below at z=+15, looking up-screen toward −Z)

            x=-6.5                      x=0                      x=+6.5
   z=-4.5  ┌──────[ WINDOW ]───[ CLAUDE PORTRAIT ]──[ CHALKBOARD ]────────┐  ← back (log) wall
           │  language                 (framed on     (start→loop→goal) STOVE│  ← wood-stove back-right corner
           │  nook + books              the log wall)                   (hearth)
   z=-2.0  │  (JS/HTML/CSS/Py,   · · · · · · · · ·        SHELF of creations│
           │   plush toys,       corkboard/pegboard        + manuals shelf │
           │   string-lights)    (notes, code print)                       │
   z= 0.0  │        └──────[  THE  CODING  DESK  ]──────┘    rug    stool  │  ← HERO + DOORWAY (center)
           │        monitor · keyboard(RUN) · laptop · Claude · Python     │
   z=+1.6  │  Sprout + block-toy mat .................  cable crate .......│
           ·                                                                ·
   z=+5..+8   [ dark foreground frame: near beam · vine · cable crate ]     (open fourth wall)
                              ▲ camera at (0, 4.5, +15) ▲
```

### 2.2 The value structure (Pillar E: dark frame → lit subject → luminous background)

- **Dark cozy foreground frame (`wood.cocoa #4A3320`, in shade):** a near **tie-beam** clipping the top of
  frame (y≈3.5, z≈+6), a **cable/parts crate** bottom-left (z≈+6.5), a **trailing vine** drooping from
  top-right (z≈+5.5), and the near lip of the **rug** — all under-lit, silhouetting the shot.
- **Lit subject (mid-value honey + the hero warms):** the **Coding Desk** at center (z≈+0.3), raked by the
  golden shaft; the **sage+amber monitor** and the **amber RUN keycap** are the brightest focal warms.
- **Luminous background:** the **golden window** (`light.window #FFC08A`) upper-left and the **wood-stove**
  (`fire.flame #FFB25A`) back-right — the two warm sources; the pegboard/chalkboard/Claude portrait recede
  into gentle honey fog (`fogHex #E0C79A`).

### 2.3 The focal path (the eye's authored journey — one clear primary)

1. Enter top-left on the **golden window shaft** → 2. ride the **dust motes** down-right → 3. land on the
**glowing monitor (colorful code) + the amber RUN key** on the Coding Desk (**the doorway — the one bright
sage+amber focal**) → 4. notice **Claude** the desk-buddy and the **framed Claude portrait** above (AI-friend
warmth) → 5. drift right to the **amber wood-stove** (comfort) → 6. glance left to the **language nook** and
back to the **chalkboard** (the craft's marks) → settle. One unambiguous primary (the monitor/desk);
everything else is beautiful, legible atmosphere.

### 2.4 Foreground framing detail

The open fourth wall is framed so the composition never floats: the **near tie-beam** + **vine** cap the top,
the **cable crate** + **rug lip** anchor the bottom-left, and **palette fog** dissolves the far corners. This
is the "dark near-edge" that gives the diorama depth and keeps the desk reading as *inside a place*, not on a
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
taste (hero) and the host-ready doorway coincide on the Coding Desk** — one bright focal region; when content
lands, the hero taste may split into its own hotspot with **no layout change**. Objects that sit *on* the desk
(the keyboard, Claude) are their **own ambient hotspots**, distinct from the doorway's "step up" — a lower,
matte, non-competing affordance (the desk's glowing monitor is the sole primary, §4.1).

| # | `id` | `label` | `role` | `focus.target` (x,y,z) | `live` | Note |
|---|---|---|---|---|---|---|
| 1 | `back-to-clearing` | "← Back to the clearing" | (exit) | n/a (DOM control) | — | always first; never trapped |
| 2 | `coding-desk` | "The Coding Desk" | **doorway** (primary) | `(0, 1.15, 0.1)` | **true** | the one warm verb; the glowing monitor + colorful code + RUN key + laptop (§4) |
| 3 | `keyboard` | "The keyboard" | ambient | `(0, 1.0, 0.3)` | true | tap it → a soft clack + a colorful line of code types on (§7.3 #1) |
| 4 | `claude-buddy` | "Claude, your AI coding friend" | ambient | `(0.6, 1.05, 0.15)` | true | wave → it blinks & waves back (§7.3 #2) |
| 5 | `sprout-robot` | "Sprout & the code blocks" | ambient | `(-1.3, 0.7, -1.7)` | true | snap a code block → Sprout runs the program (§7.3 #3) |
| 6 | `wood-stove` | "The wood-stove" | ambient | `(4.6, 1.0, -3.6)` | true | stoke it → embers swell (§7.3 #5) |
| 7 | `language-nook` | "The language nook" | ambient | `(-3.8, 1.2, -1.0)` | true | flip the switch → string-lights chase on (§7.3 #4); the JS/HTML/CSS/Python books + plush toys |
| 8 | `shelf` | "The Shelf of creations" | ambient | `(5.4, 1.8, -2.4)` | true | the return cue; empty slots visible; the framed Claude portrait near |
| 9 | `window-sill` | "The sunny sill" | ambient | `(-4.4, 1.6, -3.8)` | true | dust motes; a cat asleep — pet it (§7.3 supporting) |

All `live` hotspots change `window.__qa.stateHash()` on contact (§8.5). Parity: this set equals the
`ActivityDOM` peer list (§8.4). **Firewall:** only `coding-desk` is the host-ready doorway that will emit/open
content later; the keyboard, Claude, Sprout, string-lights, and stove are **signal-free delights** (§7.3).

---

## 3. The full prop inventory (the obsessive enumeration)

The cozy-cabin base (beams, wood-stove, rug, warm lamps, plant, golden window) **fused** with a **modern
kid-coding** layer (a real computer, a keyboard, languages made visible, an AI desk-buddy, a codeable robot).
Every row is a **required occupant** (Pillar C — nothing is bare). **Scale** = approx bounding box (w×d×h, m).
**Pos** = anchor `(x,y,z)` in the §2.1 frame. **Tint** = a `CABIN`/`PALETTE` token. **Draw** = its draw-call
contribution (see the budget, §8.2). Repeated props get per-instance hue/value/scale/rotation **jitter**
(Pillar C — cloned uniformity is banned).

**Distinct dressing-occupant tally = 53** across **10** surface classes (floors in §9 require ≥40 / ≥6). The
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
| **Golden god-ray shaft** (soft volume / emissive quad + fog gradient) | cone ~2×2×7 | from window → desk, diag down-right | ~30° | `keyHex #FFD8A3` | +1 |
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

### 3.4 Surface class D — **The Coding Desk** (center — hero + doorway) *(occupants: 11)*

The one primary — a real, kid-recognizable computer on a warm-wood maker's desk. Full spec in
[§4](#4-the-doorway-object--the-coding-desk); enumerated here for the inventory.

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Chunky warm-wood Coding Desk** (thick top, tool-chamfered edges, a cable grommet, a drawer) | 2.6×1.0×0.95 | (0, 0, 0.3) | faces +Z | `woodHoney` top, `woodWalnut` legs; edge wear | +1 |
| **The monitor** (friendly rounded warm bezel, slight-curve screen) — the doorway glow | screen 0.62×0.02×0.4; bezel +0.04 | (0, 0.95, −0.05) | faces camera | bezel `woodDrift`/`ceramic` warm; screen **`hue.code #5FB98C` + amber syntax** on warm-dark bg (low bloom) | +1 screen (atlas) |
| **Mechanical keyboard** w/ cream keycaps + one oversized amber **RUN** key (the "run it" affordance) | 0.42×0.14×0.03 | (0, 0.92, 0.30) | flat, faces camera | case `woodDrift`; keycaps `woolCream`/`ceramic` + accents `sprout`/`beacon`; **RUN key `brass`/`spark` (brightest glint)** | keycaps instanced |
| **Mouse + fabric mousepad** | mouse 0.06×0.11×0.035 | (0.45, 0.92, 0.30) | — | mouse `woodDrift`; pad `woolWarm` (jitter) | instanced-desk |
| **Warm-cased laptop** (lid covered in **language stickers**; screen shows **colorful block-code**) | 0.34×0.24×0.02 open | (−0.72, 0.95, 0.10) | ~20° open, ¾ to camera | case `ceramic`/`woodHoney`; hinge `brass`; **stickers atlas (Python/JS/HTML5/CSS/Git/♥)**; screen block-code emissive | +1 screen (shared atlas) |
| **Claude, the AI desk-buddy** (a friendly little character; warm amber face; a **new** AI-friend companion) | 0.20×0.18×0.26 | (0.60, 0.98, 0.15) | ¾ to camera | soft `woolCream`/`candle` body; **warm amber face-glow**; one `sprout` LED | +1 (small static + tiny idle) |
| **Plush Python snake** curled by the monitor (language mascot) | ⌀0.10 coil ×0.5 | (−0.40, 0.98, −0.02) | curled | felted `sprout #7BD88F`/`forestPine` (warm-leaning), `beacon` eyes | instanced-toys |
| **Warm desk lamp** on a bendy arm (a warm bench practical) | arm 0.5; head ⌀0.12 | (0.85, 0.95→1.4, −0.10) | over the keyboard | `brass` arm; shade glow `candle #FFE0A8` | +1 |
| **Mug of pens/markers** + a coiled **headphone** on a hook | mug ⌀0.09; can ⌀0.10 | (0.78, 0.98, 0.36) | — | mug `ceramic`; pens jittered warm; cans `leather` | instanced-desk |
| **A little potted sprout** on the desk ("code that grows") | ⌀0.14×0.18 | (−0.30, 0.98, 0.34) | — | pot `terracotta`; leaf `sprout`/`forestPine` | in potted-sprouts (§3.9) |
| **Worn stool** (the "step up here" cue, light-worn seat; a hoodie draped over it) | ⌀0.34×0.6 | (0, 0, 1.6) | — | seat `leather.worn #8B5A3C`; legs `woodOak`; hoodie `woolWarm` | +1 |

### 3.5 Surface class E — The language nook / reading corner (left) *(occupants: 7)*

The operator's "programming languages, made visible + playful" — **secondary** craft dressing + the
string-lights micro-interaction site (explicitly **not** the doorway).

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Low language bookshelf** (well-used, warm) | 1.2×0.35×1.2 | (−4.0, 0, −1.2) | against left wall | `woodHoney`/`woodOak` | +1 (in wall furniture) |
| **The language book set** — warm-bound **JS · HTML · CSS · Python** + a "Hello, World!" primer (spines out, one leaning) | ~0.22 ×5 | on the shelf | jittered | covers `beacon`/`terracotta`/`forestDeep`/`sprout`/`leather` (jitter); embossed titles | 1 InstancedMesh (books) |
| **Language-mascot desk-toys** (a friendly "JS" cube + an "HTML5" shield toy; the plush Python lives on the desk) | ~0.12 ×2–3 | shelf top | jittered | warm palette-tuned logo hues | instanced-toys |
| **A stack of printed tutorials / a coding zine** (colorful covers, dog-eared) | 0.2×0.26 ×4 | (−4.2, 0.62, −1.0) | leaned | `parchment` + warm print | instanced-paper |
| **Reading cushion / small beanbag** (the "curl up and read" cue) | ⌀0.55×0.3 | (−4.2, 0, 0.4) | — | `woolWarm` (jitter → sage/rust) | +1 |
| **String of warm bulbs** (the light-chain — chases on §7.3 #4) w/ a little **brass switch** | 12 bulbs, ~2.4 span; switch 0.06 | (−4.6→−2.6, 1.9, −0.3); switch (−3.0, 1.0, −0.4) | drapes | bulbs `lantern #FFD166` emissive | 1 InstancedMesh |
| **A "hello, world!" pennant / poster** on the left wall | 0.7×0.4 | (−5.0, 2.0, −1.5) | on wall | `parchment`; `sprout`/`spark` ink | instanced-paper |

### 3.6 Surface class F — The wall of ideas: chalkboard + corkboard/pegboard + the Claude portrait (back) *(occupants: 6)*

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Chalkboard** w/ a hand-drawn **start→arrow→loop→goal** flow-sketch (diegetic foreshadow) | 1.4×0.05×1.0 | (2.6, 1.9, −4.4) | on wall | slate `nightSunk`-toned; chalk `plaster`/`sprout` | +1 (screen atlas) |
| **Framed Claude illustration** ("your AI coding friend") on the log wall, right above the desk | 0.7×0.9 | (0.2, 2.25, −4.4) | on wall | frame `woodHoney`/`brass`; warm friendly portrait (`candle`/`sprout`) | +1 (atlas, shared w/ boards) |
| **Corkboard** w/ sticky notes + a **printed colorful code snippet** + a pixel-art card | 0.9×0.7 | (−1.4, 2.0, −4.4) | on wall | cork `woodDrift`; notes jittered warm; code print `parchment` | instanced-paper |
| **Pegboard** on the log wall w/ **coiled cables**, headphones, a couple of hand-tools | 1.4×0.05×1.0 | (1.4, 1.9, −4.4) | on wall | board `woodDrift #B9A484`; cables jittered warm; tools `brass` | +1 board + cables instanced |
| **Pinned printouts / a wireframe sketch** (curled corners, pin-holes) | 0.4×0.5 ×3 | (−2.4…−1.8, 2.1, −4.38) | pinned | `parchment`; sage ink lines | instanced-paper |
| **A small wall clock or a "keep going" pennant** | ⌀0.24 | (3.6, 2.4, −4.35) | on wall | `brass`/`parchment` | instanced-props |

### 3.7 Surface class G — The Shelf of creations + bookshelf of manuals (right) *(occupants: 6)*

The diegetic **memory / return cue** (zone-code-v2 §A3 Zone 4): the little things the kid made sit here;
**empty slots are visible** (room to make more); the shelf **glows softly iff** kept/unfinished work exists.

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **The Shelf** (wooden, slotted, right wall) | 1.8×0.35×2.2 | (5.6, 0, −2.4) | on wall | `woodHoney`/`woodOak` | +1 (in wall furniture) |
| **Finished creations** in slots — a little robot (Sprout's cousin), a **pixel-art print**, a "my first game" cartridge toy, a 3D-printed trinket, a small game controller | ~0.22 ×5 | across shelf slots | jittered | `brass`+`woodHoney`; sage LEDs; warm print | 1 InstancedMesh |
| **Ribbon tags** ("★ made it!") on filled slots | 0.12 ×N | on filled slots | — | `parchment`; `beacon #FFD166` star | instanced-paper |
| **Plank shelf of manuals** (spines out, a couple leaning) | 1.4×0.25×0.4 | (5.8, 1.4, −0.6) | on wall | covers `leather`/`terracotta`/`forestDeep` (jitter) | in books InstancedMesh |
| **A mug + a small brass desk-lamp** on the shelf ledge | mug ⌀0.09 | (5.2, 1.85, −1.0) | — | mug `ceramic #D8B48C`; lamp `brass`, glow `beacon` | +1 lamp; mug instanced |
| **A potted sprout** on the shelf ledge | ⌀0.14×0.18 | (5.0, 0.5, −2.2) | — | pot `ceramic`; leaf `sprout` | in potted-sprouts (§3.9) |

### 3.8 Surface class H — Sprout & the block-coding toy *(occupants: 4)*

The operator's "coding you can touch" — **Sprout**, a little friendly robot the kid programs with **colorful
snap-together code blocks** (Scratch-style, made physical): a hand-made, tactile metaphor for sequence/loops
that visibly *runs a program*. A signal-free micro-interaction (§7.3 #3). Reads as *"coding makes things
move"* — exactly how a kid meets code today.

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **The maker mat / low kids' table** w/ a little run-track + a goal flag | 0.9×0.6×0.4 | (−1.4, 0, −1.7) | ¾ to camera | top `woodHoney`; track `woodOak`; flag `beacon` | +1 |
| **Sprout, the codeable robot** (the recast of the old wind-up automaton "Pip"; the lone skinned mesh — toddles/turns when a program runs) | 0.28×0.24×0.30 | (−1.2, 0.42, −1.7) | ¾ to camera | `woodHoney`/`ceramic` shell; one `sprout #7BD88F` LED; a tiny verdigris status-LED on its dock (§6.4) | +1 (skinned) |
| **Tray of snap-together code blocks** (colorful "when clicked / move / repeat / if" bricks) | tray 0.3×0.2×0.06; bricks ⌀0.05 | (−1.7, 0.44, −1.6) | — | bricks `spark`/`sprout`/`beacon`/`tide→verdigris` (jitter, warm-tuned) | 1 InstancedMesh (blocks) |
| **A charging dock** for Sprout (the one cool practical lives here) | 0.14×0.10×0.06 | (−1.0, 0.42, −1.85) | — | `woodDrift`; **tiny `verdigris #7F9E8E` status-LED** (§6.4) | instanced-props |

### 3.9 Surface class I — Plants / greenhouse warmth *(occupants: 3)*

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Potted sprouts** (the "logic that grows" motif) on sill + desk + shelf | ⌀0.16 ×4 | sill/desk/shelf | jittered | pot `ceramic`/`terracotta`; leaf `forestPine`/`sprout` | 1 InstancedMesh |
| **A hanging pot** w/ a trailing plant (`<Float>` sway) | ⌀0.25 | (2.8, 3.0, −2.0) | hangs | `ceramic`; vine `moss` | +1 (`<Float>`) |
| **Moss / a tiny terrarium** on the language shelf | ⌀0.15 | (−4.2, 0.95, −1.4) | — | glass + `moss`/`forestDeep` | instanced-props |

### 3.10 Surface class J — Floor & cozy dressing *(occupants: 3)*

| Prop | Scale (m) | Pos (x,y,z) | Rot | Tint | Draw |
|---|---|---|---|---|---|
| **Knit/woven rug** (chunky ribs, a dropped stitch, worn where you stand) | 3.2×2.2 | (0, 0.01, 0.8) | — | `woolWarm` (jitter → sage-wool `#7E9E8E` / rust-wool `#B5623A`), `woolCream` border | +1 |
| **Cable/parts crate** (foreground frame; a keyboard box, spare cables, a mini-PC spilling) | 0.6×0.5×0.5 | (−4.6, 0, 2.2) | ¾ | `woodDrift`; cables jittered warm; stickers | +1 |
| **Scatter set:** a dropped USB stick, a coiled cable, a sticker sheet, a printout of colorful code, a stray code-block on the floor | small | around the desk (z=+1…+2) | jittered | `woodDrift`/`parchment`/`brass`/`spark` | in scatter InstancedMesh |

**Human-presence cue (Pillar C):** the **cat asleep on the sunny sill** (Biscuit, the wandering heart of
Emberwood — art bible §1 / aliveness §9.4), the light-worn stool seat with a **hoodie** slung over it, the
half-drunk mug, a **sticky note stuck to the monitor bezel**, the block-coding toy left **mid-program**, and
the laptop's editor **left open** all say *someone was coding here one second ago*.

---

## 4. The doorway object — **The Coding Desk**

The single host-ready primary affordance (gameflow §4.3; art bible §8.2; zone-code-v2 RF-W2). It is the
**second warm focal point** after the hearth: the eye lands on the fire for comfort and on the desk for *the
one thing to do*.

### 4.1 Decision: one doorway, not two

The operator flagged the "friendly computer/terminal" **and** the desk as candidates. **Decision: they are one
object.** The monitor is the desk's **screen** (the surface the colorful code lives on), so the room has
**exactly one** warm-glowing primary. This obeys the frozen art bible §8.2 + zone-code-v2 (the Code doorway is
the desk that opens the content app) **and** honors the operator's "a real, kid-recognizable computer as the
heart of the room" ask — while avoiding the banned outcome of **two competing focal points**. The old "retro
terminal," "Build Bench," and "floating blueprint hologram" are **fused into** this one real workstation: the
**Build Bench grew up into the Coding Desk**, and the old floating hologram is now **the actual colorful code
on the monitor** (grounded, legible, today's coding — not a sci-fi hologram). Objects that sit *on* the desk
(the keyboard, the laptop, Claude, the plush Python) are **lower, matte, non-glowing** ambient props — like a
character on a desk, never a second glow competing with the monitor.

### 4.2 What it is, physically

A chunky warm-wood desk (§3.4) carrying, as one composed focal cluster:
- **the monitor** — a friendly, warm-bezel screen glowing **sage `#5FB98C` + amber** with **big, colorful,
  legible code** on a **warm-dark** background (never cold blue, §6.4): a few lines of kid-readable syntax
  (keywords sage, strings `beacon #FFD166`, functions/numbers `spark #FF9E5E`, comments soft `sprout #7BD88F`,
  punctuation `parchment`), a **gently blinking amber cursor**, and a tiny turtle-graphics output drawing a
  sage leaf (ties to Sprout / "logic that grows"). Low bloom;
- a chunky **mechanical keyboard** with cream keycaps and one oversized **amber RUN keycap** — the tactile
  "run it" affordance and the brightest brass-warm glint (the evolution of the old brass GO key);
- a **warm-cased laptop**, lid covered in **language stickers**, screen showing **colorful block-code** (a
  Scratch-style stack) — the "coding for kids" read, doubled;
- **Claude**, the friendly AI desk-buddy (the content app's helper, foreshadowed), doing a tiny idle blink;
- a **plush Python**, a **mug of pens**, a **desk lamp**, and a **sticky note on the bezel** — the maker's marks.

### 4.3 How it behaves — a host-ready **warm placeholder** (live, honest)

Learning content is **deferred**. The doorway must be a warm, honest, **live** placeholder — never a dead
"coming soon" wall (a banned outcome). Per gameflow §4.3:

- **It glows and invites.** At rest the monitor + the RUN key sit at `SCENE3D.markerEmissiveRest 0.35` and
  **breathe** to `markerEmissivePulse 0.5` in the sage domain hue on the breath clock — the single obvious
  focal point. Bloom lifts it (`bloomPeak 1.4`). The **amber cursor** blinks slowly.
- **It responds, honestly.** Selecting `coding-desk` eases the camera in (`focusFillDistance 6.5`) and plays a
  **warm acknowledgment**: the screen warms up, one **new colorful line of code types on** and the cursor
  jumps, the **RUN key depresses with a soft chunk**, **Claude blinks and gives a little wave**, a soft chime,
  and an **honest** line appears — *"The workshop's warming up — new builds are coming. For now, tap the keys,
  say hi to Claude, and look around."* No fake lesson, no quiz, no modal dead-end. Copy in `TYPOGRAPHY`
  (Fredoka display).
- **It is provably live.** The interaction toggles a small `peeked` room-state so
  `window.__qa.stateHash()` **changes** on contact (SC-CORE-14) — *before any content exists*.
- **When content lands** this same hotspot swaps its handler to `openDesk()` → `<ContentHost>` (the
  Brilliant-style Coding Desk app, zone-code-v2 Part B) — **no movement/layout/flow change.**
- **Never coercive.** No countdown, no "check back in N days," no badge, no score. Warmth is invitation.

### 4.4 Why the desk, not a bare computer

A bare computer on a bare table reads as "an office / a lab" (a sterile tell). Setting a **real, warm
monitor + a chunky keyboard + a sticker-covered laptop** into a **honey-wood maker's desk**, with a **plush
Python**, an **AI desk-buddy**, and a **codeable robot** beside it, is what makes CODE legible as *a warm,
kid-recognizable craft* in ≤1 second — the whole operator brief. It says *"a cozy place where a kid codes,"*
not *"a battlestation,"* not *"a steampunk inventor's shop."*

---

## 5. Materials — the cozy-coding treatment

**One shading model** across the room (Pillar A): **flat PBR** (`MeshStandardMaterial`, low metalness, baked
AO on a shared gradient atlas) — or toon, chosen once world-wide and held. **No `MeshBasicMaterial`, ever.**
The look is **satin, never plastic** (roughness never below ~0.35 except the single brightest brass glint on
the RUN key / under the desk lamp). Screens read as **soft warm emissive**, never a cold glossy slab. Every
hero surface shows **≥3 detail bands** (macro silhouette · meso 2–20 cm · micro normal/rough), per art bible §4.

| Material | Macro | Meso (~2–20 cm) | Micro | Tint target | Lives on |
|---|---|---|---|---|---|
| **Warm screen (emissive)** | rounded warm bezel, slight screen curve | the lines of **colorful code** / block-code, a sticky note on the bezel, a webcam nub | faint glass dust; a soft even glow (no scanline gimmick, no cold sheen) | warm-dark bg (`woodCocoa`-espresso) + syntax `hue.code`/`beacon`/`spark`/`sprout`/`parchment` | monitor, laptop |
| **Keycaps / satin plastic** | chunky keyboard, keycap grid, the big RUN key | legends, a worn spacebar, the oversized amber RUN cap | satin PBT nap (roughness ≥0.4 — **never glossy**) | `woolCream`/`ceramic` caps + `sprout`/`beacon` accents + `brass`/`spark` RUN | keyboard, mouse |
| **Soft toy / felted plush** | rounded Claude buddy, coiled plush Python, soft shelf-bots | stitch seams, felt nap, a little embroidered face | fuzzy diffuse, **zero specular**, soft rim | warm `woolCream`/`candle` (Claude); warm `sprout`/`forestPine` (Python) | Claude, plush Python, soft toys |
| **Stickers / decals** | laptop lid, crate, water-bottle | language logos (Python/JS/HTML5/CSS/Git/♥), curled corners | matte vinyl, a slight edge-lift | palette-tuned warm logo hues | laptop lid, crate, notebook |
| **Aged wood** | chunky desk, round log ends, beams | plank seams, tool-chamfered edges, a knot, worn corners | grain; waxed sheen on handled edges | `woodHoney`→`woodWalnut`; foreground `woodCocoa` | desk, shell, stool, shelves |
| **Brass / copper** | desk lamp, RUN key, kettle, hardware | dents, engraving, solder seams | satin anisotropic sheen + **verdigris** in crevices | `brass` + `verdigris` cavities | lamp, RUN key, kettle, hinges |
| **Worn leather** | slouched stool seat, book covers, headphone band | scuffs, stitch lines, a buckle | low broad specular, edge patina | `leather.worn` | stool, manuals, headphone |
| **Knitted wool** | soft rug sag, folded blanket, beanbag, hoodie | chunky knit ribs, fringe, a dropped stitch | fuzzy diffuse, zero specular | `woolWarm` (jitter → sage/rust/cream) | rug, blanket, cushion, hoodie |
| **Paper / parchment** | curled printout corners, book pages | fold creases, torn edge, pin-holes | soft fiber, faint edge translucency | `parchment` | printouts, notes, zines, tags |
| **Warm ceramic** | thrown mug/pot, laptop case, a chip | glaze pooling, a ring stain | satin glaze highlight | `ceramic` | mug, pots, laptop case |
| **Iron / patinated metal** | stove body, stove-pipe | soot near the fire, rivets | matte with a damp low sheen | `woodCocoa`/iron; `verdigris` pipe | stove, pipe |
| **Glass** | monitor/laptop screens, jars, gable, terrarium | rim highlight, faint dust | low-alpha; **warm emissive** for screens (never cold transmission) | `duskWindow` (cool, gable/jars) / warm emissive (screens) | screens, jars, gable, terrarium |
| **Foliage** | rounded low-poly sprouts, vine | leaf clusters | soft backlight translucency | `forestPine`/`moss`/`sprout` | plants, vine, moss |

**Per-instance variation law (Pillar C):** keycaps, books, bulbs, stickers, code-blocks, sprouts, finished
creations, cables, scatter all get hue/value/scale/rotation **jitter**; a fraction show extra wear/a curled
corner/a dropped stitch. **A grid of identical keycaps or cloned mascots is a fail.** One shared gradient
atlas per kit → batching (§8.2).

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
   gable**, landing on the Coding Desk. Long, soft golden shadows.
3. **Warm key #2 — the wood-stove (diegetic heartbeat).** Emissive firebox (`fireEmber #FF7A3C` →
   `fireFlame #FFB25A`) **+ one cheap non-shadow `pointLight`** in the firebox. **Flicker** = emissive-intensity
   + point-light sine w/ noise on the breath clock (reduced-motion → steady glow). Bloom lifts it.
4. **Warm practicals #3 — the monitor & laptop screens, the desk lamp, the string of bulbs, the shelf
   desk-lamp, Claude's friendly face-glow** — **emissive materials only** (sage `#5FB98C` + amber for screens;
   `candle #FFE0A8` lamp; `lantern #FFD166` bulbs; `beacon #FFD166` shelf lamp), no extra real lights; they
   give bloom its sparkle. **All warm** (§6.4).

### 6.2 The cool fill (Pillar B — no dead shadow)

A hemisphere: `hemiSkyHex #A9C2E8` (cool dusk-blue) over `hemiGroundHex #C67B48` (warm rust/wood bounce),
`hemiIntensity 0.52`. Result: **no shadow goes dead** — shadowed honey wood under the dusk fill resolves to a
soft **blue-violet-brown**. **0 desaturated-gray shadow samples** is a hard floor (§9).

### 6.3 Shadows, fog, post

- **Frozen shadows only:** `<AccumulativeShadows>` + `<RandomizedLight>` for a settled soft hero shadow under
  the desk (zero cost once composed); `<ContactShadows frames={1}>` under stove/shelf/stool/nook; `<BakeShadows>`
  elsewhere. **≤1 shadow-caster**, never per-frame.
- **Palette-matched fog:** `fogHex #E0C79A`, `fogNear 14 / fogFar 46` — ties the kit pieces into one warm
  atmosphere and carries the golden shaft. **For cohesion, never to hide the far clip** (banned).
- **Post (shared `EffectComposer`, renderer `NoToneMapping`):** `Bloom(mipmapBlur, luminanceThreshold ~1.0)`
  (stove · bulbs · desk lamp · monitor · laptop · RUN key) + `Vignette` + `ToneMapping(ACESFilmic)`; **SMAA
  not MSAA**; 2–3 passes. `bloomPeak 1.4`, `exposure 1.05`. **Bloom has one warm job** — never a cold job.
- **The golden shaft is the hero detail** — one soft god-ray from the window/gable carrying **dust motes**
  (`<Sparkles>`, sparse). This one detail sells "workshop at golden hour" more than any prop.

### 6.4 The warm/cool split — the **no-cold-blue-screen** rule

The room needs a warm/cool split (Pillar E) *and* the operator + art bible forbid cold-blue screen glow. The
tension resolves by carrying the split with **light, not screens**:

- **Warm owns the lit half:** golden key + stove + practicals + **the sage/amber monitor & laptop** (sage
  `#5FB98C` is a *warm-leaning* green, not cold blue; syntax colors are amber/sage/sprout on a warm-dark bg).
  Bloom has **one warm job**.
- **Cool owns the shade half:** the dusk-blue skylight fill tints every shadow blue-violet — *that* is the
  cool half, done by lighting.
- **The one cool practical is tiny and restrained:** a faint **verdigris `#7F9E8E`** (not `tide` cyan)
  status-LED on **Sprout's charging dock only** (§3.8) — small, low, **off the hero**, never a cold-blue wash
  near the desk. `PALETTE.tide #5EC8D8` is permitted *only* as this pin-point accent, desaturated toward
  verdigris (it also honors the art-bible exterior's faint "cool tool-glow" hint without letting cold blue
  inside). **A cold-blue-lit room, a cold RGB-strip battlestation, or a monitor/laptop glowing cold blue is a
  banned outcome** (§10).

---

## 7. Ambient life + code-flavored micro-interactions

### 7.1 The breath clock (Pillar G — one heartbeat, aliveness §5.1)

One slow oscillator (`AMBIENCE.breathMs 8000`) sampled with per-element phase offsets drives the fire glow
(±8%), the window/monitor/laptop flicker (≤3%), the plant/vine sway (a few px/deg), and the on-screen cursor
blink. **One uniform in a single `useFrame`**; reduced-motion → freeze at mid-phase. The fire is the
heartbeat; the room breathes as one body.

### 7.2 Always-on ambient motions (floor: ≥3 + the breath, art bible §9)

1. **Fire flicker** in the wood-stove (emissive + point-light on the breath).
2. **Dust motes** drifting in the golden shaft (`<Sparkles>`, sparse — 60 / 24 / 0 per tier).
3. **The blinking amber cursor** + a gently scrolling line on the monitor (on the screen atlas — a constant,
   very "coding" pulse; 0 extra draw calls).
4. **Claude's idle** — a slow blink + a tiny breathing bob every few seconds (cheap transform, not skinned).
5. **Sprout's idle wind-down twitch** every few seconds (a tiny skinned-mesh anim, the lone skinned mesh).
6. **Plant/vine sway** (`<Float>` on the hanging pot + the trailing vine) + **the cat's slow breathing** on
   the sill (a subtle scale pulse).

*(6 always-on, well past the ≥3 floor. All on `frameloop="demand"` with bounded invalidation; a backgrounded
room drops to 0 GPU.)*

### 7.3 The signature micro-interactions (cozy code-flavored, **signal-free**)

Each obeys the **cozy-juice grammar** (aliveness §4.1): *anticipation → warmth-bump → a soft particle → one
gentle sound → settle*. **Firewall (aliveness §1.2): none of these emit an `ActivityEvent`.** They are pure
delight with a soul; `emitsSignal: false` is a compile-time invariant and QA asserts **zero** signals from
them (§8.5). Reduced-motion → instant state change + sound + a static warmth-bump. **None is on the doorway:**
the keyboard, Claude, Sprout, the string-lights, and the stove are delights; only the **monitor "step up"** is
the doorway (§4.1) — a delight never opens content and the doorway is never a mere delight (aliveness §7.5).

| # | Delight | Hotspot | The interaction | Juice (tokens) | Sound | Signal |
|---|---|---|---|---|---|---|
| 1 | **Tap the keyboard** | `keyboard` | tap the keys → a soft key-clack and **a colorful new line of code types onto the monitor**, char-by-char, the cursor jumping (cosmetic only — no content opens) | `keyClack` (new; per-key press + `typeOn` reveal), sage/amber syntax warmth-bump | soft mechanical *clack-clack* (pitch-jittered) | **NONE** |
| 2 | **Wave at Claude** | `claude-buddy` | tap/wave → Claude **blinks, waves a little arm, and its face warms**, a friendly bob | `waveBack` (new; squash + blink), amber face-glow warmth-bump | a warm little *chirp / "boop"* | **NONE** |
| 3 | **Snap a code block → Sprout runs it** | `sprout-robot` | drop a block in the tray → the block clicks in, Sprout **whirrs and runs the little program** (rolls the track, turns, rings a tiny bell at the goal), then settles | `blockRun` (new; block snap + skinned run along a baked path), `spark` warmth-bump on the goal bell | block *click* + a soft *whirr* + a bright *ding* | **NONE** |
| 4 | **Flip the light-chain switch** | `language-nook` | flip the brass switch → the string of bulbs **chases on one-by-one in sequence** (a "sequence/loop" wink), then holds warm | `chainChase` (new; staggered `lanternLight` ramp), bloom-bump per bulb | soft *tick* + a rising *fwoomp…fwoomp* chain | **NONE** |
| 5 | **Stoke the wood-stove** | `wood-stove` | tap → a poke, **embers swirl up**, the fire **swells brighter ~2s** then eases back (the shared-hearth beat) | `hearthStoke` (aliveness); ember burst `fireEmber→fireFlame`; emissive+point-light bump | crackle-pop + a low *whoomph* | **NONE** |

**Supporting lighter delights (same grammar, smaller):** **squeeze the plush Python** (`language-nook` /
desk → a soft *hiss* + a wiggle); **pet the sill-cat** (`window-sill` → sits up, slow-blink, purr); the
**kettle** steams + a faint whistle on approach; the **desk lamp** clicks warmer; **press the RUN key**
directly (a soft chunk + the on-screen code "runs" a step — distinct from the doorway "step up," it changes no
state). Each signal-free.

**Anti-dead-prop rule (aliveness §4.3):** anything that *looks* tappable **must** respond (a subtle idle
glint/sway marks it "alive"); pure scenery stays still and invites no tap. The doorway (`coding-desk`) is the
**only** thing that will emit/open content later; the delights above **never** do (the delight/doorway
firewall).

### 7.4 New additive motion kinds (proposed, reduced → instant)

Add to `MOTION`/`ANIMATED_MOTION`/`REDUCED_DURATION_MS` (`interest-lab-view/src/motion.ts`), consistent with
the shipped scale; reuse the aliveness `WORLD_MOTION`/`MicroInteraction` schema.

| New `MotionKind` | durationMs | easing | Reduced |
|---|---|---|---|
| `keyClack` | 500 (+ `typeOn` stagger) | `pop` | instant |
| `waveBack` | 600 | `pickSpring` | instant |
| `blockRun` | 1200 | `move` | instant |
| `chainChase` | 700 (staggered) | `enter` | instant |

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
| **Coding Desk, stool, shelves, bookshelf, pegboard, crate, kids' table** | **Kenney Furniture Kit** + **KayKit** furniture | instanced/merged; tint to palette |
| **Computer** (monitor, keyboard, mouse, laptop, headphones, cables) | **Kenney** (Tech/Furniture) + **Quaternius** props; **Poly Pizza** one-off gap-fillers (verify per-model CC0) | warm-tint the cases; screens = authored emissive atlas; keycaps one InstancedMesh |
| **Wood-stove, kettle, logs, lamp, string-lights** | **Kenney** (Survival/Holiday) + **KayKit** props | stove/lamps = emissive; bulbs one InstancedMesh |
| **Books, mugs, jars, stickers, code-blocks, printouts, mascot toys** | **Kenney** + **Quaternius** props; authored decals/atlas for logos & blocks | instanced repeats w/ jitter; **verify CC0** on any gap-fill |
| **Claude buddy + Sprout robot + finished creations + the cat** | **Quaternius** (robots / animated animals) + **KayKit** (160+ CC0 anims); a **CC0/authored** friendly buddy mesh for Claude | **one skinned mesh max** (Sprout); Claude + shelf-bots + cat placed static (Claude/cat = tiny idle) |
| **Plush Python + soft toys** | authored low-poly + felt texture (CC0 PBR) | felted-wool material; instanced-toys |
| **Plants, vines, sprouts, moss** | **Quaternius** (Stylized/Ultimate Nature) + **Kenney Nature Kit** | sprouts instanced; vine `<Float>` |
| **Warm-interior HDRI** | **Poly Haven** (1–2K, self-hosted) | the single `<Environment>` IBL — the cohesion lever |
| **PBR textures** (wood, knit, leather, brass, parchment, iron, felt) | **Poly Haven** + **ambientCG** (CC0) | 512–1K → KTX2; the meso/micro bands |
| **Screens / code / block-code / chalkboard / portrait / signs** | authored flat SVG/atlas (emissive) | shared with the content app's block icons; the colorful syntax + block-code + Claude portrait live here |

### 8.2 The draw-call budget (target < 50; hard cap 80)

Instancing + a merged shell + one shared atlas keep it low. Estimated steady-state:

| Group | Draw calls | How |
|---|---|---|
| Shell (walls + beams + floor) | **2** | drei `<Merged>`, one atlas |
| Glass gable + window glass + god-ray shaft | **3** | glass (1) + window (1) + shaft quad (1) |
| Coding Desk (body) + monitor & laptop screens | **2** | body (1) + shared screen emissive atlas (1) |
| Wall furniture (bookshelf + pegboard + Shelf, merged) + chalkboard + corkboard/Claude-portrait boards | **3** | `<Merged>` static group + 2 emissive/atlas boards |
| Wood-stove body + firebox emissive | **2** | body (1) + emissive (1) |
| Sprout (the one skinned mesh) | **1** | skinned |
| Claude desk-buddy (small static + tiny idle) | **1** | static + cheap idle |
| Small statics: stool + rug + cable crate + hanging pot + kids' table | **5** | small statics |
| **Instanced repeats** (10 `InstancedMesh`): keycaps · books/manuals · language-mascots+stickers · finished creations · bulbs (string-lights) · potted sprouts · code-blocks · cables · paper (printouts/notes/tags) · floor scatter | **10** | one mesh+material each, per-instance jitter |
| Desk lamp + shelf desk-lamp | **2** | emissive practicals |
| `<Sparkles>` motes | **1** | |
| Frozen shadows (`Accumulative`/`Contact frames={1}`/`Bake`) | **~0** | composed once |
| Post (`EffectComposer`: Bloom+Vignette+ACES) | **1** | one fullscreen pass |
| **Total** | **≈ 33** | comfortably < 50 (hard cap 80) |

Perf discipline: `dpr={[1,1.5]}`, `antialias:false` + SMAA, `frameloop="demand"` (idle room ≈ 0 GPU),
`<PerformanceMonitor>` + `<AdaptiveDpr>`; textures props 256–512² / hero ≤1024², KTX2, one shared atlas;
triangles ≤ ~150k. Dispose on unmount.

### 8.3 Instancing plan (the perf multiplier)

Everything that repeats is **one geometry + one material, many transforms** (drei `<Instances>` for
declarative counts; raw `THREE.InstancedMesh` if any count grows). Per-instance **jitter** (hue/value/scale/
rotation) on keycaps, books, bulbs, stickers, code-blocks, sprouts, finished creations, cables, scatter, paper
— so it reads hand-made, never cloned. Share the KayKit gradient atlas so `<Merged>` can batch the static
shell + furniture.

### 8.4 Tier degradation — the accessible floor

Driven by the resolved render tier. The **frozen** `RoomProps.tier` is `"room-3d" | "room-3d-lite"` (core-spec
§3.2); **below** the 3D floor the host renders `ActivityDOM` instead (the a11y peer). The shipped
`resolveRenderTier`/`RenderTier` alias is `quest-world-3d` / `quest-world-3d-lite` / `board-2d` (the naming nit,
art bible §15):

- **`room-3d` (full):** everything above; motes 60; bloom on; frozen shadows; the shaft + god-ray.
- **drop step:** drop `<Sparkles>` → drop `Bloom` → flatten lights.
- **`room-3d-lite`:** flat lights (no shadow-caster), no post, motes 24, the shaft as a static emissive
  gradient, micro-interactions still work (instant + sound). Draw calls fall further (merge more).
- **`board-2d` → the `ActivityDOM` described room (a true peer, not a lesser menu — gameflow §4.5):**
  - A labeled region: *"The Tinker Workshop — a cozy cabin where you code. Golden light through a glass roof;
    a warm wood desk with a computer whose screen glows with colorful code; a wood-stove in the corner."*
  - **"← Back to the clearing"** first. Then the **doorway**: **"Step up to the Coding Desk"** (the primary
    control — a monitor showing colorful code, a mechanical keyboard with a RUN key, a sticker-covered
    laptop). Then ambient "look" entries: *"The keyboard — tap it and a line of code types on"; "Claude, your
    AI coding friend — wave and it waves back"; "Sprout the robot and a tray of code blocks — snap one in and
    it runs"; "A wood-stove glows warm"; "The language nook — books for JavaScript, HTML, CSS, and Python, and
    a string of lights"; "A shelf of little things you made"; "A cat asleep on the sunny sill."*
  - Each `live` hotspot is keyboard-operable; the doorway announces the honest warm line; reduced-motion →
    instant framing, fire = static glow, motes off, doorway pulse = static glow, cursor static.
  - **Parity by construction:** the `{hotspotId, label, role, primary}` set operable via `ActivityDOM`
    **equals** the `window.__qa.interactives()` set (SC-CORE-11). No 3D-only or DOM-only affordance.

### 8.5 `window.__qa` (dead-primary-action proof)

```ts
window.__qa = {
  ready, error, settle(frames = 2),
  scene,                                   // r3f state.scene (the room)
  primaryActionAlive: () => boolean,       // coding-desk "step up" toggles peeked / opens content later
  interactives: () => [
    { id: "coding-desk",   kind: "doorway", worldPos: [0, 1.15, 0.1] },  // the ONE primary
    { id: "keyboard",      kind: "ambient", worldPos: [0, 1.0, 0.3] },
    { id: "claude-buddy",  kind: "ambient", worldPos: [0.6, 1.05, 0.15] },
    { id: "sprout-robot",  kind: "ambient", worldPos: [-1.3, 0.7, -1.7] },
    { id: "wood-stove",    kind: "ambient", worldPos: [4.6, 1.0, -3.6] },
    { id: "language-nook", kind: "ambient", worldPos: [-3.8, 1.2, -1.0] },
    { id: "shelf",         kind: "target",  worldPos: [5.4, 1.8, -2.4] },
    { id: "window-sill",   kind: "ambient", worldPos: [-4.4, 1.6, -3.8] },
  ],
  stateHash,          // {desk-peeked, code-typed, claude-waved, sprout-running, chain-lit, stove-stoked, shelf-count}
  getEmittedSignals,  // firewall: MUST record 0 new events from any §7.3 delight
};
```

**Gate round-trips (hard-fail if dead):** project `coding-desk` → dispatch a real pointer event → assert
`stateHash()` changed (peeked). **Firewall (negative):** fire every §7.3 delight (keyboard clack, wave at
Claude, snap a block, the light-chain, stoke the stove) → assert `getEmittedSignals()` records **zero** new
`ActivityEvent`s.

---

## 9. Hard floors + cost ceilings

Two-sided (LAAS): a **content floor** (can't feel empty) and a **cost ceiling** (Chromebook-safe).
Under-dressing to hit the ceiling is itself a fail — **instance instead**.

| Budget | This room (`room-3d`) |
|---|---|
| **Draw calls / frame** | **≤ 50** (hard 80) — merged shell + instanced props + one atlas → **≈33** (§8.2) |
| **Distinct dressing occupants** | **≥ 40** — this set ships **53** across **10** surface classes (§3); none bare |
| **Occupied surface classes** | **≥ 6** — ship **10** (shell · window · stove · Coding Desk · language nook · wall-of-ideas · Shelf/manuals · Sprout/block-toy · plants · floor); each carries ≥3 objects |
| **Legible-as-coding read** | a **real computer** (monitor + keyboard + laptop) reads in ≤1s; **colorful legible code** on screen; **languages visible** (plush Python, book set, stickers); an **AI companion** (Claude) present |
| **Material bands / hero surface** | **≥ 3** (base + wear/AO + highlight/emissive) — §5 |
| **Warm sources** | **≥ 2** (window key + stove) + emissive practicals (desk lamp, bulbs, monitor, laptop, Claude face) |
| **Cool fill** | dusk-blue hemisphere (no dead shadow) |
| **Shadow-casters** | **≤ 1** (frozen) |
| **No-dead-shadow law** | **0** desaturated-gray shadow samples (Pillar B) |
| **No-cold-blue-screen law** | **0** cold-blue-lit hero/screen samples; monitor & laptop read sage+amber (§6.4); no RGB-strip lighting |
| **Always-on motions** | **≥ 3** — ship **6** (fire · motes · cursor-blink · Claude idle · Sprout twitch · plant/cat) + the breath |
| **Signature micro-interactions** | **≥ 1** beyond the doorway — ship **5** (§7.3), all signal-free |
| **Doorway object** | exactly **1**, sage+amber, provably live (`stateHash` changes), host-ready honest placeholder |
| **Firewall** | **0** `ActivityEvent`s from any §7.3 delight (QA negative assertion) |
| **Post passes** | 2–3 (Bloom + Vignette + ACES) |
| **Textures** | props 256–512²; hero ≤1024²; KTX2; one shared atlas |
| **dpr / loop** | `dpr ≤ 1.5`; `frameloop="demand"` (idle ≈ 0 GPU) |
| **Frame rate** | 60 target / **≥ 30 sustained** on a real Chromebook under 10-min load |

---

## 10. Banned outcomes — instant fail

Any one fails the room (art bible §11 + zone-code-v2 §A9 + aliveness §12 + the operator brief):

- **No visible computer / illegible-as-coding:** a room that **reads as a generic steampunk inventor's shop**
  (gears/automata/marble-runs) **with no visible computer, keyboard, or code**; no legible code on any screen;
  a child can't point and say "that's coding." (The whole operator ask.)
- **Cold-blue / RGB / hacker screens:** the monitor, laptop, or any hero surface glowing **cold blue**; a
  blue-lit "hacker" room; a **cold RGB gamer battlestation** (rainbow LED strips, black/neon/edgy); bloom
  doing a cold job. Warm/amber/sage only; the cool split is *light*, not screens (§6.4).
- **No AI companion:** the room ships **without Claude** (neither the desk-buddy nor the framed portrait) or
  presents the AI as cold/creepy rather than a **warm, friendly coding friend**.
- **Sterile lab / cold cabin:** a clean/empty/cold room; bare log walls; a desk on a bare floor; a server or
  office room; anything that reads as "a computer lab" instead of *a warm maker's cabin where a kid codes*.
- **Dead lighting:** gray or black shadows; flat ambient-only; **no fire and no window shaft**; blown/muddy
  exposure.
- **Two competing focal points / no obvious doorway:** the keyboard/laptop/Claude glowing as bright as the
  monitor (they must be lower, matte; the monitor is the sole primary, §4.1); a room where the one warm verb
  isn't obvious in ≤1s.
- **Dead or dishonest doorway:** a "coming soon" wall that changes nothing (`stateHash` static → SC-CORE-14
  fail); a placeholder that **fakes** a lesson/quiz behind the desk.
- **Firewall breach:** any §7.3 delight (keyboard clack, wave at Claude, Sprout run, the light-chain, stoking
  the stove) that **emits a signal** or is **counted / rewarded / badged / streaked**; a "lines coded: 42" meter.
- **Plastic, not satin:** glossy plastic-shine on wood/wool/ceramic/leather/brass/keycaps/screens;
  `MeshBasicMaterial`; fullbright; untinted default-gray `MeshStandardMaterial`.
- **Incoherence / asset-soup:** mixed CC0 kits at different scales/palettes, untinted; **cloned props** (one
  mesh varied only by rotation/scale — e.g. identical keycaps or mascots); grid-perfect placement; visible
  texture tiling.
- **Arcade juice:** screenshake, confetti, big pops, saturated flashes on any micro-interaction (cozy only).
- **Camera crimes:** free-fly / unclamped orbit / zoom / WASD; remounting the `<Canvas>` per room.
- **Chromebook slideshow:** >50 draw calls, `dpr>1.5`, per-frame shadows, fog to hide the far clip, sustained
  <30 fps.
- **Accessibility crimes:** an `aria-hidden` canvas as the only surface; the `ActivityDOM` peer as a lesser
  flat menu (it must describe the computer, the languages, and Claude); color-only state; essential motion
  under reduced-motion; a broken (not calm) reduced-motion still.

---

## 11. Self-score rubric — anchored to RF-INT-CODE

Per row: **10** = passes a one-second glance beside RF-INT-CODE (A Short Hike interior / Ghibli desk / Stardew
/ a warm cozy-coding-desk photo) at 1080p on a Chromebook; **7** = clearly synthetic but the same class; **4**
= decent hobby demo; **2** = a pile of default-material CC0 assets. **Score every phase; for each row write
"what raises this +2"; implement the two cheapest before proceeding** (the LAAS loop). Delta loop: render the
closest shot to RF-INT-CODE / RF-INT-CODE-2 → side-by-side → `DELTA.md` top-10 ranked → fix top-3 → re-render
→ close phase.

Rows:

- **Workshop warmth & coziness** (do I want to code in this room? — not a lab, not a battlestation)
- **CODE legibility (the 1-second read)** (is it unmistakably *a cozy place where a kid codes* in ≤1s?)
- **Real-computer read** (the monitor + keyboard + laptop read as today's coding — warm, kid-recognizable)
- **Languages visible & playful** (plush Python, JS/HTML/CSS/Python books, stickers, block-code — a kid names it)
- **AI-companion warmth** (Claude reads as a friendly coding friend; the framed portrait is wholesome)
- **Firelight & light transport** (warm key + stove + cool dusk fill; **no dead shadow**)
- **No-cold-blue discipline** (screens warm sage+amber; the split is light, not screens; no RGB)
- **Dressing density & lived-in feel** (≥40 occupants, ≥6 surface classes, someone-just-coded-here)
- **Material quality** (aged wood/brass/leather/knit/parchment + satin keycaps + soft plush + warm screens; ≥3 bands)
- **Palette / color-script discipline** (everything on the §3.1 CABIN scale; warm/cool split holds)
- **Doorway-object obviousness** (the one warm-glowing monitor/desk, provably live, honest placeholder)
- **Ambient motion & life** (fire, motes, cursor blink, Claude, Sprout, plant — one second from motion)
- **Micro-interaction satisfaction** (keyboard clack + code-type / wave at Claude / block→Sprout feel *good*, cozy not arcade)
- **Signal-free integrity** (the firewall holds — 0 signals from delights)
- **Map↔cabin continuity** (same sage hue + same fire carried across the entry cut)
- **Accessibility parity** (the `ActivityDOM` peer is a true equal, describing computer + languages + Claude)
- **Chromebook perf** (`<50` draw calls, `dpr≤1.5`, frozen shadows, ≥30 fps sustained)

---

## 12. Build / integration notes (how the set lands)

- **Owned by** `passion/packages/interest-zone-code/` (deferred content package; the room shell lands with
  Lane G / the world build). The single shared-root touch is the zone registry line.
- **Consumes as its art contract (no contract breaks):** the warm `SCENE3D` pack + `CAMERA3D` (verbatim) +
  `HUE_RAMP[1] #5FB98C` + the additive `CABIN` palette + `MOTION`/`resolveMotion` + the `RoomHotspot` helper
  (gameflow §11) + the aliveness `AMBIENCE`/`MicroInteraction` schema. This doc adds **values + placements +
  4 new `MotionKind`s** (`keyClack`, `waveBack`, `blockRun`, `chainChase`), nothing structural.
- **The seam:** `coding-desk` is the host-ready doorway now (toggles `peeked`); when content lands it swaps
  its handler to `openDesk()` → `<ContentHost>` (zone-code-v2 Part B) with **no layout/flow change** (the desk
  *is* the old Build Bench, grown into a real workstation — the seam is unchanged).
- **Phase order (mirrors zone-code-v2 §D3 P5–P7):** shell + lighting + palette + HDRI + frozen shadows
  (RF-INT-CODE) → dress to the floor (≥40 occupants: the computer, the languages, Claude, Sprout) + the 5
  micro-interactions + ≥3 motions → the Coding Desk doorway + `ActivityDOM` peer + the entry transition. Each
  phase closes with the reference-delta loop + self-score + the firewall negative assertion.

### Acceptance — the one-frame test (this room's slice of the world two-frame test)

Render **RF-INT-CODE ("The Sunlit Coding Nook")** and place it beside the reference. If a viewer's eye snags
within one second on a **category error** — a steampunk shop with no visible computer/keyboard/code,
cold-blue/RGB screens, no AI companion, a sterile/cold lab, dead/gray shadows, default-material gray, plastic
shine, an incoherent kit-pile, no obvious Coding Desk, or no fire — **the task is not done. Iterate the delta
loop.** Then the operator free-explores on `localhost` for the final human sign-off (and, ideally, an
8-year-old taps the keyboard to watch code type on, waves at Claude, and snaps a block to run Sprout *just
because*).
