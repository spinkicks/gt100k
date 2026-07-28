/**
 * "Never offered" has to mean never offered.
 *
 * The three steps of this policy speak two different languages. Debts and the probe work in full
 * domain paths, because that is what a belief and an exposure carry: `math-puzzles/logic-puzzles`.
 * Breadth works in `candidates`, which is a list of cabins: `math-puzzles`. The membership tests
 * between them compared a cabin id against a set of full paths, so they never matched, and a cabin
 * the child had been inside a dozen times was still eligible as something new.
 *
 * The consequence is not a cosmetic duplicate. The step exists to buy genuine breadth, and it was
 * spending that budget on the child's most familiar room while a real unexplored cabin sat behind
 * it in the sort order. It could also name the same cabin the probe had already claimed, which
 * reads to a guide as two separate asks and gets done twice.
 */
import type { CellBelief } from "@gt100k/interest-inference";
import { describe, expect, it } from "vitest";

import { selectHoldOut, type Exposure } from "../src/holdout.js";

const NOW = "2026-04-01T00:00:00.000Z";
const day = (n: number): string => `2026-03-${String(n).padStart(2, "0")}T00:00:00.000Z`;

const belief = (path: readonly string[], mean: number): CellBelief =>
  ({
    domainPath: path,
    mode: "build",
    mean,
    alpha: 1,
    beta: 1,
    sd: 0.1,
    lowerBound: mean - 0.1,
    evidenceMass: 5,
    observedMass: 5,
    confident: true,
    supporting: [],
  }) as unknown as CellBelief;

/** Four spaced occasions inside one cabin's subtopic: a thoroughly familiar room. */
const FAMILIAR: readonly Exposure[] = [1, 3, 5, 7].map((d) => ({
  domainPath: ["math-puzzles", "logic-puzzles"],
  timestamp: day(d),
}));

describe("breadth is measured at the level it offers", () => {
  it("does not call a cabin new when the child has been in one of its rooms", () => {
    const out = selectHoldOut({
      beliefs: [],
      history: FAMILIAR,
      candidates: ["math-puzzles", "art-motion"],
      now: NOW,
    });

    expect(out.fresh?.[0]).not.toBe("math-puzzles");
  });

  it("offers the cabin that genuinely has not been seen", () => {
    const out = selectHoldOut({
      beliefs: [],
      history: FAMILIAR,
      candidates: ["math-puzzles", "art-motion"],
      now: NOW,
    });

    expect(out.fresh?.[0]).toBe("art-motion");
  });

  it("does not offer a cabin the probe has already claimed", () => {
    // The probe bets against a subtopic; breadth would then offer the cabin above it, and a guide
    // reading both would do the same thing twice under two different justifications.
    const out = selectHoldOut({
      beliefs: [belief(["art-motion", "animation"], 0.1)],
      history: FAMILIAR,
      candidates: ["math-puzzles", "art-motion"],
      now: NOW,
    });

    expect(out.probe?.[0]).toBe("art-motion");
    expect(out.fresh).toBeUndefined();
  });

  it("still says nothing is new when nothing is", () => {
    const out = selectHoldOut({
      beliefs: [],
      history: FAMILIAR,
      candidates: ["math-puzzles"],
      now: NOW,
    });

    expect(out.fresh).toBeUndefined();
  });
});
