import {
  type LaserLevel,
  ONE,
  addF,
  branchDirection,
  cellKey,
  cycleDial,
  eqF,
  findSolutions,
  frac,
  fracText,
  initialDials,
  isSolved,
  mulF,
  requiredTotal,
  subF,
  traceBeams,
} from "./logic";

describe("exact fraction arithmetic", () => {
  test("normalizes on construction", () => {
    expect(frac(2, 4)).toEqual({ n: 1, d: 2 });
    expect(frac(6, 3)).toEqual({ n: 2, d: 1 });
    expect(frac(0, 7)).toEqual({ n: 0, d: 1 });
    expect(frac(1, -2)).toEqual({ n: -1, d: 2 });
  });

  test("rejects a zero denominator", () => {
    expect(() => frac(1, 0)).toThrow();
  });

  test("sixths add up to exactly one, where floating point does not", () => {
    // A sixth is the canonical Fraction Laser quantity — it is what a half of
    // a third delivers — and six of them is exactly where doubles fail. This
    // is the whole reason the module refuses to use them.
    const sixth = frac(1, 6);
    let exact = { n: 0, d: 1 };
    let approx = 0;
    for (let i = 0; i < 6; i++) {
      exact = addF(exact, sixth);
      approx += 1 / 6;
    }
    expect(eqF(exact, ONE)).toBe(true);
    expect(approx).not.toBe(1);
  });

  test("multiplies and subtracts exactly", () => {
    expect(mulF(frac(2, 3), frac(3, 4))).toEqual(frac(1, 2));
    expect(subF(ONE, frac(3, 8))).toEqual(frac(5, 8));
    // A split's two parts always reconstruct the whole they came from.
    const incoming = frac(3, 7);
    const straight = mulF(incoming, frac(2, 5));
    expect(eqF(addF(straight, subF(incoming, straight)), incoming)).toBe(true);
  });

  test("renders as a plain fraction, with whole numbers unstacked", () => {
    expect(fracText(frac(1, 6))).toBe("1/6");
    expect(fracText(ONE)).toBe("1");
    expect(fracText(frac(0, 5))).toBe("0");
  });
});

describe("branchDirection", () => {
  test("turns a beam a quarter turn either way, never back on itself", () => {
    expect(branchDirection("S", "left")).toBe("E");
    expect(branchDirection("S", "right")).toBe("W");
    expect(branchDirection("E", "left")).toBe("N");
    expect(branchDirection("E", "right")).toBe("S");
    expect(branchDirection("N", "left")).toBe("W");
    expect(branchDirection("W", "right")).toBe("N");
  });
});

/**
 * A hand-built board used across the tracing tests, small enough to reason
 * about by eye:
 *
 *   the beam enters at (0,1) heading S, meets one prism at (2,1) whose left
 *   port faces E, so `f` of the beam carries on S to the crystal at (4,1)
 *   and `1 - f` turns E to the crystal at (2,4).
 */
function twoWayLevel(options = [frac(1, 3), frac(2, 3)], start = 1): LaserLevel {
  return {
    size: 5,
    emitter: { row: 0, col: 1, dir: "S" },
    splitters: [{ row: 2, col: 1, side: "left", options, start }],
    collectors: [
      { row: 4, col: 1, required: frac(1, 3) },
      { row: 2, col: 4, required: frac(2, 3) },
    ],
  };
}

describe("traceBeams", () => {
  test("delivers each part of the split to its crystal, exactly", () => {
    const level = twoWayLevel();
    const { delivered, flows } = traceBeams(level, [0]); // dial on 1/3
    expect(delivered.get("4,1")).toEqual(frac(1, 3));
    expect(delivered.get("2,4")).toEqual(frac(2, 3));
    expect(flows.get("2,1")).toEqual({
      incoming: ONE,
      straight: frac(1, 3),
      branch: frac(2, 3),
      incomingDir: "S",
      branchDir: "E",
    });
  });

  test("the two parts leaving a prism always add back to what arrived", () => {
    const level = twoWayLevel();
    for (const dial of [0, 1]) {
      const flow = traceBeams(level, [dial]).flows.get("2,1")!;
      expect(eqF(addF(flow.straight, flow.branch), flow.incoming)).toBe(true);
    }
  });

  test("the light's geometry does not depend on the dials — only the amounts do", () => {
    // This is the swap-test property in code form. Turning the dial cannot
    // move a beam, so nothing about this puzzle is spatial: strip the
    // fractions and every dial position is the same board.
    const level = twoWayLevel();
    const shape = (dial: number) =>
      traceBeams(level, [dial])
        .segments.map((s) => `${cellKey(s.from)}->${cellKey(s.to)}`)
        .sort();
    expect(shape(0)).toEqual(shape(1));
    expect(traceBeams(level, [0]).delivered.get("4,1")).not.toEqual(
      traceBeams(level, [1]).delivered.get("4,1"),
    );
  });

  test("a beam with nothing in its way runs to the edge of the grid", () => {
    const level: LaserLevel = {
      size: 4,
      emitter: { row: 1, col: 0, dir: "E" },
      splitters: [],
      collectors: [{ row: 3, col: 3, required: ONE }],
    };
    const { segments, delivered } = traceBeams(level, []);
    expect(delivered.size).toBe(0);
    expect(segments).toHaveLength(1);
    expect(segments[0]!.to).toEqual({ row: 1, col: 3 });
  });

  test("terminates on a degenerate level whose prisms feed each other in a ring", () => {
    const half = [frac(1, 2)];
    const level: LaserLevel = {
      size: 2,
      emitter: { row: 0, col: 0, dir: "E" },
      splitters: [
        { row: 0, col: 1, side: "right", options: half, start: 0 },
        { row: 1, col: 1, side: "right", options: half, start: 0 },
        { row: 1, col: 0, side: "right", options: half, start: 0 },
        { row: 0, col: 0, side: "right", options: half, start: 0 },
      ],
      collectors: [],
    };
    const { segments } = traceBeams(level, [0, 0, 0, 0]);
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.length).toBeLessThan(50);
  });
});

describe("isSolved", () => {
  test("true only when every crystal has its exact share", () => {
    const level = twoWayLevel();
    expect(isSolved(level, [0])).toBe(true); // dial on 1/3
    expect(isSolved(level, [1])).toBe(false); // dial on 2/3 — right total, wrong ports
  });

  test("false when a crystal is receiving nothing at all", () => {
    const level: LaserLevel = {
      ...twoWayLevel(),
      collectors: [
        { row: 4, col: 1, required: frac(1, 3) },
        { row: 2, col: 4, required: frac(2, 3) },
        { row: 0, col: 4, required: frac(0, 1) },
      ],
    };
    expect(isSolved(level, [0])).toBe(false);
  });

  test("a near-miss is a miss: 1/3 is not 33/100", () => {
    const level: LaserLevel = {
      ...twoWayLevel(),
      collectors: [
        { row: 4, col: 1, required: frac(33, 100) },
        { row: 2, col: 4, required: frac(67, 100) },
      ],
    };
    expect(isSolved(level, [0])).toBe(false);
  });
});

describe("requiredTotal", () => {
  test("a well-formed level's crystals ask for exactly one whole beam", () => {
    expect(requiredTotal(twoWayLevel())).toEqual(ONE);
  });
});

describe("cycleDial", () => {
  test("advances one dial and wraps, leaving the others alone", () => {
    const level: LaserLevel = {
      ...twoWayLevel([frac(1, 2), frac(1, 3), frac(2, 3)], 0),
      splitters: [
        { row: 2, col: 1, side: "left", options: [frac(1, 2), frac(1, 3), frac(2, 3)], start: 0 },
        { row: 3, col: 1, side: "left", options: [frac(1, 2), frac(1, 3)], start: 0 },
      ],
    };
    expect(cycleDial(level, [0, 0], 0)).toEqual([1, 0]);
    expect(cycleDial(level, [2, 0], 0)).toEqual([0, 0]);
    expect(cycleDial(level, [0, 0], 0, -1)).toEqual([2, 0]);
    expect(cycleDial(level, [1, 1], 1)).toEqual([1, 0]);
  });

  test("does not mutate the input, and ignores an out-of-range index", () => {
    const level = twoWayLevel();
    const dials = [0];
    expect(cycleDial(level, dials, 5)).toBe(dials);
    expect(dials).toEqual([0]);
  });
});

describe("findSolutions", () => {
  test("finds the single dial setting that solves a two-way split", () => {
    expect(findSolutions(twoWayLevel())).toEqual([[0]]);
  });

  test("reports both when a level is genuinely ambiguous", () => {
    // Two dial positions carrying the same value: the same board twice.
    const level = twoWayLevel([frac(1, 3), frac(2, 6)], 1);
    expect(findSolutions(level, 2)).toHaveLength(2);
  });

  test("refuses to enumerate an absurdly large dial space", () => {
    const options = Array.from({ length: 12 }, (_, i) => frac(i + 1, 20));
    const level: LaserLevel = {
      ...twoWayLevel(),
      splitters: Array.from({ length: 6 }, (_, i) => ({
        row: i,
        col: 0,
        side: "left" as const,
        options,
        start: 0,
      })),
    };
    expect(() => findSolutions(level)).toThrow(/too large/);
  });
});

describe("initialDials", () => {
  test("reads each splitter's opening position", () => {
    expect(initialDials(twoWayLevel([frac(1, 3), frac(2, 3)], 1))).toEqual([1]);
  });
});
