/**
 * Seeded Gear Train generator.
 *
 * Built backwards: choose an inventory and a winning placement FIRST, read the target off it, and
 * only then hand the child the scrambled inventory. Solvability is therefore by construction, never
 * a search that might fail — the same approach as RatioMixing and BalanceScale.
 *
 * Two filters decide whether a candidate ships, and both are measured rather than assumed:
 *   - the target must be reachable by exactly ONE placement, so guessing has a known cost and a
 *     correct reasoner is never told they are wrong;
 *   - a non-reasoning policy must not crack it (see naive.ts).
 */
import {
  type Placement,
  type Train,
  countSolutions,
  searchSpaceSize,
  turnsToRealign,
} from "./logic";
import { DETERMINISTIC_STRATEGIES, randomPlacements } from "./naive";
// The app's one seeded PRNG. Its exact arithmetic decides which levels this file produces — and the
// measured blind-guess rates below are properties of those particular levels. See src/lib/rng.ts.
import { mulberry32 } from "../../lib/rng";

export interface Tier {
  /** Gear sizes the inventory is drawn from. Teeth must stay countable when drawn. */
  sizes: readonly number[];
  /** How many gears the child gets to choose between. */
  inventorySize: number;
  crankChoices: readonly number[];
  /** Accepted window for the target, so it is neither trivial nor absurd. */
  minTarget: number;
  maxTarget: number;
  /**
   * Most winning placements a level may have. This is 2, and it CANNOT be 1.
   *
   * The ratio is (crank x B) / (A x C), and `A x C` is symmetric -- so swapping the gear in slot A
   * with the gear in slot C always produces exactly the same ratio, and therefore the same realign
   * count. Every answer necessarily has a mirror twin. Setting this to 1 makes generation
   * impossible, and the failure is silent: every level quietly falls through to the fallback.
   *
   * That symmetry then sets a floor on the blind-guess rate for a given space size, so the space has
   * to be large enough to absorb it: 2 answers in 336 placements is ~6.9% at a 12-try budget, which
   * the ceiling below can hold. 2 in 120 would be 18%, which it cannot.
   */
  maxSolutions: number;
  /** Ceiling on the chance that a short burst of random placements stumbles in. */
  maxBlindRate: number;
}

export const TIERS: readonly Tier[] = [
  {
    sizes: [8, 9, 10, 12, 14, 15, 16, 18, 20, 24],
    inventorySize: 8,
    crankChoices: [12, 16],
    minTarget: 3,
    maxTarget: 20,
    maxSolutions: 2,
    maxBlindRate: 0.08,
  },
  {
    sizes: [7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 20, 21, 22, 24],
    inventorySize: 8,
    crankChoices: [12, 14, 16, 18],
    minTarget: 7,
    maxTarget: 30,
    maxSolutions: 2,
    maxBlindRate: 0.08,
  },
];

/** Random bursts used to estimate how often undirected trying stumbles in. Seeded. */
const BLIND_TRIALS = 40;

/** A plausible number of placements a child tries before losing patience. */
export const BLIND_BUDGET = 12;

function blindRate(train: Train, salt: number): number {
  let hits = 0;
  for (let i = 0; i < BLIND_TRIALS; i++) {
    if (randomPlacements(train, salt * 977 + i, BLIND_BUDGET).solved) hits++;
  }
  return hits / BLIND_TRIALS;
}

const MAX_ATTEMPTS = 1500;

export interface Level {
  train: Train;
  /** The unique winning placement, kept so tests and the harness need not re-search. */
  solution: Placement;
  tierIndex: number;
  /** Number of distinct placements available — reported so the guessing cost is explicit. */
  searchSpace: number;
}

function pick<T>(rng: () => number, from: readonly T[]): T {
  return from[Math.floor(rng() * from.length)] as T;
}

export function generateLevel(seed: number, tierIndex = 0): Level {
  const tier = TIERS[Math.min(tierIndex, TIERS.length - 1)] as Tier;
  const rng = mulberry32(seed);

  // Best candidate that met every structural rule but missed only the blind-rate ceiling. Returned
  // if the loop runs out, so a caller always gets a REAL generated level. A hand-written fallback
  // was worse than this in a way that hid itself: it had 8 answers in a 60-placement space, so the
  // handful of seeds that reached it dragged the measured blind rate from 6.9% up to 9.5% while
  // looking, from the outside, like ordinary generated levels.
  let nearMiss: { level: Level; rate: number } | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Draw a distinct inventory.
    const pool = [...tier.sizes];
    const inventory: number[] = [];
    while (inventory.length < tier.inventorySize && pool.length > 0) {
      const at = Math.floor(rng() * pool.length);
      inventory.push(pool.splice(at, 1)[0] as number);
    }
    if (inventory.length < 3) continue;
    inventory.sort((x, y) => x - y);

    const crankTeeth = pick(rng, tier.crankChoices);

    // Choose the winning placement first, then read the target off it.
    // Fisher-Yates, not `sort(() => rng() - 0.5)`: that comparator is not a valid ordering, so the
    // result is biased and, worse here, yields few distinct triples per seed -- which starved the
    // candidate supply badly enough that some seeds exhausted every attempt.
    const shuffled = [...inventory];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j] as number, shuffled[i] as number];
    }
    const solution: Placement = { a: shuffled[0], b: shuffled[1], c: shuffled[2] };
    const den = turnsToRealign({ crankTeeth, inventory, target: 0, placement: solution });
    if (den === null) continue;

    if (den < tier.minTarget || den > tier.maxTarget) continue;

    const train: Train = { crankTeeth, inventory, target: den, placement: {} };

    // At least one (guaranteed -- we built from a solution) and few enough that the target is not
    // satisfiable by accident.
    const solutions = countSolutions(train);
    if (solutions < 1 || solutions > tier.maxSolutions) continue;

    // Reject anything a non-reasoning policy cracks, or that undirected trying finds too often.
    if (DETERMINISTIC_STRATEGIES.some((st) => st.run(train).solved)) continue;

    const level: Level = { train, solution, tierIndex, searchSpace: searchSpaceSize(train) };
    const rate = blindRate(train, seed + attempt);
    if (rate > tier.maxBlindRate) {
      if (nearMiss === null || rate < nearMiss.rate) nearMiss = { level, rate };
      continue;
    }

    return level;
  }

  if (nearMiss !== null) return nearMiss.level;

  // Unreachable in practice: the structural rules alone admit many candidates per tier, and the
  // loop runs 1500 attempts. Throwing beats returning a level nobody verified.
  throw new Error(`GearTrain: no level generated for seed ${seed} tier ${tierIndex}`);
}
