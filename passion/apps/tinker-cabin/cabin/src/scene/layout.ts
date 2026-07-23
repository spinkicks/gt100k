/**
 * Shared room layout. The controller (collision) and the scene geometry both read these so walls
 * and clamping never drift apart. Units are metres; floor at y=0, room centred on origin.
 */
export const ROOM = {
  hx: 3.5, // half-extent along X (walls at x = ±3.5)
  hz: 3.0, // half-extent along Z (walls at z = ±3.0)
  height: 3.0,
  wall: 0.3, // wall thickness
  eyeY: 1.6, // camera/eye height
  margin: 0.45, // keep the camera this far off the walls
} as const;

/** Key anchor points (metres). */
export const ANCHORS = {
  fireplace: [0, 0, -ROOM.hz] as const, // centred on the back (-Z) wall
  cat: [0.7, 0, -1.7] as const, // curled on the hearth rug, camera-right of the fire
  window: [ROOM.hx, 1.6, 0.4] as const, // right (+X) wall
  desk: [-ROOM.hx + 0.5, 0, -0.6] as const, // left (-X) wall — the coding station
  spawn: [0, ROOM.eyeY, ROOM.hz - 0.8] as const, // near the +Z wall, looking toward the fire
} as const;
