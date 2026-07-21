import {
  type ArenaView,
  type BaseArenaView,
  type BuildArenaViewInputs,
  CATALOG,
  FIXTURE,
  TIERS,
  buildArenaView,
  createSyntheticMasteryFeed,
  deriveStanding,
} from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createSyntheticCohortBase } from "./view-fixture";

type ComparableArenaState = Pick<
  ArenaView,
  "world" | "layout" | "nodeStates" | "progression" | "eligibility" | "base" | "standing"
>;
type PlainViewEquals = (full: ComparableArenaState, plain: ComparableArenaState) => boolean;

const plainViewEquals = (arenaWorld as typeof arenaWorld & { plainViewEquals?: PlainViewEquals })
  .plainViewEquals;

const STANDING = deriveStanding(
  { band: "pace-band-three", selfGain: 300 },
  [
    { pseudonym: "kestrel", gain: 260 },
    { pseudonym: "otter", gain: 340 },
  ],
  { optedIn: true },
);

describe("plainViewEquals", () => {
  it("keeps one underlying state across plain, reduced-motion, and lower-tier renderings", () => {
    expect(plainViewEquals).toBeTypeOf("function");
    if (!plainViewEquals) return;

    const full = buildVariant();
    const plain = buildVariant({ plainMode: true });
    const reduced = buildVariant({ reducedMotion: true });
    const lowerTier = buildVariant({ deviceMemoryGB: 4, hardwareConcurrency: 4 });
    const expectedState = stateOutsideRender(full.view, STANDING);

    for (const variant of [plain, reduced, lowerTier]) {
      expect(stateOutsideRender(variant.view, STANDING)).toEqual(expectedState);
      expect(
        plainViewEquals(withStanding(full.view, STANDING), withStanding(variant.view, STANDING)),
      ).toBe(true);
    }

    expect(plain.view.flags.plainMode).toBe(true);
    expect(reduced.view.flags.reducedMotion).toBe(true);
    expect(reduced.view.presentation.qualityTier).toBe("C");
    expect(lowerTier.view.presentation.qualityTier).toBe("B");
  });

  it("keeps learning, access, and standing unchanged when standings are off and plain mode is on", () => {
    expect(plainViewEquals).toBeTypeOf("function");
    if (!plainViewEquals) return;

    const full = buildVariant();
    const plain = buildVariant({ plainMode: true });

    expect(plainViewEquals(withStanding(full.view, null), withStanding(plain.view, null))).toBe(
      true,
    );
    expect(withStanding(plain.view, null)).toMatchObject({
      nodeStates: full.view.nodeStates,
      progression: full.view.progression,
      eligibility: full.view.eligibility,
      standing: null,
    });
  });

  it("rejects a change to any underlying state field", () => {
    expect(plainViewEquals).toBeTypeOf("function");
    if (!plainViewEquals || !STANDING) return;

    const baseline = withStanding(buildVariant().view, STANDING);
    const changedStates: ComparableArenaState[] = [
      { ...baseline, world: { ...baseline.world, regions: [...baseline.world.regions].reverse() } },
      {
        ...baseline,
        layout: {
          ...baseline.layout,
          positions: baseline.layout.positions.map((position, index) =>
            index === 0 ? { ...position, x: position.x + 1 } : position,
          ),
        },
      },
      {
        ...baseline,
        nodeStates: baseline.nodeStates.map((node, index) =>
          index === 0 ? { ...node, state: node.state === "locked" ? "available" : "locked" } : node,
        ),
      },
      {
        ...baseline,
        progression: {
          ...baseline.progression,
          cumulativeIndependenceReward: baseline.progression.cumulativeIndependenceReward + 1,
        },
      },
      {
        ...baseline,
        eligibility: {
          ...baseline.eligibility,
          eligibleIds: [...baseline.eligibility.eligibleIds, "synthetic-different-item"],
        },
      },
      { ...baseline, base: { ...baseline.base, cohortRef: "cohort-synthetic-other" } },
      {
        ...baseline,
        standing: { ...STANDING, gainToBandTop: STANDING.gainToBandTop + 1 },
      },
    ];

    for (const changed of changedStates) {
      expect(plainViewEquals(baseline, changed)).toBe(false);
    }
  });

  it("exposes the exact pure two-view state comparison contract", () => {
    expect(plainViewEquals).toBeTypeOf("function");
    if (!plainViewEquals) return;

    expect(plainViewEquals).toHaveLength(2);
    expectTypeOf(plainViewEquals).parameters.toEqualTypeOf<
      [full: ComparableArenaState, plain: ComparableArenaState]
    >();
    expectTypeOf(plainViewEquals).returns.toEqualTypeOf<boolean>();
  });
});

type VariantOverrides = {
  readonly plainMode?: boolean;
  readonly reducedMotion?: boolean;
  readonly deviceMemoryGB?: number;
  readonly hardwareConcurrency?: number;
};

function buildVariant(overrides: VariantOverrides = {}): { view: BaseArenaView } {
  const inputs = {
    world: FIXTURE,
    signals: createSyntheticMasteryFeed(),
    tierTable: TIERS,
    catalog: CATALOG,
    avatar: {
      learnerRef: "learner-synthetic-001",
      equipped: ["avatar-hat-explorer"],
    },
    base: createSyntheticCohortBase(),
    caps: {
      webgl2: true,
      webgl1: true,
      prefersReducedMotion: false,
      deviceMemoryGB: overrides.deviceMemoryGB ?? 8,
      hardwareConcurrency: overrides.hardwareConcurrency ?? 8,
    },
    options: {
      ageBand: "9-11",
      reducedMotion: overrides.reducedMotion ?? false,
      plainMode: overrides.plainMode ?? false,
    },
  } as const satisfies BuildArenaViewInputs;

  return { view: buildArenaView(inputs) };
}

function withStanding(view: BaseArenaView, standing: ArenaView["standing"]): ComparableArenaState {
  return {
    world: view.world,
    layout: view.layout,
    nodeStates: view.nodeStates,
    progression: view.progression,
    eligibility: view.eligibility,
    base: view.base,
    standing,
  };
}

function stateOutsideRender(view: BaseArenaView, standing: ArenaView["standing"]) {
  const { flags: _flags, presentation: _presentation, ...state } = view;
  return { ...state, standing };
}
