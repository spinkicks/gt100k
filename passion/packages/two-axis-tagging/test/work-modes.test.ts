import { describe, it, expect } from "vitest";
import { WORK_MODES, WORK_MODE_DEFS, isWorkMode } from "../src/work-modes.js";

describe("work-modes", () => {
  it("has the 9 modes in golden order", () => {
    expect(WORK_MODES).toEqual([
      "build", "investigate", "compose", "perform",
      "debug", "explain", "persuade", "collaborate", "care",
    ]);
  });
  it("defines every mode with a gloss and produces", () => {
    for (const m of WORK_MODES) {
      const def = WORK_MODE_DEFS[m];
      expect(def.gloss.length).toBeGreaterThan(0);
      expect(["artifact", "understanding", "performance", "none"]).toContain(def.produces);
    }
  });
  it("isWorkMode guards", () => {
    expect(isWorkMode("build")).toBe(true);
    expect(isWorkMode("nope")).toBe(false);
  });
});
