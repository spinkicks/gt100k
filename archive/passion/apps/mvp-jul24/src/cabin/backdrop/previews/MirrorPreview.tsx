import { traceBeam } from "../../../puzzles/Mirror/logic";
import { P, PreviewPaper, PreviewSvg, ticks } from "./PreviewSvg";
import type { PuzzlePreview } from "./contract";

const CELL = 16;

/**
 * Mirror Maze preview: the mirrors, and the beam actually traced through them.
 *
 * `traceBeam` is the puzzle's own tracer, so the line drawn on the wall is the line the beam really
 * takes for this mirror layout — including the unsolved case, where it wanders off the grid partway.
 * That makes this the most legible preview in the room at a glance: an unsolved maze is a short beam
 * ending in the middle of nowhere, a solved one is a beam that reaches a lit gem.
 */
export const MirrorPreview: PuzzlePreview<"mirror"> = ({ snapshot }) => {
  const { level, mirrors } = snapshot;
  const size = level.size * CELL;
  const trace = traceBeam(level.size, mirrors, level.emitter, level.target);
  const beam = trace.path
    .map((p) => `${p.col * CELL + CELL / 2},${p.row * CELL + CELL / 2}`)
    .join(" ");

  const targetX = level.target.col * CELL + CELL / 2;
  const targetY = level.target.row * CELL + CELL / 2;
  const emitterX = level.emitter.col * CELL + CELL / 2;
  const emitterY = level.emitter.row * CELL + CELL / 2;

  return (
    <PreviewSvg width={size} height={size}>
      <PreviewPaper width={size} height={size} fill={P.wood} radius={2} />

      <g stroke={P.paperEdge} strokeWidth={0.4} opacity={0.25}>
        {ticks(level.size + 1, CELL).map((d) => (
          <line key={`v-${d}`} x1={d} y1={0} x2={d} y2={size} />
        ))}
        {ticks(level.size + 1, CELL).map((d) => (
          <line key={`h-${d}`} x1={0} y1={d} x2={size} y2={d} />
        ))}
      </g>

      {/* Beam: a wide soft pass under a bright core, so it holds up over firelit painting. */}
      {trace.path.length > 1 ? (
        <>
          <polyline
            points={beam}
            fill="none"
            stroke={P.ember}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.35}
          />
          <polyline
            points={beam}
            fill="none"
            stroke={P.emberBright}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {mirrors.map((row, r) =>
        row.map((cell, c) => {
          if (!cell) return null;
          const x = c * CELL;
          const y = r * CELL;
          // "/" runs bottom-left to top-right; "\" runs top-left to bottom-right.
          const [x1, y1, x2, y2] =
            cell === "/"
              ? [x + 3, y + CELL - 3, x + CELL - 3, y + 3]
              : [x + 3, y + 3, x + CELL - 3, y + CELL - 3];
          return (
            <g
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size board, (r, c) is the cell's identity.
              key={`m-${r}-${c}`}
              strokeLinecap="round"
            >
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={P.ink} strokeWidth={3.4} />
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={P.paperHi} strokeWidth={1.2} />
            </g>
          );
        }),
      )}

      <circle cx={emitterX} cy={emitterY} r={3} fill={P.emberDeep} stroke={P.ink} strokeWidth={1} />
      <circle
        cx={targetX}
        cy={targetY}
        r={4}
        fill={trace.reachesTarget ? P.emberBright : "none"}
        stroke={trace.reachesTarget ? P.emberBright : P.paperEdge}
        strokeWidth={1.4}
      />
    </PreviewSvg>
  );
};

export default MirrorPreview;
