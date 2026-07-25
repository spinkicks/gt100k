import { SPORTS_PUZZLE, emptyMarks, isSolved, key } from "./logic";

test("empty marks not solved", () => {
  expect(isSolved(emptyMarks(SPORTS_PUZZLE), SPORTS_PUZZLE)).toBe(false);
});

test("exact solution marks solve it", () => {
  const p = SPORTS_PUZZLE;
  const m = emptyMarks(p);
  for (const e of p.entities) {
    for (const v of p.categories[0]!.values) {
      m[key(e, p.categories[0]!.name, v)] =
        p.solution[e]![p.categories[0]!.name] === v ? "yes" : "no";
    }
  }
  expect(isSolved(m, p)).toBe(true);
});
