import { describe, it, expect } from "vitest";
import { toBelief } from "../src/posterior.js";
import type { CellAccum } from "../src/fold.js";

const goldenAccum: CellAccum = {
  cellKey: "music-sound/audio-systems::build",
  domainPath: ["music-sound", "audio-systems"],
  mode: "build",
  alphaPrior: 1.5,
  betaPrior: 1,
  alpha: 5.5,
  beta: 1.5,
  positiveByKind: { voluntary_return: 3, unrequired_revision: 0.5, artifact_competence: 0.5 },
  skips: 1,
  prompted: 1,
};

describe("toBelief (golden)", () => {
  it("computes the hand-verified posterior", () => {
    const b = toBelief(goldenAccum);
    expect(b.mean).toBeCloseTo(0.785714, 4);
    expect(b.sd).toBeCloseTo(0.145072, 4);
    expect(b.lowerBound).toBeCloseTo(0.640642, 4);
    expect(b.evidenceMass).toBeCloseTo(4.5, 6);
    expect(b.confident).toBe(true);
    expect(b.supporting[0]).toBe("voluntary_return");
    expect(b.disconfirming).toEqual(["skip:1", "prompted_return:1"]);
    expect(b.attribution).toBeNull();
  });
  it("marks a thin cell not-confident", () => {
    const thin = {
      ...goldenAccum,
      alpha: 2,
      beta: 1,
      positiveByKind: { voluntary_return: 0.5 },
      skips: 0,
      prompted: 0,
    };
    expect(toBelief(thin).confident).toBe(false); // evidenceMass 0.5 < 3
  });
});
