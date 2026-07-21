import type { NodeMasterySignal } from "./model";

const S1_FEED = [
  { nodeId: "count-cove", masteryCleared: true, independenceReward: 60 },
  { nodeId: "add-atoll", masteryCleared: true, independenceReward: 80 },
  { nodeId: "place-value-point", masteryCleared: false, independenceReward: 0 },
  { nodeId: "observe-overlook", masteryCleared: true, independenceReward: 50 },
  { nodeId: "measure-mesa", masteryCleared: true, independenceReward: 110 },
  { nodeId: "phoneme-falls", masteryCleared: false, independenceReward: 0 },
] satisfies readonly NodeMasterySignal[];

export function createSyntheticMasteryFeed(): readonly NodeMasterySignal[] {
  return S1_FEED.map((signal) => ({ ...signal }));
}
