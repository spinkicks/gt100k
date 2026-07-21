import { describe, expect, it } from "vitest";

import { buildSyntheticCohortView } from "../components/synthetic-view.js";

describe("the synthetic Cohort Arena shell view", () => {
  it("builds one deterministic Fixture V1-shaped view for every renderer", () => {
    const first = buildSyntheticCohortView();
    const second = buildSyntheticCohortView();

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.constellation.hexes.map((hex) => hex.members.map(({ ref }) => ref))).toEqual([
      ["A1", "A2", "A3", "A4", "A5", "A6"],
      ["B1", "B2", "B3", "B4", "B5", "B6"],
    ]);
    expect(first.constellation.bench).toEqual([]);
    expect(first.cohorts).toHaveLength(2);

    for (const cohort of first.cohorts) {
      expect(cohort.members).toHaveLength(6);
      expect(cohort.badges).toHaveLength(7);
      expect(cohort.badges.every(({ satisfied }) => satisfied)).toBe(true);
      expect(cohort.nonHarmFloor).toEqual({
        minBenefit: 0.825,
        floor: 0.5,
        allAbove: true,
      });
    }

    expect(first.standings).toBeNull();
    expect(first.rivalry).toMatchObject({
      confidence: 1,
      suppressed: false,
      patterns: [
        {
          kind: "dominance",
          subjects: ["S1"],
          evidence: "S1 holds 4/6 turns (66.7%) > 50%",
        },
      ],
    });
    expect(
      first.rivalry?.seats.map(({ speaker, holdingFloor }) => ({ speaker, holdingFloor })),
    ).toEqual([
      { speaker: "S1", holdingFloor: false },
      { speaker: "S2", holdingFloor: false },
      { speaker: "S3", holdingFloor: false },
    ]);
    expect(first.ledger.cohortTree).toHaveLength(2);
    expect(first.ledger.rivalryList).toContain("dominance: S1 — S1 holds 4/6 turns (66.7%) > 50%");
  });
});
