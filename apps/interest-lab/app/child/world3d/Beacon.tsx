"use client";

import { PALETTE, type Scene3DView } from "@gt100k/interest-lab-view";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  AdditiveBlending,
  MathUtils,
  type MeshStandardMaterial,
  type SpriteMaterial,
  type Texture,
} from "three";
import { resolveBeaconRender } from "./beacon";

export interface BeaconProps {
  scene3d: Scene3DView;
  haloTexture: Texture;
  pickedCount: number;
}

/**
 * The "my quests" beacon — a warm landmark near the viewer that every picked orb hops toward.
 * It brightens as quests collect at it, so a tap lands somewhere that visibly grows (P0.4 payoff).
 */
export function Beacon({ scene3d, haloTexture, pickedCount }: BeaconProps) {
  const render = resolveBeaconRender(pickedCount);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const haloRef = useRef<SpriteMaterial>(null);

  useFrame((_state, delta) => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = MathUtils.damp(
        materialRef.current.emissiveIntensity,
        render.emissiveIntensity,
        8,
        delta,
      );
    }
    if (haloRef.current) {
      haloRef.current.opacity = MathUtils.damp(
        haloRef.current.opacity,
        render.haloOpacity,
        8,
        delta,
      );
    }
  });

  return (
    <group position={render.position}>
      <mesh castShadow>
        <coneGeometry args={[0.42, 1.15, 6]} />
        <meshStandardMaterial
          ref={materialRef}
          color={PALETTE.beacon}
          emissive={PALETTE.beacon}
          emissiveIntensity={render.emissiveIntensity}
          metalness={0.12}
          roughness={0.28}
        />
      </mesh>
      <sprite
        position={[0, 0.2, 0]}
        scale={[render.haloScale, render.haloScale, 1]}
        renderOrder={1}
      >
        <spriteMaterial
          ref={haloRef}
          map={haloTexture}
          color={PALETTE.beacon}
          blending={AdditiveBlending}
          depthWrite={false}
          opacity={render.haloOpacity}
          transparent
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}
