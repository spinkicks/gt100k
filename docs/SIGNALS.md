# Signals spec

**Status:** draft 1 · 2026-08-06 · companion to `PRD-v2.md`

Evidence grades used throughout: **[A]** replicated or meta-analytic · **[B]** one good study or
consistent experiments · **[X]** our extrapolation, defensible but untested · **[!]** invention, no
evidence either way.

Extrapolation is fine and marked. Inventing while pretending otherwise is not.

---

## Part A · The spike estimate

### A.1 What it is today, exactly

Only these move the belief. Everything else in the product is logged and scores nothing.

| Event | Weight | Actually produced today? |
|---|---|---|
| `cross_day_return` | α **+1.0** | **Yes.** The main signal |
| `chosen_challenge` | α +0.5 | **Yes.** The "try a harder one" button on the wall |
| `failure_recovery` | α +0.5 | **Chess only.** Nothing else reports attempts |
| `unrequired_revision` | α +0.5 | **No. Nothing emits it. Dead constant** |
| `self_authored_scope` | α +0.5 | **No producer in discovery. Dead in this context** |
| `external_report` broad | α +0.25 | Adult report only |
| `skip` | β −0.5 ÷ choice set | Yes |
| `decline` | β −0.15 ÷ choice set | Yes |

**So the honest answer to "is it just voluntary return":** in principle no, in practice nearly. Two of
the four depth families have no producer, and a third fires only in chess. For 43 of 44 pursuits the
estimate today is **voluntary return, minus skips, plus the occasional harder-one click.**

That is thinner than the model implies and it is the first thing to fix.

### A.2 Time. Direct answer

**Duration never scores. Choices derived from duration can.**

Three reasons, and the third is the one that actually decides it:

1. Dwell is non-monotonic in interest. Stronger performers stay as progress rises, weaker ones stay
   with the most familiar option. Same number, opposite meaning. **[A]**
2. At ages 7 to 8, in-session engagement failed to separate an intrinsically motivating task from a
   boring one. Only a delayed test did. **[A]**
3. **The arithmetic.** A return is worth 1.0. Multiply weight by minutes and a 40-minute session
   outweighs 40 returns, so duration silently becomes the dominant term in the posterior. The field
   for this was deliberately deleted from the event type. **[A]**

But "stayed past the end of the unit" is a **discrete choice**, not a duration, and it scores fine.
Same logic that makes replay-after-solving legitimate. The rule to hold:

> Score what the child chose. Never score how long it took.

### A.3 What to add, in priority order

| Signal | Definition | Weight | Grade |
|---|---|---|---|
| **`unrequired_revision`** | Reopens an already-solved puzzle to improve the line, no reward available | α +0.5 | **[A]** the constant exists and is researched; it just needs a producer |
| **`first_pick`** | The first cell opened in a session, before anything in-session primes it | α +0.5 | **[X]** unprimed preference is a stronger claim than an nth pick. Cheap to capture |
| **`replay_after_solve`** | Reopens at the same tier after already succeeding, no reward pending | α +0.5 | **[B]** replay-after-winning separated from reward-farming in 4,124 children. Note the counter-case: in one tutor, replay in general marked *weaker* students avoiding work. Only replay-after-passing predicted gains |
| **`overrun`** | Continues past the natural end of the assigned unit | α +0.5 | **[X]** a choice, not a duration |
| **`resource_follow`** | Opens a reading link or the awarding-body page | α +0.25 | **[X]** investment beyond the game. Already captured, currently unscored |
| **`direct_return`** | On a return session, opens the cell with no intervening browse | multiplier on the return, not its own event | **[X]** intent versus wandering |
| **`repeat_hover_no_open`** | Same tile hovered across 3+ sessions, never opened | **capture, do not score** | **[!]** this is exactly your target child, latent interest with low confidence, and there is no evidence for a weight. Collect it and look at it in six months |

Everything at +0.5 sits in the depth band deliberately. None of them should ever outweigh a return,
because a return across days is the one signal with real evidence behind it at these ages.

### A.4 The probe, in signal terms

When the top two cells sit within `PROBE_MARGIN`, add separating content **to the offer set**. Nothing
else changes. Probe events flow through the normal pipeline and the tie breaks itself.

The guard is absolute: if the child is pushed into probe content, `prompted` is true, the return scores
zero, and the probe has destroyed what it was measuring.

---

## Part B · After promotion

Five states. **Three signals do most of the work**, and everything else is confirmation.

### B.0 The three that matter

| Signal | Definition | Why it carries so much |
|---|---|---|
| **`free_choice_ratio`** | unprompted returns ÷ required sessions, rolling 14 days | **The master trigger.** Attendance is the denominator, so this moves when attendance does not. That is the answer to "devaluation hides behind attendance" **[X]** built from the free-choice paradigm **[A]** |
| **`carelessness`** | error rate on skills BKT marks mastered | **The best single discriminator in the literature.** β = −1.145 controlling for knowledge, in a 3,747-student study predicting outcomes five years out. A plateaued child still gets easy things right; a disengaged one does not **[A]** |
| **`success_rate`** | correct ÷ attempts, rolling, **suppressed below 4 judged attempts** | Drives the challenge setpoint. Suppression matters: below 4 the console must say it does not know, not guess **[A]** |

`carelessness` requires per-skill mastery estimates. **BKT is not optional**; without it the classifier
collapses to guessing.

### B.1 Challenge · the setpoint loop

Already specified in `@gt100k/wellbeing`, never closed because nothing reported attempts. Chess fixes
that.

```
success_rate > 0.90  → PUSH      raise the tier
0.80 to 0.90         → HOLD      the stretch zone
< 0.70               → SCAFFOLD  lower the tier
< 4 judged attempts  → unknown, say so
```

Constants `PUSH_SUCCESS`, `ZONE_LOW`, `ZONE_HIGH`, `SCAFFOLD_SUCCESS`, `MIN_JUDGED` all exist in the
code today. **[A]** for the 80 to 90 setpoint.

Only one of seven wellbeing states ever says push, and it needs rising return, rising depth,
stretch-seeking and success above 0.9 at once. The system is biased toward holding, which is correct.

### B.2 Plateau

| Signal | Movement |
|---|---|
| `learning_slope` | **flat, below the child's own fitted asymptote** |
| `success_rate` | falling |
| `carelessness` | **unchanged** ← separates it from everything else |
| breadth | **narrow**, one skill cluster |
| `wheel_spinning` | true |
| `free_choice_ratio` | holds |

**`learning_slope`:** fit an **exponential per child**, never a power law against the population. The
power law is an aggregation artifact; the exponential beat it in every one of 7,910 individual learning
series. **[A]**

**`wheel_spinning`** separates from productive persistence within **3 practice opportunities**, using
hint requests, correctness on prior opportunities, and time on skill. Five opportunities to separate it
from giving up, nine for the best model. **[A]**

**The dip guard.** Performance getting worse *with variance going up* is a child inventing a new
method, not falling apart. Do not intervene. Plateau is flat-and-stable; a dip is worse-and-noisy.
**[A]** for the phenomenon, **[X]** for using variance as the discriminator.

### B.3 Boredom

You added this and the evidence is better than for most of the list.

| Signal | Movement |
|---|---|
| `success_rate` | **high, above 0.90** ← underchallenge |
| `gaming_rate` | **rising** |
| `bottom_out_hints` | rising, with hint dwell **under 2 seconds** |
| `off_task_idles` | rising |
| `free_choice_ratio` | falling |
| `carelessness` | rising |

Boredom is **the most persistent affective state** of those measured, significantly more so than
frustration in all three systems tested, and **it predicts gaming the system**. Frustration never once
preceded gaming across 39 frustrated students. So boredom is the higher priority target, which is the
opposite of most people's intuition. **[A]**

**`gaming_rate`:** wrong answers or help requests more than 2 SD faster than the child's own median for
that item type. Guard against the known false positive: **faster than 2 SD often means a double-click
or a repeated Enter press**, not gaming. **[A]**

**`bottom_out_hints`:** drilling to the answer without reading. In one study 30% of hints were viewed
for under 2 seconds. **[A]**

### B.4 Devaluation

The failure mode that hides.

| Signal | Movement |
|---|---|
| `free_choice_ratio` | **falls** |
| required attendance | **holds** ← the trap |
| `carelessness` | **rising** |
| breadth | broad, including previously fluent skills |
| prior high-effort phase | **required in history** |
| distress markers | **flat or improving** ← do not look here |

**Devaluation attenuates exhaustion.** Across 895 adolescents in a five-wave study, exhaustion was
*lower* at the time points where devaluation was high. The child who has stopped caring stops being
tired. Any detector keyed on distress systematically misses this case. **[A]**

**Do not call this burnout below age 9.** Nothing is validated lower, and a 2026 review of 33
instruments found none meets standards for recommendation at any age. Call it what it is: a behavioural
pattern. **[A]**

### B.5 Loss of interest

| Signal | Movement |
|---|---|
| `free_choice_ratio` | falls |
| required attendance | **also falls** |
| `carelessness` | rising |
| prior high-effort phase | **absent** ← the discriminator |
| other cells | **rising** |

**History is the only thing separating this from devaluation.** The instantaneous signatures are close
to identical. A child who ground hard for two months against a flat curve and now shows low effort is
devaluing; a child who never had a high-effort phase has lost interest. **If you are not storing months
of per-child history you cannot make this call, and you should not claim to.** **[A]**

### B.6 The discriminator matrix

| | free-choice ratio | attendance | success | careless | breadth | prior effort |
|---|---|---|---|---|---|---|
| **In the zone** | holds | holds | 0.80–0.90 | flat | — | — |
| **Under-challenged / bored** | falls | holds | **>0.90** | rising | broad | — |
| **Plateau** | holds | holds | **falling** | **flat** | **narrow** | present |
| **Devaluation** | **falls** | **holds** | flat | **rising** | broad | **required** |
| **Loss of interest** | falls | **falls** | flat | rising | broad | **absent** |

Read the columns, not the rows. `carelessness` alone separates plateau from the rest. `attendance`
separates devaluation from loss of interest in the moment, and `prior effort` confirms it.

### B.7 The noise floor

**No state fires on a single reading.** The standard error of a two-occasion difference is around
0.45 SD against a normative annual decline of 0.05 to 0.20 SD, so one drop is provably noise. **[A]**

Minimum sustain before an alert:

| State | Minimum |
|---|---|
| Challenge move | 4 judged attempts **[A]** |
| Plateau | 3 practice opportunities for wheel-spinning, 10 for a confirmed flat slope **[A]** |
| Boredom | 2 sessions **[X]** |
| Devaluation | 14 days of falling ratio against stable attendance **[X]** |
| Loss of interest | 14 days, plus a history query **[X]** |

The three marked **[X]** are our windows. The evidence gives seconds and practice-opportunities at one
end and whole seasons at the other, and **the days-to-weeks band you actually need is empty.** Say so
rather than implying otherwise.

---

## Part C · Guide-given cash

**Decision:** cash sits with guides, who give it whenever they want.

The engine therefore **observes rewards rather than controlling them.** That works, with one
requirement.

**A return during an active reward window is not a free-choice return.** If a guide pays a child and
the system does not know, the internal term is silently contaminated and the external term cannot be
computed at all. So:

> The guide taps **"I gave something"** with what and when. One tap, two fields.

That opens a reward window, marks returns inside it as prompted, and starts a measured episode:
baseline, intervention, withdrawal.

**What we can still do without a rule.** Show the guide what happened last time.

```
  You gave Ari $5 three times.
  Unprompted return went 4/wk → 6/wk during, → 2/wk after.
  This lever is costing you more than it buys for this child.
```

That is more persuasive than a constraint, and it is exactly the argument for Joe: we are not
theorising about extrinsic motivation, we are measuring it per child.

**What the engine still recommends** (rules from `PRD-v2.md` §6, now advice rather than enforcement):
attach it to an input the child controls, set a bar they clear four times in five, give it immediately,
and never show a partial. That last one is the sharpest: a reward the child usually **misses** is the
worst design in the whole literature at **d = −0.80**, three times worse than any other category. If a
guide hands out money for winning a tournament, that is the case we are in.

---

## Part D · Build order

1. `prompted` and `mode` on every chess event. Nothing works without them.
2. Attempt reporting, so `success_rate` exists at all. This alone unlocks the challenge loop, plateau
   detection and boredom detection.
3. BKT per skill, then `carelessness` off the back of it.
4. `free_choice_ratio`, which needs the reward-window log from Part C to be meaningful.
5. The dead depth families: give `unrequired_revision` a producer, add `first_pick` and
   `replay_after_solve`.
6. `learning_slope` as a per-child exponential fit.
7. `wheel_spinning` from hints, prior correctness and time on skill.
