import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(import.meta.dirname, "../.design-review");
mkdirSync(OUT, { recursive: true });

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

async function shot(page, name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: false });
  console.log("wrote", path);
}

async function measure(page, selectors) {
  return page.evaluate((sels) => {
    const out = {};
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (!el) {
        out[sel] = null;
        continue;
      }
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      out[sel] = {
        w: Math.round(r.width),
        h: Math.round(r.height),
        fontSize: cs.fontSize,
        color: cs.color,
        bg: cs.backgroundColor,
        lineHeight: cs.lineHeight,
        overflow: cs.overflow,
        text: (el.textContent || "").trim().slice(0, 80),
      };
    }
    // label font from first tile
    const label = document.querySelector(".tile__label");
    if (label) {
      out[".tile__label"] = {
        fontSize: getComputedStyle(label).fontSize,
        opacity: getComputedStyle(label).opacity,
        h: Math.round(label.getBoundingClientRect().height),
      };
    }
    const tile = document.querySelector(".tile");
    if (tile) {
      const r = tile.getBoundingClientRect();
      out[".tile"] = { w: Math.round(r.width), h: Math.round(r.height) };
    }
    // count tiny fonts
    const tiny = [];
    document.querySelectorAll("*").forEach((el) => {
      if (el.children.length > 0 && !(el.textContent || "").trim()) return;
      const fs = Number.parseFloat(getComputedStyle(el).fontSize);
      if (fs && fs < 14 && (el.textContent || "").trim().length > 0) {
        tiny.push({
          tag: el.tagName,
          class: el.className?.toString?.().slice(0, 60),
          fs,
          text: (el.textContent || "").trim().slice(0, 50),
        });
      }
    });
    out._tinySample = tiny.slice(0, 40);
    out._scroll = {
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      bodyOverflowX: getComputedStyle(document.body).overflowX,
    };
    return out;
  }, selectors);
}

async function discovery() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3090", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "discovery-desktop-empty.png");
  console.log(
    "DISCOVERY DESKTOP EMPTY",
    JSON.stringify(
      await measure(page, [
        ".browse__lede",
        ".chip",
        ".browse__pick select",
        ".browse__age select",
        ".prompt__lead",
        ".prompt__body",
        ".meter__count",
        ".meter__note",
        ".panel",
      ]),
      null,
      2,
    ),
  );

  // hover a tile
  const tile = page.locator(".tile").first();
  await tile.hover();
  await page.waitForTimeout(200);
  await shot(page, "discovery-desktop-hover.png");

  // click a tile that likely has a game - chess-ish or first with play
  await tile.click();
  await page.waitForTimeout(300);
  await shot(page, "discovery-desktop-selected.png");
  console.log(
    "DISCOVERY DESKTOP SELECTED",
    JSON.stringify(
      await measure(page, [
        ".panel__title",
        ".panel__blurb",
        ".play",
        ".row",
        ".judge__lead",
        ".judge__meta",
        ".judge__who",
        ".tile__label",
      ]),
      null,
      2,
    ),
  );

  // try open a game if play exists
  const play = page.locator(".play").first();
  if (await play.count()) {
    await play.click();
    await page.waitForTimeout(900);
    await shot(page, "discovery-desktop-game.png");
    // close if possible
    const back = page
      .locator("button")
      .filter({ hasText: /back|close|exit|leave/i })
      .first();
    if (await back.count()) await back.click().catch(() => {});
    else await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(400);
  }

  // names on + age 6
  await page.locator(".browse__age select").selectOption("6");
  await page.waitForTimeout(400);
  await shot(page, "discovery-desktop-age6-names.png");
  console.log(
    "DISCOVERY AGE6",
    JSON.stringify(await measure(page, [".tile__label", ".meter__count", ".chip"]), null, 2),
  );

  // mobile
  await page.setViewportSize(MOBILE);
  await page.waitForTimeout(600);
  await shot(page, "discovery-mobile-top.png");
  console.log(
    "DISCOVERY MOBILE TOP",
    JSON.stringify(
      await measure(page, [
        ".browse__bar",
        ".browse__view",
        ".chip",
        ".browse__pick select",
        ".browse__age select",
        ".tile",
        ".tile__label",
      ]),
      null,
      2,
    ),
  );
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await shot(page, "discovery-mobile-bottom.png");

  // mid scroll with panel
  await page.evaluate(() => {
    const panel = document.querySelector(".panel");
    if (panel) panel.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(300);
  await shot(page, "discovery-mobile-panel.png");

  await browser.close();
}

async function studio() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3011", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "studio-desktop-default.png");
  console.log(
    "STUDIO DESKTOP",
    JSON.stringify(
      await measure(page, [
        ".brand__title",
        ".brand__sub",
        ".themebtn",
        ".homelink",
        ".projlist__label",
        ".projcard",
        ".projcard__meta",
        ".hero__title",
        ".hero__q",
        ".chip",
        ".kindbtn",
        ".composer__title",
        ".btn--add",
        ".btn--show",
        ".ask__title",
        ".ask__lede",
        ".mascot__bubble",
        ".mini",
        ".themepop__label",
      ]),
      null,
      2,
    ),
  );

  // open theme picker
  await page.locator(".themebtn").click();
  await page.waitForTimeout(200);
  await shot(page, "studio-desktop-themes.png");
  console.log(
    "STUDIO THEME POP",
    JSON.stringify(
      await measure(page, [".themepop", ".themepop__label", ".swatch", ".swatch__name"]),
      null,
      2,
    ),
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  // click first project if any
  const card = page.locator(".projcard").first();
  if (await card.count()) {
    await card.click();
    await page.waitForTimeout(300);
    await shot(page, "studio-desktop-quest.png");
  }

  // showcase
  const show = page.locator(".btn--show").first();
  if (await show.count()) {
    await show.click();
    await page.waitForTimeout(300);
    await shot(page, "studio-desktop-showtime.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }

  // cartoon theme for contrast
  await page.locator(".themebtn").click();
  await page.waitForTimeout(150);
  const sun = page.locator(".swatch[aria-checked], .swatch").filter({ hasText: "Sunbeam" }).first();
  if (await sun.count()) {
    await sun.click();
    await page.waitForTimeout(400);
    await shot(page, "studio-desktop-cartoon.png");
  }

  // mobile
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "gt-school");
  });
  await page.setViewportSize(MOBILE);
  await page.waitForTimeout(500);
  await shot(page, "studio-mobile-top.png");
  console.log(
    "STUDIO MOBILE",
    JSON.stringify(
      await measure(page, [
        ".topbar",
        ".brand__title",
        ".themebtn",
        ".homelink",
        ".kindbtn",
        ".composer__row",
        ".btn--add",
        ".ask__form",
        ".projcard",
      ]),
      null,
      2,
    ),
  );
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(250);
  await shot(page, "studio-mobile-mid.png");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(250);
  await shot(page, "studio-mobile-bottom.png");

  await browser.close();
}

await discovery();
await studio();
console.log("done");
