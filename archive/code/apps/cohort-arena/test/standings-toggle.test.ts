import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StandingsToggle } from "../components/StandingsToggle.js";
import { buildSyntheticCohortView } from "../components/synthetic-view.js";

describe("the standings preference control", () => {
  it("is default-off, accessible, and instant in both states", () => {
    const off = renderToStaticMarkup(
      createElement(StandingsToggle, {
        optedIn: false,
        reducedMotion: false,
        onToggle: () => undefined,
      }),
    );
    const on = renderToStaticMarkup(
      createElement(StandingsToggle, {
        optedIn: true,
        reducedMotion: true,
        onToggle: () => undefined,
      }),
    );
    const source = readFileSync(
      new URL("../components/StandingsToggle.tsx", import.meta.url),
      "utf8",
    );
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    expect(off).toContain('type="button"');
    expect(off).toContain('aria-pressed="false"');
    expect(off).toContain("Standings off");
    expect(on).toContain('aria-pressed="true"');
    expect(on).toContain("Standings on");
    expect(off).toContain('data-motion-kind="hudToggle"');
    expect(off).toContain('data-toggle-duration-ms="0"');
    expect(off).toContain('data-toggle-easing="linear"');
    expect(on).toContain('data-toggle-duration-ms="0"');
    expect(on).toContain('data-toggle-easing="linear"');
    expect(source).toContain('resolveMotion("hudToggle"');
    expect(source).toContain("whileTap={{ scale: 0.97 }}");
    expect(css).toMatch(/\.arena-view-controls button\s*\{[\s\S]*?min-height:\s*44px/);
  });

  it("changes only the opt-in standings and its Ledger projection", () => {
    const defaultView = buildSyntheticCohortView();
    const explicitOff = buildSyntheticCohortView({ standingsOptIn: false });
    const optedIn = buildSyntheticCohortView({ standingsOptIn: true });

    expect(JSON.stringify(explicitOff)).toBe(JSON.stringify(defaultView));
    expect(optedIn.standings).not.toBeNull();
    expect(optedIn.ledger.standingsText).toBe("Own gain 300; 40 to the near-peer band top.");
    expect({
      ...optedIn,
      standings: null,
      ledger: { ...optedIn.ledger, standingsText: null },
    }).toEqual(defaultView);
  });
});
