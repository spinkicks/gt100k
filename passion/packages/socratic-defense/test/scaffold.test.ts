import { describe, it, expect } from "vitest";
import { initialCoverage, updateCoverage, selectNextFacet, isComplete, computeGaps } from "../src/scaffold.js";

describe("scaffold", () => {
  it("coverage starts at 0 for every facet", () => {
    const c = initialCoverage();
    expect(Object.values(c).every((v) => v === 0)).toBe(true);
  });
  it("update is monotonic max", () => {
    let c = initialCoverage();
    c = updateCoverage(c, "why", 0.3);
    c = updateCoverage(c, "why", 0.7);
    c = updateCoverage(c, "why", 0.5);
    expect(c.why).toBe(0.7);
  });
  it("selectNextFacet returns least-covered, fixed-order tie-break", () => {
    const c = initialCoverage();
    expect(selectNextFacet(c)).toBe("what"); // all 0 → first
    const c2 = updateCoverage(c, "what", 0.9);
    expect(selectNextFacet(c2)).toBe("why"); // what covered → next lowest, tie→order
  });
  it("isComplete on all-covered or MAX_TURNS", () => {
    const all = { what: 0.6, why: 0.6, how: 0.6, challenge: 0.6, next: 0.6, audience: 0.6 };
    expect(isComplete(all, 3)).toBe(true);
    const low = { ...all, why: 0.2 };
    expect(isComplete(low, 3)).toBe(false);
    expect(isComplete(low, 12)).toBe(true); // MAX_TURNS
  });
  it("computeGaps = facets below COVERED", () => {
    const c = { what: 0.7, why: 0.5, how: 0.7, challenge: 0.4, next: 0.7, audience: 0.7 };
    expect(computeGaps(c)).toEqual(["why", "challenge"]);
  });
});
