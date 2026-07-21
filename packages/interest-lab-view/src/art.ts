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
