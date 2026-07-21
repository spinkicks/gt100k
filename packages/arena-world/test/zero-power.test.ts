import {
  type AvatarState,
  CATALOG,
  FIXTURE,
  type NearPeerStanding,
  type NodeMasterySignal,
  type QuestWorld,
  TIERS,
  type Tier,
  type WorldTheme,
  buildQuestWorld,
  computeProgression,
  createSyntheticMasteryFeed,
  deriveCosmeticEligibility,
  deriveNodeStates,
  equipCosmetic,
  resolveLighting,
} from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

const world = buildQuestWorld(FIXTURE);
const signals = createSyntheticMasteryFeed();
const nodeStates = deriveNodeStates(world, signals);
const progression = computeProgression(world, signals, TIERS);
const eligibility = deriveCosmeticEligibility(CATALOG, progression, nodeStates, world);
const cosmeticSets = powerSet(CATALOG.map(({ id }) => id));
const syntheticNearPeers = [
  { pseudonym: "peer-synthetic-amber", gain: 340 },
  { pseudonym: "peer-synthetic-cobalt", gain: 360 },
] as const;

function deriveOutcomeSnapshot(
  questWorld: QuestWorld,
  masterySignals: readonly NodeMasterySignal[],
) {
  const states = deriveNodeStates(questWorld, masterySignals);
  const learnerProgression = computeProgression(questWorld, masterySignals, TIERS);
  const standing = {
    band: "synthetic-near-peer-band",
    anonymizedPeers: syntheticNearPeers.map((peer) => ({ ...peer })),
    selfGain: learnerProgression.cumulativeIndependenceReward,
    gainToBandTop: Math.max(
      0,
      ...syntheticNearPeers.map(
        ({ gain }) => gain - learnerProgression.cumulativeIndependenceReward,
      ),
    ),
  } satisfies NearPeerStanding;

  return {
    mastery: masterySignals.map(({ nodeId, masteryCleared, independenceReward }) => ({
      nodeId,
      masteryCleared,
      independenceReward,
    })),
    nodeStates: [...states],
    progression: learnerProgression,
    matchmaking: {
      band: standing.band,
      peerRefs: standing.anonymizedPeers.map(({ pseudonym }) => pseudonym),
    },
    standing,
    access: questWorld.nodes.filter(({ id }) => states.get(id) !== "locked").map(({ id }) => id),
  };
}

describe("zero-power cosmetics and tiers", () => {
  it("keeps every learning, matchmaking, standing, and access outcome byte-identical", () => {
    const baseline = JSON.stringify(deriveOutcomeSnapshot(world, signals));
    let variantsChecked = 0;

    for (const tier of TIERS) {
      for (const equipped of cosmeticSets) {
        const appearance = {
          tier,
          avatar: { learnerRef: "learner-synthetic-kestrel", equipped },
          lighting: resolveLighting("A", worldThemeFor(equipped)),
        };

        expect(appearance.avatar.equipped).toEqual(equipped);
        expect(JSON.stringify(deriveOutcomeSnapshot(world, signals))).toBe(baseline);
        variantsChecked += 1;
      }
    }

    expect(variantsChecked).toBe(6 * 2 ** 9);
  });

  it("keeps outcome functions structurally unable to receive cosmetics or tier state", () => {
    expect(deriveNodeStates).toHaveLength(2);
    expect(computeProgression).toHaveLength(3);
    expectTypeOf(deriveNodeStates).parameters.toEqualTypeOf<
      [world: QuestWorld, signals: readonly NodeMasterySignal[]]
    >();
    expectTypeOf(computeProgression).parameters.toEqualTypeOf<
      [
        world: QuestWorld,
        signals: readonly NodeMasterySignal[],
        tierTable: readonly Tier[],
        previousReward?: number,
      ]
    >();
  });

  it("equips an earned cosmetic without changing any non-cosmetic avatar field", () => {
    const avatar: AvatarState = {
      learnerRef: "learner-synthetic-kestrel",
      equipped: [],
    };
    Object.freeze(avatar.equipped);
    Object.freeze(avatar);

    const equipped = equipCosmetic(avatar, "avatar-hat-explorer", eligibility);

    expect(equipped).toEqual({
      learnerRef: "learner-synthetic-kestrel",
      equipped: ["avatar-hat-explorer"],
    });
    expect(avatar).toEqual({ learnerRef: "learner-synthetic-kestrel", equipped: [] });
    expect(Object.keys(equipped)).toEqual(["learnerRef", "equipped"]);
    expectTypeOf<keyof AvatarState>().toEqualTypeOf<"learnerRef" | "equipped">();
  });

  it("lets world themes change lighting but never domain outcomes", () => {
    const baseline = JSON.stringify(deriveOutcomeSnapshot(world, signals));
    const defaultLighting = resolveLighting("A", "default");

    expect(resolveLighting("A", "dawn")).not.toEqual(defaultLighting);
    expect(resolveLighting("A", "dusk")).not.toEqual(defaultLighting);
    for (const theme of ["default", "dawn", "dusk"] as const) {
      resolveLighting("A", theme);
      expect(JSON.stringify(deriveOutcomeSnapshot(world, signals))).toBe(baseline);
    }
  });
});

function powerSet(ids: readonly string[]): string[][] {
  return Array.from({ length: 2 ** ids.length }, (_, mask) =>
    ids.filter((_, index) => (mask & (2 ** index)) !== 0),
  );
}

function worldThemeFor(equipped: readonly string[]): WorldTheme {
  if (equipped.includes("world-theme-dusk")) return "dusk";
  if (equipped.includes("world-theme-dawn")) return "dawn";
  return "default";
}
