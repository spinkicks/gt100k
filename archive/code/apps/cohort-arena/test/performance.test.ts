import { describe, expect, it, vi } from "vitest";

import {
  FRAME_BUDGET,
  createFrameBudgetWindow,
  createRenderRuntime,
  detectWebGL2,
  recordFrame,
  resolveRenderSettings,
  transitionRenderRuntime,
} from "../components/performance/runtime.js";

describe("the 3D performance budget", () => {
  it("requires a sustained frame-budget miss before degrading", () => {
    let window = createFrameBudgetWindow();

    for (let index = 0; index < FRAME_BUDGET.sampleCount - 1; index += 1) {
      const result = recordFrame(window, FRAME_BUDGET.missAboveMs + 1);
      window = result.window;
      expect(result.sustainedMiss).toBe(false);
    }

    const result = recordFrame(window, FRAME_BUDGET.missAboveMs + 1);
    expect(result.sustainedMiss).toBe(true);
    expect(result.window).toEqual(createFrameBudgetWindow());
  });

  it("keeps the full tier when the completed window holds the budget", () => {
    let window = createFrameBudgetWindow();

    for (let index = 0; index < FRAME_BUDGET.sampleCount; index += 1) {
      const duration = index < FRAME_BUDGET.missesRequired - 1 ? FRAME_BUDGET.missAboveMs + 1 : 16;
      window = recordFrame(window, duration).window;
    }

    const final = recordFrame(window, 16);
    expect(final.sustainedMiss).toBe(false);
  });

  it("degrades once before falling back to the state-identical 2D tier", () => {
    const full = createRenderRuntime(true);
    const degraded = transitionRenderRuntime(full, { type: "sustained-frame-miss" });
    const fallback = transitionRenderRuntime(degraded, { type: "sustained-frame-miss" });

    expect(full).toEqual({ tier: "full-3d", reason: null });
    expect(degraded).toEqual({ tier: "degraded-3d", reason: "frame-budget" });
    expect(fallback).toEqual({ tier: "tier-2d", reason: "frame-budget" });
    expect(transitionRenderRuntime(fallback, { type: "sustained-frame-miss" })).toBe(fallback);
  });

  it("turns off expensive 3D effects in the degraded tier", () => {
    expect(resolveRenderSettings("full-3d")).toEqual({
      antialias: true,
      bloom: true,
      dpr: [1, 1.5],
      shadows: false,
    });
    expect(resolveRenderSettings("degraded-3d")).toEqual({
      antialias: false,
      bloom: false,
      dpr: 1,
      shadows: false,
    });
  });

  it("falls back immediately when WebGL2 is unavailable or a context is lost", () => {
    expect(createRenderRuntime(false)).toEqual({
      tier: "tier-2d",
      reason: "webgl-unavailable",
    });
    expect(transitionRenderRuntime(createRenderRuntime(true), { type: "context-lost" })).toEqual({
      tier: "tier-2d",
      reason: "context-lost",
    });
  });

  it("probes WebGL2 without retaining the temporary context", () => {
    const loseContext = vi.fn();

    expect(
      detectWebGL2(() => ({
        getContext: () => ({
          getExtension: () => ({ loseContext }),
        }),
      })),
    ).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
    expect(detectWebGL2(() => ({ getContext: () => null }))).toBe(false);
  });
});
