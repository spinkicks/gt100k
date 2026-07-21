import { existsSync, readFileSync } from "node:fs";
import {
  type LightingConfig,
  PALETTE,
  type Palette,
  QUALITY_TIERS,
  type QualityBudget,
  type WaterConfig,
  resolveLighting,
  resolveWater,
} from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

const APP_ROOT = new URL("../../../apps/arena/", import.meta.url);

function appFile(relativePath: string): URL {
  return new URL(relativePath, APP_ROOT);
}

function readAppFile(relativePath: string): string {
  const fileUrl = appFile(relativePath);
  return existsSync(fileUrl) ? readFileSync(fileUrl, "utf8") : "";
}

async function importAppModule<T>(relativePath: string): Promise<Partial<T>> {
  const fileUrl = appFile(relativePath);
  if (!existsSync(fileUrl)) return {};
  return import(/* @vite-ignore */ fileUrl.href) as Promise<T>;
}

interface LightingRigModule {
  default: (props: {
    lighting: LightingConfig;
    ambientMotion: boolean;
  }) => unknown;
  resolveSunDriftRadians(
    elapsedMs: number,
    lighting: LightingConfig,
    ambientMotion: boolean,
  ): number;
}

interface AtmospherePlan {
  skyHex: string;
  fogHex: string;
  waterMode: WaterConfig["mode"];
  waterVisible: boolean;
  cloudsVisible: true;
  motesVisible: true;
  ambientMotion: boolean;
}

interface SeaAndSkyModule {
  default: (props: {
    palette: Palette;
    water: WaterConfig;
    qualityBudget: QualityBudget;
    reducedMotion: boolean;
  }) => unknown;
  resolveAtmospherePlan(
    palette: Palette,
    water: WaterConfig,
    qualityBudget: QualityBudget,
    reducedMotion: boolean,
  ): AtmospherePlan;
  createWaterUniforms(water: WaterConfig): Record<string, { value: unknown }>;
}

describe("arena lighting and atmosphere", () => {
  it("renders the exact resolved light rig and deterministic full sun-drift cycle", async () => {
    const module = await importAppModule<LightingRigModule>("app/scene/LightingRig.tsx");
    const source = readAppFile("app/scene/LightingRig.tsx");

    expect(module.default).toBeTypeOf("function");
    expect(module.resolveSunDriftRadians).toBeTypeOf("function");
    expect(source).toContain("<directionalLight");
    expect(source).toContain("<hemisphereLight");
    expect(source).toContain("<ambientLight");
    expect(source).toContain("shadow-mapSize-width={lighting.shadow.mapSize}");
    expect(source).toContain("shadow-mapSize-height={lighting.shadow.mapSize}");
    expect(source).toContain("shadow-bias={lighting.shadow.bias}");
    expect(source).toContain("shadow-camera-left={-72}");
    expect(source).toContain("shadow-camera-right={72}");
    expect(source).toContain("shadow-camera-top={72}");
    expect(source).toContain("shadow-camera-bottom={-72}");
    if (!module.resolveSunDriftRadians) return;

    const tierA = resolveLighting("A", "default");
    expect(module.resolveSunDriftRadians(0, tierA, true)).toBeCloseTo(0, 12);
    expect(module.resolveSunDriftRadians(30_000, tierA, true)).toBeCloseTo((5 * Math.PI) / 180, 12);
    expect(module.resolveSunDriftRadians(60_000, tierA, true)).toBeCloseTo(0, 12);
    expect(module.resolveSunDriftRadians(90_000, tierA, true)).toBeCloseTo(
      (-5 * Math.PI) / 180,
      12,
    );
    expect(module.resolveSunDriftRadians(120_000, tierA, true)).toBeCloseTo(0, 12);

    expect(module.resolveSunDriftRadians(30_000, tierA, false)).toBe(0);
    expect(module.resolveSunDriftRadians(30_000, resolveLighting("C", "default"), true)).toBe(0);
  });

  it("maps all water tiers while preserving static depth under reduced motion", async () => {
    const module = await importAppModule<SeaAndSkyModule>("app/scene/SeaAndSky.tsx");

    expect(module.default).toBeTypeOf("function");
    expect(module.resolveAtmospherePlan).toBeTypeOf("function");
    if (!module.resolveAtmospherePlan) return;

    expect(
      module.resolveAtmospherePlan(PALETTE, resolveWater("A"), QUALITY_TIERS.A, false),
    ).toEqual({
      skyHex: "#F4C77B",
      fogHex: "#0E2A3B",
      waterMode: "shader",
      waterVisible: true,
      cloudsVisible: true,
      motesVisible: true,
      ambientMotion: true,
    });
    expect(
      module.resolveAtmospherePlan(PALETTE, resolveWater("B"), QUALITY_TIERS.B, false),
    ).toMatchObject({ waterMode: "cheap", waterVisible: true, ambientMotion: true });
    expect(
      module.resolveAtmospherePlan(PALETTE, resolveWater("C"), QUALITY_TIERS.C, false),
    ).toMatchObject({
      waterMode: "static",
      waterVisible: true,
      cloudsVisible: true,
      motesVisible: true,
      ambientMotion: false,
    });
    expect(
      module.resolveAtmospherePlan(PALETTE, resolveWater("D"), QUALITY_TIERS.D, false),
    ).toMatchObject({ waterMode: "none", waterVisible: false, ambientMotion: false });

    expect(
      module.resolveAtmospherePlan(PALETTE, resolveWater("A"), QUALITY_TIERS.A, true),
    ).toMatchObject({
      waterMode: "shader",
      waterVisible: true,
      cloudsVisible: true,
      motesVisible: true,
      ambientMotion: false,
    });
  });

  it("supplies every Three fog uniform required by the custom water shader", async () => {
    const module = await importAppModule<SeaAndSkyModule>("app/scene/SeaAndSky.tsx");

    expect(module.createWaterUniforms).toBeTypeOf("function");
    if (!module.createWaterUniforms) return;

    const uniforms = module.createWaterUniforms(resolveWater("A"));

    expect(uniforms).toEqual(
      expect.objectContaining({
        fogColor: expect.objectContaining({ value: expect.anything() }),
        fogNear: expect.objectContaining({ value: expect.any(Number) }),
        fogFar: expect.objectContaining({ value: expect.any(Number) }),
        fogDensity: expect.objectContaining({ value: expect.any(Number) }),
        uTime: { value: 0 },
        uWaveAmplitude: { value: 0.18 },
      }),
    );
  });

  it("uses declarative disposable r3f resources for sky, clouds, water, fog, and motes", () => {
    const source = readAppFile("app/scene/SeaAndSky.tsx");

    expect(source).toContain('<color attach="background"');
    expect(source).toContain('<fog attach="fog"');
    expect(source).toContain("<sphereGeometry");
    expect(source).toContain("SKY_FRAGMENT_SHADER");
    expect(source).toContain("uHorizonColor");
    expect(source).toContain("uVoidColor");
    expect(source).toContain("<planeGeometry");
    expect(source).toContain("<shaderMaterial");
    expect(source).toContain("<meshStandardMaterial");
    expect(source).toContain("useFrame");
    expect(source).toContain("cloudsVisible");
    expect(source).toContain("motesVisible");
    expect(source).not.toContain("dispose={null}");
    expect(source).not.toMatch(/Math\.random|\bfetch\s*\(|https?:\/\//);
  });
});
