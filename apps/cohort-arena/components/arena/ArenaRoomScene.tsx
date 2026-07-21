"use client";

import type { CohortArenaView, MotionSpec, Vec3 } from "@gt100k/cohort-arena-view";
import { Environment, Lightformer, Line, Sparkles } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  type Fog,
  type Mesh,
  MeshBasicMaterial,
  type MeshPhysicalMaterial,
  QuadraticBezierCurve3,
  Vector3,
} from "three";
import type { Line2 } from "three/examples/jsm/lines/Line2.js";
import type { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";

import { type RenderTier3D, resolveRenderSettings } from "../performance/runtime";
import {
  type DominanceRingScene,
  type InterruptionArcScene,
  buildArenaRoomScene,
  resolveArenaEvidenceMotion,
  resolveArenaRoomMotion,
  resolveArenaSuppressionMotion,
} from "./scene";

interface ArenaRoomSceneProps {
  readonly view: CohortArenaView;
  readonly renderTier?: RenderTier3D;
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

function SuppressionFog({
  motion,
  color,
}: { readonly motion: MotionSpec; readonly color: string }) {
  const fog = useRef<Fog>(null);
  const startedAt = useRef<number | null>(null);
  const invalidate = useThree(({ invalidate: requestFrame }) => requestFrame);

  useEffect(() => {
    startedAt.current = null;
    invalidate();
  }, [invalidate]);

  useFrame(({ clock }) => {
    if (!fog.current) return;

    startedAt.current ??= clock.elapsedTime;
    const elapsedMs = (clock.elapsedTime - startedAt.current) * 1_000;
    const progress = progressFor(motion, elapsedMs);
    fog.current.near = 28 + (10 - 28) * progress;
    fog.current.far = 62 + (30 - 62) * progress;

    if (progress < 1) invalidate();
  });

  return <fog ref={fog} attach="fog" args={[color, 28, 62]} name="arena-suppression-fog" />;
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

export function ArenaRoomScene({ view, renderTier = "full-3d" }: ArenaRoomSceneProps) {
  const scene = useMemo(() => buildArenaRoomScene(view), [view]);
  const motion = useMemo(() => resolveArenaRoomMotion(view), [view]);
  const evidenceMotion = useMemo(() => resolveArenaEvidenceMotion(view), [view]);
  const suppressionMotion = useMemo(() => resolveArenaSuppressionMotion(view), [view]);
  const renderSettings = resolveRenderSettings(renderTier);
  const invalidate = useThree(({ invalidate: requestFrame }) => requestFrame);
  const seatMaterials = useRef(new Map<string, MeshPhysicalMaterial>());
  const lightColumns = useRef(new Map<string, Mesh>());
  const cameraStartedAt = useRef<number | null>(null);
  const restPosition = useRef<Vector3 | null>(null);
  // Instant when reduced motion is active (the 3D scene only mounts outside the
  // 2D fallback, but keep it honest); a crafted crane duration otherwise.
  const introDurationMs = motion.mode === "reduced" ? 0 : 1_400;

  const registerSeatMaterial = useCallback(
    (speaker: string) => (material: MeshPhysicalMaterial | null) => {
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

  // Kick a first frame so the establishing crane plays even on the demand loop
  // (aggregate/off rooms only render on request). The intro then self-schedules
  // frames until it lands; idle breathing is confined to live "always" rooms,
  // so the demand/always frame-loop contract is left intact.
  useEffect(() => {
    invalidate();
  }, [invalidate]);

  useFrame(({ camera, clock }) => {
    if (!scene) return;

    const elapsedMs = clock.elapsedTime * 1_000;
    const hasFloorHolder = scene.seats.some(({ holdingFloor }) => holdingFloor);
    const phase =
      motion.durationMs === 0
        ? 1
        : (Math.sin((elapsedMs / motion.durationMs) * Math.PI * 2 - Math.PI / 2) + 1) / 2;

    for (const seat of scene.seats) {
      const material = seatMaterials.current.get(seat.speaker);
      if (material) {
        material.emissiveIntensity = seat.holdingFloor
          ? 0.72 + phase * 0.5
          : scene.suppressed
            ? 0.025
            : 0.1;
      }

      const column = lightColumns.current.get(seat.speaker);
      if (!column) continue;
      column.scale.y = 0.92 + phase * 0.08;
      if (column.material instanceof MeshBasicMaterial) {
        column.material.opacity = 0.1 + phase * 0.12;
      }
    }

    // ── Cinematography (game-feel #5) ──────────────────────────────────────
    // The room used to snap to a static `lookAt` while the observatory glided
    // in and breathed. Give it the same treatment: an eased establishing crane
    // (higher + pulled back, swinging into frame → settling on the seat ring)
    // and, only while a live floor holder holds the loop "always", a slow damped
    // orbital breath. Anchored to the panel's resting camera, captured once.
    restPosition.current ??= camera.position.clone();
    cameraStartedAt.current ??= elapsedMs;
    const rest = restPosition.current;

    const introLinear =
      introDurationMs === 0
        ? 1
        : Math.min(1, (elapsedMs - cameraStartedAt.current) / introDurationMs);
    const introEased = 1 - (1 - introLinear) ** 4; // ease-out, mirrors progressFor("enter")
    const settle = 1 - introEased; // 1 → 0 as the crane lands

    // Idle breath: a gentle azimuthal orbit + vertical bob, damped, ONLY when a
    // floor-holder pulse already runs frameloop="always" — so the demand-loop
    // aggregate/off rooms fall idle after the intro (frame-loop contract intact).
    const idleAzimuth = hasFloorHolder ? Math.sin((elapsedMs / 9_000) * Math.PI * 2) * 0.05 : 0;
    const idleLift = hasFloorHolder ? Math.sin((elapsedMs / 7_000) * Math.PI * 2) * 0.55 : 0;

    const azimuth = 0.16 * settle + idleAzimuth; // swing-in fades into the idle orbit
    const cos = Math.cos(azimuth);
    const sin = Math.sin(azimuth);
    camera.position.set(
      rest.x * cos - rest.z * sin,
      rest.y + 7 * settle + idleLift,
      rest.x * sin + rest.z * cos + 9 * settle,
    );
    camera.lookAt(0, 1.2, 0);

    // Self-schedule through the intro so it plays on the demand loop too; idle
    // breathing needs no invalidate (a live pulse already runs the loop).
    if (introLinear < 1) invalidate();
  });

  if (!scene) return null;

  return (
    <>
      {scene.suppressed ? (
        <SuppressionFog motion={suppressionMotion} color={view.presentation.palette.deck2} />
      ) : (
        <fog attach="fog" args={[view.presentation.palette.deck, 28, 62]} />
      )}
      <hemisphereLight
        args={[
          view.presentation.palette.peerHi,
          view.presentation.palette.deck,
          scene.suppressed ? 0.22 : 0.5,
        ]}
      />
      <pointLight
        color={view.presentation.palette.peer}
        intensity={scene.suppressed ? 4 : 12}
        distance={45}
        position={[0, 12, 4]}
      />
      {/* Cool rim/back light so the seat ring separates from the deck as silhouettes. */}
      <directionalLight
        color={view.presentation.palette.peerHi}
        intensity={scene.suppressed ? 0.24 : 0.7}
        position={[-8, 16, -20]}
      />

      {/* Crafted image-based ambient — no HDRI fetch; art-directed to the palette so the
          seats, backboards and floor ring catch real reflections off the room's rig. The
          arena's key is the warm floor-holder gainHi (its own hue within the world), lifted
          by cyan/teal peer fills and a violet accent, then cooled to a veil when suppressed. */}
      <Environment resolution={192} frames={1}>
        <Lightformer
          form="ring"
          intensity={scene.suppressed ? 0.7 : 2.1}
          color={view.presentation.palette.gainHi}
          position={[0, 18, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[16, 16, 1]}
        />
        <Lightformer
          form="rect"
          intensity={scene.suppressed ? 0.4 : 1.1}
          color={view.presentation.palette.peer}
          position={[-16, 7, 10]}
          scale={[10, 12, 1]}
        />
        <Lightformer
          form="rect"
          intensity={scene.suppressed ? 0.4 : 0.9}
          color={view.presentation.palette.floor}
          position={[16, 6, -8]}
          scale={[10, 12, 1]}
        />
        <Lightformer
          form="circle"
          intensity={scene.suppressed ? 0.5 : 0.75}
          color={scene.suppressed ? view.presentation.palette.locked : view.presentation.palette.form}
          position={[0, -8, 0]}
          scale={[26, 26, 1]}
        />
      </Environment>

      {/* Faint drifting dust so the room breathes; skipped on the degraded tier / suppressed. */}
      {renderTier === "full-3d" && !scene.suppressed ? (
        <Sparkles
          count={36}
          scale={[26, 12, 26]}
          size={1.8}
          speed={0.22}
          opacity={0.4}
          noise={1.2}
          color={view.presentation.palette.peerHi}
        />
      ) : null}

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
            {/* Seat podium: a polished clearcoat gem, not flat plastic. The lit core still
                feeds Bloom (emissive animation is driven per-frame), but the read now comes
                from a wet clearcoat fresnel + a peerHi sheen catching the IBL rig. */}
            <meshPhysicalMaterial
              ref={registerSeatMaterial(seat.speaker)}
              color={
                seat.holdingFloor
                  ? view.presentation.palette.gainHi
                  : view.presentation.palette.deck3
              }
              emissive={
                scene.suppressed
                  ? view.presentation.palette.locked
                  : seat.holdingFloor
                    ? view.presentation.palette.gain
                    : view.presentation.palette.peer
              }
              emissiveIntensity={scene.suppressed ? 0.025 : seat.holdingFloor ? 1.22 : 0.1}
              metalness={0.12}
              roughness={0.24}
              clearcoat={0.9}
              clearcoatRoughness={0.22}
              sheen={0.35}
              sheenColor={view.presentation.palette.peerHi}
              envMapIntensity={1.4}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[0, 0.52, -0.28]} rotation={[-0.12, 0, 0]}>
            <boxGeometry args={[1.65, 1.15, 0.3]} />
            {/* Backboard: a dark brushed-metal panel that catches cyan/teal reflections off
                the rig, grounding each seat with depth instead of a matte grey box. */}
            <meshPhysicalMaterial
              color={view.presentation.palette.deck3}
              emissive={
                scene.suppressed ? view.presentation.palette.locked : view.presentation.palette.peer
              }
              emissiveIntensity={scene.suppressed ? 0.02 : seat.holdingFloor ? 0.34 : 0.06}
              metalness={0.35}
              roughness={0.3}
              clearcoat={0.6}
              clearcoatRoughness={0.32}
              envMapIntensity={1.6}
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

      {/* Cinematic grade (full-3d only; the degraded tier skips post for frame budget) —
          the same chain as the observatory so the two scenes read as one graded world:
          glow -> saturation lift -> filmic contrast -> vignette framing -> fine grain. */}
      {renderSettings.bloom ? (
        <EffectComposer multisampling={renderSettings.antialias ? 4 : 0} enableNormalPass={false}>
          <Bloom
            intensity={scene.suppressed ? 0.32 : 0.5}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.7}
            mipmapBlur
          />
          <HueSaturation saturation={0.1} />
          <BrightnessContrast brightness={0.01} contrast={0.13} />
          <Vignette offset={0.26} darkness={scene.suppressed ? 0.78 : 0.62} />
          <Noise premultiply opacity={0.04} />
        </EffectComposer>
      ) : null}
    </>
  );
}
