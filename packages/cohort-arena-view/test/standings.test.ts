import { describe, expect, expectTypeOf, it } from "vitest";

import type { StandingsView } from "../src/standings.js";
import { deriveStandingsView } from "../src/standings.js";

const SELF = { selfGain: 300 } as const;

const NEAR_PEERS = [
  { pseudonym: "kestrel", gain: 260 },
  { pseudonym: "otter", gain: 340 },
  { pseudonym: "finch", gain: 300 },
] as const;

describe("gain-based near-peer standings", () => {
  it("returns null when standings are not opted in", () => {
    expect(deriveStandingsView(SELF, NEAR_PEERS, { optedIn: false })).toBeNull();
  });

  it("derives Fixture V2 without a rank or bottom-rank surface", () => {
    const view = deriveStandingsView(SELF, NEAR_PEERS, { optedIn: true });

    expect(view).toEqual({
      band: "near-peer",
      anonymizedPeers: [
        { pseudonym: "finch", gain: 300 },
        { pseudonym: "kestrel", gain: 260 },
        { pseudonym: "otter", gain: 340 },
      ],
      selfGain: 300,
      gainToBandTop: 40,
    });
    expect(Object.keys(view ?? {}).sort()).toEqual([
      "anonymizedPeers",
      "band",
      "gainToBandTop",
      "selfGain",
    ]);
  });

  it("canonicalizes peer ordering without mutating the synthetic input", () => {
    const reversed = [...NEAR_PEERS].reverse();
    const before = structuredClone(reversed);

    expect(deriveStandingsView(SELF, reversed, { optedIn: true })).toEqual(
      deriveStandingsView(SELF, NEAR_PEERS, { optedIn: true }),
    );
    expect(reversed).toEqual(before);
  });

  it("makes prohibited ranking fields unrepresentable", () => {
    expectTypeOf<keyof StandingsView>().toEqualTypeOf<
      "band" | "anonymizedPeers" | "selfGain" | "gainToBandTop"
    >();
  });
});
