import type {
  AvatarState,
  Cosmetic,
  CosmeticEligibility,
  CosmeticRule,
  NodeState,
  ProgressionState,
  QuestWorld,
} from "./model";

export function deriveCosmeticEligibility(
  catalog: readonly Cosmetic[],
  progression: ProgressionState,
  nodeStates: ReadonlyMap<string, NodeState>,
  world: QuestWorld,
): CosmeticEligibility {
  const eligibleIds: string[] = [];
  const lockedIds: string[] = [];

  for (const cosmetic of catalog) {
    const target = ruleIsSatisfied(cosmetic.eligibility, progression, nodeStates, world)
      ? eligibleIds
      : lockedIds;
    target.push(cosmetic.id);
  }

  return { eligibleIds, lockedIds };
}

export function equipCosmetic(
  avatar: AvatarState,
  cosmeticId: string,
  eligibility: CosmeticEligibility,
): AvatarState {
  if (!eligibility.eligibleIds.includes(cosmeticId)) {
    throw new RangeError(`Cosmetic ${cosmeticId} is not eligible`);
  }

  return {
    learnerRef: avatar.learnerRef,
    equipped: avatar.equipped.includes(cosmeticId)
      ? [...avatar.equipped]
      : [...avatar.equipped, cosmeticId],
  };
}

function ruleIsSatisfied(
  rule: CosmeticRule,
  progression: ProgressionState,
  nodeStates: ReadonlyMap<string, NodeState>,
  world: QuestWorld,
): boolean {
  switch (rule.type) {
    case "min-tier":
      return progression.tier.index >= rule.tierIndex;
    case "min-unlocks":
      return (
        world.nodes.filter((node) => nodeStates.get(node.id) === "unlocked").length >= rule.count
      );
    case "region-complete": {
      const regionNodes = world.nodes.filter((node) => node.region === rule.region);
      return (
        regionNodes.length > 0 &&
        regionNodes.every((node) => nodeStates.get(node.id) === "unlocked")
      );
    }
  }
}
