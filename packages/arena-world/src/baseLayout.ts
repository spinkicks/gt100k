import { BASE_LAYOUT } from "./baseLayout.fixture";
import type { BasePlacement, CohortBase } from "./model";

export function resolveBaseLayout(base: CohortBase): BasePlacement[] {
  const contributorByFeature = new Map<string, string>();

  for (const { feature, by } of base.contributions) {
    if (!contributorByFeature.has(feature)) contributorByFeature.set(feature, by);
  }

  return base.unlockedFeatures.map((feature, index) => {
    const by = contributorByFeature.get(feature);
    if (by === undefined) {
      throw new Error(`Missing contribution for unlocked base feature: ${feature}`);
    }

    const knownSlot = Object.prototype.hasOwnProperty.call(BASE_LAYOUT, feature)
      ? BASE_LAYOUT[feature as keyof typeof BASE_LAYOUT]
      : undefined;
    const slot = knownSlot ?? {
      zone: "outskirts",
      x: 1024 + ((index % 4) - 2) * 80,
      y: 1200 + Math.floor(index / 4) * 80,
    };

    return { feature, ...slot, by };
  });
}
