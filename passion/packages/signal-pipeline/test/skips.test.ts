import { describe, it, expect } from "vitest";
import { deriveSkips } from "../src/skips.js";
import { buildActionEvents } from "../src/actions.js";
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { Interaction, SurfacedRecord } from "../src/model.js";
import { DEFAULTS } from "../src/model.js";

const synth: Artifact = {
  id: "synth-01",
  domainPath: ["music-sound", "audio-systems"],
  affordedModes: ["perform", "build", "investigate"],
  kind: "gadget",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
};
const catalog = new Map([["synth-01", synth]]);

describe("deriveSkips", () => {
  it("non-novel surfaced-not-engaged on a PREVIOUSLY-ENGAGED cell → skip (on the engaged mode, not affordedModes[0])", () => {
    const ints: Interaction[] = [
      { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s0" }, // build, novelty
      { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-01-31T00:00:00.000Z", prompted: false, sessionId: "s1" }, // build, non-novel
    ];
    const { built } = buildActionEvents(ints, catalog, DEFAULTS);
    const surfaced: SurfacedRecord[] = [
      { kidId: "k", artifactId: "synth-01", sessionId: "s2", timestamp: "2026-02-15T00:00:00.000Z" }, // non-novel, build not engaged in s2 → skip
    ];
    const skips = deriveSkips(surfaced, built, catalog, DEFAULTS);
    expect(skips).toHaveLength(1);
    expect(skips[0]).toMatchObject({ mode: "build", kind: "skip", magnitude: 1, novelty: false });
  });
  it("no skip for an artifact the child never engaged", () => {
    const surfaced: SurfacedRecord[] = [{ kidId: "k", artifactId: "synth-01", sessionId: "s2", timestamp: "2026-02-15T00:00:00.000Z" }];
    expect(deriveSkips(surfaced, [], catalog, DEFAULTS)).toHaveLength(0);
  });
  it("no skip when the surfaced cell is still novel", () => {
    const ints: Interaction[] = [
      { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s0" }, // build, first exposure
    ];
    const { built } = buildActionEvents(ints, catalog, DEFAULTS);
    const surfaced: SurfacedRecord[] = [
      { kidId: "k", artifactId: "synth-01", sessionId: "s1", timestamp: "2026-01-02T00:00:00.000Z" }, // within novelty window → suppressed
    ];
    expect(deriveSkips(surfaced, built, catalog, DEFAULTS)).toHaveLength(0);
  });
  it("no skip when the surfaced cell WAS engaged in that same session", () => {
    const ints: Interaction[] = [
      { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s0" }, // build, novelty
      { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-15T00:00:00.000Z", prompted: false, sessionId: "s2" }, // build engaged in s2, non-novel
    ];
    const { built } = buildActionEvents(ints, catalog, DEFAULTS);
    const surfaced: SurfacedRecord[] = [
      { kidId: "k", artifactId: "synth-01", sessionId: "s2", timestamp: "2026-02-15T00:00:00.000Z" },
    ];
    expect(deriveSkips(surfaced, built, catalog, DEFAULTS)).toHaveLength(0);
  });
});
