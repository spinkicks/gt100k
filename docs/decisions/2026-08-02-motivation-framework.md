# The motivation feature, and why it is not a detector

**Status:** built and shipped. `@gt100k/motivation`, surfaced in the guide console's Family tab.

**Written for:** Alexander, who asked for a way to tell whether a child is over- or under-motivated.

---

## The short version

We could not build what was asked for, and the reason is not that we lack data. The axis an adult
would naturally use carries no information. So we built the two things that do work, and this note
explains the swap so nobody has to take it on trust.

## Why a detector cannot be built

The natural design is a grid: intensity on one axis, something like enjoyment on the other, with
"over-motivated" in a corner. Intensity is the part an adult can actually observe, so it is the
part a product would key on.

It does not discriminate. Across **94 studies and 1,308 effect sizes**, harmonious and obsessive
passion correlate with deliberate practice **indistinguishably** — and obsessive correlates
*slightly more* with hours per week (Curran, Hill, Appleton, Vallerand & Standage, 2015). The single
variable an adult can see is the one that does not separate the child you should feed from the child
you should intervene on.

This matters more than "the feature would be weak." A grid keyed on intensity is wrong **in a
predictable direction**: it flags the deeply absorbed child as at-risk, and it misses the pressured
one. Shipping it would have made a guide's judgement worse than no feature at all.

The behavioural channel cannot rescue it either. Under ego-involvement, free-choice persistence
**inverts** with prior feedback: after success the internally-pressured child returns *less*, after a
setback *more*, and reports no enjoyment either way (Ryan, Koestner & Deci, 1991). Adult praise flips
the sign of voluntary return, which is this product's core signal. Every instrument that actually
separates the motivational regulations is a questionnaire, and SDT's own authors say so of their
situational scale.

One more caution that runs against our instincts as well as yours. The child version of the Passion
Scale runs α = .60–.66, which is poor; and in the youngest sample anyone has properly tested (mean
age 16.2, already older than our band) the two passions correlated r = .73 and obsessive passion was
**unrelated** to burnout. The mechanism is weakest precisely where we operate.

## What we built instead

**Two probes a guide runs in the world.** Neither returns a verdict, and each carries a required
"what this cannot tell you" that is never folded away.

- **Take it away for a week.** Make the activity genuinely unavailable, for an ordinary reason, and
  watch. The separation the meta-analysis finds lives here rather than in volume.
- **Offer a real way out.** Once, plainly, with nothing bad happening if they take it. Attraction
  declines it; entrapment cannot hear it (Raedeke, 1997, age-group swimmers).

**Six moves aimed at the adults, graded by what the evidence is worth.** Subtraction leads, and the
grade is on screen so a move from a controlled trial and a move we reasoned out do not look alike.

The strongest is the only controlled child result in this literature: a coach-behaviour workshop
that cut next-season dropout from **26% to 5%** with no change in win-loss records (Smith, Smoll &
Curtis, 1979; Barnett, Smoll & Smith, 1992). Nothing was done to the children. The coaches were
trained to cut punitive control and raise reinforcement.

Three of the six are chess-specific, because chess escalates through the calendar rather than
through hours at the board: stop talking about the result, take a tournament off the calendar the
child did not ask for, stop checking the rating between events.

## The transferable ask

The 26%-to-5% result is the thing GT should actually want from this. It is the largest effect in the
field, it is the only one established in children under controlled conditions, and it is available
by training the adults rather than by measuring the child. If we run a guide-behaviour workshop, we
are doing the intervention with the best evidence behind it — and it is cheaper than any detector
would have been.

## Honest limits

This is largely a **negative claim**, and negative claims are cheap to make and hard to falsify.

Excluding self-report is **our design choice, not a finding**. The SRQ-A was built for exactly this
age band and asks one thing — *why do you do this* — with no affect and no biometrics. We ruled it
out to force the software into "here is what we saw, you decide", and a reasonable person could
choose differently.

Both probes are graded `correlational-or-older-sample`, not `controlled-in-children`. They are the
best available, and they are not proof.

## Where it lives

- `passion/packages/motivation` — the probes, the moves, the grading. Fifteen tests, most of them
  about what the module refuses to say. One asserts it produces no number anywhere, because prose
  can be argued about but a numeric field can only be a score.
- `passion/apps/guide-console/app/find-out-panel.tsx` — the Family tab surface.
- SPOV 9 and Insight 22 in `docs/research/july31brainlift.md` — the underlying argument and sources.
