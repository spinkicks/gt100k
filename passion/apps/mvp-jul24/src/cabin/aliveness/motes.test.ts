import { describe, expect, test, vi } from "vitest";
import { DEFAULT_MOTE_COUNT, buildMoteField, get2dContext, moteAlpha, motePosition } from "./motes";
import { type ShaftRegion, quadPoint } from "./regions";

const SHAFT: ShaftRegion = {
  topLeft: { x: 600, y: 300 },
  topRight: { x: 800, y: 300 },
  bottomRight: { x: 700, y: 900 },
  bottomLeft: { x: 400, y: 900 },
};

describe("buildMoteField", () => {
  test("is deterministic in (count, seed)", () => {
    expect(buildMoteField(24, 5)).toEqual(buildMoteField(24, 5));
    expect(buildMoteField(24, 5)).not.toEqual(buildMoteField(24, 6));
  });

  test("uses no Math.random, so a screenshot of the shaft is reproducible", () => {
    const real = Math.random;
    Math.random = () => {
      throw new Error("Math.random must not be called when building the mote field");
    };
    try {
      expect(() => buildMoteField(DEFAULT_MOTE_COUNT, 1)).not.toThrow();
    } finally {
      Math.random = real;
    }
  });

  test("growing the count leaves the existing motes untouched", () => {
    // each mote reads a fixed slice of hash indices, so adding motes cannot reshuffle the field —
    // which means the perf-fallback "fewer motes" path is the same shaft, just sparser
    const few = buildMoteField(10, 3);
    const many = buildMoteField(40, 3);
    expect(many.slice(0, 10)).toEqual(few);
  });

  test("every mote's parameters land in a sane range", () => {
    for (const m of buildMoteField(DEFAULT_MOTE_COUNT, 42)) {
      expect(m.u0).toBeGreaterThanOrEqual(0);
      expect(m.u0).toBeLessThan(1);
      expect(m.v0).toBeGreaterThanOrEqual(0);
      expect(m.v0).toBeLessThan(1);
      expect(m.r).toBeGreaterThan(0);
      expect(m.fall).toBeGreaterThan(0); // motes fall, never rise
      expect(m.twinkle).toBeGreaterThan(0);
    }
  });

  test("the default count stays modest — this layer's whole justification is being cheap", () => {
    expect(DEFAULT_MOTE_COUNT).toBeLessThanOrEqual(96);
  });
});

describe("motePosition", () => {
  test("is a pure function of t, at any step size (no per-frame integration)", () => {
    const [m] = buildMoteField(1, 9);
    expect(motePosition(m!, 12.5)).toEqual(motePosition(m!, 12.5));
    // frame-rate independence: reaching t=1 in one hop and in sixty hops must agree, which a
    // `v += speed * dt` accumulator only manages approximately
    expect(motePosition(m!, 1).v).toBeCloseTo(motePosition(m!, 60 / 60).v, 12);
  });

  test("wraps into 0..1 forever, so a mote respawns without any randomness", () => {
    const motes = buildMoteField(30, 4);
    for (const m of motes) {
      for (const t of [0, 5, 90, 1000, 100000]) {
        const { u, v } = motePosition(m, t);
        expect(u).toBeGreaterThanOrEqual(0);
        expect(u).toBeLessThan(1);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    }
  });

  test("motes drift downward over a few seconds", () => {
    const [m] = buildMoteField(1, 77);
    // pick a window short enough that v cannot have wrapped (fall <= 0.03/s)
    expect(motePosition(m!, 5).v).toBeGreaterThan(motePosition(m!, 0).v);
  });

  test("a mote never leaves the painted shaft, at any time", () => {
    for (const m of buildMoteField(40, 8)) {
      for (let t = 0; t < 400; t += 7.3) {
        const { u, v } = motePosition(m, t);
        const p = quadPoint(SHAFT, u, v);
        expect(p.y).toBeGreaterThanOrEqual(300);
        expect(p.y).toBeLessThanOrEqual(900);
        expect(p.x).toBeGreaterThanOrEqual(400);
        expect(p.x).toBeLessThanOrEqual(800);
      }
    }
  });
});

describe("moteAlpha", () => {
  test("fades to nothing at the quad's edges so the shaft has no hard border", () => {
    const [m] = buildMoteField(1, 2);
    expect(moteAlpha(m!, 0, 0.5, 1)).toBeCloseTo(0, 6);
    expect(moteAlpha(m!, 1, 0.5, 1)).toBeCloseTo(0, 6);
    expect(moteAlpha(m!, 0.5, 0, 1)).toBeCloseTo(0, 6);
    expect(moteAlpha(m!, 0.5, 1, 1)).toBeCloseTo(0, 6);
    expect(moteAlpha(m!, 0.5, 0.5, 1)).toBeGreaterThan(0.1);
  });

  test("stays within 0..0.5 — motes brighten the shaft, they do not paint over it", () => {
    for (const m of buildMoteField(20, 6)) {
      for (let t = 0; t < 30; t += 0.31) {
        const { u, v } = motePosition(m, t);
        const a = moteAlpha(m, u, v, t);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(0.5);
      }
    }
  });
});

describe("get2dContext", () => {
  test("degrades to null instead of throwing when the platform has no 2d context", () => {
    // jsdom has no canvas backend and raises "not implemented" out of getContext; a browser can also
    // refuse a context under memory pressure. Either way the mote layer must draw nothing rather
    // than take the whole cabin down with it.
    const canvas = document.createElement("canvas");
    const spy = vi.spyOn(canvas, "getContext").mockImplementation(() => {
      throw new Error("Not implemented: HTMLCanvasElement.prototype.getContext");
    });
    expect(() => get2dContext(canvas)).not.toThrow();
    expect(get2dContext(canvas)).toBeNull();
    spy.mockRestore();
  });

  test("returns null for a null canvas without touching it", () => {
    expect(get2dContext(null)).toBeNull();
  });
});
