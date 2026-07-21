import type { BenefitLCB, CohortHealthEvent } from "../../src/model";

export interface ActiveMoveFixture {
  moveId: string;
  touches: string[];
}

export const safeguardingShadow = {
  event: {
    assignmentId: "asg-1",
    reporterRef: "A2",
    eventClass: "bullying",
    affectedMembers: ["A3"],
    severity: "high",
    evidenceScope: "session-notes",
    immediateAction: "paused move",
    safeguardingLink: "sg-queue-1",
    followUpOwner: "guide-1",
  },
  activeMoves: [
    { moveId: "mv-1", touches: ["A3", "A5"] },
    { moveId: "mv-2", touches: ["A1"] },
  ],
  expected: {
    pendingCount: 1,
    pausedMoveIds: ["mv-1"],
    untouchedMoveIds: ["mv-2"],
    shadowBenefit: {
      assignmentId: "asg-1",
      lcb: 0,
      loggedAt: "2026-07-20T12:00:00Z",
      shadow: true,
    },
  },
} satisfies {
  event: CohortHealthEvent;
  activeMoves: ActiveMoveFixture[];
  expected: {
    pendingCount: number;
    pausedMoveIds: string[];
    untouchedMoveIds: string[];
    shadowBenefit: BenefitLCB;
  };
};
