/**
 * The header is rendered to static markup — the same HTML a visitor gets before any JavaScript
 * runs, which is exactly the surface these guarantees are about.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductHeader } from "../src/product-header.js";
import { resolveSurfaces } from "../src/surfaces.js";

function anchors(html: string): readonly { href: string; text: string }[] {
  return [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map((m) => ({
    href: m[1]!,
    text: m[2]!,
  }));
}

/**
 * The home link wraps two elements rather than bare text, so `anchors` above cannot see it. Read it
 * by its class instead, and return null when the wordmark is not a link at all.
 */
function homeHref(html: string): string | null {
  return /<a\b[^>]*class="plh__home"[^>]*href="([^"]*)"/.exec(html)?.[1] ?? null;
}

const PROD = { nodeEnv: "production", urls: {} } as const;
const DEV = { nodeEnv: "development", urls: {} } as const;

describe("ProductHeader", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders no cross-surface link at all in a production build that was told nothing", () => {
    // The guard against a parent on a public site being handed a localhost link.
    vi.stubEnv("NODE_ENV", "production");
    for (const name of ["GUIDE", "PARENT", "STUDIO", "EVIDENCE", "CONCIERGE"]) {
      vi.stubEnv(`NEXT_PUBLIC_SURFACE_URL_${name}`, undefined);
    }

    const html = renderToStaticMarkup(<ProductHeader current="parent" />);

    expect(anchors(html)).toEqual([]);
    expect(html).not.toContain("<nav");
    // Identity survives: this is a header with nowhere to go, not a missing header.
    expect(html).toContain("PassionLab");
    expect(html).toContain("Parent Playbook");
  });

  it("links every other surface in development", () => {
    const html = renderToStaticMarkup(
      <ProductHeader current="guide" surfaces={resolveSurfaces(DEV)} />,
    );

    expect(anchors(html)).toEqual([
      { href: "http://localhost:3055", text: "Parent Playbook" },
      { href: "http://localhost:3010", text: "Project Studio" },
      { href: "http://localhost:3030", text: "Evidence Explorer" },
      { href: "http://localhost:3040", text: "Concierge" },
    ]);
  });

  it("marks the current surface aria-current and never renders it as a link", () => {
    const html = renderToStaticMarkup(
      <ProductHeader current="guide" surfaces={resolveSurfaces(DEV)} />,
    );

    expect(html).toContain('aria-current="page"');
    expect(html).toContain('<span class="plh__here" aria-current="page">Guide Console</span>');
    expect(anchors(html).map((a) => a.text)).not.toContain("Guide Console");
  });

  it("shows a label for a surface that is not in the registry", () => {
    const html = renderToStaticMarkup(
      <ProductHeader
        current="home"
        currentLabel="Home"
        surfaces={resolveSurfaces(PROD)}
        homeUrl={null}
      />,
    );

    expect(html).toContain(">Home</span>");
    expect(anchors(html)).toEqual([]);
  });

  it("turns the wordmark into the way back to the front door", () => {
    // Every surface was a dead end before this: the switcher moved you sideways between peers and
    // nothing pointed home, so the front door could only ever be reached by typing its address.
    const html = renderToStaticMarkup(
      <ProductHeader
        current="evidence"
        surfaces={resolveSurfaces(DEV)}
        homeUrl="http://localhost:3000"
      />,
    );

    expect(homeHref(html)).toBe("http://localhost:3000");
    expect(html).toContain("PassionLab");
  });

  it("does not link the front door to itself", () => {
    const html = renderToStaticMarkup(
      <ProductHeader
        current="home"
        currentLabel="Home"
        surfaces={resolveSurfaces(DEV)}
        homeUrl="http://localhost:3000"
      />,
    );

    expect(homeHref(html)).toBeNull();
  });

  it("leaves the wordmark as plain text when production was never told where home is", () => {
    // Same rule as every other surface: no address, no link. A parent on the public playbook must
    // not be handed a localhost href.
    const html = renderToStaticMarkup(
      <ProductHeader current="parent" surfaces={resolveSurfaces(PROD)} homeUrl={null} />,
    );

    expect(homeHref(html)).toBeNull();
    expect(html).toContain("PassionLab");
  });
});
