/**
 * UE049 — Playwright app smoke (SC-E12 / SC-E22).
 *
 * This is the live, real-browser acceptance for the Provenance Observatory. It is intentionally NOT part
 * of the vitest gate (vitest globs `test/**` only) and this directory is excluded from `tsconfig.json`,
 * because Playwright needs a real browser + GPU which the headless CI/loop environment does not provide
 * (`manual:` — see `.loop/progress.md`). Run it locally where a browser is available:
 *
 *   pnpm --filter @gt100k/evidence-explorer exec playwright install chromium
 *   pnpm --filter @gt100k/evidence-explorer build && pnpm --filter @gt100k/evidence-explorer start &
 *   pnpm --filter @gt100k/evidence-explorer exec playwright test e2e/smoke.spec.ts
 *
 * It asserts the SC-E12/E22 contract: `/` loads with zero console errors, the 3D canvas + DOM Ledger
 * mount, reduced-motion toggling works, Verify shows the seal and announces via `aria-live`, and with
 * WebGL disabled the app falls back to the calm-2D tier with no lost state.
 */
import { expect, test } from "@playwright/test";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

test.describe("Provenance Observatory smoke", () => {
  test("loads with zero console errors; 3D canvas + Ledger mount (SC-E12)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto(BASE, { waitUntil: "networkidle" });

    // The accessible Ledger is always present and focusable.
    const ledger = page.getByRole("tree");
    await expect(ledger).toBeVisible();
    await expect(ledger.getByRole("treeitem").first()).toBeVisible();

    // The 3D canvas mounts (it is aria-hidden — query the DOM element, not a role).
    await expect(page.locator("canvas")).toHaveCount(1, { timeout: 10_000 });
    // The canvas is decorative.
    await expect(page.locator("canvas")).toHaveAttribute("aria-hidden", "true");

    expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
  });

  test("reduced-motion override forces the calm-2D tier without losing state (SC-E03)", async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const before = await page.getByRole("treeitem").count();

    // Open the HUD "Display" drawer (progressive disclosure), then flip the reduced-motion radiogroup to "On".
    await page.getByRole("button", { name: /^Display$/ }).click();
    await page
      .getByRole("radiogroup", { name: /reduced motion/i })
      .getByRole("radio", { name: /^on$/i })
      .click();

    await expect(page.getByText(/Rendering:\s*Calm 2D/i)).toBeVisible();
    // No canvas in calm-2D; state (the Ledger) is intact.
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("treeitem")).toHaveCount(before);
  });

  test("Verify shows the seal and announces via aria-live (SC-E12)", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    await page.getByRole("button", { name: /^Verify/ }).click();
    await expect(page.getByText(/Verified/i).first()).toBeVisible();
    // The polite live region carries the finished announcement.
    const live = page.locator("[aria-live]");
    await expect(live.first()).toContainText(/verified/i, { timeout: 5_000 });
  });

  test("no WebGL → calm-2D fallback, no lost state, no console error (SC-E22)", async ({
    browser,
  }) => {
    // A context that reports WebGL unavailable (undefined getContext for webgl).
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(() => {
      const proto = HTMLCanvasElement.prototype as unknown as {
        getContext: (id: string) => unknown;
      };
      const orig = proto.getContext;
      proto.getContext = function patched(id: string) {
        if (id === "webgl" || id === "webgl2") return null;
        return orig.call(this, id);
      };
    });

    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(page.getByText(/Rendering:\s*Calm 2D/i)).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("tree")).toBeVisible();
    expect(errors).toEqual([]);

    await context.close();
  });
});
