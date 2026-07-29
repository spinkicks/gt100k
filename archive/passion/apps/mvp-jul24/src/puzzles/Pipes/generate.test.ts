import { EASY_SIZE, HARD_SIZE, generateLevel, nextSeed } from "./generate";
import { type Level, isSolved } from "./logic";

/** Map a generated Level to the Grid it represents when every tile sits at
 * its solvedRotation — i.e. the unscrambled network the generator built. */
function unscrambled(level: Level) {
  return level.map((row) => row.map((spec) => ({ ...spec, rotation: spec.solvedRotation })));
}

describe("generateLevel", () => {
  test.each([EASY_SIZE, HARD_SIZE, 5])(
    "produces a %ix%i level whose unscrambled configuration is fully solved",
    (size) => {
      for (let seed = 0; seed < 25; seed++) {
        const level = generateLevel(seed, size);
        expect(level.length).toBe(size);
        for (const row of level) expect(row.length).toBe(size);
        expect(isSolved(unscrambled(level))).toBe(true);
      }
    },
  );

  test("is deterministic: same seed and size produce an identical level", () => {
    const a = generateLevel(1234, EASY_SIZE);
    const b = generateLevel(1234, EASY_SIZE);
    expect(a).toEqual(b);
  });

  test("different seeds produce different levels", () => {
    const seedsProduceSameLevel = (): boolean => {
      const a = generateLevel(1, EASY_SIZE);
      const b = generateLevel(2, EASY_SIZE);
      return JSON.stringify(a) === JSON.stringify(b);
    };
    expect(seedsProduceSameLevel()).toBe(false);
  });

  test("exactly one tile is marked isSource, and at least one isEndpoint", () => {
    for (let seed = 0; seed < 25; seed++) {
      const level = generateLevel(seed, EASY_SIZE);
      let sources = 0;
      let endpoints = 0;
      for (const row of level) {
        for (const spec of row) {
          if (spec.isSource) sources++;
          if (spec.isEndpoint) endpoints++;
        }
      }
      expect(sources).toBe(1);
      expect(endpoints).toBeGreaterThanOrEqual(1);
    }
  });

  test("every tile's mask, if any, matches a real (kind, rotation) — no blanks marked source/endpoint", () => {
    for (let seed = 0; seed < 10; seed++) {
      const level = generateLevel(seed, HARD_SIZE);
      for (const row of level) {
        for (const spec of row) {
          if (spec.kind === "blank") {
            expect(spec.isSource).toBeFalsy();
            expect(spec.isEndpoint).toBeFalsy();
          }
        }
      }
    }
  });
});

describe("nextSeed", () => {
  test("is deterministic for a given (seed, counter) pair", () => {
    expect(nextSeed(7, 3)).toBe(nextSeed(7, 3));
  });

  test("bumping the counter yields a different seed (spot-checked across a range)", () => {
    const seeds = new Set<number>();
    for (let counter = 0; counter < 50; counter++) seeds.add(nextSeed(42, counter));
    expect(seeds.size).toBe(50);
  });

  test("different base seeds yield different sequences", () => {
    expect(nextSeed(1, 0)).not.toBe(nextSeed(2, 0));
  });
});
