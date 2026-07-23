# Engine Spec — Interest Inference Engine (C3)

**Status:** Draft v1 · 2026-07-22 · Owner: (eng)
**Purpose:** Turn the behavioral event stream into the revisable, ranked **1–3 candidate spikes**, expressed as calibrated beliefs per `(domain × work-mode)` cell — never a scalar or a fixed label.
**Grounding:** Discovery App PRD §6.4; measurement-validity hardening spec (leaner program).

---

## 1. What it outputs

For each `(domain × work-mode)` cell (at both coarse and fine domain levels): a **calibrated belief** that the cell represents a genuine, durable interest, plus the **supporting vs. disconfirming evidence** behind it. The top cells become the ranked candidate spikes in the hypothesis store (C4). When evidence is thin/conflicting, it outputs **"not sure yet"** and the hypothesis stays `EXPLORING`.

## 2. How it computes (principled now → ML-tuned later)

A transparent Bayesian model:

1. **Prior** — start from environment inventory + aptitude tilt + discretionary-XP prior, **shrunk toward similar-kid patterns** (partial pooling) so a new kid isn't judged off one data point (cold-start).
2. **Update over a trajectory** — fold in the six active-construction signal families as they arrive, weighting by:
   - **novelty-decay** (first-exposure discounted until a decay window passes),
   - **voluntary vs. prompted** (only voluntary returns feed the interest signal),
   - **depth** (active construction > passive dwell),
   - **recency/trajectory** (a rising trajectory over 7-/30-day per-cabin revisits, not a single snapshot).
   - **missingness = missing** (a gap never lowers a belief; it routes to a human, never an auto-label).
3. **Separate topic from style** — a low-rank factorization over the cell grid pulls apart a **domain loading** (loves audio across modes) from a **work-mode loading** (loves building across topics) — the maker-vs-topic-loyalist split.
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
