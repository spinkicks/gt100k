# Contract: `@gt100k/learning-loop` domain interface

This slice exposes no external HTTP/network API; its "contract" is the public interface of the pure domain package plus the input record shape. All functions are pure over injected state (no I/O, no wall-clock reads).

## Types

See [data-model.md](../data-model.md) for `Section`, `LoopConfig`, `FocusedLearningRecord`, `DailyProgress`, `GateResult`.

## Public functions

```text
newDay(learnerRef, day, config) -> DailyProgress
  Precondition:  config valid (data-model validation).
  Postcondition: FRESH state; xpBySection all 0; projectUnlocked=false; config snapshotted.

applyFocusedTime(progress, record) -> DailyProgress
  Precondition:  record.minutes > 0; record.section ∈ Section.
  Behavior:      if record.id ∈ progress.appliedRecordIds → return progress unchanged (idempotent).
                 else add record.minutes XP to that section (1 min = 1 XP), record the id,
                 recompute projectUnlocked/unlockedAt.
  Postcondition: totalXp increases by exactly record.minutes on first application only.

evaluateGate(progress) -> GateResult
  Pure read: unlocked = total ≥ dailyGoalXp AND every section ≥ its floor;
  returns remainingTotalXp, remainingBySection, beyondFloorBySection.

rollToDay(progress, nextDay, config) -> { history: DailyProgress, next: DailyProgress }
  Postcondition: `history` is the finalized prior day; `next` is FRESH for nextDay.
```

## Ports (implemented by adapters, injected)

```text
interface DailyProgressRepository {
  load(learnerRef, day) -> DailyProgress | null
  save(progress) -> void            // upsert by (learnerRef, day)
  history(learnerRef) -> DailyProgress[]   // for reconstruction (FR-011, SC-005)
}

interface Clock { today() -> date }        // injected so the core stays deterministic

interface FocusedTimeSource {               // the TimeBack stub implements this
  next() -> FocusedLearningRecord | null
}
```

## Contract test obligations (map to FR/SC)

- `applyFocusedTime`: N focused minutes ⇒ +N XP in that section (FR-001); re-applying same id ⇒ no change (FR-010, SC-002).
- `evaluateGate`: locked until total **and** all floors met; stays locked if total met but a section is below floor (FR-005, edge: imbalance).
- config swap standard↔GT changes only goals/floors, no code change (SC-003).
- `rollToDay`: resets counters, preserves prior day in `history` (FR-006, FR-011, SC-005).
- unlock never occurs before both conditions hold (SC-001).
