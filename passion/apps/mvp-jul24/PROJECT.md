# PROJECT — Discovery Cabins (`mvp-jul24`)

The durable record of this app's direction and the decisions behind it, as locked in the design session
of **2026-07-25**. It sets **what** and **what-not** and, where the reasoning is non-obvious, **why** —
so the next person does not have to re-derive it or quietly reverse it. It does not prescribe
architecture; that is the loop's job.

Read alongside `docs/prd/DISCOVERY-APP-PRD.md` (the canonical spec, which this app is one implementation
slice of) and `docs/research/passion-pipeline/06-activity-design-ages-6-8.md` (the evidence base cited
throughout; its **§8 amendment** is authoritative where it conflicts with its own §3/§5).

## Mission

A point-and-click passion-finder: a click-to-select 2D map of topic cabins → a 3D cabin interior → click
a prop → an activity opens as an overlay. **There is no locomotion anywhere** — no avatar on the map, no
walking in the rooms. Both layers are point-and-click (PRD §5.2, revised 2026-07-25). The question it answers is narrow and stated in the memo's §8.1 —
**which topic interests this child** — read from what they choose and come back to. It is not a project
tool, not an assessment, and not an input to the Evidence Graph.

**Target band: ages 9–12**, in a gifted context. High difficulty is acceptable and wanted — with one
binding condition attached: **every activity is explained** (see *Teaching*). Difficulty is not allowed
to become a reading-the-mind-of-the-designer test.

> **Age-band note, recorded honestly.** The PRD covers 6–14 and the research memo's evidence is specific
> to **6–8**. This app targets **9–12**, so the memo's age-bounded figures (block length, the vigilance
> decrement, the ~51-day parent-report window, child reward effect sizes, the in-session-telemetry null
> at 7–8) are *not* known to hold here. The structural claims we lean on — intrinsic integration,
> choice-over-duration, direct instruction over unguided probing — are not age-bounded.

## Structure: two cabins, one split

Two cabins are built:

- **`logic-games` — "Logic Games."** Holds four deduction puzzles: **Nonogram, Pipes, Mirror Maze,
  Chess Puzzle.** It held seven until 2026-07-25; see *The trim to four* below.
- **`math` — "Math."** Reserved for **genuinely mathematical** activities; nothing else goes in it. It
  opens on day one as a real, furnished, deliberately **gadget-free** room, so the split is visible to a
  player from the start rather than arriving later as a surprise new cabin.

`music` / `code` / `art` stay on the map as visible **"coming soon"** buttons. They are build state, not a
design statement (memo §8.1.4) — but see *Risks*, because visible-but-empty is not free.

**Music has two built activities that no room shows yet, and that is deliberate.**
`src/puzzles/TuneRepair/` (a melody with one note out of key) and `src/puzzles/ChordFit/` (which of three
chords holds a note up) are both finished and tested, and `src/audio/` is the app's first sound: synthesized at runtime, never
sampled, because `src/shelf/types.ts` makes offline a hard requirement and an audio file would be the
first asset to break it. It is **not** in `src/gadgets/registry.ts`, because `quads.data.test.ts` matches
prop polygons to registered gadgets *exactly in both directions* — so registering it demands a painted
music room, and painting one demands the gadget roster be final first. Until then each is played through its own
`harness.tsx`. The design, the roster, and why `transpose` was rejected are in
`docs/superpowers/specs/2026-07-27-music-cabin-design.md`.

Two rules bind anything else built for this room, and the second one exists because the first was not
enough.

**R1 — the visual channel is musical notation, never numeric.** Pitch is vertical position, duration is
horizontal extent, and no music gadget may display a number, note name, interval name or ratio as part
of its solvable state. A channel showing semitone counts would make the puzzle arithmetic, which is the
`math` cabin — the same swap-test failure as memo §5's C1 from the other direction.

**R2 — the property that makes an answer wrong must have no visual signature.** Tune Repair originally
defined "wrong" as a note breaking the melody's *shape*, which satisfies R1 completely and is still a
**visible** property: as blocks on a grid it is "find the bar that breaks the pattern", solvable with
the sound off, which is what the first player said in one sentence. Two of its own tests had asserted
the puzzle was "fully solvable in silence" and treated that as a feature.

So R1 is necessary and nowhere near sufficient: it bans printed numerals, not a layout that *is* a
number line. Before building anything else here, name what makes an answer wrong and ask whether an eye
can see it. Tune Repair's wrongness is now **out of key** — audible as sour, invisible on a chromatic
roll. Chord Fit was designed against R2 from the start and therefore **draws nothing at all**: three
identical buttons whose only difference is what they sound like, because the spec's original plan to
stack each chord's notes "so interval spacing is visible" was the same mistake a second time.

**The cost is recorded rather than hidden: neither gadget can be solved without hearing it**, so their
Layer-3 accessibility parity (PRD §5.2) is broken. Applying R2 to the rest of the roster showed this is
not fixable by a cleverer gadget — every audible-only activity excludes a deaf child by definition — so
the room needs a musical activity that is **not a perceptual one** (notation, instrument mechanics,
constructing to a written pattern). Nothing designs that yet; it is risk 5a in the spec.

**The `math` topic id is deliberately reused to mean a different room.** It previously meant
"Math & Puzzles" and held all seven puzzles; it now means the maths room only, and the puzzles move to
`logic-games`. Anything keyed on `math` from before the split refers to the old, mixed room and is not
comparable to the new one.

### Why the split exists

Per memo §5 conflict **C1**: all seven puzzles **survive replacing every numeral with an arbitrary
symbol** and play identically. By the swap test (§2.1 / **D1**) that means they are intrinsically
integrated for **deduction, not for mathematics** — a child who loves them has told us they love
constraint satisfaction, and we would be mislabelling that as mathematical interest. Filing them under
`math` produced a 1×1 matrix that cannot be decomposed: no marginals, no topic-vs-style attribution.

**The swap test is the standing bar for any new activity** (§2.1 / D1): *if the domain content could be
replaced with arbitrary symbols and the activity would still play the same, the binding is extrinsic and
what we measure is wrapper engagement, not domain interest.* An activity that fails it may still ship as
a trigger; it does not get to be evidence.

### The trim to four — DECIDED 2026-07-25 (was deferred; no longer)

**Logic Games dropped from seven activities to four.** Out: **LITS**, **Logic Grid**, **Minesweeper**.
In: Nonogram, Pipes, Mirror Maze, Chess Puzzle. This was recorded here as a *deferred* option; it has
now been taken, and the thing that took it was the art rather than the argument.

**What forced it.** The cabin's backdrop plate gives four surfaces that can hold a puzzle without
wrecking the room's composition. An attempt to manufacture six produced a wall of identical blank
frames and was thrown away. Two of the seven backdrop props were already parked on borrowed surfaces
— a chimney breast and a 310×78 bookshelf gap rendering a 6×6 board at ~13 px a cell — which was the
same constraint showing up earlier and being worked around instead of accepted.

**Why these three, unchanged from when this was a deferral.** **LITS** is the least legible to a
spectator watching over a shoulder. **Logic Grid** is reading comprehension as much as deduction, so
it loads on a second construct and its dwell time is not cleanly attributable. **Minesweeper**
duplicates Nonogram's construct while adding a luck element and a lose-state neither of the others
has. Four is also far closer to density-matching the five planned maths games than seven was — which
does **not** license cross-cabin comparison (see *Risks*, which is unchanged on that point) but does
stop raw door count being the loudest difference between the rooms.

**What was actually removed: three registry entries.** Nothing was deleted. `src/puzzles/LITS/`,
`src/puzzles/LogicGrid/` and `src/puzzles/Minesweeper/` are all still in the tree, still compiled,
still covered by their own passing test suites, and their wall-preview renderers are still registered
and tested. Their hand-tuned 3D placements (`scene3d/anchors.ts`) and static-cabin positions
(`cabin/hotspots.ts`) were deliberately left in place too, because those were measured by eye and are
not re-derivable from the numbers. The three puzzles are simply not listed as activities, so nothing
routes a player to them, and they are not in the production bundle.

**To reverse it** (per-puzzle): re-import the component and re-add its entry in
`src/gadgets/registry.ts`, then author a prop quad for it in `cabin/backdrop/quads.data.ts`. Only the
last step is real work, and it is the step the art constrains — `quads.data.test.ts` requires the
backdrop room to cover every gadget in the topic exactly once, so a re-add without a real painted
surface fails the build rather than shipping a puzzle floating on a wall. Those three quads *were*
deleted, unlike the placements above, because they were traced onto one specific plate that is being
regenerated and would be wrong on arrival.

### The five planned maths games

**Balance Scale · Gear Train · Fraction Laser · Function Machine · Ratio Mixing.** Each must pass the
swap test — the maths has to *be* the mechanic, not a quiz bolted onto one.

### The twin pair: Mirror Maze / Fraction Laser

Deliberate and load-bearing. **Same shell; only the content binding differs.** Mirror Maze is
reflect-the-beam as pure spatial deduction; Fraction Laser is the same shell where the beam's behaviour
is governed by fractional quantities.

This is the in-product analogue of the Zombie Division experimental design (memo §2.1): the shell held
**literally constant**, only the binding varied, producing **75.7 min vs 10.28 min** of free-choice play
(r = .89). Holding the shell constant and varying only the binding is also the mitigation C8 asks for
against cross-cabin confounds. Concretely, the pair is **how "loves deduction" is told apart from "loves
mathematics"** by observation rather than by inference: the child who plays both and the child who plays
one are giving different answers to the same question.

## Depth and unlocking: nothing is gated

- **Every activity is always open.** No prerequisites, no locks, no sequence.
- **A bookshelf in each cabin is always openable, with all of its contents available.** No partial
  reveal.
- **No completion-triggered offer**, for now. Solving something does not unlock, surface, or suggest
  anything.

### Why — this is the non-obvious part, do not reverse it casually

Gating depth on completion would make **"went deeper" a deterministic function of "solved it."** And
`solves` indexes **prior ability**: r = .37–.44 against pre-test, and *null* against learning gain, with
accuracy even inverting in the less-effective condition because those children attempted half as many
items (memo §2.4, §8.6). A completion gate would therefore launder an ability measure into a depth
measure and we would never see it in the data, because the two would be the same variable.

Leaving the door always open is precisely what makes **who walks through it** real information. The
Tier-2 depth families in §8.5 — `chosen_challenge`, `self_authored_scope`, `unrequired_revision` — are
each *defined* as a choice made **when not required**: took the harder variant though an easier one was
offered, kept going past the win state, reopened something already solved. Require the behaviour and you
delete the construct.

A weaker but real second objection (**D7**): an unlock is a completion-contingent reward, and rewards
sit under a hard refusal (PRD §11). State the strength honestly — the source's *most detrimental*
category is less-than-maximum performance-contingent reward at **d = −0.80**, and contingency categories
did not differ significantly from each other (Qb(3) = 5.97, p < .12), so this argument constrains the
direction without carrying the load. The ability-laundering argument above is the one that decides it.

### The shelf is the D5 maintenance path

**D5** (§2.3, restated in §8.7 as *more* binding under finder-only scope): a triggered-but-unmaintained
domain ends up measurably **below** where it started, while an untouched domain merely drifts
(control slope −.03 vs treatment +.03). A finder that triggers eight cabins and maintains one is
net-negative for seven of them.

The always-open shelf is the cheap standing maintenance surface that makes triggering a domain
**defensible rather than net-negative**. That is its job; it is not decoration.

**Shelf contents:** 3–6 offline explainer cards per cabin, each with a **real citation** and one
**outbound link**. Mostly content-specific (one per activity or cluster), plus exactly one
**domain-invitation card** per cabin — the "here is what this whole field is" card.

## Teaching: one shared component, direct instruction

**One teach-in component, shared by every activity.** Not per-puzzle bespoke explanations.

- The rule stated plainly, in words, plus a **labelled diagram**.
- **Dismisses on first interaction** — it never blocks a child who already gets it.
- **Re-openable at any time from a persistent `?`**.
- A **trivially-solvable first instance** where generation makes that cheap — learn the interface on a
  problem that cannot be failed.

This is **direct instruction, not discovery.** The one surviving age-specific finding in this area is
negative: probe questions **without** direct instruction produced **no** improvement in 7–10-year-olds'
ability to design unconfounded experiments or draw valid inferences (Chen & Klahr 1999, N = 87; memo
§2.5a). Explicit instruction plus probes produced learning and transfer. Letting a child discover the
rules is the option the evidence rules out, and at high difficulty it is also the option that converts
difficulty into guesswork.

## Visual direction

- **3D is the direction and the winner.** The painterly static art is **not** the target and never was
  the destination. `CabinStatic` survives **only as the no-WebGL fallback** and is **unadvertised** — not
  a style option, not offered in UI, not a perf tier a child can land in by preference.
- **Identical shared shell across cabins.** Same room geometry, same lighting rig, same camera.
  Per-cabin identity comes from **accent colour + emblem + props only**. This is C8's mitigation applied
  to the build, not an art-direction shortcut.
- **Both rooms lit at dusk.** One time of day, so lighting is not a variable between cabins.
- **Fixed camera** — permanently, and for the reasons recorded in **PRD §5.2** (revised 2026-07-25): one
  frame per cabin to make beautiful, ~3× the art budget per pixel that matters, pre-rendered-adventure
  economics. Life comes from a small cursor-driven parallax/dolly and a push-in on gadget focus, both off
  under reduced-motion.
- **AI concept frames are a composition and dressing reference only — never a scoring target.** Photoreal
  render fidelity is not reachable in WebGL, so a loop that scores frames against a diffusion render is
  optimising toward something unattainable and **will never converge**; it will also spend its budget
  chasing material realism instead of composition, which is the part that actually transfers. Progress is
  measured **against the app's own previous frame**: better than last time, on a stated axis.

### The backend fork is closed — DECIDED 2026-07-26

**`backdrop` is the only backend. `3d` and `static` are parked.** This **reverses** "3D is the
direction and the winner… the painterly static art is not the target and never was the
destination," recorded above and deliberately left there so the change is legible.

What reversed it is the thing that motivated the still plate in the first place: the
reachable-in-WebGL ceiling is a real ceiling, and #159/#166/#179 are where the app's actual fidelity
came from. Parking `static` costs nothing extra — `backdrop` is an `<img>` plus SVG polygons and
needs no WebGL, so the "no-WebGL fallback" rationale dies together with the 3D path rather than
outliving it. Accessibility is unaffected either way: that is **A5**, the Layer-3 DOM mirror, which
`CabinStatic` never was.

Nothing was deleted. `Cabin3D.tsx`, `scene3d/`, `CabinStatic.tsx` and `hotspots.ts` are all still in
the tree, still compiled, still covered by their own passing tests — the LITS/Minesweeper precedent.
`cabin/CabinView.tsx` carries the reversal instructions.

### The generated-still backdrop, and why props are inexact on purpose

`backdrop` renders a generated still plate with clickable perspective prop polygons over it. It
exists because the reachable-in-WebGL ceiling is a real ceiling, and a still buys fidelity the
hand-built room cannot at roughly zero GPU cost. It is now the only backend — see *The backend fork
is closed*, above — reached with no query param at all.

**The props in the plate are recognisable but not accurate, and that is a decision — not an oversight.**
Anyone who finds the Pipes prop and notices it is not a connected network with a source and a sink has
found a known, accepted fact. The path to accuracy was built and rejected twice on appearance:

1. *Live puzzle previews composited in via homography* — geometrically exact to 0.0000 px, and rejected
   because crisp flat vector over soft warm photoreal clashes on colour temperature, edge hardness and
   grain. The code survives, dormant, behind `CabinBackdrop`'s `previews` prop.
2. *Exact board renders baked into the plate* — provably correct cell-for-cell, with the surrounding
   plate verified 100.0000% byte-identical, and rejected because a spec-quality render (flat, maximum
   contrast, no anti-aliasing) baked into a painterly room reads as a screenshot taped inside a picture
   frame. Relighting it reduced the obtrusion without making it physical.

The lesson, recorded because it cost two rounds: **a spec is not art.** A reference render's job is to
say *what* is on the board; something still has to say *how it is painted*. The remaining untried path
is to stylize each exact render into a physical object before placing it — the pipeline that took the
chess board from two convincing-but-wrong attempts to verified-accurate *and* photoreal.

**What accuracy actually buys here is small**, which is why accepting the inexact props is defensible
rather than lazy. PRD §5.3 asks props for a **clear affordance** — the child must see "that is the pipes
puzzle" — and recognition is all a prop is load-bearing for. It could never show the real instance
anyway: every gadget open generates a fresh random puzzle. Chess is the exception and *is* verified
(audited: 8×8 grid, two distinguishable armies, ACCURATE), because a board game's set is legible enough
at that size to be wrong in a way a viewer would notice.

**Math room prop mapping**, so the next author does not regenerate a plate that already works — all five
planned activities already have an object in `cabin-backdrop-math.png`: Gear Train → the brass gear train
on the chimney breast; Balance Scale → the brass balance and its pan; Ratio Mixing → the three vials at
different fill levels; Fraction Laser → the prism on the table splitting light; Function Machine → the
upright brass machine (funnel hopper on top, boxy housing with a round window onto its gearing, chute out
the bottom over a tray), re-traced 2026-07-26 after regeneration — it used to be a three-shelf cabinet of
brass instruments (the weakest read of the five) and is not any more.

## Explicitly deferred (deferred, not forgotten)

These are known gaps with known fixes. They are out of scope for now by decision, and each stays
recorded so it is not rediscovered as a surprise.

- **All signals and measurement.** `activeMs` / `opens` / `solves` stay **exactly as they are**. No
  `CellEvent` work, no choice-set recording, no return-horizon split. This leaves memo §8.4's **P1**
  (magnitude re-importing dwell), **P2** (no choice set, so "voluntary" is not interpretable) and **P4**
  (`voluntary_return` conflating same-session reopen with cross-day return) open, and it leaves the app's
  read entirely in-session. The consequence is stated plainly: **this build does not produce a defensible
  interest read.** It produces a room worth being in.
- **A walkable 2D overworld** — an avatar the child moves across the map instead of clicking a signpost
  (PRD §5.2, deferred there rather than rejected). It costs nothing to defer: the two signal-bearing
  choices on that layer are which cabin gets approached and which cabin is returned to unprompted, and
  both are captured just as well from a click. Locomotion would buy **embodiment, not signal** — worth
  spending on later, wrong to block on now. Note this is a *deferral*; the interior fixed camera above is
  **permanent**, and the two should not be collapsed into one decision.
- **The single-persistent-canvas rule** (PRD §5.2) — the one architectural rule the PRD says must not be
  violated. Not yet implemented here.
- **Live puzzle previews composited onto the backdrop.** The backdrop backend can warp each prop's
  real board into the painting with a projective `matrix3d`, verified to 0.0000 px corner accuracy in
  a browser. It is **switched off** (`CabinBackdrop`'s `previews` prop, off by default) after an
  appearance review: crisp flat vector over soft warm photoreal loses on colour temperature, edge
  hardness and grain at once, and the previews integrate no shadow, so a board reads as a decal held
  in front of the wall. The puzzles are **painted into the plate** instead. The code is dormant, not
  deleted, and its tests still run in both states — it is what a prop showing *live* per-child state
  would need, which painted art can never do. Turning it back on is one word at the call site; making
  it show real state is the seam described in `previews/snapshots.ts`.

## Corrected

### The child-facing interest readout is gone — 2026-07-26

An ungated "Interest" button sat in the child's primary nav and opened a screen titled "Your
interests", ranking gadgets by time-on-task with the minutes printed. PRD §11 refuses that three
times over: it is a child-facing quantified display of the child's own engagement; a visible
time-on-task ranking makes the measured quantity a target, converting the instrument into an
engagement-contingent reward (**d = −0.46** in children, growing −0.35 immediate → −0.55 at ~2
weeks); and "your interests" asserts the fixed discovered-interest model. The counters survive
behind `window.__qa` — §11 permits operator-facing readouts — and no child-reachable path renders a
duration. **Do not re-add a child-facing one.**

## Risks logged but not solved

Stated without softening.

- **The "coming soon" cabins are a D5 trigger with no maintenance path.** A visible Music / Code / Art
  button is a trigger — it is exactly the "engineered trigger" the evidence says works — and there is
  nothing behind it and no re-exposure plan. On §2.3's evidence that is the trigger-then-abandon shape
  that ends up *below* baseline for those domains, and the shelf mitigation does not reach them because
  they have no shelf.
- **Slight inter-room visual variation keeps a small C8 aesthetics-confound exposure.** The shared shell
  removes most of it; accent colour, emblem and props still differ, and generic wrapper appeal
  independently predicts voluntary return (β = 0.267, p = .003). We accept the residual rather than
  claim it away.
- **There is still no valid cross-cabin comparison from this build, and the trim to four does not
  create one.** Density is now 4-vs-5 rather than 7-vs-5, which is a real improvement and is one of
  the reasons the trim was taken — but memo §8.2's limit is not a density threshold that 4-vs-5
  clears. Unequal cabins are not a criticism of the build; **no cross-cabin comparison from it is
  valid**, density included. Any number comparing Logic Games against Math out of this build is an
  artifact of how many doors each room has. Do not let "we density-matched it" become a licence to
  compare.
- **The backdrop cabin's interaction surfaces emit no signal records, and the app now has a pipeline
  that does.** #161 added timestamped, session-scoped `Interaction` / `SurfacedRecord` emission. The
  backdrop backend adds a whole new set of interaction surfaces — perspective prop polygons, and the
  bookshelf — and by decision they emit **nothing**. So the emission is not merely incomplete, it is
  **silently partial**: records exist, they look well-formed, and they under-count every prop opened
  through the backdrop. Anyone reading that data without reading this line will treat missing engagement
  as absence of engagement, which is the one misreading `SurfacedRecord` exists to prevent. Either wire
  the backdrop props into emission before trusting any of it, or gate the backdrop out of sessions whose
  records are analysed. Do not split the difference.

## References

- `docs/prd/DISCOVERY-APP-PRD.md` — canonical spec; §5.2 (world model, fixed camera), §5.3 (equal
  polish), §5.4 (three-layer interaction, intrinsic integration), §11 (refusals).
- `docs/research/passion-pipeline/06-activity-design-ages-6-8.md` — §2.1/D1 swap test, §2.3/D5
  maintenance, §2.4 + §8.6 `solves`/`activeMs`, §2.5a Chen & Klahr, §5 C1/C6/C8, §8.1–8.2 finder-only
  scope and the cross-cabin limit, §8.4 P1–P5, §8.5 the replacement signal model.
- `docs/proposals/interest-engine-data-collection-v2.md` — the deferred `CellEvent` change request.
- `passion/apps/tinker-cabin/PROJECT.md` — the sibling brief this document's shape follows.
