import { Fragment } from "react";
import type { Board, Square } from "./logic";
import { squareName, squaresEqual } from "./logic";

export const GLYPHS: Record<string, string> = {
  wK: "♔",
  wQ: "♕",
  wR: "♖",
  wB: "♗",
  wN: "♘",
  wP: "♙",
  bK: "♚",
  bQ: "♛",
  bR: "♜",
  bB: "♝",
  bN: "♞",
  bP: "♟",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

export interface BoardGridProps {
  board: Board;
  selected: Square | null;
  targets: Square[];
  onSquareClick: (square: Square) => void;
}

/** The shared 8x8 cozy wood/parchment board grid — reused by both the
 * Tactics puzzles and Free Play so they render identically on-theme. */
export default function BoardGrid({ board, selected, targets, onSquareClick }: BoardGridProps) {
  return (
    <div
      className="cx-board"
      style={{
        gridTemplateColumns: "auto repeat(8, 2.6rem)",
        gridTemplateRows: "repeat(8, 2.6rem) auto",
      }}
    >
      {RANKS.map((rank, r) => (
        <Fragment key={`row-${rank}`}>
          <div className="cx-cell cx-rank-label">{rank}</div>
          {FILES.map((_, c) => {
            const square: Square = { row: r, col: c };
            const piece = board[r]?.[c] ?? null;
            const isLight = (r + c) % 2 === 0;
            const isSelected = selected ? squaresEqual(selected, square) : false;
            const isTarget = targets.some((t) => squaresEqual(t, square));
            const name = squareName(square);
            return (
              <button
                key={name}
                type="button"
                className={[
                  "cx-cell",
                  "cx-square",
                  isLight ? "cx-light" : "cx-dark",
                  isSelected ? "cx-selected" : "",
                  isTarget ? "cx-target" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-square={name}
                aria-label={
                  piece
                    ? `${name}: ${piece.color === "w" ? "white" : "black"} ${piece.type}`
                    : `${name}: empty`
                }
                onClick={() => onSquareClick(square)}
              >
                {piece ? (
                  <span className={`cx-piece cx-piece-${piece.color}`}>
                    {GLYPHS[`${piece.color}${piece.type}`]}
                  </span>
                ) : isTarget ? (
                  <span className="cx-dot" />
                ) : null}
              </button>
            );
          })}
        </Fragment>
      ))}
      <div className="cx-cell cx-corner" />
      {FILES.map((f) => (
        <div key={f} className="cx-cell cx-file-label">
          {f}
        </div>
      ))}
    </div>
  );
}
