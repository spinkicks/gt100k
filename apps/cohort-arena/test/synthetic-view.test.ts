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
    expect(first.rivalry).toBeNull();
    expect(first.ledger.cohortTree).toHaveLength(2);
  });
});
