import { describe, expect, it } from "vitest";
import { STANDARD_CONFIG, applyFocusedTime, newDay, totalXp } from "../src/index";
import type { FocusedLearningRecord, Section } from "../src/index";

function rec(id: string, section: Section, minutes: number): FocusedLearningRecord {
  return { id, learnerRef: "L1", section, minutes, occurredAt: "2026-07-20T09:00:00Z" };
}

describe("applyFocusedTime — XP accrual (FR-001)", () => {
  it("adds 1 XP per focused minute in the record's section", () => {
    const day = newDay("L1", "2026-07-20", STANDARD_CONFIG);
    const after = applyFocusedTime(day, rec("r1", "math", 12));
    expect(after.xpBySection.math).toBe(12);
    expect(totalXp(after.xpBySection)).toBe(12);
  });

  it("does not mutate the input (pure)", () => {
    const day = newDay("L1", "2026-07-20", STANDARD_CONFIG);
    applyFocusedTime(day, rec("r1", "math", 5));
    expect(day.xpBySection.math).toBe(0);
    expect(day.appliedRecordIds).toHaveLength(0);
  });

  it("rejects non-positive minutes", () => {
    const day = newDay("L1", "2026-07-20", STANDARD_CONFIG);
    expect(() => applyFocusedTime(day, rec("r1", "math", 0))).toThrow();
    expect(() => applyFocusedTime(day, rec("r2", "math", -3))).toThrow();
  });
});

describe("applyFocusedTime — idempotency (FR-010, SC-002)", () => {
  it("re-applying the same record id does not double-count", () => {
    const day = newDay("L1", "2026-07-20", STANDARD_CONFIG);
    const once = applyFocusedTime(day, rec("r1", "math", 10));
    const twice = applyFocusedTime(once, rec("r1", "math", 10));
    expect(twice.xpBySection.math).toBe(10);
    expect(twice.appliedRecordIds).toHaveLength(1);
    expect(twice).toBe(once); // unchanged reference on no-op
  });
});
