/**
 * Multi-gadget interaction manager — the generalization of CameraRig's single `InteractionZone` to
 * the whole set of discovery gadgets. ONE component owns the press-E edge so zones never fight over
 * `intent.interact` (each InteractionZone consumed the edge every frame, which breaks with >1 zone).
 *
 * Each frame it finds the NEAREST in-range gadget ("nearest wins" — the natural walk-up UX), reports
 * range changes via `onNear(id | null)`, and on a press-E edge activates that gadget via `onActivate`
 * then consumes the edge exactly once.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { type MutableRefObject, useRef } from "react";
import type { GadgetDef } from "../scene/gadgets/gadgetState";
import type { MoveIntent } from "./intent";

export function GadgetZones({
  intentRef,
  gadgets,
  onNear,
  onActivate,
}: {
  intentRef: MutableRefObject<MoveIntent>;
  gadgets: readonly GadgetDef[];
  onNear: (id: string | null) => void;
  onActivate: (id: string) => void;
}): null {
  const { camera } = useThree();
  const nearId = useRef<string | null>(null);

  useFrame(() => {
    const cx = camera.position.x;
    const cz = camera.position.z;

    // nearest in-range gadget
    let best: string | null = null;
    let bestD = Number.POSITIVE_INFINITY;
    for (const g of gadgets) {
      const dx = cx - g.target[0];
      const dz = cz - g.target[2];
      const d2 = dx * dx + dz * dz;
      if (d2 <= g.radius * g.radius && d2 < bestD) {
        bestD = d2;
        best = g.id;
      }
    }

    if (best !== nearId.current) {
      nearId.current = best;
      onNear(best);
    }

    // consume the press-E edge exactly once, activating whatever we're nearest to
    if (intentRef.current.interact) {
      if (best) onActivate(best);
      intentRef.current.interact = false;
    }
  });

  return null;
}
