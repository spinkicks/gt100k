import { describe, expect, it } from "vitest";
import {
  GAP_DAYS,
  PUSH_SUCCESS,
  SCAFFOLD_SUCCESS,
  TREND_WINDOW_DAYS,
  ZONE_HIGH,
  ZONE_LOW,
} from "../src/model.js";

describe("wellbeing golden constants (spec §3.6)", () => {
  it("pins each constant to its golden value", () => {
    expect(PUSH_SUCCESS).toBe(0.9);
    expect(ZONE_LOW).toBe(0.8);
    expect(ZONE_HIGH).toBe(0.9);
    expect(SCAFFOLD_SUCCESS).toBe(0.7);
    expect(GAP_DAYS).toBe(14);
    expect(TREND_WINDOW_DAYS).toBe(21);
  });
});
