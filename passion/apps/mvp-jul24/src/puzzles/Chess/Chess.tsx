import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import {
  type ChessGameState,
  type Square,
  attemptMove,
  initState,
  legalTargets,
  squareName,
  squaresEqual,
} from "./logic";
import { PUZZLES } from "./puzzles.data";
import "./Chess.css";

const GLYPHS: Record<string, string> = {
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

export default function Chess({ seed, onSolved, onExit }: PuzzleProps) {
  const puzzle = useMemo(() => PUZZLES[seed % PUZZLES.length]!, [seed]);
  const [state, setState] = useState<ChessGameState>(() => initState(puzzle));
  const [selected, setSelected] = useState<Square | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const solvedRef = useRef(false);

  // Reset whenever a new puzzle is loaded (seed change).
  useEffect(() => {
    setState(initState(puzzle));
    setSelected(null);
    setMessage(null);
    solvedRef.current = false;
  }, [puzzle]);

  useEffect(() => {
    if (state.solved && !solvedRef.current) {
      solvedRef.current = true;
      onSolved();
    }
  }, [state.solved, onSolved]);

  const targets = useMemo(
    () => (selected ? legalTargets(state.board, selected) : []),
    [selected, state.board],
  );

  const handleSquareClick = (square: Square) => {
    setMessage(null);
    const piece = state.board[square.row]?.[square.col];

    if (!selected) {
      if (piece && piece.color === puzzle.playerColor) setSelected(square);
      return;
    }

    if (squaresEqual(square, selected)) {
      setSelected(null);
      return;
    }

    if (piece && piece.color === puzzle.playerColor) {
      setSelected(square);
      return;
    }

    const isTarget = targets.some((t) => squaresEqual(t, square));
    if (!isTarget) {
      setSelected(null);
      return;
    }

    const result = attemptMove(puzzle, state, { from: selected, to: square });
    setSelected(null);
    if (result.kind === "wrong") {
      setState(result.state);
      setMessage(puzzle.hint ?? "Not quite — try again.");
      return;
    }
    if (result.kind === "correct") {
      setState(result.state);
    }
  };

  return (
    <div className="cx">
      <button type="button" className="cx-exit" onClick={onExit}>
        ← Back
      </button>
      <p className="cx-prompt">{puzzle.prompt}</p>
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
              const piece = state.board[r]?.[c] ?? null;
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
                  onClick={() => handleSquareClick(square)}
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
      <p className={`cx-message ${message ? "cx-message-show" : ""}`}>{message ?? " "}</p>
    </div>
  );
}
