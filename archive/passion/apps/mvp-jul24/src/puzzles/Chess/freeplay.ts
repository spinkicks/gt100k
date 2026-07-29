// Free Play vs AI — a full, legal game of chess (player = White, AI = Black)
// powered by chess.js for rules (legality, check/checkmate/stalemate/draw
// detection). This module owns:
//   - board/square conversions between chess.js and our shared UI shapes
//   - game-over / status detection
//   - a simple, deterministic-ish material-minimax AI move chooser
//
// The tactic puzzles' hand-rolled `logic.ts` is untouched and unaffected.

import { Chess } from "chess.js";
import type { Move as ChessJsMove, Square as ChessJsSquare, PieceSymbol } from "chess.js";
import type { Board, Color, Piece, PieceType, Square } from "./logic";
import { sq, squareName } from "./logic";

export type { ChessJsMove };

const SYMBOL_TO_TYPE: Record<PieceSymbol, PieceType> = {
  p: "P",
  n: "N",
  b: "B",
  r: "R",
  q: "Q",
  k: "K",
};

/** Standard material values; the king is priceless so it scores 0 here —
 * checkmate is handled explicitly, not via a huge king value. */
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

/** Start a fresh, standard game. Player is White, AI is Black. */
export function createFreeplayGame(): Chess {
  return new Chess();
}

/** Convert a chess.js board() snapshot into our shared `Board` shape so the
 * existing `BoardGrid` renderer (and its glyphs/CSS) can be reused as-is. */
export function toOurBoard(chess: Chess): Board {
  return chess
    .board()
    .map((row) =>
      row.map((cell): Piece | null =>
        cell ? { type: SYMBOL_TO_TYPE[cell.type], color: cell.color as Color } : null,
      ),
    );
}

export function algebraicToSquare(algebraic: string): Square {
  return sq(algebraic[0]!, Number(algebraic[1]));
}

export function squareToAlgebraic(square: Square): ChessJsSquare {
  return squareName(square) as ChessJsSquare;
}

/** Legal destination squares (in our `{row,col}` shape) for the piece on
 * `square`, per chess.js's full rule set (castling, en passant, pins, ...). */
export function legalTargets(chess: Chess, square: Square): Square[] {
  const from = squareToAlgebraic(square);
  const moves = chess.moves({ square: from, verbose: true }) as ChessJsMove[];
  return moves.map((m) => algebraicToSquare(m.to));
}

/** Attempt the player's move. Returns the resulting Move on success, or null
 * if chess.js rejects it (defensive — callers should only invoke this for a
 * destination already surfaced by `legalTargets`). Always auto-promotes to
 * queen since the UI has no promotion picker. */
export function tryMove(chess: Chess, from: Square, to: Square): ChessJsMove | null {
  try {
    return chess.move({
      from: squareToAlgebraic(from),
      to: squareToAlgebraic(to),
      promotion: "q",
    });
  } catch {
    return null;
  }
}

export type GameStatus =
  | { kind: "playing"; inCheck: boolean }
  | { kind: "checkmate"; winner: Color }
  | { kind: "stalemate" }
  | { kind: "draw" };

export function getGameStatus(chess: Chess): GameStatus {
  if (chess.isCheckmate()) {
    // The side *to move* is the one who has been mated.
    return { kind: "checkmate", winner: chess.turn() === "w" ? "b" : "w" };
  }
  if (chess.isStalemate()) return { kind: "stalemate" };
  if (chess.isDraw()) return { kind: "draw" };
  return { kind: "playing", inCheck: chess.isCheck() };
}

export function statusMessage(status: GameStatus): string {
  switch (status.kind) {
    case "checkmate":
      return status.winner === "w" ? "Checkmate — you win!" : "Checkmate — the AI wins.";
    case "stalemate":
      return "Stalemate — it's a draw.";
    case "draw":
      return "Draw.";
    case "playing":
      return status.inCheck ? "Check!" : "";
  }
}

/** Material balance from White's perspective: positive favors White. */
export function evaluateMaterial(chess: Chess): number {
  let score = 0;
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell) continue;
      const value = PIECE_VALUES[cell.type];
      score += cell.color === "w" ? value : -value;
    }
  }
  return score;
}

function cloneWithMove(chess: Chess, move: ChessJsMove): Chess {
  const next = new Chess(chess.fen());
  next.move({ from: move.from, to: move.to, promotion: move.promotion ?? "q" });
  return next;
}

const MATE_SCORE = 1000;

/** Material-only position value from White's perspective, looking `depth`
 * plies ahead: White maximizes, Black minimizes, at each level. Depth 0 (or
 * a terminal position) is scored directly by material, with checkmate
 * scored as a large win/loss rather than by piece count. */
function minimaxEval(chess: Chess, depth: number): number {
  if (chess.isCheckmate()) return chess.turn() === "w" ? -MATE_SCORE : MATE_SCORE;
  if (depth <= 0 || chess.isDraw() || chess.isStalemate()) return evaluateMaterial(chess);

  const moves = chess.moves({ verbose: true }) as ChessJsMove[];
  if (moves.length === 0) return evaluateMaterial(chess);

  const maximizing = chess.turn() === "w";
  let best = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  for (const move of moves) {
    const value = minimaxEval(cloneWithMove(chess, move), depth - 1);
    best = maximizing ? Math.max(best, value) : Math.min(best, value);
  }
  return best;
}

/**
 * Choose a move for whichever side is to move, via a depth-2 material
 * minimax (this move, then the opponent's best material reply). Not random:
 * it always prefers the move with the best worst-case material outcome, and
 * a free/undefended capture will score strictly better than doing nothing.
 * Ties (within a small epsilon) are broken with a touch of randomness so
 * the AI doesn't play the exact same game every time.
 */
export function chooseAiMove(
  chess: Chess,
  depth = 2,
  rng: () => number = Math.random,
): ChessJsMove | null {
  const moves = chess.moves({ verbose: true }) as ChessJsMove[];
  if (moves.length === 0) return null;

  const maximizing = chess.turn() === "w";
  const scored = moves.map((move) => ({
    move,
    score: minimaxEval(cloneWithMove(chess, move), depth - 1),
  }));

  const bestScore = maximizing
    ? Math.max(...scored.map((s) => s.score))
    : Math.min(...scored.map((s) => s.score));

  const EPSILON = 0.25;
  const nearBest = scored.filter((s) => Math.abs(s.score - bestScore) <= EPSILON);
  const pick = nearBest[Math.floor(rng() * nearBest.length)] ?? scored[0]!;
  return pick.move;
}
