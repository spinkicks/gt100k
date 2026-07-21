/**
 * Golden render-tier ladder (§U8.10, exact) — `TIERS` capabilities, adaptive degrade/recover
 * thresholds, and the pure `resolveRenderTier(caps)` decision (first matching rule wins). State is
 * preserved across tier changes (D2); calm-2D is a first-class equal mode.
 */
import type { RenderCaps, RenderTier } from "./model.js";

export interface TierCaps {
  readonly bodies: boolean;
  readonly threads: boolean;
  readonly bloom: boolean;
  readonly dof: boolean;
  readonly parallaxStarfield: boolean;
  readonly starfield: "animated" | "static" | "none";
  readonly motion: "full" | "reduced" | "none";
  readonly webgl: boolean;
}

/** Per-tier capability matrix (§U8.10). */
export const TIERS: Record<RenderTier, TierCaps> = {
  cinematic: {
    bodies: true,
    threads: true,
    bloom: true,
    dof: true,
    parallaxStarfield: true,
    starfield: "animated",
    motion: "full",
    webgl: true,
  },
  standard3d: {
    bodies: true,
    threads: true,
    bloom: false,
    dof: false,
    parallaxStarfield: false,
    starfield: "static",
    motion: "reduced",
    webgl: true,
  },
  calm2d: {
    bodies: true,
    threads: true,
    bloom: false,
    dof: false,
    parallaxStarfield: false,
    starfield: "none",
    motion: "none",
    webgl: false,
  },
};

/** Adaptive auto-degrade / recover thresholds (§U8.10, exact). */
export const TIER_THRESHOLDS = {
  FPS_BUDGET: 60,
  DEGRADE_BELOW: 50,
  DEGRADE_SAMPLES: 90,
  RECOVER_ABOVE: 58,
  RECOVER_MS: 4000,
} as const;

/** Ordered ladder for stepping down/up one tier at a time. */
export const TIER_LADDER: readonly RenderTier[] = ["cinematic", "standard3d", "calm2d"];

/**
 * Resolve the active render tier from device caps (§U8.10). First matching rule wins:
 * 1. explicit non-auto override; 2. reduced-motion / no-WebGL / save-power / gpuTier 0 → calm2d;
 * 3. gpuTier 1 → standard3d; 4. otherwise (gpuTier ≥ 2) → cinematic.
 */
export function resolveRenderTier(caps: RenderCaps): RenderTier {
  if (caps.override !== undefined && caps.override !== "auto") {
    return caps.override;
  }
  if (
    caps.prefersReducedMotion === true ||
    caps.webglAvailable === false ||
    caps.savePower === true ||
    caps.gpuTier === 0
  ) {
    return "calm2d";
  }
  if (caps.gpuTier === 1) {
    return "standard3d";
  }
  return "cinematic";
}
