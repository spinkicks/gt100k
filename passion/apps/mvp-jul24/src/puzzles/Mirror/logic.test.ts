import {
  type CellContent,
  LEVELS,
  cloneMirrors,
  isSolved,
  pickLevel,
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

describe("authored levels", () => {
  test("pickLevel wraps around by modulo", () => {
    expect(pickLevel(0)).toBe(LEVELS[0]);
    expect(pickLevel(1)).toBe(LEVELS[1]);
    expect(pickLevel(LEVELS.length)).toBe(LEVELS[0]);
    expect(pickLevel(LEVELS.length + 1)).toBe(LEVELS[1]);
  });

  test.each(LEVELS.map((level, i) => [i, level] as const))(
    "level %i: starts unsolved and is solvable by rotating only mirror cells",
    (_i, level) => {
      expect(isSolved(level, level.mirrors)).toBe(false);

      let mirrors = cloneMirrors(level.mirrors);
      for (let r = 0; r < level.size; r++) {
        for (let c = 0; c < level.size; c++) {
          if (level.mirrors[r]![c]) mirrors = rotateMirror(mirrors, r, c);
        }
      }
      expect(isSolved(level, mirrors)).toBe(true);
    },
  );

  test("emitter and target cells never carry a mirror", () => {
    for (const level of LEVELS) {
      expect(level.mirrors[level.emitter.row]![level.emitter.col]).toBeNull();
      expect(level.mirrors[level.target.row]![level.target.col]).toBeNull();
    }
  });
});
