import { describe, expect, it } from "vitest";
import type { Program } from "../../code/program";
import { cellKey } from "../SpriteLoop/logic";
import { FALLBACK_PUZZLE, TIERS, acceptable, generateForRound, tierForIndex } from "./generate";
import { type TeachHelperPuzzle, isSolved, leftovers, outcomes, worksOnVisibleOnly } from "./logic";
import { writtenForWhatCouldBeThere, writtenForWhatYouSee, writtenWithARepeat } from "./naive";
import { CORRIDOR, clears, runWorld } from "./world";

const SEEDS = [1, 2, 3, 7, 11, 42, 99, 1234];
const ROUNDS = SEEDS.flatMap((seed) =>
  TIERS.map((_, index) => ({ seed, index, puzzle: generateForRound(seed, index) })),
);

const at = (...xs: number[]) => new Set(xs.map((x) => cellKey(x, 0)));

describe("runWorld", () => {
  it("takes a parcel from the helper's own cell", () => {
    const r = runWorld([{ kind: "take" }], at(0));
    expect(r.cleared).toBe(true);
    expect(r.frames[r.frames.length - 1]!.carried).toBe(1);
  });

  it("does nothing at all when the cell is empty, which is the load-bearing half of the rule", () => {
    const r = runWorld([{ kind: "take" }], at(3));
    expect(r.cleared).toBe(false);
    expect(r.frames[r.frames.length - 1]!.carried).toBe(0);
    // No failure, no cost, no complaint: grabbing everywhere must never be a punished strategy.
    expect(r.truncated).toBe(false);
  });

  it("walks and takes along the corridor", () => {
    const p: Program = [{ kind: "take" }, { kind: "move", steps: 1 }, { kind: "take" }];
    expect(clears(p, at(0, 1))).toBe(true);
    expect(clears(p, at(0, 2))).toBe(false);
  });

  it("records the parcels still on the floor at every tick", () => {
    const r = runWorld([{ kind: "take" }], at(0));
    expect(r.frames[0]!.remaining.size).toBe(1);
    expect(r.frames[r.frames.length - 1]!.remaining.size).toBe(0);
  });
});

describe("isSolved", () => {
  const puzzle: TeachHelperPuzzle = { visible: at(1), hidden: [at(4), at(5)] };

  it("rejects an empty program", () => {
    expect(isSolved(puzzle, [])).toBe(false);
  });

  it("rejects a program that only clears the board it can see", () => {
    const p = writtenForWhatYouSee(puzzle.visible);
    expect(clears(p, puzzle.visible)).toBe(true);
    expect(isSolved(puzzle, p)).toBe(false);
    expect(worksOnVisibleOnly(puzzle, p)).toBe(true);
  });

  it("accepts a program that takes everywhere", () => {
    expect(isSolved(puzzle, writtenForWhatCouldBeThere())).toBe(true);
  });

  it("accepts the same idea written short with a repeat", () => {
    expect(isSolved(puzzle, writtenWithARepeat())).toBe(true);
  });

  it("reports one outcome per arrangement, visible first", () => {
    expect(outcomes(puzzle, writtenForWhatYouSee(puzzle.visible))[0]).toBe(true);
    expect(outcomes(puzzle, writtenForWhatCouldBeThere())).toHaveLength(3);
  });
});

describe("leftovers", () => {
  const puzzle: TeachHelperPuzzle = { visible: at(1), hidden: [at(3, 5)] };

  it("reports what is still on the floor, not what started there", () => {
    // Takes at 0 and 3 only: the hidden floor keeps its parcel at 5 and loses the one at 3.
    const p: Program = [{ kind: "take" }, { kind: "move", steps: 3 }, { kind: "take" }];
    const [onVisible, onHidden] = leftovers(puzzle, p);
    expect(onVisible).toEqual(at(1));
    expect(onHidden).toEqual(at(5));
  });

  it("is empty for every floor once the program clears them all", () => {
    for (const set of leftovers(puzzle, writtenForWhatCouldBeThere())) {
      expect(set.size).toBe(0);
    }
  });
});

describe("generateForRound", () => {
  it("is deterministic in seed and index", () => {
    expect(generateForRound(7, 0)).toEqual(generateForRound(7, 0));
  });

  it("gives every round three hidden arrangements, none of them empty", () => {
    for (const { seed, index, puzzle } of ROUNDS) {
      expect(puzzle.hidden, `seed ${seed} tier ${index}`).toHaveLength(3);
      for (const h of puzzle.hidden) expect(h.size).toBeGreaterThan(0);
    }
  });

  it("keeps every parcel inside the corridor", () => {
    for (const { puzzle } of ROUNDS) {
      for (const set of [puzzle.visible, ...puzzle.hidden]) {
        for (const key of set) {
          const x = Number(key.split(",")[0]);
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThan(CORRIDOR);
        }
      }
    }
  });

  it("passes its own acceptability rule", () => {
    for (const { seed, index, puzzle } of ROUNDS) {
      expect(acceptable(puzzle), `seed ${seed} tier ${index}`).toBe(true);
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
 * Sprite Loop: the drawn path underdetermines the behaviour. Trace & Repair: the ending
 * underdetermines the repair. Here: **the visible board underdetermines the instructions.** If a round
 * ever accepted the program a child writes by reading the board in front of them, it would be
 * measuring nothing.
 */
describe("the board you can see cannot tell you what to write", () => {
  it("fails the program written for the visible arrangement, every round", () => {
    for (const { seed, index, puzzle } of ROUNDS) {
      const naive = writtenForWhatYouSee(puzzle.visible);
      expect(clears(naive, puzzle.visible), `seed ${seed} tier ${index}`).toBe(true);
      expect(isSolved(puzzle, naive), `seed ${seed} tier ${index}`).toBe(false);
    }
  });

  it("accepts the program written for what could be there, every round", () => {
    for (const { seed, index, puzzle } of ROUNDS) {
      expect(isSolved(puzzle, writtenForWhatCouldBeThere()), `seed ${seed} tier ${index}`).toBe(
        true,
      );
    }
  });
});

describe("the fallback round", () => {
  it("obeys the same rule the generator enforces, so it cannot rot", () => {
    expect(acceptable(FALLBACK_PUZZLE)).toBe(true);
    expect(isSolved(FALLBACK_PUZZLE, writtenForWhatYouSee(FALLBACK_PUZZLE.visible))).toBe(false);
    expect(isSolved(FALLBACK_PUZZLE, writtenForWhatCouldBeThere())).toBe(true);
  });
});
