import { describe, expect, it } from "vitest";
import { benefitOf } from "../src/benefit";
import { isFeasibleCohort } from "../src/constraints";
import type { CohortAssignment, HardConstraints, LearnerProfile } from "../src/model";
import { churnRollback } from "./fixtures/churn-rollback";
import { cohort12, nonHarmDefaultBind, nonHarmReject } from "./fixtures/cohort-12";

function hardConstraints(overrides: Partial<HardConstraints> = {}): HardConstraints {
  return {
    ...cohort12.withBenefitOf(benefitOf),
    ...overrides,
  };
}

function replaceMember(
  members: LearnerProfile[],
  learnerRef: string,
  replace: (member: LearnerProfile) => LearnerProfile,
): LearnerProfile[] {
  return members.map((member) => (member.learnerRef === learnerRef ? replace(member) : member));
}

function expectOnlyConstraint(
  members: LearnerProfile[],
  constraint: string,
  hard = hardConstraints(),
  prior: CohortAssignment | undefined = undefined,
): void {
  const result = isFeasibleCohort(members, hard, prior);

  expect(result.ok).toBe(false);
  expect(result.violations).toHaveLength(1);
  expect(result.violations[0]).toEqual(expect.objectContaining({ constraint }));
}

describe("benefitOf (T040, FR-009)", () => {
  it("matches every Fixture B4 default-formula golden value", () => {
    const values = Object.fromEntries(
      nonHarmDefaultBind.members.map((member) => [
        member.learnerRef,
        benefitOf(member, nonHarmDefaultBind.members),
      ]),
    );

    for (const [learnerRef, expected] of Object.entries(nonHarmDefaultBind.expected.benefitByRef)) {
      expect(Math.abs((values[learnerRef] ?? Number.NaN) - expected)).toBeLessThanOrEqual(
        nonHarmDefaultBind.expected.tolerance,
      );
    }

    const computedValues = Object.values(values);
    const mean = computedValues.reduce((sum, value) => sum + value, 0) / computedValues.length;
    expect(mean).toBeCloseTo(nonHarmDefaultBind.expected.meanBenefit, 12);
    expect(
      benefitOf(
        nonHarmDefaultBind.boundaryMembers[5] as LearnerProfile,
        nonHarmDefaultBind.boundaryMembers,
      ),
    ).toBeCloseTo(nonHarmDefaultBind.expected.boundaryBenefit, 12);
  });

  it("is bounded and independent of private level and velocity bands", () => {
    const shifted = nonHarmDefaultBind.members.map((member, index) => ({
      ...member,
      level: member.level + 100 * (index + 1),
      velocity: member.velocity - 100 * (index + 1),
    }));

    const originalValues = nonHarmDefaultBind.members.map((member) =>
      benefitOf(member, nonHarmDefaultBind.members),
    );
    const shiftedValues = shifted.map((member) => benefitOf(member, shifted));

    expect(shiftedValues).toEqual(originalValues);
    for (const value of originalValues) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});

describe("isFeasibleCohort (T011, SC-002)", () => {
  const feasibleMembers = cohort12.pool.slice(0, 6);

  it("rejects an age-band violation independently", () => {
    const members = replaceMember(feasibleMembers, "A6", (member) => ({
      ...member,
      ageBand: "a12_14",
    }));

    expectOnlyConstraint(members, "age");
  });

  it("rejects a pair with no shared schedule block independently", () => {
    const members = replaceMember(feasibleMembers, "A6", (member) => ({
      ...member,
      schedule: { blocks: ["fri-am"] },
    }));

    expectOnlyConstraint(members, "schedule");
  });

  it("rejects a safeguarding separation independently", () => {
    const members = replaceMember(feasibleMembers, "A1", (member) => ({
      ...member,
      separations: ["A2"],
    }));

    expectOnlyConstraint(members, "safeguarding_separation");
  });

  it("rejects only a mutual accommodation block independently", () => {
    const withFirstBlock = replaceMember(feasibleMembers, "A1", (member) => ({
      ...member,
      accommodations: { needs: ["quiet"], conflicts: ["bright"] },
    }));
    const members = replaceMember(withFirstBlock, "A2", (member) => ({
      ...member,
      accommodations: { needs: ["bright"], conflicts: ["quiet"] },
    }));

    expectOnlyConstraint(members, "accommodations", hardConstraints({ benefitOf: () => 1 }));
  });

  it("allows a one-directional accommodation block", () => {
    const members = replaceMember(feasibleMembers, "A1", (member) => ({
      ...member,
      accommodations: { needs: ["quiet"], conflicts: [] },
    })).map((member) =>
      member.learnerRef === "A2"
        ? { ...member, accommodations: { needs: [], conflicts: ["quiet"] } }
        : member,
    );

    expect(isFeasibleCohort(members, hardConstraints({ benefitOf: () => 1 }))).toEqual({
      ok: true,
      violations: [],
    });
  });

  it("rejects a level-velocity caliper violation independently", () => {
    const members = replaceMember(feasibleMembers, "A6", (member) => ({
      ...member,
      level: 20,
    }));

    expectOnlyConstraint(members, "level_velocity_caliper");
  });

  it("rejects Fixture B3 per member despite its passing mean and includes the boundary", () => {
    const benefits = nonHarmReject.members.map((member) => nonHarmReject.hard.benefitOf(member));

    expect(benefits.reduce((sum, value) => sum + value, 0) / benefits.length).toBeCloseTo(
      nonHarmReject.expected.meanBenefit,
      12,
    );
    expect(isFeasibleCohort(nonHarmReject.members, nonHarmReject.hard)).toEqual(
      nonHarmReject.expected.rejected,
    );
    expect(isFeasibleCohort(nonHarmReject.members, nonHarmReject.boundaryHard)).toEqual(
      nonHarmReject.expected.boundary,
    );
  });

  it("rejects Fixture B4 on the default per-member floor and accepts its control", () => {
    const hard = nonHarmDefaultBind.withBenefitOf(benefitOf);
    const values = nonHarmDefaultBind.members.map((member) =>
      benefitOf(member, nonHarmDefaultBind.members),
    );

    expect(values.reduce((sum, value) => sum + value, 0) / values.length).toBeCloseTo(
      nonHarmDefaultBind.expected.meanBenefit,
      12,
    );
    expect(isFeasibleCohort(nonHarmDefaultBind.members, hard)).toEqual(
      nonHarmDefaultBind.expected.rejected,
    );
    expect(isFeasibleCohort(nonHarmDefaultBind.boundaryMembers, hard)).toEqual(
      nonHarmDefaultBind.expected.boundary,
    );
  });

  it("rejects a churn-budget violation independently", () => {
    const members = churnRollback.pool.filter(({ learnerRef }) => learnerRef !== "A6");

    expectOnlyConstraint(
      members,
      "churn_budget",
      hardConstraints({
        benefitOf: () => 1,
        churn: churnRollback.budgets.capOne,
      }),
      churnRollback.assignments.asg1,
    );
  });
});
