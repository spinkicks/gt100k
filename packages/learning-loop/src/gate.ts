import { SECTIONS, totalXp, zeroSectionXp } from "./model";
import type { DailyProgress, GateResult } from "./model";

/**
 * Hybrid unlock gate (spec FR-005): project time unlocks when the daily total XP is met AND
 * every section has cleared its configured floor. Pure read over state — no side effects.
 * Also reports how far each section is from its floor and how far it is BEYOND the floor
 * (an early engagement/interest signal, spec FR-005b).
 */
export function evaluateGate(progress: DailyProgress): GateResult {
  const total = totalXp(progress.xpBySection);
  const remainingBySection = zeroSectionXp();
  const beyondFloorBySection = zeroSectionXp();
  let floorsMet = true;

  for (const section of SECTIONS) {
    const xp = progress.xpBySection[section];
    const floor = progress.sectionFloorXp[section];
    remainingBySection[section] = Math.max(0, floor - xp);
    beyondFloorBySection[section] = Math.max(0, xp - floor);
    if (xp < floor) floorsMet = false;
  }

  return {
    unlocked: total >= progress.dailyGoalXp && floorsMet,
    remainingTotalXp: Math.max(0, progress.dailyGoalXp - total),
    remainingBySection,
    beyondFloorBySection,
  };
}
