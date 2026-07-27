# Proposal — Interest engine v2: what the engine should collect, and what it should stop scoring

**Status:** Proposal, needs sign-off. Not implemented.
**Author:** Felipe Caicedo (via research pass 2026-07-25)
**Affects:** `specs/011-interest-inference` (`@gt100k/interest-inference`), `specs/012-signal-pipeline`,
`docs/prd/DISCOVERY-APP-PRD.md` §6.2–6.4, and the event-emission side in `passion/apps/mvp-jul24`.
**Evidence:** `docs/research/passion-pipeline/06-activity-design-ages-6-8.md` — **read §8 first**; raw
reports in `docs/research/passion-pipeline/raw/`.
**Scope assumption:** the engine serves a **topic-interest finder** for ages 6–8. Not project
development, not selection, no relationship to the Evidence Graph.

---

## 1. Why this exists

The Beta-Bernoulli model in `011` is well-founded and most of it should not change. But the evidence
review found that **the strongest predictor of durable interest at 6–8 is choice, and the weakest is
duration** — and the current contract has a field (`magnitude`) through which duration can silently
become the dominant term, plus no way to record what a child chose *against*. Three of the five gaps
below are one-field fixes; none require abandoning the model.

Headline numbers behind this (full citations in the memo):

- Aggregate dwell and session length were **flat against learning** (p = .80, p = .24) in exactly the
  design where **trial-wise choice** predicted it.
- Dwell is **non-monotonic in interest**: stronger performers stay when learning progress rises
  (β = −.51); weaker performers stay with the most **familiar** option (β = .96). It is separately
  confounded with epistemic uncertainty (persistence rises with no reward at all) and with executive
  function.
- In-game performance tracked **prior ability** (r = .37–.44) and **not** learning gain (all ns), with
  accuracy *inverting* in the less effective condition (79.1% vs 70.1%).
- At ages 7–8, **in-session telemetry discriminated nothing**; only a delayed measure did
  (partial η² = .24).

---

## 2. Do not change these

They are correct and non-obvious. Please don't regress them while doing the rest.

| Keep | Why |
|---|---|
| Event-level `CellEvent` rather than aggregates | The key call. This is what the choice-vs-dwell evidence vindicates. |
| Beta-Bernoulli per `(domain × work-mode)` cell, closed-form, no training | Fine. Uncertainty is native, which we need. |
| `prompted_return` excluded from belief | Matches the free-choice paradigm (>90% of a 128-study meta-analysis measured behaviour after the contingency ends). |
| `novelty` excluded | Triggering is easy and near-worthless as evidence. |
| Silence = **no update** (missingness ≠ disinterest) | Correct, and rare in practice. |
| Recency half-life (trajectory, not snapshot) | Single time-points don't forecast. |
| Confidence gate + honest "not sure yet"; **never a scalar or label** | Right for no-ground-truth, and required by PRD §11. |
| The low-rank / rank-1 decomposition | This is the mechanism that separates "loves deduction" from "loves maths". Keep it — see E7. |

---

## 3. Changes requested

### E1 — Delete `magnitude`. One event = one occurrence. *(fixes P1, highest priority)*

`magnitude: number [0,1]` is currently defined only as *"depth for returns, strength for depth
families."* With no specified derivation, the obvious implementation is active time — which reimports
every dwell confound and, because it multiplies α, makes duration the dominant term in the posterior.

**Change:** remove the field. Emit **one event per discrete occurrence**; the model counts events.
α increments become `A_* * recencyWeight`, with no magnitude multiplier.

If batching is needed for efficiency, add `count: integer ≥ 1` **capped at 3 per cell per session**, so a
single spammy session cannot dominate a cell.

### E2 — Split `voluntary_return` by horizon. *(fixes P4)*

`"reopened it 30 seconds later"` and `"came back on day 4 unprompted"` are currently the same `kind`. The
across-day one is the signal.

```
"cross_day_return"      // the signal — full A_RETURN weight
"same_session_reopen"   // recorded, weight 0 (context/diagnostic only)
```

Carry `dayGap: number` on `cross_day_return`. This is also what makes PRD §6.2's 7-day and 30-day
horizons computable — today they are not, because nothing persisted carries a timestamp at day grain.

### E3 — Record the choice set. *(fixes P2 — the biggest conceptual gap)*

A return to the only available cabin is not a preference. **Choice is only meaningful against what was
declined.**

> **AMENDED 2026-07-25, after P0 shipped (#161): no new field was needed.** This section originally
> specified a per-choice-moment `choiceSet: readonly string[]` plus `surfacedBy` and `sessionId`. All
> three already existed. `SurfacedRecord` is defined in `signal-pipeline/src/model.ts` as "a cell or
> artifact that was shown or available in a session", `deriveSkips` already reads it as "surfaced this
> session, not engaged this session", and `Interaction` already carries `timestamp`, `sessionId`, and
> `prompted` (which is `surfacedBy` inverted). **`SurfacedRecord` is the choice set**, at session
> granularity.
>
> Session granularity was taken over per-choice-moment deliberately. With the cell matrix still
> effectively 1×1 (every gadget one topic, one work-mode), a per-moment set would record alternatives
> that are all the *same cell*, so the extra fidelity is not merely unused but unobservable. It is also
> a lossy aggregation rather than a different shape, so moving to per-moment later is additive. And the
> normalization `B_DECLINED / |choiceSet|` under-weights each decline at session granularity, since the
> session set is a superset of the true alternatives at any one moment. Under-weighting negative
> evidence about a seven-year-old is the right direction to be wrong.
>
> Revisit when the cell matrix widens, not on a schedule.

### E4 — Treat a decline as weak negative evidence, normalized by choice-set size

Today `skip` is the only disconfirming signal, which is conservative to the point of being lossy: a child
picking gadget A over six visible alternatives told us something about all seven.

**Change:** for each cell in `choiceSet`, apply
`beta += B_DECLINED * recencyWeight / |choiceSet|`

Normalization matters — with 7 gadgets on screen, an unnormalized decrement would inflate β roughly six
times faster than α accrues. Suggested `B_DECLINED = 0.15`. **This is a revealed preference against
available alternatives, which is better-founded than `skip`.**

> **IMPLEMENTED 2026-07-25. The normalization argument turned out to apply to `skip`, which was already
> live and already wrong.**
>
> This section reads as though unnormalized decrements are a hazard to avoid in new code. They were
> not hypothetical: `skip` applied a full `B_SKIP` to every known-but-unengaged cell every session, and
> the child app surfaces every enterable cabin on map render. So a child who returned to their favourite
> every session still accrued skips on all the others, and beta grew with the number of cabins they had
> explored. Over ten sessions, ignoring decay: two known cells gave a posterior mean of 0.647, four gave
> 0.407, seven gave 0.262, against a `SPIKE_THRESHOLD` of 0.6. **Past about four cabins the spike stopped
> being detectable, so the engine got worse at its only job precisely as the child got more curious.**
>
> Both kinds are now shares of one choice rather than independent observations. `CellEvent` carries
> `choiceSetSize`, the count of alternatives passed over at that moment, and the pipeline divides by it.
> Absent means "not a choice moment" and scores at full weight, which is what keeps the golden fixture's
> lone skip unchanged.
>
> The two kinds are **mutually exclusive** per cell per session: `skip` when the child has engaged that
> cell before, `decline` when they never have. Emitting both would score one behavioural fact twice.
> `B_DECLINED` (0.15) sits far below `B_SKIP` (0.5) because passing over something never tried is much
> weaker evidence than passing over a known love.
>
> One thing this needed that the section does not mention: a surfaced cell now seeds the first-exposure
> map. `isNovelty` treats an unknown cell as novel, so without it a never-engaged cell could never leave
> the novelty window and **E4 would have been completely inert**. That seeding is confined to the
> skip/decline map; engagement novelty still derives from engagements alone, so alpha is untouched.
>
> Guarded by `interest-inference/test/breadth-invariance.test.ts`, which asserts both arms: normalized
> spread across 1, 3 and 6 alternatives is 0.0029 and all stay above threshold; unnormalized is 0.0984
> and sinking.

### E5 — Down-weight system-surfaced returns

A return the system engineered is not the same evidence as one the child initiated. Apply a multiplier to
α when `surfacedBy === "system"` (suggested `W_SURFACED = 0.5`). Keeps the anti-feedback-loop posture the
hardening memo asks for without needing a full randomized reserve (which ADR-0004 already declined).

> **DEFERRED 2026-07-25, for the same reason `chosen_challenge` is a problem: nothing can emit it.**
>
> `surfacedBy` needs the product to distinguish a cell the system put in front of the child from one the
> child navigated to. The discovery app has no recommender, no ranked shelf, and no nudge; the map shows
> the enterable cabins, so every return is child-navigated by construction. `surfacedBy` would be a
> constant `"self"`.
>
> Adding the field anyway is the trap we already walked into once. `stretchSeeking` reads permanently
> false because nothing emits `chosen_challenge`, and that silently caps the specialization ladder at S2.
> A constant field is worse than a missing one, because it reads as a measurement.
>
> This one at least fails safe: a missing `surfacedBy` means full weight, which is today's behaviour.
> But it would still be an unbacked claim in the contract. Note that `prompted` already covers the
> stronger case of an adult or the system explicitly directing the child, and it is emitted.
>
> **Unblocks when** the child app gains any system-driven surfacing: a recommendation, a "try this next",
> a ranked or personalized map. At that point the emitter and this multiplier should land together.

### E6 — Raise `MIN_EVIDENCE_MASS`. *(P5)*

Three non-novel voluntary returns currently earns `confident`. Against preference data showing ~40% stable
hierarchies over months and **~60% stability within a single sitting**, three events will read confident
far too early.

**Suggested:** `MIN_EVIDENCE_MASS: 3 → 6`, and require the evidence to span **≥2 distinct days**
(a new `MIN_DISTINCT_DAYS = 2` gate). The day-span gate matters more than the count.

This is explicitly a calibration decision, per PRD §14.3 — the *direction* is what's being proposed.

> **IMPLEMENTED 2026-07-25.** Both halves landed: `MIN_EVIDENCE_MASS` 3 → 6, and a new
> `MIN_DISTINCT_DAYS = 2`. `confident` now also requires `distinctDays >= MIN_DISTINCT_DAYS`, and
> `distinctDays` is on `CellBelief` so a guide can see the evidence is spread rather than piled into
> one afternoon.
>
> **A day only counts if an event actually moved alpha or beta on it.** Novelty-excluded events,
> `prompted_return`, `same_day_engagement`, and `artifact_competence` all buy nothing, which keeps the
> gate honest: zero-weight events must not be able to satisfy a gate about evidence being spread over
> time. `skip` and `decline` do count, because they move beta and confidence is about the posterior
> being pinned down, not about it being positive. Days are UTC, which slightly under-counts a child
> playing either side of local midnight; that errs toward slowness, which is the safe direction for a
> gate whose whole purpose is to resist premature certainty.
>
> The golden fixture needed re-deriving, since its old mass of 4.457 sat below the new floor and the
> end-to-end happy path has to keep demonstrating a confident spike. Same seven-day span, with the
> returns a child who came back six days out of seven would actually leave. New values, hand-derived
> and then reproduced by the engine: `alpha 7.704284, beta 1.410168, mean 0.845282, sd 0.113710,
> lowerBound 0.731572, evidenceMass 6.614452, distinctDays 6`. One day deliberately carries both a
> skip and a return, proving a day counts once regardless of sign.
>
> Five downstream fixtures fell below the new bar. Every one was **enriched into a more realistic
> child** rather than having its assertion weakened: they had been written as a single sitting, or as
> five half-decayed returns, which is exactly the shape this gate exists to stop trusting. No gate was
> lowered and no test was deleted or skipped.

> **IMPLEMENTED 2026-07-25, both halves, at the suggested values.**
>
> `confident` is now `evidenceMass >= 6 && distinctDays >= 2 && 2*sd <= MAX_CI_WIDTH`.
> `CellBelief` carries `distinctDays`: the number of distinct **UTC calendar days** on which some
> event actually moved alpha or beta. Membership is granted inside the scoring branches of
> `foldEvents`, so everything the fold declines to score is excluded by construction rather than by
> a parallel list — a novelty event, a `prompted_return`, a `same_day_engagement`, and any depth
> family `scoresInterest` rejects all leave the belief where they found it, so none of them can help
> satisfy a gate that is a claim about evidence being spread over time. `skip` and `decline` do buy
> a day; they move beta.
>
> UTC rather than local time, because the engine takes no timezone and must answer the same wherever
> it runs. That under-counts a child playing either side of local midnight, which is the safe
> direction for a gate whose job is to be slow. An unparseable timestamp buys no day at all, mirroring
> `recencyWeight`'s refusal to decay what it cannot date.
>
> **The golden fixture had to be re-derived and is the main cost of this change.** It carried
> `evidenceMass 4.457407`, below the new floor, so the golden read would have stopped being confident
> and stopped producing a spike. It was enriched, not exempted: same seven-day span, with returns
> added on the two days inside it that previously held only a skip or only a depth signal, plus a
> `failure_recovery`. New values: `α 7.704284`, `β 1.410168`, `mean 0.845282`, `sd 0.113710`,
> `lowerBound 0.731572`, `evidenceMass 6.614452`, `distinctDays 6`.
>
> Five downstream fixtures fell below the new bar and were given the events a real child would have
> generated rather than having their assertions weakened: the 011 demo, 011's `runInference` fixture,
> 012's pipeline fixture (shared with its demo), 014's orchestrator fixture, and the synthetic pilot
> roster's recent cluster (five returns → ten, every other day). Nothing needed the gates relaxed,
> and no case turned up where the new gates looked wrong rather than merely inconvenient.
>
> Guarded by `interest-inference/test/distinct-days.test.ts`: a single UTC day is not confident at any
> mass; the same evidence over two days is; the mass floor and the day gate each fail alone; the four
> unscored kinds buy no day; and two sittings either side of local midnight inside one UTC day count
> once.

#### E6a — the floor now counts observation, not decayed evidence *(amended 2026-07-26)*

Raising the floor to 6 exposed a defect that predates it. `evidenceMass` is the sum of every event's
weight **after** recency decay, and it gated `confident`. Decay is geometric, so a steady cadence
sums to a converging series with a hard ceiling. At `HALFLIFE_DAYS = 14`, returns only:

| Cadence | Ceiling on decayed mass | Reaches 6? |
|---|---|---|
| every 2 days | 10.61 | yes |
| weekly | 3.41 | **never, at any n** |
| fortnightly | 2.00 | **never, at any n** |
| every 3 weeks | 1.55 | **never, at any n** |

A child returning to the same pursuit every fortnight for two years finishes at 2.00. Not "slowly" —
never. Their hypothesis stays `EXPLORING`, so it cannot be promoted, so no plan can be made. At the
old floor of 3 the weekly child squeaked past at 3.41; raising it to 6 shut them out too.

Meanwhile 013's promotion gate asks for the *opposite* shape on purpose: a span of `MIN_TERM_DAYS`
(56) containing a `GAP_DAYS` (14) quiet period the child came back from. The two gates were demanding
incompatible things, and the only silhouette satisfying both is a long sparse tail plus a recent
dense burst, which is exactly, and accidentally, what the synthetic pilot's Dulce has.

The category error is using one number for two questions. **Sufficiency** ("have we observed enough
to say anything") is about how much looking happened, and looking does not un-happen because time
passed. **Strength** ("how much of what we saw still bears on today's belief") is what decay is for.

So `CellBelief` now carries both. `observedMass` sums the same per-event weights undecayed and is
what `confident` gates on; `evidenceMass` keeps its decayed meaning and its E7 job weighting the
marginals, where a cell the child has drifted from should count for less. No constant moved, so the
6 still means the same six returns' worth it always did.

**The limit of this fix, stated plainly.** The CI-width gate converges the same way, because it is
computed from the decayed α/β. A fortnightly cadence drives α to a ceiling of 3.0, where `2·sd`
settles at 0.387 against `MAX_CI_WIDTH` 0.35, so that child is still refused — now on precision
rather than sufficiency. That refusal is honest: if we forget this fast, that little contact really
does not add up to a sharp belief. The lever is `HALFLIFE_DAYS`, a separate decision about how
quickly a child's past should stop counting. **Weekly returners now pass; fortnightly and slower
still do not.**

Guarded by `interest-inference/test/observed-mass.test.ts`, which pins the weekly child becoming
confident, the fortnightly one still being refused *and why*, and that neither the day gate nor the
novelty exclusion was loosened on the way through.

### E7 — Weight the marginals by evidence mass

The rank-1 decomposition currently takes **unweighted** means over cells, so a cabin with one gadget gets
equal footing with a cabin with seven. That biases topic-vs-style attribution toward thin cabins. Weight
each cell's contribution to `domainMarginal` / `modeMarginal` by its `evidenceMass`.

### E8 — Down-weight `aptitudeTilt` at 6–8 — **WITHDRAWN 2026-07-26, premise does not hold**

The request was: `W_APT = 0.5` cites SMPY, which identifies at **age 13** and supplies no validated
early-childhood analogue, so drop it to `0.15` for ages ≤ 8 or gate it on capability.

**`W_APT` is unchanged, and should stay at 0.5.** The argument mis-identifies the signal it is
arguing about, and once the signal is named correctly the evidence points the other way.

`aptitudeTilt` is not an aptitude measure. It is populated in exactly one place —
`passion/packages/timeback/src/map.ts:39` — as `clamp01(sumWMastery / sumW)`, a weighted mean of
**subject mastery** from a TimeBack snapshot. That is *achievement*: what the child has already been
graded as knowing. SMPY's construct is above-level aptitude testing, which is a different measurement
taken for a different purpose. The SMPY citation is a poor fit for `W_APT` regardless of which
direction you adjust it, and the age-13 objection inherits that mismatch.

For achievement, in the band this proposal is scoped to, we already hold a finding that runs the
other way. Garon-Carrier et al. (2016), recorded in `docs/research/passionBrainlift.md` §1.5 and
Insight 13: across grades 1–4 (ages 7–10), **prior achievement predicts later intrinsic motivation,
while motivation does not predict later achievement.** Our own design implication, written down
before this proposal existed, is "build competence first — achievement feeds motivation in the
youngest band." A prior that lets demonstrated mastery in a subject lift the belief that a child will
engage with the matching cabin is the engine doing what that finding describes. Halving it at 6–8
would weaken the term precisely where its evidence is strongest.

Two honest limits, so this is not read as more settled than it is. Garon-Carrier measured
*same-subject* achievement against *same-subject* motivation; our crosswalk maps school subjects onto
cabins, so the term travels a short distance beyond what the study establishes. And the prior is
still a prior: it moves the starting belief only, never `evidenceMass`, and cannot gate anything —
the standing no-gate test in `timeback` holds that line. Those are reasons to keep the weight
bounded, which 0.5 against a `clamp01`-ed input already is. They are not reasons to cut it.

What should change is the **name**, not the number. Calling an achievement mean `aptitudeTilt` is
what produced this proposal item, and it will produce the next one too. Renaming it (`masteryTilt`)
is a mechanical rename across `interest-inference`, `timeback` and their fixtures, and it is the
actual fix. Filed as a follow-up rather than done here, because it touches a published contract.

### E9 — Repurpose the two signals we already collect, rather than deleting them

- **`activeMs` → validity gate + diagnostic, never a belief term.** (i) Classify every open by a
  duration floor (~20–30 s) so a stray click never becomes positive evidence. (ii) Flag the pathological
  shape — high dwell with **no** cross-day return is the familiarity/struggling pattern (β = .96); that's
  a flag for a human, not a posterior update. Carry it as a coarse bucket
  (`under_floor | short | medium | long`) so it cannot accidentally be multiplied into α.

  > **AMENDED 2026-07-25: this section used to contradict itself, and the contradiction was load-bearing.**
  > The prose said the floor decides whether an open "counts as an event at all", i.e. a filter, while the
  > §4 contract lists `under_floor` as a `dwellBucket` *value*, which only makes sense if sub-floor opens
  > are emitted. Resolved in favour of the contract: **the floor classifies, it does not filter.**
  >
  > That inconsistency was harmless while non-engagement was unscored, and became a sign-inverting bug the
  > moment E4 scored declines. Because `SurfacedRecord` is written when an artifact becomes available,
  > dropping a sub-floor open leaves "surfaced this session, never engaged", which is exactly E4's decline
  > definition. Five fifteen-second attempts would have produced zero voluntary returns *and* a decline,
  > turning a brief attempt into negative evidence. Caught in review of #161 and fixed there.
  >
  > `dwellBucket` now lives on `Interaction` (`signal-pipeline/src/model.ts`) and is deliberately absent
  > from `CellEvent`, so dwell cannot reach a posterior structurally rather than by convention. Two tests
  > in `signal-pipeline/test/dwell-never-scored.test.ts` enforce it.
- **`solves` → difficulty calibration, never interest.** The complaint against `solves` is that it indexes
  **prior ability** — which is exactly what you need to choose the next difficulty. Good ability estimate,
  bad interest estimate; use it where ability is the question.

### E10 — Add an out-of-product event channel *(needed for the only measure that worked at 7–8)*

At 7–8 in-session telemetry discriminated nothing. The engine needs to be able to ingest:

- a **pressure-off return** observation (return during a no-prompt window; ~2-week initiation window is
  the validated figure), and
- a **delayed guide/parent report** at ~7 weeks (validated range 32–67 days, mean 51) coded
  `focused` (bound to the specific materials) vs `broad` (transferred to the topic itself).

`focused` vs `broad` **is** the wrapper-vs-domain distinction, already operationalized. Suggest a distinct
`kind: "external_report"` with low weight and an explicit `reporter` field, kept clearly separate from
behavioural traces so it can be excluded from analyses that need behaviour only.

### E11 — Drop `artifact_competence` from the finder's event set

It is a work-quality judgement and belongs to the Evidence Graph, which is out of scope here.

### E12 — Staged: an artifact appeal baseline *(needs data; not now)*

Generic game affinity independently predicted voluntary return (β = 0.267, p = .003), going
non-significant only when thresholded on **above-median** play intensity. Once there is cross-child data,
score a child's choice **relative to that artifact's population choice rate** rather than absolutely, and
threshold return on intensity rather than any-play. Until then this is a known, unmitigated confound and
**cross-cabin comparisons should be reported with that caveat attached.**

---

## 4. Proposed contract

```ts
type CellEventKind =
  | "cross_day_return"      // signal
  | "same_session_reopen"   // context, weight 0
  | "prompted_return"       // excluded from belief
  | "unrequired_revision"   // depth
  | "chosen_challenge"      // depth
  | "failure_recovery"      // depth
  | "self_authored_scope"   // depth
  | "skip"                  // weak negative
  | "external_report";      // out-of-product (E10)

interface CellEvent {
  domainPath: readonly [string] | readonly [string, string];
  mode: string;
  kind: CellEventKind;
  novelty: boolean;
  timestamp: string;                 // ISO-8601
  sessionId: string;

  // choice context (E3)
  choiceSet: readonly string[];      // cellKeys available and not chosen; [] if not a choice moment
  surfacedBy: "system" | "self";

  // horizon (E2)
  dayGap?: number;                   // cross_day_return only

  // diagnostics only — MUST NOT enter alpha/beta (E9)
  dwellBucket?: "under_floor" | "short" | "medium" | "long";

  // optional batching, capped (E1)
  count?: number;                    // integer >= 1, <= 3 per cell per session

  // E10 only
  reporter?: "guide" | "parent";
  reportCode?: "focused" | "broad";
}
```

**Depth families, derived from actions rather than duration:**

| Family | Observable action |
|---|---|
| `unrequired_revision` | reopened a solved puzzle, or changed an answer after being correct |
| `chosen_challenge` | took the harder variant when an easier one was offered |
| `failure_recovery` | resumed after an abandoned or failed attempt |
| `self_authored_scope` | kept going past the win state |

**Constants:**

| Name | Now | Proposed | Note |
|---|---|---|---|
| `A_RETURN` | 1.0 | 1.0 | now applies to `cross_day_return` only |
| *(same-session)* | — | 0.0 | recorded, unscored |
| `A_DEPTH` | 0.5 | 0.5 | magnitude multiplier removed |
| `B_SKIP` | 0.5 | 0.5 | unchanged |
| `B_DECLINED` | — | **0.15** | new, ÷ `|choiceSet|` (E4) |
| `W_SURFACED` | — | **0.5** | new, α multiplier when system-surfaced (E5) |
| `MIN_EVIDENCE_MASS` | 3 | **6** | (E6) |
| `MIN_DISTINCT_DAYS` | — | **2** | new gate; matters more than the count (E6) |
| `W_APT` | 0.5 | 0.5 | **unchanged** — E8 withdrawn, see above |
| `HALFLIFE_DAYS` | 14 | 14 | unchanged |
| `K_LCB`, `SPIKE_THRESHOLD`, `MAX_CANDIDATES` | 1.0 / 0.6 / 3 | unchanged | recalibrate after E6 lands |

---

## 5. Phasing

| Phase | Work | Blocked by |
|---|---|---|
| **P0** | App-side emission: persist events with `timestamp`, `sessionId`, `choiceSet`, `surfacedBy`. **No engine change.** Nothing today records day-grain data, so this unblocks everything else. | — |
| **P1** | E1 + E2 + E11 — delete `magnitude`, split return kinds, drop `artifact_competence`. | P0 |
| **P2** | E3 + E4 + E5 — choice set into the model; declines as weak negatives; propensity down-weighting. | P1 |
| **P3** | E6 + E7 — recalibrate gates, weight marginals. (E8 withdrawn; nothing to build.) | P2 |
| **P4** | E10 — out-of-product channel. | P1 |
| **P5** | E12 — appeal baseline. | needs cross-child data |
| **P6** | E9 — `activeMs` floor + diagnostic flag; `solves` → difficulty calibration. | P0 |

---

## 6. Consequences the implementer should expect

- **The golden values in `specs/011` §6 all need re-deriving.** Removing `magnitude` changes every α sum.
  The golden cell currently lands `mean ≈ 0.7857`, `sd ≈ 0.14507`, `lowerBound ≈ 0.64064`,
  `evidenceMass = 4.5`; none of those survive E1. Specifically: **SC-3 (evidence folding) and SC-4 (golden
  cell) need rewriting**; **SC-5 and SC-6 need new expected values** (their gates move with E6);
  **SC-1 and SC-2 need constant-value updates** but keep their structure; **SC-7's attribution fixtures
  survive E7 only if the fixture cells are equal-mass — check, since they are currently supplied as
  pre-set means with no masses attached**; SC-8 and SC-9 should be unaffected.
- **The maker/loyalist attribution fixtures** should be re-checked under evidence-mass weighting (E7).
- Still a pure, deterministic, offline package — no new dependencies, no network, no LLM. The loop-safety
  properties of `011` are preserved.
- `012-signal-pipeline` will need the widened event shape.

---

## 7. Decisions for the reviewer

1. **`B_DECLINED = 0.15` and the ÷`|choiceSet|` normalization** — is a decline weak negative evidence at
   all, or should declines stay unscored and only inform `surfacedBy`? Treating them as evidence is the
   larger claim; I think it is right, but it's the most arguable item here.
2. **`MIN_EVIDENCE_MASS 3 → 6`** — how conservative do we want the "confident" gate? I'd rather be late
   than confidently wrong about a 7-year-old, but this trades directly against time-to-first-hypothesis,
   which is a named success metric (PRD §13).
3. **`MIN_DISTINCT_DAYS`** — 2 is the floor implied by the evidence; 3+ would be safer and slower.
4. **E10's weight** — how much should a parent report move a posterior, given it is a different method and
   the memo's own validity guidance is to triangulate rather than pool? Possibly zero weight and
   report-only.
5. **Whether E12's confound is acceptable in the interim**, or whether cross-cabin comparison should be
   suppressed in the UI until an appeal baseline exists.

---

## 8. Non-goals

- No changes to the Evidence Graph — separate artifact, out of scope.
- No change to tagging beyond noting that the current `math-puzzles` gadgets are intrinsically integrated
  for **deduction**, not **mathematics** (they would play identically with the numerals swapped for
  symbols). That is an input to the tagging rework already planned, not a request here.
- No learned/ML model — `011`'s staged plan stands.
- **No routing from an inferred work-mode, and no surfacing of a mode to a child.** Under those two
  constraints the mode axis is a nuisance covariate for separating topic-love from style-love, and carries
  no learning-styles claim. If either constraint is ever relaxed, re-read memo §2.5(d) first — routing
  from a measured preference asserts the meshing hypothesis, whose evidentiary bar has essentially never
  been cleared.

---

## 9. Current app state this lands on (`main` @ `445096a`)

Checked against `passion/apps/mvp-jul24` after #150 / #151, so the emission side is costed accurately.

| Observation | Consequence for this proposal |
|---|---|
| All **7 gadgets are now `status: "active"`** — but all still `topic: "math"` and all one work-mode (deductive constraint satisfaction) | The cell matrix is still effectively 1×1, so topic-vs-style attribution has nothing to decompose yet. E7 is harmless but inert until a second topic *or* a second mode exists. Feeds the planned tagging rework. |
| **Endless puzzle generation** (#151) | Genuinely helpful here: repeatable content is what makes the `MIN_EVIDENCE_MASS` / `MIN_DISTINCT_DAYS` gates (E6) reachable at all. One-shot puzzles could never accrue enough non-novel evidence. |
| The interest store is still `{ activeMs, opens, solves }` with **no timestamp persisted** — `Date.now()` appears only in the in-memory idle tick | Confirms **P0 is the real blocking phase.** Until events carry `timestamp` + `sessionId`, E2/E3/E6 are all unimplementable. This is a store change, not a redesign. |
| **No difficulty or variant notion exists** in any puzzle's data | **`chosen_challenge` is not observable today.** It needs an easier/harder variant to be offered *and declined* first. Either add difficulty variants (endless generation makes this cheap) or drop `chosen_challenge` from the initial event set and rely on the other three depth families. **See the escalation below: this is a functional blocker, not a missing nicety.** |

> **AMENDED 2026-07-25 — `chosen_challenge` caps the specialization ladder at S2.**
>
> This was filed as "one depth family we cannot observe yet", which undersells it. `deriveStage`
> in `specialization-planner/src/stage.ts` requires `stretchSeeking` for **both** upper stages:
>
> ```ts
> if (producerIdentity && stretchSeeking && d >= DEPTH_S4 && r >= RETURN_S4) return "S4_SIGNATURE";
> if (stretchSeeking && d >= DEPTH_S3 && r >= RETURN_S3) return "S3_AUTHORSHIP";
> ```
>
> `stretchSeeking` is derived as `events.some(e => e.kind === "chosen_challenge")`. Since nothing
> emits that event, it is permanently `false`, so **no child can ever be placed above
> `S2_FOUNDATIONS`** regardless of how much they return, how deep they go, or what they produce.
> Two of the four stages are unreachable. `stretchSeeking` also feeds a wellbeing signal
> (`wellbeing/src/assess.ts`) and a plan rationale string (`plan.ts:205`).
>
> This corrects earlier guidance that widening the cell matrix should come before difficulty
> variants. Those solve different problems and the priority depends on which you care about first:
> a second topic or work-mode turns on the topic-versus-style decomposition, which is currently
> inert; difficulty variants unblock the top half of a ladder that is already shipped and silently
> capped. The capped ladder is the more urgent of the two, because it is a shipped feature that
> cannot function rather than a measurement that is not yet informative.
>
> Until variants exist, `stretchSeeking: false` must be read as **"not observable yet"**, never as
> "this child does not seek challenge". Same class of error as a coverage denominator counting
> areas the game cannot express.

**Practical read:** P0 (persist timestamped events with a choice set) is the only phase on the critical
path. Everything else is either inert until the cell matrix widens, or a small constant change.
