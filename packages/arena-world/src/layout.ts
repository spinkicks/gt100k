import type { QuestWorld, WorldLayout } from "./model";

const REGION_SPACING = 1024;
const NODE_COLS = 3;
const NODE_SPACING = 192;
const NODE_OFFSET = 96;

export function layoutQuestWorld(world: QuestWorld): WorldLayout {
  const nextNodeIndexByRegion = new Map<string, number>();

  return {
    positions: world.nodes.map((node) => {
      const regionIndex = world.regions.indexOf(node.region);
      const nodeIndex = nextNodeIndexByRegion.get(node.region) ?? 0;
      nextNodeIndexByRegion.set(node.region, nodeIndex + 1);

      return {
        nodeId: node.id,
        x:
          (regionIndex % 2) * REGION_SPACING + (nodeIndex % NODE_COLS) * NODE_SPACING + NODE_OFFSET,
        y:
          Math.floor(regionIndex / 2) * REGION_SPACING +
          Math.floor(nodeIndex / NODE_COLS) * NODE_SPACING +
          NODE_OFFSET,
      };
    }),
    bounds: { x: 0, y: 0, width: 2048, height: 2048 },
  };
}
