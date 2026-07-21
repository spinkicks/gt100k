import type { AgeBand, ProgressionState, RewardRepresentation, VisualBand } from "./model";

const REWARD_REPRESENTATIONS = {
  "6-8": {
    headline: "concrete-marker",
    currencyLabel: "I did it myself!",
    showRawNumber: false,
    comparisonDefault: "off",
    failureCopy: "Let's try that one again — you've got this.",
  },
  "9-11": {
    headline: "growth-vs-past",
    currencyLabel: "You vs. past-you",
    showRawNumber: false,
    comparisonDefault: "opt-in",
    failureCopy: "Not yet — here's one thing to try.",
  },
  "12-14": {
    headline: "mastery-delta",
    currencyLabel: "Independence reward",
    showRawNumber: true,
    comparisonDefault: "opt-in",
    failureCopy: "Here's the specific step that trips it — pick your next move.",
  },
} as const satisfies Record<AgeBand, Omit<RewardRepresentation, "band">>;

const VISUAL_BANDS = {
  "6-8": {
    showCanvasNumbers: false,
    labelStyle: "story",
    markerScale: 1.25,
    touchTargetPx: 56,
    celebrationCeiling: "medium",
    comparisonVisibleDefault: false,
  },
  "9-11": {
    showCanvasNumbers: false,
    labelStyle: "growth",
    markerScale: 1.1,
    touchTargetPx: 48,
    celebrationCeiling: "high",
    comparisonVisibleDefault: false,
  },
  "12-14": {
    showCanvasNumbers: true,
    labelStyle: "numeric",
    markerScale: 1,
    touchTargetPx: 44,
    celebrationCeiling: "high",
    comparisonVisibleDefault: false,
  },
} as const satisfies Record<AgeBand, VisualBand>;

export function resolveRewardRepresentation(
  ageBand: AgeBand,
  _progression: ProgressionState,
): RewardRepresentation {
  return {
    band: ageBand,
    ...REWARD_REPRESENTATIONS[ageBand],
  };
}

export function resolveVisualBand(ageBand: AgeBand): VisualBand {
  return { ...VISUAL_BANDS[ageBand] };
}
