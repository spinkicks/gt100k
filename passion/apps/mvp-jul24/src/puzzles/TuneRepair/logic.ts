/**
 * Tune Repair — a melody with one note outside the key, and why that is the whole design.
 *
 * WHAT CHANGED, AND WHY IT IS NOT A TWEAK
 * ------------------------------------------------------------------------------------------------
 * The first version defined "wrong" as a note that broke the melody's **shape** — a run, an arch, a
 * restated motif — with pitch stored as a diatonic degree so every note was in the key by
 * construction. That guarded against one failure and walked into a worse one, which the first
 * playtest named immediately: **a broken shape is visible.** Rendered as blocks on a grid it is "find
 * the bar that breaks the pattern", solvable with the sound off, an IQ-test item wearing a violin.
 *
 * Two of the old tests proved it, which is the part worth remembering: one asserted the puzzle was
 * *"fully solvable in silence"* and called that a feature, and another proved the shape predicates
 * were transposition-invariant — i.e. that the task was about relations between integers, not sound.
 *
 * So wrongness is now **a note outside the key**, and the properties invert:
 *
 * | | shape-breaking (old) | out of key (new) |
 * |---|---|---|
 * | audible? | weakly | **yes — it sounds sour** |
 * | visible? | **yes, obviously** | no: an ordinary row on a chromatic grid |
 * | solvable with sound off? | **yes** | no |
 *
 * The earlier objection to this — "find the note outside the permitted set is set membership, which is
 * deduction" — was backwards, and that is worth stating plainly because it was my own. Set membership
 * is only a shortcut **if the player is shown the set.** Nothing here shows a key signature, so the
 * only access to "which notes belong" is hearing the key. That is not deduction; it is the most
 * ordinary musical perception there is.
 *
 * THE THREE THINGS THAT KEEP IT INVISIBLE
 * ------------------------------------------------------------------------------------------------
 * 1. **Pitch is a chromatic semitone** and the roll draws every semitone as a row, so an out-of-key
 *    note sits on a row like any other. There is no gap, no gap-shaped hole, nothing to notice.
 * 2. **The melody has no visual regularity to break.** `generate.ts` rejects any melody that IS a run,
 *    arch or sequence — the old shape predicates survive in this file for exactly that purpose, with
 *    their meaning inverted from "what right looks like" to "what would give the answer away".
 * 3. **The displacement is one semitone**, the smallest move there is, so the contour barely changes.
 *
 * WHAT THIS COSTS, RECORDED HONESTLY
 * ------------------------------------------------------------------------------------------------
 * This activity **cannot be solved without hearing it.** That is the point, and it is a real
 * regression against `DISCOVERY-APP-PRD.md` §5.2's Layer-3 accessibility mirror, which requires 1:1
 * parity with the world. A deaf or hard-of-hearing child cannot do this task, and no visual
 * representation can fix that without turning it back into a shape puzzle. The surface owner accepted
 * that cost knowingly; the app says so rather than presenting a puzzle that silently cannot be
 * finished. It is also an argument for the music room holding at least one activity that is not
 * pitch-perception based.
 */

import { isInKey } from "../../audio/pitch";

/**
 * Shapes a melody must NOT have.
 *
 * These predicates were the old definition of a correct phrase. They are kept, unchanged in
 * behaviour and inverted in purpose: a melody matching any of them has a visible regularity, so a
 * displaced note would be findable by eye and the activity would stop being about listening.
 * `generate.ts` uses them as a rejection filter.
 */
export type ShapeKind = "run" | "arch" | "sequence";

export const SHAPE_KINDS: readonly ShapeKind[] = ["run", "arch", "sequence"];

/** Step sizes, in semitones, that a "regular" pattern could be built from. */
const REGULAR_STEPS = [1, 2, 3, 4] as const;

/** Shortest melody where a pattern would be perceptible at all. */
export const MIN_LENGTH = 5;

const diffs = (ds: readonly number[]): number[] => ds.slice(1).map((d, i) => d - (ds[i] as number));

const isRegularStep = (step: number): boolean =>
  (REGULAR_STEPS as readonly number[]).includes(Math.abs(step));

/** Every step identical: a visible staircase. */
export function isRun(ds: readonly number[]): boolean {
  if (ds.length < MIN_LENGTH) return false;
  const steps = diffs(ds);
  const first = steps[0] as number;
  if (first === 0 || !isRegularStep(first)) return false;
  return steps.every((s) => s === first);
}

/** A staircase up then the same staircase down: a visible hill or valley. */
export function isArch(ds: readonly number[]): boolean {
  if (ds.length < MIN_LENGTH) return false;
  const steps = diffs(ds);
  const first = steps[0] as number;
  if (first === 0 || !isRegularStep(first)) return false;
  const turn = steps.findIndex((s) => Math.sign(s) !== Math.sign(first));
  if (turn < 2 || turn > steps.length - 2) return false;
  return (
    steps.slice(0, turn).every((s) => s === first) && steps.slice(turn).every((s) => s === -first)
  );
}

/** A motif restated at a constant offset: a visible repeat. */
export function isSequence(ds: readonly number[]): boolean {
  if (ds.length < MIN_LENGTH) return false;
  for (const motif of [2, 3]) {
    const reps = ds.length / motif;
    if (!Number.isInteger(reps) || reps < 3) continue;
    const offset = (ds[motif] as number) - (ds[0] as number);
    if (offset === 0 || !isRegularStep(offset)) continue;
    let ok = true;
    for (let i = 0; i < ds.length && ok; i++) {
      const expected = (ds[i % motif] as number) + Math.floor(i / motif) * offset;
      if (ds[i] !== expected) ok = false;
    }
    if (ok && !isRun(ds)) return true;
  }
  return false;
}

const MATCHERS: Record<ShapeKind, (ds: readonly number[]) => boolean> = {
  run: isRun,
  arch: isArch,
  sequence: isSequence,
};

/**
 * Whether a melody has a visible regularity — which is now a REASON TO REJECT IT.
 *
 * Named for what it detects rather than for what it used to mean, so nobody reads a call site as
 * "check the answer".
 */
export function hasVisiblePattern(ds: readonly number[]): boolean {
  return SHAPE_KINDS.some((kind) => MATCHERS[kind](ds));
}

/** One puzzle instance. Pitches are chromatic semitones relative to the cabin's reference. */
export interface TuneRepairPuzzle {
  /** Tonic pitch class, 0..11. Never shown; the child hears the key, they are not told it. */
  key: number;
  /** The melody as it should sound: every note in `key`. */
  correct: readonly number[];
  /** The melody as presented: one note moved a semitone out of the key. */
  broken: readonly number[];
  /** Index of the sour note. */
  brokenIndex: number;
  /**
   * The direction, +1 or -1 semitone, that restores the note the generator actually composed.
   *
   * **Not the only accepted answer.** In a major scale every chromatic note lies inside a whole step,
   * so both nudges of the sour note land back in the key and both are correct — `naive.ts` explains
   * why that is forced rather than lenient. This field exists so tests can drive the intended move and
   * so a future feature could show what the melody originally was; the game does not require it.
   */
  fix: 1 | -1;
  /** Beats per note. Rhythm is not the puzzle. */
  beats: readonly number[];
  /** Inclusive chromatic row range the roll draws. */
  lo: number;
  hi: number;
  /** Playback tempo. Slower is easier. */
  bpm: number;
}

/** Indices of every note outside the key. A well-formed instance presents exactly one. */
export function sourIndices(phrase: readonly number[], key: number): number[] {
  const out: number[] = [];
  phrase.forEach((semitone, i) => {
    if (!isInKey(semitone, key)) out.push(i);
  });
  return out;
}

/** The melody is right when nothing in it is sour. */
export function isSolved(phrase: readonly number[], key: number): boolean {
  return sourIndices(phrase, key).length === 0;
}

/** Which note differs from the presented melody, or -1. */
export function movedIndex(broken: readonly number[], current: readonly number[]): number {
  for (let i = 0; i < broken.length; i++) if (broken[i] !== current[i]) return i;
  return -1;
}

/** The playable sequence for the audio engine. */
export function notesFor(
  semitones: readonly number[],
  beats: readonly number[],
): Array<{ semitone: number; beats: number }> {
  return semitones.map((semitone, i) => ({ semitone, beats: beats[i] ?? 1 }));
}
