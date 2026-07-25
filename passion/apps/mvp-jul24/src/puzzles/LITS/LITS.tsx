import { useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import { blankShade, checkLits } from "./logic";
import { PUZZLES } from "./puzzles.data";
import "./LITS.css";

const THICK = "3px solid var(--wood-frame)";
const THIN = "1px solid rgba(90, 58, 36, 0.25)";

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
  const puzzle = useMemo(() => PUZZLES[seed % PUZZLES.length]!, [seed]);
  const [shade, setShade] = useState(() => blankShade(puzzle.rows, puzzle.cols));
  const solvedRef = useRef(false);

  // Reset the board whenever a new puzzle is loaded (seed change).
  useEffect(() => {
    setShade(blankShade(puzzle.rows, puzzle.cols));
    solvedRef.current = false;
  }, [puzzle]);

  const result = useMemo(() => checkLits(shade, puzzle), [shade, puzzle]);

  useEffect(() => {
    if (!solvedRef.current && result.solved) {
      solvedRef.current = true;
      onSolved();
    }
  }, [result, onSolved]);

  const toggle = (r: number, c: number) => {
    setShade((g) => g.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? !v : v)) : row)));
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
    </div>
  );
}
