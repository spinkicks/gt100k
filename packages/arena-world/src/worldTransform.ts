import { BIOMES } from "./biomes.fixture";
import type { WorldLayout, WorldTransform3D } from "./model";
import { WORLD_SCALE } from "./scene3d";

const SEA_LEVEL = -3;
const NODE_LIFT_UNITS = 0.6;
const REGION_COLUMNS = 2;
const REGION_ROWS = 2;

function resolvePositionElevation(
  layout: WorldLayout,
  position: WorldLayout["positions"][number],
): number {
  const regionWidth = layout.bounds.width / REGION_COLUMNS;
  const regionHeight = layout.bounds.height / REGION_ROWS;
  const column = Math.floor((position.x - layout.bounds.x) / regionWidth);
  const row = Math.floor((position.y - layout.bounds.y) / regionHeight);
  const biome = BIOMES[row * REGION_COLUMNS + column];

  if (!biome) {
    throw new Error(`Position for node ${position.nodeId} is outside the world bounds`);
  }

  return biome.elevation;
}

function addExact(left: number, right: number): number {
  return Number((left + right).toFixed(10));
}

export function resolveWorldTransform(layout: WorldLayout): WorldTransform3D {
  return {
    nodes: layout.positions.map((position) => ({
      nodeId: position.nodeId,
      x: position.x * WORLD_SCALE,
      y: addExact(resolvePositionElevation(layout, position), NODE_LIFT_UNITS),
      z: position.y * WORLD_SCALE,
    })),
    worldScale: WORLD_SCALE,
    seaLevel: SEA_LEVEL,
    bounds3D: {
      size: layout.bounds.width * WORLD_SCALE,
      center: {
        x: (layout.bounds.x + layout.bounds.width / 2) * WORLD_SCALE,
        y: 0,
        z: (layout.bounds.y + layout.bounds.height / 2) * WORLD_SCALE,
      },
    },
  };
}
