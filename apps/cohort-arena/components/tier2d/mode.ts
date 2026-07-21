import type { RuntimeFallbackReason } from "../performance/runtime.js";

export type Tier2DReason = "reduced-motion" | "plain" | RuntimeFallbackReason;

export interface Tier2DResolution {
  readonly active: boolean;
  readonly reason: Tier2DReason | null;
}

interface ResolveTier2DModeInput {
  readonly configuredDefault: string | undefined;
  readonly systemReducedMotion: boolean | null;
  readonly plainMode: boolean;
  readonly runtimeFallback?: RuntimeFallbackReason | null;
}

export function resolveTier2DMode({
  configuredDefault,
  systemReducedMotion,
  plainMode,
  runtimeFallback,
}: ResolveTier2DModeInput): Tier2DResolution {
  if (plainMode) return { active: true, reason: "plain" };
  if (runtimeFallback) return { active: true, reason: runtimeFallback };
  if (configuredDefault === "on") return { active: true, reason: "reduced-motion" };
  if (configuredDefault === "off") return { active: false, reason: null };

  return systemReducedMotion
    ? { active: true, reason: "reduced-motion" }
    : { active: false, reason: null };
}
