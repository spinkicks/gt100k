> # ⚠️ SUPERSEDED — DO NOT BUILD FROM THIS FILE
> This v1 single-surface "Storybox" design is **superseded** by:
> - **[`2026-07-21-zone-art-design-v2.md`](./2026-07-21-zone-art-design-v2.md)** — the current two-layer (discovery world + content app) design, and
> - **[`2026-07-21-cabin-interior-art.md`](./2026-07-21-cabin-interior-art.md)** — the enriched, buildable **"Atelier"** interior (the grand-easel doorway + art in ALL its forms: a drawing tablet, a warm **"digital easel,"** a kindly **Bob-Ross homage**, and framed **meme** prints — the digital tools are **ambient live-tastes, never a second doorway**).
>
> Kept only for git history. **Canonical binding now:** domain = **`visual_design`** (not the `visual` used below). If anything below disagrees with the v2 / cabin specs or [`2026-07-21-interest-lab-reconciliation.md`](./2026-07-21-interest-lab-reconciliation.md), **those win.**

# Interest Lab — Zone: ART STUDIO (domain `visual`) — design

**Date:** 2026-07-21 · **Owner:** David · **Lane:** 3 (parallel zone loop) · **Domain:** `visual` · **Zone id:** `art`
**Builds on (read first):**
[world design](./2026-07-21-interest-lab-world-design.md) ·
[world precedents / intrinsic integration](../../research/interest-lab-world-precedents.md) ·
[asset + art-direction pipeline](../../research/stylizedWorldAssetPipeline.md) ·
[passion brainlift](../../research/passionBrainlift.md).
**Frozen interfaces it targets:** `ZonePlugin` (lane-0 `interest-lab-view`), the domain types in
`@gt100k/interest-lab` (`Probe`, `WorkMode`, `EngagementEvent`, `EventType`), and the shared
art-direction pack already in `interest-lab-view/src/art.ts` + `scene.ts` (`PALETTE`, `SCENE3D`,
`CAMERA3D`, `QUALITY_TIERS`, `WORK_MODE_GLYPHS`, `resolveMotion`).

---

## 0. The one-line pitch

**The Storybox** — a warm little shadow-box diorama on an artist's desk that a child *furnishes, arranges,
lights, and captions*. You pull glowing props off a shelf and drop them into the box; **the shared
art-direction pack (one HDRI + palette tint + fog + bloom) auto-beautifies everything the instant it lands**,
so a 9-year-old's first drop already looks like a storybook illustration. The **doing is the probe**: placing =
*make*, sliding/framing = *compose*, the mood-dial + caption + story-beats = *express/tell*, tidying =
*refine*. The saved artifact is an illustrated **Scene Card** that hangs framed on the studio wall and,
half-finished, glows to invite an unprompted return. No quiz, no tutorial wall, no score.

This is the deliberate inverse of v1's opaque stub: entering the Art Studio drops you *straight into making a
picture*, not into a pretty door in front of a form (intrinsic integration — Habgood & Ainsworth; the
"chocolate-covered broccoli" fix from the precedents memo).

---

## 1. Moment-to-moment interaction (teach by affordance, zero tutorial)

Fixed camera per `CAMERA3D` (fov 42, no pan, no zoom, clamped orbit, damped). The child looks *into* a
shoebox-sized stage with **three depth slots**: `backdrop` (far wall / sky), `stage` (the floor where most
props live), `foreground` (near lip). To the right, a **Prop Shelf**; above, a **hanging work-lamp** that
doubles as the mood dial.

**Second-by-second, first visit:**
1. The box opens already holding **one bobbing starter prop** (a little pine, drei `<Float>`), and a soft ramp
   of light points *shelf → box*. That single arranged detail is the whole instruction (World 1-1: the
   environment teaches; no modal). The shelf's top 3 items pulse gently — grab-me affordance.
2. The child **drags any shelf item into the box** (or, in DOM/keyboard, picks it and chooses a slot). It
   **settles with a soft bounce** (`resolveMotion("markerPop")`), drops a frozen `<ContactShadows>` contact
   shadow, and immediately picks up the HDRI key light, the palette tint, and bloom → **it looks finished on
   contact.** That "wow, *I* made that" beat is the hook, and it is structural, not skill-based.
3. **Progressive disclosure by state, never by tooltip wall:**
   - after the **2nd** placement, the lamp's **mood knob** wakes and glows → invites *express*.
   - the first time a prop is **dragged**, faint **thirds guides + a depth ribbon** (near/mid/far) fade in →
     invites *compose*.
   - when two props **overlap**, a **tidy sparkle/broom** appears on them → invites *refine*.
   - when the box "reads full" (≥ ~5 elements across ≥2 layers), a **frame slides in** with a *keep this*
     affordance → invites saving the artifact.
4. **Safe, un-punishing failure:** every action is undoable; *clear* asks once; a messy overlap just *looks*
   messy (and is fixable by *refine*), it is never scored or scolded. Recovering from a mess is itself a
   tracked, positive signal (`FAILURE_RECOVERY`), never a penalty.

One clear verb is legible at every moment (place → arrange → light → tell → tidy → keep). Player-facing labels
(prop names, "your scenes", the mood names) are allowed — we don't fetishize pure diegesis (the Dead Space
caution from the precedents memo).

---

## 2. The fun loop (place/draw → looks good → refine → express)

```
   ┌────────────────────────────────────────────────────────────────────┐
   │  MAKE            COMPOSE           EXPRESS / TELL        REFINE      │
   │  pull a prop  →  slide it, set  →  flip the mood,     →  nudge,      │
   │  / wash sky      its depth,        caption it,           tidy,       │
   │  / scatter       frame the shot    set 3 story beats     re-tint     │
   │      │               │                   │                  │        │
   │      └──── every action is auto-lit + palette-tinted + fogged ───────┤
   │                     = "it looks good" (immediate, skill-free)        │
   │                                    │                                 │
   │                         KEEP  →  Scene Card saved                    │
   │                         → framed on the studio wall                  │
   │                         → a half-finished one GLOWS = come-back cue  │
   └────────────────────────────────────────────────────────────────────┘
```

The loop is intrinsically satisfying (make a lovely picture) so we never bolt reward onto it. The **come-back
mechanism lives *around* the loop, not inside it** (Yu-kai Chou's intrinsic-retention paradox): the studio
wall quietly holds your scenes and one half-finished frame glows — a *single, gentle, opt-in* cue, never a
streak, countdown, or FOMO.

---

## 3. The real artifact — the **Scene Card**

Saving produces a durable, structured artifact (not a screenshot-only trophy):

```ts
interface SceneCard {
  id: string;
  learnerRef: string;
  title: string;                 // child-authored (optional at 6-8)
  caption?: string;
  storyBeats?: [string, string, string];      // before / now / after (the "tell" mode)
  mood: "dawn" | "day" | "dusk" | "night" | "storm";
  paletteKey: string;            // which shared-palette variant is active
  framing: "wide" | "cozy" | "hero";          // one of the pre-authored fixed framings
  elements: Array<{
    propId: string; layer: "backdrop" | "stage" | "foreground";
    slot: SlotName;              // nameable 3x3 slot (see §6) — describable, not raw px
    scale: number; tintKey: string;
  }>;
  thumbnailRef: string;          // rendered PNG (3D) OR the generated scene description (DOM)
  altText: string;               // always generated — the composition as words (low-vision parity)
  createdAtDayOffset: number;
  revisions: SceneRevision[];    // append-only; each edit is a node (Evidence-Graph friendly)
  artifactEvidenceMet: string[]; // which probe artifactEvidence bars this card satisfies
}
```

**Where it goes (three destinations, one record):**
1. **Diegetically, on the studio wall** — saved scenes hang as framed pictures; a half-finished draft hangs
   *glowing* (the come-back cue). Re-opening one is the observable revisit.
2. **In a "your scenes" shelf** inside the Storybox (and its DOM peer) — re-openable, re-composable. Re-opening
   to improve = `UNREQUIRED_REVISION` (and `VOLUNTARY_RETURN` if unprompted).
3. **Into the signal + evidence layer** — `SceneCard.artifactEvidence` → the engine's `ARTIFACT_COMPETENCE`
   event; the append-only `revisions[]` is exactly the process record the Evidence Graph grades (grade the
   dead ends and iterations, not the polish — passion brainlift SPOV 7).

---

## 4. Probe signals — action → work-mode → event (the core deliverable)

**Grounding note (faithful to the real engine):** `EngagementEvent` carries
`{ domain, probeId, familyId, type, occurredAtDayOffset, ... }`; **`workMode` is a property of the `Probe`**
(looked up via `probeId`). So the zone tags each action with a `probeId`, and the `domain × workMode` grid the
world-design describes is populated by *which probe each action fires* plus its `type` (→ signal family). The
two axes are orthogonal: an action has **one work-mode** (from its probe) **and** may raise **one signal-family
event** (from its context). Both feed the coverage matrix and hypothesis.

### 4.1 Child-facing work-mode → canonical `WorkMode` (so the grid columns line up cross-zone)

| Child work-mode | Canonical `WorkMode` | Glyph (`WORK_MODE_GLYPHS`) | Also the shared column with… |
|---|---|---|---|
| **make** (create marks/objects) | `build` | `glyph-hammer` | Music *make*, Code *make* → the **maker** column |
| **compose** (arrange / frame) | `compose` | `glyph-quill` | (art-distinctive; recurs if music "arrange") |
| **express / tell** (narrative / mood) | `explain` | `glyph-speech` | Music *explain-a-piece*, Code *explain-a-program* → the **communicate** column |
| **refine** (polish) | `debug` | `glyph-wrench-bug` | Music *fix*, Code *fix/debug* → the **improver** column |

Rationale: `build` and `debug` are deliberately **shared across all three zones** so the grid can detect a
*work-mode* child (a "maker" or a "polisher" who lights up the column regardless of topic) versus a *visual*
child (who lights up the `visual` row across make/compose/express/refine). That row-vs-column disambiguation is
the entire point (precedents §2).

### 4.2 Action → signal table

| # | What the child does (moment-to-moment) | Child mode | `WorkMode` | probeId | `EventType` it can raise | Signal family |
|---|---|---|---|---|---|---|
| 1 | Drag a prop from the shelf into the box | make | `build` | `art.make.furnish.v1` | (activity tick) → `ARTIFACT_COMPETENCE` on save | artifact_competence |
| 2 | Wash the backdrop/sky with a palette swatch | make | `build` | `art.make.furnish.v1` | (tick) | — |
| 3 | Scatter/stamp foliage or stars (instanced) | make | `build` | `art.make.furnish.v1` | (tick) | — |
| 4 | Start a **blank box** from scratch (self-chosen) | make | `build` | `art.make.blankbox.v2` | `SELF_AUTHORED_SCOPE`, `CHOSEN_CHALLENGE` | self_authored_scope, chosen_challenge |
| 5 | Slide a prop left/center/right | compose | `compose` | `art.compose.arrange.v1` | (tick) | — |
| 6 | Move a prop between depth layers (near/mid/far) | compose | `compose` | `art.compose.arrange.v1` | (tick) | — |
| 7 | Choose a framing + place focal on a thirds guide | compose | `compose` | `art.compose.frame.v2` | `CHOSEN_CHALLENGE` (stretch) | chosen_challenge |
| 8 | Turn the mood dial (dawn/dusk/night/storm) | express | `explain` | `art.express.mood.v1` | (tick) | — |
| 9 | Type a title / caption | express | `explain` | `art.express.tell.v2` | (tick) | — |
| 10 | Set the 3 story beats (before/now/after) | express | `explain` | `art.express.tell.v2` | `SELF_AUTHORED_SCOPE` | self_authored_scope |
| 11 | Share the scene to the **gallery wall** / tell it to an audience | express | `explain` | `art.express.gallery.v3` | `ARTIFACT_COMPETENCE` | artifact_competence |
| 12 | Nudge/snap alignment; run the tidy broom | refine | `debug` | `art.refine.polish.v1` | (tick) | — |
| 13 | Re-tint / rescale one element **after "done"** | refine | `debug` | `art.refine.polish.v1` | `UNREQUIRED_REVISION` | unrequired_revision |
| 14 | **Re-open a saved Scene Card** to improve it | refine | `debug` | `art.refine.polish.v1` | `UNREQUIRED_REVISION` (+ `VOLUNTARY_RETURN` if unprompted) | unrequired_revision, voluntary_return |
| 15 | Rebuild after a *clear/undo-everything/"it looked messy"* moment | (mode of the rebuild action) | (that probe) | as above | `FAILURE_RECOVERY` | failure_recovery |
| 16 | Save the Scene Card (meets its `artifactEvidence` bar) | (current mode) | (current probe) | current probe | `ARTIFACT_COMPETENCE` | artifact_competence |
| — | Use the always-present **help** affordance | any | any | any | `ASSISTIVE` (`assistive:true`) | *never lowers a signal* |

**Return signal (cross-cutting, the actual point):**
- **Unprompted re-entry** to the Storybox / re-open of a scene after novelty decays → `VOLUNTARY_RETURN`
  (`horizon` 7/30) → fires the **`welcomeBack`** delight (`resolveMotion("welcomeBack")`, `spark` tone),
  **label-free, zero points attached**.
- **Re-entry after a reminder/nudge** → `PROMPTED_RETURN` with `interventionContext` → visibly recedes,
  **excluded** from the voluntary signal.
- First-session enthusiasm is **novelty**, not interest — it is gated (keeps the hypothesis `EMERGING` and
  schedules a delayed return check), so a burst of first-drops never confirms anything.

### 4.3 Coverage contribution (helps the grid + the candidate gate)

The 4 families / 8 probes below deliberately span the coverage dimensions `buildCoverageMatrix` checks, so the
`visual` row alone is richly populated:

| probeId | `workMode` | `difficulty` | `social` | `audience` | `autonomy` | `artifactEvidence` |
|---|---|---|---|---|---|---|
| `art.make.furnish.v1` | build | foundational | solo | no_audience | medium | scene has ≥3 placed elements |
| `art.make.blankbox.v2` | build | stretch | solo | no_audience | high | self-started blank box: backdrop wash + ≥6 elements |
| `art.compose.arrange.v1` | compose | foundational | solo | no_audience | medium | elements across ≥2 depth layers |
| `art.compose.frame.v2` | compose | stretch | solo | no_audience | high | focal element on a thirds guide + chosen framing |
| `art.express.mood.v1` | explain | foundational | solo | no_audience | medium | a mood/time-of-day committed to the scene |
| `art.express.tell.v2` | explain | stretch | solo | no_audience | high | title + 3 story beats |
| `art.express.gallery.v3` | explain | stretch | **group** | **audience** | high | scene shared to the gallery wall for an audience |
| `art.refine.polish.v1` | debug | stretch | solo | no_audience | medium | ≥1 unrequired revision after "done" |

Spread: build×2 · compose×2 · explain×3 · debug×1; solo×7 + **group×1**; no_audience×7 + **audience×1**;
foundational×3 + stretch×5 — i.e. the zone supplies both `solo`/`group`, both `foundational`/`stretch`, and
both `audience`/`no_audience` presence entirely within the `visual` row (all `safetyClass:"cleared"`, content
is authored CC0).

---

## 5. States (empty / first-run / mid / completed / return visit)

| State | What the child sees | What is emitted / persisted |
|---|---|---|
| **empty** | Warm desk, blank box, glowing shelf, **one bobbing starter prop**, hanging lamp. Copy: *"Make a little world."* No numbers, no CTA nag. | nothing yet |
| **first-run** | After the first drop: the beauty payoff (auto-lit/tinted/bloomed) + the mood knob waking. Coaching is by affordance only. | `build` ticks on `art.make.furnish.v1`; novelty-gated |
| **mid** | Half-built scene; mood maybe set; a **draft auto-saves**; leaving now leaves a **glowing half-finished frame** on the wall. | draft `SceneCard`; ticks per action; possible `SELF_AUTHORED_SCOPE`/`CHOSEN_CHALLENGE` |
| **completed** | Box reads full → *keep this* frame → celebration capped by `celebrationCeiling` (age band) → natural-endpoint copy: *"That's a good place to stop — your box will be here."* | `ARTIFACT_COMPETENCE`; `SceneCard` saved → wall + shelf + evidence |
| **return visit** | The wall shows your framed scenes; a half-finished one glows (opt-in). Re-opening it unprompted = the signal. | `VOLUNTARY_RETURN` (@7/@30) + `welcomeBack`, or `UNREQUIRED_REVISION` on improve; `PROMPTED_RETURN` recedes |
| **"a week later…"** (synthetic demo) | Honestly-labeled time-lapse: NEW sparkles gone, shelf quiets, no reminder sent, then: *"What do you drift back to?"* | nothing auto-fires; a genuine unprompted reopen → `VOLUNTARY_RETURN` |

**Guilt-free exit:** pause never loses the draft, no streak debt, a definitive *done for today* (precedents
§1.4 / right-to-disconnect).

---

## 6. Accessible DOM-mirror (`ActivityDOM`) — a composition, not a lesser menu

The 3D `<Canvas>` is `aria-hidden`; **`ActivityDOM` is the first-class operable peer** and must preserve *the
act of composing a picture* (Surveyor lesson: don't collapse the world to a flat to-do list). It is the same
verbs, same probes, same events, same `SceneCard` — parity by construction (`plainViewEquals`).

**Structure (keyboard + screen-reader, WCAG 2.2 AA):**
- **Prop Shelf** = an `aria` listbox grouped by kind (nature / characters / buildings / sky-weather / extras).
  Focus moves **one item at a time** (never a steered cursor — Accessible Games Initiative); each option
  announces **name + role + state** (e.g. *"Fox, character, in scene: no"*). Props carry name **and** glyph
  **and** texture, so nothing is color-only.
- **The scene** = a describable **layered outline** — an `aria` tree: `Backdrop ▸ Background ▸ Stage ▸
  Foreground`, each holding placed elements. Insert = choose a prop, choose a layer, choose a **nameable slot**
  from a **3×3 grid** (`left|center|right` × `near|mid|far`) — so *position is a word*, not a pixel drag.
- **make** = insert into a layer / apply a backdrop wash from a named palette / stamp a scatter set.
  **compose** = move an element's slot or layer, choose a framing. **express** = a mood listbox + title/caption
  fields + 3 story-beat fields. **refine** = reorder / re-tint / "tidy" (list normalize).
- **Live-region narration of the whole composition**, updated on every change — the artifact *as words*:
  > *"Dusk. Foreground: a fox, center-near. Stage: three pines, left-mid. Backdrop: a crescent moon,
  > right-far. Mood: calm. Title: 'The fox waits.'"*
  This generated description **is** the low-vision `thumbnailRef`/`altText`, so a blind child authors and
  perceives a real visual composition, not a form.
- Reduced-motion → instant framing; reduced-transparency → solid surfaces; visible `--focus`; every control has
  a non-penalizing help affordance (`ASSISTIVE`, `lowersSignal:false`).

Because both renderings emit identical `{domain:"visual", probeId, type}` events and produce identical
`SceneCard`s, the accessible path is a true equal — same signal, same delight, same artifact.

---

## 7. Assets + art (CC0 pipeline + bounded 3D room)

**Staged inside the single persistent `<Canvas>` whose contents swap on enter** (world-design §3). Fixed
camera; `frameloop="demand"` (re-render only on place/drag/mood/save); **target < 30 draw calls** (well under
the < 50 budget), `dpr ≤ 1.5`, `antialias:false` + SMAA.

**Room shell (the studio interior):** Kenney/KayKit interior kit — desk, stool, shelf, hanging lamp, a window
with the **one shared HDRI** beyond, and a wall of empty frames (the gallery). One shading model (flat PBR or
toon) tinted to the shared `PALETTE`.

**Prop inventory (the shelf), all CC0, all instanced:**
- **Nature** — Kenney *Nature Kit* + Quaternius *Ultimate Nature* (trees, rocks, bushes, mushrooms).
- **Characters/animals** — Quaternius *Animated Animals* / KayKit *Characters* (fox, deer, birds, little
  people), placed static (no per-frame skinning cost in the box).
- **Buildings/extras** — Kenney *Building/Furniture* bits.
- **Sky & weather** — drei `<Cloud>` / `<Stars>` / `<Sparkles>` + a moon/sun card. Cheap, alive.

Each prop is one Meshopt+KTX2 GLB on a shared gradient atlas → repeats via drei `<Instances>` → one draw call
per prop *type* regardless of count. Pipeline exactly per the asset memo (`gltf-transform optimize --compress
meshopt --texture-compress ktx2` → `gltfjsx --transform --types` → `useGLTF.preload`).

**The art pack does the beautifying (this is why anything looks good):** the shared
`SCENE3D`/`CAMERA3D`/`PALETTE` from lane 0 —
- one self-hosted HDRI via drei `<Environment>` + one key `directionalLight` (`SCENE3D.keyHex`) + low
  hemi/ambient fill;
- palette-matched **fog** (`SCENE3D.fogNear/fogFar`) ties every mixed-kit prop into one atmosphere;
- **frozen** shadows: `<ContactShadows frames={1}>` under the box + `<BakeShadows>` for the room;
- post: `EffectComposer` → `Bloom(mipmapBlur)` + `Vignette` + `ToneMapping(ACES)` (renderer `NoToneMapping`).

**The mood dial = the express beauty lever, and it is nearly free:** each mood (dawn/day/dusk/night/storm)
is just a small LUT — a palette tint + fog color + key-light intensity/rotation (+ `<Stars>`/`<Cloud>`
toggles). No new geometry; a whole-scene emotional reframe for pennies. **Framing** ("wide/cozy/hero") nudges
among 2–3 pre-authored camera poses **within** the `CAMERA3D` orbit clamps — never a free camera.

**Tiers (reuse `resolveRenderTier`/`resolveQualityTier`):** `room-3d` (full) → `room-3d-lite` (no shadows/bloom,
fewer motes) → **`ActivityDOM`** (the `board-2d`/plain accessibility floor). `PerformanceMonitor` +
`AdaptiveDpr` step down under load; a tier change never blocks a placement (a "pick" — here a *place* — must
always land).

---

## 8. Wiring — implementable against `ZonePlugin`

```ts
// passion/packages/interest-zone-art/src/index.ts  (owns only this dir;
// the single shared-root touch is registering artZone in the app's zone registry)
import type { ZonePlugin, RoomProps } from "@gt100k/interest-lab-view";
import type { ProbeFamily } from "@gt100k/interest-lab";

export const ART_PROBES: ProbeFamily[] = [
  { familyId: "art.make",     variants: [/* furnish.v1 (found), blankbox.v2 (stretch) */] },
  { familyId: "art.compose",  variants: [/* arrange.v1 (found), frame.v2 (stretch) */] },
  { familyId: "art.express",  variants: [/* mood.v1 (found), tell.v2 (stretch), gallery.v3 (group/audience) */] },
  { familyId: "art.refine",   variants: [/* polish.v1 (stretch) */] },
];

export const artZone: ZonePlugin = {
  id: "art",
  domain: "visual",                       // Domain = string; maps to a grid row + resolveDomainHue
  mapBuilding: {                          // 2D Curiosity-Map building (real DOM; nav + a11y + return signal)
    label: "Art Studio",
    sprite: "building-art-studio",        // easel/gallery sprite from the shared kit
    // position + hue derived from catalog order via resolveDomainHue("visual")
  },
  Room3D: ArtStudioRoom3D,                // mounts into the shared Canvas; the Storybox stage
  ActivityDOM: ArtStudioActivityDOM,      // §6 describable layered composer (operable peer)
  probes: ART_PROBES,
};
```

**`RoomProps` the zone consumes (provided by lane-0 core; the zone never imports the engine directly):**

```ts
interface RoomProps {
  learnerRef: string;
  ageBand: "6-8" | "9-11" | "12-14";      // drives staging (touch target, celebrationCeiling, labelStyle)
  reducedMotion: boolean; plainMode: boolean;
  deviceCaps: DeviceCaps;                  // → resolveRenderTier / resolveQualityTier
  savedScenes: SceneCard[];               // for the wall + "your scenes" shelf (return cue)
  presentation: {                          // the shared art pack, already resolved
    palette: PaletteView; scene3d: Scene3DView; camera3d: Camera3DView;
    quality: QualityTier; motionOf: (kind: string) => MotionToken;
  };
  emit: (signal: {                         // the ONLY way the zone talks to the grid
    domain: "visual"; probeId: string; familyId: string;
    type: EventType;                       // VOLUNTARY_RETURN | UNREQUIRED_REVISION | CHOSEN_CHALLENGE | …
    assistive?: boolean; interventionContext?: InterventionContext;
  }) => void;
  onSaveArtifact: (card: SceneCard) => void;
  onExit: () => void;                      // natural, guilt-free endpoint
}
```

Every in-activity action calls `emit(...)` with a `probeId` (which carries the `workMode`) and, when the
context warrants, a signal-family `type` — this is the literal implementation of "each activity action emits
`{domain, workMode}` events → the grid".

**QA hooks (`window.__qa`, so the upgraded gate can't be fooled — world-design §9):**

```ts
window.__qa = {
  zone: "art",
  primaryAction: "place-prop",                       // the gate HARD-FAILS if this is dead
  placeProp(propId, layer, slot): { ok: boolean; elementCount: number }, // live round-trip
  setMood(mood), saveScene(): SceneCard,
  getSceneGraph(): SceneCard,
  getEmittedSignals(): Array<{ domain; probeId; workMode; type }>,       // asserts probes actually fire
  domActivityOperable: true,                          // ActivityDOM is the AT surface; canvas aria-hidden
};
```

The gate then verifies **inside the canvas**: a raycast round-trip (click box → element count rises), a
pointer-sweep pixel-diff (placing/mood visibly changes pixels), and a VLM rubric ("is the primary action
obvious? does it read as a scene-builder, not a menu?").

---

## 9. Anti-patterns this design refuses (and how)

| Anti-pattern (v1 / precedents) | How the Art Studio avoids it |
|---|---|
| **Decorative 3D** (aria-hidden scenery over the "real" menu) | The box, props, shelf, dial are all live/raycastable; `__qa.primaryAction="place-prop"` is verified; the DOM peer is a real composer, not a fallback. |
| **Dead controls** | Every visible affordance functions (dial, depth ribbon, frame, tidy, keep). Nothing is a fake button; the gate's dead-primary-action check fails the build otherwise. |
| **Quiz behind a pretty door** | There is **no quiz**. Entering = making a picture. The probe *is* the composing. No multiple-choice, no "what color is…". |
| **Chocolate-covered broccoli** | The vegetable tastes good: beauty + expression is the intrinsic reward. No points/stars/score on creation or return (no `score/rank/price` fields anywhere). |
| **3D that subtracts legibility** (Quest Atlantis) | One clear verb per state; fixed legible camera; `room-3d-lite` and `ActivityDOM` are first-class equals; player-facing labels allowed. |
| **Mistaking novelty for interest** | First-drop burst is novelty-gated; only unprompted return + revision count; the "a week later…" device makes it honest. |
| **Gamifying the return signal** | Half-finished frame glows = a single gentle opt-in cue. No streak/countdown/FOMO; guilt-free pause; definitive exit. |
| **Accessible path as a lesser menu** | `ActivityDOM` composes a *describable picture* (nameable slots + live scene narration) with identical probes/events/artifact — parity, not a to-do list. |
| **Fixed label / score** | Never "you are an artist." The zone emits per-cell `{visual × workMode}` evidence; the guide sees a revisable hypothesis, never a verdict. |

---

## 10. Build order (for the zone loop)

1. `ART_PROBES` catalog + a unit test that it satisfies the coverage spread in §4.3 (solo+group,
   found+stretch, audience+no_audience within `visual`).
2. `ActivityDOM` first (accessibility floor + parity harness) — it defines the verbs and the `emit`/`SceneCard`
   contract with no GPU.
3. `Room3D` Storybox against the frozen art pack (place → auto-beautify → mood → frame → tidy → keep), reusing
   `SCENE3D`/`CAMERA3D`/`PALETTE`/`resolveMotion`.
4. Asset pass (optimize → `gltfjsx` → instance) to hit < 30 draw calls on a real low-end Chromebook under
   sustained load.
5. `window.__qa` surface + register `artZone` in the app registry; run the upgraded QA gate + operator review.
