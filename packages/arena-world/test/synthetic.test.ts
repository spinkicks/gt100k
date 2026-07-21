import { readFileSync, readdirSync } from "node:fs";
import {
  ASSET_KEYS,
  type AvatarState,
  type BuildArenaViewInputs,
  CATALOG,
  type CohortBase,
  type CooperativeMissionResult,
  type Cosmetic,
  FIXTURE,
  type NodeMasterySignal,
  TIERS,
  applyCohortContribution,
  buildArenaView,
  buildQuestWorld,
  celebrationMotionSpec,
  classifyCelebration,
  computeProgression,
  createSyntheticMasteryFeed,
  deriveCosmeticEligibility,
  deriveNodeStates,
  deriveStanding,
  equipCosmetic,
  layoutQuestWorld,
  nextLowerTier,
  plainViewEquals,
  resolveAssetFallback,
  resolveAvatarAnimation,
  resolveBaseLayout,
  resolveBiome,
  resolveElevation,
  resolveLighting,
  resolveMotion,
  resolveNodeLightContributions,
  resolveParallaxLayers,
  resolvePostFx,
  resolveQualityTier,
  resolveRewardRepresentation,
  resolveSoundCue,
  resolveVisualBand,
  resolveWater,
  resolveWorldTransform,
  tierForReward,
} from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

const SYNTHETIC_MISSIONS = [
  { missionId: "m1", feature: "campfire", by: "kestrel" },
  { missionId: "m2", feature: "banner", by: "otter" },
  { missionId: "m3", feature: "garden", by: "kestrel" },
] as const satisfies readonly CooperativeMissionResult[];

const SYNTHETIC_NEAR_PEERS = [
  { pseudonym: "peer-synthetic-kestrel", gain: 260 },
  { pseudonym: "peer-synthetic-otter", gain: 340 },
  { pseudonym: "peer-synthetic-finch", gain: 300 },
] as const;

const SYNTHETIC_CAPS = {
  webgl2: true,
  webgl1: true,
  prefersReducedMotion: false,
  deviceMemoryGB: 8,
  hardwareConcurrency: 8,
} as const;

const DOMAIN_SOURCE = readdirSync(new URL("../src/", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
  .map((entry) => readFileSync(new URL(`../src/${entry.name}`, import.meta.url), "utf8"))
  .join("\n");

describe("synthetic-only arena domain", () => {
  it("runs every public domain function end-to-end from synthetic fixtures", () => {
    const first = runSyntheticSurface();
    const second = runSyntheticSurface();
    const publicFunctionNames = Object.entries(arenaWorld)
      .filter(([, value]) => typeof value === "function")
      .map(([name]) => name)
      .sort();

    expect(Object.keys(first.calls).sort()).toEqual(publicFunctionNames);
    expect(first.calls.buildArenaView).toEqual(second.calls.buildArenaView);
    expect(first.calls.buildArenaView).not.toBe(second.calls.buildArenaView);
    expect(first.calls.createSyntheticMasteryFeed).toEqual(second.calls.createSyntheticMasteryFeed);
    expect(first.calls.createSyntheticMasteryFeed).not.toBe(
      second.calls.createSyntheticMasteryFeed,
    );
    expect(first.calls.buildArenaView).toMatchObject({
      progression: { cumulativeIndependenceReward: 300, masteredCount: 4 },
      avatar: {
        learnerRef: "learner-synthetic-kestrel",
        equipped: ["avatar-hat-explorer"],
      },
      base: {
        cohortRef: "cohort-synthetic-six",
        contributions: SYNTHETIC_MISSIONS,
        unlockedFeatures: ["campfire", "banner", "garden"],
      },
      standing: { selfGain: 300, gainToBandTop: 40 },
      presentation: {
        qualityTier: "A",
      },
    });
    expect(first.calls.buildArenaView.world.nodes).toHaveLength(9);
    expect(first.calls.buildArenaView.world.regions).toHaveLength(4);
    expect(first.calls.buildArenaView.presentation.basePlacements).toHaveLength(3);
    expect(first.calls.buildArenaView.presentation.worldTransform.nodes).toHaveLength(9);
    expect(first.calls.plainViewEquals).toBe(true);
    expect(first.calls.classifyCelebration).toMatchObject({
      type: "independent-unlock",
      intensity: "high",
      copyStyle: "process-praise",
    });
    expect(first.calls.celebrationMotionSpec).toMatchObject({
      mode: "animated",
      particleCount: 24,
    });
    expect(first.calls.resolveSoundCue).toEqual({
      cueId: "beacon-arpeggio",
      caption: "[beacon lights up]",
      mutedByDefault: true,
    });
  });

  it("requires only pseudonymous synthetic state, never governance workflow inputs", () => {
    type WorkflowInput = "consent" | "admissions" | "legal" | "governance";
    type SensitiveIdentityField = "legalName" | "email" | "birthDate" | "biometric" | "address";
    type DomainIdentityKeys =
      | keyof AvatarState
      | keyof CohortBase
      | keyof CooperativeMissionResult
      | keyof Cosmetic
      | keyof NodeMasterySignal;

    expectTypeOf<Extract<keyof BuildArenaViewInputs, WorkflowInput>>().toEqualTypeOf<never>();
    expectTypeOf<Extract<DomainIdentityKeys, SensitiveIdentityField>>().toEqualTypeOf<never>();
    expectTypeOf<keyof BuildArenaViewInputs>().toEqualTypeOf<
      | "world"
      | "signals"
      | "tierTable"
      | "catalog"
      | "avatar"
      | "base"
      | "nearPeers"
      | "caps"
      | "options"
    >();
    expectTypeOf<keyof BuildArenaViewInputs["options"]>().toEqualTypeOf<
      | "ageBand"
      | "reducedMotion"
      | "plainMode"
      | "standingsOptedIn"
      | "previousReward"
      | "avatarIntent"
    >();
    expectTypeOf<keyof BuildArenaViewInputs["nearPeers"][number]>().toEqualTypeOf<
      "pseudonym" | "gain"
    >();
    expectTypeOf<keyof AvatarState>().toEqualTypeOf<"learnerRef" | "equipped">();
    expectTypeOf<keyof CohortBase>().toEqualTypeOf<
      "cohortRef" | "contributions" | "unlockedFeatures"
    >();
    expectTypeOf<keyof CooperativeMissionResult>().toEqualTypeOf<"missionId" | "feature" | "by">();
    expectTypeOf<keyof Cosmetic>().toEqualTypeOf<
      "id" | "kind" | "eligibility" | "look" | "equipEffect"
    >();
    expectTypeOf<keyof NodeMasterySignal>().toEqualTypeOf<
      "nodeId" | "masteryCleared" | "independenceReward"
    >();

    const serializedSurface = JSON.stringify(runSyntheticSurface().calls);

    expect(serializedSurface).toContain("learner-synthetic-kestrel");
    expect(serializedSurface).toContain("peer-synthetic-kestrel");
    expect(serializedSurface).not.toMatch(
      /"(?:consent|admissions|legal|governance|legalName|email|birthDate|biometric|address)"\s*:/,
    );
  });

  it("has no live-data, network, wall-clock, or governance machinery", () => {
    expect(DOMAIN_SOURCE).not.toMatch(
      /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(|\bDate\b|performance\.now|process\.env|https?:\/\//,
    );
    expect(DOMAIN_SOURCE).not.toMatch(
      /\b(?:consent|admissions|legal workflow|governance workflow|live learner)\b/i,
    );
  });
});

function runSyntheticSurface() {
  const signals = createSyntheticMasteryFeed();
  const world = buildQuestWorld(FIXTURE);
  const layout = layoutQuestWorld(world);
  const worldTransform = resolveWorldTransform(layout);
  const nodeStates = deriveNodeStates(world, signals);
  const progression = computeProgression(world, signals, TIERS, 240);
  const eligibility = deriveCosmeticEligibility(CATALOG, progression, nodeStates, world);
  const avatar = equipCosmetic(
    { learnerRef: "learner-synthetic-kestrel", equipped: [] },
    "avatar-hat-explorer",
    eligibility,
  );
  const base = SYNTHETIC_MISSIONS.reduce(
    (current, mission) => applyCohortContribution(current, mission),
    emptySyntheticBase(),
  );
  const celebration = classifyCelebration({
    type: "independent-unlock",
    nodeId: "place-value-point",
    transferCritical: true,
  });
  if (!celebration) throw new Error("Synthetic independent unlock must produce a celebration");

  const inputs = createSyntheticViewInputs(signals, avatar, base);
  const view = buildArenaView(inputs);
  const calmView = buildArenaView({
    ...inputs,
    caps: { ...inputs.caps, prefersReducedMotion: true },
    options: { ...inputs.options, reducedMotion: true, plainMode: true },
  });
  const stateByNode = new Map(view.nodeStates.map(({ nodeId, state }) => [nodeId, state]));
  const transformByNode = new Map(
    worldTransform.nodes.map(({ nodeId, x, y, z }) => [nodeId, { x, y, z }]),
  );
  const lightCandidates = world.nodes.map((node) => ({
    nodeId: node.id,
    state: stateByNode.get(node.id) ?? "locked",
    transferCritical: node.transferCritical,
    position: transformByNode.get(node.id) ?? { x: 0, y: 0, z: 0 },
  }));
  const assetKey = ASSET_KEYS.avatar[0];
  if (!assetKey) throw new Error("Synthetic asset registry must include an avatar key");

  return {
    calls: {
      applyCohortContribution: base,
      buildArenaView: view,
      buildQuestWorld: world,
      celebrationMotionSpec: celebrationMotionSpec(celebration, { reducedMotion: false }),
      classifyCelebration: celebration,
      computeProgression: progression,
      createSyntheticMasteryFeed: signals,
      deriveCosmeticEligibility: eligibility,
      deriveNodeStates: [...nodeStates],
      deriveStanding: deriveStanding(
        { band: "12-14", selfGain: progression.cumulativeIndependenceReward },
        SYNTHETIC_NEAR_PEERS,
        { optedIn: true },
      ),
      equipCosmetic: avatar,
      layoutQuestWorld: layout,
      nextLowerTier: nextLowerTier("A"),
      plainViewEquals: plainViewEquals(view, calmView),
      resolveAssetFallback: resolveAssetFallback(assetKey),
      resolveAvatarAnimation: resolveAvatarAnimation("walk", { reducedMotion: false }),
      resolveBaseLayout: resolveBaseLayout(base),
      resolveBiome: resolveBiome(world.regions[0] ?? "numbers-coast"),
      resolveElevation: resolveElevation(world.regions[0] ?? "numbers-coast"),
      resolveLighting: resolveLighting("A", "default"),
      resolveMotion: resolveMotion("equip", { reducedMotion: false }),
      resolveNodeLightContributions: resolveNodeLightContributions(
        lightCandidates,
        "A",
        "default",
        { x: 0, y: 0, z: 0 },
      ),
      resolveParallaxLayers: resolveParallaxLayers(),
      resolvePostFx: resolvePostFx("A"),
      resolveQualityTier: resolveQualityTier(SYNTHETIC_CAPS),
      resolveRewardRepresentation: resolveRewardRepresentation("12-14", progression),
      resolveSoundCue: resolveSoundCue("unlockHigh"),
      resolveVisualBand: resolveVisualBand("12-14"),
      resolveWater: resolveWater("A"),
      resolveWorldTransform: worldTransform,
      tierForReward: tierForReward(progression.cumulativeIndependenceReward, TIERS),
    },
  };
}

function emptySyntheticBase(): CohortBase {
  return {
    cohortRef: "cohort-synthetic-six",
    contributions: [],
    unlockedFeatures: [],
  };
}

function createSyntheticViewInputs(
  signals: readonly NodeMasterySignal[],
  avatar: AvatarState,
  base: CohortBase,
) {
  return {
    world: FIXTURE,
    signals,
    tierTable: TIERS,
    catalog: CATALOG,
    avatar,
    base,
    nearPeers: SYNTHETIC_NEAR_PEERS,
    caps: SYNTHETIC_CAPS,
    options: {
      ageBand: "12-14",
      reducedMotion: false,
      plainMode: false,
      standingsOptedIn: true,
      previousReward: 240,
      avatarIntent: "walk",
    },
  } as const satisfies BuildArenaViewInputs;
}
