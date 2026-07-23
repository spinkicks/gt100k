/**
 * Chime keys (music). Press E to play: the six bars light up in a travelling note pattern (a little
 * melody sweeping across the xylophone) and a soft note-glow rides along. A small mallet rests on the
 * frame. When off the bars are matte-coloured with a single standby glow on the lowest bar.
 *
 * Determinism: the note sweep is a pure function of clock time gated by `store.chimes.mode`; frozen
 * under `?freeze=1`.
 */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { GADGET_FROZEN_T, type GadgetStore } from "./gadgetState";

// bar hue + length (longer = lower note), laid out low→high across +X
const BARS: Array<{ len: number; hue: string }> = [
  { len: 0.34, hue: "#e8433a" },
  { len: 0.31, hue: "#ef8a2f" },
  { len: 0.28, hue: "#e8c53a" },
  { len: 0.25, hue: "#5ec45a" },
  { len: 0.22, hue: "#3a9ce0" },
  { len: 0.19, hue: "#a05ae0" },
];

export function ChimeKeys({
  store,
  freeze,
}: {
  store: GadgetStore;
  freeze: boolean;
}): JSX.Element {
  const mats = useRef<Array<THREE.MeshStandardMaterial | null>>([]);

  useFrame((state) => {
    const t = freeze ? GADGET_FROZEN_T : state.clock.elapsedTime;
    const on = (store.chimes?.mode ?? 0) > 0;
    mats.current.forEach((m, i) => {
      if (!m) return;
      // a note "strikes" and rings out as the sweep passes each bar
      const strike = Math.max(0, Math.sin(t * 3.2 - i * 0.7));
      m.emissiveIntensity = on ? 0.1 + 1.1 * strike * strike : i === 0 ? 0.28 : 0.06;
    });
  });

  return (
    <group position={[2.55, 0, 2.45]} rotation={[0, -2.5, 0]}>
      {/* little table */}
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.06, 0.5]} />
        <meshStandardMaterial color="#4a3320" roughness={0.7} metalness={0} />
      </mesh>
      {(
        [
          [0.34, 0.2],
          [-0.34, 0.2],
          [0.34, -0.2],
          [-0.34, -0.2],
        ] as Array<[number, number]>
      ).map(([lx, lz]) => (
        <mesh key={`cl-${lx}-${lz}`} position={[lx, 0.19, lz]} castShadow>
          <boxGeometry args={[0.05, 0.38, 0.05]} />
          <meshStandardMaterial color="#3a2716" roughness={0.75} />
        </mesh>
      ))}
      {/* two support rails the bars rest on */}
      {[-0.14, 0.14].map((z) => (
        <mesh key={`rail-${z}`} position={[0, 0.43, z]} castShadow>
          <boxGeometry args={[0.72, 0.03, 0.02]} />
          <meshStandardMaterial color="#2a1c10" roughness={0.6} />
        </mesh>
      ))}
      {/* the bars */}
      {BARS.map((b, i) => (
        <mesh key={`bar-${b.hue}`} position={[-0.3 + i * 0.12, 0.47, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.09, 0.03, b.len]} />
          <meshStandardMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            color={b.hue}
            emissive={b.hue}
            emissiveIntensity={0.06}
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>
      ))}
      {/* mallet resting across the frame */}
      <mesh position={[0.02, 0.5, 0.22]} rotation={[0, 0.3, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.34, 8]} />
        <meshStandardMaterial color="#8a6a3a" roughness={0.6} />
      </mesh>
      <mesh position={[0.18, 0.5, 0.24]} castShadow>
        <sphereGeometry args={[0.028, 12, 10]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.7} />
      </mesh>
    </group>
  );
}
