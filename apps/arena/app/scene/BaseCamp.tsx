"use client";

import { type InitialArenaView, WORLD_SCALE, resolveMotion } from "@gt100k/arena-world";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";

const BASE_ELEVATION = 0.8;
const BASE_GRID_CENTER = 1_024;
const BASE_ACCRETION = resolveMotion("baseAccretion", { reducedMotion: false });

export const BASE_CAMP_TARGET = [
  BASE_GRID_CENTER * WORLD_SCALE,
  BASE_ELEVATION,
  BASE_GRID_CENTER * WORLD_SCALE,
] as const;

interface BaseFeaturePlan {
  feature: string;
  zone: string;
  by: string;
  missionId: string;
  position: { x: number; y: number; z: number };
}

export interface BaseCampRenderPlan {
  island: { position: { x: number; y: number; z: number } };
  features: BaseFeaturePlan[];
  dynamicCampfireLight: boolean;
}

function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

export function buildBaseCampRenderPlan(
  view: InitialArenaView,
  dynamicCampfireLight?: boolean,
): BaseCampRenderPlan {
  const features = view.presentation.basePlacements.map((placement) => {
    const contribution = required(
      view.base.contributions.find(({ feature }) => feature === placement.feature),
      `Missing Base Camp contribution: ${placement.feature}`,
    );

    return {
      feature: placement.feature,
      zone: placement.zone,
      by: placement.by,
      missionId: contribution.missionId,
      position: {
        x: placement.x * WORLD_SCALE,
        y: BASE_ELEVATION,
        z: placement.y * WORLD_SCALE,
      },
    };
  });
  const activeNodeLights = view.nodeStates.filter(({ state }) => state !== "locked").length;
  const lightCap = view.presentation.qualityBudget.maxDynamicLights;

  return {
    island: {
      position: { x: BASE_CAMP_TARGET[0], y: BASE_CAMP_TARGET[1], z: BASE_CAMP_TARGET[2] },
    },
    features,
    dynamicCampfireLight:
      dynamicCampfireLight ??
      (features.some(({ feature }) => feature === "campfire") && activeNodeLights < lightCap),
  };
}

export function resolveBaseAccretionScale(elapsedMs: number, reducedMotion: boolean): number {
  if (reducedMotion) return 1;
  const progress = Math.min(1, Math.max(0, elapsedMs / BASE_ACCRETION.durationMs));
  if (progress === 1) return 1;
  const shifted = progress - 1;
  const backOut = 1 + 2.70158 * shifted ** 3 + 1.70158 * shifted ** 2;
  return 0.9 + backOut * 0.1;
}

function FeatureGeometry({ feature, lit }: { feature: string; lit: boolean }) {
  switch (feature) {
    case "campfire":
      return (
        <group name="base-prop:campfire">
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 1.1, 6]} />
            <meshStandardMaterial color="#8A6B4F" roughness={0.9} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 1.1, 6]} />
            <meshStandardMaterial color="#8A6B4F" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <coneGeometry args={[0.38, 0.9, 7]} />
            <meshStandardMaterial color="#F6A23A" emissive="#E8623B" emissiveIntensity={1.2} />
          </mesh>
          {lit ? (
            <pointLight
              color="#F2C14E"
              decay={2}
              distance={5}
              intensity={0.55}
              position={[0, 1, 0]}
            />
          ) : null}
        </group>
      );
    case "banner":
      return (
        <group name="base-prop:banner">
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[0.1, 1.8, 0.1]} />
            <meshStandardMaterial color="#8A6B4F" />
          </mesh>
          <mesh position={[0.5, 1.4, 0]}>
            <boxGeometry args={[1, 0.65, 0.06]} />
            <meshStandardMaterial color="#7FB6D6" roughness={0.8} />
          </mesh>
        </group>
      );
    case "garden":
      return (
        <group name="base-prop:garden">
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[1.5, 0.36, 1.1]} />
            <meshStandardMaterial color="#8A6B4F" roughness={0.95} />
          </mesh>
          {[-0.45, 0, 0.45].map((x) => (
            <mesh key={x} position={[x, 0.65, 0]}>
              <coneGeometry args={[0.22, 0.75, 6]} />
              <meshStandardMaterial color="#6E8E5A" roughness={0.9} />
            </mesh>
          ))}
        </group>
      );
    case "dock":
      return (
        <group name="base-prop:dock">
          {[-0.45, 0, 0.45].map((x) => (
            <mesh key={x} position={[x, 0.18, 0]}>
              <boxGeometry args={[0.34, 0.22, 1.8]} />
              <meshStandardMaterial color="#8A6B4F" roughness={0.92} />
            </mesh>
          ))}
          <mesh position={[0, -0.25, 0.6]}>
            <boxGeometry args={[1.35, 0.7, 0.18]} />
            <meshStandardMaterial color="#5A6B78" roughness={0.9} />
          </mesh>
        </group>
      );
    case "workshop":
      return (
        <group name="base-prop:workshop">
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[1.7, 0.25, 0.8]} />
            <meshStandardMaterial color="#8A6B4F" roughness={0.88} />
          </mesh>
          <mesh position={[0.38, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.34, 0.11, 6, 12]} />
            <meshStandardMaterial color="#F2C14E" metalness={0.25} roughness={0.62} />
          </mesh>
        </group>
      );
    case "lookout":
      return (
        <group name="base-prop:lookout">
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.85, 1, 0.7, 8]} />
            <meshStandardMaterial color="#C9B27E" flatShading roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.15, 0]} rotation={[0, 0, -0.35]}>
            <cylinderGeometry args={[0.13, 0.18, 1.3, 7]} />
            <meshStandardMaterial color="#14384C" metalness={0.2} roughness={0.55} />
          </mesh>
        </group>
      );
    default:
      return (
        <mesh name={`base-prop:${feature}`} position={[0, 0.35, 0]}>
          <dodecahedronGeometry args={[0.65, 0]} />
          <meshStandardMaterial color="#C9B27E" flatShading roughness={0.9} />
        </mesh>
      );
  }
}

function BaseFeature({
  feature,
  focused,
  lit,
  reducedMotion,
  onFocus,
}: {
  feature: BaseFeaturePlan;
  focused: boolean;
  lit: boolean;
  reducedMotion: boolean;
  onFocus(): void;
}) {
  const group = useRef<Group>(null);
  const elapsedMs = useRef(0);

  useFrame((_, delta) => {
    if (elapsedMs.current >= BASE_ACCRETION.durationMs || reducedMotion) return;
    elapsedMs.current = Math.min(BASE_ACCRETION.durationMs, elapsedMs.current + delta * 1_000);
    group.current?.scale.setScalar(resolveBaseAccretionScale(elapsedMs.current, false));
  });

  return (
    <group
      ref={group}
      name={`base-feature:${feature.feature}:${feature.zone}`}
      onPointerDown={onFocus}
      onPointerOver={onFocus}
      position={[feature.position.x, feature.position.y, feature.position.z]}
      scale={resolveBaseAccretionScale(0, reducedMotion)}
    >
      <FeatureGeometry feature={feature.feature} lit={lit} />
      <group name={`lantern-mark:${feature.by}`} position={[0.85, 0.32, 0.65]}>
        <mesh>
          <cylinderGeometry args={[0.16, 0.2, 0.42, 6]} />
          <meshStandardMaterial color="#F2C14E" emissive="#F6A23A" emissiveIntensity={0.7} />
        </mesh>
      </group>
      {focused ? (
        <Html center distanceFactor={12} position={[0, 2.2, 0]}>
          <span className="arena-base-label">
            {feature.by} · mission {feature.missionId}
          </span>
        </Html>
      ) : null}
    </group>
  );
}

export interface BaseCampProps {
  view: InitialArenaView;
  focusedFeature?: string;
  onFocusFeature?(feature: string): void;
  dynamicCampfireLight?: boolean;
  staticMotion?: boolean;
}

export default function BaseCamp({
  view,
  focusedFeature,
  onFocusFeature,
  dynamicCampfireLight,
  staticMotion = false,
}: BaseCampProps) {
  const plan = useMemo(
    () => buildBaseCampRenderPlan(view, dynamicCampfireLight),
    [dynamicCampfireLight, view],
  );
  const motionReduced = view.flags.reducedMotion || staticMotion;

  return (
    <group name="base-camp">
      <mesh
        castShadow
        position={[plan.island.position.x, plan.island.position.y - 1.1, plan.island.position.z]}
        receiveShadow
      >
        <cylinderGeometry args={[6.2, 7, 2.2, 9]} />
        <meshStandardMaterial color="#C9B27E" flatShading roughness={0.92} />
      </mesh>
      {plan.features.map((feature) => (
        <BaseFeature
          feature={feature}
          focused={focusedFeature === feature.feature}
          key={feature.feature}
          lit={feature.feature === "campfire" && plan.dynamicCampfireLight}
          onFocus={() => onFocusFeature?.(feature.feature)}
          reducedMotion={motionReduced}
        />
      ))}
    </group>
  );
}
