# Phase 1 Data Model: Cohort Compiler + RivalryMix

All identifiers are pseudonymous; no real PII (Constitution V; synthetic-only). Entities align to the PRD §28 public contracts `CohortAssignment` and `CohortHealthEvent`. The domain is pure: no wall-clock (time is passed in), no randomness, no I/O.

## AgeBand (enum)

`a6_8 | a9_11 | a12_14` — the developmental bands (PRD §14.13). Cohorts match within a band (hard constraint).

## LevelBand / VelocityBand (value)

Private, ordinal matchmaking inputs (PRD §15). Represented as integers (e.g. `0..N`).

| Field | Type | Notes |
|---|---|---|
| `level` | number | private level rating (ordinal); matchmaking input only |
| `velocity` | number | private pace/velocity rating (ordinal); matchmaking input only |

> These are **inputs only**. No fixed-ability caste rank, public tier name, or full-field ranking is derived from them (FR-006; G6).

## ScheduleAvailability (value)

| Field | Type | Notes |
|---|---|---|
| `blocks` | string[] | availability block keys (e.g. `"mon-pm"`); two learners are schedule-compatible if they share the required overlap |

## Accommodations (value)

| Field | Type | Notes |
|---|---|---|
| `needs` | string[] | accommodation tags (synthetic); stored separately from performance evidence (Constitution VI) |
| `conflicts` | string[] | optional incompatible-setting tags used only to test compatibility (never a protected-class proxy) |

## LearnerProfile

Input to candidate generation and the solver (FR-001).

| Field | Type | Notes |
|---|---|---|
| `learnerRef` | string | pseudonymous learner id (no PII) |
| `ageBand` | AgeBand | hard-constraint dimension |
| `schedule` | ScheduleAvailability | hard-constraint dimension |
| `accommodations` | Accommodations | hard-constraint dimension; no penalty (Constitution VI) |
| `level` | number | private level band (matchmaking input) |
| `velocity` | number | private velocity band (matchmaking input) |
| `separations` | string[] | safeguarding-separation `learnerRef`s to keep apart (hard) |
| `priorAssignmentRef` | string \| null | prior `CohortAssignment` id (for churn/rollback) |

## Caliper (value)

The near-peer bound (FR-002).

| Field | Type | Notes |
|---|---|---|
| `levelTolerance` | number | max allowed level distance to be near-peer |
| `velocityTolerance` | number | max allowed velocity distance to be near-peer |
| `k` | number | max candidates returned per learner (kNN cap) |

## CandidateSet

Output of candidate generation for one learner (FR-002–FR-004).

| Field | Type | Notes |
|---|---|---|
| `learnerRef` | string | the subject learner |
| `candidates` | `{ ref: string; distance: number }[]` | within-caliper peers, sorted by `distance` then `ref` (deterministic) |
| `hash` | string | stable candidate-set hash over the ordered refs (determinism, SC-001) |

**Invariants**: excludes `learnerRef` itself and all `separations`; every candidate is within **both** calipers; ordering + hash are deterministic (FR-003/FR-004).

## HardConstraints (value)

The inviolable set the solver checks (FR-007/FR-008).

| Constraint | Rule |
|---|---|
| age | all members share an `ageBand` |
| schedule | all members are pairwise schedule-compatible (required overlap present) |
| safeguarding separation | no two members are in each other's `separations` (§15.2) |
| accommodations | no incompatible accommodation settings within a cohort |
| level-velocity caliper | all members pairwise within the `Caliper` (near-peer) |
| individual non-harm floor | **every** member's individual compatibility/benefit ≥ the per-learner floor (hard, per-learner; never averaged, FR-009) |
| churn budget | membership changes vs. prior snapshot ≤ the weekly `ChurnBudget.cap` (FR-016) |

## ObjectiveWeights / ObjectiveTerms (value)

Deterministic **soft** scoring that ranks *feasible* assignments only (FR-013). Never overrides a hard constraint.

| Term | Meaning |
|---|---|
| `closePace` | reward tighter pace spread |
| `compatibleIntensity` | reward compatible intensity/dose settings |
| `roleCoverage` | reward covering needed roles |
| `pairHistory` | reward/penalize prior successful/failed pairings |
| `rivalryDose` | keep rivalry dose in band (a soft term, not a hard cap) |
| `churn` | penalize unnecessary membership change |
| `repeatedPairings` | discourage over-repeating the same pairs |

`ObjectiveTerms` is the per-assignment breakdown (one value per term) stored on the snapshot; `ObjectiveWeights` are the deterministic weights applied to produce the scalar rank.

## Cohort

| Field | Type | Notes |
|---|---|---|
| `members` | `{ ref: string; role: string }[]` | exactly six unless a recorded size exception (FR-010) |

## CohortAssignment (snapshot — §28)

The committed snapshot (FR-014; §28 `CohortAssignment`).

| Field | Type | Notes |
|---|---|---|
| `id` | string | assignment/snapshot id |
| `cohorts` | Cohort[] | the compiled cohorts |
| `memberRefs` | string[] | all assigned `learnerRef`s (for one-active-per-learner enforcement) |
| `levelBands` | `{ level: [number, number]; velocity: [number, number] }` | band ranges covered |
| `candidateSetHash` | string | hash of the candidate sets the solve used |
| `objectiveTerms` | ObjectiveTerms | soft-score breakdown |
| `constraints` | HardConstraints ref | the hard-constraint config in force |
| `start` | string | ISO start time (passed in, not clock-read) |
| `plannedReview` | string | ISO planned-review time |
| `priorAssignmentId` | string \| null | prior snapshot (rollback source) |
| `rollbackRef` | string \| null | reference used to restore the prior snapshot |
| `sizeExceptions` | `{ cohortIndex: number; approvedBy: string; reason: string }[]` | staff-approved non-six cohorts (FR-010) |

**Invariants**: one active assignment per learner (FR-011); six per cohort unless a `sizeException` (FR-010); hard constraints all honored (FR-008); churn within budget unless a recorded exception (FR-016).

## ChurnBudget (value)

| Field | Type | Notes |
|---|---|---|
| `weekKey` | string | the week the budget applies to (passed in) |
| `cap` | number | max membership changes this week |
| `used` | number | changes already applied this week |
| `exceptions` | `{ approvedBy: string; reason: string; delta: number }[]` | safety-owner-recorded over-budget approvals (FR-016) |

## CommitResult (value)

| Field | Type | Notes |
|---|---|---|
| `ok` | bool | whole-roster commit succeeded (atomic) |
| `assignmentId` | string \| null | committed snapshot id when `ok` |
| `priorAssignmentId` | string \| null | retained prior snapshot for rollback |
| `reasons` | string[] | machine-readable reasons when `!ok` (e.g. `churn-exceeded`, `duplicate-active-assignment`) |

## CohortHealthEvent (§28)

A bullying/coercion/exclusion report (FR-018; §28 `CohortHealthEvent`).

| Field | Type | Notes |
|---|---|---|
| `assignmentId` | string | the assignment context |
| `reporterRef` | string | pseudonymous reporter |
| `eventClass` | `bullying \| coercion \| exclusion \| other` | class of concern |
| `affectedMembers` | string[] | affected `learnerRef`s |
| `severity` | `low \| medium \| high` | triage severity |
| `evidenceScope` | string | what evidence is attached (synthetic) |
| `immediateAction` | string | action taken |
| `safeguardingLink` | string | link/handle into the safeguarding workflow |
| `followUpOwner` | string | named human owner |

**Invariants**: bypasses optimization → human sink; pauses conflicting cohort moves (POL-007); **cannot** reduce a learner's rating; peers receive **aggregated** health data only (§15.2, G7).

## TurnEvent (RivalryMix input)

One observable speaking turn (FR-020).

| Field | Type | Notes |
|---|---|---|
| `speaker` | string | pseudonymous speaker ref |
| `start` | number | turn start (ms or ordinal; passed in) |
| `duration` | number | turn duration |
| `overlap` | boolean | whether this turn began while another speaker held the floor (interruption signal) |
| `quality` | number? | optional 0..1 input-quality/confidence signal (packet loss / audio noise proxy) |

## TurnAnalysis (RivalryMix output)

Observable-only result (FR-020–FR-023).

| Field | Type | Notes |
|---|---|---|
| `perSpeaker` | `Record<speaker, { turnShare: number; speakingTime: number; interruptions: number }>` | observable descriptors |
| `patterns` | `{ kind: "dominance" \| "repeated_interruption"; evidence: string; subjects: string[] }[]` | detected patterns with triggering evidence |
| `confidence` | number | 0..1; lowered by missing/low-quality input |
| `suppressed` | bool | true when confidence < threshold → no patterns surfaced (FR-023) |

> **Prohibited by construction**: `TurnAnalysis` has **no** field for honesty, emotion, personality, or motivation, and none may be added (FR-022; G5/G6). Refused/missing analytics produce a `suppressed` result and change no status (FR-024).

## BenefitLCB (shadow — deferred)

Peer-effect causal-uplift lower-confidence-bound (FR-019; §15).

| Field | Type | Notes |
|---|---|---|
| `assignmentId` | string | the **locked** assignment it annotates |
| `lcb` | number | placeholder lower-confidence-bound (shadow) |
| `loggedAt` | string | post-lock timestamp (passed in) |
| `shadow` | `true` | always shadow; never read during a solve/repair |

## State transitions

```text
POOL (LearnerProfile[])
  -- generateCandidates(pool, caliper) --> CandidateSet[]        (US1; deterministic, hashed)
  -- assignCohorts(candidates, hard, weights, churn) --> CohortAssignment (proposed)   (US2)
       * every cohort feasible (all HardConstraints hold) or learner reported unassigned
  -- commit(repo, assignment, churn) --> CommitResult            (US2; atomic, one-active-per-learner)
       * ok  → prior snapshot retained as rollbackRef
       * !ok → nothing persisted (partial roster never persists)
  -- rollback(repo, assignmentId) --> prior CohortAssignment restored (US2; exact prior snapshot)
  -- repairCohort(assignment, churn) --> CohortAssignment | staff-exception-required (US2; in-budget only)
  -- routeHealthEvent(sink, event) --> SafeguardingSink (bypasses optimization; POL-007 hold)   (US2)
  -- [post-lock only] BenefitEstimator.log(assignmentId) --> BenefitLCB (shadow; never read back) (US2)

TURN EVENTS (TurnEvent[])
  -- analyzeTurns(turns, thresholds) --> TurnAnalysis            (US3; observable-only, confidence-gated)
```

## Deferred / stub types (production direction — non-production seams)

- **HNSW index** (behind `CandidateIndex`, PRD §15): the MVP `distance`/`kNN` adapter stands in; no HNSW type in this slice.
- **CP-SAT model** (PRD §15): the greedy+repair solver stands in; no CP-SAT/ILP type in this slice.
- **`MediaTurnSource`** (behind the stub port, §15.1): yields synthetic `TurnEvent[]`; real WebRTC/AudioWorklet/LiveKit capture deferred.
- **`BenefitEstimator`** (shadow, §15): returns a placeholder `BenefitLCB`; real causal-uplift under network interference deferred.
- **PostgreSQL commit** (behind `CohortRepository`, §15): in-memory atomic commit + rollback stands in.
