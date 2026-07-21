import type { NodeMasterySignal, NodeState, QuestWorld } from "./model";

export function deriveNodeStates(
  world: QuestWorld,
  signals: readonly NodeMasterySignal[],
): Map<string, NodeState> {
  const masteryByNode = new Map(
    signals.map((signal) => [signal.nodeId, signal.masteryCleared] as const),
  );

  return new Map(
    world.nodes.map((node) => {
      const prerequisitesMastered = node.prerequisites.every(
        (nodeId) => masteryByNode.get(nodeId) === true,
      );
      const state: NodeState = !prerequisitesMastered
        ? "locked"
        : masteryByNode.get(node.id) === true
          ? "unlocked"
          : "available";

      return [node.id, state] as const;
    }),
  );
}
