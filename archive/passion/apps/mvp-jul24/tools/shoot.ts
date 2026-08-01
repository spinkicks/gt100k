/**
 * Screenshot tool for the LAAS visual-delta loop. Points a headless Chromium at the running
 * mvp-jul24 dev/preview server, captures the map screen and the cabin (backdrop backend, the only
 * one left) at a fixed demo viewport, and writes PNGs into shots/.
 *
 * Ported from passion/apps/tinker-cabin/tools/shoot.ts. Simplified for mvp-jul24: the shots we
 * care about here are plain DOM/CSS/SVG (map illustration + backdrop cabin, no WebGL), so there's
 * no need for tinker-cabin's WebGL-launch-recipe probing or its own dev-server bootstrapping — this
 * assumes `pnpm --filter @gt100k/mvp-jul24 preview` (or `dev`) is already running on :5178.
 *
 *   pnpm shoot
 *   pnpm shoot -- --port 5178 --out-dir shots
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

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

// mvp-jul24's own dev/preview port (vite.config.ts + `preview --port 5178 --strictPort`).
const DEFAULT_PORT = 5178;
const VIEWPORT = { width: 1440, height: 900 };

export interface ShootResult {
  map: string;
  cabin: string;
}

export async function shoot(args: Args = {}): Promise<ShootResult> {
  const port = Number(str(args.port) ?? DEFAULT_PORT);
  const base = `http://localhost:${port}`;
  const outDir = resolve(PROJECT_ROOT, str(args["out-dir"]) ?? "shots");
  const timeout = Number(str(args.timeout) ?? 30000);
  mkdirSync(outDir, { recursive: true });
  const mapOut = resolve(outDir, "map.png");
  const cabinOut = resolve(outDir, "cabin.png");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => console.error("[pageerror]", e.message));

    // The backdrop is the only backend and needs no WebGL (an <img> plus SVG polygons), so the
    // headless shooter takes the default with no query param.
    const url = `${base}/`;
    console.log(`[shoot] ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    await page.waitForSelector(".map-screen", { timeout });
    await page.waitForTimeout(300); // let the map art + node layout settle a frame or two
    console.log(`[shoot] map → ${mapOut}`);
    await page.screenshot({ path: mapOut });

    // `logic-games` is the cabin with all seven puzzles in it (src/map/cabins.data.ts). `math` is
    // also active but deliberately empty until its games ship, so it isn't the useful shot here.
    await page.click('[data-cabin="logic-games"]');
    await page.waitForSelector(".cabin-backdrop", { timeout });
    await page.waitForTimeout(300);
    console.log(`[shoot] cabin → ${cabinOut}`);
    await page.screenshot({ path: cabinOut });

    return { map: mapOut, cabin: cabinOut };
  } finally {
    await browser.close();
  }
}

// Run directly (not when imported).
const invokedDirectly = process.argv[1]?.endsWith("shoot.ts");
if (invokedDirectly) {
  shoot(parseArgs(process.argv.slice(2)))
    .then((r) => console.log(`[shoot] done — ${JSON.stringify(r)}`))
    .catch((e: unknown) => {
      console.error("[shoot] FAILED:", e instanceof Error ? e.message : e);
      process.exit(1);
    });
}
