import { useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import { LITS_BANK } from "./bank";
import { blankShade, checkLits } from "./logic";
import "./LITS.css";

const THICK = "3px solid var(--wood-frame)";
const THIN = "1px solid rgba(90, 58, 36, 0.25)";

/**
 * Hashes (seed, counter) into a LITS_BANK index. `seed` gives session-to-session variety
 * (different players / different sessions land on different puzzles); `counter` lets a single
 * session step through further picks (used by "Next puzzle") without repeating the same hash
 * input twice.
 */
function pickBankIndex(seed: number, counter: number, len: number): number {
  let h = (seed * 2654435761 + counter * 2246822519) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  return h % len;
}

/** Friendly, non-spoilery status hints derived from the rule violations. */
function hintFor(violations: string[], shadedCount: number): string | null {
  if (shadedCount === 0) {
    return "Shade cells to build one L, I, T, or S tetromino in every region.";
  }
  if (violations.some((v) => v.includes("2x2 block"))) {
    return "A 2×2 block is fully shaded — that's never allowed.";
  }
  if (violations.some((v) => v.includes("not all connected"))) {
    return "All shaded cells must connect into a single group.";
  }
  if (violations.some((v) => v.includes("same-type"))) {
    return "Two matching tetromino shapes are touching — separate them.";
  }
  if (violations.length > 0) {
    return "Keep going — each region needs exactly one L, I, T, or S tetromino.";
  }
  return null;
}

export default function LITS({ seed, onSolved, onExit }: PuzzleProps) {
  // `pickCounterRef` advances on every "Next puzzle" click so each pick hashes to a fresh
  // input; `puzzleIndex` is the resulting LITS_BANK index actually rendered.
  const pickCounterRef = useRef(0);
  const [puzzleIndex, setPuzzleIndex] = useState(() =>
    pickBankIndex(seed, pickCounterRef.current, LITS_BANK.length),
  );
  const puzzle = LITS_BANK[puzzleIndex]!;
  const [shadeState, setShadeState] = useState(() => blankShade(puzzle.rows, puzzle.cols));
  const solvedRef = useRef(false);

  // Reset the board whenever a new puzzle is loaded (puzzleIndex change). This is done
  // synchronously *during* render (React's documented "adjust state while rendering"
  // escape hatch), not in a useEffect: bank puzzles can differ in rows/cols (e.g. an
  // 8x8 hard puzzle after a 6x6 easy one). Overriding the local `shade` variable (not just
  // calling setShadeState, whose new value wouldn't be visible until the next render) means
  // the rest of *this* render already uses a correctly-sized blank grid, instead of indexing
  // the new (smaller) `puzzle.regions` with the old (larger) shade grid's coordinates and
  // crashing before React ever gets to re-render with the reset state.
  const [lastPuzzle, setLastPuzzle] = useState(puzzle);
  let shade = shadeState;
  if (lastPuzzle !== puzzle) {
    setLastPuzzle(puzzle);
    shade = blankShade(puzzle.rows, puzzle.cols);
    setShadeState(shade);
    solvedRef.current = false;
  }

  const result = useMemo(() => checkLits(shade, puzzle), [shade, puzzle]);

  useEffect(() => {
    if (!solvedRef.current && result.solved) {
      solvedRef.current = true;
      onSolved();
    }
  }, [result, onSolved]);

  const toggle = (r: number, c: number) => {
    setShadeState((g) =>
      g.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? !v : v)) : row)),
    );
  };

  // Advances to another bank puzzle without leaving the subgame (does NOT auto-close/exit) —
  // the board resets via the render-time adjustment above, once `puzzleIndex` changes. Keeps
  // re-picking until it lands on a puzzle different from the current one (when the bank has
  // more than one).
  const nextPuzzle = () => {
    let idx = puzzleIndex;
    for (let tries = 0; tries < LITS_BANK.length + 1; tries++) {
      pickCounterRef.current += 1;
      idx = pickBankIndex(seed, pickCounterRef.current, LITS_BANK.length);
      if (idx !== puzzleIndex) break;
    }
    setPuzzleIndex(idx);
  };

  const shadedCount = shade.reduce((n, row) => n + row.filter(Boolean).length, 0);
  const hint = hintFor(result.violations, shadedCount);

  return (
    <div className="lits">
      <button type="button" className="lits-exit" onClick={onExit}>
        ← Back
      </button>
      <div
        className="lits-board"
        style={{
          gridTemplateColumns: `repeat(${puzzle.cols}, 2.6rem)`,
          gridTemplateRows: `repeat(${puzzle.rows}, 2.6rem)`,
        }}
      >
        {shade.map((row, r) =>
          row.map((shaded, c) => {
            const region = puzzle.regions[r]![c]!;
            const top = r === 0 || puzzle.regions[r - 1]?.[c] !== region ? THICK : THIN;
            const left = c === 0 || puzzle.regions[r]?.[c - 1] !== region ? THICK : THIN;
            const right =
              c === puzzle.cols - 1 || puzzle.regions[r]?.[c + 1] !== region ? THICK : THIN;
            const bottom =
              r === puzzle.rows - 1 || puzzle.regions[r + 1]?.[c] !== region ? THICK : THIN;
            return (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size grid, (r, c) is the cell's identity.
                key={`${r}-${c}`}
                type="button"
                className={`lits-cell ${shaded ? "lits-shaded" : "lits-empty"}`}
                data-region-parity={region % 2}
                data-solution={puzzle.solution[r]?.[c] ? "1" : "0"}
                aria-label={`row ${r + 1} column ${c + 1}, region ${region + 1}${
                  shaded ? ", shaded" : ""
                }`}
                style={{
                  borderTop: top,
                  borderLeft: left,
                  borderRight: right,
                  borderBottom: bottom,
                }}
                onClick={() => toggle(r, c)}
              />
            );
          }),
        )}
      </div>
      <p className="lits-hint" aria-live="polite">
        {hint ?? "Solved! Every region holds one tidy tetromino."}
      </p>
      {result.solved && (
        <button type="button" className="lits-next" onClick={nextPuzzle}>
          Next puzzle →
        </button>
      )}
    </div>
  );
}
