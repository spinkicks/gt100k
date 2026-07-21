export const FRAME_BUDGET = {
  targetFps: 60,
  targetFrameMs: 1_000 / 60,
  missAboveMs: 25,
  sampleCount: 360,
  missRatio: 0.75,
  missesRequired: 270,
} as const;

export type RenderTier = "full-3d" | "degraded-3d" | "tier-2d";
export type RenderTier3D = Exclude<RenderTier, "tier-2d">;
export type RuntimeFallbackReason = "webgl-unavailable" | "context-lost" | "frame-budget";

export interface FrameBudgetWindow {
  readonly samples: number;
  readonly misses: number;
}

export interface FrameBudgetResult {
  readonly window: FrameBudgetWindow;
  readonly sustainedMiss: boolean;
}

export interface RenderRuntime {
  readonly tier: RenderTier;
  readonly reason: RuntimeFallbackReason | null;
}

export interface RenderSettings {
  readonly antialias: boolean;
  readonly bloom: boolean;
  readonly dpr: number | [number, number];
  readonly shadows: boolean;
}

export type RenderRuntimeEvent =
  | { readonly type: "sustained-frame-miss" }
  | { readonly type: "context-lost" };

interface WebGL2ContextProbe {
  getExtension(name: string): unknown;
}

interface WebGL2CanvasProbe {
  getContext(contextId: string): WebGL2ContextProbe | null;
}

type WebGL2CanvasFactory = () => WebGL2CanvasProbe;

export function createFrameBudgetWindow(): FrameBudgetWindow {
  return { samples: 0, misses: 0 };
}

export function recordFrame(window: FrameBudgetWindow, durationMs: number): FrameBudgetResult {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return { window, sustainedMiss: false };
  }

  const samples = window.samples + 1;
  const misses = window.misses + (durationMs > FRAME_BUDGET.missAboveMs ? 1 : 0);
  if (samples < FRAME_BUDGET.sampleCount) {
    return { window: { samples, misses }, sustainedMiss: false };
  }

  return {
    window: createFrameBudgetWindow(),
    sustainedMiss: misses >= FRAME_BUDGET.missesRequired,
  };
}

export function createRenderRuntime(webGL2Available: boolean): RenderRuntime {
  return webGL2Available
    ? { tier: "full-3d", reason: null }
    : { tier: "tier-2d", reason: "webgl-unavailable" };
}

export function resolveRenderSettings(renderTier: RenderTier3D): RenderSettings {
  return renderTier === "full-3d"
    ? { antialias: true, bloom: true, dpr: [1, 1.5], shadows: false }
    : { antialias: false, bloom: false, dpr: 1, shadows: false };
}

export function transitionRenderRuntime(
  runtime: RenderRuntime,
  event: RenderRuntimeEvent,
): RenderRuntime {
  if (runtime.tier === "tier-2d") return runtime;
  if (event.type === "context-lost") return { tier: "tier-2d", reason: "context-lost" };
  if (runtime.tier === "full-3d") return { tier: "degraded-3d", reason: "frame-budget" };
  return { tier: "tier-2d", reason: "frame-budget" };
}

export function detectWebGL2(createCanvas?: WebGL2CanvasFactory): boolean {
  try {
    const factory =
      createCanvas ?? (() => document.createElement("canvas") as unknown as WebGL2CanvasProbe);
    const context = factory().getContext("webgl2");
    if (!context) return false;

    const extension = context.getExtension("WEBGL_lose_context");
    if (
      typeof extension === "object" &&
      extension !== null &&
      "loseContext" in extension &&
      typeof extension.loseContext === "function"
    ) {
      extension.loseContext();
    }
    return true;
  } catch {
    return false;
  }
}
