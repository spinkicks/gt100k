/**
 * Seeded Ratio Mixing generator.
 *
 * Every emitted order is guaranteed, by construction plus exhaustive check, to be:
 *
 *  1. **Solvable.** The instance is built backwards from a ladle-count vector `k`, so `k` is a
 *     solution before anything else is decided; the jar's capacity and the order card's ratio are
 *     *derived* from it. Solvability is therefore not a search result that might fail — it is how
 *     the instance came into existence.
 *  2. **Uniquely solvable.** Stock bounds make the space of ladle-count vectors finite and small
 *     (at most a few hundred), so `enumerateSolutions` checks every one of them. An instance with
 *     a second solution is discarded. Uniqueness is what makes "exactly right" a well-posed
 *     target rather than one of several acceptable near-answers.
 *  3. **Not fiddle-able.** The instance is run against every naive strategy in naive.ts and
 *     discarded if any of them lands it — in particular the taste-and-adjust nudge, which no
 *     shipped order survives. It is then discarded again unless the EXACT probability that one
 *     blind, undirected batch comes out right is at or below `maxBlindSuccess`. That probability
 *     is computed, not sampled (`blindSuccessProbability`), so the guarantee has no error bars.
 *     See naive.ts for why this filter is the whole design.
 *  4. **Trapped.** At least `minTraps` *other* ladle-count vectors fill the jar exactly to the
 *     brim while missing the ratio. Filling the jar is easy; filling it right is the puzzle.
 *  5. **Genuinely proportional.** `capacity` is a whole multiple (>= `minScale`) of the order
 *     card's parts, so the child has to scale the ratio up to the jar before anything else —
 *     "3 : 2 in a 20-unit jar" means 12 and 8, and there is no way to reach it without doing that
 *     step or its equivalent.
 *
 * Rejected candidates are simply drawn again from the same seeded stream, exactly as
 * Nonogram/generate.ts does, so a given seed always yields the same order.
 */

import {
  type Batch,
  type RatioPuzzle,
  type Vat,
  gcd,
  jarState,
  ladleSize,
  reduceRatio,
} from "./logic";
import { anyNaiveStrategySolves, blindSuccessProbability } from "./naive";
// The app's one seeded PRNG. Its exact arithmetic decides which orders this file produces, so see
// the warning in src/lib/rng.ts before touching it.
import { mulberry32 } from "../../lib/rng";

/** Combines the session seed with a "which order is this" counter (matches Pipes). */
export function nextSeed(seed: number, counter: number): number {
  return (Math.imul(seed ^ 0x9e3779b9, counter + 1) + counter * 0x2545f491) >>> 0;
}

// ---------------------------------------------------------------------------
// Difficulty.
// ---------------------------------------------------------------------------

export interface Tier {
  /** How many vats are on the bench. */
  vatCount: number;
  /** Total ladles in the (unique) solution — i.e. how many clicks a correct batch takes. */
  minLadles: number;
  maxLadles: number;
  /** Ladles of any one vat in the solution. */
  maxPerVat: number;
  minCapacity: number;
  maxCapacity: number;
  /** `capacity / (targetDye + targetWater)`: how far the order card's ratio must be scaled up. */
  minScale: number;
  /** Keeps the order card readable: 3 : 2 rather than 17 : 11. */
  maxTargetParts: number;
  /** Wrong ladle-count vectors that still fill the jar exactly. */
  minTraps: number;
  /** Ceiling on the exact probability that one blind, undirected batch comes out right. */
  maxBlindSuccess: number;
  /** Extra ladles each vat carries beyond what the solution needs, at most. */
  maxSlack: number;
}

/**
 * Three vats — and three is the FLOOR, not a starting point. A two-vat bench was measured and
 * thrown away: an exhaustive sweep of all 13,086 two-vat instances this generator's parameter box
 * can express found that `tasteAndAdjust` solves every single one of them (see naive.test.ts,
 * "two vats would be a slider toy"). With two vats and one exact-fill answer, nudging toward the
 * target strength IS a correct algorithm, so the puzzle would measure patience. The third vat is
 * what turns a 2x2 system into an underdetermined one that only integrality and the stock bounds
 * pin down, and it is what makes the greedy nudge walk off into dead ends.
 */
export const EASY_TIER: Tier = {
  vatCount: 3,
  minLadles: 5,
  maxLadles: 9,
  maxPerVat: 5,
  minCapacity: 18,
  maxCapacity: 36,
  minScale: 2,
  maxTargetParts: 9,
  minTraps: 6,
  maxBlindSuccess: 0.03,
  maxSlack: 3,
};

/** Four vats, a bigger jar, and a tighter blind-success ceiling. */
export const HARD_TIER: Tier = {
  vatCount: 4,
  minLadles: 6,
  maxLadles: 10,
  maxPerVat: 4,
  minCapacity: 20,
  maxCapacity: 42,
  minScale: 2,
  maxTargetParts: 9,
  minTraps: 10,
  maxBlindSuccess: 0.015,
  maxSlack: 2,
};

// ---------------------------------------------------------------------------
// Exhaustive checks over the (finite) space of ladle-count vectors.
// ---------------------------------------------------------------------------

/** Every ladle-count vector within stock, visited once. */
function forEachCountVector(puzzle: RatioPuzzle, visit: (counts: Batch) => void): void {
  const counts: number[] = puzzle.vats.map(() => 0);
  const walk = (i: number): void => {
    if (i === puzzle.vats.length) {
      visit(counts);
      return;
    }
    const max = puzzle.vats[i]!.stock;
    for (let n = 0; n <= max; n++) {
      counts[i] = n;
      walk(i + 1);
    }
    counts[i] = 0;
  };
  walk(0);
  return;
}

/** Every ladle-count vector within stock that fills the jar exactly AND hits the target ratio. */
export function enumerateSolutions(puzzle: RatioPuzzle): number[][] {
  const found: number[][] = [];
  forEachCountVector(puzzle, (counts) => {
    const { units, dye, water } = jarState(puzzle, counts);
    if (units !== puzzle.capacity) return;
    if (dye * puzzle.targetWater !== water * puzzle.targetDye) return;
    found.push(counts.slice());
  });
  return found;
}

/**
 * Ladle-count vectors that fill the jar exactly to the brim but land on the WRONG ratio — the
 * near-misses a child who is only watching the fill line will run into.
 */
export function countTraps(puzzle: RatioPuzzle): number {
  let traps = 0;
  forEachCountVector(puzzle, (counts) => {
    const { units, dye, water } = jarState(puzzle, counts);
    if (units !== puzzle.capacity) return;
    if (dye * puzzle.targetWater === water * puzzle.targetDye) return;
    traps++;
  });
  return traps;
}

// ---------------------------------------------------------------------------
// Candidate drawing.
// ---------------------------------------------------------------------------

const VAT_LABELS = ["Vat A", "Vat B", "Vat C", "Vat D"];

/** One ladle's contents. Sizes stay small so the numbers can be held in the head. */
interface LadleSpec {
  dye: number;
  water: number;
}

const ALL_LADLES: LadleSpec[] = (() => {
  const out: LadleSpec[] = [];
  for (let dye = 0; dye <= 4; dye++) {
    for (let water = 0; water <= 4; water++) {
      const size = dye + water;
      if (size < 2 || size > 6) continue;
      out.push({ dye, water });
    }
  }
  return out;
})();

/**
 * Picks `n` ladle specs with pairwise-different strengths (dye:water in lowest terms), at most one
 * of which is pure (all dye or all water), returned weakest-first so the bench reads left-to-right
 * from palest to deepest.
 */
function pickLadles(rng: () => number, n: number): LadleSpec[] | null {
  const chosen: LadleSpec[] = [];
  const seenRatios = new Set<string>();
  let pures = 0;
  for (let guard = 0; guard < 60 && chosen.length < n; guard++) {
    const spec = ALL_LADLES[Math.floor(rng() * ALL_LADLES.length)]!;
    const [a, b] = reduceRatio(spec.dye, spec.water);
    const key = `${a}:${b}`;
    if (seenRatios.has(key)) continue;
    const isPure = spec.dye === 0 || spec.water === 0;
    if (isPure && pures >= 1) continue;
    if (isPure) pures++;
    seenRatios.add(key);
    chosen.push(spec);
  }
  if (chosen.length < n) return null;
  chosen.sort((x, y) => x.dye * (y.dye + y.water) - y.dye * (x.dye + x.water));
  return chosen;
}

const MAX_ATTEMPTS = 60000;

/**
 * Builds one Ratio Mixing order deterministically from `seed`. Throws only if the tier is so
 * tightly constrained that `MAX_ATTEMPTS` draws all failed, which the tier tests guard against.
 */
export function generateOrder(seed: number, tier: Tier = EASY_TIER): RatioPuzzle {
  const rng = mulberry32(seed);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const ladles = pickLadles(rng, tier.vatCount);
    if (!ladles) continue;

    const counts = ladles.map(() => 1 + Math.floor(rng() * tier.maxPerVat));
    const total = counts.reduce((a, b) => a + b, 0);
    if (total < tier.minLadles || total > tier.maxLadles) continue;

    let capacity = 0;
    let dyeUnits = 0;
    ladles.forEach((spec, i) => {
      capacity += counts[i]! * (spec.dye + spec.water);
      dyeUnits += counts[i]! * spec.dye;
    });
    if (capacity < tier.minCapacity || capacity > tier.maxCapacity) continue;

    const waterUnits = capacity - dyeUnits;
    if (dyeUnits === 0 || waterUnits === 0) continue;

    // capacity / (targetDye + targetWater) reduces exactly to gcd(dyeUnits, waterUnits): the
    // order card's ratio has to be scaled up by that factor to fill the jar.
    const scale = gcd(dyeUnits, waterUnits);
    if (scale < tier.minScale) continue;
    const targetDye = dyeUnits / scale;
    const targetWater = waterUnits / scale;
    if (targetDye + targetWater > tier.maxTargetParts) continue;

    // If a vat's own ladle is already at the target strength, "just use that one" collapses the
    // ratio question into a volume question.
    const shortcut = ladles.some((spec) => {
      const [a, b] = reduceRatio(spec.dye, spec.water);
      return a === targetDye && b === targetWater;
    });
    if (shortcut) continue;

    const vats: Vat[] = ladles.map((spec, i) => ({
      id: String.fromCharCode(97 + i),
      label: VAT_LABELS[i] ?? `Vat ${i + 1}`,
      dye: spec.dye,
      water: spec.water,
      stock: counts[i]! + 1 + Math.floor(rng() * tier.maxSlack),
    }));

    const puzzle: RatioPuzzle = {
      vats,
      capacity,
      targetDye,
      targetWater,
      solution: counts,
    };

    const solutions = enumerateSolutions(puzzle);
    if (solutions.length !== 1) continue;

    if (countTraps(puzzle) < tier.minTraps) continue;
    if (anyNaiveStrategySolves(puzzle)) continue;
    if (blindSuccessProbability(puzzle) > tier.maxBlindSuccess) continue;

    return puzzle;
  }

  throw new Error(`generateOrder: no order found for seed ${seed} at this difficulty`);
}

/** Alternates easy/hard as the player works through orders in one sitting. */
export const tierForIndex = (index: number): Tier => (index % 2 === 0 ? EASY_TIER : HARD_TIER);

/** Sanity helper used by tests: is `counts` a legal, exact solution to `puzzle`? */
export function isExactSolution(puzzle: RatioPuzzle, counts: number[]): boolean {
  if (counts.length !== puzzle.vats.length) return false;
  if (counts.some((n, i) => n < 0 || n > puzzle.vats[i]!.stock)) return false;
  const { units, dye, water } = jarState(puzzle, counts);
  return units === puzzle.capacity && dye * puzzle.targetWater === water * puzzle.targetDye;
}

/** Total units of liquid the whole bench could supply — used to check the jar is not trivially full. */
export const benchVolume = (puzzle: RatioPuzzle): number =>
  puzzle.vats.reduce((sum, v) => sum + v.stock * ladleSize(v), 0);
