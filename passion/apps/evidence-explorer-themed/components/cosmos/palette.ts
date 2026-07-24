/**
 * Cosmos palette bridge (themed demo) — reads the LIVE CSS custom properties so the 3D scene follows
 * the active `data-theme` exactly like the DOM chrome. Colour therefore has ONE source (globals.css
 * tokens); the golden `PALETTE` from `@gt100k/evidence-explorer-view` is kept only as a fallback for
 * SSR / pre-hydration (the cosmos is `ssr:false`, so in practice reads happen client-side).
 *
 * The 3D subtree is remounted on theme change (keyed on the active theme in ObservatoryStage), which
 * re-invokes these reads and rebuilds the Three.js materials/lights with the new hexes.
 */
import { type NodeColorRole, PALETTE } from "@gt100k/evidence-explorer-view";

/** Read a CSS custom property off <html>, trimmed; fall back to the golden default off-DOM. */
function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Type-hue for a node's colour role (Artifact…Outcome) — role names map 1:1 to `--<role>` tokens. */
export function roleHex(role: NodeColorRole): string {
  return cssVar(`--${role}`, PALETTE[role]);
}

/**
 * Semantic / surface tokens the cosmos needs, resolved live per access via getters so a render after
 * a theme switch (post-remount) picks up the current values. The `--ink-muted` CSS token maps to the
 * view model's `inkMuted`.
 */
export const COSMOS = {
  get void(): string {
    return cssVar("--void", PALETTE.void);
  },
  get line(): string {
    return cssVar("--line", PALETTE.line);
  },
  get ink(): string {
    return cssVar("--ink", PALETTE.ink);
  },
  get inkMuted(): string {
    return cssVar("--ink-muted", PALETTE.inkMuted);
  },
  get focus(): string {
    return cssVar("--focus", PALETTE.focus);
  },
  get verify(): string {
    return cssVar("--verify", PALETTE.verify);
  },
  get tamper(): string {
    return cssVar("--tamper", PALETTE.tamper);
  },
  get human(): string {
    return cssVar("--human", PALETTE.human);
  },
  get model(): string {
    return cssVar("--model", PALETTE.model);
  },
} as const;
