"use client";

import type { CohortArenaView, Vec3 } from "@gt100k/cohort-arena-view";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { type Mesh, MeshBasicMaterial, type MeshStandardMaterial } from "three";

import { buildArenaRoomScene, resolveArenaRoomMotion } from "./scene";

interface ArenaRoomSceneProps {
  readonly view: CohortArenaView;
}

function toTuple(position: Vec3): [number, number, number] {
  return [position.x, position.y, position.z];
}

export function ArenaRoomScene({ view }: ArenaRoomSceneProps) {
  const scene = useMemo(() => buildArenaRoomScene(view), [view]);
  const motion = useMemo(() => resolveArenaRoomMotion(view), [view]);
  const camera = useThree(({ camera: activeCamera }) => activeCamera);
  const seatMaterials = useRef(new Map<string, MeshStandardMaterial>());
  const lightColumns = useRef(new Map<string, Mesh>());

  const registerSeatMaterial = useCallback(
    (speaker: string) => (material: MeshStandardMaterial | null) => {
      if (material) seatMaterials.current.set(speaker, material);
      else seatMaterials.current.delete(speaker);
    },
    [],
  );
  const registerLightColumn = useCallback(
    (speaker: string) => (column: Mesh | null) => {
      if (column) lightColumns.current.set(speaker, column);
      else lightColumns.current.delete(speaker);
    },
    [],
  );

  useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame(({ clock }) => {
    if (!scene) return;

    const elapsedMs = clock.elapsedTime * 1_000;
    const phase =
      motion.durationMs === 0
        ? 1
        : (Math.sin((elapsedMs / motion.durationMs) * Math.PI * 2 - Math.PI / 2) + 1) / 2;

    for (const seat of scene.seats) {
      const material = seatMaterials.current.get(seat.speaker);
      if (material) material.emissiveIntensity = seat.holdingFloor ? 0.72 + phase * 0.5 : 0.1;

      const column = lightColumns.current.get(seat.speaker);
      if (!column) continue;
      column.scale.y = 0.92 + phase * 0.08;
      if (column.material instanceof MeshBasicMaterial) {
        column.material.opacity = 0.1 + phase * 0.12;
      }
    }
  });

  if (!scene) return null;

  return (
    <>
      <fog attach="fog" args={[view.presentation.palette.deck, 28, 62]} />
      <hemisphereLight
        args={[view.presentation.palette.peerHi, view.presentation.palette.deck, 0.5]}
      />
      <pointLight
        color={view.presentation.palette.peer}
        intensity={12}
        distance={45}
        position={[0, 12, 4]}
      />

      <mesh position={[0, -0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[10, 0.045, 8, 128]} />
        <meshBasicMaterial
          color={view.presentation.palette.locked}
          depthWrite={false}
          opacity={0.72}
          transparent
        />
      </mesh>

      {scene.seats.map((seat) => (
        <group key={seat.speaker} position={toTuple(seat.pos)}>
          <mesh name={`arena-seat-${seat.speaker}`} position={[0, 0.22, 0]}>
            <cylinderGeometry args={[1.2, 1.42, 0.44, 32]} />
            <meshStandardMaterial
              ref={registerSeatMaterial(seat.speaker)}
              color={
                seat.holdingFloor
                  ? view.presentation.palette.gainHi
                  : view.presentation.palette.deck3
              }
              emissive={
                seat.holdingFloor ? view.presentation.palette.gain : view.presentation.palette.peer
              }
              emissiveIntensity={seat.holdingFloor ? 1.22 : 0.1}
              metalness={0.08}
              roughness={0.34}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[0, 0.52, -0.28]} rotation={[-0.12, 0, 0]}>
            <boxGeometry args={[1.65, 1.15, 0.3]} />
            <meshStandardMaterial
              color={view.presentation.palette.deck3}
              emissive={view.presentation.palette.peer}
              emissiveIntensity={seat.holdingFloor ? 0.34 : 0.06}
              metalness={0.06}
              roughness={0.42}
            />
          </mesh>

          {seat.holdingFloor ? (
            <>
              <mesh
                name="arena-light-column"
                ref={registerLightColumn(seat.speaker)}
                position={[0, 3.5, 0]}
              >
                <cylinderGeometry args={[0.42, 0.92, 7, 32, 1, true]} />
                <meshBasicMaterial
                  color={view.presentation.palette.gainHi}
                  depthWrite={false}
                  opacity={0.22}
                  side={2}
                  transparent
                />
              </mesh>
              <pointLight
                color={view.presentation.palette.gain}
                distance={9}
                intensity={8}
                position={[0, 2.4, 0]}
              />
            </>
          ) : null}
        </group>
      ))}
    </>
  );
}
