import { describe, it, expect } from "vitest";
import { serializeCellKey, recencyWeight, HALFLIFE_DAYS, isDepthFamily } from "../src/model.js";

describe("model", () => {
  it("serializes cell keys", () => {
    expect(serializeCellKey(["music-sound", "audio-systems"], "build")).toBe(
      "music-sound/audio-systems::build",
    );
    expect(serializeCellKey(["math-puzzles"], "investigate")).toBe("math-puzzles::investigate");
  });
  it("recency weight halves every HALFLIFE_DAYS and is 1 at age 0", () => {
    const now = Date.parse("2026-01-15T00:00:00.000Z");
    expect(recencyWeight(now, "2026-01-15T00:00:00.000Z")).toBeCloseTo(1, 6);
    const halfLifeAgo = new Date(now - HALFLIFE_DAYS * 86400000).toISOString();
    expect(recencyWeight(now, halfLifeAgo)).toBeCloseTo(0.5, 6);
  });
  it("depth-family guard", () => {
    expect(isDepthFamily("artifact_competence")).toBe(true);
    expect(isDepthFamily("voluntary_return")).toBe(false);
  });
});
