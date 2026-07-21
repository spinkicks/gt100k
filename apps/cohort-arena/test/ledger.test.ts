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
    expect(occurrences(markup, 'aria-expanded="true"')).toBe(2);

    expect(markup).toContain("Cohort 1 — 6 members — non-harm floor 0.825 ≥ 0.5");
    expect(markup).toContain("A1 — anchor — assigned");
    expect(markup).toContain("A6 — scribe — assigned");
    expect(markup).toContain("individual-non-harm-floor — satisfied");
    expect(markup).toContain("churn-budget — satisfied");
    expect(occurrences(markup, 'data-ledger-state="satisfied"')).toBe(14);
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
