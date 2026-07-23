import { describe, it, expect } from "vitest";
import { evaluateGate } from "../src/gate.js";
import type { InterestHypothesis } from "../src/model.js";

const base: InterestHypothesis = {
  id: "kid::c",
  kidId: "kid",
  cellKey: "c",
  domainPath: ["music-sound"],
  mode: "build",
  state: "EMERGING",
  version: 1,
  evidence: {
    mean: 0.8,
    lowerBound: 0.7,
    confident: true,
    attribution: "style",
    supporting: [],
    disconfirming: [],
    wasAboveThreshold: true,
  },
  perseveranceArtifactRef: "defense-1",
  history: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const NOW = Date.parse("2026-04-01T00:00:00.000Z");
// returns: day 0, day 20 (>14 gap), day 60 (>56 term, 3rd occasion)
const timeline = [
  "2026-01-01T00:00:00.000Z",
  "2026-01-21T00:00:00.000Z",
  "2026-03-02T00:00:00.000Z",
];

describe("evaluateGate", () => {
  it("passes with gap + durability + artifact", () => {
    const g = evaluateGate(base, timeline, NOW);
    expect(g).toEqual({ gapSurvived: true, durable: true, hasArtifact: true, passed: true });
  });

  it("flips gapSurvived when all returns are clustered (<14d apart)", () => {
    const g = evaluateGate(base, ["2026-01-01T00:00:00.000Z", "2026-01-05T00:00:00.000Z"], NOW);
    expect(g.gapSurvived).toBe(false);
    expect(g.passed).toBe(false);
  });

  it("flips durable when the span is under the term (even with a gap)", () => {
    // gap of 20 days survives, but the whole span is only 20 days < 56.
    const g = evaluateGate(base, ["2026-01-01T00:00:00.000Z", "2026-01-21T00:00:00.000Z"], NOW);
    expect(g.gapSurvived).toBe(true);
    expect(g.durable).toBe(false);
    expect(g.passed).toBe(false);
  });

  it("flips durable when there is only one return occasion", () => {
    const g = evaluateGate(base, ["2026-01-01T00:00:00.000Z"], NOW);
    expect(g.durable).toBe(false);
    expect(g.passed).toBe(false);
  });

  it("flips hasArtifact when the ref is absent", () => {
    const g = evaluateGate({ ...base, perseveranceArtifactRef: undefined }, timeline, NOW);
    expect(g.hasArtifact).toBe(false);
    expect(g.passed).toBe(false);
  });
});
