import { key as logicKey } from "../../../puzzles/LogicGrid/logic";
import { P, PreviewPaper, PreviewSvg, ticks } from "./PreviewSvg";
import type { PuzzlePreview } from "./contract";

const CELL = 13;
/** Header strips, in cells: the row of value names and the column of entity names. */
const HEAD = 1.1;

/**
 * Logic Grid preview: the deduction matrix with tick and cross glyphs.
 *
 * The headers are strips, not text. The real puzzle's row and column heads are words ("Brad",
 * "Volleyball") and there is no scale at which those survive being warped onto a slate on the far
 * wall; what carries at this size is the *structure* — how big the matrix is, which cells are
 * decided, and whether exactly one tick sits in each row and column. That last property is the whole
 * shape of a solved logic grid, and it is visible from across the room.
 *
 * Column order flattens `categories -> values` in exactly the order the real table renders them, so
 * a player who has seen the full-screen board recognises the layout.
 */
export const LogicGridPreview: PuzzlePreview<"logic-grid"> = ({ snapshot }) => {
  const { puzzle, marks } = snapshot;
  const columns = puzzle.categories.flatMap((cat) =>
    cat.values.map((value) => ({ category: cat.name, value })),
  );
  const origin = HEAD * CELL;
  const width = origin + columns.length * CELL;
  const height = origin + puzzle.entities.length * CELL;

  return (
    <PreviewSvg width={width} height={height}>
      <PreviewPaper width={width} height={height} />

      {/* Header strips: one bar per column head and per row head. */}
      {columns.map((col, c) => (
        <rect
          key={`ch-${col.category}-${col.value}`}
          x={origin + c * CELL + 2}
          y={origin - CELL * 0.75}
          width={CELL - 4}
          height={CELL * 0.5}
          rx={1}
          fill={P.inkSoft}
          opacity={0.5}
        />
      ))}
      {puzzle.entities.map((entity, r) => (
        <rect
          key={`rh-${entity}`}
          x={origin - CELL * 0.9}
          y={origin + r * CELL + 3.5}
          width={CELL * 0.7}
          height={CELL - 7}
          rx={1}
          fill={P.inkSoft}
          opacity={0.5}
        />
      ))}

      {puzzle.entities.map((entity, r) =>
        columns.map((col, c) => {
          const mark = marks[logicKey(entity, col.category, col.value)] ?? "unknown";
          if (mark === "unknown") return null;
          const cx = origin + c * CELL + CELL / 2;
          const cy = origin + r * CELL + CELL / 2;
          if (mark === "yes") {
            return (
              <g key={`m-${entity}-${col.value}`}>
                <circle cx={cx} cy={cy} r={CELL * 0.4} fill={P.ember} opacity={0.9} />
                <polyline
                  points={`${cx - 3},${cy} ${cx - 0.8},${cy + 2.4} ${cx + 3.2},${cy - 2.8}`}
                  fill="none"
                  stroke={P.paperHi}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          }
          return (
            <g
              key={`m-${entity}-${col.value}`}
              stroke={P.inkSoft}
              strokeWidth={1.3}
              strokeLinecap="round"
              opacity={0.85}
            >
              <line x1={cx - 2.6} y1={cy - 2.6} x2={cx + 2.6} y2={cy + 2.6} />
              <line x1={cx + 2.6} y1={cy - 2.6} x2={cx - 2.6} y2={cy + 2.6} />
            </g>
          );
        }),
      )}

      <g stroke={P.line} strokeWidth={0.7} opacity={0.7}>
        {ticks(columns.length + 1, CELL).map((d) => (
          <line key={`v-${d}`} x1={origin + d} y1={origin} x2={origin + d} y2={height - 1} />
        ))}
        {ticks(puzzle.entities.length + 1, CELL).map((d) => (
          <line key={`h-${d}`} x1={origin} y1={origin + d} x2={width - 1} y2={origin + d} />
        ))}
      </g>
    </PreviewSvg>
  );
};

export default LogicGridPreview;
