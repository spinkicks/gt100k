import { gadgetById, gadgetsForTopic } from "./registry";

/** The roster, in full. Four, not the original seven — see the block comment in registry.ts. */
const LOGIC_GAMES_IDS = ["nonogram", "mirror", "chess", "pipes"];

/**
 * Dropped from the roster on 2026-07-25, NOT deleted from the app. Each still has its component,
 * logic, generator/bank, data and test suite in `src/puzzles/`, all passing. This list is the
 * assertion that the trim was a registry change and nothing more.
 */
const TRIMMED_IDS = ["logic-grid", "minesweeper", "lits"];

test('gadgetsForTopic("logic-games") returns exactly the four roster gadgets', () => {
  const gadgets = gadgetsForTopic("logic-games");
  expect(gadgets.map((g) => g.id)).toEqual(LOGIC_GAMES_IDS);
  expect(gadgets.every((g) => g.topic === "logic-games")).toBe(true);
});

test("every logic-games gadget is active with a Puzzle component", () => {
  const gadgets = gadgetsForTopic("logic-games");
  expect(gadgets).toHaveLength(LOGIC_GAMES_IDS.length);
  for (const gadget of gadgets) {
    expect(gadget.status, gadget.id).toBe("active");
    expect(gadget.Puzzle, gadget.id).toBeDefined();
  }
});

// Guards the trim in the direction it can silently reverse: someone re-adds an entry without
// authoring the backdrop prop it needs, and quads.data.test.ts starts failing a file away from the
// change that caused it. Re-adding one deliberately means editing this list too (see registry.ts,
// "TO RE-ADD ONE").
test("the trimmed puzzles are absent from every topic, in the registry only", () => {
  for (const id of TRIMMED_IDS) {
    expect(gadgetById(id), id).toBeUndefined();
  }
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
