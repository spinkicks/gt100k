import type { AgeBand, ProgressionState, RewardRepresentation } from "./model";

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

export function resolveRewardRepresentation(
  ageBand: AgeBand,
  _progression: ProgressionState,
): RewardRepresentation {
  return {
    band: ageBand,
    ...REWARD_REPRESENTATIONS[ageBand],
  };
}
