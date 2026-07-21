"use client";

import type { Scene3DView } from "@gt100k/interest-lab-view";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, MeshStandardMaterial } from "three";
import { type DomainMotif, type MotifGeometry, type MotifProp, resolveMotifFocus } from "./motif";

// Where the motif anchor sits above the island cap — inside the ring of floating quest orbs.
const MOTIF_ANCHOR_Y = 0.34;
// How fast the motif eases toward its focus target (per-second damping rate). Snappy but not instant.
const FOCUS_DAMP_RATE = 6;

/** Frame-rate-independent damp toward `target` (exponential-ish; delta clamped by the caller). */
function damp(current: number, target: number, rate: number, delta: number) {
  return current + (target - current) * Math.min(1, rate * delta);
}

function MotifGeometryMesh({ geometry }: { geometry: MotifGeometry }) {
  switch (geometry.kind) {
    case "box":
      return <boxGeometry args={geometry.args} />;
    case "cone":
      return <coneGeometry args={geometry.args} />;
    case "cylinder":
      return <cylinderGeometry args={geometry.args} />;
    case "octahedron":
      return <octahedronGeometry args={geometry.args} />;
    case "torus":
      return <torusGeometry args={geometry.args} />;
    case "icosahedron":
      return <icosahedronGeometry args={geometry.args} />;
    case "sphere":
      return <sphereGeometry args={geometry.args} />;
  }
}

export interface IslandMotifProps {
  motif: DomainMotif;
  hue: string;
  scene3d: Scene3DView;
  shadows?: boolean;
  /** True while the child is visiting one of this island's orbs — the motif wakes up (P1.6). */
  focused?: boolean;
}

/**
 * Renders a domain's accent motif — a small emissive silhouette atop the island cap that makes the
 * world read as eight distinct places, not one primitive in eight hues (P1.5). Its own component so
 * the idle-spin `useFrame` lives in a real R3F render and `Island` stays a hook-free function the
 * `world-objects` / `domain-motif` unit tests call directly (see the IslandLift lesson, D-VP20).
 */
export function IslandMotif({
  motif,
  hue,
  scene3d,
  shadows = false,
  focused = false,
}: IslandMotifProps) {
  const anchorRef = useRef<Group>(null);
  const spinRef = useRef<Group>(null);
  const materialsRef = useRef<MeshStandardMaterial[]>([]);
  // Live eased values — start at the idle base so the first paint is calm, not mid-transition.
  const eased = useRef({ emissive: motif.emissiveIntensity, lift: 0, spin: motif.spinSpeed });

  useFrame((_state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const target = resolveMotifFocus(motif, focused);
    const state = eased.current;

    state.emissive = damp(state.emissive, target.emissiveIntensity, FOCUS_DAMP_RATE, delta);
    state.lift = damp(state.lift, target.lift, FOCUS_DAMP_RATE, delta);
    state.spin = damp(state.spin, target.spinSpeed, FOCUS_DAMP_RATE, delta);

    if (anchorRef.current) anchorRef.current.position.y = MOTIF_ANCHOR_Y + state.lift;
    if (spinRef.current) spinRef.current.rotation.y += state.spin * delta;
    for (const material of materialsRef.current) material.emissiveIntensity = state.emissive;
  });

  return (
    <group ref={anchorRef} position={[0, MOTIF_ANCHOR_Y, 0]}>
      <group ref={spinRef}>
        {motif.props.map((prop: MotifProp, index) => (
          <mesh
            // biome-ignore lint/suspicious/noArrayIndexKey: motif props are a fixed, ordered descriptor.
            key={index}
            position={prop.position}
            rotation={prop.rotation}
            scale={prop.scale}
            castShadow={shadows}
            receiveShadow={shadows}
          >
            <MotifGeometryMesh geometry={prop.geometry} />
            <meshStandardMaterial
              ref={(material) => {
                if (material) materialsRef.current[index] = material;
              }}
              color={hue}
              emissive={scene3d.markerEmissiveHex}
              emissiveIntensity={motif.emissiveIntensity}
              flatShading
              metalness={0.12}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
