import { describe, expect, it } from "vitest";
import { type MachineState, atEnd, poseOf, step } from "./interpret";
import type { Op } from "./program";

const START: MachineState = { x: 4, y: 4, facing: 0, pc: 0 };

describe("step", () => {
  it("moves north as decreasing y, because the board's origin is top-left", () => {
    const after = step([{ kind: "step" }], START);
    expect(poseOf(after)).toEqual({ x: 4, y: 3, facing: 0 });
  });

  it("moves east, south and west from the matching facings", () => {
    const ops: readonly Op[] = [{ kind: "step" }];
    expect(poseOf(step(ops, { ...START, facing: 1 }))).toEqual({ x: 5, y: 4, facing: 1 });
    expect(poseOf(step(ops, { ...START, facing: 2 }))).toEqual({ x: 4, y: 5, facing: 2 });
    expect(poseOf(step(ops, { ...START, facing: 3 }))).toEqual({ x: 3, y: 4, facing: 3 });
  });

  it("turns clockwise and wraps through north", () => {
    const ops: readonly Op[] = [{ kind: "turn", quarters: 1 }];
    expect(step(ops, { ...START, facing: 3 }).facing).toBe(0);
  });

  it("turns anticlockwise on a negative quarter", () => {
    expect(step([{ kind: "turn", quarters: -1 }], START).facing).toBe(3);
  });

  it("idles without moving but still spends a tick", () => {
    const after = step([{ kind: "idle" }], START);
    expect(poseOf(after)).toEqual(poseOf(START));
    expect(after.pc).toBe(1);
  });

  it("advances the program counter by exactly one op", () => {
    expect(step([{ kind: "step" }, { kind: "step" }], START).pc).toBe(1);
  });

  it("is a no-op past the end, so a caller cannot run off the list", () => {
    const done: MachineState = { ...START, pc: 1 };
    expect(step([{ kind: "step" }], done)).toEqual(done);
    expect(atEnd([{ kind: "step" }], done)).toBe(true);
  });

  it("never mutates the state it is given", () => {
    const before = { ...START };
    step([{ kind: "step" }], START);
    expect(START).toEqual(before);
  });
});
