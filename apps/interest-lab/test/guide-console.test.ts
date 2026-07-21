import { readFileSync } from "node:fs";
import type { InterestLabView } from "@gt100k/interest-lab-view";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InterestLabSurface } from "../app/InterestLabClient";
import {
  EvidenceConstellation,
  shouldRenderEvidenceConstellation,
} from "../app/guide/EvidenceConstellation";
import { GuideConsole } from "../app/guide/GuideConsole";
import { resolveGuideMotion } from "../app/guide/motion";
import { buildSyntheticInterestLabSeed } from "../app/seed";

const FULL_CAPS = {
  webglAvailable: true,
  deviceMemoryGB: 16,
  hardwareConcurrency: 12,
  coarsePointer: false,
  saveData: false,
} as const;

const buildGuideView = (
  options: Readonly<{ reducedMotion?: boolean; webglAvailable?: boolean }> = {},
): InterestLabView =>
  buildSyntheticInterestLabSeed({
    surface: "guide",
    reducedMotion: options.reducedMotion ?? false,
    deviceCaps: {
      ...FULL_CAPS,
      webglAvailable: options.webglAvailable ?? true,
    },
  }).view;

describe("guide console", () => {
  it("renders equal supporting and disconfirming evidence columns without a scalar verdict", () => {
    const markup = renderToStaticMarkup(createElement(GuideConsole, { view: buildGuideView() }));

    expect(markup).toContain('data-guide-console="true"');
    expect(markup).toContain('class="explanation-pair"');
    expect(markup.match(/data-explanation-role="supporting"/g)).toHaveLength(1);
    expect(markup.match(/data-explanation-role="disconfirming"/g)).toHaveLength(1);
    expect(markup).toContain("Current evidence suggests");
    expect(markup).toContain("What else could explain this?");
    expect(markup).toContain("Evidence grade: Moderate");
    expect(markup).toContain("Novelty or tool access may explain part of the pattern.");
    expect(markup).not.toMatch(/passion score|score|confidence|verdict|you are (a|an|the) /i);
  });

  it("renders the return timeline with distinct voluntary, prompted, and care markers", () => {
    const markup = renderToStaticMarkup(createElement(GuideConsole, { view: buildGuideView() }));

    expect(markup).toContain('data-timeline-axis="0:30"');
    expect(markup.match(/data-timeline-marker="true"/g)).toHaveLength(10);
    expect(markup.match(/data-marker-kind="voluntary"/g)).toHaveLength(2);
    expect(markup.match(/data-marker-kind="prompted"/g)).toHaveLength(1);
    expect(markup.match(/data-marker-kind="support"/g)).toHaveLength(2);
    expect(markup.match(/data-timeline-lane="0"/g)).toHaveLength(3);
    expect(markup.match(/data-timeline-lane="1"/g)).toHaveLength(3);
    expect(markup.match(/data-timeline-lane="2"/g)).toHaveLength(2);
    expect(markup.match(/data-timeline-lane="3"/g)).toHaveLength(2);
    expect(markup).toContain('data-event-id="e1"');
    expect(markup).toContain("Day 7 · returned by choice · 7-day horizon");
    expect(markup).toContain("Day 30 · returned by choice · 30-day horizon");
    expect(markup).toContain("Day 7 · prompted return · reminder");
    expect(markup.match(/data-lowers-signal="false"/g)).toHaveLength(10);
    expect(markup).toContain("Accessibility or safety support; never lowers a signal");
  });

  it("shows the lifecycle gate, non-operative suggestion, guide-authoring affordance, and append rail", () => {
    const markup = renderToStaticMarkup(createElement(GuideConsole, { view: buildGuideView() }));

    expect(markup).toContain('data-current-lifecycle-state="EMERGING"');
    expect(markup.match(/data-lifecycle-track="main"/g)).toHaveLength(4);
    expect(markup.match(/data-lifecycle-track="branch"/g)).toHaveLength(3);
    expect(markup.match(/data-gate-family="/g)).toHaveLength(6);
    expect(markup.match(/data-gate-present="true"/g)).toHaveLength(6);
    expect(markup).toContain('data-proposal-operative="false"');
    expect(markup).toContain("Suggestion only");
    expect(markup).toContain("A guide authors the record.");
    expect(markup).toContain('data-guide-authoring="true"');
    expect(markup).toContain("Author an operative revision");
    expect(markup).toContain('name="guide-decision"');
    expect(markup).toContain('name="guide-rationale"');
    expect(markup).toContain('type="submit"');
    expect(markup.match(/data-revision-version="1"/g)).toHaveLength(2);
    expect(markup).toContain('data-revision-operative="false"');
    expect(markup.match(/data-revision-selector="true"/g)).toHaveLength(2);
    expect(markup).toContain('data-current-revision="true"');
    expect(markup).toContain("Recorded day 30");
    expect(markup).toContain('aria-label="Alternative lifecycle branch"');
  });

  it("authors the shadow suggestion through the domain and appends a selectable operative revision", () => {
    const view = buildSyntheticInterestLabSeed({
      surface: "guide",
      deviceCaps: FULL_CAPS,
      authoredReview: {
        decision: "accept the candidate proposal",
        rationale: "the full gate is visible and competing explanations remain recorded",
      },
    }).view;
    const markup = renderToStaticMarkup(createElement(GuideConsole, { view }));

    expect(view.guide.lifecycle.current).toBe("CANDIDATE_SPINE");
    expect(view.guide.lifecycle.proposal).toBeNull();
    expect(view.guide.revisionHistory.currentVersion).toBe(2);
    expect(view.guide.revisionHistory.versions).toHaveLength(3);
    expect(view.guide.revisionHistory.versions.map(({ operative }) => operative)).toEqual([
      true,
      false,
      true,
    ]);
    expect(markup.match(/data-revision-selector="true"/g)).toHaveLength(3);
    expect(markup).toContain('data-revision-version="2"');
    expect(markup).toContain("Guide-authored record");
    expect(markup).toContain("No shadow suggestion is awaiting a guide decision.");
  });

  it("uses the pinned guide tokens and removes their choreography under reduced motion", () => {
    expect(resolveGuideMotion("explanationsReveal", false)).toEqual({
      kind: "explanationsReveal",
      durationMs: 300,
      delayMs: 0,
      easing: "cubic-bezier(0.23,1,0.32,1)",
    });
    expect(resolveGuideMotion("timelineDraw", false)).toEqual({
      kind: "timelineDraw",
      durationMs: 700,
      delayMs: 0,
      easing: "cubic-bezier(0.77,0,0.175,1)",
    });
    expect(resolveGuideMotion("markerPop", false, 2)).toEqual({
      kind: "markerPop",
      durationMs: 260,
      delayMs: 80,
      easing: "cubic-bezier(0.34,1.56,0.64,1)",
    });
    expect(resolveGuideMotion("stateMorph", false)).toEqual({
      kind: "stateMorph",
      durationMs: 360,
      delayMs: 0,
      easing: "cubic-bezier(0.77,0,0.175,1)",
    });
    expect(resolveGuideMotion("gateCheck", false, 2)).toEqual({
      kind: "gateCheck",
      durationMs: 200,
      delayMs: 80,
      easing: "cubic-bezier(0.34,1.56,0.64,1)",
    });
    expect(resolveGuideMotion("markerPop", true, 2)).toEqual({
      kind: "markerPop",
      durationMs: 0,
      delayMs: 0,
      easing: "linear",
    });
  });

  it("keeps the constellation decorative and drops it for reduced motion or no WebGL", () => {
    const fullView = buildGuideView();
    const reducedView = buildGuideView({ reducedMotion: true });
    const noWebglView = buildGuideView({ webglAvailable: false });

    expect(shouldRenderEvidenceConstellation(fullView)).toBe(true);
    expect(shouldRenderEvidenceConstellation(reducedView)).toBe(false);
    expect(shouldRenderEvidenceConstellation(noWebglView)).toBe(false);

    const fullMarkup = renderToStaticMarkup(
      createElement(EvidenceConstellation, { view: fullView }),
    );
    const reducedMarkup = renderToStaticMarkup(
      createElement(EvidenceConstellation, { view: reducedView }),
    );
    expect(fullMarkup).toContain('data-evidence-constellation="depth"');
    expect(fullMarkup).toContain('aria-hidden="true"');
    expect(reducedMarkup).toBe("");

    const canvasSource = readFileSync(
      new URL("../app/guide/EvidenceConstellationCanvas.tsx", import.meta.url),
      "utf8",
    );
    expect(canvasSource).toMatch(/<Canvas[\s\S]*aria-hidden="true"/);
  });

  it("replaces the old guide placeholder with the composed console surface", () => {
    const view = buildGuideView();
    const markup = renderToStaticMarkup(createElement(InterestLabSurface, { view }));

    expect(view.surface).toBe("guide");
    expect(view.flags.surface).toBe("guide");
    expect(markup).toContain('data-guide-console="true"');
    expect(markup).toContain("Coverage field map");
    expect(markup).toContain("Evidence constellation");
    expect(markup).not.toContain("The guide console is not active");
  });

  it("uses responsive equal columns, visible recessed cues, and dashed suggestion styling", () => {
    const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.explanation-pair\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s,
    );
    expect(styles).toMatch(/\.timeline-marker--prompted\s*\{[^}]*border[^;]*dashed[^}]*opacity:/s);
    expect(styles).toMatch(
      /\.timeline-marker\s*\{[^}]*top:\s*calc\(3\.5rem \+ var\(--timeline-lane-offset\)\)[^}]*left:\s*clamp\(2rem,\s*var\(--timeline-position\),\s*calc\(100% - 10rem\)\)/s,
    );
    expect(styles).toMatch(/\.lifecycle-proposal\s*\{[^}]*border[^;]*dashed/s);
    expect(styles).toMatch(
      /@media \(max-width:\s*48rem\)[\s\S]*\.explanation-pair[\s\S]*grid-template-columns:\s*1fr/s,
    );
  });

  it("contains wide guide visuals without creating page-level overflow", () => {
    const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    expect(styles).toMatch(/\.quest-workspace\s*\{[^}]*min-width:\s*0/s);
    expect(styles).toMatch(/\.coverage-table-scroll\s*\{[^}]*overflow-x:\s*auto/s);
    expect(styles).toMatch(/\.timeline-scroll\s*\{[^}]*overflow-x:\s*auto/s);
    expect(styles).toMatch(
      /@media \(max-width:\s*48rem\)[\s\S]*\.explanation-column header\s*\{[^}]*flex-wrap:\s*wrap/s,
    );
    expect(styles).toMatch(
      /@media \(max-width:\s*48rem\)[\s\S]*\.lifecycle-track--main,\s*\.lifecycle-track--branch\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*1fr/s,
    );
    expect(styles).toMatch(
      /@media \(max-width:\s*48rem\)[\s\S]*\.lifecycle-current-marker\s*\{[^}]*position:\s*static[^}]*transform:\s*none/s,
    );
  });
});
