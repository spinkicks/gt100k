import type { NodeMasterySignal, ProgressionState, QuestWorld, Tier } from "./model";
import { deriveNodeStates } from "./nodes";

export function tierForReward(reward: number, tierTable: readonly Tier[]): Tier {
  let selected: Tier | undefined;

  for (const tier of tierTable) {
    if (tier.minReward <= reward && (!selected || tier.minReward > selected.minReward)) {
      selected = tier;
    }
  }

  if (!selected) throw new RangeError(`No tier is eligible for reward ${reward}`);
  return { ...selected };
}

export function computeProgression(
  world: QuestWorld,
  signals: readonly NodeMasterySignal[],
  tierTable: readonly Tier[],
  previousReward = 0,
): ProgressionState {
  const nodeStates = deriveNodeStates(world, signals);
  const signalByNode = new Map(signals.map((signal) => [signal.nodeId, signal] as const));
  const unlockedNodes = world.nodes.filter((node) => nodeStates.get(node.id) === "unlocked");
  const cumulativeIndependenceReward = unlockedNodes.reduce(
    (total, node) => total + (signalByNode.get(node.id)?.independenceReward ?? 0),
    0,
  );

  return {
    cumulativeIndependenceReward,
    masteredCount: unlockedNodes.length,
    regionsComplete: world.regions.filter((region) =>
      world.nodes
        .filter((node) => node.region === region)
        .every((node) => nodeStates.get(node.id) === "unlocked"),
    ),
    tier: tierForReward(cumulativeIndependenceReward, tierTable),
    growthVsPast: {
      previous: previousReward,
      current: cumulativeIndependenceReward,
      delta: cumulativeIndependenceReward - previousReward,
    },
  };
}
