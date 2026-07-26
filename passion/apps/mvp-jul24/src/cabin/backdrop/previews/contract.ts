/**
 * The `PuzzlePreview` contract: what a compact, non-interactive rendering of a puzzle's state is
 * allowed to be.
 *
 * WHY NOT JUST RENDER THE REAL PUZZLE COMPONENT
 * Because the interactive components are the wrong shape for a wall. Each one owns its own state,
 * its own generator, its own "Next puzzle" button and its own exit affordance; each one calls
 * `onSolved`, which records a solve in the interest store. Mounting six of them behind a backdrop
 * would fabricate opens and solves out of a child merely walking into the room, which is precisely
 * the measurement corruption PROJECT.md's deferred-signals section is trying to keep out. It would
 * also put six focusable grids of hundreds of buttons into the tab order, in front of the prop
 * polygons that are the actual controls.
 *
 * So a preview is defined by subtraction: it takes state, it returns pixels, and it does nothing
 * else. No state of its own, no effects, no callbacks, no focusable nodes, no pointer events. Every
 * preview is driven off the same `logic.ts` / `generate.ts` / `bank.ts` modules the real puzzles use
 * — so a solved board really is solved by the puzzle's own `isSolved`, not by a preview-only notion
 * of "looks done" that could drift from it (see snapshots.test.ts, which asserts exactly that).
 *
 * ADDING A PREVIEW (this is the seam Fraction Laser and Function Machine will use)
 * Fraction Laser and Function Machine are planned but do not exist yet (PROJECT.md, "The five
 * planned maths games"). When they land:
 *   1. add a variant to `PreviewSnapshot` below, carrying that puzzle's own state types imported
 *      from `src/puzzles/<Name>/logic.ts` — never a preview-local re-declaration of them;
 *   2. add its id to `PREVIEW_KINDS` in snapshots.ts and a case to `buildSnapshot`;
 *   3. add the component to `PREVIEWS` in registry.tsx.
 * Nothing else changes: `quads.data.ts` already keys props by gadget id, and `CabinBackdrop` looks
 * previews up by that id, so a prop with no preview renders as a bare hotspot and a prop that gains
 * one starts compositing. Note Fraction Laser deliberately shares Mirror Maze's shell — if the two
 * end up sharing state types, they should share a preview component parameterised by binding rather
 * than get a copy each.
 */

import type { LitsPuzzle, ShadeGrid } from "../../../puzzles/LITS/logic";
import type { LogicPuzzle, MarkGrid } from "../../../puzzles/LogicGrid/logic";
import type { Board as MinesweeperBoard } from "../../../puzzles/Minesweeper/logic";
import type { CellContent, MirrorLevel } from "../../../puzzles/Mirror/logic";
import type { Cell as NonogramCell, NonogramPuzzle } from "../../../puzzles/Nonogram/logic";
import type { Grid as PipesGrid } from "../../../puzzles/Pipes/logic";

/**
 * A puzzle's state, in the puzzle's own types, tagged with the gadget id it belongs to.
 *
 * Each variant carries the puzzle definition alongside the player's marks because the previews need
 * both: a nonogram's clue rails come from the puzzle, its filled squares from the grid. Derived
 * quantities (Pipes' powered set, Mirror's beam path, LITS' rule violations) are deliberately NOT
 * stored — each preview recomputes them with the puzzle's own function, so there is no way for a
 * cached derivation in here to disagree with what the real puzzle would say.
 */
export type PreviewSnapshot =
  | { kind: "nonogram"; puzzle: NonogramPuzzle; grid: NonogramCell[][] }
  | { kind: "logic-grid"; puzzle: LogicPuzzle; marks: MarkGrid }
  | { kind: "minesweeper"; board: MinesweeperBoard }
  | { kind: "pipes"; grid: PipesGrid }
  | { kind: "lits"; puzzle: LitsPuzzle; shade: ShadeGrid }
  | { kind: "mirror"; level: MirrorLevel; mirrors: CellContent[][] };

export type PreviewKind = PreviewSnapshot["kind"];

/** Narrowing helper so each preview component can take its own variant, not the whole union. */
export type SnapshotOf<K extends PreviewKind> = Extract<PreviewSnapshot, { kind: K }>;

/**
 * A preview component. One prop, no callbacks — see the module comment for why the list is this
 * short.
 */
export type PuzzlePreview<K extends PreviewKind> = (props: {
  snapshot: SnapshotOf<K>;
}) => JSX.Element;
