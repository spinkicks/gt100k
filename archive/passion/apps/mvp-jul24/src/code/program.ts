/**
 * The program representation shared by every door in the Code cabin.
 *
 * ONE LANGUAGE, THREE DOORS. The doors differ in what the child edits and in what counts as done;
 * they never differ in what a program is. That is what makes the blocks-to-typed climb meaningful — a
 * child moving from Sprite Loop to Trace & Repair meets the same language in a new representation,
 * not a second language. See `docs/superpowers/specs/2026-07-28-code-cabin-design.md` §3.
 *
 * WHAT IS NOT HERE YET. `set` and `if` are in the spec's IR and arrive with Trace & Repair, the door
 * that needs them. Building them now would be untested surface with no caller.
 *
 * ONE TICK IS ONE ATOMIC OP, and that is the load-bearing decision in this file. `move 3` is three
 * ticks, `wait 2` is two, `turn` is one. It matters because Sprite Loop's hardest tier distinguishes
 * two programs that trace the *same path at different speeds*: if a whole `move 3` collapsed into a
 * single tick, those two programs would produce identical traces and that tier could not exist.
 * Timing has to cost ticks for rule X1 to have anything to bite on.
 */

/** Quarter turns clockwise from north: 0 = N, 1 = E, 2 = S, 3 = W. */
export type Direction = 0 | 1 | 2 | 3;

/**
 * A statement as the child assembles it.
 *
 * `repeat` bodies hold non-repeat statements only — one level of nesting. That is a deliberate limit
 * for the first door rather than a property of the language: `flatten` recurses to any depth, so
 * lifting the limit is a change to the block editor and not to this file.
 */
export type Statement =
  | { readonly kind: "move"; readonly steps: number }
  | { readonly kind: "turn"; readonly quarters: number }
  | { readonly kind: "wait"; readonly ticks: number }
  | { readonly kind: "take" }
  | { readonly kind: "repeat"; readonly times: number; readonly body: readonly Statement[] };

export type Program = readonly Statement[];

/**
 * One tick's worth of work. `step` advances a cell, `idle` passes time, `turn` rotates.
 *
 * `take` is here even though the shared stepper does nothing with it. The reason is the claim this
 * file opens with: **one language, three doors**. Teach the Helper needs a verb that acts on the
 * world rather than on the creature, and giving that door a private language would have made the
 * blocks-to-typed climb a change of subject at the third step. So the *word* is shared and only its
 * *effect* is door-specific — `interpret.ts` moves the creature and leaves the world alone, and
 * `TeachHelper/world.ts` layers the world effect on top of exactly the same ops.
 */
export type Op =
  | { readonly kind: "step" }
  | { readonly kind: "turn"; readonly quarters: number }
  | { readonly kind: "idle" }
  | { readonly kind: "take" };

export interface FlattenResult {
  readonly ops: readonly Op[];
  /** True when the cap was reached. A reported outcome, never a thrown one — see `trace.ts`. */
  readonly truncated: boolean;
}

/**
 * The default op cap.
 *
 * Nothing in this door can loop forever — `repeat` is bounded and there is no `while` yet — so this
 * guards against nested repeats multiplying rather than against non-termination. It is already the
 * right shape for `while`, which arrives with PR 2.
 */
export const MAX_OPS = 4096;

/**
 * Flatten nested statements into atomic ops, stopping at `maxOps`.
 *
 * A zero or negative count produces nothing rather than throwing. The block editor can hold a
 * half-built `repeat 0`, and a room that crashed on one would be punishing the child for editing.
 */
export function flatten(program: Program, maxOps: number): FlattenResult {
  const ops: Op[] = [];
  let truncated = false;

  const push = (op: Op): boolean => {
    if (ops.length >= maxOps) {
      truncated = true;
      return false;
    }
    ops.push(op);
    return true;
  };

  const walk = (stmts: readonly Statement[]): boolean => {
    for (const s of stmts) {
      switch (s.kind) {
        case "move":
          for (let i = 0; i < Math.trunc(s.steps); i++) {
            if (!push({ kind: "step" })) return false;
          }
          break;
        case "wait":
          for (let i = 0; i < Math.trunc(s.ticks); i++) {
            if (!push({ kind: "idle" })) return false;
          }
          break;
        case "turn":
          if (!push({ kind: "turn", quarters: s.quarters })) return false;
          break;
        case "take":
          if (!push({ kind: "take" })) return false;
          break;
        case "repeat":
          for (let i = 0; i < Math.trunc(s.times); i++) {
            if (!walk(s.body)) return false;
          }
          break;
      }
    }
    return true;
  };

  walk(program);
  return { ops, truncated };
}
