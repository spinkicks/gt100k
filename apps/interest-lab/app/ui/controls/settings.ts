import {
  type AgeBand,
  type DeviceCaps,
  type RenderTier,
  resolveRenderTier,
} from "@gt100k/interest-lab-view";

export type MotionPreference = "system" | "on" | "off";
export type InterestLabSurface = "child" | "guide";
export type RenderTierOverride = "auto" | RenderTier;
export type SustainedPerformanceStep = 0 | 1 | 2;

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

const FALSEY_FLAG_VALUES = new Set(["0", "false", "no", "off"]);

function hasTruthyFlag(params: URLSearchParams, key: string): boolean {
  if (!params.has(key)) return false;
  const value = (params.get(key) ?? "").trim().toLowerCase();
  return !FALSEY_FLAG_VALUES.has(value);
}

/**
 * Staff/QA gate for the full presentation harness (surface switch, age band,
 * render-tier, plain mode). A child never sees `?debug`/`?staff`, so the child
 * build shows only child chrome; a bare `?debug` (or `?debug=1/true/yes`) opens
 * the harness, while an explicit `?debug=0/false/no/off` keeps it closed so a
 * shared link can pin it either way. Pure so it is unit-testable off the DOM.
 */
export function resolveStaffDebugMode(search: string): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return hasTruthyFlag(params, "debug") || hasTruthyFlag(params, "staff");
}

export function resolveReducedMotionPreference(
  preference: MotionPreference,
  osPrefersReducedMotion: boolean,
): boolean {
  if (preference === "on") return true;
  if (preference === "off") return false;
  return osPrefersReducedMotion;
}

export function resolveHydrationSafeReducedMotionPreference(
  preference: MotionPreference,
  osPrefersReducedMotion: boolean,
  clientReady: boolean,
): boolean {
  return resolveReducedMotionPreference(preference, clientReady && osPrefersReducedMotion);
}

const TIER_FIDELITY: Record<RenderTier, number> = {
  "quest-world-3d": 0,
  "quest-world-3d-lite": 1,
  "board-2d": 2,
};

/** Applies the runtime presentation floor without changing domain or quest state. */
export function applySustainedPerformanceFloor(
  caps: Readonly<DeviceCaps>,
  step: SustainedPerformanceStep,
): DeviceCaps {
  if (step === 0) return { ...caps };

  if (step === 2) {
    return { ...caps, webglAvailable: false };
  }

  return {
    ...caps,
    hardwareConcurrency: Math.min(caps.hardwareConcurrency ?? 8, 4),
  };
}

/** Applies an explicit presentation request without bypassing the detected capability floor. */
export function applyRenderTierOverride(
  caps: Readonly<DeviceCaps>,
  override: RenderTierOverride,
): DeviceCaps {
  const resolved = resolveRenderTier(caps, { reducedMotion: false, plainMode: false });
  if (override === "auto" || TIER_FIDELITY[override] <= TIER_FIDELITY[resolved]) {
    return { ...caps };
  }

  if (override === "board-2d") {
    return { ...caps, webglAvailable: false };
  }

  return {
    ...caps,
    hardwareConcurrency: Math.min(caps.hardwareConcurrency ?? 8, 4),
  };
}
