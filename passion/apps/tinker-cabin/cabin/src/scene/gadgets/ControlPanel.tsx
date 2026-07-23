/**
 * Wall control panel (engineering). Press E to power it up: a row of buttons runs a chasing light
 * sequence, the readout bar glows, and the master lever throws. Mounted on the front (+Z) wall, left
 * of the door, facing into the room.
 *
 * Determinism: button/readout glow is a pure function of clock time gated by `store.panel.mode`,
 * frozen under `?freeze=1`. The lever angle is a pure function of mode (no easing state).
 */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { GADGET_FROZEN_T, type GadgetStore } from "./gadgetState";

const BUTTONS: Array<{ x: number; hue: string }> = [
  { x: -0.34, hue: "#ff5a4a" },
  { x: -0.17, hue: "#ffb03a" },
  { x: 0.0, hue: "#8ce05a" },
  { x: 0.17, hue: "#4ab8ff" },
  { x: 0.34, hue: "#c47aff" },
];

export function ControlPanel({
  store,
  freeze,
}: {
  store: GadgetStore;
  freeze: boolean;
}): JSX.Element {
  const btnMats = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const readout = useRef<THREE.MeshStandardMaterial>(null);
  const lever = useRef<THREE.Group>(null);
  const standby = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const t = freeze ? GADGET_FROZEN_T : state.clock.elapsedTime;
    const on = (store.panel?.mode ?? 0) > 0;
    // chasing lights when on; dark when off
    btnMats.current.forEach((m, i) => {
      if (!m) return;
      m.emissiveIntensity = on
        ? Math.max(0.05, 0.9 * (0.5 + 0.5 * Math.sin(t * 4 - i * 0.9)))
        : 0.05;
    });
    if (readout.current) readout.current.emissiveIntensity = on ? 1.0 : 0.06;
    // lever throws down when powered
    if (lever.current) lever.current.rotation.x = on ? 0.7 : -0.5;
    // red standby LED pulses when off (affordance), steady dim when on
    if (standby.current)
      standby.current.emissiveIntensity = on ? 0.3 : 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 3));
  });

  // front (+Z) wall interior face ≈ 2.84; sit the panel proud of it. No group rotation — the room
  // (and player) is on the -Z side, so every control protrudes toward -Z (negative local z).
  return (
    <group position={[-1.9, 1.4, 2.72]}>
      {/* backplate */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.62, 0.08]} />
        <meshStandardMaterial color="#22262c" roughness={0.6} metalness={0.35} />
      </mesh>
      {/* raised bezel */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[0.92, 0.54, 0.04]} />
        <meshStandardMaterial color="#33383f" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* readout bar */}
      <mesh position={[0, 0.15, -0.06]}>
        <boxGeometry args={[0.72, 0.14, 0.03]} />
        <meshStandardMaterial
          ref={readout}
          color="#0a1a12"
          emissive="#39e08a"
          emissiveIntensity={0.06}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>
      {/* button row — pucks facing the room (-Z) */}
      {BUTTONS.map((b, i) => (
        <mesh key={`btn-${b.hue}`} position={[b.x, -0.1, -0.07]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.05, 20]} />
          <meshStandardMaterial
            ref={(m) => {
              btnMats.current[i] = m;
            }}
            color={b.hue}
            emissive={b.hue}
            emissiveIntensity={0.05}
            roughness={0.4}
            metalness={0.1}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* master lever bottom-right (pivots about X so it throws toward the room) */}
      <group ref={lever} position={[0.4, -0.16, -0.06]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.016, 0.016, 0.2, 10]} />
          <meshStandardMaterial color="#9aa2ab" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <sphereGeometry args={[0.036, 12, 10]} />
          <meshStandardMaterial color="#e0433a" roughness={0.35} metalness={0.2} />
        </mesh>
      </group>
      {/* standby LED, top-left */}
      <mesh position={[-0.4, 0.19, -0.07]}>
        <sphereGeometry args={[0.026, 10, 8]} />
        <meshStandardMaterial
          ref={standby}
          color="#ff6a5a"
          emissive="#ff2a1a"
          emissiveIntensity={0.4}
          roughness={0.4}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
