import { useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import TeachIn from "../../teachin/TeachIn";
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

// Chess (tactics mode) does NOT alternate difficulty like Nonogram/Pipes, and this is a recorded
// finding rather than an oversight (2026-07-26 difficulty-variety pass). `TacticSpec` in `bank.ts`
// carries only `theme: "mate" | "material"` — a category of tactic, not an ordering — plus a
// free-text `label`. There is no rating, Elo, or structured mate-in-N depth field to sort on: the
// "mate in 2" vs "mate in 1" distinction that exists in the bank today lives only inside `label`'s
// prose, and parsing that string to derive a difficulty would be inventing an axis the data doesn't
// actually carry. `pickRandomTactic` picks uniformly at random across the whole bank instead. For
// Chess to alternate the same way, `TacticSpec` would need an authored, structured difficulty field
// (e.g. a numeric `rating` or `mateInN: number`) that `pickRandomTactic` could bucket into an
// easier/harder band and select from via `round % 2`, the same shape every other alternating puzzle
// in this cabin uses.
export default function Chess({ onSolved, onExit, onAttempt, rng = Math.random }: ChessProps) {
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
      onAttempt?.(false);
      setState(result.state);
      setMessage(puzzle.hint ?? "Not quite — try again.");
      return;
    }
    if (result.kind === "correct") {
      onAttempt?.(true);
      setState(result.state);
    }
  };

  return (
    <div className="cx">
      <button type="button" className="cx-exit" onClick={onExit}>
        ← Back
      </button>
      {/* Explanation lives in the one shared teach-in; this file grows no tutorial of its own. It
          teaches the click-piece-then-square interface, which is what both modes share — the
          per-position "what to find" stays on the `.cx-prompt` card where it belongs. */}
      <TeachIn activity="chess" />
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
          {/* The label is NOT appended here. For every `material` puzzle -- twenty of the
              thirty-two in the bank -- `bank.ts` already builds the prompt as
              "<colour> to move — <label>", so printing the tag beside it read
              "White to move — win a free knight. (Win a free knight)". Only the mate puzzles
              phrase their prompt independently, and those do not need the tag either. */}
          <p className="cx-prompt">{puzzle.prompt}</p>
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
