# @gt100k/learning-loop

The pure, framework-agnostic domain for the GT100K **daily learning loop** (spec: `specs/001-daily-learning-loop/`). No I/O, no wall-clock reads — deterministic and fully unit-tested.

## The loop

A learner earns XP for focused learning (**1 focused minute = 1 XP**) across four sections (math, science, reading, language). Project time unlocks via a **hybrid gate**: the daily total XP is met **and** every section clears its configured floor. XP earned *beyond* a section's floor is surfaced as an early engagement/interest signal.

## Public API

```ts
import {
  newDay, applyFocusedTime, evaluateGate, rollToDay,
  STANDARD_CONFIG, GT_CONFIG, makeConfig, SECTIONS, totalXp,
} from "@gt100k/learning-loop";

let day = newDay("learner-1", "2026-07-20", STANDARD_CONFIG);
day = applyFocusedTime(day, { id: "r1", learnerRef: "learner-1", section: "math", minutes: 30, occurredAt: "..." });
const gate = evaluateGate(day); // { unlocked, remainingTotalXp, remainingBySection, beyondFloorBySection }
const { history, next } = rollToDay(day, "2026-07-21", STANDARD_CONFIG);
```

- `applyFocusedTime` is **idempotent** by record `id` (safe under replay / at-least-once feeds) and **pure** (returns new state).
- Configs are data: `STANDARD_CONFIG` (120 XP = 4×30) and `GT_CONFIG` (200 XP = 4×50) differ only in goals/floors — no code fork.

## Ports (implemented by adapters)

`DailyProgressRepository`, `Clock`, `FocusedTimeSource` (see `src/ports.ts`). Current adapters: `@gt100k/repo-memory` (in-memory persistence) and `@gt100k/timeback-stub` (synthetic focused-time feed). Real Postgres / TimeBack integrations replace these without touching the domain.

## Develop

```bash
pnpm --filter @gt100k/learning-loop test   # Vitest unit + contract tests
pnpm typecheck                             # tsc -b (whole workspace)
```
