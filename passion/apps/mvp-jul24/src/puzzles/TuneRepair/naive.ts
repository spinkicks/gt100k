/**
 * The reference solver: every single-note repair that makes a broken phrase well-shaped again.
 *
 * WHAT IT IS FOR
 * ------------------------------------------------------------------------------------------------
 * Two jobs, and the second is the important one.
 *
 *  1. It is the oracle the generator checks itself against: an instance ships only if there is
 *     **exactly one** repair in the whole search space (`generate.ts`).
 *  2. It defines what "exactly one" means honestly. The space is every note position crossed with
 *     every degree the player can actually reach — the same `[lo, hi]` rows the roll draws — and
 *     success is `matchesAnyShape`, not the shape the generator happened to build. So a phrase with a
 *     second, musically defensible answer is rejected rather than shipped and then marked wrong.
 *
 * It is deliberately the dumbest possible implementation. Its whole value is that it obviously
 * enumerates the space, so when it and the generator disagree, the generator is wrong.
 */

import { matchesAnyShape } from "./logic";

export interface Repair {
  index: number;
  degree: number;
}

/**
 * Every single-note change within `[lo, hi]` that leaves the phrase well-shaped.
 *
 * The no-op is excluded, so a phrase that is *already* well-shaped does not report a repair at every
 * position. Callers that need to know whether the phrase is currently broken should ask
 * `matchesAnyShape` directly.
 */
export function allRepairs(phrase: readonly number[], lo: number, hi: number): Repair[] {
  const found: Repair[] = [];
  const working = [...phrase];
  for (let index = 0; index < phrase.length; index++) {
    const original = phrase[index] as number;
    for (let degree = lo; degree <= hi; degree++) {
      if (degree === original) continue;
      working[index] = degree;
      if (matchesAnyShape(working)) found.push({ index, degree });
    }
    working[index] = original;
  }
  return found;
}

/**
 * Whether a broken phrase has exactly one answer, and it is the intended one.
 *
 * Three conditions, all necessary:
 *  - the presented phrase really is broken, or there is nothing to find;
 *  - there is exactly one repair in reach;
 *  - that repair is the note the generator displaced, so the puzzle the child solves is the puzzle
 *    the generator thinks it built.
 */
export function hasUniqueRepair(
  phrase: readonly number[],
  lo: number,
  hi: number,
  expected: Repair,
): boolean {
  if (matchesAnyShape(phrase)) return false;
  const repairs = allRepairs(phrase, lo, hi);
  if (repairs.length !== 1) return false;
  const only = repairs[0] as Repair;
  return only.index === expected.index && only.degree === expected.degree;
}
