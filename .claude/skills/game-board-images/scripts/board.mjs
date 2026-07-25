#!/usr/bin/env node
/**
 * board.mjs — accurate game-board images, four ways.
 *
 *   render    spec -> exact PNG/SVG diagram, drawn locally. Always correct.
 *   stylize   exact render -> photoreal image, geometry held by structure control.
 *   generate  text-to-image with a verify/refine loop. Photoreal, not guaranteed.
 *   verify    check any existing image against a spec with Claude vision.
 *
 * Run `node board.mjs help` for usage.
 */

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { renderBoard, normalizeSpec, describeSpec, THEMES } from "./lib/board.mjs";
import { generateImage, restyleImage, askText, MODELS } from "./lib/gateway.mjs";
import { verifyImage, summarize } from "./lib/verify.mjs";

// ------------------------------------------------------------------- arg parsing

const FLAGS = new Set(["flip", "no-coords", "coords", "verify", "no-verify", "quiet", "keep-attempts"]);
// Flags that work bare (`--svg`) but also accept a path (`--svg out.svg`).
const OPTIONAL_VALUE = new Set(["svg"]);

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const eq = a.indexOf("=");
    const name = eq === -1 ? a.slice(2) : a.slice(2, eq);
    if (eq !== -1) {
      const value = a.slice(eq + 1);
      out[name] = FLAGS.has(name) ? value !== "false" : value;
    } else if (FLAGS.has(name)) {
      out[name] = true;
    } else if (OPTIONAL_VALUE.has(name)) {
      const next = argv[i + 1];
      out[name] = next && !next.startsWith("--") ? argv[++i] : true;
    } else {
      out[name] = argv[++i];
    }
  }
  return out;
}

function die(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

/** Build a board spec from --spec / --fen / --game plus overrides. */
function specFromArgs(args) {
  let input = {};
  if (args.spec) {
    const text = args.spec === "-" ? readFileSync(0, "utf8") : readFileSync(resolve(args.spec), "utf8");
    try {
      input = JSON.parse(text);
    } catch (e) {
      die(`--spec is not valid JSON: ${e.message}`);
    }
  }
  if (args.fen) input.fen = args.fen;
  if (args.game) input.game = args.game;
  if (args.rows) input.rows = Number(args.rows);
  if (args.cols) input.cols = Number(args.cols);
  if (args.theme) {
    if (!THEMES[args.theme]) die(`unknown --theme "${args.theme}". Available: ${Object.keys(THEMES).join(", ")}`);
    input.theme = args.theme;
  }
  if (args["square-size"]) input.squareSize = Number(args["square-size"]);
  if (args.title) input.title = args.title;
  if (args.highlight) input.highlights = String(args.highlight).split(",").map((s) => s.trim()).filter(Boolean);
  if (args.flip) input.orientation = "black";
  if (args["no-coords"]) input.coords = false;
  if (args.coords === true) input.coords = true;
  if (!input.fen && !(input.pieces && input.pieces.length) && !args.game) {
    die("nothing to draw — pass --fen, or --spec with a pieces array (see `help`).");
  }
  return input;
}

function writeOut(path, bytes, label, quiet) {
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, bytes);
  if (!quiet) console.log(`${label}: ${abs} (${bytes.length.toLocaleString()} bytes)`);
  return abs;
}

// ---------------------------------------------------------------------- prompts

/**
 * Turn a spec into a text-to-image prompt. Positional facts are stated once,
 * densely, and last — image models weight the tail of a prompt heavily, and
 * repeating a square list tends to produce duplicated pieces rather than better
 * placement.
 */
function imagePromptFor(spec, style) {
  const desc = describeSpec(spec);
  const look =
    style ||
    "A clean, evenly lit photograph of a real wooden board, shot from directly overhead " +
      "(perfect top-down view, no perspective distortion), the board filling the frame square-on";
  return (
    `${look}.\n\n` +
    `The board and position must match this exactly:\n${desc}\n\n` +
    "Critical requirements: the grid must have exactly the stated number of rows and columns; " +
    "every listed piece must sit squarely in the centre of its named square; " +
    "every square not listed must be completely empty. " +
    "Do not add extra pieces, do not use a standard starting position, and do not " +
    "rearrange anything for symmetry or aesthetics. " +
    "No text, letters, numbers, labels, watermarks or UI anywhere in the image."
  );
}

// --------------------------------------------------------------------- commands

async function cmdRender(args) {
  const out = args.out || "board.png";
  const result = renderBoard(specFromArgs(args));
  writeOut(out, result.png, "wrote PNG", args.quiet);
  if (args.svg) {
    const svgPath = typeof args.svg === "string" ? args.svg : out.replace(/\.png$/i, "") + ".svg";
    writeOut(svgPath, Buffer.from(result.svg, "utf8"), "wrote SVG", args.quiet);
  }
  if (args.describe) writeOut(args.describe, Buffer.from(result.description, "utf8"), "wrote description", args.quiet);
  if (!args.quiet) {
    console.log(`size: ${result.width}x${result.height}`);
    console.log(`\n${result.description}`);
  }
  // Verification is opt-in here: the renderer is deterministic, so a check only
  // tells you whether the drawing is *legible*, not whether it is correct.
  if (args.verify) {
    const verdict = await verifyImage({ imageBytes: result.png, description: result.description });
    console.log(`\nlegibility check: ${summarize(verdict)}`);
    if (!verdict.accurate) process.exitCode = 3;
  }
}

async function cmdVerify(args) {
  if (!args.image) die("--image <path> is required");
  const bytes = readFileSync(resolve(args.image));
  let description;
  if (args.description) description = args.description;
  else if (args["description-file"]) description = readFileSync(resolve(args["description-file"]), "utf8");
  else description = describeSpec(normalizeSpec(specFromArgs(args)));

  const verdict = await verifyImage({ imageBytes: bytes, description });
  console.log(`grid seen: ${verdict.gridSeen ?? "?"}`);
  if (verdict.cornerSquares) console.log(`corners seen: ${verdict.cornerSquares}`);
  if (verdict.piecesSeen && !args.quiet) console.log(`read back: ${verdict.piecesSeen}`);
  console.log(`verdict: ${verdict.accurate ? "ACCURATE" : "NOT ACCURATE"}`);
  for (const e of verdict.errors) console.log(`  - ${e}`);
  if (!verdict.accurate) process.exitCode = 3;
}

async function cmdStylize(args) {
  const out = args.out || "board-styled.png";
  const attempts = Number(args.attempts || 2);
  const doVerify = args["no-verify"] ? false : true;
  const base = renderBoard(specFromArgs(args));
  const exactPath = args["keep-attempts"] ? out.replace(/\.png$/i, "") + ".exact.png" : null;
  if (exactPath) writeOut(exactPath, base.png, "wrote exact render", args.quiet);

  const style =
    args.style ||
    "a warm photorealistic wooden chess board with hand-turned pieces, soft studio lighting, " +
      "shallow shadows, shot from directly overhead";
  const model = args.model || MODELS.edit;

  const KEEP =
    "This image is a reference diagram. Repaint it in the described style but treat its layout as " +
    "fixed: the grid must keep the same number of rows and columns, and every piece must stay on " +
    "exactly the square it occupies here. Do not add, remove or move any piece. " +
    "No text, letters, numbers, coordinate labels or watermarks anywhere.";

  let last = null;
  let lastVerdict = null;

  for (let i = 1; i <= attempts; i++) {
    if (!args.quiet) console.log(`\nattempt ${i}/${attempts} (${model})`);
    // On a retry, name the squares that drifted — a generic "keep it the same"
    // has already failed by then, so the correction has to be specific.
    const correction =
      lastVerdict && !lastVerdict.accurate
        ? `\n\nThe previous attempt got these wrong; fix them precisely:\n- ${lastVerdict.errors.join("\n- ")}\n\n` +
          `For reference, the correct position is:\n${base.description}`
        : "";
    last = await restyleImage({
      imagePng: base.png,
      prompt: `${style}.\n\n${KEEP}${correction}`,
      model,
      size: args.size || "1024x1024",
    });
    if (args["keep-attempts"]) writeOut(out.replace(/\.png$/i, "") + `.attempt${i}.png`, last, "wrote attempt", true);
    if (!doVerify) break;
    lastVerdict = await verifyImage({ imageBytes: last, description: base.description });
    if (!args.quiet) console.log(`  check: ${summarize(lastVerdict)}`);
    if (lastVerdict.accurate) break;
  }

  writeOut(out, last, "wrote styled PNG", args.quiet);
  if (doVerify && lastVerdict && !lastVerdict.accurate) {
    console.log(
      "\nstyled image still does not verify, so it should not be published as this position. " +
        "The exact render is authoritative — use `render` output, simplify --style, or raise --attempts.",
    );
    process.exitCode = 3;
  }
}

async function cmdGenerate(args) {
  const out = args.out || "board-generated.png";
  const iterations = Number(args.iterations || 3);
  const model = args.model || MODELS.image;
  const spec = normalizeSpec(specFromArgs(args));
  const description = describeSpec(spec);

  let prompt = imagePromptFor(spec, args.style);
  let best = null;
  let bestVerdict = null;

  for (let i = 1; i <= iterations; i++) {
    if (!args.quiet) console.log(`\n--- iteration ${i}/${iterations} (${model}) ---`);
    const bytes = await generateImage({ prompt, model, size: args.size || "1024x1024" });
    if (args["keep-attempts"]) writeOut(out.replace(/\.png$/i, "") + `.attempt${i}.png`, bytes, "wrote attempt", true);

    const verdict = await verifyImage({ imageBytes: bytes, description });
    if (!args.quiet) console.log(`check: ${summarize(verdict)}`);

    // Keep whichever attempt scored best, so a later regression cannot lose the
    // good one.
    if (!bestVerdict || verdict.errors.length < bestVerdict.errors.length) {
      best = bytes;
      bestVerdict = verdict;
    }
    if (verdict.accurate) break;
    if (i === iterations) break;

    prompt = await askText({
      prompt:
        "You are refining a text-to-image prompt so the generated board matches a target exactly.\n\n" +
        `TARGET:\n${description}\n\nCURRENT PROMPT:\n${prompt}\n\n` +
        `A vision checker found these problems in the generated image:\n- ${verdict.errors.join("\n- ")}\n\n` +
        "Rewrite the prompt to fix exactly those problems. Keep the visual style language, " +
        "keep it a single paragraph plus the position list, and be more explicit about the squares " +
        "that were wrong (including which squares must be empty). Output ONLY the new prompt.",
    });
  }

  writeOut(out, best, "wrote generated PNG", args.quiet);
  if (bestVerdict?.accurate) {
    console.log("verdict: ACCURATE (verified against the spec)");
  } else {
    console.log(`verdict: NOT VERIFIED — best attempt had ${bestVerdict?.errors.length ?? "?"} issue(s):`);
    for (const e of bestVerdict?.errors ?? []) console.log(`  - ${e}`);
    console.log(
      "\nText-to-image cannot be relied on for exact placement. For a guaranteed-correct image " +
        "use `render` (exact diagram) or `stylize` (photoreal, geometry locked to an exact render).",
    );
    process.exitCode = 3;
  }
}

const HELP = `board.mjs — accurate chess and game-board images

COMMANDS
  render    Draw an exact board locally (PNG + optional SVG). Deterministic, offline, always correct.
  stylize   Draw exactly, then restyle photorealistically with the geometry locked. Verified.
  generate  Text-to-image with a verify-and-refine loop. Photoreal, accuracy not guaranteed.
  verify    Check an existing image against a spec using Claude vision.

SPEC INPUT (all commands)
  --fen "<FEN>"              chess position, e.g. "r1bqkb1r/pp2pppp/2n2n2/..."
  --spec <file.json|->       full spec: {game, rows, cols, placement, checkered, pieces:[...]}
  --game <name>              chess|checkers|draughts|go|reversi|tictactoe|connect-four|custom
  --rows N --cols N          override board size
  --theme <name>             ${Object.keys(THEMES).join("|")}   (mono = highest contrast)
  --square-size N            pixels per square
  --highlight a1,b2          tint squares
  --title "text"             caption above the board (lowercase only)
  --flip                     view from Black's side
  --no-coords                hide a-h / 1-8 labels

OPTIONS
  render    --out f.png [--svg [f.svg]] [--describe f.txt] [--verify]
  stylize   --out f.png [--style "..."] [--attempts 2] [--model ${MODELS.editAlternatives.join("|")}] [--no-verify] [--keep-attempts]
  generate  --out f.png [--iterations 3] [--model ${MODELS.imageAlternatives.join("|")}] [--style "..."] [--size 1024x1024] [--keep-attempts]
  verify    --image f.png [--description "..." | --description-file f.txt | spec input]

EXAMPLES
  # Exact diagram of a FEN position (no network, always correct)
  node board.mjs render --fen "r1bqkbnr/pp1ppppp/2n5/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R" --out sicilian.png --svg

  # Photoreal but still exactly right
  node board.mjs stylize --fen "8/8/8/4k3/8/8/4K3/7R" --out endgame.png --keep-attempts

  # A 19x19 go board from a spec file
  node board.mjs render --spec go.json --out go.png

  # Audit an image someone else produced
  node board.mjs verify --image found.png --fen "8/8/8/4k3/8/8/4K3/7R"

SPEC FILE SHAPE
  {
    "game": "checkers",
    "pieces": [
      {"at": "b2", "shape": "disc",  "color": "white"},
      {"at": "c3", "shape": "crown", "color": "black"}
    ]
  }
  Chess pieces use {"at","piece":"king|queen|rook|bishop|knight|pawn","color"}.
  Other games use {"at","shape":"disc|ring|cross|square|triangle|crown","color","label"}.
  Squares are algebraic: file letter from the left, rank number from the bottom.

Auth: reuses the gateway key in ANTHROPIC_CUSTOM_HEADERS. render works offline.
Exit code 3 means "produced, but did not verify".`;

const COMMANDS = { render: cmdRender, stylize: cmdStylize, generate: cmdGenerate, verify: cmdVerify };

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    console.log(HELP);
    return;
  }
  const fn = COMMANDS[cmd];
  if (!fn) die(`unknown command "${cmd}". Try: ${Object.keys(COMMANDS).join(", ")}, help`);
  await fn(parseArgs(argv.slice(1)));
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
