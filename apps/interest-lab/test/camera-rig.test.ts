import { CAMERA3D, EASINGS, MOTION, resolveCamera3D } from "@gt100k/interest-lab-view";
import { describe, expect, it } from "vitest";
import {
  AUTO_TOUR_DWELL_MS,
  CameraRig,
  cameraRigTargetKey,
  createCameraTransition,
  createEstablishingCameraTransition,
  resolveCameraRigTarget,
  resolveOrbitControlsConfig,
} from "../app/child/world3d/CameraRig";
import { buildSyntheticInterestLabSeed } from "../app/seed";

const fullScene = buildSyntheticInterestLabSeed({
  deviceCaps: {
    webglAvailable: true,
    deviceMemoryGB: 8,
    hardwareConcurrency: 8,
    coarsePointer: false,
    saveData: false,
  },
}).view.scene;

const homeTarget = {
  focusedProbeId: null,
  worldCameraMode: "focus+orbit" as const,
  reducedMotion: false,
  elapsedMs: 0,
};

describe("CameraRig", () => {
  it("drifts from the exact establishing pose into home framing", () => {
    const transition = createEstablishingCameraTransition(fullScene.camera, false);

    expect(CameraRig).toEqual(expect.any(Function));
    expect(transition).toMatchObject({
      from: {
        pos: CAMERA3D.establishStart.pos,
        target: fullScene.camera.target,
      },
      to: {
        pos: fullScene.camera.pos,
        target: fullScene.camera.target,
      },
      durationMs: MOTION.driftIn,
      easing: EASINGS.move,
    });
    expect(transition.frameAt(0)).toEqual(transition.from);

    const halfway = transition.frameAt(MOTION.driftIn / 2);
    expect(halfway.pos[2]).toBeGreaterThan(fullScene.camera.pos[2]);
    expect(halfway.pos[2]).toBeLessThan(CAMERA3D.establishStart.pos[2]);
    expect(transition.frameAt(MOTION.driftIn)).toEqual(transition.to);
  });

  it("retargets island focus from the live camera pose and cuts under reduced motion", () => {
    const marker = fullScene.islands[1]?.markers[0];
    expect(marker).toBeDefined();
    const focused = resolveCameraRigTarget(fullScene, {
      ...homeTarget,
      focusedProbeId: marker?.probeId ?? null,
    });
    const expected = resolveCamera3D(1, {
      reducedMotion: false,
      islandCenters: fullScene.islands.map(({ center }) => center),
    });

    expect(focused).toEqual({ source: "focus", islandIndex: 1, camera: expected });

    const livePose = {
      pos: [3.25, 5.5, 12.75] as [number, number, number],
      target: [1.5, 0.25, -2] as [number, number, number],
    };
    const eased = createCameraTransition(livePose, focused.camera, "islandFocus", false);
    expect(eased.from).toEqual(livePose);
    expect(eased.durationMs).toBe(MOTION.islandFocus);
    expect(eased.frameAt(0)).toEqual(livePose);
    const firstFrame = eased.frameAt(1000 / 60);
    expect(firstFrame.pos[0]).toBeCloseTo(
      livePose.pos[0] + (focused.camera.pos[0] - livePose.pos[0]) * CAMERA3D.focusLerp,
      8,
    );
    expect(firstFrame.target[2]).toBeCloseTo(
      livePose.target[2] + (focused.camera.target[2] - livePose.target[2]) * CAMERA3D.focusLerp,
      8,
    );
    const justBeforeSettle = eased.frameAt(MOTION.islandFocus - 1);
    expect(Math.abs(justBeforeSettle.pos[0] - focused.camera.pos[0])).toBeLessThan(0.01);
    expect(eased.frameAt(MOTION.islandFocus)).toEqual({
      pos: focused.camera.pos,
      target: focused.camera.target,
    });

    const cut = createCameraTransition(livePose, focused.camera, "islandFocus", true);
    expect(cut.durationMs).toBe(0);
    expect(cut.frameAt(0)).toEqual(cut.to);
  });

  it("keeps 6-8 auto-tour calm, deterministic, and subordinate to DOM focus", () => {
    const firstTourAt = MOTION.driftIn + AUTO_TOUR_DWELL_MS;

    expect(
      resolveCameraRigTarget(fullScene, {
        focusedProbeId: null,
        worldCameraMode: "auto-tour",
        reducedMotion: false,
        elapsedMs: firstTourAt - 1,
      }),
    ).toMatchObject({ source: "home", islandIndex: null });
    expect(
      resolveCameraRigTarget(fullScene, {
        focusedProbeId: null,
        worldCameraMode: "auto-tour",
        reducedMotion: false,
        elapsedMs: firstTourAt,
      }),
    ).toMatchObject({ source: "auto-tour", islandIndex: 0 });
    expect(
      resolveCameraRigTarget(fullScene, {
        focusedProbeId: null,
        worldCameraMode: "auto-tour",
        reducedMotion: false,
        elapsedMs: firstTourAt + AUTO_TOUR_DWELL_MS,
      }),
    ).toMatchObject({ source: "auto-tour", islandIndex: 1 });

    const focusedProbeId = fullScene.islands[3]?.markers[0]?.probeId ?? null;
    expect(
      resolveCameraRigTarget(fullScene, {
        focusedProbeId,
        worldCameraMode: "auto-tour",
        reducedMotion: false,
        elapsedMs: firstTourAt + AUTO_TOUR_DWELL_MS * 5,
      }),
    ).toMatchObject({ source: "focus", islandIndex: 3 });

    expect(
      resolveCameraRigTarget(fullScene, {
        focusedProbeId: null,
        worldCameraMode: "auto-tour",
        reducedMotion: true,
        elapsedMs: firstTourAt + AUTO_TOUR_DWELL_MS * 5,
      }),
    ).toMatchObject({ source: "home", islandIndex: null, camera: { mode: "cut" } });
  });

  it("enables the exact clamped orbit contract only for focus+orbit staging", () => {
    expect(resolveOrbitControlsConfig("focus+orbit")).toEqual({
      enabled: true,
      enableDamping: true,
      dampingFactor: CAMERA3D.orbit.dampingFactor,
      enablePan: false,
      enableZoom: false,
      minPolarAngle: Math.PI / 3,
      maxPolarAngle: (85 * Math.PI) / 180,
      minAzimuthAngle: (-75 * Math.PI) / 180,
      maxAzimuthAngle: (75 * Math.PI) / 180,
    });
    expect(resolveOrbitControlsConfig("auto-tour")).toMatchObject({ enabled: false });
  });

  it("fails stale DOM focus safely back to home framing", () => {
    expect(
      resolveCameraRigTarget(fullScene, {
        ...homeTarget,
        focusedProbeId: "probe-no-longer-in-scene",
      }),
    ).toEqual({ source: "home", islandIndex: null, camera: fullScene.camera });
  });

  it("retargets an in-flight pose when reduced motion changes live", () => {
    const animated = resolveCameraRigTarget(fullScene, homeTarget);
    const reduced = resolveCameraRigTarget(fullScene, {
      ...homeTarget,
      reducedMotion: true,
    });

    expect(reduced.camera.pos).toEqual(animated.camera.pos);
    expect(reduced.camera.target).toEqual(animated.camera.target);
    expect(reduced.camera.mode).toBe("cut");
    expect(cameraRigTargetKey(reduced)).not.toBe(cameraRigTargetKey(animated));
  });
});
