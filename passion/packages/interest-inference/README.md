# @gt100k/interest-inference

The **brain** of discovery (`C3` in `docs/prd/passionApps.md`). It turns a stream of per-`(domain × work-mode)`
behavioral events into a **calibrated belief per cell** — how likely the cell is a genuine, durable interest —
ranks the top **1–3 candidate spikes**, separates **topic-love from style-love**, and honestly reports
**"not sure yet"** when evidence is thin.

It never emits a scalar "passion score" or a fixed label. The output is per-cell beliefs + reasons + ranked
candidates; language downstream is "current evidence suggests… / next test is…", never "you are an X".

Pure, deterministic, offline: a closed-form **Beta-Bernoulli** model with **no training data**, **no network**,
**no LLM**, and **no external dependency**. Grounding: `specs/011-interest-inference/spec.md`,
`docs/prd/engines/C3-inference.md`.

## Pipeline

```
events + priors ─▶ foldEvents ─▶ toBelief ─▶ rankCandidates + attributionFor ─▶ InterestRead
                    (α, β)         (mean/sd/    (candidates,       (per-cell beliefs
                                    lowerBound)  topic vs style)     + candidates)
```

`runInference(events, priors, now)` runs the whole chain.

## The model

Each `(domain × work-mode)` cell is a Beta-Bernoulli posterior.

- **Prior** (from the domain's `DomainPrior`): `alpha_prior = 1 + (inEnvironment ? 0.5 : 0) + 0.5·aptitudeTilt + 0.5·discretionaryTilt`, `beta_prior = 1`.
- **Evidence** (per event, recency-weighted `w = 0.5^(ageDays/14)`):
  - `cross_day_return` (a prior engagement of the cell on an earlier UTC day) → `alpha += 1.0·w`
  - depth family (`unrequired_revision`, `chosen_challenge`, `failure_recovery`, `self_authored_scope`, `artifact_competence`) → `alpha += 0.5·w`
  - `skip` (non-novel, a cell engaged before and passed over) → `beta += 0.5·w / choiceSetSize`
  - `decline` (non-novel, a cell on offer and never engaged) → `beta += 0.15·w / choiceSetSize`
  - one choice is one observation, so both disconfirming kinds are divided by the number of
    alternatives passed over at that moment (`choiceSetSize`, absent → 1); without that, breadth of
    discovery would suppress every spike. The two kinds are disjoint: a cell yields at most one per session.
  - `novelty` events, `prompted_return`, `same_day_engagement`, and silence → **excluded** (triggered / prompted / same-day / missingness ≠ interest)
- **Posterior**: `mean = α/(α+β)`, `sd = √(αβ / ((α+β)²(α+β+1)))`, `lowerBound = max(0, mean − sd)`, `evidenceMass = (α−α_prior)+(β−β_prior)`, `distinctDays` = the UTC calendar days on which some event moved α or β.
- **Confidence** (honest "not sure yet"): `evidenceMass ≥ 6` **and** `distinctDays ≥ 2` **and** `2·sd ≤ 0.35`.
  The day gate matters more than the mass floor: preference hierarchies at 6–8 are roughly 60% stable
  within one sitting against ~40% over months, and mass alone cannot tell three returns in one
  afternoon apart from three returns across three weeks. Only scored events buy a day, so a novelty
  event, a `prompted_return`, a `same_day_engagement` and an `artifact_competence` all leave the count
  where they found it.
- **Candidates**: confident cells with `lowerBound ≥ 0.6`, ranked by `lowerBound` desc (ties by key), capped at 3.
- **Attribution** (rank-1 marginal decomposition, an explicit proxy for a later learned factorization): compare
  the cabin-marginal mean vs the mode-marginal mean; a gap `> 0.1` → `"domain"` (topic-loyalist) or `"style"`
  (maker); otherwise `"mixed"`.

### Constants

| Name | Value | | Name | Value |
|---|---|---|---|---|
| `ALPHA0`/`BETA0` | `1`/`1` | | `HALFLIFE_DAYS` | `14` |
| `W_ENV` | `0.5` | | `MIN_EVIDENCE_MASS` | `6` |
| `W_APT`/`W_XP` | `0.5`/`0.5` | | `MIN_DISTINCT_DAYS` | `2` |
| `A_RETURN` | `1.0` | | `MAX_CI_WIDTH` | `0.35` |
| `A_DEPTH` | `0.5` | | `K_LCB` | `1.0` |
| `B_SKIP` | `0.5` | | `SPIKE_THRESHOLD` | `0.6` |
| `B_DECLINED` | `0.15` | | `MAX_CANDIDATES` / `ATTR_MARGIN` | `3` / `0.1` |

## Output

```ts
InterestRead {
  cells: CellBelief[];      // per-cell alpha/beta/mean/sd/lowerBound/evidenceMass/distinctDays/confident/attribution/reasons
  candidates: Candidate[];  // ranked 1–3 spikes, each with a topic-vs-style attribution
}
```

No scalar, no fixed label — ever.

## Run

```sh
pnpm --filter @gt100k/interest-inference test   # unit + golden tests
pnpm --filter @gt100k/interest-inference demo    # print an InterestRead for a synthetic stream
```

**SYNTHETIC data only.**
