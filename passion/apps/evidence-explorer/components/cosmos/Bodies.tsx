"use client";
/**
 * Procedural node bodies (§U8.12 / §U5.2) — each of the 8 node types is a **distinct** three.js
 * primitive in its own type hue with an emissive core, so meaning never rests on colour alone
 * (body-shape + colour + the always-present text Ledger). All geometry is procedural: **no external
 * fetch, ever** (FR-E19). Human-owned Outcomes wear a gold seal ring; the Assistance comet carries a
 * calm icy tail (the "Declared — cited" semantics live in the neutral Ledger, never as an accusation).
 *
 * Bodies gently float when `animate` is true (cinematic idle life); under reduced motion / standard3d
 * they are perfectly still. Ambient float is decorative and seeded off `birthOrder`, never random.
 */
import type { NodeView } from "@gt100k/evidence-explorer-view";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { JSX } from "react";
import * as THREE from "three";
import type { VerifyVisualState } from "../verify-machine.js";
import { COSMOS, roleHex } from "./palette.js";

/** Build a filled 5-point star `ShapeGeometry`-free extrude (warm-gold Review body). */
function useStarGeometry(): THREE.ExtrudeGeometry {
  return useMemo(() => {
    const shape = new THREE.Shape();
    const spikes = 5;
    const outer = 0.72;
    const inner = 0.3;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
    });
    geo.center();
    return geo;
  }, []);
}

/** Shared emissive material props tuned per role hue. */
function emissive(hex: string, intensity = 1.4) {
  return {
    color: hex,
    emissive: hex,
    emissiveIntensity: intensity,
    roughness: 0.35,
    metalness: 0.1,
  };
}

function BodyMesh({
  node,
  star,
  hexOverride,
}: {
  node: NodeView;
  star: THREE.ExtrudeGeometry;
  /** Byte-tamper only: the fractured byte-body glows in the integrity `--tamper` hue (never a person). */
  hexOverride?: string;
}): JSX.Element {
  const hex = hexOverride ?? roleHex(node.colorRole);
  const dim = node.isIsland ? 0.4 : 1; // island reads dimmer ("outside this milestone").

  switch (node.body.id) {
    case "world":
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.95, 40, 40]} />
            <meshStandardMaterial {...emissive(hex, 1.1 * dim)} />
          </mesh>
          {/* Faint equatorial ring. */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.35, 0.03, 12, 64]} />
            <meshStandardMaterial {...emissive(hex, 0.9 * dim)} transparent opacity={0.55} />
          </mesh>
        </group>
      );
    case "moon":
      return (
        <mesh>
          <sphereGeometry args={[0.5, 28, 28]} />
          <meshStandardMaterial {...emissive(hex, 1.0 * dim)} />
        </mesh>
      );
    case "blueprint":
      // Wireframe icosahedron — the declared plan/construct.
      return (
        <group>
          <mesh>
            <icosahedronGeometry args={[0.9, 0]} />
            <meshBasicMaterial color={hex} wireframe transparent opacity={0.9 * dim} />
          </mesh>
          <mesh scale={0.4}>
            <icosahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial {...emissive(hex, 1.3 * dim)} />
          </mesh>
        </group>
      );
    case "beacon":
      // Thin luminous obelisk.
      return (
        <mesh>
          <cylinderGeometry args={[0.16, 0.24, 2.2, 6]} />
          <meshStandardMaterial {...emissive(hex, 1.5 * dim)} />
        </mesh>
      );
    case "comet":
      // Icy body + a stretched tail (calm, never a "flare").
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.55, 30, 30]} />
            <meshStandardMaterial {...emissive(hex, 1.4 * dim)} />
          </mesh>
          <mesh position={[-0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.35, 1.8, 20, 1, true]} />
            <meshStandardMaterial {...emissive(hex, 0.8 * dim)} transparent opacity={0.5} />
          </mesh>
        </group>
      );
    case "gold-star":
      // Warm-gold star — human warmth of a Review.
      return (
        <mesh geometry={star}>
          <meshStandardMaterial {...emissive(hex, 1.5 * dim)} />
        </mesh>
      );
    case "crystal":
      // Faceted octahedron.
      return (
        <mesh>
          <octahedronGeometry args={[0.85, 0]} />
          <meshStandardMaterial {...emissive(hex, 1.3 * dim)} flatShading />
        </mesh>
      );
    case "seal-sun":
      // Radiant sphere + a gold seal ring — the human-owned grade reads at the verify moment.
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.9, 40, 40]} />
            <meshStandardMaterial {...emissive(hex, 1.6 * dim)} />
          </mesh>
          {node.isHumanOwned ? (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.3, 0.06, 16, 80]} />
              <meshStandardMaterial {...emissive(COSMOS.human, 1.4 * dim)} />
            </mesh>
          ) : null}
        </group>
      );
    default:
      return (
        <mesh>
          <sphereGeometry args={[0.7, 24, 24]} />
          <meshStandardMaterial {...emissive(hex, 1.0 * dim)} />
        </mesh>
      );
  }
}

/** §U8.5 `bodyReveal` = 520ms Pop (0.95→1.0) — the time-scrub `scrubStep` ignite when a body is born. */
const IGNITE_MS = 520;

function Body({
  node,
  star,
  animate,
  isFracture,
  sealActive,
  onPick,
}: {
  node: NodeView;
  star: THREE.ExtrudeGeometry;
  animate: boolean;
  /** This body's bytes were tampered → it fractures (jitters) in the integrity hue (UE033/UE034). */
  isFracture: boolean;
  /** This human-owned Outcome is the Verified ✓ seal → a one-shot forge pulse (UE032). */
  sealActive: boolean;
  onPick?: (nodeId: string, origin: { readonly x: number; readonly y: number }) => void;
}): JSX.Element {
  const ref = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  // Deterministic per-node phase so floats are varied but not random.
  const phase = ((node.birthOrder ?? 0) % 12) * 0.5;
  const [bx, by, bz] = node.pos3d;
  // Mount time is stamped on the first frame so a body born mid-scrub pops in (never on the server).
  const born = useRef<number | null>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Scale-in Pop on birth; instant full scale under standard3d (no ignite).
    if (inner.current) {
      if (!animate) {
        inner.current.scale.setScalar(1);
      } else {
        if (born.current === null) born.current = t;
        const p = Math.min((t - born.current) / (IGNITE_MS / 1000), 1);
        // Overshoot-eased pop toward 1.0 (peaks ~1.04 near p≈0.7).
        const eased = 1 - (1 - p) ** 3;
        let scale = 0.95 + eased * 0.05 + Math.sin(p * Math.PI) * 0.04;
        // Seal-forge: a gentle one-shot swell on the human-owned Outcome as the seal locks.
        if (sealActive) scale *= 1.06 + Math.sin(t * 3) * 0.02;
        inner.current.scale.setScalar(scale);
      }
    }
    if (!ref.current) return;
    // Byte-tamper fracture: a high-frequency shudder — bytes only, never a person/Outcome (UE034).
    if (isFracture && animate) {
      ref.current.position.x = bx + Math.sin(t * 47) * 0.06;
      ref.current.position.y = by + Math.cos(t * 41) * 0.06;
      ref.current.rotation.z = Math.sin(t * 37) * 0.04;
      return;
    }
    if (!animate) {
      ref.current.position.set(bx, by, bz);
      return;
    }
    ref.current.position.y = by + Math.sin(t * 0.6 + phase) * 0.12;
    ref.current.rotation.y = t * 0.15 + phase;
  });

  const pick = (e: ThreeEvent<PointerEvent>): void => {
    if (!onPick) return;
    e.stopPropagation(); // the nearest body wins; the pick never falls through to the one behind it.
    onPick(node.id, { x: e.clientX, y: e.clientY });
  };
  const hover =
    (over: boolean) =>
    (e: ThreeEvent<PointerEvent>): void => {
      if (!onPick) return;
      e.stopPropagation();
      document.body.style.cursor = over ? "pointer" : "";
    };

  return (
    <group
      ref={ref}
      position={[bx, by, bz]}
      onPointerDown={pick}
      onPointerOver={hover(true)}
      onPointerOut={hover(false)}
    >
      <group ref={inner}>
        <BodyMesh node={node} star={star} hexOverride={isFracture ? COSMOS.tamper : undefined} />
      </group>
    </group>
  );
}

export function Bodies({
  nodes,
  animate,
  verify,
  onPick,
}: {
  nodes: readonly NodeView[];
  animate: boolean;
  verify?: VerifyVisualState;
  onPick?: (nodeId: string, origin: { readonly x: number; readonly y: number }) => void;
}): JSX.Element {
  const star = useStarGeometry();
  const fractureId = verify?.fractureNodeId ?? null;
  const sealed = verify?.run === "verify" && verify.sealState === "verified";
  return (
    <group>
      {nodes.map((n) => (
        <Body
          key={n.id}
          node={n}
          star={star}
          animate={animate}
          isFracture={fractureId === n.id}
          sealActive={sealed && n.isHumanOwned}
          onPick={onPick}
        />
      ))}
    </group>
  );
}
