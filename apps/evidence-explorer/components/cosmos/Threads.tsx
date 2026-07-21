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

function Thread({ edge, from, to }: { edge: EdgeView; from: NodeView; to: NodeView }): JSX.Element {
  const dash = DASH[edge.threadStyle];
  const color = edge.threadStyle === "frayed" ? COSMOS.tamper : COSMOS.line;
  const width = edge.flow ? 2.1 : 1.3;
  const opacity = edge.flow ? 0.9 : 0.5;
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
}: {
  edges: readonly EdgeView[];
  nodes: readonly NodeView[];
}): JSX.Element {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  return (
    <group>
      {edges
        .filter((e) => e.isNodeEdge && byId.has(e.from) && byId.has(e.to))
        .map((e, i) => {
          const from = byId.get(e.from);
          const to = byId.get(e.to);
          if (!from || !to) return null;
          return <Thread key={`${e.from}->${e.to}-${i}`} edge={e} from={from} to={to} />;
        })}
    </group>
  );
}
