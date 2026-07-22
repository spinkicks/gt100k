import type { TypographyView } from "./model";

export const PALETTE = {
  night: "#181026",
  nightRaised: "#221A3D",
  nightSunk: "#120B1E",
  paperGuide: "#F6F3FB",
  inkGuide: "#241B3A",
  inkHi: "#F4F0FB",
  inkMuted: "#C3B8D9",
  spark: "#FF9E5E",
  sparkHi: "#FFC08A",
  beacon: "#FFD166",
  tide: "#5EC8D8",
  sprout: "#7BD88F",
  met: "#7BD88F",
  gap: "#8FA6C9",
  prompted: "#9A8FB5",
  support: "#5EC8D8",
  contested: "#E0A458",
  parked: "#8B93A7",
  focus: "#FFD166",
} as const;

export const TYPOGRAPHY = {
  fontDisplay: '"Fredoka","Baloo 2",ui-rounded,"Segoe UI Rounded",system-ui,sans-serif',
  fontReading: '"Iowan Old Style","Palatino","Georgia",ui-serif,serif',
  fontBody: '"Inter",ui-sans-serif,system-ui,"Segoe UI",sans-serif',
  scale: {
    display: { rem: 2.5, lh: 1.05, ls: -0.02, weight: 600 },
    h1: { rem: 1.75, lh: 1.1, ls: -0.01, weight: 600 },
    h2: { rem: 1.25, lh: 1.2, ls: 0, weight: 600 },
    reading: { rem: 1.0625, lh: 1.6, ls: 0, weight: 400 },
    body: { rem: 1, lh: 1.5, ls: 0, weight: 400 },
    label: { rem: 0.8125, lh: 1.4, ls: 0.01, weight: 500 },
  },
  numeric: "tabular-nums",
} as const satisfies TypographyView;

export const HUE_RAMP = [
  "#E8825A",
  "#5FB98C",
  "#6C8CE8",
  "#C98BD9",
  "#E8B84B",
  "#E56B8C",
  "#4FC0C7",
  "#7E8CE0",
  "#9CC65A",
  "#E09E52",
  "#6FD1B0",
  "#D07AB0",
] as const;

export function resolveDomainHue(
  catalogDomainsInOrder: readonly string[],
  domainId: string,
): string {
  const domainIndex = catalogDomainsInOrder.indexOf(domainId);

  if (domainIndex === -1) {
    throw new Error(`Domain is absent from catalog order: ${domainId}`);
  }

  return HUE_RAMP[domainIndex % HUE_RAMP.length]!;
}

// Emberwood cozy-cabin material tint palette (art bible §3.1/§3.4). ADDITIVE — a new named export
// for zone builders to tint every mixed CC0 kit onto ONE warm palette (Pillar A cohesion). Four
// families: warm woods (structure) · firelight & amber (emissive glow only) · forest greens & rust
// (the world outside) · cool dusk fills (shadows — NEVER gray) · warm neutrals/materials.
export const CABIN = {
  // warm woods
  woodHoney: "#C89A5E",
  woodOak: "#A87C4A",
  woodWalnut: "#6B4A2E",
  woodCocoa: "#4A3320",
  woodDrift: "#B9A484",
  // firelight & amber — reserve pure glow for emissive surfaces
  fireEmber: "#FF7A3C",
  fireFlame: "#FFB25A",
  fireSpark: "#FF9E5E",
  lantern: "#FFD166",
  windowSpill: "#FFC08A",
  candle: "#FFE0A8",
  // forest greens & rust
  forestPine: "#5E7B4E",
  forestDeep: "#37503E",
  moss: "#8CA55E",
  terracotta: "#B5623A",
  leafRust: "#9C5A32",
  verdigris: "#7F9E8E",
  // cool dusk fills (shadows)
  duskSkylight: "#A9C2E8",
  duskShadow: "#6E6A8E",
  duskDeep: "#514D74",
  duskWindow: "#7C93B8",
  // warm neutrals & materials
  plaster: "#EAD7B4",
  parchment: "#F0E4C8",
  ceramic: "#D8B48C",
  brass: "#B98A4E",
  leather: "#8B5A3C",
  woolWarm: "#C48A6A",
  woolCream: "#E6D3B0",
} as const;

// The DOM/CSS color script for the 2D Curiosity Map — "the clearing at golden hour" (art bible §6/§3.4).
// ADDITIVE — a new named export for the DOM map layers (sky → treeline → ground → shadows → cabins →
// foliage → smoke/fireflies). softShadow is blue-violet and MUST render at 22–34% alpha — never gray/black.
export const MAP_COLOR_SCRIPT = {
  skyTop: "#FCEAC2", // golden-hour cream
  skyLow: "#F4B074", // → peach
  treeline: "#6E5A4E", // hazed warm-brown pine silhouette band
  groundLit: "#C9B583",
  groundShade: "#8E8A5E",
  grassTuft: "#9FB56A",
  path: "#D8B888", // warm dirt
  pathPlank: "#B98A5E", // boardwalk
  waterPond: "#8FC7CE",
  waterGlint: "#FFD8A0",
  softShadow: "#5E5880", // blue-violet; render at 22–34% alpha — NEVER gray/black
  chimneySmoke: "#CDBBA6", // low alpha
  firefly: "#FFD98A",
  emberSpark: "#FF7A3C",
  hearthGlow: "#FF9E5E", // the Lodge fire (= fire.spark)
  cabinMusic: "#E8825A", // = HUE_RAMP[0]
  cabinCode: "#5FB98C", // = HUE_RAMP[1]
  cabinArt: "#6C8CE8", // = HUE_RAMP[2]
} as const;
