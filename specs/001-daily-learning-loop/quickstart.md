# Quickstart: Daily Learning Loop (validation guide)

How to prove the slice works end-to-end once implemented. Implementation code lives in tasks.md / the code itself — this is a run/validation guide only.

## Prerequisites

- Node.js LTS + pnpm installed.
- Repo bootstrapped: `pnpm install` at the repo root (pnpm workspace).

## Run the tests (primary validation)

```bash
pnpm test            # Vitest across the workspace
pnpm --filter @gt100k/learning-loop test   # domain unit + contract tests only
```

**Expected**: all contract-test obligations in [contracts/learning-loop.md](./contracts/learning-loop.md) pass — XP accrual, idempotency, hybrid gate (including the imbalance edge case), config swap, and day rollover.

## Run the demo loop (synthetic learner)

```bash
pnpm --filter @gt100k/timeback-stub demo    # feeds synthetic focused-time records through the loop
```

**Expected outcome** (standard config, 120 total / 30 per section / floor = goal):
1. As records feed in, each section's XP rises (1 min = 1 XP).
2. Project time stays **locked** while any section is below its floor — even once total XP ≥ 120.
3. When every section clears its floor **and** total ≥ 120, project time **unlocks** and `unlockedAt` is set.
4. Switching the stub to the **GT** config (raised goal/floors) only lengthens time-to-unlock — no code change.
5. Rolling to the next day resets counters; the prior day is retrievable via `repository.history()`.

## View it (optional, US3)

```bash
pnpm --filter @gt100k/student-compass dev   # Next.js day view
```

**Expected**: the day view shows per-section XP vs. goal, total vs. daily goal, per-section "beyond floor" (engagement signal), and the lock/unlock state, updating as the synthetic feed runs.

## Success criteria mapping

- SC-001 unlock-only-when-both-conditions → demo steps 2–3 + gate contract tests.
- SC-002 accurate/idempotent XP → domain tests.
- SC-003 standard↔GT by config → demo step 4.
- SC-004 runs with no consent/admissions/legal workflow → the demo needs none.
- SC-005 reconstruct per-day history → `repository.history()` + rollover test.
