import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const mod = readFileSync(fileURLToPath(new URL("../widget-logic.mjs", import.meta.url)), "utf8");

// The inline widget must contain the exact decide() body from the source-of-truth module,
// so the page can never silently drift from the tested logic.
function decideBody(src) {
  const start = src.indexOf("export function decide(s) {");
  expect(start).toBeGreaterThan(-1);
  return src.slice(start + "export function decide(s) {".length).replace(/\s+/g, " ").trim().slice(0, 400);
}

describe("inline widget mirrors widget-logic.mjs", () => {
  it("embeds the source-of-truth decide() body", () => {
    const body = decideBody(mod);
    expect(html.replace(/\s+/g, " ")).toContain(body);
  });
  it("exposes machine-checkable result data attributes", () => {
    for (const attr of ["data-branch", "data-risk", "data-escalate", "data-autonomy", "data-structure", "data-decouple"]) {
      expect(html, attr).toContain(attr);
    }
  });
});
