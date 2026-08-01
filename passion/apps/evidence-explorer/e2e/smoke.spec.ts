/**
 * UE049 — Playwright app smoke (SC-E12).
 *
 * This is the live, real-browser acceptance for the (now 2D-only) Evidence Explorer. It is
 * intentionally NOT part of the vitest gate (vitest globs `test/**` only) and this directory is
 * excluded from `tsconfig.json`, because Playwright needs a real browser which the headless CI/loop
 * environment does not provide (`manual:` — see `.loop/progress.md`). Run it locally where a browser
 * is available:
 *
 *   pnpm --filter @gt100k/evidence-explorer exec playwright install chromium
 *   pnpm --filter @gt100k/evidence-explorer build && pnpm --filter @gt100k/evidence-explorer start &
 *   pnpm --filter @gt100k/evidence-explorer exec playwright test e2e/smoke.spec.ts
 *
 * Phase 1 (clean-2D rebuild) retired the cinematic 3D render path and its render-tier machinery
 * (cosmos, `tierOverride`, the reduced-motion/no-WebGL calm-2D fallback) — there is now exactly one
 * render path, the calm 2D constellation, always mounted. This file asserts what remains of the
 * SC-E12 contract: `/` loads with zero console errors and the 2D graph (not a `<canvas>`) mounts, and
 * Verify — now a header button, not an always-open panel — shows the plain-language seal line and
 * announces via `aria-live`.
 */
import { expect, test } from "@playwright/test";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

test.describe("Evidence Explorer smoke", () => {
  test("loads with zero console errors; the 2D constellation mounts, no canvas (SC-E12)", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto(BASE, { waitUntil: "networkidle" });

    // The 2D constellation is the hero graph and the only render path — it is always mounted.
    await expect(page.locator("svg.constellation")).toBeVisible({ timeout: 10_000 });
    // There is no 3D canvas anywhere on the page — the render-tier machinery is gone.
    await expect(page.locator("canvas")).toHaveCount(0);

    expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
  });

  test("Verify (header button) shows the plain seal line and announces via aria-live (SC-E12)", async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    // Verify lives in the header now, not an always-open panel.
    await page.getByRole("button", { name: /^Verify/ }).click();
    // The plain-language line from `verifyLine(true)` — no jargon, no ceremony.
    await expect(
      page.getByText(/Verified — nothing here has changed since it was recorded\./i).first(),
    ).toBeVisible();
    // The polite live region carries the finished announcement.
    const live = page.locator("[aria-live]");
    await expect(live.first()).toContainText(/verified/i, { timeout: 5_000 });
  });
});

test.describe("Story Mode (Phase 2)", () => {
  test("plays through the git-log commit list and the end nudge opens Verify", async ({ page }) => {
    // Auto-advance is one beat per ~2.6s (STORY_STEP_MS) over 12 beats — a full run is ~31s.
    test.setTimeout(60_000);

    await page.goto(BASE, { waitUntil: "networkidle" });

    // The commit log is a real, accessible git-log-style list beside the graph — 12 beats for the
    // committed tiny-runner-v1 fixture, each a short hash + a plain message.
    await expect(page.locator("ol.commit-log")).toBeVisible();
    await expect(page.locator("li.commit-row")).toHaveCount(12);

    // The view opens fully grown (the calm baseline), so Play starts by replaying from the top —
    // the caption resets to the lead-in and then advances as the reveal counter ticks forward.
    await page.getByRole("button", { name: /Play the story/ }).click();
    await expect(page.locator(".story-caption")).not.toHaveText(
      /Press play to watch how this was built/,
      {
        timeout: 10_000,
      },
    );

    // Let the story run to full reveal — the closing nudge to Verify should appear.
    const nudge = page.locator(".story-nudge");
    await expect(nudge).toBeVisible({ timeout: 40_000 });

    // Its Verify CTA opens the same Verify panel as the header control.
    await nudge.getByRole("button", { name: /^Verify$/ }).click();
    await expect(page.locator("#verify-panel")).toBeVisible();
  });
});
