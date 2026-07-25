import { useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import BoardGrid from "./BoardGrid";
import FreePlayBoard from "./FreePlayBoard";
import { pickRandomTactic } from "./bank";
import {
  type ChessGameState,
  type ChessPuzzle,
  type Square,
  attemptMove,
  initState,
  legalTargets,
  squaresEqual,
} from "./logic";
import "./Chess.css";

type Mode = "tactics" | "freeplay";

export interface ChessProps extends PuzzleProps {
  /** Injectable RNG for deterministic tests. Defaults to `Math.random` —
   * production always picks genuinely at random, since `seed` is a fixed
   * constant from the caller (not a per-session value) and can't be used
   * for real variety here. */
  rng?: () => number;
}

export default function Chess({ onSolved, onExit, rng = Math.random }: ChessProps) {
  const [mode, setMode] = useState<Mode>("tactics");
  const [puzzle, setPuzzle] = useState<ChessPuzzle>(() => pickRandomTactic(rng));
  const [state, setState] = useState<ChessGameState>(() => initState(puzzle));
  const [selected, setSelected] = useState<Square | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const solvedRef = useRef(false);

  // Reset whenever a new puzzle is loaded (mount, or "Next puzzle").
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

  const handleNextPuzzle = () => {
    setPuzzle(pickRandomTactic(rng, puzzle.id));
  };

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
      <div className="cx-mode-toggle" role="tablist" aria-label="Chess mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "tactics"}
          className={`cx-mode-btn ${mode === "tactics" ? "cx-mode-active" : ""}`}
          onClick={() => setMode("tactics")}
        >
          Tactics
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "freeplay"}
          className={`cx-mode-btn ${mode === "freeplay" ? "cx-mode-active" : ""}`}
          onClick={() => setMode("freeplay")}
        >
          Free Play
        </button>
      </div>

      {mode === "tactics" ? (
        <>
          <p className="cx-prompt">
            {puzzle.prompt}
            {puzzle.label ? <span className="cx-tag"> ({puzzle.label})</span> : null}
          </p>
          <BoardGrid
            board={state.board}
            selected={selected}
            targets={targets}
            onSquareClick={handleSquareClick}
          />
          <p className={`cx-message ${message ? "cx-message-show" : ""}`}>{message ?? " "}</p>
          {state.solved ? (
            <button type="button" className="cx-next" onClick={handleNextPuzzle}>
              Next puzzle →
            </button>
          ) : null}
        </>
      ) : (
        <FreePlayBoard onSolved={onSolved} />
      )}
    </div>
  );
}
