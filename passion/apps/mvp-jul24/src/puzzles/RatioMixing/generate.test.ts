import {
  EASY_TIER,
  HARD_TIER,
  type Tier,
  benchVolume,
  countTraps,
  enumerateSolutions,
  generateOrder,
  isExactSolution,
  mulberry32,
  nextSeed,
  tierForIndex,
} from "./generate";
import {
  type RatioPuzzle,
  canPour,
  emptyBatch,
  gcd,
  isSolved,
  jarState,
  ladleSize,
  ladlesPoured,
  pour,
  reduceRatio,
  requiredDye,
  requiredWater,
  targetParts,
} from "./logic";

const SEEDS = Array.from({ length: 40 }, (_, i) => nextSeed(i * 97 + 3, i));
const TIERS: Array<[name: string, tier: Tier]> = [
  ["easy", EASY_TIER],
  ["hard", HARD_TIER],
];

describe.each(TIERS)("%s orders", (_name, tier) => {
  const orders: RatioPuzzle[] = SEEDS.map((seed) => generateOrder(seed, tier));

  test("generation never fails across every seed", () => {
    expect(orders).toHaveLength(SEEDS.length);
  });

  test("the stated solution really fills the jar at the target ratio", () => {
    for (const order of orders) {
      expect(isExactSolution(order, order.solution)).toBe(true);
      expect(isSolved(order, order.solution)).toBe(true);
      expect(jarState(order, order.solution).units).toBe(order.capacity);
    }
  });

  test("the solution is the ONLY way to fill the jar right", () => {
    for (const order of orders) {
      expect(enumerateSolutions(order)).toEqual([order.solution]);
    }
  });

  test("the solution is reachable by actually pouring, in any order", () => {
    // The overflow guard must never block the correct batch, whatever sequence a player uses.
    const rng = mulberry32(7);
    for (const order of orders) {
      const remaining = order.solution.slice();
      let batch = emptyBatch(order);
      while (remaining.some((n) => n > 0)) {
        const choices = remaining.flatMap((n, i) => (n > 0 ? [i] : []));
        const pick = choices[Math.floor(rng() * choices.length)]!;
        expect(canPour(order, batch, pick)).toBe(true);
        batch = pour(order, batch, pick);
        remaining[pick] = remaining[pick]! - 1;
      }
      expect(isSolved(order, batch)).toBe(true);
    }
  });

  test("the order card is a genuine scaling-up problem", () => {
    for (const order of orders) {
      const parts = targetParts(order);
      // The ratio is in lowest terms, and the jar is a whole multiple of it, at least doubled.
      expect(reduceRatio(order.targetDye, order.targetWater)).toEqual([
        order.targetDye,
        order.targetWater,
      ]);
      expect(order.capacity % parts).toBe(0);
      expect(order.capacity / parts).toBeGreaterThanOrEqual(tier.minScale);
      expect(parts).toBeLessThanOrEqual(tier.maxTargetParts);
      // Both a dye and a water side: no degenerate "just fill it with water" orders.
      expect(order.targetDye).toBeGreaterThan(0);
      expect(order.targetWater).toBeGreaterThan(0);
      expect(requiredDye(order) + requiredWater(order)).toBe(order.capacity);
      expect(Number.isInteger(requiredDye(order))).toBe(true);
    }
  });

  test("no single vat is already at the target strength", () => {
    for (const order of orders) {
      for (const vat of order.vats) {
        expect(reduceRatio(vat.dye, vat.water)).not.toEqual([order.targetDye, order.targetWater]);
      }
    }
  });

  test("every vat matters, and every vat has stock to spare", () => {
    for (const order of orders) {
      expect(order.vats).toHaveLength(tier.vatCount);
      order.solution.forEach((count, i) => {
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(tier.maxPerVat);
        // Slack: the bench must not read as "use everything you have".
        expect(order.vats[i]!.stock).toBeGreaterThan(count);
      });
    }
  });

  test("vats have distinct strengths, at most one of them pure, weakest first", () => {
    for (const order of orders) {
      const strengths = order.vats.map((v) => v.dye / ladleSize(v));
      expect(new Set(strengths.map((s) => s.toFixed(6))).size).toBe(order.vats.length);
      expect([...strengths].sort((a, b) => a - b)).toEqual(strengths);
      expect(order.vats.filter((v) => v.dye === 0 || v.water === 0).length).toBeLessThanOrEqual(1);
      for (const vat of order.vats) {
        expect(ladleSize(vat)).toBeGreaterThanOrEqual(2);
        expect(ladleSize(vat)).toBeLessThanOrEqual(6);
      }
    }
  });

  test("stays inside the tier's size and length budget", () => {
    for (const order of orders) {
      expect(order.capacity).toBeGreaterThanOrEqual(tier.minCapacity);
      expect(order.capacity).toBeLessThanOrEqual(tier.maxCapacity);
      const clicks = ladlesPoured(order.solution);
      expect(clicks).toBeGreaterThanOrEqual(tier.minLadles);
      expect(clicks).toBeLessThanOrEqual(tier.maxLadles);
      // There is more liquid on the bench than the jar holds — the constraint is which liquid,
      // not whether there is enough.
      expect(benchVolume(order)).toBeGreaterThan(order.capacity);
    }
  });

  test("plenty of ways to fill the jar exactly and still be wrong", () => {
    for (const order of orders) {
      expect(countTraps(order)).toBeGreaterThanOrEqual(tier.minTraps);
    }
  });

  test("is deterministic for a given seed", () => {
    expect(generateOrder(12345, tier)).toEqual(generateOrder(12345, tier));
  });

  test("different seeds give different orders", () => {
    const signatures = new Set(orders.map((o) => JSON.stringify(o)));
    expect(signatures.size).toBeGreaterThan(SEEDS.length * 0.8);
  });
});

describe("enumerateSolutions", () => {
  test("finds every exact answer, including when there is more than one", () => {
    // Two vats of the same size, one pure water and one pure dye, in a jar that admits two
    // different splits at 1:1 only if the counts match — so exactly one answer here.
    const single: RatioPuzzle = {
      vats: [
        { id: "a", label: "A", dye: 0, water: 2, stock: 5 },
        { id: "b", label: "B", dye: 2, water: 0, stock: 5 },
      ],
      capacity: 8,
      targetDye: 1,
      targetWater: 1,
      solution: [2, 2],
    };
    expect(enumerateSolutions(single)).toEqual([[2, 2]]);

    // Duplicate the dye vat and the same jar now has several answers — the shape of instance the
    // generator throws away.
    const ambiguous: RatioPuzzle = {
      ...single,
      vats: [...single.vats, { id: "c", label: "C", dye: 2, water: 0, stock: 5 }],
    };
    expect(enumerateSolutions(ambiguous).length).toBeGreaterThan(1);
  });

  test("returns nothing when the jar cannot be hit", () => {
    const impossible: RatioPuzzle = {
      vats: [{ id: "a", label: "A", dye: 1, water: 1, stock: 4 }],
      capacity: 7,
      targetDye: 1,
      targetWater: 1,
      solution: [],
    };
    expect(enumerateSolutions(impossible)).toEqual([]);
  });
});

describe("isExactSolution", () => {
  const order = generateOrder(31337, EASY_TIER);

  test("rejects counts beyond a vat's stock", () => {
    const overStocked = order.solution.map((n, i) => (i === 0 ? order.vats[0]!.stock + 1 : n));
    expect(isExactSolution(order, overStocked)).toBe(false);
  });

  test("rejects a vector of the wrong length", () => {
    expect(isExactSolution(order, order.solution.slice(1))).toBe(false);
  });
});

describe("seeding", () => {
  test("mulberry32 is deterministic and seed-sensitive", () => {
    const draw = (seed: number) => {
      const rng = mulberry32(seed);
      return Array.from({ length: 5 }, () => rng());
    };
    expect(draw(42)).toEqual(draw(42));
    expect(draw(1)).not.toEqual(draw(2));
  });

  test("nextSeed gives a fresh stream per order without repeating", () => {
    const seeds = new Set<number>();
    for (let counter = 0; counter < 50; counter++) seeds.add(nextSeed(42, counter));
    expect(seeds.size).toBe(50);
    expect(nextSeed(7, 3)).toBe(nextSeed(7, 3));
    expect(nextSeed(1, 0)).not.toBe(nextSeed(2, 0));
  });

  test("tierForIndex alternates so a session sees both benches", () => {
    expect(tierForIndex(0)).toBe(EASY_TIER);
    expect(tierForIndex(1)).toBe(HARD_TIER);
    expect(tierForIndex(2)).toBe(EASY_TIER);
  });
});

test("the capacity-to-parts scale is exactly gcd(dye units, water units)", () => {
  // Not folklore: it is why `minScale` can be enforced with one gcd instead of a search.
  for (const seed of SEEDS.slice(0, 10)) {
    const order = generateOrder(seed, HARD_TIER);
    const dye = requiredDye(order);
    const water = requiredWater(order);
    expect(gcd(dye, water)).toBe(order.capacity / targetParts(order));
  }
});
