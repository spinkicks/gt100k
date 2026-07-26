import { isWon } from "../../../puzzles/Minesweeper/logic";
import { P, PreviewPaper, PreviewSvg, ticks } from "./PreviewSvg";
import type { PuzzlePreview } from "./contract";

const CELL = 10;

/**
 * Minesweeper preview: hidden tiles as raised wood, opened cells as pale paper, flags as ember
 * pennants.
 *
 * The adjacency numbers are dropped on purpose. A 9x9 board is the densest preview in the room —
 * roughly 10 art pixels a cell on the rug quad — and a numeral there is three pixels of noise. What
 * reads at that size is the *pattern* of opened versus closed, which is exactly the thing that makes
 * a cleared board recognisable from across the room: a solved minesweeper is a full sheet of pale
 * cells with ten flags on it, and nothing else in the game looks like that.
 *
 * Won and lost are both drawn, from the puzzle's own `isWon` and the board's own `exploded` flag, so
 * the preview cannot claim a state the real game would not.
 */
export const MinesweeperPreview: PuzzlePreview<"minesweeper"> = ({ snapshot }) => {
  const { board } = snapshot;
  const width = board.width * CELL;
  const height = board.height * CELL;
  const won = isWon(board);

  return (
    <PreviewSvg width={width} height={height}>
      <PreviewPaper width={width} height={height} fill={P.paperEdge} />

      {board.revealed.map((row, r) =>
        row.map((revealed, c) => {
          const x = c * CELL;
          const y = r * CELL;
          const mine = board.mines[r]![c]!;
          const flagged = board.flagged[r]![c]!;

          if (revealed && mine) {
            // Only reachable on a lost board (reveal() opens every mine on a hit).
            return (
              <circle
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size board, (r, c) is the cell's identity.
                key={`m-${r}-${c}`}
                cx={x + CELL / 2}
                cy={y + CELL / 2}
                r={CELL * 0.26}
                fill={P.ink}
              />
            );
          }
          if (revealed) {
            return (
              <rect
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size board, (r, c) is the cell's identity.
                key={`o-${r}-${c}`}
                x={x + 0.5}
                y={y + 0.5}
                width={CELL - 1}
                height={CELL - 1}
                fill={P.paperHi}
                opacity={0.95}
              />
            );
          }
          return (
            <g
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size board, (r, c) is the cell's identity.
              key={`h-${r}-${c}`}
            >
              <rect
                x={x + 0.7}
                y={y + 0.7}
                width={CELL - 1.4}
                height={CELL - 1.4}
                rx={1}
                fill={P.wood}
                opacity={0.85}
              />
              {flagged ? (
                <>
                  <line
                    x1={x + CELL * 0.4}
                    y1={y + CELL * 0.25}
                    x2={x + CELL * 0.4}
                    y2={y + CELL * 0.78}
                    stroke={P.paperEdge}
                    strokeWidth={0.9}
                    strokeLinecap="round"
                  />
                  <path
                    d={[
                      `M ${x + CELL * 0.4} ${y + CELL * 0.24}`,
                      `L ${x + CELL * 0.76} ${y + CELL * 0.4}`,
                      `L ${x + CELL * 0.4} ${y + CELL * 0.54}`,
                      "Z",
                    ].join(" ")}
                    fill={won ? P.emberBright : P.ember}
                  />
                </>
              ) : null}
            </g>
          );
        }),
      )}

      <g stroke={P.line} strokeWidth={0.5} opacity={0.5}>
        {ticks(board.width + 1, CELL).map((d) => (
          <line key={`v-${d}`} x1={d} y1={0} x2={d} y2={height} />
        ))}
        {ticks(board.height + 1, CELL).map((d) => (
          <line key={`h-${d}`} x1={0} y1={d} x2={width} y2={d} />
        ))}
      </g>

      {/* A won board picks up a warm rim so "cleared" reads before the cell pattern does. */}
      {won ? (
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

export default MinesweeperPreview;
