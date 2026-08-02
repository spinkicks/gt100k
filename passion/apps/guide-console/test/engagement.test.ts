import { describe, expect, it } from "vitest";
import { computeVoluntaryTrend } from "../app/engagement.js";

const at = (day: number, prompted = false) => ({
  prompted,
  timestamp: new Date(2026, 0, day).toISOString(),
});

describe("computeVoluntaryTrend", () => {
  it("reports fading when voluntary returns drop across a real window", () => {
    // First half (days 2-7): 6 voluntary. Second half (day 28): 1 voluntary. Window >= 14 days.
    const log = [...Array.from({ length: 6 }, (_, i) => at(2 + i)), at(28)];
    const t = computeVoluntaryTrend(log);
    expect(t.fading).toBe(true);
    expect(t.pct).not.toBeNull();
    expect(t.pct!).toBeLessThan(0);
  });

  it("omits the trend and never fades on a tiny sample (guard)", () => {
    // prev=2, curr=0 -> the -100% bug. Guard: prev+curr < MIN_TREND_EVENTS (5).
    const t = computeVoluntaryTrend([at(2), at(3)]);
    expect(t.fading).toBe(false);
    expect(t.pct).toBeNull();
  });

  it("does not fade on an empty log", () => {
    const t = computeVoluntaryTrend([]);
    expect(t.fading).toBe(false);
    expect(t.pct).toBeNull();
    expect(t.windowDays).toBe(0);
  });
});
