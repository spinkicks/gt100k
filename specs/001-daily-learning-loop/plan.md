# Implementation Plan: Daily Learning Loop

**Branch**: `001-daily-learning-loop` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-daily-learning-loop/spec.md`

## Summary

Build the code-first daily learning loop for a synthetic learner: focused learning time converts to XP (1 min = 1 XP) across four sections; a **hybrid gate** (daily total XP **and** each section's configurable floor) unlocks project time; per-section XP beyond the floor is recorded as a future engagement signal. Approach: isolate the loop's rules as a **pure, framework-agnostic TypeScript domain package** (fully unit-testable), drive it with a **TimeBack stub simulator** that emits focused-time records, persist through a **repository port with an in-memory adapter** (synthetic-only), and surface a minimal **Next.js day view**. No models, no consent/admissions/legal machinery — those are stubbed.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js LTS (per PRD §26.1)

**Primary Dependencies**: Next.js (App Router) for the day view; no backend framework required for this slice (the domain is a plain TS package). pnpm workspaces + Turborepo for the monorepo (PRD §26.1).

**Storage**: In-memory repository for the synthetic slice, behind a `DailyProgressRepository` port so a Postgres adapter can slot in later (PRD §26 stack) without touching domain logic.

**Testing**: Vitest (unit + contract), matching the factory's existing test gate.

**Target Platform**: Local/dev (Node + browser). No cloud/infra in this slice.

**Project Type**: Web application (TS monorepo: `packages/` domain + `apps/` frontend).

**Performance Goals**: Not performance-bound at this stage; domain operations are O(1) per record. Correctness over throughput.

**Constraints**: Pure domain logic (no I/O, no time-of-day reads inside the core — the clock is injected); deterministic and replay-safe (idempotent XP application, FR-010).

**Scale/Scope**: One learner's daily loop; four sections; synthetic data only.

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

| Principle | Status | Note |
|---|---|---|
| I. Human authority over consequential decisions | ✅ N/A | This slice makes no consequential decision and contains no learned model. |
| III. Evidence-class authority ladder | ✅ Pass | No models; nothing to promote. |
| IV. Evidence before authority; deterministic rules | ✅ Pass | The gate is a deterministic rule in code, not a model. |
| V. Privacy follows purpose | ✅ Pass | Synthetic learners only; learner reference is pseudonymous; no real PII, admissions, or sensitive data touched. |
| VII. Durable learning over performance | ✅ Aligned | XP measures focused effort; mastery-estimation is explicitly out of scope (deferred), not faked. |
| VIII. Bounded motivational pressure | ✅ N/A | No pressure mechanics, rivalry, or standings in this slice. |
| ENG (governed flow, tests-define-done, no secrets) | ✅ Pass | Branch→PR→CI, Vitest gate, no secrets/machine paths, synthetic-only. |

**Result: PASS** — no violations, no Complexity Tracking needed. This slice is deliberately inside the safest envelope (synthetic, no models, no rights dials).

## Project Structure

### Documentation (this feature)

```text
specs/001-daily-learning-loop/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (domain API + record/event shapes)
└── tasks.md             # Phase 2 (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
package.json                 # pnpm workspace root + Turborepo
pnpm-workspace.yaml
turbo.json
packages/
└── learning-loop/           # PURE domain — the heart of this slice
    ├── src/
    │   ├── model.ts         # DailyProgress, Section, FocusedLearningRecord types
    │   ├── xp.ts            # applyFocusedTime() — idempotent XP accrual
    │   ├── gate.ts          # hybrid-gate evaluation (total + per-section floor)
    │   ├── day.ts           # day-boundary reset + history preservation
    │   ├── config.ts       # standard vs GT goal/floor config
    │   ├── ports.ts        # DailyProgressRepository + Clock interfaces
    │   └── index.ts
    └── test/                # Vitest unit + contract tests (mirror FR/SC)
adapters/
├── repo-memory/            # in-memory DailyProgressRepository (synthetic)
└── timeback-stub/          # simulator emitting FocusedLearningRecords
apps/
└── student-compass/        # Next.js App Router: the day view (US3)
    └── app/
```

**Structure Decision**: A TS monorepo (per PRD §26.1) with the loop's rules quarantined in a **pure, side-effect-free `packages/learning-loop`** domain package. All I/O (persistence, the TimeBack feed, the clock) is injected via ports, so the core is deterministic and 100% unit-testable, and the real Postgres/TimeBack integrations can replace the stubs later without changing domain code. This matches the PRD's "deterministic services" architecture at slice scale. Go/Rust services (PRD §26.2/§26.3) are **not** needed for this slice and are deferred.

## Complexity Tracking

None — Constitution Check passed with no violations.
