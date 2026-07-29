import { describe, expect, it } from "vitest";
import type { MachineState } from "./interpret";
import type { Program } from "./program";
import { run } from "./trace";

const START: MachineState = { x: 4, y: 4, facing: 0, pc: 0 };

describe("run", () => {
  it("includes the start as the first frame, so a scrubber has something to show at tick zero", () => {
    const t = run([{ kind: "move", steps: 2 }], START);
    expect(t.frames).toHaveLength(3);
    expect(t.frames[0]).toEqual(START);
  });

  it("produces one frame per tick", () => {
    const t = run(
      [
        { kind: "move", steps: 1 },
        { kind: "turn", quarters: 1 },
      ],
      START,
    );
    expect(t.frames.map((f) => [f.x, f.y, f.facing])).toEqual([
      [4, 4, 0],
      [4, 3, 0],
      [4, 3, 1],
    ]);
  });

  it("counts a wait as a tick that changes nothing", () => {
    const t = run([{ kind: "wait", ticks: 2 }], START);
    expect(t.frames).toHaveLength(3);
    expect(t.frames[2]).toEqual({ ...START, pc: 2 });
  });

  it("reports truncation rather than hanging or throwing", () => {
    const p: Program = [{ kind: "repeat", times: 5000, body: [{ kind: "move", steps: 1 }] }];
    const t = run(p, START, 32);
    expect(t.truncated).toBe(true);
    expect(t.frames).toHaveLength(33);
  });

  it("is not truncated for an ordinary program", () => {
    expect(run([{ kind: "move", steps: 4 }], START).truncated).toBe(false);
  });

  it("returns a single frame for an empty program", () => {
    expect(run([], START)).toEqual({ frames: [START], truncated: false });
  });

  it("is deterministic: the same program and start give the same frames", () => {
    const p: Program = [
      {
        kind: "repeat",
        times: 3,
        body: [
          { kind: "move", steps: 2 },
          { kind: "turn", quarters: 1 },
        ],
      },
    ];
    expect(run(p, START)).toEqual(run(p, START));
  });
});
