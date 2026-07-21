"use client";

import {
  type CameraConfig3D,
  type InitialArenaView,
  LAMBDAS,
  resolveMotion,
} from "@gt100k/arena-world";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type ElementRef, type RefObject, useLayoutEffect, useMemo, useRef } from "react";
import { type Object3D, type PerspectiveCamera as ThreePerspectiveCamera, Vector3 } from "three";
import { damp3 } from "./Avatar";

const DEG_TO_RAD = Math.PI / 180;
const INTRO_MOTION = resolveMotion("intro", { reducedMotion: false });

export function resolveCameraPlan(config: CameraConfig3D, reducedMotion: boolean) {
  return {
    initialDistance: reducedMotion ? config.distanceDefault : config.introDistance,
    restDistance: config.distanceDefault,
    minDistance: config.distanceMin,
    maxDistance: config.distanceMax,
    minPolarAngle: config.pitchMinDeg * DEG_TO_RAD,
    maxPolarAngle: config.pitchMaxDeg * DEG_TO_RAD,
    minAzimuthAngle: config.orbitYawMinDeg * DEG_TO_RAD,
    maxAzimuthAngle: config.orbitYawMaxDeg * DEG_TO_RAD,
    dampingFactor: config.orbitDampingFactor,
  };
}

function cubicInOut(progress: number): number {
  return progress < 0.5 ? 4 * progress * progress * progress : 1 - (-2 * progress + 2) ** 3 / 2;
}

export function resolveIntroDistance(
  elapsedMs: number,
  config: CameraConfig3D,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return config.distanceDefault;
  const progress = Math.min(1, Math.max(0, elapsedMs / INTRO_MOTION.durationMs));
  return (
    config.introDistance + (config.distanceDefault - config.introDistance) * cubicInOut(progress)
  );
}

export interface CameraRigProps {
  view: InitialArenaView;
  target?: readonly [number, number, number];
  lookDirection?: readonly [number, number, number];
  followRef?: RefObject<Object3D>;
}

export default function CameraRig({
  view,
  target,
  lookDirection = [0, 0, 0],
  followRef,
}: CameraRigProps) {
  const config = view.presentation.camera;
  const plan = resolveCameraPlan(config, view.flags.reducedMotion);
  const targetX = target?.[0] ?? config.restTarget.x;
  const targetY = target?.[1] ?? config.restTarget.y;
  const targetZ = target?.[2] ?? config.restTarget.z;
  const targetTuple = useMemo(
    () => [targetX, targetY, targetZ] as const,
    [targetX, targetY, targetZ],
  );
  const desiredTarget = useMemo(() => new Vector3(), []);
  const previousTarget = useMemo(() => new Vector3(), []);
  const targetShift = useMemo(() => new Vector3(), []);
  const lookAhead = useMemo(() => new Vector3(), []);
  const cameraOffset = useMemo(() => new Vector3(0.72, 0.58, 1).normalize(), []);
  const camera = useRef<ThreePerspectiveCamera>(null);
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const elapsedMs = useRef(0);
  const initialized = useRef(false);

  useLayoutEffect(() => {
    if (initialized.current) return;
    const cameraInstance = camera.current;
    const controlsInstance = controls.current;
    if (!cameraInstance || !controlsInstance) return;
    initialized.current = true;
    desiredTarget.set(targetTuple[0], targetTuple[1], targetTuple[2]);
    controlsInstance.target.copy(desiredTarget);
    cameraInstance.position.copy(desiredTarget).addScaledVector(cameraOffset, plan.initialDistance);
    cameraInstance.lookAt(desiredTarget);
    controlsInstance.update();
  }, [cameraOffset, desiredTarget, plan.initialDistance, targetTuple]);

  useFrame((_, delta) => {
    const cameraInstance = camera.current;
    const controlsInstance = controls.current;
    if (!cameraInstance || !controlsInstance) return;
    elapsedMs.current += delta * 1_000;

    const followPosition = followRef ? followRef.current?.position : undefined;
    desiredTarget.set(
      followPosition?.x ?? targetTuple[0],
      followPosition?.y ?? targetTuple[1],
      followPosition?.z ?? targetTuple[2],
    );
    const lookLength = Math.hypot(lookDirection[0], lookDirection[1], lookDirection[2]);
    if (lookLength > 0) {
      lookAhead.set(lookDirection[0], lookDirection[1], lookDirection[2]).normalize();
      desiredTarget.addScaledVector(lookAhead, config.lookAheadUnits);
    }

    previousTarget.copy(controlsInstance.target);
    if (
      view.flags.reducedMotion ||
      controlsInstance.target.distanceTo(desiredTarget) > config.deadzoneRadius
    ) {
      if (view.flags.reducedMotion) controlsInstance.target.copy(desiredTarget);
      else damp3(controlsInstance.target, desiredTarget, LAMBDAS.cameraFollow, delta);
      targetShift.copy(controlsInstance.target).sub(previousTarget);
      cameraInstance.position.add(targetShift);
    }

    const introDistance = resolveIntroDistance(elapsedMs.current, config, view.flags.reducedMotion);
    if (elapsedMs.current <= INTRO_MOTION.durationMs) {
      cameraInstance.position
        .copy(controlsInstance.target)
        .addScaledVector(cameraOffset, introDistance);
    }
    controlsInstance.update();
  });

  return (
    <>
      <PerspectiveCamera
        ref={camera}
        makeDefault
        far={config.far}
        fov={config.fov}
        near={config.near}
        position={[
          targetTuple[0] + cameraOffset.x * plan.initialDistance,
          targetTuple[1] + cameraOffset.y * plan.initialDistance,
          targetTuple[2] + cameraOffset.z * plan.initialDistance,
        ]}
      />
      <OrbitControls
        ref={controls}
        makeDefault
        dampingFactor={plan.dampingFactor}
        enableDamping
        enablePan={false}
        maxAzimuthAngle={plan.maxAzimuthAngle}
        maxDistance={plan.maxDistance}
        maxPolarAngle={plan.maxPolarAngle}
        minAzimuthAngle={plan.minAzimuthAngle}
        minDistance={plan.minDistance}
        minPolarAngle={plan.minPolarAngle}
      />
    </>
  );
}
