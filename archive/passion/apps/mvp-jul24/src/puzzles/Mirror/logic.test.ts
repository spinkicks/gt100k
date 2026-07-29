import {
  type CellContent,
  cloneMirrors,
  orientationForTurn,
  rotateMirror,
  traceBeam,
} from "./logic";

describe("traceBeam", () => {
  test("straight beam with no mirrors runs off the grid", () => {
    const mirrors: CellContent[][] = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
    const result = traceBeam(3, mirrors, { row: 1, col: 0, dir: "E" }, { row: 2, col: 2 });
    expect(result.reachesTarget).toBe(false);
    expect(result.path).toEqual([
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ]);
  });

  test("a single '\\' mirror bends the beam onto the target", () => {
    const mirrors: CellContent[][] = [
      [null, null, "\\"],
      [null, null, null],
      [null, null, null],
    ];
    const result = traceBeam(3, mirrors, { row: 0, col: 0, dir: "E" }, { row: 2, col: 2 });
    expect(result.reachesTarget).toBe(true);
    expect(result.path).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
    ]);
  });

  test("the same mirror as '/' sends the beam the wrong way (misses)", () => {
    const mirrors: CellContent[][] = [
      [null, null, "/"],
      [null, null, null],
      [null, null, null],
    ];
    const result = traceBeam(3, mirrors, { row: 0, col: 0, dir: "E" }, { row: 2, col: 2 });
    expect(result.reachesTarget).toBe(false);
    // E hits "/" -> reflects N -> immediately runs off the top edge.
    expect(result.path).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);
  });

  test("a two-mirror zig-zag reaches a target off the emitter's row/col", () => {
    const mirrors: CellContent[][] = [
      [null, null, "\\", null],
      [null, null, null, null],
      [null, null, "\\", null],
      [null, null, null, null],
    ];
    const result = traceBeam(4, mirrors, { row: 0, col: 0, dir: "E" }, { row: 2, col: 3 });
    expect(result.reachesTarget).toBe(true);
  });

  test("terminates instead of looping forever on a degenerate mirror ring", () => {
    // Four mirrors forming a closed loop the beam can never escape.
    const mirrors: CellContent[][] = [
      ["\\", "/"],
      ["/", "\\"],
    ];
    const result = traceBeam(2, mirrors, { row: 0, col: 0, dir: "E" }, { row: 5, col: 5 });
    expect(result.reachesTarget).toBe(false);
    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path.length).toBeLessThan(50);
  });
});

describe("rotateMirror", () => {
  test("toggles '/' <-> '\\' at the given cell", () => {
    const mirrors: CellContent[][] = [
      [null, "/"],
      [null, null],
    ];
    const once = rotateMirror(mirrors, 0, 1);
    expect(once[0]![1]).toBe("\\");
    const twice = rotateMirror(once, 0, 1);
    expect(twice[0]![1]).toBe("/");
  });

  test("is a no-op on empty floor cells", () => {
    const mirrors: CellContent[][] = [
      [null, "/"],
      [null, null],
    ];
    const result = rotateMirror(mirrors, 0, 0);
    expect(result).toBe(mirrors);
  });

  test("does not mutate the input grid", () => {
    const mirrors: CellContent[][] = [
      [null, "/"],
      [null, null],
    ];
    const original = cloneMirrors(mirrors);
    rotateMirror(mirrors, 0, 1);
    expect(mirrors).toEqual(original);
  });
});

describe("orientationForTurn", () => {
  test("is the exact inverse of the reflection table for every perpendicular pair", () => {
    expect(orientationForTurn("E", "N")).toBe("/");
    expect(orientationForTurn("N", "E")).toBe("/");
    expect(orientationForTurn("S", "W")).toBe("/");
    expect(orientationForTurn("W", "S")).toBe("/");
    expect(orientationForTurn("E", "S")).toBe("\\");
    expect(orientationForTurn("S", "E")).toBe("\\");
    expect(orientationForTurn("N", "W")).toBe("\\");
    expect(orientationForTurn("W", "N")).toBe("\\");
  });

  test("throws for a same-direction or opposite-direction 'turn' (no single mirror does that)", () => {
    expect(() => orientationForTurn("E", "E")).toThrow();
    expect(() => orientationForTurn("E", "W")).toThrow();
  });
});
