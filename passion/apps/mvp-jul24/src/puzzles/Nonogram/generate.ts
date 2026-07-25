// Procedural nonogram generator with a guaranteed-unique-solution check.
//
// Approach:
//   1. Seeded PRNG -> random bitmap (fill density ~45-60%, no fully-empty
//      row/col, so every clue is non-trivial).
//   2. Derive row/col clues from the bitmap (reusing `deriveClues`).
//   3. Run a line-solver: constraint propagation over rows and columns,
//      iterated to a fixpoint. If the solver fully determines every cell
//      (no cell left "unknown") without contradiction, the puzzle is
//      GUARANTEED to have a unique solution: every deduction step only
//      keeps cell values that are forced identically across *every*
//      grid consistent with the clues seen so far, so a full resolution
//      necessarily equals the one true solution for those clues.
//   4. If the solver can't fully resolve the board (ambiguous or
//      contradictory), discard the bitmap and try again with the next
//      draw from the same seeded PRNG. Determinism holds because the
//      PRNG sequence for a given seed is fixed.

import { type NonogramPuzzle, deriveClues, makePuzzle } from "./logic";

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) — small, fast, deterministic for a given seed.
// ---------------------------------------------------------------------------
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Random bitmap generation.
// ---------------------------------------------------------------------------
function randomBitmap(rng: () => number, size: number, density: number): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => rng() < density),
  );
  // Avoid trivial/degenerate lines: every row and column must have at
  // least one filled cell.
  for (let r = 0; r < size; r++) {
    if (grid[r]!.every((v) => !v)) grid[r]![Math.floor(rng() * size)] = true;
  }
  for (let c = 0; c < size; c++) {
    if (grid.every((row) => !row[c])) grid[Math.floor(rng() * size)]![c] = true;
  }
  return grid;
}

// ---------------------------------------------------------------------------
// Line solver — the core of the uniqueness guarantee.
// ---------------------------------------------------------------------------

/** -1 = known empty, 0 = unknown, 1 = known filled. */
type LineState = -1 | 0 | 1;

/** All boolean lines of length `n` consistent with `clue` (ignores other lines). */
function enumerateLinePlacements(n: number, clue: number[]): boolean[][] {
  const blocks = clue.length === 1 && clue[0] === 0 ? [] : clue;
  const k = blocks.length;
  const results: boolean[][] = [];
  const line = new Array<boolean>(n).fill(false);

  if (k === 0) return [line.slice()];

  const place = (blockIndex: number, minStart: number) => {
    if (blockIndex === k) {
      results.push(line.slice());
      return;
    }
    const len = blocks[blockIndex]!;
    let restMin = 0;
    for (let i = blockIndex + 1; i < k; i++) restMin += blocks[i]! + 1;
    const maxStart = n - restMin - len;
    for (let start = minStart; start <= maxStart; start++) {
      for (let i = start; i < start + len; i++) line[i] = true;
      place(blockIndex + 1, start + len + 1);
      for (let i = start; i < start + len; i++) line[i] = false;
    }
  };
  place(0, 0);
  return results;
}

function consistentWithKnown(line: boolean[], known: LineState[]): boolean {
  for (let i = 0; i < line.length; i++) {
    const k = known[i];
    if (k === 1 && !line[i]) return false;
    if (k === -1 && line[i]) return false;
  }
  return true;
}

/**
 * Narrows `known` (length n) using every placement of `clue` consistent with
 * it. Returns the narrowed state, or `null` if no placement is consistent
 * (contradiction — the bitmap this clue came from can't actually satisfy it,
 * which should never happen for a clue derived from a real solution unless a
 * different line's deduction was wrong; treated as "reject candidate").
 */
function solveLine(n: number, clue: number[], known: LineState[]): LineState[] | null {
  const placements = enumerateLinePlacements(n, clue).filter((line) =>
    consistentWithKnown(line, known),
  );
  if (placements.length === 0) return null;
  const out = known.slice();
  for (let i = 0; i < n; i++) {
    if (out[i] !== 0) continue;
    const allFilled = placements.every((p) => p[i]);
    const allEmpty = placements.every((p) => !p[i]);
    if (allFilled) out[i] = 1;
    else if (allEmpty) out[i] = -1;
  }
  return out;
}

/**
 * Runs row/column constraint propagation to a fixpoint. Returns the fully
 * resolved solution grid if — and only if — every cell was determined
 * (i.e. the clues admit exactly one solution reachable by line-solving).
 * Returns `null` if the board is ambiguous (some cell stays unknown) or
 * contradictory.
 */
export function solveUnique(
  size: number,
  rowClues: number[][],
  colClues: number[][],
): boolean[][] | null {
  const grid: LineState[][] = Array.from({ length: size }, () =>
    new Array<LineState>(size).fill(0),
  );

  let changed = true;
  while (changed) {
    changed = false;

    for (let r = 0; r < size; r++) {
      const solved = solveLine(size, rowClues[r]!, grid[r]!);
      if (!solved) return null;
      for (let c = 0; c < size; c++) {
        if (solved[c] !== grid[r]![c]) {
          grid[r]![c] = solved[c]!;
          changed = true;
        }
      }
    }

    for (let c = 0; c < size; c++) {
      const colKnown = grid.map((row) => row[c]!);
      const solved = solveLine(size, colClues[c]!, colKnown);
      if (!solved) return null;
      for (let r = 0; r < size; r++) {
        if (solved[r] !== grid[r]![c]) {
          grid[r]![c] = solved[r]!;
          changed = true;
        }
      }
    }
  }

  if (grid.some((row) => row.some((v) => v === 0))) return null;
  return grid.map((row) => row.map((v) => v === 1));
}

export function hasUniqueSolution(puzzle: NonogramPuzzle): boolean {
  const solved = solveUnique(puzzle.size, puzzle.rowClues, puzzle.colClues);
  return solved !== null;
}

// ---------------------------------------------------------------------------
// Puzzle generation.
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5000;

/**
 * Generates a nonogram puzzle deterministically from `seed`. Every returned
 * puzzle is guaranteed to have a unique solution (verified by `solveUnique`
 * above) — bitmaps that don't fully resolve via line-solving are discarded
 * and regenerated from the same seeded PRNG stream until one does.
 */
export function generatePuzzle(seed: number, size = 5): NonogramPuzzle {
  const rng = mulberry32(seed);
  const density = 0.45 + rng() * 0.15; // ~45%-60% fill

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const bitmap = randomBitmap(rng, size, density);
    const { rowClues, colClues } = deriveClues(bitmap);
    if (solveUnique(size, rowClues, colClues) !== null) {
      return makePuzzle(bitmap);
    }
  }

  throw new Error(
    `generatePuzzle: could not find a uniquely-solvable ${size}x${size} nonogram for seed ${seed}`,
  );
}
