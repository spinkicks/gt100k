import { PALETTE, TYPOGRAPHY, resolveBiome, resolveElevation } from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

const GOLDEN_BIOMES = [
  {
    region: "numbers-coast",
    name: "Numbers Coast",
    signatureHex: "#2EC4B6",
    terrainHex: "#E9D9A8",
    ambientHex: "#BFE9E3",
    elevation: 0,
    landmarks: ["Counting Lighthouse", "Abacus Jetty", "Tide-Pool Terraces"],
  },
  {
    region: "tinker-bluffs",
    name: "Tinker Bluffs",
    signatureHex: "#C77D3A",
    terrainHex: "#8A6B4F",
    ambientHex: "#E7C9A0",
    elevation: 1.5,
    landmarks: ["Gear Overlook", "Gadget Workshop", "Copper Kilns"],
  },
  {
    region: "story-vale",
    name: "Story Vale",
    signatureHex: "#3E9B5F",
    terrainHex: "#6E8E5A",
    ambientHex: "#CDE3B8",
    elevation: -0.5,
    landmarks: ["Whispering Falls", "Book-Root Forest", "The Open Page"],
  },
  {
    region: "wordwind-reach",
    name: "Wordwind Reach",
    signatureHex: "#5AA9E6",
    terrainHex: "#C9B27E",
    ambientHex: "#DCE9F5",
    elevation: 2.2,
    landmarks: ["Letter Landing Field", "Windmill Highlands", "The Spelling Spires"],
  },
] as const;

describe("arena art direction", () => {
  it("keeps the exact palette and typography tokens", () => {
    expect(PALETTE).toEqual({
      seaDeep: "#0E2A3B",
      seaMid: "#14384C",
      skyDawn: "#F4C77B",
      ink: "#14202B",
      inkHi: "#F5F9FC",
      sun: "#F6A23A",
      sunHi: "#FFC66B",
      gold: "#F2C14E",
      ember: "#E8623B",
      locked: "#5A6B78",
      notYet: "#7FB6D6",
      focus: "#FFD166",
    });
    expect(TYPOGRAPHY).toEqual({
      fontDisplay: '"Fredoka","Baloo 2",ui-rounded,"Segoe UI Rounded",system-ui,sans-serif',
      fontBody: '"Nunito",ui-rounded,system-ui,sans-serif',
      scale: {
        display: { rem: 2.5, lh: 1.05, ls: -0.02 },
        h1: { rem: 1.75, lh: 1.1, ls: -0.01 },
        h2: { rem: 1.25, lh: 1.2, ls: 0 },
        body: { rem: 1, lh: 1.5, ls: 0 },
        label: { rem: 0.8125, lh: 1.4, ls: 0.01 },
      },
      numeric: "tabular-nums",
    });
  });

  it("resolves every canonical biome and elevation to the exact golden row", () => {
    for (const biome of GOLDEN_BIOMES) {
      expect(resolveBiome(biome.region)).toEqual(biome);
      expect(resolveElevation(biome.region)).toBe(biome.elevation);
    }
  });

  it("is deterministic for identical region inputs", () => {
    const first = GOLDEN_BIOMES.map(({ region }) => resolveBiome(region));
    const second = GOLDEN_BIOMES.map(({ region }) => resolveBiome(region));

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("rejects unknown regions", () => {
    expect(() => resolveBiome("unknown-region")).toThrow(/Unknown arena region/);
    expect(() => resolveElevation("unknown-region")).toThrow(/Unknown arena region/);
  });
});
