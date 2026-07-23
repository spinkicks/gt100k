import { describe, it, expect } from "vitest";
import { deriveSignals } from "../src/pipeline.js";
import { runInference } from "@gt100k/interest-inference";
import { CATALOG, INTERACTIONS, SURFACED, NOW } from "../src/__fixtures__/pipeline.fixtures.js";

describe("deriveSignals", () => {
  it("produces a non-novel voluntary_return, a prompted_return, and a skip; and makes 011 confident on the build cell", () => {
    const { cellEvents, dropped } = deriveSignals({ interactions: INTERACTIONS, surfaced: SURFACED, catalog: CATALOG });
    expect(dropped).toHaveLength(0);
    expect(cellEvents.some((c) => c.mode === "build" && c.kind === "voluntary_return" && !c.novelty)).toBe(true);
    expect(cellEvents.some((c) => c.mode === "build" && c.kind === "voluntary_return" && c.novelty)).toBe(true); // the first-exposure return
    expect(cellEvents.some((c) => c.mode === "build" && c.kind === "artifact_competence")).toBe(true);
    expect(cellEvents.some((c) => c.mode === "investigate" && c.kind === "prompted_return")).toBe(true);
    expect(cellEvents.some((c) => c.mode === "build" && c.kind === "skip")).toBe(true);

    const read = runInference(cellEvents, [{ domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 }], NOW);
    const build = read.cells.find((c) => c.mode === "build");
    expect(build).toBeDefined();
    expect(build!.confident).toBe(true); // SC-6: the returned-to cell is actually confident
    expect(build!.supporting).toContain("voluntary_return");
    expect(read.candidates.some((c) => c.mode === "build")).toBe(true);
  });
});
