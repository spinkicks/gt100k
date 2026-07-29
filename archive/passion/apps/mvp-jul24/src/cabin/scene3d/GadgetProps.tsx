/**
 * The clickable gadget hotspots ARE 3D props in the room — a framed puzzle panel on the wall, a
 * small chess set, or an angled mirror stand — not a floating UI marker. Clicking/tapping the prop
 * mesh calls `useGame.getState().focusGadget(id)`; active gadgets glow warmly (and grow slightly on
 * hover), coming-soon ones sit in the room unlit/dimmed so they still read as "there" without
 * looking interactive.
 */
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useGame } from "../../game/store";
// The app's one seeded PRNG — the prop scatter below must be identical every render. See
// src/lib/rng.ts.
import { mulberry32 } from "../../lib/rng";
import type { FramePattern, GadgetProp3D } from "./anchors";
import "./GadgetProps.css";
import { propTextures } from "./textures";

const ACTIVE_GLOW = "#ffb15e";
const ACTIVE_EMISSIVE = "#c9762a";
const DIM_COLOR = "#5a4a3c";

/** Small deterministic grid/icon canvas per puzzle family so each frame reads as "the right thing"
 *  at a glance, without needing real artwork. */
function patternCanvas(pattern: FramePattern): HTMLCanvasElement {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#efe6d4";
  ctx.fillRect(0, 0, s, s);
  const cells = 8;
  const cw = s / cells;
  const grid = () => {
    ctx.strokeStyle = "rgba(60,40,20,0.35)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= cells; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cw, 0);
      ctx.lineTo(i * cw, s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cw);
      ctx.lineTo(s, i * cw);
      ctx.stroke();
    }
  };
  if (pattern === "nonogram") {
    grid();
    const rand = mulberry32(11);
    ctx.fillStyle = "#241a10";
    for (let y = 0; y < cells; y++)
      for (let x = 0; x < cells; x++) {
        // a simple deterministic "picture" (diamond-ish) rather than pure noise
        const cx = x - cells / 2 + 0.5;
        const cy = y - cells / 2 + 0.5;
        const on = Math.abs(cx) + Math.abs(cy) < 3.4 && rand() > 0.35;
        if (on) ctx.fillRect(x * cw + 2, y * cw + 2, cw - 4, cw - 4);
      }
  } else if (pattern === "logic-grid") {
    grid();
    const rand = mulberry32(23);
    const dots = ["#8a3b2e", "#2e5a4a", "#385a7a", "#8a6a2e"];
    for (let y = 0; y < cells; y++)
      for (let x = 0; x < cells; x++) {
        if (rand() > 0.62) {
          ctx.fillStyle = dots[Math.floor(rand() * dots.length)]!;
          ctx.beginPath();
          ctx.arc(x * cw + cw / 2, y * cw + cw / 2, cw * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }
      }
  } else if (pattern === "minesweeper") {
    grid();
    const rand = mulberry32(37);
    ctx.font = `${cw * 0.5}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const numColors = ["#2b6cb0", "#2f7a3d", "#a02020", "#5a3d8a"];
    for (let y = 0; y < cells; y++)
      for (let x = 0; x < cells; x++) {
        const r = rand();
        if (r > 0.82) {
          ctx.fillStyle = "#1a1a1a";
          ctx.beginPath();
          ctx.arc(x * cw + cw / 2, y * cw + cw / 2, cw * 0.22, 0, Math.PI * 2);
          ctx.fill();
        } else if (r > 0.45) {
          const n = 1 + Math.floor(rand() * 3);
          ctx.fillStyle = numColors[n % numColors.length]!;
          ctx.fillText(String(n), x * cw + cw / 2, y * cw + cw / 2 + 2);
        }
      }
  } else if (pattern === "pipes") {
    grid();
    const rand = mulberry32(41);
    ctx.strokeStyle = "#2b6cb0";
    ctx.lineWidth = cw * 0.22;
    ctx.lineCap = "round";
    let px = 0.5;
    let py = 0.5;
    ctx.beginPath();
    ctx.moveTo(px * cw, py * cw);
    for (let i = 0; i < 10; i++) {
      const horiz = rand() > 0.5;
      px = horiz ? Math.min(cells - 0.5, Math.max(0.5, px + (rand() > 0.5 ? 1 : -1))) : px;
      py = !horiz ? Math.min(cells - 0.5, Math.max(0.5, py + (rand() > 0.5 ? 1 : -1))) : py;
      ctx.lineTo(px * cw, py * cw);
    }
    ctx.stroke();
  } else if (pattern === "lits") {
    grid();
    const rand = mulberry32(53);
    // four tetromino-ish blobs (L, I, T, S silhouettes as simple rectangles) in distinct hues
    const pieces: Array<[number, number, number, number, string]> = [
      [0, 0, 1, 3, "#7a3b2e"],
      [1, 0, 3, 1, "#2e5a4a"],
      [4, 2, 1, 4, "#385a7a"],
      [5, 5, 2, 1, "#8a6a2e"],
    ];
    for (const [gx, gy, gw, gh, col] of pieces) {
      ctx.fillStyle = col;
      ctx.fillRect(gx * cw + 3, gy * cw + 3, gw * cw - 6, gh * cw - 6);
    }
    void rand;
  }
  return c;
}

function useFrameTexture(pattern: FramePattern): THREE.CanvasTexture {
  return useMemo(() => {
    const t = new THREE.CanvasTexture(patternCanvas(pattern));
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [pattern]);
}

/** Shared interactivity: hover-scale + firelight-tinted glow driven by clock time (frozen-friendly —
 *  pure function of elapsedTime, no Math.random in the loop), click → focusGadget. Coming-soon
 *  gadgets render dim/unlit and don't respond to pointer/click. */
function useInteractiveProp(
  id: string,
  status: GadgetProp3D["status"],
): {
  groupRef: React.RefObject<THREE.Group>;
  hovered: boolean;
  handlers: {
    onClick: (e: { stopPropagation: () => void }) => void;
    onPointerOver: (e: { stopPropagation: () => void }) => void;
    onPointerOut: () => void;
  };
  glow: number;
} {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const active = status === "active";
  const glowRef = useRef(0);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const target = hovered && active ? 1.08 : 1;
    g.scale.lerp(new THREE.Vector3(target, target, target), 0.15);
    if (active) {
      const t = state.clock.elapsedTime;
      const flicker = 0.85 + Math.sin(t * 6 + id.length) * 0.1 + Math.sin(t * 13.3) * 0.05;
      glowRef.current = flicker * (hovered ? 1.4 : 1);
    } else {
      glowRef.current = 0;
    }
  });

  return {
    groupRef,
    hovered,
    glow: glowRef.current,
    handlers: {
      onClick: (e) => {
        if (!active) return;
        e.stopPropagation();
        useGame.getState().focusGadget(id);
      },
      onPointerOver: (e) => {
        if (!active) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      },
      onPointerOut: () => {
        setHovered(false);
        document.body.style.cursor = "auto";
      },
    },
  };
}

function GlowLight({ glow }: { glow: number }): JSX.Element {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (ref.current) ref.current.intensity = glow * 1.2;
  });
  return <pointLight ref={ref} color={ACTIVE_GLOW} distance={1.4} decay={2} />;
}

function HoverLabel({
  id,
  label,
  visible,
}: {
  id: string;
  label: string;
  visible: boolean;
}): JSX.Element | null {
  if (!visible) return null;
  return (
    <Html
      center
      distanceFactor={5}
      zIndexRange={[10, 0]}
      occlude={false}
      position={[0, 0.34, 0.02]}
    >
      <div className="cabin3d-gadget-label" data-gadget={id}>
        {label}
      </div>
    </Html>
  );
}

/** A framed puzzle panel hung on the wall — the hotspot for "on paper" grid puzzles. */
function FrameProp({ prop }: { prop: GadgetProp3D }): JSX.Element {
  const { groupRef, hovered, handlers, glow } = useInteractiveProp(prop.id, prop.status);
  const tex = useFrameTexture(prop.pattern);
  const active = prop.status === "active";
  const frameColor = active ? "#4a3320" : "#3a3126";
  const matColor = active ? "#e8e0d0" : "#8a8378";

  return (
    <group
      position={prop.position}
      rotation={[prop.rotation[0], prop.rotation[1], prop.rotation[2]]}
      ref={groupRef}
      {...handlers}
    >
      <mesh castShadow>
        <boxGeometry args={[0.62, 0.62, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.54, 0.54]} />
        <meshStandardMaterial color={matColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.031]}>
        <planeGeometry args={[0.46, 0.46]} />
        <meshStandardMaterial
          map={tex}
          roughness={0.85}
          color={active ? "#ffffff" : "#6b6459"}
          emissive={active ? ACTIVE_EMISSIVE : "#000000"}
          emissiveIntensity={active ? 0.18 + glow * 0.22 : 0}
        />
      </mesh>
      <GlowLight glow={glow} />
      <HoverLabel id={prop.id} label={prop.label} visible={hovered} />
    </group>
  );
}

/** A small chess set on a side table — the hotspot for the chess puzzle. */
function ChessProp({ prop }: { prop: GadgetProp3D }): JSX.Element {
  const { groupRef, hovered, handlers, glow } = useInteractiveProp(prop.id, prop.status);
  const tex = useMemo(() => propTextures(), []);
  const active = prop.status === "active";
  const board = useMemo(() => {
    const s = 256;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d")!;
    const n = 8;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#e8ddc4" : "#5a4530";
        ctx.fillRect((x * s) / n, (y * s) / n, s / n, s / n);
      }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  return (
    <group
      position={prop.position}
      rotation={[prop.rotation[0], prop.rotation[1], prop.rotation[2]]}
      ref={groupRef}
      {...handlers}
    >
      {/* side table */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.34, 0.06, 20]} />
        <meshStandardMaterial {...tex} roughness={0.6} metalness={0} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.5, 12]} />
        <meshStandardMaterial color="#3a2716" roughness={0.7} />
      </mesh>
      {/* board */}
      <mesh position={[0, 0.535, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <planeGeometry args={[0.42, 0.42]} />
        <meshStandardMaterial
          map={board}
          roughness={0.7}
          color={active ? "#ffffff" : "#8a8378"}
          emissive={active ? ACTIVE_EMISSIVE : "#000000"}
          emissiveIntensity={active ? 0.12 + glow * 0.15 : 0}
        />
      </mesh>
      {/* a few pieces (cones = one side, cylinders = the other) */}
      {[-0.14, -0.07, 0, 0.07, 0.14].map((px, i) => (
        <mesh key={`w-${px}`} position={[px, 0.575, -0.14]} castShadow>
          <coneGeometry args={[0.025, 0.07 + (i % 2) * 0.02, 10]} />
          <meshStandardMaterial color="#e8ddc4" roughness={0.5} />
        </mesh>
      ))}
      {[-0.14, -0.07, 0, 0.07, 0.14].map((px, i) => (
        <mesh key={`b-${px}`} position={[px, 0.575, 0.14]} castShadow>
          <cylinderGeometry args={[0.022, 0.03, 0.06 + (i % 2) * 0.02, 10]} />
          <meshStandardMaterial color="#2a2016" roughness={0.5} />
        </mesh>
      ))}
      <GlowLight glow={glow} />
      <HoverLabel id={prop.id} label={prop.label} visible={hovered} />
    </group>
  );
}

/** A small stand with two angled mirror slabs — the hotspot for the mirror-maze puzzle. */
function MirrorProp({ prop }: { prop: GadgetProp3D }): JSX.Element {
  const { groupRef, hovered, handlers, glow } = useInteractiveProp(prop.id, prop.status);
  const tex = useMemo(() => propTextures(), []);
  const active = prop.status === "active";
  const mirrorMat = active ? (
    <meshStandardMaterial color="#dfe8f2" metalness={0.95} roughness={0.06} />
  ) : (
    <meshStandardMaterial color={DIM_COLOR} metalness={0.2} roughness={0.6} />
  );

  return (
    <group
      position={prop.position}
      rotation={[prop.rotation[0], prop.rotation[1], prop.rotation[2]]}
      ref={groupRef}
      {...handlers}
    >
      {/* base */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.04, 0.34]} />
        <meshStandardMaterial {...tex} roughness={0.6} metalness={0} />
      </mesh>
      {/* two angled mirror slabs forming a shallow V, like a mirror-maze corner */}
      <mesh position={[-0.14, 0.32, 0]} rotation={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.32, 0.56, 0.02]} />
        {mirrorMat}
      </mesh>
      <mesh position={[0.14, 0.32, 0]} rotation={[0, -0.55, 0]} castShadow>
        <boxGeometry args={[0.32, 0.56, 0.02]} />
        {mirrorMat}
      </mesh>
      <GlowLight glow={glow} />
      <HoverLabel id={prop.id} label={prop.label} visible={hovered} />
    </group>
  );
}

/** Dispatches a gadget's 3D prop by kind. */
export function GadgetPropView({ prop }: { prop: GadgetProp3D }): JSX.Element {
  if (prop.kind === "chess") return <ChessProp prop={prop} />;
  if (prop.kind === "mirror") return <MirrorProp prop={prop} />;
  return <FrameProp prop={prop} />;
}
