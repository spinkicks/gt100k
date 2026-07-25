/**
 * Screenshot tool for the LAAS visual-delta loop. Points a headless Chromium at the running
 * mvp-jul24 dev/preview server, captures the map screen and the cabin (static backend) at a
 * fixed demo viewport, and writes PNGs into shots/.
 *
 * Ported from passion/apps/tinker-cabin/tools/shoot.ts. Simplified for mvp-jul24: the shots we
 * care about here are plain DOM/CSS (map illustration + static cabin backend), so there's no
 * need for tinker-cabin's WebGL-launch-recipe probing or its own dev-server bootstrapping — this
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

    // `?cabin=static` pins the cabin A/B backend to the static illustration (no WebGL needed)
    // before the map even mounts — see src/game/store.ts's `initialBackend`.
    const url = `${base}/?cabin=static`;
    console.log(`[shoot] ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    await page.waitForSelector(".map-screen", { timeout });
    await page.waitForTimeout(300); // let the map art + node layout settle a frame or two
    console.log(`[shoot] map → ${mapOut}`);
    await page.screenshot({ path: mapOut });

    // Only `math` is active on the map in this milestone (src/map/cabins.data.ts).
    await page.click('[data-cabin="math"]');
    await page.waitForSelector(".cabin-static", { timeout });
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
