import { MAX_DIFFICULTY, PROBE_BUDGET, generateMachine, mulberry32 } from "./generate";
import {
  DOMAIN,
  applyRule,
  isIdentifiable,
  longestMisleadingPrefix,
  minimumDeterminingProbes,
  outputsOver,
  spaceOver,
} from "./logic";

const SEEDS = Array.from({ length: 30 }, (_unused, i) => i * 97 + 3);
const RUNGS = Array.from({ length: MAX_DIFFICULTY + 1 }, (_unused, i) => i);
const CASES: Array<[number, number]> = SEEDS.flatMap((seed) =>
  RUNGS.map((rung): [number, number] => [seed, rung]),
);

describe("generateMachine", () => {
  test.each(CASES)(
    "seed %i rung %i: every input is safe to withhold — the answer is always forced",
    (seed, rung) => {
      // The correctness condition of the whole activity. If this fails, the
      // game can tell a child who reasoned perfectly that they are wrong.
      const machine = generateMachine(seed, rung);
      const table = spaceOver(machine.domain);
      expect(isIdentifiable(machine.rule, machine.domain, table)).toBe(true);

      // Spelled out rather than delegated, for every input the machine could
      // hold back: any rival that fits all the other observations predicts
      // the same value here.
      const mine = outputsOver(machine.rule, machine.domain);
      for (let held = 0; held < machine.domain.length; held++) {
        for (const row of table.outputs) {
          if (mine.every((v, i) => i === held || row[i] === v)) {
            expect(row[held]).toBe(mine[held]);
          }
        }
      }
    },
  );

  test.each(CASES)(
    "seed %i rung %i: winnable inside the allowance, and never a trap for probing in order",
    (seed, rung) => {
      const machine = generateMachine(seed, rung);
      const table = spaceOver(machine.domain);

      // Some choice of probes within the allowance pins the rule down, so
      // spending the budget well is always enough.
      expect(machine.minimumProbes).toBeLessThanOrEqual(PROBE_BUDGET - 1);
      expect(minimumDeterminingProbes(machine.rule, machine.domain, table, PROBE_BUDGET - 1)).toBe(
        machine.minimumProbes,
      );

      // And no rival can impersonate the rule across the opening stretch of
      // the pad, so a child probing left to right is never confidently misled.
      expect(longestMisleadingPrefix(machine.rule, machine.domain, table)).toBeLessThanOrEqual(4);
    },
  );

  test.each(CASES)("seed %i rung %i: withholds every input exactly once", (seed, rung) => {
    const machine = generateMachine(seed, rung);
    expect(machine.domain).toEqual([...DOMAIN]);
    expect([...machine.heldOutOrder].sort((a, b) => a - b)).toEqual([...DOMAIN]);
    expect(machine.probeBudget).toBe(PROBE_BUDGET);
    // The allowance must leave inputs unexamined, or choosing which to run
    // would not be a choice.
    expect(machine.probeBudget).toBeLessThan(machine.domain.length);
  });

  test.each(RUNGS)(
    "rung %i: difficulty is the kind of rule, not the size of the numbers",
    (rung) => {
      const expected: Record<number, string[]> = {
        0: ["linear"],
        1: ["square", "quadratic"],
        2: ["modular", "alternating"],
      };
      const families = new Set(SEEDS.map((s) => generateMachine(s, rung).rule.family));
      for (const family of families) expect(expected[rung]).toContain(family);
    },
  );

  test("the rungs really do differ: each draws from its own families", () => {
    const familiesAt = (rung: number) =>
      new Set(SEEDS.map((s) => generateMachine(s, rung).rule.family));
    const zero = familiesAt(0);
    const two = familiesAt(2);
    expect([...zero].some((f) => two.has(f))).toBe(false);
  });

  test("is deterministic: the same seed and rung always produce the same machine", () => {
    expect(generateMachine(4242, 1)).toEqual(generateMachine(4242, 1));
    expect(generateMachine(4242, 0)).not.toEqual(generateMachine(4242, 1));
  });

  test("different seeds produce different machines (across a sample)", () => {
    const rules = SEEDS.map((s) => JSON.stringify(generateMachine(s, 2).rule));
    expect(new Set(rules).size).toBeGreaterThan(10);
  });

  test("clamps a difficulty outside the supported range instead of throwing", () => {
    expect(generateMachine(8, -5)).toEqual(generateMachine(8, 0));
    expect(generateMachine(8, 99)).toEqual(generateMachine(8, MAX_DIFFICULTY));
  });

  test("the rule actually varies across the domain — no constant machines", () => {
    for (const [seed, rung] of CASES) {
      const machine = generateMachine(seed, rung);
      const outputs = machine.domain.map((x) => applyRule(machine.rule, x));
      expect(new Set(outputs).size).toBeGreaterThan(1);
    }
  });
});

test("mulberry32 is a deterministic seeded generator", () => {
  const draw = (seed: number) => {
    const rng = mulberry32(seed);
    return Array.from({ length: 5 }, () => rng());
  };
  expect(draw(42)).toEqual(draw(42));
  expect(draw(1)).not.toEqual(draw(2));
});
