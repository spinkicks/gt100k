import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CohortRosterHud } from "../components/hud/CohortRosterHud.js";
import { buildSyntheticCohortView } from "../components/synthetic-view.js";

function occurrences(value: string, token: string): number {
  return value.split(token).length - 1;
}

function withoutMotionMetadata(markup: string): string {
  return markup
    .replaceAll(/ data-motion-mode="[^"]+"/g, "")
    .replaceAll(/ data-layout-duration-ms="[^"]+"/g, "")
    .replaceAll(/ data-layout-easing="[^"]+"/g, "");
}

describe("the cohort roster HUD", () => {
  it("renders every accepted cohort member, role, constraint, and floor result", () => {
    const markup = renderToStaticMarkup(
      createElement(CohortRosterHud, {
        view: buildSyntheticCohortView(),
        reducedMotion: false,
      }),
    );

    expect(occurrences(markup, 'data-cohort-card="accepted"')).toBe(2);
    expect(occurrences(markup, "data-member-ref=")).toBe(12);
    expect(occurrences(markup, 'data-constraint-state="satisfied"')).toBe(14);
    expect(markup).toContain('data-member-ref="A1" data-role="anchor"');
    expect(markup).toContain('data-member-ref="A6" data-role="scribe"');
    expect(markup).toContain('data-member-ref="B3" data-role="builder"');
    expect(markup).toContain("Safeguarding separation");
    expect(markup).toContain("Individual non-harm floor");
    expect(markup).toContain("Churn budget");
    expect(markup).toContain("Non-harm floor 0.825 ≥ 0.5");
    expect(occurrences(markup, "Satisfied")).toBe(14);
  });

  it("derives FLIP and press behavior from the motion registry", () => {
    const animated = renderToStaticMarkup(
      createElement(CohortRosterHud, {
        view: buildSyntheticCohortView(),
        reducedMotion: false,
      }),
    );
    const reduced = renderToStaticMarkup(
      createElement(CohortRosterHud, {
        view: buildSyntheticCohortView(),
        reducedMotion: true,
      }),
    );
    const hudSource = readFileSync(
      new URL("../components/hud/CohortRosterHud.tsx", import.meta.url),
      "utf8",
    );
    const shellSource = readFileSync(
      new URL("../components/CohortArena.client.tsx", import.meta.url),
      "utf8",
    );
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    expect(animated).toContain('data-motion-kind="memberSwap"');
    expect(animated).toContain('data-motion-mode="animated"');
    expect(animated).toContain('data-layout-duration-ms="520"');
    expect(animated).toContain('data-layout-easing="move"');
    expect(reduced).toContain('data-motion-mode="reduced"');
    expect(reduced).toContain('data-layout-duration-ms="0"');
    expect(withoutMotionMetadata(reduced)).toBe(withoutMotionMetadata(animated));
    expect(hudSource).toContain('from "motion/react"');
    expect(hudSource).toMatch(/<motion\.article[\s\S]*?layout/);
    expect(hudSource).toMatch(/<motion\.li[\s\S]*?layout/);
    expect(hudSource).toContain('resolveMotion("memberSwap"');
    expect(shellSource).toContain("<CohortRosterHud");
    expect(shellSource).toContain("<motion.button");
    expect(shellSource).toContain("whileTap={{ scale: 0.97 }}");
    expect(shellSource).toContain('resolveMotion("press"');
    expect(css).toMatch(/\.arena-view-controls button\s*\{[\s\S]*?min-height:\s*44px/);
  });
});
