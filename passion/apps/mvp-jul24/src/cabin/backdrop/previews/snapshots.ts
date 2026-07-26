/**
 * Building a `PreviewSnapshot` from the puzzles' own generators.
 *
 * WHAT "LIVE" MEANS HERE, STATED PLAINLY
 * The wall shows a **stable representative board** for each gadget, flipped to its solved state once
 * the child has solved that gadget at least once. It is not a mirror of the exact instance they are
 * playing, because there is nowhere to read that from: every puzzle component holds its board in
 * local `useState` and throws it away when the overlay closes (see src/overlay/GadgetOverlay.tsx —
 * a fresh random seed per open, and the component unmounts on exit). Nothing outside those
 * components can observe a half-finished grid today.
 *
 * What IS observable is `solves` in the persisted interest store, so that is what drives the flip,
 * and it delivers the behaviour that matters: solve the nonogram, close the overlay, and the board
 * on the wall is solved. `useSnapshot` in registry.tsx does that subscription.
 *
 * THE SEAM TO REAL PER-KEYSTROKE STATE
 * When it is worth it, the upgrade is small and does not touch this file's callers: give each puzzle
 * component an effect that publishes its current state to a store keyed by gadget id
 * (`publishPreview(gadgetId, snapshot)`), and have `useSnapshot` prefer a published snapshot over
 * `buildSnapshot`'s derived one. The reason that is not here already is that it cannot be done from
 * inside cabin/backdrop — it requires editing all six puzzle components — and a store that nothing
 * ever writes to is worse than no store.
 *
 * DETERMINISM
 * `buildSnapshot` is pure in (kind, seed, solved). Same inputs, same board, every render — so the
 * room does not reshuffle its wall art when React re-renders, and the tests can assert exact boards.
 */

import { LITS_BANK } from "../../../puzzles/LITS/bank";
import { blankShade, shadeFromSolution } from "../../../puzzles/LITS/logic";
import {
  generatePuzzle as generateLogicGrid,
  nextSeed as nextLogicSeed,
} from "../../../puzzles/LogicGrid/generate";
import { type MarkGrid, emptyMarks, key as logicKey } from "../../../puzzles/LogicGrid/logic";
import { type Board, makeBoard } from "../../../puzzles/Minesweeper/logic";
import { generateLevel as generateMirrorLevel } from "../../../puzzles/Mirror/generate";
import { type CellContent, toggleOrientation } from "../../../puzzles/Mirror/logic";
import { generatePuzzle as generateNonogram } from "../../../puzzles/Nonogram/generate";
import { type Cell as NonogramCell, blankGrid } from "../../../puzzles/Nonogram/logic";
import {
  EASY_SIZE,
  generateLevel as generatePipesLevel,
  nextSeed as nextPipesSeed,
} from "../../../puzzles/Pipes/generate";
import { type Grid as PipesGrid, makeGrid as makePipesGrid } from "../../../puzzles/Pipes/logic";
import type { PreviewKind, PreviewSnapshot } from "./contract";

/** Every gadget id that has a preview renderer. See contract.ts for how to add one. */
export const PREVIEW_KINDS = [
  "nonogram",
  "logic-grid",
  "minesweeper",
  "pipes",
  "lits",
  "mirror",
] as const satisfies readonly PreviewKind[];

export function isPreviewKind(gadgetId: string): gadgetId is PreviewKind {
  return (PREVIEW_KINDS as readonly string[]).includes(gadgetId);
}

/**
 * A stable seed for a gadget's wall board.
 *
 * Derived from the gadget id rather than from the clock or a random draw, so the board painted on
 * the wall is the same one every session — the room has a settled look instead of reshuffling itself
 * behind the player's back. FNV-1a because it is four lines and spreads short ASCII ids well; any
 * stable hash would do.
 */
export function previewSeed(gadgetId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < gadgetId.length; i++) {
    h ^= gadgetId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Minesweeper's solved position: every safe cell open, every mine flagged. */
function solvedMinesweeper(board: Board): Board {
  return {
    ...board,
    revealed: board.mines.map((row) => row.map((mine) => !mine)),
    flagged: board.mines.map((row) => row.slice()),
    firstClick: false,
  };
}

/** LogicGrid's solved marks: `yes` on the true pairing, `no` everywhere else. */
function solvedMarks(puzzle: Parameters<typeof emptyMarks>[0]): MarkGrid {
  const marks: MarkGrid = {};
  for (const entity of puzzle.entities) {
    for (const category of puzzle.categories) {
      for (const value of category.values) {
        marks[logicKey(entity, category.name, value)] =
          puzzle.solution[entity]?.[category.name] === value ? "yes" : "no";
      }
    }
  }
  return marks;
}

/** Pipes' solved grid: every tile turned to the rotation the generator recorded as correct. */
function solvedPipes(level: ReturnType<typeof generatePipesLevel>): PipesGrid {
  return level.map((row) => row.map((spec) => ({ ...spec, rotation: spec.solvedRotation })));
}

/**
 * Mirror's solved grid.
 *
 * The generator builds a route, then flips every mirror to its *other* orientation so the board
 * starts unsolved (see Mirror/generate.ts). Flipping them all back is therefore the solution — a
 * property this file leans on and snapshots.test.ts verifies through the puzzle's own `isSolved`
 * rather than by re-deriving the route.
 */
function solvedMirrors(mirrors: CellContent[][]): CellContent[][] {
  return mirrors.map((row) => row.map((cell) => (cell ? toggleOrientation(cell) : null)));
}

/**
 * The board to paint for `kind`. Pure in its arguments.
 *
 * `solved: false` yields the board as the player would first meet it — a blank nonogram with its
 * clue rails, a scrambled pipe network, an unlit mirror maze — so an untouched prop reads as an
 * invitation rather than as a bug.
 */
export function buildSnapshot(kind: PreviewKind, seed: number, solved: boolean): PreviewSnapshot {
  switch (kind) {
    case "nonogram": {
      const puzzle = generateNonogram(seed);
      const grid: NonogramCell[][] = solved
        ? puzzle.solution.map((row) => row.map((on) => (on ? "filled" : "empty") as NonogramCell))
        : blankGrid(puzzle.size);
      return { kind, puzzle, grid };
    }
    case "logic-grid": {
      // `nextSeed(seed, 0)` is what LogicGrid itself feeds its generator for the first puzzle of a
      // session, and "easy" is the difficulty it starts on — so this is literally the board a player
      // would be handed, not a preview-only variant.
      const puzzle = generateLogicGrid(nextLogicSeed(seed, 0), "easy");
      return { kind, puzzle, marks: solved ? solvedMarks(puzzle) : emptyMarks(puzzle) };
    }
    case "minesweeper": {
      const board = makeBoard(seed);
      return { kind, board: solved ? solvedMinesweeper(board) : board };
    }
    case "pipes": {
      const genSeed = nextPipesSeed(seed, 0);
      const level = generatePipesLevel(genSeed, EASY_SIZE);
      return { kind, grid: solved ? solvedPipes(level) : makePipesGrid(level, genSeed) };
    }
    case "lits": {
      // The bank is small and hand-authored; index by seed so different gadget seeds would land on
      // different boards if the bank grows.
      const puzzle = LITS_BANK[seed % LITS_BANK.length]!;
      return {
        kind,
        puzzle,
        shade: solved ? shadeFromSolution(puzzle) : blankShade(puzzle.rows, puzzle.cols),
      };
    }
    case "mirror": {
      const level = generateMirrorLevel(seed);
      return { kind, level, mirrors: solved ? solvedMirrors(level.mirrors) : level.mirrors };
    }
  }
}
