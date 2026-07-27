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

/**
 * Ten non-novel voluntary returns, every other day across the three weeks before NOW.
 *
 * It was five returns over ten days, which carried enough mass under the old `MIN_EVIDENCE_MASS`
 * of 3. E6 raised the floor to 6 and recency decay eats most of what a fortnight-old return is
 * worth, so five is no longer a confident child — it is a child we should still be saying "not
 * sure yet" about. Lengthening the habit rather than stacking a single day keeps the fixture
 * exercising what it was written for: the every-other-day rhythm, the novelty exclusion on the
 * first exposure, the prompted engagement, and the skip.
 */
export const INTERACTIONS: Interaction[] = [
  // first exposure (novelty; excluded downstream)
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "assemble",
    timestamp: "2026-01-01T00:00:00.000Z",
    prompted: false,
    sessionId: "s0",
  },
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "assemble",
    timestamp: "2026-02-10T00:00:00.000Z",
    prompted: false,
    sessionId: "s1",
  },
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "assemble",
    timestamp: "2026-02-12T00:00:00.000Z",
    prompted: false,
    sessionId: "s2",
  },
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "assemble",
    timestamp: "2026-02-14T00:00:00.000Z",
    prompted: false,
    sessionId: "s3",
  },
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "assemble",
    timestamp: "2026-02-16T00:00:00.000Z",
    prompted: false,
    sessionId: "s4",
  },
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "assemble",
    timestamp: "2026-02-18T00:00:00.000Z",
    prompted: false,
    sessionId: "s5",
  },
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "assemble",
    timestamp: "2026-02-20T00:00:00.000Z",
    prompted: false,
    sessionId: "s6",
  },
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "assemble",
    timestamp: "2026-02-22T00:00:00.000Z",
    prompted: false,
    sessionId: "s7",
  },
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "assemble",
    timestamp: "2026-02-24T00:00:00.000Z",
    prompted: false,
    sessionId: "s8",
  },
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "assemble",
    timestamp: "2026-02-26T00:00:00.000Z",
    prompted: false,
    sessionId: "s9",
  },
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "assemble",
    timestamp: "2026-02-28T00:00:00.000Z",
    prompted: false,
    sessionId: "s10",
    depthSignals: [{ kind: "artifact_competence", value: 1 }],
  },
  // a prompted engagement (investigate cell) — excluded from voluntary belief
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "inspect",
    timestamp: "2026-02-25T00:00:00.000Z",
    prompted: true,
    sessionId: "s11",
  },
  // The child plays the synth in surf1 rather than assembling it, which is what makes surf1's build
  // cell a pass-over rather than an absence: a session with no engagement at all now yields nothing
  // (see `no-choice-no-decline.test.ts`), so without this the skip below would simply vanish.
  //
  // `play` resolves to `perform`, deliberately. Engaging `investigate` here would work too, but it
  // would land two days after the prompted inspect and so add an eleventh cross-day return to a
  // fixture whose day-gap sequence is one of the things under test. `perform` has no history, so it
  // reads as a novel same-day engagement and leaves that sequence alone.
  {
    kidId: "k",
    artifactId: "synth-01",
    actionType: "play",
    timestamp: "2026-02-27T00:00:00.000Z",
    prompted: false,
    sessionId: "surf1",
  },
];

// synth surfaced in a session where the build cell was NOT engaged, past novelty → a `skip` on build
export const SURFACED: SurfacedRecord[] = [
  { kidId: "k", artifactId: "synth-01", sessionId: "surf1", timestamp: "2026-02-27T00:00:00.000Z" },
];
