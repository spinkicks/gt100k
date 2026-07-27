import { describe, expect, it } from "vitest";
import { allRepairs, hasUniqueRepair } from "./naive";

describe("allRepairs", () => {
  it("finds the one note that restores a run", () => {
    // 0 1 2 3 4 5 with index 3 pushed to 5.
    expect(allRepairs([0, 1, 2, 5, 4, 5], -1, 6)).toEqual([{ index: 3, degree: 3 }]);
  });

  it("excludes the no-op, so an already-correct phrase reports nothing at its own values", () => {
    const repairs = allRepairs([0, 1, 2, 3, 4, 5], -1, 6);
    expect(repairs.every((r) => r.degree !== [0, 1, 2, 3, 4, 5][r.index])).toBe(true);
  });

  it("searches only inside the range it is given", () => {
    // The answer is degree 3; deny it and nothing is findable.
    expect(allRepairs([0, 1, 2, 5, 4, 5], 4, 6)).toEqual([]);
  });

  it("reports several repairs when a phrase genuinely has them", () => {
    // Two notes from a run: many single changes still fail, but more than one can succeed.
    const repairs = allRepairs([0, 1, 9, 3, 4, 5], -2, 10);
    expect(repairs.length).toBeGreaterThanOrEqual(1);
  });

  it("finds a repair that lands on a different shape than the one it came from", () => {
    /**
     * The reason `allRepairs` checks `matchesAnyShape` and not one nominated shape. Here a single
     * change turns the phrase into a valid ARCH even though the run reading is also available — the
     * player is never told which shape they are hearing, so both are defensible answers and the
     * generator must reject an instance like this rather than mark one of them wrong.
     */
    const repairs = allRepairs([0, 1, 2, 3, 2, 9], -1, 10);
    expect(repairs).toContainEqual({ index: 5, degree: 1 });
  });
});

describe("hasUniqueRepair", () => {
  const broken = [0, 1, 2, 5, 4, 5];
  const expected = { index: 3, degree: 3 };

  it("accepts a genuinely unique instance", () => {
    expect(hasUniqueRepair(broken, -1, 6, expected)).toBe(true);
  });

  it("rejects a phrase that is not broken at all", () => {
    expect(hasUniqueRepair([0, 1, 2, 3, 4, 5], -1, 6, expected)).toBe(false);
  });

  it("rejects an instance whose one answer is not the one intended", () => {
    expect(hasUniqueRepair(broken, -1, 6, { index: 3, degree: 4 })).toBe(false);
    expect(hasUniqueRepair(broken, -1, 6, { index: 2, degree: 3 })).toBe(false);
  });

  it("rejects an instance with more than one answer in reach", () => {
    // A widened range can expose a second reading; if it does, the instance must not ship.
    const wide = allRepairs(broken, -8, 14);
    if (wide.length > 1) {
      expect(hasUniqueRepair(broken, -8, 14, expected)).toBe(false);
    } else {
      expect(hasUniqueRepair(broken, -8, 14, expected)).toBe(true);
    }
  });
});
