/**
 * The front door rendered as the browser first receives it: static markup, before any JavaScript
 * and with no storage of any kind available. That is the state that has to be right — remembering
 * the last role is layered on afterwards, and a visitor with JS off must still get three links.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import Page from "../app/page.js";

function roleLinks(html: string): readonly { role: string; href: string }[] {
  const found: { role: string; href: string }[] = [];
  for (const anchor of html.matchAll(/<a\s([^>]*)>(.*?)<\/a>/gs)) {
    const attrs = anchor[1]!;
    if (!attrs.includes('class="role')) continue;
    found.push({
      role: /<span class="role__role">([^<]*)<\/span>/.exec(anchor[2]!)?.[1] ?? "",
      href: /href="([^"]*)"/.exec(attrs)?.[1] ?? "",
    });
  }
  return found;
}

describe("front door", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("points each role at its surface", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(roleLinks(renderToStaticMarkup(<Page />))).toEqual([
      { role: "Guide", href: "http://localhost:3020" },
      { role: "Parent", href: "http://localhost:3055" },
      // Two child doors: the wall is where a child with nothing chosen goes looking, the studio is
      // where one who has already chosen goes back to work.
      { role: "Child", href: "http://localhost:3080" },
      { role: "Child, mid-project", href: "http://localhost:3010" },
    ]);
  });

  it("honours explicitly configured surface URLs", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SURFACE_URL_PARENT", "https://playbook.example.com");

    const html = renderToStaticMarkup(<Page />);

    expect(roleLinks(html)).toEqual([{ role: "Parent", href: "https://playbook.example.com" }]);
    // The surfaces production was told nothing about are still named — just not as links.
    expect(html).toContain("Guide Console");
    expect(html).not.toContain("localhost");
  });

  it("renders the canonical order with no localStorage", () => {
    vi.stubEnv("NODE_ENV", "development");

    const html = renderToStaticMarkup(<Page />);

    expect(html.indexOf("Guide Console")).toBeLessThan(html.indexOf("Parent Playbook"));
    expect(html.indexOf("Parent Playbook")).toBeLessThan(html.indexOf("Project Studio"));
    expect(html).not.toContain("role--primary");
    expect(html).not.toContain("Where you were last");
  });

  it("says the data is synthetic", () => {
    expect(renderToStaticMarkup(<Page />)).toContain("synthetic");
  });
});
