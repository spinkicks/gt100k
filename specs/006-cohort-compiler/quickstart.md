# Quickstart: Cohort Compiler + RivalryMix (validation guide)

How to prove the slice works end-to-end once implemented. Implementation code lives in tasks.md / the code itself — this is a run/validation guide only. Synthetic-only; no consent/legal/media workflow is required.

## Prerequisites

- Node.js LTS + pnpm installed.
- Repo bootstrapped: `pnpm install` at the repo root (pnpm workspace).

## Run the tests (primary validation)

```bash
pnpm test                                        # Vitest across the workspace
pnpm --filter @gt100k/cohort-compiler test       # domain unit + contract tests only
```

**Expected**: all contract-test obligations in [contracts/cohort-compiler.md](./contracts/cohort-compiler.md) pass — near-peer candidate generation (within-caliper, self/separation excluded, deterministic + stable hash), feasible cohorts of six with zero hard-constraint violations, atomic commit + rollback with one active assignment per learner, churn-budget enforcement + in-budget repair, safeguarding bypass, no learned-model assignment (shadow benefit LCB post-lock only), and observable-only, confidence-gated RivalryMix analysis.

## Build & lint gate

```bash
pnpm exec tsc -b            # strict typecheck (noUncheckedIndexedAccess, verbatimModuleSyntax)
pnpm exec biome check .     # lint/format
```

**Expected**: `tsc -b` clean and `biome check` clean.

## Walk the end-to-end flow (synthetic pool)

The demo/tests build a synthetic learner pool and exercise the full path:

1. **Generate candidates (US1)**: build a pool of synthetic `LearnerProfile`s with level/velocity bands, age bands, schedules, accommodations, and safeguarding separations; run `generateCandidates(pool, caliper)`. Every candidate is within the level+velocity caliper; self and separated peers are excluded; re-running yields byte-identical sets and the same candidate-set hash. No caste rank / full-field ranking is produced.
2. **Compile cohorts (US2)**: run `assignCohorts(...)` → cohorts of exactly six, each honoring **all** hard constraints (age, schedule, safeguarding separation, accommodations, caliper, individual non-harm floor, churn). Infeasible learners come back as `unassigned` with the binding constraint, never force-placed. The soft objective only ranks feasible options.
3. **Commit + rollback (US2)**: `commit(repo, assignment, churn)` commits the whole roster atomically, retains the prior snapshot, and enforces one active assignment per learner; `rollback(repo, id)` restores the exact prior snapshot. A change beyond the churn budget is refused unless a safety-owner exception is recorded.
4. **Repair (US2)**: `repairCohort(...)` applies an in-budget repair as bounded automation (guide-veto window + one-click rollback); a repair that would exceed the churn budget returns `staffExceptionRequired` and does not auto-apply.
5. **Safeguarding bypass (US2)**: submit a `CohortHealthEvent` (bullying/exclusion) → it bypasses the optimizer, lands in the human `SafeguardingSink`, pauses any conflicting cohort move, and changes no rating.
6. **Shadow benefit (US2)**: `BenefitEstimator.logAfterLock(...)` logs a placeholder benefit LCB **only after** lock; it is never read during a solve/repair.
7. **RivalryMix (US3)**: feed synthetic `TurnEvent[]` to `analyzeTurns(...)` → `dominance` and `repeated_interruption` are flagged with evidence; the output carries **no** honesty/emotion/personality/motivation label; a sparse/low-quality array lowers confidence and suppresses patterns; a refused/missing case changes no status.
8. **Deferred media (§15.1)**: invoking the `MediaTurnSource` stub yields synthetic turns and is clearly marked non-production (WebRTC/LiveKit deferred).

## Success criteria mapping

- SC-001 within-caliper, self/separation-excluded, deterministic candidates + stable hash → `candidates`/`caliper` tests (step 1).
- SC-002 six-member cohorts, zero hard-constraint violations, non-harm floor per-learner → `constraints`/`solver` tests (step 2).
- SC-003 one active assignment; atomic commit; exact rollback; no partial roster → `commit`/`rollback` tests (step 3).
- SC-004 churn budget never silently exceeded; in-budget repair reversible → `commit`/`repair` tests (steps 3–4).
- SC-005 safeguarding bypass to human sink; no rating change → `safeguarding` tests (step 5).
- SC-006 no learned-model assignment; benefit LCB post-lock only → `solver`/`benefit-shadow` tests (steps 2, 6).
- SC-007 observable-only, confidence-gated RivalryMix; refused/missing changes nothing → `rivalrymix` tests (step 7).
- SC-008 adapter swap without domain change; deferred stubs invocable + marked non-production → adapter tests (steps 1, 5, 6, 8).
