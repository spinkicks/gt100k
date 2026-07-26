import { useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import TeachIn from "../../teachin/TeachIn";
import { generateLevel } from "./generate";
import { type CellContent, type Direction, cloneMirrors, rotateMirror, traceBeam } from "./logic";
import "./Mirror.css";

// Geometry. CELL/GAP are the single source of truth for both the CSS grid template and the SVG beam
// overlay: the grid's gap has to be folded into the beam's own coordinates, or every endpoint drifts
// one gap-width per column and the beam stops landing on tile centres as the board grows. Ported
// from FractionLaser, which hit this first — see the note at the top of FractionLaser.css.
const CELL = 56;
const GAP = 2;
const STEP = CELL + GAP;

const ARROW_ROTATION: Record<Direction, number> = { N: -90, E: 0, S: 90, W: 180 };

export default function Mirror({ seed, onSolved, onExit }: PuzzleProps) {
  // `round` advances on "Next puzzle" so the board keeps changing after the
  // player solves one, without ever repeating the level they just beat.
  const [round, setRound] = useState(0);
  const level = useMemo(() => generateLevel(seed + round), [seed, round]);
  const [mirrors, setMirrors] = useState<CellContent[][]>(() => cloneMirrors(level.mirrors));
  const solvedRef = useRef(false);

  // Reset the board whenever a new puzzle is loaded (seed or round change).
  useEffect(() => {
    setMirrors(cloneMirrors(level.mirrors));
    solvedRef.current = false;
  }, [level]);

  const trace = useMemo(
    () => traceBeam(level.size, mirrors, level.emitter, level.target),
    [level, mirrors],
  );

  useEffect(() => {
    if (!solvedRef.current && trace.reachesTarget) {
      solvedRef.current = true;
      onSolved();
    }
  }, [trace.reachesTarget, onSolved]);

  const rotate = (r: number, c: number) => {
    setMirrors((prev) => rotateMirror(prev, r, c));
  };

  // The grid's real footprint: n tiles plus the n-1 gaps between them. The SVG matches it exactly,
  // so a point at column c sits at the centre of column c however far right c is.
  const px = level.size * CELL + (level.size - 1) * GAP;
  const points = trace.path
    .map((p) => `${p.col * STEP + CELL / 2},${p.row * STEP + CELL / 2}`)
    .join(" ");

  return (
    <div className="mr">
      <button type="button" className="mr-exit" onClick={onExit}>
        ← Back
      </button>

      {/* Explanation lives in the one shared teach-in; this file grows no tutorial of its own. The
          panel reuses the `.mr-hint` sentence below rather than inventing a second phrasing. */}
      <TeachIn activity="mirror" />

      {/* No explicit size: the frame wraps the grid. Setting width/height here was wrong under the
          global border-box rule — the 10px padding and the 4px border came out of the stated size,
          while the grid is sized by its own tile template and so kept its full footprint: on a
          5-wide board it hung 22px past the outer edge of the wood on each axis — the far column and
          the bottom row sitting out on the frame — and 2px more for every column after that. */}
      <div className={`mr-board${trace.reachesTarget ? " mr-solved" : ""}`}>
        <div
          className="mr-grid"
          style={{
            gridTemplateColumns: `repeat(${level.size}, ${CELL}px)`,
            gridTemplateRows: `repeat(${level.size}, ${CELL}px)`,
            gap: GAP,
          }}
        >
          {mirrors.map((row, r) =>
            row.map((cell, c) => {
              const cellKey = `${r}-${c}`;
              const isEmitter = r === level.emitter.row && c === level.emitter.col;
              const isTarget = r === level.target.row && c === level.target.col;

              if (isEmitter) {
                return (
                  <div key={cellKey} className="mr-cell mr-emitter">
                    <span
                      className="mr-emitter-arrow"
                      style={{ transform: `rotate(${ARROW_ROTATION[level.emitter.dir]}deg)` }}
                      aria-hidden="true"
                    >
                      ➤
                    </span>
                  </div>
                );
              }

              if (isTarget) {
                return (
                  <div
                    key={cellKey}
                    className={`mr-cell mr-target${trace.reachesTarget ? " mr-target-lit" : ""}`}
                    aria-label="target"
                  >
                    <span className="mr-target-gem" aria-hidden="true" />
                  </div>
                );
              }

              if (cell) {
                return (
                  <button
                    key={cellKey}
                    type="button"
                    className={`mr-cell mr-mirror mr-mirror-${cell === "/" ? "slash" : "back"}`}
                    aria-label={`mirror row ${r + 1} column ${c + 1}, currently ${cell === "/" ? "forward slash" : "backslash"}`}
                    data-row={r}
                    data-col={c}
                    onClick={() => rotate(r, c)}
                  >
                    <span className="mr-mirror-glass" aria-hidden="true" />
                  </button>
                );
              }

              return <div key={cellKey} className="mr-cell mr-floor" />;
            }),
          )}
        </div>

        <svg
          className="mr-beam-layer"
          width={px}
          height={px}
          viewBox={`0 0 ${px} ${px}`}
          aria-hidden="true"
        >
          <title>Laser beam path</title>
          {points && (
            <>
              <polyline points={points} className="mr-beam-glow" fill="none" />
              <polyline points={points} className="mr-beam-core" fill="none" />
            </>
          )}
        </svg>
      </div>

      <output className="mr-hint">
        {trace.reachesTarget
          ? "The beam is locked onto the target!"
          : "Click a mirror to rotate it and guide the beam to the target."}
      </output>

      {trace.reachesTarget && (
        <button type="button" className="mr-next" onClick={() => setRound((r) => r + 1)}>
          Next puzzle →
        </button>
      )}
    </div>
  );
}
