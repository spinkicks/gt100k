/**
 * Models of a child who is NOT reasoning about the ratio.
 *
 * Ratio Mixing's one real design risk is that it degenerates into a slider toy: nudge, look, nudge
 * again, arrive without ever holding a ratio in mind. If that works, the activity measures
 * patience, not proportional reasoning, and it fails the swap test in spirit however mathematical
 * the dressing is.
 *
 * So the fiddling strategies are written down here as executable code, the generator refuses to
 * emit any instance they crack (see generate.ts), and naive.test.ts measures them against the
 * shipped generator. This module is the puzzle's specification of what must NOT work.
 *
 * The strategies below are deliberately the plausible ones, not strawmen:
 *
 *  1. `tasteAndAdjust` — the canonical fiddle, and the one that makes this puzzle genre dangerous.
 *     "Too pale? add the strong one. Too dark? add the weak one." Formally: of the pours that are
 *     currently legal, take the one that leaves the jar's dye:water closest to the target. It
 *     needs no plan and no arithmetic beyond a comparison, and on a naive design (two vats, free
 *     volume, unlimited stock) it is a Bresenham line-drawing algorithm that walks straight onto
 *     the answer.
 *  2. `biggestLadleFirst` — "fill it up fast, worry later".
 *  3. `alwaysSameVat` — "I like the dark one" / "I like the pale one".
 *  4. `roundRobin` — "a bit of each, fair shares".
 *  5. `blindSuccessProbability` — undirected pouring with free restarts, which is what actual
 *     fiddling looks like. Computed exactly: the probability that ONE careless batch comes out
 *     right.
 *
 * None of these ever backtracks, because the bench has no undo: a poured ladle is committed for
 * the rest of the batch. That is the point of the no-undo rule.
 */

import {
  type Batch,
  type RatioPuzzle,
  canPour,
  emptyBatch,
  isSolved,
  jarState,
  ladleSize,
  pour,
} from "./logic";

/** Indices of every vat that can legally be poured right now. */
function legalPours(puzzle: RatioPuzzle, batch: Batch): number[] {
  const out: number[] = [];
  puzzle.vats.forEach((_, i) => {
    if (canPour(puzzle, batch, i)) out.push(i);
  });
  return out;
}

/**
 * How far the jar's concentration sits from the target, as a non-negative integer (0 = exactly on
 * ratio). `dye/units` vs `targetDye/parts`, cross-multiplied so the comparison stays exact.
 */
function strengthError(puzzle: RatioPuzzle, batch: Batch): number {
  const { units, dye } = jarState(puzzle, batch);
  const parts = puzzle.targetDye + puzzle.targetWater;
  return Math.abs(dye * parts - puzzle.targetDye * units);
}

/** Runs a strategy to a stop: `choose` returns the vat to pour, or `null` to give up. */
function runBatch(
  puzzle: RatioPuzzle,
  choose: (batch: Batch, legal: number[]) => number | null,
): { batch: Batch; solved: boolean } {
  let batch = emptyBatch(puzzle);
  // Every pour adds at least 1 unit, so a batch cannot run longer than `capacity` steps.
  for (let step = 0; step <= puzzle.capacity; step++) {
    if (isSolved(puzzle, batch)) return { batch, solved: true };
    const legal = legalPours(puzzle, batch);
    if (legal.length === 0) break;
    const pick = choose(batch, legal);
    if (pick === null) break;
    batch = pour(puzzle, batch, pick);
  }
  return { batch, solved: isSolved(puzzle, batch) };
}

/** Strategy 1: keep the jar's ratio as near the target as possible, one pour at a time. */
export function tasteAndAdjust(puzzle: RatioPuzzle): boolean {
  return runBatch(puzzle, (batch, legal) => {
    let best = legal[0]!;
    let bestErr = Number.POSITIVE_INFINITY;
    for (const i of legal) {
      const err = strengthError(puzzle, pour(puzzle, batch, i));
      if (err < bestErr) {
        bestErr = err;
        best = i;
      }
    }
    return best;
  }).solved;
}

/** Strategy 2: always take the biggest ladle that still fits. */
export function biggestLadleFirst(puzzle: RatioPuzzle): boolean {
  return runBatch(puzzle, (_batch, legal) => {
    let best = legal[0]!;
    for (const i of legal) {
      if (ladleSize(puzzle.vats[i]!) > ladleSize(puzzle.vats[best]!)) best = i;
    }
    return best;
  }).solved;
}

/**
 * Strategy 3: pick a favourite vat and keep using it — the darkest one on the bench, or the
 * palest — falling back to whatever else fits when it runs out. `vats` is ordered weakest-first,
 * so this is "always the last legal vat" / "always the first legal vat".
 */
export function alwaysSameVat(puzzle: RatioPuzzle, prefer: "darkest" | "palest"): boolean {
  return runBatch(puzzle, (_batch, legal) =>
    prefer === "darkest" ? legal[legal.length - 1]! : legal[0]!,
  ).solved;
}

/** Strategy 4: a bit of each, in turn, skipping whatever will not fit. */
export function roundRobin(puzzle: RatioPuzzle, start = 0): boolean {
  let cursor = start;
  return runBatch(puzzle, (_batch, legal) => {
    for (let k = 0; k < puzzle.vats.length; k++) {
      const i = (cursor + k) % puzzle.vats.length;
      if (legal.includes(i)) {
        cursor = i + 1;
        return i;
      }
    }
    return null;
  }).solved;
}

/** Every deterministic non-reasoning strategy, run once. True if ANY of them lands the jar. */
export function anyNaiveStrategySolves(puzzle: RatioPuzzle): boolean {
  if (tasteAndAdjust(puzzle)) return true;
  if (biggestLadleFirst(puzzle)) return true;
  if (alwaysSameVat(puzzle, "darkest")) return true;
  if (alwaysSameVat(puzzle, "palest")) return true;
  for (let start = 0; start < puzzle.vats.length; start++) {
    if (roundRobin(puzzle, start)) return true;
  }
  return false;
}

/**
 * Strategy 4, computed EXACTLY rather than sampled.
 *
 * A child who has given up on thinking pours whatever fits, at random, and starts a fresh batch
 * when it comes out wrong. This returns the exact probability that one such batch ends with the
 * jar exactly full at exactly the target ratio — i.e. the chance blind fiddling gets there without
 * reasoning. Its reciprocal is the expected number of pour-it-out cycles blind fiddling needs.
 *
 * It is exact because the state space is finite and tiny: a state is a ladle-count vector inside
 * the stock box (at most a few thousand), every pour moves to a strictly larger total, and the
 * uniform choice among legal pours makes the whole thing a DAG we can push probability through in
 * one topological sweep. No sampling, no seed, no noise — so the generator can filter on it and a
 * test can assert on it without either being at the mercy of a lucky run.
 */
export function blindSuccessProbability(puzzle: RatioPuzzle): number {
  const radix = puzzle.vats.map((v) => v.stock + 1);
  const size = radix.reduce((a, b) => a * b, 1);

  const strides: number[] = [];
  let stride = 1;
  for (const r of radix) {
    strides.push(stride);
    stride *= r;
  }

  const decode = (index: number): number[] =>
    radix.map((r, i) => Math.floor(index / strides[i]!) % r);

  // Sweep states in order of total ladles poured: every pour adds exactly one, so this is a
  // topological order of the DAG.
  const order = Array.from({ length: size }, (_, i) => i);
  const totals = order.map((i) => decode(i).reduce((a, b) => a + b, 0));
  order.sort((a, b) => totals[a]! - totals[b]!);

  const prob = new Float64Array(size);
  prob[0] = 1;
  let success = 0;

  for (const index of order) {
    const p = prob[index]!;
    if (p === 0) continue;
    const counts = decode(index);
    if (isSolved(puzzle, counts)) {
      success += p;
      continue;
    }
    const legal = legalPours(puzzle, counts);
    if (legal.length === 0) continue; // dead end: this batch gets poured out
    const share = p / legal.length;
    for (const i of legal) {
      const target = index + strides[i]!;
      prob[target] = (prob[target] ?? 0) + share;
    }
  }

  return success;
}

/** mulberry32, local to this module so the naive models never perturb generator seeding. */
function rngFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Monte-Carlo version of `blindSuccessProbability`: actually plays `trials` careless batches and
 * reports the share that came out right. Nothing depends on it — it exists so a test can confirm
 * the exact DP above agrees with really playing the game.
 */
export function randomPourRate(puzzle: RatioPuzzle, trials = 400, seed = 1): number {
  const rng = rngFrom(seed);
  let wins = 0;
  for (let t = 0; t < trials; t++) {
    const { solved } = runBatch(puzzle, (_batch, legal) => {
      const pick = legal[Math.floor(rng() * legal.length)];
      return pick === undefined ? null : pick;
    });
    if (solved) wins++;
  }
  return wins / trials;
}
