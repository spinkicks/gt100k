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
import * as THREE from "three";
import { updateStats } from "../core/hook";
import { EnvLight } from "./EnvLight";
import { ANCHORS, ROOM } from "./layout";
import {
  flameTexture,
  floorTextures,
  mountainLayerTexture,
  propTextures,
  rugTexture,
  skyGradientTexture,
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
            <mesh
              key={`beam-${z.toFixed(3)}`}
              position={[0, height - 0.16, z]}
              castShadow
              receiveShadow
            >
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
      {/* right wall (+X) — built as 4 segments AROUND a real window opening
          (opening: y∈[1.0,2.5], z∈[-0.95,0.95]) so exterior light only enters through the hole
          and the mountain view behind it parallaxes. Segments cast shadow to form the light shaft. */}
      <mesh position={[hx, 0.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[tw, 1.0, hz * 2]} />
        <meshStandardMaterial {...wall} roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[hx, 2.75, 0]} receiveShadow castShadow>
        <boxGeometry args={[tw, 0.5, hz * 2]} />
        <meshStandardMaterial {...wall} roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[hx, 1.75, -1.975]} receiveShadow castShadow>
        <boxGeometry args={[tw, 1.5, 2.05]} />
        <meshStandardMaterial {...wall} roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[hx, 1.75, 1.975]} receiveShadow castShadow>
        <boxGeometry args={[tw, 1.5, 2.05]} />
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
  const flame = useMemo(() => flameTexture(), []);

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

  // additive flame sprites: [x, baseY, width, height, opacity] — clustered into one tongue cluster
  const sprites: Array<[number, number, number, number, number]> = [
    [0, 0, 0.52, 0.92, 0.9],
    [-0.13, 0, 0.32, 0.6, 0.7],
    [0.14, 0, 0.3, 0.56, 0.7],
    [0, 0.02, 0.24, 0.42, 0.95],
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
      {/* ember bed — low glowing coals under the logs (kept deep-orange so it doesn't read as a slab) */}
      <mesh position={[0, 0.26, 0.4]}>
        <boxGeometry args={[0.95, 0.1, 0.4]} />
        <meshStandardMaterial color="#ff6a1e" emissive="#e83c04" emissiveIntensity={3.2} />
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
      {/* soft additive flame sprites (billboard the camera; stack for a warm volumetric glow).
          Sits above the logs (y) and in front of them (z) so it isn't occluded by the log geometry. */}
      <group ref={flames} position={[0, 0.32, 0.44]}>
        {sprites.map(([x, by, w, h, op]) => (
          <sprite key={`flame-${x}-${h}`} position={[x, by + h / 2, 0]} scale={[w, h, 1]}>
            <spriteMaterial
              map={flame}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              transparent
              opacity={op}
              toneMapped={false}
            />
          </sprite>
        ))}
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

/**
 * The window: a wooden frame + muntins around the wall opening (no glass pane), plus the mountain
 * view rendered as separate unlit layers OUTSIDE the wall at increasing distance — so the view
 * parallaxes as you move (real depth, not a painting). Muntins cast shadow into the light shaft.
 */
function Window(): JSX.Element {
  const [x] = ANCHORS.window;
  const cy = 1.75; // opening centre height
  const iface = x - 0.15; // interior wall face
  const sky = useMemo(() => skyGradientTexture(), []);
  const far = useMemo(() => mountainLayerTexture("#8aa0c4", 0.5, 26, 11), []);
  const mid = useMemo(() => mountainLayerTexture("#5d6f92", 0.62, 40, 23), []);
  const near = useMemo(() => mountainLayerTexture("#3a465f", 0.74, 60, 37), []);

  return (
    <group>
      {/* view layers OUTSIDE the opening (x > wall), facing the room; different depths → parallax */}
      <group>
        <mesh position={[x + 11, 5.5, 0.4]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[34, 22]} />
          <meshBasicMaterial map={sky} toneMapped />
        </mesh>
        <mesh position={[x + 7.5, 2.8, 0.3]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[26, 9]} />
          <meshBasicMaterial map={far} transparent toneMapped />
        </mesh>
        <mesh position={[x + 5, 2.4, 0.1]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[20, 8]} />
          <meshBasicMaterial map={mid} transparent toneMapped />
        </mesh>
        <mesh position={[x + 3.1, 2.1, -0.2]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[15, 7]} />
          <meshBasicMaterial map={near} transparent toneMapped />
        </mesh>
      </group>

      {/* wooden frame ring + muntins on the interior face of the opening (1.9 wide × 1.5 tall) */}
      <group position={[iface, cy, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {(
          [
            [0, 0.83, 2.16, 0.16],
            [0, -0.83, 2.16, 0.16],
          ] as Array<[number, number, number, number]>
        ).map(([px, py, bw, bh]) => (
          <mesh key={`fh-${py}`} position={[px, py, 0]} castShadow>
            <boxGeometry args={[bw, bh, 0.16]} />
            <meshStandardMaterial color="#4a3320" roughness={0.6} metalness={0} />
          </mesh>
        ))}
        {(
          [
            [-1.0, 0, 0.16, 1.5],
            [1.0, 0, 0.16, 1.5],
          ] as Array<[number, number, number, number]>
        ).map(([px, py, bw, bh]) => (
          <mesh key={`fv-${px}`} position={[px, py, 0]} castShadow>
            <boxGeometry args={[bw, bh, 0.16]} />
            <meshStandardMaterial color="#4a3320" roughness={0.6} metalness={0} />
          </mesh>
        ))}
        {/* muntin cross — casts the window-pane shadow in the light shaft */}
        <mesh position={[0, 0, 0.02]} castShadow>
          <boxGeometry args={[0.05, 1.5, 0.05]} />
          <meshStandardMaterial color="#3a2818" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.02]} castShadow>
          <boxGeometry args={[1.9, 0.05, 0.05]} />
          <meshStandardMaterial color="#3a2818" roughness={0.6} />
        </mesh>
      </group>
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
          emissiveIntensity={0.9}
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

function Rug(): JSX.Element {
  const rug = useMemo(() => rugTexture(), []);
  // patterned rug on the floor in front of the hearth (ref 07)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -1.5]} receiveShadow>
      <planeGeometry args={[2.6, 1.9]} />
      <meshStandardMaterial map={rug} roughness={0.9} metalness={0} />
    </mesh>
  );
}

function SetDressing(): JSX.Element {
  const { hx, hz } = ROOM;
  const inX = hx - 0.16;
  const inZ = hz - 0.16;
  const bookColors = ["#7a3b2e", "#2e5a4a", "#385a7a", "#8a6a2e"];
  return (
    <group>
      {/* baseboards around the room interior */}
      {(
        [
          [0, -inZ, hx * 2, 0.18, 0],
          [0, inZ, hx * 2, 0.18, 0],
          [-inX, 0, hz * 2, 0.18, Math.PI / 2],
          [inX, 0, hz * 2, 0.18, Math.PI / 2],
        ] as Array<[number, number, number, number, number]>
      ).map(([x, z, len, h, ry]) => (
        <mesh key={`base-${x}-${z}`} position={[x, h / 2, z]} rotation={[0, ry, 0]} castShadow>
          <boxGeometry args={[len, h, 0.06]} />
          <meshStandardMaterial color="#3a2817" roughness={0.7} metalness={0} />
        </mesh>
      ))}
      {/* a small framed landscape print on the back wall, left of the chimney (ref 05) */}
      <group position={[-1.7, 1.95, -inZ + 0.02]}>
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.5, 0.04]} />
          <meshStandardMaterial color="#4a3320" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[0.58, 0.38]} />
          <meshStandardMaterial color="#6b7f9e" roughness={0.9} />
        </mesh>
      </group>
      {/* wall shelf with a few books on the left wall, above the desk */}
      <group position={[-inX + 0.02, 1.75, -0.6]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.05, 0.28]} />
          <meshStandardMaterial color="#4a3018" roughness={0.7} />
        </mesh>
        {bookColors.map((col, i) => (
          <mesh key={`book-${col}`} position={[-0.45 + i * 0.16, 0.16, 0]} castShadow>
            <boxGeometry args={[0.1, 0.26, 0.2]} />
            <meshStandardMaterial color={col} roughness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Door(): JSX.Element {
  const plank = useMemo(() => propTextures(), []);
  const inZ = ROOM.hz - 0.15; // interior face of the front (+Z) wall
  // a closed plank door with a frame + handle, set against the front wall, camera-right of centre
  return (
    <group position={[1.35, 0, inZ]}>
      {/* frame: two jambs + a head */}
      <mesh position={[-0.62, 1.05, 0]} castShadow>
        <boxGeometry args={[0.12, 2.15, 0.16]} />
        <meshStandardMaterial color="#43301c" roughness={0.7} metalness={0} />
      </mesh>
      <mesh position={[0.62, 1.05, 0]} castShadow>
        <boxGeometry args={[0.12, 2.15, 0.16]} />
        <meshStandardMaterial color="#43301c" roughness={0.7} metalness={0} />
      </mesh>
      <mesh position={[0, 2.12, 0]} castShadow>
        <boxGeometry args={[1.36, 0.12, 0.16]} />
        <meshStandardMaterial color="#43301c" roughness={0.7} metalness={0} />
      </mesh>
      {/* the closed door slab (planked wood), proud of the wall into the room */}
      <mesh position={[0, 1.02, -0.06]} castShadow receiveShadow>
        <boxGeometry args={[1.02, 2.0, 0.08]} />
        <meshStandardMaterial {...plank} roughness={0.75} metalness={0} />
      </mesh>
      {/* two cross rails for a plank-door look */}
      <mesh position={[0, 0.5, -0.11]} castShadow>
        <boxGeometry args={[0.98, 0.12, 0.03]} />
        <meshStandardMaterial color="#3a2716" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.55, -0.11]} castShadow>
        <boxGeometry args={[0.98, 0.12, 0.03]} />
        <meshStandardMaterial color="#3a2716" roughness={0.7} />
      </mesh>
      {/* iron handle */}
      <mesh position={[0.38, 1.0, -0.13]} castShadow>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#20242a" roughness={0.4} metalness={0.7} />
      </mesh>
    </group>
  );
}

export function Cabin({ freeze }: { freeze: boolean }): JSX.Element {
  return (
    <group>
      <EnvLight />
      <Shell />
      <Rug />
      <Fireplace freeze={freeze} />
      <Cat />
      <Window />
      <Desk />
      <Lamp />
      <Door />
      <SetDressing />

      {/* cool daylight from OUTSIDE the window, angled down into the room. It casts shadow, so the
          +X wall blocks it everywhere except through the opening → a real window-shaped light shaft
          + muntin-cross shadow on the floor. No light touches the interior window wall directly. */}
      <directionalLight
        position={[ROOM.hx + 6, 5, 1.2]}
        color="#93add8"
        intensity={3.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-camera-near={0.5}
        shadow-camera-far={22}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      {/* soft cool ambient so shadows read, never crush to black */}
      <ambientLight color="#33425f" intensity={0.42} />
    </group>
  );
}
