import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { plainViewEquals } from "@gt100k/cohort-arena-view";

import { buildSyntheticCohortView } from "../components/synthetic-view.js";
import { CohortTier2D } from "../components/tier2d/CohortTier2D.js";
import { resolveTier2DMode } from "../components/tier2d/mode.js";

function occurrences(value: string, token: string): number {
  return value.split(token).length - 1;
}

describe("the equal 2D cohort tier", () => {
  it("resolves system, environment, and plain-mode preferences conservatively", () => {
    expect(
      resolveTier2DMode({
        configuredDefault: undefined,
        systemReducedMotion: true,
        plainMode: false,
      }),
    ).toEqual({ active: true, reason: "reduced-motion" });
    expect(
      resolveTier2DMode({
        configuredDefault: "system",
        systemReducedMotion: false,
        plainMode: false,
      }),
    ).toEqual({ active: false, reason: null });
    expect(
      resolveTier2DMode({
        configuredDefault: "on",
        systemReducedMotion: false,
        plainMode: false,
      }),
    ).toEqual({ active: true, reason: "reduced-motion" });
    expect(
      resolveTier2DMode({
        configuredDefault: "off",
        systemReducedMotion: true,
        plainMode: false,
      }),
    ).toEqual({ active: false, reason: null });
    expect(
      resolveTier2DMode({
        configuredDefault: "off",
        systemReducedMotion: true,
        plainMode: true,
      }),
    ).toEqual({ active: true, reason: "plain" });
    expect(
      resolveTier2DMode({
        configuredDefault: "unexpected",
        systemReducedMotion: true,
        plainMode: false,
      }),
    ).toEqual({ active: true, reason: "reduced-motion" });
  });

  it("renders the exact project2D positions with every compiled state and no motion", () => {
    const view = buildSyntheticCohortView();
    const markup = renderToStaticMarkup(
      createElement(CohortTier2D, { view, reason: "reduced-motion" }),
    );
    const source = readFileSync(
      new URL("../components/tier2d/CohortTier2D.tsx", import.meta.url),
      "utf8",
    );

    expect(markup).toContain('data-region="tier-2d"');
    expect(markup).toContain('data-static-reason="reduced-motion"');
    expect(markup).toContain('viewBox="0 0 1600 900"');
    expect(markup).toContain('data-learner-ref="A1" data-role="anchor" data-x="536" data-y="306"');
    expect(markup).toContain('data-learner-ref="B6" data-role="scribe" data-x="939" data-y="378"');
    expect(occurrences(markup, 'data-learner-state="assigned"')).toBe(12);
    expect(occurrences(markup, 'data-cohort-formation="settled"')).toBe(2);
    expect(occurrences(markup, 'data-constraint-state="satisfied"')).toBe(14);
    expect(markup).toContain("A1 — anchor — assigned");
    expect(markup).toContain("B6 — scribe — assigned");
    expect(markup).toContain("Non-harm floor 0.825 ≥ 0.5 — satisfied");
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain("Static compiled state. 2 cohorts and 12 assigned learners.");
    expect(source).not.toContain("motion/react");
    expect(source).not.toContain("<Canvas");
    expect(source).not.toMatch(/animate|transition/i);
  });

  it("keeps domain and presentation state identical across static modes", () => {
    const standard = buildSyntheticCohortView();
    const reduced = buildSyntheticCohortView({ reducedMotion: true });
    const plain = buildSyntheticCohortView({ plain: true });

    expect(plainViewEquals(standard, reduced)).toBe(true);
    expect(plainViewEquals(standard, plain)).toBe(true);
    expect(reduced.motion.compile.mode).toBe("reduced");
    expect(plain.presentation.plain).toBe(true);
  });

  it("wires the client preference hook and keeps the Ledger beside the selected tier", () => {
    const shellSource = readFileSync(
      new URL("../components/CohortArena.client.tsx", import.meta.url),
      "utf8",
    );

    expect(shellSource).toContain("useReducedMotion");
    expect(shellSource).toContain("NEXT_PUBLIC_REDUCED_MOTION_DEFAULT");
    expect(shellSource).toContain("resolveTier2DMode");
    expect(shellSource).toMatch(/tier2D\.active[\s\S]*?<CohortTier2D/);
    expect(shellSource).toMatch(/tier2D\.active[\s\S]*?<Canvas/);
    expect(shellSource).toContain("aria-pressed={plainMode}");
    expect(shellSource).toContain("<CohortLedger ledger={view.ledger}");
  });
});
