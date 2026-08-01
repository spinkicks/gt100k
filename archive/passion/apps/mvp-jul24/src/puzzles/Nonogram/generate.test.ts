import { generatePuzzle, solveUnique } from "./generate";
import { deriveClues } from "./logic";

const SEEDS = Array.from({ length: 30 }, (_, i) => i * 97 + 3);

test.each(SEEDS)("seed %i generates a puzzle with a unique solution", (seed) => {
  const puzzle = generatePuzzle(seed);
  const solved = solveUnique(puzzle.size, puzzle.rowClues, puzzle.colClues);
  expect(solved).not.toBeNull();
  expect(solved).toEqual(puzzle.solution);
});

test.each(SEEDS)("seed %i clues match the generated bitmap", (seed) => {
  const puzzle = generatePuzzle(seed);
  const { rowClues, colClues } = deriveClues(puzzle.solution);
  expect(puzzle.rowClues).toEqual(rowClues);
  expect(puzzle.colClues).toEqual(colClues);
});

test.each(SEEDS)("seed %i has no fully-empty row or column", (seed) => {
  const puzzle = generatePuzzle(seed);
  for (const row of puzzle.solution) expect(row.some(Boolean)).toBe(true);
  for (let c = 0; c < puzzle.size; c++) {
    expect(puzzle.solution.some((row) => row[c])).toBe(true);
  }
});

test("generatePuzzle is deterministic for a given seed", () => {
  const a = generatePuzzle(12345);
  const b = generatePuzzle(12345);
  expect(a).toEqual(b);
});

test("different seeds (usually) produce different puzzles", () => {
  const solutions = SEEDS.slice(0, 10).map((s) => JSON.stringify(generatePuzzle(s).solution));
  const unique = new Set(solutions);
  // Not a strict guarantee, but collisions across 10 varied seeds on a
  // 5x5 board would be exceptionally unlikely if the generator worked.
  expect(unique.size).toBeGreaterThan(5);
});

test("supports larger boards (8x8) with a unique solution", () => {
  const puzzle = generatePuzzle(777, 8);
  expect(puzzle.size).toBe(8);
  const solved = solveUnique(puzzle.size, puzzle.rowClues, puzzle.colClues);
  expect(solved).toEqual(puzzle.solution);
});

describe("solveUnique", () => {
  test("detects ambiguity for an all-empty-clue board (many valid solutions)", () => {
    // A 2x2 board where every clue is [0] has exactly one solution
    // (all-empty) — a genuinely ambiguous case needs a real 2-solution
    // board. Use a classic ambiguous nonogram: two 1x1 blocks in a 2x2
    // grid whose row/col clues ([1],[1]) admit both the "identity" and
    // the "anti-diagonal" placements.
    const rowClues = [[1], [1]];
    const colClues = [[1], [1]];
    const solved = solveUnique(2, rowClues, colClues);
    expect(solved).toBeNull();
  });

  test("resolves an unambiguous board fully", () => {
    // Solid 2x2 square: clues [2],[2]/[2],[2] force every cell filled.
    const rowClues = [[2], [2]];
    const colClues = [[2], [2]];
    const solved = solveUnique(2, rowClues, colClues);
    expect(solved).toEqual([
      [true, true],
      [true, true],
    ]);
  });
});

// The PRNG this generator draws from is shared and tested in src/lib/rng.test.ts, which pins its
// stream against a frozen sequence — a stronger guarantee than the per-generator determinism check
// that used to sit here.
