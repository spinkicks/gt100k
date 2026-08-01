/**
 * The projective transform that lands a flat DOM element on a painted surface in perspective.
 *
 * Props in the backdrop are painted at an angle, so a puzzle preview that is going to read as
 * *lying on the wall* cannot be positioned with `left/top/width/height` and a rotation — it needs
 * the full 8-degree-of-freedom mapping from its own rectangle onto the four painted corners. That
 * mapping is a 2D homography, and CSS can apply one via `matrix3d` (a 4x4 transform whose w row is
 * what makes the perspective divide happen).
 *
 * This module is deliberately pure and React-free: it is the single place a sign error or a
 * transposed matrix could silently skew every prop in the room, so it is the place with the
 * heaviest test coverage (see homography.test.ts).
 *
 * ---------------------------------------------------------------------------
 * CONVENTIONS, stated once because mixing them up is the classic failure mode
 * ---------------------------------------------------------------------------
 * `Matrix3` is stored ROW-MAJOR and applied to COLUMN vectors:
 *
 *     ⎡ m00 m01 m02 ⎤   ⎡x⎤     ⎡x'⎤
 *     ⎢ m10 m11 m12 ⎥ · ⎢y⎥  =  ⎢y'⎥      screen = (x'/w, y'/w)
 *     ⎣ m20 m21 m22 ⎦   ⎣1⎦     ⎣w ⎦
 *
 * CSS `matrix3d(...)` takes its sixteen arguments in COLUMN-MAJOR order, so `toMatrix3d` below
 * transposes as it serialises. Getting this backwards produces a transform that is wrong but not
 * obviously wrong (it is the correct warp of the *transposed* quad), which is exactly why the
 * Playwright check in verify/matrix3d.verify.ts measures rendered corners in a real browser
 * instead of trusting these numbers.
 *
 * The transform is applied in the element's LOCAL coordinate space. Two consequences the caller
 * must honour, both handled by CabinBackdrop.tsx:
 *   1. `transform-origin: 0 0` — CSS defaults to the element's centre, which would offset the whole
 *      mapping by half the element's size.
 *   2. The element must be sized to exactly the source rectangle (`width: w px; height: h px`) and
 *      positioned at the layer origin (`left: 0; top: 0`), because this matrix maps the source
 *      rectangle (0,0)-(w,h) onto ABSOLUTE art coordinates. The quad's position is baked into the
 *      matrix's translation column; there is no separate offset to apply.
 */

import { type Point, type Quad, isStrictlyConvex } from "./geometry";

/** Row-major 3x3, applied to column vectors. See the module comment. */
export type Matrix3 = readonly [
  m00: number,
  m01: number,
  m02: number,
  m10: number,
  m11: number,
  m12: number,
  m20: number,
  m21: number,
  m22: number,
];

export const IDENTITY: Matrix3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

/**
 * Below this, a determinant-like quantity counts as zero.
 *
 * Chosen relative to the working scale rather than to machine epsilon: inputs are art pixels in the
 * low thousands, and the quantities guarded here (`den`, and w at each corner) are products of
 * pixel differences, so they are O(10^6) for any real quad. 1e-9 is therefore ~15 orders of
 * magnitude below "real" and still far above the float noise a near-degenerate quad accumulates.
 */
const EPSILON = 1e-9;

/** Apply a homography to a point. Returns `null` where the point maps to the horizon (w ~ 0). */
export function applyMatrix3(m: Matrix3, point: Point): Point | null {
  const [x, y] = point;
  const w = m[6] * x + m[7] * y + m[8];
  if (Math.abs(w) < EPSILON) return null;
  return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w];
}

/**
 * The homography taking the source rectangle (0,0)-(width,height) onto `quad`, whose four points
 * are the images of the source corners in the order top-left, top-right, bottom-right, bottom-left.
 *
 * Returns `null` — never a matrix full of NaN or Infinity — when no such transform exists:
 *   - `width` or `height` is not a positive finite number,
 *   - the quad is not strictly convex, which covers a collinear triple, a repeated corner, a
 *     zero-area quad, and the bow-tie you get from swapping two corners,
 *   - the projective solve is singular anyway (belt and braces against a convexity test that
 *     passed on integers but is numerically hopeless),
 *   - some source corner maps to w <= 0, meaning the quad is the image of a rectangle that folds
 *     through the plane at infinity. CSS renders those as garbage rather than failing, so they are
 *     rejected here.
 *
 * METHOD (Heckbert, *Fundamentals of Texture Mapping and Image Warping*, appendix "square to
 * quad"). The general 4-point solve is an 8x8 linear system, but the unit-square special case has a
 * closed form, so this maps unit square -> quad analytically and pre-composes the trivial
 * `diag(1/width, 1/height, 1)` that carries source pixels into the unit square. No linear solver,
 * no pivoting, no iteration — which is the whole reason the failure modes above can be enumerated
 * exhaustively instead of discovered.
 */
export function rectToQuad(width: number, height: number, quad: Quad): Matrix3 | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  if (!quad.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))) return null;
  if (!isStrictlyConvex(quad)) return null;

  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;

  // How far the quad departs from a parallelogram. Zero on both axes => the mapping is affine and
  // the projective row vanishes; this is not a degenerate case, it is the common one (a prop
  // painted head-on, or any pure rotate/scale/shear), and it needs its own branch because the
  // projective formula divides by a quantity that is only meaningful when there IS foreshortening.
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;

  // Heckbert's a-coefficients, in his ROW-vector convention: [u v 1] · A = [x' y' w].
  let a11: number;
  let a21: number;
  let a12: number;
  let a22: number;
  let a13: number;
  let a23: number;

  if (Math.abs(sx) < EPSILON && Math.abs(sy) < EPSILON) {
    a11 = x1 - x0;
    a21 = x3 - x0;
    a12 = y1 - y0;
    a22 = y3 - y0;
    a13 = 0;
    a23 = 0;
    // An affine map is singular exactly when its 2x2 linear part is.
    if (Math.abs(a11 * a22 - a21 * a12) < EPSILON) return null;
  } else {
    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const den = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(den) < EPSILON) return null;
    a13 = (sx * dy2 - dx2 * sy) / den;
    a23 = (dx1 * sy - sx * dy1) / den;
    a11 = x1 - x0 + a13 * x1;
    a21 = x3 - x0 + a23 * x3;
    a12 = y1 - y0 + a13 * y1;
    a22 = y3 - y0 + a23 * y3;
  }

  // Transpose into the column-vector convention and fold in the source-rectangle normalisation
  // (u = x/width, v = y/height) by scaling the first two columns. a33 is 1 by construction, which
  // fixes the overall scale of the homogeneous matrix and is what makes the w > 0 test below a
  // meaningful check rather than a sign convention.
  const m: Matrix3 = [
    nz(a11 / width),
    nz(a21 / height),
    nz(x0),
    nz(a12 / width),
    nz(a22 / height),
    nz(y0),
    nz(a13 / width),
    nz(a23 / height),
    1,
  ];

  // Every source corner must sit in front of the camera. (w at (0,0) is a33 = 1, so this really
  // only tests the other three, but checking all four keeps the invariant obvious.)
  for (const corner of sourceCorners(width, height)) {
    const w = m[6] * corner[0] + m[7] * corner[1] + m[8];
    if (w <= EPSILON) return null;
  }

  return m;
}

/**
 * Collapse negative zero. `-0` is arithmetically identical to `0` but it survives division, prints
 * as `-0` in the serialised transform, and — the reason this exists — makes `toEqual` assertions on
 * an otherwise-exact matrix fail for a difference nothing can observe.
 */
function nz(v: number): number {
  return v === 0 ? 0 : v;
}

/** The source rectangle's corners in the same order a `Quad` lists its destinations. */
export function sourceCorners(width: number, height: number): Quad {
  return [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];
}

/**
 * Trim float noise without losing precision that matters.
 *
 * 12 significant digits keeps sub-micron accuracy on a 1536px canvas while collapsing the
 * `2.220446049250313e-16` that an exactly-axis-aligned quad produces down to a clean `0`, so the
 * serialised transform of an unrotated prop is readable in devtools.
 */
function trim(n: number): number {
  return Number(n.toPrecision(12));
}

/**
 * Serialise as a CSS `matrix3d(...)`, transposing to column-major on the way out.
 *
 * The 3x3 homography is embedded in 4x4 by keeping z untouched and routing the projective row into
 * the fourth (w) row:
 *
 *     ⎡ m00 m01 0 m02 ⎤
 *     ⎢ m10 m11 0 m12 ⎥
 *     ⎢  0   0  1  0  ⎥
 *     ⎣ m20 m21 0 m22 ⎦
 *
 * Note the projective terms land in row 4, columns 1-2 — NOT in the third column where a
 * perspective() function would put them. Elements are flat (z = 0), so the z column and row stay
 * identity and no `perspective` on an ancestor is required or wanted.
 */
export function toMatrix3d(m: Matrix3): string {
  const cols = [
    [m[0], m[3], 0, m[6]],
    [m[1], m[4], 0, m[7]],
    [0, 0, 1, 0],
    [m[2], m[5], 0, m[8]],
  ];
  return `matrix3d(${cols.flat().map(trim).join(", ")})`;
}

/**
 * The CSS `transform` value that warps a `width` x `height` element onto `quad`, or `null` when the
 * quad admits no such transform. Convenience wrapper — the caller still has to set
 * `transform-origin: 0 0` and size the element to the source rectangle (see the module comment).
 */
export function quadTransform(width: number, height: number, quad: Quad): string | null {
  const m = rectToQuad(width, height, quad);
  return m === null ? null : toMatrix3d(m);
}
