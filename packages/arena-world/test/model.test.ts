import type { Section } from "@gt100k/learning-loop";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  type AgeBand,
  type ArenaView,
  type AssetKeyRegistry,
  type AvatarAnimationSpec,
  type AvatarState,
  type BasePlacement,
  type BiomeIdentity,
  type CameraConfig3D,
  type CelebrationEvent,
  type CohortBase,
  type CompetencyNode,
  type CooperativeMissionResult,
  type Cosmetic,
  type CosmeticEligibility,
  type CosmeticRule,
  type DeviceCaps,
  type LightingConfig,
  type MotionSpec,
  type MotionToken,
  type NearPeerStanding,
  type NodeMasterySignal,
  type NodePosition,
  type NodeState,
  type NodeTransform3D,
  type ParallaxLayer,
  type PostFxConfig,
  type Presentation,
  type ProgressionState,
  type QualityBudget,
  type QualityTier,
  type QuestWorld,
  type RewardRepresentation,
  SECTIONS,
  type SoundCue,
  type Tier,
  type VisualBand,
  type WaterConfig,
  type WorldLayout,
  type WorldTheme,
  type WorldTransform3D,
} from "../src/model";

describe("arena-world domain model", () => {
  it("reuses the learning-loop academic sections", () => {
    expect(SECTIONS).toEqual(["math", "science", "reading", "language"]);
    expectTypeOf<CompetencyNode["sections"][number]>().toEqualTypeOf<Section>();
  });

  it("defines the quest-world and progression shapes", () => {
    expectTypeOf<AgeBand>().toEqualTypeOf<"6-8" | "9-11" | "12-14">();
    expectTypeOf<keyof CompetencyNode>().toEqualTypeOf<
      "id" | "title" | "sections" | "prerequisites" | "region" | "landmark" | "transferCritical"
    >();
    expectTypeOf<keyof QuestWorld>().toEqualTypeOf<"nodes" | "edges" | "regions">();
    expectTypeOf<keyof NodePosition>().toEqualTypeOf<"nodeId" | "x" | "y">();
    expectTypeOf<keyof WorldLayout>().toEqualTypeOf<"positions" | "bounds">();
    expectTypeOf<WorldLayout["bounds"]>().toEqualTypeOf<{
      x: 0;
      y: 0;
      width: 2048;
      height: 2048;
    }>();
    expectTypeOf<keyof NodeTransform3D>().toEqualTypeOf<"nodeId" | "x" | "y" | "z">();
    expectTypeOf<keyof WorldTransform3D>().toEqualTypeOf<
      "nodes" | "worldScale" | "seaLevel" | "bounds3D"
    >();
    expectTypeOf<keyof NodeMasterySignal>().toEqualTypeOf<
      "nodeId" | "masteryCleared" | "independenceReward"
    >();
    expectTypeOf<NodeState>().toEqualTypeOf<"locked" | "available" | "unlocked">();
    expectTypeOf<keyof ProgressionState>().toEqualTypeOf<
      "cumulativeIndependenceReward" | "masteredCount" | "regionsComplete" | "tier" | "growthVsPast"
    >();
    expectTypeOf<keyof Tier>().toEqualTypeOf<"index" | "label" | "minReward">();
  });

  it("makes commerce, caste ranking, and alarm cues unrepresentable", () => {
    expectTypeOf<keyof Cosmetic>().toEqualTypeOf<
      "id" | "kind" | "eligibility" | "look" | "equipEffect"
    >();
    expectTypeOf<CosmeticRule>().toEqualTypeOf<
      | { type: "min-tier"; tierIndex: number }
      | { type: "min-unlocks"; count: number }
      | { type: "region-complete"; region: string }
    >();
    expectTypeOf<keyof CosmeticEligibility>().toEqualTypeOf<"eligibleIds" | "lockedIds">();
    expectTypeOf<keyof NearPeerStanding>().toEqualTypeOf<
      "band" | "anonymizedPeers" | "selfGain" | "gainToBandTop"
    >();
    expectTypeOf<keyof SoundCue>().toEqualTypeOf<"cueId" | "caption" | "mutedByDefault">();
    expectTypeOf<SoundCue["mutedByDefault"]>().toEqualTypeOf<true>();
  });

  it("defines avatar, base, celebration, and motion shapes", () => {
    expectTypeOf<keyof AvatarState>().toEqualTypeOf<"learnerRef" | "equipped">();
    expectTypeOf<keyof AvatarAnimationSpec>().toEqualTypeOf<
      "state" | "loop" | "durationMs" | "easing" | "amplitudePx"
    >();
    expectTypeOf<keyof CooperativeMissionResult>().toEqualTypeOf<"missionId" | "feature" | "by">();
    expectTypeOf<keyof CohortBase>().toEqualTypeOf<
      "cohortRef" | "contributions" | "unlockedFeatures"
    >();
    expectTypeOf<keyof BasePlacement>().toEqualTypeOf<"feature" | "zone" | "x" | "y" | "by">();
    expectTypeOf<keyof CelebrationEvent>().toEqualTypeOf<
      "type" | "nodeId" | "intensity" | "copyStyle"
    >();
    expectTypeOf<CelebrationEvent["type"]>().toEqualTypeOf<
      "independent-unlock" | "productive-struggle"
    >();
    expectTypeOf<keyof MotionSpec>().toEqualTypeOf<
      "mode" | "particleCount" | "durationMs" | "cameraPunch" | "bloomPeak"
    >();
    expectTypeOf<keyof MotionToken>().toEqualTypeOf<"kind" | "mode" | "durationMs" | "easing">();
  });

  it("defines renderer-agnostic presentation configuration", () => {
    expectTypeOf<keyof BiomeIdentity>().toEqualTypeOf<
      "region" | "name" | "signatureHex" | "terrainHex" | "ambientHex" | "elevation" | "landmarks"
    >();
    expectTypeOf<WorldTheme>().toEqualTypeOf<"default" | "dawn" | "dusk">();
    expectTypeOf<keyof CameraConfig3D>().toEqualTypeOf<
      | "fov"
      | "near"
      | "far"
      | "distanceDefault"
      | "distanceRegion"
      | "distanceMin"
      | "distanceMax"
      | "introDistance"
      | "followLambda"
      | "orbitDampingFactor"
      | "orbitYawMinDeg"
      | "orbitYawMaxDeg"
      | "pitchMinDeg"
      | "pitchMaxDeg"
      | "deadzoneRadius"
      | "lookAheadUnits"
      | "punchDistDelta"
      | "punchFovDelta"
      | "punchOutMs"
      | "punchBackMs"
      | "restTarget"
    >();
    expectTypeOf<keyof ParallaxLayer>().toEqualTypeOf<"id" | "scrollFactor">();
    expectTypeOf<keyof LightingConfig>().toEqualTypeOf<
      | "key"
      | "hemi"
      | "ambient"
      | "rim"
      | "sunDriftDeg"
      | "sunDriftMs"
      | "shadow"
      | "beacon"
      | "beaconTransfer"
      | "availableGlow"
    >();
    expectTypeOf<keyof WaterConfig>().toEqualTypeOf<
      "level" | "baseHex" | "glintHex" | "shimmerMs" | "foam" | "mode"
    >();
    expectTypeOf<keyof PostFxConfig>().toEqualTypeOf<"bloom" | "vignette" | "smaa">();
    expectTypeOf<keyof DeviceCaps>().toEqualTypeOf<
      | "webgl2"
      | "webgl1"
      | "prefersReducedMotion"
      | "savePower"
      | "deviceMemoryGB"
      | "hardwareConcurrency"
      | "isSafari"
      | "coarsePointer"
    >();
    expectTypeOf<QualityTier>().toEqualTypeOf<"A" | "B" | "C" | "D">();
    expectTypeOf<keyof QualityBudget>().toEqualTypeOf<
      | "tier"
      | "dprMax"
      | "shadows"
      | "maxDynamicLights"
      | "water"
      | "postfx"
      | "ambientMotion"
      | "particleScale"
      | "targetFps"
      | "canvas"
    >();
    expectTypeOf<keyof VisualBand>().toEqualTypeOf<
      | "showCanvasNumbers"
      | "labelStyle"
      | "markerScale"
      | "touchTargetPx"
      | "celebrationCeiling"
      | "comparisonVisibleDefault"
    >();
    expectTypeOf<keyof AssetKeyRegistry>().toEqualTypeOf<
      "avatar" | "nodes" | "regions" | "base" | "fx" | "ui"
    >();
  });

  it("defines the composed arena view from one shared state", () => {
    expectTypeOf<keyof Presentation>().toEqualTypeOf<
      | "biomes"
      | "worldTransform"
      | "camera"
      | "parallax"
      | "lighting"
      | "water"
      | "postfx"
      | "avatarAnim"
      | "visualBand"
      | "qualityTier"
      | "qualityBudget"
      | "assetKeys"
      | "basePlacements"
      | "palette"
    >();
    expectTypeOf<keyof RewardRepresentation>().toEqualTypeOf<
      "band" | "headline" | "currencyLabel" | "showRawNumber" | "comparisonDefault" | "failureCopy"
    >();
    expectTypeOf<keyof ArenaView>().toEqualTypeOf<
      | "world"
      | "layout"
      | "nodeStates"
      | "progression"
      | "representation"
      | "avatar"
      | "eligibility"
      | "base"
      | "standing"
      | "presentation"
      | "flags"
    >();
  });
});
