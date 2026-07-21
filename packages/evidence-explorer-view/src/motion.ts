/**
 * Golden motion tokens (§U8.5, exact) — durations, easings, springs, and the `resolveMotion`
 * table. Every animated row has a first-class reduced-motion equivalent. `resolveMotion` returns
 * the easing *token name* (a key of `EASINGS`); the app maps it to a CSS bezier at render time.
 */
import type { MotionMode, MotionSpec } from "./model.js";

/** Named durations in milliseconds (exact). */
export const MOTION = {
  instant: 0,
  press: 120,
  micro: 150,
  tooltip: 160,
  scrubStep: 180,
  fast: 200,
  reveal: 220,
  panel: 260,
  base: 300,
  zoom: 300,
  edgeDraw: 320,
  node: 360,
  timeline: 400,
  tamper: 400,
  tierCrossfade: 400,
  verifyStep: 420,
  bodyReveal: 520,
  fracture: 520,
  count: 600,
  dofPulse: 700,
  sealForge: 900,
  rootDiverge: 900,
  rootTick: 1200,
  verifyWave: 1800,
  glowLoop: 2200,
  flyIn: 2400,
  ambient: 6000,
  parallaxDrift: 24000,
} as const;

/** Named CSS cubic-bézier easings (exact). */
export const EASINGS = {
  enter: "cubic-bezier(0.23,1,0.32,1)",
  expoOut: "cubic-bezier(0.16,1,0.3,1)",
  move: "cubic-bezier(0.65,0,0.35,1)",
  pop: "cubic-bezier(0.34,1.56,0.64,1)",
  press: "cubic-bezier(0.4,0,0.6,1)",
  drawer: "cubic-bezier(0.32,0.72,0,1)",
  linear: "linear",
} as const;

export type EasingToken = keyof typeof EASINGS;

/** `motion@12` DOM springs + R3F damp lambdas (exact). */
export const SPRINGS = {
  // DOM (motion@12) — critically damped default + a slight-overshoot drag release.
  ui: { type: "spring", bounce: 0, duration: 0.4 },
  flick: { type: "spring", bounce: 0.15, duration: 0.45 },
  // R3F camera/orbit damp lambdas (three MathUtils.damp) + momentum decel.
  cameraDampLambda: 4.0,
  focusDampLambda: 5.0,
  orbitDampLambda: 3.2,
  momentumDecel: 0.998,
} as const;

export type MotionKind =
  | "flyIn"
  | "bodyReveal"
  | "edgeDraw"
  | "threadFlow"
  | "orbit"
  | "zoom"
  | "focus"
  | "nodeHover"
  | "press"
  | "focusMove"
  | "panelOpen"
  | "panelClose"
  | "scrubStep"
  | "verifyWave"
  | "verifyStep"
  | "sealForge"
  | "rootTick"
  | "fracture"
  | "rootDiverge"
  | "tamper"
  | "merkleBuild"
  | "tracePulse"
  | "tierCrossfade"
  | "drawerOpen"
  | "ambient"
  | "parallaxDrift"
  | "hudToggle";

interface MotionRow {
  readonly animatedMs: number;
  readonly animatedEasing: EasingToken;
  readonly reducedMs: number;
}

/** The exact §U8.5 `resolveMotion` table. */
export const RESOLVE_MOTION: Record<MotionKind, MotionRow> = {
  flyIn: { animatedMs: 2400, animatedEasing: "expoOut", reducedMs: 0 },
  bodyReveal: { animatedMs: 520, animatedEasing: "pop", reducedMs: 0 },
  edgeDraw: { animatedMs: 320, animatedEasing: "enter", reducedMs: 0 },
  threadFlow: { animatedMs: 2200, animatedEasing: "linear", reducedMs: 0 },
  orbit: { animatedMs: 0, animatedEasing: "linear", reducedMs: 0 },
  zoom: { animatedMs: 300, animatedEasing: "move", reducedMs: 0 },
  focus: { animatedMs: 700, animatedEasing: "expoOut", reducedMs: 0 },
  nodeHover: { animatedMs: 160, animatedEasing: "enter", reducedMs: 0 },
  press: { animatedMs: 120, animatedEasing: "press", reducedMs: 120 },
  focusMove: { animatedMs: 200, animatedEasing: "move", reducedMs: 0 },
  panelOpen: { animatedMs: 260, animatedEasing: "enter", reducedMs: 150 },
  panelClose: { animatedMs: 200, animatedEasing: "enter", reducedMs: 150 },
  scrubStep: { animatedMs: 180, animatedEasing: "pop", reducedMs: 0 },
  verifyWave: { animatedMs: 1800, animatedEasing: "enter", reducedMs: 0 },
  verifyStep: { animatedMs: 420, animatedEasing: "pop", reducedMs: 0 },
  sealForge: { animatedMs: 900, animatedEasing: "pop", reducedMs: 150 },
  rootTick: { animatedMs: 1200, animatedEasing: "linear", reducedMs: 0 },
  fracture: { animatedMs: 520, animatedEasing: "move", reducedMs: 0 },
  rootDiverge: { animatedMs: 900, animatedEasing: "move", reducedMs: 0 },
  tamper: { animatedMs: 400, animatedEasing: "move", reducedMs: 0 },
  merkleBuild: { animatedMs: 400, animatedEasing: "enter", reducedMs: 0 },
  tracePulse: { animatedMs: 600, animatedEasing: "linear", reducedMs: 0 },
  tierCrossfade: { animatedMs: 400, animatedEasing: "enter", reducedMs: 0 },
  drawerOpen: { animatedMs: 220, animatedEasing: "enter", reducedMs: 150 },
  ambient: { animatedMs: 6000, animatedEasing: "linear", reducedMs: 0 },
  parallaxDrift: { animatedMs: 24000, animatedEasing: "linear", reducedMs: 0 },
  hudToggle: { animatedMs: 0, animatedEasing: "linear", reducedMs: 0 },
};

/** Resolve a named motion for the current reduced-motion state (§U8.5). */
export function resolveMotion(
  kind: MotionKind,
  opts: { reducedMotion: boolean },
): MotionSpec {
  const row = RESOLVE_MOTION[kind];
  const mode: MotionMode = opts.reducedMotion ? "reduced" : "animated";
  return opts.reducedMotion
    ? { kind, mode, durationMs: row.reducedMs, easing: "linear" }
    : { kind, mode, durationMs: row.animatedMs, easing: row.animatedEasing };
}
