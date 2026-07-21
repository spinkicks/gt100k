import { describe, expect, it } from "vitest";
import { HUE_RAMP, PALETTE, TYPOGRAPHY, resolveDomainHue } from "../src/index";

const SEED_DOMAINS = [
  "making",
  "living_systems",
  "symbols_math",
  "word_craft",
  "sound_music",
  "movement_body",
  "visual_design",
  "social_world",
] as const;

function relativeLuminance(hex: string): number {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((channel) => Number.parseInt(channel, 16));

  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit hex color, received ${hex}`);
  }

  const toLinear = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const [red, green, blue] = channels as [number, number, number];

  return 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
}

function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));

  return (lighter + 0.05) / (darker + 0.05);
}

describe("interest lab art", () => {
  it("pins the exact Curiosity Atelier at Dusk palette", () => {
    expect(PALETTE).toEqual({
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
    });
  });

  it("pins the exact fetch-free typography tokens", () => {
    expect(TYPOGRAPHY).toEqual({
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
    });
  });

  it("meets every pinned foreground and background contrast guarantee", () => {
    expect(contrastRatio(PALETTE.inkHi, PALETTE.night)).toBeGreaterThanOrEqual(12);
    expect(contrastRatio(PALETTE.inkMuted, PALETTE.night)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PALETTE.inkGuide, PALETTE.paperGuide)).toBeGreaterThanOrEqual(12);
    expect(contrastRatio(PALETTE.inkGuide, PALETTE.spark)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PALETTE.inkGuide, PALETTE.beacon)).toBeGreaterThanOrEqual(4.5);
  });

  it("maps the eight seed domains to the exact catalog-order hue golden", () => {
    expect(SEED_DOMAINS.map((domain) => [domain, resolveDomainHue(SEED_DOMAINS, domain)])).toEqual([
      ["making", "#E8825A"],
      ["living_systems", "#5FB98C"],
      ["symbols_math", "#6C8CE8"],
      ["word_craft", "#C98BD9"],
      ["sound_music", "#E8B84B"],
      ["movement_body", "#E56B8C"],
      ["visual_design", "#4FC0C7"],
      ["social_world", "#7E8CE0"],
    ]);
  });

  it("derives hues from the supplied order and wraps the twelve-color ramp", () => {
    const reversedDomains = [...SEED_DOMAINS].reverse();
    const thirteenDomains = Array.from({ length: 13 }, (_, index) => `domain-${index}`);

    expect(resolveDomainHue(reversedDomains, "making")).toBe(HUE_RAMP[7]);
    expect(resolveDomainHue(thirteenDomains, "domain-12")).toBe(HUE_RAMP[0]);
  });

  it("rejects a domain absent from the supplied catalog order", () => {
    expect(() => resolveDomainHue(SEED_DOMAINS, "unknown_domain")).toThrow();
  });
});
