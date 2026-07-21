import { describe, expect, it } from "vitest";
import { benefitOf } from "../src/benefit";
import { isFeasibleCohort } from "../src/constraints";
import type { LearnerProfile, ObjectiveWeights } from "../src/model";
import { scoreObjective } from "../src/objective";
import { churnRollback } from "./fixtures/churn-rollback";
import { cohort12 } from "./fixtures/cohort-12";

const equalWeights = {
  closePace: 1,
  compatibleIntensity: 1,
  roleCoverage: 1,
  pairHistory: 1,
  rivalryDose: 1,
  churn: 1,
  repeatedPairings: 1,
} satisfies ObjectiveWeights;

function objectiveMembers(): LearnerProfile[] {
  const preferences = [
    { preferredRole: "anchor", workingRhythm: "steady" },
    { preferredRole: "scout", workingRhythm: "steady" },
    { preferredRole: "builder", workingRhythm: "flex" },
    { preferredRole: "challenger", workingRhythm: "burst" },
    { preferredRole: "scribe", workingRhythm: "burst" },
    { preferredRole: "builder", workingRhythm: "flex" },
  ] as const;

  return cohort12.pool.slice(0, 6).map((member, index) => ({
    ...member,
    ...preferences[index],
    pairHistory: member.learnerRef === "A1" ? [{ ref: "A2", flag: "positive" as const }] : [],
  }));
}

describe("scoreObjective (T012, FR-013)", () => {
  it("returns all seven normalized terms and their weighted total", () => {
    const result = scoreObjective(objectiveMembers(), equalWeights);

    expect(result.terms).toEqual({
      closePace: 1 / 3,
      compatibleIntensity: 11 / 15,
      roleCoverage: 1,
      pairHistory: 8 / 15,
      rivalryDose: 1,
      churn: 1,
      repeatedPairings: 14 / 15,
    });
    expect(result.total).toBeCloseTo(83 / 15, 12);
    expect(Object.values(result.terms).every((term) => term >= 0 && term <= 1)).toBe(true);
  });

  it("is deterministic and independent of member input order", () => {
    const members = objectiveMembers();
    const first = scoreObjective(members, equalWeights);
    const second = scoreObjective([...members].reverse(), equalWeights);

    expect(second).toEqual(first);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it("rewards a positive prior pairing more than a negative one", () => {
    const positive = objectiveMembers();
    const negative = positive.map((member) =>
      member.learnerRef === "A1"
        ? { ...member, pairHistory: [{ ref: "A2", flag: "negative" as const }] }
        : member,
    );

    expect(scoreObjective(positive, equalWeights).terms.pairHistory).toBe(8 / 15);
    expect(scoreObjective(negative, equalWeights).terms.pairHistory).toBe(7 / 15);
  });

  it("ranks lower churn higher against the prior assignment", () => {
    const unchanged = churnRollback.pool.filter(({ learnerRef }) => learnerRef !== "A7");
    const swapped = churnRollback.pool.filter(({ learnerRef }) => learnerRef !== "A6");
    const unchangedScore = scoreObjective(unchanged, equalWeights, churnRollback.assignments.asg1);
    const swappedScore = scoreObjective(swapped, equalWeights, churnRollback.assignments.asg1);

    expect(unchangedScore.terms.churn).toBe(1);
    expect(swappedScore.terms.churn).toBe(1 / 3);
    expect(unchangedScore.total).toBeGreaterThan(swappedScore.total);
  });

  it("uses the hard gate before ranking even when an infeasible option scores higher", () => {
    const feasible = cohort12.pool.slice(0, 6);
    const infeasible = feasible.map((member) =>
      member.learnerRef === "A5" ? { ...member, ageBand: "a12_14" as const, velocity: 10 } : member,
    );
    const closePaceOnly = {
      closePace: 1,
      compatibleIntensity: 0,
      roleCoverage: 0,
      pairHistory: 0,
      rivalryDose: 0,
      churn: 0,
      repeatedPairings: 0,
    } satisfies ObjectiveWeights;
    const hard = cohort12.withBenefitOf(benefitOf);

    expect(scoreObjective(infeasible, closePaceOnly).total).toBeGreaterThan(
      scoreObjective(feasible, closePaceOnly).total,
    );
    expect(isFeasibleCohort(infeasible, hard).ok).toBe(false);

    const selected = [infeasible, feasible]
      .filter((members) => isFeasibleCohort(members, hard).ok)
      .sort(
        (left, right) =>
          scoreObjective(right, closePaceOnly).total - scoreObjective(left, closePaceOnly).total,
      )[0];

    expect(selected).toBe(feasible);
  });
});
