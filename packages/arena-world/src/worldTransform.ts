import type { WorldLayout, WorldTransform3D } from "./model";
import { WORLD_SCALE } from "./scene3d";

const SEA_LEVEL = -3;
const NODE_LIFT_UNITS = 0.6;

export function resolveWorldTransform(layout: WorldLayout): WorldTransform3D {
  return {
    nodes: layout.positions.map((position) => ({
      nodeId: position.nodeId,
      x: position.x * WORLD_SCALE,
      y: NODE_LIFT_UNITS,
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
