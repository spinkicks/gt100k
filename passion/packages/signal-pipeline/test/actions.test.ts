import { describe, it, expect } from "vitest";
import { buildActionEvents } from "../src/actions.js";
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { Interaction } from "../src/model.js";
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
const catalog = new Map<string, Artifact>([["synth-01", synth]]);

describe("buildActionEvents", () => {
  it("builds a voluntary, non-novel BuiltEvent for a resolved engagement", () => {
    const ints: Interaction[] = [
      { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s1" },
      { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-01T00:00:00.000Z", prompted: false, sessionId: "s2", depth: 0.8 },
    ];
    const { built, dropped } = buildActionEvents(ints, catalog, DEFAULTS);
    expect(dropped).toHaveLength(0);
    expect(built).toHaveLength(2);
    expect(built[1]!.event.engagedModes.primary).toBe("build");
    expect(built[1]!.event.returnState).toBe("voluntary");
    expect(built[1]!.depth).toBe(0.8);
    expect(built[1]!.sessionId).toBe("s2");
    expect(built[1]!.cellKey).toBe("music-sound/audio-systems::build");
    expect(built[0]!.event.noveltyFlag).toBe(true); // first exposure
    expect(built[1]!.event.noveltyFlag).toBe(false); // past window
  });
  it("drops unknown artifact + unresolved action + invalid-for-artifact", () => {
    const ints: Interaction[] = [
      { kidId: "k", artifactId: "ghost", actionType: "assemble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s1" },
      { kidId: "k", artifactId: "synth-01", actionType: "wobble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s1" },
      { kidId: "k", artifactId: "synth-01", actionType: "write-melody", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s1" },
    ];
    const { built, dropped } = buildActionEvents(ints, catalog, DEFAULTS);
    expect(built).toHaveLength(0);
    expect(dropped.map((d) => d.reason)).toEqual(["unknown-artifact", "unresolved-action", "invalid-for-artifact"]);
  });
  it("returnState reflects interaction.prompted", () => {
    const ints: Interaction[] = [
      { kidId: "k", artifactId: "synth-01", actionType: "inspect", timestamp: "2026-01-01T00:00:00.000Z", prompted: true, sessionId: "s1" },
    ];
    const { built } = buildActionEvents(ints, catalog, DEFAULTS);
    expect(built).toHaveLength(1);
    expect(built[0]!.event.returnState).toBe("prompted");
    expect(built[0]!.event.engagedModes.primary).toBe("investigate");
  });
});
