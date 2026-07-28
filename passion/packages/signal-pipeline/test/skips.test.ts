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

/**
 * Something in another cabin, taken in every session where the synth is meant to read as passed
 * over.
 *
 * A session with no engagement now yields nothing at all (see `no-choice-no-decline.test.ts`), so
 * without this each case below would pass whether or not the rule under test worked. It affords one
 * mode and always has it engaged, so it never joins a not-chosen set.
 */
const loom: Artifact = {
  ...synth,
  id: "loom-01",
  domainPath: ["making-engineering", "textiles"],
  affordedModes: ["build"],
};

const catalog = new Map([
  ["synth-01", synth],
  ["loom-01", loom],
]);

const engage = (sessionId: string, timestamp: string, artifactId = "synth-01"): Interaction => ({
  kidId: "k",
  artifactId,
  actionType: "assemble",
  timestamp,
  prompted: false,
  sessionId,
});

const surface = (
  sessionId: string,
  timestamp: string,
  artifactId = "synth-01",
): SurfacedRecord => ({
  kidId: "k",
  artifactId,
  sessionId,
  timestamp,
});

const derive = (surfaced: SurfacedRecord[], ints: Interaction[]) =>
  deriveSkips(surfaced, buildActionEvents(ints, catalog, DEFAULTS).built, catalog, DEFAULTS);

describe("deriveSkips", () => {
  it("non-novel surfaced-not-engaged on a PREVIOUSLY-ENGAGED cell → skip (on the engaged mode, not affordedModes[0])", () => {
    const { events } = derive(
      [
        surface("s2", "2026-02-15T00:00:00.000Z"),
        surface("s2", "2026-02-15T00:00:00.000Z", "loom-01"),
      ],
      [
        engage("s0", "2026-01-01T00:00:00.000Z"), // build, novelty
        engage("s1", "2026-01-31T00:00:00.000Z"), // build, non-novel
        engage("s2", "2026-02-15T00:00:00.000Z", "loom-01"), // the choice s2's synth lost to
      ],
    );

    const build = events.filter((e) => e.mode === "build" && e.domainPath[0] === "music-sound");
    expect(build).toHaveLength(1);
    expect(build[0]).toMatchObject({ mode: "build", kind: "skip", novelty: false });
  });

  it("no skip for an artifact the child never engaged", () => {
    // The child chose the loom, so the session speaks; the synth's cells are declines, never skips,
    // because a skip requires a prior engagement with that cell.
    const { events } = derive(
      [
        surface("s0", "2026-01-01T00:00:00.000Z"),
        surface("s2", "2026-02-15T00:00:00.000Z"),
        surface("s2", "2026-02-15T00:00:00.000Z", "loom-01"),
      ],
      [engage("s2", "2026-02-15T00:00:00.000Z", "loom-01")],
    );

    expect(events.filter((e) => e.kind === "skip")).toHaveLength(0);
    expect(events.filter((e) => e.kind === "decline").length).toBeGreaterThan(0);
  });

  it("no skip when the surfaced cell is still novel", () => {
    // s1 takes the loom, so an empty result is the novelty window and not the no-choice rule.
    const { events } = derive(
      [
        surface("s1", "2026-01-02T00:00:00.000Z"),
        surface("s1", "2026-01-02T00:00:00.000Z", "loom-01"),
      ],
      [
        engage("s0", "2026-01-01T00:00:00.000Z"), // build, first exposure
        engage("s1", "2026-01-02T00:00:00.000Z", "loom-01"),
      ],
    );

    expect(events).toHaveLength(0);
  });

  it("no skip when the surfaced cell WAS engaged in that same session", () => {
    const { events } = derive(
      [surface("s2", "2026-02-15T00:00:00.000Z")],
      [
        engage("s0", "2026-01-01T00:00:00.000Z"), // build, novelty
        engage("s2", "2026-02-15T00:00:00.000Z"), // build engaged in s2, non-novel
      ],
    );

    expect(events.filter((e) => e.mode === "build")).toHaveLength(0);
  });

  it("reports the session it stayed silent on, rather than dropping it without trace", () => {
    const { events, silentSessions } = derive([surface("s2", "2026-02-15T00:00:00.000Z")], []);

    expect(events).toHaveLength(0);
    expect(silentSessions).toEqual(["s2"]);
  });
});
