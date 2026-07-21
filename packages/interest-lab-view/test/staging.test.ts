import { describe, expect, expectTypeOf, it } from "vitest";
import { resolveChildStaging } from "../src/index";
import type { AgeBand, ChildStaging } from "../src/index";

const STAGING_GOLDEN = {
  "6-8": {
    band: "6-8",
    showRawNumbers: false,
    comparisonDefault: "off",
    labelStyle: "story",
    cardScale: 1.25,
    touchTargetPx: 56,
    celebrationCeiling: "medium",
    maxVisibleQuests: 3,
    showProvenanceDetail: false,
    showExplorationMap: false,
    worldCameraMode: "auto-tour",
  },
  "9-11": {
    band: "9-11",
    showRawNumbers: false,
    comparisonDefault: "opt-in",
    labelStyle: "growth",
    cardScale: 1.1,
    touchTargetPx: 48,
    celebrationCeiling: "high",
    maxVisibleQuests: 6,
    showProvenanceDetail: true,
    showExplorationMap: true,
    worldCameraMode: "focus+orbit",
  },
  "12-14": {
    band: "12-14",
    showRawNumbers: true,
    comparisonDefault: "opt-in",
    labelStyle: "full",
    cardScale: 1,
    touchTargetPx: 44,
    celebrationCeiling: "high",
    maxVisibleQuests: "all",
    showProvenanceDetail: true,
    showExplorationMap: true,
    worldCameraMode: "focus+orbit",
  },
} as const satisfies Record<AgeBand, ChildStaging>;

describe("resolveChildStaging", () => {
  it("matches the exact child-staging golden for every age band", () => {
    for (const band of Object.keys(STAGING_GOLDEN) as AgeBand[]) {
      expect(resolveChildStaging(band)).toEqual(STAGING_GOLDEN[band]);
    }
  });

  it("keeps the 6-8 presentation concrete and free of raw comparison or orbit controls", () => {
    expect(resolveChildStaging("6-8")).toMatchObject({
      showRawNumbers: false,
      comparisonDefault: "off",
      worldCameraMode: "auto-tour",
    });
  });

  it("derives presentation from the age band without accepting underlying state", () => {
    expectTypeOf(resolveChildStaging).parameters.toEqualTypeOf<[band: AgeBand]>();
    expectTypeOf(resolveChildStaging).returns.toEqualTypeOf<ChildStaging>();

    const underlyingState = Object.freeze({
      probeIds: Object.freeze(["synthetic-probe-1", "synthetic-probe-2"]),
      returnStates: Object.freeze(["new", "explored"]),
    });
    const bandViews = (Object.keys(STAGING_GOLDEN) as AgeBand[]).map((band) => ({
      underlyingState,
      presentation: resolveChildStaging(band),
    }));

    expect(bandViews.map(({ underlyingState: state }) => state)).toEqual([
      underlyingState,
      underlyingState,
      underlyingState,
    ]);
  });

  it("is deterministic for repeated resolution", () => {
    for (const band of Object.keys(STAGING_GOLDEN) as AgeBand[]) {
      expect(resolveChildStaging(band)).toEqual(resolveChildStaging(band));
    }
  });
});
