/**
 * Chord Fit — which chord holds this note up.
 *
 * A single melody note sounds. Three chords can be played. Exactly one of them contains that note, so
 * exactly one of them sounds like it belongs underneath it; the other two clash.
 *
 * WHY THE CHORDS ARE NEVER DRAWN (rule R2)
 * ------------------------------------------------------------------------------------------------
 * `PROJECT.md`'s R2: the property that makes an answer wrong must have no visual signature. The first
 * version of this cabin's other gadget failed exactly that test — it drew the thing the ear was meant to
 * judge — and the spec's original design for *this* gadget had the same flaw, proposing to "stack the
 * notes vertically so interval spacing is visible". Spacing is a learnable shortcut: a child would find
 * the evenly-spaced one and stop listening.
 *
 * So this module deliberately exposes **no geometry at all**. There is no roll, no row, no height. A
 * chord is a set of pitches you can play and nothing you can look at, and the only thing on screen is
 * three identical buttons. That is also why this file has no `lo`/`hi` and no notion of a grid: there is
 * nothing to lay out.
 *
 * WHAT MAKES IT MUSIC AND NOT ARITHMETIC
 * ------------------------------------------------------------------------------------------------
 * The construct is **harmonic support**: whether a note belongs to a chord is heard as consonance, and
 * the wrong answers are heard as a clash. It could in principle be computed — "is 4 a member of {0,4,7}"
 * — but nothing in the interface offers the numbers to compute with, which is the whole point of R2.
 * `math` already owns the arithmetic cabin; this asks the ear a question the eye is not given.
 *
 * Distinct from `tune-repair`, which is in-key perception over a melody. This is vertical: simultaneous
 * notes, consonance and clash, one moment rather than a line.
 */

import { degreeInKey, pitchClass } from "../../audio/pitch";

/** Scale degrees of a diatonic triad, rooted on a scale degree. Thirds stacked, the ordinary way. */
const TRIAD_DEGREES = [0, 2, 4] as const;

/** A chord as absolute semitones, lowest first. Playable, never drawable. */
export type Chord = readonly number[];

/**
 * Build the diatonic triad on `rootDegree` of `key`, voiced below `ceiling` so it sits under the melody
 * note rather than on top of it.
 *
 * Diatonic triads only: every chord here is one the key itself contains, so a wrong answer clashes with
 * the melody note without ever sounding like it came from a different piece of music.
 */
export function triadOn(rootDegree: number, key: number, octaveOffset = -12): Chord {
  return TRIAD_DEGREES.map((d) => degreeInKey(rootDegree + d, key) + octaveOffset);
}

/**
 * Drop `chord` by whole octaves until every note of it sits below `melodyNote`.
 *
 * A supporting chord belongs UNDER the melody: that is the ordinary texture, and it is what makes the
 * melody note audibly the thing being held up rather than one voice in a cluster. A fixed octave offset
 * does not achieve it — a triad rooted on the sixth or seventh degree reaches high enough to poke above
 * a low melody note, which a test caught.
 *
 * Shifting by whole octaves leaves every pitch class untouched, so it cannot change which chord this is
 * or whether it contains the melody note.
 */
export function voiceBelow(chord: Chord, melodyNote: number): Chord {
  let voiced = [...chord];
  let guard = 0;
  while (Math.max(...voiced) >= melodyNote && guard++ < 12) {
    voiced = voiced.map((s) => s - 12);
  }
  return voiced;
}

/** Whether `semitone`'s pitch class appears in `chord`, ignoring octaves — which is what the ear hears. */
export function chordContains(chord: Chord, semitone: number): boolean {
  const target = pitchClass(semitone);
  return chord.some((s) => pitchClass(s) === target);
}

export interface ChordFitPuzzle {
  /** Tonic pitch class, 0..11. Never shown. */
  key: number;
  /** The melody note the child is trying to support. */
  melodyNote: number;
  /**
   * The three chords, in the order they are offered.
   *
   * Order is randomised per instance, so position carries no information — the answer is not "usually
   * the middle one", and a child cannot learn a slot.
   */
  options: readonly Chord[];
  /** Index into `options` of the chord containing the melody note. */
  answer: number;
  /** How long the melody note is held, in beats. */
  beats: number;
  /** Playback tempo, which sets how long each chord rings. */
  bpm: number;
}

/**
 * Which of the offered chords actually support the melody note.
 *
 * A well-formed instance has exactly one. This is the reference check the generator holds itself to, and
 * is the whole win condition: there is no partial credit and nothing to accumulate.
 */
export function supportingIndices(puzzle: ChordFitPuzzle): number[] {
  const out: number[] = [];
  puzzle.options.forEach((chord, i) => {
    if (chordContains(chord, puzzle.melodyNote)) out.push(i);
  });
  return out;
}

/** Whether the child's pick supports the melody note. */
export function isCorrect(puzzle: ChordFitPuzzle, picked: number): boolean {
  return picked === puzzle.answer;
}

/** The chord plus the melody note, as the engine wants it — everything sounding together. */
export function voicingFor(
  puzzle: ChordFitPuzzle,
  chordIndex: number,
): Array<{ semitone: number; beats: number }> {
  const chord = puzzle.options[chordIndex] ?? [];
  return [...chord, puzzle.melodyNote].map((semitone) => ({ semitone, beats: puzzle.beats }));
}
