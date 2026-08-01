import {
  type GetValue,
  buildPuzzleData,
  countSolutions,
  generatePuzzle,
  nextSeed,
  solve,
} from "./generate";

describe("generatePuzzle / buildPuzzleData", () => {
  test.each(["easy", "hard"] as const)(
    "produces a %s puzzle whose clue set pins exactly one solution, for many seeds",
    (difficulty) => {
      for (let seed = 0; seed < 40; seed++) {
        const data = buildPuzzleData(seed, difficulty);
        const structure = { entities: data.entities, categories: data.categories };
        expect(countSolutions(data.clueSpecs, structure)).toBe(1);
        expect(solve(data.clueSpecs, structure)).toBe(1);
      }
    },
  );

  test.each(["easy", "hard"] as const)(
    "the stated solution satisfies every one of its clues (%s)",
    (difficulty) => {
      for (let seed = 0; seed < 40; seed++) {
        const data = buildPuzzleData(seed, difficulty);
        const getValue: GetValue = (entity, categoryName) => data.solution[entity]![categoryName]!;
        for (const clue of data.clueSpecs) {
          expect(clue.test(getValue)).toBe(true);
        }
      }
    },
  );

  test("shape: N=4 entities; easy has 3 categories, hard has 4, each with 4 distinct values", () => {
    for (let seed = 0; seed < 20; seed++) {
      const easy = generatePuzzle(seed, "easy");
      expect(easy.entities).toHaveLength(4);
      expect(new Set(easy.entities).size).toBe(4);
      expect(easy.categories).toHaveLength(3);
      for (const cat of easy.categories) {
        expect(cat.values).toHaveLength(4);
        expect(new Set(cat.values).size).toBe(4);
      }

      const hard = generatePuzzle(seed, "hard");
      expect(hard.categories).toHaveLength(4);
      for (const cat of hard.categories) {
        expect(new Set(cat.values).size).toBe(4);
      }
    }
  });

  test("solution assigns every entity exactly one distinct value per category", () => {
    for (let seed = 0; seed < 20; seed++) {
      const p = generatePuzzle(seed, "easy");
      for (const cat of p.categories) {
        const assigned = p.entities.map((e) => p.solution[e]![cat.name]!);
        expect(new Set(assigned).size).toBe(p.entities.length);
        for (const v of assigned) expect(cat.values).toContain(v);
      }
    }
  });

  test("is deterministic: same seed and difficulty produce an identical puzzle", () => {
    const a = generatePuzzle(1234, "easy");
    const b = generatePuzzle(1234, "easy");
    expect(a).toEqual(b);
  });

  test("different seeds produce different puzzles", () => {
    const a = generatePuzzle(1, "easy");
    const b = generatePuzzle(2, "easy");
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b));
  });

  test("dropping any single remaining clue would make the solution ambiguous (minimality)", () => {
    for (let seed = 0; seed < 15; seed++) {
      const data = buildPuzzleData(seed, "easy");
      const structure = { entities: data.entities, categories: data.categories };
      for (let i = 0; i < data.clueSpecs.length; i++) {
        const without = data.clueSpecs.filter((_, idx) => idx !== i);
        expect(countSolutions(without, structure)).not.toBe(1);
      }
    }
  });
});

describe("countSolutions / solve", () => {
  test("an empty clue set has more than one solution (ambiguous)", () => {
    const data = buildPuzzleData(0, "easy");
    const structure = { entities: data.entities, categories: data.categories };
    expect(countSolutions([], structure, 2)).toBe(2);
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
