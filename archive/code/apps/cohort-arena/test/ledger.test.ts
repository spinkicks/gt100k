import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CohortLedger } from "../components/ledger/CohortLedger.js";
import { buildSyntheticCohortView } from "../components/synthetic-view.js";

function occurrences(value: string, token: string): number {
  return value.split(token).length - 1;
}

describe("the accessible Cohort Ledger", () => {
  it("renders every cohort state as a keyboard-focusable semantic tree", () => {
    const view = buildSyntheticCohortView();
    const markup = renderToStaticMarkup(createElement(CohortLedger, { ledger: view.ledger }));

    expect(markup).toContain('role="tree"');
    expect(markup).toContain('aria-label="Compiled cohort details"');
    expect(occurrences(markup, 'role="treeitem"')).toBe(28);
    expect(occurrences(markup, 'role="group"')).toBe(2);
    expect(occurrences(markup, 'tabindex="0"')).toBe(1);
    expect(markup).toContain('aria-activedescendant="ledger-cohort-1"');
    expect(markup).toContain('aria-describedby="ledger-keyboard-help"');
    expect(markup).toContain('data-ledger-active="true"');
    expect(markup).toContain('id="ledger-cohort-1-detail-1"');
    expect(occurrences(markup, 'aria-expanded="true"')).toBe(2);

    expect(markup).toContain("Cohort 1 — 6 members — non-harm floor 0.825 ≥ 0.5");
    expect(markup).toContain("A1 — anchor — assigned");
    expect(markup).toContain("A6 — scribe — assigned");
    expect(markup).toContain("individual-non-harm-floor — satisfied");
    expect(markup).toContain("churn-budget — satisfied");
    expect(occurrences(markup, 'data-ledger-state="satisfied"')).toBe(14);
  });

  it("describes the composite keyboard path and pairs every state with icon, shape, and text", () => {
    const view = buildSyntheticCohortView();
    const ledger = {
      ...view.ledger,
      cohortTree: [
        {
          label: "Unassigned bench",
          children: [{ label: "C1 — still compiling — unassigned" }, { label: "age — satisfied" }],
        },
      ],
      rivalryList: ["confidence low — prompts suppressed"],
      safeguardingAlert:
        "Optimization bypassed; 1 conflicting move paused for the safeguarding lane.",
    };
    const markup = renderToStaticMarkup(createElement(CohortLedger, { ledger }));

    expect(markup).toContain("Use Tab to reach the Ledger and Enter to expand or collapse");
    expect(markup).toContain("Arrow keys move through details; Escape returns to the cohort");
    expect(markup).toContain('data-ledger-state="unassigned"');
    expect(markup).toContain('data-state-icon="bench"');
    expect(markup).toContain('data-ledger-state="satisfied"');
    expect(markup).toContain('data-state-icon="check"');
    expect(markup).toContain('data-ledger-state="suppressed"');
    expect(markup).toContain('data-state-icon="veil"');
    expect(markup).toContain('data-ledger-state="paused"');
    expect(markup).toContain('data-state-icon="shield"');
    expect(markup).toContain("still compiling — unassigned");
    expect(markup).toContain("prompts suppressed");
    expect(markup).toContain("conflicting move paused");
  });

  it("announces the compiled state and keeps the WebGL canvas hidden from assistive tech", () => {
    const view = buildSyntheticCohortView();
    const markup = renderToStaticMarkup(createElement(CohortLedger, { ledger: view.ledger }));
    const shellSource = readFileSync(
      new URL("../components/CohortArena.client.tsx", import.meta.url),
      "utf8",
    );

    expect(markup).toContain("<output");
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-atomic="true"');
    expect(markup).toContain("Compiled 2 cohorts with 12 assigned learners.");
    expect(shellSource).toMatch(/<Canvas[\s\S]*?aria-hidden="true"/);
  });
});
