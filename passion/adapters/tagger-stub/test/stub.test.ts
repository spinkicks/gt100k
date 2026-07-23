import { describe, it, expect } from "vitest";
import { StubTagger } from "../src/index.js";

describe("StubTagger", () => {
  it("returns a deterministic seeded suggestion", async () => {
    const t = new StubTagger({
      "synth-01": {
        domainPath: ["music-sound", "audio-systems"],
        affordedModes: ["perform", "build"],
        confidence: 0.9,
        rationale: "seed",
      },
    });
    const s = await t.suggest({ id: "synth-01", kind: "gadget", label: "Synth" });
    expect(s.domainPath).toEqual(["music-sound", "audio-systems"]);
    expect(s.confidence).toBe(0.9);
  });
  it("falls back deterministically for unknown refs", async () => {
    const t = new StubTagger({});
    const s = await t.suggest({ id: "x", kind: "resource", label: "Whatever" });
    expect(s.confidence).toBe(0);
    expect(s.affordedModes.length).toBeGreaterThan(0);
  });
});
