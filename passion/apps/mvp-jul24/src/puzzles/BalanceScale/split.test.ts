/**
 * The split affordance's arithmetic, tested against the rules rather than against itself.
 *
 * The load-bearing property is the FIRST test: everything the UI draws about splitting is derived
 * from `logic.ts#isLegal`, never from a second opinion about when a split is allowed. That is what
 * makes this a discoverability change and not a rules change — `naive.test.ts` pins the difficulty
 * guarantee to divide being conditionally legal, and a drifting copy of the condition is exactly how
 * that guarantee would rot without any test noticing.
 */
import { describe, expect, test } from "vitest";
import { generateLevel } from "./generate";
import { type Scale, applyMove, isLegal, legalMoves, scaleKey, stoneCount } from "./logic";
import { RAIL_KS, pileKey, splitBlockers, splitMarks, unblockingMoves } from "./split";

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);
const TIERS_UNDER_TEST = [0, 1, 2];
const KS = [2, 3, 5];

/** Every board the app can actually open, plus every board one move from one of those. */
function boards(): Scale[] {
  const out: Scale[] = [];
  for (const tier of TIERS_UNDER_TEST) {
    for (const seed of SEEDS) {
      const level = generateLevel(seed, tier);
      out.push(level.scale);
      for (const move of legalMoves(level.scale)) out.push(applyMove(level.scale, move));
    }
  }
  return out;
}

const BOARDS = boards();

describe("the split affordance never invents its own legality", () => {
  test("a split has no blockers exactly when the rules allow it", () => {
    for (const scale of BOARDS) {
      for (const k of KS) {
        expect(splitBlockers(scale, k).length === 0).toBe(isLegal(scale, { kind: "divide", k }));
      }
    }
  });

  test("and the marks agree with the rules about which story they are telling", () => {
    for (const scale of BOARDS) {
      for (const k of KS) {
        const legal = isLegal(scale, { kind: "divide", k });
        expect(splitMarks(scale, k).kind).toBe(legal ? "removed" : "leftOver");
      }
    }
  });

  test("nothing here mutates the scale it is asked about", () => {
    for (const scale of BOARDS.slice(0, 60)) {
      const before = scaleKey(scale);
      for (const k of KS) {
        splitMarks(scale, k);
        splitBlockers(scale, k);
        unblockingMoves(scale, k);
      }
      expect(scaleKey(scale)).toBe(before);
    }
  });
});

describe("what a legal split previews", () => {
  test("the marked items are exactly the ones the split takes away", () => {
    let checked = 0;
    for (const scale of BOARDS) {
      for (const k of KS) {
        const move = { kind: "divide", k } as const;
        if (!isLegal(scale, move)) continue;
        checked++;
        const after = applyMove(scale, move);
        const marks = splitMarks(scale, k);
        for (const side of ["left", "right"] as const) {
          const now = side === "left" ? scale[side] : scale.right;
          const then = side === "left" ? after[side] : after.right;
          expect(marks.marked.get(pileKey({ side, kind: "bags" })) ?? 0).toBe(now.bags - then.bags);
          for (const value of [10, 5, 1] as const) {
            expect(marks.marked.get(pileKey({ side, kind: "stone", value })) ?? 0).toBe(
              stoneCount(now, value) - stoneCount(then, value),
            );
          }
        }
      }
    }
    // Guards against the assertion above being vacuous: legal splits are rare, so if the corpus ever
    // stops containing any, this test would silently stop testing anything.
    expect(checked).toBeGreaterThan(20);
  });
});

describe("what a blocked split shows instead", () => {
  test("the marked items are the remainder, pile by pile", () => {
    for (const scale of BOARDS) {
      for (const k of KS) {
        if (isLegal(scale, { kind: "divide", k })) continue;
        const marks = splitMarks(scale, k);
        for (const side of ["left", "right"] as const) {
          const pan = side === "left" ? scale.left : scale.right;
          expect(marks.marked.get(pileKey({ side, kind: "bags" })) ?? 0).toBe(pan.bags % k);
          for (const value of [10, 5, 1] as const) {
            expect(marks.marked.get(pileKey({ side, kind: "stone", value })) ?? 0).toBe(
              stoneCount(pan, value) % k,
            );
          }
        }
      }
    }
  });

  test("a marked pile is a blocking pile, and there are never marks with nothing behind them", () => {
    for (const scale of BOARDS) {
      for (const k of KS) {
        if (isLegal(scale, { kind: "divide", k })) continue;
        const blocking = new Set(splitBlockers(scale, k).map(pileKey));
        const marked = new Set(splitMarks(scale, k).marked.keys());
        expect([...marked].sort()).toEqual([...blocking].sort());
        for (const count of splitMarks(scale, k).marked.values()) {
          expect(count).toBeGreaterThan(0);
        }
      }
    }
  });

  test("a ÷2 marks a handful of stones, and a ÷3 marks more because more things fail to be threes", () => {
    /*
     * Marking leftovers rather than whole piles is what keeps the mark a pop-out (research memo 07
     * §2.2) instead of wallpaper — but only ÷2 is genuinely small. Measured across opening boards and
     * every board one move from one: ÷2 marks a mean of 3.6 items and at most 8, while ÷3 marks a
     * mean of 6.9 and at most 15. That asymmetry is not a bug and is not smoothed over here: two
     * thirds of a pile is left over when it is not a multiple of three, so "poke ÷3 and most of the
     * board lights up" is an accurate statement about the board. The ceilings are pinned so a future
     * tier cannot quietly turn either mark into a wash.
     */
    const worst = new Map<number, number>();
    for (const scale of BOARDS) {
      for (const k of RAIL_KS) {
        if (isLegal(scale, { kind: "divide", k })) continue;
        const total = [...splitMarks(scale, k).marked.values()].reduce((a, b) => a + b, 0);
        worst.set(k, Math.max(worst.get(k) ?? 0, total));
      }
    }
    expect(worst.get(2)).toBeLessThanOrEqual(8);
    expect(worst.get(3)).toBeLessThanOrEqual(15);
  });
});

describe("the moves offered as a way out", () => {
  test("every one of them is a move the rules currently allow", () => {
    for (const scale of BOARDS) {
      for (const k of RAIL_KS) {
        const legal = legalMoves(scale);
        for (const move of unblockingMoves(scale, k)) {
          expect(legal.some((m) => JSON.stringify(m) === JSON.stringify(move))).toBe(true);
        }
      }
    }
  });

  test("every one of them strictly reduces the number of blocking piles", () => {
    for (const scale of BOARDS) {
      for (const k of RAIL_KS) {
        const before = splitBlockers(scale, k).length;
        for (const move of unblockingMoves(scale, k)) {
          expect(splitBlockers(applyMove(scale, move), k).length).toBeLessThan(before);
        }
      }
    }
  });

  test("a legal split offers none, because there is nothing to unblock", () => {
    for (const scale of BOARDS) {
      for (const k of KS) {
        if (!isLegal(scale, { kind: "divide", k })) continue;
        expect(unblockingMoves(scale, k)).toEqual([]);
      }
    }
  });

  test("a split is never offered as the way to unblock a split", () => {
    for (const scale of BOARDS) {
      for (const k of RAIL_KS) {
        for (const move of unblockingMoves(scale, k)) expect(move.kind).not.toBe("divide");
      }
    }
  });

  test("most blocked openings have at least one, and the exceptions are counted honestly", () => {
    // Measured, not hoped for: of the 350 opening boards (across all three tiers) where no rail
    // split is legal, 347 have a move that clears a leftover. On the other 3 no single legal move
    // reduces the count, so the rail marks the leftovers and lights nothing — an honest dead end
    // rather than a wrong suggestion.
    let blocked = 0;
    let helped = 0;
    for (const tier of TIERS_UNDER_TEST) {
      for (let seed = 1; seed <= 120; seed++) {
        const scale = generateLevel(seed, tier).scale;
        if (RAIL_KS.some((k) => isLegal(scale, { kind: "divide", k }))) continue;
        blocked++;
        if (RAIL_KS.some((k) => unblockingMoves(scale, k).length > 0)) helped++;
      }
    }
    expect(blocked).toBe(350);
    expect(helped).toBe(347);
  });
});

test("the rail's permanent factors are the ones shipped solutions actually use", () => {
  // Why ÷2 and ÷3 get a permanent control and ÷5 does not. Re-derived here so the claim in split.ts
  // cannot quietly go stale when a tier's weights change.
  const used = new Set<number>();
  for (const tier of TIERS_UNDER_TEST) {
    for (let seed = 1; seed <= 120; seed++) {
      for (const move of generateLevel(seed, tier).solution) {
        if (move.kind === "divide") used.add(move.k);
      }
    }
  }
  expect([...used].sort()).toEqual([...RAIL_KS].sort());
});
