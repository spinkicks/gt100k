/**
 * Counting how many goes a solve took.
 *
 * This is the only producer of a success rate in the whole system, and the wellbeing engine turns a
 * low rate into SCAFFOLD, so an off-by-one here quietly pulls a child's difficulty down.
 */
import { describe, expect, it } from "vitest";

import { depthFor, missed, newTally, solved } from "../runtime/signals/tries.js";

describe("counting goes", () => {
  it("counts a first-time solve as one try, not zero", () => {
    // The go that worked is a go. Zero would make a perfect run look like no work at all, and the
    // rate is solves over tries, so a zero denominator contribution breaks the arithmetic.
    expect(solved(newTally(), "chess").tries).toBe(1);
  });

  it("counts the misses plus the one that worked", () => {
    const t = newTally();
    missed(t, "chess");
    missed(t, "chess");
    expect(solved(t, "chess")).toEqual({ tries: 3, recovered: true });
  });

  it("keeps gadgets apart", () => {
    // A child bouncing between two games must not have one game's misses charged to the other.
    const t = newTally();
    missed(t, "chess");
    missed(t, "chess");
    missed(t, "drums");
    expect(solved(t, "drums").tries).toBe(2);
    expect(solved(t, "chess").tries).toBe(3);
  });

  it("starts the next run clean", () => {
    const t = newTally();
    missed(t, "chess");
    solved(t, "chess");
    expect(solved(t, "chess")).toEqual({ tries: 1, recovered: false });
  });
});

describe("what a solve carries", () => {
  it("emits failure_recovery when the child got there the hard way", () => {
    // The first affordance in the app able to produce this family. It has been in the vocabulary
    // and in the weights all along with nothing to emit it.
    expect(depthFor(true)).toEqual(["failure_recovery"]);
  });

  it("emits nothing when it worked first go", () => {
    // A clean solve is not a depth signal. Treating it as one would make being good at something
    // read as caring about it, which is the confusion the whole model exists to avoid.
    expect(depthFor(false)).toEqual([]);
  });

  it("never emits a family the engine does not know", () => {
    for (const r of [true, false]) {
      for (const kind of depthFor(r)) {
        expect(kind).toBe("failure_recovery");
      }
    }
  });
});
