import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import { MAX_DIFFICULTY, generateLevel } from "./generate";
import {
  type Dials,
  type Direction,
  type Frac,
  type LaserLevel,
  ONE,
  type Point,
  cellKey,
  cycleDial,
  eqF,
  fracText,
  initialDials,
  isSolved,
  subF,
  traceBeams,
} from "./logic";
import "./FractionLaser.css";

// Geometry. CELL/GAP are the single source of truth for both the CSS grid
// template and the SVG beam overlay, so beam endpoints land dead centre on
// their tiles instead of drifting a gap-width per column.
const CELL = 64;
const GAP = 2;
const STEP = CELL + GAP;
/** How far a beam stops short of a prism or crystal, so it enters rather than covers it. */
const PAD = 21;
/** How far a beam's amount sits off the beam's own axis, clear of the dashes. */
const LABEL_OFFSET = 13;

const ARROW_ROTATION: Record<Direction, number> = { N: -90, E: 0, S: 90, W: 180 };
const UNIT: Record<Direction, [number, number]> = {
  N: [0, -1],
  S: [0, 1],
  E: [1, 0],
  W: [-1, 0],
};

/** A stacked numerator-over-denominator glyph. Decorative — callers label the container. */
function FracGlyph({ value, className }: { value: Frac; className?: string }) {
  const cls = className ? `fl-frac ${className}` : "fl-frac";
  if (value.d === 1) {
    return (
      <span className={`${cls} fl-frac-whole`} aria-hidden="true">
        {value.n}
      </span>
    );
  }
  return (
    <span className={cls} aria-hidden="true">
      <span className="fl-num">{value.n}</span>
      <span className="fl-den">{value.d}</span>
    </span>
  );
}

function centre(p: Point): [number, number] {
  return [p.col * STEP + CELL / 2, p.row * STEP + CELL / 2];
}

interface FractionLaserProps extends PuzzleProps {
  /**
   * Which round — and so which difficulty rung — to open on. Always 0 in the
   * game; a seam for the review harness and for tests, which would otherwise
   * have to solve two boards to see what a four-prism one looks like.
   */
  initialRound?: number;
}

export default function FractionLaser({
  seed,
  onSolved,
  onExit,
  initialRound = 0,
}: FractionLaserProps) {
  // `round` advances on "Next puzzle" so the board keeps changing after a
  // solve. Difficulty climbs with it and then holds at the top rung: the
  // first board a player ever sees is the small one, which is where they
  // work out what a prism does without being told.
  const [round, setRound] = useState(initialRound);
  const difficulty = Math.min(MAX_DIFFICULTY, round);
  const level: LaserLevel = useMemo(
    () => generateLevel(seed + round, difficulty),
    [seed, round, difficulty],
  );
  const [dials, setDials] = useState<Dials>(() => initialDials(level));
  const solvedRef = useRef(false);

  useEffect(() => {
    setDials(initialDials(level));
    solvedRef.current = false;
  }, [level]);

  const trace = useMemo(() => traceBeams(level, dials), [level, dials]);
  const solved = useMemo(() => isSolved(level, dials), [level, dials]);

  useEffect(() => {
    if (!solvedRef.current && solved) {
      solvedRef.current = true;
      onSolved();
    }
  }, [solved, onSolved]);

  const turn = useCallback(
    (index: number, step: number) => setDials((prev) => cycleDial(level, prev, index, step)),
    [level],
  );

  const width = level.size * CELL + (level.size - 1) * GAP;

  // What each crystal is currently being handed. Used for the lit state and
  // for the spoken label, so a screen-reader user can compare "needs" against
  // "getting" without seeing the beam.
  const arriving = trace.delivered;

  const devices = new Map<string, "splitter" | "collector">();
  for (const s of level.splitters) devices.set(cellKey(s), "splitter");
  for (const c of level.collectors) devices.set(cellKey(c), "collector");

  return (
    <div className="fl">
      <button type="button" className="fl-exit" onClick={onExit}>
        ← Back
      </button>

      {/* No explicit size: the frame wraps the grid. Setting width here would
          be wrong under the global border-box rule — padding and border would
          eat into it and the grid would spill past the wood. */}
      <div className={`fl-board${solved ? " fl-solved" : ""}`}>
        <div
          className="fl-grid"
          style={{
            gridTemplateColumns: `repeat(${level.size}, ${CELL}px)`,
            gridTemplateRows: `repeat(${level.size}, ${CELL}px)`,
            gap: GAP,
          }}
        >
          {Array.from({ length: level.size }, (_unusedRow, r) =>
            Array.from({ length: level.size }, (_unusedCol, c) => {
              const k = `${r},${c}`;
              const isEmitter = r === level.emitter.row && c === level.emitter.col;

              if (isEmitter) {
                return (
                  <div key={k} className="fl-cell fl-emitter" aria-label="beam source, one whole">
                    <span
                      className="fl-emitter-arrow"
                      style={{ transform: `rotate(${ARROW_ROTATION[level.emitter.dir]}deg)` }}
                      aria-hidden="true"
                    >
                      ➤
                    </span>
                    <span className="fl-emitter-whole" aria-hidden="true">
                      1
                    </span>
                  </div>
                );
              }

              const splitterIndex = level.splitters.findIndex((s) => s.row === r && s.col === c);
              if (splitterIndex >= 0) {
                const splitter = level.splitters[splitterIndex]!;
                const setting = splitter.options[dials[splitterIndex] ?? splitter.start]!;
                const flow = trace.flows.get(k);
                const branchDir: Direction = flow?.branchDir ?? "E";
                const rest = subF(ONE, setting);
                const spoken = `prism row ${r + 1} column ${c + 1}: sending ${fracText(setting)} of the light straight on and ${fracText(rest)} out of the side port. Press to change the split.`;
                return (
                  <button
                    key={k}
                    type="button"
                    className={`fl-cell fl-prism fl-branch-${branchDir}`}
                    data-row={r}
                    data-col={c}
                    data-testid={`prism-${r}-${c}`}
                    aria-label={spoken}
                    onClick={() => turn(splitterIndex, 1)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowUp" || event.key === "ArrowRight") {
                        event.preventDefault();
                        turn(splitterIndex, 1);
                      } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
                        event.preventDefault();
                        turn(splitterIndex, -1);
                      }
                    }}
                  >
                    <FracGlyph value={setting} className="fl-prism-main" />
                    <FracGlyph value={rest} className="fl-prism-side" />
                  </button>
                );
              }

              const collector = level.collectors.find((x) => x.row === r && x.col === c);
              if (collector) {
                const got = arriving.get(k);
                const lit = got !== undefined && eqF(got, collector.required);
                return (
                  <div
                    key={k}
                    className={`fl-cell fl-crystal${lit ? " fl-crystal-lit" : ""}`}
                    data-testid={`crystal-${r}-${c}`}
                    aria-label={
                      `crystal row ${r + 1} column ${c + 1}: needs ${fracText(collector.required)} ` +
                      `of the beam, receiving ${got ? fracText(got) : "nothing"}`
                    }
                  >
                    <FracGlyph value={collector.required} className="fl-crystal-need" />
                  </div>
                );
              }

              return <div key={k} className="fl-cell fl-floor" />;
            }),
          )}
        </div>

        <svg
          className="fl-beam-layer"
          width={width}
          height={width}
          viewBox={`0 0 ${width} ${width}`}
          aria-hidden="true"
        >
          <title>Laser beams and the share of the whole each one carries</title>
          {trace.segments.map((seg) => {
            const [fx, fy] = centre(seg.from);
            const [tx, ty] = centre(seg.to);
            const [ux, uy] =
              UNIT[
                seg.from.row === seg.to.row
                  ? seg.to.col >= seg.from.col
                    ? "E"
                    : "W"
                  : seg.to.row >= seg.from.row
                    ? "S"
                    : "N"
              ];
            // A run that ends on nothing has left the board: draw it to the
            // edge so wasted light is visible as light thrown away.
            const escapes = !devices.has(cellKey(seg.to));
            const raw = Math.abs(tx - fx) + Math.abs(ty - fy);
            const headPad = escapes ? -(CELL / 2) : PAD;
            const trim = raw > PAD + headPad + 6 ? [PAD, headPad] : [0, 0];
            const x1 = fx + ux * trim[0]!;
            const y1 = fy + uy * trim[0]!;
            const x2 = tx - ux * trim[1]!;
            const y2 = ty - uy * trim[1]!;
            const share = seg.value.n / seg.value.d;
            const len = Math.abs(x2 - x1) + Math.abs(y2 - y1);
            const id = `${cellKey(seg.from)}-${cellKey(seg.to)}`;
            return (
              <g key={id} className={escapes ? "fl-beam fl-beam-spilt" : "fl-beam"}>
                <line
                  className="fl-beam-glow"
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  strokeWidth={4 + 16 * share}
                />
                <line
                  className="fl-beam-core"
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  strokeWidth={1.5 + 7 * share}
                />
                {len >= 54 && (
                  <text
                    className="fl-beam-label"
                    x={(x1 + x2) / 2 + uy * LABEL_OFFSET}
                    y={(y1 + y2) / 2 - ux * LABEL_OFFSET}
                    dy="0.34em"
                    textAnchor="middle"
                  >
                    {fracText(seg.value)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="fl-ledger">
        {level.collectors.map((c, i) => (
          <span key={cellKey(c)}>
            {i > 0 ? " + " : ""}
            {fracText(c.required)}
          </span>
        ))}
        <span> = 1 whole beam</span>
      </p>

      <output className="fl-hint">
        {solved
          ? "Every crystal has exactly the share it asked for."
          : "Each prism sends part of the light straight on and the rest out of its side port — the two parts always make one whole. Set every prism so each crystal gets exactly the fraction written on it."}
      </output>

      {solved && (
        <button type="button" className="fl-next" onClick={() => setRound((r) => r + 1)}>
          Next puzzle →
        </button>
      )}
    </div>
  );
}
