import type { Caliper, LearnerProfile } from "./model";

/** Manhattan distance used to order candidates inside the hard caliper. */
export function caliperDistance(a: LearnerProfile, b: LearnerProfile): number {
  return Math.abs(a.level - b.level) + Math.abs(a.velocity - b.velocity);
}

/** True when both private matchmaking dimensions are inside their inclusive bounds. */
export function withinCaliper(a: LearnerProfile, b: LearnerProfile, caliper: Caliper): boolean {
  return (
    Math.abs(a.level - b.level) <= caliper.levelTolerance &&
    Math.abs(a.velocity - b.velocity) <= caliper.velocityTolerance
  );
}
