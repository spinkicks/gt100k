/**
 * What the difficulty call rests on.
 *
 * The strip tells a guide to make the work harder or easier. This is the line under it saying why,
 * and the tests are mostly about the two ways it could mislead: implying we know when we do not,
 * and showing a number precise enough to chase.
 */
import { describe, expect, it } from "vitest";

import { howItIsGoing } from "../app/wellbeing-strip.js";

describe("what the difficulty call rests on", () => {
  it("says so plainly when there is not enough judged work", () => {
    // The honest answer for most spikes. Most surfaces cannot tell a right answer from a wrong one,
    // and implying we know would be worse than admitting we do not.
    expect(howItIsGoing(undefined)).toMatch(/not enough/i);
  });

  it("separates a child breezing through from one drowning", () => {
    // The two ends are the whole point: one wants PUSH, the other SCAFFOLD, and a guide reading the
    // strip should be able to see which without opening anything.
    expect(howItIsGoing(0.95)).not.toBe(howItIsGoing(0.1));
    expect(howItIsGoing(0.95)).toMatch(/first go|nearly all/i);
    expect(howItIsGoing(0.1)).toMatch(/missing far more/i);
  });

  it("never shows a number", () => {
    // A percentage invites a guide to chase it, and this rate is a handful of puzzles over a
    // fortnight. It cannot carry that weight, and the wide bands say so.
    for (const r of [undefined, 0, 0.2, 0.5, 0.75, 0.9, 1]) {
      expect(howItIsGoing(r)).not.toMatch(/\d/);
    }
  });

  it("covers the whole range without a gap", () => {
    for (let r = 0; r <= 1.0001; r += 0.05) {
      expect(howItIsGoing(Math.min(r, 1)).length).toBeGreaterThan(8);
    }
  });
});
