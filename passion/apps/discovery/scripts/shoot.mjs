// Screenshots a page of the design lab and reports what a screenshot cannot show.
//
//   node scripts/shoot.mjs http://localhost:3060/browse /tmp/wall.png [width] [height] [age] [hover]
//
// The second half is the point. The wall makes three claims that are invisible in an image: that
// every tile fits on one screen, that no name is cut off, and that every picture actually loaded.
// A missing icon renders as a tile-shaped gap that reads as deliberate negative space, a label
// clipped at the second line reads as a short label, and a grid that overflows by forty pixels
// looks fine in a screenshot taken of the top of it. So this measures all three in the live DOM and
// prints them next to the file it wrote.
//
// Console errors, page errors and 4xx/5xx responses are collected for the same reason: the wall is
// a prototype served by a dev server, and "it looked right" has already been wrong once here.
import { chromium } from "playwright";

const [url, out, w = "1440", h = "900", age, hover] = process.argv.slice(2);
if (!url || !out) {
  console.error("usage: shoot.mjs <url> <out.png> [width] [height] [age] [hover-selector]");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h } });

const problems = [];
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`CONSOLE ${m.text()}`);
});
page.on("pageerror", (e) => problems.push(`PAGEERROR ${e.message}`));
page.on("response", (r) => {
  if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`);
});

await page.goto(url, { waitUntil: "networkidle" });
if (age) {
  await page.selectOption(".browse__age select", age);
  await page.waitForTimeout(400);
}
if (hover) {
  await page.hover(hover);
  await page.waitForTimeout(400);
}
// The column search runs in a layout effect and again on the resize observer's first callback, so
// the settled layout is a frame or two after load.
await page.waitForTimeout(600);

const info = await page.evaluate(() => {
  const grid = document.querySelector(".browse__grid");
  if (grid === null) return {};
  return {
    tiles: grid.querySelectorAll(".tile").length,
    fitsOneScreen: grid.scrollHeight <= grid.clientHeight,
    // +1 for sub-pixel rounding, which otherwise reports every label as clipped.
    clippedLabels: [...grid.querySelectorAll(".tile__label")].filter(
      (l) => l.scrollHeight > l.clientHeight + 1,
    ).length,
  };
});

const brokenImages = await page.evaluate(
  () =>
    [...document.querySelectorAll("img")].filter((i) => !i.complete || i.naturalWidth === 0).length,
);

await page.screenshot({ path: out });
await browser.close();

console.log(out, JSON.stringify({ ...info, brokenImages }));
for (const p of problems) console.log(" ", p);
