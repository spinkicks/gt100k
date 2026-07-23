#!/usr/bin/env node
/**
 * Fetch CC0 assets (Poly Haven) into cabin/public/assets/ — which is GITIGNORED, so binaries never
 * enter the public repo. Run once after install to get the real-asset look; the app falls back to
 * its procedural materials/lighting when these files are absent, so it always builds + runs offline.
 *
 *   node scripts/fetch-assets.mjs
 *
 * All Poly Haven assets are CC0 (public domain). See cabin/public/assets/CREDITS.md.
 * For richer/bespoke assets (a glTF cat, furniture), use Blender MCP — see docs/BLENDER_MCP.md.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = resolve(HERE, "../cabin/public/assets");
const API = "https://api.polyhaven.com/files";
const RES = "1k"; // keep files small (public-repo / web-perf hygiene)

/** HDRIs for image-based lighting → cabin/public/assets/env/ */
const HDRIS = [{ id: "kloppenheim_06", out: "env/dusk.hdr" }];

/** Photographic panoramas (tonemapped-JPG of a Poly Haven HDRI) → mapped onto the sky dome as the
 *  real mountain vista seen through the window. */
const PANORAMAS = [{ id: "champagne_castle_1", out: "env/vista.jpg" }];

/** PBR textures → cabin/public/assets/textures/<name>_{diff,nor,rough}.jpg */
const TEXTURES = [{ id: "brown_planks_05", name: "wood" }];

/** Direct-download CC0 GLB models (Poly Pizza / Quaternius) → cabin/public/assets/models/ */
const MODELS = [
  {
    url: "https://static.poly.pizza/7ccb71fe-dabb-4a6f-a98a-8992bb5e6bc7.glb",
    out: "models/cat.glb",
  },
  {
    url: "https://static.poly.pizza/712aaefa-ae7f-4cb3-8834-a1b8860df3b2.glb",
    out: "models/pine.glb",
  },
];

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function download(url, destRel) {
  const dest = resolve(ASSETS, destRel);
  mkdirSync(dirname(dest), { recursive: true });
  const r = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(dest, buf);
  console.log(`  ✓ ${destRel} (${(buf.length / 1e6).toFixed(2)} MB)`);
}

async function fetchHdri({ id, out }) {
  const files = await getJson(`${API}/${id}`);
  const url = files?.hdri?.[RES]?.hdr?.url;
  if (!url) throw new Error(`no ${RES} hdr for ${id}`);
  await download(url, out);
}

async function fetchPanorama({ id, out }) {
  const files = await getJson(`${API}/${id}`);
  const url = files?.tonemapped?.url;
  if (!url) throw new Error(`no tonemapped JPG for ${id}`);
  await download(url, out);
}

async function fetchTexture({ id, name }) {
  const files = await getJson(`${API}/${id}`);
  const pick = (key, suffix) => {
    const jpg = files?.[key]?.[RES]?.jpg?.url;
    return jpg ? { url: jpg, out: `textures/${name}_${suffix}.jpg` } : null;
  };
  const maps = [pick("Diffuse", "diff"), pick("nor_gl", "nor"), pick("Rough", "rough")].filter(
    Boolean,
  );
  if (!maps.length) throw new Error(`no ${RES} maps for ${id}`);
  for (const m of maps) await download(m.url, m.out);
}

async function main() {
  console.log(`Fetching CC0 assets → ${ASSETS} (${RES})`);
  let ok = 0;
  let fail = 0;
  for (const h of HDRIS) {
    try {
      console.log(`HDRI ${h.id}`);
      await fetchHdri(h);
      ok++;
    } catch (e) {
      console.warn(`  ! skipped ${h.id}: ${e instanceof Error ? e.message : e}`);
      fail++;
    }
  }
  for (const pa of PANORAMAS) {
    try {
      console.log(`Panorama ${pa.id}`);
      await fetchPanorama(pa);
      ok++;
    } catch (e) {
      console.warn(`  ! skipped ${pa.id}: ${e instanceof Error ? e.message : e}`);
      fail++;
    }
  }
  for (const t of TEXTURES) {
    try {
      console.log(`Texture ${t.id}`);
      await fetchTexture(t);
      ok++;
    } catch (e) {
      console.warn(`  ! skipped ${t.id}: ${e instanceof Error ? e.message : e}`);
      fail++;
    }
  }
  for (const m of MODELS) {
    try {
      console.log(`Model ${m.out}`);
      await download(m.url, m.out);
      ok++;
    } catch (e) {
      console.warn(`  ! skipped ${m.out}: ${e instanceof Error ? e.message : e}`);
      fail++;
    }
  }
  console.log(
    `Done: ${ok} ok, ${fail} skipped. (Assets are gitignored; the app falls back to procedural when absent.)`,
  );
  if (!existsSync(ASSETS)) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
