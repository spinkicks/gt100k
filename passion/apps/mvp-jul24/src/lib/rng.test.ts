import { type Rng, mulberry32 } from "./rng";

const draw = (rng: Rng, n: number): number[] => Array.from({ length: n }, () => rng());

/**
 * The frozen sequence. This is not a "does it work" test — it is a tripwire.
 *
 * Every generated puzzle in the app is a pure function of a seed and this stream. Tests elsewhere
 * assert measured facts about particular levels (solution-length windows, unique answers, measured
 * blind-guess rates, "no non-reasoning strategy solves any shipped level"). Perturb the stream by a
 * single draw and those levels are replaced by different ones, quietly, and every measured claim
 * about them becomes a claim about levels that no longer exist.
 *
 * So: if you changed src/lib/rng.ts and landed here, the change is not harmless and this test is not
 * stale. Revert it, or add a differently-named function alongside.
 */
const FROZEN_SEED_12345 = [
  0.9797282677609473, 0.3067522644996643, 0.484205421525985, 0.817934412509203, 0.5094283693470061,
  0.34747186047025025, 0.07375754183158278, 0.7663964673411101, 0.9968264393974096,
  0.8250224851071835, 0.4599348735064268, 0.9458441860042512,
];

/**
 * The same tripwire in integer form. Every draw is exactly `u / 2**32` for some uint32 `u`, so this
 * is a lossless second reading of the stream — it survives any doubt about decimal literals
 * round-tripping, and it is what you would compare against a mulberry32 implementation in another
 * language.
 */
const FROZEN_SEED_1_UINT32 = [
  2693262067, 11749833, 2265367787, 4213581821, 4159151403, 1207330352, 2632122864, 3095568220,
];

describe("mulberry32", () => {
  test("the stream for a seed is frozen", () => {
    expect(draw(mulberry32(12345), FROZEN_SEED_12345.length)).toEqual(FROZEN_SEED_12345);
  });

  test("the stream for a seed is frozen, read as uint32s", () => {
    const raw = draw(mulberry32(1), FROZEN_SEED_1_UINT32.length).map((x) => x * 4294967296);
    expect(raw).toEqual(FROZEN_SEED_1_UINT32);
  });

  test("the same seed replays exactly, however many draws", () => {
    for (const seed of [0, 1, 7, 42, 12345, 999983]) {
      expect(draw(mulberry32(seed), 200)).toEqual(draw(mulberry32(seed), 200));
    }
  });

  test("two generators from one seed do not share state", () => {
    // Each call must return an independent closure, not a view onto a module-level counter — a
    // generator that built two sub-streams would otherwise interleave them.
    const a = mulberry32(99);
    const b = mulberry32(99);
    a();
    a();
    expect(b()).toBe(mulberry32(99)());
  });

  test("different seeds give different streams", () => {
    const firsts = new Set<number>();
    for (let seed = 0; seed < 500; seed++) firsts.add(mulberry32(seed)());
    // Collisions are possible in principle for a 32-bit output; none occur over this range, which is
    // the property the generators actually rely on when they derive per-level seeds.
    expect(firsts.size).toBe(500);
  });

  test("adjacent seeds are not merely offset streams", () => {
    // The failure mode of a badly-mixed counter PRNG is that seed n+1 reproduces seed n shifted by
    // one draw, which would make "next puzzle" hand out the previous puzzle's tail.
    const a = draw(mulberry32(1000), 20);
    const b = draw(mulberry32(1001), 20);
    expect(b.slice(0, 19)).not.toEqual(a.slice(1));
  });

  test("every draw lies in [0, 1)", () => {
    for (const seed of [0, 1, -1, 12345, 0x7fffffff, 0xffffffff]) {
      const rng = mulberry32(seed);
      for (let i = 0; i < 5000; i++) {
        const x = rng();
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(1);
      }
    }
  });

  test("the output is roughly uniform, so `floor(rng() * n)` is not skewed", () => {
    // Not a randomness proof — a smoke check that the mixing rounds are wired up at all. A generator
    // whose avalanche was broken (e.g. a dropped `Math.imul`) piles up in a handful of buckets.
    const draws = 100_000;
    const counts = new Array<number>(10).fill(0);
    const rng = mulberry32(20260726);
    for (let i = 0; i < draws; i++) {
      const bucket = Math.floor(rng() * 10);
      counts[bucket] = (counts[bucket] ?? 0) + 1;
    }
    // Each bucket within 1 percentage point of its expected tenth.
    for (const count of counts) {
      expect(count).toBeGreaterThan(draws / 10 - draws / 100);
      expect(count).toBeLessThan(draws / 10 + draws / 100);
    }
  });

  test("only the low 32 bits of the seed matter", () => {
    // Call sites derive seeds arithmetically (`seed * 31 + salt`, `nextSeed(...)`) and are allowed to
    // overflow or go negative rather than clamp, so this is a contract, not a curiosity.
    expect(draw(mulberry32(7), 8)).toEqual(draw(mulberry32(7 + 2 ** 32), 8));
    expect(draw(mulberry32(-1), 8)).toEqual(draw(mulberry32(0xffffffff), 8));
  });
});
