import type { ChurnBudget, CohortAssignment, CommitResult } from "./model";
import type { CohortRepository } from "./ports";

function cohortIndexes(assignment: CohortAssignment): Map<string, number> {
  const indexes = new Map<string, number>();

  assignment.cohorts.forEach((cohort, cohortIndex) => {
    for (const { ref } of cohort.members) indexes.set(ref, cohortIndex);
  });

  return indexes;
}

/** Count learners whose cohort index changed; unassigned is a distinct sentinel. */
export function membershipChurn(prior: CohortAssignment, next: CohortAssignment): number {
  const before = cohortIndexes(prior);
  const after = cohortIndexes(next);
  const learnerRefs = new Set([...before.keys(), ...after.keys()]);

  return [...learnerRefs].filter((learnerRef) => before.get(learnerRef) !== after.get(learnerRef))
    .length;
}

function refused(reason: string): CommitResult {
  return {
    ok: false,
    assignmentId: null,
    priorAssignmentId: null,
    reasons: [reason],
  };
}

function exceptionAllowance(churn: ChurnBudget): number {
  return churn.exceptions.reduce((allowance, exception) => allowance + exception.delta, 0);
}

function errorReason(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "commit-failed";
}

export async function commit(
  repository: CohortRepository,
  assignment: CohortAssignment,
  churn: ChurnBudget,
): Promise<CommitResult> {
  const prior = assignment.priorAssignmentId
    ? await repository.getSnapshot(assignment.priorAssignmentId)
    : null;

  if (assignment.priorAssignmentId && !prior) {
    return refused("prior-snapshot-not-found");
  }

  for (const learnerRef of assignment.memberRefs) {
    const active = await repository.activeFor(learnerRef);
    if (active && active.id !== assignment.priorAssignmentId) {
      return refused("duplicate-active-assignment");
    }
  }

  if (
    prior &&
    churn.used + membershipChurn(prior, assignment) > churn.cap + exceptionAllowance(churn)
  ) {
    return refused("churn-exceeded");
  }

  const snapshot: CohortAssignment = {
    ...assignment,
    rollbackRef: assignment.priorAssignmentId,
  };

  try {
    await repository.commitAtomic(snapshot);
  } catch (error) {
    return refused(errorReason(error));
  }

  return {
    ok: true,
    assignmentId: snapshot.id,
    priorAssignmentId: snapshot.priorAssignmentId,
    reasons: [],
  };
}

export async function rollback(
  repository: CohortRepository,
  assignmentId: string,
): Promise<CohortAssignment> {
  return repository.restore(assignmentId);
}
