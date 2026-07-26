#!/usr/bin/env node
/**
 * gen-cabins.mjs — bake the game's real puzzle boards into the approved cabin
 * concept frames, changing nothing else.
 *
 * What this does
 * --------------
 * The two cabin compositions are already approved and exist as concept stills.
 * This script does NOT generate rooms. It takes a still as a base and edits only
 * the individual prop regions, leaving every other pixel byte-for-byte
 * identical:
 *
 *   shots/concept/concept-logic.png -> public/art/cabin-backdrop-logic-games.png
 *   shots/concept/concept-math.png  -> public/art/cabin-backdrop-math.png
 *
 * Two kinds of edit, because the two kinds of prop need opposite treatment.
 *
 * BOARD — a flat puzzle surface that already exists in the plate, inside a
 * frame, at the right size and in the right perspective. The plate's own
 * version of the puzzle is wrong (the Pipes board in concept-logic.png is a set
 * of disconnected, off-grid, differently coloured segments with no source or
 * sink; the Nonogram carries invented numerals down two edges), because
 * diffusion models cannot draw combinatorial structures. So the puzzle is not
 * asked for — it is SUPPLIED, as a reference PNG rendered by the app's own
 * renderer, and fitted onto the frame's inner quad with a homography. A board
 * hanging flat on a wall is exactly a planar rectangle, so that is the correct
 * and exact transform. The result is then style-matched into the plate. Nothing
 * about the board is left to a model, so it cannot drift, and the fit can be
 * verified by inverse-warping the result back and comparing it to the source
 * (`node scripts/art-inspect.mjs verify`).
 *
 * MECH — a dimensional mechanism with no flat canonical face (gear train, pan
 * balance, vial rack). These have to be generated, so they are re-rendered in
 * place and only the pixels that actually changed are kept.
 *
 * What this gateway actually does, as measured (not as documented)
 * ---------------------------------------------------------------
 * 1. The Stability inpaint / search-replace / erase-object models are listed by
 *    GET /v1/models but return HTTP 403 on use ("not authorized to perform the
 *    required AWS Marketplace actions"), and stable-image-ultra reports an
 *    invalid model identifier. There is no server-side inpainting available.
 *
 * 2. /images/edits IGNORES the `mask` part. Tested three ways on a fixed base —
 *    an RGB white-on-black mask, an RGBA mask with the editable area punched to
 *    alpha 0, and the base image itself with a transparent hole — a frame asked
 *    for at x1180,y150 landed over the mantel in all three cases, and 13-21% of
 *    pixels changed outside the requested region. /images/edits behaves as
 *    prompt-guided image-to-image over the whole frame, and it accepts no second
 *    image, so "inpaint this region using this reference" is not expressible.
 *    That is why BOARD props are composited here rather than prompted for.
 *
 * 3. Placement in a MECH pass is steerable by spatial language ("on the stone
 *    chimney breast above the mantel"), and each pass can refer to what is
 *    already in the image, because passes run sequentially.
 *
 * 4. gpt-image-2 preserves the input best of the three edit-capable models
 *    (mean |diff| 27/765 versus 74 for gpt-image-1.5) and returns the requested
 *    1536x1024. gemini-3-pro-image-preview silently returns 1264x843.
 *
 * Regional editing is therefore done on this side. For a MECH pass the whole
 * frame comes back re-rendered and slightly re-exposed, and the script recovers
 * just the prop:
 *
 *   - tone: fit a per-channel linear map (gain + offset) from the edit's pixels
 *     OUTSIDE the prop's zone back onto the base's, then apply it to the whole
 *     edit. The drift is close to global, so this also recovers the base's
 *     colour balance inside the zone.
 *   - extent: diff the tone-matched edit against the base inside the zone, blur,
 *     threshold, and take the bounding box of what changed. Only that box,
 *     feathered inward, is composited. Everything the model changed elsewhere is
 *     discarded, so the composition, depth, fireplace, furniture, rug and cat
 *     cannot drift.
 *
 * Usage
 * -----
 *   node scripts/gen-cabins.mjs                          # cabin-logic-games
 *   node scripts/gen-cabins.mjs cabin-logic-games cabin-math
 *   node scripts/gen-cabins.mjs cabin-logic-games --only pipes
 *   node scripts/gen-cabins.mjs cabin-logic-games --attempt a1   # to WIP dir
 *   node scripts/gen-cabins.mjs --list
 *
 * `--only` re-does named props; a selected MECH zone is first reset to the base
 * so the re-roll is not conditioned on the attempt it replaces. BOARD props are
 * deterministic and need no model call, so re-running is free and idempotent.
 *
 * Inputs that are NOT in git: the concept stills in shots/concept/ and the
 * rendered puzzle references in REF_DIR (see below). A fresh checkout has the
 * finished PNGs in public/art/ but cannot re-derive them without those.
 *
 * Auth: the gateway key is read out of process.env.ANTHROPIC_CUSTOM_HEADERS
 * ("x-tfy-api-key: tfy_..."). It is never logged, printed or written to disk.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(__dirname, "..");
const ART_DIR = join(APP_DIR, "public", "art");
const WIP_DIR = join(APP_DIR, "shots", "art-wip");
const CONCEPT_DIR = join(APP_DIR, "shots", "concept");

/** Rendered puzzle references, produced outside this repo by the app's renderers. */
const REF_DIR =
  process.env.GEN_CABINS_REFS || "/Users/felipecaicedo/.claude/jobs/9cd2c6ac/tmp/refboards";

const BASE_URL = "https://tfy.promptlens.trilogy.com/api/llm";
const EDIT_URL = `${BASE_URL}/images/edits`;

const MODEL = "gpt-image-2";
const W = 1536;
const H = 1024;
const SIZE = `${W}x${H}`;

// ---------------------------------------------------------------------------
// Shared prompt fragments (MECH passes only)
// ---------------------------------------------------------------------------

const NO_TEXT =
  "Absolutely no text, no letters, no words, no writing, no numbers, no numerals, " +
  "no digits, no tick marks, no labels, no captions, no signs and no watermark " +
  "anywhere in the image.";

const KEEP =
  "This is an existing photograph of a cozy log cabin room and it must stay that " +
  "room: keep the composition, the camera, the depth and the lighting exactly as " +
  "they are, and do not move, redraw, restyle or remove the stone fireplace, the " +
  "fire, the mantel, the sleeping cat, the bookshelf, the window, the armchair, " +
  "the tables, the rug, the ceiling beams, the floorboards or the walls.";

const STYLE =
  "Photoreal 3D render of a real physical object, physically based materials, " +
  "real brass and real wood, lit by the warm orange firelight of this room and " +
  "matching the existing cabin exactly in style, lighting, colour temperature and " +
  "perspective. Not a painting, not an illustration, not a cartoon, not a flat " +
  "graphic. The object is complete and entirely visible and is not cropped.";

/**
 * Shared tail for every stylize prompt. The reference is a SPEC — deliberately
 * flat, maximum contrast, no anti-aliasing — so it must be repainted before it
 * goes anywhere near the plate. Warping a spec into a painterly photoreal room
 * can only ever look like a screenshot taped inside a picture frame, which is
 * exactly how the first bake was (rightly) rejected.
 */
const HOLD_LAYOUT =
  "This input image is a reference diagram, not artwork. Repaint it completely in " +
  "the style described, but treat its LAYOUT as fixed and inviolable: exactly the " +
  "same number of rows and columns, and every mark stays in exactly the cell it " +
  "occupies here. Do not add, remove, move, reorder or resize any cell, square, " +
  "stroke, pipe, mirror, disc or ring. The pattern is the one thing that must " +
  "survive unchanged.";

const CABIN_LIGHT =
  "Lit by warm orange firelight from the right and a little cool dusk light from a " +
  "window, so the right side is warmer and brighter and the left falls away into " +
  "soft shadow. Gentle vignette, soft photographic focus, fine film grain, shallow " +
  "depth. Photoreal and painterly, like a well-loved object in a cabin — NOT a " +
  "diagram, NOT a screenshot, NOT flat UI, NOT a vector graphic.";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
//
// BOARD `quad` is the four inner corners of the frame ALREADY PAINTED in the
// concept still — the opening the puzzle is fitted into — in TL, TR, BR, BL
// order. These same corners are the app's hit-quad.
//
// Established by reading them off `art-inspect.mjs grid`, refining with
// `art-inspect.mjs snapquad` (which finds the opening's luminance edge rather
// than trusting the eye), and then confirming each one against a magnified
// overlay. Worth the trouble: ten pixels of error leaves a bright sliver of the
// OLD board showing along an edge, which is exactly what the first pass did.
//
// MECH `zone` bounds both the change detection and the composite.

/** @type {Record<string, {file: string, base: string, props: Record<string, object>, order: string[]}>} */
const ROOMS = {
  "cabin-logic-games": {
    file: "cabin-backdrop-logic-games.png",
    base: "concept-logic.png",
    props: {
      // Big framed board on the left wall, seen at a slight raking angle.
      nonogram: {
        cls: "board",
        ref: "nonogram.png",
        // The face inside the tray the model painted around it, measured off
        // shots/art-wip/styled-cabin-logic-games-nonogram.png. Re-measure after
        // a --restyle: each repaint frames the board differently.
        face: { x: 182, y: 104, w: 748, h: 738 },
        stylePrompt:
          "Repaint this as a real hand-made wooden NONOGRAM puzzle board hanging in a " +
          "cosy log cabin. The board is a pale cream painted panel with visible paper " +
          "and wood grain and a slightly uneven hand-painted surface, set into a " +
          "shallow wooden tray so the panel sits recessed with real thickness and the " +
          "tray's inner edge casts a soft shadow across the panel. The grid lines are " +
          "hand-inked in dark brown, slightly uneven in weight and not perfectly " +
          "straight — ruled by hand, not printed. Filled squares are hand-painted " +
          "dark walnut tiles with soft slightly irregular edges and a faint sheen, " +
          "never flat black rounded rectangles. Along the top and left edges the clue " +
          "marks are small hand-painted numerals in faded dark ink. " +
          CABIN_LIGHT,
        // The largest board and the one nearest the frame edge, so it is the
        // one that competes with the fire for the eye. Held a little darker
        // than the default so the fireplace stays the focal point.
        style: { boost: 0.88 },
        quad: [
          [56, 183],
          [356, 197],
          [356, 457],
          [55, 452],
        ],
      },
      // Framed pegboard right of the fireplace, lit by the sconce.
      pipes: {
        cls: "board",
        ref: "pipes.png",
        face: { x: 126, y: 92, w: 798, h: 852 },
        stylePrompt:
          "Repaint this as a real hand-made wooden PIPE PUZZLE board hanging in a cosy " +
          "log cabin: a pale cream painted panel with visible grain, set into a shallow " +
          "wooden tray with real thickness whose inner edge casts a soft shadow. The " +
          "pipes are chunky little painted wooden or enamelled metal pipe segments " +
          "sitting proud of the board with real volume, soft rounded ends and small " +
          "shadows beneath them. The RED pipes are glowing warm copper and amber, lit " +
          "from within as though flowing; the GREY pipes are dull unlit dark iron. The " +
          "orange discs are round brass hubs; the rings are brass collars. " +
          CABIN_LIGHT,
        quad: [
          [820, 243],
          [949, 254],
          [948, 464],
          [820, 464],
        ],
      },
      // Framed panel further right, nearest the window.
      mirror: {
        cls: "board",
        ref: "mirror.png",
        face: { x: 116, y: 99, w: 788, h: 809 },
        stylePrompt:
          "Repaint this as a real hand-made wooden MIRROR MAZE puzzle board hanging in " +
          "a cosy log cabin: a pale cream painted panel with visible grain and faint " +
          "hand-ruled guide lines, set into a shallow wooden tray with real thickness " +
          "whose inner edge casts a soft shadow. Each diagonal stroke is a small real " +
          "angled mirror in a slim brass bezel, catching a glint of firelight. The " +
          "orange line is a warm glowing beam of light lying across the board with a " +
          "soft bloom around it. The dark disc is a brass emitter; the hollow circle is " +
          "an unlit brass target ring. " +
          CABIN_LIGHT,
        quad: [
          [988, 295],
          [1094, 274],
          [1095, 429],
          [989, 431],
        ],
      },
      // The chess set is a 3D object on a table, not a planar surface, so a
      // homography would flatten the pieces. It needs a reference rendered from
      // a matching camera on a transparent background; until then the plate's
      // own set stands, which is already a real board in correct perspective
      // with two clearly distinguishable armies. The playing surface projects to
      // the quad below (clockwise from the leftmost corner): the board is turned
      // about 20 degrees in plan and seen from only ~17 degrees above its plane.
      chess: {
        cls: "asIs",
        note: "3D prop: needs a camera-matched cutout, not a homography",
        quad: [
          [105, 764],
          [252, 716],
          [452, 772],
          [305, 822],
        ],
      },
    },
    order: ["nonogram", "pipes", "mirror", "chess"],
  },

  // Not built by default: the Math room's props are a later pass, and its
  // backdrop is currently the approved concept frame untouched.
  "cabin-math": {
    file: "cabin-backdrop-math.png",
    base: "concept-math.png",
    props: {
      gearTrain: {
        cls: "mech",
        zone: { x: 440, y: 160, w: 300, h: 260 },
        prompt:
          "Replace the brass cogwheels on the STONE CHIMNEY BREAST above the fireplace " +
          "mantel with a proper working gear train, seen almost straight on. Four polished " +
          "brass cogwheels of clearly different sizes sit in a single row that steps down " +
          "from a big wheel on the left to a small wheel on the right. Every wheel has " +
          "bold, deep, evenly spaced square-cut teeth all round its rim, and each wheel is " +
          "positioned so that its teeth genuinely interlock and mesh with the teeth of the " +
          "next wheel along: the rims actually touch, with each tooth sitting in the gap " +
          "between two teeth of its neighbour, exactly like the gears inside a real clock. " +
          "No wheel overlaps or passes through another wheel, and no wheel floats with an " +
          "empty gap between it and its neighbour. Each wheel turns on a visible brass axle " +
          "pin driven into the stone, and has spokes and a hub. " +
          KEEP +
          " " +
          STYLE +
          " " +
          NO_TEXT,
      },
      vialRack: {
        cls: "mech",
        zone: { x: 790, y: 236, w: 172, h: 180 },
        prompt:
          "Replace the apparatus on the small WOODEN WALL SHELF to the right of the stone " +
          "chimney with a rack of glass measuring vials, seen straight on at eye level. A " +
          "low dark wood stand holds a single row of five identical tall narrow " +
          "cylindrical clear glass test tubes upright side by side, evenly spaced, all " +
          "exactly the same height and diameter. They are unmistakably REAL GLASS TUBES, " +
          "not flat coloured rectangles: each is a round cylinder with curved transparent " +
          "glass walls, a rounded bottom, a thin rolled rim, bright narrow specular " +
          "highlights down the glass and a clearly visible curved meniscus at the liquid " +
          "surface. Every tube is part filled with a different brightly coloured " +
          "translucent liquid, and every tube is filled to an obviously different level, " +
          "making a clean rising staircase of heights from barely covered on the left to " +
          "nearly full on the right: red, amber, green, blue, violet. The glass above each " +
          "liquid is empty and clear. No graduation lines on the glass. " +
          KEEP +
          " " +
          STYLE +
          " " +
          NO_TEXT,
      },
      panBalance: {
        cls: "mech",
        zone: { x: 930, y: 555, w: 320, h: 265 },
        prompt:
          "Replace the glass prism standing on the LOW WOODEN TABLE on the right of the " +
          "room with a big antique brass BALANCE SCALE standing squarely on that table " +
          "top, seen side on at eye level. It is the chunky old-fashioned kitchen kind: a " +
          "heavy turned wooden base, a short stout brass pillar rising from the middle of " +
          "it, and across the top of that pillar ONE SINGLE THICK SOLID STRAIGHT BRASS " +
          "CROSSBEAM — a stout bar as thick as a finger, plainly visible along its entire " +
          "length, balanced at its midpoint on the pillar and reaching out the same " +
          "distance each way. This crossbeam is the most important part of the object and " +
          "must be drawn solid and unbroken from end to end. A shallow round brass pan " +
          "sits directly ON TOP of each end of the crossbeam on a short stubby bracket, so " +
          "there are exactly two pans, both firmly attached to the beam. Nothing hangs on " +
          "chains and nothing floats unattached in mid air. The beam is tilted to the " +
          "left: the left pan carries a stack of chunky hexagonal brass weights of " +
          "different sizes and hangs lower, the right pan carries one small weight and " +
          "rides higher. Two spare weights stand on the table beside the base. " +
          KEEP +
          " " +
          STYLE +
          " " +
          NO_TEXT,
      },
    },
    order: ["gearTrain", "vialRack", "panBalance"],
  },
};

/** Rooms built when no target is named. */
const DEFAULT_TARGETS = ["cabin-logic-games"];

// ---------------------------------------------------------------------------
// Gateway
// ---------------------------------------------------------------------------

function apiKey() {
  const raw = process.env.ANTHROPIC_CUSTOM_HEADERS;
  if (!raw) throw new Error('ANTHROPIC_CUSTOM_HEADERS is not set (expected "x-tfy-api-key: ...").');
  const m = raw.match(/x-tfy-api-key:\s*(.+)/i);
  if (!m) throw new Error("ANTHROPIC_CUSTOM_HEADERS has no x-tfy-api-key entry.");
  const key = m[1].trim();
  if (!key) throw new Error("x-tfy-api-key is empty.");
  return key;
}

const headers = (key) => ({ "x-tfy-api-key": key, Authorization: `Bearer ${key}` });

async function readImage(res) {
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  const item = JSON.parse(text)?.data?.[0];
  if (!item) throw new Error(`unexpected response: ${text.slice(0, 200)}`);
  if (item.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item.url) {
    const r = await fetch(item.url);
    if (!r.ok) throw new Error(`image url fetch failed: HTTP ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
  throw new Error("response had neither b64_json nor url");
}

/** The gateway 5xx's, rate-limits and drops connections intermittently. */
async function withRetry(label, fn, tries = 4) {
  let last;
  for (let i = 1; i <= tries; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (i === tries || !/HTTP (429|5\d\d)|fetch failed|terminated|timeout/i.test(err.message))
        break;
      const wait = 4000 * i;
      console.log(`     ${label}: ${err.message.slice(0, 90)} — retrying in ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw last;
}

/** No mask is sent: this gateway's /images/edits ignores it (see header note). */
async function edit(key, { image, prompt, size = SIZE }) {
  return withRetry("edit", async () => {
    const fd = new FormData();
    fd.set("model", MODEL);
    fd.set("prompt", prompt);
    fd.set("size", size);
    fd.set("image", new Blob([image], { type: "image/png" }), "image.png");
    return readImage(await fetch(EDIT_URL, { method: "POST", headers: headers(key), body: fd }));
  });
}

// ---------------------------------------------------------------------------
// Stylize: turn a spec render into a painted object
// ---------------------------------------------------------------------------

/**
 * Find the board's face inside a stylized image.
 *
 * Told to repaint a board as a real object, the model reliably obliges — and
 * then frames it as a photograph, adding a wooden tray, a wall, a window, a mug.
 * That surrounding scene must not be warped into the plate: the plate supplies
 * its own frame. The face is the large bright panel in the middle, found by
 * taking the longest run of rows and of columns that are mostly bright, with the
 * outer margins excluded so a lit window at the edge cannot join the run.
 */
async function findPanel(bytes) {
  const small = await sharp(bytes).removeAlpha().greyscale().resize(320, 320, { fit: "fill" }).raw().toBuffer();
  const N = 320;
  const inX0 = Math.round(N * 0.1);
  const inX1 = Math.round(N * 0.95);
  const inY0 = Math.round(N * 0.04);
  const inY1 = Math.round(N * 0.96);
  const vals = [];
  for (let y = inY0; y < inY1; y++) for (let x = inX0; x < inX1; x++) vals.push(small[y * N + x]);
  vals.sort((a, b) => a - b);
  const cut = vals[Math.floor(vals.length * 0.55)];

  const longestRun = (isBright, from, to) => {
    let best = [0, -1];
    let start = -1;
    for (let i = from; i <= to; i++) {
      const ok = i < to && isBright(i);
      if (ok && start < 0) start = i;
      if (!ok && start >= 0) {
        if (i - start > best[0]) best = [i - start, start];
        start = -1;
      }
    }
    return best[1] < 0 ? null : { start: best[1], len: best[0] };
  };
  const rowBright = (y) => {
    let n = 0;
    for (let x = inX0; x < inX1; x++) if (small[y * N + x] > cut) n++;
    return n > (inX1 - inX0) * 0.5;
  };
  const colBright = (x) => {
    let n = 0;
    for (let y = inY0; y < inY1; y++) if (small[y * N + x] > cut) n++;
    return n > (inY1 - inY0) * 0.5;
  };
  const rr = longestRun(rowBright, inY0, inY1);
  const cc = longestRun(colBright, inX0, inX1);
  if (!rr || !cc || rr.len < N * 0.25 || cc.len < N * 0.25) return null;

  const meta = await sharp(bytes).metadata();
  const sx = meta.width / N;
  const sy = meta.height / N;
  return clampRect(
    {
      x: Math.round(cc.start * sx),
      y: Math.round(rr.start * sy),
      w: Math.round(cc.len * sx),
      h: Math.round(rr.len * sy),
    },
    meta.width,
    meta.height,
  );
}

/**
 * Repaint a reference board as a real physical object before it is warped into
 * the plate.
 *
 * This is the step whose absence sank the first bake. The references are specs
 * — flat, maximum contrast, no anti-aliasing, chosen so every mark is separable
 * — and a spec resampled into a painterly photoreal room reads as a screenshot
 * taped inside a picture frame: blob clue marks, flat black rounded-square
 * cells, uniform vector grid strokes, no paper grain, no board thickness, no
 * shadow from the frame.
 *
 * Note this IS expressible on this gateway even though region-inpainting is
 * not: /images/edits takes one image and repaints the whole of it, which is
 * wrong for editing a room but exactly right for restyling a board on its own.
 *
 * Cached in shots/art-wip/, because each call costs a request and the result is
 * an intermediate. Delete `styled-<room>-<id>.png` to re-roll one.
 */
async function stylizeBoard(key, room, id, prop, { force = false } = {}) {
  const cached = join(WIP_DIR, `styled-${room}-${id}.png`);
  if (!force && existsSync(cached)) {
    console.log(`      styled board: cached ${cached.split("/").pop()}`);
    return readFileSync(cached);
  }
  const refPath = join(REF_DIR, prop.ref);
  if (!existsSync(refPath))
    throw new Error(
      `missing puzzle reference ${refPath}. Set GEN_CABINS_REFS to the directory ` +
        `holding the rendered board PNGs.`,
    );
  const styled = await edit(key, {
    image: readFileSync(refPath),
    prompt: `${prop.stylePrompt}\n\n${HOLD_LAYOUT}`,
    size: "1024x1024",
  });
  mkdirSync(WIP_DIR, { recursive: true });
  writeFileSync(cached, styled);
  console.log(`      styled board: repainted ${prop.ref} -> ${cached.split("/").pop()}`);
  return styled;
}

/** The styled board cropped to its face, ready to warp. */
async function styledFace(key, room, id, prop, { force = false } = {}) {
  const styled = await stylizeBoard(key, room, id, prop, { force });
  const rect = prop.face ? clampRect(prop.face, 4096, 4096) : await findPanel(styled);
  if (!rect) {
    console.log("      face: could not find the panel; using the whole styled image");
    return styled;
  }
  const meta = await sharp(styled).metadata();
  const safe = clampRect(rect, meta.width, meta.height);
  console.log(
    `      face: ${safe.x},${safe.y} ${safe.w}x${safe.h} of ${meta.width}x${meta.height}` +
      `${prop.face ? " (manual)" : " (detected)"}`,
  );
  const face = await sharp(styled).extract(sharpRect(safe)).png().toBuffer();
  writeFileSync(join(WIP_DIR, `face-${room}-${id}.png`), face);
  return face;
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

function clampRect(r, w = W, h = H) {
  const x = Math.max(0, Math.round(r.x));
  const y = Math.max(0, Math.round(r.y));
  return { x, y, w: Math.min(w - x, Math.round(r.w)), h: Math.min(h - y, Math.round(r.h)) };
}

const sharpRect = (r) => ({ left: r.x, top: r.y, width: r.w, height: r.h });

const bboxOf = (pts) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x = Math.floor(Math.min(...xs));
  const y = Math.floor(Math.min(...ys));
  return { x, y, w: Math.ceil(Math.max(...xs)) - x + 1, h: Math.ceil(Math.max(...ys)) - y + 1 };
};

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Gaussian elimination with partial pivoting. */
function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c];
    if (Math.abs(piv) < 1e-12) throw new Error("degenerate quad");
    for (let k = c; k <= n; k++) M[c][k] /= piv;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      if (!f) continue;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row) => row[n]);
}

/** 3x3 homography taking the four `src` points to the four `dst` points. */
function homography(src, dst) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [X, Y] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
    b.push(Y);
  }
  const h = solve(A, b);
  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1],
  ];
}

function applyH(Hm, [x, y]) {
  const w = Hm[2][0] * x + Hm[2][1] * y + Hm[2][2];
  return [
    (Hm[0][0] * x + Hm[0][1] * y + Hm[0][2]) / w,
    (Hm[1][0] * x + Hm[1][1] * y + Hm[1][2]) / w,
  ];
}

/** Is p inside the convex quad given in TL, TR, BR, BL order? */
function inQuad(quad, px, py) {
  for (let i = 0; i < 4; i++) {
    const [x1, y1] = quad[i];
    const [x2, y2] = quad[(i + 1) % 4];
    if ((x2 - x1) * (py - y1) - (y2 - y1) * (px - x1) < 0) return false;
  }
  return true;
}

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Deterministic noise, so a rebuild is reproducible. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// BOARD: fit a rendered puzzle onto a frame's inner quad
// ---------------------------------------------------------------------------

/**
 * Fit the reference into the unit square while preserving its aspect ratio, so
 * a 10x10 grid stays square rather than being stretched to the opening's shape.
 * Whatever is left over is filled with the reference's own border colour, which
 * reads as the board's mount.
 */
function fitBox(refAspect, quadAspect) {
  if (refAspect >= quadAspect) {
    const h = quadAspect / refAspect;
    return { u0: 0, u1: 1, v0: (1 - h) / 2, v1: 1 - (1 - h) / 2 };
  }
  const w = refAspect / quadAspect;
  return { u0: (1 - w) / 2, u1: 1 - (1 - w) / 2, v0: 0, v1: 1 };
}

/**
 * Fit a plane per colour channel to the wall in a ring around `quad`, so the
 * room's directional light can be evaluated across the board's own face.
 *
 * The ring starts outside the frame's moulding (which is dark stained wood and
 * would bias the fit towards its own albedo) and is fitted robustly: least
 * squares, then the worst third of residuals dropped and refitted, so a
 * bookshelf or a stone hearth intruding into one corner of the ring cannot
 * tilt the whole plane.
 */
function fitLightPlane(plate, quad, { inner = 26, outer = 68 } = {}) {
  const box = bboxOf(quad);
  const cx = quad.reduce((s2, pt) => s2 + pt[0], 0) / 4;
  const cy = quad.reduce((s2, pt) => s2 + pt[1], 0) / 4;
  const ring = clampRect({
    x: box.x - outer,
    y: box.y - outer,
    w: box.w + 2 * outer,
    h: box.h + 2 * outer,
  });

  const samples = [];
  const grow = (k) =>
    quad.map(([x, y]) => {
      const len = Math.max(1e-6, Math.hypot(x - cx, y - cy));
      return [x + ((x - cx) / len) * k, y + ((y - cy) / len) * k];
    });
  const skirt = grow(inner);
  for (let y = ring.y; y < ring.y + ring.h; y += 2)
    for (let x = ring.x; x < ring.x + ring.w; x += 2) {
      if (inQuad(skirt, x, y)) continue;
      const i = (y * W + x) * 3;
      samples.push([x - cx, y - cy, plate[i], plate[i + 1], plate[i + 2]]);
    }
  if (samples.length < 60) return null;

  const planeFor = (ch) => {
    const fit = (list) => {
      // normal equations for v = a*dx + b*dy + c
      let sxx = 0, sxy = 0, sx = 0, syy = 0, sy = 0, n = 0, sxv = 0, syv = 0, sv = 0;
      for (const s2 of list) {
        const dx = s2[0];
        const dy = s2[1];
        const v = s2[2 + ch];
        sxx += dx * dx;
        sxy += dx * dy;
        sx += dx;
        syy += dy * dy;
        sy += dy;
        sxv += dx * v;
        syv += dy * v;
        sv += v;
        n++;
      }
      try {
        const [a, b, c] = solve(
          [
            [sxx, sxy, sx],
            [sxy, syy, sy],
            [sx, sy, n],
          ],
          [sxv, syv, sv],
        );
        return { a, b, c };
      } catch {
        return { a: 0, b: 0, c: sv / Math.max(1, n) };
      }
    };
    let f = fit(samples);
    const scored = samples
      .map((s2) => ({ s: s2, e: Math.abs(s2[2 + ch] - (f.a * s2[0] + f.b * s2[1] + f.c)) }))
      .sort((A, B) => A.e - B.e);
    f = fit(scored.slice(0, Math.max(40, Math.floor(scored.length * 0.67))).map((r) => r.s));
    return f;
  };

  const planes = [0, 1, 2].map(planeFor);
  const centre = planes.map((f) => Math.max(1, f.c));
  return { planes, centre, cx, cy };
}

/**
 * Warp `refBuf` onto `quad` in the plate and style-match it in.
 *
 * The reference is a clean synthetic render: brighter, flatter, sharper and more
 * neutral than a warm photoreal plate. Dropping it in unmodified reads as a
 * screenshot taped to the wall. So it is matched to the content it replaces,
 * which already sits at the right exposure and colour temperature for that
 * surface:
 *
 *   brightness  the reference's PAPER tone is matched to the plate board's paper
 *               tone. Both are taken as a high percentile of luminance rather
 *               than a mean, because both images are pale board carrying dark
 *               marks and only the percentile isolates the board itself.
 *   colour      taken from the brighter half of the replaced pixels, i.e. the
 *               paper's colour under this room's light, applied at CAST_STRENGTH.
 *   falloff     the plate's own light gradient across the opening, blurred and
 *               clamped, so a board lit by the sconce keeps its hotspot.
 *   grain       film grain matched to the plate's local noise level, measured
 *               robustly so the old board's edges do not inflate it.
 *   softness    a sub-pixel blur, because the plate is photographic and the
 *               reference is crisp vector.
 *
 * Only pixels inside the quad change.
 */
async function placeBoard(
  plateBuf,
  refBuf,
  quad,
  { boost = 0.94, cast = 0.45, softness = 0.45, grain = 0.35, percentile = 0.55, relief = 1, inner = 0.05, seed = 7 } = {},
) {
  const plate = await sharp(plateBuf).removeAlpha().raw().toBuffer();
  const { data: ref, info } = await sharp(refBuf)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rw = info.width;
  const rh = info.height;

  const toUnit = homography(quad, [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]);

  const quadW = (dist(quad[0], quad[1]) + dist(quad[3], quad[2])) / 2;
  const quadH = (dist(quad[0], quad[3]) + dist(quad[1], quad[2])) / 2;
  const fit = fitBox(rw / rh, quadW / quadH);

  const box = bboxOf(quad);
  const region = clampRect({ x: box.x - 4, y: box.y - 4, w: box.w + 8, h: box.h + 8 });

  // --- statistics of the pixels being replaced
  const lums = [];
  for (let y = region.y; y < region.y + region.h; y++)
    for (let x = region.x; x < region.x + region.w; x++) {
      if (!inQuad(quad, x, y)) continue;
      const i = (y * W + x) * 3;
      lums.push(lum(plate[i], plate[i + 1], plate[i + 2]));
    }
  if (!lums.length) throw new Error("quad covers no pixels");
  const sortedPlate = [...lums].sort((a, b) => a - b);
  const plateAt = (p) => sortedPlate[Math.min(sortedPlate.length - 1, Math.round(sortedPlate.length * p))];
  const platePaper = Math.max(1, plateAt(percentile));
  const plateMedian = plateAt(0.5);

  const paperMean = [0, 0, 0];
  let paperN = 0;
  for (let y = region.y; y < region.y + region.h; y++)
    for (let x = region.x; x < region.x + region.w; x++) {
      if (!inQuad(quad, x, y)) continue;
      const i = (y * W + x) * 3;
      if (lum(plate[i], plate[i + 1], plate[i + 2]) < plateMedian) continue;
      for (let c = 0; c < 3; c++) paperMean[c] += plate[i + c];
      paperN++;
    }
  for (let c = 0; c < 3; c++) paperMean[c] /= Math.max(1, paperN);
  const paperLum = Math.max(1, lum(paperMean[0], paperMean[1], paperMean[2]));

  // --- statistics of the reference
  const refLums = new Float32Array(rw * rh);
  for (let i = 0; i < rw * rh; i++)
    refLums[i] = lum(ref[i * 3], ref[i * 3 + 1], ref[i * 3 + 2]);
  const sortedRef = Float32Array.from(refLums).sort();
  const refPaper = Math.max(1, sortedRef[Math.round(sortedRef.length * percentile)]);
  const refMedian = sortedRef[Math.round(sortedRef.length * 0.5)];
  const refPaperMean = [0, 0, 0];
  let refPaperN = 0;
  for (let i = 0; i < rw * rh; i++) {
    if (refLums[i] < refMedian) continue;
    for (let c = 0; c < 3; c++) refPaperMean[c] += ref[i * 3 + c];
    refPaperN++;
  }
  for (let c = 0; c < 3; c++) refPaperMean[c] /= Math.max(1, refPaperN);
  const refPaperLum = Math.max(1, lum(refPaperMean[0], refPaperMean[1], refPaperMean[2]));

  // The puzzle generators are square-only while two of the three openings are
  // portrait, so a square board genuinely does sit in a portrait frame — which
  // is what real framed art does, with a mount above and below. So the leftover
  // area is painted AS a mount rather than left as a flat slab: the board's own
  // paper a shade darker, carrying the same grain, with the board's edge casting
  // a soft shadow onto it.
  const pad = refPaperMean.map((v) => Math.round(v * 0.9));

  const lumScale = (platePaper * boost) / refPaper;
  const gain = [0, 1, 2].map(
    (c) =>
      lumScale * ((paperMean[c] / paperLum) / (refPaperMean[c] / refPaperLum)) ** cast,
  );

  // --- the room's light across this board's face
  //
  // Sampled from the WALL AROUND the frame, not from inside the opening. The
  // opening's own pixels are board art, so they carry the old board's design,
  // not the room's lighting; matching to them produced three evenly lit panels
  // that read as backlit signs. The wall in a ring outside the frame does carry
  // the real light: this room has warm firelight from the centre and cool
  // daylight from the window on the right, so the wall gets measurably warmer
  // and brighter towards the fire.
  //
  // A plane is fitted per channel over that ring and then evaluated ACROSS the
  // opening, which extrapolates the local light direction over the board's own
  // face. Per channel, so colour temperature swings across the board too, not
  // just brightness.
  const light = fitLightPlane(plate, quad);

  // The wall plane alone is a shallow signal — measured across the nonogram's
  // face the surrounding wall only runs 28 to 33, so it can carry about +/-10%.
  // The opening's ORIGINAL content carries the rest: the still's own board was
  // painted with the room's falloff on it. Blurred far wider than a cell it
  // stops being a grid and becomes just that falloff, which is reusable even
  // though the design on top of it is not.
  const shade = await sharp(plate, { raw: { width: W, height: H, channels: 3 } })
    .extract(sharpRect(region))
    .greyscale()
    .blur(38)
    .raw()
    .toBuffer();
  let shadeSum = 0;
  for (let i = 0; i < region.w * region.h; i++) shadeSum += shade[i];
  const shadeMean = Math.max(1, shadeSum / (region.w * region.h));

  // --- the plate's grain, as a robust MAD of its high-pass inside the opening
  const hp = await sharp(plate, { raw: { width: W, height: H, channels: 3 } })
    .extract(sharpRect(region))
    .greyscale()
    .blur(1.2)
    .raw()
    .toBuffer();
  const grey = await sharp(plate, { raw: { width: W, height: H, channels: 3 } })
    .extract(sharpRect(region))
    .greyscale()
    .raw()
    .toBuffer();
  const devs = [];
  for (let i = 0; i < hp.length; i += 3) devs.push(Math.abs(grey[i] - hp[i]));
  devs.sort((a, b) => a - b);
  const sigma = Math.min(3, 1.4826 * devs[Math.floor(devs.length / 2)]) * grain;

  // --- warp
  const rand = mulberry32(seed);
  const SS = 2;
  const warped = Buffer.alloc(region.w * region.h * 3);
  const alpha = new Float32Array(region.w * region.h);
  for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      let hits = 0;
      const acc = [0, 0, 0];
      for (let oy = 0; oy < SS; oy++)
        for (let ox = 0; ox < SS; ox++) {
          const px = x + (ox + 0.5) / SS;
          const py = y + (oy + 0.5) / SS;
          if (!inQuad(quad, px, py)) continue;
          hits++;
          const [u, v] = applyH(toUnit, [px, py]);
          if (u < fit.u0 || u > fit.u1 || v < fit.v0 || v > fit.v1) {
            // mount, with the board's edge shadow falling across it
            const d = Math.max(
              Math.max(fit.u0 - u, u - fit.u1),
              Math.max(fit.v0 - v, v - fit.v1),
            );
            const sh = 1 - 0.42 * Math.exp(-Math.max(0, d) / 0.03);
            for (let c = 0; c < 3; c++) acc[c] += pad[c] * sh;
            continue;
          }
          const rx = ((u - fit.u0) / (fit.u1 - fit.u0)) * (rw - 1);
          const ry = ((v - fit.v0) / (fit.v1 - fit.v0)) * (rh - 1);
          const x0 = Math.min(rw - 2, Math.max(0, Math.floor(rx)));
          const y0 = Math.min(rh - 2, Math.max(0, Math.floor(ry)));
          const fx = Math.min(1, Math.max(0, rx - x0));
          const fy = Math.min(1, Math.max(0, ry - y0));
          for (let c = 0; c < 3; c++) {
            const p00 = ref[(y0 * rw + x0) * 3 + c];
            const p10 = ref[(y0 * rw + x0 + 1) * 3 + c];
            const p01 = ref[((y0 + 1) * rw + x0) * 3 + c];
            const p11 = ref[((y0 + 1) * rw + x0 + 1) * 3 + c];
            acc[c] +=
              p00 * (1 - fx) * (1 - fy) + p10 * fx * (1 - fy) + p01 * (1 - fx) * fy + p11 * fx * fy;
          }
        }
      const k = (y - region.y) * region.w + (x - region.x);
      alpha[k] = hits / (SS * SS);
      if (!hits) continue;
      const li = k * 3;
      const n = sigma > 0 ? (rand() + rand() + rand() - 1.5) * sigma : 0;

      // the original board's own low-frequency shading, damped so its design
      // cannot come back through as a ghost
      const sh = Math.min(1.5, Math.max(0.6, (shade[k] / shadeMean) ** (0.75 * relief)));

      // the frame's rabbet shades the board it holds, hardest along the top
      // edge. Without this the face is uniform right into the corners, which is
      // most of why a pasted board reads as a lit panel.
      const [uu, vv] = applyH(toUnit, [x + 0.5, y + 0.5]);
      const edge = Math.min(uu, 1 - uu, vv, 1 - vv);
      const topBias = 1 + 1.4 * Math.max(0, 1 - vv / 0.14);
      const rabbet = 1 - inner * topBias * Math.exp(-Math.max(0, edge) / 0.06);

      for (let c = 0; c < 3; c++) {
        // the room's light at this point, relative to the board's centre
        let g = 1;
        if (light) {
          const f = light.planes[c];
          const v0 = f.a * (x - light.cx) + f.b * (y - light.cy) + f.c;
          g = 1 + (v0 / light.centre[c] - 1) * relief;
        }
        g = Math.min(1.45, Math.max(0.55, g)) * sh * rabbet;
        const v = (acc[c] / hits) * gain[c] * g + n;
        warped[li + c] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
  }

  const soft =
    softness > 0
      ? await sharp(warped, { raw: { width: region.w, height: region.h, channels: 3 } })
          .blur(softness)
          .raw()
          .toBuffer()
      : warped;

  const out = Buffer.from(plate);
  for (let y = 0; y < region.h; y++)
    for (let x = 0; x < region.w; x++) {
      const k = y * region.w + x;
      const a = alpha[k];
      if (a <= 0) continue;
      const di = ((y + region.y) * W + x + region.x) * 3;
      for (let c = 0; c < 3; c++)
        out[di + c] = Math.round(out[di + c] * (1 - a) + soft[k * 3 + c] * a);
    }

  const png = await sharp(out, { raw: { width: W, height: H, channels: 3 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  // report the light the plane predicts across the face, so the relief is a
  // measured quantity rather than a feel
  let relight = null;
  if (light) {
    const at = (x, y) =>
      light.planes.map((f) => f.a * (x - light.cx) + f.b * (y - light.cy) + f.c);
    const mid = (p1, p2) => [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    const l = at(...mid(quad[0], quad[3]));
    const r = at(...mid(quad[1], quad[2]));
    const rel = (v, c) => 1 + (v[c] / light.centre[c] - 1) * relief;
    relight = {
      leftLum: lum(...l),
      rightLum: lum(...r),
      leftGain: rel(l, 0),
      rightGain: rel(r, 0),
    };
  }
  return { png, region, platePaper, sigma, fit, relight };
}

// ---------------------------------------------------------------------------
// MECH: regenerate in place, keep only what changed
// ---------------------------------------------------------------------------

function toneMatch(editRaw, baseRaw, zone) {
  const stats = [0, 1, 2].map(() => ({ n: 0, se: 0, sb: 0, se2: 0, sb2: 0 }));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (x >= zone.x && x < zone.x + zone.w && y >= zone.y && y < zone.y + zone.h) continue;
      const i = (y * W + x) * 3;
      for (let c = 0; c < 3; c++) {
        const s = stats[c];
        s.n++;
        s.se += editRaw[i + c];
        s.sb += baseRaw[i + c];
        s.se2 += editRaw[i + c] ** 2;
        s.sb2 += baseRaw[i + c] ** 2;
      }
    }
  const map = stats.map((s) => {
    const me = s.se / s.n;
    const mb = s.sb / s.n;
    const sde = Math.sqrt(Math.max(1e-6, s.se2 / s.n - me * me));
    const sdb = Math.sqrt(Math.max(1e-6, s.sb2 / s.n - mb * mb));
    const gain = Math.min(1.6, Math.max(0.6, sdb / sde));
    return { gain, off: mb - gain * me };
  });
  const out = Buffer.alloc(editRaw.length);
  for (let i = 0; i < editRaw.length; i += 3)
    for (let c = 0; c < 3; c++) {
      const v = map[c].gain * editRaw[i + c] + map[c].off;
      out[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  return { raw: out, map };
}

async function changedBox(tuned, base, zone, threshold = 40, minFrac = 0.05) {
  const d = Buffer.alloc(zone.w * zone.h);
  for (let y = 0; y < zone.h; y++)
    for (let x = 0; x < zone.w; x++) {
      const i = ((y + zone.y) * W + (x + zone.x)) * 3;
      d[y * zone.w + x] = Math.min(
        255,
        Math.abs(tuned[i] - base[i]) +
          Math.abs(tuned[i + 1] - base[i + 1]) +
          Math.abs(tuned[i + 2] - base[i + 2]),
      );
    }
  const blur = await sharp(d, { raw: { width: zone.w, height: zone.h, channels: 1 } })
    .blur(5)
    .raw()
    .toBuffer();
  const rowN = new Int32Array(zone.h);
  const colN = new Int32Array(zone.w);
  for (let y = 0; y < zone.h; y++)
    for (let x = 0; x < zone.w; x++)
      if (blur[y * zone.w + x] > threshold) {
        rowN[y]++;
        colN[x]++;
      }
  const span = (counts, len, across) => {
    const need = Math.max(4, Math.round(across * minFrac));
    let lo = -1;
    let hi = -1;
    for (let i = 0; i < len; i++)
      if (counts[i] >= need) {
        if (lo < 0) lo = i;
        hi = i;
      }
    return [lo, hi];
  };
  const [y0, y1] = span(rowN, zone.h, zone.w);
  const [x0, x1] = span(colN, zone.w, zone.h);
  if (y0 < 0 || x0 < 0) return null;
  return { x: x0 + zone.x, y: y0 + zone.y, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

async function compositeMech(baseBuf, editBuf, zone, { feather = 12, protect = [], pad = 10 } = {}) {
  const base = await sharp(baseBuf).removeAlpha().raw().toBuffer();
  const ed = await sharp(editBuf).resize(W, H, { fit: "fill" }).removeAlpha().raw().toBuffer();
  const { raw: tuned, map } = toneMatch(ed, base, zone);

  const box = await changedBox(tuned, base, zone);
  if (!box) throw new Error("the edit changed nothing inside the prop zone");
  const x0 = Math.max(zone.x, box.x - pad);
  const y0 = Math.max(zone.y, box.y - pad);
  const win = clampRect({
    x: x0,
    y: y0,
    w: Math.min(zone.x + zone.w, box.x + box.w + pad) - x0,
    h: Math.min(zone.y + zone.h, box.y + box.h + pad) - y0,
  });

  const ramp = (dd, f) => Math.min(1, Math.max(0, dd / f));
  const out = Buffer.from(base);
  for (let y = win.y; y < win.y + win.h; y++) {
    const dy = Math.min(y - win.y, win.y + win.h - 1 - y);
    for (let x = win.x; x < win.x + win.w; x++) {
      const dx = Math.min(x - win.x, win.x + win.w - 1 - x);
      let a = ramp(Math.min(dx, dy), feather);
      for (const p of protect) {
        if (x < p.x - 12 || x >= p.x + p.w + 12 || y < p.y - 12 || y >= p.y + p.h + 12) continue;
        const edge = Math.min(
          x - (p.x - 12),
          p.x + p.w + 12 - 1 - x,
          y - (p.y - 12),
          p.y + p.h + 12 - 1 - y,
        );
        a = Math.min(a, 1 - ramp(edge, 12));
      }
      if (a <= 0) continue;
      const i = (y * W + x) * 3;
      for (let c = 0; c < 3; c++) out[i + c] = Math.round(base[i + c] * (1 - a) + tuned[i + c] * a);
    }
  }
  const png = await sharp(out, { raw: { width: W, height: H, channels: 3 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  return { png, map, win };
}

/** Copy `rects` straight back out of the base, undoing an earlier prop pass. */
async function restoreFromBase(currentBuf, baseBuf, rects) {
  const cur = await sharp(currentBuf).removeAlpha().raw().toBuffer();
  const bas = await sharp(baseBuf).resize(W, H, { fit: "fill" }).removeAlpha().raw().toBuffer();
  for (const r of rects)
    for (let y = r.y; y < r.y + r.h; y++) {
      const from = (y * W + r.x) * 3;
      bas.copy(cur, from, from, from + r.w * 3);
    }
  return sharp(cur, { raw: { width: W, height: H, channels: 3 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function shrinkPng(bytes) {
  const out = await sharp(bytes)
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
    .toBuffer();
  return out.length < bytes.length ? out : bytes;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

async function buildRoom(room, { only, attempt, restyle }) {
  const spec = ROOMS[room];
  const basePath = join(CONCEPT_DIR, spec.base);
  if (!existsSync(basePath))
    throw new Error(
      `missing base still ${basePath}. shots/ is gitignored, so the concept frames must be ` +
        `present locally to re-derive the backdrops.`,
    );
  const outPath = attempt ? join(WIP_DIR, `${room}-${attempt}.png`) : join(ART_DIR, spec.file);
  mkdirSync(dirname(outPath), { recursive: true });
  mkdirSync(WIP_DIR, { recursive: true });

  const baseBuf = await sharp(readFileSync(basePath)).resize(W, H, { fit: "fill" }).png().toBuffer();
  const buildable = spec.order.filter((id) => spec.props[id].cls !== "asIs");
  if (only) {
    const unknown = only.filter((id) => !(id in spec.props));
    if (unknown.length) throw new Error(`unknown prop(s) for ${room}: ${unknown.join(", ")}`);
  }
  const todo = only ? buildable.filter((id) => only.includes(id)) : buildable;

  const needsKey = todo.some((id) => spec.props[id].cls !== "asIs");
  const key = needsKey ? apiKey() : null;

  const startPath = only && existsSync(outPath) ? outPath : basePath;
  let current = await sharp(readFileSync(startPath)).resize(W, H, { fit: "fill" }).png().toBuffer();
  console.log(
    `  ${room}: base shots/concept/${spec.base}` +
      (startPath === outPath ? " (continuing from the existing output)" : ""),
  );

  // A re-roll must not be conditioned on the attempt it replaces.
  if (only && startPath === outPath) {
    const wipe = todo
      .filter((id) => spec.props[id].cls === "mech")
      .map((id) => clampRect(spec.props[id].zone));
    if (wipe.length) {
      current = await restoreFromBase(current, baseBuf, wipe);
      console.log(`  ${room}: reset ${wipe.length} mech zone(s) to the base`);
    }
  }

  const protect = spec.order
    .filter((id) => spec.props[id].cls === "board" && !todo.includes(id))
    .map((id) => bboxOf(spec.props[id].quad));

  const report = [];
  for (const id of todo) {
    const prop = spec.props[id];

    if (prop.cls === "board") {
      const styled = await styledFace(key, room, id, prop, { force: restyle });
      const { png, platePaper, sigma, fit, relight } = await placeBoard(
        current,
        styled,
        prop.quad,
        prop.style ?? {},
      );
      current = png;
      const b = bboxOf(prop.quad);
      protect.push(b);
      report.push({ id, cls: "board", ref: prop.ref, quad: prop.quad, bbox: b });
      const padded = fit.u0 > 0.001 || fit.v0 > 0.001;
      console.log(
        `  ${room}/${id} (board) ${prop.ref} -> ${prop.quad.map((p) => p.join(",")).join(" ")} ` +
          `(${b.w}x${b.h}px, paper ${Math.round(platePaper)}, grain ${sigma.toFixed(1)}` +
          `${padded ? ", letterboxed onto the mount to keep cells square" : ""})`,
      );
      if (relight)
        console.log(
          `      wall light across the face: left ${relight.leftLum.toFixed(0)} -> ` +
            `right ${relight.rightLum.toFixed(0)}; applied gain ` +
            `${relight.leftGain.toFixed(2)} -> ${relight.rightGain.toFixed(2)}`,
        );
      continue;
    }

    const zone = clampRect(prop.zone);
    const edited = await edit(key, { image: current, prompt: prop.prompt });
    if (process.env.GEN_CABINS_DUMP) writeFileSync(join(WIP_DIR, `edit-${room}-${id}.png`), edited);
    const { png, map, win } = await compositeMech(current, edited, zone, { protect: [...protect] });
    current = png;
    protect.push(win);
    report.push({ id, cls: "mech", box: win });
    const clipped = [
      win.x <= zone.x + 1 && "left",
      win.y <= zone.y + 1 && "top",
      win.x + win.w >= zone.x + zone.w - 1 && "right",
      win.y + win.h >= zone.y + zone.h - 1 && "bottom",
    ].filter(Boolean);
    console.log(
      `  ${room}/${id} (mech) landed ${win.x},${win.y} ${win.w}x${win.h} in zone ` +
        `${zone.x},${zone.y} ${zone.w}x${zone.h} (gain ${map.map((m) => m.gain.toFixed(2)).join("/")})` +
        (clipped.length ? `  *** TOUCHES ZONE ${clipped.join("+")} ***` : ""),
    );
  }

  for (const id of spec.order)
    if (spec.props[id].cls === "asIs")
      report.push({ id, cls: "asIs", quad: spec.props[id].quad, note: spec.props[id].note });

  const bytes = await shrinkPng(current);
  writeFileSync(outPath, bytes);
  writeFileSync(
    join(WIP_DIR, `${room}-props.json`),
    `${JSON.stringify({ image: spec.file, width: W, height: H, props: report }, null, 2)}\n`,
  );
  console.log(`  ${room} -> ${outPath} (${(bytes.length / 1e6).toFixed(2)} MB)`);
}

// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const targets = [];
  let only = null;
  let attempt = null;
  let list = false;
  let restyle = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--only") only = argv[++i].split(",").map((s) => s.trim());
    else if (a.startsWith("--only=")) only = a.slice(7).split(",").map((s) => s.trim());
    else if (a === "--attempt") attempt = argv[++i];
    else if (a.startsWith("--attempt=")) attempt = a.slice(10);
    else if (a === "--list") list = true;
    else if (a === "--restyle") restyle = true;
    else if (!a.startsWith("--")) targets.push(a);
  }
  return { targets, only, attempt, list, restyle };
}

async function main() {
  const { targets, only, attempt, list, restyle } = parseArgs(process.argv.slice(2));

  if (list) {
    console.log(`puzzle references: ${REF_DIR}${existsSync(REF_DIR) ? "" : "  (MISSING)"}`);
    for (const [room, spec] of Object.entries(ROOMS)) {
      console.log(`\n${room} (${spec.file})  base: shots/concept/${spec.base}`);
      for (const id of spec.order) {
        const prop = spec.props[id];
        const where =
          prop.cls === "board"
            ? `${prop.ref} -> quad ${prop.quad.map((p) => p.join(",")).join(" ")}`
            : prop.cls === "mech"
              ? `zone ${prop.zone.x},${prop.zone.y} ${prop.zone.w}x${prop.zone.h}`
              : `quad ${prop.quad.map((p) => p.join(",")).join(" ")} — ${prop.note}`;
        console.log(`  ${id.padEnd(16)} ${prop.cls.padEnd(6)} ${where}`);
      }
    }
    return;
  }

  const wanted = targets.length ? targets : DEFAULT_TARGETS;
  const unknown = wanted.filter((t) => !(t in ROOMS));
  if (unknown.length) {
    console.error(`Unknown target(s): ${unknown.join(", ")}`);
    console.error(`Valid targets: ${Object.keys(ROOMS).join(", ")}`);
    process.exit(1);
  }

  let failed = false;
  for (const t of wanted) {
    try {
      await buildRoom(t, { only, attempt, restyle });
    } catch (err) {
      failed = true;
      console.error(`  ${t}: FAILED — ${err.message.slice(0, 400)}`);
    }
  }
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
