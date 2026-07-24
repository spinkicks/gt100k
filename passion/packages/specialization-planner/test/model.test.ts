import { describe, it, expect } from "vitest";
import {
  DP_S1,
  DP_S2,
  DP_S3,
  DP_S4,
  DP_BY_STAGE,
  INVESTMENT_LOAD,
  DEPTH_S2,
  DEPTH_S3,
  DEPTH_S4,
  RETURN_S2,
  RETURN_S3,
  RETURN_S4,
  REST_DAYS_PER_WEEK,
  REST_MONTHS_PER_YEAR,
  REST_INCREMENT_MONTHS,
  RETURN_WINDOW_DAYS,
  STAGES,
} from "../src/model.js";

describe("golden constants (spec §3.7)", () => {
  it("pins the exact DP fractions + investment ceiling", () => {
    expect([DP_S1, DP_S2, DP_S3, DP_S4]).toEqual([0.0, 0.15, 0.3, 0.45]);
    expect(INVESTMENT_LOAD).toBe(0.6);
  });

  it("DP is non-decreasing S1→S4 and every value is strictly < INVESTMENT_LOAD ([D3])", () => {
    const doses = STAGES.map((s) => DP_BY_STAGE[s]);
    expect(doses).toEqual([0.0, 0.15, 0.3, 0.45]);
    for (let i = 1; i < doses.length; i++) {
      expect(doses[i]! >= doses[i - 1]!).toBe(true);
    }
    for (const d of doses) expect(d).toBeLessThan(INVESTMENT_LOAD);
  });

  it("pins the depth + voluntary-return thresholds", () => {
    expect([DEPTH_S2, DEPTH_S3, DEPTH_S4]).toEqual([3, 8, 16]);
    expect([RETURN_S2, RETURN_S3, RETURN_S4]).toEqual([4, 8, 12]);
  });

  it("pins the AAP rest cadence + the return recency window", () => {
    expect(REST_DAYS_PER_WEEK).toBe(2);
    expect(REST_MONTHS_PER_YEAR).toBe(3);
    expect(REST_INCREMENT_MONTHS).toBe(1);
    expect(RETURN_WINDOW_DAYS).toBe(90);
  });

  it("rest floors satisfy the mandatory-rest invariant (≥1 day/wk, ≥1 month/yr)", () => {
    expect(REST_DAYS_PER_WEEK).toBeGreaterThanOrEqual(1);
    expect(REST_MONTHS_PER_YEAR).toBeGreaterThanOrEqual(1);
  });
});
