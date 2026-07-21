import { describe, expect, it } from "vitest";
import { caliper8 } from "./fixtures/caliper-8";
import { churnRollback } from "./fixtures/churn-rollback";
import {
  cohort12,
  cohort13Infeasible,
  nonHarmDefaultBind,
  nonHarmReject,
} from "./fixtures/cohort-12";
import { safeguardingShadow } from "./fixtures/safeguarding-shadow";
import { rivalryMixThresholds, turnsFixtures } from "./fixtures/turns";

function turnTuples(
  turns: {
    speaker: string;
    start: number;
    duration: number;
    overlap: boolean;
    quality?: number;
  }[],
) {
  return turns.map(({ speaker, start, duration, overlap, quality }) => [
    speaker,
    start,
    duration,
    overlap,
    quality ?? null,
  ]);
}

describe("golden seed fixtures (T038)", () => {
  it("encodes Fixture A exactly", () => {
    expect(caliper8.caliper).toEqual({ levelTolerance: 2, velocityTolerance: 2, k: 10 });
    expect(
      caliper8.pool.map(({ learnerRef, level, velocity, separations }) => [
        learnerRef,
        level,
        velocity,
        separations,
      ]),
    ).toEqual([
      ["L1", 10, 10, ["L8"]],
      ["L2", 11, 9, []],
      ["L3", 12, 12, []],
      ["L4", 9, 11, []],
      ["L5", 20, 20, []],
      ["L6", 10, 8, []],
      ["L7", 13, 10, []],
      ["L8", 11, 11, ["L1"]],
    ]);
    expect(
      caliper8.pool.every(
        ({ ageBand, schedule, accommodations, priorAssignmentRef }) =>
          ageBand === "a9_11" &&
          JSON.stringify(schedule.blocks) === JSON.stringify(["mon-pm", "wed-am"]) &&
          accommodations.needs.length === 0 &&
          accommodations.conflicts.length === 0 &&
          priorAssignmentRef === null,
      ),
    ).toBe(true);
    expect(caliper8.expected.candidates).toEqual({
      L1: ["L2", "L4", "L6", "L3"],
      L2: ["L1", "L6", "L8", "L7", "L4"],
      L3: ["L8", "L7", "L1"],
      L4: ["L1", "L8", "L2"],
      L5: [],
      L6: ["L1", "L2"],
      L7: ["L2", "L3", "L8"],
      L8: ["L2", "L3", "L4", "L7"],
    });
    expect(caliper8.expected.preimages).toEqual({
      L1: "L1>L2,L4,L6,L3",
      L2: "L2>L1,L6,L8,L7,L4",
      L3: "L3>L8,L7,L1",
      L4: "L4>L1,L8,L2",
      L5: "L5>",
      L6: "L6>L1,L2",
      L7: "L7>L2,L3,L8",
      L8: "L8>L2,L3,L4,L7",
    });
  });

  it("encodes Fixtures B, B2, B3, and B4 exactly", () => {
    expect(
      cohort12.pool.map(({ learnerRef, ageBand, level, velocity }) => [
        learnerRef,
        ageBand,
        level,
        velocity,
      ]),
    ).toEqual([
      ["A1", "a9_11", 10, 10],
      ["A2", "a9_11", 11, 10],
      ["A3", "a9_11", 10, 11],
      ["A4", "a9_11", 12, 10],
      ["A5", "a9_11", 11, 12],
      ["A6", "a9_11", 12, 11],
      ["B1", "a12_14", 20, 20],
      ["B2", "a12_14", 21, 20],
      ["B3", "a12_14", 20, 21],
      ["B4", "a12_14", 22, 20],
      ["B5", "a12_14", 21, 22],
      ["B6", "a12_14", 22, 21],
    ]);
    expect(cohort12.expected).toEqual({
      cohortMemberRefs: [
        ["A1", "A2", "A3", "A4", "A5", "A6"],
        ["B1", "B2", "B3", "B4", "B5", "B6"],
      ],
      roles: ["anchor", "scout", "builder", "builder", "challenger", "scribe"],
      unassigned: [],
      hardConstraintViolations: 0,
      defaultBenefit: 0.825,
    });
    expect(
      cohort12.pool.every(
        ({ schedule, accommodations, separations, priorAssignmentRef, pairHistory }) =>
          JSON.stringify(schedule.blocks) === JSON.stringify(["mon-pm", "wed-am"]) &&
          accommodations.needs.length === 0 &&
          accommodations.conflicts.length === 0 &&
          separations.length === 0 &&
          priorAssignmentRef === null &&
          pairHistory?.length === 0,
      ),
    ).toBe(true);
    expect(cohort13Infeasible.pool.at(-1)).toEqual({
      learnerRef: "C1",
      ageBand: "a6_8",
      schedule: { blocks: ["mon-pm", "wed-am"] },
      accommodations: { needs: [], conflicts: [] },
      level: 5,
      velocity: 5,
      separations: [],
      priorAssignmentRef: null,
      pairHistory: [],
    });
    expect(cohort13Infeasible.expected.unassigned).toEqual([
      { ref: "C1", binding: ["age: fewer than six near-peers in age band a6_8"] },
    ]);
    expect(nonHarmReject.benefitByRef).toEqual({
      M1: 0.9,
      M2: 0.8,
      M3: 0.7,
      M4: 0.6,
      M5: 0.45,
      M6: 0.8,
    });
    expect(nonHarmReject.expected.meanBenefit).toBeCloseTo(0.7083333333333334, 15);
    expect(nonHarmReject.expected.rejected).toEqual({
      ok: false,
      violations: [
        { constraint: "individual_non_harm_floor", member: "M5", value: 0.45, floor: 0.5 },
      ],
    });
    expect(nonHarmReject.expected.boundary).toEqual({ ok: true, violations: [] });
    expect(nonHarmDefaultBind.members.map((member) => member.learnerRef)).toEqual([
      "D1",
      "D2",
      "D3",
      "D4",
      "D5",
      "D6",
    ]);
    expect(
      nonHarmDefaultBind.members.map(
        ({ learnerRef, accommodations, pairHistory, preferredRole, workingRhythm }) => ({
          learnerRef,
          accommodations,
          pairHistory: pairHistory ?? [],
          preferredRole,
          workingRhythm,
        }),
      ),
    ).toEqual([
      {
        learnerRef: "D1",
        accommodations: { needs: [], conflicts: [] },
        pairHistory: [],
        preferredRole: "anchor",
        workingRhythm: "steady",
      },
      {
        learnerRef: "D2",
        accommodations: { needs: [], conflicts: [] },
        pairHistory: [],
        preferredRole: "scout",
        workingRhythm: "steady",
      },
      {
        learnerRef: "D3",
        accommodations: { needs: [], conflicts: ["low-stim"] },
        pairHistory: [],
        preferredRole: "challenger",
        workingRhythm: "steady",
      },
      {
        learnerRef: "D4",
        accommodations: { needs: [], conflicts: [] },
        pairHistory: [],
        preferredRole: "builder",
        workingRhythm: "flex",
      },
      {
        learnerRef: "D5",
        accommodations: { needs: [], conflicts: [] },
        pairHistory: [],
        preferredRole: "builder",
        workingRhythm: "burst",
      },
      {
        learnerRef: "D6",
        accommodations: { needs: ["quiet", "low-stim"], conflicts: [] },
        pairHistory: [{ ref: "D2", flag: "negative" }],
        preferredRole: "builder",
        workingRhythm: "burst",
      },
    ]);
    expect(nonHarmDefaultBind.expected.factorsByRef).toEqual({
      D1: { accommodation: 1, history: 0.5, pace: 0.8 },
      D2: { accommodation: 1, history: 0.5, pace: 0.8 },
      D3: { accommodation: 1, history: 0.5, pace: 0.8 },
      D4: { accommodation: 1, history: 0.5, pace: 0.8 },
      D5: { accommodation: 1, history: 0.5, pace: 0.5 },
      D6: { accommodation: 0.5, history: 0.3, pace: 0.5 },
    });
    expect(nonHarmDefaultBind.expected.benefitByRef).toEqual({
      D1: 0.775,
      D2: 0.775,
      D3: 0.775,
      D4: 0.775,
      D5: 0.7,
      D6: 0.43,
    });
    expect(nonHarmDefaultBind.expected.meanBenefit).toBe(0.705);
    expect(nonHarmDefaultBind.expected.rejected).toEqual({
      ok: false,
      violations: [
        { constraint: "individual_non_harm_floor", member: "D6", value: 0.43, floor: 0.5 },
      ],
    });
    expect(nonHarmDefaultBind.boundaryMembers[2]?.accommodations.conflicts).toEqual([]);
    expect(nonHarmDefaultBind.expected.boundaryBenefit).toBe(0.63);
    expect(nonHarmDefaultBind.expected.boundary).toEqual({ ok: true, violations: [] });
    expect(nonHarmDefaultBind.expected.tolerance).toBe(1e-9);
  });

  it("encodes Fixtures C and D exactly", () => {
    expect(churnRollback.pool.at(-1)).toEqual({
      learnerRef: "A7",
      ageBand: "a9_11",
      schedule: { blocks: ["mon-pm", "wed-am"] },
      accommodations: { needs: [], conflicts: [] },
      level: 11,
      velocity: 11,
      separations: [],
      priorAssignmentRef: null,
      pairHistory: [],
    });
    expect(churnRollback.assignments.asg1.memberRefs).toEqual(["A1", "A2", "A3", "A4", "A5", "A6"]);
    expect(churnRollback.assignments.asg2.memberRefs).toEqual(["A1", "A2", "A3", "A4", "A5", "A7"]);
    expect(churnRollback.budgets).toEqual({
      capTwo: { weekKey: "2026-W30", cap: 2, used: 0, exceptions: [] },
      capOne: { weekKey: "2026-W30", cap: 1, used: 0, exceptions: [] },
      capOneWithException: {
        weekKey: "2026-W30",
        cap: 1,
        used: 0,
        exceptions: [{ approvedBy: "safety-owner-1", reason: "reunite split friends", delta: 1 }],
      },
    });
    expect(churnRollback.expected.initialCommit).toEqual({
      ok: true,
      assignmentId: "asg-1",
      priorAssignmentId: null,
      reasons: [],
    });
    expect(churnRollback.expected.activeForA1).toBe("asg-1");
    expect(churnRollback.expected.churn).toBe(2);
    expect(churnRollback.expected.capTwoCommit).toEqual({
      ok: true,
      assignmentId: "asg-2",
      priorAssignmentId: "asg-1",
      reasons: [],
    });
    expect(churnRollback.expected.capOneRefusal).toEqual({
      ok: false,
      assignmentId: null,
      priorAssignmentId: null,
      reasons: ["churn-exceeded"],
    });
    expect(churnRollback.expected.capOneExceptionCommit).toEqual({
      ok: true,
      assignmentId: "asg-2",
      priorAssignmentId: "asg-1",
      reasons: [],
    });
    expect(churnRollback.expected.duplicateRefusal).toEqual({
      ok: false,
      assignmentId: null,
      priorAssignmentId: null,
      reasons: ["duplicate-active-assignment"],
    });
    expect(churnRollback.expected.restored).toEqual(churnRollback.assignments.asg1);
    expect(churnRollback.expected.restored).not.toBe(churnRollback.assignments.asg1);
    expect(churnRollback.expected.restored.cohorts).not.toBe(
      churnRollback.assignments.asg1.cohorts,
    );
    expect(churnRollback.expected.restored.constraints.churn).not.toBe(
      churnRollback.assignments.asg1.constraints.churn,
    );
    expect(safeguardingShadow.event).toEqual({
      assignmentId: "asg-1",
      reporterRef: "A2",
      eventClass: "bullying",
      affectedMembers: ["A3"],
      severity: "high",
      evidenceScope: "session-notes",
      immediateAction: "paused move",
      safeguardingLink: "sg-queue-1",
      followUpOwner: "guide-1",
    });
    expect(safeguardingShadow.activeMoves).toEqual([
      { moveId: "mv-1", touches: ["A3", "A5"] },
      { moveId: "mv-2", touches: ["A1"] },
    ]);
    expect(safeguardingShadow.expected.pendingCount).toBe(1);
    expect(safeguardingShadow.expected.pausedMoveIds).toEqual(["mv-1"]);
    expect(safeguardingShadow.expected.untouchedMoveIds).toEqual(["mv-2"]);
    expect(safeguardingShadow.expected.shadowBenefit).toEqual({
      assignmentId: "asg-1",
      lcb: 0,
      loggedAt: "2026-07-20T12:00:00Z",
      shadow: true,
    });
  });

  it("encodes every Fixture E turn sequence and outcome", () => {
    expect(rivalryMixThresholds).toEqual({
      dominanceTurnShare: 0.5,
      interruptionThreshold: 3,
      confidenceFloor: 0.5,
      minTurns: 4,
      qualityFloor: 0.5,
    });
    expect(turnTuples(turnsFixtures.dominance.turns)).toEqual([
      ["S1", 0, 10, false, null],
      ["S2", 10, 5, false, null],
      ["S1", 15, 10, false, null],
      ["S1", 25, 10, false, null],
      ["S3", 35, 5, false, null],
      ["S1", 40, 10, false, null],
    ]);
    expect(turnTuples(turnsFixtures.interruption.turns)).toEqual([
      ["S1", 0, 10, false, null],
      ["S2", 8, 6, true, null],
      ["S1", 14, 10, false, null],
      ["S2", 20, 5, true, null],
      ["S3", 25, 8, false, null],
      ["S2", 30, 5, true, null],
      ["S1", 35, 8, false, null],
      ["S3", 43, 7, false, null],
    ]);
    expect(turnTuples(turnsFixtures.lowQuality.turns)).toEqual([
      ["S1", 0, 10, false, 0.3],
      ["S2", 10, 10, false, 0.3],
      ["S1", 20, 10, false, 0.3],
    ]);
    expect(turnTuples(turnsFixtures.sparse.turns)).toEqual([["S1", 0, 10, false, null]]);
    expect(turnTuples(turnsFixtures.empty.turns)).toEqual([]);
    expect(turnTuples(turnsFixtures.ambiguous.turns)).toEqual([
      ["S1", 0, 10, false, null],
      ["S2", 8, 5, true, 0.2],
      ["S1", 13, 10, false, null],
      ["S2", 20, 5, true, null],
      ["S1", 27, 10, false, null],
      ["S2", 33, 5, true, null],
    ]);
    expect(turnsFixtures.dominance.expected).toEqual({
      meanQuality: 1,
      coverage: 1,
      analysis: {
        perSpeaker: {
          S1: { turnShare: 4 / 6, speakingTime: 40, interruptions: 0 },
          S2: { turnShare: 1 / 6, speakingTime: 5, interruptions: 0 },
          S3: { turnShare: 1 / 6, speakingTime: 5, interruptions: 0 },
        },
        confidence: 1,
        suppressed: false,
        patterns: [
          {
            kind: "dominance",
            subjects: ["S1"],
            evidence: "S1 holds 4/6 turns (66.7%) > 50%",
          },
        ],
      },
    });
    expect(turnsFixtures.interruption.expected).toEqual({
      meanQuality: 1,
      coverage: 1,
      analysis: {
        perSpeaker: {
          S1: { turnShare: 3 / 8, speakingTime: 28, interruptions: 0 },
          S2: { turnShare: 3 / 8, speakingTime: 16, interruptions: 3 },
          S3: { turnShare: 2 / 8, speakingTime: 15, interruptions: 0 },
        },
        confidence: 1,
        suppressed: false,
        patterns: [
          {
            kind: "repeated_interruption",
            subjects: ["S2"],
            evidence: "S2 initiated 3 overlapping turns ≥ 3",
          },
        ],
      },
    });
    expect(turnsFixtures.lowQuality.expected).toEqual({
      meanQuality: 0.3,
      coverage: 0.75,
      analysis: {
        perSpeaker: {
          S1: { turnShare: 2 / 3, speakingTime: 20, interruptions: 0 },
          S2: { turnShare: 1 / 3, speakingTime: 10, interruptions: 0 },
        },
        confidence: 0.225,
        suppressed: true,
        patterns: [],
      },
    });
    expect(turnsFixtures.sparse.expected).toEqual({
      meanQuality: 1,
      coverage: 0.25,
      analysis: {
        perSpeaker: { S1: { turnShare: 1, speakingTime: 10, interruptions: 0 } },
        confidence: 0.25,
        suppressed: true,
        patterns: [],
      },
    });
    expect(turnsFixtures.empty.expected).toEqual({
      meanQuality: 0,
      coverage: 0,
      analysis: { perSpeaker: {}, patterns: [], confidence: 0, suppressed: true },
    });
    expect(turnsFixtures.ambiguous.expected).toEqual({
      meanQuality: 0.8666666666666667,
      coverage: 1,
      analysis: {
        perSpeaker: {
          S1: { turnShare: 0.5, speakingTime: 30, interruptions: 0 },
          S2: { turnShare: 0.5, speakingTime: 15, interruptions: 2 },
        },
        confidence: 0.8666666666666667,
        suppressed: false,
        patterns: [],
      },
    });
  });
});
