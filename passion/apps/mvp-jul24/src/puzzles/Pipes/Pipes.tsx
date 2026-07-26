import { useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import TeachIn from "../../teachin/TeachIn";
import { EASY_SIZE, HARD_SIZE, generateLevel, nextSeed } from "./generate";
import { type Grid, type TileKind, computePowered, isSolved, makeGrid, rotateTile } from "./logic";
import "./Pipes.css";

/** Unrotated pipe artwork for each tile shape (rotation is applied via CSS transform). */
function PipeArt({ kind }: { kind: TileKind }) {
  switch (kind) {
    case "cap":
      return (
        <>
          <path className="pp-pipe" d="M50,50 L92,50" />
          <circle className="pp-cap-end" cx="92" cy="50" r="7" />
        </>
      );
    case "straight":
      return <path className="pp-pipe" d="M8,50 L92,50" />;
    case "elbow":
      return (
        <>
          <path className="pp-pipe" d="M50,8 L50,50" />
          <path className="pp-pipe" d="M50,50 L92,50" />
          <circle className="pp-hub" cx="50" cy="50" r="9" />
        </>
      );
    case "t":
      return (
        <>
          <path className="pp-pipe" d="M50,8 L50,92" />
          <path className="pp-pipe" d="M50,50 L92,50" />
          <circle className="pp-hub" cx="50" cy="50" r="9" />
        </>
      );
    case "cross":
      return (
        <>
          <path className="pp-pipe" d="M50,8 L50,92" />
          <path className="pp-pipe" d="M8,50 L92,50" />
          <circle className="pp-hub" cx="50" cy="50" r="9" />
        </>
      );
    default:
      return null;
  }
}

export default function Pipes({ seed, onSolved, onExit }: PuzzleProps) {
  // `seed` gives session variety while `puzzleIndex` ("Next puzzle" clicks)
  // always advances to a fresh, deterministic-per-index generated level —
  // there's no fixed level list to run out of, so this is effectively
  // unlimited puzzles. Difficulty alternates between the two supported grid
  // sizes so both get exercised over a play session.
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const genSeed = useMemo(() => nextSeed(seed, puzzleIndex), [seed, puzzleIndex]);
  const size = puzzleIndex % 2 === 0 ? EASY_SIZE : HARD_SIZE;
  const level = useMemo(() => generateLevel(genSeed, size), [genSeed, size]);
  const [grid, setGrid] = useState<Grid>(() => makeGrid(level, genSeed));
  // Visual-only quarter-turn counter per cell (unbounded, unlike Tile.rotation)
  // so the SVG always spins forward instead of snapping back at the 3->0 wrap.
  const [spins, setSpins] = useState<number[][]>(() =>
    grid.map((row) => row.map((t) => t.rotation)),
  );
  const solvedRef = useRef(false);

  useEffect(() => {
    const g = makeGrid(level, genSeed);
    setGrid(g);
    setSpins(g.map((row) => row.map((t) => t.rotation)));
    solvedRef.current = false;
  }, [level, genSeed]);

  const powered = useMemo(() => computePowered(grid), [grid]);
  const solved = useMemo(() => isSolved(grid), [grid]);

  useEffect(() => {
    if (!solvedRef.current && solved) {
      solvedRef.current = true;
      onSolved();
    }
  }, [solved, onSolved]);

  const rotate = (r: number, c: number) => {
    if (grid[r]?.[c]?.kind === "blank") return;
    setGrid((g) => rotateTile(g, r, c));
    setSpins((s) =>
      s.map((row, ri) => (ri !== r ? row : row.map((v, ci) => (ci !== c ? v : v + 1)))),
    );
  };

  // Advances to a freshly generated puzzle without leaving the subgame —
  // the board resets via the [level, genSeed] effect above.
  const nextPuzzle = () => setPuzzleIndex((i) => i + 1);

  const cols = grid[0]?.length ?? 0;

  return (
    <div className="pp">
      <button type="button" className="pp-exit" onClick={onExit}>
        ← Back
      </button>
      {/* Explanation lives in the one shared teach-in; this file grows no tutorial of its own. */}
      <TeachIn activity="pipes" />
      <div
        className={`pp-board ${solved ? "pp-solved" : ""}`}
        style={{
          gridTemplateColumns: `repeat(${cols}, 4.2rem)`,
          gridTemplateRows: `repeat(${grid.length}, 4.2rem)`,
        }}
      >
        {grid.map((row, r) =>
          row.map((tile, c) => {
            const cellKey = `${r},${c}`;
            if (tile.kind === "blank") {
              return <div key={cellKey} className="pp-tile pp-kind-blank" />;
            }
            const isPowered = powered.has(cellKey);
            const classes = [
              "pp-tile",
              `pp-kind-${tile.kind}`,
              isPowered ? "pp-powered" : "pp-unpowered",
              tile.isSource ? "pp-source" : "",
              tile.isEndpoint ? "pp-endpoint" : "",
              tile.isEndpoint && isPowered ? "pp-endpoint-lit" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={cellKey}
                type="button"
                className={classes}
                aria-label={`pipe row ${r + 1} column ${c + 1}, ${isPowered ? "flowing" : "dry"}`}
                onClick={() => rotate(r, c)}
              >
                <svg
                  className="pp-svg"
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                  style={{ transform: `rotate(${spins[r]![c]! * 90}deg)` }}
                >
                  <PipeArt kind={tile.kind} />
                </svg>
                {(tile.isSource || tile.isEndpoint) && <span className="pp-node" />}
              </button>
            );
          }),
        )}
      </div>
      {solved && (
        <button type="button" className="pp-next" onClick={nextPuzzle}>
          Next puzzle →
        </button>
      )}
    </div>
  );
}
