import type { AgeBand, ProgressionState, RewardRepresentation } from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

const PROGRESSION: ProgressionState = {
  cumulativeIndependenceReward: 300,
  masteredCount: 4,
  regionsComplete: ["tinker-bluffs"],
  tier: { index: 2, label: "Bright Ember", minReward: 250 },
  growthVsPast: { previous: 240, current: 300, delta: 60 },
};

const GOLDEN_REPRESENTATIONS: ReadonlyArray<readonly [AgeBand, RewardRepresentation]> = [
  [
    "6-8",
    {
      band: "6-8",
      headline: "concrete-marker",
      currencyLabel: "I did it myself!",
      showRawNumber: false,
      comparisonDefault: "off",
      failureCopy: "Let's try that one again — you've got this.",
    },
  ],
  [
    "9-11",
    {
      band: "9-11",
      headline: "growth-vs-past",
      currencyLabel: "You vs. past-you",
      showRawNumber: false,
      comparisonDefault: "opt-in",
      failureCopy: "Not yet — here's one thing to try.",
    },
  ],
  [
    "12-14",
    {
      band: "12-14",
      headline: "mastery-delta",
      currencyLabel: "Independence reward",
      showRawNumber: true,
      comparisonDefault: "opt-in",
      failureCopy: "Here's the specific step that trips it — pick your next move.",
    },
  ],
];

describe("resolveRewardRepresentation", () => {
  it("resolves every age band to the exact golden vocabulary", () => {
    expect(arenaWorld.resolveRewardRepresentation).toBeTypeOf("function");
    if (!arenaWorld.resolveRewardRepresentation) return;

    for (const [band, expected] of GOLDEN_REPRESENTATIONS) {
      expect(arenaWorld.resolveRewardRepresentation(band, PROGRESSION)).toEqual(expected);
    }
  });

  it("keeps raw mastery numbers hidden and comparison off for ages 6-8", () => {
    expect(arenaWorld.resolveRewardRepresentation).toBeTypeOf("function");
    if (!arenaWorld.resolveRewardRepresentation) return;

    const representation = arenaWorld.resolveRewardRepresentation("6-8", PROGRESSION);

    expect(representation.headline).toBe("concrete-marker");
    expect(representation.showRawNumber).toBe(false);
    expect(representation.comparisonDefault).toBe("off");
    expect(representation.currencyLabel).not.toContain("300");
  });

  it("does not mutate or vary the underlying progression economy", () => {
    expect(arenaWorld.resolveRewardRepresentation).toBeTypeOf("function");
    if (!arenaWorld.resolveRewardRepresentation) return;

    Object.freeze(PROGRESSION.regionsComplete);
    Object.freeze(PROGRESSION.tier);
    Object.freeze(PROGRESSION.growthVsPast);
    Object.freeze(PROGRESSION);
    const before = JSON.stringify(PROGRESSION);

    for (const [band] of GOLDEN_REPRESENTATIONS) {
      arenaWorld.resolveRewardRepresentation(band, PROGRESSION);
      expect(JSON.stringify(PROGRESSION)).toBe(before);
    }
  });

  it("replays deterministically with the exact two-input public contract", () => {
    expect(arenaWorld.resolveRewardRepresentation).toBeTypeOf("function");
    if (!arenaWorld.resolveRewardRepresentation) return;

    const first = arenaWorld.resolveRewardRepresentation("9-11", PROGRESSION);
    const second = arenaWorld.resolveRewardRepresentation("9-11", PROGRESSION);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(arenaWorld.resolveRewardRepresentation).toHaveLength(2);
    expectTypeOf<Parameters<typeof arenaWorld.resolveRewardRepresentation>>().toEqualTypeOf<
      [ageBand: AgeBand, progression: ProgressionState]
    >();
  });
});
