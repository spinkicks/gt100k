import { describe, expect, expectTypeOf, it } from "vitest";
import { benefitOf } from "../src/benefit";
import { generateCandidates } from "../src/candidates";
import { isFeasibleCohort } from "../src/constraints";
import type {
  CandidateSet,
  ChurnBudget,
  CohortAssignment,
  HardConstraints,
  LearnerProfile,
  ObjectiveWeights,
} from "../src/model";
import { type SolveResult, assignCohorts } from "../src/solver";
import { cohort12, cohort13Infeasible } from "./fixtures/cohort-12";

type AssignCohorts = (
  pool: LearnerProfile[],
  candidates: CandidateSet[],
  hard: HardConstraints,
  weights: ObjectiveWeights,
  churn: ChurnBudget,
  prior?: CohortAssignment,
) => SolveResult;

function solve(pool: LearnerProfile[]): SolveResult {
  return assignCohorts(
    pool,
    generateCandidates(pool, cohort12.caliper),
    cohort12.withBenefitOf(benefitOf),
    cohort12.weights,
    cohort12.churn,
  );
}

function membersFor(assignment: CohortAssignment, pool: LearnerProfile[]): LearnerProfile[][] {
  const byRef = new Map(pool.map((member) => [member.learnerRef, member]));

  return assignment.cohorts.map((cohort) =>
    cohort.members.map(({ ref }) => {
      const member = byRef.get(ref);

      if (!member) {
        throw new Error(`Assignment contains unknown learner ${ref}`);
      }

      return member;
    }),
  );
}

describe("assignCohorts (T013, SC-002/SC-006)", () => {
  it("returns Fixture B's exact partition and pinned role vector", () => {
    const result = solve(cohort12.pool);

    expect(result.assignment.cohorts.map((cohort) => cohort.members.map(({ ref }) => ref))).toEqual(
      cohort12.expected.cohortMemberRefs,
    );
    expect(
      result.assignment.cohorts.map((cohort) => cohort.members.map(({ role }) => role)),
    ).toEqual(cohort12.expected.cohortMemberRefs.map(() => cohort12.expected.roles));
    expect(result.unassigned).toEqual(cohort12.expected.unassigned);
  });

  it("accepts only six-member cohorts with zero hard-constraint violations", () => {
    const result = solve(cohort12.pool);
    const cohorts = membersFor(result.assignment, cohort12.pool);

    expect(cohorts).toHaveLength(2);
    for (const members of cohorts) {
      expect(members).toHaveLength(6);
      expect(isFeasibleCohort(members, result.assignment.constraints)).toEqual({
        ok: true,
        violations: [],
      });
    }
  });

  it("leaves Fixture B2's isolated learner unassigned with the binding age reason", () => {
    const result = solve(cohort13Infeasible.pool);

    expect(result.assignment.cohorts.map((cohort) => cohort.members.map(({ ref }) => ref))).toEqual(
      cohort13Infeasible.expected.cohortMemberRefs,
    );
    expect(result.unassigned).toEqual(cohort13Infeasible.expected.unassigned);
    expect(result.assignment.memberRefs).not.toContain("C1");
  });

  it("is byte-identical for repeated inputs and has no learned-model input or output", () => {
    expectTypeOf(assignCohorts).toEqualTypeOf<AssignCohorts>();

    const first = solve(cohort12.pool);
    const second = solve(cohort12.pool);
    const serialized = JSON.stringify(first);

    expect(serialized).toBe(JSON.stringify(second));
    expect(serialized).not.toMatch(/\"(?:lcb|shadow|learnedModel|benefitEstimator)\"/i);
  });

  it("does not strand learners when a complete feasible partition exists", () => {
    const refs = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
    const pool: LearnerProfile[] = refs.map((learnerRef) => ({
      learnerRef,
      ageBand: "a9_11",
      schedule: { blocks: ["x"] },
      accommodations: { needs: [], conflicts: [] },
      level: 0,
      velocity: 0,
      separations: learnerRef === "07" ? ["11"] : learnerRef === "11" ? ["07"] : [],
      priorAssignmentRef: null,
    }));
    const caliper = { levelTolerance: 0, velocityTolerance: 0, k: 20 };
    const churn = { weekKey: "2026-W30", cap: 99, used: 0, exceptions: [] };
    const hard: HardConstraints = {
      ...cohort12.hardConfig,
      caliper,
      churn,
      nonHarmFloor: 0,
      benefitOf: () => 1,
    };

    const witness = [
      ["01", "02", "03", "04", "11", "12"],
      ["05", "06", "07", "08", "09", "10"],
    ].map((group) => pool.filter((member) => group.includes(member.learnerRef)));
    expect(witness.every((group) => isFeasibleCohort(group, hard).ok)).toBe(true);

    const result = assignCohorts(
      pool,
      generateCandidates(pool, caliper),
      hard,
      cohort12.weights,
      churn,
    );

    expect(result.assignment.cohorts).toHaveLength(2);
    expect(result.unassigned).toEqual([]);
  });

  it("keeps repair within the assignment-level churn cap", () => {
    const prefixes = ["A", "B", "C", "D"];
    const negativePartners = Object.fromEntries(
      prefixes.map((prefix) => [
        `${prefix}1`,
        Array.from({ length: 5 }, (_, index) => `${prefix}${index + 2}`),
      ]),
    ) satisfies Record<string, string[]>;
    const pool: LearnerProfile[] = prefixes.flatMap((prefix) =>
      Array.from({ length: 6 }, (_, index) => {
        const learnerRef = `${prefix}${index + 1}`;
        const partners = negativePartners[learnerRef] ?? [];

        return {
          learnerRef,
          ageBand: "a9_11",
          schedule: { blocks: ["x"] },
          accommodations: { needs: [], conflicts: [] },
          level: 0,
          velocity: 0,
          separations: [],
          priorAssignmentRef: "prior",
          pairHistory: partners.map((ref) => ({ ref, flag: "negative" as const })),
        };
      }),
    );
    const caliper = { levelTolerance: 0, velocityTolerance: 0, k: 5 };
    const churn = { weekKey: "2026-W30", cap: 2, used: 0, exceptions: [] };
    const hard: HardConstraints = {
      ...cohort12.hardConfig,
      caliper,
      churn,
      nonHarmFloor: 0,
      benefitOf: () => 1,
    };
    const weights: ObjectiveWeights = {
      closePace: 0,
      compatibleIntensity: 0,
      roleCoverage: 0,
      pairHistory: 1,
      rivalryDose: 0,
      churn: 0,
      repeatedPairings: 0,
    };
    const candidates: CandidateSet[] = pool.map((member) => ({
      learnerRef: member.learnerRef,
      candidates: pool
        .filter(
          (peer) =>
            peer.learnerRef.startsWith(member.learnerRef[0] ?? "") &&
            peer.learnerRef !== member.learnerRef,
        )
        .map((peer) => ({ ref: peer.learnerRef, distance: 0 })),
      hash: `h-${member.learnerRef}`,
    }));
    const prior: CohortAssignment = {
      id: "prior",
      cohorts: prefixes.map((prefix) => ({
        members: Array.from({ length: 6 }, (_, index) => ({
          ref: `${prefix}${index + 1}`,
          role: "builder",
        })),
      })),
      memberRefs: pool.map(({ learnerRef }) => learnerRef),
      levelBands: { level: [0, 0], velocity: [0, 0] },
      candidateSetHash: "prior",
      objectiveTerms: {
        closePace: 0,
        compatibleIntensity: 0,
        roleCoverage: 0,
        pairHistory: 0,
        rivalryDose: 0,
        churn: 0,
        repeatedPairings: 0,
      },
      constraints: hard,
      start: "2026-07-20T00:00:00.000Z",
      plannedReview: "2026-07-27T00:00:00.000Z",
      priorAssignmentId: null,
      rollbackRef: null,
      sizeExceptions: [],
    };

    const result = assignCohorts(pool, candidates, hard, weights, churn, prior);
    const priorIndexes = new Map(
      prior.cohorts.flatMap((cohort, cohortIndex) =>
        cohort.members.map(({ ref }) => [ref, cohortIndex] as const),
      ),
    );
    const nextIndexes = new Map(
      result.assignment.cohorts.flatMap((cohort, cohortIndex) =>
        cohort.members.map(({ ref }) => [ref, cohortIndex] as const),
      ),
    );
    const changed = pool.filter(
      ({ learnerRef }) => priorIndexes.get(learnerRef) !== nextIndexes.get(learnerRef),
    ).length;

    expect(result.assignment.cohorts).toHaveLength(4);
    expect(result.unassigned).toEqual([]);
    expect(changed).toBeLessThanOrEqual(churn.cap);
  });

  it("revalidates the swapped cohorts before lexical cohort reordering", () => {
    const prefixes = ["A", "B", "C"];
    const pool: LearnerProfile[] = prefixes.flatMap((prefix) =>
      Array.from({ length: 6 }, (_, index) => {
        const learnerRef = `${prefix}${index + 1}`;
        const flagged = (prefix === "A" || prefix === "C") && index === 0;

        return {
          learnerRef,
          ageBand: "a9_11",
          schedule: { blocks: ["x"] },
          accommodations: { needs: [], conflicts: [] },
          level: 0,
          velocity: 0,
          separations: learnerRef === "C1" ? ["A2"] : [],
          priorAssignmentRef: null,
          pairHistory: flagged
            ? Array.from({ length: 5 }, (_, peerIndex) => ({
                ref: `${prefix}${peerIndex + 2}`,
                flag: "negative" as const,
              }))
            : [],
        };
      }),
    );
    const caliper = { levelTolerance: 0, velocityTolerance: 0, k: 5 };
    const churn = { weekKey: "2026-W30", cap: 99, used: 0, exceptions: [] };
    const hard: HardConstraints = {
      ...cohort12.hardConfig,
      caliper,
      churn,
      nonHarmFloor: 0,
      benefitOf: () => 1,
    };
    const weights: ObjectiveWeights = {
      closePace: 0,
      compatibleIntensity: 0,
      roleCoverage: 0,
      pairHistory: 1,
      rivalryDose: 0,
      churn: 0,
      repeatedPairings: 0,
    };
    const candidates: CandidateSet[] = pool.map((member) => ({
      learnerRef: member.learnerRef,
      candidates: pool
        .filter(
          (peer) =>
            peer.learnerRef.startsWith(member.learnerRef[0] ?? "") &&
            peer.learnerRef !== member.learnerRef,
        )
        .map((peer) => ({ ref: peer.learnerRef, distance: 0 })),
      hash: member.learnerRef,
    }));
    const result = assignCohorts(pool, candidates, hard, weights, churn);
    const emitted = membersFor(result.assignment, pool);

    expect(emitted).toHaveLength(3);
    expect(emitted.every((members) => isFeasibleCohort(members, hard).ok)).toBe(true);
  });
});
