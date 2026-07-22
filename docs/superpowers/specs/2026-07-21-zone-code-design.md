# Code Lab — Zone Design (domain: `computation`)

**Date:** 2026-07-21 · **Owner:** David · **Lane:** 3 (parallel zone loop) · **Implements:**
`ZonePlugin` from [`2026-07-21-interest-lab-world-design.md`](./2026-07-21-interest-lab-world-design.md) §4.
**Grounded in:** `docs/research/interest-lab-world-precedents.md` (intrinsic integration; the return signal),
`docs/research/stylizedWorldAssetPipeline.md` (CC0 + art direction + Chromebook budgets),
`docs/research/passionBrainlift.md` (manufacture-and-prune; never label; don't gamify the signal), and the
frozen engine types in `passion/packages/interest-lab` (`Probe`, `WorkMode`, `EngagementEvent`, `EventType`).

This spec designs **one** zone to maximum depth. It owns only `passion/packages/interest-zone-code/`; the
single shared-root touch is registering the plugin in the app's zone registry.

---

## 1. The one-line bet (and the anti-broccoli guarantee)

> **A cozy tabletop where you snap big command tiles onto a rail and press a chunky GO lever to send a
> wind-up sprout-bot, "Pip," walking across a little garden board toward a glowing seed-battery — and the
> *arranging of logic* is the whole game.**

There is **no quiz, no typing, no "what does this output?" trivia, no right answer to reproduce.** The act
the engine wants to measure — *assembling a sequence of instructions, running it, watching it fail or
succeed, and fixing it* — **is** the mechanic (Habgood & Ainsworth intrinsic integration; the direct fix
for v1's opaque "debug quest" stub). A child 8–14 understands it in seconds because the room *shows* them
what to do, and wants to return because the loop is short, visible, and theirs.

**Fiction (all one warm workshop):** the **Code Lab** is a sunlit maker's workshop. On the workbench sits
the **Garden Board** — a small grid diorama. **Pip**, a low-poly wind-up robot, stands on the start tile.
The **Program Rail** (a filmstrip/conveyor across the bench) holds **command tiles**. A big green **GO
lever** runs the program. Finished work lives on **the Shelf**. A door-less side of the bench is the
**Tinker Bench** (free play).

---

## 2. Moment-to-moment — teach by affordance, zero tutorial wall

The room *is* the instruction (Nintendo World 1-1: empty space + a pulsing goal + a bob-inviting lever
teach the verb with no text). On first entry the camera eases into the bench and the child sees, with **no
modal**:

- **Pip** idling on the **start tile** with a tiny wind-up wobble, "looking" toward the goal.
- The **goal** (a seed-battery / lightbulb-flower) **pulsing** a warm `spark` glow — *go here*.
- The **Program Rail** with **one `Step` tile already placed** and the next slots **outlined and empty** —
  *put tiles here*.
- The **GO lever** doing a single inviting **bob** — *press me*.

That's the entire onboarding: a pre-placed tile + empty slots + a pulsing goal + a bobbing lever ⇒ "fill
the rail, press GO, get Pip to the light." Then:

1. **Place a tile.** Drag a tile from the palette into a slot — or click a slot then click a tile — or (a11y)
   focus a slot and press Enter. It **snaps** with a click + tiny bounce (game feel), never a form field.
2. **Press GO.** The rail **highlights each tile in turn** as Pip executes it — one grid cell per `Step`
   with a hop, a spin per `Turn`. **The currently-running tile lights up**, so cause↔effect is legible:
   the child *sees* which instruction moves the bot.
3. **Watch the result.**
   - **Success:** Pip reaches the goal → the seed-battery **blooms**, a warm chime, gentle bloom + a few
     `Sparkles`, and a **"★ solved in N tiles"** ribbon drops onto the board.
   - **Safe failure (never punished):** Pip **bumps a wall** (soft *boing*, rubs its head, a small "hmm" —
     **no buzzer, no red "WRONG"**) or stops short. A faint **ghost trail** shows where Pip went vs. the
     goal, and the **tile where it went wrong softly pulses**. The rail is left **exactly as the child
     built it** — inviting a one-tile edit, not a restart.

**Progressive disclosure (the puzzle ladder), still no tutorial text.** Each new tile appears in the
palette (with a single wordless shimmer) precisely when the board makes the old toolkit insufficient:

| Board | What the board forces | Tile it teaches |
|---|---|---|
| 1 — three cells in a line | just go forward | `Step` + `GO` |
| 2 — an L-corner | `Step`-only bumps the wall | `Turn` (left/right) |
| 3 — a long straight | slots run out → "there's a tighter way" | `Repeat` (loop) |
| 4 — a fork / locked gate | one path is blocked | `If-path` (branch) / `Grab` (key) |
| stretch — loops/branch *required* | can't be brute-forced | (reuses; flagged `stretch`) |

Discovery, not instruction: the child *finds out* Turn exists because the corner made Step fail — the
explorable-explanation move (you prove the rule to yourself).

---

## 3. The fun loop (the "aha")

```
arrange  →  GO (run)  →  watch Pip walk + tiles light  →  [fail? see ghost trail, edit one tile]  →  GO  →  bloom
   ^                                                                                                        |
   └───────────────────────────── "solve tighter / try harder / make my own" ───────────────────────────────┘
```

The satisfying beat is **prediction confirmed**: "if I drop a `Turn` *here*…" → press GO → Pip does exactly
that and reaches the light. Each cycle is seconds long and fully visible. The loop rewards *return*
(more boards, tighter solutions, your own creations) **without any streak, point, or FOMO** — the come-back
loop lives *around* the experience, never inside it (Yu-kai Chou; IDC 2026 right-to-disconnect; our
no-gamify-the-signal rule).

---

## 4. The real artifact — and where it goes

Every success produces a **real, kept artifact**, not a checkmark:

- **Solved board** = the child's **block sequence (the program) + its run trace + tile-count**, saved as
  their solution and shown as a **ribbon on the Shelf** ("★ solved in N tiles"). A tighter re-solve
  updates it (and is a *signal* — see §6).
- **Tinker creation** = a **named, replayable little program** ("Pip's Dance", "my star maze"), saved to
  the Shelf; optionally **published** as a level for others to solve (audience) or built **with a friend**
  (group).

**Persistence:** artifacts are stored per `learnerRef` via the core's artifact store (mirrors the engine's
`acceptArtifactSignal` / `ArtifactTransition` machinery); team creations carry a `SoloProof` per
`promoteTeamArtifact`. The **Shelf is diegetic memory**: it's how the room says *"your half-built thing is
still here"* on a later visit — a single, gentle, opt-in cue, never a countdown.

---

## 5. Work-modes: the four requested → the frozen `WorkMode` enum

`WorkMode` is a fixed nine-verb enum (`build, investigate, compose, explain, perform, debug, collaborate,
care, persuade`) — I map the four Code-Lab interaction modes onto it, **choosing distinct canonical verbs
so the grid gets four separable columns**, and choosing `build`/`debug`/`compose` deliberately because they
are **shared with the Music and Art zones** (the whole point of §6: a column lights up when a work-mode
travels *across* domains).

| Interaction mode (task) | What the child is doing | Canonical `WorkMode` | Shared with |
|---|---|---|---|
| **make / build** | assemble the program (snap tiles) | **`build`** | Music (make), Art (make) → strong shared column |
| **fix / debug** | correct a failed run | **`debug`** | Music (fix) → shared column |
| **solve / plan** | read/trace/predict *before* running | **`investigate`** | Code's signature analytical column |
| **tinker / create** | free-play: arrange logic into your *own* thing | **`compose`** | Art (compose), Music (compose) → shared column |

> **Note (extends design §5 shorthand).** §5 lists Code as "make · fix/debug · solve." This spec adds a
> fourth, **`compose`** (the Tinker Bench), because a free-creation column shared with Art/Music is exactly
> what disambiguates a *work-mode* spike (a child who *composes* in code **and** art **and** music) from a
> *topic* spike (a child who stays in code across build/debug/investigate). "Tinkering-by-arranging-logic
> into an original artifact" is genuinely composing; incidental "poke a block to see what it does" also
> surfaces as `investigate`.

---

## 6. Probe catalog (`Probe[]` — all fields, coverage-friendly)

Four families × two variants = **8 probes**, `domain: "computation"`, spanning all four work-modes plus the
difficulty / social / audience axes the coverage matrix checks (`buildCoverageMatrix`).

| id | familyId | workMode | difficulty | autonomy | social | audience | safetyClass | artifactEvidence |
|---|---|---|---|---|---|---|---|---|
| `code.path.foundational` | `code.path` | `build` | foundational | low | solo | no_audience | cleared | solved-board program + run trace |
| `code.path.stretch` | `code.path` | `build` | stretch | medium | solo | no_audience | cleared | solved-board program (loops/branch) + trace |
| `code.debug.foundational` | `code.debug` | `debug` | foundational | low | solo | no_audience | cleared | corrected-program diff + passing run |
| `code.debug.stretch` | `code.debug` | `debug` | stretch | medium | solo | no_audience | cleared | corrected multi-fault program + passing run |
| `code.plan.foundational` | `code.plan` | `investigate` | foundational | medium | solo | no_audience | cleared | verified prediction/blueprint |
| `code.plan.stretch` | `code.plan` | `investigate` | stretch | high | solo | no_audience | cleared | verified min-tile blueprint |
| `code.tinker.solo` | `code.tinker` | `compose` | foundational | high | solo | no_audience | cleared | saved runnable program (.bot) |
| `code.tinker.share` | `code.tinker` | `compose` | stretch | high | group | audience | cleared | published level + SoloProof (if group) |

Shared fields for all: `prerequisites` gate the ladder (`code.path.stretch` needs `loops-introduced`;
`code.tinker.*` needs `first-solve`); `equipment: []`; `accessibilityVariants: ["dom-rail","sr-board","switch-scan"]`;
`expectedBurden` ~1–3 (foundational) to ~4–6 (stretch); `safetyClass: "cleared"` (code puzzles carry no
safety risk). This catalog alone contributes both difficulty bands, both social modes, and both audience
conditions to the cross-zone coverage matrix.

---

## 7. Probe signals — action → `workMode` → `EventType` (the crux)

Signal is **two-level**: a *probe* fixes the **grid column** (`{domain:"computation", workMode}`); an
*action inside it* emits a typed **`EngagementEvent`** whose `type` (`EventType`) picks the **signal
family**. Both are explicit below.

| # | Child action | Probe → `workMode` (column) | `EventType` emitted | Signal family / why it counts |
|---|---|---|---|---|
| 1 | Snap a command tile into a rail slot | `code.path` → **build** | — (accrues) | building the program = the *make* act |
| 2 | Press GO → Pip reaches the goal (solved board) | `code.path` → **build** | `ARTIFACT_COMPETENCE` | produced a working artifact |
| 3 | After a failed run, edit a tile & re-run to success | `code.debug` → **debug** | `FAILURE_RECOVERY` | recovered from a flop (the debug arc) |
| 4 | Open **Peek/Trace**: step through / place a predicted path / read the board before running | `code.plan` → **investigate** | `ARTIFACT_COMPETENCE` on a **verified** blueprint | the *solve/plan* analytical act |
| 5 | Choose a **stretch** board (harder path, loops required) | (any) → column of that probe | `CHOSEN_CHALLENGE` | picked the harder challenge |
| 6 | Re-solve a solved board in **fewer tiles**, unprompted | `code.path` → **build** | `UNREQUIRED_REVISION` | improved own work unbidden |
| 7 | Enter **Tinker Bench** and set your own goal ("make Pip draw a star") | `code.tinker` → **compose** | `SELF_AUTHORED_SCOPE` | authored own scope |
| 8 | Save a Tinker creation (runnable program) | `code.tinker` → **compose** | `ARTIFACT_COMPETENCE` | made + kept an original artifact |
| 9 | **Publish** a creation / a level for others (audience) | `code.tinker.share` → **compose** | `ARTIFACT_COMPETENCE` (+ `SELF_AUTHORED_SCOPE`) | shipped for an audience |
| 10 | Build a level **with a friend** (co-op the bench) | `code.tinker.share` (group) → **compose** | `ARTIFACT_COMPETENCE` (+ `SoloProof`) | collaborative artifact (team → solo-proof) |
| 11 | Tap **Hint / "show me one tile"** | (current probe) | `ASSISTIVE` (`assistive:true`) | help used — **never lowers a signal** |
| 12 | Come back to the Code Lab days later, **unprompted** | zone-level | `VOLUNTARY_RETURN` (day7/day30) | **the actual passion signal** |
| 13 | Come back only after a reminder/nudge | zone-level | `PROMPTED_RETURN` (+`interventionContext`) | prompted → recessed, ≠ signal |

**Novelty guard (non-negotiable):** first-visit tile-clicks are tagged novelty → keep the hypothesis
`EMERGING` and *schedule a delayed return check* rather than confirming. Only the later, unprompted return
(row 12) counts. `ASSISTIVE`/`SAFETY_RESCUE` never raise or lower signal (existing guardrail).

**Direct answer to the 4 requested modes:** make/build → rows 1–2 (`build`); fix/debug → row 3 (`debug`);
solve/plan → row 4 (`investigate`); tinker/experiment → rows 7–10 (`compose`).

---

## 8. States

| State | What the child sees | Signals / notes |
|---|---|---|
| **empty** (first-ever entry) | Room eases in; Pip idles at start; **one `Step` pre-placed**, empty slots outlined; goal pulses; GO bobs once. **Zero text.** | Affordance-only onboarding. No event yet. |
| **first-run** | Child fills rail + GO; tiles light in sequence; Pip hops; success bloom *or* gentle bump + ghost trail. | Novelty **tagged** (keeps `EMERGING`); first `ARTIFACT_COMPETENCE`/`FAILURE_RECOVERY`. |
| **mid** (working / after a fail) | Ghost trail shown, offending tile pulses, **rail preserved**; child edits one tile. Or mid-ladder between boards. | The debug loop; `FAILURE_RECOVERY` on the fixing re-run. |
| **solved** | Board blooms; "★ solved in N tiles" ribbon → Shelf; a **calm offer**: re-solve tighter · try a stretch board · open Tinker Bench · *"good place to stop — the lab will be here."* | Natural endpoint (AC "dosage"); revision/challenge invited, never forced. |
| **return visit** ("a week later…") | Room is **quieter**: NEW banners gone, sparkle faded, **no reminder was sent**. The **Shelf still holds** their saved creations + ribbons. | What they **drift to** = the read: new board? Tinker? reopen a saved program? Voluntary return fires the **label-free `welcome-back` warmth (no points)**. |

The honestly-labeled **"a week later…"** time-lapse is how a single session makes *return-over-days*
legible (mirrors the design's synthetic device; separates novelty from return).

---

## 9. Accessible DOM-mirror — `ActivityDOM` (a peer, not a lesser menu)

The DOM-mirror preserves **the act of building logic**, not a to-do list (Surveyor: don't railroad; AGI/MS
tags: move focus one item at a time, never steer a cursor; narrate name/role/state).

- **Program Rail = a real `<ol>`**; each slot is an `<li>` (`role="listitem"`). Build by keyboard: focus a
  slot, choose a tile from the **palette toolbar** (buttons) with Enter; **arrow keys reorder**; Delete
  removes. This is genuine block-programming — the *same* sequence, no 3D required.
- **Board = a described grid** (a labeled table). SR reads state: *"Pip at B2 facing north; goal at D4;
  wall at C2."* On GO, **each executed step is announced**: *"Step: Pip → B3"*, *"Turn Left: faces west"*,
  *"Bump: wall ahead — Pip waits."* The consequence is *watchable aurally*.
- **Failure is announced non-punitively**: *"Pip stopped one short; step 3 sent it into a wall,"* and the
  offending `<li>` is flagged → the debug act is fully keyboard/SR operable.
- **Peek/Trace, Tinker Bench, Publish, Hint** all mirrored; the child still **chooses what to make and
  what to revisit** (the signal-bearing choices survive).
- **Parity by construction:** identical `probeId` / `workMode` / `returnState` / `tone` / `whyCopy` per the
  existing `plainViewEquals` law; the DOM path **emits the same `EngagementEvent`s**. Reduced-motion →
  instant framing (Pip "jumps" step-to-step with announced positions; honors `MotionToken` reduced mode).

`ActivityDOM` is the accessibility floor of the tiering (`room-3d → room-3d-lite → DOM`) and a first-class
equal, never a downgrade.

---

## 10. Assets + art — the CC0 pipeline in a bounded 3D room

**Yes — the "bot world" *is* the 3D room.** The Garden Board tabletop is the room's content; the workshop
is the frame; the Program Rail is a **DOM/HTML overlay** on the canvas (not diegetic 3D tiles). This is a
deliberate legibility + a11y + perf choice (Dead Space lesson: don't fetishize pure diegesis — dragging 3D
tiles is a raycast/keyboard nightmare on Chromebooks; DOM tiles are natively operable and the 3D stays the
beautiful, legible *consequence*). Fixed 3/4 camera (`fov ~35–40`), orbit disabled/clamped; contents swap
inside the single persistent `<Canvas>` on enter/exit.

**Assets (all CC0 — no attribution, commercial-safe):**

| Element | Source (CC0) | Notes |
|---|---|---|
| **Pip** (wind-up robot) | Quaternius / KayKit robot + CC0 animation set | one skinned mesh; anims: idle, hop, turn, bump, cheer |
| Board floor / walls / goal | Kenney (Mini kits, Platformer/Blocks) + KayKit modular | goal = emissive seed-battery/flower prop |
| Workshop dressing (bench, Shelf, lamp, plants) | Kenney Furniture Kit + KayKit props | instanced / merged |
| Command-tile icons | authored flat SVG/atlas (icon-first, no text needed) | color-coded per tile type |

**Pipeline (`stylizedWorldAssetPipeline.md` §7 default stack):** `gltf-transform optimize --compress
meshopt --texture-compress ktx2` → `gltfjsx --transform --types` → `useGLTF.preload`. **One shading model**
(flat PBR or toon) + **the locked `PALETTE`** (goal glow `spark #FF9E5E` / success `beacon #FFD166` /
accents `tide #5EC8D8`, `sprout #7BD88F`; the building/marker hue for `computation` from
`resolveDomainHue`/`HUE_RAMP`).

**Lighting/shadows/atmosphere:** one self-hosted CC0 HDRI (Poly Haven, warm interior) via `<Environment>`;
one key `directionalLight` (window light) + low hemi fill; `<ContactShadows frames={1}>` under Pip + board,
`<BakeShadows>` elsewhere; palette-matched soft **fog** for depth; gentle `<Float>` on the goal + a few dust
`<Sparkles>` in the sunbeam (cozy, A Short Hike / Animal Crossing mood).

**Post + budgets:** `EffectComposer` → `Bloom(mipmapBlur, luminanceThreshold ~1.0)` (goal glow) + `Vignette`
+ `ToneMapping(ACES)`, renderer `NoToneMapping`. `dpr={[1,1.5]}`, `antialias:false` + SMAA,
`frameloop="demand"` (render on tile-place / GO / step). **< 50 draw calls**: instanced grid floor + walls
(`<Instances>`), tiles/props share one atlas/material, Pip is the lone skinned mesh; set dressing
merged/instanced. `PerformanceMonitor` + `AdaptiveDpr` degrade: drop `Sparkles` → drop Bloom → `room-3d-lite`
→ `ActivityDOM`.

---

## 11. Binding to the core — `ZonePlugin`, `RoomProps`, emit mapping

```ts
// passion/packages/interest-zone-code/src/plugin.ts
import type { ZonePlugin, RoomProps } from "@gt100k/interest-lab-view";
import type { EngagementEvent, Probe } from "@gt100k/interest-lab";

export const codeProbes: Probe[] = [/* §6 catalog, domain:"computation" */];

export const codeZone: ZonePlugin = {
  id: "code",
  domain: "computation",              // grid row; hue via resolveDomainHue()
  mapBuilding: {                       // 2D Curiosity Map building
    id: "code",
    label: "Code Lab",
    sprite: "workshop",               // cozy workshop/greenhouse w/ gear-sprout sign
    position: [/* island slot */],
    ambientCue: "shelf-glow",         // soft glow iff saved/unfinished artifacts exist (return cue)
  },
  Room3D: CodeRoom3D,                  // Garden Board diorama in the shared <Canvas>
  ActivityDOM: CodeActivityDOM,       // §9 accessible peer
  probes: codeProbes,
};
```

**`RoomProps` the zone consumes from core** (proposed contract for lane 0 to freeze):

```ts
interface RoomProps {
  learnerRef: string;
  ageBand: "6-8" | "9-11" | "12-14";
  deviceCaps: DeviceCaps;
  renderTier: RenderTier;             // room-3d | room-3d-lite | board-2d(→ActivityDOM)
  reducedMotion: boolean;
  plainMode: boolean;
  seed: number;                       // deterministic boards for QA
  artifacts: { load(): CodeArtifact[]; save(a: CodeArtifact): void };
  emit(e: EngagementEvent): void;     // the one channel into the signal engine
  onExit(reason: "done-for-today" | "back-to-map"): void;
}
```

**Emit helper (action → event), keeping `probeId`/`familyId`/`domain`/`workMode` correct:**

```ts
function onSolved(probe: Probe, tiles: number) {
  emit(mkEvent(probe, "ARTIFACT_COMPETENCE"));         // build column
}
function onFixedAfterFail(probe: Probe) {
  emit(mkEvent(probe, "FAILURE_RECOVERY"));            // debug column
}
function onVerifiedPlan(probe: Probe) {
  emit(mkEvent(probe, "ARTIFACT_COMPETENCE"));         // investigate column
}
function onTinkerGoalSet(probe: Probe) {
  emit(mkEvent(probe, "SELF_AUTHORED_SCOPE"));         // compose column
}
function onHint(probe: Probe) {
  emit({ ...mkEvent(probe, "ASSISTIVE"), assistive: true });
}
// mkEvent stamps id, learnerRef, probeId, familyId, domain:"computation",
// occurredAtDayOffset (Clock), reliability, withdrawn:false.
```

Artifact acceptance routes through the engine's `acceptArtifactSignal`; group creations through
`promoteTeamArtifact` with a `SoloProof` (else `TeamArtifactProofRequiredError`). Return events are set by
the core map on revisit (voluntary vs. prompted); the zone does not fabricate them.

---

## 12. `window.__qa` hooks (so the gate can't pass a dead room)

```ts
window.__qa = {
  ready,                                   // true after first board painted
  error,
  settle(frames = 2),                      // drain Pip walk / bloom before capture
  scene,                                   // r3f state.scene
  interactives: () => [                    // real 3D interactives, projectable + clickable
    { id: "go-lever", kind: "button", worldPos: [...] },
    { id: "goal",     kind: "target", worldPos: [...] },
    // command tiles are DOM (covered by the DOM click-assert law directly)
  ],
  stateHash,                               // rail contents + Pip pose + solved flag
};
```

The finish-gate raycast round-trip: project `go-lever` → dispatch a real pointer event → assert
`stateHash()` changed (Pip moved / board solved). Primary action dead ⇒ **hard fail**.

---

## 13. Anti-patterns explicitly designed out

| Anti-pattern | How this zone avoids it |
|---|---|
| **Decorative 3D over a hidden menu** | The tabletop **is** the activity's result stage; `go-lever` + `goal` are live 3D interactives in `__qa.interactives()`; tiles are operable DOM. Nothing is `aria-hidden` scenery. |
| **Dead controls** | GO / tiles / goal each change `stateHash()`; finish-gate hard-fails a dead primary action + raycast round-trip verifies. |
| **Quiz behind a pretty door** | There is no quiz. The mechanic (arrange logic → run → watch → fix) *is* the probe. No multiple-choice, no "what does this print?" |
| **"Type this exact code"** | Zero typing, no syntax; big tiles; **many solutions accepted** (any program that reaches the goal solves it; tighter is optional) — preserves autonomy. |
| **Gamifying the return signal** | No streaks/points/FOMO; `welcome-back` is warmth only; natural "done for today" endpoint; guilt-free pause. |
| **A fixed label** | Emits separated families to the engine; never "you are a coder." |
| **3D that subtracts legibility** | Fixed camera, currently-running tile lit, ghost-trail on fail; `room-3d-lite`/`ActivityDOM` are genuine equals, not downgrades. |

---

## 14. Zone acceptance (for the loop)

Land green: (1) all 8 probes registered, `domain:"computation"`, four distinct work-modes; (2) a seeded
end-to-end — enter room → place tiles → GO → success emits `ARTIFACT_COMPETENCE`; fail→fix emits
`FAILURE_RECOVERY`; stretch pick emits `CHOSEN_CHALLENGE`; Tinker goal emits `SELF_AUTHORED_SCOPE`; hint is
`ASSISTIVE` and lowers nothing; (3) `ActivityDOM` passes `plainViewEquals` parity + full keyboard/SR walk;
(4) `window.__qa` present, raycast round-trip on `go-lever` changes `stateHash()`; (5) < 50 draw calls at
`room-3d`, clean degrade to lite → DOM; (6) reduced-motion instant framing. Register the plugin (the one
shared-root merge point) and run the upgraded QA gate.
