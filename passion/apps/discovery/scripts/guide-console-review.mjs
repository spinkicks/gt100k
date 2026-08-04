/**
 * Capture guide-console screenshots across children and tabs for design review.
 * Run from passion/apps/discovery: node scripts/guide-console-review.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.GUIDE_URL ?? "http://127.0.0.1:3080";
const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "guide-console",
  ".review-shots",
);
mkdirSync(OUT, { recursive: true });

const CHILDREN = [
  "Ari Mercado",
  "Bex Ito",
  "Cyrus Okafor",
  "Dulce Park",
  "Elle Nkemelu",
  "Demo Child",
];

const TABS = [
  { name: "interests", match: /^Interests/ },
  { name: "plan", match: /^Plan and access/ },
  { name: "family", match: /^Family/ },
];

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function shot(page, name) {
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log("wrote", path);
}

async function openChildFromToday(page, name) {
  // Prefer Today roster open button
  const open = page.getByRole("button", { name: `Open ${name}'s console` });
  if (await open.count()) {
    await open.first().click();
    await page.waitForTimeout(400);
    return;
  }
  // Fallback: child switcher in sidebar
  const kid = page.locator(".kid, .child, button").filter({ hasText: name }).first();
  await kid.click();
  await page.waitForTimeout(400);
}

async function goToday(page) {
  const today = page.locator("button.viewtoggle__btn", { hasText: "Today" });
  if (await today.count()) {
    await today.click();
    await page.waitForTimeout(300);
  }
}

async function clickTab(page, re) {
  const tab = page.locator("button.tab").filter({ hasText: re }).first();
  await tab.click();
  await page.waitForTimeout(350);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);

  // Landing: Today roster
  await shot(page, "00-today-roster");

  // Also capture a narrower viewport for density/hierarchy
  await page.setViewportSize({ width: 1100, height: 900 });
  await shot(page, "00-today-roster-narrow");
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const child of CHILDREN) {
    await goToday(page);
    await openChildFromToday(page, child);
    const base = slug(child);

    // Action line / wellbeing visible on interests by default
    await shot(page, `${base}-01-interests`);

    // Scroll to overview/charts if present
    const overview = page.locator(".overview, [class*='overview'], .ovpanel").first();
    if (await overview.count()) {
      await overview.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(200);
      await shot(page, `${base}-01b-interests-overview`);
    } else {
      // scroll bottom of main for charts
      await page.evaluate(() => {
        const m = document.querySelector("main.main");
        if (m) m.scrollTop = m.scrollHeight;
        else window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(200);
      await shot(page, `${base}-01b-interests-bottom`);
    }

    // Plan
    await clickTab(page, TABS[1].match);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, `${base}-02-plan`);
    await page.evaluate(() => {
      const m = document.querySelector("main.main");
      if (m) m.scrollTop = m.scrollHeight;
      else window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(200);
    await shot(page, `${base}-02b-plan-bottom`);

    // Family
    await clickTab(page, TABS[2].match);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, `${base}-03-family`);
    await page.evaluate(() => {
      const m = document.querySelector("main.main");
      if (m) m.scrollTop = m.scrollHeight;
      else window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(200);
    await shot(page, `${base}-03b-family-bottom`);

    // Maps drawer
    const mapsBtn = page.locator("button.mapq").first();
    if (await mapsBtn.count()) {
      await mapsBtn.click();
      await page.waitForTimeout(400);
      await shot(page, `${base}-04-maps`);
      // close
      const close = page.locator(".mapdrawer .linkbtn", { hasText: "Close" }).first();
      if (await close.count()) await close.click();
      else await mapsBtn.click();
      await page.waitForTimeout(200);
    }
  }

  // Capture DOM text samples for jargon audit on a dense child
  await goToday(page);
  await openChildFromToday(page, "Ari Mercado");
  const textDump = await page.evaluate(() => {
    const main = document.querySelector("main.main")?.innerText ?? document.body.innerText;
    const sidebar = document.querySelector(".sidebar")?.innerText ?? "";
    const rail = document.querySelector(".railcol")?.innerText ?? "";
    const action = document.querySelector(".actionline, .aline")?.innerText ?? "";
    const strip = document.querySelector(".wbstrip")?.innerText ?? "";
    return { main: main.slice(0, 6000), sidebar: sidebar.slice(0, 2000), rail, action, strip };
  });
  console.log("--- TEXT DUMP Ari Interests ---");
  console.log(JSON.stringify(textDump, null, 2));

  await clickTab(page, /^Plan and access/);
  console.log("--- TEXT DUMP Ari Plan ---");
  console.log(
    JSON.stringify(
      await page.evaluate(() =>
        (document.querySelector("main.main")?.innerText ?? "").slice(0, 6000),
      ),
      null,
      2,
    ),
  );

  await clickTab(page, /^Family/);
  console.log("--- TEXT DUMP Ari Family ---");
  console.log(
    JSON.stringify(
      await page.evaluate(() =>
        (document.querySelector("main.main")?.innerText ?? "").slice(0, 6000),
      ),
      null,
      2,
    ),
  );

  // Empty-ish child text
  await goToday(page);
  await openChildFromToday(page, "Demo Child");
  console.log("--- TEXT DUMP Demo Interests ---");
  console.log(
    JSON.stringify(
      await page.evaluate(() =>
        (document.querySelector("main.main")?.innerText ?? "").slice(0, 4000),
      ),
      null,
      2,
    ),
  );

  await browser.close();
  console.log("done ->", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
