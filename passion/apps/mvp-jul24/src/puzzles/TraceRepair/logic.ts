/**
 * Trace & Repair — a program that does the wrong thing, and one line is why.
 *
 * WHAT THIS DOOR INVERTS FROM SPRITE LOOP, AND WHY THAT IS NOT A CONTRADICTION
 * ------------------------------------------------------------------------------------------------
 * Sprite Loop never shows the target's code, because there the target is a *behaviour* and printing
 * the code would hand over the answer. Here the code is shown, because here the code is the *broken
 * thing* — hiding it would leave nothing to repair. What is hidden instead is **which line is at
 * fault**, and that is the only thing the child has to find.
 *
 * Same language, same board, same creature, printed as text instead of assembled as blocks. That is
 * the blocks-to-typed climb made literal: a child arriving from Sprite Loop meets a world they already
 * know in a representation they do not.
 *
 * THE SOLVE CRITERION IS THE WHOLE RUN, NOT THE ENDING (rule X1)
 * ------------------------------------------------------------------------------------------------
 * A repair counts when the edited program's pose sequence equals the intended one tick for tick. Not
 * when it merely finishes in the right place — and the difference is the whole design of this door.
 * `generate.test.ts` asserts, per round, that **several distinct single-line edits reach the intended
 * final pose while exactly one reproduces the intended run.** So the ending genuinely underdetermines
 * the repair, a child guessing from where the creature stopped will land on a wrong line, and the
 * scrubber is not decoration but the instrument that separates the candidates.
 *
 * That is the same guard Sprite Loop applies on the other axis: there, the drawn path underdetermines
 * the behaviour; here, the final pose underdetermines the run.
 *
 * NO PROSE IN THE PUZZLE. Logic Grid was dropped from `logic-games` because it loads on reading
 * comprehension as much as deduction, which makes engagement unattributable. So a round carries code
 * and a board and nothing to read: the intended result is shown as a creature that moves, never as a
 * sentence describing where it should go.
 */
import { type MachineState, type Pose } from "../../code/interpret";
import { MAX_OPS, type Program, type Statement } from "../../code/program";
import { run } from "../../code/trace";
import { poseSequence } from "../SpriteLoop/logic";

export interface TraceRepairPuzzle {
  readonly start: MachineState;
  /**
   * What the program was supposed to do. **Never printed as code** — the child meets it only as the
   * pale creature moving alongside theirs, exactly as in Sprite Loop.
   */
  readonly intended: Program;
  /** The program as it actually is, shown line by line. Differs from `intended` in exactly one line. */
  readonly buggy: Program;
  /**
   * Which line is wrong, zero-based. Held for tests and for the generator's own guarantees; the
   * component must never render or hint at it, which is the entire puzzle.
   */
  readonly bugLine: number;
}

/** One pose per tick for a program, on this puzzle's board. */
export function posesOf(puzzle: TraceRepairPuzzle, program: Program): readonly Pose[] {
  return poseSequence(program, puzzle.start, MAX_OPS);
}

/** A repair is right when the run matches, tick for tick. */
export function isSolved(puzzle: TraceRepairPuzzle, attempt: Program): boolean {
  const want = posesOf(puzzle, puzzle.intended);
  const got = posesOf(puzzle, attempt);
  if (got.length !== want.length) return false;
  return want.every((p, i) => p.x === got[i]!.x && p.y === got[i]!.y && p.facing === got[i]!.facing);
}

/** Whether two programs finish in the same place, facing the same way. The weaker criterion. */
export function sameEnding(puzzle: TraceRepairPuzzle, a: Program, b: Program): boolean {
  const pa = posesOf(puzzle, a);
  const pb = posesOf(puzzle, b);
  const ea = pa[pa.length - 1]!;
  const eb = pb[pb.length - 1]!;
  return ea.x === eb.x && ea.y === eb.y && ea.facing === eb.facing;
}

/**
 * The first tick at which two runs part company, or `null` if they never do.
 *
 * Read by the generator to guarantee the divergence happens *inside* the run rather than on the last
 * tick — if the two only differ at the end, the scrubber has nothing to show that the final board does
 * not already say.
 */
export function divergenceTick(a: readonly Pose[], b: readonly Pose[]): number | null {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const p = a[i]!;
    const q = b[i]!;
    if (p.x !== q.x || p.y !== q.y || p.facing !== q.facing) return i;
  }
  return a.length === b.length ? null : n;
}

/** Replace one line, leaving the rest of the program alone. The only edit this door allows. */
export function withLine(program: Program, index: number, s: Statement): Program {
  return program.map((old, i) => (i === index ? s : old));
}

/** Whether a program's whole run stays on the board. */
export function staysOnBoard(
  puzzle: TraceRepairPuzzle,
  program: Program,
  inBounds: (p: Pose) => boolean,
): boolean {
  return posesOf(puzzle, program).every(inBounds);
}

/** Total ticks a program takes. Used by the scrubber to size itself. */
export function tickCount(puzzle: TraceRepairPuzzle, program: Program): number {
  return run(program, puzzle.start, MAX_OPS).frames.length;
}
