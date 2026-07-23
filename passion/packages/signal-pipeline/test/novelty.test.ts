import { describe, it, expect } from "vitest";
import { buildFirstExposure, isNovelty } from "../src/novelty.js";
import { DEFAULTS } from "../src/model.js";

const key = "music-sound/audio-systems::build";
describe("novelty", () => {
  const idx = buildFirstExposure([
    { kidId: "k", cellKey: key, timestamp: "2026-01-01T00:00:00.000Z" },
    { kidId: "k", cellKey: key, timestamp: "2026-01-10T00:00:00.000Z" },
  ]);
  it("day 0 is novelty", () => {
    expect(isNovelty(idx, "k", key, "2026-01-01T00:00:00.000Z", DEFAULTS)).toBe(true);
  });
  it("within window is novelty", () => {
    expect(isNovelty(idx, "k", key, "2026-01-03T00:00:00.000Z", DEFAULTS)).toBe(true);
  });
  it("past window is not novelty", () => {
    expect(isNovelty(idx, "k", key, "2026-01-10T00:00:00.000Z", DEFAULTS)).toBe(false);
  });
});
