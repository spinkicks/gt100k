import { PALETTE, resolveBiome } from "./art";
import { ASSET_KEYS } from "./assets";
import { resolveAvatarAnimation } from "./avatar";
import { layoutQuestWorld } from "./layout";
import type { AgeBand, DeviceCaps, NodeMasterySignal, QuestWorld } from "./model";
import { deriveNodeStates } from "./nodes";
import { QUALITY_TIERS, resolveQualityTier } from "./quality";
import {
  CAMERA3D,
  resolveLighting,
  resolveParallaxLayers,
  resolvePostFx,
  resolveWater,
} from "./scene3d";
import { buildQuestWorld } from "./world";
import { resolveWorldTransform } from "./worldTransform";

export interface BuildArenaViewInputs {
  readonly world: QuestWorld;
  readonly signals: readonly NodeMasterySignal[];
  readonly caps: DeviceCaps;
  readonly options: {
    readonly ageBand: AgeBand;
    readonly reducedMotion: boolean;
    readonly plainMode: boolean;
    readonly avatarIntent?: Parameters<typeof resolveAvatarAnimation>[0];
  };
}

export function buildArenaView(inputs: BuildArenaViewInputs) {
  const world = buildQuestWorld(inputs.world);
  const layout = layoutQuestWorld(world);
  const reducedMotion = inputs.options.reducedMotion || inputs.caps.prefersReducedMotion;
  const qualityTier = resolveQualityTier({
    ...inputs.caps,
    prefersReducedMotion: reducedMotion,
  });

  return {
    world,
    layout,
    nodeStates: [...deriveNodeStates(world, inputs.signals)].map(([nodeId, state]) => ({
      nodeId,
      state,
    })),
    presentation: {
      biomes: world.regions.map((region) => {
        const biome = resolveBiome(region);
        return { ...biome, landmarks: [...biome.landmarks] };
      }),
      worldTransform: resolveWorldTransform(layout),
      camera: { ...CAMERA3D, restTarget: { ...CAMERA3D.restTarget } },
      parallax: resolveParallaxLayers(),
      lighting: resolveLighting(qualityTier, "default"),
      water: resolveWater(qualityTier),
      postfx: resolvePostFx(qualityTier),
      avatarAnim: resolveAvatarAnimation(inputs.options.avatarIntent ?? "idle", {
        reducedMotion,
      }),
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
      palette: { ...PALETTE },
    },
    flags: {
      reducedMotion,
      plainMode: inputs.options.plainMode,
      ageBand: inputs.options.ageBand,
    },
  };
}

export type InitialArenaView = ReturnType<typeof buildArenaView>;
