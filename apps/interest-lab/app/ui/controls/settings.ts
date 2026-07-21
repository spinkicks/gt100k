import type { AgeBand, RenderTier } from "@gt100k/interest-lab-view";

export type MotionPreference = "system" | "on" | "off";
export type InterestLabSurface = "child" | "guide";
export type RenderTierOverride = "auto" | RenderTier;

export interface InterestLabClientDefaults {
  ageBand: AgeBand;
  motionPreference: MotionPreference;
  surface: InterestLabSurface;
  renderTierOverride: RenderTierOverride;
}

type PublicEnvironment = Readonly<Record<string, string | undefined>>;

const ageBand = (value: string | undefined): AgeBand => {
  if (value === "6-8" || value === "12-14") return value;
  return "9-11";
};

const motionPreference = (value: string | undefined): MotionPreference => {
  if (value === "on" || value === "off") return value;
  return "system";
};

const surface = (value: string | undefined): InterestLabSurface =>
  value === "guide" ? "guide" : "child";

const renderTier = (value: string | undefined): RenderTierOverride => {
  if (value === "quest-world-3d" || value === "quest-world-3d-lite" || value === "board-2d") {
    return value;
  }
  return "auto";
};

export function readInterestLabClientDefaults(
  environment: PublicEnvironment,
): InterestLabClientDefaults {
  return {
    ageBand: ageBand(environment.NEXT_PUBLIC_DEFAULT_AGE_BAND),
    motionPreference: motionPreference(environment.NEXT_PUBLIC_REDUCED_MOTION_DEFAULT),
    surface: surface(environment.NEXT_PUBLIC_DEFAULT_SURFACE),
    renderTierOverride: renderTier(environment.NEXT_PUBLIC_RENDER_TIER),
  };
}

export function resolveReducedMotionPreference(
  preference: MotionPreference,
  osPrefersReducedMotion: boolean,
): boolean {
  if (preference === "on") return true;
  if (preference === "off") return false;
  return osPrefersReducedMotion;
}
