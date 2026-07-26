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

/** Undirected clicking, seeded so the test is deterministic. */
export function randomLegal(scale: Scale, seed: number, budget?: number): StrategyResult {
  let a = seed >>> 0;
  const rand = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
];
