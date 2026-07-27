import { describe, it, expect } from "vitest";
import { deriveSkips } from "../src/skips.js";
import { buildActionEvents } from "../src/actions.js";
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { Interaction, SurfacedRecord } from "../src/model.js";
import { DEFAULTS } from "../src/model.js";

// One artifact affording three modes → three cells on offer whenever it is surfaced. `assemble`
// resolves to `build`, so the other two are only ever offered, never engaged.
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
 * Something in another cabin for the child to actually take, in the sessions where the point is
 * that they took nothing from the synth.
 *
 * A session with no engagement at all now yields nothing (see `no-choice-no-decline.test.ts`), so
 * "passed the synth over" is only expressible if the child was demonstrably choosing. It affords
 * exactly one mode and that mode is always engaged, which keeps it out of every not-chosen set and
 * leaves the choice-set sizes below reading as the synth's own three cells.
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

const engage = (
  sessionId: string,
  timestamp: string,
  artifactId = "synth-01",
): Interaction => ({
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

// s0: first sight, build engaged. s1: build engaged again. s2: the loom is taken and the synth is
// not, which is what makes s2 a pass-over rather than an absence.
const INTERACTIONS: Interaction[] = [
  engage("s0", "2026-01-01T00:00:00.000Z"),
  engage("s1", "2026-02-01T00:00:00.000Z"),
  engage("s2", "2026-03-01T00:00:00.000Z", "loom-01"),
];
const SURFACED: SurfacedRecord[] = [
  surface("s0", "2026-01-01T00:00:00.000Z"),
  surface("s1", "2026-02-01T00:00:00.000Z"),
  surface("s2", "2026-03-01T00:00:00.000Z"),
  surface("s2", "2026-03-01T00:00:00.000Z", "loom-01"),
];

const derive = (interactions: Interaction[], surfaced: SurfacedRecord[]) =>
  deriveSkips(surfaced, buildActionEvents(interactions, catalog, DEFAULTS).built, catalog, DEFAULTS)
    .events;

describe("deriveSkips — declines (E4)", () => {
  it("a cell engaged in the session is neither skipped nor declined", () => {
    const events = derive(INTERACTIONS, SURFACED);
    // build is taken in s0 and s1, so it appears only for s2.
    const build = events.filter((e) => e.mode === "build");
    expect(build).toHaveLength(1);
    expect(build[0]!.timestamp).toBe("2026-03-01T00:00:00.000Z");
  });

  it("a previously-engaged, surfaced, unengaged cell yields exactly one skip and no decline", () => {
    const build = derive(INTERACTIONS, SURFACED).filter((e) => e.mode === "build");
    expect(build.map((e) => e.kind)).toEqual(["skip"]);
  });

  it("a never-engaged surfaced cell yields a decline", () => {
    const events = derive(INTERACTIONS, SURFACED);
    const never = events.filter((e) => e.mode === "perform" || e.mode === "investigate");
    expect(never.map((e) => e.kind)).toEqual(["decline", "decline", "decline", "decline"]);
    // Their novelty clock starts when they were first put on offer (2026-01-01), not when they
    // were engaged — they never were — so the s0 surfacing itself is inside the window.
    expect(new Set(never.map((e) => e.timestamp))).toEqual(
      new Set(["2026-02-01T00:00:00.000Z", "2026-03-01T00:00:00.000Z"]),
    );
  });

  it("every event from one session carries the same choiceSetSize: the count of not-chosen cells", () => {
    const events = derive(INTERACTIONS, SURFACED);
    const sized = (timestamp: string): number[] =>
      events.filter((e) => e.timestamp === timestamp).map((e) => e.choiceSetSize!);
    // s0: everything is still novel → nothing offered, nothing scored.
    expect(sized("2026-01-01T00:00:00.000Z")).toEqual([]);
    // s1: build was taken, so the two untouched modes are the whole choice set.
    expect(sized("2026-02-01T00:00:00.000Z")).toEqual([2, 2]);
    // s2: the loom was taken, so all three of the synth's cells were passed over. The loom's own
    // cell is engaged and so is not part of the choice that was declined.
    expect(sized("2026-03-01T00:00:00.000Z")).toEqual([3, 3, 3]);
  });

  it("cells inside the novelty window are still excluded", () => {
    // Every cell of this artifact is first seen on 2026-01-01; the second look is one day later,
    // well inside the 3-day window. s1 takes the loom, so the emptiness below is the novelty rule
    // doing its job and not the no-choice rule quietly standing in for it.
    const events = derive(
      [
        engage("s0", "2026-01-01T00:00:00.000Z"),
        engage("s1", "2026-01-02T00:00:00.000Z", "loom-01"),
      ],
      [
        surface("s0", "2026-01-01T00:00:00.000Z"),
        surface("s1", "2026-01-02T00:00:00.000Z"),
        surface("s1", "2026-01-02T00:00:00.000Z", "loom-01"),
      ],
    );
    expect(events).toHaveLength(0);
  });

  it("one cell offered twice in a session is one choice, not two", () => {
    const events = derive(INTERACTIONS, [
      ...SURFACED,
      surface("s2", "2026-03-01T00:00:01.000Z"), // the map re-rendered
    ]);
    const s2 = events.filter((e) => e.timestamp.startsWith("2026-03-01"));
    expect(s2.map((e) => e.mode).sort()).toEqual(["build", "investigate", "perform"]);
    expect(s2.every((e) => e.choiceSetSize === 3)).toBe(true);
  });
});
