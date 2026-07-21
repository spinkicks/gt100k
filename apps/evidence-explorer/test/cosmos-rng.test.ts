import { describe, expect, it } from "vitest";
import { roleHex } from "../components/cosmos/palette.js";
import {
  STARFIELD,
  generateStarfield,
  mulberry32,
  readSeed,
} from "../components/cosmos/starfield-rng.js";

/**
 * Pure-logic tests for the cosmos helpers (UE023) — the seeded starfield is deterministic and
 * bounded, and the palette bridge resolves the exact golden type hues. The R3F components themselves
 * need a WebGL context and are exercised by `next build` + the app walkthrough, not by Vitest.
 */
describe("starfield RNG (deterministic, seeded — no Math.random)", () => {
  it("mulberry32 is deterministic for a fixed seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("generateStarfield is byte-stable for a fixed seed and differs across seeds", () => {
    const a = generateStarfield(200, 220, 42);
    const b = generateStarfield(200, 220, 42);
    const c = generateStarfield(200, 220, 7);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(a).toHaveLength(200 * 3);
  });

  it("keeps every star inside the outer radius and outside the inner shell", () => {
    const radius = 220;
    const inner = radius * STARFIELD.innerFraction;
    const pts = generateStarfield(500, radius, 42);
    for (let i = 0; i < pts.length; i += 3) {
      const d = Math.hypot(pts[i]!, pts[i + 1]!, pts[i + 2]!);
      expect(d).toBeLessThanOrEqual(radius + 1e-3);
      expect(d).toBeGreaterThanOrEqual(inner - 1e-3);
    }
  });

  it("readSeed falls back to the default on missing/garbage input", () => {
    expect(readSeed(undefined)).toBe(42);
    expect(readSeed("not-a-number")).toBe(42);
    expect(readSeed("7")).toBe(7);
  });
});

describe("palette bridge", () => {
  it("resolves the exact golden type hues", () => {
    expect(roleHex("artifact")).toBe("#E9C46A");
    expect(roleHex("outcome")).toBe("#FF7A8A");
    expect(roleHex("assistance")).toBe("#3DDC97");
  });
});
