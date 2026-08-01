/**
 * The generator's contract, and the measured facts about the melodies it produces.
 *
 * The numbers pinned here were measured over seeds 1..500 at all three tiers. They are facts about
 * specific melodies, so they only stay true while `src/lib/rng.ts` produces the same stream — which is
 * why that module's header forbids "harmless" tweaks.
 */

import { describe, expect, it } from "vitest";
import { isInKey } from "../../audio/pitch";
import { TIERS, generateForRound, generatePuzzle, nextSeed, tierForIndex } from "./generate";
import { hasVisiblePattern, isSolved, sourIndices } from "./logic";
import { allFixes, hasUniquePosition } from "./naive";

const SEEDS = Array.from({ length: 500 }, (_, i) => i + 1);
const TIER_INDICES = TIERS.map((_, i) => i);

describe.each(TIER_INDICES)("tier %i", (tier) => {
  const instances = SEEDS.map((seed) => generatePuzzle(seed, tier));

  it("never fails to find an instance", () => {
    // The attempt ceiling in generatePuzzle is only safe because of this test.
    expect(instances).toHaveLength(SEEDS.length);
  });

  it("composes a melody entirely inside its key", () => {
    for (const p of instances) {
      expect(sourIndices(p.correct, p.key)).toEqual([]);
      expect(isSolved(p.correct, p.key)).toBe(true);
    }
  });

  it("presents a melody with exactly one sour note, at the recorded index", () => {
    for (const p of instances) {
      expect(sourIndices(p.broken, p.key)).toEqual([p.brokenIndex]);
    }
  });

  it("sours the note by exactly one semitone", () => {
    for (const p of instances) {
      const moved = Math.abs(
        (p.broken[p.brokenIndex] as number) - (p.correct[p.brokenIndex] as number),
      );
      expect(moved).toBe(1);
    }
  });

  it("records a fix direction that really restores the original note", () => {
    for (const p of instances) {
      const restored = (p.broken[p.brokenIndex] as number) + p.fix;
      expect(restored).toBe(p.correct[p.brokenIndex]);
      expect(isInKey(restored, p.key)).toBe(true);
    }
  });

  /**
   * Position, not direction. Both one-semitone nudges of a sour note always land back in the key — see
   * naive.ts — so "one answer" means one NOTE, and this asserts every available fix is at that note.
   */
  it("has exactly one fixable note, and it is the soured one", () => {
    for (const p of instances) {
      const fixes = allFixes(p.broken, p.key, p.lo, p.hi);
      expect(fixes.length).toBeGreaterThan(0);
      for (const f of fixes) expect(f.index).toBe(p.brokenIndex);
      expect(hasUniquePosition(p.broken, p.key, p.lo, p.hi, p.brokenIndex)).toBe(true);
    }
  });

  it("sours an interior note, never an end one", () => {
    for (const p of instances) {
      expect(p.brokenIndex).toBeGreaterThanOrEqual(1);
      expect(p.brokenIndex).toBeLessThanOrEqual(p.correct.length - 2);
    }
  });

  it("draws rows that contain every note plus headroom", () => {
    for (const p of instances) {
      for (const s of [...p.correct, ...p.broken]) {
        expect(s).toBeGreaterThanOrEqual(p.lo);
        expect(s).toBeLessThanOrEqual(p.hi);
      }
      expect(p.lo).toBeLessThan(Math.min(...p.correct, ...p.broken));
      expect(p.hi).toBeGreaterThan(Math.max(...p.correct, ...p.broken));
    }
  });

  it("gives every note a duration, with the last one held", () => {
    for (const p of instances) {
      expect(p.beats).toHaveLength(p.correct.length);
      expect(p.beats.every((b) => b > 0)).toBe(true);
      expect(p.beats.at(-1)).toBe(2);
    }
  });

  it("is deterministic in the seed", () => {
    for (const seed of SEEDS.slice(0, 40)) {
      expect(generatePuzzle(seed, tier)).toEqual(generatePuzzle(seed, tier));
    }
  });
});

/**
 * ================================================================================================
 * THE TESTS THAT EXIST BECAUSE OF THE FIRST PLAYTEST
 * ================================================================================================
 *
 * The previous design defined "wrong" as a broken shape, which is *visible*, so the puzzle could be
 * solved with the sound off and was not really about music at all. These four assertions are what stop
 * that from coming back by accident.
 */
describe("the sour note cannot be found by looking", () => {
  it("no melody has a visible regularity for a displaced note to break", () => {
    for (const tier of TIER_INDICES) {
      for (const seed of SEEDS) {
        const p = generatePuzzle(seed, tier);
        expect(hasVisiblePattern(p.correct), `tier ${tier} seed ${seed}`).toBe(false);
        expect(hasVisiblePattern(p.broken), `tier ${tier} seed ${seed} broken`).toBe(false);
      }
    }
  });

  it("the sour note is never the highest or lowest note on screen", () => {
    for (const tier of TIER_INDICES) {
      for (const seed of SEEDS) {
        const p = generatePuzzle(seed, tier);
        const landed = p.broken[p.brokenIndex] as number;
        expect(landed).not.toBe(Math.min(...p.broken));
        expect(landed).not.toBe(Math.max(...p.broken));
      }
    }
  });

  it("moves the note by the smallest interval there is, so the contour barely changes", () => {
    for (const tier of TIER_INDICES) {
      const p = generatePuzzle(7, tier);
      const before = p.correct.slice(1).map((s, i) => s - (p.correct[i] as number));
      const after = p.broken.slice(1).map((s, i) => s - (p.broken[i] as number));
      const changed = before.filter((d, i) => d !== after[i]).length;
      // Exactly the two intervals either side of the moved note, or one if it is at an edge.
      expect(changed).toBeLessThanOrEqual(2);
    }
  });

  /**
   * The strongest statement available: the drawing is genuinely insufficient. The same contour is
   * sour in different places depending on the key, and the key is never displayed — so no function of
   * the picture alone can return the answer.
   */
  it("uses many keys, so no row is reliably the wrong one", () => {
    for (const tier of TIER_INDICES) {
      const keys = new Set(SEEDS.map((s) => generatePuzzle(s, tier).key));
      // Measured: all 12 at every tier.
      expect(keys.size).toBe(12);
    }
  });
});

describe("tempo and shape of the tiers", () => {
  it("gets faster as the tiers get harder, so the easiest gives the most time to hear the key", () => {
    const bpms = TIERS.map((t) => t.bpm);
    expect(bpms).toEqual([...bpms].sort((a, b) => a - b));
    expect(new Set(bpms).size).toBe(bpms.length);
  });

  it("gets longer and wider, which is what makes the key harder to hold onto", () => {
    const lengths = TIERS.map((t) => t.length);
    const spans = TIERS.map((t) => t.span);
    expect(lengths).toEqual([...lengths].sort((a, b) => a - b));
    expect(spans).toEqual([...spans].sort((a, b) => a - b));
  });

  it("travels with the instance, so the component never hardcodes a tempo", () => {
    for (const tier of TIER_INDICES) {
      expect(generatePuzzle(1, tier).bpm).toBe(TIERS[tier]?.bpm);
    }
  });
});

describe("session sequencing", () => {
  it("starts at the easiest tier and cycles, so no session ends on its hardest melody", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(tierForIndex)).toEqual([0, 1, 2, 0, 1, 2, 0]);
  });

  it("gives consecutive rounds different melodies", () => {
    const rounds = [0, 1, 2, 3, 4, 5].map((i) => generateForRound(7, i));
    const seen = new Set(rounds.map((r) => `${r.key}:${r.broken.join(",")}`));
    expect(seen.size).toBe(rounds.length);
  });

  it("derives independent seeds per round", () => {
    const seeds = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((i) => nextSeed(99, i)));
    expect(seeds.size).toBe(8);
  });
});
