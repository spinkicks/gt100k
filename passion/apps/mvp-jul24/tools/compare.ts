/**
 * Sharp-based diff tool for the LAAS visual-delta loop: composes a side-by-side (ours left,
 * reference right) for eyeballing, and prints a normalized delta score so we can track whether
 * a shot is converging on the hero reference frame.
 *
 * Ported from passion/apps/tinker-cabin/tools/compare.ts. The shot and the reference frame here
 * are different resolutions/aspect ratios (a 1440x900 in-app capture vs. a full browser-chrome
 * screenshot), so the delta score resizes both to a common square before diffing — it's a rough
 * "are we in the right neighborhood" signal, not a pixel-exact regression check.
 *
 *   pnpm compare                                                     (shots/cabin.png vs reference/cabin-hero.png)
 *   pnpm compare -- --a shots/map.png --b reference/cabin-hero.png --out shots/cmp-map.png
 *   pnpm compare -- --diff shots/cabin.png --b shots/cabin-prev.png  (exact-size determinism check)
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = resolve(fileURLToPath(import.meta.url), "..");
export const PROJECT_ROOT = resolve(HERE, "..");

interface Args {
  [k: string]: string | boolean;
}
function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const nxt = argv[i + 1];
      if (nxt !== undefined && !nxt.startsWith("--")) {
        out[k] = nxt;
        i++;
      } else out[k] = true;
    }
  }
  return out;
}
const str = (v: string | boolean | undefined): string | undefined =>
  typeof v === "string" ? v : undefined;

const GUTTER = 12;
const TARGET_H = 720;
const DEFAULT_A = "shots/cabin.png";
const DEFAULT_B = "reference/cabin-hero.png";

export async function sideBySide(aPath: string, bPath: string, outPath: string): Promise<void> {
  const a = sharp(resolve(PROJECT_ROOT, aPath));
  const b = sharp(resolve(PROJECT_ROOT, bPath));
  const [am, bm] = await Promise.all([a.metadata(), b.metadata()]);
  const aw = Math.round(((am.width ?? 1) * TARGET_H) / (am.height ?? 1));
  const bw = Math.round(((bm.width ?? 1) * TARGET_H) / (bm.height ?? 1));
  const [aBuf, bBuf] = await Promise.all([
    a.resize(aw, TARGET_H).png().toBuffer(),
    b.resize(bw, TARGET_H).png().toBuffer(),
  ]);
  const out = resolve(PROJECT_ROOT, outPath);
  mkdirSync(dirname(out), { recursive: true });
  await sharp({
    create: {
      width: aw + GUTTER + bw,
      height: TARGET_H,
      channels: 3,
      background: { r: 12, g: 14, b: 13 },
    },
  })
    .composite([
      { input: aBuf, left: 0, top: 0 },
      { input: bBuf, left: aw + GUTTER, top: 0 },
    ])
    .png()
    .toFile(out);
  console.log(`[compare] ${outPath} (ours left, reference right)`);
}

async function rawRgb(path: string, size: number): Promise<Buffer> {
  return sharp(resolve(PROJECT_ROOT, path))
    .resize(size, size, { fit: "cover" })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer();
}

/**
 * Mean absolute per-channel difference (0..255) between two frames, after squashing both to the
 * same `size`x`size` square. Resolution/aspect-independent, so it works across a small in-app
 * shot and a full-page reference screenshot — lower is closer to the reference.
 */
export async function deltaScore(aPath: string, bPath: string, size = 512): Promise<number> {
  const [a, b] = await Promise.all([rawRgb(aPath, size), rawRgb(bPath, size)]);
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i]! - b[i]!);
  return sum / a.length;
}

/** Mean absolute per-channel diff (0..255) between two *same-size* frames — for determinism. */
export async function meanAbsDiff(aPath: string, bPath: string): Promise<number> {
  const [a, b] = await Promise.all([
    sharp(resolve(PROJECT_ROOT, aPath)).raw().toBuffer({ resolveWithObject: true }),
    sharp(resolve(PROJECT_ROOT, bPath)).raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (a.data.length !== b.data.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.data.length; i++) sum += Math.abs(a.data[i]! - b.data[i]!);
  return sum / a.data.length;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const diff = str(args.diff);
  if (diff) {
    const b = str(args.b);
    if (!b) throw new Error("need --diff <a> --b <b>");
    const d = await meanAbsDiff(diff, b);
    console.log(`[compare] meanAbsDiff = ${d.toFixed(3)} / 255`);
    return;
  }

  const a = str(args.a) ?? DEFAULT_A;
  const b = str(args.b) ?? DEFAULT_B;
  const out = str(args.out) ?? "shots/cmp.png";
  const size = Number(str(args.size) ?? 512);

  await sideBySide(a, b, out);
  const score = await deltaScore(a, b, size);
  console.log(`[compare] delta = ${score.toFixed(3)} / 255  (${a} vs ${b})`);
}

const invokedDirectly = process.argv[1]?.endsWith("compare.ts");
if (invokedDirectly) {
  main().catch((e: unknown) => {
    console.error("[compare] FAILED:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
