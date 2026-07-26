/**
 * Mapping art pixels onto the on-screen box the backdrop occupies.
 *
 * Three layers have to agree on this mapping to the pixel or hotspots drift off the painting:
 *
 *   1. the `<img>`, scaled by CSS `object-fit`;
 *   2. the SVG hotspot overlay, scaled by its own `preserveAspectRatio`;
 *   3. the DOM layer holding the warped previews, scaled by a CSS transform.
 *
 * (1) and (2) need no arithmetic from us — `object-fit: cover` and `preserveAspectRatio` of
 * `xMidYMid slice` are *defined* to be the same rule, so the browser keeps them locked together for
 * free, at any box size, with no measurement and nothing to re-run on resize. That is the whole
 * reason the polygons live in an SVG with the art's viewBox rather than in absolutely-positioned
 * divs.
 *
 * (3) cannot use either mechanism: a projective `matrix3d` has to be composed with a *known* scale
 * factor, so this module reproduces the same rule arithmetically and `useCoverFit` feeds it a
 * measured box. `fit.test.ts` pins the equivalence, and `svgPreserveAspectRatio` exists so the two
 * are chosen from one switch instead of two places that can drift apart.
 */

export type FitMode = "cover" | "contain";

export interface Fit {
  /** Art pixels -> CSS pixels. */
  scale: number;
  /** CSS-pixel offset of the art's (0,0) from the box's top-left. Negative under `cover`. */
  offsetX: number;
  offsetY: number;
}

/**
 * How the art sits inside a `boxWidth` x `boxHeight` box.
 *
 * `cover` fills the box and lets the art overflow on one axis (the room bleeds off-frame, which is
 * what a first-person interior wants); `contain` letterboxes. Both centre on both axes, matching
 * `xMidYMid`.
 *
 * A degenerate box (zero or negative on either axis, which is what a ResizeObserver reports for one
 * frame before layout settles, and what jsdom reports always) yields scale 0 rather than NaN or
 * Infinity. Callers can then render the layer at zero scale — invisible but structurally present,
 * so nothing has to branch on "not measured yet".
 */
export function fitArt(
  boxWidth: number,
  boxHeight: number,
  artWidth: number,
  artHeight: number,
  mode: FitMode = "cover",
): Fit {
  if (
    !(boxWidth > 0) ||
    !(boxHeight > 0) ||
    !(artWidth > 0) ||
    !(artHeight > 0) ||
    !Number.isFinite(boxWidth) ||
    !Number.isFinite(boxHeight)
  ) {
    return { scale: 0, offsetX: 0, offsetY: 0 };
  }
  const sx = boxWidth / artWidth;
  const sy = boxHeight / artHeight;
  const scale = mode === "cover" ? Math.max(sx, sy) : Math.min(sx, sy);
  return {
    scale,
    offsetX: (boxWidth - artWidth * scale) / 2,
    offsetY: (boxHeight - artHeight * scale) / 2,
  };
}

/**
 * The `preserveAspectRatio` value that makes an SVG scale identically to `object-fit: <mode>` with
 * the default `object-position: 50% 50%`. `slice` is cover, `meet` is contain.
 */
export function svgPreserveAspectRatio(mode: FitMode): string {
  return mode === "cover" ? "xMidYMid slice" : "xMidYMid meet";
}

/** Where an art-pixel point lands in the box, in CSS pixels. */
export function artToBox(fit: Fit, x: number, y: number): [number, number] {
  return [fit.offsetX + x * fit.scale, fit.offsetY + y * fit.scale];
}

/**
 * The CSS `transform` for a layer sized `artWidth` x `artHeight` **in CSS pixels** so that its own
 * coordinate space becomes art pixels. Needs `transform-origin: 0 0`.
 *
 * Translate-then-scale, in that order: CSS applies functions left-to-right as a matrix product, so
 * the translation here is in untransformed (box) pixels — which is what `fitArt` reports. Writing
 * it the other way round would scale the offset a second time.
 */
export function fitTransform(fit: Fit): string {
  return `translate(${fit.offsetX}px, ${fit.offsetY}px) scale(${fit.scale})`;
}
