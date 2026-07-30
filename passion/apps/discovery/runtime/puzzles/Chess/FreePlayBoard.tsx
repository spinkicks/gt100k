import { Chess } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import BoardGrid from "./BoardGrid";
import {
  chooseAiMove,
  createFreeplayGame,
  getGameStatus,
  legalTargets,
  statusMessage,
  toOurBoard,
  tryMove,
} from "./freeplay";
import type { Square } from "./logic";
import { squaresEqual } from "./logic";

export interface FreePlayBoardProps {
  onSolved: () => void;
}

const AI_REPLY_DELAY_MS = 260;
const START_FEN = createFreeplayGame().fen();

/**
 * A full, legal game of chess vs. a simple AI (player = White, AI = Black).
 * The position lives as a `fen` string in React state — the one canonical,
 * immutable snapshot every render derives from — rather than holding a
 * mutable chess.js instance directly in state (which would make it easy to
 * accidentally mutate-then-set the same object reference and have React
 * bail out of re-rendering).
 */
export default function FreePlayBoard({ onSolved }: FreePlayBoardProps) {
  const [fen, setFen] = useState(START_FEN);
  const [selected, setSelected] = useState<Square | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const solvedRef = useRef(false);

  const game = useMemo(() => new Chess(fen), [fen]);
  const board = useMemo(() => toOurBoard(game), [game]);
  const status = useMemo(() => getGameStatus(game), [game]);
  const gameOver = status.kind !== "playing";
  const targets = useMemo(
    () => (selected && !gameOver && !aiThinking ? legalTargets(game, selected) : []),
    [selected, game, gameOver, aiThinking],
  );

  // After the player (White) moves, let the AI (Black) reply automatically.
  useEffect(() => {
    if (game.turn() !== "b" || status.kind !== "playing") return;
    setAiThinking(true);
    const timer = setTimeout(() => {
      const aiMove = chooseAiMove(game);
      if (aiMove) {
        const next = new Chess(fen);
        next.move({ from: aiMove.from, to: aiMove.to, promotion: aiMove.promotion ?? "q" });
        setFen(next.fen());
      }
      setAiThinking(false);
    }, AI_REPLY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [game, status, fen]);

  useEffect(() => {
    if (status.kind === "checkmate" && status.winner === "w" && !solvedRef.current) {
      solvedRef.current = true;
      onSolved();
    }
  }, [status, onSolved]);

  const newGame = () => {
    setFen(START_FEN);
    setSelected(null);
    setAiThinking(false);
    solvedRef.current = false;
  };

  const handleSquareClick = (square: Square) => {
    if (gameOver || aiThinking || game.turn() !== "w") return;
    const piece = board[square.row]?.[square.col];

    if (!selected) {
      if (piece && piece.color === "w") setSelected(square);
      return;
    }

    if (squaresEqual(square, selected)) {
      setSelected(null);
      return;
    }

    if (piece && piece.color === "w") {
      setSelected(square);
      return;
    }

    const isTarget = targets.some((t) => squaresEqual(t, square));
    if (!isTarget) {
      setSelected(null);
      return;
    }

    const next = new Chess(fen);
    const move = tryMove(next, selected, square);
    setSelected(null);
    if (move) setFen(next.fen());
  };

  const message =
    statusMessage(status) || (aiThinking ? "AI is thinking…" : "Your move — you're White.");

  return (
    <div className="cx-freeplay">
      <BoardGrid
        board={board}
        selected={selected}
        targets={targets}
        onSquareClick={handleSquareClick}
      />
      <p
        className={`cx-message cx-message-show cx-fp-status ${gameOver ? "cx-fp-status-over" : ""}`}
      >
        {message}
      </p>
      <button type="button" className="cx-newgame" onClick={newGame}>
        New game
      </button>
    </div>
  );
}
