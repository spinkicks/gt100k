import { gadgetsForTopic } from "../../gadgets/registry";
import type { Gadget, TopicId } from "../../game/types";

/** Visual family a gadget prop renders as. The clickable hotspot IS the prop object (no floating
 *  UI marker) — a framed wall panel, a chess table, or a mirror stand — matching the puzzle it
 *  opens closely enough to read as "the right object" at a glance. */
export type GadgetPropKind = "frame" | "chess" | "mirror";

/** Which pattern a "frame" prop's canvas texture draws (distinct per puzzle so frames don't look
 *  interchangeable). Unused by "chess"/"mirror" kinds. */
export type FramePattern = "nonogram" | "logic-grid" | "minesweeper" | "pipes" | "lits" | "blank";

export interface GadgetProp3D {
  id: string;
  label: string;
  status: Gadget["status"];
  kind: GadgetPropKind;
  pattern: FramePattern;
  /** World-space [x, y, z] position (metres). */
  position: readonly [number, number, number];
  /** World-space Euler rotation (radians); defaults to identity (facing +Z). */
  rotation: readonly [number, number, number];
}

/**
 * Explicit hand-placed prop for every gadget currently in the registry (see
 * src/gadgets/registry.ts) — a framed panel for the "on paper" puzzles, a small chess set for the
 * chess puzzle, and an angled mirror stand for the mirror maze. Positions keep clear of the
 * fireplace chimney breast (|x| < ~1.05 at z≈-2.7..-3.0, see layout.ts + scene3d/Cabin.tsx
 * Fireplace) and stay within the fixed camera's frame (see Cabin3D.tsx).
 */
const KNOWN_PROPS: Record<
  string,
  Pick<GadgetProp3D, "kind" | "pattern" | "position" | "rotation">
> = {
  nonogram: { kind: "frame", pattern: "nonogram", position: [-2.4, 1.8, -2.78], rotation: [0, 0, 0] },
  "logic-grid": {
    kind: "frame",
    pattern: "logic-grid",
    position: [-1.3, 1.8, -2.78],
    rotation: [0, 0, 0],
  },
  minesweeper: {
    kind: "frame",
    pattern: "minesweeper",
    position: [1.3, 1.8, -2.78],
    rotation: [0, 0, 0],
  },
  pipes: { kind: "frame", pattern: "pipes", position: [2.4, 1.8, -2.78], rotation: [0, 0, 0] },
  lits: { kind: "frame", pattern: "lits", position: [-1.85, 1.02, -2.78], rotation: [0, 0, 0] },
  chess: { kind: "chess", pattern: "blank", position: [2.5, 0, 1.2], rotation: [0, -0.5, 0] },
  mirror: { kind: "mirror", pattern: "blank", position: [-2.5, 0, 1.2], rotation: [0, 0.5, 0] },
};

/** Fallback for any future gadget without a hand-placed prop above: a plain frame on the back wall,
 *  spread by its 2D hotspot (xPct/yPct, authored for the CabinStatic backdrop) so the scene never
 *  breaks/crashes when the registry grows — it just looks a little generic until someone adds a
 *  bespoke prop for it. */
function fallbackProp(gadget: Gadget): Pick<GadgetProp3D, "kind" | "pattern" | "position" | "rotation"> {
  const xFrac = gadget.hotspot.xPct / 100;
  const yFrac = gadget.hotspot.yPct / 100;
  const x = -2.6 + xFrac * 5.2;
  const y = 2.1 - yFrac * 1.5;
  return { kind: "frame", pattern: "blank", position: [x, y, -2.78], rotation: [0, 0, 0] };
}

/**
 * Maps each gadget in a topic onto a hand-placed (or, failing that, generic-fallback) 3D prop.
 * Pure function of the registry — no R3F/three imports — so it's unit-testable outside a WebGL
 * context.
 */
export function gadgetProps3D(topic: TopicId): GadgetProp3D[] {
  return gadgetsForTopic(topic).map((gadget) => {
    const spec = KNOWN_PROPS[gadget.id] ?? fallbackProp(gadget);
    return {
      id: gadget.id,
      label: gadget.hotspot.label,
      status: gadget.status,
      ...spec,
    };
  });
}
