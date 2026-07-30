// Hand-rolled, minimal chess move validation for authored tactic puzzles.
// This is NOT a full chess engine: no castling, en passant, promotion, check
// detection, or pins. It's just enough per-piece movement + blocking/capture
// logic to (a) reject nonsense moves and (b) recognize the scripted solution
// to an authored mate-in-1 / material-win puzzle.

export type Color = "w" | "b";
export type PieceType = "K" | "Q" | "R" | "B" | "N" | "P";

export interface Piece {
  type: PieceType;
  color: Color;
}

/** row 0 = rank 8 ... row 7 = rank 1; col 0 = file a ... col 7 = file h. */
export interface Square {
  row: number;
  col: number;
}

export type Board = (Piece | null)[][];

export interface Move {
  from: Square;
  to: Square;
}

export interface ChessPuzzle {
  id: string;
  prompt: string;
  playerColor: Color;
  board: Board;
  /** Alternating moves: player (even index), scripted opponent reply (odd index), ... */
  solution: Move[];
  hint?: string;
  /** Short tactic tag for display, e.g. "Fork", "Back-rank mate" (bank puzzles only). */
  label?: string;
}

export interface ChessGameState {
  board: Board;
  step: number;
  solved: boolean;
}

export type MoveResult =
  | { kind: "illegal" }
  | { kind: "wrong"; state: ChessGameState }
  | { kind: "correct"; state: ChessGameState };

export const inBounds = (row: number, col: number): boolean =>
  row >= 0 && row < 8 && col >= 0 && col < 8;

export const squaresEqual = (a: Square, b: Square): boolean => a.row === b.row && a.col === b.col;

/** Parse algebraic notation ("e4") into a Square. */
export function sq(file: string, rank: number): Square {
  return { row: 8 - rank, col: file.toLowerCase().charCodeAt(0) - 97 };
}

/** Render a Square back to algebraic notation ("e4"). */
export function squareName(square: Square): string {
  return `${String.fromCharCode(97 + square.col)}${8 - square.row}`;
}

export function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null as Piece | null));
}

export function boardFromPlacements(placements: { square: Square; piece: Piece }[]): Board {
  const board = emptyBoard();
  for (const { square, piece } of placements) {
    board[square.row]![square.col] = piece;
  }
  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

const ROOK_DIRS: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const BISHOP_DIRS: readonly [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

const ALL_DIRS: readonly [number, number][] = [...ROOK_DIRS, ...BISHOP_DIRS];

const KNIGHT_OFFSETS: readonly [number, number][] = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

function slideTargets(board: Board, from: Square, dirs: readonly [number, number][]): Square[] {
  const piece = board[from.row]?.[from.col];
  if (!piece) return [];
  const out: Square[] = [];
  for (const [dr, dc] of dirs) {
    let r = from.row + dr;
    let c = from.col + dc;
    while (inBounds(r, c)) {
      const occupant = board[r]![c];
      if (!occupant) {
        out.push({ row: r, col: c });
      } else {
        if (occupant.color !== piece.color) out.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return out;
}

function stepTargets(board: Board, from: Square, offsets: readonly [number, number][]): Square[] {
  const piece = board[from.row]?.[from.col];
  if (!piece) return [];
  const out: Square[] = [];
  for (const [dr, dc] of offsets) {
    const r = from.row + dr;
    const c = from.col + dc;
    if (!inBounds(r, c)) continue;
    const occupant = board[r]![c];
    if (!occupant || occupant.color !== piece.color) out.push({ row: r, col: c });
  }
  return out;
}

function pawnTargets(board: Board, from: Square): Square[] {
  const piece = board[from.row]?.[from.col];
  if (!piece) return [];
  const dir = piece.color === "w" ? -1 : 1;
  const startRow = piece.color === "w" ? 6 : 1;
  const out: Square[] = [];

  const oneRow = from.row + dir;
  if (inBounds(oneRow, from.col) && !board[oneRow]![from.col]) {
    out.push({ row: oneRow, col: from.col });
    const twoRow = from.row + 2 * dir;
    if (from.row === startRow && !board[twoRow]![from.col]) {
      out.push({ row: twoRow, col: from.col });
    }
  }

  for (const dc of [-1, 1]) {
    const r = oneRow;
    const c = from.col + dc;
    if (!inBounds(r, c)) continue;
    const occupant = board[r]![c];
    if (occupant && occupant.color !== piece.color) out.push({ row: r, col: c });
  }

  return out;
}

/** Pseudo-legal targets for the piece at `from` (ignores check/pins). */
export function legalTargets(board: Board, from: Square): Square[] {
  const piece = board[from.row]?.[from.col];
  if (!piece) return [];
  switch (piece.type) {
    case "P":
      return pawnTargets(board, from);
    case "N":
      return stepTargets(board, from, KNIGHT_OFFSETS);
    case "B":
      return slideTargets(board, from, BISHOP_DIRS);
    case "R":
      return slideTargets(board, from, ROOK_DIRS);
    case "Q":
      return slideTargets(board, from, ALL_DIRS);
    case "K":
      return stepTargets(board, from, ALL_DIRS);
    default:
      return [];
  }
}

export function isLegalMove(board: Board, move: Move): boolean {
  return legalTargets(board, move.from).some((s) => squaresEqual(s, move.to));
}

export function applyMove(board: Board, move: Move): Board {
  const next = cloneBoard(board);
  const piece = next[move.from.row]![move.from.col] ?? null;
  next[move.from.row]![move.from.col] = null;
  next[move.to.row]![move.to.col] = piece;
  return next;
}

export function initState(puzzle: ChessPuzzle): ChessGameState {
  return { board: cloneBoard(puzzle.board), step: 0, solved: false };
}

/**
 * Apply a player-attempted move against the puzzle's scripted solution.
 * - "illegal": not even a valid move for that piece — caller should ignore.
 * - "wrong": a legal move, but not the solution's next step — position resets.
 * - "correct": advances the solution (auto-playing any scripted opponent
 *   reply that follows) and marks `solved` once the sequence is complete.
 */
export function attemptMove(puzzle: ChessPuzzle, state: ChessGameState, move: Move): MoveResult {
  if (state.solved) return { kind: "illegal" };
  const piece = state.board[move.from.row]?.[move.from.col];
  if (!piece) return { kind: "illegal" };
  if (!isLegalMove(state.board, move)) return { kind: "illegal" };

  const expected = puzzle.solution[state.step];
  if (!expected || !squaresEqual(expected.from, move.from) || !squaresEqual(expected.to, move.to)) {
    return { kind: "wrong", state: initState(puzzle) };
  }

  let board = applyMove(state.board, move);
  let step = state.step + 1;

  const reply = puzzle.solution[step];
  if (reply && step % 2 === 1) {
    board = applyMove(board, reply);
    step += 1;
  }

  const solved = step >= puzzle.solution.length;
  return { kind: "correct", state: { board, step, solved } };
}
