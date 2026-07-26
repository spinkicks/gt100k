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
    expect(cell.alpha).toBeCloseTo(7.704284, 5);
    expect(cell.beta).toBeCloseTo(1.410168, 5);
    expect(cell.mean).toBeCloseTo(0.845282, 5);
    expect(cell.sd).toBeCloseTo(0.11371, 5);
    expect(cell.lowerBound).toBeCloseTo(0.731572, 5);
    expect(cell.evidenceMass).toBeCloseTo(6.614452, 5);
    // Six of the seven days carry scored evidence. Jan 2 is the novel first exposure, which moves
    // nothing and so buys no day (E6).
    expect(cell.distinctDays).toBe(6);
    expect(cell.confident).toBe(true);
  });

  it("still yields a spike — the happy path the golden exists to demonstrate", () => {
    const read = runInference(GOLDEN_EVENTS, GOLDEN_PRIORS, GOLDEN_NOW);
    expect(read.candidates.map((c) => c.cellKey)).toEqual([GOLDEN_CELL_KEY]);
  });
});
