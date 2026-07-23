/**
 * Procedural PBR wood texture sets (albedo + derived normal + roughness), generated on a canvas so
 * there are no binary assets and the look is deterministic per seed. Ported from the R3F bake-off;
 * the grind loop may later swap these for CC0 scanned textures where fidelity demands it (D6).
 */
import * as THREE from "three";

type RGB = [number, number, number];

/** Small deterministic PRNG so textures look identical every render (determinism gate). */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function woodAlbedoCanvas(
  size: number,
  planks: number,
  base: RGB,
  dark: RGB,
  seed: number,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const rand = mulberry32(seed);
  const plankH = size / planks;
  for (let p = 0; p < planks; p++) {
    const y0 = p * plankH;
    const shade = 0.82 + rand() * 0.28;
    ctx.fillStyle = `rgb(${Math.floor(base[0] * shade)},${Math.floor(base[1] * shade)},${Math.floor(base[2] * shade)})`;
    ctx.fillRect(0, y0, size, plankH);
    for (let i = 0; i < 40; i++) {
      const gy = y0 + rand() * plankH;
      ctx.strokeStyle = `rgba(${dark[0]},${dark[1]},${dark[2]},${0.04 + rand() * 0.1})`;
      ctx.lineWidth = 0.5 + rand() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      const amp = 1 + rand() * 3;
      const freq = 0.01 + rand() * 0.03;
      const phase = rand() * 10;
      for (let x = 0; x < size; x += 4) ctx.lineTo(x, gy + Math.sin(x * freq + phase) * amp);
      ctx.stroke();
    }
    if (rand() > 0.6) {
      const kx = rand() * size;
      const ky = y0 + plankH * (0.3 + rand() * 0.4);
      const kr = 3 + rand() * 6;
      const grad = ctx.createRadialGradient(kx, ky, 1, kx, ky, kr * 2);
      grad.addColorStop(0, `rgba(${dark[0]},${dark[1]},${dark[2]},0.7)`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(kx, ky, kr * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, y0, size, Math.max(1.5, plankH * 0.03));
  }
  return c;
}

/** Derive a normal map from albedo luminance (cheap Sobel-ish gradient). */
function normalFromCanvas(albedo: HTMLCanvasElement, strength: number): HTMLCanvasElement {
  const size = albedo.width;
  const src = albedo.getContext("2d")!.getImageData(0, 0, size, size);
  const out = document.createElement("canvas");
  out.width = out.height = size;
  const octx = out.getContext("2d")!;
  const dst = octx.createImageData(size, size);
  const lum = (x: number, y: number): number => {
    const xx = (x + size) % size;
    const yy = (y + size) % size;
    const i = (yy * size + xx) * 4;
    return (src.data[i]! * 0.3 + src.data[i + 1]! * 0.59 + src.data[i + 2]! * 0.11) / 255;
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let nx = (lum(x - 1, y) - lum(x + 1, y)) * strength;
      let ny = (lum(x, y - 1) - lum(x, y + 1)) * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * size + x) * 4;
      dst.data[i] = Math.floor((nx * 0.5 + 0.5) * 255);
      dst.data[i + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      dst.data[i + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      dst.data[i + 3] = 255;
    }
  octx.putImageData(dst, 0, 0);
  return out;
}

/** Roughness map: rougher (darker→higher rough) in gaps/knots, smoother on clean planks. */
function roughnessFromCanvas(albedo: HTMLCanvasElement, lo: number, hi: number): HTMLCanvasElement {
  const size = albedo.width;
  const src = albedo.getContext("2d")!.getImageData(0, 0, size, size);
  const out = document.createElement("canvas");
  out.width = out.height = size;
  const octx = out.getContext("2d")!;
  const dst = octx.createImageData(size, size);
  for (let i = 0; i < src.data.length; i += 4) {
    const l = (src.data[i]! * 0.3 + src.data[i + 1]! * 0.59 + src.data[i + 2]! * 0.11) / 255;
    const v = Math.floor((hi - l * (hi - lo)) * 255);
    dst.data[i] = dst.data[i + 1] = dst.data[i + 2] = v;
    dst.data[i + 3] = 255;
  }
  octx.putImageData(dst, 0, 0);
  return out;
}

export interface WoodTextureSet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

interface WoodSpec {
  size?: number;
  planks: number;
  base: RGB;
  dark: RGB;
  seed: number;
  normalStrength: number;
  roughLo: number;
  roughHi: number;
  repeat: [number, number];
}

function makeSet(spec: WoodSpec): WoodTextureSet {
  const size = spec.size ?? 512;
  const albedoC = woodAlbedoCanvas(size, spec.planks, spec.base, spec.dark, spec.seed);
  const normalC = normalFromCanvas(albedoC, spec.normalStrength);
  const roughC = roughnessFromCanvas(albedoC, spec.roughLo, spec.roughHi);
  const mk = (canvas: HTMLCanvasElement, srgb: boolean): THREE.CanvasTexture => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(spec.repeat[0], spec.repeat[1]);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { map: mk(albedoC, true), normalMap: mk(normalC, false), roughnessMap: mk(roughC, false) };
}

// Lighter pine tones toward the ref-05 tongue-and-groove interior (warmer than the bake-off's dark logs).
export const floorTextures = (): WoodTextureSet =>
  makeSet({
    planks: 9,
    base: [168, 120, 74],
    dark: [46, 28, 14],
    seed: 7,
    normalStrength: 4,
    roughLo: 0.45,
    roughHi: 0.82,
    repeat: [4, 4],
  });

export const wallTextures = (): WoodTextureSet =>
  makeSet({
    planks: 10,
    base: [186, 143, 92],
    dark: [70, 46, 24],
    seed: 21,
    normalStrength: 5,
    roughLo: 0.55,
    roughHi: 0.9,
    repeat: [3, 2],
  });

export const propTextures = (): WoodTextureSet =>
  makeSet({
    planks: 4,
    base: [150, 104, 60],
    dark: [42, 24, 12],
    seed: 99,
    normalStrength: 5,
    roughLo: 0.5,
    roughHi: 0.88,
    repeat: [1, 1],
  });
