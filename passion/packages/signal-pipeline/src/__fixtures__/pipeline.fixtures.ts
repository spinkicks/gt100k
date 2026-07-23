import type { Artifact } from "@gt100k/two-axis-tagging";
import type { Interaction, SurfacedRecord } from "../model.js";

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
export const CATALOG: ReadonlyMap<string, Artifact> = new Map([["synth-01", synth]]);
export const NOW = Date.parse("2026-03-01T00:00:00.000Z");

export const INTERACTIONS: Interaction[] = [
  // first exposure (novelty; excluded downstream)
  { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s0" },
  // five non-novel voluntary returns clustered near NOW → enough mass for confidence after recency decay
  { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-20T00:00:00.000Z", prompted: false, sessionId: "s1" },
  { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-22T00:00:00.000Z", prompted: false, sessionId: "s2" },
  { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-24T00:00:00.000Z", prompted: false, sessionId: "s3" },
  { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-26T00:00:00.000Z", prompted: false, sessionId: "s4" },
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "assemble",
    timestamp: "2026-02-28T00:00:00.000Z",
    prompted: false,
    sessionId: "s5",
    depth: 1,
    depthSignals: [{ kind: "artifact_competence", value: 1 }],
  },
  // a prompted engagement (investigate cell) — excluded from voluntary belief
  { kidId: "k", artifactId: "synth-01", actionType: "inspect", timestamp: "2026-02-25T00:00:00.000Z", prompted: true, sessionId: "s6" },
];

// synth surfaced in a session where the build cell was NOT engaged, past novelty → a `skip` on build
export const SURFACED: SurfacedRecord[] = [
  { kidId: "k", artifactId: "synth-01", sessionId: "surf1", timestamp: "2026-02-27T00:00:00.000Z" },
];
