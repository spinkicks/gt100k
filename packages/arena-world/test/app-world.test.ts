import { existsSync, readFileSync } from "node:fs";
import {
  CAMERA3D,
  CATALOG,
  FIXTURE,
  type InitialArenaView,
  type QualityTier,
  TIERS,
  buildArenaView,
  createSyntheticMasteryFeed,
  resolveAvatarAnimation,
} from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";
import { createSyntheticCohortBase } from "./view-fixture";

const APP_ROOT = new URL("../../../apps/arena/", import.meta.url);

function readAppFile(relativePath: string): string {
  const fileUrl = new URL(relativePath, APP_ROOT);
  return existsSync(fileUrl) ? readFileSync(fileUrl, "utf8") : "";
}

async function importAppModule<T>(relativePath: string): Promise<Partial<T>> {
  const fileUrl = new URL(relativePath, APP_ROOT);
  if (!existsSync(fileUrl)) return {};
  return import(/* @vite-ignore */ fileUrl.href) as Promise<T>;
}

function buildView(tier: QualityTier = "A", reducedMotion = false): InitialArenaView {
  return buildArenaView({
    world: FIXTURE,
    signals: createSyntheticMasteryFeed(),
    tierTable: TIERS,
    catalog: CATALOG,
    avatar: { learnerRef: "learner-synthetic-001", equipped: [] },
    base: createSyntheticCohortBase(),
    caps: {
      webgl2: tier !== "D",
      webgl1: tier !== "D",
      prefersReducedMotion: reducedMotion,
      isSafari: tier === "B",
    },
    options: { ageBand: "9-11", reducedMotion, plainMode: false },
  });
}

interface WorldRootModule {
  default: (props: { view: InitialArenaView }) => unknown;
  buildWorldRenderPlan(view: InitialArenaView): {
    islands: Array<{
      region: string;
      position: { x: number; y: number; z: number };
      terrainHex: string;
      phaseMs: number;
    }>;
    nodes: Array<{
      nodeId: string;
      state: string;
      landmark: string;
      icon: string;
      shape: string;
      renderMode: string;
    }>;
    paths: Array<{ from: string; to: string; crossIsland: boolean }>;
  };
  resolveIslandFloatOffset(elapsedMs: number, regionIndex: number, reducedMotion: boolean): number;
  resolveNodeRevealScale(elapsedMs: number, reducedMotion: boolean): number;
}

interface AvatarModule {
  default: (props: { view: InitialArenaView; targetNodeId?: string }) => unknown;
  damp3<T extends { x: number; y: number; z: number }>(
    current: T,
    target: { x: number; y: number; z: number },
    lambda: number,
    delta: number,
  ): T;
  resolveAvatarPose(
    animation: ReturnType<typeof resolveAvatarAnimation>,
    elapsedMs: number,
  ): { offsetY: number; scaleY: number; lanternIntensity: number };
  resolveAvatarTarget(
    view: InitialArenaView,
    targetNodeId?: string,
  ): {
    x: number;
    y: number;
    z: number;
  };
}

interface CameraRigModule {
  default: (props: {
    view: InitialArenaView;
    target?: readonly [number, number, number];
  }) => unknown;
  resolveCameraPlan(
    config: typeof CAMERA3D,
    reducedMotion: boolean,
  ): {
    initialDistance: number;
    restDistance: number;
    minDistance: number;
    maxDistance: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    maxAzimuthAngle: number;
    minAzimuthAngle: number;
    dampingFactor: number;
  };
  resolveIntroDistance(elapsedMs: number, config: typeof CAMERA3D, reducedMotion: boolean): number;
}

describe("arena P1 world scene", () => {
  it("plans four deterministic floating biomes and every stateful landmark", async () => {
    const module = await importAppModule<WorldRootModule>("app/scene/WorldRoot.tsx");

    expect(module.default).toBeTypeOf("function");
    expect(module.buildWorldRenderPlan).toBeTypeOf("function");
    if (!module.buildWorldRenderPlan) return;

    const plan = module.buildWorldRenderPlan(buildView());

    expect(
      plan.islands.map(({ region, position, terrainHex, phaseMs }) => ({
        region,
        position,
        terrainHex,
        phaseMs,
      })),
    ).toEqual([
      {
        region: "numbers-coast",
        position: { x: 9, y: 0, z: 3 },
        terrainHex: "#E9D9A8",
        phaseMs: 0,
      },
      {
        region: "tinker-bluffs",
        position: { x: 38, y: 1.5, z: 3 },
        terrainHex: "#8A6B4F",
        phaseMs: 1_600,
      },
      {
        region: "story-vale",
        position: { x: 6, y: -0.5, z: 35 },
        terrainHex: "#6E8E5A",
        phaseMs: 3_200,
      },
      {
        region: "wordwind-reach",
        position: { x: 38, y: 2.2, z: 35 },
        terrainHex: "#C9B27E",
        phaseMs: 4_800,
      },
    ]);
    expect(plan.nodes).toHaveLength(9);
    expect(
      plan.nodes.map(({ nodeId, state, landmark, icon, shape }) => ({
        nodeId,
        state,
        landmark,
        icon,
        shape,
      })),
    ).toEqual([
      {
        nodeId: "count-cove",
        state: "unlocked",
        landmark: "Counting Lighthouse",
        icon: "filled-star",
        shape: "raised-beacon",
      },
      {
        nodeId: "add-atoll",
        state: "unlocked",
        landmark: "Abacus Jetty",
        icon: "filled-star",
        shape: "raised-beacon",
      },
      {
        nodeId: "place-value-point",
        state: "available",
        landmark: "Tide-Pool Terraces",
        icon: "start-pennant",
        shape: "open-ring",
      },
      {
        nodeId: "observe-overlook",
        state: "unlocked",
        landmark: "Gear Overlook",
        icon: "filled-star",
        shape: "raised-beacon",
      },
      {
        nodeId: "measure-mesa",
        state: "unlocked",
        landmark: "Gadget Workshop",
        icon: "filled-star",
        shape: "raised-beacon",
      },
      {
        nodeId: "phoneme-falls",
        state: "available",
        landmark: "Whispering Falls",
        icon: "start-pennant",
        shape: "open-ring",
      },
      {
        nodeId: "blend-bay",
        state: "locked",
        landmark: "Book-Root Forest",
        icon: "closed-padlock",
        shape: "closed-marker",
      },
      {
        nodeId: "letter-landing",
        state: "available",
        landmark: "Letter Landing Field",
        icon: "start-pennant",
        shape: "open-ring",
      },
      {
        nodeId: "sentence-summit",
        state: "locked",
        landmark: "The Spelling Spires",
        icon: "closed-padlock",
        shape: "closed-marker",
      },
    ]);
    expect(
      plan.paths
        .filter(({ crossIsland }) => crossIsland)
        .map(({ from, to, crossIsland }) => ({ from, to, crossIsland })),
    ).toEqual([
      { from: "add-atoll", to: "measure-mesa", crossIsland: true },
      { from: "blend-bay", to: "sentence-summit", crossIsland: true },
    ]);
  });

  it("caps dynamic mastery lights and preserves emissive state in calm Tier C", async () => {
    const module = await importAppModule<WorldRootModule>("app/scene/WorldRoot.tsx");
    expect(module.buildWorldRenderPlan).toBeTypeOf("function");
    if (!module.buildWorldRenderPlan) return;

    const tierA = module.buildWorldRenderPlan(buildView("A"));
    const tierB = module.buildWorldRenderPlan(buildView("B"));
    const tierC = module.buildWorldRenderPlan(buildView("C", true));

    expect(tierA.nodes.filter(({ renderMode }) => renderMode === "dynamic")).toHaveLength(7);
    expect(tierB.nodes.filter(({ renderMode }) => renderMode === "dynamic")).toHaveLength(3);
    expect(tierC.nodes.filter(({ renderMode }) => renderMode === "dynamic")).toHaveLength(0);
    expect(tierC.nodes.filter(({ renderMode }) => renderMode === "emissive")).toHaveLength(7);
  });

  it("uses the exact island phase and a non-zero node reveal with static equivalents", async () => {
    const module = await importAppModule<WorldRootModule>("app/scene/WorldRoot.tsx");
    expect(module.resolveIslandFloatOffset).toBeTypeOf("function");
    expect(module.resolveNodeRevealScale).toBeTypeOf("function");
    if (!module.resolveIslandFloatOffset || !module.resolveNodeRevealScale) return;

    expect(module.resolveIslandFloatOffset(2_000, 0, false)).toBeCloseTo(0.15, 10);
    expect(module.resolveIslandFloatOffset(400, 1, false)).toBeCloseTo(0.15, 10);
    expect(module.resolveIslandFloatOffset(2_000, 0, true)).toBe(0);
    expect(module.resolveNodeRevealScale(0, false)).toBe(0.95);
    expect(module.resolveNodeRevealScale(110, false)).toBeCloseTo(1.05, 10);
    expect(module.resolveNodeRevealScale(220, false)).toBe(1);
    expect(module.resolveNodeRevealScale(0, true)).toBe(1);
  });

  it("renders instanced islands, paths, labels, marker forms, and capped point lights", () => {
    const source = readAppFile("app/scene/WorldRoot.tsx");

    expect(source).toContain("<instancedMesh");
    expect(source).toContain("<Line");
    expect(source).toContain("<Html");
    expect(source).toContain("<pointLight");
    expect(source).toContain("resolveNodeLightContributions");
    expect(source).toContain("closed-padlock");
    expect(source).toContain("start-pennant");
    expect(source).toContain("filled-star");
    expect(source).toContain("previousState");
    expect(source).toContain("revealing.current");
    expect(source).not.toMatch(/Math\.random|scale\s*=\s*\{?0\}?/);
  });
});

describe("arena P1 avatar", () => {
  it("maps animation specs to exact 3D poses and steady reduced-motion poses", async () => {
    const module = await importAppModule<AvatarModule>("app/scene/Avatar.tsx");

    expect(module.default).toBeTypeOf("function");
    expect(module.resolveAvatarPose).toBeTypeOf("function");
    if (!module.resolveAvatarPose) return;

    expect(
      module.resolveAvatarPose(resolveAvatarAnimation("idle", { reducedMotion: false }), 400),
    ).toEqual({
      offsetY: 0.12,
      scaleY: 1,
      lanternIntensity: 1.2,
    });
    expect(
      module.resolveAvatarPose(
        resolveAvatarAnimation("celebrate-med", { reducedMotion: false }),
        300,
      ),
    ).toEqual({
      offsetY: 0.9,
      scaleY: 1.08,
      lanternIntensity: 1.6,
    });
    expect(
      module.resolveAvatarPose(resolveAvatarAnimation("idle", { reducedMotion: true }), 400),
    ).toEqual({
      offsetY: 0,
      scaleY: 1,
      lanternIntensity: 1,
    });
  });

  it("retargets from the live position with frame-rate-independent damping", async () => {
    const module = await importAppModule<AvatarModule>("app/scene/Avatar.tsx");
    expect(module.damp3).toBeTypeOf("function");
    expect(module.resolveAvatarTarget).toBeTypeOf("function");
    if (!module.damp3 || !module.resolveAvatarTarget) return;

    const target = { x: 10, y: 2, z: -4 };
    const once = module.damp3({ x: 0, y: 0, z: 0 }, target, 6, 1);
    const stepped = { x: 0, y: 0, z: 0 };
    for (let index = 0; index < 60; index += 1) module.damp3(stepped, target, 6, 1 / 60);

    expect(once).toEqual({ x: expect.any(Number), y: expect.any(Number), z: expect.any(Number) });
    expect(once.x).toBeCloseTo(stepped.x, 12);
    expect(once.y).toBeCloseTo(stepped.y, 12);
    expect(once.z).toBeCloseTo(stepped.z, 12);
    expect(once.x).toBeGreaterThan(0);
    expect(once.x).toBeLessThan(10);
    expect(module.resolveAvatarTarget(buildView(), "letter-landing")).toEqual({
      x: 35,
      y: 2.8,
      z: 35,
    });
    expect(module.resolveAvatarTarget(buildView(), "missing")).toEqual({ x: 3, y: 0.6, z: 3 });
  });

  it("renders the pseudonymous lantern explorer without a scale-zero state", () => {
    const source = readAppFile("app/scene/Avatar.tsx");

    expect(source).toContain("LAMBDAS.avatarMove");
    expect(source).toContain("LAMBDAS.avatarTurn");
    expect(source).toContain("damp3");
    expect(source).toContain("<icosahedronGeometry");
    expect(source).toContain("lantern");
    expect(source).toContain("avatarRef");
    expect(source).toContain("animationElapsedMs");
    expect(source).not.toContain("clock.elapsedTime");
    expect(source).not.toMatch(/Math\.random|scale\s*=\s*\{?0\}?/);
  });
});

describe("arena P1 camera", () => {
  it("pins the follow-orbit bounds and reduced-motion rest pose", async () => {
    const module = await importAppModule<CameraRigModule>("app/scene/CameraRig.tsx");

    expect(module.default).toBeTypeOf("function");
    expect(module.resolveCameraPlan).toBeTypeOf("function");
    if (!module.resolveCameraPlan) return;

    expect(module.resolveCameraPlan(CAMERA3D, false)).toEqual({
      initialDistance: 90,
      restDistance: 32,
      minDistance: 18,
      maxDistance: 60,
      minPolarAngle: (22 * Math.PI) / 180,
      maxPolarAngle: (62 * Math.PI) / 180,
      minAzimuthAngle: (-35 * Math.PI) / 180,
      maxAzimuthAngle: (35 * Math.PI) / 180,
      dampingFactor: 0.08,
    });
    expect(module.resolveCameraPlan(CAMERA3D, true)).toMatchObject({
      initialDistance: 32,
      restDistance: 32,
    });
  });

  it("runs the exact 90-to-32 intro and cuts instantly under reduced motion", async () => {
    const module = await importAppModule<CameraRigModule>("app/scene/CameraRig.tsx");
    expect(module.resolveIntroDistance).toBeTypeOf("function");
    if (!module.resolveIntroDistance) return;

    expect(module.resolveIntroDistance(0, CAMERA3D, false)).toBe(90);
    expect(module.resolveIntroDistance(600, CAMERA3D, false)).toBe(61);
    expect(module.resolveIntroDistance(1_200, CAMERA3D, false)).toBe(32);
    expect(module.resolveIntroDistance(0, CAMERA3D, true)).toBe(32);
  });

  it("renders a bounded damped perspective follow/orbit rig", () => {
    const source = readAppFile("app/scene/CameraRig.tsx");

    expect(source).toContain("<PerspectiveCamera");
    expect(source).toContain("<OrbitControls");
    expect(source).toContain("enableDamping");
    expect(source).toContain("deadzoneRadius");
    expect(source).toContain("lookAheadUnits");
    expect(source).toContain('resolveMotion("intro"');
    expect(source).toContain("damp3");
    expect(source).toContain("followRef.current?.position");
    expect(source).toContain("initialized");
    expect(source).not.toContain("target={targetTuple}");
    expect(source).not.toMatch(/Math\.random/);
  });
});
