// The Atelier at Golden Hour — pure scene description (art bible §7.2 / §8, "The Atelier Cabin").
//
// This is the value/reference layer: a palette-driven, testable DESCRIPTION of the cozy cabin
// interior (geometry + material + light data), separated from the r3f render (AtelierRoom.tsx) so
// the §9 hard floors (≥30 dressed objects · ≥5 surface classes · ≥2 warm sources · blue-violet
// shadow · every hue on the §3 palette) are enforced by fast model-free unit tests, exactly as
// resolveIslandRender is for the overworld. Everything is tinted onto the CABIN palette (Pillar A
// cohesion); firelight/amber is reserved for emissive surfaces (Pillar B). No default gray.

import { CABIN, HUE_RAMP } from "@gt100k/interest-lab-view";

/** Periwinkle art identity hue (HUE_RAMP[2]) — the one deliberately cool accent (the doorway glow). */
export const ATELIER_HUE = HUE_RAMP[2]; // #6C8CE8

export type PropGeom = "box" | "cyl" | "cone" | "plane" | "sphere";

/** The §9 dressed-object surface classes present in the room. */
export type SurfaceClass =
  | "floor"
  | "wall"
  | "beam"
  | "window"
  | "hearth"
  | "desk"
  | "shelf"
  | "gallery"
  | "easel"
  | "light"
  | "plant"
  | "textile"
  | "life";

/** Which prop an interactive action mesh binds to (§8.2 live taste + doorway object). */
export type PropRole = "easel-canvas" | "storybox" | "gallery-hero";

export interface AtelierProp {
  key: string;
  surfaceClass: SurfaceClass;
  geom: PropGeom;
  args: readonly number[];
  position: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  /** Diffuse tint — MUST be a §3 palette hex (cohesion test). */
  color: string;
  /** Satin discipline: never below 0.4 (no plastic shine). */
  roughness: number;
  metalness: number;
  /** Emissive tint for warm/cool sources (firebox, windows, lanterns, the doorway glow). */
  emissive?: string;
  emissiveIntensity?: number;
  /** Low-poly flat shading — the shipped world look (matches Island.tsx). */
  flat: boolean;
  /** Semi-transparent volumes (the golden shaft) — kept off MeshBasicMaterial (§11). */
  opacity?: number;
  /** Bind an interactive action to this prop (§8.2). */
  role?: PropRole;
  /** Per-instance variation was applied (Pillar C anti-clone). */
  jittered?: boolean;
}

export interface AtelierLight {
  kind: "ambient" | "hemisphere" | "directional" | "point";
  color: string;
  intensity: number;
  position?: readonly [number, number, number];
  groundColor?: string;
}

/**
 * Procedural IBL colors — a warm/cool equirect gradient baked ONCE via PMREM (no external HDRI/CDN),
 * the r3f-pitfall-safe drop-in for the drei `<Environment>` portal that intermittently throws the
 * "Cannot read properties of undefined (reading '0')" crash → blank canvas. Consumed by
 * `<ProceduralEnvironment>` in world3d/procedural-env.tsx.
 */
export interface EnvColors {
  /** Cool dusk skylight from above — keeps shadows blue-violet, never dead (Pillar B). */
  cool: string;
  /** Warm golden-hour horizon band the room bathes in. */
  warm: string;
  /** Warm floor bounce from below (terracotta / walnut). */
  floor: string;
  /** Warm key band, left — the golden window (the beacon). */
  accentL: string;
  /** Warm key band, right — the wood-stove hearth (the spark). */
  accentR: string;
}

export interface AtelierScene {
  camera: { pos: readonly [number, number, number]; target: readonly [number, number, number]; fov: number };
  /** Frozen blue-violet contact shadow (§9 ≤1 shadow-caster, Pillar B no dead shadow). */
  shadow: { color: string; opacity: number; scale: number; blur: number; y: number };
  lights: readonly AtelierLight[];
  /** Procedural IBL — a warm window + hearth + cool sky, no external HDRI/CDN (r3f pitfall-safe). */
  env: EnvColors;
  /** The hero detail — the golden window shaft carrying dust motes (§5). */
  shaft: {
    color: string;
    emissive: string;
    emissiveIntensity: number;
    opacity: number;
    position: readonly [number, number, number];
    rotation: readonly [number, number, number];
    args: readonly [number, number, number];
  };
  motes: { count: number; color: string; size: number; speed: number; scale: readonly [number, number, number] };
  props: readonly AtelierProp[];
}

// ── palette guards ───────────────────────────────────────────────────────────
/** Every hex used in the room, for the cohesion test (§13.4). */
export const ATELIER_PALETTE: ReadonlySet<string> = new Set<string>([
  ...Object.values(CABIN),
  ATELIER_HUE,
]);

const warm = (hex: string): boolean => {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return r > b; // warm sources read red-forward
};

/** Emissive palette values that count as a "warm source" (§9 ≥2). */
const WARM_EMISSIVE: ReadonlySet<string> = new Set<string>(
  [CABIN.fireEmber, CABIN.fireFlame, CABIN.fireSpark, CABIN.lantern, CABIN.windowSpill, CABIN.candle].filter(
    warm,
  ),
);

// ── scene ──────────────────────────────────────────────────────────────────
// Room box (composed frame §8.1: dark cozy foreground → lit subject → luminous window/hearth):
//   back wall at z=-6, floor at y=0, camera at z≈7 looking to the back-left window.
const backZ = -6;

/**
 * Build the full Atelier scene. Deterministic (index-seeded jitter, no RNG) so tests + the frozen
 * frame are stable. Everything is tinted to the CABIN palette; warm glow is emissive-only.
 */
export function buildAtelierScene(): AtelierScene {
  const props: AtelierProp[] = [];
  const push = (p: AtelierProp) => props.push(p);

  // — Shell: floor · log walls · plaster chinking · window + skylight · foreground frame —
  push({ key: "floor", surfaceClass: "floor", geom: "box", args: [12, 0.3, 14], position: [0, -0.15, -1], color: CABIN.woodOak, roughness: 0.82, metalness: 0, flat: true });
  push({ key: "rug-under", surfaceClass: "floor", geom: "box", args: [5.2, 0.06, 4], position: [0, 0.03, 0.4], color: CABIN.woodHoney, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "wall-back", surfaceClass: "wall", geom: "box", args: [12, 6, 0.3], position: [0, 2.7, backZ], color: CABIN.woodWalnut, roughness: 0.88, metalness: 0, flat: true });
  push({ key: "wall-back-chink", surfaceClass: "wall", geom: "box", args: [12, 5.4, 0.16], position: [0, 2.7, backZ + 0.16], color: CABIN.plaster, roughness: 0.94, metalness: 0, flat: true });
  push({ key: "wall-left", surfaceClass: "wall", geom: "box", args: [0.3, 6, 13], position: [-5.4, 2.7, -1], color: CABIN.woodWalnut, roughness: 0.88, metalness: 0, flat: true });
  push({ key: "wall-left-chink", surfaceClass: "wall", geom: "box", args: [0.16, 5.4, 13], position: [-5.24, 2.7, -1], color: CABIN.plaster, roughness: 0.94, metalness: 0, flat: true });
  // Log courses on the back wall (round beam ends) — meso band, per-instance value jitter.
  for (let i = 0; i < 5; i += 1) {
    const shade = i % 2 === 0 ? CABIN.woodHoney : CABIN.woodOak;
    push({ key: `log-${i}`, surfaceClass: "wall", geom: "cyl", args: [0.34, 0.34, 11.4, 8], position: [0, 0.8 + i * 1.05, backZ + 0.28], rotation: [0, 0, Math.PI / 2], color: shade, roughness: 0.82, metalness: 0, flat: true, jittered: true });
  }
  // Overhead exposed beams (walnut, in shade — read blue-violet under the dusk fill).
  for (let i = 0; i < 4; i += 1) {
    push({ key: `beam-${i}`, surfaceClass: "beam", geom: "box", args: [11.4, 0.42, 0.5], position: [0, 5.1, backZ + 1.4 + i * 2.2], color: CABIN.woodWalnut, roughness: 0.8, metalness: 0, flat: true });
  }
  push({ key: "beam-ridge", surfaceClass: "beam", geom: "box", args: [0.5, 0.5, 12], position: [0, 5.35, -1], color: CABIN.woodCocoa, roughness: 0.8, metalness: 0, flat: true });
  // Dark cozy FOREGROUND frame (value structure §3 — the deepest wood, near the camera top edge).
  push({ key: "fg-beam", surfaceClass: "beam", geom: "box", args: [13, 0.7, 0.7], position: [0, 4.7, 4.4], color: CABIN.woodCocoa, roughness: 0.85, metalness: 0, flat: true });
  push({ key: "fg-post-l", surfaceClass: "beam", geom: "box", args: [0.7, 6, 0.7], position: [-5.6, 2.6, 4.2], color: CABIN.woodCocoa, roughness: 0.85, metalness: 0, flat: true });
  push({ key: "fg-post-r", surfaceClass: "beam", geom: "box", args: [0.7, 6, 0.7], position: [5.6, 2.6, 4.2], color: CABIN.woodCocoa, roughness: 0.85, metalness: 0, flat: true });

  // — Window (back-left, the golden shaft's source) + sill + cool dusk seen through the glass —
  push({ key: "window-frame", surfaceClass: "window", geom: "box", args: [2.9, 3.4, 0.4], position: [-3.1, 3.0, backZ + 0.3], color: CABIN.woodHoney, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "window-glass", surfaceClass: "window", geom: "plane", args: [2.4, 2.9], position: [-3.1, 3.0, backZ + 0.52], color: CABIN.windowSpill, roughness: 0.5, metalness: 0, emissive: CABIN.windowSpill, emissiveIntensity: 0.62, flat: false });
  push({ key: "window-dusk", surfaceClass: "window", geom: "plane", args: [2.4, 1.0], position: [-3.1, 4.05, backZ + 0.5], color: CABIN.duskWindow, roughness: 0.6, metalness: 0, emissive: CABIN.duskSkylight, emissiveIntensity: 0.7, flat: false });
  push({ key: "window-mullion-v", surfaceClass: "window", geom: "box", args: [0.12, 2.9, 0.12], position: [-3.1, 3.0, backZ + 0.55], color: CABIN.woodWalnut, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "window-mullion-h", surfaceClass: "window", geom: "box", args: [2.4, 0.12, 0.12], position: [-3.1, 3.0, backZ + 0.55], color: CABIN.woodWalnut, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "window-sill", surfaceClass: "window", geom: "box", args: [3.3, 0.24, 0.7], position: [-3.1, 1.4, backZ + 0.5], color: CABIN.woodDrift, roughness: 0.8, metalness: 0, flat: true });
  // Skylight (§7.2 north-light) — a bright warm slot up in the roof pitch.
  push({ key: "skylight", surfaceClass: "window", geom: "plane", args: [2.2, 1.1], position: [1.4, 4.9, backZ + 1.2], rotation: [Math.PI / 2.6, 0, 0], color: CABIN.candle, roughness: 0.4, metalness: 0, emissive: CABIN.candle, emissiveIntensity: 1.15, flat: false });

  // — Hearth: the wood-stove glowing forward-right (warm key #2 §5, the cohesion heartbeat — kept
  //   clear of the easel so the fire reads as the second warm focal point) + stovepipe · kettle · logs —
  const sx = 3.6;
  const sz = -3.4;
  push({ key: "stove-body", surfaceClass: "hearth", geom: "box", args: [1.5, 1.9, 1.3], position: [sx, 0.95, sz], color: CABIN.woodCocoa, roughness: 0.6, metalness: 0.25, flat: true });
  push({ key: "stove-top", surfaceClass: "hearth", geom: "cyl", args: [0.9, 0.9, 0.24, 10], position: [sx, 1.95, sz], color: CABIN.woodWalnut, roughness: 0.5, metalness: 0.3, flat: true });
  push({ key: "stove-firebox", surfaceClass: "hearth", geom: "plane", args: [0.95, 0.95], position: [sx, 0.8, sz + 0.66], color: CABIN.fireEmber, roughness: 0.5, metalness: 0, emissive: CABIN.fireEmber, emissiveIntensity: 3.2, flat: false });
  push({ key: "stove-flame", surfaceClass: "hearth", geom: "cone", args: [0.34, 0.72, 8], position: [sx, 0.9, sz + 0.55], color: CABIN.fireFlame, roughness: 0.5, metalness: 0, emissive: CABIN.fireFlame, emissiveIntensity: 3.0, flat: true });
  push({ key: "stovepipe", surfaceClass: "hearth", geom: "cyl", args: [0.28, 0.28, 3.4, 8], position: [sx, 3.6, sz], color: CABIN.woodCocoa, roughness: 0.55, metalness: 0.35, flat: true });
  push({ key: "kettle", surfaceClass: "hearth", geom: "sphere", args: [0.32, 10, 8], position: [sx - 0.5, 2.2, sz], color: CABIN.verdigris, roughness: 0.45, metalness: 0.4, flat: true, jittered: true });
  for (let i = 0; i < 4; i += 1) {
    push({ key: `log-split-${i}`, surfaceClass: "hearth", geom: "cyl", args: [0.16, 0.16, 0.9, 7], position: [sx + 1.15, 0.2 + (i % 2) * 0.34, sz + (i < 2 ? -0.28 : 0.28)], rotation: [Math.PI / 2, 0, i * 0.4], color: i % 2 === 0 ? CABIN.woodHoney : CABIN.leafRust, roughness: 0.85, metalness: 0, flat: true, jittered: true });
  }

  // — Drafting desk (left) with the Storybox (live taste, action #2 "Compose") + craft dressing —
  push({ key: "desk-top", surfaceClass: "desk", geom: "box", args: [3.0, 0.16, 1.5], position: [-2.7, 1.5, -0.4], rotation: [0, 0.22, 0], color: CABIN.woodHoney, roughness: 0.55, metalness: 0.05, flat: true });
  push({ key: "desk-leg-1", surfaceClass: "desk", geom: "box", args: [0.16, 1.5, 0.16], position: [-3.9, 0.75, -0.9], color: CABIN.woodWalnut, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "desk-leg-2", surfaceClass: "desk", geom: "box", args: [0.16, 1.5, 0.16], position: [-1.6, 0.75, 0.05], color: CABIN.woodWalnut, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "stool", surfaceClass: "desk", geom: "cyl", args: [0.4, 0.44, 0.28, 10], position: [-2.6, 1.05, 0.9], color: CABIN.leather, roughness: 0.6, metalness: 0, flat: true });
  push({ key: "stool-leg", surfaceClass: "desk", geom: "cyl", args: [0.34, 0.42, 0.9, 8], position: [-2.6, 0.5, 0.9], color: CABIN.woodOak, roughness: 0.7, metalness: 0, flat: true });
  // The Storybox — a shadow-box diorama that beautifies on contact (action #2 = Compose).
  push({ key: "storybox", surfaceClass: "desk", geom: "box", args: [0.9, 0.7, 0.6], position: [-2.9, 1.9, -0.55], rotation: [0, 0.22, 0], color: CABIN.woodDrift, roughness: 0.5, metalness: 0.05, emissive: ATELIER_HUE, emissiveIntensity: 0.9, flat: true, role: "storybox" });
  push({ key: "brush-jar", surfaceClass: "desk", geom: "cyl", args: [0.16, 0.14, 0.42, 9], position: [-1.9, 1.79, -0.15], color: CABIN.ceramic, roughness: 0.5, metalness: 0.05, flat: true });
  push({ key: "palette-blob", surfaceClass: "desk", geom: "box", args: [0.5, 0.06, 0.34], position: [-2.2, 1.61, 0.15], rotation: [0, 0.4, 0], color: CABIN.parchment, roughness: 0.6, metalness: 0, flat: true, jittered: true });
  push({ key: "sketchbook", surfaceClass: "desk", geom: "box", args: [0.6, 0.08, 0.44], position: [-3.2, 1.62, -0.5], rotation: [0, 0.22, 0.02], color: CABIN.parchment, roughness: 0.7, metalness: 0, flat: true });

  // — Gallery wall (back-center) — framed artifacts, one half-finished frame GLOWING (action #3) —
  const galleryFrames: Array<[number, number, number, number]> = [
    // x, y, w, h
    [-0.4, 3.5, 1.0, 1.3],
    [1.0, 3.7, 0.9, 0.9],
    [0.3, 2.3, 1.1, 0.9],
    [1.6, 2.4, 0.8, 1.1],
  ];
  galleryFrames.forEach(([x, y, w, h], i) => {
    push({ key: `frame-${i}`, surfaceClass: "gallery", geom: "box", args: [w, h, 0.12], position: [x, y, backZ + 0.42], color: CABIN.woodWalnut, roughness: 0.55, metalness: 0.1, flat: true });
    push({ key: `canvas-${i}`, surfaceClass: "gallery", geom: "plane", args: [w - 0.18, h - 0.18], position: [x, y, backZ + 0.5], color: i % 2 === 0 ? CABIN.woolWarm : CABIN.terracotta, roughness: 0.85, metalness: 0, flat: false, jittered: true });
  });
  // The half-finished frame — the "your unfinished thing is still here" glint (action #3 = Explain).
  push({ key: "gallery-hero-frame", surfaceClass: "gallery", geom: "box", args: [1.2, 1.4, 0.14], position: [-1.7, 2.9, backZ + 0.42], color: CABIN.brass, roughness: 0.5, metalness: 0.4, flat: true });
  push({ key: "gallery-hero", surfaceClass: "gallery", geom: "plane", args: [1.0, 1.2], position: [-1.7, 2.9, backZ + 0.52], color: ATELIER_HUE, roughness: 0.6, metalness: 0, emissive: ATELIER_HUE, emissiveIntensity: 0.8, flat: false, role: "gallery-hero" });

  // — The grand easel (foreground-right) — the DOORWAY object: a luminous periwinkle canvas —
  //   action #1 = Build (primary) → "step up to the easel".
  push({ key: "easel-leg-l", surfaceClass: "easel", geom: "box", args: [0.14, 3.4, 0.14], position: [1.7, 1.7, 1.0], rotation: [0, 0, 0.12], color: CABIN.woodOak, roughness: 0.6, metalness: 0, flat: true });
  push({ key: "easel-leg-r", surfaceClass: "easel", geom: "box", args: [0.14, 3.4, 0.14], position: [2.7, 1.7, 1.0], rotation: [0, 0, -0.12], color: CABIN.woodOak, roughness: 0.6, metalness: 0, flat: true });
  push({ key: "easel-leg-back", surfaceClass: "easel", geom: "box", args: [0.14, 3.4, 0.14], position: [2.2, 1.7, 0.4], rotation: [0.2, 0, 0], color: CABIN.woodWalnut, roughness: 0.6, metalness: 0, flat: true });
  push({ key: "easel-tray", surfaceClass: "easel", geom: "box", args: [1.5, 0.14, 0.24], position: [2.2, 1.5, 1.06], color: CABIN.woodHoney, roughness: 0.55, metalness: 0.05, flat: true });
  push({ key: "easel-brace", surfaceClass: "easel", geom: "box", args: [0.5, 0.12, 0.12], position: [2.2, 3.1, 0.7], color: CABIN.brass, roughness: 0.45, metalness: 0.5, flat: true });
  // The canvas — the DOORWAY object (§7.2 / §8.2): a soft LUMINOUS PERIWINKLE PORTAL ("step up to
  //   the easel"). The room's one deliberately-cool accent lands HERE, as the single brightest cool
  //   focal point — emissive ≥1.2 so MaterialEl blooms it + drops tone-mapping. It is the action mesh
  //   (role easel-canvas). The warm sunset brushwork below is only *started* in one corner (the
  //   honest "half-finished" read), leaving most of the portal glowing open + inviting.
  push({ key: "easel-canvas", surfaceClass: "easel", geom: "plane", args: [1.6, 2.0], position: [2.2, 2.5, 1.12], color: ATELIER_HUE, roughness: 0.55, metalness: 0, emissive: ATELIER_HUE, emissiveIntensity: 1.5, flat: false, role: "easel-canvas" });
  push({ key: "easel-canvas-back", surfaceClass: "easel", geom: "box", args: [1.72, 2.12, 0.08], position: [2.2, 2.5, 1.06], color: CABIN.woodDrift, roughness: 0.7, metalness: 0, flat: true });
  // The painting-in-progress ON the portal — a small STARTED Emberwood sunset vignette clustered
  //   lower-left (warm sky → hill → ground + a glowing sun) and one wet periwinkle stroke floating in
  //   the open portal (the cool art accent). Most of the canvas is still glowing periwinkle — the
  //   honest "just begun" read. Opaque, z just toward the camera.
  push({ key: "paint-sky", surfaceClass: "easel", geom: "box", args: [0.62, 0.34, 0.02], position: [1.85, 2.5, 1.15], color: CABIN.candle, roughness: 0.7, metalness: 0, emissive: CABIN.candle, emissiveIntensity: 0.4, flat: true, jittered: true });
  push({ key: "paint-hill", surfaceClass: "easel", geom: "box", args: [0.62, 0.2, 0.02], position: [1.85, 2.27, 1.16], color: CABIN.leafRust, roughness: 0.8, metalness: 0, emissive: CABIN.fireEmber, emissiveIntensity: 0.28, flat: true, jittered: true });
  push({ key: "paint-ground", surfaceClass: "easel", geom: "box", args: [0.62, 0.18, 0.02], position: [1.85, 2.1, 1.16], color: CABIN.terracotta, roughness: 0.85, metalness: 0, emissive: CABIN.fireEmber, emissiveIntensity: 0.32, flat: true });
  push({ key: "paint-sun", surfaceClass: "easel", geom: "sphere", args: [0.1, 10, 8], position: [1.68, 2.6, 1.18], color: CABIN.lantern, roughness: 0.5, metalness: 0, emissive: CABIN.lantern, emissiveIntensity: 1.7, flat: false });
  push({ key: "paint-stroke", surfaceClass: "easel", geom: "box", args: [0.46, 0.11, 0.02], position: [2.5, 2.74, 1.17], rotation: [0, 0, -0.22], color: ATELIER_HUE, roughness: 0.6, metalness: 0, emissive: ATELIER_HUE, emissiveIntensity: 1.3, flat: true, jittered: true });

  // — Floor + wall dressing: rug · potted plants · trailing vine · lanterns · string-lights · mug · blanket · books —
  push({ key: "rug", surfaceClass: "textile", geom: "cyl", args: [2.3, 2.3, 0.05, 20], position: [0.2, 0.06, 1.2], color: CABIN.woolWarm, roughness: 0.95, metalness: 0, flat: true, jittered: true });
  push({ key: "rug-ring", surfaceClass: "textile", geom: "cyl", args: [1.5, 1.5, 0.06, 20], position: [0.2, 0.07, 1.2], color: CABIN.terracotta, roughness: 0.95, metalness: 0, flat: true });
  push({ key: "blanket", surfaceClass: "textile", geom: "box", args: [0.9, 0.2, 0.7], position: [4.9, 0.9, backZ + 2.0], rotation: [0, 0.3, 0], color: CABIN.woolCream, roughness: 0.98, metalness: 0, flat: true });
  push({ key: "plant-pot-1", surfaceClass: "plant", geom: "cyl", args: [0.3, 0.24, 0.42, 9], position: [-4.3, 0.36, 1.6], color: CABIN.terracotta, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "plant-1", surfaceClass: "plant", geom: "cone", args: [0.5, 1.1, 7], position: [-4.3, 1.1, 1.6], color: CABIN.forestPine, roughness: 0.85, metalness: 0, flat: true, jittered: true });
  push({ key: "plant-pot-2", surfaceClass: "plant", geom: "cyl", args: [0.24, 0.2, 0.34, 9], position: [-3.1, 1.75, -0.9], color: CABIN.ceramic, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "plant-2", surfaceClass: "plant", geom: "sphere", args: [0.36, 8, 7], position: [-3.1, 2.2, -0.9], color: CABIN.moss, roughness: 0.85, metalness: 0, flat: true, jittered: true });
  push({ key: "vine", surfaceClass: "plant", geom: "box", args: [0.1, 1.8, 0.1], position: [-5.1, 3.4, -3.0], rotation: [0, 0, 0.15], color: CABIN.forestDeep, roughness: 0.85, metalness: 0, flat: true });
  push({ key: "mug", surfaceClass: "desk", geom: "cyl", args: [0.16, 0.14, 0.28, 10], position: [-2.0, 1.72, 0.4], color: CABIN.ceramic, roughness: 0.5, metalness: 0.05, flat: true, jittered: true });
  push({ key: "books", surfaceClass: "shelf", geom: "box", args: [0.7, 0.5, 0.5], position: [3.6, 2.32, backZ + 1.1], rotation: [0, 0.2, 0], color: CABIN.leather, roughness: 0.7, metalness: 0, flat: true, jittered: true });
  push({ key: "shelf", surfaceClass: "shelf", geom: "box", args: [2.0, 0.12, 0.5], position: [3.9, 2.2, backZ + 0.9], color: CABIN.woodOak, roughness: 0.7, metalness: 0, flat: true });
  // Lanterns + string-lights (emissive practicals — warmth + bloom sparkle, §5.4).
  push({ key: "lantern-1", surfaceClass: "light", geom: "box", args: [0.3, 0.44, 0.3], position: [-4.2, 2.4, -1.4], color: CABIN.brass, roughness: 0.4, metalness: 0.5, emissive: CABIN.lantern, emissiveIntensity: 2.2, flat: true });
  push({ key: "lantern-2", surfaceClass: "light", geom: "box", args: [0.26, 0.38, 0.26], position: [3.0, 3.4, 0.8], color: CABIN.brass, roughness: 0.4, metalness: 0.5, emissive: CABIN.lantern, emissiveIntensity: 2.0, flat: true });
  for (let i = 0; i < 5; i += 1) {
    push({ key: `bulb-${i}`, surfaceClass: "light", geom: "sphere", args: [0.1, 7, 6], position: [-4.2 + i * 1.9, 4.6 - Math.sin(i) * 0.2, backZ + 0.6], color: CABIN.candle, roughness: 0.5, metalness: 0, emissive: CABIN.lantern, emissiveIntensity: 2.4, flat: true, jittered: true });
  }

  // — Life: a sleeping cat on the window sill (human-presence cue, Pillar C) —
  push({ key: "cat-body", surfaceClass: "life", geom: "sphere", args: [0.38, 9, 8], position: [-2.2, 1.65, backZ + 0.5], color: CABIN.woodWalnut, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "cat-head", surfaceClass: "life", geom: "sphere", args: [0.24, 8, 7], position: [-1.75, 1.72, backZ + 0.5], color: CABIN.woodWalnut, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "cat-ear-l", surfaceClass: "life", geom: "cone", args: [0.1, 0.18, 5], position: [-1.66, 1.94, backZ + 0.42], color: CABIN.woodCocoa, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "cat-ear-r", surfaceClass: "life", geom: "cone", args: [0.1, 0.18, 5], position: [-1.66, 1.94, backZ + 0.6], color: CABIN.woodCocoa, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "cat-tail", surfaceClass: "life", geom: "cyl", args: [0.08, 0.06, 0.7, 6], position: [-2.6, 1.6, backZ + 0.62], rotation: [0.4, 0, 1.1], color: CABIN.woodCocoa, roughness: 0.9, metalness: 0, flat: true });

  return {
    camera: { pos: [0.3, 2.4, 7.6], target: [0.4, 2.0, -2.5], fov: 40 },
    shadow: { color: CABIN.duskShadow, opacity: 0.5, scale: 16, blur: 2.6, y: 0.02 },
    lights: [
      { kind: "ambient", color: CABIN.woodCocoa, intensity: 0.42 },
      // Cool dusk-blue skylight over a warm firelight floor bounce → no dead shadow (Pillar B).
      { kind: "hemisphere", color: CABIN.duskSkylight, groundColor: CABIN.terracotta, intensity: 0.62 },
      // Warm key #1: the low raking golden-hour sun through the window.
      { kind: "directional", color: CABIN.candle, intensity: 1.2, position: [-5, 7, 4] },
      // Warm key #2: the wood-stove fire (diegetic heartbeat, non-shadow point light).
      { kind: "point", color: CABIN.fireFlame, intensity: 2.4, position: [4.0, 1.1, backZ + 2.0] },
      // A soft warm bounce off the easel so the doorway reads as the second focal point.
      { kind: "point", color: CABIN.fireSpark, intensity: 0.7, position: [2.2, 2.5, 1.6] },
    ],
    // Procedural IBL colors: warm window (left) + hearth (right) key bands over a cool dusk sky,
    // with a warm terracotta floor bounce below. Baked once via PMREM (world3d/procedural-env.tsx)
    // → the drei <Environment> "reading '0'" crash / blank-canvas race cannot happen.
    env: {
      cool: CABIN.duskSkylight,
      warm: CABIN.candle,
      floor: CABIN.terracotta,
      accentL: CABIN.windowSpill,
      accentR: CABIN.fireFlame,
    },
    shaft: {
      color: CABIN.candle,
      emissive: CABIN.candle,
      // Soft volumetric god-ray, not a hard opaque wedge: low opacity + gentle emissive.
      emissiveIntensity: 1.15,
      opacity: 0.1,
      position: [-2.0, 2.4, backZ + 3.2],
      rotation: [0.5, 0.35, 0.28],
      args: [2.0, 6.2, 1.6],
    },
    motes: { count: 46, color: CABIN.candle, size: 2.4, speed: 0.22, scale: [7, 6, 6] },
    props,
  };
}

// ── §9 hard-floor accounting (consumed by tests + the delta loop) ──────────────
export interface AtelierFloors {
  dressedObjects: number;
  surfaceClasses: number;
  warmSources: number;
  shadowIsBlueViolet: boolean;
  allHuesOnPalette: boolean;
  satin: boolean;
  actionRoles: PropRole[];
}

const isBlueViolet = (hex: string): boolean => {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  // blue-violet: blue leads, red > green (violet lean), and not desaturated gray.
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return b > g && b >= r && max - min > 24;
};

export function measureAtelierFloors(scene: AtelierScene): AtelierFloors {
  const classes = new Set(scene.props.map((p) => p.surfaceClass));
  const warmSources = scene.props.filter(
    (p) => (p.emissiveIntensity ?? 0) > 0.5 && p.emissive !== undefined && WARM_EMISSIVE.has(p.emissive),
  ).length;
  const allHues = scene.props.every(
    (p) => ATELIER_PALETTE.has(p.color) && (p.emissive === undefined || ATELIER_PALETTE.has(p.emissive)),
  );
  const satin = scene.props.every((p) => p.roughness >= 0.4);
  const actionRoles = scene.props
    .filter((p): p is AtelierProp & { role: PropRole } => p.role !== undefined)
    .map((p) => p.role);

  return {
    dressedObjects: scene.props.length,
    surfaceClasses: classes.size,
    warmSources,
    shadowIsBlueViolet: isBlueViolet(scene.shadow.color),
    allHuesOnPalette: allHues,
    satin,
    actionRoles,
  };
}
