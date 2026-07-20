# Phase 1 Data Model: Daily Learning Loop

All identifiers are pseudonymous; no real PII (Constitution V; synthetic-only).

## Section (enum)

`math | science | reading | language` — the four core sections.

## LoopConfig

Configuration that distinguishes standard vs GT cohorts (FR-004, FR-005a, SC-003).

| Field | Type | Notes |
|---|---|---|
| `cohort` | string | e.g. `"standard"`, `"gt"` |
| `dailyGoalXp` | int > 0 | standard default 120; GT raised (tuning value) |
| `sectionGoalXp` | map<Section,int> | per-section goal; standard 30 each |
| `sectionFloorXp` | map<Section,int> | hybrid-gate floor per section; default = section goal, may be lower |

**Validation**: every section present; `0 ≤ sectionFloorXp ≤ sectionGoalXp`; `dailyGoalXp ≤ sum(sectionGoalXp)` is *not* required (total can be reachable before all goals).

## FocusedLearningRecord

An attributable unit of focused learning that converts to XP (FR-001, FR-002, FR-010). The idempotency unit.

| Field | Type | Notes |
|---|---|---|
| `id` | string | stable, unique — dedup key |
| `learnerRef` | string | pseudonymous |
| `section` | Section | |
| `minutes` | int > 0 | focused minutes only (idle excluded upstream) |
| `occurredAt` | timestamp | used only for day attribution |

## DailyProgress

Per-learner, per-day aggregate state (FR-003, FR-006, FR-011).

| Field | Type | Notes |
|---|---|---|
| `learnerRef` | string | |
| `day` | date | day-boundary key |
| `xpBySection` | map<Section,int> | accrued XP per section |
| `appliedRecordIds` | set<string> | for idempotency |
| `dailyGoalXp` / `sectionGoalXp` / `sectionFloorXp` | snapshot | config captured for the day (so later config changes don't corrupt history) |
| `projectUnlocked` | bool | derived, persisted for audit |
| `unlockedAt` | timestamp? | when both gate conditions first held |

**Derived**: `totalXp = sum(xpBySection)`. `projectUnlocked = totalXp ≥ dailyGoalXp AND ∀ section: xpBySection[section] ≥ sectionFloorXp[section]`.

### State transitions

```text
FRESH (new day, 0 XP, locked)
  -- applyFocusedTime(record) -->  ACCRUING   (XP rising; still locked)
  -- gate conditions met       -->  UNLOCKED   (projectUnlocked=true, unlockedAt set)
  -- day boundary              -->  FRESH (next day; prior day persisted to history)
```

- Applying a record with an already-present `id` is a no-op (FR-010).
- Once `UNLOCKED`, further XP still accrues (US1 scenario 3, FR-005b) but the day stays unlocked.
- Day rollover preserves the prior `DailyProgress` as history and starts a new one.

## GateResult (value object, not persisted)

Returned by the gate predicate for the day view (US3) and tests.

| Field | Type | Notes |
|---|---|---|
| `unlocked` | bool | |
| `remainingTotalXp` | int ≥ 0 | to reach the daily goal |
| `remainingBySection` | map<Section,int ≥ 0> | to reach each floor |
| `beyondFloorBySection` | map<Section,int ≥ 0> | engagement signal (FR-005b) |
