import { describe, expect, it } from "vitest";
import type { Quad } from "./geometry";
import {
  IDENTITY,
  type Matrix3,
  applyMatrix3,
  quadTransform,
  rectToQuad,
  sourceCorners,
  toMatrix3d,
} from "./homography";

/** Sub-micron on a 1536px canvas — far tighter than anything that could be seen. */
const TIGHT = 1e-9;

function expectMapsCornersTo(width: number, height: number, quad: Quad): Matrix3 {
  const m = rectToQuad(width, height, quad);
  expect(m).not.toBeNull();
  const corners = sourceCorners(width, height);
  for (let i = 0; i < 4; i++) {
    const mapped = applyMatrix3(m as Matrix3, corners[i]!);
    expect(mapped).not.toBeNull();
    expect(mapped![0]).toBeCloseTo(quad[i]![0], 9);
    expect(mapped![1]).toBeCloseTo(quad[i]![1], 9);
  }
  return m as Matrix3;
}

describe("rectToQuad — the axis-aligned identity case", () => {
  it("returns the identity when the quad IS the source rectangle", () => {
    const quad: Quad = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ];
    expect(rectToQuad(100, 100, quad)).toEqual(IDENTITY);
  });

  it("round-trips a translated + scaled axis-aligned quad as a pure affine matrix", () => {
    // A prop painted dead-on: no foreshortening, so the projective row must come out exactly zero
    // rather than as float dust.
    const quad: Quad = [
      [200, 50],
      [500, 50],
      [500, 250],
      [200, 250],
    ];
    const m = expectMapsCornersTo(100, 100, quad);
    expect(m[6]).toBe(0);
    expect(m[7]).toBe(0);
    expect(m[8]).toBe(1);
    expect(m).toEqual([3, 0, 200, 0, 2, 50, 0, 0, 1]);
  });
});

describe("rectToQuad — corner-for-corner accuracy", () => {
  it("maps each source corner onto its destination corner, in order", () => {
    // Trapezoid: left edge taller than right, i.e. a wall panel receding to the right.
    expectMapsCornersTo(295, 234, [
      [56, 187],
      [351, 213],
      [347, 447],
      [53, 462],
    ]);
  });

  it("holds for a strongly foreshortened floor plane", () => {
    expectMapsCornersTo(313, 254, [
      [470, 758],
      [700, 750],
      [790, 1000],
      [350, 1010],
    ]);
  });

  it("holds for a quad rotated well off axis (a board seen as a diamond)", () => {
    expectMapsCornersTo(180, 160, [
      [105, 761],
      [237, 732],
      [419, 777],
      [290, 819],
    ]);
  });

  it("rotating the destination tuple rotates which corner each source corner reaches", () => {
    const quad: Quad = [
      [0, 0],
      [80, 10],
      [70, 60],
      [10, 50],
    ];
    const rotated: Quad = [quad[1], quad[2], quad[3], quad[0]];
    const m = rectToQuad(40, 40, rotated);
    expect(m).not.toBeNull();
    // The source rect's top-left now lands on what was the quad's top-RIGHT.
    expect(applyMatrix3(m as Matrix3, [0, 0])![0]).toBeCloseTo(80, 9);
    expect(applyMatrix3(m as Matrix3, [0, 0])![1]).toBeCloseTo(10, 9);
  });

  it("maps interior points inside the quad, not just the corners", () => {
    const quad: Quad = [
      [100, 100],
      [400, 140],
      [380, 380],
      [120, 400],
    ];
    const m = rectToQuad(200, 200, quad) as Matrix3;
    const centre = applyMatrix3(m, [100, 100]) as [number, number];
    // A projective centre is NOT the mean of the corners (that would be the affine answer), but it
    // must still land well inside the quad.
    expect(centre[0]).toBeGreaterThan(150);
    expect(centre[0]).toBeLessThan(350);
    expect(centre[1]).toBeGreaterThan(150);
    expect(centre[1]).toBeLessThan(350);
  });
});

describe("rectToQuad — a hand-computed non-trivial quad", () => {
  /**
   * Worked through Heckbert's square-to-quad formula by hand for the unit square mapped onto
   * (0,0) (2,0) (2,2) (0,1):
   *
   *   sx = 0-2+2-0 = 0,  sy = 0-0+2-1 = 1        (not a parallelogram -> projective branch)
   *   dx1 = 0, dx2 = -2, dy1 = -2, dy2 = -1,  den = 0*(-1) - (-2)(-2) = -4
   *   a13 = (0*(-1) - (-2)(1)) / -4 = -0.5       a23 = (0*1 - 0*(-2)) / -4 = 0
   *   a11 = 2 + (-0.5)(2) = 1                    a21 = 0
   *   a12 = 0                                    a22 = 1 + 0 = 1
   *
   * which, transposed into column-vector form, is exactly the matrix asserted below. Sanity check by
   * hand: (1,0) -> w = -0.5+1 = 0.5, x' = 1, so x = 2. Correct.
   */
  it("matches the coefficients derived on paper", () => {
    const m = rectToQuad(1, 1, [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 1],
    ]);
    expect(m).toEqual([1, 0, 0, 0, 1, 0, -0.5, 0, 1]);
  });

  it("folds the source-rectangle normalisation into the first two columns", () => {
    // Same quad scaled x10, driven from a 200x100 source rectangle: the linear columns pick up
    // 10/200 and 10/100, and the projective column picks up -0.5/200.
    const m = rectToQuad(200, 100, [
      [0, 0],
      [20, 0],
      [20, 20],
      [0, 10],
    ]);
    expect(m).toEqual([0.05, 0, 0, 0, 0.1, 0, -0.0025, 0, 1]);
    expectMapsCornersTo(200, 100, [
      [0, 0],
      [20, 0],
      [20, 20],
      [0, 10],
    ]);
  });
});

describe("rectToQuad — rejection instead of NaN", () => {
  const cases: Array<[string, Quad]> = [
    [
      "all four corners collinear",
      [
        [0, 0],
        [10, 10],
        [20, 20],
        [30, 30],
      ],
    ],
    [
      "three consecutive corners collinear",
      [
        [0, 0],
        [50, 0],
        [100, 0],
        [0, 100],
      ],
    ],
    [
      "two coincident corners",
      [
        [0, 0],
        [0, 0],
        [100, 100],
        [0, 100],
      ],
    ],
    [
      "every corner identical",
      [
        [7, 7],
        [7, 7],
        [7, 7],
        [7, 7],
      ],
    ],
    [
      "bow-tie (bottom corners swapped)",
      [
        [0, 0],
        [100, 0],
        [0, 100],
        [100, 100],
      ],
    ],
    [
      "non-finite coordinate",
      [
        [0, 0],
        [Number.NaN, 0],
        [100, 100],
        [0, 100],
      ],
    ],
  ];

  for (const [label, quad] of cases) {
    it(`rejects ${label}`, () => {
      expect(rectToQuad(100, 100, quad)).toBeNull();
      expect(quadTransform(100, 100, quad)).toBeNull();
    });
  }

  it("rejects a non-positive or non-finite source rectangle", () => {
    const quad: Quad = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ];
    expect(rectToQuad(0, 100, quad)).toBeNull();
    expect(rectToQuad(100, 0, quad)).toBeNull();
    expect(rectToQuad(-100, 100, quad)).toBeNull();
    expect(rectToQuad(Number.NaN, 100, quad)).toBeNull();
    expect(rectToQuad(Number.POSITIVE_INFINITY, 100, quad)).toBeNull();
  });

  it("never returns a matrix containing NaN or Infinity for any near-degenerate quad", () => {
    // Sweep a quad's bottom-right corner through the degenerate configuration and out the far side.
    for (let d = -4; d <= 4; d += 0.25) {
      const quad: Quad = [
        [0, 0],
        [100, 0],
        [100 + d, 100 * (d === 0 ? 0 : 1)],
        [0, 100],
      ];
      const m = rectToQuad(100, 100, quad);
      if (m !== null) expect(m.every((v) => Number.isFinite(v))).toBe(true);
    }
  });
});

describe("toMatrix3d", () => {
  it("is the CSS identity for the identity homography", () => {
    expect(toMatrix3d(IDENTITY)).toBe("matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)");
  });

  it("transposes row-major storage into CSS's column-major argument order", () => {
    // Every entry distinct so a transposition slip cannot hide.
    const m: Matrix3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    //   ⎡1 2 0 3⎤        col1 = 1,4,0,7   col2 = 2,5,0,8
    //   ⎢4 5 0 6⎥        col3 = 0,0,1,0   col4 = 3,6,0,9
    //   ⎢0 0 1 0⎥
    //   ⎣7 8 0 9⎦
    expect(toMatrix3d(m)).toBe("matrix3d(1, 4, 0, 7, 2, 5, 0, 8, 0, 0, 1, 0, 3, 6, 0, 9)");
  });

  it("emits the hand-computed quad's transform", () => {
    const m = rectToQuad(1, 1, [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 1],
    ]) as Matrix3;
    expect(toMatrix3d(m)).toBe("matrix3d(1, 0, 0, -0.5, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)");
  });

  it("trims float dust rather than emitting exponent noise", () => {
    const m = rectToQuad(295, 234, [
      [56, 187],
      [351, 213],
      [347, 447],
      [53, 462],
    ]) as Matrix3;
    const css = toMatrix3d(m);
    expect(css).not.toMatch(/e-1[0-9]/);
    expect(css.startsWith("matrix3d(")).toBe(true);
    expect(css.slice("matrix3d(".length, -1).split(", ")).toHaveLength(16);
  });
});

describe("applyMatrix3", () => {
  it("returns null at the horizon instead of dividing by ~zero", () => {
    const m: Matrix3 = [1, 0, 0, 0, 1, 0, 1, 0, 0];
    expect(applyMatrix3(m, [0, 5])).toBeNull();
    expect(applyMatrix3(m, [2, 5])).not.toBeNull();
  });

  it("is exact for the identity", () => {
    const p = applyMatrix3(IDENTITY, [123.5, -7.25]);
    expect(p![0]).toBeCloseTo(123.5, 12);
    expect(p![1]).toBeCloseTo(-7.25, 12);
  });

  it("agrees with itself to within the tight tolerance over a round trip through CSS text", () => {
    // Guards the serialiser's precision trimming: re-parsing the emitted string must reproduce the
    // same mapping, otherwise devtools-readable output would be costing us accuracy.
    const quad: Quad = [
      [821, 243],
      [947, 253],
      [946, 453],
      [825, 463],
    ];
    const m = rectToQuad(126, 210, quad) as Matrix3;
    const nums = toMatrix3d(m).slice("matrix3d(".length, -1).split(", ").map(Number);
    const reparsed: Matrix3 = [
      nums[0]!,
      nums[4]!,
      nums[12]!,
      nums[1]!,
      nums[5]!,
      nums[13]!,
      nums[3]!,
      nums[7]!,
      nums[15]!,
    ];
    for (const corner of sourceCorners(126, 210)) {
      const a = applyMatrix3(m, corner)!;
      const b = applyMatrix3(reparsed, corner)!;
      expect(Math.abs(a[0] - b[0])).toBeLessThan(TIGHT);
      expect(Math.abs(a[1] - b[1])).toBeLessThan(TIGHT);
    }
  });
});
