import { useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import { generatePuzzle, nextSeed } from "./generate";
import { type Mark, type MarkGrid, emptyMarks, isSolved, key } from "./logic";
import "./LogicGrid.css";

const next = (m: Mark): Mark => (m === "unknown" ? "yes" : m === "yes" ? "no" : "unknown");

const symbol = (m: Mark): string => (m === "yes" ? "✓" : m === "no" ? "✗" : "");

export default function LogicGrid({ seed, onSolved, onExit }: PuzzleProps) {
  // `seed` gives session variety while `puzzleIndex` ("Next puzzle" clicks)
  // always advances to a fresh, deterministic-per-index generated puzzle —
  // there's no fixed puzzle list to run out of, so this is effectively
  // unlimited themed puzzles. Difficulty alternates between 3 and 4
  // categories so both get exercised over a play session.
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const genSeed = useMemo(() => nextSeed(seed, puzzleIndex), [seed, puzzleIndex]);
  const difficulty = puzzleIndex % 2 === 0 ? "easy" : "hard";
  const puzzle = useMemo(() => generatePuzzle(genSeed, difficulty), [genSeed, difficulty]);
  const [marks, setMarks] = useState<MarkGrid>(() => emptyMarks(puzzle));
  const solvedRef = useRef(false);

  useEffect(() => {
    setMarks(emptyMarks(puzzle));
    solvedRef.current = false;
  }, [puzzle]);

  useEffect(() => {
    if (!solvedRef.current && isSolved(marks, puzzle)) {
      solvedRef.current = true;
      onSolved();
    }
  }, [marks, puzzle, onSolved]);

  const cycle = (e: string, c: string, v: string) => {
    const k = key(e, c, v);
    setMarks((m) => ({ ...m, [k]: next(m[k]!) }));
  };

  // Advances to a freshly generated puzzle without leaving the subgame —
  // the grid resets via the [puzzle] effect above.
  const nextPuzzle = () => setPuzzleIndex((i) => i + 1);

  const solved = isSolved(marks, puzzle);

  return (
    <div className="lg">
      <button type="button" className="lg-exit" onClick={onExit}>
        ← Back
      </button>
      <ul className="lg-clues">
        {puzzle.clues.map((clue) => (
          <li key={clue}>{clue}</li>
        ))}
      </ul>
      <table className="lg-table">
        <thead>
          <tr>
            <th className="lg-corner" />
            {puzzle.categories.map((cat) =>
              cat.values.map((v) => (
                <th key={`${cat.name}-${v}`} className="lg-col-head">
                  {v}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {puzzle.entities.map((e) => (
            <tr key={e}>
              <th className="lg-row-head">{e}</th>
              {puzzle.categories.map((cat) =>
                cat.values.map((v) => {
                  const k = key(e, cat.name, v);
                  const mark = marks[k]!;
                  return (
                    <td key={k} className="lg-td">
                      <button
                        type="button"
                        className={`lg-cell lg-${mark}`}
                        data-cell={k}
                        aria-label={`${e} ${cat.name} ${v}`}
                        onClick={() => cycle(e, cat.name, v)}
                      >
                        {symbol(mark)}
                      </button>
                    </td>
                  );
                }),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {solved && (
        <button type="button" className="lg-next" onClick={nextPuzzle}>
          Next puzzle →
        </button>
      )}
    </div>
  );
}
