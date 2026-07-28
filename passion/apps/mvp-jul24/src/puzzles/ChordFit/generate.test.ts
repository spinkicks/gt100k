/**
 * Measured over seeds 1..500 at all three tiers. Facts about specific instances, so they hold only while
 * `src/lib/rng.ts` produces the same stream.
 */
import { describe, expect, it } from "vitest";
import { isInKey } from "../../audio/pitch";
import { TIERS, generateForRound, generatePuzzle, nextSeed, tierForIndex } from "./generate";
import { chordContains, supportingIndices } from "./logic";

const SEEDS = Array.from({ length: 500 }, (_, i) => i + 1);
const TIER_INDICES = TIERS.map((_, i) => i);

describe.each(TIER_INDICES)("tier %i", (tier) => {
  const instances = SEEDS.map((s) => generatePuzzle(s, tier));

  it("never fails to find an instance", () => {
    expect(instances).toHaveLength(SEEDS.length);
  });

  it("offers exactly three chords", () => {
    for (const p of instances) expect(p.options).toHaveLength(3);
  });

  it("has exactly one supporting chord, at the recorded index", () => {
    for (const p of instances) expect(supportingIndices(p)).toEqual([p.answer]);
  });

  /**
   * The distractors are diatonic on purpose. A chord from outside the key would sound wrong for a second
   * reason and could be rejected without ever judging whether it supports the note — which is the
   * construct. So every option belongs to the key and only consonance separates them.
   */
  it("draws every option from inside the key, distractors included", () => {
    for (const p of instances) {
      for (const chord of p.options) {
        for (const s of chord) expect(isInKey(s, p.key)).toBe(true);
      }
    }
  });

  it("gives the two distractors no share of the melody note", () => {
    for (const p of instances) {
      p.options.forEach((chord, i) => {
        if (i !== p.answer) expect(chordContains(chord, p.melodyNote)).toBe(false);
      });
    }
  });

  it("offers three distinct chords, so two options are never the same sound", () => {
    for (const p of instances) {
      const shapes = new Set(p.options.map((c) => c.join(",")));
      expect(shapes.size).toBe(3);
    }
  });

  it("voices the chord below the melody note", () => {
    for (const p of instances) {
      for (const chord of p.options) {
        for (const s of chord) expect(s).toBeLessThan(p.melodyNote);
      }
    }
  });

  it("is deterministic in the seed", () => {
    for (const seed of SEEDS.slice(0, 40)) {
      expect(generatePuzzle(seed, tier)).toEqual(generatePuzzle(seed, tier));
    }
  });
});

describe("the answer is not in a predictable place", () => {
  /**
   * If the supporting chord tended to sit in one slot, a child could learn the slot and stop listening —
   * the same class of shortcut R2 exists to close. Measured: roughly even across the three positions.
   */
  it("spreads the answer across all three positions at every tier", () => {
    for (const tier of TIER_INDICES) {
      const counts = [0, 0, 0];
      for (const seed of SEEDS) {
        const a = generatePuzzle(seed, tier).answer;
        counts[a] = (counts[a] ?? 0) + 1;
      }
      for (const c of counts) {
        expect(c).toBeGreaterThan(SEEDS.length / 6);
      }
      expect(counts.reduce((a, b) => a + b, 0)).toBe(SEEDS.length);
    }
  });

  it("uses every key, so no absolute pitch is reliably the answer", () => {
    for (const tier of TIER_INDICES) {
      expect(new Set(SEEDS.map((s) => generatePuzzle(s, tier).key)).size).toBe(12);
    }
  });
});

describe("tiers", () => {
  it("gets faster as it gets harder, so the easiest gives the most time to judge", () => {
    const bpms = TIERS.map((t) => t.bpm);
    expect(bpms).toEqual([...bpms].sort((a, b) => a - b));
  });

  it("starts on the notes the key implies most strongly, then widens", () => {
    // Tier 0 uses the tonic and the fifth; later tiers reach the notes with less obvious support.
    expect([...(TIERS[0]?.melodyDegrees ?? [])].sort()).toEqual([0, 4]);
    expect((TIERS[2]?.melodyDegrees ?? []).length).toBeGreaterThan(
      (TIERS[0]?.melodyDegrees ?? []).length,
    );
  });

  it("travels with the instance, so the component hardcodes no tempo", () => {
    for (const tier of TIER_INDICES) {
      expect(generatePuzzle(1, tier).bpm).toBe(TIERS[tier]?.bpm);
    }
  });
});

describe("session sequencing", () => {
  it("starts easiest and cycles", () => {
    expect([0, 1, 2, 3, 4].map(tierForIndex)).toEqual([0, 1, 2, 0, 1]);
  });

  it("gives consecutive rounds different questions", () => {
    const rounds = [0, 1, 2, 3, 4, 5].map((i) => generateForRound(7, i));
    const seen = new Set(rounds.map((r) => `${r.key}:${r.melodyNote}:${r.answer}`));
    expect(seen.size).toBeGreaterThan(3);
  });

  it("derives independent seeds per round", () => {
    expect(new Set([0, 1, 2, 3, 4, 5].map((i) => nextSeed(5, i))).size).toBe(6);
  });
});
