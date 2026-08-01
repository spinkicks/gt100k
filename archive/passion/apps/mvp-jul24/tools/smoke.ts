/**
 * Full-loop runtime smoke test (Task 16 polish pass): drives the REAL mvp-jul24 app in a
 * real headless Chromium at 1440x900 and captures PNGs a human can review, exercising the
 * map → cabin → gadget → readout loop on the backdrop cabin backend — the only one left; `3d` and
 * `static` are parked (see game/store.ts, cabin/CabinView.tsx).
 *
 * This is a one-off dev tool, not a test — it doesn't assert anything itself. Its job is to
 * surface runtime errors (console errors / uncaught exceptions) that unit tests can't catch,
 * and to leave behind screenshots for visual review.
 *
 * Assumes `pnpm --filter @gt100k/mvp-jul24 preview` (or `dev`) is already running on :5178.
 *
 *   pnpm --filter @gt100k/mvp-jul24 exec tsx tools/smoke.ts
 *   pnpm --filter @gt100k/mvp-jul24 exec tsx tools/smoke.ts -- --port 5178 --out-dir /abs/path
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Page, chromium } from "playwright";

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

const DEFAULT_PORT = 5178;
// Overridable via --out-dir or SMOKE_OUT_DIR; defaults to the repo-relative (gitignored) shots/ dir.
const DEFAULT_OUT_DIR = resolve(PROJECT_ROOT, "shots");
const VIEWPORT = { width: 1440, height: 900 };

let failures = 0;

function ok(label: string): void {
  console.log(`[smoke] OK   ${label}`);
}
function fail(label: string, err: unknown): void {
  failures++;
  console.error(`[smoke] FAIL ${label}:`, err instanceof Error ? err.message : err);
}

function wireConsoleWatchers(page: Page, tag: string): void {
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error(`[smoke][${tag}][console.error]`, msg.text());
  });
  page.on("pageerror", (err) => console.error(`[smoke][${tag}][pageerror]`, err.message));
}

async function shootMap(base: string, outDir: string, timeout: number): Promise<void> {
  const label = "map screen";
  const out = resolve(outDir, "smoke-map.png");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    wireConsoleWatchers(page, "map");
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".map-screen", { timeout });
    await page.waitForTimeout(300);
    await page.screenshot({ path: out });
    ok(`${label} → ${out}`);
  } catch (e) {
    fail(label, e);
  } finally {
    await browser.close();
  }
}

async function shootBackdropCabinAndNonogramAndLogic(
  base: string,
  outDir: string,
  timeout: number,
): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    wireConsoleWatchers(page, "backdrop");

    // --- cabin, backdrop backend ---
    const cabinLabel = "cabin (backdrop backend)";
    const cabinOut = resolve(outDir, "smoke-cabin-backdrop.png");
    try {
      await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".map-screen", { timeout });
      await page.click('[data-cabin="logic-games"]');
      await page.waitForSelector(".cabin-backdrop", { timeout });
      await page.waitForTimeout(300);
      await page.screenshot({ path: cabinOut });
      ok(`${cabinLabel} → ${cabinOut}`);
    } catch (e) {
      fail(cabinLabel, e);
    }

    // --- nonogram gadget (opened from the still-loaded backdrop cabin) ---
    const nonogramLabel = "nonogram gadget overlay";
    const nonogramOut = resolve(outDir, "smoke-nonogram.png");
    try {
      await page.click('[data-prop="nonogram"]');
      await page.waitForSelector(".gadget-overlay", { timeout });
      await page.waitForTimeout(300);
      await page.screenshot({ path: nonogramOut });
      ok(`${nonogramLabel} → ${nonogramOut}`);
    } catch (e) {
      fail(nonogramLabel, e);
    }

    // --- close the nonogram overlay (its own exit button — the overlay is a fixed full-screen
    // layer that intercepts clicks on the topbar nav, so it must be dismissed from inside first),
    // then open logic-grid from the still-open cabin ---
    const logicLabel = "logic-grid gadget overlay";
    const logicOut = resolve(outDir, "smoke-logic.png");
    try {
      await page.click(".ng-exit");
      await page.waitForSelector(".gadget-overlay", { state: "detached", timeout });
      await page.click('[data-gadget="logic-grid"]');
      await page.waitForSelector(".gadget-overlay", { timeout });
      await page.waitForTimeout(300);
      await page.screenshot({ path: logicOut });
      ok(`${logicLabel} → ${logicOut}`);
    } catch (e) {
      fail(logicLabel, e);
    }

    // --- readout screen (interest nav) — close the logic-grid overlay first, same reason ---
    const readoutLabel = "readout screen";
    const readoutOut = resolve(outDir, "smoke-readout.png");
    try {
      await page.click(".lg-exit");
      await page.waitForSelector(".gadget-overlay", { state: "detached", timeout });
      await page.getByRole("button", { name: "Interest" }).click();
      await page.waitForSelector(".readout-screen", { timeout });
      await page.waitForTimeout(300);
      await page.screenshot({ path: readoutOut });
      ok(`${readoutLabel} → ${readoutOut}`);
    } catch (e) {
      fail(readoutLabel, e);
    }
  } finally {
    await browser.close();
  }
}

export async function smoke(args: Args = {}): Promise<{ failures: number }> {
  const port = Number(str(args.port) ?? DEFAULT_PORT);
  const base = `http://localhost:${port}`;
  const outDir = resolve(str(args["out-dir"]) ?? process.env.SMOKE_OUT_DIR ?? DEFAULT_OUT_DIR);
  const timeout = Number(str(args.timeout) ?? 30000);
  mkdirSync(outDir, { recursive: true });

  console.log(`[smoke] base=${base} outDir=${outDir}`);

  await shootMap(base, outDir, timeout);
  await shootBackdropCabinAndNonogramAndLogic(base, outDir, timeout);

  console.log(`[smoke] done — ${failures} failure(s)`);
  return { failures };
}

const invokedDirectly = process.argv[1]?.endsWith("smoke.ts");
if (invokedDirectly) {
  smoke(parseArgs(process.argv.slice(2)))
    .then((r) => {
      if (r.failures > 0) process.exit(1);
    })
    .catch((e: unknown) => {
      console.error("[smoke] FATAL:", e instanceof Error ? e.message : e);
      process.exit(1);
    });
}
