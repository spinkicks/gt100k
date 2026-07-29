import { LITS_BANK } from "./bank";
import { checkLits } from "./logic";

describe("LITS_BANK", () => {
  test("has at least 6 puzzles", () => {
    expect(LITS_BANK.length).toBeGreaterThanOrEqual(6);
  });

  test.each(LITS_BANK.map((p) => [p.id, p] as const))(
    "%s: stored solution satisfies checkLits (valid LITS shading)",
    (_id, puzzle) => {
      const result = checkLits(puzzle.solution, puzzle);
      expect(result.violations).toEqual([]);
      expect(result.solved).toBe(true);
    },
  );

  test("every puzzle id is unique", () => {
    const ids = LITS_BANK.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
