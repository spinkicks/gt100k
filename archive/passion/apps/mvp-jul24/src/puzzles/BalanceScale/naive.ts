/**
 * Non-reasoning strategies, written as executable code so the claim "this puzzle cannot be fiddled"
 * is a test rather than an opinion. Same idea as src/puzzles/RatioMixing/naive.ts.
 *
 * The specific attack this file exists to refute is the one that kills the naive design of this
 * puzzle. With continuous weights, `greedyThreeMove` below solves EVERY instance: drop the common
 * bags, drop the common weight, divide by the bags remaining — and that last division is always
 * exact by construction. Discrete stones plus a per-denomination divisibility rule are what break
 * it, and `greedyThreeMove` failing on shipped levels is the evidence that they did.
 */
import {
  DENOMS,
  type Move,
  type Scale,
  applyMove,
  isSolved,
  legalMoves,
  scaleKey,
  stoneCount,
} from "./logic";
// The app's one seeded PRNG — the measured blind-guess rates depend on its exact stream. See
// src/lib/rng.ts.
import { mulberry32 } from "../../lib/rng";
import { RAIL_KS, splitBlockers, unblockingMoves } from "./split";

export interface StrategyResult {
  solved: boolean;
  moves: number;
}

const MOVE_CAP = 40;

/**
 * Run a move-picking policy until it solves, stalls, loops, or runs out of moves.
 *
 * `budget` is the real constraint the child plays under, so every strategy is judged under it too.
 * Passing no budget measures the strategy's reach with unlimited moves, which is what the
 * measurement tests use to show that removal alone always converges eventually.
 */
function run(scale: Scale, pick: (s: Scale) => Move | null, budget = MOVE_CAP): StrategyResult {
  const cap = Math.min(budget, MOVE_CAP);
  let current = scale;
  const seen = new Set([scaleKey(current)]);
  for (let i = 0; i < cap; i++) {
    if (isSolved(current)) return { solved: true, moves: i };
    const move = pick(current);
    if (move === null) return { solved: false, moves: i };
    const after = applyMove(current, move);
    if (after === current) return { solved: false, moves: i };
    const key = scaleKey(after);
    if (seen.has(key)) return { solved: false, moves: i }; // cycling, e.g. exchange/merge forever
    seen.add(key);
    current = after;
  }
  return { solved: isSolved(current), moves: cap };
}

/**
 * The attack that defeats the continuous version: strip everything common, then divide.
 * Never exchanges, because in the continuous version there is nothing to exchange.
 */
export function greedyThreeMove(scale: Scale, budget?: number): StrategyResult {
  return run(
    scale,
    (s) => {
      for (const value of DENOMS) {
        if (stoneCount(s.left, value) > 0 && stoneCount(s.right, value) > 0) {
          return { kind: "removeStone", value };
        }
      }
      if (s.left.bags > 0 && s.right.bags > 0) return { kind: "removeBag" };
      for (const k of [2, 3, 5]) {
        const move: Move = { kind: "divide", k };
        if (legalMoves(s).some((m) => m.kind === "divide" && m.k === k)) return move;
      }
      return null;
    },
    budget,
  );
}

/** Divide at every opportunity, else strip. A plausible "keep making it smaller" instinct. */
export function alwaysDivide(scale: Scale, budget?: number): StrategyResult {
  return run(
    scale,
    (s) => {
      const moves = legalMoves(s);
      const div = moves.find((m) => m.kind === "divide");
      if (div) return div;
      const strip = moves.find((m) => m.kind === "removeStone" || m.kind === "removeBag");
      return strip ?? null;
    },
    budget,
  );
}

/** Always take the biggest matching stone off. Ignores that a big stone may be the wrong one. */
export function biggestStoneFirst(scale: Scale, budget?: number): StrategyResult {
  return run(
    scale,
    (s) => {
      const moves = legalMoves(s);
      const stone = moves.find((m) => m.kind === "removeStone");
      if (stone) return stone;
      const bag = moves.find((m) => m.kind === "removeBag");
      if (bag) return bag;
      return moves.find((m) => m.kind === "divide") ?? null;
    },
    budget,
  );
}

/**
 * FOLLOW THE GLOW — the strategy the new split rail could be accused of handing to a child.
 *
 * When a split is blocked, the rail marks the leftovers and lights every palette move that reduces
 * the number of blocking piles (`unblockingMoves`). A child could ignore the maths entirely and just
 * keep pressing whatever is lit, then split the moment the control unlatches. If that solved levels,
 * the affordance would have quietly become a walkthrough and `Tier.maxBlindRate` would be measuring
 * the wrong thing — so it is written here as executable code and held to the same bar as the other
 * attacks.
 *
 * IT IS A REAL ATTACK, and finding that out is why it is here. Left out of the generator's filter it
 * solves 39 of 120 tier-0 levels inside budget, 47 of 120 at tier 1 and 18 of 120 at tier 2 — a third
 * of the game, walked through by a hint added to make the move findable. With it in the filter those
 * levels are never generated: 0 of 120 at every tier.
 *
 * Where it stalls, and why that is the puzzle rather than a weakness in the hint: reducing the blocker
 * count is a ONE-STEP lookahead, and real solutions routinely pass through states with MORE blockers
 * (break a 10 into two 5s, twice, then strip, then divide). Greedy glow-following gives up exactly
 * where the puzzle asks you to plan several moves ahead.
 */
export function followTheGlow(scale: Scale, budget?: number): StrategyResult {
  return run(
    scale,
    (s) => {
      const moves = legalMoves(s);
      const divide = moves.find((m) => m.kind === "divide");
      if (divide) return divide;
      // The rail a child is looking at: whichever blocked split is closest to legal.
      const byDistance = [...RAIL_KS].sort(
        (a, b) => splitBlockers(s, a).length - splitBlockers(s, b).length,
      );
      for (const k of byDistance) {
        const lit = unblockingMoves(s, k);
        if (lit.length > 0) return lit[0] as Move;
      }
      return null;
    },
    budget,
  );
}

/** Undirected clicking, seeded so the test is deterministic. */
export function randomLegal(scale: Scale, seed: number, budget?: number): StrategyResult {
  // A separate generator instance, so measuring a candidate never advances the generator's own
  // stream and therefore never changes which level is produced.
  const rand = mulberry32(seed);
  return run(
    scale,
    (s) => {
      const moves = legalMoves(s);
      if (moves.length === 0) return null;
      return moves[Math.floor(rand() * moves.length)] as Move;
    },
    budget,
  );
}

export const DETERMINISTIC_STRATEGIES: ReadonlyArray<{
  name: string;
  run: (scale: Scale, budget?: number) => StrategyResult;
}> = [
  { name: "greedyThreeMove", run: greedyThreeMove },
  { name: "alwaysDivide", run: alwaysDivide },
  { name: "biggestStoneFirst", run: biggestStoneFirst },
  // In the GENERATOR's reject filter, not just in the tests, and it had to be: adding it changed
  // which levels ship at every tier, because without it a third of them were solvable by following
  // the split rail's hint (see the doc comment above for the counts). Levels are now selected to
  // resist the affordance that makes the move findable.
  { name: "followTheGlow", run: followTheGlow },
];
