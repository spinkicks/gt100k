# PassionLab v2 · PRD

**Status:** draft 1 · 2026-08-06 · supersedes the nine-app scope
**One line:** We find and build the beginning of a student's spike, ages 6 to 14.
**Input:** six months of roughly 30 minutes a day. **Output:** ranked hypotheses for what a child will
stay with, plus a motivation read that tells a guide when to intervene and how.

---

## 0. The constraint

**One guide, thirty children.** Four minutes per child per week, most needing zero. Every design choice
below answers to that number. Guides get a number and a button, never a narrative to interpret.

---

## 1. Decisions taken

| # | Decision |
|---|---|
| 1 | The engine outputs a **motivation number**. `0.3 × external + 0.7 × internal`. Decomposes on click. SPOV 2 is rewritten. |
| 2 | A spike is a **cell**: pursuit × mode. Chess tags a mode on every action. |
| 3 | Engine recommends a lever, **guide approves in one click**, adult delivers. |
| 4 | Ages **6 to 14**. |
| 5 | Both motivation terms are **behavioural**. Nobody is asked anything. |
| 6 | The reward architecture is **constrained in the engine**, not left to the guide. |
| 7 | Three reward rules ship together: immediacy, inputs only, boring sub-skill only. |
| 8 | Two apps: **child** and **adult**. |
| 9 | Week one builds **chess deep**, the wall stays as the choice surface. |
| 10 | Demo runs live end to end on scripted history. |

---

## 2. Scope

**In:** the discovery wall, one deep pursuit app (chess), the signal pipeline, the spike engine, the
motivation engine, the cause classifier, the reward architecture, the guide console.

**Out for now:** mastery maps, the specialization planner, mentor brokerage, the project workspace,
the parent digest, EvidenceGraph. Discovery is the novel part; the world already has resources for
building a spike once it is chosen. Our handoff is the read plus the venue, and all 44 pursuits already
carry a real external judge.

---

## 3. The engine

### 3.1 Spike probability · already built, do not rebuild

`@gt100k/interest-inference` already computes exactly this. Beta-Bernoulli per cell, weighted events,
14-day half-life, `lowerBound = mean − √var`, behind four gates. Full documentation in
`docs/presentation/prediction-model.html`. PostHog becomes transport; the classification stays
server-side because cross-day versus same-day, skip versus decline and the novelty window are all
stateful comparisons against a child's history.

**Output:** ranked hypotheses 1, 2, 3 with a confidence band, attributed to domain, style or mixed.

### 3.2 Motivation

```
motivation = 0.3 × external + 0.7 × internal        // when external is defined
motivation = internal                               // before any reward episode
```

**Internal term.** The existing cell `lowerBound`. It is already a 0 to 1 posterior built on unprompted
cross-day return, which is the field's primary behavioural index of intrinsic motivation (Deci 1971).
It needs no new engine.

A free-choice event requires **all** of: no prompt, no notification pending, no active reward, no streak
at stake, and alternatives on screen. If any of those fail, the return is logged and scores nothing.
That strictness is what makes the number mean anything.

**External term.** The measured response to a reward, per child:

```
episode  = baseline window → intervention window → withdrawal window
external = normalised lift in free-choice return during intervention
durable  = did the lift hold after withdrawal
```

Undefined until a reward has been applied at least once, which is honest rather than a gap. Three
outcomes, each actionable:

| Pattern | Read | Action |
|---|---|---|
| Rises, **holds** after withdrawal | The reward bought competence | Reuse this lever for this child |
| Rises, **collapses below baseline** | Crowding out | Never use this lever on this child again |
| **Does not move** | Not reward-responsive here | Stop spending it |

This is the answer to the extrinsic motivation question. We do not argue about whether rewards work.
We measure it per child and show the curve.

**Age handling.** Normative intrinsic motivation declines with age, and the curve is **non-linear**:
steep from 9 to 12, flat 12 to 15, rising after. The number is always reported against an age-expected
baseline. A straight line would misflag at both ends.

### 3.3 Cause classifier

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

**Errors on already-mastered skills is the single best discriminator in the literature** (San Pedro
et al. 2013, β = −1.145 controlling for knowledge). A plateaued child still gets easy things right. A
disengaged one does not. Computing it needs per-skill mastery estimates, so BKT is not optional.

**Two traps to engineer around.**

A **dip**, where performance actively worsens, is the signature of a child inventing a better method
(Gray & Lindstedt 2017). Do not intervene on a dip. Fit an exponential per child, never a power law
against the population, because the power law is an aggregation artifact.

**Devaluation attenuates exhaustion** (Isoard-Gautheur et al. 2015). The child who has stopped caring
looks *calmer*, not more distressed. Any detector keyed on distress markers systematically misses the
case we most want to catch. This is why attendance hides it and why the free-choice-to-required ratio,
not attendance, is the trigger.

### 3.4 Fixes

| Cause | Fix | Why |
|---|---|---|
| **Plateau** | Recalibrate difficulty to clearable. **Never a reward.** | A reward on a standard the child keeps missing is the worst design measured, d = −0.80 |
| **Devaluation** | Escalate to a human. Restore autonomy, reduce evaluative surfacing | No software fix. Cannot be named from behaviour alone |
| **Loss of interest** | **Apply the reward lever** | This is the low-interest case where rewards help, d = +0.28 |

Note what this table does: rewards fire precisely where the evidence says they work, and are blocked
precisely where the evidence says they do the most harm.

---

## 4. Signals

### Emitted by the chess app

| Signal | Fields |
|---|---|
| `surfaced` | cell, position |
| `open` | cell, **prompted**, mode |
| `attempt` | correct, tries, mode |
| `solve` | tier, time, mode |
| `hint` | index, **dwell on hint** |
| `abandon` | position in task |
| `difficulty_chosen` | tier, offered set |
| `replay` | after solve, or after fail |
| `session` | start, end, entry point |

**`prompted` and `mode` are the two fields everything downstream depends on.** Without `prompted` there
is no free-choice measure. Without `mode` there is no cell, and hypothesis 2 and 3 become guesses.

### Derived server-side

| Derived | Rule |
|---|---|
| `cross_day_return` | Latest predecessor of this cell falls on an earlier UTC day, unprompted |
| `free_choice_return` | Cross-day return **and** no reward active, no notification pending, no streak at stake |
| `success_rate` | Rolling, suppressed below 4 judged attempts |
| `carelessness` | Error on a skill BKT marks mastered |
| `wheel_spinning` | Separates from productive persistence in **3 practice opportunities**, from hint requests, prior correctness and time on skill |
| `learning_slope` | Exponential fit per child, residual against own asymptote |
| `first_pick` | First cell opened in a session, before anything primes it |
| `replay_after_solve` | Play rather than achievement |

**Capture but never score:** dwell, cursor time, scroll depth. They live on the raw interaction and are
structurally absent from the event type the belief math reads, so they cannot be multiplied into a
belief later.

---

## 5. Reward architecture

Constrained in the engine. A guide cannot configure their way into a harmful design.

**Rules, all enforced:**

1. **Inputs only.** Puzzles attempted, sessions started, drills completed. Never rating, contest result
   or placement. Fryer: $2 per book read produced 0.180σ on reading comprehension, paying for test
   scores produced roughly zero, because a child offered money for a score does not know what to do
   differently.
2. **Clearable.** The standard is set so the child clears it at least 80% of the time, and rises as
   skill rises. The gap between clearing and missing is the gap between d = −0.15 and **d = −0.80**.
3. **Nothing partial ever rendered.** A goal is met, or the day does not mention it. No 2-of-5 stars,
   no half-filled bars, no visible streak breaks, no ranks. This is the single most dangerous pattern
   in the literature and the one a product builds by default.
4. **Immediate.** All motivating power vanishes at a one-month delay. Timing beat magnitude 35% to
   19%, and a delayed reward performed the same as no reward at all.
5. **Boring sub-skill only.** Rewards help on low-interest tasks (d = +0.28) and hurt on high-interest
   ones (d = −0.09). Reward the endgame drills, never the game.
6. **Small and non-monetary at the young end.** A ~$3 trophy outperformed a $10 cash treatment for
   younger children. Small rewards are also easier to withdraw cleanly.
7. **Every application is a measured episode.** Baseline, intervention, withdrawal. That is where the
   external term comes from.

**Praise, where the product speaks:** sincere, specific, process-focused, nongeneric. *"You tried the
fork three different ways before you found it."* Never *"you're a natural"* or *"you're a chess kid."*
Trait praise produces helpless responses after setbacks in children as young as four, and generic
phrasing alone is sufficient to cause it. Never *"should"* or *"keep it up"* attached to a reward.

---

## 6. The guide console

Two panels per child. Nothing else by default.

```
  ARI MERCADO                                        [ Promote ]  [ Park ]

  SPIKE
  ████████████████████░░░░  Chess × compete      strong
  ████████░░░░░░░░░░░░░░░░  Math × investigate   early

  MOTIVATION  42 ↓                          [ why ]
  Plateau · stuck on knight forks for 9 days
  → Drop the puzzle tier one step           [ Apply ]
```

`why` expands to the two terms and the evidence. The guide never has to read a narrative to find the
action, and never sees a number without a button next to it.

---

## 7. What we do not claim

Written here so it is said before anyone asks.

- **Age 6 is measurement-limited.** The intrinsic versus extrinsic split has a reliability of 0.06 at
  age 6, where the two constructs correlate .82. We report the spike read for six-year-olds and
  suppress the split until 7.
- **We do not detect burnout.** Nothing is validated below age 9, and a 2026 COSMIN review of 33
  instruments found none meets standards for recommendation at any age. We detect a behavioural
  pattern and we call it that.
- **A single drop is noise.** With the best available reliability the standard error of a two-occasion
  difference is around 0.45 SD against a normative annual decline of 0.05 to 0.20 SD. Alerts require a
  sustained pattern, never one reading.
- **We cannot name a regulation type.** Introjected and identified regulation both look like "keeps
  going without a reward." We measure whether a lever worked, not why a child cares.
- **Rewards do not grow the love.** No longitudinal study shows external regulation converting into
  intrinsic motivation. What is supported, at exactly these ages, is that **achievement predicts later
  intrinsic motivation and not the reverse** (Garon-Carrier et al. 2016, N = 1,478, grades 1 to 4). The
  reward buys repetitions, repetitions build competence, and competence is what interest is downstream
  of. The reward is the delivery vehicle, not the active ingredient.

---

## 8. The week

| Day | Work |
|---|---|
| 1 | `prompted` and `mode` on every chess event. PostHog transport. Without these nothing else runs |
| 2 | Chess depth: tiers, hints with dwell, attempt reporting, difficulty choice |
| 3 | BKT per skill, then carelessness and wheel-spinning off the back of it |
| 4 | Motivation engine: internal term from existing `lowerBound`, external term as reward episode |
| 5 | Cause classifier and the fix table |
| 6 | Console: two panels, one button |
| 7 | Scripted six-month history, live session on top, rehearse |

**Critical path is day 1.** Everything downstream reads `prompted` and `mode`.

---

## 9. Open

1. Does the child ever see their own motivation number? Default no, on the same argument that bans
   parent-visible metrics.
2. Self-report as low-weight corroboration later? Three instrument bands exist if we want it
   (ESMS 6 to 8, decomposed Harter 8 to 14, AMS 13+), scored natively and never cross-compared.
   Nobody has ever vertically scaled a motivation instrument.
3. COPPA review on PostHog before any real child.
4. Who sets the reward budget, and does Joe's cash sit inside our constrained architecture or beside it.
