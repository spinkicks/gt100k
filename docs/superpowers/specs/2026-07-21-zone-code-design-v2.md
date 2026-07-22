# Code Zone — Deepened Design **v2** (LAAS-level): Discovery World + Domain Content App

**Date:** 2026-07-21 · **Owner:** David · **Lane:** 3 (parallel zone loop) · **Supersedes:** the child-facing
depth of [`2026-07-21-zone-code-design.md`](./2026-07-21-zone-code-design.md) (v1). The v1 probe catalog,
work-mode mapping, and core binding are **kept and extended**; the *single conflated activity* is **split
into two layers** and both are taken to reference-frame depth.

**Implements:** `ZonePlugin` from [`2026-07-21-interest-lab-world-design.md`](./2026-07-21-interest-lab-world-design.md) §4,
against the **frozen** lane-0 contract in [`2026-07-21-interest-lab-core-spec.md`](./2026-07-21-interest-lab-core-spec.md)
(`ZonePlugin`/`RoomProps`/`ActivityEvent` §3).

**Grounded in:** `docs/research/stylizedWorldAssetPipeline.md` (CC0 + art direction + Chromebook budgets),
`docs/research/interest-lab-world-precedents.md` (intrinsic integration; explorable explanations; the return
signal; the Dead-Space diegesis caution), `docs/research/passionBrainlift.md` (manufacture-and-prune; never
label; chase deep absorption; **don't gamify the signal**), `gt100k-factory/docs/RESEARCH-visual-ux-qa-harness.md`
(the `window.__qa` gate, raycast round-trip, VLM rubric), and the **LAAS depth method**
([`Braffolk/fable5-world-demo` · `PROJECT_LAAS_v2.md`](https://github.com/Braffolk/fable5-world-demo/blob/main/PROJECT_LAAS_v2.md)):
*a concrete visual bar with reference frames, hard floors that define the bar, an explicit banned-outcomes
list, a mandatory reference-delta loop, and a reference-anchored self-score — judged against images, not
against "pretty good for a browser."*

Reference model for the content app: **[Brilliant.org](https://brilliant.org)** interactive lessons and the
sibling audio app **[blazing-audio-alpha.web.app](https://blazing-audio-alpha.web.app/)** ("*Learn how audio
really works, one hands-on lesson at a time*").

This spec owns only `passion/packages/interest-zone-code/`. The single shared-root touch is registering the
plugin in the app's zone registry.

---

## 0.0 Enrichment & naming reconciliation (binding — read once)

This v2 doc predates the enriched, buildable interior in
[`2026-07-21-cabin-interior-code.md`](./2026-07-21-cabin-interior-code.md) ("The Tinker Workshop"). Where the
two describe the same object, **the cabin interior + the frozen core win**; the bindings below are canonical
and are applied throughout this doc:

| Was (v1/early-v2) | **Canonical now** | Why |
|---|---|---|
| `domain: "computation"` | **`domain: "symbols_math"`** | The **frozen** lane-0 core (core-spec §2, `V1_DOMAIN_ORDER`, the §8 goldens) and [`…-reconciliation.md`](./2026-07-21-interest-lab-reconciliation.md) §1 use `symbols_math`; `createZoneRegistry` throws if `plugin.domain`/`probes[].domain` is absent from `domainOrder`, and the QA `stateHash` goldens bake in `symbols_math`. The child-facing label stays **"Code Lab"**; the craft is coding / computational thinking. |
| the **"Build Bench"** (room doorway) | **The Coding Desk** | The old "Build Bench," retro-terminal, and floating blueprint-hologram are **fused into one real, kid-recognizable workstation** — a warm-wood desk with a monitor glowing colorful code, a mechanical keyboard with an amber **RUN** key, and a laptop. The doorway hotspot is `coding-desk`; its handler is `openDesk()`. (cabin-code §4.) |
| **"Pip"** the wind-up automaton | **Sprout**, the codeable robot | Recast per the cabin. A friendly **Claude** AI desk-buddy is a *new, separate* companion (not the doorway, not the robot). |

Everything else in this doc (the two-layer split, the concept ladder, the signal model, the a11y peers) is
unchanged. **Content-deferred v1 firewall:** in v1 the room's cozy live-taste + micro-interactions are
**signal-free** (juice ≠ signal — aliveness §1.2); the room contributes only the **coarse domain-return**
(entering/revisiting the Code Lab). The fine `{symbols_math, workMode}` `ActivityEvent`s tabulated below
arrive with the **deferred content app** opened *through* the Coding Desk (reconciliation §5, §7).

---

## 0. The architecture pivot (why v2 exists)

v1 put the *entire* learning experience — arrange command tiles, run the bot, watch it fail, fix it —
**inside the bounded 3D room**. That conflates two jobs that want opposite designs:

- **Discovery** wants *atmosphere, invitation, and a legible interest signal* — a beautiful cozy place you
  wander into, that says "coding lives here," and quietly records that you approached, dwelled, and
  came back. It must be gorgeous and it must be **fast on a Chromebook**, so it must stay small.
- **Deep learning** wants *hands-on interactive density, a concept ladder, immediate visual results, and
  productive failure* — a Brilliant-style experience where **manipulating the thing is the explanation**.
  Cramming that into a raycast-driven 3D room fights legibility, accessibility, and the frame budget.

**v2 splits them into two layers with one seam:**

```
┌──────────────────────────── THE DISCOVERY WORLD (Part A) ─────────────────────────────┐
│  2D Curiosity Map building  ──enter──▶  bounded 3D "Code Lab" workshop (cozy, beautiful)│
│  • exploration + atmosphere + interest signal (approach / dwell / voluntary return)     │
│  • ONE obvious verb: step up to the glowing CODING DESK                                  │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │  THE SEAM (Part C): open the Coding Desk
                                            ▼
┌──────────────────────────── THE DOMAIN CONTENT APP (Part B) ─────────────────────────────┐
│  Brilliant-style, hands-on, interactive computational-thinking app (2D/DOM + light canvas)│
│  • block/visual programming · immediate visual results · puzzles that teach by DOING       │
│  • the four work-modes: build · debug · investigate · compose                              │
│  • emits {domain:"symbols_math", workMode} → the return grid                               │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

**The room is not the container; it is the doorway.** The deep learning is a Brilliant-style module opened
*from* the doorway. Both layers feed one signal. Everything below designs both to the LAAS bar.

### 0.1 The depth contract (LAAS, adapted to a cozy bounded product)

We are **not** chasing UE5 open-world fidelity — the constraint is a school Chromebook and a *cozy* mood
(A Short Hike / Alba / Cozy Grove / Animal Crossing), not an alpine ravine. But we adopt the **LAAS method
verbatim**:

1. **A concrete visual bar with reference frames.** Assemble `/reference` (real screenshots from the named
   touchstones). Every phase is judged **side-by-side against those frames**, not against "good for a
   browser." Building to a lower bar because it is comfortable is a **failed task**.
2. **Reference-delta loop (mandatory, every phase).** Render the closest matching shot, place it beside the
   reference, write `DELTA.md`: the **ten most visually significant differences, ranked by impact**. Fix the
   top three. Re-render. Only then does the phase close.
3. **Hard floors** (§A6, §B9): numbers that define the bar. Under-dressing is a failure mode, exactly like
   LAAS's "under-rendering is a failure mode."
4. **Banned outcomes — instant fail** (§A9, §B9, §D2).
5. **Reference-anchored self-score** (§A10, §B11): per row, `10 = passes a one-second glance against the
   reference · 7 = clearly synthetic but same class · 4 = decent hobby demo · 2 = 2010 asset-flip`. Score
   after every phase; write "what raises this by 2 points"; implement the two cheapest before proceeding.
6. **Final acceptance = a two-frame + one-flow test** (§D5).

**The six cozy-room pillars (resolve any ambiguity in favor of the pillar):**

| # | Pillar | The rule (LAAS-style, cozy-adapted) |
|---|---|---|
| **A** | **Cozy beats impressive** | "I want to be in this room" wins over technical flex. Target a late-afternoon sunbeam in a maker's nook. A cold, empty, "clean" room is a fail even at 60fps. |
| **B** | **Light transport, cozy-grade** | **No black shadows, ever.** Warm key (window sun) + cool sky fill; shadowed wood/brass reads warm-brown, never desaturated gray. *Sample any shadowed pixel — if it's flat gray, lighting has failed.* |
| **C** | **Nothing is bare / everything is hand-made** | Every surface class carries a maker's marks: tools, shavings, blueprints, half-built contraptions, plants, mugs, jars, string-lights. The room reads as a place where someone has been *building things for years*. |
| **D** | **One obvious verb** | The room teaches by affordance (World 1-1) that you *step up to the bench*. Exactly one primary interactive; everything else is beautiful, legible atmosphere. No tutorial wall. |
| **E** | **Art direction is enforced** | One locked palette (the engine `PALETTE` + the Code (`symbols_math`) hue `#5FB98C`), one shading model, one HDRI, a warm/cool split, controlled value structure (dark frame · lit desk subject · soft background). Showcase views are *composed*, not found. |
| **F** | **The room breathes** | Dust motes in the sunbeam, one slow-turning gear, a swaying plant, the bench glow pulsing, a wind-up toy idling. A frozen frame feels one second from motion. |

### 0.2 Shared foundations (fiction · palette · engine types · domain binding)

**Fiction (one warm workshop, two depths).** The **Code Lab** (interior: **"The Tinker Workshop,"**
cabin-code) is a sunlit, greenhouse-cornered log **coding nook** — a cozy maker's desk where a kid codes the
way kids code today: a real computer, a mechanical keyboard, a sticker-covered laptop, a friendly **Claude**
AI desk-buddy, and **Sprout**, a little robot you drive with snap-together code blocks. You wander in (the 3D
room), you're drawn to the **Coding Desk** glowing at the window, you *step up to it* — and the desk opens
into **the Coding Desk app** (the content app) where you actually build, run, and debug little programs that
make the workshop's creations (Sprout and friends) come to life. Your finished creations come back to live on
**the Shelf** in the room.

**Palette lock (the warm Emberwood pack — art bible §3; do not invent new hues).**
`PALETTE.spark #FF9E5E` (warm invitation / the desk + RUN-key glow), `PALETTE.beacon #FFD166` (success /
focal warmth), `PALETTE.sprout #7BD88F` (plant life / "go"), and the additive `CABIN` material tokens. The
dark foreground frame is the **warm** `CABIN.woodCocoa #4A3320` — **not** the retired midnight
`PALETTE.night #181026` (a **banned outcome** now; reconciliation §6, art bible §11). `PALETTE.tide #5EC8D8`
is permitted **only** as a tiny status-LED desaturated toward `verdigris #7F9E8E`, off the hero — **never a
cold-blue screen wash or an RGB glow** (the no-cold-blue-screen rule, cabin-code §6.4). The **Code
(`symbols_math`) domain hue** comes from `resolveDomainHue(domainOrder, "symbols_math")` = `HUE_RAMP[1]`
**`#5FB98C`** (warm-leaning sage — the marker + building tint + the screen glow). Typography from
`TYPOGRAPHY` (Fredoka display · Iowan reading · Inter body). Motion from `resolveMotion(...)` tokens
(`MOTION`/`EASINGS`), reduced-motion honored.

**Engine types (frozen, from the repo — reference, do not redefine):** `Probe`/`ProbeFamily`/`Domain`,
`WorkMode`/`WORK_MODES` (nine verbs), `EngagementEvent`/`EventType`/`EVENT_TYPES`, `InterventionContext`,
`SignalSummary` (`@gt100k/interest-lab`); `ActivityEvent`/`ActivityKind`, `RoomProps`, `ZonePlugin`
(frozen lane-0 contract). **v2 emits the frozen `ActivityEvent` (`kind`) — not raw `EngagementEvent`** — and
lets the core's `toEngagementEvents` bridge to the six families (this corrects v1 §11, which emitted
`EngagementEvent` directly and predates the frozen contract).

**Domain binding (decision — see §0.0).** This zone declares **`domain: "symbols_math"`** and every emitted
`ActivityEvent.domain = "symbols_math"`. This is **not** optional: the **frozen** lane-0 core
(`V1_DOMAIN_ORDER = ["sound_music","symbols_math","visual_design"]`, the §8 goldens, the `stateHash`
goldens) and [`…-reconciliation.md`](./2026-07-21-interest-lab-reconciliation.md) §1 fix the wire key as
`symbols_math`, and `createZoneRegistry` throws if `plugin.domain`/`probes[].domain` is absent from
`domainOrder`. The earlier `computation` divergence is **dropped** (reconciliation §1). The **child-facing
label stays "Code Lab"** and the craft is *coding / computational thinking* — that concept name is fine in
prose; only the **wire key** must be `symbols_math`. All three zones share the same work-mode column strings
(`build`/`debug`/`investigate`/`compose`) so the cross-domain column signal holds.

---

# PART A — THE DISCOVERY WORLD (the cozy 3D Code Lab + 2D building)

## A1. The visual bar — reference frames (obsess over the contents)

Assemble `passion/packages/interest-zone-code/reference/` with real screenshots for each frame below, from
the named touchstones. **Each phase renders the closest shot and runs the delta loop against these.**

### RF-W1 — "The sunlit coding nook" (hero establishing shot of the 3D room)
*Touchstones:* A Short Hike interiors, Studio-Ghibli desks, Stardew greenhouse/workshop, Animal Crossing
rooms, **a warm "cozy coding desk setup"** (honey wood + plants + string-lights + a warm-backlit keyboard —
deliberately **NOT** an RGB battlestation), a kid's **Scratch / micro:bit / Raspberry Pi maker corner**.
(Deepened in [cabin-code](./2026-07-21-cabin-interior-code.md) RF-INT-CODE "The Sunlit Coding Nook.")
**What the frame must contain:** a 3/4 view into a small warm log **coding nook** with a glass greenhouse
gable; a **big window** on the left spilling a warm afternoon **sunbeam** with visible **dust motes**; a
central **Coding Desk** carrying a **real, kid-recognizable computer** — a warm-bezel **monitor glowing with
big, colorful, legible code** (warm sage `#5FB98C` + amber, **never cold blue**), a chunky **mechanical
keyboard** with an oversized amber **RUN** key, and a **sticker-covered laptop** showing block-code; a
**plush Python** and a friendly **Claude** AI desk-buddy beside it; a **language nook** of JS/HTML/CSS/Python
books; **Sprout** the codeable robot on a mat with a tray of colorful code blocks; a **wood-stove** glowing
amber; a **shelf** of little finished creations; **plants** (a trailing vine, a potted sprout);
**string-lights**; a mug, a chalkboard start→loop→goal sketch, and a cat asleep on the sill. Warm honey wood
+ brass; shadows tint **blue-violet**. The eye lands on the glowing monitor within one second.
**FAIL if the frame looks like:** an empty room with one table and a button; a **generic steampunk inventor's
shop with no visible computer/keyboard/code**; a **cold-blue "hacker" room** or a **cold RGB gamer
battlestation**; bare untextured walls; a cold gray box; a lobby.

### RF-W2 — "The Coding Desk, ready" (the primary affordance, close)
*Touchstones:* a warm developer desk backlit by a low lamp; the glowing forge/portal in cozy games;
Monument Valley's warm focal geometry. (Deepened in [cabin-code](./2026-07-21-cabin-interior-code.md)
RF-INT-CODE-2 "The Desk, ready.")
**What the frame must contain:** the **Coding Desk** as the single brightest warm focal point — a warm-wood
desk carrying a **friendly warm-bezel monitor glowing with big, colorful, legible code** (warm-dark
background, sage `#5FB98C` + amber syntax — **never cold blue**), a chunky **mechanical keyboard with one
oversized amber RUN key** catching a candle-warm glint, and a sticker-covered laptop; a gently **blinking
amber cursor**; `spark #FF9E5E` rim-glow; warm bloom; **Claude** the desk-buddy doing a tiny idle blink; and
a clearly-implied "step up here" affordance (a worn stool, a light-worn spot on the floor). It reads as *the
one thing to do* without any text label.
**FAIL if the frame looks like:** a flat button floating in 3D; a generic "Enter" sign; a **cold-blue screen**
or a **cold RGB glow**; a steampunk shop with no visible computer; nothing obviously primary; two competing
focal points.

### RF-W3 — "The Code Lab on the map" (the 2D building tile)
*Touchstones:* Animal Crossing map icons, A Short Hike map, cozy isometric building tiles, the existing
Curiosity-Map buildings.
**What the frame must contain:** a small, warm, hand-drawn-feeling **workshop building** with a gear-sprout
sign, tinted to the Code (`symbols_math`) hue, sitting in its island slot; a soft **shelf-glow** cue *iff* the child
has kept/unfinished creations (the return cue); a clear one-verb label ("Step inside"); a legible
return-state cue (new / you've been here / you came back). Focusable, keyboard-navigable, never
`aria-hidden`.
**FAIL if the frame looks like:** a flat colored rectangle; an unreadable icon; no return cue; indistinct
from other buildings.

> **The rule (LAAS §top):** you will not fully reach these frames on a Chromebook — the task is to *close as
> much of the gap as the budget allows and know precisely how far you got*. A result that reads as a 2010
> asset-flip — bare surfaces, gray shadows, cloned props, a button over a backdrop — is a **failed task**,
> no matter how clean the code.

## A2. The 2D map building — exact contents & states

Consumes `MapBuildingView` (label / glyph / enterVerb / cell / art). Rendered by the core `<CuriosityMap>`
as a **real focusable button** (never `aria-hidden`).

| Field | Value | Note |
|---|---|---|
| `label` | "Code Lab" | |
| `glyph` | `gear-sprout` | a cog with a leaf — "logic that grows"; decorative only |
| `enterVerb` | "Step inside" | World-1-1 single verb |
| `art.hue` | `resolveDomainHue(order,"symbols_math")` = `HUE_RAMP[1]` `#5FB98C` | else derived from catalog order |
| `sprite` | `workshop` | cozy workshop/greenhouse silhouette |
| `ambientCue` | `shelf-glow` | soft `spark` glow **iff** saved/unfinished creations exist |

**States (all cozy, none coercive):** `new` (fresh, faint sparkle) · `explored` (you've been here; sparkle
gone) · `voluntary-return` (warm `welcome-back` glow, **no points**) · `prompted-return` (recedes to
`PALETTE.prompted`, tagged, ≠ signal). `unfinished > 0` shows a single gentle "your half-built thing is
still here" glow — **never a badge, counter, or countdown**.

## A3. The 3D room — exact contents (the obsessive enumeration)

Fixed 3/4 camera (`fov 35–40`), orbit **disabled/clamped**; contents swap inside the shared persistent
`<Canvas>` on enter/exit (never remount). The room is **one composed diorama**, not a walkable level. Every
item below is a required occupant (Pillar C).

**Zone 1 — The window & light source (left).** A mullioned **window**; a warm **sunbeam** volume (god-ray
cone) landing on the bench; **dust motes** drifting in it (`<Sparkles>`); a **windowsill** with 2–3 potted
sprouts and a small watering can; a **trailing vine** framing the top-left.

**Zone 2 — The Coding Desk (center, the hero / primary affordance).** A chunky **warm-wood desk**; on it, the
heart of the room: a **friendly warm-bezel monitor** glowing with **big, colorful, legible code** (sage
`#5FB98C` + amber syntax on a warm-dark background — **never cold blue**, cabin-code §6.4), a chunky
**mechanical keyboard** with one oversized amber **RUN** key, a **sticker-covered laptop** showing block-code,
a **plush Python**, and **Claude** the AI desk-buddy blinking beside it. On a low mat nearby: **Sprout**, the
codeable robot, with a tray of colorful snap-together code blocks. The monitor's glowing code + the amber RUN
key are the doorway's invitation — a `spark` rim-glow and soft bloom on the screen and key. **This is the one
primary interactive** (`coding-desk`): approaching/activating it opens the content app. *(The old "Build
Bench / floating blueprint-hologram / wind-up GO key" are **fused into** this one real workstation — the
hologram is now the actual colorful code on the monitor, the GO key is the amber RUN key; cabin-code §4.1.)*

**Zone 3 — The pegboard & tool wall (back).** A **pegboard** with hand tools (screwdrivers, pliers,
calipers, a soldering iron), each on its silhouette outline; pinned notes and a small **chalkboard** with a
hand-drawn **flow diagram** (a tiny start→arrow→loop→goal sketch — diegetic foreshadowing of the concepts).

**Zone 4 — The Shelf (right, the memory / return cue).** A wooden **shelf** with slots. Each **kept
creation** appears as a tiny finished automaton or a labeled ribbon ("★ solved in N blocks"); **empty slots
are visible** (room to make more). The shelf **glows softly** iff kept/unfinished work exists. This is the
diegetic form of `unfinished`/artifacts — the room saying "your things are still here."

**Zone 5 — The floor & cozy dressing.** A **rug**; a **stool** worn where you'd stand at the desk (the
"step up here" affordance); a **cable/parts crate**; a **mug** on a side table; a stack of **books**; a
**string-light** garland; scattered **spare cables, a sticker sheet, and a printout of colorful code** on the
floor. A **desk lamp** (warm practical). **The warm/cool split is carried by *light*, not by a cold screen**
(the golden window key + the wood-stove vs. the cool dusk-blue skylight fill) — the only cool practical is a
tiny **verdigris `#7F9E8E`** status-LED on Sprout's charging dock (cabin-code §6.4). **No cyan/cold-blue
monitor glow, no RGB.**

**Overworld idle (activeZoneId === null).** Before entering, the shared canvas shows a calm ambient
backdrop (soft interior bokeh or the island exterior); no dead objects.

## A4. Materials, lighting, atmosphere, motion (reference-frame-level)

**One shading model** — **flat toon/PBR** with baked AO on the atlas (per pipeline §4.4). No `MeshBasic`.
**Macro–meso–micro (Pillar C, LAAS §4):** every hero surface shows ≥3 detail bands — base color, a
wear/AO/grain band (edge wear on the bench, grain in the wood, patina on brass), and a highlight/emissive
or rim. **Single-flat-color hero surfaces are banned.** **Per-instance variation:** props that repeat
(jars, gears, books, pots) get hue/value/rotation jitter and a fraction show wear — no cloned grids.

**Lighting (Pillar B, cozy no-black-shadows law).** One warm **key** `directionalLight` (the window sun,
the only shadow-caster) + a low cool **hemisphere/sky fill** so shadows read warm-brown, never gray. **≥2
diegetic practicals:** the warm desk lamp + the **warm sage/amber monitor glow** (the screen reads **warm,
never cold-blue** — the warm/cool split is carried by light, cabin-code §6.4) (+ string-lights); the only
cool note is a tiny **verdigris status-LED** off the hero (never a cyan wash). One self-hosted **CC0
warm-interior HDRI** (Poly Haven, 1–2K) via `<Environment>` for
consistent ambient + brass reflections; `<Lightformer>` rects for cheap glints on metal.

**Shadows (bake/freeze, Pillar B).** `<AccumulativeShadows>` + `<RandomizedLight>` for the settled soft
hero shadow under the bench (zero cost once settled) or `<ContactShadows frames={1}>` under bench/shelf/
stool; `<BakeShadows>` elsewhere. **No per-frame shadow maps.**

**Atmosphere (Pillar A/F).** Palette-matched soft **fog** for depth (never to hide an empty room); the
**sunbeam** volume; **dust motes** (`<Sparkles>`); optional faint `<Cloud>` outside the window.

**Motion (Pillar F, ≥4 independent idle motions).** (1) dust motes drift; (2) the **blinking amber cursor** +
a gently scrolling line on the monitor; (3) a **plant sway** / `<Float>` on a hanging pot; (4) the **monitor
code + amber RUN key** glow **pulses** (`spark`); (+) **Sprout** does a tiny wind-up twitch and **Claude**
blinks every few seconds. All via `resolveMotion`; **reduced-motion → instant/settled** (no essential motion;
the desk glow becomes a static highlight).

**Post (budgeted).** `EffectComposer` → `Bloom(mipmapBlur, luminanceThreshold ~1.0)` (bench glow +
practicals) + `Vignette` + `ToneMapping(ACES)`, renderer `NoToneMapping`. SMAA (not MSAA).

**Camera & composition (Pillar E).** Fixed composed 3/4 shot obeying dark-frame (foreground crate/vine) ·
lit-subject (the bench) · soft-background (pegboard in gentle fog). A gentle ease-in on enter; no orbit.

## A5. Hard floors (the numbers that define the bar)

Under-dressing is a failure mode (LAAS "under-rendering is a failure"). At `room-3d`:

| Dimension | Floor |
|---|---|
| **Distinct dressing occupants** visible in the hero framing | **≥ 40** hand-made/maker objects (tools, gears, jars, blueprints, plants, mugs, books, wind-up parts, shavings, string-lights…) |
| **Occupied surface classes** (Pillar C) | window sill · bench top · pegboard · shelf · floor · side table — **each carries ≥ 3 objects**; none bare |
| **Material bands per hero surface** | **≥ 3** (base + wear/AO + highlight/emissive) |
| **Light sources** | **≥ 1** warm key (shadow-caster) + **≥ 1** cool fill + **≥ 2** diegetic practicals |
| **No-black-shadows law** | sampled shadowed-wood/brass pixels show warm chroma; **0** desaturated-gray shadow samples |
| **Independent idle motions** | **≥ 4** running at rest |
| **Primary affordance** | exactly **1** (`go-bench`), the brightest warm focal point, pulsing, wordlessly "step up" |
| **Shelf** | ≥ 1 slot per kept artifact + **visible empty slots**; glows iff kept/unfinished work exists |
| **Draw calls** | **< 50** (hard: < 100) — instanced repeats, shared atlas/material, one skinned mesh max |
| **Triangles** | ≤ ~150k in the room |
| **dpr / frameloop** | `dpr ≤ 1.5` · `frameloop="demand"` (render on enter / motion tick / bench activate) |

## A6. Teach-by-affordance — moment-to-moment in the room (zero tutorial)

On first entry the camera eases into the nook. With **no modal, no text**: the **bench hologram bobs and
its glow pulses once** (→ *look here*); the **sunbeam** points the eye at the bench; the **worn stool**
implies *stand here*. The child moves to the bench (click/tap the `go-bench`, or keyboard-focus + Enter, or
walk a clamped avatar to it) → a warm chime + a "blueprint unrolls" transition → the **content app opens**.
That is the room's entire job: be beautiful, say "building happens here," and hand off. On later visits the
**Shelf glow** (if any) is the single gentle "your things are still here" cue — never a countdown.

## A7. CC0 asset pipeline + Chromebook budget + tiers

**Assets (all CC0 — commercial-safe, no attribution):**

| Element | Source (CC0) | Notes |
|---|---|---|
| Workshop shell, bench, shelf, pegboard, crates, furniture | Kenney (Furniture/Building kits) + KayKit modular | merged/instanced; one gradient atlas |
| Tools, gears, jars, mugs, books, lamps, props | Kenney + Quaternius + Poly Pizza (verify per-model CC0) | instanced repeats w/ per-instance jitter |
| Plants / vines / sprouts | Quaternius nature | `<Float>` on one hanging pot |
| Sprout the codeable robot + Claude the AI desk-buddy (foreshadow) | Quaternius/KayKit robot + CC0 anim set; authored/CC0 friendly buddy mesh | Sprout = the lone skinned mesh (idle twitch); Claude = small static + tiny idle |
| Warm-interior HDRI | Poly Haven (1–2K, self-hosted) | `<Environment>` IBL |
| Bench hologram icon-blocks | authored flat SVG/atlas | shared with the content app's block icons |

**Pipeline (`stylizedWorldAssetPipeline.md` §7):** `gltf-transform optimize --compress meshopt
--texture-compress ktx2` → `gltfjsx --transform --types` → `useGLTF.preload`. One palette + one shading
model + fog (§A4). **Perf:** `dpr={[1,1.5]}`, `antialias:false`+SMAA, `frameloop="demand"`,
`<PerformanceMonitor>`+`<AdaptiveDpr>`.

**Tiers / degrade (frozen `RoomProps.tier`; legacy `RenderTier` = `quest-world-3d | quest-world-3d-lite |
board-2d`):** `room-3d` (full) → drop `<Sparkles>` → drop `Bloom` → **`room-3d-lite`** (flat lights, no
post, fewer motes) → **world `ActivityDOM`** (the described-room a11y floor, §A8). **The content app is
independent of this ladder** — it is 2D-first and runs on every device (see Part B), so a child who can't
run any 3D still reaches the *full* deep learning.

## A8. World-layer accessibility — `ActivityDOM` (a peer doorway, not a lesser menu)

The world layer's `ActivityDOM` is a **described room** that preserves the *act of walking up to build* and
the *return cue* (Surveyor: don't railroad; AGI/MS tags: focus one item at a time, narrate name/role/state).
It is **not** the block editor (that lives in the content app, which is already keyboard/SR-first):

- A labeled region: *"Code Lab — a cozy cabin where you code. On the desk: a computer whose screen glows with
  colorful code, a mechanical keyboard with a RUN key, and a sticker-covered laptop; Claude, your AI coding
  friend, blinks beside it; Sprout the robot waits with a tray of code blocks."*
- One primary button: **"Step up to the Coding Desk"** (opens the content app — the same seam).
- A **Shelf list**: *"Your creations: 'Sprout's first walk' (kept), 1 unfinished."* — the child still
  **chooses what to reopen**.
- Parity by construction: identical `probeId` / `workMode` / `returnState` / `tone` per `plainZoneEquals`;
  reduced-motion → instant framing.

## A9. Banned outcomes — instant fail (the room)

- Canvas is `aria-hidden` / `role=presentation` with **no** DOM alternative (the exact prior shipped bug).
- **The room is a lobby:** a flat backdrop with a button floating over it; bare surfaces; < 40 occupants;
  any bare hero surface class.
- **Dead primary affordance:** `go-bench` doesn't open the content app / doesn't change `stateHash()`.
- **Black or gray-ambient shadows;** flat-lit look; `MeshBasicMaterial` in the world.
- **Cloned props** (shared mesh varied only by rotation/scale); a grid of identical items; uniform tint with
  no per-instance jitter.
- **Fog to hide an empty room;** skybox-only background; a single bare wall behind the bench.
- **The room becomes the deep learning container** (v1 regression) — it tries to *be* the puzzle instead of
  handing off to the content app.
- **A quiz/modal wall or tutorial-text dump on entry.**
- **Any streak / point / FOMO / countdown** anywhere in the room; a badge on `unfinished`.
- **> 50 draw calls** at `room-3d`; frame drops below the tier floor on a real Chromebook under sustained
  load.

## A10. Self-score rubric (anchored to RF-W1/W2/W3) + delta loop

Score after every phase (`10 = passes a one-second glance vs the reference · 7 = clearly synthetic but same
class · 4 = decent hobby demo · 2 = 2010 asset-flip`). For each row write "what raises this by 2 points";
implement the **two cheapest** before proceeding.

Rows: **cozy mood & invitation · light transport (no-black-shadows) · dressing density & hand-made feel ·
material bands · palette cohesion · the bench reads as THE verb in <1s · motion/liveliness · composition
(dark-frame/lit-subject/soft-bg) · the 2D building tile (RF-W3) · Chromebook perf.**

**Delta loop (mandatory):** render the closest shot to RF-W1, RF-W2, RF-W3 → side-by-side → `DELTA.md`
top-10 ranked → fix top-3 → re-render → close phase.

---

# PART B — THE DOMAIN CONTENT APP (Brilliant-style computation)

## B1. The bet + the reference model

> **A hands-on workbench where you snap big command blocks together, press GO, and watch a little world do
> exactly what you told it — and by *making it work*, you discover sequence, loops, conditionals, variables,
> and functions for yourself. The arranging-of-logic is the whole game; the concept is the only way to win;
> the result is immediate and delightful.**

**There is no quiz, no multiple-choice, no "type this exact code," no "what does this print?" trivia, no
prose lecture with a widget bolted on.** The mechanic **is** the learning act (Habgood & Ainsworth intrinsic
integration; Bret Victor / Nicky Case *explorable explanations* — *manipulating the simulation is the
explanation*). This is the Brilliant model and the `blazing-audio` sibling model: **learn how it really
works, one hands-on lesson at a time**, where each lesson is a live thing you manipulate, not a page you
read.

**Reference model, concretely:** Brilliant.org lessons — a single big manipulable widget centered in
generous whitespace; you drag/tap/arrange; the result updates *instantly*; a tiny bit of framing text, then
you *do*; short satisfying steps; safe failure; a clear "you made it work." We build the *coding* version
of that.

## B2. The visual bar — reference frames for the content app

Assemble `reference/content-app/` from these. Obsess over the contents.

### RF-C1 — "A Brilliant lesson, mid-manipulation" (the core screen)
*Touchstones:* Brilliant.org interactive lessons; blazing-audio lessons; Scratch/Blockly but *calmer and
warmer*; a cozy puzzle app (A Monster's Expedition, Untangle).
**What the frame must contain:** generous warm whitespace; a **live world panel** (a small grid garden with
"Pip" the wind-up bot on it, a glowing goal); a **program strip** of 3–6 **big chunky tactile blocks**
(icon-first, color-coded, clearly draggable, casting a soft shadow); **one unmistakable primary action** — a
big `sprout`-green **GO** wind-up key; the **currently-running block lit** with the bot mid-hop; minimal
text (one short line of framing). It looks *touchable* and *alive*, not like a form.
**FAIL if the frame looks like:** a code editor with a text field; a multiple-choice question; a wall of
instructions; tiny fiddly widgets; a spreadsheet; anything that reads as "a test."

### RF-C2 — "The aha" (immediate visual result / success)
*What the frame must contain:* the bot reaching the goal; the goal **blooming** (seed-battery lights, a warm
`beacon` chime, a few `<Sparkles>`); a **"★ solved in N blocks"** ribbon settling; the program strip still
showing exactly what the child built (cause↔effect legible). Joyful, brief, not a fireworks tax.
*FAIL:* a bare "Correct!" banner; a modal that hides the world; a score/XP pop; a "next" button that erases
what they made.

### RF-C3 — "The Tinker Studio" (open sandbox / compose)
*What the frame must contain:* a blank-ish world + the **full block palette** + a "name your creation" field
(icon-first); the child setting *their own* goal ("make Pip draw a star"); a **Save**/**Share** affordance;
the sense of a toy, not a task.
*FAIL:* the sandbox is just an empty level with a hidden "right answer"; no way to save/name/share; it feels
like more homework.

## B3. The mechanic — block/visual programming + immediate visual results

**The substrate (one extensible engine, many lessons — this is what makes it buildable *and* deep).**

- **The world panel** — a small grid diorama (2D top-down or light 2.5D canvas) with an **agent** (Pip, the
  wind-up bot), a **goal** (a seed-battery / lightbulb-flower that blooms), **walls/gates/keys/switches**,
  and later **sensors** and **collectibles**. Rendered on a light `<canvas>` (or SVG) — **not** the heavy
  3D room; runs on any Chromebook.
- **The program surface** — big **command blocks** you snap into a sequence (a rail) or a small 2D canvas.
  **Icon-first**, color-coded by type, tactile (snap with a click + bounce; never a text field). Blocks:
  `Step`, `Turn L/R`, `Repeat N {…}`, `If <sensor> {…} else {…}`, `Grab`, `Use`, `Set <var>`, `Change <var>`,
  `Define <name> {…}` / call, `When <event> {…}`.
- **Run** — the big `sprout` **GO** key. On press, blocks **highlight one at a time** as the agent executes
  them; **one grid cell per `Step` with a hop**, a spin per `Turn`. The **currently-running block lights up**
  so cause↔effect is unmistakable.
- **Immediate visual result — the "aha" is *prediction confirmed*.** "If I drop a `Turn` *here*…" → GO → Pip
  does exactly that → the goal blooms. Each cycle is **seconds** long and **fully visible**.
- **Safe failure (never punished).** Pip bumps a wall (soft *boing*, rubs its head — **no buzzer, no red
  WRONG**) or stops short. A faint **ghost trail** shows where it went vs. the goal; the **block where it
  went wrong softly pulses**; the program is left **exactly as built** — inviting a one-block edit, not a
  restart. (Productive failure, Kapur; the debug arc is *designed in*.)

## B4. The concept ladder — real CS learned by doing

A Brilliant-style **course = a short sequence of interactive lessons**; each lesson teaches **one concept**
by making it the *only way to win*, then lets the child feel it. The board forces the concept; the child
*discovers* the block (progressive disclosure — a new block shimmers into the palette exactly when the old
toolkit becomes insufficient). No lesson is gated by text.

| Course | Concept (real CS) | The board forces… | Block introduced | Signature work-mode |
|---|---|---|---|---|
| **1. Ways to Move** | **Sequence** — order matters | three cells in a line, then a corner | `Step`, `Turn`, `GO` | build |
| **2. Oops!** | **Debugging** — read a trace, find the one wrong step | a *pre-built broken* program that just misses | (uses existing) | **debug** |
| **3. Again & Again** | **Loops / iteration** — a tighter way | a long straight; slots "run out" | `Repeat N {…}` | build · investigate |
| **4. It Depends** | **Conditionals / branching** — sense & react | a fork; a locked gate needing a key | `If <sensor> {…} else {…}`, `Grab`/`Use` | build · investigate |
| **5. Remember** | **Variables / state** — count & recall | collect 3 seeds; a counter door | `Set`/`Change <var>` | build · debug |
| **6. Name It** | **Functions / abstraction** — name & reuse | repeat the *same* dance in 3 places | `Define <name> {…}` + call | compose · build |
| **7. When…** | **Events** — the world reacts | a switch that opens a far gate | `When <event> {…}` | build · investigate |
| **8. Make Your Own** | **Decomposition / composition** — your idea, your pieces | *nothing* — a blank goal | (all) | **compose** |

Two supporting **explorable widgets** (Brilliant-style, for concepts the bot-world teaches less crisply),
sharing the block palette + palette lock:
- **The Loop Machine** — drag a `Repeat` around blocks and *watch the sequence physically fold up*; scrub
  N and see the output grow. (Iteration made visible.)
- **The Logic Bench** — snap `If`/sensor tiles and flip switches to see a gate open/close in real time.
  (Boolean logic by direct manipulation.)

## B5. Lesson architecture — a lesson is a manipulable explanation

Each lesson is a tiny **explorable explanation**, not a slide:

1. **Invitation (≤1 short line + the live thing).** "Get Pip to the light." The world is already there,
   already touchable. No wall of rules.
2. **Do.** The child arranges blocks and presses GO. The concept is discovered by trying (World 1-1; the
   corner *proves* you need `Turn`).
3. **Feel the result.** Immediate, visible, delightful; success blooms; failure shows a ghost trail + the
   offending block — *invite a one-block fix*.
4. **A twist (optional stretch).** "Now do it in fewer blocks" / "now with a wall here" — a `CHOSEN_CHALLENGE`
   the child opts into, never forced.
5. **Keep it.** The solved program + trace + block-count is saved as a **real artifact** (§B7) and appears on
   the Shelf back in the room.

**Dosage & the disconnect right (Animal Crossing; IDC 2026).** Lessons are short; a course reaches a natural
**"good place to stop — the bench will be here"** endpoint; **guilt-free pause, no streak debt, definitive
exit.** The come-back loop lives *around* the app (the Shelf glow in the room), **never inside it**.

## B6. The four work-modes → content-app surfaces (the signal columns)

The v1 mapping is kept and made concrete per surface. `WorkMode` is the frozen nine-verb enum; Code uses
four (three shared to light cross-domain columns; `investigate` is Code's signature analytical column).

| Interaction (what the child does) | Surface | Canonical `WorkMode` | Shared with |
|---|---|---|---|
| **make / build** — assemble a program to reach a goal | Courses 1,3,4,5,7 | **`build`** | Music (make), Art (make) → strong shared column |
| **fix / debug** — correct a failed/broken run | Course 2 + any fail→fix | **`debug`** | Music (fix) → shared column |
| **solve / plan** — read/trace/predict *before* running; the Loop Machine / Logic Bench; "Peek/Trace" | Peek/Trace + explorable widgets | **`investigate`** | Code's signature column |
| **tinker / create** — free-play, author your own program/level/creature | Course 8 · Tinker Studio | **`compose`** | Art (compose), Music (compose) → shared column |

## B7. Artifacts (real, kept) + the Shelf seam

Every success produces a **real, kept artifact**, not a checkmark (passion research: grade the process /
keep the making; Evidence-Graph-friendly):

- **Solved lesson** = the child's **block program + run trace + block-count**, saved and shown as a **ribbon
  on the Shelf** ("★ solved in N blocks"). A tighter re-solve updates it (and is an `UNREQUIRED_REVISION`
  signal).
- **Tinker creation** = a **named, replayable program** ("Pip's Dance", "my star maze") saved as a `.bot`
  artifact; optionally **published** as a level for others to solve (audience) or built **with a friend**
  (group → carries a `SoloProof`).

**Persistence** per `learnerRef` via the core artifact store (`RoomProps.artifacts` / the engine's
`acceptArtifactSignal`; group → `promoteTeamArtifact` + `SoloProof`). **The Shelf is the seam's diegetic
memory:** kept/unfinished artifacts light the room's Shelf and the 2D building's `shelf-glow` on a later
visit — a single, gentle, opt-in return cue.

## B8. Content-app hard floors + banned outcomes

**Hard floors (Brilliant-quality, 2D):**

| Dimension | Floor |
|---|---|
| Text per lesson before the first interaction | **≤ 1 short line**; the live thing is on screen first |
| Primary action | exactly **1** obvious `GO` (nameable from the screenshot alone) |
| Blocks are tactile | snap + bounce (`resolveMotion` `pick`/`markerPop`); **never** a text field |
| Running feedback | the executing block **lights**; agent moves **one visible step at a time** |
| Failure | ghost trail + offending block pulse; **no buzzer, no red WRONG**; program preserved |
| Accepted solutions | **many** (any program that reaches the goal solves it; tighter is optional) |
| Concepts taught by doing | **≥ 6** of §B4's ladder shipped (sequence→functions) |
| Immediate result latency | run animation starts **< 150ms** after GO |
| Runs on | **every** Chromebook (no WebGL required for the content app) |

**Banned outcomes — instant fail (content app):**
- Any **multiple-choice quiz** / "what does this print?" / **"type this exact code"** / syntax typing.
- A **wall of instructions** or a tutorial modal before the child can touch anything.
- A **form-field feel**; tiny fiddly widgets; a code-editor look.
- **Chocolate-covered broccoli:** a generic drill wrapped in a coding theme where the theme is cosmetic.
- **One right answer only** (kills autonomy); punishing failure (buzzer / red WRONG / lives).
- **Streaks / points / XP / leaderboards / FOMO / a fixed label** ("you are a coder").
- A **dead GO** button; a "next" that erases the child's work; a result the child can't *see* happen.
- Text-heavy explanation *instead of* manipulation (the explorable-explanation violation).

## B9. Content-app accessibility — keyboard/SR block programming (first-class)

The content app is **2D-and-keyboard-first by construction**, so it *is* the deep-learning accessibility
floor (no 3D dependency). It preserves **the act of building logic**, not a to-do list:

- **Program = a real `<ol>`**; each slot an `<li>` (`role="listitem"`). Build by keyboard: focus a slot →
  choose a block from the **palette toolbar** (buttons) with Enter; **arrow keys reorder**; Delete removes;
  nested blocks (`Repeat`/`If`/`Define`) are nested lists. This is *genuine* block programming.
- **World = a described grid** (labeled table). SR reads state: *"Pip at B2 facing north; goal at D4; wall
  at C2; 1 seed at C4."* On GO, **each executed step is announced**: *"Step: Pip → B3", "Turn Left: faces
  west", "Bump: wall ahead — Pip waits."* The consequence is **watchable aurally**.
- **Failure announced non-punitively:** *"Pip stopped one short; step 3 sent it into a wall,"* and the
  offending `<li>` is flagged → the debug act is fully keyboard/SR operable.
- **Peek/Trace, Tinker Studio, Publish, Hint** all mirrored; the child still **chooses what to make and
  revisit**. Reduced-motion → instant step framing (agent "jumps" cell-to-cell with announced positions).
- **Parity by construction:** identical `probeId` / `workMode` / `kind` / `returnState` per `plainZoneEquals`
  / `plainViewEquals`; the keyboard path **emits the same `ActivityEvent`s** (Part C). Accessible Games
  Initiative / MS tags: move focus one item at a time (never steer a cursor); narrate name/role/state;
  WCAG 2.2 AA; color-independent.

## B10. Content-app self-score rubric + delta loop

Rows (`10/7/4/2` vs RF-C1/C2/C3): **"is it obviously hands-on (not a quiz) in <1s" · block tactility &
game-feel · immediate-result clarity (cause↔effect) · the aha (success delight) · warmth & whitespace
(Brilliant-quality) · failure feels safe & invites a fix · a real concept is *discovered by doing* · the
Tinker Studio feels like a toy · keyboard/SR parity · Chromebook smoothness.** Same delta loop: render →
side-by-side vs the reference lesson → `DELTA.md` top-10 → fix top-3 → re-render.

---

# PART C — THE SEAM (world ↔ app · signal · accessibility)

## C1. How the world opens the content app

**Handoff.** Activating `go-bench` in the 3D room (pointer/tap, keyboard Enter, or the world `ActivityDOM`
button) calls `openBench()`:
- The **shared persistent `<Canvas>` stays mounted** (canvas-persistence invariant); the room simply pauses
  its `frameloop="demand"`.
- The content app mounts as a **DOM + light-canvas surface layered over (or routed in place of) the room
  view** — e.g. app route `/#/zone/code/bench` or an in-shell overlay owned by the zone. It is **not** a new
  WebGL context (the content app's world panel is a 2D `<canvas>`/SVG).
- A short diegetic transition ("the blueprint unrolls") covers the swap; a clear **"← back to the workshop"**
  exit returns to the room (canvas resumes), landing the eye on the **Shelf** (now showing any new artifact).

**Why an embedded module, not a separate app:** it shares the `learnerRef`, the `emit` channel, the palette,
the artifact store, and the return cue (the Shelf) — so the *signal is unified* and the child feels one
place, two depths.

## C2. Signal capture across both layers (the two-level signal)

Both layers emit the **same** frozen `ActivityEvent` through the **same** `RoomProps.emit` → the core
`buildReturnGrid` → the `{domain:"computation", workMode}` grid. The novelty gate + prompted/voluntary split
live in the core; the zone never fabricates return events.

**Layer 1 — the Discovery World (topic-axis pull: "did they come back to *computation* at all?").**
- Entering the building / dwelling in the room / opening the bench on **first visit** = `kind:"explore"`
  (novelty; `dayOffset 0`) — **kept `EMERGING`, never confirms** (novelty guard).
- Returning to the Code Lab **unprompted at `dayOffset ≥ 7`** = the building revisit — the coarse
  voluntary-return signal (row-ish).
- Returning only after a reminder/nudge = `intervention` present → `promptedReturns` (tagged, excluded).

**Layer 2 — the Content App (work-mode-axis resolution: "*what kind of doing* did they come back to?").**
- Each deep action emits its `workMode` + `kind` (§C3), so returns resolve **per (domain, work-mode) cell** —
  this is what disambiguates a *topic* spike (stays in computation across build/debug/investigate) from a
  *work-mode* spike (composes in code **and** music **and** art). A child who keeps reopening the **Tinker
  Studio** across days lights the `compose` column; one who keeps reopening **debug** lessons lights `debug`.

**The crux:** the world layer tells you *they keep coming back to computation*; the content app tells you
*to which work-mode*. Together they place marks in the exact grid cells the hypothesis reads. **Deep
absorption is the target signal** (passion research): the child who loses track of time in the Tinker Studio
and doesn't want to stop is the highest-value read — surfaced as sustained content-app engagement +
voluntary return, **never** engineered by pressure and **never** gamified.

## C3. Action → `workMode` → `kind` → `EventType` (the full mapping)

Zones emit `ActivityEvent` (`kind`); the core `toEngagementEvents` bridges `kind` → the six `EventType`
families. (This replaces v1 §7's direct-`EngagementEvent` emit with the frozen contract.)

| # | Child action | Layer | Probe → `workMode` (column) | `ActivityEvent.kind` | Bridged `EventType` / why |
|---|---|---|---|---|---|
| 1 | Approach/dwell in the room; open the bench (1st time) | World | `code.path` → build | `explore` | novelty — *no family event* (kept `EMERGING`) |
| 2 | Snap a block into the program | App | `code.path` → **build** | *(accrues)* | building the program = the *make* act |
| 3 | Press GO → agent reaches the goal (solved) | App | `code.path` → **build** | `artifact` | `ARTIFACT_COMPETENCE` — working artifact |
| 4 | After a failed run, edit a block & re-run to success | App | `code.debug` → **debug** | `recover` | `FAILURE_RECOVERY` — the debug arc |
| 5 | Open **Peek/Trace** / predict-then-run / a Logic-Bench read | App | `code.plan` → **investigate** | `artifact` (on a **verified** prediction) | `ARTIFACT_COMPETENCE` — the analytical act |
| 6 | Choose a **stretch** twist (fewer blocks / harder board / loops-required) | App | (that probe's) column | `challenge` | `CHOSEN_CHALLENGE` |
| 7 | Re-solve a solved lesson in **fewer blocks**, unprompted | App | `code.path` → **build** | `revise` | `UNREQUIRED_REVISION` |
| 8 | Enter **Tinker Studio** and set your own goal | App | `code.tinker` → **compose** | `author-scope` | `SELF_AUTHORED_SCOPE` |
| 9 | Save a Tinker creation (runnable `.bot`) | App | `code.tinker` → **compose** | `artifact` | `ARTIFACT_COMPETENCE` |
| 10 | **Publish** a creation / a level (audience) | App | `code.tinker.share` → **compose** | `artifact` (+`author-scope`) | shipped for an audience |
| 11 | Build a level **with a friend** (co-op) | App | `code.tinker.share` (group) → **compose** | `artifact` (+`SoloProof`) | team → solo-proof |
| 12 | Tap **Hint / "show me one block"** | App | (current probe) | `assist` | `ASSISTIVE` — **never lowers a signal** |
| 13 | Return to the Code Lab / a lesson days later, **unprompted** | World+App | zone/cell-level | `return` (`dayOffset≥7`, no `intervention`) | `VOLUNTARY_RETURN` — **the actual passion signal** |
| 14 | Return only after a reminder/nudge | World+App | zone/cell-level | `return` (+`intervention`) | `PROMPTED_RETURN` — recessed, ≠ signal |

**Novelty guard (non-negotiable):** first-session actions are `explore` (novelty) → keep the hypothesis
`EMERGING` and schedule a delayed return check; only the later, unprompted `return` (row 13) counts.
`assist` never raises or lowers signal. Promotion to a candidate spine needs ≥3 families including a
**delayed voluntary return** *and* an **artifact/competence** signal — i.e., *came back **and** made
something*, not novelty clicks.

## C4. Binding to the core — `ZonePlugin`, `RoomProps`, emit

```ts
// passion/packages/interest-zone-code/src/plugin.ts
import type { ZonePlugin, RoomProps } from "@gt100k/interest-zone-kit";
import type { ActivityEvent, Probe } from "@gt100k/interest-lab";

export const codeProbes: readonly Probe[] = [/* §B6 catalog, domain:"computation" (v1 §6, kept) */];

export const codeZone: ZonePlugin = {
  id: "code",
  domain: "computation",                 // grid row; hue via resolveDomainHue()
  mapBuilding: {                         // 2D Curiosity-Map building (§A2)
    label: "Code Lab",
    glyph: "gear-sprout",
    enterVerb: "Step inside",
    cell: { col: /* island slot */ 1, row: 0 },
    art: { sprite: "workshop" /*, hue derived */ },
  },
  Room3D: CodeRoom3D,                    // the cozy workshop diorama (Part A) — the DOORWAY
  ActivityDOM: CodeWorldActivityDOM,     // described-room a11y peer (§A8)
  probes: codeProbes,
};
```

The **content app** is a zone-owned module (`src/bench/…`) the room opens via the seam; it receives the same
`RoomProps` (`learnerRef`, `emit`, `artifacts`, `reducedMotion`, `dayOffset`, `plainMode`, `seed`) so both
layers share one `emit` channel and one artifact store. **Emit helper (frozen `ActivityEvent`):**

```ts
function mk(probe: Probe, kind: ActivityEvent["kind"], dayOffset: number): ActivityEvent {
  return { zoneId: "code", probeId: probe.id, domain: "computation",
           workMode: probe.workMode, action: `${probe.id}:${kind}`, kind, dayOffset };
}
const onSolved      = (p, d) => emit(mk(p, "artifact",      d)); // build column
const onFixedAfterFail = (p, d) => emit(mk(p, "recover",    d)); // debug column
const onVerifiedPlan   = (p, d) => emit(mk(p, "artifact",   d)); // investigate column
const onTinkerGoalSet  = (p, d) => emit(mk(p, "author-scope", d)); // compose column
const onHint        = (p, d) => emit({ ...mk(p, "assist", d), assistive: true });
```

Artifacts route through `RoomProps.artifacts` / `acceptArtifactSignal`; group creations through
`promoteTeamArtifact` with a `SoloProof` (else `TeamArtifactProofRequiredError`). **Return events are set by
the core map on revisit** (voluntary vs prompted) — the zone does not fabricate them.

## C5. `window.__qa` hooks across both layers (dead-primary-action proof)

Both layers must be provably alive to the upgraded gate (P0/P3a/P3b of the QA-harness research).

```ts
window.__qa = {
  ready, error, settle(frames = 2),
  scene,                                        // r3f state.scene (the room)
  primaryActionAlive: () => boolean,            // go-bench opens the bench && GO runs a program
  interactives: () => [
    { id: "go-bench", kind: "button", worldPos: [...] }, // the ONE room 3D interactive → opens app
    { id: "shelf",    kind: "target", worldPos: [...] }, // return cue
    // content-app: block palette, GO, tinker actions are DOM (covered by the DOM click-assert law)
  ],
  stateHash,        // room: {bench-open, shelf-count} · app: {program blocks, agent pose, solved}
};
```

**Gate round-trips (hard-fail if dead):** (1) project `go-bench` → dispatch a real pointer event → assert
`stateHash()` changed (bench opened) — the exact prior failure this prevents; (2) in the app, click `GO`
with a valid program → assert the agent pose / `solved` flag changed. A dead primary action at **either**
layer is an instant fail.

## C6. Accessibility seam (parity across world + app)

- The **world** `ActivityDOM` (§A8) and the **content app** keyboard/SR path (§B9) both expose the **same
  seam action** ("Step up to the Build Bench" → opens the bench) and both **emit the same `ActivityEvent`s**.
- `plainZoneEquals(domActions, model)` holds for the world layer; `plainViewEquals` parity holds for the
  content app's block actions. Reduced-motion honored in both. No child is routed to a lesser experience:
  the **full deep learning is 2D/keyboard-first**, so the a11y path reaches *the same concepts and the same
  artifacts* as the sighted 3D path.

---

# PART D — VERIFICATION & ACCEPTANCE

## D1. The verification battery (scripted, both layers)

Run at every phase close (mirrors LAAS §7 + the QA-harness gate):
1. **Reference-delta loop** — side-by-sides for RF-W1/W2/W3 (room) and RF-C1/C2/C3 (app); `DELTA.md`
   top-10; fix top-3; re-shoot.
2. **No-black-shadows test** (room) — sample shadowed wood/brass pixels; **0** desaturated-gray.
3. **Dressing-density test** (room) — count occupants in the hero framing ≥ 40; every surface class occupied.
4. **One-verb test** (room) — VLM rubric: "is there exactly one obvious primary action, nameable from the
   frame?" → the bench.
5. **Not-a-quiz test** (app) — VLM rubric: "in <1s, does this look hands-on (manipulable), not a test?"
6. **Dead-primary-action round-trip** — `go-bench` opens the bench; `GO` runs a program; both change
   `stateHash()` (hard fail if dead).
7. **Perf** — `< 50` draw calls at `room-3d`; clean degrade to lite → world `ActivityDOM`; content app smooth
   on a real Chromebook.
8. **Parity** — `plainZoneEquals` (world) + `plainViewEquals` (app); full keyboard/SR walk of the block
   editor; each path emits the correct `ActivityEvent`.
9. **Signal correctness** — seeded end-to-end: `explore` keeps `EMERGING`; solved → `ARTIFACT_COMPETENCE`;
   fail→fix → `FAILURE_RECOVERY`; stretch → `CHOSEN_CHALLENGE`; tinker goal → `SELF_AUTHORED_SCOPE`; hint =
   `ASSISTIVE` (lowers nothing); `dayOffset≥7` no-intervention → `VOLUNTARY_RETURN`.
10. **Reduced-motion** — instant framing in both layers; no essential motion.

## D2. Banned outcomes — consolidated (instant fail)

Room: §A9. Content app: §B8. Cross-cutting: **decorative 3D over a hidden menu · a dead primary action ·
gamifying the return signal · a fixed label · reading novelty as interest · the a11y path as a lesser menu ·
collapsing topic and work-mode into a per-zone read.**

## D3. Gated phase plan (each phase ends green: build · delta loop · fix top-3)

| Phase | Deliverable | Gate |
|---|---|---|
| **0** | Scaffold zone pkg; wire `window.__qa`; assemble `/reference` (RF-W* + RF-C*) into the side-by-side tool | harness produces comparisons |
| **1** | Content-app substrate: world panel + block editor + GO + immediate result + safe failure (Courses 1–2) | RF-C1/C2 delta; not-a-quiz test; GO round-trip |
| **2** | Content-app concept ladder Courses 3–7 + Peek/Trace + Loop Machine / Logic Bench | ≥6 concepts by doing; investigate emits |
| **3** | Tinker Studio (Course 8) + artifacts + Save/Publish/co-op | RF-C3 delta; compose/author-scope/SoloProof |
| **4** | Content-app a11y: keyboard/SR block editor + described world + parity | full SR walk; `plainViewEquals` |
| **5** | 3D room shell + lighting + palette + one shading model + HDRI + shadows (RF-W1) | no-black-shadows; palette cohesion |
| **6** | Room dressing to the floor (≥40 occupants, ≥3/ surface class) + motion (≥4) + the bench (RF-W2) | dressing-density; one-verb; motion |
| **7** | The seam (openBench/exit, canvas persistence, Shelf), world `ActivityDOM`, 2D building (RF-W3) | seam round-trip; `plainZoneEquals` |
| **8** | Perf pass + tiers/degrade + full battery + final delta loop | §D1 all green; §D5 |

## D4. Zone acceptance (land green)

(1) All probes registered, `domain:"computation"`, four distinct work-modes (build/debug/investigate/
compose). (2) Content app teaches **≥6** concepts **by doing** (no quiz, no typing), with immediate visual
results and safe failure. (3) Seeded end-to-end signal per §D1.9. (4) Both a11y paths pass parity + full
keyboard/SR walk and emit identical `ActivityEvent`s; the deep learning is reachable with **zero 3D**. (5)
Room `< 50` draw calls at `room-3d`, clean degrade; **≥40** occupants; no-black-shadows; one obvious verb.
(6) `window.__qa` present; `go-bench` and `GO` round-trips change `stateHash()`. (7) Reduced-motion instant.
(8) Register the plugin (the single shared-root merge point) and run the upgraded QA gate.

## D5. Final acceptance — the two-frame + one-flow test (LAAS-style)

Produce **two frames** and **one flow**, each beside its reference:
- **Frame 1 (world):** the RF-W1 sunlit maker's nook — if a viewer's eye doesn't snag within one second on
  a *category* error (bare surfaces, gray shadows, cloned props, no obvious verb), the room has done its job.
- **Frame 2 (app):** the RF-C1 Brilliant-style lesson mid-manipulation — if in one second it reads as a
  *hands-on thing you touch* (not a quiz/editor), the app has done its job.
- **Flow (the seam):** enter the building → walk to the glowing bench → open the Build Bench → arrange
  blocks → GO → the goal blooms → back to the workshop → the new creation is on the Shelf. If a child can
  do this with **no tutorial text**, discovers a real concept **by doing**, and the run emits the right
  `{domain:"computation", workMode}` events, the zone is done. Until then, iterate the delta loop.

---

## Appendix — anti-patterns explicitly designed out (v2)

| Anti-pattern | How v2 avoids it |
|---|---|
| **Decorative 3D over a hidden menu** | The room's `go-bench` is a live 3D interactive in `__qa.interactives()` and opens a *real* deep app; the room is never `aria-hidden`-only. |
| **Quiz behind a pretty door** | The content app has **no quiz** — the mechanic (arrange logic → run → watch → fix) *is* the learning; many solutions accepted. |
| **"Type this exact code"** | Zero typing/syntax; big tactile icon-blocks; keyboard path is genuine block programming. |
| **Chocolate-covered broccoli** | Intrinsic integration + explorable explanations: the concept is the *only way to win* and the result is immediate. |
| **The room as the whole activity (v1)** | Split: the room is the *doorway*; the deep learning is the Brilliant-style app opened from it. |
| **3D that subtracts legibility** | Cozy fixed camera, one obvious verb; the deep learning is 2D-first and runs everywhere; lite/DOM are genuine equals. |
| **Gamifying the return signal** | No streaks/points/XP/FOMO; `welcome-back` is warmth only; guilt-free "done for today"; Shelf glow is opt-in. |
| **A fixed label** | Emits separated families via the frozen bridge; never "you are a coder." |
| **Novelty mistaken for interest** | First-session = `explore` (novelty), keeps `EMERGING`; only delayed unprompted `return` counts. |
| **Topic/work-mode collapse** | Two-level signal: the world says *came back to computation*; the app says *to which work-mode* — read per (domain × work-mode) cell. |
| **A11y path as a lesser menu** | The 2D/keyboard content app is the *full* deep learning; parity by construction; same artifacts. |
