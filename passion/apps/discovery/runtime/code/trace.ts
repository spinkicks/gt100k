/**
 * A whole run, as the sequence of states it passed through.
 *
 * WHY TRUNCATION IS A REPORTED OUTCOME AND NOT AN ERROR. A program that runs longer than the room is
 * willing to wait is a real thing that happens in this domain, and the honest thing to tell a child
 * is "it never stopped" — which is a fact about their program and a genuine lesson. Throwing would
 * turn it into a crash; silently capping would turn it into a wrong answer with no explanation. So
 * `truncated` rides along on the result and the surface decides how to say it.
 *
 * `frames[0]` is the start state, before any op has run. So `frames.length` is ticks + 1, and a
 * scrubber's leftmost position is a real frame rather than a special case.
 */
import { type MachineState, atEnd, step } from "./interpret";
import { MAX_OPS, type Program, flatten } from "./program";

export interface Trace {
  /** One state per tick, starting with the un-executed start state. */
  readonly frames: readonly MachineState[];
  /** True when the op cap was hit while flattening. */
  readonly truncated: boolean;
}

export function run(program: Program, start: MachineState, maxOps: number = MAX_OPS): Trace {
  const { ops, truncated } = flatten(program, maxOps);
  const frames: MachineState[] = [start];
  let cur = start;
  while (!atEnd(ops, cur)) {
    cur = step(ops, cur);
    frames.push(cur);
  }
  return { frames, truncated };
}
