# The Code cabin — design

**Status:** design, approved 2026-07-28 · not yet built
**App:** `passion/apps/mvp-jul24`
**Reads with:** `passion/apps/mvp-jul24/PROJECT.md` (the roster rules and the swap test),
`docs/superpowers/specs/2026-07-27-music-cabin-design.md` (the room this one copies procedurally and
learns from substantively), `docs/prd/DISCOVERY-APP-PRD.md`, `docs/prd/passion-roadmap.md` (A2).

## What this is

The fourth cabin in the discovery game: `code`, currently a mist-washed horizon signpost on the map.
It ships three activities, one shared program runtime, one painted room, and the crosswalk rows that
make its engagement reach the belief math.

It is deliberately **not** the room anyone would design first for "code," and §2.4 records the two
activities that were rejected to get here.

---

## 1. The problem that actually needs solving

The app can tell a guide that a child likes *figuring things out*. It cannot tell them anything else.

`passion/packages/discovery-catalog/src/gadgets.ts` maps all twelve shipped gadgets onto the product
taxonomy's work-mode axis, and the distribution is this:

| mode | gadgets |
|---|---|
| `investigate` | 11 of 12 |
| `build` | 2 — Pipes, Gear Train |
| `perform` | 1 — Chess |
| `debug` | 1 — Tune Repair |
| `compose` `explain` `persuade` `collaborate` `care` | **0** |

Three rooms are live and every one of them asks the child to **judge a system somebody else built**.
So the two-axis model (`009-two-axis-tagging`) is running as a 3×1 matrix: no marginals on the style
axis, and no way to distinguish a child who wants to make things from a child who wants to work
things out. That is the same class of failure as the `math`/`logic-games` split — a read that names
the wrong construct — except on the other axis.

**Why `code` and not `art`.** Both remaining rooms fix this. `art` fixes it harder, because
`compose` is at zero and `art-motion` is unreachable, and because every puzzle-shaped art activity
collapses into another room (symmetry is geometry, colour-mixing is Ratio Mixing, pattern completion
is deduction) — which *forces* an art room to be compose-shaped and therefore non-duplicative by
construction. `code` was chosen anyway, on 2026-07-28, for reasons outside this document: it is the
higher-value domain for the specialization path this product exists to feed, and its crosswalk row
already exists. Recorded here because the trade-off was real and the next person should not have to
re-derive it. **`art` remains the room with the largest measurement gain, and is the obvious next
one.**

**So be precise about what this room does and does not fix.** It opens **no new column** on the style
axis: `build` and `debug` both already have entries. What it does is take `build` from two gadgets to
four and `debug` from one to two, in a new domain — which turns two modes with a single-digit evidence
base into two the inference engine can actually form a belief about, and adds a `code-computers` read
where there was none. That is a real gain and it is not the gain §1 opened with. The degenerate style
axis is **narrowed, not fixed**, and §10.5 keeps the score.

**The danger `code` brings with it.** The first activities anyone proposes for a code room are
constraint-satisfaction puzzles in a terminal skin, and this app already measures constraint
satisfaction four times in `logic-games`. Shipping one here would produce the exact false positive
the logic/math split was created to remove: a child liked deduction, and the guide is told they like
programming. That risk is why §1.1 exists and why §2.4 is as long as it is.

### 1.1 The binding rules — X1 and X2

Music needed two rules because the first was not sufficient (R1 banned printed numerals; it did not
stop a layout from *being* a number line). Code's failure mode is different in content and identical
in shape, so it gets the same treatment.

> **X1 — the difference between a right and a wrong answer must require *executing* the program.**
> Not reading a picture of it. If the child can reach the answer without any notion of the program
> running, what the room measures is not programming.
>
> **X2 — no door may be solvable by matching a static image.** A drawn path, a traced shape, a
> diagram of the finished state: if that suffices, the room is a visual pattern task and the code is
> decoration.

X2 is not hypothetical. The obvious build for Sprite Loop (§2.1) is to draw the target motion as a
trail, which converts it into "match this shape" — R2's failure in visual form, in a room that has
not been built yet. Naming it before the build is the whole point.

**Reading code to predict what it does satisfies X1** and is not a violation. That *is* the domain
skill. What X1 forbids is a door solvable as a non-code task.

---

## 2. The gadget roster

**Three doors, three subtopics, three verbs.** Blocks on the first, typed on the other two — a
gradient by design, decided 2026-07-28: a child who climbs from the block door to a typed one has
told us something, and it inverts cleanly against the existing `chosen_challenge` /
"try a harder one" model in `GadgetOverlay`.

| id | Name | Construct | Representation | Subtopic | Mode / verb |
|---|---|---|---|---|---|
| `sprite-loop` | Sprite Loop | behaviour construction over time | blocks | `game-dev` | `build` / assemble |
| `trace-repair` | Trace & Repair | reading execution to locate a defect | typed edit | `python` | `debug` / fix |
| `teach-helper` | Teach the Helper | specification that generalises | typed | `agentic-engineering` | `build` / assemble |

**Three different subtopics, on purpose.** The music room's recorded defect is that all three of its
activities map to `music-sound/music-theory`, so it can report that a child likes musical structure
and cannot report whether it was melody, harmony or rhythm that held them — the distinction exists in
the activities and has nowhere to land. This roster is authored against that: each door reaches a
different `code-computers` subtopic, so the room's read decomposes.

### 2.1 `sprite-loop` — Sprite Loop *(blocks)*

A creature loops through a motion pattern. The child assembles blocks so theirs moves the same way.

**Construct:** constructing a behaviour that unfolds over time. What the child produces is a working
artifact, which is `build`.

**No maze. No obstacles. No goal tile.** The board is empty. "Reach the goal past the obstacles" is
constraint satisfaction, which is Pipes, and shipping it here is the false positive §1 describes. The
target is *motion*.

**How X2 is satisfied.** The demonstration is a continuously looping ghost with **no persistent
trail**, so there is no shape on screen to match. And at least one tier pairs patterns that trace the
**same shape at different timing** — same path, different `wait` values — so shape is provably
insufficient and the child has to attend to execution. That tier is the concrete form of X1 in this
door, and §7 turns it into a test.

**Affordance, not explanation.** Per the standing ruling that a child who cannot find a mechanic
needs the affordance fixed and not more copy:

- the tray shows **every** available block, always;
- `repeat` renders as a visible bracket enclosing its body, so nesting is a shape rather than a
  syntax;
- an illegal drop reads as *unavailable*, never as silently absent — a missing control and a visibly
  disabled one teach different things;
- holding a block **ghosts where the creature would go**, so the mechanic is learned by consequence
  before it is committed.

**Solve:** the child's trace matches the demo's trace over one full period.

### 2.2 `trace-repair` — Trace & Repair *(typed edit)*

A short program, its intended result, and its actual result — all three on screen, the last two
different.

**Construct:** reading execution to find where behaviour diverged from intent. This is `debug`, verb
`fix`, the same shape as Tune Repair on the mode axis and nothing like it otherwise.

**The instrument is a step scrubber.** The child drags through steps and watches variables and output
update. The defect is a wrong value, a wrong comparison, an off-by-one bound, or a swapped pair of
lines. They edit **exactly one line**, typed in place — which means an expression parser and no
structural parser, and no free-form file editing to get lost in.

**No prose anywhere in the puzzle.** This is the Logic Grid objection handled directly: Logic Grid
was dropped from `logic-games` because it loads on reading comprehension as much as deduction, making
engagement unattributable. So the programs carry code only, the intended result is shown as **state
rather than a sentence**, and names are single letters or single short words.

**Solve:** output equals intended output.

### 2.3 `teach-helper` — Teach the Helper *(typed)*

A helper stands in a small scene with a task — parcels to shelve, say. The child writes it a short
instruction list. The instructions then run on **three hidden start conditions**, and instructions
that work only for the visible case fail the others.

**Construct:** specification that generalises. This is the `agentic-engineering` subtopic as it
actually is, and it is not any other room: there is no single arrangement to find, no arithmetic, and
nothing perceptual. A child who is good at this is good at saying exactly what they mean, which is
worth detecting and which nothing else in the app detects.

**The vocabulary is fully displayed and complete.** That is the design's load-bearing constraint, not
a UI nicety: an interpreter meant to be amusingly literal is one step away from
guess-what-the-parser-wants, and PROJECT.md forbids difficulty that resolves to reading the
designer's mind. So the whole vocabulary is on screen, each word's rule appears in the teach-in
diagram, and when ambiguity makes the helper do something silly the replay shows **which instruction
it was executing** at the time.

**Offline, therefore deterministic.** `src/shelf/types.ts` makes offline a hard requirement, so the
helper is a small rule engine and never a model. This is the same constraint that forced the music
room to synthesize audio rather than ship samples.

**Solve:** passes all three conditions.

**This is the door most likely to fail on contact.** §10 carries the fallback.

### 2.4 Rejected, so they are not re-proposed as obvious omissions

**Turtle-drawing a shape with a loop.** The mechanic is `360 / n`. That is arithmetic wearing a pen,
the same failure as the music room's `transpose` — an idea that is genuinely part of the domain, in
an operationalisation that belongs to `math`. Rejected.

**Wire the machine so it works.** Routing, which is Pipes. It would report hardware interest for a
child who likes networks. Rejected.

Both are the *first* things proposed for a code room, which is why they are on paper.

**Three, not four.** The music spec set the precedent explicitly: "Three gadgets would have been a
defensible roster; padding to four with `transpose` would not." There is no fourth door here that
survives §1.1 and §2.4, so there is no fourth door. Cross-room density becomes **4 / 5 / 3 / 3**;
cross-cabin comparison was already invalid for reasons PROJECT.md's Risks section gives, and this
neither improves nor worsens that and must not be claimed to.

---

## 3. The shared runtime

`src/code/` — pure domain logic, no components, no React.

- **`program.ts`** — the IR, kept minimal: `move n`, `turn`, `wait n`, `repeat n [...]`,
  `set x = expr`, `if cond [...]`.
- **`interpret.ts`** — a **stepper**: `step(state) → state`, not a `run()`. Stepping is what makes
  execution visible, and it is what §2.2 is built on. Deterministic, seeded, no clock.
- **`trace.ts`** — `run(program, limit) → Trace`, with a **step cap**, so a non-terminating program
  is a *reported outcome* — "it never stopped" — rather than a hang or a shaming failure. A program
  that does not terminate is a real thing that happens in this domain and the room should say so
  plainly.

**One language across all three doors.** The doors differ in what the child edits and in what counts
as done; they never differ in what a program is. That is what makes the blocks→typed climb in §2
meaningful — a child moving from Sprite Loop to Trace & Repair meets the same language in a new
representation, not a second language. Two languages would make the climb a change of subject.

**All three solves are verified**, so `PuzzleProps.onSolved` works unchanged and this room needs no
new signal plumbing. (Worth stating because the alternative — a compose-shaped room with
self-declared completion — would have needed it, and `art` still will.)

---

## 4. Signals and the crosswalk

Rows for `passion/packages/discovery-catalog/src/gadgets.ts`:

```ts
["sprite-loop",  ["code-computers", "game-dev"],            ["build"],               "assemble"],
["trace-repair", ["code-computers", "python"],              ["debug", "investigate"], "fix"],
["teach-helper", ["code-computers", "agentic-engineering"], ["build"],               "assemble"],
```

`TOPIC_CABINS` already contains `code: ["code-computers"]` — the crosswalk anticipated this room, so
the cabin-level invitation card needs no change there. `trace-repair` affords two modes and resolves
to one (`fix` → `debug`), which is the same shape as `tune-repair` and is fine: afforded is a
superset and the verb decides the primary.

### 4.1 `explain` is not reachable, and this spec does not make it reachable

The design claim that Teach the Helper affords `explain` does not survive contact with the resolver.
`resolveEngagedModes` takes candidates from the **verb's** rule list intersected with the artifact's
afforded modes, and no verb in `ACTION_MODE_RULES` lists `explain` alongside `build` — `assemble`
yields `build` alone. Reaching `explain` would mean adding a verb (`"specify": ["build", "explain"]`)
to `passion/packages/two-axis-tagging/src/resolver.ts`.

**Decided: do not.** A mode that resolves is worth more than a mode added so a design claim reads as
true, and an engine-package change does not belong in the same work as a game room. `explain` stays
at zero coverage and stays recorded as a gap. Whoever wants it should add the verb deliberately, with
its own tests, and Teach the Helper will be waiting to afford it.

---

## 5. Art

One plate, `public/art/cabin-backdrop-code.png`, 1536×1024, in the same style, framing and light as
the other three. **Equal polish is a measurement requirement** (PRD §5.3): uneven art makes the topic
ranking inherit the production schedule instead of the child's interest.

Four surfaces, wide empty wall between them so hit regions can be generous without touching:

| surface | for |
|---|---|
| an automaton on a bench | `sprite-loop` |
| a workbench with a paper-tape reader showing a trace | `trace-repair` |
| a clockwork servant beside a lectern with an open instruction book | `teach-helper` |
| a bookcase | the shelf (§6) |

**Method, copied from the music room because it caught a real defect.** Corners read off a labelled
grid burned over the plate (`node scripts/art-inspect.mjs grid`), then every outline **composited back
over the plate at 1:1 and inspected** — not screenshotted in a browser, which scales down far enough
to hide a 20px miss. `aliveness` regions measured from pixels rather than from what the painting looks
like at a glance.

`kind` is `object` unless a surface is genuinely a flat plane; the tape reader may qualify and could
then carry a live preview. Decided at trace time, against the actual plate.

**The map plate regenerates, as a new file.** `MapScreen` has loaded `/art/map-v2.png` since
2026-07-27 — three equally-lit near cabins — and the older two-cabin `map.png` was **deliberately not
overwritten or deleted**. So this room adds **`map-v3.png`**: four equally-lit near cabins and one
mist-washed horizon cabin (`art`). Following that convention rather than overwriting keeps a revert to
a one-line change and matches the repo's standing preference for a new file over an edited shared one.

Promoting a cabin without repainting the map ships the Javora confound — children chose the prettier
version of the *same* game 62% of the time, d > 0.86 — against the topic just promoted. Node
coordinates in `cabins.data.ts` are measured against whichever plate is loaded, so **all five nodes
get re-measured** on the new plate, not just `code`.

**Roster before art.** `quads.data.test.ts` matches props to registered gadgets exactly in both
directions, so a surface painted for an absent gadget fails the suite and a gadget with no surface
fails it too. The roster in §2 is therefore final before the plate is generated, and cutting a door
afterwards means a repaint.

---

## 6. The rest of the room

**Teach-in — required, and not the mechanism.** Three entries in `src/teachin/rules.tsx` with three
inline SVG diagrams in `diagrams.tsx`; every activity in this app must be explained, so difficulty
never becomes a read-the-designer's-mind test. But the standing ruling is that explanation is **not a
sufficient fix** for discoverability, so each door carries its own affordance and the spec names it:
the ghost preview (§2.1), the step scrubber (§2.2), the displayed vocabulary (§2.3). Teach-in
supports an affordance that already reads as usable; it is never the mechanism.

**Shelf.** Three to six new hand-authored cards in `src/shelf/cards.data.ts`: exactly one
`invitation`, `body` a two-string tuple pitched 9–12, each with a **real source that was actually
fetched**. `library.ts` has no `code-computers` entries, so none of this can be borrowed from the
curated library — the shelf reads hand-authored cards and nothing in the app calls `curatedForCell`.
A test greps card prose for score/point/streak/star/timer, so the writing avoids them. Nothing on the
shelf is gated, deliberately: gating depth on completion would make "went deeper" a function of
`solves`, which indexes prior ability.

**Accessibility.** Nothing in this room requires hearing, which is free rather than earned. It is
**not** a fix for the Layer-3 parity break the music room introduced, and this spec does not claim
one. Parity work is **deprioritized as of 2026-07-28 (admissions: not a concern right now)**, so no
effort is spent here beyond keeping the blocks door fully operable by click alone. The music room's
break stays on the books and the pre-live gates will surface it again.

---

## 7. Testing

Standard per-puzzle shape, one directory per door: `generate.ts` / `logic.ts` / `naive.ts` (a
reference solver proving the intended solve is reachable and, where the puzzle claims it, unique) /
`harness.tsx` / tests. All domain logic pure and out of the components.

`src/code/` gets its own suite: interpreter determinism, the step cap, trace equality.

Existing suites that will need rows rather than rewrites: `quads.data.test.ts`, `registry.test.ts`,
`catalog-covers-registry.test.ts`, `cards.data.test.ts`, `anchors.test.ts`, `MapScreen.test.tsx`,
`cabins.data.test.ts`, `teachin/mounted.test.tsx`.

### 7.1 An X1 guard per door

Music's failure was not a missing test. It was a test asserting the puzzle was *"fully solvable in
silence"* — read as proof the dual-coding requirement was met, when it was proof the audio was
decoration. The cheapest available protection is to invert that assertion into a guard, so:

- **Sprite Loop** — a test that two distinct programs produce **identical trails but different
  traces**, proving trail-matching is insufficient and the door cannot be solved by shape.
- **Trace & Repair** — a test that the defect is not identifiable from the initial and final states
  alone; locating it requires an intermediate step.
- **Teach the Helper** — a test that for every puzzle, at least one instruction list passes the
  visible condition and fails a hidden one, proving generalisation is what is being asked for.

A door whose guard cannot be written has failed X1 and does not ship.

---

## 8. Change surface

New: `src/code/` (3 files + tests) · `src/puzzles/SpriteLoop/` ·
`src/puzzles/TraceRepair/` · `src/puzzles/TeachHelper/` · `public/art/cabin-backdrop-code.png`.

Edited: `src/gadgets/registry.ts` (3 entries) · `src/map/cabins.data.ts` (`code` → active) ·
`src/cabin/backdrop/quads.data.ts` (a `CODE` room) · `src/cabin/hotspots.ts` ·
`src/cabin/scene3d/anchors.ts` · `src/shelf/cards.data.ts` · `src/teachin/rules.tsx` ·
`src/teachin/diagrams.tsx` · `passion/packages/discovery-catalog/src/gadgets.ts` ·
`src/map/MapScreen.tsx` (one line: the plate it loads).

Also new, not edited: `public/art/map-v3.png` (§5).

**Four of those are the files concurrent worktrees collide on** — `registry.ts`, `cabins.data.ts`,
`quads.data.ts`, `cards.data.ts`. Four worktrees were live on this app at once on 2026-07-27. Rebase
onto the remote branch rather than merging back, and expect someone to merge `main` into the branch
mid-flight.

### 8.1 PR shape

Music's precedent, for the reason given in §5 — the art pass makes the roster irreversible, so the
roster gets built and played before it gets painted.

1. **PR 1** — `src/code/` runtime + Sprite Loop, played through its own `harness.tsx`. Not
   registered, no room, no art.
2. **PR 2** — Trace & Repair + Teach the Helper, same treatment. §10.1 resolves here or the fallback
   ships.
3. **PR 3** — the room: plate, quads, aliveness, registry, crosswalk rows, map regeneration,
   `cabins.data` flip, shelf cards, teach-in.

Each under ~400 lines. The roster is final entering PR 3.

---

## 9. Out of scope

The `art` cabin (§1 argues it is next). The `explain` verb (§4.1). Any change to the belief math, the
signal pipeline, or `PuzzleProps`. A second language. Curated-library entries for `code-computers` —
the shelf is hand-authored and the library is a separate concern.

---

## 10. Risks and open questions

**10.1 Teach the Helper may not be honest enough to ship.** A deliberately literal interpreter is one
step from guess-the-parser. §2.3's mitigations — complete displayed vocabulary, per-word rules in the
teach-in, replay naming the instruction being executed — are the plan, and they may not be enough.
**Fallback, decided now so PR 2 does not stall on it: `abstract-it`** — factor a program's repeated
chunk into a named routine, verified by running identically in fewer steps. It is fully verifiable,
it is squarely `build`, and it costs the `agentic-engineering` subtopic (falling back to `python`),
which makes the room's read less decomposable. Take the fallback only if the mitigations fail on a
real player, not on a hunch.

**10.2 Sprite Loop could regress into shape-matching** during implementation, since drawing the trail
is the easier build. §7.1's guard is the protection and must be written before the component.

**10.3 Typed doors assume a keyboard.** Unknown what the target device is. If it is a tablet without
one, two of three doors need rework, which would be discovered late. Cheap to check early and worth
checking before PR 2.

**10.4 No playtest.** This design is derived from constraints already in the repo, not from evidence.
The music room's first playtest — one adult, one session — reported "this is really hard" and changed
the design; an adult struggling means a nine-year-old struggles more. Budget one playtest before PR 3,
because that is the last point where the roster is still cheap to change.

**10.5 `explain` stays at zero** by the decision in §4.1, so the style axis remains four-of-nine
covered after this room ships: `investigate`, `build`, `debug`, `perform`. Better than one-of-nine and
not close to done.

**10.6 The room cannot report which door held a child if the subtopics prove too fine.** §2 claims
three subtopics decompose the read; whether `game-dev` / `python` / `agentic-engineering` are
distinguishable *to the inference engine* at realistic sample sizes is unvalidated, and is the same
class of question as G5 calibration. If they collapse in practice, the room degrades to a
cabin-level read — which is still better than the music room's, and should be reported rather than
patched over.
