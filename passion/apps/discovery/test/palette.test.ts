import { describe, expect, it } from "vitest";
import { FILLS, STROKE, STROKE_WIDTH, ALLOWED_FILLS, HIGHLIGHT } from "../app/palette.generated";

// Helper: hex to sRGB [0,1]
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

// Helper: sRGB [0,1] to linear sRGB
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// Helper: linear sRGB to OKLab (standard Björn Ottosson matrices)
function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  // linear sRGB -> LMS
  const l_ = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m_ = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s_ = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  // LMS -> LMS' (cube root)
  const [L, M, S] = [l_ ** (1 / 3), m_ ** (1 / 3), s_ ** (1 / 3)];

  // LMS' -> OKLab
  const L_oklab = 0.2104542553 * L + 0.7936177850 * M - 0.0040720468 * S;
  const a = 1.9779984951 * L - 2.4285922050 * M + 0.4505937099 * S;
  const b_oklab = 0.0259040371 * L + 0.7827717662 * M - 0.8086757660 * S;
  return [L_oklab, a, b_oklab];
}

// Helper: OKLab to OKLCH
function oklabToOklch(L: number, a: number, b: number): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  const h = Math.atan2(b, a) * (180 / Math.PI);
  const H = h < 0 ? h + 360 : h;
  return [L, C, H];
}

// Helper: hex to OKLCH
function hexToOklch(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
  const [L, a, b_oklab] = linearRgbToOklab(lr, lg, lb);
  return oklabToOklch(L, a, b_oklab);
}

describe("locked palette", () => {
  it("has 8 distinct 6-digit hex fills", () => {
    expect(FILLS).toHaveLength(8);
    for (const c of FILLS) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    expect(new Set(FILLS).size).toBe(8);
  });
  it("exposes a single navy stroke and width", () => {
    expect(STROKE).toBe("#002a3a");
    expect(STROKE_WIDTH).toBe(9);
  });
  it("allows the fills plus white and the off-white highlight", () => {
    expect(ALLOWED_FILLS.has("#ffffff")).toBe(true);
    expect(ALLOWED_FILLS.has(HIGHLIGHT)).toBe(true);
    for (const c of FILLS) expect(ALLOWED_FILLS.has(c)).toBe(true);
  });
  it("maintains equal lightness and chroma across all hues", () => {
    const oklchs = FILLS.map((hex) => hexToOklch(hex));
    const Ls = oklchs.map((x) => x[0]);
    const Cs = oklchs.map((x) => x[1]);

    // All fills share the same L within tight tolerance (8-bit quantization only).
    const L0 = Ls[0]!;
    for (const L of Ls) {
      expect(Math.abs(L - L0)).toBeLessThan(0.01);
    }

    // All fills share the same C within tight tolerance.
    const C0 = Cs[0]!;
    for (const C of Cs) {
      expect(Math.abs(C - C0)).toBeLessThan(0.006);
    }

    // Palette must be vivid: every fill has C > 0.11 to guard against dull regressions.
    for (const C of Cs) {
      expect(C).toBeGreaterThan(0.11);
    }
  });
});
