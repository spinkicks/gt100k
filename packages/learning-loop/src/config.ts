import { SECTIONS } from "./model";
import type { LoopConfig, Section, SectionXp } from "./model";

function uniform(value: number): SectionXp {
  return { math: value, science: value, reading: value, language: value };
}

/** Standard Alpha cohort: 120 XP/day = 4 × 30; floor = goal. */
export const STANDARD_CONFIG: LoopConfig = {
  cohort: "standard",
  dailyGoalXp: 120,
  sectionGoalXp: uniform(30),
  sectionFloorXp: uniform(30),
};

/**
 * GT cohort: raised target (~3–4 hr / higher XP). 200 XP/day = 4 × 50; floor = goal.
 * The exact number is a tuning value (spec Assumptions), not fixed by the design.
 */
export const GT_CONFIG: LoopConfig = {
  cohort: "gt",
  dailyGoalXp: 200,
  sectionGoalXp: uniform(50),
  sectionFloorXp: uniform(50),
};

/** Throws if the config is malformed (data-model.md validation). */
export function validateConfig(config: LoopConfig): void {
  if (!Number.isInteger(config.dailyGoalXp) || config.dailyGoalXp <= 0) {
    throw new Error(`dailyGoalXp must be a positive integer, got ${config.dailyGoalXp}`);
  }
  for (const section of SECTIONS) {
    const goal = config.sectionGoalXp[section];
    const floor = config.sectionFloorXp[section];
    if (goal === undefined || floor === undefined) {
      throw new Error(`config missing section "${section}"`);
    }
    if (!Number.isInteger(goal) || goal < 0) {
      throw new Error(`sectionGoalXp[${section}] must be a non-negative integer`);
    }
    if (!Number.isInteger(floor) || floor < 0 || floor > goal) {
      throw new Error(`sectionFloorXp[${section}] must be an integer in [0, ${goal}]`);
    }
  }
}

/** Build a config with an optional per-section floor override (cohort tuning). */
export function makeConfig(
  cohort: string,
  dailyGoalXp: number,
  sectionGoalXp: SectionXp,
  sectionFloorXp?: Partial<Record<Section, number>>,
): LoopConfig {
  const floors: SectionXp = { ...sectionGoalXp };
  if (sectionFloorXp) {
    for (const section of SECTIONS) {
      const override = sectionFloorXp[section];
      if (override !== undefined) floors[section] = override;
    }
  }
  const config: LoopConfig = { cohort, dailyGoalXp, sectionGoalXp: { ...sectionGoalXp }, sectionFloorXp: floors };
  validateConfig(config);
  return config;
}
