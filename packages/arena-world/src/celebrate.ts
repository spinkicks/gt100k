import type { CelebrationEvent, MotionSpec } from "./model";
import { MOTION } from "./motion";

export type LearningMomentSignal =
  | { type: "independent-unlock"; nodeId: string; transferCritical: boolean }
  | { type: "productive-struggle" }
  | { type: "incorrect-attempt" }
  | { type: "help-request" };

export function classifyCelebration(signal: LearningMomentSignal): CelebrationEvent | null {
  switch (signal.type) {
    case "independent-unlock":
      return {
        type: "independent-unlock",
        nodeId: signal.nodeId,
        intensity: signal.transferCritical ? "high" : "medium",
        copyStyle: "process-praise",
      };
    case "productive-struggle":
      return {
        type: "productive-struggle",
        intensity: "low",
        copyStyle: "process-praise",
      };
    case "incorrect-attempt":
    case "help-request":
      return null;
  }
}

const ANIMATED_CELEBRATION_MOTION = {
  high: {
    particleCount: 24,
    durationMs: MOTION.celebrateHigh,
    cameraPunch: true,
    bloomPeak: 1.4,
  },
  medium: {
    particleCount: 12,
    durationMs: MOTION.celebrateMed,
    cameraPunch: false,
    bloomPeak: 1.1,
  },
  low: {
    particleCount: 6,
    durationMs: MOTION.celebrateLow,
    cameraPunch: false,
    bloomPeak: 0.7,
  },
} as const satisfies Record<CelebrationEvent["intensity"], Omit<MotionSpec, "mode">>;

export function celebrationMotionSpec(
  event: CelebrationEvent,
  options: { readonly reducedMotion: boolean },
): MotionSpec {
  if (options.reducedMotion) {
    return {
      mode: "static",
      particleCount: 0,
      durationMs: MOTION.micro,
      cameraPunch: false,
      bloomPeak: 0.7,
    };
  }

  return {
    mode: "animated",
    ...ANIMATED_CELEBRATION_MOTION[event.intensity],
  };
}
