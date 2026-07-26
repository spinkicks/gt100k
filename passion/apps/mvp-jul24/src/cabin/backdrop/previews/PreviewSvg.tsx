/**
 * Shared shell and palette for every puzzle preview.
 *
 * WHY SVG RATHER THAN THE DIV GRIDS THE REAL PUZZLES USE
 * A preview is warped by a projective `matrix3d` and then scaled again by the backdrop's cover fit,
 * so its rendered size is not known when it is authored and is different for every prop. SVG is the
 * only option that stays crisp through that: strokes and shapes are resolution-independent, whereas
 * a grid of divs with `1px` borders turns into a moiré of dropped and doubled hairlines as soon as a
 * non-integer scale lands on it. It also means one `viewBox` per preview replaces all per-cell
 * sizing arithmetic.
 *
 * `preserveAspectRatio="xMidYMid meet"` is deliberate: the source rectangle a preview is laid out in
 * has the *quad's* aspect ratio (a wide shelf, a tall pegboard), and a square board stretched to fit
 * a wide shelf reads as a mistake. `meet` letterboxes it instead, so the board keeps its proportions
 * and sits centred on the surface — which is what a real board resting on a real shelf does.
 */

import type { ReactNode } from "react";

/**
 * Preview palette.
 *
 * Pulled from the shared theme tokens (src/theme.css) so previews belong to the same room as
 * everything else, with two adjustments for this specific job: boards are drawn at full opacity
 * because they sit over busy warm painting and a translucent board reads as a smudge, and the ink is
 * the theme's `--ink` rather than a lighter secondary, because these shapes are often only a few
 * pixels across once scaled.
 */
export const P = {
  paper: "var(--parchment)",
  paperEdge: "var(--parchment-edge)",
  paperHi: "var(--parchment-hi)",
  line: "var(--wood-frame)",
  ink: "var(--ink)",
  inkSoft: "var(--ink-soft)",
  ember: "var(--ember)",
  emberBright: "var(--ember-bright)",
  emberDeep: "var(--ember-deep)",
  wood: "var(--wood)",
} as const;

/**
 * The outer <svg> every preview renders into.
 *
 * `aria-hidden` and `pointer-events: none` (in previews.css) are both load-bearing, not defensive.
 * The polygon over the prop is the control: it owns the click, it owns the accessible name, and it
 * owns the place in the tab order. A preview that could be hovered would steal pointer events from
 * the polygon it sits inside, and one that were exposed to assistive tech would announce a second,
 * contentless copy of a prop that already has a name.
 */
export function PreviewSvg({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}): JSX.Element {
  return (
    <svg
      className="cbd-preview-svg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * Grid-line positions: `count` values `step` apart, starting at 0.
 *
 * Every preview draws its grid by mapping over these rather than over an index, which means each
 * line's key is its own coordinate — a stable identity rather than a position in a list. Same output,
 * and it keeps the grid loops free of index-as-key suppressions so the ones that remain (cells keyed
 * by row and column, where the coordinate pair genuinely IS the identity) still stand out.
 */
export function ticks(count: number, step: number): number[] {
  return Array.from({ length: count }, (_, i) => i * step);
}

/**
 * A board backing: paper fill plus a soft edge, sized to the whole viewBox.
 *
 * The 1px inset keeps the stroke inside the viewBox — SVG strokes straddle the path, so a rect at
 * the exact bounds loses half its outline to clipping, which at small scale looks like a board with
 * two missing sides.
 */
export function PreviewPaper({
  width,
  height,
  fill = P.paper,
  radius = 2,
}: {
  width: number;
  height: number;
  fill?: string;
  radius?: number;
}): JSX.Element {
  return (
    <rect
      x={0.75}
      y={0.75}
      width={width - 1.5}
      height={height - 1.5}
      rx={radius}
      fill={fill}
      stroke={P.line}
      strokeWidth={1.5}
    />
  );
}
