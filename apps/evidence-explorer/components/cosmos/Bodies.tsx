"use client";
/**
 * Procedural node bodies (§U8.12 / §U5.2) — each of the 8 node types is a **distinct** three.js
 * primitive in its own type hue with an emissive core, so meaning never rests on colour alone
 * (body-shape + colour + the always-present text Ledger). All geometry is procedural: **no external
 * fetch, ever** (FR-E19). Human-owned Outcomes wear a gold seal ring; the Assistance comet carries a
 * calm icy tail (the "Declared — cited" semantics live in the neutral Ledger, never as an accusation).
 *
 * Bodies gently float when `animate` is true (cinematic idle life); under reduced motion / standard3d
 * they are perfectly still. Ambient float is decorative and seeded off `birthOrder`, never random.
 */
import type { NodeView } from "@gt100k/evidence-explorer-view";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { JSX } from "react";
import * as THREE from "three";
import { COSMOS, roleHex } from "./palette.js";

/** Build a filled 5-point star `ShapeGeometry`-free extrude (warm-gold Review body). */
function useStarGeometry(): THREE.ExtrudeGeometry {
  return useMemo(() => {
    const shape = new THREE.Shape();
    const spikes = 5;
    const outer = 0.72;
    const inner = 0.3;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
    });
    geo.center();
    return geo;
  }, []);
}

/** Shared emissive material props tuned per role hue. */
function emissive(hex: string, intensity = 1.4) {
  return {
    color: hex,
    emissive: hex,
    emissiveIntensity: intensity,
    roughness: 0.35,
    metalness: 0.1,
  };
}

function BodyMesh({ node, star }: { node: NodeView; star: THREE.ExtrudeGeometry }): JSX.Element {
  const hex = roleHex(node.colorRole);
  const dim = node.isIsland ? 0.4 : 1; // island reads dimmer ("outside this milestone").

  switch (node.body.id) {
    case "world":
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.95, 40, 40]} />
            <meshStandardMaterial {...emissive(hex, 1.1 * dim)} />
          </mesh>
          {/* Faint equatorial ring. */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.35, 0.03, 12, 64]} />
            <meshStandardMaterial {...emissive(hex, 0.9 * dim)} transparent opacity={0.55} />
          </mesh>
        </group>
      );
    case "moon":
      return (
        <mesh>
          <sphereGeometry args={[0.5, 28, 28]} />
          <meshStandardMaterial {...emissive(hex, 1.0 * dim)} />
        </mesh>
      );
    case "blueprint":
      // Wireframe icosahedron — the declared plan/construct.
      return (
        <group>
          <mesh>
            <icosahedronGeometry args={[0.9, 0]} />
            <meshBasicMaterial color={hex} wireframe transparent opacity={0.9 * dim} />
          </mesh>
          <mesh scale={0.4}>
            <icosahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial {...emissive(hex, 1.3 * dim)} />
          </mesh>
        </group>
      );
    case "beacon":
      // Thin luminous obelisk.
      return (
        <mesh>
          <cylinderGeometry args={[0.16, 0.24, 2.2, 6]} />
          <meshStandardMaterial {...emissive(hex, 1.5 * dim)} />
        </mesh>
      );
    case "comet":
      // Icy body + a stretched tail (calm, never a "flare").
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.55, 30, 30]} />
            <meshStandardMaterial {...emissive(hex, 1.4 * dim)} />
          </mesh>
          <mesh position={[-0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.35, 1.8, 20, 1, true]} />
            <meshStandardMaterial {...emissive(hex, 0.8 * dim)} transparent opacity={0.5} />
          </mesh>
        </group>
      );
    case "gold-star":
      // Warm-gold star — human warmth of a Review.
      return (
        <mesh geometry={star}>
          <meshStandardMaterial {...emissive(hex, 1.5 * dim)} />
        </mesh>
      );
    case "crystal":
      // Faceted octahedron.
      return (
        <mesh>
          <octahedronGeometry args={[0.85, 0]} />
          <meshStandardMaterial {...emissive(hex, 1.3 * dim)} flatShading />
        </mesh>
      );
    case "seal-sun":
      // Radiant sphere + a gold seal ring — the human-owned grade reads at the verify moment.
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.9, 40, 40]} />
            <meshStandardMaterial {...emissive(hex, 1.6 * dim)} />
          </mesh>
          {node.isHumanOwned ? (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.3, 0.06, 16, 80]} />
              <meshStandardMaterial {...emissive(COSMOS.human, 1.4 * dim)} />
            </mesh>
          ) : null}
        </group>
      );
    default:
      return (
        <mesh>
          <sphereGeometry args={[0.7, 24, 24]} />
          <meshStandardMaterial {...emissive(hex, 1.0 * dim)} />
        </mesh>
      );
  }
}

function Body({
  node,
  star,
  animate,
}: { node: NodeView; star: THREE.ExtrudeGeometry; animate: boolean }): JSX.Element {
  const ref = useRef<THREE.Group>(null);
  // Deterministic per-node phase so floats are varied but not random.
  const phase = ((node.birthOrder ?? 0) % 12) * 0.5;
  const [bx, by, bz] = node.pos3d;

  useFrame((state) => {
    if (!animate || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = by + Math.sin(t * 0.6 + phase) * 0.12;
    ref.current.rotation.y = t * 0.15 + phase;
  });

  return (
    <group ref={ref} position={[bx, by, bz]}>
      <BodyMesh node={node} star={star} />
    </group>
  );
}

export function Bodies({
  nodes,
  animate,
}: { nodes: readonly NodeView[]; animate: boolean }): JSX.Element {
  const star = useStarGeometry();
  return (
    <group>
      {nodes.map((n) => (
        <Body key={n.id} node={n} star={star} animate={animate} />
      ))}
    </group>
  );
}
