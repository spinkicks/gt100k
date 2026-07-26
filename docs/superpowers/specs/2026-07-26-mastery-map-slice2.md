# Mastery Maps, slice 2: one map read against one child

**Status:** written after the slice was built and audited, and corrected against what the audit
found. Slice 1 had a spec and a plan and this had neither, which is the gap this closes.
**Design:** [`2026-07-25-mastery-map-design.md`](2026-07-25-mastery-map-design.md).
**Slice 1:** [`2026-07-26-mastery-map-slice1.md`](2026-07-26-mastery-map-slice1.md). Read both first;
this does not restate them.
**Date:** 2026-07-26

## 1. Scope

**In:** reading a map against what one child has actually made. `readMap` in the engine, the
per-child section of the guide console's Maps tab, and the console's own seed of child work.

**Out:** any child-facing surface, writing evidence links (they arrive from the caller, and in
production will come from the Evidence Graph), anything that changes a plan, and anything that
advances a child. Slice 2 is read-only analysis.

**Nothing here picks.** `readMap` reports every milestone on the map with the standing behind it.
It does not choose the next one, because choosing is the guide's and the planner's, and a list that
had already chosen would be a plan by another name.

## 2. Why position is artefact-derived, and never binary

This is the load-bearing decision and everything else in the slice follows from it.

**One artefact cannot support a claim about a capability.** Shavelson, Baxter and Gao (1993)
measured the generalisability of elementary performance assessment and found task-sampling
variability dominates the error: performance on one task predicts performance on another poorly,
and roughly 15 to 23 tasks are needed for a generalisability coefficient of 0.80. Three artefacts
are not close to that and neither are five.

**Asking a person instead does not rescue the claim, it relocates it.** Koretz, Stecher, Klein and
McCaffrey (1994) measured rater reliability on the Vermont portfolio program at 0.33 to 0.43. A
guide ticking "has this capability" is not a more reliable measurement than the artefacts, so a
checkbox would be a worse instrument wearing a more confident face.

**So the vocabulary tops out at a description of quantity.** `EvidenceStrength` is `none`, `single`
or `multiple`, and `multiple` says more than one thing was made and nothing else. There is no fourth
value and no boolean anywhere for a caller to derive one from.

**And a standing never appears without the work under it.** Butler (1988), with 132 children aged
roughly 10 to 12, found a bare verdict with no task anchoring behaved like a grade and depressed
both interest and later performance. `MilestoneRead.evidence` carries the links the standing came
from for exactly this reason, and the panel renders the artefacts inside every row, including the
rows where the honest answer is that there are none.

**The percentage ban now has a numerator.** Slice 1 could rest on a map holding nothing about any
child. A per-child read is a numerator by construction, so from here the ban is obeyed on purpose:
no count, no fraction, no tally of standings, in the view model or in the markup. Deci, Koestner and
Ryan (1999) put completion-contingent rewards undermining intrinsic motivation at d = -0.36, and a
percentage would corrupt the voluntary-return signal the whole engine is built on.

## 3. What the engine holds

- `MilestoneEvidence`: one link between a project and a milestone, with `artifactCount`. Supplied by
  the caller. Slice 2 derives standing; it does not create links.
- `EvidenceStrength` and `EVIDENCE_STRENGTHS`: the three-value vocabulary above.
- `GuideOverride`: a guide's call that a prerequisite should not hold the next thing up. Built
  through `guideOverride`, which refuses one with no reason.
- `Blocker`: a prerequisite with nothing behind it, or a stage floor above the child. Two different
  problems with two different answers.
- `MilestoneRead`: the milestone, its standing, the links behind it, whether it can be offered, what
  is in the way, and the override standing on it.
- `readMap(map, evidence, overrides, stage)`: every milestone, ordered, read against the child.

## 4. The decisions

**D1. Position comes from artefacts and from nothing else.** An override moves what may be OFFERED
and never puts a standing anywhere: a child whose earliest work nobody kept is the ordinary case,
and manufacturing evidence for them would be the checkbox §2 rules out.

**D2. Reachability is an offering decision, not a mastery claim.** "Has this child got it" is a
binary this package never asserts. "Should we offer this next" has to come out yes or no, because
the guide either puts the thing in front of the child or does not. So a prerequisite counts as
satisfied FOR THE PURPOSE OF OFFERING on any evidence at all or an override. The bar is deliberately
low and it fails safe: offering too early costs a child a hard task, which the map frames as
expected; a high bar costs them being held at a rung by a measurement nobody in this field can make.

**D3. The planner owns stage and the map only asks.** `stage` is a parameter. Nothing here advances
anybody, and a milestone gated above the child is reported, never quietly dropped.

**D4. A standing is never shown without the work it rests on.** Butler (1988), above. The engine
returns the links; the console carries the artefacts ON the link, so the count and the list are one
object and the surface cannot render a standing derived from something other than what it shows.

**D5. Nobody is read against a map that is not in use, or not fit to be.** Slice 1 §8 says a map
with a problem never reaches what a plan consumes, and the review path was justified on the grounds
that no child was downstream of it. Slice 2 made that false. So the reading is gated on `canPublish`
plus `status: "published"`, and a draft, invalid, stale or withdrawn map shows the review surface
with a line saying why there is no reading, rather than a standing computed off a map nobody has
stood behind. Two of the three console seeds are in use so that the reading has somewhere to appear.

**D6. A ceiling and a placement are different facts and never share a sentence.** No child can be
placed above `S2_FOUNDATIONS` today (PR #163), so a rung gated above it is out of reach for a reason
that has nothing to do with the child. A rung gated at or below it is out of reach because of where
the planner has this child today, which is about the child's placement and is the planner's to
change. Saying the first about the second is a false statement in front of a guide about a real
child, so the two have separate copy and separate conditions.

**D7. An override is a record, not a click.** It carries a required reason, the instant it was
actually signed rather than a pinned review clock, and it goes into the child's record through one
function that refuses a second override on the same milestone. The engine reads the list as a log
and keeps the last entry, so a duplicate would silently discard a decision somebody made and signed.

**D8. The order is a function of the map and of nothing else.** Stage floor, then prerequisite
depth, then id, then the milestone's own content. It holds on the maps the validator rejects too: an
edge inside a cycle contributes no depth, which is defined by the graph rather than by where a walk
began, and two entries sharing an id are separated by their content. Two callers holding the same
map see the same list, whatever order their arrays happen to be in.

## 5. The console

`childReadView` puts words around a read: plain-language stages, the standing said in words with
what it is not said beside it, what is in the way in sentences a guide can act on, and the artefacts
under every row. `MapsPanel` renders it under the map it belongs to, and offers one affordance, the
override, only where it would do something.

The console seeds its own child work in `map-evidence.ts`, shaped like the `WorkEvent` records the
project workspace already carries, so swapping in the Evidence Graph later changes where the records
come from rather than the model. Four synthetic children: one with an override and no artefact
behind the rung it names, one with a single paper, one with nothing linked anywhere, and one with
four artefacts spread over two projects and two milestones.

Which map a child's spike resolves to is the engine's rule (`servesPath`), the same one `MapStore`
resolves with: the exact domain, then the cabin above it. One implementation, because the console
having its own was how a child with a live spike came to be told she had none.

## 6. Tests

Engine: every milestone reported and none dropped; the three-value vocabulary and nothing that reads
as a verdict; a link judged on its own so a negative, zero, fractional or `NaN` count contributes
nothing and cancels nothing; reachability against prerequisites, overrides and stage floors; the
order derived by hand on both golden maps and unchanged under reversal, including on a cyclic map
and a map declaring one id twice; an override with no reason refused at construction and at use.

Console: the standing and the work in one object; the ceiling caveat present only where something
sits above the reachable ceiling and absent where it would be false; no reading against a draft, a
withdrawn map, an invalid map or a stale one; overrides recorded, unduplicable and refused on a
milestone the map does not have; and the percentage ban over the rendered markup, extended to
spelled-out "N of M" phrasing and to CSS counters keyed on the attributes each row carries, since a
counter renders a tally with no change to the markup at all.

## 7. Deferred

Persistence for overrides (they live in the console's state, as every console seed does), the
Evidence Graph as the source of links, any child-facing surface, and anything that would let a map
move a child.
