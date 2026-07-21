export type Tier2DReason = "reduced-motion" | "plain";

export interface Tier2DResolution {
  readonly active: boolean;
  readonly reason: Tier2DReason | null;
}

interface ResolveTier2DModeInput {
  readonly configuredDefault: string | undefined;
  readonly systemReducedMotion: boolean | null;
  readonly plainMode: boolean;
}

export function resolveTier2DMode({
  configuredDefault,
  systemReducedMotion,
  plainMode,
}: ResolveTier2DModeInput): Tier2DResolution {
  if (plainMode) return { active: true, reason: "plain" };
  if (configuredDefault === "on") return { active: true, reason: "reduced-motion" };
  if (configuredDefault === "off") return { active: false, reason: null };

  return systemReducedMotion
    ? { active: true, reason: "reduced-motion" }
    : { active: false, reason: null };
}
