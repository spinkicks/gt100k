/**
 * Contrast, computed from the shipped stylesheets rather than eyeballed.
 *
 * WHAT WENT WRONG, so the shape of this test makes sense. Every puzzle is mounted inside
 * `.gadget-overlay-panel`, which is parchment. BalanceScale.css set its text colours from the tokens
 * annotated "on dark wood" — `--cream`, `--cream-soft`, `--ember-bright` — so the rule, the status
 * line and the sentence that reveals the answer were all rendered at between 1.02:1 and 1.79:1
 * against the surface they actually sat on. Reported as "the text is white on white", and correct.
 *
 * A unit test cannot see a screenshot, but it can do the arithmetic. This one reads theme.css for the
 * token values, reads BalanceScale.css for every rule that sets `color`, and requires each one to
 * declare which surface it sits on — the puzzle paints exactly two, the parchment panel and its own
 * dark wood scale. A new coloured text rule with no declared surface fails the first test, so the
 * class of bug cannot come back silently.
 *
 * The 4.5:1 bar is WCAG 2.1 AA for normal text. Nothing here relies on the large-text exception,
 * deliberately: `docs/research/passion-pipeline/07-child-facing-ux-6-8.md` is a document about a
 * surface for children, and the one row of its build audit that survives at this app's 9–12 band is
 * the type-size floor.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = readFileSync(resolve(HERE, "../../theme.css"), "utf8");
/**
 * Comments come out FIRST, before anything looks for a rule. This file's own comments quote CSS
 * (`.bs-root { color: var(--cream) }`) and a block-matching regex run over the raw text splits inside
 * them, which produced a "selector" made of prose on the first attempt at this test.
 */
const css = readFileSync(resolve(HERE, "./BalanceScale.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

/** Token name → hex, straight out of theme.css so the test cannot drift from the source of truth. */
const TOKENS: Record<string, string> = Object.fromEntries(
  [...theme.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [
    m[1] as string,
    m[2] as string,
  ]),
);

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

function relativeLuminance([r, g, b]: Rgb): number {
  const channel = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

/** Composite a translucent layer over an opaque one, the way the browser does. */
function over(src: Rgb, alpha: number, dst: Rgb): Rgb {
  return src.map((c, i) => Math.round(c * alpha + (dst[i] as number) * (1 - alpha))) as Rgb;
}

/**
 * The two surfaces this puzzle's text can land on, each as the worst case a gradient can produce.
 *
 * `panel` — `.gadget-overlay-panel` runs `--parchment-hi` → `--parchment` → `--parchment-edge`, so
 * light text is worst on the lightest patch and dark text on the darkest; both extremes are listed
 * and every rule must clear the bar against all of them.
 *
 * `wood` — `.bs-scale` runs `--wood` → `--wood-deep` under a `.bs-pan` wash of
 * `rgba(246, 231, 200, 0.09)`, which is the lightest the pan surface ever gets and therefore the
 * hardest case for cream text.
 */
const SURFACES: Record<string, Rgb[]> = {
  panel: [
    rgb(TOKENS["parchment-hi"] as string),
    rgb(TOKENS.parchment as string),
    rgb(TOKENS["parchment-edge"] as string),
  ],
  wood: [
    over([246, 231, 200], 0.09, rgb(TOKENS.wood as string)),
    over([246, 231, 200], 0.03, rgb(TOKENS["wood-deep"] as string)),
  ],
  /** Rail and palette pills paint their own parchment face. */
  pill: [rgb(TOKENS["parchment-hi"] as string), rgb(TOKENS["parchment-edge"] as string)],
  /** `.bs-move-lit` swaps its face for ember. */
  ember: [rgb(TOKENS["ember-bright"] as string), rgb(TOKENS.ember as string)],
  /** `.bs-note` gives the answer its own opaque chip so the panel gradient cannot reach it. */
  chip: [rgb(TOKENS["parchment-hi"] as string)],
  /** The stone faces, which are pigment rather than token (see the note in BalanceScale.css). */
  stone: [rgb("#cfd4da"), rgb("#a7aeb6")],
};

/**
 * Which surface each `color`-setting selector sits on. Every selector in the stylesheet must appear
 * here — that is asserted below — so this table is the place a reviewer can check the one fact a
 * screenshot would have shown them.
 */
const SURFACE_OF: Record<string, keyof typeof SURFACES> = {
  ".bs-root": "panel",
  ".bs-back,.bs-next,.bs-reset,.bs-move": "pill",
  ".bs-rule": "panel",
  ".bs-stone": "stone",
  ".bs-pan-readout": "wood",
  ".bs-status": "panel",
  ".bs-note": "chip",
  ".bs-rail-split": "pill",
  ".bs-rail-glyph": "pill",
  ".bs-rail-split-blocked .bs-rail-glyph": "pill",
};

/** Every rule in BalanceScale.css that sets a text colour, as (selector, token). */
function colouredRules(): Array<{ selector: string; token: string }> {
  const out: Array<{ selector: string; token: string }> = [];
  for (const block of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (block[1] as string).trim();
    const colour = /(?:^|[\s;])color:\s*var\(--([a-z-]+)\)/.exec(block[2] as string);
    if (!colour || selector.startsWith("@") || /^\d/.test(selector)) continue;
    out.push({
      selector: selector.replace(/\s*,\s*/g, ",").replace(/\s+/g, " "),
      token: colour[1] as string,
    });
  }
  return out;
}

describe("BalanceScale text contrast", () => {
  test("theme.css parsed, so the numbers below are the shipped token values", () => {
    expect(TOKENS.cream).toBe("#f2e6cd");
    expect(TOKENS.ink).toBe("#33230f");
    expect(TOKENS.parchment).toBe("#f3e4c6");
  });

  test("every rule that sets a text colour declares which surface it is on", () => {
    const found = colouredRules().map((r) => r.selector);
    expect(found.length).toBeGreaterThan(6);
    for (const selector of found) expect(Object.keys(SURFACE_OF)).toContain(selector);
  });

  test("and every one of them clears WCAG AA (4.5:1) on that surface", () => {
    const report: Record<string, string> = {};
    for (const { selector, token } of colouredRules()) {
      const fg = rgb(TOKENS[token] as string);
      const surface = SURFACE_OF[selector] as keyof typeof SURFACES;
      const worst = Math.min(...(SURFACES[surface] as Rgb[]).map((bg) => contrastRatio(fg, bg)));
      report[`${selector} (--${token} on ${surface})`] = `${worst.toFixed(2)}:1`;
      // Reported per selector rather than as one boolean: a failure should name the rule and the
      // number, because the number is what decides which token replaces it.
      expect(
        worst,
        `${selector}: --${token} on ${surface} is only ${worst.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(4.5);
    }
    // Kept as an intentional record of what the puzzle actually measures today.
    expect(Object.keys(report).length).toBe(colouredRules().length);
  });

  test("the shipped bug stays described: the old tokens really were white on white", () => {
    // 1.02:1 for the rule and the whole root, 1.79:1 at best for the status line, 1.52:1 at best for
    // the sentence that gives the answer. Not a subjective call, and not a near miss.
    const panel = SURFACES.panel as Rgb[];
    const worstOn = (token: string): number =>
      Math.min(...panel.map((bg) => contrastRatio(rgb(TOKENS[token] as string), bg)));
    expect(worstOn("cream")).toBeLessThan(1.5);
    expect(worstOn("cream-soft")).toBeLessThan(2);
    expect(worstOn("ember-bright")).toBeLessThan(2);
    // And the tokens that replaced them are not marginal either.
    expect(worstOn("ink")).toBeGreaterThan(9);
  });

  test("no rule in this file paints text with a raw hex", () => {
    // The stone faces are pigment and stay literal, but their *text* is a token. Anything else with a
    // hardcoded text colour is outside the token set and therefore outside the annotated ratios.
    for (const block of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const declarations = block[2] as string;
      expect(/(?:^|[\s;])color:\s*#/.test(declarations)).toBe(false);
    }
  });
});
