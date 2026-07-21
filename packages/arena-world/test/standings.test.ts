import type { NearPeerStanding } from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

type StandingSelf = { band: string; selfGain: number };
type NearPeerGain = { pseudonym: string; gain: number };
type StandingOptions = { optedIn?: boolean };

const SELF = { band: "pace-band-three", selfGain: 300 } as const;
const NEAR_PEERS = [
  { pseudonym: "kestrel", gain: 260 },
  { pseudonym: "otter", gain: 340 },
  { pseudonym: "finch", gain: 300 },
] as const;

const deriveStanding = arenaWorld.deriveStanding;

describe("deriveStanding", () => {
  it("defaults cross-child standings off unless explicitly opted in", () => {
    expect(deriveStanding).toBeTypeOf("function");
    if (!deriveStanding) return;

    expect(deriveStanding(SELF, NEAR_PEERS)).toBeNull();
    expect(deriveStanding(SELF, NEAR_PEERS, {})).toBeNull();
    expect(deriveStanding(SELF, NEAR_PEERS, { optedIn: false })).toBeNull();
  });

  it("matches the exact opted-in S1 near-peer standing", () => {
    expect(deriveStanding).toBeTypeOf("function");
    if (!deriveStanding) return;

    expect(deriveStanding(SELF, NEAR_PEERS, { optedIn: true })).toEqual({
      band: "pace-band-three",
      anonymizedPeers: [
        { pseudonym: "kestrel", gain: 260 },
        { pseudonym: "otter", gain: 340 },
        { pseudonym: "finch", gain: 300 },
      ],
      selfGain: 300,
      gainToBandTop: 40,
    });
  });

  it("preserves anonymized peer order and returns fresh replay-identical results", () => {
    expect(deriveStanding).toBeTypeOf("function");
    if (!deriveStanding) return;

    const self = Object.freeze({ ...SELF });
    const nearPeers = Object.freeze(NEAR_PEERS.map((peer) => Object.freeze({ ...peer })));
    const first = deriveStanding(self, nearPeers, { optedIn: true });
    const second = deriveStanding(self, nearPeers, { optedIn: true });

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).not.toBe(second);
    expect(first?.anonymizedPeers).not.toBe(nearPeers);
    expect(first?.anonymizedPeers.map(({ pseudonym }) => pseudonym)).toEqual([
      "kestrel",
      "otter",
      "finch",
    ]);

    if (first) first.anonymizedPeers[0]!.gain = 999;
    expect(deriveStanding(self, nearPeers, { optedIn: true })?.anonymizedPeers[0]?.gain).toBe(260);
  });

  it("includes self in the band top so the gap is never negative", () => {
    expect(deriveStanding).toBeTypeOf("function");
    if (!deriveStanding) return;

    expect(
      deriveStanding(SELF, [{ pseudonym: "kestrel", gain: 260 }], { optedIn: true })?.gainToBandTop,
    ).toBe(0);
    expect(deriveStanding(SELF, [], { optedIn: true })?.gainToBandTop).toBe(0);
  });

  it("cannot represent caste ranks and accepts only gain-based inputs", () => {
    expect(deriveStanding).toBeTypeOf("function");
    if (!deriveStanding) return;

    const standing = deriveStanding(SELF, NEAR_PEERS, { optedIn: true });

    expect(deriveStanding).toHaveLength(3);
    expect(Object.keys(standing ?? {})).toEqual([
      "band",
      "anonymizedPeers",
      "selfGain",
      "gainToBandTop",
    ]);
    expectTypeOf(deriveStanding).parameters.toEqualTypeOf<
      [self: StandingSelf, nearPeers: readonly NearPeerGain[], options?: StandingOptions]
    >();
    expectTypeOf(deriveStanding).returns.toEqualTypeOf<NearPeerStanding | null>();
    expectTypeOf<
      Extract<keyof NearPeerStanding, "rank" | "position" | "percentile" | "outOf">
    >().toEqualTypeOf<never>();
  });
});
