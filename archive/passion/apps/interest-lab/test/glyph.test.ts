import { WORK_MODE_GLYPHS } from "@gt100k/interest-lab-view";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Glyph, STATE_GLYPHS } from "../app/ui/Glyph";

describe("Glyph", () => {
  it("renders every work-mode and state glyph as an inline SVG without emoji", () => {
    const names = [...Object.values(WORK_MODE_GLYPHS), ...Object.values(STATE_GLYPHS)];

    for (const name of names) {
      const markup = renderToStaticMarkup(createElement(Glyph, { name }));

      expect(markup).toContain("<svg");
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain('stroke="currentColor"');
      expect(markup).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    }
  });

  it("gives a titled glyph an explicit image name", () => {
    const markup = renderToStaticMarkup(
      createElement(Glyph, { name: WORK_MODE_GLYPHS.build, title: "Build" }),
    );

    expect(markup).toContain('role="img"');
    expect(markup).toContain('aria-label="Build"');
    expect(markup).not.toContain("aria-hidden");
  });
});
