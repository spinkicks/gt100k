import {
  ASSET_KEYS,
  type AgeBand,
  BIOMES,
  CAMERA3D,
  CATALOG,
  type Cosmetic,
  type DeviceCaps,
  FIXTURE,
  type NodeMasterySignal,
  PALETTE,
  type ProgressionArenaView,
  QUALITY_TIERS,
  type QuestWorld,
  TIERS,
  type Tier,
  buildQuestWorld,
  createSyntheticMasteryFeed,
  layoutQuestWorld,
  resolveAvatarAnimation,
  resolveLighting,
  resolveParallaxLayers,
  resolvePostFx,
  resolveWater,
  resolveWorldTransform,
} from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

type BuildArenaViewInputs = {
  world: QuestWorld;
  signals: readonly NodeMasterySignal[];
  tierTable: readonly Tier[];
  catalog: readonly Cosmetic[];
  avatar: { learnerRef: string; equipped: string[] };
  caps: DeviceCaps;
  options: {
    ageBand: AgeBand;
    reducedMotion: boolean;
    plainMode: boolean;
    avatarIntent?:
      | "idle"
      | "walk"
      | "run"
      | "think"
      | "celebrate-low"
      | "celebrate-med"
      | "celebrate-high";
  };
};

type BuildArenaView = (inputs: BuildArenaViewInputs) => ProgressionArenaView;

const buildArenaView = (arenaWorld as typeof arenaWorld & { buildArenaView?: BuildArenaView })
  .buildArenaView;

const FULL_CAPS = {
  webgl2: true,
  webgl1: true,
  prefersReducedMotion: false,
  deviceMemoryGB: 8,
  hardwareConcurrency: 8,
} satisfies DeviceCaps;

describe("buildArenaView P1 composition", () => {
  it("composes the fixture world, S1 states, and complete P1 presentation", () => {
    expect(buildArenaView).toBeTypeOf("function");
    if (!buildArenaView) return;

    const world = buildQuestWorld(FIXTURE);
    const layout = layoutQuestWorld(world);
    const view = buildArenaView({
      world: FIXTURE,
      signals: createSyntheticMasteryFeed(),
      tierTable: TIERS,
      catalog: CATALOG,
      avatar: { learnerRef: "learner-synthetic-001", equipped: [] },
      caps: FULL_CAPS,
      options: {
        ageBand: "9-11",
        reducedMotion: false,
        plainMode: false,
        avatarIntent: "walk",
      },
    });

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
    expect(view.world).toEqual(world);
    expect(view.layout).toEqual(layout);
    expect(view.nodeStates).toEqual([
      { nodeId: "count-cove", state: "unlocked" },
      { nodeId: "add-atoll", state: "unlocked" },
      { nodeId: "place-value-point", state: "available" },
      { nodeId: "observe-overlook", state: "unlocked" },
      { nodeId: "measure-mesa", state: "unlocked" },
      { nodeId: "phoneme-falls", state: "available" },
      { nodeId: "blend-bay", state: "locked" },
      { nodeId: "letter-landing", state: "available" },
      { nodeId: "sentence-summit", state: "locked" },
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
      "qualityTier",
      "qualityBudget",
      "assetKeys",
      "palette",
    ]);
    expect(view.presentation).toEqual({
      biomes: BIOMES,
      worldTransform: resolveWorldTransform(layout),
      camera: CAMERA3D,
      parallax: resolveParallaxLayers(),
      lighting: resolveLighting("A", "default"),
      water: resolveWater("A"),
      postfx: resolvePostFx("A"),
      avatarAnim: resolveAvatarAnimation("walk", { reducedMotion: false }),
      qualityTier: "A",
      qualityBudget: QUALITY_TIERS.A,
      assetKeys: ASSET_KEYS,
      palette: PALETTE,
    });
    expect(view.flags).toEqual({ reducedMotion: false, plainMode: false, ageBand: "9-11" });
    expectTypeOf(view).toEqualTypeOf<ReturnType<BuildArenaView>>();
  });

  it("forces the calm Tier C presentation when reduced motion is requested", () => {
    expect(buildArenaView).toBeTypeOf("function");
    if (!buildArenaView) return;

    const view = buildArenaView({
      world: FIXTURE,
      signals: createSyntheticMasteryFeed(),
      tierTable: TIERS,
      catalog: CATALOG,
      avatar: { learnerRef: "learner-synthetic-001", equipped: [] },
      caps: FULL_CAPS,
      options: { ageBand: "6-8", reducedMotion: true, plainMode: true },
    });

    expect(view.flags).toEqual({ reducedMotion: true, plainMode: true, ageBand: "6-8" });
    expect(view.presentation).toMatchObject({
      qualityTier: "C",
      qualityBudget: QUALITY_TIERS.C,
      lighting: resolveLighting("C", "default"),
      water: resolveWater("C"),
      postfx: resolvePostFx("C"),
      avatarAnim: resolveAvatarAnimation("idle", { reducedMotion: true }),
    });
  });

  it("replays byte-identically and returns fresh presentation containers", () => {
    expect(buildArenaView).toBeTypeOf("function");
    if (!buildArenaView) return;

    const inputs = {
      world: FIXTURE,
      signals: createSyntheticMasteryFeed(),
      tierTable: TIERS,
      catalog: CATALOG,
      avatar: { learnerRef: "learner-synthetic-001", equipped: [] },
      caps: FULL_CAPS,
      options: { ageBand: "12-14", reducedMotion: false, plainMode: false },
    } as const satisfies BuildArenaViewInputs;
    const first = buildArenaView(inputs);
    const second = buildArenaView(inputs);

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).not.toBe(second);
    expect(first.presentation).not.toBe(second.presentation);
    expect(first.presentation.biomes).not.toBe(second.presentation.biomes);
    expect(first.presentation.camera).not.toBe(second.presentation.camera);
    expect(first.presentation.assetKeys).not.toBe(second.presentation.assetKeys);

    first.presentation.biomes[0]!.landmarks.push("consumer mutation");
    first.presentation.camera.restTarget.x = 999;
    first.presentation.assetKeys.avatar.push("consumer-mutation");

    expect(buildArenaView(inputs)).toEqual(second);
  });
});
