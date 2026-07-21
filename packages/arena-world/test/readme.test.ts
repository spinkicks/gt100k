import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const README_PATH = new URL("../README.md", import.meta.url);
const README = existsSync(README_PATH) ? readFileSync(README_PATH, "utf8") : "";
const MANIFEST = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  readonly scripts: { readonly test: string };
};

describe("arena-world package README", () => {
  it("documents the public API and synthetic input boundary", () => {
    expect(README).toMatch(/^# @gt100k\/arena-world/m);
    expect(README).toMatch(/^## Public API$/m);
    expect(README).toMatch(/^## Inputs as ports$/m);
    expect(README).toContain("buildArenaView");
    expect(README).toContain("createSyntheticMasteryFeed");
    expect(README).toContain("NodeMasterySignal");
    expect(README).toContain("BuildArenaViewInputs");
    expect(README).toContain("@gt100k/learning-loop");
  });

  it("uses a WebGL-capable reduced-motion profile for the Tier-C example", () => {
    expect(README).toContain("webgl2: true");
    expect(README).toContain("webgl1: true");
    expect(README).toContain('view.presentation.qualityTier); // "C"');
  });

  it("states the renderer boundary and child-safety guardrails", () => {
    expect(README).toMatch(/^## Guardrails$/m);
    expect(README).toContain("No 3D dependency");
    expect(README).toContain("configuration only");
    expect(README).toContain("Math.random");
    expect(README).toMatch(/price.*currency.*dropRate.*rarity/);
    expect(README).toMatch(/rank.*position.*percentile.*outOf/);
    expect(README).toContain("zero gameplay power");
    expect(README).toContain("synthetic");
  });

  it("includes the package validation commands", () => {
    expect(README).toMatch(/^## Develop$/m);
    expect(README).toContain("pnpm --filter @gt100k/arena-world test");
    expect(README).toContain("pnpm typecheck");
    expect(README).toContain("pnpm lint");
  });

  it("backs the documented package command with a repository-rooted test script", () => {
    expect(MANIFEST.scripts.test).toBe("vitest run --root ../.. packages/arena-world/test");
  });
});
