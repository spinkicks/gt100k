import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChurnBudgetMeter } from "../components/hud/ChurnBudgetMeter.js";
import { SYNTHETIC_CHURN_BUDGET, buildSyntheticCohortView } from "../components/synthetic-view.js";

function renderMeter(
  budget = SYNTHETIC_CHURN_BUDGET,
  cohorts = buildSyntheticCohortView().cohorts,
): string {
  return renderToStaticMarkup(createElement(ChurnBudgetMeter, { budget, cohorts }));
}

describe("the churn-budget meter", () => {
  it("renders the exact domain cap, used churn, remaining capacity, and current view delta", () => {
    const markup = renderMeter();

    expect(SYNTHETIC_CHURN_BUDGET).toEqual({
      weekKey: "2026-W30",
      cap: 4,
      used: 0,
      exceptions: [],
    });
    expect(markup).toContain('data-churn-meter="weekly-budget"');
    expect(markup).toContain('data-week-key="2026-W30"');
    expect(markup).toContain('data-base-cap="4"');
    expect(markup).toContain('data-used="0"');
    expect(markup).toContain('data-remaining="4"');
    expect(markup).toContain('data-current-delta="0"');
    expect(markup).toContain('role="meter"');
    expect(markup).toContain('aria-valuemin="0"');
    expect(markup).toContain('aria-valuemax="4"');
    expect(markup).toContain('aria-valuenow="0"');
    expect(markup).toContain("4 base cap");
    expect(markup).toContain("0 used");
    expect(markup).toContain("4 remaining");
    expect(markup).toContain("Current view change");
    expect(markup).toContain("0 members · display only");
  });

  it("keeps the view delta separate from the authoritative used and remaining budget", () => {
    const budget = { ...SYNTHETIC_CHURN_BUDGET, used: 1 };
    const view = buildSyntheticCohortView();
    const cohorts = view.cohorts.map((cohort, index) => ({
      ...cohort,
      churnDelta: index === 0 ? 2 : 0,
    }));
    const budgetBefore = JSON.stringify(budget);
    const cohortsBefore = JSON.stringify(cohorts);
    const markup = renderMeter(budget, cohorts);

    expect(markup).toContain('data-used="1"');
    expect(markup).toContain('data-remaining="3"');
    expect(markup).toContain('data-current-delta="2"');
    expect(markup).toContain('aria-valuenow="1"');
    expect(markup).toContain('style="width:25%"');
    expect(markup).toContain("2 members · display only");
    expect(JSON.stringify(budget)).toBe(budgetBefore);
    expect(JSON.stringify(cohorts)).toBe(cohortsBefore);
  });

  it("marks a recorded over-base exception without overfilling the meter", () => {
    const markup = renderMeter({
      ...SYNTHETIC_CHURN_BUDGET,
      used: 5,
      exceptions: [{ approvedBy: "synthetic-safety-owner", reason: "synthetic", delta: 1 }],
    });

    expect(markup).toContain('data-used="5"');
    expect(markup).toContain('data-remaining="0"');
    expect(markup).toContain('aria-valuenow="4"');
    expect(markup).toContain("5 of 4 membership changes used; 0 remaining");
    expect(markup).toContain("Recorded exception");
    expect(markup).not.toContain("Within base budget");
  });

  it("is state-equal in animated, reduced-motion, and plain presentations", () => {
    const animated = buildSyntheticCohortView();
    const reduced = buildSyntheticCohortView({ reducedMotion: true });
    const plain = buildSyntheticCohortView({ plain: true });

    expect(renderMeter(SYNTHETIC_CHURN_BUDGET, reduced.cohorts)).toBe(
      renderMeter(SYNTHETIC_CHURN_BUDGET, animated.cohorts),
    );
    expect(renderMeter(SYNTHETIC_CHURN_BUDGET, plain.cohorts)).toBe(
      renderMeter(SYNTHETIC_CHURN_BUDGET, animated.cohorts),
    );
  });

  it("integrates the shared budget and view cohorts with text and color-independent state", () => {
    const shellSource = readFileSync(
      new URL("../components/CohortArena.client.tsx", import.meta.url),
      "utf8",
    );
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    expect(shellSource).toContain("<ChurnBudgetMeter");
    expect(shellSource).toContain("budget={SYNTHETIC_CHURN_BUDGET}");
    expect(shellSource).toContain("cohorts={view.cohorts}");
    expect(css).toMatch(/\.churn-meter-fill\s*\{[\s\S]*?background:\s*var\(--churn\)/);
    expect(css).toMatch(/\.churn-meter-stats\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums/);
  });
});
