import { describe, expect, test } from "vitest";
import { TIERS, generateLevel } from "./generate";
import type { Scale } from "./logic";
import {
  DETERMINISTIC_STRATEGIES,
  alwaysDivide,
  followTheGlow,
  greedyThreeMove,
  randomLegal,
} from "./naive";

const SEEDS = Array.from({ length: 120 }, (_, i) => i + 1);

/**
 * The strategies must be real attacks, not strawmen — otherwise every assertion below is vacuous,
 * since a policy that never solves anything trivially "fails on all shipped levels".
 *
 * This is the continuous puzzle's shape written in stones that happen to line up: every common
 * stone matches, and what is left divides evenly with no exchange needed. 2 bags + two 1s against
 * six 1s balances at B = 2. Strip the two 1s, halve, done — exactly the attack that makes the naive
 * design of this puzzle worthless.
 */
const WEAK: Scale = {
  left: { bags: 2, stones: { 1: 2 } },
  right: { bags: 0, stones: { 1: 6 } },
  bagWeight: 2,
};

describe("the naive strategies are genuine attacks", () => {
  test("greedyThreeMove solves a scale built to suit it", () => {
    expect(greedyThreeMove(WEAK).solved).toBe(true);
  });

  test("and in very few moves, which is exactly the danger", () => {
    expect(greedyThreeMove(WEAK).moves).toBeLessThanOrEqual(4);
  });

  test("alwaysDivide solves it too", () => {
    expect(alwaysDivide(WEAK).solved).toBe(true);
  });

  test("undirected clicking also cracks it, given room", () => {
    expect(randomLegal(WEAK, 1).solved).toBe(true);
  });

  test("followTheGlow cracks it too, so the split rail's hint is being held to a real bar", () => {
    // The strategy a child could run without doing any arithmetic: press whatever the blocked split
    // lights up, then split. It has to be able to win *somewhere* or its zero score below is worthless.
    expect(followTheGlow(WEAK).solved).toBe(true);
  });
});

/**
 * The test that guards the split rail against becoming a walkthrough.
 *
 * This is not a hypothetical: measured before `followTheGlow` joined the generator's reject filter,
 * pressing only what the rail lit up solved 39 of 120 tier-0 levels inside budget, 47 of 120 at tier 1
 * and 18 of 120 at tier 2. A change made purely to help a child FIND the divide move had handed a
 * third of the game away. The filter withdraws those levels; this test is what keeps them withdrawn.
 */
describe.each(TIERS.map((_, i) => i))("tier %i resists the split rail's own hint", (tierIndex) => {
  test("following the lit moves and splitting on sight solves nothing", () => {
    const beaten = SEEDS.filter((seed) => {
      const level = generateLevel(seed, tierIndex);
      return followTheGlow(level.scale, level.budget).solved;
    });
    expect(beaten).toEqual([]);
  });
});

describe.each(TIERS.map((_, i) => i))("tier %i resists fiddling", (tierIndex) => {
  test("no deterministic non-reasoning strategy solves any shipped level", () => {
    // Reported as seeds rather than a count, so a regression names the instance to inspect.
    const wins: Record<string, number[]> = {};
    for (const seed of SEEDS) {
      const level = generateLevel(seed, tierIndex);
      for (const strategy of DETERMINISTIC_STRATEGIES) {
        if (strategy.run(level.scale, level.budget).solved) {
          wins[strategy.name] = [...(wins[strategy.name] ?? []), seed];
        }
      }
    }
    expect(wins).toEqual({});
  });

  test("undirected clicking stays under the tier's blind ceiling", () => {
    const tier = TIERS[tierIndex];
    if (!tier) throw new Error("missing tier");
    let runs = 0;
    let hits = 0;
    for (const seed of SEEDS) {
      const level = generateLevel(seed, tierIndex);
      for (let attempt = 0; attempt < 20; attempt++) {
        runs++;
        if (randomLegal(level.scale, seed * 7919 + attempt, level.budget).solved) hits++;
      }
    }
    // Honest about what this is: blind success is low, not zero. A determined child could brute
    // force a level in ~100 restarts. The strategies a child would actually *use* -- the ones that
    // respond to feedback -- are the deterministic set above, and those are at zero.
    expect(hits / runs).toBeLessThanOrEqual(tier.maxBlindRate);
  });
});

test("the continuous-weights attack is dead, and stays dead", () => {
  // The design claim as one assertion. If removal is ever relaxed to "take any amount off both
  // pans", or divide is made unconditionally legal, greedyThreeMove starts winning and this fails.
  for (const tierIndex of [0, 1]) {
    const beaten = SEEDS.filter((seed) => {
      const level = generateLevel(seed, tierIndex);
      return greedyThreeMove(level.scale, level.budget).solved;
    });
    expect(beaten).toEqual([]);
  }
});

test("a budget is always enough for the real solution, with room to spare", () => {
  for (const tierIndex of [0, 1]) {
    for (const seed of SEEDS) {
      const level = generateLevel(seed, tierIndex);
      expect(level.budget).toBeGreaterThan(level.solution.length);
    }
  }
});
