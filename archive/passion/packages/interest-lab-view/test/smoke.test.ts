import { describe, expect, it } from "vitest";
import {
  CAMERA3D,
  EASINGS,
  HUE_RAMP,
  MOTION,
  PALETTE,
  QUALITY_TIERS,
  SCENE3D,
  WORK_MODE_GLYPHS,
  resolveMotion,
} from "../src/index";

describe("interest lab view smoke", () => {
  it("exposes the seeded registries and press motion", () => {
    for (const registry of [
      PALETTE,
      MOTION,
      EASINGS,
      HUE_RAMP,
      WORK_MODE_GLYPHS,
      SCENE3D,
      CAMERA3D,
      QUALITY_TIERS,
    ]) {
      expect(Object.keys(registry).length).toBeGreaterThan(0);
    }

    expect(resolveMotion("press", { reducedMotion: false }).durationMs).toBe(120);
  });
});
