import type { AssetKeyRegistry } from "./model";

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
