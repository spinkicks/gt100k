/**
 * Generating a Tune Repair instance.
 *
 * Build a well-shaped phrase, displace exactly one interior note, then **prove** with the reference
 * solver that the result has exactly one answer and it is the note we displaced. If not, discard and
 * try the next candidate. Nothing is authored; every phrase is a function of (seed, tier).
 *
 * WHY THE BREAK IS ALWAYS INTERIOR
 * ------------------------------------------------------------------------------------------------
 * A displaced first or last note is a different and much weaker puzzle. The ear needs material on
 * both sides to hear a note as *out of place* rather than merely as an odd beginning — and formally,
 * moving an end note very often leaves a shorter valid shape, so the instance fails uniqueness
 * anyway. Restricting the break to `[1, n-2]` states the musical reason up front instead of letting
 * the rejection loop discover it thousands of times.
 *
 * WHY THE PLAYABLE RANGE IS DERIVED AND NOT FIXED
 * ------------------------------------------------------------------------------------------------
 * `lo`/`hi` are both the rows the roll draws and the space uniqueness is proved over, and those two
 * must be the same interval or the guarantee is a lie: a repair the player can reach but the
 * generator did not consider would make a "unique" puzzle have two answers in practice. So the range
 * is computed once, here, from the phrase itself, and travels with the instance.
 */

import { mulberry32 } from "../../lib/rng";
import {
  MIN_LENGTH,
  type ShapeKind,
  type TuneRepairPuzzle,
  matchesAnyShape,
  matchesShape,
} from "./logic";
import { hasUniqueRepair } from "./naive";

/** Derive an independent seed for the nth phrase of a session. */
export function nextSeed(seed: number, counter: number): number {
  return (Math.imul(seed ^ 0x9e3779b9, counter + 1) + counter * 0x2545f491) >>> 0;
}

export interface Tier {
  /** How many notes the phrase has. */
  length: number;
  /** Which shapes may be built. */
  shapes: readonly ShapeKind[];
  /** Step magnitudes the shape may use. */
  steps: readonly number[];
  /** How far the displaced note may move. */
  deltas: readonly number[];
  /** Playback tempo. Slower gives more time to hold the phrase in the ear. */
  bpm: number;
}

/**
 * Three tiers, and each is harder than the last in ways that are musical rather than fiddly.
 *
 * **Tier 0 exists because the first playtest said the puzzle was too hard**, and that feedback was
 * right: before it, the easiest phrase available was a coin flip between a run and an *arch*, and an
 * arch is a much harder listen. With a run the ear predicts the next note from the previous two, so
 * the broken one contradicts a prediction you have already made. With an arch you must first work out
 * where the turn is, which is a second inference on top of the one the puzzle is about.
 *
 * So tier 0 is **runs only**: one scale, walking one direction, at a slow tempo, with a displacement
 * of two degrees. It is the on-ramp, and it is deliberately the only tier where the shape is knowable
 * from the first two notes.
 *
 * The two harder tiers escalate on four separate axes — shape predictability, phrase length, step
 * variety, and how near-miss the displacement is. Tier 2's single-degree displacement is the hardest
 * case in the game, because the wrong note is still almost right.
 */
export const TIERS: readonly Tier[] = [
  { length: 6, shapes: ["run"], steps: [1], deltas: [2, -2], bpm: 76 },
  { length: 6, shapes: ["run", "arch"], steps: [1], deltas: [2, 3, -2, -3], bpm: 96 },
  {
    length: 8,
    shapes: ["run", "arch", "sequence"],
    steps: [1, 2],
    deltas: [1, 2, 3, -1, -2, -3],
    bpm: 108,
  },
];

/**
 * Which tier the nth phrase of a session uses.
 *
 * Starts at the easiest and cycles, rather than ramping and staying hard: a finder is measuring
 * whether the child comes back, so a session that gets monotonically harder ends every session on the
 * child's worst experience of the room.
 */
export function tierForIndex(index: number): number {
  return index % TIERS.length;
}

const pick = <T>(rng: () => number, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)] as T;

/** Build a phrase of `kind`, or null if the parameters cannot make one that long. */
function buildShaped(
  rng: () => number,
  kind: ShapeKind,
  length: number,
  steps: readonly number[],
): number[] | null {
  const step = pick(rng, steps) * (rng() < 0.5 ? -1 : 1);
  // Start low enough that an ascending phrase stays in a comfortable range and vice versa.
  const start = Math.floor(rng() * 5) - (step > 0 ? 2 : -2);

  if (kind === "run") {
    return Array.from({ length }, (_, i) => start + i * step);
  }

  if (kind === "arch") {
    // Turn somewhere with at least two steps either side.
    const maxTurn = length - 3;
    if (maxTurn < 2) return null;
    const turn = 2 + Math.floor(rng() * (maxTurn - 1));
    const out: number[] = [];
    for (let i = 0; i < length; i++) {
      out.push(i <= turn ? start + i * step : start + turn * step - (i - turn) * step);
    }
    return out;
  }

  // sequence: a motif restated, each restatement shifted by `offset`.
  const motifLengths = [2, 3].filter((m) => length % m === 0 && length / m >= 3);
  if (motifLengths.length === 0) return null;
  const motif = pick(rng, motifLengths);
  const offset = pick(rng, steps) * (rng() < 0.5 ? -1 : 1);
  // A motif that walks by a constant step would make the whole phrase a run.
  const shape: number[] = [0];
  for (let i = 1; i < motif; i++) {
    shape.push(shape[i - 1]! + pick(rng, [1, 2, -1, -2]));
  }
  const out: number[] = [];
  for (let i = 0; i < length; i++) {
    out.push(start + shape[i % motif]! + Math.floor(i / motif) * offset);
  }
  return out;
}

/** How far outside the phrase the player may move a note. One degree of headroom either side. */
const HEADROOM = 1;

export class GenerationExhausted extends Error {}

/**
 * A Tune Repair instance, guaranteed to have exactly one answer.
 *
 * Throws rather than returning a degraded instance: a puzzle with two answers would mark a correct
 * move wrong, which is worse than a loud failure. `generate.test.ts` asserts it never throws across a
 * wide sweep of seeds, which is what makes the attempt ceiling safe.
 */
export function generatePuzzle(seed: number, tierIndex = 0): TuneRepairPuzzle {
  const tier = TIERS[tierIndex] ?? (TIERS[0] as Tier);
  if (tier.length < MIN_LENGTH) throw new Error(`tier ${tierIndex} is shorter than MIN_LENGTH`);
  const rng = mulberry32(seed);

  for (let attempt = 0; attempt < 600; attempt++) {
    const kind = pick(rng, tier.shapes);
    const correct = buildShaped(rng, kind, tier.length, tier.steps);
    if (!correct || !matchesShape(correct, kind)) continue;

    const brokenIndex = 1 + Math.floor(rng() * (tier.length - 2));

    // Prefer a displacement that lands INSIDE the phrase's own range, and this is the second place
    // the "not a deduction puzzle" requirement is enforced. A note pushed above the highest note or
    // below the lowest is findable as a range outlier — scan the pitches, take the extreme one, never
    // hear a thing. That is a set-membership solve by another name. Landing the wrong note among
    // pitches the phrase already uses removes the shortcut and leaves only the musical question.
    // Measured: this lifts tier 0 from 17% inside-range to the figure pinned in generate.test.ts.
    const loCorrect = Math.min(...correct);
    const hiCorrect = Math.max(...correct);
    const inward = tier.deltas.filter((d) => {
      const landed = (correct[brokenIndex] as number) + d;
      return landed > loCorrect && landed < hiCorrect;
    });
    const delta = pick(rng, inward.length > 0 ? inward : tier.deltas);

    const broken = [...correct];
    broken[brokenIndex] = (correct[brokenIndex] as number) + delta;

    const lo = Math.min(...correct, ...broken) - HEADROOM;
    const hi = Math.max(...correct, ...broken) + HEADROOM;

    const expected = { index: brokenIndex, degree: correct[brokenIndex] as number };
    if (!hasUniqueRepair(broken, lo, hi, expected)) continue;

    const beats = Array.from({ length: tier.length }, (_, i) => (i === tier.length - 1 ? 2 : 1));
    return { shape: kind, correct, broken, brokenIndex, beats, lo, hi, bpm: tier.bpm };
  }
  throw new GenerationExhausted(`no unique instance for seed ${seed} tier ${tierIndex}`);
}

/** Convenience for the component: the nth phrase of a session. */
export function generateForRound(seed: number, index: number): TuneRepairPuzzle {
  return generatePuzzle(nextSeed(seed, index), tierForIndex(index));
}

/** Exported for a test that the presented phrase is never accidentally already correct. */
export const isWellShaped = matchesAnyShape;
