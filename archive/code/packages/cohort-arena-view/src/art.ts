export const PALETTE = {
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

export const TYPOGRAPHY = {
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

export const STATE_CUES = {
  assigned: { color: PALETTE.form, icon: "hex", text: "Assigned" },
  unassigned: { color: PALETTE.pending, icon: "bench", text: "Still compiling" },
  satisfied: { color: PALETTE.form, icon: "check", text: "Satisfied" },
  paused: { color: PALETTE.safeguard, icon: "shield", text: "Paused" },
  suppressed: {
    color: PALETTE.locked,
    icon: "veil",
    text: "Confidence low — prompts suppressed",
  },
} as const;
