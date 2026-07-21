import {
  type AvatarState,
  type BuildArenaViewInputs,
  CATALOG,
  type DeviceCaps,
  FIXTURE,
  type ProgressionArenaView,
  TIERS,
  buildArenaView,
  createSyntheticMasteryFeed,
} from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

const FULL_CAPS = {
  webgl2: true,
  webgl1: true,
  prefersReducedMotion: false,
  deviceMemoryGB: 8,
  hardwareConcurrency: 8,
} satisfies DeviceCaps;

const INPUTS = {
  world: FIXTURE,
  signals: createSyntheticMasteryFeed(),
  tierTable: TIERS,
  catalog: CATALOG,
  avatar: {
    learnerRef: "learner-synthetic-001",
    equipped: ["avatar-hat-explorer"],
  },
  caps: FULL_CAPS,
  options: {
    ageBand: "9-11",
    reducedMotion: false,
    plainMode: false,
  },
} as const satisfies BuildArenaViewInputs;

describe("buildArenaView P2 composition", () => {
  it("adds the exact S1 progression, staged representation, avatar, and eligibility", () => {
    const view = buildArenaView(INPUTS);

    expect(Object.keys(view)).toEqual([
      "world",
      "layout",
      "nodeStates",
      "progression",
      "representation",
      "avatar",
      "eligibility",
      "presentation",
      "flags",
    ]);
    expect(view.progression).toEqual({
      cumulativeIndependenceReward: 300,
      masteredCount: 4,
      regionsComplete: ["tinker-bluffs"],
      tier: TIERS[2],
      growthVsPast: { previous: 0, current: 300, delta: 300 },
    });
    expect(view.representation).toEqual({
      band: "9-11",
      headline: "growth-vs-past",
      currencyLabel: "Growth from your past",
      showRawNumber: false,
      comparisonDefault: "off",
      failureCopy: "Not yet — keep trying a strategy.",
    });
    expect(view.avatar).toEqual({
      learnerRef: "learner-synthetic-001",
      equipped: ["avatar-hat-explorer"],
    });
    expect(view.eligibility).toEqual({
      eligibleIds: [
        "avatar-hat-explorer",
        "avatar-badge-firstlight",
        "world-theme-dawn",
        "base-lantern-warm",
        "celebration-bloom",
      ],
      lockedIds: [
        "avatar-cape-aurora",
        "world-theme-dusk",
        "base-banner-unity",
        "celebration-aurora",
      ],
    });
    expect(view).not.toHaveProperty("base");
    expect(view).not.toHaveProperty("standing");
    expect(view.presentation.qualityTier).toBe("A");
    expect(view.nodeStates).toHaveLength(9);
    expectTypeOf(view).toEqualTypeOf<ProgressionArenaView>();
    expectTypeOf(INPUTS.avatar).toMatchTypeOf<AvatarState>();
  });

  it("uses the personal baseline and returns fresh deterministic P2 state", () => {
    const inputs = {
      ...INPUTS,
      options: { ...INPUTS.options, previousReward: 240 },
    } satisfies BuildArenaViewInputs;
    const first = buildArenaView(inputs);
    const second = buildArenaView(inputs);

    expect(first.progression.growthVsPast).toEqual({ previous: 240, current: 300, delta: 60 });
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.progression).not.toBe(second.progression);
    expect(first.avatar).not.toBe(second.avatar);
    expect(first.avatar.equipped).not.toBe(second.avatar.equipped);
    expect(first.eligibility).not.toBe(second.eligibility);
    expect(first.eligibility.eligibleIds).not.toBe(second.eligibility.eligibleIds);

    first.avatar.equipped.push("consumer-mutation");
    first.eligibility.eligibleIds.push("consumer-mutation");

    expect(buildArenaView(inputs)).toEqual(second);
  });
});
