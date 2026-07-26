import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import TeachIn from "../../teachin/TeachIn";
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

/**
 * The two board sizes this cabin alternates between, easier first.
 *
 * Nonogram was permanently 5x5 before 2026-07-26: `generatePuzzle`'s `size` parameter existed and
 * nothing ever passed it, so the room a player meets first was also the flat one while every math
 * activity varied. 7 is the step up — large enough to need real line-solving, small enough that the
 * generator's uniqueness check still converges inside MAX_ATTEMPTS (generate.test.ts already
 * exercises 8x8 successfully, so 7x7 has margin to spare).
 */
export const SIZES = [5, 7] as const;

/**
 * ALTERNATES, deliberately — it does not climb. Same convention as GearTrain, BalanceScale and
 * RatioMixing, whose comment states the reason: a session should meet both. A monotonic ramp is an
 * escalation the child never chose, and offering a choice is what the harder-variant control is for.
 *
 * Serves the ROUND-driven caller only — "Next puzzle" within a mount. Do not feed `tier` through
 * this: see `sizeForTier` below for why the two callers cannot share this function's semantics.
 */
export function sizeForRound(round: number): number {
  return SIZES[round % SIZES.length]!;
}

/**
 * MONOTONIC and CLAMPED, deliberately — it never wraps. Serves the TIER-driven caller only: the
 * overlay's explicit "Try a harder one" offer (`GadgetOverlay.tsx`), which unmounts and remounts
 * this component with an ever-incrementing `tier` each time it's pressed.
 *
 * This function exists because `sizeForRound(tier)` doesn't: `tier` grows without bound (0, 1, 2,
 * 3, …) while `SIZES` has only two entries, so `SIZES[tier % SIZES.length]` wraps back to the
 * smallest size on the third press — pressing "harder" twice handed back an EASIER board than the
 * one just solved, which is precisely the inversion the harder-variant offer was built to prevent.
 * Clamping at the last index means every tier beyond `SIZES.length - 1` just holds at the hardest
 * size instead of wrapping.
 */
export function sizeForTier(tier: number): number {
  return SIZES[Math.min(tier, SIZES.length - 1)]!;
}

/** Generates a fresh unique-solution puzzle, guaranteed different from `avoid`. */
function generateFreshPuzzle(base: number, size: number, avoid?: boolean[][]): NonogramPuzzle {
  let puzzle = generatePuzzle(nextGeneratorSeed(base), size);
  while (avoid && sameSolution(puzzle.solution, avoid)) {
    puzzle = generatePuzzle(nextGeneratorSeed(base), size);
  }
  return puzzle;
}

export default function Nonogram({ seed, tier = 0, onSolved, onExit }: PuzzleProps) {
  // `round` advances on "Next puzzle" so difficulty alternates across a session (see
  // `sizeForRound`) instead of staying pinned to the generator's default forever. Seeded from
  // `tier` so a session that already chose "harder" keeps alternating from there rather than
  // restarting the cycle at round 0 — `sizeForRound` wraps by design, which is fine for THIS use
  // (round-to-round alternation is meant to cycle forever).
  const [round, setRound] = useState(tier);
  // Effectively unlimited puzzles: generate a fresh one on mount instead of
  // picking from a fixed hand-authored set. Uses `sizeForTier`, NOT `sizeForRound`: this is the
  // one place the component is sized from the overlay's monotonic "harder" request rather than
  // from round-to-round alternation, and the two must not share a function (see `sizeForTier`).
  const [puzzle, setPuzzle] = useState<NonogramPuzzle>(() =>
    generateFreshPuzzle(seed, sizeForTier(tier)),
  );
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
    setRound((r) => {
      const nextRound = r + 1;
      setPuzzle((p) => generateFreshPuzzle(seed, sizeForRound(nextRound), p.solution));
      return nextRound;
    });
  }, [seed]);

  return (
    <div className="ng">
      <button type="button" className="ng-exit" onClick={onExit}>
        ← Back
      </button>
      {/* Explanation lives in the one shared teach-in; this file grows no tutorial of its own. */}
      <TeachIn activity="nonogram" />
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
