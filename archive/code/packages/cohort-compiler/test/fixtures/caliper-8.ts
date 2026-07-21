import type { Caliper, LearnerProfile } from "../../src/model";

const schedule = { blocks: ["mon-pm", "wed-am"] };
const accommodations = { needs: [], conflicts: [] };

function learner(
  learnerRef: string,
  level: number,
  velocity: number,
  separations: string[],
): LearnerProfile {
  return {
    learnerRef,
    ageBand: "a9_11",
    schedule: { ...schedule, blocks: [...schedule.blocks] },
    accommodations: {
      needs: [...accommodations.needs],
      conflicts: [...accommodations.conflicts],
    },
    level,
    velocity,
    separations,
    priorAssignmentRef: null,
  };
}

export const caliper8 = {
  caliper: {
    levelTolerance: 2,
    velocityTolerance: 2,
    k: 10,
  },
  pool: [
    learner("L1", 10, 10, ["L8"]),
    learner("L2", 11, 9, []),
    learner("L3", 12, 12, []),
    learner("L4", 9, 11, []),
    learner("L5", 20, 20, []),
    learner("L6", 10, 8, []),
    learner("L7", 13, 10, []),
    learner("L8", 11, 11, ["L1"]),
  ],
  expected: {
    candidates: {
      L1: ["L2", "L4", "L6", "L3"],
      L2: ["L1", "L6", "L8", "L7", "L4"],
      L3: ["L8", "L7", "L1"],
      L4: ["L1", "L8", "L2"],
      L5: [],
      L6: ["L1", "L2"],
      L7: ["L2", "L3", "L8"],
      L8: ["L2", "L3", "L4", "L7"],
    },
    preimages: {
      L1: "L1>L2,L4,L6,L3",
      L2: "L2>L1,L6,L8,L7,L4",
      L3: "L3>L8,L7,L1",
      L4: "L4>L1,L8,L2",
      L5: "L5>",
      L6: "L6>L1,L2",
      L7: "L7>L2,L3,L8",
      L8: "L8>L2,L3,L4,L7",
    },
  },
} satisfies {
  caliper: Caliper;
  pool: LearnerProfile[];
  expected: {
    candidates: Record<string, string[]>;
    preimages: Record<string, string>;
  };
};
