import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(import.meta.dirname, "../.parent-ux-review");
mkdirSync(OUT, { recursive: true });

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

async function shot(page, name, { fullPage = false } = {}) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage });
  console.log("wrote", path);
}

async function measureTypography(page) {
  return page.evaluate(() => {
    const tiny = [];
    const longLines = [];
    document
      .querySelectorAll("p, li, .lede, .kicker, .toc__link, .cite, label, .role__blurb")
      .forEach((el) => {
        const text = (el.textContent || "").trim();
        if (!text) return;
        const cs = getComputedStyle(el);
        const fs = Number.parseFloat(cs.fontSize);
        if (fs && fs < 14) {
          tiny.push({
            tag: el.tagName,
            class: (el.className?.toString?.() || "").slice(0, 50),
            fs: Math.round(fs * 100) / 100,
            text: text.slice(0, 70),
          });
        }
        // approximate chars-per-line via measure width / avg char width
        const r = el.getBoundingClientRect();
        if (r.width > 40 && (el.tagName === "P" || el.classList.contains("lede"))) {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          const sample = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
          const avg = ctx.measureText(sample).width / sample.length;
          const cpl = Math.round(r.width / avg);
          if (cpl > 75) {
            longLines.push({
              class: (el.className?.toString?.() || "").slice(0, 40),
              cpl,
              fs: Math.round(fs * 100) / 100,
              w: Math.round(r.width),
              text: text.slice(0, 60),
            });
          }
        }
      });
    // unique tiny by class+fs
    const seen = new Set();
    const tinyU = [];
    for (const t of tiny) {
      const k = `${t.class}|${t.fs}`;
      if (seen.has(k)) continue;
      seen.add(k);
      tinyU.push(t);
    }
    return {
      bodyFontSize: getComputedStyle(document.body).fontSize,
      measureMax: getComputedStyle(document.querySelector(".main") || document.body).maxWidth,
      tinyUnder14: tinyU.slice(0, 30),
      linesOver75ch: longLines.slice(0, 20),
      title: document.title,
      h1: document.querySelector("h1")?.textContent?.trim(),
      headerLinks: [...document.querySelectorAll(".plh__link, .plh__home")].map((a) => ({
        text: a.textContent.trim().replace(/\s+/g, " "),
        href: a.getAttribute("href"),
      })),
      roles: [...document.querySelectorAll(".role, .role--off")].map((el) => ({
        text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 120),
        href: el.closest("a")?.getAttribute("href") || null,
        off: el.classList.contains("role--off"),
      })),
    };
  });
}

async function homeShots(browser) {
  for (const [label, vp] of [
    ["home-1280x800.png", DESKTOP],
    ["home-390x844.png", MOBILE],
  ]) {
    const context = await browser.newContext({ viewport: vp });
    const page = await context.newPage();
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await shot(page, label);
    if (label.startsWith("home-1280")) {
      const m = await measureTypography(page);
      console.log("HOME_MEASURE", JSON.stringify(m, null, 2));
    }
    await context.close();
  }
}

async function parentShots(browser) {
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  await page.goto("http://localhost:3055/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const m = await measureTypography(page);
  console.log("PARENT_MEASURE", JSON.stringify(m, null, 2));

  await shot(page, "parent-top-1280x800.png");

  // Scroll and capture sections
  const sections = await page.evaluate(() =>
    [...document.querySelectorAll("section[id]")].map((s) => ({
      id: s.id,
      top: s.getBoundingClientRect().top + window.scrollY,
    })),
  );

  for (const s of sections) {
    await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 80)), s.top);
    await page.waitForTimeout(200);
    await shot(page, `parent-section-${s.id}.png`);
  }

  // Full page
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await shot(page, "parent-fullpage.png", { fullPage: true });

  // Mobile viewport top + checkin
  await context.close();
  const mobile = await browser.newContext({ viewport: MOBILE });
  const mpage = await mobile.newPage();
  await mpage.goto("http://localhost:3055/", { waitUntil: "networkidle" });
  await mpage.waitForTimeout(400);
  await shot(mpage, "parent-top-390x844.png");
  const checkin = await mpage.$("#checkin");
  if (checkin) {
    await checkin.scrollIntoViewIfNeeded();
    await mpage.waitForTimeout(200);
    await shot(mpage, "parent-checkin-390x844.png");
  }
  await mobile.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await homeShots(browser);
  await parentShots(browser);
} finally {
  await browser.close();
}
console.log("done ->", OUT);
