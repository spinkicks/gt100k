import type { Section } from "@gt100k/learning-loop";

export { SECTIONS, type Section } from "@gt100k/learning-loop";

export type AgeBand = "6-8" | "9-11" | "12-14";

export interface CompetencyNode {
  id: string;
  title: string;
  sections: Section[];
  prerequisites: string[];
  region: string;
  landmark: string;
  transferCritical: boolean;
}

export interface QuestWorld {
  nodes: CompetencyNode[];
  edges: Array<{ from: string; to: string }>;
  regions: string[];
}

export interface NodePosition {
  nodeId: string;
  x: number;
  y: number;
}

export interface WorldLayout {
  positions: NodePosition[];
  bounds: { x: 0; y: 0; width: 2048; height: 2048 };
}

export interface NodeTransform3D {
  nodeId: string;
  x: number;
  y: number;
  z: number;
}

export interface WorldTransform3D {
  nodes: NodeTransform3D[];
  worldScale: number;
  seaLevel: number;
  bounds3D: {
    size: number;
    center: { x: number; y: number; z: number };
  };
}

export interface NodeMasterySignal {
  nodeId: string;
  masteryCleared: boolean;
  independenceReward: number;
}

export type NodeState = "locked" | "available" | "unlocked";

export interface Tier {
  index: number;
  label: string;
  minReward: number;
}

export interface ProgressionState {
  cumulativeIndependenceReward: number;
  masteredCount: number;
  regionsComplete: string[];
  tier: Tier;
  growthVsPast: { previous: number; current: number; delta: number };
}

export type CosmeticRule =
  | { type: "min-tier"; tierIndex: number }
  | { type: "min-unlocks"; count: number }
  | { type: "region-complete"; region: string };

export interface Cosmetic {
  id: string;
  kind: "avatar-item" | "world-theme" | "base-theme" | "celebration-effect";
  eligibility: CosmeticRule;
  look: string;
  equipEffect: string;
}

export interface CosmeticEligibility {
  eligibleIds: string[];
  lockedIds: string[];
}

export interface AvatarState {
  learnerRef: string;
  equipped: string[];
}

export type AvatarAnimationState =
  | "idle"
  | "walk"
  | "run"
  | "think"
  | "celebrate"
  | "idle-static"
  | "walk-static"
  | "run-static"
  | "think-static"
  | "celebrate-static";

export interface AvatarAnimationSpec {
  state: AvatarAnimationState;
  loop: boolean;
  durationMs: number;
  easing: string;
  amplitudePx: number;
}

export interface CooperativeMissionResult {
  missionId: string;
  feature: string;
  by: string;
}

export interface CohortBase {
  cohortRef: string;
  contributions: CooperativeMissionResult[];
  unlockedFeatures: string[];
}

export interface BasePlacement {
  feature: string;
  zone: string;
  x: number;
  y: number;
  by: string;
}

export interface CelebrationEvent {
  type: "independent-unlock" | "productive-struggle";
  nodeId?: string;
  intensity: "low" | "medium" | "high";
  copyStyle: "process-praise";
}

export interface MotionSpec {
  mode: "animated" | "static";
  particleCount: number;
  durationMs: number;
  cameraPunch: boolean;
  bloomPeak: number;
}

export interface MotionToken {
  kind: string;
  mode: "animated" | "reduced";
  durationMs: number;
  easing: string;
}

export interface BiomeIdentity {
  region: string;
  name: string;
  signatureHex: string;
  terrainHex: string;
  ambientHex: string;
  elevation: number;
  landmarks: string[];
}

export type WorldTheme = "default" | "dawn" | "dusk";

export interface CameraConfig3D {
  fov: number;
  near: number;
  far: number;
  distanceDefault: number;
  distanceRegion: number;
  distanceMin: number;
  distanceMax: number;
  introDistance: number;
  followLambda: number;
  orbitDampingFactor: number;
  orbitYawMinDeg: number;
  orbitYawMaxDeg: number;
  pitchMinDeg: number;
  pitchMaxDeg: number;
  deadzoneRadius: number;
  lookAheadUnits: number;
  punchDistDelta: number;
  punchFovDelta: number;
  punchOutMs: number;
  punchBackMs: number;
  restTarget: { x: number; y: number; z: number };
}

export interface ParallaxLayer {
  id: string;
  scrollFactor: number;
}

interface DirectionalLightConfig {
  type: "directional";
  dir: { x: number; y: number; z: number };
  colorHex: string;
  intensity: number;
}

interface PointLightConfig {
  colorHex: string;
  intensity: number;
  distance: number;
  decay: number;
}

export interface LightingConfig {
  key: DirectionalLightConfig & { castShadow: boolean };
  hemi: { skyHex: string; groundHex: string; intensity: number };
  ambient: { colorHex: string; intensity: number };
  rim: DirectionalLightConfig;
  sunDriftDeg: number;
  sunDriftMs: number;
  shadow: { mapSize: number; bias: number; soft: boolean };
  beacon: PointLightConfig;
  beaconTransfer: PointLightConfig;
  availableGlow: PointLightConfig;
}

export interface WaterConfig {
  level: number;
  baseHex: string;
  glintHex: string;
  shimmerMs: number;
  foam: boolean;
  mode: "shader" | "cheap" | "static" | "none";
}

export interface PostFxConfig {
  bloom: {
    threshold: number;
    intensity: number;
    radius: number;
    mipmapBlur: boolean;
  } | null;
  vignette: { offset: number; darkness: number } | null;
  smaa: boolean;
}

export interface DeviceCaps {
  webgl2: boolean;
  webgl1: boolean;
  prefersReducedMotion: boolean;
  savePower?: boolean;
  deviceMemoryGB?: number;
  hardwareConcurrency?: number;
  isSafari?: boolean;
  coarsePointer?: boolean;
}

export type QualityTier = "A" | "B" | "C" | "D";

export interface QualityBudget {
  tier: QualityTier;
  dprMax: number | null;
  shadows: "soft-pcf-2048" | "pcf-1024" | "off" | null;
  maxDynamicLights: number;
  water: "shader" | "cheap" | "static" | "2d";
  postfx: "bloom-vignette-smaa" | "bloom" | "off";
  ambientMotion: boolean;
  particleScale: number;
  targetFps: number | null;
  canvas: boolean;
}

export interface SoundCue {
  cueId: string;
  caption: string;
  mutedByDefault: true;
}

export interface VisualBand {
  showCanvasNumbers: boolean;
  labelStyle: "story" | "growth" | "numeric";
  markerScale: number;
  touchTargetPx: number;
  celebrationCeiling: "low" | "medium" | "high";
  comparisonVisibleDefault: boolean;
}

export interface AssetKeyRegistry {
  avatar: string[];
  nodes: string[];
  regions: string[];
  base: string[];
  fx: string[];
  ui: string[];
}

export interface Palette {
  seaDeep: string;
  seaMid: string;
  skyDawn: string;
  ink: string;
  inkHi: string;
  sun: string;
  sunHi: string;
  gold: string;
  ember: string;
  locked: string;
  notYet: string;
  focus: string;
}

export interface Presentation {
  biomes: BiomeIdentity[];
  worldTransform: WorldTransform3D;
  camera: CameraConfig3D;
  parallax: ParallaxLayer[];
  lighting: LightingConfig;
  water: WaterConfig;
  postfx: PostFxConfig;
  avatarAnim: AvatarAnimationSpec;
  visualBand: VisualBand;
  qualityTier: QualityTier;
  qualityBudget: QualityBudget;
  assetKeys: AssetKeyRegistry;
  basePlacements: BasePlacement[];
  palette: Palette;
}

export interface RewardRepresentation {
  band: AgeBand;
  headline: "concrete-marker" | "growth-vs-past" | "mastery-delta";
  currencyLabel: string;
  showRawNumber: boolean;
  comparisonDefault: "off" | "opt-in";
  failureCopy: string;
}

export interface NearPeerStanding {
  band: string;
  anonymizedPeers: Array<{ pseudonym: string; gain: number }>;
  selfGain: number;
  gainToBandTop: number;
}

export interface ArenaView {
  world: QuestWorld;
  layout: WorldLayout;
  nodeStates: Array<{ nodeId: string; state: NodeState }>;
  progression: ProgressionState;
  representation: RewardRepresentation;
  avatar: AvatarState;
  eligibility: CosmeticEligibility;
  base: CohortBase;
  standing: NearPeerStanding | null;
  presentation: Presentation;
  flags: { reducedMotion: boolean; plainMode: boolean; ageBand: AgeBand };
}
