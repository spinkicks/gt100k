import { describe, expect, it } from "vitest";

import { PALETTE, STATE_CUES, TYPOGRAPHY } from "../src/art.js";

const EXPECTED_PALETTE = {
  deck: "#0B1220",
  deck2: "#111B2E",
  deck3: "#182740",
  ink: "#0C1524",
  inkHi: "#EAF2FB",
  inkMut: "#9FB3CC",
  peer: "#38BDF8",
  peerHi: "#7DD3FC",
  form: "#34D399",
  floor: "#2DD4BF",
  gain: "#FBBF24",
  gainHi: "#FCD34D",
  pending: "#A78BFA",
  churn: "#F472B6",
  safeguard: "#F0709A",
  locked: "#4B5C72",
  focus: "#FFD166",
} as const;

const EXPECTED_TYPOGRAPHY = {
  families: {
    display: '"Space Grotesk","Inter",ui-sans-serif,system-ui,sans-serif',
    body: '"Inter",ui-sans-serif,system-ui,sans-serif',
    mono: '"JetBrains Mono",ui-monospace,"SF Mono",Menlo,monospace',
  },
  scale: {
    display: { family: "display", rem: 2.25, lineHeight: 1.06, tracking: "-0.02em", weight: 600 },
    h1: { family: "display", rem: 1.5, lineHeight: 1.12, tracking: "-0.01em", weight: 600 },
    h2: { family: "body", rem: 1.125, lineHeight: 1.25, tracking: "0", weight: 600 },
    body: { family: "body", rem: 1, lineHeight: 1.5, tracking: "0", weight: 400 },
    label: { family: "body", rem: 0.8125, lineHeight: 1.4, tracking: "+0.01em", weight: 500 },
    data: { family: "mono", rem: 0.9375, lineHeight: 1.3, tracking: "0", weight: 500 },
  },
  numeric: "tabular-nums",
} as const;

const EXPECTED_STATE_CUES = {
  assigned: { color: EXPECTED_PALETTE.form, icon: "hex", text: "Assigned" },
  unassigned: { color: EXPECTED_PALETTE.pending, icon: "bench", text: "Still compiling" },
  satisfied: { color: EXPECTED_PALETTE.form, icon: "check", text: "Satisfied" },
  paused: { color: EXPECTED_PALETTE.safeguard, icon: "shield", text: "Paused" },
  suppressed: {
    color: EXPECTED_PALETTE.locked,
    icon: "veil",
    text: "Confidence low — prompts suppressed",
  },
} as const;

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);

  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit hex color, received ${hex}`);
  }

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
}

function contrastRatio(foreground: string, background: string): number {
  const luminances = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (left, right) => right - left,
  );
  return (luminances[0]! + 0.05) / (luminances[1]! + 0.05);
}

describe("Compiler Observatory art tokens", () => {
  it("pins every palette token to its golden hex", () => {
    expect(PALETTE).toEqual(EXPECTED_PALETTE);
  });

  it("pins the no-fetch font families, type scale, and numeric feature", () => {
    expect(TYPOGRAPHY).toEqual(EXPECTED_TYPOGRAPHY);
  });

  it("pairs every semantic state color with an icon and text", () => {
    expect(STATE_CUES).toEqual(EXPECTED_STATE_CUES);

    for (const cue of Object.values(STATE_CUES)) {
      expect(Object.values(PALETTE)).toContain(cue.color);
      expect(cue.icon.length).toBeGreaterThan(0);
      expect(cue.text.length).toBeGreaterThan(0);
    }
  });

  it("keeps every required foreground and background pair at WCAG AA contrast", () => {
    const requiredPairs = [
      [PALETTE.inkHi, PALETTE.deck],
      [PALETTE.inkHi, PALETTE.deck2],
      [PALETTE.inkHi, PALETTE.deck3],
      [PALETTE.inkMut, PALETTE.deck],
      [PALETTE.ink, PALETTE.peer],
      [PALETTE.ink, PALETTE.peerHi],
      [PALETTE.ink, PALETTE.form],
      [PALETTE.ink, PALETTE.floor],
      [PALETTE.ink, PALETTE.gain],
      [PALETTE.ink, PALETTE.gainHi],
      [PALETTE.ink, PALETTE.pending],
      [PALETTE.ink, PALETTE.churn],
      [PALETTE.ink, PALETTE.safeguard],
      [PALETTE.inkHi, PALETTE.locked],
      [PALETTE.ink, PALETTE.focus],
    ] as const;

    for (const [foreground, background] of requiredPairs) {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
