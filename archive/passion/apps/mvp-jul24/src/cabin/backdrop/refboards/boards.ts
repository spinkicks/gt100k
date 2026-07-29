/**
 * The exact boards the backdrop art must paint, and the prose that describes them.
 *
 * WHY THIS EXISTS
 * The puzzles in the Logic Games room are being **painted into the backdrop plate** rather than
 * composited live over it (see the `PREVIEWS_DEFAULT` comment in ../CabinBackdrop.tsx for why). That
 * makes each board a *spec*: the art agent needs a pixel reference to paint from, and a written
 * description to verify the painted result against afterwards. Both come from here, from the same
 * data, so the picture and the words cannot drift apart — which is the whole point, because a README
 * that disagrees with its own PNG is worse than no README.
 *
 * WHY IT IS NOT `previews/snapshots.ts`
 * That module answers "what does the wall show for this gadget", and its answer is deliberately
 * two-valued: the pristine board, or the solved one, keyed off the interest store. Neither is what a
 * painted prop wants. An empty board reads as a blank frame and a solved one says "already done", so
 * the painting needs a **mid-state** — and it needs a specific board size chosen for the size of the
 * hole in the wall, not the size the puzzle plays best at. Both of those are reference-only concerns
 * and neither belongs in the shipping room's snapshot builder.
 *
 * DETERMINISM
 * Every board is a pure function of a fixed seed recorded below. `buildRefBoard` calls the puzzles'
 * own generators and the puzzles' own state transitions — never a hand-authored board — so a
 * reference can never depict a position the real puzzle could not reach. Re-running the harness a
 * year from now reproduces these three boards exactly.
 *
 * BOARD SIZES ARE SET BY THE PLATE, NOT BY THE PUZZLE
 * The three openings in the backdrop plate are roughly 292x270 (nonogram), 129x220 (pipes) and
 * 110x155 (mirror) source pixels. A board letterboxes square into its opening, so the cell pitch is
 * (short side / cells): the sizes below are picked to land near 22-28 px per cell, which is the range
 * where a baked-in cell still reads as a cell. Above that the board looks coarse; below about 15 px
 * it degenerates into noise — a 10x10 grid in the mirror panel would be ~11 px a cell.
 *
 * That is the right trade because the prop's job is **recognition, not readability** (PRD §5.3 asks
 * for a clear affordance). The child has to see "that is the pipes puzzle" from across the room. They
 * can never see *their* instance there anyway: every gadget generates a fresh random puzzle when it
 * opens, so a painted board is a portrait of the genre, not a mirror of state. Five columns of
 * coloured pipe read instantly; ten columns at 11 px read as texture.
 *
 * WHERE THE GENERATORS COULD NOT HIT THE ASKED-FOR SIZE
 * The art brief asked for pipes at 5 wide x 8 tall and mirror at 4 x 6. Both generators are
 * square-only by construction, and the Mirror generator additionally picks its own size in 5..7 from
 * its seed stream (MIN_SIZE = 5, so 4 is not reachable at all). Rather than hand-edit a board — which
 * would risk depicting an unsolvable or already-solved position, and the art agent verifies against
 * this description — each falls back to the nearest size the generator really produces, and both the
 * gap and its cell pitch are stated in the generated README.
 */

import { generateLevel as generateMirror } from "../../../puzzles/Mirror/generate";
import {
  type CellContent,
  type MirrorLevel,
  type Point,
  cloneMirrors,
  isSolved as mirrorSolved,
  toggleOrientation,
  traceBeam,
} from "../../../puzzles/Mirror/logic";
import { generatePuzzle as generateNonogram } from "../../../puzzles/Nonogram/generate";
import {
  type Cell as NonogramCell,
  type NonogramPuzzle,
  blankGrid,
} from "../../../puzzles/Nonogram/logic";
import {
  generateLevel as generatePipes,
  nextSeed as pipesNextSeed,
} from "../../../puzzles/Pipes/generate";
import {
  type Grid as PipesGrid,
  computePowered,
  makeGrid as makePipesGrid,
  isSolved as pipesSolved,
  tileMask,
} from "../../../puzzles/Pipes/logic";
import type { PreviewSnapshot } from "../previews/contract";
import { previewSeed } from "../previews/snapshots";

export const REF_BOARD_IDS = ["nonogram", "pipes", "mirror"] as const;
export type RefBoardId = (typeof REF_BOARD_IDS)[number];

/**
 * Seeds.
 *
 * Anchored to `previewSeed(gadgetId)` — the room's own stable per-gadget seed — so a reference board
 * is recognisably *this app's* board for that prop rather than an unrelated draw. Where a literal
 * offset appears it is because the generator's own size choice had to be steered; see MIRROR_OFFSET.
 */
export const NONOGRAM_SEED = previewSeed("nonogram");
export const PIPES_SEED = pipesNextSeed(previewSeed("pipes"), 0);
/**
 * Mirror's generator picks its board size from its seed stream rather than from an argument, so the
 * only way to ask for a 5x5 is to walk seeds until one comes back 5x5. `previewSeed("mirror") + 9` is
 * the first offset that yields size 5 **with four mirrors on the route** — offsets 1 and 7 are also
 * 5x5 but place only two mirrors, and a two-mirror maze painted on a wall is a corner, not a maze.
 */
export const MIRROR_OFFSET = 9;
export const MIRROR_SEED = previewSeed("mirror") + MIRROR_OFFSET;

/** Nonogram board side. 10x10 in a ~270 px opening is ~23 px a cell once the clue rails are counted. */
export const NONOGRAM_SIZE = 10;
/** Pipes board side. Square-only generator; 5 in a 129 px opening is ~26 px a cell. */
export const PIPES_SIZE = 5;

/**
 * How much of the nonogram is worked out in the mid-state: whole rows, then a partial one.
 *
 * The partial row is the point. A clean break at a row boundary reads as a half-finished *render*;
 * a row abandoned partway across reads as a person who was working left-to-right and stopped, which
 * is what makes the prop look like a puzzle someone is in the middle of.
 */
const NONOGRAM_SOLVED_ROWS = 5;
const NONOGRAM_PARTIAL_ROW_COLS = 6;

/**
 * Pipes mid-state: every tile within Manhattan distance 2 of the source is turned to its solved
 * rotation; every other tile keeps the scramble `makeGrid` dealt it.
 *
 * Keyed to the source rather than to a row index so the lit region is guaranteed to exist and to be
 * contiguous with the hub, whatever the seed does — the visual that has to survive baking is "flow
 * comes out of the source and peters out", and a rule like "solve the top three rows" only produces
 * that when the source happens to be up there.
 */
const PIPES_SOLVED_RADIUS = 2;

/** A board to paint, ready for the app's own preview renderer. */
export interface RefBoard {
  id: RefBoardId;
  seed: number;
  snapshot: PreviewSnapshot;
}

function nonogramMidState(puzzle: NonogramPuzzle): NonogramCell[][] {
  const grid = blankGrid(puzzle.size);
  for (let r = 0; r < puzzle.size; r++) {
    const cols =
      r < NONOGRAM_SOLVED_ROWS
        ? puzzle.size
        : r === NONOGRAM_SOLVED_ROWS
          ? NONOGRAM_PARTIAL_ROW_COLS
          : 0;
    for (let c = 0; c < cols; c++) {
      // Filled squares only, no `crossed` marks. A crossed cell is a third symbol to distinguish at
      // ~23 art px, and "this cell is known empty" is exactly the mark a spectator cannot read — the
      // brief's own reason for cutting LITS. An empty cell already reads as not-yet-worked.
      if (puzzle.solution[r]?.[c]) grid[r]![c] = "filled";
    }
  }
  return grid;
}

function pipesMidState(seed: number, size: number): PipesGrid {
  const level = generatePipes(seed, size);
  const scrambled = makePipesGrid(level, seed);
  let source: Point = { row: 0, col: 0 };
  for (let r = 0; r < level.length; r++) {
    for (let c = 0; c < level[r]!.length; c++) {
      if (level[r]![c]!.isSource) source = { row: r, col: c };
    }
  }
  return scrambled.map((row, r) =>
    row.map((tile, c) =>
      Math.abs(r - source.row) + Math.abs(c - source.col) <= PIPES_SOLVED_RADIUS
        ? { ...tile, rotation: tile.solvedRotation }
        : tile,
    ),
  );
}

/**
 * Mirror mid-state: the route solved except for its **last** turn.
 *
 * The generator hands back a board with every mirror flipped wrong (see Mirror/generate.ts), so
 * "wrong except one" would be a two-segment stub. Flipping all but the final turn instead sends the
 * beam along nearly the whole intended route and then off at the last corner — a long, legible,
 * obviously-nearly-right beam, which is the single most recognisable thing a mirror maze can show.
 *
 * "Last" is read off the puzzle's own tracer walking the *solved* board, not off row-major order, so
 * it really is the final mirror the beam would meet.
 */
function mirrorMidState(level: MirrorLevel): CellContent[][] {
  const solution = level.mirrors.map((row) =>
    row.map((cell) => (cell ? toggleOrientation(cell) : null)),
  );
  const path = traceBeam(level.size, solution, level.emitter, level.target).path;
  const onPath = path.filter((p) => solution[p.row]?.[p.col] != null);
  const last = onPath[onPath.length - 1];
  if (!last) return solution;
  const mid = cloneMirrors(solution);
  mid[last.row]![last.col] = toggleOrientation(solution[last.row]![last.col]!);
  return mid;
}

/**
 * The reference board for `id`. Pure, and pure in the module constants above — no clock, no
 * `Math.random`, no argument.
 */
export function buildRefBoard(id: RefBoardId): RefBoard {
  switch (id) {
    case "nonogram": {
      const puzzle = generateNonogram(NONOGRAM_SEED, NONOGRAM_SIZE);
      return {
        id,
        seed: NONOGRAM_SEED,
        snapshot: { kind: "nonogram", puzzle, grid: nonogramMidState(puzzle) },
      };
    }
    case "pipes":
      return {
        id,
        seed: PIPES_SEED,
        snapshot: { kind: "pipes", grid: pipesMidState(PIPES_SEED, PIPES_SIZE) },
      };
    case "mirror": {
      const level = generateMirror(MIRROR_SEED);
      return {
        id,
        seed: MIRROR_SEED,
        snapshot: { kind: "mirror", level, mirrors: mirrorMidState(level) },
      };
    }
  }
}

/** `true` when the board is a genuine mid-state: reachable, and neither pristine nor finished. */
export function isMidState(board: RefBoard): boolean {
  const { snapshot } = board;
  switch (snapshot.kind) {
    case "nonogram": {
      const cells = snapshot.grid.flat();
      const filled = cells.filter((c) => c === "filled").length;
      const total = snapshot.puzzle.solution.flat().filter(Boolean).length;
      return filled > 0 && filled < total;
    }
    case "pipes": {
      const powered = computePowered(snapshot.grid);
      const live = snapshot.grid.flat().filter((t) => t.kind !== "blank").length;
      return !pipesSolved(snapshot.grid) && powered.size > 1 && powered.size < live;
    }
    case "mirror": {
      const trace = traceBeam(
        snapshot.level.size,
        snapshot.mirrors,
        snapshot.level.emitter,
        snapshot.level.target,
      );
      const pristine = traceBeam(
        snapshot.level.size,
        snapshot.level.mirrors,
        snapshot.level.emitter,
        snapshot.level.target,
      );
      return (
        !mirrorSolved(snapshot.level, snapshot.mirrors) && trace.path.length > pristine.path.length
      );
    }
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------------------------
// Description. Generated from the same snapshot the PNG is rendered from, so the two agree by
// construction — this text is what the art agent verifies the painted plate against.
// ---------------------------------------------------------------------------------------------

const OPENINGS: Record<RefBoardId, { w: number; h: number; asked: string }> = {
  nonogram: { w: 292, h: 270, asked: "10 x 10" },
  pipes: { w: 129, h: 220, asked: "5 wide x 8 tall" },
  mirror: { w: 110, h: 155, asked: "4 x 6" },
};

/** Cell pitch in plate pixels: a square board letterboxes to the opening's short side. */
function cellPitch(id: RefBoardId, cellsAcross: number): string {
  const opening = OPENINGS[id]!;
  return (Math.min(opening.w, opening.h) / cellsAcross).toFixed(1);
}

/** Row/column indices are 0-based throughout, row 0 at the top, column 0 at the left. */
function describeNonogram(board: RefBoard): string {
  if (board.snapshot.kind !== "nonogram") throw new Error("kind");
  const { puzzle, grid: cells } = board.snapshot;
  const clue = (c: number[]) => c.filter((n) => n > 0).join(" ") || "0";
  const filled = cells.flat().filter((c) => c === "filled").length;
  const total = puzzle.solution.flat().filter(Boolean).length;

  return [
    `### nonogram.png — ${puzzle.size} x ${puzzle.size} nonogram, part-solved`,
    "",
    `**Instance.** \`generatePuzzle(${board.seed}, ${puzzle.size})\` from \`src/puzzles/Nonogram/generate.ts\`. Seed ${board.seed} is \`previewSeed("nonogram")\`.`,
    "",
    `**Size.** ${puzzle.size} x ${puzzle.size}, as asked for. The plate opening is ~${OPENINGS.nonogram.w} x ${OPENINGS.nonogram.h} px, and ${puzzle.size} cells plus the 1.6-cell clue rails letterbox to about ${cellPitch("nonogram", puzzle.size + 1.6)} px a cell.`,
    "",
    "**What the image shows.** The whole board face, edge to edge: clue rails along the top and left, then the grid. The rails are drawn as one tick per run — tick length grows with run length — rather than as numerals, because numerals are illegible at this scale. The clue lists below are the ground truth for how many ticks each rail carries.",
    "",
    `**Filled cells.** \`#\` = filled by the player, \`.\` = left blank. ${filled} of the solution's ${total} filled squares are marked, so the board reads as part-solved:`,
    "",
    "```",
    ...cells.map((row, r) => `    r${r} ${row.map((c) => (c === "filled" ? "#" : ".")).join(" ")}`),
    "```",
    "",
    `Rows 0-${NONOGRAM_SOLVED_ROWS - 1} are worked out in full; row ${NONOGRAM_SOLVED_ROWS} is worked out across columns 0-${NONOGRAM_PARTIAL_ROW_COLS - 1} only and abandoned mid-row; rows ${NONOGRAM_SOLVED_ROWS + 1}-${puzzle.size - 1} are untouched. There are **no cross/X marks anywhere** — every cell that is not filled is simply blank.`,
    "",
    "**Row clues** (top to bottom), the runs each left-hand rail must show:",
    "",
    "```",
    ...puzzle.rowClues.map((c, r) => `    r${r}  ${clue(c)}`),
    "```",
    "",
    "**Column clues** (left to right), the runs each top rail must show:",
    "",
    "```",
    ...puzzle.colClues.map((c, i) => `    c${i}  ${clue(c)}`),
    "```",
  ].join("\n");
}

function describePipes(board: RefBoard): string {
  if (board.snapshot.kind !== "pipes") throw new Error("kind");
  const { grid: cells } = board.snapshot;
  const rows = cells.length;
  const cols = cells[0]?.length ?? 0;
  const powered = computePowered(cells);
  const dirs = (mask: number) =>
    [
      [1, "N"],
      [2, "E"],
      [4, "S"],
      [8, "W"],
    ]
      .filter(([bit]) => mask & (bit as number))
      .map(([, d]) => d)
      .join("");

  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = cells[r]![c]!;
      if (tile.kind === "blank") {
        lines.push(`    (${r},${c})  blank — nothing drawn in this cell`);
        continue;
      }
      const role = tile.isSource ? "SOURCE hub" : tile.isEndpoint ? "endpoint ring" : "pipe";
      const lit = powered.has(`${r},${c}`) ? "LIT" : "unlit";
      lines.push(
        `    (${r},${c})  ${tile.kind.padEnd(8)} openings ${dirs(tileMask(tile)).padEnd(4)} ${role.padEnd(13)} ${lit}`,
      );
    }
  }

  return [
    `### pipes.png — ${cols} x ${rows} pipe network, partly connected`,
    "",
    `**Instance.** \`generateLevel(${board.seed}, ${PIPES_SIZE})\` then \`makeGrid(level, ${board.seed})\` from \`src/puzzles/Pipes/\`, with every tile within Manhattan distance ${PIPES_SOLVED_RADIUS} of the source turned to its solved rotation and the rest left scrambled. Seed ${board.seed} is \`nextSeed(previewSeed("pipes"), 0)\` — the seed Pipes itself uses for the first level of a session.`,
    "",
    `**Size — DIFFERS FROM THE BRIEF.** The brief asked for ${OPENINGS.pipes.asked}. The Pipes generator is square-only (\`generateLevel(seed, size)\` builds size x size), so this is ${cols} x ${rows} instead: the nearest it genuinely produces, and the one that lands in the target cell pitch. In a ${OPENINGS.pipes.w} x ${OPENINGS.pipes.h} px opening a square board letterboxes to about ${cellPitch("pipes", cols)} px a cell. Forcing ${OPENINGS.pipes.asked} would have meant hand-editing a board into a position the generator cannot reach, which would make this description unverifiable.`,
    "",
    "**What the image shows.** The board face, edge to edge. Each tile draws one stroke per opening, running from the cell centre to the cell edge, over a darker casing stroke. **LIT** strokes are the flow colour (warm red/orange in the reference palette); **unlit** strokes are dark. The source is a filled hub; endpoints are rings, filled when lit and hollow when not. Blank cells are drawn as nothing at all — bare board.",
    "",
    "**Every cell**, as (row, column), 0-based, row 0 at the top, column 0 at the left:",
    "",
    "```",
    ...lines,
    "```",
    "",
    `**Flow.** ${powered.size} of the ${cells.flat().filter((t) => t.kind !== "blank").length} non-blank tiles are lit, in one connected region growing out of the source. The network is **not** solved — some endpoints are still dark — so there is **no bright rim** around the board.`,
  ].join("\n");
}

function describeMirror(board: RefBoard): string {
  if (board.snapshot.kind !== "mirror") throw new Error("kind");
  const { level, mirrors } = board.snapshot;
  const trace = traceBeam(level.size, mirrors, level.emitter, level.target);
  const at = (p: Point) => `(${p.row},${p.col})`;
  const placed: string[] = [];
  for (let r = 0; r < level.size; r++) {
    for (let c = 0; c < level.size; c++) {
      const cell = mirrors[r]?.[c];
      if (cell) {
        placed.push(
          `    (${r},${c})  "${cell === "/" ? "/" : "\\"}"  — a 45° mirror running ${
            cell === "/" ? "bottom-left to top-right" : "top-left to bottom-right"
          }`,
        );
      }
    }
  }

  const revisited = trace.path.filter(
    (p, i) => trace.path.findIndex((q) => q.row === p.row && q.col === p.col) !== i,
  );

  return [
    `### mirror.png — ${level.size} x ${level.size} mirror maze, beam nearly routed`,
    "",
    `**Instance.** \`generateLevel(${board.seed})\` from \`src/puzzles/Mirror/generate.ts\`, then every mirror flipped to its solved orientation **except the last one on the beam's route**. Seed ${board.seed} is \`previewSeed("mirror") + ${MIRROR_OFFSET}\`.`,
    "",
    `**Size — DIFFERS FROM THE BRIEF.** The brief asked for ${OPENINGS.mirror.asked}. The Mirror generator is square-only and picks its own side length in 5..7 from the seed stream (\`MIN_SIZE = 5\`), so a 4-wide board is not reachable at all. This is ${level.size} x ${level.size}, the smallest it can make. In a ${OPENINGS.mirror.w} x ${OPENINGS.mirror.h} px opening that letterboxes to about ${cellPitch("mirror", level.size)} px a cell — the low end of the target pitch, and the best available.`,
    "",
    "**What the image shows.** The board face, edge to edge: a panel with faint grid lines, the mirrors, the emitter, the target, and the beam actually traced through this exact layout. Coordinates are (row, column), 0-based, row 0 at the top, column 0 at the left.",
    "",
    `**Emitter.** ${at(level.emitter)}, firing ${level.emitter.dir}. Drawn as a small dark disc.`,
    "",
    `**Target.** ${at(level.target)}. Drawn as a ring, **hollow and unlit**, because the beam does not reach it.`,
    "",
    `**Mirrors.** ${placed.length} of them, at these positions and these angles, and there are none anywhere else on the board:`,
    "",
    "```",
    ...placed,
    "```",
    "",
    `**Beam path.** ${trace.path.length} cells, in order from the emitter:`,
    "",
    "```",
    `    ${trace.path.map(at).join(" -> ")}`,
    "```",
    "",
    ...(revisited.length > 0
      ? [
          `The beam crosses its own track at ${[...new Set(revisited.map(at))].join(", ")} — paint the overlap as a single continuous line, not as a junction.`,
          "",
        ]
      : []),
    `The beam runs **off the edge of the grid** after ${at(trace.path[trace.path.length - 1]!)}; it never lands on the target. That is the state to paint: one mirror away from solved. A beam shown reaching a lit target is the wrong picture.`,
  ].join("\n");
}

/** Precise prose for `id`, derived from the same snapshot the PNG shows. */
export function describeRefBoard(id: RefBoardId): string {
  const board = buildRefBoard(id);
  switch (id) {
    case "nonogram":
      return describeNonogram(board);
    case "pipes":
      return describePipes(board);
    case "mirror":
      return describeMirror(board);
  }
}
