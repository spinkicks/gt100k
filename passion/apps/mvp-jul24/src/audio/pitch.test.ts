import { describe, expect, it } from "vitest";
import {
  A4_HZ,
  DEGREES_PER_OCTAVE,
  MAJOR_STEPS,
  TONIC_FROM_A4,
  degreeToSemitone,
  frequencyForDegree,
  frequencyForSemitone,
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
