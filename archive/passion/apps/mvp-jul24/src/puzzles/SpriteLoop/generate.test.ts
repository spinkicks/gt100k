import { describe, expect, it } from "vitest";
import { TIERS, generateForRound, tierForIndex } from "./generate";
import { inBounds, poseSequence } from "./logic";
import { solutionsByPose, solutionsByTrail } from "./naive";

const SEEDS = [1, 2, 3, 7, 11, 42, 99, 1234];

describe("generateForRound", () => {
  it("is deterministic in seed and index", () => {
    expect(generateForRound(7, 0)).toEqual(generateForRound(7, 0));
  });

  it("varies with the seed", () => {
    expect(generateForRound(1, 0).target).not.toEqual(generateForRound(2, 0).target);
  });

  it("keeps every target on the board, for every seed and tier", () => {
    for (const seed of SEEDS) {
      for (let index = 0; index < TIERS.length; index++) {
        const p = generateForRound(seed, index);
        for (const pose of poseSequence(p.target, p.start)) {
          expect(inBounds(pose)).toBe(true);
        }
      }
    }
  });

  it("never generates an empty target", () => {
    for (const seed of SEEDS) {
      for (let index = 0; index < TIERS.length; index++) {
        expect(generateForRound(seed, index).target.length).toBeGreaterThan(0);
      }
    }
  });

  it("never generates a target that stays in its own cell, which would be nothing to watch", () => {
    for (const seed of SEEDS) {
      for (let index = 0; index < TIERS.length; index++) {
        const p = generateForRound(seed, index);
        const poses = poseSequence(p.target, p.start);
        const moved = poses.some((q) => q.x !== p.start.x || q.y !== p.start.y);
        expect(moved).toBe(true);
      }
    }
  });

  it("offers a tray that can express the target", () => {
    for (const seed of SEEDS) {
      for (let index = 0; index < TIERS.length; index++) {
        const p = generateForRound(seed, index);
        const kinds = new Set<string>(p.tray.map((b) => b.kind));
        for (const s of p.target) expect(kinds.has(s.kind)).toBe(true);
      }
    }
  });
});

describe("tierForIndex", () => {
  it("wraps rather than clamping, so a run of rounds never ends on the hardest", () => {
    expect(tierForIndex(0)).toBe(0);
    expect(tierForIndex(TIERS.length)).toBe(0);
    expect(tierForIndex(-1)).toBe(TIERS.length - 1);
  });
});

/**
 * THE X1 GUARD.
 *
 * See `naive.ts` for why this is the assertion that matters, and the music room's "fully solvable in
 * silence" test for what happens when a guard like this is written the other way round.
 */
describe("the hardest tier cannot be answered by matching the drawn path", () => {
  it("admits strictly more trail-solutions than pose-solutions", () => {
    const index = TIERS.length - 1;
    let sawStrictlyMore = false;
    for (const seed of SEEDS) {
      const p = generateForRound(seed, index);
      const byPose = solutionsByPose(p, 3);
      const byTrail = solutionsByTrail(p, 3);
      expect(byTrail.length).toBeGreaterThanOrEqual(byPose.length);
      if (byTrail.length > byPose.length) sawStrictlyMore = true;
    }
    expect(sawStrictlyMore).toBe(true);
  });

  it("spends wait on the hardest tier, which is what makes timing matter at all", () => {
    const index = TIERS.length - 1;
    for (const seed of SEEDS) {
      expect(generateForRound(seed, index).target.some((s) => s.kind === "wait")).toBe(true);
    }
  });
});
