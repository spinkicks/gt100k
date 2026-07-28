import { describe, expect, it } from "vitest";
import { MAX_OPS, type Program, flatten } from "./program";

describe("flatten", () => {
  it("turns `move n` into n one-cell steps, because one op is one tick", () => {
    const p: Program = [{ kind: "move", steps: 3 }];
    expect(flatten(p, MAX_OPS)).toEqual({
      ops: [{ kind: "step" }, { kind: "step" }, { kind: "step" }],
      truncated: false,
    });
  });

  it("turns `wait n` into n idles, so timing occupies real ticks", () => {
    expect(flatten([{ kind: "wait", ticks: 2 }], MAX_OPS).ops).toEqual([
      { kind: "idle" },
      { kind: "idle" },
    ]);
  });

  it("keeps a turn as a single op", () => {
    expect(flatten([{ kind: "turn", quarters: 1 }], MAX_OPS).ops).toEqual([
      { kind: "turn", quarters: 1 },
    ]);
  });

  it("unrolls repeat", () => {
    const p: Program = [
      {
        kind: "repeat",
        times: 2,
        body: [
          { kind: "move", steps: 1 },
          { kind: "turn", quarters: 1 },
        ],
      },
    ];
    expect(flatten(p, MAX_OPS).ops).toEqual([
      { kind: "step" },
      { kind: "turn", quarters: 1 },
      { kind: "step" },
      { kind: "turn", quarters: 1 },
    ]);
  });

  it("reports truncation instead of growing without bound", () => {
    const p: Program = [{ kind: "repeat", times: 1000, body: [{ kind: "move", steps: 1 }] }];
    const r = flatten(p, 10);
    expect(r.ops).toHaveLength(10);
    expect(r.truncated).toBe(true);
  });

  it("treats a zero or negative count as producing nothing, never as an error", () => {
    expect(flatten([{ kind: "move", steps: 0 }], MAX_OPS).ops).toEqual([]);
    expect(
      flatten([{ kind: "repeat", times: -1, body: [{ kind: "move", steps: 1 }] }], MAX_OPS).ops,
    ).toEqual([]);
  });
});
