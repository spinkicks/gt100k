/**
 * Paint easel (art). Press E to cycle the canvas through paintings: blank → warm sunset → cool
 * night → vivid bloom. A tripod easel with a palette of paint blobs in the back-right corner.
 *
 * Determinism: the canvas is chosen purely by `store.easel.mode` (no time term), so it is stable at
 * rest and under `?freeze=1`. A faint palette-blob sheen pulses on clock time as the affordance.
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { GADGET_FROZEN_T, type GadgetStore } from "./gadgetState";

// per mode: [canvas base colour, emissive tint, emissive strength]
const PAINTINGS: Array<[string, string, number]> = [
  ["#e7e0d2", "#000000", 0], // blank primed canvas
  ["#c9663a", "#ff9a4a", 0.45], // warm sunset
  ["#2f4a7a", "#4a7ad0", 0.4], // cool night
  ["#7a3a86", "#e05ad0", 0.6], // vivid bloom
];

export function Easel({
  store,
  freeze,
}: {
  store: GadgetStore;
  freeze: boolean;
}): JSX.Element {
  const canvas = useRef<THREE.MeshStandardMaterial>(null);
  const palette = useRef<THREE.MeshStandardMaterial>(null);
  const emis = useMemo(() => new THREE.Color(), []);
  const base = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const t = freeze ? GADGET_FROZEN_T : state.clock.elapsedTime;
    const mode = store.easel?.mode ?? 0;
    const [col, glow, strength] = PAINTINGS[mode] ?? PAINTINGS[0]!;
    if (canvas.current) {
      base.set(col);
      canvas.current.color.copy(base);
      emis.set(glow);
      canvas.current.emissive.copy(emis);
      canvas.current.emissiveIntensity = strength;
    }
    // palette blobs shimmer faintly (affordance)
    if (palette.current)
      palette.current.emissiveIntensity = 0.12 + 0.12 * (0.5 + 0.5 * Math.sin(t * 2.2));
  });

  // back-right corner, canvas turned to face the room (-X / +Z-ish)
  return (
    <group position={[2.9, 0, -1.95]} rotation={[0, -1.1, 0]}>
      {/* tripod legs */}
      {(
        [
          [0.0, 0.16],
          [-0.16, -0.12],
          [0.16, -0.12],
        ] as Array<[number, number]>
      ).map(([lx, lz]) => (
        <mesh
          key={`leg-${lx}-${lz}`}
          position={[lx, 0.7, lz]}
          rotation={[lz * 0.4, 0, -lx * 0.6]}
          castShadow
        >
          <cylinderGeometry args={[0.02, 0.025, 1.45, 8]} />
          <meshStandardMaterial color="#5a3d22" roughness={0.7} />
        </mesh>
      ))}
      {/* ledge + canvas */}
      <mesh position={[0, 1.05, 0.06]} castShadow>
        <boxGeometry args={[0.5, 0.04, 0.08]} />
        <meshStandardMaterial color="#4a3320" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.32, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.42, 0.03]} />
        <meshStandardMaterial color="#6a4a2c" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.32, 0.067]}>
        <planeGeometry args={[0.42, 0.34]} />
        <meshStandardMaterial
          ref={canvas}
          color="#e7e0d2"
          emissive="#000000"
          emissiveIntensity={0}
          roughness={0.85}
        />
      </mesh>
      {/* palette on the ledge with a few paint blobs */}
      <mesh position={[0.19, 1.09, 0.14]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.012, 18]} />
        <meshStandardMaterial color="#caa06a" roughness={0.6} />
      </mesh>
      {(
        [
          [0.15, "#e8433a"],
          [0.2, "#3a9ce0"],
          [0.24, "#5ec45a"],
        ] as Array<[number, string]>
      ).map(([bx, hue]) => (
        <mesh key={`blob-${hue}`} position={[bx, 1.1, 0.14]}>
          <sphereGeometry args={[0.017, 10, 8]} />
          <meshStandardMaterial
            ref={hue === "#e8433a" ? palette : undefined}
            color={hue}
            emissive={hue}
            emissiveIntensity={0.12}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
