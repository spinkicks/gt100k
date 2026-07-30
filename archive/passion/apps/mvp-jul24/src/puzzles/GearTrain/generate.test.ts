import { describe, expect, test } from "vitest";
import { TIERS, generateLevel } from "./generate";
import {
  SLOTS,
  countSolutions,
  isComplete,
  isSolved,
  ratesOf,
  ratioOf,
  searchSpaceSize,
  turnsToRealign,
} from "./logic";

const SEEDS = Array.from({ length: 120 }, (_, i) => i + 1);

describe.each(TIERS.map((_, i) => i))("tier %i", (tierIndex) => {
  test("every seed generates a level, with no hidden fallback", () => {
    for (const seed of SEEDS) {
      // generateLevel throws rather than returning an unverified level, so simply not throwing is
      // the assertion. An earlier version returned a hand-written fallback here, which was worse
      // because it was invisible: it looked like a normal level while carrying 8 answers in a
      // 60-placement space.
      expect(() => generateLevel(seed, tierIndex)).not.toThrow();
    }
  });

  test("the recorded solution actually solves it", () => {
    for (const seed of SEEDS) {
      const { train, solution } = generateLevel(seed, tierIndex);
      expect(isComplete(solution)).toBe(true);
      expect(isSolved({ ...train, placement: solution })).toBe(true);
    }
  });

  test("the target really is the realign count of the solution", () => {
    for (const seed of SEEDS) {
      const { train, solution } = generateLevel(seed, tierIndex);
      expect(turnsToRealign({ ...train, placement: solution })).toBe(train.target);
    }
  });

  test("levels open unsolved and with every slot empty", () => {
    for (const seed of SEEDS) {
      const { train } = generateLevel(seed, tierIndex);
      expect(isComplete(train.placement)).toBe(false);
      expect(ratioOf(train)).toBeNull();
      expect(turnsToRealign(train)).toBeNull();
      expect(isSolved(train)).toBe(false);
    }
  });

  test("the target sits inside the tier's window", () => {
    const tier = TIERS[tierIndex];
    if (!tier) throw new Error("missing tier");
    for (const seed of SEEDS) {
      const { train } = generateLevel(seed, tierIndex);
      expect(train.target).toBeGreaterThanOrEqual(tier.minTarget);
      expect(train.target).toBeLessThanOrEqual(tier.maxTarget);
    }
  });

  test("answers come in exactly one mirror pair, never more", () => {
    const tier = TIERS[tierIndex];
    if (!tier) throw new Error("missing tier");
    for (const seed of SEEDS) {
      const { train } = generateLevel(seed, tierIndex);
      const n = countSolutions(train);
      // At least 2 is structural, not incidental: the ratio is (crank x B) / (A x C) and A x C is
      // symmetric, so swapping slots A and C always gives the same realign count.
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(tier.maxSolutions);
    }
  });

  test("swapping slots A and C is always also a solution — the symmetry, asserted", () => {
    for (const seed of SEEDS.slice(0, 40)) {
      const { train, solution } = generateLevel(seed, tierIndex);
      const mirrored = { a: solution.c, b: solution.b, c: solution.a };
      expect(isSolved({ ...train, placement: mirrored })).toBe(true);
    }
  });

  test("the solution only uses gears that are actually in the inventory", () => {
    for (const seed of SEEDS) {
      const { train, solution } = generateLevel(seed, tierIndex);
      const pool = [...train.inventory];
      for (const slot of SLOTS) {
        const teeth = solution[slot] as number;
        const at = pool.indexOf(teeth);
        expect(at).toBeGreaterThanOrEqual(0);
        pool.splice(at, 1);
      }
    }
  });

  test("meshed gears counter-rotate and a shared shaft does not", () => {
    for (const seed of SEEDS.slice(0, 40)) {
      const { train, solution } = generateLevel(seed, tierIndex);
      const rates = ratesOf({ ...train, placement: solution });
      if (rates.a === null || rates.b === null || rates.c === null) throw new Error("incomplete");
      // crank meshes A, so they turn opposite ways.
      expect(Math.sign(rates.crank)).not.toBe(Math.sign(rates.a));
      // B shares A's shaft, so identical rate and direction.
      expect(rates.b).toBe(rates.a);
      // B meshes C, so those oppose.
      expect(Math.sign(rates.b)).not.toBe(Math.sign(rates.c));
    }
  });

  test("the ratio is exact — the reduced denominator IS the target", () => {
    for (const seed of SEEDS.slice(0, 40)) {
      const { train, solution } = generateLevel(seed, tierIndex);
      const ratio = ratioOf({ ...train, placement: solution });
      if (ratio === null) throw new Error("incomplete");
      expect(Number.isInteger(ratio.num)).toBe(true);
      expect(Number.isInteger(ratio.den)).toBe(true);
      expect(ratio.den).toBe(train.target);
    }
  });

  test("generation is deterministic per seed", () => {
    for (const seed of SEEDS.slice(0, 25)) {
      expect(generateLevel(seed, tierIndex)).toEqual(generateLevel(seed, tierIndex));
    }
  });

  test("the search space is large enough that guessing is a bad plan", () => {
    for (const seed of SEEDS) {
      const level = generateLevel(seed, tierIndex);
      expect(level.searchSpace).toBe(searchSpaceSize(level.train));
      expect(level.searchSpace).toBeGreaterThanOrEqual(200);
    }
  });
});

test("the harder tier asks for larger realign counts, so more factoring", () => {
  const meanTarget = (tierIndex: number): number => {
    const xs = SEEDS.map((s) => generateLevel(s, tierIndex).train.target);
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  };
  expect(meanTarget(1)).toBeGreaterThan(meanTarget(0));
});
