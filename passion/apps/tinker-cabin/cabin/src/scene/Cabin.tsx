/**
 * The Tinker Workshop cabin scene: an enclosed pine room with a lit fireplace (warm key), a cool
 * window fill, a cat on the hearth, and a desk coding-station. Built with procedural PBR wood +
 * primitives for the first-light/materials phases; the grind loop swaps in richer geometry/assets.
 *
 * Determinism: all animation is a pure function of clock time and is frozen (fixed phase) when
 * `freeze` is set, so `?freeze=1` shots are reproducible. No Math.random in the render loop.
 */
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import { updateStats } from "../core/hook";
import { ANCHORS, ROOM } from "./layout";
import { floorTextures, propTextures, wallTextures } from "./textures";

const FROZEN_T = 1.5; // fixed phase used when freeze=1

function Shell(): JSX.Element {
  const floor = useMemo(() => floorTextures(), []);
  const wall = useMemo(() => wallTextures(), []);
  const { hx, hz, height, wall: tw } = ROOM;
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[hx * 2, hz * 2]} />
        <meshStandardMaterial {...floor} roughness={0.78} metalness={0} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]} receiveShadow>
        <planeGeometry args={[hx * 2, hz * 2]} />
        <meshStandardMaterial color="#2a1e14" roughness={0.95} metalness={0} />
      </mesh>
      {/* back wall (-Z) */}
      <mesh position={[0, height / 2, -hz]} receiveShadow castShadow>
        <boxGeometry args={[hx * 2, height, tw]} />
        <meshStandardMaterial {...wall} roughness={0.85} metalness={0} />
      </mesh>
      {/* front wall (+Z) */}
      <mesh position={[0, height / 2, hz]} receiveShadow>
        <boxGeometry args={[hx * 2, height, tw]} />
        <meshStandardMaterial {...wall} roughness={0.85} metalness={0} />
      </mesh>
      {/* left wall (-X) */}
      <mesh position={[-hx, height / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[tw, height, hz * 2]} />
        <meshStandardMaterial {...wall} roughness={0.85} metalness={0} />
      </mesh>
      {/* right wall (+X) — holds the window */}
      <mesh position={[hx, height / 2, 0]} receiveShadow>
        <boxGeometry args={[tw, height, hz * 2]} />
        <meshStandardMaterial {...wall} roughness={0.85} metalness={0} />
      </mesh>
    </group>
  );
}

function Fireplace({ freeze }: { freeze: boolean }): JSX.Element {
  const keyLight = useRef<THREE.PointLight>(null);
  const flames = useRef<THREE.Group>(null);
  const [ax, , az] = ANCHORS.fireplace;

  useEffect(() => {
    updateStats({ fireLit: true });
  }, []);

  useFrame((state) => {
    const t = freeze ? FROZEN_T : state.clock.elapsedTime;
    // deterministic multi-sine flicker (no RNG)
    const flicker =
      1 + Math.sin(t * 12) * 0.09 + Math.sin(t * 27.3) * 0.05 + Math.sin(t * 3.1) * 0.03;
    if (keyLight.current) keyLight.current.intensity = 24 * flicker;
    if (flames.current) flames.current.scale.set(1, flicker, 1);
  });

  const tongues: Array<[number, number, number, string]> = [
    [-0.22, 0.34, 0.12, "#ff5410"],
    [0.02, 0.52, 0.1, "#ffb020"],
    [0.22, 0.32, 0.11, "#ff6612"],
    [-0.05, 0.42, 0.09, "#ff8a1a"],
  ];

  return (
    <group position={[ax, 0, az + 0.35]}>
      {/* stone surround */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 2.4, 0.7]} />
        <meshStandardMaterial color="#4a423d" roughness={0.95} metalness={0} />
      </mesh>
      {/* firebox cavity */}
      <mesh position={[0, 0.85, 0.18]} receiveShadow>
        <boxGeometry args={[1.4, 1.3, 0.55]} />
        <meshStandardMaterial color="#100a06" roughness={1} metalness={0} />
      </mesh>
      {/* wooden mantle shelf */}
      <mesh position={[0, 2.05, 0.25]} castShadow>
        <boxGeometry args={[2.8, 0.2, 0.85]} />
        <meshStandardMaterial color="#5a3d22" roughness={0.7} metalness={0} />
      </mesh>
      {/* ember bed */}
      <mesh position={[0, 0.3, 0.36]}>
        <boxGeometry args={[1.0, 0.14, 0.45]} />
        <meshStandardMaterial color="#ff7a20" emissive="#ff4808" emissiveIntensity={5} />
      </mesh>
      {/* logs */}
      {(
        [
          [-0.3, 0.24, 0.4, 0.1],
          [0.3, 0.24, 0.4, -0.1],
          [0, 0.17, 0.48, 0],
        ] as Array<[number, number, number, number]>
      ).map(([x, y, z, rz]) => (
        <mesh
          key={`log-${x}-${z}`}
          position={[x, y, z]}
          rotation={[0.08, 0, Math.PI / 2 + rz]}
          castShadow
        >
          <cylinderGeometry args={[0.09, 0.1, 0.95, 12]} />
          <meshStandardMaterial color="#2a1a0e" roughness={0.9} />
        </mesh>
      ))}
      {/* flame tongues + hot core */}
      <group ref={flames} position={[0, 0.36, 0.36]}>
        {tongues.map(([x, h, r, col]) => (
          <mesh key={`flame-${x}-${col}`} position={[x, h / 2, 0]}>
            <coneGeometry args={[r, h, 10]} />
            <meshStandardMaterial color={col} emissive={col} emissiveIntensity={5.5} />
          </mesh>
        ))}
        <mesh position={[0, 0.16, 0]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color="#fff0c0" emissive="#ffd060" emissiveIntensity={8} />
        </mesh>
      </group>
      {/* warm key light from the fire */}
      <pointLight
        ref={keyLight}
        position={[0, 0.8, 0.3]}
        color="#ff7a2a"
        intensity={24}
        distance={13}
        decay={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
      />
    </group>
  );
}

function Cat(): JSX.Element {
  const [x, , z] = ANCHORS.cat;
  useEffect(() => {
    updateStats({ catVisible: true });
  }, []);
  // low-poly curled tabby placeholder (a real CC0 glTF replaces this in the life phase).
  const fur = <meshStandardMaterial color="#8a6a44" roughness={0.85} metalness={0} />;
  return (
    <group position={[x, 0.12, z]} rotation={[0, -0.7, 0]}>
      {/* curled body */}
      <mesh castShadow scale={[1.1, 0.7, 0.85]}>
        <sphereGeometry args={[0.28, 20, 16]} />
        {fur}
      </mesh>
      {/* head */}
      <mesh position={[0.28, 0.06, 0.12]} castShadow scale={[0.8, 0.8, 0.8]}>
        <sphereGeometry args={[0.16, 16, 14]} />
        {fur}
      </mesh>
      {/* ears */}
      {(
        [
          [0.34, 0.2, 0.02],
          [0.34, 0.2, 0.22],
        ] as Array<[number, number, number]>
      ).map(([ex, ey, ez]) => (
        <mesh key={`ear-${ez}`} position={[ex, ey, ez]} rotation={[0, 0, -0.3]} castShadow>
          <coneGeometry args={[0.05, 0.1, 8]} />
          {fur}
        </mesh>
      ))}
      {/* tail curled around */}
      <mesh position={[-0.24, 0.02, -0.18]} rotation={[0, 0.6, 0]} castShadow>
        <torusGeometry args={[0.16, 0.045, 8, 16, Math.PI * 1.3]} />
        {fur}
      </mesh>
    </group>
  );
}

function Window(): JSX.Element {
  const [x, y, z] = ANCHORS.window;
  return (
    <group position={[x - 0.02, y, z]} rotation={[0, -Math.PI / 2, 0]}>
      {/* frame */}
      <mesh castShadow>
        <boxGeometry args={[1.5, 1.4, 0.12]} />
        <meshStandardMaterial color="#4a3320" roughness={0.6} metalness={0} />
      </mesh>
      {/* cool daylight panel (dusk sky) */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1.3, 1.2]} />
        <meshStandardMaterial color="#9db6e0" emissive="#6a8fd0" emissiveIntensity={1.4} />
      </mesh>
      {/* muntins */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.04, 1.2, 0.06]} />
        <meshStandardMaterial color="#3a2818" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[1.3, 0.04, 0.06]} />
        <meshStandardMaterial color="#3a2818" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Desk(): JSX.Element {
  const tex = useMemo(() => propTextures(), []);
  const [x, , z] = ANCHORS.desk;
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
      {/* top */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.08, 0.7]} />
        <meshStandardMaterial {...tex} roughness={0.6} metalness={0} />
      </mesh>
      {/* legs */}
      {(
        [
          [0.72, 0.3],
          [-0.72, 0.3],
          [0.72, -0.3],
          [-0.72, -0.3],
        ] as Array<[number, number]>
      ).map(([lx, lz]) => (
        <mesh key={`leg-${lx}-${lz}`} position={[lx, 0.37, lz]} castShadow>
          <boxGeometry args={[0.08, 0.75, 0.08]} />
          <meshStandardMaterial color="#4a3018" roughness={0.7} />
        </mesh>
      ))}
      {/* the coding-station screen (lit) — the "first taste" anchor */}
      <mesh position={[0, 1.05, -0.2]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.04]} />
        <meshStandardMaterial color="#101418" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.05, -0.178]}>
        <planeGeometry args={[0.54, 0.34]} />
        <meshStandardMaterial color="#2b6cb0" emissive="#2b6cb0" emissiveIntensity={1.1} />
      </mesh>
    </group>
  );
}

export function Cabin({ freeze }: { freeze: boolean }): JSX.Element {
  return (
    <group>
      <Shell />
      <Fireplace freeze={freeze} />
      <Cat />
      <Window />
      <Desk />

      {/* cool window fill (dusk daylight raking from +X) */}
      <directionalLight
        position={[6, 4, 1]}
        color="#6f92d8"
        intensity={2.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* soft cool ambient so shadows read, never crush to black */}
      <ambientLight color="#33425f" intensity={0.5} />
      {/* localized cool wash around the window */}
      <pointLight
        position={[ROOM.hx - 0.6, 1.7, 0.4]}
        color="#7aa0e8"
        intensity={16}
        distance={9}
        decay={1.8}
      />
    </group>
  );
}
