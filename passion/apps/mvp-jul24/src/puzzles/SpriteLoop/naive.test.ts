import { describe, expect, it } from "vitest";
import type { MachineState } from "../../code/interpret";
import type { Program } from "../../code/program";
import type { SpriteLoopPuzzle, TrayBlock } from "./logic";
import { enumeratePrograms, solutionsByPose, solutionsByTrail } from "./naive";

const START: MachineState = { x: 4, y: 4, facing: 0, pc: 0 };
const TRAY: readonly TrayBlock[] = [
  { kind: "move", steps: 1 },
  { kind: "turn", quarters: 1 },
  { kind: "wait", ticks: 1 },
];

describe("enumeratePrograms", () => {
  it("counts tray^length summed over lengths 1..maxLength", () => {
    // 3 blocks: 3 programs of length 1 and 9 of length 2, so 12.
    expect(enumeratePrograms(TRAY, 2)).toHaveLength(12);
  });

  it("skips repeat blocks, since a repeat adds no behaviour its body cannot reach", () => {
    const withRepeat: readonly TrayBlock[] = [...TRAY, { kind: "repeat", times: 2 }];
    expect(enumeratePrograms(withRepeat, 1)).toHaveLength(3);
  });
});

describe("solutionsByPose", () => {
  it("finds the target itself", () => {
    const target: Program = [
      { kind: "move", steps: 1 },
      { kind: "turn", quarters: 1 },
    ];
    const puzzle: SpriteLoopPuzzle = { start: START, target, tray: TRAY };
    const found = solutionsByPose(puzzle, 2);
    expect(found).toHaveLength(1);
    expect(found[0]).toEqual(target);
  });
});

describe("matching the trail is strictly weaker than matching the trace", () => {
  it("admits more programs when timing is discarded", () => {
    // The target steps once and then pauses. Its trail is two cells; so is the trail of stepping
    // once and turning in place, and of stepping once and pausing. Timing and facing tell those
    // apart and a drawn path does not.
    const target: Program = [
      { kind: "move", steps: 1 },
      { kind: "wait", ticks: 1 },
    ];
    const puzzle: SpriteLoopPuzzle = { start: START, target, tray: TRAY };
    const byPose = solutionsByPose(puzzle, 2);
    const byTrail = solutionsByTrail(puzzle, 2);
    expect(byPose).toHaveLength(1);
    expect(byTrail.length).toBeGreaterThan(byPose.length);
  });
});
