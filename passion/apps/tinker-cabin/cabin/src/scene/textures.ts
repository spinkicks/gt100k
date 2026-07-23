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

/** Procedural stacked-stone albedo: irregular mortar-jointed blocks in warm greys. */
function stoneAlbedoCanvas(size: number, seed: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const rand = mulberry32(seed);
  ctx.fillStyle = "#2b2622"; // mortar
  ctx.fillRect(0, 0, size, size);
  const rows = 9;
  const rh = size / rows;
  for (let r = 0; r < rows; r++) {
    const y0 = r * rh;
    const offset = (r % 2) * 0.5;
    const cols = 4 + Math.floor(rand() * 2);
    const cw = size / cols;
    for (let cx = -1; cx <= cols; cx++) {
      const x0 = (cx + offset) * cw + rand() * 6 - 3;
      const g = 92 + Math.floor(rand() * 60);
      const rr = g + Math.floor(rand() * 18);
      const bb = g - Math.floor(rand() * 14);
      ctx.fillStyle = `rgb(${rr},${g},${bb})`;
      const pad = 2 + rand() * 2;
      const bw = cw - pad * 2;
      const bh = rh - pad * 2;
      // rounded-ish block
      ctx.fillRect(x0 + pad, y0 + pad, bw, bh);
      // speckle/mottling
      for (let s = 0; s < 24; s++) {
        const sx = x0 + pad + rand() * bw;
        const sy = y0 + pad + rand() * bh;
        const d = rand() > 0.5 ? 22 : -22;
        ctx.fillStyle = `rgba(${rr + d},${g + d},${bb + d},0.25)`;
        ctx.fillRect(sx, sy, 1 + rand() * 2, 1 + rand() * 2);
      }
    }
  }
  return c;
}

export const stoneTextures = (): WoodTextureSet => {
  const size = 512;
  const albedoC = stoneAlbedoCanvas(size, 1717);
  const normalC = normalFromCanvas(albedoC, 7);
  const roughC = roughnessFromCanvas(albedoC, 0.7, 0.98);
  const mk = (canvas: HTMLCanvasElement, srgb: boolean): THREE.CanvasTexture => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 3);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { map: mk(albedoC, true), normalMap: mk(normalC, false), roughnessMap: mk(roughC, false) };
};

/**
 * Dusk mountain vista for the window: vertical sky gradient (deep blue → warm horizon) with a few
 * layered mountain silhouettes. Returned as one sRGB texture used as an emissive+map on the pane.
 */
export function duskVistaTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#5478b0"); // clear upper dusk blue
  sky.addColorStop(0.45, "#93add4");
  sky.addColorStop(0.72, "#ecc79a"); // warm horizon band
  sky.addColorStop(0.85, "#f4d3a0");
  sky.addColorStop(1, "#d9b184");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // soft low sun glow near the horizon
  const sun = ctx.createRadialGradient(w * 0.66, h * 0.66, 4, w * 0.66, h * 0.66, w * 0.34);
  sun.addColorStop(0, "rgba(255,240,205,0.95)");
  sun.addColorStop(0.4, "rgba(255,225,170,0.4)");
  sun.addColorStop(1, "rgba(255,225,170,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
  // layered ridgelines, far (light, hazy) to near (dark) — read against the bright sky
  const layers: Array<[string, number, number]> = [
    ["#7f8fb0", 0.6, 55],
    ["#566484", 0.7, 85],
    ["#39435c", 0.82, 120],
  ];
  const rand = mulberry32(99);
  for (const [col, baseY, amp] of layers) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, h);
    let y = baseY * h;
    ctx.lineTo(0, y);
    for (let x = 0; x <= w; x += 16) {
      y += (rand() - 0.5) * amp * 0.5;
      y = Math.max(baseY * h - amp, Math.min(baseY * h + amp * 0.4, y));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
