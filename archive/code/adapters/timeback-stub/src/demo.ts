import {
  GT_CONFIG,
  STANDARD_CONFIG,
  applyFocusedTime,
  evaluateGate,
  newDay,
  totalXp,
} from "@gt100k/learning-loop";
import type { LoopConfig } from "@gt100k/learning-loop";
import { makeStubSource } from "./index";

/**
 * Headless demo of the daily learning loop against the TimeBack stub (quickstart.md).
 * Run: pnpm --filter @gt100k/timeback-stub demo
 */
async function runDemo(label: string, config: LoopConfig): Promise<void> {
  console.log(`\n=== ${label} (daily goal ${config.dailyGoalXp} XP) ===`);
  let day = newDay("demo-learner", "2026-07-20", config);
  const source = makeStubSource(config, { favorite: "math" });

  let record = await source.next();
  while (record !== null) {
    const wasUnlocked = day.projectUnlocked;
    day = applyFocusedTime(day, record);
    if (!wasUnlocked && day.projectUnlocked) {
      console.log(
        `  🔓 project time UNLOCKED at ${record.id} (${day.unlockedAt}), total ${totalXp(day.xpBySection)} XP`,
      );
    }
    record = await source.next();
  }

  const gate = evaluateGate(day);
  console.log(`  final XP: ${JSON.stringify(day.xpBySection)} (total ${totalXp(day.xpBySection)})`);
  console.log(
    `  unlocked: ${day.projectUnlocked}; beyond-floor: ${JSON.stringify(gate.beyondFloorBySection)}`,
  );
}

async function main(): Promise<void> {
  await runDemo("Standard cohort", STANDARD_CONFIG);
  await runDemo("GT cohort", GT_CONFIG);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
