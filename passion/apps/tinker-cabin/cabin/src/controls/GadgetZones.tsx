/**
 * Multi-gadget interaction manager — the generalization of CameraRig's single `InteractionZone` to
 * the whole set of discovery gadgets. ONE component owns the press-E / click edge so zones never
 * fight over `intent.interact`.
 *
 * Targeting is LOOK-AT (Minecraft-style): each frame it casts a ray from the camera through the
 * crosshair and picks the nearest gadget whose aim-sphere it hits within reach — so you interact with
 * whatever you're aiming at, which is far more intuitive than walking into an invisible radius (and
 * fixes gadgets that were easy to "miss"). Standing right on a gadget also counts (origin-in-sphere).
 */
import { useFrame, useThree } from "@react-three/fiber";
import { type MutableRefObject, useMemo, useRef } from "react";
import * as THREE from "three";
import type { GadgetDef } from "../scene/gadgets/gadgetState";
import type { MoveIntent } from "./intent";

const MAX_REACH = 4.2; // how far you can reach out and interact (metres)

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

  // aim-spheres at each gadget (chest height); radius forgiving but small enough that you must
  // roughly aim the crosshair at the object, not just face its wall.
  const spheres = useMemo(
    () =>
      gadgets.map(
        (g) =>
          new THREE.Sphere(
            new THREE.Vector3(g.target[0], (g.target[1] ?? 0) + 1.1, g.target[2]),
            Math.max(0.85, g.radius * 0.55),
          ),
      ),
    [gadgets],
  );
  const ray = useMemo(() => new THREE.Ray(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    camera.getWorldDirection(fwd);
    ray.origin.copy(camera.position);
    ray.direction.copy(fwd);

    let best: string | null = null;
    let bestD = MAX_REACH;
    for (let i = 0; i < gadgets.length; i++) {
      const g = gadgets[i]!;
      const s = spheres[i]!;
      // standing on top of it → immediate target
      if (ray.origin.distanceToSquared(s.center) <= s.radius * s.radius) {
        best = g.id;
        bestD = 0;
        break;
      }
      const p = ray.intersectSphere(s, hit);
      if (p) {
        const d = ray.origin.distanceTo(p);
        if (d >= 0 && d < bestD) {
          bestD = d;
          best = g.id;
        }
      }
    }

    if (best !== nearId.current) {
      nearId.current = best;
      onNear(best);
    }

    // consume the interact edge (E key or click) exactly once, activating whatever we're aiming at
    if (intentRef.current.interact) {
      if (best) onActivate(best);
      intentRef.current.interact = false;
    }
  });

  return null;
}
