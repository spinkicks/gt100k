"use client";

import {
  EASINGS,
  MOTION,
  PALETTE,
  type Scene3DView,
  type Vector3,
} from "@gt100k/interest-lab-view";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  AdditiveBlending,
  type Group,
  type Sprite,
  type SpriteMaterial,
  type Texture,
} from "three";

export const WELCOME_BLOOM_SPARKS: readonly Vector3[] = [
  [-0.34, 0.02, 0.06],
  [-0.22, 0.18, -0.12],
  [-0.08, 0.08, 0.22],
  [0.05, 0.24, -0.2],
  [0.18, 0.04, 0.18],
  [0.3, 0.16, -0.04],
  [-0.14, 0.3, 0.02],
  [0.16, 0.34, 0.08],
];

export interface WelcomeBloomFrame {
  durationMs: number;
  easing: string;
  emissiveIntensity: number;
  haloOpacity: number;
  haloScale: number;
  sparkOpacity: number;
  sparkRise: number;
}

const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;

export function resolveWelcomeBloomFrame(
  elapsedMs: number,
  scene3d: Readonly<Scene3DView>,
  reducedMotion: boolean,
): WelcomeBloomFrame {
  if (reducedMotion) {
    return {
      durationMs: 0,
      easing: "linear",
      emissiveIntensity: scene3d.markerEmissivePulse,
      haloOpacity: 0.52,
      haloScale: 1.15,
      sparkOpacity: 0,
      sparkRise: 0,
    };
  }

  const progress = Math.max(0, Math.min(elapsedMs / MOTION.welcomeBack, 1));
  const pulse =
    progress <= 0.5 ? easeOutCubic(progress * 2) : 1 - easeOutCubic((progress - 0.5) * 2);

  return {
    durationMs: MOTION.welcomeBack,
    easing: EASINGS.pop,
    emissiveIntensity: mix(scene3d.markerEmissivePulse, scene3d.bloomPeak, pulse),
    haloOpacity: mix(0.48, 0.9, pulse),
    haloScale: mix(1.08, 1.45, pulse),
    sparkOpacity: progress === 0 || progress === 1 ? 0 : Math.sin(Math.PI * progress) * 0.72,
    sparkRise: progress * 0.72,
  };
}

export interface WelcomeBloomProps {
  scene3d: Scene3DView;
  haloTexture: Texture;
  reducedMotion?: boolean;
}

export function WelcomeBloom({ scene3d, haloTexture, reducedMotion = false }: WelcomeBloomProps) {
  const elapsedMsRef = useRef(0);
  const haloRef = useRef<Sprite>(null);
  const haloMaterialRef = useRef<SpriteMaterial>(null);
  const sparkGroupRef = useRef<Group>(null);
  const sparkMaterialRefs = useRef<(SpriteMaterial | null)[]>([]);
  const initial = resolveWelcomeBloomFrame(0, scene3d, reducedMotion);

  useFrame((_state, deltaSeconds) => {
    if (reducedMotion || elapsedMsRef.current >= MOTION.welcomeBack) return;

    elapsedMsRef.current = Math.min(
      elapsedMsRef.current + Math.min(deltaSeconds, 0.1) * 1_000,
      MOTION.welcomeBack,
    );
    const frame = resolveWelcomeBloomFrame(elapsedMsRef.current, scene3d, reducedMotion);

    haloRef.current?.scale.set(frame.haloScale, frame.haloScale, 1);
    if (haloMaterialRef.current) haloMaterialRef.current.opacity = frame.haloOpacity;
    if (sparkGroupRef.current) sparkGroupRef.current.position.y = frame.sparkRise;
    for (const material of sparkMaterialRefs.current) {
      if (material) material.opacity = frame.sparkOpacity;
    }
  });

  return (
    <group>
      <sprite ref={haloRef} scale={[initial.haloScale, initial.haloScale, 1]} renderOrder={2}>
        <spriteMaterial
          ref={haloMaterialRef}
          map={haloTexture}
          color={PALETTE.spark}
          blending={AdditiveBlending}
          depthWrite={false}
          opacity={initial.haloOpacity}
          transparent
          toneMapped={false}
        />
      </sprite>
      <group ref={sparkGroupRef}>
        {WELCOME_BLOOM_SPARKS.map((position, index) => (
          <sprite
            key={position.join(",")}
            position={position}
            scale={[0.16, 0.16, 1]}
            renderOrder={3}
          >
            <spriteMaterial
              ref={(material) => {
                sparkMaterialRefs.current[index] = material;
              }}
              map={haloTexture}
              color={PALETTE.sparkHi}
              blending={AdditiveBlending}
              depthWrite={false}
              opacity={initial.sparkOpacity}
              transparent
              toneMapped={false}
            />
          </sprite>
        ))}
      </group>
    </group>
  );
}
