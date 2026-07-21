import type { MotionToken } from "./model";

export const MOTION = {
  instant: 0,
  press: 120,
  micro: 150,
  fast: 220,
  reveal: 220,
  base: 300,
  zoom: 300,
  sceneFade: 350,
  runSeg: 380,
  celebrateLow: 400,
  move: 600,
  celebrateMed: 600,
  equip: 200,
  celebrateHigh: 800,
  lantern: 900,
  glowLoop: 1200,
  intro: 1200,
  idleBob: 1600,
  particleLife: 800,
  islandFloat: 8000,
  sunDrift: 120000,
} as const;

export const EASINGS = {
  enter: { three: "Cubic.Out", css: "cubic-bezier(0.23,1,0.32,1)" },
  move: { three: "Sine.InOut", css: "cubic-bezier(0.77,0,0.175,1)" },
  pop: "Back.Out",
  press: "Quad.Out",
  loop: "Sine.InOut",
  intro: "Cubic.InOut",
  linear: "Linear",
} as const;

export const LAMBDAS = {
  cameraFollow: 3.5,
  avatarMove: 6,
  avatarTurn: 8,
  beaconRise: 4,
  bloomPulse: 5,
  orbit: 0.08,
} as const;

const MOTION_RESOLUTIONS = {
  press: {
    durationMs: MOTION.press,
    easing: EASINGS.press,
    reducedDurationMs: MOTION.press,
  },
  nodeReveal: {
    durationMs: MOTION.reveal,
    easing: EASINGS.pop,
    reducedDurationMs: MOTION.instant,
  },
  traverse: {
    durationMs: MOTION.move,
    easing: EASINGS.enter.three,
    reducedDurationMs: MOTION.micro,
  },
  run: {
    durationMs: MOTION.runSeg,
    easing: EASINGS.enter.three,
    reducedDurationMs: MOTION.micro,
  },
  regionZoom: {
    durationMs: MOTION.zoom,
    easing: EASINGS.enter.three,
    reducedDurationMs: MOTION.instant,
  },
  intro: {
    durationMs: MOTION.intro,
    easing: EASINGS.intro,
    reducedDurationMs: MOTION.instant,
  },
  availableGlow: {
    durationMs: MOTION.glowLoop,
    easing: EASINGS.loop,
    reducedDurationMs: MOTION.instant,
  },
  tierAdvance: {
    durationMs: MOTION.celebrateMed,
    easing: EASINGS.enter.three,
    reducedDurationMs: MOTION.instant,
  },
  equip: {
    durationMs: MOTION.equip,
    easing: EASINGS.enter.three,
    reducedDurationMs: MOTION.instant,
  },
  drawerOpen: {
    durationMs: MOTION.fast,
    easing: EASINGS.enter.three,
    reducedDurationMs: MOTION.micro,
  },
  sceneTransition: {
    durationMs: MOTION.sceneFade,
    easing: EASINGS.enter.three,
    reducedDurationMs: MOTION.micro,
  },
  baseAccretion: {
    durationMs: MOTION.base,
    easing: EASINGS.pop,
    reducedDurationMs: MOTION.instant,
  },
  standingsExpand: {
    durationMs: MOTION.fast,
    easing: EASINGS.enter.three,
    reducedDurationMs: MOTION.instant,
  },
  onboardBeat: {
    durationMs: MOTION.base,
    easing: EASINGS.enter.three,
    reducedDurationMs: MOTION.instant,
  },
  islandFloat: {
    durationMs: MOTION.islandFloat,
    easing: EASINGS.loop,
    reducedDurationMs: MOTION.instant,
  },
  sunDrift: {
    durationMs: MOTION.sunDrift,
    easing: EASINGS.linear,
    reducedDurationMs: MOTION.instant,
  },
} as const;

export function resolveMotion(
  kind: keyof typeof MOTION_RESOLUTIONS,
  options: { readonly reducedMotion: boolean },
): MotionToken {
  const resolution = MOTION_RESOLUTIONS[kind];

  if (options.reducedMotion) {
    return {
      kind,
      mode: "reduced",
      durationMs: resolution.reducedDurationMs,
      easing: EASINGS.linear,
    };
  }

  return {
    kind,
    mode: "animated",
    durationMs: resolution.durationMs,
    easing: resolution.easing,
  };
}
