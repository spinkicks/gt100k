import { describe, expect, it } from "vitest";
import {
  GT_CONFIG,
  STANDARD_CONFIG,
  applyFocusedTime,
  newDay,
  rollToDay,
} from "../src/index";
import type { DailyProgress, FocusedLearningRecord, Section } from "../src/index";

let seq = 0;
function add(progress: DailyProgress, section: Section, minutes: number, at = "2026-07-20T11:00:00Z"): DailyProgress {
  const record: FocusedLearningRecord = {
    id: `d${seq++}`,
    learnerRef: progress.learnerRef,
    section,
    minutes,
    occurredAt: at,
  };
  return applyFocusedTime(progress, record);
}

describe("newDay", () => {
  it("starts locked at zero XP", () => {
    const d = newDay("L1", "2026-07-20", STANDARD_CONFIG);
    expect(d.projectUnlocked).toBe(false);
    expect(d.unlockedAt).toBeNull();
    expect(d.dailyGoalXp).toBe(120);
  });
});

describe("unlock timing (SC-001)", () => {
  it("sets unlockedAt to the record that first crosses the gate", () => {
    let d = newDay("L1", "2026-07-20", STANDARD_CONFIG);
    d = add(d, "math", 30);
    d = add(d, "science", 30);
    d = add(d, "reading", 30);
    expect(d.projectUnlocked).toBe(false);
    d = add(d, "language", 30, "2026-07-20T15:30:00Z");
    expect(d.projectUnlocked).toBe(true);
    expect(d.unlockedAt).toBe("2026-07-20T15:30:00Z");
  });
});

describe("rollToDay (FR-006, FR-011, SC-005)", () => {
  it("resets counters for the new day while preserving the prior day as history", () => {
    let d = newDay("L1", "2026-07-20", STANDARD_CONFIG);
    d = add(d, "math", 40);
    const { history, next } = rollToDay(d, "2026-07-21", STANDARD_CONFIG);
    expect(history.day).toBe("2026-07-20");
    expect(history.xpBySection.math).toBe(40);
    expect(next.day).toBe("2026-07-21");
    expect(next.xpBySection.math).toBe(0);
    expect(next.projectUnlocked).toBe(false);
  });
});

describe("config swap standard <-> GT (SC-003)", () => {
  it("changes only goals/floors, no code path change", () => {
    const std = newDay("L1", "2026-07-20", STANDARD_CONFIG);
    const gt = newDay("L1", "2026-07-20", GT_CONFIG);
    expect(std.dailyGoalXp).toBe(120);
    expect(gt.dailyGoalXp).toBe(200);
    expect(gt.sectionFloorXp.math).toBe(50);
  });
});
