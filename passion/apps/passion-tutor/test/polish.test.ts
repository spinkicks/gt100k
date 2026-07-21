import { readFileSync } from "node:fs";

import { type ComponentType, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Page from "../app/page.js";

interface ErrorStateProps {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}

async function loadingState() {
  const api = (await import("../app/loading.js").catch(() => ({}))) as Record<string, unknown>;

  expect(api.default).toBeTypeOf("function");
  if (typeof api.default !== "function") throw new Error("P6 loading state is not implemented");

  return api.default as ComponentType;
}

async function errorState() {
  const api = (await import("../app/error.js").catch(() => ({}))) as Record<string, unknown>;

  expect(api.default).toBeTypeOf("function");
  if (typeof api.default !== "function") throw new Error("P6 error state is not implemented");

  return api.default as ComponentType<ErrorStateProps>;
}

describe("P6 responsive and accessible polish acceptance", () => {
  it("keeps the interview within a 375px viewport when text is enlarged to 200%", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    expect(css).toMatch(/body\s*\{[^}]*min-width:\s*0/s);
    expect(css).not.toMatch(/min-width:\s*20rem/);
    expect(css).toMatch(/\.project-title\s*\{[^}]*overflow-wrap:\s*anywhere/s);
    expect(css).toMatch(/\.question-copy h1\s*\{[^}]*overflow-wrap:\s*anywhere/s);
    expect(css).toMatch(
      /@media \(max-width: 28rem\)[\s\S]*?\.project-panel\s*\{[^}]*flex-direction:\s*column/s,
    );
    expect(css).toMatch(
      /@media \(max-width: 28rem\)[\s\S]*?\.understanding-heading\s*\{[^}]*flex-direction:\s*column/s,
    );
    expect(css).toMatch(
      /@media \(max-width: 28rem\)[\s\S]*?\.understanding-map ol\s*\{[^}]*grid-template-columns:\s*1fr/s,
    );
  });

  it("presents the first question as the first heading and identifies the first-run state", async () => {
    const markup = renderToStaticMarkup(await Page());
    const headingLevels = [...markup.matchAll(/<h([1-6])\b/g)].map((match) => match[1]);

    expect(headingLevels[0]).toBe("1");
    expect(markup).toContain('data-interview-state="first-run"');
    expect(markup).toContain("Let’s start here.");
  });

  it("shows an honest, announced route loading state", async () => {
    const LoadingState = await loadingState();
    const markup = renderToStaticMarkup(createElement(LoadingState));

    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("<output");
    expect(markup).toContain("Getting your first question ready.");
    expect(markup).toContain("Synthetic practice project");
    expect(markup).toContain("synthetic practice project and its starting prompt");
  });

  it("offers an announced recovery action when the route fails", async () => {
    const ErrorState = await errorState();
    const markup = renderToStaticMarkup(
      createElement(ErrorState, {
        error: new Error("synthetic test failure"),
        reset: () => undefined,
      }),
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("We couldn’t open your practice interview.");
    expect(markup).toContain("synthetic practice project again");
    expect(markup).toMatch(/<button[^>]*type="button"[^>]*>Try again<\/button>/);
    expect(markup).not.toContain("synthetic test failure");
  });
});
