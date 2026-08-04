/**
 * A six-year-old has to be able to read the rules.
 *
 * The wall serves ages six to fourteen, and the teach-in is the only text between a child and a
 * game they have never seen. It used to run at grade 6.6 with an average sentence of eighteen
 * words, which is fine for the older half and useless for the younger half, who are exactly the
 * children least able to work the rules out by poking at it.
 *
 * A readability score is a crude instrument and this test does not pretend otherwise. It is here
 * because the failure mode is silent: nobody rereads a rules table, and a well-meaning edit adding
 * one clarifying clause is how these got long in the first place.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const SOURCE = new URL("../runtime/teachin/rules.tsx", import.meta.url);
const RULES: string[] = [...readFileSync(SOURCE, "utf8").matchAll(/^\s*rule: "(.+?)",$/gm)].map(
  (m) => m[1] as string,
);

/** Rough syllable count. Crude by design; Flesch-Kincaid is a crude measure. */
function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length === 0) return 0;
  const groups = w.match(/[aeiouy]+/g)?.length ?? 1;
  return Math.max(w.endsWith("e") && groups > 1 ? groups - 1 : groups, 1);
}

function sentencesOf(text: string): string[] {
  return text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
}

describe("teach-in rules", () => {
  it("has a rule for every game the wall can open", () => {
    // Guards the extraction as much as the content: a regex that silently matched nothing would
    // make every assertion below pass vacuously.
    expect(RULES.length).toBeGreaterThan(15);
  });

  it("reads at or below grade 4 overall", () => {
    const words = RULES.flatMap((r) => r.split(/\s+/));
    const sentences = RULES.flatMap(sentencesOf);
    const grade =
      0.39 * (words.length / sentences.length) +
      11.8 * (words.reduce((n, w) => n + syllables(w), 0) / words.length) -
      15.59;
    expect(grade).toBeLessThanOrEqual(4);
  });

  it("keeps every sentence short enough to hold in one go", () => {
    for (const rule of RULES) {
      for (const s of sentencesOf(rule)) {
        expect(s.trim().split(/\s+/).length).toBeLessThanOrEqual(16);
      }
    }
  });

  it("keeps every rule short enough to read before playing", () => {
    // A child standing in front of a new game will not read a paragraph, they will click.
    for (const rule of RULES) {
      expect(rule.split(/\s+/).length).toBeLessThanOrEqual(32);
    }
  });

  it("does not send a child to a different game to understand this one", () => {
    // Two rules used to end by explaining they were "the same board as" another puzzle, which is
    // an author's observation about the set rather than anything that helps someone play.
    for (const rule of RULES) {
      expect(rule).not.toMatch(/same board as|see also|as in the other/i);
    }
  });
});
