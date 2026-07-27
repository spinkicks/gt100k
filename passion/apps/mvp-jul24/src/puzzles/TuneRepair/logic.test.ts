import { describe, expect, it } from "vitest";
import {
  MIN_LENGTH,
  isArch,
  isRun,
  isSequence,
  isSolved,
  matchesAnyShape,
  movedIndex,
  notesFor,
} from "./logic";

describe("isRun", () => {
  it("accepts a steady walk in either direction", () => {
    expect(isRun([0, 1, 2, 3, 4, 5])).toBe(true);
    expect(isRun([5, 4, 3, 2, 1, 0])).toBe(true);
  });

  it("accepts a walk in thirds", () => {
    expect(isRun([0, 2, 4, 6, 8])).toBe(true);
  });

  it("rejects one displaced note", () => {
    expect(isRun([0, 1, 4, 3, 4, 5])).toBe(false);
  });

  it("rejects a step bigger than a third, which would not be heard as a walk", () => {
    expect(isRun([0, 3, 6, 9, 12])).toBe(false);
  });

  it("rejects a repeated note, because standing still is not a direction", () => {
    expect(isRun([2, 2, 2, 2, 2])).toBe(false);
  });

  it("rejects anything too short to hear as a shape", () => {
    expect(isRun([0, 1, 2, 3])).toBe(false);
    expect(MIN_LENGTH).toBe(5);
  });
});

describe("isArch", () => {
  it("accepts up-then-down with the turn in the middle", () => {
    expect(isArch([0, 1, 2, 3, 2, 1, 0])).toBe(true);
  });

  it("accepts a valley as well as a hill", () => {
    expect(isArch([3, 2, 1, 0, 1, 2, 3])).toBe(true);
  });

  it("rejects a turn too close to an end to be heard as a turn", () => {
    // Turn after one step: the first leg is a single interval.
    expect(isArch([0, 1, 0, -1, -2, -3])).toBe(false);
    expect(isArch([0, 1, 2, 3, 4, 3])).toBe(false);
  });

  it("rejects two turns", () => {
    expect(isArch([0, 1, 2, 1, 2, 3, 2])).toBe(false);
  });

  it("rejects legs with different step sizes", () => {
    expect(isArch([0, 1, 2, 3, 1, -1, -3])).toBe(false);
  });

  it("does not accept a plain run", () => {
    expect(isArch([0, 1, 2, 3, 4, 5])).toBe(false);
  });
});

describe("isSequence", () => {
  it("accepts a two-note motif restated three times, each a step higher", () => {
    // motif (0, 2) shifted by +1 each time
    expect(isSequence([0, 2, 1, 3, 2, 4])).toBe(true);
  });

  it("accepts a three-note motif restated three times", () => {
    // motif (0, 2, 1) shifted by +2
    expect(isSequence([0, 2, 1, 2, 4, 3, 4, 6, 5])).toBe(true);
  });

  it("rejects a restatement that breaks by one note", () => {
    expect(isSequence([0, 2, 1, 3, 5, 4])).toBe(false);
  });

  it("rejects fewer than three restatements, which is not yet a pattern", () => {
    expect(isSequence([0, 2, 1, 3])).toBe(false);
  });

  it("does not double-count a run as a sequence", () => {
    // (0,1) shifted by 2 is literally 0,1,2,3,4,5 — a run, and must be reported as one only.
    expect(isRun([0, 1, 2, 3, 4, 5])).toBe(true);
    expect(isSequence([0, 1, 2, 3, 4, 5])).toBe(false);
  });
});

describe("matchesAnyShape", () => {
  it("is what 'the tune is right' means, across all three shapes", () => {
    expect(matchesAnyShape([0, 1, 2, 3, 4, 5])).toBe(true);
    expect(matchesAnyShape([0, 1, 2, 3, 2, 1, 0])).toBe(true);
    expect(matchesAnyShape([0, 2, 1, 3, 2, 4])).toBe(true);
  });

  it("rejects a phrase with a displaced note", () => {
    expect(matchesAnyShape([0, 1, 5, 3, 4, 5])).toBe(false);
  });

  it("isSolved is the same question, asked of what is on screen", () => {
    expect(isSolved([0, 1, 2, 3, 4, 5])).toBe(true);
    expect(isSolved([0, 1, 5, 3, 4, 5])).toBe(false);
  });
});

/**
 * The design claim, asserted rather than asserted-in-prose.
 *
 * Every shape predicate reads only the DIFFERENCES between notes, so transposing a whole phrase can
 * never change whether it is well-shaped. That is what makes "the wrong note is in the key" true by
 * construction: there is no privileged set of allowed pitches anywhere in this module, so there is no
 * set for a player to check membership against.
 */
describe("shape is a property of intervals, not of pitches", () => {
  const shaped = [
    [0, 1, 2, 3, 4, 5],
    [0, 1, 2, 3, 2, 1, 0],
    [0, 2, 1, 3, 2, 4],
  ];

  it("is invariant under transposition, over a wide range", () => {
    for (const phrase of shaped) {
      for (let by = -24; by <= 24; by++) {
        expect(matchesAnyShape(phrase.map((d) => d + by))).toBe(true);
      }
    }
  });

  it("stays broken under transposition too", () => {
    const broken = [0, 1, 5, 3, 4, 5];
    for (let by = -24; by <= 24; by++) {
      expect(matchesAnyShape(broken.map((d) => d + by))).toBe(false);
    }
  });
});

describe("movedIndex", () => {
  it("reports which note the player has moved", () => {
    expect(movedIndex([0, 1, 5, 3], [0, 1, 2, 3])).toBe(2);
  });

  it("reports -1 when nothing has been moved", () => {
    expect(movedIndex([0, 1, 5, 3], [0, 1, 5, 3])).toBe(-1);
  });
});

describe("notesFor", () => {
  it("pairs each degree with its beats", () => {
    expect(notesFor([0, 4], [1, 2])).toEqual([
      { degree: 0, beats: 1 },
      { degree: 4, beats: 2 },
    ]);
  });

  it("defaults a missing duration to one beat rather than to zero", () => {
    // A zero-beat note would be silent, which would look like a bug in the audio engine.
    expect(notesFor([0, 1], [1])).toEqual([
      { degree: 0, beats: 1 },
      { degree: 1, beats: 1 },
    ]);
  });
});
