import { describe, expect, it } from "vitest";
import { PILOT_TIMEBACK, syntheticSnapshot } from "../src/fake.js";
import { toDomainPriors } from "../src/map.js";

// SC-7 (fake data): the synthetic source is deterministic → stable DomainPrior[] for the pilot kids.
// The default subjects (math/reading/writing/science/coding/music/art, all offered) have a clean
// totalDiscretionaryXp = 100, so XP shares are exact. kid-synthetic-001 is the plain default profile.
describe("syntheticSnapshot (deterministic)", () => {
  it("returns a deep-equal snapshot on repeat calls (no randomness, no clock)", () => {
    const a = syntheticSnapshot("k", "2026-04-01T00:00:00.000Z");
    const b = syntheticSnapshot("k", "2026-04-01T00:00:00.000Z");
    expect(a).toEqual(b);
    expect(a.subjects.length).toBeGreaterThan(0);
    expect(a.subjects.every((s) => s.offered)).toBe(true);
  });

  it("merges per-subject overrides over the defaults (subject label never overridable)", () => {
    const base = syntheticSnapshot("k", "2026-04-01T00:00:00.000Z");
    const overridden = syntheticSnapshot("k", "2026-04-01T00:00:00.000Z", {
      math: { mastery: 0.99, offered: false },
    });
    const baseMath = base.subjects.find((s) => s.subject === "math")!;
    const overMath = overridden.subjects.find((s) => s.subject === "math")!;
    expect(baseMath.mastery).not.toBe(0.99);
    expect(overMath.mastery).toBe(0.99);
    expect(overMath.offered).toBe(false);
    expect(overMath.subject).toBe("math");
    // untouched subjects are unchanged
    expect(overridden.subjects.find((s) => s.subject === "art")).toEqual(
      base.subjects.find((s) => s.subject === "art"),
    );
  });
});

describe("PILOT_TIMEBACK (pilot kids → stable priors)", () => {
  it("has the four pilot kids, each with a valid ISO asOf", () => {
    for (const id of [
      "kid-synthetic-001",
      "kid-synthetic-002",
      "kid-synthetic-003",
      "kid-synthetic-004",
    ]) {
      const snap = PILOT_TIMEBACK[id]!;
      expect(snap).toBeDefined();
      expect(snap.kidId).toBe(id);
      expect(Number.isNaN(Date.parse(snap.asOf))).toBe(false);
      expect(snap.asOf).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it("kid-synthetic-001 (default profile) → the exact cabin set + golden art-motion tilts", () => {
    const priors = toDomainPriors(PILOT_TIMEBACK["kid-synthetic-001"]!);
    expect(priors.length).toBeGreaterThan(0);
    // all 8 cabins are contributed by the default subjects, sorted by domain
    expect(priors.map((p) => p.domain)).toEqual([
      "art-motion",
      "code-computers",
      "games-strategy",
      "influence-media",
      "making-engineering",
      "math-puzzles",
      "music-sound",
      "science-nature",
    ]);
    // art contributes w1 mastery 0.5, xp 5 of 100 → aptitude 0.5, discretionary 0.05
    const art = priors.find((p) => p.domain === "art-motion")!;
    expect(art.aptitudeTilt).toBeCloseTo(0.5, 5);
    expect(art.discretionaryTilt).toBeCloseTo(0.05, 5);
    expect(art.inEnvironment).toBe(true);
    // every tilt in range (SC-4)
    for (const p of priors) {
      expect(p.aptitudeTilt).toBeGreaterThanOrEqual(0);
      expect(p.aptitudeTilt).toBeLessThanOrEqual(1);
      expect(p.discretionaryTilt).toBeGreaterThanOrEqual(0);
      expect(p.discretionaryTilt).toBeLessThanOrEqual(1);
    }
  });

  it("the pilot profiles are distinct (002 differs from 001 on math aptitude)", () => {
    const p1 = toDomainPriors(PILOT_TIMEBACK["kid-synthetic-001"]!).find(
      (p) => p.domain === "math-puzzles",
    )!;
    const p2 = toDomainPriors(PILOT_TIMEBACK["kid-synthetic-002"]!).find(
      (p) => p.domain === "math-puzzles",
    )!;
    expect(p2.aptitudeTilt).not.toBeCloseTo(p1.aptitudeTilt, 5);
  });
});
