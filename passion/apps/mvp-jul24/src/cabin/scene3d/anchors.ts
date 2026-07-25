import { gadgetsForTopic } from "../../gadgets/registry";
import type { Gadget, TopicId } from "../../game/types";

export interface GadgetAnchor {
  id: string;
  label: string;
  status: Gadget["status"];
  /** World-space [x, y, z] position (metres), just in front of the back wall. */
  position: readonly [number, number, number];
}

/** Back-wall inner face sits just in front of ROOM.backZ (see scene3d/Room.tsx). */
const ANCHOR_Z = -2.8;

// Markers are kept within the fixed camera's frame: at z=-2.8 with the camera at
// [0, 1.5, 4] and fov=60, the visible half-width/half-height is ~tan(30deg) * 6.8 ≈ 3.9m,
// so an x range of [-2.6, 2.6] and y range of [0.6, 2.3] stays comfortably on-screen.
const X_MIN = -2.6;
const X_MAX = 2.6;
const Y_TOP = 2.3;
const Y_BOTTOM = 0.6;

/**
 * Maps each gadget's 2D hotspot (xPct/yPct, authored for the CabinStatic backdrop) onto a
 * 3D anchor on the cabin's back wall. Pure function of the registry — no R3F/three imports —
 * so it's unit-testable outside a WebGL context.
 */
export function gadgetAnchors(topic: TopicId): GadgetAnchor[] {
  return gadgetsForTopic(topic).map((gadget) => {
    const xFrac = gadget.hotspot.xPct / 100;
    const yFrac = gadget.hotspot.yPct / 100;
    const x = X_MIN + xFrac * (X_MAX - X_MIN);
    const y = Y_TOP - yFrac * (Y_TOP - Y_BOTTOM);
    return {
      id: gadget.id,
      label: gadget.hotspot.label,
      status: gadget.status,
      position: [x, y, ANCHOR_Z] as const,
    };
  });
}
