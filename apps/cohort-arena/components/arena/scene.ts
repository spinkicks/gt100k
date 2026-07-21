import {
  type CohortArenaView,
  type MotionSpec,
  type SeatView,
  resolveMotion,
} from "@gt100k/cohort-arena-view";

export interface ArenaRoomSceneModel {
  readonly seats: SeatView[];
  readonly confidence: number;
  readonly suppressed: boolean;
}

/** Keeps static or absent rooms idle; only a truthful live holder needs continuous frames. */
export function resolveArenaFrameLoop(scene: ArenaRoomSceneModel | null): "always" | "demand" {
  return scene?.seats.some(({ holdingFloor }) => holdingFloor) ? "always" : "demand";
}

/** Copies the observable arena-room projection for renderers without adding inferred state. */
export function buildArenaRoomScene(view: CohortArenaView): ArenaRoomSceneModel | null {
  if (!view.rivalry) return null;

  return {
    seats: view.rivalry.seats.map((seat) => ({ ...seat })),
    confidence: view.rivalry.confidence,
    suppressed: view.rivalry.suppressed,
  };
}

/** Resolves the pinned seat-pulse token from the shared motion registry. */
export function resolveArenaRoomMotion(view: CohortArenaView): MotionSpec {
  return resolveMotion("turnPulse", {
    reducedMotion: view.motion.turnPulse.mode === "reduced",
  });
}
