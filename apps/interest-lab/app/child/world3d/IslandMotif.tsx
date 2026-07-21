"use client";

import type { Scene3DView } from "@gt100k/interest-lab-view";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { DomainMotif, MotifGeometry, MotifProp } from "./motif";

// Where the motif anchor sits above the island cap — inside the ring of floating quest orbs.
const MOTIF_ANCHOR_Y = 0.34;

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
}

/**
 * Renders a domain's accent motif — a small emissive silhouette atop the island cap that makes the
 * world read as eight distinct places, not one primitive in eight hues (P1.5). Its own component so
 * the idle-spin `useFrame` lives in a real R3F render and `Island` stays a hook-free function the
 * `world-objects` / `domain-motif` unit tests call directly (see the IslandLift lesson, D-VP20).
 */
export function IslandMotif({ motif, hue, scene3d, shadows = false }: IslandMotifProps) {
  const spinRef = useRef<Group>(null);

  useFrame((_state, delta) => {
    const group = spinRef.current;
    if (group) group.rotation.y += motif.spinSpeed * Math.min(delta, 0.1);
  });

  return (
    <group position={[0, MOTIF_ANCHOR_Y, 0]}>
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
