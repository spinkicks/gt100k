import type { Tier } from "./model";

export const TIERS = [
  { index: 0, label: "Spark", minReward: 0 },
  { index: 1, label: "Kindling", minReward: 100 },
  { index: 2, label: "Steady Flame", minReward: 250 },
  { index: 3, label: "Bright Ember", minReward: 500 },
  { index: 4, label: "Beacon", minReward: 900 },
  { index: 5, label: "Lighthouse", minReward: 1500 },
] satisfies Tier[];
