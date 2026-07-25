import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import { type Board, flagCount, isWon, makeBoard, resetBoard, reveal, toggleFlag } from "./logic";
import "./Minesweeper.css";

const LONG_PRESS_MS = 450;
const FLAG_GLYPH = "🚩";
const MINE_GLYPH = "💣";

export default function Minesweeper({ seed, onSolved, onExit }: PuzzleProps) {
  const [board, setBoard] = useState<Board>(() => makeBoard(seed));
  const [flagMode, setFlagMode] = useState(false);
  const [boomCell, setBoomCell] = useState<string | null>(null);
  const solvedRef = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  // A fresh puzzle (new seed) starts a brand-new board.
  useEffect(() => {
    setBoard(makeBoard(seed));
    setBoomCell(null);
    solvedRef.current = false;
  }, [seed]);

  const won = isWon(board);

  useEffect(() => {
    if (!solvedRef.current && won) {
      solvedRef.current = true;
      onSolved();
    }
  }, [won, onSolved]);

  const clearLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const doReveal = (r: number, c: number) => {
    setBoard((prev) => {
      if (prev.exploded || won) return prev;
      const next = reveal(prev, r, c);
      if (next.exploded && !prev.exploded) setBoomCell(`${r},${c}`);
      return next;
    });
  };

  const doToggleFlag = (r: number, c: number) => {
    setBoard((prev) => (prev.exploded || won ? prev : toggleFlag(prev, r, c)));
  };

  const handleClick = (r: number, c: number) => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    if (flagMode) doToggleFlag(r, c);
    else doReveal(r, c);
  };

  const handleContextMenu = (e: MouseEvent, r: number, c: number) => {
    e.preventDefault();
    doToggleFlag(r, c);
  };

  const handleTouchStart = (r: number, c: number) => {
    longPressFired.current = false;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      doToggleFlag(r, c);
    }, LONG_PRESS_MS);
  };

  const handleTouchEnd = () => clearLongPress();

  const tryAgain = () => {
    setBoard(resetBoard(board));
    setBoomCell(null);
  };

  const remaining = board.mineCount - flagCount(board);
  const gameOver = board.exploded;

  return (
    <div className="ms">
      <div className="ms-header">
        <button type="button" className="ms-exit" onClick={onExit}>
          ← Back
        </button>
        <div className="ms-status" aria-live="polite">
          {gameOver ? "💥 Boom!" : won ? "🎉 Cleared!" : `${FLAG_GLYPH} ${remaining}`}
        </div>
        <button
          type="button"
          className={`ms-flagmode ${flagMode ? "ms-flagmode-on" : ""}`}
          aria-pressed={flagMode}
          onClick={() => setFlagMode((f) => !f)}
        >
          🚩 Flag mode
        </button>
      </div>

      <div className="ms-board-wrap">
        <div
          className="ms-board"
          style={{
            gridTemplateColumns: `repeat(${board.width}, 2.2rem)`,
            gridTemplateRows: `repeat(${board.height}, 2.2rem)`,
          }}
        >
          {board.revealed.map((row, r) =>
            row.map((isRevealed, c) => {
              const isFlagged = board.flagged[r]![c]!;
              const isMine = board.mines[r]![c]!;
              const count = board.adjacent[r]![c]!;
              const isBoom = boomCell === `${r},${c}`;
              let content = "";
              let stateClass = "ms-hidden";
              if (isRevealed) {
                stateClass = isMine
                  ? "ms-mine"
                  : count > 0
                    ? `ms-revealed ms-n${count}`
                    : "ms-revealed";
                content = isMine ? MINE_GLYPH : count > 0 ? String(count) : "";
              } else if (isFlagged) {
                stateClass = "ms-flagged";
                content = FLAG_GLYPH;
              }
              return (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size grid, (r, c) is the cell's identity.
                  key={`${r}-${c}`}
                  type="button"
                  className={`ms-cell ${stateClass} ${isBoom ? "ms-boom" : ""}`}
                  data-mine={isMine ? "1" : "0"}
                  data-state={isRevealed ? "revealed" : isFlagged ? "flagged" : "hidden"}
                  aria-label={`row ${r + 1} column ${c + 1}`}
                  disabled={gameOver || won}
                  onClick={() => handleClick(r, c)}
                  onContextMenu={(e) => handleContextMenu(e, r, c)}
                  onTouchStart={() => handleTouchStart(r, c)}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                >
                  {content}
                </button>
              );
            }),
          )}
        </div>

        {gameOver && (
          <div className="ms-overlay">
            <p className="ms-overlay-text">💥 Kaboom! That was a mine.</p>
            <button type="button" className="ms-again" onClick={tryAgain}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
