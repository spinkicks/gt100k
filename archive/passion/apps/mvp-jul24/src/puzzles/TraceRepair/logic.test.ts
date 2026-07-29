import { describe, expect, it } from "vitest";
import type { MachineState } from "../../code/interpret";
import type { Program } from "../../code/program";
import { inBounds } from "../SpriteLoop/logic";
import {
  type TraceRepairPuzzle,
  divergenceTick,
  isSolved,
  posesOf,
  sameEnding,
  staysOnBoard,
  tickCount,
  withLine,
} from "./logic";

const START: MachineState = { x: 4, y: 4, facing: 0, pc: 0 };

const INTENDED: Program = [
  { kind: "move", steps: 2 },
  { kind: "turn", quarters: 1 },
  { kind: "move", steps: 2 },
];

const puzzle: TraceRepairPuzzle = {
  start: START,
  intended: INTENDED,
  buggy: withLine(INTENDED, 1, { kind: "turn", quarters: -1 }),
  bugLine: 1,
};

describe("isSolved", () => {
  it("accepts the edit that restores the intended run", () => {
    expect(isSolved(puzzle, withLine(puzzle.buggy, 1, { kind: "turn", quarters: 1 }))).toBe(true);
  });

  it("rejects the program as it arrives", () => {
    expect(isSolved(puzzle, puzzle.buggy)).toBe(false);
  });

  it("rejects a program of the wrong length", () => {
    expect(isSolved(puzzle, [{ kind: "move", steps: 2 }])).toBe(false);
  });

  it("rejects a run that ends in the right place by a different route — rule X1", () => {
    // Three lefts finish facing the same way as one right, so an ending-only check would pass this.
    const intended: Program = [{ kind: "turn", quarters: 1 }];
    const p: TraceRepairPuzzle = {
      start: START,
      intended,
      buggy: [{ kind: "turn", quarters: -1 }],
      bugLine: 0,
    };
    const detour: Program = [{ kind: "turn", quarters: -3 }];
    expect(sameEnding(p, detour, intended)).toBe(true);
    expect(isSolved(p, detour)).toBe(true); // same length AND same poses: legitimately correct
    const slower: Program = [
      { kind: "wait", ticks: 1 },
      { kind: "turn", quarters: 1 },
    ];
    expect(sameEnding(p, slower, intended)).toBe(true);
    expect(isSolved(p, slower)).toBe(false); // right ending, wrong run
  });
});

describe("divergenceTick", () => {
  it("finds the first tick where two runs differ", () => {
    const a = posesOf(puzzle, puzzle.intended);
    const b = posesOf(puzzle, puzzle.buggy);
    const d = divergenceTick(a, b);
    expect(d).not.toBeNull();
    // Both walk two north first, so they cannot part company before the turn resolves.
    expect(d).toBeGreaterThan(2);
  });

  it("is null for two identical runs", () => {
    const a = posesOf(puzzle, puzzle.intended);
    expect(divergenceTick(a, a)).toBeNull();
  });

  it("reports the shorter length when one run is a prefix of the other", () => {
    const short = posesOf(puzzle, [{ kind: "move", steps: 1 }]);
    const long = posesOf(puzzle, [{ kind: "move", steps: 3 }]);
    expect(divergenceTick(short, long)).toBe(short.length);
  });
});

describe("withLine", () => {
  it("changes one line and leaves every other alone", () => {
    const edited = withLine(INTENDED, 0, { kind: "move", steps: 9 });
    expect(edited[0]).toEqual({ kind: "move", steps: 9 });
    expect(edited[1]).toEqual(INTENDED[1]);
    expect(edited[2]).toEqual(INTENDED[2]);
    expect(INTENDED[0]).toEqual({ kind: "move", steps: 2 });
  });
});

describe("staysOnBoard and tickCount", () => {
  it("says when a run leaves the board", () => {
    expect(staysOnBoard(puzzle, INTENDED, inBounds)).toBe(true);
    expect(staysOnBoard(puzzle, [{ kind: "move", steps: 40 }], inBounds)).toBe(false);
  });

  it("counts ticks including the start frame", () => {
    expect(tickCount(puzzle, [{ kind: "move", steps: 2 }])).toBe(3);
  });
});
