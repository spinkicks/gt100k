# PassionLab v2 · PRD

**Status:** draft 2 · 2026-08-06 · supersedes the nine-app scope
**Signals:** specified in full in `SIGNALS.md`
**One line:** We find and build the beginning of a student's spike, ages 6 to 14.
**Input:** roughly 30 minutes a day. **Output within two months:** ranked hypotheses for what a child
will stay with, plus a motivation read that tells a guide when to intervene and how.

**Two months is not an arbitrary target.** The durability gate already in the engine is
`MIN_TERM_DAYS = 56`, which is eight weeks. Two months is precisely the earliest a spike can clear
gap-survival and durability. The claim and the arithmetic already agree.

---

## 0. The constraint

**One guide, thirty children.** Four minutes per child per week, most needing zero. Guides get a number
and a button, never a narrative to interpret.

---

## 1. Decisions taken

| # | Decision |
|---|---|
| 1 | The engine outputs a **motivation number**. `0.3 × external + 0.7 × internal`. Decomposes on click. SPOV 2 is rewritten. |
| 2 | A spike is a **cell**: pursuit × mode. Chess tags a mode on every action. |
| 3 | Engine recommends a fix, **guide approves in one click**, adult delivers. |
| 4 | Ages **6 to 14**. |
| 5 | Both motivation terms are **behavioural**. Nobody is asked anything. |
| 6 | The reward architecture is **constrained in the engine**, not left to the guide. |
| 7 | Three reward rules ship together: immediacy, inputs only, boring sub-skill only. |
| 8 | Two apps: **child** and **adult**. |
| 9 | **The wall is the collection of apps.** Each tile opens a deep app; chess is built this week. |
| 10 | **Two months** to a spike. |
| 11 | **Four fixes**, gated by diagnosed cause: difficulty, break, parent involvement, switch spike. |
| 12 | Close hypotheses are separated by an **active probe**, not by waiting. |

---

## 2. Scope

**Find.** The wall, the signal pipeline, the spike engine, the probe.
**Build the beginning.** The deep app the child moves into once a spike is named, where more of their
30 minutes goes, plus the motivation engine and the four fixes that keep them there.
**Prove.** Out of scope. EvidenceGraph goes standalone.

Also out: mastery maps, the specialization planner, mentor brokerage, the project workspace. The world
already has resources for developing a spike once chosen; our handoff is the read plus the venue, and
all 44 pursuits already carry a real external judge.

---

## 3. The engine

### 3.1 Spike probability · already built, do not rebuild

`@gt100k/interest-inference` computes this today. Beta-Bernoulli per cell, weighted events, 14-day
half-life, `lowerBound = mean − √var`, behind four gates. Full documentation in
`docs/presentation/prediction-model.html`. PostHog is transport; classification stays server-side,
because cross-day versus same-day, skip versus decline and the novelty window are stateful comparisons
against a child's history.

**Output:** hypotheses 1, 2, 3 with confidence, attributed to domain, style or mixed.

### 3.2 The probe · how close hypotheses get separated

When the top two cells sit within `PROBE_MARGIN` of each other, waiting is the slow answer. The engine
instead **changes what is on offer** so the two stop looking alike.

```
chess × compete   0.64  ┐  within margin
chess × investigate 0.61 ┘  → probe

offer set gains:  a timed ladder match   (loads compete, not investigate)
                  a puzzle to compose    (loads investigate, not compete)
measure:          which one earns the unprompted cross-day return
```

**The probe changes the offer, never the assignment.** If the child is pushed into probe content the
return is prompted, scores zero, and the probe has destroyed the thing it was measuring. This runs
through the surfacing policy, so it is a change to what appears on the wall and nothing else.

Probe events score through the normal pipeline. The tie breaks itself, and no new scoring path exists
to go wrong.

### 3.3 Motivation

```
motivation = 0.3 × external + 0.7 × internal        // when external is defined
motivation = internal                               // before any reward episode
```

**Internal term.** The existing cell `lowerBound`. Already a 0 to 1 posterior over unprompted cross-day
return, which is the field's primary behavioural index of intrinsic motivation. Needs no new engine.

A free-choice event requires **all** of: no prompt, no notification pending, no active reward, no
streak at stake, alternatives on screen. Anything else is logged and scores nothing.

**External term.** The measured response to a reward, per child:

```
episode  = baseline window → intervention window → withdrawal window
external = normalised lift in free-choice return during intervention
durable  = did the lift hold after withdrawal
```

Undefined until a reward has been applied, which is honest rather than a gap.

| Pattern | Read | Action |
|---|---|---|
| Rises, **holds** after withdrawal | The reward bought competence | Reuse this lever for this child |
| Rises, **collapses below baseline** | Crowding out | Never use this lever on this child again |
| **Does not move** | Not reward-responsive here | Stop spending it |

We do not argue about whether external motivation works. We measure it per child and show the curve.

**Age handling.** Normative intrinsic motivation declines with age and the curve is **non-linear**:
steep 9 to 12, flat 12 to 15, rising after. The number is always reported against an age-expected
baseline, or it misflags at both ends.

### 3.4 Cause classifier

Three causes. The instantaneous signatures of the last two are near-identical, so **history is the
discriminator**.

| Signal | Plateau | Devaluation | Loss of interest |
|---|---|---|---|
| Free-choice return | holds | **falls** | falls |
| Required attendance | holds | **holds** | falls |
| Success rate | **falling** | flat | flat |
| **Errors on mastered skills** | unchanged | **rising** | rising |
| Breadth | **narrow**, one skill cluster | broad | broad |
| Learning-curve slope | **flat below asymptote** | degrading | too few points |
| Prior high-effort phase | present | **required** | **absent** |

Errors on already-mastered skills is the strongest single discriminator available (San Pedro et al.
2013, β = −1.145 controlling for knowledge). A plateaued child still gets easy things right; a
disengaged one does not. This requires per-skill mastery estimates, so BKT is not optional.

**Two traps to engineer around.** A **dip**, where performance actively worsens, is the signature of a
child inventing a better method. Do not intervene on a dip, and fit an exponential per child rather
than a power law against the population. And **devaluation attenuates exhaustion**: the child who has
stopped caring looks *calmer*. Attendance hides it, which is why the trigger is the free-choice ratio.

---

## 4. The issue database

Four fixes. **The engine picks based on the diagnosed cause; the guide does not browse a menu.** Which
fix is blocked matters as much as which is offered.

| Cause | Fix, in order | Blocked |
|---|---|---|
| **Plateau** | 1. Drop the tier to clearable. 2. If it persists past a probe window, parent co-participation | **No reward.** A reward on a standard the child keeps missing is the worst design measured, d = −0.80. **No switch.** They may be about to leap |
| **Devaluation** | 1. Break from the activity, paired with a competence rebuild. 2. Escalate to a human. 3. Switch spike if it persists | **No reward.** Rewards on a devaluing child buy attendance and deepen the problem |
| **Loss of interest** | 1. Reward lever. 2. Parent co-participation. 3. Switch spike | Nothing blocked. This is the low-interest case where rewards help, d = +0.28 |

Rewards fire precisely where the evidence says they work and are blocked precisely where they do the
most harm. That gating is the whole value of having a classifier.

**Break** is never rest alone. The existing recovery logic already encodes this: a break is paired with
subtracting load and rebuilding competence, and it explicitly does not mean quitting.

**Switch spike** is the loop closing. The child returns to the wall with the other hypotheses weighted
up in the offer set. It is last resort on every path, and blocked entirely on plateau.

---

## 5. Parent involvement

You asked for this twice and draft 1 dropped it. It is a **type** variable with a strongly negative
option, not a dial from low to high.

**What we ask a parent to do:**

| Move | Evidence |
|---|---|
| **Do the activity alongside them**, as a co-learner and not a judge | Successful young musicians' parents increased their own involvement in the domain over time; those whose children quit did not |
| **Process praise, specific and nongeneric.** "You tried the fork three ways before it worked" | Person praise produces helpless responses after setbacks in children as young as four; genericness alone is sufficient to cause it |
| **Open a door** the child cannot open alone, their choice whether to take it | Autonomy support relates to achievement r = .12 and to wellbeing r = .30, invariant across region, culture, age and sex |

**What we never ask a parent to do:** sit and help with the work (parental content support is
*negatively* related to achievement longitudinally, while autonomy support is the only dimension
positively related), praise the child rather than the work, or apply pressure.

**Bribes.** They are allowed, and they route through the same constrained architecture as everything
else in §6. A parent-delivered reward is an input reward, on a clearable standard, delivered
immediately, never partial. A tangible reward outside those rules is the exact design with
d = −0.80 behind it.

**One thing worth instrumenting:** parental anxiety about practice measured *before* a child starts
predicts them quitting. It is a cheap onboarding question and an early risk marker.

---

## 6. Reward architecture

Constrained in the engine. A guide cannot configure their way into a harmful design.

1. **Inputs only.** Puzzles attempted, sessions started, drills completed. Never rating, contest result
   or placement. Paying $2 per book read produced 0.180σ on reading comprehension; paying for test
   scores produced roughly zero, because a child offered money for a score does not know what to do
   differently.
2. **Clearable.** The standard is set so the child clears it at least four times in five, and rises
   with skill. The gap between clearing and missing is the gap between d = −0.15 and **d = −0.80**.
3. **Nothing partial ever rendered.** A goal is met, or the day does not mention it. No 2-of-5 stars,
   no half-filled bars, no visible streak breaks, no ranks.
4. **Immediate.** All motivating power vanishes at a one-month delay. Timing beat magnitude 35% to
   19%, and a delayed reward performed the same as no reward at all.
5. **Boring sub-skill only.** Rewards help on low-interest tasks (d = +0.28) and hurt on high-interest
   ones (d = −0.09). Reward the endgame drills, never the game.
6. **Small and non-monetary at the young end.** A ~$3 trophy beat a $10 cash treatment for younger
   children, and small rewards are easier to withdraw cleanly.
7. **Every application is a measured episode.** Baseline, intervention, withdrawal. This is where the
   external term comes from.

---

## 7. The chess app

The one pursuit built deep this week. Everything the engine needs comes from here.

- **Tiers**, so difficulty is a controllable variable and the setpoint loop can close
- **Two modes**, so the cell dimension is real: a timed ladder (`compete`) and puzzle
  composition or analysis (`investigate`)
- **Attempt reporting** on every try, correct or not. Chess is currently the only thing in the
  product that does this, which is why it unlocks the motivation engine
- **Hints** with dwell time, so hint abuse separates from genuine help-seeking
- **Difficulty choice** offered, never assigned
- **Replay** distinguishable as after-solve versus after-fail

---

## 8. Signals

### Emitted

| Signal | Fields |
|---|---|
| `surfaced` | cell, position |
| `open` | cell, **prompted**, mode |
| `attempt` | correct, tries, mode |
| `solve` | tier, time, mode |
| `hint` | index, **dwell** |
| `abandon` | position in task |
| `difficulty_chosen` | tier, offered set |
| `replay` | after solve, or after fail |
| `session` | start, end, entry point |

**`prompted` and `mode` are the two fields everything depends on.** Without `prompted` there is no
free-choice measure and the internal term is meaningless. Without `mode` there is no cell, and
hypotheses 2 and 3 become guesses.

### Derived

| Derived | Rule |
|---|---|
| `cross_day_return` | Latest predecessor on an earlier UTC day, unprompted |
| `free_choice_return` | That, and no reward active, no notification pending, no streak at stake |
| `success_rate` | Rolling, suppressed below 4 judged attempts |
| `carelessness` | Error on a skill BKT marks mastered |
| `wheel_spinning` | Separates from productive persistence in **3 practice opportunities**, from hints, prior correctness and time on skill |
| `learning_slope` | Exponential fit per child, residual against own asymptote |
| `first_pick` | First cell opened in a session, before anything primes it |
| `replay_after_solve` | Play rather than achievement |

**Capture but never score:** dwell, cursor time, scroll depth. They live on the raw interaction and are
structurally absent from the type the belief math reads, so they cannot be multiplied into a belief.

---

## 9. The guide console

Two panels per child, nothing else by default.

```
  ARI MERCADO                                        [ Promote ]  [ Park ]

  SPIKE
  ████████████████████░░░░  Chess × compete      strong
  ████████░░░░░░░░░░░░░░░░  Chess × investigate  close · probing

  MOTIVATION  42 ↓                          [ why ]
  Plateau · stuck on knight forks for 9 days
  → Drop the puzzle tier one step           [ Apply ]
```

`why` expands to the two terms and the evidence. The guide never reads a narrative to find the action,
and never sees a number without a button beside it.

---

## 10. What we do not claim

- **Age 6 is measurement-limited.** The intrinsic versus extrinsic split has a reliability of 0.06 at
  age 6, where the two constructs correlate .82. Six-year-olds get the spike read; the split starts at 7.
- **We do not detect burnout.** Nothing is validated below age 9, and a 2026 review of 33 instruments
  found none meets standards for recommendation at any age. We detect a behavioural pattern and say so.
- **A single drop is noise.** The standard error of a two-occasion difference is around 0.45 SD against
  a normative annual decline of 0.05 to 0.20 SD. Alerts need a sustained pattern.
- **We cannot name a regulation type.** Introjected and identified regulation both look like "keeps
  going without a reward." We measure whether a lever worked, not why a child cares.
- **Rewards do not grow the love.** No longitudinal study shows external regulation converting into
  intrinsic motivation. What is supported at these ages is that **achievement predicts later intrinsic
  motivation and not the reverse** (Garon-Carrier et al. 2016, N = 1,478). The reward buys repetitions,
  repetitions build competence, competence is what interest is downstream of.

---

## 11. The week

| Day | Work |
|---|---|
| 1 | `prompted` and `mode` on every chess event. PostHog transport. Nothing downstream runs without these |
| 2 | Chess depth: two modes, tiers, hints with dwell, attempt reporting, difficulty choice |
| 3 | BKT per skill, then carelessness and wheel-spinning off the back of it |
| 4 | Motivation engine: internal from existing `lowerBound`, external as reward episode |
| 5 | Cause classifier, the four fixes and their gating, the probe |
| 6 | Console: two panels, one button |
| 7 | Scripted two-month history, live session on top, rehearse |

**Critical path is day 1.**

---

## 12. Open

1. Does the child see their own motivation number? Default no, on the same argument that bans
   parent-visible metrics.
2. Self-report later as low-weight corroboration? Three bands exist if wanted (ESMS 6 to 8, decomposed
   Harter 8 to 14, AMS 13+), scored natively and never cross-compared. Nobody has ever vertically
   scaled a motivation instrument.
3. COPPA review on PostHog before any real child.
4. ~~Does Joe's cash sit inside the constrained architecture or beside it?~~ **Decided:** cash sits
   with the guides, given at their discretion. The engine observes rewards rather than controlling
   them, so §6 becomes advice, and a one-tap reward log becomes mandatory. Without it a paid return
   is silently counted as free choice. See `SIGNALS.md` Part C.
