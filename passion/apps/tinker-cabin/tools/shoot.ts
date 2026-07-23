/**
 * Screenshot tool. Boots the cabin headless at fixed params, waits for readiness, settles a few
 * frames, captures a PNG, and writes engine stats JSON.
 * Ported from ~/code/test/tools/shoot.ts (window.__world → window.__cabin, no time-of-day param).
 *
 *   pnpm shoot -- --seed 1337 --cam "0,1.6,4,-0.2,-0.05,60" --out shots/hero.png --stats shots/hero.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PROJECT_ROOT, cabinUrl, ensureServer, launchWebGL } from "./launch";
import type { CabinStats } from "./types";

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

export interface ShotResult {
  out: string;
  stats: CabinStats | null;
  error: string | null;
}

export async function shoot(args: Args): Promise<ShotResult> {
  const width = Number(str(args.w) ?? 1280);
  const height = Number(str(args.h) ?? 720);
  const out = resolve(PROJECT_ROOT, str(args.out) ?? `shots/shot-${Date.now()}.png`);
  const settle = Number(str(args.settle) ?? 12);
  const timeout = Number(str(args.timeout) ?? 120000);

  const url = cabinUrl({
    seed: str(args.seed),
    cam: str(args.cam),
    preset: str(args.preset) ?? "high",
    freeze: args.nofreeze !== true,
    hud: args.hud === true || args.hud === "1",
    act: str(args.act),
  });

  const closeServer = await ensureServer();
  const browser = await launchWebGL();
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => console.error("[pageerror]", e.message));
    console.log(`[shoot] ${url} → ${out}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page
      .waitForFunction(
        () => window.__cabin && (window.__cabin.ready || window.__cabin.error !== null),
        undefined,
        {
          timeout,
          polling: 250,
        },
      )
      .catch(async () => {
        const p = await page.evaluate(() =>
          window.__cabin ? window.__cabin.progressMsg : "no hook",
        );
        throw new Error(`timeout waiting for ready; last: ${p}`);
      });

    const error = await page.evaluate(() => window.__cabin?.error ?? null);
    if (error) return { out, stats: null, error };

    // settle: the render loop runs continuously, so a short wall wait ≈ several frames.
    // (Avoids sending a named closure to page.evaluate, which tsx/esbuild breaks via __name.)
    await page.waitForTimeout(Math.max(250, settle * 25));

    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out });
    const stats = await page.evaluate(() => window.__cabin?.stats ?? null);
    if (stats) {
      const statsPath = str(args.stats);
      if (statsPath)
        writeFileSync(resolve(PROJECT_ROOT, statsPath), JSON.stringify(stats, null, 2));
    }
    console.log(`[shoot] done — ${JSON.stringify(stats)}`);
    return { out, stats, error: null };
  } finally {
    await browser.close();
    await closeServer();
  }
}

// Run directly (not when imported by battery).
const invokedDirectly = process.argv[1]?.endsWith("shoot.ts");
if (invokedDirectly) {
  shoot(parseArgs(process.argv.slice(2)))
    .then((r) => {
      if (r.error) {
        console.error("[shoot] FAILED:", r.error);
        process.exit(1);
      }
    })
    .catch((e: unknown) => {
      console.error("[shoot] FAILED:", e instanceof Error ? e.message : e);
      process.exit(1);
    });
}
