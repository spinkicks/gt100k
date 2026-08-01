/**
 * Browser verification of the homography, run against real Chromium layout.
 *
 *   pnpm tsx src/cabin/backdrop/verify/matrix3d.verify.ts
 *
 * WHY THIS EXISTS ALONGSIDE homography.test.ts
 * The unit tests prove the matrix is the one the maths asks for. They cannot prove that CSS agrees
 * with our reading of CSS, and that is where the two genuinely subtle conventions live: `matrix3d`
 * takes its arguments column-major, and it applies in the element's own local space with an origin
 * that defaults to the element's centre. Get either wrong and the unit tests still pass — the matrix
 * is right, it is simply being fed to the browser transposed, or applied about the wrong point. So
 * this file asks Chromium where the corners actually landed and compares against the authored quad.
 *
 * It is NOT named `*.test.ts` on purpose: `pnpm test` must stay a fast jsdom run that needs no
 * browser download. This is a verification you run when you touch the maths.
 *
 * WHAT IT CHECKS
 *   1. Corner accuracy at scale 1 (art pixels == CSS pixels), for every flat prop in every room.
 *   2. Corner accuracy composed with the backdrop's cover-fit scale — the real rendering path, where
 *      an outer `translate(...) scale(...)` sits above each prop's matrix3d.
 *   3. Perspective is real, not an affine approximation: the midpoint of the warped element's top
 *      edge must land where the projective transform says, which is NOT the midpoint of the quad's
 *      top edge for a foreshortened quad.
 *   4. SVG polygon hit testing is genuinely non-rectangular: `elementFromPoint` at the polygon's
 *      centroid finds the hotspot; at a corner of its bounding box that lies outside the polygon, it
 *      does not.
 * It also writes a screenshot so the warp can be eyeballed.
 */

import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { fitArt } from "../fit";
import {
  type Point,
  type Quad,
  bounds,
  containsPoint,
  quadSourceSize,
  toSvgPoints,
} from "../geometry";
import { applyMatrix3, quadTransform, rectToQuad, sourceCorners } from "../homography";
import { BACKDROP_ROOMS } from "../quads.data";
import { propPolygon } from "../types";

const OUT_DIR = "shots/backdrop-verify";

/** Sub-pixel. Anything above this would be visible as a preview sitting off its painted surface. */
const CORNER_TOLERANCE_PX = 0.5;

interface PropCase {
  id: string;
  quad: Quad;
  width: number;
  height: number;
  transform: string;
}

interface Measurement {
  id: string;
  corner: number;
  expected: Point;
  actual: Point;
  error: number;
}

function flatCases(): PropCase[] {
  const cases: PropCase[] = [];
  for (const room of BACKDROP_ROOMS) {
    for (const prop of room.props) {
      if (prop.kind !== "flat") continue;
      const { width, height } = quadSourceSize(prop.quad);
      const transform = quadTransform(width, height, prop.quad);
      if (transform === null) throw new Error(`${prop.gadgetId}: quad admits no homography`);
      cases.push({ id: prop.gadgetId, quad: prop.quad, width, height, transform });
    }
  }
  return cases;
}

/**
 * A page holding one warped element per prop, each with a zero-size marker at every corner of its
 * SOURCE rectangle. Measuring the markers measures the transform: their positions inside the element
 * are (0,0), (w,0), (w,h), (0,h) in the element's untransformed local space, so wherever they render
 * is where CSS believes those source corners go.
 *
 * `outerTransform` is the backdrop's cover-fit applied above the props, so case (2) exercises the
 * exact composition that ships rather than the matrix in isolation.
 */
function buildPage(
  cases: PropCase[],
  artWidth: number,
  artHeight: number,
  outerTransform: string,
  boxWidth: number,
  boxHeight: number,
  polygons: Array<{ id: string; points: string }>,
): string {
  const props = cases
    .map(
      (c) => `
    <div class="prop" data-prop="${c.id}"
         style="width:${c.width}px;height:${c.height}px;transform:${c.transform}">
      <i class="mark" data-corner="0" style="left:0;top:0"></i>
      <i class="mark" data-corner="1" style="left:${c.width}px;top:0"></i>
      <i class="mark" data-corner="2" style="left:${c.width}px;top:${c.height}px"></i>
      <i class="mark" data-corner="3" style="left:0;top:${c.height}px"></i>
      <i class="mark" data-corner="4" style="left:${c.width / 2}px;top:0"></i>
      <b class="face"></b>
    </div>`,
    )
    .join("");

  const shapes = polygons
    .map((p) => `<polygon data-prop="${p.id}" points="${p.points}" class="hit" />`)
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;background:#20140d}
  #box{position:relative;width:${boxWidth}px;height:${boxHeight}px;overflow:hidden}
  #layer{position:absolute;left:0;top:0;width:${artWidth}px;height:${artHeight}px;
         transform-origin:0 0;transform:${outerTransform}}
  .prop{position:absolute;left:0;top:0;transform-origin:0 0}
  .face{position:absolute;inset:0;display:block;
        background:repeating-linear-gradient(45deg,#f3e4c6 0 10px,#c9a86e 10px 20px);
        outline:2px solid #c25a1f;opacity:.85}
  .mark{position:absolute;width:0;height:0;display:block}
  svg{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
  .hit{fill:transparent;pointer-events:fill;stroke:#ffb867;stroke-width:2;
       vector-effect:non-scaling-stroke}
  </style></head><body>
  <div id="box">
    <div id="layer">${props}</div>
    <svg viewBox="0 0 ${artWidth} ${artHeight}" preserveAspectRatio="xMidYMid slice">${shapes}</svg>
  </div>
  </body></html>`;
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const cases = flatCases();
  const room = BACKDROP_ROOMS[0];
  if (room === undefined) throw new Error("no authored rooms");
  const { artWidth, artHeight } = room;

  const polygons = room.props.map((prop) => ({
    id: prop.gadgetId,
    points: toSvgPoints(propPolygon(prop)),
  }));

  const browser = await chromium.launch();
  const failures: string[] = [];

  try {
    for (const label of ["unscaled", "cover-fit"] as const) {
      // 1330x748 is a realistic cabin frame: 16:9-ish inside the app's 1080px max-width shell, which
      // against 3:2 art gives a non-integer cover scale and a negative vertical offset — the awkward
      // case, not a convenient one.
      const boxWidth = label === "unscaled" ? artWidth : 1330;
      const boxHeight = label === "unscaled" ? artHeight : 748;
      const fit =
        label === "unscaled"
          ? { scale: 1, offsetX: 0, offsetY: 0 }
          : fitArt(boxWidth, boxHeight, artWidth, artHeight, "cover");
      const outerTransform = `translate(${fit.offsetX}px, ${fit.offsetY}px) scale(${fit.scale})`;

      const page = await browser.newPage({
        viewport: { width: Math.ceil(boxWidth), height: Math.ceil(boxHeight) },
        deviceScaleFactor: 1,
      });
      await page.setContent(
        buildPage(cases, artWidth, artHeight, outerTransform, boxWidth, boxHeight, polygons),
      );

      const measured = await page.evaluate(() => {
        const box = document.getElementById("box")!.getBoundingClientRect();
        const out: Array<{ id: string; corner: number; x: number; y: number }> = [];
        for (const prop of document.querySelectorAll<HTMLElement>(".prop")) {
          const id = prop.dataset.prop!;
          for (const mark of prop.querySelectorAll<HTMLElement>(".mark")) {
            const r = mark.getBoundingClientRect();
            out.push({
              id,
              corner: Number(mark.dataset.corner),
              x: r.left - box.left,
              y: r.top - box.top,
            });
          }
        }
        return out;
      });

      const results: Measurement[] = [];
      for (const m of measured) {
        const c = cases.find((k) => k.id === m.id)!;
        // Corner 4 is the top-edge midpoint: expected position comes from the homography itself, so
        // this catches an affine approximation (which would put it at the quad's edge midpoint).
        const source: Point =
          m.corner === 4 ? [c.width / 2, 0] : sourceCorners(c.width, c.height)[m.corner]!;
        const expectedArt = applyMatrix3(rectToQuad(c.width, c.height, c.quad)!, source)!;
        const expected: Point = [
          fit.offsetX + expectedArt[0] * fit.scale,
          fit.offsetY + expectedArt[1] * fit.scale,
        ];
        const error = Math.hypot(m.x - expected[0], m.y - expected[1]);
        results.push({ id: m.id, corner: m.corner, expected, actual: [m.x, m.y], error });
      }

      const worst = results.reduce((a, b) => (b.error > a.error ? b : a));
      console.log(
        `\n[${label}] box ${boxWidth}x${boxHeight}, art scale ${fit.scale.toFixed(6)}, ` +
          `${results.length} measured points`,
      );
      for (const id of cases.map((c) => c.id)) {
        const own = results.filter((r) => r.id === id);
        const max = Math.max(...own.map((r) => r.error));
        const corners = own
          .filter((r) => r.corner < 4)
          .map(
            (r) =>
              `c${r.corner}=(${r.actual[0].toFixed(2)},${r.actual[1].toFixed(2)}) want (${r.expected[0].toFixed(2)},${r.expected[1].toFixed(2)})`,
          )
          .join("  ");
        console.log(`  ${id.padEnd(12)} max corner error ${max.toFixed(4)}px  ${corners}`);
      }
      console.log(`  WORST: ${worst.id} corner ${worst.corner} -> ${worst.error.toFixed(4)}px`);
      if (worst.error > CORNER_TOLERANCE_PX) {
        failures.push(
          `[${label}] ${worst.id} corner ${worst.corner} off by ${worst.error.toFixed(4)}px ` +
            `(tolerance ${CORNER_TOLERANCE_PX}px)`,
        );
      }

      // Perspective is real: on the nonogram quad the warped top-edge midpoint must NOT sit at the
      // quad's own top-edge midpoint, because a projective map does not preserve midpoints.
      const nonogram = cases.find((c) => c.id === "nonogram");
      const mid = results.find((r) => r.id === "nonogram" && r.corner === 4);
      if (nonogram && mid) {
        const affineMidArt: Point = [
          (nonogram.quad[0][0] + nonogram.quad[1][0]) / 2,
          (nonogram.quad[0][1] + nonogram.quad[1][1]) / 2,
        ];
        const affineMid: Point = [
          fit.offsetX + affineMidArt[0] * fit.scale,
          fit.offsetY + affineMidArt[1] * fit.scale,
        ];
        const departure = Math.hypot(mid.actual[0] - affineMid[0], mid.actual[1] - affineMid[1]);
        console.log(
          `  perspective: top-edge midpoint sits ${departure.toFixed(3)}px from the affine midpoint`,
        );
        if (departure < 1) {
          failures.push(
            `[${label}] nonogram top-edge midpoint is within ${departure.toFixed(3)}px of the affine midpoint — the transform is not actually projective`,
          );
        }
      }

      // Non-rectangular hit testing, in a browser, on the real authored polygons.
      const hits = await page.evaluate(
        ({ probes }) =>
          probes.map((probe) => {
            const el = document.elementFromPoint(probe.x, probe.y);
            return {
              id: probe.id,
              kind: probe.kind,
              found: el instanceof SVGElement ? (el.getAttribute("data-prop") ?? "") : "",
            };
          }),
        {
          probes: room.props.flatMap((prop) => {
            const polygon = propPolygon(prop);
            const box = bounds(polygon);
            const centroid: Point = [
              polygon.reduce((s, p) => s + p[0], 0) / polygon.length,
              polygon.reduce((s, p) => s + p[1], 0) / polygon.length,
            ];
            const outsideCorner = (
              [
                [box.x + 2, box.y + 2],
                [box.x + box.width - 2, box.y + 2],
                [box.x + box.width - 2, box.y + box.height - 2],
                [box.x + 2, box.y + box.height - 2],
              ] as Point[]
            ).find((c) => !containsPoint(polygon, c));
            const toBox = (p: Point) => ({
              x: fit.offsetX + p[0] * fit.scale,
              y: fit.offsetY + p[1] * fit.scale,
            });
            const probes = [{ id: prop.gadgetId, kind: "inside", ...toBox(centroid) }];
            if (outsideCorner) {
              probes.push({ id: prop.gadgetId, kind: "bbox-corner", ...toBox(outsideCorner) });
            }
            return probes;
          }),
        },
      );

      console.log("  hit testing (elementFromPoint):");
      for (const hit of hits) {
        const ok = hit.kind === "inside" ? hit.found === hit.id : hit.found !== hit.id;
        console.log(
          `    ${hit.id.padEnd(12)} ${hit.kind.padEnd(12)} -> ${hit.found || "(nothing)"} ${ok ? "ok" : "FAIL"}`,
        );
        if (!ok) failures.push(`[${label}] hit test ${hit.id}/${hit.kind} found "${hit.found}"`);
      }

      await page.screenshot({ path: `${OUT_DIR}/matrix3d-${label}.png` });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\nscreenshots in ${OUT_DIR}/`);
  if (failures.length > 0) {
    throw new Error(`matrix3d verification FAILED:\n  ${failures.join("\n  ")}`);
  }
  console.log("matrix3d verification PASSED");
}

await main();
