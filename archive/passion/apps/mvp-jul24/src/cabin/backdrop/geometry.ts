/**
 * Polygon primitives for the still-backdrop cabin, all expressed in **source-art pixels**.
 *
 * WHY ART PIXELS AND NOT PERCENTAGES
 * The backdrop is one generated still (currently 1536x1024). Every hotspot polygon and every
 * homography target is authored as integer pixel coordinates read straight off that image, and the
 * SVG overlay declares the same numbers as its `viewBox`. Percentages would force a divide at
 * authoring time and a multiply at render time, and the two rounding sites are where drift creeps
 * in — a hotspot that sits on the painted object at 1440px wide but half a cell off at 900px. With
 * the art's own coordinate system as the viewBox there is no arithmetic between the number in
 * `quads.data.ts` and the pixel in the painting, at any scale.
 *
 * COORDINATE SYSTEM
 * y grows DOWNWARD (image convention), so "clockwise on screen" is the POSITIVE shoelace
 * direction — the opposite of the maths-textbook convention where y grows up. Every helper here
 * follows the screen convention, and every polygon in the data file is wound clockwise on screen
 * (top-left -> top-right -> bottom-right -> bottom-left for a quad).
 */

/** A point in source-art pixels. */
export type Point = readonly [x: number, y: number];

/** An N-point outline, wound clockwise on screen. At least 3 points. */
export type Polygon = readonly Point[];

/**
 * Exactly four points, ordered top-left, top-right, bottom-right, bottom-left **of the object as
 * painted** — i.e. the corner that should receive the source rectangle's top-left corner comes
 * first, and the order proceeds clockwise on screen from there. This ordering is load-bearing:
 * `homography.ts` maps the source rectangle's corners onto these four in exactly this sequence, so
 * rotating the tuple rotates the composited preview.
 */
export type Quad = readonly [Point, Point, Point, Point];

/**
 * Twice the signed area (the raw shoelace sum). Positive means the polygon is wound clockwise on
 * screen in this y-down coordinate system; negative means counter-clockwise; zero means every
 * point is collinear (or the outline doubles back on itself exactly).
 *
 * Returned undoubled-and-unhalved on purpose: callers only ever want the sign or a magnitude
 * compared against a tolerance, and skipping the /2 keeps integer input in integer arithmetic.
 */
export function shoelace(polygon: Polygon): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x0, y0] = polygon[i]!;
    const [x1, y1] = polygon[(i + 1) % polygon.length]!;
    sum += x0 * y1 - x1 * y0;
  }
  return sum;
}

/** Signed area; positive = clockwise on screen (see `shoelace`). */
export function signedArea(polygon: Polygon): number {
  return shoelace(polygon) / 2;
}

/**
 * True when the outline is wound clockwise on screen AND encloses more than `minArea` art pixels.
 * Both halves matter: a consistently-wound set of collinear points has zero area and would render
 * as an invisible, unclickable hotspot rather than failing loudly.
 */
export function isClockwise(polygon: Polygon, minArea = 1): boolean {
  return signedArea(polygon) >= minArea;
}

/** Cross product of the turn at vertex `i` — sign tells which way the outline bends there. */
function turnAt(polygon: Polygon, i: number): number {
  const n = polygon.length;
  const [ax, ay] = polygon[i]!;
  const [bx, by] = polygon[(i + 1) % n]!;
  const [cx, cy] = polygon[(i + 2) % n]!;
  return (bx - ax) * (cy - by) - (by - ay) * (cx - bx);
}

/**
 * True when every vertex turns the same way and none of them is a straight-through (zero) turn.
 *
 * This single test is exactly the precondition a homography target needs, which is why it lives
 * here rather than being spelled out ad hoc in `homography.ts`: the image of a rectangle under a
 * projective transform with all-positive w is always a strictly convex quad, so anything that
 * fails this test is either degenerate (a collinear triple, a repeated corner), self-intersecting
 * (a bow-tie from swapped corners — the single most likely authoring slip), or the image of a
 * transform that folds through the horizon. Rejecting it up front is why `rectToQuad` can never
 * return NaN.
 */
export function isStrictlyConvex(polygon: Polygon): boolean {
  if (polygon.length < 3) return false;
  const first = turnAt(polygon, 0);
  if (first === 0) return false;
  const sign = Math.sign(first);
  for (let i = 1; i < polygon.length; i++) {
    const t = turnAt(polygon, i);
    if (t === 0 || Math.sign(t) !== sign) return false;
  }
  return true;
}

/**
 * Even-odd point-in-polygon test.
 *
 * The browser does the real hit testing at runtime (an SVG `<polygon>` with `pointer-events: fill`
 * is hit only inside its interior), so this is not on the interaction path. It exists so tests can
 * assert *where* a polygon actually is — e.g. that a quad authored for the pegboard contains the
 * pegboard's centre and excludes the corner of its bounding box — without a browser.
 */
export function containsPoint(polygon: Polygon, point: Point): boolean {
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;
    const straddles = yi > py !== yj > py;
    if (straddles && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Axis-aligned bounding box, in art pixels. */
export function bounds(polygon: Polygon): Bounds {
  const xs = polygon.map(([x]) => x);
  const ys = polygon.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** SVG `points` attribute for a polygon — `"x,y x,y …"`. */
export function toSvgPoints(polygon: Polygon): string {
  return polygon.map(([x, y]) => `${x},${y}`).join(" ");
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/**
 * The size, in art pixels, of the source rectangle a flat prop's preview should be laid out in:
 * the mean of the quad's two horizontal edges by the mean of its two vertical edges, rounded.
 *
 * Sizing the source rectangle to the quad rather than to a fixed constant is what keeps previews
 * legible. The homography maps source pixels onto destination pixels, so a source rectangle much
 * larger than its quad minifies every stroke in the preview into sub-pixel mush, and one much
 * smaller magnifies it into a blur. Matching them means the preview renders at roughly 1:1 against
 * the art it sits on, and the only remaining scale factor is the backdrop's own cover-fit.
 */
export function quadSourceSize(quad: Quad): { width: number; height: number } {
  const [tl, tr, br, bl] = quad;
  return {
    width: Math.max(1, Math.round((distance(tl, tr) + distance(bl, br)) / 2)),
    height: Math.max(1, Math.round((distance(tl, bl) + distance(tr, br)) / 2)),
  };
}
