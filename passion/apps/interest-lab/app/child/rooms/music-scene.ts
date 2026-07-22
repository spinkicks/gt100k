// "Firelight in the Sounding Cabin" — the Music cabin interior (art bible §7.2 + the cabin-interior
// spec 2026-07-21-cabin-interior-music.md, "The Sounding Cabin").
//
// The value/reference layer on the frozen ZonePlugin.Room3D contract, mirroring atelier-scene.ts: a
// palette-driven, testable DESCRIPTION of the cozy golden-hour music room (geometry + material +
// light data), separated from the r3f render (SoundingCabinRoom.tsx) so the §9 hard floors
// (≥42 dressed objects · ≥8 surface classes · ≥2 warm sources · blue-violet shadow · every hue on
// the §3 palette · satin never plastic) are enforced by fast model-free unit tests. Everything is
// tinted onto the CABIN palette (Pillar A cohesion); firelight/amber is emissive-only (Pillar B).
// No default gray. The one deliberate saturated accent is the terracotta music hue on the DOORWAY
// screen (the single obvious "open the studio" — a warm door, not a cool one like the Atelier's).
//
// THE HERO CALL (§4.1, §9): the piano is WARM SATIN WOOD (honey→walnut upright), never black-lacquer
// plastic. A cottage-parlour instrument, not a concert grand — hold this.

import { CABIN, HUE_RAMP } from "@gt100k/interest-lab-view";

/** Terracotta music identity hue (HUE_RAMP[0]) — the doorway screen glow (the single obvious door). */
export const MUSIC_HUE = HUE_RAMP[0]; // #E8825A

export type PropGeom = "box" | "cyl" | "cone" | "plane" | "sphere";

/** The §3/§8 dressed-object surface classes present in the room. */
export type SurfaceClass =
  | "floor"
  | "wall"
  | "beam"
  | "window"
  | "hearth"
  | "piano"
  | "desk"
  | "hifi"
  | "instrument"
  | "shelf"
  | "light"
  | "plant"
  | "textile"
  | "life";

/**
 * Which prop an interactive action mesh binds to (§6.1 hero + doorway). The 3 sorted zone actions
 * bind in actionId order (m_build → m_debug → m_perform):
 *   [0] m_build (primary) → the console screen → the DOORWAY ("open the studio")
 *   [1] m_debug           → the upright piano  → the HERO live-taste ("play a note")
 *   [2] m_perform         → the turntable      → the listening-corner live delight ("put it on")
 */
export type PropRole = "console-screen" | "piano" | "turntable";

export interface MusicProp {
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
  /** Emissive tint for warm/cool sources (firebox, windows, screen, valves, lanterns). */
  emissive?: string;
  emissiveIntensity?: number;
  /** Low-poly flat shading — the shipped world look (matches Island.tsx). */
  flat: boolean;
  /** Semi-transparent volumes (the golden shaft). */
  opacity?: number;
  /** Bind an interactive action to this prop (§6.1). */
  role?: PropRole;
  /** Per-instance variation was applied (Pillar C anti-clone). */
  jittered?: boolean;
}

export interface MusicLight {
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
  cool: string;
  warm: string;
  floor: string;
  accentL: string;
  accentR: string;
}

export interface MusicScene {
  camera: { pos: readonly [number, number, number]; target: readonly [number, number, number]; fov: number };
  /** Frozen blue-violet contact shadow (§8 ≤1 shadow-caster, Pillar B no dead shadow). */
  shadow: { color: string; opacity: number; scale: number; blur: number; y: number };
  lights: readonly MusicLight[];
  /** Procedural IBL — a warm window + hearth + cool sky, no external HDRI/CDN (r3f pitfall-safe). */
  env: EnvColors;
  /** The hero detail — the golden window shaft carrying dust motes (§4.2, §5). */
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
  props: readonly MusicProp[];
}

// ── palette guards ───────────────────────────────────────────────────────────
/** Every hex used in the room, for the cohesion test (§13.4). */
export const MUSIC_PALETTE: ReadonlySet<string> = new Set<string>([...Object.values(CABIN), MUSIC_HUE]);

const warm = (hex: string): boolean => {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return r > b; // warm sources read red-forward
};

/** Emissive palette values that count as a "warm source" (§8 ≥2). */
const WARM_EMISSIVE: ReadonlySet<string> = new Set<string>(
  [CABIN.fireEmber, CABIN.fireFlame, CABIN.fireSpark, CABIN.lantern, CABIN.windowSpill, CABIN.candle].filter(warm),
);

// ── scene ──────────────────────────────────────────────────────────────────
// Room box (composed frame §2.4: dark cozy foreground → lit stations → luminous window/screen):
//   back wall at z=-6, floor at y=0, camera at z≈7.8 looking to the piano/screen height.
const backZ = -6;

/**
 * Build the full Sounding Cabin scene. Deterministic (index-seeded jitter, no RNG) so tests + the
 * frozen frame are stable. Everything tinted to the CABIN palette; warm glow is emissive-only; the
 * one saturated accent (MUSIC_HUE) lands on the doorway screen.
 */
export function buildMusicScene(): MusicScene {
  const props: MusicProp[] = [];
  const push = (p: MusicProp) => props.push(p);

  // — Shell: floor · log walls · plaster chinking · foreground frame (shared cabin kit §8.1) —
  push({ key: "floor", surfaceClass: "floor", geom: "box", args: [12, 0.3, 14], position: [0, -0.15, -1], color: CABIN.woodOak, roughness: 0.82, metalness: 0, flat: true });
  push({ key: "rug-under", surfaceClass: "floor", geom: "box", args: [5.4, 0.06, 4.2], position: [0, 0.03, 0.6], color: CABIN.woodHoney, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "wall-back", surfaceClass: "wall", geom: "box", args: [12, 6, 0.3], position: [0, 2.7, backZ], color: CABIN.woodWalnut, roughness: 0.88, metalness: 0, flat: true });
  push({ key: "wall-back-chink", surfaceClass: "wall", geom: "box", args: [12, 5.4, 0.16], position: [0, 2.7, backZ + 0.16], color: CABIN.plaster, roughness: 0.94, metalness: 0, flat: true });
  push({ key: "wall-left", surfaceClass: "wall", geom: "box", args: [0.3, 6, 13], position: [-5.4, 2.7, -1], color: CABIN.woodWalnut, roughness: 0.88, metalness: 0, flat: true });
  push({ key: "wall-left-chink", surfaceClass: "wall", geom: "box", args: [0.16, 5.4, 13], position: [-5.24, 2.7, -1], color: CABIN.woodDrift, roughness: 0.94, metalness: 0, flat: true });
  // Warm dark ceiling closing the room box — without it the camera looks up-left into the cream
  // background/fog void (a near-white expanse that breaks the §2.4 dark-cozy-edges composition).
  // Sits ABOVE the exposed beams (y≈5.1) so the timber still reads against it (Ghibli cabin ceiling).
  push({ key: "ceiling", surfaceClass: "beam", geom: "box", args: [12, 0.3, 14], position: [0, 5.75, -1], color: CABIN.woodCocoa, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "wall-right", surfaceClass: "wall", geom: "box", args: [0.3, 6, 13], position: [5.4, 2.7, -1], color: CABIN.woodWalnut, roughness: 0.88, metalness: 0, flat: true });
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
  // Dark cozy FOREGROUND frame (value structure §2.4 — the deepest wood, near the camera top edge).
  push({ key: "fg-beam", surfaceClass: "beam", geom: "box", args: [13, 0.7, 0.7], position: [0, 4.7, 4.4], color: CABIN.woodCocoa, roughness: 0.85, metalness: 0, flat: true });
  push({ key: "fg-post-l", surfaceClass: "beam", geom: "box", args: [0.9, 6.4, 0.7], position: [-5.15, 2.6, 4.3], color: CABIN.woodCocoa, roughness: 0.85, metalness: 0, flat: true });
  push({ key: "fg-post-r", surfaceClass: "beam", geom: "box", args: [0.7, 6, 0.7], position: [5.6, 2.6, 4.2], color: CABIN.woodCocoa, roughness: 0.85, metalness: 0, flat: true });

  // — Window (back center-left, the golden shaft's source) + sill + cool dusk seen through the glass —
  push({ key: "window-frame", surfaceClass: "window", geom: "box", args: [2.9, 3.4, 0.4], position: [-1.4, 3.0, backZ + 0.3], color: CABIN.woodDrift, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "window-glass", surfaceClass: "window", geom: "plane", args: [2.4, 2.9], position: [-1.4, 3.0, backZ + 0.52], color: CABIN.windowSpill, roughness: 0.5, metalness: 0, emissive: CABIN.windowSpill, emissiveIntensity: 0.44, flat: false });
  push({ key: "window-dusk", surfaceClass: "window", geom: "plane", args: [2.4, 1.0], position: [-1.4, 4.05, backZ + 0.5], color: CABIN.duskWindow, roughness: 0.6, metalness: 0, emissive: CABIN.duskSkylight, emissiveIntensity: 0.7, flat: false });
  push({ key: "window-mullion-v", surfaceClass: "window", geom: "box", args: [0.12, 2.9, 0.12], position: [-1.4, 3.0, backZ + 0.55], color: CABIN.woodWalnut, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "window-mullion-h", surfaceClass: "window", geom: "box", args: [2.4, 0.12, 0.12], position: [-1.4, 3.0, backZ + 0.55], color: CABIN.woodWalnut, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "window-sill", surfaceClass: "window", geom: "box", args: [3.3, 0.24, 0.7], position: [-1.4, 1.4, backZ + 0.5], color: CABIN.woodDrift, roughness: 0.8, metalness: 0, flat: true });

  // — Hearth: the wood-stove glowing far back-left (warm key #2 §4.2) + stovepipe · kettle · logs · blanket —
  const hx = -4.2;
  const hz = -3.6;
  push({ key: "stove-body", surfaceClass: "hearth", geom: "box", args: [1.4, 1.9, 1.3], position: [hx, 0.95, hz], color: CABIN.woodCocoa, roughness: 0.6, metalness: 0.25, flat: true });
  push({ key: "stove-top", surfaceClass: "hearth", geom: "cyl", args: [0.86, 0.86, 0.24, 10], position: [hx, 1.95, hz], color: CABIN.woodWalnut, roughness: 0.5, metalness: 0.3, flat: true });
  push({ key: "stove-firebox", surfaceClass: "hearth", geom: "plane", args: [0.9, 0.9], position: [hx + 0.66, 0.8, hz], rotation: [0, Math.PI / 2, 0], color: CABIN.fireEmber, roughness: 0.5, metalness: 0, emissive: CABIN.fireEmber, emissiveIntensity: 3.2, flat: false });
  push({ key: "stove-flame", surfaceClass: "hearth", geom: "cone", args: [0.32, 0.7, 8], position: [hx + 0.55, 0.9, hz], color: CABIN.fireFlame, roughness: 0.5, metalness: 0, emissive: CABIN.fireFlame, emissiveIntensity: 3.0, flat: true });
  push({ key: "stovepipe", surfaceClass: "hearth", geom: "cyl", args: [0.26, 0.26, 3.4, 8], position: [hx, 3.6, hz], color: CABIN.woodCocoa, roughness: 0.55, metalness: 0.35, flat: true });
  push({ key: "kettle", surfaceClass: "hearth", geom: "sphere", args: [0.3, 10, 8], position: [hx - 0.4, 2.2, hz], color: CABIN.verdigris, roughness: 0.45, metalness: 0.4, flat: true, jittered: true });
  for (let i = 0; i < 4; i += 1) {
    push({ key: `log-split-${i}`, surfaceClass: "hearth", geom: "cyl", args: [0.15, 0.15, 0.85, 7], position: [hx, 0.2 + (i % 2) * 0.32, hz + 1.15 + (i < 2 ? -0.24 : 0.24)], rotation: [Math.PI / 2, 0, i * 0.4], color: i % 2 === 0 ? CABIN.woodHoney : CABIN.leafRust, roughness: 0.85, metalness: 0, flat: true, jittered: true });
  }
  push({ key: "blanket", surfaceClass: "textile", geom: "box", args: [0.8, 0.22, 0.6], position: [hx + 1.1, 0.5, hz + 1.4], rotation: [0, 0.3, 0], color: CABIN.woolCream, roughness: 0.98, metalness: 0, flat: true, jittered: true });

  // — The upright PIANO (the HERO station, left third) — WARM SATIN HONEY WOOD, never black gloss
  //   (§4.1). Turned so the keybed faces the camera (the unmistakable "this is a piano" read). —
  const px = -3.0;
  const pz = -0.4;
  const pyaw = 0.34; // gently angled toward camera so the keybed + keys read head-on
  push({ key: "piano-body", surfaceClass: "piano", geom: "box", args: [2.1, 2.5, 0.72], position: [px, 1.25, pz], rotation: [0, pyaw, 0], color: CABIN.woodHoney, roughness: 0.5, metalness: 0.08, flat: true });
  push({ key: "piano-lid", surfaceClass: "piano", geom: "box", args: [2.2, 0.18, 0.86], position: [px + 0.02, 2.56, pz + 0.02], rotation: [0, pyaw, 0], color: CABIN.woodHoney, roughness: 0.42, metalness: 0.12, flat: true });
  // Upper front panel (honey) above the keys; the fascia below the keys is a warmer walnut accent.
  push({ key: "piano-panel", surfaceClass: "piano", geom: "box", args: [2.0, 1.0, 0.14], position: [px + 0.1, 2.02, pz + 0.4], rotation: [0, pyaw, 0], color: CABIN.woodHoney, roughness: 0.48, metalness: 0.1, flat: true });
  push({ key: "piano-fascia", surfaceClass: "piano", geom: "box", args: [2.0, 0.55, 0.14], position: [px + 0.1, 1.02, pz + 0.4], rotation: [0, pyaw, 0], color: CABIN.woodWalnut, roughness: 0.5, metalness: 0.1, flat: true });
  // Keybed (role: piano) — the warm candle-white key strip, tilted slightly up toward the camera and
  //   glowing with a fireSpark key-glow (the tap invite). Wide + bright → the clearest music signal.
  push({ key: "piano-keybed", surfaceClass: "piano", geom: "box", args: [2.0, 0.14, 0.5], position: [px + 0.1, 1.42, pz + 0.5], rotation: [0.16, pyaw, 0], color: CABIN.candle, roughness: 0.5, metalness: 0.05, emissive: CABIN.fireSpark, emissiveIntensity: 0.8, flat: true, role: "piano" });
  push({ key: "piano-keyfront", surfaceClass: "piano", geom: "box", args: [2.0, 0.12, 0.1], position: [px + 0.1, 1.34, pz + 0.72], rotation: [0, pyaw, 0], color: CABIN.woodWalnut, roughness: 0.55, metalness: 0.05, flat: true });
  // A row of black keys (jittered value) sitting on the keybed — Pillar C anti-clone (varied, not a grid).
  for (let i = 0; i < 7; i += 1) {
    const off = (i - 3) * 0.25;
    push({ key: `piano-blackkey-${i}`, surfaceClass: "piano", geom: "box", args: [0.08, 0.07, 0.26], position: [px + 0.1 + off * Math.cos(pyaw), 1.5, pz + 0.42 - off * Math.sin(pyaw)], rotation: [0.16, pyaw, 0], color: CABIN.woodCocoa, roughness: 0.55, metalness: 0.05, flat: true, jittered: true });
  }
  push({ key: "piano-desk", surfaceClass: "piano", geom: "box", args: [1.6, 0.85, 0.08], position: [px + 0.14, 2.5, pz + 0.36], rotation: [0.28, pyaw, 0], color: CABIN.woodWalnut, roughness: 0.5, metalness: 0.08, flat: true });
  push({ key: "sheet-music", surfaceClass: "piano", geom: "box", args: [1.2, 0.72, 0.03], position: [px + 0.12, 2.52, pz + 0.4], rotation: [0.28, pyaw, 0], color: CABIN.parchment, roughness: 0.8, metalness: 0, flat: true, jittered: true });
  push({ key: "sconce-l", surfaceClass: "light", geom: "sphere", args: [0.11, 8, 7], position: [px - 0.9, 2.3, pz + 0.5], color: CABIN.brass, roughness: 0.42, metalness: 0.5, emissive: CABIN.candle, emissiveIntensity: 2.0, flat: true });
  push({ key: "sconce-r", surfaceClass: "light", geom: "sphere", args: [0.11, 8, 7], position: [px + 1.1, 2.3, pz + 0.5], color: CABIN.brass, roughness: 0.42, metalness: 0.5, emissive: CABIN.candle, emissiveIntensity: 1.9, flat: true });
  push({ key: "pedals", surfaceClass: "piano", geom: "box", args: [0.4, 0.08, 0.2], position: [px + 0.1, 0.18, pz + 0.6], rotation: [0, pyaw, 0], color: CABIN.brass, roughness: 0.45, metalness: 0.5, flat: true });
  // The piano stool (knit cushion), pulled out — Biscuit the cat naps on it (life, below).
  push({ key: "stool-seat", surfaceClass: "piano", geom: "cyl", args: [0.42, 0.46, 0.16, 12], position: [px + 0.5, 1.02, pz + 1.9], color: CABIN.woolWarm, roughness: 0.95, metalness: 0, flat: true });
  push({ key: "stool-leg", surfaceClass: "piano", geom: "cyl", args: [0.32, 0.4, 0.9, 8], position: [px + 0.5, 0.5, pz + 1.9], color: CABIN.woodOak, roughness: 0.7, metalness: 0, flat: true });
  // Framed music-score print above the piano.
  push({ key: "piano-print-frame", surfaceClass: "wall", geom: "box", args: [0.9, 1.1, 0.1], position: [px, 3.6, backZ + 0.42], color: CABIN.woodWalnut, roughness: 0.55, metalness: 0.1, flat: true });
  push({ key: "piano-print", surfaceClass: "wall", geom: "plane", args: [0.72, 0.92], position: [px, 3.6, backZ + 0.5], color: CABIN.parchment, roughness: 0.85, metalness: 0, flat: false, jittered: true });

  // — Production desk (center-right, the DOORWAY station) facing the camera —
  const dx = 1.5;
  const dz = 1.2;
  push({ key: "desk-top", surfaceClass: "desk", geom: "box", args: [3.0, 0.16, 1.4], position: [dx, 1.42, dz], color: CABIN.woodOak, roughness: 0.55, metalness: 0.05, flat: true });
  push({ key: "desk-edge", surfaceClass: "desk", geom: "box", args: [3.0, 0.12, 0.18], position: [dx, 1.38, dz + 0.68], color: CABIN.woodCocoa, roughness: 0.6, metalness: 0.05, flat: true });
  push({ key: "desk-leg-1", surfaceClass: "desk", geom: "box", args: [0.16, 1.4, 0.16], position: [dx - 1.3, 0.7, dz + 0.5], color: CABIN.woodWalnut, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "desk-leg-2", surfaceClass: "desk", geom: "box", args: [0.16, 1.4, 0.16], position: [dx + 1.3, 0.7, dz + 0.5], color: CABIN.woodWalnut, roughness: 0.7, metalness: 0, flat: true });
  // The console screen bezel + THE DOORWAY (role: console-screen) — the single brightest, MUSIC_HUE,
  // pulsing emissive focal point ("open the studio"). emissive ≥1.2 → MaterialEl blooms + drops tone-map.
  // Soft radiant halo BEHIND the bezel (larger, dim MUSIC_HUE, tone-mapped) — its rim shows around
  // the monitor so the doorway reads as *radiating* light, not a flat lit rectangle (the "portal"
  // read the Atelier got from cool-in-warm; here it comes from a glow rim on a warm door instead).
  push({ key: "screen-halo", surfaceClass: "light", geom: "plane", args: [2.15, 1.6], position: [dx - 0.1, 2.16, dz - 0.26], color: MUSIC_HUE, roughness: 1, metalness: 0, emissive: MUSIC_HUE, emissiveIntensity: 0.75, flat: false, opacity: 0.6 });
  push({ key: "screen-bezel", surfaceClass: "desk", geom: "box", args: [1.5, 1.05, 0.12], position: [dx - 0.1, 2.15, dz - 0.2], color: CABIN.woodWalnut, roughness: 0.5, metalness: 0.15, flat: true });
  push({ key: "console-screen", surfaceClass: "desk", geom: "plane", args: [1.3, 0.86], position: [dx - 0.1, 2.15, dz - 0.12], color: MUSIC_HUE, roughness: 0.5, metalness: 0, emissive: MUSIC_HUE, emissiveIntensity: 1.5, flat: false, role: "console-screen" });
  // The screen CONTENT: a bright candle equalizer + a waveform baseline → the screen reads as live
  // audio software (the studio you can open), not a blank glowing monitor. Varied bar heights (Pillar
  // C anti-clone). candle @1.4 emissive (≥1.2 → blooms, tone-map off) pops on the terracotta glow.
  for (let i = 0; i < 7; i += 1) {
    const h = 0.16 + ((i * 3 + 1) % 4) * 0.12; // deterministic varied EQ heights
    push({ key: `eq-bar-${i}`, surfaceClass: "desk", geom: "box", args: [0.1, h, 0.02], position: [dx - 0.1 + (i - 3) * 0.16, 1.99 + h / 2, dz - 0.1], color: CABIN.candle, roughness: 0.5, metalness: 0, emissive: CABIN.candle, emissiveIntensity: 1.4, flat: true, jittered: true });
  }
  push({ key: "screen-waveform", surfaceClass: "desk", geom: "box", args: [1.14, 0.05, 0.02], position: [dx - 0.1, 2.4, dz - 0.1], color: CABIN.candle, roughness: 0.5, metalness: 0, emissive: CABIN.candle, emissiveIntensity: 1.3, flat: true });
  push({ key: "screen-stand", surfaceClass: "desk", geom: "box", args: [0.16, 0.5, 0.16], position: [dx - 0.1, 1.66, dz - 0.16], color: CABIN.woodWalnut, roughness: 0.5, metalness: 0.15, flat: true });
  // MIDI keyboard (2-octave) on the desk front — body + a candle key strip.
  push({ key: "midi-body", surfaceClass: "desk", geom: "box", args: [1.4, 0.14, 0.4], position: [dx - 0.1, 1.56, dz + 0.42], color: CABIN.woodWalnut, roughness: 0.55, metalness: 0.1, flat: true });
  push({ key: "midi-keys", surfaceClass: "desk", geom: "box", args: [1.28, 0.06, 0.28], position: [dx - 0.1, 1.63, dz + 0.46], color: CABIN.candle, roughness: 0.5, metalness: 0.05, emissive: CABIN.candle, emissiveIntensity: 0.35, flat: true });
  // Studio monitors (2, flanking the screen) — wood cabinet + dark cone + a fireSpark LED.
  push({ key: "monitor-l", surfaceClass: "desk", geom: "box", args: [0.44, 0.62, 0.4], position: [dx - 1.15, 1.85, dz + 0.1], rotation: [0, 0.3, 0], color: CABIN.woodHoney, roughness: 0.55, metalness: 0.1, flat: true });
  push({ key: "monitor-l-cone", surfaceClass: "desk", geom: "cyl", args: [0.16, 0.13, 0.08, 12], position: [dx - 1.05, 1.82, dz + 0.3], rotation: [Math.PI / 2, 0, 0.3], color: CABIN.woodCocoa, roughness: 0.7, metalness: 0.1, flat: true });
  push({ key: "monitor-r", surfaceClass: "desk", geom: "box", args: [0.44, 0.62, 0.4], position: [dx + 0.95, 1.85, dz + 0.1], rotation: [0, -0.3, 0], color: CABIN.woodHoney, roughness: 0.55, metalness: 0.1, flat: true });
  push({ key: "monitor-r-cone", surfaceClass: "desk", geom: "cyl", args: [0.16, 0.13, 0.08, 12], position: [dx + 0.85, 1.82, dz + 0.3], rotation: [Math.PI / 2, 0, -0.3], color: CABIN.woodCocoa, roughness: 0.7, metalness: 0.1, flat: true });
  push({ key: "monitor-led", surfaceClass: "light", geom: "sphere", args: [0.05, 6, 5], position: [dx + 0.78, 1.66, dz + 0.32], color: CABIN.fireSpark, roughness: 0.5, metalness: 0, emissive: CABIN.fireSpark, emissiveIntensity: 2.2, flat: true });
  // Gooseneck desk lamp (the practical key) — brass arm + a lantern bulb.
  push({ key: "lamp-base", surfaceClass: "light", geom: "cyl", args: [0.16, 0.18, 0.08, 10], position: [dx + 1.4, 1.54, dz + 0.2], color: CABIN.brass, roughness: 0.4, metalness: 0.5, flat: true });
  push({ key: "lamp-arm", surfaceClass: "light", geom: "cyl", args: [0.05, 0.05, 1.1, 8], position: [dx + 1.34, 2.0, dz + 0.1], rotation: [0.5, 0, 0.3], color: CABIN.brass, roughness: 0.4, metalness: 0.5, flat: true });
  push({ key: "lamp-bulb", surfaceClass: "light", geom: "sphere", args: [0.14, 9, 8], position: [dx + 1.0, 2.42, dz - 0.05], color: CABIN.lantern, roughness: 0.4, metalness: 0, emissive: CABIN.lantern, emissiveIntensity: 2.6, flat: true });
  // Pop-filter mic on a boom.
  push({ key: "mic-boom", surfaceClass: "desk", geom: "cyl", args: [0.04, 0.04, 1.3, 8], position: [dx - 1.5, 2.1, dz - 0.1], rotation: [0.4, 0, -0.5], color: CABIN.woodCocoa, roughness: 0.6, metalness: 0.3, flat: true });
  push({ key: "mic-filter", surfaceClass: "desk", geom: "cyl", args: [0.16, 0.16, 0.05, 12], position: [dx - 1.1, 2.35, dz + 0.05], rotation: [0, 0, Math.PI / 2], color: CABIN.plaster, roughness: 0.85, metalness: 0, flat: true });
  // Desk life (foreground): headphones · mug · sticky notes · succulent.
  push({ key: "headphones-band", surfaceClass: "desk", geom: "cyl", args: [0.24, 0.24, 0.06, 12, 1, 1], position: [dx + 0.7, 1.62, dz + 0.5], rotation: [Math.PI / 2, 0, 0], color: CABIN.brass, roughness: 0.5, metalness: 0.4, flat: true });
  push({ key: "headphones-cup", surfaceClass: "desk", geom: "cyl", args: [0.14, 0.14, 0.16, 10], position: [dx + 0.5, 1.56, dz + 0.5], rotation: [0, 0, Math.PI / 2], color: CABIN.leather, roughness: 0.7, metalness: 0, flat: true, jittered: true });
  push({ key: "mug", surfaceClass: "desk", geom: "cyl", args: [0.15, 0.13, 0.26, 10], position: [dx - 0.9, 1.63, dz + 0.5], color: CABIN.ceramic, roughness: 0.5, metalness: 0.05, flat: true, jittered: true });
  push({ key: "sticky-1", surfaceClass: "desk", geom: "box", args: [0.16, 0.02, 0.16], position: [dx + 0.1, 1.51, dz + 0.55], rotation: [0, 0.3, 0], color: CABIN.candle, roughness: 0.8, metalness: 0, flat: true, jittered: true });
  push({ key: "succulent-pot", surfaceClass: "plant", geom: "cyl", args: [0.14, 0.11, 0.18, 9], position: [dx + 1.3, 1.6, dz + 0.4], color: CABIN.ceramic, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "succulent", surfaceClass: "plant", geom: "sphere", args: [0.18, 7, 6], position: [dx + 1.3, 1.78, dz + 0.4], color: CABIN.forestPine, roughness: 0.85, metalness: 0, flat: true, jittered: true });
  // Desk chair, pulled out.
  push({ key: "chair-seat", surfaceClass: "desk", geom: "box", args: [0.5, 0.12, 0.5], position: [dx, 1.0, dz + 2.0], color: CABIN.leather, roughness: 0.65, metalness: 0, flat: true });
  push({ key: "chair-back", surfaceClass: "desk", geom: "box", args: [0.5, 0.7, 0.1], position: [dx, 1.4, dz + 2.24], color: CABIN.woodOak, roughness: 0.7, metalness: 0, flat: true });

  // — Hi-fi listening corner (back-right, vintage soul) — pulled inward so it reads in the wide shot —
  const ex = 3.15;
  const ez = -3.2;
  push({ key: "credenza", surfaceClass: "hifi", geom: "box", args: [2.4, 1.1, 0.9], position: [ex, 0.7, ez], color: CABIN.woodHoney, roughness: 0.5, metalness: 0.1, flat: true });
  push({ key: "receiver", surfaceClass: "hifi", geom: "box", args: [0.9, 0.28, 0.5], position: [ex - 0.5, 1.4, ez], color: CABIN.brass, roughness: 0.5, metalness: 0.45, flat: true });
  push({ key: "receiver-dial", surfaceClass: "hifi", geom: "plane", args: [0.6, 0.14], position: [ex - 0.5, 1.42, ez + 0.26], color: CABIN.candle, roughness: 0.5, metalness: 0, emissive: CABIN.candle, emissiveIntensity: 1.4, flat: false });
  push({ key: "tube-amp", surfaceClass: "hifi", geom: "box", args: [0.7, 0.3, 0.5], position: [ex + 0.5, 1.4, ez], color: CABIN.woodCocoa, roughness: 0.55, metalness: 0.35, flat: true });
  for (let i = 0; i < 3; i += 1) {
    push({ key: `valve-${i}`, surfaceClass: "light", geom: "cyl", args: [0.06, 0.06, 0.22, 8], position: [ex + 0.3 + i * 0.2, 1.62, ez], color: CABIN.fireFlame, roughness: 0.5, metalness: 0, emissive: CABIN.fireFlame, emissiveIntensity: 2.4, flat: true, jittered: true });
  }
  push({ key: "speaker-l", surfaceClass: "hifi", geom: "box", args: [0.6, 1.5, 0.5], position: [ex - 1.5, 0.9, ez + 0.1], color: CABIN.woodWalnut, roughness: 0.55, metalness: 0.08, flat: true });
  push({ key: "speaker-l-grille", surfaceClass: "hifi", geom: "plane", args: [0.48, 1.2], position: [ex - 1.5, 0.95, ez + 0.36], color: CABIN.woolCream, roughness: 0.98, metalness: 0, flat: true });
  push({ key: "speaker-r", surfaceClass: "hifi", geom: "box", args: [0.6, 1.5, 0.5], position: [ex + 1.5, 0.9, ez + 0.1], color: CABIN.woodWalnut, roughness: 0.55, metalness: 0.08, flat: true });
  push({ key: "speaker-r-grille", surfaceClass: "hifi", geom: "plane", args: [0.48, 1.2], position: [ex + 1.5, 0.95, ez + 0.36], color: CABIN.woolCream, roughness: 0.98, metalness: 0, flat: true });
  // Turntable plinth + the record disc (role: turntable) — a live delight, faintly warm, NOT a door.
  push({ key: "turntable-plinth", surfaceClass: "hifi", geom: "box", args: [0.8, 0.16, 0.7], position: [ex, 1.36, ez + 0.1], color: CABIN.woodHoney, roughness: 0.5, metalness: 0.1, flat: true });
  push({ key: "turntable", surfaceClass: "hifi", geom: "cyl", args: [0.34, 0.34, 0.05, 20], position: [ex, 1.47, ez + 0.12], color: CABIN.woodCocoa, roughness: 0.55, metalness: 0.1, emissive: CABIN.fireSpark, emissiveIntensity: 0.4, flat: true, role: "turntable" });
  push({ key: "turntable-label", surfaceClass: "hifi", geom: "cyl", args: [0.1, 0.1, 0.055, 12], position: [ex, 1.48, ez + 0.12], color: CABIN.candle, roughness: 0.6, metalness: 0, flat: true });
  // Brass gramophone horn rising off the credenza (ambient live delight, NOT a role/door).
  push({ key: "horn-neck", surfaceClass: "hifi", geom: "cyl", args: [0.07, 0.07, 0.5, 8], position: [ex + 0.7, 1.7, ez + 0.1], rotation: [0.4, 0, -0.3], color: CABIN.brass, roughness: 0.45, metalness: 0.5, flat: true });
  push({ key: "horn-bell", surfaceClass: "hifi", geom: "cone", args: [0.34, 0.5, 12, 1, 1], position: [ex + 0.95, 2.05, ez + 0.28], rotation: [1.0, 0, -0.3], color: CABIN.brass, roughness: 0.42, metalness: 0.55, flat: true });
  // Crate of vinyl by the credenza (instanced sleeves, jittered).
  for (let i = 0; i < 4; i += 1) {
    const sleeveColor = [CABIN.woolWarm, CABIN.terracotta, CABIN.duskWindow, CABIN.moss][i]!;
    push({ key: `vinyl-${i}`, surfaceClass: "shelf", geom: "box", args: [0.5, 0.5, 0.05], position: [ex - 0.9, 0.4, ez + 0.9 + i * 0.06], rotation: [0.08, 0.1, i * 0.02], color: sleeveColor, roughness: 0.85, metalness: 0, flat: true, jittered: true });
  }
  // Worn leather armchair + floor lamp beside the corner.
  push({ key: "armchair-seat", surfaceClass: "textile", geom: "box", args: [1.0, 0.4, 0.9], position: [ex - 1.2, 0.55, ez + 2.2], rotation: [0, -0.5, 0], color: CABIN.leather, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "armchair-back", surfaceClass: "textile", geom: "box", args: [1.0, 0.9, 0.3], position: [ex - 0.9, 1.0, ez + 2.5], rotation: [0, -0.5, 0], color: CABIN.leather, roughness: 0.7, metalness: 0, flat: true, jittered: true });
  push({ key: "floorlamp-pole", surfaceClass: "light", geom: "cyl", args: [0.05, 0.05, 2.2, 8], position: [ex + 1.3, 1.1, ez + 1.6], color: CABIN.brass, roughness: 0.45, metalness: 0.5, flat: true });
  push({ key: "floorlamp-shade", surfaceClass: "light", geom: "cone", args: [0.34, 0.4, 12, 1, 1], position: [ex + 1.3, 2.3, ez + 1.6], color: CABIN.windowSpill, roughness: 0.6, metalness: 0, emissive: CABIN.windowSpill, emissiveIntensity: 1.8, flat: true });

  // — The instrument wall (upper back wall, center-right) — craft density + legibility. Hung HIGH so
  //   they read clearly above the production desk/screen (guitar/fiddle/frame-drum). —
  push({ key: "guitar-body", surfaceClass: "instrument", geom: "sphere", args: [0.44, 10, 8], position: [-0.2, 3.1, backZ + 0.45], color: CABIN.woodHoney, roughness: 0.5, metalness: 0.05, flat: true });
  push({ key: "guitar-hole", surfaceClass: "instrument", geom: "cyl", args: [0.12, 0.12, 0.04, 12], position: [-0.2, 3.1, backZ + 0.6], rotation: [Math.PI / 2, 0, 0], color: CABIN.woodCocoa, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "guitar-neck", surfaceClass: "instrument", geom: "box", args: [0.14, 1.4, 0.1], position: [-0.2, 4.15, backZ + 0.45], color: CABIN.woodWalnut, roughness: 0.55, metalness: 0.05, flat: true });
  push({ key: "fiddle-body", surfaceClass: "instrument", geom: "sphere", args: [0.28, 9, 7], position: [1.3, 3.5, backZ + 0.45], color: CABIN.woodHoney, roughness: 0.48, metalness: 0.06, flat: true, jittered: true });
  push({ key: "fiddle-neck", surfaceClass: "instrument", geom: "box", args: [0.08, 0.9, 0.08], position: [1.3, 4.15, backZ + 0.45], color: CABIN.woodWalnut, roughness: 0.55, metalness: 0.05, flat: true });
  push({ key: "drum-rim", surfaceClass: "instrument", geom: "cyl", args: [0.44, 0.44, 0.16, 16], position: [2.7, 3.3, backZ + 0.45], rotation: [Math.PI / 2, 0, 0], color: CABIN.woodOak, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "drum-skin", surfaceClass: "instrument", geom: "cyl", args: [0.4, 0.4, 0.02, 16], position: [2.7, 3.3, backZ + 0.54], rotation: [Math.PI / 2, 0, 0], color: CABIN.plaster, roughness: 0.9, metalness: 0, flat: true });

  // — The Shelf (right wall) — vinyl + cassettes (the craft-density shelf) —
  push({ key: "shelf-plank", surfaceClass: "shelf", geom: "box", args: [0.5, 0.12, 2.4], position: [5.2, 2.2, -1.0], color: CABIN.woodOak, roughness: 0.7, metalness: 0, flat: true });
  for (let i = 0; i < 4; i += 1) {
    const sleeveColor = [CABIN.terracotta, CABIN.woolWarm, CABIN.duskWindow, CABIN.brass][i]!;
    push({ key: `shelf-vinyl-${i}`, surfaceClass: "shelf", geom: "box", args: [0.05, 0.5, 0.5], position: [5.1, 2.55, -1.9 + i * 0.56], rotation: [0, 0, i * 0.03], color: sleeveColor, roughness: 0.82, metalness: 0, flat: true, jittered: true });
  }

  // — Floor textiles + rug —
  push({ key: "rug", surfaceClass: "textile", geom: "cyl", args: [2.4, 2.4, 0.05, 20], position: [0.2, 0.06, 1.4], color: CABIN.woolWarm, roughness: 0.95, metalness: 0, flat: true, jittered: true });
  push({ key: "rug-ring", surfaceClass: "textile", geom: "cyl", args: [1.6, 1.6, 0.06, 20], position: [0.2, 0.07, 1.4], color: CABIN.terracotta, roughness: 0.95, metalness: 0, flat: true });

  // — Overhead + air: string-lights · hanging plant · wall lantern —
  for (let i = 0; i < 5; i += 1) {
    push({ key: `bulb-${i}`, surfaceClass: "light", geom: "sphere", args: [0.1, 7, 6], position: [-4.2 + i * 1.9, 4.6 - Math.sin(i) * 0.2, backZ + 0.6], color: CABIN.candle, roughness: 0.5, metalness: 0, emissive: CABIN.lantern, emissiveIntensity: 2.4, flat: true, jittered: true });
  }
  push({ key: "plant-hang-pot", surfaceClass: "plant", geom: "cyl", args: [0.24, 0.18, 0.3, 9], position: [-2.6, 3.4, -1.4], color: CABIN.ceramic, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "plant-hang", surfaceClass: "plant", geom: "sphere", args: [0.4, 8, 7], position: [-2.6, 3.7, -1.4], color: CABIN.forestPine, roughness: 0.85, metalness: 0, flat: true, jittered: true });
  push({ key: "plant-vine", surfaceClass: "plant", geom: "box", args: [0.08, 1.4, 0.08], position: [-2.5, 2.9, -1.4], rotation: [0, 0, 0.15], color: CABIN.moss, roughness: 0.85, metalness: 0, flat: true });
  push({ key: "wall-lantern", surfaceClass: "light", geom: "box", args: [0.26, 0.4, 0.26], position: [4.9, 2.6, backZ + 0.5], color: CABIN.brass, roughness: 0.4, metalness: 0.5, emissive: CABIN.lantern, emissiveIntensity: 2.0, flat: true });

  // — Life: Biscuit the cat asleep on the piano stool (human-presence cue, Pillar C) —
  const cx = px + 0.5;
  const cz = pz + 1.9;
  push({ key: "cat-body", surfaceClass: "life", geom: "sphere", args: [0.34, 9, 8], position: [cx, 1.28, cz], color: CABIN.leafRust, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "cat-head", surfaceClass: "life", geom: "sphere", args: [0.2, 8, 7], position: [cx + 0.34, 1.34, cz - 0.08], color: CABIN.leafRust, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "cat-ear-l", surfaceClass: "life", geom: "cone", args: [0.09, 0.16, 5], position: [cx + 0.3, 1.52, cz - 0.16], color: CABIN.woodCocoa, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "cat-ear-r", surfaceClass: "life", geom: "cone", args: [0.09, 0.16, 5], position: [cx + 0.42, 1.52, cz], color: CABIN.woodCocoa, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "cat-tail", surfaceClass: "life", geom: "cyl", args: [0.07, 0.05, 0.6, 6], position: [cx - 0.3, 1.24, cz + 0.14], rotation: [0.4, 0, 1.1], color: CABIN.woodHoney, roughness: 0.9, metalness: 0, flat: true });

  return {
    camera: { pos: [0.1, 2.62, 8.9], target: [0.2, 1.7, -2.6], fov: 46 },
    shadow: { color: CABIN.duskShadow, opacity: 0.5, scale: 17, blur: 2.6, y: 0.02 },
    lights: [
      { kind: "ambient", color: CABIN.woodCocoa, intensity: 0.42 },
      // Cool dusk-blue skylight over a warm firelight floor bounce → no dead shadow (Pillar B).
      { kind: "hemisphere", color: CABIN.duskSkylight, groundColor: CABIN.terracotta, intensity: 0.62 },
      // Warm key #1: the low raking golden-hour sun through the window (the ≤1 shadow-caster region).
      { kind: "directional", color: CABIN.candle, intensity: 1.08, position: [-4, 7, 4] },
      // Warm key #2: the wood-stove fire (diegetic heartbeat, non-shadow point light).
      { kind: "point", color: CABIN.fireFlame, intensity: 2.4, position: [-3.6, 1.1, hz + 1.4] },
      // A soft warm bounce off the console screen so the doorway reads as the brightest focal point.
      { kind: "point", color: MUSIC_HUE, intensity: 0.9, position: [1.4, 2.1, dz + 0.6] },
    ],
    // Procedural IBL colors: warm window (left) + hi-fi/lamp (right) key bands over a cool dusk sky,
    // with a warm terracotta floor bounce below. Baked once via PMREM (world3d/procedural-env.tsx).
    env: {
      cool: CABIN.duskSkylight,
      warm: CABIN.candle,
      floor: CABIN.terracotta,
      accentL: CABIN.windowSpill,
      accentR: CABIN.lantern,
    },
    shaft: {
      color: CABIN.candle,
      emissive: CABIN.candle,
      // Soft volumetric god-ray raking down-right from the window onto the piano lid + rug.
      emissiveIntensity: 1.08,
      opacity: 0.08,
      position: [-1.2, 2.4, backZ + 3.2],
      rotation: [0.5, -0.15, -0.3],
      args: [1.7, 6.2, 1.6],
    },
    motes: { count: 46, color: CABIN.candle, size: 2.4, speed: 0.22, scale: [7, 6, 6] },
    props,
  };
}

// ── §8 hard-floor accounting (consumed by tests + the delta loop) ──────────────
export interface MusicFloors {
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

export function measureMusicFloors(scene: MusicScene): MusicFloors {
  const classes = new Set(scene.props.map((p) => p.surfaceClass));
  const warmSources = scene.props.filter(
    (p) => (p.emissiveIntensity ?? 0) > 0.5 && p.emissive !== undefined && WARM_EMISSIVE.has(p.emissive),
  ).length;
  const allHues = scene.props.every(
    (p) => MUSIC_PALETTE.has(p.color) && (p.emissive === undefined || MUSIC_PALETTE.has(p.emissive)),
  );
  const satin = scene.props.every((p) => p.roughness >= 0.4);
  const actionRoles = scene.props
    .filter((p): p is MusicProp & { role: PropRole } => p.role !== undefined)
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
