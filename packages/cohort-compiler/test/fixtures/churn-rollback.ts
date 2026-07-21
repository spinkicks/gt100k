import type {
  ChurnBudget,
  Cohort,
  CohortAssignment,
  CommitResult,
  LearnerProfile,
  ObjectiveTerms,
  Role,
} from "../../src/model";
import { cohort12, cohort12HardConstraints } from "./cohort-12";

const roles = ["anchor", "scout", "builder", "builder", "challenger", "scribe"] satisfies Role[];

const objectiveTerms = {
  closePace: 0,
  compatibleIntensity: 0,
  roleCoverage: 0,
  pairHistory: 0,
  rivalryDose: 0,
  churn: 0,
  repeatedPairings: 0,
} satisfies ObjectiveTerms;

function cohort(memberRefs: string[]): Cohort {
  return {
    members: memberRefs.map((ref, index) => ({ ref, role: roles[index] ?? "builder" })),
  };
}

function assignment(
  id: string,
  memberRefs: string[],
  priorAssignmentId: string | null,
  rollbackRef: string | null,
): CohortAssignment {
  return {
    id,
    cohorts: [cohort(memberRefs)],
    memberRefs: [...memberRefs],
    levelBands: { level: [10, 12], velocity: [10, 12] },
    candidateSetHash: "00000000",
    objectiveTerms: { ...objectiveTerms },
    constraints: {
      ...cohort12HardConstraints,
      caliper: { ...cohort12HardConstraints.caliper },
      churn: {
        ...cohort12HardConstraints.churn,
        exceptions: cohort12HardConstraints.churn.exceptions.map((exception) => ({ ...exception })),
      },
    },
    start: "2026-07-20T10:00:00Z",
    plannedReview: "2026-07-27T10:00:00Z",
    priorAssignmentId,
    rollbackRef,
    sizeExceptions: [],
  };
}

const a7 = {
  learnerRef: "A7",
  ageBand: "a9_11",
  schedule: { blocks: ["mon-pm", "wed-am"] },
  accommodations: { needs: [], conflicts: [] },
  level: 11,
  velocity: 11,
  separations: [],
  priorAssignmentRef: null,
  pairHistory: [],
} satisfies LearnerProfile;

const aMemberRefs = ["A1", "A2", "A3", "A4", "A5", "A6"];
const swappedMemberRefs = ["A1", "A2", "A3", "A4", "A5", "A7"];
const asg1 = assignment("asg-1", aMemberRefs, null, null);
const asg2 = assignment("asg-2", swappedMemberRefs, "asg-1", "asg-1");
const asgDuplicate = assignment("asg-dup", aMemberRefs, null, null);
const restoredAsg1 = assignment("asg-1", [...aMemberRefs], null, null);

const capTwo = {
  weekKey: "2026-W30",
  cap: 2,
  used: 0,
  exceptions: [],
} satisfies ChurnBudget;

const capOne = { ...capTwo, cap: 1 } satisfies ChurnBudget;
const capOneWithException = {
  ...capOne,
  exceptions: [
    {
      approvedBy: "safety-owner-1",
      reason: "reunite split friends",
      delta: 1,
    },
  ],
} satisfies ChurnBudget;

export const churnRollback = {
  pool: [...cohort12.pool.filter(({ learnerRef }) => learnerRef.startsWith("A")), a7],
  assignments: { asg1, asg2, asgDuplicate },
  budgets: { capTwo, capOne, capOneWithException },
  expected: {
    initialCommit: {
      ok: true,
      assignmentId: "asg-1",
      priorAssignmentId: null,
      reasons: [],
    },
    activeForA1: "asg-1",
    churn: 2,
    capTwoCommit: {
      ok: true,
      assignmentId: "asg-2",
      priorAssignmentId: "asg-1",
      reasons: [],
    },
    capOneRefusal: {
      ok: false,
      assignmentId: null,
      priorAssignmentId: null,
      reasons: ["churn-exceeded"],
    },
    capOneExceptionCommit: {
      ok: true,
      assignmentId: "asg-2",
      priorAssignmentId: "asg-1",
      reasons: [],
    },
    restored: restoredAsg1,
    duplicateRefusal: {
      ok: false,
      assignmentId: null,
      priorAssignmentId: null,
      reasons: ["duplicate-active-assignment"],
    },
  },
} satisfies {
  pool: LearnerProfile[];
  assignments: Record<string, CohortAssignment>;
  budgets: Record<string, ChurnBudget>;
  expected: {
    initialCommit: CommitResult;
    activeForA1: string;
    churn: number;
    capTwoCommit: CommitResult;
    capOneRefusal: CommitResult;
    capOneExceptionCommit: CommitResult;
    restored: CohortAssignment;
    duplicateRefusal: CommitResult;
  };
};
