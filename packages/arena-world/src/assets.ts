import type { AssetKeyRegistry } from "./model";

export type AssetKeyGroup = keyof AssetKeyRegistry;

export interface AssetFallbackDescriptor {
  key: string;
  group: AssetKeyGroup;
  loadOrder: ["committed-model-or-atlas", "procedural"] | ["committed-svg", "procedural"];
  procedural: {
    kind: "mesh-material";
    seed: number;
  };
}

export const ASSET_KEYS = {
  avatar: ["av-body", "av-lantern", "av-hat", "av-cape", "av-badge"],
  nodes: ["node-locked", "node-available", "node-unlocked", "node-beacon"],
  regions: [
    "isle-numbers-coast",
    "isle-tinker-bluffs",
    "isle-story-vale",
    "isle-wordwind-reach",
    "water",
    "bridge",
  ],
  base: [
    "prop-campfire",
    "prop-banner",
    "prop-garden",
    "prop-dock",
    "prop-workshop",
    "prop-lookout",
  ],
  fx: ["fx-mote", "fx-petal", "fx-ribbon", "fx-star"],
  ui: ["ui-lock", "ui-star", "ui-home", "ui-audio", "ui-help"],
} satisfies AssetKeyRegistry;

const ASSET_GROUPS = Object.keys(ASSET_KEYS) as AssetKeyGroup[];

function seedForAsset(key: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < key.length; index += 1) {
    hash = Math.imul(hash ^ key.charCodeAt(index), 16_777_619);
  }

  return hash >>> 0;
}

export function resolveAssetFallback(key: string): AssetFallbackDescriptor {
  const group = ASSET_GROUPS.find((candidate) => ASSET_KEYS[candidate].includes(key));

  if (!group) {
    throw new Error(`Unknown arena asset key: ${key}`);
  }

  return {
    key,
    group,
    loadOrder:
      group === "ui" ? ["committed-svg", "procedural"] : ["committed-model-or-atlas", "procedural"],
    procedural: {
      kind: "mesh-material",
      seed: seedForAsset(key),
    },
  };
}
