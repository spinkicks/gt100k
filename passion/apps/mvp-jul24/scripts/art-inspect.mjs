#!/usr/bin/env node
/**
 * art-inspect.mjs — verification helper for the cabin backdrops.
 *
 * Five jobs, all of them "look at the thing you actually shipped":
 *
 *   crop    Cut a prop region out of an image and upscale it, so the prop can be
 *           inspected at a size where a melted gear or a stray numeral is
 *           obvious. Prop rects come from gen-cabins.mjs.
 *
 *   grid    Overlay a labelled 100px coordinate grid, for reading prop
 *           rectangles and hit-quad corners off an image instead of guessing.
 *
 *   diff    Prove the untouched part is untouched. Compares two images and
 *           reports the percentage of differing pixels outside a given set of
 *           rects, plus a heatmap.
 *
 *   flat    Measure how flat/blank a board region is: mean, standard deviation
 *           and a strong-edge count.
 *
 *   verify  Prove a baked board did not drift. Inverse-warps the quad out of the
 *           finished plate back into the reference's own rectangle and compares
 *           the two, after normalising for the deliberate relighting. Reports a
 *           correlation coefficient and writes the rectified crop so it can be
 *           read back by eye against the reference.
 *
 * Usage:
 *   node scripts/art-inspect.mjs crop  public/art/cabin-backdrop-logic-games.png 800,220,180,260 out.png [scale]
 *   node scripts/art-inspect.mjs grid  shots/concept/concept-logic.png out.png [step]
 *   node scripts/art-inspect.mjs diff  a.png b.png [x,y,w,h ...]
 *   node scripts/art-inspect.mjs flat  a.png x,y,w,h
 *   node scripts/art-inspect.mjs verify public/art/cabin-backdrop-logic-games.png \
 *          57,182,349,188,347,456,54,451 /path/to/refboards/nonogram.png shots/art-wip/rect.png
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (f) => (f.startsWith("/") ? f : join(APP_DIR, f));
const rectOf = (s) => {
  const [x, y, w, h] = s.split(",").map(Number);
  return { x, y, w, h };
};

async function crop(file, rectStr, out, scale = 3) {
  const r = rectOf(rectStr);
  mkdirSync(dirname(p(out)), { recursive: true });
  const buf = await sharp(readFileSync(p(file)))
    .extract({ left: r.x, top: r.y, width: r.w, height: r.h })
    .resize(Math.round(r.w * scale), Math.round(r.h * scale), { kernel: "lanczos3" })
    .png()
    .toBuffer();
  writeFileSync(p(out), buf);
  console.log(`${out} (${r.w}x${r.h} -> ${Math.round(r.w * scale)}x${Math.round(r.h * scale)})`);
}

async function diff(fileA, fileB, rectStrs = []) {
  const rects = rectStrs.map(rectOf);
  const a = sharp(readFileSync(p(fileA))).removeAlpha();
  const b = sharp(readFileSync(p(fileB))).removeAlpha();
  const ma = await a.metadata();
  const mb = await b.metadata();
  if (ma.width !== mb.width || ma.height !== mb.height) {
    console.log(`SIZE MISMATCH ${ma.width}x${ma.height} vs ${mb.width}x${mb.height}`);
    return;
  }
  const ra = await a.raw().toBuffer();
  const rb = await b.raw().toBuffer();
  const { width: w, height: h } = ma;
  const heat = Buffer.alloc(w * h * 3);
  let outN = 0,
    outDiff = 0,
    outExact = 0,
    inN = 0,
    inDiff = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const d =
        Math.abs(ra[i] - rb[i]) + Math.abs(ra[i + 1] - rb[i + 1]) + Math.abs(ra[i + 2] - rb[i + 2]);
      const inside = rects.some(
        (r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h,
      );
      if (inside) {
        inN++;
        if (d > 0) inDiff++;
      } else {
        outN++;
        if (d === 0) outExact++;
        else outDiff++;
      }
      heat[i] = d > 0 ? Math.min(255, d * 8) : 0;
      heat[i + 1] = d > 0 ? 40 : 0;
      heat[i + 2] = 0;
    }
  }
  console.log(`outside rects: ${outN} px, byte-identical ${((100 * outExact) / outN).toFixed(4)}%, differing ${outDiff}`);
  if (inN) console.log(`inside  rects: ${inN} px, differing ${((100 * inDiff) / inN).toFixed(2)}%`);
  const out = join(APP_DIR, "shots", "art-wip", "diff-heat.png");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, await sharp(heat, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer());
  console.log(`heatmap -> shots/art-wip/diff-heat.png`);
}

async function flat(file, rectStr) {
  const r = rectOf(rectStr);
  const { data, info } = await sharp(readFileSync(p(file)))
    .extract({ left: r.x, top: r.y, width: r.w, height: r.h })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const n = data.length;
  let s = 0,
    s2 = 0,
    min = 255,
    max = 0;
  for (let i = 0; i < n; i++) {
    s += data[i];
    s2 += data[i] * data[i];
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  const mean = s / n;
  const std = Math.sqrt(s2 / n - mean * mean);
  let edges = 0;
  for (let y = 1; y < info.height - 1; y++)
    for (let x = 1; x < info.width - 1; x++) {
      const i = y * info.width + x;
      if (Math.abs(data[i] - data[i + 1]) > 12 || Math.abs(data[i] - data[i + info.width]) > 12)
        edges++;
    }
  console.log(
    `${rectStr}: mean ${mean.toFixed(1)} std ${std.toFixed(1)} range ${min}-${max} strongEdges ${((100 * edges) / n).toFixed(2)}%`,
  );
}

/**
 * Overlay a labelled 100px coordinate grid, so prop rectangles and hit-quad
 * corners can be read straight off the image instead of guessed.
 */
async function grid(file, out, step = 100) {
  const img = sharp(readFileSync(p(file)));
  const { width: w, height: h } = await img.metadata();
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;
  for (let x = 0; x <= w; x += step) {
    const major = x % 500 === 0;
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${major ? "#00ff00" : "#00ffff"}" stroke-width="${major ? 2 : 1}" opacity="0.75"/>`;
    svg += `<text x="${x + 3}" y="16" font-family="monospace" font-size="15" fill="#00ff00" stroke="#000" stroke-width="0.5">${x}</text>`;
  }
  for (let y = 0; y <= h; y += step) {
    const major = y % 500 === 0;
    svg += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${major ? "#00ff00" : "#00ffff"}" stroke-width="${major ? 2 : 1}" opacity="0.75"/>`;
    svg += `<text x="3" y="${y - 4}" font-family="monospace" font-size="15" fill="#00ff00" stroke="#000" stroke-width="0.5">${y}</text>`;
  }
  svg += "</svg>";
  mkdirSync(dirname(p(out)), { recursive: true });
  writeFileSync(
    p(out),
    await img.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer(),
  );
  console.log(`${out} (${w}x${h}, ${step}px grid)`);
}

// --- verify: inverse-warp a baked board back and compare it to its source ----

function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c];
    if (Math.abs(piv) < 1e-12) throw new Error("degenerate quad");
    for (let k = c; k <= n; k++) M[c][k] /= piv;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      if (!f) continue;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row) => row[n]);
}

function homography(src, dst) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [X, Y] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
    b.push(Y);
  }
  const h = solve(A, b);
  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1],
  ];
}

const applyH = (Hm, x, y) => {
  const w = Hm[2][0] * x + Hm[2][1] * y + Hm[2][2];
  return [
    (Hm[0][0] * x + Hm[0][1] * y + Hm[0][2]) / w,
    (Hm[1][0] * x + Hm[1][1] * y + Hm[1][2]) / w,
  ];
};

const hyp = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

async function verify(imgFile, quadStr, refFile, out) {
  const q = quadStr.split(",").map(Number);
  if (q.length !== 8) throw new Error("quad must be 8 numbers: x1,y1,x2,y2,x3,y3,x4,y4");
  const quad = [
    [q[0], q[1]],
    [q[2], q[3]],
    [q[4], q[5]],
    [q[6], q[7]],
  ];

  const { data: img, info: ii } = await sharp(readFileSync(p(imgFile)))
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data: ref, info: ri } = await sharp(readFileSync(p(refFile)))
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Same aspect-preserving fit gen-cabins.mjs used, so the rectified crop lines
  // up with the reference rather than with the opening.
  const quadW = (hyp(quad[0], quad[1]) + hyp(quad[3], quad[2])) / 2;
  const quadH = (hyp(quad[0], quad[3]) + hyp(quad[1], quad[2])) / 2;
  const refAspect = ri.width / ri.height;
  const quadAspect = quadW / quadH;
  let u0 = 0;
  let u1 = 1;
  let v0 = 0;
  let v1 = 1;
  if (refAspect >= quadAspect) {
    const hh = quadAspect / refAspect;
    v0 = (1 - hh) / 2;
    v1 = 1 - v0;
  } else {
    const ww = refAspect / quadAspect;
    u0 = (1 - ww) / 2;
    u1 = 1 - u0;
  }

  const unitToPlate = homography(
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    quad,
  );

  // Compare at the size the board actually occupies in the plate, not at the
  // reference's native size. The reference is 1280px of crisp vector; the
  // painted board may be only ~110px across. Upsampling the plate to meet the
  // reference makes the comparison measure that resolution gap rather than any
  // drift, so the reference is brought down to the plate instead.
  const onPlate = Math.max(24, Math.round(Math.min(quadW, quadH)));
  const ow = Math.max(24, Math.round(onPlate * Math.min(1, ri.width / ri.height)));
  const oh = Math.max(24, Math.round(onPlate * Math.min(1, ri.height / ri.width)));
  const rect = Buffer.alloc(ow * oh);
  const refs = Buffer.alloc(ow * oh);
  for (let y = 0; y < oh; y++)
    for (let x = 0; x < ow; x++) {
      const fu = (x + 0.5) / ow;
      const fv = (y + 0.5) / oh;
      const [px, py] = applyH(unitToPlate, u0 + fu * (u1 - u0), v0 + fv * (v1 - v0));
      const xi = Math.min(ii.width - 1, Math.max(0, Math.round(px)));
      const yi = Math.min(ii.height - 1, Math.max(0, Math.round(py)));
      rect[y * ow + x] = img[yi * ii.width + xi];
      // box-average the reference over the footprint of this output pixel, so
      // it is genuinely downsampled rather than point-sampled
      const bx0 = Math.floor((x / ow) * ri.width);
      const bx1 = Math.max(bx0 + 1, Math.floor(((x + 1) / ow) * ri.width));
      const by0 = Math.floor((y / oh) * ri.height);
      const by1 = Math.max(by0 + 1, Math.floor(((y + 1) / oh) * ri.height));
      let acc = 0;
      let cnt = 0;
      for (let yy = by0; yy < Math.min(ri.height, by1); yy++)
        for (let xx = bx0; xx < Math.min(ri.width, bx1); xx++) {
          acc += ref[yy * ri.width + xx];
          cnt++;
        }
      refs[y * ow + x] = Math.round(acc / Math.max(1, cnt));
    }

  // Correlate the PATTERN, not the levels. The bake deliberately imposes a
  // light field — a directional gradient from the room plus the frame's inner
  // shadow — so a raw correlation partly measures that relighting and reads as
  // drift when nothing has drifted. Dividing each image by a heavily blurred
  // copy of itself removes any smooth multiplicative illumination from both
  // sides and leaves the marks.
  const flatten = async (buf) => {
    const lowpass = await sharp(buf, { raw: { width: ow, height: oh, channels: 1 } })
      .blur(Math.max(2, Math.round(Math.min(ow, oh) * 0.12)))
      .raw()
      .toBuffer();
    const out = new Float32Array(ow * oh);
    for (let i = 0; i < out.length; i++) out[i] = (buf[i] + 1) / (lowpass[i] + 1);
    return out;
  };
  const rectD = await flatten(rect);
  const refsD = await flatten(refs);

  let sa = 0;
  let sb = 0;
  const n = ow * oh;
  for (let i = 0; i < n; i++) {
    sa += rectD[i];
    sb += refsD[i];
  }
  const ma = sa / n;
  const mb = sb / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const A = rectD[i] - ma;
    const B = refsD[i] - mb;
    num += A * B;
    da += A * A;
    db += B * B;
  }
  const r = num / Math.sqrt(Math.max(1e-9, da * db));

  mkdirSync(dirname(p(out)), { recursive: true });
  const side = await sharp(Buffer.concat([rect, refs]), {
    raw: { width: ow, height: oh * 2, channels: 1 },
  })
    .png()
    .toBuffer();
  writeFileSync(p(out), side);
  let plateSum = 0;
  let refSum = 0;
  for (let i = 0; i < n; i++) {
    plateSum += rect[i];
    refSum += refs[i];
  }
  console.log(
    `rectified ${ow}x${oh} | pattern correlation r=${r.toFixed(3)} ` +
      `(illumination divided out; 1.0 = identical marks) | ` +
      `baked level ${(plateSum / n).toFixed(0)} vs reference ${(refSum / n).toFixed(0)}`,
  );
  console.log(`${out}: baked board on top, reference below — read them back against each other`);
  // r is depressed by the bake's own relighting, sub-pixel softening and film
  // grain, and by the plate's low resolution — measured 0.61-0.75 on boards
  // whose marks are provably cell-for-cell identical to the reference. So this
  // threshold only catches gross failures: a mirrored fit, a rotated quad, or
  // the wrong reference. The side-by-side image is the real check.
  if (r < 0.45) {
    console.log("WARNING: correlation is very low; the fit may be mirrored, rotated or wrong");
    process.exitCode = 3;
  }
}

/**
 * snapquad — refine an approximate inner-frame quad to the actual opening.
 *
 * Eyeballing a frame's inner corners off a magnified crop is good to about ten
 * pixels, and ten pixels is enough to leave a bright sliver of the OLD board
 * showing along an edge after the new one is composited. The opening is a pale
 * board inside a dark moulding, so the edge is a strong luminance step: march
 * outward from the centre through each edge, find the step, fit a line per edge
 * by least squares, and intersect the lines for corners.
 */
async function snapquad(imgFile, quadStr) {
  const q = quadStr.split(",").map(Number);
  const quad = [
    [q[0], q[1]],
    [q[2], q[3]],
    [q[4], q[5]],
    [q[6], q[7]],
  ];
  const { data, info } = await sharp(readFileSync(p(imgFile)))
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const L = (x, y) =>
    data[
      Math.min(info.height - 1, Math.max(0, Math.round(y))) * info.width +
        Math.min(info.width - 1, Math.max(0, Math.round(x)))
    ];

  const cx = quad.reduce((s, pt) => s + pt[0], 0) / 4;
  const cy = quad.reduce((s, pt) => s + pt[1], 0) / 4;

  // Threshold-free edge finding. A global luminance cut-off gets dragged around
  // by shading — the top right of the nonogram's mount is in shadow, and a
  // fixed threshold put that corner 26px inside the real opening. The opening's
  // boundary is instead the place where luminance falls off fastest as you move
  // outward, which shading does not move.
  const lines = [];
  for (let i = 0; i < 4; i++) {
    const a = quad[i];
    const b = quad[(i + 1) % 4];
    const pts = [];
    for (let t = 0.12; t <= 0.88; t += 0.02) {
      const ex = a[0] + (b[0] - a[0]) * t;
      const ey = a[1] + (b[1] - a[1]) * t;
      const len = Math.hypot(ex - cx, ey - cy);
      const ux = (ex - cx) / len;
      const uy = (ey - cy) / len;
      // smoothed profile along the ray, then the steepest drop
      const R = 16;
      const prof = [];
      for (let r = -R; r <= R; r += 0.5) {
        let acc = 0;
        for (let k = -1; k <= 1; k++)
          acc += L(ex + ux * (r + k * 0.5) - uy * k * 2, ey + uy * (r + k * 0.5) + ux * k * 2);
        prof.push(acc / 3);
      }
      let bestR = null;
      let bestD = 0;
      for (let j = 3; j < prof.length - 3; j++) {
        const d = prof[j - 3] - prof[j + 3];
        if (d > bestD) {
          bestD = d;
          bestR = -R + j * 0.5;
        }
      }
      if (bestR !== null && bestD > 18) pts.push([ex + ux * bestR, ey + uy * bestR]);
    }
    if (pts.length < 6) throw new Error(`edge ${i} gave too few samples`);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const horiz = Math.abs(dx) >= Math.abs(dy);
    // robust line fit: least squares, then drop the worst fifth and refit
    const fit = (list) => {
      let sx = 0;
      let sy = 0;
      let sxx = 0;
      let sxy = 0;
      for (const [px, py] of list) {
        const u = horiz ? px : py;
        const v = horiz ? py : px;
        sx += u;
        sy += v;
        sxx += u * u;
        sxy += u * v;
      }
      const n = list.length;
      const m = (n * sxy - sx * sy) / Math.max(1e-9, n * sxx - sx * sx);
      return { m, c: (sy - m * sx) / n };
    };
    let f = fit(pts);
    const resid = pts
      .map((pt) => {
        const u = horiz ? pt[0] : pt[1];
        const v = horiz ? pt[1] : pt[0];
        return { pt, e: Math.abs(v - (f.m * u + f.c)) };
      })
      .sort((A, B) => A.e - B.e);
    f = fit(resid.slice(0, Math.max(6, Math.floor(resid.length * 0.8))).map((r) => r.pt));
    lines.push(horiz ? { a: -f.m, b: 1, c: f.c } : { a: 1, b: -f.m, c: f.c });
  }

  // intersect consecutive edges: corner i is edge (i-1) ∩ edge i
  const meet = (l1, l2) => {
    const det = l1.a * l2.b - l2.a * l1.b;
    if (Math.abs(det) < 1e-9) throw new Error("parallel edges");
    return [
      (l1.c * l2.b - l2.c * l1.b) / det,
      (l1.a * l2.c - l2.a * l1.c) / det,
    ];
  };
  const snapped = [0, 1, 2, 3].map((i) => meet(lines[(i + 3) % 4], lines[i]).map(Math.round));

  const moved = snapped.map((s, i) => Math.hypot(s[0] - quad[i][0], s[1] - quad[i][1]).toFixed(1));
  console.log(`corners moved by ${moved.join(", ")} px`);
  console.log(snapped.map((s) => s.join(",")).join(" "));
  console.log(`as a quad literal: ${JSON.stringify(snapped)}`);
}

/**
 * cells — read a grid board back off an image and compare it to the expected
 * fill map.
 *
 * The skill's own notes are blunt about this: a vision read of fine geometric
 * detail is evidence, not proof, and two reads of one image disagreed about
 * checkerboard parity while the more confident one was wrong — "pixel sampling
 * settled it". So for the one board where the answer is a clean binary per cell,
 * this samples pixels instead of asking a model.
 *
 * `map` is rows of `#` and `.`, rows separated by `/`. The board area inside the
 * image is given as fractions of the image so clue rails can be excluded.
 */
async function cells(file, gridStr, mapStr, areaStr = "0,0,1,1") {
  const [cols, rows] = gridStr.split("x").map(Number);
  const [ax, ay, aw, ah] = areaStr.split(",").map(Number);
  const expected = mapStr.split("/").map((r) => r.trim().split(""));
  if (expected.length !== rows) throw new Error(`map has ${expected.length} rows, expected ${rows}`);

  const { data, info } = await sharp(readFileSync(p(file)))
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const x0 = ax * info.width;
  const y0 = ay * info.height;
  const cw = (aw * info.width) / cols;
  const ch = (ah * info.height) / rows;

  // median of the middle half of each cell, so a hand-painted tile's edges,
  // grain and specular highlights do not swing the read
  const read = [];
  const vals = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const px = [];
      for (let yy = 0.3; yy < 0.71; yy += 0.05)
        for (let xx = 0.3; xx < 0.71; xx += 0.05) {
          const sx = Math.round(x0 + (c + xx) * cw);
          const sy = Math.round(y0 + (r + yy) * ch);
          if (sx < 0 || sy < 0 || sx >= info.width || sy >= info.height) continue;
          px.push(data[sy * info.width + sx]);
        }
      px.sort((a, b) => a - b);
      const v = px[Math.floor(px.length / 2)];
      vals.push(v);
      row.push(v);
    }
    read.push(row);
  }

  // split filled from empty at the midpoint of the two clusters
  const sorted = [...vals].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.15)];
  const hi = sorted[Math.floor(sorted.length * 0.85)];
  const cut = (lo + hi) / 2;

  let wrong = 0;
  const lines = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const filled = read[r][c] < cut;
      const want = expected[r][c] === "#";
      line += filled ? "#" : ".";
      if (filled !== want) {
        wrong++;
        line = line.slice(0, -1) + (want ? "x" : "o");
      }
    }
    lines.push(`  ${line}`);
  }
  const total = rows * cols;
  console.log(`grid ${cols}x${rows}, dark<${cut.toFixed(0)} (clusters ${lo}/${hi})`);
  console.log(lines.join("\n"));
  console.log(
    wrong === 0
      ? `MATCH: all ${total} cells agree with the expected map`
      : `MISMATCH: ${wrong}/${total} cells differ  (x = should be filled, o = should be empty)`,
  );
  if (wrong) process.exitCode = 3;
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "crop") await crop(rest[0], rest[1], rest[2], rest[3] ? Number(rest[3]) : 3);
else if (cmd === "grid") await grid(rest[0], rest[1], rest[2] ? Number(rest[2]) : 100);
else if (cmd === "verify") await verify(rest[0], rest[1], rest[2], rest[3] ?? "shots/art-wip/verify.png");
else if (cmd === "snapquad") await snapquad(rest[0], rest[1]);
else if (cmd === "cells") await cells(rest[0], rest[1], rest[2], rest[3]);
else if (cmd === "diff") await diff(rest[0], rest[1], rest.slice(2));
else if (cmd === "flat") await flat(rest[0], rest[1]);
else {
  console.error("usage: art-inspect.mjs <crop|diff|flat> ...");
  process.exit(1);
}
