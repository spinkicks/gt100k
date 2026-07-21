/**
 * 2D node glyphs (§U8.12) — one distinct shape per node type so type is legible without color
 * (FR-E04). Each glyph is drawn centered on (0,0); the caller translates it onto the body.
 */
import type { NodeGlyphId } from "@gt100k/evidence-explorer-view";
import type { JSX } from "react";

/** Draw a glyph centered at the origin, scaled to roughly ±`r`. Stroke inherits `currentColor`. */
export function Glyph({ glyph, r = 9 }: { glyph: NodeGlyphId; r?: number }): JSX.Element {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (glyph) {
    case "diamond": // Artifact
      return <path d={`M0 ${-r} L${r} 0 L0 ${r} L${-r} 0 Z`} {...common} />;
    case "play": // Attempt
      return <path d={`M${-r * 0.6} ${-r} L${r} 0 L${-r * 0.6} ${r} Z`} {...common} />;
    case "blueprint": // Transformation
      return (
        <g {...common}>
          <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={2} />
          <path d={`M${-r} 0 H${r} M0 ${-r} V${r}`} strokeWidth={1} opacity={0.7} />
        </g>
      );
    case "quote": // Claim
      return (
        <g {...common}>
          <path d={`M${-r} ${r * 0.4} q0 ${-r} ${r * 0.9} ${-r}`} />
          <path d={`M${r * 0.1} ${r * 0.4} q0 ${-r} ${r * 0.9} ${-r}`} />
        </g>
      );
    case "spark": // Assistance (comet)
      return (
        <g {...common}>
          <path d={`M0 ${-r} V${r} M${-r} 0 H${r}`} />
          <path
            d={`M${-r * 0.7} ${-r * 0.7} L${r * 0.7} ${r * 0.7} M${r * 0.7} ${-r * 0.7} L${-r * 0.7} ${r * 0.7}`}
            opacity={0.7}
          />
        </g>
      );
    case "scale": // Review
      return (
        <g {...common}>
          <path d={`M0 ${-r} V${r * 0.8}`} />
          <path d={`M${-r} ${-r * 0.4} H${r}`} />
          <path d={`M${-r} ${-r * 0.4} l${-r * 0.35} ${r * 0.9} h${r * 0.7} Z`} />
          <path d={`M${r} ${-r * 0.4} l${-r * 0.35} ${r * 0.9} h${r * 0.7} Z`} />
        </g>
      );
    case "hex": // Contribution
      return (
        <path
          d={`M${r} 0 L${r * 0.5} ${r * 0.87} L${-r * 0.5} ${r * 0.87} L${-r} 0 L${-r * 0.5} ${-r * 0.87} L${r * 0.5} ${-r * 0.87} Z`}
          {...common}
        />
      );
    case "seal": // Outcome (seal-sun)
      return (
        <g {...common}>
          <circle cx={0} cy={0} r={r * 0.72} />
          <path d={`M${-r * 0.35} 0 l${r * 0.28} ${r * 0.32} l${r * 0.5} ${-r * 0.62}`} />
        </g>
      );
  }
}
