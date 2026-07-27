import { describe, expect, it } from "vitest";
import { allFixes, hasUniquePosition } from "./naive";

describe("allFixes", () => {
  // C major with a C# (1) at index 1. Both nudges of that note land back in the key.
  const broken = [0, 1, 4, 7, 5, 0];

  it("finds the sour note, both ways", () => {
    const fixes = allFixes(broken, 0, -2, 10);
    expect(fixes).toEqual([
      { index: 1, fix: 1 },
      { index: 1, fix: -1 },
    ]);
  });

  /**
   * The finding that reshaped the design: in a major scale every chromatic note lies INSIDE a whole
   * step, so a sour note always has an in-key neighbour a semitone away on both sides. Requiring a
   * unique direction is unsatisfiable — it rejected 100% of candidate instances — so uniqueness is
   * asserted on POSITION instead.
   */
  it("always returns two fixes for a sour note, in every key", () => {
    for (let key = 0; key < 12; key++) {
      // The semitone above the tonic is out of key in every major key.
      const phrase = [key, key + 1, key + 4, key + 7];
      const fixes = allFixes(phrase, key, key - 3, key + 10);
      expect(fixes.map((f) => f.index)).toEqual([1, 1]);
      expect(new Set(fixes.map((f) => f.fix))).toEqual(new Set([1, -1]));
    }
  });

  /**
   * `allFixes` answers "which nudges leave nothing sour", so on an ALREADY-correct melody it reports
   * every nudge that happens to keep it correct — B to C, and so on. That is the honest answer to the
   * question it is asked, and it is why `hasUniquePosition` checks `isSolved` first rather than relying
   * on this returning empty. Asserted so the division of labour between the two is not "fixed" later.
   */
  it("on an already-correct melody, reports the moves that keep it correct", () => {
    const fixes = allFixes([0, 2, 4, 5, 7], 0, -2, 10);
    expect(fixes.length).toBeGreaterThan(0);
    // ...and hasUniquePosition rejects it anyway, because there is nothing to find.
    expect(hasUniquePosition([0, 2, 4, 5, 7], 0, -2, 10, 1)).toBe(false);
  });

  it("searches only inside the rows the roll draws", () => {
    // Deny both destinations and nothing is reachable.
    expect(allFixes(broken, 0, 1, 1)).toEqual([]);
  });

  it("finds nothing when two notes are sour, because one nudge cannot fix both", () => {
    expect(allFixes([0, 1, 3, 7], 0, -2, 10)).toEqual([]);
  });
});

describe("hasUniquePosition", () => {
  const broken = [0, 1, 4, 7, 5, 0];

  it("accepts an instance whose only fixable note is the intended one", () => {
    expect(hasUniquePosition(broken, 0, -2, 10, 1)).toBe(true);
  });

  it("rejects a melody that is not sour at all", () => {
    expect(hasUniquePosition([0, 2, 4, 5, 7], 0, -2, 10, 1)).toBe(false);
  });

  it("rejects an instance whose fixable note is not the intended one", () => {
    expect(hasUniquePosition(broken, 0, -2, 10, 2)).toBe(false);
  });

  it("rejects an instance with nothing reachable to fix", () => {
    expect(hasUniquePosition(broken, 0, 1, 1, 1)).toBe(false);
  });
});
