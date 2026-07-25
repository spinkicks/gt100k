import { describe, it, expect } from "vitest";
import { runInference } from "../src/inference.js";
import {
  GOLDEN_EVENTS,
  GOLDEN_PRIORS,
  GOLDEN_NOW,
  GOLDEN_CELL_KEY,
} from "../src/__fixtures__/interest.fixtures.js";

describe("golden end-to-end", () => {
  it("the golden event list yields the hand-verified posterior via runInference", () => {
    const read = runInference(GOLDEN_EVENTS, GOLDEN_PRIORS, GOLDEN_NOW);
    const cell = read.cells.find((c) => c.cellKey === GOLDEN_CELL_KEY)!;
    expect(cell.alpha).toBeCloseTo(5.547239, 5);
    expect(cell.beta).toBeCloseTo(1.410168, 5);
    expect(cell.mean).toBeCloseTo(0.797314, 5);
    expect(cell.sd).toBeCloseTo(0.142508, 5);
    expect(cell.lowerBound).toBeCloseTo(0.654806, 5);
    expect(cell.evidenceMass).toBeCloseTo(4.457407, 5);
    expect(cell.confident).toBe(true);
  });
});
