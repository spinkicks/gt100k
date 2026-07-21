# Implementation Plan: Cohort Compiler + RivalryMix

**Branch**: `006-cohort-compiler` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-cohort-compiler/spec.md`

> **Loop-readiness.** `spec.md` is the loop-ready source of truth: it carries the hard
> [Scope Fence](./spec.md#scope-fence), the ordered [Phasing P0–P11](./spec.md#phasing-p0p11),
> machine-checkable [Success Criteria mapped to tests](./spec.md#success-criteria-mandatory), exact
> [Golden Values & Seed Fixtures](./spec.md#golden-values--seed-fixtures), [Decisions Already
> Made](./spec.md#decisions-already-made), the [Defaults for the Unspecified](./spec.md#defaults-for-the-unspecified)
> rule, [pinned Stack & Commands](./spec.md#stack--commands-pinned), and [Pre-marked Decision
> Points](./spec.md#pre-marked-decision-points). This plan and `tasks.md` stay consistent with it.

## Summary

Build the code-first core of GT100K's **Cohort Compiler + RivalryMix** (PRD §15, §15.1, §15.2) as a **pure, framework-agnostic TypeScript domain package** (`packages/cohort-compiler`), mirroring `packages/learning-loop` / `packages/evidence-graph`. Three capabilities: (1) **near-peer candidate generation** by a level+velocity **caliper** (a pure-TS deterministic kNN/distance filter; **HNSW** deferred behind a port); (2) a **cohort-assignment solver** that forms stable **cohorts of six** under **hard constraints** — age, schedule, safeguarding separation, accommodations, level-velocity caliper, an **individual non-harm floor**, and a **churn budget** — via a pure-TS **greedy + local-search/repair** heuristic (**OR-Tools CP-SAT / branch-and-price** deferred), returning a `CohortAssignment` **snapshot** with **atomic in-memory commit + rollback**, **one active assignment per learner**, a **weekly churn cap**, and **cohort repair within the churn budget**; and (3) a pure-logic **RivalryMix turn-taking analysis** that detects **observable** patterns (dominance, repeated interruption) but **cannot** infer honesty/emotion/personality/motivation and **suppresses prompts** under low-quality input (**WebRTC/AudioWorklet + LiveKit** media plane deferred to a stub port). All I/O sits behind ports — `CandidateIndex`, `CohortRepository`, `SafeguardingSink`, plus deferred/shadow stub ports `MediaTurnSource` and `BenefitEstimator` — with in-memory/stub adapters under `adapters/cohort-*`, so the domain stays deterministic and 100% unit-testable. Guardrails are encoded, not asserted: **no fixed-ability caste ranks** (G6), **bullying/exclusion bypasses optimization to safeguarding**, **no learned model assigns**, **peer-effect causal uplift stays shadow**. Synthetic-only.

**UI layer (this expansion — P7–P11).** On top of the finished domain, add a **beautiful, mission-control-grade, guide/ops-facing Cohort & Arena Viewer** (PRD §9.2 Guide/Ops consoles; §15/§15.3): a **pure view-model package** `packages/cohort-arena-view` (`@gt100k/cohort-arena-view`) that reads the committed `@gt100k/cohort-compiler` API read-only and composes a single deterministic **`CohortArenaView`** (with exact 3D `LAYOUT` + a pure `project2D`), plus a **Next.js App-Router app** `apps/cohort-arena` (`@gt100k/cohort-arena`) rendering it as a **3D "Compiler Observatory"** on **react-three-fiber + drei + three.js (WebGL2)** for the two spatial surfaces (a 3D **cohort-formation choreography** — learner-stars drift in a caliper field then crystallize into hexagonal cohorts of six with lit constraint rings + non-harm-floor halos — and a **3D RivalryMix arena room** seat-ring) and **DOM + motion@^12** (`motion/react`) for the HUD (cohort cards with FLIP layout animation, satisfied-constraint badges, the non-harm floor readout, the **opt-in gain-based standings**, the churn meter, rollback, and the **safeguarding-bypass** affordance) and the accessible **Cohort Ledger**. One view model drives every renderer (parity by construction) across three tiers: the **full 3D tier**, a **2D tier** (a pure `project2D` DOM/SVG rendering for reduced-motion / plain / weak devices / WebGL loss), and the **Ledger**; reduced motion is a first-class **equal** mode (the calm 2D/static tier); 60fps with graceful degradation; WCAG 2.2 AA via the Ledger (3D canvas `aria-hidden`); **no caste/bottom-rank, no dark patterns, no emotion/trait labels** — guardrails structural, not asserted. The domain package is **not modified**. The view package is unit-tested (Vitest); the app is verified by `next build` + a seeded smoke.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js LTS (per PRD §26.1). `tsconfig.base.json` with `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite` (inherited).

**Primary Dependencies**: None in the domain package (pure TS). pnpm workspaces + Vitest + Biome + `tsc -b` (existing factory gate). No OR-Tools, no HNSW library, no WebRTC/LiveKit — all deferred. **UI layer**: `packages/cohort-arena-view` depends on `@gt100k/cohort-compiler` (`workspace:*`) only (pure TS); `apps/cohort-arena` adds **Next.js `^14.2.15`** + **React/React-DOM `^18.3.1`** (match `apps/student-compass`), the **3D stack** **three `^0.169.0`** + **@react-three/fiber `^8.17.10`** (v8 pairs with React 18) + **@react-three/drei `^9.114.0`** + **@react-three/postprocessing `^2.16.3`** (WebGL2 canvas, client-only), and **motion `^12.42.0`** (`motion/react`, HUD/FLIP animation). No other runtime deps; no media/WebRTC/network.

**UI project type**: A pure view-model **package** (`packages/cohort-arena-view`, unit-tested by Vitest — the existing `packages/**/test` glob discovers it) + a **Next.js App-Router app** (`apps/cohort-arena`, verified by `next build` + a seeded smoke; **not** in the Vitest globs, mirroring feature 004). One `CohortArenaView` drives the **3D react-three-fiber canvas**, the **DOM + motion@^12 HUD**, the **2D-tier `project2D` rendering** (reduced-motion / weak-device / WebGL loss), and the accessible Cohort Ledger.

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

### Constitution re-check — UI layer (P7–P11)

The Viewer is a **guide/ops observation surface** (PRD §9.2), not a new decision-maker; it re-uses the domain's guardrails and adds display-only ones. Re-checked:

| Principle | Status | UI note |
|---|---|---|
| I. Human authority | ✅ Pass | The Viewer **observes**; it issues no consequential decision (FR-046). Churn/rollback/safeguarding are display of the domain's bounded-automation envelope (FR-034/FR-038). |
| II. Child assent & veto | ✅ Aligned | Standings are **opt-in (default off)**; turning them off (or plain mode) changes nothing (FR-035/FR-036). |
| V. Privacy follows purpose | ✅ Pass | Synthetic-only, pseudonymous refs, no PII/media/network; peers anonymized; app fetches nothing (FR-042). |
| VI. Accessibility | ✅ Pass (enforced) | WCAG 2.2 AA via the Cohort Ledger; reduced motion a first-class **equal** mode; color never the sole cue (FR-039/FR-040/FR-045). |
| VIII. Bounded motivational pressure | ✅ Pass (enforced) | **No caste rank, no bottom-rank** — structural: `StandingsView` cannot carry `rank`/`position`/`percentile`/`outOf` (FR-035, SC-012/SC-017). |
| IX. Prohibited product behavior | ✅ Pass (enforced) | No purchase/gacha/loss/decay/FOMO/engagement-timer (FR-043); bullying/exclusion renders the **bypass-to-safeguarding** affordance, never mutating a standing/rating (FR-038); RivalryMix view cannot carry an emotion/trait label (FR-037, SC-013). |
| ENG (tests-define-done, no secrets, isolation) | ✅ Pass | View unit-tested (Vitest); app `next build` + smoke; new dirs only (parallel-safe); no secrets/env/network. |

No new violations; no Complexity Tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/006-cohort-compiler/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── cohort-compiler.md      # domain API + ports + test obligations (P0–P6)
│   └── cohort-arena-view.md    # UI view-model interface + app acceptance obligations (P7–P11)
├── checklists/
│   ├── requirements.md      # domain spec quality checklist
│   └── ui.md                # UI quality checklist (P7–P11)
└── tasks.md             # Phase 2 (/speckit-tasks) — domain P0–P6 + UI P7–P11
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
    │   ├── benefit.ts               # default benefitOf(m,C): real caliper-INDEPENDENT composite
    │   │                            #   (accommodation compat + prior-pairing history + pace/role fit) (US2)
    │   ├── constraints.ts           # hard-constraint predicates: age/schedule/safeguarding/
    │   │                            #   accommodation/caliper/non-harm-floor (reads injected benefitOf)/churn (US2)
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

### UI source code (P7–P11 — new dirs only)

```text
packages/
└── cohort-arena-view/               # PURE view-model — reads @gt100k/cohort-compiler read-only
    ├── src/
    │   ├── model.ts                 # CohortArenaView, ConstellationView/MoteView/CohortHexView,
    │   │                            #   CohortCardView, StandingsView (NO rank field),
    │   │                            #   ArenaRoomView/SeatView/TurnPatternView (NO emotion/trait field),
    │   │                            #   SafeguardingView, MotionSpec, PresentationView/VisualBand, LedgerView
    │   ├── art.ts                   # PALETTE + TYPOGRAPHY (exact tokens)
    │   ├── motion.ts                # MOTION + EASINGS + resolveMotion (19-kind reduced-motion table)
    │   ├── layout.ts                # LAYOUT (3D) + CAMERA + layoutField + layoutConstellation +
    │   │                            #   layoutArenaRing + project2D (deterministic 3D geometry + 2D projection)
    │   ├── standings.ts             # deriveStandingsView (opt-in; gainToBandTop; no rank/bottom-rank)
    │   ├── rivalry.ts               # buildArenaRoomView (observable-only; suppression veil)
    │   ├── band.ts                  # resolveVisualBand (age band + plain mode; state-identical)
    │   ├── ledger.ts                # buildLedger (accessible DOM structure spec)
    │   ├── view.ts                  # buildCohortArenaView (composes all of the above) + plainViewEquals
    │   └── index.ts                 # public surface
    ├── test/                        # Vitest golden tests (view/layout/motion/standings/rivalry/art/guardrails)
    │   ├── smoke.test.ts            # seeded smoke (green from first P7 increment)
    │   └── fixtures/                # view golden fixtures (V1..V4)
    ├── package.json                 # @gt100k/cohort-arena-view; type module; test: vitest run
    ├── tsconfig.json                # extends ../../tsconfig.base.json (composite)
    └── README.md
apps/
└── cohort-arena/                    # Next.js App Router — the ONLY place three.js/r3f/React/DOM live
    ├── app/
    │   ├── layout.tsx               # root layout + metadata
    │   ├── page.tsx                 # server shell → dynamic(ssr:false) import of the client Viewer
    │   └── globals.css              # PALETTE/TYPOGRAPHY tokens + reduced-motion/-transparency + :focus-visible
    ├── components/
    │   ├── CohortArena.client.tsx   # client Viewer: r3f <Canvas> (dispose on unmount) + HUD + 2D-tier + Ledger
    │   ├── observatory/             # r3f/drei 3D scene: field drift → compile choreography → hex formations;
    │   │                            #   badge rings, non-harm-floor halos, camera, bloom; churn/rollback
    │   ├── arena/                   # r3f/drei 3D RivalryMix seat-ring (pulse, arcs, dominance ring; veil)
    │   ├── tier2d/                  # 2D fallback: project2D DOM/SVG (reduced-motion / weak device / WebGL loss)
    │   ├── hud/                     # DOM + motion@^12: cohort cards (FLIP), badges, standings, churn, safeguarding
    │   └── ledger/                  # accessible Cohort Ledger (role=tree; aria-live)
    ├── public/seed/                 # committed inline SVGs (star/seat/shield/icons); no external fetch
    ├── next.config.mjs              # transpilePackages: [cohort-arena-view, cohort-compiler]
    ├── tsconfig.json                # mirror apps/student-compass (jsx preserve, noEmit, DOM libs)
    ├── package.json                 # @gt100k/cohort-arena; next/react/three/@react-three/*/motion
    ├── .env.local.example           # NEXT_PUBLIC_* placeholders (git-ignored .env.local)
    └── README.md
```

**Structure Decision**: A TS monorepo library (per PRD §26.1) with all Cohort-Compiler rules quarantined in a **pure, side-effect-free `packages/cohort-compiler`** domain package, mirroring `packages/learning-loop`. All I/O (candidate indexing, persistence/commit, safeguarding routing, media capture, benefit estimation) is injected via ports so the core is deterministic and fully unit-testable, and real HNSW / CP-SAT / PostgreSQL / WebRTC+LiveKit / causal-uplift integrations replace the stubs later **without changing domain code**. Go/Rust services (PRD §26.2/§26.3), the media plane, and any app/UI are **not** part of this slice. Time is passed as explicit inputs (no `Clock` port needed) to keep the domain deterministic.

**Parallel-safety**: all new code lives in `packages/cohort-compiler`, `adapters/cohort-*`, and the UI dirs `packages/cohort-arena-view` + `apps/cohort-arena`. The root workspace glob (`packages/*`, `adapters/*`, `apps/*`), the Vitest include (`packages/**/test`, `adapters/**/test`), and `biome check packages adapters apps` already discover the new dirs, so **no** shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) is edited. The **only** shared-file touch is adding composite project references to the root `tsconfig.json` (domain dirs + `packages/cohort-arena-view`); that is the **final task** (P11) and is flagged as the single point a human reconciles at merge. `apps/cohort-arena` is a Next.js app (its own `tsconfig` with `composite:false`, `noEmit`), so it is not a `tsc -b` composite reference — it is verified by `next build`.

**UI structure decision**: mirror feature `004-arena-game-world` — a **pure view-model package** holds every display rule as a deterministic, unit-testable function (so the guardrails are structurally provable, incl. the exact 3D `LAYOUT` and the pure `project2D`) and a **separate Next.js app** is the only place three.js/r3f/React/DOM live. Rendering is split (D-UI-1): **react-three-fiber + drei + three.js (WebGL2)** for the 3D Compiler Observatory + the 3D arena room, **motion@^12 + DOM** for the HUD (FLIP layout animation on cohort membership) and a **2D tier** (`project2D` DOM/SVG) for reduced-motion / weak devices / WebGL loss, plus the Ledger. One `CohortArenaView` drives all renderers (D-UI-3); the 3D canvas is `aria-hidden` and the Cohort Ledger is the AT source of truth (D-UI-4); **three.js `useFrame` owns 3D motion, motion@^12 owns DOM motion — no third animation lib**.

## Phasing & gate (see spec.md § Phasing P0–P11)

The build follows the ordered phases in [spec.md § Phasing](./spec.md#phasing-p0p11). **Domain:** **P0** Setup &
Foundational (scaffold + types + ports + seed fixtures + seeded smoke test) → **P1** near-peer candidate
generation (MVP) → **P2** solver & feasibility → **P3** commit/rollback/one-active/churn → **P4** repair +
safeguarding bypass + shadow benefit → **P5** RivalryMix → **P6** polish. **UI:** **P7** view-model domain
(the pure `cohort-arena-view` package: types + golden constants + `buildCohortArenaView` + presentation
functions + view fixtures) → **P8** app shell + Cohort Constellation (UI MVP) → **P9** gain-based standings +
churn/rollback → **P10** RivalryMix arena room → **P11** safeguarding affordance + a11y + perf + the single
shared-file `tsconfig.json` touch (now also listing `packages/cohort-arena-view`). Each phase ends on a green
gate and maps to specific SCs and golden fixtures.

**Domain gate (pinned commands):** `pnpm install` → `pnpm typecheck` (`tsc -b`, strict) → `pnpm test`
(Vitest) → `pnpm lint` (`biome check`). The seeded smoke test keeps `pnpm test` green from iteration 1.

**UI gate:** the view package rides the same `pnpm typecheck` + `pnpm test` (Vitest globs discover
`packages/cohort-arena-view/test`); the app adds **`pnpm --filter @gt100k/cohort-arena build`** (`next build`)
+ the seeded app smoke (zero console/WebGL errors; canvas mounted; Ledger focusable) + the quickstart
walkthrough. The root `build` script (student-compass) is **not** modified.

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
