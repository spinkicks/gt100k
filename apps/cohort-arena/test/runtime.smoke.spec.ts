import { type Page, expect, test } from "@playwright/test";

interface CompiledState {
  readonly churn: readonly string[];
  readonly constraints: readonly string[];
  readonly floorReadouts: readonly string[];
  readonly ledgerItems: readonly string[];
  readonly roster: readonly string[];
}

async function compiledState(page: Page): Promise<CompiledState> {
  return {
    churn: await page
      .locator('[data-churn-meter="weekly-budget"]')
      .evaluateAll((meters) =>
        meters.map(
          (meter) =>
            `${meter.getAttribute("data-week-key")}:${meter.getAttribute("data-base-cap")}:${meter.getAttribute("data-used")}:${meter.getAttribute("data-remaining")}:${meter.getAttribute("data-current-delta")}`,
        ),
      ),
    constraints: await page
      .locator('[data-region="hud"] [data-constraint-state="satisfied"]')
      .allTextContents(),
    floorReadouts: await page
      .locator('[data-region="hud"] .cohort-floor-readout')
      .allTextContents(),
    ledgerItems: await page.getByRole("treeitem").allTextContents(),
    roster: await page
      .locator('[data-region="hud"] [data-member-ref]')
      .evaluateAll((members) =>
        members.map(
          (member) =>
            `${member.getAttribute("data-member-ref")}:${member.getAttribute("data-role")}`,
        ),
      ),
  };
}

test("mounts and disposes WebGL while preserving the seeded view in the reduced-motion tier", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => runtimeErrors.push(`page: ${error.message}`));

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "networkidle" });

  const scene = page.locator('[data-region="scene-3d"]');
  const canvas = scene.locator("canvas");
  await expect(scene).toBeVisible();
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("aria-hidden", "true");

  const canvasHandle = await canvas.elementHandle();
  expect(canvasHandle).not.toBeNull();
  const initialContext = await canvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext("webgl2");
    return { available: context !== null, lost: context?.isContextLost() ?? true };
  });
  expect(initialContext).toEqual({ available: true, lost: false });

  const ledger = page.getByRole("tree", { name: "Compiled cohort details" });
  await expect(ledger).toBeVisible();
  await ledger.focus();
  await expect(ledger).toBeFocused();
  await expect(page.getByRole("treeitem")).toHaveCount(28);

  const standingsToggle = page.getByRole("button", { name: "Standings off" });
  const standingsPanel = page.locator('[data-standings-panel="own-growth"]');
  await expect(standingsToggle).toHaveAttribute("aria-pressed", "false");
  await expect(standingsPanel).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Growth standing" })).toHaveCount(0);

  const before = await compiledState(page);
  expect(before.churn).toEqual(["2026-W30:4:0:4:2"]);
  await expect(page.getByRole("meter", { name: "Weekly churn used" })).toHaveAttribute(
    "aria-valuetext",
    "0 of 4 membership changes used; 4 remaining",
  );
  await expect(page.locator('[data-churn-meter="weekly-budget"]')).toContainText(
    "2 members · display only",
  );
  expect(before.roster).toHaveLength(12);
  expect(before.roster).toContain("A7:scribe");
  expect(before.roster).not.toContain("A6:scribe");
  expect(before.constraints).toHaveLength(14);
  expect(before.floorReadouts).toEqual([
    "◎Non-harm floor 0.825 ≥ 0.5",
    "◎Non-harm floor 0.825 ≥ 0.5",
  ]);

  await standingsToggle.click();
  await expect(page.getByRole("button", { name: "Standings on" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(standingsPanel).toBeVisible();
  await expect(standingsPanel).toContainText("Your own gain this sprint");
  await expect(standingsPanel).toContainText("40 to the near-peer band top");
  await expect(page.getByRole("heading", { name: "Growth standing" })).toBeVisible();
  await expect(page.locator("#ledger-standings-state")).toContainText(
    "Own gain 300; 40 to the near-peer band top.",
  );
  expect(await compiledState(page)).toEqual(before);

  await page.getByRole("button", { name: "Standings on" }).click();
  await expect(standingsToggle).toHaveAttribute("aria-pressed", "false");
  await expect(standingsPanel).toHaveCount(0);
  await expect(page.locator("#ledger-standings-state")).toHaveCount(0);
  expect(await compiledState(page)).toEqual(before);

  const rollback = page.locator('[data-motion-kind="rollback"]');
  const ledgerAnnouncement = page.locator('[data-region="ledger"] output');
  await expect(rollback).toHaveAttribute("aria-pressed", "false");
  await expect(rollback).toHaveAttribute("data-motion-duration", "600");
  await expect(rollback).toHaveAccessibleName("Preview rollback to asg-view-v1");
  await expect(ledgerAnnouncement).toHaveText("Assignment changed — removed:[A6]; added:[A7].");

  await rollback.click();
  await expect(rollback).toHaveAttribute("aria-pressed", "true");
  await expect(rollback).toHaveAccessibleName("Return to current snapshot asg-view-v2");
  await expect(page.getByRole("heading", { name: "Prior snapshot settled" })).toBeVisible();
  await expect(ledgerAnnouncement).toHaveText("Assignment changed — removed:[A7]; added:[A6].");
  const prior = await compiledState(page);
  expect(prior.churn).toEqual(before.churn);
  expect(prior.constraints).toEqual(before.constraints);
  expect(prior.floorReadouts).toEqual(before.floorReadouts);
  expect(prior.roster).toContain("A6:scribe");
  expect(prior.roster).not.toContain("A7:scribe");

  await rollback.click();
  await rollback.click();
  await rollback.click();
  await expect(rollback).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("heading", { name: "Current snapshot settled" })).toBeVisible();
  await expect(ledgerAnnouncement).toHaveText("Assignment changed — removed:[A6]; added:[A7].");
  expect(await compiledState(page)).toEqual(before);

  await page.getByRole("button", { name: "Plain mode off" }).click();

  const tier2D = page.locator('[data-region="tier-2d"]');
  await expect(tier2D).toBeVisible();
  await expect(tier2D).toHaveAttribute("data-static-reason", "plain");
  await expect(page.locator('[data-region="scene-3d"] canvas')).toHaveCount(0);
  await expect(tier2D.locator('[data-learner-state="assigned"]')).toHaveCount(12);
  await expect(tier2D.locator('[data-cohort-formation="settled"]')).toHaveCount(2);
  await expect(tier2D.locator('[data-constraint-state="satisfied"]')).toHaveCount(14);
  await expect(tier2D).toContainText("Static compiled state. 2 cohorts and 12 assigned learners.");
  expect(await compiledState(page)).toEqual(before);

  await expect
    .poll(
      async () =>
        canvasHandle?.evaluate(
          (element) =>
            (element as HTMLCanvasElement).getContext("webgl2")?.isContextLost() ?? false,
        ),
      { message: "react-three-fiber should release the WebGL context when the canvas unmounts" },
    )
    .toBe(true);

  await page.getByRole("button", { name: "Plain mode on" }).click();
  await expect(page.locator('[data-region="scene-3d"] canvas')).toBeVisible();
  await expect(ledger).toBeVisible();
  expect(await compiledState(page)).toEqual(before);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  await expect(tier2D).toBeVisible();
  await expect(tier2D).toHaveAttribute("data-static-reason", "reduced-motion");
  await expect(page.locator('[data-region="scene-3d"] canvas')).toHaveCount(0);
  expect(await compiledState(page)).toEqual(before);
  expect(runtimeErrors).toEqual([]);
});

test("keeps standings, churn, and rollback fully operable across reduced and plain modes", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => runtimeErrors.push(`page: ${error.message}`));

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });

  const tier2D = page.locator('[data-region="tier-2d"]');
  const churnMeter = page.locator('[data-churn-meter="weekly-budget"]');
  const rollback = page.locator('[data-motion-kind="rollback"]');
  const standingsPanel = page.locator('[data-standings-panel="own-growth"]');
  const ledgerAnnouncement = page.locator('[data-region="ledger"] output');
  const plainMode = page.getByRole("button", { name: "Plain mode off" });

  await expect(tier2D).toHaveAttribute("data-static-reason", "reduced-motion");
  await expect(rollback).toHaveAttribute("data-motion-duration", "0");
  await expect(rollback).toHaveAttribute("data-motion-mode", "reduced");
  await expect(plainMode).toBeVisible();

  const initialChurn = await churnMeter.evaluate((meter) => meter.outerHTML);
  await page.getByRole("button", { name: "Standings off" }).click();

  await expect(standingsPanel).toBeVisible();
  await expect(standingsPanel).toHaveAttribute("data-motion-mode", "reduced");
  await expect(standingsPanel).toHaveAttribute("data-bar-duration-ms", "0");
  await expect(standingsPanel).toHaveAttribute("data-celebrate-duration-ms", "0");
  await expect(standingsPanel.locator(".standings-value")).toContainText("300 points");
  await expect(page.locator("#ledger-standings-state")).toContainText(
    "Own gain 300; 40 to the near-peer band top.",
  );
  const reducedBarScale = await standingsPanel.locator(".standings-bar-fill").evaluate((bar) => {
    return new DOMMatrixReadOnly(getComputedStyle(bar).transform).a;
  });
  expect(reducedBarScale).toBeCloseTo(300 / 340, 5);
  expect(await churnMeter.evaluate((meter) => meter.outerHTML)).toBe(initialChurn);

  await rollback.click();
  await expect(rollback).toHaveAttribute("aria-pressed", "true");
  await expect(rollback).toHaveAttribute("data-motion-duration", "0");
  await expect(tier2D.locator('[data-learner-ref="A6"]')).toHaveAttribute(
    "data-learner-state",
    "assigned",
  );
  await expect(tier2D.locator('[data-learner-ref="A7"]')).toHaveAttribute(
    "data-learner-state",
    "unassigned",
  );
  await expect(ledgerAnnouncement).toHaveText("Assignment changed — removed:[A7]; added:[A6].");
  await expect(page.getByRole("button", { name: "Standings on" })).toBeVisible();
  expect(await churnMeter.evaluate((meter) => meter.outerHTML)).toBe(initialChurn);

  const reducedPrior = await compiledState(page);
  await plainMode.click();
  await expect(tier2D).toHaveAttribute("data-static-reason", "plain");
  await expect(rollback).toHaveAttribute("aria-pressed", "true");
  await expect(rollback).toHaveAttribute("data-motion-duration", "0");
  await expect(standingsPanel).toHaveAttribute("data-bar-duration-ms", "0");
  await expect(page.getByRole("button", { name: "Standings on" })).toBeVisible();
  expect(await compiledState(page)).toEqual(reducedPrior);
  expect(await churnMeter.evaluate((meter) => meter.outerHTML)).toBe(initialChurn);

  await page.getByRole("button", { name: "Plain mode on" }).click();
  await expect(tier2D).toHaveAttribute("data-static-reason", "reduced-motion");
  await expect(rollback).toHaveAttribute("aria-pressed", "true");
  await expect(standingsPanel.locator(".standings-value")).toContainText("300 points");
  expect(await compiledState(page)).toEqual(reducedPrior);

  await rollback.click();
  await expect(rollback).toHaveAttribute("aria-pressed", "false");
  await expect(rollback).toHaveAttribute("data-motion-duration", "0");
  await expect(ledgerAnnouncement).toHaveText("Assignment changed — removed:[A6]; added:[A7].");
  await expect(page.getByRole("button", { name: "Standings on" })).toBeVisible();
  expect(await churnMeter.evaluate((meter) => meter.outerHTML)).toBe(initialChurn);
  expect(runtimeErrors).toEqual([]);
});
