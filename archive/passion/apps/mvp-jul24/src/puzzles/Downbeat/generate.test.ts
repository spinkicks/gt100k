import { describe, expect, it } from "vitest";
import {
  MIN_BARS,
  TIERS,
  generateForRound,
  generatePuzzle,
  nextSeed,
  tierForIndex,
} from "./generate";
import { downbeatIndices, isSolved, notesFor } from "./logic";

const SEEDS = Array.from({ length: 500 }, (_, i) => i + 1);
const TIER_INDICES = TIERS.map((_, i) => i);

describe.each(TIER_INDICES)("tier %i", (tier) => {
  const instances = SEEDS.map((s) => generatePuzzle(s, tier));

  it("never fails to find an instance", () => {
    expect(instances).toHaveLength(SEEDS.length);
  });

  /** A metre is a repetition, so fewer than three stresses is an event rather than a metre. */
  it("always holds at least three bars, so there is a recurrence to hear", () => {
    for (const p of instances) {
      expect(downbeatIndices(p).length).toBeGreaterThanOrEqual(MIN_BARS);
      expect(p.pulses).toBeGreaterThanOrEqual(p.meter * MIN_BARS);
    }
  });

  it("uses a real metre, never one pulse per bar", () => {
    for (const p of instances) expect(p.meter).toBeGreaterThanOrEqual(2);
  });

  it("keeps the phase inside one bar", () => {
    for (const p of instances) {
      expect(p.phase).toBeGreaterThanOrEqual(0);
      expect(p.phase).toBeLessThan(p.meter);
    }
  });

  it("fills the loop exactly with whole bars", () => {
    for (const p of instances) expect(p.pulses % p.meter).toBe(0);
  });

  it("makes the stress audible — accents are strictly louder than plain pulses", () => {
    for (const p of instances) expect(p.accentVelocity).toBeGreaterThan(p.plainVelocity);
  });

  it("is solved by exactly its own downbeats", () => {
    for (const p of instances) {
      expect(isSolved(p, new Set(downbeatIndices(p)))).toBe(true);
    }
  });

  /**
   * The R2 guarantee, asserted on every generated instance: the loop varies in loudness and in NOTHING
   * else, so the strip on screen cannot encode the grouping.
   */
  it("varies loudness only, so the picture cannot carry the answer", () => {
    for (const p of instances) {
      const notes = notesFor(p);
      expect(new Set(notes.map((n) => n.semitone)).size).toBe(1);
      expect(new Set(notes.map((n) => n.beats)).size).toBe(1);
      expect(new Set(notes.map((n) => n.velocity)).size).toBe(2);
    }
  });

  it("is deterministic in the seed", () => {
    for (const seed of SEEDS.slice(0, 40)) {
      expect(generatePuzzle(seed, tier)).toEqual(generatePuzzle(seed, tier));
    }
  });
});

describe("difficulty is perceptual, not mechanical", () => {
  /** The accent gap narrowing is the whole difficulty curve: a quieter contrast is a harder listen. */
  it("narrows the gap between stressed and plain as the tiers get harder", () => {
    const gaps = TIERS.map((t) => t.accentVelocity - t.plainVelocity);
    expect(gaps).toEqual([...gaps].sort((a, b) => b - a));
    expect(new Set(gaps).size).toBe(gaps.length);
  });

  it("gets faster, giving less time per bar", () => {
    const bpms = TIERS.map((t) => t.bpm);
    expect(bpms).toEqual([...bpms].sort((a, b) => a - b));
  });

  it("only lets later tiers start part-way through a bar", () => {
    expect(TIERS[0]?.allowPhase).toBe(false);
    expect(TIERS[1]?.allowPhase).toBe(true);
    for (const seed of SEEDS) expect(generatePuzzle(seed, 0).phase).toBe(0);
  });

  it("adds quadruple only after duple and triple, since it is easy to mishear as duple", () => {
    expect(TIERS[0]?.meters).not.toContain(4);
    expect(TIERS[2]?.meters).toContain(4);
  });

  it("uses every metre its tier allows, across a sweep", () => {
    for (const tier of TIER_INDICES) {
      const seen = new Set(SEEDS.map((s) => generatePuzzle(s, tier).meter));
      expect([...seen].sort()).toEqual([...(TIERS[tier]?.meters ?? [])].sort());
    }
  });

  it("offsets the phase somewhere in the sweep once allowed", () => {
    const phases = new Set(SEEDS.map((s) => generatePuzzle(s, 1).phase));
    expect(phases.size).toBeGreaterThan(1);
  });
});

describe("session sequencing", () => {
  it("starts easiest and cycles", () => {
    expect([0, 1, 2, 3, 4].map(tierForIndex)).toEqual([0, 1, 2, 0, 1]);
  });

  it("gives consecutive rounds different loops", () => {
    const rounds = [0, 1, 2, 3, 4, 5].map((i) => generateForRound(5, i));
    expect(new Set(rounds.map((r) => `${r.meter}:${r.phase}:${r.bpm}`)).size).toBeGreaterThan(2);
  });

  it("derives independent seeds per round", () => {
    expect(new Set([0, 1, 2, 3, 4, 5].map((i) => nextSeed(9, i))).size).toBe(6);
  });
});
