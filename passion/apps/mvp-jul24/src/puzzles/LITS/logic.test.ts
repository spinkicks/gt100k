import {
  allShadedCellsConnected,
  blankShade,
  checkLits,
  classifyTetromino,
  hasFullyShaded2x2,
  isSolved,
  shadeFromSolution,
} from "./logic";
import { PUZZLES } from "./puzzles.data";

describe("classifyTetromino", () => {
  test("recognizes an I tetromino (straight line)", () => {
    expect(
      classifyTetromino([
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ]),
    ).toBe("I");
  });

  test("recognizes a rotated I tetromino (vertical)", () => {
    expect(
      classifyTetromino([
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ]),
    ).toBe("I");
  });

  test("recognizes an L tetromino and its mirror (J)", () => {
    expect(
      classifyTetromino([
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1],
      ]),
    ).toBe("L");
    expect(
      classifyTetromino([
        [0, 1],
        [1, 1],
        [2, 1],
        [2, 0],
      ]),
    ).toBe("L");
  });

  test("recognizes a T tetromino", () => {
    expect(
      classifyTetromino([
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 1],
      ]),
    ).toBe("T");
  });

  test("recognizes an S tetromino and its mirror (Z)", () => {
    expect(
      classifyTetromino([
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
      ]),
    ).toBe("S");
    expect(
      classifyTetromino([
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 2],
      ]),
    ).toBe("S");
  });

  test("rejects a square (O tetromino)", () => {
    expect(
      classifyTetromino([
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ]),
    ).toBeNull();
  });

  test("rejects a disconnected group of 4 cells", () => {
    expect(
      classifyTetromino([
        [0, 0],
        [0, 1],
        [5, 5],
        [5, 6],
      ]),
    ).toBeNull();
  });

  test("rejects groups that aren't exactly 4 cells", () => {
    expect(
      classifyTetromino([
        [0, 0],
        [0, 1],
        [0, 2],
      ]),
    ).toBeNull();
  });
});

describe("hasFullyShaded2x2 / allShadedCellsConnected", () => {
  test("detects a fully shaded 2x2 block", () => {
    const shade = blankShade(3, 3);
    shade[0]![0] = true;
    shade[0]![1] = true;
    shade[1]![0] = true;
    shade[1]![1] = true;
    expect(hasFullyShaded2x2(shade, 3, 3)).toBe(true);
  });

  test("does not flag a partial 2x2 block", () => {
    const shade = blankShade(3, 3);
    shade[0]![0] = true;
    shade[0]![1] = true;
    shade[1]![0] = true;
    expect(hasFullyShaded2x2(shade, 3, 3)).toBe(false);
  });

  test("flags disconnected shaded groups", () => {
    const shade = blankShade(4, 4);
    shade[0]![0] = true;
    shade[3]![3] = true;
    expect(allShadedCellsConnected(shade, 4, 4)).toBe(false);
  });

  test("an empty board is vacuously connected", () => {
    expect(allShadedCellsConnected(blankShade(4, 4), 4, 4)).toBe(true);
  });
});

describe("checkLits / isSolved against authored puzzles", () => {
  test.each(PUZZLES.map((p, i) => [i, p] as const))(
    "puzzle %i: the known solution passes",
    (_i, puzzle) => {
      const shade = shadeFromSolution(puzzle);
      const result = checkLits(shade, puzzle);
      expect(result.violations).toEqual([]);
      expect(result.solved).toBe(true);
      expect(isSolved(shade, puzzle)).toBe(true);
    },
  );

  test.each(PUZZLES.map((p, i) => [i, p] as const))(
    "puzzle %i: an empty board fails",
    (_i, puzzle) => {
      expect(isSolved(blankShade(puzzle.rows, puzzle.cols), puzzle)).toBe(false);
    },
  );

  test.each(PUZZLES.map((p, i) => [i, p] as const))(
    "puzzle %i: a partial (subset) shading fails",
    (_i, puzzle) => {
      const shade = shadeFromSolution(puzzle);
      // Un-shade one cell of the known solution: no longer a full tetromino set.
      outer: for (let r = 0; r < puzzle.rows; r++) {
        for (let c = 0; c < puzzle.cols; c++) {
          if (shade[r]![c]) {
            shade[r]![c] = false;
            break outer;
          }
        }
      }
      expect(isSolved(shade, puzzle)).toBe(false);
    },
  );

  test.each(PUZZLES.map((p, i) => [i, p] as const))(
    "puzzle %i: shading every cell fails (2x2 + wrong region counts)",
    (_i, puzzle) => {
      const shade = Array.from({ length: puzzle.rows }, () =>
        Array.from({ length: puzzle.cols }, () => true),
      );
      expect(isSolved(shade, puzzle)).toBe(false);
    },
  );

  test("puzzle 0: an invalid shift of the solution breaks connectivity/shape and fails", () => {
    const puzzle = PUZZLES[0]!;
    const shade = blankShade(puzzle.rows, puzzle.cols);
    // Shade an arbitrary 4-cell 2x2 block inside region 0 — violates the 2x2 rule and isn't
    // a valid tetromino shape either way.
    shade[1]![1] = true;
    shade[1]![2] = true;
    shade[2]![1] = true;
    shade[2]![2] = true;
    const result = checkLits(shade, puzzle);
    expect(result.solved).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });
});
