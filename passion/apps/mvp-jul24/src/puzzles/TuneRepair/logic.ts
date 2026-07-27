/**
 * Tune Repair — what a phrase is, what makes one *shaped*, and what makes a note wrong.
 *
 * THE ONE DECISION THIS FILE EXISTS TO PROTECT
 * ------------------------------------------------------------------------------------------------
 * The wrong note is **in the key and wrong for the phrase**. It is never the odd note out of a
 * permitted set.
 *
 * That is not a refinement, it is the difference between this gadget belonging in the music cabin and
 * belonging in `logic-games`. "Find the element that is not in the allowed set" is set membership,
 * i.e. deduction — and `docs/research/passion-pipeline/06-activity-design-ages-6-8.md` conflict C1 is
 * the record of this exact mistake being made across all seven of the app's original puzzles, which
 * is why the `logic-games` / `math` split exists at all. A music gadget that can be solved by
 * checking membership is a logic gadget with a violin painted on it.
 *
 * Two things enforce it:
 *
 *  1. **Pitch is a diatonic degree** (`src/audio/pitch.ts`), so *every* integer is a legal note in
 *     the key. An out-of-key note is not rejected by a check — it is unrepresentable. The wrong note
 *     is therefore necessarily diatonic, by construction rather than by vigilance.
 *  2. **Wrongness is defined against a SHAPE**, below. A phrase is right when it is a run, an arch or
 *     a sequence; it is broken when exactly one note has been displaced so that the shape no longer
 *     holds. What the child hears is a melody that stops making sense at one point, which is a
 *     musical judgement and not a lookup.
 *
 * WHY THE SHAPE IS NEVER STATED TO THE PLAYER
 * ------------------------------------------------------------------------------------------------
 * `matchesAnyShape` is what the answer is checked against, not `matchesShape(kind)`. The player is
 * not told which of the three shapes a phrase is, so any single move that lands the phrase on *any*
 * valid shape is a defensible answer, and the generator's uniqueness requirement is stated over all
 * three (see `naive.ts`). Checking only the generated kind would let the generator ship phrases with
 * a second, musically reasonable answer that the game then called wrong.
 *
 * R1: no function here returns anything for display. Degrees are indices into a layout, never labels.
 */

/** The shapes a well-formed phrase can have. Deliberately few, and all audible in one hearing. */
export type ShapeKind = "run" | "arch" | "sequence";

export const SHAPE_KINDS: readonly ShapeKind[] = ["run", "arch", "sequence"];

/** Step sizes a shape may use, in diatonic degrees: neighbouring notes, or thirds. */
export const ALLOWED_STEPS = [1, 2] as const;

/** Shortest phrase any shape may have. Below this nothing is perceptible as a shape at all. */
export const MIN_LENGTH = 5;

const diffs = (ds: readonly number[]): number[] => ds.slice(1).map((d, i) => d - (ds[i] as number));

const isAllowedStep = (step: number): boolean =>
  (ALLOWED_STEPS as readonly number[]).includes(Math.abs(step));

/**
 * A **run**: every step identical, so the phrase walks steadily in one direction.
 *
 * Heard as a scale (step 1) or a broken chord (step 2). The most legible shape of the three, which is
 * why the easier tier uses it.
 */
export function isRun(ds: readonly number[]): boolean {
  if (ds.length < MIN_LENGTH) return false;
  const steps = diffs(ds);
  const first = steps[0] as number;
  if (first === 0 || !isAllowedStep(first)) return false;
  return steps.every((s) => s === first);
}

/**
 * An **arch**: a run up then the same run down, or a valley the other way. Exactly one turn.
 *
 * Both legs must use the same step magnitude and each must be at least two steps long, so the turn
 * reads as a turn rather than as a blip at one end.
 */
export function isArch(ds: readonly number[]): boolean {
  if (ds.length < MIN_LENGTH) return false;
  const steps = diffs(ds);
  const first = steps[0] as number;
  if (first === 0 || !isAllowedStep(first)) return false;

  // Where the direction flips. Exactly one flip, with two steps either side of it.
  const turn = steps.findIndex((s) => Math.sign(s) !== Math.sign(first));
  if (turn < 2 || turn > steps.length - 2) return false;

  const before = steps.slice(0, turn);
  const after = steps.slice(turn);
  if (!before.every((s) => s === first)) return false;
  return after.every((s) => s === -first);
}

/**
 * A **sequence**: a short motif restated, each restatement shifted by a constant amount.
 *
 * The musical device behind a great deal of tonal melody — say a thing, say it again higher. Heard as
 * a pattern with a lift, and broken very audibly by one displaced note because the ear is already
 * predicting the restatement.
 *
 * The motif itself must not be a constant walk, or the whole phrase collapses into a run and would be
 * counted twice.
 */
export function isSequence(ds: readonly number[]): boolean {
  if (ds.length < MIN_LENGTH) return false;
  for (const motif of [2, 3]) {
    const reps = ds.length / motif;
    if (!Number.isInteger(reps) || reps < 3) continue;

    const offset = (ds[motif] as number) - (ds[0] as number);
    if (offset === 0 || !isAllowedStep(offset)) continue;

    let ok = true;
    for (let i = 0; i < ds.length && ok; i++) {
      const rep = Math.floor(i / motif);
      const within = i % motif;
      const expected = (ds[within] as number) + rep * offset;
      if (ds[i] !== expected) ok = false;
    }
    // A motif that is itself a constant step makes the whole thing a run, not a sequence.
    if (ok && !isRun(ds)) return true;
  }
  return false;
}

const MATCHERS: Record<ShapeKind, (ds: readonly number[]) => boolean> = {
  run: isRun,
  arch: isArch,
  sequence: isSequence,
};

export function matchesShape(ds: readonly number[], kind: ShapeKind): boolean {
  return MATCHERS[kind](ds);
}

/**
 * Whether a phrase is well-shaped under **any** shape.
 *
 * This — not `matchesShape` — is the definition of "the tune is right", for the reason in the header:
 * the player is never told which shape they are listening to.
 */
export function matchesAnyShape(ds: readonly number[]): boolean {
  return SHAPE_KINDS.some((kind) => MATCHERS[kind](ds));
}

/** One puzzle instance. Everything the component and the tests need, and nothing displayable. */
export interface TuneRepairPuzzle {
  /** Which shape the generator built. Diagnostic and test-facing; never shown, never checked against. */
  shape: ShapeKind;
  /** The phrase as it should sound. */
  correct: readonly number[];
  /** The phrase as presented: `correct` with exactly one note displaced. */
  broken: readonly number[];
  /** Index of the displaced note. */
  brokenIndex: number;
  /** Beats per note, same length as the phrase. Rhythm is not the puzzle here. */
  beats: readonly number[];
  /** Inclusive degree range the player may move a note within, and the rows the roll draws. */
  lo: number;
  hi: number;
  /** Playback tempo for this phrase. The easiest tier is slower, which is a difficulty lever. */
  bpm: number;
}

/** The phrase currently on screen is right when it is well-shaped again. */
export function isSolved(phrase: readonly number[]): boolean {
  return matchesAnyShape(phrase);
}

/** Which note differs from the presented phrase, or -1. Used for "you have moved this one". */
export function movedIndex(broken: readonly number[], current: readonly number[]): number {
  for (let i = 0; i < broken.length; i++) if (broken[i] !== current[i]) return i;
  return -1;
}

/** The playable sequence for the audio engine. */
export function notesFor(
  degrees: readonly number[],
  beats: readonly number[],
): Array<{ degree: number; beats: number }> {
  return degrees.map((degree, i) => ({ degree, beats: beats[i] ?? 1 }));
}
