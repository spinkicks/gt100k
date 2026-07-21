"use client";

import {
  type InitialArenaView,
  type NodeLightContribution,
  type NodeState,
  type VisualBand,
  resolveMotion,
  resolveNodeLightContributions,
} from "@gt100k/arena-world";
import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Color, type Group, type InstancedMesh, Object3D } from "three";

const ISLAND_FLOAT_AMPLITUDE = 0.15;
const ISLAND_FLOAT_MS = 8_000;
const REGION_PHASE_MS = 1_600;
const BEACON_LIFT = 1.2;
const NODE_REVEAL_MOTION = resolveMotion("nodeReveal", { reducedMotion: false });

type Position3D = { x: number; y: number; z: number };

interface IslandPlan {
  region: string;
  position: Position3D;
  terrainHex: string;
  signatureHex: string;
  phaseMs: number;
  scaleX: number;
  scaleZ: number;
}

interface NodePlan extends NodeLightContribution {
  landmark: string;
  label: string;
  markerScale: number;
  touchTargetPx: number;
  showCanvasNumbers: boolean;
  position: Position3D;
  transferCritical: boolean;
}

interface PathPlan {
  from: string;
  to: string;
  crossIsland: boolean;
  colorHex: string;
  points: [[number, number, number], [number, number, number]];
}

export interface WorldRenderPlan {
  islands: IslandPlan[];
  nodes: NodePlan[];
  paths: PathPlan[];
  rewardLabel: string | null;
}

function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

export function resolveNodePresentationLabel(
  landmark: string,
  state: NodeState,
  visualBand: VisualBand,
): string {
  if (visualBand.labelStyle !== "story") return landmark;
  if (state === "unlocked") return `You lit ${landmark}!`;
  if (state === "available") return `${landmark} is ready to light.`;
  return `${landmark} is waiting.`;
}

export function buildWorldRenderPlan(view: InitialArenaView): WorldRenderPlan {
  const transforms = new Map(
    view.presentation.worldTransform.nodes.map((node) => [node.nodeId, node] as const),
  );
  const states = new Map(view.nodeStates.map(({ nodeId, state }) => [nodeId, state] as const));
  const nodesById = new Map(view.world.nodes.map((node) => [node.id, node] as const));

  const candidates = view.world.nodes.map((node) => ({
    nodeId: node.id,
    state: required(states.get(node.id), `Missing state for ${node.id}`),
    transferCritical: node.transferCritical,
    position: required(transforms.get(node.id), `Missing transform for ${node.id}`),
  }));
  const contributions = new Map(
    resolveNodeLightContributions(
      candidates,
      view.presentation.qualityTier,
      "default",
      view.presentation.camera.restTarget,
    ).map((contribution) => [contribution.nodeId, contribution] as const),
  );

  const islands = view.world.regions.map((region, regionIndex) => {
    const biome = required(
      view.presentation.biomes.find((candidate) => candidate.region === region),
      `Missing biome for ${region}`,
    );
    const regionPositions = view.world.nodes
      .filter((node) => node.region === region)
      .map((node) => required(transforms.get(node.id), `Missing transform for ${node.id}`));
    const xs = regionPositions.map(({ x }) => x);
    const zs = regionPositions.map(({ z }) => z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    return {
      region,
      position: {
        x: (minX + maxX) / 2,
        y: biome.elevation,
        z: (minZ + maxZ) / 2,
      },
      terrainHex: biome.terrainHex,
      signatureHex: biome.signatureHex,
      phaseMs: regionIndex * REGION_PHASE_MS,
      scaleX: Math.max(5.5, (maxX - minX) / 2 + 3.5),
      scaleZ: Math.max(5.5, (maxZ - minZ) / 2 + 3.5),
    };
  });

  const nodes = view.world.nodes.map((node) => {
    const contribution = required(
      contributions.get(node.id),
      `Missing light contribution for ${node.id}`,
    );
    const visualBand = view.presentation.visualBand;
    return {
      ...contribution,
      landmark: node.landmark,
      label: resolveNodePresentationLabel(node.landmark, contribution.state, visualBand),
      markerScale: visualBand.markerScale,
      touchTargetPx: visualBand.touchTargetPx,
      showCanvasNumbers: visualBand.showCanvasNumbers,
      position: { ...required(transforms.get(node.id), `Missing transform for ${node.id}`) },
      transferCritical: node.transferCritical,
    };
  });

  const paths = view.world.edges.map(({ from, to }) => {
    const fromNode = required(nodesById.get(from), `Missing node ${from}`);
    const toNode = required(nodesById.get(to), `Missing node ${to}`);
    const fromPosition = required(transforms.get(from), `Missing transform for ${from}`);
    const toPosition = required(transforms.get(to), `Missing transform for ${to}`);
    const toState = required(states.get(to), `Missing state for ${to}`);

    return {
      from,
      to,
      crossIsland: fromNode.region !== toNode.region,
      colorHex:
        toState === "unlocked"
          ? view.presentation.palette.gold
          : toState === "available"
            ? view.presentation.palette.sun
            : view.presentation.palette.locked,
      points: [
        [fromPosition.x, fromPosition.y + 0.12, fromPosition.z],
        [toPosition.x, toPosition.y + 0.12, toPosition.z],
      ] as PathPlan["points"],
    };
  });

  return {
    islands,
    nodes,
    paths,
    rewardLabel: view.presentation.visualBand.showCanvasNumbers
      ? `${view.representation.currencyLabel}: ${view.progression.cumulativeIndependenceReward}`
      : null,
  };
}

export function resolveIslandFloatOffset(
  elapsedMs: number,
  regionIndex: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 0;
  const phase = ((elapsedMs + regionIndex * REGION_PHASE_MS) / ISLAND_FLOAT_MS) * Math.PI * 2;
  return Math.sin(phase) * ISLAND_FLOAT_AMPLITUDE;
}

export function resolveNodeRevealScale(elapsedMs: number, reducedMotion: boolean): number {
  if (reducedMotion) return 1;
  const durationMs = NODE_REVEAL_MOTION.durationMs;
  const progress = Math.min(1, Math.max(0, elapsedMs / durationMs));
  if (progress === 1) return 1;
  return 0.95 + 0.05 * progress + 0.075 * Math.sin(Math.PI * progress);
}

function FloatingIslands({
  islands,
  reducedMotion,
}: { islands: IslandPlan[]; reducedMotion: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const transform = useMemo(() => new Object3D(), []);

  const updateMatrices = (elapsedMs: number) => {
    const current = mesh.current;
    if (!current) return;
    islands.forEach((island, index) => {
      transform.position.set(
        island.position.x,
        island.position.y - 1.1 + resolveIslandFloatOffset(elapsedMs, index, reducedMotion),
        island.position.z,
      );
      transform.scale.set(island.scaleX, 1, island.scaleZ);
      transform.rotation.set(0, index % 2 === 0 ? 0.08 : -0.08, 0);
      transform.updateMatrix();
      current.setMatrixAt(index, transform.matrix);
    });
    current.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    const current = mesh.current;
    if (!current) return;
    islands.forEach((island, index) => current.setColorAt(index, new Color(island.terrainHex)));
    if (current.instanceColor) current.instanceColor.needsUpdate = true;
    updateMatrices(0);
  });

  useFrame(({ clock }) => updateMatrices(clock.elapsedTime * 1_000));

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, islands.length]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[1, 1.18, 2.2, 7, 1, false]} />
      <meshStandardMaterial flatShading roughness={0.9} vertexColors />
    </instancedMesh>
  );
}

function MarkerGlyph({ state, colorHex }: { state: NodeState; colorHex: string }) {
  if (state === "locked") {
    return (
      <group name="closed-padlock">
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.58, 0.5, 0.34]} />
          <meshStandardMaterial color={colorHex} flatShading roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.2, 0.065, 5, 12, Math.PI]} />
          <meshStandardMaterial color={colorHex} flatShading roughness={0.85} />
        </mesh>
      </group>
    );
  }

  if (state === "available") {
    return (
      <group name="start-pennant">
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.48, 0.09, 6, 18]} />
          <meshStandardMaterial color={colorHex} emissive={colorHex} emissiveIntensity={0.55} />
        </mesh>
        <mesh position={[0.05, 0.65, 0]}>
          <coneGeometry args={[0.28, 0.7, 3]} />
          <meshStandardMaterial color={colorHex} emissive={colorHex} emissiveIntensity={0.35} />
        </mesh>
      </group>
    );
  }

  return (
    <mesh name="filled-star" position={[0, BEACON_LIFT, 0]}>
      <octahedronGeometry args={[0.48, 0]} />
      <meshStandardMaterial color={colorHex} emissive={colorHex} emissiveIntensity={1.15} />
    </mesh>
  );
}

function NodeMarker({ node, reducedMotion }: { node: NodePlan; reducedMotion: boolean }) {
  const marker = useRef<Group>(null);
  const elapsedMs = useRef(0);
  const previousState = useRef(node.state);
  const revealing = useRef(false);
  const colorHex = node.emissiveHex ?? "#5A6B78";

  useEffect(() => {
    const unlockedNow = previousState.current !== "unlocked" && node.state === "unlocked";
    if (unlockedNow && !reducedMotion) {
      elapsedMs.current = 0;
      revealing.current = true;
      marker.current?.scale.setScalar(node.markerScale * resolveNodeRevealScale(0, false));
    } else if (reducedMotion || node.state !== "unlocked") {
      revealing.current = false;
      marker.current?.scale.setScalar(node.markerScale);
    }
    previousState.current = node.state;
  }, [node.markerScale, node.state, reducedMotion]);

  useFrame((_, delta) => {
    if (!revealing.current) return;
    elapsedMs.current += delta * 1_000;
    marker.current?.scale.setScalar(
      node.markerScale * resolveNodeRevealScale(elapsedMs.current, reducedMotion),
    );
    if (elapsedMs.current >= NODE_REVEAL_MOTION.durationMs) revealing.current = false;
  });

  return (
    <group
      ref={marker}
      name={`arena-node:${node.nodeId}:${node.icon}:${node.shape}`}
      position={[node.position.x, node.position.y, node.position.z]}
      scale={node.markerScale}
    >
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 0.88, 0.42, 8]} />
        <meshStandardMaterial
          color={colorHex}
          emissive={node.renderMode === "none" ? "#000000" : colorHex}
          emissiveIntensity={node.renderMode === "emissive" ? 0.9 : 0.25}
          flatShading
          roughness={0.74}
        />
      </mesh>
      <MarkerGlyph colorHex={colorHex} state={node.state} />
      {node.transferCritical ? (
        <mesh name="transfer-laurel" rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.96, 0.055, 5, 20]} />
          <meshBasicMaterial color={colorHex} toneMapped={false} />
        </mesh>
      ) : null}
      {node.renderMode === "dynamic" && node.pointLight ? (
        <pointLight
          color={node.pointLight.colorHex}
          decay={node.pointLight.decay}
          distance={node.pointLight.distance}
          intensity={node.pointLight.intensity}
          position={[0, node.state === "unlocked" ? BEACON_LIFT : 0.55, 0]}
        />
      ) : null}
      <Html center distanceFactor={13} position={[0, 2.15, 0]}>
        <span
          aria-hidden="true"
          className="arena-landmark-label"
          style={{
            color: "#F5F9FC",
            fontFamily: "var(--font-body)",
            fontSize: "0.75rem",
            fontWeight: 700,
            display: "grid",
            minHeight: `${node.touchTargetPx}px`,
            minWidth: `${node.touchTargetPx}px`,
            placeItems: "center",
            pointerEvents: "none",
            textShadow: "0 1px 3px #0E2A3B",
            whiteSpace: "nowrap",
          }}
        >
          {node.label}
        </span>
      </Html>
    </group>
  );
}

export interface WorldRootProps {
  view: InitialArenaView;
}

export default function WorldRoot({ view }: WorldRootProps) {
  const plan = useMemo(() => buildWorldRenderPlan(view), [view]);

  return (
    <group name="independence-isles">
      {plan.rewardLabel ? (
        <Html
          center
          position={[
            view.presentation.camera.restTarget.x,
            6,
            view.presentation.camera.restTarget.z,
          ]}
        >
          <span
            aria-hidden="true"
            className="arena-world-reward"
            style={{
              color: "#FFC66B",
              fontFamily: "var(--font-body)",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 900,
              pointerEvents: "none",
              textShadow: "0 1px 3px #0E2A3B",
              whiteSpace: "nowrap",
            }}
          >
            {plan.rewardLabel}
          </span>
        </Html>
      ) : null}
      <FloatingIslands islands={plan.islands} reducedMotion={view.flags.reducedMotion} />
      <group name="arena-paths-and-bridges">
        {plan.paths.map((path) => (
          <Line
            key={`${path.from}:${path.to}`}
            color={path.colorHex}
            dashed={path.crossIsland}
            dashScale={path.crossIsland ? 2 : 1}
            lineWidth={path.crossIsland ? 4 : 3}
            points={path.points}
            transparent
            opacity={path.colorHex === view.presentation.palette.locked ? 0.36 : 0.9}
          />
        ))}
      </group>
      {plan.nodes.map((node) => (
        <NodeMarker key={node.nodeId} node={node} reducedMotion={view.flags.reducedMotion} />
      ))}
    </group>
  );
}
