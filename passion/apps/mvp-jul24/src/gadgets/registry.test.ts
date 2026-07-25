import { gadgetById, gadgetsForTopic } from "./registry";

const NEWLY_ACTIVE_IDS = ["mirror", "chess", "minesweeper", "pipes", "lits"];

test('gadgetsForTopic("logic-games") returns all 7 deduction gadgets', () => {
  const gadgets = gadgetsForTopic("logic-games");
  expect(gadgets).toHaveLength(7);
  expect(gadgets.every((g) => g.topic === "logic-games")).toBe(true);
});

test("nonogram and logic-grid are active with a Puzzle component", () => {
  const gadgets = gadgetsForTopic("logic-games");
  for (const id of ["nonogram", "logic-grid"]) {
    const gadget = gadgets.find((g) => g.id === id);
    expect(gadget).toBeDefined();
    expect(gadget!.status).toBe("active");
    expect(gadget!.Puzzle).toBeDefined();
  }
});

test("the five formerly-coming-soon gadgets are now active with a Puzzle", () => {
  const gadgets = gadgetsForTopic("logic-games");
  for (const id of NEWLY_ACTIVE_IDS) {
    const gadget = gadgets.find((g) => g.id === id);
    expect(gadget).toBeDefined();
    expect(gadget!.status).toBe("active");
    expect(gadget!.Puzzle).toBeDefined();
  }
});

test("all seven logic-games gadgets are active with a Puzzle component", () => {
  const gadgets = gadgetsForTopic("logic-games");
  expect(gadgets.every((g) => g.status === "active" && g.Puzzle)).toBe(true);
});

// The seven puzzles moved out of `math` because none of them is actually mathematical (see the
// TopicId doc comment in src/game/types.ts). `math` is now reserved for a real maths cabin that
// hasn't been built, so an empty list is the correct answer, not a regression — this test exists so
// that if someone re-points a deduction puzzle back at `math` it fails loudly.
test('gadgetsForTopic("math") is empty until the real maths games ship', () => {
  expect(gadgetsForTopic("math")).toEqual([]);
});

test("gadgetById returns the matching gadget or undefined", () => {
  expect(gadgetById("nonogram")?.id).toBe("nonogram");
  expect(gadgetById("nope")).toBeUndefined();
});
