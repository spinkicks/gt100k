"use client";

import type { LightingConfig, QualityBudget } from "@gt100k/arena-world";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { DirectionalLight } from "three";

const LIGHT_DISTANCE = 40;

type Direction = LightingConfig["key"]["dir"];
type LightPosition = readonly [number, number, number];

function positionFromDirection(direction: Direction): LightPosition {
  return [direction.x * LIGHT_DISTANCE, direction.y * LIGHT_DISTANCE, direction.z * LIGHT_DISTANCE];
}

export function resolveSunDriftRadians(
  elapsedMs: number,
  lighting: LightingConfig,
  ambientMotion: boolean,
): number {
  if (!ambientMotion || lighting.sunDriftDeg === 0 || lighting.sunDriftMs <= 0) return 0;

  const phase = ((elapsedMs % lighting.sunDriftMs) / lighting.sunDriftMs) * Math.PI * 2;
  return Math.sin(phase) * ((lighting.sunDriftDeg * Math.PI) / 180);
}

export interface LightingRigProps {
  lighting: LightingConfig;
  qualityBudget: QualityBudget;
}

export function resolveLightingRigPlan(lighting: LightingConfig, qualityBudget: QualityBudget) {
  const shadowsEnabled = qualityBudget.shadows !== "off" && qualityBudget.shadows !== null;
  return {
    ambientMotion: qualityBudget.ambientMotion,
    castShadow: shadowsEnabled && lighting.key.castShadow,
    shadowMapSize:
      qualityBudget.shadows === "soft-pcf-2048"
        ? 2_048
        : qualityBudget.shadows === "pcf-1024"
          ? 1_024
          : null,
    softShadow: qualityBudget.shadows === "soft-pcf-2048",
  };
}

export default function LightingRig({ lighting, qualityBudget }: LightingRigProps) {
  const plan = resolveLightingRigPlan(lighting, qualityBudget);
  const keyLight = useRef<DirectionalLight>(null);
  const keyPosition = positionFromDirection(lighting.key.dir);
  const rimPosition = positionFromDirection(lighting.rim.dir);

  useFrame(({ clock }) => {
    const light = keyLight.current;
    if (!light) return;

    const angle = resolveSunDriftRadians(clock.elapsedTime * 1_000, lighting, plan.ambientMotion);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const [x, y, z] = keyPosition;
    light.position.set(x * cosine + z * sine, y, -x * sine + z * cosine);
  });

  return (
    <>
      <directionalLight
        ref={keyLight}
        castShadow={plan.castShadow}
        color={lighting.key.colorHex}
        intensity={lighting.key.intensity}
        position={keyPosition}
        shadow-bias={lighting.shadow.bias}
        shadow-camera-bottom={-72}
        shadow-camera-far={160}
        shadow-camera-left={-72}
        shadow-camera-near={0.5}
        shadow-camera-right={72}
        shadow-camera-top={72}
        shadow-mapSize-height={lighting.shadow.mapSize}
        shadow-mapSize-width={lighting.shadow.mapSize}
        shadow-radius={plan.softShadow ? 2 : 0}
      />
      <hemisphereLight
        args={[lighting.hemi.skyHex, lighting.hemi.groundHex, lighting.hemi.intensity]}
      />
      <ambientLight color={lighting.ambient.colorHex} intensity={lighting.ambient.intensity} />
      <directionalLight
        color={lighting.rim.colorHex}
        intensity={lighting.rim.intensity}
        position={rimPosition}
      />
    </>
  );
}
