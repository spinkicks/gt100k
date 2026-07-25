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

- **`logic-games` — "Logic Games."** Holds the seven existing deduction puzzles: Nonogram, Logic Grid,
  Mirror Maze, Chess Puzzle, Minesweeper, Pipes, LITS.
- **`math` — "Math."** Reserved for **genuinely mathematical** activities; nothing else goes in it. It
  opens on day one as a real, furnished, deliberately **gadget-free** room, so the split is visible to a
  player from the start rather than arriving later as a surprise new cabin.

`music` / `code` / `art` stay on the map as visible **"coming soon"** buttons. They are build state, not a
design statement (memo §8.1.4) — but see *Risks*, because visible-but-empty is not free.

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
- **Trimming Logic Games from 7 activities to 4** — dropping **LITS**, **Logic Grid** and
  **Minesweeper**. This is the move if a tighter, cross-comparable demo is ever needed (four vs the
  planned five maths games is close to density-matched, which seven is not). The rationale, recorded now
  so it does not have to be re-argued: **LITS** is the least legible to a spectator watching over a
  shoulder; **Logic Grid** is reading comprehension as much as deduction, so it loads on a second
  construct; **Minesweeper** duplicates Nonogram's construct while adding a luck element and a lose-state
  that neither of the others has.

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
- **7-vs-5 activity density means there is no valid cross-cabin comparison from this build.** Already
  recorded in memo §8.2 as a hard limit on interpretation: unequal cabins are not a criticism of the
  build, but **no cross-cabin comparison from it is valid**, density included. Any number that compares
  Logic Games against Math out of this build is an artifact of how many doors each room has.

## References

- `docs/prd/DISCOVERY-APP-PRD.md` — canonical spec; §5.2 (world model, fixed camera), §5.3 (equal
  polish), §5.4 (three-layer interaction, intrinsic integration), §11 (refusals).
- `docs/research/passion-pipeline/06-activity-design-ages-6-8.md` — §2.1/D1 swap test, §2.3/D5
  maintenance, §2.4 + §8.6 `solves`/`activeMs`, §2.5a Chen & Klahr, §5 C1/C6/C8, §8.1–8.2 finder-only
  scope and the cross-cabin limit, §8.4 P1–P5, §8.5 the replacement signal model.
- `docs/proposals/interest-engine-data-collection-v2.md` — the deferred `CellEvent` change request.
- `passion/apps/tinker-cabin/PROJECT.md` — the sibling brief this document's shape follows.
