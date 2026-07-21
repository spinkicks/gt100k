import { PALETTE, resolveBiome } from "./art";
import { ASSET_KEYS } from "./assets";
import { resolveAvatarAnimation } from "./avatar";
import { resolveBaseLayout } from "./baseLayout";
import { deriveCosmeticEligibility } from "./cosmetics";
import { layoutQuestWorld } from "./layout";
import type {
  AgeBand,
  ArenaView,
  AvatarState,
  CohortBase,
  Cosmetic,
  DeviceCaps,
  NodeMasterySignal,
  QuestWorld,
  Tier,
  WorldTheme,
} from "./model";
import { deriveNodeStates } from "./nodes";
import { computeProgression } from "./progression";
import { QUALITY_TIERS, resolveQualityTier } from "./quality";
import {
  CAMERA3D,
  resolveLighting,
  resolveParallaxLayers,
  resolvePostFx,
  resolveWater,
} from "./scene3d";
import { resolveRewardRepresentation, resolveVisualBand } from "./staging";
import { deriveStanding } from "./standings";
import { buildQuestWorld } from "./world";
import { resolveWorldTransform } from "./worldTransform";

export interface BuildArenaViewInputs {
  readonly world: QuestWorld;
  readonly signals: readonly NodeMasterySignal[];
  readonly tierTable: readonly Tier[];
  readonly catalog: readonly Cosmetic[];
  readonly avatar: AvatarState;
  readonly base: CohortBase;
  readonly nearPeers: readonly { readonly pseudonym: string; readonly gain: number }[];
  readonly caps: DeviceCaps;
  readonly options: {
    readonly ageBand: AgeBand;
    readonly reducedMotion: boolean;
    readonly plainMode: boolean;
    readonly standingsOptedIn: boolean;
    readonly previousReward?: number;
    readonly avatarIntent?: Parameters<typeof resolveAvatarAnimation>[0];
  };
}

export function buildArenaView(inputs: BuildArenaViewInputs): ArenaView {
  const world = buildQuestWorld(inputs.world);
  const layout = layoutQuestWorld(world);
  const nodeStateMap = deriveNodeStates(world, inputs.signals);
  const progression = computeProgression(
    world,
    inputs.signals,
    inputs.tierTable,
    inputs.options.previousReward,
  );
  const eligibility = deriveCosmeticEligibility(inputs.catalog, progression, nodeStateMap, world);
  const reducedMotion = inputs.options.reducedMotion || inputs.caps.prefersReducedMotion;
  const qualityTier = resolveQualityTier({
    ...inputs.caps,
    prefersReducedMotion: reducedMotion,
  });
  const worldTheme = resolveEquippedWorldTheme(inputs.avatar.equipped);
  const base = {
    cohortRef: inputs.base.cohortRef,
    contributions: inputs.base.contributions.map((contribution) => ({ ...contribution })),
    unlockedFeatures: [...inputs.base.unlockedFeatures],
  };
  const standing = deriveStanding(
    {
      band: inputs.options.ageBand,
      selfGain: progression.cumulativeIndependenceReward,
    },
    inputs.nearPeers,
    { optedIn: inputs.options.standingsOptedIn },
  );

  return {
    world,
    layout,
    nodeStates: [...nodeStateMap].map(([nodeId, state]) => ({
      nodeId,
      state,
    })),
    progression,
    representation: resolveRewardRepresentation(inputs.options.ageBand, progression),
    avatar: {
      learnerRef: inputs.avatar.learnerRef,
      equipped: [...inputs.avatar.equipped],
    },
    eligibility,
    base,
    standing,
    presentation: {
      biomes: world.regions.map((region) => {
        const biome = resolveBiome(region);
        return { ...biome, landmarks: [...biome.landmarks] };
      }),
      worldTransform: resolveWorldTransform(layout),
      camera: { ...CAMERA3D, restTarget: { ...CAMERA3D.restTarget } },
      parallax: resolveParallaxLayers(),
      lighting: resolveLighting(qualityTier, worldTheme),
      water: resolveWater(qualityTier),
      postfx: resolvePostFx(qualityTier),
      avatarAnim: resolveAvatarAnimation(inputs.options.avatarIntent ?? "idle", {
        reducedMotion,
      }),
      visualBand: resolveVisualBand(inputs.options.ageBand),
      qualityTier,
      qualityBudget: { ...QUALITY_TIERS[qualityTier] },
      assetKeys: {
        avatar: [...ASSET_KEYS.avatar],
        nodes: [...ASSET_KEYS.nodes],
        regions: [...ASSET_KEYS.regions],
        base: [...ASSET_KEYS.base],
        fx: [...ASSET_KEYS.fx],
        ui: [...ASSET_KEYS.ui],
      },
      basePlacements: resolveBaseLayout(base),
      palette: { ...PALETTE },
    },
    flags: {
      reducedMotion,
      plainMode: inputs.options.plainMode,
      ageBand: inputs.options.ageBand,
    },
  };
}

type ComparableArenaState = Pick<
  ArenaView,
  "world" | "layout" | "nodeStates" | "progression" | "eligibility" | "base" | "standing"
>;

export function plainViewEquals(full: ComparableArenaState, plain: ComparableArenaState): boolean {
  return stateFingerprint(full) === stateFingerprint(plain);
}

function stateFingerprint(view: ComparableArenaState): string {
  return JSON.stringify([
    view.world,
    view.layout,
    view.nodeStates,
    view.progression,
    view.eligibility,
    view.base,
    view.standing,
  ]);
}

const WORLD_THEME_BY_COSMETIC_ID: Readonly<Record<string, WorldTheme>> = {
  "world-theme-dawn": "dawn",
  "world-theme-dusk": "dusk",
};

function resolveEquippedWorldTheme(equipped: readonly string[]): WorldTheme {
  for (let index = equipped.length - 1; index >= 0; index -= 1) {
    const cosmeticId = equipped[index];
    if (!cosmeticId) continue;
    const theme = WORLD_THEME_BY_COSMETIC_ID[cosmeticId];
    if (theme) return theme;
  }

  return "default";
}

export type BaseArenaView = ReturnType<typeof buildArenaView>;
export type ProgressionArenaView = BaseArenaView;
export type InitialArenaView = BaseArenaView;
