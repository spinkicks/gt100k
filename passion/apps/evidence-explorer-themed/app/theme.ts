/**
 * Theme registry for the themed evidence-explorer demo. Ported from the project-studio theme system:
 * a `data-theme` attribute on <html> is the single switch; every colour lives as a CSS custom
 * property in globals.css and cascades to both the DOM chrome AND the 3D cosmos (whose palette reads
 * the same computed variables — see components/cosmos/palette.ts). The TS layer only carries preset
 * ids/names/swatch chips + apply/read helpers; it holds no colour values of its own.
 */

export type ThemeFamily = "observatory" | "warm" | "minimal" | "tech";

export interface ThemePreset {
  readonly id: string;
  readonly name: string;
  /** Three swatch colours previewed in the switcher (surface, accent, accent-2). */
  readonly chips: readonly [string, string, string];
}

export interface ThemeGroup {
  readonly family: ThemeFamily;
  readonly label: string;
  readonly blurb: string;
  readonly presets: readonly ThemePreset[];
}

/**
 * Eight presets across four families. The `observatory-graphite` default is the native look (:root
 * in globals.css). The other seven echo the project-studio presets' accent identities, re-skinned as
 * coherent observatory palettes so the 3D constellation stays readable.
 */
export const THEME_GROUPS: readonly ThemeGroup[] = [
  {
    family: "observatory",
    label: "Observatory",
    blurb: "native palette",
    presets: [
      { id: "observatory-graphite", name: "Graphite", chips: ["#0c0d11", "#6db8e8", "#38d9a6"] },
    ],
  },
  {
    family: "warm",
    label: "Warm",
    blurb: "warm surfaces, vivid accents",
    presets: [
      { id: "warm-sunbeam", name: "Sunbeam", chips: ["#1d1710", "#ffd166", "#ff6b57"] },
      { id: "warm-berry", name: "Berry", chips: ["#1e1020", "#d59bff", "#ff5d8f"] },
      { id: "warm-mint", name: "Mint", chips: ["#0f1d18", "#39ff9f", "#ff8a5b"] },
    ],
  },
  {
    family: "minimal",
    label: "Minimal",
    blurb: "quiet structure",
    presets: [
      { id: "minimal-slate", name: "Slate", chips: ["#f7f8fa", "#2563eb", "#dde2ea"] },
      { id: "minimal-ink", name: "Ink", chips: ["#0a0a0b", "#f4f4f2", "#e8607a"] },
    ],
  },
  {
    family: "tech",
    label: "Tech",
    blurb: "high contrast",
    presets: [
      { id: "tech-terminal", name: "Terminal", chips: ["#0a0f0b", "#39ff5f", "#223d22"] },
      { id: "tech-synth", name: "Synthwave", chips: ["#130a22", "#22d3ee", "#ff2fb9"] },
    ],
  },
];

export const DEFAULT_THEME = "observatory-graphite";
export const THEME_KEY = "gt100k.evidence-explorer.theme";
/** Broadcast on every applyTheme so client components (e.g. the 3D scene) can re-read live vars. */
export const THEME_EVENT = "gt100k:themechange";

export const ALL_THEME_IDS: readonly string[] = THEME_GROUPS.flatMap((g) =>
  g.presets.map((p) => p.id),
);

/** Set the theme on <html>, persist it, and notify listeners. Safe to call on the client only. */
export function applyTheme(id: string): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", id);
    document.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: id }));
  }
  try {
    window.localStorage.setItem(THEME_KEY, id);
  } catch {
    /* storage unavailable; theme still applies for the session */
  }
}

/** Read the currently-applied theme from the <html> attribute, falling back to the default. */
export function readActiveTheme(): string {
  if (typeof document !== "undefined") {
    const cur = document.documentElement.getAttribute("data-theme");
    if (cur && ALL_THEME_IDS.includes(cur)) return cur;
  }
  return DEFAULT_THEME;
}
