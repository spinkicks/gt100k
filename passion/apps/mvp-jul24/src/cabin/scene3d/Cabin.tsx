/**
 * The gt100k cabin scene: an enclosed warm-wood room with a lit stone fireplace, a wool hearth rug,
 * a window onto a real mountain vista, a curled cat, and a wall lantern — built from real CC0
 * scanned PBR/HDRI/GLB assets (scripts/fetch-assets.mjs) with a graceful procedural fallback for
 * every one of them, so a fresh clone / CI still builds and looks intentional offline.
 *
 * Ported/trimmed from passion/apps/tinker-cabin/cabin/src/scene/Cabin.tsx: dropped the WASD
 * controller, physics, and tinker-specific interactive gadgets (this app has its own gadget system —
 * see GadgetProps.tsx) and the grass-tuft instancing (kept the forest silhouette, dropped the
 * per-blade field) to stay lean for a fixed-camera point-and-click scene.
 *
 * Determinism: all animation is a pure function of clock time — no Math.random in the render loop —
 * so screenshots stay reproducible.
 */
import { ContactShadows, useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Component, type ReactNode, Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import type { TopicId } from "../../game/types";
import { GadgetPropView } from "./GadgetProps";
import { SkyDome } from "./SkyDome";
import { gadgetProps3D } from "./anchors";
import { ANCHORS, ROOM } from "./layout";
import {
  catFurTexture,
  flameTexture,
  floorTextures,
  grassTexture,
  rugTexture,
  stoneTextures,
  wallTextures,
} from "./textures";
import { useAssetReady } from "./useAssetReady";

const WOOD_TEX = {
  map: "/assets/textures/wood_diff.jpg",
  normalMap: "/assets/textures/wood_nor.jpg",
  roughnessMap: "/assets/textures/wood_rough.jpg",
};
// Kick these fetches off at import time (in parallel with the HEAD "does this asset exist"
// probes below and with the HDR/vista preloads in EnvLight/SkyDome) instead of waiting for
// useAssetReady to flip and only THEN starting the real load — shaves a sequential network
// round-trip off time-to-real-textures. Harmless no-op on a fresh clone/CI where the files are
// gitignored/absent: the rejected promise just never gets read because mounting stays gated
// behind useAssetReady/Suspense boundaries below.
useTexture.preload(Object.values(WOOD_TEX));

/** Floor with real scanned CC0 wood when fetched, else the procedural plank material. */
function ProceduralFloor(): JSX.Element {
  const { hx, hz } = ROOM;
  const floor = useMemo(() => floorTextures(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[hx * 2, hz * 2]} />
      <meshStandardMaterial {...floor} roughness={0.78} metalness={0} />
    </mesh>
  );
}

function TexturedFloor(): JSX.Element {
  const { hx, hz } = ROOM;
  const tex = useTexture(WOOD_TEX);
  useMemo(() => {
    for (const [key, t] of Object.entries(tex)) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(3, 3);
      t.colorSpace = key === "map" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = 8;
      t.needsUpdate = true;
    }
  }, [tex]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[hx * 2, hz * 2]} />
      <meshStandardMaterial {...tex} color="#caa579" roughness={0.85} metalness={0} />
    </mesh>
  );
}

function Floor(): JSX.Element {
  const hasWood = useAssetReady(WOOD_TEX.map);
  if (!hasWood) return <ProceduralFloor />;
  return (
    <Suspense fallback={<ProceduralFloor />}>
      <TexturedFloor />
    </Suspense>
  );
}

function Shell(): JSX.Element {
  const wall = useMemo(() => wallTextures(), []);
  const { hx, hz, height, wall: tw } = ROOM;
  return (
    <group>
      <Floor />
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]} receiveShadow>
        <planeGeometry args={[hx * 2, hz * 2]} />
        <meshStandardMaterial color="#241a10" roughness={0.95} metalness={0} />
      </mesh>
      {/* exposed timber roof beams */}
      <group>
        {Array.from({ length: 6 }, (_, k) => {
          const z = -hz + 0.35 + (k * (hz * 2 - 0.7)) / 5;
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
        {[-hx * 0.55, hx * 0.55].map((x) => (
          <mesh key={`purlin-${x}`} position={[x, height - 0.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.16, hz * 2]} />
            <meshStandardMaterial color="#2f2013" roughness={0.85} metalness={0} />
          </mesh>
        ))}
      </group>
      {/* back wall (-Z, fireplace) */}
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
      {/* right wall (+X) — built as 4 segments AROUND a real window opening so exterior light only
          enters through the hole and the mountain view behind it parallaxes. */}
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

function Fireplace(): JSX.Element {
  const keyLight = useRef<THREE.PointLight>(null);
  const flames = useRef<THREE.Group>(null);
  const embersRef = useRef<THREE.Group>(null);
  const [ax, , az] = ANCHORS.fireplace;
  const stone = useMemo(() => stoneTextures(), []);
  const flame = useMemo(() => flameTexture(), []);

  const sprites: Array<[number, number, number, number, number]> = [
    [0, 0, 0.6, 1.0, 0.6],
    [-0.09, 0, 0.44, 0.72, 0.4],
    [0.1, 0, 0.42, 0.66, 0.4],
    [0, 0.0, 0.28, 0.52, 0.6],
  ];
  const embers: Array<[number, number, number, number, number]> = [
    [-0.18, 0.36, 0.0, 0.9, 0.05],
    [0.12, 0.42, 2.1, 1.2, 0.04],
    [0.02, 0.3, 4.0, 0.7, 0.055],
    [0.22, 0.38, 1.2, 1.05, 0.035],
    [-0.1, 0.44, 3.3, 0.85, 0.045],
  ];

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const flicker =
      1 + Math.sin(t * 12) * 0.09 + Math.sin(t * 27.3) * 0.05 + Math.sin(t * 3.1) * 0.03;
    if (keyLight.current) keyLight.current.intensity = 15 * flicker;
    const g = flames.current;
    if (g) {
      g.children.forEach((c, i) => {
        const baseH = sprites[i]?.[3] ?? 0.6;
        const ph = i * 1.7;
        c.scale.y = baseH * (1 + Math.sin(t * (9 + i * 2.3) + ph) * 0.16);
        c.position.x = (sprites[i]?.[0] ?? 0) + Math.sin(t * (4 + i) + ph) * 0.025;
      });
    }
    const eg = embersRef.current;
    if (eg) {
      eg.children.forEach((c, i) => {
        const [ex, , phase, speed] = embers[i] ?? [0, 0, 0, 1, 0.04];
        const u = ((t * speed + phase) % 2) / 2;
        c.position.y = 0.05 + u * 0.7;
        c.position.x = ex + Math.sin(t * 2 + phase) * 0.05;
        const s = c as THREE.Sprite;
        if (s.material) s.material.opacity = Math.max(0, 0.9 * (1 - u));
      });
    }
  });

  return (
    <group position={[ax, 0, az + 0.35]}>
      {/* full-height stone chimney breast */}
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
      {/* wooden mantel shelf */}
      <mesh position={[0, 2.05, 0.25]} castShadow>
        <boxGeometry args={[2.8, 0.2, 0.85]} />
        <meshStandardMaterial color="#5a3d22" roughness={0.7} metalness={0} />
      </mesh>
      {/* ember bed */}
      {(
        [
          [-0.28, 0.22, 0.4, 0.09, 3.6],
          [-0.05, 0.2, 0.44, 0.11, 4.2],
          [0.2, 0.21, 0.4, 0.1, 3.4],
          [0.34, 0.2, 0.36, 0.07, 2.8],
          [0.05, 0.19, 0.34, 0.08, 3.0],
        ] as Array<[number, number, number, number, number]>
      ).map(([x, y, z, r, ei]) => (
        <mesh key={`coal-${x}-${z}`} position={[x, y, z]}>
          <sphereGeometry args={[r, 10, 8]} />
          <meshStandardMaterial
            color="#ff7a2a"
            emissive="#e03808"
            emissiveIntensity={ei}
            roughness={1}
          />
        </mesh>
      ))}
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
      {/* soft additive flame sprites */}
      <group ref={flames} position={[0, 0.24, 0.58]}>
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
      {/* ember sparks */}
      <group ref={embersRef}>
        {embers.map(([ex, ez, , , size]) => (
          <sprite key={`ember-${ex}-${ez}`} position={[ex, 0.1, ez]} scale={[size, size, 1]}>
            <spriteMaterial
              map={flame}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              transparent
              opacity={0.9}
              toneMapped={false}
              color="#ffb460"
            />
          </sprite>
        ))}
      </group>
      {/* warm key light from the fire */}
      <pointLight
        ref={keyLight}
        position={[0, 0.8, 0.3]}
        color="#ff7a2a"
        intensity={15}
        distance={11}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />
    </group>
  );
}

const CAT_MODEL_URL = "/assets/models/cat.glb";
useGLTF.preload(CAT_MODEL_URL);

/** Real CC0 cat GLB (via fetch-assets), auto-normalized to fit + grounded. Falls back to the
 *  procedural cat if the GLB is absent/fails to load. */
function GltfCat(): JSX.Element {
  const [x, , z] = ANCHORS.cat;
  const { scene } = useGLTF(CAT_MODEL_URL);
  const model = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((o) => {
      o.castShadow = true;
      o.receiveShadow = true;
      const mesh = o as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "metalness" in mat) {
        const m = mat.clone();
        m.metalness = 0;
        m.roughness = 0.85;
        mesh.material = m;
      }
    });
    s.updateMatrixWorld(true);
    const size = new THREE.Vector3();
    new THREE.Box3().setFromObject(s).getSize(size);
    const longest = Math.max(size.x, size.y, size.z);
    const k = longest > 0 ? 0.72 / longest : 1;
    s.scale.setScalar(k);
    s.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(s);
    const c = new THREE.Vector3();
    box2.getCenter(c);
    s.position.set(-c.x, -box2.min.y, -c.z);
    return s;
  }, [scene]);
  return (
    <group position={[x, 0, z]} rotation={[0, -0.6, 0]}>
      <primitive object={model} />
    </group>
  );
}

class CatBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  render(): ReactNode {
    return this.state.failed ? <ProceduralCat /> : this.props.children;
  }
}

function Cat(): JSX.Element {
  const hasGlb = useAssetReady(CAT_MODEL_URL);
  if (!hasGlb) return <ProceduralCat />;
  return (
    <CatBoundary>
      <Suspense fallback={<ProceduralCat />}>
        <GltfCat />
      </Suspense>
    </CatBoundary>
  );
}

function ProceduralCat(): JSX.Element {
  const [x, , z] = ANCHORS.cat;
  const coatFur = useMemo(() => catFurTexture([111, 79, 52], [58, 38, 22], 71, true), []);
  const bellyFur = useMemo(() => catFurTexture([201, 171, 132], [150, 120, 88], 72, false), []);
  const brown = (
    <meshStandardMaterial {...coatFur} color="#6f4f34" roughness={0.95} metalness={0} />
  );
  const cream = (
    <meshStandardMaterial {...bellyFur} color="#c9ab84" roughness={0.95} metalness={0} />
  );
  const pink = <meshStandardMaterial color="#b07a6e" roughness={0.9} metalness={0} />;
  return (
    <group position={[x, 0.14, z]} rotation={[0, -0.7, 0]}>
      <mesh castShadow receiveShadow scale={[1.2, 0.74, 0.98]}>
        <sphereGeometry args={[0.3, 24, 18]} />
        {brown}
      </mesh>
      <mesh position={[0.12, -0.06, 0.16]} castShadow scale={[0.95, 0.55, 0.7]}>
        <sphereGeometry args={[0.26, 20, 16]} />
        {cream}
      </mesh>
      <mesh position={[0.32, 0.08, 0.1]} castShadow scale={[0.9, 0.85, 0.9]}>
        <sphereGeometry args={[0.16, 20, 16]} />
        {brown}
      </mesh>
      <mesh position={[0.45, 0.03, 0.1]} castShadow scale={[0.7, 0.6, 0.8]}>
        <sphereGeometry args={[0.08, 14, 12]} />
        {cream}
      </mesh>
      <mesh position={[0.51, 0.04, 0.1]} castShadow>
        <sphereGeometry args={[0.02, 8, 8]} />
        {pink}
      </mesh>
      {(
        [
          [0.28, 0.22, 0.02],
          [0.28, 0.22, 0.2],
        ] as Array<[number, number, number]>
      ).map(([ex, ey, ez]) => (
        <group key={`ear-${ez}`} position={[ex, ey, ez]} rotation={[0, 0, -0.25]}>
          <mesh castShadow>
            <coneGeometry args={[0.055, 0.11, 10]} />
            {brown}
          </mesh>
          <mesh position={[0.01, -0.005, 0]} scale={[0.6, 0.7, 0.6]}>
            <coneGeometry args={[0.055, 0.11, 10]} />
            {pink}
          </mesh>
        </group>
      ))}
      <mesh position={[-0.22, -0.02, -0.16]} rotation={[Math.PI / 2, 0.5, 0]} castShadow>
        <torusGeometry args={[0.18, 0.05, 10, 20, Math.PI * 1.4]} />
        {brown}
      </mesh>
    </group>
  );
}

const PINE_MODEL_URL = "/assets/models/pine.glb";
useGLTF.preload(PINE_MODEL_URL);
const TREE_SPOTS: Array<[number, number, number, string]> = [
  [5.5, -7.8, 5.0, "#26402b"],
  [6.0, 7.6, 5.4, "#223a27"],
  [12.5, -9.5, 7.2, "#2b4630"],
  [11.5, 8.8, 6.6, "#20361f"],
];

function fitToHeight(src: THREE.Object3D, targetH: number): THREE.Object3D {
  const s = src.clone(true);
  s.traverse((o) => {
    o.castShadow = false;
    o.receiveShadow = false;
  });
  s.updateMatrixWorld(true);
  const size = new THREE.Vector3();
  new THREE.Box3().setFromObject(s).getSize(size);
  s.scale.setScalar(size.y > 0 ? targetH / size.y : 1);
  s.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(s);
  const c = new THREE.Vector3();
  box.getCenter(c);
  s.position.set(-c.x, -box.min.y, -c.z);
  return s;
}

function PineTrees({ originX }: { originX: number }): JSX.Element {
  const { scene } = useGLTF(PINE_MODEL_URL);
  const models = useMemo(() => TREE_SPOTS.map(([, , h]) => fitToHeight(scene, h)), [scene]);
  return (
    <group>
      {TREE_SPOTS.map(([dx, z], i) => (
        <group key={`pine-${dx}-${z}`} position={[originX + dx, 0, z]} rotation={[0, i * 1.27, 0]}>
          <primitive object={models[i] as THREE.Object3D} />
        </group>
      ))}
    </group>
  );
}

function ConeTrees({ originX }: { originX: number }): JSX.Element {
  return (
    <>
      {TREE_SPOTS.map(([dx, z, h, green]) => (
        <group key={`cone-${dx}-${z}`} position={[originX + dx, 0, z]}>
          <mesh position={[0, h * 0.18, 0]}>
            <cylinderGeometry args={[0.06, 0.09, h * 0.36, 8]} />
            <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
          </mesh>
          {[0, 1, 2].map((tier) => {
            const ty = h * (0.32 + tier * 0.22);
            const r = (0.6 - tier * 0.14) * (h / 5);
            const ch = h * 0.34 * (1 - tier * 0.12);
            return (
              <mesh key={`t-${tier}`} position={[0, ty, 0]}>
                <coneGeometry args={[r, ch, 9]} />
                <meshStandardMaterial color={green} roughness={0.95} metalness={0} />
              </mesh>
            );
          })}
        </group>
      ))}
    </>
  );
}

class TreesBoundary extends Component<
  { originX: number; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  render(): ReactNode {
    return this.state.failed ? <ConeTrees originX={this.props.originX} /> : this.props.children;
  }
}

function ExteriorTrees({ originX }: { originX: number }): JSX.Element {
  const grass = useMemo(() => grassTexture(), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[originX + 17, -0.03, 0]}>
        <planeGeometry args={[34, 64]} />
        <meshBasicMaterial map={grass} color="#aeb884" toneMapped={false} fog={false} />
      </mesh>
      <TreesBoundary originX={originX}>
        <Suspense fallback={<ConeTrees originX={originX} />}>
          <PineTrees originX={originX} />
        </Suspense>
      </TreesBoundary>
    </group>
  );
}

/**
 * The window: a wooden frame + muntins around the wall opening, plus the mountain view rendered
 * outside the wall (sky dome + trees) so the view parallaxes as the camera would move.
 */
function Window(): JSX.Element {
  const [x] = ANCHORS.window;
  const cy = 1.75;
  const iface = x - 0.26;
  return (
    <group>
      <group>
        <SkyDome />
        <ExteriorTrees originX={x} />
      </group>
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
        <mesh position={[0, 0, 0.05]} castShadow>
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

function Rug(): JSX.Element {
  const rug = useMemo(() => rugTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -1.5]} receiveShadow>
      <planeGeometry args={[2.6, 1.9]} />
      <meshStandardMaterial map={rug} roughness={0.9} metalness={0} />
    </mesh>
  );
}

/** A simple always-lit wall lantern (no interactive on/off mechanic — this app's gadgets are the
 *  interactive objects) for a warm secondary light pool near the fireplace, cabin-static-art style. */
function WallLantern(): JSX.Element {
  const glassRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (glassRef.current) {
      const t = state.clock.elapsedTime;
      glassRef.current.emissiveIntensity = 1.1 + Math.sin(t * 5) * 0.08 + Math.sin(t * 11) * 0.05;
    }
  });
  const { hx, hz } = ROOM;
  return (
    <group position={[hx - 0.12, 1.85, -hz + 1.1]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.16, 0.28, 0.14]} />
        <meshStandardMaterial color="#20242a" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[0.1, 0.2, 0.08]} />
        <meshStandardMaterial
          ref={glassRef}
          color="#ffcf87"
          emissive="#ffb15e"
          emissiveIntensity={1.1}
        />
      </mesh>
      <pointLight position={[0, 0, 0.1]} color="#ffb15e" intensity={2.2} distance={4} decay={2} />
    </group>
  );
}

function SetDressing(): JSX.Element {
  const { hx, hz } = ROOM;
  const inX = hx - 0.16;
  const inZ = hz - 0.16;
  return (
    <group>
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
    </group>
  );
}

export function Cabin({ topic }: { topic: TopicId }): JSX.Element {
  // May legitimately be empty — the `math` cabin is active on the map but has no gadgets yet (see
  // anchors.ts / gadgets/registry.ts). Everything below the props list is topic-independent room, so
  // an empty list yields a fully furnished, lit, gadget-free cabin rather than an empty screen.
  const props = gadgetProps3D(topic);
  return (
    <group>
      <Shell />
      <Rug />
      <Fireplace />
      <Cat />
      <Window />
      <WallLantern />
      <SetDressing />
      {/* Soft contact shadow under the hearth rug/cat so they read as sitting IN the room rather
          than floating over the floor. frames=1: the room's occluders never move, so the blurred
          shadow render-to-texture only needs to happen once, not every frame. */}
      <ContactShadows
        position={[0, 0.011, -1.35]}
        opacity={0.55}
        scale={5.5}
        blur={2.2}
        far={2.5}
        color="#0c0603"
        frames={1}
      />

      {props.map((prop) => (
        <GadgetPropView key={prop.id} prop={prop} />
      ))}

      {/* cool daylight from OUTSIDE the window, angled down into the room. Casts shadow, so the +X
          wall blocks it everywhere except through the opening → a real window-shaped light shaft. */}
      <directionalLight
        position={[ROOM.hx + 6, 5, 1.2]}
        color="#93add8"
        intensity={2.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
        shadow-camera-near={0.5}
        shadow-camera-far={22}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      {/* soft cool ambient so shadows read, never crush to black */}
      <ambientLight color="#2b3852" intensity={0.42} />
      {/* low warm fill from the fire's general direction so anything back-lit or off to the side
          (the cat curled by the hearth) doesn't read as a featureless dark silhouette. */}
      <hemisphereLight color="#5a3a20" groundColor="#0c0704" intensity={0.35} />
    </group>
  );
}
