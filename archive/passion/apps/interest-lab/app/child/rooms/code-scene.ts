// "The Sunlit Workshop" — the Code cabin interior ("The Tinker Workshop", cabin-interior spec
// 2026-07-21-cabin-interior-code.md + art bible §7 / zone-code-v2).
//
// The value/reference layer on the frozen ZonePlugin.Room3D contract, mirroring music-scene.ts /
// atelier-scene.ts: a palette-driven, testable DESCRIPTION of a cozy golden-hour LOG WORKSHOP where a
// kid codes (geometry + material + light data), separated from the r3f render
// (TinkerWorkshopRoom.tsx) so the hard floors (≥40 dressed objects · ≥6 surface classes · ≥2 warm
// sources · blue-violet shadow · every hue on the §3 palette · satin never plastic) are enforced by
// fast model-free unit tests. Everything is tinted onto the CABIN palette (Pillar A cohesion);
// firelight/amber is emissive-only (Pillar B). No default gray.
//
// THE HERO CALLS (spec §0/§4.1/§6.4, the §11 traps for a code room):
//   • The room reads as CODE in ≤1s: a real, kid-recognizable computer — a warm-bezel monitor
//     glowing with big, colorful, legible code — on a warm honey-wood Coding Desk. NOT a steampunk
//     inventor's shop with no computer.
//   • The screen glows the sage code hue (#5FB98C) + AMBER syntax on a warm-dark bg — NEVER cold blue,
//     NEVER an RGB gamer battlestation. The one cool practical is a tiny verdigris status-LED off the
//     hero (§6.4). The warm/cool split is carried by LIGHT (golden window + stove vs cool dusk fill).
//   • ONE doorway, not two (§4.1): the monitor IS the desk's screen — a single warm-glowing primary.
//     Claude, the keyboard, Sprout are lower, matte, non-competing ambient objects.

import { CABIN, HUE_RAMP, PALETTE } from "@gt100k/interest-lab-view";

/** Sage code identity hue (HUE_RAMP[1]) — the monitor-screen glow (the single obvious door). */
export const CODE_HUE = HUE_RAMP[1]; // #5FB98C
/** Bright mint accent — the plush Python / a syntax "comment" green / Sprout's LED. */
const SPROUT = PALETTE.sprout; // #7BD88F

export type PropGeom = "box" | "cyl" | "cone" | "plane" | "sphere";

/** The §3 dressed-object surface classes present in the room. */
export type SurfaceClass =
  | "floor"
  | "wall"
  | "beam"
  | "window"
  | "hearth"
  | "desk"
  | "screen"
  | "nook"
  | "board"
  | "shelf"
  | "robot"
  | "light"
  | "plant"
  | "textile"
  | "life";

/**
 * Which prop an interactive action mesh binds to (§2.6 hotspots). The 3 sorted zone actions bind in
 * actionId order (c_build → c_debug → c_investigate — alphabetical):
 *   [0] c_build (primary)  → the monitor screen → the DOORWAY ("step up to the desk")
 *   [1] c_debug            → the keyboard/RUN   → the hero live-taste ("run it")
 *   [2] c_investigate      → Sprout the robot   → the block-coding delight ("run the program")
 */
export type PropRole = "monitor-screen" | "keyboard" | "sprout";

export interface CodeProp {
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
  /** Emissive tint for warm/cool sources (firebox, windows, screen, LEDs, lanterns). */
  emissive?: string;
  emissiveIntensity?: number;
  /** Low-poly flat shading — the shipped world look (matches Island.tsx). */
  flat: boolean;
  /** Semi-transparent volumes (the golden shaft, the glass gable). */
  opacity?: number;
  /** Bind an interactive action to this prop (§2.6). */
  role?: PropRole;
  /** Per-instance variation was applied (Pillar C anti-clone). */
  jittered?: boolean;
}

export interface CodeLight {
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

export interface CodeScene {
  camera: { pos: readonly [number, number, number]; target: readonly [number, number, number]; fov: number };
  /** Frozen blue-violet contact shadow (§8 ≤1 shadow-caster, Pillar B no dead shadow). */
  shadow: { color: string; opacity: number; scale: number; blur: number; y: number };
  lights: readonly CodeLight[];
  /** Procedural IBL — a warm window + stove + cool sky, no external HDRI/CDN (r3f pitfall-safe). */
  env: EnvColors;
  /** The hero detail — the golden window shaft carrying dust motes (§2.3, §5). */
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
  props: readonly CodeProp[];
}

// ── palette guards ───────────────────────────────────────────────────────────
/** Every hex used in the room, for the cohesion test (§13.4): CABIN + the sage door hue + mint. */
export const CODE_PALETTE: ReadonlySet<string> = new Set<string>([...Object.values(CABIN), CODE_HUE, SPROUT]);

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
// Room box (composed frame §2.2/§2.4: dark cozy foreground → lit central desk → luminous
// window/monitor): back wall at z=-6, floor at y=0, camera at z≈9 looking at the desk height.
const backZ = -6;

/**
 * Build the full Tinker Workshop scene. Deterministic (index-seeded jitter, no RNG) so tests + the
 * frozen frame are stable. Everything tinted to the CABIN palette; warm glow is emissive-only; the
 * one saturated craft accent (CODE_HUE sage) lands on the doorway monitor.
 */
export function buildCodeScene(): CodeScene {
  const props: CodeProp[] = [];
  const push = (p: CodeProp) => props.push(p);

  // — Shell: floor · log walls · plaster chinking · warm dark ceiling · foreground frame (kit §3.1) —
  push({ key: "floor", surfaceClass: "floor", geom: "box", args: [12, 0.3, 14], position: [0, -0.15, -1], color: CABIN.woodOak, roughness: 0.82, metalness: 0, flat: true });
  push({ key: "wall-back", surfaceClass: "wall", geom: "box", args: [12, 6, 0.3], position: [0, 2.7, backZ], color: CABIN.woodWalnut, roughness: 0.88, metalness: 0, flat: true });
  push({ key: "wall-back-chink", surfaceClass: "wall", geom: "box", args: [12, 5.4, 0.16], position: [0, 2.7, backZ + 0.16], color: CABIN.plaster, roughness: 0.94, metalness: 0, flat: true });
  push({ key: "wall-left", surfaceClass: "wall", geom: "box", args: [0.3, 6, 13], position: [-5.4, 2.7, -1], color: CABIN.woodWalnut, roughness: 0.88, metalness: 0, flat: true });
  // Left-wall chinking kept a shade darker (woodOak, not the lighter woodDrift) so the long left wall
  // doesn't wash pale under the golden key — it holds as a warm mid-value plane (DELTA #2).
  push({ key: "wall-left-chink", surfaceClass: "wall", geom: "box", args: [0.16, 5.4, 13], position: [-5.24, 2.7, -1], color: CABIN.woodOak, roughness: 0.94, metalness: 0, flat: true });
  push({ key: "wall-right", surfaceClass: "wall", geom: "box", args: [0.3, 6, 13], position: [5.4, 2.7, -1], color: CABIN.woodWalnut, roughness: 0.88, metalness: 0, flat: true });
  // Warm dark timber ceiling closing the box (the P-A3 fix — without it the camera looks up into the
  // cream fog void). Sits ABOVE the beams so the timber reads against it (Ghibli cabin ceiling).
  push({ key: "ceiling", surfaceClass: "beam", geom: "box", args: [12, 0.3, 9.4], position: [0, 5.75, -1.4], color: CABIN.woodCocoa, roughness: 0.9, metalness: 0, flat: true });
  // ONE glass greenhouse-gable strip in the ceiling (the "workshop with a glass gable" read) — cool
  // dusk light, LOW emissive so it never blows to white; framed by the timber ridge so it reads as glass.
  push({ key: "gable-glass", surfaceClass: "window", geom: "plane", args: [4.2, 3.2], position: [0.6, 5.55, 2.6], rotation: [Math.PI / 2, 0, 0], color: CABIN.duskWindow, roughness: 0.5, metalness: 0, emissive: CABIN.duskSkylight, emissiveIntensity: 0.5, flat: false, opacity: 0.9 });
  push({ key: "gable-ridge", surfaceClass: "beam", geom: "box", args: [0.4, 0.4, 9], position: [-1.6, 5.5, -1], color: CABIN.woodWalnut, roughness: 0.8, metalness: 0, flat: true });
  // Log courses on the back wall (round beam ends) — meso band, per-instance value jitter.
  for (let i = 0; i < 5; i += 1) {
    const shade = i % 2 === 0 ? CABIN.woodHoney : CABIN.woodOak;
    push({ key: `log-${i}`, surfaceClass: "wall", geom: "cyl", args: [0.34, 0.34, 11.4, 8], position: [0, 0.8 + i * 1.05, backZ + 0.28], rotation: [0, 0, Math.PI / 2], color: shade, roughness: 0.82, metalness: 0, flat: true, jittered: true });
  }
  // Overhead exposed beams (walnut, in shade — read blue-violet under the dusk fill).
  for (let i = 0; i < 4; i += 1) {
    push({ key: `beam-${i}`, surfaceClass: "beam", geom: "box", args: [11.4, 0.42, 0.5], position: [0, 5.1, backZ + 1.4 + i * 2.2], color: CABIN.woodWalnut, roughness: 0.8, metalness: 0, flat: true });
  }
  // Dark cozy FOREGROUND frame (value structure §2.4 — the deepest wood, near the camera top edge).
  push({ key: "fg-beam", surfaceClass: "beam", geom: "box", args: [13, 0.7, 0.7], position: [0, 4.7, 4.4], color: CABIN.woodCocoa, roughness: 0.85, metalness: 0, flat: true });
  push({ key: "fg-post-l", surfaceClass: "beam", geom: "box", args: [0.9, 6.4, 0.7], position: [-5.15, 2.6, 4.3], color: CABIN.woodCocoa, roughness: 0.85, metalness: 0, flat: true });
  push({ key: "fg-post-r", surfaceClass: "beam", geom: "box", args: [0.7, 6, 0.7], position: [5.6, 2.6, 4.2], color: CABIN.woodCocoa, roughness: 0.85, metalness: 0, flat: true });

  // — Window (back center-left, the golden shaft's source) + sill + cool dusk seen through the glass —
  const wx = -2.0;
  push({ key: "window-frame", surfaceClass: "window", geom: "box", args: [2.9, 3.4, 0.4], position: [wx, 3.0, backZ + 0.3], color: CABIN.woodDrift, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "window-glass", surfaceClass: "window", geom: "plane", args: [2.4, 2.9], position: [wx, 3.0, backZ + 0.52], color: CABIN.windowSpill, roughness: 0.5, metalness: 0, emissive: CABIN.windowSpill, emissiveIntensity: 0.5, flat: false });
  push({ key: "window-dusk", surfaceClass: "window", geom: "plane", args: [2.4, 1.0], position: [wx, 4.05, backZ + 0.5], color: CABIN.duskWindow, roughness: 0.6, metalness: 0, emissive: CABIN.duskSkylight, emissiveIntensity: 0.7, flat: false });
  push({ key: "window-mullion-v", surfaceClass: "window", geom: "box", args: [0.12, 2.9, 0.12], position: [wx, 3.0, backZ + 0.55], color: CABIN.woodWalnut, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "window-mullion-h", surfaceClass: "window", geom: "box", args: [2.4, 0.12, 0.12], position: [wx, 3.0, backZ + 0.55], color: CABIN.woodWalnut, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "window-sill", surfaceClass: "window", geom: "box", args: [3.3, 0.24, 0.7], position: [wx, 1.4, backZ + 0.5], color: CABIN.woodDrift, roughness: 0.8, metalness: 0, flat: true });
  // A couple of potted sprouts on the sill (the "logic that grows" motif) + a watering can.
  push({ key: "sill-pot-1", surfaceClass: "plant", geom: "cyl", args: [0.16, 0.13, 0.2, 9], position: [wx - 0.8, 1.62, backZ + 0.5], color: CABIN.terracotta, roughness: 0.75, metalness: 0, flat: true });
  push({ key: "sill-sprout-1", surfaceClass: "plant", geom: "sphere", args: [0.2, 7, 6], position: [wx - 0.8, 1.84, backZ + 0.5], color: CABIN.forestPine, roughness: 0.85, metalness: 0, flat: true, jittered: true });
  push({ key: "sill-can", surfaceClass: "plant", geom: "cyl", args: [0.14, 0.16, 0.22, 8], position: [wx + 0.9, 1.62, backZ + 0.5], color: CABIN.brass, roughness: 0.45, metalness: 0.45, flat: true });

  // — Hearth: the wood-stove glowing far back-right (warm key #2 §2.2) + pipe · kettle · logs · blanket —
  const hx = 4.3;
  const hz = -3.6;
  push({ key: "stove-body", surfaceClass: "hearth", geom: "box", args: [1.4, 1.9, 1.3], position: [hx, 0.95, hz], color: CABIN.woodCocoa, roughness: 0.6, metalness: 0.25, flat: true });
  push({ key: "stove-top", surfaceClass: "hearth", geom: "cyl", args: [0.86, 0.86, 0.24, 10], position: [hx, 1.95, hz], color: CABIN.woodWalnut, roughness: 0.5, metalness: 0.3, flat: true });
  push({ key: "stove-firebox", surfaceClass: "hearth", geom: "plane", args: [0.9, 0.9], position: [hx - 0.66, 0.8, hz], rotation: [0, -Math.PI / 2, 0], color: CABIN.fireEmber, roughness: 0.5, metalness: 0, emissive: CABIN.fireEmber, emissiveIntensity: 3.2, flat: false });
  push({ key: "stove-flame", surfaceClass: "hearth", geom: "cone", args: [0.32, 0.7, 8], position: [hx - 0.55, 0.9, hz], color: CABIN.fireFlame, roughness: 0.5, metalness: 0, emissive: CABIN.fireFlame, emissiveIntensity: 3.0, flat: true });
  push({ key: "stovepipe", surfaceClass: "hearth", geom: "cyl", args: [0.26, 0.26, 3.4, 8], position: [hx, 3.6, hz], color: CABIN.verdigris, roughness: 0.55, metalness: 0.35, flat: true });
  push({ key: "kettle", surfaceClass: "hearth", geom: "sphere", args: [0.3, 10, 8], position: [hx + 0.4, 2.2, hz], color: CABIN.brass, roughness: 0.45, metalness: 0.4, flat: true, jittered: true });
  for (let i = 0; i < 4; i += 1) {
    push({ key: `log-split-${i}`, surfaceClass: "hearth", geom: "cyl", args: [0.15, 0.15, 0.85, 7], position: [hx, 0.2 + (i % 2) * 0.32, hz + 1.15 + (i < 2 ? -0.24 : 0.24)], rotation: [Math.PI / 2, 0, i * 0.4], color: i % 2 === 0 ? CABIN.woodHoney : CABIN.leafRust, roughness: 0.85, metalness: 0, flat: true, jittered: true });
  }
  push({ key: "blanket", surfaceClass: "textile", geom: "box", args: [0.8, 0.22, 0.6], position: [hx - 1.1, 0.5, hz + 1.4], rotation: [0, -0.3, 0], color: CABIN.woolCream, roughness: 0.98, metalness: 0, flat: true, jittered: true });

  // ═══ THE CODING DESK (center — hero + doorway, §4) — a real kid computer on warm honey wood ═══
  const dx = 0;
  const dz = 0.4;
  push({ key: "desk-top", surfaceClass: "desk", geom: "box", args: [3.2, 0.18, 1.5], position: [dx, 1.4, dz], color: CABIN.woodHoney, roughness: 0.5, metalness: 0.05, flat: true });
  push({ key: "desk-edge", surfaceClass: "desk", geom: "box", args: [3.2, 0.12, 0.16], position: [dx, 1.35, dz + 0.75], color: CABIN.woodCocoa, roughness: 0.6, metalness: 0.05, flat: true });
  push({ key: "desk-leg-1", surfaceClass: "desk", geom: "box", args: [0.18, 1.4, 0.18], position: [dx - 1.4, 0.7, dz + 0.55], color: CABIN.woodWalnut, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "desk-leg-2", surfaceClass: "desk", geom: "box", args: [0.18, 1.4, 0.18], position: [dx + 1.4, 0.7, dz + 0.55], color: CABIN.woodWalnut, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "desk-drawer", surfaceClass: "desk", geom: "box", args: [1.0, 0.3, 0.1], position: [dx + 0.8, 1.15, dz + 0.72], color: CABIN.woodOak, roughness: 0.6, metalness: 0.05, flat: true });
  // Soft radiant HALO behind the monitor (larger, dim CODE_HUE, tone-mapped) — its rim shows around
  // the bezel so the doorway reads as *radiating* light, not a flat lit rectangle (the "portal" read).
  push({ key: "screen-halo", surfaceClass: "screen", geom: "plane", args: [2.3, 1.7], position: [dx, 2.18, dz - 0.34], color: CODE_HUE, roughness: 1, metalness: 0, emissive: CODE_HUE, emissiveIntensity: 0.7, flat: false, opacity: 0.55 });
  // The MONITOR — friendly warm-bezel screen; the DOORWAY (role: monitor-screen). A WARM-DARK green
  // editor background (forestDeep) that glows a controlled SAGE (CODE_HUE @0.9, tone-mapped so it
  // reads green, NOT a blown-out cold-cyan slab — the §6.4 trap). The BRIGHT, blooming, legible code
  // lines below sit ON this dark screen (colorful syntax on warm-dark bg = the reference read); the
  // soft halo behind supplies the portal glow rim → the single obvious "step up to the desk" focal.
  push({ key: "screen-bezel", surfaceClass: "desk", geom: "box", args: [1.7, 1.14, 0.12], position: [dx, 2.16, dz - 0.28], color: CABIN.woodDrift, roughness: 0.5, metalness: 0.1, flat: true });
  push({ key: "monitor-screen", surfaceClass: "screen", geom: "plane", args: [1.5, 0.94], position: [dx, 2.16, dz - 0.2], color: CABIN.forestDeep, roughness: 0.5, metalness: 0, emissive: CODE_HUE, emissiveIntensity: 0.9, flat: false, role: "monitor-screen" });
  push({ key: "monitor-stand", surfaceClass: "desk", geom: "box", args: [0.18, 0.5, 0.16], position: [dx, 1.66, dz - 0.24], color: CABIN.woodWalnut, roughness: 0.5, metalness: 0.15, flat: true });
  // The screen CONTENT: big, colorful, LEGIBLE code — indented lines of syntax (keywords sage,
  // strings amber/beacon, functions spark, comments mint-sprout, punctuation parchment). Varied widths
  // + indents (Pillar C anti-clone), each an emissive bar → reads as real code, not a blank monitor.
  const codeLines: Array<{ x: number; w: number; c: string }> = [
    { x: -0.44, w: 0.5, c: CODE_HUE }, // def / keyword
    { x: -0.3, w: 0.62, c: CABIN.lantern }, //   string (indent)
    { x: -0.24, w: 0.5, c: CABIN.fireSpark }, //   for i in ... (indent)
    { x: -0.14, w: 0.44, c: SPROUT }, //     # grows a leaf (comment, deeper indent)
    { x: -0.3, w: 0.36, c: CABIN.parchment }, //   print(...)
  ];
  codeLines.forEach((ln, i) => {
    push({ key: `code-line-${i}`, surfaceClass: "screen", geom: "box", args: [ln.w, 0.09, 0.02], position: [dx + ln.x + ln.w / 2, 2.44 - i * 0.15, dz - 0.13], color: ln.c, roughness: 0.5, metalness: 0, emissive: ln.c, emissiveIntensity: 1.7, flat: true, jittered: true });
  });
  // Blinking amber cursor block at the end of the last line (the "you can type here" invite).
  push({ key: "screen-cursor", surfaceClass: "screen", geom: "box", args: [0.05, 0.09, 0.02], position: [dx + 0.12, 1.84, dz - 0.13], color: CABIN.candle, roughness: 0.5, metalness: 0, emissive: CABIN.candle, emissiveIntensity: 1.6, flat: true });
  // Turtle-graphics OUTPUT — a little sage leaf the `for` loop is drawing (ties to Sprout / "grows").
  push({ key: "screen-leaf", surfaceClass: "screen", geom: "cone", args: [0.12, 0.24, 6], position: [dx + 0.48, 2.06, dz - 0.13], rotation: [0, 0, -0.5], color: SPROUT, roughness: 0.6, metalness: 0, emissive: SPROUT, emissiveIntensity: 1.1, flat: true });
  // Mechanical KEYBOARD (role: keyboard) w/ cream keycaps + one oversized amber RUN key (the "run it"
  // affordance + the brightest brass-warm glint). Bind the body so the whole keyboard region is live.
  push({ key: "keyboard", surfaceClass: "desk", geom: "box", args: [1.4, 0.12, 0.44], position: [dx, 1.52, dz + 0.5], color: CABIN.woodDrift, roughness: 0.55, metalness: 0.1, flat: true, role: "keyboard" });
  // Rows of cream keycaps (jittered value — varied, not a clone grid).
  for (let i = 0; i < 10; i += 1) {
    const col = i - 4.5;
    push({ key: `key-${i}`, surfaceClass: "desk", geom: "box", args: [0.1, 0.06, 0.1], position: [dx + col * 0.13, 1.6, dz + 0.5], color: CABIN.woolCream, roughness: 0.55, metalness: 0.05, flat: true, jittered: true });
  }
  // The oversized amber RUN keycap (brass/spark, emissive glint) — the tactile "run it".
  push({ key: "run-key", surfaceClass: "light", geom: "box", args: [0.28, 0.08, 0.14], position: [dx + 0.5, 1.61, dz + 0.66], color: CABIN.brass, roughness: 0.45, metalness: 0.4, emissive: CABIN.fireSpark, emissiveIntensity: 1.8, flat: true });
  push({ key: "mouse", surfaceClass: "desk", geom: "sphere", args: [0.09, 8, 6], position: [dx + 0.95, 1.53, dz + 0.5], color: CABIN.woodDrift, roughness: 0.55, metalness: 0.05, flat: true, jittered: true });
  // Warm-cased LAPTOP beside the monitor — lid of language stickers, screen of colorful block-code.
  push({ key: "laptop-base", surfaceClass: "desk", geom: "box", args: [0.6, 0.05, 0.42], position: [dx - 1.05, 1.5, dz + 0.28], rotation: [0, 0.35, 0], color: CABIN.ceramic, roughness: 0.5, metalness: 0.15, flat: true });
  push({ key: "laptop-lid", surfaceClass: "desk", geom: "box", args: [0.6, 0.42, 0.04], position: [dx - 1.2, 1.68, dz + 0.12], rotation: [-0.35, 0.35, 0], color: CABIN.ceramic, roughness: 0.5, metalness: 0.15, flat: true });
  push({ key: "laptop-screen", surfaceClass: "screen", geom: "plane", args: [0.5, 0.34], position: [dx - 1.16, 1.68, dz + 0.15], rotation: [-0.35, 0.35, 0], color: CODE_HUE, roughness: 0.5, metalness: 0, emissive: CODE_HUE, emissiveIntensity: 0.9, flat: false });
  // Language stickers on the laptop lid (jittered warm blocks) — Python/JS/HTML/heart.
  const stickerHues = [SPROUT, CABIN.lantern, CABIN.terracotta, CABIN.fireSpark];
  for (let i = 0; i < 4; i += 1) {
    push({ key: `sticker-${i}`, surfaceClass: "desk", geom: "box", args: [0.1, 0.1, 0.01], position: [dx - 1.34 + (i % 2) * 0.22, 1.78 - Math.floor(i / 2) * 0.18, dz + 0.06], rotation: [-0.35, 0.35, i * 0.2], color: stickerHues[i]!, roughness: 0.6, metalness: 0, flat: true, jittered: true });
  }
  // CLAUDE, the friendly AI desk-buddy (a NEW companion — warm amber face, woolCream body; a small,
  // matte, non-competing ambient character — never a second glow competing with the monitor, §4.1).
  push({ key: "claude-body", surfaceClass: "life", geom: "box", args: [0.3, 0.36, 0.24], position: [dx + 1.06, 1.68, dz + 0.16], color: CABIN.woolCream, roughness: 0.85, metalness: 0, flat: true });
  push({ key: "claude-face", surfaceClass: "life", geom: "plane", args: [0.24, 0.2], position: [dx + 1.06, 1.72, dz + 0.29], color: CABIN.candle, roughness: 0.6, metalness: 0, emissive: CABIN.candle, emissiveIntensity: 0.9, flat: false });
  push({ key: "claude-eye-l", surfaceClass: "life", geom: "sphere", args: [0.028, 6, 5], position: [dx + 0.99, 1.74, dz + 0.31], color: CABIN.woodCocoa, roughness: 0.6, metalness: 0, flat: true });
  push({ key: "claude-eye-r", surfaceClass: "life", geom: "sphere", args: [0.028, 6, 5], position: [dx + 1.13, 1.74, dz + 0.31], color: CABIN.woodCocoa, roughness: 0.6, metalness: 0, flat: true });
  push({ key: "claude-smile", surfaceClass: "life", geom: "box", args: [0.08, 0.02, 0.01], position: [dx + 1.06, 1.68, dz + 0.31], color: CABIN.woodCocoa, roughness: 0.6, metalness: 0, flat: true });
  push({ key: "claude-led", surfaceClass: "light", geom: "sphere", args: [0.032, 6, 5], position: [dx + 1.06, 1.88, dz + 0.26], color: SPROUT, roughness: 0.5, metalness: 0, emissive: SPROUT, emissiveIntensity: 1.4, flat: true });
  // Plush Python snake curled by the monitor (language mascot).
  push({ key: "python-coil", surfaceClass: "life", geom: "cyl", args: [0.24, 0.24, 0.08, 12], position: [dx - 0.55, 1.53, dz + 0.28], color: SPROUT, roughness: 0.9, metalness: 0, flat: true, jittered: true });
  push({ key: "python-head", surfaceClass: "life", geom: "sphere", args: [0.1, 8, 6], position: [dx - 0.42, 1.6, dz + 0.36], color: CABIN.forestPine, roughness: 0.9, metalness: 0, flat: true });
  // Warm desk lamp (a warm bench practical) — brass arm + a candle-glow head over the keyboard.
  push({ key: "lamp-base", surfaceClass: "light", geom: "cyl", args: [0.14, 0.16, 0.06, 10], position: [dx + 1.5, 1.51, dz + 0.2], color: CABIN.brass, roughness: 0.4, metalness: 0.5, flat: true });
  push({ key: "lamp-arm", surfaceClass: "light", geom: "cyl", args: [0.04, 0.04, 1.0, 8], position: [dx + 1.42, 1.95, dz + 0.1], rotation: [0.5, 0, 0.35], color: CABIN.brass, roughness: 0.4, metalness: 0.5, flat: true });
  push({ key: "lamp-bulb", surfaceClass: "light", geom: "sphere", args: [0.14, 9, 8], position: [dx + 1.05, 2.34, dz - 0.02], color: CABIN.candle, roughness: 0.4, metalness: 0, emissive: CABIN.lantern, emissiveIntensity: 2.6, flat: true });
  // Desk life (foreground): mug of pens · sticky note · a little potted sprout ("code that grows").
  push({ key: "mug", surfaceClass: "desk", geom: "cyl", args: [0.13, 0.11, 0.24, 10], position: [dx - 1.35, 1.62, dz + 0.5], color: CABIN.ceramic, roughness: 0.5, metalness: 0.05, flat: true, jittered: true });
  for (let i = 0; i < 3; i += 1) {
    push({ key: `pen-${i}`, surfaceClass: "desk", geom: "cyl", args: [0.02, 0.02, 0.26, 6], position: [dx - 1.35 + (i - 1) * 0.04, 1.82, dz + 0.5], rotation: [0.1 * (i - 1), 0, 0.12 * (i - 1)], color: [CABIN.fireSpark, SPROUT, CABIN.lantern][i]!, roughness: 0.5, metalness: 0, flat: true, jittered: true });
  }
  push({ key: "sticky", surfaceClass: "desk", geom: "box", args: [0.14, 0.02, 0.14], position: [dx + 0.55, 1.49, dz + 0.72], rotation: [0, 0.3, 0], color: CABIN.lantern, roughness: 0.8, metalness: 0, flat: true, jittered: true });
  push({ key: "desk-pot", surfaceClass: "plant", geom: "cyl", args: [0.13, 0.1, 0.16, 9], position: [dx + 1.3, 1.56, dz + 0.42], color: CABIN.terracotta, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "desk-sprout", surfaceClass: "plant", geom: "sphere", args: [0.16, 7, 6], position: [dx + 1.3, 1.72, dz + 0.42], color: SPROUT, roughness: 0.85, metalness: 0, flat: true, jittered: true });
  // Worn stool (the "step up here" cue) with a hoodie draped over it.
  push({ key: "stool-seat", surfaceClass: "desk", geom: "cyl", args: [0.36, 0.4, 0.16, 12], position: [dx, 1.02, dz + 1.9], color: CABIN.leather, roughness: 0.65, metalness: 0, flat: true });
  push({ key: "stool-leg", surfaceClass: "desk", geom: "cyl", args: [0.28, 0.36, 0.9, 8], position: [dx, 0.5, dz + 1.9], color: CABIN.woodOak, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "hoodie", surfaceClass: "textile", geom: "box", args: [0.5, 0.3, 0.3], position: [dx - 0.16, 1.2, dz + 2.02], rotation: [0, 0.3, 0.2], color: CABIN.woolWarm, roughness: 0.95, metalness: 0, flat: true, jittered: true });

  // — Sprout & the block-coding toy (left-center foreground, §3.8): a robot a kid programs with
  //   colorful snap-together code blocks (Scratch made physical). Signal-free delight (role: sprout). —
  const sx = -2.6;
  const sz = -1.6;
  push({ key: "maker-mat", surfaceClass: "robot", geom: "box", args: [1.1, 0.4, 0.7], position: [sx, 0.2, sz], color: CABIN.woodHoney, roughness: 0.6, metalness: 0.05, flat: true });
  push({ key: "run-track", surfaceClass: "robot", geom: "box", args: [0.9, 0.03, 0.14], position: [sx, 0.42, sz + 0.05], color: CABIN.woodOak, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "goal-flag", surfaceClass: "robot", geom: "cone", args: [0.08, 0.16, 4], position: [sx + 0.42, 0.56, sz + 0.05], color: CABIN.lantern, roughness: 0.6, metalness: 0, flat: true });
  // Sprout the codeable robot (role: sprout) — woodHoney/ceramic shell, one mint LED eye.
  push({ key: "sprout", surfaceClass: "robot", geom: "box", args: [0.3, 0.3, 0.28], position: [sx - 0.2, 0.6, sz + 0.05], color: CABIN.ceramic, roughness: 0.6, metalness: 0.1, flat: true, role: "sprout" });
  push({ key: "sprout-eye", surfaceClass: "robot", geom: "sphere", args: [0.06, 7, 6], position: [sx - 0.2, 0.66, sz + 0.2], color: SPROUT, roughness: 0.5, metalness: 0, emissive: SPROUT, emissiveIntensity: 1.5, flat: true });
  push({ key: "sprout-antenna", surfaceClass: "robot", geom: "cyl", args: [0.015, 0.015, 0.14, 5], position: [sx - 0.2, 0.82, sz + 0.05], color: CABIN.brass, roughness: 0.45, metalness: 0.5, flat: true });
  push({ key: "sprout-wheel-l", surfaceClass: "robot", geom: "cyl", args: [0.08, 0.08, 0.05, 8], position: [sx - 0.34, 0.48, sz + 0.05], rotation: [Math.PI / 2, 0, 0], color: CABIN.woodCocoa, roughness: 0.7, metalness: 0.1, flat: true });
  push({ key: "sprout-wheel-r", surfaceClass: "robot", geom: "cyl", args: [0.08, 0.08, 0.05, 8], position: [sx - 0.06, 0.48, sz + 0.05], rotation: [Math.PI / 2, 0, 0], color: CABIN.woodCocoa, roughness: 0.7, metalness: 0.1, flat: true });
  // Tray of colorful snap-together code blocks (jittered, warm-tuned).
  const blockHues = [CABIN.fireSpark, SPROUT, CABIN.lantern, CABIN.terracotta, CABIN.verdigris];
  for (let i = 0; i < 5; i += 1) {
    push({ key: `block-${i}`, surfaceClass: "robot", geom: "box", args: [0.16, 0.06, 0.12], position: [sx + 0.12, 0.45 + i * 0.07, sz - 0.28 + (i % 2) * 0.04], rotation: [0, i * 0.12, 0], color: blockHues[i]!, roughness: 0.6, metalness: 0, flat: true, jittered: true });
  }
  // Sprout's charging dock — THE ONE COOL PRACTICAL: a tiny verdigris status-LED (§6.4), off the hero.
  push({ key: "sprout-dock", surfaceClass: "robot", geom: "box", args: [0.16, 0.06, 0.12], position: [sx - 0.2, 0.45, sz - 0.14], color: CABIN.woodDrift, roughness: 0.6, metalness: 0.1, flat: true });
  push({ key: "sprout-dock-led", surfaceClass: "light", geom: "sphere", args: [0.025, 6, 5], position: [sx - 0.2, 0.49, sz - 0.08], color: CABIN.verdigris, roughness: 0.5, metalness: 0, emissive: CABIN.verdigris, emissiveIntensity: 1.2, flat: true });

  // — The language nook / reading corner (left, §3.5) — secondary craft dressing + string-lights —
  push({ key: "bookshelf", surfaceClass: "nook", geom: "box", args: [1.3, 1.4, 0.4], position: [-4.5, 0.7, -1.4], color: CABIN.woodHoney, roughness: 0.6, metalness: 0, flat: true });
  push({ key: "bookshelf-shelf", surfaceClass: "nook", geom: "box", args: [1.3, 0.06, 0.4], position: [-4.5, 1.1, -1.4], color: CABIN.woodOak, roughness: 0.65, metalness: 0, flat: true });
  // The language book set — JS · HTML · CSS · Python · a "Hello, World!" primer (jittered warm covers).
  const bookHues = [CABIN.lantern, CABIN.terracotta, CABIN.forestDeep, SPROUT, CABIN.leather];
  for (let i = 0; i < 5; i += 1) {
    push({ key: `book-${i}`, surfaceClass: "nook", geom: "box", args: [0.06, 0.42, 0.32], position: [-4.9 + i * 0.16, 1.42, -1.4], rotation: [0, 0, i === 4 ? 0.18 : 0], color: bookHues[i]!, roughness: 0.8, metalness: 0, flat: true, jittered: true });
  }
  // Language-mascot desk-toys on the shelf top (a "JS" cube + an "HTML5" shield toy).
  push({ key: "toy-js", surfaceClass: "nook", geom: "box", args: [0.16, 0.16, 0.16], position: [-4.9, 1.9, -1.4], color: CABIN.lantern, roughness: 0.7, metalness: 0, flat: true, jittered: true });
  push({ key: "toy-html", surfaceClass: "nook", geom: "cone", args: [0.12, 0.22, 5], position: [-4.5, 1.94, -1.4], color: CABIN.terracotta, roughness: 0.7, metalness: 0, flat: true, jittered: true });
  push({ key: "zine-stack", surfaceClass: "nook", geom: "box", args: [0.34, 0.14, 0.26], position: [-4.1, 0.78, -1.3], rotation: [0, 0.2, 0], color: CABIN.parchment, roughness: 0.85, metalness: 0, flat: true, jittered: true });
  // Reading cushion / beanbag (the "curl up and read" cue).
  push({ key: "cushion", surfaceClass: "textile", geom: "sphere", args: [0.44, 9, 7], position: [-4.2, 0.4, 0.5], color: CABIN.woolWarm, roughness: 0.96, metalness: 0, flat: true, jittered: true });
  // String of warm bulbs (the light-chain — chases on) draping over the nook + a "hello, world!" pennant.
  for (let i = 0; i < 5; i += 1) {
    push({ key: `bulb-${i}`, surfaceClass: "light", geom: "sphere", args: [0.1, 7, 6], position: [-5.0 + i * 0.62, 3.5 - Math.sin(i) * 0.18, backZ + 0.6], color: CABIN.candle, roughness: 0.5, metalness: 0, emissive: CABIN.lantern, emissiveIntensity: 2.4, flat: true, jittered: true });
  }
  push({ key: "pennant", surfaceClass: "nook", geom: "plane", args: [0.9, 0.5], position: [-5.0, 2.5, -1.5], rotation: [0, 0.3, 0], color: CABIN.parchment, roughness: 0.85, metalness: 0, flat: false, jittered: true });
  // A dark-framed "coding" poster on the left wall (faces into the room) — breaks the long pale left
  // wall with a warm-dark rectangle + a little craft dressing (DELTA #2).
  push({ key: "left-poster-frame", surfaceClass: "board", geom: "box", args: [0.1, 1.3, 1.0], position: [-5.2, 2.5, 0.4], color: CABIN.woodWalnut, roughness: 0.6, metalness: 0.1, flat: true });
  push({ key: "left-poster", surfaceClass: "board", geom: "plane", args: [0.82, 1.06], position: [-5.14, 2.5, 0.4], rotation: [0, Math.PI / 2, 0], color: CABIN.forestDeep, roughness: 0.85, metalness: 0, flat: false, jittered: true });
  push({ key: "left-poster-glyph", surfaceClass: "board", geom: "box", args: [0.02, 0.4, 0.4], position: [-5.12, 2.5, 0.4], rotation: [0, Math.PI / 2, 0.2], color: SPROUT, roughness: 0.7, metalness: 0, flat: true });

  // — The wall of ideas (back, §3.6): chalkboard start→loop→goal · corkboard · the framed Claude portrait —
  push({ key: "chalkboard", surfaceClass: "board", geom: "box", args: [1.5, 1.05, 0.08], position: [2.4, 3.2, backZ + 0.4], color: CABIN.forestDeep, roughness: 0.85, metalness: 0, flat: true });
  // Chalk start→arrow→loop→goal flow-sketch (diegetic foreshadow — a few sage/plaster chalk marks).
  push({ key: "chalk-start", surfaceClass: "board", geom: "sphere", args: [0.09, 7, 6], position: [1.95, 3.3, backZ + 0.46], color: CABIN.plaster, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "chalk-loop", surfaceClass: "board", geom: "cyl", args: [0.14, 0.14, 0.03, 12, 1, 1], position: [2.4, 3.3, backZ + 0.46], rotation: [Math.PI / 2, 0, 0], color: SPROUT, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "chalk-goal", surfaceClass: "board", geom: "cone", args: [0.09, 0.16, 4], position: [2.85, 3.34, backZ + 0.46], color: CABIN.lantern, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "chalk-line", surfaceClass: "board", geom: "box", args: [0.9, 0.02, 0.02], position: [2.4, 3.06, backZ + 0.46], color: CABIN.plaster, roughness: 0.9, metalness: 0, flat: true });
  // The framed Claude illustration ("your AI coding friend") on the log wall, right above the desk.
  push({ key: "claude-portrait-frame", surfaceClass: "board", geom: "box", args: [0.8, 1.0, 0.1], position: [0, 3.7, backZ + 0.42], color: CABIN.brass, roughness: 0.5, metalness: 0.35, flat: true });
  push({ key: "claude-portrait", surfaceClass: "board", geom: "plane", args: [0.64, 0.84], position: [0, 3.7, backZ + 0.5], color: CABIN.candle, roughness: 0.85, metalness: 0, emissive: CABIN.candle, emissiveIntensity: 0.28, flat: false, jittered: true });
  // Corkboard w/ sticky notes + a printed code snippet (center-left of the back wall).
  push({ key: "corkboard", surfaceClass: "board", geom: "box", args: [1.1, 0.8, 0.06], position: [-0.9, 4.2, backZ + 0.4], color: CABIN.woodDrift, roughness: 0.85, metalness: 0, flat: true });
  for (let i = 0; i < 3; i += 1) {
    push({ key: `note-${i}`, surfaceClass: "board", geom: "box", args: [0.2, 0.2, 0.02], position: [-1.2 + i * 0.3, 4.25 - (i % 2) * 0.16, backZ + 0.45], rotation: [0, 0, (i - 1) * 0.1], color: [CABIN.lantern, SPROUT, CABIN.windowSpill][i]!, roughness: 0.85, metalness: 0, flat: true, jittered: true });
  }

  // — The Shelf of creations + manuals (right wall, §3.7) — the diegetic return cue —
  push({ key: "shelf-plank", surfaceClass: "shelf", geom: "box", args: [0.44, 0.12, 2.2], position: [5.15, 2.4, -1.2], color: CABIN.woodOak, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "shelf-plank-2", surfaceClass: "shelf", geom: "box", args: [0.44, 0.12, 2.2], position: [5.15, 1.5, -1.2], color: CABIN.woodOak, roughness: 0.7, metalness: 0, flat: true });
  // Finished creations in slots (a little robot cousin, a pixel-print, a controller toy) + manuals.
  const creationHues = [CABIN.brass, CABIN.terracotta, SPROUT, CABIN.duskWindow];
  for (let i = 0; i < 4; i += 1) {
    push({ key: `creation-${i}`, surfaceClass: "shelf", geom: "box", args: [0.24, 0.28, 0.24], position: [5.1, 2.66, -2.0 + i * 0.5], rotation: [0, i * 0.1, 0], color: creationHues[i]!, roughness: 0.7, metalness: 0.1, flat: true, jittered: true });
  }
  for (let i = 0; i < 4; i += 1) {
    push({ key: `manual-${i}`, surfaceClass: "shelf", geom: "box", args: [0.3, 0.4, 0.05], position: [5.05, 1.76, -2.0 + i * 0.42], rotation: [0, 0, i === 3 ? 0.16 : 0], color: [CABIN.leather, CABIN.terracotta, CABIN.forestDeep, CABIN.woodHoney][i]!, roughness: 0.8, metalness: 0, flat: true, jittered: true });
  }
  push({ key: "shelf-lamp", surfaceClass: "light", geom: "sphere", args: [0.1, 8, 7], position: [4.9, 2.62, -0.4], color: CABIN.brass, roughness: 0.42, metalness: 0.5, emissive: CABIN.lantern, emissiveIntensity: 2.0, flat: true });

  // — Plants / greenhouse warmth (§3.9): a hanging trailing plant + a floor plant —
  push({ key: "plant-hang-pot", surfaceClass: "plant", geom: "cyl", args: [0.22, 0.16, 0.28, 9], position: [2.6, 3.2, -1.2], color: CABIN.ceramic, roughness: 0.7, metalness: 0, flat: true });
  push({ key: "plant-hang", surfaceClass: "plant", geom: "sphere", args: [0.38, 8, 7], position: [2.6, 3.5, -1.2], color: CABIN.forestPine, roughness: 0.85, metalness: 0, flat: true, jittered: true });
  push({ key: "plant-vine", surfaceClass: "plant", geom: "box", args: [0.08, 1.3, 0.08], position: [2.5, 2.75, -1.2], rotation: [0, 0, 0.16], color: CABIN.moss, roughness: 0.85, metalness: 0, flat: true });
  push({ key: "floor-plant-pot", surfaceClass: "plant", geom: "cyl", args: [0.28, 0.22, 0.4, 10], position: [-4.6, 0.2, 1.6], color: CABIN.terracotta, roughness: 0.75, metalness: 0, flat: true });
  push({ key: "floor-plant", surfaceClass: "plant", geom: "sphere", args: [0.42, 8, 7], position: [-4.6, 0.6, 1.6], color: CABIN.forestPine, roughness: 0.85, metalness: 0, flat: true, jittered: true });

  // — Floor textiles + the foreground cable crate (§3.10) —
  push({ key: "rug", surfaceClass: "textile", geom: "cyl", args: [2.5, 2.5, 0.05, 22], position: [0.1, 0.06, 1.4], color: CABIN.woolWarm, roughness: 0.95, metalness: 0, flat: true, jittered: true });
  push({ key: "rug-ring", surfaceClass: "textile", geom: "cyl", args: [1.7, 1.7, 0.06, 22], position: [0.1, 0.07, 1.4], color: CABIN.terracotta, roughness: 0.95, metalness: 0, flat: true });
  push({ key: "crate", surfaceClass: "textile", geom: "box", args: [0.7, 0.6, 0.6], position: [-4.4, 0.3, 2.6], rotation: [0, 0.4, 0], color: CABIN.woodDrift, roughness: 0.7, metalness: 0.05, flat: true, jittered: true });
  push({ key: "crate-cable", surfaceClass: "textile", geom: "cyl", args: [0.18, 0.18, 0.12, 10, 1, 1], position: [-4.4, 0.66, 2.6], rotation: [Math.PI / 2, 0, 0], color: CABIN.leather, roughness: 0.75, metalness: 0, flat: true });

  // — Life: Biscuit the cat asleep on the sunny sill (human-presence cue, Pillar C) —
  const cx = wx + 1.3;
  const cz = backZ + 0.5;
  push({ key: "cat-body", surfaceClass: "life", geom: "sphere", args: [0.32, 9, 8], position: [cx, 1.72, cz], color: CABIN.leafRust, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "cat-head", surfaceClass: "life", geom: "sphere", args: [0.19, 8, 7], position: [cx + 0.32, 1.78, cz + 0.02], color: CABIN.leafRust, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "cat-ear-l", surfaceClass: "life", geom: "cone", args: [0.08, 0.15, 5], position: [cx + 0.28, 1.94, cz], color: CABIN.woodCocoa, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "cat-ear-r", surfaceClass: "life", geom: "cone", args: [0.08, 0.15, 5], position: [cx + 0.4, 1.94, cz], color: CABIN.woodCocoa, roughness: 0.9, metalness: 0, flat: true });
  push({ key: "cat-tail", surfaceClass: "life", geom: "cyl", args: [0.06, 0.045, 0.55, 6], position: [cx - 0.28, 1.68, cz + 0.12], rotation: [0.4, 0, 1.1], color: CABIN.woodHoney, roughness: 0.9, metalness: 0, flat: true });

  return {
    camera: { pos: [0.1, 2.72, 9.1], target: [0, 1.7, -1.2], fov: 46 },
    shadow: { color: CABIN.duskShadow, opacity: 0.5, scale: 17, blur: 2.6, y: 0.02 },
    lights: [
      { kind: "ambient", color: CABIN.woodCocoa, intensity: 0.42 },
      // Cool dusk-blue skylight (window + glass gable) over a warm firelight floor bounce → no dead shadow.
      { kind: "hemisphere", color: CABIN.duskSkylight, groundColor: CABIN.terracotta, intensity: 0.62 },
      // Warm key #1: the low raking golden-hour sun through the window (the ≤1 shadow-caster region).
      { kind: "directional", color: CABIN.candle, intensity: 1.08, position: [-4, 7, 4] },
      // Warm key #2: the wood-stove fire (diegetic heartbeat, non-shadow point light).
      { kind: "point", color: CABIN.fireFlame, intensity: 2.4, position: [3.7, 1.1, hz + 1.4] },
      // A soft sage bounce off the monitor so the doorway reads as the brightest focal point.
      { kind: "point", color: CODE_HUE, intensity: 0.8, position: [0, 2.1, dz + 0.8] },
    ],
    // Procedural IBL colors: warm window (left) + stove/lamp (right) key bands over a cool dusk sky,
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
      // Soft volumetric god-ray raking down-LEFT from the window onto the rug + desk edge — shifted
      // left + softened so it no longer bisects the monitor face (DELTA #3).
      emissiveIntensity: 1.0,
      opacity: 0.06,
      position: [-2.4, 2.4, backZ + 3.6],
      rotation: [0.5, -0.1, -0.34],
      args: [1.7, 6.4, 1.6],
    },
    motes: { count: 46, color: CABIN.candle, size: 2.4, speed: 0.22, scale: [7, 6, 6] },
    props,
  };
}

// ── §8 hard-floor accounting (consumed by tests + the delta loop) ──────────────
export interface CodeFloors {
  dressedObjects: number;
  surfaceClasses: number;
  warmSources: number;
  shadowIsBlueViolet: boolean;
  allHuesOnPalette: boolean;
  satin: boolean;
  noColdBlueScreen: boolean;
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

/** A cold-blue screen (the §11/§6.4 code-room trap): a screen prop whose emissive is blue-dominant. */
const isColdBlue = (hex: string): boolean => {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return b > r && b > g; // blue leads both → a cold screen glow
};

export function measureCodeFloors(scene: CodeScene): CodeFloors {
  const classes = new Set(scene.props.map((p) => p.surfaceClass));
  const warmSources = scene.props.filter(
    (p) => (p.emissiveIntensity ?? 0) > 0.5 && p.emissive !== undefined && WARM_EMISSIVE.has(p.emissive),
  ).length;
  const allHues = scene.props.every(
    (p) => CODE_PALETTE.has(p.color) && (p.emissive === undefined || CODE_PALETTE.has(p.emissive)),
  );
  const satin = scene.props.every((p) => p.roughness >= 0.4);
  // No screen surface glows cold blue — the sage door hue + amber syntax only (§6.4). The one cool
  // practical (the verdigris dock-LED) is a "light", not a "screen", so it never trips this.
  const noColdBlueScreen = scene.props
    .filter((p) => p.surfaceClass === "screen")
    .every((p) => !(p.emissive !== undefined && isColdBlue(p.emissive)) && !isColdBlue(p.color));
  const actionRoles = scene.props
    .filter((p): p is CodeProp & { role: PropRole } => p.role !== undefined)
    .map((p) => p.role);

  return {
    dressedObjects: scene.props.length,
    surfaceClasses: classes.size,
    warmSources,
    shadowIsBlueViolet: isBlueViolet(scene.shadow.color),
    allHuesOnPalette: allHues,
    satin,
    noColdBlueScreen,
    actionRoles,
  };
}
