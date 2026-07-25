import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import { generatePuzzle } from "./generate";
import { type Cell, type NonogramPuzzle, blankGrid, isSolved } from "./logic";
import "./Nonogram.css";

const next = (c: Cell): Cell => (c === "empty" ? "filled" : c === "filled" ? "crossed" : "empty");

const clueText = (clue: number[]): string =>
  clue.length === 1 && clue[0] === 0 ? "" : clue.join(" ");

const sameSolution = (a: boolean[][], b: boolean[][]): boolean =>
  a.length === b.length && a.every((row, r) => row.every((v, c) => v === b[r]?.[c]));

// Monotonically increasing across the module's lifetime so every mount and
// every "Next puzzle" click draws from a different point in the generator's
// seed space — puzzles never repeat back-to-back.
let generationCounter = 0;

function nextGeneratorSeed(base: number): number {
  generationCounter += 1;
  return (base * 2654435761 + generationCounter * 40503) >>> 0;
}

/** Generates a fresh unique-solution puzzle, guaranteed different from `avoid`. */
function generateFreshPuzzle(base: number, avoid?: boolean[][]): NonogramPuzzle {
  let puzzle = generatePuzzle(nextGeneratorSeed(base));
  while (avoid && sameSolution(puzzle.solution, avoid)) {
    puzzle = generatePuzzle(nextGeneratorSeed(base));
  }
  return puzzle;
}

export default function Nonogram({ seed, onSolved, onExit }: PuzzleProps) {
  // Effectively unlimited puzzles: generate a fresh one on mount instead of
  // picking from a fixed hand-authored set.
  const [puzzle, setPuzzle] = useState<NonogramPuzzle>(() => generateFreshPuzzle(seed));
  const [grid, setGrid] = useState<Cell[][]>(() => blankGrid(puzzle.size));
  const [solved, setSolved] = useState(false);
  const solvedRef = useRef(false);

  // Reset the board whenever a new puzzle is loaded.
  useEffect(() => {
    setGrid(blankGrid(puzzle.size));
    setSolved(false);
    solvedRef.current = false;
  }, [puzzle]);

  useEffect(() => {
    if (!solvedRef.current && isSolved(grid, puzzle)) {
      solvedRef.current = true;
      setSolved(true);
      onSolved();
    }
  }, [grid, puzzle, onSolved]);

  const toggle = (r: number, c: number) => {
    setGrid((g) =>
      g.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? next(cell) : cell)) : row)),
    );
  };

  // "Next puzzle" — regenerate and reset instead of exiting; onSolved has
  // already fired once for this puzzle and won't fire again until the new
  // one is also solved.
  const nextPuzzle = useCallback(() => {
    setPuzzle((p) => generateFreshPuzzle(seed, p.solution));
  }, [seed]);

  return (
    <div className="ng">
      <button type="button" className="ng-exit" onClick={onExit}>
        ← Back
      </button>
      <div
        className="ng-board"
        style={{
          gridTemplateColumns: `auto repeat(${puzzle.size}, 2.5rem)`,
          gridTemplateRows: `auto repeat(${puzzle.size}, 2.5rem)`,
        }}
      >
        <div className="ng-cell ng-corner" />
        {puzzle.colClues.map((clue, c) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size puzzle grid, columns never reorder.
          <div key={`col-${c}`} className="ng-cell ng-clue ng-clue-col">
            {clue.map((n, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed clue order, never reordered.
              <span key={i}>{n}</span>
            ))}
          </div>
        ))}
        {grid.map((row, r) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size puzzle grid, rows never reorder.
          <Fragment key={`row-${r}`}>
            <div className="ng-cell ng-clue ng-clue-row">{clueText(puzzle.rowClues[r]!)}</div>
            {row.map((cell, c) => (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size grid, (r, c) is the cell's identity.
                key={`${r}-${c}`}
                type="button"
                className={`ng-cell ng-grid-cell ng-${cell}`}
                data-fill={puzzle.solution[r]![c] ? "1" : "0"}
                aria-label={`row ${r + 1} column ${c + 1}`}
                onClick={() => toggle(r, c)}
              />
            ))}
          </Fragment>
        ))}
      </div>
      {solved && (
        <button type="button" className="ng-next" onClick={nextPuzzle}>
          Next puzzle →
        </button>
      )}
    </div>
  );
}
