/**
 * The reference solver: every single-semitone move that leaves the melody entirely in the key.
 *
 * The player may only nudge a note by one semitone, so the space of moves is small and enumerable, and
 * this file enumerates all of it in the dumbest possible way. Its value is that it obviously covers the
 * space — when it and the generator disagree, the generator is wrong.
 *
 * `lo`/`hi` are the rows the roll actually draws, so the space searched here and the space the player
 * can act in are the same interval. If they diverged, "unique" would be a claim about a different game
 * than the one on screen.
 */

import { isSolved } from "./logic";

export interface Fix {
  index: number;
  fix: 1 | -1;
}

/** Every one-semitone nudge that leaves nothing sour. */
export function allFixes(phrase: readonly number[], key: number, lo: number, hi: number): Fix[] {
  const found: Fix[] = [];
  const working = [...phrase];
  for (let index = 0; index < phrase.length; index++) {
    const original = phrase[index] as number;
    for (const fix of [1, -1] as const) {
      const moved = original + fix;
      if (moved < lo || moved > hi) continue;
      working[index] = moved;
      if (isSolved(working, key)) found.push({ index, fix });
    }
    working[index] = original;
  }
  return found;
}

/**
 * Whether exactly one NOTE can be fixed, and it is the intended one.
 *
 * Position, not direction. In a major scale every chromatic note lies inside a whole step, so both
 * one-semitone moves of the sour note always land back in the key — there are always two fixes and
 * they are always at the same index. Requiring one *fix* is unsatisfiable; requiring one *index* is
 * the real invariant and is what makes the ear-training question well posed.
 *
 * Three conditions, all necessary:
 *  - the melody as presented really is sour somewhere, or there is nothing to find;
 *  - every available fix is at the same note;
 *  - that note is the one the generator soured.
 */
export function hasUniquePosition(
  phrase: readonly number[],
  key: number,
  lo: number,
  hi: number,
  expectedIndex: number,
): boolean {
  if (isSolved(phrase, key)) return false;
  const fixes = allFixes(phrase, key, lo, hi);
  if (fixes.length === 0) return false;
  return fixes.every((f) => f.index === expectedIndex);
}
