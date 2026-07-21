"use client";

import {
  type ConstellationStar,
  type EvidenceConstellationView,
  PALETTE,
  type QualityTier,
  type Vector3,
} from "@gt100k/interest-lab-view";
import { Float, Line } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

const colorForPull = (pull: ConstellationStar["pull"]): string => {
  if (pull === "supporting") return PALETTE.sparkHi;
  if (pull === "disconfirming") return PALETTE.tide;
  return PALETTE.inkHi;
};

interface EvidenceLinkProps {
  star: ConstellationStar;
  view: EvidenceConstellationView;
}

function EvidenceLink({ star, view }: EvidenceLinkProps) {
  if (star.pull === "neutral") return null;
  const target = star.pull === "supporting" ? view.supportingAnchor : view.disconfirmingAnchor;

  return (
    <Line
      points={[star.position, target]}
      color={colorForPull(star.pull)}
      lineWidth={0.7}
      opacity={0.28}
      transparent
    />
  );
}

interface EvidenceStarProps {
  star: ConstellationStar;
}

function EvidenceStar({ star }: EvidenceStarProps) {
  const scale = 0.12 + star.brightness * 0.14;

  return (
    <mesh position={star.position} scale={scale}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial
        color={colorForPull(star.pull)}
        opacity={0.38 + star.brightness * 0.62}
        toneMapped={false}
        transparent
      />
    </mesh>
  );
}

interface AnchorProps {
  position: Vector3;
  tone: string;
}

const ANCHOR_POINTS = [
  { id: "left", position: [-0.13, 0.05, 0], scale: 0.09 },
  { id: "right", position: [0.11, 0.12, -0.04], scale: 0.11 },
  { id: "lower", position: [0, -0.11, 0.06], scale: 0.13 },
] as const satisfies readonly { id: string; position: Vector3; scale: number }[];

function Anchor({ position, tone }: AnchorProps) {
  return (
    <group position={position}>
      {ANCHOR_POINTS.map((point) => (
        <mesh key={point.id} position={point.position} scale={point.scale}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color={tone} opacity={0.76} toneMapped={false} transparent />
        </mesh>
      ))}
    </group>
  );
}

export interface EvidenceConstellationCanvasProps {
  view: EvidenceConstellationView;
  quality: QualityTier;
}

export function EvidenceConstellationCanvas({ view, quality }: EvidenceConstellationCanvasProps) {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0.25, 7], zoom: 74, near: 0.1, far: 30 }}
      dpr={[1, Math.min(quality.dprCap, 1.5)]}
      frameloop="always"
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      orthographic
      onCreated={({ gl }) => gl.domElement.setAttribute("aria-hidden", "true")}
    >
      <Float speed={0.25} rotationIntensity={0.08} floatIntensity={0.12}>
        {view.stars.map((star) => (
          <EvidenceStar key={star.family} star={star} />
        ))}
        {view.stars.map((star) => (
          <EvidenceLink key={`link:${star.family}`} star={star} view={view} />
        ))}
        <Anchor position={view.supportingAnchor} tone={PALETTE.sparkHi} />
        <Anchor position={view.disconfirmingAnchor} tone={PALETTE.tide} />
      </Float>
    </Canvas>
  );
}
