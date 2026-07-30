import { P, PreviewPaper, PreviewSvg, ticks } from "./PreviewSvg";
import type { PuzzlePreview } from "./contract";

const CELL = 12;
/** Clue rails, in cells. A 5x5 nonogram's longest clue is 3 runs, so 1.6 cells is enough width. */
const RAIL = 1.6;

/**
 * Nonogram preview: the grid, plus clue rails drawn as one tick per run.
 *
 * The real puzzle prints clue *numbers*; those are unreadable here (a 5x5 board occupies ~90 art
 * pixels, so a numeral gets about four), so the rails show the shape of the clue instead — one tick
 * per run, its length proportional to the run — which is legible at any size and still derived from
 * `puzzle.rowClues` / `colClues` rather than invented.
 *
 * A cell counts as filled only when the grid says `"filled"`. `"crossed"` renders as a light X, the
 * same tri-state the real board cycles through, so a partially worked board reads as worked-on rather
 * than as half-solved.
 */
export const NonogramPreview: PuzzlePreview<"nonogram"> = ({ snapshot }) => {
  const { puzzle, grid } = snapshot;
  const n = puzzle.size;
  const origin = RAIL * CELL;
  const size = origin + n * CELL;

  return (
    <PreviewSvg width={size} height={size}>
      <PreviewPaper width={size} height={size} />

      {/* Row clue rail: ticks running left from the grid edge, longest run nearest the grid. */}
      {puzzle.rowClues.map((clue, r) =>
        clue
          .filter((run) => run > 0)
          .map((run, i) => (
            <rect
              // biome-ignore lint/suspicious/noArrayIndexKey: a clue's runs have no identity beyond their position, and that order is fixed per puzzle.
              key={`rc-${r}-${i}`}
              x={origin - 2 - (i + 1) * 3.2}
              y={origin + r * CELL + CELL / 2 - (run > 2 ? 3 : 2)}
              width={2.2}
              height={(run > 2 ? 3 : 2) * 2}
              rx={1}
              fill={P.inkSoft}
            />
          )),
      )}

      {/* Column clue rail: the same ticks, running up from the grid edge. */}
      {puzzle.colClues.map((clue, c) =>
        clue
          .filter((run) => run > 0)
          .map((run, i) => (
            <rect
              // biome-ignore lint/suspicious/noArrayIndexKey: see the row rail above.
              key={`cc-${c}-${i}`}
              x={origin + c * CELL + CELL / 2 - (run > 2 ? 3 : 2)}
              y={origin - 2 - (i + 1) * 3.2}
              width={(run > 2 ? 3 : 2) * 2}
              height={2.2}
              rx={1}
              fill={P.inkSoft}
            />
          )),
      )}

      {grid.map((row, r) =>
        row.map((cell, c) => {
          const x = origin + c * CELL;
          const y = origin + r * CELL;
          if (cell === "filled") {
            return (
              <rect
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size puzzle grid, (r, c) is the cell's identity.
                key={`f-${r}-${c}`}
                x={x + 0.8}
                y={y + 0.8}
                width={CELL - 1.6}
                height={CELL - 1.6}
                rx={1.5}
                fill={P.ink}
              />
            );
          }
          if (cell === "crossed") {
            return (
              <g
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size puzzle grid, (r, c) is the cell's identity.
                key={`x-${r}-${c}`}
                stroke={P.inkSoft}
                strokeWidth={1.2}
                strokeLinecap="round"
              >
                <line x1={x + 3.5} y1={y + 3.5} x2={x + CELL - 3.5} y2={y + CELL - 3.5} />
                <line x1={x + CELL - 3.5} y1={y + 3.5} x2={x + 3.5} y2={y + CELL - 3.5} />
              </g>
            );
          }
          return null;
        }),
      )}

      {/* Grid lines last so they read over the filled squares. */}
      <g stroke={P.line} strokeWidth={0.7} opacity={0.75}>
        {ticks(n + 1, CELL).map((d) => (
          <line key={`v-${d}`} x1={origin + d} y1={origin} x2={origin + d} y2={size - 1} />
        ))}
        {ticks(n + 1, CELL).map((d) => (
          <line key={`h-${d}`} x1={origin} y1={origin + d} x2={size - 1} y2={origin + d} />
        ))}
      </g>
    </PreviewSvg>
  );
};

export default NonogramPreview;
