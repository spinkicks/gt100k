import { describe, expect, it } from "vitest";
import {
  PULSE_SEMITONE,
  type DownbeatPuzzle,
  downbeatIndices,
  isDownbeat,
  isSolved,
  markingDiff,
  notesFor,
} from "./logic";

const triple: DownbeatPuzzle = {
  pulses: 9,
  meter: 3,
  phase: 0,
  accentVelocity: 1,
  plainVelocity: 0.4,
  bpm: 90,
};
const offset: DownbeatPuzzle = { ...triple, phase: 2 };

describe("downbeatIndices", () => {
  it("marks every meter-th pulse from the phase", () => {
    expect(downbeatIndices(triple)).toEqual([0, 3, 6]);
  });

  it("respects a phase offset, so the loop can start mid-bar", () => {
    expect(downbeatIndices(offset)).toEqual([2, 5, 8]);
  });

  it("agrees with isDownbeat everywhere", () => {
    for (const p of [triple, offset]) {
      const set = new Set(downbeatIndices(p));
      for (let i = 0; i < p.pulses; i++) expect(isDownbeat(p, i)).toBe(set.has(i));
    }
  });
});

describe("isSolved", () => {
  it("needs every downbeat and nothing else", () => {
    expect(isSolved(triple, new Set([0, 3, 6]))).toBe(true);
  });

  /**
   * A subset must NOT pass. Accepting one obvious downbeat would test whether the child noticed a loud
   * noise, not whether they heard a recurring metre — which is the construct.
   */
  it("rejects a subset, so noticing one loud pulse is not enough", () => {
    expect(isSolved(triple, new Set([0]))).toBe(false);
    expect(isSolved(triple, new Set([0, 3]))).toBe(false);
  });

  it("rejects extras", () => {
    expect(isSolved(triple, new Set([0, 3, 6, 7]))).toBe(false);
  });

  it("rejects the right count in the wrong places", () => {
    expect(isSolved(triple, new Set([1, 4, 7]))).toBe(false);
  });

  it("rejects an empty marking", () => {
    expect(isSolved(triple, new Set())).toBe(false);
  });
});

describe("markingDiff", () => {
  it("counts what is missing and what is spurious", () => {
    expect(markingDiff(triple, new Set([0, 1]))).toEqual({ missing: 2, extra: 1 });
  });

  it("is all zeroes exactly when solved", () => {
    expect(markingDiff(triple, new Set([0, 3, 6]))).toEqual({ missing: 0, extra: 0 });
  });
});

describe("notesFor — the metre lives in loudness and nowhere else", () => {
  it("gives every pulse the same pitch and the same length", () => {
    const notes = notesFor(triple);
    expect(new Set(notes.map((n) => n.semitone))).toEqual(new Set([PULSE_SEMITONE]));
    expect(new Set(notes.map((n) => n.beats))).toEqual(new Set([1]));
  });

  /**
   * The R2 assertion at the data layer: the ONLY field that varies across the loop is velocity. If a future
   * change expressed the metre in `beats` or `semitone`, the grouping would become visible in the roll and
   * this test is what fails.
   */
  it("varies velocity and nothing else", () => {
    const notes = notesFor(triple);
    const varying = (["semitone", "beats", "velocity"] as const).filter(
      (k) => new Set(notes.map((n) => n[k])).size > 1,
    );
    expect(varying).toEqual(["velocity"]);
  });

  it("makes the downbeats the loud ones", () => {
    const notes = notesFor(triple);
    notes.forEach((n, i) => {
      expect(n.velocity).toBe(isDownbeat(triple, i) ? triple.accentVelocity : triple.plainVelocity);
    });
  });

  it("plays one note per pulse", () => {
    expect(notesFor(triple)).toHaveLength(triple.pulses);
  });
});
