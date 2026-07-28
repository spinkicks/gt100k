/**
 * Seeded Balance Scale generator.
 *
 * Solvability is by CONSTRUCTION, never by search: we start from the solved scale (one bag alone
 * against its own weight in stones) and walk backwards, applying the inverse of each legal move.
 * Every inverse only adds or multiplies, so no intermediate state can be fractional and the
 * forward path back to the answer is guaranteed to exist. The same approach as
 * src/puzzles/RatioMixing/generate.ts.
 *
 * The forward difficulty is then MEASURED rather than assumed — `shortestSolution` re-derives the
 * real optimum, which is usually shorter than our scramble (the walk sometimes undoes itself), and
 * candidates outside the tier's window are rejected.
 */
import {
  DENOMS,
  type Denom,
  type Move,
  type Pan,
  type Scale,
  applyMove,
  isSolved,
  legalMoves,
  shortestSolution,
  stoneCount,
  stoneTotal,
} from "./logic";
import { DETERMINISTIC_STRATEGIES, randomLegal } from "./naive";
// The app's one seeded PRNG. Its exact arithmetic decides which levels this file produces — and the
// measured solution-length windows and blind rates below are properties of those particular levels.
// See src/lib/rng.ts.
import { mulberry32 } from "../../lib/rng";

export interface Tier {
  /** Bag weights to choose from. Kept small so the answer is checkable in the head. */
  weights: readonly number[];
  /** Inverse moves to apply when scrambling. */
  scramble: number;
  /** Accepted window for the true shortest forward solution. */
  minSteps: number;
  maxSteps: number;
  /** Whether the shortest solution must contain a divide (forces divisibility reasoning). */
  requireDivide: boolean;
  /** Moves allowed over the optimum before the scale resets. */
  slack: number;
  /**
   * Ceiling on the measured probability that ONE undirected random run solves the level inside its
   * budget. Without this, tier 0 sat at 15.8% -- roughly one in six, which a child would hit within
   * a few restarts, so the puzzle would be solving itself.
   */
  maxBlindRate: number;
}

/**
 * Three tiers, and the FIRST one is new: the tight budget moved up rather than being loosened.
 *
 * What was wrong. Tier 0 shipped with `slack: 1` — one move more than a perfect line of play, on a
 * puzzle whose whole point is a divisibility step that is legal on 1 of 120 opening boards. A first
 * encounter therefore had room for exactly one wasted click before the scale reset, which is not a
 * budget a child meets while still working out what the moves do. The product owner's report was
 * "the number of moves is too low for first shot — maybe introduce it as a harder mode", and that is
 * exactly what happens below.
 *
 * Why loosening tier 0 in place would have been the wrong fix. The budget is not decoration: a
 * random walk solves this puzzle on essentially every level *given room*, because every removal and
 * every division shrinks the scale toward "one bag alone" and there are no dead ends. The budget is
 * the only thing standing between "reasoned it out" and "clicked until it fell over" — see
 * `Level.budget` and `Tier.maxBlindRate`. So the loose budget gets its own tier, and the two tiers
 * that carry the anti-flailing guarantee are kept byte-for-byte as they were and simply moved up.
 *
 * Measured over 120 seeds × 20 undirected runs each, at each tier's own budget (`naive.test.ts`):
 *   tier 0 (new, slack 4): budget 9–10 for a 5–6 move solution · blind solve 2.33% · 0/480 deterministic
 *   tier 1 (was tier 0):   budget 5–7  for a 4–6 move solution · blind solve 1.21% · 0/480
 *   tier 2 (was tier 1):   budget 8–11 for a 6–9 move solution · blind solve 0.92% · 0/480
 * The easy tier stays under the same 4% ceiling the others do, because the generator re-measures the
 * blind rate *at the tier's own budget* and rejects candidates a wider budget would hand over. The
 * cost is paid in generation attempts (757ms for 120 levels against 344ms), not in the guarantee.
 *
 * Slack 4 rather than 5 or 6, from the same sweep: 2 → 1.79%, 3 → 1.96%, 4 → 2.33%, 5 → 3.25%,
 * 6 → 3.33%. All clear the ceiling, so the deciding number is the one in `Level.budget`: undirected
 * play needs a MEDIAN OF 12 moves over the optimum to land, and 4 is comfortably the wrong side of
 * that while still being roughly double a perfect line of play.
 *
 * Tiers 1 and 2 are the old tiers with their parameters unchanged, but their *levels* are not
 * identical to what shipped before: `followTheGlow` joined the reject filter in the same change, and
 * it withdraws levels that the new split rail's hint would have walked a child through (39, 47 and 18
 * of 120 respectively, before it was added). That is a difficulty guarantee getting stricter, not a
 * budget getting looser.
 */
export const TIERS: readonly Tier[] = [
  {
    // The first encounter. Same boards as the tier below — same weights, same scramble depth, same
    // solution-length window — with room to explore. Nothing here is easier to *reason* about; what
    // is easier is affording a wrong turn, which is how a child finds out what a move does.
    weights: [2, 3, 4, 6],
    scramble: 6,
    minSteps: 4,
    maxSteps: 7,
    requireDivide: true,
    slack: 4,
    maxBlindRate: 0.04,
  },
  {
    weights: [2, 3, 4, 6],
    scramble: 6,
    minSteps: 4,
    maxSteps: 7,
    requireDivide: true,
    slack: 1,
    maxBlindRate: 0.04,
  },
  {
    weights: [4, 6, 8, 9, 12],
    scramble: 9,
    minSteps: 6,
    maxSteps: 10,
    requireDivide: true,
    slack: 2,
    maxBlindRate: 0.04,
  },
];

/** Random runs used to estimate a candidate's blind-success rate. Seeded, so generation stays pure. */
const BLIND_TRIALS = 40;

/** Greedy largest-first decomposition of a value into stones. */
export function stonesFor(value: number): Partial<Record<Denom, number>> {
  const stones: Partial<Record<Denom, number>> = {};
  let rest = value;
  for (const d of DENOMS) {
    const n = Math.floor(rest / d);
    if (n > 0) {
      stones[d] = n;
      rest -= n * d;
    }
  }
  return stones;
}

function addStone(pan: Pan, value: Denom, n: number): Pan {
  const stones = { ...pan.stones };
  stones[value] = (stones[value] ?? 0) + n;
  return { bags: pan.bags, stones };
}

/**
 * Inverse moves. Each is the exact undo of a forward move, so applying one to a solvable scale
 * yields a scale that is still solvable — one step further from the answer.
 */
type Inverse =
  | { kind: "addStone"; value: Denom }
  | { kind: "addBag" }
  | { kind: "merge"; side: "left" | "right"; from: Denom; to: Denom }
  | { kind: "multiply"; k: number };

function inverseOptions(scale: Scale): Inverse[] {
  const out: Inverse[] = [];
  for (const value of DENOMS) out.push({ kind: "addStone", value });
  out.push({ kind: "addBag" });
  // merge is the undo of exchange: five 1s back into a 5, two 5s back into a 10.
  for (const side of ["left", "right"] as const) {
    const pan = side === "left" ? scale.left : scale.right;
    if (stoneCount(pan, 1) >= 5) out.push({ kind: "merge", side, from: 1, to: 5 });
    if (stoneCount(pan, 5) >= 2) out.push({ kind: "merge", side, from: 5, to: 10 });
  }
  // multiply is the undo of divide. Capped so boards stay physically drawable.
  const total = stoneTotal(scale.left) + stoneTotal(scale.right);
  const bags = scale.left.bags + scale.right.bags;
  for (const k of [2, 3]) {
    if (total * k <= 90 && bags * k <= 10) out.push({ kind: "multiply", k });
  }
  return out;
}

function applyInverse(scale: Scale, inv: Inverse): Scale {
  switch (inv.kind) {
    case "addStone":
      return {
        ...scale,
        left: addStone(scale.left, inv.value, 1),
        right: addStone(scale.right, inv.value, 1),
      };
    case "addBag":
      return {
        ...scale,
        left: { ...scale.left, bags: scale.left.bags + 1 },
        right: { ...scale.right, bags: scale.right.bags + 1 },
      };
    case "merge": {
      const pan = inv.side === "left" ? scale.left : scale.right;
      const per = inv.to / inv.from;
      let next = addStone(pan, inv.from, -per);
      next = addStone(next, inv.to, 1);
      // addStone with a negative count can leave a zero entry; normalise it away.
      const stones: Partial<Record<Denom, number>> = {};
      for (const d of DENOMS) {
        const c = stoneCount(next, d);
        if (c > 0) stones[d] = c;
      }
      const cleaned: Pan = { bags: next.bags, stones };
      return inv.side === "left" ? { ...scale, left: cleaned } : { ...scale, right: cleaned };
    }
    case "multiply": {
      const grow = (pan: Pan): Pan => {
        const stones: Partial<Record<Denom, number>> = {};
        for (const d of DENOMS) {
          const c = stoneCount(pan, d) * inv.k;
          if (c > 0) stones[d] = c;
        }
        return { bags: pan.bags * inv.k, stones };
      };
      return { ...scale, left: grow(scale.left), right: grow(scale.right) };
    }
  }
}

export function solvedScale(bagWeight: number): Scale {
  return {
    left: { bags: 1, stones: {} },
    right: { bags: 0, stones: stonesFor(bagWeight) },
    bagWeight,
  };
}

const MAX_ATTEMPTS = 400;

export interface Level {
  scale: Scale;
  /** The true shortest solution, kept so tests and the harness can verify without re-searching. */
  solution: Move[];
  tierIndex: number;
  /**
   * Moves allowed before the scale resets itself. `solution.length + SLACK`.
   *
   * This exists because of a measured fact, not a hunch: undirected clicking solves this puzzle
   * eventually no matter what the move set is. Every removal and every division shrinks the scale
   * toward "one bag alone", so there are no dead ends to fall into and no wrong turns to regret —
   * a random walk got there on 120 of 120 tier-0 levels. What it needs is *room*: a median of 12
   * moves more than the optimum. The budget takes that room away, so reaching the answer requires
   * planning the route rather than wandering to it.
   *
   * Running out is NOT a fail state and is never counted or scored: the scale simply resets to the
   * opening position, the same way RatioMixing's "Pour it out" works.
   */
  budget: number;
}

/**
 * Measured probability that one undirected run solves this scale inside `budget`.
 * Deterministic: the trial seeds are derived from the scale, never from a clock.
 */
export function blindSuccessRate(scale: Scale, budget: number, salt: number): number {
  let hits = 0;
  for (let i = 0; i < BLIND_TRIALS; i++) {
    if (randomLegal(scale, salt * 7919 + i, budget).solved) hits++;
  }
  return hits / BLIND_TRIALS;
}

export function generateLevel(seed: number, tierIndex = 0): Level {
  const tier = TIERS[Math.min(tierIndex, TIERS.length - 1)] as Tier;
  const rng = mulberry32(seed);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const weight = tier.weights[Math.floor(rng() * tier.weights.length)] as number;
    let scale = solvedScale(weight);

    for (let i = 0; i < tier.scramble; i++) {
      const options = inverseOptions(scale);
      const inv = options[Math.floor(rng() * options.length)] as Inverse;
      scale = applyInverse(scale, inv);
    }

    // A scramble can land back on a solved scale, or on one that is trivially/absurdly deep.
    if (isSolved(scale)) continue;
    const solution = shortestSolution(scale);
    if (solution === null) continue;
    if (solution.length < tier.minSteps || solution.length > tier.maxSteps) continue;
    if (tier.requireDivide && !solution.some((m) => m.kind === "divide")) continue;

    // Reject anything a non-reasoning policy can crack. Measured before this filter existed:
    // the strip-then-divide attack that defeats the continuous version of this puzzle still solved
    // 41 of 120 tier-0 candidates, and sometimes at the exact optimum, so a move budget alone would
    // not have excluded it. Filtering is the only honest fix — same approach as RatioMixing.
    const budget = solution.length + tier.slack;
    if (DETERMINISTIC_STRATEGIES.some((s) => s.run(scale, budget).solved)) continue;
    if (blindSuccessRate(scale, budget, seed + attempt) > tier.maxBlindRate) continue;

    return { scale, solution, tierIndex, budget };
  }

  // Deterministic fallback so a caller never gets an exception. Hand-checked: 2 bags + five 1s
  // against 1 bag + a 10 balances at B = 5, needs an exchange to make the division legal, and is
  // solvable in five moves.
  const fallback: Scale = {
    left: { bags: 2, stones: { 1: 5 } },
    right: { bags: 1, stones: { 10: 1 } },
    bagWeight: 5,
  };
  const fallbackSolution = shortestSolution(fallback) ?? [];
  return {
    scale: fallback,
    solution: fallbackSolution,
    tierIndex,
    budget: fallbackSolution.length + tier.slack,
  };
}

/** Convenience for tests: does a forward replay of `solution` actually reach the goal? */
export function replay(level: Level): boolean {
  let scale = level.scale;
  for (const move of level.solution) {
    const before = scale;
    scale = applyMove(scale, move);
    if (scale === before) return false; // move was illegal at this point
  }
  return isSolved(scale);
}

export { legalMoves };
