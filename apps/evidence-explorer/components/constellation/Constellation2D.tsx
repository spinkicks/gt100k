/**
 * Calm-2D provenance constellation (§U8.1) — the accessible, no-WebGL, reduced-motion-safe tier and
 * a first-class equal mode to the 3D cosmos. Deterministic SVG: `x` from `depthRank`, `y` from
 * `orderInRank`; the disconnected island stacks below. Every node carries shape + glyph + text, so
 * meaning never rests on color alone (FR-E04). Entrance motion is CSS-only and removed under
 * `prefers-reduced-motion`.
 */
import type { EdgeView, ExplorerView, NodeView } from "@gt100k/evidence-explorer-view";
import type { JSX } from "react";
import { Glyph } from "./glyphs.js";

const NODE_R = 28;

/** SVG dash pattern per light-thread style (§U8.12). */
const DASH: Record<EdgeView["threadStyle"], string | undefined> = {
  solid: undefined,
  dotted: "1.5 7",
  "dashed-fine": "5 5",
  frayed: "1 4",
};

function edgePath(from: NodeView, to: NodeView): string {
  return `M ${from.pos2d.x} ${from.pos2d.y} L ${to.pos2d.x} ${to.pos2d.y}`;
}

function NodeMark({
  node,
  index,
  focused,
}: { node: NodeView; index: number; focused: boolean }): JSX.Element {
  const color = `var(--${node.colorRole})`;
  // Staggered entrance keyed to provenance depth so the DAG "ignites" front-to-back. Positioning
  // lives on the outer group; the CSS scale animation runs on an inner group with `fill-box` origin
  // so it scales about its own center (SVG CSS-transform otherwise resolves origin to the viewBox).
  const delay = `${Math.min(node.depthRank, 6) * 90 + index * 18}ms`;
  return (
    <g transform={`translate(${node.pos2d.x} ${node.pos2d.y})`}>
      <g
        className={`node-enter${focused ? " is-focused" : ""}`}
        style={{ animationDelay: delay, transformBox: "fill-box", transformOrigin: "center" }}
      >
        {/* Selected-beat focus ring (calm-2D parity for the 3D fly-to). */}
        {focused ? (
          <circle
            className="node-focus-ring"
            r={NODE_R + 12}
            fill="none"
            stroke="var(--focus)"
            strokeWidth={2}
          />
        ) : null}
        {/* Emissive halo. */}
        <circle
          r={NODE_R * 1.9}
          fill={color}
          opacity={node.isIsland ? 0.05 : 0.14}
          filter="url(#glow)"
        />
        {/* Body. */}
        <circle r={NODE_R} fill="url(#body-fill)" stroke={color} strokeWidth={1.5} />
        <circle r={NODE_R} fill={color} opacity={0.16} />
        {/* Human-authority seal ring (gold) / cited-assistance neutral ring. */}
        {node.isHumanOwned ? (
          <circle
            r={NODE_R + 5}
            fill="none"
            stroke="var(--human)"
            strokeWidth={2}
            strokeDasharray="3 4"
          />
        ) : null}
        {node.isCitedAssistance ? (
          <circle
            r={NODE_R + 5}
            fill="none"
            stroke="var(--model)"
            strokeWidth={1.5}
            opacity={0.8}
          />
        ) : null}
        {/* Glyph — reads as the node's type without relying on hue. */}
        <g style={{ color: "var(--ink)" }}>
          <Glyph glyph={node.glyph} r={11} />
        </g>
        {/* Cited tag carried by the Assistance comet (persistent, non-accusatory). */}
        {node.body.declaredTag ? (
          <text
            y={-NODE_R - 10}
            textAnchor="middle"
            fontSize={9.5}
            fill="var(--model)"
            className="mono"
          >
            cited
          </text>
        ) : null}
        {/* Text label + pseudonymous actor chip. */}
        <text
          y={NODE_R + 20}
          textAnchor="middle"
          fontSize={14}
          fill="var(--ink)"
          style={{ fontWeight: 600 }}
        >
          {node.label}
        </text>
        <text y={NODE_R + 38} textAnchor="middle" fontSize={11.5} fill="var(--ink-muted)">
          {node.actor.kind} · {node.actor.label}
        </text>
      </g>
    </g>
  );
}

export function Constellation2D({
  view,
  revealed,
  focusNodeId = null,
}: {
  view: ExplorerView;
  /** When present (time-scrub), only these node ids render; omitted = fully grown (SSR baseline). */
  revealed?: ReadonlySet<string>;
  focusNodeId?: string | null;
}): JSX.Element {
  const visibleNodes = revealed ? view.nodes.filter((n) => revealed.has(n.id)) : view.nodes;
  const byId = new Map(visibleNodes.map((n) => [n.id, n]));
  const structuralEdges = view.edges.filter(
    (e) => e.isNodeEdge && byId.has(e.from) && byId.has(e.to),
  );

  return (
    <svg
      className="constellation"
      viewBox={`0 0 ${view.bounds2d.width} ${view.bounds2d.height}`}
      role="img"
      aria-label={`Provenance constellation for milestone ${view.milestoneRef}: ${visibleNodes.length} evidence nodes linked by ${structuralEdges.length} provenance threads.`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="body-fill" cx="38%" cy="32%" r="80%">
          <stop offset="0%" stopColor="var(--panel-2)" />
          <stop offset="100%" stopColor="var(--void)" />
        </radialGradient>
        <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <marker
          id="cap-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 1 L9 5 L0 9 Z" fill="var(--verify)" />
        </marker>
        <marker
          id="cap-check"
          viewBox="0 0 12 12"
          refX="6"
          refY="6"
          markerWidth="9"
          markerHeight="9"
          orient="auto"
        >
          <path
            d="M2 6 L5 9 L10 3"
            fill="none"
            stroke="var(--verify)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
        <marker
          id="cap-slash"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path d="M2 8 L8 2" stroke="var(--tamper)" strokeWidth="1.6" strokeLinecap="round" />
        </marker>
      </defs>

      {/* Provenance threads. */}
      <g fill="none">
        {structuralEdges.map((e, i) => {
          const from = byId.get(e.from);
          const to = byId.get(e.to);
          if (!from || !to) return null;
          const cap =
            e.cap === "arrow"
              ? "url(#cap-arrow)"
              : e.cap === "check"
                ? "url(#cap-check)"
                : e.cap === "slash"
                  ? "url(#cap-slash)"
                  : undefined;
          return (
            <path
              key={`${e.from}->${e.to}-${i}`}
              className="edge-draw"
              d={edgePath(from, to)}
              stroke={e.threadStyle === "frayed" ? "var(--tamper)" : "var(--line)"}
              strokeWidth={e.flow ? 1.8 : 1.2}
              strokeDasharray={DASH[e.threadStyle]}
              markerEnd={cap}
              opacity={e.flow ? 0.85 : 0.55}
            />
          );
        })}
      </g>

      {/* Bodies. */}
      <g>
        {visibleNodes.map((n, i) => (
          <NodeMark key={n.id} node={n} index={i} focused={focusNodeId === n.id} />
        ))}
      </g>
    </svg>
  );
}
