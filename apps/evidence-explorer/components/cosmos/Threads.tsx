"use client";
/**
 * Light-thread edges (§U8.12 / §U5.2) — a thin emissive line from source → derived. Edge type reads
 * as **thread style** (solid / dotted / dashed-fine / frayed) + flow brightness, mirroring the 2D
 * tier and the Ledger label (colour/thread is never the sole cue — the Ledger carries the text).
 * `contradicts` frays in the tamper hue; that red only ever appears on a contradiction thread (and,
 * in U3, the byte-body + root diff) — never on a person or an Outcome.
 */
import type { EdgeView, NodeView } from "@gt100k/evidence-explorer-view";
import { Line } from "@react-three/drei";
import { useMemo } from "react";
import type { JSX } from "react";
import { type VerifyVisualState, isEdgeLit } from "../verify-machine.js";
import { COSMOS } from "./palette.js";

interface DashSpec {
  readonly dashed: boolean;
  readonly dashSize: number;
  readonly gapSize: number;
}

const DASH: Record<EdgeView["threadStyle"], DashSpec> = {
  solid: { dashed: false, dashSize: 1, gapSize: 0 },
  dotted: { dashed: true, dashSize: 0.06, gapSize: 0.36 },
  "dashed-fine": { dashed: true, dashSize: 0.32, gapSize: 0.28 },
  frayed: { dashed: true, dashSize: 0.08, gapSize: 0.22 },
};

function Thread({
  edge,
  from,
  to,
  lit,
  desaturated,
}: {
  edge: EdgeView;
  from: NodeView;
  to: NodeView;
  /** The verify light-wave has reached this edge → glow in the verify hue. */
  lit: boolean;
  /** On a tamper mismatch, lineage touching the byte-body desaturates (dim — never red). */
  desaturated: boolean;
}): JSX.Element {
  const dash = DASH[edge.threadStyle];
  const baseColor = edge.threadStyle === "frayed" ? COSMOS.tamper : COSMOS.line;
  const color = lit ? COSMOS.verify : baseColor;
  const width = (edge.flow ? 2.1 : 1.3) * (lit ? 1.5 : 1);
  let opacity = edge.flow ? 0.9 : 0.5;
  if (lit) opacity = 1;
  if (desaturated) opacity *= 0.28;
  return (
    <Line
      points={[
        [from.pos3d[0], from.pos3d[1], from.pos3d[2]],
        [to.pos3d[0], to.pos3d[1], to.pos3d[2]],
      ]}
      color={color}
      lineWidth={width}
      transparent
      opacity={opacity}
      dashed={dash.dashed}
      dashSize={dash.dashSize}
      gapSize={dash.gapSize}
    />
  );
}

export function Threads({
  edges,
  nodes,
  waveOrder = [],
  verify,
}: {
  edges: readonly EdgeView[];
  nodes: readonly NodeView[];
  /** Deterministic edge order the verify light-wave animates (`view.verifyWaveOrder`). */
  waveOrder?: ReadonlyArray<{ readonly from: string; readonly to: string }>;
  verify?: VerifyVisualState;
}): JSX.Element {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const litCount = verify?.run === "verify" ? verify.litEdgeCount : 0;
  const fracture = verify?.fractureNodeId ?? null;
  return (
    <group>
      {edges
        .filter((e) => e.isNodeEdge && byId.has(e.from) && byId.has(e.to))
        .map((e, i) => {
          const from = byId.get(e.from);
          const to = byId.get(e.to);
          if (!from || !to) return null;
          const lit = litCount > 0 && isEdgeLit(waveOrder, litCount, e.from, e.to);
          const desaturated = fracture !== null && (e.from === fracture || e.to === fracture);
          return (
            <Thread
              key={`${e.from}->${e.to}-${i}`}
              edge={e}
              from={from}
              to={to}
              lit={lit}
              desaturated={desaturated}
            />
          );
        })}
    </group>
  );
}
