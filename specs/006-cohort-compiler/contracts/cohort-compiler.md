# Contract: `@gt100k/cohort-compiler` domain interface

This slice exposes no external HTTP/network API; its "contract" is the public interface of the pure domain package plus the ports implemented by adapters. All domain functions are pure over injected state and injected ports (no I/O, no wall-clock reads, **no randomness**). See [data-model.md](../data-model.md) for `LearnerProfile`, `Caliper`, `CandidateSet`, `HardConstraints`, `ObjectiveWeights`/`ObjectiveTerms`, `Cohort`, `CohortAssignment`, `ChurnBudget`, `CommitResult`, `CohortHealthEvent`, `TurnEvent`, `TurnAnalysis`, `BenefitLCB`.

## Public functions (domain)

### Candidate generation (US1)

```text
generateCandidates(pool, caliper) -> CandidateSet[]
  Precondition:  pool is a set of well-formed LearnerProfile (unique learnerRefs).
  Behavior:      for each learner, select peers within BOTH the level and velocity caliper,
                 excluding self and every safeguarding-separation ref; order by distance then ref;
                 cap at caliper.k; compute a stable candidate-set hash over the ordered refs.
  Postcondition: every candidate is within-caliper; self + separations excluded; ordering + hash
                 deterministic across runs (FR-002/FR-003/FR-004). No caste rank/full-field ranking (FR-006).

withinCaliper(a, b, caliper) -> boolean
  Pure: true iff |a.level-b.level| <= caliper.levelTolerance AND
                 |a.velocity-b.velocity| <= caliper.velocityTolerance.
```

### Cohort assignment + lifecycle (US2)

```text
assignCohorts(pool, candidates, hard, weights, churn, prior?) -> { assignment, unassigned }
  Precondition:  candidates cover pool; hard = HardConstraints config; weights = ObjectiveWeights;
                 churn = ChurnBudget; prior = optional prior CohortAssignment (for churn/repair).
  Behavior:      greedy construction (seed from candidate sets, fill to six while EVERY hard
                 constraint holds) + bounded local-search/repair (swap/move to raise the soft
                 objective WITHOUT breaking any hard constraint). Learners with no feasible cohort
                 are returned in `unassigned` with the binding constraint(s) — never force-placed.
  Postcondition: every cohort has exactly six members (or a recorded size exception) and violates
                 ZERO hard constraints (FR-007/FR-008); the soft objective only ranks feasible
                 options (FR-013); result is deterministic (no randomness). NO learned model is
                 consulted (FR-019).

isFeasibleCohort(members, hard, prior?) -> { ok, violations }
  Pure: checks all seven hard constraints (age, schedule, safeguarding separation, accommodations,
        level-velocity caliper, individual non-harm floor, churn budget). The non-harm floor is
        per-member and never averaged (FR-009). Returns machine-readable violations when !ok.

scoreObjective(members, weights, prior?) -> { total, terms }
  Pure: deterministic soft score (closePace, compatibleIntensity, roleCoverage, pairHistory,
        rivalryDose, churn, repeatedPairings). Used ONLY to rank feasible assignments (FR-013);
        it can never make an infeasible assignment feasible.

commit(repo, assignment, churn) -> Promise<CommitResult>
  Precondition:  assignment feasible; no member already holds another active assignment;
                 churn within budget OR a recorded safety-owner exception (FR-016).
  Behavior:      atomic whole-roster commit via CohortRepository; retain the prior snapshot as
                 rollbackRef; enforce one active assignment per learner (FR-011/FR-015).
  Postcondition: ok → snapshot active, prior retained; !ok → NOTHING persisted (no partial roster).

rollback(repo, assignmentId) -> Promise<CohortAssignment>
  Behavior:      restore the exact prior snapshot referenced by the assignment's rollbackRef.
  Postcondition: prior snapshot is active again, byte-identical to what was retained (FR-015).

repairCohort(assignment, churn, prior) -> { repaired } | { staffExceptionRequired, reason }
  Behavior:      compute a repair (swap/move) that restores feasibility WITHIN the churn budget as
                 bounded automation with a guide-veto window + one-click rollback (§8.5).
  Postcondition: within budget → a repaired assignment (reversible); a repair that would EXCEED the
                 churn budget or change a group size → `staffExceptionRequired` (never auto-applied)
                 (FR-017).

routeHealthEvent(sink, event, activeMoves?) -> Promise<void>
  Behavior:      send the CohortHealthEvent straight to the SafeguardingSink, BYPASSING the
                 optimizer; pause any conflicting cohort move (POL-007). MUST NOT alter any
                 learner rating or objective term (FR-018).
```

### RivalryMix turn-taking analysis (US3)

```text
analyzeTurns(turns, thresholds) -> TurnAnalysis
  Precondition:  turns = TurnEvent[] (possibly sparse/low-quality); thresholds define the dominance
                 turn-share cut, the repeated-interruption count cut, and the confidence floor.
  Behavior:      compute per-speaker descriptors (turnShare, speakingTime, interruptions); detect
                 `dominance` and `repeated_interruption` with triggering evidence; compute a
                 confidence value lowered by missing/low-quality input; if confidence < floor set
                 `suppressed=true` and surface NO patterns.
  Postcondition: output contains ONLY observable descriptors — NEVER an honesty/emotion/personality/
                 motivation label (FR-022); low-quality input suppresses rather than mislabels
                 (FR-023); refused/missing analytics change no status (FR-024).
```

## Ports (implemented by adapters, injected)

```text
interface CandidateIndex {                    // adapters/cohort-candidates-memory (in-memory kNN/caliper)
  candidatesFor(learnerRef: string, caliper: Caliper): Promise<CandidateSet>
  // HNSW ANN index is DEFERRED (PRD §15) — the memory adapter is the buildable MVP (FR-005).
}

interface CohortRepository {                  // adapters/cohort-repo-memory (in-memory, synthetic)
  activeFor(learnerRef: string): Promise<CohortAssignment | null>   // one-active-per-learner check
  commitAtomic(assignment: CohortAssignment): Promise<void>          // whole roster or throws (no partial)
  getSnapshot(assignmentId: string): Promise<CohortAssignment | null>
  restore(assignmentId: string): Promise<CohortAssignment>          // rollback to a retained snapshot
  // Real PostgreSQL single-transaction roster commit is DEFERRED (PRD §15).
}

interface SafeguardingSink {                  // adapters/cohort-safeguarding-memory (human queue stub)
  submit(event: CohortHealthEvent): Promise<void>   // bypasses optimization; routes to humans (FR-018)
  pending(): Promise<CohortHealthEvent[]>
}
```

## Deferred / stub ports (production direction — non-production, clearly marked)

```text
interface MediaTurnSource {                   // adapters/cohort-media-stub — §15.1 media plane DEFERRED
  turns(roomRef: string): Promise<TurnEvent[]>      // synthetic turns; real WebRTC/AudioWorklet/LiveKit deferred
}

interface BenefitEstimator {                  // adapters/cohort-benefit-shadow — SHADOW, PRD §15
  logAfterLock(assignmentId: string, at: string): Promise<BenefitLCB>  // post-lock ONLY; never read in a solve
}
```

## Contract test obligations (map to FR/SC)

- `generateCandidates`: every candidate within both calipers; self + safeguarding separations excluded; deterministic ordering + stable hash across runs (FR-002/FR-003/FR-004, SC-001); no caste rank/full-field ranking emitted (FR-006).
- `withinCaliper`: true only when within both tolerances; boundary (== tolerance) is within, > tolerance is out.
- `isFeasibleCohort`: rejects any of the seven hard-constraint violations; the individual non-harm floor is per-member and not averaged away (FR-008/FR-009, SC-002).
- `assignCohorts`: every accepted cohort has exactly six members (or a recorded size exception) and zero hard-constraint violations; infeasible learners returned as `unassigned` with binding constraints; deterministic; no learned model consulted (FR-007/FR-010/FR-012/FR-019, SC-002/SC-006).
- `scoreObjective`: ranks feasible options; a higher score never promotes an infeasible/violating assignment (FR-013, SC-002).
- `commit`: atomic (whole roster or nothing persists); one active assignment per learner; prior snapshot retained; over-budget without exception refused (FR-011/FR-015/FR-016, SC-003/SC-004).
- `rollback`: restores the exact prior snapshot (FR-015, SC-003).
- `repairCohort`: in-budget repair applies (reversible); a repair exceeding the churn budget or changing group size returns `staffExceptionRequired` and does not auto-apply (FR-017, SC-004).
- `routeHealthEvent`: the event reaches the `SafeguardingSink`, bypasses the optimizer, pauses conflicting moves, and alters no rating/objective (FR-018, SC-005).
- `BenefitEstimator` (shadow): a `BenefitLCB` can only be logged post-lock and is never present in the solve/repair inputs (FR-019, SC-006).
- `analyzeTurns`: detects dominance + repeated interruption with evidence; emits **no** honesty/emotion/personality/motivation label; low-quality input lowers confidence and suppresses (nothing surfaced below floor); refused/missing analytics change no status (FR-020–FR-024, SC-007).
- Adapter swap: domain unchanged across `CandidateIndex`/`CohortRepository`/`SafeguardingSink` implementations; `MediaTurnSource`/`BenefitEstimator` stubs invocable and marked non-production (FR-027, SC-008).
