/**
 * Beam board (logic / reflection). A code-driven optics puzzle: a light beam leaves the emitter and
 * travels a 3×3 grid; the player sets each MIRROR's orientation ("/" or "\") in code and the beam
 * reflects LIVE, lighting the cells it passes. Land it on the target sensor and the target fires a
 * real point light (the lighting engine) + glows green. Mirror ops come from `store.beam.data`
 * (pushed by the challenge as you edit), so the beam re-routes the instant you pick an orientation.
 *
 * Determinism: everything derives from `store.beam.data` (or a fixed default) + frozen clock time.
 */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { GADGET_FROZEN_T, type GadgetStore } from "./gadgetState";

// grid + fixed elements (col, row), col/row ∈ 0..2. Emitter shoots RIGHT from (0,0). Three mirrors:
// A(2,0) B(2,2) C(0,2); target at (0,1). Solution routes right→up→left→down into the sensor.
const MIRROR_CELLS: Array<[number, number]> = [
  [2, 0],
  [2, 2],
  [0, 2],
];
const TARGET_CELL: [number, number] = [0, 1];
export const BEAM_START = [1, 1, 1]; // deliberately-wrong (all "\") → beam falls off the board
export const BEAM_SOLUTION = [0, 1, 0]; // "/", "\", "/" → routes the beam onto the target
const C = 0.15; // cell size (metres)

// board faces the room (+Z); viewed from +Z looking -Z, world +x is screen-RIGHT, so increasing col
// (the beam's "right") maps to +x directly. cellPos is used by cells/mirrors/beam/target alike.
const cellPos = (c: number, r: number): [number, number, number] => [
  (c - 1) * C,
  (r - 1) * C,
  0.035,
];

/** Reflect a grid direction off a mirror op (0 = "/", 1 = "\"). */
function reflect(dc: number, dr: number, op: number): [number, number] {
  return op === 0 ? [dr, dc] : [-dr, -dc];
}

/** Trace the beam through the grid given the two mirror ops. Returns the lit path + whether it hit. */
export function traceBeam(ops: number[]): { path: Array<[number, number]>; hit: boolean } {
  const mirrorOp = (c: number, r: number): number | null => {
    for (let i = 0; i < MIRROR_CELLS.length; i++) {
      const cell = MIRROR_CELLS[i]!;
      if (cell[0] === c && cell[1] === r) return ops[i] ?? 0;
    }
    return null;
  };
  let c = 0;
  let r = 0;
  let dc = 1;
  let dr = 0;
  const path: Array<[number, number]> = [[0, 0]];
  let hit = false;
  for (let i = 0; i < 12; i++) {
    const m = mirrorOp(c, r);
    if (m !== null) [dc, dr] = reflect(dc, dr, m);
    c += dc;
    r += dr;
    if (c < 0 || c > 2 || r < 0 || r > 2) break; // left the board → miss
    path.push([c, r]);
    if (c === TARGET_CELL[0] && r === TARGET_CELL[1]) {
      hit = true;
      break;
    }
  }
  return { path, hit };
}

const SEG_MAX = 9; // max beam segments we pre-allocate + reposition each frame

export function Beam({
  store,
  freeze,
}: {
  store: GadgetStore;
  freeze: boolean;
}): JSX.Element {
  const segs = useRef<Array<THREE.Mesh | null>>([]);
  const mirrors = useRef<Array<THREE.Group | null>>([]);
  const targetMat = useRef<THREE.MeshStandardMaterial>(null);
  const targetLight = useRef<THREE.PointLight>(null);
  const flowLight = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = freeze ? GADGET_FROZEN_T : state.clock.elapsedTime;
    const st = store.beam;
    const data = st?.data ?? (st?.discovered ? BEAM_SOLUTION : BEAM_START);
    const { path, hit } = traceBeam(data);
    // draw the beam as glowing segments between consecutive path cells (a connected laser line)
    for (let i = 0; i < SEG_MAX; i++) {
      const m = segs.current[i];
      if (!m) continue;
      const a = path[i];
      const b = path[i + 1];
      if (!a || !b) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      const [ax, ay] = cellPos(a[0], a[1]);
      const [bx, by] = cellPos(b[0], b[1]);
      // stagger z slightly per segment so perpendicular segments don't z-fight where they meet
      m.position.set((ax + bx) / 2, (ay + by) / 2, 0.05 + i * 0.0009);
      const horiz = a[1] === b[1];
      m.scale.set(horiz ? C * 1.04 : 0.028, horiz ? 0.028 : C * 1.04, 1);
    }
    // orient the mirrors: "/" = "/" as the player sees it (board x is flipped → sign flipped too)
    mirrors.current.forEach((g, i) => {
      if (g) g.rotation.z = (data[i] ?? 0) === 0 ? -Math.PI / 4 : Math.PI / 4;
    });
    // a bright point light TRAVELS along the beam (real lighting engine, moving) so the light flows
    // from emitter toward the target and lights the board as it goes.
    if (flowLight.current) {
      if (path.length >= 2) {
        const seg = (t * 2.6) % (path.length - 1); // cells/sec along the polyline
        const i = Math.floor(seg);
        const f = seg - i;
        const a = path[i] ?? path[0]!;
        const b = path[i + 1] ?? a;
        const [ax, ay] = cellPos(a[0], a[1]);
        const [bx, by] = cellPos(b[0], b[1]);
        flowLight.current.position.set(ax + (bx - ax) * f, ay + (by - ay) * f, 0.14);
        flowLight.current.intensity = 1.0;
      } else {
        flowLight.current.intensity = 0;
      }
    }
    // target: glows + fires a real light when the beam lands
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    if (targetMat.current) targetMat.current.emissiveIntensity = hit ? 1.2 + 0.8 * pulse : 0.12;
    if (targetLight.current) targetLight.current.intensity = hit ? 1.6 + 0.6 * pulse : 0;
  });

  // mounted on the back (-Z) wall, right of the fireplace, facing into the room (+Z)
  return (
    <group position={[1.95, 1.5, -2.84]}>
      {/* board backing + frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.66, 0.66, 0.06]} />
        <meshStandardMaterial color="#241a12" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <boxGeometry args={[0.58, 0.58, 0.05]} />
        <meshStandardMaterial color="#12100c" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* faint 3×3 grid tiles (static backdrop so the cells read) */}
      {Array.from({ length: 9 }, (_, idx) => {
        const c = idx % 3;
        const r = Math.floor(idx / 3);
        const [x, y, z] = cellPos(c, r);
        return (
          <mesh key={`cell-${c}-${r}`} position={[x, y, z - 0.01]}>
            <boxGeometry args={[0.12, 0.12, 0.015]} />
            <meshStandardMaterial color="#1a1712" roughness={0.6} metalness={0.1} />
          </mesh>
        );
      })}
      {/* beam segments — glowing laser line, repositioned along the path each frame */}
      {Array.from({ length: SEG_MAX }, (_, i) => (
        <mesh
          key={`seg-${i}`}
          visible={false}
          ref={(m) => {
            segs.current[i] = m;
          }}
        >
          <boxGeometry args={[1, 1, 0.02]} />
          <meshStandardMaterial
            color="#ff8a4a"
            emissive="#ff6a2a"
            emissiveIntensity={2.2}
            roughness={0.4}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* emitter — a nub to the player-left of cell (0,0), where the beam starts */}
      <mesh position={[cellPos(0, 0)[0] - 0.09, cellPos(0, 0)[1], 0.04]}>
        <boxGeometry args={[0.05, 0.06, 0.05]} />
        <meshStandardMaterial
          color="#c0492e"
          emissive="#ff5a30"
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>
      {/* mirrors — angled bars the player orients in code */}
      {MIRROR_CELLS.map(([c, r], i) => {
        const [x, y, z] = cellPos(c, r);
        return (
          <group
            key={`mirror-${c}-${r}`}
            // sit ABOVE the beam segments (z) so the ray reads as hitting the mirror, not crossing it
            position={[x, y, z + 0.06]}
            ref={(g) => {
              mirrors.current[i] = g;
            }}
          >
            <mesh castShadow>
              <boxGeometry args={[0.028, 0.17, 0.03]} />
              <meshStandardMaterial color="#cfe6ff" roughness={0.1} metalness={0.85} />
            </mesh>
          </group>
        );
      })}
      {/* target sensor ring at (0,2) — glows green + fires a light when hit */}
      <mesh position={cellPos(TARGET_CELL[0], TARGET_CELL[1])} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.06, 0.018, 12, 20]} />
        <meshStandardMaterial
          ref={targetMat}
          color="#3affa0"
          emissive="#2aff90"
          emissiveIntensity={0.12}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={targetLight}
        position={[
          cellPos(TARGET_CELL[0], TARGET_CELL[1])[0],
          cellPos(TARGET_CELL[0], TARGET_CELL[1])[1],
          0.3,
        ]}
        color="#4dffb0"
        intensity={0}
        distance={1.8}
        decay={2}
      />
      {/* travelling beam light — moves along the path each frame (positioned in useFrame) */}
      <pointLight ref={flowLight} color="#ff8a4a" intensity={0} distance={0.9} decay={2} />
    </group>
  );
}
