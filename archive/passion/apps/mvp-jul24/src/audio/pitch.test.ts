import { describe, expect, it } from "vitest";
import {
  A4_HZ,
  DEGREES_PER_OCTAVE,
  MAJOR_STEPS,
  TONIC_FROM_A4,
  degreeInKey,
  degreeToSemitone,
  frequencyForDegree,
  frequencyForSemitone,
  isInKey,
  pitchClass,
} from "./pitch";

describe("degreeToSemitone", () => {
  it("maps the first octave to the major scale", () => {
    const got = [0, 1, 2, 3, 4, 5, 6].map(degreeToSemitone);
    expect(got).toEqual([...MAJOR_STEPS]);
  });

  it("puts degree 7 exactly an octave above the tonic", () => {
    expect(degreeToSemitone(DEGREES_PER_OCTAVE)).toBe(12);
    expect(degreeToSemitone(2 * DEGREES_PER_OCTAVE)).toBe(24);
  });

  /**
   * The floor-division case. Truncating toward zero would give octave 0 and index -1 here, which
   * reads off the end of the table — so this is the test that fails if `Math.floor` is "simplified".
   */
  it("handles negative degrees by descending the scale, not by reflecting it", () => {
    // A step below the tonic is the seventh of the octave below: 11 - 12 = -1.
    expect(degreeToSemitone(-1)).toBe(-1);
    // Two steps below is the sixth: 9 - 12 = -3.
    expect(degreeToSemitone(-2)).toBe(-3);
    expect(degreeToSemitone(-DEGREES_PER_OCTAVE)).toBe(-12);
  });

  it("is strictly increasing across a wide range, so higher degree always means higher pitch", () => {
    for (let d = -20; d < 20; d++) {
      expect(degreeToSemitone(d + 1)).toBeGreaterThan(degreeToSemitone(d));
    }
  });

  it("keeps every step to one or two semitones, which is what makes it a scale", () => {
    for (let d = -20; d < 20; d++) {
      const step = degreeToSemitone(d + 1) - degreeToSemitone(d);
      expect([1, 2]).toContain(step);
    }
  });
});

describe("frequencyForSemitone", () => {
  it("returns A4 at offset zero", () => {
    expect(frequencyForSemitone(0)).toBeCloseTo(A4_HZ, 6);
  });

  it("doubles every octave and halves every octave down", () => {
    expect(frequencyForSemitone(12)).toBeCloseTo(880, 6);
    expect(frequencyForSemitone(-12)).toBeCloseTo(220, 6);
  });

  it("puts the equal-tempered fifth where the literature says it is", () => {
    // Seven semitones above A4 is E5: 659.255 Hz, and deliberately NOT the just 3:2 (660).
    expect(frequencyForSemitone(7)).toBeCloseTo(659.255, 3);
  });

  it("accepts a different reference pitch", () => {
    expect(frequencyForSemitone(0, 415)).toBeCloseTo(415, 6);
    expect(frequencyForSemitone(12, 415)).toBeCloseTo(830, 6);
  });
});

describe("isInKey — the definition of 'sour'", () => {
  it("accepts the seven notes of the major scale and rejects the other five", () => {
    // C major: C D E F G A B in, the five black notes out.
    const inC = [0, 2, 4, 5, 7, 9, 11];
    for (let s = 0; s < 12; s++) {
      expect(isInKey(s, 0), `semitone ${s}`).toBe(inC.includes(s));
    }
  });

  it("transposes with the key", () => {
    // D major (key 2) contains F# (6) and C# (1), and excludes F (5) and C (0).
    expect(isInKey(6, 2)).toBe(true);
    expect(isInKey(1, 2)).toBe(true);
    expect(isInKey(5, 2)).toBe(false);
    expect(isInKey(0, 2)).toBe(false);
  });

  it("is octave-invariant, upward and downward", () => {
    for (const key of [0, 3, 7, 11]) {
      for (let s = -36; s < 36; s++) {
        expect(isInKey(s, key)).toBe(isInKey(s + 12, key));
      }
    }
  });

  it("holds for every key: exactly seven of twelve pitch classes are in", () => {
    for (let key = 0; key < 12; key++) {
      const inKey = Array.from({ length: 12 }, (_, s) => isInKey(s, key)).filter(Boolean);
      expect(inKey).toHaveLength(7);
    }
  });
});

describe("degreeInKey", () => {
  it("lands on in-key notes for every degree of every key", () => {
    for (let key = 0; key < 12; key++) {
      for (let d = -14; d <= 14; d++) {
        expect(isInKey(degreeInKey(d, key), key), `key ${key} degree ${d}`).toBe(true);
      }
    }
  });

  it("is strictly increasing, so a higher degree is a higher note", () => {
    for (let d = -14; d < 14; d++) {
      expect(degreeInKey(d + 1, 5)).toBeGreaterThan(degreeInKey(d, 5));
    }
  });
});

describe("pitchClass", () => {
  it("wraps negatives into 0..11", () => {
    expect(pitchClass(-1)).toBe(11);
    expect(pitchClass(-12)).toBe(0);
    expect(pitchClass(13)).toBe(1);
  });
});

describe("frequencyForDegree", () => {
  it("places the tonic at middle C", () => {
    // TONIC_FROM_A4 is -9 semitones, i.e. C4 = 261.626 Hz.
    expect(TONIC_FROM_A4).toBe(-9);
    expect(frequencyForDegree(0)).toBeCloseTo(261.626, 3);
  });

  it("puts the octave degree at twice the tonic", () => {
    expect(frequencyForDegree(DEGREES_PER_OCTAVE)).toBeCloseTo(2 * frequencyForDegree(0), 6);
  });

  it("is audible across the range a phrase can wander", () => {
    for (let d = -14; d <= 21; d++) {
      const hz = frequencyForDegree(d);
      expect(hz).toBeGreaterThan(60);
      expect(hz).toBeLessThan(4200);
    }
  });
});
