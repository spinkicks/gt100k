import { describe, expect, it } from "vitest";
import {
  COVERAGE_MIN_DOMAINS,
  GAMIFICATION_KEYS,
  SCALAR_KEYS,
} from "@gt100k/guardrails";

describe("@gt100k/guardrails golden constants (spec §3.4)", () => {
  it("COVERAGE_MIN_DOMAINS is 6 (domains a kid should sample for the coverage pass)", () => {
    expect(COVERAGE_MIN_DOMAINS).toBe(6);
  });

  it("GAMIFICATION_KEYS are the banned gamification field names (GC6)", () => {
    expect(GAMIFICATION_KEYS).toEqual([
      "streak",
      "points",
      "reward",
      "xp",
      "badge",
      "leaderboard",
    ]);
  });

  it("SCALAR_KEYS are the banned scalar/label field names (GC1)", () => {
    expect(SCALAR_KEYS).toEqual(["score", "rating", "passionScore", "label"]);
  });
});
