/**
 * Generating a Chord Fit instance: one melody note, three diatonic triads, exactly one of which
 * contains it.
 *
 * WHY ALL THREE CHORDS ARE DIATONIC
 * ------------------------------------------------------------------------------------------------
 * The two wrong answers are triads the key itself contains. That is deliberate and it is the difference
 * between a musical question and a trick one: if a distractor were built from notes outside the key it
 * would sound wrong for a second reason — the key — and a child could reject it without ever judging
 * whether it *supports the melody note*. Every option belongs to the key, so the only thing separating
 * them is consonance against the note, which is the construct.
 *
 * WHY THE DISTRACTORS CANNOT SHARE THE MELODY NOTE
 * ------------------------------------------------------------------------------------------------
 * Diatonic triads overlap: in any major key each scale degree appears in three different triads. So the
 * answer is unique only if the two distractors are chosen from the triads that do *not* contain the
 * melody note — which is a real constraint, not a formality, because a naive random pick has a better
 * than even chance of collision. `generate.test.ts` asserts uniqueness over the full sweep.
 */

import { degreeInKey } from "../../audio/pitch";
import { mulberry32 } from "../../lib/rng";
import { type ChordFitPuzzle, chordContains, triadOn, voiceBelow } from "./logic";

/** Derive an independent seed for the nth round of a session. */
export function nextSeed(seed: number, counter: number): number {
  return (Math.imul(seed ^ 0x9e3779b9, counter + 1) + counter * 0x2545f491) >>> 0;
}

export interface Tier {
  /**
   * Which scale degrees the melody note may be drawn from.
   *
   * The tonic, third and fifth are the notes most strongly implied by the key, so a chord that supports
   * them is the most obvious. The second, fourth, sixth and seventh are harder: they belong to triads a
   * child hears less often, so the answer is less predictable and more genuinely heard.
   */
  melodyDegrees: readonly number[];
  /** How long everything rings. Longer gives more time to judge consonance. */
  beats: number;
  bpm: number;
}

/**
 * Three tiers. Difficulty is how *obvious* the supporting chord is, which is a musical axis rather than
 * a mechanical one — nothing gets smaller, faster to click, or more numerous.
 */
export const TIERS: readonly Tier[] = [
  { melodyDegrees: [0, 4], beats: 3, bpm: 76 },
  { melodyDegrees: [0, 2, 4, 6], beats: 2, bpm: 92 },
  { melodyDegrees: [1, 2, 3, 5, 6], beats: 2, bpm: 108 },
];

/** Starts easiest and cycles, so no session ends on its hardest round. */
export function tierForIndex(index: number): number {
  return index % TIERS.length;
}

const pick = <T>(rng: () => number, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)] as T;

/** The seven diatonic triads of a key, rooted on each scale degree. */
const ROOT_DEGREES = [0, 1, 2, 3, 4, 5, 6] as const;

export class GenerationExhausted extends Error {}

export function generatePuzzle(seed: number, tierIndex = 0): ChordFitPuzzle {
  const tier = TIERS[tierIndex] ?? (TIERS[0] as Tier);
  const rng = mulberry32(seed);

  for (let attempt = 0; attempt < 400; attempt++) {
    const key = Math.floor(rng() * 12);
    const melodyDegree = pick(rng, tier.melodyDegrees);
    const melodyNote = degreeInKey(melodyDegree, key);

    // Voiced under the melody note, so every option is a support rather than a cluster around it.
    const triads = ROOT_DEGREES.map((d) => voiceBelow(triadOn(d, key), melodyNote));
    const supporting = triads.filter((c) => chordContains(c, melodyNote));
    const clashing = triads.filter((c) => !chordContains(c, melodyNote));
    if (supporting.length === 0 || clashing.length < 2) continue;

    const answerChord = pick(rng, supporting);
    // Two distinct distractors, neither containing the note.
    const first = Math.floor(rng() * clashing.length);
    let second = Math.floor(rng() * clashing.length);
    if (second === first) second = (second + 1) % clashing.length;
    if (first === second) continue;

    // Randomise position so the answer is never reliably in one slot.
    const options = [answerChord, clashing[first] as number[], clashing[second] as number[]];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [options[i], options[j]] = [options[j] as number[], options[i] as number[]];
    }
    const answer = options.indexOf(answerChord);
    if (answer < 0) continue;

    const puzzle: ChordFitPuzzle = {
      key,
      melodyNote,
      options,
      answer,
      beats: tier.beats,
      bpm: tier.bpm,
    };
    // Exactly one option supports the note. Checked rather than assumed, because diatonic triads
    // overlap heavily and a collision would make two answers correct.
    const supportingCount = options.filter((c) => chordContains(c, melodyNote)).length;
    if (supportingCount !== 1) continue;
    return puzzle;
  }
  throw new GenerationExhausted(`no instance for seed ${seed} tier ${tierIndex}`);
}

/** The nth round of a session. */
export function generateForRound(seed: number, index: number): ChordFitPuzzle {
  return generatePuzzle(nextSeed(seed, index), tierForIndex(index));
}
