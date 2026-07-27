import { describe, it, expect } from "vitest";
import { deriveSignals } from "../src/pipeline.js";
import { runInference } from "@gt100k/interest-inference";
import { CATALOG, INTERACTIONS, SURFACED, NOW } from "../src/__fixtures__/pipeline.fixtures.js";

describe("deriveSignals", () => {
  it("produces a non-novel cross_day_return, a prompted_return, and a skip; and makes 011 confident on the build cell", () => {
    const { cellEvents, dropped } = deriveSignals({
      interactions: INTERACTIONS,
      surfaced: SURFACED,
      catalog: CATALOG,
    });
    expect(dropped).toHaveLength(0);
    expect(
      cellEvents.some((c) => c.mode === "build" && c.kind === "cross_day_return" && !c.novelty),
    ).toBe(true);
    // The first exposure has no earlier-day predecessor, so it is a same_day_engagement (and novel).
    expect(
      cellEvents.some((c) => c.mode === "build" && c.kind === "same_day_engagement" && c.novelty),
    ).toBe(true);
    expect(cellEvents.some((c) => c.mode === "build" && c.kind === "artifact_competence")).toBe(
      true,
    );
    expect(cellEvents.some((c) => c.mode === "investigate" && c.kind === "prompted_return")).toBe(
      true,
    );
    expect(cellEvents.some((c) => c.mode === "build" && c.kind === "skip")).toBe(true);
    // Every cross-day return in this log is two days after the last one except the first, which
    // follows the 2026-01-01 exposure.
    expect(cellEvents.filter((c) => c.kind === "cross_day_return").map((c) => c.dayGap)).toEqual([
      40, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    ]);

    const read = runInference(
      cellEvents,
      [{ domain: "music-sound", inEnvironment: true, masteryTilt: 0, discretionaryTilt: 0 }],
      NOW,
    );
    const build = read.cells.find((c) => c.mode === "build");
    expect(build).toBeDefined();
    expect(build!.confident).toBe(true); // SC-6: the returned-to cell is actually confident
    expect(build!.supporting).toContain("cross_day_return");
    expect(read.candidates.some((c) => c.mode === "build")).toBe(true);
  });
});
