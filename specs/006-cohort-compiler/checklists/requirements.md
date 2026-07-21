# Specification Quality Checklist: Cohort Compiler + RivalryMix

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-20
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details leak into the spec's requirements (the pure-TS/greedy/kNN choices live in plan.md/research.md as the chosen approach, not in the FRs)
- [x] Focused on user value and rights guarantees (fair near-peer cohorts, safeguarding, no caste ranks, observable-only analysis)
- [x] Written for non-technical stakeholders (user stories + acceptance scenarios)
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable (SC-001…SC-008)
- [x] Success criteria are technology-agnostic (counts/percentages, not APIs)
- [x] All acceptance scenarios are defined (per user story)
- [x] Edge cases are identified (non-divisible pools, infeasible learners, non-harm-vs-group, churn boundary, atomic-commit failure, safeguarding mid-solve, zero/one turn, ambiguous overlap, shadow LCB)
- [x] Scope is clearly bounded (three capabilities; deferred targets named)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows (candidate gen → compile → commit/rollback/repair → safeguarding → RivalryMix)
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] Each user story is independently testable (US2/US3 testable against synthetic inputs without US1 running)

## Constitution Alignment (GT100K)

- [x] **No fixed-ability caste ranks** (G6): private level/velocity bands are matchmaking inputs only; no caste rank / public full-field ranking derived (FR-006; Constitution VIII/IX)
- [x] **Safeguarding bypass**: bullying/coercion/exclusion reports bypass optimization → human sink; pause conflicting moves (POL-007); never reduce a rating (FR-018; §15.2; Constitution I/IX)
- [x] **Individual non-harm floor** is a hard per-learner constraint, never averaged away; shadow forecasts can't override child reports (FR-009; §15.2)
- [x] **No learned-model assignment**; peer-effect causal uplift stays shadow, logged post-lock only (FR-019; Constitution III; §15)
- [x] **Human authority / bounded automation**: in-budget repair is reversible bounded automation with a guide-veto window; over-budget/size changes need a recorded staff exception (FR-010/FR-016/FR-017; §8.5; Constitution I)
- [x] **Accessibility**: accommodations are a hard constraint; no accommodation penalty; no protected-attribute proxy in matchmaking (FR-007; Constitution VI)
- [x] **Privacy/synthetic-only**: pseudonymous refs, no PII/consent/media; peers get aggregated health data only (FR-026; Constitution V; G7)
- [x] **RivalryMix rights**: observable-only, no honesty/emotion/personality/motivation inference; low-quality input suppresses rather than mislabels; refused/missing never penalizes (FR-022/FR-023/FR-024; §15; G4/G5)

## Scope & Deferral Discipline (production direction, PRD §15/§15.1)

- [x] Genuinely-hard parts deferred as **marked ports/stubs**, not silently omitted: **HNSW** ANN (behind `CandidateIndex`), **OR-Tools CP-SAT / branch-and-price** (greedy+repair stands in), **WebRTC/AudioWorklet + LiveKit** media plane (`MediaTurnSource` stub), **peer-effect causal uplift** (`BenefitEstimator` shadow), **PostgreSQL** commit (in-memory atomic commit behind `CohortRepository`)
- [x] Deferrals are the production direction for the synthetic beta and do not block the buildable slice
- [x] The §15.1/§15.2 media latency & scale SLOs are documented as production targets, not MVP gates
- [x] MVP is explicitly called out (Setup + Foundational + US1 = near-peer candidate generation)

## Parallel-Safety (merge hygiene)

- [x] All feature code lives in new dirs (`packages/cohort-compiler`, `adapters/cohort-*`)
- [x] No shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) requires editing (existing globs discover the new dirs)
- [x] The single shared-file touch (root `tsconfig.json` references) is isolated as the final task and flagged for human reconciliation

## Notes

- **Buildable-MVP scope**: "correct" for the solver slice = feasible + all hard constraints honored + deterministic, **not** provably optimal (CP-SAT deferred). The greedy+repair heuristic must never emit a hard-constraint violation; the soft objective only ranks feasible options.
- **Level/velocity bands are inputs**: how the private ratings are computed (from mastery/velocity signals, PRD §12/§15) is external to this feature; the slice consumes them.
- **Individual non-harm floor is deterministic here**: modeled as a per-learner compatibility/benefit threshold from observable features — **not** a learned causal-uplift estimate (which stays shadow, FR-019). The floor formula is an implementation detail; its invariant (hard, per-learner) is fixed.
- **Standings display is elsewhere**: the near-peer/opt-in/no-bottom-rank *visible standings* surface lives in the Arena feature (`004-arena-game-world`); this feature owns the private matchmaking ratings and the compiler, and must not emit a caste rank (G6).
- **Open question (non-blocking)**: exact caliper tolerances, churn cap, objective weights, and RivalryMix thresholds are tunable config with documented synthetic defaults; any values satisfy the FRs as long as the invariants hold and behavior is deterministic.
