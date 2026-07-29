import {
  applyMove,
  attemptMove,
  boardFromPlacements,
  emptyBoard,
  initState,
  isLegalMove,
  legalTargets,
  sq,
  squareName,
  squaresEqual,
} from "./logic";
import { PUZZLES } from "./puzzles.data";

describe("squares", () => {
  test("sq/squareName round-trip", () => {
    expect(sq("e", 4)).toEqual({ row: 4, col: 4 });
    expect(squareName({ row: 4, col: 4 })).toBe("e4");
    expect(sq("a", 8)).toEqual({ row: 0, col: 0 });
    expect(sq("h", 1)).toEqual({ row: 7, col: 7 });
  });

  test("squaresEqual", () => {
    expect(squaresEqual(sq("e", 4), sq("e", 4))).toBe(true);
    expect(squaresEqual(sq("e", 4), sq("e", 5))).toBe(false);
  });
});

describe("pawn moves", () => {
  test("white pawn can push one or two from start rank", () => {
    const board = boardFromPlacements([{ square: sq("e", 2), piece: { type: "P", color: "w" } }]);
    const targets = legalTargets(board, sq("e", 2));
    expect(targets).toEqual(expect.arrayContaining([sq("e", 3), sq("e", 4)]));
    expect(targets).toHaveLength(2);
  });

  test("white pawn blocked cannot push", () => {
    const board = boardFromPlacements([
      { square: sq("e", 2), piece: { type: "P", color: "w" } },
      { square: sq("e", 3), piece: { type: "P", color: "b" } },
    ]);
    expect(legalTargets(board, sq("e", 2))).toEqual([]);
  });

  test("pawn captures only diagonally onto an enemy piece", () => {
    const board = boardFromPlacements([
      { square: sq("e", 2), piece: { type: "P", color: "w" } },
      { square: sq("d", 3), piece: { type: "P", color: "b" } },
      { square: sq("f", 3), piece: { type: "P", color: "w" } },
    ]);
    const targets = legalTargets(board, sq("e", 2));
    expect(targets).toEqual(expect.arrayContaining([sq("e", 3), sq("d", 3)]));
    expect(targets).not.toEqual(expect.arrayContaining([sq("f", 3)]));
  });

  test("black pawn moves toward rank 1", () => {
    const board = boardFromPlacements([{ square: sq("e", 7), piece: { type: "P", color: "b" } }]);
    const targets = legalTargets(board, sq("e", 7));
    expect(targets).toEqual(expect.arrayContaining([sq("e", 6), sq("e", 5)]));
  });
});

describe("knight moves", () => {
  test("knight jumps in an L, ignoring blockers", () => {
    const board = boardFromPlacements([
      { square: sq("e", 4), piece: { type: "N", color: "w" } },
      { square: sq("e", 5), piece: { type: "P", color: "w" } },
    ]);
    const targets = legalTargets(board, sq("e", 4));
    expect(targets).toEqual(
      expect.arrayContaining([sq("f", 6), sq("d", 6), sq("g", 5), sq("g", 3)]),
    );
    expect(targets).toHaveLength(8);
  });

  test("knight cannot land on its own piece", () => {
    const board = boardFromPlacements([
      { square: sq("e", 4), piece: { type: "N", color: "w" } },
      { square: sq("f", 6), piece: { type: "P", color: "w" } },
    ]);
    expect(legalTargets(board, sq("e", 4))).not.toEqual(expect.arrayContaining([sq("f", 6)]));
  });
});

describe("sliding pieces", () => {
  test("rook slides until blocked by own piece", () => {
    const board = boardFromPlacements([
      { square: sq("a", 1), piece: { type: "R", color: "w" } },
      { square: sq("a", 4), piece: { type: "P", color: "w" } },
    ]);
    const targets = legalTargets(board, sq("a", 1));
    expect(targets).toEqual(expect.arrayContaining([sq("a", 2), sq("a", 3)]));
    expect(targets).not.toEqual(expect.arrayContaining([sq("a", 4), sq("a", 5)]));
  });

  test("rook captures the first enemy piece then stops", () => {
    const board = boardFromPlacements([
      { square: sq("a", 1), piece: { type: "R", color: "w" } },
      { square: sq("a", 4), piece: { type: "P", color: "b" } },
    ]);
    const targets = legalTargets(board, sq("a", 1));
    expect(targets).toEqual(expect.arrayContaining([sq("a", 2), sq("a", 3), sq("a", 4)]));
    expect(targets).not.toEqual(expect.arrayContaining([sq("a", 5)]));
  });

  test("bishop moves diagonally and stops at blockers", () => {
    const board = boardFromPlacements([{ square: sq("c", 1), piece: { type: "B", color: "w" } }]);
    const targets = legalTargets(board, sq("c", 1));
    expect(targets).toEqual(expect.arrayContaining([sq("a", 3), sq("h", 6)]));
  });

  test("queen combines rook and bishop movement", () => {
    const board = boardFromPlacements([{ square: sq("d", 1), piece: { type: "Q", color: "w" } }]);
    const targets = legalTargets(board, sq("d", 1));
    expect(targets).toEqual(
      expect.arrayContaining([sq("d", 8), sq("a", 1), sq("a", 4), sq("h", 5)]),
    );
  });
});

describe("king moves", () => {
  test("king moves one square in any direction, not onto own piece", () => {
    const board = boardFromPlacements([
      { square: sq("e", 1), piece: { type: "K", color: "w" } },
      { square: sq("e", 2), piece: { type: "P", color: "w" } },
    ]);
    const targets = legalTargets(board, sq("e", 1));
    expect(targets).toEqual(expect.arrayContaining([sq("d", 1), sq("f", 1), sq("d", 2)]));
    expect(targets).not.toEqual(expect.arrayContaining([sq("e", 2)]));
    expect(targets).toHaveLength(4);
  });
});

describe("applyMove / isLegalMove", () => {
  test("applyMove relocates the piece and clears the source square", () => {
    const board = boardFromPlacements([{ square: sq("a", 1), piece: { type: "R", color: "w" } }]);
    const next = applyMove(board, { from: sq("a", 1), to: sq("a", 8) });
    expect(next[sq("a", 1).row]![sq("a", 1).col]).toBeNull();
    expect(next[sq("a", 8).row]![sq("a", 8).col]).toEqual({ type: "R", color: "w" });
  });

  test("legalTargets on an empty square is empty", () => {
    expect(legalTargets(emptyBoard(), sq("e", 4))).toEqual([]);
  });

  test("isLegalMove rejects a move the piece cannot make", () => {
    const board = boardFromPlacements([{ square: sq("a", 1), piece: { type: "R", color: "w" } }]);
    expect(isLegalMove(board, { from: sq("a", 1), to: sq("b", 2) })).toBe(false);
    expect(isLegalMove(board, { from: sq("a", 1), to: sq("a", 8) })).toBe(true);
  });
});

describe("attemptMove — puzzle solution detection", () => {
  test("back-rank mate: the single scripted move solves the puzzle", () => {
    const puzzle = PUZZLES[0]!;
    const state = initState(puzzle);
    const result = attemptMove(puzzle, state, { from: sq("a", 1), to: sq("a", 8) });
    expect(result.kind).toBe("correct");
    if (result.kind === "correct") expect(result.state.solved).toBe(true);
  });

  test("a legal but wrong move resets the position instead of solving it", () => {
    const puzzle = PUZZLES[0]!;
    const state = initState(puzzle);
    const result = attemptMove(puzzle, state, { from: sq("a", 1), to: sq("a", 5) });
    expect(result.kind).toBe("wrong");
    if (result.kind === "wrong") {
      expect(result.state.solved).toBe(false);
      expect(result.state.step).toBe(0);
      expect(result.state.board).toEqual(puzzle.board);
    }
  });

  test("an illegal (nonsense) move is rejected outright", () => {
    const puzzle = PUZZLES[0]!;
    const state = initState(puzzle);
    // Rook cannot move diagonally.
    const result = attemptMove(puzzle, state, { from: sq("a", 1), to: sq("b", 2) });
    expect(result.kind).toBe("illegal");
  });

  test("win-the-queen: player move -> auto opponent reply -> player move solves it", () => {
    const puzzle = PUZZLES[1]!;
    let state = initState(puzzle);

    const first = attemptMove(puzzle, state, { from: sq("e", 4), to: sq("f", 6) });
    expect(first.kind).toBe("correct");
    if (first.kind !== "correct") throw new Error("unreachable");
    state = first.state;
    expect(state.solved).toBe(false);
    // The scripted black king reply should already have been auto-played.
    expect(state.board[sq("e", 8).row]![sq("e", 8).col]).toBeNull();
    expect(state.board[sq("e", 7).row]![sq("e", 7).col]).toEqual({ type: "K", color: "b" });

    const second = attemptMove(puzzle, state, { from: sq("h", 1), to: sq("h", 4) });
    expect(second.kind).toBe("correct");
    if (second.kind !== "correct") throw new Error("unreachable");
    expect(second.state.solved).toBe(true);
    expect(second.state.board[sq("h", 4).row]![sq("h", 4).col]).toEqual({
      type: "R",
      color: "w",
    });
  });

  test("attemptMove on an already-solved state is illegal", () => {
    const puzzle = PUZZLES[0]!;
    const solved = { ...initState(puzzle), solved: true };
    expect(attemptMove(puzzle, solved, { from: sq("a", 1), to: sq("a", 8) }).kind).toBe("illegal");
  });
});
