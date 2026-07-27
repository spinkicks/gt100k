/**
 * The generator's contract, and the measured facts about the levels it produces.
 *
 * The numbers pinned here were measured over seeds 1..500 at both tiers. They are facts about
 * specific levels, so they only stay true while `src/lib/rng.ts` produces the same stream — which is
 * exactly why that module's header forbids "harmless" tweaks.
 */

import { describe, expect, it } from "vitest";
import { TIERS, generateForRound, generatePuzzle, nextSeed, tierForIndex } from "./generate";
import { matchesAnyShape, matchesShape } from "./logic";
import { allRepairs, hasUniqueRepair } from "./naive";

const SEEDS = Array.from({ length: 500 }, (_, i) => i + 1);
const TIER_INDICES = TIERS.map((_, i) => i);

describe.each(TIER_INDICES)("tier %i", (tier) => {
  const instances = SEEDS.map((seed) => generatePuzzle(seed, tier));

  it("never fails to find an instance", () => {
    // The attempt ceiling in generatePuzzle is only safe because of this test.
    expect(instances).toHaveLength(SEEDS.length);
  });

  it("builds the shape it says it built", () => {
    for (const p of instances) expect(matchesShape(p.correct, p.shape)).toBe(true);
  });

  it("presents a phrase that is genuinely broken", () => {
    for (const p of instances) expect(matchesAnyShape(p.broken)).toBe(false);
  });

  it("has exactly one answer, and it is the note the generator displaced", () => {
    for (const p of instances) {
      const repairs = allRepairs(p.broken, p.lo, p.hi);
      expect(repairs).toHaveLength(1);
      expect(repairs[0]).toEqual({ index: p.brokenIndex, degree: p.correct[p.brokenIndex] });
      expect(
        hasUniqueRepair(p.broken, p.lo, p.hi, {
          index: p.brokenIndex,
          degree: p.correct[p.brokenIndex] as number,
        }),
      ).toBe(true);
    }
  });

  it("displaces an interior note, never an end one", () => {
    for (const p of instances) {
      expect(p.brokenIndex).toBeGreaterThanOrEqual(1);
      expect(p.brokenIndex).toBeLessThanOrEqual(p.correct.length - 2);
    }
  });

  it("differs from the correct phrase at exactly one position", () => {
    for (const p of instances) {
      const differing = p.correct.filter((d, i) => d !== p.broken[i]);
      expect(differing).toHaveLength(1);
    }
  });

  it("draws rows that contain every note the player can see or need", () => {
    for (const p of instances) {
      for (const d of [...p.correct, ...p.broken]) {
        expect(d).toBeGreaterThanOrEqual(p.lo);
        expect(d).toBeLessThanOrEqual(p.hi);
      }
      // Headroom, so the answer is never jammed against the top or bottom row.
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
 * The measurement that decides whether this is a music puzzle or a spot-the-outlier puzzle.
 *
 * If the displaced note sits above the phrase's highest note or below its lowest, it can be found by
 * scanning the pitches for the extreme one — no listening, no sense of the phrase, just an outlier
 * hunt. That is set membership again, and it is the failure mode `logic.ts`'s header exists to
 * prevent. So the generator prefers displacements that land *among* pitches the phrase already uses.
 *
 * Measured over seeds 1..500 after that preference was added: **tier 0 rose from 16.6% to 57.2%** and
 * **tier 1 from 66.6% to 100%**. Tier 0 cannot reach 100% because at length 6 with single steps and a
 * minimum displacement of two degrees, some positions have no inward landing at all.
 */
describe("the wrong note hides among the phrase's own pitches", () => {
  const insideFraction = (tier: number): number => {
    let inside = 0;
    for (const seed of SEEDS) {
      const p = generatePuzzle(seed, tier);
      const lo = Math.min(...p.correct);
      const hi = Math.max(...p.correct);
      const landed = p.broken[p.brokenIndex] as number;
      if (landed > lo && landed < hi) inside++;
    }
    return inside / SEEDS.length;
  };

  it("tier 0 hides it more often than not", () => {
    expect(insideFraction(0)).toBeGreaterThan(0.5);
  });

  it("tier 1 essentially always hides it", () => {
    expect(insideFraction(1)).toBeGreaterThanOrEqual(0.95);
  });
});

describe("shape coverage", () => {
  it("tier 0 uses runs and arches", () => {
    const shapes = new Set(SEEDS.map((s) => generatePuzzle(s, 0).shape));
    expect(shapes).toEqual(new Set(["run", "arch"]));
  });

  it("tier 1 uses all three shapes, so a session is not one trick", () => {
    const shapes = new Set(SEEDS.map((s) => generatePuzzle(s, 1).shape));
    expect(shapes).toEqual(new Set(["run", "arch", "sequence"]));
  });

  it("tier 1 includes single-degree displacements, the hardest to hear", () => {
    const nearMisses = SEEDS.map((s) => generatePuzzle(s, 1)).filter(
      (p) =>
        Math.abs((p.broken[p.brokenIndex] as number) - (p.correct[p.brokenIndex] as number)) === 1,
    );
    // Measured: 230 of 500.
    expect(nearMisses.length).toBeGreaterThan(100);
  });

  it("tier 0 excludes them, which is what makes it the easier tier", () => {
    for (const seed of SEEDS) {
      const p = generatePuzzle(seed, 0);
      const delta = Math.abs(
        (p.broken[p.brokenIndex] as number) - (p.correct[p.brokenIndex] as number),
      );
      expect(delta).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("session sequencing", () => {
  it("alternates tiers so a session meets both", () => {
    expect([0, 1, 2, 3].map(tierForIndex)).toEqual([0, 1, 0, 1]);
  });

  it("gives consecutive rounds different phrases", () => {
    const rounds = [0, 1, 2, 3, 4, 5].map((i) => generateForRound(7, i));
    const seen = new Set(rounds.map((r) => r.broken.join(",")));
    expect(seen.size).toBe(rounds.length);
  });

  it("derives independent seeds per round", () => {
    const seeds = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((i) => nextSeed(99, i)));
    expect(seeds.size).toBe(8);
  });
});

describe("every note is a legal note in the key", () => {
  /**
   * Near-tautological by design, and worth asserting anyway: pitch is a diatonic DEGREE, so there is
   * no representation for an out-of-key note. This test is the tripwire for anyone who later changes
   * the representation to semitones and reintroduces the possibility.
   */
  it("holds for every degree of every instance", () => {
    for (const tier of TIER_INDICES) {
      for (const seed of SEEDS.slice(0, 100)) {
        const p = generatePuzzle(seed, tier);
        for (const d of [...p.correct, ...p.broken]) expect(Number.isInteger(d)).toBe(true);
      }
    }
  });
});
