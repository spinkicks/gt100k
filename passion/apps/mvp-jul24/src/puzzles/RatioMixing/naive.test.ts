/**
 * THE ANTI-FIDDLING TEST.
 *
 * Ratio Mixing's failure mode is not "too hard" — it is "solvable by wiggling". A mixing puzzle
 * that can be nudged into place measures persistence and calls it proportional reasoning. So this
 * file does three things, in order:
 *
 *  1. **Shows the fiddling strategies actually work** when the design is weak. A test that only
 *     says "naive strategies fail" is worthless if the strategies are broken; these ones solve a
 *     deliberately weak bench, so their failure elsewhere means something.
 *  2. **Shows why the bench has three vats minimum**, by sweeping the entire two-vat design space
 *     and finding that taste-and-adjust cracks all of it. This is the measurement that killed the
 *     original two-vat tier.
 *  3. **Shows no shipped order can be fiddled.** Across many seeds and both tiers: every
 *     deterministic non-reasoning strategy fails, and the EXACT probability that a blind,
 *     undirected batch comes out right stays under the tier's ceiling — so blind pouring needs
 *     tens of pour-it-out cycles, while reasoning needs one.
 */

import { EASY_TIER, HARD_TIER, type Tier, countTraps, generateOrder, nextSeed } from "./generate";
import { type RatioPuzzle, type Vat, gcd, reduceRatio } from "./logic";
import {
  alwaysSameVat,
  anyNaiveStrategySolves,
  biggestLadleFirst,
  blindSuccessProbability,
  randomPourRate,
  roundRobin,
  tasteAndAdjust,
} from "./naive";

const SEEDS = Array.from({ length: 40 }, (_, i) => nextSeed(i * 31 + 5, i));

// ---------------------------------------------------------------------------
// 1. The strategies are real. If they never solved anything, step 3 would be vacuous.
// ---------------------------------------------------------------------------

/**
 * The design this puzzle could have been: two vats (neat dye and plain water), a jar to fill, and
 * a target strength. Every constraint that makes the shipped bench hard is missing.
 */
const sliderToy: RatioPuzzle = {
  vats: [
    { id: "a", label: "Water", dye: 0, water: 2, stock: 9 },
    { id: "b", label: "Dye", dye: 2, water: 0, stock: 9 },
  ],
  capacity: 12,
  targetDye: 1,
  targetWater: 1,
  solution: [3, 3],
};

describe("the fiddling strategies are strategies, not strawmen", () => {
  test("taste-and-adjust walks straight onto the answer when the design is weak", () => {
    expect(tasteAndAdjust(sliderToy)).toBe(true);
  });

  test("so does fair-shares round-robin", () => {
    expect(roundRobin(sliderToy)).toBe(true);
  });

  test("so does just using your favourite vat, on a bench that lets you", () => {
    const favourite: RatioPuzzle = {
      vats: [
        { id: "a", label: "Water", dye: 0, water: 2, stock: 5 },
        { id: "b", label: "Half strength", dye: 1, water: 1, stock: 4 },
      ],
      capacity: 8,
      targetDye: 1,
      targetWater: 1,
      solution: [0, 4],
    };
    expect(alwaysSameVat(favourite, "darkest")).toBe(true);
  });

  test("and blind pouring gets there over a third of the time", () => {
    expect(blindSuccessProbability(sliderToy)).toBeGreaterThan(0.3);
  });
});

// ---------------------------------------------------------------------------
// 2. Why three vats is the floor.
// ---------------------------------------------------------------------------

/** Every ladle the generator is allowed to put on a bench. */
const ALL_LADLES = (() => {
  const out: Array<{ dye: number; water: number }> = [];
  for (let dye = 0; dye <= 4; dye++) {
    for (let water = 0; water <= 4; water++) {
      const size = dye + water;
      if (size >= 2 && size <= 6) out.push({ dye, water });
    }
  }
  return out;
})();

/**
 * Enumerates every two-vat instance the generator's parameter box can express: all pairs of ladles
 * with different strengths, all solution counts, all stock slacks, subject to the same capacity,
 * scale, readability and no-single-vat-shortcut rules the real generator applies.
 */
function* everyTwoVatInstance(): Generator<RatioPuzzle> {
  for (const s1 of ALL_LADLES) {
    for (const s2 of ALL_LADLES) {
      const r1 = reduceRatio(s1.dye, s1.water).join(":");
      const r2 = reduceRatio(s2.dye, s2.water).join(":");
      if (r1 === r2) continue;
      if ((s1.dye === 0 || s1.water === 0) && (s2.dye === 0 || s2.water === 0)) continue;
      for (let k1 = 1; k1 <= 5; k1++) {
        for (let k2 = 1; k2 <= 5; k2++) {
          if (k1 + k2 < 4 || k1 + k2 > 7) continue;
          const capacity = k1 * (s1.dye + s1.water) + k2 * (s2.dye + s2.water);
          if (capacity < 12 || capacity > 28) continue;
          const dyeUnits = k1 * s1.dye + k2 * s2.dye;
          const waterUnits = capacity - dyeUnits;
          if (dyeUnits === 0 || waterUnits === 0) continue;
          const scale = gcd(dyeUnits, waterUnits);
          if (scale < 2) continue;
          const targetDye = dyeUnits / scale;
          const targetWater = waterUnits / scale;
          if (targetDye + targetWater > 9) continue;
          if (r1 === `${targetDye}:${targetWater}` || r2 === `${targetDye}:${targetWater}`) {
            continue;
          }
          for (let slack1 = 1; slack1 <= 3; slack1++) {
            for (let slack2 = 1; slack2 <= 3; slack2++) {
              const vats: Vat[] = [
                { id: "a", label: "Vat A", ...s1, stock: k1 + slack1 },
                { id: "b", label: "Vat B", ...s2, stock: k2 + slack2 },
              ];
              yield { vats, capacity, targetDye, targetWater, solution: [k1, k2] };
            }
          }
        }
      }
    }
  }
}

describe("two vats would be a slider toy — measured, not assumed", () => {
  test("taste-and-adjust solves EVERY two-vat instance the design space can express", () => {
    let total = 0;
    const survivors: RatioPuzzle[] = [];
    for (const puzzle of everyTwoVatInstance()) {
      total++;
      if (!tasteAndAdjust(puzzle)) survivors.push(puzzle);
    }
    // A real sweep, not three examples.
    expect(total).toBeGreaterThan(10_000);
    // Not one instance in the whole space resists the nudge. This is why EASY_TIER starts at
    // three vats: with two, "add the strong one when it looks pale" is a correct algorithm.
    expect(survivors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. No shipped order can be fiddled.
// ---------------------------------------------------------------------------

const TIERS: Array<[name: string, tier: Tier]> = [
  ["easy", EASY_TIER],
  ["hard", HARD_TIER],
];

describe.each(TIERS)("%s orders resist every non-reasoning strategy", (_name, tier) => {
  const orders = SEEDS.map((seed) => generateOrder(seed, tier));

  test("taste-and-adjust never lands the jar", () => {
    expect(orders.filter(tasteAndAdjust)).toEqual([]);
  });

  test("neither does biggest-ladle-first, a favourite vat, or fair shares from any start", () => {
    expect(orders.filter(biggestLadleFirst)).toEqual([]);
    expect(orders.filter((p) => alwaysSameVat(p, "darkest"))).toEqual([]);
    expect(orders.filter((p) => alwaysSameVat(p, "palest"))).toEqual([]);
    for (let start = 0; start < tier.vatCount; start++) {
      expect(orders.filter((p) => roundRobin(p, start))).toEqual([]);
    }
    expect(orders.filter(anyNaiveStrategySolves)).toEqual([]);
  });

  test("blind pouring needs tens of batches on every single order", () => {
    const probabilities = orders.map(blindSuccessProbability);
    for (const p of probabilities) {
      expect(p).toBeGreaterThan(0); // the jar IS reachable — this is a puzzle, not a wall
      expect(p).toBeLessThanOrEqual(tier.maxBlindSuccess);
    }
    // Expected pour-it-out cycles for a child who has stopped thinking, worst case over the batch
    // of seeds. Reasoning gets there in one.
    const worst = Math.max(...probabilities);
    expect(1 / worst).toBeGreaterThan(30);
  });

  test("filling the jar is easy; filling it right is not — every order is full of near-misses", () => {
    for (const order of orders) {
      expect(countTraps(order)).toBeGreaterThanOrEqual(tier.minTraps);
    }
  });
});

// ---------------------------------------------------------------------------
// The exact blind-success number is the one the generator filters on, so it had better be right.
// ---------------------------------------------------------------------------

describe("blindSuccessProbability", () => {
  test("agrees with actually playing thousands of careless batches", () => {
    for (const puzzle of [sliderToy, generateOrder(4242, EASY_TIER)]) {
      const exact = blindSuccessProbability(puzzle);
      const played = randomPourRate(puzzle, 20_000, 12345);
      expect(Math.abs(exact - played)).toBeLessThan(0.02);
    }
  });

  test("is 1 when every batch must succeed, and 0 when none can", () => {
    const forced: RatioPuzzle = {
      vats: [{ id: "a", label: "A", dye: 1, water: 1, stock: 3 }],
      capacity: 6,
      targetDye: 1,
      targetWater: 1,
      solution: [3],
    };
    expect(blindSuccessProbability(forced)).toBe(1);

    const impossible: RatioPuzzle = { ...forced, targetDye: 3, targetWater: 1 };
    expect(blindSuccessProbability(impossible)).toBe(0);
  });
});
