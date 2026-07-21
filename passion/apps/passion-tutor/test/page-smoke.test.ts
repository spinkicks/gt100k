import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Page from "../app/page.js";
import { loadSeededInterview } from "../src/load-seeded-interview.js";

function occurrences(value: string, token: string): number {
  return value.split(token).length - 1;
}

describe("P3 seeded passion-tutor smoke path", () => {
  it("loads the first synthetic project and exposes exactly one deterministic question", async () => {
    const interview = await loadSeededInterview();

    expect(interview.project).toMatchObject({
      id: "project-synthetic-solar-oven",
      studentId: "student-synthetic-river",
      title: "Sunrise Solar Oven",
    });
    expect(interview.session.transcript).toEqual([]);
    expect(interview.session.currentQuestion).toEqual({
      id: "what-2",
      facet: "what",
      isFollowUp: false,
      text: "How would you describe your project to someone new?",
    });

    const markup = renderToStaticMarkup(await Page());

    expect(markup).toContain("Sunrise Solar Oven");
    expect(markup).toContain("How would you describe your project to someone new?");
    expect(occurrences(markup, 'data-current-question="true"')).toBe(1);
  });

  it("keeps the desktop question clear of its guide and removes the offset on mobile", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    expect(css).toMatch(/\.question-copy\s*\{[^}]*padding-inline-start:\s*2rem/s);
    expect(css).toMatch(
      /@media \(max-width: 46rem\)[\s\S]*?\.question-copy\s*\{[^}]*padding-inline-start:\s*0/s,
    );
  });
});
