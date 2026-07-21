export { SECTIONS } from "./model";
export type {
  AgeBand,
  ArenaView,
  AssetKeyRegistry,
  AvatarAnimationSpec,
  AvatarAnimationState,
  AvatarState,
  BasePlacement,
  BiomeIdentity,
  CameraConfig3D,
  CelebrationEvent,
  CohortBase,
  CompetencyNode,
  CooperativeMissionResult,
  Cosmetic,
  CosmeticEligibility,
  CosmeticRule,
  DeviceCaps,
  LightingConfig,
  MotionSpec,
  MotionToken,
  NearPeerStanding,
  NodeMasterySignal,
  NodePosition,
  NodeState,
  NodeTransform3D,
  Palette,
  ParallaxLayer,
  PostFxConfig,
  Presentation,
  ProgressionState,
  QualityBudget,
  QualityTier,
  QuestWorld,
  RewardRepresentation,
  Section,
  SoundCue,
  Tier,
  VisualBand,
  WaterConfig,
  WorldLayout,
  WorldTheme,
  WorldTransform3D,
} from "./model";

export type { AssetFallbackDescriptor, AssetKeyGroup } from "./assets";
export type { LearningMomentSignal } from "./celebrate";
export type {
  NodeLightCandidate,
  NodeLightContribution,
  PointLightDescriptor,
} from "./lighting";
export type { BuildArenaViewInputs, InitialArenaView, ProgressionArenaView } from "./view";

export { BASE_LAYOUT } from "./baseLayout.fixture";
export { BIOMES } from "./biomes.fixture";
export { CATALOG } from "./catalog.fixture";
export { FIXTURE } from "./graph.fixture";
export { TIERS } from "./tiers.fixture";

export { PALETTE, TYPOGRAPHY, resolveBiome, resolveElevation } from "./art";
export { ASSET_KEYS, resolveAssetFallback } from "./assets";
export { resolveAvatarAnimation } from "./avatar";
export { applyCohortContribution } from "./base";
export { celebrationMotionSpec, classifyCelebration } from "./celebrate";
export { deriveCosmeticEligibility, equipCosmetic } from "./cosmetics";
export { createSyntheticMasteryFeed } from "./feed";
export { resolveNodeLightContributions } from "./lighting";
export { EASINGS, LAMBDAS, MOTION, resolveMotion } from "./motion";
export { computeProgression, tierForReward } from "./progression";
export { QUALITY_TIERS, nextLowerTier, resolveQualityTier } from "./quality";
export {
  CAMERA3D,
  LIGHTING,
  PARALLAX3D,
  POSTFX,
  WATER,
  WORLD_SCALE,
  resolveLighting,
  resolveParallaxLayers,
  resolvePostFx,
  resolveWater,
} from "./scene3d";
export { SOUND_CUES, resolveSoundCue } from "./sound";
export { layoutQuestWorld } from "./layout";
export { deriveNodeStates } from "./nodes";
export { buildQuestWorld } from "./world";
export { resolveWorldTransform } from "./worldTransform";
export { buildArenaView } from "./view";
