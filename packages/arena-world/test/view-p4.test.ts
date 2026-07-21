import {
  type BaseArenaView,
  type BuildArenaViewInputs,
  CATALOG,
  type CohortBase,
  FIXTURE,
  TIERS,
  buildArenaView,
  createSyntheticMasteryFeed,
} from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

const GOLDEN_BASE: CohortBase = {
  cohortRef: "cohort-synthetic-six",
  contributions: [
    { missionId: "m1", feature: "campfire", by: "kestrel" },
    { missionId: "m2", feature: "banner", by: "otter" },
    { missionId: "m3", feature: "garden", by: "kestrel" },
  ],
  unlockedFeatures: ["campfire", "banner", "garden"],
};

describe("buildArenaView P4 composition", () => {
  it("adds the exact attributable cohort base and presentation placements", () => {
    const inputs = buildInputs(GOLDEN_BASE);
    const view = buildArenaView(inputs);

    expect(Object.keys(view)).toEqual([
      "world",
      "layout",
      "nodeStates",
      "progression",
      "representation",
      "avatar",
      "eligibility",
      "base",
      "presentation",
      "flags",
    ]);
    expect(view.base).toEqual(GOLDEN_BASE);
    expect(view.base).not.toBe(GOLDEN_BASE);
    expect(view.base.contributions).not.toBe(GOLDEN_BASE.contributions);
    expect(view.base.unlockedFeatures).not.toBe(GOLDEN_BASE.unlockedFeatures);
    expect(view.presentation.basePlacements).toEqual([
      { feature: "campfire", zone: "hearth", x: 1024, y: 1024, by: "kestrel" },
      { feature: "banner", zone: "gateway", x: 1024, y: 928, by: "otter" },
      { feature: "garden", zone: "grove", x: 944, y: 1088, by: "kestrel" },
    ]);
    expectTypeOf(view).toEqualTypeOf<BaseArenaView>();
  });

  it("replays deterministically without letting base state alter existing outcomes", () => {
    const first = buildArenaView(buildInputs(GOLDEN_BASE));
    const second = buildArenaView(buildInputs(GOLDEN_BASE));
    const emptyBaseView = buildArenaView(
      buildInputs({
        cohortRef: GOLDEN_BASE.cohortRef,
        contributions: [],
        unlockedFeatures: [],
      }),
    );

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.base).not.toBe(second.base);
    expect(first.base.contributions[0]).not.toBe(second.base.contributions[0]);
    expect(first.presentation.basePlacements).not.toBe(second.presentation.basePlacements);
    expect(stateWithoutBase(first)).toEqual(stateWithoutBase(emptyBaseView));
  });
});

function buildInputs(base: CohortBase): BuildArenaViewInputs & { base: CohortBase } {
  return {
    world: FIXTURE,
    signals: createSyntheticMasteryFeed(),
    tierTable: TIERS,
    catalog: CATALOG,
    avatar: {
      learnerRef: "learner-synthetic-001",
      equipped: ["avatar-hat-explorer"],
    },
    base,
    caps: {
      webgl2: true,
      webgl1: true,
      prefersReducedMotion: false,
      deviceMemoryGB: 8,
      hardwareConcurrency: 8,
    },
    options: {
      ageBand: "9-11",
      reducedMotion: false,
      plainMode: false,
    },
  };
}

function stateWithoutBase(view: BaseArenaView) {
  const { base: _base, presentation, ...state } = view;
  const { basePlacements: _basePlacements, ...presentationWithoutBase } = presentation;

  return { ...state, presentation: presentationWithoutBase };
}
