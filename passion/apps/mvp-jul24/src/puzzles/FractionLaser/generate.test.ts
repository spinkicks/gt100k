import { MAX_DIFFICULTY, generateLevel, solutionFor } from "./generate";
import {
  ONE,
  addF,
  cellKey,
  eqF,
  findSolutions,
  initialDials,
  isSolved,
  requiredTotal,
  traceBeams,
} from "./logic";

const SEEDS = Array.from({ length: 40 }, (_, i) => i * 97 + 3);
const RUNGS = Array.from({ length: MAX_DIFFICULTY + 1 }, (_, i) => i);
const CASES: Array<[number, number]> = SEEDS.flatMap((seed) =>
  RUNGS.map((rung): [number, number] => [seed, rung]),
);

describe("generateLevel", () => {
  test.each(CASES)("seed %i rung %i: the crystals ask for exactly one whole beam", (seed, rung) => {
    const level = generateLevel(seed, rung);
    expect(requiredTotal(level)).toEqual(ONE);
    // …and the total is reached by exact rational addition, not by rounding.
    const sum = level.collectors.reduce((acc, c) => addF(acc, c.required), {
      n: 0,
      d: 1,
    });
    expect(eqF(sum, ONE)).toBe(true);
  });

  test.each(CASES)("seed %i rung %i: starts unsolved and has exactly one answer", (seed, rung) => {
    const level = generateLevel(seed, rung);
    expect(isSolved(level, initialDials(level))).toBe(false);
    expect(findSolutions(level, 3)).toHaveLength(1);
    expect(isSolved(level, solutionFor(level))).toBe(true);
  });

  test.each(CASES)(
    "seed %i rung %i: under the answer, every crystal gets its exact share",
    (seed, rung) => {
      const level = generateLevel(seed, rung);
      const { delivered } = traceBeams(level, solutionFor(level));
      for (const c of level.collectors) {
        expect(delivered.get(cellKey(c))).toEqual(c.required);
      }
      // Nothing spills off the grid: everything emitted lands in a crystal.
      const landed = [...delivered.values()].reduce((acc, v) => addF(acc, v), { n: 0, d: 1 });
      expect(landed).toEqual(ONE);
    },
  );

  test.each(CASES)(
    "seed %i rung %i: every prism conserves — its two parts add back to what arrived",
    (seed, rung) => {
      const level = generateLevel(seed, rung);
      for (const dials of [initialDials(level), solutionFor(level)]) {
        const { flows } = traceBeams(level, dials);
        expect(flows.size).toBe(level.splitters.length);
        for (const flow of flows.values()) {
          expect(eqF(addF(flow.straight, flow.branch), flow.incoming)).toBe(true);
        }
      }
    },
  );

  test.each(CASES)(
    "seed %i rung %i: every prism and crystal sits on its own cell, clear of the emitter",
    (seed, rung) => {
      const level = generateLevel(seed, rung);
      const cells = [...level.splitters, ...level.collectors].map(cellKey);
      expect(new Set(cells).size).toBe(cells.length);
      expect(cells).not.toContain(cellKey(level.emitter));
      for (const p of [...level.splitters, ...level.collectors]) {
        expect(p.row).toBeGreaterThanOrEqual(0);
        expect(p.row).toBeLessThan(level.size);
        expect(p.col).toBeGreaterThanOrEqual(0);
        expect(p.col).toBeLessThan(level.size);
      }
    },
  );

  test.each(CASES)("seed %i rung %i: the emitter sits on an edge, facing inward", (seed, rung) => {
    const { emitter, size } = generateLevel(seed, rung);
    const inward = new Set<string>();
    if (emitter.row === 0) inward.add("S");
    if (emitter.row === size - 1) inward.add("N");
    if (emitter.col === 0) inward.add("E");
    if (emitter.col === size - 1) inward.add("W");
    expect(inward.size).toBeGreaterThan(0);
    expect(inward.has(emitter.dir)).toBe(true);
  });

  test.each(CASES)(
    "seed %i rung %i: every dial opens off the answer, and holds it exactly once",
    (seed, rung) => {
      const level = generateLevel(seed, rung);
      const answer = solutionFor(level);
      level.splitters.forEach((s, i) => {
        expect(s.options.length).toBeGreaterThanOrEqual(2);
        expect(s.start).not.toBe(answer[i]);
        // No duplicate dial positions — otherwise two settings would tie.
        const texts = s.options.map((o) => `${o.n}/${o.d}`);
        expect(new Set(texts).size).toBe(texts.length);
        // Every option is a real part of a whole: strictly between 0 and 1.
        for (const o of s.options) {
          expect(o.n).toBeGreaterThan(0);
          expect(o.n).toBeLessThan(o.d);
        }
      });
    },
  );

  test.each(RUNGS)("rung %i: difficulty adds prisms and keeps the numbers legible", (rung) => {
    const caps = [12, 24, 45];
    for (const seed of SEEDS.slice(0, 12)) {
      const level = generateLevel(seed, rung);
      expect(level.splitters).toHaveLength(2 + rung);
      // Every prism splits into two beams, so a tree with k prisms ends in
      // exactly k + 1 crystals.
      expect(level.collectors).toHaveLength(3 + rung);
      for (const c of level.collectors) {
        expect(c.required.d).toBeLessThanOrEqual(caps[rung]!);
      }
    }
  });

  test("harder rungs really are harder: deeper products, bigger denominators", () => {
    const worst = (rung: number) =>
      Math.max(
        ...SEEDS.slice(0, 20).flatMap((s) =>
          generateLevel(s, rung).collectors.map((c) => c.required.d),
        ),
      );
    expect(worst(2)).toBeGreaterThan(worst(0));
  });

  test("is deterministic: the same seed and rung always produce the same level", () => {
    expect(generateLevel(12345, 1)).toEqual(generateLevel(12345, 1));
    expect(generateLevel(12345, 0)).not.toEqual(generateLevel(12345, 1));
  });

  test("different seeds produce different levels (across a sample)", () => {
    const boards = SEEDS.slice(0, 20).map((s) => JSON.stringify(generateLevel(s, 1)));
    expect(new Set(boards).size).toBeGreaterThan(15);
  });

  test("clamps a difficulty outside the supported range instead of throwing", () => {
    expect(generateLevel(7, -3)).toEqual(generateLevel(7, 0));
    expect(generateLevel(7, 99)).toEqual(generateLevel(7, MAX_DIFFICULTY));
  });
});

describe("solutionFor", () => {
  test("throws rather than guess when a level does not have exactly one answer", () => {
    const level = generateLevel(11, 0);
    const ambiguous = {
      ...level,
      // Give one prism a duplicate dial position: now two settings tie.
      splitters: level.splitters.map((s, i) =>
        i === 0 ? { ...s, options: [...s.options, { ...s.options[0]! }] } : s,
      ),
    };
    expect(() => solutionFor(ambiguous)).toThrow(/exactly 1 solution/);
  });
});

// The PRNG this generator draws from is shared and tested in src/lib/rng.test.ts, which pins its
// stream against a frozen sequence — a stronger guarantee than the per-generator determinism check
// that used to sit here.
