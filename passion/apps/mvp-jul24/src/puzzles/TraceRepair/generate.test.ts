import { describe, expect, it } from "vitest";
import { inBounds } from "../SpriteLoop/logic";
import { FALLBACK_PUZZLE, TIERS, generateForRound, tierForIndex } from "./generate";
import { divergenceTick, isSolved, posesOf } from "./logic";
import { linesBlamedByEnding, repairsByRun } from "./naive";

const SEEDS = [1, 2, 3, 7, 11, 42, 99, 1234];
const ROUNDS = SEEDS.flatMap((seed) =>
  TIERS.map((_, index) => ({ seed, index, puzzle: generateForRound(seed, index) })),
);

describe("generateForRound", () => {
  it("is deterministic in seed and index", () => {
    expect(generateForRound(7, 0)).toEqual(generateForRound(7, 0));
  });

  it("varies with the seed", () => {
    expect(generateForRound(1, 0).buggy).not.toEqual(generateForRound(2, 0).buggy);
  });

  it("differs from the intended program in exactly one line", () => {
    for (const { seed, index, puzzle } of ROUNDS) {
      const differing = puzzle.intended.filter((s, i) => s !== puzzle.buggy[i]).length;
      expect(differing, `seed ${seed} tier ${index}`).toBe(1);
      expect(puzzle.intended[puzzle.bugLine]).not.toEqual(puzzle.buggy[puzzle.bugLine]);
    }
  });

  it("arrives broken, so there is always something to repair", () => {
    for (const { puzzle } of ROUNDS) expect(isSolved(puzzle, puzzle.buggy)).toBe(false);
  });

  it("keeps both runs on the board", () => {
    for (const { puzzle } of ROUNDS) {
      expect(posesOf(puzzle, puzzle.intended).every(inBounds)).toBe(true);
      expect(posesOf(puzzle, puzzle.buggy).every(inBounds)).toBe(true);
    }
  });

  it("gives every round exactly one repair that reproduces the intended run", () => {
    for (const { seed, index, puzzle } of ROUNDS) {
      expect(repairsByRun(puzzle).length, `seed ${seed} tier ${index}`).toBe(1);
    }
  });

  it("uses the line lengths its tier promises", () => {
    for (const { index, puzzle } of ROUNDS) {
      expect(puzzle.buggy).toHaveLength(TIERS[index]!.lines);
    }
  });
});

describe("tierForIndex", () => {
  it("wraps rather than clamping", () => {
    expect(tierForIndex(0)).toBe(0);
    expect(tierForIndex(TIERS.length)).toBe(0);
    expect(tierForIndex(-1)).toBe(TIERS.length - 1);
  });
});

/**
 * THE X1 GUARD FOR THIS DOOR.
 *
 * Sprite Loop's guard says the drawn path underdetermines the behaviour. This one says the **ending
 * underdetermines the repair**: more than one line could explain where the creature stopped, so a
 * child who looks only at the final board lands on a wrong line, and the only thing that separates the
 * candidates is the middle of the run. If this ever fails, the scrubber has become decoration and the
 * door is "spot the difference" rather than debugging.
 */
describe("the ending alone cannot tell you which line is wrong", () => {
  it("leaves at least two lines blamable from the final pose", () => {
    for (const { seed, index, puzzle } of ROUNDS) {
      expect(linesBlamedByEnding(puzzle).size, `seed ${seed} tier ${index}`).toBeGreaterThanOrEqual(
        2,
      );
    }
  });

  it("parts company inside the run, never only on the last tick", () => {
    for (const { seed, index, puzzle } of ROUNDS) {
      const want = posesOf(puzzle, puzzle.intended);
      const got = posesOf(puzzle, puzzle.buggy);
      const d = divergenceTick(want, got);
      expect(d, `seed ${seed} tier ${index}`).not.toBeNull();
      expect(d!).toBeLessThan(Math.min(want.length, got.length) - 1);
    }
  });
});

describe("the fallback round", () => {
  it("obeys the same rules the generator enforces, so it cannot rot", () => {
    const p = FALLBACK_PUZZLE;
    expect(isSolved(p, p.buggy)).toBe(false);
    expect(repairsByRun(p)).toHaveLength(1);
    expect(linesBlamedByEnding(p).size).toBeGreaterThanOrEqual(2);
    expect(posesOf(p, p.intended).every(inBounds)).toBe(true);
    expect(posesOf(p, p.buggy).every(inBounds)).toBe(true);
  });
});
