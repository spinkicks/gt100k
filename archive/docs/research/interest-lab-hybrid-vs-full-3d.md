# Interest Lab: hybrid (2D overworld + 3D zone-rooms) vs one full-3D open world

**Status:** research memo · 2026-07-21 · owner: research (for `003-interest-lab` / PassionLab "Discover").
**Question:** Honestly evaluate a **hybrid** — a 2D retro/top-down **overworld map** for navigating between
**discovery zones** (music studio, coding lab, art gallery…), where entering a zone drops the student into a
small **bounded 3D room** for a hands-on activity — against a **single full-3D open world**. Cover
(1) precedents, (2) the real React/Next + react-three-fiber engineering cost of two render modes vs one open
world (is hybrid *less* work / lower risk for legibility + Chromebook perf?), (3) how each maps to our model
(zone = domain, enter = start a probe, room = a hands-on activity, "which places you wander back to" = the
return signal, plus the accessible non-spatial equivalent), and (4) transition/UX patterns (map ↔ room) that
stay legible for ages 8–14. Stack: Next.js 14 / React 18 / react-three-fiber; must run on school Chromebooks.

**Where this lands in what already exists.** The current build is effectively *neither* pole cleanly: the child
surface is a **single-`<Canvas>` "world of floating interest islands"** (r3f + drei) with glowing quest-markers,
and a **`board-2d`** card-constellation is defined as the *fallback* tier (reduced-motion / plain / no-WebGL /
weak-device) plus the accessible operable surface — three tiers (`quest-world-3d → quest-world-3d-lite →
board-2d`) driven by one **pure, GPU-free view package** that emits scene *numbers*, with `plainViewEquals`
guaranteeing the DOM ledger mirrors the world 1:1 ([plan.md](../../specs/003-interest-lab/plan.md),
[UI contract](../../specs/003-interest-lab/contracts/interest-lab-ui.md)). So today's design is closest to
**"single 3D world, 2D as a downgrade."** This memo evaluates whether to instead **promote 2D to the primary
navigation layer and spend 3D only inside bounded rooms** — and argues that is the smarter move. It builds on
the [exploration-world precedents memo](./interest-lab-world-precedents.md), the
[3D-world-generators memo](./interestLab-3dWorldGenerators.md), and the
[passion brainlift](./passionBrainlift.md) (*interest is built not found; trust what a child returns to; never a
fixed label; don't gamify the return signal*).

---

## 0. TL;DR verdict

**Yes — hybrid is the smarter choice, but only in one specific shape:**

1. **The 2D overworld is the existing DOM board/ledger promoted from "fallback" to the *primary* navigation
   surface** — a top-down map of zone tiles. It uses **no WebGL**, is already the accessibility source of truth
   and the return-signal surface, is the cheapest thing a Chromebook can draw, and is the most legible
   wayfinding medium for 8–14.
2. **3D is spent only inside one bounded room at a time**, rendered in a **single persistent `<Canvas>` whose
   *contents* swap** on zone-enter/exit — **never** a Canvas mounted/unmounted per room.

In that shape, hybrid is **less total engineering and lower risk** than a full-3D open world, because a full-3D
open world **still needs a 2D fallback anyway** (for Chromebook perf and accessibility), so it is "open-world
navigation problems **plus** a mandatory 2D tier" — strictly more surfaces. Hybrid makes the 2D map do triple
duty (navigation + accessibility + signal) and confines the expensive, legibility-risky medium (WebGL) to the
exact place the *intrinsic* hands-on interaction lives (the probe).

**One-line rationale:** spend the costly, legibility-risky medium only where the doing happens (the room); use
the cheap, already-accessible, maximally legible medium for wayfinding and for reading "what you wander back
to." **The single biggest implementation trap to avoid is remounting a Canvas on every room transition.**

Hybrid is *not* less work if you implement it naïvely (a Canvas per room, or two heavy 3D modes). The verdict is
conditional on the architecture in §5.

---

## 1. Precedents — 2D map → 3D room / hub → instanced rooms

### 1.1 The closest analogue: Mario Party's board → bounded minigame
A board you move around on (low-stakes meta-navigation) that repeatedly drops you into short, **self-contained**
3D minigames, then returns you to the board. The party-game engineering pattern is exactly our shape: a
**persistent orchestrator** frees the current scene and loads the next lightweight scene, keeps **minigame
assets small**, and uses **threaded background loading to prevent hitches** on the hub→game transition; global
state (scores, whose turn) lives in an **autoload/`GameInstance` that survives scene swaps**
([Godot party-game blueprint](https://github.com/thedivergentai/gd-agentic-skills/blob/main/skills/godot-genre-party/SKILL.md),
[Ultimate Party Game Template](https://github.com/Kris-DevBuddy/Ultimate-Party-Game-Template)). **What works:**
each minigame has *one clear verb* and a bounded budget, so it always performs and always reads clearly. **What
fails:** if the transition hitches or the meta-layer is just a spinner, the loop feels janky — hence the
"lightweight assets + preload" rule.

### 1.2 Hub worlds as "immersive menus" (Super Mario 64, Spyro, Hades)
The design-analysis consensus: a hub world is, reductively, a **"fancy menu"** — an **anchor** that earns its
cost only when it adds **tutorialization, style, exploration, or secrets**; otherwise it is overhead around a
level-select ([Design Doc, "What Makes a Great Hub World?"](https://www.youtube.com/watch?v=hHguwARMcY8)). The
standard implementation keeps progression/state in a persistent **GameInstance** across level loads
([Unreal forum: SM64-style hub + progression](https://forums.unrealengine.com/t/how-to-create-a-hub-world-and-level-progression-like-super-mario-64/481389)).
**Lesson for us:** navigation between domains is *not* where the hands-on doing happens, so pouring a 3D/GPU
budget into flying between islands is spending the expensive medium on the "menu." A cheap, legible 2D map is
the honest form of that menu.

### 1.3 Duolingo: a 2D path gating bounded activities — legibility win, autonomy warning
Duolingo replaced a free-choice skill **tree** with a linear **path** because internal research showed
**"learners were not always sure how to navigate the tree"**; the stated goals were **"decreasing confusion and
increasing learning outcomes,"** and their whitepaper reports better proficiency outcomes on the path
([Duolingo blog](https://blog.duolingo.com/new-duolingo-home-screen-design/),
[von Ahn / NBC](https://www.nbcnews.com/tech/tech-news/duolingos-update-redesign-luis-von-ahn-interview-rcna44655),
[Duolingo path whitepaper (PDF)](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_language_read_listen_write_speak_2024.pdf)).
**But** the redesign drew a sustained backlash for **removing the freedom to revisit and choose** — users
petitioned for the tree back ([duoplanet review](https://duoplanet.com/duolingo-new-learning-path-review/),
[DesignRush, 2026](https://www.designrush.com/agency/mobile-app-design-development/app-design/trends/mobile-app-design-fails)).
**Double lesson:** a 2D map is the most legible wayfinding surface — *and* over-railing it destroys exactly the
signal we depend on. Our return signal **is** self-directed revisit, so the map must keep free choice of which
zone to enter and what to wander back to; it must not become a forced conveyor.

### 1.4 Gather.town: a browser-native 2D map that gates entry into richer embedded activities
A cheap **2D top-down map** where you walk up to an interactive object and **press `X`** to open a much richer
**embedded activity** (a whiteboard, an embedded website/iframe, a video), with **portal tiles** linking rooms
and **spawn tiles** placing you on entry
([interactive objects](https://support.help.gather.town/articles/5512361772-interactive-objects),
[embedded websites](https://support.gather.town/articles/1619815823-embedded-websites),
[mapmaker overview](https://support.gather.town/articles/9657827678-mapmaker-overview)). This is direct proof
that **"legible 2D map → drop into a heavier bounded activity"** is web-native, shippable, and cheap — the
activity's cost is paid only while you're *in* it.

### 1.5 The cautionary pole: full-3D learning worlds subtract legibility
The best-documented failure mode is a **full 3D multi-user world** for this exact age/task: Quest Atlantis
measured **low engagement blamed on "distractions in the 3D MUVE,"** language load, and a persistent **gap
between the designed and the enacted** experience — 3D *subtracted* clarity
([precedents memo §1.2](./interest-lab-world-precedents.md)). Set against the "world is the real interaction"
precedents (Google Arts explorables giving each space **one clear verb**; Mario **World 1-1** teaching through
affordances; **Dead Space's** failed fully-diegetic map proving you still need player-facing wayfinding), the
pattern is clear: reserve 3D for where manipulating the scene *is* the activity, and keep navigation legible
([precedents memo §1.3](./interest-lab-world-precedents.md)).

**Net of precedents:** every strong precedent for our task pairs a **cheap, legible meta-layer** (board / path /
2D map / hub-as-menu) with a **bounded, self-contained rich activity** — and the one big full-3D-world attempt
at our age band underperformed on legibility. That is the hybrid, not the open world.

---

## 2. The real engineering cost in React/Next + react-three-fiber

### 2.1 The WebGL facts that decide the architecture

- **You get ~8–16 WebGL contexts per page, they can't share resources, and the oldest is killed past the
  limit.** So **multiple simultaneous `<Canvas>` is out** for both options; textures/geometry/shaders would be
  duplicated per context
  ([three.js manual: multiple scenes](https://threejs.org/manual/en/multiple-scenes.html),
  [r3f discussion #2716](https://github.com/pmndrs/react-three-fiber/discussions/2716),
  [SO: allowing more WebGL contexts](https://stackoverflow.com/questions/59140439/allowing-more-webgl-contexts)).
- **Mounting/unmounting a `<Canvas>` is expensive and leak-prone; the fix is to persist one Canvas and swap its
  *contents* (routes *inside* the Canvas).** Browsers "treat it very conservatively," re-mounting risks memory
  leaks "out of your control," and the browser can **hold GPU bindings for up to a minute** after teardown; the
  maintainers' explicit guidance is *don't put the Canvas in your routes — put your routes in the Canvas*
  ([r3f issue #2655](https://github.com/pmndrs/react-three-fiber/issues/2655),
  [three.js forum: context lost on route change](https://discourse.threejs.org/t/context-lost-when-i-route-to-another-page-in-react-three-fiber/61736),
  [r3f issue #3093](https://github.com/pmndrs/react-three-fiber/issues/3093)). **This one fact is what makes or
  breaks the hybrid.**
- **If you ever need two 3D areas at once, use drei `<View>`** — one context, scissor-tested regions, shared
  resources ([r3f discussion #2716](https://github.com/pmndrs/react-three-fiber/discussions/2716),
  [three.js manual](https://threejs.org/manual/en/multiple-scenes.html)). (We don't, in the recommended shape —
  the map is DOM.)
- **Chromebook/iGPU reality:** integrated GPUs share memory bandwidth (UMA) and **throttle after ~5–10 min of
  sustained rendering**; the survival rules are **reduce draw calls (target <50 for mobile-class), KTX2 texture
  compression (4–6× less VRAM), cap DPR to ≤2, avoid PBR/real-time shadows/post-processing, and render
  on-demand** rather than a constant 60 Hz loop
  ([Three.js 60fps patterns, 2026](https://www.intelligentgraphicandcode.com/development/threejs-interfaces/performance),
  [Optimizing Three.js for the web](https://www.abratabia.com/threejs/performance.php),
  [iGPU rendering optimization](https://rapidmade.com/webgl-three-js-cad-rendering-optimization/)).
- **Use WebGL2, not WebGPU, as the baseline.** WebGL2 has ~98% support and WebGPU is **not universally faster —
  it can be ~2× slower CPU and 5–10× slower on first frame** for many-mesh scenes on lower-end hardware; ship
  WebGL2 (the current spec already targets it via Spark-class renderers)
  ([three.js forum: WebGPU slower, r183](https://discourse.threejs.org/t/webgpurenderer-2x-slower-cpu-and-5-10x-slower-first-frame-than-webglrenderer-on-many-mesh-scenes-r183-same-on-both-backends/91904),
  [WebGPU migration guide, 2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide),
  [3D-generators memo](./interestLab-3dWorldGenerators.md)).

### 2.2 Cost/risk comparison

| Dimension | **Hybrid** (2D DOM map + one persistent room Canvas) | **Single full-3D open world** |
|---|---|---|
| Distinct render paths to build | **2**, but one is ~free DOM/SVG you already have (the board/ledger) | 1 heavy 3D path **+ a mandatory 2D fallback anyway** (perf + a11y) ⇒ effectively 2, both non-trivial |
| Live WebGL contexts | **1** (or 0 while on the map) | 1 |
| Resident GPU asset budget | **One bounded room at a time** — easy to hold <50 draw calls, small textures | **All zones' assets must stream/LOD** to stay explorable — the exact iGPU throttle risk |
| Camera / navigation | Map = DOM focus/click (keyboard/switch trivial); room = fixed or rails | Free-fly/orbit camera that must also work by keyboard/switch/trackpad — hard to make accessible & legible |
| Wayfinding legibility (8–14) | **High** — top-down map, one verb per zone | **Risk** — 3D navigation "subtracts legibility" (Quest Atlantis; Dead Space diegetic-map failure) |
| Chromebook perf ceiling | **Bounded & predictable** per room; map is ~free | **Sustained-load throttling** across a large scene |
| Transition cost | **New surface** (map↔room) — the main added risk; mitigable (§4) | None between zones, but continuous LOD/stream management instead |
| Return-signal capture | **Directly observable** — revisits to a map tile; "places you wander back to" overlay is trivial in 2D | Must *infer* revisit from 3D position telemetry — noisier, less legible |
| Accessibility build | The **map already is** the AT-operable surface; only each **bounded activity** needs a DOM equivalent | Must make a **whole open world** screen-reader/switch operable, or ship the 2D tier anyway (Surveyor "railroading" risk at world scale) |
| Art direction | 2 looks, but **2D is far cheaper to make beautiful** than a full 3D world | One look, but it's the expensive one, everywhere |
| Fit to existing code | **1:1** — reuses the pure view package, tiers, `plainViewEquals`, `IslandView`/marker parity | Requires the whole world resident + free camera; the current single-world design leans this way and inherits its perf risk |

### 2.3 Where hybrid genuinely costs *more* (the honest column)

- **The map↔room transition is a real new surface and a potential perf cliff** (Canvas warm-up + first room
  asset load). This is the whole ballgame; mitigations in §4 (persist the Canvas, preload the small room set
  during the doorway animation, hide warm-up behind a short cover transition, render-on-demand).
- **Two aesthetics to art-direct.** Modest, and partly an asset (a stylized 2D map is cheap and legible); the
  design system already exists (`PALETTE`/`HUE_RAMP`/motion tokens).
- **Persistent world state across the boundary** (current zone, half-finished artifacts, return beacons) — this
  is the Mario Party **GameInstance/autoload** pattern; in React it's just a top-level store/context *above* the
  Canvas, and it's already implied by the shared-passion-state plan
  ([PASSION-LAB-PLAN.md](../PASSION-LAB-PLAN.md)).

### 2.4 Net answer to "is hybrid less work / lower risk?"

**Yes — conditionally.** Implemented as **DOM map + one persistent room Canvas**, hybrid removes the two hardest
parts of a Chromebook 3D app (holding a whole world resident, and an accessible free-fly camera) and reuses the
2D board you already have to build for a11y/perf. A full-3D open world does not save the second path — it
*forces* the 2D fallback on top of the open-world work. **No** if you build it naïvely (Canvas per room, or two
heavy 3D modes) — then you pay the WebGL-context/teardown tax and get the worst of both.

---

## 3. How each option maps to our model

The world is one *rendering* of a single interaction model; the accessible ledger is another — both express the
**same verbs**, and `plainViewEquals` / one-marker-per-card already guarantee parity
([precedents memo §2](./interest-lab-world-precedents.md),
[UI contract](../../specs/003-interest-lab/contracts/interest-lab-ui.md)).

| Our construct | Hybrid representation | Full-3D-world representation | Existing type/field |
|---|---|---|---|
| **Zone = interest domain** | a **tile on the 2D map** (topic axis) | a **floating island** you fly to | `IslandView` (domain), coverage-matrix **rows** |
| **Enter a zone = start a probe** | **mount the bounded room** for that (domain × work-mode) | approach a marker, camera focuses | `Probe`(`domain`,`workMode`), `QuestMarkerView`/`ProbeCardView` |
| **The room = a hands-on activity** | a **small bounded 3D scene** where the mechanic *is* the probe | an in-world activity at the marker | intrinsic integration (Habgood/Ainsworth) — [precedents §1.3](./interest-lab-world-precedents.md) |
| **Work-mode = kind of doing** | tagged by the room's activity (build/debug/compose…) | same | `WorkMode` (9 verbs), coverage-matrix **columns** |
| **"Which places you wander back to" = return signal** | **revisits to a map tile** @7d/@30d — *directly logged*, "places you keep coming back to" overlay is trivial | *inferred* from 3D position telemetry | `returnState:"voluntary-return"`, `voluntary_return` family, horizons 7/30 |
| **First-visit sparkle = novelty (must decay)** | new-tile shimmer that fades | new-island sparkle | novelty-spike gate keeps state `EMERGING` |
| **Accessible non-spatial equivalent** | the map **already is** the DOM AT surface; each room needs a bounded DOM activity-equivalent | must equal a *whole* navigable world (harder) | `board-2d` tier, quest ledger, `plainViewEquals` |

**Three things the hybrid does *better* for our specific model:**

1. **The return signal is captured more legibly.** "Which zones you drift back to, unprompted, after novelty
   fades" is a first-class, directly observable event on a 2D map (a tile revisit) rather than something inferred
   from where a camera drifted in a 3D world. This is the central signal
   ([passion brainlift SPOV 2/3](./passionBrainlift.md)) and it wants the legible medium.
2. **Topic vs work-mode stays readable.** The map is the **domain axis**; rooms tag the **work-mode**; the
   signal is still read **per (domain × work-mode) cell**, so the child whose real spike is a *work-mode across
   zones* still separates from the child loyal to one *domain* — the crux from
   [precedents memo §2](./interest-lab-world-precedents.md).
3. **Accessibility shrinks to a bounded problem.** You make **one activity at a time** DOM-operable, not an
   entire open world — avoiding the "reduce the world to a flat list and rob players of discovering" railroading
   failure at world scale (Surveyor; [precedents §1.5](./interest-lab-world-precedents.md)), while keeping the
   map's free choice of what to explore/revisit.

**Guardrails carry over unchanged:** no scalar passion score / rank / price in either medium; help never lowers
a signal; prompted return is recorded but never celebrated; no streak/FOMO on re-engagement; never a fixed label
([plan.md Constitution Check](../../specs/003-interest-lab/plan.md),
[precedents memo §3](./interest-lab-world-precedents.md)).

---

## 4. Transition / UX patterns (map ↔ room) legible for ages 8–14

- **Doorway/portal metaphor with spatial continuity.** Entering a zone should read as *going through a door*
  into that zone, and the zone's **color + emblem carries from the map tile into the room** so the child never
  loses "where am I / how do I get back." Gather.town's walk-up-and-enter and portal/spawn tiles are the proven
  web-native version ([Gather.town](https://support.help.gather.town/articles/5512361772-interactive-objects));
  the map's job is wayfinding, so keep an obvious **"you are here"** and a persistent **back-to-map** exit.
- **Persist one Canvas; preload the room during the transition; hide warm-up behind motion.** Swap room contents
  on a persistent Canvas (never remount), kick off the (small) room asset load as the doorway animation plays,
  and only reveal the room once it's ready — the Mario Party "lightweight assets + threaded background load +
  no hitch" rule, translated to r3f
  ([r3f: persist the canvas](https://github.com/pmndrs/react-three-fiber/issues/2655),
  [Godot party blueprint](https://github.com/thedivergentai/gd-agentic-skills/blob/main/skills/godot-genre-party/SKILL.md)).
- **Establish → settle camera, with an instant equivalent.** A brief establishing move that settles into the
  activity framing (the spec already has `drift-in`/`ease`); **reduced-motion = instant cut**, no exceptions
  ([UI contract `resolveCamera3D`](../../specs/003-interest-lab/contracts/interest-lab-ui.md)).
- **Make the return signal *visible*, not gamified.** A **"places you wander back to"** overlay on the map (a
  gentle glow on tiles revisited unprompted) shows the child their own pattern **without** points/streaks/FOMO —
  respecting the no-gamify-the-signal rule and children's right to disconnect
  ([precedents memo §1.4/§2.2](./interest-lab-world-precedents.md)).
- **Don't over-rail (the Duolingo lesson).** Keep free choice of which zone to enter and what to revisit; a
  legible map must not become a forced conveyor, because that is the exact behavior our signal measures
  ([Duolingo backlash](https://duoplanet.com/duolingo-new-learning-path-review/)).
- **Keep player-facing aids (the Dead Space lesson).** Label zones on the map; don't chase pure diegesis at the
  cost of a kid getting lost ([precedents memo §1.3](./interest-lab-world-precedents.md)).
- **Natural endpoints + guilt-free exit.** "That's a good place to stop — the studio will be here"; pause with
  no streak debt; a definitive exit — the come-back loop lives *around* the experience, not as a countdown
  inside it ([precedents memo §1.4](./interest-lab-world-precedents.md)).
- **The three tiers stay first-class.** `room-3d → room-3d-lite → board-2d-only`: on the weakest Chromebooks the
  child simply stays on the map and does the DOM activity-equivalent — an *equal* mode, not a lesser one.

---

## 5. Recommended architecture (concrete, tied to the repo)

1. **Promote `board-2d` / the quest ledger to the *primary* 2D overworld** — a top-down zone map (DOM/SVG,
   `motion@^12`), not a downgrade tier. It remains the **WCAG-operable AT source of truth** and becomes the
   **return-signal surface** ("places you wander back to" overlay). Zero WebGL on the map.
2. **One persistent `<Canvas aria-hidden>`, mounted client-only (`next/dynamic`, `ssr:false`), that renders only
   the *active* room.** Swap room contents on zone-enter/exit (**routes-inside-Canvas**); **never remount the
   Canvas** ([r3f guidance](https://discourse.threejs.org/t/context-lost-when-i-route-to-another-page-in-react-three-fiber/61736)).
   Unmount the Canvas only when leaving the child surface entirely.
3. **Extend the pure GPU-free view package** with a `RoomView` (bounded scene: fixed/rail camera, small
   procedural asset set, target <50 draw calls, KTX2 if any textures, DPR ≤2, render-on-demand) alongside the
   existing `IslandView`/`SceneView`. Keep everything emitting *numbers* so it stays Vitest-testable without a
   GPU ([UI contract](../../specs/003-interest-lab/contracts/interest-lab-ui.md)).
4. **Keep `plainViewEquals` parity per room.** Each room's activity has a DOM-operable equivalent in the ledger;
   the map + one bounded activity is a *far smaller* accessibility surface than a whole navigable open world.
5. **Top-level world-state store above the Canvas** (current zone, half-finished artifacts, return beacons) —
   the GameInstance/autoload pattern, and the natural seam for the shared PassionLab state
   ([PASSION-LAB-PLAN.md](../PASSION-LAB-PLAN.md)).
6. **Asset & perf discipline:** WebGL2 baseline; `<PerformanceMonitor>`/`<AdaptiveDpr>` stepping
   room-3d→lite→board-2d; **preload-next-room during the doorway transition**; render-on-demand so an idle room
   doesn't burn the thermal budget.

**What this changes vs. the current spec:** split today's *single floating-islands 3D world* into **(2D map =
primary navigation)** + **(bounded 3D rooms)**. That deletes the two things that make the current design risky on
a school Chromebook — **holding all islands' 3D resident** and an **accessible free-fly camera across the whole
world** — while reusing the view package, the tier system, and the accessibility parity you've already built.

---

## 6. When a single full-3D open world would actually win (steelman)

Choose the open world if **free-roam immersion is itself the core value** (the *wandering* is the product), or
if the world must feel **continuous and socially co-present** (avatars sharing one space, emergent encounters),
or if the target hardware were guaranteed capable (a kiosk with fixed GPUs, not heterogeneous Chromebooks).
**None of these is our case.** Our core is: *do a hands-on probe, and read voluntary return per (domain ×
work-mode) cell.* Immersive free navigation adds cost and legibility risk without serving that signal — and it
would still need the 2D tier for perf and accessibility. So the open world buys immersion we don't need and
keeps the 2D work we can't avoid.

---

## Sources

**Our design context (internal):**
[interest-lab plan.md](../../specs/003-interest-lab/plan.md) ·
[interest-lab UI contract](../../specs/003-interest-lab/contracts/interest-lab-ui.md) ·
[exploration-world precedents memo](./interest-lab-world-precedents.md) ·
[AI 3D-world generators memo](./interestLab-3dWorldGenerators.md) ·
[PassionLab plan](../PASSION-LAB-PLAN.md) ·
[passion brainlift](./passionBrainlift.md)

**Precedents (hub / map → bounded activity):**
[Design Doc — "What Makes a Great Hub World?"](https://www.youtube.com/watch?v=hHguwARMcY8) ·
[Unreal forum — SM64-style hub + progression](https://forums.unrealengine.com/t/how-to-create-a-hub-world-and-level-progression-like-super-mario-64/481389) ·
[Godot party-game blueprint (minigame orchestrator)](https://github.com/thedivergentai/gd-agentic-skills/blob/main/skills/godot-genre-party/SKILL.md) ·
[Ultimate Party Game Template](https://github.com/Kris-DevBuddy/Ultimate-Party-Game-Template) ·
[Duolingo home-screen redesign (blog)](https://blog.duolingo.com/new-duolingo-home-screen-design/) ·
[Duolingo path whitepaper (PDF)](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_language_read_listen_write_speak_2024.pdf) ·
[von Ahn interview (NBC)](https://www.nbcnews.com/tech/tech-news/duolingos-update-redesign-luis-von-ahn-interview-rcna44655) ·
[Duolingo path review (duoplanet)](https://duoplanet.com/duolingo-new-learning-path-review/) ·
[Mobile app design fails, 2026 (DesignRush)](https://www.designrush.com/agency/mobile-app-design-development/app-design/trends/mobile-app-design-fails) ·
[Gather.town interactive objects](https://support.help.gather.town/articles/5512361772-interactive-objects) ·
[Gather.town embedded websites](https://support.gather.town/articles/1619815823-embedded-websites) ·
[Gather.town mapmaker overview](https://support.gather.town/articles/9657827678-mapmaker-overview)

**Engineering (react-three-fiber / three.js / Chromebook perf):**
[three.js manual — multiple canvases/scenes & context limit](https://threejs.org/manual/en/multiple-scenes.html) ·
[r3f discussion #2716 — multiple canvas / use drei `<View>`](https://github.com/pmndrs/react-three-fiber/discussions/2716) ·
[SO — allowing more WebGL contexts](https://stackoverflow.com/questions/59140439/allowing-more-webgl-contexts) ·
[r3f issue #2655 — dispose on Canvas unmount / persist the canvas](https://github.com/pmndrs/react-three-fiber/issues/2655) ·
[three.js forum — context lost on route change; put routes in the Canvas](https://discourse.threejs.org/t/context-lost-when-i-route-to-another-page-in-react-three-fiber/61736) ·
[r3f issue #3093 — leaking on unmount; GPU bindings held](https://github.com/pmndrs/react-three-fiber/issues/3093) ·
[Three.js 60fps patterns, 2026](https://www.intelligentgraphicandcode.com/development/threejs-interfaces/performance) ·
[Optimizing Three.js for the web](https://www.abratabia.com/threejs/performance.php) ·
[iGPU rendering optimization (UMA / throttling)](https://rapidmade.com/webgl-three-js-cad-rendering-optimization/) ·
[three.js forum — WebGPU slower on many-mesh (r183)](https://discourse.threejs.org/t/webgpurenderer-2x-slower-cpu-and-5-10x-slower-first-frame-than-webglrenderer-on-many-mesh-scenes-r183-same-on-both-backends/91904) ·
[WebGPU→three.js migration guide, 2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
