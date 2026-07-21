/**
 * Static legend for the visual language (§U8.12) — every node type is shown as glyph + color + text,
 * and every edge type as its thread meaning, so the observatory is legible without color vision.
 */
import { EDGE_THREADS, NODE_COLOR_ROLES, NODE_GLYPHS } from "@gt100k/evidence-explorer-view";
import type { EdgeType, NodeType } from "@gt100k/evidence-graph";
import type { JSX } from "react";
import { Glyph } from "./constellation/glyphs.js";

const NODE_TYPES = Object.keys(NODE_GLYPHS) as NodeType[];
const EDGE_TYPES = Object.keys(EDGE_THREADS) as EdgeType[];

export function Legend(): JSX.Element {
  return (
    <aside className="panel legend" aria-label="Legend">
      <h2 className="legend-title">Bodies</h2>
      <ul className="legend-grid">
        {NODE_TYPES.map((t) => (
          <li key={t} className="legend-item">
            <svg width={26} height={26} viewBox="-13 -13 26 26" aria-hidden="true">
              <circle r={12} fill={`var(--${NODE_COLOR_ROLES[t]})`} opacity={0.18} />
              <g style={{ color: `var(--${NODE_COLOR_ROLES[t]})` }}>
                <Glyph glyph={NODE_GLYPHS[t]} r={7} />
              </g>
            </svg>
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <h2 className="legend-title">Threads</h2>
      <ul className="legend-threads">
        {EDGE_TYPES.map((t) => (
          <li key={t} className="legend-item">
            <svg width={30} height={12} viewBox="0 0 30 12" aria-hidden="true">
              <line
                x1={1}
                y1={6}
                x2={29}
                y2={6}
                stroke="var(--ink-muted)"
                strokeWidth={EDGE_THREADS[t].flow ? 1.8 : 1.2}
                strokeDasharray={
                  EDGE_THREADS[t].threadStyle === "dotted"
                    ? "1.5 4"
                    : EDGE_THREADS[t].threadStyle === "dashed-fine"
                      ? "4 4"
                      : EDGE_THREADS[t].threadStyle === "frayed"
                        ? "1 3"
                        : undefined
                }
              />
            </svg>
            <span>{EDGE_THREADS[t].label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
