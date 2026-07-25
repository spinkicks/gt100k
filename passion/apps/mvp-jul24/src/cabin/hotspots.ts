import type { Gadget } from "../game/types";

/** Inline positioning style for a gadget's hotspot, anchored by its percentage coords. */
export function hotspotStyle(gadget: Gadget): { left: string; top: string } {
  return { left: `${gadget.hotspot.xPct}%`, top: `${gadget.hotspot.yPct}%` };
}

/**
 * Placement for the static-image cabin, independent of the registry's
 * `hotspot.xPct/yPct` (which the 3D wall anchors also read — see
 * `scene3d/anchors.ts`). These coordinates are tuned against the painted
 * `cabin-math.png` art so each illustrated object visually rests on a frame,
 * shelf, or floor spot instead of floating over the hearth.
 */
const STATIC_POSITIONS: Record<string, { xPct: number; yPct: number }> = {
  nonogram: { xPct: 20, yPct: 45 },
  "logic-grid": { xPct: 21, yPct: 17 },
  mirror: { xPct: 77, yPct: 19 },
  chess: { xPct: 37, yPct: 39 },
  minesweeper: { xPct: 80, yPct: 47 },
  pipes: { xPct: 63, yPct: 39 },
  lits: { xPct: 74, yPct: 78 },
};

/** Inline positioning style for the static cabin, using the static-only placement map. */
export function staticHotspotStyle(gadget: Gadget): { left: string; top: string } {
  const pos = STATIC_POSITIONS[gadget.id] ?? {
    xPct: gadget.hotspot.xPct,
    yPct: gadget.hotspot.yPct,
  };
  return { left: `${pos.xPct}%`, top: `${pos.yPct}%` };
}
