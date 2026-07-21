"use client";

import {
  type AvatarAnimationSpec,
  type InitialArenaView,
  LAMBDAS,
  resolveMotion,
} from "@gt100k/arena-world";
import { useFrame } from "@react-three/fiber";
import { type MutableRefObject, useMemo, useRef } from "react";
import { type Group, type MeshStandardMaterial, Vector3 } from "three";

type VectorLike = { x: number; y: number; z: number };

type AvatarCosmeticSlot = "hat" | "cape" | "badge";

export interface AvatarCosmeticPlanEntry {
  id: string;
  slot: AvatarCosmeticSlot;
  durationMs: number;
  mode: "animated" | "reduced";
}

const AVATAR_SLOT_BY_COSMETIC_ID: Readonly<Record<string, AvatarCosmeticSlot>> = {
  "avatar-hat-explorer": "hat",
  "avatar-cape-aurora": "cape",
  "avatar-badge-firstlight": "badge",
};

export function buildAvatarCosmeticPlan(
  view: InitialArenaView,
  staticMotion = false,
): AvatarCosmeticPlanEntry[] {
  const transition = resolveMotion("equip", {
    reducedMotion: view.flags.reducedMotion || staticMotion,
  });

  return view.avatar.equipped.flatMap((id) => {
    const slot = AVATAR_SLOT_BY_COSMETIC_ID[id];
    return slot
      ? [
          {
            id,
            slot,
            durationMs: transition.durationMs,
            mode: transition.mode,
          },
        ]
      : [];
  });
}

export function damp3<T extends VectorLike>(
  current: T,
  target: VectorLike,
  lambda: number,
  delta: number,
): T {
  const alpha = 1 - Math.exp(-lambda * delta);
  current.x += (target.x - current.x) * alpha;
  current.y += (target.y - current.y) * alpha;
  current.z += (target.z - current.z) * alpha;
  return current;
}

function celebrationPeak(amplitudePx: number): number {
  if (amplitudePx >= 16) return 1;
  if (amplitudePx >= 12) return 0.9;
  return 0.7;
}

export function resolveAvatarPose(
  animation: AvatarAnimationSpec,
  elapsedMs: number,
): { offsetY: number; scaleY: number; lanternIntensity: number } {
  if (animation.state.endsWith("-static") || animation.durationMs === 0) {
    return { offsetY: 0, scaleY: 1, lanternIntensity: 1 };
  }

  const phase = ((elapsedMs % animation.durationMs) / animation.durationMs) * Math.PI * 2;
  if (animation.state === "idle") {
    const wave = Math.sin(phase);
    return { offsetY: wave * 0.12, scaleY: 1, lanternIntensity: 1 + wave * 0.2 };
  }
  if (animation.state === "celebrate") {
    const progress = Math.min(1, elapsedMs / animation.durationMs);
    const scaleY = progress <= 0.5 ? 0.92 + progress * 0.32 : 1.16 - progress * 0.16;
    return {
      offsetY: Math.sin(Math.PI * progress) * celebrationPeak(animation.amplitudePx),
      scaleY,
      lanternIntensity: 1 + Math.sin(Math.PI * progress) * 0.6,
    };
  }
  if (animation.state === "think") {
    const wave = Math.sin(phase);
    return { offsetY: wave * 0.04, scaleY: 1, lanternIntensity: 1.05 + wave * 0.12 };
  }
  const stride = Math.sin(phase) * (animation.state === "run" ? 0.09 : 0.06);
  return { offsetY: Math.abs(stride), scaleY: 1 - Math.abs(stride) * 0.3, lanternIntensity: 1.05 };
}

export function resolveAvatarTarget(
  view: InitialArenaView,
  targetNodeId?: string,
): { x: number; y: number; z: number } {
  const target =
    view.presentation.worldTransform.nodes.find(({ nodeId }) => nodeId === targetNodeId) ??
    view.presentation.worldTransform.nodes[0];
  if (!target) throw new Error("Arena world has no avatar target");
  return { x: target.x, y: target.y, z: target.z };
}

function dampAngle(current: number, target: number, lambda: number, delta: number): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * (1 - Math.exp(-lambda * delta));
}

export interface AvatarProps {
  view: InitialArenaView;
  targetNodeId?: string;
  avatarRef?: MutableRefObject<Group | null>;
  staticMotion?: boolean;
}

interface AvatarCosmeticProps {
  entry: AvatarCosmeticPlanEntry;
  palette: InitialArenaView["presentation"]["palette"];
}

function AvatarCosmetic({ entry, palette }: AvatarCosmeticProps) {
  const group = useRef<Group>(null);
  const material = useRef<MeshStandardMaterial>(null);
  const elapsedMs = useRef(0);

  useFrame((_, delta) => {
    const cosmeticGroup = group.current;
    const cosmeticMaterial = material.current;
    if (!cosmeticGroup || !cosmeticMaterial) return;

    elapsedMs.current += delta * 1_000;
    const progress = entry.durationMs === 0 ? 1 : Math.min(1, elapsedMs.current / entry.durationMs);
    const eased = 1 - (1 - progress) ** 3;
    cosmeticMaterial.opacity = eased;
    cosmeticGroup.scale.setScalar(entry.durationMs === 0 ? 1 : 0.94 + eased * 0.06);
  });

  if (entry.slot === "hat") {
    return (
      <group ref={group} name="cosmetic-hat" position={[0, 0.92, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.48, 0.42, 7]} />
          <meshStandardMaterial
            ref={material}
            color="#C9A875"
            flatShading
            opacity={entry.durationMs === 0 ? 1 : 0}
            roughness={0.92}
            transparent
          />
        </mesh>
      </group>
    );
  }

  if (entry.slot === "cape") {
    return (
      <group ref={group} name="cosmetic-cape" position={[0, 0.08, -0.45]} rotation={[-0.12, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.62, 0.9, 0.08]} />
          <meshStandardMaterial
            ref={material}
            color="#496D78"
            emissive="#5B3C73"
            emissiveIntensity={0.16}
            flatShading
            opacity={entry.durationMs === 0 ? 1 : 0}
            roughness={0.72}
            transparent
          />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={group} name="cosmetic-badge" position={[0.36, 0.24, 0.5]}>
      <mesh castShadow>
        <octahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial
          ref={material}
          color={palette.gold}
          emissive={palette.gold}
          emissiveIntensity={0.32}
          flatShading
          opacity={entry.durationMs === 0 ? 1 : 0}
          roughness={0.55}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

export default function Avatar({
  view,
  targetNodeId,
  avatarRef,
  staticMotion = false,
}: AvatarProps) {
  const target = useMemo(() => resolveAvatarTarget(view, targetNodeId), [targetNodeId, view]);
  const livePosition = useRef(new Vector3(target.x, target.y + 0.55, target.z));
  const destination = useMemo(() => new Vector3(), []);
  const internalAvatarRef = useRef<Group>(null);
  const avatar = avatarRef ?? internalAvatarRef;
  const body = useRef<Group>(null);
  const lantern = useRef<MeshStandardMaterial>(null);
  const animationElapsedMs = useRef(0);
  const animation = view.presentation.avatarAnim;
  const animationKey = `${animation.state}:${animation.durationMs}:${animation.amplitudePx}`;
  const previousAnimationKey = useRef(animationKey);
  const motionReduced = view.flags.reducedMotion || staticMotion;
  const cosmetics = useMemo(
    () => buildAvatarCosmeticPlan(view, staticMotion),
    [staticMotion, view],
  );

  useFrame((_, delta) => {
    const avatarGroup = avatar.current;
    if (!avatarGroup) return;

    destination.set(target.x, target.y + 0.55, target.z);
    const deltaX = destination.x - livePosition.current.x;
    const deltaZ = destination.z - livePosition.current.z;
    const moving = Math.hypot(deltaX, deltaZ) > 0.001;

    if (motionReduced) {
      livePosition.current.copy(destination);
    } else {
      const moveLambda = animation.state === "run" ? LAMBDAS.avatarMove * 1.35 : LAMBDAS.avatarMove;
      damp3(livePosition.current, destination, moveLambda, delta);
      if (moving) {
        avatarGroup.rotation.y = dampAngle(
          avatarGroup.rotation.y,
          Math.atan2(deltaX, deltaZ),
          LAMBDAS.avatarTurn,
          delta,
        );
      }
    }

    if (previousAnimationKey.current !== animationKey) {
      previousAnimationKey.current = animationKey;
      animationElapsedMs.current = 0;
    } else {
      animationElapsedMs.current += delta * 1_000;
    }
    const pose = motionReduced
      ? { offsetY: 0, scaleY: 1, lanternIntensity: 1 }
      : resolveAvatarPose(animation, animationElapsedMs.current);
    avatarGroup.position.set(
      livePosition.current.x,
      livePosition.current.y + pose.offsetY,
      livePosition.current.z,
    );
    if (body.current) {
      body.current.scale.set(1, pose.scaleY, 1);
      body.current.rotation.x = animation.state === "run" && !motionReduced ? -0.12 : 0;
    }
    if (lantern.current) lantern.current.emissiveIntensity = pose.lanternIntensity;
  });

  return (
    <group
      ref={avatar}
      name="pseudonymous-lantern-avatar"
      position={[target.x, target.y + 0.55, target.z]}
    >
      <group ref={body}>
        <mesh castShadow name="spark-body">
          <icosahedronGeometry args={[0.58, 1]} />
          <meshStandardMaterial
            color={view.presentation.palette.sunHi}
            flatShading
            roughness={0.76}
          />
        </mesh>
        <mesh castShadow name="spark-hood" position={[0, 0.58, 0]}>
          <coneGeometry args={[0.42, 0.58, 7]} />
          <meshStandardMaterial
            color={view.presentation.palette.seaMid}
            flatShading
            roughness={0.82}
          />
        </mesh>
        <mesh castShadow name="lantern" position={[0.58, -0.05, 0.18]}>
          <octahedronGeometry args={[0.24, 0]} />
          <meshStandardMaterial
            ref={lantern}
            color={view.presentation.palette.gold}
            emissive={view.presentation.palette.gold}
            emissiveIntensity={1}
            flatShading
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, -0.48, 0.18]}>
          <cylinderGeometry args={[0.38, 0.44, 0.22, 7]} />
          <meshStandardMaterial color={view.presentation.palette.ink} flatShading roughness={0.9} />
        </mesh>
        {cosmetics.map((entry) => (
          <AvatarCosmetic entry={entry} key={entry.id} palette={view.presentation.palette} />
        ))}
      </group>
    </group>
  );
}
