/** The four core academic sections (PRD §12; data-model.md). */
export type Section = "math" | "science" | "reading" | "language";

export const SECTIONS: readonly Section[] = ["math", "science", "reading", "language"] as const;

/** Per-section integer map. */
export type SectionXp = Record<Section, number>;

/**
 * Cohort configuration. Distinguishes standard vs GT by goals/floors only — no code fork
 * (spec SC-003). See config.ts for presets.
 */
export interface LoopConfig {
  cohort: string;
  /** Total XP needed for the daily gate (standard 120; GT raised). */
  dailyGoalXp: number;
  /** Per-section XP goal (guidance/target). */
  sectionGoalXp: SectionXp;
  /** Per-section minimum for the hybrid gate (default = goal; may be lower). */
  sectionFloorXp: SectionXp;
}

/**
 * An attributable unit of focused learning that converts to XP (1 minute = 1 XP).
 * `id` is the idempotency key (spec FR-010).
 */
export interface FocusedLearningRecord {
  id: string;
  learnerRef: string;
  section: Section;
  /** Focused minutes only (idle/away excluded upstream). Must be > 0. */
  minutes: number;
  /** ISO timestamp; used for day attribution and unlock timing. */
  occurredAt: string;
}

/** Per-learner, per-day aggregate state (data-model.md). */
export interface DailyProgress {
  learnerRef: string;
  /** Day key, e.g. "2026-07-20". */
  day: string;
  xpBySection: SectionXp;
  /** Applied record ids, for idempotency. */
  appliedRecordIds: string[];
  /** Config snapshotted for the day so later config changes don't corrupt history. */
  dailyGoalXp: number;
  sectionGoalXp: SectionXp;
  sectionFloorXp: SectionXp;
  projectUnlocked: boolean;
  unlockedAt: string | null;
}

/** Result of the hybrid-gate evaluation (value object; not persisted). */
export interface GateResult {
  unlocked: boolean;
  remainingTotalXp: number;
  remainingBySection: SectionXp;
  beyondFloorBySection: SectionXp;
}

export function zeroSectionXp(): SectionXp {
  return { math: 0, science: 0, reading: 0, language: 0 };
}

export function totalXp(xp: SectionXp): number {
  return SECTIONS.reduce((sum, s) => sum + xp[s], 0);
}
