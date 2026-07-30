# @gt100k/interest-inference

The **brain** of discovery (`C3` in `docs/prd/passionApps.md`). It turns a stream of per-`(domain × work-mode)`
behavioral events into a **calibrated belief per cell** — how likely the cell is a genuine, durable interest —
ranks the top **1–3 candidate spikes**, separates **topic-love from style-love**, and honestly reports
**"not sure yet"** when evidence is thin.

It never emits a scalar "passion score" or a fixed label. The output is per-cell beliefs + reasons + ranked
candidates; language downstream is "current evidence suggests… / next test is…", never "you are an X".

Pure, deterministic, offline: a closed-form **Beta-Bernoulli** model with **no training data**, **no network**,
**no LLM**, and **no external dependency**. Grounding: `specs/011-interest-inference/spec.md`,
`docs/prd/engines/C3-inference.md`, and the E-numbered changes in
`docs/proposals/interest-engine-data-collection-v2.md`. Note the spec's own status banner: §3 and §6 of it
are historical, still describing `magnitude`, `voluntary_return`, `aptitudeTilt` and
`MIN_EVIDENCE_MASS = 3`. `src/model.ts` is the current contract and carries the reasoning for each change
inline.

## Pipeline

```
events + priors ─▶ foldEvents ─▶ toBelief ─▶ rankCandidates + attributionFor ─▶ InterestRead
                    (α, β)         (mean/sd/    (candidates,       (per-cell beliefs
                                    lowerBound)  topic vs style)     + candidates)
```

`runInference(events, priors, now)` runs the whole chain.

## The model

Each `(domain × work-mode)` cell is a Beta-Bernoulli posterior.

- **Prior** (from the domain's `DomainPrior`): `alpha_prior = 1 + (inEnvironment ? 0.5 : 0) + 0.5·masteryTilt + 0.5·discretionaryTilt`, `beta_prior = 1`.
- **Evidence** (per event, recency-weighted `w = 0.5^(ageDays/14)`):
  - `cross_day_return` (a prior engagement of the cell on an earlier UTC day) → `alpha += 1.0·w`
  - depth family (`unrequired_revision`, `chosen_challenge`, `failure_recovery`, `self_authored_scope`) → `alpha += 0.5·w`
  - `external_report` with `reportScope: "broad"` (a delayed adult interview finding the interest
    reached the topic rather than the materials) → `alpha += 0.25·w`
  - `skip` (non-novel, a cell engaged before and passed over) → `beta += 0.5·w / choiceSetSize`
  - `decline` (non-novel, a cell on offer and never engaged) → `beta += 0.15·w / choiceSetSize`
  - one choice is one observation, so both disconfirming kinds are divided by the number of
    alternatives passed over at that moment (`choiceSetSize`, absent → 1); without that, breadth of
    discovery would suppress every spike. The two kinds are disjoint: a cell yields at most one per session.
  - a `role: "secondary"` reading — the second mode of a two-mode action, inferred from the artifact's
    affordances rather than acted directly — is scaled by `A_SECONDARY`. It is the only graded thing left
    on an event, and it is an engine constant rather than a number an emitter can put on the wire.
  - `novelty` events, `prompted_return`, `same_day_engagement`, a `focused` `external_report`, and
    silence → **excluded** (triggered / prompted / same-day / bound-to-the-materials / missingness ≠ interest)
  - `artifact_competence` is a depth family that scores **nothing here** (`scoresInterest`). It judges how
    good the made thing is, which is the Evidence Graph's question; a child can do competent work in
    something that bores them. It is still emitted and still read — the specialization planner derives
    `producerIdentity` from it — so it is unscored, not deleted.
- **Posterior**: `mean = α/(α+β)`, `sd = √(αβ / ((α+β)²(α+β+1)))`, `lowerBound = max(0, mean − sd)`,
  `evidenceMass = (α−α_prior)+(β−β_prior)`, `observedMass` = the same per-event weights summed **without**
  recency decay, `distinctDays` = the UTC calendar days on which some event moved α or β.
- **Confidence** (honest "not sure yet"): `observedMass ≥ 6` **and** `distinctDays ≥ 2` **and** `2·sd ≤ 0.35`.
  Sufficiency reads the undecayed mass on purpose. Decay is geometric, so a steady cadence converges:
  fortnightly returns ceiling at 2.0 against a threshold of 6, which made a child who came back every other
  week for years unconfirmable at any `n`, while 013's promotion gate was asking for exactly that shape.
  Recency answers "what do we believe now" and belongs in α/β; it must not answer "did we ever look".
  The day gate matters more than either mass: preference hierarchies at 6–8 are roughly 60% stable
  within one sitting against ~40% over months, and a count can be run up inside an afternoon where a
  calendar cannot. Only scored events buy a day, so a novelty event, a `prompted_return`, a
  `same_day_engagement` and an `artifact_competence` all leave the count where they found it. So does a
  `broad` `external_report`, which moves α but deliberately marks no day: a report is a day an adult spoke,
  not a day the child did anything, so no quantity of adult recollection can make a cell confident on its
  own.
- **Candidates**: confident cells with `lowerBound ≥ 0.6`, ranked by `lowerBound` desc (ties by key), capped at 3.
- **Attribution** (rank-1 marginal decomposition, an explicit proxy for a later learned factorization): compare
  the cabin-marginal mean vs the mode-marginal mean; a gap `> 0.1` → `"domain"` (topic-loyalist) or `"style"`
  (maker); otherwise `"mixed"`. Both marginals are weighted by each cell's `evidenceMass`, so a cabin holding
  one cell the child touched once cannot outvote a cabin holding seven they kept returning to.

### Constants

| Name | Value | | Name | Value |
|---|---|---|---|---|
| `ALPHA0`/`BETA0` | `1`/`1` | | `A_SECONDARY` | `0.5` |
| `W_ENV` | `0.5` | | `HALFLIFE_DAYS` | `14` |
| `W_MASTERY`/`W_XP` | `0.5`/`0.5` | | `MIN_EVIDENCE_MASS` | `6` |
| `A_RETURN` | `1.0` | | `MIN_DISTINCT_DAYS` | `2` |
| `A_DEPTH` | `0.5` | | `MAX_CI_WIDTH` | `0.35` |
| `A_REPORT_BROAD` | `0.25` | | `K_LCB` | `1.0` |
| `B_SKIP` | `0.5` | | `SPIKE_THRESHOLD` | `0.6` |
| `B_DECLINED` | `0.15` | | `MAX_CANDIDATES` / `ATTR_MARGIN` | `3` / `0.1` |

`A_REPORT_BROAD` is ours, not the research's. The literature validates the delayed-interview instrument and
its timing but supplies no weight, so it is a calibratable default. It sits below `A_DEPTH` deliberately: an
adult's recollection weeks later is weaker than something the child was observed doing, and it must never
outvote behaviour.

## Output

```ts
InterestRead {
  cells: CellBelief[];      // per-cell alpha/beta/mean/sd/lowerBound/evidenceMass/observedMass/
                            // distinctDays/confident/attribution/supporting/disconfirming
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
