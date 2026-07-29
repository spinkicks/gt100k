/**
 * One line of program text, in and out.
 *
 * A LINE PARSER AND NOT A LANGUAGE PARSER, deliberately. Trace & Repair lets a child retype exactly
 * one line, so what has to be parsed is a single statement — never a block, never nesting, never a
 * file. Structure is fixed by the puzzle and only a leaf can change. That is what keeps the typed door
 * from needing a grammar, an error-recovery story, or a cursor that can land somewhere meaningless.
 *
 * THE VOCABULARY IS TINY AND IS SHOWN ON SCREEN. A child cannot be asked to guess a word. Every verb
 * this accepts appears in the puzzle's own word list, which is why `VERBS` is exported: the component
 * renders it rather than repeating it, so the two can never drift.
 *
 * FAILURE IS A REASON, NOT AN EXCEPTION. A half-typed line is the normal state of a line being typed,
 * so `parseLine` returns a result and the surface decides what to say. Throwing here would mean every
 * keystroke could crash the room.
 */
import type { Statement } from "./program";

/** Every word a line may start with. Rendered on screen by the puzzle; never duplicated there. */
export const VERBS = ["move", "turn", "wait", "take"] as const;

export type ParseResult =
  | { readonly ok: true; readonly statement: Statement }
  | {
      readonly ok: false;
      readonly reason: "empty" | "unknown-word" | "needs-number" | "needs-side";
    };

/**
 * Parse one line.
 *
 * `move n` and `wait n` take a whole number; `turn left` and `turn right` take a side. Anything else
 * is a reason, and the reasons are distinct because "I don't know that word" and "how many?" want
 * different things said back.
 */
export function parseLine(text: string): ParseResult {
  const parts = text.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { ok: false, reason: "empty" };

  const [verb, arg] = parts;
  if (verb === "take") return { ok: true, statement: { kind: "take" } };
  if (verb === "turn") {
    if (arg === "left") return { ok: true, statement: { kind: "turn", quarters: -1 } };
    if (arg === "right") return { ok: true, statement: { kind: "turn", quarters: 1 } };
    return { ok: false, reason: "needs-side" };
  }

  if (verb === "move" || verb === "wait") {
    if (arg === undefined || !/^\d+$/.test(arg)) return { ok: false, reason: "needs-number" };
    const n = Number.parseInt(arg, 10);
    return verb === "move"
      ? { ok: true, statement: { kind: "move", steps: n } }
      : { ok: true, statement: { kind: "wait", ticks: n } };
  }

  return { ok: false, reason: "unknown-word" };
}

/**
 * Print one statement as the line a child would type.
 *
 * Round-trips with `parseLine` — a test asserts it — because the puzzle prints the program it
 * generated and then reads back whatever the child typed over it. If the two disagreed, a line nobody
 * edited could change meaning just by being displayed.
 */
export function printLine(s: Statement): string {
  switch (s.kind) {
    case "move":
      return `move ${s.steps}`;
    case "wait":
      return `wait ${s.ticks}`;
    case "turn":
      return s.quarters > 0 ? "turn right" : "turn left";
    case "take":
      return "take";
    case "repeat":
      return `repeat ${s.times}`;
  }
}
