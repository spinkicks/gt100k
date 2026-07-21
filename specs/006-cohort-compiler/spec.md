# Feature Specification: Cohort Compiler + RivalryMix

**Feature Branch**: `006-cohort-compiler`

**Created**: 2026-07-20

**Status**: Loop-ready (Draft)

**Input**: User description: "A code-first, framework-agnostic core for GT100K's Cohort Compiler + RivalryMix (PRD §15, §15.1, §15.2): near-peer candidate generation by a level+velocity caliper (pure-TS kNN; HNSW deferred); a cohort-assignment solver that forms stable cohorts of six under HARD constraints (age, schedule, safeguarding separation, accommodations, level-velocity caliper, an individual non-harm floor, and a churn budget) via a pure-TS greedy + local-search/repair algorithm (CP-SAT/branch-and-price deferred), returning a `CohortAssignment` snapshot with atomic in-memory commit + rollback, one active assignment per learner, a weekly churn cap, and cohort repair within the churn budget; and a pure-logic RivalryMix turn-taking analysis that detects observable patterns (dominance, repeated interruption) but cannot infer honesty/emotion/personality/motivation and suppresses prompts under low-quality input (WebRTC/AudioWorklet capture + LiveKit media plane deferred to an interface stub). Guardrails: gain/velocity/effort-based, sprint-reset, near-peer standings and no fixed-ability caste ranks (G6); bullying/exclusion reports bypass optimization to safeguarding; peer-effect causal-uplift models stay shadow/deferred. Synthetic-only."

> **How to read this spec (JIT).** The loop reads *one section at a time*. Each phase in
> [§ Phasing](#phasing-p0p6) links to the requirements, success criteria, and golden fixtures it needs.
> Start at [§ Scope Fence](#scope-fence), then work [§ Phasing](#phasing-p0p6) top to bottom, gating each
> phase on the [§ Success Criteria](#success-criteria-mandatory) that map to it. When anything is
> unspecified, apply [§ Defaults for the Unspecified](#defaults-for-the-unspecified) — do not ask, log
> and continue.

---

## Scope Fence

The loop builds the **whole** spec, so the boundary is explicit. Anything not listed **In scope** is
either **Out of scope (deferred)** — a production direction represented by a marked port/stub, no tasks —
or a **Non-goal** — never built here.

### In scope (build these, with tests)

1. **Near-peer candidate generation** — a pure, deterministic level+velocity **caliper** filter / kNN over
   an in-memory synthetic pool, behind a `CandidateIndex` port (US1).
2. **Cohort-of-six solver** — deterministic **greedy construction + bounded local-search/repair** producing
   feasible cohorts under the full **hard-constraint set** (age, schedule, safeguarding separation,
   accommodations, level-velocity caliper, **individual non-harm floor**, **churn budget**) with a
   **deterministic soft objective** that only ranks *feasible* options (US2).
3. **Assignment lifecycle** — a `CohortAssignment` **snapshot**, **atomic in-memory commit + rollback**,
   **one active assignment per learner**, a **weekly churn cap**, and **cohort repair within the churn
   budget** (bounded automation: guide-veto window + one-click rollback) (US2).
4. **Safeguarding bypass** — `CohortHealthEvent` (bullying/coercion/exclusion) routes straight to a
   `SafeguardingSink`, **bypassing optimization**, pausing conflicting moves (POL-007), never lowering a
   rating (US2).
5. **No-learned-model discipline** — the solve is fully rule-based; a `BenefitEstimator` **shadow** stub may
   log a peer-effect causal-uplift LCB **post-lock only**, never read during a solve/repair (US2).
6. **RivalryMix turn-taking analysis** — pure-logic detection of **observable** patterns (dominance,
   repeated interruption) with triggering evidence, **confidence-gated suppression** under low-quality
   input, **no trait inference**, fed by a `MediaTurnSource` **stub** (US3).
7. **Ports + in-memory/stub adapters** — `CandidateIndex`, `CohortRepository`, `SafeguardingSink`,
   `MediaTurnSource` (stub), `BenefitEstimator` (shadow); a **pure** domain package with **no I/O, no
   wall-clock, no randomness**.
8. **In-repo seed fixtures** (synthetic learner population + turn arrays) and their **golden expected
   outputs** ([§ Golden Values & Seed Fixtures](#golden-values--seed-fixtures)).

### Out of scope — deferred (production direction; marked port/stub; **no tasks**)

| Deferred item | PRD ref | Represented in this slice by |
|---|---|---|
| **HNSW** ANN candidate index | §15 | `CandidateIndex` port; MVP adapter is the pure kNN/caliper filter |
| **OR-Tools CP-SAT / branch-and-price** optimizer | §15 | pure-TS greedy + local-search/repair stands in |
| **PostgreSQL** single-transaction roster commit | §15 | in-memory `CohortRepository` (atomic commit + rollback) |
| **WebRTC/AudioWorklet + LiveKit** media plane (EKS/coturn/DTLS-SRTP) | §15.1 | `MediaTurnSource` **stub** fed by synthetic turn arrays |
| RivalryMix latency/scale SLOs (<250 ms p95 to guide; 20k rooms; join <5 s/reconnect <10 s p95; 5% loss) | §15.1/§15.2 | documented **production targets**, not MVP gates (pure logic is not latency-bound) |
| **Peer-effect causal-uplift** learned model | §15 | `BenefitEstimator` **shadow** stub (post-lock log only) |

### Non-goals (never built here, not even a stub)

- **No fixed-ability caste rank, public tier name, or full-field program ranking** derived from the private
  level/velocity bands (G6; Constitution VIII/IX). This feature owns the private matchmaking ratings and the
  compiler; the visible near-peer/opt-in standings surface lives in feature `004-arena-game-world`.
- **No learned model issues an assignment** (Constitution III).
- **No trait/behavioral inference** (honesty, emotion, personality, motivation) from turns (G5/G6).
- **No computation of the level/velocity bands** — they are synthetic *inputs* here (produced externally by
  PRD §12/§15 mastery/velocity signals).
- **No real PII/consent/media/safeguarding case management** — synthetic-only; governance stubbed.
- **No app/UI/frontend, no Go/Rust service, no media/infra** in this slice (PRD §26.2/§26.3).

---

## Phasing (P0–P6)

An ordered build path. Each phase ends at a **green gate** (`typecheck + test + build` all pass) and a
demonstrable checkpoint. The loop's "next task" is always the first unchecked task in the lowest-numbered
incomplete phase. Phase → task mapping lives in [tasks.md](./tasks.md); phase → SC mapping is in
[§ Success Criteria](#success-criteria-mandatory).

- **P0 — Setup & Foundational.** Scaffold `packages/cohort-compiler` + `adapters/cohort-*`; define all
  domain types (`model.ts`) and ports (`ports.ts`); commit the in-repo **seed fixtures**; a **seeded smoke
  test** turns the gate green from iteration 1. → SC-008 (seam shape).
- **P1 — Near-peer candidate generation (US1). 🎯 MVP.** `withinCaliper`, `generateCandidates`, the
  in-memory `CandidateIndex` adapter. → SC-001. Golden: [Fixture A `caliper-8`](#fixture-a-caliper-8-us1).
- **P2 — Solver & feasibility (US2 core).** `isFeasibleCohort` (7 hard constraints + non-harm floor),
  `scoreObjective` (feasible-only ranking), `assignCohorts` (greedy + local-search/repair; `unassigned`
  reporting). → SC-002, SC-006 (no learned model). Golden:
  [Fixture B `cohort-12`](#fixture-b-cohort-12-us2) + [`cohort-13-infeasible`](#fixture-b2-cohort-13-infeasible-us2)
  + [`nonharm-reject`](#fixture-b3-nonharm-reject-us2) + [`nonharm-default-bind`](#fixture-b4-nonharm-default-bind-us2).
- **P3 — Commit / rollback / one-active / churn (US2 lifecycle).** in-memory `CohortRepository`,
  `commit`, `rollback`. → SC-003, SC-004 (cap enforcement). Golden:
  [Fixture C `churn-rollback`](#fixture-c-churn-rollback-us2).
- **P4 — Repair, safeguarding bypass, shadow benefit (US2 governance).** `repairCohort`, `routeHealthEvent`
  + `SafeguardingSink`, `BenefitEstimator` shadow. → SC-004 (repair), SC-005, SC-006 (post-lock only).
  Golden: [Fixture D `safeguarding-shadow`](#fixture-d-safeguarding-shadow-us2).
- **P5 — RivalryMix turn analysis (US3).** `analyzeTurns` + `MediaTurnSource` stub. → SC-007. Golden:
  [Fixture E `turns-*`](#fixture-e-turns--us3).
- **P6 — Polish & the single shared-file touch.** README, end-to-end demo, quickstart validation, and the
  **final** task: add composite project references to the root `tsconfig.json`. → SC-008.

**MVP = P0 + P1.** Each later phase is independently demonstrable against synthetic inputs (US2 and US3 do
not require US1 to have run — feed them synthetic candidate sets / turn arrays directly).

---

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

**Independent Test**: Build a synthetic pool, run candidate generation, and confirm every learner's candidate set contains **only** peers within the level and velocity caliper, excludes the learner themselves and every safeguarding-separated peer, is deterministically ordered, and yields a stable candidate-set hash across repeated runs. (Golden: [Fixture A `caliper-8`](#fixture-a-caliper-8-us1).)

**Acceptance Scenarios**:

1. **Given** a pool of synthetic learners with level/velocity bands, **When** candidate generation runs for a learner, **Then** every returned candidate is within both the level caliper and the velocity caliper, and no out-of-caliper learner appears.
2. **Given** a learner with a safeguarding-separation reference to peer X, **When** candidate generation runs, **Then** X never appears in that learner's candidate set (and the learner never appears in their own set).
3. **Given** the same pool and caliper, **When** candidate generation runs twice, **Then** both runs produce byte-identical candidate sets and an identical candidate-set hash (deterministic ordering).
4. **Given** the private level/velocity bands, **When** candidate generation runs, **Then** the output contains no fixed-ability caste rank and no public full-field ranking — only per-learner near-peer candidate sets (G6).
5. **Given** the deferred HNSW capability, **When** the `CandidateIndex` port is invoked, **Then** the in-memory kNN adapter serves candidates and the HNSW adapter seam is clearly marked not-implemented (production direction).

### User Story 2 - Compile stable cohorts of six under hard constraints, atomically, within a churn budget (Priority: P2)

The compiler assigns learners into **stable cohorts of six** that honor a set of **hard constraints** — matching age band, compatible schedule, safeguarding separation, compatible accommodations, the level-velocity caliper, an **individual non-harm floor** (no learner is placed where their individual compatibility/benefit falls below a per-learner floor), and a **churn budget** (a cap on how much cohort membership changes per week). It runs a deterministic **greedy construction + bounded local-search/repair** (the pure-TS MVP for what production runs on OR-Tools CP-SAT / branch-and-price). It returns a `CohortAssignment` **snapshot** (members, roles, level/velocity bands, candidate-set hash, objective terms, constraints, start, planned review, prior assignment, rollback reference), commits it **atomically** (whole roster or nothing) while **retaining the prior snapshot for rollback**, enforces **one active assignment per learner**, and keeps **weekly changes within the churn budget** unless a safety owner records an exception. It supports **cohort repair** within the churn budget (bounded automation with a guide-veto window and one-click rollback). A soft deterministic objective (close pace, compatible intensity, role coverage, pair history, rivalry dose, churn, repeated pairings) only ranks *feasible* assignments — it never overrides a hard constraint. Reports of **bullying, coercion, or exclusion bypass optimization entirely** and route to a human safeguarding sink; a health report never lowers a learner's rating. No learned model issues an assignment; peer-effect causal-uplift benefit estimation stays **shadow** and is logged only after the assignment is locked.

**Why this priority**: This is the core value of the "Cohort Compiler" — the feasibility engine, the atomic snapshot/rollback lifecycle, the churn discipline, and the non-negotiable safeguarding bypass. It composes US1's candidate sets but is independently testable by feeding it synthetic candidate sets directly. It is the largest chunk, so it ranks after the substrate while completing the compile.

**Independent Test**: Feed a synthetic pool (or pre-built candidate sets) to the solver, confirm every accepted cohort has exactly six members and violates zero hard constraints, commit a snapshot and confirm no learner holds two active assignments, roll back and confirm the exact prior snapshot returns, attempt a change beyond the churn budget and confirm it is refused without a recorded exception, and submit a bullying report and confirm it bypasses the optimizer to the human sink without changing any rating. (Golden: Fixtures [B](#fixture-b-cohort-12-us2), [B2](#fixture-b2-cohort-13-infeasible-us2), [C](#fixture-c-churn-rollback-us2), [D](#fixture-d-safeguarding-shadow-us2).)

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

**Independent Test**: Feed synthetic turn arrays and confirm dominance and repeated-interruption patterns are detected with their triggering evidence; confirm no output ever contains an honesty/emotion/personality/motivation label; feed a degraded/sparse array and confirm confidence drops and prompts are suppressed (no pattern surfaced below threshold); confirm a refused/missing analytics case produces no status change; confirm the `MediaTurnSource` stub is invocable and marked deferred. (Golden: [Fixture E `turns-*`](#fixture-e-turns--us3).)

**Acceptance Scenarios**:

1. **Given** a turn array where one speaker holds most turns, **When** analysis runs, **Then** a **dominance** pattern is flagged with the turn-share evidence that triggered it.
2. **Given** a turn array with repeated overlap-initiated turns, **When** analysis runs, **Then** a **repeated-interruption** pattern is flagged with the interruption evidence.
3. **Given** any turn array, **When** analysis runs, **Then** the output contains **only** observable turn-taking descriptors and **no** honesty, emotion, personality, or motivation label.
4. **Given** a missing/low-quality/sparse turn array, **When** analysis runs, **Then** the confidence value is lowered and pattern prompts are **suppressed** (no pattern surfaced below the confidence threshold) rather than a false label emitted.
5. **Given** a learner who refused turn analytics (or whose analytics are missing), **When** analysis runs, **Then** cohort status is unchanged, no intervention is triggered, and no motivation hypothesis is created.
6. **Given** the deferred WebRTC/LiveKit media plane, **When** the `MediaTurnSource` stub port is invoked, **Then** it yields synthetic turns and is clearly marked non-production (§15.1 deferred).

### Edge Cases

- **Pool not divisible by six**: a leftover of fewer than six learners cannot form a full cohort; the compiler either leaves them unassigned (reported) or records a staff-approved size exception — it never silently emits a cohort of the wrong size. (Golden: [`cohort-13-infeasible`](#fixture-b2-cohort-13-infeasible-us2).)
- **Infeasible learner**: a learner whose hard constraints (e.g. schedule, safeguarding separations, empty caliper) admit no feasible cohort is reported as unassigned with the binding constraint(s), never force-placed in violation. (Golden: [`cohort-13-infeasible`](#fixture-b2-cohort-13-infeasible-us2); empty-caliper learner `L5` in [`caliper-8`](#fixture-a-caliper-8-us1).)
- **Individual non-harm floor vs. group score**: a placement that raises the *group* objective but drops one learner below their individual non-harm floor is rejected — the floor is a hard per-learner constraint on a **real, caliper-independent** benefit signal (accommodation compatibility + prior-pairing history + pace/role fit), not averaged away (§15.2). (Golden: [`nonharm-default-bind`](#fixture-b4-nonharm-default-bind-us2): the **default** formula yields mean benefit `0.705 ≥ floor 0.5` but member `D6` at `0.43 < 0.5` → rejected; [`nonharm-reject`](#fixture-b3-nonharm-reject-us2) proves the same per-member rule via an injected map, mean `0.708 ≥ 0.5`, `M5` at `0.45` → rejected.)
- **Churn budget boundary**: a change that exactly meets the budget is allowed; one that exceeds it by any amount is refused without a recorded exception. (Golden: [`churn-rollback`](#fixture-c-churn-rollback-us2): churn = 2, allowed at cap 2, refused at cap 1.)
- **Atomic commit failure**: if any member of a roster fails to commit, the whole commit aborts and the prior snapshot remains active (no partial roster). (Golden: [`churn-rollback`](#fixture-c-churn-rollback-us2) duplicate-active case.)
- **Safeguarding during a solve**: a `CohortHealthEvent` (bullying/exclusion) arriving mid-process bypasses optimization, and any conflicting cohort move is paused (POL-007), regardless of objective score. (Golden: [`safeguarding-shadow`](#fixture-d-safeguarding-shadow-us2).)
- **RivalryMix with zero/one turn**: too few turns to establish a pattern → confidence is low and nothing is surfaced (never a spurious dominance flag). (Golden: [`turns-sparse`](#fixture-e-turns--us3), [`turns-empty`](#fixture-e-turns--us3).)
- **Overlap without a clear initiator**: an overlap that cannot be attributed to an interrupting speaker (low-quality overlap turn) is not counted as an interruption and lowers confidence rather than inventing an interruption pattern. (Golden: [`turns-ambiguous`](#fixture-e-turns--us3).)
- **Shadow benefit estimate present**: a logged post-lock benefit LCB is never read back into a solve or a repair (shadow-only; Constitution III). (Golden: [`safeguarding-shadow`](#fixture-d-safeguarding-shadow-us2).)

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
- **FR-009**: The **individual non-harm floor** MUST be enforced as a **hard per-learner** constraint — a learner is never placed where their individual compatibility/benefit falls below the floor, and it MUST NOT be averaged away across the cohort; a shadow forecast MUST NOT override a child report (§15.2).
- **FR-010**: A cohort MUST contain **six** members unless a **staff exception is explicitly recorded** on the assignment (§28 `CohortAssignment` invariant).
- **FR-011**: The system MUST enforce **one active `CohortAssignment` per learner** per activity; a new commit supersedes the prior and the prior snapshot is retained (§28).
- **FR-012**: The solver MUST run as a **pure, deterministic** greedy construction + bounded local-search / repair; **OR-Tools CP-SAT / branch-and-price** is the **deferred** production optimizer and MUST NOT be a dependency of the buildable slice.
- **FR-013**: A **deterministic soft objective** (close pace, compatible intensity, role coverage, pair history, rivalry dose, churn, repeated pairings) MUST be used **only** to rank *feasible* assignments; it MUST NEVER promote an assignment that violates a hard constraint (§15 beta deterministic rules).
- **FR-014**: The solver MUST produce a `CohortAssignment` **snapshot** carrying members, roles, level/velocity bands, candidate-set hash, objective terms, constraints, start, planned review, prior-assignment reference, and rollback reference (§28).
- **FR-015**: Commit MUST be **atomic** (whole roster or nothing) and MUST retain the exact **prior snapshot** for **rollback** (in-memory); rollback MUST restore that prior snapshot (§15).
- **FR-016**: The system MUST enforce a **weekly churn budget** — weekly membership changes stay within the cap unless a **safety owner records an exception** (§15.2); no silent over-budget commit is permitted. Churn is measured as the count of learners whose cohort membership differs from the prior snapshot (a swap of one member for another counts as 2).
- **FR-017**: The system MUST support **cohort repair within the churn budget** as bounded automation with a **guide-veto window** and **one-click rollback**; a repair that would **exceed** the churn budget or change a group size requires a recorded staff exception and MUST NOT auto-apply (§8.5, §15; Constitution III bounded-automation envelope).
- **FR-018**: Reports of **bullying, coercion, or exclusion** (`CohortHealthEvent`) MUST **bypass optimization** and route to a **human safeguarding sink**; a safeguarding hold MUST pause any conflicting cohort move (POL-007); a health report MUST NOT reduce a learner's rating; peer views receive **aggregated** health data only (§15.2, §28 `CohortHealthEvent`, G7).
- **FR-019**: **No learned model** may issue an assignment; **peer-effect causal-uplift** benefit estimation stays **shadow/deferred** — a benefit lower-confidence-bound MAY be logged **only after** the assignment is locked and MUST NOT influence any solve or repair (§15; Constitution III).

**RivalryMix turn-taking analysis (US3)**

- **FR-020**: Given an array of turn events (`speaker`, `start`, `duration`, `overlap`), the system MUST compute observable turn-taking descriptors: per-speaker turn share, total speaking time, and interruption/overlap counts — **observable only**.
- **FR-021**: The system MUST detect the observable patterns **dominance** (one speaker holding most turns) and **repeated interruption**, each carrying the observable evidence that triggered it.
- **FR-022**: The analysis MUST NOT infer **honesty, emotion, personality, or motivation**; it MUST emit only observable turn-taking descriptors and MUST NEVER emit a trait or behavioral label (§15; G5/G6). The `TurnAnalysis` type MUST have no field capable of carrying such a label.
- **FR-023**: Missing or low-quality input MUST **lower a confidence value and suppress pattern prompts** rather than produce a false label; below a confidence threshold **no** pattern is surfaced (§15.2).
- **FR-024**: Refused or missing turn analytics MUST NOT lower cohort status, trigger an intervention, or enter a motivation hypothesis (§15; G4).
- **FR-025**: The real-time capture (WebRTC / AudioWorklet) and the **LiveKit media plane** (§15.1) MUST be **deferred** and represented by a `MediaTurnSource` **stub port** (interface only), fed by synthetic turn arrays in the MVP; no media/infra is provisioned.

**Cross-cutting**

- **FR-026**: The feature MUST be exercisable end-to-end with **synthetic data only** — pseudonymous refs, no real PII/consent/media; peer-facing views receive **aggregated** health data only (Constitution V; G7).
- **FR-027**: All I/O MUST sit behind **ports** with in-memory/stub adapters (`CandidateIndex`, `CohortRepository`, `SafeguardingSink`, `MediaTurnSource` stub, `BenefitEstimator` shadow stub); the domain package MUST be **pure** (no I/O, no wall-clock reads, no randomness) and deterministic/replay-safe.

### Key Entities *(include if feature involves data)*

- **LearnerProfile**: A synthetic, pseudonymous learner: `learnerRef`, age band, schedule, accommodations (`needs`/`conflicts`), private level band, private velocity band, safeguarding-separation refs, prior-assignment ref, plus the **caliper-independent non-harm inputs** — `pairHistory` (prior-flagged `positive`/`negative` pairings), `preferredRole`, and `workingRhythm`. Inputs to candidate generation, the solver, and the default `benefitOf`.
- **Caliper**: The near-peer bound — a level tolerance and a velocity tolerance (plus `k`) defining "within caliper."
- **CandidateSet**: For one learner, the ordered set of within-caliper candidate `learnerRef`s (with distances) and a stable candidate-set hash.
- **HardConstraints**: The inviolable set applied by the solver — age, schedule, safeguarding separation, accommodations, level-velocity caliper, individual non-harm floor, churn budget. Carries `nonHarmFloor` (default `0.5`) and the **injected** `benefitOf(member, cohort) → number` (default = the pinned caliper-independent composite) used only by the non-harm-floor check.
- **ObjectiveWeights / ObjectiveTerms**: The deterministic soft-scoring terms (close pace, compatible intensity, role coverage, pair history, rivalry dose, churn, repeated pairings) that rank feasible assignments only.
- **Cohort**: A stable group of six members with per-member roles.
- **CohortAssignment**: The committed **snapshot** — members, roles, level/velocity bands, candidate-set hash, objective terms, constraints, start, planned review, prior assignment, rollback reference. One active per learner; six unless a staff exception (§28).
- **ChurnBudget**: The weekly cap on membership changes, with a recorded-exception path for a safety owner.
- **CommitResult / RollbackRef**: The atomic-commit outcome and the retained prior-snapshot reference.
- **CohortHealthEvent**: A bullying/coercion/exclusion report — assignment, reporter, event class, affected members, severity, evidence scope, immediate action, safeguarding link, follow-up owner. Bypasses optimization; cannot reduce a rating; peers see aggregates only (§28).
- **TurnEvent**: One observable speaking turn: speaker, start, duration, overlap, optional quality.
- **TurnAnalysis**: The observable result — per-speaker descriptors, detected patterns (with evidence), a confidence value, and a `suppressed` flag; carries **no** trait/behavioral label.
- **BenefitLCB (shadow)**: A peer-effect causal-uplift lower-confidence-bound, logged **after lock only**, never consumed by a solve (deferred/shadow).

## Success Criteria *(mandatory)*

### Measurable Outcomes

Each SC is machine-checkable and maps to a concrete test file and (where computed) a golden fixture. "Done"
for a phase = its SCs' tests pass under the pinned gate.

- **SC-001** *(P1)*: For every learner, the candidate set contains **only** within-caliper peers and excludes the learner and all safeguarding-separated peers, and repeated runs on the same pool produce **byte-identical** candidate sets and an identical candidate-set hash — in **100%** of runs.
  → `packages/cohort-compiler/test/candidates.test.ts` + `caliper.test.ts`; golden [Fixture A](#fixture-a-caliper-8-us1).
- **SC-002** *(P2)*: Every accepted cohort has **exactly six** members (or a recorded staff exception) and violates **zero** hard constraints across the synthetic pool — **0** hard-constraint violations; the individual non-harm floor is per-member and never averaged away.
  → `constraints.test.ts` + `objective.test.ts` + `solver.test.ts`; golden [Fixtures B](#fixture-b-cohort-12-us2)/[B2](#fixture-b2-cohort-13-infeasible-us2)/[B3](#fixture-b3-nonharm-reject-us2)/[B4](#fixture-b4-nonharm-default-bind-us2).
- **SC-003** *(P3)*: No learner ever holds **two** active assignments; a commit supersedes the prior and rollback restores the **exact** prior snapshot in **100%** of cases; a partial-roster commit **never** persists.
  → `commit.test.ts` + `adapters/cohort-repo-memory/test/index.test.ts`; golden [Fixture C](#fixture-c-churn-rollback-us2).
- **SC-004** *(P3/P4)*: Weekly membership changes **never** exceed the churn budget except where a staff exception is recorded — **0** silent over-budget commits; an in-budget repair applies with a guide-veto window and reversible rollback; an over-budget or size-changing repair returns `staffExceptionRequired`.
  → `commit.test.ts` + `repair.test.ts`; golden [Fixture C](#fixture-c-churn-rollback-us2).
- **SC-005** *(P4)*: **100%** of bullying/coercion/exclusion reports bypass the optimizer and appear in the human safeguarding sink; **0** such reports alter a learner's rating or an assignment objective; a safeguarding hold pauses conflicting moves.
  → `safeguarding` test in `adapters/cohort-safeguarding-memory/test/index.test.ts`; golden [Fixture D](#fixture-d-safeguarding-shadow-us2).
- **SC-006** *(P2/P4)*: **0** assignments are produced or altered by a learned model; any benefit LCB is logged **strictly after** lock and is **absent** from the pre-lock solve/repair inputs.
  → `solver.test.ts` + `adapters/cohort-benefit-shadow/test/index.test.ts`; golden [Fixture D](#fixture-d-safeguarding-shadow-us2).
- **SC-007** *(P5)*: RivalryMix produces **0** honesty/emotion/personality/motivation labels; low-quality input lowers confidence and suppresses prompts (**0** patterns surfaced below threshold); refused/missing analytics produce **0** status changes, interventions, or motivation hypotheses.
  → `rivalrymix.test.ts` + `adapters/cohort-media-stub/test/index.test.ts`; golden [Fixture E](#fixture-e-turns--us3).
- **SC-008** *(P0/P6)*: Swapping any adapter (`CandidateIndex`, `CohortRepository`, `SafeguardingSink`, `MediaTurnSource`, `BenefitEstimator`) requires **no** change to the domain package; the deferred HNSW / CP-SAT / WebRTC+LiveKit / causal-uplift targets are **absent** from the buildable slice and represented as clearly-marked seams.
  → adapter tests across `adapters/cohort-*/test/`; the seeded smoke test proves the seam shape from iteration 1.

---

## Golden Values & Seed Fixtures

These are the **acceptance data**: fixed synthetic inputs with **exact** expected outputs. They live in-repo
as literal fixtures (`packages/cohort-compiler/test/fixtures/*.ts`, committed in P0) and drive the contract
tests. No external fetch. Tolerances are stated per fixture; where "byte-identical" / "exact" is used,
tolerance is **0**.

### Pinned formulas (used by the golden fixtures)

These reference formulas make the golden outputs exact. They are the **MVP defaults**; the caliper
tolerances, churn cap, objective weights, non-harm floor, and RivalryMix thresholds are all configurable
inputs (see [§ Pre-marked Decision Points](#pre-marked-decision-points)).

- **Within-caliper (per-dimension, inclusive):** `withinCaliper(a,b,c) = (|a.level−b.level| ≤ c.levelTolerance) AND (|a.velocity−b.velocity| ≤ c.velocityTolerance)`. Boundary (`==` tolerance) is **within**; `>` is out.
- **Candidate ordering distance (Manhattan):** `dist(a,b) = |a.level−b.level| + |a.velocity−b.velocity|`. Candidates are sorted by `dist` ascending, then `learnerRef` ascending (lexicographic). Cap at `caliper.k`.
- **Candidate-set hash (deterministic, pinned recipe):** `hash = fnv1a32hex(preimage)` where `preimage = subjectRef + ">" + orderedCandidateRefs.join(",")` (UTF-8), and `fnv1a32hex` is 32-bit FNV-1a rendered as 8-char lowercase hex. The test asserts (a) `run1.hash === run2.hash` and (b) `hash === fnv1a32hex(preimage)`; the literal hex is derived by the pinned recipe, not hand-copied.
- **Churn metric:** `churn(prev,next) = |{ ref : cohortIndexOf(prev, ref) ≠ cohortIndexOf(next, ref) }|`, where an unassigned learner has a distinct sentinel cohort index. A swap = 2.
- **Individual non-harm benefit (real, caliper-independent; injected with a pinned default):** the floor
  constraint reads a per-member benefit via an **injected** `benefitOf(member, cohort) → number` on
  `HardConstraints`. Production may supply a richer signal; the shipped **default** is a deterministic
  composite of **three factors that are independent of the level/velocity caliper** (so the floor is *not*
  toothless — the caliper already bounds level/velocity, so a level/velocity-derived floor could never
  bind). For member `m` in cohort `C`, let `peers = C \ {m}` and `P = |peers|` (`P = 5` for a full cohort of
  six). Each factor is normalized to `[0,1]`:
  - **Accommodation compatibility** `acc(m,C) = needs.length === 0 ? 1 : metCount / needs.length`, where
    `needs = m.accommodations.needs` and a need `n` is *met* iff **no** peer lists `n` in its
    `accommodations.conflicts`. (Distinct from the hard accommodations constraint, which rejects only a
    **mutual** block; a one-directional unmet need is hard-feasible but lowers benefit.)
  - **Prior-pairing history** `hist(m,C) = clamp01( 0.5 + 0.5·(pos/P) − 1.0·(neg/P) )`, where, over
    `m.pairHistory` restricted to refs in `peers`, `pos` counts `flag:"positive"` and `neg` counts
    `flag:"negative"`. Neutral is `0.5`; a prior-flagged **negative** pairing is penalized **twice** as
    hard as a positive pairing rewards. (This is a *friction* history, separate from the hard safeguarding
    `separations` constraint.)
  - **Pace/role fit** `pace(m,C) = 0.5·roleFit + 0.5·rhythmFit`, where
    `roleFit = 1 − (# peers with preferredRole === m.preferredRole) / P` (a unique/absent role → `1.0`) and
    `rhythmFit = (# peers whose workingRhythm is compatible with m.workingRhythm) / P` with
    `compatible(a,b) = (a === "flex") OR (b === "flex") OR (a === b)` (absent rhythm → treated as `"flex"`).
  - **Composite (pinned weights, sum to 1):**
    `benefitOf(m,C) = 0.40·acc(m,C) + 0.35·hist(m,C) + 0.25·pace(m,C) ∈ [0,1]`.
  - **Floor rule (hard, per-member, NEVER averaged):** `nonHarmFloor` default **0.5**. The constraint is
    `∀ m ∈ C: benefitOf(m,C) ≥ nonHarmFloor`; the cohort is **rejected if ANY** member's benefit `<`
    floor. The benefit is **never** averaged, summed, or otherwise aggregated across the cohort. The
    boundary is **inclusive** (`=== floor` passes). Floating-point tolerance on benefit values: **±1e-9**.
  Golden [Fixture B4](#fixture-b4-nonharm-default-bind-us2) exercises this **default** formula end-to-end
  (mean above floor, one member below → rejected); [Fixture B3](#fixture-b3-nonharm-reject-us2) injects an
  explicit benefit map to prove the floor is per-member and the signal is injectable.
- **Role vector (deterministic):** members sorted by `learnerRef` ascending receive roles from the fixed 6-slot vector `["anchor","scout","builder","builder","challenger","scribe"]` by index.
- **Cohort ordering (deterministic):** cohorts in an assignment are ordered by their lexicographically-smallest member `learnerRef`.
- **RivalryMix thresholds (default):** `{ dominanceTurnShare: 0.5, interruptionThreshold: 3, confidenceFloor: 0.5, minTurns: 4, qualityFloor: 0.5 }`. Dominance fires when a speaker's turn share is **strictly greater than** `dominanceTurnShare`. An overlap turn is an **attributable** interruption iff `overlap === true AND (quality ?? 1) ≥ qualityFloor`. `meanQuality = mean(quality ?? 1)`, `coverage = min(1, totalTurns / minTurns)`, `confidence = meanQuality × coverage`, and `suppressed = (totalTurns < 2) OR (confidence < confidenceFloor)`. When `suppressed`, **no** patterns are surfaced. Floating-point tolerance: **±1e-9**.

### Fixture A: `caliper-8` (US1)

**Config:** `caliper = { levelTolerance: 2, velocityTolerance: 2, k: 10 }`.

**Pool** (`level`, `velocity`, `separations`; all `ageBand: a9_11`, `schedule: ["mon-pm","wed-am"]`, `accommodations: { needs: [], conflicts: [] }`, `priorAssignmentRef: null`):

| ref | level | velocity | separations |
|---|---|---|---|
| L1 | 10 | 10 | `["L8"]` |
| L2 | 11 | 9  | `[]` |
| L3 | 12 | 12 | `[]` |
| L4 | 9  | 11 | `[]` |
| L5 | 20 | 20 | `[]` |
| L6 | 10 | 8  | `[]` |
| L7 | 13 | 10 | `[]` |
| L8 | 11 | 11 | `["L1"]` |

**Expected candidate sets** (ordered candidate refs; self + own separations excluded; out-of-caliper excluded):

| subject | expected candidates (in order) | preimage |
|---|---|---|
| L1 | `["L2","L4","L6","L3"]` | `L1>L2,L4,L6,L3` |
| L2 | `["L1","L6","L8","L7","L4"]` | `L2>L1,L6,L8,L7,L4` |
| L3 | `["L8","L7","L1"]` | `L3>L8,L7,L1` |
| L4 | `["L1","L8","L2"]` | `L4>L1,L8,L2` |
| L5 | `[]` | `L5>` |
| L6 | `["L1","L2"]` | `L6>L1,L2` |
| L7 | `["L2","L3","L8"]` | `L7>L2,L3,L8` |
| L8 | `["L2","L3","L4","L7"]` | `L8>L2,L3,L4,L7` |

**Asserted:** exact candidate lists above (tolerance 0); `L5` empty (empty-caliper case); `L8` never in `L1`'s set and vice-versa (separation); no output field encodes a caste rank or full-field ranking (FR-006); `run1 === run2` for every set and hash.

### Fixture B: `cohort-12` (US2)

**Config:** caliper as Fixture A; `hard = { age, schedule, separations, accommodations, caliper, nonHarmFloor: 0.5, churn }`; `churn = { weekKey: "2026-W30", cap: 4, used: 0, exceptions: [] }`; `weights = default`; `prior = null`. The `cohort-12` learners carry **no** benefit-relevant attributes (`accommodations.needs = []`, `pairHistory = []`, no `preferredRole`, no `workingRhythm`), so under the default `benefitOf` every member scores `acc = 1.0`, `hist = 0.5`, `pace = 1.0` → **benefit `= 0.40·1.0 + 0.35·0.5 + 0.25·1.0 = 0.825`** uniformly. The floor (0.5) does not bind here; the binding case is [Fixture B4](#fixture-b4-nonharm-default-bind-us2).

**Pool** (all `schedule: ["mon-pm","wed-am"]`, no accommodations conflicts, no separations):

| ref | ageBand | level | velocity |
|---|---|---|---|
| A1 | a9_11 | 10 | 10 |
| A2 | a9_11 | 11 | 10 |
| A3 | a9_11 | 10 | 11 |
| A4 | a9_11 | 12 | 10 |
| A5 | a9_11 | 11 | 12 |
| A6 | a9_11 | 12 | 11 |
| B1 | a12_14 | 20 | 20 |
| B2 | a12_14 | 21 | 20 |
| B3 | a12_14 | 20 | 21 |
| B4 | a12_14 | 22 | 20 |
| B5 | a12_14 | 21 | 22 |
| B6 | a12_14 | 22 | 21 |

**Expected `assignCohorts` output** (the age constraint forces the partition; the only feasible split into cohorts of six is by age band):

- `assignment.cohorts.length === 2`.
- `cohorts[0].members` (by ref) `= [A1, A2, A3, A4, A5, A6]` with roles `[anchor, scout, builder, builder, challenger, scribe]`.
- `cohorts[1].members` (by ref) `= [B1, B2, B3, B4, B5, B6]` with roles `[anchor, scout, builder, builder, challenger, scribe]`.
- `unassigned === []`.
- **0** hard-constraint violations; deterministic across runs (byte-identical `assignment`).
- No learned model consulted (FR-019): the solve inputs contain no benefit/LCB field.

### Fixture B2: `cohort-13-infeasible` (US2)

`cohort-12` **plus** `C1 = { ref: "C1", ageBand: "a6_8", level: 5, velocity: 5, schedule: ["mon-pm","wed-am"], separations: [] }`.

**Expected:** `cohorts` unchanged (the two full cohorts above); `unassigned = [{ ref: "C1", binding: ["age: fewer than six near-peers in age band a6_8"] }]`. `C1` is **never** force-placed into an `a9_11`/`a12_14` cohort (age is a hard constraint). Tolerance 0 on membership; `binding` is a machine-readable, non-empty reason list.

### Fixture B3: `nonharm-reject` (US2)

**(Injected-map isolation.)** A single candidate cohort with an **injected** `benefitOf` map. Purpose: prove the port is **injectable** and
the floor is enforced **per-member, never averaged** — independent of any formula. (The **default formula**
binding case is [Fixture B4](#fixture-b4-nonharm-default-bind-us2).)

- `members = [M1, M2, M3, M4, M5, M6]` (all within caliper, same age/schedule, no separations — so age/schedule/caliper/accommodations/separation all pass).
- `benefitOf` returns `{ M1: 0.90, M2: 0.80, M3: 0.70, M4: 0.60, M5: 0.45, M6: 0.80 }`; `nonHarmFloor = 0.5`.

**Expected `isFeasibleCohort` output:** `{ ok: false, violations: [{ constraint: "individual_non_harm_floor", member: "M5", value: 0.45, floor: 0.5 }] }`. The mean benefit is `(0.90+0.80+0.70+0.60+0.45+0.80)/6 = 0.708333… ≥ 0.5` — rejection proves the floor is **per-member and not averaged away** (FR-009). A control run with `M5 = 0.50` returns `{ ok: true, violations: [] }` (boundary inclusive).

### Fixture B4: `nonharm-default-bind` (US2)

**(Default formula binds.)** The **default** `benefitOf` (pinned composite above, weights `0.40/0.35/0.25`, floor `0.5`) applied
end-to-end to a single hard-feasible cohort of six — **no injected map**. This is the fixture where the
default floor **genuinely binds**: the cohort's mean benefit is **above** the floor but the cohort is
**rejected** because one member is **below** it.

All six share `ageBand: a9_11`, `schedule: ["mon-pm","wed-am"]`, and levels/velocities inside the caliper
(e.g. all `level`/`velocity` in `10..12`), with **no** safeguarding separations and **no** *mutual*
accommodation block — so age, schedule, caliper, separation, and the hard accommodations constraint all
pass, isolating the non-harm floor. Benefit-relevant attributes:

| ref | accommodations.needs | accommodations.conflicts | pairHistory | preferredRole | workingRhythm |
|---|---|---|---|---|---|
| D1 | `[]` | `[]` | `[]` | `anchor` | `steady` |
| D2 | `[]` | `[]` | `[]` | `scout` | `steady` |
| D3 | `[]` | `["low-stim"]` | `[]` | `challenger` | `steady` |
| D4 | `[]` | `[]` | `[]` | `builder` | `flex` |
| D5 | `[]` | `[]` | `[]` | `builder` | `burst` |
| D6 | `["quiet","low-stim"]` | `[]` | `[{ ref: "D2", flag: "negative" }]` | `builder` | `burst` |

**Exact per-member benefit** (`benefit = 0.40·acc + 0.35·hist + 0.25·pace`; `P = 5`):

| ref | acc | hist | pace (`0.5·roleFit + 0.5·rhythmFit`) | **benefit** |
|---|---|---|---|---|
| D1 | `1.0` (no needs) | `0.5` (no history) | `0.5·1.0 + 0.5·0.6 = 0.8` (anchor unique; 3/5 rhythm-compatible) | **`0.775`** |
| D2 | `1.0` | `0.5` | `0.5·1.0 + 0.5·0.6 = 0.8` (scout unique; 3/5) | **`0.775`** |
| D3 | `1.0` | `0.5` | `0.5·1.0 + 0.5·0.6 = 0.8` (challenger unique; 3/5) | **`0.775`** |
| D4 | `1.0` | `0.5` | `0.5·0.6 + 0.5·1.0 = 0.8` (builder dup=2 → 0.6; flex 5/5) | **`0.775`** |
| D5 | `1.0` | `0.5` | `0.5·0.6 + 0.5·0.4 = 0.5` (builder dup=2; burst 2/5) | **`0.700`** |
| D6 | `0.5` (`low-stim` blocked by D3; `quiet` met) | `0.3` (`0.5 − 1.0·(1/5)`; D2 negative) | `0.5·0.6 + 0.5·0.4 = 0.5` (builder dup=2; burst 2/5) | **`0.430`** |

**Expected `isFeasibleCohort` output:** `{ ok: false, violations: [{ constraint: "individual_non_harm_floor", member: "D6", value: 0.43, floor: 0.5 }] }`. The **mean** benefit is `(0.775·4 + 0.700 + 0.430)/6 = 4.23/6 = 0.705 ≥ 0.5`, yet the cohort is **rejected** because `D6 = 0.43 < 0.5` — the floor binds **per-member** on the real default signal, **never averaged** (FR-009). Only `D6` is below the floor; `D5 = 0.700 ≥ 0.5` and the rest at `0.775 ≥ 0.5`. Tolerance on benefit values: **±1e-9**.

**Control (boundary inclusive):** if `D3.accommodations.conflicts = []` (so `D6`'s `low-stim` need is met → `acc(D6) = 1.0`), then `benefit(D6) = 0.40·1.0 + 0.35·0.3 + 0.25·0.5 = 0.630 ≥ 0.5`, all six pass, and `isFeasibleCohort` returns `{ ok: true, violations: [] }`.

### Fixture C: `churn-rollback` (US2)

Uses the `cohort-12` A-group plus one bench learner `A7 = { ref: "A7", ageBand: "a9_11", level: 11, velocity: 11, schedule: ["mon-pm","wed-am"], separations: [] }` (within caliper of the A-group).

1. **Commit asg-1** (`cohorts[0] = [A1..A6]`, `A7` unassigned; `prior = null`): `CommitResult = { ok: true, assignmentId: "asg-1", priorAssignmentId: null, reasons: [] }`. `repo.activeFor("A1") === "asg-1"`.
2. **Swap A6→A7** into asg-2 (`cohorts[0] = [A1,A2,A3,A4,A5,A7]`): `churn(asg-1, asg-2) === 2` (A6 removed, A7 added).
   - With `churn.cap = 2`: `commit(asg-2)` → `{ ok: true, assignmentId: "asg-2", priorAssignmentId: "asg-1", reasons: [] }` (boundary allowed).
   - With `churn.cap = 1` and no exception: `commit(asg-2)` → `{ ok: false, assignmentId: null, reasons: ["churn-exceeded"] }`; **nothing persisted** (asg-1 still active).
   - With `churn.cap = 1` **plus** a recorded exception `{ approvedBy: "safety-owner-1", reason: "reunite split friends", delta: 1 }`: `commit(asg-2)` → `{ ok: true, ... }`.
3. **Rollback:** after asg-2 commits, `rollback(repo, "asg-2")` restores asg-1 **byte-identical** (`cohorts[0] = [A1..A6]`, `A7` unassigned). Tolerance 0.
4. **Duplicate-active (atomic failure):** with asg-1 active, `commit(asg-dup)` where `asg-dup` contains `A1` and `asg-dup.priorAssignmentId !== "asg-1"` → `{ ok: false, reasons: ["duplicate-active-assignment"] }`; repo unchanged (no partial roster).

### Fixture D: `safeguarding-shadow` (US2)

- **Health event:** `{ assignmentId: "asg-1", reporterRef: "A2", eventClass: "bullying", affectedMembers: ["A3"], severity: "high", evidenceScope: "session-notes", immediateAction: "paused move", safeguardingLink: "sg-queue-1", followUpOwner: "guide-1" }`.
- **Active moves in flight:** `[{ moveId: "mv-1", touches: ["A3","A5"] }, { moveId: "mv-2", touches: ["A1"] }]`.
- **Expected `routeHealthEvent`:** `sink.pending()` contains exactly the event; the move touching `A3` (`mv-1`) is returned as **paused** (POL-007); `mv-2` is untouched; the event is **never** passed to `assignCohorts`/`scoreObjective`/`repairCohort` (no rating/objective field is mutated). Return type is `void`/`Promise<void>`.
- **Shadow benefit:** `BenefitEstimator.logAfterLock("asg-1", "2026-07-20T12:00:00Z")` → `{ assignmentId: "asg-1", lcb: 0.0, loggedAt: "2026-07-20T12:00:00Z", shadow: true }`. **Property:** the returned `BenefitLCB` is absent from every solve/repair input (asserted by type + a test that scans solve inputs); calling `logAfterLock` before lock is a no-op/error (never produced pre-lock).

### Fixture E: `turns-*` (US3)

Thresholds = the RivalryMix defaults pinned above. Each `TurnEvent` is `{ speaker, start, duration, overlap, quality? }`.

**`turns-dominance`** — `[ {S1,0,10,false}, {S2,10,5,false}, {S1,15,10,false}, {S1,25,10,false}, {S3,35,5,false}, {S1,40,10,false} ]`
Expected: `perSpeaker.S1.turnShare ≈ 0.6667`; `confidence = 1.0`; `suppressed = false`; `patterns = [{ kind: "dominance", subjects: ["S1"], evidence: "S1 holds 4/6 turns (66.7%) > 50%" }]`.

**`turns-interruption`** — `[ {S1,0,10,false}, {S2,8,6,true}, {S1,14,10,false}, {S2,20,5,true}, {S3,25,8,false}, {S2,30,5,true}, {S1,35,8,false}, {S3,43,7,false} ]`
Expected: no dominance (max turn share 0.375); `S2` attributable interruptions `= 3`; `confidence = 1.0`; `suppressed = false`; `patterns = [{ kind: "repeated_interruption", subjects: ["S2"], evidence: "S2 initiated 3 overlapping turns ≥ 3" }]`.

**`turns-lowquality`** — `[ {S1,0,10,false,quality:0.3}, {S2,10,10,false,quality:0.3}, {S1,20,10,false,quality:0.3} ]`
Expected: `meanQuality = 0.3`, `coverage = 0.75`, `confidence = 0.225`; `suppressed = true`; `patterns = []` (nothing surfaced despite S1's 0.667 share). Tolerance ±1e-9.

**`turns-sparse`** — `[ {S1,0,10,false} ]`
Expected: `suppressed = true` (totalTurns < 2); `patterns = []`; no spurious dominance.

**`turns-empty`** — `[]`
Expected: `suppressed = true`; `patterns = []`; `perSpeaker = {}`; `confidence = 0`. Models a refused/missing case → **no** status change, intervention, or motivation hypothesis (FR-024).

**`turns-ambiguous`** — `[ {S1,0,10,false}, {S2,8,5,true,quality:0.2}, {S1,13,10,false}, {S2,20,5,true}, {S1,27,10,false}, {S2,33,5,true} ]`
Expected: the `quality:0.2` overlap is **not** attributable (below `qualityFloor`), so `S2` attributable interruptions `= 2 < 3` → **no** `repeated_interruption`; turn shares are `S1 = S2 = 0.5` (not `> 0.5`) → **no** dominance; `meanQuality ≈ 0.8667`, `confidence ≈ 0.8667`, `suppressed = false`; `patterns = []`. Demonstrates "ambiguous overlap → no invented pattern" (FR-023, edge case).

**Universal assertion (all `turns-*`):** `TurnAnalysis` carries **no** honesty/emotion/personality/motivation field, in **100%** of outputs (FR-022, SC-007).

---

## Decisions Already Made

These are settled — do **not** re-open them.

1. **Stack:** TypeScript (strict) monorepo; **pnpm** workspaces; **Vitest**; **Biome**; `tsc -b`. Mirrors `packages/learning-loop` and `packages/evidence-graph`. (See [§ Stack & Commands](#stack--commands-pinned).)
2. **Pure domain, ports for all I/O:** `packages/cohort-compiler` is side-effect-free — **no I/O, no wall-clock reads, no `Math.random`**. Time (start/review timestamps, week keys) is passed in. I/O sits behind `CandidateIndex`, `CohortRepository`, `SafeguardingSink`, plus stub ports `MediaTurnSource` and `BenefitEstimator`.
3. **Candidate generation = pure kNN/caliper filter now; HNSW deferred** behind `CandidateIndex` (no HNSW library, no ANN in this slice).
4. **Solver = deterministic greedy construction + bounded local-search/repair now; CP-SAT/branch-and-price deferred.** "Correct" for this slice = **feasible + all hard constraints honored + deterministic**, *not* provably optimal. No native/OR-Tools dependency.
5. **Solver determinism:** no randomness anywhere; ties broken by `learnerRef` ascending; cohorts ordered by smallest member ref; roles assigned by the fixed role vector. Same inputs → byte-identical output.
6. **Hard vs. soft strictly separated:** the seven hard constraints gate feasibility as boolean predicates; the soft objective only ranks *feasible* options and can never make an infeasible assignment feasible or trade away a hard constraint.
7. **Individual non-harm floor is hard, per-member, never averaged — over a REAL, caliper-independent benefit signal.** The per-member benefit is a **deterministic composite** of three factors **independent of the level/velocity caliper** — accommodation compatibility (`0.40`), prior-pairing history (`0.35`), and pace/role fit (`0.25`) — pinned exactly in [§ Golden Values → Pinned formulas](#pinned-formulas-used-by-the-golden-fixtures). It is deliberately **not** derived from level/velocity (the caliper already bounds those, so a level/velocity-derived floor would never bind). The signal is **injectable** via `benefitOf` on `HardConstraints` (production may supply a richer estimate), but the concrete default formula + weights above are the pinned decision. The floor rule is fixed: **reject the cohort if ANY member's `benefitOf(m,C) < nonHarmFloor`** (default `0.5`), **never** averaged. This is a **deterministic rule**, not a learned causal-uplift estimate (which stays shadow, FR-019).
8. **Atomic commit + rollback in-memory; PostgreSQL deferred.** One active assignment per learner; whole-roster-or-nothing commit; prior snapshot retained for rollback.
9. **Bounded automation envelope:** in-budget repair auto-applies with a guide-veto window + one-click rollback; over-budget or size changes require a recorded staff exception.
10. **Safeguarding bypass is non-optimizable:** `CohortHealthEvent` routes straight to the sink, pauses conflicting moves (POL-007), never lowers a rating; it is never a negative objective term.
11. **No learned model assigns; causal uplift stays shadow** (`BenefitEstimator`, post-lock log only, never read in a solve/repair).
12. **RivalryMix is observable-only, confidence-gated pure logic;** WebRTC/AudioWorklet + LiveKit media plane deferred to `MediaTurnSource` stub. Suppress under low quality — never mislabel.
13. **No caste ranks (G6):** private level/velocity bands are matchmaking inputs only; no derived tier name / full-field ranking. Visible standings live in feature `004`.
14. **Parallel-safety:** all code in **new** dirs (`packages/cohort-compiler`, `adapters/cohort-*`); the only shared-file edit is the root `tsconfig.json` `references`, isolated as the **final** task.

## Defaults for the Unspecified

> **For anything this spec doesn't specify, choose the simplest correct option, record it in
> `.loop/decisions.md`, and continue.**

Apply this rule instead of asking. Typical unspecified-but-safe choices: exact TypeScript field names and file
splits within a module, internal helper names, the precise local-search neighborhood order (as long as it is
deterministic and ties break by `learnerRef`), the exact wording of machine-readable reason/evidence strings
(as long as they are stable and assertable), and README phrasing. Anything that would change a golden value,
weaken a hard constraint, or touch a shared root file is **not** a free default — see
[§ Pre-marked Decision Points](#pre-marked-decision-points).

## Stack & Commands (pinned)

- **Package manager:** `pnpm@9.15.9` (root `packageManager`; the harness auto-detects the lockfile). Node.js LTS.
- **Workspace globs** (already present — do **not** edit): `packages/*`, `adapters/*`, `apps/*` (`pnpm-workspace.yaml`).
- **Vitest include** (already present — do **not** edit): `packages/**/test/**/*.test.ts`, `adapters/**/test/**/*.test.ts` (`vitest.config.ts`).
- **TS base** (already present): `tsconfig.base.json` — `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`, `module: ESNext`, `moduleResolution: Bundler`. New packages `extends "../../tsconfig.base.json"` with `rootDir: "."`, `outDir: "dist"`, `include: ["src/**/*.ts","test/**/*.ts"]`.
- **Package manifest shape** (mirror `@gt100k/learning-loop`): `{ "name": "@gt100k/cohort-compiler", "version": "0.1.0", "private": true, "type": "module", "main": "./src/index.ts", "types": "./src/index.ts", "exports": { ".": "./src/index.ts" }, "scripts": { "test": "vitest run" } }`.

**Commands (the gate):**

```bash
pnpm install                                   # bootstrap the workspace
pnpm typecheck                                 # tsc -b   (strict; must be clean)
pnpm test                                      # vitest run across the workspace
pnpm lint                                      # biome check packages adapters apps
pnpm --filter @gt100k/cohort-compiler test     # this package's unit + contract tests
```

`build` in this repo means the app build (`pnpm build` → `@gt100k/student-compass`), which this slice does
not touch; the loop gate for this feature is **`pnpm typecheck` + `pnpm test`** (+ `pnpm lint`).

**Seeded smoke test (green from iteration 1).** As the first deliverable of P0, add
`packages/cohort-compiler/test/smoke.test.ts` importing the package entrypoint and asserting the module loads
and the seed fixtures are well-formed, e.g.:

```ts
import { describe, expect, it } from "vitest";
import * as cohort from "../src/index";
import { caliper8 } from "./fixtures/caliper-8";

describe("smoke", () => {
  it("package entrypoint loads", () => {
    expect(cohort).toBeTypeOf("object");
  });
  it("seed fixture caliper-8 has 8 learners with unique refs", () => {
    expect(caliper8.pool).toHaveLength(8);
    expect(new Set(caliper8.pool.map((l) => l.learnerRef)).size).toBe(8);
  });
});
```

This keeps `pnpm test` green before any feature logic exists, so the gate never blocks the loop on an empty
package.

## Environment & Secrets

- **No secrets, no env vars, no network, no external services.** The slice is synthetic-only and pure
  in-memory; nothing reads `process.env`, a clock, or `Math.random`.
- The repo is **public**; `.env`/`.env.*` are git-ignored (`!.env.example`). This feature needs **no**
  `.env.local` — `pnpm typecheck`/`pnpm test` succeed with an empty environment. Do not add env-dependent
  code paths.
- No machine-specific absolute paths in code or fixtures (ENG rule).

## Pre-marked Decision Points

Where a real product judgment is unavoidable, the **default** is stated inline. `severity: critical` marks
choices that would invalidate an SC or touch something irreversible/shared; the loop escalates only those.

- **DP-1 — Caliper tolerances (`levelTolerance`, `velocityTolerance`, `k`).** *Default:* `{ 2, 2, 10 }` (Fixture A). `severity: low` — tunable config; any values satisfy the FRs as long as behavior is deterministic and the caliper is a hard near-peer bound. Changing them changes golden Fixture A, so keep them for the golden tests.
- **DP-2 — Churn cap.** *Default:* `4` per week for a normal compile; `2` in the churn boundary golden. `severity: normal` — tunable; the invariant (never silently exceed; swap = 2) is fixed.
- **DP-3 — Objective weights.** *Default:* churn-dominant with all terms present; the only pinned golden property is monotonicity (lower churn ranks higher) and determinism. `severity: low` — tunable; must never override a hard constraint.
- **DP-4 — Individual non-harm floor value + benefit formula.** *Default:* floor `0.5` with the pinned **real, caliper-independent** composite `benefitOf` = `0.40·acc + 0.35·hist + 0.25·pace` (accommodation compatibility, prior-pairing history, pace/role fit); the benefit function is **injectable** via `HardConstraints` so production can swap in a richer signal. `severity: normal` — the *invariant* (hard, per-member, never averaged; the signal is **independent of the caliper** so the floor can actually bind) is **critical** and fixed; the numeric floor value and the three weights are tunable config (changing them changes golden [Fixture B4](#fixture-b4-nonharm-default-bind-us2), so keep them for the golden tests).
- **DP-5 — RivalryMix thresholds.** *Default:* `{ dominanceTurnShare: 0.5, interruptionThreshold: 3, confidenceFloor: 0.5, minTurns: 4, qualityFloor: 0.5 }`. `severity: low` — tunable; the *rule* (suppress under low quality, never mislabel, no trait field) is **critical** and fixed.
- **DP-6 — Root `tsconfig.json` references (the single shared-file touch).** *Default:* add `packages/cohort-compiler` and each `adapters/cohort-*` to the `references` array as the **final** task, in its own commit. `severity: critical` — it is the only shared-file edit and the merge-reconciliation point; keep it isolated.
- **DP-7 — Non-six cohort handling.** *Default:* leave leftover (<6) learners **unassigned** with a binding reason; a staff `sizeException` is the only path to a non-six cohort. `severity: normal` — never silently emit a wrong-size cohort.

## Assumptions

- **Pure-TS solver for the MVP**: the buildable definition of done is `tsc -b` + Vitest, so the optimizer is a **pure-TS greedy + local-search/repair** heuristic that produces *feasible, hard-constraint-honoring* cohorts and ranks them by the deterministic soft objective. It is **not** a globally optimal solver — **OR-Tools CP-SAT / branch-and-price** is the deferred production optimizer (PRD §15). "Correct" for this slice = feasible + all hard constraints honored + deterministic, not provably optimal.
- **Pure-TS caliper filter for the MVP**: candidate generation is a deterministic level+velocity distance filter / kNN over the in-memory pool. **HNSW** (the production ANN) is deferred behind the `CandidateIndex` port (PRD §15).
- **Media plane deferred to a stub**: RivalryMix operates on arrays of already-extracted turn events. Real-time capture (WebRTC/AudioWorklet/Rust-WASM) and the **LiveKit** SFU media plane (§15.1) are **deferred** to a `MediaTurnSource` stub port; the §15.1/§15.2 latency and scale SLOs (feature-to-guide-screen <250 ms p95; 20,000 rooms; join/reconnect budgets) are **production targets**, not MVP gates (pure logic is not latency-bound).
- **Level/velocity bands are given**: the private ratings that drive matchmaking are synthetic inputs to this slice; how they are computed (from mastery/velocity signals) is external (PRD §12/§15). This feature consumes them, it does not compute them.
- **Individual non-harm floor is a modeled per-learner threshold over a REAL, caliper-independent signal**: for the synthetic slice the per-learner benefit is a **deterministic composite** of accommodation compatibility, prior-pairing history, and pace/role fit (pinned formula + weights above; **injectable** via `benefitOf`) — chosen precisely because these factors are **independent of the level/velocity caliper**, so the floor can actually bind (a level/velocity-derived floor never would, since the caliper already bounds those dimensions). It is **not** a learned causal-uplift estimate (which stays shadow, FR-019). The weights/floor value are tunable config; the *invariant* (hard, per-learner, never averaged away; signal independent of the caliper) is fixed here.
- **Bounded automation envelope**: an in-budget cohort repair may auto-apply (bounded automation, §8.5) but always with a guide-veto window and one-click rollback; anything beyond the churn budget or a group-size change requires a recorded human exception. No irreversible, identity-defining move is automated.
- **Shadow causal-uplift**: the `BenefitEstimator` port exists only to prove the seam and the post-lock-only logging discipline; it returns a placeholder LCB and is never read during a solve/repair (Constitution III; §15).
- **Synthetic-only, governance stubbed**: no real learners, consent, media, or safeguarding case management; the safeguarding sink is an in-memory human-queue stub. Rights/authority limits still bind (Constitution I/III/V/VIII/IX; G4/G6/G7): no caste ranks, safeguarding bypass, one active assignment, aggregated peer views, no learned-model assignment.
- **Parallel-safety**: all code lives in new directories (`packages/cohort-compiler`, `adapters/cohort-*`). The workspace glob (`packages/*`, `adapters/*`) and the Vitest include (`packages/**/test`, `adapters/**/test`) already discover them, so no shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) needs editing. The only shared-file touch is adding project references to the root `tsconfig.json`, deferred to the final task for a human to reconcile at merge.
