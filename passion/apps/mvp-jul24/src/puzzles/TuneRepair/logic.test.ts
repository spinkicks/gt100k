import { describe, expect, it } from "vitest";
import { degreeInKey } from "../../audio/pitch";
import {
  MIN_LENGTH,
  hasVisiblePattern,
  isArch,
  isRun,
  isSequence,
  isSolved,
  movedIndex,
  notesFor,
  sourIndices,
} from "./logic";

describe("sourIndices — what 'wrong' means now", () => {
  it("finds the note outside the key", () => {
    // C major (key 0): C E G with a C# dropped in at index 1.
    expect(sourIndices([0, 1, 4, 7], 0)).toEqual([1]);
  });

  it("finds nothing in a melody entirely in the key", () => {
    expect(sourIndices([0, 2, 4, 5, 7], 0)).toEqual([]);
  });

  it("is relative to the key, not to a fixed set of pitches", () => {
    // F# is sour in C major and perfectly ordinary in D major.
    expect(sourIndices([6], 0)).toEqual([0]);
    expect(sourIndices([6], 2)).toEqual([]);
  });

  it("works across octaves in both directions", () => {
    expect(sourIndices([1, 13, -11], 0)).toEqual([0, 1, 2]);
    expect(sourIndices([0, 12, -12], 0)).toEqual([]);
  });
});

describe("isSolved", () => {
  it("is true exactly when nothing is sour", () => {
    expect(isSolved([0, 2, 4], 0)).toBe(true);
    expect(isSolved([0, 3, 4], 0)).toBe(false);
  });
});

/**
 * The property that makes this a listening task rather than a looking one.
 *
 * Whether a note is sour depends on the KEY, which is audible and is never displayed. Two melodies
 * with identical contours — the same shape on screen, note for note — differ in which note is sour
 * once the key differs. So the picture cannot carry the answer, and a solver with only the contour has
 * strictly less information than one who can hear.
 */
describe("the same contour can be right in one key and wrong in another", () => {
  it("holds for a concrete pair", () => {
    const contour = [0, 4, 6, 7];
    // In C major, 6 (F#) is sour.
    expect(sourIndices(contour, 0)).toEqual([2]);
    // Transpose the KEY, not the notes: in G major (key 7) every one of those notes belongs.
    expect(sourIndices(contour, 7)).toEqual([]);
  });

  it("means an identical drawing has different answers, so the drawing is not the answer", () => {
    const contour = [0, 2, 3, 5, 7];
    const soursByKey = new Set(
      [0, 1, 2, 3, 4, 5].map((key) => sourIndices(contour, key).join(",")),
    );
    // Several distinct answers for one picture.
    expect(soursByKey.size).toBeGreaterThan(1);
  });
});

/**
 * The old shape predicates, kept with their meaning inverted: matching one is now a reason to REJECT a
 * melody, because a visible regularity is a route to the answer that does not go through the ear.
 */
describe("hasVisiblePattern — a rejection filter, not a win condition", () => {
  it("flags a constant staircase", () => {
    expect(isRun([0, 2, 4, 6, 8])).toBe(true);
    expect(hasVisiblePattern([0, 2, 4, 6, 8])).toBe(true);
  });

  it("flags a hill and a valley", () => {
    expect(isArch([0, 2, 4, 6, 4, 2, 0])).toBe(true);
    expect(isArch([6, 4, 2, 0, 2, 4, 6])).toBe(true);
  });

  it("flags a restated motif", () => {
    // motif (0, 4) restated a semitone higher each time
    expect(isSequence([0, 4, 1, 5, 2, 6])).toBe(true);
  });

  it("passes an irregular melody, which is what the generator wants", () => {
    expect(hasVisiblePattern([0, 4, 2, 7, 5, 9])).toBe(false);
  });

  it("ignores anything too short to read as a pattern", () => {
    expect(hasVisiblePattern([0, 2, 4, 6])).toBe(false);
    expect(MIN_LENGTH).toBe(5);
  });

  it("does not double-count a run as a sequence", () => {
    expect(isRun([0, 1, 2, 3, 4, 5])).toBe(true);
    expect(isSequence([0, 1, 2, 3, 4, 5])).toBe(false);
  });
});

describe("melodies built from degrees are automatically in key", () => {
  it("holds for every key", () => {
    for (let key = 0; key < 12; key++) {
      const melody = [0, 2, 1, 4, 3, 7].map((d) => degreeInKey(d, key));
      expect(sourIndices(melody, key)).toEqual([]);
      expect(isSolved(melody, key)).toBe(true);
    }
  });
});

describe("movedIndex", () => {
  it("reports which note the player has moved", () => {
    expect(movedIndex([0, 1, 5, 3], [0, 1, 4, 3])).toBe(2);
  });

  it("reports -1 when nothing has been moved", () => {
    expect(movedIndex([0, 1, 5, 3], [0, 1, 5, 3])).toBe(-1);
  });
});

describe("notesFor", () => {
  it("pairs each semitone with its beats", () => {
    expect(notesFor([0, 4], [1, 2])).toEqual([
      { semitone: 0, beats: 1 },
      { semitone: 4, beats: 2 },
    ]);
  });

  it("defaults a missing duration to one beat rather than to zero", () => {
    // A zero-beat note would be silent, which would look like an audio bug.
    expect(notesFor([0, 1], [1])).toEqual([
      { semitone: 0, beats: 1 },
      { semitone: 1, beats: 1 },
    ]);
  });
});
