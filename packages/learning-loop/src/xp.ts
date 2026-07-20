import { evaluateGate } from "./gate";
import type { DailyProgress, FocusedLearningRecord } from "./model";

/**
 * Apply a focused-learning record to a day's progress (spec FR-001, FR-002, FR-010).
 * - 1 focused minute = 1 XP in the record's section.
 * - Idempotent: re-applying a record with an already-seen id returns the input unchanged.
 * - Recomputes the hybrid-gate unlock; once unlocked the day stays unlocked and `unlockedAt`
 *   is set to the record that first crossed the gate.
 * Pure: returns a new DailyProgress, never mutates the input.
 */
export function applyFocusedTime(
  progress: DailyProgress,
  record: FocusedLearningRecord,
): DailyProgress {
  if (!Number.isInteger(record.minutes) || record.minutes <= 0) {
    throw new Error(`record.minutes must be a positive integer, got ${record.minutes}`);
  }
  if (progress.appliedRecordIds.includes(record.id)) {
    return progress; // idempotent no-op
  }

  const next: DailyProgress = {
    ...progress,
    xpBySection: {
      ...progress.xpBySection,
      [record.section]: progress.xpBySection[record.section] + record.minutes,
    },
    appliedRecordIds: [...progress.appliedRecordIds, record.id],
  };

  if (!next.projectUnlocked && evaluateGate(next).unlocked) {
    next.projectUnlocked = true;
    next.unlockedAt = record.occurredAt;
  }

  return next;
}
