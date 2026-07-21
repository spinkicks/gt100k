"use client";

import {
  EASINGS,
  MOTION,
  PALETTE,
  type QuestMarkerView,
  type Scene3DView,
  type Vector3,
} from "@gt100k/interest-lab-view";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import {
  AdditiveBlending,
  type Group,
  MathUtils,
  type MeshStandardMaterial,
  type SpriteMaterial,
  type Texture,
} from "three";

const HOVER_RAISE = 0.18;
const REST_HALO_OPACITY = 0.36;
const ACTIVE_HALO_OPACITY = 0.62;
const PICK_HOP_HEIGHT = 0.5;
const SPRING_SETTLE_EXPONENT = 4;

export interface QuestMarkerInteraction {
  hovered?: boolean;
  focused?: boolean;
  pressed?: boolean;
  picked?: boolean;
  hopOffset?: number;
}

export interface QuestMarkerVisual {
  position: Vector3;
  scale: number;
  color: string;
  emissiveIntensity: number;
  haloOpacity: number;
  spring: {
    durationMs: number;
    type: "spring";
    bounce: number;
    duration: number;
    hopHeight: number;
  };
}

export function canHoverQuestMarker(pointerType: string): boolean {
  return pointerType !== "touch";
}

export function resolveQuestMarkerVisual(
  marker: Readonly<QuestMarkerView>,
  scene3d: Readonly<Scene3DView>,
  interaction: Readonly<QuestMarkerInteraction>,
): QuestMarkerVisual {
  const active =
    interaction.hovered === true || interaction.focused === true || interaction.picked === true;

  return {
    position: [
      marker.position[0],
      marker.position[1] + (interaction.hovered ? HOVER_RAISE : 0) + (interaction.hopOffset ?? 0),
      marker.position[2],
    ],
    scale: interaction.pressed ? 0.97 : 1,
    color: marker.tone === "prompted" ? PALETTE.prompted : scene3d.markerEmissiveHex,
    emissiveIntensity: active ? scene3d.markerEmissivePulse : scene3d.markerEmissiveRest,
    haloOpacity: active ? ACTIVE_HALO_OPACITY : REST_HALO_OPACITY,
    spring: {
      durationMs: MOTION.pick,
      type: EASINGS.pickSpring.type,
      bounce: EASINGS.pickSpring.bounce,
      duration: EASINGS.pickSpring.duration,
      hopHeight: PICK_HOP_HEIGHT,
    },
  };
}

export interface PickHopSpring {
  readonly value: number;
  readonly velocity: number;
  trigger: () => void;
  step: (deltaSeconds: number) => number;
}

export function createPickHopSpring(): PickHopSpring {
  const durationSeconds = EASINGS.pickSpring.duration;
  const dampingRatio = 1 - EASINGS.pickSpring.bounce;
  const angularFrequency = SPRING_SETTLE_EXPONENT / (dampingRatio * durationSeconds);
  const dampedFrequency = angularFrequency * Math.sqrt(1 - dampingRatio ** 2);
  const peakTime = Math.atan(dampedFrequency / (dampingRatio * angularFrequency)) / dampedFrequency;
  const unitPeak =
    (Math.exp(-dampingRatio * angularFrequency * peakTime) * Math.sin(dampedFrequency * peakTime)) /
    dampedFrequency;
  const impulse = PICK_HOP_HEIGHT / unitPeak;
  const stiffness = angularFrequency ** 2;
  const damping = 2 * dampingRatio * angularFrequency;
  let value = 0;
  let velocity = 0;

  return {
    get value() {
      return value;
    },
    get velocity() {
      return velocity;
    },
    trigger() {
      velocity += impulse;
    },
    step(deltaSeconds) {
      let remaining = Math.max(0, Math.min(deltaSeconds, 0.1));
      const maxStep = 1 / 120;

      while (remaining > 0) {
        const step = Math.min(remaining, maxStep);
        velocity += (-stiffness * value - damping * velocity) * step;
        value += velocity * step;
        remaining -= step;
      }

      if (Math.abs(value) < 0.0001 && Math.abs(velocity) < 0.0001) {
        value = 0;
        velocity = 0;
      }
      return value;
    },
  };
}

export interface QuestMarkerProps {
  marker: QuestMarkerView;
  scene3d: Scene3DView;
  haloTexture: Texture;
  origin?: Vector3;
  focused?: boolean;
  picked?: boolean;
  onPick?: (probeId: string) => void;
}

const WORLD_ORIGIN: Vector3 = [0, 0, 0];

export function QuestMarker({
  marker,
  scene3d,
  haloTexture,
  origin = WORLD_ORIGIN,
  focused = false,
  picked = false,
  onPick,
}: QuestMarkerProps) {
  const groupRef = useRef<Group>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const haloMaterialRef = useRef<SpriteMaterial>(null);
  const hopSpringRef = useRef<PickHopSpring>();
  if (!hopSpringRef.current) hopSpringRef.current = createPickHopSpring();
  const previousPickedRef = useRef(picked);
  const [interaction, setInteraction] = useState({ hovered: false, pressed: false });
  const baseMarker = {
    ...marker,
    position: [
      marker.position[0] - origin[0],
      marker.position[1] - origin[1],
      marker.position[2] - origin[2],
    ] as Vector3,
  };

  useEffect(() => {
    if (picked && !previousPickedRef.current) hopSpringRef.current?.trigger();
    previousPickedRef.current = picked;
  }, [picked]);

  useFrame((_state, delta) => {
    const hopOffset = hopSpringRef.current?.step(delta) ?? 0;
    const active = interaction.hovered || focused || picked;
    const targetScale = interaction.pressed ? 0.97 : 1;
    const targetEmissive = active ? scene3d.markerEmissivePulse : scene3d.markerEmissiveRest;
    const targetHaloOpacity = active ? ACTIVE_HALO_OPACITY : REST_HALO_OPACITY;
    const group = groupRef.current;
    if (group) {
      group.position.set(
        baseMarker.position[0],
        baseMarker.position[1] + (interaction.hovered ? HOVER_RAISE : 0) + hopOffset,
        baseMarker.position[2],
      );
      const scale = MathUtils.damp(group.scale.x, targetScale, 28, delta);
      group.scale.setScalar(scale);
    }
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = MathUtils.damp(
        materialRef.current.emissiveIntensity,
        targetEmissive,
        12,
        delta,
      );
    }
    if (haloMaterialRef.current) {
      haloMaterialRef.current.opacity = MathUtils.damp(
        haloMaterialRef.current.opacity,
        targetHaloOpacity,
        12,
        delta,
      );
    }
  });

  const visual = resolveQuestMarkerVisual(baseMarker, scene3d, {
    ...interaction,
    focused,
    picked,
  });
  const stop = (event: ThreeEvent<MouseEvent | PointerEvent>) => event.stopPropagation();

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: The aria-hidden canvas mirrors the keyboard-operable DOM ledger.
    <group
      ref={groupRef}
      position={visual.position}
      scale={visual.scale}
      onPointerOver={(event) => {
        stop(event);
        if (canHoverQuestMarker(event.pointerType)) {
          setInteraction((current) => ({ ...current, hovered: true }));
        }
      }}
      onPointerOut={(event) => {
        stop(event);
        setInteraction({ hovered: false, pressed: false });
      }}
      onPointerDown={(event) => {
        stop(event);
        groupRef.current?.scale.setScalar(0.97);
        setInteraction((current) => ({ ...current, pressed: true }));
      }}
      onPointerUp={(event) => {
        stop(event);
        setInteraction((current) => ({ ...current, pressed: false }));
      }}
      onClick={(event) => {
        stop(event);
        onPick?.(marker.probeId);
      }}
    >
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[0.28, 1]} />
        <meshStandardMaterial
          ref={materialRef}
          color={visual.color}
          emissive={scene3d.markerEmissiveHex}
          emissiveIntensity={visual.emissiveIntensity}
          metalness={0.08}
          roughness={0.32}
        />
      </mesh>
      <sprite scale={[1.1, 1.1, 1]} renderOrder={1}>
        <spriteMaterial
          ref={haloMaterialRef}
          map={haloTexture}
          color={visual.color}
          blending={AdditiveBlending}
          depthWrite={false}
          opacity={visual.haloOpacity}
          transparent
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}
