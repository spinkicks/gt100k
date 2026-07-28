/**
 * The design system's child mode exists, and until now nothing set it.
 *
 * `design-tokens/contract.css` has carried `[data-mood="child"]` with a 56px `--control-min` and a
 * 76px primary target since it was written, citing the child-UX literature, and this app never
 * imported the package. It shipped 38px cabin pills and a 10.9px badge instead.
 *
 * Two things are asserted here and they fail in different ways.
 *
 * The import ORDER is load-bearing. The contract and this app both define `--ink`, `--font-body`
 * and `--font-display`, and at equal specificity the later declaration wins. Contract first means
 * the cabin keeps its own art direction and takes the sizing scale; swap them and the whole game
 * silently repaints in the console's palette, which no test would otherwise notice because nothing
 * would throw.
 *
 * And the MODE has to actually be set, on the document, or every `var(--control-min)` in this app
 * quietly falls through to its fallback and the tokens are decorative.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string): string => readFileSync(join(__dirname, p), "utf8");

describe("the token contract is wired, in the order that keeps the art", () => {
  const main = read("main.tsx");

  it("imports the contract", () => {
    expect(main).toContain("@gt100k/design-tokens/contract.css");
  });

  it("imports it BEFORE this app's theme, so the three shared variables stay ours", () => {
    const contract = main.indexOf("@gt100k/design-tokens/contract.css");
    const theme = main.indexOf('"./theme.css"');
    expect(contract).toBeGreaterThan(-1);
    expect(theme).toBeGreaterThan(-1);
    expect(contract).toBeLessThan(theme);
  });
});

describe("child mode is on", () => {
  it("is set on the document, not left to a component to remember", () => {
    expect(read("../index.html")).toContain('data-mood="child"');
  });
});

describe("the targets read from the token rather than from their contents", () => {
  const css = read("map/MapScreen.css");

  it("gives the cabin pill a minimum height", () => {
    // Sized by padding and label alone it came out at ~38px, which is under even the 44px WCAG
    // 2.5.5 floor, let alone the 56px child figure.
    expect(css).toMatch(/\.map-screen-node\s*\{[^}]*min-height:\s*var\(--control-min/s);
  });

  it("gives the cabin's own name the base size", () => {
    // 0.95rem before, which is 15px and under the contract's floor. It is also the content of the
    // control, so it should be the largest thing in it.
    expect(css).toMatch(/\.map-screen-node\s*\{[^}]*font-size:\s*var\(--text-base/s);
  });

  it("keeps the status badge legible but under the name, not over it", () => {
    // Raising this to `--text-base` was the first attempt and it was wrong: the badge then outsized
    // the label, so the loudest word on an unavailable cabin was UNAVAILABLE rather than what the
    // cabin is. It was 0.68rem (10.9px) in caps before that, which was unreadable. Both bounds
    // matter, so both are asserted.
    const badge = css.slice(css.indexOf(".map-screen-node-badge"));
    const rem = Number(/font-size:\s*([\d.]+)rem/.exec(badge)?.[1] ?? "0");
    expect(rem).toBeGreaterThanOrEqual(0.85);
    expect(rem).toBeLessThan(1);
    // Caps and letter-spacing cost legibility on top of size, and this is the one place we want
    // small, so it does not spend that budget twice.
    expect(badge.slice(0, badge.indexOf("}"))).not.toContain("text-transform: uppercase");
  });
});
