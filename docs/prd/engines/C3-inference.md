# Engine Spec — Interest Inference Engine (C3)

**Status:** Draft v1 · 2026-07-22 · **Amended 2026-07-25** · Owner: (eng)
**Purpose:** Turn the behavioral event stream into the revisable, ranked **1–3 candidate spikes**, expressed as calibrated beliefs per `(domain × work-mode)` cell — never a scalar or a fixed label.
**Grounding:** Discovery App PRD §6.4; measurement-validity hardening spec (leaner program).

> **Pending revision — read before implementing against this.** The ages 6–8 evidence review
> (`docs/research/passion-pipeline/06-activity-design-ages-6-8.md`) overturned several assumptions
> below, and `docs/proposals/interest-engine-data-collection-v2.md` proposes the changes. **Nothing
> in that proposal has landed yet**, so this document still describes shipped behaviour except where
> marked "→ v2". The headline: at 6–8, **choice predicts durable interest and duration does not**.
>
> **Scope correction.** This engine is not a 6–8 topic finder. Eight packages plus the guide console
> import `@gt100k/interest-inference` (signal-pipeline, hypothesis-store, student-profile, wellbeing,
> family, timeback, guardrails, specialization-planner), so it is the spine of the whole 6–14 system.
> Any age-conditional parameter needs an age band threaded through the engine first: it models no age
> today, only recency decay.

---

## 1. What it outputs

For each `(domain × work-mode)` cell (at both coarse and fine domain levels): a **calibrated belief** that the cell represents a genuine, durable interest, plus the **supporting vs. disconfirming evidence** behind it. The top cells become the ranked candidate spikes in the hypothesis store (C4). When evidence is thin/conflicting, it outputs **"not sure yet"** and the hypothesis stays `EXPLORING`.

## 2. How it computes (principled now → ML-tuned later)

A transparent Bayesian model:

1. **Prior** — start from environment inventory + aptitude tilt + discretionary-XP prior, **shrunk toward similar-kid patterns** (partial pooling) so a new kid isn't judged off one data point (cold-start).
2. **Update over a trajectory** — fold in the depth signal families as they arrive (five today:
   `unrequired_revision`, `chosen_challenge`, `failure_recovery`, `self_authored_scope`,
   `artifact_competence`), weighting by:
   - **novelty-decay** (first-exposure discounted until a decay window passes),
   - **voluntary vs. prompted** (only voluntary returns feed the interest signal).
     **→ v2:** split into `cross_day_return` (the signal) and `same_session_reopen` (recorded,
     weight 0). Reopening something 30 seconds later is not the same evidence as coming back on
     day 4, and the split is what makes the PRD's 7- and 30-day horizons computable at all.
   - **depth** (active construction > passive dwell). **→ v2:** delete the `magnitude` field.
     It is specified only as "depth for returns, strength for depth families", which invites an
     implementation as active time — and because it multiplies α, duration would silently become
     the dominant term. One event = one occurrence.
   - **recency/trajectory** (a rising trajectory over 7-/30-day per-cabin revisits, not a single snapshot).
   - **missingness = missing** (a gap never lowers a belief; it routes to a human, never an auto-label).
   - **→ v2, new: the choice set.** A return to the only available option is not a preference.
     Record what was available and declined, and treat a decline as weak negative evidence
     normalized by choice-set size. (Disjoint from `skip` by construction: `skip` requires a
     previously engaged cell, a decline is available-and-never-engaged.)
3. **Separate topic from style** — a low-rank factorization over the cell grid pulls apart a **domain loading** (loves audio across modes) from a **work-mode loading** (loves building across topics) — the maker-vs-topic-loyalist split.
   **→ v2:** weight each cell's contribution to the marginals by its evidence mass. The means are
   unweighted today, so a cabin holding one gadget outvotes a cabin holding seven.
4. **Calibrate** — output calibrated uncertainty (conformal-style); wide interval → "not sure yet."
5. **Learn later** — parameters are hand-set from research at launch and **re-fit as longitudinal outcomes accrue** (the banked ground-truth). No supervised training at launch (no labels yet).

## 3. Validity program (leaner, per decision)

- **In:** behavior (primary) + a light kid/family check-in; the "not sure yet" default; tag-validity gating (C2); **bank the longitudinal outcome data from day one**.
- **Out (by decision):** no sampled blinded expert cross-check; no randomized-exploration reserve.
- **Accepted risk:** early mis-reads are harder to catch, and there's some self-fulfilling-prophecy risk; watched via coverage-breadth + reopen-rate metrics (G6), backstopped by the banked outcome data.

## 4. Reads at two granularities

Aggregate cells up the domain hierarchy: the **coarse** read (cabin-level) is robust and used early; the **fine** read (sub-topic) is used to make a spike actionable once enough signal accrues. A spike names both a domain path and a work-mode profile.

## 5. Interfaces

- **In:** `ActionEvent` stream (C1/C2), TimeBack priors (G2), environment inventory (onboarding).
- **Out:** per-cell beliefs + evidence → hypothesis store (C4) → guide console (F1).
- **Calibration:** reads/writes the Calibration/Validation Harness (G5).

## 6. Hard constraints (carried from the PRDs)

Behavior only (no affect/face). No scalar "passion score," no fixed label — beliefs + reasons only. Reward-neutral (nothing here is shown to the kid as a score). Human owns any of-record judgment.

## 7. Open items

- Exact novelty-decay window, trajectory weighting, and the "not sure yet" threshold are **calibratable defaults** (horizons are evidence-anchored; the numbers are ours to tune on cohort 1).
- Feedback-loop monitoring (since the randomized reserve was dropped) leans harder on coverage-breadth + reopen-rate as tripwires.
- **`W_APT = 0.5` cites SMPY, which identifies at age 13 and offers no validated early-childhood
  analogue.** Down-weighting it for younger children is proposed, and blocked on threading an age
  band through the engine.
- **Cross-cabin comparison is confounded** until an artifact-appeal baseline exists: generic game
  affinity independently predicted voluntary return (β = 0.267, p = .003). Any surface that compares
  a child's time across cabins must carry that caveat.
- ~~**`hypothesisState` is written but never read.**~~ **Fixed 2026-07-26.** It was worse than
  described: the deriver's own S3 fixture sat at `EXPLORING`, the state every hypothesis is born in,
  and still produced full `S3_AUTHORSHIP` inputs, so the planner would return a staged plan with a
  technical mentor and a real-community audience for a spike nobody had looked at. The guide console
  filtered for `ACTIVE`/`CANDIDATE` before calling in, so nothing shipped wrong, but the rule lived
  in the caller and the next caller would have inherited nothing.

  The guard is now at the input boundary, where the detective GC4 audit could never reach:
  `derivePlanInputs` returns `null` unless a human has certified the hypothesis, and
  `PlanInputs.hypothesisState` is typed `PlannableState` rather than `string`, so an uncertified
  spike cannot be assembled into plan inputs even by a caller building them by hand. The console now
  imports `isPlannableState` instead of keeping its own copy of the rule.
