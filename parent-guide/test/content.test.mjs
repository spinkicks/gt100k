import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");

const REQUIRED_ANCHORS = [
  "start", "stance", "read-your-child", "how-talent-develops", "the-moves",
  "the-traps", "big-questions", "when-it-gets-hard", "checkin", "sources", "self-assessment",
];
// A key author must appear in the Sources block for each research pillar.
const REQUIRED_AUTHORS = [
  "Bloom", "Kim", "Mageau", "Vallerand", "Deci", "Macnamara", "Achter",
  "Marcia", "Hidi", "Nye", "Csikszentmihalyi", "Subotnik", "Renzulli",
  "Bartholomew", "Luthar", "Amato", "Buehler", "Cameron",
];

describe("parent-guide content", () => {
  it("has no em-dashes", () => {
    expect(html.includes("\u2014")).toBe(false);
  });
  it("has every required section anchor", () => {
    for (const a of REQUIRED_ANCHORS) expect(html, a).toMatch(new RegExp(`id=["']${a}["']`));
  });
  it("cites every research pillar in Sources", () => {
    for (const a of REQUIRED_AUTHORS) expect(html, a).toContain(a);
  });
  it("has at least 40 well-formed https source links", () => {
    const links = html.match(/https:\/\/[^\s"'<>)]+/g) ?? [];
    expect(links.length).toBeGreaterThanOrEqual(40);
    for (const l of links) expect(l).toMatch(/^https:\/\/\S+$/);
  });
  it("is self-contained (no external stylesheet/script/font fetches)", () => {
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet/i);
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/fonts\.googleapis|cdn\./i);
  });
});
