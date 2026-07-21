import { describe, expect, it } from "vitest";

import {
  EASINGS,
  MOTION,
  buildArenaRoomView,
  deriveStandingsView,
  resolveMotion,
} from "../src/index.js";
import { motionGolden } from "./fixtures/motion-golden.js";
import { viewRivalry } from "./fixtures/view-rivalry.js";
import { viewStandings } from "./fixtures/view-standings.js";

describe("typed arena view golden fixtures", () => {
  it("pins Fixture V2 gain-only opt-in standings", () => {
    expect(
      deriveStandingsView(viewStandings.self, viewStandings.nearPeers, { optedIn: false }),
    ).toEqual(viewStandings.expected.optedOut);
    expect(
      deriveStandingsView(viewStandings.self, viewStandings.nearPeers, { optedIn: true }),
    ).toEqual(viewStandings.expected.optedIn);
  });

  it("pins Fixture V3 observable-only rivalry views", () => {
    expect(buildArenaRoomView(viewRivalry.analyses.dominance)).toEqual(
      viewRivalry.expected.dominance,
    );
    expect(buildArenaRoomView(viewRivalry.analyses.lowQuality)).toEqual(
      viewRivalry.expected.lowQuality,
    );
  });

  it("pins Fixture V4 animated and reduced motion rows", () => {
    expect(MOTION).toEqual(motionGolden.motion);
    expect(EASINGS).toEqual(motionGolden.easings);

    for (const [kind, row] of Object.entries(motionGolden.rows)) {
      expect(
        resolveMotion(kind as keyof typeof motionGolden.rows, { reducedMotion: false }),
      ).toEqual({
        kind,
        mode: "animated",
        durationMs: row.durationMs,
        easing: row.easing,
      });
      expect(
        resolveMotion(kind as keyof typeof motionGolden.rows, { reducedMotion: true }),
      ).toEqual({
        kind,
        mode: "reduced",
        durationMs: row.reducedMs,
        easing: "linear",
      });
    }
  });
});
