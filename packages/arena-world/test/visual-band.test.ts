import type { AgeBand, ProgressionState, VisualBand } from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

const PROGRESSION: ProgressionState = {
  cumulativeIndependenceReward: 300,
  masteredCount: 4,
  regionsComplete: ["tinker-bluffs"],
  tier: { index: 2, label: "Bright Ember", minReward: 250 },
  growthVsPast: { previous: 240, current: 300, delta: 60 },
};

const GOLDEN_VISUAL_BANDS: ReadonlyArray<readonly [AgeBand, VisualBand]> = [
  [
    "6-8",
    {
      showCanvasNumbers: false,
      labelStyle: "story",
      markerScale: 1.25,
      touchTargetPx: 56,
      celebrationCeiling: "medium",
      comparisonVisibleDefault: false,
    },
  ],
  [
    "9-11",
    {
      showCanvasNumbers: false,
      labelStyle: "growth",
      markerScale: 1.1,
      touchTargetPx: 48,
      celebrationCeiling: "high",
      comparisonVisibleDefault: false,
    },
  ],
  [
    "12-14",
    {
      showCanvasNumbers: true,
      labelStyle: "numeric",
      markerScale: 1,
      touchTargetPx: 44,
      celebrationCeiling: "high",
      comparisonVisibleDefault: false,
    },
  ],
];

describe("resolveVisualBand", () => {
  it("resolves every age band to the exact golden presentation tokens", () => {
    expect(arenaWorld.resolveVisualBand).toBeTypeOf("function");
    if (!arenaWorld.resolveVisualBand) return;

    for (const [band, expected] of GOLDEN_VISUAL_BANDS) {
      expect(arenaWorld.resolveVisualBand(band)).toEqual(expected);
    }
  });

  it("keeps the 6-8 canvas concrete, larger, and warmly bounded", () => {
    expect(arenaWorld.resolveVisualBand).toBeTypeOf("function");
    if (!arenaWorld.resolveVisualBand) return;

    const visualBand = arenaWorld.resolveVisualBand("6-8");

    expect(visualBand.showCanvasNumbers).toBe(false);
    expect(visualBand.labelStyle).toBe("story");
    expect(visualBand.markerScale).toBe(1.25);
    expect(visualBand.touchTargetPx).toBe(56);
    expect(visualBand.celebrationCeiling).toBe("medium");
    expect(visualBand.comparisonVisibleDefault).toBe(false);
  });

  it("cannot read or change the underlying progression economy", () => {
    expect(arenaWorld.resolveVisualBand).toBeTypeOf("function");
    if (!arenaWorld.resolveVisualBand) return;

    Object.freeze(PROGRESSION.regionsComplete);
    Object.freeze(PROGRESSION.tier);
    Object.freeze(PROGRESSION.growthVsPast);
    Object.freeze(PROGRESSION);
    const before = JSON.stringify(PROGRESSION);

    for (const [band] of GOLDEN_VISUAL_BANDS) {
      arenaWorld.resolveVisualBand(band);
      expect(JSON.stringify(PROGRESSION)).toBe(before);
    }

    expect(arenaWorld.resolveVisualBand).toHaveLength(1);
    expectTypeOf<Parameters<typeof arenaWorld.resolveVisualBand>>().toEqualTypeOf<
      [ageBand: AgeBand]
    >();
  });

  it("returns fresh replay-identical presentation values", () => {
    expect(arenaWorld.resolveVisualBand).toBeTypeOf("function");
    if (!arenaWorld.resolveVisualBand) return;

    const first = arenaWorld.resolveVisualBand("9-11");
    const second = arenaWorld.resolveVisualBand("9-11");

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expectTypeOf(first).toEqualTypeOf<VisualBand>();
  });
});
