import {
  type AvatarState,
  CATALOG,
  type Cosmetic,
  type CosmeticEligibility,
  FIXTURE,
  type NodeState,
  type ProgressionState,
  type QuestWorld,
  TIERS,
  buildQuestWorld,
  computeProgression,
  createSyntheticMasteryFeed,
  deriveNodeStates,
  resolveLighting,
} from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

type DeriveCosmeticEligibility = (
  catalog: readonly Cosmetic[],
  progression: ProgressionState,
  nodeStates: ReadonlyMap<string, NodeState>,
  world: QuestWorld,
) => CosmeticEligibility;

type EquipCosmetic = (
  avatar: AvatarState,
  cosmeticId: string,
  eligibility: CosmeticEligibility,
) => AvatarState;

const deriveCosmeticEligibility = (
  arenaWorld as typeof arenaWorld & {
    deriveCosmeticEligibility?: DeriveCosmeticEligibility;
  }
).deriveCosmeticEligibility;
const equipCosmetic = (arenaWorld as typeof arenaWorld & { equipCosmetic?: EquipCosmetic })
  .equipCosmetic;

const world = buildQuestWorld(FIXTURE);
const signals = createSyntheticMasteryFeed();
const progression = computeProgression(world, signals, TIERS);
const nodeStates = deriveNodeStates(world, signals);

describe("deriveCosmeticEligibility", () => {
  it("matches the exact S1 sets in catalog declaration order", () => {
    expect(deriveCosmeticEligibility).toBeTypeOf("function");
    if (!deriveCosmeticEligibility) return;

    expect(deriveCosmeticEligibility(CATALOG, progression, nodeStates, world)).toEqual({
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
  });

  it("replays deterministically with fresh result arrays", () => {
    expect(deriveCosmeticEligibility).toBeTypeOf("function");
    if (!deriveCosmeticEligibility) return;

    const first = deriveCosmeticEligibility(CATALOG, progression, nodeStates, world);
    const second = deriveCosmeticEligibility(CATALOG, progression, nodeStates, world);

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).not.toBe(second);
    expect(first.eligibleIds).not.toBe(second.eligibleIds);
    expect(first.lockedIds).not.toBe(second.lockedIds);
  });

  it("satisfies every deterministic rule variant from competence state", () => {
    expect(deriveCosmeticEligibility).toBeTypeOf("function");
    if (!deriveCosmeticEligibility) return;

    const ruleCatalog: Cosmetic[] = [
      {
        ...CATALOG[0]!,
        id: "tier-rule",
        eligibility: { type: "min-tier", tierIndex: 2 },
      },
      {
        ...CATALOG[2]!,
        id: "unlock-rule",
        eligibility: { type: "min-unlocks", count: 4 },
      },
      {
        ...CATALOG[5]!,
        id: "region-rule",
        eligibility: { type: "region-complete", region: "tinker-bluffs" },
      },
    ];

    expect(deriveCosmeticEligibility(ruleCatalog, progression, nodeStates, world)).toEqual({
      eligibleIds: ["tier-rule", "unlock-rule", "region-rule"],
      lockedIds: [],
    });
  });

  it("ignores visual descriptors while preserving their exact stable catalog values", () => {
    expect(deriveCosmeticEligibility).toBeTypeOf("function");
    if (!deriveCosmeticEligibility) return;

    expect(CATALOG.map(({ id, look, equipEffect }) => ({ id, look, equipEffect }))).toEqual([
      {
        id: "avatar-hat-explorer",
        look: "soft tan felt explorer's cap",
        equipEffect: "tilts slightly on walk (reduced motion: static tilt)",
      },
      {
        id: "avatar-cape-aurora",
        look: "teal-to-plum aurora-gradient cape",
        equipEffect: "trails on run (reduced motion: static cape, no trail)",
      },
      {
        id: "avatar-badge-firstlight",
        look: "small gold first-light star pin",
        equipEffect: "glints (emissive) on idle (reduced motion: static pin)",
      },
      {
        id: "world-theme-dawn",
        look: "rosier dawn sky and softer light",
        equipEffect:
          "recolors sky/sea and shifts the lighting rig on equip (reduced motion: instant recolor)",
      },
      {
        id: "world-theme-dusk",
        look: "deep-indigo dusk with brighter lanterns and stars",
        equipEffect:
          "indigo ambient, beacons more prominent, and star cards twinkle (reduced motion: static stars, indigo rig)",
      },
      {
        id: "base-banner-unity",
        look: "co-signed cohort unity banner",
        equipEffect: "shows contributor marks (reduced motion: static banner)",
      },
      {
        id: "base-lantern-warm",
        look: "warm lantern strings around camp",
        equipEffect: "gentle sway (reduced motion: static strings)",
      },
      {
        id: "celebration-bloom",
        look: "unlock burst as flower-petal bloom",
        equipEffect: "changes particle shape (reduced motion: static petal badge)",
      },
      {
        id: "celebration-aurora",
        look: "unlock burst as aurora ribbons with sky shimmer",
        equipEffect: "rarest sky one-shot (reduced motion: static ribbon badge)",
      },
    ]);

    const changedVisuals = CATALOG.map((cosmetic) => ({
      ...cosmetic,
      look: `alternate look for ${cosmetic.id}`,
      equipEffect: `alternate effect for ${cosmetic.id}`,
    }));

    expect(deriveCosmeticEligibility(changedVisuals, progression, nodeStates, world)).toEqual(
      deriveCosmeticEligibility(CATALOG, progression, nodeStates, world),
    );
  });

  it("keeps an earned world theme appearance-only", () => {
    expect(deriveCosmeticEligibility).toBeTypeOf("function");
    if (!deriveCosmeticEligibility) return;

    const eligibility = deriveCosmeticEligibility(CATALOG, progression, nodeStates, world);

    expect(eligibility.eligibleIds).toContain("world-theme-dawn");
    expect(resolveLighting("A", "dawn")).toEqual({
      ...resolveLighting("A", "default"),
      key: {
        ...resolveLighting("A", "default").key,
        colorHex: "#FFCDB0",
        intensity: 2.2,
      },
      hemi: { ...resolveLighting("A", "default").hemi, skyHex: "#FBD9C0" },
    });
  });
});

describe("equipCosmetic", () => {
  it("rejects the unearned aurora cape in S1", () => {
    expect(deriveCosmeticEligibility).toBeTypeOf("function");
    expect(equipCosmetic).toBeTypeOf("function");
    if (!deriveCosmeticEligibility || !equipCosmetic) return;

    const eligibility = deriveCosmeticEligibility(CATALOG, progression, nodeStates, world);
    const avatar = { learnerRef: "learner-synthetic-001", equipped: [] };

    expect(() => equipCosmetic(avatar, "avatar-cape-aurora", eligibility)).toThrow(/not eligible/i);
    expect(avatar).toEqual({ learnerRef: "learner-synthetic-001", equipped: [] });
  });

  it("returns a fresh avatar with an eligible cosmetic equipped once", () => {
    expect(deriveCosmeticEligibility).toBeTypeOf("function");
    expect(equipCosmetic).toBeTypeOf("function");
    if (!deriveCosmeticEligibility || !equipCosmetic) return;

    const eligibility = deriveCosmeticEligibility(CATALOG, progression, nodeStates, world);
    const avatar = {
      learnerRef: "learner-synthetic-001",
      equipped: ["avatar-badge-firstlight"],
    };
    const first = equipCosmetic(avatar, "avatar-hat-explorer", eligibility);
    const second = equipCosmetic(first, "avatar-hat-explorer", eligibility);

    expect(first).toEqual({
      learnerRef: "learner-synthetic-001",
      equipped: ["avatar-badge-firstlight", "avatar-hat-explorer"],
    });
    expect(second).toEqual(first);
    expect(first).not.toBe(avatar);
    expect(second).not.toBe(first);
    expect(avatar.equipped).toEqual(["avatar-badge-firstlight"]);
  });

  it("has only the domain inputs in its public contract", () => {
    expect(equipCosmetic).toBeTypeOf("function");
    if (!equipCosmetic) return;

    expect(equipCosmetic).toHaveLength(3);
    expectTypeOf(equipCosmetic).parameters.toEqualTypeOf<
      [avatar: AvatarState, cosmeticId: string, eligibility: CosmeticEligibility]
    >();
  });
});
