import type { MotionToken } from "./model";

export const MOTION = {
  instant: 0,
  press: 120,
  micro: 150,
  tooltip: 150,
  fast: 200,
  drawer: 220,
  cardEnter: 260,
  matrixCell: 260,
  markerPop: 260,
  base: 300,
  tray: 320,
  stateMorph: 360,
  pick: 420,
  welcomeBack: 480,
  islandFocus: 520,
  ticker: 600,
  constellation: 600,
  timelineDraw: 700,
  driftIn: 1400,
  glowLoop: 1600,
  islandFloat: 6500,
  stagger: 40,
} as const;

export const EASINGS = {
  enter: "cubic-bezier(0.23,1,0.32,1)",
  move: "cubic-bezier(0.77,0,0.175,1)",
  pop: "cubic-bezier(0.34,1.56,0.64,1)",
  press: "cubic-bezier(0.5,0,0.5,1)",
  drawer: "cubic-bezier(0.32,0.72,0,1)",
  linear: "linear",
  pickSpring: {
    type: "spring",
    bounce: 0.2,
    duration: 0.42,
  },
} as const;

const ANIMATED_MOTION = {
  press: { durationMs: MOTION.press, easing: EASINGS.press },
  cardEnter: { durationMs: MOTION.cardEnter, easing: EASINGS.enter },
  cardStagger: { durationMs: MOTION.stagger, easing: EASINGS.enter },
  hoverLift: { durationMs: MOTION.micro, easing: EASINGS.enter },
  pick: { durationMs: MOTION.pick, easing: "pickSpring" },
  welcomeBack: { durationMs: MOTION.welcomeBack, easing: EASINGS.pop },
  promptedRecede: { durationMs: MOTION.base, easing: EASINGS.enter },
  trayReturn: { durationMs: MOTION.tray, easing: EASINGS.enter },
  driftIn: { durationMs: MOTION.driftIn, easing: EASINGS.move },
  islandFloat: { durationMs: MOTION.islandFloat, easing: EASINGS.linear },
  islandFocus: { durationMs: MOTION.islandFocus, easing: EASINGS.move },
  markerGlow: { durationMs: MOTION.glowLoop, easing: EASINGS.linear },
  motes: { durationMs: MOTION.glowLoop, easing: EASINGS.linear },
  matrixCell: { durationMs: MOTION.matrixCell, easing: EASINGS.enter },
  matrixStagger: { durationMs: MOTION.stagger, easing: EASINGS.enter },
  ticker: { durationMs: MOTION.ticker, easing: EASINGS.enter },
  timelineDraw: { durationMs: MOTION.timelineDraw, easing: EASINGS.move },
  markerPop: { durationMs: MOTION.markerPop, easing: EASINGS.pop },
  explanationsReveal: { durationMs: MOTION.base, easing: EASINGS.enter },
  stateMorph: { durationMs: MOTION.stateMorph, easing: EASINGS.move },
  gateCheck: { durationMs: MOTION.fast, easing: EASINGS.pop },
  constellation: { durationMs: MOTION.constellation, easing: EASINGS.enter },
  drawerOpen: { durationMs: MOTION.drawer, easing: EASINGS.drawer },
  tooltip: { durationMs: MOTION.tooltip, easing: EASINGS.enter },
  glowLoop: { durationMs: MOTION.glowLoop, easing: EASINGS.linear },
} as const;

type MotionKind = keyof typeof ANIMATED_MOTION;

const REDUCED_DURATION_MS = {
  press: MOTION.press,
  cardEnter: MOTION.instant,
  cardStagger: MOTION.instant,
  hoverLift: MOTION.instant,
  pick: MOTION.micro,
  welcomeBack: MOTION.instant,
  promptedRecede: MOTION.instant,
  trayReturn: MOTION.micro,
  driftIn: MOTION.instant,
  islandFloat: MOTION.instant,
  islandFocus: MOTION.instant,
  markerGlow: MOTION.instant,
  motes: MOTION.instant,
  matrixCell: MOTION.instant,
  matrixStagger: MOTION.instant,
  ticker: MOTION.instant,
  timelineDraw: MOTION.instant,
  markerPop: MOTION.instant,
  explanationsReveal: MOTION.instant,
  stateMorph: MOTION.instant,
  gateCheck: MOTION.instant,
  constellation: MOTION.instant,
  drawerOpen: MOTION.micro,
  tooltip: MOTION.instant,
  glowLoop: MOTION.instant,
} as const satisfies Record<MotionKind, number>;

export function resolveMotion(
  kind: MotionKind,
  options: Readonly<{ reducedMotion: boolean }>,
): MotionToken {
  if (options.reducedMotion) {
    return {
      kind,
      mode: "reduced",
      durationMs: REDUCED_DURATION_MS[kind],
      easing: EASINGS.linear,
    };
  }

  const token = ANIMATED_MOTION[kind];

  return {
    kind,
    mode: "animated",
    durationMs: token.durationMs,
    easing: token.easing,
  };
}
