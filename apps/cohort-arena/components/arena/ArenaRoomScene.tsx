"use client";

import type { CohortArenaView, MotionSpec, Vec3 } from "@gt100k/cohort-arena-view";
import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  type Mesh,
  MeshBasicMaterial,
  type MeshStandardMaterial,
  QuadraticBezierCurve3,
  Vector3,
} from "three";
import type { Line2 } from "three/examples/jsm/lines/Line2.js";
import type { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";

import {
  type DominanceRingScene,
  type InterruptionArcScene,
  buildArenaRoomScene,
  resolveArenaEvidenceMotion,
  resolveArenaRoomMotion,
} from "./scene";

interface ArenaRoomSceneProps {
  readonly view: CohortArenaView;
}

function toTuple(position: Vec3): [number, number, number] {
  return [position.x, position.y, position.z];
}

function progressFor(motion: MotionSpec, elapsedMs: number): number {
  if (motion.durationMs === 0) return 1;

  const linear = Math.min(1, elapsedMs / motion.durationMs);
  if (motion.easing === "enter") return 1 - (1 - linear) ** 4;
  if (motion.easing === "move") {
    return linear < 0.5 ? 2 * linear * linear : 1 - (-2 * linear + 2) ** 2 / 2;
  }
  return linear;
}

function DominanceRing({
  ring,
  motion,
  color,
}: {
  readonly ring: DominanceRingScene;
  readonly motion: MotionSpec;
  readonly color: string;
}) {
  const mesh = useRef<Mesh>(null);
  const startedAt = useRef<number | null>(null);
  const invalidate = useThree(({ invalidate: requestFrame }) => requestFrame);

  useEffect(() => {
    startedAt.current = null;
    invalidate();
  }, [invalidate]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;

    startedAt.current ??= clock.elapsedTime;
    const elapsedMs = (clock.elapsedTime - startedAt.current) * 1_000;
    const progress = progressFor(motion, elapsedMs);
    const geometry = mesh.current.geometry;
    const indexCount = geometry.index?.count ?? geometry.attributes.position?.count ?? 0;
    geometry.setDrawRange(0, Math.ceil((indexCount * progress) / 3) * 3);

    if (progress < 1) invalidate();
  });

  return (
    <mesh
      ref={mesh}
      name={`dominance-share-ring-${ring.speaker}`}
      position={[ring.pos.x, ring.pos.y + 0.35, ring.pos.z]}
      rotation={[Math.PI / 2, 0, -Math.PI / 2]}
      userData={{ evidence: ring.evidence, share: ring.share }}
    >
      <torusGeometry args={[1.76, 0.12, 8, 72, ring.arcRadians]} />
      <meshBasicMaterial color={color} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function InterruptionArc({
  arc,
  motion,
  color,
}: {
  readonly arc: InterruptionArcScene;
  readonly motion: MotionSpec;
  readonly color: string;
}) {
  const line = useRef<Line2 | LineSegments2>(null);
  const spark = useRef<Mesh>(null);
  const startedAt = useRef<number | null>(null);
  const invalidate = useThree(({ invalidate: requestFrame }) => requestFrame);
  const curve = useMemo(
    () =>
      new QuadraticBezierCurve3(
        new Vector3(arc.from.x, arc.from.y, arc.from.z),
        new Vector3(arc.control.x, arc.control.y, arc.control.z),
        new Vector3(arc.to.x, arc.to.y, arc.to.z),
      ),
    [arc],
  );
  const points = useMemo(
    () => curve.getPoints(32).map(({ x, y, z }) => [x, y, z] as [number, number, number]),
    [curve],
  );

  useEffect(() => {
    startedAt.current = null;
    invalidate();
  }, [invalidate]);

  useFrame(({ clock }) => {
    startedAt.current ??= clock.elapsedTime;
    const elapsedMs = (clock.elapsedTime - startedAt.current) * 1_000;
    const progress = progressFor(motion, elapsedMs);

    if (line.current) {
      line.current.material.dashOffset = -progress * 2.4;
      line.current.material.opacity = 0.32 + progress * 0.5;
    }
    if (spark.current) spark.current.position.copy(curve.getPoint(progress));

    if (progress < 1) invalidate();
  });

  return (
    <group
      name={`interruption-arc-${arc.speaker}-to-${arc.floorHolder}`}
      userData={{ count: arc.count, evidence: arc.evidence }}
    >
      <Line
        ref={line}
        color={color}
        dashSize={0.55}
        dashed
        depthWrite={false}
        gapSize={0.22}
        lineWidth={2.4}
        opacity={0.82}
        points={points}
        transparent
      />
      <mesh ref={spark} position={toTuple(arc.from)}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function ArenaRoomScene({ view }: ArenaRoomSceneProps) {
  const scene = useMemo(() => buildArenaRoomScene(view), [view]);
  const motion = useMemo(() => resolveArenaRoomMotion(view), [view]);
  const evidenceMotion = useMemo(() => resolveArenaEvidenceMotion(view), [view]);
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

      {scene.dominanceRings.map((ring) => (
        <DominanceRing
          key={`${ring.speaker}-${ring.share}-${ring.evidence}`}
          ring={ring}
          motion={evidenceMotion.dominanceRing}
          color={view.presentation.palette.gainHi}
        />
      ))}
      {scene.interruptionArcs.map((arc) => (
        <InterruptionArc
          key={`${arc.speaker}-${arc.floorHolder}-${arc.count}-${arc.evidence}`}
          arc={arc}
          motion={evidenceMotion.interruptionArc}
          color={view.presentation.palette.churn}
        />
      ))}

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
