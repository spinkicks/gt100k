/**
 * The Tinker Workshop cabin scene: an enclosed pine room with a lit fireplace (warm key), a cool
 * window fill, a cat on the hearth, and a desk coding-station. Built with procedural PBR wood +
 * primitives for the first-light/materials phases; the grind loop swaps in richer geometry/assets.
 *
 * Determinism: all animation is a pure function of clock time and is frozen (fixed phase) when
 * `freeze` is set, so `?freeze=1` shots are reproducible. No Math.random in the render loop.
 */
import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Component, type ReactNode, Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { updateStats } from "../core/hook";
import { useAssetReady } from "../core/useAssetReady";
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

const WOOD_TEX = {
  map: "/assets/textures/wood_diff.jpg",
  normalMap: "/assets/textures/wood_nor.jpg",
  roughnessMap: "/assets/textures/wood_rough.jpg",
};

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
      {/* warm tint multiplies the scanned (greyish) planks toward the cabin's cozy palette */}
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
  const embersRef = useRef<THREE.Group>(null);
  const [ax, , az] = ANCHORS.fireplace;
  const stone = useMemo(() => stoneTextures(), []);
  const flame = useMemo(() => flameTexture(), []);

  // additive flame sprites: [x, baseY, width, height, opacity] — clustered into one tongue cluster
  const sprites: Array<[number, number, number, number, number]> = [
    [0, 0, 0.52, 0.92, 0.9],
    [-0.13, 0, 0.32, 0.6, 0.7],
    [0.14, 0, 0.3, 0.56, 0.7],
    [0, 0.02, 0.24, 0.42, 0.95],
  ];
  // ember sparks that drift up from the coals: [x, z, phase, speed, size]
  const embers: Array<[number, number, number, number, number]> = [
    [-0.18, 0.36, 0.0, 0.9, 0.05],
    [0.12, 0.42, 2.1, 1.2, 0.04],
    [0.02, 0.3, 4.0, 0.7, 0.055],
    [0.22, 0.38, 1.2, 1.05, 0.035],
    [-0.1, 0.44, 3.3, 0.85, 0.045],
  ];

  useEffect(() => {
    updateStats({ fireLit: true });
  }, []);

  useFrame((state) => {
    const t = freeze ? FROZEN_T : state.clock.elapsedTime;
    const flicker =
      1 + Math.sin(t * 12) * 0.09 + Math.sin(t * 27.3) * 0.05 + Math.sin(t * 3.1) * 0.03;
    if (keyLight.current) keyLight.current.intensity = 24 * flicker;
    // per-tongue life: each flame sways + breathes on its own phase (livelier than a group scale)
    const g = flames.current;
    if (g) {
      g.children.forEach((c, i) => {
        const baseH = sprites[i]?.[3] ?? 0.6;
        const ph = i * 1.7;
        c.scale.y = baseH * (1 + Math.sin(t * (9 + i * 2.3) + ph) * 0.16);
        c.position.x = (sprites[i]?.[0] ?? 0) + Math.sin(t * (4 + i) + ph) * 0.025;
      });
    }
    // embers drift up + fade over a ~0.7m loop (deterministic; frozen when freeze=1)
    const eg = embersRef.current;
    if (eg) {
      eg.children.forEach((c, i) => {
        const [ex, , phase, speed] = embers[i] ?? [0, 0, 0, 1, 0.04];
        const u = ((t * speed + phase) % 2) / 2; // 0..1 rise
        c.position.y = 0.05 + u * 0.7;
        c.position.x = ex + Math.sin(t * 2 + phase) * 0.05;
        const s = c as THREE.Sprite;
        if (s.material) s.material.opacity = Math.max(0, 0.9 * (1 - u));
      });
    }
  });

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
      {/* ember bed — a cluster of glowing coal lumps (reads as coals, not a slab) */}
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
      {/* ember sparks drifting up from the coals (positions animated in useFrame) */}
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

const CAT_MODEL_URL = "/assets/models/cat.glb";

/** Real cat model, dropped in via Blender MCP export (see docs/BLENDER_MCP.md). Falls back to the
 *  procedural cat when the GLB is absent. Adjust scale/rotation to match your exported model. */
function GltfCat(): JSX.Element {
  const [x, , z] = ANCHORS.cat;
  const { scene } = useGLTF(CAT_MODEL_URL);
  const model = useMemo(() => scene.clone(true), [scene]);
  useEffect(() => {
    model.traverse((o) => {
      o.castShadow = true;
      o.receiveShadow = true;
    });
    updateStats({ catVisible: true });
  }, [model]);
  return <primitive object={model} position={[x, 0.02, z]} rotation={[0, -0.7, 0]} scale={0.4} />;
}

/** Renders the procedural cat if the GLB is missing / fails to load. */
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
  // Only mount the glTF loader once we've confirmed the GLB really exists (a dev server answers a
  // missing path with index.html, which would crash the loader). Otherwise show the procedural cat.
  const hasModel = useAssetReady(CAT_MODEL_URL);
  if (!hasModel) return <ProceduralCat />;
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
  useEffect(() => {
    updateStats({ catVisible: true });
  }, []);
  // Curled two-tone tabby (fallback when no glTF cat is present).
  const brown = <meshStandardMaterial color="#6f4f34" roughness={0.9} metalness={0} />;
  const cream = <meshStandardMaterial color="#c9ab84" roughness={0.9} metalness={0} />;
  const pink = <meshStandardMaterial color="#b07a6e" roughness={0.9} metalness={0} />;
  return (
    <group position={[x, 0.14, z]} rotation={[0, -0.7, 0]}>
      {/* curled body (brown back) */}
      <mesh castShadow receiveShadow scale={[1.2, 0.74, 0.98]}>
        <sphereGeometry args={[0.3, 24, 18]} />
        {brown}
      </mesh>
      {/* cream belly/chest patch, slightly front-low */}
      <mesh position={[0.12, -0.06, 0.16]} castShadow scale={[0.95, 0.55, 0.7]}>
        <sphereGeometry args={[0.26, 20, 16]} />
        {cream}
      </mesh>
      {/* front paws tucked (cream) */}
      {(
        [
          [0.34, -0.02, 0.02],
          [0.32, -0.03, 0.16],
        ] as Array<[number, number, number]>
      ).map(([px, py, pz]) => (
        <mesh
          key={`paw-${pz}`}
          position={[px, py, pz]}
          rotation={[0, 0, 0.2]}
          castShadow
          scale={[1.4, 0.7, 0.7]}
        >
          <sphereGeometry args={[0.07, 12, 10]} />
          {cream}
        </mesh>
      ))}
      {/* head */}
      <mesh position={[0.32, 0.08, 0.1]} castShadow scale={[0.9, 0.85, 0.9]}>
        <sphereGeometry args={[0.16, 20, 16]} />
        {brown}
      </mesh>
      {/* muzzle (cream) + nose */}
      <mesh position={[0.45, 0.03, 0.1]} castShadow scale={[0.7, 0.6, 0.8]}>
        <sphereGeometry args={[0.08, 14, 12]} />
        {cream}
      </mesh>
      <mesh position={[0.51, 0.04, 0.1]} castShadow>
        <sphereGeometry args={[0.02, 8, 8]} />
        {pink}
      </mesh>
      {/* ears — brown outer + pink inner */}
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
      {/* tail curled around to the front */}
      <mesh position={[-0.22, -0.02, -0.16]} rotation={[Math.PI / 2, 0.5, 0]} castShadow>
        <torusGeometry args={[0.18, 0.05, 10, 20, Math.PI * 1.4]} />
        {brown}
      </mesh>
    </group>
  );
}

/** Procedural conifers standing outside the window: near parallax + they mask the mountain-plane
 *  edges so no black shows at oblique angles. Unlit-ish dark greens; static (deterministic). */
function ExteriorTrees({ originX }: { originX: number }): JSX.Element {
  // [dx from wall, z, height, green]
  const trees: Array<[number, number, number, string]> = [
    [2.7, -3.5, 4.6, "#26402b"],
    [3.5, 3.3, 5.2, "#223a27"],
    [4.3, -1.5, 5.8, "#2b4630"],
    [4.8, 1.9, 5.0, "#20361f"],
    [6.0, -0.2, 6.6, "#1b2f20"],
  ];
  return (
    <group>
      {/* exterior forest floor (y=0, coplanar with the tree bases) so the trees are planted, not
          floating. Starts at the wall and extends outward only — never under the cabin. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[originX + 28, 0, 0]}>
        <planeGeometry args={[56, 80]} />
        <meshStandardMaterial color="#3a4b2e" roughness={1} metalness={0} />
      </mesh>
      {trees.map(([dx, z, h, green]) => (
        <group key={`tree-${dx}-${z}`} position={[originX + dx, 0, z]}>
          {/* trunk */}
          <mesh position={[0, h * 0.18, 0]}>
            <cylinderGeometry args={[0.06, 0.09, h * 0.36, 8]} />
            <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
          </mesh>
          {/* stacked foliage cones */}
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
  const far = useMemo(() => mountainLayerTexture("#8397b8", 0.5, 26, 11, 0.85), []);
  const mid = useMemo(() => mountainLayerTexture("#566a90", 0.62, 40, 23, 0.5), []);
  const near = useMemo(() => mountainLayerTexture("#33405a", 0.74, 60, 37, 0.2), []);

  return (
    <group>
      {/* view OUTSIDE the opening. An all-encompassing sky DOME (back-side sphere) guarantees sky at
          every viewing angle — no black gap even looking obliquely. Mountain layers + conifer trees
          sit in front of it at increasing distance for parallax; the trees also mask the plane edges. */}
      <group>
        <mesh scale={70}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial map={sky} side={THREE.BackSide} toneMapped fog={false} />
        </mesh>
        <mesh position={[x + 9, 3.4, 0.3]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[60, 16]} />
          <meshBasicMaterial map={far} transparent toneMapped />
        </mesh>
        <mesh position={[x + 6, 2.7, 0.1]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[40, 13]} />
          <meshBasicMaterial map={mid} transparent toneMapped />
        </mesh>
        <mesh position={[x + 3.6, 2.2, -0.2]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[28, 12]} />
          <meshBasicMaterial map={near} transparent toneMapped />
        </mesh>
        <ExteriorTrees originX={x} />
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
      <ambientLight color="#2b3852" intensity={0.28} />
    </group>
  );
}
