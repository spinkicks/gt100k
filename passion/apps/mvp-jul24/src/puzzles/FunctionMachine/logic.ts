// Pure logic for Function Machine: the rule families the hidden rule is drawn
// from, the space of rules a player could reasonably be considering, and the
// two properties that decide whether a given hidden rule is fair to ask about.
// Machine construction lives in ./generate.ts. No React/DOM here so it can be
// unit-tested in isolation.
//
// The subtle correctness condition of this puzzle is *identifiability*, and it
// is worth stating precisely because getting it wrong is invisible: it makes
// the game occasionally tell a child who reasoned perfectly that they are
// wrong.
//
// The player sees the machine's output on every input except one, and must
// predict the missing one. That is only a fair question if the evidence
// forces a single answer. It does not if some other rule they might plausibly
// hold agrees with the true rule on everything they can observe but disagrees
// on the one input they cannot. So the condition is not "the rule is unique"
// — it is:
//
//     no other function in the candidate space differs from the true rule on
//     exactly one input.
//
// Equivalently: every distinct rule in the space is at Hamming distance >= 2
// from the true one, over the domain. Then whatever single input is withheld,
// any rival consistent with everything visible is at distance 0 — the same
// function — and so predicts the same value. `isIdentifiable` checks exactly
// this, and the generator refuses to emit a machine that fails it.
//
// This also disposes of the "a simpler competing rule" worry directly. If a
// simpler rule fits every observation, it is at distance <= 1, hence at
// distance 0, hence the same function on this domain — so it makes the same
// prediction and the child's simpler answer is accepted rather than marked
// wrong.

export type RuleFamily = "linear" | "square" | "quadratic" | "modular" | "alternating";

/**
 * A hidden rule. The fields are shared across families rather than being a
 * discriminated union of shapes, so that rules compare, serialize and
 * enumerate uniformly; unused fields are held at a neutral value.
 */
export interface Rule {
  readonly family: RuleFamily;
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly m: number;
}

/** The inputs the machine accepts. Small enough to display as one pad. */
export const DOMAIN: readonly number[] = Array.from({ length: 12 }, (_unused, i) => i + 1);

export function applyRule(rule: Rule, x: number): number {
  switch (rule.family) {
    case "linear":
      return rule.a * x + rule.b;
    case "square":
      return rule.a * x * x + rule.b;
    case "quadratic":
      return x * x + rule.a * x + rule.b;
    case "modular":
      return (((rule.a * x + rule.b) % rule.m) + rule.m) % rule.m;
    case "alternating":
      return rule.a * x + (x % 2 === 0 ? rule.b : rule.c);
  }
}

export function outputsOver(rule: Rule, domain: readonly number[] = DOMAIN): number[] {
  return domain.map((x) => applyRule(rule, x));
}

/** How a rule reads once the machine is opened up. Plain words, no notation. */
export function describeRule(rule: Rule): string {
  const { a, b, c, m } = rule;
  switch (rule.family) {
    case "linear": {
      if (a === 1) return b === 0 ? "give back whatever went in" : `add ${b}`;
      return b === 0 ? `multiply by ${a}` : `multiply by ${a}, then add ${b}`;
    }
    case "square": {
      const base =
        a === 1 ? "multiply the input by itself" : `multiply the input by itself, then by ${a}`;
      return b === 0 ? base : `${base}, then add ${b}`;
    }
    case "quadratic": {
      const parts = ["multiply the input by itself"];
      if (a > 0) parts.push(`add ${a} more of the input`);
      if (b > 0) parts.push(`add ${b}`);
      return parts.join(", then ");
    }
    case "modular": {
      const inner = a === 1 ? "the input" : `${a} times the input`;
      const plus = b === 0 ? "" : ` plus ${b}`;
      return `divide ${inner}${plus} by ${m} and keep only the remainder`;
    }
    case "alternating": {
      const times = a === 1 ? "take the input" : `multiply by ${a}`;
      return `${times}, then add ${b} if the input is even and ${c} if it is odd`;
    }
  }
}

/* ------------------------------------------------------------------ *
 * The candidate space
 * ------------------------------------------------------------------ */

interface FamilySpec {
  family: RuleFamily;
  a: readonly [number, number];
  b: readonly [number, number];
  c: readonly [number, number];
  m: readonly [number, number];
}

/**
 * Every rule the puzzle treats as "a rule a player might be entertaining".
 *
 * Identifiability is always judged against this whole space, never against
 * the one family the current machine was drawn from — the child does not know
 * which family they are looking at, so a rival from any family is a rival
 * that could genuinely mislead them.
 */
const FAMILY_SPECS: readonly FamilySpec[] = [
  { family: "linear", a: [1, 5], b: [0, 9], c: [0, 0], m: [1, 1] },
  { family: "square", a: [1, 3], b: [0, 9], c: [0, 0], m: [1, 1] },
  { family: "quadratic", a: [0, 4], b: [0, 9], c: [0, 0], m: [1, 1] },
  { family: "modular", a: [1, 5], b: [0, 5], c: [0, 0], m: [3, 7] },
  { family: "alternating", a: [1, 4], b: [0, 5], c: [0, 5], m: [1, 1] },
];

export function allCandidateRules(): Rule[] {
  const rules: Rule[] = [];
  for (const spec of FAMILY_SPECS) {
    for (let a = spec.a[0]; a <= spec.a[1]; a++) {
      for (let b = spec.b[0]; b <= spec.b[1]; b++) {
        for (let c = spec.c[0]; c <= spec.c[1]; c++) {
          for (let m = spec.m[0]; m <= spec.m[1]; m++) {
            rules.push({ family: spec.family, a, b, c, m });
          }
        }
      }
    }
  }
  return rules;
}

/**
 * The candidate space collapsed to distinct *behaviours* over a domain.
 *
 * Two parameter sets that agree on every input are the same question as far
 * as a player is concerned (there is no way to tell them apart and no reason
 * to), so only one representative of each is kept. Memoized, because every
 * generated machine is checked against it.
 */
export interface SpaceTable {
  rules: Rule[];
  outputs: number[][];
  keys: string[];
}

const spaceCache = new Map<string, SpaceTable>();

export function spaceOver(domain: readonly number[] = DOMAIN): SpaceTable {
  const cacheKey = domain.join(",");
  const cached = spaceCache.get(cacheKey);
  if (cached) return cached;

  const table: SpaceTable = { rules: [], outputs: [], keys: [] };
  const seen = new Set<string>();
  for (const rule of allCandidateRules()) {
    const outputs = outputsOver(rule, domain);
    const key = outputs.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    table.rules.push(rule);
    table.outputs.push(outputs);
    table.keys.push(key);
  }
  spaceCache.set(cacheKey, table);
  return table;
}

/* ------------------------------------------------------------------ *
 * Fairness properties
 * ------------------------------------------------------------------ */

/**
 * True when withholding *any single* input still leaves the answer forced —
 * see the header for why this is the condition that matters. Concretely: no
 * distinct rule in the space differs from `rule` on exactly one input.
 */
export function isIdentifiable(
  rule: Rule,
  domain: readonly number[] = DOMAIN,
  table: SpaceTable = spaceOver(domain),
): boolean {
  const mine = outputsOver(rule, domain);
  for (const row of table.outputs) {
    let differences = 0;
    for (let i = 0; i < mine.length; i++) {
      if (row[i] !== mine[i]) {
        differences++;
        if (differences > 1) break;
      }
    }
    if (differences === 1) return false;
  }
  return true;
}

/** Index subsets of `n` items, of size `k`, in lexicographic order. */
function* combinations(n: number, k: number): Generator<number[]> {
  const idx = Array.from({ length: k }, (_unused, i) => i);
  while (true) {
    yield idx;
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) return;
    idx[i]!++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1]! + 1;
  }
}

/**
 * The fewest inputs that, chosen well and observed together, leave only one
 * possible behaviour in the space. Returns `Infinity` if no subset of size
 * <= `maxK` suffices.
 *
 * The generator uses this as an upper bound only — a certificate that the
 * machine is winnable inside its probe allowance. It is deliberately *not*
 * used as a difficulty measure, and the reason is worth recording because it
 * is not obvious: every quadratic in this space scores 1. A single probe at
 * a large input returns a number like 441 that no other rule in the space
 * produces anywhere, so one observation formally pins the rule down. That
 * makes the measure a proxy for how distinctive the output *numbers* are, not
 * for how hard the rule is to see — a child cannot invert 441 by enumerating
 * 343 candidate behaviours. Difficulty here comes from the rule family
 * instead; see RUNGS in ./generate.ts.
 */
export function minimumDeterminingProbes(
  rule: Rule,
  domain: readonly number[] = DOMAIN,
  table: SpaceTable = spaceOver(domain),
  maxK = 3,
): number {
  const mine = outputsOver(rule, domain);
  const mineKey = mine.join(",");
  // Only rules that behave differently somewhere can mislead; identical
  // behaviour is the same answer by another name.
  const rivals = table.outputs.filter((_unused, i) => table.keys[i] !== mineKey);

  for (let k = 1; k <= Math.min(maxK, domain.length); k++) {
    for (const subset of combinations(domain.length, k)) {
      let pinned = true;
      for (const row of rivals) {
        let agrees = true;
        for (const i of subset) {
          if (row[i] !== mine[i]) {
            agrees = false;
            break;
          }
        }
        if (agrees) {
          pinned = false;
          break;
        }
      }
      if (pinned) return k;
    }
  }
  return Number.POSITIVE_INFINITY;
}

/**
 * The length of the longest opening run of inputs — 1, 2, 3, … in order —
 * over which some *other* behaviour in the space is indistinguishable from
 * this rule's.
 *
 * This is the guard against the trap identifiability does not catch. A rule
 * like "(2x + 1) with a wrap at 7" can behave exactly like a plain doubling
 * rule for the first eight inputs and only reveal itself at the ninth. Such a
 * rule is still identifiable — the two differ in several places overall — but
 * a child who probes the pad left to right would form an entirely reasonable
 * conjecture, confirm it four times, and be wrong. That is a rule that
 * punishes systematic exploration, which is the one behaviour this activity
 * exists to encourage.
 *
 * Keeping this short means a rival can never survive the whole opening
 * stretch of the pad, so probing in order is always eventually informative.
 */
export function longestMisleadingPrefix(
  rule: Rule,
  domain: readonly number[] = DOMAIN,
  table: SpaceTable = spaceOver(domain),
): number {
  const mine = outputsOver(rule, domain);
  const mineKey = mine.join(",");
  let longest = 0;
  for (let i = 0; i < table.outputs.length; i++) {
    if (table.keys[i] === mineKey) continue;
    const row = table.outputs[i]!;
    let agreed = 0;
    while (agreed < mine.length && row[agreed] === mine[agreed]) agreed++;
    if (agreed > longest) longest = agreed;
  }
  return longest;
}
