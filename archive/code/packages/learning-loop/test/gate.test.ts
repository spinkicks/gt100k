import { describe, expect, it } from "vitest";
import { STANDARD_CONFIG, applyFocusedTime, evaluateGate, newDay } from "../src/index";
import type { DailyProgress, FocusedLearningRecord, Section } from "../src/index";

let seq = 0;
function add(progress: DailyProgress, section: Section, minutes: number): DailyProgress {
  const record: FocusedLearningRecord = {
    id: `r${seq++}`,
    learnerRef: progress.learnerRef,
    section,
    minutes,
    occurredAt: "2026-07-20T10:00:00Z",
  };
  return applyFocusedTime(progress, record);
}

describe("evaluateGate — hybrid gate (FR-005)", () => {
  it("stays locked when total is below the daily goal", () => {
    let d = newDay("L1", "2026-07-20", STANDARD_CONFIG);
    d = add(d, "math", 30);
    d = add(d, "science", 30);
    expect(evaluateGate(d).unlocked).toBe(false);
    expect(evaluateGate(d).remainingTotalXp).toBe(60);
  });

  it("stays locked when total is met but a section is below its floor (imbalance)", () => {
    let d = newDay("L1", "2026-07-20", STANDARD_CONFIG);
    d = add(d, "math", 90); // total will reach 120 but reading/language stay at 0
    d = add(d, "science", 30);
    expect(d.xpBySection.math + d.xpBySection.science).toBe(120);
    const g = evaluateGate(d);
    expect(g.unlocked).toBe(false);
    expect(g.remainingBySection.reading).toBe(30);
    expect(g.remainingBySection.language).toBe(30);
  });

  it("unlocks when the daily total AND every section floor are met", () => {
    let d = newDay("L1", "2026-07-20", STANDARD_CONFIG);
    for (const s of ["math", "science", "reading", "language"] as Section[]) {
      d = add(d, s, 30);
    }
    expect(evaluateGate(d).unlocked).toBe(true);
    expect(d.projectUnlocked).toBe(true);
  });

  it("reports beyond-floor XP as an engagement signal (FR-005b)", () => {
    let d = newDay("L1", "2026-07-20", STANDARD_CONFIG);
    d = add(d, "math", 50); // 20 beyond the 30 floor
    d = add(d, "reading", 30);
    const g = evaluateGate(d);
    expect(g.beyondFloorBySection.math).toBe(20);
    expect(g.beyondFloorBySection.reading).toBe(0);
  });
});
