/**
 * Board glyphs: original vector chess pieces + a 5x7 bitmap font.
 *
 * Pieces are defined as polygon outlines in a unit square (0..1, y pointing
 * down) so a caller can scale them to any square size. They are drawn as plain
 * polygons rather than imported from a piece font or an existing SVG set for two
 * reasons: no font/rasterizer dependency, and no third-party artwork licence to
 * carry in a public repo. They are deliberately built from strong silhouettes
 * (crown points, mitre, crenellations, horse profile) because the whole point of
 * this renderer is that a vision model can tell the pieces apart.
 *
 * The font exists only so coordinate labels ("a".."h", "1".."8") never depend on
 * fontconfig finding a system typeface.
 */

// Shared bottom of every piece: a flared foot plus the base plate it stands on.
const foot = (top) => [
  [0.30, top],
  [0.70, top],
  [0.76, top + 0.055],
  [0.80, top + 0.10],
  [0.20, top + 0.10],
  [0.24, top + 0.055],
];

/** Small horizontal collar, used to break up a piece's silhouette. */
const collar = (y, halfWidth, h) => [
  [0.5 - halfWidth, y],
  [0.5 + halfWidth, y],
  [0.5 + halfWidth, y + h],
  [0.5 - halfWidth, y + h],
];

/**
 * Each entry returns an array of subpaths. Subpaths are filled together with the
 * even-odd rule, so an inner loop (the bishop's slit) reads as a hole.
 */
export const CHESS_PIECES = {
  pawn: () => [
    circleish(0.5, 0.32, 0.115),
    collar(0.40, 0.115, 0.045),
    [[0.415, 0.445], [0.585, 0.445], [0.635, 0.76], [0.365, 0.76]],
    foot(0.76),
  ],

  rook: () => [
    // Crenellated top drawn as one polygon with two notches cut into its edge.
    [
      [0.28, 0.20], [0.375, 0.20], [0.375, 0.27], [0.445, 0.27],
      [0.445, 0.20], [0.555, 0.20], [0.555, 0.27], [0.625, 0.27],
      [0.625, 0.20], [0.72, 0.20], [0.72, 0.35], [0.28, 0.35],
    ],
    collar(0.35, 0.20, 0.04),
    [[0.375, 0.39], [0.625, 0.39], [0.665, 0.74], [0.335, 0.74]],
    foot(0.74),
  ],

  knight: () => [
    // Horse head in profile, facing left. Two ears and a muzzle carry the read.
    [
      [0.31, 0.78], [0.325, 0.60], [0.30, 0.53], [0.235, 0.485],
      [0.175, 0.44], [0.205, 0.395], [0.275, 0.40], [0.315, 0.375],
      [0.345, 0.275], [0.385, 0.155], [0.455, 0.285],
      [0.515, 0.175], [0.565, 0.30],
      [0.645, 0.40], [0.695, 0.55], [0.70, 0.78],
    ],
    foot(0.78),
  ],

  bishop: () => [
    circleish(0.5, 0.145, 0.045),
    // Mitre.
    [
      [0.5, 0.175], [0.585, 0.27], [0.615, 0.375], [0.585, 0.44],
      [0.415, 0.44], [0.385, 0.375], [0.415, 0.27],
    ],
    // Diagonal slit cut into the mitre.
    [[0.515, 0.245], [0.565, 0.315], [0.535, 0.335], [0.485, 0.265]],
    collar(0.44, 0.155, 0.04),
    [[0.40, 0.48], [0.60, 0.48], [0.65, 0.75], [0.35, 0.75]],
    foot(0.75),
  ],

  queen: () => [
    // Five-point coronet.
    [
      [0.285, 0.365],
      [0.315, 0.215], [0.375, 0.315],
      [0.435, 0.185], [0.5, 0.30],
      [0.565, 0.185], [0.625, 0.315],
      [0.685, 0.215], [0.715, 0.365],
    ],
    circleish(0.315, 0.20, 0.038),
    circleish(0.435, 0.17, 0.038),
    circleish(0.565, 0.17, 0.038),
    circleish(0.685, 0.20, 0.038),
    collar(0.365, 0.215, 0.045),
    [[0.395, 0.41], [0.605, 0.41], [0.655, 0.75], [0.345, 0.75]],
    foot(0.75),
  ],

  king: () => [
    // Cross as a single plus-shaped polygon: two overlapping rects would cancel
    // each other out under the even-odd rule.
    [
      [0.47, 0.095], [0.53, 0.095], [0.53, 0.15], [0.59, 0.15],
      [0.59, 0.21], [0.53, 0.21], [0.53, 0.30], [0.47, 0.30],
      [0.47, 0.21], [0.41, 0.21], [0.41, 0.15], [0.47, 0.15],
    ],
    // Crown band with a scalloped upper edge.
    [
      [0.325, 0.415], [0.345, 0.315], [0.42, 0.375], [0.5, 0.315],
      [0.58, 0.375], [0.655, 0.315], [0.675, 0.415],
    ],
    collar(0.415, 0.185, 0.045),
    [[0.395, 0.46], [0.605, 0.46], [0.655, 0.75], [0.345, 0.75]],
    foot(0.75),
  ],
};

/**
 * Details painted in the outline colour on top of a finished piece. Cutting the
 * knight's eye as a hole instead would show the square's colour through it, which
 * reads as a stray board-coloured dot rather than an eye.
 */
export const PIECE_ACCENTS = {
  knight: [circleish(0.345, 0.35, 0.028)],
};

/** Polygon approximation of a circle in unit coordinates. */
function circleish(cx, cy, r, segments = 40) {
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]);
  }
  return pts;
}

/** Non-chess piece shapes, for draughts/go/reversi/connect-four style boards. */
export const SHAPES = {
  disc: () => [circleish(0.5, 0.5, 0.38)],
  ring: () => [circleish(0.5, 0.5, 0.38), circleish(0.5, 0.5, 0.24)],
  square: () => [[[0.16, 0.16], [0.84, 0.16], [0.84, 0.84], [0.16, 0.84]]],
  cross: () => [
    [
      [0.20, 0.30], [0.30, 0.20], [0.5, 0.40], [0.70, 0.20], [0.80, 0.30],
      [0.60, 0.50], [0.80, 0.70], [0.70, 0.80], [0.5, 0.60], [0.30, 0.80],
      [0.20, 0.70], [0.40, 0.50],
    ],
  ],
  triangle: () => [[[0.5, 0.15], [0.85, 0.82], [0.15, 0.82]]],
  // A crowned disc, for a promoted draughts piece. The crown itself is an accent
  // so it is painted in the outline colour rather than cut out as a hole.
  crown: () => [circleish(0.5, 0.5, 0.38)],
};

/** Shape details painted in the outline colour on top of the filled shape. */
export const SHAPE_ACCENTS = {
  crown: [
    [
      [0.33, 0.62], [0.36, 0.38], [0.43, 0.50], [0.5, 0.35],
      [0.57, 0.50], [0.64, 0.38], [0.67, 0.62],
    ],
  ],
};

// -------------------------------------------------------------- 5x7 pixel font

// Only the characters board coordinates and short piece labels need.
const FONT = {
  "0": ".###.:#...#:#..##:#.#.#:##..#:#...#:.###.",
  "1": "..#..:.##..:..#..:..#..:..#..:..#..:.###.",
  "2": ".###.:#...#:....#:...#.:..#..:.#...:#####",
  "3": "#####:...#.:..##.:....#:....#:#...#:.###.",
  "4": "...#.:..##.:.#.#.:#..#.:#####:...#.:...#.",
  "5": "#####:#....:####.:....#:....#:#...#:.###.",
  "6": "..##.:.#...:#....:####.:#...#:#...#:.###.",
  "7": "#####:....#:...#.:..#..:.#...:.#...:.#...",
  "8": ".###.:#...#:#...#:.###.:#...#:#...#:.###.",
  "9": ".###.:#...#:#...#:.####:....#:...#.:.##..",
  a: ".....:.....:.###.:....#:.####:#...#:.####",
  b: "#....:#....:####.:#...#:#...#:#...#:####.",
  c: ".....:.....:.####:#....:#....:#....:.####",
  d: "....#:....#:.####:#...#:#...#:#...#:.####",
  e: ".....:.....:.###.:#...#:#####:#....:.###.",
  f: "..##.:.#..#:.#...:####.:.#...:.#...:.#...",
  g: ".....:.###.:#...#:#...#:.####:....#:####.",
  h: "#....:#....:####.:#...#:#...#:#...#:#...#",
  i: "..#..:.....:..#..:..#..:..#..:..#..:..#..",
  j: "....#:.....:....#:....#:....#:#...#:.###.",
  k: "#....:#..#.:#.#..:##...:#.#..:#..#.:#...#",
  l: ".##..:..#..:..#..:..#..:..#..:..#..:.###.",
  m: ".....:.....:##.#.:#.#.#:#.#.#:#...#:#...#",
  n: ".....:.....:####.:#...#:#...#:#...#:#...#",
  o: ".....:.....:.###.:#...#:#...#:#...#:.###.",
  p: ".....:.....:####.:#...#:#...#:####.:#....",
  q: ".....:.....:.####:#...#:#...#:.####:....#",
  r: ".....:.....:.####:#....:#....:#....:#....",
  s: ".....:.....:.####:#....:.###.:....#:####.",
  t: ".#...:.#...:####.:.#...:.#...:.#...:..###",
  u: ".....:.....:#...#:#...#:#...#:#...#:.####",
  v: ".....:.....:#...#:#...#:#...#:.#.#.:..#..",
  w: ".....:.....:#...#:#...#:#.#.#:#.#.#:.#.#.",
  x: ".....:.....:#...#:.#.#.:..#..:.#.#.:#...#",
  y: ".....:.....:#...#:#...#:.####:....#:.###.",
  z: ".....:.....:#####:...#.:..#..:.#...:#####",
};

/**
 * Draw text as scaled-up pixel blocks. `scale` is the pixel size of one font
 * cell, so a glyph is 5*scale wide and 7*scale tall. Uppercase falls back to the
 * lowercase shape — board labels never need both.
 */
export function drawText(canvas, text, x, y, scale, color, align = "left") {
  const advance = 6 * scale; // 5 wide + 1 spacing
  const width = text.length * advance - scale;
  let cx = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  for (const raw of text) {
    const glyph = FONT[raw] ?? FONT[raw.toLowerCase()];
    if (glyph) {
      const rows = glyph.split(":");
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) {
          if (rows[r][c] === "#") {
            canvas.rect(cx + c * scale, y + r * scale, scale, scale, color);
          }
        }
      }
    }
    cx += advance;
  }
}

export function textWidth(text, scale) {
  return text.length * 6 * scale - scale;
}
