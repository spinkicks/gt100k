import { DIR, computePowered, isSolved, tileMask } from "../../../puzzles/Pipes/logic";
import { P, PreviewPaper, PreviewSvg } from "./PreviewSvg";
import type { PuzzlePreview } from "./contract";

const CELL = 22;

/** Which way each opening bit points, as a unit offset from the tile centre. */
const ARMS: Array<[bit: number, dx: number, dy: number]> = [
  [DIR.N, 0, -1],
  [DIR.E, 1, 0],
  [DIR.S, 0, 1],
  [DIR.W, -1, 0],
];

/**
 * Pipes preview: one stroke per open side, ember where the flow reaches, ink where it does not.
 *
 * Drawn from `tileMask(tile)` — the puzzle's own (kind, rotation) -> openings function — rather than
 * from the real component's per-shape artwork plus a CSS rotation. Same information, and it means a
 * tile can only ever be drawn with the openings the logic says it has: there is no separate table of
 * shapes here to fall out of sync with `BASE_MASK`.
 *
 * The powered set and the solved flag both come from the puzzle's `computePowered` / `isSolved`, so
 * the lit path on the wall is the same flood-fill the player sees full-screen.
 */
export const PipesPreview: PuzzlePreview<"pipes"> = ({ snapshot }) => {
  const { grid } = snapshot;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const width = cols * CELL;
  const height = rows * CELL;
  const powered = computePowered(grid);
  const solved = isSolved(grid);

  return (
    <PreviewSvg width={width} height={height}>
      <PreviewPaper width={width} height={height} fill={P.paperEdge} />

      {grid.map((row, r) =>
        row.map((tile, c) => {
          if (tile.kind === "blank") return null;
          const cx = c * CELL + CELL / 2;
          const cy = r * CELL + CELL / 2;
          const mask = tileMask(tile);
          const lit = powered.has(`${r},${c}`);
          const stroke = lit ? P.ember : P.inkSoft;
          const arms = ARMS.filter(([bit]) => mask & bit);

          return (
            <g
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size board, (r, c) is the tile's identity.
              key={`t-${r}-${c}`}
            >
              {/* Dark casing under the run so the pipe reads as a solid object over busy art. */}
              <g stroke={P.ink} strokeWidth={5.2} strokeLinecap="round" opacity={0.55}>
                {arms.map(([bit, dx, dy]) => (
                  <line
                    key={`c-${bit}`}
                    x1={cx}
                    y1={cy}
                    x2={cx + dx * (CELL / 2)}
                    y2={cy + dy * (CELL / 2)}
                  />
                ))}
              </g>
              <g stroke={stroke} strokeWidth={3} strokeLinecap="round">
                {arms.map(([bit, dx, dy]) => (
                  <line
                    key={`p-${bit}`}
                    x1={cx}
                    y1={cy}
                    x2={cx + dx * (CELL / 2)}
                    y2={cy + dy * (CELL / 2)}
                  />
                ))}
              </g>
              {/* The source is a filled hub; endpoints are rings that fill in once the flow lands. */}
              {tile.isSource ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={3.4}
                  fill={P.emberBright}
                  stroke={P.ink}
                  strokeWidth={1}
                />
              ) : null}
              {tile.isEndpoint ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={2.8}
                  fill={lit ? P.emberBright : "none"}
                  stroke={lit ? P.emberDeep : P.inkSoft}
                  strokeWidth={1.2}
                />
              ) : null}
            </g>
          );
        }),
      )}

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

export default PipesPreview;
