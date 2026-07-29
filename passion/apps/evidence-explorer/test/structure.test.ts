import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const COMPONENTS = join(__dirname, "..", "components");
const read = (f: string) => readFileSync(join(COMPONENTS, f), "utf8");

describe("single-column story-first composition", () => {
  it("Observatory owns the verify state and delegates the panel to VerifyPanel, which wires audioCaptions into VerifyBox", () => {
    const src = read("Observatory.tsx");
    expect(src).toMatch(/verifyOpen/);
    expect(src).toMatch(/verifyVisual/);
    expect(src).toMatch(/VerifyPanel/);

    const panelSrc = read("VerifyPanel.tsx");
    expect(panelSrc).toMatch(/VerifyBox/);
    expect(panelSrc).toMatch(/audioCaptions/);
  });

  it("Observatory exposes a Verify control in the header", () => {
    const src = read("Observatory.tsx");
    expect(src).toMatch(/obs-verify-btn/);
  });

  it("the render stage no longer renders VerifyBox", () => {
    expect(read("ObservatoryStage.tsx")).not.toMatch(/VerifyBox/);
  });
});

describe("Explore disclosure", () => {
  it("Observatory delegates the tools to ExplorePanel, not directly", () => {
    const src = read("Observatory.tsx");
    expect(src).toMatch(/ExplorePanel/);
    // The tools now live inside ExplorePanel, not the Observatory shell.
    expect(src).not.toMatch(/<Hud\b/);
    expect(src).not.toMatch(/<Ledger\b/);
    expect(src).not.toMatch(/<AddPanel\b/);
  });

  it("ExplorePanel is collapsed by default", () => {
    const src = read("ExplorePanel.tsx");
    expect(src).toMatch(/useState\(false\)/);
    expect(src).toMatch(/aria-expanded/);
  });
});
