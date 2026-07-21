import { describe, expect, it } from "vitest";
import { caliperDistance, withinCaliper } from "../src/caliper";
import type { Caliper, LearnerProfile } from "../src/model";

const caliper = {
  levelTolerance: 2,
  velocityTolerance: 2,
  k: 10,
} satisfies Caliper;

function learner(learnerRef: string, level: number, velocity: number): LearnerProfile {
  return {
    learnerRef,
    ageBand: "a9_11",
    schedule: { blocks: ["mon-pm"] },
    accommodations: { needs: [], conflicts: [] },
    level,
    velocity,
    separations: [],
    priorAssignmentRef: null,
  };
}

const subject = learner("subject", 10, 10);

describe("withinCaliper (T004, FR-002)", () => {
  it("accepts a peer only when both dimensions are within tolerance", () => {
    expect(withinCaliper(subject, learner("near", 11, 9), caliper)).toBe(true);
    expect(withinCaliper(subject, learner("level-out", 13, 10), caliper)).toBe(false);
    expect(withinCaliper(subject, learner("velocity-out", 10, 13), caliper)).toBe(false);
  });

  it("includes equality at either tolerance boundary", () => {
    expect(withinCaliper(subject, learner("level-boundary", 12, 11), caliper)).toBe(true);
    expect(withinCaliper(subject, learner("velocity-boundary", 11, 12), caliper)).toBe(true);
  });
});

describe("caliperDistance (T007)", () => {
  it("adds the absolute level and velocity deltas", () => {
    expect(caliperDistance(subject, learner("peer", 12, 8))).toBe(4);
  });
});
