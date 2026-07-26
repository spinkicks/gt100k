// Seeded generator for Function Machine. Produces an endless supply of hidden
// rules, every one of which is *fair to ask about*: whichever single input the
// machine withholds, the evidence the player can gather forces exactly one
// answer. See ../FunctionMachine/logic.ts for why that condition — and not
// "the rule is unique" — is the right one.
//
// Generation is rejection sampling. Draw a rule from the current difficulty
// rung's family and parameter ranges, then keep it only if all three hold:
//
//   1. it is identifiable — no rival in the space differs from it on exactly
//      one input, so whichever input is withheld, the answer is forced;
//   2. no rival impersonates it across the opening stretch of the pad, so
//      probing in order is never a trap; and
//   3. some choice of at most `PROBE_BUDGET - 1` inputs pins it down, so the
//      allowance is provably enough to win on.
//
// Difficulty is the rule *family*, not any of those three. An earlier version
// of this generator tried to tune difficulty with a lower bound on (3) — "a
// hard rule must need at least three probes" — and it had to be removed,
// because it rejected literally every quadratic. See the note on
// `minimumDeterminingProbes` in ./logic.ts: that measure scores a quadratic at
// 1, since one probe at a large input returns a number unique in the whole
// space. It measures how distinctive the digits are, not how hard the rule is
// to see, and those come apart badly at exactly the rungs that need tuning.

import {
  DOMAIN,
  type Rule,
  type RuleFamily,
  isIdentifiable,
  longestMisleadingPrefix,
  minimumDeterminingProbes,
  spaceOver,
} from "./logic";
// The app's one seeded PRNG. Its exact arithmetic decides which machines this file produces, so see
// the warning in src/lib/rng.ts before touching it.
import { mulberry32 } from "../../lib/rng";

/**
 * How many inputs the machine will run before it needs a rest.
 *
 * This is a budget, not a scoreboard: nothing counts it, nothing is lost by
 * spending it, and running out never ends the game — predictions stay open
 * and a wrong one simply hands over that input's answer. Its only job is to
 * make *which* inputs you try a decision rather than a formality, since the
 * pad has twelve and this allows five.
 */
export const PROBE_BUDGET = 5;

export const MAX_DIFFICULTY = 2;

interface Rung {
  families: readonly RuleFamily[];
  ranges: Partial<
    Record<RuleFamily, { a: [number, number]; b: [number, number]; c: [number, number] }>
  >;
}

/**
 * The rungs go up in the kind of thinking they need, not in arithmetic size:
 * a straight line, then a curve, then a rule with a case split or a wrap-round
 * in it. The last is the interesting one — a modular rule looks like nonsense
 * until a child notices the outputs repeat, and then it is obvious.
 */
const RUNGS: readonly Rung[] = [
  { families: ["linear"], ranges: { linear: { a: [2, 5], b: [0, 9], c: [0, 0] } } },
  {
    families: ["square", "quadratic"],
    ranges: {
      square: { a: [1, 3], b: [0, 9], c: [0, 0] },
      quadratic: { a: [1, 4], b: [0, 9], c: [0, 0] },
    },
  },
  {
    families: ["modular", "alternating"],
    ranges: {
      modular: { a: [2, 5], b: [0, 5], c: [0, 0] },
      alternating: { a: [1, 4], b: [1, 5], c: [0, 5] },
    },
  },
];

/**
 * A rival may match the true rule on at most this many inputs from the start
 * of the pad. See `longestMisleadingPrefix`: this is what stops a rule that
 * imitates a simpler one for the whole opening stretch.
 */
const MAX_MISLEADING_PREFIX = 4;

const MODULUS_RANGE: [number, number] = [3, 7];
const MAX_ATTEMPTS = 4000;

export interface Machine {
  rule: Rule;
  domain: number[];
  probeBudget: number;
  /**
   * The order in which the machine withholds inputs. Every input is safe to
   * withhold — that is what identifiability buys — so this is just a shuffle,
   * and the player only ever meets the first few entries of it.
   */
  heldOutOrder: number[];
  /** The shortest number of well-chosen inputs that pins this rule down. */
  minimumProbes: number;
}

function pick(rng: () => number, [lo, hi]: [number, number]): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

function shuffled(rng: () => number, values: readonly number[]): number[] {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Generate a hidden rule that is fair to ask a prediction about.
 *
 * Deterministic: the same (seed, difficulty) always produces the same machine.
 *
 * @param difficulty 0..MAX_DIFFICULTY; clamped.
 */
export function generateMachine(seed: number, difficulty = 0): Machine {
  const rung = RUNGS[Math.max(0, Math.min(MAX_DIFFICULTY, Math.floor(difficulty)))]!;
  const rng = mulberry32(seed);
  const domain = [...DOMAIN];
  const table = spaceOver(domain);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const family = rung.families[Math.floor(rng() * rung.families.length)]!;
    const range = rung.ranges[family]!;
    const rule: Rule = {
      family,
      a: pick(rng, range.a),
      b: pick(rng, range.b),
      c: pick(rng, range.c),
      m: family === "modular" ? pick(rng, MODULUS_RANGE) : 1,
    };

    // Cheapest tests first: both of these are one pass over the space, while
    // the probe-length search is many.
    if (!isIdentifiable(rule, domain, table)) continue;
    if (longestMisleadingPrefix(rule, domain, table) > MAX_MISLEADING_PREFIX) continue;

    const minimumProbes = minimumDeterminingProbes(rule, domain, table, PROBE_BUDGET - 1);
    if (minimumProbes > PROBE_BUDGET - 1) continue;

    return {
      rule,
      domain,
      probeBudget: PROBE_BUDGET,
      heldOutOrder: shuffled(rng, domain),
      minimumProbes,
    };
  }

  throw new Error(`generateMachine: no fair rule for seed ${seed} at difficulty ${difficulty}`);
}
