import { describe, expect, it } from "vitest";
import {
  CABIN,
  HUE_RAMP,
  MAP_COLOR_SCRIPT,
  PALETTE,
  TYPOGRAPHY,
  resolveDomainHue,
} from "../src/index";

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

  it("pins the additive Emberwood CABIN material tint palette (art bible §3.1/§3.4)", () => {
    expect(CABIN).toEqual({
      woodHoney: "#C89A5E",
      woodOak: "#A87C4A",
      woodWalnut: "#6B4A2E",
      woodCocoa: "#4A3320",
      woodDrift: "#B9A484",
      fireEmber: "#FF7A3C",
      fireFlame: "#FFB25A",
      fireSpark: "#FF9E5E",
      lantern: "#FFD166",
      windowSpill: "#FFC08A",
      candle: "#FFE0A8",
      forestPine: "#5E7B4E",
      forestDeep: "#37503E",
      moss: "#8CA55E",
      terracotta: "#B5623A",
      leafRust: "#9C5A32",
      verdigris: "#7F9E8E",
      duskSkylight: "#A9C2E8",
      duskShadow: "#6E6A8E",
      duskDeep: "#514D74",
      duskWindow: "#7C93B8",
      plaster: "#EAD7B4",
      parchment: "#F0E4C8",
      ceramic: "#D8B48C",
      brass: "#B98A4E",
      leather: "#8B5A3C",
      woolWarm: "#C48A6A",
      woolCream: "#E6D3B0",
    });
  });

  it("keeps the cabin identity hues aligned with HUE_RAMP[0..2] across map + material tokens", () => {
    // Map↔cabin continuity (§12): the same three hues identify the cabins on the DOM map, in the
    // material palette, and in the shipped HUE_RAMP. If these ever drift, the cut breaks.
    expect([MAP_COLOR_SCRIPT.cabinMusic, MAP_COLOR_SCRIPT.cabinCode, MAP_COLOR_SCRIPT.cabinArt]).toEqual(
      [HUE_RAMP[0], HUE_RAMP[1], HUE_RAMP[2]],
    );
    expect(MAP_COLOR_SCRIPT.hearthGlow).toBe(CABIN.fireSpark);
    expect(CABIN.fireSpark).toBe(PALETTE.spark);
  });

  it("pins the DOM map color script — a warm golden-hour clearing, blue-violet shadow (§6)", () => {
    expect(MAP_COLOR_SCRIPT).toEqual({
      skyTop: "#FCEAC2",
      skyLow: "#F4B074",
      treeline: "#6E5A4E",
      groundLit: "#C9B583",
      groundShade: "#8E8A5E",
      grassTuft: "#9FB56A",
      path: "#D8B888",
      pathPlank: "#B98A5E",
      waterPond: "#8FC7CE",
      waterGlint: "#FFD8A0",
      softShadow: "#5E5880",
      chimneySmoke: "#CDBBA6",
      firefly: "#FFD98A",
      emberSpark: "#FF7A3C",
      hearthGlow: "#FF9E5E",
      cabinMusic: "#E8825A",
      cabinCode: "#5FB98C",
      cabinArt: "#6C8CE8",
    });
  });
});
