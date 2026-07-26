import { describe, expect, test } from "vitest";
import {
  DEFAULT_SEED,
  firelightFrame,
  hash01,
  sampleFlicker,
  shaftSheenOpacity,
  valueNoise,
} from "./signal";

describe("hash01 / valueNoise", () => {
  test("hash01 stays in [0,1) and is stable for the same (seed, index)", () => {
    for (let i = -50; i < 50; i++) {
      const v = hash01(7, i);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      expect(hash01(7, i)).toBe(v);
    }
  });

  test("hash01 decorrelates neighbouring indices", () => {
    // a bad hash (e.g. a plain multiply) gives near-identical values for i and i+1, which would
    // make the flicker walk a straight ramp instead of a wander
    const deltas = Array.from({ length: 64 }, (_, i) => Math.abs(hash01(3, i) - hash01(3, i + 1)));
    const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    expect(mean).toBeGreaterThan(0.2);
  });

  test("valueNoise is in [-1,1], continuous, and hits the hashed value exactly at integers", () => {
    for (let i = 0; i < 8; i++) {
      expect(valueNoise(i, 11)).toBeCloseTo(hash01(11, i) * 2 - 1, 12);
    }
    let prev = valueNoise(0, 11);
    for (let t = 0; t < 12; t += 0.01) {
      const v = valueNoise(t, 11);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
      // smoothstep interpolation between values at most 2 apart cannot jump 0.2 in 0.01 of a step
      expect(Math.abs(v - prev)).toBeLessThan(0.2);
      prev = v;
    }
  });

  test("different seeds give different noise", () => {
    const a = Array.from({ length: 32 }, (_, i) => valueNoise(i * 0.37, 1));
    const b = Array.from({ length: 32 }, (_, i) => valueNoise(i * 0.37, 2));
    expect(a).not.toEqual(b);
  });
});

describe("sampleFlicker", () => {
  test("is a pure function of (t, seed) — the same t always gives the same frame", () => {
    for (const t of [0, 0.0167, 1.5, 37.25, 600]) {
      expect(sampleFlicker(t)).toEqual(sampleFlicker(t));
      expect(sampleFlicker(t, 99)).toEqual(sampleFlicker(t, 99));
    }
  });

  test("uses no Math.random — the render path must be reproducible for screenshots", () => {
    const real = Math.random;
    Math.random = () => {
      throw new Error("Math.random must not be called from the flicker signal");
    };
    try {
      for (let t = 0; t < 5; t += 0.05) expect(() => sampleFlicker(t)).not.toThrow();
    } finally {
      Math.random = real;
    }
  });

  test("level and sconce stay inside 0..1 across ten minutes of clock", () => {
    for (let t = 0; t < 600; t += 0.013) {
      const s = sampleFlicker(t);
      expect(s.level).toBeGreaterThanOrEqual(0);
      expect(s.level).toBeLessThanOrEqual(1);
      expect(s.sconce).toBeGreaterThanOrEqual(0);
      expect(s.sconce).toBeLessThanOrEqual(1);
    }
  });

  test("level actually spans a firelight-sized range rather than sitting near a mean", () => {
    let min = 1;
    let max = 0;
    for (let t = 0; t < 120; t += 0.01) {
      const { level } = sampleFlicker(t);
      min = Math.min(min, level);
      max = Math.max(max, level);
    }
    // the mockup's signal ranged roughly 0.3–0.95; anything much tighter reads as a steady lamp
    expect(min).toBeLessThan(0.35);
    expect(max).toBeGreaterThan(0.9);
  });

  test("does not settle into a short loop: no two-second repeat", () => {
    // a fire that repeats audibly is worse than one that does not move, so assert the signal at t
    // and at t+2s (a plausible loop length for four sines) is meaningfully different
    let maxSame = 0;
    for (let t = 0; t < 60; t += 0.25) {
      maxSame = Math.max(
        maxSame,
        1 - Math.abs(sampleFlicker(t).level - sampleFlicker(t + 2).level),
      );
    }
    expect(maxSame).toBeLessThan(1);
    const diffs = Array.from({ length: 240 }, (_, i) => {
      const t = i * 0.25;
      return Math.abs(sampleFlicker(t).level - sampleFlicker(t + 2).level);
    });
    expect(Math.max(...diffs)).toBeGreaterThan(0.15);
  });

  test("the sconce runs on its own rhythm, not the hearth's", () => {
    // if the two shared a signal they would be perfectly correlated and the room would read as one
    // light in two places
    const samples = Array.from({ length: 400 }, (_, i) => sampleFlicker(i * 0.05));
    const level = samples.map((s) => s.level);
    const sconce = samples.map((s) => s.sconce);
    expect(correlation(level, sconce)).toBeLessThan(0.6);
    // and it never goes dark: a candle gutters, it does not switch off
    expect(Math.min(...sconce)).toBeGreaterThan(0.3);
  });

  test("jitter stays small and signed — the fire leans, it does not travel", () => {
    for (let t = 0; t < 120; t += 0.01) {
      expect(Math.abs(sampleFlicker(t).jitter)).toBeLessThan(0.7);
    }
    const some = Array.from({ length: 200 }, (_, i) => sampleFlicker(i * 0.07).jitter);
    expect(some.some((j) => j > 0)).toBe(true);
    expect(some.some((j) => j < 0)).toBe(true);
  });

  test("different seeds give different rooms at the same time", () => {
    expect(sampleFlicker(3.3, 1)).not.toEqual(sampleFlicker(3.3, 2));
  });
});

describe("firelightFrame", () => {
  test("every layer moves in the same direction as the one signal driving them", () => {
    const dim = firelightFrame(sampleFlicker(0, DEFAULT_SEED));
    // find a brighter and a dimmer moment and assert all four layers agree about which is which
    let lowT = 0;
    let highT = 0;
    let low = 1;
    let high = 0;
    for (let t = 0; t < 30; t += 0.01) {
      const { level } = sampleFlicker(t);
      if (level < low) {
        low = level;
        lowT = t;
      }
      if (level > high) {
        high = level;
        highT = t;
      }
    }
    const a = firelightFrame(sampleFlicker(lowT));
    const b = firelightFrame(sampleFlicker(highT));
    expect(Number(b.core.opacity)).toBeGreaterThan(Number(a.core.opacity));
    expect(Number(b.floor.opacity)).toBeGreaterThan(Number(a.floor.opacity));
    expect(Number(b.bounce.opacity)).toBeGreaterThan(Number(a.bounce.opacity));
    expect(dim.artFilter).toMatch(/^brightness\(/);
  });

  test("opacities stay inside 0..1 and transforms are well-formed CSS", () => {
    for (let t = 0; t < 60; t += 0.017) {
      const f = firelightFrame(sampleFlicker(t));
      for (const layer of [f.core, f.floor, f.bounce, f.sconce]) {
        const o = Number(layer.opacity);
        expect(Number.isFinite(o)).toBe(true);
        expect(o).toBeGreaterThanOrEqual(0);
        expect(o).toBeLessThanOrEqual(1);
        if (layer.transform !== undefined) expect(layer.transform).not.toMatch(/NaN/);
      }
      expect(f.artFilter).not.toMatch(/NaN/);
    }
  });

  test("the brightness breath on the art stays sub-2% so the image never visibly pumps", () => {
    let min = 2;
    let max = 0;
    for (let t = 0; t < 60; t += 0.01) {
      const m = /brightness\(([\d.]+)\)/.exec(firelightFrame(sampleFlicker(t)).artFilter);
      const v = Number(m?.[1]);
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    expect(min).toBeGreaterThan(0.98);
    expect(max).toBeLessThan(1.02);
  });

  test("the room bounce changes brightness only — a scaling room-sized gradient reads as a pulse", () => {
    expect(firelightFrame(sampleFlicker(1.1)).bounce.transform).toBeUndefined();
  });
});

test("shaftSheenOpacity is slow, bounded and deterministic", () => {
  expect(shaftSheenOpacity(4.2)).toBe(shaftSheenOpacity(4.2));
  let prev = Number(shaftSheenOpacity(0));
  for (let t = 0; t < 120; t += 0.05) {
    const v = Number(shaftSheenOpacity(t));
    // peaks at exactly 1 when both sines crest together — that is the authored gradient at full
    // strength, which is the intended maximum rather than an overflow
    expect(v).toBeGreaterThan(0.4);
    expect(v).toBeLessThanOrEqual(1);
    // 0.05s of a 0.42 rad/s sine cannot move far; this is what "slow" means numerically
    expect(Math.abs(v - prev)).toBeLessThan(0.02);
    prev = v;
  }
});

function correlation(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((x, y) => x + y, 0) / n;
  const mb = b.reduce((x, y) => x + y, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i]! - ma;
    const y = b[i]! - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return Math.abs(num / Math.sqrt(da * db || 1));
}
