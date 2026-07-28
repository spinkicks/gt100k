/**
 * Sprite Loop — build a behaviour that matches a demonstrated one.
 *
 * NO MAZE, NO OBSTACLES, NO GOAL TILE, AND THAT IS THE DESIGN
 * ------------------------------------------------------------------------------------------------
 * "Reach the goal past the obstacles" is constraint satisfaction, which this app already measures
 * four times over in `logic-games`. Shipping it here would report programming interest for a child
 * who likes deduction — the same class of false positive the logic/math split was created to remove.
 * So the board is empty and the target is *motion*.
 *
 * THE SOLVE CRITERION IS THE POSE SEQUENCE, NEVER THE TRAIL (rules X1 and X2)
 * ------------------------------------------------------------------------------------------------
 * One pose per tick, compared in order. Two consequences, both intended:
 *
 *  - **Different spellings of the same behaviour are both right.** `move 2` and two `move 1`s are the
 *    same program once flattened. The room asks for a behaviour, not for one phrasing of it, and
 *    marking a child wrong for finding a shorter way to say the same thing would teach the opposite
 *    of what this room is for.
 *  - **The same path at a different speed is wrong.** That is why `wait` exists and why a tick is one
 *    atomic op. `trailOf` below throws timing away, and the generator's hardest tier is authored so
 *    that two tray programs share a trail and differ in trace — a child who matched only the drawn
 *    shape would have no way to choose between them. `naive.ts` proves it and `generate.test.ts`
 *    asserts it.
 *
 * `trailOf` is therefore NOT a fallback solve check and must never be used as one. It exists to make
 * the weaker criterion measurable, so that a test can assert it is weaker.
 *
 * WHY FACING IS COMPARED. The creature is drawn pointing somewhere, so its facing is on screen. A
 * criterion that ignored it would accept a program the child can see is wrong, which teaches that the
 * room does not read what it displays.
 */
import { type MachineState, type Pose, poseOf } from "../../code/interpret";
import { MAX_OPS, type Program } from "../../code/program";
import { run } from "../../code/trace";

/**
 * The board is 9x9 and has **no walls**.
 *
 * There is no wall rule because a wall would be a hidden mechanic the child was never told about, and
 * "the creature stopped and I don't know why" is close to the worst thing this room could teach.
 * Instead the generator guarantees every target stays on the board by rejection — see
 * `generate.ts`.
 */
export const GRID = 9;

/** A block the child may take from the tray. A `repeat` arrives with an empty body. */
export type TrayBlock =
  | { readonly kind: "move"; readonly steps: number }
  | { readonly kind: "turn"; readonly quarters: number }
  | { readonly kind: "wait"; readonly ticks: number }
  | { readonly kind: "repeat"; readonly times: number };

export interface SpriteLoopPuzzle {
  readonly start: MachineState;
  /**
   * The ghost's program. **Never rendered as code** — the child meets it only as motion, which is
   * rule X2. Nothing in the component may print it.
   */
  readonly target: Program;
  /** Which blocks this round offers. Bounding the tray is what lets `naive.ts` enumerate at all. */
  readonly tray: readonly TrayBlock[];
}

export function poseSequence(
  program: Program,
  start: MachineState,
  maxOps: number = MAX_OPS,
): readonly Pose[] {
  return run(program, start, maxOps).frames.map(poseOf);
}

export function isSolved(puzzle: SpriteLoopPuzzle, attempt: Program): boolean {
  const want = poseSequence(puzzle.target, puzzle.start);
  const got = poseSequence(attempt, puzzle.start);
  if (got.length !== want.length) return false;
  return want.every((p, i) => p.x === got[i]!.x && p.y === got[i]!.y && p.facing === got[i]!.facing);
}

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * The set of cells a run visits, with order and timing discarded.
 *
 * This is the criterion a child would be using if the demonstration left a drawn path behind it, and
 * the reason it does not. Read by tests and by nothing else.
 */
export function trailOf(poses: readonly Pose[]): ReadonlySet<string> {
  return new Set(poses.map((p) => cellKey(p.x, p.y)));
}

export function inBounds(p: Pose): boolean {
  return p.x >= 0 && p.x < GRID && p.y >= 0 && p.y < GRID;
}
