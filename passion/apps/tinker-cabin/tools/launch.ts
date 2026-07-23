/**
 * Shared Playwright launcher for a WebGL-capable Chromium, plus a dev-server helper so the
 * screenshot tools are self-contained. Caches the winning launch recipe (LAAS pattern).
 * Ported from ~/code/test/tools/launch.ts, adapted for the interior cabin (window.__cabin).
 */
import { type ChildProcess, spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Browser, chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = resolve(HERE, "..");
const CACHE_PATH = resolve(PROJECT_ROOT, ".cache/webgl-flags.json");
// 5177 (not 5173) to avoid colliding with the ~/code/test voxel-world server, which is pinned to 5173.
export const PORT = 5177;
export const BASE = `http://localhost:${PORT}`;

interface Recipe {
  args: string[];
}

// SwiftShader (software GL) first — always available headless and deterministic.
// Then try real GPU via ANGLE/Metal for nicer/faster output.
const CANDIDATES: Recipe[] = [
  { args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] },
  { args: ["--use-gl=angle", "--use-angle=metal", "--ignore-gpu-blocklist"] },
  { args: ["--ignore-gpu-blocklist"] },
];

async function probe(recipe: Recipe): Promise<Browser | null> {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true, args: recipe.args });
    const page = await browser.newPage();
    await page.setContent('<canvas id="c"></canvas>');
    const ok = await page.evaluate(() => {
      const c = document.getElementById("c") as HTMLCanvasElement;
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    });
    await page.close();
    if (ok) return browser;
    await browser.close();
    return null;
  } catch {
    if (browser) await browser.close().catch(() => undefined);
    return null;
  }
}

export async function launchWebGL(): Promise<Browser> {
  try {
    const cached = JSON.parse(readFileSync(CACHE_PATH, "utf8")) as Recipe;
    const b = await probe(cached);
    if (b) return b;
  } catch {
    /* no cache */
  }
  for (const recipe of CANDIDATES) {
    const b = await probe(recipe);
    if (b) {
      mkdirSync(dirname(CACHE_PATH), { recursive: true });
      writeFileSync(CACHE_PATH, JSON.stringify(recipe, null, 2));
      console.log(`[launch] WebGL OK args=[${recipe.args.join(" ")}]`);
      return b;
    }
  }
  throw new Error("No Chromium recipe produced a WebGL context");
}

async function reachable(): Promise<boolean> {
  try {
    const res = await fetch(BASE, { method: "HEAD" });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

/** Ensure a dev server is up on PORT. Returns a close() that kills it if we started it. */
export async function ensureServer(): Promise<() => Promise<void>> {
  if (await reachable()) return async () => undefined;
  const proc: ChildProcess = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
    cwd: PROJECT_ROOT,
    stdio: "ignore",
    detached: false,
  });
  const start = Date.now();
  while (Date.now() - start < 30000) {
    await new Promise((r) => setTimeout(r, 400));
    if (await reachable()) {
      return async () => {
        proc.kill("SIGTERM");
      };
    }
  }
  proc.kill("SIGKILL");
  throw new Error(`dev server did not start on :${PORT} within 30s`);
}

export interface UrlOpts {
  seed?: number | string;
  cam?: string;
  preset?: string;
  freeze?: boolean;
  hud?: boolean;
  /** gadget ids (comma list) or "all" to force gadgets into their activated showcase state */
  act?: string;
}

/** Build a deterministic app URL: ?seed &?cam=x,y,z,yaw,pitch[,fov] &?preset &?freeze &?hud &?act. */
export function cabinUrl(o: UrlOpts): string {
  const q = new URLSearchParams();
  if (o.seed !== undefined) q.set("seed", String(o.seed));
  if (o.cam) q.set("cam", o.cam);
  if (o.preset) q.set("preset", o.preset);
  if (o.freeze ?? true) q.set("freeze", "1");
  if (o.hud) q.set("hud", "1");
  if (o.act) q.set("act", o.act);
  return `${BASE}/?${q.toString()}`;
}
