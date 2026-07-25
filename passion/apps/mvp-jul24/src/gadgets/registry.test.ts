import { gadgetById, gadgetsForTopic } from "./registry";

const NEWLY_ACTIVE_IDS = ["mirror", "chess", "minesweeper", "pipes", "lits"];

test('gadgetsForTopic("math") returns all 7 math gadgets', () => {
  const gadgets = gadgetsForTopic("math");
  expect(gadgets).toHaveLength(7);
  expect(gadgets.every((g) => g.topic === "math")).toBe(true);
});

test("nonogram and logic-grid are active with a Puzzle component", () => {
  const gadgets = gadgetsForTopic("math");
  for (const id of ["nonogram", "logic-grid"]) {
    const gadget = gadgets.find((g) => g.id === id);
    expect(gadget).toBeDefined();
    expect(gadget!.status).toBe("active");
    expect(gadget!.Puzzle).toBeDefined();
  }
});

test("the five formerly-coming-soon gadgets are now active with a Puzzle", () => {
  const gadgets = gadgetsForTopic("math");
  for (const id of NEWLY_ACTIVE_IDS) {
    const gadget = gadgets.find((g) => g.id === id);
    expect(gadget).toBeDefined();
    expect(gadget!.status).toBe("active");
    expect(gadget!.Puzzle).toBeDefined();
  }
});

test("all seven math gadgets are active with a Puzzle component", () => {
  const gadgets = gadgetsForTopic("math");
  expect(gadgets.every((g) => g.status === "active" && g.Puzzle)).toBe(true);
});

test("gadgetById returns the matching gadget or undefined", () => {
  expect(gadgetById("nonogram")?.id).toBe("nonogram");
  expect(gadgetById("nope")).toBeUndefined();
});
