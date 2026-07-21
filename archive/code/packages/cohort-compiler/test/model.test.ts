import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  Accommodations,
  AgeBand,
  BenefitLCB,
  Caliper,
  CandidateSet,
  ChurnBudget,
  Cohort,
  CohortAssignment,
  CohortHealthEvent,
  CommitResult,
  HardConstraints,
  LearnerProfile,
  LevelBand,
  ObjectiveTerms,
  ObjectiveWeights,
  PairFlag,
  Role,
  ScheduleAvailability,
  TurnAnalysis,
  TurnEvent,
  VelocityBand,
  WorkingRhythm,
} from "../src/model";

const schedule = { blocks: ["mon-pm", "wed-am"] } satisfies ScheduleAvailability;
const accommodations = { needs: ["quiet"], conflicts: [] } satisfies Accommodations;
const pairHistory = [{ ref: "L2", flag: "positive" }] satisfies PairFlag[];

const learner = {
  learnerRef: "L1",
  ageBand: "a9_11",
  schedule,
  accommodations,
  level: 10,
  velocity: 11,
  separations: ["L8"],
  priorAssignmentRef: null,
  pairHistory,
  preferredRole: "anchor",
  workingRhythm: "steady",
} satisfies LearnerProfile;

const caliper = {
  levelTolerance: 2,
  velocityTolerance: 2,
  k: 10,
} satisfies Caliper;

const churn = {
  weekKey: "2026-W30",
  cap: 4,
  used: 0,
  exceptions: [],
} satisfies ChurnBudget;

const hard = {
  age: true,
  schedule: true,
  separations: true,
  accommodations: true,
  caliper,
  nonHarmFloor: 0.5,
  benefitOf: (_member, _cohort) => 0.825,
  churn,
} satisfies HardConstraints;

const objective = {
  closePace: 1,
  compatibleIntensity: 1,
  roleCoverage: 1,
  pairHistory: 1,
  rivalryDose: 1,
  churn: 1,
  repeatedPairings: 1,
} satisfies ObjectiveWeights & ObjectiveTerms;

const cohort = {
  members: [{ ref: "L1", role: "anchor" }],
} satisfies Cohort;

const assignment = {
  id: "asg-1",
  cohorts: [cohort],
  memberRefs: ["L1"],
  levelBands: { level: [10, 12], velocity: [9, 11] },
  candidateSetHash: "1234abcd",
  objectiveTerms: objective,
  constraints: hard,
  start: "2026-07-20T10:00:00Z",
  plannedReview: "2026-07-27T10:00:00Z",
  priorAssignmentId: null,
  rollbackRef: null,
  sizeExceptions: [],
} satisfies CohortAssignment;

describe("domain model contract (T002)", () => {
  it("uses the pinned scalar and enum domains", () => {
    expectTypeOf<AgeBand>().toEqualTypeOf<"a6_8" | "a9_11" | "a12_14">();
    expectTypeOf<LevelBand>().toEqualTypeOf<number>();
    expectTypeOf<VelocityBand>().toEqualTypeOf<number>();
    expectTypeOf<Role>().toEqualTypeOf<"anchor" | "scout" | "builder" | "challenger" | "scribe">();
    expectTypeOf<WorkingRhythm>().toEqualTypeOf<"steady" | "burst" | "flex">();
  });

  it("represents learner and candidate inputs without derived rank fields", () => {
    const candidateSet = {
      learnerRef: learner.learnerRef,
      candidates: [{ ref: "L2", distance: 2 }],
      hash: "1234abcd",
    } satisfies CandidateSet;

    expect(candidateSet.candidates).toEqual([{ ref: "L2", distance: 2 }]);
    expect(learner.pairHistory).toEqual(pairHistory);
  });

  it("represents assignment, lifecycle, and safeguarding snapshots", () => {
    const commit = {
      ok: true,
      assignmentId: assignment.id,
      priorAssignmentId: null,
      reasons: [],
    } satisfies CommitResult;
    const event = {
      assignmentId: assignment.id,
      reporterRef: "L2",
      eventClass: "bullying",
      affectedMembers: ["L1"],
      severity: "high",
      evidenceScope: "session-notes",
      immediateAction: "paused move",
      safeguardingLink: "sg-queue-1",
      followUpOwner: "guide-1",
    } satisfies CohortHealthEvent;

    expect(commit.ok).toBe(true);
    expect(event.eventClass).toBe("bullying");
  });

  it("keeps turn analysis observable-only by construction", () => {
    const turn = {
      speaker: "S1",
      start: 0,
      duration: 10,
      overlap: false,
      quality: 1,
    } satisfies TurnEvent;
    const analysis = {
      perSpeaker: {
        S1: { turnShare: 1, speakingTime: 10, interruptions: 0 },
      },
      patterns: [
        {
          kind: "dominance",
          evidence: "S1 holds 4/6 turns (66.7%) > 50%",
          subjects: ["S1"],
        },
      ],
      confidence: 1,
      suppressed: false,
    } satisfies TurnAnalysis;

    expectTypeOf<TurnAnalysis>().toEqualTypeOf<{
      perSpeaker: Record<
        string,
        { turnShare: number; speakingTime: number; interruptions: number }
      >;
      patterns: {
        kind: "dominance" | "repeated_interruption";
        evidence: string;
        subjects: string[];
      }[];
      confidence: number;
      suppressed: boolean;
    }>();
    expect(turn.overlap).toBe(false);
    expect(analysis.patterns[0]?.kind).toBe("dominance");
  });

  it("marks benefit estimates as post-lock shadow data", () => {
    const benefit = {
      assignmentId: assignment.id,
      lcb: 0,
      loggedAt: "2026-07-20T12:00:00Z",
      shadow: true,
    } satisfies BenefitLCB;

    expectTypeOf(benefit.shadow).toEqualTypeOf<true>();
    expect(benefit.shadow).toBe(true);
  });
});
