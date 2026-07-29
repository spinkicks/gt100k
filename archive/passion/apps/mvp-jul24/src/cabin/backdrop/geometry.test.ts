import { describe, expect, it } from "vitest";
import {
  type Polygon,
  type Quad,
  bounds,
  containsPoint,
  isClockwise,
  isStrictlyConvex,
  quadSourceSize,
  signedArea,
  toSvgPoints,
} from "./geometry";

/** Axis-aligned unit square wound TL -> TR -> BR -> BL (clockwise on a y-down screen). */
const UNIT: Quad = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
];

describe("signedArea / isClockwise", () => {
  it("is positive for the TL,TR,BR,BL winding this codebase uses", () => {
    expect(signedArea(UNIT)).toBe(100);
    expect(isClockwise(UNIT)).toBe(true);
  });

  it("is negative for the reversed winding", () => {
    const reversed = [...UNIT].reverse() as unknown as Quad;
    expect(signedArea(reversed)).toBe(-100);
    expect(isClockwise(reversed)).toBe(false);
  });

  it("is zero for collinear points, and those are not 'clockwise'", () => {
    const line: Polygon = [
      [0, 0],
      [5, 5],
      [10, 10],
      [2, 2],
    ];
    expect(signedArea(line)).toBe(0);
    expect(isClockwise(line)).toBe(false);
  });

  it("rejects a polygon whose area is under the minimum", () => {
    const sliver: Quad = [
      [0, 0],
      [10, 0],
      [10, 0.1],
      [0, 0.1],
    ];
    expect(isClockwise(sliver, 10)).toBe(false);
    expect(isClockwise(sliver, 0.5)).toBe(true);
  });
});

describe("isStrictlyConvex", () => {
  it("accepts a convex quad in either winding", () => {
    expect(isStrictlyConvex(UNIT)).toBe(true);
    expect(isStrictlyConvex([...UNIT].reverse() as unknown as Quad)).toBe(true);
  });

  it("accepts a foreshortened trapezoid (the shape every wall prop actually is)", () => {
    expect(
      isStrictlyConvex([
        [10, 20],
        [90, 30],
        [88, 70],
        [12, 80],
      ]),
    ).toBe(true);
  });

  it("rejects a bow-tie from two swapped corners", () => {
    // BR and BL exchanged — the single likeliest authoring slip, and it renders as a
    // self-intersecting hourglass rather than an error.
    expect(
      isStrictlyConvex([
        [0, 0],
        [10, 0],
        [0, 10],
        [10, 10],
      ]),
    ).toBe(false);
  });

  it("rejects a collinear triple", () => {
    expect(
      isStrictlyConvex([
        [0, 0],
        [5, 0],
        [10, 0],
        [0, 10],
      ]),
    ).toBe(false);
  });

  it("rejects a repeated corner", () => {
    expect(
      isStrictlyConvex([
        [0, 0],
        [0, 0],
        [10, 10],
        [0, 10],
      ]),
    ).toBe(false);
  });

  it("rejects a concave outline", () => {
    expect(
      isStrictlyConvex([
        [0, 0],
        [10, 0],
        [5, 5],
        [10, 10],
        [0, 10],
      ]),
    ).toBe(false);
  });

  it("rejects fewer than three points", () => {
    expect(
      isStrictlyConvex([
        [0, 0],
        [1, 1],
      ]),
    ).toBe(false);
  });
});

describe("containsPoint", () => {
  it("distinguishes the polygon interior from its bounding box", () => {
    // A right triangle: the bounding box's top-right corner region is outside the shape.
    const triangle: Polygon = [
      [0, 0],
      [0, 100],
      [100, 100],
    ];
    expect(containsPoint(triangle, [10, 90])).toBe(true);
    expect(containsPoint(triangle, [90, 10])).toBe(false);
  });

  it("excludes points outside the polygon entirely", () => {
    expect(containsPoint(UNIT, [5, 5])).toBe(true);
    expect(containsPoint(UNIT, [-1, 5])).toBe(false);
    expect(containsPoint(UNIT, [5, 11])).toBe(false);
  });
});

describe("bounds", () => {
  it("is the axis-aligned box of a skewed quad", () => {
    expect(
      bounds([
        [10, 20],
        [90, 30],
        [88, 70],
        [12, 80],
      ]),
    ).toEqual({ x: 10, y: 20, width: 80, height: 60 });
  });
});

describe("toSvgPoints", () => {
  it("serialises to the SVG points syntax", () => {
    expect(toSvgPoints(UNIT)).toBe("0,0 10,0 10,10 0,10");
  });
});

describe("quadSourceSize", () => {
  it("is the exact size for an axis-aligned quad", () => {
    expect(quadSourceSize(UNIT)).toEqual({ width: 10, height: 10 });
  });

  it("averages the two opposing edges of a foreshortened quad", () => {
    // Top edge 100 long, bottom edge 200 long -> mean width 150. Both slanted sides are
    // hypot(50, 100) ~ 111.8, so the mean height rounds to 112 — NOT the box height of 100, which
    // is the answer a bounding-box-based sizing would have given.
    const trapezoid: Quad = [
      [50, 0],
      [150, 0],
      [200, 100],
      [0, 100],
    ];
    expect(quadSourceSize(trapezoid)).toEqual({ width: 150, height: 112 });
  });

  it("never returns a zero dimension (a zero-sized source rect divides by zero downstream)", () => {
    const degenerate: Quad = [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    expect(quadSourceSize(degenerate)).toEqual({ width: 1, height: 1 });
  });
});
