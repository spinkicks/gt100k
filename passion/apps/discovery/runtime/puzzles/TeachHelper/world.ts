/**
 * The helper's world: a corridor with parcels in it, and a program that walks and grabs.
 *
 * WHY A SEPARATE RUNNER RATHER THAN A BIGGER `MachineState`
 * ------------------------------------------------------------------------------------------------
 * `src/code` moves a creature and knows nothing else, and it is shared by two shipped doors. Teaching
 * it about parcels would put a world into a type that two other puzzles use and neither needs. So the
 * *ops* are the shared ones — flattened by `flatten`, and the creature advanced by the shared `step` —
 * and only the effect of `take` is layered on here. The language stays one language; the world stays
 * this door's business.
 */
import { type MachineState, step } from "../../code/interpret";
import { MAX_OPS, type Program, flatten } from "../../code/program";
import { cellKey } from "../SpriteLoop/logic";

/** How long the corridor is. Short enough to read at a glance, long enough to hide a parcel in. */
export const CORRIDOR = 7;

/** Where the helper starts every round: the left end, facing east along the corridor. */
export const HELPER_START: MachineState = { x: 0, y: 0, facing: 1, pc: 0 };

export interface WorldFrame {
  readonly pose: { readonly x: number; readonly y: number; readonly facing: number };
  /** Cells that still hold a parcel at this tick. */
  readonly remaining: ReadonlySet<string>;
  /** How many parcels the helper is carrying. */
  readonly carried: number;
}

export interface WorldRun {
  readonly frames: readonly WorldFrame[];
  /** True when the run finished with nothing left on the floor. */
  readonly cleared: boolean;
  readonly truncated: boolean;
}

/**
 * Run a program over a starting arrangement of parcels.
 *
 * `take` picks up whatever is in the helper's own cell and does nothing at all when the cell is
 * empty. **Doing nothing is the important half of that rule**: a `take` that failed, or cost
 * something, or complained, would turn "grab everywhere" into a punished strategy — and grabbing
 * everywhere instead of only where you looked is exactly the insight this door is trying to detect.
 * The rule is one sentence long and is printed on screen, so nothing here has to be guessed.
 */
export function runWorld(
  program: Program,
  parcels: ReadonlySet<string>,
  start: MachineState = HELPER_START,
  maxOps: number = MAX_OPS,
): WorldRun {
  const { ops, truncated } = flatten(program, maxOps);
  let pose = start;
  let remaining = new Set(parcels);
  let carried = 0;

  const frames: WorldFrame[] = [
    { pose: { x: pose.x, y: pose.y, facing: pose.facing }, remaining: new Set(remaining), carried },
  ];

  for (let i = 0; i < ops.length; i++) {
    const op = ops[pose.pc]!;
    if (op.kind === "take") {
      const here = cellKey(pose.x, pose.y);
      if (remaining.has(here)) {
        remaining = new Set(remaining);
        remaining.delete(here);
        carried += 1;
      }
    }
    pose = step(ops, pose);
    frames.push({
      pose: { x: pose.x, y: pose.y, facing: pose.facing },
      remaining: new Set(remaining),
      carried,
    });
    if (pose.pc >= ops.length) break;
  }

  return { frames, cleared: remaining.size === 0, truncated };
}

/** Whether a program clears this arrangement. */
export function clears(program: Program, parcels: ReadonlySet<string>): boolean {
  return runWorld(program, parcels).cleared;
}

/** The corridor cell keys, left to right. The helper only ever walks row 0. */
export function corridorCells(): readonly string[] {
  return Array.from({ length: CORRIDOR }, (_, i) => cellKey(i, 0));
}
