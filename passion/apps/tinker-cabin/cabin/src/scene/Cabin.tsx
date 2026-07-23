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
import {
  duskVistaTexture,
  floorTextures,
  propTextures,
  stoneTextures,
  wallTextures,
} from "./textures";

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
        <meshStandardMaterial color="#241a10" roughness={0.95} metalness={0} />
      </mesh>
      {/* exposed timber roof beams (ref 07): cross-beams + a ridge purlin */}
      <group>
        {Array.from({ length: 7 }, (_, k) => {
          const z = -hz + 0.35 + (k * (hz * 2 - 0.7)) / 6;
          return (
            <mesh key={`beam-${k}`} position={[0, height - 0.16, z]} castShadow receiveShadow>
              <boxGeometry args={[hx * 2, 0.22, 0.2]} />
              <meshStandardMaterial color="#3a2817" roughness={0.85} metalness={0} />
            </mesh>
          );
        })}
        {/* two long purlins along Z */}
        {[-hx * 0.55, hx * 0.55].map((x) => (
          <mesh key={`purlin-${x}`} position={[x, height - 0.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.16, hz * 2]} />
            <meshStandardMaterial color="#2f2013" roughness={0.85} metalness={0} />
          </mesh>
        ))}
      </group>
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
  const stone = useMemo(() => stoneTextures(), []);

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
      {/* full-height stone chimney breast (ref 07) */}
      <mesh position={[0, 1.5, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 3.0, 0.55]} />
        <meshStandardMaterial {...stone} roughness={0.95} metalness={0} />
      </mesh>
      {/* raised stone hearth slab the fire sits on */}
      <mesh position={[0, 0.12, 0.32]} castShadow receiveShadow>
        <boxGeometry args={[2.3, 0.24, 0.7]} />
        <meshStandardMaterial {...stone} roughness={0.95} metalness={0} />
      </mesh>
      {/* firebox cavity (recessed, dark) */}
      <mesh position={[0, 0.9, 0.12]} receiveShadow>
        <boxGeometry args={[1.2, 1.15, 0.5]} />
        <meshStandardMaterial color="#0d0805" roughness={1} metalness={0} />
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
  const vista = useMemo(() => duskVistaTexture(), []);
  // picture window set into the +X wall's interior face (x ≈ 3.34); rotated so it faces the room (-X).
  return (
    <group position={[x - 0.16, y + 0.15, z]} rotation={[0, -Math.PI / 2, 0]}>
      {/* outer frame (solid box set into the wall; the pane sits in FRONT of it, room-side) */}
      <mesh castShadow>
        <boxGeometry args={[2.1, 1.7, 0.14]} />
        <meshStandardMaterial color="#4a3320" roughness={0.6} metalness={0} />
      </mesh>
      {/* the dusk mountain vista — a window view is effectively unlit, so render it with a basic
          (unlit) map at full vividness in front of the frame. Bloom threshold keeps it from clipping. */}
      <mesh position={[0, 0, 0.09]}>
        <planeGeometry args={[1.9, 1.5]} />
        <meshBasicMaterial map={vista} toneMapped={true} />
      </mesh>
      {/* muntins (cross bars) — in front of the glass */}
      <mesh position={[0, 0, 0.11]}>
        <boxGeometry args={[0.05, 1.5, 0.03]} />
        <meshStandardMaterial color="#3a2818" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.11]}>
        <boxGeometry args={[1.9, 0.05, 0.03]} />
        <meshStandardMaterial color="#3a2818" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Lamp(): JSX.Element {
  // warm table lamp beside the desk — cozy secondary key + lifts desk-framing material variance.
  const [dx, , dz] = ANCHORS.desk;
  return (
    <group position={[dx + 0.2, 0, dz + 1.1]}>
      {/* slim side table */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.24, 1.0, 16]} />
        <meshStandardMaterial color="#3a2616" roughness={0.7} metalness={0} />
      </mesh>
      {/* lamp base + shade */}
      <mesh position={[0, 1.12, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.24, 12]} />
        <meshStandardMaterial color="#5a4632" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.34, 0]}>
        <coneGeometry args={[0.22, 0.28, 20, 1, true]} />
        <meshStandardMaterial
          color="#e8c98a"
          emissive="#ffcf87"
          emissiveIntensity={1.6}
          side={2}
          roughness={0.8}
        />
      </mesh>
      {/* warm glow */}
      <pointLight position={[0, 1.34, 0]} color="#ffcf87" intensity={9} distance={6} decay={2} />
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
      <Lamp />

      {/* cool window fill (dusk daylight raking from +X) */}
      <directionalLight
        position={[6, 4, 1]}
        color="#6f92d8"
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* soft cool ambient so shadows read, never crush to black */}
      <ambientLight color="#33425f" intensity={0.5} />
      {/* gentle cool fill spilling from the window into the room (offset off the pane to avoid a hotspot) */}
      <pointLight
        position={[ROOM.hx - 1.2, 1.7, 0.4]}
        color="#7aa0e8"
        intensity={9}
        distance={7}
        decay={2}
      />
    </group>
  );
}
