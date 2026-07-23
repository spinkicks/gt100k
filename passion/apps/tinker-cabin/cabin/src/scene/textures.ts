/**
 * Procedural PBR wood texture sets (albedo + derived normal + roughness), generated on a canvas so
 * there are no binary assets and the look is deterministic per seed. Ported from the R3F bake-off;
 * the grind loop may later swap these for CC0 scanned textures where fidelity demands it (D6).
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

/** Opaque dusk sky gradient + soft low sun — the far backdrop plane of the parallax window view. */
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

/**
 * One transparent mountain-ridge layer for the parallax window view: a smoothed ridge filled with
 * `color`, then tinted with aerial haze (more `haze` = hazier/lighter toward the ridgeline, for
 * distant layers). High-res + smoothed so it doesn't read as low-res/jagged.
 */
export function mountainLayerTexture(
  color: string,
  baseY: number,
  amp: number,
  seed: number,
  haze = 0,
): THREE.CanvasTexture {
  const w = 1600;
  const h = 400;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  const rand = mulberry32(seed);
  // build + smooth the ridge heights (two averaging passes → gentle silhouette, not jagged)
  const step = 8;
  const n = Math.floor(w / step) + 1;
  let ys: number[] = [];
  let y = baseY * h;
  for (let i = 0; i < n; i++) {
    y += (rand() - 0.5) * amp;
    y = Math.max(baseY * h - amp, Math.min(baseY * h + amp * 0.5, y));
    ys.push(y);
  }
  for (let pass = 0; pass < 2; pass++) {
    ys = ys.map((v, i) => {
      const a = ys[i - 1] ?? v;
      const b = ys[i + 1] ?? v;
      return (a + v + b) / 3;
    });
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, ys[0]!);
  for (let i = 0; i < n; i++) ctx.lineTo(i * step, ys[i]!);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  // aerial haze: tint only the mountain pixels, lighter toward the ridgeline
  if (haze > 0) {
    ctx.globalCompositeOperation = "source-atop";
    const g = ctx.createLinearGradient(0, baseY * h - amp, 0, h);
    g.addColorStop(0, `rgba(150,170,205,${0.55 * haze})`);
    g.addColorStop(1, "rgba(150,170,205,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Mottled meadow-grass texture for the exterior foreground (blades + tonal variation so it isn't a
 *  flat slab and blends into the photographic panorama's grass). */
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
  for (let i = 0; i < 1400; i++) {
    const x = rand() * s;
    const y = rand() * s;
    const h = 2 + rand() * 5;
    const g = 90 + Math.floor(rand() * 70);
    ctx.strokeStyle = `rgba(${g - 40},${g},${40 + Math.floor(rand() * 30)},${0.3 + rand() * 0.4})`;
    ctx.lineWidth = 0.6 + rand();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 2, y - h);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 18);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * A tuft of grass blades on a transparent background, for alpha-tested crossed-quad billboards.
 * Several tapered blades fan up from the base in varied muted-olive greens (matched to the
 * photographic panorama's meadow), darker at the root and lighter at the tip. Used unlit +
 * alphaTest so instanced tufts read as real grass clumps, not flat cones.
 */
export function grassBladeTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 128;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  const rand = mulberry32(4242);
  const blades = 9;
  for (let i = 0; i < blades; i++) {
    const baseX = w * (0.12 + rand() * 0.76);
    const bh = h * (0.5 + rand() * 0.48); // blade height
    const topY = h - bh;
    const lean = (rand() - 0.5) * w * 0.28; // horizontal drift of the tip
    const halfW = 1.6 + rand() * 2.2; // blade half-width at the base
    const ctrlY = h - bh * (0.45 + rand() * 0.2);
    const tipX = baseX + lean;
    // per-blade vertical gradient: dark olive root → lighter sage tip
    const g = ctx.createLinearGradient(0, h, 0, topY);
    const dk = 40 + Math.floor(rand() * 25);
    g.addColorStop(0, `rgb(${dk},${dk + 34},${Math.floor(dk * 0.5)})`);
    g.addColorStop(
      1,
      `rgb(${110 + Math.floor(rand() * 40)},${140 + Math.floor(rand() * 45)},${70 + Math.floor(rand() * 30)})`,
    );
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(baseX - halfW, h);
    ctx.quadraticCurveTo(baseX - halfW * 0.5 + lean * 0.5, ctrlY, tipX, topY);
    ctx.quadraticCurveTo(baseX + halfW * 0.5 + lean * 0.5, ctrlY, baseX + halfW, h);
    ctx.closePath();
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** A small painted mountain landscape for the framed picture on the wall. */
export function paintingTexture(): THREE.CanvasTexture {
  const w = 320;
  const h = 240;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#e8b878");
  sky.addColorStop(0.5, "#e6cfa0");
  sky.addColorStop(1, "#dfc58f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // low sun
  ctx.fillStyle = "rgba(255,240,205,0.9)";
  ctx.beginPath();
  ctx.arc(w * 0.7, h * 0.32, 22, 0, Math.PI * 2);
  ctx.fill();
  // two mountain ridges
  const rand = mulberry32(3);
  const ridge = (baseY: number, amp: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    let y = baseY;
    ctx.lineTo(0, y);
    for (let x = 0; x <= w; x += 12) {
      y += (rand() - 0.5) * amp;
      y = Math.max(baseY - amp, Math.min(baseY + amp * 0.4, y));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  };
  ridge(h * 0.5, 34, "#8898b4");
  ridge(h * 0.62, 46, "#5d6f92");
  // snow dabs on the near ridge crest
  ctx.fillStyle = "rgba(240,244,250,0.8)";
  for (let i = 0; i < 40; i++) ctx.fillRect(rand() * w, h * 0.6 + rand() * 8, 2 + rand() * 3, 2);
  // foreground
  ctx.fillStyle = "#3a4a30";
  ctx.fillRect(0, h * 0.82, w, h * 0.18);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Warm flame-tongue sprite for additive fire: a tapered teardrop (wide hot base → pointed cooler
 * tip), drawn as stacked ellipses so a vertically-stretched sprite reads as a flame, not an orb.
 * Canvas y=0 is top; we build the tip at top and the base at the bottom.
 */
export function flameTexture(): THREE.CanvasTexture {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, s, s);
  const cx = s / 2;
  // color by height: base hot white → amber → deep-orange tip (fed to a per-row radial gradient
  // whose alpha feathers to 0 at the blade edge, so additive stacking reads as one soft flame body
  // rather than hard-edged bars).
  const coreColor = (u: number): [number, number, number] => {
    if (u < 0.22) return [255, 249, 224];
    if (u < 0.46) return [255, 214, 130];
    if (u < 0.72) return [255, 150, 55];
    return [206, 74, 18];
  };
  const steps = 120;
  for (let i = 0; i < steps; i++) {
    const u = i / steps; // 0 base → 1 tip
    const y = s * (0.965 - u * 0.93); // base near bottom, tip near top
    // width profile: pinched at base, bulge ~25% up, taper to a point at the flickering tip
    const bulge = Math.sin(Math.min(1, u * 1.25) * Math.PI * 0.5);
    const halfW = 0.4 * s * bulge * (1 - u * 0.9) + 1.5;
    // core alpha: bright low, fading toward the cooler tip
    const coreA = u < 0.5 ? 0.85 - u * 0.4 : 0.55 * (1 - (u - 0.5) / 0.5);
    const [r, g, b] = coreColor(u);
    // soft horizontal falloff: opaque-ish core → transparent edge (feathered, not a hard ellipse)
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
 * Short-fur texture for the procedural cat: a base coat broken up by fine directional fur strokes
 * plus soft mackerel-tabby bands, with a derived normal map for micro-relief. Turns the smooth
 * clay loaf into something that reads as furred. Returns albedo + normal.
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
  // soft tabby bands (vertical, wavy) — only on the coat, not the belly/cream
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
  // fine fur strokes: many short lines in base±shade, mostly vertical, for micro-detail
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

/** Simple 2-tone woven rug pattern (warm kilim-ish stripes) for the hearth rug. */
export function rugTexture(): THREE.CanvasTexture {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#6e3b2a"; // rust base
  ctx.fillRect(0, 0, s, s);
  const bands = ["#8a4a33", "#3f2a20", "#b5763f", "#3f2a20", "#8a4a33"];
  const bh = s / (bands.length * 3);
  for (let i = 0; i < bands.length * 3; i++) {
    ctx.fillStyle = bands[i % bands.length]!;
    ctx.fillRect(0, i * bh, s, bh * 0.6);
  }
  // simple zigzag motif rows
  ctx.strokeStyle = "#d8b98a";
  ctx.lineWidth = 2;
  for (let y = bh; y < s; y += bh * 3) {
    ctx.beginPath();
    for (let x = 0; x <= s; x += 16) ctx.lineTo(x, y + (Math.floor(x / 16) % 2 ? 6 : -6));
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
