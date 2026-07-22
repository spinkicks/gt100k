# Interest Lab — Zone: ART (domain `visual_design`) — design **v2 (LAAS-deep, two-layer)**

**Date:** 2026-07-21 · **Owner:** David · **Lane:** 3 (parallel zone loop) · **Domain:** `visual_design` · **Zone id:** `art`
**Supersedes / deepens:** [`2026-07-21-zone-art-design.md`](./2026-07-21-zone-art-design.md) (v1 — the "Storybox" single-surface design).
**Read first:**
[world design](./2026-07-21-interest-lab-world-design.md) ·
[core / lane-0 build spec](./2026-07-21-interest-lab-core-spec.md) ·
[world precedents](../../research/interest-lab-world-precedents.md) ·
[asset + art-direction pipeline](../../research/stylizedWorldAssetPipeline.md) ·
[passion brainlift](../../research/passionBrainlift.md).
**Depth model:** **LAAS** (`github.com/Braffolk/fable5-world-demo`, `PROJECT_LAAS_v2.md`) — a concrete visual bar with
reference frames, hard floors, a mandatory reference-delta loop, a self-score rubric, and an explicit **banned-outcomes**
list. We take LAAS's *rigor and obsessiveness* wholesale and retarget its *aesthetic* (cozy-stylized, not photoreal UE5)
and its *floors* (Chromebook WebGL2, not RTX-3060 WebGPU).
**Frozen interfaces it targets (do not edit — lane 0):** `ZonePlugin`, `RoomProps`, `ActivityEvent`/`ActivityKind` from
`@gt100k/interest-zone-kit` + `@gt100k/interest-lab`; the shared art pack in `interest-lab-view` (`PALETTE`,
`TYPOGRAPHY`, `HUE_RAMP`, `SCENE3D`, `CAMERA3D`, `QUALITY_TIERS`, `resolveRenderTier`, `resolveQualityTier`,
`WORK_MODE_GLYPHS`, `resolveMotion`, `resolveDomainHue`).

---

## 0. What changed from v1 (the pivot in one paragraph)

v1 collapsed *exploration* and *deep learning* into one surface: the Storybox diorama **was** the whole zone. v2 **splits
the zone into two layers joined by a diegetic seam**:

1. **The Discovery World (world layer).** A 2D map building + a **beautiful bounded 3D artist's atelier** you step into.
   Its job is **exploration, atmosphere, and the interest signal** — *not* deep instruction. It is the warmest, most
   lovingly dressed room in the entire world (the bar is highest in the ART zone). Inside it, a light, tactile toy — the
   **Storybox** (kept from v1, re-scoped) — gives an immediate "I made something pretty" tickle, and a **grand easel that
   is a glowing doorway** invites the child *deeper*.
2. **The Content App (domain layer).** **"The Atelier"** — a **Brilliant-style, hands-on, interactive visual-art course**
   reached *through the easel*. It teaches **real concepts — composition, color, light, story — by doing**, with an
   immediate beautiful result every time, and **is not a quiz**. Reference model: [Brilliant.org](https://brilliant.org)
   interactive lessons + the sibling audio app [Blazing Audio](https://blazing-audio-alpha.web.app/) ("Learn how audio
   really works, one hands-on lesson at a time"). Ours: **"Learn how pictures really work, one hands-on lesson at a
   time."**

The signal `{domain:"visual_design", workMode}` is now emitted across **both** layers into the same `emit` sink, so the
`domain × work-mode` grid and the revisable hypothesis are unchanged downstream. The two signal-bearing choices the
research demands — **which building you enter** and **what you voluntarily return to** — live in the world layer (enter)
and the content app (which *lessons* pull you back over days).

> **Naming reconciliation (binding).** v1 wrote `domain: "visual"`. The **frozen lane-0 core** (core-spec §2, goldens,
> `V1_DOMAIN_ORDER`) uses **`visual_design`**, and `createZoneRegistry` throws if `plugin.domain` (or any
> `probes[].domain`) is absent from `domainOrder`. **v2 uses `visual_design` everywhere.** `resolveDomainHue(order,
> "visual_design")` → `HUE_RAMP[2]` = **`#6C8CE8`** (periwinkle) = the zone's *identity* hue (map building glow, marker
> emissive, the portal's edge light). The room *interior* is warm gold; the cool identity-hue reads as an inviting
> lit-window-at-dusk contrast, not a cold room. See §4.4.

---

## 1. Architecture at a glance (two layers, one seam, one signal)

```
  DISCOVERY WORLD (world layer)                          CONTENT APP (domain layer)
  ─────────────────────────────                         ──────────────────────────
  Curiosity Map (2D DOM, primary)                        "The Atelier"  (Brilliant-style)
     │  select "Art Studio" building  ── enter ─┐        Blazing Art — "how pictures really work"
     ▼                                          │           ┌──────────────────────────────────┐
  3D ATELIER ROOM (bounded, gorgeous)           │           │  4 strands, ~14 interactive       │
   • cozy atmosphere + exploration              │           │  lessons (compose·color·light·    │
   • Storybox toy  (light "make" tickle)        │           │  story) + a fix-it strand + a     │
   • gallery wall of saved artifacts            │           │  self-scoped Commission capstone  │
   • THE EASEL = a glowing DOORWAY ──────────── SEAM ─────► │  each: HOOK→GUIDE→YOUR TURN→REVEAL │
                                                │  (§10)    │  immediate beautiful result       │
     ▲  return to studio, new frame appears ◄───┘           │  saves an artifact → world gallery │
     │                                                      └──────────────────────────────────┘
     │                                                                   │
     └────────── emit({domain:"visual_design", workMode, probeId, kind, dayOffset}) ──────────┘
                                    ▼
                 ReturnGrid (domain × work-mode) → RevisableHypothesis
                 (row = "visual_design" topic spike · column = build/compose/explain/debug work-mode spike)
```

**Layer responsibilities (hard boundary).**

| | World layer (3D atelier) | Content app (The Atelier) |
|---|---|---|
| **Purpose** | explore · atmosphere · *tickle* interest · capture the enter/return/linger signal | **teach real skill by doing** · capture the deep engagement + voluntary-return-to-a-lesson signal |
| **Depth** | shallow-but-beautiful (one toy, one doorway) | deep (a real course) |
| **Surface** | the persistent `<Canvas>` (3D) + a DOM peer | mostly 2D DOM/SVG/2D-canvas explorables + a DOM peer |
| **Primary verb** | *step up to the easel* (open the app) | *do the concept* (compose / mix / light / tell / fix) |
| **NOT** | a lesson container; a quiz door | a 3D world; a multiple-choice quiz |

---

## 2. The LAAS bar, retargeted (the method that governs BOTH layers)

LAAS's thesis: *"build to the reference, know precisely how far you got, and never build to a lower bar because the lower
bar is comfortable."* We keep the machinery and change only the target.

- **LAAS target:** UE5 photoreal, 5M tris/frame, RTX-3060. **Our target:** *cozy stylized storybook*, executed
  impeccably, ≤30 draw calls, on a school Chromebook iGPU.
- **What transfers verbatim:** the **reference-delta loop** (defined here; run every phase per §15), **hard floors**
  (§4.6 room, §9 app), the **"Nothing is bare"** law (§4.2), **"The world moves"** law (§4.5), the **banned-outcomes /
  instant-fail** list (§4.7 room, §9 app), the **self-score rubric** (§4.10 room, §9 app), and the operating stance:
  *build the more ambitious of two options; under-dressing is a failure mode just like LAAS's under-rendering.*
- **The reference-delta loop (mandatory, every phase, both layers).** Render the closest matching shot → place it
  side-by-side with the reference frame → write `DELTA.md`: the **ten most visually significant differences, ranked by
  impact** → **fix the top three** → re-render. A phase closes only after this loop runs. For the content app, the
  "render" is a screenshot of the live explorable; the reference is the app reference frame (§9.1).
- **Phase-0 first action (both layers).** Collect/author the reference frames (§4.1 for the room, §9.1 for the app —
  moodboard stills from the named references, optionally one Blockade/AI concept frame per the asset pipeline §2.1, kept
  in `docs/reference/art-zone/`) and wire a side-by-side delta tool into the QA harness. *You cannot run the loop without
  the reference wired in.*

> **The single most important adaptation:** in LAAS "nothing is bare" means *geometry covers the ground*; here it means
> **every surface class in the atelier has occupants and every explorable produces a genuinely lovely result** — a bare
> desk or a kid's output that looks like a wireframe is our equivalent of LAAS's flat-textured terrain: a *failed task*,
> no matter how clean the code.

---

# PART A — THE DISCOVERY WORLD (world layer)

## 3. The 2D map building (on the Curiosity Map)

Real DOM, primary surface, keyboard + screen-reader (never `aria-hidden`). Supplied declaratively via `MapBuildingView`:

```ts
mapBuilding: {
  label: "Art Studio",
  glyph: "glyph-easel",                 // decorative; from the shared kit
  enterVerb: "Step inside",             // the ONE World-1-1 verb
  cell: { col: 2, row: 0 },             // right of Music(0,0) + Code(1,0); matches MAP_GOLDEN ordering
  art: { sprite: "building-art-studio" }// hue derived: resolveDomainHue → #6C8CE8 unless overridden
}
```

- **Sprite bar:** a warm little atelier with a tall glowing periwinkle window, a wisp of a light-shaft, a hanging sign
  with an easel glyph — legibly "a place where pictures are made," not a generic house. Palette-tinted to `#6C8CE8`
  identity edge + warm interior glow bleeding out the window (the invitation is visible from the map).
- **Return cues (from lane-0 `CuriosityMapBuilding`):** `returnState ∈ {new, explored, voluntary-return,
  prompted-return}`; `unfinished` count drives a single, gentle *"your half-built thing is still here"* glow on the
  building. **No streak/badge/number-nag** ever (precedents §1.4; brainlift Insight 5).
- **`ariaLabel`:** `"Art Studio, discovery zone, <unfinished> unfinished, <returnState phrase>"` — parity with the
  sighted cue.

---

## 4. The 3D Atelier room — the VISUAL BAR (obsess over scene contents)

This is the highest-bar surface in GT100K. It must read, at a one-second glance, as a **real artist's atelier at golden
hour that a child wants to live in** — *A Short Hike*'s warmth, *Alba*'s clean sunlight, a *Ghibli* studio's lived-in
clutter, *Coraline*'s tactile shadow-box, all on a Chromebook.

### 4.1 Reference frames (name them; build against these, not "pretty for a browser")

The bar is three composed frames (author them in phase 0; store in `docs/reference/art-zone/`). Aesthetic anchors:
**A Short Hike** (cozy low-poly warmth), **Alba: a Wildlife Adventure** (clean Mediterranean sun), **Studio Ghibli
interiors** (*Kiki*'s attic studio, *Whisper of the Heart*'s desk — warm shaft light, dust motes, lived-in clutter),
**Monument Valley** (flat-color graphic calm + restraint), **Coraline / Laika** (shadow-box tactility for the Storybox),
**Animal Crossing** interiors (tidy collectible warmth). Color-script law (LAAS Pillar E), retargeted to a **warm/cool
split** (the cozy analog of LAAS's teal-orange): **warm lit surfaces (`#FFC08A`/`#FF9E5E` key) against cool periwinkle
shadow (`#6C8CE8`-tinted fill)**; controlled value structure (dark cozy foreground frame → lit mid subject → luminous
window background); restrained saturation.

- **Frame 1 — "Establishing Warmth" (the `wide` framing).** The whole atelier late afternoon. A tall window pours a
  **golden light-shaft with drifting dust motes** across a wood floor and a warm-plaster wall. Left: the drafting desk
  with the Storybox glowing. Center-back: the **gallery wall** of framed pictures, one **half-finished frame glowing**.
  Right: the **grand easel-portal** shimmering with soft light. A rug, a stool, a potted plant, string-lights overhead.
  A cat asleep on the sill. Everything tied together by warm fog and a soft bloom on every emissive.
- **Frame 2 — "The Drafting Desk" (the `cozy` framing).** Close on the desk: the **Storybox** mid-scene (a tiny lit
  forest, a fox on the near lip), a jar of brushes, three paint tubes, an open sketchbook with a pencil, a chipped mug,
  a warm desk lamp casting a pool of light, a couple of crumpled sketch-balls. The cat's tail curls into frame.
- **Frame 3 — "The Easel Portal" (the `hero` framing).** The easel dead-center, its canvas a **soft luminous portal**
  breathing with the current lesson's colors, a stool before it, the ONE verb floating in the display font (*"Step up to
  the easel"*), string-light bokeh, gentle bloom, periwinkle rim-light on the frame.

### 4.2 Scene contents — enumerated by surface class ("Nothing is bare", LAAS Pillar C)

Every surface class below **must have occupants**; the counts are floors (§4.6). All repeats are **instanced** (one draw
call per prop *type*) with **per-instance hue/scale/rotation jitter** (no cloned uniformity — LAAS §4).

| Surface class | Required occupants (floor) | Notes |
|---|---|---|
| **Floor** | wood plank base + **1 rug** + **1 stool** + **1 slouchy bag/satchel** + **≥2 floor plants** + a few paper scraps | rug anchors the palette; scraps say "someone works here" |
| **Drafting desk (hero)** | the **Storybox** + **1 brush jar (≥5 instanced brushes)** + **≥3 paint tubes** + **1 palette** + **1 open sketchbook + pencil** + **1 mug** + **1 desk lamp (warm emissive)** + **≥2 crumpled sketch-balls** | the most detailed 30cm of the scene; Frame 2 is judged here |
| **Supply shelf** | **≥5 labeled cubbies**, each holding the Storybox prop kinds (nature / characters / buildings / sky-weather / extras); top 3 items **pulse** (grab-me) | doubles as the Storybox inventory |
| **Gallery wall** | **≥6 empty frames** + the child's **saved Scene Cards & lesson artifacts** hung as framed pictures; **≥1 half-finished frame glows** | the return cue + the payoff of the content app lives here |
| **Window + sill** | tall window, the **one shared HDRI beyond**, **the golden light-shaft**, **≥2 sill plants**, **1 sleeping cat**, breathing curtains | the light source and the soul of the room |
| **Ceiling** | **string-lights (≥8 instanced bulbs, emissive)** + **1 hanging mobile** (slow spin) | cheap warmth + a motion source |
| **Walls** | warm plaster + **1 bulletin board (pinned swatches/sketches)** + a small clock or shelf-ledge with **≥3 trinkets** | breaks the flat plane; more "lived-in" |
| **The easel (the doorway)** | the grand easel + luminous portal canvas + stool + the floating verb | §10; must be the obvious primary affordance |

**Total floor:** **≥45 visible dressing objects** across **~18–24 unique prop types** (so ≤30 draw calls holds via
instancing). A single prop on an empty floor is an **instant fail** (§4.7).

### 4.3 Layout, camera, framings

- Fixed camera per `CAMERA3D` (fov 42, near .1/far 100, `enablePan:false`, `enableZoom:false`, polar 60–85°, azimuth
  clamp 75°, damping .08). The child looks *into* the room and may nudge within the clamp; never a free camera.
- **Three pre-authored poses** matching the reference frames: `wide` (establishing), `cozy` (desk / Storybox), `hero`
  (easel-portal). Entering the building eases from `establishStart` → `wide` (`resolveMotion("driftIn")`;
  reduced-motion → `cut`). Interacting with the Storybox eases to `cozy`; approaching the easel eases to `hero`.
  Transitions use `resolveMotion("islandFocus")`.
- Depth is staged foreground→mid→background (dark cozy frame → lit subject → luminous window) so every pose obeys the
  value structure of §4.1.

### 4.4 Materials, palette, lighting (why it looks good — the shared pack does the beautifying)

- **One shading model** across all props: **flat PBR (`MeshStandardMaterial`, low metalness, baked AO)** or **toon
  (`MeshToonMaterial` + banded `gradientMap`, `NearestFilter`)** — pick one in phase 1 and hold it (LAAS §4 "one shading
  model unifies + controls cost"). All props tinted onto the shared `PALETTE` + `visual_design` accent (LAAS Pillar E /
  pipeline §4.1: palette discipline is the cheapest cohesion win).
- **Lighting (pipeline §4.2, exactly):** **one self-hosted HDRI** via drei `<Environment>` (never a CDN preset) + **one
  key `directionalLight`** (`SCENE3D.keyHex` `#FFC08A`, `keyIntensity` 1.15, from the window) + **low hemi/ambient fill**
  tinted cool (`SCENE3D.hemiSkyHex`) so shadows read periwinkle, not black. **No-black-shadows law (LAAS Pillar B):**
  sample any shadowed pixel — if it is desaturated gray, lighting has failed.
- **The golden light-shaft** is the hero: a soft god-ray volume (or a cheap emissive-quad + fog gradient) from the
  window, carrying the dust motes. This one detail sells "atelier at golden hour."
- **Atmosphere:** palette-matched **fog** (`SCENE3D.fogNear` 14 / `fogFar` 46, warm-tinted for this zone via the mood
  LUT) ties every mixed-kit prop into one atmosphere (pipeline §4.6 — "the cheapest cohesion tool there is").
- **Shadows, frozen (pipeline §4.3):** `<ContactShadows frames={1}>` under every grounded object + `<BakeShadows>` for
  the room. **One shadow-caster max.** Never per-frame shadow updates.
- **Post (pipeline §4.5):** `EffectComposer` → `Bloom(mipmapBlur)` (on lamp, string-lights, glowing props, half-finished
  frame, portal) + `Vignette` + `ToneMapping(ACES)`; renderer `NoToneMapping`. SMAA (not MSAA).
- **Warm-default reconciliation.** The implemented `SCENE3D` defaults to a **night** background (`#181026`). The ART
  zone runs the **mood LUT at a warm default** ("late-afternoon / golden hour"): background/fog → warm plaster, key →
  `#FFC08A` full, motes on. The mood dial can still travel dawn→day→dusk→night→storm (a per-scene emotional reframe for
  pennies — a LUT of palette tint + fog color + key intensity/rotation + `<Stars>`/`<Cloud>` toggles; no new geometry),
  but the room's **resting state is warm** (brief: "cozy, warm, inviting… not the moody references").

### 4.5 The world moves (LAAS Pillar F, retargeted) — the motion inventory

A frozen frame must feel *one second from motion*. **≥6 always-on gentle motions** (all honor `reducedMotion` →
instant/off):

1. **Dust motes** drifting in the light-shaft (`quality.motes`: 60 full / 24 lite / 0 board).
2. **Curtains breathing** at the window (slow vertex sway).
3. **≥1 plant leaf sway** (instanced foliage sway in a cheap vertex shader).
4. **String-lights twinkle** (subtle emissive flicker; `resolveMotion("glowLoop")`).
5. **The Storybox starter prop bobs** (drei `<Float>`).
6. **The cat breathes** (slow scale) and flicks its tail occasionally.
7. **The easel-portal shimmers** (color breathing; `resolveMotion("glowLoop")`).
8. **The hanging mobile** turns slowly.

Interaction motion reuses tokens: place = `markerPop` (pop easing, soft bounce), pick = `pick` (spring), voluntary
return = `welcomeBack`, prompted return = `promptedRecede`.

### 4.6 Hard floors (Chromebook; the numbers that define the bar)

| Dimension | Floor |
|---|---|
| Draw calls / frame | **≤ 30** (hard ceiling ≤ 40) — *under-dressing to hit this is a failure; instance instead* |
| Visible dressing objects | **≥ 45** (§4.2), via `<Instances>` so each prop *type* = 1 call |
| Unique prop types | ~18–24 (shared gradient atlas) |
| Surface classes occupied | **all 8** (§4.2) — each meets its per-class floor |
| Always-on motions | **≥ 6** (§4.5) |
| Lights | exactly **1 HDRI env + 1 key dir (shadow) + 1 hemi fill**; warm accents are **emissive materials**, not real lights |
| Shadows | contact shadows under **every** grounded object; room baked/frozen; per-frame updates **banned** |
| Post passes | Bloom + Vignette + ACES (2–3) |
| Triangles visible | ≤ ~150k (well under the 300–500k iGPU ceiling) |
| Textures | props ≤ 512² shared atlas, hero ≤ 1024², **KTX2** |
| dpr | ≤ 1.5; `antialias:false` + SMAA; `frameloop="demand"` (re-render only on interaction) |

### 4.7 Banned outcomes — instant fail (LAAS §9, retargeted)

- **Flat/unlit look** (`MeshBasicMaterial` in the room; no env map; no key light); **black or muddy-gray shadows**.
- **Bare surfaces:** a single prop on an empty floor; an empty desk, empty shelves, or blank walls (violates
  Nothing-is-bare §4.2).
- **Cloned props** (shared mesh varied only by rotation/scale, no hue/value jitter); grid-perfect placement.
- **No atmosphere:** missing fog / missing light-shaft / missing motes / missing bloom on emissives.
- **A motionless scene** (< 6 always-on motions).
- **Cold/moody palette** that fights the cozy brief; saturation blown out; palette not disciplined to `PALETTE` + accent.
- **Decorative 3D over a real menu:** the canvas is the primary surface with no operable DOM peer; **dead controls** (the
  easel doesn't open the app; the Storybox doesn't actually compose; the mood dial does nothing).
- **Over budget:** > 30 draw calls, dpr > 1.5, unfrozen/per-frame shadows, non-`demand` frameloop.
- **The accessible path is a lesser menu** (§12).
- **Asking to lower the bar** instead of finding the nearest feasible cozy alternative (log it in `DEVIATIONS.md`).

### 4.8 The Storybox — the world-layer "make" tickle (kept from v1, re-scoped)

The Storybox is **no longer the deep container**; it is the **cozy on-desk toy** that gives an immediate "*I* made
something pretty" hit and captures a light `build` signal, then *points at the easel* for depth. A shadow-box diorama
with three depth slots (`backdrop`/`stage`/`foreground`); pull a **glowing prop** off the supply shelf, drop it in, and
the shared art pack **auto-beautifies it on contact** (HDRI key + palette tint + fog + contact shadow + bloom) so a
9-year-old's first drop already looks like a storybook illustration (intrinsic integration; the "wow, *I* made that" is
structural, not skill-based). Teaching is by affordance only (World 1-1): one bobbing starter prop, a soft light-ramp
shelf→box, the top-3 shelf items pulse.

- **Scope line (important):** the Storybox stays **shallow** — place / wash a sky / scatter, and a lightweight mood
  dial. **Depth (why thirds work, how value carries a picture, how light makes form) lives in the content app**, not
  here. When a Storybox scene "reads full" (≥5 elements across ≥2 layers), a gentle affordance suggests *"take this to
  the easel to finish it"* — routing the child from tickle → depth.
- **Artifact:** a `SceneCard` (§8) that hangs on the gallery wall and can be **re-opened & finished in the content app's
  Commission** (§7.6). Re-opening unprompted after novelty = `VOLUNTARY_RETURN`; improving it = `revise`.

### 4.9 CC0 asset pipeline + Chromebook budget

Per pipeline §6–7, all **CC0** (Kenney + Quaternius + KayKit; Poly Haven HDRI; **avoid Synty** — its EULA bans UGC /
generative use, and this product may add child-authoring). Room shell + furniture from **Kenney Interior/Furniture**;
plants/cat/foliage from **Quaternius**; Storybox prop kits (nature/characters/buildings) from Kenney *Nature* +
Quaternius *Animated Animals* (placed static, no per-frame skinning) + KayKit; sky/weather from drei `<Cloud>`/`<Stars>`/
`<Sparkles>` + a sun/moon card. Pipeline: `gltf-transform optimize --compress meshopt --texture-compress ktx2` →
`gltfjsx --transform --types` → `useGLTF.preload` → drei `<Instances>`. Tiers reuse `resolveRenderTier`/
`resolveQualityTier`: `room-3d` (full) → `room-3d-lite` (no shadows/bloom, 24 motes) → **`ActivityDOM`** (board-2d, the
a11y floor). `PerformanceMonitor` + `AdaptiveDpr` step down under sustained load; a tier change **never blocks a place**.
Ship an `assets/LICENSES.json` manifest.

### 4.10 Self-score rubric (LAAS §10; score after every phase, anchored to §4.1 frames)

Per row: **10** = passes a one-second glance vs the reference at 1080p · **7** = clearly synthetic but the *same class of
image* · **4** = good hobby demo · **2** = 2010 asset-dump. Rows: **coziness/warmth · lighting (shaft + no-black-shadows)
· prop density (Nothing-is-bare) · palette cohesion · aliveness (motion) · composition/framing · material quality ·
legibility of the primary action (the easel reads as the doorway) · Storybox tactility · performance.** For each row
write "what raises this +2"; implement the two cheapest before proceeding.

---

# PART B — THE CONTENT APP ("The Atelier" / *Blazing Art*)

## 5. Product framing

**"The Atelier — learn how pictures really work, one hands-on lesson at a time."** A deep, hands-on, interactive
visual-art course reached *through the easel* in the world zone. Modeled on **Brilliant.org** (short interactive lessons
where *manipulating the thing is the explanation* — Bret Victor / Nicky Case "explorable explanations," precedents §1.3)
and the sibling **Blazing Audio**. It teaches the **four pillars a picture is actually made of — composition, color,
light, story** — by doing, and adds a **fix-it (debug) strand**. **It is emphatically not a quiz:** no multiple choice,
no "what color is complementary to blue?" You *move the subject and watch the eye follow it*; you *slide value to
grayscale and see the picture still read*; you *drag the sun and watch form appear*.

**Why this is the deep container (brainlift alignment):**
- **Manufacture & prune (SPOV 1):** the app offers *many* concept-lessons; the child pins no identity; **return prunes**.
- **Trust return, not words (SPOV 2):** the signal is *which lessons a child drifts back to over days*, not a survey.
- **Engineer deep absorption, never pressure (SPOV 3):** flow conditions (immediate lovely results, one clear next step,
  no interruption, no timer). We instrument **behavioral depth only** — unrequired revision, voluntary lesson-chaining,
  voluntary return @7/@30 — **never emotion, never a wall-clock, never a score**.
- **Grade the process, not the polish (SPOV 7):** every artifact keeps an **append-only `revisions[]`** (Evidence-Graph
  friendly); the dead ends and iterations are first-class.
- **Declared AI help is status-neutral (SPOV 8):** an optional "*ask the studio*" hint/suggest helper is a **declared,
  non-penalizing** node (`ASSISTIVE`, `lowersSignal:false`); *no bonus for refusing it*.
- **Don't gamify the signal (Insight 5; precedents §1.4):** no points/stars/XP/streaks/FOMO on lessons or on return; the
  come-back cue is a single gentle "your canvas is still here."

## 6. The lesson shape (the Brilliant-style explorable) + the immediate-beautiful-result engine

Every lesson is a short **explorable** with the same four beats (never a wall of text, never a modal tutorial):

1. **HOOK (a wrong→right toggle).** One tap flips a deliberately *bad* version to a *good* one (off-center subject; muddy
   palette; flat unlit ball). The child *sees* the principle matter in half a second. (This is also the `art.debug`
   seed.)
2. **GUIDE (one guided manipulation).** A single focal control the child moves; the picture responds live; a light
   overlay names what's happening (a "gaze ribbon," a value bar, a light gizmo). One concept, one control.
3. **YOUR TURN (open sandbox).** The overlay fades; the child makes their own version freely. Constrained so it *cannot
   look bad* (see engine below).
4. **REVEAL + KEEP.** A gentle beauty payoff; **save the artifact** (it hangs on the world gallery wall). A *"try the
   harder version"* affordance offers the stretch variant (→ `CHOSEN_CHALLENGE`).

**The immediate-beautiful-result engine (the 2D analog of the Storybox auto-beautify — why a kid's output looks
designed):**
- **Constrained, curated palettes** (the shared `PALETTE` + `HUE_RAMP`) and **auto-harmony snapping** — colors snap to a
  harmonious scheme, so no muddy combos.
- **Curated vector/shape assets** (clean flat shapes, a small set) — you assemble, you don't draw-from-blank (removes the
  "I can't draw" wall while still teaching the *concept*).
- **The mood LUT** (dawn/day/dusk/night/storm) re-lights any 2D scene for free — instant emotional polish.
- **Soft shadow + bloom + vignette** on the 2D canvas (SVG/CSS filters or a lightweight 2D canvas), **display
  typography** (`TYPOGRAPHY.fontDisplay`) for captions, and **spring micro-animations** (reuse `resolveMotion`:
  `markerPop`, `pick`, `stateMorph`, `welcomeBack`).
- **You-can't-make-it-ugly constraints:** snapping to thirds/harmony/value-steps; a small tasteful asset set; the art
  pack does the lighting. The *concept* is what varies; *ugliness* is engineered out (skill-free wow, exactly like the
  Storybox).

## 7. The curriculum — 4 strands + a fix-it strand + a capstone (the concrete lessons)

Each lesson: **concept → the manipulable (what you literally do) → the immediate beautiful result → the artifact → probe
`workMode`/difficulty.** All content is authored CC0, `safetyClass:"cleared"`.

### 7.1 COMPOSE strand (workMode `compose`) — "where things go"

| Lesson | The manipulable (you DO this) | Immediate beautiful result | Probe · difficulty |
|---|---|---|---|
| **Focal point & thirds** | Drag the subject; a live **gaze heatmap / eye-path ribbon** shows where the eye lands; thirds intersections **snap** and the frame audibly/visibly "clicks." | The picture suddenly feels composed, not random. | `art.compose.focal.v1` · foundational |
| **Visual weight & balance** | Place elements on a **see-saw** metaphor; big/dark/saturated read as heavy; watch it tip or settle. | A balanced, "designed" arrangement. | `art.compose.balance.v2` · stretch |
| **Leading lines & framing** | Rotate a road/fence/river; a **gaze ribbon** bends to the subject; pick a framing (wide/cozy/hero). | The eye is led straight to the hero. | `art.compose.lead.v2` · stretch (`CHOSEN_CHALLENGE`) |

### 7.2 COLOR strand (workMode `build`) — "mixing & choosing color"

| Lesson | The manipulable | Immediate beautiful result | Probe · difficulty |
|---|---|---|---|
| **Value is the workhorse** | Slide **hue / value / saturation**; a one-tap **"desaturate to gray"** proves the picture still reads by *value* alone. | A scene that holds up in grayscale = it will hold up in color. | `art.build.value.v1` · foundational |
| **Color harmony** | Spin a **color wheel**, pick a scheme (complementary / analogous / triad); the whole scene **recolors** to that harmony. | Instant "this looks intentional." | `art.build.harmony.v2` · stretch |
| **Wash the sky** | Sweep a palette across the backdrop (shared with the Storybox). | The mood of the whole picture shifts in one gesture. | `art.build.wash.v1` · foundational |

### 7.3 LIGHT strand (workModes `build` + `compose`) — "how light makes form & mood"

| Lesson | The manipulable | Immediate beautiful result | Probe · difficulty |
|---|---|---|---|
| **Make the ball round** | Add **core shadow → highlight → reflected light → cast shadow** to a flat circle, one at a time. | A flat disc becomes a convincing 3D sphere — the classic "aha." | `art.build.form.v1` · foundational |
| **Move the sun** | Drag the light around the scene; shadows swing (front/side/back/rim). | Drama appears and disappears under your finger. | `art.build.direction.v2` · stretch (`CHOSEN_CHALLENGE`) |
| **Time of day / mood** | Turn the **mood dial** (dawn/day/dusk/night/storm) — the mood LUT re-lights the scene. | One dial = a whole emotional reframe. | `art.explain.mood.v1` · foundational (see §7.4) |

### 7.4 STORY strand (workMode `explain`) — "a picture that tells"

| Lesson | The manipulable | Immediate beautiful result | Probe · difficulty |
|---|---|---|---|
| **Mood (commit a feeling)** | Commit a time-of-day/mood to a scene and say *why*. | The scene gains an emotional key. | `art.explain.mood.v1` · foundational |
| **Before / now / after** | Arrange **three frames**; the story reads left→right. | An instant tiny comic strip. | `art.explain.sequence.v1` · foundational |
| **Title & three story beats** | Type a title + 3 beats; words + image bind. | The picture becomes a little story you authored. | `art.explain.tell.v2` · stretch (`SELF_AUTHORED_SCOPE`) |
| **Show it to the gallery** | Share a finished piece to the **gallery wall** for an audience. | Your work, framed, for others. | `art.explain.gallery.v3` · stretch · **group · audience** |

### 7.5 FIX-IT strand (workMode `debug`) — "this picture feels off — fix it"

The intrinsic `debug` verb (shares the cross-zone column with Music-*fix* and Code-*debug*). A deliberately
mis-composed / mis-colored / mis-lit scene arrives broken; the child **diagnoses and repairs** it (move the subject off
dead-center; fix the muddy palette; add a cast shadow to ground the floating object), with an immediate **before/after**.

| Lesson | The manipulable | Immediate beautiful result | Probe · difficulty |
|---|---|---|---|
| **Fix this picture** | Spot & repair one of {composition, color, light} faults; before/after toggle. | The picture visibly "snaps into place." | `art.debug.fixpicture.v1` · foundational |
| **Polish your own** | Re-open one of *your* saved artifacts and improve it *after "done."* | Your old piece, now better. | `art.debug.polish.v2` · stretch (`UNREQUIRED_REVISION`) |

### 7.6 CAPSTONE — the Commission (workMode `build`, high autonomy)

A **self-scoped mini-project** that uses several concepts at once: the child accepts (or writes) a tiny brief ("a cozy
place at dusk," "someone waiting"), then composes + colors + lights + tells a **single finished illustrated Scene Card**.
This is where a Storybox scene can be *taken to the easel and finished*.

| Lesson | The manipulable | Result | Probe · difficulty |
|---|---|---|---|
| **The Commission** | Pick/author a brief; assemble a finished piece across ≥3 concepts; caption it. | One genuinely lovely, framed, saved illustration. | `art.build.commission.v3` · stretch · **high autonomy** (`SELF_AUTHORED_SCOPE` + `CHOSEN_CHALLENGE`) |

**Coverage contribution (all within the `visual_design` row; the 16 probes of §11.2):** build×7 · compose×3 · explain×4
· debug×2 → work-modes {build, compose, explain, debug}; foundational×8 + stretch×8; solo×15 + **group×1**; no_audience×15
+ **audience×1**; autonomy medium/high mixed. This richly populates the `visual_design` row and lights the shared
**build** and **debug** columns (the cross-zone work-mode signal), so the row-vs-column disambiguation works from this
zone alone.

> **Frozen-core note.** The lane-0 **stub** art catalog is `{a_build, a_compose, a_explain}` (3 work-modes) and drives
> the lane-0 goldens — those are untouched (stub-owned). The **real** zone here adds a 4th work-mode (`debug`); this only
> changes the *integrated* registry coverage (still `minWorkModes ≥ 6` ✓, `complete` recomputes ✓), never a lane-0 unit
> golden. Adding `debug` is deliberate: it makes *refine/fix/debug* a column shared by all three zones.

## 8. Artifacts (the deepened `SceneCard` + per-lesson artifacts)

Every lesson produces a durable, structured, describable artifact (not a screenshot trophy). The capstone/Storybox
artifact is the `SceneCard`, extended from v1 with the concepts practiced and an append-only process record:

```ts
interface SceneCard {
  id: string; learnerRef: string;
  origin: "storybox" | "atelier-lesson" | "commission";  // which surface made it (provenance)
  title: string; caption?: string;
  storyBeats?: [string, string, string];                 // before / now / after
  mood: "dawn" | "day" | "dusk" | "night" | "storm";
  paletteKey: string; harmonyKey?: string;               // which shared-palette + harmony scheme
  framing: "wide" | "cozy" | "hero";
  elements: Array<{ propId: string; layer: "backdrop"|"stage"|"foreground";
                    slot: SlotName;                       // nameable 3x3 slot (describable, not px)
                    scale: number; tintKey: string; valueStep?: number }>;
  conceptsPracticed: Array<"focal"|"balance"|"lead"|"value"|"harmony"|"form"|"direction"|"mood"|"sequence"|"tell"|"fix">;
  thumbnailRef: string;                                   // rendered PNG OR the generated description (DOM/low-vision)
  altText: string;                                        // ALWAYS generated — the composition as words (§12)
  createdAtDayOffset: number;
  revisions: SceneRevision[];                             // append-only; each edit is a node (Evidence-Graph)
  aiAssists?: Array<{ atRevision: number; kind: string }>;// declared, status-neutral (SPOV 8)
  artifactEvidenceMet: string[];                          // which probe artifactEvidence bars this satisfies
}
```

Per-lesson (non-capstone) artifacts are lighter (`{ probeId, conceptsPracticed, thumbnailRef, altText, revisions }`) but
follow the same rules: **always an `altText`, always append-only `revisions`.** Three destinations, one record: (1)
framed on the **world gallery wall**; (2) re-openable in a **"your pieces"** shelf; (3) into the **signal + evidence**
layer (`ARTIFACT_COMPETENCE`; `revisions[]` is the process record the Evidence Graph grades — *grade the dead ends, not
the polish*).

## 9. The content app's OWN visual bar (it must be beautiful too)

The app is not exempt from the LAAS bar — it is 2D but it is still the ART product.

### 9.1 Reference frames

Brilliant lessons (generous whitespace, one focal manipulable, immediate animated feedback, restrained palette), Nicky
Case explorables (playful warmth), *Pixar in a Box* (art taught interactively), Blazing Audio.

### 9.2 Guarantee · banned outcomes · rubric

- **Immediate-beautiful-result guarantee (§6 engine):** in *Your Turn*, a random child action must produce a result that
  scores ≥7 on a "does this look designed?" VLM rubric. If the sandbox can produce ugly output, the engine has failed.
- **App banned outcomes:** any multiple-choice-quiz screen; a blank-canvas "now draw" with no scaffold; text-wall
  tutorials/modals; dead/decorative controls; ugly default output; points/XP/streaks; motion that ignores
  `reducedMotion`; an inaccessible manipulable with no operable peer (§12).
- **App self-score rubric rows:** clarity of the one manipulation · immediacy of feedback · beauty of default output ·
  restraint/whitespace · delight of micro-animation · legibility of "your turn vs guided" · accessibility parity ·
  does-it-teach-by-doing (not telling).

---

# PART C — THE SEAM

## 10. Opening the app from the world (the easel doorway) + the single-Canvas invariant

- **The affordance:** the **grand easel** is the doorway. Its canvas is a luminous portal breathing with the current
  strand's colors; the ONE verb floats above it (*"Step up to the easel"*). It is the obvious primary action of the room
  (VLM rubric: "the doorway is obvious"). `window.__qa.primaryAction = "open-atelier"` — the gate **hard-fails** if this
  is dead.
- **The transition (diegetic, not a modal).** Selecting the easel eases the camera to the `hero` pose, the canvas fills
  the frame, and a soft crossfade (`resolveMotion("islandFocus")`) hands off to the content app. Reduced-motion →
  instant cut. Returning **eases back to the studio and a new framed artifact appears on the gallery wall** (satisfying
  closure; guilt-free exit).
- **Single-Canvas invariant preserved (core-spec §5.2, non-negotiable).** The content app is **DOM/SVG/2D-canvas**
  rendered **outside** the persistent `<Canvas>`. Opening the app does **not** mount/unmount the WebGL context: the 3D
  atelier canvas stays mounted but idle (`frameloop` paused / hidden behind the app overlay). One `<Canvas>` for the
  app's lifetime; the mount counter stays at 1 across `enter room → open atelier → close → exit`.
- **State handoff (the app receives the same injected context as a room).** The content app is a `ZonePlugin` surface: it
  gets `RoomProps` — `learnerRef, ageBand, reducedMotion, plainMode, deviceCaps, savedArtifacts, presentation` (the
  resolved art pack: `palette`, `scene3d`, `camera3d`, `quality`, `motionOf`), `emit`, `onSaveArtifact`, `onExit`,
  `dayOffset`, `tier`. A Storybox `SceneCard` passed in can be *opened and finished* in the Commission.

## 11. Signal capture across world + app (action → work-mode → event → family)

Grounding (faithful to the engine): `ActivityEvent` carries `{zoneId, probeId, domain, workMode, action, kind,
dayOffset, intervention?, assistive?, withdrawn?}`; `workMode` is the probe's; `kind` maps to a signal family via
`toEngagementEvents`. **Both layers call the same `emit`.** The two axes are orthogonal: each action has one work-mode
(its probe) and may raise one signal-family event (its `kind`/context).

### 11.1 The unified action → signal table (world + app)

| # | Layer | What the child does | `workMode` | probeId | `kind` → family |
|---|---|---|---|---|---|
| 1 | world | Enter the Art Studio building (map selection) | — | — | map building selection (topic axis) |
| 2 | world | Arrange props in the Storybox | `build` | `art.world.storybox.v1` | `explore`→(tick) / `artifact` on keep → `ARTIFACT_COMPETENCE` |
| 3 | world | Wash the Storybox sky / scatter | `build` | `art.build.wash.v1` | `explore` |
| 4 | world | **Step up to the easel (open the app)** | — | (primary action) | opens the app; not a probe itself |
| 5 | app | Place the focal on a thirds guide | `compose` | `art.compose.focal.v1` | `artifact` → `ARTIFACT_COMPETENCE` on keep |
| 6 | app | Balance visual weight | `compose` | `art.compose.balance.v2` | `artifact` |
| 7 | app | Leading lines to the subject | `compose` | `art.compose.lead.v2` | `challenge` → `CHOSEN_CHALLENGE` (stretch) |
| 8 | app | Set value structure / desaturate reveal | `build` | `art.build.value.v1` | `artifact` |
| 9 | app | Choose a color harmony | `build` | `art.build.harmony.v2` | `artifact` |
| 10 | app | Shade the ball → round (form) | `build` | `art.build.form.v1` | `artifact` |
| 11 | app | Move the sun (light direction) | `build` | `art.build.direction.v2` | `challenge` → `CHOSEN_CHALLENGE` |
| 12 | app | Commit a mood / time-of-day | `explain` | `art.explain.mood.v1` | (tick) |
| 13 | app | Before / now / after sequence | `explain` | `art.explain.sequence.v1` | `artifact` |
| 14 | app | Title + 3 story beats | `explain` | `art.explain.tell.v2` | `author-scope` → `SELF_AUTHORED_SCOPE` |
| 15 | app | Share to the gallery (audience) | `explain` | `art.explain.gallery.v3` | `artifact` → `ARTIFACT_COMPETENCE` (group/audience) |
| 16 | app | Fix a broken picture | `debug` | `art.debug.fixpicture.v1` | `artifact` |
| 17 | app | Re-open & polish own work after "done" | `debug` | `art.debug.polish.v2` | `revise` → `UNREQUIRED_REVISION` |
| 18 | app | The Commission (self-scoped) | `build` | `art.build.commission.v3` | `author-scope` + `challenge` → `SELF_AUTHORED_SCOPE`,`CHOSEN_CHALLENGE` |
| 19 | both | Rebuild after a *clear / "it looked messy"* | (that probe) | (that probe) | `recover` → `FAILURE_RECOVERY` |
| 20 | both | Save any artifact (meets its `artifactEvidence`) | (current) | (current) | `artifact` → `ARTIFACT_COMPETENCE` |
| — | both | Use the always-present help / "ask the studio" | any | any | `assist` → `ASSISTIVE` (`assistive:true`, **never lowers a signal**) |

**The return signal (cross-cutting — the actual point):**
- **Unprompted re-entry** to the studio, or **unprompted re-open of a specific lesson/artifact** after novelty decays
  (`dayOffset ≥ 7`, `intervention` undefined) → `kind:"return"` → `VOLUNTARY_RETURN` (@7/@30) → fires the label-free
  `welcomeBack` delight, **zero points attached**.
- **Re-entry after a reminder/nudge** → `intervention` set → `PROMPTED_RETURN`, **excluded** from the voluntary signal
  (visibly recedes, `promptedRecede`).
- **First-session enthusiasm is novelty, not interest** — day-0 `explore` never counts as a return (novelty gate); a
  burst of first-lessons keeps the hypothesis `EMERGING` and schedules a delayed return check.
- **Deep-absorption proxies (SPOV 3), behavioral only:** unrequired-revision count (`revise`), voluntary lesson-chaining
  (multiple lessons in one strand without prompting), and voluntary return @7/@30. **No wall-clock, no affect, no
  score.**

### 11.2 Coverage / probe attributes (feeds the grid + candidate gate)

| probeId | workMode | difficulty | social | audience | autonomy | artifactEvidence |
|---|---|---|---|---|---|---|
| `art.world.storybox.v1` | build | foundational | solo | no_audience | medium | Storybox has ≥3 placed elements |
| `art.build.wash.v1` | build | foundational | solo | no_audience | medium | a backdrop wash committed |
| `art.build.value.v1` | build | foundational | solo | no_audience | medium | a value structure committed (grayscale-reads) |
| `art.build.harmony.v2` | build | stretch | solo | no_audience | high | scene recolored to a named harmony |
| `art.build.form.v1` | build | foundational | solo | no_audience | medium | a shaded form (≥3 of core/highlight/reflected/cast) |
| `art.build.direction.v2` | build | stretch | solo | no_audience | high | a chosen dramatic light direction |
| `art.build.commission.v3` | build | stretch | solo | no_audience | high | finished piece across ≥3 concepts |
| `art.compose.focal.v1` | compose | foundational | solo | no_audience | medium | focal element on a thirds intersection |
| `art.compose.balance.v2` | compose | stretch | solo | no_audience | high | a balanced multi-element composition |
| `art.compose.lead.v2` | compose | stretch | solo | no_audience | high | leading lines resolve to the subject |
| `art.explain.mood.v1` | explain | foundational | solo | no_audience | medium | a mood/time-of-day committed |
| `art.explain.sequence.v1` | explain | foundational | solo | no_audience | medium | 3 frames in before/now/after order |
| `art.explain.tell.v2` | explain | stretch | solo | no_audience | high | title + 3 story beats |
| `art.explain.gallery.v3` | explain | stretch | **group** | **audience** | high | a piece shared to the gallery for an audience |
| `art.debug.fixpicture.v1` | debug | foundational | solo | no_audience | medium | a diagnosed + repaired fault |
| `art.debug.polish.v2` | debug | stretch | solo | no_audience | high | ≥1 unrequired revision after "done" |

## 12. Accessibility across the seam (describable composition for low-vision; parity by construction)

The 2D map is DOM (the a11y floor, primary). The 3D atelier canvas is `aria-hidden`; the content app's heavy manipulables
have the same problem a canvas does. **Every surface ships an operable DOM peer that preserves the *act of making a
picture*** (Surveyor lesson: never collapse the world to a flat to-do list). Same verbs, same probes, same events, same
artifacts — parity by construction (`plainZoneEquals` / `plainViewEquals`).

- **Nameable positions, not pixels.** Every placement is a **3×3 nameable slot** (`left|center|right` × `near|mid|far`)
  — *position is a word*. Layers are a named tree (`Backdrop ▸ Stage ▸ Foreground`).
- **Named colors, never color-only.** Each swatch announces **name + value-step + role** (e.g. *"warm gold, light,
  focal"*); props carry **name + glyph + texture** so nothing is color-only.
- **The composition as words (the killer feature).** A **live-region narration** updates on every change and **is** the
  low-vision `thumbnailRef`/`altText`:
  > *"Dusk. Foreground: a fox, center-near. Stage: three pines, left-mid. Backdrop: a crescent moon, right-far. Value:
  > the fox is the lightest thing. Mood: calm. Title: 'The fox waits.'"*
  A blind child **authors and perceives a real composition**, not a form. This narration is the artifact's alt-text
  (always generated).
- **Every explorable has a described, keyboard-operable peer.** Focal/thirds → choose a slot from the grid and hear the
  gaze read ("the eye now rests on the fox"). Value → a slider that announces steps + a "reads in grayscale: yes/no"
  check. Light direction → named directions (front/side/back/rim) + a described shadow. Story → text fields + ordered
  frames. Fix-it → the fault is *named* and the repair is *described*.
- **Standard AT nav (Accessible Games Initiative / MS tags, WCAG 2.2 AA):** focus moves **one item at a time** (never a
  steered cursor); announce name/role/state; announce context changes; reduced-motion → instant framing;
  reduced-transparency → solid surfaces; visible `--focus`; every control has a **non-penalizing help** affordance
  (`ASSISTIVE`, `lowersSignal:false`). Because both renderings emit identical `{domain:"visual_design", probeId, type}`
  and produce identical artifacts, **the accessible path is a true equal — same signal, same delight, same artifact.**

---

## 13. Wiring — implementable against the frozen `ZonePlugin`

```ts
// passion/packages/interest-zone-art/src/index.ts
// (owns only this dir; the single shared-root touch is registering artZone in app/zones.ts)
import type { ZonePlugin } from "@gt100k/interest-zone-kit";
import type { Probe } from "@gt100k/interest-lab";

export const ART_PROBES: readonly Probe[] = [ /* the 16 probes in §11.2, all domain:"visual_design" */ ];

export const artZone: ZonePlugin = {
  id: "art",
  domain: "visual_design",              // frozen-core binding; hue → #6C8CE8
  mapBuilding: { label: "Art Studio", glyph: "glyph-easel", enterVerb: "Step inside",
                 cell: { col: 2, row: 0 }, art: { sprite: "building-art-studio" } },
  Room3D: ArtAtelierRoom3D,             // the world-layer 3D atelier (§4) — mounts into the shared Canvas
  ActivityDOM: ArtAtelierActivityDOM,   // operable DOM peer of the room + the content-app entry (§12)
  probes: ART_PROBES,
};
```

- The **content app** ("The Atelier") is a route/module (`passion/apps/interest-lab/app/atelier/...` or a component the
  zone lazy-loads) that renders as a **DOM overlay outside** the persistent `<Canvas>` (§10) and receives `RoomProps`. It
  is a *second surface of the same zone*, not a second zone — it emits through the same `emit` and produces the same
  `SceneCard`.
- **`window.__qa`** (both surfaces, so the upgraded gate can't be fooled — world-design §9):

```ts
window.__qa = {
  zone: "art",
  primaryAction: "open-atelier",                        // room: the easel doorway must be LIVE (hard-fail if dead)
  interactives(): QaInteractive[],                      // room props + easel + (in app) the lesson's controls
  openAtelier(): { ok: boolean },                       // round-trip: opening the app changes stateHash
  placeProp(propId, layer, slot): { ok; elementCount }, // Storybox live round-trip
  doLesson(probeId, input): { ok; artifact?: SceneCard },
  saveArtifact(): SceneCard,
  getEmittedSignals(): Array<{ domain; probeId; workMode; kind }>, // asserts probes actually fire on both layers
  stateHash(): string,                                  // changes on enter / open-atelier / lesson / save
  canvas: { primary: false, hasDomAlternative: true },  // canvas aria-hidden; DOM peer is the AT surface
  domActivityOperable: true,
};
```

The gate then verifies **inside** each surface: a raycast round-trip in the room (click easel → app opens →
`stateHash` changes; click Storybox → element count rises); a pointer-sweep pixel-diff (placing / mood / doing a lesson
visibly changes pixels); and a VLM rubric ("is the primary action obvious? does the room read as a lovingly-dressed
atelier, not an asset dump? does the app teach by doing, not quiz?").

---

## 14. Anti-patterns this design refuses (and how)

| Anti-pattern | How v2 avoids it |
|---|---|
| **Decorative 3D over a menu** | The easel/Storybox/props/dial are live & raycastable; `__qa.primaryAction="open-atelier"` verified; the DOM peer is a real composer, not a fallback. |
| **Quiz behind a pretty door** | The content app is **not** a quiz — no multiple choice; entering the app = *doing the concept*. Banned outcome (§9). |
| **Chocolate-covered broccoli** | The vegetable tastes good: beauty + real skill *is* the reward. No points/stars/XP/score on making or returning (no `score/rank/price` fields anywhere). |
| **Depth crammed into the world room** | Hard layer boundary (§1): the room is shallow-but-beautiful (one toy, one doorway); depth lives in the app. |
| **Bare / asset-dump 3D** | Nothing-is-bare law + ≥45 dressing objects + surface-class floors (§4.2, §4.6); a single prop on an empty floor is an instant fail. |
| **Flat, dead-shadow rendering** | No-black-shadows law; HDRI + key + cool fill; frozen contact shadows; bloom + fog + light-shaft (§4.4); instant-fail list (§4.7). |
| **Static, lifeless scene** | The-world-moves law: ≥6 always-on motions (§4.5). |
| **Mistaking novelty for interest** | Day-0 `explore` is novelty-gated; only unprompted return + revision count; the "a week later…" device makes it honest (§11.1). |
| **Gamifying the return signal** | Half-finished frame glows = one gentle opt-in cue; no streak/countdown/FOMO; guilt-free exit; `welcomeBack` carries no points. |
| **Accessible path as a lesser menu** | Every manipulable has a described, operable peer; nameable slots + named colors + live composition narration = the artifact as words; parity by construction (§12). |
| **Fixed label / score** | Never "you are an artist." Per-cell `{visual_design × workMode}` evidence → a revisable hypothesis, never a verdict. |
| **Single-Canvas violation** | The app renders outside the persistent `<Canvas>`; mount counter stays 1 (§10). |

---

## 15. Build order (the zone loop, LAAS-gated — each phase runs the delta loop + self-score)

- **P0 — References + harness.** Author the room reference frames (§4.1) and app reference frames (§9.1) into
  `docs/reference/art-zone/`; wire the side-by-side delta tool; expose `window.__qa`. *No phase closes without the delta
  loop.*
- **P1 — `ART_PROBES` + parity.** The 16-probe catalog (§11.2) + a unit test for the coverage spread (build/compose/
  explain/debug, foundational+stretch, solo+group, audience+no_audience within `visual_design`); `ActivityDOM` skeleton
  (defines the verbs + the `emit`/`SceneCard` contract with no GPU).
- **P2 — Content app core loop.** The lesson shape (§6) + the immediate-beautiful-result engine + 3 foundational lessons
  (focal, value, form) end-to-end (hook→guide→your-turn→reveal→artifact→gallery). Delta loop vs app frames; app
  self-score.
- **P3 — Full curriculum.** The remaining lessons (§7) incl. the fix-it strand + the Commission capstone; artifacts +
  append-only `revisions[]` + alt-text.
- **P4 — 3D atelier room.** The bounded room against the reference frames (§4): shell + Nothing-is-bare dressing +
  warm-default lighting + light-shaft + fog + frozen shadows + post + the ≥6 motions + the Storybox + the easel-portal.
  Delta loop vs room frames; room self-score.
- **P5 — The seam.** The easel → app transition (§10); state handoff; single-Canvas invariant test (mount counter === 1);
  return → new framed artifact.
- **P6 — Signal + a11y.** Both surfaces emit correct `{domain, workMode, kind}` (§11); the DOM peers + live composition
  narration (§12); parity tests; keyboard nav; reduced-motion/transparency.
- **P7 — Asset + perf pass.** Optimize → `gltfjsx` → instance to **≤30 draw calls** on a real low-end Chromebook under
  sustained load; `PerformanceMonitor`/`AdaptiveDpr`; `assets/LICENSES.json`.
- **P8 — Integrate + gate.** Register `artZone`; run the upgraded QA gate (dead-primary-action, aria-hidden-primary,
  raycast round-trip, pixel-diff, VLM rubric) + the final delta loop + operator review on `localhost`.

**Definition of done:** all lane-0 SCs green with `artZone` registered; both surfaces pass their delta loops and
self-score ≥7 on every rubric row; `≤30` draw calls sustained; the two-frame room test (Frame 1 "Establishing Warmth" +
Frame 3 "Easel Portal") snags no category error (flat/bare/dead-shadow/cloned/dead-doorway) at a one-second glance; a
blind child can author and perceive a real composition end-to-end.
