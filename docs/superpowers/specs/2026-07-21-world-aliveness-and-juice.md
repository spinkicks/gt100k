# Interest Lab — World Aliveness, Juice & Theme Expansion: **Making Emberwood Breathe**

**Date:** 2026-07-21 · **Owner:** David · **Scope:** the *game-feel layer* of the Emberwood world — the
ambient life, the cozy micro-interactions, the transition juice, the sound, and the lore that make the
hamlet feel **living and delightful on its own**, before any learning content exists. This is the
**Lane G** deliverable (game-flow + movement + world aliveness + juice) from the reconciliation, built as
a layer **on top of** the art-direction bible.

**Builds on (does NOT contradict):**
[`2026-07-21-world-art-direction-cozy-cabin.md`](./2026-07-21-world-art-direction-cozy-cabin.md) — the
Emberwood palette, materials, lighting, per-surface hero frames, and the six pillars. This doc adds
*motion, interaction, sound, and charm* to that fixed look; if anything here fights the bible's palette or
Chromebook budget, **the bible wins**.
**Scope lock:** [`2026-07-21-interest-lab-reconciliation.md`](./2026-07-21-interest-lab-reconciliation.md)
§7 (v1 builds **only** the game/world; learning content **DEFERRED** to intern repos) + §6 (warm
golden-hour art). The doorways are **host-ready with a warm placeholder** — so Emberwood must earn a
child's love **as a place to be**, not as a content funnel.
**Themes the surfaces in:** the DOM Curiosity Map / clearing
([world-visual §A3](./2026-07-21-world-visual-and-content-architecture.md), art bible §6) and the bounded
3D cabin interiors (art bible §8; the three v2 zones —
[music](./2026-07-21-zone-music-design-v2.md) · [code](./2026-07-21-zone-code-design-v2.md) ·
[art](./2026-07-21-zone-art-design-v2.md)).
**Grounding pipeline:** [`stylizedWorldAssetPipeline.md`](../../research/stylizedWorldAssetPipeline.md)
(CC0 backbone; one HDRI; frozen shadows; instancing; `<50` draw calls; `dpr≤1.5`; `frameloop="demand"`).
**Guardrails (the non-negotiable spine):** [`passionBrainlift.md`](../../research/passionBrainlift.md)
Insight 5 — *rewards corrupt the voluntary-return signal, worse in children, so we never gamify the
measurement.* **Every delight in this doc is deliberately signal-free** (see [§1.2](#12-the-firewall-juice-is-never-signal)).
**Depth model = LAAS** ([`PROJECT_LAAS_v2.md`](https://github.com/Braffolk/fable5-world-demo/blob/main/PROJECT_LAAS_v2.md)):
named reference frames, two-sided hard floors, an explicit banned-outcomes list, a reference-anchored
self-score, and a mandatory reference-delta loop — here judged on **feel**: "does it feel alive and
crafted?", not "is it pretty for a browser."

**Design north stars:** Animal Crossing · A Short Hike · Cozy Grove · Alba · *My Neighbor Totoro* ·
Unpacking / Untitled Goose Game (object-feel + sound) · Firewatch (the dusk audio bed).

---

## 0. TL;DR — what this doc decides

1. **Emberwood breathes as one organism.** A single shared **breath clock** ([§5.1](#51-the-breath-clock-one-heartbeat-for-the-whole-world)) drives chimney smoke, window flicker, foliage
   sway, the hearth glow, and the wind-chimes with per-element phase offsets — so the whole clearing pulses
   like one living place (the fire is the heartbeat), for the cost of *one* oscillator.
2. **A curated set of cozy micro-interactions rewards wandering** ([§4](#4-interactive-world-objects--micro-interactions)):
   **pet Biscuit the cat · stoke the Lodge hearth · ring the dinner bell · knock leaves off a branch ·
   light a lantern · nudge the wind-chime · rock the porch chair · plip the stream.** Each obeys one
   **cozy-juice grammar** (anticipation → a warm bump → a soft particle → one gentle sound → settle) and
   each is **worth doing for its own sake**.
3. **The firewall is the whole point** ([§1.2](#12-the-firewall-juice-is-never-signal)): *juice is never
   signal.* No micro-interaction emits an `ActivityEvent`; nothing is counted, collected, badged, streaked,
   or FOMO'd. Petting the cat every day is lovely and reads as **nothing** to the interest engine — which is
   exactly what protects the voluntary-return signal the whole product rests on.
4. **Two surfaces, two motion budgets** ([§4.5](#45-the-performance-model-two-budgets)): the **clearing is
   DOM** (continuous ambient life via `motion@^12`/CSS at ~0 GPU); the **cabin rooms are 3D**
   (`frameloop="demand"`; micro-interactions invalidate only while animating, then settle to 0 GPU). This
   is how the world can be alive *everywhere* and still survive a Chromebook.
5. **Time is a felt quieting, not a clock** ([§6](#6-time--weather)): **golden hour is the resting
   default**; the "a week later…" time-lapse **visibly settles the clearing toward dusk** (sun lowers,
   shadows go bluer, fireflies and lanterns come out, the audio bed lowers) — the honest synthetic-return
   device, made beautiful. A **hearth-storm** rain mood is the optional peak-cozy variant. Night-as-default
   stays a banned outcome.
6. **The sound is warm, tiny, and CC0/synthetic** ([§8](#8-sound-design)): a low forest+fire+wind bed, a
   generative warm musical pad with a faint per-cabin voice, and a handful of satisfying juice SFX —
   gesture-gated, always mutable, always with a visual mirror (deaf/HoH parity), sourced from Kenney CC0 +
   Tone.js synthesis and logged in the manifest.
7. **The charm is discoverable, never enumerated** ([§9](#9-theme-expansion--emberwoods-living-charm)):
   the shared hearth-fire, the lamplighter dusk, and a set of **quiet discoverable corners** (a deer at the
   treeline, a fox at dusk, initials on the footbridge, a firefly that lands on your focus) reward *looking*
   — and are never listed as "3/7 found."

---

## 1. The three jobs & the one firewall

### 1.1 What "aliveness, juice, and theme" mean here

| Job | Definition (this doc) | Where it lives |
|---|---|---|
| **Aliveness** | The world is never still: it *breathes* (smoke, sway, fireflies, wind, a wandering cat, a rare deer) so a frozen frame feels one second from motion (art bible Pillar F, deepened). | [§5](#5-ambient-life--motion) · [§6](#6-time--weather) |
| **Juice** | The tactile, physical, satisfying *feedback* of every interaction and transition — cozy-grade game-feel (Swink's *Game Feel*; Jonasson/Purho "Juice it or lose it"), **restrained to warmth, not arcade**. | [§4](#4-interactive-world-objects--micro-interactions) · [§7](#7-transitions--juice) |
| **Theme expansion** | Turning Emberwood's identity (the shared hearth-fire, the golden hour, the neighborly hamlet) into **lived gameplay moments and discoverable charm** — without ever becoming a points game. | [§9](#9-theme-expansion--emberwoods-living-charm) |

### 1.2 The firewall: juice is NEVER signal

> This is the single most important rule in this document. Read it twice.

The product's entire scientific bet is that a child's **voluntary return** — *what they drift back to when
nothing is making them* — reveals an emerging interest, and that **rewarding that return corrupts it**
(passion brainlift Insight 5; Deci/Koestner/Ryan reward-undermining, worse in children). So:

- **No ambient micro-interaction emits an `ActivityEvent`.** Petting the cat, stoking the hearth, ringing
  the bell, lighting a lantern — all call **nothing** on `RoomProps.emit`. They are pure decoration with a
  soul. (The *only* things that emit are the zone-owned surfaces: entering a cabin, the cabin's live taste
  action, and the core's revisit detection — per the v2 zone specs and core spec, unchanged.)
- **Nothing is counted, collected, or scored.** No "you've petted Biscuit 12 times," no petting-log, no
  achievement, no badge, no streak, no XP, no "delights found: 3/7," no daily-login reward. The delights
  have **no meter of any kind**.
- **Discovery is the reward.** A quiet corner ([§9.3](#93-quiet-discoverable-corners)) is delightful
  *because you found it*, and it is **never enumerated** in a UI. Seeing the deer is the payoff; there is no
  "deer sighted ✓."
- **Seasons/time are cosmetic, never timed-exclusive.** No "log in before Friday for the pumpkin"
  ([§6.4](#64-seasons-as-cosmetic-reskins-not-events)). FOMO is a banned outcome.
- **Why this is safe (and why it matters):** because the delights carry no signal, a child who returns
  every day *just to pet the cat* is returning to **the world**, not to a domain — and the engine correctly
  reads that as **nothing about their interests**. The firewall keeps the clearing's charm from
  masquerading as a music/code/art spike. It also makes the delights **fully optional**: a child who can't
  or won't use them loses nothing measurable.

**QA enforces this as a negative assertion** ([§14](#14-verification-battery)): a scripted round-trip fires
every micro-interaction and asserts `window.__qa.getEmittedSignals()` records **zero** new events from
them. A delight that leaks a signal is an **instant fail**.

---

## 2. Pillars (extending the art bible's six) — enforced

The art bible's pillars **A–F hold verbatim** (cohesion · warm-light-no-dead-shadow · nothing-is-bare ·
legibility · color-script · the-world-breathes). This doc adds five game-feel pillars; resolve any
uncovered motion/interaction choice in favor of the relevant pillar.

- **G. The world breathes as one.** Ambient motion is not N independent loops; it is **one breath clock**
  ([§5.1](#51-the-breath-clock-one-heartbeat-for-the-whole-world)) with phase offsets, so the smoke, the
  windows, the fire, and the chimes feel like one organism — *and* cost almost nothing. Chaotic,
  unsynchronized motion is a fail even if each piece is pretty.
- **H. Cozy juice, never arcade juice.** Feedback is **soft, warm, and tactile**: gentle springs, a brief
  warmth-bump, a small particle puff, one soft sound. **No screenshake, no confetti, no big pops, no
  saturated flashes.** If it feels like a slot machine or a mobile-game reward, it has failed the mood.
- **I. Delight is its own reward.** Every interaction is designed to be **satisfying in the moment and
  forgotten after** — never a step toward a counter. If a delight makes a child feel they *should* do it
  (obligation, completion, FOMO), it has become a chore and failed ([§1.2](#12-the-firewall-juice-is-never-signal)).
- **J. Two surfaces, one place.** The DOM clearing (continuous, free) and the 3D rooms
  (`frameloop="demand"`) use **different motion budgets** but must feel like **one continuous world** —
  same fire, same hue, same wind, carried across the cut ([§7.1](#71-entering-a-cabin-the-door-swing--hearth-reveal)).
- **K. Reduced-motion is a serene postcard, never a broken one.** With reduced-motion, Emberwood is a
  *calm, complete, beautiful still* at golden hour — the breath clock frozen at a pleasant mid-phase, the
  cat napping, interactions still working (as instant state changes) — **not** a scene with the life
  amputated and holes left behind (art bible Pillar F + WCAG; honored **absolutely**).

---

## 3. Reference frames — name the bar (feel, not just look)

The art bible names *visual* references. Aliveness is judged against **motion/feel/sound** touchstones.
Author a **short reference reel** (5–10s clips) or an annotated storyboard per row into
`passion/apps/interest-lab/reference/aliveness/` in phase 0; every phase runs the reference-delta loop
against them (LAAS method, on *feel*).

| Ref | What we steal (the feel bar) |
|---|---|
| **A Short Hike** | the *arrival* feeling; wind you can feel; ambient creatures that make you go "did you see that?"; gentle traversal juice; a small world that feels alive with almost nothing on screen |
| **Animal Crossing: New Horizons** | greeting/petting feel; satisfying tool + object feedback (never violent); time-of-day and weather as ambient warmth; the *un-rushed* dosage |
| **Cozy Grove** | the hand-drawn *breathing* world; firefly/spirit drift; the campfire as the literal heart of the place; a warm, spare audio bed; discovery-without-grind |
| **My Neighbor Totoro / Ghibli** | wind as a *felt character*; a living countryside; light and dust as things you can almost touch; the dusk quieting |
| **Unpacking · Untitled Goose Game** | object-interaction **sound design** — the small, perfect *clink/creak/plip* that makes touching things a joy |
| **Firewatch** | the dusk audio bed — wind, distant birds, the aloneness that still feels warm; how sound sells "you are somewhere real" |

**Hero "feel" frames (author one moment-storyboard each):**

1. **"The clearing is alive"** — a 5s idle: smoke curling from three cabins (♪ notes in the Music cabin's),
   grass swaying in a passing gust, two fireflies drifting, Biscuit ambling to a sunny spot and sitting,
   the hearth breathing. *Nothing is being interacted with, and it still feels lived-in.*
2. **"Petting Biscuit"** — approach → the cat stops, sits, leans into the pet, slow-blinks, a soft purr
   ring, tail curls; you feel the warmth; **no number appears.**
3. **"Stepping into the Sounding Cabin"** — select → the door swings on a spring, hearth-amber light spills
   and blooms toward you in the terracotta hue, a door-creak + a welcoming crackle, the DOM clearing
   dissolves under the warm wipe and the 3D room fades up already-warm.
4. **"A week later…"** — step the time-lapse: the sun sinks a notch, shadows lengthen and go blue-violet,
   the "new" shimmers fade, fireflies thicken, lanterns wait to be lit, the audio bed lowers to crickets.
   *The world visibly settles — and asks, without words, what you'll wander back to.*

**The inversion of LAAS, restated for feel:** LAAS's floor is geometric density. **Ours is *felt life* under
a hard motion/GPU/audio budget.** A clearing that is *static, silent, or twitchy-and-incoherent* is a
**failed screen**, exactly as a flat terrain is a failed LAAS screen — even at 60fps.

---

## 4. Interactive world objects / micro-interactions

The delights that reward exploration. Each is **small, optional, signal-free, and satisfying**. They are
the "content" of v1 in the only honest sense: *reasons to love wandering the place.*

### 4.1 The cozy-juice grammar (the house style)

Every micro-interaction follows the **same five-beat grammar**, tuned soft (Pillar H). This is what makes
disparate delights feel like one crafted world:

1. **Anticipation** — on hover/focus/press, a tiny tell that the thing is alive and about to respond (a
   sign sways, the cat's ear turns, the lantern's glass catches a glint). Uses `hoverLift`/`press` tokens.
2. **The warmth-bump (the universal "it heard you")** — the object briefly **lifts its emissive/bloom** in
   its local warm hue for ~150–300ms (`CABIN.fireSpark`/`light.lantern`/`window` on the DOM side; a short
   `emissiveIntensity` ramp on the 3D side). This one cue reads across *all* delights as "you touched
   something real."
3. **A soft particle** — a *small*, palette-matched puff sized to the action: embers on the hearth, leaves
   off the branch, a light-ripple ring from the bell, a water plip, a firefly rising. Reuse `<Sparkles>` /
   DOM particle sprites; **never** a confetti burst.
4. **One gentle sound** — a single, warm, short SFX ([§8](#8-sound-design)); pitch-jittered slightly so
   repeats never feel mechanical. Always with a **visual** twin for deaf/HoH.
5. **Settle** — a damped return to calm on a spring (`EASINGS.pop` / `pickSpring`). The interaction ends
   *quietly*; it does not linger, nag, or pop a reward.

Reduced-motion collapses beats 1/3/5 to an **instant state change** (the pet happens, the lantern is lit,
the bell shows a struck state) while keeping the sound + a static warmth-bump — so the delight still *works*.

### 4.2 The signature set (the hero delights)

Surface = where it lives (**DOM** clearing / **3D** cabin room / **both**). **Signal is `NONE` for every
row** (the firewall, [§1.2](#12-the-firewall-juice-is-never-signal)).

| # | Delight | Surface | The interaction | The juice (tokens) | Sound | Cost |
|---|---|---|---|---|---|---|
| 1 | **Pet Biscuit the cat** | DOM (naps in 3D rooms too) | focus/tap the wandering cat → it stops, sits, leans in, slow-blinks, tail curls | `catPet` spring; a soft warm halo (`light.window`); a couple of drifting content-motes (not hearts) | purr loop (fades in/out) + a soft *mrrp* | DOM tween; 1 sprite swap; ~0 GPU |
| 2 | **Stoke the Lodge hearth** | both (Lodge on DOM; stove in rooms) | tap the hearth/stove → a poke, embers swirl up, the fire **swells brighter** ~2s, then eases back | `hearthStoke`; ember burst (`fire.ember`→`fire.flame`); emissive+point-light bump; **all cabin windows pulse +8% for one beat** (cohesion!) | crackle-pop + a low *whoomph* | DOM: free · 3D: transient invalidate ~2s |
| 3 | **Ring the dinner bell** | DOM (Lodge) | tap the little iron bell → it swings, a bright ring, a concentric light-ripple; a perched bird may startle off (chains to ambient) | `bellRing` damped swing; ripple ring (`light.candle`, low alpha) | a clear synth *ding* (Tone.js, in-key) | DOM tween; ~0 GPU |
| 4 | **Knock leaves off a branch** | DOM (clearing) | tap a laden branch → it dips and springs back, a shower of leaves drifts down and fades | `branchKnock` spring dip; falling `rust.leaf` sprites (snow if winter mood) | a soft *rustle + whumpf* | DOM particles (≤12), fade out |
| 5 | **Light a lantern** | both | tap an unlit lantern on a post/porch → it flickers to life and pools warm light | `lanternLight` warm ramp (`light.lantern`); a bloom-bump; stays lit for the session at dusk | a soft *fwoomp* + a tiny glass *tink* | DOM: free · 3D: 1 emissive swap |
| 6 | **Nudge the wind-chime** | DOM (by the Music cabin) | hover/tap (or a gust) → the chimes sway and play a soft randomized shimmer | `gust`/`chime` sway; per-rod bob | Tone.js pentatonic bells, always in tune, randomized | DOM sway; procedural audio |
| 7 | **Rock the porch chair** | both (Lodge porch; rooms have one) | tap the rocking chair → it rocks a few damped times; Biscuit sometimes hops up and curls | `chairRock` damped oscillation | a cozy wooden *creak…creak* | DOM/3D tween; transient |
| 8 | **Plip the stream / cross the footbridge** | DOM (clearing) | tap the water → a ripple + droplets + a drifting leaf-boat; the footbridge planks *clunk* underfoot | `ripple` ring; `waterGlint` catch | water *plip* / hollow wood *clunk* | DOM; ≤0 GPU |

### 4.3 The supporting cast (lighter delights)

Curated, not maximal (cozy games under-fill on purpose). Same grammar, smaller:

- **The Music cabin's smoke ♪** — tap the drifting smoke → an extra little arpeggio + a puff of note glyphs.
- **The wind-up bot on the Code porch** ("Sprout," Pip's cousin) — tap → a whirr + a hop (foreshadows Code).
- **The Art porch easel/painting** — tap → the little canvas shifts its scene subtly, a soft brush *swish*.
- **The pinwheel / weathervane** — spins on a gust or a tap (the Code cabin's gear-sprout vane turns slow).
- **The kettle on the stove** (in rooms) — approach → a gentle steam wisp + a faint whistle building.
- **The sleaf/paper that skitters** — a tap sends a stray leaf tumbling a short way on the wind.

**Rule (anti-dead-prop):** if a thing *looks* tappable it **must** respond (a dead affordance is the juice
version of chocolate-covered broccoli); if it is pure scenery it must **not** invite a tap (no false
affordances). Interactive objects carry a subtle, consistent "alive" tell (a faint idle glint/sway); mere
scenery stays still.

### 4.4 The interaction schema + additive motion tokens

Each delight is data, not bespoke code, so it is testable and tier-scalable. Proposed **additive** shape
(mirrors how `QUALITY_TIERS`/`resolveMotesProps` encode behavior as data):

```ts
// interest-lab-view/src/ambience.ts — NEW, additive (no existing consumer changes)
export interface MicroInteraction {
  id: string;                       // "pet-biscuit", "stoke-hearth", …
  surface: "clearing-dom" | "room-3d" | "both";
  label: string;                    // SR + tooltip: "Biscuit the cat — pet"
  motionKind: MicroMotionKind;      // → resolveMotion (below)
  warmHue: string;                  // the warmth-bump color (PALETTE/CABIN token)
  particle?: "ember" | "leaf" | "ripple" | "note" | "mote" | "steam" | null;
  sound?: string;                   // audio cue id (§8), or null
  emitsSignal: false;               // COMPILE-TIME PROOF of the firewall — always false
}
```

Add these **non-breaking** entries to `MOTION` / `ANIMATED_MOTION` / `REDUCED_DURATION_MS` in
`interest-lab-view/src/motion.ts` (values consistent with the shipped scale; reduced = instant, springs →
`micro`):

| New `MotionKind` | durationMs | easing | Reduced |
|---|---|---|---|
| `catPet` | 420 | `pickSpring` | `micro` |
| `hearthStoke` | 700 | `enter` | instant |
| `bellRing` | 600 | `pop` | instant |
| `branchKnock` | 420 | `pickSpring` | instant |
| `lanternLight` | 360 | `move` | instant |
| `chairRock` | 1200 | `press` (damped) | instant |
| `ripple` | 600 | `enter` | instant |
| `doorSwing` | 520 | `drawer` | instant |
| `arrivalHome` | 700 | `pop` | instant |
| `gust` | 1600 | `linear` | instant |
| `breath` | 8000 | `linear` (loop) | instant (frozen mid-phase) |

### 4.5 The performance model (two budgets)

The reason Emberwood can be alive everywhere and still hold the Chromebook budget is that the two surfaces
pay for motion differently:

- **DOM clearing — continuous, ~0 GPU.** All clearing ambient life + most micro-interactions are DOM (baked
  sprite layers + SVG hotspots) animated with `motion@^12`/CSS transforms + Web Audio. They run
  continuously without a WebGL context, so "always alive" costs the compositor, not the GPU. Hotspots are
  focusable `<button>`s over the baked scene (a11y floor + the primary surface — never `aria-hidden`).
  Micro-interactions are transient CSS/`motion` tweens that self-clean.
- **3D cabin room — `frameloop="demand"`, transient invalidation.** A micro-interaction (stoke the stove,
  pet the sill-cat, rock the chair) calls `invalidate()` and animates for a **bounded** window (< ~2s),
  then the room settles back to **0 GPU**. Continuous room ambience (fire flicker, dust motes) is the one
  exception: a **foreground** room may run a throttled loop for the fire + `<Sparkles>` motes (it is one
  small room, well under `<50` draw calls), but a **backgrounded/idle** room drops to `frameloop="demand"`
  and 0 GPU. Where a glow can be faked with a CSS/DOM overlay instead of a live 3D loop, prefer the overlay
  (per the zone-music spec's playhead-as-DOM-overlay pattern).
- **Tier scaling** (`QUALITY_TIERS`): `full` = all ambience + rare events + gusts; `lite` = thinned motes
  (24), no rare events, gentler gusts, fewer particles; `board2d` = the serene static postcard (0 motes),
  micro-interactions become instant state changes (this is also the reduced-motion render).

---

## 5. Ambient life & motion — "the world breathes"

### 5.1 The breath clock (one heartbeat for the whole world)

**The idea (Pillar G).** Instead of dozens of independent timers, Emberwood runs **one** slow oscillator —
the *breath* — and every ambient element samples it with a **per-element phase offset**. The fire is the
heartbeat; the windows, smoke, chimes, and foliage breathe *with* it, slightly out of phase, so the world
feels like one living body rather than a pile of animations. It is simultaneously a **design** win (the
world reads as one place, tying into the art bible's "one fire" cohesion motif) and a **perf** win (one
clock, not N).

```ts
// one value, sampled everywhere; period from AMBIENCE.breathMs (default 8000)
breath(tSec, phase) = 0.5 + 0.5 * Math.sin((tSec / (AMBIENCE.breathMs/1000) + phase) * 2*Math.PI)
// DOM: drive a single CSS var --breath (0..1) via one motion loop; elements read it with offsets.
// 3D room: one uniform updated in a single useFrame; fire + motes read it. Reduced-motion → freeze at 0.5.
```

Amplitudes stay **tiny** (windows flicker ≤3%, foliage sway a few px/deg, the hearth glow ±8%) — breath is
felt, not seen as pulsing. Gusts ([§5.3](#53-the-wind-system-the-conductor)) briefly *modulate* the breath
so the whole world leans together in the wind.

### 5.2 The ambient inventory

All continuous unless marked "rare." **Surface** and **cost** per art bible §9 (map ≥3 motions; room ≥3).
This raises the clearing floor to **≥5 always-on + ≥1 rare + the breath**.

| Ambient life | Surface | What it does | Cost / tier |
|---|---|---|---|
| **Chimney smoke** | DOM | soft puff sprites rise + fade from each lit cabin & the Lodge; drift sideways in gusts | cheap; `full`+`lite` |
| **— with ♪ notes (Music cabin)** | DOM | note glyphs ride up inside the Music cabin's smoke | cheap; `full`+`lite` |
| **Foliage & grass sway** | DOM (3D rooms: plant `<Float>`) | parallax sway on tree/grass layers, phase-offset by the breath; leans in gusts | cheap; all but `board2d` |
| **Fireflies / dust motes** | DOM (rooms: `<Sparkles>`) | sparse drifting glints (`MAP_COLOR_SCRIPT.firefly`); **thicken toward dusk** (time-lapse) | motes 60/24/0 per tier |
| **Stream flow + glint** | DOM | a looping shimmer on the water + one warm `waterGlint`; a slow leaf-boat | cheap; `full`+`lite` |
| **Window firelight flicker** | DOM (rooms: emissive) | warm windows flicker ≤3% on the breath clock — *all fires are one fire* | ~free |
| **The hearth heartbeat** | both | the Lodge fire (and each stove) breathes ±8% + an occasional rising ember | ~free (DOM) / breath uniform (3D) |
| **Biscuit ambles** | DOM | the cat walks a slow looping path, sits, grooms, naps in sun/dusk-warm spots | 1 sprite tween |
| **A bird** *(rare)* | DOM | arcs across the sky on a bezier, sometimes lands on a roof/branch; startles at the bell | rare; `full` only |
| **A deer / fox** *(rare)* | DOM | steps from the treeline, pauses, looks, melts back into the woods (fox at dusk) | rare; `full` only |
| **Gusts of wind** *(periodic)* | DOM + rooms | the conductor: leans the trees, jingles the chime, blows a few leaves, drifts the smoke | periodic; `full`+`lite` |

### 5.3 The wind system (the conductor)

A single global **wind** state (a slow value with occasional **gusts**) is the emergent-aliveness
centerpiece: a gust briefly (a) leans the foliage sway harder, (b) drifts smoke sideways, (c) jingles the
wind-chime ([§4.2](#42-the-signature-set-the-hero-delights) #6) and plays its shimmer, (d) blows a few
leaves across the clearing, and (e) modulates the breath so the world leans *together*. One system, many
correlated effects = the world feels like it has weather and mood without any of it being scripted per
element. Gust cadence is data (`AMBIENCE.gustEveryMs` ± jitter); the wind **audio** bed
([§8.1](#81-the-sound-palette)) shares the same value so you *hear* the gust you *see*.

### 5.4 Rare wonder events (the "did you see that?")

The magic of A Short Hike is the **rare, unrepeatable-feeling** cameo. Emberwood keeps a tiny pool of rare
ambient events on long, jittered timers (never on a schedule the child can game, never announced, never
logged):

- **The deer at the treeline** (golden day) / **the fox** (dusk) — steps out, looks, leaves.
- **A shooting star** (dusk/night mood) — a brief streak across the sky.
- **A firefly lands on your focus** — the currently-focused cabin or cursor gets a single firefly alighting
  for a moment, then drifting off.
- **Biscuit brings a "gift"** — very rarely the cat noses a leaf/acorn to the Lodge step and sits by it.

These are **pure wonder**: signal-free ([§1.2](#12-the-firewall-juice-is-never-signal)), never a
collectible, never "1/4 creatures seen." They exist so a child who *looks* is quietly rewarded with a
world that feels bigger than its mechanics.

---

## 6. Time & weather

The **only** notion of time is the core spec's `dayOffset` (0 / 7 / 30) surfaced as the time-lapse
control; there is no wall-clock (guardrail — a clock creates pressure). Weather is a **mood LUT** (art
bible §5): a swap of {sky, shadow tint/length, firefly density, lantern-lit state, fire dominance, audio
bed} with **no new geometry**.

### 6.1 Golden hour = the resting default

Emberwood **rests** at warm golden hour (art bible: night/moody-as-default is a **banned outcome**). This
is home base: warm cream→peach sky, long soft blue-violet shadows, the hearth amber, Biscuit in a sun
patch. Every session opens here.

### 6.2 The dusk time-lapse ("a week later…") — the honest quieting

The labeled DOM control steps **Right now → A week later… → A month later…** (`dayOffset` 0 → 7 → 30).
Stepping it **visibly settles the clearing toward dusk** — a felt "time has passed, the day is ending":

| Step | Sky (`MAP_COLOR_SCRIPT`) | Shadows | Life | Light | Audio bed |
|---|---|---|---|---|---|
| **Now (day 0)** | `skyTop #FCEAC2 → skyLow #F4B074` (cream→peach) | short, warm-edged | "new" shimmers present; birds | windows warm; lanterns unlit | forest + soft birdsong |
| **A week (day 7)** | peach → soft rose; sun a notch lower | longer, bluer (`softShadow` up) | shimmers fade; fireflies begin | lanterns *invite* lighting | birdsong lowers; first crickets |
| **A month (day 30)** | rose → dusk-violet; sun low | long, deep blue-violet | fireflies thick; deer→fox | lanterns want lighting; hearth dominant | crickets + wind; bed quietest |

This is the **synthetic-return device made beautiful**: it doesn't nag "come back!" — it *shows* the world
growing quiet and, wordlessly, asks **what you'd wander back to**. It is an **observation** device (the
guide/QA steps it); it is never a reward loop, never a countdown, never FOMO.

### 6.3 The hearth-storm (cozy rain) — the optional peak-cozy mood

A mood variant (art bible's "hearth-storm"): gentle rain streaks on the cabin window(s), rain patter on the
roof, **the hearth glows *more* dominant** (warm-inside vs cool-wet-outside = peak coziness), soft puddle
ripples in the clearing, and Biscuit comes indoors to the rug. Rain is a cheap DOM/shader overlay + an
audio layer; it is used **sparingly for extra warmth**, never as a stressful weather event — there is no
"storm coming, hurry." It reads as *"what a lovely evening to be inside by the fire."*

### 6.4 Seasons as cosmetic reskins, not events

Optional slow seasonal skins (autumn leaves = the golden default; a winter snow variant where the branch
delight drops snow; spring blossoms) — driven by a cosmetic cycle or the real calendar, **not** a
time-limited event calendar. **No exclusive, missable, timed content.** Animal Crossing's warmth without
Animal Crossing's FOMO. Seasons are ambient wardrobe; they change nothing measurable and lock nothing away.

### 6.5 How light/mood reads

The mood LUT is one function; the color-script above is its data. The **read** the child gets: warm+bright
= *the good part of the day, come make something*; dusk = *the day is settling, what pulled you back?*;
hearth-storm = *cozy inside, the fire is the whole world.* The warm/cool split (warm lit surfaces vs
blue-violet dusk shade) is preserved at every step — dead-gray shade is a banned outcome even at dusk.

---

## 7. Transitions & juice

The polish that makes the world feel **crafted** at every seam. All honor reduced-motion → instant cut.

### 7.1 Entering a cabin (the door-swing + hearth reveal)

The signature transition. Identity continuity (the domain hue + the fire) is the constant across the cut,
so the child never loses "where am I / how do I get back" (world-visual §A5):

1. **Select** a cabin (click/tap/Enter). The cabin sprite's **door swings open** on a spring (`doorSwing`,
   the door layer rotates in the 2.5D sprite), and **hearth-amber light spills out** and blooms toward the
   viewer as a radial warm gradient in that cabin's hue (`HUE_RAMP` terracotta/sage/periwinkle).
2. **Sound:** a wooden *door creak* + iron *latch*, then a **welcoming crackle** of the fire inside.
3. **The hue wipe:** the DOM clearing dissolves under the warm hue wipe *while* the persistent 3D `<Canvas>`
   **preloads the room GLB** underneath (the ~1 beat of door-swing hides the WebGL warm-up; never remount
   the Canvas — swap contents).
4. **Reveal:** the 3D room fades up **once ready**, already warm — you step *toward the same fire* you saw
   in the window. The room's doorway object (zone-owned) is the eye's next landing spot.

### 7.2 Arriving home (exit → the Lodge welcome-breath)

Exiting a cabin ("← back to the clearing") reverses it: the room fades under the hue, the DOM clearing fades
up **centered on the Lodge**, the **hearth does a gentle welcome-breath** (`arrivalHome` — a soft glow
swell + settle), a warm arrival chord plays, and the ambient bed swells back in. If the visit was a
**voluntary return**, the returned-to cabin shows the warm window-halo cue (zone/core-owned) — **with zero
points attached** ([§1.2](#12-the-firewall-juice-is-never-signal)). The last-entered cabin keeps a soft
footprint ("you were just here").

### 7.3 Footstep feedback / traversal juice

Navigation is **focus-based** (roving-tabindex; arrow keys move focus one cabin at a time — the frozen a11y
model, not a steered cursor). Traversal juice makes moving between cabins feel like *walking the path*:

- **On travel to a cabin:** an animated **footprint-trail** fades in along the dirt path toward it, with
  soft **dirt footstep** sounds (pitch-jittered so they never machine-gun), arriving with a tiny settle.
- **On the footbridge segment:** the steps switch to **hollow wood clunks** (surface-aware footsteps).
- **On keyboard focus-change:** a subtle single step-tick per cabin, so keyboard nav feels footed too.
- *(If a later phase adds a light guided avatar, the footstep juice binds to its steps instead; the model
  above is the no-avatar default and preserves the frozen focus-nav a11y contract.)*

### 7.4 Hover / focus / selection feel

Cozy = small warm changes, soft springs; **no big pops** (Pillar H). Touch has no hover (matches the
shipped `canHoverQuestMarker("touch") === false`), so touch relies on the press + commit feel.

| State | Feel (tokens) |
|---|---|
| **Hover** (mouse/pen) | cabin lifts a hair (`hoverLift`), its window brightens a touch, the hanging sign sways, a soft attention shimmer |
| **Focus** (keyboard) | a visible focus ring + the same warm brighten + an SR announcement (label + verb + return-state) |
| **Press** | a gentle squash (`press`, immediate) — the tactile "I've got it" |
| **Commit** | the door-swing (§7.1) |
| **Voluntary-return glow** | `welcomeBack` warm halo (existing token) — warmth only, never a badge |
| **Prompted-return** | `promptedRecede` — quieter, cooler; visibly *recessed*, never celebrated |

### 7.5 The doorway-object handshake

Inside the room, the **doorway object** (the console screen / the Build Bench blueprint+GO key / the easel
portal) is **owned by the zone specs** and is the one thing that *does* emit + open content later. The
aliveness layer's job is only the **frame around it**: the warm reveal, the composed camera settle, the
"this is the one warm thing to do" glow-pulse grammar, and the guilt-free exit. This doc never turns the
doorway object into a delight or a delight into a doorway — they stay cleanly separated.

---

## 8. Sound design

Sound is where "you are somewhere real" is won cheaply (Firewatch/Unpacking). All **CC0 or synthesized**;
tiny footprint; **always mutable**; **always mirrored visually** (deaf/HoH parity is a hard requirement,
not an option — per every v2 zone spec).

### 8.1 The sound palette

| Layer | What it is | Source (CC0 / synth) | Trigger | Notes |
|---|---|---|---|---|
| **Forest bed** | low birdsong + leaf-rustle + distant stream | Kenney CC0 nature / freesound CC0-filtered, or layered synth | always (loops) | the "you're outside" floor; lowers at dusk |
| **Crackling fire** | a soft looping crackle + pops | Kenney CC0 / synth grains | always near Lodge; louder in rooms | volume rises near the hearth; pops on stoke |
| **Wind** | filtered-noise bed that swells on gusts | **procedural** (filtered pink noise + LFO) | continuous; gust-driven | shares the wind value with the visual gust (§5.3) |
| **Footsteps** | dirt/grass vs hollow wood | Kenney CC0 footstep pack / short synth thuds | on traversal (§7.3) | surface-aware; pitch-jittered to avoid repetition |
| **Wind-chime** | pentatonic bells, always in tune | **Tone.js synth** | gust + tap (§4.2 #6) | randomized order; never a wrong note |
| **Warm musical bed** | slow generative pad + soft mallet motifs | **Tone.js** (generative) or a CC0 lo-fi loop | always (very low) | the emotional floor; per-cabin voice (§8.2) |
| **Juice SFX** | bell *ding*, lantern *fwoomp*, cat purr/*mrrp*, water *plip*, door *creak*+latch, chair *creak*, leaf *rustle*, arrival chord | Kenney CC0 + Tone.js one-shots | per micro-interaction / transition | short, warm, pitch-jittered; each has a visual twin |

### 8.2 The warm musical bed (a place with a voice)

A slow, generative, **major/lydian** pad with occasional soft mallet/bell motifs — low enough to be *felt*,
not listened to. Each cabin has a faint **diegetic voice** that swells as you approach it (the shared-fire
idea in sound): the **Music** cabin adds a gentle melodic phrase, **Code** a soft music-box, **Art** a warm
sustained string. Standing in the clearing you hear them blend faintly — the hamlet *sounds* like one warm
place. The bed **ducks** slightly when a cabin's own taste audio plays (so the room's activity is never
fought by the ambience).

### 8.3 Procedural audio (why Tone.js)

Tone.js is **MIT** and already in the stack (zone-music). Using it for the wind-chime, the musical bed, and
the in-key juice one-shots means: **zero large audio downloads** for the tonal content, **always-in-tune**
results (no "wrong note" is possible), and deterministic output for QA (`?seed=` fixes the bed). Recorded
CC0 clips are reserved for the textural layers (fire, footsteps, forest) where synthesis is less convincing;
keep each clip short and looped.

### 8.4 Constraints & rules

- **Gesture-gate the `AudioContext`** (Web-Audio autoplay policy): no sound until the first interaction;
  the world is beautiful and legible **silent**, so muted-by-policy is never broken.
- **Always a master mute + volume**, persisted; a "quiet mode" preset (bed + gentle SFX only, no gusts).
  Reduced-*motion* does not force reduced-*sound*, but offer both toggles independently.
- **Cheap spatialization:** pan/volume by the object's DOM position (louder/closer = the object you're near);
  no full 3D audio graph needed.
- **Visual mirror (hard requirement):** every audible cue has a visible twin — the bell's ripple, the
  fire's swell, the chime's sway, an SR text ("Biscuit purrs") — so a deaf/HoH child perceives the same
  delight. Audio is **additive**, never the sole channel for anything.
- **Tiny + licensed:** total recorded audio in the low-hundreds-of-KB (short CC0 clips + procedural);
  log every clip's source + license in `assets/LICENSES.json` (+ NOTICE for any CC-BY, though prefer CC0).

---

## 9. Theme expansion — Emberwood's living charm

Turn the world's identity into **lived moments and discoverable wonder** — never a points game (Pillar I,
[§1.2](#12-the-firewall-juice-is-never-signal)).

### 9.1 The shared hearth-fire (cohesion made interactive)

The bible's strongest motif — *the same fire burns in the Lodge and in every cabin* — becomes a **felt
mechanic**: **stoking the Lodge hearth pulses every cabin window a touch warmer for one beat**
([§4.2](#42-the-signature-set-the-hero-delights) #2), and the breath clock ([§5.1](#51-the-breath-clock-one-heartbeat-for-the-whole-world))
ties every flame's flicker to one rhythm. Standing in the clearing you can *see* that the fire you warm
your hands at is the fire in each window. It says, without words: **this is one place, and you belong to it.**
(This is the felt opposite of the retired midnight-cosmos's cold vastness.)

### 9.2 The lamplighter dusk (a ritual, not a chore)

As the time-lapse settles toward dusk ([§6.2](#62-the-dusk-time-lapse-a-week-later--the-honest-quieting)),
the lanterns on their posts wait, unlit, to be lit ([§4.2](#42-the-signature-set-the-hero-delights) #5).
Lighting them is a **cozy ritual** — each one pools warm light and stays lit for the session — but there is
**no counter, no "light all 6," no reward** for doing it. It's the pleasure of tending a place at dusk,
offered and never demanded. A child who lights none loses nothing; the world just glows a little more for
the one who does.

### 9.3 Quiet discoverable corners

The anti-gamification expressed *positively*: wonder that rewards **looking**, never grinding, and is
**never enumerated**:

- The **deer/fox** at the treeline ([§5.4](#54-rare-wonder-events-the-did-you-see-that)).
- **Initials carved in the footbridge** rail; a **tiny door** at the base of a big tree; a **message in a
  bottle** that drifts down the stream and away.
- A **hidden fourth "empty lot"** with a mossy stump and a `?`-less "someday" feeling — future cabins as
  future neighbors (art bible "room to grow").
- **Biscuit's secret nap spots** (a sunny windowsill, the rocking chair, the warm hearthstone) — find where
  the cat likes to be.
- A **firefly that alights on your focus** for a beat ([§5.4](#54-rare-wonder-events-the-did-you-see-that)).

None of these is a collectible. There is no "corners found: 2/6." They exist so the world feels **deeper
than its rules** to the child who wanders slowly — which is exactly the child the product most wants to serve.

### 9.4 The cast of the clearing (light lore, no dialogue trees)

Emberwood has a **cast**, not characters-to-complete: **Biscuit** the amber cat (the wandering heart of the
place); the **shy deer** and the **dusk fox**; the wind-up **Sprout** on the Code porch; the birds. They
have *presence* and names, not quests, inventories, or friendship meters. Their whole job is to make the
place feel inhabited and warm — the felt "someone lives here" (bible Pillar C), extended to "someone, and a
cat, and sometimes a deer, live here."

### 9.5 Room to grow (new cabins are new neighbors)

The clearing is drawn with **visible empty lots** (a stump, a cleared patch, the footbridge stub over the
stream). When a new domain is added, it arrives as **a new cabin/neighbor across the bridge** — more path,
a warm new window, a new voice in the musical bed — **without ever re-drawing the map** (art bible §1;
world-design §A3). Growth is *the hamlet getting cozier*, never a tech-tree to unlock.

---

## 10. Accessibility & reduced-motion (rigorous)

- **Reduced-motion = a serene, complete postcard** (Pillar K). The breath clock freezes at a pleasant
  mid-phase; smoke/sway/fireflies/gusts still; the cat naps; transitions are instant cuts; micro-interactions
  become **instant state changes** (the pet happens, the lantern is lit) keeping their **sound + a static
  warmth-bump**. It is calm and whole, never a scene with the motion hollowed out.
- **Every delight is keyboard-operable + labeled + SR-announced** ("Biscuit the cat — pet"; on activate,
  "Biscuit purrs and curls up"). Focus moves one item at a time (never a steered cursor); color-independent
  state; visible focus ring; WCAG 2.2 AA.
- **Delights are optional by construction**, so no assistive user is ever blocked or penalized (the grace of
  making them signal-free, [§1.2](#12-the-firewall-juice-is-never-signal)).
- **Deaf/HoH:** every audible cue has a visual twin ([§8.4](#84-constraints--rules)); no delight is
  audio-only.
- **Independent sound controls** (mute/volume/quiet-mode), persisted; audio gesture-gated so a silent world
  is a beautiful world.
- **The DOM clearing is the a11y floor and the primary surface** — never `aria-hidden`; the 3D room is the
  enhancement, and `board2d`/reduced-motion is a true, serene peer, not a lesser menu.

---

## 11. Hard floors + cost ceilings

Two-sided (LAAS-style): an **aliveness floor** (so the world can't feel dead) **and** a **cost ceiling** (so
it stays Chromebook-safe). Extends art bible §9.

| Budget | Clearing (DOM) | Cabin room (3D) |
|---|---|---|
| **Always-on ambient motions** | **≥ 5** (smoke · sway · fireflies · water · cat) + the breath | **≥ 3** (fire flicker · motes · one of plant-sway/cat-breath/vane) + the breath |
| **Rare wonder events** | **≥ 1** in the pool (deer/bird/fox/star), long jittered timers | n/a (or the sill-cat's occasional stretch) |
| **Signature micro-interactions** | **≥ 5** reachable (cat, hearth, bell, branch/stream, lantern, chime, chair) | **≥ 1** beyond the doorway object (stoke stove / pet sill-cat / rock chair) |
| **Time-to-first-delight** | a signature delight reachable **≤ 10s** from load (the cat or the hearth) | the room reads alive on entry |
| **GPU cost (idle)** | **~0** (DOM/CSS/`motion`); must not jank scroll/focus | **0** when idle/backgrounded (`frameloop="demand"`) |
| **GPU cost (interacting)** | transient CSS tweens, self-cleaning | bounded invalidation < ~2s, then settle to 0 |
| **Draw calls (room, ambience on)** | n/a | **< 50** (motes = `<Sparkles>`; delights reuse existing meshes — **0 new draw calls** ideally) |
| **Shadow-casters** | baked into sprites | **≤ 1** (frozen) — unchanged by aliveness |
| **Audio footprint** | low-hundreds-of-KB CC0 clips + Tone.js procedural; gesture-gated; mutable | shared with clearing |
| **Reduced-motion** | serene static postcard; delights = instant + sound | instant framing; fire = static glow |
| **The firewall** | **0** `ActivityEvent`s from any delight (QA-asserted) | **0** (only the zone doorway/taste emits) |

**Per-surface must-haves (all required):** the breath clock present · ≥ the floor of always-on motions · ≥1
signature delight, live and satisfying · one gentle sound per delight with a visual twin · reduced-motion
serene + working · **zero signal leakage from any delight** · draw-call/GPU budgets held.

---

## 12. Banned outcomes — instant fail

Any one fails the surface (extends the bible's §11 + the passion guardrails):

- **Firewall breach:** any micro-interaction that **emits a signal**, or is **counted / rewarded / gated /
  collected / badged / streaked**; a "petting log," an achievement, a "delights found: n/m," a daily-login
  reward, seasonal **FOMO** events. *(The single most important fail.)*
- **Arcade juice in a cozy world:** screenshake, confetti, big pops, saturated flashes, slot-machine
  reward feel, a fireworks tax. Juice must be **soft and warm** (Pillar H).
- **Dead or false affordances:** a thing that looks tappable and does nothing (juice's chocolate-covered
  broccoli); scenery that begs a tap it can't answer.
- **A twitchy, incoherent world:** unsynchronized ambient motion that reads as chaos instead of one breath
  (Pillar G); motion that janks the DOM map's scroll/focus.
- **Chromebook slideshow:** a continuous 3D frameloop for the whole world; ambient motion that keeps the
  GPU hot at idle; blowing `<50` draw calls or `dpr>1.5` to add life; sustained <30fps.
- **Night/moody or over-saturated** ambience; dead-gray dusk shadows; anything contradicting the art
  bible's palette or the warm/cool split.
- **Broken reduced-motion:** a hollowed-out frame (life amputated, holes left) instead of a serene,
  complete still; a delight that becomes unusable under reduced-motion; essential info conveyed only by
  motion or only by audio.
- **Time-as-pressure:** a wall-clock, a countdown, a "come back before…," celebrating a *prompted* return,
  or the time-lapse used as a reward loop instead of an observation.
- **The delight/doorway confusion:** turning the zone-owned doorway object into a mere delight, or a
  clearing delight into a signal-bearing doorway.

---

## 13. Self-score rubric (anchored to §3)

Per row: **10** = passes a one-second *feel* test beside the §3 references at 1080p on a Chromebook; **7** =
clearly synthetic but the same *class* of feel; **4** = decent hobby demo; **2** = a static/silent/twitchy
tech demo. **Score every phase; for each row write "what raises this +2"; implement the two cheapest first.**

Rows:

- **Aliveness at rest** (does a frozen frame feel one second from motion?)
- **Breath cohesion** (does it feel like *one* breathing place, not N loops? — Pillar G)
- **Micro-interaction satisfaction** (does petting/stoking/ringing feel *good*? — the juice)
- **Cozy restraint** (warm not arcade; no pops/shake/confetti — Pillar H)
- **Transition craft** (door-swing enter · arrival-home · footstep traversal · hover/focus feel)
- **Sound warmth & placement** (the bed + fire + wind + juice SFX feel warm, placed, and tiny)
- **Time reads as a quieting** (dusk time-lapse settles; hearth-storm is peak-cozy; not moody)
- **Discoverable wonder** (the rare events + quiet corners reward looking)
- **Signal-free integrity** (nothing counts; the firewall holds — Pillar I, §1.2)
- **Reduced-motion serenity** (a calm complete postcard, delights still work — Pillar K)
- **Chromebook perf** (DOM ~0 GPU; room `<50` dc; audio tiny; ≥30fps sustained)

---

## 14. Verification battery

Run at every phase close (reuses `window.__qa` + the VLM grader; integrates the QA harness):

1. **The firewall test (the headline, negative assertion).** Script a round-trip that fires **every**
   micro-interaction (cat, hearth, bell, branch, lantern, chime, chair, stream) and assert
   `window.__qa.getEmittedSignals()` records **zero** new `ActivityEvent`s from them, and that the return
   grid / hypothesis is unchanged. A delight that leaks a signal **hard-fails**.
2. **Aliveness-at-rest VLM check.** On a static screenshot + a short capture: "does this world feel alive
   (breathing, inhabited), not a still asset dump?" — pinned model, majority vote, with a motion-present
   pixel pre-filter.
3. **Micro-interaction liveness.** Each delight: pointer/keyboard round-trip → assert a **visible state
   change** (pixels/DOM) **and** the sound cue fired **and** it emitted **no** signal (ties to #1). A dead
   delight (looks tappable, does nothing) fails.
4. **Breath-cohesion test.** Assert a single breath source drives multiple elements (one clock, phase
   offsets) — catches N-independent-timer chaos (Pillar G).
5. **Reduced-motion test.** With reduced-motion: assert a **static** frame (no drift/sway/gust), that
   transitions are instant, and that micro-interactions still **work** (instant state + sound + static
   warmth-bump) — a broken/hollow frame fails (Pillar K).
6. **Perf HUD.** DOM ambient at 60fps with ~0 GPU + no scroll/focus jank; room `<50` draw calls with
   ambience on; idle/backgrounded room at `frameloop="demand"` (0 GPU); on a **real low-end device under
   sustained load** (throttling shows only after minutes).
7. **Audio gate.** Gesture-gated (silent-until-interaction is not broken); mute/volume work + persist;
   every audible cue has a visual twin (deaf/HoH); total audio footprint within budget; sources in
   `assets/LICENSES.json`.
8. **Time/mood test.** Stepping the time-lapse visibly settles the scene (sky/shadows/fireflies/lanterns
   per §6.2) and lowers the audio bed; the warm/cool split holds at dusk (no dead-gray shade); no
   countdown/FOMO appears.
9. **Contact sheet.** The clearing alive at golden hour · the same clearing at "a month later" dusk · a
   petting-Biscuit before/after · a door-swing cabin entry · the reduced-motion serene still.

---

## 15. Build order (Lane G) + additive tokens

Runs as **Lane G** (game-flow + movement + world aliveness + juice), on top of the warm art pack (art bible
P-A0) and alongside the world visuals (Lane W). Each phase closes with the reference-delta loop + self-score.

- **P-G0 — Tokens + firewall + references.** Add the additive `MOTION` kinds ([§4.4](#44-the-interaction-schema--additive-motion-tokens))
  and a new `AMBIENCE` config module (breath period, gust cadence, densities per tier, rare-event
  probabilities) to `interest-lab-view`; wire the **firewall** as a type-level invariant (`emitsSignal:
  false`) + the QA negative assertion; author the §3 feel-reference reel. *Gate: firewall test green on a
  stub; delta tool wired.*
- **P-G1 — The breath + ambient DOM life.** The breath clock ([§5.1](#51-the-breath-clock-one-heartbeat-for-the-whole-world))
  + the clearing ambient inventory ([§5.2](#52-the-ambient-inventory)) on the DOM map: smoke (+♪ notes),
  sway, fireflies, water, window flicker, Biscuit's amble, the wind system + gusts. *Gate: aliveness-at-rest
  VLM; breath-cohesion; DOM ~0 GPU.*
- **P-G2 — The signature micro-interactions.** The hero set ([§4.2](#42-the-signature-set-the-hero-delights))
  with the cozy-juice grammar + juice SFX: pet Biscuit, stoke the hearth (+ the all-windows pulse), the
  bell, the branch, the lantern, the chime, the chair, the stream. *Gate: micro-interaction liveness +
  firewall test; cozy-restraint self-score.*
- **P-G3 — Transitions & traversal.** Door-swing cabin entry + hue wipe + preload ([§7.1](#71-entering-a-cabin-the-door-swing--hearth-reveal));
  arrival-home welcome-breath; footstep traversal; hover/focus/press feel. *Gate: transition-craft
  self-score; never-remount-Canvas held; reduced-motion instant cuts.*
- **P-G4 — Time & weather.** Golden-hour default; the dusk time-lapse quieting ([§6.2](#62-the-dusk-time-lapse-a-week-later--the-honest-quieting))
  with the color-script deltas; the hearth-storm mood; cosmetic seasons. *Gate: time/mood test; no
  FOMO/countdown.*
- **P-G5 — Room aliveness.** The 3D cabin-interior aliveness ([§4.5](#45-the-performance-model-two-budgets)):
  fire flicker, dust motes, the sill-cat, the stove-stoke + chair, on `frameloop="demand"` with bounded
  invalidation. *Gate: room `<50` dc with ambience; idle = 0 GPU.*
- **P-G6 — Sound pass.** The forest+fire+wind bed, the generative musical bed + per-cabin voice, the Tone.js
  wind-chime + in-key one-shots, the surface-aware footsteps; gesture-gate + mute + ducking + visual
  mirrors; the manifest. *Gate: audio gate; deaf/HoH mirror check.*
- **P-G7 — Rare wonder + quiet corners.** The rare-event pool ([§5.4](#54-rare-wonder-events-the-did-you-see-that))
  + the discoverable corners ([§9.3](#93-quiet-discoverable-corners)), all signal-free + un-enumerated.
  *Gate: discoverable-wonder self-score; firewall test still green.*
- **P-G8 — A11y + perf + gate.** Full reduced-motion serenity, keyboard/SR pass, tier scaling, sustained-load
  perf on a real Chromebook; the full battery ([§14](#14-verification-battery)) + operator free-explore on
  `localhost`. *Gate: all §14 green; the §3 hero feel-frames snag no category error at a one-second glance.*

**The additive contract (no breaks).** Everything here is **value/behavior added on top of** the frozen
`Scene3DView` / `HUE_RAMP` / `ZonePlugin` / `RoomProps` / `ActivityEvent` shapes: new `MOTION` kinds, a new
`AMBIENCE` module, a new `MicroInteraction` type, a new app-level audio module, and the QA negative
assertion. **No existing consumer changes; no signal-contract change** — the aliveness layer is, by
construction, invisible to the interest engine.

---

## 16. Final acceptance — the "come back tomorrow" test (ours)

The bible's two-frame test proves the world is *beautiful*. This layer adds one more: **does a child want
to come back to Emberwood even before there is anything to learn there?**

Produce the four §3 hero feel-moments (clearing-alive · petting-Biscuit · cabin-entry · a-week-later) and
let an operator (and, ideally, an 8-year-old) free-explore on `localhost`. If, within a minute, the world
feels **alive** (it breathes; the cat wanders; the wind moves through), **responsive** (touching things is
softly satisfying), **warm** (the fire, the light, the sound), and **unhurried** (nothing counts, nothing
nags) — and if the child pets the cat again *just because* — the layer has done its job. If the eye or ear
snags on a **category error** — a static/silent world, arcade-y pops, a dead affordance, a leaked
counter/badge, a broken reduced-motion frame, or a dusk that reads moody instead of cozy — **the task is
not done. Iterate the delta loop.**

> Emberwood should feel like a place a child would visit at the end of the day even if the cabins were
> empty — because the fire is lit, the cat is out, and the wind just moved the grass. *That* is what makes
> the interest signal, when the content finally arrives, worth trusting.
