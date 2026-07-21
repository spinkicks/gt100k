import { describe, expect, expectTypeOf, it } from "vitest";
import { commit, membershipChurn, rollback } from "../src/commit";
import type { ChurnBudget, CohortAssignment, CommitResult } from "../src/model";
import type { CohortRepository } from "../src/ports";
import { churnRollback } from "./fixtures/churn-rollback";

type Commit = (
  repository: CohortRepository,
  assignment: CohortAssignment,
  churn: ChurnBudget,
) => Promise<CommitResult>;

/** Port-level harness; the production-shaped memory adapter has its own contract suite. */
class FixtureRepository implements CohortRepository {
  private snapshots = new Map<string, CohortAssignment>();
  private activeByLearner = new Map<string, string>();

  async activeFor(learnerRef: string): Promise<CohortAssignment | null> {
    const assignmentId = this.activeByLearner.get(learnerRef);
    return assignmentId ? (this.snapshots.get(assignmentId) ?? null) : null;
  }

  async commitAtomic(assignment: CohortAssignment): Promise<void> {
    const prior = assignment.priorAssignmentId
      ? this.snapshots.get(assignment.priorAssignmentId)
      : undefined;

    if (assignment.priorAssignmentId && !prior) {
      throw new Error("prior-snapshot-not-found");
    }

    for (const learnerRef of assignment.memberRefs) {
      const activeId = this.activeByLearner.get(learnerRef);
      if (activeId && activeId !== assignment.priorAssignmentId) {
        throw new Error("duplicate-active-assignment");
      }
    }

    const nextSnapshots = new Map(this.snapshots);
    const nextActive = new Map(this.activeByLearner);
    if (prior) {
      for (const learnerRef of prior.memberRefs) {
        if (nextActive.get(learnerRef) === prior.id) nextActive.delete(learnerRef);
      }
    }
    nextSnapshots.set(assignment.id, assignment);
    for (const learnerRef of assignment.memberRefs) nextActive.set(learnerRef, assignment.id);

    this.snapshots = nextSnapshots;
    this.activeByLearner = nextActive;
  }

  async getSnapshot(assignmentId: string): Promise<CohortAssignment | null> {
    return this.snapshots.get(assignmentId) ?? null;
  }

  async restore(assignmentId: string): Promise<CohortAssignment> {
    const current = this.snapshots.get(assignmentId);
    const priorId = current?.rollbackRef ?? current?.priorAssignmentId;
    const prior = priorId ? this.snapshots.get(priorId) : undefined;
    if (!current || !prior) throw new Error("rollback-snapshot-not-found");

    const nextActive = new Map(this.activeByLearner);
    for (const learnerRef of current.memberRefs) {
      if (nextActive.get(learnerRef) === current.id) nextActive.delete(learnerRef);
    }
    for (const learnerRef of prior.memberRefs) nextActive.set(learnerRef, prior.id);
    this.activeByLearner = nextActive;
    return prior;
  }
}

async function activeId(repository: CohortRepository, learnerRef: string): Promise<string | null> {
  return (await repository.activeFor(learnerRef))?.id ?? null;
}

describe("commit and rollback (T015, SC-003/SC-004)", () => {
  it("exposes the pinned lifecycle API and counts the A6-to-A7 swap as churn two", () => {
    expectTypeOf(commit).toEqualTypeOf<Commit>();
    expectTypeOf(rollback).toEqualTypeOf<
      (repository: CohortRepository, assignmentId: string) => Promise<CohortAssignment>
    >();

    expect(membershipChurn(churnRollback.assignments.asg1, churnRollback.assignments.asg2)).toBe(
      churnRollback.expected.churn,
    );
  });

  it("commits an initial assignment and allows the exact churn boundary", async () => {
    const repository = new FixtureRepository();

    await expect(
      commit(repository, churnRollback.assignments.asg1, churnRollback.budgets.capTwo),
    ).resolves.toEqual(churnRollback.expected.initialCommit);
    expect(await activeId(repository, "A1")).toBe(churnRollback.expected.activeForA1);

    await expect(
      commit(repository, churnRollback.assignments.asg2, churnRollback.budgets.capTwo),
    ).resolves.toEqual(churnRollback.expected.capTwoCommit);
    expect(await activeId(repository, "A6")).toBeNull();
    expect(await activeId(repository, "A7")).toBe("asg-2");
    await expect(repository.getSnapshot("asg-1")).resolves.toEqual(churnRollback.assignments.asg1);
  });

  it("refuses an over-budget commit without persisting any of its roster", async () => {
    const repository = new FixtureRepository();
    await commit(repository, churnRollback.assignments.asg1, churnRollback.budgets.capTwo);

    await expect(
      commit(repository, churnRollback.assignments.asg2, churnRollback.budgets.capOne),
    ).resolves.toEqual(churnRollback.expected.capOneRefusal);
    expect(await activeId(repository, "A1")).toBe("asg-1");
    expect(await activeId(repository, "A6")).toBe("asg-1");
    expect(await activeId(repository, "A7")).toBeNull();
    await expect(repository.getSnapshot("asg-2")).resolves.toBeNull();
  });

  it("allows the same over-budget commit only with the recorded exception", async () => {
    const repository = new FixtureRepository();
    await commit(repository, churnRollback.assignments.asg1, churnRollback.budgets.capTwo);

    await expect(
      commit(repository, churnRollback.assignments.asg2, churnRollback.budgets.capOneWithException),
    ).resolves.toEqual(churnRollback.expected.capOneExceptionCommit);
    expect(await activeId(repository, "A7")).toBe("asg-2");
  });

  it("rolls back to the retained prior snapshot byte-for-byte", async () => {
    const repository = new FixtureRepository();
    await commit(repository, churnRollback.assignments.asg1, churnRollback.budgets.capTwo);
    await commit(repository, churnRollback.assignments.asg2, churnRollback.budgets.capTwo);

    const restored = await rollback(repository, "asg-2");

    expect(JSON.stringify(restored)).toBe(JSON.stringify(churnRollback.expected.restored));
    expect(await activeId(repository, "A6")).toBe("asg-1");
    expect(await activeId(repository, "A7")).toBeNull();
  });

  it("maps a duplicate-active refusal and leaves the repository unchanged", async () => {
    const repository = new FixtureRepository();
    await commit(repository, churnRollback.assignments.asg1, churnRollback.budgets.capTwo);

    await expect(
      commit(repository, churnRollback.assignments.asgDuplicate, churnRollback.budgets.capTwo),
    ).resolves.toEqual(churnRollback.expected.duplicateRefusal);
    expect(await activeId(repository, "A1")).toBe("asg-1");
    await expect(repository.getSnapshot("asg-dup")).resolves.toBeNull();
  });
});
