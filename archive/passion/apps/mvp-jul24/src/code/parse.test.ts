import { describe, expect, it } from "vitest";
import { VERBS, parseLine, printLine } from "./parse";
import type { Statement } from "./program";

describe("parseLine", () => {
  it("reads move and wait with a whole number", () => {
    expect(parseLine("move 3")).toEqual({ ok: true, statement: { kind: "move", steps: 3 } });
    expect(parseLine("wait 2")).toEqual({ ok: true, statement: { kind: "wait", ticks: 2 } });
  });

  it("reads both turn sides", () => {
    expect(parseLine("turn left")).toEqual({ ok: true, statement: { kind: "turn", quarters: -1 } });
    expect(parseLine("turn right")).toEqual({ ok: true, statement: { kind: "turn", quarters: 1 } });
  });

  it("forgives spacing and capitals, because typing is not the skill being measured", () => {
    expect(parseLine("  MOVE   3 ")).toEqual({ ok: true, statement: { kind: "move", steps: 3 } });
  });

  it("gives a distinct reason for each way a line can be unfinished", () => {
    expect(parseLine("")).toEqual({ ok: false, reason: "empty" });
    expect(parseLine("   ")).toEqual({ ok: false, reason: "empty" });
    expect(parseLine("jump 2")).toEqual({ ok: false, reason: "unknown-word" });
    expect(parseLine("move")).toEqual({ ok: false, reason: "needs-number" });
    expect(parseLine("move left")).toEqual({ ok: false, reason: "needs-number" });
    expect(parseLine("turn")).toEqual({ ok: false, reason: "needs-side" });
    expect(parseLine("turn sideways")).toEqual({ ok: false, reason: "needs-side" });
  });

  it("never throws on a half-typed line, whatever is in it", () => {
    for (const junk of ["m", "move -", "move 1x", "turn l", "!!", "3", "wait wait"]) {
      expect(() => parseLine(junk)).not.toThrow();
    }
  });

  it("accepts zero, which is a legal thing to have typed on the way to something else", () => {
    expect(parseLine("move 0")).toEqual({ ok: true, statement: { kind: "move", steps: 0 } });
  });
});

describe("printLine round-trips with parseLine", () => {
  const cases: Statement[] = [
    { kind: "move", steps: 1 },
    { kind: "move", steps: 4 },
    { kind: "wait", ticks: 2 },
    { kind: "turn", quarters: 1 },
    { kind: "turn", quarters: -1 },
  ];

  it.each(cases)("prints %o so that parsing it back gives the same statement", (s) => {
    const printed = printLine(s);
    const back = parseLine(printed);
    expect(back.ok).toBe(true);
    if (back.ok) expect(back.statement).toEqual(s);
  });
});

describe("VERBS", () => {
  it("lists every word parseLine accepts, so the on-screen list cannot drift from the parser", () => {
    for (const v of VERBS) {
      // Each verb, given its own valid argument, must parse.
      const line = v === "turn" ? "turn left" : `${v} 1`;
      expect(parseLine(line).ok).toBe(true);
    }
    expect(parseLine("repeat 2").ok).toBe(false);
  });
});
