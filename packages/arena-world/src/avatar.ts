import type { AvatarAnimationSpec, AvatarAnimationState } from "./model";
import { EASINGS, MOTION } from "./motion";

const AVATAR_ANIMATIONS = {
  idle: {
    state: "idle",
    loop: true,
    durationMs: MOTION.idleBob,
    easing: EASINGS.loop,
    amplitudePx: 4,
    reducedDurationMs: MOTION.instant,
  },
  walk: {
    state: "walk",
    loop: true,
    durationMs: MOTION.move,
    easing: EASINGS.enter.three,
    amplitudePx: 0,
    reducedDurationMs: MOTION.micro,
  },
  run: {
    state: "run",
    loop: true,
    durationMs: MOTION.runSeg,
    easing: EASINGS.enter.three,
    amplitudePx: 0,
    reducedDurationMs: MOTION.micro,
  },
  think: {
    state: "think",
    loop: false,
    durationMs: MOTION.lantern,
    easing: EASINGS.loop,
    amplitudePx: 3,
    reducedDurationMs: MOTION.instant,
  },
  "celebrate-low": {
    state: "celebrate",
    loop: false,
    durationMs: MOTION.celebrateLow,
    easing: EASINGS.pop,
    amplitudePx: 8,
    reducedDurationMs: MOTION.micro,
  },
  "celebrate-med": {
    state: "celebrate",
    loop: false,
    durationMs: MOTION.celebrateMed,
    easing: EASINGS.pop,
    amplitudePx: 12,
    reducedDurationMs: MOTION.micro,
  },
  "celebrate-high": {
    state: "celebrate",
    loop: false,
    durationMs: MOTION.celebrateHigh,
    easing: EASINGS.pop,
    amplitudePx: 16,
    reducedDurationMs: MOTION.micro,
  },
} as const;

type AvatarAnimationIntent = keyof typeof AVATAR_ANIMATIONS;

export function resolveAvatarAnimation(
  intent: AvatarAnimationIntent,
  options: { readonly reducedMotion: boolean },
): AvatarAnimationSpec {
  const animation = AVATAR_ANIMATIONS[intent];

  if (options.reducedMotion) {
    return {
      state: `${animation.state}-static` as AvatarAnimationState,
      loop: false,
      durationMs: animation.reducedDurationMs,
      easing: EASINGS.linear,
      amplitudePx: 0,
    };
  }

  return {
    state: animation.state,
    loop: animation.loop,
    durationMs: animation.durationMs,
    easing: animation.easing,
    amplitudePx: animation.amplitudePx,
  };
}
