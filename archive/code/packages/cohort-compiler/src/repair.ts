import { membershipChurn } from "./commit";
import type { ChurnBudget, CohortAssignment } from "./model";

export interface RepairAccepted {
  repaired: CohortAssignment;
  guideVeto: {
    opensAt: string;
    closesAt: string;
  };
  oneClickRollback: {
    assignmentId: string;
  };
}

export interface RepairRequiresStaffException {
  staffExceptionRequired: true;
  reason: "churn-exceeded" | "cohort-size-change";
}

export type RepairResult = RepairAccepted | RepairRequiresStaffException;

function cohortSizes(assignment: CohortAssignment): number[] {
  return assignment.cohorts
    .map(({ members }) => members.length)
    .sort((left, right) => left - right);
}

function changesCohortSize(assignment: CohortAssignment, prior: CohortAssignment): boolean {
  const nextSizes = cohortSizes(assignment);
  const priorSizes = cohortSizes(prior);

  return (
    nextSizes.length !== priorSizes.length ||
    nextSizes.some((size, index) => size !== priorSizes[index])
  );
}

function requiresStaff(
  reason: RepairRequiresStaffException["reason"],
): RepairRequiresStaffException {
  return { staffExceptionRequired: true, reason };
}

/** Accept a reversible repair only inside the deterministic bounded-automation envelope. */
export function repairCohort(
  assignment: CohortAssignment,
  churn: ChurnBudget,
  prior: CohortAssignment,
): RepairResult {
  if (changesCohortSize(assignment, prior)) {
    return requiresStaff("cohort-size-change");
  }

  if (churn.used + membershipChurn(prior, assignment) > churn.cap) {
    return requiresStaff("churn-exceeded");
  }

  const repaired = {
    ...assignment,
    priorAssignmentId: prior.id,
    rollbackRef: prior.id,
  } satisfies CohortAssignment;

  return {
    repaired,
    guideVeto: {
      opensAt: repaired.start,
      closesAt: repaired.plannedReview,
    },
    oneClickRollback: { assignmentId: repaired.id },
  };
}
