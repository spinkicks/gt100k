#!/usr/bin/env node
// Turns the generated pursuit renders into the tiles the browse wall ships.
//
// Run it with the directory of source PNGs, one per pursuit id, named `p-<id>.png`:
//
//   node scripts/build-art.mjs ~/renders
//
// WHY THIS EXISTS RATHER THAN "drop the PNGs in public/". Two of the three things it does are
// measurement controls, not optimisations.
//
// The wall shows forty-four things at once and reads a child's choice as evidence of interest. Any
// property that varies across tiles and attracts the eye independently of content is therefore a
// confound that will be recorded as preference. Javora et al. measured exactly this: children aged
// 9-11 chose the prettier of two versions of IDENTICAL content 62% of the time, with no learning
// benefit either way. So the renders are generated from one fixed scaffold — one object, one camera,
// one light, one palette, one background — and then this script removes the variance the generator
// left behind.
//
// The largest of those is brightness. Measured across the raw set, mean luminance ran from 0.062 to
// 0.234: nearly four to one. On a dark wall the bright tile is the one a child's eye lands on, and
// the click that follows would enter the model as interest in the pursuit rather than interest in
// the light. `-gamma` pulls every tile to the same mean, which is a blunt instrument but the right
// one here: it preserves the object's internal modelling while flattening how loud the tile is.
//
// It does NOT touch hue or saturation. The palette is already constrained at the prompt, HSL
// saturation is a bad metric on near-black frames (dark browns score high), and chasing it would
// muddy the objects for no measurable gain.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { magick } from "./imagemagick.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "..", "public", "pursuits");
const CATALOGUE = resolve(HERE, "..", "..", "..", "packages", "pursuits", "src", "catalogue.ts");

/**
 * The tile art box, at 2x.
 *
 * 3:2 rather than the 4:3 the renders come out at, because the tile is wider than it is tall once
 * the label strip is under it. The crop is centred and the scaffold puts the object in the middle
 * sixty percent of the frame, so it survives losing an eighth off the top and bottom.
 */
const W = 480;
const H = 320;

/**
 * The mean luminance every tile is pulled to, on 0-1.
 *
 * Set near the median of the raw set rather than at some round number, so the correction is small
 * for most images and large only for the few outliers. Higher and the dark-walnut backgrounds turn
 * grey; lower and the brass loses its modelling.
 */
const TARGET = 0.13;

/**
 * How far a single image may be pushed.
 *
 * A gamma outside this range means the render itself was wrong — a blown-out background, a subject
 * lost in the dark — and the fix is to regenerate it, not to bend it here until it matches. The
 * script says so rather than silently shipping a smeared tile.
 */
const GAMMA_MIN = 0.55;
const GAMMA_MAX = 1.8;

/**
 * How close to TARGET a tile has to land, and how many tries it gets.
 *
 * One analytic solve for the gamma leaves a 1.4:1 spread across the set, because `-gamma` operates
 * on each pixel and the mean of the transformed image is not the transform of the mean. Feeding the
 * measured result back in converges in two or three passes and gets the set inside 1.1:1, which is
 * below the point where a side-by-side comparison shows anything.
 */
const TOLERANCE = 0.004;
const MAX_PASSES = 6;

// Resolved rather than hard-coded: ImageMagick 7 calls it `magick` and 6.9 calls it `convert`.

function idsFromCatalogue() {
  const src = execFileSync("cat", [CATALOGUE], { encoding: "utf8" });
  return [...src.matchAll(/id: "([a-z0-9-]+)"/g)].map((m) => m[1]);
}

const srcDir = resolve(process.argv[2] ?? ".");
const ids = idsFromCatalogue();

const missing = ids.filter((id) => {
  try {
    readdirSync(srcDir);
  } catch {
    console.error(`no such directory: ${srcDir}`);
    process.exit(1);
  }
  return !readdirSync(srcDir).includes(`p-${id}.png`);
});
if (missing.length > 0) {
  console.error(`no source render for: ${missing.join(", ")}`);
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const report = [];
for (const id of ids) {
  const src = join(srcDir, `p-${id}.png`);
  const cropped = join("/tmp", `art-${id}.png`);

  magick([src, "-gravity", "center", "-resize", `${W}x${H}^`, "-extent", `${W}x${H}`, cropped]);

  const meanOf = (f) =>
    Number(magick([f, "-colorspace", "Gray", "-format", "%[fx:mean]", "info:"]));
  const before = meanOf(cropped);

  // out = in^(1/g), so a first guess lands at 1/g = ln(TARGET)/ln(before). Then correct against
  // what the transform actually produced, since the mean of a gamma is not the gamma of the mean.
  let gamma = Math.log(before) / Math.log(TARGET);
  const probe = join("/tmp", `probe-${id}.png`);
  let after = before;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    magick([cropped, "-gamma", String(gamma), probe]);
    after = meanOf(probe);
    if (Math.abs(after - TARGET) <= TOLERANCE) break;
    gamma *= Math.log(after) / Math.log(TARGET);
  }
  rmSync(probe, { force: true });

  if (gamma < GAMMA_MIN || gamma > GAMMA_MAX) {
    console.error(
      `${id}: mean ${before.toFixed(3)} needs gamma ${gamma.toFixed(2)}, outside ` +
        `[${GAMMA_MIN}, ${GAMMA_MAX}]. Regenerate the render instead of stretching it.`,
    );
    process.exit(1);
  }

  const out = join(OUT, `${id}.webp`);
  magick([cropped, "-gamma", String(gamma), "-quality", "78", "-define", "webp:method=6", out]);
  rmSync(cropped, { force: true });

  report.push({ id, before, gamma, after });
}

const spread = (xs) => Math.max(...xs) / Math.min(...xs);
console.log(`wrote ${report.length} tiles to ${OUT}`);
console.log(
  `luminance spread: ${spread(report.map((r) => r.before)).toFixed(2)}x in, ` +
    `${spread(report.map((r) => r.after)).toFixed(2)}x out`,
);
