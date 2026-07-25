/**
 * Board spec -> geometry -> PNG + SVG, plus a canonical text description.
 *
 * Everything is drawn into a Scene (a display list of polygons) rather than
 * straight onto a canvas, so one pass of geometry produces both a raster PNG and
 * a vector SVG that are guaranteed to agree. The `describe()` output is the third
 * artefact and matters just as much: it is the ground truth handed to the vision
 * verifier, so the thing being checked and the thing being checked against come
 * from the same source.
 */

import { Canvas, circlePath, grow } from "./raster.mjs";
import { CHESS_PIECES, SHAPES, PIECE_ACCENTS, SHAPE_ACCENTS, drawText } from "./glyphs.mjs";

/** Records drawing ops so they can be painted to raster or serialised to SVG. */
class Scene {
  constructor() {
    this.ops = [];
  }
  fill(subpaths, color, alpha = 1) {
    this.ops.push({ subpaths, color, alpha });
  }
  rect(x, y, w, h, color, alpha = 1) {
    this.fill([[[x, y], [x + w, y], [x + w, y + h], [x, y + h]]], color, alpha);
  }
  circle(cx, cy, r, color, alpha = 1) {
    this.fill([circlePath(cx, cy, r)], color, alpha);
  }
  ring(cx, cy, rOuter, rInner, color, alpha = 1) {
    this.fill([circlePath(cx, cy, rOuter), circlePath(cx, cy, rInner)], color, alpha);
  }
}

export const THEMES = {
  classic: { light: "#f0d9b5", dark: "#b58863", frame: "#6b4f31", bg: "#ffffff", label: "#3a2c1c",
             white: "#fffdf7", black: "#2b2b2b", whiteEdge: "#2b2b2b", blackEdge: "#e8e8e8",
             highlight: "#f7ec74" },
  blue:    { light: "#dee3e6", dark: "#8ca2ad", frame: "#546b75", bg: "#ffffff", label: "#22303a",
             white: "#ffffff", black: "#2b2b2b", whiteEdge: "#2b2b2b", blackEdge: "#e8e8e8",
             highlight: "#f7ec74" },
  green:   { light: "#ffffdd", dark: "#86a666", frame: "#4f6b3c", bg: "#ffffff", label: "#25331b",
             white: "#ffffff", black: "#2b2b2b", whiteEdge: "#2b2b2b", blackEdge: "#e8e8e8",
             highlight: "#f7ec74" },
  // High-contrast, print-friendly; the safest choice when a vision model has to
  // read the position back.
  mono:    { light: "#ffffff", dark: "#c9c9c9", frame: "#333333", bg: "#ffffff", label: "#111111",
             white: "#ffffff", black: "#1a1a1a", whiteEdge: "#1a1a1a", blackEdge: "#ffffff",
             highlight: "#ffe680" },
  wood:    { light: "#e8cfa0", dark: "#9c6b3f", frame: "#4d3220", bg: "#f5efe3", label: "#3a2c1c",
             white: "#fdf6e6", black: "#33281f", whiteEdge: "#33281f", blackEdge: "#e8ddc8",
             highlight: "#f2d661" },
};

const GAME_DEFAULTS = {
  chess:          { rows: 8,  cols: 8,  checkered: true,  placement: "cell",         coords: true },
  checkers:       { rows: 8,  cols: 8,  checkered: true,  placement: "cell",         coords: true },
  draughts:       { rows: 10, cols: 10, checkered: true,  placement: "cell",         coords: true },
  go:             { rows: 19, cols: 19, checkered: false, placement: "intersection", coords: true },
  reversi:        { rows: 8,  cols: 8,  checkered: false, placement: "cell",         coords: true },
  othello:        { rows: 8,  cols: 8,  checkered: false, placement: "cell",         coords: true },
  tictactoe:      { rows: 3,  cols: 3,  checkered: false, placement: "cell",         coords: false },
  "connect-four": { rows: 6,  cols: 7,  checkered: false, placement: "cell",         coords: false },
  custom:         { rows: 8,  cols: 8,  checkered: true,  placement: "cell",         coords: true },
};

const PIECE_ALIASES = {
  k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn",
  king: "king", queen: "queen", rook: "rook", bishop: "bishop", knight: "knight", pawn: "pawn",
};

// ------------------------------------------------------------------ spec input

/** Algebraic square ("e4", "t19") -> zero-based {col, row} with row 0 at bottom. */
export function parseSquare(at, cols, rows) {
  const m = /^([a-z])\s*(\d{1,2})$/i.exec(String(at).trim());
  if (!m) throw new Error(`Cannot parse square "${at}" (expected like "e4")`);
  const col = m[1].toLowerCase().charCodeAt(0) - 97;
  const row = parseInt(m[2], 10) - 1;
  if (col < 0 || col >= cols) throw new Error(`Square "${at}" is off the board (${cols} files)`);
  if (row < 0 || row >= rows) throw new Error(`Square "${at}" is off the board (${rows} ranks)`);
  return { col, row };
}

export function squareName(col, row) {
  return String.fromCharCode(97 + col) + (row + 1);
}

/** Parse the board field of a FEN string into a piece list. */
export function parseFEN(fen) {
  const board = String(fen).trim().split(/\s+/)[0];
  const ranks = board.split("/");
  if (ranks.length !== 8) {
    throw new Error(`FEN must have 8 ranks separated by "/", got ${ranks.length}`);
  }
  const pieces = [];
  ranks.forEach((rank, i) => {
    const row = 7 - i; // FEN starts at rank 8
    let col = 0;
    for (const ch of rank) {
      if (/\d/.test(ch)) {
        col += Number(ch);
        continue;
      }
      const piece = PIECE_ALIASES[ch.toLowerCase()];
      if (!piece) throw new Error(`Unknown FEN piece "${ch}"`);
      if (col > 7) throw new Error(`FEN rank "${rank}" overflows 8 files`);
      pieces.push({ at: squareName(col, row), piece, color: ch === ch.toUpperCase() ? "white" : "black" });
      col++;
    }
    if (col !== 8) throw new Error(`FEN rank "${rank}" describes ${col} files, expected 8`);
  });
  return pieces;
}

/** Fill in defaults and validate. Accepts either `fen` or an explicit piece list. */
export function normalizeSpec(input) {
  const game = (input.game || (input.fen ? "chess" : "custom")).toLowerCase();
  const defaults = GAME_DEFAULTS[game] || GAME_DEFAULTS.custom;
  const spec = {
    game,
    rows: input.rows ?? defaults.rows,
    cols: input.cols ?? defaults.cols,
    checkered: input.checkered ?? defaults.checkered,
    placement: input.placement ?? defaults.placement,
    coords: input.coords ?? defaults.coords,
    orientation: input.orientation ?? "white",
    theme: typeof input.theme === "string" ? (THEMES[input.theme] || THEMES.classic) : (input.theme || THEMES.classic),
    themeName: typeof input.theme === "string" ? input.theme : "classic",
    squareSize: input.squareSize ?? null,
    highlights: input.highlights ?? [],
    title: input.title ?? null,
    pieces: [],
  };
  const raw = input.fen ? parseFEN(input.fen) : (input.pieces ?? []);
  for (const p of raw) {
    const { col, row } = parseSquare(p.at, spec.cols, spec.rows);
    const piece = p.piece ? PIECE_ALIASES[String(p.piece).toLowerCase()] : null;
    const shape = p.shape ? String(p.shape).toLowerCase() : null;
    if (!piece && !shape) {
      throw new Error(`Piece at ${p.at} needs either "piece" (chess) or "shape" (disc/ring/cross/...)`);
    }
    if (shape && !SHAPES[shape]) {
      throw new Error(`Unknown shape "${shape}". Available: ${Object.keys(SHAPES).join(", ")}`);
    }
    spec.pieces.push({ at: squareName(col, row), col, row, piece, shape, color: p.color ?? "white", label: p.label ?? null });
  }
  const seen = new Set();
  for (const p of spec.pieces) {
    if (seen.has(p.at)) throw new Error(`Two pieces both placed on ${p.at}`);
    seen.add(p.at);
  }
  return spec;
}

// -------------------------------------------------------------------- describe

/**
 * Canonical english description of a spec. This is what the verifier compares
 * the image against, so it lists every occupied square explicitly and states the
 * board geometry — a vision model cannot be asked "is this right?" without being
 * told precisely what right means.
 */
export function describeSpec(spec) {
  const lines = [];
  const geom = spec.placement === "intersection"
    ? `a ${spec.cols}x${spec.rows} grid of lines, with stones placed on the line intersections`
    : `${spec.cols}x${spec.rows} squares${spec.checkered ? ", alternating light and dark (checkered)" : ", all the same colour (not checkered)"}`;
  lines.push(`Board: ${spec.game}, ${geom}.`);
  lines.push(
    `Orientation: file "a" is the leftmost column and rank 1 is the ${spec.orientation === "black" ? "top" : "bottom"} row` +
      `${spec.orientation === "black" ? " (board viewed from Black's side)" : ""}.`,
  );
  if (spec.game === "chess" && spec.checkered) {
    // Stated explicitly because it is a real correctness property of a chess
    // board that image models get wrong about half the time, and the verifier can
    // only check what the description claims.
    lines.push('Square colours: square a1 is a dark square and square h1 is a light square.');
  }
  if (!spec.pieces.length) {
    lines.push("Pieces: the board is completely empty.");
    return lines.join("\n");
  }
  const groups = new Map();
  for (const p of spec.pieces) {
    const kind = p.piece || p.shape;
    const key = `${p.color} ${kind}${p.label ? ` labelled "${p.label}"` : ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p.at);
  }
  lines.push(`Pieces (${spec.pieces.length} total, and nothing on any other square):`);
  for (const [key, squares] of groups) {
    const sorted = squares.sort();
    lines.push(`  - ${key}: ${sorted.join(", ")}`);
  }
  if (spec.highlights.length) lines.push(`Highlighted squares: ${spec.highlights.join(", ")}.`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------- render

/** Build the scene. Returns {scene, width, height}. */
function buildScene(spec) {
  const t = spec.theme;
  const cell = spec.squareSize ?? Math.max(48, Math.round(880 / Math.max(spec.cols, spec.rows)));
  const labelScale = Math.max(2, Math.round(cell / 22));
  const gutter = spec.coords ? Math.round(labelScale * 7 + cell * 0.16) : Math.round(cell * 0.10);
  const frame = Math.max(4, Math.round(cell * 0.07));
  const titleH = spec.title ? Math.round(labelScale * 9) : 0;

  const boardW = spec.cols * cell;
  const boardH = spec.rows * cell;
  const x0 = gutter + frame;
  const y0 = gutter + frame + titleH;
  const width = boardW + 2 * (gutter + frame);
  const height = boardH + 2 * (gutter + frame) + titleH;

  const s = new Scene();
  s.rect(0, 0, width, height, t.bg);
  // Frame drawn as a band around the playing surface.
  s.rect(gutter, gutter + titleH, boardW + 2 * frame, boardH + 2 * frame, t.frame);

  // Map a logical (col,row) to pixel top-left, honouring orientation.
  const cellXY = (col, row) => {
    const c = spec.orientation === "black" ? spec.cols - 1 - col : col;
    const r = spec.orientation === "black" ? row : spec.rows - 1 - row;
    return [x0 + c * cell, y0 + r * cell];
  };

  if (spec.placement === "intersection") {
    // Go-style: a flat playing surface with a grid of lines, stones on crossings.
    s.rect(x0, y0, boardW, boardH, t.light);
    const lw = Math.max(1, Math.round(cell * 0.045));
    const half = cell / 2;
    for (let c = 0; c < spec.cols; c++) {
      const [cx] = cellXY(c, 0);
      s.rect(cx + half - lw / 2, y0 + half, lw, boardH - cell, t.label);
    }
    for (let r = 0; r < spec.rows; r++) {
      const [, cy] = cellXY(0, r);
      s.rect(x0 + half, cy + half - lw / 2, boardW - cell, lw, t.label);
    }
    // Star points (handicap dots) on a standard 19x19/13x13/9x9 board.
    if (spec.cols === spec.rows && [9, 13, 19].includes(spec.cols)) {
      const edge = spec.cols === 9 ? 2 : 3;
      const mid = (spec.cols - 1) / 2;
      const stars = spec.cols === 9 ? [edge, mid, spec.cols - 1 - edge] : [edge, mid, spec.cols - 1 - edge];
      for (const c of stars) {
        for (const r of stars) {
          const [px, py] = cellXY(c, r);
          s.circle(px + half, py + half, Math.max(2, cell * 0.09), t.label);
        }
      }
    }
  } else {
    for (let r = 0; r < spec.rows; r++) {
      for (let c = 0; c < spec.cols; c++) {
        const [px, py] = cellXY(c, r);
        // (col+row) even => dark, which puts a light square on the bottom-right
        // (h1) as chess convention requires.
        const isDark = spec.checkered && (c + r) % 2 === 0;
        s.rect(px, py, cell, cell, isDark ? t.dark : t.light);
      }
    }
    if (!spec.checkered) {
      // Draw grid lines so cells are still countable on a uniform board.
      const lw = Math.max(1, Math.round(cell * 0.03));
      for (let c = 1; c < spec.cols; c++) s.rect(x0 + c * cell - lw / 2, y0, lw, boardH, t.frame);
      for (let r = 1; r < spec.rows; r++) s.rect(x0, y0 + r * cell - lw / 2, boardW, lw, t.frame);
    }
  }

  for (const at of spec.highlights) {
    const { col, row } = parseSquare(at, spec.cols, spec.rows);
    const [px, py] = cellXY(col, row);
    s.rect(px, py, cell, cell, t.highlight, 0.55);
  }

  if (spec.coords) {
    const filePad = Math.round(cell * 0.06);
    for (let c = 0; c < spec.cols; c++) {
      const [px] = cellXY(c, 0);
      const label = String.fromCharCode(97 + c);
      drawText(s, label, px + cell / 2, y0 + boardH + frame + filePad, labelScale, t.label, "center");
      drawText(s, label, px + cell / 2, gutter + titleH - labelScale * 7 - filePad, labelScale, t.label, "center");
    }
    for (let r = 0; r < spec.rows; r++) {
      const [, py] = cellXY(0, r);
      const label = String(r + 1);
      drawText(s, label, gutter - filePad, py + cell / 2 - labelScale * 3.5, labelScale, t.label, "right");
      drawText(s, label, x0 + boardW + frame + filePad, py + cell / 2 - labelScale * 3.5, labelScale, t.label, "left");
    }
  }

  if (spec.title) {
    drawText(s, spec.title.toLowerCase(), width / 2, Math.round(labelScale * 1.5), labelScale, t.label, "center");
  }

  for (const p of spec.pieces) {
    const [px, py] = cellXY(p.col, p.row);
    // Intersection stones straddle four cells, so shift by half a cell.
    const ox = spec.placement === "intersection" ? px + cell / 2 : px;
    const oy = spec.placement === "intersection" ? py + cell / 2 : py;
    drawPiece(s, p, ox - (spec.placement === "intersection" ? cell / 2 : 0), oy - (spec.placement === "intersection" ? cell / 2 : 0), cell, spec, t);
  }

  return { scene: s, width, height, cell };
}

function drawPiece(scene, p, x, y, cell, spec, t) {
  const isWhite = String(p.color).toLowerCase() !== "black";
  const fillColor = isWhite ? t.white : t.black;
  const edgeColor = isWhite ? t.whiteEdge : t.blackEdge;
  const inset = p.piece ? cell * 0.04 : cell * 0.02;
  const size = cell - inset * 2;
  const subpaths = (p.piece ? CHESS_PIECES[p.piece] : SHAPES[p.shape])();
  const toPx = (path) => path.map(([ux, uy]) => [x + inset + ux * size, y + inset + uy * size]);

  const outlineW = Math.max(1.5, cell * 0.022);
  // Outline first (grown outward), then fill on top.
  scene.fill(subpaths.map((path) => grow(toPx(path), outlineW)), edgeColor);
  scene.fill(subpaths.map(toPx), fillColor);

  const accents = p.piece ? PIECE_ACCENTS[p.piece] : SHAPE_ACCENTS[p.shape];
  if (accents) scene.fill(accents.map(toPx), edgeColor);

  if (p.label) {
    const scale = Math.max(2, Math.round(cell / 16));
    drawText(scene, String(p.label).toLowerCase(), x + cell / 2, y + cell / 2 - scale * 3.5, scale, edgeColor, "center");
  }
}

function paint(scene, width, height) {
  const canvas = new Canvas(width, height);
  for (const op of scene.ops) {
    canvas.fill(op.subpaths, hexToRgb(op.color), op.alpha);
  }
  return canvas.toPNG();
}

function toSVG(scene, width, height) {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
  ];
  for (const op of scene.ops) {
    const d = op.subpaths
      .map((path) => `M ${path.map(([x, y]) => `${round(x)},${round(y)}`).join(" L ")} Z`)
      .join(" ");
    const alpha = op.alpha !== 1 ? ` fill-opacity="${op.alpha}"` : "";
    parts.push(`<path d="${d}" fill="${op.color}" fill-rule="evenodd"${alpha}/>`);
  }
  parts.push("</svg>");
  return parts.join("\n");
}

const round = (n) => Math.round(n * 100) / 100;

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

/** Render a normalized spec to PNG bytes, SVG text and a description. */
export function renderBoard(input) {
  const spec = normalizeSpec(input);
  const { scene, width, height } = buildScene(spec);
  return {
    spec,
    width,
    height,
    png: paint(scene, width, height),
    svg: toSVG(scene, width, height),
    description: describeSpec(spec),
  };
}
