#!/usr/bin/env node
/**
 * Offline regression tests for the deterministic half of the skill.
 *
 * Nothing here touches the network, so it is safe in CI and fast. The parts that
 * call the gateway are exercised by hand — what matters to protect automatically
 * is the renderer, because it is the component whose whole promise is that it
 * cannot be wrong.
 *
 * Run: node tests/run-tests.mjs
 */

import { renderBoard, normalizeSpec, describeSpec, parseFEN, parseSquare } from "../scripts/lib/board.mjs";
import { parseVerdict } from "../scripts/lib/verify.mjs";
import { decodePNG, shrinkForUpload, isPNG } from "../scripts/lib/png.mjs";
import { encodePNG } from "../scripts/lib/raster.mjs";

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failures.push(`${name}: ${err.message}`);
  }
}

function eq(actual, expected, what = "value") {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${what} was ${a}, expected ${e}`);
}

function ok(cond, msg) {
  if (!cond) throw new Error(msg);
}

function throws(fn, re, what) {
  let raised = null;
  try {
    fn();
  } catch (e) {
    raised = e;
  }
  if (!raised) throw new Error(`${what}: expected an error, got none`);
  if (re && !re.test(raised.message)) throw new Error(`${what}: message ${JSON.stringify(raised.message)} did not match ${re}`);
}

// --------------------------------------------------------------- PNG inspection

/** Decode via the library and expose a luminance probe for pixel assertions. */
function inspect(buf) {
  const img = decodePNG(buf);
  ok(img, "render output could not be decoded as a PNG");
  return {
    w: img.width,
    h: img.height,
    lum: (x, y) => {
      const o = (y * img.width + x) * 3;
      return Math.round(0.2126 * img.rgb[o] + 0.7152 * img.rgb[o + 1] + 0.0722 * img.rgb[o + 2]);
    },
  };
}

/**
 * A PNG that resists compression, so it is genuinely large. Uses xorshift32 with
 * exact 32-bit ops — a plain LCG loses precision past 2^53 in JS and degenerates
 * into a short repeating pattern that deflate crushes to nothing.
 */
function noisyPNG(size) {
  const rgb = new Uint8Array(size * size * 3);
  let s = 0x9e3779b9 | 0;
  for (let i = 0; i < rgb.length; i++) {
    s ^= s << 13;
    s |= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s |= 0;
    rgb[i] = (s >>> 8) & 0xff;
  }
  return encodePNG(size, size, rgb);
}

// -------------------------------------------------------------------- FEN input

check("FEN: start position yields 32 pieces", () => {
  const pieces = parseFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
  eq(pieces.length, 32, "piece count");
});

check("FEN: rank 8 maps to the top, rank 1 to the bottom", () => {
  const pieces = parseFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
  const a8 = pieces.find((p) => p.at === "a8");
  const a1 = pieces.find((p) => p.at === "a1");
  eq([a8.piece, a8.color], ["rook", "black"], "a8");
  eq([a1.piece, a1.color], ["rook", "white"], "a1");
});

check("FEN: digits skip files correctly", () => {
  const pieces = parseFEN("8/8/8/4k3/8/8/4K3/7R");
  eq(pieces.map((p) => p.at).sort(), ["e2", "e5", "h1"], "squares");
  eq(pieces.find((p) => p.at === "h1").piece, "rook", "h1 piece");
});

check("FEN: a rank that does not add to 8 is rejected", () => {
  throws(() => parseFEN("rnbqkbnr/ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"), /7 files|expected 8/, "short rank");
});

check("FEN: wrong number of ranks is rejected", () => {
  throws(() => parseFEN("8/8/8"), /8 ranks/, "short FEN");
});

check("FEN: unknown piece letter is rejected", () => {
  throws(() => parseFEN("xnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"), /Unknown FEN piece/, "bad letter");
});

// -------------------------------------------------------------- square handling

check("squares: algebraic parsing is zero-based with rank 1 at the bottom", () => {
  eq(parseSquare("a1", 8, 8), { col: 0, row: 0 }, "a1");
  eq(parseSquare("h8", 8, 8), { col: 7, row: 7 }, "h8");
  eq(parseSquare("e4", 8, 8), { col: 4, row: 3 }, "e4");
});

check("squares: two-digit ranks work for large boards", () => {
  eq(parseSquare("s19", 19, 19), { col: 18, row: 18 }, "s19");
});

check("squares: off-board references are rejected", () => {
  throws(() => parseSquare("i1", 8, 8), /off the board/, "file past h");
  throws(() => parseSquare("a9", 8, 8), /off the board/, "rank past 8");
  throws(() => parseSquare("zz", 8, 8), /Cannot parse/, "nonsense");
});

check("spec: two pieces on one square is rejected", () => {
  throws(
    () => normalizeSpec({ game: "chess", pieces: [{ at: "e4", piece: "king" }, { at: "e4", piece: "pawn" }] }),
    /Two pieces/,
    "duplicate square",
  );
});

check("spec: a piece needs either a chess piece or a shape", () => {
  throws(() => normalizeSpec({ game: "custom", pieces: [{ at: "a1", color: "white" }] }), /needs either/, "no kind");
});

check("spec: unknown shape is rejected", () => {
  throws(() => normalizeSpec({ game: "checkers", pieces: [{ at: "a1", shape: "blob" }] }), /Unknown shape/, "bad shape");
});

check("spec: game defaults are applied", () => {
  const go = normalizeSpec({ game: "go", pieces: [] });
  eq([go.rows, go.cols, go.placement], [19, 19, "intersection"], "go defaults");
  const d = normalizeSpec({ game: "draughts", pieces: [] });
  eq([d.rows, d.cols], [10, 10], "draughts defaults");
});

// ------------------------------------------------------------------- describing

check("describe: every occupied square is listed", () => {
  const spec = normalizeSpec({ fen: "8/8/8/4k3/8/8/4K3/7R" });
  const text = describeSpec(spec);
  for (const sq of ["e5", "e2", "h1"]) ok(text.includes(sq), `description omits ${sq}`);
  ok(/3 total/.test(text), "description does not state the total");
});

check("describe: chess states the square-colour convention so it can be checked", () => {
  const text = describeSpec(normalizeSpec({ fen: "8/8/8/8/8/8/8/8" }));
  ok(/a1 is a dark square/.test(text) && /h1 is a light square/.test(text), "colour convention missing");
});

check("describe: an empty board says so rather than listing nothing", () => {
  ok(/completely empty/.test(describeSpec(normalizeSpec({ fen: "8/8/8/8/8/8/8/8" }))), "empty board not stated");
});

// ---------------------------------------------------------------------- render

check("render: produces a valid PNG and a matching SVG", () => {
  const r = renderBoard({ fen: "8/8/8/4k3/8/8/4K3/7R" });
  const img = inspect(r.png);
  eq([img.w, img.h], [r.width, r.height], "PNG dimensions");
  ok(r.svg.startsWith("<svg"), "SVG does not start with <svg");
  ok(r.svg.includes(`width="${r.width}"`), "SVG width does not match PNG");
  ok(r.svg.includes("evenodd"), "SVG must use even-odd fill to match the rasterizer");
});

check("render: a1 is dark and h1 is light, as on a real chess board", () => {
  // Measured off the rendered pixels rather than trusted, because this is the
  // property the renderer exists to get right and it is invisible in code review.
  const r = renderBoard({ fen: "8/8/8/8/8/8/8/8", theme: "classic", squareSize: 64 });
  const img = inspect(r.png);
  const cell = 64;
  // Locate the board's top-left by finding the first row/col of light-or-dark
  // squares inside the frame: geometry is deterministic, so derive it instead.
  const x0 = (r.width - cell * 8) / 2;
  const y0 = (r.height - cell * 8) / 2;
  const at = (file, rank) => img.lum(Math.round(x0 + file * cell + cell / 2), Math.round(y0 + (8 - 1 - rank) * cell + cell / 2));
  const a1 = at(0, 0);
  const h1 = at(7, 0);
  const a8 = at(0, 7);
  ok(a1 < h1, `a1 (${a1}) should be darker than h1 (${h1})`);
  ok(a8 > a1, `a8 (${a8}) should be lighter than a1 (${a1})`);
});

check("render: the board alternates on every square", () => {
  const r = renderBoard({ fen: "8/8/8/8/8/8/8/8", theme: "mono", squareSize: 64 });
  const img = inspect(r.png);
  const cell = 64;
  const x0 = (r.width - cell * 8) / 2;
  const y0 = (r.height - cell * 8) / 2;
  const dark = [];
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const l = img.lum(Math.round(x0 + file * cell + cell / 2), Math.round(y0 + (7 - rank) * cell + cell / 2));
      const expectedDark = (file + rank) % 2 === 0;
      if (expectedDark !== l < 240) dark.push(`${String.fromCharCode(97 + file)}${rank + 1}(lum=${l})`);
    }
  }
  eq(dark, [], "squares with unexpected shade");
});

check("render: flipping changes the image but not the position", () => {
  const a = renderBoard({ fen: "8/8/8/4k3/8/8/4K3/7R" });
  const b = renderBoard({ fen: "8/8/8/4k3/8/8/4K3/7R", orientation: "black" });
  ok(!a.png.equals(b.png), "flipped board rendered identical pixels");
  eq(
    a.spec.pieces.map((p) => p.at).sort(),
    b.spec.pieces.map((p) => p.at).sort(),
    "flipping must not move pieces",
  );
  ok(/rank 1 is the top row/.test(b.description), "flipped description does not say rank 1 is on top");
});

check("render: an empty and an occupied board differ", () => {
  const empty = renderBoard({ fen: "8/8/8/8/8/8/8/8" });
  const one = renderBoard({ fen: "8/8/8/8/8/8/8/7R" });
  ok(!empty.png.equals(one.png), "adding a rook changed nothing");
});

check("render: go boards place stones on intersections", () => {
  const r = renderBoard({ game: "go", pieces: [{ at: "d4", shape: "disc", color: "black" }] });
  ok(/intersections/.test(r.description), "go description does not mention intersections");
  ok(r.png.length > 1000, "go render suspiciously small");
});

check("render: non-chess shapes and labels render", () => {
  const r = renderBoard({
    game: "tictactoe",
    pieces: [
      { at: "a3", shape: "cross", color: "black" },
      { at: "b2", shape: "ring", color: "white", label: "o" },
    ],
  });
  ok(r.png.length > 1000, "tictactoe render suspiciously small");
  ok(/cross/.test(r.description) && /ring/.test(r.description), "shapes missing from description");
});

check("render: is deterministic", () => {
  const a = renderBoard({ fen: "r1bqkb1r/ppp2ppp/2n2n2/4p3/4P3/2NP1N2/PP3PPP/R1BQKB1R" });
  const b = renderBoard({ fen: "r1bqkb1r/ppp2ppp/2n2n2/4p3/4P3/2NP1N2/PP3PPP/R1BQKB1R" });
  ok(a.png.equals(b.png), "two renders of the same position differ");
});

// ---------------------------------------------------------------- verdict parsing

check("verdict: a clean fenced JSON pass is recognised", () => {
  const v = parseVerdict('```json\n{"grid_ok":true,"square_colors_ok":true,"errors":[],"extra_or_missing":[],"accurate":true}\n```');
  ok(v.accurate, "clean pass was not accurate");
});

check("verdict: listed errors override an accurate flag", () => {
  const v = parseVerdict('```json\n{"grid_ok":true,"errors":["d1 has a king"],"accurate":true}\n```');
  ok(!v.accurate, "errors did not override accurate:true");
  eq(v.errors.length, 1, "error count");
});

check("verdict: a false square-colour flag becomes a visible error", () => {
  const v = parseVerdict('```json\n{"grid_ok":true,"square_colors_ok":false,"corner_squares":"a1 light","errors":[],"accurate":true}\n```');
  ok(!v.accurate, "inverted colours reported as accurate");
  ok(/square colours/.test(v.errors[0]), `unexpected error text: ${v.errors[0]}`);
});

check("verdict: a false grid flag becomes a visible error", () => {
  const v = parseVerdict('```json\n{"grid_ok":false,"grid_seen":"7x9","errors":[],"accurate":true}\n```');
  ok(!v.accurate, "bad grid reported as accurate");
  ok(/grid is wrong/.test(v.errors.join(" ")), "grid error not reported");
});

check("verdict: unparseable output fails closed", () => {
  const v = parseVerdict("I had a look and it seems fine to me!");
  ok(!v.accurate, "prose reply was treated as a pass");
  ok(v.errors.length > 0, "no error recorded for unparseable verdict");
});

check('verdict: filler like "none" is not counted as an error', () => {
  const v = parseVerdict('```json\n{"grid_ok":true,"square_colors_ok":true,"errors":["none"],"accurate":true}\n```');
  ok(v.accurate, "filler error text blocked a pass");
});

check("verdict: bare JSON without a fence still parses", () => {
  const v = parseVerdict('Sure: {"grid_ok":true,"square_colors_ok":true,"errors":[],"accurate":true}');
  ok(v.accurate, "unfenced JSON was not parsed");
});


// ------------------------------------------------------------------ png helpers

check("png: our own render round-trips through the decoder", () => {
  const r = renderBoard({ fen: "8/8/8/4k3/8/8/4K3/7R", squareSize: 40 });
  const img = decodePNG(r.png);
  ok(img, "could not decode our own PNG");
  eq([img.width, img.height], [r.width, r.height], "decoded dimensions");
  eq(img.rgb.length, r.width * r.height * 3, "rgb buffer size");
});

check("png: isPNG rejects non-PNG input", () => {
  ok(!isPNG(Buffer.from("not an image at all")), "garbage accepted as PNG");
  ok(decodePNG(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5])) === null, "JPEG header decoded as PNG");
});

check("png: a small render is left untouched by shrinkForUpload", () => {
  const r = renderBoard({ fen: "8/8/8/8/8/8/8/7R", squareSize: 40 });
  ok(shrinkForUpload(r.png) === r.png, "small PNG was needlessly re-encoded");
});

check("png: a large PNG is downscaled below the upload ceiling", () => {
  const big = noisyPNG(1024);
  ok(big.length > 600_000, `test fixture not large enough (${big.length} bytes)`);
  const small = shrinkForUpload(big, { maxDim: 512, maxBytes: 600_000 });
  ok(small.length < big.length, "shrink did not reduce size");
  const img = decodePNG(small);
  ok(img && Math.max(img.width, img.height) <= 512, `downscaled to ${img?.width}x${img?.height}, expected <=512`);
});

check("png: downscaling preserves large-scale structure", () => {
  // A downscaled board must keep its light/dark blocks, or a vision check on the
  // shrunk upload would be reading a different board than the one produced.
  const r = renderBoard({ fen: "8/8/8/8/8/8/8/8", theme: "mono", squareSize: 96 });
  const small = shrinkForUpload(r.png, { maxDim: 256, maxBytes: 1 });
  const img = inspect(small);
  ok(img.w < r.width, `expected a downscale, got ${img.w} from ${r.width}`);
  const cell = (96 * img.w) / r.width; // squares shrink by the same ratio as the image
  const x0 = (img.w - cell * 8) / 2;
  const y0 = (img.h - cell * 8) / 2;
  const at = (file, rank) => img.lum(Math.round(x0 + file * cell + cell / 2), Math.round(y0 + (7 - rank) * cell + cell / 2));
  const a1 = at(0, 0);
  const b1 = at(1, 0);
  ok(Math.abs(a1 - b1) > 20, `adjacent squares blurred together after downscale (${a1} vs ${b1})`);
  ok(a1 < b1, `downscale inverted the parity: a1 (${a1}) should stay darker than b1 (${b1})`);
});

// -------------------------------------------------------------------- reporting


console.log(`${passed} passed, ${failures.length} failed`);
for (const f of failures) console.error(`  FAIL ${f}`);
process.exit(failures.length ? 1 : 0);
