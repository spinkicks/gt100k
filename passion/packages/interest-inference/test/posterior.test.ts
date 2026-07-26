import { describe, it, expect } from "vitest";
import { toBelief } from "../src/posterior.js";
import type { CellAccum } from "../src/fold.js";

// Round numbers, chosen so every expectation below is hand-checkable and so the cell sits exactly
// on the E6 mass floor: (7.0 − 1.5) + (1.5 − 1.0) = 6.0.
const goldenAccum: CellAccum = {
  cellKey: "music-sound/audio-systems::build",
  domainPath: ["music-sound", "audio-systems"],
  mode: "build",
  alphaPrior: 1.5,
  betaPrior: 1,
  alpha: 7.0,
  beta: 1.5,
  // No artifact_competence: E11 makes it unscored, so it can never reach positiveByKind.
  // No same_day_engagement either: E2 makes it unscored for the same reason.
  positiveByKind: { cross_day_return: 5, unrequired_revision: 0.5 },
  skips: 1,
  declines: 0,
  prompted: 1,
  sameDay: 2,
  days: new Set(["2026-01-03", "2026-01-04", "2026-01-05", "2026-01-06", "2026-01-07"]),
};

describe("toBelief (golden)", () => {
  it("computes the hand-verified posterior", () => {
    const b = toBelief(goldenAccum);
    // n = 8.5 → mean 7/8.5; variance (7·1.5)/(8.5²·9.5) = 10.5/686.375.
    expect(b.mean).toBeCloseTo(0.823529, 5);
    expect(b.sd).toBeCloseTo(0.123684, 5);
    expect(b.lowerBound).toBeCloseTo(0.699845, 5);
    expect(b.evidenceMass).toBeCloseTo(6.0, 6);
    expect(b.distinctDays).toBe(5);
    expect(b.confident).toBe(true);
    expect(b.supporting[0]).toBe("cross_day_return");
    // sameDay is context, not disconfirming evidence — it must appear on neither side.
    expect(b.disconfirming).toEqual(["skip:1", "prompted_return:1"]);
    expect(b.attribution).toBeNull();
  });
  it("marks a thin cell not-confident", () => {
    const thin = {
      ...goldenAccum,
      alpha: 2,
      beta: 1,
      positiveByKind: { cross_day_return: 0.5 },
      skips: 0,
      prompted: 0,
      days: new Set(["2026-01-03", "2026-01-04"]),
    };
    // Two days clears MIN_DISTINCT_DAYS, so the mass floor is doing the work: 0.5 < 6.
    expect(toBelief(thin).confident).toBe(false);
  });
});
