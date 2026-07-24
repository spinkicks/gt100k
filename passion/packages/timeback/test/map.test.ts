import { describe, expect, it } from "vitest";
import { toDomainPriors } from "../src/map.js";
import { GOLDEN_SNAPSHOT } from "../src/__fixtures__/snapshots.js";

// SC-1 (golden crosswalk mapping) + SC-4 (normalization). Values hand-computed from spec §3.4;
// totalDiscretionaryXp = 60 + 20 + 20 = 100 (music offered:false, xp 0). xpShare: math .60, science .20,
// writing .20. music-sound is OMITTED (music is offered:false → no contributing offered subject).
describe("toDomainPriors (golden)", () => {
  const priors = toDomainPriors(GOLDEN_SNAPSHOT);
  const byDomain = new Map(priors.map((p) => [p.domain, p]));

  it("emits exactly the contributing cabins, sorted by domain, music-sound omitted", () => {
    expect(priors.map((p) => p.domain)).toEqual([
      "code-computers",
      "games-strategy",
      "influence-media",
      "making-engineering",
      "math-puzzles",
      "science-nature",
    ]);
  });

  it("math-puzzles: math(w1,m0.8) → aptitude 0.8, discretionary 0.60", () => {
    const p = byDomain.get("math-puzzles")!;
    expect(p.aptitudeTilt).toBeCloseTo(0.8, 5);
    expect(p.discretionaryTilt).toBeCloseTo(0.6, 5);
    expect(p.inEnvironment).toBe(true);
  });

  it("code-computers: math(w0.5) → aptitude 0.8, discretionary 0.30", () => {
    const p = byDomain.get("code-computers")!;
    expect(p.aptitudeTilt).toBeCloseTo(0.8, 5);
    expect(p.discretionaryTilt).toBeCloseTo(0.3, 5);
    expect(p.inEnvironment).toBe(true);
  });

  it("games-strategy: math(w0.5) → aptitude 0.8, discretionary 0.30", () => {
    const p = byDomain.get("games-strategy")!;
    expect(p.aptitudeTilt).toBeCloseTo(0.8, 5);
    expect(p.discretionaryTilt).toBeCloseTo(0.3, 5);
  });

  it("science-nature: science(w1,m0.5) → aptitude 0.5, discretionary 0.20", () => {
    const p = byDomain.get("science-nature")!;
    expect(p.aptitudeTilt).toBeCloseTo(0.5, 5);
    expect(p.discretionaryTilt).toBeCloseTo(0.2, 5);
  });

  it("making-engineering: science(w0.5) → aptitude 0.5, discretionary 0.10", () => {
    const p = byDomain.get("making-engineering")!;
    expect(p.aptitudeTilt).toBeCloseTo(0.5, 5);
    expect(p.discretionaryTilt).toBeCloseTo(0.1, 5);
  });

  it("influence-media: writing(w1,m0.9) → aptitude 0.9, discretionary 0.20", () => {
    const p = byDomain.get("influence-media")!;
    expect(p.aptitudeTilt).toBeCloseTo(0.9, 5);
    expect(p.discretionaryTilt).toBeCloseTo(0.2, 5);
  });

  it("every tilt is in [0,1]", () => {
    for (const p of priors) {
      expect(p.aptitudeTilt).toBeGreaterThanOrEqual(0);
      expect(p.aptitudeTilt).toBeLessThanOrEqual(1);
      expect(p.discretionaryTilt).toBeGreaterThanOrEqual(0);
      expect(p.discretionaryTilt).toBeLessThanOrEqual(1);
    }
  });
});

// SC-4 fail-safe: totalXp=0 → discretionary shares 0 (no divide-by-zero); NaN/negative never poison a tilt.
describe("toDomainPriors (fail-safe)", () => {
  it("totalDiscretionaryXp=0 → discretionaryTilt 0, no NaN", () => {
    const priors = toDomainPriors({
      kidId: "k",
      asOf: "2026-04-01T00:00:00.000Z",
      subjects: [{ subject: "math", mastery: 0.7, discretionaryXp: 0, offered: true }],
    });
    const mp = priors.find((p) => p.domain === "math-puzzles")!;
    expect(mp.discretionaryTilt).toBe(0);
    expect(mp.aptitudeTilt).toBeCloseTo(0.7, 5);
  });

  it("NaN / negative mastery never yields an out-of-range tilt", () => {
    const priors = toDomainPriors({
      kidId: "k",
      asOf: "2026-04-01T00:00:00.000Z",
      subjects: [{ subject: "math", mastery: Number.NaN, discretionaryXp: 10, offered: true }],
    });
    const mp = priors.find((p) => p.domain === "math-puzzles")!;
    expect(Number.isNaN(mp.aptitudeTilt)).toBe(false);
    expect(mp.aptitudeTilt).toBeGreaterThanOrEqual(0);
    expect(mp.aptitudeTilt).toBeLessThanOrEqual(1);
  });

  it("unknown subject contributes nothing (no prior, no throw)", () => {
    const priors = toDomainPriors({
      kidId: "k",
      asOf: "2026-04-01T00:00:00.000Z",
      subjects: [{ subject: "underwater-basket-weaving", mastery: 0.9, discretionaryXp: 5, offered: true }],
    });
    expect(priors).toHaveLength(0);
  });
});
