/**
 * Calm-2D provenance constellation (§U8.1) — the accessible, no-WebGL, reduced-motion-safe tier and
 * a first-class equal mode to the 3D cosmos. Deterministic SVG: `x` from `depthRank`, `y` from
 * `orderInRank`; the disconnected island stacks below. Every node carries shape + glyph + text, so
 * meaning never rests on color alone (FR-E04). Entrance motion is CSS-only and removed under
 * `prefers-reduced-motion`.
 */
import type { EdgeView, ExplorerView, NodeView } from "@gt100k/evidence-explorer-view";
import type { JSX } from "react";
import { type VerifyVisualState, isEdgeLit } from "../verify-machine.js";
import { Glyph } from "./glyphs.js";

const NODE_R = 28;

/** Max characters for a 2D node label before ellipsis (full text stays in the <title> hover). */
const LABEL_MAX = 22;
function truncateLabel(label: string): string {
  return label.length > LABEL_MAX ? `${label.slice(0, LABEL_MAX - 1).trimEnd()}…` : label;
}

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

/** How a node reads under the HUD filters + trace (mirrors `hud-state`'s `NodeEmphasis`). */
type NodeEmphasis = "normal" | "dimmed" | "traced";

function NodeMark({
  node,
  index,
  focused,
  fractured,
  sealed,
  emphasis,
  onSelect,
}: {
  node: NodeView;
  index: number;
  focused: boolean;
  /** Byte-tamper only: a static red crack + integrity ring on the byte-body (never a person). */
  fractured: boolean;
  /** Human-owned Outcome + a passing Verify → the gold seal ring reads as forged/locked. */
  sealed: boolean;
  /** HUD filter/trace emphasis: dimmed = filtered out or off-lineage; traced = in the trace. */
  emphasis: NodeEmphasis;
  /** Mouse affordance: click a body to inspect it (keyboard path is the Ledger tree). */
  onSelect?: (nodeId: string, origin: { readonly x: number; readonly y: number }) => void;
}): JSX.Element {
  const color = `var(--${node.colorRole})`;
  // Staggered entrance keyed to provenance depth so the DAG "ignites" front-to-back. Positioning
  // lives on the outer group; the CSS scale animation runs on an inner group with `fill-box` origin
  // so it scales about its own center (SVG CSS-transform otherwise resolves origin to the viewBox).
  const delay = `${Math.min(node.depthRank, 6) * 90 + index * 18}ms`;
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: mouse-only enhancement; the SVG is role="img" (decorative) and the keyboard/AT path is the Ledger role="tree" (§U5.12).
    <g
      transform={`translate(${node.pos2d.x} ${node.pos2d.y})`}
      onClick={onSelect ? (e) => onSelect(node.id, { x: e.clientX, y: e.clientY }) : undefined}
      style={onSelect ? { cursor: "pointer" } : undefined}
      opacity={emphasis === "dimmed" ? 0.2 : 1}
    >
      <g
        className={`node-enter${focused ? " is-focused" : ""}${fractured ? " is-fractured" : ""}${emphasis === "traced" ? " is-traced" : ""}`}
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
        {/* Verified seal-forge: a gold locked ring on the human-owned Outcome (parity with the 3D seal). */}
        {sealed ? (
          <circle
            className="node-seal-ring"
            r={NODE_R + 9}
            fill="none"
            stroke="var(--verify)"
            strokeWidth={2.5}
            opacity={0.9}
          />
        ) : null}
        {/* Emissive halo (dropped in plain mode — low-spectacle). */}
        <circle
          className="node-halo"
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
        {/* Byte-tamper: a static integrity ring + crack on the byte-body (bytes only — UE034). The
            MISMATCH is fully conveyed here + in the VerifyPanel badge, requiring no motion (scenario 4). */}
        {fractured ? (
          <g className="node-fracture">
            <circle
              r={NODE_R + 9}
              fill="none"
              stroke="var(--tamper)"
              strokeWidth={2.5}
              strokeDasharray="4 3"
            />
            <path
              d="M0 -28 L6 -6 L-7 4 L4 12 L-2 28"
              fill="none"
              stroke="var(--tamper)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <text
              y={-NODE_R - 24}
              textAnchor="middle"
              fontSize={10}
              fill="var(--tamper)"
              className="mono"
              style={{ fontWeight: 700 }}
            >
              bytes mismatch
            </text>
          </g>
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
        {/* Text label + pseudonymous actor chip. Label is truncated so long titles never bleed
            into the neighbouring column (labels are centered; columns are 240px apart). */}
        <text
          y={NODE_R + 20}
          textAnchor="middle"
          fontSize={13}
          fill="var(--ink)"
          style={{ fontWeight: 600 }}
        >
          <title>{node.label}</title>
          {truncateLabel(node.label)}
        </text>
        <text y={NODE_R + 37} textAnchor="middle" fontSize={11} fill="var(--ink-muted)">
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
  waveOrder = [],
  verify,
  emphasisFor,
  plainMode = false,
  onSelect,
}: {
  view: ExplorerView;
  /** When present (time-scrub), only these node ids render; omitted = fully grown (SSR baseline). */
  revealed?: ReadonlySet<string>;
  focusNodeId?: string | null;
  /** Deterministic verify light-wave order (`view.verifyWaveOrder`). */
  waveOrder?: ReadonlyArray<{ readonly from: string; readonly to: string }>;
  /** Verify-sequence visual state (light-wave / seal / byte-fracture). */
  verify?: VerifyVisualState;
  /** HUD filter/trace emphasis per node id; omitted = every node normal (SSR baseline). */
  emphasisFor?: (nodeId: string) => NodeEmphasis;
  /** Plain mode (§U12): low-spectacle — drop the body glow (presentation-only, state unchanged). */
  plainMode?: boolean;
  /** Mouse affordance: click a body to open its Inspector (keyboard path is the Ledger). */
  onSelect?: (nodeId: string, origin: { readonly x: number; readonly y: number }) => void;
}): JSX.Element {
  const visibleNodes = revealed ? view.nodes.filter((n) => revealed.has(n.id)) : view.nodes;
  const byId = new Map(visibleNodes.map((n) => [n.id, n]));
  const structuralEdges = view.edges.filter(
    (e) => e.isNodeEdge && byId.has(e.from) && byId.has(e.to),
  );
  const litCount = verify?.run === "verify" ? verify.litEdgeCount : 0;
  const fractureId = verify?.fractureNodeId ?? null;
  const sealed = verify?.run === "verify" && verify.sealState === "verified";

  return (
    <svg
      className={`constellation${plainMode ? " is-plain" : ""}`}
      viewBox={`0 0 ${view.bounds2d.width} ${view.bounds2d.height}`}
      // Decorative render of state the accessible Ledger conveys in full (SC-E13 / FR-E12): the
      // calm-2D constellation is `aria-hidden` and the Ledger is the single source of truth, so AT
      // never has to reconcile two parallel structures.
      aria-hidden="true"
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
          const lit = litCount > 0 && isEdgeLit(waveOrder, litCount, e.from, e.to);
          // On a tamper mismatch, lineage touching the byte-body desaturates (dim — never red).
          const desaturated = fractureId !== null && (e.from === fractureId || e.to === fractureId);
          // HUD filter/trace: an edge is dimmed when either endpoint is de-emphasised.
          const eFrom = emphasisFor?.(e.from) ?? "normal";
          const eTo = emphasisFor?.(e.to) ?? "normal";
          const edgeDimmed = eFrom === "dimmed" || eTo === "dimmed";
          const stroke = lit
            ? "var(--verify)"
            : e.threadStyle === "frayed"
              ? "var(--tamper)"
              : "var(--line)";
          const baseOpacity = e.flow ? 0.85 : 0.55;
          const opacity = lit
            ? 1
            : desaturated
              ? baseOpacity * 0.3
              : edgeDimmed
                ? baseOpacity * 0.18
                : baseOpacity;
          return (
            <path
              key={`${e.from}->${e.to}-${i}`}
              className="edge-draw"
              d={edgePath(from, to)}
              stroke={stroke}
              strokeWidth={(e.flow ? 1.8 : 1.2) * (lit ? 1.6 : 1)}
              strokeDasharray={DASH[e.threadStyle]}
              markerEnd={cap}
              opacity={opacity}
            />
          );
        })}
      </g>

      {/* Bodies. */}
      <g>
        {visibleNodes.map((n, i) => (
          <NodeMark
            key={n.id}
            node={n}
            index={i}
            focused={focusNodeId === n.id}
            fractured={fractureId === n.id}
            sealed={sealed && n.isHumanOwned}
            emphasis={emphasisFor?.(n.id) ?? "normal"}
            onSelect={onSelect}
          />
        ))}
      </g>
    </svg>
  );
}
