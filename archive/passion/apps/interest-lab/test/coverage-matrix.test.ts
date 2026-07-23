import { readFileSync } from "node:fs";
import { buildLab } from "@gt100k/interest-lab";
import { buildCoverageMatrixView } from "@gt100k/interest-lab-view";
import { CATALOG_GAPPY_V1, CATALOG_GOLDEN_V1 } from "@gt100k/interest-probe-catalog";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CoverageMatrix,
  resolveCoverageCellMotion,
  resolveCoverageRailMotion,
} from "../app/guide/CoverageMatrix";

const buildView = (catalog: typeof CATALOG_GOLDEN_V1 | typeof CATALOG_GAPPY_V1) => {
  const lab = buildLab(
    "synthetic-coverage-preview",
    catalog,
    { metPrereqs: [], engagedDomains: [] },
    { seed: 42 },
  );

  return buildCoverageMatrixView(lab.coverage, lab.offers);
};

describe("guide coverage matrix", () => {
  it("renders the complete matrix as one native table with every header and cell", () => {
    const markup = renderToStaticMarkup(
      createElement(CoverageMatrix, {
        view: buildView(CATALOG_GOLDEN_V1),
        reducedMotion: false,
      }),
    );

    expect(markup).toContain("<table");
    expect(markup).toContain("Coverage across domains and work modes");
    expect(markup.match(/scope="col"/g)).toHaveLength(10);
    expect(markup.match(/scope="row"/g)).toHaveLength(8);
    expect(markup.match(/data-matrix-cell="true"/g)).toHaveLength(72);
    expect(markup.match(/data-cell-status="offered"/g)).toHaveLength(20);
    expect(markup.match(/data-cell-status="empty"/g)).toHaveLength(52);
    expect(markup).toContain("Making");
    expect(markup).toContain("Build");
    expect(markup).toContain('data-glyph="glyph-hammer"');
    expect(markup).toContain("Offered");
    expect(markup).toContain("Not yet offered");
    expect(markup).not.toMatch(/score|confidence/i);
  });

  it("shows every named gap in the rail and aggregate list with icon-and-text cues", () => {
    const exactGaps = [
      "probe count 8 below minimum 18",
      "only 5 of ≥6 required domains",
      "only 5 of ≥6 required work modes",
      "no collaborative (group) probe",
      "no stretch-band probe",
      "no audience-condition probe",
    ];
    const markup = renderToStaticMarkup(
      createElement(CoverageMatrix, {
        view: buildView(CATALOG_GAPPY_V1),
        reducedMotion: false,
      }),
    );

    expect(markup).toContain('data-coverage-state="gappy"');
    expect(markup.match(/data-rail-state="gap"/g)).toHaveLength(6);
    expect(markup.match(/data-state-glyph="gap"/g)).toHaveLength(12);
    expect(markup).toContain('class="coverage-gaps-list"');
    for (const gap of exactGaps) expect(markup).toContain(gap);
    expect(markup).not.toMatch(/score|confidence/i);
  });

  it("uses the pinned matrix-cell, stagger, and ticker tokens with instant reduced motion", () => {
    expect(resolveCoverageCellMotion(false, 2)).toEqual({
      initial: { opacity: 0.72 },
      transition: {
        delay: 0.08,
        duration: 0.26,
        ease: "cubic-bezier(0.23,1,0.32,1)",
      },
    });
    expect(resolveCoverageCellMotion(true, 2)).toEqual({
      initial: false,
      transition: { delay: 0, duration: 0, ease: "linear" },
    });
    expect(resolveCoverageRailMotion(false, 2)).toEqual({
      initial: { opacity: 0.72, y: 6 },
      transition: {
        delay: 0.08,
        duration: 0.6,
        ease: "cubic-bezier(0.23,1,0.32,1)",
      },
    });
    expect(resolveCoverageRailMotion(true, 2)).toEqual({
      initial: false,
      transition: { delay: 0, duration: 0, ease: "linear" },
    });
  });

  it("styles empty cells and unmet rail items as calm slate hollow cues", () => {
    const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.coverage-cell--empty\s*\{[^}]*border[^;]*var\(--gap\)[^}]*background:\s*transparent/s,
    );
    expect(styles).toMatch(
      /\.coverage-rail-item--gap\s+\.coverage-state-glyph\s*\{[^}]*color:\s*var\(--gap\)/s,
    );
    expect(styles).toMatch(/\.coverage-table-scroll\s*\{[^}]*overflow-x:\s*auto/s);
  });
});
