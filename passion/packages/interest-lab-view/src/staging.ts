import type { AgeBand, ChildStaging } from "./model";

const CHILD_STAGING = {
  "6-8": {
    band: "6-8",
    showRawNumbers: false,
    comparisonDefault: "off",
    labelStyle: "story",
    cardScale: 1.25,
    touchTargetPx: 56,
    celebrationCeiling: "medium",
    maxVisibleQuests: 3,
    showProvenanceDetail: false,
    showExplorationMap: false,
    worldCameraMode: "auto-tour",
  },
  "9-11": {
    band: "9-11",
    showRawNumbers: false,
    comparisonDefault: "opt-in",
    labelStyle: "growth",
    cardScale: 1.1,
    touchTargetPx: 48,
    celebrationCeiling: "high",
    maxVisibleQuests: 6,
    showProvenanceDetail: true,
    showExplorationMap: true,
    worldCameraMode: "focus+orbit",
  },
  "12-14": {
    band: "12-14",
    showRawNumbers: true,
    comparisonDefault: "opt-in",
    labelStyle: "full",
    cardScale: 1,
    touchTargetPx: 44,
    celebrationCeiling: "high",
    maxVisibleQuests: "all",
    showProvenanceDetail: true,
    showExplorationMap: true,
    worldCameraMode: "focus+orbit",
  },
} as const satisfies Record<AgeBand, ChildStaging>;

export function resolveChildStaging(band: AgeBand): ChildStaging {
  return { ...CHILD_STAGING[band] };
}
