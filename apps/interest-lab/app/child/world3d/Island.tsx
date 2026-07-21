"use client";

import {
  type IslandView,
  MOTION,
  type QualityTier,
  type Scene3DView,
  type Vector3,
} from "@gt100k/interest-lab-view";
import { Float } from "@react-three/drei";
import type { Texture } from "three";
import { IslandLift } from "./IslandLift";
import { IslandMotif } from "./IslandMotif";
import { QuestMarker } from "./QuestMarker";
import { BEACON_TARGET } from "./beacon";
import { resolveDomainMotif } from "./motif";

const FULL_SEGMENTS = 10;
const LITE_SEGMENTS = 6;
const EMPTY_PICKED_PROBES: ReadonlySet<string> = new Set();
const renderDimension = (value: number) => Math.round(value * 1000) / 1000;

export interface IslandRender {
  position: Vector3;
  hue: string;
  shadows: boolean;
  float: {
    durationMs: number;
    speed: number;
    rotationIntensity: number;
    floatIntensity: number;
    floatingRange: [number, number];
  };
  geometry: {
    cap: {
      position: Vector3;
      args: [number, number, number, number, number, boolean];
    };
    underside: {
      position: Vector3;
      rotation: Vector3;
      args: [number, number, number];
    };
    rim: {
      position: Vector3;
      rotation: Vector3;
      args: [number, number, number, number];
    };
  };
}

export function resolveIslandRender(
  island: Readonly<IslandView>,
  quality: Readonly<QualityTier>,
): IslandRender | null {
  if (quality.islandDetail === "none") return null;

  const segments = quality.islandDetail === "high" ? FULL_SEGMENTS : LITE_SEGMENTS;
  const capRadius = renderDimension(island.baseRadius * 0.82);
  const undersideRadius = renderDimension(island.baseRadius * 0.92);

  return {
    position: [...island.center],
    hue: island.hue,
    shadows: quality.shadows,
    float: {
      durationMs: MOTION.islandFloat,
      speed: (8 * Math.PI) / (MOTION.islandFloat / 1000),
      rotationIntensity: 0.18,
      floatIntensity: 1,
      floatingRange: [-0.12, 0.12],
    },
    geometry: {
      cap: {
        position: [0, 0, 0],
        args: [capRadius, island.baseRadius, 0.55, segments, 1, false],
      },
      underside: {
        position: [0, -1.05, 0],
        rotation: [Math.PI, 0, 0],
        args: [undersideRadius, 1.6, segments],
      },
      rim: {
        position: [0, 0.3, 0],
        rotation: [Math.PI / 2, 0, 0],
        args: [capRadius, 0.07, 4, segments],
      },
    },
  };
}

export interface IslandProps {
  island: IslandView;
  quality: QualityTier;
  scene3d: Scene3DView;
  haloTexture: Texture;
  pickedProbeIds?: ReadonlySet<string>;
  focusedProbeId?: string | null;
  beaconTarget?: Vector3;
  onPick?: (probeId: string) => void;
}

export function Island({
  island,
  quality,
  scene3d,
  haloTexture,
  pickedProbeIds = EMPTY_PICKED_PROBES,
  focusedProbeId = null,
  beaconTarget = BEACON_TARGET,
  onPick,
}: IslandProps) {
  const render = resolveIslandRender(island, quality);
  if (!render) return null;

  // The island rises when the child visits any of its orbs — arrival reads spatially.
  const focused =
    focusedProbeId !== null && island.markers.some((marker) => marker.probeId === focusedProbeId);

  return (
    <Float
      speed={render.float.speed}
      rotationIntensity={render.float.rotationIntensity}
      floatIntensity={render.float.floatIntensity}
      floatingRange={render.float.floatingRange}
    >
      <group position={render.position}>
        <IslandLift focused={focused}>
          <mesh
            castShadow={render.shadows}
            receiveShadow={render.shadows}
            position={render.geometry.cap.position}
          >
            <cylinderGeometry args={render.geometry.cap.args} />
            <meshStandardMaterial
              color={render.hue}
              flatShading
              metalness={0.04}
              roughness={0.72}
            />
          </mesh>
          <mesh
            castShadow={render.shadows}
            receiveShadow={render.shadows}
            position={render.geometry.underside.position}
            rotation={render.geometry.underside.rotation}
          >
            <coneGeometry args={render.geometry.underside.args} />
            <meshStandardMaterial color={render.hue} flatShading metalness={0} roughness={0.96} />
          </mesh>
          <mesh position={render.geometry.rim.position} rotation={render.geometry.rim.rotation}>
            <torusGeometry args={render.geometry.rim.args} />
            <meshStandardMaterial
              color={scene3d.keyHex}
              emissive={scene3d.keyHex}
              emissiveIntensity={0.15}
              metalness={0.08}
              roughness={0.45}
            />
          </mesh>
          <IslandMotif
            motif={resolveDomainMotif(island.domain)}
            hue={render.hue}
            scene3d={scene3d}
            shadows={render.shadows}
          />
          {island.markers.map((marker) => (
            <QuestMarker
              key={marker.probeId}
              marker={marker}
              scene3d={scene3d}
              haloTexture={haloTexture}
              origin={island.center}
              beaconTarget={beaconTarget}
              focused={focusedProbeId === marker.probeId}
              picked={pickedProbeIds.has(marker.probeId)}
              onPick={onPick}
            />
          ))}
        </IslandLift>
      </group>
    </Float>
  );
}
