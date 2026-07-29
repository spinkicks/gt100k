/**
 * The two reference programs this door is measured against.
 *
 * `writtenForWhatYouSee` is the program a child writes when they read the board in front of them and
 * nothing else: walk the corridor, and grab **only at the cells that currently hold a parcel**. It is
 * a perfectly sensible thing to write and it is the answer this door exists to catch.
 *
 * `writtenForWhatCouldBeThere` grabs at every cell. Identical effort, one idea different, and it is
 * the idea: *do not write for the arrangement you happen to be looking at.*
 *
 * A round is only worth showing when the first program fails and the second passes, which is what
 * `generate.ts` rejection-samples for and `generate.test.ts` asserts. Without that gap the round
 * accepts the naive answer and measures nothing at all.
 */
import type { Program, Statement } from "../../code/program";
import { cellKey } from "../SpriteLoop/logic";
import { CORRIDOR } from "./world";

/** Walk the corridor, taking only where a parcel can be seen right now. The trap. */
export function writtenForWhatYouSee(visible: ReadonlySet<string>): Program {
  const out: Statement[] = [];
  for (let i = 0; i < CORRIDOR; i++) {
    if (visible.has(cellKey(i, 0))) out.push({ kind: "take" });
    if (i < CORRIDOR - 1) out.push({ kind: "move", steps: 1 });
  }
  return out;
}

/** Walk the corridor, taking everywhere. The insight. */
export function writtenForWhatCouldBeThere(): Program {
  const out: Statement[] = [];
  for (let i = 0; i < CORRIDOR; i++) {
    out.push({ kind: "take" });
    if (i < CORRIDOR - 1) out.push({ kind: "move", steps: 1 });
  }
  return out;
}

/**
 * The same insight written the short way, with a repeat.
 *
 * Kept because a child who reaches for `repeat` has found something better than the long form and the
 * door must not quietly prefer the verbose answer. A test asserts this clears every round too.
 */
export function writtenWithARepeat(): Program {
  return [
    { kind: "take" },
    {
      kind: "repeat",
      times: CORRIDOR - 1,
      body: [{ kind: "move", steps: 1 }, { kind: "take" }],
    },
  ];
}
