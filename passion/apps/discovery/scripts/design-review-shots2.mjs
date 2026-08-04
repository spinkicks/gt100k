import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(import.meta.dirname, "../.design-review");
mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: false });
  console.log("wrote", path);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // Discovery: find a tile with a play button + open game
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto("http://127.0.0.1:3090", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    // age 10, names off default
    const tiles = page.locator(".tile");
    const n = await tiles.count();
    let found = false;
    for (let i = 0; i < n; i++) {
      await tiles.nth(i).click();
      await page.waitForTimeout(80);
      if (await page.locator(".play").count()) {
        found = true;
        const label = await page.locator(".panel__title").textContent();
        console.log("found play on", label);
        await shot(page, "discovery-desktop-with-play.png");
        // measure play button
        const m = await page.evaluate(() => {
          const play = document.querySelector(".play");
          const r = play.getBoundingClientRect();
          const blurb = document.querySelector(".panel__blurb");
          return {
            play: {
              w: Math.round(r.width),
              h: Math.round(r.height),
              text: play.textContent.trim(),
            },
            blurb: blurb?.textContent,
            title: document.querySelector(".panel__title")?.textContent,
            panelScrollH: document.querySelector(".panel")?.scrollHeight,
            panelClientH: document.querySelector(".panel")?.clientHeight,
          };
        });
        console.log("PLAY PANEL", JSON.stringify(m, null, 2));
        await page.locator(".play").first().click();
        await page.waitForTimeout(1200);
        await shot(page, "discovery-desktop-game.png");
        // measure game chrome
        const gm = await page.evaluate(() => {
          const ov = document.querySelector(".gadget-overlay");
          const panel = document.querySelector(".gadget-overlay-panel");
          const exit = document.querySelector(".gadget-overlay-panel button");
          const tiny = [];
          panel?.querySelectorAll("*").forEach((el) => {
            const fs = Number.parseFloat(getComputedStyle(el).fontSize);
            if (fs && fs < 14 && (el.textContent || "").trim()) {
              tiny.push({
                class: String(el.className).slice(0, 50),
                fs,
                text: el.textContent.trim().slice(0, 40),
              });
            }
          });
          return {
            overlay: !!ov,
            panel: panel
              ? {
                  w: Math.round(panel.getBoundingClientRect().width),
                  h: Math.round(panel.getBoundingClientRect().height),
                }
              : null,
            exit: exit
              ? {
                  text: exit.textContent.trim(),
                  h: Math.round(exit.getBoundingClientRect().height),
                  w: Math.round(exit.getBoundingClientRect().width),
                }
              : null,
            tiny: tiny.slice(0, 20),
          };
        });
        console.log("GAME", JSON.stringify(gm, null, 2));
        // mobile game
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(500);
        await shot(page, "discovery-mobile-game.png");
        break;
      }
    }
    if (!found) console.log("NO PLAY BUTTON FOUND");
    await page.close();
  }

  // Discovery mobile age 10 default names off - empty + scroll issues
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto("http://127.0.0.1:3090", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await shot(page, "discovery-mobile-age10.png");
    const info = await page.evaluate(() => {
      const tiles = [...document.querySelectorAll(".tile")];
      const first = tiles[0]?.getBoundingClientRect();
      const grid = document.querySelector(".browse__grid")?.getBoundingClientRect();
      const bar = document.querySelector(".browse__bar")?.getBoundingClientRect();
      const labelsHidden = getComputedStyle(document.querySelector(".tile__label")).opacity;
      return {
        tileCount: tiles.length,
        firstTile: first ? { w: Math.round(first.width), h: Math.round(first.height) } : null,
        gridH: Math.round(grid?.height || 0),
        barH: Math.round(bar?.height || 0),
        namesOpacity: labelsHidden,
        bodyH: document.body.scrollHeight,
        ledeDisplay: getComputedStyle(document.querySelector(".browse__lede")).display,
      };
    });
    console.log("MOBILE AGE10", JSON.stringify(info, null, 2));
    await page.close();
  }

  // Studio: close showtime properly, cartoon theme, mobile, empty project, interview styles
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto("http://127.0.0.1:3011", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // empty project
    await page.locator(".projcard").filter({ hasText: "Robot" }).click();
    await page.waitForTimeout(300);
    await shot(page, "studio-desktop-empty-project.png");
    const empty = await page.evaluate(() => ({
      empty: document.querySelector(".log__empty")?.textContent,
      kindCount: document.querySelectorAll(".kindbtn").length,
      kindHeights: [...document.querySelectorAll(".kindbtn")]
        .slice(0, 3)
        .map((b) => Math.round(b.getBoundingClientRect().height)),
      askSurface: getComputedStyle(document.querySelector(".ask")).backgroundColor,
      interviewBg: getComputedStyle(document.querySelector(".interview") || document.body)
        .backgroundColor,
    }));
    console.log("EMPTY PROJECT", JSON.stringify(empty, null, 2));

    // reopen arcade, open showtime, close via button
    await page.locator(".projcard").first().click();
    await page.waitForTimeout(200);
    await page.locator(".btn--show").click();
    await page.waitForTimeout(200);
    // Does Escape work without focus?
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    const stillOpen = await page.locator(".modal").count();
    console.log("ESCAPE CLOSED MODAL?", stillOpen === 0);
    if (stillOpen) {
      await page.locator(".modal .btn").click();
      await page.waitForTimeout(200);
    }

    // cartoon
    await page.locator(".themebtn").click();
    await page.waitForTimeout(150);
    await page.locator(".swatch").filter({ hasText: "Sunbeam" }).click();
    await page.waitForTimeout(400);
    await shot(page, "studio-desktop-cartoon.png");

    // tech terminal
    await page.locator(".themebtn").click();
    await page.waitForTimeout(150);
    await page.locator(".swatch").filter({ hasText: "Terminal" }).click();
    await page.waitForTimeout(400);
    await shot(page, "studio-desktop-tech.png");

    // back to gt
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "gt-school"));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await shot(page, "studio-mobile-top.png");
    const mob = await page.evaluate(() => {
      const top = document.querySelector(".topbar")?.getBoundingClientRect();
      const theme = document.querySelector(".themebtn")?.getBoundingClientRect();
      const home = document.querySelector(".homelink")?.getBoundingClientRect();
      const brand = document.querySelector(".brand__title")?.getBoundingClientRect();
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      return {
        topH: Math.round(top?.height || 0),
        theme: theme
          ? { x: Math.round(theme.x), w: Math.round(theme.width), h: Math.round(theme.height) }
          : null,
        home: home
          ? { x: Math.round(home.x), w: Math.round(home.width), right: Math.round(home.right) }
          : null,
        brand: brand
          ? {
              w: Math.round(brand.width),
              h: Math.round(brand.height),
              text: document.querySelector(".brand__title").textContent,
            }
          : null,
        overflowX: overflow,
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        // kindbtn sizes
        kinds: [...document.querySelectorAll(".kindbtn")].map((b) => ({
          t: b.textContent.trim(),
          h: Math.round(b.getBoundingClientRect().height),
          w: Math.round(b.getBoundingClientRect().width),
          fs: getComputedStyle(b).fontSize,
        })),
      };
    });
    console.log("STUDIO MOBILE", JSON.stringify(mob, null, 2));
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(200);
    await shot(page, "studio-mobile-composer.png");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
    await shot(page, "studio-mobile-bottom.png");

    // interview panel broken tokens - inject one
    await page.evaluate(() => {
      const q = document.createElement("section");
      q.className = "interview";
      q.innerHTML = `<p class="interview__q">How did you decide that the paddle should bounce?</p>
        <textarea class="interview__in" rows="3" placeholder="However you'd say it out loud."></textarea>
        <div class="interview__row"><button class="btn btn--add">Send</button><button class="btn btn--interview-skip">Not now</button></div>`;
      document.querySelector(".composer")?.after(q);
    });
    await page.evaluate(() =>
      document.querySelector(".interview")?.scrollIntoView({ block: "center" }),
    );
    await page.waitForTimeout(200);
    await shot(page, "studio-mobile-interview.png");
    const iv = await page.evaluate(() => {
      const el = document.querySelector(".interview");
      const cs = getComputedStyle(el);
      const inp = getComputedStyle(document.querySelector(".interview__in"));
      return {
        bg: cs.backgroundColor,
        border: cs.border,
        borderLeft: cs.borderLeft,
        pad: cs.padding,
        inputFs: inp.fontSize,
        inputBg: inp.backgroundColor,
        inputMinH: Math.round(
          document.querySelector(".interview__in").getBoundingClientRect().height,
        ),
        sendH: Math.round(
          document.querySelector(".interview .btn--add").getBoundingClientRect().height,
        ),
        skipH: Math.round(
          document.querySelector(".btn--interview-skip").getBoundingClientRect().height,
        ),
      };
    });
    console.log("INTERVIEW STYLES", JSON.stringify(iv, null, 2));

    await page.close();
  }

  await browser.close();
  console.log("done");
}

await main();
