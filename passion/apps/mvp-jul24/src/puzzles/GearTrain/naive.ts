/**
 * Non-reasoning strategies for Gear Train, as executable code, so "this cannot be fiddled" is a
 * test rather than a claim. Same pattern as RatioMixing/naive.ts and BalanceScale/naive.ts.
 *
 * Fiddling here means filling the three slots without factoring the target: shove in the biggest
 * gears, or the smallest, or whatever is nearest to hand, and see if the counter matches. The
 * generator rejects any level these crack.
 */
import { type Placement, SLOTS, type Train, enumeratePlacements, isSolved } from "./logic";

export interface StrategyResult {
  solved: boolean;
  /** Placements the strategy tried before stopping. */
  tried: number;
}

/** Fill the slots in order from a pre-sorted pool. One shot: no search, no backtracking. */
function fillInOrder(train: Train, order: readonly number[]): StrategyResult {
  const placement: Partial<Record<(typeof SLOTS)[number], number>> = {};
  SLOTS.forEach((slot, i) => {
    const teeth = order[i];
    if (typeof teeth === "number") placement[slot] = teeth;
  });
  return { solved: isSolved({ ...train, placement }), tried: 1 };
}

export function biggestFirst(train: Train): StrategyResult {
  return fillInOrder(
    train,
    [...train.inventory].sort((a, b) => b - a),
  );
}

export function smallestFirst(train: Train): StrategyResult {
  return fillInOrder(
    train,
    [...train.inventory].sort((a, b) => a - b),
  );
}

/** Inventory order as presented, i.e. "just take the first three". */
export function asPresented(train: Train): StrategyResult {
  return fillInOrder(train, train.inventory);
}

/**
 * Match the target directly against a single gear's tooth count — the plausible wrong instinct
 * that the answer is "find the gear with N teeth" rather than a ratio.
 */
export function targetLooksLikeAGear(train: Train): StrategyResult {
  const hit = train.inventory.find((t) => t === train.target || t % train.target === 0);
  if (hit === undefined) return { solved: false, tried: 0 };
  const rest = train.inventory.filter((t) => t !== hit);
  return fillInOrder(train, [hit, ...rest]);
}

/**
 * Undirected trying: sample random placements. Seeded, so the test is deterministic.
 * `budget` is how many attempts a child might plausibly make before losing interest.
 */
export function randomPlacements(train: Train, seed: number, budget = 12): StrategyResult {
  let a = seed >>> 0;
  const rand = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const all = enumeratePlacements(train);
  for (let i = 0; i < budget; i++) {
    const placement = all[Math.floor(rand() * all.length)] as Placement;
    if (isSolved({ ...train, placement })) return { solved: true, tried: i + 1 };
  }
  return { solved: false, tried: budget };
}

export const DETERMINISTIC_STRATEGIES: ReadonlyArray<{
  name: string;
  run: (train: Train) => StrategyResult;
}> = [
  { name: "biggestFirst", run: biggestFirst },
  { name: "smallestFirst", run: smallestFirst },
  { name: "asPresented", run: asPresented },
  { name: "targetLooksLikeAGear", run: targetLooksLikeAGear },
];
