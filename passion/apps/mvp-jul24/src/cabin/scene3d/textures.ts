/**
 * Procedural PBR wood/stone/fur/rug texture sets (albedo + derived normal + roughness), generated
 * on a canvas so there are no binary assets and the look is deterministic per seed. Ported/trimmed
 * from passion/apps/tinker-cabin/cabin/src/scene/textures.ts — this is the ALWAYS-AVAILABLE fallback
 * the real CC0 scanned textures (fetched by scripts/fetch-assets.mjs) sit on top of.
 */
import * as THREE from "three";

type RGB = [number, number, number];

/** Small deterministic PRNG so textures look identical every render (determinism gate). */
export function mulberry32(seed: number): () => number {
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
    const hr = 1 + (rand() - 0.5) * 0.12;
    const hb = 1 + (rand() - 0.5) * 0.12;
    ctx.fillStyle = `rgb(${Math.floor(base[0] * shade * hr)},${Math.floor(base[1] * shade)},${Math.floor(base[2] * shade * hb)})`;
    ctx.fillRect(0, y0, size, plankH);
    for (let i = 0; i < 44; i++) {
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
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, y0, size, Math.max(1.5, plankH * 0.03));
    ctx.fillStyle = "rgba(255,240,210,0.10)";
    ctx.fillRect(0, y0 + Math.max(1.5, plankH * 0.03), size, Math.max(1, plankH * 0.02));
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.fillRect(0, y0 + plankH - Math.max(1.5, plankH * 0.05), size, Math.max(1.5, plankH * 0.05));
  }
  for (let i = 0; i < 7; i++) {
    const mx = rand() * size;
    const my = rand() * size;
    const mr = size * (0.28 + rand() * 0.35);
    const up = rand() > 0.5;
    const g = ctx.createRadialGradient(mx, my, 1, mx, my, mr);
    g.addColorStop(0, up ? "rgba(255,240,210,0.06)" : "rgba(20,12,6,0.10)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
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
    size: 1024,
    planks: 13,
    base: [186, 143, 92],
    dark: [70, 46, 24],
    seed: 21,
    normalStrength: 5,
    roughLo: 0.55,
    roughHi: 0.9,
    repeat: [2.2, 1.7],
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
  ctx.fillStyle = "#211915";
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
      const g = 96 + Math.floor(rand() * 58);
      const rr = g + 16 + Math.floor(rand() * 22);
      const bb = g - 10 - Math.floor(rand() * 16);
      const pad = 2 + rand() * 2;
      const bw = cw - pad * 2;
      const bh = rh - pad * 2;
      const bx = x0 + pad;
      const by = y0 + pad;
      ctx.fillStyle = `rgb(${rr},${g},${bb})`;
      ctx.fillRect(bx, by, bw, bh);
      for (let s = 0; s < 30; s++) {
        const sx = bx + rand() * bw;
        const sy = by + rand() * bh;
        const d = rand() > 0.5 ? 26 : -26;
        ctx.fillStyle = `rgba(${rr + d},${g + d},${bb + d},0.25)`;
        ctx.fillRect(sx, sy, 1 + rand() * 2, 1 + rand() * 2);
      }
      ctx.fillStyle = "rgba(255,238,210,0.16)";
      ctx.fillRect(bx, by, bw, 1.5);
      ctx.fillRect(bx, by, 1.5, bh);
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.fillRect(bx, by + bh - 1.5, bw, 1.5);
      ctx.fillRect(bx + bw - 1.5, by, 1.5, bh);
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

/** Opaque dusk sky gradient + soft low sun — the fallback backdrop for the window vista when the
 *  real CC0 panorama hasn't been fetched. */
export function skyGradientTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 1024;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#3a5890");
  sky.addColorStop(0.5, "#7f9ac6");
  sky.addColorStop(0.8, "#e6c194");
  sky.addColorStop(1, "#ecc896");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const sun = ctx.createRadialGradient(w * 0.62, h * 0.74, 4, w * 0.62, h * 0.74, w * 0.42);
  sun.addColorStop(0, "rgba(255,244,214,0.9)");
  sun.addColorStop(0.35, "rgba(255,226,172,0.35)");
  sun.addColorStop(1, "rgba(255,226,172,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Mottled meadow-grass ground texture for the exterior foreground seen through the window. */
export function grassTexture(): THREE.CanvasTexture {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const rand = mulberry32(7);
  ctx.fillStyle = "#7f8c4e";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 220; i++) {
    const x = rand() * s;
    const y = rand() * s;
    const r = 6 + rand() * 26;
    const g = 70 + Math.floor(rand() * 60);
    ctx.fillStyle = `rgba(${g - 20},${g + 20},${50 + Math.floor(rand() * 30)},0.12)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 18);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * Warm flame-tongue sprite for additive fire: a tapered teardrop (wide hot base → pointed cooler
 * tip), drawn as stacked ellipses so a vertically-stretched sprite reads as a flame, not an orb.
 */
export function flameTexture(): THREE.CanvasTexture {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, s, s);
  const cx = s / 2;
  const coreColor = (u: number): [number, number, number] => {
    if (u < 0.22) return [255, 249, 224];
    if (u < 0.46) return [255, 214, 130];
    if (u < 0.72) return [255, 150, 55];
    return [206, 74, 18];
  };
  const steps = 120;
  for (let i = 0; i < steps; i++) {
    const u = i / steps;
    const y = s * (0.965 - u * 0.93);
    const bulge = Math.sin(Math.min(1, u * 1.25) * Math.PI * 0.5);
    const halfW = 0.4 * s * bulge * (1 - u * 0.9) + 1.5;
    const coreA = u < 0.5 ? 0.85 - u * 0.4 : 0.55 * (1 - (u - 0.5) / 0.5);
    const [r, g, b] = coreColor(u);
    const grad = ctx.createRadialGradient(cx, y, 0, cx, y, halfW);
    grad.addColorStop(0, `rgba(${r},${g},${b},${coreA.toFixed(3)})`);
    grad.addColorStop(0.55, `rgba(${r},${g},${b},${(coreA * 0.5).toFixed(3)})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, y, halfW, (s / steps) * 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Short-fur texture for the procedural cat fallback: a base coat broken up by fine directional fur
 * strokes plus soft mackerel-tabby bands, with a derived normal map for micro-relief.
 */
export function catFurTexture(
  base: RGB,
  dark: RGB,
  seed: number,
  stripes: boolean,
): { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture } {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const rand = mulberry32(seed);
  ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
  ctx.fillRect(0, 0, size, size);
  if (stripes) {
    for (let b = 0; b < 7; b++) {
      const bx = (b + 0.5) * (size / 7) + (rand() - 0.5) * 10;
      const bw = 8 + rand() * 12;
      ctx.strokeStyle = `rgba(${dark[0]},${dark[1]},${dark[2]},${0.28 + rand() * 0.18})`;
      ctx.lineWidth = bw;
      ctx.beginPath();
      for (let y = 0; y <= size; y += 6) {
        const x = bx + Math.sin(y * 0.03 + b) * 10;
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  for (let i = 0; i < 5200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 3 + rand() * 6;
    const d = rand() > 0.5 ? 1 : -1;
    const j = Math.floor(rand() * 26) * d;
    ctx.strokeStyle = `rgba(${base[0] + j},${base[1] + j},${base[2] + j},${0.2 + rand() * 0.3})`;
    ctx.lineWidth = 0.6 + rand() * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 2, y - len);
    ctx.stroke();
  }
  const normalC = normalFromCanvas(c, 2.4);
  const mk = (canvas: HTMLCanvasElement, srgb: boolean): THREE.CanvasTexture => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { map: mk(c, true), normalMap: mk(normalC, false) };
}

/** Woven wool-kilim texture for the hearth rug: muted terracotta/ochre/charcoal bands, a cream
 *  diamond motif, a border, and fine horizontal weave striations so it reads as woven wool. */
export function rugTexture(): THREE.CanvasTexture {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const rand = mulberry32(555);
  ctx.fillStyle = "#7c4634";
  ctx.fillRect(0, 0, s, s);
  const bands = ["#814b37", "#3a2a22", "#a06a44", "#3a2a22", "#8f5a3e"];
  const bh = s / (bands.length * 4);
  for (let i = 0; i < bands.length * 4; i++) {
    ctx.fillStyle = bands[i % bands.length]!;
    ctx.fillRect(0, i * bh, s, bh * 0.62);
  }
  ctx.strokeStyle = "#d8bd93";
  ctx.lineWidth = 3;
  for (let y = bh; y < s; y += bh * 4) {
    ctx.beginPath();
    for (let x = 0; x <= s; x += 24) ctx.lineTo(x, y + (Math.floor(x / 24) % 2 ? 10 : -10));
    ctx.stroke();
  }
  ctx.strokeStyle = "#2f231c";
  ctx.lineWidth = 10;
  ctx.strokeRect(6, 6, s - 12, s - 12);
  for (let y = 0; y < s; y += 2) {
    const a = 0.05 + rand() * 0.08;
    ctx.strokeStyle = rand() > 0.5 ? `rgba(255,240,215,${a})` : `rgba(0,0,0,${a})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(s, y + 0.5);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
