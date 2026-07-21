import { existsSync, readFileSync } from "node:fs";
import {
  CATALOG,
  FIXTURE,
  type InitialArenaView,
  PALETTE,
  QUALITY_TIERS,
  type QualityBudget,
  type QualityTier,
  TIERS,
  buildArenaView,
  createSyntheticMasteryFeed,
  resolveLighting,
  resolveWater,
} from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";
import { createSyntheticCohortBase } from "./view-fixture";

const APP_ROOT = new URL("../../../apps/arena/", import.meta.url);
const BASE_CAMP_TARGET = { x: 32, y: 0.8, z: 32 } as const;

function readAppFile(relativePath: string): string {
  const fileUrl = new URL(relativePath, APP_ROOT);
  return existsSync(fileUrl) ? readFileSync(fileUrl, "utf8") : "";
}

async function importAppModule<T>(relativePath: string): Promise<Partial<T>> {
  const fileUrl = new URL(relativePath, APP_ROOT);
  if (!existsSync(fileUrl)) return {};
  return import(/* @vite-ignore */ fileUrl.href) as Promise<T>;
}

function buildView(tier: QualityTier): InitialArenaView {
  return buildArenaView({
    world: FIXTURE,
    signals: createSyntheticMasteryFeed(),
    tierTable: TIERS,
    catalog: CATALOG,
    avatar: { learnerRef: "learner-synthetic-001", equipped: [] },
    base: createSyntheticCohortBase(),
    nearPeers: [],
    caps: {
      webgl2: tier !== "D",
      webgl1: tier !== "D",
      prefersReducedMotion: tier === "C",
      isSafari: tier === "B",
    },
    options: {
      ageBand: "9-11",
      reducedMotion: tier === "C",
      plainMode: false,
      standingsOptedIn: false,
    },
  });
}

interface RendererQualityPlan {
  canvas: boolean;
  dpr: readonly [number, number] | null;
  frameLoop: "always" | "demand";
  shadows: boolean;
  shadowMapSize: number | null;
  waterMode: "shader" | "cheap" | "static" | "none";
  postFxMode: QualityBudget["postfx"];
  ambientMotion: boolean;
  particleScale: number;
  staticMotion: boolean;
  dynamicLightIds: string[];
  dynamicNodeLightIds: string[];
  dynamicCampfireLight: boolean;
}

interface RendererQualityModule {
  buildRendererQualityPlan(
    view: InitialArenaView,
    cameraTarget: { x: number; y: number; z: number },
  ): RendererQualityPlan;
}

interface LightingRigModule {
  resolveLightingRigPlan(
    lighting: InitialArenaView["presentation"]["lighting"],
    qualityBudget: QualityBudget,
  ): {
    ambientMotion: boolean;
    castShadow: boolean;
    shadowMapSize: number | null;
    softShadow: boolean;
  };
}

interface SeaAndSkyModule {
  resolveAtmospherePlan(
    palette: typeof PALETTE,
    water: InitialArenaView["presentation"]["water"],
    qualityBudget: QualityBudget,
    reducedMotion: boolean,
  ): { waterMode: "shader" | "cheap" | "static" | "none"; ambientMotion: boolean };
}

interface PostFxModule {
  buildPostFxPlan(view: InitialArenaView): { enabled: boolean };
}

interface WorldRootModule {
  buildWorldRenderPlan(
    view: InitialArenaView,
    dynamicNodeLightIds?: readonly string[],
  ): { nodes: Array<{ nodeId: string; renderMode: string }> };
}

interface BaseCampModule {
  buildBaseCampRenderPlan(
    view: InitialArenaView,
    dynamicCampfireLight?: boolean,
  ): { dynamicCampfireLight: boolean };
}

describe("arena P6 renderer quality budget", () => {
  it("maps every golden quality budget into one renderer plan", async () => {
    const module = await importAppModule<RendererQualityModule>("app/scene/rendererQuality.ts");

    expect(module.buildRendererQualityPlan).toBeTypeOf("function");
    if (!module.buildRendererQualityPlan) return;

    expect(module.buildRendererQualityPlan(buildView("A"), BASE_CAMP_TARGET)).toMatchObject({
      canvas: true,
      dpr: [1, 2],
      frameLoop: "always",
      shadows: true,
      shadowMapSize: 2_048,
      waterMode: "shader",
      postFxMode: "bloom-vignette-smaa",
      ambientMotion: true,
      particleScale: 1,
      staticMotion: false,
    });
    expect(module.buildRendererQualityPlan(buildView("B"), BASE_CAMP_TARGET)).toMatchObject({
      canvas: true,
      dpr: [1, 1.5],
      frameLoop: "always",
      shadows: true,
      shadowMapSize: 1_024,
      waterMode: "cheap",
      postFxMode: "bloom",
      ambientMotion: true,
      particleScale: 0.5,
      staticMotion: false,
    });
    expect(module.buildRendererQualityPlan(buildView("C"), BASE_CAMP_TARGET)).toMatchObject({
      canvas: true,
      dpr: [1, 1.5],
      frameLoop: "demand",
      shadows: false,
      shadowMapSize: null,
      waterMode: "static",
      postFxMode: "off",
      ambientMotion: false,
      particleScale: 0,
      staticMotion: true,
    });
    expect(module.buildRendererQualityPlan(buildView("D"), BASE_CAMP_TARGET)).toMatchObject({
      canvas: false,
      dpr: null,
      frameLoop: "demand",
      shadows: false,
      shadowMapSize: null,
      waterMode: "none",
      postFxMode: "off",
      ambientMotion: false,
      particleScale: 0,
      staticMotion: true,
      dynamicLightIds: [],
    });
  });

  it("globally keeps the lights nearest the camera target, including Base Camp", async () => {
    const [quality, world, base] = await Promise.all([
      importAppModule<RendererQualityModule>("app/scene/rendererQuality.ts"),
      importAppModule<WorldRootModule>("app/scene/WorldRoot.tsx"),
      importAppModule<BaseCampModule>("app/scene/BaseCamp.tsx"),
    ]);

    expect(quality.buildRendererQualityPlan).toBeTypeOf("function");
    expect(world.buildWorldRenderPlan).toBeTypeOf("function");
    expect(base.buildBaseCampRenderPlan).toBeTypeOf("function");
    if (
      !quality.buildRendererQualityPlan ||
      !world.buildWorldRenderPlan ||
      !base.buildBaseCampRenderPlan
    ) {
      return;
    }

    const tierA = quality.buildRendererQualityPlan(buildView("A"), BASE_CAMP_TARGET);
    const tierBView = buildView("B");
    const tierB = quality.buildRendererQualityPlan(tierBView, BASE_CAMP_TARGET);
    const tierC = quality.buildRendererQualityPlan(buildView("C"), BASE_CAMP_TARGET);

    expect(tierA.dynamicLightIds).toHaveLength(8);
    expect(tierA.dynamicCampfireLight).toBe(true);
    expect(tierB.dynamicLightIds).toEqual([
      "base:campfire",
      "node:letter-landing",
      "node:phoneme-falls",
    ]);
    expect(tierB.dynamicNodeLightIds).toEqual(["phoneme-falls", "letter-landing"]);
    expect(tierB.dynamicCampfireLight).toBe(true);
    expect(tierC.dynamicLightIds).toEqual([]);
    expect(tierC.dynamicCampfireLight).toBe(false);

    const worldPlan = world.buildWorldRenderPlan(tierBView, tierB.dynamicNodeLightIds);
    expect(
      worldPlan.nodes
        .filter(({ renderMode }) => renderMode === "dynamic")
        .map(({ nodeId }) => nodeId),
    ).toEqual(["phoneme-falls", "letter-landing"]);
    expect(
      worldPlan.nodes
        .filter(({ renderMode }) => renderMode === "emissive")
        .map(({ nodeId }) => nodeId),
    ).toEqual(["count-cove", "add-atoll", "place-value-point", "observe-overlook", "measure-mesa"]);
    expect(base.buildBaseCampRenderPlan(tierBView, tierB.dynamicCampfireLight)).toMatchObject({
      dynamicCampfireLight: true,
    });
  });

  it("makes the budget authoritative when resolved presentation configs disagree", async () => {
    const [lighting, atmosphere, postFx] = await Promise.all([
      importAppModule<LightingRigModule>("app/scene/LightingRig.tsx"),
      importAppModule<SeaAndSkyModule>("app/scene/SeaAndSky.tsx"),
      importAppModule<PostFxModule>("app/scene/PostFx.tsx"),
    ]);

    expect(lighting.resolveLightingRigPlan).toBeTypeOf("function");
    expect(atmosphere.resolveAtmospherePlan).toBeTypeOf("function");
    expect(postFx.buildPostFxPlan).toBeTypeOf("function");
    if (
      !lighting.resolveLightingRigPlan ||
      !atmosphere.resolveAtmospherePlan ||
      !postFx.buildPostFxPlan
    ) {
      return;
    }

    expect(
      lighting.resolveLightingRigPlan(resolveLighting("A", "default"), QUALITY_TIERS.C),
    ).toEqual({
      ambientMotion: false,
      castShadow: false,
      shadowMapSize: null,
      softShadow: false,
    });
    expect(
      atmosphere.resolveAtmospherePlan(PALETTE, resolveWater("A"), QUALITY_TIERS.C, false),
    ).toMatchObject({ waterMode: "static", ambientMotion: false });

    const tierA = buildView("A");
    const budgetedCalmView: InitialArenaView = {
      ...tierA,
      presentation: { ...tierA.presentation, qualityBudget: { ...QUALITY_TIERS.C } },
    };
    expect(postFx.buildPostFxPlan(budgetedCalmView)).toMatchObject({ enabled: false });
  });

  it("wires the central plan through every scene budget consumer", () => {
    const canvas = readAppFile("app/scene/ArenaCanvas.tsx");
    const camera = readAppFile("app/scene/CameraRig.tsx");

    expect(canvas).toContain("buildRendererQualityPlan");
    expect(canvas).toContain("const dprMax = qualityPlan.dpr?.[1]");
    expect(canvas).toContain("dpr={[1, dprMax]}");
    expect(canvas).toContain("shadows={qualityPlan.shadows}");
    expect(canvas).toContain("qualityBudget={qualityBudget}");
    expect(canvas).toContain("dynamicNodeLightIds: qualityPlan.dynamicNodeLightIds");
    expect(canvas).toContain("<WorldRoot view={view} {...worldRootProps} />");
    expect(canvas).toContain("dynamicCampfireLight={qualityPlan.dynamicCampfireLight}");
    expect(canvas).toContain("staticMotion={qualityPlan.staticMotion}");
    expect(camera).toContain("enableDamping={!motionReduced}");
  });
});
