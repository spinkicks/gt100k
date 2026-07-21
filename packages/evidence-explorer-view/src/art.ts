/**
 * Golden art tokens — the "Provenance Observatory" identity (§U8.11, exact).
 * OKLCH-reasoned, contrast-verified against `--void`. State color is always paired with a
 * body-shape/glyph + text (FR-E04); text labels live in `ink`/`inkMuted`; hashes in `ink` mono.
 */

/** Exact hex palette. `ink` on `void` ≈16:1 (AAA); `inkMuted` on `void` ≈8:1 (AA+). */
export const PALETTE = {
  // Surfaces & ink.
  void: "#0A0E17",
  panel: "#121826",
  panel2: "#1A2233",
  line: "#2A3346",
  ink: "#EAF0FB",
  inkMuted: "#9AA7C2",
  // Semantic state / actor.
  focus: "#7DD3FC",
  verify: "#34E5B0",
  tamper: "#FF5A6E",
  human: "#FFD166",
  model: "#8B9BC7",
  // Node-type hues.
  artifact: "#E9C46A",
  attempt: "#4CC9F0",
  transformation: "#5E7CE2",
  claim: "#B892FF",
  assistance: "#3DDC97",
  review: "#FFB03A",
  contribution: "#F072C0",
  outcome: "#FF7A8A",
} as const;

export type PaletteToken = keyof typeof PALETTE;

/** Contrast-axis pairing: geometric display + humanist body + mono for hashes/counters. */
export const TYPOGRAPHY = {
  fontDisplay: '"Space Grotesk",ui-sans-serif,system-ui,sans-serif',
  fontBody: '"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif',
  fontMono: '"JetBrains Mono",ui-monospace,"SFMono-Regular","Cascadia Code",monospace',
  scale: {
    // rem = size; lh = line-height; ls = letter-spacing (em); w = font-weight.
    display: { rem: 2.5, lh: 1.05, ls: -0.02, w: 700 },
    h1: { rem: 1.75, lh: 1.1, ls: -0.01, w: 600 },
    h2: { rem: 1.25, lh: 1.2, ls: 0, w: 600 },
    body: { rem: 1.0, lh: 1.5, ls: 0, w: 400 },
    label: { rem: 0.8125, lh: 1.4, ls: 0.01, w: 500 },
    mono: { rem: 0.8125, lh: 1.5, ls: 0, w: 500 },
  },
  numeric: "tabular-nums",
} as const;
