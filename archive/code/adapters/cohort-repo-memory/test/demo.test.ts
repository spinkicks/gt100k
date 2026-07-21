import { describe, expect, it } from "vitest";
import { turnsFixtures } from "../../../packages/cohort-compiler/test/fixtures/turns";
import { runCohortCompilerDemo } from "../src/demo";

describe("cohort compiler synthetic demo (T035, SC-001..SC-008)", () => {
  it("walks the quickstart flow without live data or production I/O", async () => {
    const result = await runCohortCompilerDemo();

    expect(result.source).toBe("synthetic");
    expect(result.candidates).toEqual({
      poolSize: 13,
      setCount: 13,
      deterministic: true,
      allWithinCaliper: true,
      excludesSelf: true,
    });
    expect(result.solve).toEqual({
      assignmentId: "asg-388b3ea8",
      cohortMemberRefs: [
        ["A1", "A2", "A3", "A4", "A6", "A7"],
        ["B1", "B2", "B3", "B4", "B5", "B6"],
      ],
      unassignedRefs: ["A5"],
      allCohortsFeasible: true,
    });
    expect(result.lifecycle).toEqual({
      initialCommit: {
        ok: true,
        assignmentId: "asg-388b3ea8",
        priorAssignmentId: null,
        reasons: [],
      },
      repairChurn: 2,
      repairCommit: {
        ok: true,
        assignmentId: "asg-388b3ea8-repair",
        priorAssignmentId: "asg-388b3ea8",
        reasons: [],
      },
      guideVeto: {
        opensAt: "2026-07-20T00:00:00.000Z",
        closesAt: "2026-07-27T00:00:00.000Z",
      },
      oneClickRollback: { assignmentId: "asg-388b3ea8-repair" },
      restoredAssignmentId: "asg-388b3ea8",
      restoredByteIdentical: true,
      activeAssignmentAfterRollback: "asg-388b3ea8",
    });
    expect(result.safeguarding).toEqual({
      pendingCount: 1,
      pausedMoveIds: ["mv-1"],
      untouchedMoveIds: ["mv-2"],
      assignmentUnchanged: true,
    });
    expect(result.shadowBenefit).toEqual({
      assignmentId: "asg-388b3ea8",
      lcb: 0,
      loggedAt: "2026-07-20T12:00:00Z",
      shadow: true,
    });
    expect(result.rivalryMix).toEqual(turnsFixtures.dominance.expected.analysis);

    const encoded = JSON.stringify(result);
    for (const forbidden of ["honesty", "emotion", "personality", "motivation", "rank"]) {
      expect(encoded).not.toContain(`\"${forbidden}\"`);
    }
  });
});
