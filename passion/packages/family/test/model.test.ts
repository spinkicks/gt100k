import { describe, expect, it } from "vitest";
import {
  MAX_ASKS,
  MAX_SHARED_ACTIVITIES,
  OVER_IDENTIFICATION_MIN_SHARE,
} from "../src/index.js";

// Golden constants (spec 019 §3.6) — pinned so a drift breaks the gate.
describe("@gt100k/family constants (§3.6)", () => {
  it("pins OVER_IDENTIFICATION_MIN_SHARE, MAX_ASKS, MAX_SHARED_ACTIVITIES", () => {
    expect(OVER_IDENTIFICATION_MIN_SHARE).toBe(0.8);
    expect(MAX_ASKS).toBe(4);
    expect(MAX_SHARED_ACTIVITIES).toBe(3);
  });
});
