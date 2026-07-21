/**
 * HUD iconography — a small, cohesive set of 1.5px stroke glyphs on a 24px grid, drawn in
 * `currentColor` so each icon inherits the control's ink/accent. All are decorative (`aria-hidden`):
 * every control they sit in carries a real text label or `aria-label`, so meaning never rides on the
 * icon alone (FR-E04 grayscale-safe). Kept out of `Hud.tsx` so the a11y SVG audit scans only the
 * decorative constellation glyphs there.
 */
import type { JSX, ReactNode } from "react";

type IconProps = { readonly size?: number };

function Svg({ size = 18, children }: { size?: number; children: ReactNode }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Trace lineage — a provenance branch flowing up toward an outcome node. */
export function TraceIcon({ size }: IconProps): JSX.Element {
  return (
    <Svg size={size}>
      <circle cx={6} cy={18} r={2.4} />
      <circle cx={18} cy={18} r={2.4} />
      <circle cx={12} cy={5} r={2.6} />
      <path d="M6 15.6c0-3 2-4 6-4.6M18 15.6c0-3-2-4-6-4.6" />
    </Svg>
  );
}

/** Filters — stacked sliders. */
export function FiltersIcon({ size }: IconProps): JSX.Element {
  return (
    <Svg size={size}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx={16} cy={7} r={2.2} />
      <circle cx={8} cy={17} r={2.2} />
    </Svg>
  );
}

/** Display — a screen with a spark, for the presentation/render controls. */
export function DisplayIcon({ size }: IconProps): JSX.Element {
  return (
    <Svg size={size}>
      <rect x={3} y={4.5} width={18} height={12} rx={2} />
      <path d="M9 20h6M12 16.5V20" />
      <path d="M12 8.2l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9z" />
    </Svg>
  );
}

/** Search — magnifier. */
export function SearchIcon({ size }: IconProps): JSX.Element {
  return (
    <Svg size={size}>
      <circle cx={10.5} cy={10.5} r={6} />
      <path d="M15 15l4 4" />
    </Svg>
  );
}

/** Fly-to — an arrow launching to the first match. */
export function FlyToIcon({ size }: IconProps): JSX.Element {
  return (
    <Svg size={size}>
      <path d="M5 12h13M13 6l6 6-6 6" />
    </Svg>
  );
}

/** Chevron — disclosure affordance; rotates via CSS when its panel is open. */
export function ChevronIcon({ size }: IconProps): JSX.Element {
  return (
    <Svg size={size}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

/** Nodes — a body inside the milestone constellation (the diamond node motif). */
export function NodesIcon({ size }: IconProps): JSX.Element {
  return (
    <Svg size={size}>
      <path d="M12 3.2l8.8 8.8-8.8 8.8L3.2 12z" />
      <circle cx={12} cy={12} r={2.1} />
    </Svg>
  );
}

/** Unlinked — a lone body radiating free, outside this milestone's threads. */
export function UnlinkedIcon({ size }: IconProps): JSX.Element {
  return (
    <Svg size={size}>
      <circle cx={12} cy={12} r={3} />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l1.8 1.8M18 18l-1.8-1.8M18 6l-1.8 1.8M6 18l1.8-1.8" />
    </Svg>
  );
}

/** Threads — two bodies joined by a provenance edge. */
export function ThreadsIcon({ size }: IconProps): JSX.Element {
  return (
    <Svg size={size}>
      <circle cx={6} cy={6} r={2.4} />
      <circle cx={18} cy={18} r={2.4} />
      <path d="M7.7 7.7c2.3 2.3 6.3 6.3 8.6 8.6" />
    </Svg>
  );
}
