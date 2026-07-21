"use client";
/**
 * Seeded parallax starfield (§U8.13 `STARFIELD`) — three.js `Points` whose positions come from a
 * deterministic mulberry32 seeded off `NEXT_PUBLIC_EXPLORER_SEED` (default 42), so the field is
 * byte-reproducible and contains no `Math.random` (FR-E19). It drifts very slowly behind the graph in
 * the cinematic tier and is perfectly static under `standard3d` / reduced motion (the caller passes
 * `animate`). The whole `<Canvas>` is `aria-hidden`, so the field is purely decorative.
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { JSX } from "react";
import * as THREE from "three";
import { COSMOS } from "./palette.js";
import { STARFIELD, generateStarfield, readSeed } from "./starfield-rng.js";

export function Starfield({ animate }: { animate: boolean }): JSX.Element {
  const ref = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const seed = readSeed(process.env.NEXT_PUBLIC_EXPLORER_SEED);
    const positions = generateStarfield(STARFIELD.count, STARFIELD.radius, seed);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!animate || !ref.current) return;
    // Slow parallax drift (§U8.9 PARALLAX.starfield ≈ 0.15) — barely-perceptible, calming.
    ref.current.rotation.y += delta * 0.006;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        color={COSMOS.inkMuted}
        size={0.7}
        sizeAttenuation
        transparent
        opacity={0.75}
        depthWrite={false}
      />
    </points>
  );
}
