// The wall's art must be complete, on-palette, and uniform, and none of that is visible from code.
// This checks the shipped files in public/pursuits: one SVG per pursuit, no orphans, on-palette,
// small, and within the color-energy band that replaces the old luminance rule.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PURSUITS } from "@gt100k/pursuits";
import { describe, expect, it } from "vitest";
import { assertConformant, energyOf } from "./icon-conformance";

const ART = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "pursuits");
const files = readdirSync(ART);

describe("every pursuit has a tile", () => {
  it("has one svg per pursuit", () => {
    const missing = PURSUITS.filter((p) => !files.includes(`${p.id}.svg`)).map((p) => p.id);
    expect(missing).toEqual([]);
  });
  it("has no tile for a pursuit that no longer exists", () => {
    const ids = new Set(PURSUITS.map((p) => p.id));
    const orphans = files.filter((f) => !ids.has(f.replace(/\.svg$/, "")));
    expect(orphans).toEqual([]);
  });
  it("keeps every tile small enough to send forty-four at once", () => {
    for (const p of PURSUITS) expect(statSync(join(ART, `${p.id}.svg`)).size).toBeLessThan(15_000);
  });
});

describe("no tile is prettier than another", () => {
  it("uses only the locked palette and stroke", () => {
    for (const p of PURSUITS)
      expect(assertConformant(readFileSync(join(ART, `${p.id}.svg`), "utf8"))).toEqual([]);
  });
  it("holds color-energy spread within 1.6x", async () => {
    const energies = await Promise.all(PURSUITS.map((p) => energyOf(join(ART, `${p.id}.svg`))));
    expect(Math.max(...energies) / Math.min(...energies)).toBeLessThan(1.6);
  });
});
