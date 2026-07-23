import { describe, expect, it } from "vitest";
import { CABINS, type CabinId } from "@gt100k/two-axis-tagging";
import {
  SUBJECT_CABIN_CROSSWALK,
  crosswalkFor,
  explainPriors,
} from "../src/index.js";
import type { TimeBackSnapshot } from "../src/index.js";

const CABIN_SET = new Set<string>(CABINS);

describe("crosswalkFor", () => {
  it("maps math to math-puzzles with weight 1", () => {
    const rows = crosswalkFor("math");
    expect(rows).toContainEqual({ cabin: "math-puzzles", weight: 1 });
  });

  it("returns [] for an unknown subject (graceful, no throw)", () => {
    expect(() => crosswalkFor("underwater-basket-weaving")).not.toThrow();
    expect(crosswalkFor("underwater-basket-weaving")).toEqual([]);
  });
});

describe("SUBJECT_CABIN_CROSSWALK", () => {
  it("only references valid CabinIds", () => {
    for (const rows of Object.values(SUBJECT_CABIN_CROSSWALK)) {
      for (const row of rows) {
        expect(CABIN_SET.has(row.cabin)).toBe(true);
        expect(row.weight).toBeGreaterThan(0);
        expect(row.weight).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("explainPriors", () => {
  const snapshot: TimeBackSnapshot = {
    kidId: "kid-x",
    asOf: "2026-04-01T00:00:00.000Z",
    subjects: [
      { subject: "math", mastery: 0.8, discretionaryXp: 10, offered: true },
      { subject: "music", mastery: 0.4, discretionaryXp: 5, offered: false },
    ],
  };

  it("lists offered contributing subjects per cabin", () => {
    const provenance = explainPriors(snapshot);
    expect(provenance.get("math-puzzles" as CabinId)).toEqual(["math"]);
  });

  it("omits cabins with no offered contributor", () => {
    const provenance = explainPriors(snapshot);
    // music is offered:false → music-sound has no offered contributor.
    expect(provenance.has("music-sound" as CabinId)).toBe(false);
  });
});
