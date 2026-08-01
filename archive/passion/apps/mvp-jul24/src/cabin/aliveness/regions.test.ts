import { describe, expect, test } from "vitest";
import {
  type ArtSize,
  type ShaftRegion,
  ellipseBoxPct,
  quadBoundsPct,
  quadClipPath,
  quadPoint,
  shaftFromQuad,
} from "./regions";

const ART: ArtSize = { width: 1024, height: 1024 };
// a trapezoid, i.e. the shape a window shaft actually is once perspective is involved
const SHAFT: ShaftRegion = {
  topLeft: { x: 600, y: 300 },
  topRight: { x: 800, y: 300 },
  bottomRight: { x: 700, y: 900 },
  bottomLeft: { x: 400, y: 900 },
};

describe("ellipseBoxPct", () => {
  test("treats x,y as the centre of the emitter, not its corner", () => {
    expect(ellipseBoxPct({ x: 512, y: 512, w: 256, h: 128 }, ART)).toEqual({
      left: 37.5, // (512 - 128) / 1024
      top: 43.75, // (512 - 64) / 1024
      width: 25,
      height: 12.5,
    });
  });

  test("an emitter larger than the frame yields out-of-range percentages rather than clamping", () => {
    // the whole-room bounce is authored much larger than the art on purpose; clamping it here would
    // silently shrink the falloff and turn the bounce into a hard-edged disc
    const box = ellipseBoxPct({ x: 512, y: 512, w: 2048, h: 2048 }, ART);
    expect(box.left).toBe(-50);
    expect(box.width).toBe(200);
  });

  test("scales with the art's own dimensions, so the same region on bigger art is the same place", () => {
    const small = ellipseBoxPct({ x: 256, y: 512, w: 128, h: 128 }, { width: 1024, height: 1024 });
    const big = ellipseBoxPct({ x: 512, y: 1024, w: 256, h: 256 }, { width: 2048, height: 2048 });
    expect(small).toEqual(big);
  });
});

describe("quadBoundsPct / quadClipPath", () => {
  test("bounds are the axis-aligned box of all four corners", () => {
    expect(quadBoundsPct(SHAFT, ART)).toEqual({
      left: (400 / 1024) * 100,
      top: (300 / 1024) * 100,
      width: (400 / 1024) * 100,
      height: (600 / 1024) * 100,
    });
  });

  test("clip path is expressed relative to the sheen's own box, which is what clip-path resolves against", () => {
    // topLeft sits 200/400 across the bounds and at its very top
    expect(quadClipPath(SHAFT, ART)).toBe(
      "polygon(50.00% 0.00%, 100.00% 0.00%, 75.00% 100.00%, 0.00% 100.00%)",
    );
  });

  test("a degenerate quad collapses instead of emitting NaN%", () => {
    const flat: ShaftRegion = {
      topLeft: { x: 10, y: 10 },
      topRight: { x: 10, y: 10 },
      bottomRight: { x: 10, y: 10 },
      bottomLeft: { x: 10, y: 10 },
    };
    expect(quadClipPath(flat, ART)).not.toMatch(/NaN/);
  });
});

describe("shaftFromQuad", () => {
  test("reads point tuples in the TL/TR/BR/BL order the rest of the app winds quads in", () => {
    const shaft = shaftFromQuad([
      [600, 300],
      [800, 300],
      [700, 900],
      [400, 900],
    ]);
    expect(shaft).toEqual(SHAFT);
    expect(shaft.tint).toBeUndefined();
  });

  test("carries a tint through when one is given", () => {
    const warm: readonly [number, number, number] = [255, 226, 176];
    expect(
      shaftFromQuad(
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        warm,
      ).tint,
    ).toBe(warm);
  });
});

describe("quadPoint", () => {
  test("the four (u,v) corners map to the four named corners", () => {
    expect(quadPoint(SHAFT, 0, 0)).toEqual(SHAFT.topLeft);
    expect(quadPoint(SHAFT, 1, 0)).toEqual(SHAFT.topRight);
    expect(quadPoint(SHAFT, 1, 1)).toEqual(SHAFT.bottomRight);
    expect(quadPoint(SHAFT, 0, 1)).toEqual(SHAFT.bottomLeft);
  });

  test("v runs top to bottom, so a falling mote is just v increasing", () => {
    const a = quadPoint(SHAFT, 0.5, 0.1);
    const b = quadPoint(SHAFT, 0.5, 0.9);
    expect(b.y).toBeGreaterThan(a.y);
  });

  test("every interior (u,v) lands inside the painted trapezoid", () => {
    // the reason the shaft is a quad and not a rect: motes cannot spill onto the wall beside it
    for (let u = 0; u <= 1.0001; u += 0.05) {
      for (let v = 0; v <= 1.0001; v += 0.05) {
        const p = quadPoint(SHAFT, u, v);
        expect(pointInQuad(p, SHAFT)).toBe(true);
      }
    }
  });
});

/** Convex-quad containment by consistent cross-product sign, with a hair of tolerance for edges. */
function pointInQuad(p: { x: number; y: number }, q: ShaftRegion): boolean {
  const pts = [q.topLeft, q.topRight, q.bottomRight, q.bottomLeft];
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % 4]!;
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (Math.abs(cross) < 1e-6) continue;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}
