import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { assertConformant, listIconSvgs } from "./icon-conformance";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..", "app", "pursuit-icons");

describe("every staged icon conforms to the locked style", () => {
  const svgs = listIconSvgs(SRC);
  it("finds staged icons", () => {
    expect(svgs.length).toBeGreaterThan(0);
  });
  it.each(svgs)("%s uses only palette colors and the locked stroke", (path) => {
    expect(assertConformant(readFileSync(path, "utf8"))).toEqual([]);
  });
});

describe("assertConformant contract", () => {
  const minimalValid = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
    <circle cx="120" cy="120" r="40" fill="#6ea7ef" stroke="#002a3a" stroke-width="9"/>
    <circle cx="110" cy="110" r="5" fill="#002a3a"/>
  </svg>`;

  it("accepts a minimal valid icon that uses #002a3a as a fill for an eye dot", () => {
    expect(assertConformant(minimalValid)).toEqual([]);
  });

  it("rejects a style attribute setting fill", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <circle cx="120" cy="120" r="40" style="fill:#ff0000"/>
    </svg>`;
    expect(assertConformant(svg)).not.toEqual([]);
  });

  it("rejects a <style> block", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <style>.a { fill: #ff0000; }</style>
      <circle class="a" cx="120" cy="120" r="40"/>
    </svg>`;
    expect(assertConformant(svg)).not.toEqual([]);
  });

  it("rejects a non-palette fill", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <circle cx="120" cy="120" r="40" fill="#ff0000" stroke="#002a3a" stroke-width="9"/>
    </svg>`;
    expect(assertConformant(svg)).not.toEqual([]);
  });

  it("rejects a non-navy stroke", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <circle cx="120" cy="120" r="40" fill="#6ea7ef" stroke="#123456" stroke-width="9"/>
    </svg>`;
    expect(assertConformant(svg)).not.toEqual([]);
  });

  it("rejects a stroke-width other than the locked width", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <circle cx="120" cy="120" r="40" fill="#6ea7ef" stroke="#002a3a" stroke-width="7"/>
    </svg>`;
    expect(assertConformant(svg)).not.toEqual([]);
  });

  it("rejects a gradient", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <defs><linearGradient id="g"></linearGradient></defs>
      <circle cx="120" cy="120" r="40" fill="url(#g)" stroke="#002a3a" stroke-width="9"/>
    </svg>`;
    expect(assertConformant(svg)).not.toEqual([]);
  });
});
