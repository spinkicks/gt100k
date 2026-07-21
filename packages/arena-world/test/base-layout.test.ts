import {
  BASE_LAYOUT,
  type BasePlacement,
  type CohortBase,
  type CooperativeMissionResult,
} from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

type ResolveBaseLayout = (base: CohortBase) => BasePlacement[];

const resolveBaseLayout = (
  arenaWorld as typeof arenaWorld & {
    resolveBaseLayout?: ResolveBaseLayout;
  }
).resolveBaseLayout;

const GOLDEN_CONTRIBUTIONS = [
  { missionId: "m1", feature: "campfire", by: "kestrel" },
  { missionId: "m2", feature: "banner", by: "otter" },
  { missionId: "m3", feature: "garden", by: "kestrel" },
] as const satisfies readonly CooperativeMissionResult[];

describe("resolveBaseLayout", () => {
  it("matches the exact attributable three-feature Base Camp layout", () => {
    expect(resolveBaseLayout).toBeTypeOf("function");
    if (!resolveBaseLayout) return;

    expect(resolveBaseLayout(goldenBase())).toEqual([
      { feature: "campfire", zone: "hearth", x: 1024, y: 1024, by: "kestrel" },
      { feature: "banner", zone: "gateway", x: 1024, y: 928, by: "otter" },
      { feature: "garden", zone: "grove", x: 944, y: 1088, by: "kestrel" },
    ]);
  });

  it("resolves every known feature from the canonical slot table in stable order", () => {
    expect(resolveBaseLayout).toBeTypeOf("function");
    if (!resolveBaseLayout) return;

    const features = Object.keys(BASE_LAYOUT);
    const base = baseFor(features);

    expect(resolveBaseLayout(base)).toEqual(
      features.map((feature, index) => ({
        feature,
        ...BASE_LAYOUT[feature as keyof typeof BASE_LAYOUT],
        by: `builder-${index}`,
      })),
    );
  });

  it("places unknown features into the exact deterministic outskirts grid", () => {
    expect(resolveBaseLayout).toBeTypeOf("function");
    if (!resolveBaseLayout) return;

    const features = ["unknown-0", "unknown-1", "unknown-2", "unknown-3", "unknown-4", "toString"];

    expect(resolveBaseLayout(baseFor(features))).toEqual([
      { feature: "unknown-0", zone: "outskirts", x: 864, y: 1200, by: "builder-0" },
      { feature: "unknown-1", zone: "outskirts", x: 944, y: 1200, by: "builder-1" },
      { feature: "unknown-2", zone: "outskirts", x: 1024, y: 1200, by: "builder-2" },
      { feature: "unknown-3", zone: "outskirts", x: 1104, y: 1200, by: "builder-3" },
      { feature: "unknown-4", zone: "outskirts", x: 864, y: 1280, by: "builder-4" },
      { feature: "toString", zone: "outskirts", x: 944, y: 1280, by: "builder-5" },
    ]);
  });

  it("replays without mutation and attributes a feature to its first contributor", () => {
    expect(resolveBaseLayout).toBeTypeOf("function");
    if (!resolveBaseLayout) return;

    const base: CohortBase = {
      cohortRef: "cohort-synthetic-six",
      contributions: [
        { missionId: "m1", feature: "campfire", by: "kestrel" },
        { missionId: "m2", feature: "campfire", by: "otter" },
      ],
      unlockedFeatures: ["campfire"],
    };
    Object.freeze(base.contributions[0]);
    Object.freeze(base.contributions[1]);
    Object.freeze(base.contributions);
    Object.freeze(base.unlockedFeatures);
    Object.freeze(base);

    const first = resolveBaseLayout(base);
    const second = resolveBaseLayout(base);

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).not.toBe(second);
    expect(first).toEqual([
      { feature: "campfire", zone: "hearth", x: 1024, y: 1024, by: "kestrel" },
    ]);
    expect(base).toEqual({
      cohortRef: "cohort-synthetic-six",
      contributions: [
        { missionId: "m1", feature: "campfire", by: "kestrel" },
        { missionId: "m2", feature: "campfire", by: "otter" },
      ],
      unlockedFeatures: ["campfire"],
    });
  });

  it("keeps placement structurally separate from gameplay outcomes", () => {
    expect(resolveBaseLayout).toBeTypeOf("function");
    if (!resolveBaseLayout) return;

    const [placement] = resolveBaseLayout(goldenBase());

    expect(resolveBaseLayout).toHaveLength(1);
    expect(Object.keys(placement ?? {})).toEqual(["feature", "zone", "x", "y", "by"]);
    expectTypeOf(resolveBaseLayout).parameters.toEqualTypeOf<[base: CohortBase]>();
    expectTypeOf(resolveBaseLayout).returns.toEqualTypeOf<BasePlacement[]>();
  });
});

function goldenBase(): CohortBase {
  return {
    cohortRef: "cohort-synthetic-six",
    contributions: GOLDEN_CONTRIBUTIONS.map((contribution) => ({ ...contribution })),
    unlockedFeatures: ["campfire", "banner", "garden"],
  };
}

function baseFor(features: readonly string[]): CohortBase {
  return {
    cohortRef: "cohort-synthetic-six",
    contributions: features.map((feature, index) => ({
      missionId: `mission-${index}`,
      feature,
      by: `builder-${index}`,
    })),
    unlockedFeatures: [...features],
  };
}
