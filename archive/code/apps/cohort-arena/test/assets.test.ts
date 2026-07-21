import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { STATE_CUES } from "@gt100k/cohort-arena-view";

const SEED_DIRECTORY = new URL("../public/seed/", import.meta.url);

const EXPECTED_ASSETS = {
  "badge.svg": "Constraint badge",
  "bench.svg": "Still compiling",
  "check.svg": "Satisfied",
  "floor-halo.svg": "Non-harm floor halo",
  "hex.svg": "Cohort hex",
  "seat.svg": "Arena seat",
  "shield.svg": "Safeguarding shield",
  "star.svg": "Learner star",
  "veil.svg": "Confidence low",
} as const;

function seedDirectoryExists(): boolean {
  const exists = existsSync(SEED_DIRECTORY);
  expect(exists).toBe(true);
  return exists;
}

function sourceFiles(directory: URL): URL[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = new URL(entry.isDirectory() ? `${entry.name}/` : entry.name, directory);
    if (entry.isDirectory()) return sourceFiles(child);
    return /\.(?:css|tsx?)$/.test(entry.name) ? [child] : [];
  });
}

describe("the in-repo Compiler Observatory seed art", () => {
  it("commits the exact small SVG vocabulary used by the scene and state cues", () => {
    if (!seedDirectoryExists()) return;

    const assets = readdirSync(SEED_DIRECTORY)
      .filter((name) => name.endsWith(".svg"))
      .sort();

    expect(assets).toEqual(Object.keys(EXPECTED_ASSETS));
    expect(Object.values(STATE_CUES).map(({ icon }) => `${icon}.svg`)).toEqual(
      expect.arrayContaining(
        assets.filter((name) =>
          ["bench.svg", "check.svg", "hex.svg", "shield.svg", "veil.svg"].includes(name),
        ),
      ),
    );
  });

  it("keeps every seed accessible, inline-safe, and free of remote or raster content", () => {
    if (!seedDirectoryExists()) return;

    for (const [filename, title] of Object.entries(EXPECTED_ASSETS)) {
      const source = readFileSync(new URL(filename, SEED_DIRECTORY), "utf8");

      expect(source, filename).toMatch(/^<svg\b/);
      expect(source, filename).toContain('viewBox="0 0 24 24"');
      expect(source, filename).toContain(`<title>${title}</title>`);
      expect(source, filename).toContain("currentColor");
      expect(source, filename).not.toMatch(/<(?:foreignObject|image|script)\b/i);
      expect(source, filename).not.toMatch(/(?:data:|(?:href|src)=["']https?:|url\()/i);
    }
  });

  it("retains deterministic three.js primitives as the no-asset fallback", () => {
    const sceneSource = readFileSync(
      new URL("../components/observatory/ObservatoryScene.tsx", import.meta.url),
      "utf8",
    );

    expect(sceneSource).toContain("IcosahedronGeometry");
    expect(sceneSource).toContain("OctahedronGeometry");
    expect(sceneSource).toContain("<ringGeometry");
    expect(sceneSource).toContain("<circleGeometry");
    expect(sceneSource).toContain("<Line");
    expect(sceneSource).not.toContain("Math.random");
  });

  it("keeps app renderers independent of network-loaded art, data, and fonts", () => {
    const source = [
      ...sourceFiles(new URL("../app/", import.meta.url)),
      ...sourceFiles(new URL("../components/", import.meta.url)),
    ]
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/https?:\/\//);
    expect(source).not.toMatch(/\b(?:TextureLoader|useGLTF|useTexture)\b/);
  });
});
