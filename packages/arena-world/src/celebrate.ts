import type { CelebrationEvent } from "./model";

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
