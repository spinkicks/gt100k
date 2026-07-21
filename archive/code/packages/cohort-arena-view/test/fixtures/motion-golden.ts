import type { MotionKind, MotionSpec } from "../../src/index.js";

interface MotionGoldenRow {
  readonly durationMs: number;
  readonly easing: MotionSpec["easing"];
  readonly reducedMs: number;
}

const motion = {
  instant: 0,
  press: 120,
  micro: 150,
  fast: 200,
  reveal: 240,
  base: 300,
  panel: 320,
  standings: 420,
  settle: 520,
  rollback: 600,
  tickerRoll: 600,
  compile: 900,
  pulse: 1200,
  ambientDrift: 9000,
} as const;

const easings = {
  enter: "cubic-bezier(0.23,1,0.32,1)",
  move: "cubic-bezier(0.65,0,0.35,1)",
  settle: "cubic-bezier(0.34,1.4,0.64,1)",
  press: "cubic-bezier(0.4,0,0.6,1)",
  loop: "cubic-bezier(0.45,0,0.55,1)",
  rollback: "cubic-bezier(0.32,0.72,0,1)",
  linear: "linear",
} as const satisfies Record<MotionSpec["easing"], string>;

const rows = {
  cameraEase: { durationMs: 1200, easing: "move", reducedMs: 0 },
  panelEnter: { durationMs: 320, easing: "enter", reducedMs: 150 },
  ambientDrift: { durationMs: 9000, easing: "linear", reducedMs: 0 },
  compile: { durationMs: 900, easing: "settle", reducedMs: 0 },
  badgeSatisfied: { durationMs: 240, easing: "settle", reducedMs: 0 },
  floorHalo: { durationMs: 1200, easing: "loop", reducedMs: 0 },
  memberSwap: { durationMs: 520, easing: "move", reducedMs: 0 },
  rollback: { durationMs: 600, easing: "rollback", reducedMs: 0 },
  standingsBar: { durationMs: 420, easing: "enter", reducedMs: 0 },
  gainCelebrate: { durationMs: 240, easing: "settle", reducedMs: 0 },
  turnPulse: { durationMs: 1200, easing: "loop", reducedMs: 0 },
  interruptionArc: { durationMs: 200, easing: "move", reducedMs: 0 },
  dominanceRing: { durationMs: 420, easing: "enter", reducedMs: 0 },
  suppressVeil: { durationMs: 300, easing: "enter", reducedMs: 300 },
  safeguardSweep: { durationMs: 300, easing: "enter", reducedMs: 0 },
  press: { durationMs: 120, easing: "press", reducedMs: 120 },
  cardEnter: { durationMs: 240, easing: "enter", reducedMs: 0 },
  drawerOpen: { durationMs: 200, easing: "enter", reducedMs: 150 },
  hudToggle: { durationMs: 0, easing: "linear", reducedMs: 0 },
} as const satisfies Record<MotionKind, MotionGoldenRow>;

export const motionGolden = { motion, easings, rows };
