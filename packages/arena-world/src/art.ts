import { BIOMES } from "./biomes.fixture";
import type { BiomeIdentity, Palette } from "./model";

export const PALETTE = {
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
} satisfies Palette;

export const TYPOGRAPHY = {
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
} as const;

export function resolveBiome(region: string): BiomeIdentity {
  const biome = BIOMES.find((candidate) => candidate.region === region);

  if (!biome) {
    throw new Error(`Unknown arena region: ${region}`);
  }

  return biome;
}

export function resolveElevation(region: string): number {
  return resolveBiome(region).elevation;
}
