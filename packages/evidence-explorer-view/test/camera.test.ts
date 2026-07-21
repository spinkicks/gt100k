import { CAMERA, PARALLAX, focusKeyframe } from "@gt100k/evidence-explorer-view";
import { describe, expect, it } from "vitest";

/** Golden camera keyframes + parallax (§U8.9, exact). */
describe("camera", () => {
  it("static keyframes are exact", () => {
    expect(CAMERA.keyframes.introStart).toEqual({
      position: [15, 26, 60],
      target: [15, -1, 0],
      fov: 30,
    });
    expect(CAMERA.keyframes.overview).toEqual({
      position: [15, 8, 40],
      target: [15, -1, 0],
      fov: 40,
    });
    expect(CAMERA.keyframes.verifySeal).toEqual({
      position: [15, 2, 30],
      target: [15, -1, 0],
      fov: 36,
    });
    expect(CAMERA.keyframes.scrub).toEqual({
      position: [15, 6, 44],
      target: [15, -1, 0],
      fov: 42,
    });
    expect(CAMERA.keyframes.island).toEqual({
      position: [0, -6, 20],
      target: [0, -9, 0],
      fov: 40,
    });
  });

  it("focus(node) derives from pos3d + offset", () => {
    // released-artifact sits at [24,-3.2,0] (§U8.2).
    const kf = focusKeyframe([24, -3.2, 0]);
    expect(kf.position[0]).toBeCloseTo(32, 6);
    expect(kf.position[1]).toBeCloseTo(0.8, 6);
    expect(kf.position[2]).toBeCloseTo(12, 6);
    expect(kf.target).toEqual([24, -3.2, 0]);
    expect(kf.fov).toBe(34);
  });

  it("clamps + parallax are exact", () => {
    expect(CAMERA.clamps).toEqual({
      dollyMin: 12,
      dollyMax: 80,
      fovMin: 28,
      fovMax: 52,
      lookAhead: 2.0,
      orbitPolarMin: 15,
      orbitPolarMax: 150,
    });
    expect(PARALLAX).toEqual({ starfield: 0.15, world: 1.0, foreground: 1.08 });
  });
});
