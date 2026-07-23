/**
 * Side-by-side compositor (ours left, reference right) + pixel sampling + frame diff, for the
 * reference-delta loop. Ported from ~/code/test/tools/compare.ts; adds meanAbsDiff for the
 * determinism gate.
 *
 *   pnpm compare -- --a shots/hero.png --b reference/01_cabin_fireplace_dusk.jpg --out shots/cmp_hero.png
 *   pnpm compare -- --sample shots/hero.png --px "640,360;640,600"
 *   pnpm compare -- --diff shots/hero.png --b shots/hero2.png
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import { PROJECT_ROOT } from "./launch";

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

/** Mean absolute per-channel difference (0..255) between two same-size frames — for determinism. */
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

async function samplePixels(imgPath: string, pxSpec: string): Promise<void> {
  const { data, info } = await sharp(resolve(PROJECT_ROOT, imgPath))
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (const pair of pxSpec.split(";")) {
    const [x, y] = pair.split(",").map(Number) as [number, number];
    if (x < 0 || y < 0 || x >= info.width || y >= info.height) {
      console.log(`(${x},${y}) out of bounds`);
      continue;
    }
    const i = (y * info.width + x) * info.channels;
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    console.log(
      `(${x},${y}) rgb(${r},${g},${b}) value=${(mx / 255).toFixed(2)} sat=${(mx ? (mx - mn) / mx : 0).toFixed(2)}`,
    );
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const sample = str(args.sample);
  if (sample) {
    await samplePixels(sample, str(args.px) ?? "");
    return;
  }
  const diff = str(args.diff);
  if (diff) {
    const b = str(args.b);
    if (!b) throw new Error("need --diff <a> --b <b>");
    const d = await meanAbsDiff(diff, b);
    console.log(`[compare] meanAbsDiff = ${d.toFixed(3)} / 255`);
    return;
  }
  const a = str(args.a);
  const b = str(args.b);
  if (!a || !b) throw new Error("need --a <ours> --b <reference> [--out path]");
  await sideBySide(a, b, str(args.out) ?? "shots/cmp.png");
}

const invokedDirectly = process.argv[1]?.endsWith("compare.ts");
if (invokedDirectly) {
  main().catch((e: unknown) => {
    console.error("[compare] FAILED:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
