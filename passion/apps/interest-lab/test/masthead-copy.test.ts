import type { RenderTier } from "@gt100k/interest-lab-view";
import { describe, expect, it } from "vitest";
import { type MastheadCopy, resolveMastheadCopy } from "../app/ui/mastheadCopy";

const TIERS: RenderTier[] = ["quest-world-3d", "quest-world-3d-lite", "board-2d"];

/** The child never sees preview-build wording or render-tier jargon. */
const CHILD_FORBIDDEN = ["synthetic", "preview", "tier", "2D", "3D", "WebGL", "board"];

describe("resolveMastheadCopy — staff (?debug) diagnostic copy", () => {
  it("keeps the synthetic-preview eyebrow and the render-tier name for the child surface", () => {
    const copy = resolveMastheadCopy({
      surface: "child",
      staffDebug: true,
      renderTier: "board-2d",
    });
    expect(copy.contextLine).toBe("Interest Lab · synthetic preview");
    expect(copy.statusLabel).toBe("Accessible 2D tier");
  });

  it("names each render tier diagnostically under debug", () => {
    const labels = TIERS.map(
      (renderTier) =>
        resolveMastheadCopy({ surface: "child", staffDebug: true, renderTier }).statusLabel,
    );
    expect(labels).toEqual(["Full 3D world", "Lighter 3D world", "Accessible 2D tier"]);
  });

  it("shows the evidence console for the guide surface under debug", () => {
    const copy = resolveMastheadCopy({
      surface: "guide",
      staffDebug: true,
      renderTier: "quest-world-3d",
    });
    expect(copy.contextLine).toBe("Interest Lab · synthetic preview");
    expect(copy.statusLabel).toBe("Evidence console");
  });
});

describe("resolveMastheadCopy — child build (no debug)", () => {
  const cases: { renderTier: RenderTier; expected: string }[] = [
    { renderTier: "quest-world-3d", expected: "Exploring" },
    { renderTier: "quest-world-3d-lite", expected: "Exploring" },
    { renderTier: "board-2d", expected: "Calm view" },
  ];

  it("reassures with a no-test eyebrow instead of the preview-build tell", () => {
    for (const { renderTier } of cases) {
      const copy = resolveMastheadCopy({ surface: "child", staffDebug: false, renderTier });
      expect(copy.contextLine).toBe("Explore freely — nothing here is a test.");
    }
  });

  it("labels the still 2D board 'Calm view' and the moving 3D world 'Exploring'", () => {
    for (const { renderTier, expected } of cases) {
      const copy = resolveMastheadCopy({ surface: "child", staffDebug: false, renderTier });
      expect(copy.statusLabel).toBe(expected);
    }
  });

  it("never leaks preview/tier jargon into any child-build string", () => {
    for (const { renderTier } of cases) {
      const copy = resolveMastheadCopy({ surface: "child", staffDebug: false, renderTier });
      const haystack = `${copy.contextLine} ${copy.statusLabel}`.toLowerCase();
      for (const banned of CHILD_FORBIDDEN) {
        expect(haystack).not.toContain(banned.toLowerCase());
      }
    }
  });
});

describe("resolveMastheadCopy — guide build (no debug)", () => {
  it("names the product without the preview-build tell and shows the console", () => {
    const copy = resolveMastheadCopy({
      surface: "guide",
      staffDebug: false,
      renderTier: "quest-world-3d",
    });
    expect(copy.contextLine).toBe("Interest Lab");
    expect(copy.statusLabel).toBe("Evidence console");
  });
});

describe("resolveMastheadCopy — total", () => {
  it("returns a non-empty eyebrow and pill for every surface × debug × tier", () => {
    for (const surface of ["child", "guide"] as const) {
      for (const staffDebug of [true, false]) {
        for (const renderTier of TIERS) {
          const copy: MastheadCopy = resolveMastheadCopy({ surface, staffDebug, renderTier });
          expect(copy.contextLine.length).toBeGreaterThan(0);
          expect(copy.statusLabel.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
