/**
 * Generating a Downbeat instance.
 *
 * Almost everything about difficulty here is **how big the gap between a stressed and an unstressed pulse
 * is**, which is a perceptual axis and the honest one for this construct. Nothing gets smaller, faster to
 * click or more numerous with tier.
 *
 * WHY THE LOOP MUST HOLD AT LEAST THREE BARS
 * ------------------------------------------------------------------------------------------------
 * A metre is a *repetition*, so one stressed pulse is not a metre — it is a loud noise. Two is a spacing
 * you could have imagined. Three is the first count at which a child is genuinely hearing a recurring
 * pattern rather than an event, so `pulses` is always at least `3 * meter`, and `generate.test.ts` holds it.
 */

import { mulberry32 } from "../../lib/rng";
import { type DownbeatPuzzle, downbeatIndices } from "./logic";

/** Derive an independent seed for the nth loop of a session. */
export function nextSeed(seed: number, counter: number): number {
  return (Math.imul(seed ^ 0x9e3779b9, counter + 1) + counter * 0x2545f491) >>> 0;
}

export interface Tier {
  /** Which metres may appear. */
  meters: readonly number[];
  /** How many bars the loop runs for. */
  bars: number;
  /** Loudness of a stressed pulse against a plain one. A narrower gap is a harder listen. */
  accentVelocity: number;
  plainVelocity: number;
  /** Whether the loop may start part-way through a bar. */
  allowPhase: boolean;
  bpm: number;
}

/**
 * Three tiers, escalating on the two things that actually make metre hard to hear: **how obvious the
 * stress is**, and **whether the loop starts on a downbeat**.
 *
 * Tier 0 is duple or triple, loud accents, always starting on the downbeat, slow. Tier 2 adds quadruple
 * (whose weaker third-beat stress makes it easy to mishear as duple), a much narrower accent gap, and a
 * phase offset so the child cannot assume the first pulse they hear is a bar start.
 */
export const TIERS: readonly Tier[] = [
  { meters: [2, 3], bars: 4, accentVelocity: 1, plainVelocity: 0.4, allowPhase: false, bpm: 84 },
  { meters: [2, 3, 4], bars: 4, accentVelocity: 1, plainVelocity: 0.55, allowPhase: true, bpm: 96 },
  { meters: [3, 4], bars: 4, accentVelocity: 1, plainVelocity: 0.72, allowPhase: true, bpm: 112 },
];

/** Starts easiest and cycles, so no session ends on its hardest loop. */
export function tierForIndex(index: number): number {
  return index % TIERS.length;
}

const pick = <T>(rng: () => number, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)] as T;

/** A metre is a repetition, so a loop needs at least this many bars to be one. */
export const MIN_BARS = 3;

export class GenerationExhausted extends Error {}

export function generatePuzzle(seed: number, tierIndex = 0): DownbeatPuzzle {
  const tier = TIERS[tierIndex] ?? (TIERS[0] as Tier);
  const rng = mulberry32(seed);

  for (let attempt = 0; attempt < 200; attempt++) {
    const meter = pick(rng, tier.meters);
    const bars = Math.max(tier.bars, MIN_BARS);
    const pulses = meter * bars;
    const phase = tier.allowPhase ? Math.floor(rng() * meter) : 0;

    const puzzle: DownbeatPuzzle = {
      pulses,
      meter,
      phase,
      accentVelocity: tier.accentVelocity,
      plainVelocity: tier.plainVelocity,
      bpm: tier.bpm,
    };

    // A metre needs at least three stresses to be heard as a recurrence rather than an event.
    if (downbeatIndices(puzzle).length < MIN_BARS) continue;
    // Every pulse stressed is not a metre, it is a pulse train.
    if (meter < 2) continue;
    return puzzle;
  }
  throw new GenerationExhausted(`no instance for seed ${seed} tier ${tierIndex}`);
}

/** The nth loop of a session. */
export function generateForRound(seed: number, index: number): DownbeatPuzzle {
  return generatePuzzle(nextSeed(seed, index), tierForIndex(index));
}
