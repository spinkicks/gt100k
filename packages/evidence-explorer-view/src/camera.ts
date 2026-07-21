/**
 * Golden camera keyframes + parallax (§U8.9, exact). The fixture cosmos center `[15,-1,0]` is an
 * authored constant (it is the camera look-at target, not the raw AABB midpoint) and is re-exported
 * from the 3D layout as `CENTER_3D`.
 */
import type { CameraKeyframe, Vec3 } from "./model.js";

/** Focus keyframe offset applied to a focused body's `pos3d` (§U8.9). */
export const FOCUS_OFFSET: Vec3 = [8, 4, 12];
export const FOCUS_FOV = 34;

/** Static camera keyframes (exact). `focus(node)` is derived — see `focusKeyframe`. */
export const CAMERA = {
  keyframes: {
    introStart: { position: [15, 26, 60], target: [15, -1, 0], fov: 30 },
    overview: { position: [15, 8, 40], target: [15, -1, 0], fov: 40 },
    verifySeal: { position: [15, 2, 30], target: [15, -1, 0], fov: 36 },
    scrub: { position: [15, 6, 44], target: [15, -1, 0], fov: 42 },
    island: { position: [0, -6, 20], target: [0, -9, 0], fov: 40 },
  },
  clamps: {
    dollyMin: 12,
    dollyMax: 80,
    fovMin: 28,
    fovMax: 52,
    lookAhead: 2.0,
    orbitPolarMin: 15,
    orbitPolarMax: 150,
  },
} as const satisfies {
  keyframes: Record<string, CameraKeyframe>;
  clamps: Record<string, number>;
};

/** Derive the fly-to keyframe for a body at `pos3d` (§U8.9 `focus(node)`). */
export function focusKeyframe(pos3d: Vec3): CameraKeyframe {
  return {
    position: [pos3d[0] + FOCUS_OFFSET[0], pos3d[1] + FOCUS_OFFSET[1], pos3d[2] + FOCUS_OFFSET[2]],
    target: pos3d,
    fov: FOCUS_FOV,
  };
}

/** Depth-scale of ambient layers, back → front (§U8.9). Static under reduced-motion / calm-2D. */
export const PARALLAX = {
  starfield: 0.15,
  world: 1.0,
  foreground: 1.08,
} as const;
