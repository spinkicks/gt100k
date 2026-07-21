# Feature Specification: Cohort Compiler + RivalryMix — with the Cohort & Arena Viewer (Guide/Ops UI)

**Feature Branch**: `006-cohort-compiler`

**Created**: 2026-07-20

**Status**: Loop-ready (expanded: domain + UI)

**Input**: User description: "A code-first, framework-agnostic core for GT100K's Cohort Compiler + RivalryMix (PRD §15, §15.1, §15.2): near-peer candidate generation by a level+velocity caliper (pure-TS kNN; HNSW deferred); a cohort-assignment solver that forms stable cohorts of six under HARD constraints (age, schedule, safeguarding separation, accommodations, level-velocity caliper, an individual non-harm floor, and a churn budget) via a pure-TS greedy + local-search/repair algorithm (CP-SAT/branch-and-price deferred), returning a `CohortAssignment` snapshot with atomic in-memory commit + rollback, one active assignment per learner, a weekly churn cap, and cohort repair within the churn budget; and a pure-logic RivalryMix turn-taking analysis that detects observable patterns (dominance, repeated interruption) but cannot infer honesty/emotion/personality/motivation and suppresses prompts under low-quality input (WebRTC/AudioWorklet capture + LiveKit media plane deferred to an interface stub). Guardrails: gain/velocity/effort-based, sprint-reset, near-peer standings and no fixed-ability caste ranks (G6); bullying/exclusion reports bypass optimization to safeguarding; peer-effect causal-uplift models stay shadow/deferred. Synthetic-only."

**UI addendum (this expansion).** On top of the finished pure domain, this spec now also specifies a
**beautiful, game-y, fully-animated Cohort & Arena Viewer** — a **guide/ops-facing** surface (PRD §9.2
Guide & Mentor Console / Operations & Governance Console; PRD §15/§15.3) that *observes* the compiler: an
animated **cohort-formation constellation** (learners flowing and crystallizing into cohorts of six under
the caliper, with satisfied hard-constraint badges, the non-harm floor, and churn/rollback shown
visually), a **gain-based standings** display (near-peer, no caste ranks, no bottom-rank, celebratory but
non-toxic), and a **RivalryMix "arena room"** (animated turn-taking — who holds turns, interruptions —
observable patterns only, never emotion/trait inference, low quality suppresses rather than labels). It is
delivered as a new **pure view-model package** `@gt100k/cohort-arena-view` (unit-tested, deterministic) +
a new **Next.js App-Router app** `@gt100k/cohort-arena` (`apps/cohort-arena`, build-verified via
`next build`). The existing `packages/cohort-compiler` domain is the read-only source of truth and is
**not modified**. Full art direction (§ UI Art Direction), a golden **motion table** (§ UI Motion Table),
and testable golden constants (§ UI Golden Values) are pinned below.

> **How to read this spec (JIT).** The loop reads *one section at a time*. Each phase in
> [§ Phasing](#phasing-p0p11) links to the requirements, success criteria, and golden fixtures it needs.
> Start at [§ Scope Fence](#scope-fence), then work [§ Phasing](#phasing-p0p11) top to bottom, gating each
> phase on the [§ Success Criteria](#success-criteria-mandatory) that map to it. When anything is
> unspecified, apply [§ Defaults for the Unspecified](#defaults-for-the-unspecified) — do not ask, log
> and continue. **Domain (P0–P6)** builds the pure `cohort-compiler` core; **UI (P7–P11)** builds the
> Cohort & Arena Viewer on top. The domain phases are unchanged; the UI phases are additive and read only
> from the committed domain API.

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

**UI layer — Cohort & Arena Viewer (guide/ops-facing; P7–P11):**

9. **Pure view-model package** `packages/cohort-arena-view` (`@gt100k/cohort-arena-view`) — a
   deterministic, framework-agnostic layer that reads the committed `@gt100k/cohort-compiler` API and
   composes a single **`CohortArenaView`** (`buildCohortArenaView(...)`) that drives every renderer, plus
   the pinned golden constant registries (`PALETTE`, `TYPOGRAPHY`, `MOTION`, `EASINGS`, `LAYOUT`) and the
   pure presentation functions (`layoutConstellation`, `layoutArenaRing`, `deriveStandingsView`,
   `resolveMotion`, `resolveVisualBand`, `buildLedger`, `plainViewEquals`). No I/O, no wall-clock, **no
   `Math.random`** — unit-tested by Vitest (UI-US1). ([§ UI Art Direction](#ui-art-direction--visual-identity), [§ UI Golden Values](#ui-golden-values--constants))
10. **Next.js App-Router app** `apps/cohort-arena` (`@gt100k/cohort-arena`) rendering the Viewer as a
    **3D "Compiler Observatory"** (**react-three-fiber + drei + three.js**, WebGL2, client-only): learner-stars
    drift in a calm 3D field along the near-peer caliper gradient, then **choreograph** into **cohorts of six** —
    hexagonal formations crystallizing with easing, each ringed by lit badges for the seven satisfied hard
    constraints and a **non-harm-floor halo**; unassigned learners rest on a calm **"still compiling" bench**;
    churn/rollback play as a visible **reverse-choreography** to the prior snapshot. A **RivalryMix arena room**
    is a **3D seat-ring** with turn-holder pulses, interruption arcs, and a dominance-share ring (observable-only).
    A **gain-based standings** panel + the **safeguarding-bypass** affordance are **DOM + motion@^12** HUD over the
    3D canvas (UI-US2/US3/US4).
11. **First-class equal reduced-motion mode (a calm 2D/static equivalent)** and a **synchronized accessible DOM
    "Cohort Ledger"** (WCAG 2.2 AA; keyboard/switch/screen-reader; 3D canvas `aria-hidden`) rendered from the
    **same** `CohortArenaView`, plus a **60fps budget with graceful degradation to a 2D tier** on weak devices /
    WebGL loss, **age-band representation**, and a **plain mode** — all state-identical to the full-spectacle view
    (`plainViewEquals`). The 2D tier and the reduced-motion tier render a **pure orthographic projection**
    (`project2D`) of the identical 3D view model.

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
- **No Go/Rust service, no live media/infra** in this slice (PRD §26.2/§26.3). *(The UI is a build-verified
  Next.js app reading synthetic domain output; it opens no media plane, no network, no live presence.)*

**UI non-goals (never built in the Viewer, by principle):**

- **No child-facing RPG game world** — that is feature `004-arena-game-world` (Phaser, avatars traversing a
  quest map). This Viewer is the **guide/ops** observation surface: it *watches the compiler*, it is not the
  learner's playable world. (It reuses the same guardrail posture but a different, ops-appropriate register.)
- **No caste rank, public tier name, full-field ranking, or "last of N" bottom-rank** anywhere in the UI —
  standings are near-peer, anonymized, gain-based, opt-in (default off), and structurally cannot carry a
  `rank`/`position`/`percentile`/`outOf` field (G6; Constitution VIII/IX).
- **No dark patterns** — no loss-framed streak, decay/absence meter, manufactured scarcity, FOMO, gacha/loot
  randomness, purchase/currency path, or engagement-timed notification (§14.12). An infeasible/unassigned
  learner is shown as a **calm "still compiling"** state, never a rejection jolt.
- **No emotion/honesty/personality/motivation label** rendered from RivalryMix — observable turn-taking only;
  low-quality input **suppresses** prompts, it never mislabels (§15/§15.2; G5/G6).
- **No motion-only affordance and no degraded accessibility fallback** — reduced-motion and the accessible
  Cohort Ledger are **equal** modes.
- **No modification** of `packages/cohort-compiler`, its adapters, `apps/student-compass`, or shared root
  config — except the single final root-`tsconfig.json` reference (the existing DP-6 shared-file touch).

---

## Phasing (P0–P11)

An ordered build path. Each phase ends at a **green gate** (`typecheck + test` for domain/view phases,
plus `next build` for the app phases) and a demonstrable checkpoint. The loop's "next task" is always the
first unchecked task in the lowest-numbered incomplete phase. Phase → task mapping lives in
[tasks.md](./tasks.md); phase → SC mapping is in [§ Success Criteria](#success-criteria-mandatory).
**Domain = P0–P6** (pure `cohort-compiler`, unchanged); **UI = P7–P11** (the Cohort & Arena Viewer, built
on the committed domain API — see [§ UI Art Direction](#ui-art-direction--visual-identity) and
[§ UI Golden Values](#ui-golden-values--constants)).

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
- **P6 — Polish (domain).** `cohort-compiler` README, end-to-end demo, quickstart validation. *(The single
  shared-file root-`tsconfig.json` touch now also lists the two new UI dirs and is deferred to the final UI
  task in P11.)* → SC-008.

**UI phases (the Cohort & Arena Viewer — build on the committed domain API):**

- **P7 — View-model domain (pure). 🎯 UI foundation.** Scaffold `packages/cohort-arena-view`; define the
  view types (`model.ts`), the pinned golden constants (`PALETTE`, `TYPOGRAPHY`, `MOTION`, `EASINGS`,
  `LAYOUT`), and the pure functions `buildCohortArenaView`, `layoutConstellation`, `layoutArenaRing`,
  `deriveStandingsView`, `resolveMotion`, `resolveVisualBand`, `buildLedger`, `plainViewEquals`; commit the
  view golden fixtures + a seeded smoke test. → SC-009, SC-010, SC-011, SC-012, SC-013, SC-017, SC-018.
  Golden: [Fixture V1 `view-cohort-12`](#fixture-v1-view-cohort-12-ui-us1), [V4 `motion-golden`](#fixture-v4-motion-golden-ui-us1).
- **P8 — App shell + 3D Cohort Observatory (UI MVP).** Scaffold `apps/cohort-arena` (Next.js, client-only
  **react-three-fiber `<Canvas>`** mount, transpile the two workspace packages); render the 3D **compile
  choreography** (learner-stars drift in the caliper field → flow along field-lines → **crystallize** into
  hexagonal formations of six with a lit satisfied-badge ring + non-harm-floor halo), the **DOM + motion@^12**
  HUD (cohort roster cards with FLIP layout animation, satisfied hard-constraint badges, the non-harm floor
  readout), the **reduced-motion 2D/static tier** (via `project2D`), the **weak-device 2D tier**, and the
  accessible **Cohort Ledger** tree. → SC-014, SC-015. Golden: [Fixture V1](#fixture-v1-view-cohort-12-ui-us1).
- **P9 — Gain-based standings + churn/rollback.** The opt-in near-peer **standings** panel (bar grow +
  number ticker; no rank/bottom-rank), the churn-budget meter, and the **rollback** control with its 3D
  **reverse-choreography** (stars retrace to the prior snapshot) + Ledger diff. → SC-012, SC-016 (churn/rollback
  visual). Golden:
  [Fixture V2 `view-standings`](#fixture-v2-view-standings-ui-us2).
- **P10 — RivalryMix arena room (3D).** The **3D seat-ring** (one seat per observed speaker), the turn-holder
  **pulse** (emissive + a soft vertical light column), **interruption arcs** (3D beziers interrupter→floor-holder),
  the **dominance-share ring** (a torus arc around the dominant seat), and the **low-quality suppression veil**
  (volumetric fog dim) — observable-only, no trait/emotion field. → SC-013. Golden:
  [Fixture V3 `view-rivalry`](#fixture-v3-view-rivalry-ui-us3).
- **P11 — Safeguarding affordance, a11y, perf & the single shared-file touch.** The **safeguarding-bypass**
  banner/lane (optimization visibly bypassed, conflicting moves paused, no rating/standing change); the
  WCAG 2.2 AA pass over the Ledger; reduced-motion parity; **60fps budget with graceful degradation to the 2D
  tier** (weak device / WebGL loss); app README; and the
  **final** task — add composite project references for `packages/cohort-compiler`, each `adapters/cohort-*`,
  **and** `packages/cohort-arena-view` to the root `tsconfig.json`. → SC-008, SC-016, SC-014, SC-015.

**MVP = P0 + P1** (domain near-peer candidate generation). **UI MVP = P7 + P8** (the animated cohort-formation
constellation with its reduced-motion + accessible equivalents). Each later phase is independently
demonstrable against synthetic inputs (US2/US3 feed synthetic candidate sets / turn arrays directly; the UI
phases feed synthetic `CohortAssignment` / `TurnAnalysis` values directly, so a UI phase never requires a
live solve).

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

### User Story 4 - Watch cohorts compile in a 3D Compiler Observatory (guide/ops) (Priority: P7/P8) 🎯 UI MVP

A guide or operator opens the **Cohort & Arena Viewer** and looks into a calm, dark **3D observatory**. The synthetic learner pool floats as a field of luminous **learner-stars**, positioned along the **near-peer caliper gradient** (level on one axis, velocity on another) so near-peers naturally cluster in space; faint horizontal **caliper rings** show the matchmaking bound and a follow-free camera drifts with unhurried, cinematic calm. On **compile**, the stars **flow along cool aurora field-lines** and **choreograph into cohorts of six** — a genuinely beautiful crystallization where each cohort assembles as a **hexagonal formation** of six members (with per-member roles) that eases into place with a subtle settle. Every accepted formation is **ringed by lit badges** for its seven **satisfied hard constraints** (age, schedule, safeguarding separation, accommodations, caliper, non-harm floor, churn) and sits over a **non-harm-floor halo** — a soft disc under the hex proving every member sits at or above the floor. Learners with no feasible cohort settle onto a calm **"still compiling" bench** (a lower shelf) in a gentle violet resting state — never a rejection jolt. A **churn meter** shows this week's budget; a **rollback** control plays a visible **reverse-choreography** that returns the stars to the prior snapshot. The whole scene is driven by **one deterministic view model**; it has a first-class **reduced-motion tier** (a calm 2D/static projection), a **weak-device 2D tier** (same projection), and a synchronized **accessible Cohort Ledger** that conveys every state to keyboard/screen-reader users (the 3D canvas is `aria-hidden`).

**Why this priority**: This is the headline UI — the thing that makes the compiler legible and impressive to the humans who own the consequential decision (Constitution I). It reads the committed domain output only, so it is the smallest independently-demonstrable UI slice and everything else (standings, arena room, safeguarding) hangs off the same view model.

**Independent Test**: Feed a synthetic `CohortAssignment` (e.g. Fixture B) to `buildCohortArenaView`; confirm the 3D constellation layout is deterministic (byte-identical `{x,y,z}` positions and their `project2D` `{x,y}` projections across runs, [Fixture V1](#fixture-v1-view-cohort-12-ui-us1)); render it (react-three-fiber) and confirm every accepted cohort shows six members, all seven hard-constraint badges satisfied, and the non-harm-floor halo; toggle reduced motion and confirm the same states render in the calm 2D/static tier without motion; force the weak-device/2D tier and confirm no state is lost; confirm the Cohort Ledger tree exposes the same states to AT; confirm `next build` succeeds with zero console/WebGL errors.

**Acceptance Scenarios**:

1. **Given** a feasible synthetic assignment, **When** the constellation composes, **Then** each cohort renders as a 3D hexagonal formation of exactly six members with roles, ringed by all seven hard-constraint badges lit satisfied, over a non-harm-floor halo at/above the floor — deterministically (identical `{x,y,z}` layout across runs).
2. **Given** an unassigned learner (Fixture B2 `C1`), **When** the constellation composes, **Then** the learner appears on the calm "still compiling" bench (the lower shelf) with the binding constraint shown, never force-placed and never shown as a loss/failure.
3. **Given** `prefers-reduced-motion` (or plain mode, or the weak-device 2D tier), **When** the constellation renders, **Then** the 3D compile choreography is replaced by the calm **2D projection** (`project2D`) with an instant snap to settled positions, a static "compiled" state, and an `aria-live` announce — no state is lost and no affordance is motion-only.
4. **Given** the accessible Cohort Ledger, **When** a keyboard/screen-reader user navigates it, **Then** every cohort, member, role, satisfied-constraint, and the non-harm floor is conveyed as text; the 3D canvas is `aria-hidden`.
5. **Given** a rollback, **When** invoked, **Then** the learner-stars **reverse-choreograph** to the prior snapshot and the Ledger shows the diff; nothing about the animation changes the domain result.

### User Story 5 - Gain-based standings, celebrated without toxicity (Priority: P9)

The Viewer shows an **opt-in** (default **off**) **near-peer** standings panel: the learner's own **gain** against the near-peer band top (`gainToBandTop = max(peer gains) − selfGain`), peers **anonymized/pseudonymous**, ranked on **gain/velocity/effort** and **sprint-reset** — **never** a fixed-ability caste rank, **never** a full-field ranking, and **never** a "last of N" bottom-rank position. When shown, growth is celebrated with a warm amber **bar-grow + number ticker** (tabular) — festive but calm, framed as *own growth*, not *beating others*. Turning standings off leaves everything unchanged.

**Why this priority**: Standings are the highest-risk surface for the caste-rank/bottom-rank guardrails (G6). Encoding them as a structural view type with **no** rank field and a friendly, own-growth framing makes the guardrail true by construction.

**Independent Test**: Feed a synthetic `{ selfGain, nearPeers }`; with `optedIn=false` confirm the standings view is `null`; with `optedIn=true` confirm it is near-peer/anonymized/gain-based, `gainToBandTop = max − self`, and the type exposes **no** `rank`/`position`/`percentile`/`outOf` field ([Fixture V2](#fixture-v2-view-standings-ui-us2)); confirm the bar-grow/ticker has a reduced-motion equivalent (instant filled bar + final number).

**Acceptance Scenarios**:

1. **Given** `optedIn=false`, **When** the standings view derives, **Then** it is `null` (default off) and nothing about learning/access/standing changes.
2. **Given** `optedIn=true`, **When** the standings view derives, **Then** it is near-peer, anonymized, gain-based, exposes `gainToBandTop = max(gains) − selfGain`, and carries **no** rank/position/percentile/outOf field and **no** bottom-rank surface.
3. **Given** the celebration, **When** rendered, **Then** it praises own growth (amber bar-grow + tabular ticker), never "you beat N children", and has a reduced-motion equivalent.

### User Story 6 - RivalryMix "arena room": observable turn-taking, never a label (Priority: P10)

The Viewer renders a cohort session as a **3D arena room** — a **seat-ring** of six seats on a circle, one per observed speaker. The current **turn-holder's** seat **pulses** (an emissive glow + a soft vertical light column); an **interruption** darts a short **3D arc** (a raised bezier) from the interrupter toward the floor-holder; a **dominance** pattern grows a **share ring** (a torus arc, filled to the turn share) around the dominant speaker's seat, with the triggering evidence text ("S1 holds 4/6 turns"). It surfaces **only observable descriptors + patterns + confidence** straight from `analyzeTurns` — **never** an honesty/emotion/personality/motivation label. When input is **low-quality/sparse**, the room dims under a **"confidence low — prompts suppressed"** veil (a volumetric fog + reduced bloom) and **no** pattern is surfaced (the veil, not a false label). Refused/missing analytics change nothing. The seat-ring has the same reduced-motion 2D/static tier + Ledger as the constellation.

**Why this priority**: This is the RivalryMix rights guardrail made visible — the UI must be *incapable* of showing a trait/emotion label and must *suppress rather than mislabel* under noise. It reads `TurnAnalysis` (US3 output) only, so it ships independently and last.

**Independent Test**: Feed `analyzeTurns(turns-dominance)` → confirm the arena view has three seats at the pinned ring positions, a dominance pattern on S1 with evidence, `confidence 1.0`, `suppressed false` ([Fixture V3](#fixture-v3-view-rivalry-ui-us3)); feed `turns-lowquality` → confirm `suppressed true`, the veil state, and **no** pattern; confirm the arena view type carries **no** honesty/emotion/personality/motivation field in 100% of outputs.

**Acceptance Scenarios**:

1. **Given** a dominance turn array, **When** the arena view composes, **Then** the dominant speaker's seat shows a share arc with the observable evidence, and **no** trait/emotion label appears.
2. **Given** repeated interruptions, **When** rendered, **Then** interruption arcs animate from interrupter to floor-holder and the count is shown; the reduced-motion form shows the tally in the Ledger without motion.
3. **Given** a low-quality/sparse array, **When** the arena view composes, **Then** it shows the "confidence low — prompts suppressed" veil and surfaces **no** pattern (never a false label).
4. **Given** any turn array, **When** the arena view composes, **Then** the view type carries **no** honesty/emotion/personality/motivation field.

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

**UI edge cases (the Viewer):**

- **Empty / single-cohort assignment**: the constellation renders whatever cohorts exist (0, 1, or many) without layout error; an empty assignment shows the calm bench + "nothing compiled yet" empty state, never a broken canvas.
- **Unassigned learner in the view**: rendered on the bench in the calm violet "still compiling" state with its binding constraint, never as a red error/loss and never force-placed. (Golden: [Fixture V1](#fixture-v1-view-cohort-12-ui-us1) uses the feasible pool; the unassigned rendering is asserted from Fixture B2 `C1`.)
- **Reduced-motion parity**: with `prefers-reduced-motion`, every animated affordance (compile flow, badge pop, floor glow, standings bar, turn pulse, interruption arc, rollback rewind, safeguarding sweep) has a static/instant equivalent conveying the same state; nothing is motion-only (FR-039, SC-015).
- **Accessible parity**: a keyboard/switch/screen-reader user reaches every state via the Cohort Ledger; the canvas is `aria-hidden` and never the sole carrier of state (FR-040, SC-014).
- **Color-independent state**: every state (assigned/unassigned/satisfied/paused/suppressed) is carried by icon/shape/text, never color alone, at ≥4.5:1 contrast (FR-045, SC-018).
- **Standings floor**: never "last of N" — a would-be bottom learner sees own gain vs. band top, and the view type cannot represent a rank/position (FR-035, SC-012).
- **RivalryMix low-quality**: the arena room suppresses (veil + no pattern) rather than showing a label; a refused/missing analytics case shows a neutral "analytics off" state and changes nothing (FR-037, SC-013).
- **Safeguarding during viewing**: a `CohortHealthEvent` renders a firm-not-alarm banner, freezes conflicting cohort moves in the constellation, and visibly routes to the safeguarding lane; it never alters a standing, rating, or objective in the view (FR-038, SC-016).
- **WebGL unavailable / context loss / weak device**: if WebGL2 is unavailable, the context is lost, or the runtime fails the 60fps budget on a weak device, the app **degrades gracefully to the 2D tier** — a pure `project2D` orthographic rendering (DOM/SVG) + the Cohort Ledger (neither depends on WebGL); no state is lost and no mastery/ops action is blocked (FR-041). The degraded 3D tier (halved star count, bloom/postprocessing off, shadows off) is tried before the 2D tier.
- **60fps budget**: the 3D scene targets 60fps on the minimum supported device; instanced learner-stars, a capped light count, and an optional degraded tier hold the budget; frame-rate is an acceptance target (verified in the walkthrough), not a unit test (FR-041, SC-014).
- **App builds with no network/env**: `next build` succeeds with an empty environment; the app fetches nothing external (fonts fall back to a system-rounded stack; all data is synthetic/injected) (FR-042).

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

**UI view model — pure & one-view-drives-all (UI-US1)**

- **FR-028**: The Viewer MUST compose a **single `CohortArenaView`** via `buildCohortArenaView(input)` in the **pure** `packages/cohort-arena-view` package (no I/O, no wall-clock, **no `Math.random`**); the **3D react-three-fiber canvas**, the **DOM + motion@^12 HUD**, the **reduced-motion / 2D-tier rendering** (via `project2D`), and the accessible Cohort Ledger MUST **all** render from that one view (parity by construction). Reduced-motion/plain/age-band/2D-tier MUST **not** recompute domain state — they render the identical view with motion/presentation/projection varied. The 3D layout carries exact `{x,y,z}` positions and their deterministic `project2D` `{x,y}` projections; both are pure outputs of the view.
- **FR-029**: `buildCohortArenaView` and every presentation function (`layoutConstellation`, `layoutArenaRing`, `deriveStandingsView`, `resolveMotion`, `resolveVisualBand`, `buildLedger`, `plainViewEquals`) MUST be **pure, deterministic** functions of their inputs — identical inputs → byte-identical view (no randomness, no time, replayable).
- **FR-030**: The view package MUST read the committed `@gt100k/cohort-compiler` public API **read-only** and MUST NOT modify the domain package, its adapters, `apps/student-compass`, or shared root config (except the single final root-`tsconfig.json` reference task).

**UI cohort-formation constellation (UI-US2)**

- **FR-031**: The Viewer MUST render an animated **3D cohort-formation constellation** — learner-stars that drift in a 3D caliper field (positioned along the near-peer caliper gradient via `layoutField`), then **flow** along field-lines and **choreograph/crystallize** into **hexagonal cohorts of six** — with a **deterministic 3D layout** (`layoutConstellation` producing `{x,y,z}` mote/hex/bench positions per the pinned `LAYOUT`), a **follow-free calm camera**, and a "compile" choreography; each animation MUST have a reduced-motion equivalent (FR-039) and MUST be renderable in the **2D tier** via the pure `project2D` projection of the identical positions.
- **FR-032**: Each accepted cohort in the view MUST show its **six members with roles**, a ring of **satisfied hard-constraint badges** (age, schedule, safeguarding separation, accommodations, level-velocity caliper, individual non-harm floor, churn budget) — all shown satisfied for an accepted cohort — and a **non-harm-floor halo** (a disc/glow under the hexagonal formation) proving every member's benefit is at/above the floor (read from the domain; never re-derived).
- **FR-033**: A learner with **no feasible cohort** MUST render as a calm **"still compiling / unassigned"** bench state with its binding constraint — **never** force-placed, **never** a loss/rejection/error framing (no shake, no red alarm) (§14.12).
- **FR-034**: The **churn budget** MUST render as a meter, and **rollback** MUST render as a reverse-settle animation restoring the prior snapshot with a Cohort Ledger diff; the visualization MUST NOT change the domain result (display only).

**UI gain-based standings (UI-US2)**

- **FR-035**: Any standing rendered by the Viewer MUST be **opt-in (default off)**, **near-peer-band**, **anonymized/pseudonymous**, **gain/velocity/effort-based**, **sprint-reset**, and MUST expose `gainToBandTop = max(peer gains) − selfGain`; the standings view type MUST carry **no** `rank`/`position`/`percentile`/`outOf` field and MUST NEVER surface a **bottom-rank** ("last of N") position, a **fixed-ability caste rank**, a **public tier name**, or a **full-field ranking** (G6; Constitution VIII/IX).
- **FR-036**: Standings celebration MUST frame **own growth** (amber bar-grow + tabular number ticker), never "beating others"; turning standings off (or plain mode) MUST leave everything unchanged.

**UI RivalryMix arena room (UI-US3)**

- **FR-037**: The Viewer MUST render a RivalryMix **3D arena room** (a **3D seat-ring** via `layoutArenaRing` producing `{x,y,z}` seat positions, a turn-holder pulse, 3D interruption arcs, a dominance-share ring) from `TurnAnalysis` **only** — observable descriptors, detected patterns, and confidence; it MUST NOT render (and the arena view type MUST NOT be able to carry) any **honesty/emotion/personality/motivation** label. Low-quality/sparse input MUST render a **"confidence low — prompts suppressed"** veil with **no** pattern surfaced (suppress, never mislabel); refused/missing analytics MUST render a neutral "analytics off" state and change nothing (§15/§15.2; G5/G6).

**UI safeguarding, dark-pattern & motion guardrails (UI-US4)**

- **FR-038**: A `CohortHealthEvent` (bullying/coercion/exclusion) MUST render a **firm-but-not-alarm safeguarding affordance** that visibly **bypasses optimization**, **pauses conflicting cohort moves** in the constellation (POL-007), and routes to a safeguarding **lane** — and MUST NEVER alter a standing, rating, or objective in the view (§15.2; Constitution I/IX).
- **FR-039**: **Reduced motion MUST be a first-class, equal mode** (a **calm 2D/static equivalent**): every animated affordance MUST have a reduced-motion rendering conveying the same state; the reduced-motion tier renders the pure **`project2D`** orthographic projection of the identical 3D view (no camera motion, no drift, instant snaps); `prefers-reduced-motion` MUST be honored by default; **no** feature may require motion or 3D/WebGL. All interaction motion MUST derive from the deterministic token registry (`MOTION`/`EASINGS`) via `resolveMotion(kind,{reducedMotion})`, and every row of the [§ UI Motion Table](#ui-motion-table) MUST have a first-class reduced-motion equivalent (WCAG 2.2 AA).
- **FR-040**: All Viewer surfaces MUST meet **WCAG 2.2 AA** via the synchronized accessible **Cohort Ledger** (`buildLedger`): keyboard/switch/screen-reader operable, focus-visible, color-independent, captioned where sound exists, ≥4.5:1 contrast. The canvas MUST be `aria-hidden="true"`; the Ledger MUST convey identical state from the same `CohortArenaView`.
- **FR-041**: The app MUST render the 3D scene on **react-three-fiber + drei + three.js (WebGL2)** via a `<Canvas>` loaded **client-only** (no SSR; `next/dynamic ssr:false`), disposed cleanly on unmount (geometries/materials/textures freed; no leaked GL contexts), with **zero console/WebGL errors** in the smoke run. It MUST target **60fps** on the minimum supported device with an internal **degraded 3D tier** (halved star count, postprocessing/bloom off, shadows off); on WebGL2 unavailability, context loss, or a sustained frame-budget miss it MUST **degrade to the 2D tier** — the pure `project2D` DOM/SVG rendering + Ledger (neither depends on WebGL) — with no state lost and no ops action blocked.
- **FR-042**: Seed art (small inline SVG/procedural shapes) MUST be committed in-repo; the app MUST build (`next build`) and run with **no external fetch** and **no secrets/env** required (fonts fall back to a system-rounded stack; all data is synthetic/injected).
- **FR-043**: The reward/standings/celebration surface MUST use **no dark patterns** — no loss-framed streak, decay/absence meter, manufactured scarcity, FOMO, gacha/loot randomness, purchase/currency path, or engagement-timed notification (§14.12); an infeasible/unassigned learner is a calm state, never a punishment.
- **FR-044**: Presentation MUST resolve per **age band** via `resolveVisualBand(band)` and support a low-spectacle **plain mode**; the underlying `CohortArenaView` state MUST be identical across bands/plain/reduced (`plainViewEquals`) — only presentation varies.
- **FR-045**: The Viewer MUST render the **Compiler Observatory** visual identity — the pinned palette ([§ UI Golden Values](#ui-golden-values--constants) `PALETTE`), the typography tokens (`TYPOGRAPHY`), and the golden layout constants (`LAYOUT`) — using **no external fetch**; **color is never the sole state cue** (every state also carried by icon/shape/text at ≥4.5:1 contrast).
- **FR-046**: The Viewer is a **guide/ops-facing** surface (PRD §9.2), **not** a child-facing game world; it MUST NOT introduce any child-facing consequential control — it *observes* the compiler's output and never *decides* (Constitution I; human authority is unchanged — the domain already owns the bounded-automation envelope, FR-017).

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

**UI view entities** (in `packages/cohort-arena-view`; full shapes in [data-model.md](./data-model.md)):

- **CohortArenaView**: The single composed view model that drives every renderer — `constellation`, `cohorts`, `standings`, `rivalry`, `safeguarding`, `motion`, `presentation`, and `ledger`. Pure output of `buildCohortArenaView`.
- **ConstellationView / MoteView / CohortHexView**: Deterministic **3D** constellation layout — per-learner mote positions in `{x,y,z}` (assigned to a cohort hexagonal formation, or on the bench shelf) plus each mote's **field-start** `{x,y,z}` (the caliper-gradient drift position) and its `project2D` `{x,y}` screen position; per-cohort hex center `{x,y,z}` + six member vertices; caliper ring radii; and each mote's `state` (`assigned | unassigned | candidate`).
- **CohortCardView**: Per-cohort HUD card — members + roles, the seven **satisfied** hard-constraint badges, the non-harm floor readout (`minBenefit ≥ floor`), and the churn delta vs. prior.
- **StandingsView** *(opt-in; nullable)*: near-peer, anonymized, gain-based — `band`, `anonymizedPeers`, `selfGain`, `gainToBandTop`. **Structurally has no `rank`/`position`/`percentile`/`outOf` field** and no bottom-rank surface (G6).
- **ArenaRoomView / SeatView / TurnPatternView**: RivalryMix seat-ring layout + turn-holding/interruption/dominance render specs + `confidence` + `suppressed`. **Structurally has no honesty/emotion/personality/motivation field.**
- **SafeguardingView**: the pending health event(s), the paused conflicting moves, and the "optimization bypassed" state — display only, never mutates a rating/standing/objective.
- **MotionToken / MotionSpec**: the resolved `{ kind, mode, durationMs, easing }` per event via `resolveMotion`; every kind has an animated and a reduced-motion form.
- **PresentationView / VisualBand**: palette + typography tokens, the resolved age-band variant, and the plain-mode flag; state-identical across bands (`plainViewEquals`).
- **LedgerView**: the accessible DOM structure spec (cohorts as a `role="tree"`, standings/rivalry/safeguarding as text/lists/alerts) — the AT source of truth, built from the same view.
- **Golden constant registries**: `PALETTE`, `TYPOGRAPHY`, `MOTION`, `EASINGS`, `LAYOUT` — exact, pinned, unit-tested.

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
- **SC-008** *(P0/P6/P11)*: Swapping any adapter (`CandidateIndex`, `CohortRepository`, `SafeguardingSink`, `MediaTurnSource`, `BenefitEstimator`) requires **no** change to the domain package; the deferred HNSW / CP-SAT / WebRTC+LiveKit / causal-uplift targets are **absent** from the buildable slice and represented as clearly-marked seams. The single shared-file touch (root `tsconfig.json` references) is the **final** UI task (P11).
  → adapter tests across `adapters/cohort-*/test/`; the seeded smoke test proves the seam shape from iteration 1.

**UI success criteria** (view SCs are Vitest tests in `packages/cohort-arena-view/test/`; app SCs are verified via `next build` + the seeded smoke + the [quickstart](./quickstart.md) walkthrough — frame-rate is an acceptance target, not a unit test):

- **SC-009** *(P7)*: `buildCohortArenaView` composes **one** deterministic view that drives every renderer; identical inputs → **byte-identical** view; `plainViewEquals` holds (reduced-motion/plain/age-band change **only** presentation, never the underlying cohort/standing/rivalry state).
  → `test/view.test.ts` (`plainViewEquals`, determinism); golden [Fixture V1](#fixture-v1-view-cohort-12-ui-us1).
- **SC-010** *(P7)*: Constellation + arena-ring **layout** is exact and deterministic — cohort hex centers, the six member vertices, bench slots, and the seat-ring positions match the pinned `LAYOUT` golden values across runs.
  → `test/layout.test.ts`; golden [Fixture V1](#fixture-v1-view-cohort-12-ui-us1) + [Fixture V3](#fixture-v3-view-rivalry-ui-us3).
- **SC-011** *(P7)*: Every interaction-motion value derives from the deterministic `MOTION`/`EASINGS` registry via `resolveMotion`, and **every** motion kind (and every [§ UI Motion Table](#ui-motion-table) row) has a first-class **reduced-motion** equivalent.
  → `test/motion.test.ts`; golden [Fixture V4](#fixture-v4-motion-golden-ui-us1).
- **SC-012** *(P7/P9)*: The standings view is **opt-in** (default `null`), near-peer, anonymized, gain-based, exposes `gainToBandTop = max(gains) − selfGain`, and the type carries **no** `rank`/`position`/`percentile`/`outOf` field and **never** a bottom-rank/caste rank/full-field ranking (guardrail by construction).
  → `test/standings.test.ts` + `test/guardrails.test.ts` (no rank field in view source); golden [Fixture V2](#fixture-v2-view-standings-ui-us2).
- **SC-013** *(P10)*: The RivalryMix arena view carries **only** observable descriptors + patterns + confidence + `suppressed`; it has **no** honesty/emotion/personality/motivation field (structural); low-quality/sparse input → `suppressed` veil with **0** patterns surfaced; refused/missing → neutral "analytics off", **0** status changes.
  → `test/rivalry.test.ts` + `test/guardrails.test.ts`; golden [Fixture V3](#fixture-v3-view-rivalry-ui-us3).
- **SC-014** *(P8/P11)*: The app **builds** (`next build`), the **react-three-fiber `<Canvas>`** mounts **client-only** with **zero** console/WebGL errors and disposes cleanly on unmount, the canvas is `aria-hidden`, the app degrades to the **2D tier** on WebGL loss without losing state, and the accessible **Cohort Ledger** conveys every state to keyboard/switch/screen-reader with visible focus and ≥4.5:1 contrast (WCAG 2.2 AA).
  → `next build` + seeded app smoke + quickstart a11y walkthrough; `test/view.test.ts` (Ledger completeness).
- **SC-015** *(P8/P11)*: **Reduced motion is a first-class equal mode** — with `prefers-reduced-motion` (or plain mode), full state/progression/celebration remain conveyable with **no** motion; **no** affordance is motion-only, and no state is lost.
  → `test/motion.test.ts` + `test/view.test.ts` (`plainViewEquals`) + quickstart reduced-motion pass.
- **SC-016** *(P9/P11)*: A `CohortHealthEvent` renders a firm-not-alarm affordance that visibly **bypasses optimization**, **pauses** conflicting moves, and routes to the safeguarding lane, altering **0** standings/ratings/objectives in the view; **churn/rollback** render as display-only visualizations that never change the domain result.
  → `test/safeguarding.test.ts` + `test/view.test.ts` (display-only invariance); golden [Fixture V1](#fixture-v1-view-cohort-12-ui-us1) (rollback diff).
- **SC-017** *(P7/P8)*: The UI encodes **no dark pattern** and **no caste/bottom-rank** — a source guardrail scan finds no `Math.random` in `packages/cohort-arena-view`, no `price`/`currency`/`rank`/`position`/`percentile`/`outOf` field in the view types, and no loss/decay/gacha/purchase/engagement-timer construct.
  → `test/guardrails.test.ts` (structural field + source scan).
- **SC-018** *(P7/P8/P11)*: `PALETTE`/`TYPOGRAPHY`/`LAYOUT` tokens are **exact** and stable; **state color is always paired with icon/shape/text** (never color-only) at ≥4.5:1 text contrast.
  → `test/art.test.ts` (token golden + contrast pairs) + quickstart color-independence pass.

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

## UI Art Direction & Visual Identity

> This is the **design bible** for the Cohort & Arena Viewer. It defines the look, motion, and feel the app
> must deliver. Everything a machine can check is pinned as an exact **testable golden constant** in
> [§ UI Golden Values](#ui-golden-values--constants); where prose here and a golden value disagree, the
> golden value wins. Everything stays buildable with **react-three-fiber + drei + three.js (WebGL2) +
> motion@^12 + Next.js** and inside every guardrail ([§ Scope Fence](#scope-fence) non-goals,
> [§ Requirements](#requirements-mandatory) FR-028–FR-046).

### Design pillars (the five sentences everything answers to)

1. **The Compiler Observatory.** The Viewer is a calm, focused **night-shift mission-control deck** where a
   field of learner-stars drifts and then **crystallizes** into fair, safe cohorts of six. It reads as a
   serious, beautiful *ops instrument* — the deliberate opposite of a casino leaderboard or the 2026 AI
   cream-dashboard default.
2. **Show the guarantees, not just the result.** The screen makes the *rights guardrails visible*: the
   near-peer caliper as a field, the seven satisfied hard constraints as a lit badge-ring, the individual
   **non-harm floor** as a glowing halo under every formation, churn as a metered budget, and rollback as a real
   rewind. A guide should be able to *see* that the compile was fair.
3. **Calm by default, celebratory only where growth is real.** Ambient motion is gentle and sparse; the
   loudest moment is a warm amber pulse on **own-growth** standings — never "you beat N children". An
   infeasible learner is a calm "still compiling", never a rejection jolt (§14.12).
4. **Reduced motion and the Ledger are equal citizens.** Every visual has a non-vestibular equivalent and a
   semantic DOM twin. Nothing beautiful is motion-only; nothing stateful is canvas-only (FR-039/FR-040).
5. **Observe, never decide, never label.** This is a guide/ops surface: it *watches* the compiler and never
   makes a consequential decision (Constitution I), and RivalryMix shows observable turn-taking only —
   never an emotion/trait label; low quality **suppresses**, it does not mislabel (FR-037).

### Register & rendering approach

- **Register (impeccable):** *product* (design **serves** the tool), pushed to a **game-y, impressive**
  finish — "mission control that happens to be gorgeous", not a marketing page. Deliberately rejects the
  cream/sand body bg and the SaaS hero-metric template.
- **Rendering split (decision — see [§ UI Decisions](#ui-decisions-already-made) D-UI-1):** a **3D
  react-three-fiber `<Canvas>` (drei + three.js, WebGL2)** for the two spatial, motion-heavy surfaces (the
  **3D Compiler Observatory** compile choreography and the **RivalryMix arena room**), and **DOM + motion@^12**
  (`motion/react`) for the HUD (cohort cards with FLIP layout animation, badges, standings bars, churn meter,
  safeguarding banner) and the accessible Ledger. Three tiers all render from the **one `CohortArenaView`**:
  (a) the **full 3D tier** (WebGL2 + drei helpers + bloom postprocessing); (b) the **2D tier** — a pure
  `project2D` orthographic DOM/SVG rendering used for reduced-motion, plain mode, weak devices, and WebGL loss;
  (c) the **Cohort Ledger** — the accessible DOM twin. The 3D canvas is `aria-hidden`; the Ledger is the AT truth.
  **motion@^12** owns *DOM* motion; **three.js** (via r3f `useFrame`) owns *3D* motion — no third animation lib.

### Master palette (exact hex — golden `PALETTE`; OKLCH-reasoned, contrast-verified)

| Role | Token | Hex | Use |
|---|---|---|---|
| Deck (canvas void / app bg) | `--deck` | `#0B1220` | the observatory void; scene background + fog + app backdrop |
| Deck raised (panel base) | `--deck-2` | `#111B2E` | frosted HUD panel base |
| Deck raised-2 (card) | `--deck-3` | `#182740` | cohort cards, raised surfaces |
| Ink (on light chips) | `--ink` | `#0C1524` | text on light badges |
| Ink-hi (HUD text on deck) | `--ink-hi` | `#EAF2FB` | primary HUD/Ledger text (≈14:1 on `--deck`, AAA) |
| Ink-muted | `--ink-mut` | `#9FB3CC` | secondary text (≥4.5:1 on `--deck`) |
| Peer (caliper / cool primary) | `--peer` | `#38BDF8` | near-peer caliper field, candidate motes |
| Peer-hi | `--peer-hi` | `#7DD3FC` | hover / highlight |
| Form (cohort crystallized / feasible) | `--form` | `#34D399` | settled cohort hex, satisfied badges |
| Floor (non-harm floor guarantee) | `--floor` | `#2DD4BF` | the "every member ≥ floor" non-harm-floor halo/disc |
| Gain (standings / reward) | `--gain` | `#FBBF24` | own-growth bar + ticker (warm, rare) |
| Gain-hi | `--gain-hi` | `#FCD34D` | gain highlight |
| Pending (unassigned / compiling) | `--pending` | `#A78BFA` | calm "still compiling" bench motes |
| Churn (change / rollback motion) | `--churn` | `#F472B6` | churn trail + rollback rewind |
| Safeguard (firm, not alarm) | `--safeguard` | `#F0709A` | safeguarding lane/banner + shield glyph |
| Locked (out-of-caliper) | `--locked` | `#4B5C72` | muted slate — out-of-caliper / inactive |
| Focus ring | `--focus` | `#FFD166` | 3px ring, 2px offset — high-contrast on dark |

Every state color is **always paired with an icon/shape and text** (FR-045); color is never the sole cue.
`--ink-hi` on `--deck` ≈ 14:1 (AAA); `--ink-mut` on `--deck` ≥ 4.5:1; `--ink` on any light badge ≥ 4.5:1.

### Typography (tokens `TYPOGRAPHY`; **no external fetch**)

A three-role, contrast-axis system — geometric display + humanist body + a **mono for data readouts** (the
mission-control tell). Default to a system stack; self-hosted subset `woff2` is an optional, non-breaking
upgrade (DP-UI-3). Size-specific tracking (Apple): display tight, body `0`, labels `+0.01em`; leading
inverse to size. All counters/timers/gains use **tabular numbers** so digits don't shuffle.

| Role | Family token | rem | line-height | tracking | weight |
|---|---|---|---|---|---|
| Display (compile headline) | display | 2.25 | 1.06 | -0.02em | 600 |
| H1 (panel title) | display | 1.5 | 1.12 | -0.01em | 600 |
| H2 (card title) | body | 1.125 | 1.25 | 0 | 600 |
| Body / Ledger | body | 1.0 | 1.5 | 0 | 400 |
| Label / caption | body | 0.8125 | 1.4 | +0.01em | 500 |
| Data readout (gains, churn, counts) | mono | 0.9375 | 1.3 | 0 | 500 (tabular-nums) |

`fontDisplay = '"Space Grotesk","Inter",ui-sans-serif,system-ui,sans-serif'`;
`fontBody = '"Inter",ui-sans-serif,system-ui,sans-serif'`;
`fontMono = '"JetBrains Mono",ui-monospace,"SF Mono",Menlo,monospace'`.

### Mood board, in words

*A quiet mission-control deck at 2 a.m. A dark **3D observatory dome** with real depth and slow parallax,
where a hundred learner-stars drift in a volumetric field, then — on compile — flow along cool aurora
field-lines and **crystallize** into calm hexagonal formations of six that hang in space over soft
non-harm-floor halos. Frosted-glass readouts float in front of the void; a follow-free camera breathes with
unhurried, cinematic calm. Cool cyan/teal light carries the constraints; warm amber appears only where real
growth is celebrated. The unhurried confidence of air-traffic control, not a
casino. Never a leaderboard, never an alarm — a guide watching a fair, safe world assemble itself.*

### Surfaces & scenes (what the app renders)

| Surface | Owner | UX |
|---|---|---|
| **3D Compiler Observatory** (canvas) | r3f + drei + three.js | Learner-stars drift in a 3D caliper field (positioned along the caliper gradient); on **compile** they flow along field-lines and **choreograph** into hexagonal cohort formations of six; satisfied badge-rings ignite + non-harm-floor halos glow; unassigned stars rest on the calm bench shelf; churn/rollback play as reverse-choreography. Instanced stars, bloom postprocessing, follow-free camera. |
| **Cohort roster HUD** (DOM) | motion@^12 | Frosted cards, one per cohort — members+roles, the seven satisfied-constraint chips, the floor readout; **FLIP layout animation** (`layout` prop) when membership changes; press feedback on controls. |
| **Standings panel** (DOM) | motion@^12 | Opt-in (default off); own-gain bar-grow + tabular ticker vs. band top; anonymized peers; **no rank/bottom-rank** possible. |
| **RivalryMix arena room** (canvas) | r3f + drei + three.js | A 3D seat-ring; turn-holder pulse (emissive + light column); 3D interruption arcs; dominance-share ring; the low-quality **suppression veil** (fog dim). Observable-only. |
| **Safeguarding lane** (DOM) | motion@^12 | A firm-not-alarm banner + a routed "bypass optimization" lane; freezes conflicting moves; never mutates a standing/rating. |
| **2D tier** (DOM/SVG) | React + `project2D` | The reduced-motion / plain / weak-device / WebGL-loss rendering: a pure orthographic projection of the identical 3D view — same states, no motion/no 3D. |
| **Cohort Ledger** (DOM, AT) | React | The accessible twin from the same view: cohorts as a `role="tree"`, standings/rivalry/safeguarding as text/lists/alerts; `aria-live` for compile/rollback announces. Canvas `aria-hidden`. |
| **Control cluster** (DOM) | React | Reduced-motion / plain-mode / age-band / standings-off toggles (instant, frequent actions) + compile / rollback controls + a "?" help. ≥44px targets. |

### Age-band presentation (`resolveVisualBand`) & plain mode

Because a guide may be reviewing on behalf of a 6–8 vs. a 12–14 cohort, the Viewer resolves presentation per
age band (labels/marker scale/celebration ceiling) and offers a low-spectacle **plain mode** — but the
underlying `CohortArenaView` state is **identical** across bands/plain/reduced (`plainViewEquals`); only
presentation varies (FR-044). 6–8: story labels, larger markers (×1.25), celebration ceiling "gentle",
comparison off. 9–11: growth-first, ×1.1. 12–14: full readouts (mono numbers), ×1.0.

---

## UI Motion Table

Motion is designed, not decorated (Apple §17). Durations are **named tokens** (`MOTION`); easings are
**named** (`EASINGS`); **every** row has a first-class reduced-motion equivalent (reduced motion = *gentler*,
not *gone* — and in this build the reduced-motion / 2D tier renders the `project2D` projection). All entries
derive from `resolveMotion(kind,{reducedMotion})` so the values are testable constants (SC-011). The **Layer**
column names the engine: **3D** = three.js via r3f `useFrame`/drei; **DOM** = motion@^12 (`motion/react`);
**both** = a coordinated pair. Durations are exact ms; tolerances on the acceptance walkthrough are ±30ms.

| Event | `kind` | Named effect (vocabulary) | Easing (name) | Duration (token, ms) | Layer · extras | Reduced-motion / 2D-tier equivalent |
|---|---|---|---|---|---|---|
| Scene / camera settle | `cameraEase` | **Continuity dolly** (camera eases to framing on load / recenter) | `move` | `pulse` 1200 | 3D · follow-free | static camera at the pinned pose; no motion |
| HUD panel enter | `panelEnter` | **Materialize** (blur+scale 0.98→1.0) | `enter` | `panel` 320 | DOM | instant show + `micro` 150 opacity |
| Learner-star idle | `ambientDrift` | **Float / ambient drift** (3D low-amplitude bob + parallax) | `linear` | `ambientDrift` 9000 loop | 3D · instanced | **off**; static positions (settled) |
| **Cohort compile** | `compile` | **Flow + Choreograph + Settle** (stars flow along 3D field-lines, crystallize into a hex of six) | `settle` (overshoot ≤1.04) | `compile` 900 | 3D · small burst/cohort | **instant snap** to settled 3D positions (2D-tier: snap to `project2D`) + static "compiled" + `aria-live` (150) |
| Constraint badge satisfied | `badgeSatisfied` | **Pop-in** (0.95→1.0) + check **Line-draw** + bloom flare | `settle` | `reveal` 240 | 3D · bloom | instant show + static check |
| Non-harm-floor halo | `floorHalo` | **Glow pulse** (yoyo, low amplitude, emissive disc) | `loop` | `pulse` 1200 loop | 3D · bloom | static halo + "all ≥ floor" text |
| Member swap (churn) | `memberSwap` | **Layout (FLIP)** card shift + 3D star re-choreograph + churn-color trail | `move` | `settle` 520 | both · small trail | instant reposition + Ledger diff |
| **Rollback** | `rollback` | **Reverse-choreography** (stars retrace to the prior snapshot) + rewind sweep | `rollback` | `rollback` 600 | 3D | instant restore + "rolled back to asg-N" announce |
| Standings bar | `standingsBar` | **Bar grow** L→R + **Number ticker** (tabular) | `enter` | `standings` 420 | DOM | instant filled bar + final number |
| Gain celebrate (own-growth) | `gainCelebrate` | **Warm pulse** + amber sweep | `settle` | `reveal` 240 | DOM · few | static amber chip + announce |
| RivalryMix turn-holding | `turnPulse` | **Seat pulse** (emissive + soft vertical light column) | `loop` | `pulse` 1200 loop | 3D · bloom | static "S1 holds the floor" + highlighted seat |
| RivalryMix interruption | `interruptionArc` | **Arc dart** (raised 3D bezier interrupter→floor-holder) | `move` | `fast` 200 | 3D · spark | static interruption tally in Ledger |
| RivalryMix dominance | `dominanceRing` | **Share-ring grow** (torus arc filled to turn share) | `enter` | `standings` 420 | 3D | instant ring + "S1 holds 4/6 turns" text |
| Low-quality suppression | `suppressVeil` | **Dim + veil** (volumetric fog; "confidence low — prompts suppressed") | `enter` | `base` 300 | 3D | static veil + identical text |
| Safeguarding bypass | `safeguardSweep` | **Shield sweep** (moves freeze, event routes to sink lane) | `enter` (firm) | `base` 300 | both | static "Safeguarding — optimization bypassed; N move(s) paused" + focus |
| Press feedback | `press` | **Press/Tap** scale 0.97 (on pointer-down) | `press` | `press` 120 | DOM | **kept** (non-vestibular) |
| Card/badge enter | `cardEnter` | **Stagger** 40ms between items | `enter` | `reveal` 240 | DOM | instant / opacity |
| Detail/drawer open | `drawerOpen` | **Origin-aware Scale-in** (from trigger) | `enter` | `fast` 200 | DOM | instant / fade |
| HUD toggle (rm/plain/band/standings/2D) | `hudToggle` | **Instant** (frequent action → no animation) | `linear` | `instant` 0 | DOM | instant |

**Deliberately excluded** (would violate §14.12 / this design): **Shake/Wiggle** on infeasibility (an
unassigned learner is a *calm* violet bench state, not a rejection jolt), any `scale(0)` entrance, `ease-in`
on entrances, gacha/loot "reroll" reveals, loss/decay/streak meters, any leaderboard or bottom-rank
surface, alarm-red flashing, engagement-timed pop-ins, aggressive camera shake / dolly-zoom / whip-pans,
and any looping audio earworm. No emotion/trait label motion exists anywhere.

### Motion principles (the rules every value above obeys)

- **Frequency-appropriate** (Emil): rare (compile, rollback, celebrate) → expressive; occasional (badge,
  bar) → standard eased; frequent (HUD toggles, press) → instant/`press`.
- **Enter/exit `enter` (strong ease-out)**; on-screen moves `move` (ease-in-out); the crystallize "settle"
  uses a **subtle** Back.Out overshoot ≤1.04 (never `scale(0)`); **never `ease-in` on entrances**.
- **Interruptible** (Apple): compile/rollback animate from the live presentation value (r3f `useFrame`
  lerps from the current transform); input/camera is never locked out.
- **3D layer** animates only `position`/`rotation`/`scale`/`material` (emissive/opacity) + instanced
  attributes via `useFrame`; **DOM layer** animates `transform`/`opacity` (motion@^12 `layout` for FLIP); no
  layout-thrash. Target **60fps**, with a degraded 3D tier (halved instanced stars, bloom off, shadows off)
  and then the 2D tier holding the budget.
- **Camera is calm and follow-free** — a slow idle drift/breath only; no aggressive auto-rotate, dolly-zoom,
  or shake. Under reduced motion the camera is static.
- **Every** animation has a reduced-motion equivalent (this table) and a Ledger equivalent (`buildLedger`);
  reduced motion is *the same instrument, read calmly*.

---

## UI Golden Values & Constants

All view-domain values below are **exact** (deterministic; tolerance 0 unless a ±band is stated). They live
in `packages/cohort-arena-view` and are exercised by golden Vitest tests. UI/motion acceptance targets
(frame-rate, ±30ms timing) are verified via `next build` + the quickstart walkthrough, not unit tests,
except the pure `resolveMotion` values which are exact.

### Pinned constant registries

- **`MOTION` (durations, ms — exact):** `instant:0`, `press:120`, `micro:150`, `fast:200`, `reveal:240`,
  `base:300`, `panel:320`, `standings:420`, `settle:520`, `rollback:600`, `tickerRoll:600`, `compile:900`,
  `pulse:1200`, `ambientDrift:9000`.
- **`EASINGS` (name → CSS cubic-bézier; the same normalized `t→t` curves are used by the three.js
  `useFrame` lerps — exact):** `enter: cubic-bezier(0.23,1,0.32,1)`;
  `move: cubic-bezier(0.65,0,0.35,1)`; `settle: cubic-bezier(0.34,1.4,0.64,1)` (overshoot ≤1.04);
  `press: cubic-bezier(0.4,0,0.6,1)`; `loop: cubic-bezier(0.45,0,0.55,1)` (sine-like, yoyo);
  `rollback: cubic-bezier(0.32,0.72,0,1)`; `linear: linear`.
- **`resolveMotion(kind,{reducedMotion})` → `{ kind, mode, durationMs, easing }`.** Animated table below;
  under `reducedMotion:true` → `mode:"reduced"`, `easing:"linear"`, and `durationMs` from the reduced column.
  There are **19** kinds; every kind has both an `animated` and a `reduced` form.

| kind | animated ms | animated easing | reduced ms | reduced note |
|---|---|---|---|---|
| `cameraEase` | 1200 | move | 0 | static camera at the pinned pose |
| `panelEnter` | 320 | enter | 150 | opacity only |
| `ambientDrift` | 9000 | linear | 0 | static positions |
| `compile` | 900 | settle | 0 | instant snap to settled |
| `badgeSatisfied` | 240 | settle | 0 | instant check |
| `floorHalo` | 1200 | loop | 0 | static halo + "all ≥ floor" text |
| `memberSwap` | 520 | move | 0 | instant reposition |
| `rollback` | 600 | rollback | 0 | instant restore |
| `standingsBar` | 420 | enter | 0 | instant filled bar |
| `gainCelebrate` | 240 | settle | 0 | static chip |
| `turnPulse` | 1200 | loop | 0 | static highlight |
| `interruptionArc` | 200 | move | 0 | static tally |
| `dominanceRing` | 420 | enter | 0 | instant ring |
| `suppressVeil` | 300 | enter | 300 | static veil (same) |
| `safeguardSweep` | 300 | enter | 0 | static banner |
| `press` | 120 | press | 120 | kept (non-vestibular) |
| `cardEnter` | 240 | enter | 0 | instant / opacity |
| `drawerOpen` | 200 | enter | 150 | fade |
| `hudToggle` | 0 | linear | 0 | instant |

- **`PALETTE` (exact hex):** `deck:#0B1220`, `deck2:#111B2E`, `deck3:#182740`, `ink:#0C1524`,
  `inkHi:#EAF2FB`, `inkMut:#9FB3CC`, `peer:#38BDF8`, `peerHi:#7DD3FC`, `form:#34D399`, `floor:#2DD4BF`,
  `gain:#FBBF24`, `gainHi:#FCD34D`, `pending:#A78BFA`, `churn:#F472B6`, `safeguard:#F0709A`,
  `locked:#4B5C72`, `focus:#FFD166`. Contrast: `inkHi/deck ≈ 14:1` (AAA), `inkMut/deck ≥ 4.5:1`. State
  color always paired with an icon/shape (FR-045).
- **`TYPOGRAPHY` (exact):** families + the scale table above; `numeric:"tabular-nums"`.
- **`LAYOUT` (exact — the deterministic 3D geometry + its pure 2D projection).** All `{x,y,z}` are three.js
  world units; all `{x,y}` are screen px. Up axis is **+Y**; the scene floor plane is **Y = 0**; the camera
  looks toward **−Z**. 3D values are rounded to **3 decimals (±1e-3)**; projected `{x,y}` are integers
  (tolerance 0).
  - Screen/fallback viewport: `WORLD = { width: 1600, height: 900 }`.
  - Camera (presentation constant): `CAMERA = { position: { x: 0, y: 26, z: 46 }, target: { x: 0, y: 0, z: -6 }, fov: 42, near: 0.1, far: 400 }`.
  - Scene fog (presentation constant): `FOG = { color: "#0B1220", near: 40, far: 120 }`.
  - **Hex formation** (members lie in the local XZ plane, `y = 0`): `HEX_R = 6`. Member `k` (0..5, members
    sorted by `learnerRef` ascending) at angle `θk = 90 − k·60°`:
    `vertexLocal(k) = { x: round(6·cosθk,3), y: 0, z: round(6·sinθk,3) }` →
    `k0 {0,0,6}`, `k1 {5.196,0,3}`, `k2 {5.196,0,-3}`, `k3 {0,0,-6}`, `k4 {-5.196,0,-3}`, `k5 {-5.196,0,3}`.
  - **Cohort centers** (2-column grid; rows recede along −Z):
    `COHORT_ORIGIN = { x: -11, y: 0, z: 0 }`, `COL_W = 22`, `ROW_D = 22`, `COHORT_COLS = 2`;
    `center(i) = { x: -11 + (i%2)·22, y: 0, z: -(floor(i/2))·22 }` → `center(0) {-11,0,0}`, `center(1) {11,0,0}`,
    `center(2) {-11,0,-22}`, `center(3) {11,0,-22}`. Member world pos: `memberPos(i,k) = center(i) + vertexLocal(k)`.
  - **Non-harm-floor halo**: a horizontal emissive disc under each hex at `FLOOR_Y = -1.5`, radius `FLOOR_R = 8`,
    centered under `center(i)` (display of `minBenefit ≥ floor`, never re-derived).
  - **Badge ring**: seven satisfied-constraint badges on a circle of radius `BADGE_R = 8.5` at `y = 0.2` in the
    hex's XZ plane; badge `j` (0..6) at `θ = 90 − j·(360/7)°`.
  - **Bench** (unassigned "still compiling"; a lower front shelf): `BENCH_Y = -8`, `BENCH_Z = 18`,
    `BENCH_X0 = -20`, `BENCH_DX = 5`; unassigned `i` at `{ x: -20 + i·5, y: -8, z: 18 }`.
  - **Caliper field** (compile-start / drift positions along the near-peer gradient — level→X, velocity→Z):
    `FIELD_STEP = 2.5`, `FIELD_REF = { level: 11, velocity: 11 }`;
    `fieldPos(l) = { x: round((l.level − 11)·2.5,3), y: 0, z: round((l.velocity − 11)·2.5,3) }`.
  - **Caliper rings**: horizontal display discs, radii `CALIPER_RADII = [5, 10, 15]` world units (do not gate anything).
  - **Arena seat ring**: `RING_CENTER = { x: 0, y: 0, z: 0 }`, `RING_R = 10`; for `N` speakers (sorted ascending),
    seat `k` at `θk = 90 − k·(360/N)°`: `seatPos(k) = { x: round(10·cosθk,3), y: 0, z: round(10·sinθk,3) }`.
  - **Orthographic 2D projection** (reduced-motion / 2D tier / SVG; drops Y, top-down):
    `PROJECT = { scale: 24, cx: 800, cy: 450 }`; `project2D(p) = { x: round(800 + p.x·24), y: round(450 − p.z·24) }`.
    (Chosen so `RING_R·scale = 240` and `PROJECT.center = (800,450)`: the 2D-tier arena reproduces a clean
    240px-radius ring centered in the 1600×900 viewport.)

### Fixture V1: `view-cohort-12` (UI-US1)

`buildCohortArenaView` over domain [Fixture B `cohort-12`](#fixture-b-cohort-12-us2) (2 cohorts, no
unassigned, `prior = null`, `flags = { reducedMotion:false, plain:false, band:"9-11", standingsOptIn:false }`).

**Expected constellation (exact 3D `{x,y,z}` mote positions + their `project2D` `{x,y}`, `LAYOUT` above):**

- **Cohort 0** center `{-11,0,0}`, members `[A1,A2,A3,A4,A5,A6]` at `memberPos(0,k)`:
  - `A1 {-11,0,6}` → 2D `(536,306)`; `A2 {-5.804,0,3}` → `(661,378)`; `A3 {-5.804,0,-3}` → `(661,522)`;
    `A4 {-11,0,-6}` → `(536,594)`; `A5 {-16.196,0,-3}` → `(411,522)`; `A6 {-16.196,0,3}` → `(411,378)`.
- **Cohort 1** center `{11,0,0}`, members `[B1,B2,B3,B4,B5,B6]` at `memberPos(1,k)`:
  - `B1 {11,0,6}` → `(1064,306)`; `B2 {16.196,0,3}` → `(1189,378)`; `B3 {16.196,0,-3}` → `(1189,522)`;
    `B4 {11,0,-6}` → `(1064,594)`; `B5 {5.804,0,-3}` → `(939,522)`; `B6 {5.804,0,3}` → `(939,378)`.
- `bench === []` (no unassigned).
- **Field-start (compile origin)** examples via `fieldPos`: `A1 (level 10, velocity 10)` → `{-2.5,0,-2.5}`;
  `B1 (level 20, velocity 20)` → `{22.5,0,22.5}` (near-peers cluster; the B-group sits off along the caliper
  gradient). Field positions are the compile animation's start; the **settled** positions above are the golden.

**Expected cohort cards:** two cards; each with 6 members + the pinned role vector
`[anchor,scout,builder,builder,challenger,scribe]`; all **seven** hard-constraint badges `satisfied:true`;
non-harm floor readout `minBenefit = 0.825 ≥ floor 0.5` (from the domain — every member `0.825` in
Fixture B); churn delta `= 0` vs. `prior = null`.

**Expected standings:** `null` (`standingsOptIn:false`). **Expected safeguarding:** `{ pending: [], pausedMoves: [] }`.
**`plainViewEquals`:** re-running with `reducedMotion:true` / `plain:true` / `band:"6-8"` yields a view whose
`constellation`/`cohorts`/`standings`/`rivalry`/`safeguarding` are **identical**; only `motion`/`presentation`
differ (SC-009/SC-015). **Determinism:** two runs → byte-identical view (tolerance 0).

**Rollback diff (display-only):** given `prior = view-of-asg-1` and a swap `A6→A7`, the view's churn delta is
`2` and the Ledger diff lists `removed:[A6], added:[A7]`; invoking the rollback view does **not** change the
domain assignment (SC-016).

### Fixture V2: `view-standings` (UI-US2)

`deriveStandingsView(self, nearPeers, options)` with `self.selfGain = 300`,
`nearPeers = [{pseudonym:"kestrel",gain:260},{pseudonym:"otter",gain:340},{pseudonym:"finch",gain:300}]`.

- `options.optedIn = false` (default) → `null`.
- `options.optedIn = true` → `{ band, anonymizedPeers:[…3…], selfGain:300, gainToBandTop: 40 }` where
  `gainToBandTop = max(all gains) − selfGain = 340 − 300 = 40`. The result exposes **no**
  `rank`/`position`/`percentile`/`outOf` field and **no** bottom-rank (SC-012). Reduced-motion form: instant
  filled bar + final number `300` (no bar-grow, no ticker).

### Fixture V3: `view-rivalry` (UI-US3)

`buildArenaRoomView(analysis)` over the domain RivalryMix goldens ([Fixture E](#fixture-e-turns--us3)).

- **`turns-dominance`** (speakers `[S1,S2,S3]`, sorted) → 3 seats on the pinned 3D ring (`RING_R=10`, center
  `{0,0,0}`): `S1 {0,0,10}` → 2D `(800,210)`; `S2 {8.66,0,-5}` → `(1008,570)`; `S3 {-8.66,0,-5}` → `(592,570)`;
  one `dominance` pattern on `S1` with the observable evidence "S1 holds 4/6 turns (66.7%) > 50%";
  `confidence 1.0`; `suppressed false`. (The `project2D` of the 3D seats reproduces the clean 240px-radius ring.)
- **`turns-lowquality`** → `suppressed true`, the veil state (volumetric fog dim), `patterns: []` (nothing surfaced).
- **Universal:** the arena view carries **no** honesty/emotion/personality/motivation field, in **100%** of
  outputs (SC-013). Reduced-motion / 2D tier: seats static at their `project2D` positions, turn-holder
  highlighted (no pulse), interruptions as a tally in the Ledger.

### Fixture V4: `motion-golden` (UI-US1)

`resolveMotion(kind,{reducedMotion})` MUST return exactly the animated/reduced table rows above for **all 19**
`kind`s; every kind MUST have both an `animated` and a `reduced` form; `EASINGS`/`MOTION` MUST equal the
pinned registries (tolerance 0). (SC-011.) A companion **`project2D`** golden asserts the exact projected
`{x,y}` for Fixture V1's members and Fixture V3's seats (the 2D-tier positions), tolerance 0.

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
14. **Parallel-safety:** all code in **new** dirs (`packages/cohort-compiler`, `adapters/cohort-*`, and the UI dirs `packages/cohort-arena-view`, `apps/cohort-arena`); the only shared-file edit is the root `tsconfig.json` `references`, isolated as the **final** task.

### UI Decisions Already Made

These UI choices are settled — do **not** re-open them.

- **D-UI-1 — Rendering split: a 3D react-three-fiber canvas + DOM motion@^12 HUD, with a pure 2D-tier
  fallback.** The two spatial, motion-heavy surfaces (the 3D **Compiler Observatory** compile choreography and
  the RivalryMix **arena room**) render on **react-three-fiber `^8.17.10`** + **@react-three/drei `^9.114.0`**
  + **three `^0.169.0`** (WebGL2, client-only), with **@react-three/postprocessing `^2.16.3`** for a restrained
  bloom on the satisfied badges / floor halo / turn-pulse. The HUD (cohort cards with FLIP layout animation,
  badges, standings, churn meter, safeguarding banner) and the accessible Ledger render as **DOM + motion@^12**
  (`motion@^12.42.0`, imported from **`motion/react`**). A **2D tier** — a pure `project2D` DOM/SVG rendering of
  the identical 3D view — serves reduced-motion, plain mode, weak devices, and WebGL loss. *Rationale:* the
  vision is a genuinely 3D "observatory" where learner-stars drift in a volumetric caliper field and
  **choreograph** into hexagonal formations with real depth, parallax, and lit constraint rings — r3f gives
  declarative three.js with drei helpers (`OrbitControls`, `Instances`, `Line`, `Billboard`, `Html`,
  `Environment`) and clean React lifecycle/dispose; three.js owns 3D motion via `useFrame`. **motion@^12 owns
  DOM motion** (FLIP/shared-layout on cohort membership changes is its core strength; first-class
  `useReducedMotion`). This is a deliberate move **off Pixi's 2D renderer** — Pixi was the right call for a flat
  data-viz, but the spec now commits to a 3D scene, so Pixi and Phaser are both the wrong weight here. A
  different 3D approach (e.g. bare three.js without r3f) is acceptable **only** with a documented reason in
  `.loop/decisions.md`. **No third animation library** (no GSAP/Framer-Motion-legacy); motion@^12 for DOM,
  three.js `useFrame` for 3D.
- **D-UI-2 — Pure view package + separate Next.js app (mirror feature 004 D2).** `packages/cohort-arena-view`
  is **pure** (no I/O, no wall-clock, **no `Math.random`**), reads the committed `@gt100k/cohort-compiler`
  API read-only, and holds every view rule as a unit-testable function + the golden constants (incl. the exact
  3D `LAYOUT` and the pure `project2D`). `apps/cohort-arena` is the only place three.js/r3f/React/DOM live. This
  makes every guardrail deterministically testable and keeps the build parallel-safe (new dirs only).
- **D-UI-3 — One `CohortArenaView` drives every renderer (parity by construction; mirror 004 D4).** The 3D r3f
  canvas, the DOM HUD, the **2D-tier** projection, and the accessible Cohort Ledger **all** render from the
  single `buildCohortArenaView(...)` output; reduced-motion/plain/age-band/2D-tier never recompute state, so
  `plainViewEquals` is a pure, testable guarantee. The view carries both 3D `{x,y,z}` and projected `{x,y}`
  positions, so the 2D tier is not a second layout — it is a pure projection of the same one.
- **D-UI-4 — Accessible parallel DOM ("Cohort Ledger"), 3D canvas `aria-hidden` (mirror 004 D5).** Because a
  WebGL surface is opaque to assistive tech, the app renders a synchronized semantic HTML/ARIA twin from the
  same view (cohorts as a `role="tree"`, standings/rivalry/safeguarding as text/lists/alerts, `aria-live`
  announces). Reduced motion is a first-class **equal** mode (the calm 2D/static tier); WCAG 2.2 AA is a hard requirement.
- **D-UI-5 — Guardrails are structural, not asserted.** The `StandingsView` type has **no**
  `rank`/`position`/`percentile`/`outOf` field; the `ArenaRoomView` type has **no**
  honesty/emotion/personality/motivation field; there is no `price`/`currency`/gacha/decay construct anywhere.
  A guardrail scan test enforces this (SC-017).
- **D-UI-6 — Art direction: "Compiler Observatory" (deep-deck dark, cool caliper light, warm amber only for
  growth).** The palette/typography/layout are pinned golden constants ([§ UI Golden Values](#ui-golden-values--constants));
  the register deliberately rejects the cream/sand AI default and any leaderboard/casino framing.
- **D-UI-7 — App verified by `next build` + a seeded smoke, view verified by Vitest.** The pure view package
  is unit-tested (root `vitest.config.ts` already globs `packages/**/test` — no root edit); the app is
  verified by `pnpm --filter @gt100k/cohort-arena build` + the seeded smoke (zero console/WebGL errors,
  canvas mounted, Ledger focusable). No secrets/env/network.

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
not touch; the **domain** loop gate (P0–P6) is **`pnpm typecheck` + `pnpm test`** (+ `pnpm lint`).

### UI stack & commands (P7–P11)

- **View package** `@gt100k/cohort-arena-view` (pure): manifest mirrors `@gt100k/cohort-compiler`
  (`type: module`, `main`/`types` → `./src/index.ts`, `test: vitest run`), dependency
  `@gt100k/cohort-compiler` (`workspace:*`) only; `tsconfig.json` extends `../../tsconfig.base.json`
  (composite). Unit-tested by the existing Vitest globs — **no root config edit**.
- **App** `@gt100k/cohort-arena` (`apps/cohort-arena`): **Next.js `^14.2.15`** App Router + **React
  `^18.3.1`** + **React-DOM `^18.3.1`** (match `apps/student-compass`), and the **3D stack** pinned for
  React 18: **three `^0.169.0`**, **@react-three/fiber `^8.17.10`** (v8 pairs with React 18 — v9 requires
  React 19), **@react-three/drei `^9.114.0`** (v9 pairs with r3f v8), **@react-three/postprocessing `^2.16.3`**
  (bloom), plus **motion `^12.42.0`** (imported from **`motion/react`**) for the DOM HUD. Dev-deps
  `@types/three`, `@types/react@^18`, `@types/react-dom@^18`. `next.config.mjs` sets
  `transpilePackages: ["@gt100k/cohort-arena-view","@gt100k/cohort-compiler"]`. The r3f `<Canvas>` is loaded
  **client-only** via `next/dynamic(..., { ssr:false })`. App `tsconfig.json` mirrors `apps/student-compass`
  (`jsx: preserve`, `noEmit`, `composite:false`, DOM libs). `.env.local.example` with non-secret
  `NEXT_PUBLIC_*` placeholders; `.env.local` git-ignored. *(React-19 + r3f v9 + drei v10 is the documented
  future upgrade path — DP-UI-8 — but React 18 is pinned here for consistency with the rest of the repo.)*

**UI commands:**

```bash
pnpm --filter @gt100k/cohort-arena-view test    # pure view unit + golden tests (Vitest)
pnpm --filter @gt100k/cohort-arena dev          # run the Viewer (r3f/three canvas + HUD)
pnpm --filter @gt100k/cohort-arena build        # next build — the UI acceptance gate
```

> **UI loop gate** = `pnpm typecheck` + `pnpm test` (view package) **plus** `pnpm --filter
> @gt100k/cohort-arena build` + the seeded app smoke + the [quickstart](./quickstart.md) walkthrough. The
> root `build` script (student-compass) is **not** modified; the Viewer builds via its own filter.

**Seeded app smoke (green from the first UI app increment).** A tiny Playwright/HTML smoke loads `/`, waits
for a `<canvas>` to mount, asserts **zero console errors and zero WebGL errors**, toggles reduced-motion,
and confirms the Cohort Ledger is present and focusable (SC-014/SC-015). The view package also ships a
seeded `test/smoke.test.ts` importing the entrypoint + asserting a golden fixture builds, so `pnpm test`
stays green from the first P7 increment.

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
- The repo is **public**; `.env`/`.env.*` are git-ignored (`!.env.example`). The **domain** needs **no**
  `.env.local` — `pnpm typecheck`/`pnpm test` succeed with an empty environment. Do not add env-dependent
  code paths.
- No machine-specific absolute paths in code or fixtures (ENG rule).
- **UI app:** the Viewer needs **no secrets** and **no network**. Commit `apps/cohort-arena/.env.local.example`
  with non-secret public placeholders and keep `.env.local` git-ignored; the app reads only `NEXT_PUBLIC_*`
  with safe defaults so `next build` never fails on missing env. Fonts fall back to a system stack (no
  fetch); all data is synthetic/injected.

```dotenv
# apps/cohort-arena/.env.local.example
NEXT_PUBLIC_COHORT_ARENA_SEED=42
NEXT_PUBLIC_REDUCED_MOTION_DEFAULT=system   # system | on | off
NEXT_PUBLIC_DEFAULT_AGE_BAND=9-11           # 6-8 | 9-11 | 12-14
```

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

### UI Pre-marked Decision Points

- **DP-UI-1 — 3D engine. ✅ Settled: react-three-fiber `^8.17.10` + drei `^9.114.0` + three `^0.169.0`
  (+ @react-three/postprocessing `^2.16.3`), WebGL2, client-only.** The vision is a genuinely 3D "Compiler
  Observatory" with depth, parallax, volumetric field drift, hexagonal crystallization, lit constraint rings,
  and a 3D arena seat-ring (D-UI-1). r3f gives declarative three.js + drei helpers with clean React
  lifecycle/dispose; three.js `useFrame` owns 3D motion. On WebGL2 loss / weak device the app degrades to the
  **2D tier** (`project2D` DOM/SVG) + Ledger (FR-041). Bare three.js (no r3f) is acceptable **only** with a
  documented reason. `severity: low`.
- **DP-UI-2 — DOM animation lib. ✅ Settled: `motion@^12.42.0` (imported from `motion/react`).** Chosen for
  FLIP/shared-layout animation (cohort membership changes) + first-class `useReducedMotion`. **motion@^12 owns
  DOM motion; three.js `useFrame` owns 3D motion — no third animation library.** `severity: low`.
- **DP-UI-3 — Fonts (no-fetch).** *Default:* the system-stack fallback in `TYPOGRAPHY` (Space Grotesk / Inter
  / JetBrains Mono → system-rounded/mono fallbacks); self-hosted subset `woff2` under `public/fonts/` is an
  optional, non-breaking upgrade; in-scene text uses drei `<Text>`/`<Html>` over the same tokens. `severity: low`.
- **DP-UI-4 — 3D layout constants (`LAYOUT`).** *Default:* the pinned 3D `WORLD`/`CAMERA`/hex/bench/field/ring
  geometry + the pure `project2D` ([§ UI Golden Values](#ui-golden-values--constants)). Changing them changes
  golden Fixtures V1/V3, so keep them for the golden tests. `severity: low` — tunable; determinism (exact
  `{x,y,z}` and projected `{x,y}`) is the fixed invariant.
- **DP-UI-5 — Motion tokens/easings (`MOTION`/`EASINGS`).** *Default:* the pinned registries + the 19-kind
  reduced-motion table (Fixture V4). `severity: low` — tunable; the *rule* (every kind has a reduced-motion
  equivalent, frequent actions are instant, no `scale(0)`/`ease-in`/shake, calm follow-free camera) is **fixed**.
- **DP-UI-6 — Age-band presentation.** *Default:* `resolveVisualBand` labels/marker-scale/celebration-ceiling
  per band; underlying state identical (`plainViewEquals`). `severity: low`.
- **DP-UI-7 — Root `tsconfig.json` references (the single shared-file touch).** *Default:* the **final** UI
  task adds `packages/cohort-arena-view` (and confirms the domain dirs) to `references` in its own commit.
  `severity: critical` — the only shared-file edit; keep it isolated. *(Supersedes DP-6's scope to also list
  the view package.)*
- **DP-UI-8 — React major version for the app.** *Default:* **React 18.3.1** with r3f v8 / drei v9 (matches
  `apps/student-compass` and the rest of the repo). The documented future upgrade is **React 19 + Next 15 +
  @react-three/fiber v9 + @react-three/drei v10** (a single lockfile transaction: fiber v9 → drei v10 → React 19).
  `severity: low` — do not bump unless the repo moves to React 19 wholesale; the pure view package and all
  golden values are React-version-independent.

## Assumptions

- **Pure-TS solver for the MVP**: the buildable definition of done is `tsc -b` + Vitest, so the optimizer is a **pure-TS greedy + local-search/repair** heuristic that produces *feasible, hard-constraint-honoring* cohorts and ranks them by the deterministic soft objective. It is **not** a globally optimal solver — **OR-Tools CP-SAT / branch-and-price** is the deferred production optimizer (PRD §15). "Correct" for this slice = feasible + all hard constraints honored + deterministic, not provably optimal.
- **Pure-TS caliper filter for the MVP**: candidate generation is a deterministic level+velocity distance filter / kNN over the in-memory pool. **HNSW** (the production ANN) is deferred behind the `CandidateIndex` port (PRD §15).
- **Media plane deferred to a stub**: RivalryMix operates on arrays of already-extracted turn events. Real-time capture (WebRTC/AudioWorklet/Rust-WASM) and the **LiveKit** SFU media plane (§15.1) are **deferred** to a `MediaTurnSource` stub port; the §15.1/§15.2 latency and scale SLOs (feature-to-guide-screen <250 ms p95; 20,000 rooms; join/reconnect budgets) are **production targets**, not MVP gates (pure logic is not latency-bound).
- **Level/velocity bands are given**: the private ratings that drive matchmaking are synthetic inputs to this slice; how they are computed (from mastery/velocity signals) is external (PRD §12/§15). This feature consumes them, it does not compute them.
- **Individual non-harm floor is a modeled per-learner threshold over a REAL, caliper-independent signal**: for the synthetic slice the per-learner benefit is a **deterministic composite** of accommodation compatibility, prior-pairing history, and pace/role fit (pinned formula + weights above; **injectable** via `benefitOf`) — chosen precisely because these factors are **independent of the level/velocity caliper**, so the floor can actually bind (a level/velocity-derived floor never would, since the caliper already bounds those dimensions). It is **not** a learned causal-uplift estimate (which stays shadow, FR-019). The weights/floor value are tunable config; the *invariant* (hard, per-learner, never averaged away; signal independent of the caliper) is fixed here.
- **Bounded automation envelope**: an in-budget cohort repair may auto-apply (bounded automation, §8.5) but always with a guide-veto window and one-click rollback; anything beyond the churn budget or a group-size change requires a recorded human exception. No irreversible, identity-defining move is automated.
- **Shadow causal-uplift**: the `BenefitEstimator` port exists only to prove the seam and the post-lock-only logging discipline; it returns a placeholder LCB and is never read during a solve/repair (Constitution III; §15).
- **Synthetic-only, governance stubbed**: no real learners, consent, media, or safeguarding case management; the safeguarding sink is an in-memory human-queue stub. Rights/authority limits still bind (Constitution I/III/V/VIII/IX; G4/G6/G7): no caste ranks, safeguarding bypass, one active assignment, aggregated peer views, no learned-model assignment.
- **Parallel-safety**: all code lives in new directories (`packages/cohort-compiler`, `adapters/cohort-*`, and the UI dirs `packages/cohort-arena-view`, `apps/cohort-arena`). The workspace glob (`packages/*`, `adapters/*`, `apps/*`) and the Vitest include (`packages/**/test`, `adapters/**/test`) already discover the packages/adapters, and `biome check packages adapters apps` already lints the new dirs, so no shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) needs editing. The only shared-file touch is adding project references to the root `tsconfig.json`, deferred to the final task for a human to reconcile at merge.
- **UI reads the domain, never writes it**: `packages/cohort-arena-view` depends on `@gt100k/cohort-compiler` read-only and composes a display view; it computes **no** cohort assignment and issues **no** consequential decision (the compiler already owns the bounded-automation envelope, FR-017). The Viewer is guide/ops-facing observation (PRD §9.2), distinct from the child-facing Arena game world (feature 004).
- **UI is verified by `next build`, domain by Vitest**: the pure view package is unit-tested; the app carries no rendering into the pure tests, so frame-rate/60fps is an acceptance target validated by `next build` + the quickstart walkthrough, not a unit test (mirrors feature 004).
