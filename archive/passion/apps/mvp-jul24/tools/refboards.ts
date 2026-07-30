/**
 * Export the Logic Games reference boards for the art pipeline: three PNGs plus the README that
 * describes them.
 *
 *     pnpm refboards                              # writes to the default out dir below
 *     pnpm refboards -- --out-dir /some/where     # or anywhere else
 *     pnpm refboards -- --port 5178 --scale 2
 *
 * Assumes a dev server is already up on :5178 (`pnpm dev`), the same assumption tools/shoot.ts makes.
 * It has to be the **dev** server, not `pnpm preview`: the harness is a dev-only entry and by design
 * is not in `dist` at all.
 *
 * WHAT THIS IS FOR
 * The puzzles in the Logic Games room are being painted into the backdrop plate rather than
 * composited live onto it (see the `PREVIEWS_DEFAULT` comment in
 * src/cabin/backdrop/CabinBackdrop.tsx). The art agent therefore needs (a) a pixel-exact reference to
 * paint from and (b) a written description to check the painted plate against afterwards. Both come
 * out of here, and both are generated from the same snapshot, so the picture and the prose cannot
 * drift apart.
 *
 * WHY A BROWSER SCREENSHOT AND NOT `renderToStaticMarkup` + sharp
 * The previews are styled entirely through CSS custom properties (see previews/PreviewSvg.tsx), and
 * the spec palette is applied as a stylesheet override in refboards/harness.css. Serialising the SVG
 * outside a browser would emit `fill="var(--ink)"` with nothing to resolve it, so the reference would
 * have to hardcode a second copy of the palette — one more thing to fall out of sync. A real browser
 * resolves the cascade the app's own way, and Chromium's SVG rasteriser gives clean edges at scale.
 *
 * DETERMINISM
 * Nothing here chooses anything. Every board is a pure function of a seed fixed in
 * src/cabin/backdrop/refboards/boards.ts, which is also where the reasoning about board sizes lives.
 * Re-running this writes byte-comparable PNGs.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  REF_BOARD_IDS,
  type RefBoardId,
  buildRefBoard,
  describeRefBoard,
  isMidState,
} from "../src/cabin/backdrop/refboards/boards";

const HERE = resolve(fileURLToPath(import.meta.url), "..");
const PROJECT_ROOT = resolve(HERE, "..");

const DEFAULT_PORT = 5178;
const HARNESS_PATH = "/src/cabin/backdrop/refboards/harness.html";
/** Where the art pipeline is currently reading references from. Override with `--out-dir`. */
const DEFAULT_OUT_DIR = resolve(process.env.HOME ?? "~", ".claude/jobs/9cd2c6ac/tmp/refboards");

/**
 * Device scale factor. The harness lays each board out at 640 CSS px square (refboards/harness.css),
 * so 2 yields 1280 px PNGs — over the 1024 px floor the art pipeline asks for, with headroom, and an
 * exact power of two so no resampling is involved anywhere.
 */
const DEFAULT_SCALE = 2;
/** The floor the art pipeline requires on the long edge. Asserted, not assumed. */
const MIN_LONG_EDGE = 1024;

interface Args {
  [k: string]: string | boolean;
}
function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      out[key] = next;
      i++;
    } else out[key] = true;
  }
  return out;
}
const str = (v: string | boolean | undefined): string | undefined =>
  typeof v === "string" ? v : undefined;

/** PNG dimensions, read straight out of the IHDR chunk. No decoder needed for two integers. */
function pngSize(bytes: Buffer): { width: number; height: number } {
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/**
 * Chess has no reference board and is not going to get one: the chess set already painted in the
 * plate is being kept as-is. The line the README prints depends on whether a `chess.png` someone else
 * produced happens to be sitting in the output directory, because claiming a file that is not there
 * is exactly the kind of quiet inaccuracy this README exists to avoid.
 */
function chessLine(outDir: string): string {
  return existsSync(resolve(outDir, "chess.png"))
    ? "- `chess.png` — present, but **not** produced by this script and never touched by it. Chess is out of scope: the chess set already painted in the plate is being kept as-is."
    : "- `chess.png` — **not present, and not needed.** Chess is out of scope: the chess set already painted in the plate is being kept as-is, so there is nothing to paint from and nothing to verify against.";
}

function readme(
  outDir: string,
  shots: Array<{ id: RefBoardId; width: number; height: number }>,
): string {
  return [
    "# Logic Games reference boards",
    "",
    "Generated — do not hand-edit. Rerun with `pnpm refboards` from `passion/apps/mvp-jul24`",
    "(dev server on :5178). Source of truth for both the PNGs and this text:",
    "`src/cabin/backdrop/refboards/boards.ts`, rendered through the app's own preview components by",
    "`src/cabin/backdrop/refboards/harness.html`.",
    "",
    "## How to use these",
    "",
    "Each PNG is the **board face only**, filling the image edge to edge: no frame, no margin, no",
    "background beyond the board's own, no padding, no shadow. The four corners of the image are the",
    "four corners of the board, so a homography fitted to them maps the board onto its opening in the",
    "plate directly. Every board is square; aspect ratio deliberately does not match the openings, so",
    "letterbox onto cream and keep the cells square rather than stretching to fit.",
    "",
    "The palette is a **specification palette**, not the room's: pure white paper, pure black ink, and",
    "saturated red/orange for anything that is meant to read as hot. It is chosen so that every mark is",
    "separable from every other mark. Recolour it into the room's warm scheme when painting — what has",
    "to survive is *which cells and which strokes*, and the hot/cold distinction, not these exact hues.",
    "",
    "**Each board is a deliberate mid-state** — part-solved, not blank and not finished — so the painted",
    "prop reads as a puzzle worth walking over to. The specific mid-state is described per board below",
    "and is the thing to verify the painted plate against.",
    "",
    "A note on fidelity, so the target is not over-set: these boards are **portraits of the genre, not",
    "of an instance**. Every gadget generates a fresh random puzzle when a child opens it, so no painted",
    "board can ever match what they are playing. What matters is that a child across the room sees",
    '"that is the pipes puzzle". Getting the listed cells right matters because it is checkable; getting',
    "the exact hue right does not.",
    "",
    "## Files",
    "",
    ...shots.map(({ id, width, height }) => `- \`${id}.png\` — ${width} x ${height} px`),
    chessLine(outDir),
    "",
    "## Boards",
    "",
    ...REF_BOARD_IDS.flatMap((id) => [describeRefBoard(id), ""]),
  ].join("\n");
}

export async function refboards(args: Args = {}): Promise<string[]> {
  const port = Number(str(args.port) ?? DEFAULT_PORT);
  const scale = Number(str(args.scale) ?? DEFAULT_SCALE);
  const outDir = resolve(PROJECT_ROOT, str(args["out-dir"]) ?? DEFAULT_OUT_DIR);
  const timeout = Number(str(args.timeout) ?? 30000);
  mkdirSync(outDir, { recursive: true });

  // Assert the mid-state property before spending a browser on it: a reference that is secretly a
  // blank or a solved board is the one failure mode that looks fine in a thumbnail.
  for (const id of REF_BOARD_IDS) {
    if (!isMidState(buildRefBoard(id))) {
      throw new Error(`refboards: ${id} is not a mid-state — fix boards.ts before exporting`);
    }
  }

  const browser = await chromium.launch({ headless: true });
  const written: string[] = [];
  const shots: Array<{ id: RefBoardId; width: number; height: number }> = [];
  try {
    const page = await browser.newPage({
      viewport: { width: 900, height: 900 },
      deviceScaleFactor: scale,
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    const url = `http://localhost:${port}${HARNESS_PATH}`;
    console.log(`[refboards] ${url} @ ${scale}x`);
    await page.goto(url, { waitUntil: "networkidle", timeout });
    await page.waitForSelector(".refboard svg", { timeout });

    for (const id of REF_BOARD_IDS) {
      const target = page.locator(`.refboard[data-board="${id}"]`);
      await target.waitFor({ state: "visible", timeout });
      const path = resolve(outDir, `${id}.png`);
      // `animations: "disabled"` and `caret: "hide"` keep anything time-dependent or cursor-shaped
      // out of a file that is supposed to be reproducible byte for byte.
      const bytes = await target.screenshot({ path, animations: "disabled", caret: "hide" });
      const { width, height } = pngSize(bytes);
      if (Math.max(width, height) < MIN_LONG_EDGE) {
        throw new Error(
          `refboards: ${id}.png is ${width}x${height}, under the ${MIN_LONG_EDGE}px long edge the art pipeline needs — raise --scale`,
        );
      }
      console.log(`[refboards] ${id} → ${path} (${width}x${height})`);
      written.push(path);
      shots.push({ id, width, height });
    }

    if (errors.length > 0) {
      throw new Error(`refboards: the harness reported errors:\n  ${errors.join("\n  ")}`);
    }
  } finally {
    await browser.close();
  }

  const readmePath = resolve(outDir, "README.md");
  writeFileSync(readmePath, `${readme(outDir, shots)}\n`, "utf8");
  console.log(`[refboards] README → ${readmePath}`);
  written.push(readmePath);
  return written;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  refboards(parseArgs(process.argv.slice(2))).catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
