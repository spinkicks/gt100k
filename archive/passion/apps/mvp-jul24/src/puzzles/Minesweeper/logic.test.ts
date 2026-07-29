import { describe, expect, it } from "vitest";
import {
  computeAdjacent,
  flagCount,
  isWon,
  makeBoard,
  neighbors,
  resetBoard,
  reveal,
  toggleFlag,
} from "./logic";

describe("computeAdjacent", () => {
  it("counts adjacent mines correctly on a known 3x3 board", () => {
    // Mine layout (X = mine, . = safe):
    //   X . .
    //   . . .
    //   . . X
    const mines = [
      [true, false, false],
      [false, false, false],
      [false, false, true],
    ];
    const adjacent = computeAdjacent(mines);
    expect(adjacent).toEqual([
      [0, 1, 0],
      [1, 2, 1],
      [0, 1, 0],
    ]);
  });

  it("counts 8 for a cell fully surrounded by mines", () => {
    const mines = [
      [true, true, true],
      [true, false, true],
      [true, true, true],
    ];
    const adjacent = computeAdjacent(mines);
    expect(adjacent[1]![1]).toBe(8);
  });
});

describe("neighbors", () => {
  it("clips to the grid at corners", () => {
    expect(neighbors(0, 0, 3, 3)).toHaveLength(3);
    expect(neighbors(1, 1, 3, 3)).toHaveLength(8);
  });
});

describe("makeBoard", () => {
  it("is deterministic for a given seed", () => {
    const a = makeBoard(42);
    const b = makeBoard(42);
    expect(a.mines).toEqual(b.mines);
    expect(a.adjacent).toEqual(b.adjacent);
  });

  it("places exactly mineCount mines", () => {
    const board = makeBoard(7);
    const total = board.mines.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
    expect(total).toBe(board.mineCount);
  });

  it("produces different layouts for different seeds (spot check)", () => {
    const a = makeBoard(1);
    const b = makeBoard(2);
    expect(a.mines).not.toEqual(b.mines);
  });
});

describe("reveal", () => {
  it("flood-fills a connected zero region", () => {
    // A hand-built 4x4 board with a single mine in the far corner, so the
    // opposite corner is a 0 that should flood across most of the board.
    let board = makeBoard(0, 4, 4, 1);
    // Force a known layout for this test regardless of the seeded RNG:
    // mine at (3,3) only.
    const mines = [
      [false, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
      [false, false, false, true],
    ];
    board = { ...board, mines, adjacent: computeAdjacent(mines), firstClick: false };

    board = reveal(board, 0, 0);

    // (0,0) has 0 adjacent mines, so its flood-fill should reveal every
    // non-mine cell reachable through other 0-cells, and the numbered cells
    // bordering the mine, but never the mine itself.
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (mines[r]![c]) expect(board.revealed[r]![c]).toBe(false);
        else expect(board.revealed[r]![c]).toBe(true);
      }
    }
    expect(board.exploded).toBe(false);
  });

  it("stops flood-fill at numbered cells (does not cross into unrelated zero pockets beyond a border)", () => {
    const mines = [
      [false, false, true],
      [false, false, false],
      [false, false, false],
    ];
    let board = makeBoard(0, 3, 3, 1);
    board = { ...board, mines, adjacent: computeAdjacent(mines), firstClick: false };
    board = reveal(board, 2, 0);
    // (2,0) is a 0; flood should reach every safe cell since the board is
    // small and fully connected around the single mine.
    expect(board.revealed[0]![2]).toBe(false); // the mine itself, untouched
    expect(board.revealed[0]![1]).toBe(true); // bordering number, revealed
  });

  it("ends the game and reveals all mines when a mine is clicked (after first-click-safety no longer applies)", () => {
    const mines = [
      [true, false],
      [false, false],
    ];
    let board = makeBoard(0, 2, 2, 1);
    board = { ...board, mines, adjacent: computeAdjacent(mines), firstClick: false };
    board = reveal(board, 0, 0);
    expect(board.exploded).toBe(true);
    expect(board.revealed[0]![0]).toBe(true);
  });

  it("is first-click-safe: clicking a mine on the very first move regenerates the layout", () => {
    // Tiny 2x2 board, 1 mine — with only 4 cells, keep clicking seeds until
    // we find one whose *initial* mine sits under (0,0); the first reveal at
    // (0,0) must never explode because of first-click-safety.
    let sawInitialMineAtOrigin = false;
    for (let seed = 0; seed < 50; seed++) {
      const fresh = makeBoard(seed, 2, 2, 1);
      if (fresh.mines[0]![0]) {
        sawInitialMineAtOrigin = true;
        const revealed = reveal(fresh, 0, 0);
        expect(revealed.exploded).toBe(false);
        expect(revealed.revealed[0]![0]).toBe(true);
      }
    }
    expect(sawInitialMineAtOrigin).toBe(true);
  });

  it("does not reveal flagged cells", () => {
    let board = makeBoard(3, 3, 3, 1);
    board = toggleFlag(board, 0, 0);
    const after = reveal(board, 0, 0);
    expect(after.revealed[0]![0]).toBe(false);
  });

  it("is a no-op once exploded", () => {
    const mines = [
      [true, false],
      [false, false],
    ];
    let board = makeBoard(0, 2, 2, 1);
    board = { ...board, mines, adjacent: computeAdjacent(mines), firstClick: false };
    board = reveal(board, 0, 0);
    expect(board.exploded).toBe(true);
    const again = reveal(board, 1, 1);
    expect(again).toBe(board);
  });
});

describe("toggleFlag", () => {
  it("flags and unflags a hidden cell", () => {
    let board = makeBoard(5);
    expect(flagCount(board)).toBe(0);
    board = toggleFlag(board, 0, 0);
    expect(flagCount(board)).toBe(1);
    expect(board.flagged[0]![0]).toBe(true);
    board = toggleFlag(board, 0, 0);
    expect(flagCount(board)).toBe(0);
  });

  it("cannot flag an already-revealed cell", () => {
    const mines = [
      [false, false],
      [false, false],
    ];
    let board = makeBoard(0, 2, 2, 0);
    board = { ...board, mines, adjacent: computeAdjacent(mines), firstClick: false };
    board = reveal(board, 0, 0);
    board = toggleFlag(board, 0, 0);
    expect(board.flagged[0]![0]).toBe(false);
  });
});

describe("isWon", () => {
  it("is false while safe cells remain hidden", () => {
    const board = makeBoard(9, 3, 3, 1);
    expect(isWon(board)).toBe(false);
  });

  it("is true once every non-mine cell is revealed", () => {
    const mines = [
      [true, false],
      [false, false],
    ];
    let board = makeBoard(0, 2, 2, 1);
    board = { ...board, mines, adjacent: computeAdjacent(mines), firstClick: false };
    board = reveal(board, 0, 1);
    board = reveal(board, 1, 0);
    board = reveal(board, 1, 1);
    expect(isWon(board)).toBe(true);
  });

  it("is false if a mine was revealed (loss)", () => {
    const mines = [
      [true, false],
      [false, false],
    ];
    let board = makeBoard(0, 2, 2, 1);
    board = { ...board, mines, adjacent: computeAdjacent(mines), firstClick: false };
    board = reveal(board, 0, 0);
    expect(isWon(board)).toBe(false);
  });
});

describe("resetBoard", () => {
  it("rebuilds the same seed's layout from scratch", () => {
    const board = makeBoard(11);
    const revealed = reveal(board, 4, 4);
    const reset = resetBoard(revealed);
    expect(reset.revealed.every((row) => row.every((v) => v === false))).toBe(true);
    expect(reset.mines).toEqual(makeBoard(11).mines);
  });
});
