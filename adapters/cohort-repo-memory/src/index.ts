import type { CohortAssignment } from "../../../packages/cohort-compiler/src/model";
import type { CohortRepository } from "../../../packages/cohort-compiler/src/ports";

function cloneAssignment(assignment: CohortAssignment): CohortAssignment {
  return {
    ...assignment,
    cohorts: assignment.cohorts.map((cohort) => ({
      members: cohort.members.map((member) => ({ ...member })),
    })),
    memberRefs: [...assignment.memberRefs],
    levelBands: {
      level: [...assignment.levelBands.level],
      velocity: [...assignment.levelBands.velocity],
    },
    objectiveTerms: { ...assignment.objectiveTerms },
    constraints: {
      ...assignment.constraints,
      caliper: { ...assignment.constraints.caliper },
      churn: {
        ...assignment.constraints.churn,
        exceptions: assignment.constraints.churn.exceptions.map((exception) => ({ ...exception })),
      },
    },
    sizeExceptions: assignment.sizeExceptions.map((exception) => ({ ...exception })),
  };
}

/** Buildable synthetic repository; PostgreSQL transaction persistence remains deferred. */
export class InMemoryCohortRepository implements CohortRepository {
  private snapshots = new Map<string, CohortAssignment>();
  private activeAssignmentByLearner = new Map<string, string>();

  async activeFor(learnerRef: string): Promise<CohortAssignment | null> {
    const assignmentId = this.activeAssignmentByLearner.get(learnerRef);
    if (!assignmentId) {
      return null;
    }

    const assignment = this.snapshots.get(assignmentId);
    return assignment ? cloneAssignment(assignment) : null;
  }

  async commitAtomic(assignment: CohortAssignment): Promise<void> {
    const snapshot = cloneAssignment(assignment);
    const priorAssignment = snapshot.priorAssignmentId
      ? this.snapshots.get(snapshot.priorAssignmentId)
      : undefined;

    if (snapshot.priorAssignmentId && !priorAssignment) {
      throw new Error("prior-snapshot-not-found");
    }

    for (const learnerRef of snapshot.memberRefs) {
      const activeAssignmentId = this.activeAssignmentByLearner.get(learnerRef);
      if (activeAssignmentId && activeAssignmentId !== snapshot.priorAssignmentId) {
        throw new Error("duplicate-active-assignment");
      }
    }

    const nextSnapshots = new Map(this.snapshots);
    const nextActiveAssignments = new Map(this.activeAssignmentByLearner);

    if (priorAssignment) {
      for (const learnerRef of priorAssignment.memberRefs) {
        if (nextActiveAssignments.get(learnerRef) === priorAssignment.id) {
          nextActiveAssignments.delete(learnerRef);
        }
      }
    }

    nextSnapshots.set(snapshot.id, snapshot);
    for (const learnerRef of snapshot.memberRefs) {
      nextActiveAssignments.set(learnerRef, snapshot.id);
    }

    this.snapshots = nextSnapshots;
    this.activeAssignmentByLearner = nextActiveAssignments;
  }

  async getSnapshot(assignmentId: string): Promise<CohortAssignment | null> {
    const assignment = this.snapshots.get(assignmentId);
    return assignment ? cloneAssignment(assignment) : null;
  }

  async restore(assignmentId: string): Promise<CohortAssignment> {
    const current = this.snapshots.get(assignmentId);
    if (!current) {
      throw new Error("assignment-snapshot-not-found");
    }

    const rollbackId = current.rollbackRef ?? current.priorAssignmentId;
    const prior = rollbackId ? this.snapshots.get(rollbackId) : undefined;
    if (!prior) {
      throw new Error("rollback-snapshot-not-found");
    }

    for (const learnerRef of prior.memberRefs) {
      const activeAssignmentId = this.activeAssignmentByLearner.get(learnerRef);
      if (
        activeAssignmentId &&
        activeAssignmentId !== current.id &&
        activeAssignmentId !== prior.id
      ) {
        throw new Error("duplicate-active-assignment");
      }
    }

    const nextActiveAssignments = new Map(this.activeAssignmentByLearner);
    for (const learnerRef of current.memberRefs) {
      if (nextActiveAssignments.get(learnerRef) === current.id) {
        nextActiveAssignments.delete(learnerRef);
      }
    }
    for (const learnerRef of prior.memberRefs) {
      nextActiveAssignments.set(learnerRef, prior.id);
    }

    this.activeAssignmentByLearner = nextActiveAssignments;
    return cloneAssignment(prior);
  }
}
