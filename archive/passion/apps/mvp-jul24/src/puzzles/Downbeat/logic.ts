/**
 * Downbeat — where the bar starts, heard from stress alone.
 *
 * A loop of evenly-spaced pulses plays. Some are stressed. The stressed ones are the downbeats, and the
 * child marks every one of them.
 *
 * WHY METRE IS CARRIED BY LOUDNESS AND NOT BY NOTE LENGTH (rule R2)
 * ------------------------------------------------------------------------------------------------
 * The spec's original design put a longer note or a rest at each group boundary. That is how metre is
 * often notated, and it fails R2 outright: a strip of blocks with a wide one every third position has the
 * answer written on it. The spec even conceded the point and filed it as a flag; the R2 audit reclassified
 * it as disqualifying, because "group the durations by eye" is the pattern task this cabin exists to
 * avoid.
 *
 * So **every pulse here is identical in pitch and in length**, and the only difference between a downbeat
 * and an offbeat is that the downbeat is *louder*. The roll therefore draws a row of identical blocks and
 * carries no grouping information at all: nothing about the picture says where the bar starts.
 *
 * WHY IT IS THE ROOM'S ONLY NON-PITCH ACTIVITY, AND WHY THAT MATTERS
 * ------------------------------------------------------------------------------------------------
 * `tune-repair` and `chord-fit` both ask a question about pitch. This one asks about *time*, which is a
 * genuinely separate musical faculty — a child can be strong at one and weak at the other. Three gadgets
 * that all measured pitch discrimination would give the room a much narrower read than its three doors
 * suggest.
 *
 * WHAT COUNTING HAS TO DO WITH IT, STATED HONESTLY
 * ------------------------------------------------------------------------------------------------
 * A child can solve this by counting: loud-soft-soft, loud-soft-soft, so mark every third. That is a
 * legitimate strategy and it does not make the activity arithmetic, because **the counts come from
 * listening** — the input is a stress pattern that exists only in the sound. It is worth writing down
 * rather than glossing, because "you could count it" is the objection someone will raise, and the answer
 * is that counting what you hear is still hearing.
 */

/** A single pitch for the whole loop: nothing varies except stress. */
export const PULSE_SEMITONE = 0;

export interface DownbeatPuzzle {
  /** How many pulses are in the loop. */
  pulses: number;
  /** How many pulses to a bar. The thing the child is really hearing. */
  meter: number;
  /**
   * Which pulse the first downbeat lands on, `0 <= phase < meter`.
   *
   * A non-zero phase is what stops the answer being "the first one, and then every k-th": the loop can
   * start part-way through a bar, so the child has to locate the stress rather than assume it.
   */
  phase: number;
  /** Loudness of a stressed pulse and of a plain one. The gap between them is the difficulty. */
  accentVelocity: number;
  plainVelocity: number;
  bpm: number;
}

/** The pulses that are stressed — the answer. */
export function downbeatIndices(puzzle: DownbeatPuzzle): number[] {
  const out: number[] = [];
  for (let i = 0; i < puzzle.pulses; i++) {
    if ((i - puzzle.phase) % puzzle.meter === 0) out.push(i);
  }
  return out;
}

/** Whether a pulse is stressed. */
export function isDownbeat(puzzle: DownbeatPuzzle, index: number): boolean {
  return (index - puzzle.phase) % puzzle.meter === 0;
}

/**
 * Solved when the marked pulses are exactly the stressed ones — no misses and no extras.
 *
 * Both halves matter. Accepting a subset would let a child mark one obvious downbeat and be told they were
 * right, which tests whether they noticed a loud noise rather than whether they heard a metre.
 */
export function isSolved(puzzle: DownbeatPuzzle, marked: ReadonlySet<number>): boolean {
  const answer = downbeatIndices(puzzle);
  if (marked.size !== answer.length) return false;
  return answer.every((i) => marked.has(i));
}

/**
 * How the child's marking differs from the truth. For a hint-free progress line that says *how many*
 * without saying *which* — the count is feedback, the positions would be the answer.
 */
export function markingDiff(
  puzzle: DownbeatPuzzle,
  marked: ReadonlySet<number>,
): { missing: number; extra: number } {
  const answer = new Set(downbeatIndices(puzzle));
  let missing = 0;
  let extra = 0;
  for (const i of answer) if (!marked.has(i)) missing++;
  for (const i of marked) if (!answer.has(i)) extra++;
  return { missing, extra };
}

/** The loop as notes: one pitch, one length, only loudness varying. */
export function notesFor(
  puzzle: DownbeatPuzzle,
): Array<{ semitone: number; beats: number; velocity: number }> {
  return Array.from({ length: puzzle.pulses }, (_, i) => ({
    semitone: PULSE_SEMITONE,
    beats: 1,
    velocity: isDownbeat(puzzle, i) ? puzzle.accentVelocity : puzzle.plainVelocity,
  }));
}
