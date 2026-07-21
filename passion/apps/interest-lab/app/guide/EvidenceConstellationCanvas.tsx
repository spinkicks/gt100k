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
import { useMemo } from "react";
import { AdditiveBlending, type CanvasTexture } from "three";
import {
  colorForPull,
  createSoftDotTexture,
  type GlowNode,
  resolveAnchorNode,
  resolveStarNode,
} from "./constellation-node";

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
      opacity={0.34}
      transparent
    />
  );
}

interface GlowPointProps {
  node: GlowNode;
  glow: CanvasTexture;
  position?: Vector3;
}

/** A hot self-luminous core wrapped in a soft additive halo — one point of light. */
function GlowPoint({ node, glow, position }: GlowPointProps) {
  return (
    <group position={position}>
      <sprite scale={node.haloScale}>
        <spriteMaterial
          map={glow}
          color={node.color}
          opacity={node.haloOpacity}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          transparent
        />
      </sprite>
      <mesh scale={node.coreScale}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={node.color}
          opacity={node.coreOpacity}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

interface EvidenceStarProps {
  star: ConstellationStar;
  glow: CanvasTexture;
}

function EvidenceStar({ star, glow }: EvidenceStarProps) {
  return <GlowPoint node={resolveStarNode(star)} glow={glow} position={star.position} />;
}

interface AnchorProps {
  position: Vector3;
  tone: string;
  glow: CanvasTexture;
}

const ANCHOR_POINTS = [
  { id: "left", position: [-0.13, 0.05, 0], scale: 0.09 },
  { id: "right", position: [0.11, 0.12, -0.04], scale: 0.11 },
  { id: "lower", position: [0, -0.11, 0.06], scale: 0.13 },
] as const satisfies readonly { id: string; position: Vector3; scale: number }[];

function Anchor({ position, tone, glow }: AnchorProps) {
  return (
    <group position={position}>
      {ANCHOR_POINTS.map((point) => (
        <GlowPoint
          key={point.id}
          node={resolveAnchorNode(point.scale, tone)}
          glow={glow}
          position={point.position}
        />
      ))}
    </group>
  );
}

export interface EvidenceConstellationCanvasProps {
  view: EvidenceConstellationView;
  quality: QualityTier;
}

export function EvidenceConstellationCanvas({ view, quality }: EvidenceConstellationCanvasProps) {
  const glow = useMemo(() => createSoftDotTexture(() => document.createElement("canvas")), []);

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
          <EvidenceStar key={star.family} star={star} glow={glow} />
        ))}
        {view.stars.map((star) => (
          <EvidenceLink key={`link:${star.family}`} star={star} view={view} />
        ))}
        <Anchor position={view.supportingAnchor} tone={PALETTE.sparkHi} glow={glow} />
        <Anchor position={view.disconfirmingAnchor} tone={PALETTE.tide} glow={glow} />
      </Float>
    </Canvas>
  );
}
