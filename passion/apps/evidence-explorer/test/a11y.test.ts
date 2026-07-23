/**
 * UE047 — WCAG 2.2 AA acceptance for the Provenance Observatory (SC-E13).
 *
 * The 3D `<Canvas>` and the calm-2D constellation are decorative; the DOM **Ledger** is the single
 * accessible source of truth (FR-E12). These tests pin, at the source/view level:
 *   1. every canvas/decorative render layer is `aria-hidden` (or wrapped in an `aria-hidden` parent);
 *   2. the Ledger exposes a keyboard-navigable `role="tree"` whose items describe each node;
 *   3. focus is always visible (a `:focus-visible` outline on the `--focus` token);
 *   4. every node type is carried by **shape + glyph + text**, never colour alone (grayscale-safe).
 *
 * Live screen-reader / switch verification is `manual:` (needs real AT) — see progress notes. Here we
 * assert the structural guarantees that make that pass possible and keep them from regressing.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildExplorerView, buildFixtureGraph } from "@gt100k/evidence-explorer-view";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { describe, expect, it } from "vitest";

const src = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), "utf8");

function buildView() {
  const bundle = buildFixtureGraph(new NodeCryptoHasher());
  return buildExplorerView(bundle.graph, bundle);
}

describe("UE047 · decorative layers are aria-hidden (SC-E13)", () => {
  it("the 3D <Canvas> is aria-hidden", () => {
    const cosmos = src("components/cosmos/Cosmos3D.tsx");
    // Find the JSX element (`<Canvas` + whitespace), not the doc-comment `<Canvas>` mention.
    const el = cosmos.search(/<Canvas\s/);
    expect(el).toBeGreaterThan(-1);
    // The opening tag's attributes fit well within this window (aria-hidden is the first attr).
    const openTag = cosmos.slice(el, el + 400);
    expect(openTag).toContain('aria-hidden="true"');
  });

  it("the calm-2D constellation root <svg> is aria-hidden (not an exposed role=img)", () => {
    const c2d = src("components/constellation/Constellation2D.tsx");
    const svgOpen = c2d.slice(c2d.indexOf("<svg"), c2d.indexOf(">", c2d.indexOf("<svg")) + 1);
    expect(svgOpen).toContain('aria-hidden="true"');
    expect(svgOpen).not.toContain('role="img"');
    // The Ledger — not the constellation — carries the accessible name.
    expect(svgOpen).not.toContain("aria-label");
  });

  it("decorative glyph SVGs in the visual panels are aria-hidden (Inspector / HUD)", () => {
    for (const rel of ["components/Inspector.tsx", "components/Hud.tsx"]) {
      const file = src(rel);
      // Every inline <svg …> in these visual surfaces is a decorative glyph.
      const svgTags = file.match(/<svg[^>]*>/g) ?? [];
      expect(svgTags.length).toBeGreaterThan(0);
      for (const tag of svgTags) expect(tag).toContain('aria-hidden="true"');
    }
  });
});

describe("UE047 · the Ledger is the keyboard-navigable source of truth", () => {
  const ledger = src("components/Ledger.tsx");

  it("renders a single role=tree with treeitem rows", () => {
    expect(ledger).toContain('role="tree"');
    expect(ledger).toContain('role="treeitem"');
  });

  it("each row is a real, focusable <button> described by its panel region", () => {
    expect(ledger).toContain("<button");
    expect(ledger).toContain("aria-describedby");
  });

  it("verification state is conveyed in the DOM (aria-live seal), not canvas-only", () => {
    expect(ledger).toMatch(/aria-live/);
  });
});

describe("UE047 · focus is always visible", () => {
  const css = src("app/globals.css");
  it("defines a :focus-visible outline on the --focus ring token", () => {
    expect(css).toContain(":focus-visible");
    expect(css).toMatch(/outline:\s*\d+px\s+solid\s+var\(--focus\)/);
    expect(css).toContain("--focus:");
  });
});

describe("UE047 · colour-independent cues — every type has shape+glyph+text (grayscale-safe)", () => {
  const view = buildView();

  it("every node carries a non-empty text label and a glyph (never colour alone)", () => {
    for (const n of view.nodes) {
      expect(n.label.trim().length).toBeGreaterThan(0);
      expect(n.glyph.trim().length).toBeGreaterThan(0);
    }
  });

  it("distinct node types map to distinct glyphs, so meaning survives a grayscale filter", () => {
    const byType = new Map<string, Set<string>>();
    for (const n of view.nodes) {
      const set = byType.get(n.type) ?? new Set<string>();
      set.add(n.glyph);
      byType.set(n.type, set);
    }
    // One glyph per type (consistent) …
    for (const [, glyphs] of byType) expect(glyphs.size).toBe(1);
    // … and no two types share a glyph (distinguishable without colour).
    const perTypeGlyph = [...byType.values()].map((s) => [...s][0]);
    expect(new Set(perTypeGlyph).size).toBe(byType.size);
  });

  it("every edge (thread) carries a style token, so lineage is not colour-only", () => {
    for (const e of view.edges.filter((x) => x.isNodeEdge)) {
      expect(String(e.threadStyle ?? "").length).toBeGreaterThan(0);
    }
  });
});
