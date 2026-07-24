/**
 * Interactive desk lamp (tinker). Press E to cycle OFF → WARM → COOL → BRIGHT — the point light
 * actually turns on/off and shifts colour + intensity, and the shade glows to match. Replaces the
 * old passive Lamp. Boots WARM (defaultMode 1) so the cozy dusk framing is unchanged at rest.
 *
 * Determinism: the light state is a pure function of `store.lamp.mode`; the standby pull-chain glow
 * is a pure function of clock time, frozen under `?freeze=1`.
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { GADGET_FROZEN_T, type GadgetStore } from "./gadgetState";

// per mode: [pointLight color, intensity, shade emissive intensity]
const MODES: Array<[THREE.ColorRepresentation, number, number]> = [
  ["#2a2018", 0, 0.04], // OFF
  ["#ffcf87", 9, 0.9], // WARM
  ["#bcd6ff", 8, 0.85], // COOL
  ["#fff2d6", 15, 1.35], // BRIGHT
];

export function InteractiveLamp({
  store,
  freeze,
}: {
  store: GadgetStore;
  freeze: boolean;
}): JSX.Element {
  const light = useRef<THREE.PointLight>(null);
  const shade = useRef<THREE.MeshStandardMaterial>(null);
  const chain = useRef<THREE.MeshStandardMaterial>(null);
  const shadeColor = useMemo(() => new THREE.Color(), []);
  // playback latch: when a new Run arrives (seqId changes) we mark the start time and step through
  // the programmed on/off pattern slowly (TICK seconds/step) so the player watches it execute.
  const play = useRef<{ id: number; start: number }>({ id: 0, start: 0 });
  const TICK = 0.7;

  useFrame((state) => {
    const t = freeze ? GADGET_FROZEN_T : state.clock.elapsedTime;
    const st = store.lamp;

    // resolve the current mode: normally store.lamp.mode, but during a playback we override it by
    // stepping through the sequence (skipped under freeze so harness shots stay static/deterministic).
    let mode = st?.mode ?? 1;
    const seq = st?.seq;
    const seqId = st?.seqId ?? 0;
    if (!freeze && seq && seq.length > 0) {
      if (seqId !== play.current.id) play.current = { id: seqId, start: t };
      const step = Math.floor((t - play.current.start) / TICK);
      if (step < seq.length) {
        mode = seq[step] === 1 ? 1 : 0; // blink WARM/OFF through the pattern
      } else {
        // settle LIT so exiting the menu never leaves the lamp (and the room) dark: BRIGHT if the
        // pattern matched, otherwise WARM. The player can always see after a Run.
        mode = st?.solved ? 3 : 1;
      }
    }
    const [col, intensity, emissive] = MODES[mode] ?? MODES[1]!;
    if (light.current) {
      light.current.color.set(col);
      light.current.intensity = intensity;
    }
    if (shade.current) {
      shadeColor.set(col);
      shade.current.emissive.copy(shadeColor);
      shade.current.emissiveIntensity = emissive;
    }
    // pull-chain bead glows a soft amber standby pulse (affordance: "this is interactive")
    if (chain.current)
      chain.current.emissiveIntensity = 0.25 + 0.2 * (0.5 + 0.5 * Math.sin(t * 2.4));
  });

  return (
    <group position={[-2.8, 0, 0.5]}>
      {/* slim side table */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.24, 1.0, 16]} />
        <meshStandardMaterial color="#3a2616" roughness={0.7} metalness={0} />
      </mesh>
      {/* brass stem */}
      <mesh position={[0, 1.12, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.24, 12]} />
        <meshStandardMaterial color="#5a4632" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* shade (emissive follows the mode) */}
      <mesh position={[0, 1.34, 0]}>
        <coneGeometry args={[0.22, 0.28, 20, 1, true]} />
        <meshStandardMaterial
          ref={shade}
          color="#e8c98a"
          emissive="#ffcf87"
          emissiveIntensity={0.9}
          side={THREE.DoubleSide}
          roughness={0.8}
        />
      </mesh>
      {/* pull-chain switch — the visible affordance */}
      <mesh position={[0.16, 1.26, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.12, 6]} />
        <meshStandardMaterial color="#8a7a54" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0.16, 1.19, 0]}>
        <sphereGeometry args={[0.022, 10, 8]} />
        <meshStandardMaterial
          ref={chain}
          color="#ffd27a"
          emissive="#ffb347"
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      <pointLight
        ref={light}
        position={[0, 1.34, 0]}
        color="#ffcf87"
        intensity={9}
        distance={6}
        decay={2}
      />
    </group>
  );
}
