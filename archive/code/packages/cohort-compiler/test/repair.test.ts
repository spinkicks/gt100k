import { describe, expect, expectTypeOf, it } from "vitest";
import { membershipChurn } from "../src/commit";
import type { ChurnBudget, CohortAssignment } from "../src/model";
import { type RepairAccepted, type RepairResult, repairCohort } from "../src/repair";
import { churnRollback } from "./fixtures/churn-rollback";

type Repair = (
  assignment: CohortAssignment,
  churn: ChurnBudget,
  prior: CohortAssignment,
) => RepairResult;

function proposedRepair(): CohortAssignment {
  return {
    ...churnRollback.assignments.asg2,
    id: "asg-repair",
    priorAssignmentId: null,
    rollbackRef: null,
  };
}

describe("repairCohort (T016, FR-017, SC-004)", () => {
  it("accepts an in-budget repair with guide-veto and one-click rollback controls", () => {
    expectTypeOf(repairCohort).toEqualTypeOf<Repair>();
    const proposed = proposedRepair();

    const result = repairCohort(
      proposed,
      churnRollback.budgets.capTwo,
      churnRollback.assignments.asg1,
    );

    expect("repaired" in result).toBe(true);
    const accepted = result as RepairAccepted;
    expect(membershipChurn(churnRollback.assignments.asg1, accepted.repaired)).toBe(2);
    expect(accepted).toEqual({
      repaired: {
        ...proposed,
        priorAssignmentId: "asg-1",
        rollbackRef: "asg-1",
      },
      guideVeto: {
        opensAt: proposed.start,
        closesAt: proposed.plannedReview,
      },
      oneClickRollback: { assignmentId: proposed.id },
    });
    expect(proposed.priorAssignmentId).toBeNull();
    expect(proposed.rollbackRef).toBeNull();
  });

  it("requires staff handling when the repair exceeds the base churn cap", () => {
    const result = repairCohort(
      proposedRepair(),
      churnRollback.budgets.capOneWithException,
      churnRollback.assignments.asg1,
    );

    expect(result).toEqual({
      staffExceptionRequired: true,
      reason: "churn-exceeded",
    });
    expect("repaired" in result).toBe(false);
  });

  it("requires staff handling for a cohort-size change and does not auto-apply it", () => {
    const prior = churnRollback.assignments.asg1;
    const proposed = {
      ...prior,
      id: "asg-size-change",
      cohorts: [{ members: prior.cohorts[0]?.members.slice(0, 5) ?? [] }],
      memberRefs: prior.memberRefs.slice(0, 5),
      priorAssignmentId: prior.id,
      rollbackRef: prior.id,
      sizeExceptions: [
        {
          cohortIndex: 0,
          approvedBy: "staff-owner-1",
          reason: "synthetic size-change review",
        },
      ],
    } satisfies CohortAssignment;

    const result = repairCohort(proposed, churnRollback.budgets.capTwo, prior);

    expect(result).toEqual({
      staffExceptionRequired: true,
      reason: "cohort-size-change",
    });
    expect("repaired" in result).toBe(false);
  });
});
