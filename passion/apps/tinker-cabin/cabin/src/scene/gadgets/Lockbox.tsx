/**
 * Lockbox (logic / variables). Driven by the "crack the lockbox" code challenge: assign each dial
 * variable to the secret key. `store.lockbox.mode` carries the number of correct dials (0..3); the
 * lid hinges open a little more per correct dial and springs fully open at 3, revealing a glowing
 * reward gem. Three status studs on the front light up as each dial lands. On a crate by the door.
 *
 * Determinism: the lid angle eases toward its target in play, but SNAPS to the target under
 * `?freeze=1` (no easing history), and the gem's spin/pulse use frozen time — so harness shots at a
 * given mode are reproducible.
 */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { GADGET_FROZEN_T, type GadgetStore } from "./gadgetState";

const OPEN_ANGLE = 2.1; // radians the lid rotates when fully open

export function Lockbox({
  store,
  freeze,
}: {
  store: GadgetStore;
  freeze: boolean;
}): JSX.Element {
  const lid = useRef<THREE.Group>(null);
  const gemMesh = useRef<THREE.Mesh>(null);
  const gem = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef<THREE.PointLight>(null);
  const studs = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const angle = useRef(0);

  useFrame((state) => {
    const t = freeze ? GADGET_FROZEN_T : state.clock.elapsedTime;
    const mode = store.lockbox?.mode ?? 0;
    const full = mode >= 3;
    const target = (mode / 3) * OPEN_ANGLE;
    if (freeze) angle.current = target;
    else angle.current += (target - angle.current) * 0.12; // ease open/closed
    if (lid.current) lid.current.rotation.x = angle.current; // hinge at the wall side → opens toward the room
    // status studs: light the first `mode` (one per correct dial)
    studs.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = i < mode ? 1.0 : 0.08;
    });
    // reward gem: dark when closed, steady glow while cracking, bright pulse once fully open; spins
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    if (gem.current)
      gem.current.emissiveIntensity = mode === 0 ? 0 : full ? 0.9 + 0.6 * pulse : 0.3;
    if (gemMesh.current) gemMesh.current.rotation.y = t * 0.8;
    if (glow.current) glow.current.intensity = mode === 0 ? 0 : full ? 1.4 + 0.8 * pulse : 0.4;
  });

  return (
    <group position={[-0.3, 0, 2.55]}>
      {/* crate stand */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.6, 0.5]} />
        <meshStandardMaterial color="#4a3320" roughness={0.8} metalness={0} />
      </mesh>
      {/* box — a HOLLOW container (floor + 4 walls, open top) so the open lid reveals the interior */}
      <mesh position={[0, 0.66, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.05, 0.4]} />
        <meshStandardMaterial color="#4a2f1c" roughness={0.7} metalness={0.1} />
      </mesh>
      {(
        [
          [0, 0.175, 0.5, 0.05],
          [0, -0.175, 0.5, 0.05],
          [-0.225, 0, 0.05, 0.3],
          [0.225, 0, 0.05, 0.3],
        ] as Array<[number, number, number, number]>
      ).map(([wx, wz, ww, wd]) => (
        <mesh key={`wall-${wx}-${wz}`} position={[wx, 0.8, wz]} castShadow receiveShadow>
          <boxGeometry args={[ww, 0.3, wd]} />
          <meshStandardMaterial color="#5a3a24" roughness={0.6} metalness={0.15} />
        </mesh>
      ))}
      {/* brass rim around the top of the walls (thin frame, doesn't fill the interior) */}
      {(
        [
          [0, 0.19, 0.54, 0.06],
          [0, -0.19, 0.54, 0.06],
          [-0.24, 0, 0.06, 0.44],
          [0.24, 0, 0.06, 0.44],
        ] as Array<[number, number, number, number]>
      ).map(([rx, rz, rw, rd]) => (
        <mesh key={`rim-${rx}-${rz}`} position={[rx, 0.95, rz]}>
          <boxGeometry args={[rw, 0.05, rd]} />
          <meshStandardMaterial color="#8a6a34" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      {/* reward gem — sits high in the box so it peeks above the rim, revealed + glowing as it opens */}
      <mesh ref={gemMesh} position={[0, 0.92, 0]}>
        <octahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial
          ref={gem}
          color="#8ef0ff"
          emissive="#39d0ff"
          emissiveIntensity={0}
          roughness={0.2}
          metalness={0.3}
          toneMapped={false}
        />
      </mesh>
      {/* cyan glow spilling from the open box */}
      <pointLight
        ref={glow}
        position={[0, 0.95, 0]}
        color="#5fe0ff"
        intensity={0}
        distance={1.6}
        decay={2}
      />
      {/* lid — hinged at the WALL-side top edge (pivot at +z) so it swings up and opens toward the
          middle of the room; covers the box top when closed */}
      <group ref={lid} position={[0, 0.98, 0.2]}>
        <mesh position={[0, 0.03, -0.2]} castShadow>
          <boxGeometry args={[0.5, 0.08, 0.4]} />
          <meshStandardMaterial color="#5a3a24" roughness={0.6} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.07, -0.2]}>
          <boxGeometry args={[0.52, 0.04, 0.42]} />
          <meshStandardMaterial color="#8a6a34" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>
      {/* three status studs on the ROOM-facing face (z-0.2) so the player sees them, one per dial */}
      {[-0.14, 0, 0.14].map((x, i) => (
        <mesh key={`stud-${x}`} position={[x, 0.8, -0.205]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
          <meshStandardMaterial
            ref={(m) => {
              studs.current[i] = m;
            }}
            color="#ffd27a"
            emissive="#ffb347"
            emissiveIntensity={0.08}
            roughness={0.4}
            metalness={0.3}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
