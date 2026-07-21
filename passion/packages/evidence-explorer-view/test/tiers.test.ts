import { TIER_THRESHOLDS, TIERS, resolveRenderTier } from "@gt100k/evidence-explorer-view";
import { describe, expect, it } from "vitest";

/** Golden render-tier ladder (§U8.10, exact). */
describe("render tiers", () => {
  it("resolveRenderTier golden truth table", () => {
    expect(resolveRenderTier({ gpuTier: 3, webglAvailable: true })).toBe("cinematic");
    expect(resolveRenderTier({ gpuTier: 2, webglAvailable: true })).toBe("cinematic");
    expect(resolveRenderTier({ gpuTier: 1, webglAvailable: true })).toBe("standard3d");
    expect(resolveRenderTier({ gpuTier: 0 })).toBe("calm2d");
    expect(resolveRenderTier({ gpuTier: 3, prefersReducedMotion: true })).toBe("calm2d");
    expect(resolveRenderTier({ gpuTier: 3, savePower: true })).toBe("calm2d");
    expect(resolveRenderTier({ gpuTier: 3, webglAvailable: false })).toBe("calm2d");
    expect(resolveRenderTier({ gpuTier: 1, override: "cinematic" })).toBe("cinematic");
    expect(resolveRenderTier({ gpuTier: 3, override: "calm2d" })).toBe("calm2d");
  });

  it("override 'auto' falls through to capability rules", () => {
    expect(resolveRenderTier({ gpuTier: 3, override: "auto", webglAvailable: true })).toBe(
      "cinematic",
    );
  });

  it("tier capabilities: bloom/DOF only on cinematic; calm2d has no WebGL", () => {
    expect(TIERS.cinematic.bloom).toBe(true);
    expect(TIERS.cinematic.dof).toBe(true);
    expect(TIERS.standard3d.bloom).toBe(false);
    expect(TIERS.standard3d.dof).toBe(false);
    expect(TIERS.standard3d.webgl).toBe(true);
    expect(TIERS.calm2d.webgl).toBe(false);
  });

  it("degrade/recover thresholds are exact", () => {
    expect(TIER_THRESHOLDS).toEqual({
      FPS_BUDGET: 60,
      DEGRADE_BELOW: 50,
      DEGRADE_SAMPLES: 90,
      RECOVER_ABOVE: 58,
      RECOVER_MS: 4000,
    });
  });
});
