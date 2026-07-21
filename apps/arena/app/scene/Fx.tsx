"use client";

import {
  type InitialArenaView,
  LAMBDAS,
  MOTION,
  celebrationMotionSpec,
  resolveMotion,
} from "@gt100k/arena-world";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  type BufferAttribute,
  Color,
  type Group,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  type PerspectiveCamera,
  type Points,
  type PointsMaterial,
  Vector3,
} from "three";
import type { ArenaEventBus } from "./eventBus";
import {
  type SequencedArenaFeedback,
  resolveArenaFeedback,
  resolveFeedbackAnnouncement,
} from "./feedback";

const CAMERA_PUNCH_OUT_MS = 120;
const CAMERA_PUNCH_BACK_MS = 180;
const CAMERA_PUNCH_DISTANCE = -2;
const CAMERA_PUNCH_FOV = 1.5;
const BEACON_LIFT = 1.2;
const INTENSITY_ORDER = ["low", "medium", "high"] as const;

export function limitCelebrationIntensity(
  intensity: (typeof INTENSITY_ORDER)[number],
  ceiling: (typeof INTENSITY_ORDER)[number],
): (typeof INTENSITY_ORDER)[number] {
  return INTENSITY_ORDER[
    Math.min(INTENSITY_ORDER.indexOf(intensity), INTENSITY_ORDER.indexOf(ceiling))
  ] as (typeof INTENSITY_ORDER)[number];
}

export interface ParticleSeed {
  x: number;
  y: number;
  z: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
}

export interface CameraPunchFrame {
  distanceDelta: number;
  fovDelta: number;
}

export interface FxPlan {
  sequence: number;
  kind: "burst" | "warm-pulse" | "not-yet-wisp" | "static-badge";
  anchor: { x: number; y: number; z: number };
  particleCount: number;
  durationMs: number;
  bloomPeak: number;
  cameraPunch: boolean;
  beaconIgnition: "animated" | "steady" | "none";
  burstDelayMs: number;
  beaconDelayMs: number;
  cameraDelayMs: number;
  staticBadge: "beacon-lit" | "effort-honored" | "not-yet" | null;
  announcement: string;
  soundCue: ReturnType<typeof resolveArenaFeedback>["soundCue"];
}

export function createParticleSeeds(count: number): ParticleSeed[] {
  if (count <= 0) return [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  return Array.from({ length: count }, (_, index) => {
    const normalized = (index + 0.5) / count;
    const radius = Math.sqrt(normalized);
    const angle = index * goldenAngle;
    return {
      x: Math.cos(angle) * radius * 0.12,
      y: 0,
      z: Math.sin(angle) * radius * 0.12,
      velocityX: Math.cos(angle) * (1.2 + radius * 1.7),
      velocityY: 1.5 + (1 - normalized) * 2.1,
      velocityZ: Math.sin(angle) * (1.2 + radius * 1.7),
    };
  });
}

function cubicOut(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

function cubicInOut(progress: number): number {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}

export function resolveCameraPunch(elapsedMs: number): CameraPunchFrame {
  if (elapsedMs <= 0) return { distanceDelta: 0, fovDelta: 0 };
  if (elapsedMs <= CAMERA_PUNCH_OUT_MS) {
    const progress = cubicOut(elapsedMs / CAMERA_PUNCH_OUT_MS);
    return {
      distanceDelta: CAMERA_PUNCH_DISTANCE * progress,
      fovDelta: CAMERA_PUNCH_FOV * progress,
    };
  }

  const returnElapsed = elapsedMs - CAMERA_PUNCH_OUT_MS;
  if (returnElapsed >= CAMERA_PUNCH_BACK_MS) return { distanceDelta: 0, fovDelta: 0 };
  const remaining = 1 - cubicInOut(returnElapsed / CAMERA_PUNCH_BACK_MS);
  return {
    distanceDelta: CAMERA_PUNCH_DISTANCE * remaining,
    fovDelta: CAMERA_PUNCH_FOV * remaining,
  };
}

function requiredAnchor(
  view: InitialArenaView,
  nodeId: string | undefined,
): { x: number; y: number; z: number } {
  const fallbackNodeId =
    view.nodeStates.find(({ state }) => state === "available")?.nodeId ?? view.world.nodes[0]?.id;
  const transform = view.presentation.worldTransform.nodes.find(
    (candidate) => candidate.nodeId === (nodeId ?? fallbackNodeId),
  );
  if (!transform) throw new Error("Arena feedback has no world anchor");
  return { x: transform.x, y: transform.y, z: transform.z };
}

export function buildFxPlan(
  view: InitialArenaView,
  feedbackInput: SequencedArenaFeedback,
  targetNodeId?: string,
): FxPlan {
  const feedback = resolveArenaFeedback(feedbackInput.signal);
  const event = feedback.event;
  const eventNodeId = event?.type === "independent-unlock" ? event.nodeId : undefined;
  const anchor = requiredAnchor(view, eventNodeId ?? targetNodeId);
  const announcement = resolveFeedbackAnnouncement(view, feedback);

  if (!event) {
    const reduced = view.flags.reducedMotion;
    return {
      sequence: feedbackInput.sequence,
      kind: reduced ? "static-badge" : "not-yet-wisp",
      anchor,
      particleCount: 0,
      durationMs: reduced ? MOTION.micro : MOTION.base,
      bloomPeak: 0.7,
      cameraPunch: false,
      beaconIgnition: "none",
      burstDelayMs: 0,
      beaconDelayMs: 0,
      cameraDelayMs: 0,
      staticBadge: reduced ? "not-yet" : null,
      announcement,
      soundCue: feedback.soundCue,
    };
  }

  const effectiveEvent = {
    ...event,
    intensity: limitCelebrationIntensity(
      event.intensity,
      view.presentation.visualBand.celebrationCeiling,
    ),
  };
  const motion = celebrationMotionSpec(effectiveEvent, {
    reducedMotion: view.flags.reducedMotion,
  });
  const beaconMotion = resolveMotion("nodeReveal", {
    reducedMotion: view.flags.reducedMotion,
  });
  const independentUnlock = event.type === "independent-unlock";
  const staticBadge = independentUnlock ? "beacon-lit" : "effort-honored";
  const orchestratedHigh =
    motion.mode === "animated" && independentUnlock && effectiveEvent.intensity === "high";

  return {
    sequence: feedbackInput.sequence,
    kind: motion.mode === "static" ? "static-badge" : independentUnlock ? "burst" : "warm-pulse",
    anchor,
    particleCount: Math.round(motion.particleCount * view.presentation.qualityBudget.particleScale),
    durationMs: motion.durationMs,
    bloomPeak: motion.bloomPeak,
    cameraPunch: motion.cameraPunch,
    beaconIgnition: independentUnlock
      ? beaconMotion.durationMs === 0
        ? "steady"
        : "animated"
      : "none",
    burstDelayMs: orchestratedHigh ? 120 : 0,
    beaconDelayMs: orchestratedHigh ? 120 : 0,
    cameraDelayMs: orchestratedHigh ? 120 : 0,
    staticBadge: motion.mode === "static" ? staticBadge : null,
    announcement,
    soundCue: feedback.soundCue,
  };
}

function isPerspectiveCamera(camera: unknown): camera is PerspectiveCamera {
  return (
    typeof camera === "object" &&
    camera !== null &&
    "isPerspectiveCamera" in camera &&
    camera.isPerspectiveCamera === true
  );
}

function StaticBadge({ plan, colorHex }: { plan: FxPlan; colorHex: string }) {
  if (plan.staticBadge === "effort-honored") {
    return (
      <group
        name="static-effort-honored"
        position={[plan.anchor.x, plan.anchor.y + 0.8, plan.anchor.z]}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.58, 0.1, 6, 20]} />
          <meshBasicMaterial color={colorHex} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.18, 8, 6]} />
          <meshBasicMaterial color={colorHex} toneMapped={false} />
        </mesh>
      </group>
    );
  }

  if (plan.staticBadge === "not-yet") {
    return (
      <group name="static-not-yet" position={[plan.anchor.x, plan.anchor.y + 0.65, plan.anchor.z]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.065, 5, 18]} />
          <meshBasicMaterial color={colorHex} opacity={0.72} toneMapped={false} transparent />
        </mesh>
      </group>
    );
  }

  return (
    <group name="static-beacon-lit" position={[plan.anchor.x, plan.anchor.y, plan.anchor.z]}>
      <mesh position={[0, BEACON_LIFT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.12, 6, 20]} />
        <meshBasicMaterial color={colorHex} toneMapped={false} />
      </mesh>
      <mesh position={[0, BEACON_LIFT, 0]}>
        <octahedronGeometry args={[0.36, 0]} />
        <meshStandardMaterial
          color={colorHex}
          emissive={colorHex}
          emissiveIntensity={0.85}
          flatShading
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function AnimatedFx({ plan, view }: { plan: FxPlan; view: InitialArenaView }) {
  const camera = useThree((state) => state.camera);
  const root = useRef<Group>(null);
  const points = useRef<Points>(null);
  const pointsMaterial = useRef<PointsMaterial>(null);
  const ripple = useRef<Group>(null);
  const rippleMaterial = useRef<MeshBasicMaterial>(null);
  const beaconMaterial = useRef<MeshStandardMaterial>(null);
  const elapsedMs = useRef(0);
  const appliedDistance = useRef(0);
  const appliedFov = useRef(0);
  const direction = useMemo(() => new Vector3(), []);
  const lastDirection = useMemo(() => new Vector3(), []);
  const seeds = useMemo(() => createParticleSeeds(plan.particleCount), [plan.particleCount]);
  const positions = useMemo(() => new Float32Array(plan.particleCount * 3), [plan.particleCount]);
  const colors = useMemo(() => new Float32Array(plan.particleCount * 3), [plan.particleCount]);
  const ember = useMemo(
    () => new Color(view.presentation.palette.ember),
    [view.presentation.palette.ember],
  );
  const gold = useMemo(
    () => new Color(view.presentation.palette.gold),
    [view.presentation.palette.gold],
  );
  const particleColor = useMemo(() => new Color(), []);

  useEffect(
    () => () => {
      if (!isPerspectiveCamera(camera)) return;
      if (appliedDistance.current !== 0) {
        camera.position.addScaledVector(lastDirection, -appliedDistance.current);
      }
      if (appliedFov.current !== 0) {
        camera.fov -= appliedFov.current;
        camera.updateProjectionMatrix();
      }
    },
    [camera, lastDirection],
  );

  useFrame((_, delta) => {
    const currentRoot = root.current;
    if (!currentRoot) return;
    elapsedMs.current += delta * 1_000;
    const effectElapsedMs = Math.max(0, elapsedMs.current - plan.burstDelayMs);
    const effectStarted = elapsedMs.current >= plan.burstDelayMs;
    const progress = effectStarted ? Math.min(1, effectElapsedMs / plan.durationMs) : 0;
    const elapsedSeconds = effectElapsedMs / 1_000;

    if (plan.kind === "not-yet-wisp") {
      currentRoot.position.y = plan.anchor.y + Math.sin(Math.PI * progress) * 0.55;
      currentRoot.rotation.y = progress * Math.PI * 0.4;
    }

    if (plan.particleCount > 0) {
      const warmPulse = plan.kind === "warm-pulse";
      for (let index = 0; index < seeds.length; index += 1) {
        const seed = seeds[index];
        if (!seed) continue;
        const offset = index * 3;
        const radialScale = warmPulse ? 0.28 : 1;
        const gravity = warmPulse ? 0 : -2.4;
        positions[offset] = seed.x + seed.velocityX * elapsedSeconds * radialScale;
        positions[offset + 1] =
          seed.y + seed.velocityY * elapsedSeconds + 0.5 * gravity * elapsedSeconds ** 2;
        positions[offset + 2] = seed.z + seed.velocityZ * elapsedSeconds * radialScale;
      }
      const positionAttribute = points.current?.geometry.getAttribute("position") as
        | BufferAttribute
        | undefined;
      if (positionAttribute) positionAttribute.needsUpdate = true;
      if (pointsMaterial.current) {
        pointsMaterial.current.opacity = effectStarted ? 1 - progress : 0;
      }

      particleColor.lerpColors(ember, gold, progress);
      for (let index = 0; index < plan.particleCount; index += 1) {
        const offset = index * 3;
        colors[offset] = particleColor.r;
        colors[offset + 1] = particleColor.g;
        colors[offset + 2] = particleColor.b;
      }
      const colorAttribute = points.current?.geometry.getAttribute("color") as
        | BufferAttribute
        | undefined;
      if (colorAttribute) colorAttribute.needsUpdate = true;
    }

    if (ripple.current) ripple.current.scale.setScalar(0.85 + progress * 2.1);
    if (rippleMaterial.current) {
      rippleMaterial.current.opacity = effectStarted ? (1 - progress) * 0.7 : 0;
    }
    if (beaconMaterial.current && elapsedMs.current >= plan.beaconDelayMs) {
      const target = progress < 0.62 ? 1.75 : 0.85;
      const alpha = 1 - Math.exp(-LAMBDAS.beaconRise * delta);
      beaconMaterial.current.emissiveIntensity +=
        (target - beaconMaterial.current.emissiveIntensity) * alpha;
    }

    if (plan.cameraPunch && isPerspectiveCamera(camera)) {
      const punch = resolveCameraPunch(elapsedMs.current - plan.cameraDelayMs);
      direction
        .set(
          camera.position.x - plan.anchor.x,
          camera.position.y - plan.anchor.y,
          camera.position.z - plan.anchor.z,
        )
        .normalize();
      lastDirection.copy(direction);
      camera.position.addScaledVector(direction, punch.distanceDelta - appliedDistance.current);
      camera.fov += punch.fovDelta - appliedFov.current;
      camera.updateProjectionMatrix();
      appliedDistance.current = punch.distanceDelta;
      appliedFov.current = punch.fovDelta;
    }

    if (effectStarted && progress >= 1) currentRoot.visible = false;
  });

  if (plan.kind === "not-yet-wisp") {
    return (
      <group
        ref={root}
        name="not-yet-float-wisp"
        position={[plan.anchor.x, plan.anchor.y, plan.anchor.z]}
      >
        <mesh>
          <sphereGeometry args={[0.26, 8, 6]} />
          <meshBasicMaterial
            color={view.presentation.palette.notYet}
            opacity={0.82}
            toneMapped={false}
            transparent
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.44, 0.045, 5, 16]} />
          <meshBasicMaterial
            color={view.presentation.palette.notYet}
            opacity={0.48}
            toneMapped={false}
            transparent
          />
        </mesh>
      </group>
    );
  }

  return (
    <group
      ref={root}
      name={`learning-feedback:${plan.kind}`}
      position={[plan.anchor.x, plan.anchor.y, plan.anchor.z]}
    >
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={pointsMaterial}
          depthWrite={false}
          opacity={1}
          size={plan.kind === "warm-pulse" ? 0.18 : 0.24}
          transparent
          vertexColors
        />
      </points>
      <group ref={ripple} position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.55, 0.055, 5, 24]} />
          <meshBasicMaterial
            ref={rippleMaterial}
            color={
              plan.kind === "warm-pulse"
                ? view.presentation.palette.sun
                : view.presentation.palette.ember
            }
            opacity={0.7}
            toneMapped={false}
            transparent
          />
        </mesh>
      </group>
      {plan.beaconIgnition === "animated" ? (
        <mesh position={[0, BEACON_LIFT, 0]}>
          <octahedronGeometry args={[0.38, 0]} />
          <meshStandardMaterial
            ref={beaconMaterial}
            color={view.presentation.palette.gold}
            emissive={view.presentation.palette.ember}
            emissiveIntensity={0.2}
            flatShading
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}

export interface FxProps {
  view: InitialArenaView;
  feedback?: SequencedArenaFeedback;
  targetNodeId?: string;
  eventBus?: Pick<ArenaEventBus, "emit">;
}

export default function Fx({ view, feedback, targetNodeId, eventBus }: FxProps) {
  const emittedSequence = useRef(0);
  const plan = useMemo(
    () => (feedback ? buildFxPlan(view, feedback, targetNodeId) : null),
    [feedback, targetNodeId, view],
  );

  useEffect(() => {
    if (!plan || !feedback || feedback.signal.type !== "independent-unlock") return;
    if (emittedSequence.current === feedback.sequence) return;
    emittedSequence.current = feedback.sequence;
    eventBus?.emit("unlock-celebrated", {
      nodeId: feedback.signal.nodeId,
      intensity: limitCelebrationIntensity(
        feedback.signal.transferCritical ? "high" : "medium",
        view.presentation.visualBand.celebrationCeiling,
      ),
    });
  }, [eventBus, feedback, plan, view.presentation.visualBand.celebrationCeiling]);

  if (!plan) return null;
  if (plan.kind === "static-badge") {
    const colorHex =
      plan.staticBadge === "not-yet"
        ? view.presentation.palette.notYet
        : view.presentation.palette.gold;
    return <StaticBadge colorHex={colorHex} plan={plan} />;
  }

  return <AnimatedFx key={plan.sequence} plan={plan} view={view} />;
}
