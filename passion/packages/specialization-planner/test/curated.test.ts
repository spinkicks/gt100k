import { describe, it, expect } from "vitest";
import { curatedForCell } from "../src/curated.js";
import {
  CURATED_LIBRARY,
  CURATED_MUSIC_PROD_HIGH,
  CURATED_MUSIC_PROD_MID,
  CURATED_MUSIC_CABIN,
  CURATED_CHESS,
} from "../src/__fixtures__/curated.js";

describe("curatedForCell — A6 grounding filter (spec §3.4)", () => {
  it("returns age-eligible, path-compatible resources ranked reputation-desc", () => {
    const got = curatedForCell(CURATED_LIBRARY, ["music-sound", "production"], "12-14");
    expect(got.map((r) => r.id)).toEqual([
      CURATED_MUSIC_PROD_HIGH.id, // 0.92
      CURATED_MUSIC_PROD_MID.id, // 0.80
      CURATED_MUSIC_CABIN.id, // 0.70 — cabin-level, compatible with any music-sound sub-topic
    ]);
  });

  it("excludes an age-ineligible resource even with the highest reputation", () => {
    const got = curatedForCell(CURATED_LIBRARY, ["music-sound", "production"], "12-14");
    // CURATED_MUSIC_YOUNG_ONLY (rep 0.99, ageTiers ["6-8"]) must NOT appear for the 12-14 tier.
    expect(got.some((r) => r.id === "res-music-prod-young")).toBe(false);
  });

  it("matches a cabin-level query to its sub-topic resources", () => {
    const got = curatedForCell(CURATED_LIBRARY, ["music-sound"], "12-14");
    expect(got.map((r) => r.id)).toContain(CURATED_MUSIC_PROD_HIGH.id);
    expect(got.map((r) => r.id)).toContain(CURATED_MUSIC_CABIN.id);
  });

  it("resolves a different cell independently", () => {
    const got = curatedForCell(CURATED_LIBRARY, ["games-strategy", "chess"], "12-14");
    expect(got.map((r) => r.id)).toEqual([CURATED_CHESS.id]);
  });

  it("returns [] when nothing covers the cell (no-match case)", () => {
    expect(curatedForCell(CURATED_LIBRARY, ["science-nature", "botany"], "12-14")).toEqual([]);
  });
});
