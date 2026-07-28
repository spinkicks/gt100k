/**
 * The reference solver: every single-line repair, scored two ways.
 *
 * TWO COUNTS, ON PURPOSE, exactly as in Sprite Loop's `naive.ts`. `repairsByRun` uses the real
 * criterion — the whole pose sequence. `repairsByEnding` uses the weaker one a child would be using if
 * they only looked at where the creature stopped. The gap between the two counts is rule X1 made
 * measurable: if several edits reach the right ending and only one reproduces the right run, then the
 * ending cannot tell you which line was wrong, and the scrubber is doing real work.
 *
 * The edit space is deliberately small and fixed (`EDIT_VOCABULARY`): every line, replaced by every
 * plausible statement. Nine lines by eight statements is seventy-two programs, which is nothing, and
 * it runs only in tests.
 */
import type { Program, Statement } from "../../code/program";
import { type TraceRepairPuzzle, isSolved, sameEnding, withLine } from "./logic";

/**
 * The statements a repair may use.
 *
 * Wider than any generated bug needs, on purpose: a solver that could only try the statements the
 * generator uses would prove nothing about a child who types something else.
 */
export const EDIT_VOCABULARY: readonly Statement[] = [
  { kind: "move", steps: 1 },
  { kind: "move", steps: 2 },
  { kind: "move", steps: 3 },
  { kind: "move", steps: 4 },
  { kind: "turn", quarters: 1 },
  { kind: "turn", quarters: -1 },
  { kind: "wait", ticks: 1 },
  { kind: "wait", ticks: 2 },
];

export interface Repair {
  readonly line: number;
  readonly statement: Statement;
  readonly program: Program;
}

/** Every one-line edit of the buggy program, including ones that change nothing. */
export function allSingleLineEdits(puzzle: TraceRepairPuzzle): readonly Repair[] {
  const out: Repair[] = [];
  for (let line = 0; line < puzzle.buggy.length; line++) {
    for (const statement of EDIT_VOCABULARY) {
      out.push({ line, statement, program: withLine(puzzle.buggy, line, statement) });
    }
  }
  return out;
}

/** Edits that reproduce the intended run tick for tick. The real criterion. */
export function repairsByRun(puzzle: TraceRepairPuzzle): readonly Repair[] {
  return allSingleLineEdits(puzzle).filter((r) => isSolved(puzzle, r.program));
}

/** Edits that merely finish where the intended run finishes. Never a solve check. */
export function repairsByEnding(puzzle: TraceRepairPuzzle): readonly Repair[] {
  return allSingleLineEdits(puzzle).filter((r) => sameEnding(puzzle, r.program, puzzle.intended));
}

/** Which lines a child could blame if they judged only by where the creature stopped. */
export function linesBlamedByEnding(puzzle: TraceRepairPuzzle): ReadonlySet<number> {
  return new Set(repairsByEnding(puzzle).map((r) => r.line));
}
