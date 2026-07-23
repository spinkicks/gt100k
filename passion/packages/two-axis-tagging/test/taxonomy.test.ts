import { describe, it, expect } from "vitest";
import { CABINS, createTaxonomy, serializePath } from "../src/taxonomy.js";

describe("taxonomy", () => {
  it("has the 8 golden cabins", () => {
    expect(CABINS).toEqual([
      "music-sound", "code-computers", "games-strategy", "making-engineering",
      "art-motion", "influence-media", "science-nature", "math-puzzles",
    ]);
  });
  it("validates seed paths and rejects unknown cabins", () => {
    const t = createTaxonomy();
    expect(t.hasPath(["music-sound"])).toBe(true);
    expect(t.hasPath(["music-sound", "audio-systems"])).toBe(true);
    expect(t.hasPath(["not-a-cabin"] as never)).toBe(false);
  });
  it("mints a sub-topic parented to a cabin, idempotent by label", () => {
    const t = createTaxonomy();
    const p1 = t.mintSubTopic("code-computers", "Agentic Engineering");
    const p2 = t.mintSubTopic("code-computers", "Agentic Engineering");
    expect(p1).toEqual(p2);
    expect(p1[0]).toBe("code-computers");
    expect(t.hasPath(p1)).toBe(true);
    expect(serializePath(p1)).toBe(`code-computers/${p1[1]}`);
  });
  it("refuses to mint under an unknown cabin", () => {
    const t = createTaxonomy();
    expect(() => t.mintSubTopic("nope" as never, "x")).toThrow();
  });
});
