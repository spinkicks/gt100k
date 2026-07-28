/**
 * One op, one tick, one new state.
 *
 * A STEPPER AND NOT A `run`. Trace & Repair's whole instrument is a step scrubber the child drags
 * through execution, so the unit the runtime exposes has to be the single tick. `run` in `trace.ts`
 * is a thin loop over this, and nothing in the app is allowed to have a private way of advancing a
 * program.
 *
 * PURE AND NON-MUTATING, so a trace can hold every intermediate state without any of them aliasing.
 * A scrubber that could be dragged backwards over shared objects would be a bug factory.
 */
import type { Direction, Op } from "./program";

/** Where the machine is, and which op it is about to apply. */
export interface MachineState {
  readonly x: number;
  readonly y: number;
  readonly facing: Direction;
  /** Index of the next op to apply. */
  readonly pc: number;
}

/** The visible part of a state: where the creature is and which way it points. */
export interface Pose {
  readonly x: number;
  readonly y: number;
  readonly facing: Direction;
}

export function poseOf(s: MachineState): Pose {
  return { x: s.x, y: s.y, facing: s.facing };
}

export function atEnd(ops: readonly Op[], s: MachineState): boolean {
  return s.pc >= ops.length;
}

/**
 * Column and row deltas per facing. North is negative y: the board's origin is top-left, matching
 * how the grid is laid out in CSS, so nothing has to flip an axis between the logic and the render.
 */
const DX: readonly number[] = [0, 1, 0, -1];
const DY: readonly number[] = [-1, 0, 1, 0];

function rotate(facing: Direction, quarters: number): Direction {
  return ((((facing + Math.trunc(quarters)) % 4) + 4) % 4) as Direction;
}

/**
 * Apply `ops[state.pc]`.
 *
 * Past the end this returns the state unchanged rather than throwing, so a caller that over-steps
 * stalls instead of crashing — which is exactly what a scrubber dragged to the far right does.
 */
export function step(ops: readonly Op[], state: MachineState): MachineState {
  if (atEnd(ops, state)) return state;
  const op = ops[state.pc]!;
  const pc = state.pc + 1;
  switch (op.kind) {
    case "step":
      return {
        x: state.x + DX[state.facing]!,
        y: state.y + DY[state.facing]!,
        facing: state.facing,
        pc,
      };
    case "turn":
      return { x: state.x, y: state.y, facing: rotate(state.facing, op.quarters), pc };
    case "idle":
      return { x: state.x, y: state.y, facing: state.facing, pc };
  }
}
