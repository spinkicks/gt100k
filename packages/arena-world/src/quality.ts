import type { DeviceCaps, QualityBudget, QualityTier } from "./model";

export const QUALITY_TIERS = {
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
} satisfies Record<QualityTier, QualityBudget>;

export function resolveQualityTier(caps: DeviceCaps): QualityTier {
  if (!caps.webgl2 && !caps.webgl1) return "D";
  if (caps.prefersReducedMotion || caps.savePower === true) return "C";
  if (
    caps.isSafari ||
    caps.coarsePointer ||
    (caps.deviceMemoryGB ?? 8) <= 4 ||
    (caps.hardwareConcurrency ?? 8) <= 4 ||
    !caps.webgl2
  ) {
    return "B";
  }
  return "A";
}

export function nextLowerTier(tier: QualityTier): QualityTier {
  switch (tier) {
    case "A":
      return "B";
    case "B":
      return "C";
    case "C":
    case "D":
      return "D";
  }
}
