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
 * Explicit hand-placed prop per gadget id — a framed panel for the "on paper" puzzles, a small
 * chess set for the chess puzzle, and an angled mirror stand for the mirror maze.
 *
 * THREE OF THESE SEVEN ENTRIES ARE CURRENTLY INERT, ON PURPOSE
 * `logic-grid`, `minesweeper` and `lits` left the activity roster on 2026-07-25 (the reasoning is
 * in src/gadgets/registry.ts, which is the single place that decision is taken). Their placements
 * are kept here rather than deleted because this map is a plain `Record` that `gadgetProps3D` only
 * ever *reads* — it iterates the registry, not this object — so an entry for an unlisted gadget
 * costs one unreferenced object literal and nothing else: no render, no import, no bundle weight
 * beyond the literal itself, and no test can see it.
 *
 * What it buys is that these positions were placed by projecting each prop's bounds into the fixed
 * camera and checking the on-screen gaps (see below), which is slow, fiddly, and impossible to
 * re-derive from the numbers alone. Deleting them would throw that work away to save nothing, and
 * re-adding a puzzle would silently fall through to `fallbackProp` and put a generic blank frame
 * somewhere plausible-but-wrong instead. Contrast `cabin/backdrop/quads.data.ts`, where the
 * equivalent coordinates *were* deleted — those are traced onto one specific painting that is
 * being regenerated, so they expire; these are world-space and do not.
 *
 * Positions are chosen against the *fixed* camera in Cabin3D.tsx (position [-1.35, 1.55, 2.75],
 * looking at [0.55, 1.25, -2.7], fov 62, 16:9 canvas) — verified by projecting each prop's bounds
 * into that camera's view space so every prop lands with margin inside the frame, not just inside
 * world-space bounds. Two obstacles to clear on the back wall: the chimney breast itself
 * (|x| < 0.95, full room height — see layout.ts ANCHORS.fireplace + scene3d/Cabin.tsx Fireplace)
 * and the wider mantel shelf that overhangs it (|x| < 1.4, y in [1.95, 2.15]). The upper frame row
 * (y=1.8) sits outside the mantel's x-range; the lone lower frame (lits) sits directly below
 * minesweeper (same x=2.9, well clear of both the breast and the mantel) so it keeps a clean
 * vertical gap on screen rather than the diagonal near-miss of sitting between pipes and
 * minesweeper, which put its projected bounds close enough to pipes' to overlap on screen.
 */
const KNOWN_PROPS: Record<
  string,
  Pick<GadgetProp3D, "kind" | "pattern" | "position" | "rotation">
> = {
  nonogram: {
    kind: "frame",
    pattern: "nonogram",
    position: [-2.9, 1.8, -2.78],
    rotation: [0, 0, 0],
  },
  "logic-grid": {
    kind: "frame",
    pattern: "logic-grid",
    position: [-1.9, 1.8, -2.78],
    rotation: [0, 0, 0],
  },
  minesweeper: {
    kind: "frame",
    pattern: "minesweeper",
    position: [2.9, 1.8, -2.78],
    rotation: [0, 0, 0],
  },
  pipes: { kind: "frame", pattern: "pipes", position: [1.9, 1.8, -2.78], rotation: [0, 0, 0] },
  // lits sits directly below minesweeper (same x) rather than diagonally between pipes/minesweeper
  // — sharing an x-column with minesweeper keeps a clean vertical gap instead of the diagonal
  // near-miss that made lits and pipes overlap on screen.
  lits: { kind: "frame", pattern: "lits", position: [2.9, 0.95, -2.78], rotation: [0, 0, 0] },
  // Floor props: placed mid-room (not the near-camera front edge, which falls outside the fixed
  // camera's frustum at these side x-offsets) and clear of the hearth rug (|x| > 1.3).
  chess: { kind: "chess", pattern: "blank", position: [1.95, 0, -0.9], rotation: [0, -0.5, 0] },
  mirror: { kind: "mirror", pattern: "blank", position: [-1.85, 0, -1.0], rotation: [0, 0.5, 0] },
};

/** Fallback for any future gadget without a hand-placed prop above: a plain frame on the back wall,
 *  spread by its 2D hotspot (xPct/yPct, authored for the CabinStatic backdrop) so the scene never
 *  breaks/crashes when the registry grows — it just looks a little generic until someone adds a
 *  bespoke prop for it. */
function fallbackProp(
  gadget: Gadget,
): Pick<GadgetProp3D, "kind" | "pattern" | "position" | "rotation"> {
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
 *
 * Returns `[]` for a topic with no gadgets, which is a real state a player reaches rather than a
 * defect: `math` is on the map and active but has zero gadgets until its games ship (see
 * src/gadgets/registry.ts). Callers get an empty list and scene3d/Cabin.tsx renders the furnished
 * room with no props in it — a quiet, complete-looking cabin, not a blank or broken one.
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
