# Interest Lab — Zone: Music Studio (design **v2**, LAAS-deep)

**Date:** 2026-07-21 · **Owner:** David · **Zone:** `passion/packages/interest-zone-music`
**Domain:** `sound_music` (child-facing: *"audio / sound"*) · **Lane:** 1 (parallel)
**Supersedes:** [`2026-07-21-zone-music-design.md`](./2026-07-21-zone-music-design.md) (v1). v1's engine
discipline (anti-broccoli guardrails §4, the `Loop` artifact §5, the four work-modes §6, the emission
table §7, the QA contract §12) is **kept and re-homed**, not thrown away. What changes is the
**architecture** (§2) and the **depth of the visual + content bar** (this whole doc).

**Builds against:** the frozen `ZonePlugin` / `RoomProps` / `ActivityEvent` contract from
[`2026-07-21-interest-lab-core-spec.md`](./2026-07-21-interest-lab-core-spec.md) §3, the hybrid
2D-map + bounded-3D-room world from
[`2026-07-21-interest-lab-world-design.md`](./2026-07-21-interest-lab-world-design.md), and the CC0
art-direction pipeline in [`../../research/stylizedWorldAssetPipeline.md`](../../research/stylizedWorldAssetPipeline.md)
(one HDRI + palette + fog + bloom, `<50` draw calls, Chromebook-safe).

**Depth model = LAAS** (`github.com/Braffolk/fable5-world-demo`, `PROJECT_LAAS_v2.md`). We adopt LAAS's
**method** — a concrete visual bar set by *named reference frames*, hard floors, explicit **banned
outcomes**, a self-score rubric, and a mandatory **reference-delta loop** — and obsess over *what the
scene actually contains*. We **invert LAAS's target**: LAAS chases UE5 photoreal on WebGPU; we chase
**cozy stylized on a school Chromebook via CC0 assets**. Same rigor, opposite bar. Where LAAS says
"geometry, not textures," we say "cohesion + light, not polycount" — and say so honestly (§A.2).

---

## 1. The bet (v2, one line)

A child sees a warm little studio glowing amber at dusk on the map, **steps inside** a cozy bounded-3D
room where *a beat is already breathing on a wall of light*, taps a pad and hears it change — and when
they want to know **why** it sounds like that, they walk up to the console and **open the door into a
Brilliant-style, hands-on audio app** where *manipulating sound is the explanation*: they pull a
harmonic and hear a flute become an organ, drag a filter and hear it go dark, shape an envelope and hear
a pluck become a pad — then play a phrase with the very instrument they just built. **Two layers, one
signal:** the world reads *that* a child returns to sound; the app reads *what kind of sound-work* they
return to (build / perform / debug / compose).

---

## 2. The architecture pivot (the reason this is v2)

v1 collapsed **everything** into the 3D room — the Groovebox *was* the atmosphere, the deep activity,
and the probe, all on one surface. v2 splits into two layers with different jobs:

| Layer | What it is | Its job | Its medium |
|---|---|---|---|
| **1 — The Discovery World** | the 2D map building + a **beautiful bounded 3D room** with a live *taste* of making sound and a **doorway** | **exploration, atmosphere, and the interest signal** — *not* to hold the deep learning | DOM map + one persistent WebGL `<Canvas>` (the room) |
| **2 — The Domain Content App** | a **Brilliant-style, hands-on audio-learning app** ("how audio really works") opened *from* the room | the **deep content** + the fine-grained work-mode signal | DOM + SVG/Canvas2D + Web Audio (**no WebGL needed**) |

**Why split.** (1) It matches the whole-product pivot (world = signal + atmosphere; content app = depth).
(2) It is *cheaper and safer on a Chromebook*: the expensive medium (WebGL) is confined to one small,
mostly-static room, and the deep content is cheap 2D/Web-Audio that never contends for the single WebGL
context (the room pauses while the app is open — hybrid memo §5). (3) It **enriches the signal**: the app
exposes many cells (lessons × work-modes) to drift back to, so voluntary return is read at *two grains*
(§C.2), sharpening row-vs-column.

**The anti-broccoli reconciliation (non-negotiable, the thing most likely to go wrong).** A "pretty
lobby with a door to the *real* app" would rebuild v1's exact failure — *decorative 3D / chocolate-covered
broccoli / quiz behind a pretty door* (precedents §1.3, world-design §1). Three rules prevent it:

1. **The room's taste is genuinely live** — tapping a pad on the wall makes an audible + visible change
   and moves `stateHash()` (§A.8, §C.4). The primary surface is never a dead `aria-hidden` canvas.
2. **The door opens *more of the same doing*, not a different genre.** Behind the door is hands-on
   audio *making and shaping* — never a form, quiz, or wall of text. The verb is continuous:
   **touch sound → hear it change** in the room *deepens into* **shape sound → hear why** in the app.
3. **The artifact bridges both layers.** The instrument voice the child shapes in the app *is* the sound
   the pads play in the room; saved sounds/loops appear on the **same Shelf** in both. The seam is a
   *deepening of one activity*, not a hand-off between two products.

> **Domain binding (read once).** The frozen core registers zones by a `Domain` string that must be in
> `V1_DOMAIN_ORDER = ["sound_music", …]`, and the goldens use `sound_music`. So `ZonePlugin.domain =
> "sound_music"` and every emitted `ActivityEvent.domain = "sound_music"`. We say **"audio"** in prose
> and to children; the wire value is `sound_music`. (This corrects a v1 prose inconsistency; it does not
> change the frozen contract.)

---

# PART A — THE WORLD LAYER: the Music zone visual / scene bar

> LAAS rule imported: *"A result that looks like a 2010 tech demo is a failed task, no matter how clean
> the code."* Our failed task is **an empty grey box with a grid on the wall.** The bar below exists so
> that outcome is unshippable.

## A.1 The visual bar — reference frames ("this is the bar")

Reference images are authored up front and committed to `passion/packages/interest-zone-music/reference/`
(synthetic/CC-licensed frames + moodboard, per the world-design's "one locked art-direction pack"). Every
visual phase is judged **against these frames**, side-by-side, not against "pretty good for a browser."

**The reference set (cozy dusk music studio):**

1. **A Short Hike** — golden-hour warmth, low-poly cohesion, palette-matched fog, soft rim light. *The
   atmosphere + grade bar.*
2. **Unpacking** — a small room that tells a whole life through its objects; warm practical lamps. *The
   "the room is lived-in / nothing is bare" bar.*
3. **The "lo-fi beats to study to" room** (dusk window, gooseneck lamp, vinyl, plants, soft glow). *The
   mood/vibe bar — the feeling we are actually selling.*
4. **Sayonara Wild Hearts / Tetris Effect** — music made visible as neon bloom; sound-reactive light.
   *The pad-wall glow + playhead bar.*
5. **Animal Crossing: New Horizons / Alba** — friendly rounded readable forms; cheerful, safe. *The
   shape-language + legibility bar.*

**Mood, in one line:** *the golden twenty minutes after sunset when you finally sit down to make
something.* Cozy, safe, a little magic — never the moody/pro-studio references.

### The hero frame — "Dusk in the Studio" (obsess over what the scene contains)

Fixed camera, ~40mm-equivalent (`fov ≈ 40`), framing a low mixing console head-on and slightly above; the
pad wall rises behind it; the window glows at frame-left. **Read this as the shot the scene must produce:**

- **Foreground — the dark frame (repoussoir):** the near edge of a warm-wood desk, just out of the key
  light — a coffee-ringed mug, a coiled cable, over-ear headphones resting on their side, two sticky
  notes (one with a scribbled smiley), a small succulent in a chipped pot. This dark near-edge frames
  the shot (value structure, §A.4-E).
- **Midground — the lit subject:** the **mixing console** (a low desk unit: a few knobs, two faders, and
  a small glowing **screen — this screen is the doorway to the Content App**, §C.1). Behind it, the
  **pad wall**: a rounded grid of pads set into a warm panel, two or three already *breathing* amber, a
  luminous **playhead** line resting at column 1. A gooseneck **desk lamp** throws the warm key-light
  pool across the console. A cushioned **stool** sits pulled out — *someone works here.*
- **Background — the luminous depth:** a **window** onto a dusk skyline / tree silhouette in a
  teal→amber gradient; warm **string-lights** along the top edge; a **shelf** of vinyl + cassettes
  (the Shelf, §B.5); a **hanging plant**; an **acoustic-foam** accent panel; a wall clock; one small
  framed poster. Faint **dust motes** drift in the last shaft of window light.
- **Palette (the color script, §A.4-E):** amber/honey **key** (`#E8A15A`, keyed to the map hue
  `#E8825A`), teal-cyan **shadow fill** (`~#2E4A54`), warm near-white **pad-glow accent**, deep cocoa
  **frame**. Restrained saturation everywhere *except* the glow.
- **Light recipe:** one warm `directionalLight` key (the lamp) + HDRI dusk ambient fill + the pad
  wall's **emissive** as a practical third source; `<ContactShadows frames={1}>` grounding console +
  stool; palette-matched **fog**; Bloom lifting the pads, string-lights, and window.
- **Motion at rest (§A.4-F):** the pad wall shimmers; the hanging plant sways on `<Float>`; motes
  drift; a record on the shelf turns slowly; the lamp breathes ~2%. *A frozen frame is one second from
  motion.* (All of it instant-off under reduced-motion.)

## A.2 The six pillars (LAAS, translated to cozy-stylized-Chromebook)

Resolve any undecided visual choice in favor of a pillar.

- **A. Cohesion, not polycount.** Beauty comes from **one palette + one HDRI + one shading model + fog +
  bloom**, not geometry (the pipeline's core bet). *We invert LAAS Pillar A on purpose — our medium is
  CC0 low-poly, not virtualized geometry.* A pile of un-tinted mixed-kit assets is the failure here.
- **B. No dead light (the warmth law).** No `MeshBasicMaterial`, no fullbright, no black/muddy-grey
  ambient. Shadows are **warm-filled** from the HDRI; the key is a warm lamp; the pads *emit*. *Rule:
  sample any shadowed pixel — if it reads desaturated grey, lighting failed.* (LAAS Pillar B, kept.)
- **C. Nothing is bare — a musician lives here.** Every surface class has occupants (desk / walls /
  shelf / floor / window). The room must read as *someone's* studio, not a box with a grid. This is the
  literal "obsess over what the scene contains" mandate. (LAAS Pillar C, cozy version.)
- **D. Depth holds (the dusk window).** A composed foreground-frame → lit-subject → luminous-background
  stack; a window with real dusk depth; fog tying it together; one cheap light shaft. No flat wall of
  stuff at one depth. (LAAS Pillars D+E.)
- **E. Art direction is enforced.** The color script (amber key / teal shadow / glow accent) and value
  structure (dark frame → lit subject → glow) are *checked*, not vibed. Dusk is the default time of day.
- **F. The room breathes.** Gentle idle motion on ≥3 elements so a still frame feels alive; honor
  reduced-motion (breath → stillness, never breakage). (LAAS Pillar F.)

## A.3 Hard floors + cost ceilings (the numbers that define the bar)

LAAS floors are *minimum* richness (triangles in the millions). Ours are **two-sided**: a *content floor*
(so the room can't be empty) **and** a *cost ceiling* (so it stays Chromebook-safe).

**Content floors — what the scene MUST contain (anti-empty-box):**

| # | Floor |
|---|---|
| 1 | **≥ 25 distinct "life" props** dressing the room, spanning **≥ 5 surface classes** (desk, walls, shelf, floor, ceiling/window). |
| 2 | **A window** with a dusk exterior **+ ≥ 1 light shaft / god-ray** suggestion (cheap: one soft plane or `Sparkles` in a cone). |
| 3 | **The pad wall:** an **≥ 8×3 instanced grid**, all in **one `InstancedMesh`**, emissive-on-tap (the live taste). |
| 4 | **≥ 1 human-presence cue** (the pulled-out stool + headphones; the 1–2 listeners in perform mode). |
| 5 | **Fog + Bloom + Vignette + ACES** always on; **≥ 1 warm key light + HDRI fill + ≥ 1 emissive class**. |
| 6 | **Idle motion on ≥ 3 elements** (plant `<Float>`, motes, pad shimmer). |
| 7 | The **console screen is a real doorway** (opening it changes `activeSurface`), never a painted prop. |

**Cost ceilings — Chromebook budget (from the pipeline + hybrid memo):**

| Budget | Ceiling |
|---|---|
| Draw calls / frame | **< 50** (hard < 100) — shell `<Merged>` (1–3) + pads instanced (1) + shelf instanced (1) + dressing instanced/atlased + listeners instanced |
| Triangles visible | ≤ ~150–300k (one small room; well under the 300–500k pipeline cap) |
| Shadow casters | **≤ 1, frozen** (`<BakeShadows>` / `<ContactShadows frames={1}>`) |
| Textures | 256–512² (hero ≤ 1024²), **KTX2**; one shared atlas material where possible |
| Post | Bloom(`mipmapBlur`) + Vignette + ToneMapping(ACES) **only**; renderer `NoToneMapping`; **SMAA** not MSAA |
| Pixel ratio / loop | `dpr ≤ 1.5`; **`frameloop="demand"`** — rAF runs only while audio plays or during a transition; static room = 0 GPU |
| Environment | **one self-hosted HDRI**, no external fetch; dispose geometries/materials on room-swap; single persistent Canvas |

## A.4 The 2D map building (the front door on the world)

On the Curiosity Map (real DOM, primary surface), the **"Music Studio"** building:

- **Art:** a cozy cottage-studio sprite whose **big window glows the warmest amber on the map at dusk** —
  you can almost see the pad-wall glow through it; a little antenna/flag with a music note; a soft rug of
  light spilling from the door. It is the most *inviting* point on the map without any "NEW!" nag.
- **Tokens:** `label:"Music Studio"`, `glyph:"note"`, `enterVerb:"Step inside"`, hue `#E8825A`
  (`HUE_RAMP[0]`), `returnState` cue (new-sparkle → "you've been here" → "you came back"), `unfinished`
  cue ("your half-shaped sound is still here").
- **Continuity:** the tile's amber + note glyph **carry into the room and into the app header** (hybrid
  memo §4 "color+emblem carries from tile → room"), so a child never loses *where am I / how do I get
  back*. Focusable button, roving-tabindex, arrow-key nav, non-`aria-hidden`.

## A.5 The 3D room — full contents inventory (the scene, itemized)

The dressing is **CC0** (Kenney interiors/furniture; KayKit props; Quaternius plants/characters; Poly
Pizza gap-fillers), palette-tinted to the color script, optimized to GLB (Meshopt + KTX2), instanced/
merged to hold the budget. Grouped by surface class (Pillar C):

- **Console + pad wall (the hero, procedural):** low console unit (Kenney) + **the pad grid as one
  `InstancedMesh`** of rounded boxes (emissive on = the glow that reads "this pad plays") + a
  **playhead** (one emissive plane translated in time, or a DOM/CSS overlay to keep `frameloop=demand`)
  + the **console screen** (an emissive quad = the doorway).
- **Desk life:** gooseneck lamp (the key light's practical), headphones, mug, coiled cable, 2 sticky
  notes, a small succulent, a couple of knobs/faders (part of the console).
- **Walls:** a framed poster, a wall clock, an **acoustic-foam** accent panel, a cork board with pinned
  scraps, draped **string-lights** (emissive → bloom).
- **Shelf (the Shelf, §B.5):** instanced **vinyl + cassettes** (one instanced mesh; label texture = the
  saved sound/loop name); a tiny practice amp; a small plant.
- **Floor:** a soft **rug**, the **stool** (pulled out), a gig-bag or small speaker cabinet.
- **Window/ceiling:** the **window** (dusk backdrop card or HDRI-driven) + hanging **plant** on `<Float>`
  + **dust motes** (`Sparkles`) in the shaft.
- **Listeners (perform mode only):** 1–2 Quaternius/KayKit CC0 characters, instanced, looped idle-bob;
  hidden in practice mode.

## A.6 Palette, lighting recipe, camera, motion (the recipes)

- **Palette:** key `#E8A15A` · shadow `#2E4A54` · frame `~#3A2A22` cocoa · accent (pad glow) warm
  near-white `#FFE9C7` · one cool counter-accent (window sky) teal `#3E6B78`. Tint every asset material
  toward these; reserve pure glow for the pads + string-lights + window.
- **Lighting:** `<Environment>` one self-hosted **dusk HDRI** (ambient fill + reflections); one warm
  `directionalLight` **key** (the lamp, `SCENE3D.keyHex`); a low hemisphere/cool fill for the teal
  shadow; **emissive** pads/lights as practicals; `<ContactShadows frames={1}>`; palette-matched `fog`;
  post = Bloom + Vignette + ACES.
- **Camera:** fixed, `fov≈40`, head-on + slightly above the console; optional tiny **clamped drift**
  (parallax) that is **instant-off** under reduced motion. Enter = doorway wipe from the tile (amber) →
  `drift-in` settle onto the console; **reduced-motion = instant cut**. The persistent Canvas **swaps
  contents**, never remounts.
- **Motion:** pad shimmer (idle) → playhead sweep (playing); plant `<Float>`; motes drift; shelf record
  turns; lamp breathes ~2%. Web Audio scheduler is the clock; rAF drives only the playhead while playing.

## A.7 The live taste (why the room is not decorative)

The room holds **one intrinsically-integrated micro-interaction** — the **pad wall**. A gentle 2-track
default groove is armed; a breathing **"▶ tap to start"** pad unlocks `AudioContext` on first gesture
(Web-Audio autoplay rule); after that the playhead sweeps in time and **tapping any pad snaps a hit onto
the grid, quantized, in the child's current instrument voice** — audible next pass, always in time,
always in tune (v1 §4 guardrails: quantized grid, synthesized/curated kit, pentatonic-locked melody,
reversible, no fail state). This is a *doorway-depth* teaser, **not** the deep activity — it exists to (a)
hook, and (b) be a provably-live **delight** for QA (it moves `stateHash()`; it does **not** call `emit`). It
is deliberately shallow **and signal-free** (the firewall — juice ≠ signal, aliveness §1.2; reconciliation
§3): in content-deferred v1 the room emits **zero** `ActivityEvent`s, so only the **coarse domain-return**
(entering the studio) counts and the `build`/work-mode cells are lit by the deferred content app.
**The "why does it sound like that?" depth is behind the door.**

## A.8 The doorway (into Part B)

The console screen glows and reads *"open the studio."* Walking up / tapping it (Gather.town "walk up,
press to open a richer embedded activity" pattern, hybrid memo §1.4) opens the **Content App** on the
child's **current sound**, ready to shape. A player-facing label backs the diegetic screen (Dead-Space
caution: don't fetishize pure diegesis). See §C for the seam mechanics.

## A.9 Banned outcomes — instant fail (the anti-v1 / anti-ugly list)

1. **An empty box** — a grid on a bare wall, no life props (fails Pillar C / content floor 1).
2. **Fullbright / dead shadows** — `MeshBasicMaterial`, no HDRI, black or muddy-grey ambient (Pillar B).
3. **A dead decorative primary** — a pad that doesn't change audio + `stateHash()`; an `aria-hidden`
   canvas with no DOM peer (the exact v1 QA red-flag).
4. **A fake doorway** — a painted console screen that opens nothing.
5. **A genre-switch at the door** — the door dropping into a quiz / form / wall of text instead of more
   hands-on sound (chocolate-covered broccoli).
6. **Cold / clinical / AAA-serious** — a dark moody "pro studio" or grey corporate-DAW look; the mood is
   cozy/warm, never the moody references.
7. **Over budget** — > 50 draw calls, per-frame shadow updates, MSAA, constant frameloop at idle,
   external HDRI fetch, un-instanced repeats.
8. **Asset soup** — mixed-kit assets jammed together without palette-tint cohesion (Pillar A).
9. **Motionless taxidermy** — a totally frozen idle scene (Pillar F) — *but* reduced-motion must render
   a calm still frame, not a broken one.
10. **Railroaded a11y** — the accessible path as a lesser flat menu (Surveyor caution; see §C.3).

## A.10 The verification method (LAAS loop, kept verbatim in spirit)

- **Reference-delta loop (mandatory, every visual phase):** render the closest shot, place it beside the
  relevant reference frame, write `reference/DELTA.md` — the **ten most significant differences ranked by
  impact** — **fix the top three**, re-render. Only then does the phase close.
- **Self-score rubric (0–10 per row, anchored to the references):** cohesion · lighting warmth (no dead
  shadow) · room-is-lived-in (prop richness) · composition/framing · pad-glow & sound-reactivity ·
  window/depth · motion/breath · legibility (primary action obvious in ≤ 3s) · coziness vs references ·
  performance (draw calls + fps on a real Chromebook under sustained load). `10` = passes a one-second
  glance beside the cozy references; `2` = "empty Sketchfab box." After each phase, write *"what raises
  this row by 2 points"* and implement the two cheapest before proceeding.
- **The two-frame acceptance test (adapted from LAAS's final):** produce **(1)** the "Dusk in the Studio"
  hero frame beside references 1–3, and **(2)** a Content-App lesson frame beside the Brilliant / Chrome
  Music Lab reference. If a viewer's eye snags within one second on a **category error** — empty box,
  dead shadow, a quiz form, a wall of text — the task is not done. Then a human must freely explore the
  room *and* a lesson; their feedback is the last gate.

---

# PART B — THE CONTENT APP: "how audio really works" (Brilliant-style)

## B.1 The content bar + the one adaptation that matters

**North star:** Blazing Audio — *"learn how audio really works, one hands-on lesson at a time"*
(`blazing-audio-alpha.web.app`). **Method:** Brilliant's *learn-by-doing* — understanding clicks through
**doing, not reading**; **problem-first / pretest** (never teach the procedure before the child tries);
**one concept per lesson**, minimal text, minimal cognitive load; **manipulate → instant audible+visible
feedback**; **safe, non-judgmental failure**; name the concept *after* the intuition. **Spine:** explorable
explanations — *manipulating the simulation **is** the explanation* (Bret Victor; Nicky Case; precedents
§1.3). **Proven web interactives:** Chrome Music Lab (Oscillators, Harmonics, Spectrogram, Sound Waves,
Strings, Song Maker).

> **The one adaptation (state it loudly).** Brilliant drives retention with **streaks, levels, and daily
> goals.** Our brainlift **forbids gamifying the return signal** (SPOV 3 / Insight 5; reward-undermining
> is worse in children; precedents §1.4, world-design §6). So we take Brilliant's **pedagogy** and
> **reject its retention gamification.** Return pull lives in the **artifact and the curiosity**, never in
> a counter. No streaks, XP, points, or FOMO — the same rule the world layer obeys.

> **No live LLM (out of scope).** Brilliant's "Koji" AI tutor is replaced by a **quiet, scripted guide**:
> pre-authored hints revealed on idle/struggle (Koji's *structural* role — handholds that make themselves
> unnecessary — without an LLM). A `guide` hook is stubbed for a future *consented* tutor; v1 ships
> scripted hints only. Hints are `assistive` and **never lower a signal**.

## B.2 The concept ladder — single-concept, hands-on lessons/tools

Each lesson makes one invisible audio idea **visible and touchable**, opens with a *do-this* challenge
before naming anything, and yields an **artifact**. The through-line: *sound is a wiggle in the air you
can see, shape, break apart, and build back up.* Work-modes in **bold** map to the frozen grid columns.

| # | Lesson / tool (child sees) | The hands-on manipulation (the explanation) | Concept taught | Work-mode | Artifact |
|---|---|---|---|---|---|
| 1 | **What is a sound?** | Pull a speaker cone / string; a live oscilloscope draws the wave. Bigger pull = taller wave = louder. | sound = vibration = a wave over time; **amplitude = loudness** | **build** | — (intro) |
| 2 | **High & low** | "Make *this* note" first; a slider squeezes the wave tighter → higher. Hz readout appears *after* they feel it. | **frequency (Hz) = pitch**; octave = 2× | **build** | matched-pitch |
| 3 | **Why a piano ≠ a flute** | Stack harmonic sliders (CML *Harmonics/Oscillators*); same pitch, different recipe → different instrument. Toggle sine/square/saw and *see* why square is hollow (odd harmonics). | **timbre = harmonic recipe** (Fourier, made tactile) | **build** / **compose** | a **Voice/Patch** |
| 4 | **Sculpting a sound** | Start bright & buzzy; drag low-pass **cutoff/resonance**; a live spectrum shows harmonics carved away → dark / "wah." | **filters / subtractive synthesis** | **build** / **debug** | a filtered patch |
| 5 | **The shape of a note** | Drag **A-D-S-R** handles on an envelope curve; a "pluck" becomes a "pad/swell." | **envelope = amplitude over time**; what makes an instrument *feel* like itself | **build** | a playable synth voice |
| 6 | **Seeing sound** | Feed built-in sounds (or opt-in mic, on-device, nothing stored); watch the **spectrogram** paint frequencies over time (CML *Spectrogram*). "Which sound made this picture?" | any sound = a **sum of frequencies**; the spectrum is sound's fingerprint | **investigate** / **debug** | — |
| 7 | **Space & echoes** | "Clap in a room": drag **delay time/feedback** and **reverb size/decay**; a dry clap becomes a canyon. | **time effects** — echo = delayed copy; reverb = many echoes | **build** / **compose** / **debug** | an effected sound |
| 8 | **Into the computer** | A smooth wave with a **sample-rate** slider (dots snap onto the curve) and a **bit-depth** staircase; crank down to hear crunch/aliasing, up to hear it smooth. | **sampling & quantization** (digital audio; Nyquist, lightly) | **investigate** / **build** | — |
| 9 | **Your little studio** (capstone) | Play a phrase on a **pentatonic-locked pad grid** using the **voices you built** (3–5) + **effects** (7); perform live (energy-filter ride) or arrange A→B. *(This is v1's Groovebox, re-homed and now powered by the child's own synthesis.)* | synthesis + effects + rhythm = **music**; everything connects | **compose** / **perform** | a **Loop / Performance / Song** |
| — | **Fix-the-sound** (woven throughout) | "This bass is too muddy — make it punchy" / "this loop clashes — make it groove." Problem-first, always fixable, never punishing. | applied EQ/filter/envelope/mix judgement | **debug** | improved artifact |

This genuinely teaches *how audio really works* (amplitude, frequency, timbre/harmonics, filters,
envelopes, spectrum/Fourier, time effects, sampling) **and** ends in real music-making — while covering
all four disambiguating work-modes so the grid can tell a *filter-and-spectrum kid* (investigate/debug)
from a *sequencer kid* (compose/perform) *within* audio.

## B.3 How it teaches by manipulation (the Brilliant mechanics, concretely)

- **Problem-first:** every lesson opens with *make this / match this / fix this* **before** any term.
  ("Make it brighter" → they discover the filter → *then* it's named "filter.")
- **Manipulate → immediate feedback:** every control is a live Web-Audio param with a synced visual (the
  "drag the tangent line, watch the slope" analogue = "drag the harmonic slider, hear the timbre morph").
- **One idea, little text:** a sentence, not a wall; the interactive carries the meaning.
- **Reveal after intuition:** Hz, timbre, ADSR, spectrum are *named* only once felt.
- **Safe, reversible, non-judgmental:** wrong = "hear the difference," not "❌"; no score, no timer.
- **Scaffolded scripted hints:** on idle/struggle, the quiet guide surfaces one pre-authored nudge; it
  steps back as the child succeeds (Koji's structure, no LLM); hints are `assistive`.
- **Consolidate, don't grind:** after the "aha," 1–2 quick variations (Brilliant's extra practice
  sets) — **but no streak/XP** (the anti-gamify rule).

## B.4 Artifacts (what the child makes) + B.5 the Shelf bridge

- **A Voice/Patch** — `{osc, harmonics[], filter{type,cutoff,q}, env{a,d,s,r}, fx[]}` → JSON; the child's
  own instrument sound. `ARTIFACT_COMPETENCE`.
- **A Loop / Performance / Song** — the capstone artifacts, reusing v1 §5's `Loop` schema, now with the
  child's **patches as the kit**.
- **A Sound Card** — a shareable card showing a sound's **waveform + spectrum + name**; export as JSON /
  PNG / WAV (via `OfflineAudioContext`). No accounts, no PII (honors "no social/co-presence").
- **The Shelf (bridges both layers).** Saved sounds/loops live on **one Shelf** rendered in *both* the
  content app (a list) *and* the 3D room (instanced vinyl/cassettes; approaching softly plays the latest).
  The artifact is the **persistent, revisitable thing** that makes voluntary return real across the seam —
  return pull is the Shelf, **not** a counter.

## B.6 Reuse vs. build — the assessment (incl. "could Blazing Audio be embedded?")

| Candidate | License / access | Verdict |
|---|---|---|
| **Blazing Audio** (the reference app) | Auth-walled alpha; **account required (PII)**; no public API or content; license unknown | **Do not embed / reuse.** It requires account creation (violates our no-child-data / no-accounts stance), can't be inspected or controlled for a11y / signal / budget, and is closed. **Use only as the north-star bar** for tone + "one hands-on lesson at a time." |
| **Chrome Music Lab** | **Apache-2.0**, open source, *archived* (read-only Apr 2026); Web Audio + Tone.js | **Reuse as reference + selectively lift parts, don't embed wholesale.** Apache-2.0 is commercial-safe (attribution + NOTICE + note changes → `assets/LICENSES.json`). But it's unmaintained, built on old tooling (gulp/Pug/older Tone), each experiment is a standalone page (not a React component), and it's **not built to our audio-first a11y, signal, or parity contracts.** So: **reimplement** the interactives (Oscillators, Harmonics, Spectrogram, Sound Waves, Strings, Song Maker) as React components over our headless core, using CML as design/algorithm reference and optionally porting small self-contained pieces (e.g., the spectrogram analyser graph) with attribution. |
| **Tone.js** | **MIT**, maintained (CML's foundation) | **Reuse directly** as the Web-Audio scheduling/synth/effects layer (the lookahead "Tale of Two Clocks" scheduler, oscillators, filters, delay/reverb). Keep all *state* in a framework-agnostic headless store (like v1's `useGroovebox`) so parity/tests/signal don't depend on Tone. Fall back to a hand-rolled minimal engine only if Chromebook bundle size demands it (record the trade in `.loop/decisions.md`). |

**Verdict:** **build fresh** — React interactives over a shared **headless audio core** + **Tone.js**,
using **Chrome Music Lab** as CC-licensed reference/parts and **Blazing Audio** as the bar. Only a
fresh build can guarantee the four things an embedded third-party app cannot: **audio-first
accessibility, the `ActivityEvent` signal contract, `plainZoneEquals` parity, and the Chromebook
budget.**

## B.7 Content-app tech, budget, determinism

- **Medium:** DOM + SVG/Canvas2D + Web Audio — **no WebGL required** (Brilliant-style interactives are
  2D). Huge Chromebook win: the app never contends for the room's single WebGL context (the room pauses
  while the app is open, §C.1). The spectrogram renders in Canvas2D (cheap) rather than CML's 3D view.
- **Shared headless core:** one framework-agnostic store owns transport, synth graph, patch/loop
  serialization, and the `emit` map (mirrors v1 §10 `useGroovebox`), so the app's `Room3D`-peer and its
  `ActivityDOM` are two renderings of the same verbs (parity by construction).
- **Determinism / QA:** `?seed=` fixes starter sounds; `?freeze=1` parks visuals for screenshots;
  `settle()` drains meters; `window.__qa` extended in §C.4.

---

# PART C — THE SEAM: world zone ↔ content app

## C.1 How the world opens the app

- **The doorway = the console screen (diegetic) + a player-facing "open the studio" label.** Walk up /
  tap → the Content App opens **on the child's current sound**, ready to shape (Gather.town walk-up-
  and-open pattern).
- **Continuity of doing (the anti-broccoli seam).** The pad wall's current voice **is** the patch the
  app edits; the verb continues — *touch sound → hear it change* deepens into *shape sound → hear why.*
  Amber + note glyph carry map → room → app header.
- **Embedded route, one-Canvas rule preserved.** The app mounts as a **DOM route** over/replacing the
  room view; the persistent WebGL `<Canvas>` is **paused (`frameloop` off) or hidden, never unmounted**
  (hybrid memo §5 — routes-inside-Canvas / never remount). Because the app is DOM, it needs **no WebGL
  context** — the GPU/thermal budget is freed while learning. On exit the room resumes with contents
  intact.
- **Entry/exit UX.** Enter = a short "step up to the console" transition (reduced-motion = instant cut).
  Exit = a **guilt-free** *"that's a good place to stop — the studio will be here"*; the artifact is saved
  to the Shelf (visible in both layers); pause loses nothing; a definitive exit, **no streak, no
  countdown** (right-to-disconnect; precedents §1.4).

## C.2 Signal capture across both surfaces (one contract, two return grains)

- **One `emit` sink.** The **content app's** lesson/tool actions call
  `RoomProps.emit(ActivityEvent)` with `{ zoneId:"music", domain:"sound_music",
  workMode, probeId, kind, dayOffset, intervention?, assistive?, withdrawn? }`. **The room's cozy live-taste
  is signal-free in content-deferred v1** (the firewall, §A.7; reconciliation §3) — the room's only v1 signal
  is the **coarse domain-return** on studio entry. The core
  (`buildReturnGrid`) is **surface-agnostic** — it only sees `{domain, workMode}` — so the two
  layers do **not** fragment the signal; they **enrich** it.
- **Two return grains (both are `voluntary_return` at day ≥ 7/30, both obey the novelty gate + prompted
  exclusion):**
  1. **World-return** — revisiting the **Music Studio building** on the map after novelty (a directly
     observable tile revisit): the coarse *"drifts back to sound"* signal.
  2. **App-return** — re-entering the **content app / a specific lesson or work-mode** unprompted after
     novelty: the fine *"drifts back to filtering+spectrum (investigate/debug) vs. sequencing
     (compose/perform)"* signal that sharpens **row-vs-column**.
- **Emission map (extends v1 §7 to the app; abbreviated).** First lesson play = `explore` (novelty, seeds
  a cell, never a return). Build & save a patch/loop = `build` + `ARTIFACT_COMPETENCE`. Add harmonics/
  tracks or pick the harder lesson **by choice** = `CHOSEN_CHALLENGE`. Reopen a saved sound to improve it
  unasked = `debug` + `UNREQUIRED_REVISION`. Stick with a "fix the muddy bass" challenge through flops =
  `debug` + `FAILURE_RECOVERY`. Name a sound / declare intent ("spooky pad") = `SELF_AUTHORED_SCOPE`.
  Perform to listeners / record = `perform` + `ARTIFACT_COMPETENCE`. Arrange A→B = `compose` +
  `ARTIFACT_COMPETENCE`/`SELF_AUTHORED_SCOPE`. Scripted hint / auto-fill = `ASSISTIVE` (never lowers).
  Re-enter unprompted at day ≥ 7 → `VOLUNTARY_RETURN` on whatever cell they drift to (**the** signal);
  re-enter after a reminder → `PROMPTED_RETURN` (excluded).
- **Probe catalog (extends v1 §7.4).** Add app-lesson probes so coverage spans build/perform/debug/
  compose × difficulty, e.g. `music.synth.voice` (build), `music.filter.sculpt` (build/debug),
  `music.spectrum.read` (**investigate**/debug), `music.effects.space` (build/compose),
  `music.sampling.digital` (**investigate**), plus v1's `music.beat/perform/refine/arrange` for the
  capstone. Shared fields: `domain:"sound_music"`, `equipment:["audio-output"]` (+ optional `"microphone"`
  for the spectrogram, **consent-gated, default off**), `safetyClass:"cleared"`, `accessibilityVariants:
  ["keyboard-grid","screen-reader-audio-first","reduced-motion","visual-caption","deaf-visual-mirror"]`.
- **Guardrails preserved on both surfaces:** no score/points/streak on return; help = `assistive`
  (never lowers); prompted return recorded but never celebrated; no fixed label; novelty ≠ interest.

## C.3 Accessibility — audio-first is the whole point (a strength, not a bolt-on)

- **Parity by construction.** The primary output of both the room taste and every app lesson is **sound**,
  which is *identical for sighted and blind users*. So the `ActivityDOM` peer is the **same instrument /
  lesson**, keyboard + screen-reader operable, emitting **identical `ActivityEvent`s** — never a lesser
  menu. `plainZoneEquals` (core §5.3) extends to app lessons.
- **Concrete requirements.** Every control (harmonic slider, ADSR handle, filter cutoff, pad) is a real
  focusable DOM control with role + `aria-valuetext` ("cutoff 800 Hz, brighter") and **arrow-key
  operation (never cursor-steering** — Accessible Games Initiative); Space/Enter commits. The feedback is
  the **sound itself** → no per-tick SR spam; opt-in `aria-live` summaries and reduced-motion visual
  captions are available, off by default. The oscilloscope/spectrogram carry a described-text alternative
  ("a bright peak, high up"). The **mic is optional** (built-in sources default) so blind + no-mic users
  have full parity. Lessons are a **navigable list** that preserves *choosing what to revisit* ("what did
  I leave unfinished?") — no railroading (Surveyor). WCAG 2.2 AA; color-independent (state via aria +
  shape, not hue); reduced-motion → instant.
- **Deaf / hard-of-hearing (critical for an audio product):** *audio-first must not mean audio-only.*
  **Every audible change is mirrored by a visible one** (wave taller, spectrum shifts, meter moves), so a
  deaf child can still *see how audio works* and make artifacts judged by their visual signature. This is
  a hard requirement, not an option (`deaf-visual-mirror` accessibility variant).
- **Tiering.** `room-3d → room-3d-lite → the app itself is the DOM/audio floor.` On the weakest devices
  the child **skips the 3D room and enters the app straight from the map** — an **equal** path, not a
  downgrade (the app is already DOM + audio).

## C.4 `window.__qa` across the seam (extends v1 §12)

```ts
window.__qa = {
  ready: boolean,                          // room mounted OR app mounted; audio graph built (pre-gesture ok)
  error: string | null,
  activeSurface: "map" | "room" | "content-app",
  settle(frames?): Promise<void>,          // drain playhead / meters / bloom before capture
  stateHash(): string,                     // includes activeSurface + activeLesson + key audio params + artifacts
  interactives(): Array<{ id, kind, worldPos?, screenRect? }>,  // room pads+transport OR app lesson controls
};
```

The gate proves, model-free: **(a)** the door is live — opening the app changes `activeSurface` +
`stateHash()`; **(b)** each lesson control is live — moving it changes the audio graph + `stateHash()`
(so a dead widget fails, exactly like a dead pad); **(c)** no `aria-hidden`-primary — the app is real
focusable DOM; **(d)** audio is actually scheduled — a scheduled-events / non-silent counter is in
`stateHash()` so a "silent lesson" is catchable.

---

## 4. Anti-patterns to avoid (v2, consolidated)

1. **Pretty lobby, real app elsewhere** → rebuilds v1's decorative-3D failure. The room's taste is live
   and the door opens *more doing* (§2 rule 1–2, §A.7, §A.9-5).
2. **Chocolate-covered broccoli in the app** → manipulating sound *is* the explanation; never a quiz/form
   /text wall behind the door (§B.1, §B.3).
3. **Importing Brilliant's gamification** → take the pedagogy, drop the streaks/levels/goals; no gamifying
   the return signal on either surface (§B.1).
4. **Embedding Blazing Audio / CML wholesale** → can't guarantee a11y / signal / parity / budget / no-PII;
   build fresh over a headless core (§B.6).
5. **Fragmenting the signal across two surfaces** → one `emit`, one `{domain, workMode}` contract, two
   return grains that *enrich* the read (§C.2).
6. **An empty or cold room** → the content floors + warmth law + "a musician lives here" (§A.3, §A.2).
7. **Blowing the Chromebook budget** → < 50 draw calls, one HDRI, frozen shadows, `frameloop=demand`, app
   is DOM/2D and pauses the Canvas (§A.3, §B.7, §C.1).
8. **Audio-only exclusion** → every audible change has a visible mirror (deaf/HoH parity, §C.3).
9. **Web-Audio pitfalls** → gesture-gate the `AudioContext`; use the lookahead scheduler (Tone.js), not
   `setInterval`; don't SR-announce every step (the sound *is* the feedback).
10. **Skipping the reference-delta loop** → every visual phase closes only after DELTA.md + fix-top-three
    + re-render (§A.10).

## 5. Build order (v2)

1. **Headless audio core** (Tone.js-backed): transport + synth graph (osc/harmonics/filter/env/fx) +
   patch/loop serialization + the `emit` map (§C.2). Pure unit tests: action → correct `{domain:
   "sound_music", workMode, kind}`.
2. **Content App lessons** (DOM + Canvas2D + Web Audio, §B.2): problem-first, manipulate→feedback,
   scripted hints, artifacts; `ActivityDOM` parity + audio-first a11y (§C.3). Ships as the DOM/audio
   **floor** even with 3D disabled.
3. **The 3D room** (world layer, §A): shell `<Merged>` + palette-tinted CC0 dressing to the content
   floors; procedural pad `InstancedMesh` + playhead + Shelf + listeners; art tokens from the pack;
   pointer/raycast → same headless actions. Run the **reference-delta loop** (§A.10).
4. **The seam** (§C.1): the console-screen doorway, embedded route, pause-not-unmount the Canvas, the
   shared Shelf, guilt-free exit.
5. **`window.__qa`** across surfaces (§C.4) + regression probes (dead-pad, dead-widget, silent-lesson,
   aria-hidden-primary all fail).
6. **States + synthetic "a week later…"** (v1 §8) across *both* return grains; **register** `musicZone`
   in the app zone registry (the one merge point).
7. **QA gate + operator review** on `localhost`: two-frame acceptance (§A.10), raycast round-trip, VLM
   rubric (clarity / primary-action-obvious / interaction-sense), Chromebook sustained-load perf.

**Acceptance.** An 8-year-old steps inside within ~3s and taps a glowing pad to hear the beat change;
walks to the console, **opens the app, pulls a harmonic and hears a flute become an organ, drags a filter
and hears it darken, shapes an envelope**, then plays a phrase with the voice they built; a screen-reader
user does the **same** by keyboard, audio-first; a deaf user *sees* every change; each of
build/perform/debug/compose emits its `{domain:"sound_music", workMode, …}` event; a voluntary,
novelty-decayed return — to the **building** *or* to a **lesson/work-mode** — lands on the correct grid
cell; the room holds **< 50 draw calls** and the app needs **no WebGL**; and the gate cannot pass a dead
pad, a dead lesson widget, a silent lesson, an `aria-hidden`-primary, or an empty/cold room.
