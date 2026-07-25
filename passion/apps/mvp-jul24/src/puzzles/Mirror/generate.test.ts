import { generateLevel } from "./generate";
import { cloneMirrors, isSolved, rotateMirror, traceBeam } from "./logic";

const SAMPLE_SEEDS = Array.from({ length: 60 }, (_, i) => i * 97 + 3);

describe("generateLevel", () => {
  test.each(SAMPLE_SEEDS)(
    "seed %i: starts unsolved and is solvable by rotating only mirror cells",
    (seed) => {
      const level = generateLevel(seed);

      expect(isSolved(level, level.mirrors)).toBe(false);

      // Every mirror the generator placed starts flipped from the solution
      // orientation by construction, so rotating each one once should be the
      // full solution — same convention as the old hand-authored levels.
      let mirrors = cloneMirrors(level.mirrors);
      for (let r = 0; r < level.size; r++) {
        for (let c = 0; c < level.size; c++) {
          if (level.mirrors[r]![c]) mirrors = rotateMirror(mirrors, r, c);
        }
      }
      const result = traceBeam(level.size, mirrors, level.emitter, level.target);
      expect(result.reachesTarget).toBe(true);
    },
  );

  test.each(SAMPLE_SEEDS)("seed %i: emitter and target cells never carry a mirror", (seed) => {
    const level = generateLevel(seed);
    expect(level.mirrors[level.emitter.row]![level.emitter.col]).toBeNull();
    expect(level.mirrors[level.target.row]![level.target.col]).toBeNull();
  });

  test.each(SAMPLE_SEEDS)("seed %i: emitter sits on an edge, facing inward", (seed) => {
    const level = generateLevel(seed);
    const { row, col, dir } = level.emitter;
    const size = level.size;
    const onEdge = row === 0 || row === size - 1 || col === 0 || col === size - 1;
    expect(onEdge).toBe(true);

    // A corner cell sits on two edges at once, so any one of the matching
    // inward directions is valid there.
    const inwardOptions = new Set<string>();
    if (row === 0) inwardOptions.add("S");
    if (row === size - 1) inwardOptions.add("N");
    if (col === 0) inwardOptions.add("E");
    if (col === size - 1) inwardOptions.add("W");
    expect(inwardOptions.has(dir)).toBe(true);
  });

  test.each(SAMPLE_SEEDS)("seed %i: emitter and target are distinct cells", (seed) => {
    const level = generateLevel(seed);
    expect(level.emitter.row === level.target.row && level.emitter.col === level.target.col).toBe(
      false,
    );
  });

  test("is deterministic: the same seed always produces the same level", () => {
    const a = generateLevel(12345);
    const b = generateLevel(12345);
    expect(a).toEqual(b);
  });

  test("different seeds produce different levels (at least across a sample)", () => {
    const levels = SAMPLE_SEEDS.slice(0, 20).map((seed) => generateLevel(seed));
    const serialized = levels.map((l) => JSON.stringify(l));
    const unique = new Set(serialized);
    // Not a strict guarantee for every possible seed pair, but with 20
    // varied seeds we should see meaningfully more than one distinct board.
    expect(unique.size).toBeGreaterThan(10);
  });
});
