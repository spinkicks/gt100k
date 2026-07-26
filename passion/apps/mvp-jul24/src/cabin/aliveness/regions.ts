/**
 * The coordinate contract for every region CabinAliveness is handed, plus the pure geometry that
 * turns those regions into CSS.
 *
 * COORDINATE SPACE — read this before authoring a single number.
 * Every coordinate in this file is in **the backdrop art's own pixel space**: the origin is the
 * top-left pixel of the generated image, +x runs right, +y runs down, and the extents are the
 * image's real `width` × `height` (e.g. 1024×1024 for `public/art/cabin-*.png`). This is the same
 * space the sibling backdrop component uses for its SVG `viewBox`, deliberately: a region is
 * measured once off the image in the units the image is actually addressed in, and it stays
 * correct at every window size because nothing downstream is in device pixels.
 *
 * The conversion to CSS happens in exactly one place — the helpers below turn art pixels into
 * percentages of the effect layer. Percentages (not `px`, not `vw`) are the only unit that tracks
 * a resizing container for free, with no JS layout measurement and no path by which a glow can
 * drift off the painted object it was authored over. The one assumption is that the element
 * CabinAliveness is mounted in is the same box the art fills; if the art is letterboxed inside a
 * larger element, that element — not this module — is the wrong size.
 *
 * Ellipse regions are **centre-anchored** (`x`,`y` is the middle of the glow, not its top-left),
 * because that is how you actually read a light source off an image: you point at the firebox and
 * then say how far the light reaches. Quad regions are four explicit corners, because a window
 * light shaft painted in perspective is a trapezoid and a bounding box would spill dust motes onto
 * the wall beside it.
 */

/** Pixel dimensions of the backdrop art. Defines the coordinate space for every region below. */
export interface ArtSize {
  width: number;
  height: number;
}

/** A single point in art pixels. */
export interface ArtPoint {
  x: number;
  y: number;
}

/**
 * A centre-anchored ellipse in art pixels: `x`,`y` is the centre, `w`,`h` the full extents.
 * Emitters are allowed to be much larger than the image (the whole-room bounce is, on purpose) —
 * the layer clips them, and an over-large soft gradient is exactly how a bounce light behaves.
 */
export interface ArtEllipse {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The firelight emitters for one room. Four dependent layers off one flicker signal (see
 * signal.ts): the fire itself, the light it throws down, the light the room throws back, and an
 * optional second warm source that lives on its own faster rhythm.
 */
export interface FirelightRegions {
  /** Tight, hot core over the firebox / lantern glass. */
  core: ArtEllipse;
  /** The pool of light on the floor or table in front of the fire. */
  floor: ArtEllipse;
  /** Whole-room bounce. Normally far wider than the art; very low amplitude. */
  bounce: ArtEllipse;
  /** Optional second warm source (wall sconce, candle cluster). Omit or null for none. */
  sconce?: ArtEllipse | null;
}

/**
 * The window light shaft, as the quadrilateral actually painted in that image. Corners are named
 * rather than positional so a room author cannot silently swap two of them: `u` runs
 * topLeft→topRight (and bottomLeft→bottomRight), `v` runs top→bottom.
 */
export interface ShaftRegion {
  topLeft: ArtPoint;
  topRight: ArtPoint;
  bottomRight: ArtPoint;
  bottomLeft: ArtPoint;
  /** sRGB tint of the shaft light, 0–255. Defaults to DEFAULT_SHAFT_TINT. */
  tint?: readonly [number, number, number];
}

/** Cool daylight, very slightly blue. Rooms lit by a warmer window should override this. */
export const DEFAULT_SHAFT_TINT: readonly [number, number, number] = [226, 240, 255];

/**
 * Four corners as a tuple, in the same TL/TR/BR/BL order the sibling backdrop module winds its
 * quads in. Kept as a structural type rather than an import so this folder does not depend on that
 * module — the two only have to agree about the ordering, which they already do.
 */
export type QuadPoints = readonly [
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
];

/** Adapter for callers that already hold a room's quads as point tuples. */
export function shaftFromQuad(
  points: QuadPoints,
  tint?: readonly [number, number, number],
): ShaftRegion {
  const [tl, tr, br, bl] = points;
  return {
    topLeft: { x: tl[0], y: tl[1] },
    topRight: { x: tr[0], y: tr[1] },
    bottomRight: { x: br[0], y: br[1] },
    bottomLeft: { x: bl[0], y: bl[1] },
    ...(tint ? { tint } : {}),
  };
}

/** CSS `left/top/width/height` percentages — what every effect layer is positioned with. */
export interface BoxPct {
  left: number;
  top: number;
  width: number;
  height: number;
}

const pct = (value: number, total: number): number => (total === 0 ? 0 : (value / total) * 100);

/** Centre-anchored art ellipse → the top-left-anchored percentage box CSS wants. */
export function ellipseBoxPct(e: ArtEllipse, art: ArtSize): BoxPct {
  return {
    left: pct(e.x - e.w / 2, art.width),
    top: pct(e.y - e.h / 2, art.height),
    width: pct(e.w, art.width),
    height: pct(e.h, art.height),
  };
}

const corners = (q: ShaftRegion): ArtPoint[] => [
  q.topLeft,
  q.topRight,
  q.bottomRight,
  q.bottomLeft,
];

/** Axis-aligned bounding box of the shaft quad, as percentages. The sheen element's box. */
export function quadBoundsPct(q: ShaftRegion, art: ArtSize): BoxPct {
  const pts = corners(q);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    left: pct(minX, art.width),
    top: pct(minY, art.height),
    width: pct(maxX - minX, art.width),
    height: pct(maxY - minY, art.height),
  };
}

/**
 * `clip-path: polygon(...)` for the sheen, in coordinates relative to its own bounding box (which
 * is what `clip-path` percentages resolve against — not the parent). A degenerate quad (zero width
 * or height) would divide by zero, so it collapses to the box instead of emitting `NaN%`.
 */
export function quadClipPath(q: ShaftRegion, art: ArtSize): string {
  void art; // the clip-path is bounds-relative, so the art size cancels out — kept for symmetry
  const pts = corners(q);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const inner = pts
    .map((p) => {
      const u = spanX === 0 ? 0 : ((p.x - minX) / spanX) * 100;
      const v = spanY === 0 ? 0 : ((p.y - minY) / spanY) * 100;
      return `${u.toFixed(2)}% ${v.toFixed(2)}%`;
    })
    .join(", ");
  return `polygon(${inner})`;
}

/**
 * Bilinear point inside the shaft quad. `u` 0→1 crosses it left→right, `v` 0→1 runs top→bottom, so
 * a mote falling down the shaft is just `v` increasing — and it stays inside the painted trapezoid
 * for free, which is the whole reason the shaft is a quad and not a rect.
 */
export function quadPoint(q: ShaftRegion, u: number, v: number): ArtPoint {
  const topX = q.topLeft.x + (q.topRight.x - q.topLeft.x) * u;
  const topY = q.topLeft.y + (q.topRight.y - q.topLeft.y) * u;
  const bottomX = q.bottomLeft.x + (q.bottomRight.x - q.bottomLeft.x) * u;
  const bottomY = q.bottomLeft.y + (q.bottomRight.y - q.bottomLeft.y) * u;
  return { x: topX + (bottomX - topX) * v, y: topY + (bottomY - topY) * v };
}
