import { useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import BoardGrid from "./BoardGrid";
import FreePlayBoard from "./FreePlayBoard";
import {
  type ChessGameState,
  type Square,
  attemptMove,
  initState,
  legalTargets,
  squaresEqual,
} from "./logic";
import { PUZZLES } from "./puzzles.data";
import "./Chess.css";

type Mode = "tactics" | "freeplay";

export default function Chess({ seed, onSolved, onExit }: PuzzleProps) {
  const [mode, setMode] = useState<Mode>("tactics");
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
          <p className="cx-prompt">{puzzle.prompt}</p>
          <BoardGrid
            board={state.board}
            selected={selected}
            targets={targets}
            onSquareClick={handleSquareClick}
          />
          <p className={`cx-message ${message ? "cx-message-show" : ""}`}>{message ?? " "}</p>
        </>
      ) : (
        <FreePlayBoard onSolved={onSolved} />
      )}
    </div>
  );
}
