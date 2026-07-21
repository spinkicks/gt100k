/**
 * Deterministic 2D layout (§U8.1, exact) — the calm-tier / reduced-motion / no-WebGL renderer.
 * `x` depends only on `depthRank`; `y` on `orderInRank`. Disconnected islands stack below the DAG
 * from `ISLAND_Y`. No `Math.sin`/`Math.cos`/`Math.random` (§U8.14).
 */
import type { EvidenceGraph } from "@gt100k/evidence-graph";
import type { Bounds2D, Vec2 } from "./model.js";
import { provenanceRanks } from "./ranks.js";

export const LAYOUT_2D = {
  MARGIN_X: 120,
  MARGIN_Y: 120,
  COL_W: 240,
  ROW_H: 160,
  NODE_R: 28,
  ISLAND_Y: 760,
} as const;

export interface Layout2DResult {
  readonly positions: Map<string, Vec2>;
  readonly bounds: Bounds2D;
}

export function layoutExplorer2D(graph: EvidenceGraph): Layout2DResult {
  const { MARGIN_X, MARGIN_Y, COL_W, ROW_H, ISLAND_Y } = LAYOUT_2D;
  const positions = new Map<string, Vec2>();
  let islandIndex = 0;
  let maxX = 0;
  let maxY = 0;

  for (const r of provenanceRanks(graph)) {
    let x: number;
    let y: number;
    if (r.isIsland) {
      x = MARGIN_X; // first island at x = MARGIN_X
      y = ISLAND_Y + islandIndex * ROW_H;
      islandIndex += 1;
    } else {
      x = MARGIN_X + r.depthRank * COL_W;
      y = MARGIN_Y + r.orderInRank * ROW_H;
    }
    positions.set(r.node.id, { x, y });
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return {
    positions,
    bounds: { x: 0, y: 0, width: maxX + MARGIN_X, height: maxY + MARGIN_Y },
  };
}
