"use client";

import {
  CAMERA3D,
  type CameraView,
  type ChildStaging,
  EASINGS,
  MOTION,
  type SceneView,
  type Vector3,
  resolveCamera3D,
  resolveMotion,
} from "@gt100k/interest-lab-view";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, useLayoutEffect, useRef } from "react";
import { MathUtils, Vector3 as ThreeVector3 } from "three";

export const AUTO_TOUR_DWELL_MS = 8_000;

type WorldCameraMode = ChildStaging["worldCameraMode"];
type CameraMotionKind = "driftIn" | "islandFocus";

export interface CameraPose {
  pos: Vector3;
  target: Vector3;
}

export interface CameraTransition {
  from: CameraPose;
  to: CameraPose;
  durationMs: number;
  easing: string;
  frameAt: (elapsedMs: number) => CameraPose;
}

const copyPose = (pose: Readonly<CameraPose>): CameraPose => ({
  pos: [...pose.pos],
  target: [...pose.target],
});

const interpolateVector = (from: Vector3, to: Vector3, progress: number): Vector3 => [
  MathUtils.lerp(from[0], to[0], progress),
  MathUtils.lerp(from[1], to[1], progress),
  MathUtils.lerp(from[2], to[2], progress),
];

const readCubicBezier = (easing: string): [number, number, number, number] => {
  const values = easing.match(/-?\d*\.?\d+/g)?.map(Number);
  if (!values || values.length !== 4) {
    throw new Error(`Camera easing must be a cubic-bezier, received ${easing}`);
  }
  return [values[0]!, values[1]!, values[2]!, values[3]!];
};

const MOVE_CURVE = readCubicBezier(EASINGS.move);

const sampleBezier = (parameter: number, firstControl: number, secondControl: number) => {
  const inverse = 1 - parameter;
  return (
    3 * inverse * inverse * parameter * firstControl +
    3 * inverse * parameter * parameter * secondControl +
    parameter * parameter * parameter
  );
};

const resolveMoveProgress = (linearProgress: number) => {
  if (linearProgress <= 0) return 0;
  if (linearProgress >= 1) return 1;

  let low = 0;
  let high = 1;
  for (let step = 0; step < 16; step += 1) {
    const parameter = (low + high) / 2;
    if (sampleBezier(parameter, MOVE_CURVE[0], MOVE_CURVE[2]) < linearProgress) {
      low = parameter;
    } else {
      high = parameter;
    }
  }
  return sampleBezier((low + high) / 2, MOVE_CURVE[1], MOVE_CURVE[3]);
};

const resolveFocusProgress = (elapsedMs: number, durationMs: number) => {
  const firstFrameMs = 1_000 / 60;
  const dampedProgress = 1 - (1 - CAMERA3D.focusLerp) ** ((elapsedMs * 60) / 1_000);
  if (elapsedMs <= firstFrameMs) return dampedProgress;

  const dampedAtSettle = 1 - (1 - CAMERA3D.focusLerp) ** ((durationMs * 60) / 1_000);
  const completion = (elapsedMs - firstFrameMs) / (durationMs - firstFrameMs);
  const smoothCompletion = completion * completion * (3 - 2 * completion);
  return dampedProgress + (1 - dampedAtSettle) * smoothCompletion;
};

export function createCameraTransition(
  from: Readonly<CameraPose>,
  to: Readonly<CameraView>,
  kind: CameraMotionKind,
  reducedMotion: boolean,
): CameraTransition {
  const motion = resolveMotion(kind, { reducedMotion });
  const fromPose = copyPose(from);
  const toPose = copyPose(to);

  return {
    from: fromPose,
    to: toPose,
    durationMs: motion.durationMs,
    easing: motion.easing,
    frameAt(elapsedMs) {
      if (motion.durationMs === 0 || elapsedMs >= motion.durationMs) return copyPose(toPose);
      if (elapsedMs <= 0) return copyPose(fromPose);

      const linearProgress = elapsedMs / motion.durationMs;
      const progress =
        kind === "islandFocus"
          ? resolveFocusProgress(elapsedMs, motion.durationMs)
          : resolveMoveProgress(linearProgress);

      return {
        pos: interpolateVector(fromPose.pos, toPose.pos, progress),
        target: interpolateVector(fromPose.target, toPose.target, progress),
      };
    },
  };
}

export function createEstablishingCameraTransition(
  camera: Readonly<CameraView>,
  reducedMotion: boolean,
): CameraTransition {
  return createCameraTransition(
    {
      pos: reducedMotion ? camera.pos : [...CAMERA3D.establishStart.pos],
      target: [...camera.target],
    },
    camera,
    "driftIn",
    reducedMotion,
  );
}

interface CameraRigTargetOptions {
  focusedProbeId: string | null;
  worldCameraMode: WorldCameraMode;
  reducedMotion: boolean;
  elapsedMs: number;
}

export interface CameraRigTarget {
  source: "home" | "focus" | "auto-tour";
  islandIndex: number | null;
  camera: CameraView;
}

export function resolveCameraRigTarget(
  scene: Readonly<SceneView>,
  options: Readonly<CameraRigTargetOptions>,
): CameraRigTarget {
  const islandCenters = scene.islands.map(({ center }) => center);
  const focusedIslandIndex = options.focusedProbeId
    ? scene.islands.findIndex(({ markers }) =>
        markers.some(({ probeId }) => probeId === options.focusedProbeId),
      )
    : -1;

  if (focusedIslandIndex >= 0) {
    return {
      source: "focus",
      islandIndex: focusedIslandIndex,
      camera: resolveCamera3D(focusedIslandIndex, {
        reducedMotion: options.reducedMotion,
        islandCenters,
      }),
    };
  }

  const firstTourAt = MOTION.driftIn + AUTO_TOUR_DWELL_MS;
  if (
    options.worldCameraMode === "auto-tour" &&
    !options.reducedMotion &&
    scene.islands.length > 0 &&
    options.elapsedMs >= firstTourAt
  ) {
    const islandIndex =
      Math.floor((options.elapsedMs - firstTourAt) / AUTO_TOUR_DWELL_MS) % scene.islands.length;
    return {
      source: "auto-tour",
      islandIndex,
      camera: resolveCamera3D(islandIndex, { reducedMotion: false, islandCenters }),
    };
  }

  return {
    source: "home",
    islandIndex: null,
    camera: resolveCamera3D(null, { reducedMotion: options.reducedMotion }),
  };
}

export function resolveOrbitControlsConfig(worldCameraMode: WorldCameraMode) {
  const azimuthClamp = MathUtils.degToRad(CAMERA3D.orbit.azimuthClampDeg);
  return {
    enabled: worldCameraMode === "focus+orbit",
    enableDamping: true,
    dampingFactor: CAMERA3D.orbit.dampingFactor,
    enablePan: CAMERA3D.orbit.enablePan,
    enableZoom: CAMERA3D.orbit.enableZoom,
    minPolarAngle: MathUtils.degToRad(CAMERA3D.orbit.minPolarDeg),
    maxPolarAngle: MathUtils.degToRad(CAMERA3D.orbit.maxPolarDeg),
    minAzimuthAngle: -azimuthClamp,
    maxAzimuthAngle: azimuthClamp,
  };
}

export const cameraRigTargetKey = ({ source, islandIndex, camera }: Readonly<CameraRigTarget>) =>
  `${source}:${islandIndex ?? "home"}:${camera.mode}:${camera.pos.join(",")}:${camera.target.join(",")}`;

interface ActiveCameraTransition {
  definition: CameraTransition;
  elapsedMs: number;
}

export interface CameraRigProps {
  scene: SceneView;
  focusedProbeId?: string | null;
  reducedMotion: boolean;
  worldCameraMode: WorldCameraMode;
}

export function CameraRig({
  scene,
  focusedProbeId = null,
  reducedMotion,
  worldCameraMode,
}: CameraRigProps) {
  const camera = useThree((state) => state.camera);
  const initialTarget = resolveCameraRigTarget(scene, {
    focusedProbeId,
    worldCameraMode,
    reducedMotion,
    elapsedMs: 0,
  });
  const initialTransition = createEstablishingCameraTransition(initialTarget.camera, reducedMotion);
  const activeTransitionRef = useRef<ActiveCameraTransition | null>({
    definition: initialTransition,
    elapsedMs: 0,
  });
  const elapsedRef = useRef(0);
  const currentTargetRef = useRef(new ThreeVector3(...initialTransition.from.target));
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const targetKeyRef = useRef(cameraRigTargetKey(initialTarget));

  useLayoutEffect(() => {
    const from = activeTransitionRef.current?.definition.from;
    if (!from) return;
    camera.position.set(...from.pos);
    currentTargetRef.current.set(...from.target);
    controlsRef.current?.target.copy(currentTargetRef.current);
    camera.lookAt(currentTargetRef.current);
  }, [camera]);

  useFrame((_state, deltaSeconds) => {
    const deltaMs = Math.min(deltaSeconds, 0.1) * 1_000;
    elapsedRef.current += deltaMs;
    const nextTarget = resolveCameraRigTarget(scene, {
      focusedProbeId,
      worldCameraMode,
      reducedMotion,
      elapsedMs: elapsedRef.current,
    });
    const nextTargetKey = cameraRigTargetKey(nextTarget);

    if (nextTargetKey !== targetKeyRef.current) {
      activeTransitionRef.current = {
        definition: createCameraTransition(
          {
            pos: camera.position.toArray() as Vector3,
            target: currentTargetRef.current.toArray() as Vector3,
          },
          nextTarget.camera,
          "islandFocus",
          reducedMotion,
        ),
        elapsedMs: 0,
      };
      targetKeyRef.current = nextTargetKey;
    }

    const active = activeTransitionRef.current;
    if (!active) return;
    active.elapsedMs += deltaMs;
    const frame = active.definition.frameAt(active.elapsedMs);
    camera.position.set(...frame.pos);
    currentTargetRef.current.set(...frame.target);
    controlsRef.current?.target.copy(currentTargetRef.current);
    camera.lookAt(currentTargetRef.current);
    if (active.elapsedMs >= active.definition.durationMs) {
      activeTransitionRef.current = null;
    }
  });

  const orbit = resolveOrbitControlsConfig(worldCameraMode);
  return <OrbitControls ref={controlsRef} {...orbit} target={initialTarget.camera.target} />;
}
