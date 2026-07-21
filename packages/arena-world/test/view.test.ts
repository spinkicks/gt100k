import {
  ASSET_KEYS,
  type AgeBand,
  type ArenaView,
  BIOMES,
  type BuildArenaViewInputs,
  CAMERA3D,
  CATALOG,
  FIXTURE,
  PALETTE,
  QUALITY_TIERS,
  TIERS,
  buildArenaView,
  buildQuestWorld,
  computeProgression,
  createSyntheticMasteryFeed,
  deriveCosmeticEligibility,
  deriveNodeStates,
  deriveStanding,
  layoutQuestWorld,
  plainViewEquals,
  resolveAvatarAnimation,
  resolveBaseLayout,
  resolveLighting,
  resolveParallaxLayers,
  resolvePostFx,
  resolveRewardRepresentation,
  resolveVisualBand,
  resolveWater,
  resolveWorldTransform,
} from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createSyntheticCohortBase } from "./view-fixture";

const FULL_CAPS = {
  webgl2: true,
  webgl1: true,
  prefersReducedMotion: false,
  deviceMemoryGB: 8,
  hardwareConcurrency: 8,
} as const;

const NEAR_PEERS = [
  { pseudonym: "kestrel", gain: 260 },
  { pseudonym: "otter", gain: 340 },
  { pseudonym: "finch", gain: 300 },
] as const;

describe("final buildArenaView composition", () => {
  it("composes every state and presentation field for the full synthetic scenario", () => {
    const inputs = buildInputs({ ageBand: "12-14", standingsOptedIn: true });
    const view = buildArenaView(inputs);
    const world = buildQuestWorld(FIXTURE);
    const layout = layoutQuestWorld(world);
    const nodeStateMap = deriveNodeStates(world, inputs.signals);
    const progression = computeProgression(world, inputs.signals, TIERS, 240);
    const base = createSyntheticCohortBase();

    expect(Object.keys(view)).toEqual([
      "world",
      "layout",
      "nodeStates",
      "progression",
      "representation",
      "avatar",
      "eligibility",
      "base",
      "standing",
      "presentation",
      "flags",
    ]);
    expect(Object.keys(view.presentation)).toEqual([
      "biomes",
      "worldTransform",
      "camera",
      "parallax",
      "lighting",
      "water",
      "postfx",
      "avatarAnim",
      "visualBand",
      "qualityTier",
      "qualityBudget",
      "assetKeys",
      "basePlacements",
      "palette",
    ]);
    expect(view).toEqual({
      world,
      layout,
      nodeStates: [...nodeStateMap].map(([nodeId, state]) => ({ nodeId, state })),
      progression,
      representation: resolveRewardRepresentation("12-14", progression),
      avatar: {
        learnerRef: "learner-synthetic-001",
        equipped: ["avatar-hat-explorer", "world-theme-dawn"],
      },
      eligibility: deriveCosmeticEligibility(CATALOG, progression, nodeStateMap, world),
      base,
      standing: deriveStanding({ band: "12-14", selfGain: 300 }, NEAR_PEERS, { optedIn: true }),
      presentation: {
        biomes: BIOMES,
        worldTransform: resolveWorldTransform(layout),
        camera: CAMERA3D,
        parallax: resolveParallaxLayers(),
        lighting: resolveLighting("A", "dawn"),
        water: resolveWater("A"),
        postfx: resolvePostFx("A"),
        avatarAnim: resolveAvatarAnimation("walk", { reducedMotion: false }),
        visualBand: resolveVisualBand("12-14"),
        qualityTier: "A",
        qualityBudget: QUALITY_TIERS.A,
        assetKeys: ASSET_KEYS,
        basePlacements: resolveBaseLayout(base),
        palette: PALETTE,
      },
      flags: { reducedMotion: false, plainMode: false, ageBand: "12-14" },
    });
    expectTypeOf(view).toEqualTypeOf<ArenaView>();
  });

  it("provides every state the accessible Ledger needs from the same view", () => {
    const view = buildArenaView(buildInputs({ ageBand: "12-14", standingsOptedIn: true }));
    const stateByNode = new Map(view.nodeStates.map(({ nodeId, state }) => [nodeId, state]));

    expect({
      quest: view.world.nodes.map(({ id, landmark, region }) => ({
        id,
        landmark,
        region,
        state: stateByNode.get(id),
      })),
      reward: { progression: view.progression, representation: view.representation },
      cosmetics: view.eligibility,
      base: view.base,
      standing: view.standing,
    }).toMatchObject({
      quest: expect.arrayContaining([
        {
          id: "count-cove",
          landmark: "Counting Lighthouse",
          region: "numbers-coast",
          state: "unlocked",
        },
        {
          id: "sentence-summit",
          landmark: "The Spelling Spires",
          region: "wordwind-reach",
          state: "locked",
        },
      ]),
      reward: {
        progression: { cumulativeIndependenceReward: 300, masteredCount: 4 },
        representation: { band: "12-14", showRawNumber: true },
      },
      cosmetics: {
        eligibleIds: [
          "avatar-hat-explorer",
          "avatar-badge-firstlight",
          "world-theme-dawn",
          "base-lantern-warm",
          "celebration-bloom",
        ],
      },
      base: { unlockedFeatures: ["campfire", "banner", "garden"] },
      standing: { selfGain: 300, gainToBandTop: 40 },
    });
    expect(view.world.nodes).toHaveLength(9);
    expect(view.world.nodes.every(({ landmark }) => landmark.length > 0)).toBe(true);
  });

  it("keeps state parity while age band, spectacle, motion, and quality presentation vary", () => {
    const full = buildArenaView(buildInputs());
    const variants = [
      buildArenaView(buildInputs({ ageBand: "6-8" })),
      buildArenaView(buildInputs({ plainMode: true })),
      buildArenaView(buildInputs({ reducedMotion: true })),
      buildArenaView(buildInputs({ deviceMemoryGB: 4, hardwareConcurrency: 4 })),
    ];

    expect(full.standing).toBeNull();
    for (const variant of variants) expect(plainViewEquals(full, variant)).toBe(true);

    expect(variants[0]).toMatchObject({
      representation: resolveRewardRepresentation("6-8", full.progression),
      standing: null,
      presentation: { visualBand: resolveVisualBand("6-8"), qualityTier: "A" },
    });
    expect(variants[1]?.flags.plainMode).toBe(true);
    expect(variants[2]?.presentation).toMatchObject({
      visualBand: resolveVisualBand("12-14"),
      qualityTier: "C",
      qualityBudget: QUALITY_TIERS.C,
      lighting: resolveLighting("C", "dawn"),
      water: resolveWater("C"),
      postfx: resolvePostFx("C"),
    });
    expect(variants[3]?.presentation).toMatchObject({
      visualBand: resolveVisualBand("12-14"),
      qualityTier: "B",
      qualityBudget: QUALITY_TIERS.B,
      lighting: resolveLighting("B", "dawn"),
      water: resolveWater("B"),
      postfx: resolvePostFx("B"),
    });
  });
});

type InputOverrides = {
  readonly ageBand?: AgeBand;
  readonly standingsOptedIn?: boolean;
  readonly plainMode?: boolean;
  readonly reducedMotion?: boolean;
  readonly deviceMemoryGB?: number;
  readonly hardwareConcurrency?: number;
};

function buildInputs(overrides: InputOverrides = {}) {
  return {
    world: FIXTURE,
    signals: createSyntheticMasteryFeed(),
    tierTable: TIERS,
    catalog: CATALOG,
    avatar: {
      learnerRef: "learner-synthetic-001",
      equipped: ["avatar-hat-explorer", "world-theme-dawn"],
    },
    base: createSyntheticCohortBase(),
    nearPeers: NEAR_PEERS,
    caps: {
      ...FULL_CAPS,
      deviceMemoryGB: overrides.deviceMemoryGB ?? FULL_CAPS.deviceMemoryGB,
      hardwareConcurrency: overrides.hardwareConcurrency ?? FULL_CAPS.hardwareConcurrency,
    },
    options: {
      ageBand: overrides.ageBand ?? "12-14",
      reducedMotion: overrides.reducedMotion ?? false,
      plainMode: overrides.plainMode ?? false,
      standingsOptedIn: overrides.standingsOptedIn ?? false,
      previousReward: 240,
      avatarIntent: "walk",
    },
  } as const satisfies BuildArenaViewInputs;
}
