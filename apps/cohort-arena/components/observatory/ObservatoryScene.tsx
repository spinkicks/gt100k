"use client";

import type { CohortArenaView, Vec3 } from "@gt100k/cohort-arena-view";
import { Instance, Instances, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Group,
  IcosahedronGeometry,
  MeshStandardMaterial,
  OctahedronGeometry,
  Vector3,
} from "three";

import { buildObservatoryScene, easeSceneProgress, resolveObservatoryMotion } from "./scene";

interface ObservatorySceneProps {
  readonly view: CohortArenaView;
  readonly transitionKind?: "compile" | "rollback";
}

interface SceneResources {
  readonly starGeometry: IcosahedronGeometry;
  readonly starMaterial: MeshStandardMaterial;
  readonly badgeGeometry: OctahedronGeometry;
  readonly badgeMaterial: MeshStandardMaterial;
}

function toTuple(position: Vec3): [number, number, number] {
  return [position.x, position.y, position.z];
}

export function ObservatoryScene({ view, transitionKind = "compile" }: ObservatorySceneProps) {
  const scene = useMemo(() => buildObservatoryScene(view), [view]);
  const motion = useMemo(() => resolveObservatoryMotion(view), [view]);
  const starRefs = useRef(new Map<string, Group>());
  const initialStarPositions = useRef(new Map<string, [number, number, number]>());
  const animationStarts = useRef(new Map<string, Vector3>());
  const transitionStartedAt = useRef<number | null>(null);
  const cameraStartedAt = useRef<number | null>(null);
  const cameraStart = useMemo(
    () =>
      new Vector3(
        view.constellation.camera.position.x,
        view.constellation.camera.position.y + 2,
        view.constellation.camera.position.z + 3,
      ),
    [view],
  );
  const cameraEnd = useMemo(
    () =>
      new Vector3(
        view.constellation.camera.position.x,
        view.constellation.camera.position.y,
        view.constellation.camera.position.z,
      ),
    [view],
  );
  const cameraTarget = useMemo(
    () =>
      new Vector3(
        view.constellation.camera.target.x,
        view.constellation.camera.target.y,
        view.constellation.camera.target.z,
      ),
    [view],
  );
  const resources = useMemo<SceneResources>(
    () => ({
      starGeometry: new IcosahedronGeometry(0.58 * view.presentation.markerScale, 2),
      starMaterial: new MeshStandardMaterial({
        color: view.presentation.palette.peerHi,
        emissive: view.presentation.palette.peer,
        emissiveIntensity: 0.8,
        metalness: 0.08,
        roughness: 0.32,
        toneMapped: false,
      }),
      badgeGeometry: new OctahedronGeometry(0.32 * view.presentation.markerScale, 0),
      badgeMaterial: new MeshStandardMaterial({
        color: view.presentation.palette.form,
        emissive: view.presentation.palette.form,
        emissiveIntensity: 0.9,
        metalness: 0.05,
        roughness: 0.38,
        toneMapped: false,
      }),
    }),
    [view.presentation.markerScale, view.presentation.palette],
  );

  const registerStar = useCallback(
    (ref: string) => (instance: unknown) => {
      if (instance instanceof Group) starRefs.current.set(ref, instance);
      else starRefs.current.delete(ref);
    },
    [],
  );

  const initialStarPosition = useCallback((star: (typeof scene.stars)[number]) => {
    const existing = initialStarPositions.current.get(star.ref);
    if (existing) return existing;
    const initial = toTuple(star.start);
    initialStarPositions.current.set(star.ref, initial);
    return initial;
  }, []);

  useEffect(() => {
    const nextStarts = new Map<string, Vector3>();
    for (const star of scene.stars) {
      const livePosition = starRefs.current.get(star.ref)?.position;
      nextStarts.set(
        star.ref,
        livePosition?.clone() ?? new Vector3(star.start.x, star.start.y, star.start.z),
      );
    }
    animationStarts.current = nextStarts;
    transitionStartedAt.current = null;
  }, [scene.stars]);

  useEffect(
    () => () => {
      resources.starGeometry.dispose();
      resources.starMaterial.dispose();
      resources.badgeGeometry.dispose();
      resources.badgeMaterial.dispose();
    },
    [resources],
  );

  useFrame(({ camera, clock }) => {
    const elapsedMs = clock.elapsedTime * 1_000;
    transitionStartedAt.current ??= elapsedMs;
    cameraStartedAt.current ??= elapsedMs;

    const transitionMotion = transitionKind === "rollback" ? motion.rollback : motion.compile;

    const transitionProgress =
      transitionMotion.durationMs === 0
        ? 1
        : Math.min(1, (elapsedMs - transitionStartedAt.current) / transitionMotion.durationMs);
    const transitionEased = easeSceneProgress(transitionMotion.easing, transitionProgress);
    const driftPeriod = Math.max(1, motion.drift.durationMs);

    for (const [index, star] of scene.stars.entries()) {
      const instance = starRefs.current.get(star.ref);
      if (!instance) continue;
      const start = animationStarts.current.get(star.ref) ?? new Vector3(...toTuple(star.start));
      const drift =
        transitionProgress === 1 && motion.drift.durationMs > 0
          ? Math.sin((elapsedMs / driftPeriod) * Math.PI * 2 + index * 0.62) * 0.14
          : 0;
      instance.position.set(
        start.x + (star.settled.x - start.x) * transitionEased,
        start.y + (star.settled.y - start.y) * transitionEased + drift,
        start.z + (star.settled.z - start.z) * transitionEased,
      );
      instance.rotation.y = (elapsedMs / driftPeriod) * Math.PI * 2 + index * 0.08;
    }

    const cameraProgress =
      motion.camera.durationMs === 0
        ? 1
        : Math.min(1, (elapsedMs - cameraStartedAt.current) / motion.camera.durationMs);
    camera.position.lerpVectors(
      cameraStart,
      cameraEnd,
      easeSceneProgress(motion.camera.easing, cameraProgress),
    );
    camera.lookAt(cameraTarget);
  });

  return (
    <>
      <fog
        attach="fog"
        args={[
          view.constellation.fog.color,
          view.constellation.fog.near,
          view.constellation.fog.far,
        ]}
      />
      <hemisphereLight
        args={[view.presentation.palette.peerHi, view.presentation.palette.deck, 0.42]}
      />
      <pointLight
        color={view.presentation.palette.peer}
        intensity={18}
        distance={70}
        position={[-18, 14, 18]}
      />
      <pointLight
        color={view.presentation.palette.floor}
        intensity={10}
        distance={55}
        position={[18, 8, -12]}
      />

      {scene.caliperRadii.map((radius) => (
        <mesh key={radius} position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.045, radius, 96]} />
          <meshBasicMaterial
            color={view.presentation.palette.peer}
            depthWrite={false}
            opacity={0.18}
            transparent
          />
        </mesh>
      ))}

      {scene.stars.map((star) => (
        <Line
          key={`field-${star.ref}`}
          points={[toTuple(star.start), toTuple(star.settled)]}
          color={view.presentation.palette.peer}
          depthWrite={false}
          lineWidth={0.5}
          opacity={0.08}
          transparent
        />
      ))}

      {scene.floorHalos.map((halo) => (
        <mesh
          key={`floor-${halo.cohortIndex}`}
          position={toTuple(halo.position)}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[halo.radius, 64]} />
          <meshStandardMaterial
            color={view.presentation.palette.floor}
            depthWrite={false}
            emissive={view.presentation.palette.floor}
            emissiveIntensity={0.48}
            opacity={0.14}
            transparent
          />
        </mesh>
      ))}

      <Instances
        geometry={resources.starGeometry}
        material={resources.starMaterial}
        limit={scene.stars.length}
        range={scene.stars.length}
        dispose={null}
      >
        {scene.stars.map((star) => (
          <Instance
            key={star.ref}
            ref={registerStar(star.ref)}
            color={
              star.state === "unassigned"
                ? view.presentation.palette.pending
                : view.presentation.palette.peerHi
            }
            position={initialStarPosition(star)}
          />
        ))}
      </Instances>

      <Instances
        geometry={resources.badgeGeometry}
        material={resources.badgeMaterial}
        limit={scene.badges.length}
        range={scene.badges.length}
        dispose={null}
      >
        {scene.badges.map((badge) => (
          <Instance
            key={`${badge.cohortIndex}-${badge.constraint}`}
            position={toTuple(badge.position)}
          />
        ))}
      </Instances>

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom intensity={0.42} luminanceThreshold={0.54} luminanceSmoothing={0.72} mipmapBlur />
      </EffectComposer>
    </>
  );
}
