import { describe, expect, it } from "vitest";
import type { MachineState } from "../../code/interpret";
import type { Program } from "../../code/program";
import { type SpriteLoopPuzzle, inBounds, isSolved, poseSequence, trailOf } from "./logic";

const START: MachineState = { x: 4, y: 4, facing: 0, pc: 0 };

const puzzleFor = (target: Program): SpriteLoopPuzzle => ({
  start: START,
  target,
  tray: [
    { kind: "move", steps: 1 },
    { kind: "turn", quarters: 1 },
    { kind: "wait", ticks: 1 },
  ],
});

describe("poseSequence", () => {
  it("is one pose per tick including the start", () => {
    expect(poseSequence([{ kind: "move", steps: 2 }], START)).toEqual([
      { x: 4, y: 4, facing: 0 },
      { x: 4, y: 3, facing: 0 },
      { x: 4, y: 2, facing: 0 },
    ]);
  });
});

describe("isSolved", () => {
  it("accepts an identical program", () => {
    const target: Program = [
      { kind: "move", steps: 2 },
      { kind: "turn", quarters: 1 },
    ];
    expect(isSolved(puzzleFor(target), target)).toBe(true);
  });

  it("accepts a different program with the same pose sequence", () => {
    // `move 2` and two `move 1`s flatten to the same ops, so both are right. The room asks for a
    // behaviour, never for one particular spelling of it.
    const target: Program = [{ kind: "move", steps: 2 }];
    const attempt: Program = [
      { kind: "move", steps: 1 },
      { kind: "move", steps: 1 },
    ];
    expect(isSolved(puzzleFor(target), attempt)).toBe(true);
  });

  it("rejects the same path walked at a different speed — rule X1", () => {
    const target: Program = [
      { kind: "move", steps: 1 },
      { kind: "wait", ticks: 1 },
      { kind: "move", steps: 1 },
    ];
    const attempt: Program = [{ kind: "move", steps: 2 }];
    expect(isSolved(puzzleFor(target), attempt)).toBe(false);
  });

  it("rejects a program that ends facing elsewhere, since facing is on screen", () => {
    const target: Program = [
      { kind: "move", steps: 1 },
      { kind: "turn", quarters: 1 },
    ];
    const attempt: Program = [
      { kind: "move", steps: 1 },
      { kind: "turn", quarters: -1 },
    ];
    expect(isSolved(puzzleFor(target), attempt)).toBe(false);
  });

  it("rejects a program of a different length", () => {
    expect(isSolved(puzzleFor([{ kind: "move", steps: 2 }]), [{ kind: "move", steps: 1 }])).toBe(
      false,
    );
  });

  it("rejects an empty attempt", () => {
    expect(isSolved(puzzleFor([{ kind: "move", steps: 1 }]), [])).toBe(false);
  });
});

describe("trailOf", () => {
  it("collapses timing away — which is exactly why it is not the solve criterion", () => {
    const slow = poseSequence(
      [
        { kind: "move", steps: 1 },
        { kind: "wait", ticks: 3 },
        { kind: "move", steps: 1 },
      ],
      START,
    );
    const fast = poseSequence([{ kind: "move", steps: 2 }], START);
    expect(trailOf(slow)).toEqual(trailOf(fast));
    expect(slow).not.toEqual(fast);
  });
});

describe("inBounds", () => {
  it("accepts the middle and rejects off-board", () => {
    expect(inBounds({ x: 0, y: 0, facing: 0 })).toBe(true);
    expect(inBounds({ x: -1, y: 4, facing: 0 })).toBe(false);
    expect(inBounds({ x: 4, y: 9, facing: 0 })).toBe(false);
  });
});
