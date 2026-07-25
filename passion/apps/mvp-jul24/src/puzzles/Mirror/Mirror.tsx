import { useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import {
  type CellContent,
  type Direction,
  cloneMirrors,
  pickLevel,
  rotateMirror,
  traceBeam,
} from "./logic";
import "./Mirror.css";

const CELL = 56; // px, keep in sync with .mr-cell width/height in Mirror.css

const ARROW_ROTATION: Record<Direction, number> = { N: -90, E: 0, S: 90, W: 180 };

export default function Mirror({ seed, onSolved, onExit }: PuzzleProps) {
  const level = useMemo(() => pickLevel(seed), [seed]);
  const [mirrors, setMirrors] = useState<CellContent[][]>(() => cloneMirrors(level.mirrors));
  const solvedRef = useRef(false);

  // Reset the board whenever a new puzzle is loaded (seed change).
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

  const px = level.size * CELL;
  const points = trace.path
    .map((p) => `${p.col * CELL + CELL / 2},${p.row * CELL + CELL / 2}`)
    .join(" ");

  return (
    <div className="mr">
      <button type="button" className="mr-exit" onClick={onExit}>
        ← Back
      </button>

      <div
        className={`mr-board${trace.reachesTarget ? " mr-solved" : ""}`}
        style={{ width: px, height: px }}
      >
        <div
          className="mr-grid"
          style={{
            gridTemplateColumns: `repeat(${level.size}, ${CELL}px)`,
            gridTemplateRows: `repeat(${level.size}, ${CELL}px)`,
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
    </div>
  );
}
