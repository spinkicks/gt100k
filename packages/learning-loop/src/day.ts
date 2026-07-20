import { validateConfig } from "./config";
import { evaluateGate } from "./gate";
import { zeroSectionXp } from "./model";
import type { DailyProgress, LoopConfig } from "./model";

/** Start a fresh day for a learner under the given config (spec: day-boundary reset). */
export function newDay(learnerRef: string, day: string, config: LoopConfig): DailyProgress {
  validateConfig(config);
  const progress: DailyProgress = {
    learnerRef,
    day,
    xpBySection: zeroSectionXp(),
    appliedRecordIds: [],
    dailyGoalXp: config.dailyGoalXp,
    sectionGoalXp: { ...config.sectionGoalXp },
    sectionFloorXp: { ...config.sectionFloorXp },
    projectUnlocked: false,
    unlockedAt: null,
  };
  // Degenerate configs (all goals 0) could unlock immediately; evaluate to stay honest.
  if (evaluateGate(progress).unlocked) {
    progress.projectUnlocked = true;
    progress.unlockedAt = day;
  }
  return progress;
}

/**
 * Roll to the next day (spec FR-006, FR-011): finalize the current day as history and return a
 * fresh day. Counters reset; the prior day is preserved for reconstruction.
 */
export function rollToDay(
  progress: DailyProgress,
  nextDay: string,
  config: LoopConfig,
): { history: DailyProgress; next: DailyProgress } {
  return {
    history: { ...progress },
    next: newDay(progress.learnerRef, nextDay, config),
  };
}
