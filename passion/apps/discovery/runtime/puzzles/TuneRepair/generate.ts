/**
 * Generating a Tune Repair instance: compose a melody in a key, then move one note a semitone out of
 * it — and prove the result is findable only by ear.
 *
 * THE MELODY HAS TO BE A MELODY, NOT A PATTERN
 * ------------------------------------------------------------------------------------------------
 * This is the part that carries the redesign. If the melody has a visible regularity — a staircase, a
 * hill, a repeated motif — then a displaced note is findable by eye and the activity is a shape
 * puzzle again, which is what the first playtest correctly called out. So melodies are composed with a
 * natural but *irregular* contour, and any candidate that trips `hasVisiblePattern` is thrown away.
 *
 * "Natural" here means the things that make a line singable rather than random: mostly stepwise
 * motion, occasional small leaps, a bounded range, a change of direction now and then, and an ending
 * on the tonic so the phrase sounds finished. None of that produces a regularity an eye can lock onto.
 *
 * WHAT IS UNIQUE, AND WHAT TURNS OUT NOT TO BE
 * ------------------------------------------------------------------------------------------------
 * The first attempt at this required the *direction* to be unique too — move the sour note the wrong
 * way and it should stay sour. **That is impossible, and the reason is worth writing down: in a major
 * scale every chromatic note lies inside a whole step.** So from any out-of-key note, both
 * one-semitone moves land back in the key, always, in every key. The constraint rejected 100% of
 * candidate instances before this was noticed.
 *
 * So the unique thing is **which note**, not which way — and that is the right answer rather than a
 * concession, because both directions produce a melody entirely in the key, so both genuinely sound
 * right. Identifying the sour note is the ear-training task; the direction is not part of it.
 * `naive.ts` proves the position is unique over the whole reachable space.
 */

import { degreeInKey, isInKey } from "../../audio/pitch";
import { mulberry32 } from "../../lib/rng";
import { MIN_LENGTH, type TuneRepairPuzzle, hasVisiblePattern, sourIndices } from "./logic";
import { hasUniquePosition } from "./naive";

/** Derive an independent seed for the nth melody of a session. */
export function nextSeed(seed: number, counter: number): number {
  return (Math.imul(seed ^ 0x9e3779b9, counter + 1) + counter * 0x2545f491) >>> 0;
}

export interface Tier {
  /** How many notes the melody has. */
  length: number;
  /** Degree steps the melody may move by. Larger values are leaps. */
  moves: readonly number[];
  /** How wide, in scale degrees, the melody may roam. */
  span: number;
  /** Playback tempo. Slower gives more time to hear the key settle. */
  bpm: number;
}

/**
 * Three tiers. Difficulty here is entirely about **how well established the key is** by the time the
 * sour note arrives, which is what makes the wrong note easy or hard to hear.
 *
 * A short, narrow, slow, mostly-stepwise melody plants the key firmly and then breaks it obviously. A
 * long melody with leaps at speed gives the ear less of a key to measure against — and that, rather
 * than any visual complexity, is the axis this activity is actually difficult along.
 */
export const TIERS: readonly Tier[] = [
  { length: 6, moves: [1, -1, 2, -2], span: 6, bpm: 76 },
  { length: 8, moves: [1, -1, 2, -2, 3, -3], span: 8, bpm: 92 },
  { length: 10, moves: [1, -1, 2, -2, 3, -3, 4, -4], span: 10, bpm: 108 },
];

/**
 * Which tier the nth melody of a session uses.
 *
 * Starts easiest and cycles rather than ramping: a finder measures whether the child comes back, so a
 * monotonic ramp would end every session on the child's worst experience of the room.
 */
export function tierForIndex(index: number): number {
  return index % TIERS.length;
}

const pick = <T>(rng: () => number, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)] as T;

/**
 * Compose a diatonic melody in scale degrees.
 *
 * Ends on the tonic (degree 0 or 7) so the phrase sounds finished, which is what makes the key
 * audible enough for a sour note to stand out against it.
 */
function composeDegrees(rng: () => number, tier: Tier): number[] | null {
  const out: number[] = [0];
  for (let i = 1; i < tier.length - 1; i++) {
    // Try a few moves so the line stays inside its span rather than clamping into a flat edge.
    let placed = false;
    for (let attempt = 0; attempt < 8 && !placed; attempt++) {
      const next = (out[i - 1] as number) + pick(rng, tier.moves);
      if (next >= -1 && next <= tier.span) {
        out.push(next);
        placed = true;
      }
    }
    if (!placed) return null;
  }
  // Land on a tonic, whichever is nearer to where the line ended up.
  const last = out[out.length - 1] as number;
  out.push(Math.abs(last - 7) < Math.abs(last) ? 7 : 0);
  return out;
}

/** How far outside the melody the roll draws, in semitones. */
const HEADROOM = 2;

export class GenerationExhausted extends Error {}

/**
 * A Tune Repair instance whose sour note is unique and audible-only.
 *
 * Throws rather than degrading: an instance with two answers would mark a correct move wrong, and an
 * instance with a visible pattern would quietly turn the activity back into the shape puzzle this
 * redesign exists to remove. `generate.test.ts` asserts it never throws across a wide sweep.
 */
export function generatePuzzle(seed: number, tierIndex = 0): TuneRepairPuzzle {
  const tier = TIERS[tierIndex] ?? (TIERS[0] as Tier);
  if (tier.length < MIN_LENGTH) throw new Error(`tier ${tierIndex} is shorter than MIN_LENGTH`);
  const rng = mulberry32(seed);

  for (let attempt = 0; attempt < 800; attempt++) {
    const key = Math.floor(rng() * 12);
    const degrees = composeDegrees(rng, tier);
    if (!degrees) continue;

    const correct = degrees.map((d) => degreeInKey(d, key));

    // (1) No visible regularity, or the answer is findable by eye.
    if (hasVisiblePattern(correct)) continue;
    // A melody that repeats a pitch immediately reads as a held note and muddies which note is which.
    if (correct.some((s, i) => i > 0 && s === correct[i - 1])) continue;

    // Break an interior note by a semitone, in whichever direction leaves the answer unique.
    const brokenIndex = 1 + Math.floor(rng() * (tier.length - 2));
    const original = correct[brokenIndex] as number;
    const directions: Array<1 | -1> = rng() < 0.5 ? [1, -1] : [-1, 1];

    let chosen: { broken: number[]; fix: 1 | -1 } | null = null;
    for (const dir of directions) {
      const sour = original + dir;
      // Must actually leave the key. Half the scale tones have an in-key neighbour a semitone away
      // (the two places a major scale has a half step), so this rejects rather than being decorative.
      if (isInKey(sour, key)) continue;
      const broken = [...correct];
      broken[brokenIndex] = sour;
      chosen = { broken, fix: -dir as 1 | -1 };
      break;
    }
    if (!chosen) continue;

    const { broken, fix } = chosen;
    // (3) Exactly one sour note, and it is the one we made.
    const sour = sourIndices(broken, key);
    if (sour.length !== 1 || sour[0] !== brokenIndex) continue;
    // (4) The sour note must not be the highest or lowest note on screen, or it is an outlier.
    const landed = broken[brokenIndex] as number;
    if (landed === Math.min(...broken) || landed === Math.max(...broken)) continue;

    const lo = Math.min(...correct, ...broken) - HEADROOM;
    const hi = Math.max(...correct, ...broken) + HEADROOM;
    if (!hasUniquePosition(broken, key, lo, hi, brokenIndex)) continue;

    const beats = Array.from({ length: tier.length }, (_, i) => (i === tier.length - 1 ? 2 : 1));
    return { key, correct, broken, brokenIndex, fix, beats, lo, hi, bpm: tier.bpm };
  }
  throw new GenerationExhausted(`no unique instance for seed ${seed} tier ${tierIndex}`);
}

/** The nth melody of a session. */
export function generateForRound(seed: number, index: number): TuneRepairPuzzle {
  return generatePuzzle(nextSeed(seed, index), tierForIndex(index));
}
