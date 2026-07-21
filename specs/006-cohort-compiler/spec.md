# Feature Specification: Cohort Compiler + RivalryMix

**Feature Branch**: `006-cohort-compiler`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "A code-first, framework-agnostic core for GT100K's Cohort Compiler + RivalryMix (PRD §15, §15.1, §15.2): near-peer candidate generation by a level+velocity caliper (pure-TS kNN; HNSW deferred); a cohort-assignment solver that forms stable cohorts of six under HARD constraints (age, schedule, safeguarding separation, accommodations, level-velocity caliper, an individual non-harm floor, and a churn budget) via a pure-TS greedy + local-search/repair algorithm (CP-SAT/branch-and-price deferred), returning a `CohortAssignment` snapshot with atomic in-memory commit + rollback, one active assignment per learner, a weekly churn cap, and cohort repair within the churn budget; and a pure-logic RivalryMix turn-taking analysis that detects observable patterns (dominance, repeated interruption) but cannot infer honesty/emotion/personality/motivation and suppresses prompts under low-quality input (WebRTC/AudioWorklet capture + LiveKit media plane deferred to an interface stub). Guardrails: gain/velocity/effort-based, sprint-reset, near-peer standings and no fixed-ability caste ranks (G6); bullying/exclusion reports bypass optimization to safeguarding; peer-effect causal-uplift models stay shadow/deferred. Synthetic-only."

## User Scenarios & Testing *(mandatory)*

<!--
  Three prioritized, independently-testable user journeys. US1 (candidate generation) is the
  substrate the solver reads and the smallest independently-demonstrable slice (the MVP). US2
  (the assignment solver + commit/rollback/churn/repair + safeguarding bypass) is the core
  compiler value. US3 (RivalryMix turn-taking) is a separable pure-logic analysis. US2 and US3
  are each independently testable against synthetic inputs without US1 having to run first.
-->

### User Story 1 - Generate near-peer candidate sets by a level+velocity caliper (Priority: P1)

Before any cohort is formed, the match space must be limited to **near-peer** learners so contests and collaboration stay fair. Given a synthetic pool of learners — each with a private **level band** and **velocity band** (pace), an age band, a schedule, accommodations, and a set of safeguarding-separation references — the system computes, for each learner, the set of candidate peers that fall **within a level+velocity caliper** (a bounded distance in both dimensions). This is a deterministic distance filter / kNN over the pool (the pure-TS MVP for what production runs on HNSW). A learner never appears in their own candidate set, safeguarding-separated peers are always excluded, and out-of-caliper peers never appear. The private level/velocity bands are matchmaking inputs only — they are never turned into a fixed-ability caste rank or a public full-field ranking (G6).

**Why this priority**: Candidate generation is the atomic substrate of the whole feature — the solver reads candidate sets, and the near-peer caliper is the first guardrail that keeps matchmaking fair. It is the smallest thing that is independently demonstrable ("near-peer candidate sets are correctly and deterministically computed") and everything downstream builds on it. HNSW is deferred; the caliper filter is the buildable slice.

**Independent Test**: Build a synthetic pool, run candidate generation, and confirm every learner's candidate set contains **only** peers within the level and velocity caliper, excludes the learner themselves and every safeguarding-separated peer, is deterministically ordered, and yields a stable candidate-set hash across repeated runs.

**Acceptance Scenarios**:

1. **Given** a pool of synthetic learners with level/velocity bands, **When** candidate generation runs for a learner, **Then** every returned candidate is within both the level caliper and the velocity caliper, and no out-of-caliper learner appears.
2. **Given** a learner with a safeguarding-separation reference to peer X, **When** candidate generation runs, **Then** X never appears in that learner's candidate set (and the learner never appears in their own set).
3. **Given** the same pool and caliper, **When** candidate generation runs twice, **Then** both runs produce byte-identical candidate sets and an identical candidate-set hash (deterministic ordering).
4. **Given** the private level/velocity bands, **When** candidate generation runs, **Then** the output contains no fixed-ability caste rank and no public full-field ranking — only per-learner near-peer candidate sets (G6).
5. **Given** the deferred HNSW capability, **When** the `CandidateIndex` port is invoked, **Then** the in-memory kNN adapter serves candidates and the HNSW adapter seam is clearly marked not-implemented (production direction).

### User Story 2 - Compile stable cohorts of six under hard constraints, atomically, within a churn budget (Priority: P2)

The compiler assigns learners into **stable cohorts of six** that honor a set of **hard constraints** — matching age band, compatible schedule, safeguarding separation, compatible accommodations, the level-velocity caliper, an **individual non-harm floor** (no learner is placed where their individual compatibility/benefit falls below a per-learner floor), and a **churn budget** (a cap on how much cohort membership changes per week). It runs a deterministic **greedy construction + bounded local-search/repair** (the pure-TS MVP for what production runs on OR-Tools CP-SAT / branch-and-price). It returns a `CohortAssignment` **snapshot** (members, roles, level/velocity bands, candidate-set hash, objective terms, constraints, start, planned review, prior assignment, rollback reference), commits it **atomically** (whole roster or nothing) while **retaining the prior snapshot for rollback**, enforces **one active assignment per learner**, and keeps **weekly changes within the churn budget** unless a safety owner records an exception. It supports **cohort repair** within the churn budget (bounded automation with a guide-veto window and one-click rollback). A soft deterministic objective (close pace, compatible intensity, role coverage, pair history, rivalry dose, churn, repeated pairings) only ranks *feasible* assignments — it never overrides a hard constraint. Reports of **bullying, coercion, or exclusion bypass optimization entirely** and route to a human safeguarding sink; a health report never lowers a learner's rating. No learned model issues an assignment; peer-effect causal-uplift benefit estimation stays **shadow** and is logged only after the assignment is locked.

**Why this priority**: This is the core value of the "Cohort Compiler" — the feasibility engine, the atomic snapshot/rollback lifecycle, the churn discipline, and the non-negotiable safeguarding bypass. It composes US1's candidate sets but is independently testable by feeding it synthetic candidate sets directly. It is the largest chunk, so it ranks after the substrate while completing the compile.

**Independent Test**: Feed a synthetic pool (or pre-built candidate sets) to the solver, confirm every accepted cohort has exactly six members and violates zero hard constraints, commit a snapshot and confirm no learner holds two active assignments, roll back and confirm the exact prior snapshot returns, attempt a change beyond the churn budget and confirm it is refused without a recorded exception, and submit a bullying report and confirm it bypasses the optimizer to the human sink without changing any rating.

**Acceptance Scenarios**:

1. **Given** a feasible synthetic pool, **When** the solver runs, **Then** every accepted cohort has exactly six members (unless a staff exception is recorded) and violates none of: age, schedule, safeguarding separation, accommodations, level-velocity caliper, individual non-harm floor, churn budget.
2. **Given** two candidate placements of equal feasibility, **When** the solver ranks them, **Then** it selects the higher-scoring one on the soft objective, and the soft objective **never** promotes an assignment that violates a hard constraint.
3. **Given** a learner with an existing active assignment, **When** a new assignment commits, **Then** the learner still holds exactly one active assignment and the prior snapshot is retained for rollback.
4. **Given** a committed assignment, **When** rollback is invoked, **Then** the exact prior snapshot is restored (atomic; whole roster or nothing).
5. **Given** a weekly churn budget, **When** a repair or recompile would exceed it, **Then** the change is refused unless a safety-owner exception is recorded; a repair **within** budget applies as bounded automation with a guide-veto window and one-click rollback.
6. **Given** a bullying/coercion/exclusion report (`CohortHealthEvent`), **When** it is submitted, **Then** it bypasses the optimizer, routes to the human safeguarding sink, pauses any conflicting cohort move, and does **not** reduce any learner's rating.
7. **Given** the deferred peer-effect causal-uplift model, **When** the solver runs, **Then** **no** learned model output influences the assignment; a benefit lower-confidence-bound may be logged **only after** the assignment is locked (shadow) and is never read during the solve.

### User Story 3 - Analyze RivalryMix turn-taking (observable patterns only) (Priority: P3)

Given a stream/array of **turn events** (speaker, start, duration, overlap) from a cohort session, the system computes observable turn-taking descriptors (per-speaker turn share, total speaking time, interruption/overlap counts) and detects **observable patterns** — one speaker holding most turns (dominance) and repeated interruption. It attaches the evidence that triggered each pattern. It **cannot** infer honesty, emotion, personality, or motivation from turns — it emits only observable descriptors, never a trait or behavioral label. When input is **missing or low-quality** (packet loss, audio noise, sparse turns), it **lowers a confidence value and suppresses pattern prompts** rather than producing a false label; below a confidence threshold, no pattern is surfaced. Refused or missing analytics never lower cohort status, trigger an intervention, or enter a motivation hypothesis. The actual real-time capture (WebRTC / AudioWorklet) and the LiveKit media plane (§15.1) are **deferred** — represented here by a `MediaTurnSource` **stub port** fed by synthetic turn arrays.

**Why this priority**: RivalryMix turn analysis is a separable pure-logic slice that carries a sharp rights guardrail (observable-only, confidence-gated, no trait inference). It depends on none of the solver machinery and can ship independently, so it ranks last while completing the §15 feature surface.

**Independent Test**: Feed synthetic turn arrays and confirm dominance and repeated-interruption patterns are detected with their triggering evidence; confirm no output ever contains an honesty/emotion/personality/motivation label; feed a degraded/sparse array and confirm confidence drops and prompts are suppressed (no pattern surfaced below threshold); confirm a refused/missing analytics case produces no status change; confirm the `MediaTurnSource` stub is invocable and marked deferred.

**Acceptance Scenarios**:

1. **Given** a turn array where one speaker holds most turns, **When** analysis runs, **Then** a **dominance** pattern is flagged with the turn-share evidence that triggered it.
2. **Given** a turn array with repeated overlap-initiated turns, **When** analysis runs, **Then** a **repeated-interruption** pattern is flagged with the interruption evidence.
3. **Given** any turn array, **When** analysis runs, **Then** the output contains **only** observable turn-taking descriptors and **no** honesty, emotion, personality, or motivation label.
4. **Given** a missing/low-quality/sparse turn array, **When** analysis runs, **Then** the confidence value is lowered and pattern prompts are **suppressed** (no pattern surfaced below the confidence threshold) rather than a false label emitted.
5. **Given** a learner who refused turn analytics (or whose analytics are missing), **When** analysis runs, **Then** cohort status is unchanged, no intervention is triggered, and no motivation hypothesis is created.
6. **Given** the deferred WebRTC/LiveKit media plane, **When** the `MediaTurnSource` stub port is invoked, **Then** it yields synthetic turns and is clearly marked non-production (§15.1 deferred).

### Edge Cases

- **Pool not divisible by six**: a leftover of fewer than six learners cannot form a full cohort; the compiler either leaves them unassigned (reported) or records a staff-approved size exception — it never silently emits a cohort of the wrong size.
- **Infeasible learner**: a learner whose hard constraints (e.g. schedule, safeguarding separations, empty caliper) admit no feasible cohort is reported as unassigned with the binding constraint(s), never force-placed in violation.
- **Individual non-harm floor vs. group score**: a placement that raises the *group* objective but drops one learner below their individual non-harm floor is rejected — the floor is a hard per-learner constraint, not averaged away (§15.2).
- **Churn budget boundary**: a change that exactly meets the budget is allowed; one that exceeds it by any amount is refused without a recorded exception.
- **Atomic commit failure**: if any member of a roster fails to commit, the whole commit aborts and the prior snapshot remains active (no partial roster).
- **Safeguarding during a solve**: a `CohortHealthEvent` (bullying/exclusion) arriving mid-process bypasses optimization, and any conflicting cohort move is paused (POL-007), regardless of objective score.
- **RivalryMix with zero/one turn**: too few turns to establish a pattern → confidence is low and nothing is surfaced (never a spurious dominance flag).
- **Overlap without a clear initiator**: an overlap that cannot be attributed to an interrupting speaker lowers confidence rather than inventing an interruption pattern.
- **Shadow benefit estimate present**: a logged post-lock benefit LCB is never read back into a solve or a repair (shadow-only; Constitution III).

## Requirements *(mandatory)*

### Functional Requirements

**Candidate generation (US1)**

- **FR-001**: The system MUST represent a synthetic `LearnerProfile` with a pseudonymous `learnerRef`, an age band, a schedule/availability descriptor, an accommodations descriptor, a **private** level band, a **private** velocity (pace) band, a set of safeguarding-separation references, and an optional prior-assignment reference (no real PII; Constitution V).
- **FR-002**: The system MUST generate **near-peer candidate sets** via a **level+velocity caliper** (a bounded distance in both the level and velocity dimensions); each learner's candidate set MUST contain only peers within **both** calipers.
- **FR-003**: Candidate generation MUST exclude the learner from their own set and MUST exclude every safeguarding-separated peer; out-of-caliper peers MUST never appear (the caliper is a hard near-peer bound).
- **FR-004**: Candidate generation MUST be **deterministic**: a stable ordering (by caliper distance, then `learnerRef`) so repeated runs on the same pool yield byte-identical candidate sets and a stable **candidate-set hash**.
- **FR-005**: Candidate generation MUST sit behind a `CandidateIndex` **port**; the MVP adapter is a **pure in-memory kNN/caliper filter**. The production **HNSW** ANN index is **deferred** and represented by a clearly-marked adapter seam, not implemented.
- **FR-006**: Private level/velocity bands are **matchmaking inputs only**; the system MUST NOT derive or expose any **fixed-ability caste rank**, public tier name, or full-field program ranking from them (G6; Constitution VIII/IX).

**Cohort assignment solver + lifecycle (US2)**

- **FR-007**: The solver MUST assemble stable cohorts of **exactly six** members honoring **all** hard constraints: matching age band, compatible schedule, safeguarding separation, compatible accommodations, the level-velocity caliper, the **individual non-harm floor**, and the **churn budget** (§28 `CohortAssignment`).
- **FR-008**: Hard constraints are **inviolable** — no accepted cohort may violate any of them; the solver MUST repair or report infeasibility rather than emit a violating assignment (§15.2).
- **FR-009**: The **individual non-harm floor** MUST be enforced as a **hard per-learner** constraint — a learner is never placed where their individual compatibility/benefit falls below the floor, and a shadow forecast MUST NOT override a child report (§15.2).
- **FR-010**: A cohort MUST contain **six** members unless a **staff exception is explicitly recorded** on the assignment (§28 `CohortAssignment` invariant).
- **FR-011**: The system MUST enforce **one active `CohortAssignment` per learner** per activity; a new commit supersedes the prior and the prior snapshot is retained (§28).
- **FR-012**: The solver MUST run as a **pure, deterministic** greedy construction + bounded local-search / repair; **OR-Tools CP-SAT / branch-and-price** is the **deferred** production optimizer and MUST NOT be a dependency of the buildable slice.
- **FR-013**: A **deterministic soft objective** (close pace, compatible intensity, role coverage, pair history, rivalry dose, churn, repeated pairings) MUST be used **only** to rank *feasible* assignments; it MUST NEVER promote an assignment that violates a hard constraint (§15 beta deterministic rules).
- **FR-014**: The solver MUST produce a `CohortAssignment` **snapshot** carrying members, roles, level/velocity bands, candidate-set hash, objective terms, constraints, start, planned review, prior-assignment reference, and rollback reference (§28).
- **FR-015**: Commit MUST be **atomic** (whole roster or nothing) and MUST retain the exact **prior snapshot** for **rollback** (in-memory); rollback MUST restore that prior snapshot (§15).
- **FR-016**: The system MUST enforce a **weekly churn budget** — weekly membership changes stay within the cap unless a **safety owner records an exception** (§15.2); no silent over-budget commit is permitted.
- **FR-017**: The system MUST support **cohort repair within the churn budget** as bounded automation with a **guide-veto window** and **one-click rollback**; a repair that would **exceed** the churn budget requires a recorded staff exception and MUST NOT auto-apply (§8.5, §15; Constitution III bounded-automation envelope).
- **FR-018**: Reports of **bullying, coercion, or exclusion** (`CohortHealthEvent`) MUST **bypass optimization** and route to a **human safeguarding sink**; a safeguarding hold MUST pause any conflicting cohort move (POL-007); a health report MUST NOT reduce a learner's rating; peer views receive **aggregated** health data only (§15.2, §28 `CohortHealthEvent`, G7).
- **FR-019**: **No learned model** may issue an assignment; **peer-effect causal-uplift** benefit estimation stays **shadow/deferred** — a benefit lower-confidence-bound MAY be logged **only after** the assignment is locked and MUST NOT influence any solve or repair (§15; Constitution III).

**RivalryMix turn-taking analysis (US3)**

- **FR-020**: Given an array of turn events (`speaker`, `start`, `duration`, `overlap`), the system MUST compute observable turn-taking descriptors: per-speaker turn share, total speaking time, and interruption/overlap counts — **observable only**.
- **FR-021**: The system MUST detect the observable patterns **dominance** (one speaker holding most turns) and **repeated interruption**, each carrying the observable evidence that triggered it.
- **FR-022**: The analysis MUST NOT infer **honesty, emotion, personality, or motivation**; it MUST emit only observable turn-taking descriptors and MUST NEVER emit a trait or behavioral label (§15; G5/G6).
- **FR-023**: Missing or low-quality input MUST **lower a confidence value and suppress pattern prompts** rather than produce a false label; below a confidence threshold **no** pattern is surfaced (§15.2).
- **FR-024**: Refused or missing turn analytics MUST NOT lower cohort status, trigger an intervention, or enter a motivation hypothesis (§15; G4).
- **FR-025**: The real-time capture (WebRTC / AudioWorklet) and the **LiveKit media plane** (§15.1) MUST be **deferred** and represented by a `MediaTurnSource` **stub port** (interface only), fed by synthetic turn arrays in the MVP; no media/infra is provisioned.

**Cross-cutting**

- **FR-026**: The feature MUST be exercisable end-to-end with **synthetic data only** — pseudonymous refs, no real PII/consent/media; peer-facing views receive **aggregated** health data only (Constitution V; G7).
- **FR-027**: All I/O MUST sit behind **ports** with in-memory/stub adapters (`CandidateIndex`, `CohortRepository`, `SafeguardingSink`, `MediaTurnSource` stub, `BenefitEstimator` shadow stub); the domain package MUST be **pure** (no I/O, no wall-clock reads, no randomness) and deterministic/replay-safe.

### Key Entities *(include if feature involves data)*

- **LearnerProfile**: A synthetic, pseudonymous learner: `learnerRef`, age band, schedule, accommodations, private level band, private velocity band, safeguarding-separation refs, prior-assignment ref. Inputs to candidate generation and the solver.
- **Caliper**: The near-peer bound — a level tolerance and a velocity tolerance (plus `k`) defining "within caliper."
- **CandidateSet**: For one learner, the ordered set of within-caliper candidate `learnerRef`s (with distances) and a stable candidate-set hash.
- **HardConstraints**: The inviolable set applied by the solver — age, schedule, safeguarding separation, accommodations, level-velocity caliper, individual non-harm floor, churn budget.
- **ObjectiveWeights / ObjectiveTerms**: The deterministic soft-scoring terms (close pace, compatible intensity, role coverage, pair history, rivalry dose, churn, repeated pairings) that rank feasible assignments only.
- **Cohort**: A stable group of six members with per-member roles.
- **CohortAssignment**: The committed **snapshot** — members, roles, level/velocity bands, candidate-set hash, objective terms, constraints, start, planned review, prior assignment, rollback reference. One active per learner; six unless a staff exception (§28).
- **ChurnBudget**: The weekly cap on membership changes, with a recorded-exception path for a safety owner.
- **CommitResult / RollbackRef**: The atomic-commit outcome and the retained prior-snapshot reference.
- **CohortHealthEvent**: A bullying/coercion/exclusion report — assignment, reporter, event class, affected members, severity, evidence scope, immediate action, safeguarding link, follow-up owner. Bypasses optimization; cannot reduce a rating; peers see aggregates only (§28).
- **TurnEvent**: One observable speaking turn: speaker, start, duration, overlap.
- **TurnAnalysis**: The observable result — per-speaker descriptors, detected patterns (with evidence), a confidence value, and a `suppressed` flag; carries **no** trait/behavioral label.
- **BenefitLCB (shadow)**: A peer-effect causal-uplift lower-confidence-bound, logged **after lock only**, never consumed by a solve (deferred/shadow).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every learner, the candidate set contains **only** within-caliper peers and excludes the learner and all safeguarding-separated peers, and repeated runs on the same pool produce **byte-identical** candidate sets and an identical candidate-set hash — in **100%** of runs.
- **SC-002**: Every accepted cohort has **exactly six** members (or a recorded staff exception) and violates **zero** hard constraints across the synthetic pool — **0** hard-constraint violations.
- **SC-003**: No learner ever holds **two** active assignments; a commit supersedes the prior and rollback restores the **exact** prior snapshot in **100%** of cases; a partial-roster commit **never** persists.
- **SC-004**: Weekly membership changes **never** exceed the churn budget except where a staff exception is recorded — **0** silent over-budget commits; an in-budget repair applies with a guide-veto window and reversible rollback.
- **SC-005**: **100%** of bullying/coercion/exclusion reports bypass the optimizer and appear in the human safeguarding sink; **0** such reports alter a learner's rating or an assignment objective; a safeguarding hold pauses conflicting moves.
- **SC-006**: **0** assignments are produced or altered by a learned model; any benefit LCB is logged **strictly after** lock and is **absent** from the pre-lock solve/repair inputs.
- **SC-007**: RivalryMix produces **0** honesty/emotion/personality/motivation labels; low-quality input lowers confidence and suppresses prompts (**0** patterns surfaced below threshold); refused/missing analytics produce **0** status changes, interventions, or motivation hypotheses.
- **SC-008**: Swapping any adapter (`CandidateIndex`, `CohortRepository`, `SafeguardingSink`, `MediaTurnSource`, `BenefitEstimator`) requires **no** change to the domain package; the deferred HNSW / CP-SAT / WebRTC+LiveKit / causal-uplift targets are **absent** from the buildable slice and represented as clearly-marked seams.

## Assumptions

- **Pure-TS solver for the MVP**: the buildable definition of done is `tsc -b` + Vitest, so the optimizer is a **pure-TS greedy + local-search/repair** heuristic that produces *feasible, hard-constraint-honoring* cohorts and ranks them by the deterministic soft objective. It is **not** a globally optimal solver — **OR-Tools CP-SAT / branch-and-price** is the deferred production optimizer (PRD §15). "Correct" for this slice = feasible + all hard constraints honored + deterministic, not provably optimal.
- **Pure-TS caliper filter for the MVP**: candidate generation is a deterministic level+velocity distance filter / kNN over the in-memory pool. **HNSW** (the production ANN) is deferred behind the `CandidateIndex` port (PRD §15).
- **Media plane deferred to a stub**: RivalryMix operates on arrays of already-extracted turn events. Real-time capture (WebRTC/AudioWorklet/Rust-WASM) and the **LiveKit** SFU media plane (§15.1) are **deferred** to a `MediaTurnSource` stub port; the §15.1/§15.2 latency and scale SLOs (feature-to-guide-screen <250 ms p95; 20,000 rooms; join/reconnect budgets) are **production targets**, not MVP gates (pure logic is not latency-bound).
- **Level/velocity bands are given**: the private ratings that drive matchmaking are synthetic inputs to this slice; how they are computed (from mastery/velocity signals) is external (PRD §12/§15). This feature consumes them, it does not compute them.
- **Individual non-harm floor is a modeled per-learner threshold**: for the synthetic slice it is a deterministic per-learner compatibility/benefit floor computed from observable pairing/accommodation/pace features — **not** a learned causal-uplift estimate (which stays shadow, FR-019). The exact floor formula is an implementation detail documented in code; its *invariant* (hard, per-learner, never averaged away) is fixed here.
- **Bounded automation envelope**: an in-budget cohort repair may auto-apply (bounded automation, §8.5) but always with a guide-veto window and one-click rollback; anything beyond the churn budget or a group-size change requires a recorded human exception. No irreversible, identity-defining move is automated.
- **Shadow causal-uplift**: the `BenefitEstimator` port exists only to prove the seam and the post-lock-only logging discipline; it returns a placeholder LCB and is never read during a solve/repair (Constitution III; §15).
- **Synthetic-only, governance stubbed**: no real learners, consent, media, or safeguarding case management; the safeguarding sink is an in-memory human-queue stub. Rights/authority limits still bind (Constitution I/III/V/VIII/IX; G4/G6/G7): no caste ranks, safeguarding bypass, one active assignment, aggregated peer views, no learned-model assignment.
- **Parallel-safety**: all code lives in new directories (`packages/cohort-compiler`, `adapters/cohort-*`). The workspace glob (`packages/*`, `adapters/*`) and the Vitest include (`packages/**/test`, `adapters/**/test`) already discover them, so no shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) needs editing. The only shared-file touch is adding project references to the root `tsconfig.json`, deferred to the final task for a human to reconcile at merge.
