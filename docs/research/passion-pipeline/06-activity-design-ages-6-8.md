# 06 — Activity Design for Ages 6–8: What the Child Actually Does, and Whether We Can Read It

> Research memo for GT100K PassionLab **Discover**. Answers the question "**which activities do we put in front of a
> 6–8-year-old, in which mediums, and how do we know they are engaging the domain rather than the game?**" Runs four
> adversarially-verified deep-research passes and converts them into design decisions, conflicts with the current
> specs, and concrete changes to `passion/apps/mvp-jul24`.

**Owners:** Felipe Caicedo · David Ordoñez · Passion Pipeline research track
**Status:** Research input to `docs/prd/DISCOVERY-APP-PRD.md` §5.3–5.7 / §6, `specs/009-two-axis-tagging`,
`specs/011-interest-inference`, and the `mvp-jul24` gadget registry.
**Grounding:** `docs/research/passionBrainlift.md` (SPOV 1–3, Insight 4/6b), `05-assessment-measurement.md`,
`hardening/06-measurement-validity-coldstart.md`.
**Raw evidence:** `raw/06a-activity-formats-6-8.md` · `raw/06b-wrapper-vs-domain-6-8.md` ·
`raw/06c-domains-at-6-8.md` · `raw/06d-work-modes-at-6-8.md`

**Scope honesty, read first.** The 6–8 band is genuinely under-evidenced. Across all four passes the strongest studies
sit at ages 9–12, in undergraduates, or in single-family ethnographies. Most findings below carry 2-1 verification
votes and "medium" confidence; the handful of 3-0 findings are flagged. Two of the four passes returned a *negative*
headline — no format reliably triggers-and-maintains at this age, and the nine work-modes have no established
developmental basis at this age. Treat this memo as the best available reasoning under thin evidence, not as settled
numbers. Every threshold proposed here is a calibratable default, consistent with PRD §14.3.

---

## 1. Thesis (one line)

At 6–8 the measurable thing is **choice**, not time: build activities where the domain content *is* the game mechanic
(never a quiz in a wrapper), keep each block to ~10–15 minutes across 4–6 spaced exposures, read the signal from
**which activity the child chooses and returns to unprompted across days** plus a **delayed out-of-product probe** —
and never trigger a domain the product cannot then maintain, because a triggered-then-abandoned domain measurably ends
up *below* where it started.

---

## 2. The five findings that change the design

### 2.1 Intrinsic integration is the highest-leverage lever we have *(medium, 2-1)*

The closest experimental analogue to our design is Habgood & Ainsworth's *Zombie Division*. They held the shell
**literally constant** — same 3D dungeon, characters, story, progression — and varied *only how the domain content
bound to the core mechanic*. Intrinsic: the maths **is** the mechanic (you divide skeletons). Extrinsic: the identical
maths is an end-of-level multiple-choice quiz attached to identical gameplay. Given a penalty-free, position-randomised
choice, children spent **75.7 min (SD 35.5) on the intrinsic version vs 10.28 min on the extrinsic** one
(paired t = 7.38, df = 15, p < .001, r = .89).

**The operational test.** If you could replace the domain content with arbitrary symbols and the game would still play
the same, the binding is extrinsic and the engagement you measure is wrapper engagement.

*Limits:* that free-choice arm is n = 16 at mean age 10y4m — not our band — and children were reminded they were
expected to try both versions (a demand characteristic working *against* the observed gap).

### 2.2 At 6–8, in-session telemetry was blind; only a delayed probe discriminated *(high, 3-0)*

Same research programme, and this arm *is* our band: n = 58, ages 7y1m–8y10m (mean 8y0m), randomised to
intrinsic / extrinsic / no-maths-relevance, ~2 hours of play plus matched teacher-led reflection. Condition
differences appeared **only at delayed test** (F(2,48) = 7.49, p < .001, partial η² = .24; intrinsic beat extrinsic by
~16.9 points and control by ~20.7). Only the intrinsic group kept improving *after play stopped* (post-to-delayed gain
7.04, p < .04). **Immediate engagement and immediate post-test did not discriminate at all.**

This is the single most important finding for `mvp-jul24`, which currently measures in-session engagement exclusively.

### 2.3 A triggered-but-unmaintained domain ends up worse than untouched *(medium, 2-1)*

In a multi-session digital maths game (Number Navigation, n = 212), situational interest was stable *within* sessions
but declined *across* them — and children whose in-game situational interest was **not maintained showed a marked
decline in domain interest pre-to-post**. Meanwhile the reverse also holds: doing nothing is not neutral either. In a
four-week primary-science study the untriggered control group's individual interest **decayed** (mean slope −.03,
p < .001) while the triggered group's rose (+.03, p < .001).

So both "trigger and abandon" and "never trigger" lose ground. The only winning move is trigger *plus* maintenance.

### 2.4 The current interest signals are measuring the wrong things *(high, 3-0 / medium, 2-1)*

- **`solves` largely indexes prior ability.** Mining 2,500+ log files from 7–8-year-olds: in-game performance measures
  correlated with **pre-test ability** (r = .37–.44 for level reached, unique tasks, total tasks) but with **learning
  gain not at all** (r = .18, .20, .25, −.14, all ns). Worse, accuracy inverted — **79.1% vs 70.1%, higher in the
  *less* effective condition**, because those children attempted roughly half as many items (198.2 vs 382.2).
  *(Caveat: the correlation analysis is n = 34, so the nulls are low-powered.)*
- **`activeMs` is not monotonic in interest.** Its meaning reverses by child: stronger performers stayed longer as
  learning progress rose (β = −.51, p = .025), while weaker performers stayed with the most **familiar** option
  (β = .96). Persistence is independently confounded with **epistemic uncertainty** — 24–56-month-olds persisted
  longer under higher uncertainty searching for an object they never find, with **no reward at all** — and with
  **executive function**: EF and metacognition predicted Exploiter/Balancer over Explorer class membership (N = 136,
  ages 3–7).
- **Aggregate exposure measures specifically failed where choice measures worked.** In 4-year-olds (N = 87), switch
  frequency (p = .80) and total session length (p = .24) were unrelated to learning, whereas **trial-wise voluntary
  next-choice** was predicted by novelty (β = .30, p < .001).
- **Time-on-task is only interpretable where difficulty affords showing the construct.** In Physics Playground,
  convergent validity of the persistence trace fell from r = .51 (low performers) to r = .22 (high performers),
  because easy levels give strong performers no occasion to persist.

### 2.5 The work-mode axis has no established developmental basis at 6–8, and routing from it walks into the learning-styles trap *(mixed)*

This pass returned the most uncomfortable result, and it bears directly on `specs/009`.

- **(a) Availability.** There is **essentially no verified developmental evidence** establishing when each of the nine
  modes becomes observable at 6–8. The only surviving age-specific finding is *negative*: probe questions without
  direct instruction produced **no** improvement in 7–10-year-olds' ability to design unconfounded experiments or draw
  valid inferences (Chen & Klahr 1999, N = 87). Every stronger companion claim — that control-of-variables starts at
  7, that debugging is measurable in grades 1–2 — **failed verification**. Verdict: treat the nine-mode partition as
  an **untested adult-derived taxonomy** at this age, not an established one.
- **(b) Stability.** The ceiling is low. Meta-analytic rank-order consistency of trait-like childhood individual
  differences is **~.31 over 6.7 years (~10% shared variance)**. Repeated preference assessments yielded stable
  hierarchies for only **40%** of participants. **60%** of single-sitting assessments were stable across consecutive
  rounds — i.e. rank order shifts *within* one session. Apparent stability is partly an **elicitation artifact**:
  paired forced-choice formats produced 67–70% stability versus **0–27% for single-item formats** (3-0).
  Generalizability-theory work on 6–11-year-olds shows one observation session is **not** a dependable score.
- **(c) Operationalization does exist, behaviorally.** Hanley et al. (2007) measured preference purely as **time
  allocation across nine concurrently available free-play zones**, momentary time sampling on proximity + engagement,
  with **94–98% interobserver agreement at a 90 s interval** (collapsing to 71.7% at 30 s). Individual allocations
  spanned 0–50% and were idiosyncratic — so within-child preference hierarchies *are* detectable above group averages.
  But the sample was 3.5–5.5 years, the partition was physical zones not abstract modes, and **no test-retest
  stability of the rankings was reported**. Critically, the same measure proved **highly manipulable**: embedding
  reinforcement raised time in the three originally *least*-preferred zones nearly **sixfold** (instructional zone
  16% → 72% of intervals, 16 of 20 children shifted).
- **(d) The learning-styles trap, stated precisely.** A work-mode preference is **not** automatically a repackaged
  learning style — Pashler et al. debunked the **meshing hypothesis** (that matching instruction to a measured
  preference improves learning), not the existence of preferences. **But the product asserts meshing the moment it
  routes content, instruction, or a recommendation from the measured mode.** It then owes a crossover (disordinal)
  interaction design — learners grouped by measured mode, randomly assigned to methods, common outcome test — and that
  bar has **essentially never been cleared** (3-0); several methodologically adequate studies **contradict** meshing.
  The psychometric base rate is brutal: of 13 flagship style instruments evaluated against four minimum standards,
  **1 met all four; ~46% met one or none**.

---

## 3. Design decisions

**D1 — Every signal-bearing gadget must be intrinsically integrated, and the binding is declared in data.**
Add `bindingType: "intrinsic" | "extrinsic"` to the `Gadget`/`Artifact` record. Only `intrinsic` gadgets emit
belief-bearing `CellEvent`s; `extrinsic` ones are trigger-only and emit context, never signal. Ship the §2.1 swap test
as a review checklist item: *could the domain content be replaced by arbitrary symbols with gameplay unchanged?*

**D2 — Choice replaces time as the primary in-product instrument.**
Record the decision points, not the dwell: which cabin was approached, which gadget was picked when others were
available, what was picked *next*, and what was returned to on a later day unprompted. This follows §2.4 — trial-wise
choice predicted learning where aggregate dwell did not. `activeMs` is retained as **low-weight context** only, which
is what PRD §6.3 already says about passive metrics; this memo says `solves` belongs in the same bucket.

**D3 — Add a delayed, out-of-product probe. Without one, we are measuring nothing at 6–8.**
Two instruments, both evidence-backed:
- **Pressure-off return probe.** Feasible at scale: after a 6-week intervention, home access unlocked, teachers
  instructed not to assign or reward, ~1,590 children analysed, with a **~2-week initiation window**. This aligns with
  the PRD §10 "≥2-week no-prompt gap" — keep it, and treat the 2-week window as the *minimum observation period*, not
  a waiting time.
- **Delayed parent interview at ~7 weeks** (validated range 32–67 days, mean 51) separating **"focused"** interests
  bound to the specific triggering materials from **"broad"** interests that transferred to the topic or practice. This
  is the wrapper-vs-domain distinction, already operationalized, and it fits PRD §9's "parent-observed behavior carries
  more weight at 6–8."

**D4 — Session shape: ~10–15 minute blocks, 4–6 spaced exposures per domain.**
Real K–4 activity blocks centre on **~10–17 min** (median 12.8, IQR 10.6–17.1), and each extra minute lowers on-task
log-odds by 0.0174 (≈1.42× better on-task odds for a 10- vs 30-min block). A **vigilance decrement is detectable
within ~6 minutes** in 5–7.9-year-olds — **and it persists despite continuous per-trial star/sticker rewards**. The
only dosage benchmark available is 4 distinct triggering stimuli over 4 weeks at 2×1h/week, but that is ages ~9–10;
port the **count and spacing**, not the duration. Triggering recurs in later phases (3-0), so plan **re-triggers**, not
one taster followed by maintenance only.

**D5 — Never trigger a domain we cannot maintain (the coverage-pass constraint).**
From §2.3. A breadth-first pass that touches 8 cabins as novelty-discounted first exposures, with no maintenance path
for the 7 the child does not pursue, risks *depressing* interest in those 7. Options, in preference order:
(i) narrow the simultaneous coverage set and rotate it, so every triggered cabin has a live follow-up;
(ii) guarantee each triggered cabin ≥2 spaced re-exposures before it can be dropped;
(iii) accept the cost explicitly and measure it. **Do not ship the coverage pass without picking one.**

**D6 — Demote the work-mode axis from trait to rolling state estimate, and do not route from it.**
Concretely: (a) keep `mode` as a **tag on artifacts** (what the activity affords) — that part is unaffected;
(b) stop treating a child's inferred mode as a durable property — re-estimate continuously and never surface a mode
label; (c) **the concierge must route from what the child chose or asked for, not from an inferred mode-marginal**,
because the latter is the meshing hypothesis and we cannot discharge its evidentiary burden; (d) require **multiple
occasions** before any mode attribution is reported, per the generalizability-theory finding; (e) prefer
**forced-choice presentation** (two concrete options side by side) over single-item offers when eliciting a
preference — 67–70% vs 0–27% stability. Note that PRD §6.4's low-rank factorization and `011`'s marginal
decomposition remain *the right way to separate topic from style analytically*; the change is that its output is a
current-state hypothesis feeding a human, never a routing key or a label.

**D7 — Keep the zero-reward stance; it is now over-determined.**
Three independent lines converge. Engagement-contingent rewards — points merely for spending time, the exact analogue
of a points-for-play shell — show the largest **child/adult divergence** of any contingency: **d = −0.46 in children**
(43 studies) vs −0.21 in college students (Qb = 6.76, p < .01). *State this carefully:* engagement-contingency is not
the largest undermining effect in absolute terms (contingency categories did not differ significantly, Qb(3) = 5.97,
p < .12; the source names less-than-maximum performance-contingent rewards as the most detrimental, d = −0.80). The
defensible claim is that it is **the only contingency with a significant age moderator on free-choice, and its child
estimate is large** — which is precisely the case that applies to us.

The undermining **grows** rather than decays: −0.35 immediate → −0.49 within a week → **−0.55 after ~2 weeks**, and
*all* delayed-assessment studies used children. Praise is not a safe substitute at this age (d = 0.11, ns, vs 0.43 for
adults). And per D4, rewards did not even purchase the attention they are meant to buy.

**A detection warning that matters for D3.** The behavioural undermining (−0.46) is far larger than the self-report
undermining (−0.15) for the same subset. A rewarded child can therefore **still say they like the domain while
voluntarily returning to it less** — so a satisfaction question will not catch this failure. Only a behavioural
pressure-off probe will.

The `mvp-jul24` no-points design is correct and should be treated as a hard constraint, matching PRD §11.

**D8 — Treat 6–8 signals as "what to offer next," never as selection.**
Prediction at this age is unreliable to the point of being unusable for selection: cognitive-ability rank order
measured at age ≤7 does not reach even group-decision stability (r > .70) until **age 16** (205 samples, 87,408
participants; medium, 2-1); **~60%** of grade-3 top-3% scorers fall out within one year (medium, 2-1) and **60–65% by
grade 8** (high, 3-0), with single-domain subtests *less* stable than composites; in sport, junior performance explains
**2.2%** of senior variance, falling to ~0 or slightly negative at ages 11–13 (high, 3-0). SMPY — the flagship identification base — identifies at
**age 13**, and supplies no validated early-childhood analogue. This is consistent with SPOV 3's reversible-and-plural
framing and with `011`'s refusal to emit a scalar; it argues additionally against weighting `aptitudeTilt` heavily in
the cold-start prior at 6–8.

---

## 4. The medium mix

The user-facing ask was "a mix of mediums — videos, games, other activities." The evidence supports a mix, but with
sharply different *roles*, because **signal fidelity and trigger power are inversely arranged**.

| Medium | Trigger power | Signal fidelity | Role |
|---|---|---|---|
| **Intrinsically-integrated interactive gadget** | moderate | **high** (instrumented, choice-bearing) | **The measurement instrument.** ≥1 per cabin, mandatory. |
| **Hands-on / physical making** | high | low in-product (offline) | Extension. Transfer across media is real — 4–6-year-olds carried a Tower-of-Hanoi solution from iPad to the physical puzzle *with no prior physical exposure*, and physical practice conferred no advantage — so **screen-vs-physical is the wrong cut; demand structure is what matters**. Read return via guide/parent report. |
| **Short video** | high | **low** (Layer-3, coarse) | Trigger and deep-dive only, **never** the signal. Video matched hands-on on knowledge *only* under heavy scaffolding (teacher-edited, task-relevant, pre-briefed clips); hands-on advantages on higher-order skills did not persist. |
| **Real-world / field experience** | **very high** | low | Trigger. In ~8h of video of 4–8-year-olds outdoors, 30 triggers and 85 interest episodes were coded — but individual interest was rarely reached inside a single session, so it **requires repeats**. |
| **Live practitioner demo** | low–moderate | none | Deprioritize for measurement. One 45–60 min scientist visit across 4,805 surveys moved attitudes by only **d = 0.06–0.13**. |
| **Storybook / read-aloud** | unknown | none | Trigger. No usable evidence surfaced at this age; do not build measurement on it. |
| **Social arrangement** (cross-cutting) | — | — | **Partner/small-group and individual work produced the highest on-task rates; whole-group the lowest** (OR 1.51–1.62). Prefer solo or pairs; avoid whole-group formats. |

Two cross-cutting cautions. **Engineered triggers beat incidental ones** — only 18% of 397 coded family triggering
events were deliberately designed, yet designed ones held attention *longer* (3-0). And **skill transfer does not
imply interest transfer**: the Tower-of-Hanoi result is a skill result, and §2.3 is the interest counter-example.

---

## 5. Conflicts with the current specs and app

| # | Where | Conflict | Proposed resolution |
|---|---|---|---|
| C1 | `mvp-jul24` gadget registry | All 7 gadgets are `topic: "math"` and are essentially **one** work-mode (deductive constraint satisfaction). A 1×1 matrix cannot be decomposed — no marginals, no topic-vs-style attribution. PRD §5.3 already states **"≥6 cabins is a floor."** | Re-tag: nonogram / logic-grid / minesweeper / pipes / LITS belong under `games-strategy` + `investigate`, **not** `math-puzzles`. They survive replacing numbers with symbols, so by §2.1 they are intrinsically integrated for *deduction*, not for *mathematics*. Then build ≥1 genuinely intrinsic maths gadget. |
| C2 | `mvp-jul24` interest store | Measures `activeMs` + `opens` + `solves`, all in-session. Per §2.2 in-session telemetry did not discriminate at 7–8; per §2.4 `solves` tracks prior ability and `activeMs` is non-monotonic. | Adopt D2 + D3. Emit `CellEvent`s with `returnState` and `novelty` at day grain; demote `solves`/`activeMs` to context. |
| C3 | PRD §5.7 coverage pass | Samples ≥6 domains as novelty-discounted first exposures with no guaranteed follow-up — the §2.3 backfire pattern. | D5: pick one of the three mitigations before shipping. |
| C4 | `specs/009` work-mode axis | The nine modes are an untested adult-derived partition at 6–8, with a low stability ceiling and a live learning-styles hazard. | D6: keep modes as artifact tags; demote the child-side read to a re-estimated state; forbid routing from inferred mode. |
| C5 | PRD §5.5 concierge | Routes probes from the cross-domain pattern — i.e. from the inferred read. That is the meshing hypothesis. | D6(c): route from stated/chosen interest and offer forced-choice pairs; keep the chat unscored (PRD already does). |
| C6 | All 7 current gadgets | **Renzulli's own open-endedness test:** if an agreed solution, existing right answer, or prescribed solving strategy exists, the activity is *by definition* not Type III enrichment but a teacher-assigned training exercise. Nonograms and logic grids have unique right answers and prescribed strategies. | Acceptable for *discovery tasters* — but they cannot be the evidence of authentic project work that SPOV 5 and the Evidence Graph need. Keep the two roles distinct and label them distinctly. |
| C7 | PRD §6.4 cold-start prior | `aptitudeTilt` is weighted as a "strong, objective" prior, citing SMPY. | §D8: SMPY identifies at 13. Down-weight `W_APT` at 6–8, or gate it on age/capability. |
| C8 | Cross-cabin comparison (architectural) | Games-methodology researchers warn explicitly: *"This cautions against operationalising different conditions of constructs as different games."* Feature-matching failed for Anderson & Dill, who matched seven dimensions and were confounded by an eighth. Generic game affinity independently predicts voluntary return (β = 0.267, p = .003). | Hold the shell constant across cabins and vary only content binding (§2.1). Threshold return on **above-median play intensity**, not any-play — that made the affinity confound non-significant. Carry game affinity as a measured covariate. Keep PRD §5.3's equal-polish rule, which is a *measurement* requirement, not a nicety. |

---

## 6. What we still do not know

1. **Six of eight cabins have no age-specific evidence at all.** The verified base covers mathematics, music,
   dance/movement, sport, and thinly chess. Essentially nothing on programming, visual art, engineering/making, field
   science, writing, or second languages — and second-language acquisition has a large separate literature this pass
   did not reach.
2. **Does the early-specialization result transfer out of sport?** Preckel et al. say the comparable research does not
   exist. The plausible mechanisms in sport — physical maturation timing, overuse injury, physical burnout — may not
   apply to cognitive/artistic domains at all.
3. **Chess dissents from the pattern.** Earlier starting age predicted higher rating *even controlling for deliberate
   practice*, which the meta-analysts read as a possible sensitive period. This conflicts with the violin null and the
   sport late-start advantage; unresolved.
4. **How many domains to sample is not answered by the literature.** What is supported is a negative and a direction:
   do not make training exclusive and year-round at 6–8; keep sampling; defer exclusive investment to late adolescence.
5. **No validated instrument separates domain interest from wrapper interest in 6–8s.** §2.1's design is the closest
   thing, and its free-choice arm is n = 16 at age ~10.
6. **Voluntary return loads on both constructs.** In a fully controlled mixed-effects model, in-game performance
   (β = 0.565) *and* game enjoyment (β = 0.458) both contributed non-redundant variance to voluntary return. So the
   PRD's primary signal cannot separate domain from wrapper by itself — hence D1 (remove the separable wrapper) plus
   D3 (probe outside the product).
7. **Do not validate traces against child self-report.** In Physics Playground the trace persistence measure
   correlated **r = −.01 and −.06** with an 8-item self-report instrument. Convergent validation must use covert
   performance measures dimensionally matched to the task's demands.

---

## 7. Method

Four independent deep-research passes (fan-out search → fetch → cluster → 3-vote adversarial verification →
synthesis), run 2026-07-25: **696 agents, ~30.7M tokens, 107 sources fetched, 509 claims extracted, 111 confirmed,
64 killed in verification, 38 conflicts surfaced.** Claims that failed verification are listed in each raw report's
refuted section and are deliberately **not** used above. Verification votes and confidence are carried inline so a
reader can weight each claim; "3-0" means three independent verifiers with distinct lenses agreed, "2-1" means one
dissented.
