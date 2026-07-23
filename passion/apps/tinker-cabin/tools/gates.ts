/**
 * Measurable visual floors from PROJECT.md, computed from a rendered PNG (+ engine stats).
 * Each gate returns a pass/fail with the measured value so DELTA.md can cite it.
 *
 * These are FLOORS (banned-outcome guards), not quality scores — a scene can pass every gate
 * and still self-score 3/10. The self-score vs reference is the quality signal; gates just stop
 * the loop from shipping a crushed-black, flat-lit, fireless, or blown-out frame.
 *
 * Ported from ~/code/test/tools/gates.ts; voxel gates (sky/horizon/water) replaced with the
 * interior set. Thresholds are initial guesses to be tuned against real shots (LAAS pattern).
 */
import sharp from "sharp";
import type { CabinStats } from "./types";

export interface GateResult {
  name: string;
  pass: boolean;
  value: number;
  threshold: string;
  detail?: string;
}

export interface RasterImage {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
}

export async function loadRaster(path: string): Promise<RasterImage> {
  const { data, info } = await sharp(path).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

function lum(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function px(img: RasterImage, x: number, y: number): [number, number, number] {
  const i = (y * img.width + x) * img.channels;
  return [img.data[i]!, img.data[i + 1]!, img.data[i + 2]!];
}

/**
 * no-crushed-blacks: shadows must retain detail, not clip to pure black.
 * Measures the fraction of near-black pixels (lum < 0.02). A cozy dusk interior has dark corners,
 * but if most of the frame is pure black the lighting/exposure is broken.
 */
export function gateNoCrushedBlacks(img: RasterImage): GateResult {
  let black = 0;
  let n = 0;
  for (let y = 0; y < img.height; y += 2)
    for (let x = 0; x < img.width; x += 2) {
      const [r, g, b] = px(img, x, y);
      if (lum(r, g, b) < 0.02) black++;
      n++;
    }
  const v = black / n;
  return {
    name: "no-crushed-blacks",
    pass: v < 0.35,
    value: +v.toFixed(3),
    threshold: "< 0.35 pure-black",
  };
}

/** material-variance: global luminance stddev > 0.10 (proves lit materials + AO depth, not flat fill). */
export function gateMaterialVariance(img: RasterImage): GateResult {
  let s = 0;
  let s2 = 0;
  let n = 0;
  for (let y = 0; y < img.height; y += 2)
    for (let x = 0; x < img.width; x += 2) {
      const [r, g, b] = px(img, x, y);
      const l = lum(r, g, b);
      s += l;
      s2 += l * l;
      n++;
    }
  const mean = s / n;
  const sd = Math.sqrt(Math.max(0, s2 / n - mean * mean));
  return { name: "material-variance", pass: sd > 0.1, value: +sd.toFixed(3), threshold: "> 0.10" };
}

/**
 * fire-emissive: the fireplace must actually glow — a warm, bright region must exist.
 * Fraction of warm-bright pixels (warm hue r>g>b, r>180, lum>0.45) > 0.003 of frame.
 */
export function gateFireEmissive(img: RasterImage): GateResult {
  let hits = 0;
  let n = 0;
  for (let y = 0; y < img.height; y += 2)
    for (let x = 0; x < img.width; x += 2) {
      const [r, g, b] = px(img, x, y);
      if (r > 180 && r > g && g >= b && lum(r, g, b) > 0.45) hits++;
      n++;
    }
  const v = hits / n;
  return {
    name: "fire-emissive",
    pass: v > 0.003,
    value: +v.toFixed(4),
    threshold: "> 0.003 warm-bright",
  };
}

/**
 * warm-cool-split: dual lighting must read — warm firelight AND cool window fill both present.
 * Passes when both a warm fraction (r-b > 20) and a cool fraction (b-r > 10) each exceed 0.02.
 */
export function gateWarmCoolSplit(img: RasterImage): GateResult {
  let warm = 0;
  let cool = 0;
  let n = 0;
  for (let y = 0; y < img.height; y += 2)
    for (let x = 0; x < img.width; x += 2) {
      const [r, g, b] = px(img, x, y);
      if (r - b > 20) warm++;
      if (b - r > 10) cool++;
      n++;
    }
  const warmF = warm / n;
  const coolF = cool / n;
  const v = Math.min(warmF, coolF);
  return {
    name: "warm-cool-split",
    pass: warmF > 0.02 && coolF > 0.02,
    value: +v.toFixed(3),
    threshold: "both > 0.02",
    detail: `warm=${warmF.toFixed(3)} cool=${coolF.toFixed(3)}`,
  };
}

/** tonemap-highlights: ACES roll-off — clipped pure-white pixels (all channels >250) < 0.02 of frame. */
export function gateTonemapHighlights(img: RasterImage): GateResult {
  let clip = 0;
  let n = 0;
  for (let y = 0; y < img.height; y += 2)
    for (let x = 0; x < img.width; x += 2) {
      const [r, g, b] = px(img, x, y);
      if (r > 250 && g > 250 && b > 250) clip++;
      n++;
    }
  const v = clip / n;
  return {
    name: "tonemap-highlights",
    pass: v < 0.02,
    value: +v.toFixed(4),
    threshold: "< 0.02 clipped-white",
  };
}

/** no-flat-face: no single quantized color occupies > 55% of the frame (proxy for missing lighting/texture). */
export function gateNoFlatFace(img: RasterImage): GateResult {
  const hist = new Map<number, number>();
  let n = 0;
  for (let y = 0; y < img.height; y += 2)
    for (let x = 0; x < img.width; x += 2) {
      const [r, g, b] = px(img, x, y);
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      hist.set(key, (hist.get(key) ?? 0) + 1);
      n++;
    }
  let max = 0;
  for (const c of hist.values()) if (c > max) max = c;
  const v = max / n;
  return {
    name: "no-flat-face",
    pass: v < 0.55,
    value: +v.toFixed(3),
    threshold: "< 0.55 single color",
  };
}

export function gateFpsFloor(fps: number): GateResult {
  return { name: "fps-floor", pass: fps >= 30, value: fps, threshold: ">= 30 (target 60)" };
}

/** Semantic gates — read scene facts the pixels can't reliably prove. */
export function gateFireLit(stats: CabinStats): GateResult {
  return {
    name: "fire-lit",
    pass: stats.fireLit === true,
    value: stats.fireLit ? 1 : 0,
    threshold: "=== true",
  };
}
export function gateCatPresent(stats: CabinStats): GateResult {
  return {
    name: "cat-present",
    pass: stats.catVisible === true,
    value: stats.catVisible ? 1 : 0,
    threshold: "=== true",
  };
}

/**
 * Situational assertions: `fire` (framing faces the hearth) and `warmCool` (framing sees both the
 * fire and the window). Universal floors run on every framing; situational gates only where the
 * composition can satisfy them.
 */
export interface GateOpts {
  fire?: boolean;
  warmCool?: boolean;
}

export async function runImageGates(path: string, opts: GateOpts = {}): Promise<GateResult[]> {
  const img = await loadRaster(path);
  const gates = [
    gateNoCrushedBlacks(img),
    gateMaterialVariance(img),
    gateTonemapHighlights(img),
    gateNoFlatFace(img),
  ];
  if (opts.fire) gates.push(gateFireEmissive(img));
  if (opts.warmCool) gates.push(gateWarmCoolSplit(img));
  return gates;
}
