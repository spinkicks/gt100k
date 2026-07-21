export const MOTION = {
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

export const EASINGS = {
  enter: "cubic-bezier(0.23,1,0.32,1)",
  move: "cubic-bezier(0.65,0,0.35,1)",
  settle: "cubic-bezier(0.34,1.4,0.64,1)",
  press: "cubic-bezier(0.4,0,0.6,1)",
  loop: "cubic-bezier(0.45,0,0.55,1)",
  rollback: "cubic-bezier(0.32,0.72,0,1)",
  linear: "linear",
} as const;

type EasingName = keyof typeof EASINGS;

const MOTION_ROWS = {
  cameraEase: { durationMs: MOTION.pulse, easing: "move", reducedMs: MOTION.instant },
  panelEnter: { durationMs: MOTION.panel, easing: "enter", reducedMs: MOTION.micro },
  ambientDrift: {
    durationMs: MOTION.ambientDrift,
    easing: "linear",
    reducedMs: MOTION.instant,
  },
  compile: { durationMs: MOTION.compile, easing: "settle", reducedMs: MOTION.instant },
  badgeSatisfied: { durationMs: MOTION.reveal, easing: "settle", reducedMs: MOTION.instant },
  floorHalo: { durationMs: MOTION.pulse, easing: "loop", reducedMs: MOTION.instant },
  memberSwap: { durationMs: MOTION.settle, easing: "move", reducedMs: MOTION.instant },
  rollback: { durationMs: MOTION.rollback, easing: "rollback", reducedMs: MOTION.instant },
  standingsBar: { durationMs: MOTION.standings, easing: "enter", reducedMs: MOTION.instant },
  gainCelebrate: { durationMs: MOTION.reveal, easing: "settle", reducedMs: MOTION.instant },
  turnPulse: { durationMs: MOTION.pulse, easing: "loop", reducedMs: MOTION.instant },
  interruptionArc: { durationMs: MOTION.fast, easing: "move", reducedMs: MOTION.instant },
  dominanceRing: { durationMs: MOTION.standings, easing: "enter", reducedMs: MOTION.instant },
  suppressVeil: { durationMs: MOTION.base, easing: "enter", reducedMs: MOTION.base },
  safeguardSweep: { durationMs: MOTION.base, easing: "enter", reducedMs: MOTION.instant },
  press: { durationMs: MOTION.press, easing: "press", reducedMs: MOTION.press },
  cardEnter: { durationMs: MOTION.reveal, easing: "enter", reducedMs: MOTION.instant },
  drawerOpen: { durationMs: MOTION.fast, easing: "enter", reducedMs: MOTION.micro },
  hudToggle: { durationMs: MOTION.instant, easing: "linear", reducedMs: MOTION.instant },
} as const satisfies Record<
  string,
  { readonly durationMs: number; readonly easing: EasingName; readonly reducedMs: number }
>;

export type MotionKind = keyof typeof MOTION_ROWS;

export const MOTION_KINDS = Object.freeze(Object.keys(MOTION_ROWS)) as readonly MotionKind[];

export interface MotionSpec {
  readonly kind: MotionKind;
  readonly mode: "animated" | "reduced";
  readonly durationMs: number;
  readonly easing: EasingName;
}

export function resolveMotion(
  kind: MotionKind,
  options: { readonly reducedMotion: boolean },
): MotionSpec {
  const row = MOTION_ROWS[kind];

  if (options.reducedMotion) {
    return {
      kind,
      mode: "reduced",
      durationMs: row.reducedMs,
      easing: "linear",
    };
  }

  return {
    kind,
    mode: "animated",
    durationMs: row.durationMs,
    easing: row.easing,
  };
}
