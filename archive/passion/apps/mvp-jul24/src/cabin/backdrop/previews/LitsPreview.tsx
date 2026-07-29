import { checkLits } from "../../../puzzles/LITS/logic";
import { P, PreviewPaper, PreviewSvg, ticks } from "./PreviewSvg";
import type { PuzzlePreview } from "./contract";

const CELL = 14;

/**
 * LITS preview: the jigsaw regions as heavy borders, the shaded tetrominoes as ember blocks.
 *
 * Region boundaries are computed the same way the real board computes its cell borders — compare a
 * cell's region id with its neighbour's and thicken the edge where they differ — so the jigsaw drawn
 * here is the jigsaw the player will meet, not a redrawing of it. Only the *outer* edges of each
 * region get the heavy stroke, which is what makes the region shapes readable when the whole board
 * is only ~80px across.
 *
 * The solved rim comes from `checkLits`, the puzzle's full four-rule checker, rather than from
 * comparing against `puzzle.solution`: LITS has multiple valid shadings, so solution-matching would
 * refuse to light up a board that is genuinely finished.
 */
export const LitsPreview: PuzzlePreview<"lits"> = ({ snapshot }) => {
  const { puzzle, shade } = snapshot;
  const width = puzzle.cols * CELL;
  const height = puzzle.rows * CELL;
  const solved = checkLits(shade, puzzle).solved;

  /** Region id at (r, c), or null off-grid — so edge cells get a boundary on the outside. */
  const regionAt = (r: number, c: number): number | null => puzzle.regions[r]?.[c] ?? null;

  return (
    <PreviewSvg width={width} height={height}>
      <PreviewPaper width={width} height={height} />

      {shade.map((row, r) =>
        row.map((shaded, c) =>
          shaded ? (
            <rect
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size board, (r, c) is the cell's identity.
              key={`s-${r}-${c}`}
              x={c * CELL + 1}
              y={r * CELL + 1}
              width={CELL - 2}
              height={CELL - 2}
              rx={1.5}
              fill={P.ember}
            />
          ) : null,
        ),
      )}

      {/* Thin cell grid, then heavy region boundaries over it. */}
      <g stroke={P.line} strokeWidth={0.5} opacity={0.4}>
        {ticks(puzzle.cols + 1, CELL).map((d) => (
          <line key={`v-${d}`} x1={d} y1={0} x2={d} y2={height} />
        ))}
        {ticks(puzzle.rows + 1, CELL).map((d) => (
          <line key={`h-${d}`} x1={0} y1={d} x2={width} y2={d} />
        ))}
      </g>

      <g stroke={P.line} strokeWidth={1.8} strokeLinecap="square">
        {puzzle.regions.map((row, r) =>
          row.map((region, c) => {
            const x = c * CELL;
            const y = r * CELL;
            return (
              <g
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size region map, (r, c) is the cell's identity.
                key={`b-${r}-${c}`}
              >
                {regionAt(r - 1, c) !== region ? <line x1={x} y1={y} x2={x + CELL} y2={y} /> : null}
                {regionAt(r, c - 1) !== region ? <line x1={x} y1={y} x2={x} y2={y + CELL} /> : null}
                {regionAt(r + 1, c) !== region ? (
                  <line x1={x} y1={y + CELL} x2={x + CELL} y2={y + CELL} />
                ) : null}
                {regionAt(r, c + 1) !== region ? (
                  <line x1={x + CELL} y1={y} x2={x + CELL} y2={y + CELL} />
                ) : null}
              </g>
            );
          }),
        )}
      </g>

      {solved ? (
        <rect
          x={1}
          y={1}
          width={width - 2}
          height={height - 2}
          rx={2}
          fill="none"
          stroke={P.emberBright}
          strokeWidth={1.8}
        />
      ) : null}
    </PreviewSvg>
  );
};

export default LitsPreview;
