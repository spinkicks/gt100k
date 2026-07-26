# `mvp-jul24`: a room worth being in

**Status:** design, approved 2026-07-26. Not yet planned or built.
**App:** [`passion/apps/mvp-jul24`](../../../passion/apps/mvp-jul24) — its
[`PROJECT.md`](../../../passion/apps/mvp-jul24/PROJECT.md) is the durable brief and this design
amends it in three places (recorded in §6).
**Reads with:** `docs/prd/DISCOVERY-APP-PRD.md` §5.2 / §5.3 / §11,
`docs/research/passion-pipeline/06-activity-design-ages-6-8.md` §2.1 / §2.3 / §8.5.
**Date:** 2026-07-26

## 1. What this is for, and the decision behind it

`PROJECT.md` states the app's own verdict on itself without softening it: *"this build does not
produce a defensible interest read. It produces a room worth being in."*

That verdict was put to the operator as a fork — make the game produce a real read, or keep it a
room worth being in — and **the second was chosen.** So the whole measurement lane is out of scope
here, deliberately and not by oversight. What is in scope is making the room better at being a room,
in two phases and in this order: **fix the architecture so it stops fighting back, then spend on a
child playing unsupervised.**

### In scope

- **Phase A** — retire the child-facing interest readout; collapse three cabin backends to one;
  amend the PRD rule that collapse invalidates; reconcile three stale docs; label the partial
  signal emission honestly.
- **Phase B** — give `logic-games` the difficulty ladder its generators already accept; offer a
  harder variant rather than only ramping automatically; make the twin pair discoverable; improve
  the weakest of the five math props.

### Out of scope, by decision

Everything in the measurement lane: the artifact catalog, the taxonomy crosswalk, a second
work-mode column, `CellEvent` derivation, choice-set recording. Also out: **A3** asset pipeline,
**A5** accessibility mirror, **A4** taste-app embedding SDK, a third cabin, and demo polish.

§2 records what the measurement lane would have contained, because it was investigated before it
was cut and re-deriving it would be waste.

## 2. What was found and deliberately not fixed

Recorded so the next person does not spend a day rediscovering it, and so nobody mistakes the
current state for a wiring bug.

**The signal records the app emits cannot enter the pipeline. Two independent hard blocks.**
`#161` gave the app an emitter typed against `@gt100k/signal-pipeline`, so `tsc` passes and the
records look well-formed. But `buildActionEvents`
(`passion/packages/signal-pipeline/src/actions.ts`) drops all of them:

1. **No artifact catalog exists.** Nothing in the repo maps `nonogram` — or any other gadget id — to
   an `Artifact { domainPath, affordedModes }`. `catalog.get(artifactId)` misses, so every record is
   dropped `unknown-artifact`.
2. **`actionType: "open"` is not a key in `ACTION_MODE_RULES`.** The table
   (`passion/packages/two-axis-tagging/src/resolver.ts`) holds `play`, `assemble`, `inspect`,
   `tinker`, `write-melody`, `fix`, `teach`, `pitch`, `co-work`, `tend`. `"open"` resolves to
   nothing, so even with a catalog every record would be dropped `unresolved-action`. Depth is also
   emitted *as* an `actionType` (`recordDepth(id, "unrequired_revision")`), which does not resolve
   either.

**The game's topics are not the taxonomy's cabins.** Game topics are `logic-games`, `math`, `music`,
`code`, `art`; taxonomy `CABINS` are `music-sound`, `code-computers`, `games-strategy`,
`making-engineering`, `art-motion`, `influence-media`, `science-nature`, `math-puzzles`. Note that
the taxonomy already models the split this app made as **subtopics of one cabin**:
`math-puzzles/{logic-puzzles, competition-math}`. No crosswalk is written anywhere. G2's
subject→cabin crosswalk is the precedent for what one would look like.

**All nine activities would resolve to a single work-mode.** They are all solve-a-puzzle. C3 keys
beliefs on `(domain × work-mode)` cells, so this app would populate roughly a 2×1 matrix — no mode
marginals and no topic-vs-style attribution, which is the entire purpose of two-axis tagging. The
Mirror Maze / Fraction Laser twin pair varies *domain* with the shell held constant; nothing in the
app varies *mode*.

None of the above is fixed by this design. It is the cut lane, stated once, accurately.

## 3. Phase A — one backend, one truth

### A1 · Retire the child-facing interest readout

**This is the highest-priority item in the document and it is a live PRD §11 violation, not a
polish issue.**

`src/App.tsx` puts a permanent nav button labelled **"Interest"** beside "Map" in the child's
primary navigation — ungated, no QA check, no dev-only branch. It opens `ReadoutScreen`
(`src/interest/ReadoutScreen.tsx`): a screen titled **"Your interests"**, one bar per gadget,
**sorted by time-on-task descending with the minutes printed** beside each bar.

PRD §11 refuses this on three separate counts:

- "any **child-facing** ranked or quantified display of the child's own engagement";
- "a visible **time-on-task ranking** makes the measured quantity a target, converting the
  instrument into an engagement-contingent reward";
- "**'your interests'** framing asserts the fixed, discovered-interest model that collapses
  resilience."

And the hard refusal above those carries the age-specific numbers: engagement-contingent reward is
the only contingency with a significant age moderator on free-choice motivation, its child estimate
is **d = −0.46** (43 studies, vs −0.21 in college students), and the undermining **grows rather
than decays** — −0.35 immediate, −0.49 within a week, **−0.55 after ~2 weeks**. A visible
time-on-task bar chart is the direct analogue of the points-for-play shell that estimate is drawn
from.

This belongs in "a room worth being in" rather than in the cut measurement lane, because the screen
is not a dormant instrument. It teaches the child to optimise minutes, and the effect compounds over
exactly the horizon a returning player occupies.

**Change.** Remove the nav button and drop `readout` from the child's reachable screens. Keep
`interest/store.ts` and `ReadoutScreen.tsx` in the tree, reachable only behind the QA gate the other
apps already use (`window.__qa` / `LOOP_QA`, as in `apps/project-studio`). Deleting them is not
required and the counters remain useful to an operator.

**Test.** Assert that no child-reachable path renders a time-on-task figure. The guard is the point:
this shipped ungated once, so a test that only checks the button's absence would pass again the day
someone re-adds a different entry point.

### A2 · `backdrop` becomes the only cabin backend

Three backends exist — `3d` (`Cabin3D.tsx` + `scene3d/`, 11 files), `static` (`CabinStatic.tsx` +
`hotspots.ts`), `backdrop` (`backdrop/`, 34 files) — and every activity must be placed three times,
in three hand-tuned coordinate systems (`scene3d/anchors.ts`, `cabin/hotspots.ts`,
`backdrop/quads.data.ts`). `PROJECT.md` records which becomes the default as "still open" while
`game/store.ts` already defaults to `backdrop`.

**Decision: `backdrop` is permanent. `3d` and `static` are parked.**

**Change.**

- `game/store.ts`: drop `SELECTABLE_BACKENDS` and the `?cabin=` override. `cabinBackend` stops
  being state.
- **The headless tooling drives the parked backends and must be repointed.** `store.ts`'s own
  comment records it: `?cabin=static` is "what the headless screenshot tooling drives
  (tools/shoot.ts, tools/smoke.ts) since it needs no GPU." Three call sites —
  `tools/shoot.ts:68`, `tools/smoke.ts:99` (both `static`) and `tools/smoke.ts:166` (`3d`) — plus
  `smoke.ts`'s `shoot3dCabin` function, which exists only to screenshot the parked backend. The
  fix is to drop the query param and let the default serve: `backdrop` needs no GPU either, so the
  tooling's requirement is met. Two selector changes come with it — the root is
  `.cabin-backdrop`, not `.cabin-static`, and a prop is `[data-prop="nonogram"]`, not
  `[data-gadget="nonogram"]`.
- Park `Cabin3D.tsx` + `scene3d/`, and `CabinStatic.tsx` + `cabin/hotspots.ts`, on the **exact
  LITS / Minesweeper precedent**: left in the tree, still compiled, tests still running, removed
  from the render path, with "to reverse it" instructions recorded in `PROJECT.md`. Nothing is
  deleted.

> **"Hotspots" is overloaded in this app — read this before touching anything so named.**
> `cabin/hotspots.ts` is the **static** backend's percentage positions and is imported by exactly
> one file, `CabinStatic.tsx` (`staticHotspotStyle`); it parks. `.cabin-backdrop-hotspots` is the
> **backdrop**'s live SVG prop-polygon layer (`backdrop/CabinBackdrop.tsx`, its CSS, `fit.ts`, and
> the shelf's geometry tests all depend on it) and it **stays** — it is the thing that makes props
> clickable at all. The two are unrelated despite the shared word. Grepping `hotspots` and deleting
> the matches would remove the only interaction surface the product has left.

The cut is clean at one call site: `Cabin3D.tsx` and `CabinStatic.tsx` are each imported only by
`CabinView.tsx`, and `scene3d/` only by `Cabin3D.tsx`.
- `CabinView.tsx` collapses to rendering `CabinBackdrop`. Its authored-quads fallback goes away:
  `quads.data.test.ts` already requires a topic's backdrop room to cover every gadget in that topic
  exactly once, so **the build is the reachability guard** and a room cannot ship with unreachable
  activities. The fallback was protecting against a failure the test already prevents.

**Two consequences worth stating rather than sliding past.**

Retiring `CabinStatic` costs no hardware or accessibility coverage. `backdrop` is a still image plus
DOM polygons and uses no WebGL at all, so the "no-WebGL fallback" rationale dies together with the
3D path rather than surviving it. (Accessibility proper is **A5**, the Layer-3 mirror, which is out
of scope here and was never what `CabinStatic` provided.)

This **reverses** `PROJECT.md`'s "3D is the direction and the winner… the painterly static art is
not the target and never was the destination." The reversal is deliberate and must be recorded as a
reversal in `PROJECT.md`, not effected by quietly deleting the sentence. The reason is the one that
motivated the still plate in the first place: the reachable-in-WebGL fidelity ceiling is real, and
`#159`/`#166`/`#179` are where the fidelity actually came from.

### A3 · Amend PRD §5.2

§5.2 requires that "**One cabin's 3D loads at a time**, on a **single persistent canvas whose
contents swap** on enter/exit (never a fresh scene per cabin — the one architectural rule that must
not be violated)."

Today that rule is violated in fact: `<Canvas>` mounts inside `Cabin3D`, which `CabinView` renders
conditionally and unmounts on exit to the map. After A2 the rule is instead **moot** — there is no
3D canvas in the product's only path.

**Change.** Amend §5.2 to state that the rule governs any future 3D interior and is **dormant while
the interior is a still-plate backend**. Do not delete it. A rule whose justification is a 3× art
budget saving is precisely the kind that gets re-violated once the reason is forgotten, and the
walkable-overworld deferral in the same section is the model for how this repo records a dormant
decision.

Separate PR: `docs/prd/` is a different CODEOWNERS lane from `passion/apps/`.

### A4 · Reconcile three stale claims

All three were true before `#179` and are false after it:

| File | Stale claim |
|---|---|
| `passion/apps/mvp-jul24/PROJECT.md` | "`math` currently has zero activities in it"; the backend default is "still open" |
| `src/gadgets/registry.ts` | "the backdrop room for `math` is not authored"; the `math` entries "carry no `hotspot` that means anything yet" |
| `src/cabin/CabinView.tsx` | "only `logic-games` has been authored so far" |

`math` has five authored activities and `BACKDROP_ROOMS` contains both `LOGIC_GAMES` and `MATH`.

### A5 · Label the partial emission honestly

`PROJECT.md` logs this risk itself and gives the instruction: the backdrop backend's prop polygons
and the bookshelf emit nothing, so records are *silently partial* — they exist, look well-formed,
and under-count every prop opened through the backdrop. Its words: "Either wire the backdrop props
into emission before trusting any of it, or gate the backdrop out of sessions whose records are
analysed. **Do not split the difference.**"

Today the difference is split, and after A2 the backdrop is the *only* backend, which makes the
under-count total rather than partial.

**Change.** An explicit switch in `signals/session.ts` that makes emission-off the recorded state
rather than an unstated one. Wiring emission is measurement work and is out of scope; this is
truth-in-labelling, so that nobody later reads missing engagement as absence of engagement — the one
misreading `SurfacedRecord` exists to prevent.

## 4. Phase B — depth in the two rooms

### B1 · Give `logic-games` the ladder its generators already accept

The two rooms are asymmetric, and the older one is the flat one.

**`math` has two difficulty conventions, not one** — worth stating precisely, because "match what
math does" is ambiguous until you pick:

| Activity | Model |
|---|---|
| `GearTrain`, `BalanceScale` | **alternate** — `tierFor(round) = round % 2 === 0 ? 0 : min(1, TIERS.length - 1)` |
| `RatioMixing` | **alternate** — `tierForIndex(index) = index % 2 === 0 ? EASY_TIER : HARD_TIER` |
| `FunctionMachine`, `FractionLaser` | **climb and cap** — `Math.min(MAX_DIFFICULTY, round)`, cap 2 |

Three of the five alternate rather than climb, and `RatioMixing.tsx` says the alternation is
deliberate: "Tiers alternate so a session meets both benches."

**Corrected during implementation — the original claim here was half wrong.** This section first
said both `Nonogram` and `Pipes` were stuck at their easy defaults. Only `Nonogram` was:
`Nonogram.tsx` called `generatePuzzle(nextGeneratorSeed(base))` and took the generator's default
`size = 5` forever. `Pipes` already alternated — `Pipes.tsx:57` read
`const size = puzzleIndex % 2 === 0 ? EASY_SIZE : HARD_SIZE`, with a comment saying it varied
"sizes so both get exercised over a play session". The error came from reading the `generateLevel`
call site alone and inferring that its `size` argument was a defaulted prop, without reading where
that argument came from.

So the real gap was **one** of the four `logic-games` puzzles, not two. `Nonogram` gets the
alternating ladder; `Pipes` gets refactored onto the same exported `SIZES` / `sizeForRound` shape
with its behaviour unchanged, which is worth doing only because a shared convention is what makes
the next puzzle's author copy the right thing.

**Change.** Give `Nonogram` and `Pipes` the **alternating** model, and use that word rather than
"ramp". Alternation is chosen over climb-and-cap for three reasons: it is the majority convention
already; `RatioMixing` records it as intentional; and a monotonic climb is an escalation the child
never chose, which is the same objection B2 exists to answer. Unifying `FunctionMachine` and
`FractionLaser` onto it is **out of scope** — they are not broken, and changing them buys nothing
this design is for.

`Mirror` and `Chess` are to be inspected before assuming a parameter exists: `Chess` is a curated
bank (`bank.ts`, `freeplay.ts`), so its ladder is bank selection rather than generation, and it may
have no sensible tier at all — in which case that is recorded, not forced.

**Test.** Per puzzle: consecutive rounds are not all the same tier.

### B2 · Offer a harder variant, do not only ramp automatically

`math`'s automatic per-round ramp is §11-clean — it is not contingent on anything the child sees as
a prize — but it has two weaknesses. It can outrun a child who wanted another go at the same
difficulty, and it produces none of the behaviour §8.5 defines as `chosen_challenge`: *took the
harder variant though an easier one was offered.*

**Change.** One shared control offering a harder variant explicitly, with the easier one still
available.

**Where it goes, corrected.** There is **no "Next puzzle" button in `GadgetOverlay`** — each puzzle
owns its own (`Nonogram`'s `nextPuzzle`, `RatioMixing`'s "Next order", and so on). The overlay's one
shared post-solve surface is its `Solved` component, which every puzzle reaches through `onSolved`.
So the control belongs in `Solved`, and the tier it selects has to reach the puzzle: `PuzzleProps`
gains an **optional** `tier?: number`, the overlay owns the tier as state and passes it down, and
puzzles that do not support tiers keep compiling untouched. Optional is what keeps this a small
change across nine components instead of a required-prop migration.

**Constraints, all three load-bearing.** It is a choice, never a gate — `PROJECT.md`'s
nothing-is-gated rule stands, and the reason is that gating depth on completion would launder an
ability measure into a depth measure. No achievement copy. And **no visible tier number climbing**,
which would reintroduce exactly the quantified engagement display A1 removes.

This is the one Phase B item that both improves play now and keeps the cut lane buildable later:
building the affordance is what makes `chosen_challenge` observable if measurement is ever resumed.
**We record nothing.**

### B3 · Make the twin pair discoverable

Mirror Maze / Fraction Laser is deliberate and load-bearing — the same shell with only the content
binding varied, the in-product analogue of the Zombie Division design (**75.7 min vs 10.28 min** of
free-choice play, r = .89), and per `PROJECT.md` the mechanism by which "loves deduction" is told
apart from "loves mathematics" *by observation*. A player currently has no way to notice the two are
one shell.

**Change.** Static cross-reference only: each one's shelf card names the other, and each teach-in
mentions it. Both cabins already have authored shelf cards plus an invitation card, so this extends
`shelf/cards.data.ts` rather than adding a surface.

**Explicitly not** "you liked this, try that." A system-surfaced nudge is the `prompted`-versus-
voluntary distinction the engine is built on, and priming a child toward the twin would destroy the
comparison the pair exists to enable. The cross-reference must be inert.

### B4 · Improve the Function Machine prop

`PROJECT.md` names it the weakest read of the five `math` props — "closer to a curio cabinet than a
machine" — and the one to improve first if any is revisited. Regenerate that single object and
re-trace its quad in `backdrop/quads.data.ts`. `quads.data.test.ts` keeps coverage honest.

## 5. Testing

Phase A is mostly deletion, so its tests are guards against return rather than tests of new
behaviour:

- no child-reachable path renders a time-on-task figure (A1);
- one backend, and `quads.data.test.ts` unchanged and still enforcing exactly-once coverage (A2);
- parked subsystems still compile and their existing suites still pass (A2) — the LITS/Minesweeper
  precedent requires it.

Phase B: per-puzzle tier-variation tests (B1); an offered-not-forced test for the overlay control,
plus an assertion that no tier number is rendered (B2); `cards.data.test.ts` extends to the
cross-reference, which is data (B3); `quads.data.test.ts` covers the regenerated prop (B4).

## 6. What this changes in `PROJECT.md`

Three amendments, each to be written as an amendment rather than a silent edit:

1. **The backend fork is closed.** "Which becomes the default is still open" → `backdrop` is
   permanent; `3d` and `static` are parked. This **reverses** "3D is the direction and the winner,"
   and the reversal and its reason are recorded (§3, A2).
2. **The child-facing readout is gone**, with the §11 clauses it violated recorded so it is not
   re-added as a feature (§3, A1).
3. **The stale `math` claims are corrected** (§3, A4).

The nothing-is-gated rule, the fixed camera, the swap test as the bar for any new activity, and the
measurement deferral all stand unchanged.

## 7. PR sequence

Nine PRs, each inside AGENTS.md's ~400-line limit:

| # | Change | Size |
|---|---|---|
| 1 | A1 retire the child-facing readout | small |
| 2 | A2 single backend, park `3d` + `static` | medium, mostly deletion |
| 3 | A3 PRD §5.2 amendment | docs, separate lane |
| 4 | A4 reconcile the three stale docs | docs |
| 5 | A5 emission switch | small |
| 6 | B1 `logic-games` difficulty ladder | medium |
| 7 | B2 offered harder variant | small |
| 8 | B3 twin-pair cross-reference | small, data |
| 9 | B4 Function Machine prop | art + one quad |

**Ordering matters in exactly one place: A2 before B1 and B2.** Parking two backends removes the
three-coordinate-system placement tax that would otherwise apply to every Phase B change. Everything
else may be reordered freely. A1 is first because it is a live §11 violation, and it is independent
of all the rest.
