import { describe, expect, test } from "vitest";
import { BLIND_BUDGET, TIERS, generateLevel } from "./generate";
import type { Train } from "./logic";
import { DETERMINISTIC_STRATEGIES, biggestFirst, randomPlacements } from "./naive";

const SEEDS = Array.from({ length: 120 }, (_, i) => i + 1);

/**
 * A weak level, so the strategies below are demonstrably real attacks rather than strawmen. Without
 * this the "no strategy solves any shipped level" assertions would pass trivially for a policy that
 * never solves anything at all.
 *
 * crank 12 driving A=24, B=8, C=16: (12 x 8) / (24 x 16) = 96/384 = 1/4, so the realign count is 4.
 * Biggest-first fills A=24, B=16, C=8, giving (12 x 16) / (24 x 8) = 192/192 = 1/1 -> 1. So for
 * biggest-first to WIN, the target has to be what biggest-first produces:
 */
const WEAK: Train = {
  crankTeeth: 12,
  inventory: [8, 16, 24],
  target: 1,
  placement: {},
};

describe("the naive strategies are genuine attacks", () => {
  test("biggestFirst solves a level whose target is exactly what it produces", () => {
    expect(biggestFirst(WEAK).solved).toBe(true);
  });

  test("random trying cracks a three-gear level, where the space is tiny", () => {
    // 3 gears is only 6 placements, so undirected trying is cheap. This is why the shipped tiers
    // use 8 gears (336 placements) rather than the smallest inventory that fits the slots.
    expect(randomPlacements(WEAK, 1, 20).solved).toBe(true);
  });
});

describe.each(TIERS.map((_, i) => i))("tier %i resists fiddling", (tierIndex) => {
  test("no deterministic non-reasoning strategy solves any shipped level", () => {
    const wins: Record<string, number[]> = {};
    for (const seed of SEEDS) {
      const { train } = generateLevel(seed, tierIndex);
      for (const strategy of DETERMINISTIC_STRATEGIES) {
        if (strategy.run(train).solved) {
          wins[strategy.name] = [...(wins[strategy.name] ?? []), seed];
        }
      }
    }
    // Named seeds rather than a count, so a regression points at the instance to inspect.
    expect(wins).toEqual({});
  });

  test("undirected trying stays under the tier's blind ceiling", () => {
    const tier = TIERS[tierIndex];
    if (!tier) throw new Error("missing tier");
    let runs = 0;
    let hits = 0;
    for (const seed of SEEDS) {
      const { train } = generateLevel(seed, tierIndex);
      for (let attempt = 0; attempt < 10; attempt++) {
        runs++;
        if (randomPlacements(train, seed * 977 + attempt, BLIND_BUDGET).solved) hits++;
      }
    }
    const rate = hits / runs;
    // Honest about the floor: this cannot be driven to zero. Because A x C is symmetric, every
    // level has at least two answers, so with 336 placements and a 12-try budget the best
    // achievable is around 7%. Reported rather than hidden.
    expect(rate).toBeLessThanOrEqual(tier.maxBlindRate + 0.02);
  });
});

test("a gear whose teeth match the target never helps", () => {
  // The plausible wrong instinct is "find the gear with N teeth". The target sometimes DOES coincide
  // with an available tooth count -- that is harmless and not worth generating around. What must
  // never happen is that reaching for it works, which is what this asserts. (An earlier version of
  // this test banned the coincidence itself; that was a stronger claim than the design needs, and it
  // failed on a perfectly good level whose target was 20 with a 20-tooth gear in the rack.)
  for (const tierIndex of [0, 1]) {
    for (const seed of SEEDS) {
      const { train } = generateLevel(seed, tierIndex);
      if (!train.inventory.includes(train.target)) continue;
      const hit = train.target;
      const rest = train.inventory.filter((t) => t !== hit);
      for (const placement of [
        { a: hit, b: rest[0], c: rest[1] },
        { a: rest[0], b: hit, c: rest[1] },
        { a: rest[0], b: rest[1], c: hit },
      ]) {
        expect(isSolvedPlacement(train, placement)).toBe(false);
      }
    }
  }
});

function isSolvedPlacement(train: Train, placement: Record<string, number | undefined>): boolean {
  const a = placement.a;
  const b = placement.b;
  const c = placement.c;
  if (a === undefined || b === undefined || c === undefined) return false;
  return solvedWith(train, a, b, c);
}

function solvedWith(train: Train, a: number, b: number, c: number): boolean {
  const num = train.crankTeeth * b;
  const den = a * c;
  let x = num;
  let y = den;
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return den / (x || 1) === train.target;
}
