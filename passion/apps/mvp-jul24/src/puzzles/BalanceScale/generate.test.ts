import { describe, expect, test } from "vitest";
import { TIERS, generateLevel, replay, stonesFor } from "./generate";
import { applyMove, isBalanced, isSolved, panWeight, shortestSolution } from "./logic";

const SEEDS = Array.from({ length: 120 }, (_, i) => i + 1);

describe("stonesFor", () => {
  test("decomposes into stones that sum back to the value", () => {
    for (let v = 1; v <= 60; v++) {
      const stones = stonesFor(v);
      const total = Object.entries(stones).reduce(
        (sum, [d, n]) => sum + Number(d) * (n as number),
        0,
      );
      expect(total).toBe(v);
    }
  });
});

describe.each(TIERS.map((_, i) => i))("tier %i", (tierIndex) => {
  test("every generated level is a balanced scale", () => {
    for (const seed of SEEDS) {
      const level = generateLevel(seed, tierIndex);
      // The invariant that makes the puzzle honest: both pans really do weigh the same, so every
      // legal move preserves a true equation rather than a decorative one.
      expect(isBalanced(level.scale)).toBe(true);
    }
  });

  test("no generated level opens already solved", () => {
    for (const seed of SEEDS) {
      expect(isSolved(generateLevel(seed, tierIndex).scale)).toBe(false);
    }
  });

  test("the recorded solution really solves the level when replayed forward", () => {
    for (const seed of SEEDS) {
      // Solvability is by construction, but replaying proves the construction and the forward
      // rules actually agree — the two could drift apart independently.
      expect(replay(generateLevel(seed, tierIndex))).toBe(true);
    }
  });

  test("every move along the solution keeps the scale balanced and whole-numbered", () => {
    for (const seed of SEEDS.slice(0, 40)) {
      const level = generateLevel(seed, tierIndex);
      let scale = level.scale;
      for (const move of level.solution) {
        scale = applyMove(scale, move);
        expect(isBalanced(scale)).toBe(true);
        for (const pan of [scale.left, scale.right]) {
          expect(Number.isInteger(pan.bags)).toBe(true);
          for (const count of Object.values(pan.stones)) {
            expect(Number.isInteger(count)).toBe(true);
            expect(count as number).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test("solution length sits inside the tier's window", () => {
    const tier = TIERS[tierIndex];
    if (!tier) throw new Error("missing tier");
    for (const seed of SEEDS) {
      const level = generateLevel(seed, tierIndex);
      expect(level.solution.length).toBeGreaterThanOrEqual(tier.minSteps);
      expect(level.solution.length).toBeLessThanOrEqual(tier.maxSteps);
    }
  });

  test("the shortest solution requires a divide, so divisibility must be reasoned about", () => {
    const tier = TIERS[tierIndex];
    if (!tier?.requireDivide) return;
    for (const seed of SEEDS) {
      const level = generateLevel(seed, tierIndex);
      expect(level.solution.some((m) => m.kind === "divide")).toBe(true);
    }
  });

  test("the recorded solution is genuinely the shortest", () => {
    for (const seed of SEEDS.slice(0, 40)) {
      const level = generateLevel(seed, tierIndex);
      const found = shortestSolution(level.scale);
      expect(found?.length).toBe(level.solution.length);
    }
  });

  test("generation is deterministic for a given seed", () => {
    for (const seed of SEEDS.slice(0, 20)) {
      const a = generateLevel(seed, tierIndex);
      const b = generateLevel(seed, tierIndex);
      expect(b.scale).toEqual(a.scale);
      expect(b.solution).toEqual(a.solution);
    }
  });

  test("the bag weight is what the solved scale reads off", () => {
    for (const seed of SEEDS.slice(0, 40)) {
      const level = generateLevel(seed, tierIndex);
      let scale = level.scale;
      for (const move of level.solution) scale = applyMove(scale, move);
      const lone = scale.left.bags === 1 ? scale.left : scale.right;
      const other = scale.left.bags === 1 ? scale.right : scale.left;
      expect(panWeight(lone, scale.bagWeight)).toBe(scale.bagWeight);
      expect(panWeight(other, scale.bagWeight)).toBe(scale.bagWeight);
    }
  });
});

test("harder tier is not easier than the first", () => {
  const mean = (tierIndex: number): number => {
    const lens = SEEDS.map((s) => generateLevel(s, tierIndex).solution.length);
    return lens.reduce((a, b) => a + b, 0) / lens.length;
  };
  expect(mean(1)).toBeGreaterThan(mean(0));
});
