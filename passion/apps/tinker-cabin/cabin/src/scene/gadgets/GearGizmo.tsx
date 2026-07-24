/**
 * Gear contraption (mechanical). Press E and the crank engages: three meshed brass gears spin (at
 * meshing-consistent opposite rates) and a status LED goes green. A floor pedestal in the front-left
 * corner. When off the gears rest at a fixed angle.
 *
 * Determinism: gear angles are a pure function of clock time gated by `store.gizmo.mode`; frozen
 * under `?freeze=1` (so a `?freeze` shot always catches the same spoke positions).
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { GADGET_FROZEN_T, type GadgetStore } from "./gadgetState";

/** A cog: a disk + `teeth` radial teeth + a darker hub. Rotate the returned group about Z. */
function Gear({
  radius,
  teeth,
  color,
}: {
  radius: number;
  teeth: number;
  color: string;
}): JSX.Element {
  const toothW = (radius * Math.PI) / teeth;
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, 0.05, 28]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.7} />
      </mesh>
      {Array.from({ length: teeth }, (_, i) => {
        const a = (i / teeth) * Math.PI * 2;
        return (
          <mesh
            key={`tooth-${a.toFixed(3)}`}
            position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}
            rotation={[0, -a, 0]}
            castShadow
          >
            <boxGeometry args={[toothW * 0.9, 0.05, toothW * 0.9]} />
            <meshStandardMaterial color={color} roughness={0.45} metalness={0.7} />
          </mesh>
        );
      })}
      <mesh>
        <cylinderGeometry args={[radius * 0.28, radius * 0.28, 0.07, 16]} />
        <meshStandardMaterial color="#2a2016" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

export function GearGizmo({
  store,
  freeze,
}: {
  store: GadgetStore;
  freeze: boolean;
}): JSX.Element {
  const g1 = useRef<THREE.Group>(null);
  const g2 = useRef<THREE.Group>(null);
  const g3 = useRef<THREE.Group>(null);
  const status = useRef<THREE.MeshStandardMaterial>(null);
  // gears face the player (spin about world Z after the group's -X rotation lays them upright)
  const teeth = useMemo(() => ({ a: 16, b: 12, c: 10 }), []);

  useFrame((state) => {
    const t = freeze ? GADGET_FROZEN_T : state.clock.elapsedTime;
    // mode carries the loop count (0 = idle): more turns → faster spin, so running the loop challenge
    // visibly speeds the gears. Once the crank has been ENGAGED (discovered) it keeps turning even at
    // rest count, so the gizmo stays alive instead of freezing the instant you land the exact answer.
    const turns = store.gizmo?.mode ?? 0;
    const engaged = store.gizmo?.discovered ?? false;
    const on = turns > 0 || engaged;
    const rate = turns > 0 ? 1.6 + turns * 0.5 : 2.2; // lively idle spin once engaged
    const w = on ? t * rate : 0;
    // meshed: neighbours counter-rotate at inverse tooth-count ratio (arbitrary rest angles offset)
    if (g1.current) g1.current.rotation.y = w;
    if (g2.current) g2.current.rotation.y = -w * (teeth.a / teeth.b) + 0.3;
    if (g3.current) g3.current.rotation.y = w * (teeth.b / teeth.c) + 0.15;
    if (status.current) status.current.emissiveIntensity = on ? 1.0 : 0.15;
  });

  return (
    <group position={[-2.72, 0, 2.35]} rotation={[0, -0.5, 0]}>
      {/* pedestal */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.3, 0.9, 16]} />
        <meshStandardMaterial color="#3a2817" roughness={0.75} metalness={0} />
      </mesh>
      {/* mounting plate the gears sit on (tilted up to face the room) */}
      <group position={[0, 1.02, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0, -0.04]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.5, 0.04]} />
          <meshStandardMaterial color="#4a3320" roughness={0.7} metalness={0.1} />
        </mesh>
        <group ref={g1} position={[-0.12, 0.08, 0.02]}>
          <Gear radius={0.16} teeth={teeth.a} color="#c9a24a" />
        </group>
        <group ref={g2} position={[0.14, 0.13, 0.02]}>
          <Gear radius={0.115} teeth={teeth.b} color="#b8863c" />
        </group>
        <group ref={g3} position={[0.13, -0.11, 0.02]}>
          <Gear radius={0.095} teeth={teeth.c} color="#d0b060" />
        </group>
        {/* status LED */}
        <mesh position={[-0.28, -0.19, 0.03]}>
          <sphereGeometry args={[0.02, 10, 8]} />
          <meshStandardMaterial
            ref={status}
            color="#7dff9a"
            emissive="#2ad066"
            emissiveIntensity={0.15}
            roughness={0.4}
          />
        </mesh>
      </group>
    </group>
  );
}
