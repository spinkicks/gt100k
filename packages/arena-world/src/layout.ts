import type { QuestWorld, WorldLayout } from "./model";

const NODE_COLS = 3;
const NODE_SPACING = 192;
const NODE_OFFSET = 96;

export function layoutQuestWorld(world: QuestWorld): WorldLayout {
  return {
    positions: world.nodes.map((node, index) => ({
      nodeId: node.id,
      x: NODE_OFFSET + (index % NODE_COLS) * NODE_SPACING,
      y: NODE_OFFSET + Math.floor(index / NODE_COLS) * NODE_SPACING,
    })),
    bounds: { x: 0, y: 0, width: 2048, height: 2048 },
  };
}
