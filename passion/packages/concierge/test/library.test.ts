import { describe, expect, it } from "vitest";
import {
  covers,
  resolve,
  withResource,
  type ConciergeRequest,
  type CuratedLibrary,
  type CuratedResource,
} from "../src/index.js";

// --- Synthetic curated library (SYNTHETIC data only). ---
const CHESS: CuratedResource = {
  id: "res-chess-openings",
  title: "Chess Openings for Beginners",
  url: "https://www.khanacademy.org/chess-openings",
  domainPath: ["games-strategy", "chess"],
  affordedModes: ["perform", "explain"],
  reputation: 0.95,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: "curated:seed",
};

// A second, lower-reputation chess resource — used to pin ranking (reputation desc, tie by id).
const CHESS_LOWER: CuratedResource = {
  id: "res-chess-tactics",
  title: "Chess Tactics Trainer",
  url: "https://en.wikipedia.org/wiki/Chess_tactic",
  domainPath: ["games-strategy", "chess"],
  affordedModes: ["perform"],
  reputation: 0.7,
  ageTiers: ["9-11", "12-14"],
  provenance: "curated:seed",
};

// Same reputation as CHESS_LOWER but an id that sorts BEFORE it — pins the tie-break.
const CHESS_TIE: CuratedResource = {
  id: "res-chess-endgames",
  title: "Chess Endgame Basics",
  url: "https://en.wikipedia.org/wiki/Chess_endgame",
  domainPath: ["games-strategy", "chess"],
  affordedModes: ["explain"],
  reputation: 0.7,
  ageTiers: ["9-11", "12-14"],
  provenance: "curated:seed",
};

// A resource in a different cabin — must never match a chess request.
const PIANO: CuratedResource = {
  id: "res-piano",
  title: "Learn Piano Scales",
  url: "https://www.khanacademy.org/piano-scales",
  domainPath: ["music-sound", "instruments"],
  affordedModes: ["perform"],
  reputation: 0.9,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: "curated:seed",
};

const LIB: CuratedLibrary = [CHESS, CHESS_LOWER, CHESS_TIE, PIANO];

function req(message: string, ageTier: ConciergeRequest["ageTier"] = "9-11"): ConciergeRequest {
  return { kidId: "kid-synthetic-001", ageTier, message, sessionId: "sess-001" };
}

describe("curated library — covers (curated-first coverage predicate, SC-1)", () => {
  it("covers a chess request whose subtopic keyword hits the taxonomy", () => {
    expect(covers(LIB, req("how do I start learning chess openings?"))).toBe(true);
  });

  it("does not cover a request with no taxonomy keyword", () => {
    expect(covers(LIB, req("how do volcanoes erupt today?"))).toBe(false);
  });

  it("does not cover when no eligible resource fits the age tier", () => {
    // CHESS covers all tiers, so remove it: only the 9-11/12-14 resources remain.
    const older: CuratedLibrary = [CHESS_LOWER, CHESS_TIE];
    expect(covers(older, req("chess openings", "6-8"))).toBe(false);
    expect(covers(older, req("chess openings", "12-14"))).toBe(true);
  });
});

describe("curated library — resolve (ranked, capped, age-eligible)", () => {
  it("returns matching resources ranked by reputation desc, tie by id asc", () => {
    const out = resolve(LIB, req("how do I start learning chess openings?"));
    expect(out.map((r) => r.id)).toEqual([
      "res-chess-openings", // 0.95
      "res-chess-endgames", // 0.70, id sorts before res-chess-tactics
      "res-chess-tactics", // 0.70
    ]);
  });

  it("excludes resources the request's age tier is ineligible for", () => {
    const out = resolve(LIB, req("chess openings", "6-8"));
    // Only CHESS is eligible at 6-8.
    expect(out.map((r) => r.id)).toEqual(["res-chess-openings"]);
  });

  it("never returns a resource from an unrelated cabin", () => {
    const out = resolve(LIB, req("chess openings"));
    expect(out.some((r) => r.id === "res-piano")).toBe(false);
  });

  it("returns [] for an uncovered request", () => {
    expect(resolve(LIB, req("how do volcanoes erupt today?"))).toEqual([]);
  });
});

describe("curated library — withResource (immutable append)", () => {
  it("returns a new library with the resource appended; original unchanged", () => {
    const next = withResource([CHESS], PIANO);
    expect(next).toHaveLength(2);
    expect(next[1]?.id).toBe("res-piano");
    // Original is not mutated.
    expect([CHESS]).toHaveLength(1);
  });
});
