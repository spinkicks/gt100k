// Theme registry + apply/persist helpers. Nine presets across three families; each id matches a
// [data-theme="..."] block in globals.css. The chip colors are only for the switcher swatches.
export type ThemeFamily = "cartoon" | "minimal" | "tech";

export interface ThemePreset {
  readonly id: string;
  readonly name: string;
  readonly chips: readonly [string, string, string];
}

export interface ThemeGroup {
  readonly family: ThemeFamily;
  readonly label: string;
  readonly blurb: string;
  readonly presets: readonly ThemePreset[];
}

export const THEME_GROUPS: readonly ThemeGroup[] = [
  {
    family: "cartoon",
    label: "Cartoon",
    blurb: "Bold and playful",
    presets: [
      { id: "cartoon-sun", name: "Sunbeam", chips: ["#f7d23f", "#7c8cf8", "#ff7a66"] },
      { id: "cartoon-berry", name: "Berry", chips: ["#f6c9de", "#a06cd5", "#ff5d8f"] },
      { id: "cartoon-mint", name: "Mint", chips: ["#a7ead0", "#ff8a5b", "#3a86ff"] },
    ],
  },
  {
    family: "minimal",
    label: "Minimal",
    blurb: "Clean and calm",
    presets: [
      { id: "minimal-slate", name: "Slate", chips: ["#f7f8fa", "#2563eb", "#dde2ea"] },
      { id: "minimal-ink", name: "Ink", chips: ["#fafaf9", "#0b0b0c", "#e2e2dd"] },
    ],
  },
  {
    family: "tech",
    label: "Tech",
    blurb: "Code and computers",
    presets: [
      { id: "tech-terminal", name: "Terminal", chips: ["#0a0f0b", "#39ff5f", "#223d22"] },
      { id: "tech-synth", name: "Synthwave", chips: ["#130a22", "#22d3ee", "#ff2fb9"] },
    ],
  },
];

export const DEFAULT_THEME = "cartoon-sun";
export const THEME_KEY = "gt100k.project-studio.theme";
export const ALL_THEME_IDS: readonly string[] = THEME_GROUPS.flatMap((g) =>
  g.presets.map((p) => p.id),
);

export function applyTheme(id: string): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", id);
  }
  try {
    window.localStorage.setItem(THEME_KEY, id);
  } catch {
    /* storage unavailable; theme still applies for the session */
  }
}

export function readActiveTheme(): string {
  if (typeof document !== "undefined") {
    const cur = document.documentElement.getAttribute("data-theme");
    if (cur && ALL_THEME_IDS.includes(cur)) return cur;
  }
  return DEFAULT_THEME;
}
