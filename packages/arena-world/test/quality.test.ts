import { type DeviceCaps, QUALITY_TIERS, type QualityTier } from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

type QualityResolver = (caps: DeviceCaps) => QualityTier;
type QualityDegrader = (tier: QualityTier) => QualityTier;

const resolveQualityTier = (
  arenaWorld as typeof arenaWorld & { resolveQualityTier?: QualityResolver }
).resolveQualityTier;
const nextLowerTier = (arenaWorld as typeof arenaWorld & { nextLowerTier?: QualityDegrader })
  .nextLowerTier;

const FULL_CAPS: DeviceCaps = {
  webgl2: true,
  webgl1: true,
  prefersReducedMotion: false,
};

const GOLDEN_QUALITY_TIERS = {
  A: {
    tier: "A",
    dprMax: 2,
    shadows: "soft-pcf-2048",
    maxDynamicLights: 8,
    water: "shader",
    postfx: "bloom-vignette-smaa",
    ambientMotion: true,
    particleScale: 1,
    targetFps: 60,
    canvas: true,
  },
  B: {
    tier: "B",
    dprMax: 1.5,
    shadows: "pcf-1024",
    maxDynamicLights: 3,
    water: "cheap",
    postfx: "bloom",
    ambientMotion: true,
    particleScale: 0.5,
    targetFps: 60,
    canvas: true,
  },
  C: {
    tier: "C",
    dprMax: 1.5,
    shadows: "off",
    maxDynamicLights: 0,
    water: "static",
    postfx: "off",
    ambientMotion: false,
    particleScale: 0,
    targetFps: 60,
    canvas: true,
  },
  D: {
    tier: "D",
    dprMax: null,
    shadows: null,
    maxDynamicLights: 0,
    water: "2d",
    postfx: "off",
    ambientMotion: false,
    particleScale: 0,
    targetFps: null,
    canvas: false,
  },
} as const;

describe("arena rendering quality", () => {
  it("keeps the exact quality budgets and beacon-light caps", () => {
    expect(QUALITY_TIERS).toEqual(GOLDEN_QUALITY_TIERS);
    expect([
      QUALITY_TIERS.A.maxDynamicLights,
      QUALITY_TIERS.B.maxDynamicLights,
      QUALITY_TIERS.C.maxDynamicLights,
    ]).toEqual([8, 3, 0]);
  });

  it("uses Tier D without WebGL before considering other capabilities", () => {
    expect(resolveQualityTier).toBeTypeOf("function");
    if (!resolveQualityTier) return;

    expect(
      resolveQualityTier({
        webgl2: false,
        webgl1: false,
        prefersReducedMotion: true,
        savePower: true,
      }),
    ).toBe("D");
  });

  it.each([
    ["reduced motion", { prefersReducedMotion: true }],
    ["low power", { savePower: true }],
  ])("uses Tier C for %s before considering weak-device signals", (_label, overrides) => {
    expect(resolveQualityTier).toBeTypeOf("function");
    if (!resolveQualityTier) return;

    expect(
      resolveQualityTier({
        ...FULL_CAPS,
        ...overrides,
        isSafari: true,
        deviceMemoryGB: 2,
      }),
    ).toBe("C");
  });

  it.each([
    ["Safari", { isSafari: true }],
    ["a coarse pointer", { coarsePointer: true }],
    ["four GiB of memory", { deviceMemoryGB: 4 }],
    ["four hardware threads", { hardwareConcurrency: 4 }],
    ["WebGL1 only", { webgl2: false, webgl1: true }],
  ])("uses Tier B for %s", (_label, overrides) => {
    expect(resolveQualityTier).toBeTypeOf("function");
    if (!resolveQualityTier) return;

    expect(resolveQualityTier({ ...FULL_CAPS, ...overrides })).toBe("B");
  });

  it("uses Tier A for full capabilities and the pinned optional defaults", () => {
    expect(resolveQualityTier).toBeTypeOf("function");
    if (!resolveQualityTier) return;

    expect(resolveQualityTier(FULL_CAPS)).toBe("A");
    expect(
      resolveQualityTier({
        ...FULL_CAPS,
        deviceMemoryGB: 4.01,
        hardwareConcurrency: 5,
        isSafari: false,
        coarsePointer: false,
      }),
    ).toBe("A");
    expect(resolveQualityTier(FULL_CAPS)).toBe(resolveQualityTier({ ...FULL_CAPS }));
  });

  it("follows the complete A to B to C to D path and remains at Tier D", () => {
    expect(nextLowerTier).toBeTypeOf("function");
    if (!nextLowerTier) return;

    let tier: QualityTier = "A";
    const path: QualityTier[] = [tier];
    for (let step = 0; step < 4; step += 1) {
      tier = nextLowerTier(tier);
      path.push(tier);
    }

    expect(path).toEqual(["A", "B", "C", "D", "D"]);
  });
});
