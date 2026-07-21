# Implementation Plan: Cohort Compiler + RivalryMix

**Branch**: `006-cohort-compiler` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-cohort-compiler/spec.md`

> **Loop-readiness.** `spec.md` is the loop-ready source of truth: it carries the hard
> [Scope Fence](./spec.md#scope-fence), the ordered [Phasing P0–P6](./spec.md#phasing-p0p6),
> machine-checkable [Success Criteria mapped to tests](./spec.md#success-criteria-mandatory), exact
> [Golden Values & Seed Fixtures](./spec.md#golden-values--seed-fixtures), [Decisions Already
> Made](./spec.md#decisions-already-made), the [Defaults for the Unspecified](./spec.md#defaults-for-the-unspecified)
> rule, [pinned Stack & Commands](./spec.md#stack--commands-pinned), and [Pre-marked Decision
> Points](./spec.md#pre-marked-decision-points). This plan and `tasks.md` stay consistent with it.

## Summary

Build the code-first core of GT100K's **Cohort Compiler + RivalryMix** (PRD §15, §15.1, §15.2) as a **pure, framework-agnostic TypeScript domain package** (`packages/cohort-compiler`), mirroring `packages/learning-loop` / `packages/evidence-graph`. Three capabilities: (1) **near-peer candidate generation** by a level+velocity **caliper** (a pure-TS deterministic kNN/distance filter; **HNSW** deferred behind a port); (2) a **cohort-assignment solver** that forms stable **cohorts of six** under **hard constraints** — age, schedule, safeguarding separation, accommodations, level-velocity caliper, an **individual non-harm floor**, and a **churn budget** — via a pure-TS **greedy + local-search/repair** heuristic (**OR-Tools CP-SAT / branch-and-price** deferred), returning a `CohortAssignment` **snapshot** with **atomic in-memory commit + rollback**, **one active assignment per learner**, a **weekly churn cap**, and **cohort repair within the churn budget**; and (3) a pure-logic **RivalryMix turn-taking analysis** that detects **observable** patterns (dominance, repeated interruption) but **cannot** infer honesty/emotion/personality/motivation and **suppresses prompts** under low-quality input (**WebRTC/AudioWorklet + LiveKit** media plane deferred to a stub port). All I/O sits behind ports — `CandidateIndex`, `CohortRepository`, `SafeguardingSink`, plus deferred/shadow stub ports `MediaTurnSource` and `BenefitEstimator` — with in-memory/stub adapters under `adapters/cohort-*`, so the domain stays deterministic and 100% unit-testable. Guardrails are encoded, not asserted: **no fixed-ability caste ranks** (G6), **bullying/exclusion bypasses optimization to safeguarding**, **no learned model assigns**, **peer-effect causal uplift stays shadow**. Synthetic-only.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js LTS (per PRD §26.1). `tsconfig.base.json` with `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite` (inherited).

**Primary Dependencies**: None in the domain package (pure TS). pnpm workspaces + Vitest + Biome + `tsc -b` (existing factory gate). No OR-Tools, no HNSW library, no WebRTC/LiveKit — all deferred.

**Storage**: In-memory `CohortRepository` (atomic commit + prior-snapshot rollback) for the synthetic slice, behind a port so a real PostgreSQL store slots in later without touching domain logic (PRD §15).

**Testing**: Vitest (unit + contract), matching the workspace `vitest.config.ts` include globs (`packages/**/test`, `adapters/**/test`).

**Target Platform**: Local/dev (Node). No cloud/infra/media in this slice.

**Project Type**: TS monorepo library (`packages/` domain + `adapters/` I/O). No app/frontend/media plane in this slice.

**Performance Goals**: Not performance-bound at slice scale; the solver is deterministic over a synthetic pool. Correctness (feasibility + all hard constraints honored) and determinism over throughput/optimality. The §15.1/§15.2 latency & scale SLOs (RivalryMix feature-to-guide-screen <250 ms p95; 20,000 six-person rooms; p95 join <5 s / reconnect <10 s) are **production targets** documented below, **not** MVP gates.

**Constraints**: Pure domain logic — **no I/O, no wall-clock reads, no randomness** (`Math.random` is banned in `packages/cohort-compiler`); time inputs (start/review timestamps, week keys) are explicit parameters so the domain is deterministic and replay-safe. Hard constraints are inviolable; the soft objective only ranks feasible assignments. No learned model issues an assignment (Constitution III).

**Scale/Scope**: A synthetic learner pool (scaled-down stand-in for the §15.2 100k compile), cohorts of six, one weekly churn window; synthetic turn arrays for RivalryMix. Synthetic data only.

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

| Principle | Status | Note |
|---|---|---|
| I. Human authority over consequential decisions | ✅ Pass (enforced) | A cohort change is consequential; the solver **proposes** and commits only within the bounded-automation envelope (in-budget repair with guide-veto window + one-click rollback, §8.5). Beyond the churn budget or a group-size change requires a recorded **staff exception** (FR-010/FR-016/FR-017). Safeguarding holds pause conflicting moves (FR-018, POL-007). |
| II. Child assent & veto | ✅ Aligned | Rivalry exposure is opt-in and refused/missing turn analytics never lower status or create a hypothesis (FR-024, G4); accommodations are honored as a hard constraint (FR-007). |
| III. Evidence-class authority ladder | ✅ Pass (enforced) | **No learned model** issues an assignment (FR-019); peer-effect **causal-uplift** benefit estimation stays **shadow** — logged post-lock only, never read during a solve (FR-019, `BenefitEstimator` stub). |
| IV. Evidence before authority; deterministic rules | ✅ Pass | Every gate is a deterministic rule in code (caliper, hard constraints, soft objective, churn) — no weights, **no randomness** (FR-012/FR-013/FR-027). |
| V. Privacy follows purpose | ✅ Pass | Synthetic-only; refs pseudonymous; peer views receive **aggregated** health data only; no real PII/consent/media (FR-026, G7). |
| VI. Accessibility & non-discrimination | ✅ Pass | Accommodations are a **hard constraint** (FR-007); no protected-attribute proxy enters matchmaking; the individual non-harm floor protects the individual over the group score (FR-009). |
| VIII. Bounded motivational pressure | ✅ Pass (enforced) | **No fixed-ability caste ranks**; private level/velocity bands are matchmaking inputs only (FR-006); rivalry dose is a *soft* term (FR-013); standings guardrails (near-peer/opt-in/no-bottom-rank) live in the Arena surface (feature 004) and are not violated here (G6). |
| IX. Prohibited product behavior (G1/G6) | ✅ Pass (enforced) | **No** caste leaderboard; **no** automated consequential decision beyond the reversible bounded envelope; bullying/exclusion **bypasses optimization** to safeguarding and never lowers a rating (FR-018). |
| ENG (governed flow, tests-define-done, no secrets) | ✅ Pass | Branch→PR→CI; Vitest/Biome/`tsc -b` gate; no secrets/machine paths; synthetic-only; new dirs only (parallel-safe). |

**Result: PASS** — no violations, no Complexity Tracking needed. The deliberate deferrals (HNSW, CP-SAT, WebRTC+LiveKit media plane, causal-uplift) are the **production direction** (PRD §15/§15.1), not synthetic-beta requirements, and are represented by clearly-marked ports/stubs rather than silent omission.

## Project Structure

### Documentation (this feature)

```text
specs/006-cohort-compiler/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── cohort-compiler.md   # Phase 1 output (domain API + ports + test obligations)
├── checklists/
│   └── requirements.md      # spec quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/
└── cohort-compiler/                 # PURE domain — the heart of this feature
    ├── src/
    │   ├── model.ts                 # LearnerProfile, Caliper, CandidateSet, HardConstraints,
    │   │                            #   ObjectiveWeights/Terms, Cohort, CohortAssignment,
    │   │                            #   ChurnBudget, CommitResult, CohortHealthEvent,
    │   │                            #   TurnEvent, TurnAnalysis, BenefitLCB (shadow)
    │   ├── caliper.ts               # near-peer distance + within-caliper predicate (US1)
    │   ├── candidates.ts            # generateCandidates() — deterministic kNN/caliper filter (US1)
    │   ├── constraints.ts           # hard-constraint predicates: age/schedule/safeguarding/
    │   │                            #   accommodation/caliper/non-harm-floor/churn (US2)
    │   ├── objective.ts             # deterministic soft scoring (pace/intensity/role/pair-history/
    │   │                            #   rivalry-dose/churn/repeated-pairings) — ranks feasible only (US2)
    │   ├── solver.ts                # assignCohorts() — greedy construction + local-search/repair (US2)
    │   ├── commit.ts                # atomic commit + rollback + one-active-per-learner + churn cap (US2)
    │   ├── repair.ts                # repairCohort() within churn budget (bounded-automation shape) (US2)
    │   ├── safeguarding.ts          # routeHealthEvent() — bypass optimization → human sink (US2)
    │   ├── rivalrymix.ts            # analyzeTurns() — observable patterns + confidence gating (US3)
    │   ├── ports.ts                 # CandidateIndex, CohortRepository, SafeguardingSink,
    │   │                            #   + deferred/shadow stubs MediaTurnSource, BenefitEstimator
    │   └── index.ts                 # public surface
    ├── test/                        # Vitest unit + contract tests (mirror FR/SC + contracts/)
    │   ├── smoke.test.ts            # seeded smoke test (green from iteration 1; P0)
    │   └── fixtures/                # in-repo seed fixtures + golden values (P0)
    │       ├── caliper-8.ts         # Fixture A (US1)
    │       ├── cohort-12.ts         # Fixtures B / B2 / B3 (US2)
    │       ├── churn-rollback.ts    # Fixture C (US2)
    │       ├── safeguarding-shadow.ts # Fixture D (US2)
    │       └── turns.ts             # Fixture E turns-* (US3)
    ├── package.json                 # @gt100k/cohort-compiler; type module; test: vitest run
    ├── tsconfig.json                # extends ../../tsconfig.base.json (composite)
    └── README.md
adapters/
├── cohort-candidates-memory/        # in-memory kNN/caliper CandidateIndex (HNSW deferred)
├── cohort-repo-memory/              # in-memory CohortRepository (atomic commit + rollback, synthetic)
├── cohort-safeguarding-memory/      # in-memory SafeguardingSink (human queue stub)
├── cohort-media-stub/               # MediaTurnSource STUB (WebRTC/LiveKit deferred) + synthetic turns
└── cohort-benefit-shadow/           # BenefitEstimator SHADOW stub (peer-effect uplift deferred)
```

**Structure Decision**: A TS monorepo library (per PRD §26.1) with all Cohort-Compiler rules quarantined in a **pure, side-effect-free `packages/cohort-compiler`** domain package, mirroring `packages/learning-loop`. All I/O (candidate indexing, persistence/commit, safeguarding routing, media capture, benefit estimation) is injected via ports so the core is deterministic and fully unit-testable, and real HNSW / CP-SAT / PostgreSQL / WebRTC+LiveKit / causal-uplift integrations replace the stubs later **without changing domain code**. Go/Rust services (PRD §26.2/§26.3), the media plane, and any app/UI are **not** part of this slice. Time is passed as explicit inputs (no `Clock` port needed) to keep the domain deterministic.

**Parallel-safety**: all new code lives in `packages/cohort-compiler` and `adapters/cohort-*`. The root workspace glob (`packages/*`, `adapters/*`) and the Vitest include (`packages/**/test`, `adapters/**/test`) already discover them, so **no** shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) is edited. The **only** shared-file touch is adding composite project references to the root `tsconfig.json`; that is the **final task** and is flagged as the single point a human reconciles at merge.

## Phasing & gate (see spec.md § Phasing P0–P6)

The build follows the ordered phases in [spec.md § Phasing](./spec.md#phasing-p0p6): **P0** Setup &
Foundational (scaffold + types + ports + seed fixtures + seeded smoke test) → **P1** near-peer candidate
generation (MVP) → **P2** solver & feasibility → **P3** commit/rollback/one-active/churn → **P4** repair +
safeguarding bypass + shadow benefit → **P5** RivalryMix → **P6** polish + the single shared-file
`tsconfig.json` touch. Each phase ends on a green gate and maps to specific SCs and golden fixtures.

**Gate (pinned commands):** `pnpm install` → `pnpm typecheck` (`tsc -b`, strict) → `pnpm test` (Vitest) →
`pnpm lint` (`biome check`). `build` (the `student-compass` app) is untouched by this slice, so the loop
gate here is **typecheck + test** (+ lint). The seeded smoke test keeps `pnpm test` green from iteration 1.

## Deferred scope (production direction — described here, NOT built in this slice)

| Item | PRD ref | Production direction | Treatment in this slice |
|---|---|---|---|
| Candidate ANN search | §15 | **HNSW** (hierarchical navigable small world) index limits the match space at 100k scale | Pure-TS deterministic **kNN/caliper filter** behind the `CandidateIndex` port; HNSW adapter is a marked seam, not implemented. |
| Cohort optimizer | §15 | **OR-Tools CP-SAT** (constraint-programming SAT) / **branch-and-price** solves under hard constraints + non-harm floor | Pure-TS **greedy construction + bounded local-search/repair** producing feasible, hard-constraint-honoring cohorts; CP-SAT deferred. |
| Roster persistence | §15 | **PostgreSQL** commits a roster as one transaction, stores the prior snapshot for rollback | In-memory `CohortRepository` with **atomic commit + prior-snapshot rollback**; Postgres deferred behind the port. |
| Real-time media plane | §15.1 | **WebRTC/AudioWorklet + Rust/WASM** feature extraction over **LiveKit** SFUs on EKS (coturn, DTLS-SRTP, consent-gated recording); 20k rooms, join <5 s p95 | `MediaTurnSource` **stub port** fed by synthetic turn arrays; no media/infra provisioned. |
| RivalryMix latency/scale SLOs | §15.1/§15.2 | feature-to-guide-screen **<250 ms p95**, 20,000 six-person rooms, reconnect <10 s p95, usable under 5% loss, chaos tests | **Production targets** noted; pure-logic analysis is not latency-bound in the slice. |
| Peer-effect causal uplift | §15 | Learned **causal-uplift** LCB on benefit under network interference (randomized neighbor swaps, solo checkpoints) | `BenefitEstimator` **shadow stub**; a placeholder LCB may be logged **post-lock only** and is never read during a solve/repair (Constitution III). |

## Complexity Tracking

None — Constitution Check passed with no violations.
