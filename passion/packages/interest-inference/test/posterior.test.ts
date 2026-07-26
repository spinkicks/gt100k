import { describe, it, expect } from "vitest";
import { toBelief } from "../src/posterior.js";
import type { CellAccum } from "../src/fold.js";

const goldenAccum: CellAccum = {
  cellKey: "music-sound/audio-systems::build",
  domainPath: ["music-sound", "audio-systems"],
  mode: "build",
  alphaPrior: 1.5,
  betaPrior: 1,
  alpha: 5.0,
  beta: 1.5,
  // No artifact_competence: E11 makes it unscored, so it can never reach positiveByKind.
  // No same_day_engagement either: E2 makes it unscored for the same reason.
  positiveByKind: { cross_day_return: 3, unrequired_revision: 0.5 },
  skips: 1,
  declines: 0,
  prompted: 1,
  sameDay: 2,
};

describe("toBelief (golden)", () => {
  it("computes the hand-verified posterior", () => {
    const b = toBelief(goldenAccum);
    expect(b.mean).toBeCloseTo(0.769231, 5);
    expect(b.sd).toBeCloseTo(0.153846, 5);
    expect(b.lowerBound).toBeCloseTo(0.615385, 5);
    expect(b.evidenceMass).toBeCloseTo(4.0, 6);
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
    };
    expect(toBelief(thin).confident).toBe(false); // evidenceMass 0.5 < 3
  });
});
