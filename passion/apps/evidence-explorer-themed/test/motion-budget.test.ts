/**
 * UE048 — the 60fps performance budget & reduced-motion parity (SC-E03 / SC-E21 / SC-E22).
 *
 * The scene animations must stay on the compositor: "in DOM only `transform`/`opacity`/`filter`
 * animate (no layout thrash)" (§U5 pillar). Live 60fps / GPU-degrade / no-WebGL fallback need a real
 * browser+GPU and are `manual:` (headless env has no browser libs). Here we pin the machine-checkable
 * guarantees that make 60fps achievable and keep them from regressing:
 *   1. every `@keyframes` block animates ONLY transform/opacity/filter;
 *   2. NOTHING (keyframe or transition) animates a layout-triggering property (no reflow/thrash);
 *   3. a global `prefers-reduced-motion` reset neutralises animation + transition durations;
 *   4. every motion-table row has a reduced equivalent that is instant or ≤150ms (SC-E03 scenario 1).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { RESOLVE_MOTION, resolveMotion } from "@gt100k/evidence-explorer-view";
import { describe, expect, it } from "vitest";

const css = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

/** Properties whose animation forces layout (reflow) — banned from all transitions & keyframes. */
const LAYOUT_TRIGGERING = [
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  "inset",
  "margin",
  "padding",
  "gap",
  "flex",
  "flex-basis",
  "font-size",
  "line-height",
  "letter-spacing",
  "border-width",
];

/** Extract every `@keyframes NAME { … }` body (brace-balanced). */
function keyframeBlocks(source: string): { name: string; body: string }[] {
  const out: { name: string; body: string }[] = [];
  const re = /@keyframes\s+([\w-]+)\s*\{/g;
  let m: RegExpExecArray | null = re.exec(source);
  while (m !== null) {
    let depth = 1;
    let i = re.lastIndex;
    for (; i < source.length && depth > 0; i++) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}") depth--;
    }
    out.push({ name: m[1] ?? "", body: source.slice(re.lastIndex, i - 1) });
    re.lastIndex = i;
    m = re.exec(source);
  }
  return out;
}

/** Property names declared inside a CSS block (`prop: value;`), lower-cased. */
function declaredProps(block: string): string[] {
  return [...block.matchAll(/(^|[{;\s])([\w-]+)\s*:/g)]
    .map((mm) => (mm[2] ?? "").toLowerCase())
    .filter(Boolean);
}

describe("UE048 · GPU-friendly scene animations (SC-E21)", () => {
  const blocks = keyframeBlocks(css);

  it("finds the observatory keyframes", () => {
    expect(blocks.length).toBeGreaterThan(0);
  });

  it("every @keyframes animates ONLY transform / opacity / filter", () => {
    const allowed = new Set(["transform", "opacity", "filter"]);
    for (const { name, body } of blocks) {
      for (const prop of declaredProps(body)) {
        expect(
          allowed.has(prop),
          `@keyframes ${name} animates non-compositor property "${prop}"`,
        ).toBe(true);
      }
    }
  });
});

describe("UE048 · no layout thrash (SC-E21) — nothing animates a layout property", () => {
  it("no @keyframes touches a layout-triggering property", () => {
    for (const { name, body } of keyframeBlocks(css)) {
      for (const prop of declaredProps(body)) {
        expect(
          LAYOUT_TRIGGERING.includes(prop),
          `@keyframes ${name} animates layout-triggering "${prop}"`,
        ).toBe(false);
      }
    }
  });

  it("no `transition:` shorthand animates a layout-triggering property", () => {
    // Grab every `transition: …;` declaration (not transition-property/-duration sub-props).
    const transitions = [...css.matchAll(/(^|[{;\s])transition:\s*([^;]+);/g)].map((m) =>
      (m[2] ?? "").toLowerCase(),
    );
    expect(transitions.length).toBeGreaterThan(0);
    for (const decl of transitions) {
      // A property token is banned only when it appears as a standalone word in the list.
      for (const prop of LAYOUT_TRIGGERING) {
        const wordRe = new RegExp(`(^|[,\\s])${prop}(\\b|$)`);
        expect(wordRe.test(decl), `transition animates layout property "${prop}": ${decl}`).toBe(
          false,
        );
      }
    }
  });
});

describe("UE048 · reduced-motion parity (SC-E03)", () => {
  it("a global prefers-reduced-motion block neutralises animation + transition durations", () => {
    const idx = css.indexOf("prefers-reduced-motion");
    expect(idx).toBeGreaterThan(-1);
    const block = css.slice(idx, idx + 600);
    expect(block).toMatch(/animation-duration:\s*0/);
    expect(block).toMatch(/transition-duration:\s*0/);
  });

  it("every motion-table row has a reduced equivalent that is instant or ≤150ms", () => {
    const kinds = Object.keys(RESOLVE_MOTION) as (keyof typeof RESOLVE_MOTION)[];
    expect(kinds.length).toBeGreaterThan(0);
    for (const kind of kinds) {
      const reduced = resolveMotion(kind, { reducedMotion: true });
      expect(reduced.mode).toBe("reduced");
      expect(
        reduced.durationMs,
        `motion "${kind}" reduced duration ${reduced.durationMs}ms exceeds the 150ms parity bound`,
      ).toBeLessThanOrEqual(150);
    }
  });

  it("the animated column is never a bare no-op — continuous scene motions have a real duration", () => {
    // Sanity: reduced ≠ animated for the flagship scene motions (they visibly calm down).
    for (const kind of ["flyIn", "verifyWave", "sealForge", "bodyReveal"] as const) {
      const animated = resolveMotion(kind, { reducedMotion: false });
      const reduced = resolveMotion(kind, { reducedMotion: true });
      expect(animated.durationMs).toBeGreaterThan(reduced.durationMs);
    }
  });
});
