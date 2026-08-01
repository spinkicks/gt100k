import { type ChessPuzzle, boardFromPlacements, sq } from "./logic";

// Puzzle 1 — classic back-rank mate. Black king is boxed in on h8 by its own
// pawns; the rook slides down the open a-file to a8 and it's mate in one.
const BACK_RANK_MATE: ChessPuzzle = {
  id: "back-rank-mate",
  prompt: "White to move — find checkmate in one.",
  playerColor: "w",
  board: boardFromPlacements([
    { square: sq("e", 1), piece: { type: "K", color: "w" } },
    { square: sq("a", 1), piece: { type: "R", color: "w" } },
    { square: sq("h", 8), piece: { type: "K", color: "b" } },
    { square: sq("g", 7), piece: { type: "P", color: "b" } },
    { square: sq("h", 7), piece: { type: "P", color: "b" } },
  ]),
  solution: [{ from: sq("a", 1), to: sq("a", 8) }],
};

// Puzzle 2 — knight hops in with check, the king's only reply is scripted,
// then the rook swoops down the h-file and wins the undefended queen.
const WIN_THE_QUEEN: ChessPuzzle = {
  id: "knight-fork-queen",
  prompt: "White to move — win the queen in two moves.",
  playerColor: "w",
  hint: "Not quite — the queen got away. Try again.",
  board: boardFromPlacements([
    { square: sq("e", 1), piece: { type: "K", color: "w" } },
    { square: sq("e", 4), piece: { type: "N", color: "w" } },
    { square: sq("h", 1), piece: { type: "R", color: "w" } },
    { square: sq("e", 8), piece: { type: "K", color: "b" } },
    { square: sq("h", 4), piece: { type: "Q", color: "b" } },
  ]),
  solution: [
    { from: sq("e", 4), to: sq("f", 6) },
    { from: sq("e", 8), to: sq("e", 7) },
    { from: sq("h", 1), to: sq("h", 4) },
  ],
};

export const PUZZLES: ChessPuzzle[] = [BACK_RANK_MATE, WIN_THE_QUEEN];
