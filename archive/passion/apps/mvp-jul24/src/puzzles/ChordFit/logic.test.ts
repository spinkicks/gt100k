import { describe, expect, it } from "vitest";
import { degreeInKey, isInKey } from "../../audio/pitch";
import {
  type ChordFitPuzzle,
  chordContains,
  isCorrect,
  supportingIndices,
  triadOn,
  voicingFor,
} from "./logic";

describe("triadOn", () => {
  it("stacks thirds on a scale degree", () => {
    // C major tonic triad, voiced an octave down: C E G.
    expect(triadOn(0, 0)).toEqual([-12, -8, -5]);
  });

  it("stays inside the key for every degree of every key", () => {
    for (let key = 0; key < 12; key++) {
      for (let root = 0; root < 7; root++) {
        for (const s of triadOn(root, key)) {
          expect(isInKey(s, key), `key ${key} root ${root}`).toBe(true);
        }
      }
    }
  });

  it("voices below the melody, so the chord supports rather than covers", () => {
    const melody = degreeInKey(4, 0);
    for (const s of triadOn(0, 0)) expect(s).toBeLessThan(melody);
  });
});

describe("chordContains", () => {
  it("ignores octaves, which is what the ear does", () => {
    expect(chordContains([-12, -8, -5], 0)).toBe(true);
    expect(chordContains([-12, -8, -5], 12)).toBe(true);
  });

  it("rejects a pitch class the chord does not hold", () => {
    // C E G does not contain D.
    expect(chordContains([-12, -8, -5], 2)).toBe(false);
  });
});

const puzzle: ChordFitPuzzle = {
  key: 0,
  melodyNote: 4,
  options: [triadOn(1, 0), triadOn(0, 0), triadOn(3, 0)],
  answer: 1,
  beats: 2,
  bpm: 90,
};

describe("supportingIndices", () => {
  it("finds exactly the option containing the melody note", () => {
    // E is in C major's tonic triad (C E G) and in neither Dm (D F A) nor F (F A C).
    expect(supportingIndices(puzzle)).toEqual([1]);
  });

  it("agrees with the recorded answer", () => {
    expect(supportingIndices(puzzle)).toEqual([puzzle.answer]);
  });
});

describe("isCorrect", () => {
  it("accepts only the supporting chord", () => {
    expect(isCorrect(puzzle, 1)).toBe(true);
    expect(isCorrect(puzzle, 0)).toBe(false);
    expect(isCorrect(puzzle, 2)).toBe(false);
  });
});

describe("voicingFor", () => {
  it("sounds the chord together with the melody note, because support is a relation", () => {
    const voicing = voicingFor(puzzle, 1);
    expect(voicing).toHaveLength(4);
    expect(voicing.map((n) => n.semitone)).toContain(puzzle.melodyNote);
    // Every note starts together and lasts the same, which is what makes it a chord and not a line.
    expect(new Set(voicing.map((n) => n.beats))).toEqual(new Set([puzzle.beats]));
  });

  it("includes the melody note even for a clashing option, so the clash is audible", () => {
    expect(voicingFor(puzzle, 0).map((n) => n.semitone)).toContain(puzzle.melodyNote);
  });
});
