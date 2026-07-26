import {
  type RatioPuzzle,
  canPour,
  currentRatio,
  emptyBatch,
  isSolved,
  isStuck,
  jarState,
  ladleSize,
  ladlesPoured,
  pour,
  reduceRatio,
  requiredDye,
  requiredWater,
  targetParts,
} from "./logic";

/**
 * Hand-built bench. Three vats, each with a 4-unit ladle, and a 24-unit jar wanted at
 * 2 parts dye : 1 part water. Because every ladle is the same size, any six ladles fill the jar
 * exactly — so this fixture is all trap and no volume help, which makes it a clean place to check
 * that "full" and "right" are separate questions.
 */
const bench: RatioPuzzle = {
  vats: [
    { id: "a", label: "Vat A", dye: 1, water: 3, stock: 4 },
    { id: "b", label: "Vat B", dye: 3, water: 1, stock: 4 },
    { id: "c", label: "Vat C", dye: 4, water: 0, stock: 3 },
  ],
  capacity: 24,
  targetDye: 2,
  targetWater: 1,
  solution: [2, 2, 2],
};

test("ladleSize is the whole packet a vat pours", () => {
  expect(bench.vats.map(ladleSize)).toEqual([4, 4, 4]);
});

test("the order card has to be scaled up to the jar", () => {
  expect(targetParts(bench)).toBe(3);
  // 24 units / 3 parts = 8 units per part -> 16 dye and 8 water. This is the proportional step,
  // and the bench deliberately never shows these two numbers to the player.
  expect(requiredDye(bench)).toBe(16);
  expect(requiredWater(bench)).toBe(8);
});

test("jarState adds up whole ladles only", () => {
  expect(jarState(bench, [2, 2, 2])).toEqual({ units: 24, dye: 16, water: 8 });
  expect(jarState(bench, [0, 0, 0])).toEqual({ units: 0, dye: 0, water: 0 });
});

test("the solution is exactly full and exactly on ratio", () => {
  expect(isSolved(bench, bench.solution)).toBe(true);
});

test("a full jar at the wrong ratio is not solved", () => {
  // Same six ladles, same 24 units, different mix.
  expect(jarState(bench, [3, 2, 1]).units).toBe(24);
  expect(isSolved(bench, [3, 2, 1])).toBe(false);
  expect(jarState(bench, [1, 2, 3]).units).toBe(24);
  expect(isSolved(bench, [1, 2, 3])).toBe(false);
});

test("a jar on the right ratio but not full is not solved", () => {
  expect(currentRatio(bench, [1, 1, 1])).toEqual([2, 1]);
  expect(jarState(bench, [1, 1, 1]).units).toBe(12);
  expect(isSolved(bench, [1, 1, 1])).toBe(false);
});

describe("pouring", () => {
  test("a ladle that would overflow the jar cannot be poured", () => {
    expect(canPour(bench, [2, 2, 1], 0)).toBe(true); // 20 units, one more fits exactly
    for (let i = 0; i < bench.vats.length; i++) {
      expect(canPour(bench, [2, 2, 2], i)).toBe(false); // brim-full: nothing fits
    }
  });

  test("a vat with no stock left cannot be poured", () => {
    expect(canPour(bench, [4, 0, 0], 0)).toBe(false);
    expect(canPour(bench, [4, 0, 0], 1)).toBe(true);
  });

  test("pour is a no-op when the pour is not allowed, and never mutates the batch", () => {
    const batch = [4, 0, 0];
    expect(pour(bench, batch, 0)).toBe(batch);
    expect(pour(bench, batch, 1)).toEqual([4, 1, 0]);
    expect(batch).toEqual([4, 0, 0]);
  });

  test("there is no undo — the only way back is a fresh batch", () => {
    const api = Object.keys({ canPour, pour, emptyBatch, isSolved, isStuck, jarState });
    expect(api.some((name) => /undo|remove|unpour|takeback/i.test(name))).toBe(false);
    expect(emptyBatch(bench)).toEqual([0, 0, 0]);
  });
});

describe("dead ends", () => {
  test("a full-but-wrong jar is stuck: nothing fits and nothing is right", () => {
    expect(isStuck(bench, [3, 2, 1])).toBe(true);
  });

  test("an empty jar is never stuck", () => {
    expect(isStuck(bench, emptyBatch(bench))).toBe(false);
  });

  test("a jar can also be stuck part-full, with every vat drained", () => {
    const smallBench: RatioPuzzle = {
      vats: [
        { id: "a", label: "A", dye: 0, water: 2, stock: 1 },
        { id: "b", label: "B", dye: 2, water: 0, stock: 1 },
      ],
      capacity: 10,
      targetDye: 1,
      targetWater: 1,
      solution: [1, 1],
    };
    expect(isStuck(smallBench, [1, 1])).toBe(true); // 4 of 10 units, both vats empty
  });

  test("a solved jar is never reported as stuck", () => {
    expect(isSolved(bench, bench.solution)).toBe(true);
    expect(isStuck(bench, bench.solution)).toBe(false);
  });
});

describe("ratios", () => {
  test("reduceRatio puts a pair in lowest terms", () => {
    expect(reduceRatio(16, 8)).toEqual([2, 1]);
    expect(reduceRatio(7, 0)).toEqual([1, 0]);
    expect(reduceRatio(0, 0)).toEqual([0, 0]);
  });

  test("currentRatio is null for an empty jar and reduced otherwise", () => {
    expect(currentRatio(bench, [0, 0, 0])).toBeNull();
    expect(currentRatio(bench, [1, 0, 0])).toEqual([1, 3]);
  });
});

test("ladlesPoured counts clicks, not units", () => {
  expect(ladlesPoured([2, 2, 2])).toBe(6);
  expect(ladlesPoured([0, 0, 0])).toBe(0);
});
