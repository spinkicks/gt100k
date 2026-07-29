import type { LitsPuzzle } from "./logic";

// Each puzzle: a region map (jigsaw regions, >=4 cells each) + one verified-valid solution
// (each region shades exactly one L/I/T/S tetromino; all shaded cells form one connected
// group; no 2x2 block is fully shaded; same-type tetrominoes never touch edge-to-edge).

const PUZZLE_1: LitsPuzzle = {
  rows: 6,
  cols: 6,
  regions: [
    [3, 3, 0, 1, 1, 1],
    [3, 3, 0, 1, 1, 1],
    [3, 3, 0, 0, 1, 1],
    [0, 0, 0, 0, 2, 1],
    [0, 0, 0, 2, 2, 2],
    [0, 0, 0, 0, 2, 2],
  ],
  solution: [
    [true, false, false, false, true, false],
    [true, true, false, false, true, false],
    [false, true, true, false, true, true],
    [false, false, true, false, true, false],
    [false, false, true, true, true, true],
    [false, false, true, false, false, false],
  ],
};

const PUZZLE_2: LitsPuzzle = {
  rows: 6,
  cols: 7,
  regions: [
    [2, 2, 2, 2, 3, 3, 3],
    [2, 2, 2, 2, 3, 3, 3],
    [2, 2, 2, 0, 0, 3, 3],
    [0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0, 0, 0],
  ],
  solution: [
    [false, false, true, false, false, false, false],
    [false, false, true, true, true, true, false],
    [false, false, true, false, false, true, true],
    [false, false, true, true, true, true, false],
    [false, false, true, false, false, false, false],
    [true, true, true, false, false, false, false],
  ],
};

export const PUZZLES: LitsPuzzle[] = [PUZZLE_1, PUZZLE_2];
