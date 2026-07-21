import { describe, expect, it } from "vitest";
import type { CohortAssignment } from "../../../packages/cohort-compiler/src/model";
import type { CohortRepository } from "../../../packages/cohort-compiler/src/ports";
import { churnRollback } from "../../../packages/cohort-compiler/test/fixtures/churn-rollback";
import { InMemoryCohortRepository } from "../src/index";

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

describe("InMemoryCohortRepository (T014, FR-011/FR-015)", () => {
  it("commits a whole roster and supersedes its prior active roster", async () => {
    const repository: CohortRepository = new InMemoryCohortRepository();
    const asg1 = cloneAssignment(churnRollback.assignments.asg1);
    const asg2 = cloneAssignment(churnRollback.assignments.asg2);

    await repository.commitAtomic(asg1);
    await expect(repository.activeFor("A1")).resolves.toEqual(asg1);
    await expect(repository.activeFor("A7")).resolves.toBeNull();

    await repository.commitAtomic(asg2);
    await expect(repository.activeFor("A1")).resolves.toEqual(asg2);
    await expect(repository.activeFor("A6")).resolves.toBeNull();
    await expect(repository.activeFor("A7")).resolves.toEqual(asg2);
    await expect(repository.getSnapshot("asg-1")).resolves.toEqual(asg1);
  });

  it("rejects a duplicate-active roster without persisting any part of it", async () => {
    const repository: CohortRepository = new InMemoryCohortRepository();
    const asg1 = cloneAssignment(churnRollback.assignments.asg1);
    const conflicting = cloneAssignment(churnRollback.assignments.asg2);
    conflicting.id = "asg-conflict";
    conflicting.priorAssignmentId = null;
    conflicting.rollbackRef = null;
    conflicting.memberRefs = ["A7", "A1", "A2", "A3", "A4", "A5"];
    conflicting.cohorts[0] = {
      members: conflicting.memberRefs.map((ref, index) => ({
        ref,
        role: conflicting.cohorts[0]?.members[index]?.role ?? "builder",
      })),
    };

    await repository.commitAtomic(asg1);

    await expect(repository.commitAtomic(conflicting)).rejects.toThrow(
      "duplicate-active-assignment",
    );
    await expect(repository.activeFor("A7")).resolves.toBeNull();
    await expect(repository.activeFor("A1")).resolves.toEqual(asg1);
    await expect(repository.getSnapshot("asg-conflict")).resolves.toBeNull();
  });

  it("restores the exact retained prior snapshot as one atomic roster", async () => {
    const repository: CohortRepository = new InMemoryCohortRepository();
    const asg1 = cloneAssignment(churnRollback.assignments.asg1);
    const asg2 = cloneAssignment(churnRollback.assignments.asg2);

    await repository.commitAtomic(asg1);
    await repository.commitAtomic(asg2);

    const restored = await repository.restore("asg-2");
    expect(restored).toEqual(asg1);
    restored.memberRefs[0] = "MUTATED-RESTORE-READ";
    await expect(repository.activeFor("A1")).resolves.toEqual(asg1);
    await expect(repository.activeFor("A6")).resolves.toEqual(asg1);
    await expect(repository.activeFor("A7")).resolves.toBeNull();
    await expect(repository.getSnapshot("asg-2")).resolves.toEqual(asg2);
  });

  it("deep-copies assignments across every write and read boundary", async () => {
    const repository: CohortRepository = new InMemoryCohortRepository();
    const expected = cloneAssignment(churnRollback.assignments.asg1);
    const input = cloneAssignment(expected);

    await repository.commitAtomic(input);
    input.memberRefs[0] = "MUTATED-INPUT";
    if (input.cohorts[0]?.members[0]) {
      input.cohorts[0].members[0].ref = "MUTATED-INPUT";
    }

    const firstRead = await repository.getSnapshot("asg-1");
    expect(firstRead).toEqual(expected);
    if (!firstRead) {
      throw new Error("Expected retained asg-1 snapshot");
    }
    firstRead.memberRefs[0] = "MUTATED-READ";
    if (firstRead.cohorts[0]?.members[0]) {
      firstRead.cohorts[0].members[0].ref = "MUTATED-READ";
    }

    const activeRead = await repository.activeFor("A1");
    expect(activeRead).toEqual(expected);
    if (!activeRead) {
      throw new Error("Expected active asg-1 assignment");
    }
    activeRead.memberRefs[0] = "MUTATED-ACTIVE-READ";

    await expect(repository.getSnapshot("asg-1")).resolves.toEqual(expected);
    await expect(repository.activeFor("A1")).resolves.toEqual(expected);
  });
});
