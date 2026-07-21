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

The contract tests assert the **exact golden values** in [spec.md § Golden Values & Seed
Fixtures](./spec.md#golden-values--seed-fixtures) (Fixtures A–E). A seeded smoke test keeps `pnpm test`
green from iteration 1.

**Expected**: all contract-test obligations in [contracts/cohort-compiler.md](./contracts/cohort-compiler.md) pass — near-peer candidate generation (within-caliper, self/separation excluded, deterministic + stable hash), feasible cohorts of six with zero hard-constraint violations, atomic commit + rollback with one active assignment per learner, churn-budget enforcement + in-budget repair, safeguarding bypass, no learned-model assignment (shadow benefit LCB post-lock only), and observable-only, confidence-gated RivalryMix analysis.

## Build & lint gate

```bash
pnpm typecheck             # tsc -b (strict; noUncheckedIndexedAccess, verbatimModuleSyntax)
pnpm lint                  # biome check packages adapters apps
```

**Expected**: `pnpm typecheck` clean and `pnpm lint` clean. `build` (the `student-compass` app) is not
touched by this slice, so the loop gate here is **typecheck + test** (+ lint).

## Walk the end-to-end flow (synthetic pool)

The demo/tests build a synthetic learner pool and exercise the full path:

1. **Generate candidates (US1)**: build a pool of synthetic `LearnerProfile`s with level/velocity bands, age bands, schedules, accommodations, and safeguarding separations; run `generateCandidates(pool, caliper)`. Every candidate is within the level+velocity caliper; self and separated peers are excluded; re-running yields byte-identical sets and the same candidate-set hash. No caste rank / full-field ranking is produced.
2. **Compile cohorts (US2)**: run `assignCohorts(...)` → cohorts of exactly six, each honoring **all** hard constraints (age, schedule, safeguarding separation, accommodations, caliper, individual non-harm floor, churn). The **individual non-harm floor** reads a per-member benefit via an injected `benefitOf` — the default is a real, **caliper-independent** composite (`0.40·` accommodation compatibility `+ 0.35·` prior-pairing history `+ 0.25·` pace/role fit); a cohort is **rejected if ANY** member's benefit `< nonHarmFloor` (default `0.5`), **never** averaged (golden [Fixture B4](./spec.md#fixture-b4-nonharm-default-bind-us2): mean `0.705 ≥ 0.5` but `D6 = 0.43` → rejected). Infeasible learners come back as `unassigned` with the binding constraint, never force-placed. The soft objective only ranks feasible options.
3. **Commit + rollback (US2)**: `commit(repo, assignment, churn)` commits the whole roster atomically, retains the prior snapshot, and enforces one active assignment per learner; `rollback(repo, id)` restores the exact prior snapshot. A change beyond the churn budget is refused unless a safety-owner exception is recorded.
4. **Repair (US2)**: `repairCohort(...)` applies an in-budget repair as bounded automation (guide-veto window + one-click rollback); a repair that would exceed the churn budget returns `staffExceptionRequired` and does not auto-apply.
5. **Safeguarding bypass (US2)**: submit a `CohortHealthEvent` (bullying/exclusion) → it bypasses the optimizer, lands in the human `SafeguardingSink`, pauses any conflicting cohort move, and changes no rating.
6. **Shadow benefit (US2)**: `BenefitEstimator.logAfterLock(...)` logs a placeholder benefit LCB **only after** lock; it is never read during a solve/repair.
7. **RivalryMix (US3)**: feed synthetic `TurnEvent[]` to `analyzeTurns(...)` → `dominance` and `repeated_interruption` are flagged with evidence; the output carries **no** honesty/emotion/personality/motivation label; a sparse/low-quality array lowers confidence and suppresses patterns; a refused/missing case changes no status.
8. **Deferred media (§15.1)**: invoking the `MediaTurnSource` stub yields synthetic turns and is clearly marked non-production (WebRTC/LiveKit deferred).

## Success criteria mapping

- SC-001 within-caliper, self/separation-excluded, deterministic candidates + stable hash → `candidates`/`caliper` tests (step 1).
- SC-002 six-member cohorts, zero hard-constraint violations, non-harm floor per-learner over a caliper-independent benefit (default formula binds in Fixture B4; injected map in B3) → `constraints`/`solver` tests (step 2).
- SC-003 one active assignment; atomic commit; exact rollback; no partial roster → `commit`/`rollback` tests (step 3).
- SC-004 churn budget never silently exceeded; in-budget repair reversible → `commit`/`repair` tests (steps 3–4).
- SC-005 safeguarding bypass to human sink; no rating change → `safeguarding` tests (step 5).
- SC-006 no learned-model assignment; benefit LCB post-lock only → `solver`/`benefit-shadow` tests (steps 2, 6).
- SC-007 observable-only, confidence-gated RivalryMix; refused/missing changes nothing → `rivalrymix` tests (step 7).
- SC-008 adapter swap without domain change; deferred stubs invocable + marked non-production → adapter tests (steps 1, 5, 6, 8).

---

## UI: Cohort & Arena Viewer (guide/ops) — validation (P7–P11)

The Viewer is a new pure view-model package `@gt100k/cohort-arena-view` + a Next.js app `@gt100k/cohort-arena`, built on the committed domain. Synthetic-only; no media/network/secrets.

### Run the view tests (primary UI validation)

```bash
pnpm --filter @gt100k/cohort-arena-view test    # pure view unit + golden tests (Vitest)
pnpm test                                        # (also runs the view tests via the packages/**/test glob)
```

The view tests assert the **exact golden values** in [spec.md § UI Golden Values](./spec.md#ui-golden-values--constants) (Fixtures V1–V4) and the [contracts/cohort-arena-view.md](./contracts/cohort-arena-view.md) obligations: one deterministic `CohortArenaView` drives every renderer; exact constellation/arena-ring layout; the motion registry with a reduced-motion equivalent for every kind; opt-in near-peer standings with **no** rank/bottom-rank field; observable-only RivalryMix with **no** emotion/trait field; a guardrail scan (no `Math.random`, no rank/emotion field, no dark-pattern construct).

### Build & run the app (UI acceptance gate)

```bash
pnpm typecheck                                   # tsc -b (after T136 adds the view-package reference)
pnpm lint                                        # biome check packages adapters apps (covers apps/cohort-arena)
pnpm --filter @gt100k/cohort-arena build         # next build — the UI acceptance/perf gate
pnpm --filter @gt100k/cohort-arena dev           # run the Viewer locally (Pixi + HUD + Ledger)
```

**Expected**: `next build` succeeds with an **empty environment** (no secrets/network); the seeded app smoke loads `/`, mounts a `<canvas>`, and asserts **zero console errors and zero WebGL errors**; toggling reduced-motion shows the static equivalents; the Cohort Ledger is present and keyboard-focusable.

### Walk the UI flow (synthetic)

1. **Compile constellation (UI-US1/US2)**: the app builds a `CohortArenaView` from a synthetic `CohortAssignment` (Fixture B shape) → learner motes flow and **crystallize** into cohorts of six; each cohort card shows six members+roles, all **seven satisfied** hard-constraint badges, and the **non-harm floor line** (`minBenefit ≥ floor`). An unassigned learner rests on the calm "still compiling" bench — never a rejection.
2. **Reduced-motion + Ledger (a11y)**: toggle reduced-motion → the compile becomes an instant snap to settled + an `aria-live` announce; every state is still conveyed. Tab through the **Cohort Ledger** (`role="tree"`) → every cohort/member/role/satisfied-constraint is read out; the canvas is `aria-hidden`.
3. **Standings (UI-US2)**: with standings **opt-in on**, own-growth is celebrated (amber bar-grow + tabular ticker) vs. the near-peer band top (`gainToBandTop`); there is **no** rank and **no** bottom-rank. Turning it off changes nothing.
4. **Churn + rollback (UI-US2)**: the churn meter shows the budget; **rollback** reverse-settles the motes to the prior snapshot with a Ledger diff — **display only**, the domain result is unchanged.
5. **RivalryMix arena room (UI-US3)**: feed `analyzeTurns` output → the seat ring shows the turn-holder pulse, interruption arcs, and a dominance share arc with observable evidence; a low-quality array shows the **"confidence low — prompts suppressed"** veil and **no** pattern — never an emotion/trait label.
6. **Safeguarding (UI-US4)**: a `CohortHealthEvent` renders a firm-not-alarm banner, freezes conflicting moves, and routes to the safeguarding lane — never altering a standing/rating/objective.

### UI success criteria mapping

- SC-009 one deterministic view drives all renderers; `plainViewEquals` → `view` test (steps 1–2).
- SC-010 exact constellation/arena-ring layout → `layout` test (steps 1, 5).
- SC-011 motion registry + reduced-motion equivalent per kind → `motion` test (step 2).
- SC-012 opt-in near-peer standings, no rank/bottom-rank → `standings`/`guardrails` tests (step 3).
- SC-013 observable-only RivalryMix, no emotion/trait field, suppress-not-mislabel → `rivalry`/`guardrails` tests (step 5).
- SC-014 `next build` + client-only Pixi + zero console/WebGL errors + accessible Ledger → build + smoke + a11y walkthrough (steps 1–2).
- SC-015 reduced-motion first-class equal → `motion`/`view` tests + reduced-motion walkthrough (step 2).
- SC-016 safeguarding bypass + churn/rollback display-only → `safeguarding`/`view` tests (steps 4, 6).
- SC-017 no dark pattern / no caste-bottom-rank (structural + scan) → `guardrails` test (steps 3, 5).
- SC-018 exact palette/type/layout tokens + color-never-sole-cue + contrast → `art` test + color-independence walkthrough (steps 1–2).
