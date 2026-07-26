/**
 * The app's one seeded pseudo-random number generator.
 *
 * WHAT IT IS
 * ----------
 * mulberry32 — a 32-bit counter fed through an integer avalanche, the standard tiny non-cryptographic
 * PRNG. `mulberry32(seed)` returns a function that yields the next `[0, 1)` double each time it is
 * called. The same seed always produces the same stream, on any engine, in any order of use.
 *
 * WHY IT IS SEEDED AND NOT `Math.random`
 * --------------------------------------
 * Almost nothing random in this app is allowed to be *actually* random:
 *
 *   - Every puzzle is GENERATED, not authored. A level is fully determined by (seed, tier), and the
 *     suites assert measured properties of the resulting instances — solution-length windows,
 *     uniqueness of the answer, blind-guess rates, "no deterministic strategy solves any shipped
 *     level". Those numbers are facts about specific levels. They only stay true if the seed still
 *     produces those levels.
 *   - The cabin's procedural textures and prop scatter are generated per render, and the screenshot
 *     tooling (`tools/shoot.ts`, `tools/compare.ts`) diffs images pixel-for-pixel. A drifting stream
 *     would make every shot a false positive.
 *
 * SO THE ARITHMETIC BELOW IS LOAD-BEARING
 * ---------------------------------------
 * Changing any operation, constant, or the order of the two mixing rounds does not "improve the
 * randomness" — it silently replaces every level in the game and invalidates every measured claim
 * about them. There is no such thing as a harmless tweak here. `rng.test.ts` pins a frozen sequence
 * for one seed so that an attempted tweak fails loudly instead.
 *
 * If a genuinely different stream is ever wanted, add a *new* function with a *new* name; do not
 * edit this one.
 *
 * ON THE `| 0` / `>>> 0` MIX
 * --------------------------
 * The eight copies this module replaced were textually inconsistent about whether the state update
 * used `| 0` (signed) or `>>> 0` (unsigned), and whether the seed was coerced at construction or on
 * first use. All of those variants are bit-identical: every subsequent operator (`^`, `>>>`, `|`,
 * `Math.imul`) reads only the low 32 bits, and both coercions agree on those bits for any input.
 * Verified over 618 seeds x 300 draws before the copies were removed. Do not "clean up" the mix into
 * something that looks tidier without re-verifying — `(a + C) >>> 0` and `(a + C) | 0` are safe to
 * swap, `(a + C) % 4294967296` is not.
 */

/** A seeded random source: call it for the next `[0, 1)` double. */
export type Rng = () => number;

/**
 * Build a seeded random source. `seed` may be any number; only its low 32 bits matter, so negative
 * and out-of-range seeds are accepted rather than rejected (several call sites derive seeds by
 * multiplying and adding, and would otherwise have to clamp).
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
