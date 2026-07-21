import type { InitialArenaView, NodeState } from "@gt100k/arena-world";
import * as React from "react";
import styles from "./Fallback2D.module.css";

const REGION_ASSET: Readonly<Record<string, string>> = {
  "numbers-coast": "/seed/isle-numbers-coast.svg",
  "tinker-bluffs": "/seed/isle-tinker-bluffs.svg",
  "story-vale": "/seed/isle-story-vale.svg",
  "wordwind-reach": "/seed/isle-wordwind-reach.svg",
};

const STATE_ASSET: Readonly<Record<NodeState, string>> = {
  locked: "/seed/node-locked.svg",
  available: "/seed/node-available.svg",
  unlocked: "/seed/node-unlocked.svg",
};

const BASE_ASSET: Readonly<Record<string, string>> = {
  campfire: "/seed/prop-campfire.svg",
  banner: "/seed/prop-banner.svg",
  garden: "/seed/prop-garden.svg",
  dock: "/seed/prop-dock.svg",
  workshop: "/seed/prop-workshop.svg",
  lookout: "/seed/prop-lookout.svg",
};

const GENERIC_BASE_ASSET = "/seed/prop-generic.svg";

interface FallbackRegion {
  region: string;
  assetHref: string;
}

interface FallbackNode {
  nodeId: string;
  region: string;
  landmark: string;
  state: NodeState;
  x: number;
  y: number;
  assetHref: string;
}

interface FallbackPath {
  from: string;
  to: string;
}

interface FallbackBaseFeature {
  feature: string;
  zone: string;
  x: number;
  y: number;
  by: string;
  missionId: string;
  assetHref: string;
}

export interface Fallback2DPlan {
  bounds: InitialArenaView["layout"]["bounds"];
  regions: FallbackRegion[];
  nodes: FallbackNode[];
  paths: FallbackPath[];
  baseFeatures: FallbackBaseFeature[];
}

function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

export function buildFallback2DPlan(view: InitialArenaView): Fallback2DPlan {
  const positionByNode = new Map(
    view.layout.positions.map((position) => [position.nodeId, position] as const),
  );
  const stateByNode = new Map(view.nodeStates.map(({ nodeId, state }) => [nodeId, state] as const));
  const firstContributionByFeature = new Map<string, (typeof view.base.contributions)[number]>();
  for (const contribution of view.base.contributions) {
    if (!firstContributionByFeature.has(contribution.feature)) {
      firstContributionByFeature.set(contribution.feature, contribution);
    }
  }

  return {
    bounds: { ...view.layout.bounds },
    regions: view.world.regions.map((region) => ({
      region,
      assetHref: required(REGION_ASSET[region], `Missing Tier-D region asset: ${region}`),
    })),
    nodes: view.world.nodes.map((node) => {
      const position = required(
        positionByNode.get(node.id),
        `Missing Tier-D layout position: ${node.id}`,
      );
      const state = required(stateByNode.get(node.id), `Missing Tier-D node state: ${node.id}`);

      return {
        nodeId: node.id,
        region: node.region,
        landmark: node.landmark,
        state,
        x: position.x,
        y: position.y,
        assetHref: STATE_ASSET[state],
      };
    }),
    paths: view.world.edges.map(({ from, to }) => ({ from, to })),
    baseFeatures: view.presentation.basePlacements.map((placement) => {
      const contribution = required(
        firstContributionByFeature.get(placement.feature),
        `Missing Tier-D Base Camp contribution: ${placement.feature}`,
      );

      return {
        feature: placement.feature,
        zone: placement.zone,
        x: placement.x,
        y: placement.y,
        by: placement.by,
        missionId: contribution.missionId,
        assetHref: BASE_ASSET[placement.feature] ?? GENERIC_BASE_ASSET,
      };
    }),
  };
}

function regionFrame(region: string, plan: Fallback2DPlan) {
  const regionNodes = plan.nodes.filter((node) => node.region === region);
  if (regionNodes.length === 0) throw new Error(`Tier-D region has no nodes: ${region}`);

  const xs = regionNodes.map(({ x }) => x);
  const ys = regionNodes.map(({ y }) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);

  return {
    x: Math.max(plan.bounds.x + 16, minX - 112),
    y: Math.max(plan.bounds.y + 16, minY - 160),
    width: maxX - minX + 224,
    height: 320,
  };
}

function stateLabel(state: NodeState): string {
  return `${state.charAt(0).toUpperCase()}${state.slice(1)}`;
}

export interface Fallback2DProps {
  view: InitialArenaView;
  focusedFeature?: string;
  focusedNodeId?: string;
}

export default function Fallback2D({ view, focusedFeature, focusedNodeId }: Fallback2DProps) {
  const plan = buildFallback2DPlan(view);
  const nodeById = new Map(plan.nodes.map((node) => [node.nodeId, node] as const));

  return (
    <section
      aria-hidden="true"
      className={styles.fallback}
      data-quality-tier={view.presentation.qualityTier}
      data-renderer="tier-d"
    >
      <svg
        className={styles.map}
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`${plan.bounds.x} ${plan.bounds.y} ${plan.bounds.width} ${plan.bounds.height}`}
      >
        <title>Independence Isles static map</title>
        {plan.regions.map(({ region, assetHref }) => {
          const frame = regionFrame(region, plan);
          return (
            <image
              className={styles.regionArt}
              data-region={region}
              height={frame.height}
              href={assetHref}
              key={region}
              preserveAspectRatio="none"
              width={frame.width}
              x={frame.x}
              y={frame.y}
            />
          );
        })}
        {plan.paths.map(({ from, to }) => {
          const start = required(nodeById.get(from), `Missing Tier-D path node: ${from}`);
          const end = required(nodeById.get(to), `Missing Tier-D path node: ${to}`);
          return (
            <line
              className={styles.path}
              data-path-from={from}
              data-path-to={to}
              key={`${from}:${to}`}
              x1={start.x}
              x2={end.x}
              y1={start.y}
              y2={end.y}
            />
          );
        })}
        <g data-base-camp="true">
          <ellipse className={styles.baseIsland} cx="1024" cy="1024" rx="224" ry="176" />
          {plan.baseFeatures.map((feature) => (
            <g
              data-base-feature={feature.feature}
              data-focused={focusedFeature === feature.feature ? "true" : "false"}
              data-mission-id={feature.missionId}
              data-zone={feature.zone}
              key={feature.feature}
              transform={`translate(${feature.x} ${feature.y})`}
            >
              <circle className={styles.focusRing} r="58" />
              <image
                className={styles.baseFeatureArt}
                height="96"
                href={feature.assetHref}
                preserveAspectRatio="xMidYMid meet"
                width="96"
                x="-48"
                y="-48"
              />
              <text className={styles.baseFeatureLabel} y="68">
                {feature.feature}
              </text>
              {focusedFeature === feature.feature ? (
                <text className={styles.attribution} y="98">
                  {feature.by} · mission {feature.missionId}
                </text>
              ) : null}
            </g>
          ))}
        </g>
        {plan.nodes.map((node) => (
          <g
            data-node-id={node.nodeId}
            data-focused={focusedNodeId === node.nodeId ? "true" : "false"}
            data-state={node.state}
            key={node.nodeId}
            transform={`translate(${node.x} ${node.y})`}
          >
            <circle className={styles.focusRing} r="52" />
            <image
              className={styles.nodeArt}
              height="80"
              href={node.assetHref}
              preserveAspectRatio="xMidYMid meet"
              width="80"
              x="-40"
              y="-40"
            />
            <text className={styles.landmark} y="68">
              {node.landmark}
            </text>
            <text className={styles.state} y="100">
              {stateLabel(node.state)}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}
