/**
 * Shared room layout (metres). Floor at y=0, room centred on X, back (fireplace) wall at z=-hz.
 * Ported/trimmed from passion/apps/tinker-cabin/cabin/src/scene/layout.ts for the fixed-camera,
 * point-and-click gt100k cabin (no controller/collision needed here).
 */
export const ROOM = {
  hx: 3.5, // half-extent along X (walls at x = ±3.5)
  hz: 3.0, // half-extent along Z (walls at z = ±3.0)
  height: 3.0,
  wall: 0.3, // wall thickness
  eyeY: 1.6, // seated eye height, used to frame the fixed camera
} as const;

/** Key anchor points (metres). */
export const ANCHORS = {
  fireplace: [0, 0, -ROOM.hz] as const, // centred on the back (-Z) wall
  cat: [0.75, 0, -1.75] as const, // curled on the hearth rug, camera-right of the fire
  window: [ROOM.hx, 1.6, 0.6] as const, // right (+X) wall
} as const;
