import type { DailyProgress, FocusedLearningRecord } from "./model";

/**
 * Persistence port for daily progress (contracts/learning-loop.md). Adapters implement it;
 * the domain never talks to storage directly.
 */
export interface DailyProgressRepository {
  load(learnerRef: string, day: string): Promise<DailyProgress | null>;
  save(progress: DailyProgress): Promise<void>;
  /** All recorded days for a learner, for reconstruction (spec FR-011/SC-005). */
  history(learnerRef: string): Promise<DailyProgress[]>;
}

/** Injected clock so the domain stays deterministic (no wall-clock reads in core logic). */
export interface Clock {
  today(): string;
}

/** The TimeBack feed abstraction; the stub adapter implements it. */
export interface FocusedTimeSource {
  next(): Promise<FocusedLearningRecord | null>;
}
