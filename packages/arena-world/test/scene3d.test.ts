import {
  CAMERA3D,
  LIGHTING,
  PARALLAX3D,
  POSTFX,
  WATER,
  resolveLighting,
  resolveMotion,
  resolveParallaxLayers,
  resolvePostFx,
  resolveWater,
} from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

const GOLDEN_CAMERA = {
  fov: 42,
  near: 0.5,
  far: 400,
  distanceDefault: 32,
  distanceRegion: 24,
  distanceMin: 18,
  distanceMax: 60,
  introDistance: 90,
  followLambda: 3.5,
  orbitDampingFactor: 0.08,
  orbitYawMinDeg: -35,
  orbitYawMaxDeg: 35,
  pitchMinDeg: 22,
  pitchMaxDeg: 62,
  deadzoneRadius: 2,
  lookAheadUnits: 3,
  punchDistDelta: -2,
  punchFovDelta: 1.5,
  punchOutMs: 120,
  punchBackMs: 180,
  restTarget: { x: 32, y: 0.5, z: 32 },
} as const;

const GOLDEN_PARALLAX = [
  { id: "sky", scrollFactor: 0 },
  { id: "clouds-far", scrollFactor: 0.15 },
  { id: "horizon", scrollFactor: 0.3 },
  { id: "sea", scrollFactor: 0.6 },
  { id: "world", scrollFactor: 1 },
  { id: "motes", scrollFactor: 1.05 },
  { id: "foreground", scrollFactor: 1.2 },
] as const;

describe("arena 3D scene configuration", () => {
  it("keeps the exact bounded follow-orbit camera configuration", () => {
    expect(CAMERA3D).toEqual(GOLDEN_CAMERA);
  });

  it("resolves all seven parallax layers back-to-front and keeps depth in reduced motion", () => {
    expect(PARALLAX3D).toEqual(GOLDEN_PARALLAX);
    expect(resolveParallaxLayers()).toEqual(GOLDEN_PARALLAX);
    expect(resolveMotion("intro", { reducedMotion: true })).toMatchObject({
      mode: "reduced",
      durationMs: 0,
    });
    expect(resolveMotion("regionZoom", { reducedMotion: true })).toMatchObject({
      mode: "reduced",
      durationMs: 0,
    });
    expect(resolveParallaxLayers()).toEqual(GOLDEN_PARALLAX);
  });

  it("resolves the exact golden-hour lighting rig for every quality tier", () => {
    expect(resolveLighting("A", "default")).toEqual(LIGHTING);
    expect(resolveLighting("B", "default")).toEqual({
      ...LIGHTING,
      shadow: { ...LIGHTING.shadow, mapSize: 1024, soft: false },
    });

    const staticLighting = {
      ...LIGHTING,
      key: { ...LIGHTING.key, castShadow: false },
      sunDriftDeg: 0,
      sunDriftMs: 0,
    };
    expect(resolveLighting("C", "default")).toEqual(staticLighting);
    expect(resolveLighting("D", "default")).toEqual(staticLighting);
  });

  it("applies the exact appearance-only dawn and dusk lighting variants", () => {
    expect(resolveLighting("A", "dawn")).toEqual({
      ...LIGHTING,
      key: { ...LIGHTING.key, colorHex: "#FFCDB0", intensity: 2.2 },
      hemi: { ...LIGHTING.hemi, skyHex: "#FBD9C0" },
    });
    expect(resolveLighting("A", "dusk")).toEqual({
      ...LIGHTING,
      key: { ...LIGHTING.key, intensity: 1.6 },
      ambient: { ...LIGHTING.ambient, colorHex: "#1B2A4A", intensity: 0.35 },
      beacon: { ...LIGHTING.beacon, intensity: 2.4 },
      beaconTransfer: { ...LIGHTING.beaconTransfer, intensity: 3 },
    });
  });

  it("resolves exact water modes without changing the golden water values", () => {
    expect([resolveWater("A"), resolveWater("B"), resolveWater("C"), resolveWater("D")]).toEqual([
      { ...WATER, mode: "shader" },
      { ...WATER, mode: "cheap" },
      { ...WATER, mode: "static" },
      { ...WATER, mode: "none" },
    ]);
  });

  it("resolves exact post-processing modes for every quality tier", () => {
    expect(resolvePostFx("A")).toEqual(POSTFX);
    expect(resolvePostFx("B")).toEqual({
      bloom: { ...POSTFX.bloom, mipmapBlur: false },
      vignette: null,
      smaa: false,
    });
    expect(resolvePostFx("C")).toEqual({ bloom: null, vignette: null, smaa: false });
    expect(resolvePostFx("D")).toEqual({ bloom: null, vignette: null, smaa: false });
  });

  it("returns fresh deterministic scene values", () => {
    const firstLayers = resolveParallaxLayers();
    const firstLighting = resolveLighting("A", "default");
    const firstPostFx = resolvePostFx("A");

    firstLayers[0]!.scrollFactor = 99;
    firstLighting.key.intensity = 99;
    if (firstPostFx.bloom) firstPostFx.bloom.intensity = 99;

    expect(resolveParallaxLayers()).toEqual(GOLDEN_PARALLAX);
    expect(resolveLighting("A", "default")).toEqual(LIGHTING);
    expect(resolvePostFx("A")).toEqual(POSTFX);
  });
});
